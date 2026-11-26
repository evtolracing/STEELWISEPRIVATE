// The order of the cards in a column of the Production Workflow board, and what dragging a card does
// (owner, 2026-11-25). Pure rules: lib/boardOrder.js on the server, components/production/boardMoves.js on the screen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrangeRows, boardOrderError, positionsFor, BOARD_ORDER_MAX } from '../src/lib/boardOrder.js';
import { boardMove, backInProduction, moveChoices, reorder, nudge, matchesSearch, currentPlanStep } from '../../frontend/src/components/production/boardMoves.js';

const STAGES = ['NOT_PLANNED', 'NO_MACHINE', 'QUEUED', 'RUNNING', 'STEPS_DONE', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'ON_HOLD'];
const ids = (rows) => rows.map((r) => r.id).join(',');

test('arranged cards come first in their order, the rest follow as the server sorted them', () => {
  const rows = [{ id: 'a', stage: 'QUEUED' }, { id: 'b', stage: 'QUEUED' }, { id: 'c', stage: 'QUEUED' }, { id: 'd', stage: 'QUEUED' }];
  const out = arrangeRows(rows, [{ jobId: 'd', stage: 'QUEUED', position: 1000 }, { jobId: 'b', stage: 'QUEUED', position: 2000 }]);
  assert.equal(ids(out), 'd,b,a,c');
  assert.deepEqual(out.map((r) => r.boardPosition), [1000, 2000, null, null]);
});

test('a place counts only in the stage it was given in', () => {
  const rows = [{ id: 'a', stage: 'RUNNING' }, { id: 'b', stage: 'RUNNING' }];
  const out = arrangeRows(rows, [{ jobId: 'b', stage: 'QUEUED', position: 1 }]);
  assert.equal(ids(out), 'a,b');
  assert.equal(out[1].boardPosition, null);
});

test('with no places the server order is kept and nothing is changed in the rows given', () => {
  const rows = [{ id: 'a', stage: 'QUEUED' }, { id: 'b', stage: 'QUEUED' }];
  assert.equal(ids(arrangeRows(rows, [])), 'a,b');
  assert.equal(rows[0].boardPosition, undefined);
});

test('a column order is refused in words when it cannot be used', () => {
  assert.equal(boardOrderError('QUEUED', ['a', 'b'], STAGES), null);
  assert.match(boardOrderError('NOWHERE', ['a'], STAGES), /column/);
  assert.match(boardOrderError('QUEUED', [], STAGES), /new order/);
  assert.match(boardOrderError('QUEUED', 'a', STAGES), /new order/);
  assert.match(boardOrderError('QUEUED', ['a', 'a'], STAGES), /twice/);
  assert.match(boardOrderError('QUEUED', ['a', 7], STAGES), /id/);
  assert.match(boardOrderError('QUEUED', Array.from({ length: BOARD_ORDER_MAX + 1 }, (_, i) => `j${i}`), STAGES), /more than 500/);
});

test('a column never arranged is numbered afresh, top to bottom', () => {
  assert.deepEqual(positionsFor('QUEUED', ['c', 'a', 'b'], []), [
    { jobId: 'c', stage: 'QUEUED', position: 1000 }, { jobId: 'a', stage: 'QUEUED', position: 2000 }, { jobId: 'b', stage: 'QUEUED', position: 3000 }]);
});

test('a column already arranged hands the same places out again, so jobs not shown keep theirs among them', () => {
  const existing = [{ jobId: 'a', stage: 'QUEUED', position: 1000 }, { jobId: 'b', stage: 'QUEUED', position: 3000 }, { jobId: 'hidden', stage: 'QUEUED', position: 2000 }];
  assert.deepEqual(positionsFor('QUEUED', ['b', 'a'], existing).map((p) => [p.jobId, p.position]), [['b', 1000], ['a', 3000]]);
});

test('a place from another stage, or a shared place, does not count: the list is numbered afresh', () => {
  assert.deepEqual(positionsFor('QUEUED', ['a', 'b'], [{ jobId: 'a', stage: 'RUNNING', position: 5 }, { jobId: 'b', stage: 'QUEUED', position: 9 }]).map((p) => p.position), [1000, 2000]);
  assert.deepEqual(positionsFor('QUEUED', ['a', 'b'], [{ jobId: 'a', stage: 'QUEUED', position: 5 }, { jobId: 'b', stage: 'QUEUED', position: 5 }]).map((p) => p.position), [1000, 2000]);
});

const job = (stage, extra = {}) => ({ id: 'j', stage, stepCount: 2, planSteps: [{ status: 'SCHEDULED' }, { status: 'PENDING' }], ...extra });

test('dropping a card in its own column arranges it', () => {
  for (const s of STAGES) assert.deepEqual(boardMove(job(s), s), { kind: 'arrange' });
});

test('a job not planned is planned when dragged into production, and can be put on hold', () => {
  const j = job('NOT_PLANNED', { stepCount: 0, planSteps: [] });
  for (const to of ['NO_MACHINE', 'QUEUED', 'RUNNING', 'STEPS_DONE']) assert.equal(boardMove(j, to).kind, 'plan');
  assert.deepEqual(boardMove(j, 'ON_HOLD'), { kind: 'status', status: 'ON_HOLD' });
});

test('waiting for a machine to queued picks a machine; queued back takes it off', () => {
  assert.equal(boardMove(job('NO_MACHINE'), 'QUEUED').kind, 'machine');
  assert.equal(boardMove(job('QUEUED'), 'NO_MACHINE').kind, 'unmachine');
});

test('starting and finishing a step are refused, and say where they are done', () => {
  assert.match(boardMove(job('QUEUED'), 'RUNNING').why, /started at its machine on the Shop Floor/);
  assert.match(boardMove(job('NO_MACHINE'), 'RUNNING').why, /Shop Floor/);
  assert.match(boardMove(job('RUNNING'), 'STEPS_DONE').why, /finished at their machines/);
  assert.match(boardMove(job('RUNNING'), 'QUEUED').why, /being worked now/);
  assert.match(boardMove(job('QUEUED'), 'NOT_PLANNED').why, /Change plan/);
  assert.match(boardMove(job('STEPS_DONE'), 'QUEUED').why, /Every step of this job is finished/);
  assert.equal(boardMove(job('QUEUED'), 'SOMEWHERE').kind, 'refuse');
  assert.equal(boardMove(null, 'QUEUED').kind, 'refuse');
});

test('a drag to QC, packaging, ready to ship or on hold asks the server for that status', () => {
  for (const to of ['WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'ON_HOLD']) assert.deepEqual(boardMove(job('STEPS_DONE'), to), { kind: 'status', status: to });
  assert.deepEqual(boardMove(job('WAITING_QC'), 'PACKAGING'), { kind: 'status', status: 'PACKAGING' });
});

test('a job put back into production takes the status its plan and its work give it', () => {
  assert.equal(backInProduction({ stepCount: 0, planSteps: [] }), 'ORDERED');
  assert.equal(backInProduction(job('ON_HOLD')), 'SCHEDULED');
  assert.equal(backInProduction(job('ON_HOLD', { planSteps: [{ status: 'COMPLETE' }, { status: 'PENDING' }] })), 'IN_PROCESS');
  assert.equal(backInProduction(job('ON_HOLD', { planSteps: [{ status: 'PAUSED' }] })), 'IN_PROCESS');
  assert.deepEqual(boardMove(job('ON_HOLD'), 'QUEUED'), { kind: 'status', status: 'SCHEDULED', back: true });
  assert.deepEqual(boardMove(job('ON_HOLD', { stepCount: 0, planSteps: [] }), 'NOT_PLANNED'), { kind: 'status', status: 'ORDERED', back: true });
});

test('the Move to buttons are the columns a drag would not refuse', () => {
  const stages = STAGES.map((key) => ({ key, label: key }));
  assert.deepEqual(moveChoices(job('QUEUED'), stages).map((s) => s.key), ['NO_MACHINE', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'ON_HOLD']);
  assert.deepEqual(moveChoices(job('RUNNING'), stages).map((s) => s.key), ['WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'ON_HOLD']);
});

test('a card is put before the card it was dropped on, or at the end', () => {
  assert.deepEqual(reorder(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b']);
  assert.deepEqual(reorder(['a', 'b', 'c'], 'a', 'c'), ['b', 'a', 'c']);
  assert.deepEqual(reorder(['a', 'b', 'c'], 'a', null), ['b', 'c', 'a']);
  assert.deepEqual(reorder(['a', 'b', 'c'], 'b', 'b'), ['a', 'c', 'b']);
  assert.deepEqual(reorder(['a', 'b'], 'zz', 'a'), ['a', 'b']);
});

test('top, up, down and bottom move one card and keep the same list when they cannot', () => {
  const list = ['a', 'b', 'c'];
  assert.deepEqual(nudge(list, 'c', 'top'), ['c', 'a', 'b']);
  assert.deepEqual(nudge(list, 'b', 'up'), ['b', 'a', 'c']);
  assert.deepEqual(nudge(list, 'b', 'down'), ['a', 'c', 'b']);
  assert.deepEqual(nudge(list, 'a', 'bottom'), ['b', 'c', 'a']);
  assert.equal(nudge(list, 'a', 'up'), list);
  assert.equal(nudge(list, 'c', 'down'), list);
  assert.equal(nudge(list, 'zz', 'up'), list);
});

test('the search looks at the job, order, customer, step and machine', () => {
  const j = { jobNumber: 'JOB-12', orderNumber: 'SO-900', customerName: 'Acme Steel', stepName: 'Cut to length', workCenterName: 'Saw 2' };
  for (const q of ['job-12', 'so-9', 'acme', 'cut to', 'saw 2', '', '   ']) assert.equal(matchesSearch(j, q), true, q);
  assert.equal(matchesSearch(j, 'laser'), false);
  assert.equal(matchesSearch({ jobNumber: 'JS-1', workOrders: [{ woNumber: 'WO-00179', stockNumber: 'C-12' }] }, 'wo-00179'), true);
  assert.equal(matchesSearch({ jobNumber: 'JS-1', workOrders: [{ woNumber: 'WO-00179', stockNumber: 'C-12' }] }, 'c-12'), true);
});

test('the step a job is on is the running one, else the first not finished', () => {
  assert.equal(currentPlanStep({ planSteps: [{ status: 'COMPLETE', name: 'a' }, { status: 'SCHEDULED', name: 'b' }, { status: 'IN_PROCESS', name: 'c' }] }).name, 'c');
  assert.equal(currentPlanStep({ planSteps: [{ status: 'COMPLETE', name: 'a' }, { status: 'PENDING', name: 'b' }] }).name, 'b');
  assert.equal(currentPlanStep({ planSteps: [] }), null);
});
