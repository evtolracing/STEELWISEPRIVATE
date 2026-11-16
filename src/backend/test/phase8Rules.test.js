// Phase 8 rules that are pure arithmetic or pure decisions: what is still open on an order, which
// aging column an invoice falls in, which reserved stock a shipment draws, when a package may be
// tagged, who is sent stock cost, and which database errors mean "run it again".
import test from 'node:test';
import assert from 'node:assert/strict';
import { closeoutPosition } from '../src/lib/orderCloseout.js';
import { agingBucket, AGING_COLUMNS } from '../src/services/billing.js';
import { pickPlan } from '../src/lib/shippingDocuments.js';
import { taggingProblems } from '../src/services/dropTagService.js';
import { withoutStockCost } from '../src/lib/costView.js';
import { isOverlap, retryOverlap } from '../src/lib/numbering.js';

const codes = (p) => p.open.map((o) => o.code).sort().join(',');
const done = { status: 'COMPLETE', lines: [{ ordered: 100, shipped: 100, invoiced: 100 }], shipments: [{ status: 'DELIVERED', podCaptured: true }], invoices: [{ kind: 'INVOICE', status: 'PAID', total: 65, paid: 65 }] };

test('closeout: an order shipped, delivered, invoiced and paid is closed', () => {
  const p = closeoutPosition(done);
  assert.equal(p.closed, true); assert.equal(p.state, 'CLOSED'); assert.deepEqual(p.open, []);
});
test('closeout: each open item is named, with its figure', () => {
  const p = closeoutPosition({ status: 'PARTIAL', lines: [{ ordered: 100, shipped: 60, invoiced: 40 }], shipments: [{ status: 'PENDING' }, { status: 'IN_TRANSIT' }, { status: 'EXCEPTION' }], invoices: [{ kind: 'INVOICE', status: 'SENT', total: 26, paid: 6 }], returnsOpen: 1, jobsOpen: 2, reserved: 40, creditsNotIssued: 1 });
  assert.equal(codes(p), 'CREDIT_NOT_ISSUED,JOB_OPEN,NOT_INVOICED,ON_DOCK,ON_ROAD,RETURN_OPEN,SHIPMENT_PROBLEM,STOCK_RESERVED,TO_SHIP,UNPAID');
  assert.equal(p.closed, false);
  assert.deepEqual(p.figures, { toShip: 40, notInvoiced: 20, shipmentsOnDock: 1, shipmentsOnRoad: 1, shipmentProblems: 1, deliveredWithoutProof: 0, balance: 20, creditOwedBack: 0, shippedAnything: true });
});
test('closeout: a complete order with one cent owed is not closed; half a cent of rounding is', () => {
  const owed = (paid) => closeoutPosition({ ...done, invoices: [{ kind: 'INVOICE', status: 'PARTIAL', total: 65, paid }] });
  assert.equal(owed(64.99).closed, false);
  assert.equal(owed(64.996).closed, true);
});
test('closeout: credit left on a credit memo is owed back and holds the order open', () => {
  const p = closeoutPosition({ ...done, invoices: [...done.invoices, { kind: 'CREDIT', status: 'SENT', total: -20, paid: -5 }] });
  assert.equal(codes(p), 'CREDIT_OWED'); assert.equal(p.figures.creditOwedBack, 15);
});
test('closeout: cancelled invoices and cancelled lines are left out', () => {
  const p = closeoutPosition({ status: 'COMPLETE', lines: [{ ordered: 100, shipped: 100, invoiced: 100 }, { ordered: 50, shipped: 0, invoiced: 0, cancelled: true }], shipments: [{ status: 'DELIVERED', podCaptured: true }, { status: 'CANCELLED' }], invoices: [{ kind: 'INVOICE', status: 'CANCELLED', total: 65, paid: 0 }, { kind: 'INVOICE', status: 'PAID', total: 65, paid: 65 }] });
  assert.equal(p.closed, true);
});
test('closeout: a cancelled order is closed only when nothing is left standing', () => {
  assert.equal(closeoutPosition({ status: 'CANCELLED', lines: [{ ordered: 100, shipped: 0, invoiced: 0 }] }).closed, true);
  const p = closeoutPosition({ status: 'CANCELLED', lines: [{ ordered: 100, shipped: 0, invoiced: 0 }], reserved: 100 });
  assert.equal(p.closed, false); assert.equal(codes(p), 'STOCK_RESERVED');
});
test('closeout: an unconfirmed order and an order on hold say so', () => {
  assert.equal(codes(closeoutPosition({ status: 'DRAFT', lines: [{ ordered: 10, shipped: 0 }] })), 'NOT_CONFIRMED,TO_SHIP');
  assert.ok(codes(closeoutPosition({ status: 'HOLD', lines: [{ ordered: 10, shipped: 0 }] })).includes('ON_HOLD'));
});
test('closeout: a delivery with no proof and no reason is a note, not an open item', () => {
  const p = closeoutPosition({ ...done, shipments: [{ status: 'DELIVERED', podCaptured: false, noPodReason: null }] });
  assert.equal(p.closed, true); assert.equal(p.figures.deliveredWithoutProof, 1); assert.equal(p.notes.length, 1);
  assert.equal(closeoutPosition({ ...done, shipments: [{ status: 'DELIVERED', podCaptured: false, noPodReason: 'Left at the gate' }] }).notes.length, 0);
});
test('closeout: a confirmed order with nothing on it yet is open, not closed', () => {
  const p = closeoutPosition({ status: 'CONFIRMED', lines: [] });
  assert.equal(p.closed, false); assert.equal(p.state, 'OPEN');
});

const NOW = new Date('2026-11-16T12:00:00Z');
const due = (days, extraMs = 0) => new Date(NOW.getTime() - days * 86_400_000 - extraMs);
test('aging: the five columns, in order', () => assert.deepEqual(AGING_COLUMNS, ['notDue', 'days1to30', 'days31to60', 'days61to90', 'over90']));
test('aging: not due until a whole day has passed', () => {
  assert.equal(agingBucket(null, NOW), 'notDue');
  assert.equal(agingBucket(due(-5), NOW), 'notDue');
  assert.equal(agingBucket(due(0), NOW), 'notDue');
  assert.equal(agingBucket(due(0, 86_399_000), NOW), 'notDue');
  assert.equal(agingBucket(due(1), NOW), 'days1to30');
});
test('aging: the edges of each column', () => {
  assert.equal(agingBucket(due(30), NOW), 'days1to30'); assert.equal(agingBucket(due(31), NOW), 'days31to60');
  assert.equal(agingBucket(due(60), NOW), 'days31to60'); assert.equal(agingBucket(due(61), NOW), 'days61to90');
  assert.equal(agingBucket(due(90), NOW), 'days61to90'); assert.equal(agingBucket(due(91), NOW), 'over90');
  assert.equal(agingBucket(due(4000), NOW), 'over90');
});

const alloc = (id, qty) => ({ id, qtyAllocated: qty });
test('pick plan: draws from the oldest reservation first, up to what the shipment carries', () => {
  const p = pickPlan([alloc('a', 300), alloc('b', 200)], 400);
  assert.deepEqual(p.rows.map((r) => [r.allocation.id, r.quantity]), [['a', 300], ['b', 100]]); assert.equal(p.short, 0);
});
test('pick plan: says how much is short when less is reserved than is going out', () => {
  const p = pickPlan([alloc('a', 120)], 500);
  assert.equal(p.rows.length, 1); assert.equal(p.short, 380);
});
test('pick plan: nothing reserved, nothing asked, and empty reservations', () => {
  assert.deepEqual(pickPlan([], 10), { rows: [], short: 10 });
  assert.deepEqual(pickPlan([alloc('a', 5)], 0), { rows: [], short: 0 });
  assert.deepEqual(pickPlan([alloc('a', 0), alloc('b', 7)], 7).rows.map((r) => r.allocation.id), ['b']);
});
test('pick plan: fractions do not leave a phantom shortage', () => {
  const p = pickPlan([alloc('a', 0.1), alloc('b', 0.2)], 0.3);
  assert.equal(p.short, 0); assert.equal(p.rows.reduce((a, r) => a + r.quantity, 0).toFixed(4), '0.3000');
});

const pkg = (over = {}) => ({ status: 'QC_RELEASED', qcStatus: 'RELEASED', orderId: 'o', orderLineId: 'l', packageItems: [{ grade: 'A36', form: 'PLATE', heatNumber: 'H1' }], ...over });
test('tagging: a released package on an order line with one grade and form has no problem', () => {
  assert.deepEqual(taggingProblems(pkg()), { errors: [], warnings: [], heats: ['H1'] });
});
test('tagging: a held or rejected package, an empty one, and one on no order line are refused', () => {
  assert.equal(taggingProblems(pkg({ qcStatus: 'HOLD' })).errors.length, 1);
  assert.equal(taggingProblems(pkg({ qcStatus: 'REJECTED' })).errors.length, 1);
  assert.equal(taggingProblems(pkg({ packageItems: [] })).errors.length, 1);
  assert.equal(taggingProblems(pkg({ orderLineId: null })).errors.length, 1);
  assert.ok(taggingProblems(pkg({ status: 'SEALED' })).errors[0].includes('SEALED'));
});
test('tagging: mixed grades or forms are refused; mixed heats are a warning and no heat is printed', () => {
  const mixed = taggingProblems(pkg({ packageItems: [{ grade: 'A36', form: 'PLATE', heatNumber: 'H1' }, { grade: '304', form: 'BAR', heatNumber: 'H2' }] }));
  assert.equal(mixed.errors.length, 2); assert.equal(mixed.warnings.length, 1); assert.deepEqual(mixed.heats, ['H1', 'H2']);
});

test('cost view: cost leaves stock items, stock records and movements, wherever they sit', () => {
  const out = withoutStockCost({ lines: [{ allocations: [{ coil: { coilNumber: 'C1', unitCost: 1, landedCost: 2, inventory: { qtyOnHand: 5, avgCost: 3, unitCost: 1 } } }] }], movements: [{ movementType: 'SHIP', unitCost: 4, qtyMoved: 9 }] });
  assert.deepEqual(out, { lines: [{ allocations: [{ coil: { coilNumber: 'C1', inventory: { qtyOnHand: 5 } } }] }], movements: [{ movementType: 'SHIP', qtyMoved: 9 }] });
});
test('cost view: other records keep a field of the same name, and the input is not changed', () => {
  const input = { poLine: { unitCost: 7 }, coil: { coilNumber: 'C', unitCost: 1 }, when: new Date(0), n: null, list: [1, 'a'] };
  const out = withoutStockCost(input);
  assert.equal(out.poLine.unitCost, 7); assert.equal('unitCost' in out.coil, false); assert.equal(input.coil.unitCost, 1);
  assert.equal(out.when, input.when); assert.equal(out.n, null); assert.deepEqual(out.list, [1, 'a']);
  assert.equal(withoutStockCost('text'), 'text'); assert.equal(withoutStockCost(undefined), undefined);
});

test('overlap: both ways the database reports it are recognised, and nothing else', () => {
  assert.equal(isOverlap({ code: 'P2034' }), true);
  assert.equal(isOverlap({ code: 'P2010', meta: { code: '40001' } }), true);
  assert.equal(isOverlap({ code: 'P2010', meta: { code: '40P01' } }), true);
  const unknown = (text) => Object.assign(new Error(text), { name: 'PrismaClientUnknownRequestError' });
  assert.equal(isOverlap(unknown('ConnectorError { kind: QueryError(PostgresError { code: "40P01", message: "deadlock detected" }) }')), true);
  assert.equal(isOverlap(unknown('PostgresError { code: "40001", message: "could not serialize access" }')), true);
  assert.equal(isOverlap(unknown('PostgresError { code: "23505", message: "duplicate key" }')), false);
  assert.equal(isOverlap(new Error('PostgresError { code: "40P01" }')), false, 'only from the database client');
  assert.equal(isOverlap({ code: 'P2010', meta: { code: '23505' } }), false);
  assert.equal(isOverlap({ code: 'P2002' }), false); assert.equal(isOverlap(null), false); assert.equal(isOverlap(new Error('x')), false);
});
test('overlap: a raw-statement overlap is run again and then succeeds; another error is not retried', async () => {
  let n = 0;
  const got = await retryOverlap(async () => { n += 1; if (n < 3) throw Object.assign(new Error('overlap'), { code: 'P2010', meta: { code: '40001' } }); return 'done'; });
  assert.equal(got, 'done'); assert.equal(n, 3);
  let m = 0;
  await assert.rejects(retryOverlap(async () => { m += 1; throw Object.assign(new Error('unique'), { code: 'P2002' }); }));
  assert.equal(m, 1);
  let k = 0;
  await assert.rejects(retryOverlap(async () => { k += 1; throw Object.assign(new Error('overlap'), { code: 'P2034' }); }, 2));
  assert.equal(k, 2);
});
