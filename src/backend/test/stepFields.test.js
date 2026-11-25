// The questions the Plan Job box asks per step, and the detail lines the screens show (owner, 2026-11-24).
import test from 'node:test';
import assert from 'node:assert/strict';
import { stepFieldLabels, startingDetails, detailsToSend, filledFromText } from '../../frontend/src/components/jobs/stepFields.js';
import { detailRows } from '../../frontend/src/components/production/productionView.js';

test('a saw asks pieces and a cut length; a slitter asks cuts and a slit width', () => {
  assert.deepEqual(stepFieldLabels('SAW Band Saw Cut to Size'), { qty: 'Pieces', length: 'Cut length (in)', width: null, hint: 'How many pieces and how long each is cut.' });
  assert.equal(stepFieldLabels('P11SAW').length, 'Cut length (in)');
  const slit = stepFieldLabels('SLITTER Slit Coil');
  assert.deepEqual([slit.qty, slit.length, slit.width], ['Number of cuts', null, 'Slit width (in)']);
  const shear = stepFieldLabels('SHEAR');
  assert.deepEqual([shear.length, shear.width], ['Cut length (in)', 'Cut width (in)']);
  assert.equal(stepFieldLabels('LASER').length, 'Part length (in)');
  assert.deepEqual([stepFieldLabels('PACKOUT Pack & Ship').length, stepFieldLabels('PACKOUT').width], [null, null]);
  assert.deepEqual([stepFieldLabels('').qty, stepFieldLabels('DEBURR').length, stepFieldLabels(null).width], ['Pieces', 'Length (in)', 'Width (in)']);
});

test('a new step starts with the pieces and size on file, only for the questions it asks', () => {
  const onFile = { qty: 12, lengthIn: 96, widthIn: 48 };
  assert.deepEqual(startingDetails(onFile, stepFieldLabels('SAW')), { qty: '12', lengthIn: '96', widthIn: '', tolerance: '', notes: '' });
  assert.deepEqual(startingDetails(onFile, stepFieldLabels('PACKOUT')), { qty: '12', lengthIn: '', widthIn: '', tolerance: '', notes: '' });
  assert.deepEqual(startingDetails(null, stepFieldLabels('SAW')), { qty: '', lengthIn: '', widthIn: '', tolerance: '', notes: '' });
});

test('only what was filled in is sent, and nothing for a question the step does not ask', () => {
  assert.deepEqual(detailsToSend({ qty: '12', lengthIn: '24.5', widthIn: '6', tolerance: ' ±1/16 ', notes: ' Deburr ' }, stepFieldLabels('SAW')), { qty: 12, lengthIn: 24.5, tolerance: '±1/16', notes: 'Deburr' });
  assert.equal(detailsToSend({ qty: '', lengthIn: '', notes: '  ' }, stepFieldLabels('SAW')), undefined);
  assert.equal(detailsToSend(undefined, stepFieldLabels('SAW')), undefined);
});

test('the box says where the material came from', () => {
  assert.equal(filledFromText({ thicknessIn: 'order line 2', grade: 'order line 2' }), 'Filled in from order line 2. Change anything that is wrong.');
  assert.equal(filledFromText({ thicknessIn: 'job', widthIn: 'stock item C-7' }), 'Filled in from the job and stock item C-7. Change anything that is wrong.');
  assert.equal(filledFromText({}), '');
  assert.equal(filledFromText(null), '');
});

test('the detail lines: every step that says what to do, or only the step the job is on', () => {
  const steps = [
    { name: 'Cut', status: 'COMPLETE', detail: '12 pcs · 24" long' },
    { name: 'Deburr', status: 'SCHEDULED', detail: 'Both ends' },
    { name: 'Pack', status: 'PENDING', detail: null },
  ];
  assert.deepEqual(detailRows(steps, 'all').map((r) => `${r.n}. ${r.name}: ${r.detail}${r.now ? ' (now)' : ''}`), ['1. Cut: 12 pcs · 24" long', '2. Deburr: Both ends (now)']);
  assert.deepEqual(detailRows(steps, 'current').map((r) => r.n), [2]);
  assert.deepEqual(detailRows([{ ...steps[0], here: true }, steps[1]], 'current').map((r) => r.n), [1], 'this machine\'s step wins');
  assert.deepEqual(detailRows([{ name: 'Pack', status: 'PENDING' }], 'all'), []);
  assert.deepEqual(detailRows(null), []);
});
