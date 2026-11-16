import test from 'node:test';
import assert from 'node:assert/strict';
import { readSpecs, mergeSpecs, specColumns, specsOfLine } from '../src/lib/lineSpecs.js';

const asked = {
  description: 'A36 plate', gradeId: 'g-1', grade: 'A36', thicknessIn: '0.5', widthIn: 48, lengthIn: 96, finish: 'Pickled and oiled',
  thkTolerancePlus: 0.01, thkToleranceMinus: 0, certRequirements: ['mtr', 'COC', 'MTR'], processing: 'Shear to size', specNotes: 'Flatness 1/8 in',
};

test('a request line keeps grade, size, tolerances, certificates and processing (J-001)', () => {
  const { specs, error } = readSpecs(asked);
  assert.equal(error, undefined);
  assert.deepEqual(specs, {
    thicknessIn: 0.5, widthIn: 48, lengthIn: 96, thkTolerancePlus: 0.01, thkToleranceMinus: 0,
    gradeOverride: 'A36', surfaceFinish: 'Pickled and oiled', specNotes: 'Flatness 1/8 in', processing: 'Shear to size',
    certRequirements: ['MTR', 'COC'], gradeId: 'g-1',
  });
});

test('a requirement that is not a real value is refused, not dropped', () => {
  assert.match(readSpecs({ thicknessIn: 'thick' }).error, /thicknessIn/);
  assert.match(readSpecs({ widthIn: 0 }).error, /more than zero/);
  assert.match(readSpecs({ lenTolerancePlus: -1 }).error, /lenTolerancePlus/);
  assert.match(readSpecs({ certRequirements: [3] }).error, /certRequirements/);
  assert.deepEqual(readSpecs({}).specs, {});
  assert.deepEqual(readSpecs({ thicknessIn: '', grade: null }).specs, {});
});

test('the quote and order line get the requirements in their own columns, processing in the notes', () => {
  const cols = specColumns(readSpecs(asked).specs);
  assert.equal(cols.thicknessIn, 0.5);
  assert.equal(cols.gradeOverride, 'A36');
  assert.deepEqual(cols.certRequirements, ['MTR', 'COC']);
  assert.equal(cols.specNotes, 'Flatness 1/8 in · Processing: Shear to size');
  assert.equal(cols.processing, undefined);
  assert.equal(cols.gradeId, undefined);
  // Said once even when carried a second time.
  assert.equal(specColumns({ ...readSpecs(asked).specs, specNotes: cols.specNotes }).specNotes, cols.specNotes);
});

test('what the quote line says wins; the request fills what the quote left out', () => {
  const fromRfq = readSpecs(asked).specs;
  const merged = mergeSpecs(readSpecs({ thicknessIn: 0.625 }).specs, fromRfq);
  assert.equal(merged.thicknessIn, 0.625);
  assert.equal(merged.widthIn, 48);
  assert.deepEqual(mergeSpecs(undefined, null), {});
});

test('requirements read back off a saved line come out the same', () => {
  const saved = { ...specColumns(readSpecs(asked).specs), thicknessIn: '0.5', widthIn: '48', lengthIn: null, certRequirements: ['MTR', 'COC'], tolerancePreset: '' };
  const back = specsOfLine(saved);
  assert.equal(back.thicknessIn, 0.5);
  assert.equal(back.widthIn, 48);
  assert.equal('lengthIn' in back, false);
  assert.equal('tolerancePreset' in back, false);
  const again = specColumns(back);
  assert.equal(again.specNotes, 'Flatness 1/8 in · Processing: Shear to size');
  assert.deepEqual(again.certRequirements, ['MTR', 'COC']);
  assert.equal(again.gradeOverride, 'A36');
});
