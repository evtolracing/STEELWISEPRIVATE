// Phase 11: the rules that keep the product answering at the size of eighty branches on several
// server processes. Each test names the finding it guards and fails when that fix is taken out
// (qa/tools/phase11-mutations.mjs takes each one out and runs this file).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNumbered, padded, seriesOf } from '../src/lib/numbering.js';
import { limiter } from '../src/lib/passwords.js';

const dup = (target) => Object.assign(new Error('duplicate'), { code: 'P2002', meta: { target } });

/** A counter kept in memory, shaped like the database one, that records how it was used. */
function memoryCounter() {
  const rows = new Map(); const seeds = new Map(); const calls = { take: 0, seed: 0, advance: [] };
  return {
    rows, calls,
    // Like the database statement, the first use is decided once: later callers wait for the same seed.
    async take(series, seed) { calls.take += 1; if (!seeds.has(series)) { calls.seed += 1; seeds.set(series, Promise.resolve(seed()).then((n) => rows.set(series, Number(n)))); } await seeds.get(series); rows.set(series, rows.get(series) + 1); return rows.get(series); },
    async advance(series, by) { calls.advance.push(by); rows.set(series, rows.get(series) + by); },
  };
}

test('Z-003: a document number is handed out by the counter, and the table is counted only the first time', async () => {
  const counter = memoryCounter(); let counted = 0;
  const count = async () => { counted += 1; return 41; };
  const first = await createNumbered({ count, format: padded('SO'), create: async (n) => n, counter });
  const second = await createNumbered({ count, format: padded('SO'), create: async (n) => n, counter });
  const third = await createNumbered({ count, format: padded('SO'), create: async (n) => n, counter });
  assert.deepEqual([first, second, third], ['SO-00042', 'SO-00043', 'SO-00044']);
  assert.equal(counted, 1, 'the rows are counted once, when the series is first used, never again');
});

test('Z-003: eighty saves at the same moment each get their own number with no save refused', async () => {
  const counter = memoryCounter(); const taken = new Set(); let refused = 0;
  const create = async (n) => { await new Promise((r) => setTimeout(r, Math.random() * 3)); if (taken.has(n)) { refused += 1; throw dup(['orderNumber']); } taken.add(n); return n; };
  const made = await Promise.all(Array.from({ length: 80 }, () => createNumbered({ count: async () => 0, format: padded('SHP'), create, counter })));
  assert.equal(new Set(made).size, 80);
  assert.equal(refused, 0, 'counting rows made most of these collide; the counter makes none collide');
});

test('Z-003: numbers already on older documents are stepped past, and the series stays past them', async () => {
  const counter = memoryCounter();
  const old = new Set(Array.from({ length: 30 }, (_, i) => `SO-${String(11 + i).padStart(5, '0')}`)); // SO-00011 to SO-00040 exist, the count says 10
  const create = async (n) => { if (old.has(n)) throw dup(['orderNumber']); old.add(n); return n; };
  const made = await createNumbered({ count: async () => 10, format: padded('SO'), create, counter });
  assert.ok(Number(made.slice(3)) > 40, made);
  assert.ok(counter.calls.advance.length > 0, 'the counter itself was moved ahead');
  const takesBefore = counter.calls.take;
  const next = await createNumbered({ count: async () => 10, format: padded('SO'), create, counter });
  assert.equal(counter.calls.take - takesBefore, 1, 'the next save takes one number and is not refused');
  assert.ok(Number(next.slice(3)) > Number(made.slice(3)));
});

test('Z-003: a refusal about some other unique field does not push the series ahead', async () => {
  const counter = memoryCounter(); let tries = 0;
  await assert.rejects(createNumbered({ count: async () => 0, format: padded('SO'), attempts: 6, counter, create: async () => { tries += 1; throw dup(['idempotencyKey']); } }), /unique number/);
  assert.equal(tries, 6);
  assert.deepEqual(counter.calls.advance, [], 'only a refused NUMBER moves the series');
});

test('Z-003: when the counter cannot be read the save is numbered the old way, not lost', async () => {
  const broken = { take: async () => { throw new Error('relation "DocumentCounter" does not exist'); }, advance: async () => {} };
  assert.equal(await createNumbered({ count: async () => 9, format: padded('SO'), create: async (n) => n, counter: broken }), 'SO-00010');
});

test('Z-003: each kind of document, and each year of a dated series, has a counter of its own', () => {
  assert.equal(seriesOf(padded('SO')), 'SEQ:SO-');
  assert.equal(seriesOf(padded('SHP')), 'SEQ:SHP-');
  assert.notEqual(seriesOf((n) => `MO-2026-${String(n).padStart(4, '0')}`), seriesOf((n) => `MO-2027-${String(n).padStart(4, '0')}`));
  assert.ok(!['INV', 'CM', 'DT', 'PKG', 'DTL'].includes(seriesOf(padded('INV'))), 'never the gapless invoice series');
});

test('Z-001: taking an invoice number does not read the invoice table once the series has its counter', async () => {
  const { takeNumber } = await import('../src/services/billing.js');
  const sent = [];
  const tx = { $queryRaw: async (strings) => { const sql = strings.join('?'); sent.push(sql); return /^\s*UPDATE "DocumentCounter"/.test(sql) ? [{ lastNumber: 1283 }] : [{ lastNumber: 1 }]; } };
  assert.equal(await takeNumber(tx, 'INV'), 'INV-001283');
  assert.equal(sent.length, 1, 'one statement');
  assert.ok(!/"Invoice"/.test(sent[0]), 'and it does not touch the invoices');
});

test('Z-001: the very first invoice of a series still starts after the highest number already written', async () => {
  const { takeNumber } = await import('../src/services/billing.js');
  const sent = [];
  const tx = { $queryRaw: async (strings) => { const sql = strings.join('?'); sent.push(sql); return /^\s*UPDATE "DocumentCounter"/.test(sql) ? [] : [{ lastNumber: 57 }]; } };
  assert.equal(await takeNumber(tx, 'INV'), 'INV-000057');
  assert.equal(sent.length, 2);
  assert.ok(/MAX\(/.test(sent[1]) && /ON CONFLICT/.test(sent[1]));
});

test('Z-002: a numbered document waits for its turn in the database before it reads anything', async () => {
  const { numberedForTest } = await import('../src/services/billing.js');
  const order = [];
  const tx = { $executeRawUnsafe: async (sql) => { order.push(`lock:${sql}`); }, $queryRaw: async () => { order.push('counter'); return [{ lastNumber: 5 }]; } };
  const out = await numberedForTest(tx, 'INV', async (t, next) => { order.push('read'); return next(); });
  assert.equal(out, 'INV-000005');
  assert.match(order[0], /^lock:LOCK TABLE "DocumentCounter" IN SHARE UPDATE EXCLUSIVE MODE$/, 'the wait comes first, before the transaction has looked at any data');
  assert.deepEqual(order.slice(1), ['read', 'counter']);
});

test('Z-004: password checks take turns, two at a time, and none is lost', async () => {
  const run = limiter(2); let now = 0; let most = 0; const done = [];
  const task = (i) => run(async () => { now += 1; most = Math.max(most, now); await new Promise((r) => setTimeout(r, 5)); now -= 1; done.push(i); return i * 2; });
  const out = await Promise.all(Array.from({ length: 24 }, (_, i) => task(i)));
  assert.equal(most, 2, 'never more than two at once');
  assert.deepEqual(out, Array.from({ length: 24 }, (_, i) => i * 2));
  assert.deepEqual(done, Array.from({ length: 24 }, (_, i) => i), 'in the order they arrived');
});

test('Z-004: a check that fails gives its turn back', async () => {
  const run = limiter(1);
  await assert.rejects(run(async () => { throw new Error('boom'); }), /boom/);
  assert.equal(await run(async () => 'next'), 'next');
  assert.deepEqual(run.stats(), { running: 0, waiting: 0 });
});

test('Z-004: sign-in and key checks go through the turn, not straight to the library', async () => {
  const fs = await import('node:fs');
  for (const f of ['src/routes/auth.js', 'src/middleware/partnerAuth.js', 'src/routes/users.js', 'src/routes/partner/adminRoutes.js']) {
    const src = fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.ok(!/bcrypt\.(compare|hash)\(/.test(src), `${f} checks or hashes a password outside the turn`);
  }
});

test('Z-005: a save that overlapped others on every try is "busy, try again" (409), never a server error', async () => {
  const { retryOverlap, isOverlap, Busy, BUSY_MESSAGE } = await import('../src/lib/numbering.js');
  let tries = 0;
  const overlap = () => Object.assign(new Error('Transaction failed due to a write conflict or a deadlock. Please retry your transaction'), { code: 'P2034' });
  const err = await retryOverlap(async () => { tries += 1; throw overlap(); }, 4).catch((e) => e);
  assert.equal(tries, 4);
  assert.ok(err instanceof Busy);
  assert.deepEqual({ status: err.status, refuse: err.refuse, code: err.code, message: err.message }, { status: 409, refuse: true, code: 'BUSY', message: BUSY_MESSAGE });
  assert.ok(isOverlap(err), 'still recognised as an overlap by the invoice routes');
  // Anything that is not an overlap is passed on untouched.
  const other = await retryOverlap(async () => { throw Object.assign(new Error('no'), { code: 'P2025' }); }, 4).catch((e) => e);
  assert.equal(other.code, 'P2025');
  assert.ok(!(other instanceof Busy));
});

// ── Z-007 and E-014: request limits are one limit for all server copies ────────────────────────
import { hit, useRateCounter, countInDatabase, windowStartOf, SharedRateStore } from '../src/lib/rateWindow.js';
import { partnerRateLimit } from '../src/middleware/partnerRateLimit.js';

/** Stands in for the "RateWindow" table: one map that every "server copy" in the test adds to. */
function sharedTable() {
  const rows = new Map(); const statements = [];
  const db = { $queryRawUnsafe: async (sql, ...params) => { statements.push(sql); const out = []; for (let i = 0; i < params.length; i += 2) { const id = `${params[i]} ${params[i + 1].getTime()}`; rows.set(id, (rows.get(id) || 0) + 1); out.push({ key: params[i], count: rows.get(id) }); } return out; } };
  return { rows, statements, counter: (windows, now) => countInDatabase(windows, now, db) };
}
const answer = () => { const res = { code: 200, headers: {}, set(h) { Object.assign(this.headers, h); return this; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } }; return res; };

test('Z-007: a partner limit is counted in the shared table, in one statement for the second, the minute and the hour', async () => {
  const t = sharedTable(); useRateCounter(t.counter);
  try {
    const limit = partnerRateLimit(); const partner = { id: 'p-1', rateLimitPerMin: 3, rateLimitPerHour: 1000, burstLimit: 1000 };
    const codes = [];
    for (let i = 0; i < 5; i += 1) { const res = answer(); let passed = false; await limit({ partner }, res, () => { passed = true; }); codes.push(passed ? 200 : res.code); }
    assert.deepEqual(codes, [200, 200, 200, 429, 429]);
    assert.equal(t.statements.length, 5, 'one statement per request');
    assert.match(t.statements[0], /ON CONFLICT \("key", "windowStart"\) DO UPDATE SET "count" = "RateWindow"\."count" \+ 1/);
    assert.equal([...t.rows.keys()].filter((k) => k.startsWith('partner:p-1:')).length >= 3, true);
  } finally { useRateCounter(null); }
});

test('Z-007: requests that other server copies already counted use up the same limit', async () => {
  const t = sharedTable(); useRateCounter(t.counter);
  try {
    const partner = { id: 'p-2', rateLimitPerMin: 4, rateLimitPerHour: 1000, burstLimit: 1000 };
    // Two other copies each counted two requests of this partner in this minute.
    const now = Date.now(); const id = `partner:p-2:minute ${windowStartOf(now, 60_000)}`; t.rows.set(id, 4);
    const res = answer(); let passed = false;
    await partnerRateLimit()({ partner }, res, () => { passed = true; });
    assert.equal(passed, false, 'the fifth request of the minute is refused although this copy has seen none');
    assert.equal(res.code, 429);
    assert.equal(res.body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(Number(res.headers['Retry-After']) >= 1);
  } finally { useRateCounter(null); }
});

test('Z-007: when the shared table cannot be reached the limit still holds on this copy and no request fails', async () => {
  useRateCounter(async () => { throw Object.assign(new Error('relation "RateWindow" does not exist'), { code: 'P2010' }); });
  try {
    const out = [];
    for (let i = 0; i < 3; i += 1) out.push((await hit([{ key: 'fallback-test', windowMs: 60_000 }]))[0]);
    assert.deepEqual(out.map((r) => r.count), [1, 2, 3]);
    assert.ok(out.every((r) => r.shared === false));
  } finally { useRateCounter(null); }
});

test('E-014: the sign-in limit per address counts in the shared table', async () => {
  const t = sharedTable(); useRateCounter(t.counter);
  try {
    const copyA = new SharedRateStore('login'); const copyB = new SharedRateStore('login');
    copyA.init({ windowMs: 900_000 }); copyB.init({ windowMs: 900_000 });
    assert.equal(copyA.localKeys, false, 'tells the limiter its counts are not local to this copy');
    const a = await copyA.increment('10.0.0.1:someone@example.test'); const b = await copyB.increment('10.0.0.1:someone@example.test');
    assert.equal(a.totalHits, 1);
    assert.equal(b.totalHits, 2, 'a second server copy continues the first copy\'s count');
    assert.ok(b.resetTime instanceof Date && b.resetTime > new Date());
    assert.equal((await copyB.increment('10.0.0.2:someone@example.test')).totalHits, 1, 'another address has its own count');
  } finally { useRateCounter(null); }
});

// ── Z-009: no database connection is "try again", not "server error" ───────────────────────────
import { isNoConnection } from '../src/lib/requestContext.js';
import { busyDatabase, safeErrors } from '../src/middleware/safeErrors.js';

test('Z-009: a query that found no free database connection is recognised, and nothing else is', () => {
  for (const code of ['P2037', 'P2024', 'P1001', 'P1017']) assert.equal(isNoConnection({ code }), true, code);
  assert.equal(isNoConnection(new Error('Too many database connections opened: FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute')), true);
  assert.equal(isNoConnection(new Error('terminating connection due to administrator command')), true);
  for (const code of ['P2002', 'P2025', 'P2034', 'P2003']) assert.equal(isNoConnection({ code }), false, code);
  assert.equal(isNoConnection(new Error('Order not found')), false);
  assert.equal(isNoConnection(null), false);
});

test('Z-009: a route that answered 500 for want of a connection is answered 503 with a time to retry', async () => {
  assert.equal(busyDatabase(500, { noConnection: true }).status, 503);
  assert.equal(busyDatabase(500, {}), null, 'another server error stays a server error');
  assert.equal(busyDatabase(409, { noConnection: true }), null, 'a refusal the route decided on is left alone');
  assert.equal(busyDatabase(200, { noConnection: true }), null, 'a request that succeeded after a retry is left alone');
  // Through the middleware, the way a route's own catch block answers.
  const { requestContext } = await import('../src/lib/requestContext.js');
  const sent = { headers: {} };
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, set(k, v) { sent.headers[k] = v; return this; }, json(b) { sent.body = b; sent.status = this.statusCode; return this; } };
  const req = { id: 'req-1', method: 'PUT', originalUrl: '/api/shipments/x/dispatch', query: {}, params: {} };
  await new Promise((done) => safeErrors(req, res, () => { requestContext.getStore().noConnection = true; res.status(500).json({ error: 'Internal server error' }); done(); }));
  assert.equal(sent.status, 503);
  assert.equal(sent.body.code, 'DATABASE_BUSY');
  assert.equal(sent.body.requestId, 'req-1');
  assert.equal(sent.headers['Retry-After'], '2');
  assert.ok(!/prisma|connection slots|FATAL/i.test(JSON.stringify(sent.body)), 'no internals');
});
