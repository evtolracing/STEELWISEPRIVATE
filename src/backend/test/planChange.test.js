import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planChange, mayChangePlan } from '../src/lib/planChange.js';

const machines = [{ id: 'saw1', name: 'Saw 1', type: 'SAW' }, { id: 'saw2', name: 'Saw 2', type: 'SAW' }, { id: 'saw3', name: 'Saw 3', type: 'SAW', isActive: false }, { id: 'deb1', name: 'Deburr 1', type: 'DEBURR' }];
const kinds = [{ id: 'SAW', label: 'Saw' }, { id: 'DEBURR', label: 'Deburr' }, { id: 'OLD', label: 'Old', isActive: false }];
const steps = [
  { id: 'a', sequence: 1, name: 'Cut', status: 'COMPLETE', requiredWorkCenterType: 'SAW', assignedWorkCenterId: 'saw1', timeLogCount: 2 },
  { id: 'b', sequence: 2, name: 'Second cut', status: 'IN_PROCESS', requiredWorkCenterType: 'SAW', assignedWorkCenterId: 'saw1', timeLogCount: 1 },
  { id: 'c', sequence: 3, name: 'Deburr', status: 'PENDING', requiredWorkCenterType: 'DEBURR', assignedWorkCenterId: null, timeLogCount: 0 },
];
const go = (wanted, reason = 'Saw 1 is down') => planChange({ steps, wanted, reason, machines, kinds });

test('a reason is required', () => assert.match(go([{ id: 'b' }, { id: 'c' }], ' ').error, /Say why/));
test('nothing changed is refused', () => assert.equal(go([{ id: 'b' }, { id: 'c' }]).error, 'Nothing was changed'));
test('a running step moves to another machine of the same kind, and is marked as moved while worked', () => {
  const r = go([{ id: 'b', workCenterId: 'saw2' }, { id: 'c' }]);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.lines, ['Second cut: moved to Saw 2 from Saw 1']);
  assert.equal(r.keep[0].movedWhileWorked, true); assert.equal(r.keep[0].fromWorkCenterId, 'saw1');
  assert.equal(r.firstSequence, 2);
});
test('a machine of another kind, an offline machine, and a machine from elsewhere are refused', () => {
  assert.match(go([{ id: 'b', workCenterId: 'deb1' }, { id: 'c' }]).error, /Deburr 1 does not do Saw/);
  assert.match(go([{ id: 'b', workCenterId: 'saw3' }, { id: 'c' }]).error, /Saw 3 is offline/);
  assert.match(go([{ id: 'b', workCenterId: 'elsewhere' }, { id: 'c' }]).error, /not at this job's location/);
});
test('a finished step cannot be changed, and a step with work cannot be removed or become another kind', () => {
  assert.match(go([{ id: 'a' }, { id: 'b' }, { id: 'c' }]).error, /"Cut" is finished/);
  assert.match(go([{ id: 'c' }]).error, /"Second cut" has work recorded and cannot be removed/);
  assert.match(go([{ id: 'b', workCenterType: 'DEBURR' }, { id: 'c' }]).error, /has work recorded, so it stays Saw/);
});
test('a step not started can be removed, replaced, renamed and reordered, and new steps added', () => {
  const r = go([{ workCenterType: 'DEBURR', name: 'Edge break', workCenterId: 'deb1' }, { id: 'b' }]);
  assert.deepEqual(r.remove, ['c']);
  assert.deepEqual(r.create, [{ name: 'Edge break', kind: 'DEBURR', workCenterId: 'deb1', order: 0 }]);
  assert.deepEqual(r.lines, ['Added Edge break on Deburr 1', 'Removed Deburr']);
  const swap = planChange({ steps: steps.map((s) => (s.id === 'b' ? { ...s, status: 'PENDING', timeLogCount: 0 } : s)), wanted: [{ id: 'c' }, { id: 'b' }], reason: 'x', machines, kinds });
  assert.deepEqual(swap.lines, ['Order of the steps changed']);
  assert.deepEqual(swap.keep.map((k) => [k.id, k.order]), [['c', 0], ['b', 1]]);
});
test('a kind of work that is not on file, a step listed twice and a step of another job are refused', () => {
  assert.match(go([{ id: 'b' }, { id: 'c' }, { workCenterType: 'OLD' }]).error, /not a kind of work on file/);
  assert.match(go([{ id: 'b' }, { id: 'b' }, { id: 'c' }]).error, /listed twice/);
  assert.match(go([{ id: 'zzz' }]).error, /not a step of this job's plan/);
});
test('changing the kind of a step not started drops its old machine', () => {
  const s2 = steps.map((s) => (s.id === 'c' ? { ...s, assignedWorkCenterId: 'deb1' } : s));
  const r = planChange({ steps: s2, wanted: [{ id: 'b' }, { id: 'c', workCenterType: 'SAW' }], reason: 'x', machines, kinds });
  assert.equal(r.keep[1].workCenterId, null);
});
test('who may change a plan in production', () => {
  for (const role of ['PRODUCTION_MANAGER', 'SCHEDULER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'WORKCENTER_LEAD']) assert.equal(mayChangePlan(role), true, role);
  for (const role of ['OPERATOR_SAW', 'PACKAGING_LEAD', 'CSR', 'CUSTOMER_BUYER', undefined]) assert.equal(mayChangePlan(role), false, String(role));
});
