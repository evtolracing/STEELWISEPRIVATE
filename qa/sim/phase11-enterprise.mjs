// Phase 11: one day of the synthetic 80-branch enterprise, played through the real server.
//   node qa/sim/phase11-enterprise.mjs --base http://localhost:3110 --cycle 1 --label "Baseline" [--jobs 545] [--levels 8,16,32,48] [--seed 11] [--probe]
// It signs in every employee, receives the opening stock, runs the customer jobs (six kinds) and the other
// work (transfers, counts, work orders, finance entries) at rising numbers of jobs in flight, while finance,
// executives and branch managers read their screens and the scheduled tasks run. Then it MEASURES and
// RECONCILES: every completed transaction is looked up in the database, every job is traced from order to
// money, the stock records and the books are checked against each other. Nothing is estimated: every figure
// written to the result file is read from a clock or from the database. Local QA database only.
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import * as ctx from './phase10/ctx.mjs';
import { rng } from './lib.mjs';
import { build, signIn, TIERS, HEAD_OFFICE } from './phase11/model.mjs';
import { THRESHOLDS, STATUS as THRESHOLD_STATUS, judge } from './phase11/thresholds.mjs';
import { makeEngine, pool, summary, CATEGORIES, MINIMUMS, JOB_TYPES, StepFailed } from './phase11/engine.mjs';

const { prisma, arg, near, ok2, err, sleep } = ctx;
const CYCLE = arg('cycle', '0'); const LABEL = arg('label', 'Run');
const PROBE = process.argv.includes('--probe');
const CHAOS = process.argv.includes('--chaos'); // failures are injected while the work runs (cycle 4)
const SEED = Number(arg('seed', '11'));
const LEVELS = arg('levels', '8,16,32,48').split(',').map(Number);
const SCALE = Number(arg('scale', '1'));
const OUT = arg('out', `qa/results/phase11-cycle-${CYCLE}.json`);
const rnd = rng(SEED);
const say = (s) => console.log(`${new Date().toISOString().slice(11, 19)} ${s}`);
const sql = (q) => prisma.$queryRawUnsafe(q);
const dbStat = async () => (await sql(`SELECT deadlocks::int AS deadlocks, xact_rollback::int AS rollbacks, xact_commit::int AS commits, (blks_hit::float / NULLIF(blks_hit + blks_read, 0))::float AS "cacheHit", temp_files::int AS "tempFiles" FROM pg_stat_database WHERE datname = current_database()`))[0];

await ctx.startStub().catch(() => {}); // the stand-in for outside services (alerts, AI, partner addresses); already running is fine
const started = new Date(); const t00 = performance.now();
const ledger = await ctx.ensureLedger();
const settledBefore = await ctx.settleHeldReceipts();
say(`ledger ${ledger}; building the enterprise`);
const E = await build({ log: say });
const X = makeEngine(E, { probe: PROBE, rnd });
const report = { phase: 11, cycle: CYCLE, label: LABEL, at: started.toISOString(), base: ctx.BASE, seed: SEED, machine: { cpus: os.cpus().length, cpu: os.cpus()[0]?.model, memoryGb: +(os.totalmem() / 2 ** 30).toFixed(1), node: process.version }, model: E.summary };
const cluster = await fetch(`${ctx.BASE}/__cluster/state`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
report.serverCopies = cluster ? cluster.workers.filter((w) => w.up).length : 1;
report.database = { name: new URL(process.env.DATABASE_URL).pathname.slice(1), version: (await sql('SHOW server_version'))[0].server_version, maxConnections: Number((await sql('SHOW max_connections'))[0].max_connections) };

// Database sessions waiting for a lock, and sessions in use, sampled four times a second.
const samples = { waiting: [], active: [], sessions: [] }; let sampling = true;
const sampler = (async () => { while (sampling) { const r = (await sql(`SELECT count(*) FILTER (WHERE wait_event_type = 'Lock')::int AS waiting, count(*) FILTER (WHERE state = 'active')::int AS active, count(*)::int AS sessions FROM pg_stat_activity WHERE datname = current_database()`))[0]; samples.waiting.push(r.waiting); samples.active.push(r.active); samples.sessions.push(r.sessions); await sleep(250); } })();
const stat0 = await dbStat();
const before = (await sql(`SELECT (SELECT count(*)::int FROM "JournalEntry" WHERE status = 'POSTED') AS entries, (SELECT count(*)::int FROM "LedgerEvent") AS events, (SELECT count(*)::int FROM "Order") AS orders, (SELECT count(*)::int FROM "AuditLog") AS audits, (SELECT count(*)::int FROM "MaterialMovement") AS movements`))[0];

// ── 1. everyone signs in ────────────────────────────────────────────────────────────────────
{
  const ms = []; let failed = 0; const t = performance.now();
  await pool(E.everyone, 24, async (p) => { const r = await signIn(p); ms.push(r.ms); if (!r.ok) failed += 1; });
  report.signIn = { people: E.everyone.length, failed, seconds: +((performance.now() - t) / 1000).toFixed(1), atATime: 24, ...summary(ms) };
  say(`signed in ${E.everyone.length - failed} of ${E.everyone.length} people in ${report.signIn.seconds}s (p95 ${report.signIn.p95} ms)`);
}
const setup = { id: 'SETUP', type: 'setup', branch: 'HQ', steps: [], ids: {}, n: 0 };
const mkJob = (type, b, n, extra = {}) => ({ id: `C${CYCLE}-${type}-${String(n).padStart(4, '0')}`, n, type, kind: JOB_TYPES[type] || type, branch: b?.code || 'HQ', tier: b?.tier || null, steps: [], ids: {}, ...extra });

// ── 2. counter stock, then the opening receipts of every branch ─────────────────────────────
const counters = E.branches.filter((b) => b.does.includes('counter'));
if (!PROBE || process.argv.includes('--all')) {
  for (const b of counters) b.shelf = await ctx.shelfStockBooked({ sku: E.shelfProduct.sku, pieces: 400, unitCost: 2.5, locationId: b.id });
  say(`counter stock on the shelf and in the books at ${counters.length} branches`);
  X.gauge.level = 'opening receipts';
  const lots = E.branches.flatMap((b) => Array.from({ length: Math.ceil(TIERS[b.tier].lots * SCALE) }, (_, i) => ({ b, grade: b.grades[i % b.grades.length] })));
  const t = performance.now(); let n = 0;
  await pool(lots, 16, async ({ b, grade }) => { const j = mkJob('RECEIPT', b, ++n); try { await X.receiveLot(j, b, grade, TIERS[b.tier].lotLb); } catch (e) { j.error = e.message; } });
  report.openingReceipts = { lots: lots.length, received: E.branches.reduce((s, b) => s + b.lots.length, 0), seconds: +((performance.now() - t) / 1000).toFixed(1), atATime: 16 };
  say(`opening stock: ${report.openingReceipts.received} of ${lots.length} lots received in ${report.openingReceipts.seconds}s`);
}

// ── 3. the day's work, planned ──────────────────────────────────────────────────────────────
const can = (what) => E.branches.filter((b) => b.does.includes(what));
function spread(list, count) { // by the tier's weight, so a large branch gets more than an outlet
  const bag = list.flatMap((b) => Array(Math.max(1, Math.round(TIERS[b.tier].weight * 10))).fill(b));
  return Array.from({ length: count }, () => bag[rnd.int(0, bag.length - 1)]);
}
const N = (n) => Math.max(1, Math.round(n * SCALE));
const WANT = PROBE ? { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, transfer: 1, count: 1, workOrder: 1, entry: 1, recon: 1 } : { A: N(185), B: N(115), C: N(55), D: N(70), E: N(60), F: N(60), transfer: N(50), count: N(40), workOrder: N(40), entry: N(200), recon: N(12) };
const work = []; let seq = 0;
const custOf = (b) => b.customers[rnd.int(0, b.customers.length - 1)];
for (const b of spread(can('stock'), WANT.A)) work.push({ job: mkJob('A', b, ++seq), run: (j) => X.stockSale(j, b, { customer: custOf(b) }) });
for (const b of spread(can('processed'), WANT.B)) work.push({ job: mkJob('B', b, ++seq), run: (j) => X.processedSale(j, b, { customer: custOf(b) }) });
for (const b of spread(can('web'), WANT.C)) work.push({ job: mkJob('C', b, ++seq), run: (j) => X.webOrder(j, b) });
for (const b of spread(counters, WANT.D)) work.push({ job: mkJob('D', b, ++seq), run: (j) => X.counterSale(j, b) });
for (const b of spread(can('partial'), WANT.E)) work.push({ job: mkJob('E', b, ++seq), run: (j) => X.partialShipment(j, b, { customer: custOf(b) }) });
for (const b of spread(can('return'), WANT.F)) work.push({ job: mkJob('F', b, ++seq), run: (j) => X.returnAndCredit(j, b, { customer: custOf(b) }) });
const movers = can('transfer');
for (let i = 0; i < WANT.transfer; i++) { const from = movers[rnd.int(0, movers.length - 1)]; let to = movers[rnd.int(0, movers.length - 1)]; if (to === from) to = movers[(movers.indexOf(from) + 1) % movers.length]; work.push({ job: mkJob('TRANSFER', from, ++seq, { to: to.code }), run: (j) => X.transferBetween(j, from, to) }); }
for (const b of spread(can('stock'), WANT.count)) work.push({ job: mkJob('COUNT', b, ++seq), run: (j) => X.countAdjustment(j, b) });
for (const b of spread(can('workOrder'), WANT.workOrder)) work.push({ job: mkJob('WORKORDER', b, ++seq), run: (j) => X.coilWorkOrder(j, b) });
for (let i = 0; i < WANT.entry; i++) work.push({ job: mkJob('ENTRY', null, ++seq), run: (j) => X.manualEntry(j, j.n) });
for (let i = 0; i < WANT.recon; i++) work.push({ job: mkJob('RECON', null, ++seq), run: (j) => X.reconciliationRun(j) });
// Shuffled, so every kind of work is in flight at every level.
for (let i = work.length - 1; i > 0; i--) { const k = rnd.int(0, i); [work[i], work[k]] = [work[k], work[i]]; }

// ── 4. while the work runs: screens are read and the scheduled tasks run ────────────────────
let reading = true; const tasks = { runs: 0, failed: 0 };
const someManager = () => { const b = E.branches[rnd.int(0, E.branches.length - 1)]; return [X.P.manager(b), b]; };
const readers = PROBE ? [] : [
  (async () => { while (reading) { await X.read('finance: trial balance', X.P.cfo(0), '/api/ledger/reports/trial-balance'); await X.read('finance: receivables', X.P.cfo(1), '/api/ledger/reports/receivables'); await X.read('finance: revenue by branch', X.P.cfo(0), '/api/ledger/reports/revenue?by=branch'); await sleep(1000); } })(),
  (async () => { while (reading) { await X.read('executive: cockpit', X.P.exec(0), '/api/executive/cockpit'); await X.read('executive: company dashboard', X.P.exec(1), '/api/dashboard'); await X.read('executive: KPIs', X.P.exec(0), '/api/dashboard/kpis'); await X.read('operations: cockpit', X.P.exec(1), '/api/ops-cockpit'); await X.read('sales: dashboard', X.P.exec(0), '/api/sales-dashboard'); await X.read('executive: inventory value', X.P.cfo(1), '/api/ledger/reports/inventory'); await sleep(1500); } })(),
  (async () => { while (reading) { const [m, b] = someManager(); if (m) { await X.read('branch manager: orders list', m, '/api/orders?limit=50'); await X.read('branch manager: stock list', m, `/api/inventory?locationId=${b.id}&limit=50`); await X.read('branch manager: shipments list', m, '/api/shipments?limit=50'); await X.read('branch manager: invoices list', m, '/api/invoices?limit=50'); } await sleep(700); } })(),
  (async () => { while (reading) { const r = await ctx.runTasks().catch(() => ({ status: 0 })); tasks.runs += 1; if (!ok2(r)) tasks.failed += 1; await sleep(5000); } })(),
];

// ── 4b. with --chaos: failures injected while the work runs ─────────────────────────────────
// One fault about every ten seconds, in turn: a copy restarted politely (as a deployment does), the
// invoice numbers held by another session, answers delayed at the front door, the outside services
// down; and, once each, a copy killed outright and every database connection of the servers cut.
const chaos = { events: [] };
if (CHAOS && cluster) {
  const control = (pathPart, body) => fetch(`${ctx.BASE}/__cluster/${pathPart}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }).then((r) => r.json()).catch(() => null);
  const state = () => fetch(`${ctx.BASE}/__cluster/state`).then((r) => r.json()).catch(() => null);
  const back = async (n) => { for (let i = 0; i < 160; i++) { const st = await state(); const w = st?.workers.find((x) => x.n === n); if (w && !w.pid) await control(`start/${n}`); if (w?.pid && w.up) return true; await sleep(250); } return false; };
  const copies = cluster.workers.length; let turn = 0; let killed = false; let cut = false;
  const faults = [
    async () => { const n = 1 + (turn % copies); await control(`term/${n}`); return { what: `copy ${n} restarted politely`, backUp: await back(n) }; },
    async () => { const cl = new ctx.pg.Client({ connectionString: ctx.OWNER_URL }); await cl.connect(); await cl.query('BEGIN'); await cl.query('LOCK TABLE "DocumentCounter" IN SHARE UPDATE EXCLUSIVE MODE'); await sleep(2000); await cl.query('COMMIT'); await cl.end(); return { what: 'invoice numbers held by another session for 2 s' }; },
    async () => { await control('mode', { delayMs: 400 }); await sleep(4000); await control('mode', {}); return { what: 'every answer delayed 400 ms for 4 s' }; },
    async () => { ctx.setMode('ai', { status: 503 }); ctx.setMode('alerts', { status: 503 }); await sleep(8000); ctx.setMode('ai', { status: 200 }); ctx.setMode('alerts', { status: 200 }); return { what: 'AI service and alert channel down for 8 s' }; },
    async () => { if (killed) return null; killed = true; const n = 1 + ((turn + 1) % copies); await control(`kill/${n}`); return { what: `copy ${n} killed (kill -9)`, backUp: await back(n) }; },
    async () => { if (cut) return null; cut = true; await prisma.$executeRawUnsafe('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND usename = \'steelwise_runtime\'').catch(() => {}); return { what: 'every database connection of the servers cut' }; },
  ];
  readers.push((async () => {
    await sleep(6000);
    while (reading) {
      const t = performance.now(); const at = new Date().toISOString().slice(11, 19); const level = X.gauge.level;
      const e = await faults[turn % faults.length]().catch((err) => ({ what: 'a fault could not be injected', error: String(err?.message || err).slice(0, 120) }));
      turn += 1;
      if (e) { chaos.events.push({ at, duringLevel: level, ...e, ms: Math.round(performance.now() - t) }); say(`  fault: ${e.what}${e.backUp === false ? ' (DID NOT COME BACK)' : ''}`); }
      for (let i = 0; i < 40 && reading; i++) await sleep(250);
    }
  })());
}

// ── 5. run it, at rising numbers of jobs in flight ──────────────────────────────────────────
const levels = []; const perLevel = Math.ceil(work.length / LEVELS.length);
for (let li = 0; li < LEVELS.length; li++) {
  const slice = work.slice(li * perLevel, (li + 1) * perLevel); if (!slice.length) continue;
  X.gauge.level = `${LEVELS[li]} jobs in flight`;
  const t = performance.now(); const req0 = X.gauge.requests;
  await pool(slice, LEVELS[li], async (wk) => {
    const t0 = performance.now();
    try { await wk.run(wk.job); wk.job.done = true; } catch (e) { wk.job.done = false; wk.job.error = e instanceof StepFailed ? e.message : String(e?.stack || e).slice(0, 400); if (PROBE) console.log(`   ✗ ${wk.job.id}: ${wk.job.error}`); }
    wk.job.ms = Math.round(performance.now() - t0);
  });
  const sec = (performance.now() - t) / 1000; const L = X.gauge.byLevel[X.gauge.level] || { ms: [], peakInFlight: 0 };
  levels.push({ dispatchMs: summary((X.latByLevel[X.gauge.level] || {})['shipment dispatched'] || []), jobsInFlight: LEVELS[li], workItems: slice.length, completed: slice.filter((x) => x.job.done).length, seconds: +sec.toFixed(1), requests: X.gauge.requests - req0, requestsPerSecond: +((X.gauge.requests - req0) / sec).toFixed(1), peakRequestsInFlight: L.peakInFlight, latencyMs: summary(L.ms) });
  say(`level ${LEVELS[li]}: ${slice.filter((x) => x.job.done).length}/${slice.length} work items in ${sec.toFixed(1)}s, ${levels.at(-1).requestsPerSecond} req/s, p95 ${levels.at(-1).latencyMs.p95} ms`);
}
reading = false; await Promise.all(readers);
X.gauge.level = 'after the day';
const taskEnd = await ctx.runTasks().catch(() => ({ status: 0 }));
sampling = false; await sampler;
const stat1 = await dbStat();
const runSeconds = (performance.now() - t00) / 1000;

// ── 6. reconcile what was counted ───────────────────────────────────────────────────────────
say('reconciling every completed transaction against the database');
const recon = await X.reconcileLog();
const jobs = work.map((x) => x.job);
const customerJobs = jobs.filter((j) => JOB_TYPES[j.type]);

// Each customer job traced from its order to its money, from the database.
const traceProblems = [];
await pool(customerJobs.filter((j) => j.done), 12, async (j) => {
  const bad = (what) => { (j.traceProblems ||= []).push(what); traceProblems.push({ job: j.id, what }); };
  const order = j.ids.order ? await prisma.order.findUnique({ where: { id: j.ids.order }, include: { lines: true, invoices: { include: { payments: true } }, shipments: true } }) : null;
  if (!order) { bad('the order is not in the database'); j.traced = false; return; }
  j.trace = { order: order.orderNumber, status: order.status, total: Number(order.totalAmount) };
  if (j.type === 'C') { const w = await prisma.onlineOrder.findUnique({ where: { id: j.ids.onlineOrder } }); if (w?.internalOrderId !== order.id || w.status !== 'ACCEPTED') bad('the web order does not point at its sales order'); if (!j.portalShowsIt) bad('the buyer did not see the order in the portal'); j.traced = !(j.traceProblems || []).length; return; }
  const invoices = order.invoices.filter((i) => i.kind === 'INVOICE' && i.status !== 'CANCELLED'); const credits = order.invoices.filter((i) => i.kind === 'CREDIT' && i.status !== 'CANCELLED');
  const billed = invoices.reduce((s, i) => s + Number(i.totalAmount), 0); const paid = invoices.reduce((s, i) => s + i.payments.filter((p) => Number(p.amount) > 0 && p.paymentMethod !== 'CREDIT').reduce((a, p) => a + Number(p.amount), 0), 0);
  Object.assign(j.trace, { shipments: order.shipments.length, invoices: invoices.map((i) => i.invoiceNumber), billed: +billed.toFixed(2), paid: +paid.toFixed(2), credits: credits.map((i) => i.invoiceNumber), owing: +invoices.reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0).toFixed(2) });
  if (!invoices.length) bad('no invoice');
  if (!near(billed, Number(order.totalAmount), 0.01)) bad(`billed ${billed.toFixed(2)} but the order total is ${Number(order.totalAmount).toFixed(2)}`);
  if (j.type !== 'D') {
    const want = j.type === 'E' ? 2 : 1;
    if (order.shipments.length !== want || order.shipments.some((s) => s.status !== 'DELIVERED')) bad(`expected ${want} delivered shipment(s), found ${order.shipments.map((s) => s.status).join(',') || 'none'}`);
    const shippedQty = order.lines.reduce((s, l) => s + Number(l.qtyShipped || 0), 0); const ordered = order.lines.reduce((s, l) => s + Number(l.qtyOrdered), 0);
    if (!near(shippedQty, ordered, 0.001)) bad(`shipped ${shippedQty} of ${ordered}`);
  }
  const expectedPaid = (j.payments || []).reduce((s, p) => s + p.amount, 0) + (j.type === 'D' ? billed : 0);
  if (!near(paid, expectedPaid, 0.01)) bad(`payments in the database ${paid.toFixed(2)}, taken ${expectedPaid.toFixed(2)}`);
  if (j.type === 'F') { if (credits.length !== 1) bad(`expected one credit memo, found ${credits.length}`); else if (Math.abs(Number(credits[0].totalAmount) - Number(credits[0].paidAmount)) > 0.005) bad(`the credit memo still shows ${(Number(credits[0].totalAmount) - Number(credits[0].paidAmount)).toFixed(2)} to refund`); }
  // The books: every invoice, payment and shipment of the job has its posted entry, and nothing of it waits.
  const ids = [...order.invoices.map((i) => i.id), ...order.invoices.flatMap((i) => i.payments.map((p) => p.id))];
  const ev = await prisma.ledgerEvent.findMany({ where: { sourceId: { in: ids } }, select: { status: true, eventKind: true, sourceId: true } });
  const notPosted = ev.filter((e) => !['POSTED', 'NOT_POSTED'].includes(e.status));
  if (notPosted.length) bad(`${notPosted.length} ledger event(s) not posted: ${notPosted.map((e) => `${e.eventKind} ${e.status}`).join(', ')}`);
  for (const i of invoices) if (!ev.some((e) => e.sourceId === i.id && e.status === 'POSTED')) bad(`invoice ${i.invoiceNumber} has no posted entry`);
  j.trace.ledgerEvents = ev.length;
  j.traced = !(j.traceProblems || []).length;
});

// ── 7. the invariants, from the database ────────────────────────────────────────────────────
const one = async (q) => Number((await sql(q))[0].n);
const invariants = {
  'stock items with a negative quantity on hand': await one('SELECT count(*)::int AS n FROM "Inventory" WHERE "qtyOnHand" < 0'),
  'stock items with a negative available quantity': await one('SELECT count(*)::int AS n FROM "Inventory" WHERE "qtyAvailable" < 0'),
  'stock items with a negative reserved quantity': await one('SELECT count(*)::int AS n FROM "Inventory" WHERE "qtyAllocated" < 0'),
  'stock items reserved beyond what is on hand': await one('SELECT count(*)::int AS n FROM "Inventory" WHERE "qtyAllocated" > "qtyOnHand" + 0.0001'),
  'order lines shipped beyond what was ordered': await one('SELECT count(*)::int AS n FROM "OrderLine" l JOIN "Order" o ON o.id = l."orderId" WHERE o."orderType" = \'SO\' AND l."qtyShipped" > l."qtyOrdered" + 0.0001'),
  'invoice numbers used twice': await one('SELECT count(*)::int AS n FROM (SELECT "invoiceNumber" FROM "Invoice" GROUP BY 1 HAVING count(*) > 1) x'),
  'order numbers used twice': await one('SELECT count(*)::int AS n FROM (SELECT "orderNumber" FROM "Order" GROUP BY 1 HAVING count(*) > 1) x'),
  'journal entry numbers used twice': await one('SELECT count(*)::int AS n FROM (SELECT "entryNumber" FROM "JournalEntry" WHERE "entryNumber" IS NOT NULL GROUP BY 1 HAVING count(*) > 1) x'),
  'shipments billed twice': await one('SELECT count(*)::int AS n FROM (SELECT "shipmentId" FROM "Invoice" WHERE "shipmentId" IS NOT NULL AND kind = \'INVOICE\' AND status <> \'CANCELLED\' GROUP BY 1 HAVING count(*) > 1) x'),
  'business records with two ledger events of one kind': await one('SELECT count(*)::int AS n FROM (SELECT "eventKind", "sourceType", "sourceId" FROM "LedgerEvent" GROUP BY 1, 2, 3 HAVING count(*) > 1) x'),
  'posted entries that do not balance': await ctx.unbalancedPosted(),
  'invoices paid beyond their total': await one('SELECT count(*)::int AS n FROM "Invoice" WHERE kind = \'INVOICE\' AND status <> \'CANCELLED\' AND "paidAmount" > "totalAmount" + 0.005'),
  'dispatched shipments of this run with no invoice': await one(`SELECT count(*)::int AS n FROM "Shipment" s WHERE s.status IN ('IN_TRANSIT','DELIVERED') AND s."createdAt" >= '${started.toISOString()}' AND NOT EXISTS (SELECT 1 FROM "Invoice" i WHERE i."shipmentId" = s.id)`),
  'ledger events of this run failed or waiting': await one(`SELECT count(*)::int AS n FROM "LedgerEvent" WHERE status IN ('FAILED','PENDING') AND "createdAt" >= '${started.toISOString()}'`),
};
const held = await sql(`SELECT "eventKind", status, left(coalesce(reason, ''), 90) AS reason, count(*)::int AS n FROM "LedgerEvent" WHERE status IN ('FAILED','PENDING','RECONCILIATION_REQUIRED') AND "createdAt" >= '${started.toISOString()}' GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 12`);

// ── 8. the books against the records ────────────────────────────────────────────────────────
const cfo = X.P.cfo(0);
const tb = await X.read('finance: trial balance (end of day)', cfo, '/api/ledger/reports/trial-balance');
const fin = await ctx.reconcile(cfo);
const tR = performance.now(); await ctx.reconcile(cfo); const reconMs = performance.now() - tR;
const facts = (() => { try { const raw = execFileSync('node', ['qa/tools/db-facts.mjs'], { env: process.env, maxBuffer: 1 << 26 }).toString(); const j = JSON.parse(raw.slice(raw.indexOf('{'))); return j.checks || null; } catch (e) { return { error: String(e.message).slice(0, 200) }; } })();
const after = (await sql(`SELECT (SELECT count(*)::int FROM "JournalEntry" WHERE status = 'POSTED') AS entries, (SELECT count(*)::int FROM "LedgerEvent") AS events, (SELECT count(*)::int FROM "Order") AS orders, (SELECT count(*)::int FROM "AuditLog") AS audits, (SELECT count(*)::int FROM "MaterialMovement") AS movements`))[0];
const sizes = await sql(`SELECT relname AS "table", n_live_tup::int AS rows, pg_total_relation_size(relid)::bigint AS bytes, seq_scan::int AS "seqScans", idx_scan::int AS "indexScans" FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 14`);

// ── 9. the result ───────────────────────────────────────────────────────────────────────────
const txTotals = Object.values(X.tx).reduce((o, t) => { for (const k of ['attempted', 'completed', 'failed', 'retried', 'recovered', 'reconciled']) o[k] = (o[k] || 0) + t[k]; return o; }, {});
const jobsByType = Object.fromEntries(Object.keys(JOB_TYPES).map((t) => { const list = customerJobs.filter((j) => j.type === t); return [t, { kind: JOB_TYPES[t], planned: list.length, completed: list.filter((j) => j.done).length, traced: list.filter((j) => j.traced).length, failed: list.filter((j) => !j.done).length, msP50: summary(list.filter((j) => j.done).map((j) => j.ms)).p50, msP95: summary(list.filter((j) => j.done).map((j) => j.ms)).p95 }]; }));
Object.assign(report, {
  seconds: +runSeconds.toFixed(1), levels, ledgerAtStart: ledger, heldReceiptsSettledBefore: settledBefore,
  transactions: { ...txTotals, byCategory: Object.fromEntries(Object.entries(X.tx).map(([k, t]) => [k, { name: CATEGORIES[k], minimum: PROBE ? 0 : MINIMUMS[k], ...t, meetsMinimum: PROBE || t.reconciled >= MINIMUMS[k] }])), notFoundInDatabase: recon.missing, kindsWithNoCheck: recon.notChecked },
  jobs: { planned: customerJobs.length, completed: customerJobs.filter((j) => j.done).length, tracedEndToEnd: customerJobs.filter((j) => j.traced).length, failed: customerJobs.filter((j) => !j.done).length, recoveredByBillingAgain: customerJobs.reduce((s, j) => s + (j.recovered || 0), 0), byType: jobsByType, byTier: Object.fromEntries(Object.keys(TIERS).map((t) => [t, customerJobs.filter((j) => j.tier === t && j.traced).length])), branchesWithATracedJob: new Set(customerJobs.filter((j) => j.traced).map((j) => j.branch)).size, traceProblems: traceProblems.slice(0, 40) },
  otherWork: Object.fromEntries(['TRANSFER', 'COUNT', 'WORKORDER', 'ENTRY', 'RECON'].map((t) => [t, { planned: jobs.filter((j) => j.type === t).length, completed: jobs.filter((j) => j.type === t && j.done).length }])),
  requests: { sent: X.gauge.requests, peakInFlight: X.gauge.peak, perSecondOverall: +(X.gauge.requests / runSeconds).toFixed(1), byStatus: X.statuses, byServerCopy: X.instances, failed: X.failures.length, failures: X.failures.slice(0, 60), failuresByKind: X.failures.reduce((o, f) => { const k = `${f.kind} → ${f.status}`; o[k] = (o[k] || 0) + 1; return o; }, {}) },
  latencyMs: Object.fromEntries(Object.entries(X.lat).sort().map(([k, v]) => [k, summary(v)])),
  readsWhileWorking: Object.fromEntries(Object.entries(X.reads).sort().map(([k, v]) => [k, summary(v)])),
  backgroundTasks: { ...tasks, lastStatus: taskEnd.status },
  databaseDuringRun: { deadlocks: stat1.deadlocks - stat0.deadlocks, rolledBack: stat1.rollbacks - stat0.rollbacks, committed: stat1.commits - stat0.commits, cacheHitRatio: stat1.cacheHit ? +stat1.cacheHit.toFixed(4) : null, tempFiles: stat1.tempFiles - stat0.tempFiles, sessionsWaitingForALock: { samples: samples.waiting.length, max: Math.max(0, ...samples.waiting), mean: +(samples.waiting.reduce((a, b) => a + b, 0) / Math.max(1, samples.waiting.length)).toFixed(2), samplesWithAWaiter: samples.waiting.filter((n) => n > 0).length }, activeSessions: { max: Math.max(0, ...samples.active), mean: +(samples.active.reduce((a, b) => a + b, 0) / Math.max(1, samples.active.length)).toFixed(1) }, sessionsOpen: { max: Math.max(0, ...samples.sessions) }, largestTables: sizes.map((s) => ({ ...s, bytes: Number(s.bytes) })) },
  growth: { postedEntries: after.entries - before.entries, ledgerEvents: after.events - before.events, orders: after.orders - before.orders, auditRows: after.audits - before.audits, stockMovements: after.movements - before.movements },
  invariants, ledgerEventsHeldOrFailed: held,
  books: { trialBalanceBalanced: tb.body?.balanced === true, totals: tb.body?.totals || null, reconciliation: { status: fin.status, ms: +reconMs.toFixed(1), clean: (fin.checks || []).every((c) => c.ok !== false), checks: (fin.checks || []).map((c) => ({ key: c.key, ok: c.ok, books: c.ledger ?? c.books ?? null, records: c.records ?? c.subledger ?? null, difference: c.difference ?? null, items: c.items?.length ?? c.count ?? null })) } },
  databaseChecks: facts,
});
const invBad = Object.entries(invariants).filter(([, v]) => v !== 0);
const judged = judge({ 'sign-in': report.signIn, ...report.latencyMs, ...report.readsWhileWorking });
const serverErrors = Object.entries(X.statuses).filter(([s]) => Number(s) >= 500 || Number(s) === 0).reduce((n, [, v]) => n + v, 0);
report.thresholds = { status: THRESHOLD_STATUS, limits: THRESHOLDS, latency: judged, latencyMisses: judged.filter((j) => !j.pass), serverErrors, failedTransactionsPercent: +((100 * txTotals.failed) / Math.max(1, txTotals.attempted)).toFixed(3), peakLevelRequestsPerSecond: Math.max(0, ...levels.map((l) => l.requestsPerSecond)) };
if (CHAOS) report.chaos = { faultsInjected: chaos.events.length, events: chaos.events, everyCopyBackUp: chaos.events.every((e) => e.backUp !== false), copiesUpAtTheEnd: (await fetch(`${ctx.BASE}/__cluster/state`).then((r) => r.json()).catch(() => null))?.workers.filter((w) => w.up).length ?? null };
report.verdict = {
  jobs500: PROBE || report.jobs.tracedEndToEnd >= 500, transactions2000: PROBE || txTotals.reconciled >= 2000,
  everyCategoryMinimum: PROBE || Object.values(report.transactions.byCategory).every((c) => c.meetsMinimum),
  invariantsHold: invBad.length === 0, booksAgree: report.books.trialBalanceBalanced && report.books.reconciliation.clean,
  nothingCountedIsMissing: Object.keys(recon.missing).length === 0 && Object.keys(recon.notChecked).length === 0,
  noServerError: serverErrors <= THRESHOLDS.reliability.serverErrors.max, noDeadlock: report.databaseDuringRun.deadlocks <= THRESHOLDS.reliability.deadlocks.max,
  failedTransactionsWithinLimit: report.thresholds.failedTransactionsPercent <= THRESHOLDS.reliability.failedTransactionsPercent.max,
  responseTimesWithinProposedLimits: report.thresholds.latencyMisses.length === 0,
};
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
if (!PROBE) fs.writeFileSync(OUT.replace(/\.json$/, '-jobs.json'), `${JSON.stringify({ cycle: CYCLE, at: report.at, jobs: jobs.map(({ n, ...j }) => j) })}\n`);

console.log(`\nPhase 11 cycle ${CYCLE} (${LABEL}): ${report.serverCopies} server cop${report.serverCopies === 1 ? 'y' : 'ies'}, ${report.seconds}s, ${X.gauge.requests} requests, peak ${X.gauge.peak} in flight`);
console.log(`  customer jobs: ${report.jobs.completed}/${report.jobs.planned} completed, ${report.jobs.tracedEndToEnd} traced end to end; ${Object.entries(jobsByType).map(([t, v]) => `${t} ${v.traced}/${v.planned}`).join(', ')}`);
console.log(`  transactions: attempted ${txTotals.attempted}, completed ${txTotals.completed}, failed ${txTotals.failed}, retried ${txTotals.retried}, recovered ${txTotals.recovered}, reconciled ${txTotals.reconciled}`);
for (const [k, c] of Object.entries(report.transactions.byCategory)) console.log(`   ${c.meetsMinimum ? '✓' : '✗'} ${c.name.padEnd(46)} min ${String(c.minimum).padStart(3)}  completed ${String(c.completed).padStart(4)}  failed ${String(c.failed).padStart(3)}  reconciled ${String(c.reconciled).padStart(4)}`);
if (Object.keys(recon.missing).length) console.log(`  ✗ counted but not found: ${Object.entries(recon.missing).map(([k, v]) => `${k} ${v.length}`).join('; ')}`);
if (Object.keys(recon.notChecked).length) console.log(`  ✗ no database check for: ${JSON.stringify(recon.notChecked)}`);
for (const [k, v] of invBad) console.log(`  ✗ ${k}: ${v}`);
if (traceProblems.length) console.log(`  ✗ ${traceProblems.length} trace problem(s), first: ${traceProblems.slice(0, 5).map((p) => `${p.job} ${p.what}`).join(' | ')}`);
if (X.failures.length) console.log(`  failed requests: ${Object.entries(report.requests.failuresByKind).slice(0, 12).map(([k, v]) => `${k} ×${v}`).join('; ')}`);
console.log(`  books: trial balance ${report.books.trialBalanceBalanced ? 'balances' : 'DOES NOT BALANCE'}; reconciliation ${report.books.reconciliation.clean ? 'clean' : `differences: ${report.books.reconciliation.checks.filter((c) => c.ok === false).map((c) => `${c.key} ${c.difference}`).join(', ')}`}; database: ${report.databaseDuringRun.deadlocks} deadlocks, ${report.databaseDuringRun.rolledBack} rolled back, lock waiters max ${report.databaseDuringRun.sessionsWaitingForALock.max}`);
const slow = Object.entries(report.latencyMs).sort((a, b) => b[1].p95 - a[1].p95).slice(0, 8);
for (const [k, v] of slow) console.log(`   ${k.padEnd(44)} n=${String(v.requests).padStart(4)} p50=${v.p50} p95=${v.p95} p99=${v.p99} max=${v.max}`);
for (const m of report.thresholds.latencyMisses) console.log(`  ✗ slower than the proposed limit: ${m.kind} p95 ${m.p95} (limit ${m.limitP95}), p99 ${m.p99} (limit ${m.limitP99})`);
// With failures injected, lost requests and slow answers are the point: the run is judged on what must
// hold whatever fails (nothing half-saved, nothing counted that is not there, the books agree, every copy back).
const JUDGED = CHAOS ? ['invariantsHold', 'booksAgree', 'nothingCountedIsMissing', 'noDeadlock', 'everyCopyBackUp', 'faultsWereInjected'] : Object.keys(report.verdict);
if (CHAOS) { report.verdict.everyCopyBackUp = report.chaos.everyCopyBackUp && report.chaos.copiesUpAtTheEnd === report.serverCopies; report.verdict.faultsWereInjected = report.chaos.faultsInjected >= 6; report.verdictJudgedOn = JUDGED; fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`); }
const good = JUDGED.every((k) => report.verdict[k]);
console.log(`${good ? '✓' : '✗'} Phase 11 enterprise cycle ${CYCLE}: ${Object.entries(report.verdict).map(([k, v]) => `${k} ${v ? 'yes' : 'NO'}`).join(', ')}`);
await ctx.closeDb(); await prisma.$disconnect();
process.exit(good ? 0 : 1);
