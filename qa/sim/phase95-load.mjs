// Phase 9.5 scale check: the ledger under 80 branches posting at the same time.
// It drives the real server with real business requests (receipts, sales, payments, transfers,
// stock counts, manual entries) for 80 branches at once, and MEASURES what happened: how long each
// posting request took, how many entries were posted per second, how often the database made a
// request wait or start again, how many requests failed, how long the reconciliation and each
// report took at the end, and whether the books still agree with the records.
// Nothing here is estimated. Every figure in the result file is read from a clock or from the database.
//   node qa/sim/phase95-load.mjs [--branches 80] [--sales 3] [--conc 16] [--manual 2000] [--out qa/results/phase95-load.json]
// Local QA database only. It empties and re-activates the QA ledger first, like the scenarios do.
// The 80 branches are test branches (code QALOAD-nn) that are switched off again when it ends.
import fs from 'node:fs';
import * as ctx from './phase95/ctx.mjs';
import before from './phase95/g0-before.mjs';
import { finish } from './phase4-lib.mjs';

const { prisma, A, B, arg, tag, cfo, cfo2, L1, house, heat, w, ok2, err, today, near } = ctx;
const BRANCHES = Number(arg('branches', '80'));
const SALES = Number(arg('sales', '3'));
const CONC = Number(arg('conc', '16'));
const MANUAL = Number(arg('manual', '2000'));
const OUT = arg('out', 'qa/results/phase95-load.json');

// ── measuring ───────────────────────────────────────────────────────────────────────────────
const times = {};      // kind -> [ms]
const failures = [];   // { kind, status, error }
const retried = {};    // kind -> requests that were sent again after the server asked for it
async function timed(kind, send) {
  // A request the server answers with "busy, try again" (409 or 503 with retry advice, or a
  // serialization failure) is sent again up to 4 times, as the screens do; each resend is counted.
  for (let attempt = 0; ; attempt++) {
    const t = performance.now();
    const r = await send();
    const ms = performance.now() - t;
    const busy = [409, 503, 500].includes(r.status) && /try again|busy|serializ|deadlock|conflict|another request/i.test(err(r));
    if (busy && attempt < 4) { retried[kind] = (retried[kind] || 0) + 1; await new Promise((res) => setTimeout(res, 40 * (attempt + 1) + Math.random() * 40)); continue; }
    (times[kind] ||= []).push(ms);
    if (!ok2(r)) failures.push({ kind, status: r.status, error: err(r).slice(0, 160) });
    return r;
  }
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)].toFixed(1) : null; };
const summary = (a) => ({ requests: a.length, p50: pct(a, 50), p95: pct(a, 95), p99: pct(a, 99), max: a.length ? +Math.max(...a).toFixed(1) : null, mean: a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null });
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); }
const dbStat = async () => (await prisma.$queryRaw`SELECT deadlocks::int AS deadlocks, xact_rollback::int AS rollbacks, xact_commit::int AS commits FROM pg_stat_database WHERE datname = current_database()`)[0];
const counts = async () => (await prisma.$queryRaw`SELECT (SELECT count(*)::int FROM "JournalEntry" WHERE "status" = 'POSTED') AS entries, (SELECT count(*)::int FROM "JournalLine") AS lines, (SELECT count(*)::int FROM "LedgerEvent") AS events`)[0];

// Lock waits are sampled four times a second: how many database sessions were waiting for a lock.
const lockSamples = [];
let sampling = true;
const sampler = (async () => { while (sampling) { const r = await prisma.$queryRaw`SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`; lockSamples.push(r[0].n); await new Promise((res) => setTimeout(res, 250)); } })();

// ── set-up: an activated ledger and the branches ────────────────────────────────────────────
await before(ctx);
if (finish('Set-up', '/dev/null', fs)) { console.log('✗ the ledger could not be activated; the load check did not run'); process.exit(1); }

const branches = [];
for (let i = 1; i <= BRANCHES; i++) {
  const code = `QALOAD-${String(i).padStart(2, '0')}`;
  branches.push(await prisma.location.upsert({ where: { code }, update: { isActive: true, isBranch: true }, create: { code, isBranch: true, name: `QA load branch ${i}`, type: L1.type, ownerId: house, state: L1.state, city: L1.city, country: L1.country, isActive: true } }));
}
// --ledger off: the same work with posting stopped, to measure what the ledger itself adds. No posting check applies to that run.
const LEDGER_OFF = arg('ledger', 'on') === 'off';
if (LEDGER_OFF) { const r = await ctx.owner.post('/api/ledger/deactivate', { reason: 'QA load comparison: the same work with posting stopped' }); if (!ok2(r)) throw new Error(`deactivate ${r.status} ${err(r)}`); }
const report = { ledger: LEDGER_OFF ? 'stopped (comparison run)' : 'posting', at: new Date().toISOString(), base: ctx.arg('base', 'http://localhost:3011'), settings: { branches: BRANCHES, salesPerBranch: SALES, requestsInFlight: CONC, manualEntries: MANUAL }, machine: { cpus: (await import('node:os')).cpus().length, note: 'One server process and one PostgreSQL on the same test container; not the production host.' } };

// ── stage 1: every branch does a day's work at the same time ────────────────────────────────
const poLine = (qty, unitPrice) => ({ gradeId: heat.gradeId, description: `QA load plate ${ctx.run}`, thicknessIn: 0.5, widthIn: 48, lengthIn: 96, qtyOrdered: qty, unit: 'LB', unitPrice, priceUnit: 'LB', extendedPrice: +(qty * unitPrice).toFixed(2) });
async function receive(loc, qty, cost) {
  const line = poLine(qty, cost);
  const po = await A.post('/api/purchase-orders', { sellerId: w.supplierOrg.id, status: 'DRAFT', subtotal: line.extendedPrice, taxAmount: 0, freightAmount: 0, totalAmount: line.extendedPrice, locationId: loc.id, lines: [line] });
  if (po.status !== 201) throw new Error(`purchase order ${po.status} ${err(po)}`);
  const placed = await A.put(`/api/purchase-orders/${po.body.id}`, { status: 'CONFIRMED' });
  if (!ok2(placed)) throw new Error(`place ${placed.status} ${err(placed)}`);
  const poLineId = (await prisma.orderLine.findFirst({ where: { orderId: po.body.id } })).id;
  const r = await timed('receipt', () => A.post('/api/inventory/receipts', B.receiptBody({ coilNumber: tag('LD'), weightLb: qty, locationId: loc.id, poLineId })));
  return r.body?.item?.id || null;
}
const expected = { receipts: 0, dispatches: 0, payments: 0, transfersOut: 0, transfersIn: 0, counts: 0, manual: 0, salesValue: 0, paidValue: 0 };
async function branchDay(loc, i) {
  const next = branches[(i + 1) % branches.length];
  const coil = await receive(loc, 20000, 0.4);
  const spare = await receive(loc, 3000, 0.42);
  if (coil) expected.receipts++;
  if (spare) expected.receipts++;
  if (!coil || !spare) return;
  for (let s = 0; s < SALES; s++) {
    const qty = 500 + 100 * s;
    const o = await B.order([B.line(qty, 0.7)], { who: 'admin', extra: { locationId: loc.id } });
    const rz = await B.reserve(o, o.lines[0], coil, qty);
    if (!ok2(rz)) { failures.push({ kind: 'reserve', status: rz.status, error: err(rz).slice(0, 160) }); continue; }
    const sh = await A.post('/api/shipments', { orderId: o.id, fromLocationId: loc.id, carrierName: 'Own Truck', items: [{ orderLineId: o.lines[0].id, qtyShipped: qty, weightLb: qty }] }, 'admin');
    if (sh.status !== 201) { failures.push({ kind: 'shipment', status: sh.status, error: err(sh).slice(0, 160) }); continue; }
    const d = await timed('dispatch (invoice and cost of sale)', () => A.put(`/api/shipments/${sh.body.id}/dispatch`, {}, 'admin'));
    if (d.status !== 200 || !d.body.invoice) continue;
    expected.dispatches++; expected.salesValue += qty * 0.7;
    const amount = +(qty * 0.7).toFixed(2);
    const p = await timed('payment', () => A.post(`/api/invoices/${d.body.invoice.id}/payments`, { amount, paymentMethod: 'CHECK', referenceNumber: tag('LP') }, 'admin'));
    if (ok2(p)) { expected.payments++; expected.paidValue += amount; }
  }
  const t = await timed('transfer sent', () => A.post('/api/inventory/transfers', { toLocationId: next.id, coilIds: [spare], carrier: 'Own truck' }, 'admin'));
  if (ok2(t)) {
    expected.transfersOut++;
    const id = t.body.id || t.body.transfer?.id;
    const rc = await timed('transfer received', () => A.post(`/api/inventory/transfers/${id}/receive`, {}, 'admin'));
    if (ok2(rc)) expected.transfersIn++;
  }
  const c = await timed('stock count', () => A.post('/api/inventory/adjust', { coilId: coil, notes: 'QA load count', reason: 'DAMAGE', change: -25 }, 'admin'));
  if (ok2(c)) expected.counts++;
}

// While the branches post, the trial balance and the branch revenue report are read once a second.
let reading = true;
const reader = (async () => { while (reading) { await timed('trial balance while posting', () => cfo.get('/api/ledger/reports/trial-balance')); await timed('revenue by branch while posting', () => cfo.get('/api/ledger/reports/revenue?by=branch')); await new Promise((res) => setTimeout(res, 1000)); } })();

const stat0 = await dbStat(); const c0 = await counts(); const openBefore = await ctx.openEvents();
let t0 = performance.now();
await pool(branches, CONC, branchDay);
const stage1Sec = (performance.now() - t0) / 1000;
reading = false; await reader;
const c1 = await counts(); const stat1 = await dbStat();
report.stage1 = {
  what: `${BRANCHES} branches each receive two purchase-order receipts, ship and invoice ${SALES} sales, take ${SALES} payments, send and receive one transfer and make one stock adjustment; ${CONC} branches work at the same moment`,
  seconds: +stage1Sec.toFixed(1),
  entriesPosted: c1.entries - c0.entries, linesPosted: c1.lines - c0.lines,
  entriesPerSecond: +((c1.entries - c0.entries) / stage1Sec).toFixed(1),
  database: { deadlocks: stat1.deadlocks - stat0.deadlocks, rolledBack: stat1.rollbacks - stat0.rollbacks, committed: stat1.commits - stat0.commits },
};

if (LEDGER_OFF) {
  sampling = false; await sampler;
  report.latencyMs = Object.fromEntries(Object.entries(times).map(([k, v]) => [k, summary(v)]));
  report.requests = { sent: Object.values(times).reduce((n, v) => n + v.length, 0), failed: failures.length, sentAgainAfterBusyAnswer: retried, failures: failures.slice(0, 20) };
  report.expected = expected;
  report.invoicesNotRaised = (times['dispatch (invoice and cost of sale)'] || []).length - expected.dispatches;
  await prisma.location.updateMany({ where: { code: { startsWith: 'QALOAD-' } }, data: { isActive: false } });
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
  for (const [k, v] of Object.entries(report.latencyMs)) console.log(`  ${k.padEnd(40)} n=${String(v.requests).padStart(5)} p50=${v.p50} p95=${v.p95} p99=${v.p99} max=${v.max}`);
  console.log(`ledger stopped: ${report.stage1.seconds}s, ${report.invoicesNotRaised} invoices not raised of ${(times['dispatch (invoice and cost of sale)'] || []).length} dispatches`);
  await prisma.$disconnect();
  process.exit(0);
}

// ── stage 2: volume. Manual entries written by one person and posted by another ─────────────
t0 = performance.now();
const c2a = await counts(); const stat2a = await dbStat();
await pool(Array.from({ length: MANUAL }, (_, i) => i), CONC, async (i) => {
  const amount = +(10 + (i % 900) + (i % 7) / 100).toFixed(2);
  const d = await timed('manual entry saved', () => cfo.post('/api/ledger/entries', { entryDate: today(), memo: `QA load accrual ${i}`, lines: [{ accountCode: '5200', debit: amount, locationId: branches[i % branches.length].id }, { accountCode: '2200', credit: amount, locationId: branches[i % branches.length].id }] }));
  if (d.status !== 201) return;
  const p = await timed('manual entry posted', () => cfo2.post(`/api/ledger/entries/${d.body.id}/post`, {}));
  if (ok2(p)) expected.manual++;
});
const stage2Sec = (performance.now() - t0) / 1000;
const c2 = await counts(); const stat2 = await dbStat();
report.stage2 = { what: `${MANUAL} two-line manual entries, each saved by one finance user and posted by another, ${CONC} at the same moment`, seconds: +stage2Sec.toFixed(1), entriesPosted: c2.entries - c2a.entries, entriesPerSecond: +((c2.entries - c2a.entries) / stage2Sec).toFixed(1), database: { deadlocks: stat2.deadlocks - stat2a.deadlocks, rolledBack: stat2.rollbacks - stat2a.rollbacks } };
sampling = false; await sampler;

// ── stage 3: the reports and the reconciliation at that size ────────────────────────────────
const reads = {
  'trial balance': '/api/ledger/reports/trial-balance',
  'revenue by branch': '/api/ledger/reports/revenue?by=branch',
  'revenue by customer': '/api/ledger/reports/revenue?by=customer',
  'gross margin by branch': '/api/ledger/reports/gross-margin?by=branch',
  receivables: '/api/ledger/reports/receivables',
  'sales tax': '/api/ledger/reports/sales-tax',
  'inventory value': '/api/ledger/reports/inventory',
  'monthly activity': `/api/ledger/reports/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`,
  'journal, first page': '/api/ledger/entries?limit=50',
  'one account, activity': '/api/ledger/reports/account?code=1100',
};
const readStatus = {};
for (const [name, url] of Object.entries(reads)) for (let k = 0; k < 5; k++) { const r = await timed(`report: ${name}`, () => cfo.get(url)); readStatus[name] = r.status; }
const rec = await timed('reconciliation', () => cfo.post('/api/ledger/reconciliations', {}));
const rec2 = await timed('reconciliation', () => cfo.post('/api/ledger/reconciliations', {}));

// ── what the database says afterwards ───────────────────────────────────────────────────────
const unbalanced = (await prisma.$queryRaw`SELECT count(*)::int AS n FROM (SELECT l."entryId" FROM "JournalLine" l JOIN "JournalEntry" e ON e."id" = l."entryId" WHERE e."status" IN ('POSTED', 'REVERSED') GROUP BY l."entryId" HAVING SUM(l."debit") <> SUM(l."credit")) x`)[0].n;
const perKind = await prisma.$queryRaw`SELECT "eventKind" AS kind, "status", count(*)::int AS n FROM "LedgerEvent" WHERE "createdAt" >= ${new Date(Date.parse(report.at))} GROUP BY 1, 2 ORDER BY 1, 2`;
const dupes = (await prisma.$queryRaw`SELECT count(*)::int AS n FROM (SELECT "sourceType", "sourceId", "eventKind" FROM "JournalEntry" WHERE "kind" = 'SYSTEM' GROUP BY 1, 2, 3 HAVING count(*) > 1) x`)[0].n;
const branchIds = branches.map((b) => b.id);
const branchesInBooks = (await prisma.$queryRaw`SELECT count(DISTINCT l."locationId")::int AS n FROM "JournalLine" l WHERE l."locationId" = ANY(${branchIds})`)[0].n;
const numbers = (await prisma.$queryRaw`SELECT count(*)::int AS n, count(DISTINCT "entryNumber")::int AS d FROM "JournalEntry"`)[0];
const tb = (await cfo.get('/api/ledger/reports/trial-balance')).body;
const open = await ctx.openEvents();
const posted = (kind) => perKind.filter((r) => r.kind === kind && r.status === 'POSTED').reduce((n, r) => n + r.n, 0);
const checks = (rec2.body?.checks || []).map((c) => ({ check: c.key, status: c.status, ledger: c.ledger, records: c.records, note: c.note }));
const MUST = ['BOOKS_BALANCE', 'RECEIVABLES', 'IN_TRANSIT', 'REVENUE', 'SALES_TAX', 'PAYMENTS', 'COMPLETENESS', 'INVENTORY'];

report.latencyMs = Object.fromEntries(Object.entries(times).map(([k, v]) => [k, summary(v)]));
report.requests = { sent: Object.values(times).reduce((n, v) => n + v.length, 0), failed: failures.length, errorRatePercent: +((failures.length / Math.max(1, Object.values(times).reduce((n, v) => n + v.length, 0))) * 100).toFixed(3), sentAgainAfterBusyAnswer: retried, failures: failures.slice(0, 20) };
report.contention = { lockWaitSamples: lockSamples.length, samplesWithAWaitingSession: lockSamples.filter((n) => n > 0).length, mostSessionsWaitingAtOnce: Math.max(0, ...lockSamples), deadlocks: (stat2.deadlocks - stat0.deadlocks), transactionsRolledBack: (stat2.rollbacks - stat0.rollbacks) };
report.volumeAtEnd = await counts();
report.expected = { ...expected, salesValue: +expected.salesValue.toFixed(2), paidValue: +expected.paidValue.toFixed(2) };
report.eventsByKind = perKind;
report.reconciliation = { firstRunMs: +times.reconciliation[0].toFixed(1), secondRunMs: +times.reconciliation[1].toFixed(1), status: rec2.status, checks };

const results = [];
const check = (what, ok, detail) => { results.push({ what, ok: !!ok, detail: ok ? undefined : detail }); console.log(`${ok ? '✓' : '✗'} ${what}${ok ? '' : ` — ${detail}`}`); };
check('no request failed', failures.length === 0, JSON.stringify(failures.slice(0, 3)));
check('every dispatch posted exactly one invoice entry and one cost-of-sale entry', posted('INVOICE_ISSUED') === expected.dispatches && posted('STOCK_SHIPPED') === expected.dispatches, `${posted('INVOICE_ISSUED')} invoices, ${posted('STOCK_SHIPPED')} shipments, ${expected.dispatches} dispatches`);
check('every payment posted exactly one entry', posted('PAYMENT_RECORDED') === expected.payments, `${posted('PAYMENT_RECORDED')} vs ${expected.payments}`);
check('every receipt posted exactly one entry', posted('STOCK_RECEIVED') === expected.receipts, `${posted('STOCK_RECEIVED')} vs ${expected.receipts}`);
check('every transfer posted once when sent and once when received', posted('TRANSFER_SHIPPED') === expected.transfersOut && posted('TRANSFER_RECEIVED') === expected.transfersIn, `${posted('TRANSFER_SHIPPED')}/${expected.transfersOut} sent, ${posted('TRANSFER_RECEIVED')}/${expected.transfersIn} received`);
check('every stock adjustment posted exactly one entry', posted('STOCK_ADJUSTED') === expected.counts, `${posted('STOCK_ADJUSTED')} vs ${expected.counts}`);
check('every manual entry was posted', c2.entries - c2a.entries === expected.manual && expected.manual === MANUAL, `${c2.entries - c2a.entries} posted, ${expected.manual} accepted, ${MANUAL} sent`);
check('no business record has two entries', dupes === 0, `${dupes}`);
check('every entry balances', unbalanced === 0, `${unbalanced} do not`);
check('the trial balance balances', tb.balanced === true, `${tb.totals?.debit} vs ${tb.totals?.credit}`);
check('entry numbers are never used twice', numbers.n === numbers.d, `${numbers.n} entries, ${numbers.d} numbers`);
check(`all ${BRANCHES} branches are in the books`, branchesInBooks === BRANCHES, `${branchesInBooks}`);
check('nothing the load sent is left unposted', open === openBefore, `${open} open events now, ${openBefore} before (stock already on a truck with no cost at cutover)`);
check('the reconciliation finds no difference', rec2.status === 201 && MUST.every((k) => ['MATCH', 'ROUNDING'].includes(checks.find((c) => c.check === k)?.status)), JSON.stringify(checks.filter((c) => MUST.includes(c.check) && !['MATCH', 'ROUNDING'].includes(c.status))));
check('every report answered', Object.values(readStatus).every((s) => s === 200), JSON.stringify(readStatus));
check('no deadlock', report.contention.deadlocks === 0, `${report.contention.deadlocks}`);
void near; void rec;

report.checks = results;
report.passed = results.every((r) => r.ok);
await prisma.location.updateMany({ where: { code: { startsWith: 'QALOAD-' } }, data: { isActive: false } });
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
console.log(`stage 1: ${report.stage1.entriesPosted} entries in ${report.stage1.seconds}s (${report.stage1.entriesPerSecond}/s); stage 2: ${report.stage2.entriesPosted} in ${report.stage2.seconds}s (${report.stage2.entriesPerSecond}/s)`);
for (const [k, v] of Object.entries(report.latencyMs)) console.log(`  ${k.padEnd(40)} n=${String(v.requests).padStart(5)} p50=${v.p50} p95=${v.p95} p99=${v.p99} max=${v.max}`);
console.log(`${report.passed ? '✓' : '✗'} Phase 9.5 load: ${results.filter((r) => r.ok).length} of ${results.length} checks pass`);
await prisma.$disconnect();
process.exit(report.passed ? 0 : 1);
