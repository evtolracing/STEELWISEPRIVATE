// Phase 10: the security rules that must not quietly come undone.
// Each test here fails if the fix it names is removed (see qa/tools/phase10-mutations.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';
import { signUserToken, verifyUserToken, tokenStillValid } from '../src/middleware/auth.js';
import { pauseUntil, LOCK_AFTER, LOCK_MINUTES } from '../src/routes/auth.js';
import { contentMismatch, uploadFolder, storedName } from '../src/routes/documents.js';
import { raiseAlert, ALERT_KINDS, DEDUPE_MINUTES } from '../src/lib/alerts.js';

const user = { id: 'u1', role: 'ADMIN', organizationId: 'o1', tokensValidAfter: null };

test('Y-001: a token stops working once the login is cut off (password change, reset, sign out everywhere, switched off)', () => {
  const token = signUserToken(user);
  const decoded = verifyUserToken(token);
  assert.equal(tokenStillValid(decoded, user), true, 'a fresh token works');
  const later = { ...user, tokensValidAfter: new Date() };
  assert.equal(tokenStillValid(decoded, later), false, 'the old token is refused after the cut-off');
  assert.equal(tokenStillValid(verifyUserToken(signUserToken(later)), later), true, 'a token issued after the cut-off works');
  const again = { ...later, tokensValidAfter: new Date(later.tokensValidAfter.getTime() + 1) };
  assert.equal(tokenStillValid(verifyUserToken(signUserToken(later)), again), false, 'a second cut-off in the same second still ends the first');
  // A token with no mark, as issued before Phase 10, works only while the login was never cut off.
  const legacy = jwt.decode(jwt.sign({ userId: 'u1' }, config.jwtSecret));
  assert.equal(tokenStillValid(legacy, user), true);
  assert.equal(tokenStillValid(legacy, later), false);
});

test('Y-007: only HS256 tokens are accepted; an unsigned or differently signed token is refused', () => {
  const none = jwt.sign({ userId: 'u1' }, null, { algorithm: 'none' });
  assert.throws(() => verifyUserToken(none));
  const hs512 = jwt.sign({ userId: 'u1' }, config.jwtSecret, { algorithm: 'HS512' });
  assert.throws(() => verifyUserToken(hs512), /invalid algorithm/);
  assert.throws(() => verifyUserToken(jwt.sign({ userId: 'u1' }, 'another-secret')), /invalid signature/);
});

test('Y-002: a login is paused after 10 wrong passwords in a row, for 15 minutes', () => {
  const now = new Date('2026-11-18T10:00:00Z');
  assert.equal(LOCK_AFTER, 10);
  assert.equal(pauseUntil(LOCK_AFTER - 1, now), null);
  assert.equal(pauseUntil(LOCK_AFTER, now).toISOString(), new Date(now.getTime() + LOCK_MINUTES * 60000).toISOString());
  assert.ok(pauseUntil(25, now));
  assert.equal(LOCK_MINUTES, 15);
});

test('Y-004: the upload folder is plain letters only; anything that could leave the uploads folder becomes "general"', () => {
  assert.equal(uploadFolder('Order'), 'order');
  assert.equal(uploadFolder('purchase_order'), 'purchase_order');
  for (const bad of ['../../etc', '..', 'a/b', 'a\\b', '.hidden', '', null, undefined, 'x'.repeat(41), 'order%2f..', 'ord er']) {
    assert.equal(uploadFolder(bad), 'general', String(bad));
  }
});

test('Y-005: the stored name takes the extension of the accepted type, never the sender\'s', () => {
  assert.equal(storedName('application/pdf', 'stem'), 'stem.pdf');
  assert.equal(storedName('text/plain', 'stem'), 'stem.txt');
  assert.equal(storedName('text/html', 'stem'), 'stem.bin');
});

test('Y-006: a file whose bytes are not what it claims to be is refused', () => {
  const b = (s) => Buffer.from(s, 'binary');
  assert.equal(contentMismatch('application/pdf', b('%PDF-1.7 ...')), null);
  assert.ok(contentMismatch('application/pdf', b('<html><script>alert(1)</script>')));
  assert.equal(contentMismatch('image/png', b('\x89PNG\r\n\x1a\n....')), null);
  assert.ok(contentMismatch('image/png', b('GIF89a....')));
  assert.equal(contentMismatch('image/jpeg', b('\xff\xd8\xff\xe0....')), null);
  assert.ok(contentMismatch('image/svg+xml', b('<svg xmlns="http://www.w3.org/2000/svg"><script>x()</script></svg>')));
  assert.ok(contentMismatch('image/svg+xml', b('<svg onload="x()"></svg>')));
  assert.equal(contentMismatch('image/svg+xml', b('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')), null);
  assert.ok(contentMismatch('text/plain', b('<html><body>hi</body></html>')));
  assert.ok(contentMismatch('text/csv', b('a,b\x00c')));
  assert.equal(contentMismatch('text/csv', b('part,qty\nA,1\n')), null);
  assert.ok(contentMismatch('application/pdf', Buffer.alloc(0)), 'an empty file is refused');
  assert.equal(contentMismatch('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', b('PK\x03\x04....')), null);
});

test('Y-010: an alert is logged every time but stored once per kind and key within the dedupe window, and never throws', async () => {
  const rows = [];
  const db = { auditLog: {
    findFirst: async ({ where }) => rows.find((r) => r.resourceId === where.resourceId && r.timestamp >= where.timestamp.gte) || null,
    create: async ({ data }) => { rows.push({ ...data, timestamp: data.timestamp || nowRef.at }); return data; },
  } };
  const nowRef = { at: new Date('2026-11-18T10:00:00Z') };
  const quiet = console.error; console.error = () => {};
  try {
    const first = await raiseAlert('LEDGER_POSTING_FAILED', { eventId: 'e1' }, { key: 'e1', db, now: nowRef.at });
    const second = await raiseAlert('LEDGER_POSTING_FAILED', { eventId: 'e1' }, { key: 'e1', db, now: nowRef.at });
    assert.deepEqual([first.stored, first.logged, second.stored, second.duplicate, second.logged], [true, true, false, true, true]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].severity, ALERT_KINDS.LEDGER_POSTING_FAILED.severity);
    assert.equal(rows[0].resourceId, 'LEDGER_POSTING_FAILED:e1');
    const other = await raiseAlert('LEDGER_POSTING_FAILED', {}, { key: 'e2', db, now: nowRef.at });
    assert.equal(other.stored, true, 'another key is another alert');
    nowRef.at = new Date(nowRef.at.getTime() + (DEDUPE_MINUTES + 1) * 60000);
    assert.equal((await raiseAlert('LEDGER_POSTING_FAILED', {}, { key: 'e1', db, now: nowRef.at })).stored, true, 'after the window it is stored again');
    assert.equal((await raiseAlert('LOGIN_LOCKED', {}, { key: '../<script>', db, now: nowRef.at })).stored, true);
    assert.equal(rows.at(-1).resourceId, 'LOGIN_LOCKED:..script', 'the key is cleaned');
    const broken = { auditLog: { findFirst: async () => { throw new Error('database down'); } } };
    const out = await raiseAlert('DATABASE_UNREACHABLE', {}, { db: broken });
    assert.equal(out.stored, false);
    assert.equal(out.logged, true);
  } finally { console.error = quiet; }
});

test('Y-020: money recorded on one invoice takes turns, and different invoices do not wait for each other', async () => {
  const { moneyTurn } = await import('../src/services/billing.js');
  const log = [];
  const slow = (tag, ms) => async () => { log.push(`${tag}+`); await new Promise((r) => setTimeout(r, ms)); log.push(`${tag}-`); return tag; };
  const fail = async () => { log.push('f+'); throw new Error('refused'); };
  const done = await Promise.allSettled([moneyTurn('inv-1', slow('a', 30)), moneyTurn('inv-1', fail), moneyTurn('inv-1', slow('b', 5)), moneyTurn('inv-2', slow('c', 5))]);
  assert.deepEqual(done.map((d) => d.status), ['fulfilled', 'rejected', 'fulfilled', 'fulfilled']);
  // On inv-1 each starts only after the one before has finished, even when one in the middle fails.
  const one = log.filter((x) => /^[afb]/.test(x));
  assert.deepEqual(one, ['a+', 'a-', 'f+', 'b+', 'b-']);
  // inv-2 did not wait for inv-1.
  assert.ok(log.indexOf('c-') < log.indexOf('a-'));
});

test('Y-020b: an overlap that survives every retry answers 409 BUSY, never a server error', async () => {
  const { busyAnswer } = await import('../src/routes/invoices.js');
  for (const e of [{ code: 'P2034' }, { code: 'P2010', meta: { code: '40001' } }, { code: 'P2010', meta: { code: '40P01' } }]) {
    const a = busyAnswer(e);
    assert.equal(a?.status, 409);
    assert.equal(a.body.code, 'BUSY');
  }
  assert.equal(busyAnswer(new Error('something else')), null);
  assert.equal(busyAnswer({ code: 'P2002' }), null);
});

test('Y-010: a scheduled run that fails raises SCHEDULED_RUN_FAILED and answers without internals', async () => {
  const { scheduledRun } = await import('../src/routes/integrations.js');
  const saved = { secret: process.env.TASKS_SECRET, cron: process.env.CRON_SECRET, error: console.error };
  process.env.TASKS_SECRET = 'qa-tasks-secret-not-real'; delete process.env.CRON_SECRET;
  const lines = [];
  console.error = (...a) => lines.push(a.join(' '));
  try {
    const req = { get: () => 'Bearer qa-tasks-secret-not-real', id: 'qa-req-1', method: 'POST', originalUrl: '/api/internal/tasks/run' };
    const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await scheduledRun(req, res, async () => { throw new Error('QA: the run broke'); });
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(res.code, 500);
    assert.ok(!JSON.stringify(res.body).includes('QA: the run broke'));
    assert.ok(lines.some((l) => l.includes('"level":"alert"') && l.includes('SCHEDULED_RUN_FAILED')), lines.join('\n').slice(0, 400));
  } finally {
    console.error = saved.error;
    if (saved.secret === undefined) delete process.env.TASKS_SECRET; else process.env.TASKS_SECRET = saved.secret;
    if (saved.cron !== undefined) process.env.CRON_SECRET = saved.cron;
  }
});

test('Y-022: a database without the columns of update 17 is recognised, and nothing else is', async () => {
  const { missingUpdate17, UPDATE_17 } = await import('../src/middleware/auth.js');
  assert.equal(missingUpdate17({ code: 'P2022', meta: { column: 'User.tokensValidAfter' } }), true);
  assert.equal(missingUpdate17({ code: 'P2022', message: 'The column `User.lockedUntil` does not exist in the current database.' }), true);
  assert.equal(missingUpdate17({ code: 'P2022', meta: { column: 'Order.somethingElse' } }), false);
  assert.equal(missingUpdate17({ code: 'P2002', meta: { column: 'User.tokensValidAfter' } }), false);
  assert.equal(missingUpdate17(new Error('x')), false);
  assert.match(UPDATE_17.error, /update 17/);
});
