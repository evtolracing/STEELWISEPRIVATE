// Packaging, staging, the shop floor, the Shipment Planner and the Shipping screen are one flow (owner, 2026-11-25):
// "clicked marked shipped it gave error failed to update job status", then "shipping orders are able to be marked
// shipped while the shipment hasnt been planned". A job screen says the server's reason, never marks an order's job
// shipped, and points at the one shipment the Shipping screen works on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moveProblem, shipmentStep, plansByJob } from '../../frontend/src/pages/MaterialTracking/shipText.js';
import { planOfJob, jobShipRefusal } from '../src/routes/shipments.js';

test('a refused move shows the server\'s own sentence', () => {
  const why = 'This job is for a customer order, so it is marked shipped when its shipment is dispatched.';
  assert.equal(moveProblem({ response: { status: 409, data: { error: why } } }), why);
});

test('with no sentence from the server the message still says what to do', () => {
  assert.match(moveProblem({}), /could not be reached/);
  assert.match(moveProblem({ response: { status: 500, data: {} } }), /Try again/);
  assert.match(moveProblem({ response: { status: 500, data: { error: { x: 1 } } } }), /Try again/);
});

const job = { id: 'j1', jobNumber: 'JOB-1', orderId: 'o1', orderLineId: 'l1' };
const open = [
  { id: 's0', shipmentNumber: 'SHP-0', status: 'PENDING', orderId: 'o2', lineIds: ['l1'] },
  { id: 's1', shipmentNumber: 'SHP-1', status: 'PENDING', orderId: 'o1', lineIds: ['l2'] },
  { id: 's2', shipmentNumber: 'SHP-2', status: 'LOADING', orderId: 'o1', lineIds: ['l1', 'l3'] },
];

test('a job is planned on the open shipment of its order that carries its line', () => {
  assert.deepEqual(planOfJob(job, open), { id: 's2', shipmentNumber: 'SHP-2', status: 'LOADING' });
  assert.equal(planOfJob(job, open.slice(0, 2)), null, 'another line of the order, or another order, is not its plan');
  assert.equal(planOfJob(job, []), null);
  assert.equal(planOfJob(job), null);
});

test('a job for the whole order is planned on any open shipment of that order; a job with no order never is', () => {
  assert.deepEqual(planOfJob({ ...job, orderLineId: null }, open), { id: 's1', shipmentNumber: 'SHP-1', status: 'PENDING' });
  assert.equal(planOfJob({ ...job, orderId: null }, open), null);
  assert.equal(planOfJob(null, open), null);
});

test('the refusal says where to go: plan it, or dispatch the shipment it is on', () => {
  assert.match(jobShipRefusal(job, null), /No shipment is planned for job JOB-1 yet\. Plan it on the Shipment Planner/);
  assert.match(jobShipRefusal(job, { shipmentNumber: 'SHP-2' }), /Job JOB-1 is on shipment SHP-2, which has not left yet\. Dispatch that shipment on the Shipping screen/);
});

test('a job screen offers one next step: plan the shipment, open it, or (no order) mark by hand', () => {
  assert.deepEqual(shipmentStep(undefined), { kind: 'byHand', words: '', button: 'Mark Shipped', to: null });
  const plan = shipmentStep({ orderNumber: 'SO 1/2', shipment: null });
  assert.equal(plan.kind, 'plan'); assert.equal(plan.button, 'Plan shipment'); assert.equal(plan.to, '/shipping?order=SO%201%2F2'); assert.equal(plan.words, 'No shipment planned yet.');
  assert.equal(shipmentStep({ orderNumber: null, shipment: null }).to, '/freight/planner');
  const onDock = shipmentStep({ orderNumber: 'SO-1', shipment: { id: 's2', shipmentNumber: 'SHP-2', status: 'PENDING' } });
  assert.equal(onDock.kind, 'dispatch'); assert.equal(onDock.to, '/shipping/s2'); assert.match(onDock.words, /On shipment SHP-2, on the dock\. It is marked shipped when the shipment is dispatched/);
  assert.match(shipmentStep({ shipment: { id: 's', shipmentNumber: 'SHP-3', status: 'LOADING' } }).words, /SHP-3, loading/);
});

test('the plans are keyed by job', () => {
  const m = plansByJob([{ jobId: 'a', shipment: null }, { jobId: 'b', shipment: { id: 's' } }]);
  assert.equal(m.get('b').shipment.id, 's'); assert.equal(m.get('a').shipment, null); assert.equal(plansByJob(null).size, 0);
});

test('every screen that lists jobs ready to ship uses the one shipment step, and none hides a refusal', () => {
  const read = (p) => readFileSync(new URL(`../../frontend/src/${p}`, import.meta.url), 'utf8');
  for (const p of ['pages/MaterialTracking/PackagingQueue.jsx', 'pages/MaterialTracking/StagingLoading.jsx', 'components/production/ShippingScreen.jsx']) {
    assert.match(read(p), /<JobShipmentAction /, p);
  }
  const queue = read('pages/MaterialTracking/PackagingQueue.jsx');
  assert.ok(!/Failed to update job status/.test(queue));
  assert.ok(!/\/ship`/.test(queue), 'the queue never ships an order\'s job itself');
  assert.ok(!/createNumbered|dispatchAndInvoice\(shipment/.test(readFileSync(new URL('../src/routes/shipments.js', import.meta.url), 'utf8').split('export async function shipForJob')[1].split('router.')[0]), 'Ship on a job never makes or dispatches a shipment');
});
