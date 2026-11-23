// The material list on the new work order page (owner, 2026-11-23: "the materials are not dropping in the drop down").
import test from 'node:test';
import assert from 'node:assert/strict';
import { stockTitle, stockDetail, stockSize, stockMatches, stockOnHandLb, canBeCut } from '../../frontend/src/pages/WorkOrders/sourceStock.js';

const plate = { id: 'c1', coilNumber: 'DEMO-R-0046', form: 'PLATE', thicknessIn: '0.2500', widthIn: '48', lengthIn: '96.000', netWeightLb: '367', qcStatus: 'PASSED',
  grade: { code: 'A36', name: 'ASTM A36 Structural' }, product: { name: 'A36 Hot Rolled Plate', sku: 'PL-A36-250' }, heat: { heatNumber: 'H7781' }, location: { name: 'Fort Wayne', code: 'FWA' }, inventory: { qtyOnHand: '184.4' } };

test('a row says what the material is, with no "?" or "Unknown"', () => {
  assert.equal(stockTitle(plate), 'DEMO-R-0046 · A36 Plate');
  assert.equal(stockDetail(plate), 'A36 Hot Rolled Plate · 0.25" x 48" x 96" · 184 lb · Fort Wayne');
  const bare = { id: 'c2', coilNumber: 'X-1' };
  assert.equal(stockTitle(bare), 'X-1');
  assert.equal(stockDetail(bare), '');
  assert.equal(stockSize({ widthIn: 36 }), '36"');
  assert.doesNotMatch(stockTitle(bare) + stockDetail(bare), /\?|Unknown|undefined|null/);
});

test('typing a material, grade, form, size, heat or branch finds the item', () => {
  for (const typed of ['hot rolled', 'a36', 'plate', 'PLATE 48', '0.25', 'h7781', 'fort wayne', 'fwa', 'demo-r', 'pl-a36', 'plate a36 96', '']) assert.equal(stockMatches(plate, typed), true, typed);
  for (const typed of ['304', 'coil', 'a36 tube']) assert.equal(stockMatches(plate, typed), false, typed);
});

test('the weight shown is what is on hand, and only stock that can be cut is offered', () => {
  assert.equal(stockOnHandLb(plate), 184.4);
  assert.equal(stockOnHandLb({ netWeightLb: '500' }), 500);
  assert.equal(canBeCut(plate), true);
  assert.equal(canBeCut({ ...plate, inventory: { qtyOnHand: 0 } }), false);
  assert.equal(canBeCut({ ...plate, qcStatus: 'HOLD' }), false);
  assert.equal(canBeCut({ ...plate, qcStatus: 'FAILED' }), false);
  assert.equal(canBeCut({ coilNumber: 'N', netWeightLb: null }), true, 'no weight on file is not a reason to hide it');
});
