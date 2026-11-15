import test from 'node:test';
import assert from 'node:assert/strict';
import { readShipment, readArrival } from '../src/lib/transfers.js';
import { reservationProblem, unitKey } from '../src/lib/reservationRules.js';
import { readReceipt } from '../src/lib/receivingRules.js';

const refusal = (fn) => { try { fn(); } catch (e) { return e; } return null; };

test('a transfer names where it goes and lists each item once (G-007)', () => {
  assert.deepEqual(readShipment({ toLocationId: 'b', coilIds: ['x', 'y'], carrier: ' Own truck ' }), { toLocationId: 'b', coilIds: ['x', 'y'], carrier: 'Own truck', reference: null, notes: null });
  assert.equal(refusal(() => readShipment({ coilIds: ['x'] })).status, 400);
  assert.equal(refusal(() => readShipment({ toLocationId: 'b' })).status, 400);
  assert.match(refusal(() => readShipment({ toLocationId: 'b', coilIds: ['x', 'x'] })).message, /twice/);
  assert.equal(refusal(() => readShipment({ toLocationId: 'b', coilIds: Array.from({ length: 101 }, (_, i) => `c${i}`) })).status, 400);
});

const lines = [{ id: 'l1', coilId: 'c1', qtyShipped: '1000', unit: 'LB' }, { id: 'l2', coilId: 'c2', qtyShipped: '500', unit: 'LB' }];

test('a receipt that says nothing received everything in good order', () => {
  const got = readArrival({}, lines);
  assert.deepEqual(got.map((a) => [a.coilId, a.qtyReceived, a.condition]), [['c1', 1000, 'GOOD'], ['c2', 500, 'GOOD']]);
});

test('short, missing and damaged are named, and each needs a note', () => {
  const got = readArrival({ lines: [{ coilId: 'c1', qtyReceived: 940, notes: 'Scale ticket 940' }, { coilId: 'c2', condition: 'NOT_RECEIVED', notes: 'Not on the truck' }] }, lines);
  assert.deepEqual(got.map((a) => [a.qtyReceived, a.condition]), [[940, 'SHORT'], [0, 'NOT_RECEIVED']]);
  assert.match(refusal(() => readArrival({ lines: [{ coilId: 'c1', qtyReceived: 900 }] }, lines)).message, /note/);
  assert.equal(readArrival({ lines: [{ coilId: 'c1', condition: 'DAMAGED', notes: 'Edge crushed by forks' }] }, lines)[0].condition, 'DAMAGED');
});

test('a receipt cannot add weight, count an item twice, or name an item not on the transfer', () => {
  assert.equal(refusal(() => readArrival({ lines: [{ coilId: 'c1', qtyReceived: 1001 }] }, lines)).status, 409);
  assert.match(refusal(() => readArrival({ lines: [{ coilId: 'c1' }, { lineId: 'l1' }] }, lines)).message, /twice/);
  assert.match(refusal(() => readArrival({ lines: [{ coilId: 'zz' }] }, lines)).message, /not on this transfer/);
  assert.match(refusal(() => readArrival({ lines: [{ coilId: 'c1', condition: 'GOOD', qtyReceived: 10, notes: 'xxxxx' }] }, lines)).message, /does not match/);
  assert.equal(refusal(() => readArrival({ lines: [{ coilId: 'c1', qtyReceived: -1 }] }, lines)).status, 400);
});

const line = { lineNumber: 1, unit: 'LB', gradeId: 'g36', gradeCode: 'A36', thicknessIn: 0.25, widthIn: 36, lengthIn: 96 };
const coil = { coilNumber: 'T-1', gradeId: 'g36', gradeCode: 'A36', thicknessIn: 0.25, widthIn: 48, lengthIn: 120, ownerId: 'house' };
const stock = { unit: 'LB', status: 'ACTIVE' };
const ok = (over = {}) => reservationProblem({ line, order: { buyerId: 'cust1' }, coil, inventory: stock, houseOrgIds: ['house'], ...over });

test('stock that fits the line may be reserved', () => {
  assert.equal(ok(), null);
  assert.equal(unitKey('lbs'), 'LB');
  assert.equal(unitKey('EACH'), unitKey('pcs'));
});

test('a reservation that cannot be kept is refused with the reason', () => {
  assert.equal(ok({ inventory: { ...stock, status: 'IN_TRANSIT' } }).code, 'IN_TRANSIT');
  assert.equal(ok({ line: { ...line, unit: 'EACH' } }).code, 'UNIT_MISMATCH');
  assert.equal(ok({ coil: { ...coil, gradeId: 'g304', gradeCode: '304' } }).code, 'GRADE_MISMATCH');
  assert.equal(ok({ coil: { ...coil, widthIn: 30 } }).code, 'SIZE_MISMATCH');
  assert.equal(ok({ coil: { ...coil, ownerId: 'cust2', ownerName: 'Other Co' } }).code, 'OWNER_MISMATCH');
  assert.equal(ok({ coil: { ...coil, ownerId: 'cust1' } }), null, 'customer-owned material may be reserved for its owner');
});

test('thickness is checked only against a tolerance the line gives', () => {
  assert.equal(ok({ coil: { ...coil, thicknessIn: 0.2391 } }), null);
  assert.equal(ok({ line: { ...line, thkTolerancePlus: 0.01, thkToleranceMinus: 0.01 }, coil: { ...coil, thicknessIn: 0.2391 } }).code, 'SIZE_MISMATCH');
  assert.equal(ok({ line: { ...line, thkTolerancePlus: 0.01, thkToleranceMinus: 0.015 }, coil: { ...coil, thicknessIn: 0.2391 } }), null);
});

test('shelf goods are received by the piece with no heat or grade, against a product (C-011)', () => {
  const { receipt, error } = readReceipt({ coilNumber: 'GLV-1', form: 'SUPPLY', pieces: 10, productSku: 'GLOVE-L', locationCode: 'QA-L01' });
  assert.equal(error, null);
  assert.equal(receipt.unit, 'EA');
  assert.equal(receipt.quantity, 10);
  assert.equal(receipt.weightLb, 0);
  assert.match(readReceipt({ coilNumber: 'GLV-1', form: 'SUPPLY', productSku: 'GLOVE-L', locationCode: 'QA-L01' }).error, /piece/);
  assert.match(readReceipt({ coilNumber: 'GLV-1', form: 'SUPPLY', pieces: 2, locationCode: 'QA-L01' }).error, /product/);
  assert.match(readReceipt({ coilNumber: 'GLV-1', form: 'SUPPLY', pieces: 2.5, productSku: 'G', locationCode: 'QA-L01' }).error, /whole number/);
  assert.match(readReceipt({ coilNumber: 'P-1', form: 'PLATE', weightLb: 10, locationCode: 'QA-L01' }).error, /heat or lot/, 'metal still needs its heat');
});

test('a receipt can name the purchase order line it fills', () => {
  const { receipt } = readReceipt({ coilNumber: 'P-1', form: 'PLATE', heatNumber: 'H1', gradeCode: 'A36', weightLb: 1000, locationCode: 'QA-L01', poLineId: 'line-1' });
  assert.equal(receipt.poLineId, 'line-1');
  assert.equal(receipt.unit, 'LB');
  assert.equal(receipt.quantity, 1000);
});
