// QA simulation runner: drives complete jobs through the real API on the QA
// database and checks the books after every job.
//
//   DATABASE_URL=postgresql://…/steelwise_qa  (server running against it)
//   node qa/sim/run.mjs --base http://localhost:3011 --seed 1001 --jobs 50 --out qa/results/cycle-1.json
//
// Each scenario records every API step with the status the business rules
// require. A step "fails" when the API answers differently, and an invariant
// "fails" when the database no longer adds up. Nothing here edits data behind
// the API's back except reading it for checks.
import fs from 'node:fs';
import path from 'node:path';
import { api, prismaClient, rng } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const BASE = args.base || 'http://localhost:3011';
const SEED = Number(args.seed || 1001);
const JOBS = Number(args.jobs || 50);
const OUT = args.out || `qa/results/run-${SEED}.json`;

const prisma = prismaClient();
const A = api(BASE);
const R = rng(SEED);
const num = (v) => (v == null ? 0 : Number(v));
const ok2xx = (s) => s >= 200 && s < 300;

// ── Scenario mix (directive §7, adapted to what the app supports) ──
const MIX = [
  ['standard-metals', 5], ['entry-screen', 2], ['multi-step-metals', 5], ['plastics', 6], ['pos-ecommerce', 5],
  ['multi-location', 6], ['transfers-receiving', 5], ['rush-backorder-exception', 5],
  ['partial-rework-return', 5], ['mixed-division', 4], ['quick-sale', 1], ['quote-to-order', 1],
];

let ctx;
async function loadContext() {
  const locs = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' } }, include: { workCenters: true } }).catch(async () => {
    const l = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' } } });
    const wcs = await prisma.workCenter.findMany({ where: { code: { startsWith: 'QA-L' } } });
    return l.map((x) => ({ ...x, workCenters: wcs.filter((w) => w.locationId === x.id) }));
  });
  const customers = await prisma.organization.findMany({ where: { code: { startsWith: 'QA-C' } }, orderBy: { code: 'asc' } });
  const products = await prisma.product.findMany({ where: { isActive: true }, include: { grade: true } });
  return { locs, customers, products, admin: await prisma.user.findUnique({ where: { email: 'qa-admin@qa.test' } }), csr: await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } }) };
}

async function stockAt(locId, { plastics = false, minAvail = 500 } = {}) {
  const inv = await prisma.inventory.findMany({
    where: { locationId: locId, qtyAvailable: { gte: minAvail } },
    include: { coil: { include: { grade: true } } },
  });
  const isPl = (i) => ['HDPE', 'UHMW'].includes(i.coil.grade.code);
  return inv.filter((i) => (plastics ? isPl(i) : !isPl(i)));
}
const wcOf = (loc, types) => loc.workCenters.filter((w) => types.includes(w.type));
const locKind = (loc) => (loc.name.match(/\((\w+)\)/) || [])[1];

// ── Recording ──
function newScenario(id, category) {
  return { id, category, steps: [], invariants: [], result: 'PASS', notes: [] };
}
async function step(sc, name, fn, expect = '2xx') {
  let res;
  try { res = await fn(); } catch (e) { res = { status: 0, body: { error: e.message } }; }
  const want = expect === '2xx' ? ok2xx(res.status) : expect === '4xx' ? res.status >= 400 && res.status < 500 : res.status === expect;
  sc.steps.push({ name, expect, status: res.status, ok: want, ...(want ? {} : { body: JSON.stringify(res.body).slice(0, 300) }) });
  if (!want) sc.result = 'FAIL';
  return res;
}
function check(sc, name, cond, detail) {
  sc.invariants.push({ name, ok: !!cond, ...(cond ? {} : { detail }) });
  if (!cond) sc.result = 'FAIL';
}

// ── Building blocks ──
const productFor = (plastic) => ctx.products.filter((p) => (plastic ? p.division === 'PLASTICS' : p.division === 'METALS' && p.form !== 'SUPPLY'));
function lineFor(stock, qty, price = 0.65) {
  const plastic = ['HDPE', 'UHMW'].includes(stock.coil.grade.code);
  const prod = R.pick(productFor(plastic));
  return {
    productId: prod?.id, gradeId: stock.coil.gradeId, description: `${stock.coil.grade.code} ${stock.coil.form} cut to size`,
    thicknessIn: 0.25, widthIn: 24 + R.int(0, 24), lengthIn: 48 + R.int(0, 96),
    qtyOrdered: qty, unit: 'LB', unitPrice: price, priceUnit: 'LB', extendedPrice: +(qty * price).toFixed(2),
  };
}
async function createOrder(sc, customer, lines, extra = {}) {
  const subtotal = +lines.reduce((s, l) => s + l.extendedPrice, 0).toFixed(2);
  const taxed = R.int(0, 2) > 0;
  const taxAmount = taxed ? +(subtotal * 0.0825).toFixed(2) : 0;
  const freightAmount = taxed && R.int(0, 1) ? 85 + R.int(0, 20) * 5 : 0;
  const r = await step(sc, 'create sales order', () => A.post('/api/orders', {
    orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal, taxAmount, freightAmount, totalAmount: +(subtotal + taxAmount + freightAmount).toFixed(2),
    paymentTerms: R.pick(['NET 30', 'NET 15', 'COD', null]), poReference: `QA-${sc.id}`, lines, ...extra,
  }, 'csr')); // sales enters the order, so it belongs to a branch
  return r.body?.id ? r.body : null;
}
async function confirm(sc, order) { return step(sc, 'confirm order', () => A.put(`/api/orders/${order.id}`, { status: 'CONFIRMED' })); }
async function allocate(sc, order, line, stock, qty, expect = '2xx') {
  return step(sc, `allocate ${qty} lb from ${stock.coil.coilNumber}`, () => A.post(`/api/orders/${order.id}/allocate`, { lineId: line.id, coilId: stock.coilId, qty }), expect);
}
async function createJob(sc, order, line, wc, priority = 3) {
  const r = await step(sc, `create job at ${wc.code}`, () => A.post('/api/jobs', { orderId: order.id, orderLineId: line.id, workCenterId: wc.id, operationType: wc.type, priority, instructions: `QA ${sc.id}` }));
  return r.body?.id ? r.body : null;
}
const FLOW = ['IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP'];
async function runJob(sc, job, flow = FLOW, who = 'operator') {
  for (const s of flow) await step(sc, `job ${job.jobNumber} → ${s}`, () => A.post(`/api/jobs/${job.id}/status`, { status: s }, who));
}
async function ship(sc, order, loc, items, expect = '2xx') {
  const r = await step(sc, `create shipment (${items.length} line(s))`, () => A.post('/api/shipments', {
    orderId: order.id, fromLocationId: loc.id, carrierName: R.pick(['Own Truck', 'XPO', 'Estes', 'Customer Pickup']),
    items: items.map(([line, qty]) => ({ orderLineId: line.id, qtyShipped: qty, weightLb: qty })),
  }, 'shipping'), expect);
  return r.body?.id ? r.body : null;
}
async function dispatchDeliver(sc, shp) {
  await step(sc, `dispatch ${shp.shipmentNumber}`, () => A.put(`/api/shipments/${shp.id}/dispatch`, {}, 'shipping'));
  await step(sc, `deliver ${shp.shipmentNumber}`, () => A.put(`/api/shipments/${shp.id}/deliver`, { podSignature: 'QA Receiver' }, 'shipping'));
}

// ── Books checks ──
async function checkOrderBooks(sc, orderId, { expectStatus, createdBy } = {}) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: { include: { allocations: true } }, shipments: { include: { items: true } } } });
  if (!o) return check(sc, 'order exists', false, orderId);
  const sumLines = o.lines.reduce((s, l) => s + num(l.extendedPrice), 0);
  check(sc, 'order subtotal = sum of line totals', Math.abs(num(o.subtotal) - sumLines) < 0.01, `subtotal ${num(o.subtotal)} vs lines ${sumLines.toFixed(2)}`);
  check(sc, 'order created by the signed-in user', [createdBy || ctx.admin.id, ctx.csr?.id].includes(o.createdById), `createdById ${o.createdById}`);
  for (const l of o.lines) {
    const shippedItems = o.shipments.filter((s) => ['IN_TRANSIT', 'DELIVERED'].includes(s.status)).flatMap((s) => s.items).filter((i) => i.orderLineId === l.id).reduce((s, i) => s + num(i.qtyShipped), 0);
    check(sc, `line ${l.lineNumber}: shipped qty matches dispatched shipments`, Math.abs(num(l.qtyShipped) - shippedItems) < 0.001, `line.qtyShipped ${num(l.qtyShipped)} vs shipments ${shippedItems}`);
    check(sc, `line ${l.lineNumber}: shipped ≤ ordered`, num(l.qtyShipped) <= num(l.qtyOrdered) + 0.001, `${num(l.qtyShipped)} > ${num(l.qtyOrdered)}`);
    const alloc = l.allocations.reduce((s, a) => s + num(a.qtyAllocated), 0);
    check(sc, `line ${l.lineNumber}: allocated ≤ ordered`, alloc <= num(l.qtyOrdered) + 0.001, `${alloc} > ${num(l.qtyOrdered)}`);
  }
  if (expectStatus) check(sc, `order status is ${expectStatus}`, o.status === expectStatus, `status ${o.status}`);
  return o;
}
const cents = (n) => Math.round(num(n) * 100);
/** Invoices for an order agree with what shipped, and with the order's own money. */
async function checkBilling(sc, orderId) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true, invoices: { include: { lines: true, payments: true } } } });
  const live = o.invoices.filter((i) => i.kind === 'INVOICE' && i.status !== 'CANCELLED');
  for (const l of o.lines) {
    const billed = live.flatMap((i) => i.lines).filter((il) => il.orderLineId === l.id).reduce((t, il) => t + num(il.quantity), 0);
    check(sc, `line ${l.lineNumber}: invoiced qty = shipped qty`, Math.abs(billed - num(l.qtyShipped)) < 0.001, `invoiced ${billed} vs shipped ${num(l.qtyShipped)}`);
  }
  for (const i of o.invoices) {
    check(sc, `${i.invoiceNumber}: total = subtotal + tax + freight`, cents(i.totalAmount) === cents(i.subtotal) + cents(i.taxAmount) + cents(i.freightAmount), `${num(i.totalAmount)}`);
    check(sc, `${i.invoiceNumber}: subtotal = its lines`, cents(i.subtotal) === i.lines.reduce((t, il) => t + cents(il.extendedPrice), 0), `${num(i.subtotal)}`);
    check(sc, `${i.invoiceNumber}: paid = its payments`, cents(i.paidAmount) === i.payments.reduce((t, x) => t + cents(x.amount), 0), `paid ${num(i.paidAmount)}`);
    check(sc, `${i.invoiceNumber}: never paid more than billed`, Math.abs(cents(i.paidAmount)) <= Math.abs(cents(i.totalAmount)), `paid ${num(i.paidAmount)} of ${num(i.totalAmount)}`);
  }
  if (o.status === 'COMPLETE' && o.lines.every((l) => l.lineStatus !== 'CANCELLED')) {
    const sum = (f) => live.reduce((t, i) => t + cents(i[f]), 0);
    check(sc, 'invoices add up to the order subtotal', Math.abs(sum('subtotal') - cents(o.subtotal)) <= live.length * o.lines.length, `invoices ${sum('subtotal') / 100} vs order ${num(o.subtotal)}`);
    check(sc, 'invoices add up to the order tax', sum('taxAmount') === cents(o.taxAmount), `invoices ${sum('taxAmount') / 100} vs order ${num(o.taxAmount)}`);
    check(sc, 'invoices add up to the order freight', sum('freightAmount') === cents(o.freightAmount), `invoices ${sum('freightAmount') / 100} vs order ${num(o.freightAmount)}`);
  }
  return o.invoices;
}
/** Pays an order's invoices: in full, in two parts, or leaves them open. Always tries one overpayment. */
async function payInvoices(sc, orderId) {
  const list = await step(sc, 'list invoices for the order', () => A.get(`/api/invoices?orderId=${orderId}`, 'csr'));
  for (const inv of list.body?.data || []) {
    if (inv.kind !== 'INVOICE' || inv.balance <= 0) continue;
    await step(sc, `overpay ${inv.invoiceNumber} is refused`, () => A.post(`/api/invoices/${inv.id}/payments`, { amount: +(inv.balance + 10).toFixed(2), paymentMethod: 'CHECK' }, 'csr'), '4xx');
    const how = R.int(0, 2);
    if (how === 0) continue;
    const first = how === 1 ? inv.balance : +(inv.balance / 2).toFixed(2);
    const r = await step(sc, `pay ${first} on ${inv.invoiceNumber}`, () => A.post(`/api/invoices/${inv.id}/payments`, { amount: first, paymentMethod: R.pick(['CHECK', 'ACH', 'CARD', 'CASH']), referenceNumber: `QA-${sc.id}` }, 'csr'));
    check(sc, `${inv.invoiceNumber}: status after payment`, r.body?.status === (how === 1 ? 'PAID' : 'PARTIAL'), `status ${r.body?.status}`);
    if (how === 2) {
      const rest = +(inv.balance - first).toFixed(2);
      const r2 = await step(sc, `pay the rest of ${inv.invoiceNumber}`, () => A.post(`/api/invoices/${inv.id}/payments`, { amount: rest, paymentMethod: 'CHECK' }, 'csr'));
      check(sc, `${inv.invoiceNumber}: paid in full`, r2.body?.status === 'PAID' && r2.body?.balance === 0, `status ${r2.body?.status} balance ${r2.body?.balance}`);
      await step(sc, `paying a paid invoice is refused`, () => A.post(`/api/invoices/${inv.id}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'csr'), '4xx');
    }
  }
}

async function checkInventory(sc, coilIds) {
  const inv = await prisma.inventory.findMany({ where: { coilId: { in: coilIds } }, include: { coil: true } });
  for (const i of inv) {
    const [h, a, al, ho] = [num(i.qtyOnHand), num(i.qtyAvailable), num(i.qtyAllocated), num(i.qtyOnHold)];
    check(sc, `${i.coil.coilNumber}: no negative quantities`, h >= -0.001 && a >= -0.001 && al >= -0.001, `onHand ${h} avail ${a} alloc ${al}`);
    check(sc, `${i.coil.coilNumber}: on hand = available + allocated + on hold`, Math.abs(h - (a + al + ho)) < 0.001, `${h} vs ${a}+${al}+${ho}`);
    const openAlloc = await prisma.orderLineAllocation.aggregate({ where: { coilId: i.coilId, orderLine: { lineStatus: { in: ['OPEN', 'PARTIAL'] }, order: { status: { notIn: ['CANCELLED'] } } } }, _sum: { qtyAllocated: true } });
    check(sc, `${i.coil.coilNumber}: inventory allocated = open allocations`, Math.abs(al - num(openAlloc._sum.qtyAllocated)) < 0.001, `inventory ${al} vs allocations ${num(openAlloc._sum.qtyAllocated)}`);
    check(sc, `${i.coil.coilNumber}: inventory branch = coil branch`, i.locationId === i.coil.locationId, `inventory ${i.locationId} coil ${i.coil.locationId}`);
  }
}

// ── Scenarios ──
const pickLoc = (kinds) => R.pick(ctx.locs.filter((l) => kinds.includes(locKind(l)) && l.workCenters.length));

async function standardFlow(sc, { plastics = false, multiStep = false, priority = 3, partial = false, kinds = ['METALS', 'MIXED'], mixed = false } = {}) {
  const loc = pickLoc(plastics ? ['PLASTICS', 'MIXED'] : mixed ? ['MIXED'] : kinds);
  const customer = R.pick(ctx.customers);
  const pools = mixed ? [await stockAt(loc.id), await stockAt(loc.id, { plastics: true })] : [await stockAt(loc.id, { plastics })];
  const stocks = pools.map((p) => R.pick(p)).filter(Boolean);
  if (!stocks.length) { sc.notes.push(`no stock at ${loc.code}`); sc.result = 'BLOCKED'; return; }
  const lines = stocks.map((s) => lineFor(s, Math.min(200 + R.int(0, 30) * 50, Math.floor(num(s.qtyAvailable) / 2))));
  const order = await createOrder(sc, customer, lines, { requiredDate: new Date(Date.now() + R.int(1, 14) * 864e5).toISOString() });
  if (!order) return;
  await confirm(sc, order);
  const ol = order.lines.sort((a, b) => a.lineNumber - b.lineNumber);
  for (let i = 0; i < ol.length; i++) await allocate(sc, order, ol[i], stocks[i], num(ol[i].qtyOrdered));
  for (let i = 0; i < ol.length; i++) {
    const pl = ['HDPE', 'UHMW'].includes(stocks[i].coil.grade.code);
    const types = pl ? ['ROUTER', 'CNC', 'PLASTIC_SAW'] : ['SAW', 'SHEAR', 'LASER', 'PLASMA', 'WATERJET'];
    const wcs = wcOf(loc, types);
    const route = multiStep ? wcs.slice(0, Math.min(3, wcs.length)) : [R.pick(wcs)];
    for (const wc of route.filter(Boolean)) { const j = await createJob(sc, order, ol[i], wc, priority); if (j) await runJob(sc, j); }
  }
  if (partial) {
    const first = await ship(sc, order, loc, ol.map((l) => [l, Math.floor(num(l.qtyOrdered) / 2)]));
    if (first) await dispatchDeliver(sc, first);
    await checkOrderBooks(sc, order.id, { expectStatus: 'PARTIAL' });
    const second = await ship(sc, order, loc, ol.map((l) => [l, num(l.qtyOrdered) - Math.floor(num(l.qtyOrdered) / 2)]));
    if (second) await dispatchDeliver(sc, second);
  } else {
    const s = await ship(sc, order, loc, ol.map((l) => [l, num(l.qtyOrdered)]));
    if (s) await dispatchDeliver(sc, s);
  }
  await checkOrderBooks(sc, order.id, { expectStatus: 'COMPLETE' });
  await checkInventory(sc, stocks.map((s) => s.coilId));
  await payInvoices(sc, order.id);
  await checkBilling(sc, order.id);
  await step(sc, 'invoicing again finds nothing left to bill', () => A.post('/api/invoices', { orderId: order.id }, 'csr'), 409);
  // Negative path: a shipped order cannot be shipped again.
  await ship(sc, order, loc, [[ol[0], 1]], '4xx');
}

async function multiLocation(sc) {
  const home = pickLoc(['METALS', 'MIXED']);
  // The other branch must be a different one that still has stock.
  let remote; let stock;
  for (let tries = 0; tries < 12 && !stock; tries++) {
    remote = pickLoc(['METALS', 'MIXED']);
    if (remote.id !== home.id) stock = R.pick(await stockAt(remote.id));
  }
  if (!stock || home.id === remote.id) { sc.result = 'BLOCKED'; sc.notes.push('no remote stock'); return; }
  const qty = Math.min(500, Math.floor(num(stock.qtyAvailable) / 2));
  const order = await createOrder(sc, R.pick(ctx.customers), [lineFor(stock, qty)]);
  if (!order) return;
  await confirm(sc, order);
  const line = order.lines[0];
  await allocate(sc, order, line, stock, qty);
  const totalBefore = await prisma.inventory.aggregate({ where: { coilId: stock.coilId }, _sum: { qtyOnHand: true } });
  if (R.chance(0.5)) {
    // Transfer the stock to the home branch, process there, ship from home.
    await step(sc, `transfer ${stock.coil.coilNumber} ${remote.code} → ${home.code}`, () => A.post('/api/inventory/transfer', { coilId: stock.coilId, fromLocationId: remote.id, toLocationId: home.id, qty: num(stock.qtyOnHand) }));
    const after = await prisma.inventory.aggregate({ where: { coilId: stock.coilId }, _sum: { qtyOnHand: true } });
    check(sc, 'transfer did not create or lose stock', num(after._sum.qtyOnHand) === num(totalBefore._sum.qtyOnHand), `${num(totalBefore._sum.qtyOnHand)} → ${num(after._sum.qtyOnHand)}`);
    const j = await createJob(sc, order, line, R.pick(wcOf(home, ['SAW', 'SHEAR', 'LASER'])) || home.workCenters[0]);
    if (j) await runJob(sc, j);
    const s = await ship(sc, order, home, [[line, qty]]);
    if (s) await dispatchDeliver(sc, s);
  } else {
    // Process and ship direct from the remote branch.
    const j = await createJob(sc, order, line, R.pick(wcOf(remote, ['SAW', 'SHEAR', 'LASER'])) || remote.workCenters[0]);
    if (j) await runJob(sc, j);
    const s = await ship(sc, order, remote, [[line, qty]]);
    if (s) await dispatchDeliver(sc, s);
  }
  await checkOrderBooks(sc, order.id, { expectStatus: 'COMPLETE' });
  await checkInventory(sc, [stock.coilId]);
}

async function transfersReceiving(sc, variant) {
  const a = pickLoc(['METALS', 'MIXED', 'OUTLET']);
  let b = pickLoc(['METALS', 'MIXED', 'OUTLET']);
  while (b.id === a.id) b = pickLoc(['METALS', 'MIXED', 'OUTLET']); // a transfer needs two different branches
  const stock = R.pick(await stockAt(a.id, { minAvail: 1000 }));
  if (!stock) { sc.result = 'BLOCKED'; return; }
  const before = num(stock.qtyOnHand);
  if (variant === 0) {
    await step(sc, 'receive more of an existing item', () => A.post('/api/inventory/receive', { coilId: stock.coilId, locationId: a.id, qty: 1000 }));
    const inv = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
    check(sc, 'receipt adds exactly the received qty', num(inv.qtyOnHand) === before + 1000, `${before} → ${num(inv.qtyOnHand)}`);
    const mv = await prisma.materialMovement.findFirst({ where: { coilId: stock.coilId, movementType: 'RECEIVE' }, orderBy: { createdAt: 'desc' } });
    check(sc, 'receipt recorded against the signed-in user', mv?.createdById === ctx.admin.id, `createdById ${mv?.createdById}`);
  } else if (variant === 1) {
    await step(sc, 'reject a negative receipt', () => A.post('/api/inventory/receive', { coilId: stock.coilId, locationId: a.id, qty: -500 }), '4xx');
  } else if (variant === 2) {
    await step(sc, 'transfer whole item between branches', () => A.post('/api/inventory/transfer', { coilId: stock.coilId, fromLocationId: a.id, toLocationId: b.id, qty: before }));
  } else if (variant === 3) {
    await step(sc, 'reject a transfer from the wrong branch', () => A.post('/api/inventory/transfer', { coilId: stock.coilId, fromLocationId: b.id === a.id ? ctx.locs[0].id : b.id, toLocationId: a.id, qty: before }), '4xx');
  } else {
    await step(sc, 'reject a partial transfer of a single tracked item', () => A.post('/api/inventory/transfer', { coilId: stock.coilId, fromLocationId: a.id, toLocationId: b.id, qty: Math.floor(before / 3) }), '4xx');
  }
  await checkInventory(sc, [stock.coilId]);
}

async function exceptionFlow(sc, variant) {
  const loc = pickLoc(['METALS', 'MIXED']);
  const stock = R.pick(await stockAt(loc.id));
  if (!stock) { sc.result = 'BLOCKED'; return; }
  const avail = num(stock.qtyAvailable);
  if (variant === 0) return standardFlow(sc, { priority: 1 }); // rush
  const qty = variant === 1 ? avail + 5000 : Math.min(400, Math.floor(avail / 2));
  const order = await createOrder(sc, R.pick(ctx.customers), [lineFor(stock, qty)]);
  if (!order) return;
  await confirm(sc, order);
  const line = order.lines[0];
  if (variant === 1) {
    // Backorder: asking for more than is on hand must be refused, not drive stock negative.
    await allocate(sc, order, line, stock, qty, '4xx');
  } else if (variant === 2) {
    // Cancel after allocation: the reservation must come back.
    await allocate(sc, order, line, stock, qty);
    await step(sc, 'cancel order', () => A.put(`/api/orders/${order.id}`, { status: 'CANCELLED' }));
    const inv = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
    check(sc, 'cancel releases the reservation', Math.abs(num(inv.qtyAvailable) - avail) < 0.001, `available ${avail} → ${num(inv.qtyAvailable)}`);
    await step(sc, 'reject reopening a cancelled order', () => A.put(`/api/orders/${order.id}`, { status: 'CONFIRMED' }), '4xx');
  } else if (variant === 3) {
    // Invalid job moves must be refused.
    await allocate(sc, order, line, stock, qty);
    const j = await createJob(sc, order, line, R.pick(loc.workCenters));
    if (j) {
      await step(sc, 'reject skipping straight to SHIPPED', () => A.post(`/api/jobs/${j.id}/status`, { status: 'SHIPPED' }), '4xx');
      await step(sc, 'reject an unknown status', () => A.post(`/api/jobs/${j.id}/status`, { status: 'BANANA' }), '4xx');
      await runJob(sc, j);
      await step(sc, 'reject moving a ready job back to SCHEDULED', () => A.patch(`/api/jobs/${j.id}/status`, { status: 'SCHEDULED' }), '4xx');
      await step(sc, 'reject rewriting a job\'s order through the edit endpoint', () => A.patch(`/api/jobs/${j.id}`, { orderId: null, status: 'COMPLETED' }), '4xx');
    }
  } else {
    // Over-shipping must be refused.
    await allocate(sc, order, line, stock, qty);
    await step(sc, 'reject shipping more than ordered', () => A.post('/api/shipments', { orderId: order.id, fromLocationId: loc.id, items: [{ orderLineId: line.id, qtyShipped: qty * 2 }] }, 'shipping'), '4xx');
    await step(sc, 'reject delivering a shipment that never left', async () => {
      const s = await A.post('/api/shipments', { orderId: order.id, fromLocationId: loc.id, items: [{ orderLineId: line.id, qtyShipped: 1 }] }, 'shipping');
      return s.body?.id ? A.put(`/api/shipments/${s.body.id}/deliver`, {}, 'shipping') : s;
    }, '4xx');
  }
  await checkOrderBooks(sc, order.id);
  await checkInventory(sc, [stock.coilId]);
}

async function partialRework(sc, variant) {
  if (variant <= 1) return standardFlow(sc, { partial: true });
  if (variant <= 3) {
    // Rework: job goes on hold mid-process, then resumes.
    const loc = pickLoc(['METALS', 'MIXED']);
    const stock = R.pick(await stockAt(loc.id));
    if (!stock) { sc.result = 'BLOCKED'; return; }
    const qty = Math.min(300, Math.floor(num(stock.qtyAvailable) / 2));
    const order = await createOrder(sc, R.pick(ctx.customers), [lineFor(stock, qty)]);
    if (!order) return;
    await confirm(sc, order);
    await allocate(sc, order, order.lines[0], stock, qty);
    const j = await createJob(sc, order, order.lines[0], R.pick(loc.workCenters));
    if (!j) return;
    await runJob(sc, j, ['IN_PROCESS', 'WAITING_QC', 'ON_HOLD']);
    // Jobs and shipments are tied: nothing leaves the dock while its job is unfinished.
    const s = await ship(sc, order, loc, [[order.lines[0], qty]]);
    if (!s) return;
    await step(sc, 'dispatch while the job is on hold is refused', () => A.put(`/api/shipments/${s.id}/dispatch`, {}, 'shipping'), 409);
    await step(sc, 'marking the job shipped by hand before anything ships is refused', () => A.post(`/api/jobs/${j.id}/status`, { status: 'SHIPPED' }, 'operator'), 409);
    await runJob(sc, j, ['IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP']);
    if (variant === 2) {
      await dispatchDeliver(sc, s);
    } else {
      // Shop-floor "Ship" on the job: it makes the shipment itself.
      await step(sc, 'shop-floor ship is refused while the line sits on an open shipment', () => A.post(`/api/jobs/${j.id}/ship`, { carrier: 'XPO', trackingNumber: `QA-${sc.id}` }, 'operator'), 409);
      await step(sc, 'cancel the open shipment', () => A.patch(`/api/shipments/${s.id}/status`, { status: 'CANCELLED' }, 'shipping'));
      const shipped = await step(sc, `ship ${j.jobNumber} from the shop floor`, () => A.post(`/api/jobs/${j.id}/ship`, { carrier: 'XPO', trackingNumber: `QA-${sc.id}` }, 'operator'));
      check(sc, 'shop-floor ship created a shipment and an invoice', !!shipped.body?.shipment?.shipmentNumber && !!shipped.body?.shipment?.invoice?.invoiceNumber, JSON.stringify(shipped.body?.shipment || null));
      await step(sc, 'shipping the same job twice is refused', () => A.post(`/api/jobs/${j.id}/ship`, { carrier: 'XPO', trackingNumber: 'again' }, 'operator'), '4xx');
    }
    const jobNow = await prisma.job.findUnique({ where: { id: j.id } });
    check(sc, 'the job is SHIPPED once its line has shipped', jobNow.status === 'SHIPPED', `job status ${jobNow.status}`);
    await checkBilling(sc, order.id);
    await checkOrderBooks(sc, order.id, { expectStatus: 'COMPLETE' });
    await checkInventory(sc, [stock.coilId]);
    return;
  }
  return returnFlow(sc);
}

/** Ship an order, then take part of it back: restocked or scrapped, and credited. */
async function returnFlow(sc) {
  const loc = pickLoc(['METALS', 'MIXED']);
  const stock = R.pick(await stockAt(loc.id));
  if (!stock) { sc.result = 'BLOCKED'; sc.notes.push(`no stock at ${loc.code}`); return; }
  const qty = Math.min(400, Math.floor(num(stock.qtyAvailable) / 2));
  const order = await createOrder(sc, R.pick(ctx.customers), [lineFor(stock, qty)]);
  if (!order) return;
  await confirm(sc, order);
  const line = order.lines[0];
  await allocate(sc, order, line, stock, qty);
  // Nothing has shipped yet, so nothing can come back.
  await step(sc, 'return before shipping is refused', () => A.post('/api/returns', { orderId: order.id, reason: 'QA', lines: [{ orderLineId: line.id, quantity: 1 }] }, 'csr'), '4xx');
  const s = await ship(sc, order, loc, [[line, qty]]);
  if (s) await dispatchDeliver(sc, s);
  await checkOrderBooks(sc, order.id, { expectStatus: 'COMPLETE' });
  const paidFirst = R.int(0, 1) === 1;
  const invoices = (await A.get(`/api/invoices?orderId=${order.id}`, 'csr')).body?.data || [];
  const invoice = invoices[0];
  check(sc, 'the shipment raised an invoice', !!invoice, 'no invoice');
  if (!invoice) return;
  if (paidFirst) await step(sc, 'customer pays the invoice in full', () => A.post(`/api/invoices/${invoice.id}/payments`, { amount: invoice.balance, paymentMethod: 'CHECK' }, 'csr'));

  const scrap = R.int(0, 1) === 1;
  const back = Math.max(1, Math.floor(qty / R.pick([2, 4, 5])));
  const before = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
  await step(sc, 'returning more than shipped is refused', () => A.post('/api/returns', { orderId: order.id, reason: 'QA', lines: [{ orderLineId: line.id, quantity: qty + 1 }] }, 'csr'), '4xx');
  await step(sc, 'a return needs a reason', () => A.post('/api/returns', { orderId: order.id, lines: [{ orderLineId: line.id, quantity: back }] }, 'csr'), '4xx');
  const made = await step(sc, `open a return for ${back} lb (${scrap ? 'scrap' : 'restock'})`, () => A.post('/api/returns', {
    orderId: order.id, reason: scrap ? 'Damaged in transit' : 'Customer ordered too much', lines: [{ orderLineId: line.id, quantity: back, disposition: scrap ? 'SCRAP' : 'RESTOCK' }],
  }, 'csr'));
  const ret = made.body;
  if (!ret?.id) return;
  await step(sc, 'a second return cannot take more than what is left', () => A.post('/api/returns', { orderId: order.id, reason: 'QA', lines: [{ orderLineId: line.id, quantity: qty - back + 1 }] }, 'csr'), '4xx');
  const got = await step(sc, `receive ${ret.returnNumber}`, () => A.post(`/api/returns/${ret.id}/receive`, {}, 'shipping'));
  await step(sc, 'receiving the same return twice is refused', () => A.post(`/api/returns/${ret.id}/receive`, {}, 'shipping'), '4xx');
  await step(sc, 'a received return cannot be cancelled', () => A.post(`/api/returns/${ret.id}/cancel`, {}, 'csr'), '4xx');
  check(sc, 'return is complete', got.body?.status === 'COMPLETE', `status ${got.body?.status}`);

  const after = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
  const moved = num(after.qtyOnHand) - num(before.qtyOnHand);
  check(sc, scrap ? 'scrapped return leaves stock unchanged' : 'restocked return is back on hand', Math.abs(moved - (scrap ? 0 : back)) < 0.001, `on hand moved ${moved}, returned ${back}`);
  const movement = await prisma.materialMovement.findFirst({ where: { orderId: ret.id, movementType: scrap ? 'SCRAP' : 'RECEIVE' } });
  check(sc, 'the return has a stock movement record', !!movement && Math.abs(num(movement.qtyMoved) - back) < 0.001, `movement ${movement && num(movement.qtyMoved)}`);

  const now = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
  const credit = await prisma.invoice.findFirst({ where: { creditOfInvoiceId: invoice.id, kind: 'CREDIT' }, include: { lines: true } });
  check(sc, 'a credit memo was issued for the return', !!credit, 'no credit memo');
  if (credit) {
    const expected = cents(invoice.subtotal * back / qty) + cents(invoice.taxAmount * back / qty);
    check(sc, 'credit = returned share of the invoice (goods + tax)', Math.abs(-cents(credit.totalAmount) - expected) <= 2, `credit ${num(credit.totalAmount)} expected ${-expected / 100}`);
    check(sc, 'credit quantity = returned quantity', Math.abs(-num(credit.lines[0]?.quantity) - back) < 0.001, `credit qty ${credit.lines[0] && num(credit.lines[0].quantity)}`);
    if (paidFirst) {
      check(sc, 'paid invoice: the credit is owed back to the customer', cents(credit.paidAmount) === 0 && credit.status === 'SENT', `credit paid ${num(credit.paidAmount)} status ${credit.status}`);
      await step(sc, 'refunding more than the credit is refused', () => A.post(`/api/invoices/${credit.id}/refund`, { amount: +(-num(credit.totalAmount) + 5).toFixed(2), paymentMethod: 'CHECK' }), '4xx');
      const refund = await step(sc, 'refund the credit', () => A.post(`/api/invoices/${credit.id}/refund`, { amount: -num(credit.totalAmount), paymentMethod: 'CHECK' }));
      check(sc, 'credit memo is settled after the refund', refund.body?.status === 'PAID' && refund.body?.balance === 0, `status ${refund.body?.status} balance ${refund.body?.balance}`);
    } else {
      check(sc, 'open invoice: the credit reduced what is owed', cents(now.totalAmount) - cents(now.paidAmount) === cents(invoice.totalAmount) + cents(credit.totalAmount), `balance ${num(now.totalAmount) - num(now.paidAmount)}`);
      check(sc, 'credit memo is fully applied', credit.status === 'PAID', `status ${credit.status}`);
    }
    await step(sc, 'crediting more than the invoice is refused', () => A.post(`/api/invoices/${invoice.id}/credit`, { reason: 'QA', amount: +(num(invoice.totalAmount) + 1).toFixed(2) }), '4xx');
  }
  await step(sc, 'an invoice with payments or credits cannot be cancelled', () => A.post(`/api/invoices/${invoice.id}/cancel`, {}), '4xx');
  await checkBilling(sc, order.id);
  await checkInventory(sc, [stock.coilId]);
}

async function posEcommerce(sc, variant) {
  if (variant < 3) {
    const prods = (await A.get('/api/ecom/catalog?inStockOnly=true', 'custA')).body;
    const list = prods?.data || prods?.products || [];
    const p = R.pick(list.filter((x) => x.priceUnit === 'EA' || x.form === 'SUPPLY').length ? list.filter((x) => x.priceUnit === 'EA' || x.form === 'SUPPLY') : list);
    if (!p) { sc.result = 'BLOCKED'; sc.notes.push('empty catalog'); return; }
    const sub = await step(sc, 'customer checks out online', () => A.post('/api/ecom/checkout/submit', { items: [{ productId: p.id, quantity: 2, extended: 25, sku: p.sku }], deliveryMethod: 'PICKUP', poNumber: `QA-${sc.id}` }, 'custA'));
    const webId = sub.body?.data?.id;
    if (!webId) return;
    const web = await prisma.onlineOrder.findUnique({ where: { id: webId } });
    check(sc, 'web order filed under the customer login\'s account', web?.customerId === ctx.customers[0].id, `customerId ${web?.customerId}`);
    const acc = await step(sc, 'CSR accepts the web order', () => A.post(`/api/orders/online/${webId}/accept`, {}, 'csr'));
    const soId = acc.body?.data?.internalOrderId || acc.body?.data?.orderId || (await prisma.onlineOrder.findUnique({ where: { id: webId } }))?.internalOrderId;
    check(sc, 'accepted web order became a sales order', !!soId, JSON.stringify(acc.body).slice(0, 200));
    if (soId) await checkOrderBooks(sc, soId, { createdBy: (await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } })).id });
    await step(sc, 'another customer cannot open this web order', () => A.get(`/api/ecom/my-orders/${webId}`, 'custB'), 404);
    return;
  }
  // Counter sale through the POS session workflow (the path that saves an order).
  const csr = await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } });
  const customer = R.pick(ctx.customers.slice(2));
  const product = R.pick(ctx.products.filter((p) => p.priceUnit === 'CWT' && num(p.basePriceCwt) > 0));
  if (!product) { sc.result = 'BLOCKED'; sc.notes.push('no CWT-priced product in the catalog'); return; }
  const qty = R.int(2, 20) * 50;
  const s = await step(sc, 'POS: open a counter session', () => A.post('/api/pos/sessions', { userId: csr.id, entryPoint: 'counter', terminalId: `QA-${sc.id}` }, 'csr'));
  const sid = s.body?.sessionId;
  if (!sid) return;
  const go = (label, trigger, payload) => step(sc, `POS: ${label}`, () => A.post(`/api/pos/sessions/${sid}/transition`, { trigger, payload }, 'csr'));
  await go('start order', 'start_order');
  await step(sc, 'POS: pick the customer', () => A.post(`/api/pos/sessions/${sid}/customers/select`, { customerId: customer.id }, 'csr'));
  await go('continue to lines', 'continue');
  await step(sc, 'POS: refuse to submit an empty sale', () => A.post(`/api/pos/sessions/${sid}/submit`, {}, 'csr'), '4xx');
  await go('search product', 'search_product');
  await go('select product', 'product_selected', { productId: product.id });
  const added = await step(sc, `POS: add ${qty} lb of ${product.sku}`, () => A.post(`/api/pos/sessions/${sid}/products/add`, { productId: product.id, quantity: qty, unit: 'LB', description: product.name }, 'csr'));
  const line = added.body?.context?.lines?.[0];
  check(sc, 'POS line is priced', num(line?.extendedPrice) > 0, `line ${JSON.stringify(line)?.slice(0, 160)}`);
  const listTotal = Math.round((qty / 100) * num(product.basePriceCwt) * 100) / 100;
  check(sc, 'POS line is the catalog list price for this product', Math.abs(num(line?.extendedPrice) - listTotal) < 0.01, `line ${line?.extendedPrice} vs list ${listTotal}`);
  const pricing = (await A.get(`/api/pos/sessions/${sid}/pricing`, 'csr')).body;
  check(sc, 'POS total equals the line', Math.abs(num(pricing?.summary?.subtotal) - num(line?.extendedPrice)) < 0.01 && num(pricing?.summary?.subtotal) > 0, `subtotal ${pricing?.summary?.subtotal} vs line ${line?.extendedPrice}`);
  await go('review', 'proceed_to_review');
  const sub = await step(sc, 'POS: submit the sale', () => A.post(`/api/pos/sessions/${sid}/submit`, {}, 'csr'));
  const orderId = sub.body?.order?.id;
  if (!orderId) return;
  await step(sc, 'POS: refuse to submit the same sale twice', () => A.post(`/api/pos/sessions/${sid}/submit`, {}, 'csr'), '4xx');
  const saved = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
  check(sc, 'POS order saved with its total', num(saved.subtotal) > 0 && Math.abs(num(saved.subtotal) - num(saved.lines[0].extendedPrice)) < 0.01, `subtotal ${saved.subtotal}, line ${saved.lines[0]?.extendedPrice}`);
  check(sc, 'POS order belongs to the chosen customer', saved.buyerId === customer.id, `buyer ${saved.buyerId}`);
  await checkOrderBooks(sc, orderId, { createdBy: csr.id });
}

/** Counter quick sale: priced by the server, taxed by branch, paid, saved once, voided by a manager only. */
async function quickSale(sc) {
  const each = ctx.products.filter((p) => p.priceUnit === 'EACH' && num(p.basePriceCwt) > 0);
  const byWeight = ctx.products.find((p) => p.priceUnit === 'CWT');
  if (!each.length) { sc.result = 'BLOCKED'; sc.notes.push('no each-priced product in the catalog'); return; }
  const branch = ctx.locs.find((l) => l.state === 'OH') || ctx.locs[0];
  const rateRow = await prisma.salesTaxRate.findUnique({ where: { state: branch.state } });
  const p = R.pick(each);
  const qty = R.int(1, 12);
  const sale = { id: `QA-${sc.id}-${Date.now()}`, locationId: branch.id, items: [{ productId: p.id, quantity: qty, unitPrice: 0.01, price: 0.01 }] };
  const priced = await step(sc, 'quick sale: price the sale', () => A.post('/api/pos/quick-sale/price', { sale }, 'csr'));
  const subtotal = Math.round(num(p.basePriceCwt) * qty * 100) / 100;
  const tax = Math.round(subtotal * num(rateRow?.rate) * 100) / 100;
  check(sc, 'quick sale uses the system price, not the price the screen sent', Math.abs(num(priced.body?.subtotal) - subtotal) < 0.005, `subtotal ${priced.body?.subtotal} vs ${subtotal}`);
  check(sc, 'quick sale tax is the branch state rate', Math.abs(num(priced.body?.tax) - tax) < 0.005, `tax ${priced.body?.tax} vs ${tax}`);
  const total = num(priced.body?.total);
  if (byWeight) await step(sc, 'quick sale: material priced by weight is refused', () => A.post('/api/pos/quick-sale/price', { sale: { ...sale, items: [{ productId: byWeight.id, quantity: 1 }] } }, 'csr'), 409);
  await step(sc, 'quick sale: cash that does not cover the total is refused', () => A.post('/api/pos/quick-sale/process-payment', { sale, payment: { method: 'CASH', amountTendered: +(total - 0.5).toFixed(2) } }, 'csr'), 400);
  await step(sc, 'quick sale: a card with no approval code is refused', () => A.post('/api/pos/quick-sale/process-payment', { sale, payment: { method: 'CARD' } }, 'csr'), 400);
  const tendered = Math.ceil(total) + 5;
  const paid = await step(sc, 'quick sale: take cash payment', () => A.post('/api/pos/quick-sale/process-payment', { sale, payment: { method: 'CASH', amountTendered: tendered } }, 'csr'));
  if (!paid.body?.orderId) return;
  check(sc, 'quick sale change is tendered minus total', Math.abs(num(paid.body.change) - (tendered - total)) < 0.005, `change ${paid.body.change}`);
  const again = await step(sc, 'quick sale: the same sale sent again is not charged twice', () => A.post('/api/pos/quick-sale/process-payment', { sale, payment: { method: 'CASH', amountTendered: tendered } }, 'csr'));
  check(sc, 'repeat returns the first sale', again.body?.duplicate === true && again.body?.orderId === paid.body.orderId, JSON.stringify(again.body).slice(0, 160));
  const saved = await prisma.order.findMany({ where: { poReference: `QS:${sale.id}` }, include: { lines: true, invoices: { include: { payments: true } } } });
  check(sc, 'quick sale saved exactly one order', saved.length === 1, `${saved.length} orders`);
  const o = saved[0];
  const inv = o?.invoices.find((i) => i.kind === 'INVOICE');
  check(sc, 'quick sale order total = subtotal + tax', o && Math.abs(num(o.totalAmount) - total) < 0.005 && Math.abs(num(o.subtotal) - subtotal) < 0.005, `total ${o?.totalAmount}`);
  check(sc, 'quick sale has one paid invoice for the total', inv && inv.status === 'PAID' && Math.abs(num(inv.paidAmount) - total) < 0.005 && inv.payments.length === 1 && Math.abs(num(inv.payments[0].amount) - total) < 0.005, `invoice ${inv?.status} paid ${inv?.paidAmount}`);
  await step(sc, 'quick sale: receipt can be reprinted', () => A.get(`/api/pos/quick-sale/${sale.id}/receipt`, 'csr'));
  await step(sc, 'quick sale: emailing a receipt says it is not set up', () => A.post('/api/pos/quick-sale/email-receipt', { saleId: sale.id, email: 'nobody@qa.test' }, 'csr'), 501);
  await step(sc, 'quick sale: a counter clerk cannot void', () => A.post(`/api/pos/quick-sale/${sale.id}/void`, { reason: 'QA' }, 'csr'), 403);
  await step(sc, 'quick sale: a void needs a reason', () => A.post(`/api/pos/quick-sale/${sale.id}/void`, {}), '4xx');
  const voided = await step(sc, 'quick sale: manager voids the sale', () => A.post(`/api/pos/quick-sale/${sale.id}/void`, { reason: 'QA void' }));
  check(sc, 'void refunds the whole sale', Math.abs(num(voided.body?.refunded) - total) < 0.005, `refunded ${voided.body?.refunded}`);
  await step(sc, 'quick sale: a voided sale cannot be voided again', () => A.post(`/api/pos/quick-sale/${sale.id}/void`, { reason: 'QA void' }), '4xx');
  const after = await prisma.invoice.findMany({ where: { orderId: o.id }, include: { payments: true } });
  const net = after.reduce((t, i) => t + i.payments.filter((x) => x.paymentMethod !== 'CREDIT').reduce((u, x) => u + Math.round(num(x.amount) * 100), 0), 0);
  check(sc, 'after the void the money taken nets to zero', net === 0, `net cents ${net}`);
}

/** RFQ to quote to sales order. */
async function quoteToOrder(sc) {
  const customer = R.pick(ctx.customers.slice(2));
  const product = R.pick(ctx.products.filter((p) => p.priceUnit === 'CWT'));
  const qty = R.int(4, 40) * 50;
  await step(sc, 'RFQ with no lines is refused', () => A.post('/api/rfqs', { customerId: customer.id, lines: [] }, 'csr'), 400);
  const rfq = await step(sc, 'log an RFQ', () => A.post('/api/rfqs', { customerId: customer.id, contactName: 'QA Buyer', lines: [{ productId: product.id, description: product.name, requestedQty: qty, unit: 'LB' }] }, 'csr'));
  if (!rfq.body?.id) return;
  const rl = rfq.body.lines[0];
  await step(sc, 'a quote with a negative price is refused', () => A.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rl.id, unitPrice: -5, priceUnit: 'CWT' }] }, 'csr'), 400);
  const price1 = R.int(40, 90);
  const q1 = await step(sc, 'quote the RFQ', () => A.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rl.id, unitPrice: price1, priceUnit: 'CWT' }] }, 'csr'));
  const q2 = await step(sc, 'quote it again at a lower price', () => A.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rl.id, unitPrice: price1 - 2, priceUnit: 'CWT' }] }, 'csr'));
  if (!q1.body?.id || !q2.body?.id) return;
  const want = Math.round((qty / 100) * (price1 - 2) * 100) / 100;
  check(sc, 'quote total = quantity x price', Math.abs(num(q2.body.totalAmount) - want) < 0.005, `total ${q2.body.totalAmount} vs ${want}`);
  await step(sc, 'a customer login cannot accept a quote through the staff route', () => A.post(`/api/quotes/${q2.body.id}/accept`, {}, 'custA'), '4xx');
  await step(sc, 'mark the quote sent', () => A.post(`/api/quotes/${q2.body.id}/send`, {}, 'csr'));
  const two = await Promise.all([1, 2].map(() => A.post(`/api/quotes/${q2.body.id}/accept`, { poReference: `QA-${sc.id}` }, 'csr')));
  check(sc, 'a quote accepted twice at once makes one order', two.filter((r) => ok2xx(r.status)).length === 1, `statuses ${two.map((r) => r.status).join(',')}`);
  const orderId = two.find((r) => ok2xx(r.status))?.body?.order?.id;
  const orders = await prisma.order.findMany({ where: { poReference: `QA-${sc.id}`, buyerId: customer.id }, include: { lines: true } });
  check(sc, 'exactly one sales order came from the quote', orders.length === 1 && orders[0].id === orderId, `${orders.length} orders`);
  if (orders[0]) {
    check(sc, 'the order carries the quoted quantity and price', Math.abs(num(orders[0].lines[0].qtyOrdered) - qty) < 0.001 && Math.abs(num(orders[0].totalAmount) - want) < 0.005 && orders[0].status === 'CONFIRMED', `qty ${orders[0].lines[0].qtyOrdered} total ${orders[0].totalAmount} ${orders[0].status}`);
    await checkOrderBooks(sc, orders[0].id, { createdBy: (await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } })).id });
  }
  const first = await prisma.quote.findUnique({ where: { id: q1.body.id } });
  const done = await prisma.rFQ.findUnique({ where: { id: rfq.body.id } });
  check(sc, 'the other quote on the RFQ was closed', first.status === 'REJECTED', first.status);
  check(sc, 'the RFQ is marked accepted', done.status === 'ACCEPTED', done.status);
  await step(sc, 'a closed RFQ cannot be quoted again', () => A.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rl.id, unitPrice: 50, priceUnit: 'CWT' }] }, 'csr'), 409);
}

/**
 * An order typed on the CSR order entry screen (/api/orders/intake), which is how staff
 * enter most orders: draft, edit, submit, work orders, production, shipping, invoice, payment.
 */
async function entryScreenOrder(sc) {
  const loc = pickLoc(['METALS', 'MIXED']);
  const customer = R.pick(ctx.customers.slice(2));
  const csr = await prisma.user.findUnique({ where: { email: 'qa-csr@qa.test' } });
  const stocks = [R.pick(await stockAt(loc.id))].filter(Boolean);
  if (!stocks.length) { sc.notes.push(`no stock at ${loc.code}`); sc.result = 'BLOCKED'; return; }
  const qty = Math.min(200 + R.int(0, 20) * 50, Math.floor(num(stocks[0].qtyAvailable) / 2));
  const price = R.pick([0.55, 0.65, 0.8]);
  const entry = (q) => ({ gradeId: stocks[0].coil.gradeId, description: `${stocks[0].coil.grade.code} ${stocks[0].coil.form} cut to size`, qty: q, uom: 'LB', unitPrice: price, extPrice: +(q * price).toFixed(2), lineType: 'MATERIAL', processes: [{ name: 'SAW' }] });
  const head = { source: 'PHONE', division: 'METALS', location: loc.code, priority: R.pick(['STANDARD', 'RUSH']), ownership: 'HOUSE', poNumber: `QA-${sc.id}`, customerId: customer.id, customerName: customer.name };
  const draft = await step(sc, 'entry screen: save a draft', () => A.post('/api/orders/intake', { ...head, lines: [entry(qty + 50)], status: 'DRAFT' }, 'csr'));
  const id = draft.body?.data?.id;
  if (!id) return;
  await step(sc, 'entry screen: a line with no quantity is refused', () => A.patch(`/api/orders/intake/${id}`, { lines: [entry(0)] }, 'csr'), 400);
  await step(sc, 'entry screen: change the quantity', () => A.patch(`/api/orders/intake/${id}`, { lines: [entry(qty)] }, 'csr'));
  await step(sc, 'entry screen: submit', () => A.post(`/api/orders/intake/${id}/submit`, {}, 'csr'));
  let order = await prisma.order.findUnique({ where: { id }, include: { lines: true, buyer: true } });
  const rate = order.buyer.taxExempt ? 0 : num((loc.state ? await prisma.salesTaxRate.findUnique({ where: { state: loc.state } }) : null)?.rate);
  const subtotal = +(qty * price).toFixed(2);
  check(sc, 'entry screen: subtotal saved from the lines', Math.abs(num(order.subtotal) - subtotal) < 0.005, `subtotal ${order.subtotal} vs ${subtotal}`);
  check(sc, 'entry screen: sales tax saved at the selling branch state rate', Math.abs(num(order.taxAmount) - Math.round(subtotal * rate * 100) / 100) < 0.005, `tax ${order.taxAmount} vs ${Math.round(subtotal * rate * 100) / 100} (branch state ${loc.state})`);
  check(sc, 'entry screen: total = subtotal + tax', Math.abs(num(order.totalAmount) - (num(order.subtotal) + num(order.taxAmount))) < 0.005, `total ${order.totalAmount}`);
  const line = order.lines[0];
  await allocate(sc, order, line, stocks[0], qty);
  const made = await step(sc, 'entry screen: create work orders', () => A.post(`/api/orders/intake/${id}/create-work-orders`, {}, 'csr'));
  await step(sc, 'entry screen: create work orders pressed again', () => A.post(`/api/orders/intake/${id}/create-work-orders`, {}, 'csr'));
  const jobs = await prisma.job.findMany({ where: { orderId: id } });
  check(sc, 'entry screen: one work order per line', jobs.length === 1 && made.body?.data?.count === 1, `${jobs.length} jobs`);
  await step(sc, 'entry screen: a confirmed order cannot have its lines replaced', () => A.patch(`/api/orders/intake/${id}`, { lines: [entry(1)] }, 'csr'), 409);
  const wc = R.pick(wcOf(loc, ['SAW', 'SHEAR', 'LASER', 'PLASMA', 'WATERJET']));
  for (const j of jobs) {
    if (wc) await step(sc, `assign ${j.jobNumber} to ${wc.code}`, () => A.patch(`/api/jobs/${j.id}`, { workCenterId: wc.id }));
    await runJob(sc, j);
  }
  order = await prisma.order.findUnique({ where: { id }, include: { lines: true } });
  const s = await ship(sc, order, loc, [[line, qty]]);
  if (s) await dispatchDeliver(sc, s);
  await checkOrderBooks(sc, id, { expectStatus: 'COMPLETE', createdBy: csr.id });
  await checkInventory(sc, stocks.map((x) => x.coilId));
  await payInvoices(sc, id);
  await checkBilling(sc, id);
}

async function runScenario(category, i, id) {
  const sc = newScenario(id, category);
  const t0 = Date.now();
  try {
    if (category === 'standard-metals') await standardFlow(sc);
    else if (category === 'multi-step-metals') await standardFlow(sc, { multiStep: true });
    else if (category === 'plastics') await standardFlow(sc, { plastics: true, multiStep: i % 2 === 1 });
    else if (category === 'pos-ecommerce') await posEcommerce(sc, i);
    else if (category === 'multi-location') await multiLocation(sc);
    else if (category === 'transfers-receiving') await transfersReceiving(sc, i % 5);
    else if (category === 'rush-backorder-exception') await exceptionFlow(sc, i % 5);
    else if (category === 'partial-rework-return') await partialRework(sc, i % 5);
    else if (category === 'mixed-division') await standardFlow(sc, { mixed: true });
    else if (category === 'quick-sale') await quickSale(sc);
    else if (category === 'quote-to-order') await quoteToOrder(sc);
    else if (category === 'entry-screen') await entryScreenOrder(sc);
  } catch (e) {
    sc.result = 'ERROR'; sc.notes.push(e.stack?.split('\n').slice(0, 3).join(' | '));
  }
  sc.ms = Date.now() - t0;
  return sc;
}

async function concurrency(report) {
  const out = [];
  const record = (name, pass, detail) => out.push({ name, pass: !!pass, detail });
  // Earlier cycles use up stock, so take the first QA location that still has enough.
  let loc = ctx.locs[1];
  let pool = await stockAt(loc.id, { minAvail: 2000 });
  for (const other of ctx.locs) {
    if (pool.length) break;
    loc = other;
    pool = await stockAt(loc.id, { minAvail: 2000 });
  }
  if (!pool.length) throw new Error('No QA location has 2000 available on any coil; reseed QA fixtures.');
  const stock = R.pick(pool);

  // 1. Ten simultaneous order creations must all succeed with distinct numbers.
  const results = await Promise.all(Array.from({ length: 10 }, () => A.post('/api/orders', { orderType: 'SO', buyerId: ctx.customers[2].id, lines: [lineFor(stock, 10)] })));
  const numbers = new Set(results.map((r) => r.body?.orderNumber).filter(Boolean));
  record('10 simultaneous orders all saved with distinct numbers', results.every((r) => ok2xx(r.status)) && numbers.size === 10, `statuses ${results.map((r) => r.status).join(',')}; ${numbers.size} distinct`);

  // 2. Two orders race for the same stock: only one reservation can win.
  const fresh = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
  const want = Math.floor(num(fresh.qtyAvailable) * 0.6);
  const mk = async () => {
    const o = (await A.post('/api/orders', { orderType: 'SO', buyerId: ctx.customers[3].id, status: 'CONFIRMED', lines: [lineFor(stock, want)] }, 'csr')).body;
    return o;
  };
  const [o1, o2] = [await mk(), await mk()];
  const race = await Promise.all([o1, o2].map((o) => A.post(`/api/orders/${o.id}/allocate`, { lineId: o.lines[0].id, coilId: stock.coilId, qty: want })));
  const after = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
  record('two reservations racing for the same stock: exactly one wins', race.filter((r) => ok2xx(r.status)).length === 1 && num(after.qtyAvailable) >= 0 && Math.abs(num(after.qtyOnHand) - num(after.qtyAvailable) - num(after.qtyAllocated) - num(after.qtyOnHold)) < 0.001, `statuses ${race.map((r) => r.status).join(',')}; available ${num(after.qtyAvailable)}`);
  const winner = ok2xx(race[0].status) ? o1 : o2;

  // 3. Two shipments racing for the whole order: only one is created.
  const shipBody = { orderId: winner.id, fromLocationId: loc.id, items: [{ orderLineId: winner.lines[0].id, qtyShipped: want }] };
  const ships = await Promise.all([1, 2].map(() => A.post('/api/shipments', shipBody, 'shipping')));
  const made = ships.filter((r) => ok2xx(r.status));
  record('two shipments racing for the same order line: exactly one is created', made.length === 1, `statuses ${ships.map((r) => r.status).join(',')}`);

  // 4. The same shipment dispatched twice at once: stock and the order move once.
  if (made[0]) {
    const id = made[0].body.id;
    const disp = await Promise.all([1, 2, 3].map(() => A.put(`/api/shipments/${id}/dispatch`, {}, 'shipping')));
    const line = await prisma.orderLine.findUnique({ where: { id: winner.lines[0].id } });
    const inv = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
    record('one shipment dispatched three times at once: counted once', disp.filter((r) => ok2xx(r.status)).length === 1 && Math.abs(num(line.qtyShipped) - want) < 0.001 && Math.abs(num(inv.qtyOnHand) - (num(after.qtyOnHand) - want)) < 0.001,
      `statuses ${disp.map((r) => r.status).join(',')}; line shipped ${num(line.qtyShipped)} of ${want}; on hand ${num(after.qtyOnHand)} → ${num(inv.qtyOnHand)}`);
  }

  // 5. Ten jobs created at once get distinct numbers.
  const jobs = await Promise.all(Array.from({ length: 10 }, () => A.post('/api/jobs', { workCenterId: loc.workCenters[0].id, operationType: 'SAW', instructions: 'QA concurrency' })));
  record('10 simultaneous jobs all saved with distinct numbers', jobs.every((r) => ok2xx(r.status)) && new Set(jobs.map((r) => r.body?.jobNumber)).size === 10, `statuses ${jobs.map((r) => r.status).join(',')}`);

  // 6. Billing races on the order shipped above.
  const bills = await Promise.all([1, 2, 3].map(() => A.post('/api/invoices', { orderId: winner.id })));
  const invs = await prisma.invoice.findMany({ where: { orderId: winner.id, kind: 'INVOICE', status: { not: 'CANCELLED' } }, include: { lines: true } });
  const billedQty = invs.reduce((t, i) => t + i.lines.reduce((u, l) => u + num(l.quantity), 0), 0);
  record('one shipment invoiced three more times at once: billed once', invs.length === 1 && Math.abs(billedQty - want) < 0.001, `statuses ${bills.map((r) => r.status).join(',')}; ${invs.length} invoice(s), ${billedQty} billed of ${want} shipped`);
  if (invs[0]) {
    const inv = invs[0];
    const full = num(inv.totalAmount);
    const pays = await Promise.all([1, 2, 3].map(() => A.post(`/api/invoices/${inv.id}/payments`, { amount: full, paymentMethod: 'CHECK', referenceNumber: 'QA-race' })));
    const paidNow = await prisma.invoice.findUnique({ where: { id: inv.id }, include: { payments: true } });
    record('three full payments at once on one invoice: taken once', pays.filter((r) => ok2xx(r.status)).length === 1 && Math.abs(num(paidNow.paidAmount) - full) < 0.005 && paidNow.payments.length === 1, `statuses ${pays.map((r) => r.status).join(',')}; paid ${num(paidNow.paidAmount)} of ${full}`);

    // 7. The same return received twice at once: stock comes back once, one credit.
    const back = Math.max(1, Math.floor(want / 4));
    const ret = await A.post('/api/returns', { orderId: winner.id, reason: 'QA concurrency', lines: [{ orderLineId: winner.lines[0].id, quantity: back, disposition: 'RESTOCK' }] });
    if (ok2xx(ret.status)) {
      const before = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
      const recv = await Promise.all([1, 2, 3].map(() => A.post(`/api/returns/${ret.body.id}/receive`, {})));
      const now = await prisma.inventory.findUnique({ where: { coilId: stock.coilId } });
      const credits = await prisma.invoice.findMany({ where: { creditOfInvoiceId: inv.id } });
      record('one return received three times at once: counted once, one credit', recv.filter((r) => ok2xx(r.status)).length === 1 && credits.length === 1 && Math.abs(num(now.qtyOnHand) - num(before.qtyOnHand) - back) < 0.001,
        `statuses ${recv.map((r) => r.status).join(',')}; ${credits.length} credit memo(s); source coil on hand ${num(before.qtyOnHand)} → ${num(now.qtyOnHand)}`);
    } else record('one return received three times at once: counted once, one credit', false, `return did not open: ${ret.status} ${JSON.stringify(ret.body).slice(0, 160)}`);
  }

  report.concurrency = { pass: out.every((x) => x.pass), probes: out };
}

/** Whole-database reconciliation after the cycle: every QA stock item and every order. */
async function reconcile(report) {
  const allProblems = [];
  const problems = allProblems;
  const inv = await prisma.inventory.findMany({ where: { coil: { coilNumber: { startsWith: 'QA-' } } }, include: { coil: { select: { coilNumber: true, locationId: true } } } });
  const alloc = await prisma.orderLineAllocation.groupBy({ by: ['coilId'], _sum: { qtyAllocated: true } });
  const allocBy = new Map(alloc.map((a) => [a.coilId, num(a._sum.qtyAllocated)]));
  for (const i of inv) {
    const [h, a, al, ho] = [num(i.qtyOnHand), num(i.qtyAvailable), num(i.qtyAllocated), num(i.qtyOnHold)];
    const tag = i.coil.coilNumber;
    if (h < -0.001 || a < -0.001 || al < -0.001 || ho < -0.001) problems.push(`${tag}: negative quantity (on hand ${h}, available ${a}, reserved ${al})`);
    if (Math.abs(h - (a + al + ho)) > 0.001) problems.push(`${tag}: on hand ${h} ≠ available ${a} + reserved ${al} + hold ${ho}`);
    if (Math.abs(al - (allocBy.get(i.coilId) || 0)) > 0.001) problems.push(`${tag}: reserved ${al} ≠ open reservations ${allocBy.get(i.coilId) || 0}`);
    if (i.locationId !== i.coil.locationId) problems.push(`${tag}: stock record and item record disagree on location`);
  }
  // Orders that existed before the QA fixtures are demo seed data. Their
  // inconsistencies are reported separately: they are not produced by the app.
  const since = (await prisma.location.findFirst({ where: { code: 'QA-L01' }, select: { createdAt: true } })).createdAt;
  const seedProblems = [];
  const stockProblems = problems.length;
  const orders = await prisma.order.findMany({ include: { lines: { include: { allocations: true } }, shipments: { include: { items: true } } } });
  for (const o of orders) {
    // Returns are not shipped, and counter quick sales are handed over the counter with no shipment.
    if (o.orderType === 'RETURN' || (o.poReference || '').startsWith('QS:')) continue;
    const problems = o.createdAt >= since ? allProblems : seedProblems;
    const priced = o.lines.length && o.lines.every((l) => l.extendedPrice != null);
    const sum = o.lines.reduce((t, l) => t + num(l.extendedPrice), 0);
    if (priced && o.subtotal != null && Math.abs(num(o.subtotal) - sum) > 0.01) problems.push(`${o.orderNumber}: subtotal ${num(o.subtotal)} ≠ lines ${sum.toFixed(2)}`);
    if (o.subtotal != null && o.totalAmount != null && Math.abs(num(o.totalAmount) - (num(o.subtotal) + num(o.taxAmount) + num(o.freightAmount))) > 0.01) problems.push(`${o.orderNumber}: total ${num(o.totalAmount)} ≠ subtotal + tax + freight`);
    for (const l of o.lines) {
      const out = o.shipments.filter((s) => ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'].includes(s.status)).flatMap((s) => s.items).filter((it) => it.orderLineId === l.id).reduce((t, it) => t + num(it.qtyShipped), 0);
      if (Math.abs(num(l.qtyShipped) - out) > 0.001) problems.push(`${o.orderNumber} line ${l.lineNumber}: shipped ${num(l.qtyShipped)} ≠ shipments that left ${out}`);
      if (num(l.qtyShipped) > num(l.qtyOrdered) + 0.001) problems.push(`${o.orderNumber} line ${l.lineNumber}: shipped more than ordered`);
      const held = l.allocations.reduce((t, x) => t + num(x.qtyAllocated), 0);
      if (held > num(l.qtyOrdered) - num(l.qtyShipped) + 0.001) problems.push(`${o.orderNumber} line ${l.lineNumber}: reserved ${held} > still open`);
      if (o.status === 'CANCELLED' && held > 0) problems.push(`${o.orderNumber}: cancelled but still holds stock`);
    }
    const live = o.lines.filter((l) => l.lineStatus !== 'CANCELLED');
    const allShipped = live.length > 0 && live.every((l) => num(l.qtyShipped) + 0.001 >= num(l.qtyOrdered));
    const anyShipped = live.some((l) => num(l.qtyShipped) > 0);
    if (allShipped && o.status !== 'COMPLETE') problems.push(`${o.orderNumber}: fully shipped but status is ${o.status}`);
    if (!allShipped && anyShipped && o.status !== 'PARTIAL') problems.push(`${o.orderNumber}: partly shipped but status is ${o.status}`);
    if (!anyShipped && ['PARTIAL', 'COMPLETE'].includes(o.status)) problems.push(`${o.orderNumber}: status ${o.status} with nothing shipped`);
  }
  // Money: every invoice, payment, credit and return in the database.
  const invoices = await prisma.invoice.findMany({ include: { lines: true, payments: true } });
  const shippedBy = new Map(orders.flatMap((o) => o.lines).map((l) => [l.id, num(l.qtyShipped)]));
  const billedBy = new Map();
  const creditedBy = new Map();
  for (const i of invoices) {
    const problems = i.createdAt >= since ? allProblems : seedProblems;
    if (cents(i.totalAmount) !== cents(i.subtotal) + cents(i.taxAmount) + cents(i.freightAmount)) problems.push(`${i.invoiceNumber}: total ≠ subtotal + tax + freight`);
    if (cents(i.subtotal) !== i.lines.reduce((t, l) => t + cents(l.extendedPrice), 0)) problems.push(`${i.invoiceNumber}: subtotal ≠ its lines`);
    if (cents(i.paidAmount) !== i.payments.reduce((t, x) => t + cents(x.amount), 0)) problems.push(`${i.invoiceNumber}: paid amount ≠ its payments`);
    if (Math.abs(cents(i.paidAmount)) > Math.abs(cents(i.totalAmount))) problems.push(`${i.invoiceNumber}: paid more than billed`);
    const settled = Math.abs(cents(i.paidAmount)) === Math.abs(cents(i.totalAmount));
    if (i.status === 'PAID' && !settled) problems.push(`${i.invoiceNumber}: marked paid with a balance`);
    if (['SENT', 'PARTIAL'].includes(i.status) && settled && cents(i.totalAmount) !== 0) problems.push(`${i.invoiceNumber}: settled but still ${i.status}`);
    if (i.status === 'CANCELLED') continue;
    if (i.kind === 'CREDIT') creditedBy.set(i.creditOfInvoiceId, (creditedBy.get(i.creditOfInvoiceId) || 0) - cents(i.totalAmount));
    else for (const l of i.lines) if (l.orderLineId) billedBy.set(l.orderLineId, (billedBy.get(l.orderLineId) || 0) + num(l.quantity));
  }
  for (const [lineId, qty] of billedBy) if (qty > (shippedBy.get(lineId) || 0) + 0.001) problems.push(`order line ${lineId}: invoiced ${qty} > shipped ${shippedBy.get(lineId) || 0}`);
  for (const i of invoices) if (i.kind === 'INVOICE' && (creditedBy.get(i.id) || 0) > cents(i.totalAmount)) problems.push(`${i.invoiceNumber}: credited more than billed`);
  const shipmentsOut = await prisma.shipment.findMany({ where: { status: { in: ['IN_TRANSIT', 'DELIVERED'] }, createdAt: { gte: since } }, select: { id: true, shipmentNumber: true } });
  const billedShipments = new Set(invoices.filter((i) => i.kind === 'INVOICE' && i.status !== 'CANCELLED').map((i) => i.shipmentId));
  for (const sh of shipmentsOut) if (!billedShipments.has(sh.id)) problems.push(`${sh.shipmentNumber}: left the dock with no invoice`);
  const returnedBy = new Map();
  for (const o of orders.filter((x) => x.orderType === 'RETURN' && x.status !== 'CANCELLED')) {
    for (const l of o.lines) if (l.lineStatus !== 'CANCELLED') returnedBy.set(l.returnOfLineId, (returnedBy.get(l.returnOfLineId) || 0) + num(l.qtyOrdered));
  }
  for (const [lineId, qty] of returnedBy) if (qty > (shippedBy.get(lineId) || 0) + 0.001) problems.push(`order line ${lineId}: returned ${qty} > shipped ${shippedBy.get(lineId) || 0}`);
  const moves = await prisma.materialMovement.groupBy({ by: ['shipmentId'], where: { movementType: 'SHIP', shipmentId: { not: null } }, _sum: { qtyMoved: true } });
  const dup = await prisma.$transaction([prisma.order.count(), prisma.job.count(), prisma.shipment.count()]);
  report.reconciliation = { pass: problems.length === 0, invoices: invoices.length, returns: orders.filter((x) => x.orderType === 'RETURN').length, stockItems: inv.length, orders: orders.length, shipmentsWithStockMovement: moves.length, ordersFromThisQaRun: orders.filter((o) => o.createdAt >= since).length, totals: { orders: dup[0], jobs: dup[1], shipments: dup[2] }, problems: problems.slice(0, 50), problemCount: problems.length, stockProblems, demoSeedDataProblems: { count: seedProblems.length, examples: seedProblems.slice(0, 5) } };
}

async function main() {
  ctx = await loadContext();
  for (const w of ['admin', 'csr', 'operator', 'shipping', 'custA', 'custB']) await A.login(w);
  const plan = [];
  for (const [cat, n] of MIX) for (let i = 0; i < n; i++) plan.push([cat, i]);
  while (plan.length < JOBS) plan.push([R.pick(MIX)[0], plan.length]);
  const scenarios = [];
  for (let k = 0; k < plan.length; k++) {
    const [cat, i] = plan[k];
    const sc = await runScenario(cat, i, `S${SEED}-${String(k + 1).padStart(2, '0')}`);
    scenarios.push(sc);
    process.stdout.write(sc.result === 'PASS' ? '.' : sc.result[0]);
  }
  const report = { seed: SEED, base: BASE, at: new Date().toISOString(), scenarios };
  await concurrency(report);
  await reconcile(report);
  const tally = scenarios.reduce((t, s) => ({ ...t, [s.result]: (t[s.result] || 0) + 1 }), {});
  const failedSteps = {}; const failedChecks = {};
  for (const s of scenarios) {
    for (const st of s.steps.filter((x) => !x.ok)) { const k = st.name.replace(/[A-Z]+-L\d+-S\d+|JOB-\d+|SHP-\d+|\d+ lb|QA-L\d+(-\w+)?/g, '…'); (failedSteps[k] ||= []).push(`${s.id}: ${st.status} ${st.body || ''}`.slice(0, 220)); }
    for (const c of s.invariants.filter((x) => !x.ok)) { const k = c.name.replace(/QA-L\d+-S\d+|line \d+/g, '…'); (failedChecks[k] ||= []).push(`${s.id}: ${c.detail}`); }
  }
  const clean = !tally.FAIL && !tally.ERROR && report.concurrency.pass && report.reconciliation.pass;
  report.summary = { clean, tally, steps: scenarios.reduce((n, s) => n + s.steps.length, 0), checks: scenarios.reduce((n, s) => n + s.invariants.length, 0), failedSteps, failedChecks };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  console.log(`\n${JSON.stringify(tally)} — ${report.summary.steps} API steps, ${report.summary.checks} checks → ${OUT}`);
  console.log(clean ? 'CYCLE CLEAN' : 'CYCLE NOT CLEAN');
  for (const c of report.concurrency.probes) console.log(`concurrency ${c.pass ? '✓' : '✗'} ${c.name} — ${c.detail}`);
  console.log(`reconciliation ${report.reconciliation.pass ? '✓' : '✗'} ${report.reconciliation.stockItems} stock items, ${report.reconciliation.ordersFromThisQaRun} orders, ${report.reconciliation.problemCount} problems (plus ${report.reconciliation.demoSeedDataProblems.count} in demo seed data)`);
  for (const x of report.reconciliation.problems.slice(0, 12)) console.log('  recon ✗', x);
  for (const [k, v] of Object.entries(failedSteps)) console.log(`STEP ✗ ${k} ×${v.length}  e.g. ${v[0]}`);
  for (const [k, v] of Object.entries(failedChecks)) console.log(`CHECK ✗ ${k} ×${v.length}  e.g. ${v[0]}`);
}
main().finally(() => prisma.$disconnect());
