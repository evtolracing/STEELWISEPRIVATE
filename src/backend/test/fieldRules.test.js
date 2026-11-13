import test from 'node:test';
import assert from 'node:assert/strict';
import { readFields, rangeError } from '../src/lib/fieldRules.js';

const SPEC = {
  code: { type: 'string', required: true, maxLength: 10 },
  kind: { type: 'enum', required: true, values: ['A', 'B'] },
  weight: { type: 'number', min: 0, max: 100 },
  active: { type: 'boolean' },
  cast: { type: 'date' },
  props: { type: 'json' },
  note: { type: 'string' },
};

test('only the listed fields are read: anything else the browser sends is dropped', () => {
  const { data, error } = readFields({ code: 'X1', kind: 'A', id: 'forged', createdById: 'someone', tenantId: 't' }, SPEC, { creating: true });
  assert.equal(error, null);
  assert.deepEqual(data, { code: 'X1', kind: 'A' });
});

test('creating needs every required field', () => {
  assert.match(readFields({ kind: 'A' }, SPEC, { creating: true }).error, /code is required/);
  assert.match(readFields({ code: '  ', kind: 'A' }, SPEC, { creating: true }).error, /code is required/);
});

test('changing reads only what was sent and never blanks a required field', () => {
  assert.deepEqual(readFields({ weight: '12.5' }, SPEC).data, { weight: 12.5 });
  assert.match(readFields({ code: '' }, SPEC).error, /code is required/);
  assert.deepEqual(readFields({ note: '' }, SPEC).data, { note: null });
});

test('values are checked against their type and limits', () => {
  assert.match(readFields({ kind: 'Z' }, SPEC).error, /kind must be one of A, B/);
  assert.match(readFields({ weight: 'heavy' }, SPEC).error, /weight must be a number/);
  assert.match(readFields({ weight: -1 }, SPEC).error, /0 or more/);
  assert.match(readFields({ weight: 101 }, SPEC).error, /100 or less/);
  assert.match(readFields({ weight: Infinity }, SPEC).error, /must be a number/);
  assert.match(readFields({ code: 'ABCDEFGHIJK' }, SPEC).error, /too long/);
  assert.match(readFields({ code: { $ne: null } }, SPEC).error, /must be text/);
  assert.match(readFields({ active: 'maybe' }, SPEC).error, /yes or no/);
  assert.match(readFields({ cast: 'not a date' }, SPEC).error, /must be a date/);
  assert.match(readFields({ cast: '0001-01-01' }, SPEC).error, /believable/);
  assert.match(readFields({ props: [1, 2] }, SPEC).error, /named values/);
  assert.match(readFields({ props: { big: 'x'.repeat(5000) } }, SPEC).error, /too large/);
});

test('good values come back in the right type', () => {
  const { data } = readFields({ code: ' X1 ', kind: 'B', weight: '7', active: 'true', cast: '2026-03-01', props: { C: 0.2 } }, SPEC);
  assert.equal(data.code, 'X1');
  assert.equal(data.weight, 7);
  assert.equal(data.active, true);
  assert.ok(data.cast instanceof Date);
  assert.deepEqual(data.props, { C: 0.2 });
});

test('a body that is not an object reads as empty', () => {
  assert.deepEqual(readFields(null, SPEC).data, {});
  assert.deepEqual(readFields([{ code: 'X' }], SPEC).data, {});
  assert.match(readFields('code=X', SPEC, { creating: true }).error, /code is required/);
});

test('a minimum cannot be above its maximum', () => {
  assert.match(rangeError({ lo: 5, hi: 2 }, [['lo', 'hi']]), /lo cannot be more than hi/);
  assert.equal(rangeError({ lo: 2, hi: 5 }, [['lo', 'hi']]), null);
  assert.equal(rangeError({ lo: 5, hi: null }, [['lo', 'hi']]), null);
});
