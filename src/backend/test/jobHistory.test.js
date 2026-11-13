import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveRecord, buildHistory, JOB_MOVED, JOB_ASSIGNED } from '../src/lib/jobHistory.js';
import { workOrderMoveError, WO_STATUSES } from '../src/lib/workOrderRules.js';

const job = { id: 'j1', jobNumber: 'JOB-000001', createdAt: '2026-01-01T08:00:00Z', createdBy: { firstName: 'Ann', lastName: 'Lee' } };
const row = (eventType, timestamp, details, user) => ({ eventType, timestamp, details, user });

test('a move record names the job, both statuses, the note and who', () => {
  const r = moveRecord({ job, from: 'SCHEDULED', to: 'IN_PROCESS', note: '  saw is free  ', via: 'start', userId: 'u1' });
  assert.equal(r.category, 'WORKFLOW');
  assert.equal(r.eventType, JOB_MOVED);
  assert.equal(r.resourceType, 'Job');
  assert.equal(r.resourceId, 'j1');
  assert.equal(r.userId, 'u1');
  assert.deepEqual(r.details, { jobNumber: 'JOB-000001', from: 'SCHEDULED', to: 'IN_PROCESS', note: 'saw is free', via: 'start' });
});

test('a note is trimmed to 500 characters and an empty one is stored as null', () => {
  assert.equal(moveRecord({ job, from: 'A', to: 'ON_HOLD', note: 'x'.repeat(900) }).details.note.length, 500);
  assert.equal(moveRecord({ job, from: 'A', to: 'ON_HOLD', note: '   ' }).details.note, null);
  assert.equal(moveRecord({ job, from: 'A', to: 'ON_HOLD', note: { $ne: 1 } }).details.note, null);
});

test('history lists recorded moves in order with who made them', () => {
  const h = buildHistory(job, [
    row(JOB_MOVED, '2026-01-02T09:00:00Z', { from: 'SCHEDULED', to: 'IN_PROCESS', note: 'go' }, { firstName: 'Bo', lastName: 'Ray' }),
    row(JOB_MOVED, '2026-01-02T11:00:00Z', { from: 'IN_PROCESS', to: 'ON_HOLD', note: 'blade' }, { email: 'c@x.test' }),
  ]);
  assert.deepEqual(h.map((e) => e.type), ['CREATED', 'STATUS', 'STATUS']);
  assert.equal(h[0].by, 'Ann Lee');
  assert.deepEqual([h[1].from, h[1].status, h[1].by, h[1].note], ['SCHEDULED', 'IN_PROCESS', 'Bo Ray', 'go']);
  assert.equal(h[2].by, 'c@x.test');
  assert.ok(h.every((e) => e.recorded));
});

test('a job with no recorded moves falls back to its timestamps and says nobody is on record', () => {
  const old = { ...job, actualStart: '2026-01-03T08:00:00Z', actualEnd: '2026-01-03T12:00:00Z', shippedAt: '2026-01-04T08:00:00Z', shippingCarrier: 'ACME', trackingNumber: 'T1' };
  const h = buildHistory(old, []);
  assert.deepEqual(h.map((e) => e.status), [null, 'IN_PROCESS', 'READY_TO_SHIP', 'SHIPPED']);
  assert.ok(h.slice(1).every((e) => e.recorded === false && e.by === null));
  assert.match(h[3].note, /ACME - T1/);
});

test('timestamps are not used once any move is recorded, so nothing is listed twice', () => {
  const started = { ...job, actualStart: '2026-01-03T08:00:00Z' };
  const h = buildHistory(started, [row(JOB_MOVED, '2026-01-03T08:00:00Z', { from: 'SCHEDULED', to: 'IN_PROCESS' }, null)]);
  assert.equal(h.filter((e) => e.status === 'IN_PROCESS').length, 1);
});

test('an assignment names the person, or says the assignment was removed', () => {
  const h = buildHistory(job, [
    row(JOB_ASSIGNED, '2026-01-02T09:00:00Z', { to: 'u2' }, null),
    row(JOB_ASSIGNED, '2026-01-02T10:00:00Z', { to: null }, null),
  ], { u2: 'Dee Fox' });
  assert.equal(h[1].note, 'Assigned to Dee Fox');
  assert.equal(h[2].note, 'Assignment removed');
});

test('a work order moves forward only', () => {
  assert.equal(workOrderMoveError('DRAFT', 'IN_PROGRESS'), null);
  assert.equal(workOrderMoveError('READY', 'IN_PROGRESS'), null);
  assert.equal(workOrderMoveError('IN_PROGRESS', 'COMPLETE'), null);
  assert.match(workOrderMoveError('DRAFT', 'COMPLETE'), /cannot be made complete/);
  assert.match(workOrderMoveError('IN_PROGRESS', 'IN_PROGRESS'), /already in progress/);
  assert.match(workOrderMoveError('IN_PROGRESS', 'READY'), /cannot be made ready/);
  assert.match(workOrderMoveError('DRAFT', 'NONSENSE'), /Unknown work order status/);
});

test('a finished or cancelled work order cannot be changed to anything', () => {
  for (const to of WO_STATUSES) {
    if (to !== 'COMPLETE') assert.match(workOrderMoveError('COMPLETE', to), /completed work order cannot be changed/);
    if (to !== 'CANCELLED') assert.match(workOrderMoveError('CANCELLED', to), /cancelled work order cannot be changed/);
  }
});
