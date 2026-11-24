// Production screens: where a job is, how far it has got, and the counts (owner's audit, 2026-11-21).
import test from 'node:test';
import assert from 'node:assert/strict';
import { currentStep, jobStage, orderDivision, productionRow, filterRows, stageCounts, machineCounts, bookedMachineId, planLights, STAGES } from '../src/lib/productionView.js';
import { byStage, startingBranch, stepText, startOfLocalDay, scheduleMachineId, bookedShare, boardCounts, isOverdue, stepLight, lightsSummary } from '../../frontend/src/components/production/productionView.js';
import { jobAtBranch } from '../src/routes/jobs.js';

const step = (sequence, status, wc = null) => ({ sequence, status, name: `Step ${sequence}`, assignedWorkCenterId: wc?.id || null, assignedWorkCenter: wc });
const BAY = { id: 'L1', name: 'Detroit Bay A' };
const JAX = { id: 'L2', name: 'Jackson' };
const SAW = { id: 'w1', name: 'KASTO 2', locationId: 'L1', location: BAY, capabilities: { division: 'METALS' } };
const ROUTER = { id: 'w2', name: 'Router #1', locationId: 'L2', location: JAX, capabilities: { division: 'PLASTICS' } };

test('the current step is the running one, else the first not finished', () => {
  assert.equal(currentStep([step(2, 'PENDING'), step(1, 'COMPLETE'), step(3, 'IN_PROCESS')]).sequence, 3);
  assert.equal(currentStep([step(2, 'PENDING'), step(1, 'COMPLETE'), step(3, 'PENDING')]).sequence, 2);
  assert.equal(currentStep([step(1, 'COMPLETE')]), null);
  assert.equal(currentStep([]), null);
});

test('the stage follows the job status and its steps', () => {
  assert.equal(jobStage({ status: 'SCHEDULED' }, []), 'NOT_PLANNED');
  assert.equal(jobStage({ status: 'ORDERED' }, [step(1, 'PENDING')]), 'NO_MACHINE');
  assert.equal(jobStage({ status: 'SCHEDULED' }, [step(1, 'SCHEDULED', SAW)]), 'QUEUED');
  assert.equal(jobStage({ status: 'IN_PROCESS' }, [step(1, 'COMPLETE', SAW), step(2, 'PENDING')]), 'NO_MACHINE');
  assert.equal(jobStage({ status: 'IN_PROCESS' }, [step(1, 'IN_PROCESS', SAW)]), 'RUNNING');
  assert.equal(jobStage({ status: 'IN_PROCESS' }, [step(1, 'COMPLETE', SAW)]), 'STEPS_DONE');
  assert.equal(jobStage({ status: 'WAITING_QC' }, [step(1, 'COMPLETE', SAW)]), 'WAITING_QC');
  assert.equal(jobStage({ status: 'ON_HOLD' }, []), 'ON_HOLD');
  for (const s of ['SHIPPED', 'COMPLETED', 'CANCELLED']) assert.equal(jobStage({ status: s }, []), null);
});

test('the division of an intake order comes from its notes', () => {
  assert.equal(orderDivision(JSON.stringify({ __intakeMeta__: { division: 'PLASTICS' } })), 'PLASTICS');
  assert.equal(orderDivision('plain text'), null);
  assert.equal(orderDivision(null), null);
});

const order = { orderNumber: 'SO-00078', locationId: 'L2', location: JAX, notes: JSON.stringify({ __intakeMeta__: { division: 'METALS' } }), buyer: { name: 'Acme' } };

test('a planned job is at the branch of its plan, on the machine of its current step', () => {
  const row = productionRow({ id: 'j1', jobNumber: 'JOB-00078-1', status: 'IN_PROCESS', orderId: 'o1', order,
    dispatchJob: { locationId: 'L1', location: BAY, division: 'METALS', operations: [step(1, 'COMPLETE', ROUTER), step(2, 'SCHEDULED', SAW)] } });
  assert.equal(row.locationId, 'L1');
  assert.equal(row.locationName, 'Detroit Bay A');
  assert.equal(row.workCenterName, 'KASTO 2');
  assert.equal(row.stage, 'QUEUED');
  assert.equal(row.division, 'METALS');
  assert.equal(row.customerName, 'Acme');
  assert.equal(row.orderNumber, 'SO-00078');
  assert.equal(row.stepsDone, 1);
  assert.equal(row.stepCount, 2);
});

test('an unplanned job is at the branch that sold the order, with the order\'s division', () => {
  const row = productionRow({ id: 'j2', jobNumber: 'JOB-00079-1', status: 'ORDERED', order, workCenter: null, dispatchJob: null });
  assert.equal(row.locationId, 'L2');
  assert.equal(row.division, 'METALS');
  assert.equal(row.stage, 'NOT_PLANNED');
  assert.equal(row.workCenterId, null);
  // With an old machine field set and no plan, the machine's branch and division count.
  const old = productionRow({ id: 'j3', jobNumber: 'JOB-00010', status: 'IN_PROCESS', order, workCenter: ROUTER, dispatchJob: null });
  assert.equal(old.locationId, 'L2');
  assert.equal(old.division, 'PLASTICS');
  assert.equal(old.workCenterName, 'Router #1');
  // A job with no order, plan or machine has no branch: it is not put at one.
  const none = productionRow({ id: 'j4', jobNumber: 'J-DEMO-010', status: 'SCHEDULED' });
  assert.equal(none.locationId, null);
  assert.equal(none.division, null);
});

const rows = [
  { id: 'a', stage: 'NOT_PLANNED', locationId: 'L1', division: 'METALS', workCenterId: null },
  { id: 'b', stage: 'QUEUED', locationId: 'L1', division: 'METALS', workCenterId: 'w1' },
  { id: 'c', stage: 'RUNNING', locationId: 'L2', division: 'PLASTICS', workCenterId: 'w2' },
  { id: 'd', stage: 'WAITING_QC', locationId: 'L1', division: 'METALS', workCenterId: null },
  { id: 'e', stage: null, locationId: 'L1', division: 'METALS', workCenterId: null },
];

test('branch, division and machine filters narrow the jobs', () => {
  assert.deepEqual(filterRows(rows, { locationId: 'L1' }).map((r) => r.id), ['a', 'b', 'd', 'e']);
  assert.deepEqual(filterRows(rows, { division: 'PLASTICS' }).map((r) => r.id), ['c']);
  assert.deepEqual(filterRows(rows, { locationId: 'L1', workCenterId: 'w1' }).map((r) => r.id), ['b']);
  assert.equal(filterRows(rows, {}).length, 5);
});

test('counts by stage: every stage present, jobs in production, open jobs', () => {
  const c = stageCounts(filterRows(rows, { locationId: 'L1' }));
  assert.equal(c.NOT_PLANNED, 1);
  assert.equal(c.QUEUED, 1);
  assert.equal(c.RUNNING, 0);
  assert.equal(c.WAITING_QC, 1);
  assert.equal(c.inProduction, 2);
  assert.equal(c.open, 3);
  for (const s of STAGES) assert.equal(typeof c[s.key], 'number');
});

test('per machine: queued and running only for jobs in production; done counts only since the start of the day', () => {
  const since = '2026-11-21T08:00:00.000Z';
  const m = machineCounts([{ id: 'w1' }, { id: 'w2' }], [
    { assignedWorkCenterId: 'w1', status: 'SCHEDULED', jobStatus: 'SCHEDULED' },
    { assignedWorkCenterId: 'w1', status: 'SCHEDULED', jobStatus: 'ON_HOLD' },
    { assignedWorkCenterId: 'w1', status: 'IN_PROCESS', jobStatus: 'IN_PROCESS' },
    { assignedWorkCenterId: 'w1', status: 'IN_PROCESS', jobStatus: 'CANCELLED' },
    { assignedWorkCenterId: 'w1', status: 'COMPLETE', actualEnd: '2026-11-21T09:00:00.000Z', jobStatus: 'SHIPPED' },
    { assignedWorkCenterId: 'w1', status: 'COMPLETE', actualEnd: '2026-11-20T09:00:00.000Z', jobStatus: 'SHIPPED' },
    { assignedWorkCenterId: 'w9', status: 'SCHEDULED', jobStatus: 'SCHEDULED' },
  ], since);
  assert.deepEqual(m.w1, { queued: 1, running: 1, doneToday: 1 });
  assert.deepEqual(m.w2, { queued: 0, running: 0, doneToday: 0 });
  assert.equal(m.w9, undefined);
});

test('a job is found at a branch by its plan, else its machine, else its order', () => {
  assert.deepEqual(jobAtBranch('L1'), { OR: [
    { dispatchJob: { locationId: 'L1' } },
    { dispatchJob: { is: null }, workCenter: { locationId: 'L1' } },
    { dispatchJob: { is: null }, workCenterId: null, order: { locationId: 'L1' } },
  ] });
});

test('screen helpers: columns by stage, the starting branch, the step text, the start of the day', () => {
  const cols = byStage(rows, STAGES);
  assert.deepEqual(cols.NOT_PLANNED.map((r) => r.id), ['a']);
  assert.deepEqual(cols.ON_HOLD, []);
  assert.equal(Object.keys(cols).length, STAGES.length);
  const locs = [{ id: 'L1' }, { id: 'L2' }];
  assert.equal(startingBranch(locs, { topBarBranchId: 'L2', homeLocationId: 'L1' }), 'L2');
  assert.equal(startingBranch(locs, { topBarBranchId: 'GONE', homeLocationId: 'L1' }), 'L1');
  assert.equal(startingBranch(locs, {}), 'L1');
  assert.equal(startingBranch([], { homeLocationId: 'L1' }), '');
  assert.equal(stepText({ stepCount: 0 }), 'No route yet');
  assert.equal(stepText({ stepCount: 2, stepName: 'Saw', stepSequence: 2 }), 'Saw, step 2 of 2');
  assert.equal(stepText({ stepCount: 2, stepName: null }), 'All 2 steps done');
  const start = new Date(startOfLocalDay(new Date(2026, 10, 21, 15, 30)));
  assert.equal(start.getTime(), new Date(2026, 10, 21).getTime());
});

test('the Schedule books a job on the machine of its current step, not the old field on the job', () => {
  const job = { workCenterId: 'OLD' };
  assert.equal(bookedMachineId(job, []), 'OLD', 'no plan yet: the old field');
  assert.equal(bookedMachineId(job, [step(1, 'COMPLETE', SAW), step(2, 'SCHEDULED', ROUTER)]), 'w2');
  assert.equal(bookedMachineId(job, [step(1, 'IN_PROCESS', SAW), step(2, 'PENDING')]), 'w1');
  assert.equal(bookedMachineId(job, [step(1, 'COMPLETE', SAW), step(2, 'PENDING')]), null, 'next step on no machine');
  assert.equal(bookedMachineId(job, [step(1, 'COMPLETE', SAW), step(2, 'COMPLETE', ROUTER)]), 'w2', 'all done: the last machine');
  assert.equal(scheduleMachineId({ workCenterId: 'OLD', bookedWorkCenterId: 'w2' }), 'w2');
  assert.equal(scheduleMachineId({ workCenterId: 'OLD', bookedWorkCenterId: null }), null);
  assert.equal(scheduleMachineId({ workCenterId: 'OLD' }), 'OLD');
});

test('booked share counts only the part of a job inside the day grid (6 AM to 4 PM)', () => {
  const day = new Date(2026, 10, 21);
  const at = (h, d = 21) => new Date(2026, 10, d, h).toISOString();
  assert.equal(bookedShare([{ scheduledStart: at(8), scheduledEnd: at(13) }], day), 50);
  assert.equal(bookedShare([{ scheduledStart: at(8) }], day), 20, 'no end: two hours');
  assert.equal(bookedShare([{ scheduledStart: at(0, 20), scheduledEnd: at(0, 25) }], day), 100, 'a long job fills the grid, no more');
  assert.equal(bookedShare([{ scheduledStart: at(17), scheduledEnd: at(20) }], day), 0, 'after the grid');
  assert.equal(bookedShare([{ scheduledStart: at(5), scheduledEnd: at(7) }], day), 10, 'only the hour inside');
  assert.equal(bookedShare([{}], day), 0);
});

test('the Order Board counts open jobs apart from the recently finished ones it shows', () => {
  const now = new Date('2026-11-21T12:00:00Z');
  const late = '2026-11-01T00:00:00Z';
  const jobs = [
    { status: 'ORDERED', priority: 'HOT', dueDate: late },
    { status: 'SCHEDULED' },
    { status: 'IN_PROCESS', dueDate: '2026-12-01T00:00:00Z' },
    { status: 'SHIPPED', priority: 'HOT', dueDate: late },
    { status: 'COMPLETED', dueDate: late },
    { status: 'CANCELLED' },
    { status: 'ON_HOLD', dueDate: late },
  ];
  assert.deepEqual(boardCounts(jobs, now), { open: 4, finished: 3, hot: 1, overdue: 2, inProgress: 1 });
  assert.deepEqual(boardCounts([], now), { open: 0, finished: 0, hot: 0, overdue: 0, inProgress: 0 });
  assert.equal(isOverdue({ status: 'SHIPPED', dueDate: late }, now), false, 'a shipped job is never late');
  assert.equal(isOverdue({ status: 'ORDERED', dueDate: late }, now), true);
});

// The lights on a job's card: one per plan step, in order, lit by status (owner, 2026-11-22).
test('the card lights are the plan steps in order, each with its name, status and machine', () => {
  const lights = planLights([step(3, 'PENDING'), step(1, 'COMPLETE', SAW), step(2, 'IN_PROCESS', ROUTER)]);
  assert.deepEqual(lights, [
    { sequence: 1, detail: null, name: 'Step 1', status: 'COMPLETE', machine: 'KASTO 2', machineId: 'w1' },
    { sequence: 2, detail: null, name: 'Step 2', status: 'IN_PROCESS', machine: 'Router #1', machineId: 'w2' },
    { sequence: 3, detail: null, name: 'Step 3', status: 'PENDING', machine: null, machineId: null },
  ]);
  assert.deepEqual(planLights([]), []);
  assert.deepEqual(productionRow({ id: 'j', status: 'IN_PROCESS', dispatchJob: { operations: [step(1, 'IN_PROCESS', SAW)] } }).planSteps, [{ sequence: 1, detail: null, name: 'Step 1', status: 'IN_PROCESS', machine: 'KASTO 2', machineId: 'w1' }]);
});

test('each light is lit by its status, and the row says in words where the job is', () => {
  assert.equal(stepLight({ status: 'COMPLETE' }).tone, 'done');
  assert.equal(stepLight({ status: 'IN_PROCESS' }).tone, 'running');
  assert.equal(stepLight({ status: 'SCHEDULED' }).tone, 'queued');
  assert.equal(stepLight({ status: 'PENDING' }).tone, 'waiting');
  assert.equal(stepLight({ status: 'SOMETHING_NEW' }).tone, 'waiting');
  const steps = [{ name: 'First cut', status: 'COMPLETE' }, { name: 'Second cut', status: 'IN_PROCESS' }, { name: 'Deburr', status: 'PENDING' }];
  assert.equal(lightsSummary(steps), 'Step 2 of 3 running: Second cut');
  assert.equal(lightsSummary([steps[0], { name: 'Deburr', status: 'SCHEDULED' }]), 'Step 2 of 2 queued at its machine: Deburr');
  assert.equal(lightsSummary([steps[0]]), 'All 1 step finished');
  assert.equal(lightsSummary([]), 'No plan yet');
});
