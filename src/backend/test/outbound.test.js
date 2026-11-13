import test from 'node:test';
import assert from 'node:assert/strict';
import { guarded, OutboundError, mayPass, waitBefore, breakerState, outboundStats, resetOutbound, outsideFailure } from '../src/lib/outbound.js';

const noSleep = { sleep: async () => {} };
const failing = (status) => async () => { throw Object.assign(new Error('provider said no: key sk-secret'), status ? { status } : {}); };

test('only failures that can pass are worth repeating', () => {
  for (const s of [408, 429, 500, 502, 503, 504]) assert.equal(mayPass(s), true, String(s));
  for (const s of [400, 401, 403, 404, 409, 422]) assert.equal(mayPass(s), false, String(s));
});

test('the wait between tries doubles, is capped and is never zero', () => {
  const opts = { baseDelayMs: 100, maxDelayMs: 500 };
  assert.equal(waitBefore(2, { ...opts, random: () => 1 }), 100);
  assert.equal(waitBefore(3, { ...opts, random: () => 1 }), 200);
  assert.equal(waitBefore(9, { ...opts, random: () => 1 }), 500);
  assert.equal(waitBefore(2, { ...opts, random: () => 0 }), 50);
});

test('a call that never answers is abandoned at the time limit', async () => {
  resetOutbound();
  const started = Date.now();
  await assert.rejects(guarded('slow', () => new Promise(() => {}), { timeoutMs: 60 }), (e) => e instanceof OutboundError && e.kind === 'TIMEOUT');
  assert.ok(Date.now() - started < 1000);
  assert.equal(outboundStats().find((s) => s.service === 'slow').timeouts, 1);
});

test('a call is made once unless the caller says it is safe to repeat', async () => {
  resetOutbound();
  let calls = 0;
  await assert.rejects(guarded('once', async () => { calls += 1; throw Object.assign(new Error('x'), { status: 503 }); }, { tries: 4, ...noSleep }));
  assert.equal(calls, 1);
});

test('a repeatable call is tried again on a passing failure, up to the limit, then gives up', async () => {
  resetOutbound();
  let calls = 0;
  const value = await guarded('flaky', async () => { calls += 1; if (calls < 3) throw Object.assign(new Error('x'), { status: 503 }); return 'ok'; }, { repeatable: true, tries: 3, ...noSleep });
  assert.equal(value, 'ok'); assert.equal(calls, 3);
  resetOutbound(); calls = 0;
  await assert.rejects(guarded('down', async () => { calls += 1; throw new Error('socket'); }, { repeatable: true, tries: 3, breakerAfter: 99, ...noSleep }), (e) => e.kind === 'NETWORK' && e.tries === 3);
  assert.equal(calls, 3);
  resetOutbound(); calls = 0;
  await assert.rejects(guarded('many', async () => { calls += 1; throw new Error('socket'); }, { repeatable: true, tries: 500, breakerAfter: 999, ...noSleep }));
  assert.equal(calls, 5, 'never more than five tries, whatever is asked');
});

test('a refusal (4xx) is never repeated and does not count against the service', async () => {
  resetOutbound();
  let calls = 0;
  await assert.rejects(guarded('strict', async () => { calls += 1; throw Object.assign(new Error('bad'), { status: 400 }); }, { repeatable: true, tries: 3, ...noSleep }), (e) => e.kind === 'HTTP' && e.status === 400);
  assert.equal(calls, 1);
  assert.equal(breakerState('strict'), 'CLOSED');
});

test('after failures in a row the service is left alone, then tried again after the rest', async () => {
  resetOutbound();
  let clock = 1_000_000; let calls = 0;
  const opts = { now: () => clock, breakerAfter: 3, breakerRestMs: 5000, ...noSleep };
  for (let i = 0; i < 3; i += 1) await assert.rejects(guarded('svc', async () => { calls += 1; throw new Error('down'); }, opts));
  assert.equal(breakerState('svc', clock), 'OPEN');
  await assert.rejects(guarded('svc', async () => { calls += 1; return 'never'; }, opts), (e) => e.kind === 'BREAKER_OPEN');
  assert.equal(calls, 3, 'no call is made while the breaker is open');
  clock += 5001;
  assert.equal(await guarded('svc', async () => 'back', opts), 'back');
  assert.equal(breakerState('svc', clock), 'CLOSED');
  const stats = outboundStats(clock).find((s) => s.service === 'svc');
  assert.equal(stats.refusedByBreaker, 1); assert.equal(stats.failed, 3); assert.equal(stats.ok, 1);
});

test('our caller never gets the provider status or its words', async () => {
  resetOutbound();
  const cases = [[failing(401), 502], [failing(500), 502], [failing(null), 502]];
  for (const [fn, status] of cases) {
    const error = await guarded('p', fn, { breakerAfter: 99 }).catch((e) => e);
    const out = outsideFailure(error, 'Speech');
    assert.equal(out.status, status);
    assert.ok(!/sk-secret|provider said/.test(out.error), out.error);
  }
  const slow = await guarded('p2', () => new Promise(() => {}), { timeoutMs: 20 }).catch((e) => e);
  assert.equal(outsideFailure(slow, 'Speech').status, 504);
  assert.equal(outsideFailure(new OutboundError('x', { kind: 'BREAKER_OPEN', service: 'p' }), 'Speech').status, 503);
  assert.equal(outsideFailure(new Error('No AI provider configured'), 'The assistant').status, 503);
  assert.equal(outsideFailure(new Error('something else')), null);
});
