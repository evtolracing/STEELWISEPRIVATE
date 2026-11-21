// Time tracking: the clock records the screen reads, and the sums it shows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { entrySeconds as serverSeconds, clockOf, timeEntryQuery, timeEntryRow, TIME_ENTRY_MAX } from '../src/lib/timeEntries.js';
import { formatDuration, clockSeconds, entrySeconds, dayRange, localDay, filterEntries, summarize, choices, csvText } from '../../frontend/src/pages/timeTrackingRules.js';

const T = (h, m = 0, s = 0) => new Date(Date.UTC(2026, 10, 20, h, m, s));

test('an entry counts from its start to its end, and a running one up to now', () => {
  assert.equal(serverSeconds({ startAt: T(8), endAt: T(8, 30) }), 1800);
  assert.equal(serverSeconds({ startAt: T(8), endAt: null }, T(9)), 3600);
  assert.equal(serverSeconds({ startAt: T(9), endAt: T(8) }), 0);
  assert.equal(serverSeconds({}), 0);
});

test('the clock of a step is its closed time plus the open entry', () => {
  const clock = clockOf([{ startAt: T(8), endAt: T(8, 10) }, { startAt: T(9), endAt: null }], T(9, 5));
  assert.deepEqual(clock, { closedSeconds: 600, runningSince: T(9), totalSeconds: 900 });
  assert.deepEqual(clockOf([], T(9)), { closedSeconds: 0, runningSince: null, totalSeconds: 0 });
  // The screen counts on from what the server sent.
  assert.equal(clockSeconds({ closedSeconds: 600, runningSince: T(9).toISOString() }, T(9, 0, 30).getTime()), 630);
  assert.equal(clockSeconds({ closedSeconds: 600, runningSince: null }, T(10).getTime()), 600);
  assert.equal(clockSeconds(undefined, T(10).getTime()), 0);
});

test('the filter in the address becomes a database filter, and a bad value is refused', () => {
  const q = timeEntryQuery({ from: T(0).toISOString(), to: T(23).toISOString(), status: 'PAUSED', operatorId: 'o1', workCenterId: 'w1', locationId: 'L1' });
  assert.deepEqual(q.where, { startAt: { gte: T(0), lte: T(23) }, status: 'PAUSED', operatorId: 'o1', workCenterId: 'w1', dispatchOperation: { dispatchJob: { locationId: 'L1' } } });
  assert.equal(q.limit, 1000);
  assert.deepEqual(timeEntryQuery({}).where, {});
  assert.equal(timeEntryQuery({ limit: '999999' }).limit, TIME_ENTRY_MAX);
  assert.match(timeEntryQuery({ from: 'yesterday-ish' }).error, /dates/);
  assert.match(timeEntryQuery({ from: T(9).toISOString(), to: T(8).toISOString() }).error, /after/);
  assert.match(timeEntryQuery({ status: 'DONE' }).error, /status/);
});

const LOG = {
  id: 't1', status: 'PAUSED', startAt: T(8), endAt: T(8, 20), downtimeReason: 'Blade change', operatorId: 'o1', workCenterId: 'w1', dispatchOperationId: 'op1',
  dispatchOperation: { id: 'op1', name: 'Saw cut', sequence: 1, status: 'IN_PROCESS', materialCode: null, dispatchJob: { jobId: 'job1', jobNumber: 'JOB-00075', locationId: 'L1', customerName: 'Acme', materialCode: 'A36', location: { name: 'Detroit Branch - Bay A' }, order: { orderNumber: 'SO-00078' } } },
};

test('a row carries names a person reads, not ids', () => {
  const row = timeEntryRow(LOG, { operators: [{ id: 'o1', firstName: 'Dana', lastName: 'Reyes' }], workCenters: [{ id: 'w1', name: 'KASTO 2' }] }, T(12));
  assert.equal(row.operatorName, 'Dana Reyes');
  assert.equal(row.workCenterName, 'KASTO 2');
  assert.equal(row.locationName, 'Detroit Branch - Bay A');
  assert.equal(row.jobNumber, 'JOB-00075');
  assert.equal(row.jobId, 'job1');
  assert.equal(row.orderNumber, 'SO-00078');
  assert.equal(row.operationName, 'Saw cut');
  assert.equal(row.materialCode, 'A36');
  assert.equal(row.durationSeconds, 1200);
  assert.equal(row.running, false);
  assert.equal(row.stopReason, 'Blade change');
});

test('a row for someone no longer on file, or a running clock, still reads properly', () => {
  const row = timeEntryRow({ ...LOG, endAt: null, status: 'RUNNING', downtimeReason: null }, {}, T(8, 1));
  assert.equal(row.operatorName, null);
  assert.equal(row.workCenterName, null);
  assert.equal(row.running, true);
  assert.equal(row.durationSeconds, 60);
  const bare = timeEntryRow({ id: 't9', status: 'COMPLETE', startAt: T(8), endAt: T(9), dispatchOperationId: 'opX' }, {}, T(12));
  assert.equal(bare.operationId, 'opX');
  assert.equal(bare.jobNumber, null);
});

test('durations read as hours, minutes and seconds', () => {
  assert.equal(formatDuration(3725), '1h 2m 5s');
  assert.equal(formatDuration(119), '1m 59s');
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(undefined), '0s');
  assert.equal(formatDuration(-5), '0s');
});

test('the date range is the whole of both days in the viewer\'s own time zone', () => {
  const { from, to } = dayRange('2026-11-14', '2026-11-21');
  assert.equal(new Date(from).getTime(), new Date(2026, 10, 14, 0, 0, 0, 0).getTime());
  assert.equal(new Date(to).getTime(), new Date(2026, 10, 21, 23, 59, 59, 999).getTime());
  assert.deepEqual(dayRange('', 'nonsense'), { from: null, to: null });
  assert.equal(localDay(0, new Date(2026, 10, 21, 23, 30)), '2026-11-21');
  assert.equal(localDay(7, new Date(2026, 10, 3, 0, 30)), '2026-10-27');
});

const ROWS = [
  { id: 'a', operationId: 'op1', operationStatus: 'COMPLETE', status: 'PAUSED', running: false, startAt: T(8).toISOString(), endAt: T(8, 20).toISOString(), durationSeconds: 1200, stopReason: 'Blade change', operatorId: 'o1', operatorName: 'Dana Reyes', workCenterId: 'w1', workCenterName: 'KASTO 2', locationId: 'L1', locationName: 'Bay A', jobNumber: 'JOB-1', orderNumber: 'SO-1', customerName: 'Acme "East", Inc.', operationName: 'Saw cut' },
  { id: 'b', operationId: 'op1', operationStatus: 'COMPLETE', status: 'COMPLETE', running: false, startAt: T(9).toISOString(), endAt: T(9, 40).toISOString(), durationSeconds: 2400, stopReason: null, operatorId: 'o1', operatorName: 'Dana Reyes', workCenterId: 'w1', workCenterName: 'KASTO 2', locationId: 'L1', locationName: 'Bay A', jobNumber: 'JOB-1', operationName: 'Saw cut' },
  { id: 'c', operationId: 'op2', operationStatus: 'IN_PROCESS', status: 'PAUSED', running: false, startAt: T(10).toISOString(), endAt: T(10, 10).toISOString(), durationSeconds: 600, stopReason: null, operatorId: 'o2', operatorName: 'Lee Park', workCenterId: 'w2', workCenterName: 'Shear 1', locationId: 'L2', locationName: 'Jackson', jobNumber: 'JOB-2', operationName: 'Shear' },
  { id: 'd', operationId: 'op3', operationStatus: 'IN_PROCESS', status: 'RUNNING', running: true, startAt: T(11).toISOString(), endAt: null, durationSeconds: 5, stopReason: null, operatorId: null, operatorName: null, workCenterId: 'w2', workCenterName: 'Shear 1', locationId: 'L2', locationName: 'Jackson', jobNumber: '=JOB-3', operationName: 'Shear' },
];
const NOW = T(11, 30).getTime();

test('a running entry counts up to now on screen; a closed one is what the server said', () => {
  assert.equal(entrySeconds(ROWS[3], NOW), 1800);
  assert.equal(entrySeconds(ROWS[0], NOW), 1200);
});

test('the cards add up the entries on screen', () => {
  const s = summarize(ROWS, NOW);
  assert.equal(s.totalSeconds, 1200 + 2400 + 600 + 1800);
  assert.equal(s.entryCount, 4);
  assert.equal(s.stepCount, 3);
  assert.equal(s.finishedSteps, 1);
  assert.equal(s.averageFinishedSeconds, 3600); // both entries of the finished step
  assert.equal(s.runningCount, 1);
  assert.equal(s.onHoldCount, 1); // op2 only: op1 was paused once but is finished
  assert.equal(s.stopCount, 1);
  assert.equal(s.operatorCount, 2);
  assert.deepEqual(s.byOperator.map((g) => [g.name, g.seconds, g.entries, g.steps, g.share]), [['Dana Reyes', 3600, 2, 1, 60], ['No operator recorded', 1800, 1, 1, 30], ['Lee Park', 600, 1, 1, 10]]);
  assert.deepEqual(s.byWorkCenter.map((g) => [g.name, g.seconds]), [['KASTO 2', 3600], ['Shear 1', 2400]]);
  const none = summarize([], NOW);
  assert.equal(none.totalSeconds, 0);
  assert.deepEqual(none.byOperator, []);
});

test('filters narrow the entries, and the filter lists come from the entries', () => {
  assert.deepEqual(filterEntries(ROWS, { locationId: 'L2' }).map((r) => r.id), ['c', 'd']);
  assert.deepEqual(filterEntries(ROWS, { operatorId: 'o1', status: 'COMPLETE' }).map((r) => r.id), ['b']);
  assert.deepEqual(filterEntries(ROWS, { workCenterId: 'w2', status: 'RUNNING' }).map((r) => r.id), ['d']);
  assert.equal(filterEntries(ROWS, {}).length, 4);
  assert.deepEqual(choices(ROWS, 'operatorId', 'operatorName'), [{ id: 'o1', name: 'Dana Reyes' }, { id: 'o2', name: 'Lee Park' }]);
  assert.deepEqual(choices(ROWS, 'locationId', 'locationName'), [{ id: 'L1', name: 'Bay A' }, { id: 'L2', name: 'Jackson' }]);
});

test('the CSV keeps quotes and commas inside one cell, gives hours as a number, and does not run formulas', () => {
  const lines = csvText(ROWS, NOW, (iso) => iso || '').split('\r\n');
  assert.equal(lines.length, 5);
  assert.equal(lines[0], '"Job","Order","Customer","Step","Work center","Branch","Operator","Status","Started","Ended","Hours","Time","Stop reason"');
  assert.ok(lines[1].includes('"Acme ""East"", Inc."'));
  assert.ok(lines[1].includes('"0.33","20m 0s","Blade change"'));
  assert.ok(lines[4].startsWith('"\'=JOB-3"'));
  assert.ok(lines[4].includes('"RUNNING"') && lines[4].includes('"0.50","30m 0s"'));
});
