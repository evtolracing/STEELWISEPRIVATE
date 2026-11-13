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
  ['standard-metals', 8], ['multi-step-metals', 6], ['plastics', 6], ['pos-ecommerce', 5],
  ['multi-location', 6], ['transfers-receiving', 5], ['rush-backorder-exception', 5],
  ['partial-rework-return', 5], ['mixed-division', 4],
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
  return { locs, customers, products, admin: await prisma.user.findUnique({ where: { email: 'qa-admin@qa.test' } }) };
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
  const r = await step(sc, 'create sales order', () => A.post('/api/orders', {
    orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal, totalAmount: subtotal, poReference: `QA-${sc.id}`, lines, ...extra,
  }));
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
  check(sc, 'order created by the signed-in user', o.createdById === (createdBy || ctx.admin.id), `createdById ${o.createdById}`);
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
  // Negative path: a shipped order cannot be shipped again.
  await ship(sc, order, loc, [[ol[0], 1]], '4xx');
}

async function multiLocation(sc) {
  const [home, remote] = [pickLoc(['METALS', 'MIXED']), pickLoc(['METALS', 'MIXED'])];
  const stock = R.pick(await stockAt(remote.id));
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
  const [a, b] = [pickLoc(['METALS', 'MIXED', 'OUTLET']), pickLoc(['METALS', 'MIXED', 'OUTLET'])];
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
    await runJob(sc, j, ['IN_PROCESS', 'WAITING_QC', 'ON_HOLD', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP']);
    const s = await ship(sc, order, loc, [[order.lines[0], qty]]);
    if (s) await dispatchDeliver(sc, s);
    await checkOrderBooks(sc, order.id, { expectStatus: 'COMPLETE' });
    await checkInventory(sc, [stock.coilId]);
    return;
  }
  // Returns: the app has a RETURN order type but no return/RMA endpoint.
  sc.result = 'BLOCKED';
  sc.notes.push('No API to receive a customer return (Order type RETURN exists, but no endpoint creates or processes one).');
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
    if (soId) await checkOrderBooks(sc, soId);
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

/**
 * Known open defects that need a business decision before they can be fixed.
 * Each probe re-checks that the defect is still there, so the report never
 * goes quiet about it. These do not count as scenarios.
 */
async function openDefectProbes(report) {
  const probes = [];
  const sale = await A.post('/api/pos/quick-sale/create', { customerType: 'CASH', locationId: ctx.locs[0].id }, 'csr');
  const saleId = sale.body?.id || sale.body?.saleId;
  const add = saleId ? await A.post(`/api/pos/quick-sale/${saleId}/add-item`, { product: { id: 'QA-SKU', sku: 'CUT-DISC-9', name: 'Cut-Off Disc', price: 6.49, unitPrice: 6.49 }, quantity: 3 }, 'csr') : sale;
  probes.push({ id: 'D-014', what: 'Counter quick sale cannot add an item or take payment', stillPresent: !ok2xx(add.status), evidence: `${add.status} ${JSON.stringify(add.body).slice(0, 120)}` });
  const ret = await A.post('/api/returns', {}, 'csr');
  probes.push({ id: 'D-015', what: 'No way to record a customer return', stillPresent: ret.status === 404, evidence: `POST /api/returns → ${ret.status}` });
  const inv = await A.post('/api/invoices', {}, 'csr');
  probes.push({ id: 'D-016', what: 'No way to create an invoice or record a payment', stillPresent: inv.status === 404, evidence: `POST /api/invoices → ${inv.status}` });
  report.openDefectProbes = probes;
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
    const o = (await A.post('/api/orders', { orderType: 'SO', buyerId: ctx.customers[3].id, status: 'CONFIRMED', lines: [lineFor(stock, want)] })).body;
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
  const moves = await prisma.materialMovement.groupBy({ by: ['shipmentId'], where: { movementType: 'SHIP', shipmentId: { not: null } }, _sum: { qtyMoved: true } });
  const dup = await prisma.$transaction([prisma.order.count(), prisma.job.count(), prisma.shipment.count()]);
  report.reconciliation = { pass: problems.length === 0, stockItems: inv.length, orders: orders.length, shipmentsWithStockMovement: moves.length, ordersFromThisQaRun: orders.filter((o) => o.createdAt >= since).length, totals: { orders: dup[0], jobs: dup[1], shipments: dup[2] }, problems: problems.slice(0, 50), problemCount: problems.length, stockProblems, demoSeedDataProblems: { count: seedProblems.length, examples: seedProblems.slice(0, 5) } };
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
  await openDefectProbes(report);
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
  for (const d of report.openDefectProbes) console.log(`open defect ${d.id} ${d.stillPresent ? 'still present' : 'NO LONGER REPRODUCES'}: ${d.what}`);
  for (const [k, v] of Object.entries(failedSteps)) console.log(`STEP ✗ ${k} ×${v.length}  e.g. ${v[0]}`);
  for (const [k, v] of Object.entries(failedChecks)) console.log(`CHECK ✗ ${k} ×${v.length}  e.g. ${v[0]}`);
}
main().finally(() => prisma.$disconnect());
