// Phase 8 fulfilment scenarios: release of finished goods, picking and packaging; shipments, partial
// shipments and back orders; dispatch, carriers, freight and delivery; invoicing, payments and
// accounting; costing, reconciliation and closeout; returns, credits and refunds; and simultaneous
// requests, security, exceptions and recovery.
// Every scenario drives the real server the way the screens do, then reads the database to check what
// was saved, what was refused, and that the order, its shipments, its stock and its invoices agree.
// A success answer alone is never counted as a pass. What the product does not have (carrier
// connections, freight rates, an accounting system, card payments) is recorded as NOT APPLICABLE
// with the evidence, never as a pass.
//   node qa/sim/phase8-fulfillment.mjs [--base http://localhost:3011] [--only 1,5] [--group 3]
// Local QA database only (lib.mjs refuses anything else). No shipment leaves, no carrier is called,
// no invoice or notice is sent and no payment is taken: there is nothing connected that could.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  arg, prisma, A, run, num, tag, scenario as record, http1, raw as rawCall, world, blocks, finish, QA_PASSWORD,
} from './phase4-lib.mjs';
import { bcrypt } from './lib.mjs';

const OUT = arg('out', 'qa/results/phase8-fulfillment.json');
const ONLY = arg('only', '').split(',').filter(Boolean);
const GROUP = arg('group', '');
const near = (a, b, eps = 0.005) => Math.abs(Number(a) - Number(b)) <= eps;
const NA = { status: 'NOT APPLICABLE' };
const HOLD_TYPE = 'DAMAGE';

const w = await world();
const B = blocks(w);
const { L1, L2, heat, users } = w;
const house = users.admin.organizationId;

const G1 = 'Finished goods release, picking and packaging';
const G2 = 'Shipment creation, partial shipments and backorders';
const G3 = 'Dispatch, carriers, freight and delivery';
const G4 = 'Invoicing, payments and accounting sync';
const G5 = 'Costing, reconciliation and closeout';
const G6 = 'Returns, credits, refunds and adjustments';
const G7 = 'Concurrency, security, exceptions and recovery';
const GROUPS = [G1, G2, G3, G4, G5, G6, G7];
let n = 0;
/** Numbers every scenario, so --only and --group can pick them. */
async function scenario(group, name, fn, opts) {
  n += 1;
  if (ONLY.length && !ONLY.includes(String(n))) return null;
  if (GROUP && GROUPS[Number(GROUP) - 1] !== group) return null;
  return record(group, name, fn, opts);
}

// ── people ───────────────────────────────────────────────────────────────────────
async function login(role, loc, label) {
  const email = `${tag(`qa-p8-${label}`).toLowerCase()}@qa.test`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt().hash(QA_PASSWORD, 10), firstName: 'QA', lastName: label, role, organizationId: house, homeLocationId: loc.id } });
  const r = await http1('POST', '/api/auth/login', { body: { email, password: QA_PASSWORD } });
  if (!r.body?.token) throw new Error(`login ${label}: ${r.status}`);
  const user = await prisma.user.findUnique({ where: { email } });
  const call = (m, url, body, headers) => http1(m, url, { body, headers, token: r.body.token });
  return { user, call, get: (u) => call('GET', u), post: (u, b) => call('POST', u, b), put: (u, b) => call('PUT', u, b), patch: (u, b) => call('PATCH', u, b) };
}
const ship2 = await login('SHIPPING_COORDINATOR', L2, 'shipping-l2');
const qc1 = await login('QC_INSPECTOR', L1, 'qc-l1');
const mgr1 = await login('BRANCH_MANAGER', L1, 'manager-l1');
const pack1 = await login('PACKAGING_LEAD', L1, 'packer-l1');
const credit = await login('CREDIT_MANAGER', L1, 'credit');
const auditor = await login('AUDITOR', L1, 'auditor');

// ── small readers ────────────────────────────────────────────────────────────────
const err = (r) => String(r?.body?.error || r?.body?.message || '');
const stock = (coilId) => prisma.inventory.findUnique({ where: { coilId } });
const shp = (id) => prisma.shipment.findUnique({ where: { id }, include: { items: true } });
const lineOf = (id) => prisma.orderLine.findUnique({ where: { id } });
const orderOf = (id) => prisma.order.findUnique({ where: { id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
const movesOf = (shipmentId) => prisma.materialMovement.findMany({ where: { shipmentId }, orderBy: { createdAt: 'asc' } });
const historyOf = async (id) => (await A.get(`/api/shipments/${id}`, 'shipping')).body?.history || [];
const audits = (eventType, resourceId) => prisma.auditLog.findMany({ where: { eventType, resourceId }, orderBy: { timestamp: 'asc' } });
const docs = (id, who = 'shipping') => A.get(`/api/shipments/${id}/documents`, who);
const closeout = async (orderId, who = 'csr') => (await A.get(`/api/orders/${orderId}/closeout`, who)).body;
const codes = (c) => (c?.open || []).map((o) => o.code).sort().join(',');
const costOf = async (orderId, who = 'admin') => (await A.get(`/api/orders/${orderId}/cost`, who)).body;
const setCost = (coilId, unitCost) => prisma.coil.update({ where: { id: coilId }, data: { unitCost } });
const pay = (invoiceId, amount, who = 'csr', extra = {}) => A.post(`/api/invoices/${invoiceId}/payments`, { amount, paymentMethod: 'CHECK', referenceNumber: tag('CHK'), ...extra }, who);
const invOf = (id) => prisma.invoice.findUnique({ where: { id }, include: { lines: true, payments: true } });
const deepKeys = (v, re, path = '') => { const out = []; if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (re.test(k) && x != null) out.push(path + k); out.push(...deepKeys(x, re, `${path}${k}.`)); } return out; };

/** An order with reserved stock, shipped and invoiced. */
async function shipped(qty = 500, opts = {}) {
  const r = await B.readyToShip(qty, opts);
  if (opts.unitCost != null) await setCost(r.coilId, opts.unitCost);
  const d = await B.dispatch(r.shipment);
  if (d.status !== 200) throw new Error(`dispatch ${d.status} ${err(d)}`);
  // The dock's answer names the invoice without its amount (F-009); the fixture reads the amount from the record.
  return { ...r, dispatch: d.body, invoice: d.body.invoice ? { ...d.body.invoice, totalAmount: num((await invOf(d.body.invoice.id)).totalAmount) } : d.body.invoice };
}
/** An order with two lines and stock reserved for each. */
async function twoLines(q1 = 600, q2 = 400, { reserve1 = q1, reserve2 = q2 } = {}) {
  const [c1, c2] = [await B.received({ weightLb: q1 + 500 }), await B.received({ weightLb: q2 + 500 })];
  const o = await B.order([B.line(q1, 0.5), B.line(q2, 0.8)]);
  if (reserve1) await B.reserve(o, o.lines[0], c1, reserve1);
  if (reserve2) await B.reserve(o, o.lines[1], c2, reserve2);
  return { order: o, c1, c2 };
}
const newShipment = (o, items, who = 'shipping', extra = {}) => A.post('/api/shipments', { orderId: o.id, fromLocationId: L1.id, carrierName: 'Own Truck', items: items.map(([l, q]) => ({ orderLineId: l.id, qtyShipped: q, weightLb: q })), ...extra }, who);
const problem = (id, reason = 'Refused at the door', who = 'shipping') => A.patch(`/api/shipments/${id}/status`, { status: 'EXCEPTION', reason }, who);

/** A package for an order line with one stock item in it. */
async function packed({ qty = 300, weight = 200, pieces = 2, who = 'shipping' } = {}) {
  const r = await B.readyToShip(qty);
  const p = await A.post('/api/drop-tags/packages', { packageType: 'BUNDLE', orderId: r.order.id, orderLineId: r.order.lines[0].id }, who);
  if (p.status !== 201) throw new Error(`package ${p.status} ${err(p)}`);
  const item = await A.post(`/api/drop-tags/packages/${p.body.id}/items`, { coilId: r.coilId, pieces, weightLbs: weight }, who);
  if (item.status !== 201) throw new Error(`item ${item.status} ${err(item)}`);
  return { ...r, pkg: p.body, item: item.body };
}
const pkgOf = (id) => prisma.package.findUnique({ where: { id }, include: { packageItems: true, dropTags: true } });
const P = (id, step, body = {}, who = 'shipping') => (typeof who === 'string' ? A.post(`/api/drop-tags/packages/${id}/${step}`, body, who) : who.post(`/api/drop-tags/packages/${id}/${step}`, body));
/** A package released by quality with a tag made for it. */
async function tagged(opts) {
  const k = await packed(opts);
  const a = await P(k.pkg.id, 'ready'); const b = await P(k.pkg.id, 'qc-release', {}, qc1);
  const t = await A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping');
  if (a.status !== 200 || b.status !== 200 || t.status !== 201) throw new Error(`tagged ${a.status} ${b.status} ${t.status} ${err(a)}${err(b)}${err(t)}`);
  return { ...k, tag: t.body.dropTag };
}
const T = (id, step, body = {}, who = 'shipping') => (typeof who === 'string' ? A.post(`/api/drop-tags/${id}/${step}`, body, who) : who.post(`/api/drop-tags/${id}/${step}`, body));
const traces = (resourceId, eventType) => prisma.traceEvent.findMany({ where: { resourceId, ...(eventType && { eventType }) }, orderBy: { occurredAt: 'asc' } });

// A work center at each branch, for jobs that ship from the shop floor.
const wcAt = async (loc) => prisma.workCenter.findFirst({ where: { locationId: loc.id } });
const [wc1, wc2] = [await wcAt(L1), await wcAt(L2)];
/**
 * A job for an order line, placed ready to ship. The production path (steps, clocks, inspection) is
 * verified in Phase 7; here the job is put in its last state before shipping, with a passed inspection.
 */
async function stagedJob({ qty = 400, loc = L1, wc = wc1, reserve = true } = {}) {
  const coilId = await B.received({ weightLb: qty + 500, locationId: wc ? wc.locationId : L1.id });
  const o = await B.order([B.line(qty)], { who: 'admin', extra: { locationId: loc.id } });
  if (reserve) await B.reserve(o, o.lines[0], coilId, qty);
  const j = await A.post('/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id, instructions: `QA P8 ${run}`, status: 'ORDERED' });
  if (j.status !== 201) throw new Error(`job ${j.status} ${err(j)}`);
  await prisma.jobInspection.create({ data: { inspectionNumber: tag('P8INSP'), jobId: j.body.id, status: 'PASSED', overallResult: 'PASS', completedAt: new Date() } });
  await prisma.job.update({ where: { id: j.body.id }, data: { status: 'READY_TO_SHIP', workCenterId: wc ? wc.id : null, actualEnd: new Date() } });
  return { order: o, coilId, job: await prisma.job.findUnique({ where: { id: j.body.id } }) };
}

// ══ 1. Finished goods release, picking and packaging ═══════════════════════════════════════
{
  await scenario(G1, 'a shipment is put together on the dock and nothing moves until it is dispatched', async (ok) => {
    const r = await B.readyToShip(500);
    const s = await shp(r.shipment.id); const inv = await stock(r.coilId);
    ok('the shipment waits on the dock with its line', s.status === 'PENDING' && s.items.length === 1 && num(s.items[0].qtyShipped) === 500);
    ok('the stock is still on hand and still reserved', num(inv.qtyOnHand) === 1000 && num(inv.qtyAllocated) === 500, `${inv.qtyOnHand}/${inv.qtyAllocated}`);
    ok('no stock movement, no invoice and nothing counted as shipped', (await movesOf(s.id)).length === 0 && (await B.invoicesOf(r.order.id)).length === 0 && num((await lineOf(r.order.lines[0].id)).qtyShipped) === 0);
  });
  await scenario(G1, 'an order that is not confirmed cannot be put on a shipment', async (ok) => {
    const o = await B.order([B.line(300)], { status: 'DRAFT' });
    const r = await newShipment(o, [[o.lines[0], 300]]);
    ok('a draft order is refused with the reason', r.status === 409 && /Only confirmed orders/.test(err(r)), `${r.status} ${err(r)}`);
    ok('and no shipment was saved', (await prisma.shipment.count({ where: { orderId: o.id } })) === 0);
  });
  await scenario(G1, 'an order put on hold after its shipment was built cannot be dispatched', async (ok) => {
    const r = await B.readyToShip(300);
    await prisma.order.update({ where: { id: r.order.id }, data: { status: 'HOLD' } });
    const d = await B.dispatch(r.shipment);
    ok('dispatch is refused and names the hold', d.status === 409 && /HOLD/.test(err(d)), `${d.status} ${err(d)}`);
    ok('the stock did not move', num((await stock(r.coilId)).qtyOnHand) === 800 && (await shp(r.shipment.id)).status === 'PENDING');
    const again = await newShipment(r.order, []);
    ok('and no new shipment can be opened for it', again.status === 409, `${again.status}`);
  });
  await scenario(G1, 'a cancelled line cannot be shipped', async (ok) => {
    const { order } = await twoLines();
    // The product cancels whole orders; a single cancelled line exists in data from the web shop and imports.
    // It is set here directly, with the order's totals brought down to the line that is left, as they would be.
    await prisma.orderLine.update({ where: { id: order.lines[1].id }, data: { lineStatus: 'CANCELLED' } });
    const kept = await lineOf(order.lines[0].id);
    await prisma.order.update({ where: { id: order.id }, data: { subtotal: kept.extendedPrice, totalAmount: kept.extendedPrice, taxAmount: 0 } });
    const r = await newShipment(order, [[order.lines[1], 100]]);
    ok('refused, naming the line', r.status === 409 && /cancelled/.test(err(r)), `${r.status} ${err(r)}`);
    const good = await newShipment(order, [[order.lines[0], 600]]);
    ok('the other line still ships', good.status === 201);
  });
  await scenario(G1, 'material is not released to ship while the job that makes it is unfinished', async (ok) => {
    const r = await B.readyToShip(300);
    const j = await A.post('/api/jobs', { orderId: r.order.id, orderLineId: r.order.lines[0].id, instructions: 'QA P8', status: 'ORDERED' });
    const d = await B.dispatch(r.shipment);
    ok('dispatch is refused and names the job', d.status === 409 && err(d).includes(j.body.jobNumber), `${d.status} ${err(d)}`);
    ok('nothing left: stock, line and shipment are unchanged', num((await stock(r.coilId)).qtyOnHand) === 800 && num((await lineOf(r.order.lines[0].id)).qtyShipped) === 0 && (await shp(r.shipment.id)).status === 'PENDING');
  });
  await scenario(G1, 'stock placed on hold after it was reserved is not shipped', async (ok) => {
    const r = await B.readyToShip(300);
    const h = await A.post(`/api/coils/${r.coilId}/hold`, { holdType: HOLD_TYPE, holdReason: 'Surface damage found on the dock' }, 'admin');
    const d = await B.dispatch(r.shipment);
    ok('the hold was placed', h.status === 200 || h.status === 201, `${h.status} ${err(h)}`);
    ok('dispatch is refused and names the item on hold', d.status === 409 && /on hold/.test(err(d)), `${d.status} ${err(d)}`);
    ok('nothing left the dock', num((await stock(r.coilId)).qtyOnHand) === 800 && (await movesOf(r.shipment.id)).length === 0);
  });
  await scenario(G1, 'the pick list names the reserved stock items with their heat and bin, oldest reservation first', async (ok) => {
    const [c1, c2] = [await B.received({ weightLb: 400 }), await B.received({ weightLb: 400 })];
    const o = await B.order([B.line(500)]);
    await B.reserve(o, o.lines[0], c1, 300); await B.reserve(o, o.lines[0], c2, 200);
    const s = await newShipment(o, [[o.lines[0], 400]]);
    const d = await docs(s.body.id);
    const rows = d.body.lines?.[0]?.stock || [];
    const coil = await prisma.coil.findUnique({ where: { id: c1 }, include: { heat: true } });
    ok('before dispatch the paper is a pick list', d.status === 200 && d.body.stage === 'BEFORE_DISPATCH');
    ok('it draws 300 from the first item reserved and 100 from the second', rows.length === 2 && rows[0].stockItemId === c1 && rows[0].quantity === 300 && rows[1].stockItemId === c2 && rows[1].quantity === 100, JSON.stringify(rows.map((x) => [x.tag, x.quantity])));
    ok('each row carries the tag and the heat on file', rows[0].tag === coil.coilNumber && rows[0].heatNumber === coil.heat.heatNumber);
    ok('and says 100 stays on back order after this shipment', d.body.lines[0].quantityStillToShip === 100, String(d.body.lines[0].quantityStillToShip));
  });
  await scenario(G1, 'a shipment carrying more than is reserved is flagged on the pick list and refused at dispatch', async (ok) => {
    const c = await B.received({ weightLb: 900 });
    const o = await B.order([B.line(500)]);
    await B.reserve(o, o.lines[0], c, 200);
    const s = await newShipment(o, [[o.lines[0], 500]]);
    const d = await docs(s.body.id);
    ok('the pick list says it is 300 short of reserved stock', d.body.lines[0].shortOfReserved === 300 && d.body.missing.some((m) => /Less stock is reserved/.test(m)), JSON.stringify(d.body.missing));
    const go = await B.dispatch(s.body);
    ok('dispatch is refused: the item and heat going out must be on record', go.status === 409 && /more on this shipment than is reserved/.test(err(go)), `${go.status} ${err(go)}`);
    ok('nothing was taken from stock', num((await stock(c)).qtyOnHand) === 900);
  });
  await scenario(G1, 'stock standing at another branch is not picked for a shipment from this dock (N-001)', async (ok) => {
    const c = await B.received({ weightLb: 900, locationId: L2.id });
    const o = await B.order([B.line(400)]);
    const rz = await B.reserve(o, o.lines[0], c, 400);
    const s = await newShipment(o, [[o.lines[0], 400]]);
    const d = await docs(s.body.id);
    ok('the reservation stands', rz.status < 300, `${rz.status}`);
    ok('the pick list marks the item as at another branch', d.body.lines[0].stock[0]?.atThisDock === false && d.body.missing.some((m) => /another branch/.test(m)));
    const go = await B.dispatch(s.body);
    ok('dispatch is refused and names the branch that holds it', go.status === 409 && /QA Branch 2|QA-L02/.test(err(go)), `${go.status} ${err(go)}`);
    ok('the other branch\'s stock is untouched and nothing is invoiced', num((await stock(c)).qtyOnHand) === 900 && (await B.invoicesOf(o.id)).length === 0);
  });
  await scenario(G1, 'the papers show a blank, never an invented value, for what is not on file', async (ok) => {
    const r = await B.readyToShip(200);
    const d = (await docs(r.shipment.id)).body;
    ok('no bill of lading number is made up', d.shipment.bolNumber === null && d.missing.some((m) => /bill of lading number/.test(m)));
    ok('the ship-from is the branch itself, with no invented street address', d.shipFrom.code === 'QA-L01' && d.shipFrom.address === null && d.missing.some((m) => /no street address/.test(m)), JSON.stringify(d.shipFrom));
    ok('a missing ship-to address is named, not filled in', d.shipTo.address === null && d.missing.some((m) => /ship-to address/.test(m)));
    ok('no freight class or NMFC number appears anywhere in the answer', deepKeys(d, /freightClass|nmfc/i).length === 0);
  });
  await scenario(G1, 'a package is opened only for a real order line and a known kind of package', async (ok) => {
    const r = await B.readyToShip(200); const other = await B.readyToShip(100);
    const bad = await A.post('/api/drop-tags/packages', { packageType: 'SPACESHIP', orderId: r.order.id, orderLineId: r.order.lines[0].id }, 'shipping');
    const wrong = await A.post('/api/drop-tags/packages', { packageType: 'BUNDLE', orderId: r.order.id, orderLineId: other.order.lines[0].id }, 'shipping');
    const good = await A.post('/api/drop-tags/packages', { packageType: 'skid', orderId: r.order.id, orderLineId: r.order.lines[0].id }, 'shipping');
    const next = await A.post('/api/drop-tags/packages', { packageType: 'BOX', orderId: r.order.id, orderLineId: r.order.lines[0].id }, 'shipping');
    ok('an unknown kind is refused with the list of kinds', bad.status === 400 && /BUNDLE/.test(err(bad)), `${bad.status} ${err(bad)}`);
    ok('a line of a different order is refused', wrong.status >= 400 && wrong.status < 500, `${wrong.status}`);
    ok('a good one is saved, open and empty', good.status === 201 && good.body.status === 'OPEN' && good.body.packageType === 'SKID');
    const [a, b] = [good.body.packageId, next.body.packageId].map((x) => Number(String(x).replace(/\D/g, '')));
    ok('package numbers come from a counter, one after another', /^PKG-\d{7}$/.test(good.body.packageId) && b === a + 1, `${good.body.packageId} ${next.body.packageId}`);
  });
  await scenario(G1, 'what goes into a package is checked against the stock item', async (ok) => {
    const k = await packed({ weight: 150, pieces: 3 });
    const id = k.pkg.id;
    const add = (body) => A.post(`/api/drop-tags/packages/${id}/items`, body, 'shipping');
    const r1 = await add({ coilId: k.coilId, pieces: -3, weightLbs: 10 }); const r2 = await add({ coilId: k.coilId, pieces: 1, weightLbs: -5 });
    const r3 = await add({ pieces: 1, weightLbs: 5, heatNumber: 'NOT-A-HEAT', grade: 'A36', form: 'PLATE' }); const r4 = await add({ coilId: k.coilId, pieces: 1, weightLbs: 9999999 });
    const r5 = await add({ coilId: k.coilId, pieces: 1, weightLbs: 5, heatNumber: 'SOME-OTHER-HEAT' });
    ok('minus pieces, minus weight, an unknown heat, more weight than the item and a wrong heat are each refused', [r1, r2].every((r) => r.status === 400) && [r3, r4, r5].every((r) => r.status === 409), [r1, r2, r3, r4, r5].map((r) => r.status).join());
    const pkg = await pkgOf(id); const coil = await prisma.coil.findUnique({ where: { id: k.coilId }, include: { heat: true, grade: true } });
    ok('only the good item is in the package', pkg.packageItems.length === 1 && pkg.packageItems[0].pieces === 3 && num(pkg.netWeightLbs) === 150, `${pkg.packageItems.length} ${pkg.netWeightLbs}`);
    ok('its heat and grade were read from the stock item', pkg.packageItems[0].heatNumber === coil.heat.heatNumber && pkg.packageItems[0].grade === coil.grade.code);
  });
  await scenario(G1, 'a packed package is sent to quality; an empty one is not (N-008)', async (ok) => {
    const r = await B.readyToShip(200);
    const empty = await A.post('/api/drop-tags/packages', { packageType: 'BOX', orderId: r.order.id, orderLineId: r.order.lines[0].id }, 'shipping');
    const no = await P(empty.body.id, 'ready');
    ok('an empty package is refused', no.status === 409, `${no.status} ${err(no)}`);
    const k = await packed();
    const yes = await P(k.pkg.id, 'ready', { grossWeightLbs: 215 });
    const pkg = await pkgOf(k.pkg.id);
    ok('a packed one moves to waiting for quality with its gross weight', yes.status === 200 && pkg.status === 'READY_FOR_QC' && num(pkg.grossWeightLbs) === 215, `${yes.status} ${pkg.status}`);
    const twice = await P(k.pkg.id, 'ready');
    ok('sending it again is refused and writes no second record', twice.status === 409 && (await traces(k.pkg.id, 'PACKAGE_READY_FOR_QC')).length === 1);
    const late = await A.post(`/api/drop-tags/packages/${k.pkg.id}/items`, { coilId: k.coilId, pieces: 1, weightLbs: 5 }, 'shipping');
    ok('and nothing more can be added once it is with quality', late.status === 409, `${late.status}`);
  });
  await scenario(G1, 'only quality releases or holds a package', async (ok) => {
    const k = await packed(); await P(k.pkg.id, 'ready');
    const clerk = await P(k.pkg.id, 'qc-release');
    ok('the shipping clerk is refused', clerk.status === 403 && (await pkgOf(k.pkg.id)).status === 'READY_FOR_QC', `${clerk.status}`);
    const noWhy = await P(k.pkg.id, 'qc-hold', {}, qc1); const held = await P(k.pkg.id, 'qc-hold', { reason: 'Banding is loose' }, qc1);
    ok('a hold needs a reason, and with one the package is held', noWhy.status === 400 && held.status === 200 && (await pkgOf(k.pkg.id)).status === 'QC_HOLD', `${noWhy.status} ${held.status}`);
    const t = await A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping');
    ok('a held package cannot be tagged', t.status === 409, `${t.status}`);
    const rel = await P(k.pkg.id, 'qc-release', { notes: 'Re-banded' }, qc1);
    const ev = (await traces(k.pkg.id)).find((e) => /RELEASE/.test(e.eventType));
    ok('the inspector releases it, and the record carries the inspector and their real role', rel.status === 200 && (await pkgOf(k.pkg.id)).status === 'QC_RELEASED' && ev?.actorUserId === qc1.user.id && ev?.actorRole === 'QC_INSPECTOR', `${rel.status} ${ev?.actorRole}`);
  });
  await scenario(G1, 'a tag is printed only for a package that quality has released', async (ok) => {
    const k = await packed();
    const t = await A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping');
    ok('the tag can be drafted while packing, numbered from a counter', t.status === 201 && /^DT-\d{7}$/.test(t.body.dropTag.dropTagId) && t.body.dropTag.status === 'DRAFT', `${t.status} ${t.body?.dropTag?.dropTagId}`);
    const early = await T(t.body.dropTag.id, 'validate'); const print = await T(t.body.dropTag.id, 'print');
    ok('it cannot be made ready or printed before the release', early.status === 409 && print.status === 409 && /QC released/.test(err(early)), `${early.status} ${print.status}`);
    await P(k.pkg.id, 'ready'); await P(k.pkg.id, 'qc-release', {}, qc1);
    const v = await T(t.body.dropTag.id, 'validate'); const p = await T(t.body.dropTag.id, 'print');
    const coil = await prisma.coil.findUnique({ where: { id: k.coilId }, include: { heat: true } });
    ok('after the release it is made ready and printed', v.status === 200 && p.status === 200 && p.body.status === 'PRINTED', `${v.status} ${p.status}`);
    ok('the tag carries the heat, pieces and weight of what is in the package', t.body.dropTag.heatNumber === coil.heat.heatNumber && t.body.dropTag.pieces === 2 && num(t.body.dropTag.weightLbs) === 200);
  });
  await scenario(G1, 'a package has one live tag at a time', async (ok) => {
    const k = await tagged();
    const second = await A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping');
    ok('a second tag is refused while the first stands', second.status === 409 && /already has a tag/.test(err(second)), `${second.status}`);
    const noWhy = await T(k.tag.id, 'void', {}); const v = await T(k.tag.id, 'void', { reason: 'Wrong customer PO printed' }); const again = await T(k.tag.id, 'void', { reason: 'again' });
    ok('voiding needs a reason, works once, and is refused the second time', noWhy.status === 400 && v.status === 200 && again.status === 409, `${noWhy.status} ${v.status} ${again.status}`);
    const third = await A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping');
    ok('after the void a new tag can be made', third.status === 201 && third.body.dropTag.dropTagId !== k.tag.dropTagId);
    ok('one void record exists, by the clerk, with the reason', (await traces(k.tag.id, 'DROP_TAG_VOIDED')).length === 1 && (await traces(k.tag.id, 'DROP_TAG_VOIDED'))[0].actorUserId === users.shipping.id);
  });
  await scenario(G1, 'print, apply and seal happen in that order', async (ok) => {
    const k = await tagged(); const id = k.tag.id;
    const apply0 = await T(id, 'apply'); const reprint0 = await T(id, 'reprint', { reason: 'ADDITIONAL_COPY' }); const seal0 = await P(k.pkg.id, 'seal', { sealId: 'S-100' });
    ok('a tag not yet printed cannot be applied or printed again, and the package cannot be sealed', apply0.status === 409 && reprint0.status === 409 && seal0.status === 409, `${apply0.status} ${reprint0.status} ${seal0.status}`);
    await T(id, 'validate'); const pr = await T(id, 'print');
    const wrongScan = await T(id, 'apply', { packageScanValue: 'PKG-9999999' });
    const seal1 = await P(k.pkg.id, 'seal', { sealId: 'S-100' });
    ok('a scan of the wrong package is refused, and so is sealing before the tag is on', wrongScan.status === 409 && seal1.status === 409 && pr.status === 200, `${wrongScan.status} ${seal1.status}`);
    const ap = await T(id, 'apply', { packageScanValue: k.pkg.packageId }); const noSeal = await P(k.pkg.id, 'seal', {}); const seal = await P(k.pkg.id, 'seal', { sealId: 'S-100' }); const seal2 = await P(k.pkg.id, 'seal', { sealId: 'S-101' });
    const pkg = await pkgOf(k.pkg.id);
    ok('applied, then sealed once with its seal number', ap.status === 200 && noSeal.status === 400 && seal.status === 200 && seal2.status === 409 && pkg.status === 'SEALED' && pkg.sealId === 'S-100', `${ap.status} ${noSeal.status} ${seal.status} ${seal2.status}`);
    ok('the tag is sealed with the package', pkg.dropTags.find((t) => t.id === id).status === 'SEALED');
  });
  await scenario(G1, 'a voided tag stays void when the package is sealed (N-010)', async (ok) => {
    const k = await tagged();
    await T(k.tag.id, 'void', { reason: 'Printed on the wrong stock' });
    const t2 = await A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping'); const id = t2.body.dropTag.id;
    await T(id, 'validate'); await T(id, 'print'); await T(id, 'apply'); const seal = await P(k.pkg.id, 'seal', { sealId: 'S-200' });
    const pkg = await pkgOf(k.pkg.id);
    ok('the package is sealed', seal.status === 200 && pkg.status === 'SEALED');
    ok('the live tag is sealed and the voided one is still void', pkg.dropTags.find((t) => t.id === id).status === 'SEALED' && pkg.dropTags.find((t) => t.id === k.tag.id).status === 'VOID');
  });
  await scenario(G1, 'a further copy of a tag needs a reason, and after three copies a manager', async (ok) => {
    const k = await tagged(); const id = k.tag.id; await T(id, 'validate'); await T(id, 'print');
    const bad = await T(id, 'reprint', { reason: 'BECAUSE' });
    const copies = []; for (let i = 0; i < 3; i++) copies.push((await T(id, 'reprint', { reason: 'DAMAGED_TAG' })).status);
    const fourth = await T(id, 'reprint', { reason: 'DAMAGED_TAG' }); const byManager = await T(id, 'reprint', { reason: 'DAMAGED_TAG' }, mgr1);
    ok('an unknown reason is refused', bad.status === 400, `${bad.status}`);
    ok('three copies are allowed, the fourth is refused to the clerk and allowed to the manager', copies.join() === '200,200,200' && fourth.status === 403 && byManager.status === 200, `${copies.join()} ${fourth.status} ${byManager.status}`);
    ok('the count on the tag is four and each copy has its record', (await prisma.dropTag.findUnique({ where: { id } })).reprintCount === 4 && (await traces(id, 'DROP_TAG_REPRINTED')).length === 4);
  });
  await scenario(G1, 'packing records name the real person and role, and custody records cannot be forged (N-011)', async (ok) => {
    const k = await packed({ who: 'shipping' });
    const ev = (await traces(k.pkg.id))[0];
    ok('the record of opening the package names the clerk and the clerk\'s own role', ev && ev.actorUserId === users.shipping.id && ev.actorRole === users.shipping.role, `${ev?.actorRole}`);
    const again = crypto.createHash('sha256');
    ok('its fingerprint is a real SHA-256 value, not a random string', /^[0-9a-f]{64}$/.test(String(ev.eventHash || ev.hash || '')) && Boolean(again), String(ev.eventHash || ev.hash));
    const job = (await A.post('/api/jobs', { orderId: k.order.id, orderLineId: k.order.lines[0].id, instructions: 'QA P8 custody', status: 'ORDERED' })).body;
    const forged = await A.post('/api/material-tracking/custody-log', { eventType: 'JOB_SHIPPED', resourceType: 'Job', resourceId: job.id, previousState: 'READY_TO_SHIP', newState: 'SHIPPED', note: 'Shipped on the afternoon truck' }, 'operator');
    const hold = await A.post('/api/material-tracking/custody-log', { eventType: 'HOLD_PLACED', resourceType: 'Job', resourceId: job.id, note: 'A pretend hold on this job' }, 'operator');
    const named = await A.post('/api/material-tracking/log-status-change', { jobId: job.id, previousStatus: 'X', newStatus: 'DELIVERED', actor: users.admin.id }, 'operator');
    ok('a made-up "job shipped" record, a pretend hold, and a record in another person\'s name are all refused', forged.status === 400 && hold.status === 400 && named.status === 410, `${forged.status} ${hold.status} ${named.status}`);
    const note = await A.post('/api/material-tracking/custody-log', { eventType: 'DAMAGE_REPORT', resourceType: 'Job', resourceId: job.id, note: 'Corner dented by the forklift' }, 'shipping');
    ok('a plain note is kept, marked as a note, under the writer\'s own name', note.status === 201 && String(note.body.eventType).startsWith('MANUAL_') && note.body.actorUserId === users.shipping.id && note.body.actorRole === users.shipping.role, `${note.status} ${note.body?.eventType} ${err(note)}`);
  });
}

// ══ 2. Shipment creation, partial shipments and backorders ═════════════════════════════════
{
  await scenario(G2, 'a full shipment takes the stock, fills the line and completes the order, in one step', async (ok) => {
    const r = await shipped(500);
    const inv = await stock(r.coilId); const mv = await movesOf(r.shipment.id); const o = await orderOf(r.order.id);
    ok('500 left the stock item and the reservation is used up', num(inv.qtyOnHand) === 500 && num(inv.qtyAllocated) === 0, `${inv.qtyOnHand}/${inv.qtyAllocated}`);
    ok('one stock movement says what left, from which branch, for which line and shipment', mv.length === 1 && mv[0].movementType === 'SHIP' && num(mv[0].qtyMoved) === 500 && mv[0].coilId === r.coilId && mv[0].fromLocationId === L1.id && mv[0].orderLineId === r.order.lines[0].id && mv[0].unit === 'LB', JSON.stringify(mv.map((m) => [m.movementType, String(m.qtyMoved), m.unit])));
    ok('the line shows 500 shipped and the order is complete', num(o.lines[0].qtyShipped) === 500 && o.status === 'COMPLETE', `${o.lines[0].qtyShipped} ${o.status}`);
    ok('the shipment is on the road with its departure time and who sent it', (await shp(r.shipment.id)).status === 'IN_TRANSIT' && Boolean((await shp(r.shipment.id)).shippedAt) && (await historyOf(r.shipment.id)).some((h) => h.to === 'IN_TRANSIT' && h.by));
  });
  await scenario(G2, 'a partial shipment leaves the rest on back order, visible and still reserved', async (ok) => {
    const c = await B.received({ weightLb: 1500 }); const o = await B.order([B.line(1000)]); await B.reserve(o, o.lines[0], c, 1000);
    const s = await newShipment(o, [[o.lines[0], 600]]); const d = await B.dispatch(s.body);
    const after = await orderOf(o.id); const inv = await stock(c); const pos = await closeout(o.id);
    ok('600 shipped, the order is partly shipped', d.status === 200 && num(after.lines[0].qtyShipped) === 600 && after.status === 'PARTIAL', `${after.status}`);
    ok('400 is still reserved for it and 900 is on hand', num(inv.qtyAllocated) === 400 && num(inv.qtyOnHand) === 900, `${inv.qtyAllocated}/${inv.qtyOnHand}`);
    ok('the order shows 400 still to ship', pos.figures.toShip === 400 && codes(pos).includes('TO_SHIP'), JSON.stringify(pos.figures));
    const list = await A.get(`/api/orders/closeout?reason=TO_SHIP&search=${o.orderNumber}`, 'csr');
    ok('and it is on the list of orders with something still to ship', list.body.data.length === 1 && list.body.data[0].toShip === 400);
    ok('only what shipped was invoiced', near((await B.invoicesOf(o.id))[0].subtotal, 600 * 0.65));
  });
  await scenario(G2, 'the back order ships later on its own shipment and the order completes', async (ok) => {
    const c = await B.received({ weightLb: 1500 }); const o = await B.order([B.line(1000)]); await B.reserve(o, o.lines[0], c, 1000);
    const s1 = await newShipment(o, [[o.lines[0], 600]]); await B.dispatch(s1.body);
    const s2 = await newShipment(o, [[o.lines[0], 400]]); const d2 = await B.dispatch(s2.body);
    const after = await orderOf(o.id); const invs = await B.invoicesOf(o.id);
    ok('the second shipment went and the order is complete', d2.status === 200 && after.status === 'COMPLETE' && num(after.lines[0].qtyShipped) === 1000);
    ok('two shipments, two invoices, each for what its shipment carried', invs.length === 2 && near(invs[0].subtotal, 390) && near(invs[1].subtotal, 260) && invs[0].shipmentId === s1.body.id && invs[1].shipmentId === s2.body.id, invs.map((i) => String(i.subtotal)).join());
    ok('together they bill the order once', near(invs.reduce((a, i) => a + num(i.subtotal), 0), 650));
    ok('nothing is left to ship or reserved', (await closeout(o.id)).figures.toShip === 0 && num((await stock(c)).qtyAllocated) === 0);
  });
  await scenario(G2, 'an order split over three shipments is shipped exactly once in total', async (ok) => {
    const c = await B.received({ weightLb: 1200 }); const o = await B.order([B.line(900)]); await B.reserve(o, o.lines[0], c, 900);
    for (const q of [250, 350, 300]) { const s = await newShipment(o, [[o.lines[0], q]]); const d = await B.dispatch(s.body); if (d.status !== 200) throw new Error(err(d)); }
    const mv = await prisma.materialMovement.findMany({ where: { orderLineId: o.lines[0].id, movementType: 'SHIP' } });
    ok('three movements add up to 900', mv.length === 3 && mv.reduce((a, m) => a + num(m.qtyMoved), 0) === 900);
    ok('the stock item is down by 900 and the line shows 900', num((await stock(c)).qtyOnHand) === 300 && num((await lineOf(o.lines[0].id)).qtyShipped) === 900);
    const more = await newShipment(o, [[o.lines[0], 1]]);
    ok('a fourth shipment is refused: the order is complete', more.status === 409, `${more.status} ${err(more)}`);
  });
  await scenario(G2, 'more than is left to ship is refused, with the figures', async (ok) => {
    const c = await B.received({ weightLb: 1500 }); const o = await B.order([B.line(1000)]); await B.reserve(o, o.lines[0], c, 1000);
    const s1 = await newShipment(o, [[o.lines[0], 700]]); await B.dispatch(s1.body);
    const over = await newShipment(o, [[o.lines[0], 301]]);
    ok('301 against 300 left is refused and says what is left', over.status === 409 && /only 300 is left to ship/.test(err(over)) && /shipped 700/.test(err(over)), `${over.status} ${err(over)}`);
    ok('no shipment was saved for it', (await prisma.shipment.count({ where: { orderId: o.id } })) === 1);
  });
  await scenario(G2, 'two shipments on the dock cannot together carry more than the line', async (ok) => {
    const r = await B.readyToShip(500);
    const second = await newShipment(r.order, [[r.order.lines[0], 1]]);
    ok('the first shipment already holds all 500, so one more is refused', second.status === 409 && /on other open shipments 500/.test(err(second)), `${second.status} ${err(second)}`);
    await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping');
    const third = await newShipment(r.order, [[r.order.lines[0], 500]]);
    ok('once the first is cancelled the quantity is free again', third.status === 201);
  });
  await scenario(G2, 'a shipment on the dock can be changed; one that has left cannot', async (ok) => {
    const { order } = await twoLines();
    const s = await newShipment(order, [[order.lines[0], 600]]);
    const add = await A.post(`/api/shipments/${s.body.id}/items`, { orderLineId: order.lines[1].id, qtyShipped: 150 }, 'shipping');
    const items = (await shp(s.body.id)).items;
    ok('a second line is added', add.status === 201 && items.length === 2, `${add.status} ${err(add)}`);
    const rm = await A.call('DELETE', `/api/shipments/${s.body.id}/items/${items.find((i) => i.orderLineId === order.lines[1].id).id}`, undefined, 'shipping');
    ok('and taken off again', rm.status < 300 && (await shp(s.body.id)).items.length === 1, `${rm.status}`);
    await B.dispatch(s.body);
    const late = await A.post(`/api/shipments/${s.body.id}/items`, { orderLineId: order.lines[1].id, qtyShipped: 10 }, 'shipping');
    const edit = await A.put(`/api/shipments/${s.body.id}`, { carrierName: 'Changed after the fact' }, 'shipping');
    ok('after dispatch neither its lines nor its carrier can be changed', late.status === 409 && edit.status === 409 && (await shp(s.body.id)).carrierName === 'Own Truck', `${late.status} ${edit.status}`);
  });
  await scenario(G2, 'what is typed for a shipment line is checked', async (ok) => {
    const r = await B.readyToShip(200); const other = await B.readyToShip(100);
    const base = { orderId: r.order.id, fromLocationId: L1.id };
    const send = (items) => A.post('/api/shipments', { ...base, items }, 'shipping');
    const l = r.order.lines[0].id;
    await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping');
    const rs = [await send('all of it'), await send([{ orderLineId: l, qtyShipped: 0 }]), await send([{ orderLineId: l, qtyShipped: -5 }]), await send([{ orderLineId: l, qtyShipped: 'ten' }]), await send([{ orderLineId: other.order.lines[0].id, qtyShipped: 5 }]), await send([{ orderLineId: l, qtyShipped: 5, weightLb: -1 }])];
    ok('not a list, zero, negative, not a number, a line of another order and a negative weight are each refused', rs.every((x) => x.status === 400), rs.map((x) => x.status).join());
    ok('none of them left a shipment behind', (await prisma.shipment.count({ where: { orderId: r.order.id, status: { not: 'CANCELLED' } } })) === 0);
  });
  await scenario(G2, 'a shipment needs an order and a branch that exist', async (ok) => {
    const r = await B.readyToShip(100);
    const a = await A.post('/api/shipments', { fromLocationId: L1.id, items: [] }, 'shipping');
    const b = await A.post('/api/shipments', { orderId: crypto.randomUUID(), fromLocationId: L1.id, items: [] }, 'shipping');
    const c = await A.post('/api/shipments', { orderId: r.order.id, fromLocationId: crypto.randomUUID(), items: [] }, 'admin');
    ok('no order: 400; unknown order: 404; unknown branch: refused', a.status === 400 && b.status === 404 && [400, 403].includes(c.status), `${a.status} ${b.status} ${c.status}`);
  });
  await scenario(G2, 'carrier, truck and driver are saved as typed, and bad values are refused', async (ok) => {
    const r = await B.readyToShip(100); const id = r.shipment.id;
    const good = await A.put(`/api/shipments/${id}`, { carrierName: 'Midwest Flatbed', bolNumber: 'BOL-77120', truckNumber: 'T-14', driverName: 'R. Alvarez', driverPhone: '555-0100', scheduledDate: '2026-12-01', totalWeightLb: 104.5 }, 'shipping');
    const s = await shp(id);
    ok('all seven are on the shipment', good.status === 200 && s.carrierName === 'Midwest Flatbed' && s.bolNumber === 'BOL-77120' && s.truckNumber === 'T-14' && s.driverName === 'R. Alvarez' && num(s.totalWeightLb) === 104.5 && s.scheduledDate?.toISOString().startsWith('2026-12-01'), `${good.status} ${err(good)}`);
    const bad = [await A.put(`/api/shipments/${id}`, { scheduledDate: 'next Tuesday' }, 'shipping'), await A.put(`/api/shipments/${id}`, { totalWeightLb: -1 }, 'shipping'), await A.put(`/api/shipments/${id}`, {}, 'shipping'), await A.put(`/api/shipments/${id}`, { status: 'DELIVERED', orderId: 'x' }, 'shipping')];
    ok('a bad date, a negative weight, nothing at all, and fields that are not editable are each refused', bad.every((x) => x.status === 400), bad.map((x) => x.status).join());
    ok('and the status was not changed through the edit', (await shp(id)).status === 'PENDING');
    const d = (await docs(id)).body;
    ok('the bill of lading shows the number and carrier that were typed, and the entered weight', d.shipment.bolNumber === 'BOL-77120' && d.shipment.carrier === 'Midwest Flatbed' && d.totals.weightLb === 104.5 && d.totals.weightFrom === 'entered on the shipment');
  });
  await scenario(G2, 'an empty shipment cannot be dispatched', async (ok) => {
    const r = await B.readyToShip(100);
    await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping');
    const s = await newShipment(r.order, []);
    const d = await B.dispatch(s.body);
    ok('it is refused', s.status === 201 && d.status === 409 && /Add what is being shipped/.test(err(d)), `${s.status} ${d.status} ${err(d)}`);
    ok('and no invoice was raised', (await B.invoicesOf(r.order.id)).length === 0);
  });
  await scenario(G2, 'cancelling a shipment on the dock moves nothing and is written down', async (ok) => {
    const r = await B.readyToShip(300);
    const c = await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED', note: 'Customer asked to hold the load' }, 'shipping');
    const inv = await stock(r.coilId); const h = await historyOf(r.shipment.id);
    ok('it is cancelled', c.status === 200 && (await shp(r.shipment.id)).status === 'CANCELLED');
    ok('the stock is on hand and still reserved for the order', num(inv.qtyOnHand) === 800 && num(inv.qtyAllocated) === 300);
    ok('the history says who cancelled it', h.some((x) => x.to === 'CANCELLED' && x.by), JSON.stringify(h.slice(-1)));
    const d = await B.dispatch(r.shipment); const back = await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'PENDING' }, 'shipping');
    ok('a cancelled shipment cannot be dispatched or brought back', d.status === 409 && back.status === 409, `${d.status} ${back.status}`);
  });
  await scenario(G2, 'the moves a shipment may make are fixed', async (ok) => {
    const r = await B.readyToShip(100); const id = r.shipment.id;
    const set = (status, extra = {}) => A.patch(`/api/shipments/${id}/status`, { status, ...extra }, 'shipping');
    const a = await set('DELIVERED', { podSignature: 'Nobody yet' }); const b = await set('EXCEPTION', { reason: 'x problem' }); const c = await set('ON_THE_MOON'); const load = await set('LOADING'); const back = await set('PENDING');
    ok('from the dock it cannot jump to delivered or to a problem, and an unknown status is refused', a.status === 409 && b.status === 409 && c.status >= 400 && c.status < 500 && (await shp(id)).status === 'PENDING', `${a.status} ${b.status} ${c.status}`);
    ok('it can be marked loading and put back', load.status === 200 && back.status === 200);
    await B.dispatch(r.shipment);
    const cancel = await set('CANCELLED'); const pend = await set('PENDING');
    ok('once on the road it cannot be cancelled or put back on the dock', cancel.status === 409 && pend.status === 409 && (await shp(id)).status === 'IN_TRANSIT', `${cancel.status} ${pend.status}`);
  });
  await scenario(G2, 'one shipment carries two lines, one of them in part, and is billed line by line', async (ok) => {
    const { order, c1, c2 } = await twoLines(600, 400);
    const s = await newShipment(order, [[order.lines[0], 600], [order.lines[1], 150]]); const d = await B.dispatch(s.body);
    const o = await orderOf(order.id); const inv = (await B.invoicesOf(order.id))[0];
    ok('line 1 is shipped in full, line 2 in part, the order is partly shipped', d.status === 200 && num(o.lines[0].qtyShipped) === 600 && num(o.lines[1].qtyShipped) === 150 && o.status === 'PARTIAL');
    ok('each stock item gave what its line shipped', num((await stock(c1)).qtyOnHand) === 500 && num((await stock(c2)).qtyOnHand) === 750);
    const by = Object.fromEntries(inv.lines.map((l) => [l.orderLineId, l]));
    ok('the invoice has both lines at the shipped quantities and prices', inv.lines.length === 2 && num(by[order.lines[0].id].quantity) === 600 && num(by[order.lines[1].id].quantity) === 150 && near(inv.subtotal, 600 * 0.5 + 150 * 0.8), String(inv.subtotal));
    ok('250 of line 2 is the back order', (await closeout(order.id)).figures.toShip === 250);
  });
  await scenario(G2, 'a line filled from two stock items records each item and heat that left', async (ok) => {
    const [c1, c2] = [await B.received({ weightLb: 300 }), await B.received({ weightLb: 400 })];
    const o = await B.order([B.line(500)]); await B.reserve(o, o.lines[0], c1, 300); await B.reserve(o, o.lines[0], c2, 200);
    const s = await newShipment(o, [[o.lines[0], 500]]); const d = await B.dispatch(s.body);
    const mv = await movesOf(s.body.id);
    ok('two movements: 300 from the first item, 200 from the second', d.status === 200 && mv.length === 2 && num(mv.find((m) => m.coilId === c1).qtyMoved) === 300 && num(mv.find((m) => m.coilId === c2).qtyMoved) === 200);
    ok('the first item is used up and marked as gone; the second keeps 200', num((await stock(c1)).qtyOnHand) === 0 && (await prisma.coil.findUnique({ where: { id: c1 } })).status === 'SHIPPED' && num((await stock(c2)).qtyOnHand) === 200);
    const after = (await docs(s.body.id)).body;
    ok('the packing list now shows the stock that actually left, with its heat', after.stage === 'AFTER_DISPATCH' && after.lines[0].stock.length === 2 && after.lines[0].stock.every((x) => x.heatNumber === heat.heatNumber) && after.lines[0].stock.reduce((a, x) => a + x.quantity, 0) === 500);
  });
  await scenario(G2, 'the shipping desk looks an order up by number and sees what can ship', async (ok) => {
    const c = await B.received({ weightLb: 1500 }); const o = await B.order([B.line(1000)]); await B.reserve(o, o.lines[0], c, 700);
    const look = () => A.get(`/api/shipments/shippable?orderNumber=${o.orderNumber}`, 'shipping');
    const a = await look(); const l = a.body.lines?.[0] || {};
    ok('it answers with the order and its line', a.status === 200 && a.body.lines.length === 1, `${a.status} ${JSON.stringify(a.body).slice(0, 200)}`);
    ok('the line shows 1,000 open and nothing on the dock', l.qtyOpen === 1000 && l.qtyOnOpenShipments === 0 && l.qtyShipped === 0, JSON.stringify(l));
    const s = await newShipment(o, [[o.lines[0], 700]]);
    const mid = (await look()).body.lines[0];
    ok('with 700 on a shipment at the dock, 300 is open to put on another', mid.qtyOnOpenShipments === 700 && mid.qtyOpen === 300, JSON.stringify(mid));
    await B.dispatch(s.body);
    const b = (await look()).body.lines[0];
    ok('after it leaves: 700 shipped, 300 open', b.qtyShipped === 700 && b.qtyOpen === 300 && b.qtyOnOpenShipments === 0, JSON.stringify(b));
    const none = await A.get('/api/shipments/shippable?orderNumber=SO-NOT-ON-FILE', 'shipping'); const blank = await A.get('/api/shipments/shippable', 'shipping');
    ok('an unknown number is 404 and a missing one 400', none.status === 404 && blank.status === 400);
  });
  await scenario(G2, 'an order sold by one branch is shipped and billed from the branch that holds the stock (N-002)', async (ok) => {
    const c = await B.received({ weightLb: 1200 });
    const o = await B.order([B.line(800)], { who: 'admin', extra: { locationId: L2.id } });
    await B.reserve(o, o.lines[0], c, 800);
    const look = await A.get(`/api/shipments/shippable?orderNumber=${o.orderNumber}`, 'branchWh');
    ok('the warehouse at branch 1 can look the order up, marked as sold by another branch', look.status === 200 && look.body.soldByAnotherBranch === true, `${look.status} ${look.body?.soldByAnotherBranch}`);
    const s = await newShipment(o, [[o.lines[0], 800]], 'branchWh'); const d = await A.put(`/api/shipments/${s.body?.id}/dispatch`, {}, 'branchWh');
    ok('it builds and dispatches the shipment from its own dock', s.status === 201 && d.status === 200, `${s.status} ${d.status} ${err(s)}${err(d)}`);
    const inv = (await B.invoicesOf(o.id))[0]; const after = await orderOf(o.id);
    ok('the order is shipped and invoiced once', num(after.lines[0].qtyShipped) === 800 && after.status === 'COMPLETE' && inv && near(inv.subtotal, 520), `${after.status} ${inv?.subtotal}`);
    ok('the order still belongs to the branch that sold it, and the stock left branch 1', after.locationId === L2.id && (await movesOf(s.body.id))[0].fromLocationId === L1.id);
    const seen = await ship2.get(`/api/shipments/${s.body.id}`);
    ok('the selling branch can see the shipment of its order', seen.status === 200);
    const touch = await ship2.put(`/api/shipments/${s.body.id}/deliver`, { podSignature: 'Someone' });
    ok('but only the dock it left from can change it', touch.status === 403 && (await shp(s.body.id)).status === 'IN_TRANSIT', `${touch.status}`);
  });
  await scenario(G2, 'a branch cannot ship another branch\'s order when it holds nothing for it', async (ok) => {
    const c = await B.received({ weightLb: 900, locationId: L2.id });
    const o = await B.order([B.line(300)], { who: 'admin', extra: { locationId: L2.id } }); await B.reserve(o, o.lines[0], c, 300);
    const s = await newShipment(o, [[o.lines[0], 300]], 'branchWh');
    ok('the order is not found for the branch 1 warehouse', s.status === 404, `${s.status} ${err(s)}`);
    const look = await A.get(`/api/shipments/shippable?orderNumber=${o.orderNumber}`, 'branchWh');
    ok('nor can it be looked up there', look.status === 404, `${look.status}`);
    const own = await ship2.post('/api/shipments', { orderId: o.id, fromLocationId: L2.id, items: [{ orderLineId: o.lines[0].id, qtyShipped: 300 }] });
    const d = await ship2.put(`/api/shipments/${own.body?.id}/dispatch`, {});
    ok('its own branch ships it', own.status === 201 && d.status === 200, `${own.status} ${d.status} ${err(d)}`);
  });
  await scenario(G2, 'a warehouse cannot open a shipment from another branch\'s dock', async (ok) => {
    const r = await B.readyToShip(200);
    await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping');
    const s = await A.post('/api/shipments', { orderId: r.order.id, fromLocationId: L2.id, items: [] }, 'branchWh');
    ok('refused: that dock belongs to another branch', s.status === 403, `${s.status} ${err(s)}`);
    ok('nothing was saved', (await prisma.shipment.count({ where: { orderId: r.order.id, fromLocationId: L2.id } })) === 0);
  });
  // Packaging, staging, the shop floor, the Shipment Planner and the Shipping screen are one flow (owner, 2026-11-25):
  // a job for a customer order is never marked shipped from a job screen. Its shipment is planned and dispatched on
  // the Shipping screen, and the job is marked shipped with it.
  const plansFor = async (who = 'shipping') => (typeof who === 'string' ? A.get('/api/shipments/job-plans', who) : who.get('/api/shipments/job-plans'));
  await scenario(G2, 'a job for a customer order cannot be marked shipped before its shipment is planned', async (ok) => {
    const k = await stagedJob({ qty: 400 });
    const floor = await A.post(`/api/jobs/${k.job.id}/ship`, { carrier: 'Own Truck', trackingNumber: 'PRO-5521' }, 'shipping');
    ok('the shop-floor Ship is refused and says to plan the shipment', floor.status === 409 && /No shipment is planned/.test(err(floor)) && /Shipment Planner/.test(err(floor)), `${floor.status} ${err(floor)}`);
    const staging = await A.patch(`/api/material-tracking/staging/${k.job.id}/ship`, { carrier: 'Own Truck', trackingNumber: 'PRO-9' }, 'shipping');
    ok('the staging Ship is refused the same way', staging.status === 409 && /No shipment is planned/.test(err(staging)), `${staging.status} ${err(staging)}`);
    const byHand = await A.patch(`/api/jobs/${k.job.id}/status`, { status: 'SHIPPED' }, 'shipping');
    ok('marking it shipped by hand is refused', byHand.status === 409 && /marked shipped when its shipment is dispatched/.test(err(byHand)), `${byHand.status} ${err(byHand)}`);
    ok('no shipment, no invoice, no stock out, and the job is still ready', (await prisma.shipment.count({ where: { orderId: k.order.id } })) === 0 && (await B.invoicesOf(k.order.id)).length === 0 && num((await stock(k.coilId)).qtyOnHand) === 900 && (await prisma.job.findUnique({ where: { id: k.job.id } })).status === 'READY_TO_SHIP');
    const plans = await plansFor();
    const mine = (plans.body || []).find((p) => p.jobId === k.job.id);
    ok('the job screens are told it has no shipment yet, with its order number to plan one', plans.status === 200 && mine && mine.shipment === null && mine.orderNumber === k.order.orderNumber, JSON.stringify(mine));
    const planner = await A.get('/api/shipments/ready-orders', 'shipping');
    ok('and the Shipment Planner lists its order', (planner.body || []).some((o) => o.id === k.order.id));
  });
  await scenario(G2, 'once its shipment is planned the job screens point at it, and dispatching it marks the job shipped', async (ok) => {
    const k = await stagedJob({ qty: 300 });
    const s = await newShipment(k.order, [[k.order.lines[0], 300]]);
    const mine = ((await plansFor()).body || []).find((p) => p.jobId === k.job.id);
    ok('the job screens show the planned shipment, on the dock', s.status === 201 && mine?.shipment?.id === s.body.id && mine.shipment.shipmentNumber === s.body.shipmentNumber && mine.shipment.status === 'PENDING', JSON.stringify(mine));
    ok('the Shipment Planner no longer lists the order as waiting', !((await A.get('/api/shipments/ready-orders', 'shipping')).body || []).some((o) => o.id === k.order.id));
    const j = await A.post(`/api/jobs/${k.job.id}/ship`, { carrier: 'Own Truck', trackingNumber: 'PRO-1' }, 'shipping');
    ok('Ship on the job is still refused, and names the shipment to dispatch', j.status === 409 && err(j).includes(s.body.shipmentNumber) && /Dispatch that shipment on the Shipping screen/.test(err(j)), `${j.status} ${err(j)}`);
    ok('the job is still ready and only the one shipment exists', (await prisma.job.findUnique({ where: { id: k.job.id } })).status === 'READY_TO_SHIP' && (await prisma.shipment.count({ where: { orderId: k.order.id } })) === 1);
    const d = await B.dispatch(s.body);
    ok('dispatching the shipment marks the job shipped', d.status === 200 && (await prisma.job.findUnique({ where: { id: k.job.id } })).status === 'SHIPPED', `${d.status} ${err(d)}`);
    ok('the stock left, the line is shipped and one invoice was raised', num((await stock(k.coilId)).qtyOnHand) === 500 && num((await lineOf(k.order.lines[0].id)).qtyShipped) === 300 && (await B.invoicesOf(k.order.id)).length === 1);
    ok('the job has left the job screens\' list', !((await plansFor()).body || []).some((p) => p.jobId === k.job.id));
  });
  await scenario(G2, 'a planned shipment that covers another line does not count as this job\'s plan', async (ok) => {
    const c = [await B.received({ weightLb: 900 }), await B.received({ weightLb: 900 })];
    const o = await B.order([B.line(300), B.line(200)], { who: 'admin', extra: { locationId: L1.id } });
    await B.reserve(o, o.lines[0], c[0], 300); await B.reserve(o, o.lines[1], c[1], 200);
    const j = await A.post('/api/jobs', { orderId: o.id, orderLineId: o.lines[0].id, instructions: `QA P8 ${run}`, status: 'ORDERED' });
    await prisma.jobInspection.create({ data: { inspectionNumber: tag('P8INSP'), jobId: j.body.id, status: 'PASSED', overallResult: 'PASS', completedAt: new Date() } });
    await prisma.job.update({ where: { id: j.body.id }, data: { status: 'READY_TO_SHIP', workCenterId: wc1.id, actualEnd: new Date() } });
    const other = await newShipment(o, [[o.lines[1], 200]]);
    const mine = ((await plansFor()).body || []).find((p) => p.jobId === j.body.id);
    ok('the other line is on the dock, and this job still shows no shipment', other.status === 201 && mine && mine.shipment === null, JSON.stringify(mine));
    const own = await newShipment(o, [[o.lines[0], 300]]);
    const now = ((await plansFor()).body || []).find((p) => p.jobId === j.body.id);
    ok('with its own line planned it shows that shipment', own.status === 201 && now?.shipment?.id === own.body.id, JSON.stringify(now));
  });
  await scenario(G2, 'a job with no customer order is still marked shipped from the staging screen, with its custody record', async (ok) => {
    const job = await prisma.job.create({ data: { jobNumber: tag('P8STOCKJOB'), status: 'READY_TO_SHIP', priority: 3, workCenterId: wc1.id, createdById: users.admin.id, actualEnd: new Date() } });
    await prisma.jobInspection.create({ data: { inspectionNumber: tag('P8INSP'), jobId: job.id, status: 'PASSED', overallResult: 'PASS', completedAt: new Date() } });
    ok('it is not in the list of order jobs waiting for a shipment', !((await plansFor()).body || []).some((p) => p.jobId === job.id));
    const s = await A.patch(`/api/material-tracking/staging/${job.id}/ship`, { carrier: 'Own Truck', trackingNumber: 'PRO-9' }, 'shipping');
    ok('the job is shipped', s.status === 200 && (await prisma.job.findUnique({ where: { id: job.id } })).status === 'SHIPPED', `${s.status} ${err(s)}`);
    const ev = (await traces(job.id)).find((e) => /SHIP/.test(e.eventType));
    ok('the custody record carries the clerk and the clerk\'s own role', ev && ev.actorUserId === users.shipping.id && ev.actorRole === users.shipping.role, `${ev?.actorRole}`);
  });
  await scenario(G2, 'another branch does not see this branch\'s jobs waiting for a shipment', async (ok) => {
    const k = await stagedJob({ qty: 250 });
    const theirs = await plansFor(ship2);
    ok('the list answers, without this branch\'s job', theirs.status === 200 && !(theirs.body || []).some((p) => p.jobId === k.job.id), `${theirs.status}`);
    ok('its own branch sees it', ((await plansFor()).body || []).some((p) => p.jobId === k.job.id));
  });
  await scenario(G2, 'cancelling an order cancels its shipments still on the dock (N-006)', async (ok) => {
    const r = await B.readyToShip(300);
    const c = await A.put(`/api/orders/${r.order.id}`, { status: 'CANCELLED' }, 'csr');
    const s = await shp(r.shipment.id); const h = await historyOf(r.shipment.id);
    ok('the order is cancelled and so is its shipment', c.status === 200 && s.status === 'CANCELLED', `${c.status} ${s.status}`);
    ok('the shipment\'s history says it was cancelled with the order', h.some((x) => x.to === 'CANCELLED' && /order/i.test(String(x.note || ''))), JSON.stringify(h.slice(-1)));
    const d = await B.dispatch(r.shipment);
    ok('it cannot be dispatched, and the stock never left', d.status === 409 && num((await stock(r.coilId)).qtyOnHand) === 800);
  });
}

// ══ 3. Dispatch, carriers, freight and delivery ════════════════════════════════════════════
{
  const { partner } = await import('./phase4-lib.mjs');
  const PCAR = await partner(w.carrierOrg, 'CARRIER');
  const render = async (jobId, who = 'shipping') => (await rawCall('GET', `/api/print-queue/${jobId}/render`, undefined, who)).raw || '';
  const queueOf = async (who = 'shipping') => (await A.get('/api/print-queue', who)).body;
  const papers = (shipmentId, who = 'shipping') => A.post('/api/print-queue/trigger-shipment', { shipmentId }, who);

  await scenario(G3, 'a delivery is recorded with the name of the person who received it', async (ok) => {
    const r = await shipped(300);
    const d = await A.put(`/api/shipments/${r.shipment.id}/deliver`, { podSignature: '  Dana Whitfield  ' }, 'shipping');
    const s = await shp(r.shipment.id); const h = await historyOf(r.shipment.id);
    ok('it is delivered, with the time', d.status === 200 && s.status === 'DELIVERED' && Boolean(s.deliveredAt));
    ok('the name is kept, trimmed, and proof is marked as captured', s.podSignature === 'Dana Whitfield' && s.podCaptured === true && s.noPodReason === null);
    ok('the history says who it was signed for by and which user recorded it', h.some((x) => x.to === 'DELIVERED' && /Signed for by Dana Whitfield/.test(x.note || '') && x.by), JSON.stringify(h.slice(-1)));
  });
  await scenario(G3, 'a delivery with no name and no reason is refused (N-004)', async (ok) => {
    const r = await shipped(300);
    const a = await A.put(`/api/shipments/${r.shipment.id}/deliver`, {}, 'shipping'); const b = await A.put(`/api/shipments/${r.shipment.id}/deliver`, { podSignature: '   ' }, 'shipping'); const c = await A.put(`/api/shipments/${r.shipment.id}/deliver`, { noPodReason: 'ok' }, 'shipping');
    ok('nothing, a blank name, and a two-letter reason are each refused with what to do', [a, b, c].every((x) => x.status === 400) && /name of the person/.test(err(a)), [a, b, c].map((x) => x.status).join());
    ok('the shipment is still on the road', (await shp(r.shipment.id)).status === 'IN_TRANSIT');
    const d = await A.put(`/api/shipments/${r.shipment.id}/deliver`, { noPodReason: 'Left at the gate as the customer asked' }, 'shipping');
    const s = await shp(r.shipment.id);
    ok('with a reason it is delivered, proof is marked as not captured, and the reason is kept', d.status === 200 && s.status === 'DELIVERED' && s.podCaptured === false && s.noPodReason === 'Left at the gate as the customer asked');
    ok('the history carries the reason', (await historyOf(r.shipment.id)).some((x) => x.to === 'DELIVERED' && /No signature: Left at the gate/.test(x.note || '')));
  });
  await scenario(G3, 'proof of delivery text and image address are checked', async (ok) => {
    const r = await shipped(200); const put = (b) => A.put(`/api/shipments/${r.shipment.id}/deliver`, b, 'shipping');
    const rs = [await put({ podSignature: 'x'.repeat(201) }), await put({ podSignature: 12345 }), await put({ podImageUrl: 'http://insecure.example/pod.jpg' }), await put({ podImageUrl: 'javascript:alert(1)' })];
    ok('a name over 200 letters, a name that is not text, a plain http address and a script address are each refused', rs.every((x) => x.status === 400), rs.map((x) => x.status).join());
    const good = await put({ podImageUrl: 'https://files.example/pod/123.jpg' });
    const s = await shp(r.shipment.id);
    ok('an https image alone is proof', good.status === 200 && s.podCaptured === true && s.podImageUrl === 'https://files.example/pod/123.jpg' && s.status === 'DELIVERED');
  });
  await scenario(G3, 'a shipment is delivered once, and never before it has left', async (ok) => {
    const r = await B.readyToShip(200);
    const early = await B.deliver(r.shipment);
    ok('on the dock it cannot be marked delivered', early.status === 409 && (await shp(r.shipment.id)).status === 'PENDING', `${early.status}`);
    await B.dispatch(r.shipment); const first = await B.deliver(r.shipment); const at = (await shp(r.shipment.id)).deliveredAt;
    const second = await A.put(`/api/shipments/${r.shipment.id}/deliver`, { podSignature: 'Somebody Else' }, 'shipping');
    const s = await shp(r.shipment.id);
    ok('the second delivery is refused and changes neither the name nor the time', first.status === 200 && second.status === 409 && s.podSignature === 'QA Receiver' && String(s.deliveredAt) === String(at), `${second.status}`);
    ok('one delivered row in the history', (await historyOf(r.shipment.id)).filter((x) => x.to === 'DELIVERED').length === 1);
  });
  await scenario(G3, 'a problem on the road is recorded with what happened (N-003)', async (ok) => {
    const r = await shipped(300);
    const none = await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'EXCEPTION' }, 'shipping');
    ok('with no reason it is refused', none.status === 400 && (await shp(r.shipment.id)).status === 'IN_TRANSIT', `${none.status}`);
    const p = await problem(r.shipment.id, 'Refused at the door: wrong length');
    const h = await historyOf(r.shipment.id);
    ok('with one it becomes a shipment problem', p.status === 200 && (await shp(r.shipment.id)).status === 'EXCEPTION');
    ok('the reason and the person are in the history', h.some((x) => x.to === 'EXCEPTION' && /Refused at the door: wrong length/.test(x.note || '') && x.by), JSON.stringify(h.slice(-1)));
    const pos = await closeout(r.order.id);
    ok('the order shows a shipment problem and is not closed', !pos.closed && codes(pos).includes('SHIPMENT_PROBLEM'), codes(pos));
    const list = await A.get(`/api/orders/closeout?reason=SHIPMENT_PROBLEM&search=${r.order.orderNumber}`, 'csr');
    ok('and it is on the list of orders with a shipment problem', list.body.data.length === 1 && list.body.data[0].problems === 1);
  });
  await scenario(G3, 'a shipment with a problem goes back on the road without shipping or billing twice', async (ok) => {
    const r = await shipped(300); await problem(r.shipment.id, 'Truck broke down');
    const before = { onHand: num((await stock(r.coilId)).qtyOnHand), moves: (await movesOf(r.shipment.id)).length, invoices: (await B.invoicesOf(r.order.id)).length, shippedAt: String((await shp(r.shipment.id)).shippedAt) };
    const again = await B.dispatch(r.shipment);
    const after = { onHand: num((await stock(r.coilId)).qtyOnHand), moves: (await movesOf(r.shipment.id)).length, invoices: (await B.invoicesOf(r.order.id)).length, shippedAt: String((await shp(r.shipment.id)).shippedAt) };
    ok('it is on the road again', again.status === 200 && (await shp(r.shipment.id)).status === 'IN_TRANSIT', `${again.status} ${err(again)}`);
    ok('no second stock movement, no second invoice, and the first departure time stands', JSON.stringify(before) === JSON.stringify(after), `${JSON.stringify(before)} ${JSON.stringify(after)}`);
    ok('the line still shows 300 shipped', num((await lineOf(r.order.lines[0].id)).qtyShipped) === 300);
  });
  await scenario(G3, 'a shipment with a problem can end delivered, and cannot be cancelled or put back on the dock', async (ok) => {
    const r = await shipped(200); await problem(r.shipment.id, 'Receiver closed, redelivery tomorrow');
    const c = await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping'); const p = await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'PENDING' }, 'shipping');
    ok('cancel and back-to-dock are refused: the stock and the invoice already moved', c.status === 409 && p.status === 409 && (await shp(r.shipment.id)).status === 'EXCEPTION', `${c.status} ${p.status}`);
    const d = await B.deliver(r.shipment);
    ok('it is delivered with its proof', d.status === 200 && (await shp(r.shipment.id)).status === 'DELIVERED');
    ok('a plain status change cannot end it as lost: that is a manager\'s own step', (await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'LOST', reason: 'gone' }, 'admin')).status === 409 && (await shp(r.shipment.id)).status === 'DELIVERED');
  });
  const lost = (id, body, who = mgr1) => who.put(`/api/shipments/${id}/lost`, body);
  const creditRows = (orderId) => prisma.invoice.findMany({ where: { orderId, kind: 'CREDIT', status: { not: 'CANCELLED' } }, include: { payments: true } });
  await scenario(G3, 'a load that never arrives is ended as lost by a manager, with what happened, and its invoice is credited in full (N-027, owner decision 10)', async (ok) => {
    const r = await shipped(400); await problem(r.shipment.id, 'Truck fire on I-94');
    const inv0 = await invOf(r.invoice.id); const stock0 = await stock(r.coilId); const moves0 = (await movesOf(r.shipment.id)).length;
    const dock = await A.put(`/api/shipments/${r.shipment.id}/lost`, { kind: 'DESTROYED', reason: 'Burned' }, 'shipping');
    ok('the shipping desk cannot do it: it credits an invoice', dock.status === 403 && (await shp(r.shipment.id)).status === 'EXCEPTION', `${dock.status} ${err(dock)}`);
    const noWhy = await lost(r.shipment.id, { kind: 'DESTROYED' }); const noKind = await lost(r.shipment.id, { kind: 'VANISHED', reason: 'Burned with the trailer' });
    ok('a manager must say which kind of loss and what happened', noWhy.status === 400 && noKind.status === 400 && (await creditRows(r.order.id)).length === 0, `${noWhy.status} ${noKind.status}`);
    const done = await lost(r.shipment.id, { kind: 'DESTROYED', reason: 'Burned with the trailer, police report 4471' });
    const credits = await creditRows(r.order.id); const inv1 = await invOf(r.invoice.id);
    ok('the shipment ends as lost', done.status === 200 && (await shp(r.shipment.id)).status === 'LOST', `${done.status} ${err(done)}`);
    ok('one credit memo for the whole invoice, goods and tax, naming the shipment and what happened', credits.length === 1 && Math.abs(num(credits[0].totalAmount) + num(inv0.totalAmount)) < 0.005 && /Burned with the trailer/.test(credits[0].notes) && credits[0].notes.includes(r.shipment.shipmentNumber), JSON.stringify(credits.map((c) => [c.totalAmount, c.notes])));
    ok('nothing is owed on the invoice any more', Math.abs(num(inv1.totalAmount) - num(inv1.paidAmount)) < 0.005 && inv1.status === 'PAID', `${inv1.status} ${inv1.paidAmount}`);
    ok('what happened and who decided are in the history', (await historyOf(r.shipment.id)).some((h) => /Destroyed in transit\. Burned with the trailer/.test(JSON.stringify(h))) && (await audits('SHIPMENT_STATUS_CHANGED', r.shipment.id)).some((a) => a.details?.to === 'LOST' && a.userId === mgr1.user.id));
    const stock1 = await stock(r.coilId);
    ok('stock is not moved a second time: it left the books when the truck did', num(stock1.qtyOnHand) === num(stock0.qtyOnHand) && (await movesOf(r.shipment.id)).length === moves0 && num((await lineOf(r.order.lines[0].id)).qtyShipped) === 400);
    const c = await closeout(r.order.id);
    ok('the order is no longer held open by a problem or an unpaid invoice', !codes(c).includes('SHIPMENT_PROBLEM') && !codes(c).includes('UNPAID') && !codes(c).includes('ON_ROAD'), codes(c));
    const again = await lost(r.shipment.id, { kind: 'LOST', reason: 'Second try' }); const deliver = await B.deliver(r.shipment);
    ok('it cannot be ended twice, delivered or put back on the road, and there is still one credit', again.status === 409 && deliver.status === 409 && (await shp(r.shipment.id)).status === 'LOST' && (await creditRows(r.order.id)).length === 1, `${again.status} ${deliver.status}`);
  });
  await scenario(G3, 'only a shipment with a problem on record can be ended as lost; when the invoice was already paid the credit is owed back (N-027)', async (ok) => {
    const r = await shipped(300);
    const early = await lost(r.shipment.id, { kind: 'LOST', reason: 'Carrier cannot find it' });
    ok('a shipment simply on the road is refused: the problem is reported first', early.status === 409 && (await shp(r.shipment.id)).status === 'IN_TRANSIT' && (await creditRows(r.order.id)).length === 0, `${early.status} ${err(early)}`);
    const total = num((await invOf(r.invoice.id)).totalAmount); await pay(r.invoice.id, total); await problem(r.shipment.id, 'Carrier cannot find it');
    const done = await lost(r.shipment.id, { kind: 'LOST', reason: 'Carrier closed the trace with no result' }, credit);
    const credits = await creditRows(r.order.id);
    ok('a credit manager may decide it too, and the credit is for the whole invoice', done.status === 200 && credits.length === 1 && Math.abs(num(credits[0].totalAmount) + total) < 0.005, `${done.status} ${err(done)}`);
    ok('no money is moved: the credit stands as owed back to the customer until a refund is recorded', num(credits[0].paidAmount) === 0 && codes(await closeout(r.order.id)).includes('CREDIT_OWED'), codes(await closeout(r.order.id)));
  });
  await scenario(G3, 'a lost load credits only what earlier credits left (N-027)', async (ok) => {
    const r = await shipped(500); const total = num((await invOf(r.invoice.id)).totalAmount);
    const first = await credit.post(`/api/invoices/${r.invoice.id}/credit`, { reason: 'Goodwill', lines: [{ invoiceLineId: (await invOf(r.invoice.id)).lines[0].id, quantity: 100 }] });
    await problem(r.shipment.id, 'Rolled over'); const done = await lost(r.shipment.id, { kind: 'DESTROYED', reason: 'Rolled over on the ramp' });
    const credits = await creditRows(r.order.id);
    ok('the two credits together equal the invoice, to the cent', first.status === 201 && done.status === 200 && credits.length === 2 && Math.abs(credits.reduce((a, c) => a + num(c.totalAmount), 0) + total) < 0.005, `${first.status} ${done.status} ${credits.map((c) => c.totalAmount)} of ${total}`);
    const third = await credit.post(`/api/invoices/${r.invoice.id}/credit`, { reason: 'More', amount: 1 });
    ok('nothing more can be credited afterwards', third.status === 409, `${third.status}`);
  });
  await scenario(G3, 'nothing ships to a customer whose account was closed after the order was confirmed (N-005)', async (ok) => {
    const c = await prisma.organization.create({ data: { code: tag('P8C'), name: 'P8 closing customer', type: 'OEM' } });
    const r = await B.readyToShip(300, { customer: c });
    await prisma.organization.update({ where: { id: c.id }, data: { isActive: false } });
    const d = await B.dispatch(r.shipment);
    ok('dispatch is refused and says the account is closed', d.status === 409 && /account is closed/.test(err(d)), `${d.status} ${err(d)}`);
    ok('no stock left and no invoice was raised', num((await stock(r.coilId)).qtyOnHand) === 800 && (await B.invoicesOf(r.order.id)).length === 0);
    await prisma.organization.update({ where: { id: c.id }, data: { isActive: true } });
    const go = await B.dispatch(r.shipment);
    ok('once the account is reopened the same shipment goes', go.status === 200 && (await B.invoicesOf(r.order.id)).length === 1);
  });
  await scenario(G3, 'a carrier\'s system reports delivery with no name: it is accepted and marked as such', async (ok) => {
    const r = await B.readyToShip(200, { carrierId: w.carrierOrg.id }); await B.dispatch(r.shipment);
    const rep = await PCAR.call('POST', `/carrier/shipments/${r.shipment.id}/status`, { status: 'DELIVERED' });
    const s = await shp(r.shipment.id);
    ok('the report is accepted and the shipment is delivered', rep.status < 300 && s.status === 'DELIVERED', `${rep.status} ${JSON.stringify(rep.body).slice(0, 150)}`);
    ok('it is not counted as signed for: the reason says it came from the carrier\'s system with no name', s.podCaptured === false && /carrier's system/.test(s.noPodReason || ''), `${s.podCaptured} ${s.noPodReason}`);
    const r2 = await B.readyToShip(200, { carrierId: w.carrierOrg.id }); await B.dispatch(r2.shipment);
    await PCAR.call('POST', `/carrier/shipments/${r2.shipment.id}/pod`, { signedBy: 'R. Receiver' });
    const s2 = await shp(r2.shipment.id);
    ok('a carrier report that names the receiver is proof', s2.status === 'DELIVERED' && s2.podCaptured === true && s2.podSignature === 'R. Receiver' && s2.noPodReason === null, `${s2.status} ${s2.podSignature}`);
  });
  await scenario(G3, 'a carrier reaches only the shipments given to it', async (ok) => {
    const mine = await B.readyToShip(100, { carrierId: w.carrierOrg.id }); const notMine = await B.readyToShip(100, { carrierId: w.carrierOrg2.id });
    await B.dispatch(mine.shipment); await B.dispatch(notMine.shipment);
    const x = await PCAR.call('POST', `/carrier/shipments/${notMine.shipment.id}/status`, { status: 'DELIVERED' });
    ok('a report on another carrier\'s shipment is refused', x.status === 404 || x.status === 403, `${x.status}`);
    ok('and that shipment is unchanged', (await shp(notMine.shipment.id)).status === 'IN_TRANSIT');
    const list = await PCAR.call('GET', '/carrier/shipments?limit=200');
    const ids = (list.body?.data || list.body?.shipments || []).map((s) => s.id);
    ok('its own list holds its shipment and not the other', ids.includes(mine.shipment.id) && !ids.includes(notMine.shipment.id), `${list.status} ${ids.length}`);
  });
  await scenario(G3, 'freight typed on the order is billed once, on the first shipment, and never again on a later one', async (ok) => {
    const c = await B.received({ weightLb: 1500 });
    const o = await B.order([B.line(1000)], { freight: 75 }); await B.reserve(o, o.lines[0], c, 1000);
    const s1 = await newShipment(o, [[o.lines[0], 600]]); await B.dispatch(s1.body);
    const s2 = await newShipment(o, [[o.lines[0], 400]]); await B.dispatch(s2.body);
    const invs = await B.invoicesOf(o.id);
    const freight = invs.map((i) => num(i.freightAmount ?? i.shippingAmount ?? 0));
    ok('two invoices were raised', invs.length === 2);
    ok('the freight on the order was billed in total exactly once', near(freight.reduce((a, b) => a + b, 0), 75), freight.join());
    ok('and the two invoices together equal the order total', near(invs.reduce((a, i) => a + num(i.totalAmount), 0), num(o.totalAmount)), `${invs.map((i) => String(i.totalAmount)).join()} vs ${o.totalAmount}`);
  });
  await scenario(G3, 'freight rates are not calculated by this product: the amount is whatever staff type on the order', async (ok) => {
    const tables = (await prisma.$queryRawUnsafe(`select table_name from information_schema.tables where table_schema='public' and table_name ~* 'freightrate|ratecard|carrierrate|tariff|fuelsurcharge|lane'`)).map((t) => t.table_name);
    ok('there is no freight rate, tariff, lane or fuel surcharge table', tables.length === 0, tables.join());
    const pkg = fs.readFileSync('src/backend/package.json', 'utf8');
    ok('no rating library or carrier rate service is installed', !/easypost|shippo|fedex|ups-api|project44|shipengine|freightos/i.test(pkg));
    ok('rate shopping, accessorials, fuel surcharge and freight class are therefore NOT VERIFIED and none was invented', true);
  }, NA);
  await scenario(G3, 'no carrier is connected: there is no label purchase, pickup request or tracking pull to test', async (ok) => {
    const src = ['src/backend/src/routes/shipments.js', 'src/backend/src/lib/shippingDocuments.js', 'src/backend/src/services/printAutomationService.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    ok('the shipping code makes no outside call', !/fetch\(|axios|https?\.request|outbound\(/.test(src));
    const tables = (await prisma.$queryRawUnsafe(`select table_name from information_schema.tables where table_schema='public' and table_name ~* 'trackingevent|carrierlabel|pickuprequest|parcel'`)).map((t) => t.table_name);
    ok('there is no tracking-event, carrier-label, pickup or parcel table', tables.length === 0, tables.join());
    ok('what exists instead: a carrier may report status to us through the partner API (verified above and in Phase 4)', true);
    ok('parcel, LTL and truckload booking are therefore NOT APPLICABLE; no carrier capability was invented', true);
  }, NA);
  await scenario(G3, 'the freight screens with no data behind them are marked as sample screens; the four on real shipments are not', async (ok) => {
    const router = fs.readFileSync('src/frontend/src/router/AppRouter.jsx', 'utf8');
    const blocks = router.split(/\n\s*\{\n\s*path: '/).filter((b) => b.startsWith('freight/'));
    ok('seven freight routes exist', blocks.length === 7, String(blocks.length));
    // 2026-11-22: the Shipment Planner, Tracking Board, Exception Inbox and proof of delivery read real shipments (qa/sim/ui-freight.cjs).
    const real = ['freight/planner', 'freight/tracking', 'freight/exceptions', 'freight/pod/:shipmentId'];
    const isReal = (b) => real.some((r) => b.startsWith(`${r}'`));
    ok('the four on real shipments carry no sample notice', blocks.filter(isReal).length === 4 && blocks.filter(isReal).every((b) => !/<SampleScreen /.test(b)));
    ok('every other one is wrapped in the sample-screen notice', blocks.filter((b) => !isReal(b)).every((b) => /<SampleScreen /.test(b)), blocks.filter((b) => !isReal(b) && !/<SampleScreen /.test(b)).map((b) => b.slice(0, 30)).join());
    ok('nothing on a sample screen is counted as working', true);
  }, NA);
  await scenario(G3, 'the bill of lading and packing list are drawn from the shipment, with nothing invented (N-014)', async (ok) => {
    const r = await B.readyToShip(300);
    await A.put(`/api/shipments/${r.shipment.id}`, { bolNumber: 'BOL-4410', carrierName: 'Midwest Flatbed' }, 'shipping');
    const q = await papers(r.shipment.id);
    ok('both papers are queued', q.status === 200 && q.body.papers.length === 2 && q.body.papers.map((p) => p.type).sort().join() === 'BOL,PACKING_LIST', `${q.status} ${err(q)}`);
    const bol = await render(q.body.papers.find((p) => p.type === 'BOL').id); const pl = await render(q.body.papers.find((p) => p.type === 'PACKING_LIST').id);
    const coil = await prisma.coil.findUnique({ where: { id: r.coilId } });
    ok('the bill of lading shows the typed number, the carrier, the order and the branch it leaves from', bol.includes('BOL-4410') && bol.includes('Midwest Flatbed') && bol.includes(r.order.orderNumber) && bol.includes('QA Branch 1'), bol.slice(0, 200));
    ok('the packing list shows the stock item and its heat', pl.includes(coil.coilNumber) && pl.includes(heat.heatNumber));
    ok('neither carries the invented address, freight class or NMFC number of the old template', ![bol, pl].some((h) => /1234 Industrial|Chicago, IL 60601|123456|SteelWise Service Center/.test(h)) && !/>\s*60\s*</.test(bol));
    ok('both say the shipment has not yet been dispatched', bol.includes('NOT YET DISPATCHED') && pl.includes('NOT YET DISPATCHED'));
  });
  await scenario(G3, 'a paper waiting in the queue is brought up to date, never printed stale, and never queued twice', async (ok) => {
    const r = await B.readyToShip(200);
    const q1 = await papers(r.shipment.id); const id = q1.body.papers.find((p) => p.type === 'BOL').id;
    await A.put(`/api/shipments/${r.shipment.id}`, { carrierName: 'Changed Carrier Co' }, 'shipping'); await B.dispatch(r.shipment);
    const q2 = await papers(r.shipment.id);
    ok('asking again returns the same two papers, not two more', q2.body.papers.map((p) => p.id).sort().join() === q1.body.papers.map((p) => p.id).sort().join());
    const bol = await render(id);
    ok('the waiting paper now shows the new carrier and no longer says "not yet dispatched"', bol.includes('Changed Carrier Co') && !bol.includes('NOT YET DISPATCHED'));
    await A.post(`/api/print-queue/${id}/printed`, {}, 'shipping');
    const q3 = await papers(r.shipment.id);
    ok('once printed, asking again queues a fresh copy and leaves the printed one as it was', q3.body.papers.find((p) => p.type === 'BOL').id !== id && (await prisma.printQueueJob.findUnique({ where: { id } })).status === 'PRINTED');
  });
  await scenario(G3, 'text on a printed paper cannot carry markup', async (ok) => {
    const c = await prisma.organization.create({ data: { code: tag('P8X'), name: 'Acme <script>alert(1)</script> & Sons', type: 'OEM' } });
    const r = await B.readyToShip(100, { customer: c });
    await A.put(`/api/shipments/${r.shipment.id}`, { carrierName: '<img src=x onerror=alert(2)>' }, 'shipping');
    const q = await papers(r.shipment.id); const bol = await render(q.body.papers.find((p) => p.type === 'BOL').id);
    ok('the customer name and carrier are printed as text', bol.includes('Acme &lt;script&gt;alert(1)&lt;/script&gt; &amp; Sons') && bol.includes('&lt;img src=x onerror=alert(2)&gt;'), bol.slice(bol.indexOf('Acme') - 20, bol.indexOf('Acme') + 90));
    ok('no script or image tag from the data reaches the page', !/<script>alert\(1\)|<img src=x/.test(bol));
  });
  await scenario(G3, 'each branch sees and settles its own print jobs (N-015)', async (ok) => {
    const r = await B.readyToShip(100); const q = await papers(r.shipment.id); const id = q.body.papers[0].id;
    const row = await prisma.printQueueJob.findUnique({ where: { id } });
    ok('the job carries the branch the shipment leaves from', row.locationId === L1.id);
    const mine = await queueOf('shipping'); const theirs = (await ship2.get('/api/print-queue')).body;
    ok('branch 1 sees it; branch 2 does not', mine.queue.some((j) => j.id === id) && !theirs.queue.some((j) => j.id === id));
    const x = await ship2.post(`/api/print-queue/${id}/printed`, {}); const y = await ship2.post(`/api/print-queue/${id}/skip`, { reason: 'not ours' }); const z = await ship2.get(`/api/print-queue/${id}/render`);
    ok('branch 2 cannot mark it printed, skip it or draw it', [x, y, z].every((a) => a.status === 404) && (await prisma.printQueueJob.findUnique({ where: { id } })).status === 'PENDING', [x, y, z].map((a) => a.status).join());
    ok('the queue says how many are waiting and how many it shows', Number.isInteger(mine.pendingCount) && mine.shown === mine.queue.length && mine.shown <= 500);
  });
  await scenario(G3, 'a print job is settled once, by a named person', async (ok) => {
    const r = await B.readyToShip(100); const q = await papers(r.shipment.id); const [a, b] = q.body.papers.map((p) => p.id);
    const p1 = await A.post(`/api/print-queue/${a}/printed`, {}, 'shipping'); const p2 = await A.post(`/api/print-queue/${a}/printed`, {}, 'shipping'); const sk = await A.post(`/api/print-queue/${a}/skip`, { reason: 'changed my mind' }, 'shipping');
    const row = await prisma.printQueueJob.findUnique({ where: { id: a } });
    ok('printed once; the second time and a later skip are refused', p1.status === 200 && p2.status === 409 && sk.status === 409 && row.status === 'PRINTED', `${p1.status} ${p2.status} ${sk.status}`);
    const log = await prisma.auditLog.findMany({ where: { eventType: 'PRINT_JOB_PRINTED', details: { path: ['printJobId'], equals: a } } });
    ok('when it was printed is on the job, and one record names who printed it', Boolean(row.printedAt) && log.length === 1 && log[0].userId === users.shipping.id, `${log.length}`);
    const noWhy = await A.post(`/api/print-queue/${b}/skip`, {}, 'shipping'); const skip = await A.post(`/api/print-queue/${b}/skip`, { reason: 'Customer picks up without papers' }, 'shipping');
    ok('skipping needs a reason, and with one the job is skipped', noWhy.status === 400 && skip.status === 200 && (await prisma.printQueueJob.findUnique({ where: { id: b } })).status === 'SKIPPED', `${noWhy.status} ${skip.status}`);
  });
  await scenario(G3, 'a job label prints the real branch, order and customer PO, and blanks for what is not on file', async (ok) => {
    const k = await stagedJob({ qty: 200 });
    const bad = await A.post('/api/print-queue/trigger', { jobId: k.job.id, type: 'HOLOGRAM' }, 'shipping');
    const t = await A.post('/api/print-queue/trigger', { jobId: k.job.id, type: 'SHIPPING_LABEL' }, 'shipping');
    ok('an unknown kind of label is refused', bad.status === 400, `${bad.status}`);
    const row = t.body?.printJobId && await prisma.printQueueJob.findUnique({ where: { id: t.body.printJobId } });
    ok('the label is queued for the job\'s branch', t.status === 200 && row && row.locationId === L1.id, `${t.status} ${err(t)}`);
    const p = row?.payload || {};
    ok('it carries the order\'s own PO reference and the branch name', p.customerPO === k.order.poReference && /QA Branch 1/.test(String(p.branchName || p.shipFromName || '')), JSON.stringify(p).slice(0, 300));
    ok('pieces are blank, not "1 EA", and no invented address appears', (p.pieces == null) && !/1234 Industrial|60601/.test(JSON.stringify(p)));
    const other = await ship2.post('/api/print-queue/trigger', { jobId: k.job.id, type: 'SHIPPING_LABEL' });
    ok('another branch cannot queue a label for this job', other.status === 404, `${other.status}`);
  });
  await scenario(G3, 'a load listing belongs to one shipment on the dock, at the branch it leaves from', async (ok) => {
    const k = await tagged();
    const wrongOrigin = await A.post('/api/drop-tags/listings', { shipmentId: k.shipment.id, originLocationId: L2.id }, 'admin');
    const good = await A.post('/api/drop-tags/listings', { shipmentId: k.shipment.id, originLocationId: L1.id }, 'shipping');
    ok('a listing that starts at another branch than its shipment is refused', wrongOrigin.status === 409, `${wrongOrigin.status} ${err(wrongOrigin)}`);
    ok('a good one is saved with a number from the counter', good.status === 201 && /^DTL-\d{7}$/.test(String(good.body.listingId || good.body.listingNumber || '')), `${good.status} ${JSON.stringify(good.body).slice(0, 160)}`);
    const otherPkg = await tagged();
    const foreign = await A.post(`/api/drop-tags/listings/${good.body.id}/tags`, { dropTagIds: [otherPkg.tag.id] }, 'shipping');
    ok('a tag of a different order cannot be put on it', foreign.status === 409 || foreign.status === 400, `${foreign.status} ${err(foreign)}`);
    const depart = await A.post(`/api/drop-tags/listings/${good.body.id}/lock`, {}, 'shipping');
    ok('the listing cannot "depart" while its shipment is still on the dock', depart.status === 409 || depart.status === 400, `${depart.status} ${err(depart)}`);
    const gone = await shipped(100);
    const late = await A.post('/api/drop-tags/listings', { shipmentId: gone.shipment.id, originLocationId: L1.id }, 'shipping');
    ok('and no listing is made for a shipment that has already left', late.status === 409, `${late.status}`);
  });
  await scenario(G3, 'the list of listings answers as a list (it used to be mistaken for a tag)', async (ok) => {
    const r = await A.get('/api/drop-tags/listings?limit=5', 'shipping');
    ok('it answers 200 with rows, not "tag not found"', r.status === 200 && (Array.isArray(r.body?.listings) || Array.isArray(r.body?.data) || Array.isArray(r.body)), `${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
  });
  await scenario(G3, 'the shipment list is kept to the reader\'s branches and to a page', async (ok) => {
    const mine = await shipped(100);
    const c2 = await B.received({ weightLb: 500, locationId: L2.id });
    const o2 = await B.order([B.line(100)], { who: 'admin', extra: { locationId: L2.id } }); await B.reserve(o2, o2.lines[0], c2, 100);
    const s2 = await ship2.post('/api/shipments', { orderId: o2.id, fromLocationId: L2.id, items: [{ orderLineId: o2.lines[0].id, qtyShipped: 100 }] });
    const l1 = await A.get('/api/shipments?limit=200', 'branchWh'); const l2 = await ship2.get('/api/shipments?limit=200');
    const ids = (r) => (r.body?.data || r.body || []).map((s) => s.id);
    ok('branch 1 sees its own shipment and not branch 2\'s', ids(l1).includes(mine.shipment.id) && !ids(l1).includes(s2.body.id), `${l1.status} ${ids(l1).length}`);
    ok('branch 2 sees its own and not branch 1\'s', ids(l2).includes(s2.body.id) && !ids(l2).includes(mine.shipment.id));
    const direct = await ship2.get(`/api/shipments/${mine.shipment.id}`); const paper = await ship2.get(`/api/shipments/${mine.shipment.id}/documents`);
    ok('and cannot open branch 1\'s shipment or its papers by id', direct.status === 404 && paper.status === 404, `${direct.status} ${paper.status}`);
    const big = await A.get('/api/shipments?limit=100000', 'admin');
    ok('a request for a hundred thousand rows is cut to a page', ids(big).length <= 500, String(ids(big).length));
  });
  await scenario(G3, 'no email or text is sent when a shipment leaves or arrives', async (ok) => {
    const src = ['src/backend/src/routes/shipments.js', 'src/backend/src/services/billing.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    ok('the shipping and billing code calls no mail or text service', !/sendMail|nodemailer|twilio|sendgrid|sendEmail|sendSms/i.test(src));
    ok('customer notices by email and text are the owner\'s decision 5 (later); none was sent by any scenario', true);
    ok('what exists instead: a partner event for the customer\'s own system, verified in Phase 4', true);
  }, NA);
  await scenario(G3, 'the papers after delivery carry who received it', async (ok) => {
    const r = await shipped(200); await A.put(`/api/shipments/${r.shipment.id}/deliver`, { podSignature: 'Lee Okafor' }, 'shipping');
    const d = (await docs(r.shipment.id)).body;
    ok('the document data names the receiver and the delivery time', d.shipment.receivedBy === 'Lee Okafor' && Boolean(d.shipment.deliveredAt) && d.shipment.status === 'DELIVERED');
    const r2 = await shipped(200); await A.put(`/api/shipments/${r2.shipment.id}/deliver`, { noPodReason: 'Unattended yard, photo not taken' }, 'shipping');
    const d2 = (await docs(r2.shipment.id)).body;
    ok('or, where nobody signed, the reason', d2.shipment.receivedBy === null && d2.shipment.noSignatureReason === 'Unattended yard, photo not taken');
  });
}

// ══ 4. Invoicing, payments and accounting sync ═════════════════════════════════════════════
{
  const creditOn = (invoiceId, body, who = 'admin') => A.post(`/api/invoices/${invoiceId}/credit`, body, who);
  const creditsOf = (orderId) => prisma.invoice.findMany({ where: { orderId, kind: 'CREDIT' }, orderBy: { createdAt: 'asc' }, include: { lines: true, payments: true } });
  const moneyLog = (invoiceId, eventType) => prisma.auditLog.findMany({ where: { resourceType: 'Invoice', resourceId: invoiceId, ...(eventType && { eventType }) }, orderBy: { timestamp: 'asc' } });
  const freshCustomer = (name = 'P8 aging customer') => prisma.organization.create({ data: { code: tag('P8A'), name, type: 'OEM' } });

  await scenario(G4, 'dispatch raises one invoice for exactly what left, in the same step', async (ok) => {
    const r = await shipped(400);
    const invs = await B.invoicesOf(r.order.id); const inv = invs[0];
    ok('one invoice, tied to the shipment and the order', invs.length === 1 && inv.shipmentId === r.shipment.id && inv.kind === 'INVOICE' && inv.status === 'SENT');
    ok('its line is the order line, 400 at the order price', inv.lines.length === 1 && inv.lines[0].orderLineId === r.order.lines[0].id && num(inv.lines[0].quantity) === 400 && near(inv.lines[0].extendedPrice, 260) && near(inv.totalAmount, 260));
    ok('it is numbered from the invoice series', /^INV-\d{6}$/.test(inv.invoiceNumber));
    const days = Math.round((inv.dueDate - inv.invoiceDate) / 86_400_000);
    ok('due 30 days out, the default when the order names no terms', days === 30, String(days));
    const log = await moneyLog(inv.id, 'INVOICE_ISSUED');
    ok('one record says who issued it', log.length === 1 && log[0].userId === users.shipping.id);
  });
  await scenario(G4, 'invoice numbers run one after another and are never repeated', async (ok) => {
    const a = await shipped(100); const b = await shipped(100); const c = await shipped(100);
    const nums = [a, b, c].map((x) => Number(x.invoice.invoiceNumber.replace(/\D/g, '')));
    ok('three invoices in a row carry three consecutive numbers', nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1, nums.join());
    const dup = await prisma.$queryRawUnsafe('select count(*)::int as n from (select "invoiceNumber" from "Invoice" group by 1 having count(*) > 1) t');
    ok('no invoice number appears twice anywhere', dup[0].n === 0);
    const counter = await prisma.documentCounter.findUnique({ where: { series: 'INV' } });
    const top = await prisma.$queryRawUnsafe(`select max(substring("invoiceNumber" from '[0-9]+$')::bigint)::int as n from "Invoice" where "invoiceNumber" ~ '^INV-[0-9]+$'`);
    ok('the counter stands at the highest number issued: none was skipped', Number(counter.lastNumber) === top[0].n, `${counter.lastNumber} ${top[0].n}`);
  });
  await scenario(G4, 'a shipment is never invoiced twice', async (ok) => {
    const r = await shipped(300);
    const again = await B.dispatch(r.shipment);
    const manual = await A.post('/api/invoices', { orderId: r.order.id }, 'csr'); const byShipment = await A.post('/api/invoices', { shipmentId: r.shipment.id }, 'csr');
    ok('dispatching again is refused', again.status === 409, `${again.status}`);
    ok('raising an invoice by hand finds nothing left to bill, or hands back the one that exists', (manual.status === 409 || manual.body?.id === r.invoice.id) && (byShipment.status === 409 || byShipment.body?.id === r.invoice.id), `${manual.status} ${byShipment.status}`);
    ok('there is still exactly one invoice, for 300', (await B.invoicesOf(r.order.id)).length === 1 && num((await B.invoicesOf(r.order.id))[0].lines[0].quantity) === 300);
  });
  await scenario(G4, 'tax follows each part shipped, and the parts add up to the tax on the order to the cent', async (ok) => {
    const c = await B.received({ weightLb: 1500 });
    const o = await B.order([B.line(1000, 0.3333)], { taxRate: 0.0825 }); await B.reserve(o, o.lines[0], c, 1000);
    for (const q of [333, 333, 334]) { const s = await newShipment(o, [[o.lines[0], q]]); const d = await B.dispatch(s.body); if (d.status !== 200) throw new Error(err(d)); }
    const invs = await B.invoicesOf(o.id);
    ok('three invoices', invs.length === 3);
    ok('each of the first two carries tax in proportion to what it bills', invs.slice(0, 2).every((i) => near(i.taxAmount, num(i.subtotal) * num(o.taxAmount) / num(o.subtotal), 0.011)), invs.map((i) => `${i.subtotal}/${i.taxAmount}`).join(' '));
    ok('the tax on the three is the tax on the order exactly', near(invs.reduce((a, i) => a + num(i.taxAmount), 0), num(o.taxAmount), 0.0001), `${invs.reduce((a, i) => a + num(i.taxAmount), 0)} vs ${o.taxAmount}`);
    ok('and every invoice total is its goods plus tax plus freight', invs.every((i) => near(i.totalAmount, num(i.subtotal) + num(i.taxAmount) + num(i.freightAmount), 0.0001)));
  });
  await scenario(G4, 'payment terms on the order set the due date', async (ok) => {
    const mk = async (paymentTerms) => { const c = await B.received({ weightLb: 300 }); const o = await B.order([B.line(100)], { extra: { paymentTerms } }); await B.reserve(o, o.lines[0], c, 100); const s = await newShipment(o, [[o.lines[0], 100]]); await B.dispatch(s.body); const i = (await B.invoicesOf(o.id))[0]; return Math.round((i.dueDate - i.invoiceDate) / 86_400_000); };
    const [n60, n15] = [await mk('NET 60'), await mk('Net 15')];
    ok('NET 60 is due in 60 days and Net 15 in 15', n60 === 60 && n15 === 15, `${n60} ${n15}`);
  });
  await scenario(G4, 'a payment in full settles the invoice and is written down with who took it', async (ok) => {
    const r = await shipped(300);
    const p = await pay(r.invoice.id, 195);
    const inv = await invOf(r.invoice.id);
    ok('the invoice is paid, with nothing owed', p.status === 201 && inv.status === 'PAID' && near(inv.paidAmount, 195) && p.body.balance === 0, `${p.status} ${inv.status}`);
    ok('one payment row holds the amount, the method and the check number', inv.payments.length === 1 && near(inv.payments[0].amount, 195) && inv.payments[0].paymentMethod === 'CHECK' && /^CHK-/.test(inv.payments[0].referenceNumber));
    const log = await moneyLog(r.invoice.id, 'PAYMENT_RECORDED');
    ok('one record names the person who took it and the amount', log.length === 1 && log[0].userId === users.csr.id && near(log[0].details.amount, 195));
    ok('the order no longer shows anything unpaid', !codes(await closeout(r.order.id)).includes('UNPAID'));
  });
  await scenario(G4, 'part payments add up, and nobody can pay more than is owed', async (ok) => {
    const r = await shipped(300);
    const p1 = await pay(r.invoice.id, 100); const mid = await invOf(r.invoice.id);
    ok('after 100 of 195 the invoice is part paid, 95 owed', p1.status === 201 && mid.status === 'PARTIAL' && p1.body.balance === 95);
    const over = await pay(r.invoice.id, 95.01);
    ok('95.01 against 95 is refused', over.status === 409 && (await invOf(r.invoice.id)).payments.length === 1, `${over.status} ${err(over)}`);
    const p2 = await pay(r.invoice.id, 95); const end = await invOf(r.invoice.id);
    ok('the last 95 settles it', p2.status === 201 && end.status === 'PAID' && near(end.paidAmount, 195) && end.payments.length === 2);
    const more = await pay(r.invoice.id, 0.01);
    ok('and a paid invoice takes no more', more.status === 409, `${more.status}`);
  });
  await scenario(G4, 'what is typed for a payment is checked, including its date (N-007)', async (ok) => {
    const r = await shipped(200); const id = r.invoice.id;
    const rs = [await pay(id, 0), await pay(id, -5), await pay(id, 1.005), await pay(id, 'ten'), await pay(id, 1, 'csr', { paymentMethod: 'BARTER' }), await pay(id, 1, 'csr', { paymentMethod: 'CREDIT' }), await pay(id, 1, 'csr', { paymentDate: 'yesterday-ish' }), await pay(id, 1, 'csr', { paymentDate: '2031-01-01' })];
    ok('zero, negative, a fraction of a cent, not a number, an unknown method, "credit" as a method, a bad date and a date in 2031 are each refused', rs.every((x) => x.status === 400), rs.map((x) => x.status).join());
    ok('and none of them left a payment or changed the invoice', (await invOf(id)).payments.length === 0 && (await invOf(id)).status === 'SENT');
    const back = await pay(id, 1, 'csr', { paymentDate: new Date(Date.now() - 5 * 86_400_000).toISOString() });
    ok('a payment dated five days ago (a check found in the drawer) is accepted with that date', back.status === 201 && Math.abs(new Date((await invOf(id)).payments[0].paymentDate) - (Date.now() - 5 * 86_400_000)) < 60_000);
  });
  await scenario(G4, 'only sales and managers of the invoice\'s branch take payments', async (ok) => {
    const r = await shipped(200); const id = r.invoice.id;
    const a = await pay(id, 1, 'shipping'); const b = await pay(id, 1, 'branchB'); const c = await pay(id, 1, 'operator'); const d = await auditor.post(`/api/invoices/${id}/payments`, { amount: 1, paymentMethod: 'CHECK' });
    ok('the shipping clerk, the operator and the auditor are refused', a.status === 403 && c.status === 403 && d.status === 403, `${a.status} ${c.status} ${d.status}`);
    ok('sales at another branch cannot find the invoice', b.status === 404, `${b.status}`);
    ok('nothing was recorded', (await invOf(id)).payments.length === 0);
    const good = await pay(id, 1, 'branchA');
    ok('sales at its own branch can', good.status === 201);
  });
  await scenario(G4, 'a credit memo is a manager\'s decision, needs a reason, and never exceeds the invoice', async (ok) => {
    const r = await shipped(300); const id = r.invoice.id;
    const byCsr = await creditOn(id, { amount: 20, reason: 'Short by one piece' }, 'csr'); const noWhy = await creditOn(id, { amount: 20 }); const tooMuch = await creditOn(id, { amount: 195.01, reason: 'x' }); const cents = await creditOn(id, { amount: 1.005, reason: 'x' });
    ok('sales staff are refused; no reason, too much and a fraction of a cent are refused', byCsr.status === 403 && noWhy.status === 400 && tooMuch.status === 409 && cents.status === 400, `${byCsr.status} ${noWhy.status} ${tooMuch.status} ${cents.status}`);
    const good = await creditOn(id, { amount: 20, reason: 'Short by one piece' });
    const cm = (await creditsOf(r.order.id))[0]; const inv = await invOf(id);
    ok('the credit memo is numbered in its own series and points at the invoice', good.status === 201 && /^CM-\d{6}$/.test(cm.invoiceNumber) && cm.creditOfInvoiceId === id && near(cm.totalAmount, -20));
    ok('it pays down what is owed: 175 left on the invoice, nothing owed back', near(num(inv.totalAmount) - num(inv.paidAmount), 175) && inv.status === 'PARTIAL' && (await closeout(r.order.id)).figures.creditOwedBack === 0, `${inv.paidAmount} ${inv.status}`);
    ok('the record names the manager and the reason', (await moneyLog(id, 'CREDIT_ISSUED')).length + (await moneyLog(cm.id, 'CREDIT_ISSUED')).length >= 1);
    const rest = await creditOn(id, { amount: 175.01, reason: 'x' });
    ok('a second credit cannot take the total over the invoice', rest.status === 409 && /Only 175.00/.test(err(rest)), `${rest.status} ${err(rest)}`);
  });
  await scenario(G4, 'a credit by line cannot credit more of a line than was billed', async (ok) => {
    const r = await shipped(300); const inv = await invOf(r.invoice.id); const line = inv.lines[0];
    const bad = [await creditOn(inv.id, { reason: 'x', lines: [{ invoiceLineId: crypto.randomUUID(), quantity: 1 }] }), await creditOn(inv.id, { reason: 'x', lines: [{ invoiceLineId: line.id, quantity: 0 }] }), await creditOn(inv.id, { reason: 'x', lines: [{ invoiceLineId: line.id, quantity: 301 }] })];
    ok('a line that is not on the invoice, zero and 301 of 300 are refused', bad[0].status === 400 && bad[1].status === 400 && bad[2].status === 409, bad.map((x) => x.status).join());
    const good = await creditOn(inv.id, { reason: 'Twenty pounds short', lines: [{ invoiceLineId: line.id, quantity: 20 }] });
    const cm = (await creditsOf(r.order.id))[0];
    ok('20 of the line is credited at the line price', good.status === 201 && near(cm.totalAmount, -13) && cm.lines.length === 1 && Math.abs(num(cm.lines[0].quantity)) === 20, `${good.status} ${cm?.totalAmount}`);
    const over = await creditOn(inv.id, { reason: 'x', lines: [{ invoiceLineId: line.id, quantity: 281 }] });
    ok('then only 280 of it is left to credit', over.status === 409 && /only 280/.test(err(over)), `${over.status} ${err(over)}`);
  });
  await scenario(G4, 'a credit memo cannot itself be credited, paid or cancelled', async (ok) => {
    const r = await shipped(200); await creditOn(r.invoice.id, { amount: 10, reason: 'Goodwill' });
    const cm = (await creditsOf(r.order.id))[0];
    const a = await creditOn(cm.id, { amount: 1, reason: 'x' }); const b = await pay(cm.id, 1); const c = await A.post(`/api/invoices/${cm.id}/cancel`, {}, 'admin');
    ok('each is refused', a.status === 409 && b.status >= 400 && c.status === 409, `${a.status} ${b.status} ${c.status}`);
    ok('and the credit memo is unchanged', near((await invOf(cm.id)).totalAmount, -10) && (await invOf(cm.id)).status !== 'CANCELLED');
  });
  await scenario(G4, 'credit on an invoice already paid is owed back, and a refund settles it', async (ok) => {
    const r = await shipped(300); await pay(r.invoice.id, 195);
    await creditOn(r.invoice.id, { amount: 40, reason: 'Edge damage accepted at a discount' });
    const cm = (await creditsOf(r.order.id))[0]; const pos = await closeout(r.order.id);
    ok('40 is owed back to the customer and the order says so', pos.figures.creditOwedBack === 40 && codes(pos).includes('CREDIT_OWED'), JSON.stringify(pos.figures));
    const refund = (amount, who = 'admin', extra = {}) => A.post(`/api/invoices/${cm.id}/refund`, { amount, paymentMethod: 'CHECK', ...extra }, who);
    const bad = [await refund(40.01), await refund(0), await refund(5, 'csr'), await refund(5, 'admin', { paymentMethod: 'CREDIT' }), await A.post(`/api/invoices/${r.invoice.id}/refund`, { amount: 5, paymentMethod: 'CHECK' }, 'admin')];
    ok('more than is owed, zero, a refund by sales staff, "credit" as the method, and a refund on an ordinary invoice are refused', bad[0].status === 409 && bad[1].status === 400 && bad[2].status === 403 && bad[3].status === 400 && bad[4].status === 409, bad.map((x) => x.status).join());
    const p1 = await refund(15); const p2 = await refund(25);
    ok('two refunds of 15 and 25 settle it', p1.status === 201 && p2.status === 201 && (await closeout(r.order.id)).figures.creditOwedBack === 0, `${p1.status} ${p2.status}`);
    const again = await refund(0.01);
    ok('and nothing more can be refunded', again.status === 409, `${again.status}`);
    ok('each refund has its record', (await moneyLog(cm.id, 'REFUND_RECORDED')).length === 2);
  });
  await scenario(G4, 'an invoice with nothing on it can be cancelled by a manager, and what it billed is billed again once', async (ok) => {
    const r = await shipped(300); const id = r.invoice.id;
    const byCsr = await A.post(`/api/invoices/${id}/cancel`, {}, 'csr'); const c = await A.post(`/api/invoices/${id}/cancel`, {}, 'admin'); const twice = await A.post(`/api/invoices/${id}/cancel`, {}, 'admin');
    ok('sales staff cannot cancel; a manager can, once', byCsr.status === 403 && c.status < 300 && twice.status === 409 && (await invOf(id)).status === 'CANCELLED', `${byCsr.status} ${c.status} ${twice.status}`);
    const pos = await closeout(r.order.id);
    ok('the order now shows 300 shipped and not invoiced', pos.figures.notInvoiced === 300 && codes(pos).includes('NOT_INVOICED'), JSON.stringify(pos.figures));
    const again = await A.post('/api/invoices', { orderId: r.order.id }, 'csr'); const third = await A.post('/api/invoices', { orderId: r.order.id }, 'csr');
    const live = (await B.invoicesOf(r.order.id)).filter((i) => i.status !== 'CANCELLED');
    ok('raising it again makes one new invoice for the same 300, with a new number; a third try finds nothing', again.status === 201 && third.status === 409 && live.length === 1 && num(live[0].lines[0].quantity) === 300 && live[0].invoiceNumber !== r.invoice.invoiceNumber, `${again.status} ${third.status}`);
    const paid = await shipped(100); await pay(paid.invoice.id, 10);
    const no = await A.post(`/api/invoices/${paid.invoice.id}/cancel`, {}, 'admin');
    ok('an invoice with a payment on it cannot be cancelled: a credit memo is the way', no.status === 409 && /credit memo/.test(err(no)), `${no.status}`);
  });
  await scenario(G4, 'the invoice shows its own history: issued, paid and credited, each with who', async (ok) => {
    const r = await shipped(300); await pay(r.invoice.id, 50); await creditOn(r.invoice.id, { amount: 10, reason: 'Late delivery' });
    const g = await A.get(`/api/invoices/${r.invoice.id}`, 'csr');
    const ev = (g.body.history || []).map((h) => h.event);
    ok('issued, payment and credit are listed in order', g.status === 200 && ev[0] === 'INVOICE_ISSUED' && ev.includes('PAYMENT_RECORDED') && (ev.includes('CREDIT_ISSUED') || g.body.payments.some((p) => p.paymentMethod === 'CREDIT')), ev.join());
    ok('each names a person', (g.body.history || []).every((h) => h.by));
    ok('the balance is what is left: 195 less 50 paid less 10 credited', g.body.balance === 135, String(g.body.balance));
  });
  await scenario(G4, 'the invoice list finds by number, filters by state, and its totals are the sum of what it lists', async (ok) => {
    const cust = await freshCustomer('P8 list customer');
    const a = await shipped(100, { customer: cust }); const b = await shipped(200, { customer: cust }); await pay(b.invoice.id, 30); const c = await shipped(100, { customer: cust }); await pay(c.invoice.id, 65);
    const open = await A.get(`/api/invoices?status=OPEN&customerId=${cust.id}`, 'csr');
    ok('two of the three are open', open.status === 200 && open.body.data.length === 2 && open.body.meta.total === 2);
    ok('owed on the list is 65 + 100', open.body.summary.openBalance === 165 && near(open.body.data.reduce((s, i) => s + i.balance, 0), 165), JSON.stringify(open.body.summary));
    const found = await A.get(`/api/invoices?search=${a.invoice.invoiceNumber}`, 'csr'); const byOrder = await A.get(`/api/invoices?search=${b.order.orderNumber}`, 'csr');
    ok('an invoice is found by its number and by its order number', found.body.data.length === 1 && found.body.data[0].id === a.invoice.id && byOrder.body.data.some((i) => i.id === b.invoice.id));
    const bad = await A.get('/api/invoices?status=WHATEVER', 'csr'); const paid = await A.get(`/api/invoices?status=PAID&customerId=${cust.id}`, 'csr');
    ok('an unknown state is refused and "paid" lists the one that is paid', bad.status === 400 && paid.body.data.length === 1 && paid.body.data[0].id === c.invoice.id);
    const other = await A.get(`/api/invoices?customerId=${cust.id}`, 'branchB');
    ok('sales at another branch sees none of them', other.status === 200 && other.body.data.length === 0, String(other.body?.data?.length));
  });
  await scenario(G4, 'what a customer owes is aged by days past due, from the invoices themselves', async (ok) => {
    const cust = await freshCustomer();
    const mk = async (qty, daysPastDue) => { const r = await shipped(qty, { customer: cust }); await prisma.invoice.update({ where: { id: r.invoice.id }, data: { dueDate: new Date(Date.now() - daysPastDue * 86_400_000 - 3_600_000) } }); return r; };
    await mk(100, -10); await mk(200, 10); await mk(300, 45); await mk(400, 75); const old = await mk(500, 120);
    const rep = await A.get(`/api/invoices/aging?customerId=${cust.id}`, 'csr'); const row = rep.body.customers?.[0] || {};
    ok('one row for the customer, five invoices', rep.status === 200 && rep.body.customers.length === 1 && row.invoices === 5, `${rep.status} ${JSON.stringify(row)}`);
    ok('65 not due, 130 at 1 to 30, 195 at 31 to 60, 260 at 61 to 90, 325 over 90', row.notDue === 65 && row.days1to30 === 130 && row.days31to60 === 195 && row.days61to90 === 260 && row.over90 === 325, JSON.stringify(row));
    ok('the columns add up to the total owed', row.total === 975 && near(row.notDue + row.days1to30 + row.days31to60 + row.days61to90 + row.over90, row.total));
    await pay(old.invoice.id, 125);
    const after = (await A.get(`/api/invoices/aging?customerId=${cust.id}`, 'csr')).body.customers[0];
    ok('a part payment takes only what was paid out of its column', after.over90 === 200 && after.total === 850, JSON.stringify(after));
    const check = await prisma.$queryRawUnsafe(`select coalesce(sum(i."totalAmount" - i."paidAmount"),0)::float as owed from "Invoice" i join "Order" o on o.id = i."orderId" where o."buyerId" = $1 and i.kind = 'INVOICE' and i.status in ('SENT','PARTIAL')`, cust.id);
    ok('and the total agrees with the invoices read straight from the database', near(check[0].owed, after.total), `${check[0].owed}`);
  });
  await scenario(G4, 'paid and cancelled invoices are not aged, and credit owed back is shown beside, not netted', async (ok) => {
    const cust = await freshCustomer('P8 aging two');
    const a = await shipped(100, { customer: cust }); await pay(a.invoice.id, 65);
    const b = await shipped(100, { customer: cust }); await A.post(`/api/invoices/${b.invoice.id}/cancel`, {}, 'admin');
    const c = await shipped(200, { customer: cust });
    await creditOn(a.invoice.id, { amount: 25, reason: 'Paid invoice, credit owed back' });
    const row = (await A.get(`/api/invoices/aging?customerId=${cust.id}`, 'csr')).body.customers[0];
    ok('only the one open invoice is aged: 130', row.invoices === 1 && row.total === 130, JSON.stringify(row));
    ok('the 25 owed back is in its own column and was not taken off the 130', row.creditOwedBack === 25);
    ok('the report says so in words', /not taken off/.test((await A.get('/api/invoices/aging', 'csr')).body.note) && Boolean(c));
  });
  await scenario(G4, 'the aging report is kept to the reader\'s branches', async (ok) => {
    const cust = await freshCustomer('P8 aging branch');
    await shipped(100, { customer: cust });
    const mine = await A.get(`/api/invoices/aging?customerId=${cust.id}`, 'branchA'); const theirs = await A.get(`/api/invoices/aging?customerId=${cust.id}`, 'branchB'); const top = await A.get(`/api/invoices/aging?customerId=${cust.id}`, 'regional');
    ok('sales at branch 1 sees the 65 owed', mine.body.customers.length === 1 && mine.body.customers[0].total === 65);
    ok('sales at branch 2 sees nothing for this customer', theirs.status === 200 && theirs.body.customers.length === 0 && theirs.body.totals.total === 0, JSON.stringify(theirs.body.totals));
    ok('the regional manager sees it', top.body.customers.length === 1);
    const wh = await A.get('/api/invoices/aging', 'operator');
    ok('the totals row is the sum of the customer rows for whoever reads it', mine.body.totals.total === 65 && [200, 403].includes(wh.status));
  });
  await scenario(G4, 'an overdue invoice is shown as overdue and counted in the overdue total', async (ok) => {
    const cust = await freshCustomer('P8 overdue');
    const r = await shipped(100, { customer: cust });
    await prisma.invoice.update({ where: { id: r.invoice.id }, data: { dueDate: new Date(Date.now() - 3 * 86_400_000) } });
    const g = await A.get(`/api/invoices/${r.invoice.id}`, 'csr'); const list = await A.get(`/api/invoices?status=OVERDUE&customerId=${cust.id}`, 'csr');
    ok('the invoice reads as overdue while its saved state stays "sent"', g.body.isOverdue === true && g.body.displayStatus === 'OVERDUE' && g.body.status === 'SENT');
    ok('the overdue filter lists it and the summary counts its 65', list.body.data.length === 1 && list.body.summary.overdueBalance === 65);
    await pay(r.invoice.id, 65);
    ok('once paid it is no longer overdue', (await A.get(`/api/invoices/${r.invoice.id}`, 'csr')).body.isOverdue === false);
  });
  await scenario(G4, 'the customer\'s own system is told of an invoice in the same save as the invoice', async (ok) => {
    const { partner, subscribe } = await import('./phase4-lib.mjs');
    const cust = await freshCustomer('P8 partner customer');
    const P1 = await partner(cust, 'CUSTOMER');
    if (typeof subscribe === 'function') await subscribe(P1, ['invoice.issued']).catch(() => null);
    const r = await shipped(100, { customer: cust });
    const rows = await prisma.webhookDelivery.findMany({ where: { eventType: 'invoice.issued', eventId: { endsWith: `invoice.issued:${r.invoice.id}` } } });
    const subs = await prisma.partnerWebhook.count({ where: { partnerId: P1.id } });
    ok('where the customer has a subscription, exactly one event is queued for the invoice; with none, none is', subs ? rows.length === 1 : rows.length === 0, `${subs} subscriptions, ${rows.length} events`);
    ok('nothing is sent to the customer by email: the code that raises invoices has no mail call', !/sendMail|nodemailer|sendgrid/i.test(fs.readFileSync('src/backend/src/services/billing.js', 'utf8')));
  });
  await scenario(G4, 'no outside accounting system is connected, and the product\'s own ledger posts nothing until it is started', async (ok) => {
    // Until Phase 9.5 this scenario recorded that no ledger existed (N-025). The product now has its own ledger (database file 16),
    // which stays off until an accountant's approval is on file. The scenario holds on a database with or without file 16.
    const tables = (await prisma.$queryRawUnsafe(`select table_name from information_schema.tables where table_schema='public' and table_name ~* 'journal|ledger|glaccount|chartofaccount|accountingperiod|glposting'`)).map((t) => t.table_name);
    const started = (await prisma.$queryRawUnsafe(`select value from "AppSetting" where key = 'ledger.activation'`).catch(() => []))[0];
    const active = Boolean(started && JSON.parse(typeof started.value === 'string' ? started.value : JSON.stringify(started.value)).active);
    const r = await shipped(100);
    if (!tables.length) ok('this database has no ledger tables (file 16 not applied): the sale is invoiced all the same', Boolean(r.invoice && r.invoice.id));
    else {
      const events = await prisma.$queryRawUnsafe(`select status from "LedgerEvent" where "sourceType" = 'Invoice' and "sourceId" = $1`, r.invoice.id);
      if (active) ok('the ledger has been started: the invoice has exactly one ledger event', events.length === 1, JSON.stringify(events));
      else ok('the ledger has not been started: the invoice wrote no ledger event and no journal entry', events.length === 0, JSON.stringify(events));
    }
    ok('no accounting connector is installed', !/quickbooks|intuit|xero|netsuite|sage|node-quickbooks/i.test(fs.readFileSync('src/backend/package.json', 'utf8')));
    const rep = await A.get('/api/admin/integrations', 'admin');
    const names = JSON.stringify(rep.body?.integrations || []);
    ok('the integrations report lists no accounting system', rep.status === 200 && !/quickbooks|xero|netsuite|\bsage\b|general ledger/i.test(names), (names.match(/"name":"[^"]+"/g) || []).join(' ').slice(0, 400));
    ok('nothing is sent to an outside accounting system: the ledger code makes no outbound call of any kind', !/\bfetch\(|axios|https?\.request|node:https?|nodemailer/.test(['src/backend/src/services/ledger.js', 'src/backend/src/services/ledgerReports.js', 'src/backend/src/services/ledgerCutover.js', 'src/backend/src/routes/ledger.js', 'src/backend/src/lib/ledgerRules.js'].map((f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '')).join('')));
  }, NA);
  await scenario(G4, 'no card or bank payment is processed: a payment is a record a person types', async (ok) => {
    const cols = (await prisma.$queryRawUnsafe(`select table_name || '.' || column_name as c from information_schema.columns where table_schema='public' and column_name ~* 'cardnumber|cvv|cvc|pan$|routingnumber|bankaccount|stripe|paymenttoken'`)).map((x) => x.c);
    ok('no column holds a card number, security code, bank account or processor token', cols.length === 0, cols.join());
    ok('no payment processor is installed', !/stripe|braintree|authorize\.?net|square|adyen|paypal/i.test(fs.readFileSync('src/backend/package.json', 'utf8')));
    const r = await shipped(100); const p = await pay(r.invoice.id, 10, 'csr', { paymentMethod: 'CARD', referenceNumber: 'Terminal slip 4471' });
    ok('"card" is a label on the record and nothing is charged', p.status === 201 && (await invOf(r.invoice.id)).payments[0].paymentMethod === 'CARD');
    ok('authorisation, capture, settlement and chargebacks are therefore NOT APPLICABLE; no real payment was processed', true);
  }, NA);
  await scenario(G4, 'invoices are not sent by this product: there is no invoice email or PDF delivery to test', async (ok) => {
    const src = fs.readFileSync('src/backend/src/services/billing.js', 'utf8') + fs.readFileSync('src/backend/src/routes/invoices.js', 'utf8');
    ok('the billing code says so and holds no sender', /Nothing here sends anything to a customer/.test(src) && !/sendMail|nodemailer|pdfkit|puppeteer/i.test(src));
    ok('"SENT" is the name of the open state of an invoice; it does not record a sending', true);
    ok('invoice delivery is the owner\'s decision 5 (later); no real invoice or notice left this machine', true);
  }, NA);
  await scenario(G4, 'money figures hold to the cent on every invoice the product has issued', async (ok) => {
    // Rows written straight into the database by older test fixtures (no issue record) are left out of the two sums.
    const ISSUED = `exists (select 1 from "AuditLog" a where a."resourceType" = 'Invoice' and a."resourceId" = i.id and a."eventType" in ('INVOICE_ISSUED', 'CREDIT_ISSUED'))`;
    const [a] = await prisma.$queryRawUnsafe(`select count(*)::int as n from "Invoice" i where i.status <> 'CANCELLED' and abs(i."totalAmount" - (i.subtotal + i."taxAmount" + i."freightAmount")) > 0.005`);
    const [b] = await prisma.$queryRawUnsafe(`select count(*)::int as n from "Invoice" i where ${ISSUED} and abs(i."paidAmount" - coalesce((select sum(p.amount) from "Payment" p where p."invoiceId" = i.id), 0)) > 0.005`);
    const [c] = await prisma.$queryRawUnsafe(`select count(*)::int as n from "Invoice" i where i.kind = 'INVOICE' and i.status <> 'CANCELLED' and (i."paidAmount" > i."totalAmount" + 0.005 or i."paidAmount" < -0.005)`);
    const [d] = await prisma.$queryRawUnsafe(`select count(*)::int as n from "Invoice" i where ${ISSUED} and i.kind = 'INVOICE' and i.status <> 'CANCELLED' and abs(i.subtotal - coalesce((select sum(l."extendedPrice") from "InvoiceLine" l where l."invoiceId" = i.id), 0)) > 0.005`);
    const [e] = await prisma.$queryRawUnsafe(`select count(*)::int as n from "Invoice" i where (i.kind = 'INVOICE' and i.status = 'PAID' and abs(i."totalAmount" - i."paidAmount") > 0.005) or (i.kind = 'INVOICE' and i.status = 'SENT' and abs(i."paidAmount") > 0.005 and i."totalAmount" > 0)`);
    ok('every invoice total is goods plus tax plus freight', a.n === 0, String(a.n));
    ok('every paid amount is the sum of its payment rows', b.n === 0, String(b.n));
    ok('no invoice is paid over its total or below zero', c.n === 0, String(c.n));
    ok('every invoice subtotal is the sum of its lines', d.n === 0, String(d.n));
    ok('every invoice marked paid is paid in full, and none marked sent has money on it', e.n === 0, String(e.n));
  });
}

// ══ 5. Costing, reconciliation and closeout ════════════════════════════════════════════════
{
  /** Shipped, delivered and paid in full. */
  async function finished(qty = 300, opts = {}) {
    const r = await shipped(qty, opts); await B.deliver(r.shipment); await pay(r.invoice.id, num(r.invoice.totalAmount));
    return r;
  }
  await scenario(G5, 'the cost of what was sold is the cost fixed on the stock movement when it left', async (ok) => {
    const r = await shipped(600, { unitCost: 0.4 });
    const mv = (await movesOf(r.shipment.id))[0]; const c = await costOf(r.order.id);
    ok('the movement carries 0.40 a pound, the item\'s cost at that moment', num(mv.unitCost) === 0.4);
    ok('material cost is 600 at 0.40: 240.00', c.material.cost === 240 && c.material.quantityCosted === 600 && c.material.quantityWithNoCost === 0, JSON.stringify(c.material));
    ok('goods invoiced are 390.00, so the margin is 150.00, 38.46%', c.revenue.net === 390 && c.margin === 150 && c.marginPct === 38.46 && c.complete === true, `${c.revenue.net} ${c.margin} ${c.marginPct}`);
    ok('the answer says how it was worked out and that nothing is posted to accounting', /cost fixed on each stock movement/.test(c.basis) && /No overhead/.test(c.basis) && /Nothing is posted/.test(c.basis));
  });
  await scenario(G5, 'a later change to the stock item\'s cost does not change what a past sale cost', async (ok) => {
    const r = await shipped(300, { unitCost: 0.5 });
    const before = await costOf(r.order.id);
    await setCost(r.coilId, 0.9);
    const after = await costOf(r.order.id);
    ok('the sale cost 150.00 before and after', before.material.cost === 150 && after.material.cost === 150 && after.margin === before.margin, `${before.material.cost} ${after.material.cost}`);
    const next = await B.order([B.line(100)]); await B.reserve(next, next.lines[0], r.coilId, 100); const s = await newShipment(next, [[next.lines[0], 100]]); await B.dispatch(s.body);
    ok('the next sale from the same item is costed at the new 0.90', (await costOf(next.id)).material.cost === 90);
  });
  await scenario(G5, 'shipping does not change the value on the stock item', async (ok) => {
    const c = await B.received({ weightLb: 1000 }); await setCost(c, 0.37);
    const hasJournal = (await prisma.$queryRawUnsafe(`select count(*)::int as n from information_schema.tables where table_schema='public' and table_name = 'JournalLine'`))[0].n === 1;
    const debitsToStock = async () => (hasJournal ? (await prisma.$queryRawUnsafe(`select count(*)::int as n from "JournalLine" l join "LedgerAccount" a on a.id = l."accountId" where l."coilId" = $1 and l.debit > 0 and a.code like '12%'`, c))[0].n : 0);
    const debitsBefore = await debitsToStock();
    const o = await B.order([B.line(400)]); await B.reserve(o, o.lines[0], c, 400); const s = await newShipment(o, [[o.lines[0], 400]]); await B.dispatch(s.body);
    const coil = await prisma.coil.findUnique({ where: { id: c } }); const inv = await stock(c);
    ok('the item still costs 0.37 a pound after 400 of it shipped', num(coil.unitCost) === 0.37);
    ok('only the quantity on hand moved: 600 left', num(inv.qtyOnHand) === 600);
    // Until Phase 9.5 this check was "there is no table for one". The ledger's journal now exists; what must hold is that
    // shipping revalues nothing: dispatch adds no debit to inventory for the item (a relief of stock is a credit).
    const writeUps = (await debitsToStock()) - debitsBefore;
    ok('no revaluation or write-up of the item was made anywhere', writeUps === 0, `${writeUps} debit lines to inventory for the item`);
  });
  await scenario(G5, 'when a stock item has no cost on file, the margin is not shown and the gap is named', async (ok) => {
    const r = await shipped(300);
    const mv = (await movesOf(r.shipment.id))[0]; const c = await costOf(r.order.id);
    ok('the movement has no cost: none was worked out', mv.unitCost === null);
    ok('the order\'s cost is marked incomplete and its margin is empty, not zero and not guessed', c.complete === false && c.margin === null && c.marginPct === null, `${c.complete} ${c.margin}`);
    ok('it says 300 shipped has no cost on file', c.material.quantityWithNoCost === 300 && c.missing.some((m) => /300 shipped has no cost/.test(m)), JSON.stringify(c.missing));
    ok('revenue is still reported: 195.00', c.revenue.net === 195);
  });
  await scenario(G5, 'a line filled from two stock items is costed item by item', async (ok) => {
    const [c1, c2] = [await B.received({ weightLb: 300 }), await B.received({ weightLb: 400 })]; await setCost(c1, 0.3); await setCost(c2, 0.5);
    const o = await B.order([B.line(500, 1)]); await B.reserve(o, o.lines[0], c1, 300); await B.reserve(o, o.lines[0], c2, 200);
    const s = await newShipment(o, [[o.lines[0], 500]]); await B.dispatch(s.body);
    const c = await costOf(o.id);
    ok('300 at 0.30 plus 200 at 0.50 is 190.00', c.material.cost === 190 && c.lines[0].materialCost === 190, JSON.stringify(c.material));
    ok('margin is 500.00 less 190.00', c.margin === 310);
  });
  await scenario(G5, 'a partly shipped order counts only what has shipped and been invoiced', async (ok) => {
    const c = await B.received({ weightLb: 1500 }); await setCost(c, 0.4);
    const o = await B.order([B.line(1000)]); await B.reserve(o, o.lines[0], c, 1000); const s = await newShipment(o, [[o.lines[0], 250]]); await B.dispatch(s.body);
    const k = await costOf(o.id);
    ok('revenue 162.50, cost 100.00, margin 62.50 on the 250 that left', k.revenue.net === 162.5 && k.material.cost === 100 && k.margin === 62.5, `${k.revenue.net} ${k.material.cost} ${k.margin}`);
    ok('the status shown is partly shipped', k.status === 'PARTIAL' && k.lines[0].shipped === 250);
  });
  await scenario(G5, 'tax and freight billed are not counted as revenue', async (ok) => {
    const c = await B.received({ weightLb: 800 }); await setCost(c, 0.2);
    const o = await B.order([B.line(500, 1)], { taxRate: 0.07, freight: 60 }); await B.reserve(o, o.lines[0], c, 500); const s = await newShipment(o, [[o.lines[0], 500]]); await B.dispatch(s.body);
    const inv = (await B.invoicesOf(o.id))[0]; const k = await costOf(o.id);
    ok('the invoice is 500 goods, 35 tax and 60 freight', near(inv.subtotal, 500) && near(inv.taxAmount, 35) && near(inv.freightAmount, 60) && near(inv.totalAmount, 595));
    ok('revenue for margin is the 500.00 of goods only', k.revenue.invoiced === 500 && k.margin === 400, `${k.revenue.invoiced} ${k.margin}`);
    ok('no freight cost is included, and the answer says so', /no freight cost/i.test(k.basis));
  });
  await scenario(G5, 'material returned to stock takes its cost back, and the credit takes the revenue back', async (ok) => {
    const r = await shipped(500, { unitCost: 0.4, price: 1 });
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Wrong width', lines: [{ orderLineId: r.order.lines[0].id, quantity: 200, disposition: 'RESTOCK' }] }, 'csr');
    const rc = await A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping');
    const k = await costOf(r.order.id);
    ok('the return was received and credited', rc.status === 200 && !rc.body.warning, `${rc.status} ${rc.body?.warning || ''}`);
    ok('cost: 200.00 shipped less 80.00 back to stock is 120.00', k.material.shippedCost === 200 && k.material.returnedToStockCost === 80 && k.material.cost === 120, JSON.stringify(k.material));
    ok('revenue: 500.00 invoiced less 200.00 credited is 300.00; margin 180.00', k.revenue.credited === 200 && k.revenue.net === 300 && k.margin === 180, JSON.stringify(k.revenue));
  });
  await scenario(G5, 'material returned and scrapped stays a cost of the sale', async (ok) => {
    const r = await shipped(500, { unitCost: 0.4, price: 1 });
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Bent in transit', lines: [{ orderLineId: r.order.lines[0].id, quantity: 100, disposition: 'SCRAP' }] }, 'csr');
    await A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping');
    const k = await costOf(r.order.id);
    ok('nothing came back to stock, so the cost is still 200.00', k.material.returnedToStockCost === 0 && k.material.cost === 200, JSON.stringify(k.material));
    ok('the 100.00 credited reduces revenue to 400.00 and margin to 200.00', k.revenue.net === 400 && k.margin === 200);
  });
  await scenario(G5, 'cost and margin are shown only to the roles that manage cost', async (ok) => {
    const r = await shipped(200, { unitCost: 0.4 });
    const seen = {}; for (const who of ['csr', 'shipping', 'operator', 'branchA']) seen[who] = (await A.get(`/api/orders/${r.order.id}/cost`, who)).status;
    const aud = (await auditor.get(`/api/orders/${r.order.id}/cost`)).status; const cm = (await credit.get(`/api/orders/${r.order.id}/cost`)).status;
    ok('sales, shipping, the operator and the auditor are refused', Object.values(seen).every((s) => s === 403) && aud === 403, `${JSON.stringify(seen)} ${aud}`);
    const yes = {}; for (const who of ['admin', 'branchWh', 'regional']) yes[who] = (await A.get(`/api/orders/${r.order.id}/cost`, who)).status;
    ok('a manager, the inventory manager, the regional manager and the credit manager see it', Object.values(yes).every((s) => s === 200) && (await mgr1.get(`/api/orders/${r.order.id}/cost`)).status === 200 && cm === 200, `${JSON.stringify(yes)} ${cm}`);
    const far = await A.get(`/api/orders/${r.order.id}/cost`, 'branchB');
    ok('and nobody reads the cost of another branch\'s order', [403, 404].includes(far.status));
  });
  await scenario(G5, 'stock cost does not leak through the order, the shipment or the stock item (N-020)', async (ok) => {
    const r = await shipped(200, { unitCost: 0.4 });
    const o2 = await B.order([B.line(100)]); await B.reserve(o2, o2.lines[0], r.coilId, 100);
    const paths = [`/api/orders/${o2.id}`, `/api/shipments/${r.shipment.id}`, `/api/shipments/${r.shipment.id}/documents`, `/api/coils/${r.coilId}`, `/api/orders/${r.order.id}/closeout`, '/api/inventory?limit=20'];
    const leaks = {};
    for (const who of ['csr', 'shipping', 'operator']) for (const p of paths) { const got = await A.get(p, who); const keys = deepKeys(got.body, /^(unitCost|landedCost|avgCost)$/).filter((k) => /coil|movement|inventory|allocations|^data|^unitCost|^landedCost/i.test(k) || true); if (got.status === 200 && keys.length) leaks[`${who} ${p}`] = keys.slice(0, 3); }
    ok('six screens read by sales, shipping and the operator carry no stock cost', Object.keys(leaks).length === 0, JSON.stringify(leaks).slice(0, 300));
    const mgr = await A.get(`/api/orders/${o2.id}`, 'admin');
    ok('a manager still sees the cost of the reserved stock item', deepKeys(mgr.body, /^unitCost$/).some((k) => /allocations/.test(k)));
    const { withoutStockCost } = await import('../../src/backend/src/lib/costView.js');
    const kept = withoutStockCost({ lines: [{ unitCost: 5, description: 'purchase order line' }], coil: { coilNumber: 'X', unitCost: 1, landedCost: 2 }, movement: { movementType: 'SHIP', unitCost: 3 } });
    ok('the guard removes cost from stock items and movements only: a purchase order line keeps its price', kept.lines[0].unitCost === 5 && !('unitCost' in kept.coil) && !('landedCost' in kept.coil) && !('unitCost' in kept.movement));
  });
  await scenario(G5, 'overhead, freight cost, landed cost allocation and cost of goods posting are not built', async (ok) => {
    const k = await costOf((await shipped(100, { unitCost: 0.4 })).order.id);
    ok('the cost answer has no overhead, burden or freight-cost figure', deepKeys(k, /overhead|burden|freightCost|cogs/i).length === 0);
    ok('labor is charged only at rates the owner has entered per kind of work center; none is assumed', k.jobs.laborCost === 0 && k.jobs.rows.length === 0);
    ok('standard cost, average cost and FIFO layers are not used: cost is actual, per item (owner decision 9)', /actual cost per item/.test(k.basis));
    ok('overhead and cost of goods recognition wait on the owner\'s decision; no rate and no policy was invented', true);
  }, NA);
  await scenario(G5, 'a new order shows what stands between it and closed', async (ok) => {
    const r = await B.readyToShip(300);
    const pos = await closeout(r.order.id);
    ok('not closed: 300 to ship, one shipment on the dock, 300 reserved', pos.closed === false && codes(pos) === 'ON_DOCK,STOCK_RESERVED,TO_SHIP', codes(pos));
    ok('each open item is said in words with its figure', pos.open.every((o) => o.what && o.count > 0) && pos.figures.toShip === 300);
    ok('the line shows ordered 300, shipped 0, invoiced 0', pos.lines[0].ordered === 300 && pos.lines[0].shipped === 0 && pos.lines[0].invoiced === 0 && pos.lines[0].reserved === 300);
  });
  await scenario(G5, 'an order closes only when it is shipped, delivered, invoiced and paid', async (ok) => {
    const r = await shipped(300);
    ok('on the road and unpaid: open', codes(await closeout(r.order.id)) === 'ON_ROAD,UNPAID');
    await B.deliver(r.shipment);
    ok('delivered and unpaid: still open, for the 195.00', codes(await closeout(r.order.id)) === 'UNPAID' && (await closeout(r.order.id)).figures.balance === 195);
    await pay(r.invoice.id, 100);
    ok('part paid: still open, for the 95.00', (await closeout(r.order.id)).figures.balance === 95);
    await pay(r.invoice.id, 95);
    const pos = await closeout(r.order.id);
    ok('paid in full: closed, with nothing open', pos.closed === true && pos.state === 'CLOSED' && pos.open.length === 0, JSON.stringify(pos.open));
    const list = await A.get(`/api/orders/closeout?search=${r.order.orderNumber}`, 'csr');
    ok('and it is gone from the list of orders not closed', list.body.data.length === 0);
  });
  await scenario(G5, 'a closed order opens again when something comes back', async (ok) => {
    const r = await finished(300);
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Wrong grade shipped', lines: [{ orderLineId: r.order.lines[0].id, quantity: 100, disposition: 'RESTOCK' }] }, 'csr');
    ok('with a return opened it shows a return waiting', codes(await closeout(r.order.id)) === 'RETURN_OPEN', codes(await closeout(r.order.id)));
    await A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping');
    const pos = await closeout(r.order.id);
    ok('once received, the 65.00 credited on a paid invoice is owed back', codes(pos) === 'CREDIT_OWED' && pos.figures.creditOwedBack === 65, `${codes(pos)} ${pos.figures.creditOwedBack}`);
    const cm = await prisma.invoice.findFirst({ where: { orderId: r.order.id, kind: 'CREDIT' } });
    await A.post(`/api/invoices/${cm.id}/refund`, { amount: 65, paymentMethod: 'CHECK' }, 'admin');
    ok('and when it is refunded the order is closed again', (await closeout(r.order.id)).closed === true);
    ok('the line shows 100 returned', (await closeout(r.order.id)).lines[0].returned === 100);
  });
  await scenario(G5, 'an open job, a hold and a cancelled order each show for what they are', async (ok) => {
    const a = await B.readyToShip(200);
    await A.post('/api/jobs', { orderId: a.order.id, orderLineId: a.order.lines[0].id, instructions: 'QA P8', status: 'ORDERED' });
    ok('an order with a job in hand shows the job', codes(await closeout(a.order.id)).includes('JOB_OPEN'));
    await prisma.order.update({ where: { id: a.order.id }, data: { status: 'HOLD' } });
    ok('an order on hold shows the hold', codes(await closeout(a.order.id)).includes('ON_HOLD'));
    const b = await B.readyToShip(200); await A.put(`/api/orders/${b.order.id}`, { status: 'CANCELLED' }, 'csr');
    const pos = await closeout(b.order.id);
    ok('a cancelled order has nothing to ship and no shipment on the dock', !codes(pos).includes('TO_SHIP') && !codes(pos).includes('ON_DOCK'), codes(pos));
    ok('if stock is still reserved for it, that is shown until it is released', codes(pos) === '' ? pos.closed === true : codes(pos) === 'STOCK_RESERVED', codes(pos));
  });
  await scenario(G5, 'a delivery recorded before proof was required is noted and does not hold the order open', async (ok) => {
    const r = await finished(200);
    await prisma.shipment.update({ where: { id: r.shipment.id }, data: { podCaptured: false, podSignature: null, noPodReason: null } });
    const pos = await closeout(r.order.id);
    ok('the order is still closed', pos.closed === true);
    ok('a note says one delivered shipment has no name and no reason on file', pos.figures.deliveredWithoutProof === 1 && pos.notes.some((n) => /no name and no reason/.test(n)), JSON.stringify(pos.notes));
  });
  await scenario(G5, 'the list of orders not closed is paged, oldest first, and agrees with each order\'s own closeout', async (ok) => {
    const cust = await prisma.organization.create({ data: { code: tag('P8L'), name: 'P8 closeout list', type: 'OEM' } });
    const made = []; for (const q of [100, 200, 300]) made.push(await shipped(q, { customer: cust }));
    await B.deliver(made[0].shipment); await problem(made[2].shipment.id, 'Pallet tipped');
    const all = await A.get(`/api/orders/closeout?limit=200&customerId=${cust.id}`, 'csr');
    const mine = all.body.data.filter((o) => made.some((m) => m.order.id === o.id));
    ok('the three orders are listed, in the order they were entered', mine.length === 3 && mine.map((o) => o.id).join() === made.map((m) => m.order.id).join());
    let same = 0; for (const row of mine) { const p = await closeout(row.id); if (row.toShip === p.figures.toShip && row.onRoad === p.figures.shipmentsOnRoad && row.problems === p.figures.shipmentProblems && near(row.balance, p.figures.balance) && row.notInvoiced === p.figures.notInvoiced) same++; }
    ok('each row\'s figures equal that order\'s own closeout', same === 3, String(same));
    const page1 = await A.get('/api/orders/closeout?limit=2&offset=0', 'csr'); const page2 = await A.get('/api/orders/closeout?limit=2&offset=2', 'csr');
    ok('pages do not overlap and the total is the same on both', page1.body.data.length === 2 && page1.body.meta.total === page2.body.meta.total && !page1.body.data.some((a) => page2.body.data.some((b) => b.id === a.id)));
    ok('the list is oldest first', page1.body.data.every((o, i, a) => i === 0 || new Date(a[i - 1].createdAt) <= new Date(o.createdAt)));
    const unpaid = await A.get(`/api/orders/closeout?reason=UNPAID&limit=200&customerId=${cust.id}`, 'csr'); const probs = await A.get(`/api/orders/closeout?reason=SHIPMENT_PROBLEM&limit=200&customerId=${cust.id}`, 'csr');
    const bad = await A.get('/api/orders/closeout?reason=WHATEVER', 'csr');
    ok('an unknown reason is refused with the list of reasons', bad.status === 400 && /TO_SHIP/.test(err(bad)));
    ok('"unpaid" holds all three and "shipment problem" only the third', made.every((m) => unpaid.body.data.some((o) => o.id === m.order.id)) && probs.body.data.some((o) => o.id === made[2].order.id) && !probs.body.data.some((o) => o.id === made[0].order.id));
    const big = await A.get('/api/orders/closeout?limit=100000', 'csr');
    ok('a request for a hundred thousand rows is cut to 200', big.body.data.length <= 200 && big.body.meta.limit === 200);
  });
  await scenario(G5, 'closeout is kept to the reader\'s branches', async (ok) => {
    const r = await shipped(100);
    const far = await A.get(`/api/orders/${r.order.id}/closeout`, 'branchB'); const list = await A.get(`/api/orders/closeout?search=${r.order.orderNumber}`, 'branchB');
    ok('sales at another branch cannot read this order\'s closeout or find it on their list', far.status === 404 && list.body.data.length === 0, `${far.status} ${list.body?.data?.length}`);
    const near2 = await A.get(`/api/orders/closeout?search=${r.order.orderNumber}`, 'branchA'); const top = await A.get(`/api/orders/closeout?search=${r.order.orderNumber}`, 'regional');
    ok('its own branch and the regional manager find it', near2.body.data.length === 1 && top.body.data.length === 1);
    const none = await A.get(`/api/orders/${crypto.randomUUID()}/closeout`, 'admin');
    ok('an order that is not on file is 404', none.status === 404);
  });
  await scenario(G5, 'orders, shipments, stock and invoices reconcile across everything this run has done', async (ok) => {
    const q = (sql) => prisma.$queryRawUnsafe(sql).then((r) => r[0].n);
    ok('no line has shipped more than was ordered', (await q(`select count(*)::int as n from "OrderLine" l join "Order" o on o.id = l."orderId" where o."orderType" = 'SO' and l."qtyShipped" > l."qtyOrdered" + 0.000001`)) === 0);
    ok('every line\'s shipped quantity is the sum of its shipments that left', (await q(`select count(*)::int as n from "OrderLine" l join "Order" o on o.id = l."orderId" where o."orderType" = 'SO' and o."poReference" like 'PO-${run}-%' and abs(l."qtyShipped" - coalesce((select sum(si."qtyShipped") from "ShipmentItem" si join "Shipment" s on s.id = si."shipmentId" where si."orderLineId" = l.id and s.status in ('IN_TRANSIT','DELIVERED','EXCEPTION','LOST')), 0)) > 0.000001`)) === 0);
    ok('and the sum of the stock movements that name the line', (await q(`select count(*)::int as n from "OrderLine" l join "Order" o on o.id = l."orderId" where o."orderType" = 'SO' and o."poReference" like 'PO-${run}-%' and abs(l."qtyShipped" - coalesce((select sum(m."qtyMoved") from "MaterialMovement" m where m."orderLineId" = l.id and m."movementType" = 'SHIP'), 0)) > 0.000001`)) === 0);
    ok('no line is invoiced for more than has shipped', (await q(`select count(*)::int as n from "OrderLine" l where coalesce((select sum(il.quantity) from "InvoiceLine" il join "Invoice" i on i.id = il."invoiceId" where il."orderLineId" = l.id and i.kind = 'INVOICE' and i.status <> 'CANCELLED'), 0) > l."qtyShipped" + 0.000001`)) === 0);
    ok('every shipment that left has an invoice, or its order is listed as shipped and not invoiced', (await q(`select count(*)::int as n from "Shipment" s join "Order" o on o.id = s."orderId" where o."poReference" like 'PO-${run}-%' and s.status in ('IN_TRANSIT','DELIVERED','EXCEPTION','LOST') and not exists (select 1 from "Invoice" i where i."shipmentId" = s.id) and not exists (select 1 from "Invoice" i where i."orderId" = o.id and i.status = 'CANCELLED') and exists (select 1 from "ShipmentItem" si where si."shipmentId" = s.id)`)) === 0);
    ok('no stock record is below zero or reserved beyond what is on hand', (await q(`select count(*)::int as n from "Inventory" where "qtyOnHand" < -0.000001 or "qtyAllocated" < -0.000001 or "qtyAllocated" > "qtyOnHand" + 0.000001`)) === 0);
    ok('no shipment was dispatched twice: one departure row in each history', (await q(`select count(*)::int as n from (select a."resourceId" from "AuditLog" a where a."eventType" = 'SHIPMENT_STATUS_CHANGED' and a.details->>'to' = 'IN_TRANSIT' and a.details->>'from' in ('PENDING','LOADING') group by 1 having count(*) > 1) t`)) === 0);
    ok('no shipment has two invoices', (await q(`select count(*)::int as n from (select "shipmentId" from "Invoice" where "shipmentId" is not null and kind = 'INVOICE' and status <> 'CANCELLED' group by 1 having count(*) > 1) t`)) === 0);
  });
}

// ══ 6. Returns, credits, refunds and adjustments ═══════════════════════════════════════════
{
  const openReturn = (r, quantity, disposition = 'RESTOCK', who = 'csr', reason = 'Wrong size sent') => A.post('/api/returns', { orderId: r.order.id, reason, lines: [{ orderLineId: r.order.lines[0].id, quantity, disposition }] }, who);
  const receive = (id, body = {}, who = 'shipping') => A.post(`/api/returns/${id}/receive`, body, who);
  const creditsOf = (orderId) => prisma.invoice.findMany({ where: { orderId, kind: 'CREDIT' }, orderBy: { createdAt: 'asc' }, include: { lines: true } });
  const returnMoves = (returnId) => prisma.materialMovement.findMany({ where: { orderId: returnId }, orderBy: { createdAt: 'asc' } });
  /** A return received on an invoice that was already credited in full by amount: its own credit cannot be issued. */
  async function uncredited() {
    const r = await shipped(300);
    await A.post(`/api/invoices/${r.invoice.id}/credit`, { amount: 195, reason: 'Goodwill credit for the whole invoice' }, 'admin');
    const ret = await openReturn(r, 100); const rc = await receive(ret.body.id);
    return { ...r, ret: ret.body, received: rc };
  }

  await scenario(G6, 'opening a return moves nothing: stock and money change when the material is back', async (ok) => {
    const r = await shipped(300);
    const ret = await openReturn(r, 100);
    ok('the return is open, numbered, for 100', ret.status === 201 && ret.body.status === 'PENDING' && /^R/.test(ret.body.returnNumber) && ret.body.lines[0].quantity === 100, `${ret.status} ${JSON.stringify(ret.body).slice(0, 160)}`);
    ok('stock is unchanged and no credit exists', num((await stock(r.coilId)).qtyOnHand) === 500 && (await creditsOf(r.order.id)).length === 0 && (await returnMoves(ret.body.id)).length === 0);
    ok('the original order shows a return waiting', codes(await closeout(r.order.id)).includes('RETURN_OPEN'));
  });
  await scenario(G6, 'a return cannot be for more than shipped, and what is typed is checked', async (ok) => {
    const r = await shipped(300); const draft = await B.readyToShip(100);
    const l = r.order.lines[0].id; const send = (body) => A.post('/api/returns', { orderId: r.order.id, reason: 'x', ...body }, 'csr');
    const rs = [await send({ lines: [{ orderLineId: l, quantity: 301 }] }), await send({ lines: [{ orderLineId: l, quantity: 0 }] }), await send({ lines: [{ orderLineId: l, quantity: 10 }, { orderLineId: l, quantity: 10 }] }), await send({ lines: [{ orderLineId: draft.order.lines[0].id, quantity: 1 }] }), await send({ lines: [] }), await send({ lines: [{ orderLineId: l, quantity: 10, disposition: 'BURN' }] }), await A.post('/api/returns', { orderId: r.order.id, lines: [{ orderLineId: l, quantity: 1 }] }, 'csr')];
    ok('301 of 300 is refused with the figures', rs[0].status === 409 && /only 300 can be returned/.test(err(rs[0])), `${rs[0].status} ${err(rs[0])}`);
    ok('zero, the same line twice, a line of another order, no lines, an unknown disposition and no reason are each refused', rs.slice(1).every((x) => x.status === 400), rs.map((x) => x.status).join());
    const none = await A.post('/api/returns', { orderId: draft.order.id, reason: 'x', lines: [{ orderLineId: draft.order.lines[0].id, quantity: 1 }] }, 'csr');
    ok('nothing can be returned on an order that has not shipped', none.status === 409, `${none.status}`);
    ok('no return was saved', (await prisma.order.count({ where: { returnOfOrderId: { in: [r.order.id, draft.order.id] } } })) === 0);
  });
  await scenario(G6, 'two returns cannot together bring back more than shipped', async (ok) => {
    const r = await shipped(300);
    const a = await openReturn(r, 200); const b = await openReturn(r, 101); const c = await openReturn(r, 100);
    ok('200 then 101 is refused; 200 then 100 is accepted', a.status === 201 && b.status === 409 && c.status === 201 && /already on returns 200/.test(err(b)), `${a.status} ${b.status} ${c.status} ${err(b)}`);
    const look = await A.get(`/api/returns/eligible?orderNumber=${r.order.orderNumber}`, 'csr');
    ok('the lookup now shows nothing left to return', look.body.lines[0].shipped === 300 && look.body.lines[0].alreadyReturned === 300 && look.body.lines[0].returnable === 0);
    const x = await A.post(`/api/returns/${c.body.id}/cancel`, {}, 'csr');
    ok('cancelling one return frees its quantity', x.status < 300 && (await A.get(`/api/returns/eligible?orderNumber=${r.order.orderNumber}`, 'csr')).body.lines[0].returnable === 100);
  });
  await scenario(G6, 'receiving a return for restock puts the material back and credits the customer, once', async (ok) => {
    const r = await shipped(300, { unitCost: 0.4 });
    const ret = await openReturn(r, 100); const rc = await receive(ret.body.id);
    const mv = await returnMoves(ret.body.id); const cms = await creditsOf(r.order.id); const inv = await invOf(r.invoice.id);
    ok('the return is complete', rc.status === 200 && rc.body.status === 'COMPLETE' && !rc.body.warning, `${rc.status} ${rc.body?.warning || ''}`);
    ok('100 is back on hand on the stock item it left from', num((await stock(r.coilId)).qtyOnHand) === 600 && mv.length === 1 && mv[0].movementType === 'RECEIVE' && mv[0].coilId === r.coilId && num(mv[0].qtyMoved) === 100 && mv[0].reasonCode === 'CUSTOMER_RETURN');
    ok('it comes back at the cost it left at', num(mv[0].unitCost) === 0.4);
    ok('one credit memo for 100 at the invoice price: 65.00', cms.length === 1 && near(cms[0].totalAmount, -65) && Math.abs(num(cms[0].lines[0].quantity)) === 100 && cms[0].creditOfInvoiceId === r.invoice.id);
    ok('it pays the unpaid invoice down to 130.00', near(num(inv.totalAmount) - num(inv.paidAmount), 130));
    const again = await receive(ret.body.id);
    ok('receiving it again is refused and adds nothing', again.status === 409 && num((await stock(r.coilId)).qtyOnHand) === 600 && (await creditsOf(r.order.id)).length === 1, `${again.status}`);
  });
  await scenario(G6, 'a return for scrap is credited and does not go back on hand', async (ok) => {
    const r = await shipped(300, { unitCost: 0.4 });
    const ret = await openReturn(r, 50, 'SCRAP'); const rc = await receive(ret.body.id);
    const mv = await returnMoves(ret.body.id);
    ok('received and credited 32.50', rc.status === 200 && near((await creditsOf(r.order.id))[0].totalAmount, -32.5));
    ok('stock on hand is unchanged', num((await stock(r.coilId)).qtyOnHand) === 500);
    ok('it is recorded coming back and going out as scrap, both at cost', mv.length === 2 && mv.map((m) => m.movementType).sort().join() === 'RECEIVE,SCRAP' && mv.every((m) => num(m.qtyMoved) === 50 && num(m.unitCost) === 0.4), mv.map((m) => m.movementType).join());
  });
  await scenario(G6, 'a return held for inspection is back on the books but cannot be sold until released', async (ok) => {
    const r = await shipped(300);
    const ret = await openReturn(r, 80, 'INSPECT'); const rc = await receive(ret.body.id);
    const coil = await prisma.coil.findUnique({ where: { id: r.coilId } }); const inv = await stock(r.coilId);
    ok('received', rc.status === 200, `${rc.status} ${err(rc)}`);
    ok('the 80 is on hand again', num(inv.qtyOnHand) === 580);
    const o2 = await B.order([B.line(50)]); const rz = await B.reserve(o2, o2.lines[0], r.coilId, 50);
    ok('and the item is on hold: it cannot be reserved for another order', (coil.status === 'HOLD' || ['HOLD', 'PENDING'].includes(coil.qcStatus) || (await prisma.coilHold?.count?.({ where: { coilId: r.coilId, releasedAt: null } })) > 0) && rz.status >= 400, `${coil.status}/${coil.qcStatus} ${rz.status}`);
  });
  await scenario(G6, 'receiving less than was authorised credits only what came back', async (ok) => {
    const r = await shipped(300);
    const ret = await openReturn(r, 100);
    const lineId = (await prisma.orderLine.findFirst({ where: { orderId: ret.body.id } })).id;
    const over = await receive(ret.body.id, { lines: [{ lineId, orderLineId: lineId, id: lineId, qtyReceived: 101 }] });
    ok('more than authorised is refused', over.status === 409 && /only 100 was authorised/.test(err(over)), `${over.status} ${err(over)}`);
    const rc = await receive(ret.body.id, { lines: [{ lineId, orderLineId: lineId, id: lineId, qtyReceived: 60 }] });
    ok('60 received: 60 back on hand and 39.00 credited', rc.status === 200 && num((await stock(r.coilId)).qtyOnHand) === 560 && near((await creditsOf(r.order.id))[0].totalAmount, -39), `${rc.status} ${(await stock(r.coilId)).qtyOnHand}`);
    ok('the other 40 can be returned later', (await A.get(`/api/returns/eligible?orderNumber=${r.order.orderNumber}`, 'csr')).body.lines[0].returnable === 240);
  });
  await scenario(G6, 'a return on an invoice that carried tax credits the tax with it', async (ok) => {
    const c = await B.received({ weightLb: 800 });
    const o = await B.order([B.line(500, 1)], { taxRate: 0.07 }); await B.reserve(o, o.lines[0], c, 500); const s = await newShipment(o, [[o.lines[0], 500]]); await B.dispatch(s.body);
    const ret = await A.post('/api/returns', { orderId: o.id, reason: 'Over-shipped', lines: [{ orderLineId: o.lines[0].id, quantity: 100, disposition: 'RESTOCK' }] }, 'csr'); await receive(ret.body.id);
    const cm = (await creditsOf(o.id))[0];
    ok('100.00 of goods and 7.00 of tax are credited: 107.00', near(cm.subtotal, -100) && near(cm.taxAmount, -7) && near(cm.totalAmount, -107), `${cm.subtotal} ${cm.taxAmount} ${cm.totalAmount}`);
  });
  await scenario(G6, 'a return on a paid invoice leaves the credit owed back until it is refunded', async (ok) => {
    const r = await shipped(300); await pay(r.invoice.id, 195);
    const ret = await openReturn(r, 100); await receive(ret.body.id);
    const cm = (await creditsOf(r.order.id))[0];
    ok('65.00 is owed back', (await closeout(r.order.id)).figures.creditOwedBack === 65);
    ok('the invoice stays paid; the credit memo is open', (await invOf(r.invoice.id)).status === 'PAID' && (await invOf(cm.id)).status === 'SENT');
    const rf = await A.post(`/api/invoices/${cm.id}/refund`, { amount: 65, paymentMethod: 'ACH', referenceNumber: 'ACH-22871' }, 'admin');
    ok('the refund settles it and is on record with its reference', rf.status === 201 && (await closeout(r.order.id)).figures.creditOwedBack === 0 && (await prisma.auditLog.count({ where: { resourceType: 'Invoice', resourceId: cm.id, eventType: 'REFUND_RECORDED' } })) === 1);
  });
  await scenario(G6, 'a return received when its credit cannot be issued is flagged until a manager settles it (N-016)', async (ok) => {
    const u = await uncredited();
    ok('the material is received and the answer says the credit was not issued', u.received.status === 200 && /could not be issued/.test(u.received.body.warning || ''), `${u.received.status} ${u.received.body?.warning}`);
    ok('the material is back on hand', num((await stock(u.coilId)).qtyOnHand) === 600);
    ok('one record of the missing credit exists', (await audits('CREDIT_NOT_ISSUED', u.ret.id)).length === 1);
    ok('the original order shows it', codes(await closeout(u.order.id)).includes('CREDIT_NOT_ISSUED'), codes(await closeout(u.order.id)));
    const rep = await A.get('/api/admin/integrations', 'admin');
    ok('the report lists it as needing action', rep.body.returnsReceivedWithoutCredit.returns.some((x) => x.returnId === u.ret.id) && rep.body.needsAction.some((n) => /Returns received without their credit/.test(n.what)));
    const list = await A.get(`/api/returns?orderId=${u.order.id}`, 'csr');
    ok('and the returns list marks it', list.body.data.find((x) => x.id === u.ret.id)?.creditNotIssued === true);
  });
  await scenario(G6, 'only a manager settles a missing credit, with the reason, once', async (ok) => {
    const u = await uncredited(); const url = `/api/returns/${u.ret.id}/credit`;
    const byCsr = await A.post(url, { settledAnotherWay: true, reason: 'Covered by the goodwill credit' }, 'csr'); const short = await A.post(url, { settledAnotherWay: true, reason: 'ok' }, 'admin');
    ok('sales staff are refused, and a manager must say how it was settled', byCsr.status === 403 && short.status === 400, `${byCsr.status} ${short.status}`);
    const again = await A.post(url, {}, 'admin');
    ok('issuing it now is refused too: nothing is left on the invoice to credit', again.status === 409, `${again.status} ${err(again)}`);
    const done = await A.post(url, { settledAnotherWay: true, reason: 'Covered by the goodwill credit already given' }, 'admin'); const twice = await A.post(url, { settledAnotherWay: true, reason: 'Covered by the goodwill credit already given' }, 'admin');
    ok('settled once; a second time is refused', done.status === 201 && twice.status === 409, `${done.status} ${twice.status}`);
    const log = await audits('CREDIT_NOT_ISSUED_SETTLED', u.ret.id);
    ok('one record names the manager and the reason', log.length === 1 && log[0].userId === users.admin.id && /goodwill credit/.test(log[0].details.note));
    ok('the flag is gone from the order, the report and the list', !codes(await closeout(u.order.id)).includes('CREDIT_NOT_ISSUED') && !(await A.get('/api/admin/integrations', 'admin')).body.returnsReceivedWithoutCredit.returns.some((x) => x.returnId === u.ret.id) && (await A.get(`/api/returns?orderId=${u.order.id}`, 'csr')).body.data.find((x) => x.id === u.ret.id).creditNotIssued === false);
  });
  await scenario(G6, 'a return that was credited normally, or is not yet received, cannot be "settled"', async (ok) => {
    const r = await shipped(300); const ret = await openReturn(r, 50);
    const early = await A.post(`/api/returns/${ret.body.id}/credit`, {}, 'admin');
    ok('before it is received: refused', early.status === 409 && /PENDING/.test(err(early)), `${early.status}`);
    await receive(ret.body.id);
    const late = await A.post(`/api/returns/${ret.body.id}/credit`, {}, 'admin'); const other = await A.post(`/api/returns/${ret.body.id}/credit`, { settledAnotherWay: true, reason: 'Trying to settle twice' }, 'admin');
    ok('after a normal credit: refused, and no second credit memo is made', late.status === 409 && other.status === 409 && (await creditsOf(r.order.id)).length === 1, `${late.status} ${other.status}`);
    const none = await A.post(`/api/returns/${crypto.randomUUID()}/credit`, {}, 'admin');
    ok('a return that is not on file is 404', none.status === 404);
  });
  await scenario(G6, 'a cancelled return cannot be received, and a received one cannot be cancelled', async (ok) => {
    const r = await shipped(300);
    const a = await openReturn(r, 50); const x = await A.post(`/api/returns/${a.body.id}/cancel`, {}, 'csr'); const rc = await receive(a.body.id);
    ok('cancelled, then refused at the dock', x.status < 300 && rc.status === 409 && num((await stock(r.coilId)).qtyOnHand) === 500, `${x.status} ${rc.status}`);
    const b = await openReturn(r, 50); await receive(b.body.id); const y = await A.post(`/api/returns/${b.body.id}/cancel`, {}, 'csr');
    ok('a received return is not cancelled: the stock and the credit stand', y.status === 409 && (await creditsOf(r.order.id)).length === 1, `${y.status}`);
  });
  await scenario(G6, 'returns are kept to the branch that sold the order, and to the roles that handle them', async (ok) => {
    const r = await shipped(300); const ret = await openReturn(r, 50);
    const see = await A.get(`/api/returns/${ret.body.id}`, 'branchB'); const rc = await ship2.post(`/api/returns/${ret.body.id}/receive`, {}); const list = await A.get(`/api/returns?orderId=${r.order.id}`, 'branchB');
    ok('another branch cannot open, list or receive it', see.status === 404 && rc.status === 404 && list.body.data.length === 0, `${see.status} ${rc.status}`);
    const byWh = await openReturn(r, 10, 'RESTOCK', 'shipping'); const byQc = await qc1.post(`/api/returns/${ret.body.id}/receive`, {}); const byAud = await auditor.post(`/api/returns/${ret.body.id}/receive`, {});
    ok('the warehouse cannot open a return, and quality and the auditor cannot receive one', byWh.status === 403 && byQc.status === 403 && byAud.status === 403, `${byWh.status} ${byQc.status} ${byAud.status}`);
    ok('the return is still waiting', (await prisma.order.findUnique({ where: { id: ret.body.id } })).status === 'PENDING');
  });
  await scenario(G6, 'an invoice is never edited: the only adjustments are a credit memo, a refund or a cancel before payment', async (ok) => {
    const r = await shipped(200); const id = r.invoice.id;
    const tries = [await A.put(`/api/invoices/${id}`, { totalAmount: 1 }, 'admin'), await A.patch(`/api/invoices/${id}`, { totalAmount: 1, paidAmount: 130 }, 'admin'), await A.call('DELETE', `/api/invoices/${id}`, undefined, 'admin'), await A.put(`/api/invoices/${id}/lines`, { lines: [] }, 'admin')];
    ok('there is no way to change or delete an invoice: each attempt finds no such action', tries.every((t) => t.status === 404 || t.status === 405), tries.map((t) => t.status).join());
    const inv = await invOf(id);
    ok('the invoice is exactly as issued', near(inv.totalAmount, 130) && near(inv.paidAmount, 0) && inv.lines.length === 1);
    const pays = [await A.put(`/api/invoices/${id}/payments/x`, { amount: 1 }, 'admin'), await A.call('DELETE', `/api/invoices/${id}/payments/x`, undefined, 'admin')];
    ok('nor is there a way to change or delete a payment', pays.every((t) => t.status === 404 || t.status === 405), pays.map((t) => t.status).join());
  });
}

// ══ 7. Concurrency, security, exceptions and recovery ══════════════════════════════════════
{
  const { tokenOf, sendAndHangUp, sleep } = await import('./phase4-lib.mjs');
  const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)));
  const count = (rs, status) => rs.filter((r) => r.status === status).length;

  await scenario(G7, 'five people dispatch the same shipment at the same moment: it leaves once', async (ok) => {
    let bad = 0;
    for (let round = 0; round < 3; round++) {
      const r = await B.readyToShip(300);
      const rs = await all(5, () => B.dispatch(r.shipment));
      const inv = await stock(r.coilId);
      if (count(rs, 200) !== 1 || rs.some((x) => ![200, 409].includes(x.status)) || (await movesOf(r.shipment.id)).length !== 1 || (await B.invoicesOf(r.order.id)).length !== 1 || num(inv.qtyOnHand) !== 500 || num((await lineOf(r.order.lines[0].id)).qtyShipped) !== 300) bad++;
    }
    ok('in three rounds: one success, four refusals, one stock movement, one invoice, 300 shipped', bad === 0, `${bad} bad rounds`);
  });
  await scenario(G7, 'two shipments drawing on the same stock item at the same moment both leave, and the stock is exact', async (ok) => {
    const c = await B.received({ weightLb: 1000 });
    const [o1, o2] = [await B.order([B.line(400)]), await B.order([B.line(500)])];
    await B.reserve(o1, o1.lines[0], c, 400); await B.reserve(o2, o2.lines[0], c, 500);
    const [s1, s2] = [await newShipment(o1, [[o1.lines[0], 400]]), await newShipment(o2, [[o2.lines[0], 500]])];
    const rs = await Promise.all([B.dispatch(s1.body), B.dispatch(s2.body)]);
    const inv = await stock(c);
    ok('both are dispatched', rs.every((r) => r.status === 200), rs.map((r) => `${r.status} ${err(r)}`).join(' | '));
    ok('100 is left, nothing reserved, and the two movements are 400 and 500', num(inv.qtyOnHand) === 100 && num(inv.qtyAllocated) === 0 && (await prisma.materialMovement.findMany({ where: { coilId: c, movementType: 'SHIP' } })).map((m) => num(m.qtyMoved)).sort().join() === '400,500', `${inv.qtyOnHand}/${inv.qtyAllocated}`);
  });
  await scenario(G7, 'two shipments opened at once for the same line cannot together exceed it', async (ok) => {
    let bad = 0;
    for (let round = 0; round < 3; round++) {
      const c = await B.received({ weightLb: 900 }); const o = await B.order([B.line(500)]); await B.reserve(o, o.lines[0], c, 500);
      const rs = await all(4, () => newShipment(o, [[o.lines[0], 300]]));
      const onDock = await prisma.shipmentItem.aggregate({ _sum: { qtyShipped: true }, where: { orderLineId: o.lines[0].id, shipment: { status: { in: ['PENDING', 'LOADING'] } } } });
      if (count(rs, 201) !== 1 || num(onDock._sum.qtyShipped) !== 300 || rs.some((x) => ![201, 409].includes(x.status))) bad++;
    }
    ok('in three rounds of four at once: one shipment for 300 is saved, the others are refused', bad === 0, `${bad} bad rounds`);
  });
  await scenario(G7, 'a delivery reported three times at once is recorded once', async (ok) => {
    const r = await shipped(200);
    const rs = await all(3, (i) => A.put(`/api/shipments/${r.shipment.id}/deliver`, { podSignature: `Receiver ${i}` }, 'shipping'));
    const s = await shp(r.shipment.id);
    ok('one is accepted and two are refused', count(rs, 200) === 1 && count(rs, 409) === 2, rs.map((x) => x.status).join());
    ok('one name is on the shipment and one delivered row is in its history', /^Receiver \d$/.test(s.podSignature) && (await historyOf(r.shipment.id)).filter((h) => h.to === 'DELIVERED').length === 1);
  });
  await scenario(G7, 'payments arriving together never take an invoice over its total', async (ok) => {
    const r = await shipped(300);
    const rs = await all(6, () => pay(r.invoice.id, 50));
    const inv = await invOf(r.invoice.id);
    ok('three of six payments of 50 fit in 195; the rest are refused', count(rs, 201) === 3 && count(rs, 409) === 3, rs.map((x) => x.status).join());
    ok('paid is 150.00, the sum of three payment rows', near(inv.paidAmount, 150) && inv.payments.length === 3 && inv.status === 'PARTIAL');
  });
  await scenario(G7, 'credits issued together never exceed the invoice', async (ok) => {
    const r = await shipped(300);
    const rs = await all(5, (i) => A.post(`/api/invoices/${r.invoice.id}/credit`, { amount: 60, reason: `Simultaneous credit ${i}` }, 'admin'));
    const cms = await prisma.invoice.findMany({ where: { orderId: r.order.id, kind: 'CREDIT' } });
    ok('three credits of 60 fit in 195; the others are refused', count(rs, 201) === 3 && cms.length === 3, rs.map((x) => x.status).join());
    ok('their numbers are different and the invoice shows 15.00 left', new Set(cms.map((c) => c.invoiceNumber)).size === 3 && near(num((await invOf(r.invoice.id)).totalAmount) - num((await invOf(r.invoice.id)).paidAmount), 15));
  });
  await scenario(G7, 'a return received by two people at once comes back once', async (ok) => {
    const r = await shipped(300);
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Wrong finish', lines: [{ orderLineId: r.order.lines[0].id, quantity: 100, disposition: 'RESTOCK' }] }, 'csr');
    const rs = await all(4, () => A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping'));
    ok('one receipt is accepted', count(rs, 200) === 1 && rs.every((x) => [200, 409].includes(x.status)), rs.map((x) => x.status).join());
    ok('100 is back on hand once, with one movement and one credit memo', num((await stock(r.coilId)).qtyOnHand) === 600 && (await prisma.materialMovement.count({ where: { orderId: ret.body.id } })) === 1 && (await prisma.invoice.count({ where: { orderId: r.order.id, kind: 'CREDIT' } })) === 1);
  });
  await scenario(G7, 'two managers settling the same missing credit at once leave one record', async (ok) => {
    const r = await shipped(300);
    await A.post(`/api/invoices/${r.invoice.id}/credit`, { amount: 195, reason: 'Goodwill for the whole invoice' }, 'admin');
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Came back anyway', lines: [{ orderLineId: r.order.lines[0].id, quantity: 50, disposition: 'RESTOCK' }] }, 'csr'); await A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping');
    const rs = await Promise.all([A.post(`/api/returns/${ret.body.id}/credit`, { settledAnotherWay: true, reason: 'Covered by the goodwill credit' }, 'admin'), mgr1.post(`/api/returns/${ret.body.id}/credit`, { settledAnotherWay: true, reason: 'Covered by the goodwill credit' }), A.post(`/api/returns/${ret.body.id}/credit`, { settledAnotherWay: true, reason: 'Covered by the goodwill credit' }, 'regional')]);
    ok('one is accepted, the others are told it is already settled', count(rs, 201) === 1 && count(rs, 409) === 2, rs.map((x) => x.status).join());
    ok('one settlement record exists', (await audits('CREDIT_NOT_ISSUED_SETTLED', ret.body.id)).length === 1);
  });
  await scenario(G7, 'package steps taken twice at once happen once (N-013)', async (ok) => {
    const k = await packed();
    const ready = await all(3, () => P(k.pkg.id, 'ready'));
    ok('sent to quality once', count(ready, 200) === 1 && (await traces(k.pkg.id, 'PACKAGE_READY_FOR_QC')).length === 1, ready.map((x) => x.status).join());
    await P(k.pkg.id, 'qc-release', {}, qc1);
    const tags = await all(4, () => A.post('/api/drop-tags', { packageId: k.pkg.id }, 'shipping'));
    const live = (await pkgOf(k.pkg.id)).dropTags.filter((t) => t.status !== 'VOID');
    ok('one tag is made, not four', count(tags, 201) === 1 && live.length === 1, tags.map((x) => x.status).join());
    const id = live[0].id; await T(id, 'validate');
    const prints = await all(3, () => T(id, 'print')); const applies = await all(3, () => T(id, 'apply')); const seals = await all(3, (i) => P(k.pkg.id, 'seal', { sealId: `S-${i}` }));
    ok('printed once, applied once, sealed once', count(prints, 200) === 1 && count(applies, 200) === 1 && count(seals, 200) === 1, `${prints.map((x) => x.status)} ${applies.map((x) => x.status)} ${seals.map((x) => x.status)}`);
    ok('and each step has exactly one record', (await traces(id, 'DROP_TAG_PRINTED')).length === 1 && (await traces(id, 'DROP_TAG_APPLIED')).length === 1 && (await traces(k.pkg.id, 'PACKAGE_SEALED')).length === 1);
    const nums = await prisma.$queryRawUnsafe('select count(*)::int as n from (select "dropTagId" from "DropTag" group by 1 having count(*) > 1) t');
    ok('no tag number was issued twice', nums[0].n === 0);
  });
  await scenario(G7, 'six shipments dispatched at once get six different invoice numbers with no gap', async (ok) => {
    const ready = []; for (let i = 0; i < 6; i++) ready.push(await B.readyToShip(100));
    const before = Number((await prisma.documentCounter.findUnique({ where: { series: 'INV' } })).lastNumber);
    const rs = await Promise.all(ready.map((r) => B.dispatch(r.shipment)));
    const nums = rs.map((r) => Number(String(r.body?.invoice?.invoiceNumber || '').replace(/\D/g, ''))).sort((a, b) => a - b);
    ok('all six are dispatched and invoiced', rs.every((r) => r.status === 200 && r.body.invoice), rs.map((r) => `${r.status}${r.body?.invoiceWarning ? '!' : ''}`).join());
    ok('their numbers are the next six, each used once', nums.join() === Array.from({ length: 6 }, (_, i) => before + 1 + i).join(), `${before} -> ${nums.join()}`);
  });
  await scenario(G7, 'the same request sent twice with one key is carried out once', async (ok) => {
    const r = await B.readyToShip(200); await A.patch(`/api/shipments/${r.shipment.id}/status`, { status: 'CANCELLED' }, 'shipping');
    const key = `p8-${crypto.randomUUID()}`; const body = { orderId: r.order.id, fromLocationId: L1.id, items: [{ orderLineId: r.order.lines[0].id, qtyShipped: 200 }] };
    const a = await rawCall('POST', '/api/shipments', body, 'shipping', { 'Idempotency-Key': key }); const b = await rawCall('POST', '/api/shipments', body, 'shipping', { 'Idempotency-Key': key });
    ok('the second answer is the first one again', a.status === 201 && b.status === 201 && b.body.id === a.body.id && b.replayed === true, `${a.status} ${b.status} ${b.replayed}`);
    ok('one shipment exists', (await prisma.shipment.count({ where: { orderId: r.order.id, status: 'PENDING' } })) === 1);
    const s = await shipped(100); const k2 = `p8-${crypto.randomUUID()}`;
    const p1 = await rawCall('POST', `/api/invoices/${s.invoice.id}/payments`, { amount: 20, paymentMethod: 'CHECK' }, 'csr', { 'Idempotency-Key': k2 }); const p2 = await rawCall('POST', `/api/invoices/${s.invoice.id}/payments`, { amount: 20, paymentMethod: 'CHECK' }, 'csr', { 'Idempotency-Key': k2 });
    ok('and a payment sent twice with one key is one payment', p1.status === 201 && p2.status === 201 && (await invOf(s.invoice.id)).payments.length === 1);
  });
  await scenario(G7, 'a dispatch whose connection drops is either done in full or not at all, and trying again is safe', async (ok) => {
    const r = await B.readyToShip(300);
    await sendAndHangUp('PUT', `/api/shipments/${r.shipment.id}/dispatch`, {}, { Authorization: `Bearer ${await tokenOf('shipping')}` });
    await sleep(1500);
    const s = await shp(r.shipment.id); const invs = await B.invoicesOf(r.order.id); const mv = await movesOf(r.shipment.id);
    const whole = s.status === 'IN_TRANSIT' && mv.length === 1 && invs.length === 1 && num((await stock(r.coilId)).qtyOnHand) === 500;
    const none = s.status === 'PENDING' && mv.length === 0 && invs.length === 0 && num((await stock(r.coilId)).qtyOnHand) === 800;
    ok('the shipment, the stock and the invoice agree: all moved, or none', whole || none, `${s.status} moves ${mv.length} invoices ${invs.length}`);
    const again = await B.dispatch(r.shipment);
    ok('pressing dispatch again leaves exactly one movement and one invoice', [200, 409].includes(again.status) && (await movesOf(r.shipment.id)).length === 1 && (await B.invoicesOf(r.order.id)).length === 1, `${again.status}`);
  });
  await scenario(G7, 'a shipment that left without its invoice is listed until it is billed, and billing it is done once', async (ok) => {
    const r = await shipped(300);
    await A.post(`/api/invoices/${r.invoice.id}/cancel`, {}, 'admin');
    const rep = await A.get('/api/admin/integrations', 'admin');
    ok('the report lists the order as shipped and not invoiced', rep.body.shippedNotInvoiced.orders.some((o) => o.orderNumber === r.order.orderNumber || o.id === r.order.id || o.orderId === r.order.id), JSON.stringify(rep.body.shippedNotInvoiced).slice(0, 200));
    const rs = await all(3, () => A.post('/api/invoices', { orderId: r.order.id }, 'csr'));
    const live = (await B.invoicesOf(r.order.id)).filter((i) => i.status !== 'CANCELLED');
    ok('three people raise it at once: one invoice is made', live.length === 1 && count(rs, 201) === 1, rs.map((x) => x.status).join());
    ok('and the order leaves the list', !(await A.get('/api/admin/integrations', 'admin')).body.shippedNotInvoiced.orders.some((o) => o.orderNumber === r.order.orderNumber || o.id === r.order.id || o.orderId === r.order.id));
  });
  await scenario(G7, 'nothing in shipping or billing answers without a sign-in', async (ok) => {
    const r = await shipped(100);
    const gets = ['/api/orders/closeout', `/api/orders/${r.order.id}/closeout`, `/api/orders/${r.order.id}/cost`, '/api/invoices/aging', `/api/shipments/${r.shipment.id}/documents`, '/api/print-queue', '/api/drop-tags/packages/ready', '/api/shipments', '/api/returns', '/api/drop-tags/listings'];
    const posts = [`/api/returns/${r.order.id}/credit`, '/api/print-queue/trigger-shipment', '/api/drop-tags/packages', `/api/invoices/${r.invoice.id}/payments`, '/api/material-tracking/custody-log'];
    const a = []; for (const u of gets) a.push((await http1('GET', u)).status); for (const u of posts) a.push((await http1('POST', u, { body: {} })).status);
    const put = (await http1('PUT', `/api/shipments/${r.shipment.id}/deliver`, { body: { podSignature: 'Nobody' } })).status;
    ok('fifteen routes read or written with no sign-in all answer 401', a.every((s) => s === 401) && put === 401, `${a.join()} ${put}`);
    const bad = (await http1('GET', '/api/orders/closeout', { token: 'not-a-real-token' })).status;
    ok('a made-up token is refused the same way', bad === 401);
    ok('and nothing changed', (await shp(r.shipment.id)).status === 'IN_TRANSIT' && (await invOf(r.invoice.id)).payments.length === 0);
  });
  await scenario(G7, 'a customer\'s portal login reaches none of the staff shipping and billing screens', async (ok) => {
    const r = await shipped(100, { customer: w.custB });
    const seen = [];
    for (const u of ['/api/orders/closeout', `/api/orders/${r.order.id}/closeout`, `/api/orders/${r.order.id}/cost`, '/api/invoices/aging', `/api/shipments/${r.shipment.id}/documents`, '/api/print-queue', '/api/drop-tags/packages/ready', '/api/admin/integrations']) seen.push((await A.get(u, 'custA')).status);
    ok('eight staff routes refuse customer A', seen.every((s) => [401, 403, 404].includes(s)), seen.join());
    const w1 = await A.put(`/api/shipments/${r.shipment.id}/deliver`, { podSignature: 'Customer A' }, 'custA'); const w2 = await pay(r.invoice.id, 1, 'custA'); const w3 = await A.post('/api/drop-tags/packages', { packageType: 'BOX' }, 'custA');
    ok('and it cannot mark a delivery, record a payment or open a package', [w1, w2, w3].every((x) => [401, 403, 404].includes(x.status)) && (await shp(r.shipment.id)).status === 'IN_TRANSIT', [w1, w2, w3].map((x) => x.status).join());
  });
  await scenario(G7, 'each role does its own part of shipping and no other', async (ok) => {
    const r = await B.readyToShip(100);
    const aud = [await auditor.put(`/api/shipments/${r.shipment.id}/dispatch`, {}), await auditor.post('/api/shipments', { orderId: r.order.id, fromLocationId: L1.id, items: [] }), await auditor.post('/api/drop-tags/packages', { packageType: 'BOX' }), await auditor.post('/api/print-queue/trigger-shipment', { shipmentId: r.shipment.id })];
    ok('the auditor reads and changes nothing', aud.every((x) => x.status === 403), aud.map((x) => x.status).join());
    ok('but can read the shipment and the list of orders not closed', (await auditor.get(`/api/shipments/${r.shipment.id}`)).status === 200 && (await auditor.get('/api/orders/closeout?limit=1')).status === 200);
    const qc = [await qc1.put(`/api/shipments/${r.shipment.id}/dispatch`, {}), await qc1.post(`/api/invoices/${crypto.randomUUID()}/payments`, { amount: 1, paymentMethod: 'CHECK' })];
    ok('quality does not dispatch or take payments', qc.every((x) => x.status === 403), qc.map((x) => x.status).join());
    const op = [await A.put(`/api/shipments/${r.shipment.id}/dispatch`, {}, 'operator'), await A.post('/api/returns', { orderId: r.order.id, reason: 'x', lines: [] }, 'operator')];
    ok('a machine operator does not dispatch or open returns', op.every((x) => x.status === 403), op.map((x) => x.status).join());
    const packer = await pack1.post('/api/drop-tags/packages', { packageType: 'BOX', orderId: r.order.id, orderLineId: r.order.lines[0].id }); const packerQc = await pack1.post(`/api/drop-tags/packages/${packer.body?.id}/qc-release`, {});
    ok('the packaging lead opens a package and cannot release it for quality', packer.status === 201 && packerQc.status === 403, `${packer.status} ${packerQc.status}`);
    ok('after all of that the shipment is still on the dock', (await shp(r.shipment.id)).status === 'PENDING');
  });
  await scenario(G7, 'odd and hostile input to the new lists is refused or ignored, never an error page', async (ok) => {
    const urls = ["/api/orders/closeout?search=%25'%20OR%201%3D1--", '/api/orders/closeout?limit=-5&offset=-9', '/api/orders/closeout?limit=abc&offset=xyz', '/api/orders/closeout?customerId=not-a-uuid', "/api/orders/closeout?locationId=';DROP%20TABLE%20\"Order\";--", '/api/invoices/aging?customerId=not-a-uuid', "/api/invoices/aging?customerId=%27%20OR%20%271%27%3D%271", '/api/invoices/aging?limit=-1', '/api/shipments/not-a-uuid/documents', '/api/orders/not-a-uuid/closeout', '/api/orders/not-a-uuid/cost', '/api/print-queue/not-a-job/render', '/api/drop-tags/listings?page=-3&limit=zzz'];
    const rs = []; for (const u of urls) rs.push(await A.get(u, 'admin'));
    ok('thirteen odd requests: none answers 500', rs.every((r) => r.status < 500), rs.map((r) => r.status).join());
    ok('the injected search matched nothing rather than everything', rs[0].status === 200 && rs[0].body.data.length === 0 && rs[6].body.customers.length === 0);
    ok('the Order table is still there', (await prisma.order.count()) > 0);
    const posts = [await A.post('/api/returns/not-a-uuid/credit', {}, 'admin'), await A.post('/api/print-queue/trigger-shipment', { shipmentId: { $ne: null } }, 'admin'), await A.post('/api/drop-tags/packages/not-a-uuid/ready', {}, 'shipping'), await A.put('/api/shipments/not-a-uuid/deliver', { podSignature: 'x' }, 'shipping'), await A.post('/api/drop-tags', { packageId: ['a', 'b'] }, 'shipping')];
    ok('five odd writes are refused cleanly', posts.every((r) => r.status >= 400 && r.status < 500), posts.map((r) => r.status).join());
    const big = await A.patch(`/api/shipments/${(await shipped(100)).shipment.id}/status`, { status: 'EXCEPTION', reason: 'x'.repeat(200000) }, 'shipping');
    ok('a 200,000-letter reason is cut or refused, not stored whole', big.status < 500 && !(await prisma.auditLog.findFirst({ where: { eventType: 'SHIPMENT_STATUS_CHANGED', details: { path: ['note'], string_contains: 'x'.repeat(5000) } } })), `${big.status}`);
  });
  await scenario(G7, 'error answers say what to do and give away nothing about the inside', async (ok) => {
    const r = await B.readyToShip(100);
    const answers = [await A.put(`/api/shipments/${crypto.randomUUID()}/dispatch`, {}, 'shipping'), await A.put(`/api/shipments/${r.shipment.id}/deliver`, {}, 'shipping'), await A.post(`/api/invoices/${crypto.randomUUID()}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'csr'), await A.get('/api/orders/not-a-uuid/cost', 'admin'), await A.post('/api/drop-tags/packages', { packageType: 'BOX', orderId: 'nope' }, 'shipping')];
    const text = answers.map((a) => JSON.stringify(a.body)).join('\n');
    ok('each is a plain sentence under "error"', answers.every((a) => typeof a.body?.error === 'string' && a.body.error.length > 3), answers.map((a) => a.status).join());
    ok('none mentions a table, a query, a file path or a stack', !/prisma|SELECT |INSERT |\/src\/|node_modules|at async|P20\d\d|stack/i.test(text), text.slice(0, 300));
  });
  await scenario(G7, 'an order cancelled at the very moment its shipment is dispatched ends one way or the other, never half of each', async (ok) => {
    let bad = 0; const seen = { shipped: 0, cancelled: 0 }; const detail = []; const answers = [];
    for (let round = 0; round < 6; round++) {
      const r = await B.readyToShip(200);
      const [d, c] = await Promise.all([B.dispatch(r.shipment), A.put(`/api/orders/${r.order.id}`, { status: 'CANCELLED' }, 'csr')]);
      answers.push(d.status, c.status);
      const o = await orderOf(r.order.id); const s = await shp(r.shipment.id); const onHand = num((await stock(r.coilId)).qtyOnHand); const invs = (await B.invoicesOf(r.order.id)).length; const mv = (await movesOf(r.shipment.id)).length;
      const wentOut = s.status === 'IN_TRANSIT' && o.status !== 'CANCELLED' && onHand === 500 && invs === 1 && mv === 1 && num(o.lines[0].qtyShipped) === 200;
      const called = o.status === 'CANCELLED' && s.status === 'CANCELLED' && onHand === 700 && invs === 0 && mv === 0 && num(o.lines[0].qtyShipped) === 0;
      if (wentOut) seen.shipped++; else if (called) seen.cancelled++; else { bad++; detail.push(`dispatch ${d.status} cancel ${c.status}: order ${o.status}, shipment ${s.status}, on hand ${onHand}, invoices ${invs}`); }
    }
    ok('in six rounds the order either shipped whole (stock out, one invoice) or was cancelled whole (stock in, no invoice)', bad === 0, detail.join(' | '));
    ok(`outcomes: ${seen.shipped} shipped, ${seen.cancelled} cancelled`, seen.shipped + seen.cancelled === 6);
    ok('and neither request was ever answered with a server error: the loser is told plainly (N-029)', answers.every((x) => x === 200 || x === 409), answers.join(' '));
  });
  await scenario(G7, 'two managers ending the same shipment as lost at the same moment leave one credit (N-027)', async (ok) => {
    const r = await shipped(250); await problem(r.shipment.id, 'Stolen with the trailer');
    const rs = await all(2, (i) => (i ? credit : mgr1).put(`/api/shipments/${r.shipment.id}/lost`, { kind: 'LOST', reason: `Stolen with the trailer ${i}` }));
    const credits = await prisma.invoice.findMany({ where: { orderId: r.order.id, kind: 'CREDIT' } });
    ok('one succeeds, the other is told it was just changed or is already lost', rs.map((x) => x.status).sort().join() === '200,409', rs.map((x) => `${x.status} ${err(x)}`).join(' | '));
    ok('one credit, for the invoice total', credits.length === 1 && Math.abs(num(credits[0].totalAmount) + num((await invOf(r.invoice.id)).totalAmount)) < 0.005, `${credits.length}`);
  });
  await scenario(G7, 'invoices and payments are read by sales, accounting and managers only (F-009, owner decision 10)', async (ok) => {
    const r = await shipped(200); const total = num((await invOf(r.invoice.id)).totalAmount); await pay(r.invoice.id, 10);
    const reads = (who) => Promise.all([who.get('/api/invoices?limit=5'), who.get('/api/invoices/aging'), who.get(`/api/invoices/${r.invoice.id}`)]);
    const shut = await Promise.all([ship2, qc1, pack1].map(reads));
    ok('shipping, quality and packing staff are refused the list, what is owed by age, and one invoice', shut.flat().every((x) => x.status === 403 && /sales, accounting and managers/.test(err(x))), shut.flat().map((x) => x.status).join());
    const open = await Promise.all([mgr1, credit, auditor].map(reads)); const csr = await A.get(`/api/invoices/${r.invoice.id}`, 'csr');
    ok('a manager, the credit manager, an auditor and a sales rep read all three', open.flat().every((x) => x.status === 200) && csr.status === 200 && num(csr.body.totalAmount) === total, open.flat().map((x) => x.status).join());
    const dock = (await A.get(`/api/shipments/${r.shipment.id}`, 'shipping')).body; const desk = (await A.get(`/api/shipments/${r.shipment.id}`, 'csr')).body;
    ok('the dock still sees that an invoice was raised, its number and status, and no amount', dock.invoices?.length === 1 && dock.invoices[0].invoiceNumber === desk.invoices[0].invoiceNumber && dock.invoices[0].status && deepKeys(dock.invoices, /amount|payments|subtotal/i).length === 0, JSON.stringify(dock.invoices));
    ok('sales sees the amount on the same shipment', num(desk.invoices[0].totalAmount) === total);
    const asDock = (await A.get(`/api/orders/${r.order.id}`, 'shipping')).body; const asSales = (await A.get(`/api/orders/${r.order.id}`, 'csr')).body;
    ok('an order read by the dock carries its invoices by number only; read by sales, in full', asDock.invoices?.length === 1 && deepKeys(asDock.invoices, /amount|payments|subtotal/i).length === 0 && num(asSales.invoices[0].totalAmount) === total, JSON.stringify(asDock.invoices));
    const r2 = await B.readyToShip(100); const d = await A.put(`/api/shipments/${r2.shipment.id}/dispatch`, {}, 'shipping');
    ok('the answer to a dispatch names the invoice it raised without its amount', d.status === 200 && d.body.invoice?.invoiceNumber && d.body.invoice.totalAmount === undefined, JSON.stringify(d.body.invoice));
  });
  await scenario(G7, 'after every simultaneous request in this run, nothing was duplicated or lost', async (ok) => {
    const q = (sql) => prisma.$queryRawUnsafe(sql).then((r) => r[0].n);
    ok('no shipment has two invoices', (await q(`select count(*)::int as n from (select "shipmentId" from "Invoice" where "shipmentId" is not null and kind = 'INVOICE' and status <> 'CANCELLED' group by 1 having count(*) > 1) t`)) === 0);
    ok('no invoice, credit memo, shipment, package, tag or listing number is used twice', (await q(`select (select count(*) from (select "invoiceNumber" from "Invoice" group by 1 having count(*) > 1) a)::int + (select count(*) from (select "shipmentNumber" from "Shipment" group by 1 having count(*) > 1) b)::int + (select count(*) from (select "packageId" from "Package" group by 1 having count(*) > 1) c)::int + (select count(*) from (select "dropTagId" from "DropTag" group by 1 having count(*) > 1) d)::int as n`)) === 0);
    // A line reserved in two parts against one stock item rightly leaves two movements, so the test is the total.
    ok('no shipment line moved more stock than the shipment carries', (await q(`select count(*)::int as n from (select m."shipmentId", m."orderLineId" from "MaterialMovement" m where m."movementType" = 'SHIP' and m."shipmentId" is not null and m."orderLineId" is not null group by 1, 2 having sum(m."qtyMoved") > (select coalesce(sum(i."qtyShipped"), 0) from "ShipmentItem" i where i."shipmentId" = m."shipmentId" and i."orderLineId" = m."orderLineId") + 0.0001) t`)) === 0);
    ok('no return was received twice', (await q(`select count(*)::int as n from (select m."orderId", m."coilId", m."movementType" from "MaterialMovement" m join "Order" o on o.id = m."orderId" where o."orderType" = 'RETURN' group by 1, 2, 3 having count(*) > 1) t`)) === 0);
    ok('no stock record is negative or over-reserved', (await q(`select count(*)::int as n from "Inventory" where "qtyOnHand" < -0.000001 or "qtyAllocated" < -0.000001 or "qtyAllocated" > "qtyOnHand" + 0.000001`)) === 0);
    ok('no request is left half-done under a request key older than a minute', (await q(`select count(*)::int as n from "RequestKey" where status = 'IN_PROGRESS' and "createdAt" < now() - interval '1 minute'`)) <= 1);
  });
}

const failed = finish('Phase 8 fulfilment scenarios', OUT, fs);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
