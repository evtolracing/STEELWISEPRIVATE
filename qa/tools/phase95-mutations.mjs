#!/usr/bin/env node
// Phase 9.5: proof that the checks catch the rules. Each rule is taken out of the source, the named
// check is run, and the source is put back. A mutation "holds" when the check then fails.
//   DATABASE_URL=...steelwise_qa node qa/tools/phase95-mutations.mjs [--only U3,E2] [--kind unit|sim]
// The "sim" mutations restart the QA server on port 3011 and run one scenario of qa/sim/phase95-ledger.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const B = (p) => path.join(root, 'src/backend/src', p);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const only = arg('only', '') ? arg('only', '').split(',') : null;
const kind = arg('kind', '');
if (!/(localhost|127\.0\.0\.1).*qa/.test(process.env.DATABASE_URL || '')) { console.error('Refusing: DATABASE_URL is not a local QA database'); process.exit(2); }

const RULES = B('lib/ledgerRules.js'); const ENGINE = B('services/ledger.js'); const REPORTS = B('services/ledgerReports.js'); const ROUTES = B('routes/ledger.js'); const AI = B('services/ledgerAssistant.js');
// [id, what the rule does, file, text, replacement, kind, the check that must fail, group]
const M = [
  ['U1', 'stock with no cost is held, not valued at zero', RULES, 'usableCost(unitCost) ?? hold(`No cost is on file', 'usableCost(unitCost) ?? ZERO ?? hold(`No cost is on file', 'unit', 'stock with no cost is held'],
  ['U2', 'a transfer between different owners is held', RULES, 'if (!sameOwner) hold(`Transfer ${number} is between', 'if (false) hold(`Transfer ${number} is between', 'unit', 'different owners has no approved rule'],
  ['U3', 'a receipt with no purchase order is held', RULES, 'if (!purchaseOrder && !offsetCode) hold(', 'if (false) hold(', 'unit', 'receipt with no purchase order is held'],
  ['U4', 'an entry must balance', RULES, 'const ok = debit.equals(credit) && debit.greaterThan(0) && lines.length >= 2;', 'const ok = debit.greaterThan(0) && lines.length >= 2;', 'unit', 'totals: an entry is good only'],
  ['U5', 'only cents are taken as rounding', RULES, "return diff.abs().lessThanOrEqualTo('0.05') ?", "return diff.abs().lessThanOrEqualTo('5') ?", 'unit', 'an item relieved in parts ends at zero'],
  ['U6', 'a credit memo goes to returns and allowances', RULES, "dr('SALES_RETURNS', l.amount", "dr('REVENUE_PRODUCT', l.amount", 'unit', 'a credit memo is the invoice the other way round'],
  ['U7', 'a credit applied to an invoice is not a payment', RULES, "if (String(method || '').toUpperCase() === 'CREDIT') return nothing(", 'if (false) return nothing(', 'unit', 'a payment moves receivables to cash clearing'],
  ['U8', 'a manual line cannot carry a fraction of a cent', RULES, 'if (!debit.equals(cents(debit)) || !credit.equals(cents(credit))) fail(', 'if (false) fail(', 'unit', 'a manual entry is refused unless'],
  ['U9', 'a piece whose cost differs from its source is held', RULES, 'if (!own.equals(cost)) hold(', 'if (false) hold(', 'unit', 'a work order balances whatever the rounding'],
  ['U10', 'a day is counted in the books\' time zone', RULES, "if (!timeZone || timeZone === 'UTC') return dayOf(d);", 'if (timeZone) return dayOf(d);', 'unit', 'a month is the calendar month'],
  ['U11', 'sales tax carries its state', RULES, "cr('SALES_TAX_PAYABLE', invoice.tax, { ...at, jurisdiction: state || null })", "cr('SALES_TAX_PAYABLE', invoice.tax, at)", 'unit', 'an invoice debits receivables for the total'],
  ['U12', 'a first cost on an opening item goes to opening equity', RULES, "const other = neverValued ? 'OPENING_EQUITY' : 'COST_ADJUSTMENT';", "const other = 'COST_ADJUSTMENT';", 'unit', 'a cost change revalues what is on hand'],
  ['U13', 'a manual line has a largest amount', RULES, 'debit.gt(MAX_LINE) || credit.gt(MAX_LINE)', 'false', 'unit', 'a manual entry is refused unless'],
  ['U14', 'work order scrap is expensed', RULES, "lines.push(dr('SCRAP_WRITEOFF', scrap, srcDims));", 'lines.push(dr(srcKey, scrap, srcDims));', 'unit', 'a work order moves the source'],
  ['E1', 'nothing posts while the ledger is not active', ENGINE, "  if (!act.active) return null;\n  const key = { eventKind, sourceType, sourceId: String(sourceId) };\n  const existing", "  const key = { eventKind, sourceType, sourceId: String(sourceId) };\n  const existing", 'sim', 'post nothing', 6, 'no-other-scenario'],
  ['E2', 'the writer of a draft cannot post it', ENGINE, "if (entry.createdById && entry.createdById === userId) refuse(403, 'An entry is posted by someone other", "if (false) refuse(403, 'An entry is posted by someone other", 'sim', 'An administrator keeps the books', 7],
  ['E3', 'an unapproved mapping posts nothing', ENGINE, 'if (!m.approvedAt) throw new LedgerRuleError(`The mapping of', 'if (false) throw new LedgerRuleError(`The mapping of', 'sim', 'loses its approval', 7],
  ['E4', 'a branch manager cannot open another branch\'s entry', REPORTS, "if (branches != null && !e.lines.some((l) => l.locationId && branches.includes(l.locationId))) refuse(404, 'Journal entry not found');", '', 'sim', 'A branch manager reads the books of their own branch only', 5, 'second branch|A branch manager reads'],
  ['E5', 'an entry from a business record is not reversed by hand', ENGINE, "if (entry.kind === 'SYSTEM') refuse(409,", 'if (false) refuse(409,', 'sim', 'Reversal by hand', 7],
  ['E6', 'only the finance roles write a draft', ROUTES, "router.post('/entries', finance, handle(", "router.post('/entries', handle(", 'sim', 'People with no business in the books', 7],
  ['E7', 'an export is refused while an account has no external mapping', REPORTS, 'if (missing.length) refuse(409, `No ${prov} account is mapped', 'if (false) refuse(409, `No ${prov} account is mapped', 'sim', 'Export: nothing leaves', 6],
  ['E8', 'an open draft blocks the close of its month', ENGINE, 'if (drafts) refuse(409, `${drafts} draft entr', 'if (false) refuse(409, `${drafts} draft entr', 'sim', 'Closing a month', 6],
  ['E9', 'the person who closed a month cannot reopen it', ENGINE, "if (others) refuse(403, 'A period is reopened", "if (false) refuse(403, 'A period is reopened", 'sim', 'Reopening a closed month', 6, 'month'],
  ['E10', 'a control account needs the named permission', ENGINE, 'if (control.length && !allowControl) refuse(409,', 'if (false) refuse(409,', 'sim', 'Manual entries: the server refuses', 7],
  ['E11', 'the assistant gives no ledger figure to a person who may not read it', AI, 'if (!company && !BRANCH_READERS.includes(role)) {', 'if (false) {', 'sim', 'The assistant reads the ledger', 7],
  ['E12', 'a report grouped by an unknown key is refused', REPORTS, "(Object.hasOwn(GROUPS, String(by)) && GROUPS[by]) || refuse(400,", 'GROUPS[by] || refuse(400,', 'sim', 'Garbage in', 7],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function restartServer() {
  try { execSync("kill $(lsof -ti tcp:3011 -sTCP:LISTEN)", { stdio: 'ignore', shell: '/bin/bash' }); } catch { /* not running */ }
  await sleep(1200);
  spawn('bash', ['-c', `PORT=3011 ${path.join(root, 'qa/tools/start-qa-server.sh')} > /tmp/qa-server.log 2>&1`], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 40; i += 1) { try { execSync('curl -s -m2 -o /dev/null http://localhost:3011/api/health'); return; } catch { await sleep(700); } }
  throw new Error('the QA server did not start');
}
const unit = () => spawnSync('node', ['--test', 'test/ledgerRules.test.js'], { cwd: path.join(root, 'src/backend'), encoding: 'utf8' });
const sim = (group, match) => spawnSync('node', ['qa/sim/phase95-ledger.mjs', '--group', String(group), ...(match ? ['--match', match] : []), '--out', '/tmp/phase95-mutation.json'], { cwd: root, encoding: 'utf8', timeout: 600_000 });

const results = [];
for (const [id, what, file, from, to, k, expect, group, match] of M) {
  if (only && !only.includes(id)) continue;
  if (kind && kind !== k) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(from)) { results.push({ id, what, held: false, note: 'the text to remove was not found' }); console.log(`✗ ${id} ${what}: text not found`); continue; }
  fs.writeFileSync(file, src.replace(from, to));
  let out;
  try {
    if (k === 'unit') out = unit(); else { await restartServer(); out = sim(group, match === undefined ? expect : match); }
  } finally { fs.writeFileSync(file, src); }
  const text = `${out.stdout || ''}${out.stderr || ''}`;
  const failedLines = text.split('\n').filter((l) => /^not ok|^✗ \[/.test(l));
  const held = out.status !== 0 && failedLines.some((l) => l.includes(expect));
  results.push({ id, what, kind: k, held, check: expect, failed: failedLines.slice(0, 4).map((l) => l.slice(0, 160)) });
  console.log(`${held ? '✓' : '✗'} ${id} ${what}: ${held ? `caught by "${expect}"` : `NOT caught (${failedLines.length} failing: ${failedLines.slice(0, 2).join(' | ').slice(0, 200)})`}`);
}
if (results.some((r) => r.kind === 'sim')) await restartServer();
const held = results.filter((r) => r.held).length;
fs.mkdirSync(path.join(root, 'qa/results'), { recursive: true });
const outFile = path.join(root, 'qa/results/phase95-mutations.json');
const prior = fs.existsSync(outFile) && (only || kind) ? JSON.parse(fs.readFileSync(outFile, 'utf8')).results.filter((r) => !results.some((x) => x.id === r.id)) : [];
const all = [...prior, ...results].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
fs.writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString(), held: all.filter((r) => r.held).length, total: all.length, results: all }, null, 2));
console.log(`${held === results.length ? '✓' : '✗'} Phase 9.5 proof by removal: ${held} of ${results.length} held this run (${all.filter((r) => r.held).length} of ${all.length} on file)`);
process.exit(held === results.length ? 0 : 1);
