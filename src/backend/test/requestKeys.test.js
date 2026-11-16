import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyHashOf, validKey } from '../src/middleware/requestKeys.js';
import { roundedArgs } from '../src/lib/moneyColumns.js';

test('a request key is 8 to 200 printable characters with no spaces', () => {
  assert.ok(validKey('abcdefgh'));
  assert.ok(validKey('b3c1e6c2-7d0a-4f1e-9a55-2f6d7c1a9e10'));
  assert.ok(validKey('x'.repeat(200)));
  for (const bad of ['abc', '', 'has a space in it', 'x'.repeat(201), 'tab\tinside-key', 'line\nbreak-key', null, undefined, 12345678, {}]) assert.equal(validKey(bad), false, String(bad).slice(0, 20));
});

test('the same body always gives the same fingerprint, and any change gives another', () => {
  const body = { orderType: 'SO', lines: [{ qtyOrdered: 100, unitPrice: 0.65 }] };
  assert.equal(bodyHashOf(body), bodyHashOf(JSON.parse(JSON.stringify(body))));
  assert.notEqual(bodyHashOf(body), bodyHashOf({ ...body, orderType: 'PO' }));
  assert.notEqual(bodyHashOf(body), bodyHashOf({ ...body, lines: [{ qtyOrdered: 100, unitPrice: 0.66 }] }));
  assert.equal(bodyHashOf(undefined), bodyHashOf(null), 'no body and an empty body are the same request');
  assert.match(bodyHashOf(body), /^[0-9a-f]{64}$/);
});

test('a stored request key is not itself rewritten by the amount rounding', () => {
  const args = { data: { scope: 'u POST /api/orders', key: 'abcdefgh', bodyHash: 'x', status: 'IN_PROGRESS' } };
  assert.equal(roundedArgs('RequestKey', 'create', args), args);
});
