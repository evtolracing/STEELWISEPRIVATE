import test from 'node:test';
import assert from 'node:assert/strict';
import { listWindow, sendWindow } from '../src/lib/listing.js';

test('a list call with no window behaves as before', () => {
  assert.deepEqual(listWindow({}, { max: 500, fallback: 100 }), { take: 100, skip: 0, windowed: false });
  assert.deepEqual(listWindow(undefined, { max: 200 }), { take: 200, skip: 0, windowed: false });
});

test('limit and offset are honoured, inside the route maximum', () => {
  assert.deepEqual(listWindow({ limit: '25', offset: '50' }, { max: 500 }), { take: 25, skip: 50, windowed: true });
  assert.equal(listWindow({ limit: '100000' }, { max: 500 }).take, 500);
  assert.equal(listWindow({ limit: '0' }, { max: 500, fallback: 100 }).take, 100);
  assert.equal(listWindow({ limit: '-5' }, { max: 500 }).take, 1);
  assert.equal(listWindow({ limit: 'abc' }, { max: 500, fallback: 50 }).take, 50);
  assert.equal(listWindow({ offset: '-3' }, { max: 500 }).skip, 0);
  assert.equal(listWindow({ offset: 'x' }, { max: 500 }).skip, 0);
});

test('the window is reported in headers and the body stays an array', () => {
  const headers = {}; let body;
  const res = { set: (k, v) => { headers[k] = v; }, json: (b) => { body = b; return res; } };
  sendWindow(res, [1, 2], { take: 2, skip: 4, total: 9 });
  assert.deepEqual(body, [1, 2]);
  assert.equal(headers['X-Total-Count'], '9'); assert.equal(headers['X-Limit'], '2'); assert.equal(headers['X-Offset'], '4');
  assert.match(headers['Access-Control-Expose-Headers'], /X-Total-Count/);
});
