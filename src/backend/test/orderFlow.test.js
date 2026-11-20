// New order to dispatch: the small rules the screens go by (the browser run is qa/sim/ui-order-flow.cjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { orderProblems, unpricedLines } from '../../frontend/src/pages/Orders/intakeChecks.js';
import { defaultBranch, typeFor, usableTemplate } from '../../frontend/src/components/jobs/routingTemplates.js';
import { dispatchMessage } from '../../frontend/src/apps/shopfloor/dispatchMessage.js';

test('an order cannot be submitted with no customer, no line, an empty line or no quantity', () => {
  const customer = { id: 'c1' };
  assert.deepEqual(orderProblems({ customer, lines: [{ description: 'A36 plate', qty: 2 }] }), []);
  assert.match(orderProblems({ customer: null, lines: [{ description: 'x', qty: 1 }] })[0], /Pick a customer/);
  assert.match(orderProblems({ customer, lines: [] })[0], /at least one line/);
  assert.match(orderProblems({ customer, lines: [{ description: '   ', qty: 1 }] })[0], /Line 1: choose a material/);
  assert.match(orderProblems({ customer, lines: [{ description: 'x', qty: 1 }, { description: 'y', qty: 0 }] })[0], /Line 2: the quantity/);
});

test('lines with no price are named, so the person is asked before they go out free', () => {
  assert.deepEqual(unpricedLines([{ description: 'a', unitPrice: 5 }, { description: 'b', unitPrice: 0 }, { description: 'c', unitPrice: '', extPrice: 12 }, { description: '', unitPrice: 0 }]), [2]);
});

const TYPES = [{ id: 'P11SAW', label: 'P11 saw' }, { id: 'QA-P2-SAW', label: 'Second saw' }, { id: 'PK1', label: 'Pack out' }, { id: 'OLD', label: 'Deburr', isActive: false }, { id: 'LASER', label: 'Laser cell' }];

test('a routing template step becomes one of the company\'s own work center types', () => {
  assert.equal(typeFor(TYPES, 'LASER'), 'LASER');
  assert.equal(typeFor(TYPES, 'SAW'), 'P11SAW');
  assert.equal(typeFor(TYPES, 'SAW', (id) => id === 'QA-P2-SAW'), 'QA-P2-SAW');
  assert.equal(typeFor(TYPES, 'PACKOUT'), 'PK1');
  assert.equal(typeFor(TYPES, 'DEBURR'), '');
  assert.equal(typeFor(TYPES, 'WATERJET'), '');
  assert.equal(typeFor([], 'SAW'), '');
});

test('a template that needs a kind of work the company has no type for is marked, not offered', () => {
  const fits = usableTemplate({ label: 'Saw → Pack', ops: [{ type: 'SAW', name: 'Cut' }, { type: 'PACKOUT', name: 'Pack' }] }, TYPES);
  assert.deepEqual(fits.missing, []);
  assert.deepEqual(fits.ops.map((o) => o.typeId), ['P11SAW', 'PK1']);
  const not = usableTemplate({ label: 'Saw → Deburr', ops: [{ type: 'SAW', name: 'Cut' }, { type: 'DEBURR', name: 'Deburr' }] }, TYPES);
  assert.deepEqual(not.missing, ['DEBURR']);
});

test('a job is planned at its own branch by default, never simply the first in the list', () => {
  const locations = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  assert.equal(defaultBranch({ orderLocationId: 'B' }, locations, 'C'), 'B');
  assert.equal(defaultBranch({ orderLocationId: 'B', workCenter: { locationId: 'C' } }, locations, 'A'), 'C');
  assert.equal(defaultBranch({}, locations, 'C'), 'C');
  assert.equal(defaultBranch({ orderLocationId: 'gone' }, locations, null), 'A');
  assert.equal(defaultBranch({}, [], null), '');
});

test('Run Dispatch says what it did, and what still needs a route', () => {
  const nothing = dispatchMessage({ assignedCount: 0, unassignedCount: 0, notPlannedCount: 3 });
  assert.match(nothing.message, /Nothing was waiting/);
  assert.match(nothing.message, /3 new jobs have no route yet/);
  assert.match(nothing.message, /Plan Job/);
  assert.equal(nothing.severity, 'info');
  const placed = dispatchMessage({ assignedCount: 1, unassignedCount: 0, notPlannedCount: 0 });
  assert.equal(placed.message, 'Assigned 1 step.');
  assert.equal(placed.severity, 'success');
  const partly = dispatchMessage({ assignedCount: 2, unassignedCount: 2, unassigned: [{ reason: 'This branch has no SAW work center' }, {}], notPlannedCount: 1, notChecked: ['x'] });
  assert.match(partly.message, /Assigned 2 steps\. 2 could not be placed: This branch has no SAW work center \(and others\)\. 1 new job has no route yet/);
  assert.equal(partly.severity, 'warning');
});
