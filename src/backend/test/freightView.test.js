import test from 'node:test';
import assert from 'node:assert/strict';
import { boardColumns, exceptionRows, isLate, routeLine, daysToPromise } from '../../frontend/src/pages/Freight/freightView.js';

const now = new Date(2026, 10, 23, 10, 0, 0);
const day = (n) => new Date(2026, 10, 23 + n, 9, 0, 0).toISOString();
const ship = (shipmentNumber, status, more = {}) => ({ shipmentNumber, status, ...more });

test('late means still on the dock after its scheduled day', () => {
  assert.equal(isLate(ship('A', 'PENDING', { scheduledDate: day(-1) }), now), true);
  assert.equal(isLate(ship('A', 'LOADING', { scheduledDate: day(0) }), now), false, 'today is not late');
  assert.equal(isLate(ship('A', 'IN_TRANSIT', { scheduledDate: day(-3) }), now), false, 'it has left');
  assert.equal(isLate(ship('A', 'PENDING'), now), false, 'no scheduled day on file');
});

test('the board groups real shipments by status and keeps a week of deliveries', () => {
  const cols = boardColumns([
    ship('P', 'PENDING'), ship('L', 'LOADING'), ship('T', 'IN_TRANSIT'),
    ship('D1', 'DELIVERED', { deliveredAt: day(-2) }), ship('D2', 'DELIVERED', { deliveredAt: day(-9) }), ship('D3', 'DELIVERED'),
    ship('C', 'CANCELLED'), ship('X', 'EXCEPTION'), ship('Z', 'LOST'),
  ], now);
  assert.deepEqual(Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, v.map((s) => s.shipmentNumber)])),
    { PENDING: ['P'], LOADING: ['L'], IN_TRANSIT: ['T'], DELIVERED: ['D1'] });
  assert.deepEqual(boardColumns(undefined, now), { PENDING: [], LOADING: [], IN_TRANSIT: [], DELIVERED: [] });
});

test('the exception list gives each shipment its reason, worst first', () => {
  const rows = exceptionRows([
    ship('S5', 'DELIVERED', { podCaptured: false, noPodReason: null }),
    ship('S6', 'DELIVERED', { podCaptured: true }),
    ship('S7', 'DELIVERED', { podCaptured: false, noPodReason: 'Left at gate' }),
    ship('S3', 'PENDING', { scheduledDate: day(-2) }),
    ship('S4', 'PENDING', { scheduledDate: day(2) }),
    ship('S2', 'EXCEPTION'), ship('S1', 'LOST'), ship('S8', 'IN_TRANSIT'), ship('S9', 'CANCELLED'),
  ], now);
  assert.deepEqual(rows.map((r) => [r.shipment.shipmentNumber, r.kind, r.severity]),
    [['S1', 'LOST', 'error'], ['S2', 'EXCEPTION', 'error'], ['S3', 'LATE', 'warning'], ['S5', 'NO_POD', 'warning']]);
  assert.deepEqual(exceptionRows([], now), []);
});

test('the route line says what is on file and what is not', () => {
  assert.equal(routeLine({ fromLocation: { code: 'CT', name: 'Charlotte' }, order: { buyer: { city: 'Lansing', state: 'MI' } } }), 'CT Charlotte to Lansing, MI');
  assert.equal(routeLine({ order: { buyer: {} } }), 'No branch on file to no delivery town on file');
});

test('days to the promised date', () => {
  assert.equal(daysToPromise({ promisedDate: day(3) }, now), 3);
  assert.equal(daysToPromise({ promisedDate: day(-1) }, now), -1);
  assert.equal(daysToPromise({ promisedDate: day(0) }, now), 0);
  assert.equal(daysToPromise({}, now), null);
});
