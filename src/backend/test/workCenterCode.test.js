import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextWorkCenterCode, branchWorkCenterCode, typedWorkCenterCode } from '../src/lib/workCenterCode.js';

test('the first of a kind is 01', () => assert.equal(nextWorkCenterCode('ROUTER', []), 'ROUTER-01'));
test('the next number is one past the highest in use, not the count', () => {
  // ROUTER-01 was renamed away or never existed: two routers, and 02 is taken.
  assert.equal(nextWorkCenterCode('ROUTER', ['ROUTER-02']), 'ROUTER-03');
  assert.equal(nextWorkCenterCode('ROUTER', ['ROUTER-01', 'ROUTER-02', 'ROUTER-07']), 'ROUTER-08');
});
test('other kinds and hand-typed codes do not count', () => {
  assert.equal(nextWorkCenterCode('SAW', ['ROUTER-05', 'SAW-A', 'SAWMILL-09', 'SAW-02']), 'SAW-03');
});
test('numbers past 99 keep counting', () => assert.equal(nextWorkCenterCode('SAW', ['SAW-99']), 'SAW-100'));
test('letter case of a stored code does not hide it', () => assert.equal(nextWorkCenterCode('ROUTER', ['router-04']), 'ROUTER-05'));

test('each branch numbers its own machines from 01', () => {
  const inUse = ['CT-ROUTER-01', 'CT-ROUTER-02', 'ROUTER-01', 'ROUTER-02'];
  assert.equal(branchWorkCenterCode('CT', 'ROUTER', inUse), 'CT-ROUTER-03');
  assert.equal(branchWorkCenterCode('PV', 'ROUTER', inUse), 'PV-ROUTER-01');
});
test('a typed code is kept under its branch, once', () => {
  assert.equal(typedWorkCenterCode('PV', 'ROUTER-1'), 'PV-ROUTER-1');
  assert.equal(typedWorkCenterCode('PV', ' pv-ROUTER-1 '), 'pv-ROUTER-1');
});
