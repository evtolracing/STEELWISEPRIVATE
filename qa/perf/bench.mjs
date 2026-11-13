#!/usr/bin/env node
// Times every parameter-free GET route as an admin against a scaled-up copy of
// the QA database, and a set of record reads and simultaneous bursts.
//   node qa/perf/bench.mjs --base http://localhost:3013 --out qa/results/perf-before.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3013');
const OUT = arg('out', 'qa/results/perf.json');
const RUNS = Number(arg('runs', 7));
const SLOW_MS = 500; // target: a list screen answers within half a second
const inventory = JSON.parse(fs.readFileSync(path.join(here, '../.inventory.json'), 'utf8'));

const login = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'qa-admin@qa.test', password: 'qa-password-1' }) }).then((r) => r.json());
if (!login.token) throw new Error(`login failed: ${JSON.stringify(login)}`);
const headers = { authorization: `Bearer ${login.token}` };
const timed = async (url) => {
  const t = performance.now();
  try {
    const r = await fetch(BASE + url, { headers, signal: AbortSignal.timeout(30000) });
    const body = await r.arrayBuffer();
    return { ms: performance.now() - t, status: r.status, bytes: body.byteLength };
  } catch (e) { return { ms: performance.now() - t, status: 0, bytes: 0, error: String(e.message) }; }
};
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
async function measure(url, runs = RUNS) {
  const first = await timed(url);
  if (first.status !== 200) return { url, status: first.status, skipped: true };
  const ms = [first.ms];
  for (let i = 1; i < runs; i++) ms.push((await timed(url)).ms);
  return { url, status: 200, bytes: first.bytes, p50: Math.round(pct(ms, 0.5)), p95: Math.round(pct(ms, 0.95)), max: Math.round(Math.max(...ms)) };
}

const SKIP = /\/(tts|ai|assistant|export|download|stream|events|sse)\b|\/api\/v1\/partner|\/api\/health/;
const gets = [...new Set(inventory.endpoints.map((e) => e.ep).filter((e) => e.startsWith('GET ') && !e.includes(':')).map((e) => e.slice(4)))].filter((u) => !SKIP.test(u));
const lists = [];
for (const u of gets) lists.push(await measure(u));

// Reads a screen makes with a filter or for one record.
const pick = async (u, f) => { const r = await fetch(BASE + u, { headers }).then((x) => x.json()).catch(() => null); return f(r); };
const orderId = await pick('/api/orders?limit=1', (r) => (r?.data || r?.orders || r || [])[0]?.id);
const orderNo = await pick('/api/orders?limit=1', (r) => (r?.data || r?.orders || r || [])[0]?.orderNumber);
const loc = await pick('/api/locations', (r) => (r?.data || r || []).find((l) => String(l.code).startsWith('QA-L'))?.id);
const cust = await pick('/api/customers?limit=1', (r) => (r?.data || r?.customers || r || [])[0]?.id);
const targeted = [];
for (const u of [
  orderId && `/api/orders/${orderId}`, orderNo && `/api/orders?search=${encodeURIComponent(orderNo)}`, '/api/orders?status=CONFIRMED', cust && `/api/orders?buyerId=${cust}`,
  loc && `/api/inventory?locationId=${loc}`, loc && `/api/coils?locationId=${loc}`, loc && `/api/shipments?fromLocationId=${loc}`, '/api/jobs?status=IN_PROCESS', orderId && `/api/jobs?orderId=${orderId}`,
  '/api/invoices?status=OPEN', orderNo && `/api/returns/eligible?orderNumber=${encodeURIComponent(orderNo)}`, '/api/orders?limit=200', '/api/orders?offset=60000&limit=50',
].filter(Boolean)) targeted.push(await measure(u));

// Twenty staff opening the order list at the same moment.
const burst = async (url, n) => { const t = performance.now(); const rs = await Promise.all(Array.from({ length: n }, () => timed(url))); return { url, simultaneous: n, wallMs: Math.round(performance.now() - t), slowestMs: Math.round(Math.max(...rs.map((r) => r.ms))), failures: rs.filter((r) => r.status !== 200).length }; };
const bursts = [await burst('/api/orders', 20), await burst('/api/inventory', 20), await burst('/api/jobs', 20)];

const measured = lists.filter((l) => !l.skipped);
const slow = [...measured, ...targeted.filter((t) => !t.skipped)].filter((l) => l.p50 >= SLOW_MS).sort((a, b) => b.p50 - a.p50);
const big = measured.filter((l) => l.bytes > 1_000_000).sort((a, b) => b.bytes - a.bytes);
const report = { at: new Date().toISOString(), base: BASE, runs: RUNS, targetMs: SLOW_MS, routesTried: lists.length, routesAnswered: measured.length, notAnswered: lists.filter((l) => l.skipped).map((l) => `${l.status} ${l.url}`), slow, big, targeted, bursts, lists: measured.sort((a, b) => b.p50 - a.p50) };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(`${measured.length} of ${lists.length} GET routes answered 200; ${slow.length} at or over ${SLOW_MS} ms (median); ${big.length} replies over 1 MB`);
for (const s of slow.slice(0, 25)) console.log(`  slow  p50 ${s.p50} ms  p95 ${s.p95}  ${(s.bytes / 1024).toFixed(0)} KB  ${s.url}`);
for (const b of big.slice(0, 10)) console.log(`  big   ${(b.bytes / 1048576).toFixed(1)} MB  ${b.url}`);
for (const t of targeted) console.log(`  read  ${t.skipped ? `status ${t.status}` : `p50 ${t.p50} ms p95 ${t.p95}`}  ${t.url}`);
for (const b of bursts) console.log(`  burst ${b.simultaneous}x ${b.url}: all done in ${b.wallMs} ms, ${b.failures} failed`);
