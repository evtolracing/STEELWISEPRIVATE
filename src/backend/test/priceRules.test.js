import test from 'node:test';
import assert from 'node:assert/strict';
import { levelForTier, levelPrice, extendPrice, taxStateFor, TIER_TO_LEVEL } from '../src/lib/priceRules.js';

const now = new Date('2026-06-15T12:00:00Z');

test('each pricing tier gives its price level', () => {
  assert.equal(levelForTier({ tierCode: 'A', isActive: true }, now), 'CONTRACT_B');
  assert.equal(levelForTier({ tierCode: 'B', isActive: true }, now), 'CONTRACT_A');
  assert.equal(levelForTier({ tierCode: 'C', isActive: true }, now), 'VOLUME');
  assert.equal(levelForTier({ tierCode: 'D', isActive: true }, now), 'RETAIL');
  assert.deepEqual(Object.keys(TIER_TO_LEVEL), ['A', 'B', 'C', 'D']);
});

test('no tier, an unknown tier or a switched-off tier pays list', () => {
  assert.equal(levelForTier(null, now), 'RETAIL');
  assert.equal(levelForTier(undefined, now), 'RETAIL');
  assert.equal(levelForTier({ tierCode: 'Z', isActive: true }, now), 'RETAIL');
  assert.equal(levelForTier({ tierCode: 'A', isActive: false }, now), 'RETAIL');
});

test('a tier applies only between its start and end dates', () => {
  assert.equal(levelForTier({ tierCode: 'A', isActive: true, effectiveFrom: '2026-07-01T00:00:00Z' }, now), 'RETAIL');
  assert.equal(levelForTier({ tierCode: 'A', isActive: true, effectiveFrom: '2026-01-01T00:00:00Z' }, now), 'CONTRACT_B');
  assert.equal(levelForTier({ tierCode: 'A', isActive: true, effectiveUntil: '2026-06-01T00:00:00Z' }, now), 'RETAIL');
  assert.equal(levelForTier({ tierCode: 'A', isActive: true, effectiveUntil: '2026-12-31T00:00:00Z' }, now), 'CONTRACT_B');
  assert.equal(levelForTier({ tierCode: 'A', isActive: true, effectiveFrom: null, effectiveUntil: null }, now), 'CONTRACT_B');
});

test('the level multiplier is applied to the list price in the product\'s own unit', () => {
  assert.deepEqual(levelPrice({ basePriceCwt: '24.99', priceUnit: 'EACH' }, { multiplier: 0.92 }), { listPrice: 24.99, unitPrice: 22.9908, priceUnit: 'EACH' });
  assert.deepEqual(levelPrice({ basePriceCwt: 42, priceUnit: 'CWT' }), { listPrice: 42, unitPrice: 42, priceUnit: 'CWT' });
});

test('a product with no list price has no price, never a made-up one', () => {
  assert.equal(levelPrice({ basePriceCwt: null, priceUnit: 'CWT' }), null);
  assert.equal(levelPrice({ basePriceCwt: 0, priceUnit: 'CWT' }), null);
  assert.equal(levelPrice(null), null);
});

test('line totals follow the price unit', () => {
  assert.equal(extendPrice(42, 'CWT', 250), 105);
  assert.equal(extendPrice(800, 'TON', 500), 200);
  assert.equal(extendPrice(22.9908, 'EACH', 3), 68.97);
  assert.equal(extendPrice(1.5, 'LF', 20), 30);
  assert.equal(extendPrice(42, 'CWT', 0), 0);
});

test('an order is always taxed at the selling branch state', () => {
  assert.equal(taxStateFor({ shipToState: 'oh', customerState: 'MI', branchState: 'IN' }), 'IN');
  assert.equal(taxStateFor({ customerState: 'MI', branchState: ' in ' }), 'IN');
  assert.equal(taxStateFor({}), null);
});

test('with no branch known the ship-to state is used, then the customer state', () => {
  assert.equal(taxStateFor({ shipToState: 'OH', customerState: 'MI' }), 'OH');
  assert.equal(taxStateFor({ customerState: 'MI' }), 'MI');
});
