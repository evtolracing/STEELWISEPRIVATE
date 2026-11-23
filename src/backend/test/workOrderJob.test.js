// The job a new work order makes (owner's decision, 2026-11-23).
import test from 'node:test';
import assert from 'node:assert/strict';
import { jobForWorkOrder, workOrderJobText, cancelsItsJob, OPEN_JOB_STATUSES } from '../src/lib/workOrderRules.js';

test('a work order with no job makes one that starts on the Order Board', () => {
  const job = jobForWorkOrder({ woType: 'SLIT', priority: 4, scheduledDate: '2027-01-15T00:00:00.000Z', inputWeightLb: 4000.4, coilNumber: 'C-00012', userId: 'u1' });
  assert.equal(job.status, 'ORDERED');
  assert.equal(job.priority, 4);
  assert.equal(job.scheduledEnd.toISOString(), '2027-01-15T00:00:00.000Z');
  assert.equal(job.scheduledStart.toISOString(), '2027-01-15T00:00:00.000Z');
  assert.equal(job.inputWeightLb, 4000.4);
  assert.equal(job.createdById, 'u1');
  assert.equal(job.instructions, 'Stock work - Slit C-00012 (4,000 lb)');
  assert.equal('operationType' in job, false, 'no type, so the planner may pick any machine');
  assert.equal('orderId' in job, false);
});

test('a work order for an order line makes that line\'s job', () => {
  const job = jobForWorkOrder({ woType: 'CTL', coilNumber: 'C-7', line: { id: 'l1', orderId: 'o1' }, userId: 'u1' });
  assert.equal(job.orderId, 'o1');
  assert.equal(job.orderLineId, 'l1');
  assert.equal(job.priority, 3);
  assert.equal(job.scheduledEnd, null);
  assert.equal(job.instructions, 'Cut to length C-7');
});

test('the job text names the work order once it has a number', () => {
  assert.equal(workOrderJobText({ woType: 'SHEAR', coilNumber: 'P-1', inputWeightLb: 250, woNumber: 'WO-00007' }), 'Stock work - Shear P-1 (250 lb), WO-00007');
  assert.equal(workOrderJobText({ woType: 'OTHER', woNumber: 'WO-1', forOrder: true }), 'Process stock item, WO-1');
});

test('cancelling a work order cancels only the job it made, and only before work starts', () => {
  const job = { id: 'j', workOrderId: 'w1', status: 'ORDERED' };
  assert.equal(cancelsItsJob({ workOrderId: 'w1', job, otherLiveWorkOrders: 0 }), true);
  assert.equal(cancelsItsJob({ workOrderId: 'w1', job: { ...job, status: 'SCHEDULED' } }), true);
  assert.equal(cancelsItsJob({ workOrderId: 'w1', job, otherLiveWorkOrders: 1 }), false, 'another work order is still cutting for it');
  assert.equal(cancelsItsJob({ workOrderId: 'w2', job, otherLiveWorkOrders: 0 }), false, 'not the work order that made the job');
  assert.equal(cancelsItsJob({ workOrderId: 'w1', job: { ...job, workOrderId: null } }), false, 'a job that came from an order');
  for (const status of ['IN_PROCESS', 'WAITING_QC', 'COMPLETED', 'CANCELLED']) assert.equal(cancelsItsJob({ workOrderId: 'w1', job: { ...job, status } }), false, status);
  assert.equal(cancelsItsJob({ workOrderId: 'w1', job: null }), false);
});

test('a work order joins only a job that is still open', () => {
  assert.deepEqual(OPEN_JOB_STATUSES, ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'ON_HOLD']);
});
