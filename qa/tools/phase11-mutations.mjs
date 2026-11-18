#!/usr/bin/env node
// Phase 11: proof that the checks catch the fixes. Each fix is taken out of the source, the named check
// is run, and the fix is put back. A mutation "holds" when the check then fails.
//   DATABASE_URL=...qa... node qa/tools/phase11-mutations.mjs [--only Z-001,Z-007s] [--kind unit|sim]
// "unit" runs src/backend/test/enterpriseScale.test.js. "sim" restarts the three server copies
// (qa/tools/phase11-cluster.sh) on the changed source and runs one scenario of qa/sim/phase11-scenarios.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const B = (p) => path.join(root, 'src/backend/src', p);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const only = arg('only', '') ? arg('only', '').split(',') : null;
const kind = arg('kind', '');
const DB = process.env.DATABASE_URL || '';
if (!/(localhost|127\.0\.0\.1).*qa/.test(DB)) { console.error('Refusing: DATABASE_URL is not a local QA database'); process.exit(2); }
const DBNAME = DB.split('/').pop().split('?')[0];

const BILLING = B('services/billing.js'); const NUM = B('lib/numbering.js'); const PW = B('lib/passwords.js'); const RATE = B('lib/rateWindow.js');
const APP = B('app.js'); const SAFE = B('middleware/safeErrors.js'); const SERVER = B('server.js'); const PRL = B('middleware/partnerRateLimit.js'); const CTX = B('lib/requestContext.js');
// [id, what the fix does, kind, file, text, replacement, the check that must fail, group]
const M = [
  ['Z-001', 'an invoice number comes from the counter, not from a read of every invoice', 'unit', BILLING, 'if (!rows.length) {\n    rows = await tx.$queryRaw`\n      INSERT INTO "DocumentCounter"', 'if (true) {\n    rows = await tx.$queryRaw`\n      INSERT INTO "DocumentCounter"', 'Z-001: taking an invoice number does not read'],
  ['Z-002', 'a numbered document waits for its turn in the database first', 'unit', BILLING, 'async function inSeries(tx, series, create) {\n  await waitForSeries(tx);', 'async function inSeries(tx, series, create) {', 'Z-002'],
  ['Z-003', 'a document number is handed out by the counter', 'unit', NUM, 'if (!out.fallBack) return out.made;', 'void out;', 'Z-003: a document number is handed out by the counter'],
  ['Z-004', 'password checks take turns', 'unit', PW, 'export const checkPassword = (plain, hash) => turn(() => bcrypt.compare(String(plain ?? \'\'), hash));', 'export const checkPassword = (plain, hash) => bcrypt.compare(String(plain ?? \'\'), hash);', 'Z-004: the password check the routes call waits in the turn'],
  ['Z-005', 'an overlap that survives every retry answers 409, not 500', 'unit', NUM, 'throw error.busy ? error : new Busy(error);', 'throw error;', 'Z-005'],
  ['Z-007', 'a partner limit is counted in the shared table', 'unit', RATE, 'return await counter(windows, now);', 'return countInMemory(windows, now);', 'Z-007: requests that other server copies already counted'],
  ['Z-007s', 'a partner cannot multiply its limit by the number of server copies', 'sim', RATE, 'return await counter(windows, now);', 'return countInMemory(windows, now);', 'request limit is one limit across all server copies', 6],
  ['E-014', 'the sign-in limit per address is counted in the shared table', 'unit', APP, "store: new SharedRateStore('login'),", '', 'E-014: the sign-in limiter in the application'],
  ['Z-008', 'a politely stopped copy closes idle connections and leaves quickly', 'sim', SERVER, 'const closeIdle = setInterval(() => server.closeIdleConnections?.(), 50);', 'const closeIdle = setInterval(() => {}, 50);', 'stopped politely (SIGTERM) while thirty payments arrive', 7],
  ['Z-009', 'a 500 for want of a database connection is answered 503 with a time to retry', 'unit', SAFE, 'return statusCode === 500 && store?.noConnection ? BUSY_DATABASE : null;', 'return null;', 'Z-009: a route that answered 500'],
  ['Z-009s', 'with the database connections used up a change is told to try again, never 500', 'sim', SAFE, 'return statusCode === 500 && store?.noConnection ? BUSY_DATABASE : null;', 'return null;', 'Almost every database connection is taken', 7],
];

const cluster = () => { const r = spawnSync('bash', [path.join(root, 'qa/tools/phase11-cluster.sh'), '3'], { encoding: 'utf8', env: { ...process.env, P11_DB: DBNAME } }); if (r.status !== 0) throw new Error(`the server copies did not start: ${r.stdout}${r.stderr}`); };
const unit = () => spawnSync('node', ['--test', 'test/enterpriseScale.test.js'], { cwd: path.join(root, 'src/backend'), encoding: 'utf8' });
const sim = (group, match) => spawnSync('node', ['qa/sim/phase11-scenarios.mjs', '--base', 'http://localhost:3110', '--stub-port', '3166', '--group', String(group), '--match', match, '--out', '/tmp/phase11-mutation.json'], { cwd: root, encoding: 'utf8', timeout: 900_000, env: process.env });

const results = [];
for (const [id, what, k, file, from, to, expect, group] of M) {
  if (only && !only.includes(id)) continue;
  if (kind && kind !== k) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(from)) { results.push({ id, what, kind: k, held: false, note: 'the text to remove was not found' }); console.log(`✗ ${id} ${what}: text not found`); continue; }
  fs.writeFileSync(file, src.replace(from, to));
  let out;
  try { if (k === 'unit') out = unit(); else { cluster(); out = sim(group, expect); } } finally { fs.writeFileSync(file, src); }
  const text = `${out.stdout || ''}${out.stderr || ''}`;
  const failedLines = text.split('\n').filter((l) => /^not ok|^✗ \[/.test(l));
  const held = out.status !== 0 && failedLines.some((l) => l.includes(expect));
  results.push({ id, what, kind: k, held, check: expect, failed: failedLines.slice(0, 4).map((l) => l.slice(0, 200)) });
  console.log(`${held ? '✓' : '✗'} ${id} ${what}: ${held ? `caught by "${expect}"` : `NOT caught (${failedLines.length} failing: ${failedLines.slice(0, 2).join(' | ').slice(0, 200)})`}`);
}
if (results.some((r) => r.kind === 'sim')) cluster();
const outFile = path.join(root, 'qa/results/phase11-mutations.json');
const prior = fs.existsSync(outFile) && (only || kind) ? JSON.parse(fs.readFileSync(outFile, 'utf8')).results.filter((r) => !results.some((x) => x.id === r.id)) : [];
const all = [...prior, ...results].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
fs.writeFileSync(outFile, `${JSON.stringify({ ranAt: new Date().toISOString(), held: all.filter((r) => r.held).length, total: all.length, results: all }, null, 2)}\n`);
const held = results.filter((r) => r.held).length;
console.log(`${held === results.length ? '✓' : '✗'} Phase 11 proof by removal: ${held} of ${results.length} held this run (${all.filter((r) => r.held).length} of ${all.length} on file)`);
process.exit(held === results.length ? 0 : 1);
