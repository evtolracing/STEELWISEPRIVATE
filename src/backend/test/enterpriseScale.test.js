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
