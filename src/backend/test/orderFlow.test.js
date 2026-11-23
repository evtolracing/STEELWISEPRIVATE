// New order to dispatch: the small rules the screens go by (the browser run is qa/sim/ui-order-flow.cjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { orderProblems, unpricedLines, nextStepFor } from '../../frontend/src/pages/Orders/intakeChecks.js';
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

test('the Orders list offers Create Work Orders for a submitted order and the board for a confirmed one', () => {
  assert.equal(nextStepFor('SUBMITTED'), 'CREATE_WORK_ORDERS');
  assert.equal(nextStepFor('PENDING'), 'CREATE_WORK_ORDERS');
  assert.equal(nextStepFor('CONFIRMED'), 'SEE_ON_BOARD');
  assert.equal(nextStepFor('IN_PRODUCTION'), 'SEE_ON_BOARD');
  assert.equal(nextStepFor('DRAFT'), 'OPEN');
  assert.equal(nextStepFor('CANCELLED'), 'OPEN');
});

// ── Shop floor to shipping: the rules found wanting on the live walkthrough of 2026-11-20 ──
const { isOpenInspection, openInspectionOf, inspectionStatusLabel, jobNotesText } = await import('../../frontend/src/pages/QC/qcRules.js');
const { calendarDate } = await import('../../frontend/src/utils/calendarDate.js');
const { jobTitle, orderOf, thicknessOf, branchLabel } = await import('../../frontend/src/apps/shopfloor/queueLabels.js');
const { reservedOn, openToReserve, mayReserve, stockChoices, suggestedQty, stockSummary } = await import('../../frontend/src/pages/Orders/reserveRules.js');

test('an inspection started with no inspector is still open work that can be reached', () => {
  assert.equal(isOpenInspection({ status: 'PENDING' }), true);
  assert.equal(isOpenInspection({ status: 'IN_PROGRESS' }), true);
  assert.equal(isOpenInspection({ status: 'PASSED' }), false);
  assert.equal(openInspectionOf({ inspections: [{ id: 'i1', status: 'PENDING' }] }).id, 'i1');
  assert.equal(openInspectionOf({ inspections: [{ id: 'i0', status: 'FAILED' }] }), null);
  assert.equal(inspectionStatusLabel('PENDING'), 'Not started');
});

test('job notes kept as JSON are shown as words', () => {
  const text = jobNotesText('{"customerName":"Eli White","orderNumber":"SO-00076","lineNumber":1,"processes":[],"requirements":{"gradeOverride":"A36"}}');
  assert.equal(text, 'Customer: Eli White\nOrder: SO-00076, line 1\nGrade: A36');
  assert.equal(jobNotesText('Handle with care'), 'Handle with care');
  assert.equal(jobNotesText(null), '');
});

test('a due date reads as the day it names, whatever the time zone of the reader', () => {
  const was = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    assert.equal(calendarDate('2026-11-21T00:00:00.000Z'), '11/21/2026');
    assert.equal(calendarDate(null), '—');
    assert.equal(calendarDate('not a date'), '—');
  } finally { if (was === undefined) delete process.env.TZ; else process.env.TZ = was; }
});

test('the work center queue names the job, never a record id', () => {
  const op = { jobId: '7b430a97-1438-4ed6-ace0-a3072bfd6a93', job: { id: '7b430a97-1438-4ed6-ace0-a3072bfd6a93', jobNumber: 'JOB-00073', orderId: '787679d5-cc43', orderNumber: 'SO-00076' } };
  assert.equal(jobTitle(op), 'JOB-00073');
  assert.equal(orderOf(op), 'SO-00076');
  assert.equal(orderOf({ job: { orderId: '787679d5-cc43' } }), '—');
  assert.equal(thicknessOf(0), '—');
  assert.equal(thicknessOf('1.5'), '1.5"');
  assert.equal(branchLabel({ locationName: 'Detroit Branch - Bay A' }, '1e7e3193-7580-4e24-9413-d2c3a20fefee'), 'Detroit Branch - Bay A');
  assert.equal(branchLabel({}, '1e7e3193-7580-4e24-9413-d2c3a20fefee'), '');
});

test('reserving stock: what a line still needs and which stock is offered', () => {
  const line = { lineNumber: 1, unit: 'LB', gradeId: 'g1', qtyOrdered: '100', qtyShipped: '0', allocations: [{ qtyAllocated: '40' }] };
  assert.equal(reservedOn(line), 40);
  assert.equal(openToReserve(line), 60);
  assert.equal(openToReserve({ ...line, qtyShipped: '70' }), 0);
  assert.equal(mayReserve({ status: 'CONFIRMED' }), true);
  assert.equal(mayReserve({ status: 'DRAFT' }), false);
  assert.equal(mayReserve({ status: 'CANCELLED' }), false);
  const stock = [
    { id: 'far', locationId: 'b2', gradeId: 'g1', status: 'AVAILABLE', inventory: { qtyAvailable: '900', unit: 'LB' } },
    { id: 'here', locationId: 'b1', gradeId: 'g1', status: 'AVAILABLE', inventory: { qtyAvailable: '50', unit: 'lbs' } },
    { id: 'pieces', locationId: 'b1', gradeId: 'g1', status: 'AVAILABLE', inventory: { qtyAvailable: '5', unit: 'EA' } },
    { id: 'othergrade', locationId: 'b1', gradeId: 'g2', status: 'AVAILABLE', inventory: { qtyAvailable: '500', unit: 'LB' } },
    { id: 'held', locationId: 'b1', gradeId: 'g1', status: 'HOLD', inventory: { qtyAvailable: '500', unit: 'LB' } },
    { id: 'empty', locationId: 'b1', gradeId: 'g1', status: 'ALLOCATED', inventory: { qtyAvailable: '0', unit: 'LB' } },
    { id: 'moving', locationId: 'b1', gradeId: 'g1', status: 'AVAILABLE', inventory: { qtyAvailable: '80', unit: 'LB', status: 'IN_TRANSIT' } },
  ];
  assert.deepEqual(stockChoices(line, stock, 'b1').map((c) => c.id), ['here', 'far']);
  assert.equal(suggestedQty(line, stock[1]), 50);
  assert.equal(suggestedQty(line, stock[0]), 60);
  assert.equal(stockSummary({ lines: [line] }).ready, false);
  assert.match(stockSummary({ lines: [line] }).text, /1 of 1 line still needs stock reserved/);
  assert.equal(stockSummary({ lines: [{ ...line, allocations: [{ qtyAllocated: '100' }] }] }).ready, true);
});

// Notes kept as data are shown in words on every screen (owner, 2026-11-22).
const { readableNotes, processText } = await import('../../frontend/src/utils/readableNotes.js');
test('a job\'s kept details read as words, with what each process was asked to do', () => {
  const stored = '{"customerName":"Eli White","orderNumber":"SO-00079","lineNumber":1,"processes":[{"id":"proc-002","code":"SHEAR","name":"Shear to Size","type":"CUT","pricePerOp":8.5,"priceUnit":"CUT","estimatedMinutes":10,"params":{"width":"12","length":"16"},"estimatedCost":8.5},{"id":"proc-010","code":"DEBURR","name":"Deburr / Edge Finish","type":"FINISH","pricePerOp":6,"priceUnit":"EA","estimatedMinutes":15,"params":{},"estimatedCost":6}],"requirements":{"gradeOverride":"A36"}}';
  const text = readableNotes(stored);
  assert.equal(text, 'Customer: Eli White\nOrder: SO-00079, line 1\nProcessing: Shear to Size (width 12, length 16), Deburr / Edge Finish\nGrade: A36');
  assert.doesNotMatch(text, /[{}[\]"]/);
});
test('an order line\'s list of processes reads as words', () => {
  assert.equal(readableNotes('[{"code":"SHEAR","name":"Shear to Size","params":{"width":"12"}}]'), 'Processing: Shear to Size (width 12)');
  assert.equal(readableNotes('[]'), '');
  assert.equal(processText('Saw'), 'Saw');
});
test('an intake order shows only what the person typed', () => {
  assert.equal(readableNotes('{"__intakeMeta__":{"division":"METALS","ownership":"OWNED"},"userNotes":"Call before delivery"}'), 'Call before delivery');
  assert.equal(readableNotes('{"__intakeMeta__":{"division":"METALS"},"userNotes":""}'), '');
});
test('a rework note written in front of a job\'s details keeps its words and loses the code', () => {
  const text = readableNotes('REWORK: recut the edge\n\n{"customerName":"Eli White","orderNumber":"SO-00079","lineNumber":1,"processes":[],"requirements":{}}');
  assert.equal(text, 'REWORK: recut the edge\n\nCustomer: Eli White\nOrder: SO-00079, line 1');
});
test('plain notes, broken data and unknown data are never shown as code or lost', () => {
  assert.equal(readableNotes('Handle with care'), 'Handle with care');
  assert.equal(readableNotes('{not data'), '{not data');
  assert.equal(readableNotes('Size [12 x 16] plate'), 'Size [12 x 16] plate');
  assert.equal(readableNotes('{"heatLot":"H123","rush":true}'), 'Heat lot: H123\nRush: Yes');
  assert.equal(readableNotes(null), '');
});
