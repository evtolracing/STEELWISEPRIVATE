#!/usr/bin/env node
// Times the list screens a branch works from, as a login held to one branch and as an
// administrator who sees all of them, against the scaled copy of the QA database.
//   node qa/perf/branch-bench.mjs --base http://localhost:3013 --out qa/results/phase3-branch-bench.json
import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3013');
const OUT = arg('out', 'qa/results/phase3-branch-bench.json');
const RUNS = Number(arg('runs', 9));
if (!/localhost|127\.0\.0\.1/.test(BASE)) throw new Error('local servers only');
const URLS = [
  '/api/orders?limit=50', '/api/orders?limit=50&status=CONFIRMED', '/api/orders?limit=50&page=40', '/api/orders?search=PO-1',
  '/api/invoices?limit=50', '/api/invoices?status=SENT&limit=50', '/api/invoices/aging', '/api/shipments?limit=50', '/api/shipments?status=IN_TRANSIT',
  '/api/inventory?limit=50', '/api/inventory/summary', '/api/coils?limit=50', '/api/coils?search=QA&limit=50', '/api/jobs?limit=50', '/api/work-orders?limit=50',
  '/api/quotes?limit=50', '/api/rfqs?limit=50', '/api/returns?limit=50', '/api/customers?limit=50', '/api/dashboard/stats', '/api/dispatch/jobs?limit=50',
];
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
async function as(email) {
  const login = await (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) })).json();
  if (!login.token) throw new Error(`login failed for ${email}`);
  const headers = { authorization: `Bearer ${login.token}` };
  const timed = async (url) => { const t = performance.now(); const r = await fetch(BASE + url, { headers }); const b = await r.arrayBuffer(); return { ms: performance.now() - t, status: r.status, bytes: b.byteLength }; };
  const rows = [];
  for (const url of URLS) {
    const first = await timed(url);
    if (first.status !== 200) { rows.push({ url, status: first.status }); continue; }
    const ms = []; for (let i = 0; i < RUNS; i++) ms.push((await timed(url)).ms);
    rows.push({ url, status: 200, bytes: first.bytes, p50: Math.round(pct(ms, 0.5)), p95: Math.round(pct(ms, 0.95)) });
  }
  // Forty requests at once, the way a busy branch office loads its screens.
  const burstUrls = rows.filter((r) => r.status === 200).map((r) => r.url);
  const t = performance.now();
  const burst = await Promise.all(Array.from({ length: 40 }, (_, i) => timed(burstUrls[i % burstUrls.length])));
  return { rows, burst: { requests: 40, wallMs: Math.round(performance.now() - t), p50: Math.round(pct(burst.map((b) => b.ms), 0.5)), p95: Math.round(pct(burst.map((b) => b.ms), 0.95)), failed: burst.filter((b) => b.status !== 200).length } };
}
const report = { at: new Date().toISOString(), base: BASE, runs: RUNS, branch: await as('qa-branch-a@qa.test'), admin: await as('qa-admin@qa.test') };
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 1)}\n`);
for (const who of ['branch', 'admin']) {
  console.log(`\n${who}`);
  for (const r of report[who].rows) console.log(`  ${String(r.status === 200 ? `${r.p50} / ${r.p95} ms` : `status ${r.status}`).padEnd(16)} ${r.url}`);
  console.log(`  burst of 40: ${report[who].burst.wallMs} ms wall, p95 ${report[who].burst.p95} ms, ${report[who].burst.failed} failed`);
}
