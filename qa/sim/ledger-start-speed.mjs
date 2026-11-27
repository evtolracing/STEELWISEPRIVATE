#!/usr/bin/env node
// The sandbox start must fit inside the hosted server's 30 second limit (finding AB-001).
// The QA database answers in well under a millisecond, which hides a start that makes thousands of
// round trips. So the start is run here through a stand-in that makes every message to the database
// wait 20 ms, with at least as much stock as the live system holds, and it must finish in 15 seconds.
// It resets the QA ledger first. Run it before qa/sim/phase95-ledger.mjs.
//   node qa/sim/ledger-start-speed.mjs
import fs from 'node:fs';
import net from 'node:net';
import { spawn } from 'node:child_process';

const DIRECT = process.env.QA_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/steelwise_qa';
if (!/(localhost|127\.0\.0\.1).*qa/.test(DIRECT)) { console.error('Refusing: not a local QA database'); process.exit(1); }
const PORT = 6544; const DELAY_MS = 20; const LIMIT_S = 15; const MIN_PIECES = 4000;
const slow = DIRECT.replace(/:5432\//, `:${PORT}/`);
if (slow === DIRECT) { console.error('The QA database is expected on port 5432'); process.exit(1); }

const proxy = spawn(process.execPath, ['qa/tools/slow-db-proxy.mjs', '--listen', String(PORT), '--delay', String(DELAY_MS)], { stdio: 'ignore' });
const stop = () => { try { proxy.kill(); } catch { /* already gone */ } };
process.on('exit', stop);
await new Promise((ok, no) => { let n = 0; const t = setInterval(() => { const c = net.connect(PORT, '127.0.0.1'); c.on('connect', () => { c.destroy(); clearInterval(t); ok(); }); c.on('error', () => { if ((n += 1) > 50) { clearInterval(t); no(new Error('the slow database stand-in did not start')); } }); }, 100); });

process.env.DATABASE_URL = slow; process.env.DIRECT_URL = slow;
const { prisma } = await import('../../src/backend/src/lib/db.js');
const cutover = await import('../../src/backend/src/services/ledgerCutover.js');
const reports = await import('../../src/backend/src/services/ledgerReports.js');

const checks = []; const check = (what, ok, detail = '') => { checks.push({ what, ok: Boolean(ok), detail: ok ? '' : String(detail).slice(0, 300) }); console.log(`${ok ? '✓' : '✗'} ${what}${ok ? '' : `  — ${detail}`}`); };
let crashed = '';
try {
  await prisma.$transaction([
    prisma.$executeRawUnsafe('SET LOCAL session_replication_role = replica'),
    prisma.$executeRawUnsafe('TRUNCATE "LedgerExportItem", "LedgerExportBatch", "LedgerExternalAccount", "LedgerReconciliation", "LedgerEvent", "JournalLine", "JournalEntry", "LedgerPeriod", "LedgerMapping", "LedgerAccount" CASCADE'),
    prisma.$executeRawUnsafe('DELETE FROM "AppSetting" WHERE "key" = \'ledger.activation\''),
    prisma.$executeRawUnsafe('ALTER SEQUENCE "JournalEntry_number_seq" RESTART WITH 1'),
  ]);
  const user = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' }, select: { id: true } });
  const started = Date.now();
  const r = await cutover.startSandbox({ confirm: 'START SANDBOX BOOKS', timeZone: 'America/Phoenix' }, user.id);
  const seconds = (Date.now() - started) / 1000;
  check(`there is at least as much stock as on the live system (${MIN_PIECES} pieces)`, r.opening.stockItems >= MIN_PIECES, r.opening.stockItems);
  check(`the start finished in ${LIMIT_S} seconds at ${DELAY_MS} ms a message (it took ${seconds.toFixed(1)})`, seconds < LIMIT_S, `${seconds.toFixed(1)} s`);
  check('the books run as sandbox books', r.active === true && r.sandbox === true);
  const lines = await prisma.journalLine.count({ where: { coilId: { not: null }, entry: { kind: 'OPENING', status: 'POSTED' } } });
  check('every piece of stock has its own opening line', lines === r.opening.stockItems, `${lines} lines, ${r.opening.stockItems} pieces`);
  const drafts = await prisma.journalEntry.count({ where: { status: 'DRAFT' } });
  check('no opening entry was left as a draft', drafts === 0, drafts);
  const numbers = await prisma.$queryRaw`SELECT COUNT(*)::int AS n, COUNT(DISTINCT "entryNumber")::int AS d FROM "JournalEntry"`;
  check('every entry has its own number', numbers[0].n === numbers[0].d && numbers[0].n === r.opening.entries + r.opening.inTransitMoved, JSON.stringify(numbers[0]));
  const bs = await reports.balanceSheet({});
  check('the balance sheet balances', bs.balanced === true, bs.difference);
  const stock = await prisma.$queryRaw`SELECT COALESCE(SUM(l."debit" - l."credit"), 0)::text AS v FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" WHERE e."kind" = 'OPENING' AND l."coilId" IS NOT NULL`;
  check('the stock on the books is the stock value the start reported', Number(stock[0].v).toFixed(2) === Number(r.opening.stockValue).toFixed(2), `${stock[0].v} against ${r.opening.stockValue}`);
  const again = await cutover.startSandbox({ confirm: 'START SANDBOX BOOKS', timeZone: 'America/Phoenix' }, user.id).then(() => 'started twice', (e) => e.status);
  check('a second start is refused', again === 409, again);
} catch (e) { crashed = String(e?.message || e).split('\n').slice(-1)[0].slice(0, 300); console.log('crashed:', crashed); }
const failed = checks.filter((c) => !c.ok).length; const ok = !crashed && !failed && checks.length > 0;
fs.mkdirSync('qa/results', { recursive: true });
fs.writeFileSync('qa/results/ledger-start-speed.json', JSON.stringify({ ranAt: new Date().toISOString(), passed: ok ? 1 : 0, total: 1, checks: checks.length, results: [{ id: 1, name: 'The sandbox start fits the hosted time limit', status: ok ? 'PASS' : 'FAIL', checks, crashed }] }, null, 2));
console.log(`${ok ? '✓' : '✗'} Finance ledger start speed: ${checks.length - failed} of ${checks.length} checks pass`);
await prisma.$disconnect(); stop();
process.exit(ok ? 0 : 1);
