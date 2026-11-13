import test from 'node:test';
import assert from 'node:assert/strict';
import { safeErrors, pagingGuard, looksInternal } from '../src/middleware/safeErrors.js';

function reply(status, body) {
  const res = { statusCode: 200, sent: null, status(c) { this.statusCode = c; return this; }, json(b) { this.sent = b; return this; } };
  const quiet = console.error; console.error = () => {};
  try {
    safeErrors({ method: 'GET', originalUrl: '/api/x' }, res, () => {});
    res.status(status).json(body);
  } finally { console.error = quiet; }
  return res.sent;
}

test('database detail is removed from error replies', () => {
  const leaked = '\nInvalid `prisma.dropTag.count()` invocation:\n{ select: { _count: ... } }\nUnknown argument `status`';
  assert.equal(reply(500, { error: leaked }).error, 'Something went wrong on our side. Please try again.');
  assert.equal(reply(400, { error: leaked }).error, 'That request could not be processed. Check the values and try again.');
  const withDetails = reply(500, { error: 'Failed to create job', details: 'Unique constraint failed on the fields: (`jobNumber`)' });
  assert.deepEqual(withDetails, { error: 'Failed to create job' });
  assert.equal(reply(500, { success: false, message: "TypeError: Cannot read properties of undefined (reading 'map')" }).message, 'Something went wrong on our side. Please try again.');
});

test('messages written for people pass through', () => {
  for (const body of [{ error: 'Order not found' }, { error: 'Line 2: only 40 is left to ship' }, { error: 'Not enough available: 12 on hand to reserve' }, { success: false, error: 'Failed to fetch operators' }]) {
    assert.deepEqual(reply(409, body), body);
  }
});

test('successful replies are never touched', () => {
  const body = { error: 'Invalid `prisma.x` (a field that happens to hold this text)', data: [1] };
  assert.deepEqual(reply(200, body), body);
  assert.deepEqual(reply(201, [1, 2]), [1, 2]);
});

test('looksInternal', () => {
  assert.ok(looksInternal('Foreign key constraint failed on the field: `buyerId`'));
  assert.ok(looksInternal('Error: x\n    at foo (/app/node_modules/y.js:1:1)'));
  assert.ok(!looksInternal('Customer not found'));
  assert.ok(!looksInternal(undefined));
});

test('pagingGuard refuses paging values that are not whole numbers', () => {
  const run = (query) => { let passed = false; const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; } }; pagingGuard({ query }, res, () => { passed = true; }); return { passed, code: res.code, body: res.body }; };
  assert.ok(run({}).passed);
  assert.ok(run({ limit: '50', offset: '0', page: '2' }).passed);
  assert.ok(run({ limit: '' }).passed);
  for (const query of [{ limit: 'abc' }, { page: '-1' }, { offset: '1.5' }, { take: ['1', '2'] }, { skip: '99999999999' }, { pageSize: '10; DROP' }]) {
    const r = run(query);
    assert.equal(r.passed, false, JSON.stringify(query));
    assert.equal(r.code, 400);
  }
});

test('a rejected filter value is the caller\'s mistake only when the caller sent it', async () => {
  const { blamesCaller } = await import('../src/middleware/safeErrors.js');
  const message = 'Invalid value for argument `status`. Expected OrderStatus.\n  where: { status: "\';--" }';
  assert.equal(blamesCaller(message, { query: { status: "';--" }, params: {} }), true);
  assert.equal(blamesCaller(message, { query: {}, params: {} }), false);
  assert.equal(blamesCaller('Invalid value for argument `status`. where: { status: { in: ["CONVERTED"] } }', { query: { period: 'week' }, params: {} }), false);
  assert.equal(blamesCaller(undefined, { query: { status: 'x' } }), false);
});

test('a change aimed at a missing record, or carrying values the database will not take, is not a server error', async () => {
  const { callerMistake } = await import('../src/middleware/safeErrors.js');
  const { isRecordNotFound, isRejectedShape } = await import('../src/lib/requestContext.js');
  assert.equal(isRecordNotFound({ code: 'P2025' }), true);
  assert.equal(isRecordNotFound({ code: 'P2002' }), false);
  assert.equal(isRejectedShape({ name: 'PrismaClientValidationError' }), true);
  assert.equal(isRejectedShape(new Error('boom')), false);
  assert.deepEqual(callerMistake(500, { method: 'PATCH' }, { recordNotFound: true }), { status: 404, error: 'That record was not found.' });
  assert.equal(callerMistake(500, { method: 'POST' }, { rejectedShape: 'Argument `code` is missing.' }).status, 400);
  // Not found wins over a refused value; a real failure stays a server error; reads are handled elsewhere; other statuses are left alone.
  assert.equal(callerMistake(500, { method: 'PUT' }, { recordNotFound: true, rejectedShape: 'x' }).status, 404);
  assert.equal(callerMistake(500, { method: 'POST' }, {}), null);
  assert.equal(callerMistake(500, { method: 'GET' }, { recordNotFound: true }), null);
  assert.equal(callerMistake(409, { method: 'POST' }, { recordNotFound: true }), null);
});
