// Phase 6 inventory scenarios: purchasing and the supply position, receiving and putaway,
// reservations and picking, consumption, remnants and scrap, transfers between branches, returns,
// counts and corrections, and the simultaneous requests, branch boundary and failures around them.
// Every scenario drives the real server the way the screens do, then reads the database to check
// what was saved, what was refused, what each stock item's balance and history now say, and that
// nothing was doubled or lost. A success answer alone is never counted as a pass.
//   node qa/sim/phase6-inventory.mjs [--base http://localhost:3011] [--only 1,5]
// Local QA database only (lib.mjs refuses anything else). No purchase order is sent to a supplier.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  arg, prisma, A, run, num, ok2, tag, scenario, http1, raw, world, blocks, finish, QA_PASSWORD,
} from './phase4-lib.mjs';
import { bcrypt } from './lib.mjs';

const OUT = arg('out', 'qa/results/phase6-inventory.json');
const ONLY = arg('only', '').split(',').filter(Boolean);
const want = (n) => !ONLY.length || ONLY.includes(String(n));
const T0 = new Date(Date.now() - 2000);
const EPS = 1e-6;
const near = (a, b, eps = 1e-4) => Math.abs(Number(a) - Number(b)) <= eps;
const psql = (sql) => execFileSync('psql', ['-U', 'postgres', '-h', 'localhost', '-d', new URL(process.env.DATABASE_URL).pathname.slice(1), '-Atc', sql], { env: { ...process.env, PGPASSWORD: 'password' } }).toString();

const w = await world();
const B = blocks(w);
const { L1, L2, heat, users } = w;
const L3 = w.locs.find((l) => l.code === 'QA-L03');
const L4 = w.locs.find((l) => l.code === 'QA-L04');
const house = users.admin.organizationId;

// ── people this phase needs that the QA logins do not include ─────────────────────────
async function login(role, loc, label) {
  const email = `${tag(`qa-p6-${label}`).toLowerCase()}@qa.test`;
  await prisma.user.create({ data: { email, passwordHash: await bcrypt().hash(QA_PASSWORD, 10), firstName: 'QA', lastName: label, role, organizationId: house, homeLocationId: loc.id } });
  const r = await http1('POST', '/api/auth/login', { body: { email, password: QA_PASSWORD } });
  if (!r.body?.token) throw new Error(`login ${label}: ${r.status}`);
  const user = await prisma.user.findUnique({ where: { email } });
  return { user, call: (m, url, body, headers) => http1(m, url, { body, headers, token: r.body.token }) };
}
const buyer = await login('BUYER', L1, 'buyer');
const clerk2 = await login('RECEIVING_CLERK', L2, 'clerk-l2');
const manager2 = await login('BRANCH_MANAGER', L2, 'manager-l2');
const as = (who) => (typeof who === 'string' ? (m, url, body) => A.call(m, url, body, who) : who.call);

// ── building blocks ──────────────────────────────────────────────────────────────
const invOf = (coilId) => prisma.inventory.findUnique({ where: { coilId } });
const coilOf = (id) => prisma.coil.findUnique({ where: { id } });
const movesOf = (coilId, movementType) => prisma.materialMovement.findMany({ where: { coilId, ...(movementType && { movementType }) }, orderBy: { createdAt: 'asc' } });
const activeHolds = (coilId) => prisma.qCHold.findMany({ where: { coilId, status: 'ACTIVE' } });
const received = (over = {}) => B.received(over);
const receipt = (over = {}, who = 'admin') => as(who)('POST', '/api/inventory/receipts', B.receiptBody(over));
const pieceProduct = await prisma.product.findFirst({ where: { isActive: true }, orderBy: { sku: 'asc' } });

/** The balance identity, no negatives, reservations on file, and the item's history adding up to its balance. */
async function books(ok, coilId, label = 'item') {
  const i = await invOf(coilId);
  const parts = num(i.qtyAvailable) + num(i.qtyAllocated) + num(i.qtyOnHold) + num(i.qtyInTransit);
  ok(`${label}: on hand = available + reserved + on hold + in transit, none below zero`, near(i.qtyOnHand, parts) && [i.qtyOnHand, i.qtyAvailable, i.qtyAllocated, i.qtyOnHold, i.qtyInTransit].every((v) => num(v) >= -EPS), JSON.stringify(i));
  const res = await prisma.orderLineAllocation.aggregate({ where: { coilId }, _sum: { qtyAllocated: true } });
  ok(`${label}: reserved equals the reservations on file`, near(i.qtyAllocated, res._sum.qtyAllocated), `${i.qtyAllocated} vs ${res._sum.qtyAllocated}`);
  const mv = await movesOf(coilId);
  if (mv.some((m) => m.movementType === 'RECEIVE' || m.movementType === 'PROCESS')) {
    let sum = 0;
    for (const m of mv) {
      const q = num(m.qtyMoved);
      if (['RECEIVE', 'PROCESS'].includes(m.movementType)) sum += q;
      else if (['SHIP', 'CONSUME', 'SCRAP'].includes(m.movementType)) sum -= q;
      else if (['ADJUST', 'COUNT'].includes(m.movementType)) sum += m.toLocationId ? q : -q;
    }
    ok(`${label}: its history adds up to its balance`, near(sum, i.qtyOnHand), `history ${sum} vs on hand ${i.qtyOnHand}`);
  }
  return i;
}

const poLine = (qty, over = {}) => ({ gradeId: heat.gradeId, description: `QA P6 plate ${run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: qty, unit: 'LB', unitPrice: 0.5, priceUnit: 'LB', extendedPrice: +(qty * 0.5).toFixed(2), ...over });
async function purchaseOrder(lines, { who = buyer, place = true, supplier = w.supplierOrg, extra = {} } = {}) {
  const subtotal = +lines.reduce((s, l) => s + l.extendedPrice, 0).toFixed(2);
  const r = await as(who)('POST', '/api/purchase-orders', { sellerId: supplier.id, status: 'DRAFT', subtotal, taxAmount: 0, freightAmount: 0, totalAmount: subtotal, lines, ...extra });
  if (r.status !== 201) throw new Error(`purchase order ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  if (place) { const p = await as(who)('PUT', `/api/purchase-orders/${r.body.id}`, { status: 'CONFIRMED' }); if (!ok2(p)) throw new Error(`place ${p.status} ${JSON.stringify(p.body).slice(0, 200)}`); }
  return prisma.order.findUnique({ where: { id: r.body.id }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
}
/** A heat of its own, on file with no certificate, so a line that needs an MTR can be tested. */
async function freshHeat(gradeId = heat.gradeId) {
  const heatNumber = tag('HT');
  await prisma.heat.create({ data: { heatNumber, millId: heat.millId, gradeId, castDate: new Date(), createdById: users.admin.id } });
  return heatNumber;
}

// Transfers: ship, receive, settle, cancel (the same calls the Transfers screen makes).
const ship = (coilIds, to, who = 'admin', extra = {}) => as(who)('POST', '/api/inventory/transfers', { toLocationId: to.id, coilIds, carrier: 'Own truck', ...extra });
const receiveT = (t, body = {}, who = 'admin') => as(who)('POST', `/api/inventory/transfers/${t.id || t}/receive`, body);
const settle = (t, coilId, decision, who = 'admin', notes = 'Checked with the driver and the scale ticket') => as(who)('POST', `/api/inventory/transfers/${t.id || t}/settle`, { coilId, decision, notes });
const cancelT = (t, who = 'admin', reason = 'Truck broke down') => as(who)('POST', `/api/inventory/transfers/${t.id || t}/cancel`, { reason });
const listOf = (b) => (Array.isArray(b) ? b : b?.data || []);
const adjust = (coilId, body, who = 'branchWh') => A.call('POST', '/api/inventory/adjust', { coilId, ...body }, who);
const hold = (coilId, holdType = 'QUALITY', who = 'admin') => A.call('POST', `/api/coils/${coilId}/hold`, { holdType, holdReason: 'QA phase 6 hold' }, who);
const release = (coilId, who = 'admin') => A.call('POST', `/api/coils/${coilId}/release`, { notes: 'QA phase 6 release' }, who);
async function workOrder(coilId, over = {}) {
  const wo = await A.post('/api/work-orders', { woType: 'SLIT', sourceCoilId: coilId, priority: 3, notes: `QA phase 6 ${run}`, ...over });
  return wo;
}
async function startedWorkOrder(coilId, over = {}) {
  const wo = await workOrder(coilId, over);
  if (wo.status !== 201) throw new Error(`work order ${wo.status} ${JSON.stringify(wo.body).slice(0, 200)}`);
  for (const s of ['release', 'start']) await A.put(`/api/work-orders/${wo.body.id}/${s}`, {});
  return wo.body;
}
async function supply(gradeId, loc, who = 'admin') {
  const r = await as(who)('GET', `/api/purchase-orders/supply-position?gradeId=${gradeId}&locationId=${loc.id}`);
  return { status: r.status, row: (r.body?.data || []).find((x) => x.gradeId === gradeId && x.locationId === loc.id) || { onHandLb: 0, availableLb: 0, onOrderLb: 0, inboundTransferLb: 0, inTransitOutLb: 0, unreservedDemandLb: 0, projectedFreeLb: 0 } };
}
/** A shipped sales order line, ready to be returned: stock received, reserved, shipped and dispatched. */
async function shippedOrder(qty = 1000) {
  const r = await B.readyToShip(qty);
  const d = await B.dispatch(r.shipment);
  if (!ok2(d)) throw new Error(`dispatch ${d.status} ${JSON.stringify(d.body).slice(0, 200)}`);
  return r;
}

// ══ 1. Purchasing and replenishment ═════════════════════════════════════════════════════
const G1 = 'Purchasing and replenishment';
if (want(1)) {
  await scenario(G1, 'a buyer places a purchase order at their own branch with the supplier, lines and a server number', async (ok) => {
    const po = await purchaseOrder([poLine(10000), poLine(4000, { thicknessIn: 0.25 })], { place: false });
    ok('saved as a purchase order from the supplier at the buyer\'s branch, as a draft', po.orderType === 'PO' && po.sellerId === w.supplierOrg.id && po.locationId === L1.id && po.status === 'DRAFT', JSON.stringify({ t: po.orderType, s: po.status, l: po.locationId }));
    ok('two lines, numbered, nothing received', po.lines.length === 2 && po.lines.every((l, k) => l.lineNumber === k + 1 && num(l.qtyReceived) === 0 && l.lineStatus === 'OPEN'));
    ok('the server numbered it and recorded who entered it', !!po.orderNumber && po.createdById === buyer.user.id, `${po.orderNumber} ${po.createdById}`);
    const placed = await buyer.call('PUT', `/api/purchase-orders/${po.id}`, { status: 'CONFIRMED' });
    ok('placing it moves it to CONFIRMED', placed.status === 200 && (await prisma.order.findUnique({ where: { id: po.id } })).status === 'CONFIRMED', placed.status);
  });
  await scenario(G1, 'a sales login cannot place a purchase order, and nothing is saved', async (ok) => {
    const before = await prisma.order.count({ where: { orderType: 'PO' } });
    const r = await A.call('POST', '/api/purchase-orders', { sellerId: w.supplierOrg.id, lines: [poLine(1000)], subtotal: 500, totalAmount: 500 }, 'csr');
    ok('refused with 403', r.status === 403, r.status);
    ok('no purchase order saved', (await prisma.order.count({ where: { orderType: 'PO' } })) === before);
  });
  await scenario(G1, 'the purchase order address only ever shows and changes purchase orders', async (ok) => {
    const o = await B.order([B.line(500)]);
    const look = await buyer.call('GET', `/api/purchase-orders/${o.id}`);
    const change = await buyer.call('PUT', `/api/purchase-orders/${o.id}`, { notes: 'not a PO' });
    ok('a sales order is not found through it', look.status === 404 && change.status === 404, `${look.status} ${change.status}`);
    const list = await buyer.call('GET', '/api/purchase-orders?limit=50');
    ok('the list holds purchase orders only', listOf(list.body).length > 0 && listOf(list.body).every((x) => x.orderType === 'PO'), list.status);
    const forced = await purchaseOrder([poLine(100)], { extra: { orderType: 'SO' }, place: false });
    ok('a body that says SO is still saved as a purchase order', forced.orderType === 'PO', forced.orderType);
  });
  await scenario(G1, 'a buyer cannot open another branch\'s purchase order', async (ok) => {
    const other = await purchaseOrder([poLine(2000)], { who: manager2 });
    ok('the other branch\'s order is at that branch', other.locationId === L2.id, other.locationId);
    ok('the L1 buyer gets not found', (await buyer.call('GET', `/api/purchase-orders/${other.id}`)).status === 404);
    ok('and cannot change it', (await buyer.call('PUT', `/api/purchase-orders/${other.id}`, { status: 'CANCELLED' })).status === 404 && (await prisma.order.findUnique({ where: { id: other.id } })).status === 'CONFIRMED');
  });
  await scenario(G1, 'nothing can be received against a draft purchase order', async (ok) => {
    const po = await purchaseOrder([poLine(5000)], { place: false });
    const no = tag('RC');
    const r = await receipt({ coilNumber: no, poLineId: po.lines[0].id, weightLb: 5000 });
    ok('refused with 409', r.status === 409, `${r.status} ${r.body?.error}`);
    ok('no stock item was created and the line is untouched', (await prisma.coil.count({ where: { coilNumber: no } })) === 0 && num((await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } })).qtyReceived) === 0);
  });
  await scenario(G1, 'a receipt against a placed line fills it part way, and the movement names the line', async (ok) => {
    const po = await purchaseOrder([poLine(10000)]);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 4000 });
    ok('accepted with no hold', r.status === 201 && !r.body.hold, `${r.status} ${JSON.stringify(r.body.hold || r.body.error)}`);
    const line = await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } });
    ok('the line shows 4000 received and is PARTIAL', num(line.qtyReceived) === 4000 && line.lineStatus === 'PARTIAL', `${line.qtyReceived} ${line.lineStatus}`);
    const mv = (await movesOf(r.body.item.id, 'RECEIVE'))[0];
    ok('the receipt movement carries the purchase order and the line', mv?.orderId === po.id && mv?.orderLineId === po.lines[0].id && num(mv.qtyMoved) === 4000, JSON.stringify(mv));
    ok('the reply says what is left on the line', r.body.purchaseOrder && near(r.body.purchaseOrder.receivedAfter ?? r.body.purchaseOrder.received, 4000), JSON.stringify(r.body.purchaseOrder));
    await books(ok, r.body.item.id);
  });
  await scenario(G1, 'a second receipt completes the line', async (ok) => {
    const po = await purchaseOrder([poLine(6000)]);
    await receipt({ poLineId: po.lines[0].id, weightLb: 2500 });
    const r2 = await receipt({ poLineId: po.lines[0].id, weightLb: 3500 });
    const line = await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } });
    ok('both receipts accepted, the line is COMPLETE at 6000', r2.status === 201 && num(line.qtyReceived) === 6000 && line.lineStatus === 'COMPLETE', `${r2.status} ${line.qtyReceived} ${line.lineStatus}`);
    ok('two receipt movements against the line add up to 6000', near((await prisma.materialMovement.aggregate({ where: { orderLineId: line.id, movementType: 'RECEIVE' }, _sum: { qtyMoved: true } }))._sum.qtyMoved, 6000));
  });
  await scenario(G1, 'receiving more than was ordered puts the material on hold for a decision instead of refusing the truck', async (ok) => {
    const po = await purchaseOrder([poLine(3000)]);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 3600 });
    ok('received, with a hold that names the over-receipt', r.status === 201 && r.body.hold && /more|over/i.test(r.body.hold.holdReason), `${r.status} ${JSON.stringify(r.body.hold)}`);
    const i = await invOf(r.body.item.id);
    ok('all 3600 is on hold and none is on sale', num(i.qtyOnHold) === 3600 && num(i.qtyAvailable) === 0, JSON.stringify(i));
    ok('the hold is a dispute', (await activeHolds(r.body.item.id))[0]?.holdType === 'DISPUTE');
    ok('the line counts what actually came: 3600', num((await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } })).qtyReceived) === 3600);
    await books(ok, r.body.item.id);
  });
  await scenario(G1, 'a receipt of the wrong grade or size against a line is held with every reason', async (ok) => {
    const other = await prisma.grade.findFirst({ where: { id: { not: heat.gradeId } } });
    const po = await purchaseOrder([poLine(5000, { gradeId: other.id })]);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 5000, thicknessIn: 0.625 });
    ok('received on hold', r.status === 201 && !!r.body.hold, `${r.status} ${r.body?.error}`);
    ok('the hold names the grade and the thickness', /grade/i.test(r.body.hold?.holdReason) && /thick/i.test(r.body.hold?.holdReason), r.body.hold?.holdReason);
    ok('the material is off sale', num((await invOf(r.body.item.id)).qtyAvailable) === 0);
  });
  await scenario(G1, 'a line that needs a mill certificate holds material whose heat has none on file', async (ok) => {
    const po = await purchaseOrder([poLine(4000, { certRequirements: ['MTR'] })]);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 4000, heatNumber: await freshHeat() });
    ok('received on a pending-test hold', r.status === 201 && (await activeHolds(r.body.item.id))[0]?.holdType === 'PENDING_TEST', `${r.status} ${JSON.stringify(r.body.hold)}`);
    ok('the reason says the certificate is missing', /certificate|MTR/i.test(r.body.hold?.holdReason || ''), r.body.hold?.holdReason);
    const rel = await release(r.body.item.id, 'branchWh');
    ok('once the certificate is checked a manager releases it and it goes on sale', rel.status === 200 && num((await invOf(r.body.item.id)).qtyAvailable) === 4000, rel.status);
  });
  await scenario(G1, 'a line bought by the hundredweight counts a 5000 lb receipt as 50 CWT', async (ok) => {
    const po = await purchaseOrder([poLine(120, { unit: 'CWT', priceUnit: 'CWT', unitPrice: 45, extendedPrice: 5400 })]);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 5000 });
    const line = await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } });
    ok('received; the line shows 50 CWT and is PARTIAL', r.status === 201 && num(line.qtyReceived) === 50 && line.lineStatus === 'PARTIAL', `${r.status} ${line.qtyReceived}`);
    ok('the stock is counted in pounds: 5000 LB', (await invOf(r.body.item.id)).unit === 'LB' && num((await invOf(r.body.item.id)).qtyOnHand) === 5000);
  });
  await scenario(G1, 'a purchase order with receipts cannot be cancelled; it is closed, and then takes no more', async (ok) => {
    const po = await purchaseOrder([poLine(8000), poLine(2000, { thicknessIn: 0.25 })]);
    await receipt({ poLineId: po.lines[0].id, weightLb: 7000 });
    const cancel = await buyer.call('PUT', `/api/purchase-orders/${po.id}`, { status: 'CANCELLED' });
    ok('cancelling is refused with 409', cancel.status === 409 && (await prisma.order.findUnique({ where: { id: po.id } })).status !== 'CANCELLED', cancel.status);
    const close = await buyer.call('PUT', `/api/purchase-orders/${po.id}`, { status: 'COMPLETE' });
    const after = await prisma.order.findUnique({ where: { id: po.id }, include: { lines: true } });
    ok('closing marks the order and every open line COMPLETE', close.status === 200 && after.status === 'COMPLETE' && after.lines.every((l) => l.lineStatus === 'COMPLETE'), `${close.status} ${after.status}`);
    ok('the close is in the audit trail with who did it', (await prisma.auditLog.count({ where: { resourceId: po.id, eventType: 'ORDER_STATUS_CHANGED', userId: buyer.user.id } })) >= 1);
    const late = await receipt({ poLineId: po.lines[1].id, weightLb: 2000 });
    ok('a receipt after closing is refused', late.status === 409, late.status);
  });
  await scenario(G1, 'a purchase order with nothing received can be cancelled, and then takes nothing', async (ok) => {
    const po = await purchaseOrder([poLine(3000)]);
    const c = await buyer.call('PUT', `/api/purchase-orders/${po.id}`, { status: 'CANCELLED' });
    ok('cancelled', ok2(c) && (await prisma.order.findUnique({ where: { id: po.id } })).status === 'CANCELLED', c.status);
    const no = tag('RC');
    ok('a receipt against it is refused and nothing is created', (await receipt({ coilNumber: no, poLineId: po.lines[0].id })).status === 409 && (await prisma.coil.count({ where: { coilNumber: no } })) === 0);
  });
  await scenario(G1, 'material for another branch\'s purchase order cannot be received here', async (ok) => {
    const po = await purchaseOrder([poLine(3000)], { who: manager2 });
    const no = tag('RC');
    const r = await receipt({ coilNumber: no, poLineId: po.lines[0].id, weightLb: 3000 });
    ok('refused', r.status === 409 || r.status === 404, `${r.status} ${r.body?.error}`);
    ok('nothing created and the line untouched', (await prisma.coil.count({ where: { coilNumber: no } })) === 0 && num((await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } })).qtyReceived) === 0);
  });
  await scenario(G1, 'the supply position shows what is on order and moves it to on hand when it arrives', async (ok) => {
    const grade = await prisma.grade.create({ data: { code: tag('GR'), name: `QA P6 grade ${run}`, family: 'CARBON' } }).catch(() => null);
    const gradeId = grade?.id || heat.gradeId;
    const before = await supply(gradeId, L1, buyer);
    const po = await purchaseOrder([poLine(9000, { gradeId })]);
    const placed = await supply(gradeId, L1, buyer);
    ok('placing the order adds 9000 lb on order', placed.status === 200 && near(placed.row.onOrderLb - before.row.onOrderLb, 9000), JSON.stringify(placed.row));
    const ht = await freshHeat(gradeId);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 4000, heatNumber: ht, gradeCode: grade?.code || heat.grade.code });
    const after = await supply(gradeId, L1, buyer);
    ok('a 4000 lb receipt takes 4000 off on order and adds it on hand', r.status === 201 && near(after.row.onOrderLb - before.row.onOrderLb, 5000) && near(after.row.onHandLb - before.row.onHandLb, 4000), `${r.status} ${r.body?.error || ''} ${JSON.stringify(after.row)}`);
    ok('projected free is available plus on order plus inbound less open demand', near(after.row.projectedFreeLb, after.row.availableLb + after.row.onOrderLb + after.row.inboundTransferLb - after.row.unreservedDemandLb));
  });
  await scenario(G1, 'the supply position keeps to the branch the person works at, and suggests nothing', async (ok) => {
    const mine = await A.call('GET', '/api/purchase-orders/supply-position', undefined, 'branchWh');
    ok('a branch login sees only its own branch', mine.status === 200 && mine.body.data.length > 0 && mine.body.data.every((r) => r.locationId === L1.id), `${mine.status} ${[...new Set((mine.body?.data || []).map((r) => r.branchCode))]}`);
    ok('asking for another branch is not found', (await A.call('GET', `/api/purchase-orders/supply-position?locationId=${L2.id}`, undefined, 'branchWh')).status === 404);
    ok('no reorder suggestion is made: there is no reorder policy on file', !JSON.stringify(mine.body).match(/suggest(ed)?Qty|reorderQty/i) && /nothing is suggested/i.test(mine.body.note), mine.body.note);
  });
}

// ══ 2. Receiving and putaway ═════════════════════════════════════════════════════════
const G2 = 'Receiving and putaway';
if (want(2)) {
  await scenario(G2, 'a receipt creates the item, its balance at the branch and bin, and one movement by the person', async (ok) => {
    const r = await receipt({ weightLb: 4321.5, binLocation: 'A-12-3' });
    ok('accepted', r.status === 201, `${r.status} ${r.body?.error}`);
    const c = await coilOf(r.body.item.id); const i = await invOf(c.id); const mv = await movesOf(c.id);
    ok('item at the branch and bin, with heat and grade', c.locationId === L1.id && c.binLocation === 'A-12-3' && c.heatId === heat.id && c.gradeId === heat.gradeId, JSON.stringify({ l: c.locationId, b: c.binLocation }));
    ok('4321.5 lb on hand and on sale', i.unit === 'LB' && num(i.qtyOnHand) === 4321.5 && num(i.qtyAvailable) === 4321.5);
    ok('one RECEIVE movement into the branch by the person', mv.length === 1 && mv[0].movementType === 'RECEIVE' && mv[0].toLocationId === L1.id && mv[0].createdById === users.admin.id);
    await books(ok, c.id);
  });
  await scenario(G2, 'the same item number cannot be received twice', async (ok) => {
    const no = tag('RC');
    const a = await receipt({ coilNumber: no }); const b = await receipt({ coilNumber: no });
    ok('first accepted, second refused', a.status === 201 && b.status >= 400 && b.status < 500, `${a.status} ${b.status}`);
    ok('one item, one movement', (await prisma.coil.count({ where: { coilNumber: no } })) === 1 && (await movesOf(a.body.item.id)).length === 1);
  });
  await scenario(G2, 'a receipt with no weight, a negative weight or an unknown branch is refused and saves nothing', async (ok) => {
    for (const [why, over] of [['zero weight', { weightLb: 0 }], ['negative weight', { weightLb: -10 }], ['unknown branch', { locationId: undefined, locationCode: 'NOPE-99' }], ['no heat', { heatNumber: undefined }]]) {
      const no = tag('RC');
      const r = await receipt({ coilNumber: no, ...over });
      ok(`${why}: refused with 4xx and nothing saved`, r.status >= 400 && r.status < 500 && (await prisma.coil.count({ where: { coilNumber: no } })) === 0, r.status);
    }
  });
  await scenario(G2, 'a branch login cannot receive into another branch', async (ok) => {
    const no = tag('RC');
    const r = await receipt({ coilNumber: no, locationId: L2.id }, 'branchWh');
    ok('refused', r.status === 403 || r.status === 404, r.status);
    ok('nothing saved', (await prisma.coil.count({ where: { coilNumber: no } })) === 0);
  });
  await scenario(G2, 'a receiving clerk receives at their branch; a sales login cannot receive at all', async (ok) => {
    const r = await receipt({ locationId: L2.id }, clerk2);
    ok('the clerk\'s receipt is accepted at L2 and recorded against the clerk', r.status === 201 && (await movesOf(r.body.item.id))[0]?.createdById === clerk2.user.id, `${r.status} ${r.body?.error}`);
    const no = tag('RC');
    ok('a sales login is refused and nothing is saved', (await receipt({ coilNumber: no }, 'csr')).status === 403 && (await prisma.coil.count({ where: { coilNumber: no } })) === 0);
  });
  await scenario(G2, 'shelf goods are received by the piece against a product, with no heat or grade', async (ok) => {
    const no = tag('PCS');
    const r = await A.post('/api/inventory/receipts', { coilNumber: no, form: 'SUPPLY', pieces: 24, productSku: pieceProduct.sku, locationId: L1.id });
    ok('accepted', r.status === 201, `${r.status} ${r.body?.error}`);
    const c = await prisma.coil.findUnique({ where: { coilNumber: no }, include: { inventory: true } });
    ok('counted as 24 EA, with the product and no heat', c.inventory.unit === 'EA' && num(c.inventory.qtyOnHand) === 24 && c.productId === pieceProduct.id && c.heatId === null, JSON.stringify(c.inventory));
    await books(ok, c.id);
  });
  await scenario(G2, 'shelf goods need a whole number of pieces and a product that is in the catalog', async (ok) => {
    for (const [why, body] of [['no pieces', { productSku: pieceProduct.sku }], ['part of a piece', { productSku: pieceProduct.sku, pieces: 2.5 }], ['no product', { pieces: 5 }], ['a product not in the catalog', { productSku: `NOPE-${run}`, pieces: 5 }]]) {
      const no = tag('PCS');
      const r = await A.post('/api/inventory/receipts', { coilNumber: no, form: 'SUPPLY', locationId: L1.id, ...body });
      ok(`${why}: refused and nothing saved`, r.status >= 400 && r.status < 500 && (await prisma.coil.count({ where: { coilNumber: no } })) === 0, `${r.status} ${r.body?.error}`);
    }
  });
  await scenario(G2, 'metal is received only against a heat on file, and items of one heat join it', async (ok) => {
    const unknown = tag('HT'); const no = tag('RC');
    const r = await receipt({ coilNumber: no, heatNumber: unknown });
    ok('a heat not on file is refused, saying to add it first, and nothing is saved', r.status === 400 && /not on file/i.test(r.body?.error) && (await prisma.coil.count({ where: { coilNumber: no } })) === 0 && (await prisma.heat.count({ where: { heatNumber: unknown } })) === 0, `${r.status} ${r.body?.error}`);
    const ht = await freshHeat();
    const a = await receipt({ heatNumber: ht }); const b = await receipt({ heatNumber: ht });
    const heats = await prisma.heat.findMany({ where: { heatNumber: ht } });
    ok('two receipts on the same heat: one heat, both items on it', a.status === 201 && b.status === 201 && heats.length === 1 && (await prisma.coil.count({ where: { heatId: heats[0].id } })) === 2, `${a.status} ${b.status}`);
    const other = await prisma.grade.findFirst({ where: { id: { not: heat.gradeId } } });
    const clash = await receipt({ heatNumber: ht, gradeCode: other.code });
    ok('an item of another grade on that heat is refused', clash.status >= 400 && clash.status < 500, `${clash.status} ${clash.body?.error}`);
  });
  await scenario(G2, 'a receipt shows in recent receipts for the branch', async (ok) => {
    const r = await receipt();
    const list = await A.call('GET', '/api/inventory/receipts?limit=50', undefined, 'branchWh');
    ok('listed with its item number', list.status === 200 && listOf(list.body).some((x) => x.item?.coilNumber === r.body.item.coilNumber), list.status);
    const r2 = await receipt({ locationId: L2.id });
    ok('another branch\'s receipt is not in this branch\'s list', !listOf((await A.call('GET', '/api/inventory/receipts?limit=200', undefined, 'branchWh')).body).some((x) => x.item?.coilNumber === r2.body.item.coilNumber));
  });
  await scenario(G2, 'an upload says exactly which rows were saved and which were not', async (ok) => {
    const good = tag('UP'); const bad = tag('UP');
    const r = await A.post('/api/inventory/bulk-upload', { templateType: 'coils', items: [
      { tag_number: good, heat_number: heat.heatNumber, grade: heat.grade.code, thickness: 0.5, width: 48, weight_lbs: 3000, location_code: L1.code },
      { tag_number: bad, heat_number: heat.heatNumber, grade: heat.grade.code, thickness: 0.5, width: 48, weight_lbs: -5, location_code: L1.code },
    ] });
    ok('answered', r.status < 500, r.status);
    const saved = await prisma.coil.count({ where: { coilNumber: good } }); const notSaved = await prisma.coil.count({ where: { coilNumber: bad } });
    ok('the good row is saved and the bad one is not', saved === 1 && notSaved === 0, `${saved} ${notSaved}`);
    ok('the answer says one failed', JSON.stringify(r.body).includes(bad) || num(r.body?.failed ?? r.body?.errors?.length) >= 1, JSON.stringify(r.body).slice(0, 200));
  });
  await scenario(G2, 'a receipt out of tolerance against its line is held, and a manager\'s release puts it on sale', async (ok) => {
    const po = await purchaseOrder([poLine(5000, { widthIn: 48, thkTolerancePlus: 0.01, thkToleranceMinus: 0.01 })]);
    const r = await receipt({ poLineId: po.lines[0].id, weightLb: 5000, thicknessIn: 0.53 });
    ok('held because of the thickness', r.status === 201 && /thick/i.test(r.body.hold?.holdReason || ''), `${r.status} ${r.body.hold?.holdReason}`);
    const inTol = await receipt({ poLineId: (await purchaseOrder([poLine(5000, { thkTolerancePlus: 0.01, thkToleranceMinus: 0.01 })])).lines[0].id, weightLb: 5000, thicknessIn: 0.505 });
    ok('within the line\'s tolerance it is not held', inTol.status === 201 && !inTol.body.hold, JSON.stringify(inTol.body.hold));
    const clerkRelease = await release(r.body.item.id, 'csr');
    ok('a sales login cannot release it', clerkRelease.status === 403 && num((await invOf(r.body.item.id)).qtyAvailable) === 0, clerkRelease.status);
    ok('a manager can', (await release(r.body.item.id)).status === 200 && num((await invOf(r.body.item.id)).qtyAvailable) === 5000);
  });
  await scenario(G2, 'putting an item away in a new bin is saved and the item can be found by it', async (ok) => {
    const id = await received({ binLocation: 'R-01' });
    const put = await A.put(`/api/coils/${id}`, { binLocation: 'R-07-2' }, 'branchWh');
    ok('saved', ok2(put) && (await coilOf(id)).binLocation === 'R-07-2', `${put.status} ${put.body?.error}`);
    const found = await A.call('GET', `/api/coils?search=${encodeURIComponent((await coilOf(id)).coilNumber)}`, undefined, 'branchWh');
    ok('the stock list shows the new bin', found.status === 200 && JSON.stringify(found.body).includes('R-07-2'), found.status);
    ok('the balance did not change', num((await invOf(id)).qtyOnHand) === 5000);
  });
  await scenario(G2, 'a piece received against its parent takes its weight from the parent and keeps the heat', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 3000 });
    const r = await A.post('/api/inventory/receipts', { coilNumber: tag('CUT'), form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 20, lengthIn: 40, weightLb: 400, locationId: L1.id });
    ok('accepted', r.status === 201, `${r.status} ${r.body?.error}`);
    const piece = await coilOf(r.body.item.id);
    ok('same heat and grade, parent named', piece.heatId === heat.id && piece.gradeId === heat.gradeId && piece.parentCoilId === parent, JSON.stringify({ h: piece.heatId, p: piece.parentCoilId }));
    ok('parent down by 400', num((await invOf(parent)).qtyOnHand) === 2600);
    await books(ok, parent, 'parent'); await books(ok, piece.id, 'piece');
  });
  await scenario(G2, 'the same item number received twice at the same moment makes one item', async (ok) => {
    const no = tag('RC');
    const rs = await Promise.all([receipt({ coilNumber: no }), receipt({ coilNumber: no }), receipt({ coilNumber: no })]);
    const st = rs.map((r) => r.status).sort();
    ok('one accepted, the others refused with 4xx', st[0] === 201 && st.slice(1).every((x) => x >= 400 && x < 500), st.join());
    const c = await prisma.coil.findMany({ where: { coilNumber: no }, select: { id: true } });
    ok('one item with one receipt movement', c.length === 1 && (await movesOf(c[0].id)).length === 1, c.length);
    if (c[0]) await books(ok, c[0].id);
  });
  await scenario(G2, 'a cost typed on a receipt is ignored; with no purchase order the item has no cost (valuation finding)', async (ok) => {
    const r = await receipt({ weightLb: 2000, unitCost: 0.61 });
    const i = await invOf(r.body.item.id);
    ok('received', r.status === 201);
    ok('no cost was taken from the receipt body', i.unitCost === null && (await coilOf(r.body.item.id)).unitCost == null, JSON.stringify({ i: i.unitCost }));
  });
  await scenario(G2, 'receiving records the cost from the purchase order line (owner decision 9: actual cost per item)', async (ok) => {
    const lb = await purchaseOrder([poLine(4000)]);
    const a = await receipt({ poLineId: lb.lines[0].id, weightLb: 4000, unitCost: 9.99 });
    ok('$0.50 a pound on the order is $0.50 a pound on the item and its stock record; the figure typed on the receipt is ignored', a.status === 201 && near((await coilOf(a.body.item.id)).unitCost, 0.5) && near((await invOf(a.body.item.id)).unitCost, 0.5), `${a.status} ${(await coilOf(a.body.item.id))?.unitCost}`);
    const cwt = await purchaseOrder([poLine(3000, { unitPrice: 48, priceUnit: 'CWT', extendedPrice: 1440 })]);
    const b = await receipt({ poLineId: cwt.lines[0].id, weightLb: 3000 });
    ok('$48.00 per hundredweight is $0.48 a pound', b.status === 201 && near((await coilOf(b.body.item.id)).unitCost, 0.48), `${b.status} ${(await coilOf(b.body.item.id))?.unitCost}`);
    const ton = await purchaseOrder([poLine(2000, { unitPrice: 900, priceUnit: 'TON', extendedPrice: 900 })]);
    const c = await receipt({ poLineId: ton.lines[0].id, weightLb: 2000 });
    ok('$900.00 a ton is $0.45 a pound', c.status === 201 && near((await coilOf(c.body.item.id)).unitCost, 0.45), `${c.status} ${(await coilOf(c.body.item.id))?.unitCost}`);
    const ft = await purchaseOrder([poLine(1000, { unitPrice: 12, priceUnit: 'LF', extendedPrice: 1200 })]);
    const d = await receipt({ poLineId: ft.lines[0].id, weightLb: 1000 });
    ok('a price per foot says nothing about a pound: the item is received with no cost rather than a wrong one', d.status === 201 && (await coilOf(d.body.item.id)).unitCost === null, `${d.status} ${JSON.stringify(d.body).slice(0, 120)}`);
    ok('landed cost is not worked out', (await coilOf(a.body.item.id)).landedCost === null);
    await books(ok, a.body.item.id, 'item');
  });
}

// ══ 3. Reservations, allocation and picking ════════════════════════════════════════════
const G3 = 'Reservations, allocation and picking';
if (want(3)) {
  await scenario(G3, 'stock that fits the line is reserved: the reservation is on file and the balance moves', async (ok) => {
    const id = await received({ weightLb: 3000 });
    const o = await B.order([B.line(1200)]);
    const r = await B.reserve(o, o.lines[0], id, 1200);
    ok('accepted', r.status === 201, `${r.status} ${r.body?.error}`);
    const i = await invOf(id);
    ok('1200 reserved, 1800 free, 3000 on hand', num(i.qtyAllocated) === 1200 && num(i.qtyAvailable) === 1800 && num(i.qtyOnHand) === 3000);
    await books(ok, id);
  });
  await scenario(G3, 'more than is free cannot be reserved', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const o = await B.order([B.line(1500)]);
    const r = await B.reserve(o, o.lines[0], id, 1500);
    ok('refused with 409', r.status === 409, r.status);
    ok('nothing reserved', num((await invOf(id)).qtyAllocated) === 0 && (await prisma.orderLineAllocation.count({ where: { coilId: id } })) === 0);
  });
  await scenario(G3, 'a line counted in pieces cannot reserve stock counted in pounds', async (ok) => {
    const id = await received({ weightLb: 3000 });
    const o = await B.order([B.line(3, 40, { unit: 'EA', priceUnit: 'EACH', extendedPrice: 120 })]);
    const r = await B.reserve(o, o.lines[0], id, 3);
    ok('refused with the unit reason', r.status === 409 && r.body?.code === 'UNIT_MISMATCH', `${r.status} ${r.body?.code}`);
    ok('3 lb were not taken', num((await invOf(id)).qtyAvailable) === 3000);
  });
  await scenario(G3, 'stock of another grade cannot be reserved for a line', async (ok) => {
    const id = await received({ weightLb: 3000 });
    const other = await prisma.grade.findFirst({ where: { id: { not: heat.gradeId } } });
    const o = await B.order([B.line(500, 0.65, { gradeId: other.id })]);
    const r = await B.reserve(o, o.lines[0], id, 500);
    ok('refused with the grade reason', r.status === 409 && r.body?.code === 'GRADE_MISMATCH', `${r.status} ${r.body?.code}`);
    ok('nothing reserved', num((await invOf(id)).qtyAllocated) === 0);
  });
  await scenario(G3, 'a piece smaller than the line needs cannot be reserved for it', async (ok) => {
    const id = await received({ weightLb: 3000, widthIn: 30, lengthIn: 60 });
    const o = await B.order([B.line(500, 0.65, { widthIn: 36, lengthIn: 48 })]);
    const r = await B.reserve(o, o.lines[0], id, 500);
    ok('refused with the size reason', r.status === 409 && r.body?.code === 'SIZE_MISMATCH', `${r.status} ${r.body?.code}`);
    const o2 = await B.order([B.line(500, 0.65, { widthIn: 24, lengthIn: 48 })]);
    ok('a line it can be cut to may reserve it', (await B.reserve(o2, o2.lines[0], id, 500)).status === 201);
  });
  await scenario(G3, 'thickness is held to the line\'s own tolerance', async (ok) => {
    const id = await received({ weightLb: 3000, thicknessIn: 0.48 });
    const tight = await B.order([B.line(500, 0.65, { thkTolerancePlus: 0.01, thkToleranceMinus: 0.01 })]);
    ok('outside the tolerance: refused', (await B.reserve(tight, tight.lines[0], id, 500)).body?.code === 'SIZE_MISMATCH');
    const loose = await B.order([B.line(500, 0.65, { thkTolerancePlus: 0.03, thkToleranceMinus: 0.03 })]);
    ok('inside the tolerance: reserved', (await B.reserve(loose, loose.lines[0], id, 500)).status === 201);
  });
  await scenario(G3, 'material a customer owns can be reserved only for that customer', async (ok) => {
    const id = await received({ weightLb: 3000 });
    await prisma.coil.update({ where: { id }, data: { ownerId: w.custB.id } });
    const forA = await B.order([B.line(500)], { customer: w.custA });
    const r = await B.reserve(forA, forA.lines[0], id, 500);
    ok('refused for another customer with the owner reason', r.status === 409 && r.body?.code === 'OWNER_MISMATCH', `${r.status} ${r.body?.code}`);
    const forB = await B.order([B.line(500)], { customer: w.custB });
    ok('reserved for its owner', (await B.reserve(forB, forB.lines[0], id, 500)).status === 201);
    await books(ok, id);
  });
  await scenario(G3, 'stock on its way to another branch cannot be reserved', async (ok) => {
    const id = await received({ weightLb: 2000 });
    const t = await ship([id], L2);
    const o = await B.order([B.line(500)]);
    const r = await B.reserve(o, o.lines[0], id, 500);
    ok('refused with the in-transit reason', t.status === 201 && r.status === 409 && r.body?.code === 'IN_TRANSIT', `${t.status} ${r.status} ${r.body?.code}`);
    await cancelT(t.body);
    await books(ok, id);
  });
  await scenario(G3, 'stock on hold cannot be reserved until it is released', async (ok) => {
    const id = await received({ weightLb: 2000 });
    await hold(id);
    const o = await B.order([B.line(500)]);
    const r = await B.reserve(o, o.lines[0], id, 500);
    ok('refused', r.status === 409, r.status);
    await release(id);
    ok('reserved once released', (await B.reserve(o, o.lines[0], id, 500)).status === 201);
    await books(ok, id);
  });
  await scenario(G3, 'two reservations racing for the last of an item: exactly one wins', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const a = await B.order([B.line(800)]); const b = await B.order([B.line(800)]);
    const both = await Promise.all([B.reserve(a, a.lines[0], id, 800), B.reserve(b, b.lines[0], id, 800)]);
    ok('one 201 and one 409', both.filter((r) => r.status === 201).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join());
    ok('800 reserved, 200 free', num((await invOf(id)).qtyAllocated) === 800 && num((await invOf(id)).qtyAvailable) === 200);
    await books(ok, id);
  });
  await scenario(G3, 'a branch login cannot reserve another branch\'s stock', async (ok) => {
    const id = await received({ weightLb: 2000, locationId: L2.id });
    const o = await B.order([B.line(500)], { who: 'branchA' });
    const r = await B.reserve(o, o.lines[0], id, 500, 'branchA');
    ok('not found', r.status === 404, r.status);
    ok('nothing reserved', num((await invOf(id)).qtyAllocated) === 0);
  });
  await scenario(G3, 'a line cannot reserve more than it still needs', async (ok) => {
    const id = await received({ weightLb: 5000 });
    const o = await B.order([B.line(1000)]);
    await B.reserve(o, o.lines[0], id, 700);
    const r = await B.reserve(o, o.lines[0], id, 400);
    ok('the second reservation is refused', r.status === 409, r.status);
    ok('700 reserved', num((await invOf(id)).qtyAllocated) === 700);
  });
  await scenario(G3, 'shipping reserved stock takes it off the balance with a SHIP movement and uses the reservation', async (ok) => {
    const r = await shippedOrder(1000);
    const i = await invOf(r.coilId);
    ok('500 left on hand, nothing reserved', num(i.qtyOnHand) === 500 && num(i.qtyAllocated) === 0, JSON.stringify(i));
    const mv = await movesOf(r.coilId, 'SHIP');
    ok('one SHIP movement of 1000 against the shipment', mv.length === 1 && num(mv[0].qtyMoved) === 1000 && !!mv[0].shipmentId, JSON.stringify(mv[0]));
    await books(ok, r.coilId);
  });
  await scenario(G3, 'cancelling an order gives its reserved stock back', async (ok) => {
    const id = await received({ weightLb: 2000 });
    const o = await B.order([B.line(900)]);
    await B.reserve(o, o.lines[0], id, 900);
    const c = await A.put(`/api/orders/${o.id}`, { status: 'CANCELLED' });
    ok('cancelled', ok2(c), c.status);
    const i = await invOf(id);
    ok('nothing reserved, all 2000 free, no reservation left on file', num(i.qtyAllocated) === 0 && num(i.qtyAvailable) === 2000 && (await prisma.orderLineAllocation.count({ where: { coilId: id } })) === 0, JSON.stringify(i));
  });
  await scenario(G3, 'a hold on a reserved item keeps the reservation, holds the rest, and stops the shipment', async (ok) => {
    const r = await B.readyToShip(600);
    const h = await hold(r.coilId);
    const i = await invOf(r.coilId);
    ok('600 still reserved, the free 500 on hold', h.status === 201 && num(i.qtyAllocated) === 600 && num(i.qtyOnHold) === 500 && num(i.qtyAvailable) === 0, JSON.stringify(i));
    const d = await B.dispatch(r.shipment);
    ok('the shipment cannot go out while the item is on hold', d.status === 409, `${d.status} ${d.body?.error}`);
    await release(r.coilId);
    ok('released, it ships', ok2(await B.dispatch(r.shipment)));
    await books(ok, r.coilId);
  });
}

// ══ 4. Consumption, remnants and scrap ══════════════════════════════════════════════════
const G4 = 'Consumption, remnants and scrap';
if (want(4)) {
  await scenario(G4, 'a completed work order takes its output and scrap off the source with movements, and works out the yield', async (ok) => {
    const id = await received({ weightLb: 8000 });
    const wo = await startedWorkOrder(id);
    const d = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 7600, scrapWeightLb: 400 });
    ok('completed with 95% yield', d.status === 200 && near(d.body.yieldPct, 95, 0.05), `${d.status} ${d.body?.yieldPct}`);
    ok('source used up', num((await invOf(id)).qtyOnHand) === 0 && (await coilOf(id)).status === 'CONSUMED');
    ok('a SCRAP movement of 400', near((await movesOf(id, 'SCRAP')).reduce((s, m) => s + num(m.qtyMoved), 0), 400));
    await books(ok, id);
  });
  await scenario(G4, 'pieces made by a work order carry the heat, grade and owner of their source', async (ok) => {
    const id = await received({ weightLb: 2000 });
    await prisma.coil.update({ where: { id }, data: { ownerId: w.custA.id } });
    const wo = await startedWorkOrder(id);
    const d = await A.put(`/api/work-orders/${wo.id}/complete`, { scrapWeightLb: 50, outputs: [{ weightLb: 975, widthIn: 24 }, { weightLb: 975, widthIn: 24 }] });
    ok('completed', d.status === 200, `${d.status} ${d.body?.error}`);
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: id } });
    ok('two pieces, each with the source heat, grade and owner', pieces.length === 2 && pieces.every((p) => p.heatId === heat.id && p.gradeId === heat.gradeId && p.ownerId === w.custA.id), pieces.length);
    for (const p of pieces) await books(ok, p.id, p.coilNumber);
  });
  await scenario(G4, 'a remnant entered against its parent keeps the heat and takes its weight off the parent', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 6000 });
    const remNo = tag('REM');
    const r = await A.post('/api/inventory/bulk-upload', { templateType: 'remnants', items: [{ tag_number: remNo, parent_tag: parentNo, thickness: 0.5, width: 12, length: 30, weight_lbs: 51.25, location_code: L1.code }] });
    const rem = await prisma.coil.findUnique({ where: { coilNumber: remNo } });
    ok('saved, with the parent heat and named parent', r.status < 300 && rem?.heatId === heat.id && rem?.parentCoilId === parent, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
    ok('parent and remnant together weigh 6000', near(num((await invOf(parent)).qtyOnHand) + num((await invOf(rem.id)).qtyOnHand), 6000));
    await books(ok, parent, 'parent'); await books(ok, rem.id, 'remnant');
  });
  await scenario(G4, 'a remnant cannot weigh more than what is free on its parent', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 300 });
    const no = tag('REM');
    const r = await A.post('/api/inventory/receipts', { coilNumber: no, form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 10, lengthIn: 10, weightLb: 301, locationId: L1.id });
    ok('refused', r.status >= 400 && r.status < 500, r.status);
    ok('nothing saved and the parent is untouched', (await prisma.coil.count({ where: { coilNumber: no } })) === 0 && num((await invOf(parent)).qtyOnHand) === 300);
  });
  await scenario(G4, 'a remnant cannot be cut from an item on its way to another branch', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 2000 });
    const t = await ship([parent], L2);
    const no = tag('REM');
    const r = await A.post('/api/inventory/receipts', { coilNumber: no, form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 10, lengthIn: 10, weightLb: 100, locationId: L1.id });
    ok('refused with 409', r.status === 409, `${r.status} ${r.body?.error}`);
    ok('nothing saved and the parent still all in transit', (await prisma.coil.count({ where: { coilNumber: no } })) === 0 && num((await invOf(parent)).qtyInTransit) === 2000);
    await cancelT(t.body);
  });
  await scenario(G4, 'a work order cannot be completed on an item on its way to another branch', async (ok) => {
    const id = await received({ weightLb: 2000 });
    const wo = await startedWorkOrder(id);
    const t = await ship([id], L2);
    const d = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 1900, scrapWeightLb: 100 });
    ok('refused with 409', t.status === 201 && d.status === 409, `${t.status} ${d.status} ${d.body?.error}`);
    ok('nothing consumed', num((await invOf(id)).qtyOnHand) === 2000 && (await movesOf(id, 'SCRAP')).length === 0);
    await cancelT(t.body);
    await books(ok, id);
  });
  await scenario(G4, 'a remnant can be reserved for a line it fits and shipped', async (ok) => {
    const parentNo = tag('PAR');
    await received({ coilNumber: parentNo, weightLb: 4000 });
    const r = await A.post('/api/inventory/receipts', { coilNumber: tag('REM'), form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 24, lengthIn: 48, weightLb: 600, locationId: L1.id });
    const o = await B.order([B.line(600, 0.65, { widthIn: 24, lengthIn: 48 })]);
    const rz = await B.reserve(o, o.lines[0], r.body.item.id, 600);
    ok('reserved', rz.status === 201, `${rz.status} ${rz.body?.error}`);
    const s = await B.shipment(o, [[o.lines[0], 600]]);
    const d = await B.dispatch(s.body);
    ok('shipped and used up', ok2(d) && num((await invOf(r.body.item.id)).qtyOnHand) === 0, d.status);
    await books(ok, r.body.item.id, 'remnant');
  });
  await scenario(G4, 'a remnant travels to another branch and keeps its parent and heat', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 4000 });
    const r = await A.post('/api/inventory/receipts', { coilNumber: tag('REM'), form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 24, lengthIn: 30, weightLb: 300, locationId: L1.id });
    const t = await ship([r.body.item.id], L2);
    const got = await receiveT(t.body);
    const rem = await coilOf(r.body.item.id);
    ok('received at L2 with its parent and heat', got.status === 200 && rem.locationId === L2.id && rem.parentCoilId === parent && rem.heatId === heat.id, `${got.status} ${rem.locationId}`);
    await books(ok, rem.id, 'remnant');
  });
  await scenario(G4, 'scrapping a remnant writes a SCRAP movement and uses it up', async (ok) => {
    const parentNo = tag('PAR');
    await received({ coilNumber: parentNo, weightLb: 2000 });
    const r = await A.post('/api/inventory/receipts', { coilNumber: tag('REM'), form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 8, lengthIn: 9, weightLb: 12.5, locationId: L1.id });
    const s = await adjust(r.body.item.id, { reason: 'SCRAP', countedQty: 0, notes: 'Too small to sell, rusted edge' });
    ok('accepted', s.status === 201, `${s.status} ${s.body?.error}`);
    const mv = await movesOf(r.body.item.id, 'SCRAP');
    ok('one SCRAP movement of 12.5 by the inventory manager with the note', mv.length === 1 && num(mv[0].qtyMoved) === 12.5 && mv[0].createdById === users.branchWh.id && /rusted/.test(mv[0].notes));
    ok('nothing left and the item is used up', num((await invOf(r.body.item.id)).qtyOnHand) === 0 && (await coilOf(r.body.item.id)).status === 'CONSUMED', (await coilOf(r.body.item.id)).status);
    await books(ok, r.body.item.id, 'remnant');
  });
  await scenario(G4, 'more cannot come out of a work order than went in', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const wo = await startedWorkOrder(id);
    const r = await A.put(`/api/work-orders/${wo.id}/complete`, { outputWeightLb: 990, scrapWeightLb: 20 });
    ok('refused', r.status === 400 || r.status === 409, r.status);
    ok('the source is untouched', num((await invOf(id)).qtyOnHand) === 1000 && (await movesOf(id, 'SCRAP')).length === 0);
  });
  await scenario(G4, 'scrap needs a note, and only free stock can be scrapped', async (ok) => {
    const id = await received({ weightLb: 1000 });
    ok('no note: refused', (await adjust(id, { reason: 'SCRAP', change: -100 })).status === 400);
    const o = await B.order([B.line(800)]);
    await B.reserve(o, o.lines[0], id, 800);
    const r = await adjust(id, { reason: 'SCRAP', change: -300, notes: 'Water damage on the bottom sheets' });
    ok('scrapping into the reserved part is refused', r.status === 409 && num((await invOf(id)).qtyOnHand) === 1000, `${r.status}`);
    ok('scrapping the free part works', (await adjust(id, { reason: 'SCRAP', change: -200, notes: 'Water damage on the bottom sheets' })).status === 201 && num((await invOf(id)).qtyOnHand) === 800);
    await books(ok, id);
  });
  await scenario(G4, 'a branch login cannot cut a remnant from another branch\'s parent', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 2000, locationId: L2.id });
    const no = tag('REM');
    const r = await A.call('POST', '/api/inventory/receipts', { coilNumber: no, form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 10, lengthIn: 10, weightLb: 100, locationId: L1.id }, 'branchWh');
    ok('refused', r.status >= 400 && r.status < 500, r.status);
    ok('nothing saved and the parent untouched', (await prisma.coil.count({ where: { coilNumber: no } })) === 0 && num((await invOf(parent)).qtyOnHand) === 2000);
  });
  await scenario(G4, 'an item\'s history shows where it came from and what was cut from it', async (ok) => {
    const parentNo = tag('PAR');
    const parent = await received({ coilNumber: parentNo, weightLb: 2000 });
    const r = await A.post('/api/inventory/receipts', { coilNumber: tag('REM'), form: 'PLATE', parentTag: parentNo, thicknessIn: 0.5, widthIn: 10, lengthIn: 10, weightLb: 100, locationId: L1.id });
    const h = await A.get(`/api/coils/${parent}/history`);
    ok('the parent history lists the cut', h.status === 200 && JSON.stringify(h.body).includes(r.body.item.coilNumber), h.status);
    const child = await A.get(`/api/coils/${r.body.item.id}`);
    ok('the piece names its parent', child.status === 200 && (child.body.parentCoilId === parent || child.body.parentCoil?.id === parent), child.status);
  });
  await scenario(G4, 'the Steel Outlet remnant list is separate from stock: reserving there changes no stock balance (finding K-006)', async (ok) => {
    const list = await A.get('/api/remnants?limit=5');
    ok('the outlet list answers', list.status === 200, list.status);
    const first = listOf(list.body)[0] || (list.body?.remnants || [])[0];
    const before = await prisma.inventory.aggregate({ _sum: { qtyAllocated: true, qtyAvailable: true } });
    if (first) {
      const o = await B.order([B.line(10)]);
      await A.post(`/api/remnants/${first.id}/reserve`, { orderId: o.id });
      await A.post(`/api/remnants/${first.id}/release`, {});
    }
    const after = await prisma.inventory.aggregate({ _sum: { qtyAllocated: true, qtyAvailable: true } });
    ok('no stock balance moved: the outlet list is not linked to stock items', near(before._sum.qtyAllocated, after._sum.qtyAllocated) && near(before._sum.qtyAvailable, after._sum.qtyAvailable));
  });
  await scenario(G4, 'consuming reserved stock through a work order for its line keeps the reservation on the pieces', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const o = await B.order([B.line(960)]);
    await B.reserve(o, o.lines[0], id, 960);
    const wo = await startedWorkOrder(id, { lineId: o.lines[0].id, inputWeightLb: 1000 });
    const d = await A.put(`/api/work-orders/${wo.id}/complete`, { scrapWeightLb: 40, outputs: [{ weightLb: 480 }, { weightLb: 480 }] });
    ok('completed', d.status === 200, `${d.status} ${d.body?.error}`);
    const pieces = await prisma.coil.findMany({ where: { parentCoilId: id }, select: { id: true } });
    const res = await prisma.orderLineAllocation.aggregate({ where: { orderLineId: o.lines[0].id }, _sum: { qtyAllocated: true } });
    ok('the line still has 960 reserved, now on the pieces', near(res._sum.qtyAllocated, 960) && (await prisma.orderLineAllocation.count({ where: { coilId: id } })) === 0, `${res._sum.qtyAllocated}`);
    for (const p of pieces) await books(ok, p.id, 'piece');
  });
}

// ══ 5. Transfers between branches ════════════════════════════════════════════════════
const G5 = 'Interbranch transfers';
if (want(5)) {
  await scenario(G5, 'a transfer of three items ships them: numbered, in transit, still at the sender, no movement yet', async (ok) => {
    const ids = [await received({ weightLb: 1000 }), await received({ weightLb: 2000 }), await received({ weightLb: 3000 })];
    const t = await ship(ids, L2, 'branchWh', { reference: 'BOL-77' });
    ok('accepted with a TRF number and three lines', t.status === 201 && /^TRF-/.test(t.body.transferNumber) && t.body.lines.length === 3 && t.body.status === 'SHIPPED', `${t.status} ${t.body?.error}`);
    for (const id of ids) {
      const i = await invOf(id);
      ok(`item ${id.slice(0, 6)}: at L1, all of it in transit, none on sale`, i.locationId === L1.id && i.status === 'IN_TRANSIT' && near(i.qtyInTransit, i.qtyOnHand) && num(i.qtyAvailable) === 0);
      ok('no TRANSFER movement until it is received', (await movesOf(id, 'TRANSFER')).length === 0);
    }
    const row = await prisma.stockTransfer.findUnique({ where: { id: t.body.id } });
    ok('the transfer records who sent it, the carrier and reference', row.createdById === users.branchWh.id && row.carrier === 'Own truck' && row.reference === 'BOL-77');
    ok('the send is in the audit trail', (await prisma.auditLog.count({ where: { resourceId: t.body.id, eventType: 'STOCK_TRANSFER_SHIPPED' } })) === 1);
    await cancelT(t.body, 'branchWh');
  });
  await scenario(G5, 'stock in transit cannot be held, corrected, shipped to a customer or sent again', async (ok) => {
    const id = await received({ weightLb: 1500 });
    const t = await ship([id], L2);
    ok('hold refused', (await hold(id)).status === 409);
    ok('correction refused', (await adjust(id, { reason: 'COUNT', countedQty: 1400, notes: 'Counted on the truck' })).status === 409);
    ok('sending again refused', (await ship([id], L4)).status === 409);
    ok('legacy one-item transfer refused', (await A.post('/api/inventory/transfer', { coilId: id, toLocationId: L4.id })).status === 409);
    const i = await invOf(id);
    ok('the balance is exactly as shipped', num(i.qtyOnHand) === 1500 && num(i.qtyInTransit) === 1500 && num(i.qtyOnHold) === 0);
    await cancelT(t.body);
  });
  await scenario(G5, 'receiving in full moves the items to the other branch, on sale, with one movement each', async (ok) => {
    const ids = [await received({ weightLb: 1200 }), await received({ weightLb: 800 })];
    const t = await ship(ids, L2);
    const r = await receiveT(t.body, {}, clerk2);
    ok('received by the L2 clerk', r.status === 200 && r.body.status === 'RECEIVED' && !r.body.discrepancies, `${r.status} ${r.body?.error}`);
    for (const id of ids) {
      const [c, i, mv] = [await coilOf(id), await invOf(id), await movesOf(id, 'TRANSFER')];
      ok('item and balance at L2, on sale, nothing in transit', c.locationId === L2.id && i.locationId === L2.id && i.status === 'ACTIVE' && near(i.qtyAvailable, i.qtyOnHand) && num(i.qtyInTransit) === 0);
      ok('one TRANSFER movement L1 to L2 of the whole quantity by the clerk', mv.length === 1 && mv[0].fromLocationId === L1.id && mv[0].toLocationId === L2.id && near(mv[0].qtyMoved, i.qtyOnHand) && mv[0].createdById === clerk2.user.id);
    }
    const row = await prisma.stockTransfer.findUnique({ where: { id: t.body.id }, include: { lines: true } });
    ok('the transfer records who received it and when, each line received whole and GOOD', row.receivedById === clerk2.user.id && !!row.receivedAt && row.lines.every((l) => l.condition === 'GOOD' && near(l.qtyReceived, l.qtyShipped)));
  });
  await scenario(G5, 'an item that arrives short is held whole; a manager confirming the shortage takes the missing weight off', async (ok) => {
    const id = await received({ weightLb: 2000 });
    const t = await ship([id], L2);
    const r = await receiveT(t.body, { lines: [{ coilId: id, qtyReceived: 1940, notes: 'Scale ticket 1940' }] }, clerk2);
    ok('received with a warning', r.status === 200 && r.body.discrepancies === 1 && /hold/i.test(r.body.warning), `${r.status} ${r.body?.warning}`);
    let i = await invOf(id);
    ok('at L2, all 2000 on hold, none on sale, a DISPUTE hold', i.locationId === L2.id && num(i.qtyOnHold) === 2000 && num(i.qtyAvailable) === 0 && (await activeHolds(id))[0]?.holdType === 'DISPUTE', JSON.stringify(i));
    const s = await settle(t.body, id, 'CONFIRM_SHORT', manager2);
    i = await invOf(id);
    ok('confirmed: 1940 on hand and on sale, hold released', s.status === 200 && num(i.qtyOnHand) === 1940 && num(i.qtyAvailable) === 1940 && (await activeHolds(id)).length === 0, `${s.status} ${JSON.stringify(i)}`);
    const down = (await movesOf(id, 'ADJUST'))[0];
    ok('an ADJUST movement of 60 by the manager with the reason', near(down?.qtyMoved, 60) && down?.reasonCode === 'TRANSFER_SHORT_DOWN' && down?.createdById === manager2.user.id, JSON.stringify(down));
    await books(ok, id);
  });
  await scenario(G5, 'a shortage that turns up is settled as found: nothing is taken off and the hold is released', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    await receiveT(t.body, { lines: [{ coilId: id, qtyReceived: 900, notes: 'One bundle missing' }] }, clerk2);
    const s = await settle(t.body, id, 'FOUND', manager2, 'Bundle was behind the rack');
    const i = await invOf(id);
    ok('1000 on hand and on sale, hold released, no correction movement', s.status === 200 && num(i.qtyOnHand) === 1000 && num(i.qtyAvailable) === 1000 && (await activeHolds(id)).length === 0 && (await movesOf(id, 'ADJUST')).length === 0, `${s.status} ${JSON.stringify(i)}`);
    ok('settling the same line again is refused', (await settle(t.body, id, 'CONFIRM_SHORT', manager2)).status === 409 && num((await invOf(id)).qtyOnHand) === 1000);
  });
  await scenario(G5, 'an item that never arrived, once confirmed lost, is taken off entirely and marked used up', async (ok) => {
    const keep = await received({ weightLb: 500 }); const lost = await received({ weightLb: 700 });
    const t = await ship([keep, lost], L2);
    const r = await receiveT(t.body, { lines: [{ coilId: lost, condition: 'NOT_RECEIVED', notes: 'Not on the truck' }] }, clerk2);
    ok('the one that came is on sale at L2', r.status === 200 && num((await invOf(keep)).qtyAvailable) === 500 && (await invOf(keep)).locationId === L2.id);
    const s = await settle(t.body, lost, 'CONFIRM_SHORT', manager2, 'Carrier confirms it was never loaded');
    const [i, c] = [await invOf(lost), await coilOf(lost)];
    ok('the lost item has nothing on hand, is used up and has no open hold', s.status === 200 && num(i.qtyOnHand) === 0 && c.status === 'CONSUMED' && (await activeHolds(lost)).length === 0, `${s.status} ${c.status}`);
    await books(ok, lost, 'lost item'); await books(ok, keep, 'item that came');
  });
  await scenario(G5, 'an item that arrives damaged is held as damage at the receiving branch', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    const r = await receiveT(t.body, { lines: [{ coilId: id, condition: 'DAMAGED', notes: 'Edge crushed by the forks' }] }, clerk2);
    ok('received with a discrepancy', r.status === 200 && r.body.discrepancies === 1, r.status);
    ok('a DAMAGE hold, all of it held, at L2', (await activeHolds(id))[0]?.holdType === 'DAMAGE' && num((await invOf(id)).qtyOnHold) === 1000 && (await invOf(id)).locationId === L2.id);
    ok('the line is recorded as damaged with the note', (await prisma.stockTransferLine.findFirst({ where: { transferId: t.body.id } })).condition === 'DAMAGED');
  });
  await scenario(G5, 'a transfer received twice is booked in once', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    await receiveT(t.body);
    const again = await receiveT(t.body);
    ok('the second receipt is refused as already done', again.status === 409 && again.body?.code === 'ALREADY_FINAL', `${again.status} ${again.body?.code}`);
    ok('one TRANSFER movement', (await movesOf(id, 'TRANSFER')).length === 1);
  });
  await scenario(G5, 'the sending branch cannot receive its own transfer at the other end', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2, 'branchWh');
    const r = await receiveT(t.body, {}, 'branchWh');
    ok('refused with 403', r.status === 403, r.status);
    ok('still in transit at L1', (await invOf(id)).status === 'IN_TRANSIT' && (await invOf(id)).locationId === L1.id);
    await cancelT(t.body, 'branchWh');
  });
  await scenario(G5, 'the sender can call a transfer back before it arrives; the receiver cannot', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2, 'branchWh');
    ok('the receiving branch cannot cancel it', (await cancelT(t.body, manager2)).status === 403);
    ok('a reason is required', (await as('branchWh')('POST', `/api/inventory/transfers/${t.body.id}/cancel`, {})).status === 400);
    const c = await cancelT(t.body, 'branchWh');
    const i = await invOf(id);
    ok('cancelled: back on sale at L1, nothing in transit', c.status === 200 && i.status === 'ACTIVE' && num(i.qtyAvailable) === 1000 && num(i.qtyInTransit) === 0 && i.locationId === L1.id, `${c.status} ${JSON.stringify(i)}`);
    ok('a cancelled transfer cannot be received', (await receiveT(t.body, {}, manager2)).status === 409);
    ok('no movement was written', (await movesOf(id, 'TRANSFER')).length === 0);
  });
  await scenario(G5, 'only a manager or the inventory manager settles a shortage', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    await receiveT(t.body, { lines: [{ coilId: id, qtyReceived: 950, notes: 'Scale ticket 950' }] }, clerk2);
    const s = await settle(t.body, id, 'CONFIRM_SHORT', clerk2);
    ok('the clerk is refused', s.status === 403, s.status);
    ok('nothing changed', num((await invOf(id)).qtyOnHand) === 1000 && (await activeHolds(id)).length === 1);
  });
  await scenario(G5, 'a reserved item travels with its reservation and ships from the new branch', async (ok) => {
    const id = await received({ weightLb: 2000, locationId: L2.id });
    const o = await B.order([B.line(500)]);
    await B.reserve(o, o.lines[0], id, 500);
    const t = await ship([id], L1);
    const road = await invOf(id);
    ok('in transit: 500 still reserved, the free 1500 in transit', num(road.qtyAllocated) === 500 && num(road.qtyInTransit) === 1500 && num(road.qtyAvailable) === 0, JSON.stringify(road));
    await receiveT(t.body, {}, 'branchWh');
    const at = await invOf(id);
    ok('received at L1 with the reservation and 1500 free', at.locationId === L1.id && num(at.qtyAllocated) === 500 && num(at.qtyAvailable) === 1500);
    const s = await B.shipment(o, [[o.lines[0], 500]]); const d = await B.dispatch(s.body);
    ok('ships from L1', ok2(d) && (await movesOf(id, 'SHIP'))[0]?.fromLocationId === L1.id, d.status);
    await books(ok, id);
  });
  await scenario(G5, 'an item on hold can be sent and arrives still on hold, with nothing of it on sale on the way', async (ok) => {
    const id = await received({ weightLb: 900 });
    await hold(id, 'DAMAGE');
    const t = await ship([id], L2);
    const road = await invOf(id);
    ok('sent: 900 still on hold, none free or in the free in-transit bucket', t.status === 201 && num(road.qtyOnHold) === 900 && num(road.qtyAvailable) === 0 && road.status === 'IN_TRANSIT', `${t.status} ${JSON.stringify(road)}`);
    await receiveT(t.body, {}, clerk2);
    const at = await invOf(id);
    ok('received at L2 still on hold with the same hold', at.locationId === L2.id && num(at.qtyOnHold) === 900 && (await activeHolds(id)).length === 1 && (await activeHolds(id))[0].holdType === 'DAMAGE');
    await books(ok, id);
  });
  await scenario(G5, 'each branch sees the transfers coming in and going out, and not other branches\' transfers', async (ok) => {
    const a = await received({ weightLb: 500 }); const b = await received({ weightLb: 500, locationId: L2.id }); const c = await received({ weightLb: 500, locationId: L3.id });
    const out = await ship([a], L2, 'branchWh'); const inn = await ship([b], L1); const elsewhere = await ship([c], L2);
    const outs = listOf((await A.call('GET', '/api/inventory/transfers?direction=out&status=SHIPPED&limit=200', undefined, 'branchWh')).body);
    const ins = listOf((await A.call('GET', '/api/inventory/transfers?direction=in&status=SHIPPED&limit=200', undefined, 'branchWh')).body);
    ok('the L1 inventory manager sees its outgoing transfer under out', outs.some((x) => x.id === out.body.id) && !outs.some((x) => x.id === inn.body.id));
    ok('and the incoming one under in', ins.some((x) => x.id === inn.body.id) && !ins.some((x) => x.id === out.body.id));
    ok('and cannot open one between two other branches', (await A.call('GET', `/api/inventory/transfers/${elsewhere.body.id}`, undefined, 'branchWh')).status === 404);
    for (const t of [out, inn, elsewhere]) await cancelT(t.body);
  });
  await scenario(G5, 'a transfer must name a real other branch and items from one branch, each once', async (ok) => {
    const a = await received({ weightLb: 500 }); const b = await received({ weightLb: 500, locationId: L2.id });
    ok('items at two branches: refused', (await ship([a, b], L3)).status === 409);
    ok('to its own branch: refused', [400, 409].includes((await ship([a], L1)).status));
    ok('to a branch not on file: refused', [400, 404].includes((await ship([a], { id: `no-such-${run}` })).status));
    ok('the same item twice: refused', (await ship([a, a], L2)).status === 400);
    ok('none of them moved', (await invOf(a)).status === 'ACTIVE' && (await invOf(b)).status === 'ACTIVE' && (await prisma.stockTransferLine.count({ where: { coilId: { in: [a, b] } } })) === 0);
  });
  await scenario(G5, 'a receipt cannot add weight to a transfer or name an item that is not on it', async (ok) => {
    const id = await received({ weightLb: 1000 }); const other = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    ok('more than shipped: refused with 409', (await receiveT(t.body, { lines: [{ coilId: id, qtyReceived: 1001 }] })).status === 409);
    ok('an item not on the transfer: refused', (await receiveT(t.body, { lines: [{ coilId: other, qtyReceived: 10 }] })).status === 400);
    ok('a short line with no note: refused', (await receiveT(t.body, { lines: [{ coilId: id, qtyReceived: 900 }] })).status === 400);
    ok('still in transit and not received', (await prisma.stockTransfer.findUnique({ where: { id: t.body.id } })).status === 'SHIPPED' && (await invOf(id)).status === 'IN_TRANSIT');
    await cancelT(t.body);
  });
  await scenario(G5, 'the old transfer address still works but now ships, and the old v1 transfer writes are retired', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const legacy = await A.post('/api/inventory/transfer', { coilId: id, fromLocationId: L1.id, toLocationId: L2.id, qty: 1000 });
    ok('the one-item transfer answers 201 and says it is in transit', legacy.status === 201 && legacy.body.inTransit === true && !!legacy.body.transfer?.id, legacy.status);
    ok('part of an item still cannot be sent', (await A.post('/api/inventory/transfer', { coilId: await received({ weightLb: 1000 }), toLocationId: L2.id, qty: 10 })).status === 409);
    const v1 = await A.post('/api/v1/inventory/transfers', { fromLocationId: L1.id, toLocationId: L2.id, quantity: 10 });
    ok('the v1 transfer write is retired with 410', v1.status === 410 && v1.body?.code === 'RETIRED', v1.status);
    await cancelT(legacy.body.transfer);
  });
}

// ══ 6. Returns, counts and adjustments ════════════════════════════════════════════════
const G6 = 'Returns, counts and adjustments';
if (want(6)) {
  async function returned(disposition, qty = 300) {
    const r = await shippedOrder(1000);
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Wrong size sent', lines: [{ orderLineId: r.order.lines[0].id, quantity: qty, disposition, coilId: r.coilId }] });
    if (ret.status !== 201) throw new Error(`return ${ret.status} ${JSON.stringify(ret.body).slice(0, 200)}`);
    const got = await A.post(`/api/returns/${ret.body.id}/receive`, {});
    return { ...r, ret: ret.body, got };
  }
  await scenario(G6, 'a return to restock goes back on the item it shipped from, with a receipt movement', async (ok) => {
    const r = await returned('RESTOCK', 300);
    ok('received', r.got.status === 200, `${r.got.status} ${r.got.body?.error}`);
    const i = await invOf(r.coilId);
    ok('500 left after shipping plus 300 back: 800 on hand and on sale', num(i.qtyOnHand) === 800 && num(i.qtyAvailable) === 800, JSON.stringify(i));
    ok('a RECEIVE movement of 300 for the return', (await movesOf(r.coilId, 'RECEIVE')).some((m) => num(m.qtyMoved) === 300 && m.reasonCode === 'CUSTOMER_RETURN'));
    await books(ok, r.coilId);
  });
  await scenario(G6, 'a return for inspection comes back on hold until someone has looked at it', async (ok) => {
    const r = await returned('INSPECT', 200);
    const i = await invOf(r.coilId);
    ok('received and held for test', r.got.status === 200 && (await activeHolds(r.coilId)).some((h) => h.holdType === 'PENDING_TEST'), r.got.status);
    ok('the returned 200 is not on sale', num(i.qtyAvailable) === 0 && num(i.qtyOnHold) === 700, JSON.stringify(i));
    await books(ok, r.coilId);
  });
  await scenario(G6, 'a return that is scrapped is recorded coming back and going out, so the history still adds up', async (ok) => {
    const r = await returned('SCRAP', 250);
    ok('received', r.got.status === 200, r.got.status);
    const mv = await movesOf(r.coilId);
    ok('a RECEIVE and a SCRAP of 250 for the return', mv.some((m) => m.movementType === 'RECEIVE' && num(m.qtyMoved) === 250) && mv.some((m) => m.movementType === 'SCRAP' && num(m.qtyMoved) === 250));
    ok('the balance did not change: 500', num((await invOf(r.coilId)).qtyOnHand) === 500);
    await books(ok, r.coilId);
  });
  await scenario(G6, 'more cannot be returned than shipped', async (ok) => {
    const r = await shippedOrder(400);
    const ret = await A.post('/api/returns', { orderId: r.order.id, reason: 'Too much', lines: [{ orderLineId: r.order.lines[0].id, quantity: 401, disposition: 'RESTOCK' }] });
    ok('refused with 409', ret.status === 409, ret.status);
    ok('no return saved', (await prisma.order.count({ where: { orderType: 'RETURN', returnOfOrderId: r.order.id } })) === 0);
  });
  await scenario(G6, 'a count that finds less sets the balance to what is there with a COUNT movement and a note', async (ok) => {
    const id = await received({ weightLb: 2000 });
    const r = await adjust(id, { reason: 'COUNT', countedQty: 1950.5, notes: 'Cycle count aisle A' });
    ok('accepted', r.status === 201, `${r.status} ${r.body?.error}`);
    const mv = (await movesOf(id, 'COUNT'))[0];
    ok('1950.5 on hand; a COUNT movement of 49.5 out by the inventory manager', num((await invOf(id)).qtyOnHand) === 1950.5 && near(mv?.qtyMoved, 49.5) && !!mv.fromLocationId && mv.createdById === users.branchWh.id);
    ok('the change is in the audit trail with before and after', (await prisma.auditLog.findFirst({ where: { resourceId: id, eventType: 'STOCK_ADJUSTED' } }))?.details?.to === 1950.5);
    await books(ok, id);
  });
  await scenario(G6, 'a count that agrees writes no movement, only a confirmation', async (ok) => {
    const id = await received({ weightLb: 2000 });
    const r = await adjust(id, { reason: 'COUNT', countedQty: 2000, notes: 'Cycle count aisle B' });
    ok('answered 200 with no movement', r.status === 200 && !r.body.movement, r.status);
    ok('only the receipt movement, and a confirmation in the audit trail', (await movesOf(id)).length === 1 && (await prisma.auditLog.count({ where: { resourceId: id, eventType: 'STOCK_COUNT_CONFIRMED' } })) === 1);
  });
  await scenario(G6, 'found stock adds to the balance; found cannot take away', async (ok) => {
    const id = await received({ weightLb: 1000 });
    ok('found -50 is refused', (await adjust(id, { reason: 'FOUND', change: -50, notes: 'Found behind rack' })).status === 400);
    const r = await adjust(id, { reason: 'FOUND', change: 75, notes: 'Found behind rack' });
    ok('found +75 is accepted: 1075 on hand with an ADJUST in', r.status === 201 && num((await invOf(id)).qtyOnHand) === 1075 && (await movesOf(id, 'ADJUST'))[0]?.toLocationId === L1.id);
    await books(ok, id);
  });
  await scenario(G6, 'only a manager or the inventory manager can correct a balance', async (ok) => {
    const id = await received({ weightLb: 1000 });
    for (const who of ['csr', 'operator', 'shipping']) ok(`${who}: refused with 403`, (await adjust(id, { reason: 'CORRECTION', change: -10, notes: 'Typing error' }, who)).status === 403);
    ok('the clerk too', (await clerk2.call('POST', '/api/inventory/adjust', { coilId: id, reason: 'CORRECTION', change: -10, notes: 'Typing error' })).status === 403);
    ok('nothing changed', num((await invOf(id)).qtyOnHand) === 1000 && (await movesOf(id)).length === 1);
  });
  await scenario(G6, 'a correction cannot take away stock that is reserved or on hold', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const o = await B.order([B.line(600)]);
    await B.reserve(o, o.lines[0], id, 600);
    const r = await adjust(id, { reason: 'COUNT', countedQty: 300, notes: 'Counted 300' });
    ok('refused with 409 naming what is reserved', r.status === 409 && /reserved/.test(r.body?.error), r.status);
    ok('nothing changed', num((await invOf(id)).qtyOnHand) === 1000);
  });
  await scenario(G6, 'a branch login cannot correct another branch\'s stock', async (ok) => {
    const id = await received({ weightLb: 1000, locationId: L2.id });
    const r = await adjust(id, { reason: 'COUNT', countedQty: 900, notes: 'Counted 900' });
    ok('not found', r.status === 404, r.status);
    ok('nothing changed', num((await invOf(id)).qtyOnHand) === 1000);
  });
}

// ══ 7. Concurrency, security and recovery ══════════════════════════════════════════════
const G7 = 'Concurrency, security and recovery';
if (want(7)) {
  await scenario(G7, 'two people receiving the same transfer at once: one books it in', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    const both = await Promise.all([receiveT(t.body, {}, clerk2), receiveT(t.body, {}, manager2)]);
    ok('one 200 and one 409', both.filter((r) => r.status === 200).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join());
    ok('one movement; the item at L2 with 1000', (await movesOf(id, 'TRANSFER')).length === 1 && (await invOf(id)).locationId === L2.id && num((await invOf(id)).qtyAvailable) === 1000);
    await books(ok, id);
  });
  await scenario(G7, 'a receipt and a call-back of the same transfer at once: exactly one happens', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    const [r, c] = await Promise.all([receiveT(t.body, {}, clerk2), cancelT(t.body)]);
    const row = await prisma.stockTransfer.findUnique({ where: { id: t.body.id } });
    ok('exactly one succeeded', [r.status, c.status].filter((s) => s === 200).length === 1, `${r.status} ${c.status}`);
    const i = await invOf(id);
    ok('the item is where the winner put it', row.status === 'RECEIVED' ? i.locationId === L2.id : i.locationId === L1.id && row.status === 'CANCELLED', `${row.status} ${i.locationId}`);
    ok('nothing in transit either way', num(i.qtyInTransit) === 0 && i.status === 'ACTIVE');
    await books(ok, id);
  });
  await scenario(G7, 'one item sent to two branches at once: one transfer', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const both = await Promise.all([ship([id], L2), ship([id], L3)]);
    ok('one 201 and one 409', both.filter((r) => r.status === 201).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join());
    ok('the item is on one transfer', (await prisma.stockTransferLine.count({ where: { coilId: id } })) === 1);
    await cancelT(both.find((r) => r.status === 201).body);
    await books(ok, id);
  });
  await scenario(G7, 'two receipts against the same purchase order line at once both count', async (ok) => {
    const po = await purchaseOrder([poLine(10000)]);
    const both = await Promise.all([receipt({ poLineId: po.lines[0].id, weightLb: 3000 }), receipt({ poLineId: po.lines[0].id, weightLb: 4000 })]);
    ok('both accepted', both.every((r) => r.status === 201), both.map((r) => r.status).join());
    const line = await prisma.orderLine.findUnique({ where: { id: po.lines[0].id } });
    ok('the line shows 7000 received, not one of them', num(line.qtyReceived) === 7000 && line.lineStatus === 'PARTIAL', `${line.qtyReceived}`);
  });
  await scenario(G7, 'two settlements of one shortage at once: one is applied', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const t = await ship([id], L2);
    await receiveT(t.body, { lines: [{ coilId: id, qtyReceived: 900, notes: 'Scale ticket 900' }] }, clerk2);
    const both = await Promise.all([settle(t.body, id, 'CONFIRM_SHORT', manager2), settle(t.body, id, 'CONFIRM_SHORT')]);
    ok('one 200 and one 409', both.filter((r) => r.status === 200).length === 1 && both.filter((r) => r.status === 409).length === 1, both.map((r) => r.status).join());
    ok('100 taken off once: 900 on hand, one ADJUST', num((await invOf(id)).qtyOnHand) === 900 && (await movesOf(id, 'ADJUST')).length === 1);
    await books(ok, id);
  });
  await scenario(G7, 'a hold and a transfer of the same item at once: the hold is refused once it is on the road, or it travels held', async (ok) => {
    const id = await received({ weightLb: 1000 });
    const [h, t] = await Promise.all([hold(id), ship([id], L2)]);
    const i = await invOf(id);
    ok('the transfer always goes through', t.status === 201, `${h.status} ${t.status}`);
    // Shipped first: the hold is refused (the receiving branch can hold it on arrival). Held first: it is
    // sent still held, nothing of it is on sale or in the free in-transit bucket.
    ok('either the hold was refused and all 1000 is in transit, or the hold came first and all 1000 travels on hold',
      (h.status === 409 && num(i.qtyInTransit) === 1000 && num(i.qtyOnHold) === 0) || (h.status === 201 && num(i.qtyOnHold) === 1000 && num(i.qtyInTransit) === 0), `${h.status} ${JSON.stringify(i)}`);
    if (t.status === 201) await cancelT(t.body);
    if (h.status === 201) await release(id);
    await books(ok, id);
  });
  await scenario(G7, 'customer logins and sales logins cannot see or change purchase orders, transfers or corrections', async (ok) => {
    const po = await purchaseOrder([poLine(1000)]);
    for (const who of ['custA']) {
      ok(`${who}: purchase orders refused`, [401, 403].includes((await A.call('GET', '/api/purchase-orders', undefined, who)).status) && [401, 403, 404].includes((await A.call('GET', `/api/purchase-orders/${po.id}`, undefined, who)).status));
      ok(`${who}: transfers refused`, [401, 403].includes((await A.call('GET', '/api/inventory/transfers', undefined, who)).status));
      ok(`${who}: supply position refused`, [401, 403].includes((await A.call('GET', '/api/purchase-orders/supply-position', undefined, who)).status));
    }
    const id = await received({ weightLb: 500 });
    ok('a sales login cannot ship a transfer', (await ship([id], L2, 'branchA')).status === 403 && (await invOf(id)).status === 'ACTIVE');
    ok('an operator cannot place a purchase order', (await A.call('POST', '/api/purchase-orders', { sellerId: w.supplierOrg.id, lines: [poLine(10)] }, 'operator')).status === 403);
  });
  await scenario(G7, 'fields a transfer form does not have are ignored', async (ok) => {
    const id = await received({ weightLb: 500 });
    const t = await ship([id], L2, 'admin', { status: 'RECEIVED', transferNumber: 'TRF-FORGED', fromLocationId: L4.id, receivedById: users.csr.id });
    const row = await prisma.stockTransfer.findUnique({ where: { id: t.body.id } });
    ok('saved as SHIPPED from the item\'s own branch with a server number, not received', t.status === 201 && row.status === 'SHIPPED' && row.transferNumber !== 'TRF-FORGED' && row.fromLocationId === L1.id && row.receivedById === null, JSON.stringify(row));
    await cancelT(t.body);
  });
  await scenario(G7, 'bad input to the stock routes is answered with a 4xx, never a server error', async (ok) => {
    const id = await received({ weightLb: 500 });
    const cases = [
      ['POST', '/api/inventory/transfers', { toLocationId: L2.id, coilIds: 'all' }], ['POST', '/api/inventory/transfers', { toLocationId: 42, coilIds: [id] }],
      ['POST', '/api/inventory/transfers/nope/receive', {}], ['POST', '/api/inventory/transfers/nope/settle', { coilId: id, decision: 'CONFIRM_SHORT', notes: 'xxxxx' }],
      ['POST', '/api/inventory/transfers/nope/cancel', { reason: 'xxxxx' }], ['GET', '/api/inventory/transfers/nope'],
      ['POST', '/api/inventory/receipts', { coilNumber: { a: 1 } }], ['POST', '/api/inventory/receipts', { ...B.receiptBody(), poLineId: 'nope' }],
      ['POST', '/api/inventory/adjust', { coilId: id, reason: 'COUNT', countedQty: 'lots', notes: 'xxxxx' }], ['POST', '/api/inventory/adjust', { coilId: id, reason: 'MAGIC', change: 1, notes: 'xxxxx' }],
      ['POST', `/api/coils/${id}/hold`, { holdType: 'NOPE', holdReason: 'x' }], ['PUT', '/api/purchase-orders/nope', { status: 'COMPLETE' }],
      ['GET', '/api/purchase-orders/supply-position?locationId=nope'], ['POST', '/api/inventory/transfer', { coilId: id, toLocationId: { x: 1 } }],
    ];
    for (const [m, url, body] of cases) { const r = await A.call(m, url, body, 'admin'); ok(`${m} ${url} ${JSON.stringify(body || '').slice(0, 40)}: ${r.status}`, r.status >= 400 && r.status < 500, `${r.status} ${JSON.stringify(r.body).slice(0, 100)}`); }
    ok('the item was not changed by any of it', (await invOf(id)).status === 'ACTIVE' && num((await invOf(id)).qtyAvailable) === 500);
  });
  await scenario(G7, 'a transfer that fails while being saved leaves the stock exactly as it was', async (ok) => {
    const id = await received({ weightLb: 800 });
    const fn = `qa_p6_fail_${run.toLowerCase()}`;
    psql(`CREATE FUNCTION ${fn}() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'QA fault'; END $$ LANGUAGE plpgsql; CREATE TRIGGER ${fn} BEFORE INSERT ON "StockTransferLine" FOR EACH ROW EXECUTE FUNCTION ${fn}();`);
    let r;
    try { r = await ship([id], L2); } finally { psql(`DROP TRIGGER IF EXISTS ${fn} ON "StockTransferLine"; DROP FUNCTION IF EXISTS ${fn}();`); }
    ok('the answer is an error', r.status >= 400, r.status);
    const i = await invOf(id);
    ok('the item is on sale at L1, not in transit, and no transfer exists for it', i.status === 'ACTIVE' && num(i.qtyAvailable) === 800 && num(i.qtyInTransit) === 0 && (await prisma.stockTransferLine.count({ where: { coilId: id } })) === 0, JSON.stringify(i));
    const again = await ship([id], L2);
    ok('once the fault is gone the same transfer goes through', again.status === 201, again.status);
    await cancelT(again.body);
  });
  await scenario(G7, 'a receipt of a transfer that fails part way leaves it in transit, and can be received again', async (ok) => {
    const id = await received({ weightLb: 800 });
    const t = await ship([id], L2);
    const fn = `qa_p6_fail_mv_${run.toLowerCase()}`;
    psql(`CREATE FUNCTION ${fn}() RETURNS trigger AS $$ BEGIN IF NEW."movementType" = 'TRANSFER' THEN RAISE EXCEPTION 'QA fault'; END IF; RETURN NEW; END $$ LANGUAGE plpgsql; CREATE TRIGGER ${fn} BEFORE INSERT ON "MaterialMovement" FOR EACH ROW EXECUTE FUNCTION ${fn}();`);
    let r;
    try { r = await receiveT(t.body, {}, clerk2); } finally { psql(`DROP TRIGGER IF EXISTS ${fn} ON "MaterialMovement"; DROP FUNCTION IF EXISTS ${fn}();`); }
    ok('the answer is an error', r.status >= 400, r.status);
    const [row, i] = [await prisma.stockTransfer.findUnique({ where: { id: t.body.id } }), await invOf(id)];
    ok('the transfer is still SHIPPED and the item still in transit at L1', row.status === 'SHIPPED' && i.status === 'IN_TRANSIT' && i.locationId === L1.id && num(i.qtyInTransit) === 800, `${row.status} ${JSON.stringify(i)}`);
    const again = await receiveT(t.body, {}, clerk2);
    ok('received on the second try, with one movement', again.status === 200 && (await movesOf(id, 'TRANSFER')).length === 1);
    await books(ok, id);
  });
  await scenario(G7, 'a transfer sent twice with the same key is shipped once', async (ok) => {
    const id = await received({ weightLb: 600 });
    const key = `p6-${run}-${Math.random().toString(36).slice(2)}`;
    const body = { toLocationId: L2.id, coilIds: [id], carrier: 'Own truck' };
    const a = await raw('POST', '/api/inventory/transfers', body, 'admin', { 'Idempotency-Key': key });
    const b = await raw('POST', '/api/inventory/transfers', body, 'admin', { 'Idempotency-Key': key });
    ok('the second answer repeats the first', a.status === 201 && b.status === 201 && b.body?.id === a.body?.id, `${a.status} ${b.status}`);
    ok('one transfer on file', (await prisma.stockTransferLine.count({ where: { coilId: id } })) === 1);
    await cancelT(a.body);
  });
  await scenario(G7, 'the retired v1 stock writes change nothing', async (ok) => {
    const before = await prisma.inventory.aggregate({ _sum: { qtyOnHand: true } });
    for (const [url, body] of [['/api/v1/inventory/adjust', { materialCode: 'X', quantity: 5 }], ['/api/v1/inventory/rfid-scan', { tag: 'X' }], ['/api/v1/inventory/transfers/TRF-001/status', { status: 'RECEIVED' }]]) {
      const r = await A.call('POST', url, body);
      ok(`${url}: 410 retired`, r.status === 410, r.status);
    }
    ok('no balance moved', near((await prisma.inventory.aggregate({ _sum: { qtyOnHand: true } }))._sum.qtyOnHand, before._sum.qtyOnHand));
  });
  await scenario(G7, 'forty stock changes at once leave every balance in step', async (ok) => {
    const ids = await Promise.all(Array.from({ length: 8 }, () => received({ weightLb: 2000 })));
    const o = await B.order([B.line(4000)]);
    const numbers = (await prisma.coil.findMany({ where: { id: { in: ids } }, select: { id: true, coilNumber: true } })).reduce((m, c) => ({ ...m, [c.id]: c.coilNumber }), {});
    const work = [];
    for (const [k, id] of ids.entries()) {
      work.push(() => B.reserve(o, o.lines[0], id, 300));
      work.push(() => adjust(id, { reason: 'COUNT', countedQty: 1990, notes: 'Burst count' }));
      work.push(() => hold(id));
      work.push(() => ship([id], k % 2 ? L2 : L3));
      work.push(() => A.post('/api/inventory/receipts', { coilNumber: tag('CUT'), form: 'PLATE', parentTag: numbers[id], thicknessIn: 0.5, widthIn: 5, lengthIn: 5, weightLb: 5, locationId: L1.id }));
    }
    const results = await Promise.all(work.map((f) => f()));
    ok('no server errors', results.every((r) => r.status < 500), results.map((r) => r.status).join());
    for (const id of ids) await books(ok, id, `burst item ${id.slice(0, 6)}`);
    for (const t of results.filter((r) => r.status === 201 && r.body?.transferNumber)) await cancelT(t.body);
  });
  await scenario(G7, 'a hold racing counts and cuts on the same item never ends in a server error', async (ok) => {
    // K-015: a hold took the item before its balance, the other way round from every other stock change.
    const ids = await Promise.all(Array.from({ length: 12 }, () => received({ weightLb: 2000 })));
    const numbers = (await prisma.coil.findMany({ where: { id: { in: ids } }, select: { id: true, coilNumber: true } })).reduce((m, c) => ({ ...m, [c.id]: c.coilNumber }), {});
    const statuses = [];
    for (let round = 0; round < 3; round += 1) {
      const work = [];
      for (const id of ids) {
        work.push(() => (round % 2 ? release(id) : hold(id)));
        work.push(() => adjust(id, { reason: 'COUNT', countedQty: 1990 - round, notes: 'Race count' }));
        work.push(() => A.post('/api/inventory/receipts', { coilNumber: tag('CUT'), form: 'PLATE', parentTag: numbers[id], thicknessIn: 0.5, widthIn: 5, lengthIn: 5, weightLb: 5, locationId: L1.id }));
        work.push(() => (round % 2 ? hold(id) : release(id)));
      }
      statuses.push(...(await Promise.all(work.map((f) => f()))).map((r) => r.status));
    }
    ok('144 racing requests, none answered with a server error', statuses.length === 144 && statuses.every((x) => x < 500), [...new Set(statuses)].join());
    for (const id of ids) await books(ok, id, `raced item ${id.slice(0, 6)}`);
  });
  await scenario(G7, 'a hold queues behind a stock change in progress on the same item instead of deadlocking', async (ok) => {
    // K-015, made certain: this transaction takes the balance first and the item second, as every stock
    // change does. A hold that took the item first would meet it head on and the database would end one.
    const id = await received({ weightLb: 2000 });
    let held; let failed = null;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Inventory" WHERE "coilId" = ${id} FOR UPDATE`;
        held = hold(id);
        await new Promise((r) => setTimeout(r, 500));
        await tx.coil.update({ where: { id }, data: { binLocation: 'RACE-1' } });
      }, { timeout: 20000 });
    } catch (e) { failed = e; }
    const r = await held;
    ok('the change in progress was not ended by the database', !failed, String(failed?.message || '').slice(0, 160));
    ok('the hold then went through', r.status === 201, r.status);
    const c = await coilOf(id);
    ok('both are saved: the item is on hold and in the new bin', c.status === 'HOLD' && c.binLocation === 'RACE-1', `${c.status} ${c.binLocation}`);
    await books(ok, id);
  });
  await scenario(G7, 'after everything above the inventory books reconcile', async (ok) => {
    const one = async (sql) => Number((await prisma.$queryRawUnsafe(sql))[0].n);
    ok('every balance is available + reserved + on hold + in transit', (await one(`SELECT count(*)::int n FROM "Inventory" WHERE abs("qtyOnHand" - ("qtyAvailable"+"qtyAllocated"+"qtyOnHold"+"qtyInTransit")) > 0.0001`)) === 0);
    ok('nothing below zero', (await one(`SELECT count(*)::int n FROM "Inventory" WHERE "qtyOnHand"<0 OR "qtyAvailable"<0 OR "qtyAllocated"<0 OR "qtyOnHold"<0 OR "qtyInTransit"<0`)) === 0);
    ok('stock in transit is exactly the stock on open transfers', (await one(`SELECT count(*)::int n FROM "Inventory" i WHERE (i."qtyInTransit" > 0.0001 OR i.status='IN_TRANSIT') <> EXISTS (SELECT 1 FROM "StockTransferLine" l JOIN "StockTransfer" t ON t.id=l."transferId" WHERE l."coilId"=i."coilId" AND t.status='SHIPPED')`)) === 0);
    ok('no item is on two open transfers', (await one(`SELECT count(*)::int n FROM (SELECT l."coilId" FROM "StockTransferLine" l JOIN "StockTransfer" t ON t.id=l."transferId" WHERE t.status='SHIPPED' GROUP BY 1 HAVING count(*)>1) x`)) === 0);
    ok('every received transfer line has its movement', (await one(`SELECT count(*)::int n FROM "StockTransferLine" l JOIN "StockTransfer" t ON t.id=l."transferId" WHERE t.status='RECEIVED' AND NOT EXISTS (SELECT 1 FROM "MaterialMovement" m WHERE m."coilId"=l."coilId" AND m."movementType"='TRANSFER' AND m."fromLocationId"=t."fromLocationId" AND m."toLocationId"=t."toLocationId")`)) === 0);
    ok('reserved equals the reservations on file for every item', (await one(`SELECT count(*)::int n FROM "Inventory" i WHERE abs(i."qtyAllocated" - coalesce((SELECT sum(a."qtyAllocated") FROM "OrderLineAllocation" a WHERE a."coilId"=i."coilId"),0)) > 0.0001`)) === 0);
    ok('purchase order lines received from this run match their receipts', (await one(`SELECT count(*)::int n FROM "OrderLine" ol JOIN "Order" o ON o.id=ol."orderId" WHERE o."orderType"='PO' AND o."createdAt" >= '${T0.toISOString()}' AND upper(ol.unit) IN ('LB','CWT','TON') AND abs(ol."qtyReceived" - coalesce((SELECT sum(m."qtyMoved") FROM "MaterialMovement" m WHERE m."orderLineId"=ol.id AND m."movementType"='RECEIVE'),0) / CASE upper(ol.unit) WHEN 'CWT' THEN 100 WHEN 'TON' THEN 2000 ELSE 1 END) > 0.001`)) === 0);
    ok('the stock row and its item agree on the branch', (await one(`SELECT count(*)::int n FROM "Inventory" i JOIN "Coil" c ON c.id=i."coilId" WHERE i."locationId" <> c."locationId"`)) === 0);
  });
}

const failed = finish('Phase 6 inventory scenarios', OUT, fs);
await prisma.$disconnect();
process.exit(failed ? 1 : 0);
