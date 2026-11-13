#!/usr/bin/env node
// Integration load at 80 branches, against the scaled copy of the QA database.
//   QA_DATABASE_URL=postgresql://postgres:password@localhost:5432/steelwise_qa_scale3 PORT=3021 qa/tools/start-qa-server.sh &
//   DATABASE_URL=<the same> node qa/perf/phase4-load.mjs --base http://localhost:3021 --out qa/results/phase4-load.json
// Nothing here is production traffic. The workload is stated in ASSUMED below and in
// qa/enterprise-excellence/phase-04-performance-results.md.
import fs from 'node:fs';
import { arg, BASE, A, prisma, tag, http1, startStub, stopStub, setMode, hitsOf, partner, subscribe, runTasks, world, blocks, sleep, until, TASKS_SECRET } from '../sim/phase4-lib.mjs';

const OUT = arg('out', 'qa/results/phase4-load.json');
if (!/localhost|127\.0\.0\.1/.test(BASE)) throw new Error('local servers only');
const BRANCHES = 80;
const ASSUMED = {
  branches: BRANCHES,
  'screens loaded at the same moment': '80 (one list per branch at once), repeated',
  'orders confirmed at the same moment': '80 (one per branch)',
  'partner systems subscribed': '1 customer system receiving every order event of its own orders',
  'events waiting after an outage': '500 for one subscriber',
  'delivery run': 'up to 100 events per run; the host is expected to call it every 5 minutes',
  note: 'These are test loads chosen to be above one busy minute at 80 branches. They are not measured production volumes.',
};
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]) : null; };
const timed = async (fn) => { const t = performance.now(); const r = await fn(); return { ms: performance.now() - t, r }; };
const size = (r) => Buffer.byteLength(typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? ''));
async function measure(name, call, { runs = 9, burst = BRANCHES } = {}) {
  const first = await timed(call);
  const ms = []; for (let i = 0; i < runs; i += 1) ms.push((await timed(call)).ms);
  const t = performance.now();
  const all = await Promise.all(Array.from({ length: burst }, () => timed(call)));
  const row = { name, status: first.r.status, bytes: size(first.r), p50: pct(ms, 0.5), p95: pct(ms, 0.95), burst: { requests: burst, wallMs: Math.round(performance.now() - t), p50: pct(all.map((x) => x.ms), 0.5), p95: pct(all.map((x) => x.ms), 0.95), failed: all.filter((x) => x.r.status >= 500 || x.r.status === 0).length } };
  console.log(`${String(row.status).padEnd(4)} ${String(row.bytes).padStart(8)} B  ${String(row.p50).padStart(5)}/${String(row.p95).padEnd(5)} ms   burst ${burst}: ${row.burst.wallMs} ms wall, p95 ${row.burst.p95} ms, ${row.burst.failed} failed   ${name}`);
  return row;
}

await startStub();
const w = await world();
const B = blocks(w);
const report = { at: new Date().toISOString(), base: BASE, assumed: ASSUMED, sizes: {}, lists: [], partner: [], events: {}, delivery: {}, reportScreen: null };
report.sizes = Object.fromEntries(await Promise.all(['order', 'orderLine', 'shipment', 'invoice', 'coil', 'location', 'webhookDelivery'].map(async (m) => [m, await prisma[m].count()])));
console.log('rows', JSON.stringify(report.sizes));

// 1. The lists a branch loads, in full and as the summary the list screens need.
for (const who of ['admin', 'branchA']) {
  for (const url of ['/api/orders?limit=50', '/api/orders?limit=50&view=summary', '/api/orders?limit=50&offset=5000&view=summary', '/api/inventory?limit=50', '/api/shipments?limit=50']) {
    report.lists.push({ who, ...(await measure(`${who} GET ${url}`, () => A.get(url, who))) });
  }
}

// 2. The partner API under the same burst.
const PA = await partner(w.custA, 'CUSTOMER');
const PC = await partner(w.carrierOrg, 'CARRIER');
for (const [p, label, path] of [[PA, 'customer', '/customer/orders?limit=50'], [PA, 'customer', '/customer/invoices?limit=50'], [PA, 'customer', '/customer/shipments?limit=50'], [PC, 'carrier', '/carrier/shipments?limit=50']]) {
  report.partner.push(await measure(`partner (${label}) GET ${path}`, () => p.call('GET', path)));
}

// 3. What recording an event costs the request that causes it: 80 orders confirmed at once,
//    for a customer whose system is subscribed and for one that is not.
async function confirmAll(customer) {
  const orders = [];
  for (let i = 0; i < BRANCHES; i += 8) orders.push(...await Promise.all(Array.from({ length: 8 }, () => B.order([B.line(100)], { customer, status: 'DRAFT', who: 'admin' }))));
  const t = performance.now();
  const done = await Promise.all(orders.map((o) => timed(() => A.put(`/api/orders/${o.id}`, { status: 'CONFIRMED' }))));
  return { orders, wallMs: Math.round(performance.now() - t), p50: pct(done.map((d) => d.ms), 0.5), p95: pct(done.map((d) => d.ms), 0.95), ok: done.filter((d) => d.r.status === 200).length };
}
const hook = await subscribe(PA, ['order.confirmed']);
setMode(hook.name, { status: 200 });
const withEvents = await confirmAll(w.custA);
const queued = () => prisma.webhookDelivery.count({ where: { webhookId: hook.id } });
const delivered = () => prisma.webhookDelivery.count({ where: { webhookId: hook.id, status: 'DELIVERED' } });
const t0 = performance.now();
await until(async () => (await delivered()) >= BRANCHES, { ms: 20000, every: 200 });
let untilAllMs = Math.round(performance.now() - t0);
if ((await delivered()) < BRANCHES) { await runTasks(); untilAllMs = Math.round(performance.now() - t0); }
const without = await confirmAll(w.custB);
report.events = {
  subscribed: { confirmed: withEvents.ok, wallMs: withEvents.wallMs, p50: withEvents.p50, p95: withEvents.p95, eventsRecorded: await queued(), eventsDelivered: await delivered(), callsReceived: hitsOf(hook.name).length, allDeliveredAfterMs: untilAllMs },
  notSubscribed: { confirmed: without.ok, wallMs: without.wallMs, p50: without.p50, p95: without.p95 },
};
console.log('events', JSON.stringify(report.events));

// 4. Catching up after an outage: 500 events waiting for one subscriber.
async function backlog(count, mode, parallelRuns = 1) {
  const h = await subscribe(PA, ['shipment.dispatched']);
  setMode(h.name, mode);
  const stamp = Date.now();
  await prisma.webhookDelivery.createMany({ data: Array.from({ length: count }, (_, i) => ({ webhookId: h.id, eventType: 'shipment.dispatched', eventId: `evt_load_${stamp}_${i}`, payload: { id: `evt_load_${stamp}_${i}`, type: 'shipment.dispatched', data: { n: i } }, status: 'PENDING' })) });
  const t = performance.now(); let runs = 0; const runMs = [];
  while ((await prisma.webhookDelivery.count({ where: { webhookId: h.id, status: 'PENDING' } })) > 0 && runs < 40) {
    const batch = await Promise.all(Array.from({ length: parallelRuns }, () => timed(runTasks)));
    runs += parallelRuns; runMs.push(...batch.map((b) => b.ms));
  }
  const wall = performance.now() - t;
  const got = hitsOf(h.name);
  return { events: count, partnerAnswersIn: mode.delayMs ? `${mode.delayMs} ms` : 'at once', runsAtOnce: parallelRuns, runs, wallMs: Math.round(wall), perSecond: Math.round(count / (wall / 1000)), runP50: pct(runMs, 0.5), runP95: pct(runMs, 0.95), delivered: await prisma.webhookDelivery.count({ where: { webhookId: h.id, status: 'DELIVERED' } }), callsReceived: got.length, distinctEvents: new Set(got.map((x) => x.headers['x-steelwise-event-id'])).size };
}
report.delivery.fast = await backlog(500, { status: 200 });
report.delivery.slowPartner = await backlog(200, { status: 200, delayMs: 200 });
report.delivery.fourRunsAtOnce = await backlog(500, { status: 200 }, 4);
console.log('delivery', JSON.stringify(report.delivery));

// 5. The integration report an administrator opens, over the whole company.
report.reportScreen = await measure('admin GET /api/admin/integrations', () => A.get('/api/admin/integrations'), { burst: 10 });

fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
await stopStub(); await prisma.$disconnect();
console.log(`written ${OUT}`);
process.exit(0);
