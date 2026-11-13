// Phase 3 database scenarios: every scenario drives the real server and then reads the
// database directly to check what was saved, what was not, and that the books still agree.
// Six groups: receiving and holds; reservations and shipping; work orders, scrap and
// remnants; branch transfers; orders, invoices and money; simultaneous requests, repeats
// and failure recovery.
//   node qa/sim/phase3-db.mjs [--base http://localhost:3011]
// Runs only against a local QA database (lib.mjs refuses anything else).
import fs from 'node:fs';
import { prismaClient, api, QA_USERS } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
const OUT = arg('out', 'qa/results/phase3-db.json');
const prisma = prismaClient();
const A = api(BASE);
const run = Date.now().toString(36).toUpperCase();
const num = (v) => Number(v || 0);
const cents = (v) => Math.round(num(v) * 100);
const ok2 = (r) => r.status >= 200 && r.status < 300;
let seq = 0;
const tag = (p = 'P3') => `${p}-${run}-${++seq}`;

for (const who of Object.keys(QA_USERS)) await A.login(who).catch(() => {});
const locs = await prisma.location.findMany({ where: { code: { startsWith: 'QA-L' }, isActive: true }, orderBy: { code: 'asc' } });
const byCode = Object.fromEntries(locs.map((l) => [l.code, l]));
const L1 = byCode['QA-L01'], L2 = byCode['QA-L02'], L4 = byCode['QA-L04'];
const customers = await prisma.organization.findMany({ where: { code: { startsWith: 'QA-C' } }, orderBy: { code: 'asc' } });
// A customer with no credit limit, so that the many orders these scenarios raise are never
// stopped by a credit hold (credit holds have their own tests in the sweep).
const limited = new Set((await prisma.customerPricingTier.findMany({ where: { creditLimit: { not: null } }, select: { customerId: true } })).map((t) => t.customerId));
const customer = customers.find((c) => !limited.has(c.id)) || customers[3];
const heat = await prisma.heat.findFirst({ where: { coils: { some: { location: { code: { startsWith: 'QA-L' } } } } }, include: { grade: true } });
const otherHeat = await prisma.heat.findFirst({ where: { id: { not: heat.id }, gradeId: { not: heat.gradeId } }, include: { grade: true } });
const cwtProduct = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'CWT' } });
const users = Object.fromEntries(await Promise.all(Object.entries(QA_USERS).map(async ([k, email]) => [k, await prisma.user.findUnique({ where: { email } })])));

// ── recording ────────────────────────────────────────────────────────────────────────────
const scenarios = [];
const notes = [];
async function scenario(group, name, fn) {
  const sc = { group, name, asserts: [], pass: true, ms: 0 };
  const t0 = Date.now();
  const ok = (what, cond, detail) => { sc.asserts.push({ what, ok: !!cond, ...(cond ? {} : { detail: String(detail ?? '').slice(0, 300) }) }); if (!cond) sc.pass = false; return !!cond; };
  try { await fn(ok, sc); } catch (e) { sc.pass = false; sc.asserts.push({ what: 'scenario ran to the end', ok: false, detail: String(e?.message || e).slice(0, 400) }); }
  if (!sc.asserts.length) { sc.pass = false; sc.asserts.push({ what: 'at least one check', ok: false }); }
  sc.ms = Date.now() - t0;
  scenarios.push(sc);
}

// ── building blocks ──────────────────────────────────────────────────────────────────────
const invOf = (coilId) => prisma.inventory.findUnique({ where: { coilId } });
const coilOf = (id) => prisma.coil.findUnique({ where: { id } });
const movesOf = (coilId, type) => prisma.materialMovement.findMany({ where: { coilId, ...(type && { movementType: type }) }, orderBy: { createdAt: 'asc' } });
const allocSum = async (coilId) => num((await prisma.orderLineAllocation.aggregate({ where: { coilId }, _sum: { qtyAllocated: true } }))._sum.qtyAllocated);
const receiptBody = (over = {}) => ({ coilNumber: tag('RC'), form: 'PLATE', heatNumber: heat.heatNumber, gradeCode: heat.grade.code, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, weightLb: 5000, locationId: L1.id, notes: `QA phase 3 ${run}`, ...over });
/** A new stock item received through the server. Returns the coil id. */
async function received(over = {}) {
  const r = await A.post('/api/inventory/receipts', receiptBody(over));
  if (r.status !== 201) throw new Error(`receipt ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  return r.body.item.id;
}
const line = (qty, price = 0.65, over = {}) => ({ gradeId: heat.gradeId, description: `QA phase 3 ${run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: qty, unit: 'LB', unitPrice: price, priceUnit: 'LB', extendedPrice: +(qty * price).toFixed(2), ...over });
/** A confirmed sales order. taxRate and freight are optional. */
async function order(lines, { who = 'csr', status = 'CONFIRMED', taxRate = 0, freight = 0, headers, extra = {} } = {}) {
  const subtotal = +lines.reduce((s, l) => s + l.extendedPrice, 0).toFixed(2);
  const taxAmount = +(subtotal * taxRate).toFixed(2);
  const body = { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal, taxAmount, freightAmount: freight, totalAmount: +(subtotal + taxAmount + freight).toFixed(2), poReference: tag('PO'), lines, ...extra };
  const r = headers ? await raw('POST', '/api/orders', body, who, headers) : await A.post('/api/orders', body, who);
  if (r.status !== 201) return r;
  if (status === 'CONFIRMED') { const c = await A.put(`/api/orders/${r.body.id}`, { status: 'CONFIRMED' }); if (!ok2(c) || c.body?.status !== 'CONFIRMED') throw new Error(`confirm ${c.status} ${c.body?.status} ${JSON.stringify(c.body).slice(0, 200)}`); }
  return r;
}
const reserve = (o, l, coilId, qty, who = 'admin') => A.post(`/api/orders/${o.id}/allocate`, { lineId: l.id, coilId, qty }, who);
async function shipment(o, from, items) {
  return A.post('/api/shipments', { orderId: o.id, fromLocationId: from.id, carrierName: 'Own Truck', items: items.map(([l, q]) => ({ orderLineId: l.id, qtyShipped: q, weightLb: q })) }, 'shipping');
}
const dispatch = (s) => A.put(`/api/shipments/${s.id}/dispatch`, {}, 'shipping');
const deliver = (s) => A.put(`/api/shipments/${s.id}/deliver`, { podSignature: 'QA Receiver' }, 'shipping');
const invoicesOf = (orderId) => prisma.invoice.findMany({ where: { orderId }, include: { lines: true, payments: true }, orderBy: { createdAt: 'asc' } });
const tokens = {};
async function raw(method, url, body, who = 'admin', headers = {}) {
  if (!tokens[who]) { const l = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS[who], password: 'qa-password-1' }) }); tokens[who] = (await l.json()).token; }
  const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens[who]}`, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, body: json, replayed: res.headers.get('idempotency-replayed') === 'true' };
}
/** The books for one stock item: identity, reserved equals reservations, ledger explains the balance. */
async function books(ok, coilId, label = 'item') {
  const inv = await invOf(coilId); const coil = await coilOf(coilId);
  if (!inv) return ok(`${label}: has a stock row`, false, 'no Inventory row');
  ok(`${label}: on hand = available + reserved + on hold`, Math.abs(num(inv.qtyOnHand) - (num(inv.qtyAvailable) + num(inv.qtyAllocated) + num(inv.qtyOnHold))) < 1e-6, JSON.stringify(inv));
  ok(`${label}: reserved quantity equals the reservations on file`, Math.abs(num(inv.qtyAllocated) - await allocSum(coilId)) < 1e-6, `${inv.qtyAllocated} vs ${await allocSum(coilId)}`);
  const mv = await movesOf(coilId);
  if (mv.some((m) => m.movementType === 'RECEIVE' && ['RECEIPT', 'UPLOAD'].includes(m.reasonCode))) {
    const net = mv.reduce((s, m) => s + (m.movementType === 'RECEIVE' ? num(m.qtyMoved) : m.movementType === 'SHIP' ? -num(m.qtyMoved) : 0), 0);
    ok(`${label}: on hand equals receipts minus shipments in the movement ledger`, Math.abs(num(inv.qtyOnHand) - net) < 1e-6, `${inv.qtyOnHand} vs ledger ${net}`);
  }
  ok(`${label}: the item and its stock row name the same branch`, coil.locationId === inv.locationId, `${coil.locationId} vs ${inv.locationId}`);
  return true;
}
const exactCents = (v) => { const s = String(v); const d = s.includes('.') ? s.split('.')[1].replace(/0+$/, '') : ''; return d.length <= 2; };

// ══ 1. Receiving, holds and what the database refuses ════════════════════════════════════
const G1 = 'Inventory receiving and adjustments';
await scenario(G1, 'a receipt saves the item, its balance and its movement together', async (ok) => {
  const before = await prisma.coil.count();
  const body = receiptBody({ weightLb: 4321 });
  const r = await A.post('/api/inventory/receipts', body);
  ok('accepted', r.status === 201, `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const coil = await prisma.coil.findUnique({ where: { coilNumber: body.coilNumber } });
  const inv = await invOf(coil.id); const mv = await movesOf(coil.id);
  ok('one new item', (await prisma.coil.count()) === before + 1);
  ok('balance: 4321 on hand, all available', num(inv.qtyOnHand) === 4321 && num(inv.qtyAvailable) === 4321 && num(inv.qtyAllocated) === 0, JSON.stringify(inv));
  ok('one RECEIVE movement of 4321 into the branch, by the signed-in user', mv.length === 1 && mv[0].movementType === 'RECEIVE' && num(mv[0].qtyMoved) === 4321 && mv[0].toLocationId === L1.id && mv[0].createdById === users.admin.id && mv[0].reasonCode === 'RECEIPT', JSON.stringify(mv[0]));
  ok('heat and grade kept', coil.heatId === heat.id && coil.gradeId === heat.gradeId);
  await books(ok, coil.id);
});
await scenario(G1, 'the same item number received twice is refused and nothing is added', async (ok) => {
  const body = receiptBody();
  await A.post('/api/inventory/receipts', body);
  const coil = await prisma.coil.findUnique({ where: { coilNumber: body.coilNumber } });
  const again = await A.post('/api/inventory/receipts', body);
  ok('refused with 409', again.status === 409, again.status);
  ok('still one item, one movement, same balance', (await prisma.coil.count({ where: { coilNumber: body.coilNumber } })) === 1 && (await movesOf(coil.id)).length === 1 && num((await invOf(coil.id)).qtyOnHand) === 5000);
});
await scenario(G1, 'a receipt naming a heat that is not on file saves nothing', async (ok) => {
  const [c0, i0, m0] = [await prisma.coil.count(), await prisma.inventory.count(), await prisma.materialMovement.count()];
  const body = receiptBody({ heatNumber: `NO-SUCH-${run}` });
  const r = await A.post('/api/inventory/receipts', body);
  ok('refused', r.status >= 400 && r.status < 500, r.status);
  ok('no item, no balance, no movement was left behind', (await prisma.coil.count()) === c0 && (await prisma.inventory.count()) === i0 && (await prisma.materialMovement.count()) === m0);
});
await scenario(G1, 'a fractional weight is kept exactly as entered', async (ok) => {
  const id = await received({ weightLb: 1234.5678, thicknessIn: 0.1875, widthIn: 36.125 });
  const row = (await prisma.$queryRawUnsafe(`SELECT i."qtyOnHand"::text AS q, c."netWeightLb"::text AS w, c."thicknessIn"::text AS t, c."widthIn"::text AS wd, m."qtyMoved"::text AS m FROM "Inventory" i JOIN "Coil" c ON c.id=i."coilId" JOIN "MaterialMovement" m ON m."coilId"=c.id WHERE c.id='${id}'`))[0];
  const clean = (s) => s.replace(/0+$/, '').replace(/\.$/, '');
  ok('on hand is exactly 1234.5678', clean(row.q) === '1234.5678', row.q);
  ok('item weight is exactly 1234.5678', clean(row.w) === '1234.5678', row.w);
  ok('movement is exactly 1234.5678', clean(row.m) === '1234.5678', row.m);
  ok('thickness 0.1875 and width 36.125 exact', clean(row.t) === '0.1875' && clean(row.wd) === '36.125', `${row.t} ${row.wd}`);
});
await scenario(G1, 'receiving more of an item adds exactly that much, with a movement', async (ok) => {
  const id = await received({ weightLb: 2000 });
  const r = await A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: 750.25 });
  ok('accepted', r.status === 201, r.status);
  const inv = await invOf(id);
  ok('2000 + 750.25 = 2750.25 on hand and available', num(inv.qtyOnHand) === 2750.25 && num(inv.qtyAvailable) === 2750.25, JSON.stringify(inv));
  ok('two RECEIVE movements', (await movesOf(id, 'RECEIVE')).length === 2);
  await books(ok, id);
});
await scenario(G1, 'receiving at a branch the item is not at, or a zero or negative quantity, changes nothing', async (ok) => {
  const id = await received({ weightLb: 900 });
  const wrong = await A.post('/api/inventory/receive', { coilId: id, locationId: L2.id, qty: 100 });
  const neg = await A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: -5 });
  const zero = await A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: 0 });
  ok('wrong branch refused with 409', wrong.status === 409, wrong.status);
  ok('negative and zero refused with 400', neg.status === 400 && zero.status === 400, `${neg.status} ${zero.status}`);
  ok('balance and ledger unchanged', num((await invOf(id)).qtyOnHand) === 900 && (await movesOf(id)).length === 1);
});
await scenario(G1, 'an upload with one bad row saves the good rows and reports the bad one', async (ok) => {
  const good1 = tag('UP'), good2 = tag('UP'), bad = tag('UP');
  const row = (n, over = {}) => ({ tag_number: n, heat_number: heat.heatNumber, grade: heat.grade.code, thickness: 0.25, width: 48, length: 120, weight_lbs: 1500, location_code: L1.code, ...over });
  const r = await A.post('/api/inventory/bulk-upload', { templateType: 'plates', items: [row(good1), row(bad, { weight_lbs: -4 }), row(good2, { weight_lbs: 1750.5 })] });
  ok('answered', r.status < 500, `${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const saved = await prisma.coil.findMany({ where: { coilNumber: { in: [good1, good2, bad] } } });
  ok('two good rows saved, the bad one not', saved.length === 2 && !saved.some((c) => c.coilNumber === bad), `${saved.map((c) => c.coilNumber).join(',')} ${JSON.stringify(r.body).slice(0, 220)}`);
  for (const c of saved) { const mv = await movesOf(c.id); ok(`${c.coilNumber}: movement marked UPLOAD`, mv.length === 1 && mv[0].reasonCode === 'UPLOAD'); await books(ok, c.id, c.coilNumber); }
});
await scenario(G1, 'a hold takes stock out of sale and a release puts it back, with the books in balance throughout', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const h = await A.post(`/api/coils/${id}/hold`, { holdType: 'QUALITY', holdReason: 'QA phase 3' });
  const held = await invOf(id);
  ok('hold accepted', ok2(h), `${h.status} ${JSON.stringify(h.body).slice(0, 150)}`);
  ok('3000 moved from available to on hold; on hand unchanged', num(held.qtyOnHold) === 3000 && num(held.qtyAvailable) === 0 && num(held.qtyOnHand) === 3000, JSON.stringify(held));
  const again = await A.post(`/api/coils/${id}/hold`, { holdType: 'QUALITY', holdReason: 'twice' });
  ok('a second hold is refused', again.status === 409, again.status);
  await books(ok, id, 'held');
  const rel = await A.post(`/api/coils/${id}/release`, { reason: 'QA phase 3 release' });
  const free = await invOf(id);
  ok('release accepted', ok2(rel), `${rel.status} ${JSON.stringify(rel.body).slice(0, 150)}`);
  ok('back to 3000 available, 0 on hold', num(free.qtyAvailable) === 3000 && num(free.qtyOnHold) === 0, JSON.stringify(free));
  await books(ok, id, 'released');
});
await scenario(G1, 'a warehouse login held to one branch cannot receive into another', async (ok) => {
  const body = receiptBody({ locationId: L4.id });
  const r = await A.post('/api/inventory/receipts', body, 'branchWh');
  ok('refused', [403, 404].includes(r.status), `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
  ok('no item was created at the other branch', (await prisma.coil.count({ where: { coilNumber: body.coilNumber } })) === 0);
  const own = receiptBody({ locationId: L1.id });
  const mine = await A.post('/api/inventory/receipts', own, 'branchWh');
  ok('the same login receives into its own branch', mine.status === 201, `${mine.status} ${JSON.stringify(mine.body).slice(0, 150)}`);
});
await scenario(G1, 'the database itself refuses a negative balance, a broken balance and a movement of nothing', async (ok) => {
  const id = await received({ weightLb: 100 });
  const tryRaw = async (sql) => { try { await prisma.$executeRawUnsafe(sql); return 'accepted'; } catch (e) { return /check constraint|violates/.test(String(e.message)) ? 'refused' : `error ${String(e.message).slice(0, 80)}`; } };
  ok('on hand below zero', (await tryRaw(`UPDATE "Inventory" SET "qtyOnHand" = -1, "qtyAvailable" = -1 WHERE "coilId"='${id}'`)) === 'refused');
  ok('on hand that is not available + reserved + on hold', (await tryRaw(`UPDATE "Inventory" SET "qtyAvailable" = 50 WHERE "coilId"='${id}'`)) === 'refused');
  ok('a movement of zero', (await tryRaw(`INSERT INTO "MaterialMovement" (id, "coilId", "movementType", "qtyMoved", "createdById") VALUES ('${tag('MV')}', '${id}', 'RECEIVE', 0, '${users.admin.id}')`)) === 'refused');
  ok('a negative item weight', (await tryRaw(`UPDATE "Coil" SET "netWeightLb" = -10 WHERE id='${id}'`)) === 'refused');
  ok('the row is untouched', num((await invOf(id)).qtyOnHand) === 100 && num((await coilOf(id)).netWeightLb) === 100);
});

// ══ 2. Reservations and shipping ═════════════════════════════════════════════════════════
const G2 = 'Reservations and material consumption';
await scenario(G2, 'a reservation moves quantity from available to reserved and is on file against the line', async (ok) => {
  const id = await received({ weightLb: 4000 });
  const o = (await order([line(1500)])).body;
  const r = await reserve(o, o.lines[0], id, 1500);
  const inv = await invOf(id);
  ok('accepted', r.status === 201, r.status);
  ok('2500 available, 1500 reserved, 4000 on hand', num(inv.qtyAvailable) === 2500 && num(inv.qtyAllocated) === 1500 && num(inv.qtyOnHand) === 4000, JSON.stringify(inv));
  ok('item shows as reserved', (await coilOf(id)).status === 'ALLOCATED');
  ok('no stock movement: a reservation does not move material', (await movesOf(id)).length === 1);
  const log = await prisma.auditLog.findFirst({ where: { eventType: 'STOCK_RESERVED', resourceId: o.id } });
  ok('the history names who reserved what', log?.userId === users.admin.id && log.details?.coilId === id && Number(log.details?.qty) === 1500, JSON.stringify(log?.details));
  await books(ok, id);
});
await scenario(G2, 'reserving more than is available is refused and changes nothing', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const o = (await order([line(3000)])).body;
  const r = await reserve(o, o.lines[0], id, 1000.01);
  ok('refused with 409', r.status === 409, r.status);
  const inv = await invOf(id);
  ok('nothing reserved', num(inv.qtyAllocated) === 0 && num(inv.qtyAvailable) === 1000 && (await allocSum(id)) === 0);
});
await scenario(G2, 'reserving more than the order line still needs is refused', async (ok) => {
  const id = await received({ weightLb: 5000 });
  const o = (await order([line(800)])).body;
  ok('first 500 accepted', (await reserve(o, o.lines[0], id, 500)).status === 201);
  const over = await reserve(o, o.lines[0], id, 300.5);
  ok('300.5 more is refused: only 300 is open', over.status === 409, over.status);
  ok('exactly 500 reserved', num((await invOf(id)).qtyAllocated) === 500);
  await books(ok, id);
});
await scenario(G2, 'cancelling an order gives every reservation back', async (ok) => {
  const a = await received({ weightLb: 2000 }); const b = await received({ weightLb: 2000 });
  const o = (await order([line(1200), line(700)])).body;
  await reserve(o, o.lines[0], a, 1200); await reserve(o, o.lines[1], b, 700);
  const c = await A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' });
  ok('cancel accepted', ok2(c), `${c.status} ${JSON.stringify(c.body).slice(0, 150)}`);
  for (const id of [a, b]) { const inv = await invOf(id); ok('all available again, none reserved', num(inv.qtyAvailable) === 2000 && num(inv.qtyAllocated) === 0, JSON.stringify(inv)); ok('item available again', (await coilOf(id)).status === 'AVAILABLE'); await books(ok, id); }
  ok('no reservation rows left on the order', (await prisma.orderLineAllocation.count({ where: { orderLine: { orderId: o.id } } })) === 0);
  const moves = await prisma.auditLog.findMany({ where: { eventType: 'ORDER_STATUS_CHANGED', resourceId: o.id }, orderBy: { timestamp: 'asc' } });
  ok('the history shows the confirmation and the cancellation, each with the person', moves.length === 2 && moves[1].details?.from === 'CONFIRMED' && moves[1].details?.to === 'CANCELLED' && moves.every((m) => m.userId), JSON.stringify(moves.map((m) => m.details)));
  const late = await reserve(o, o.lines[0], a, 10);
  ok('a cancelled order cannot reserve stock', late.status === 409, late.status);
});
await scenario(G2, 'shipping reserved stock takes it off hand, writes the movement and updates the line', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const o = (await order([line(1100)])).body;
  await reserve(o, o.lines[0], id, 1100);
  const s = await shipment(o, L1, [[o.lines[0], 1100]]);
  ok('shipment created', s.status === 201, `${s.status} ${JSON.stringify(s.body).slice(0, 200)}`);
  ok('creating the shipment moves nothing yet', num((await invOf(id)).qtyOnHand) === 3000);
  const d = await dispatch(s.body);
  ok('dispatched', ok2(d), `${d.status} ${JSON.stringify(d.body).slice(0, 200)}`);
  const inv = await invOf(id); const mv = await movesOf(id, 'SHIP');
  ok('1900 on hand, 0 reserved, 1900 available', num(inv.qtyOnHand) === 1900 && num(inv.qtyAllocated) === 0 && num(inv.qtyAvailable) === 1900, JSON.stringify(inv));
  ok('one SHIP movement of 1100 tied to the order and the shipment, from the branch', mv.length === 1 && num(mv[0].qtyMoved) === 1100 && mv[0].orderId === o.id && mv[0].shipmentId === s.body.id && mv[0].fromLocationId === L1.id, JSON.stringify(mv[0]));
  const l = await prisma.orderLine.findUnique({ where: { id: o.lines[0].id } });
  ok('line shows 1100 shipped; order complete', num(l.qtyShipped) === 1100 && (await prisma.order.findUnique({ where: { id: o.id } })).status === 'COMPLETE');
  await books(ok, id);
});
await scenario(G2, 'a part shipment leaves the rest reserved, and the order is not complete', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const o = (await order([line(1000)])).body;
  await reserve(o, o.lines[0], id, 1000);
  const s = await shipment(o, L1, [[o.lines[0], 400]]); await dispatch(s.body);
  const inv = await invOf(id);
  ok('2600 on hand, 600 still reserved, 2000 available', num(inv.qtyOnHand) === 2600 && num(inv.qtyAllocated) === 600 && num(inv.qtyAvailable) === 2000, JSON.stringify(inv));
  const od = await prisma.order.findUnique({ where: { id: o.id }, include: { lines: true } });
  ok('order is PARTIAL with 400 of 1000 shipped', od.status === 'PARTIAL' && num(od.lines[0].qtyShipped) === 400, `${od.status} ${od.lines[0].qtyShipped}`);
  const over = await shipment(o, L1, [[o.lines[0], 600.5]]);
  ok('shipping more than is left on the line is refused', over.status >= 400 && over.status < 500, over.status);
  await books(ok, id);
});
await scenario(G2, 'stock on hold cannot be reserved', async (ok) => {
  const id = await received({ weightLb: 1000 });
  await A.post(`/api/coils/${id}/hold`, { holdType: 'QUALITY', holdReason: 'QA phase 3' });
  const o = (await order([line(100)])).body;
  const r = await reserve(o, o.lines[0], id, 100);
  ok('refused with 409', r.status === 409, r.status);
  ok('nothing reserved', (await allocSum(id)) === 0 && num((await invOf(id)).qtyAllocated) === 0);
});
await scenario(G2, 'a dispatch that hits a hold on one of two lines saves nothing for either line', async (ok) => {
  const a = await received({ weightLb: 2000 }); const b = await received({ weightLb: 2000 });
  const o = (await order([line(500), line(600)])).body;
  await reserve(o, o.lines[0], a, 500); await reserve(o, o.lines[1], b, 600);
  const s = await shipment(o, L1, [[o.lines[0], 500], [o.lines[1], 600]]);
  // The second item goes on hold after it was reserved. The hold route keeps the reservation.
  await prisma.coil.update({ where: { id: b }, data: { status: 'HOLD', qcStatus: 'HOLD' } });
  const d = await dispatch(s.body);
  ok('dispatch refused with 409', d.status === 409, `${d.status} ${JSON.stringify(d.body).slice(0, 160)}`);
  const [ia, ib] = [await invOf(a), await invOf(b)];
  ok('first line: nothing left the shelf (rolled back)', num(ia.qtyOnHand) === 2000 && num(ia.qtyAllocated) === 500, JSON.stringify(ia));
  ok('second line untouched', num(ib.qtyOnHand) === 2000 && num(ib.qtyAllocated) === 600);
  ok('no SHIP movement was written', (await movesOf(a, 'SHIP')).length === 0 && (await movesOf(b, 'SHIP')).length === 0);
  ok('shipment still not dispatched; line shows nothing shipped', (await prisma.shipment.findUnique({ where: { id: s.body.id } })).status !== 'IN_TRANSIT' && num((await prisma.orderLine.findUnique({ where: { id: o.lines[0].id } })).qtyShipped) === 0);
  ok('no invoice was raised', (await invoicesOf(o.id)).length === 0);
  await prisma.coil.update({ where: { id: b }, data: { status: 'ALLOCATED', qcStatus: 'PASSED' } });
});

await scenario(G2, 'shipping a line that has no reservation: the order and invoice move, the stock does not (the current rule)', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const o = (await order([line(300, 2)])).body;
  const s = await shipment(o, L1, [[o.lines[0], 300]]); const d = await dispatch(s.body);
  ok('dispatch is accepted with nothing reserved', ok2(d), `${d.status} ${JSON.stringify(d.body).slice(0, 160)}`);
  ok('the order line shows 300 shipped and one invoice for 600.00 is raised', num((await prisma.orderLine.findUnique({ where: { id: o.lines[0].id } })).qtyShipped) === 300 && cents((await invoicesOf(o.id))[0]?.totalAmount) === 60000);
  const moved = await prisma.materialMovement.count({ where: { shipmentId: s.body.id } });
  ok('no stock movement is written and no stock item is named', moved === 0, `${moved} movement(s)`);
  ok('no stock balance changed', num((await invOf(id)).qtyOnHand) === 1000);
  notes.push('Shipping without a reservation: a dispatch of 300 lb with nothing reserved was accepted, invoiced, and left no stock movement. No stock item, and so no heat, is recorded against that shipment, and no balance went down. Whether a shipment must be fully reserved before it can leave is the owner\'s rule; recorded as finding G-019.');
});

// ══ 3. Work orders, scrap and remnants ═══════════════════════════════════════════════════
const G3 = 'Work orders, scrap and remnants';
const woHistory = (id) => prisma.auditLog.findMany({ where: { resourceType: 'WorkOrder', resourceId: id, eventType: 'WORK_ORDER_STATUS_CHANGED' }, orderBy: { timestamp: 'asc' } });
async function workOrder(coilId, over = {}) { return A.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: coilId, priority: 3, notes: `QA phase 3 ${run}`, ...over }); }
await scenario(G3, 'a work order runs from created to complete with weights, yield and a history line for each move', async (ok) => {
  const id = await received({ weightLb: 8000 });
  const wo = await workOrder(id);
  ok('created with the item weight as input', wo.status === 201 && num(wo.body.inputWeightLb) === 8000, `${wo.status} ${JSON.stringify(wo.body).slice(0, 200)}`);
  for (const stepName of ['release', 'start']) { const r = await A.put(`/api/work-orders/${wo.body.id}/${stepName}`, {}); ok(stepName, ok2(r), `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`); }
  const done = await A.put(`/api/work-orders/${wo.body.id}/complete`, { outputWeightLb: 7812.5, scrapWeightLb: 187.5 });
  ok('completed', ok2(done), `${done.status} ${JSON.stringify(done.body).slice(0, 150)}`);
  const row = await prisma.workOrder.findUnique({ where: { id: wo.body.id } });
  ok('output 7812.5, scrap 187.5, yield 97.66 saved', num(row.outputWeightLb) === 7812.5 && num(row.scrapWeightLb) === 187.5 && num(row.yieldPct) === 97.66 && row.status === 'COMPLETE', JSON.stringify({ o: row.outputWeightLb, s: row.scrapWeightLb, y: row.yieldPct }));
  const hist = await woHistory(wo.body.id);
  ok('three moves in the history, each with the person', hist.length === 3 && hist.every((h) => h.userId === users.admin.id), `${hist.length}`);
});
await scenario(G3, 'more cannot come off the line than went on, and weights cannot be negative', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const wo = (await workOrder(id)).body;
  await A.put(`/api/work-orders/${wo.id}/release`, {}); await A.put(`/api/work-orders/${wo.id}/start`, {});
  const over = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 1000, scrapWeightLb: 100 });
  const neg = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: -1 });
  const none = await A.put(`/api/work-orders/${wo.id}/complete`, {});
  ok('output + scrap above input refused', over.status === 400, over.status);
  ok('negative output refused; missing output refused', neg.status === 400 && none.status === 400, `${neg.status} ${none.status}`);
  const row = await prisma.workOrder.findUnique({ where: { id: wo.id } });
  ok('still in progress with no weights saved', row.status === 'IN_PROGRESS' && row.outputWeightLb == null, `${row.status} ${row.outputWeightLb}`);
});
await scenario(G3, 'a completed work order cannot be completed again or cancelled', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const wo = (await workOrder(id)).body;
  await A.put(`/api/work-orders/${wo.id}/release`, {}); await A.put(`/api/work-orders/${wo.id}/start`, {});
  await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 950, scrapWeightLb: 50 });
  const again = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 10, scrapWeightLb: 0 });
  const cancel = await A.put(`/api/work-orders/${wo.id}/cancel`, { reason: 'QA' });
  ok('second completion refused with 409', again.status === 409, again.status);
  ok('cancel after completion refused with 409', cancel.status === 409, cancel.status);
  const row = await prisma.workOrder.findUnique({ where: { id: wo.id } });
  ok('the first figures stand', num(row.outputWeightLb) === 950 && row.status === 'COMPLETE');
  ok('exactly one completion in the history', (await woHistory(wo.id)).filter((h) => h.details?.to === 'COMPLETE').length === 1);
});
await scenario(G3, 'steps out of order are refused', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const wo = (await workOrder(id)).body;
  const early = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 900 });
  ok('complete before start refused', early.status === 409, early.status);
  ok('status unchanged', (await prisma.workOrder.findUnique({ where: { id: wo.id } })).status === wo.status);
  const c = await A.put(`/api/work-orders/${wo.id}/cancel`, { reason: 'QA' });
  ok('cancel accepted', ok2(c), c.status);
  const start = await A.put(`/api/work-orders/${wo.id}/start`, {});
  ok('a cancelled work order cannot start', start.status === 409, start.status);
});
await scenario(G3, 'a work order needs a real, available source item', async (ok) => {
  const n0 = await prisma.workOrder.count();
  const none = await workOrder(`no-such-${run}`);
  ok('unknown item refused', none.status === 400, none.status);
  const id = await received({ weightLb: 1000 });
  await A.post(`/api/coils/${id}/hold`, { holdType: 'QUALITY', holdReason: 'QA' });
  const held = await workOrder(id);
  ok('an item on hold refused with 409', held.status === 409, held.status);
  ok('no work order row was created', (await prisma.workOrder.count()) === n0);
});
await scenario(G3, 'a remnant entered against its parent keeps the heat, grade and owner, and is traceable both ways', async (ok) => {
  const parentNo = tag('PAR');
  const parent = await received({ coilNumber: parentNo, weightLb: 6000 });
  const remNo = tag('REM');
  const r = await A.post('/api/inventory/bulk-upload', { templateType: 'remnants', items: [{ tag_number: remNo, parent_tag: parentNo, thickness: 0.5, width: 12, length: 30, weight_lbs: 51.25, location_code: L1.code }] });
  ok('accepted', r.status < 300, `${r.status} ${JSON.stringify(r.body).slice(0, 250)}`);
  const rem = await prisma.coil.findUnique({ where: { coilNumber: remNo } }); const par = await coilOf(parent);
  ok('remnant saved', !!rem, 'not saved');
  if (!rem) return;
  ok('linked to its parent', rem.parentCoilId === parent);
  ok('same heat, grade and owner as the parent', rem.heatId === par.heatId && rem.gradeId === par.gradeId && rem.ownerId === par.ownerId);
  ok('its own balance of 51.25 and its own movement', num((await invOf(rem.id)).qtyOnHand) === 51.25 && (await movesOf(rem.id)).length === 1);
  ok('the parent can list its remnants', (await prisma.coil.count({ where: { parentCoilId: parent } })) === 1);
  await books(ok, rem.id, 'remnant');
  const pInv = await invOf(parent);
  notes.push(`Remnant quantity: entering a ${num((await invOf(rem.id)).qtyOnHand)} lb remnant left its parent at ${num(pInv.qtyOnHand)} lb. The application does not take the remnant out of the parent, because processing moves no stock (M-016). Not asserted; recorded as finding G-006.`);
});
await scenario(G3, 'a remnant that names a different heat or grade than its parent, or a parent not on file, is refused', async (ok) => {
  const parentNo = tag('PAR'); await received({ coilNumber: parentNo });
  const n0 = await prisma.coil.count();
  const up = (row) => A.post('/api/inventory/bulk-upload', { templateType: 'remnants', items: [{ tag_number: tag('REM'), thickness: 0.5, width: 12, length: 30, weight_lbs: 40, location_code: L1.code, ...row }] });
  await up({ parent_tag: parentNo, heat_number: otherHeat.heatNumber });
  await up({ parent_tag: parentNo, grade: otherHeat.grade.code });
  await up({ parent_tag: `NO-PARENT-${run}` });
  ok('none of the three was saved', (await prisma.coil.count()) === n0, `${(await prisma.coil.count()) - n0} saved`);
});
await scenario(G3, 'completing a work order records the weights and leaves the stock balance alone (the current rule)', async (ok) => {
  const id = await received({ weightLb: 2000 });
  const wo = (await workOrder(id)).body;
  await A.put(`/api/work-orders/${wo.id}/release`, {}); await A.put(`/api/work-orders/${wo.id}/start`, {});
  await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 1900, scrapWeightLb: 100 });
  const inv = await invOf(id);
  ok('balance identity still holds', Math.abs(num(inv.qtyOnHand) - (num(inv.qtyAvailable) + num(inv.qtyAllocated) + num(inv.qtyOnHold))) < 1e-6);
  ok('no stock movement was invented', (await movesOf(id)).length === 1);
  notes.push(`Work order completion: ${num(inv.qtyOnHand)} lb is still on hand for an item whose work order recorded 1900 lb out and 100 lb scrap. What processing consumes and produces is the owner's rule (M-016, REQUIRES BUSINESS DECISION).`);
});

// ══ 4. Transfers between branches ════════════════════════════════════════════════════════
const G4 = 'Interbranch transfers';
const transfer = (coilId, from, to, qty, who = 'admin') => A.post('/api/inventory/transfer', { coilId, fromLocationId: from?.id, toLocationId: to?.id, ...(qty != null && { qty }) }, who);
const companyTotal = async () => num((await prisma.inventory.aggregate({ _sum: { qtyOnHand: true } }))._sum.qtyOnHand);
await scenario(G4, 'a transfer moves the whole item, on both records, with one movement, and creates or loses nothing', async (ok) => {
  const id = await received({ weightLb: 7250.5 });
  const total = await companyTotal();
  const [a0, b0] = [num((await prisma.inventory.aggregate({ where: { locationId: L1.id }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand), num((await prisma.inventory.aggregate({ where: { locationId: L2.id }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand)];
  const t = await transfer(id, L1, L2, 7250.5);
  ok('accepted', ok2(t), `${t.status} ${JSON.stringify(t.body).slice(0, 160)}`);
  const inv = await invOf(id); const mv = await movesOf(id, 'TRANSFER');
  ok('item and stock row are both at the destination', inv.locationId === L2.id && (await coilOf(id)).locationId === L2.id);
  ok('quantity unchanged: 7250.5', num(inv.qtyOnHand) === 7250.5 && num(inv.qtyAvailable) === 7250.5);
  ok('one TRANSFER movement, from and to named, whole quantity, by the user', mv.length === 1 && mv[0].fromLocationId === L1.id && mv[0].toLocationId === L2.id && num(mv[0].qtyMoved) === 7250.5 && mv[0].createdById === users.admin.id, JSON.stringify(mv[0]));
  const [a1, b1] = [num((await prisma.inventory.aggregate({ where: { locationId: L1.id }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand), num((await prisma.inventory.aggregate({ where: { locationId: L2.id }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand)];
  ok('sending branch is down by exactly 7250.5 and receiving branch up by exactly 7250.5', Math.abs((a0 - a1) - 7250.5) < 1e-6 && Math.abs((b1 - b0) - 7250.5) < 1e-6, `${a0 - a1} ${b1 - b0}`);
  ok('company total unchanged', Math.abs((await companyTotal()) - total) < 1e-6);
  await books(ok, id);
});
await scenario(G4, 'part of a tracked item cannot be transferred', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const t = await transfer(id, L1, L2, 1000);
  ok('refused with 409', t.status === 409, t.status);
  ok('item has not moved; no movement', (await invOf(id)).locationId === L1.id && (await movesOf(id, 'TRANSFER')).length === 0);
});
await scenario(G4, 'a transfer that names the wrong sending branch, the same branch or an unknown branch is refused', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const wrong = await transfer(id, L2, L4);
  const same = await transfer(id, L1, L1);
  const unknown = await transfer(id, L1, { id: `no-such-${run}` });
  const noDest = await A.post('/api/inventory/transfer', { coilId: id });
  ok('wrong sending branch 409', wrong.status === 409, wrong.status);
  ok('same branch 400', same.status === 400, same.status);
  ok('unknown branch 400', unknown.status === 400, unknown.status);
  ok('no destination 400', noDest.status === 400, noDest.status);
  ok('item has not moved; no movement', (await invOf(id)).locationId === L1.id && (await movesOf(id, 'TRANSFER')).length === 0);
});
await scenario(G4, 'the same transfer sent twice at once happens once', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const both = await Promise.all([transfer(id, L1, L2), transfer(id, L1, L2)]);
  ok('one accepted, one refused', both.filter(ok2).length === 1 && both.filter((r) => [400, 409].includes(r.status)).length === 1, both.map((r) => r.status).join(','));
  ok('one movement; item at the destination with its full quantity', (await movesOf(id, 'TRANSFER')).length === 1 && (await invOf(id)).locationId === L2.id && num((await invOf(id)).qtyOnHand) === 3000);
  await books(ok, id);
});
await scenario(G4, 'two transfers of one item to different branches at once: one wins and the ledger ends where the item is', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const both = await Promise.all([transfer(id, L1, L2), transfer(id, L1, L4)]);
  ok('exactly one accepted', both.filter(ok2).length === 1, both.map((r) => r.status).join(','));
  const mv = await movesOf(id, 'TRANSFER'); const inv = await invOf(id);
  ok('one movement, ending at the branch the item is now at', mv.length === 1 && mv[0].toLocationId === inv.locationId, `${mv.length} ${mv[0]?.toLocationId} ${inv.locationId}`);
  await books(ok, id);
});
await scenario(G4, 'a branch can send its stock to another branch but cannot pull stock from one it is not in', async (ok) => {
  const mine = await received({ weightLb: 1000, locationId: L1.id });
  const theirs = await received({ weightLb: 1000, locationId: L4.id });
  const pull = await transfer(theirs, L4, L1, null, 'branchWh');
  ok('pull refused', [403, 404].includes(pull.status), `${pull.status}`);
  ok('their item has not moved', (await invOf(theirs)).locationId === L4.id && (await movesOf(theirs, 'TRANSFER')).length === 0);
  const send = await transfer(mine, L1, L4, null, 'branchWh');
  ok('send accepted', ok2(send), `${send.status} ${JSON.stringify(send.body).slice(0, 150)}`);
  ok('the item is now at the other branch', (await invOf(mine)).locationId === L4.id);
  const peek = await A.get(`/api/coils/${mine}`, 'branchWh');
  ok('and the sender can no longer open it', peek.status === 404, peek.status);
});
await scenario(G4, 'a reserved item transferred to the branch that will ship it keeps its reservation, and ships from there', async (ok) => {
  const id = await received({ weightLb: 2000, locationId: L2.id });
  const o = (await order([line(500)])).body;
  await reserve(o, o.lines[0], id, 500);
  const t = await transfer(id, L2, L1);
  ok('transfer accepted', ok2(t), `${t.status} ${JSON.stringify(t.body).slice(0, 160)}`);
  const inv = await invOf(id);
  ok('at the new branch with 2000 on hand, 500 still reserved, 1500 available', inv.locationId === L1.id && num(inv.qtyOnHand) === 2000 && num(inv.qtyAllocated) === 500 && num(inv.qtyAvailable) === 1500, JSON.stringify(inv));
  ok('the reservation row is still on file against the same order line', (await prisma.orderLineAllocation.count({ where: { coilId: id, orderLineId: o.lines[0].id } })) === 1);
  ok('the movement carries the whole 2000, reserved part included', num((await movesOf(id, 'TRANSFER'))[0].qtyMoved) === 2000);
  await books(ok, id, 'after transfer');
  const s = await shipment(o, L1, [[o.lines[0], 500]]); const d = await dispatch(s.body);
  ok('the order ships from the new branch', ok2(d), `${d.status} ${JSON.stringify(d.body).slice(0, 160)}`);
  const mv = (await movesOf(id, 'SHIP'))[0];
  ok('the shipping movement names the branch the item is now at', mv?.fromLocationId === L1.id && num((await invOf(id)).qtyOnHand) === 1500, JSON.stringify(mv));
  await books(ok, id, 'after shipping');
});
await scenario(G4, 'a transfer out and back leaves two movements and the item where it started', async (ok) => {
  const id = await received({ weightLb: 1500 });
  await transfer(id, L1, L2); const back = await transfer(id, L2, L1);
  ok('return leg accepted', ok2(back), back.status);
  const mv = await movesOf(id, 'TRANSFER');
  ok('two movements: out, then back', mv.length === 2 && mv[0].toLocationId === L2.id && mv[1].fromLocationId === L2.id && mv[1].toLocationId === L1.id);
  ok('1500 on hand at the first branch', (await invOf(id)).locationId === L1.id && num((await invOf(id)).qtyOnHand) === 1500);
  await books(ok, id);
});
await scenario(G4, 'an item with nothing on hand cannot be transferred', async (ok) => {
  const id = await received({ weightLb: 600 });
  const o = (await order([line(600)])).body;
  await reserve(o, o.lines[0], id, 600);
  const s = await shipment(o, L1, [[o.lines[0], 600]]); await dispatch(s.body);
  const t = await transfer(id, L1, L2);
  ok('refused with 409', t.status === 409, t.status);
  ok('no transfer movement', (await movesOf(id, 'TRANSFER')).length === 0);
});
notes.push('Transfers: on the real stock list a transfer is one immediate step. There is no request, approval, picking, in-transit or receipt stage, so partial receipt, shortage, damage in transit, lost in transit and duplicate receipt cannot occur and were NOT EXECUTED. Recorded as finding G-007.');

// ══ 5. Orders, invoices and money ════════════════════════════════════════════════════════
const G5 = 'Orders, invoicing and financial records';
await scenario(G5, 'order to invoice: every amount is exact to the cent and the totals add up', async (ok) => {
  const id = await received({ weightLb: 3000 });
  // 1137 lb at 0.8125 = 923.81 (923.80625 rounded); tax at 8.25% = 76.21
  const o = (await order([line(1137, 0.8125)], { taxRate: 0.0825, freight: 45 })).body;
  await reserve(o, o.lines[0], id, 1137);
  const s = await shipment(o, L1, [[o.lines[0], 1137]]); await dispatch(s.body);
  const inv = (await invoicesOf(o.id))[0];
  ok('one invoice was raised by the shipment', !!inv && (await invoicesOf(o.id)).length === 1);
  const text = (await prisma.$queryRawUnsafe(`SELECT subtotal::text s, "taxAmount"::text t, "freightAmount"::text f, "totalAmount"::text tot FROM "Invoice" WHERE id='${inv.id}'`))[0];
  ok('subtotal 923.81, tax 76.21, freight 45, total 1045.02', cents(inv.subtotal) === 92381 && cents(inv.taxAmount) === 7621 && cents(inv.freightAmount) === 4500 && cents(inv.totalAmount) === 104502, JSON.stringify(text));
  ok('no digits beyond the cent are stored', [text.s, text.t, text.f, text.tot].every(exactCents), JSON.stringify(text));
  ok('invoice subtotal equals its lines', cents(inv.subtotal) === inv.lines.reduce((x, l) => x + cents(l.extendedPrice), 0));
  ok('invoice is tied to the shipment and each line to its order line', inv.shipmentId === s.body.id && inv.lines.every((l) => l.orderLineId === o.lines[0].id));
  const od = (await prisma.$queryRawUnsafe(`SELECT subtotal::text s, "taxAmount"::text t, "totalAmount"::text tot FROM "Order" WHERE id='${o.id}'`))[0];
  ok('the order stores exact cents too', [od.s, od.t, od.tot].every(exactCents), JSON.stringify(od));
  ok('the unit price keeps its four places', num((await prisma.orderLine.findUnique({ where: { id: o.lines[0].id } })).unitPrice) === 0.8125);
});
await scenario(G5, 'two part shipments: tax and freight are billed once in total, to the cent', async (ok) => {
  const id = await received({ weightLb: 3000 });
  const o = (await order([line(1000, 0.777)], { taxRate: 0.0725, freight: 60 })).body; // 777.00, tax 56.33
  await reserve(o, o.lines[0], id, 1000);
  const s1 = await shipment(o, L1, [[o.lines[0], 333]]); await dispatch(s1.body);
  const s2 = await shipment(o, L1, [[o.lines[0], 667]]); await dispatch(s2.body);
  const invs = (await invoicesOf(o.id)).filter((i) => i.kind === 'INVOICE');
  ok('two invoices', invs.length === 2, invs.length);
  const sum = (f) => invs.reduce((x, i) => x + cents(i[f]), 0);
  ok('subtotals add up to the order subtotal 777.00', sum('subtotal') === 77700, sum('subtotal'));
  ok('tax adds up to the order tax 56.33 exactly', sum('taxAmount') === 5633, sum('taxAmount'));
  ok('freight billed once: 60.00', sum('freightAmount') === 6000, sum('freightAmount'));
  ok('grand total equals the order total', sum('totalAmount') === cents((await prisma.order.findUnique({ where: { id: o.id } })).totalAmount));
  ok('each invoice total = subtotal + tax + freight', invs.every((i) => cents(i.totalAmount) === cents(i.subtotal) + cents(i.taxAmount) + cents(i.freightAmount)));
});
async function billedOrder(qty = 500, price = 1.11, opts = {}) {
  const id = await received({ weightLb: qty + 100 });
  const o = (await order([line(qty, price)], opts)).body;
  await reserve(o, o.lines[0], id, qty);
  const s = await shipment(o, L1, [[o.lines[0], qty]]); await dispatch(s.body);
  return { o, coilId: id, shipment: s.body, invoice: (await invoicesOf(o.id))[0] };
}
await scenario(G5, 'payments: the paid amount is the sum of the payments, and an overpayment is refused', async (ok) => {
  const { invoice } = await billedOrder(500, 1.11, { taxRate: 0.06 }); // 555.00 + 33.30 = 588.30
  const p1 = await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 200.1, paymentMethod: 'CHECK', referenceNumber: 'QA-1' }, 'csr');
  ok('part payment accepted', ok2(p1), `${p1.status} ${JSON.stringify(p1.body).slice(0, 150)}`);
  const over = await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 388.21, paymentMethod: 'CHECK' }, 'csr');
  ok('a payment one cent above the balance is refused', over.status === 409 || over.status === 400, over.status);
  const frac = await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 10.005, paymentMethod: 'CHECK' }, 'csr');
  ok('a payment with a fraction of a cent is refused', frac.status === 400, frac.status);
  const p2 = await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 388.2, paymentMethod: 'CHECK' }, 'csr');
  ok('the exact balance is accepted', ok2(p2), p2.status);
  const row = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
  ok('paid 588.30 = 200.10 + 388.20, status PAID', cents(row.paidAmount) === 58830 && row.payments.reduce((x, p) => x + cents(p.amount), 0) === 58830 && row.status === 'PAID', `${row.paidAmount} ${row.status}`);
  const text = (await prisma.$queryRawUnsafe(`SELECT "paidAmount"::text p FROM "Invoice" WHERE id='${invoice.id}'`))[0].p;
  ok('paid amount stored with no stray digits', exactCents(text), text);
  const more = await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 1, paymentMethod: 'CHECK' }, 'csr');
  ok('a paid invoice takes no more money', more.status === 409, more.status);
  ok('each payment has a history line with the person', (await prisma.auditLog.count({ where: { resourceType: 'Invoice', resourceId: invoice.id, eventType: 'PAYMENT_RECORDED' } })) === 2);
});
await scenario(G5, 'credit memos: linked to the invoice, never more than it, and the money owed back is exact', async (ok) => {
  const { invoice } = await billedOrder(400, 2.5, { taxRate: 0.07 }); // 1000.00 + 70.00
  await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 1070, paymentMethod: 'CHECK' }, 'csr');
  const c1 = await A.post(`/api/invoices/${invoice.id}/credit`, { reason: 'QA short', lines: [{ invoiceLineId: invoice.lines[0].id, quantity: 100 }] });
  ok('credit for 100 of 400 accepted', c1.status === 201, `${c1.status} ${JSON.stringify(c1.body).slice(0, 200)}`);
  const memo = await prisma.invoice.findUnique({ where: { id: c1.body.id }, include: { lines: true } });
  ok('credit memo is -250.00 - 17.50 = -267.50 and points at the invoice', cents(memo.subtotal) === -25000 && cents(memo.taxAmount) === -1750 && cents(memo.totalAmount) === -26750 && memo.creditOfInvoiceId === invoice.id && memo.kind === 'CREDIT', `${memo.subtotal} ${memo.taxAmount} ${memo.totalAmount}`);
  const tooMuch = await A.post(`/api/invoices/${invoice.id}/credit`, { reason: 'QA', lines: [{ invoiceLineId: invoice.lines[0].id, quantity: 300.5 }] });
  ok('crediting more than is left on the line is refused', tooMuch.status === 409, tooMuch.status);
  const onMemo = await A.post(`/api/invoices/${memo.id}/credit`, { reason: 'QA', amount: 5 });
  ok('a credit memo cannot itself be credited', onMemo.status === 409, onMemo.status);
  const refundOver = await A.post(`/api/invoices/${memo.id}/refund`, { amount: 267.51, paymentMethod: 'CHECK' });
  ok('a refund one cent above what is owed back is refused', refundOver.status === 409, refundOver.status);
  const refund = await A.post(`/api/invoices/${memo.id}/refund`, { amount: 267.5, paymentMethod: 'CHECK' });
  ok('the exact refund is accepted', ok2(refund), `${refund.status} ${JSON.stringify(refund.body).slice(0, 150)}`);
  const after = await prisma.invoice.findUnique({ where: { id: memo.id }, include: { payments: true } });
  ok('the credit memo is settled: paid equals total', cents(after.paidAmount) === cents(after.totalAmount), `${after.paidAmount} ${after.totalAmount}`);
  const again = await A.post(`/api/invoices/${memo.id}/refund`, { amount: 0.01, paymentMethod: 'CHECK' });
  ok('nothing more can be refunded', again.status === 409, again.status);
});
await scenario(G5, 'an order whose total does not equal subtotal + tax + freight is refused or corrected, never saved wrong', async (ok) => {
  const n0 = await prisma.order.count();
  const r = await A.post('/api/orders', { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 100, taxAmount: 8, freightAmount: 0, totalAmount: 999, poReference: tag('PO'), lines: [line(100, 1)] }, 'csr');
  if (r.status === 201) {
    const row = await prisma.order.findUnique({ where: { id: r.body.id } });
    ok('saved with a total that adds up', cents(row.totalAmount) === cents(row.subtotal) + cents(row.taxAmount) + cents(row.freightAmount), `${row.totalAmount}`);
  } else {
    ok('refused with a 4xx, not a server error', r.status >= 400 && r.status < 500, `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
    ok('nothing saved', (await prisma.order.count()) === n0);
  }
  const neg = await A.post('/api/orders', { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', poReference: tag('PO'), lines: [line(100, -1)] }, 'csr');
  ok('a negative price is refused with a 4xx', neg.status >= 400 && neg.status < 500, neg.status);
  const zero = await A.post('/api/orders', { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', poReference: tag('PO'), lines: [line(0, 1)] }, 'csr');
  ok('a zero quantity is refused with a 4xx', zero.status >= 400 && zero.status < 500, zero.status);
});
await scenario(G5, 'an order with one bad line saves no part of the order', async (ok) => {
  const [o0, l0] = [await prisma.order.count(), await prisma.orderLine.count()];
  const r = await A.post('/api/orders', { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', poReference: tag('PO'), subtotal: 130, totalAmount: 130, lines: [line(100, 0.65), { ...line(100, 0.65), productId: `no-such-product-${run}` }] }, 'csr');
  ok('refused with a 4xx', r.status >= 400 && r.status < 500, `${r.status} ${JSON.stringify(r.body).slice(0, 150)}`);
  ok('no order and no line were saved', (await prisma.order.count()) === o0 && (await prisma.orderLine.count()) === l0, `${(await prisma.order.count()) - o0} orders, ${(await prisma.orderLine.count()) - l0} lines`);
});
await scenario(G5, 'a quote keeps its price when it becomes an order, and belongs to the branch of the person who wrote it', async (ok) => {
  const rfq = await A.post('/api/rfqs', { customerId: customer.id, contactName: 'QA Buyer', lines: [{ productId: cwtProduct.id, description: cwtProduct.name, requestedQty: 1250, unit: 'LB' }] }, 'branchA');
  ok('request logged', rfq.status === 201, `${rfq.status} ${JSON.stringify(rfq.body).slice(0, 200)}`);
  const q = await A.post(`/api/rfqs/${rfq.body.id}/quotes`, { lines: [{ rfqLineId: rfq.body.lines[0].id, unitPrice: 47.35, priceUnit: 'CWT' }] }, 'branchA');
  ok('quoted', q.status === 201, `${q.status} ${JSON.stringify(q.body).slice(0, 200)}`);
  const [rfqRow, quoteRow] = [await prisma.rFQ.findUnique({ where: { id: rfq.body.id } }), await prisma.quote.findUnique({ where: { id: q.body.id } })];
  ok('both carry the branch of the person who entered them', rfqRow.locationId === L1.id && quoteRow.locationId === L1.id, `${rfqRow.locationId} ${quoteRow.locationId}`);
  ok('quote total is 12.5 cwt x 47.35 = 591.88', cents(quoteRow.totalAmount) === 59188, quoteRow.totalAmount);
  const other = await A.get(`/api/quotes/${q.body.id}`, 'branchB');
  ok('a sales login at another branch cannot open the quote', other.status === 404, other.status);
  const list = await A.get('/api/quotes?limit=200', 'branchB');
  ok('nor see it in the list', !JSON.stringify(list.body).includes(q.body.id));
  await A.post(`/api/quotes/${q.body.id}/send`, {}, 'branchA');
  const acc = await A.post(`/api/quotes/${q.body.id}/accept`, { poReference: tag('PO') }, 'branchA');
  ok('accepted', ok2(acc), `${acc.status} ${JSON.stringify(acc.body).slice(0, 200)}`);
  const made = await prisma.order.findFirst({ where: { fromQuote: { id: q.body.id } }, include: { lines: true } });
  ok('one order, at the quoted price and total, in the same branch', !!made && num(made.lines[0].unitPrice) === 47.35 && cents(made.totalAmount) === 59188 && made.locationId === L1.id, `${made?.lines[0]?.unitPrice} ${made?.totalAmount} ${made?.locationId}`);
});
await scenario(G5, 'the database refuses money that does not add up, whoever writes it', async (ok) => {
  const { invoice, o } = await billedOrder(100, 1);
  const tryRaw = async (sql) => { try { await prisma.$executeRawUnsafe(sql); return 'accepted'; } catch (e) { return /check constraint|foreign key|violates/.test(String(e.message)) ? 'refused' : `error ${String(e.message).slice(0, 80)}`; } };
  ok('an invoice total that is not subtotal + tax + freight', (await tryRaw(`UPDATE "Invoice" SET "totalAmount" = "totalAmount" + 1 WHERE id='${invoice.id}'`)) === 'refused');
  ok('an invoice paid above its total', (await tryRaw(`UPDATE "Invoice" SET "paidAmount" = "totalAmount" + 1 WHERE id='${invoice.id}'`)) === 'refused');
  ok('an order total that does not add up', (await tryRaw(`UPDATE "Order" SET "totalAmount" = "totalAmount" + 1 WHERE id='${o.id}'`)) === 'refused');
  ok('a payment of zero', (await tryRaw(`INSERT INTO "Payment" (id, "invoiceId", amount, "paymentMethod") VALUES ('${tag('PAY')}', '${invoice.id}', 0, 'CHECK')`)) === 'refused');
  ok('an invoice pointing at a shipment that does not exist', (await tryRaw(`UPDATE "Invoice" SET "shipmentId" = 'no-such-shipment' WHERE id='${invoice.id}'`)) === 'refused');
  ok('an invoice line pointing at an order line that does not exist', (await tryRaw(`UPDATE "InvoiceLine" SET "orderLineId" = 'no-such-line' WHERE "invoiceId"='${invoice.id}'`)) === 'refused');
  ok('deleting a shipment that has been invoiced', (await tryRaw(`DELETE FROM "Shipment" WHERE id='${invoice.shipmentId}'`)) === 'refused');
  ok('a negative unit price on an order line', (await tryRaw(`UPDATE "OrderLine" SET "unitPrice" = -1 WHERE "orderId"='${o.id}'`)) === 'refused');
});
await scenario(G5, 'voiding a counter sale: stock back, credit memo, refund and the void mark all happen together', async (ok) => {
  const each = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'EACH', basePriceCwt: { gt: 0 } } });
  if (!each) return ok('an each-priced product exists', false, 'none in the catalogue');
  // Its own shelf stock: 40 pieces put on the shelf for this scenario.
  const shelfCoil = await prisma.coil.create({ data: { coilNumber: tag('SHELF'), form: 'PLATE', heatId: heat.id, gradeId: heat.gradeId, ownerId: (await coilOf(await received())).ownerId, productId: each.id, locationId: L1.id, netWeightLb: 250, grossWeightLb: 250, createdById: users.admin.id } });
  await prisma.inventory.create({ data: { coilId: shelfCoil.id, locationId: L1.id, qtyOnHand: 40, qtyAvailable: 40, unit: 'EA' } });
  const onShelf = async () => num((await prisma.inventory.aggregate({ where: { locationId: L1.id, unit: { in: ['EA', 'EACH'] }, coil: { productId: each.id } }, _sum: { qtyOnHand: true } }))._sum.qtyOnHand);
  const before = await onShelf();
  const sale = { id: tag('QS'), locationId: L1.id, items: [{ productId: each.id, quantity: 3 }] };
  const priced = await A.post('/api/pos/quick-sale/price', { sale }, 'csr');
  const paid = await A.post('/api/pos/quick-sale/process-payment', { sale, payment: { method: 'CASH', amountTendered: Math.ceil(num(priced.body?.total)) + 1 } }, 'csr');
  ok('sale taken', ok2(paid) && paid.body?.orderId, `${paid.status} ${JSON.stringify(paid.body).slice(0, 200)}`);
  ok('3 taken off the shelf', (await onShelf()) === before - 3, `${before} → ${await onShelf()}`);
  const touched = [...new Set((await prisma.materialMovement.findMany({ where: { orderId: paid.body.orderId } })).map((m) => m.coilId))];
  const both = await Promise.all([A.post(`/api/pos/quick-sale/${sale.id}/void`, { reason: 'QA void' }), A.post(`/api/pos/quick-sale/${sale.id}/void`, { reason: 'QA void' })]);
  ok('voided twice at once: exactly one goes through', both.filter(ok2).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => `${r.status}`).join(','));
  const invs = await invoicesOf(paid.body.orderId);
  const memos = invs.filter((i) => i.kind === 'CREDIT');
  ok('one credit memo for the whole sale', memos.length === 1 && cents(memos[0].totalAmount) === -cents(invs.find((i) => i.kind === 'INVOICE').totalAmount), `${memos.length}`);
  const cash = invs.flatMap((i) => i.payments).filter((p) => p.paymentMethod !== 'CREDIT').reduce((x, p) => x + cents(p.amount), 0);
  ok('money taken nets to zero', cash === 0, cash);
  ok('the shelf is back to where it was, once', (await onShelf()) === before, `${await onShelf()} vs ${before}`);
  ok('each sale movement has exactly one return movement', (await prisma.materialMovement.count({ where: { reasonCode: 'COUNTER_VOID', orderId: paid.body.orderId } })) === (await prisma.materialMovement.count({ where: { reasonCode: 'COUNTER_SALE', orderId: paid.body.orderId } })) && touched.length > 0);
  ok('the order is marked voided once', ((await prisma.order.findUnique({ where: { id: paid.body.orderId } })).notes.match(/VOIDED/g) || []).length === 1);
  for (const c of touched) await books(ok, c, 'shelf item');
});

await scenario(G5, 'a credit that fails part-way saves nothing: no memo, no refund, and the step before it is undone', async (ok) => {
  // The void of a counter sale runs as steps inside the credit's transaction. Here the last
  // step is made to fail, the way a lost connection or a refused refund would.
  const { creditInvoice } = await import('../../src/backend/src/services/billing.js');
  const { invoice, o } = await billedOrder(200, 1.5);
  await A.post(`/api/invoices/${invoice.id}/payments`, { amount: 300, paymentMethod: 'CASH' }, 'csr');
  const [inv0, pay0, log0] = [await prisma.invoice.count(), await prisma.payment.count(), await prisma.auditLog.count({ where: { category: 'FINANCIAL' } })];
  let thrown = null;
  try {
    await creditInvoice(invoice.id, { reason: 'QA forced failure', lines: [{ invoiceLineId: invoice.lines[0].id, quantity: 200 }] }, users.admin.id, {
      before: (tx) => tx.order.update({ where: { id: o.id }, data: { notes: 'MARKED-BY-A-STEP-THAT-MUST-BE-UNDONE' } }),
      after: () => { throw new Error('forced failure after the credit memo was written'); },
    });
  } catch (e) { thrown = e; }
  ok('the failure reaches the caller', /forced failure/.test(String(thrown?.message)), String(thrown?.message).slice(0, 120));
  ok('no credit memo was left behind', (await prisma.invoice.count()) === inv0 && (await prisma.invoice.count({ where: { creditOfInvoiceId: invoice.id } })) === 0);
  ok('no payment or refund row was left behind', (await prisma.payment.count()) === pay0);
  ok('no financial history line was left behind', (await prisma.auditLog.count({ where: { category: 'FINANCIAL' } })) === log0);
  ok('the earlier step was undone with it', (await prisma.order.findUnique({ where: { id: o.id } })).notes !== 'MARKED-BY-A-STEP-THAT-MUST-BE-UNDONE');
  const row = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  ok('the invoice is exactly as it was: paid 300.00', cents(row.paidAmount) === 30000 && row.status === 'PAID', `${row.paidAmount} ${row.status}`);
  const again = await A.post(`/api/invoices/${invoice.id}/credit`, { reason: 'QA after the failure', lines: [{ invoiceLineId: invoice.lines[0].id, quantity: 200 }] });
  ok('and the same credit then goes through normally', again.status === 201, `${again.status} ${JSON.stringify(again.body).slice(0, 120)}`);
});

// ══ 6. Simultaneous requests, repeats and failure recovery ═══════════════════════════════
const G6 = 'Concurrency, retries and failure recovery';
await scenario(G6, 'two orders reserving the last of one item at once: exactly one gets it', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const [o1, o2] = [(await order([line(1000)])).body, (await order([line(1000)])).body];
  const both = await Promise.all([reserve(o1, o1.lines[0], id, 1000), reserve(o2, o2.lines[0], id, 1000)]);
  ok('one 201, one 409', both.filter((r) => r.status === 201).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join(','));
  const inv = await invOf(id);
  ok('1000 reserved, 0 available, never oversold', num(inv.qtyAllocated) === 1000 && num(inv.qtyAvailable) === 0);
  await books(ok, id);
});
await scenario(G6, 'eight reservations at once against one item never reserve more than it holds', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const orders = []; for (let i = 0; i < 8; i++) orders.push((await order([line(300)])).body);
  const all = await Promise.all(orders.map((o) => reserve(o, o.lines[0], id, 300)));
  const won = all.filter((r) => r.status === 201).length;
  ok('exactly three of eight succeed (3 x 300 fits in 1000)', won === 3 && all.every((r) => [201, 409].includes(r.status)), all.map((r) => r.status).join(','));
  const inv = await invOf(id);
  ok('900 reserved, 100 available', num(inv.qtyAllocated) === 900 && num(inv.qtyAvailable) === 100, JSON.stringify(inv));
  await books(ok, id);
});
await scenario(G6, 'one order line reserved from two items at once is never reserved beyond what it needs', async (ok) => {
  let over = 0;
  for (let round = 0; round < 6; round++) {
    const [a, b] = [await received({ weightLb: 2000 }), await received({ weightLb: 2000 })];
    const o = (await order([line(1000)])).body;
    const both = await Promise.all([reserve(o, o.lines[0], a, 700), reserve(o, o.lines[0], b, 700)]);
    const held = num((await prisma.orderLineAllocation.aggregate({ where: { orderLineId: o.lines[0].id }, _sum: { qtyAllocated: true } }))._sum.qtyAllocated);
    if (held > 1000 + 1e-6 || both.filter((r) => r.status === 201).length !== 1) over++;
    await books(ok, a); await books(ok, b);
  }
  ok('in 6 rounds the line never held more than its 1000', over === 0, `${over} round(s) over-reserved`);
});
await scenario(G6, 'cancelling an order while stock is being reserved for it leaves no reservation behind', async (ok) => {
  let left = 0;
  for (let round = 0; round < 6; round++) {
    const id = await received({ weightLb: 1000 });
    const o = (await order([line(500)])).body;
    await Promise.all([reserve(o, o.lines[0], id, 500), A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' })]);
    const od = await prisma.order.findUnique({ where: { id: o.id } });
    const held = await prisma.orderLineAllocation.count({ where: { orderLine: { orderId: o.id } } });
    const inv = await invOf(id);
    if (od.status === 'CANCELLED' && (held > 0 || num(inv.qtyAllocated) > 0)) left++;
    await books(ok, id);
  }
  ok('in 6 rounds a cancelled order never kept a reservation', left === 0, `${left} round(s) left stock reserved for a cancelled order`);
});
await scenario(G6, 'two people changing one order at once: one wins and the other is told', async (ok) => {
  const o = (await order([line(100)], { status: 'DRAFT' })).body;
  const both = await Promise.all([A.put(`/api/orders/${o.id}`, { status: 'CONFIRMED' }), A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' })]);
  ok('one 200 and one 409', both.filter(ok2).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join(','));
  const row = await prisma.order.findUnique({ where: { id: o.id } });
  ok('the saved status is the winner\'s', row.status === (ok2(both[0]) ? 'CONFIRMED' : 'CANCELLED'), row.status);
  ok('one move in the history, the winner\'s', (await prisma.auditLog.count({ where: { eventType: 'ORDER_STATUS_CHANGED', resourceId: o.id } })) === 1);
});
await scenario(G6, 'the same order sent three times at once with one request key is saved once', async (ok) => {
  const key = `qa-${run}-${tag('K')}`; const po = tag('PO');
  const body = { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 65, taxAmount: 0, freightAmount: 0, totalAmount: 65, poReference: po, lines: [line(100)] };
  const all = await Promise.all([1, 2, 3].map(() => raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': key })));
  ok('every copy is answered with 201 or "still being processed" (409)', all.every((r) => [201, 409].includes(r.status)) && all.some((r) => r.status === 201), all.map((r) => r.status).join(','));
  ok('exactly one order exists', (await prisma.order.count({ where: { poReference: po } })) === 1, await prisma.order.count({ where: { poReference: po } }));
  const later = await raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': key });
  const first = all.find((r) => r.status === 201 && !r.replayed) || all.find((r) => r.status === 201);
  ok('a retry afterwards gets the first answer back, marked as a replay', later.status === 201 && later.replayed && later.body?.id === first.body.id && later.body?.orderNumber === first.body.orderNumber, `${later.status} ${later.replayed} ${later.body?.id}`);
  ok('still one order', (await prisma.order.count({ where: { poReference: po } })) === 1);
});
await scenario(G6, 'request keys: a different body is refused, another user is separate, and a refused request can be corrected and sent again', async (ok) => {
  const key = `qa-${run}-${tag('K')}`; const po = tag('PO');
  const body = { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 65, totalAmount: 65, poReference: po, lines: [line(100)] };
  const first = await raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': key });
  ok('first accepted', first.status === 201, first.status);
  const changed = await raw('POST', '/api/orders', { ...body, poReference: `${po}-X` }, 'csr', { 'Idempotency-Key': key });
  ok('same key with a different body is refused with 422', changed.status === 422, changed.status);
  ok('and saved nothing', (await prisma.order.count({ where: { poReference: `${po}-X` } })) === 0);
  const otherUser = await raw('POST', '/api/orders', { ...body, poReference: `${po}-B` }, 'branchA', { 'Idempotency-Key': key });
  ok('the same key from another user is that user\'s own request', otherUser.status === 201 && !otherUser.replayed, `${otherUser.status}`);
  const key2 = `qa-${run}-${tag('K')}`;
  const bad = await raw('POST', '/api/orders', { ...body, poReference: `${po}-C`, lines: [line(0)] }, 'csr', { 'Idempotency-Key': key2 });
  ok('a refused request is answered 4xx', bad.status >= 400 && bad.status < 500, bad.status);
  const again = await raw('POST', '/api/orders', { ...body, poReference: `${po}-C`, lines: [line(0)] }, 'csr', { 'Idempotency-Key': key2 });
  ok('the refusal was not stored: the same request is judged again', again.status === bad.status && !again.replayed, `${again.status} ${again.replayed}`);
  ok('no key is left on file for the refused request', (await prisma.requestKey.count({ where: { key: key2 } })) === 0);
  const tooShort = await raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': 'abc' });
  ok('a key that is too short is refused with 400', tooShort.status === 400, tooShort.status);
  const noKey = await A.post('/api/orders', { ...body, poReference: `${po}-D` }, 'csr');
  ok('a request with no key behaves as before', noKey.status === 201, noKey.status);
});
await scenario(G6, 'a key claimed by a request that never finished is taken over after a minute, not blocked for ever', async (ok) => {
  const key = `qa-${run}-${tag('K')}`; const po = tag('PO');
  const body = { orderType: 'SO', buyerId: customer.id, status: 'DRAFT', subtotal: 65, totalAmount: 65, poReference: po, lines: [line(100)] };
  const { bodyHashOf } = await import('../../src/backend/src/middleware/requestKeys.js');
  const scope = `${users.csr.id} POST /api/orders`;
  await prisma.requestKey.create({ data: { scope, key, bodyHash: bodyHashOf(body), status: 'IN_PROGRESS', createdAt: new Date(Date.now() - 5000) } });
  const fresh = await raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': key });
  ok('while the first is recent the repeat is told to wait (409)', fresh.status === 409, fresh.status);
  ok('nothing was saved', (await prisma.order.count({ where: { poReference: po } })) === 0);
  await prisma.requestKey.updateMany({ where: { scope, key }, data: { createdAt: new Date(Date.now() - 120000) } });
  const stale = await raw('POST', '/api/orders', body, 'csr', { 'Idempotency-Key': key });
  ok('after it has gone stale the request runs', stale.status === 201, `${stale.status} ${JSON.stringify(stale.body).slice(0, 120)}`);
  ok('one order', (await prisma.order.count({ where: { poReference: po } })) === 1);
});
await scenario(G6, 'one shipment dispatched four times at once leaves the shelf once and is billed once', async (ok) => {
  const id = await received({ weightLb: 2000 });
  const o = (await order([line(800, 1.5)])).body;
  await reserve(o, o.lines[0], id, 800);
  const s = await shipment(o, L1, [[o.lines[0], 800]]);
  const all = await Promise.all([1, 2, 3, 4].map(() => dispatch(s.body)));
  ok('one accepted, three refused', all.filter(ok2).length === 1 && all.filter((r) => r.status === 409).length === 3, all.map((r) => r.status).join(','));
  ok('1200 on hand; one SHIP movement', num((await invOf(id)).qtyOnHand) === 1200 && (await movesOf(id, 'SHIP')).length === 1);
  const more = await Promise.all([1, 2, 3].map(() => A.post('/api/invoices', { shipmentId: s.body.id }, 'csr')));
  const invs = (await invoicesOf(o.id)).filter((i) => i.kind === 'INVOICE');
  ok('one invoice for 1200.00, however many times it is asked for', invs.length === 1 && cents(invs[0].totalAmount) === 120000, `${invs.length} invoices; asks answered ${more.map((r) => r.status).join(',')}`);
  await books(ok, id);
});
await scenario(G6, 'five payments at once on one invoice: the balance is taken once', async (ok) => {
  const { invoice } = await billedOrder(300, 2); // 600.00
  const all = await Promise.all([1, 2, 3, 4, 5].map(() => A.post(`/api/invoices/${invoice.id}/payments`, { amount: 600, paymentMethod: 'CHECK' }, 'csr')));
  ok('one accepted, four refused', all.filter(ok2).length === 1 && all.filter((r) => r.status === 409).length === 4, all.map((r) => r.status).join(','));
  const row = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
  ok('paid 600.00 with one payment row', cents(row.paidAmount) === 60000 && row.payments.length === 1, `${row.paidAmount} ${row.payments.length}`);
});
await scenario(G6, 'three part payments at once that together fit: all are taken and the total is exact', async (ok) => {
  const { invoice } = await billedOrder(300, 2); // 600.00
  const all = await Promise.all([200.1, 199.95, 199.95].map((amount) => A.post(`/api/invoices/${invoice.id}/payments`, { amount, paymentMethod: 'CHECK' }, 'csr')));
  ok('all three accepted', all.every(ok2), all.map((r) => r.status).join(','));
  const row = await prisma.invoice.findUnique({ where: { id: invoice.id }, include: { payments: true } });
  ok('paid exactly 600.00 from three rows; no update was lost', cents(row.paidAmount) === 60000 && row.payments.length === 3 && row.status === 'PAID', `${row.paidAmount} ${row.payments.length} ${row.status}`);
});
await scenario(G6, 'stock received while reservations are being made: neither is lost', async (ok) => {
  const id = await received({ weightLb: 1000 });
  const orders = []; for (let i = 0; i < 3; i++) orders.push((await order([line(200)])).body);
  const all = await Promise.all([
    ...orders.map((o) => reserve(o, o.lines[0], id, 200)),
    A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: 500 }),
    A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: 250 }),
  ]);
  ok('all five accepted', all.every(ok2), all.map((r) => r.status).join(','));
  const inv = await invOf(id);
  ok('1750 on hand, 600 reserved, 1150 available', num(inv.qtyOnHand) === 1750 && num(inv.qtyAllocated) === 600 && num(inv.qtyAvailable) === 1150, JSON.stringify(inv));
  await books(ok, id);
});
await scenario(G6, 'the same item number received five times at once becomes one item', async (ok) => {
  const body = receiptBody({ weightLb: 777 });
  const all = await Promise.all([1, 2, 3, 4, 5].map(() => A.post('/api/inventory/receipts', body)));
  ok('one 201 and four 409', all.filter((r) => r.status === 201).length === 1 && all.filter((r) => r.status === 409).length === 4, all.map((r) => r.status).join(','));
  const coil = await prisma.coil.findUnique({ where: { coilNumber: body.coilNumber } });
  ok('one item, 777 on hand, one movement', num((await invOf(coil.id)).qtyOnHand) === 777 && (await movesOf(coil.id)).length === 1);
});
await scenario(G6, 'two managers changing one list price at once: one price stands and both changes are on record', async (ok) => {
  const p = await prisma.product.findFirst({ where: { isActive: true, priceUnit: 'CWT' }, orderBy: { sku: 'desc' } });
  const before = num(p.basePriceCwt);
  const t0 = new Date();
  const both = await Promise.all([A.put(`/api/products/${p.id}`, { basePriceCwt: before + 1.11 }), A.put(`/api/products/${p.id}`, { basePriceCwt: before + 2.22 })]);
  ok('both answered without a server error', both.every((r) => r.status < 500), both.map((r) => r.status).join(','));
  const now = num((await prisma.product.findUnique({ where: { id: p.id } })).basePriceCwt);
  ok('the saved price is one of the two, not a mixture', [before + 1.11, before + 2.22].some((v) => Math.abs(v - now) < 1e-9), `${now}`);
  const logs = await prisma.auditLog.findMany({ where: { resourceType: 'Product', resourceId: p.id, timestamp: { gte: t0 } } });
  ok('each accepted change left a history line', logs.length === both.filter(ok2).length, `${logs.length} lines for ${both.filter(ok2).length} accepted`);
  await A.put(`/api/products/${p.id}`, { basePriceCwt: before });
});
await scenario(G6, 'a return received four times at once is counted once and credited once', async (ok) => {
  const { o, coilId } = await billedOrder(400, 1.25);
  const s = await prisma.shipment.findFirst({ where: { orderId: o.id } }); await deliver(s);
  const ret = await A.post('/api/returns', { orderId: o.id, reason: 'QA phase 3', lines: [{ orderLineId: o.lines[0].id, quantity: 150, disposition: 'RESTOCK' }] }, 'csr');
  ok('return authorised', ret.status === 201, `${ret.status} ${JSON.stringify(ret.body).slice(0, 200)}`);
  const before = num((await invOf(coilId)).qtyOnHand);
  const all = await Promise.all([1, 2, 3, 4].map(() => A.post(`/api/returns/${ret.body.id}/receive`, {}, 'shipping')));
  ok('one accepted, three refused', all.filter(ok2).length === 1 && all.filter((r) => r.status === 409).length === 3, all.map((r) => r.status).join(','));
  ok('150 back on hand, once', num((await invOf(coilId)).qtyOnHand) === before + 150, `${before} → ${(await invOf(coilId)).qtyOnHand}`);
  ok('one return movement tied to the return', (await prisma.materialMovement.count({ where: { coilId, reasonCode: 'CUSTOMER_RETURN', orderId: ret.body.id } })) === 1);
  const memos = (await invoicesOf(o.id)).filter((i) => i.kind === 'CREDIT');
  ok('one credit memo for 187.50', memos.length === 1 && cents(memos[0].totalAmount) === -18750, `${memos.length} ${memos[0]?.totalAmount}`);
  await books(ok, coilId);
});
await scenario(G6, 'two work orders raised on one item at once each get their own number and nothing is lost', async (ok) => {
  const id = await received({ weightLb: 4000 });
  const both = await Promise.all([workOrder(id), workOrder(id)]);
  ok('answered without a server error', both.every((r) => r.status < 500), both.map((r) => r.status).join(','));
  const rows = await prisma.workOrder.findMany({ where: { sourceCoilId: id } });
  ok('every accepted work order is saved once with its own number', rows.length === both.filter((r) => r.status === 201).length && new Set(rows.map((r) => r.woNumber)).size === rows.length, rows.map((r) => r.woNumber).join(','));
  ok('each has its creation in the history', (await prisma.auditLog.count({ where: { resourceType: 'WorkOrder', resourceId: { in: rows.map((r) => r.id) }, eventType: 'WORK_ORDER_CREATED' } })) === rows.length);
  const inv = await invOf(id);
  ok('the item balance is unchanged', num(inv.qtyOnHand) === 4000 && num(inv.qtyAvailable) === 4000);
  notes.push(`Two work orders on one item: ${rows.length} open work orders now name the same 4000 lb item as their source, each with 4000 lb as input. The application does not claim an item for a work order, because processing moves no stock (M-016). Whether one item may feed several work orders is the owner's rule; recorded as finding G-008.`);
});
await scenario(G6, 'eighty orders entered at the same moment each get their own number, and none is lost', async (ok) => {
  const mark = tag('PO80');
  const all = await Promise.all(Array.from({ length: 80 }, (_, i) => A.post('/api/orders', { orderType: 'SO', buyerId: customers[i % customers.length].id, status: 'DRAFT', subtotal: 65, taxAmount: 0, freightAmount: 0, totalAmount: 65, poReference: `${mark}-${i}`, lines: [line(100)] }, i % 2 ? 'csr' : 'branchA')));
  ok('all eighty accepted', all.every((r) => r.status === 201), all.filter((r) => r.status !== 201).map((r) => `${r.status} ${JSON.stringify(r.body).slice(0, 80)}`).slice(0, 3).join(' | '));
  const rows = await prisma.order.findMany({ where: { poReference: { startsWith: `${mark}-` } }, select: { orderNumber: true, _count: { select: { lines: true } } } });
  ok('eighty orders on file with eighty different numbers', rows.length === 80 && new Set(rows.map((r) => r.orderNumber)).size === 80, `${rows.length} rows, ${new Set(rows.map((r) => r.orderNumber)).size} numbers`);
  ok('each has its one line', rows.every((r) => r._count.lines === 1));
});
await scenario(G6, 'the books are in balance at every moment while forty changes run at once', async (ok) => {
  const ids = []; for (let i = 0; i < 4; i++) ids.push(await received({ weightLb: 5000 }));
  const orders = []; for (let i = 0; i < 12; i++) orders.push((await order([line(300)])).body);
  let violations = 0; let samples = 0; let running = true;
  const watcher = (async () => {
    while (running) {
      const bad = num((await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Inventory" i WHERE abs(i."qtyOnHand" - (i."qtyAvailable"+i."qtyAllocated"+i."qtyOnHold")) > 0.0001 OR i."qtyAvailable" < 0 OR abs(i."qtyAllocated" - COALESCE((SELECT sum(a."qtyAllocated") FROM "OrderLineAllocation" a WHERE a."coilId"=i."coilId"),0)) > 0.0001`))[0].n);
      violations += bad; samples++;
    }
  })();
  const work = [];
  orders.forEach((o, i) => work.push(reserve(o, o.lines[0], ids[i % 4], 300)));
  ids.forEach((id) => { work.push(A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: 100 })); work.push(A.post('/api/inventory/receive', { coilId: id, locationId: L1.id, qty: 50 })); });
  orders.slice(0, 6).forEach((o) => work.push(A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' })));
  for (let i = 0; i < 14; i++) work.push(A.get('/api/inventory?limit=20'));
  const all = await Promise.all(work);
  running = false; await watcher;
  ok('no request failed with a server error', all.every((r) => r.status < 500), all.filter((r) => r.status >= 500).length);
  ok(`a reconciliation read taken ${samples} times during the burst never saw the books out of balance`, violations === 0 && samples > 3, `${violations} violations in ${samples} samples`);
  for (const id of ids) await books(ok, id);
});

// ══ results ══════════════════════════════════════════════════════════════════════════════
const groups = {};
for (const s of scenarios) { groups[s.group] ||= { scenarios: 0, passed: 0, checks: 0 }; groups[s.group].scenarios++; groups[s.group].checks += s.asserts.length; if (s.pass) groups[s.group].passed++; }
const failed = scenarios.filter((s) => !s.pass);
const report = { at: new Date().toISOString(), base: BASE, scenarios: scenarios.length, passed: scenarios.length - failed.length, checks: scenarios.reduce((n, s) => n + s.asserts.length, 0), groups, notes, results: scenarios };
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
for (const s of failed) { console.log(`✗ [${s.group}] ${s.name}`); for (const a of s.asserts.filter((x) => !x.ok)) console.log(`    - ${a.what}${a.detail ? ` — ${a.detail}` : ''}`); }
console.log(`${failed.length ? '✗' : '✓'} Phase 3 database scenarios: ${report.passed} of ${report.scenarios} pass, ${report.checks} checks; ${Object.entries(groups).map(([g, v]) => `${g} ${v.passed}/${v.scenarios}`).join('; ')}`);
await prisma.$disconnect();
process.exit(failed.length ? 1 : 0);
