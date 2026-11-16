// Phase 7: rules for shop-floor work, the dispatch engine and the job planner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  qualityReleaseError, owesInspection, openStepsError, operationStartError, operationCompleteError, operationPauseError,
  workCenterEligibility, operatorEligibility, inspectionPassBlockers, skillExpired,
} from '../src/lib/productionRules.js';
import { planAssignments, workCenterMismatch, operatorMismatch, skillMeets } from '../src/lib/dispatchPlan.js';
import { planSchedule, minutesPerDay, jobBranch, estimateOf, clockAt, applyError } from '../src/lib/capacityPlan.js';

const at = (s) => new Date(s);
const insp = (status, when, n = 'INS-1') => ({ inspectionNumber: n, status, completedAt: when ? at(when) : null, createdAt: at(when || '2026-01-01') });

test('quality gate: a job waiting for inspection is not released without a passed inspection', () => {
  assert.match(qualityReleaseError({ from: 'WAITING_QC', to: 'READY_TO_SHIP', inspections: [] }), /waiting for inspection/);
  assert.match(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [] }), /waiting for inspection/);
  assert.equal(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [insp('PASSED', '2026-01-02')] }), null);
  assert.equal(qualityReleaseError({ from: 'WAITING_QC', to: 'IN_PROCESS', inspections: [] }), null, 'going back to the floor is not a release');
  assert.equal(qualityReleaseError({ from: 'IN_PROCESS', to: 'READY_TO_SHIP', inspections: [] }), null, 'a job never sent to inspection keeps the present rule');
});

test('quality gate: a failed inspection blocks release from any status until a later one passes', () => {
  const failed = [insp('FAILED', '2026-01-02')];
  for (const from of ['ON_HOLD', 'SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING']) {
    for (const to of ['PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED']) {
      if (from === to) continue;
      assert.match(qualityReleaseError({ from, to, inspections: failed }), /failed/, `${from} to ${to}`);
    }
  }
  assert.equal(qualityReleaseError({ from: 'ON_HOLD', to: 'SCHEDULED', inspections: failed }), null);
  assert.equal(qualityReleaseError({ from: 'ON_HOLD', to: 'CANCELLED', inspections: failed }), null);
  assert.equal(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [...failed, insp('PASSED', '2026-01-03', 'INS-2')] }), null);
  assert.match(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [insp('PASSED', '2026-01-01'), insp('FAILED', '2026-01-03', 'INS-2')] }), /INS-2 failed/);
  assert.equal(owesInspection(failed), true);
  assert.equal(owesInspection([]), false);
  assert.equal(owesInspection([insp('PASSED', '2026-01-02')]), false);
});

test('quality gate: an open inspection blocks release, and an old pass does not cover a new visit to inspection', () => {
  assert.match(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [insp('IN_PROGRESS', null, 'INS-9')] }), /INS-9 is open/);
  assert.match(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [insp('PASSED', '2026-01-02')], enteredQcAt: at('2026-01-05') }), /new inspection/);
  assert.equal(qualityReleaseError({ from: 'WAITING_QC', to: 'PACKAGING', inspections: [insp('PASSED', '2026-01-06')], enteredQcAt: at('2026-01-05') }), null);
});

test('planned steps: a job cannot leave production with a step unfinished', () => {
  const ops = [{ sequence: 1, name: 'Saw', status: 'COMPLETE' }, { sequence: 2, name: 'Deburr', status: 'PENDING' }];
  assert.match(openStepsError({ from: 'IN_PROCESS', to: 'READY_TO_SHIP', operations: ops }), /1 planned step not finished \(step 2: Deburr\)/);
  assert.match(openStepsError({ from: 'IN_PROCESS', to: 'WAITING_QC', operations: ops }), /not finished/);
  assert.equal(openStepsError({ from: 'IN_PROCESS', to: 'ON_HOLD', operations: ops }), null);
  assert.equal(openStepsError({ from: 'IN_PROCESS', to: 'CANCELLED', operations: ops }), null);
  assert.equal(openStepsError({ from: 'IN_PROCESS', to: 'READY_TO_SHIP', operations: ops.map((o) => ({ ...o, status: 'COMPLETE' })) }), null);
  assert.equal(openStepsError({ from: 'IN_PROCESS', to: 'READY_TO_SHIP', operations: [] }), null, 'a job with no plan keeps the present rule');
  assert.equal(openStepsError({ from: 'WAITING_QC', to: 'PACKAGING', operations: ops }), null, 'the gate is at the door out of production');
});

test('operations: start, pause and finish follow the step and the job', () => {
  const s1 = { id: 'a', sequence: 1, name: 'Saw', status: 'PENDING' };
  const s2 = { id: 'b', sequence: 2, name: 'Deburr', status: 'PENDING' };
  assert.equal(operationStartError({ operation: s1, siblings: [s1, s2], jobStatus: 'SCHEDULED' }), null);
  assert.match(operationStartError({ operation: s2, siblings: [s1, s2], jobStatus: 'SCHEDULED' }), /Step 1 \(Saw\) is not finished/);
  assert.equal(operationStartError({ operation: s2, siblings: [s1, s2], jobStatus: 'SCHEDULED', inOrder: false }), null);
  assert.equal(operationStartError({ operation: s2, siblings: [{ ...s1, status: 'COMPLETE' }, s2], jobStatus: 'IN_PROCESS' }), null);
  assert.match(operationStartError({ operation: { ...s1, status: 'COMPLETE' }, siblings: [], jobStatus: 'IN_PROCESS' }), /already finished/);
  assert.equal(operationStartError({ operation: { ...s1, status: 'IN_PROCESS' }, siblings: [], jobStatus: 'IN_PROCESS' }), null, 'resuming a paused step');
  for (const st of ['CANCELLED', 'SHIPPED', 'COMPLETED', 'ON_HOLD', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP']) {
    assert.ok(operationStartError({ operation: s1, siblings: [s1], jobStatus: st }), st);
  }
  assert.match(operationCompleteError(s1), /has not been started/);
  assert.match(operationCompleteError({ ...s1, status: 'SCHEDULED' }), /has not been started/);
  assert.equal(operationCompleteError({ ...s1, status: 'IN_PROCESS' }), null);
  assert.equal(operationCompleteError({ ...s1, status: 'COMPLETE' }), null);
  assert.match(operationPauseError(s1, false), /not running/);
  assert.match(operationPauseError({ ...s1, status: 'IN_PROCESS' }, false), /not running/);
  assert.equal(operationPauseError({ ...s1, status: 'IN_PROCESS' }, true), null);
});

test('who may work a step: the right kind of work center and an active operator, at the job branch', () => {
  const op = { requiredWorkCenterType: 'SAW' };
  const wc = { name: 'Saw 1', type: 'SAW', isActive: true, locationId: 'L1' };
  assert.equal(workCenterEligibility(wc, op, 'L1'), null);
  assert.match(workCenterEligibility(wc, op, 'L2'), /another branch/);
  assert.match(workCenterEligibility({ ...wc, type: 'SHEAR' }, op, 'L1'), /needs a SAW/);
  assert.match(workCenterEligibility({ ...wc, type: null }, op, 'L1'), /no stated type/);
  assert.match(workCenterEligibility({ ...wc, isActive: false }, op, 'L1'), /not active/);
  assert.match(workCenterEligibility(null, op, 'L1'), /not on file/);
  const now = at('2026-06-01');
  const person = { firstName: 'Pat', lastName: 'Lee', isActive: true, status: 'ACTIVE', homeLocationId: 'L1', skills: [] };
  assert.equal(operatorEligibility(person, op, 'L1', now), null, 'no certification on file does not refuse');
  assert.match(operatorEligibility(person, op, 'L2', now), /another branch/);
  assert.match(operatorEligibility({ ...person, status: 'SUSPENDED' }, op, 'L1', now), /not active \(suspended\)/);
  assert.match(operatorEligibility({ ...person, isActive: false }, op, 'L1', now), /not active/);
  assert.match(operatorEligibility({ ...person, skills: [{ workCenterTypeId: 'SAW', expiresAt: at('2026-05-01') }] }, op, 'L1', now), /certification expired on 2026-05-01/);
  assert.equal(operatorEligibility({ ...person, skills: [{ workCenterTypeId: 'SAW', expiresAt: at('2026-07-01') }] }, op, 'L1', now), null);
  assert.equal(operatorEligibility({ ...person, skills: [{ workCenterTypeId: 'SHEAR', expiresAt: at('2026-05-01') }] }, op, 'L1', now), null, 'another type does not matter');
  assert.equal(skillExpired({ expiresAt: null }, now), false);
});

test('an inspection is not passed outright with a failed required check or a measurement out of tolerance', () => {
  assert.deepEqual(inspectionPassBlockers([{ item: 'Dimensions', required: true, result: 'PASS' }], []), []);
  assert.deepEqual(inspectionPassBlockers([{ item: 'Dimensions', required: true, result: 'FAIL' }], []), ['"Dimensions" failed']);
  assert.deepEqual(inspectionPassBlockers([{ item: 'Coil ID', required: false, result: 'FAIL' }], []), []);
  assert.deepEqual(inspectionPassBlockers(null, [{ dimension: 'Width', pass: false }, { dimension: 'Length', pass: true }, { dimension: 'x', pass: null }]), ['Width is out of tolerance']);
});

test('dispatch engine: skill levels include ADVANCED, limits are checked only when on file', () => {
  assert.equal(skillMeets('STANDARD', 'ADVANCED'), true);
  assert.equal(skillMeets('ADVANCED', 'STANDARD'), false);
  assert.equal(skillMeets('ADVANCED', 'EXPERT'), true);
  assert.equal(skillMeets('EXPERT', 'ADVANCED'), false);
  const op = { requiredWorkCenterType: 'SAW', requiredDivision: 'METALS', thickness: 2 };
  assert.equal(workCenterMismatch({ type: 'SAW', capacity: {}, capabilities: [] }, op), null, 'no limit on file: not checked');
  assert.equal(workCenterMismatch({ type: null, capacity: {} }, op), 'no type stated');
  assert.match(workCenterMismatch({ type: 'SAW', capacity: { maxThicknessInches: 1 } }, op), /too thin/);
  assert.equal(workCenterMismatch({ type: 'SAW', capacity: { division: 'PLASTICS' }, capabilities: [] }, op), 'another division');
  assert.equal(workCenterMismatch({ type: 'SAW', capacity: { division: 'PLASTICS' }, capabilities: ['METALS'] }, op), null);
  assert.equal(workCenterMismatch({ type: 'SAW', isActive: false }, op), 'offline');
  assert.match(workCenterMismatch({ type: 'SAW', capabilities: [] }, { ...op, specialization: 'TITANIUM' }), /TITANIUM/);
});

test('dispatch engine: places open jobs only, at this branch, with certified operators, lightest queue first', () => {
  const now = at('2026-06-01');
  const wcs = [{ id: 'w1', code: 'A', type: 'SAW', isActive: true, capacity: {} }, { id: 'w2', code: 'B', type: 'SAW', isActive: true, capacity: {} }];
  const skill = (expiresAt = null, skillLevel = 'STANDARD') => [{ workCenterTypeId: 'SAW', skillLevel, expiresAt, isActive: true }];
  const people = [
    { id: 'p-expired', isActive: true, status: 'ACTIVE', homeLocationId: 'L1', skills: skill(at('2026-01-01')) },
    { id: 'p-other', isActive: true, status: 'ACTIVE', homeLocationId: 'L2', skills: skill() },
    { id: 'p-leave', isActive: true, status: 'ON_LEAVE', homeLocationId: 'L1', skills: skill() },
    { id: 'p-good', isActive: true, status: 'ACTIVE', homeLocationId: 'L1', skills: skill(at('2027-01-01')) },
  ];
  const op = (id, sequence, extra = {}) => ({ id, sequence, name: `Step ${sequence}`, status: 'PENDING', assignedWorkCenterId: null, requiredWorkCenterType: 'SAW', requiredSkillLevel: 'STANDARD', thickness: 0, ...extra });
  const jobs = [
    { id: 'j1', jobNumber: 'J1', priority: 'NORMAL', dueDate: at('2026-06-10'), jobStatus: 'SCHEDULED', operations: [op('o1', 1), op('o2', 2)] },
    { id: 'j2', jobNumber: 'J2', priority: 'HOT', dueDate: at('2026-06-20'), jobStatus: 'IN_PROCESS', operations: [op('o3', 1)] },
    { id: 'j3', jobNumber: 'J3', priority: 'RUSH', jobStatus: 'CANCELLED', operations: [op('o4', 1)] },
    { id: 'j4', jobNumber: 'J4', priority: 'RUSH', jobStatus: 'ON_HOLD', operations: [op('o5', 1)] },
    { id: 'j5', jobNumber: 'J5', priority: 'NORMAL', jobStatus: 'SCHEDULED', operations: [op('o6', 1, { requiredWorkCenterType: 'LASER' })] },
  ];
  const plan = planAssignments({ jobs, workCenters: wcs, operators: people, loads: { w1: 3 }, branchId: 'L1', now });
  assert.deepEqual(plan.assignments.map((a) => a.operationId), ['o3', 'o1', 'o2'], 'HOT first; cancelled and held jobs left out');
  assert.ok(plan.assignments.every((a) => a.operatorId === 'p-good'));
  assert.deepEqual(plan.assignments.map((a) => a.workCenterId), ['w2', 'w2', 'w2'], 'lightest queue: w1 already holds 3');
  assert.deepEqual(plan.assignments.map((a) => a.queuedBehind), [0, 1, 2]);
  assert.equal(plan.unassigned.length, 1);
  assert.match(plan.unassigned[0].reason, /no LASER work center/);
  assert.equal(operatorMismatch(people[0], op('x', 1), 'L1', now), 'certification expired');
  assert.equal(operatorMismatch(people[1], op('x', 1), 'L1', now), 'another branch');
  assert.equal(operatorMismatch({ ...people[3], skills: [] }, op('x', 1), 'L1', now), 'not certified for this type');
  assert.equal(operatorMismatch(people[3], op('x', 1, { requiredSkillLevel: 'EXPERT' }), 'L1', now), 'skill level too low');
  const nobody = planAssignments({ jobs: [jobs[1]], workCenters: wcs, operators: people.slice(0, 3), branchId: 'L1', now });
  assert.equal(nobody.assignments[0].operatorId, null);
  assert.match(nobody.notChecked.join(' '), /no operator/);
  assert.match(nobody.notChecked.join(' '), /no maximum thickness on file/);
});

test('planner: capacity and estimates come from the record or are reported as not known', () => {
  assert.equal(minutesPerDay({ shiftCapacityMinutesPerDay: 420 }), 420);
  assert.equal(minutesPerDay({ hoursPerDay: 16 }), 960);
  assert.equal(minutesPerDay({}), null);
  assert.equal(minutesPerDay(null), null);
  assert.equal(minutesPerDay({ hoursPerDay: 40 }), 1440);
  assert.deepEqual(estimateOf({}, null), { minutes: null, source: 'NOT_ON_FILE' });
  assert.deepEqual(estimateOf({ scheduledStart: at('2026-01-01T08:00Z'), scheduledEnd: at('2026-01-01T09:30Z') }), { minutes: 90, source: 'JOB_DATES' });
  assert.deepEqual(estimateOf({}, 45), { minutes: 45, source: 'ROUTING' });
  assert.equal(jobBranch({ workCenter: { locationId: 'L1' }, order: { locationId: 'L2' } }), 'L1');
  assert.equal(jobBranch({ orderId: 'o', order: { locationId: 'L2' } }), 'L2');
  assert.equal(jobBranch({ createdBy: { homeLocationId: 'L3' } }), 'L3');
  assert.equal(jobBranch({ orderId: 'o', order: null, createdBy: { homeLocationId: 'L3' } }), null);
  const now = at('2026-06-01T12:00:00Z');
  assert.equal(clockAt(now, 90, null).toISOString(), '2026-06-01T13:30:00.000Z');
  assert.equal(clockAt(now, 500, 480).toISOString(), '2026-06-02T12:20:00.000Z', 'past the day\'s working minutes: next day');
});

test('planner: a job stays at its branch, untimed jobs get no times, utilisation is over the horizon', () => {
  const now = at('2026-06-01T12:00:00Z');
  const wcs = [
    { id: 'a', name: 'Saw A', locationId: 'L1', workCenterType: 'SAW', minutesPerDay: 480, isOnline: true },
    { id: 'b', name: 'Saw B', locationId: 'L2', workCenterType: 'SAW', minutesPerDay: null, isOnline: true },
    { id: 'c', name: 'Saw C', locationId: 'L1', workCenterType: 'SAW', minutesPerDay: 480, isOnline: false },
  ];
  const job = (n, extra = {}) => ({ id: `j${n}`, jobNumber: `J${n}`, status: 'SCHEDULED', locationId: 'L1', workCenterType: 'SAW', estimatedMinutes: 240, priority: 'NORMAL', dueDate: null, ...extra });
  const plan = planSchedule([job(1), job(2), job(3, { estimatedMinutes: null }), job(4, { locationId: 'L3' }), job(5, { locationId: null }), job(6, { status: 'IN_PROCESS' }), job(7, { locationId: 'L2' })], wcs, { now, horizonHours: 72 });
  const by = Object.fromEntries(plan.optimizedJobs.map((j) => [j.jobNumber, j]));
  assert.equal(by.J1.workCenterId, 'a');
  assert.equal(by.J2.workCenterId, 'a', 'never the offline one, never another branch');
  assert.equal(by.J2.scheduledStart, '2026-06-01T16:00:00.000Z');
  assert.equal(by.J2.scheduledEnd, '2026-06-02T12:00:00.000Z', 'the day is full after 480 minutes');
  assert.equal(by.J3.scheduledStart, null);
  assert.equal(by.J3.queuePosition, 3);
  assert.equal(by.J7.workCenterId, 'b');
  assert.equal(by.J6, undefined, 'a job already running is not replanned');
  assert.deepEqual(plan.unassignedJobs.map((j) => j.jobNumber).sort(), ['J4', 'J5']);
  const a = plan.workCenterSchedules.find((s) => s.workCenter.id === 'a');
  assert.equal(Math.round(a.utilizationPercent), 33, '480 of 3 x 480 minutes');
  assert.equal(plan.workCenterSchedules.find((s) => s.workCenter.id === 'b').utilizationPercent, null);
  assert.equal(plan.metrics.jobsWithoutEstimate, 1);
  assert.equal(plan.metrics.workCentersWithoutCapacity, 1);
  assert.equal(plan.metrics.overallUtilization, 33);
  assert.ok(plan.notes.some((n) => /no time estimate on file/.test(n)));
  const late = planSchedule([job(1, { dueDate: '2026-06-01T13:00:00Z' })], wcs, { now });
  assert.equal(late.metrics.jobsAtRisk, 1);
  const only = planSchedule([job(1), job(7, { locationId: 'L2' })], wcs, { now, locationId: 'L2' });
  assert.deepEqual(only.optimizedJobs.map((j) => j.jobNumber), ['J7']);
});

test('planner: what the browser sends is checked before it is saved', () => {
  const job = { status: 'SCHEDULED', operationType: 'SAW', branchId: 'L1' };
  const wc = { isActive: true, type: 'SAW', locationId: 'L1' };
  const item = { workCenterId: 'w', scheduledStart: '2026-06-01T08:00:00Z', scheduledEnd: '2026-06-01T09:00:00Z' };
  assert.equal(applyError(job, wc, item), null);
  assert.equal(applyError(null, wc, item), 'Job not found');
  assert.match(applyError({ ...job, status: 'COMPLETED' }, wc, item), /completed/);
  assert.match(applyError({ ...job, status: 'IN_PROCESS' }, wc, item), /in process/);
  assert.equal(applyError(job, null, item), 'Work center not found');
  assert.equal(applyError(job, { ...wc, isActive: false }, item), 'Work center is offline');
  assert.equal(applyError(job, { ...wc, locationId: 'L2' }, item), 'Work center is at another branch');
  assert.match(applyError(job, { ...wc, type: 'SHEAR' }, item), /needs a SAW/);
  assert.equal(applyError(job, wc, { ...item, scheduledEnd: '2026-06-01T07:00:00Z' }), 'The end is not after the start');
  assert.equal(applyError(job, wc, { ...item, scheduledStart: 'tomorrow-ish' }), 'A date is not valid');
  assert.equal(applyError(job, null, { scheduledStart: null, scheduledEnd: null }), null);
});

import { workOrderMoveError, gradeFitError, HOLD_RELEASERS } from '../src/lib/workOrderRules.js';

test('coil work orders: a quality hold must be released before completion, and a grade change is a recorded substitution', () => {
  assert.equal(workOrderMoveError('IN_PROGRESS', 'QC_HOLD'), null);
  assert.match(workOrderMoveError('QC_HOLD', 'COMPLETE'), /cannot be made complete/);
  assert.equal(workOrderMoveError('QC_HOLD', 'IN_PROGRESS'), null);
  assert.equal(workOrderMoveError('QC_HOLD', 'CANCELLED'), null);
  assert.match(workOrderMoveError('READY', 'QC_HOLD'), /cannot be made qc hold/);
  assert.ok(HOLD_RELEASERS.has('QC_INSPECTOR') && HOLD_RELEASERS.has('PRODUCTION_MANAGER'));
  assert.ok(!HOLD_RELEASERS.has('CSR') && !HOLD_RELEASERS.has('OPERATOR_SAW'));
  const a36 = { id: 'g1', code: 'A36' }; const s304 = { id: 'g2', code: '304' };
  assert.equal(gradeFitError({ sourceGrade: a36, lineGrade: a36 }), null);
  assert.match(gradeFitError({ sourceGrade: s304, lineGrade: a36 }), /source item is 304; the order line asks for A36/);
  assert.match(gradeFitError({ sourceGrade: s304, lineGrade: a36, substitutionReason: 'ok' }), /substitution/);
  assert.equal(gradeFitError({ sourceGrade: s304, lineGrade: a36, substitutionReason: 'Customer approved 304 by email' }), null);
  assert.equal(gradeFitError({ sourceGrade: s304, lineGrade: null }), null, 'a line with no grade on file is not checked');
  assert.equal(gradeFitError({ sourceGrade: null, lineGrade: a36 }), null, 'a supply item has no grade');
});

// ── The owner's decisions of 2026-11-15 (L-020, L-021, L-022, L-024, L-026, L-028, K-007) ──
import { unitCostFromPrice, addUpJobCost, hoursOf } from '../src/lib/costing.js';
import { readKindRules, readChecklist, checklistFor } from '../src/lib/workCenterKindRules.js';
import { concurrentStepError } from '../src/lib/productionRules.js';

test('cost at receipt: a purchase price becomes a cost per stocked unit, and nothing is assumed when it cannot', () => {
  assert.equal(unitCostFromPrice({ unitPrice: 45, priceUnit: 'CWT', stockUnit: 'LB' }), 0.45);
  assert.equal(unitCostFromPrice({ unitPrice: 0.52, priceUnit: 'LB', stockUnit: 'LB' }), 0.52);
  assert.equal(unitCostFromPrice({ unitPrice: 900, priceUnit: 'TON', stockUnit: 'LB' }), 0.45);
  assert.equal(unitCostFromPrice({ unitPrice: 3.5, priceUnit: 'EACH', stockUnit: 'EA' }), 3.5);
  assert.equal(unitCostFromPrice({ unitPrice: 3.5, priceUnit: 'EACH', stockUnit: 'LB' }), null, 'a price per piece says nothing about a pound');
  assert.equal(unitCostFromPrice({ unitPrice: 45, priceUnit: 'CWT', stockUnit: 'EA' }), null);
  assert.equal(unitCostFromPrice({ unitPrice: 2, priceUnit: 'LF', stockUnit: 'LB' }), null);
  assert.equal(unitCostFromPrice({ unitPrice: null, priceUnit: 'CWT', stockUnit: 'LB' }), null);
  assert.equal(unitCostFromPrice({ unitPrice: -1, priceUnit: 'LB', stockUnit: 'LB' }), null);
});

test('job cost: material used at its unit cost plus clocked hours at the rate for the kind of work; gaps are named, not filled', () => {
  const full = addUpJobCost({ workOrders: [{ woNumber: 'WO-1', status: 'COMPLETE', usedLb: 1000, unitCost: 0.45 }, { woNumber: 'WO-2', status: 'RELEASED', usedLb: 0, unitCost: null }], labor: [{ kind: 'Saw', hours: 2, rate: 60 }] });
  assert.equal(full.materialCost, 450); assert.equal(full.laborCost, 120); assert.equal(full.totalCost, 570);
  assert.equal(full.complete, true); assert.deepEqual(full.missing, []);
  const gaps = addUpJobCost({ workOrders: [{ woNumber: 'WO-3', status: 'COMPLETE', usedLb: 500, unitCost: null }], labor: [{ kind: 'Shear', hours: 1.5, rate: null }] });
  assert.equal(gaps.complete, false); assert.equal(gaps.totalCost, 0);
  assert.equal(gaps.missing.length, 2); assert.match(gaps.missing[0], /WO-3/); assert.match(gaps.missing[1], /Shear/);
  assert.equal(addUpJobCost({}).complete, false, 'a job with nothing recorded has no cost to call complete');
  assert.equal(hoursOf({ startAt: '2026-01-01T00:00:00Z', endAt: '2026-01-01T01:30:00Z' }), 1.5);
  assert.equal(hoursOf({ startAt: '2026-01-01T00:00:00Z', endAt: null }, new Date('2026-01-01T02:00:00Z')), 2, 'a running clock counts to now');
  assert.equal(hoursOf({ startAt: '2026-01-01T02:00:00Z', endAt: '2026-01-01T01:00:00Z' }), 0);
});

test('rules per kind of work center are validated, and only cost roles set a labor rate', () => {
  assert.deepEqual(readKindRules({ certificationRequired: true, allowsConcurrentSteps: false }).data, { certificationRequired: true, allowsConcurrentSteps: false });
  assert.equal(readKindRules({ certificationRequired: 'yes' }).status, 400);
  assert.equal(readKindRules({ hourlyRate: 60 }).status, 403);
  assert.equal(readKindRules({ hourlyRate: 60.456 }, { mayCost: true }).data.hourlyRate, 60.46);
  assert.equal(readKindRules({ hourlyRate: null }, { mayCost: true }).data.hourlyRate, null);
  assert.equal(readKindRules({ hourlyRate: -1 }, { mayCost: true }).status, 400);
  assert.equal(readKindRules({ hourlyRate: 'abc' }, { mayCost: true }).status, 400);
  assert.deepEqual(readKindRules({}).data, {});
});

test('an inspection checklist per kind of work: wording required, no duplicates, the standard list when none is set', () => {
  assert.deepEqual(readChecklist(['Burr free', { item: 'Length checked', required: false }]).list, [{ item: 'Burr free', required: true }, { item: 'Length checked', required: false }]);
  assert.equal(readChecklist([]).list, null); assert.equal(readChecklist(null).list, null);
  assert.match(readChecklist('x').error, /list/);
  assert.match(readChecklist([{ item: ' ' }]).error, /no wording/);
  assert.match(readChecklist(['A', 'a']).error, /twice/);
  assert.match(readChecklist(Array(41).fill(0).map((_, i) => `c${i}`)).error, /40/);
  const standard = [{ item: 'std', required: true, result: null, notes: '' }];
  assert.equal(checklistFor(null, standard), standard);
  assert.equal(checklistFor({ inspectionChecklist: [] }, standard), standard);
  assert.deepEqual(checklistFor({ inspectionChecklist: [{ item: 'Burr free', required: true }] }, standard), [{ item: 'Burr free', required: true, result: null, notes: '' }]);
});

test('a certification is required only where the kind of work center is marked, and a lapsed one always refuses', () => {
  const op = { requiredWorkCenterType: 'SAW' }; const now = new Date('2026-06-01');
  const bare = { firstName: 'Ann', lastName: 'Lee', isActive: true, status: 'ACTIVE', skills: [] };
  assert.equal(operatorEligibility(bare, op, null, now, { certificationRequired: false }), null);
  assert.equal(operatorEligibility(bare, op, null, now, null), null);
  assert.match(operatorEligibility(bare, op, null, now, { label: 'Saw', certificationRequired: true }), /no Saw certification on file/);
  const held = { ...bare, skills: [{ workCenterTypeId: 'SAW', isActive: true, expiresAt: '2027-01-01' }] };
  assert.equal(operatorEligibility(held, op, null, now, { certificationRequired: true }), null);
  const lapsed = { ...bare, skills: [{ workCenterTypeId: 'SAW', isActive: true, expiresAt: '2026-01-01' }] };
  assert.match(operatorEligibility(lapsed, op, null, now, { certificationRequired: false }), /expired/);
  const other = { ...bare, skills: [{ workCenterTypeId: 'SHEAR', isActive: true, expiresAt: null }] };
  assert.match(operatorEligibility(other, op, null, now, { label: 'Saw', certificationRequired: true }), /no Saw certification/);
});

test('one step at a time, unless every kind of work involved is marked for two at once', () => {
  const running = [{ stepName: 'Cut', jobNumber: 'J-1', kindId: 'SAW' }];
  assert.equal(concurrentStepError('Ann Lee', [], 'SAW', {}), null);
  assert.match(concurrentStepError('Ann Lee', running, 'SAW', { SAW: { label: 'Saw', allowsConcurrentSteps: false } }), /already clocked on to Cut of job J-1.*Saw is not marked/);
  assert.equal(concurrentStepError('Ann Lee', running, 'SAW', { SAW: { allowsConcurrentSteps: true } }), null);
  assert.match(concurrentStepError('Ann Lee', running, 'LASER', new Map([['SAW', { allowsConcurrentSteps: true }], ['LASER', { label: 'Laser', allowsConcurrentSteps: false }]])), /Laser is not marked/);
  assert.match(concurrentStepError('Ann Lee', running, 'LASER', { LASER: { allowsConcurrentSteps: true } }), /SAW is not marked/);
});

test('every job is inspected before release unless its routing says it needs none', () => {
  const none = { from: 'IN_PROCESS', to: 'READY_TO_SHIP', inspections: [] };
  assert.match(qualityReleaseError({ ...none, inspectionRequired: true }), /has not been inspected/);
  assert.equal(qualityReleaseError({ ...none, inspectionRequired: false }), null);
  assert.equal(qualityReleaseError({ ...none, to: 'WAITING_QC', inspectionRequired: true }), null, 'going to inspection is always allowed');
  const passed = [{ inspectionNumber: 'QC-1', status: 'PASSED', completedAt: '2026-01-02' }];
  assert.equal(qualityReleaseError({ from: 'IN_PROCESS', to: 'PACKAGING', inspections: passed, inspectionRequired: true }), null);
  assert.equal(qualityReleaseError({ from: 'PACKAGING', to: 'READY_TO_SHIP', inspections: [], inspectionRequired: true }), null, 'work already released when the rule arrived carries on');
  assert.match(qualityReleaseError({ from: 'IN_PROCESS', to: 'PACKAGING', inspections: [{ inspectionNumber: 'QC-2', status: 'FAILED', completedAt: '2026-01-03' }], inspectionRequired: false }), /failed/, 'a failed inspection blocks even where none is required');
});
