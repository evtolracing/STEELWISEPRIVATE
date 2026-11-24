// What a step needs to be done correctly, and the material a plan starts from (owner, 2026-11-24).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readStepDetails, stepDetailText, sizeText, planDefaults } from '../src/lib/planDetails.js';
import { planLights } from '../src/lib/productionView.js';

test('step details are read, cleaned and none of them is required', () => {
  assert.deepEqual(readStepDetails(undefined), { details: null });
  assert.deepEqual(readStepDetails({}), { details: null });
  assert.deepEqual(readStepDetails({ qty: '', lengthIn: null, notes: '  ' }), { details: null });
  assert.deepEqual(readStepDetails({ qty: '12', lengthIn: '24.50000', widthIn: 6, tolerance: ' ±1/16 ', notes: ' Deburr both ends ', extra: 'x' }),
    { details: { qty: 12, lengthIn: 24.5, widthIn: 6, tolerance: '±1/16', notes: 'Deburr both ends' } });
  assert.equal(readStepDetails({ notes: 'x'.repeat(900) }).details.notes.length, 500);
});

test('a wrong step detail is refused with the reason', () => {
  for (const qty of [0, -1, 1.5, 'many', 1000001]) assert.match(readStepDetails({ qty }).error, /Pieces must be a whole number/, String(qty));
  for (const lengthIn of [0, -2, 'long', 100001]) assert.match(readStepDetails({ lengthIn }).error, /Length must be a number more than zero/, String(lengthIn));
  assert.match(readStepDetails({ widthIn: 0 }).error, /Width must be/);
  assert.match(readStepDetails({ notes: { a: 1 } }).error, /notes must be text/);
  assert.match(readStepDetails([1]).error, /must be an object/);
});

test('a step reads as one line at the machine', () => {
  assert.equal(stepDetailText({ qty: 12, lengthIn: 24.5, widthIn: 6, tolerance: '±1/16', notes: 'Deburr both ends' }), '12 pcs · 24.5" long · 6" wide · tol ±1/16 · Deburr both ends');
  assert.equal(stepDetailText({ qty: 1 }), '1 pc');
  assert.equal(stepDetailText({ qty: 2500, lengthIn: 120 }), '2,500 pcs · 120" long');
  assert.equal(stepDetailText(null), '');
  assert.equal(stepDetailText({}), '');
  assert.equal(sizeText({ thicknessIn: '0.2500', widthIn: 48, lengthIn: '96' }), '0.25" x 48" x 96"');
  assert.equal(sizeText({ widthIn: 48 }), '48"');
  assert.equal(sizeText({}), '');
});

test('the lights carry each step\'s detail line', () => {
  const lights = planLights([{ sequence: 2, name: 'Pack', status: 'PENDING' }, { sequence: 1, name: 'Cut', status: 'SCHEDULED', details: { qty: 4, lengthIn: 36 } }]);
  assert.equal(lights[0].detail, '4 pcs · 36" long');
  assert.equal(lights[1].detail, null);
});

test('a plan starts from what is on file: the job, then the order line, then the stock item', () => {
  const line = { lineNumber: 2, description: 'A36 plate cut', thicknessIn: '0.5', widthIn: '48', lengthIn: '96', qtyOrdered: '12', unit: 'EA', grade: { code: 'A36' }, product: { name: 'A36 Hot Rolled Plate', form: 'PLATE' } };
  const item = { coilNumber: 'C-7', form: 'SHEET', thicknessIn: '0.25', widthIn: '60', lengthIn: '120', grade: { code: '304SS' }, product: { name: '304 Sheet' } };
  const fromLine = planDefaults({ job: {}, line, item });
  assert.deepEqual({ ...fromLine, from: undefined }, { material: 'A36 Hot Rolled Plate', grade: 'A36', form: 'PLATE', thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qty: 12, orderedQty: 12, orderedUnit: 'EA', stockItem: 'C-7', from: undefined });
  assert.equal(fromLine.from.thicknessIn, 'order line 2');
  assert.equal(fromLine.from.qty, 'order line 2');

  const fromItem = planDefaults({ job: { instructions: 'Stock work - Slit C-7' }, item });
  assert.equal(fromItem.material, '304 Sheet');
  assert.equal(fromItem.grade, '304SS');
  assert.equal(fromItem.form, 'SHEET');
  assert.equal(fromItem.thicknessIn, 0.25);
  assert.equal(fromItem.from.thicknessIn, 'stock item C-7');
  assert.equal(fromItem.qty, null, 'no pieces without an order line sold by the piece');

  const jobWins = planDefaults({ job: { thicknessIn: '0.375', gradeOverride: 'A572' }, line, item });
  assert.equal(jobWins.thicknessIn, 0.375);
  assert.equal(jobWins.grade, 'A572');
  assert.equal(jobWins.from.thicknessIn, 'job');
  assert.equal(jobWins.widthIn, 48);
});

test('nothing is assumed when nothing is on file, and pounds are not pieces', () => {
  const none = planDefaults({ job: {} });
  assert.deepEqual([none.material, none.grade, none.form, none.thicknessIn, none.widthIn, none.lengthIn, none.qty], [null, null, null, null, null, null, null]);
  assert.deepEqual(none.from, {});
  assert.equal(planDefaults({ line: { lineNumber: 1, qtyOrdered: '5000', unit: 'LB' } }).qty, null);
  assert.equal(planDefaults({ line: { lineNumber: 1, qtyOrdered: '2.5', unit: 'EA' } }).qty, null);
  assert.equal(planDefaults({ line: { lineNumber: 1, product: { form: 'REBAR' } } }).form, null, 'a form the plan does not offer is left for the planner');
});
