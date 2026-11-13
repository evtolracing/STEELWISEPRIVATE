// Run with: npm test   (Node's built-in test runner, no extra packages)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orderMoveError, jobMoveError, shipmentMoveError, positiveQty, lineStatusFor, orderStatusFromLines,
  ORDER_STATUSES, JOB_STATUSES, SHIPPABLE_ORDER_STATUSES,
} from '../src/lib/workflowRules.js';

test('orders: normal path is allowed', () => {
  assert.equal(orderMoveError('DRAFT', 'PENDING'), null);
  assert.equal(orderMoveError('DRAFT', 'CONFIRMED'), null);
  assert.equal(orderMoveError('PENDING', 'CONFIRMED'), null);
  assert.equal(orderMoveError('CONFIRMED', 'HOLD'), null);
  assert.equal(orderMoveError('HOLD', 'CONFIRMED'), null);
  assert.equal(orderMoveError('CONFIRMED', 'CANCELLED'), null);
});

test('orders: PARTIAL and COMPLETE can never be set by hand', () => {
  for (const from of ORDER_STATUSES) {
    for (const to of ['PARTIAL', 'COMPLETE']) {
      if (from !== to) assert.ok(orderMoveError(from, to), `${from} → ${to} must be refused`);
    }
  }
});

test('orders: cancelled and completed orders are final', () => {
  for (const to of ORDER_STATUSES) {
    if (to !== 'CANCELLED') assert.ok(orderMoveError('CANCELLED', to), `CANCELLED → ${to}`);
    if (to !== 'COMPLETE') assert.ok(orderMoveError('COMPLETE', to), `COMPLETE → ${to}`);
  }
});

test('orders: a partly shipped order cannot be cancelled, held or reopened', () => {
  for (const to of ['CANCELLED', 'HOLD', 'DRAFT', 'PENDING', 'CONFIRMED']) assert.ok(orderMoveError('PARTIAL', to), `PARTIAL → ${to}`);
});

test('orders: unknown status and going backwards from confirmed are refused', () => {
  assert.match(orderMoveError('DRAFT', 'BANANA'), /Unknown/);
  assert.ok(orderMoveError('CONFIRMED', 'DRAFT'));
  assert.ok(orderMoveError('CONFIRMED', 'PENDING'));
});

test('orders: only confirmed or partly shipped orders can ship', () => {
  assert.deepEqual([...SHIPPABLE_ORDER_STATUSES].sort(), ['CONFIRMED', 'PARTIAL']);
});

test('jobs: the shop-floor path is allowed in order', () => {
  const path = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'];
  for (let i = 0; i < path.length - 1; i++) assert.equal(jobMoveError(path[i], path[i + 1]), null, `${path[i]} → ${path[i + 1]}`);
});

test('jobs: board moves between working columns stay possible (rework, hold)', () => {
  assert.equal(jobMoveError('WAITING_QC', 'IN_PROCESS'), null);
  assert.equal(jobMoveError('PACKAGING', 'WAITING_QC'), null);
  assert.equal(jobMoveError('IN_PROCESS', 'ON_HOLD'), null);
  assert.equal(jobMoveError('ON_HOLD', 'IN_PROCESS'), null);
  assert.equal(jobMoveError('SCHEDULED', 'CANCELLED'), null);
});

test('jobs: work that never started cannot be shipped or completed', () => {
  for (const from of ['ORDERED', 'SCHEDULED']) for (const to of ['SHIPPED', 'COMPLETED']) assert.ok(jobMoveError(from, to), `${from} → ${to}`);
});

test('jobs: finished, cancelled and shipped jobs are locked', () => {
  for (const to of JOB_STATUSES) {
    if (to !== 'CANCELLED') assert.ok(jobMoveError('CANCELLED', to), `CANCELLED → ${to}`);
    if (to !== 'COMPLETED') assert.ok(jobMoveError('COMPLETED', to), `COMPLETED → ${to}`);
    if (!['SHIPPED', 'COMPLETED'].includes(to)) assert.ok(jobMoveError('SHIPPED', to), `SHIPPED → ${to}`);
  }
  assert.equal(jobMoveError('SHIPPED', 'COMPLETED'), null);
});

test('jobs: a ready job cannot go back to not-started, and unknown statuses are refused', () => {
  assert.ok(jobMoveError('READY_TO_SHIP', 'SCHEDULED'));
  assert.ok(jobMoveError('READY_TO_SHIP', 'ORDERED'));
  assert.match(jobMoveError('IN_PROCESS', 'BANANA'), /Invalid status/);
  assert.match(jobMoveError('IN_PROCESS', undefined), /Invalid status/);
});

test('shipments: dock → road → delivered, and nothing after delivery', () => {
  assert.equal(shipmentMoveError('PENDING', 'LOADING'), null);
  assert.equal(shipmentMoveError('PENDING', 'IN_TRANSIT'), null);
  assert.equal(shipmentMoveError('LOADING', 'IN_TRANSIT'), null);
  assert.equal(shipmentMoveError('IN_TRANSIT', 'DELIVERED'), null);
  assert.equal(shipmentMoveError('IN_TRANSIT', 'EXCEPTION'), null);
  assert.equal(shipmentMoveError('EXCEPTION', 'DELIVERED'), null);
  for (const to of ['PENDING', 'LOADING', 'IN_TRANSIT', 'EXCEPTION', 'CANCELLED', 'DELIVERED']) assert.ok(shipmentMoveError('DELIVERED', to), `DELIVERED → ${to}`);
});

test('shipments: cannot deliver before leaving, dispatch twice, or cancel on the road', () => {
  assert.ok(shipmentMoveError('PENDING', 'DELIVERED'));
  assert.ok(shipmentMoveError('LOADING', 'DELIVERED'));
  assert.ok(shipmentMoveError('IN_TRANSIT', 'IN_TRANSIT'));
  assert.ok(shipmentMoveError('IN_TRANSIT', 'CANCELLED'));
  assert.ok(shipmentMoveError('CANCELLED', 'IN_TRANSIT'));
  assert.match(shipmentMoveError('PENDING', 'TELEPORTED'), /Unknown/);
});

test('positiveQty accepts only finite numbers above zero', () => {
  assert.equal(positiveQty(5), 5);
  assert.equal(positiveQty('12.5'), 12.5);
  for (const bad of [0, -1, '-3', 'abc', '', ' ', null, undefined, NaN, Infinity, {}, [], true]) assert.equal(positiveQty(bad), null, String(bad));
});

test('line and order status follow shipped quantity', () => {
  assert.equal(lineStatusFor(100, 0), 'OPEN');
  assert.equal(lineStatusFor(100, 40), 'PARTIAL');
  assert.equal(lineStatusFor(100, 100), 'COMPLETE');
  assert.equal(lineStatusFor(0.3, 0.1 + 0.2), 'COMPLETE'); // floating point noise
  assert.equal(orderStatusFromLines(['OPEN', 'OPEN']), null);
  assert.equal(orderStatusFromLines(['PARTIAL', 'OPEN']), 'PARTIAL');
  assert.equal(orderStatusFromLines(['COMPLETE', 'OPEN']), 'PARTIAL');
  assert.equal(orderStatusFromLines(['COMPLETE', 'COMPLETE']), 'COMPLETE');
  assert.equal(orderStatusFromLines(['COMPLETE', 'CANCELLED']), 'COMPLETE');
  assert.equal(orderStatusFromLines(['CANCELLED']), null);
  assert.equal(orderStatusFromLines([]), null);
});
