import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteLineTotal, quoteMoveError, isExpired } from '../src/lib/quoteRules.js';

test('quote line totals follow the price unit', () => {
  assert.deepEqual(quoteLineTotal(1000, 'LB', 42.5, 'CWT'), { extended: 425 });
  assert.deepEqual(quoteLineTotal(4000, 'LB', 900, 'TON'), { extended: 1800 });
  assert.deepEqual(quoteLineTotal(10, 'LB', 0.65, 'LB'), { extended: 6.5 });
  assert.deepEqual(quoteLineTotal(5, 'EA', 4, 'EACH'), { extended: 20 });
  assert.deepEqual(quoteLineTotal(3, 'EA', 0, 'EACH'), { extended: 0 });
});

test('quote lines that cannot be priced are refused', () => {
  assert.match(quoteLineTotal(5, 'EA', 4, 'CWT').error, /needs the quantity in LB/);
  assert.match(quoteLineTotal(0, 'LB', 4, 'CWT').error, /quantity/);
  assert.match(quoteLineTotal(-1, 'LB', 4, 'CWT').error, /quantity/);
  assert.match(quoteLineTotal(10, 'LB', -4, 'CWT').error, /unitPrice/);
  assert.match(quoteLineTotal(10, 'LB', undefined, 'CWT').error, /unitPrice/);
  assert.match(quoteLineTotal(10, 'LB', 4, 'BUSHEL').error, /priceUnit/);
});

test('quote moves', () => {
  const future = new Date(Date.now() + 864e5);
  const past = new Date(Date.now() - 864e5);
  assert.equal(quoteMoveError({ status: 'DRAFT', validUntil: future }, 'SENT'), null);
  assert.equal(quoteMoveError({ status: 'DRAFT', validUntil: future }, 'ACCEPTED'), null);
  assert.equal(quoteMoveError({ status: 'SENT', validUntil: future }, 'ACCEPTED'), null);
  assert.match(quoteMoveError({ status: 'SENT', validUntil: past }, 'ACCEPTED'), /expired/);
  assert.match(quoteMoveError({ status: 'ACCEPTED', validUntil: future }, 'ACCEPTED'), /already/);
  assert.match(quoteMoveError({ status: 'ACCEPTED', validUntil: future }, 'REJECTED'), /cannot be changed/);
  assert.match(quoteMoveError({ status: 'REJECTED', validUntil: future }, 'SENT'), /cannot be changed/);
  assert.equal(isExpired({ status: 'SENT', validUntil: past }), true);
  assert.equal(isExpired({ status: 'ACCEPTED', validUntil: past }), false);
  assert.equal(isExpired({ status: 'SENT', validUntil: null }), false);
});
