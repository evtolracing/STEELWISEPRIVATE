import test from 'node:test';
import assert from 'node:assert/strict';
import { creditPosition, uninvoiced, creditHoldMessage, COMMITTED_STATUSES } from '../src/lib/creditRules.js';

test('exposure is what is owed, plus committed orders, plus this order', () => {
  const p = creditPosition({ limit: 10000, owed: 2500.5, openOrders: 3000, thisOrder: 1499.5 });
  assert.equal(p.exposure, 7000);
  assert.equal(p.over, false);
  assert.equal(p.overBy, 0);
});

test('an order that takes the account past its limit is over, by the difference', () => {
  const p = creditPosition({ limit: 10000, owed: 6000, openOrders: 3000, thisOrder: 1500 });
  assert.equal(p.over, true);
  assert.equal(p.overBy, 500);
});

test('an order that lands exactly on the limit is not over', () => {
  assert.equal(creditPosition({ limit: 10000, owed: 4000, openOrders: 0, thisOrder: 6000 }).over, false);
  assert.equal(creditPosition({ limit: 10000, owed: 4000, openOrders: 0, thisOrder: 6000.01 }).over, true);
});

test('no limit set means no hold; a limit of zero holds any order on account', () => {
  for (const limit of [null, undefined, '']) assert.equal(creditPosition({ limit, owed: 1e9, thisOrder: 1e9 }).over, false);
  assert.equal(creditPosition({ limit: 0, thisOrder: 0.01 }).over, true);
  assert.equal(creditPosition({ limit: 0, thisOrder: 0 }).over, false);
});

test('money the company owes the customer lowers the exposure', () => {
  assert.equal(creditPosition({ limit: 1000, owed: -300, thisOrder: 1200 }).over, false);
});

test('an order adds only what has not been invoiced yet', () => {
  assert.equal(uninvoiced(1000, 400), 600);
  assert.equal(uninvoiced(1000, 1000), 0);
  assert.equal(uninvoiced(1000, 1250), 0);
  assert.equal(uninvoiced(null, 0), 0);
});

test('the hold is decided when an order is submitted or confirmed, not while it is a draft', () => {
  assert.deepEqual(COMMITTED_STATUSES, ['PENDING', 'CONFIRMED']);
});

test('the warning names the exposure, the limit and the amount over', () => {
  const text = creditHoldMessage(creditPosition({ limit: 10000, owed: 6000, openOrders: 3000, thisOrder: 1500 }));
  assert.match(text, /\$10,500\.00/);
  assert.match(text, /\$10,000\.00/);
  assert.match(text, /\$500\.00 over/);
  assert.match(text, /manager/);
});
