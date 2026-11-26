// The Packaging Queue's words and the branch a job ships from (owner, 2026-11-25: "clicked marked shipped it gave
// error failed to update job status"). The screen must say the server's reason, and a planned job must be shippable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moveProblem, shippedText, shipFormProblem } from '../../frontend/src/pages/MaterialTracking/shipText.js';
import { jobShipsFrom } from '../src/routes/shipments.js';

test('a refused move shows the server\'s own sentence', () => {
  const why = 'This job is for a customer order, so it is marked shipped when its shipment is dispatched.';
  assert.equal(moveProblem({ response: { status: 409, data: { error: why } } }), why);
});

test('with no sentence from the server the message still says what to do', () => {
  assert.match(moveProblem({}), /could not be reached/);
  assert.match(moveProblem({ response: { status: 500, data: {} } }), /Try again/);
  assert.match(moveProblem({ response: { status: 500, data: { error: { x: 1 } } } }), /Try again/);
});

test('the message after shipping names the shipment and the invoice', () => {
  assert.equal(shippedText({ jobNumber: '00079-1' }, { shipment: { shipmentNumber: 'SHP-1', invoice: { invoiceNumber: 'INV-9' } } }), 'Job 00079-1 shipped on shipment SHP-1. Invoice INV-9 was raised.');
  assert.equal(shippedText({ jobNumber: '00079-1' }, { shipment: null }), 'Job 00079-1 is marked shipped.');
});

test('Ship needs a carrier and a tracking or BOL number', () => {
  assert.equal(shipFormProblem({ carrier: ' ', trackingNumber: 'x' }), 'Enter the carrier.');
  assert.equal(shipFormProblem({ carrier: 'UPS', trackingNumber: '' }), 'Enter the tracking or BOL number.');
  assert.equal(shipFormProblem({ carrier: 'UPS', trackingNumber: '1Z' }), '');
});

test('a job ships from the branch of its plan, else its machine, else nowhere known', () => {
  assert.equal(jobShipsFrom({ planLocationId: 'P', machineLocationId: 'M' }), 'P');
  assert.equal(jobShipsFrom({ planLocationId: null, machineLocationId: 'M' }), 'M');
  assert.equal(jobShipsFrom({}), null);
  assert.equal(jobShipsFrom(), null);
});

test('the Packaging Queue never answers a refusal with a fixed "Failed to update job status"', () => {
  const page = readFileSync(new URL('../../frontend/src/pages/MaterialTracking/PackagingQueue.jsx', import.meta.url), 'utf8');
  assert.ok(!/Failed to update job status/.test(page));
  assert.match(page, /\/jobs\/\$\{job\.id\}\/ship/);
});
