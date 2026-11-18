#!/usr/bin/env node
// Phase 10: proof that the checks catch the fixes. Each fix is taken out (from the source, or from the
// QA database's grants), the named check is run, and the fix is put back. A mutation "holds" when the
// check then fails.
//   DATABASE_URL=...qa... node qa/tools/phase10-mutations.mjs [--only Y-001,Y-016] [--kind unit|sim|sql]
//     [--port 3011] [--stub-port 3056] [--server-log path]
// The "sim" and "sql" mutations restart the QA server on --port (with the caller's SERVER_DATABASE_URL,
// QA_DATABASE_URL and QA_STUB_URL) and run one scenario of qa/sim/phase10-security.mjs against it.
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const B = (p) => path.join(root, 'src/backend/src', p);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const only = arg('only', '') ? arg('only', '').split(',') : null;
const kind = arg('kind', '');
const PORT = Number(arg('port', 3011));
const STUB_PORT = arg('stub-port', '3056');
const LOG = arg('server-log', `/tmp/qa-server-${PORT}.log`);
const DB = process.env.DATABASE_URL || '';
if (!/(localhost|127\.0\.0\.1).*qa/.test(DB)) { console.error('Refusing: DATABASE_URL is not a local QA database'); process.exit(2); }

const AUTH_MW = B('middleware/auth.js'); const AUTH = B('routes/auth.js'); const USERS = B('routes/users.js'); const DOCS = B('routes/documents.js');
const APP = B('app.js'); const PADMIN = B('routes/partner/adminRoutes.js'); const ALERTS = B('lib/alerts.js'); const BILLING = B('services/billing.js'); const INV = B('routes/invoices.js');
// [id, what the fix does, kind, file or null, text, replacement (sql: [break, restore]), the check that must fail, group, match]
const M = [
  ['Y-001', 'a token stops working once its login is cut off', 'unit', AUTH_MW, 'return Number(decoded?.sv || 0) === sessionMark(user);', 'return true;', 'Y-001'],
  ['Y-001s', 'changing a password ends the other sign-ins', 'sim', AUTH, "data: { passwordHash: await bcrypt.hash(newPassword, 10), tokensValidAfter: new Date() } });", "data: { passwordHash: await bcrypt.hash(newPassword, 10) } });", 'Changing your password ends every other sign-in', 1],
  ['Y-002', 'ten wrong passwords pause the login', 'unit', AUTH, 'return Number(failedInARow) >= LOCK_AFTER ? new Date(', 'return false ? new Date(', 'Y-002'],
  ['Y-002s', 'a burst of wrong passwords records one pause', 'sim', AUTH, "where: { id: user.id, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] }", 'where: { id: user.id }', 'Twenty wrong passwords at once', 1],
  ['Y-004', 'an upload cannot name a folder outside the uploads folder', 'unit', DOCS, "return /^[a-z_]{1,40}$/.test(kind) ? kind : 'general';", 'return kind || \'general\';', 'Y-004'],
  ['Y-005', 'a stored file takes the extension of its accepted type', 'unit', DOCS, "return `${stem}${EXTENSION[mimetype] || '.bin'}`;", 'return `${stem}${mimetype}`;', 'Y-005'],
  ['Y-006', 'a file whose bytes do not match its type is refused', 'unit', DOCS, 'export function contentMismatch(mimetype, bytes) {\n', 'export function contentMismatch(mimetype, bytes) {\n  return null;\n', 'Y-006'],
  ['Y-007', 'only HS256 tokens are accepted', 'unit', AUTH_MW, "return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });", 'return jwt.verify(token, config.jwtSecret);', 'Y-007'],
  ['Y-010', 'the same alert is stored once in fifteen minutes', 'unit', ALERTS, 'if (recent) out.duplicate = true;\n    else {', 'if (false) out.duplicate = true;\n    else {', 'Y-010'],
  ['Y-010b', 'a scheduled run that fails raises an alert', 'unit', B('routes/integrations.js'), "    raiseAlertLater('SCHEDULED_RUN_FAILED',", "    void ('SCHEDULED_RUN_FAILED',", 'scheduled run that fails raises SCHEDULED_RUN_FAILED'],
  ['Y-013', 'register cannot place a login in another organization', 'sim', AUTH, "if (organizationId && organizationId !== caller.organizationId) return res.status(403)", 'if (false) return res.status(403)', 'cannot place it in another organization', 1],
  ['Y-013b', 'register applies the Users rules to the role', 'sim', AUTH, 'if (denial) return res.status(403).json({ error: denial });\n      if (CUSTOMER_ROLES', 'if (false) return res.status(403).json({ error: denial });\n      if (CUSTOMER_ROLES', 'an administrator cannot register a super administrator', 1],
  ['Y-014', 'the public readiness answer is kept for a while', 'sim', APP, 'if (readyCache && Date.now() - readyCache.at < READY_CACHE_MS) return readyCache.value;', '', 'public readiness answer is kept for 30 seconds', 9],
  ['Y-015', 'guard fields are hidden from colleagues', 'sim', USERS, 'return LOGIN_MANAGERS.has(viewer?.role) || viewer?.id === user.id ?', 'return true ?', 'A colleague looking up logins', 1],
  ['Y-016', 'documents obey the branch boundary', 'sim', DOCS, [["if (!document || !(await documentVisible(document.id))) return res.status(404).json(NOT_FOUND);", 'if (!document) return res.status(404).json(NOT_FOUND);', true]], null, 'cannot open the document download of branch QA-L01', 2, 'document download'],
  ['Y-016b', 'an upload cannot be attached to another branch\'s record', 'sim', DOCS, "if (entityType && entityId && !(await recordVisible(entityType, entityId))) throw", 'if (false) throw', 'cannot attach a document to a QA-L01 order', 2, 'cannot attach a document to a QA-L01'],
  ['Y-017', 'a revoked key records the signed-in person', 'sim', PADMIN, "revokedBy: req.user?.id || 'admin',", "revokedBy: req.headers['x-user-id'] || 'admin',", 'A revoked partner key stops working at once', 6],
  ['Y-018', 'a token without a user id is refused, not a server error', 'sim', AUTH_MW, "  if (typeof decoded?.userId !== 'string' || !decoded.userId) return res.status(401).json({ error: 'Invalid token' });\n", '', 'The server refuses a token with no user in it', 1, 'a token with no user in it'],
  ['Y-019', 'partner administration reads are for administrators', 'sim', PADMIN, 'router.use(requireRole());', '', 'A sales rep is refused the administration', 1],
  ['Y-020', 'money on one invoice takes turns', 'unit', BILLING, 'export function moneyTurn(invoiceId, run) { return inTurn(`money:${invoiceId}`, run); }', 'export function moneyTurn(invoiceId, run) { return run(); }', 'Y-020'],
  ['Y-020s', 'twenty payments at once on one invoice are all recorded', 'sim', BILLING, [['export function moneyTurn(invoiceId, run) { return inTurn(`money:${invoiceId}`, run); }', 'export function moneyTurn(invoiceId, run) { return run(); }'], ['const MONEY_ATTEMPTS = 12;', 'const MONEY_ATTEMPTS = 6;']], null, 'Twenty payments of 5.00 at once', 7],
  ['Y-020b', 'an overlap that survives every retry answers 409, not 500', 'unit', INV, '  if (isOverlap(error)) return { status: 409,', '  if (false) return { status: 409,', 'Y-020b'],
  ['Y-003', 'an address with no login takes as long to refuse as one with a login', 'sim', AUTH, 'const matches = await bcrypt.compare(password, user?.passwordHash || NO_LOGIN_HASH);', 'const matches = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;', 'takes about as long as for one with a login', 1],
  ['Y-021', 'goods shipped long ago with no invoice fail the checks', 'sim', B('lib/opsChecks.js'), 'return { ok: n === 0, count: n, detail: n ? `${n} orders have goods shipped', 'return { ok: true, count: 0, detail: n ? `${n} orders have goods shipped', 'fifteen minutes fail the checks', 9],
  ['Y-022', 'sign-in on a database without update 17 names the update', 'sim', AUTH, '    if (missingUpdate17(error)) return res.status(503).json(UPDATE_17);\n    console.error(\'Login failed:\', error);', "    console.error('Login failed:', error);", 'without update 17 says which update is missing', 8, 'A backup of the QA database|The backup restores into|without update 17'],
  ['Y-011', 'the application role cannot change or delete history', 'sql', null, ['GRANT UPDATE, DELETE, TRUNCATE ON "AuditLog" TO steelwise_runtime', 'REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM steelwise_runtime'], null, "database role cannot change a history row", 3, 'change a history row'],
  ['Y-008', 'the application role cannot rewrite the record of applied updates', 'sql', null, ['GRANT INSERT, UPDATE, DELETE ON "_prisma_migrations" TO steelwise_runtime', 'REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON "_prisma_migrations" FROM steelwise_runtime'], null, 'rewrite the record of applied updates', 3, 'rewrite the record of applied updates'],
  ['Y-009', 'the application role cannot make tables', 'sql', null, ['GRANT CREATE ON SCHEMA public TO steelwise_runtime', 'REVOKE CREATE ON SCHEMA public FROM steelwise_runtime'], null, 'database role cannot make a table', 3, 'make a table'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function restartServer() {
  try { execSync(`kill $(lsof -ti tcp:${PORT} -sTCP:LISTEN)`, { stdio: 'ignore', shell: '/bin/bash' }); } catch { /* not running */ }
  await sleep(1200);
  spawn('bash', ['-c', `PORT=${PORT} ${path.join(root, 'qa/tools/start-qa-server.sh')} >> ${LOG} 2>&1`], { detached: true, stdio: 'ignore', env: { ...process.env, LOG_REQUESTS: 'on' } }).unref();
  for (let i = 0; i < 40; i += 1) { try { execSync(`curl -s -m2 -o /dev/null http://localhost:${PORT}/api/health/live`); return; } catch { await sleep(700); } }
  throw new Error('the QA server did not start');
}
const unit = () => spawnSync('node', ['--test', 'test/securityRules.test.js'], { cwd: path.join(root, 'src/backend'), encoding: 'utf8' });
const sim = (group, match) => spawnSync('node', ['qa/sim/phase10-security.mjs', '--base', `http://localhost:${PORT}`, '--stub-port', STUB_PORT, '--server-log', LOG, '--group', String(group), '--match', match, '--out', '/tmp/phase10-mutation.json'], { cwd: root, encoding: 'utf8', timeout: 900_000, env: process.env });
const psql = (sql) => spawnSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-qc', sql], { encoding: 'utf8' });

const results = [];
for (const [id, what, k, file, from, to, expect, group, match] of M) {
  if (only && !only.includes(id)) continue;
  if (kind && kind !== k) continue;
  let out; let src = null;
  if (k === 'sql') {
    const broke = psql(from[0]);
    if (broke.status !== 0) { results.push({ id, what, kind: k, held: false, note: `could not take the grant away: ${broke.stderr.slice(0, 120)}` }); console.log(`✗ ${id} ${what}: setup failed`); continue; }
    try { out = sim(group, match || expect); } finally { psql(from[1]); }
  } else {
    src = fs.readFileSync(file, 'utf8');
    // `from` is one text, or a list of [text, replacement, everywhere] taken out together.
    const pairs = Array.isArray(from) ? from : [[from, to]];
    if (pairs.some(([f]) => !src.includes(f))) { results.push({ id, what, kind: k, held: false, note: 'the text to remove was not found' }); console.log(`✗ ${id} ${what}: text not found`); continue; }
    fs.writeFileSync(file, pairs.reduce((t, [f, r, everywhere]) => (everywhere ? t.split(f).join(r) : t.replace(f, r)), src));
    try {
      if (k === 'unit') out = unit(); else { await restartServer(); out = sim(group, match === undefined ? expect : match); }
    } finally { fs.writeFileSync(file, src); }
  }
  const text = `${out.stdout || ''}${out.stderr || ''}`;
  const failedLines = text.split('\n').filter((l) => /^not ok|^✗ \[/.test(l));
  const held = out.status !== 0 && failedLines.some((l) => l.includes(expect));
  results.push({ id, what, kind: k, held, check: expect, failed: failedLines.slice(0, 4).map((l) => l.slice(0, 160)) });
  console.log(`${held ? '✓' : '✗'} ${id} ${what}: ${held ? `caught by "${expect}"` : `NOT caught (${failedLines.length} failing: ${failedLines.slice(0, 2).join(' | ').slice(0, 200)})`}`);
}
if (results.some((r) => r.kind === 'sim')) await restartServer();
const held = results.filter((r) => r.held).length;
fs.mkdirSync(path.join(root, 'qa/results'), { recursive: true });
const outFile = path.join(root, 'qa/results/phase10-mutations.json');
const prior = fs.existsSync(outFile) && (only || kind) ? JSON.parse(fs.readFileSync(outFile, 'utf8')).results.filter((r) => !results.some((x) => x.id === r.id)) : [];
const all = [...prior, ...results].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
fs.writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString(), held: all.filter((r) => r.held).length, total: all.length, results: all }, null, 2));
console.log(`${held === results.length ? '✓' : '✗'} Phase 10 proof by removal: ${held} of ${results.length} held this run (${all.filter((r) => r.held).length} of ${all.length} on file)`);
process.exit(held === results.length ? 0 : 1);
