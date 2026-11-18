// Shared set-up for the Phase 10 security, reliability and recovery scenarios.
// Built on the Phase 9.5 context (people, the ledger, business building blocks). Everything goes through
// the real server on the local QA database; the database is read to check what was saved, and a second
// connection as the application's own role (steelwise_runtime) tries what the application must never do.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as base from '../phase95/ctx.mjs';
import { scenario as record, QA_PASSWORD, tokenOf, BASE, STUB, sleep, until } from '../phase4-lib.mjs';

export * from '../phase95/ctx.mjs';
export { QA_PASSWORD, tokenOf, BASE, STUB, sleep, until };
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(root, 'src/backend/package.json'));
export const jwt = require('jsonwebtoken');
export const pg = require('pg');
/** The QA server's signing secret (qa/tools/start-qa-server.sh). A QA fixture, not a secret. */
export const QA_JWT_SECRET = process.env.QA_JWT_SECRET || 'qa-jwt-secret-not-real-0123456789abcdef';
export const OWNER_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/steelwise_qa';
if (!/(localhost|127\.0\.0\.1).*qa/.test(OWNER_URL)) throw new Error('Refusing: not a local QA database');
export const RUNTIME_URL = process.env.RUNTIME_DATABASE_URL || OWNER_URL.replace(/\/\/[^@]+@/, '//steelwise_runtime:qa-runtime-not-a-secret@');

export const G10 = {
  auth: 'Authentication, sessions and roles',
  iso: 'Tenant, division and branch isolation',
  api: 'API, database and document security',
  ledger: 'Ledger security and posting integrity',
  recon: 'Inventory-to-ledger and receivables reconciliation',
  integ: 'Integrations, events and background jobs',
  conc: 'Concurrency and failure recovery',
  dr: 'Backup, restore, deployment and rollback',
  obs: 'Observability, alerting and infrastructure',
};
export const GROUPS10 = Object.values(G10);
const PICK = base.arg('group', '');
const MATCH10 = base.arg('match', '');

/**
 * One scenario, with the record the Phase 10 prompt asks for. `m` holds what is known before it runs:
 *   init   initial state            scope  authorized scope (who acts, on what)
 *   expect expected result          sec    security outcome that must hold
 *   db     database outcome         fin    financial outcome
 *   rec    recovery behaviour       audit  audit evidence
 * The actual result is filled in from the checks when it has run; regression coverage is this suite.
 */
export async function S(group, name, m, fn) {
  if (PICK && GROUPS10[Number(PICK) - 1] !== group) return null;
  if (MATCH10 && !MATCH10.split('|').some((x) => name.includes(x))) return null;
  if (process.env.P10_TRACE) console.error(`… ${new Date().toISOString().slice(11, 19)} ${name}`);
  const sc = await record(group, name, fn);
  const failed = sc.asserts.filter((a) => !a.ok);
  sc.record = {
    initialState: m.init || 'QA database rebuilt from fixtures; the earlier suites have run; the QA ledger is active with test data only',
    authorizedScope: m.scope || 'n/a', expected: m.expect || 'as the checks state',
    actual: sc.pass ? `as expected (${sc.asserts.length} checks)` : `NOT as expected: ${failed.map((a) => `${a.what}${a.detail ? ` (${a.detail.slice(0, 120)})` : ''}`).join('; ').slice(0, 600)}`,
    securityOutcome: m.sec || 'n/a', databaseOutcome: m.db || 'no change outside the scenario', financialOutcome: m.fin || 'none',
    recoveryBehaviour: m.rec || 'n/a', auditEvidence: m.audit || 'n/a', regressionCoverage: `qa/sim/phase10-security.mjs, ${group}`,
  };
  return sc;
}

// ── tokens ───────────────────────────────────────────────────────────────────────────────────
export const forge = (claims, { secret = QA_JWT_SECRET, ...opts } = {}) => jwt.sign(claims, secret, { expiresIn: '1h', ...opts });
export const as = (token) => ({
  get: (u, h) => base.http1('GET', u, { token, headers: h }), post: (u, b, h) => base.http1('POST', u, { body: b ?? {}, token, headers: h }),
  put: (u, b) => base.http1('PUT', u, { body: b ?? {}, token }), del: (u) => base.http1('DELETE', u, { token }),
});
export const signIn = (email, password = QA_PASSWORD, headers = {}) => base.http1('POST', '/api/auth/login', { body: { email, password }, headers });
/** A fresh login of the given role, so a scenario can lock, cut off or change it without touching anyone else. */
export async function person(role = 'CSR', loc = base.L1, label = 'p10') { return base.login(role, loc, `${label}-${Math.random().toString(36).slice(2, 7)}`); }

// ── a connection as the application's own database role ───────────────────────────────────
let runtimePool = null;
export function runtimeDb() { runtimePool ||= new pg.Pool({ connectionString: RUNTIME_URL, max: 3 }); return runtimePool; }
/** Runs SQL as steelwise_runtime. Returns { ok, rows, error }. Never throws. */
export async function asRuntime(sql, params = []) {
  try { const r = await runtimeDb().query(sql, params); return { ok: true, rows: r.rows, count: r.rowCount }; } catch (e) { return { ok: false, error: String(e.message), code: e.code }; }
}
/** Runs SQL as steelwise_runtime inside a transaction that is always rolled back. */
export async function asRuntimeRolledBack(sql, params = []) {
  const c = await runtimeDb().connect();
  try { await c.query('BEGIN'); const r = await c.query(sql, params); return { ok: true, rows: r.rows, count: r.rowCount }; } catch (e) { return { ok: false, error: String(e.message), code: e.code }; } finally { await c.query('ROLLBACK').catch(() => {}); c.release(); }
}
export const denied = (r) => !r.ok && /permission denied|must be owner|not allowed|refused|cannot|never/i.test(r.error || '');
export async function closeDb() { if (runtimePool) await runtimePool.end().catch(() => {}); }

// ── the books ────────────────────────────────────────────────────────────────────────────────
/** The QA ledger is started if it is not already (with test data only), so this suite also runs on its own. */
export async function ensureLedger() {
  const st = await base.cfo.get('/api/ledger/status');
  if (st.body?.active) return 'already active';
  await base.resetLedger();
  await base.cfo.post('/api/ledger/chart/load-proposed');
  await base.cfo.post('/api/ledger/approvals', { accounts: 'ALL', mappings: 'ALL', approvedBy: 'QA Synthetic Accountant (test data only)' });
  const dry = await base.cfo.post('/api/ledger/cutover/dry-run');
  const r = await base.owner.post('/api/ledger/activate', { policiesApprovedBy: 'QA Synthetic Accountant (test data only)', policiesApprovedOn: base.today(), dryRunId: dry.body.dryRunId, timeZone: 'America/Detroit' });
  if (r.status !== 200) throw new Error(`activate ${r.status} ${base.err(r)}`);
  return 'started for this run';
}
/**
 * Earlier suites (Phase 9.5) leave goods received with no purchase order held by name, as the product
 * intends: the books carry no value for them until a finance person names the other side. Phase 10
 * measures from books that agree, so it settles those through the product's own path (the CFO posts
 * each again naming accounts payable, 2000), never by writing an entry itself. Returns what it settled.
 */
export async function settleHeldReceipts() {
  const held = await base.prisma.ledgerEvent.findMany({ where: { eventKind: 'STOCK_RECEIVED', status: 'RECONCILIATION_REQUIRED', reason: { contains: 'no purchase order' } } });
  const out = { held: held.length, posted: 0, noCost: 0, nothingToPost: [], refused: [] };
  for (const e of held) {
    const r = await base.cfo.post(`/api/ledger/events/${e.id}/retry`, { offsetAccountCode: '2000' });
    // An item with no cost stays held by name: it is in neither figure, so it cannot put the books out of step.
    if (r.status === 200 && r.body?.status === 'POSTED') out.posted += 1;
    else if (r.status === 200 && r.body?.status === 'RECONCILIATION_REQUIRED' && /No cost is on file/.test(r.body?.reason || '')) out.noCost += 1;
    // NOT_POSTED is the engine's own answer when there is correctly nothing to post; its reason is kept.
    else if (r.status === 200 && r.body?.status === 'NOT_POSTED') out.nothingToPost.push(String(r.body?.reason || '').slice(0, 120));
    else out.refused.push(`${e.id} ${r.status} ${r.body?.status || base.err(r)}`);
  }
  return out;
}
export const reconcile = async (who = base.cfo) => { const r = await who.post('/api/ledger/reconciliations'); return { ...r.body, status: r.status, of: (k) => (r.body?.checks || []).find((c) => c.key === k) }; };
export const unbalancedPosted = async () => Number((await base.prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM (SELECT e.id FROM "JournalEntry" e JOIN "JournalLine" l ON l."entryId" = e.id WHERE e.status IN ('POSTED','REVERSED') GROUP BY e.id HAVING sum(l.debit) <> sum(l.credit) OR sum(l.debit) <> max(e."totalDebit")) x`))[0].n);
export const alertsOf = (kind, since) => base.prisma.auditLog.findMany({ where: { category: 'SYSTEM', eventType: 'ALERT', resourceId: { startsWith: `${kind}:` }, ...(since && { timestamp: { gte: since } }) }, orderBy: { timestamp: 'desc' } });
export const checksAs = (who) => who.get('/api/admin/integrations/checks');

// ── partners ─────────────────────────────────────────────────────────────────────────────────
import { partner as makePartner, subscribe as makeSubscription, runTasks as tasksRun, makeDue as due, deliveriesOf as deliveries, hmac as sign, TASKS_SECRET as TASKS } from '../phase4-lib.mjs';
export { makeSubscription as subscribe, tasksRun as runTasks, due as makeDue, deliveries as deliveriesOf, sign as hmac, TASKS as TASKS_SECRET };
/** A partner account with a key of the given scopes. `label` keeps two partners of one organization apart. */
export async function partnerOf(org, type, scopes, label = '') {
  void label;
  return makePartner(org, type, { scopes });
}
export { stub } from '../phase4-lib.mjs';
