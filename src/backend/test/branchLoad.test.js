import test from 'node:test';
import assert from 'node:assert/strict';
import { branchLoad, branchKeyFor } from '../src/lib/branchLoad.js';
import { buildSuggestions } from '../src/routes/demandShaping.js';

const now = new Date('2026-11-23T12:00:00Z');
const at = (h) => new Date(now.getTime() + h * 3600000).toISOString();
const step = (from, to, status = 'PENDING') => ({ status, scheduledStart: from === null ? null : at(from), scheduledEnd: to === null ? null : at(to) });

test('load is the booked hours of the week against the machines\' hours', () => {
  // Two machines: 2 x 10 h x 5 days = 100 hours. 20 hours booked = 0.2, one working day in the queue.
  const out = branchLoad({ machines: 2, now, steps: [step(1, 9), step(24, 36), step(2, 4, 'COMPLETE'), step(null, null)] });
  assert.deepEqual(out, { machines: 2, bookedHours: 18, unscheduledSteps: 1, load: 0.18, queueDays: 0.9 });
});

test('only the part of a step inside the next seven days counts, at no more than ten hours a day', () => {
  // Started 5 hours ago, ends in 5: half of its 10 hours is still ahead.
  assert.equal(branchLoad({ machines: 1, now, steps: [step(-5, 5)] }).bookedHours, 5);
  // Entirely in the past, or beyond the week: nothing.
  assert.equal(branchLoad({ machines: 1, now, steps: [step(-10, -2), step(200, 210)] }).bookedHours, 0);
  // A step booked across three days is on the machine for three working days, not 72 hours.
  assert.equal(branchLoad({ machines: 1, now, steps: [step(0, 72)] }).bookedHours, 30);
  // An end before its start is not a booking.
  assert.equal(branchLoad({ machines: 1, now, steps: [step(5, 2)] }).unscheduledSteps, 1);
});

test('a branch with no machine has no load figure', () => {
  assert.deepEqual(branchLoad({ machines: 0, now, steps: [step(1, 3)] }), { machines: 0, bookedHours: 2, unscheduledSteps: 0, load: null, queueDays: null });
});

test('a branch is found by id, code or name, and a made-up one is not', () => {
  const branches = [{ id: 'id-ct', code: 'CT', name: 'Charlotte' }, { id: 'id-bc', code: 'BC', name: 'Battle Creek' }];
  assert.equal(branchKeyFor(branches, 'id-ct'), 'CT');
  assert.equal(branchKeyFor(branches, 'bc'), 'BC');
  assert.equal(branchKeyFor(branches, 'BATTLE_CREEK'), 'BC');
  assert.equal(branchKeyFor(branches, 'loc-1'), null);
  assert.equal(branchKeyFor(branches, 'JACKSON'), null);
  assert.equal(branchKeyFor(branches, ''), null);
});

const tables = {
  highLoadThreshold: 0.8,
  dateShiftDiscounts: [{ daysLater: 1, pct: 2, label: '+1 day' }, { daysLater: 2, pct: 4, label: '+2 days' }, { daysLater: 3, pct: 5, label: '+3 days' }],
  offPeakWindows: [{ label: 'Tues–Wed next week', pctOff: 3, daysOut: 5 }], nonRushSavings: {}, consolidatePct: 2,
};
const types = (list) => list.map((s) => s.type);

test('a busy branch is offered a quieter real branch; a branch with no figure is never the answer', () => {
  const branches = {
    CT: { id: 'id-ct', name: 'Charlotte', load: 0.9, queueDays: 4.5 },
    BC: { id: 'id-bc', name: 'Battle Creek', load: 0.3, queueDays: 1.5 },
    PV: { id: 'id-pv', name: 'Potterville', load: null, queueDays: null },
  };
  const out = buildSuggestions({ branchKey: 'CT', lines: [] }, { ...tables, branches }, null, now);
  const alt = out.find((s) => s.type === 'ALT_BRANCH');
  assert.equal(alt.altBranchId, 'id-bc');
  assert.deepEqual(alt.actionPayload, { field: 'location', value: 'BC' });
  assert.match(alt.description, /Battle Creek is at 30% capacity/);
  assert.ok(types(out).includes('OFF_PEAK') && types(out).includes('ALT_DATE'));
});

test('a branch that is not on file, or has no load figure, is not called busy', () => {
  const branches = { CT: { id: 'id-ct', name: 'Charlotte', load: 0.95, queueDays: 4.8 }, PV: { id: 'id-pv', name: 'Potterville', load: null, queueDays: null } };
  // Before this fix an unknown branch was treated as the first branch on the list, busy or not.
  assert.deepEqual(types(buildSuggestions({ branchKey: null, lines: [] }, { ...tables, branches }, null, now)), []);
  assert.deepEqual(types(buildSuggestions({ branchKey: 'PV', lines: [] }, { ...tables, branches }, null, now)), []);
  assert.deepEqual(types(buildSuggestions({ branchKey: 'CT', lines: [] }, { ...tables, branches }, null, now)).sort(), ['ALT_DATE', 'ALT_DATE', 'OFF_PEAK']);
});
