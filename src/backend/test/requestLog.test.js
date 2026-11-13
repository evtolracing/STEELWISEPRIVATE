import test from 'node:test';
import assert from 'node:assert/strict';
import { requestIdFrom, levelFor } from '../src/middleware/requestLog.js';

test('a well-formed incoming request id is kept; anything else is replaced', () => {
  assert.equal(requestIdFrom('abc12345-def'), 'abc12345-def');
  for (const bad of [undefined, '', 'short', 'has space in it', '<script>alert(1)</script>', 'x'.repeat(65), 'line\nbreak-12345']) {
    const id = requestIdFrom(bad);
    assert.notEqual(id, bad);
    assert.match(id, /^[0-9a-f-]{36}$/);
  }
  assert.equal(requestIdFrom(['first-id-123', 'second-id-456']), 'first-id-123');
});

test('log level: server errors are errors, slow requests are warnings', () => {
  assert.equal(levelFor(200, 12), 'info');
  assert.equal(levelFor(404, 12), 'info');
  assert.equal(levelFor(200, 1500), 'warn');
  assert.equal(levelFor(500, 12), 'error');
  assert.equal(levelFor(503, 5000), 'error');
});
