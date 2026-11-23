#!/usr/bin/env node
// Response times of the routes added or changed for the real locations and the screens rebuilt on real data
// (2026-11-22). Each read is asked 30 times in a row and then 10 at once, on the QA server and QA database, and
// judged by the repository's limit for a screen read (qa/sim/phase11/thresholds.mjs: p95 800 ms,
// p99 1500 ms; approved by the owner on 2026-11-22). The figures are for the QA machine, not the production host.
//   node qa/sim/perf-real-data-routes.mjs --base http://localhost:3001 [--out qa/results/perf-real-data-routes.json]
import fs from 'node:fs';
import { THRESHOLDS, STATUS } from './phase11/thresholds.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const API = arg('base', 'http://localhost:3001');
const OUT = arg('out', 'qa/results/perf-real-data-routes.json');
const LIMIT = THRESHOLDS.latency['screen read (lists, dashboards, reports)'];
const signIn = async (email) => (await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'qa-password-1' }) }).then((r) => r.json())).token;
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)].toFixed(1); };

const admin = await signIn('qa-admin@qa.test');
const csr = await signIn('qa-csr@qa.test');
const branch = await signIn('qa-branch-a@qa.test');
if (!admin || !csr || !branch) throw new Error('QA sign-in failed. Is the QA server running with the fixtures loaded?');
const first = (await fetch(`${API}/api/ecom/branches`, { headers: { authorization: `Bearer ${csr}` } }).then((r) => r.json())).data?.[0];

const READS = [
  ['locations list', admin, 'GET', '/api/admin/locations'],
  ['users list with the no-branch count', admin, 'GET', '/api/users?limit=50'],
  ['users with no branch', admin, 'GET', '/api/users?noBranch=true&limit=50'],
  ['users list, held to a branch', branch, 'GET', '/api/users?limit=50'],
  ['store branches', csr, 'GET', '/api/ecom/branches'],
  ['cut-off rules, every branch', csr, 'GET', '/api/ecom/cutoff-rules'],
  ['branch comparison', csr, 'POST', '/api/ecom/branch-comparison', { division: 'METALS', requiredProcessing: ['SAW'] }],
  ['demand shaping suggestions', csr, 'POST', '/api/demand-shaping/suggestions', { location: first?.code, division: 'METALS', items: [{ productId: 'x', quantity: 1 }], requestedDate: new Date(Date.now() + 86400000).toISOString() }],
  ['demand shaping settings with branch load', admin, 'GET', '/api/demand-shaping/config'],
  ['freight boards: every open shipment', admin, 'GET', '/api/shipments?scope=board'],
  ['freight boards, held to a branch', branch, 'GET', '/api/shipments?scope=board'],
  ['orders ready to ship', admin, 'GET', '/api/shipments/ready-orders'],
  ['jobs, held to a branch', branch, 'GET', '/api/jobs?limit=100'],
];

const ask = async ([, token, method, url, body]) => {
  const t = performance.now();
  const r = await fetch(API + url, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const bytes = (await r.arrayBuffer()).byteLength;
  return { ms: performance.now() - t, status: r.status, bytes };
};

const rows = [];
let failed = 0;
for (const read of READS) {
  await ask(read); // one unmeasured call: the first asking loads code and fills the connection pool
  const one = []; for (let i = 0; i < 30; i += 1) one.push(await ask(read));
  const burst = await Promise.all(Array.from({ length: 10 }, () => ask(read)));
  const all = [...one, ...burst];
  const bad = all.filter((x) => x.status >= 400).length;
  const row = { read: read[0], requests: all.length, p50: pct(one.map((x) => x.ms), 50), p95: pct(one.map((x) => x.ms), 95), p99: pct(all.map((x) => x.ms), 99), tenAtOnceMax: +Math.max(...burst.map((x) => x.ms)).toFixed(1), kilobytes: +(all[0].bytes / 1024).toFixed(1), refused: bad };
  row.pass = bad === 0 && row.p95 <= LIMIT.p95 && row.p99 <= LIMIT.p99;
  if (!row.pass) failed += 1;
  rows.push(row);
  console.log(`${row.pass ? '✓' : '✗'} ${row.read.padEnd(42)} p50=${row.p50} p95=${row.p95} p99=${row.p99} ten at once max=${row.tenAtOnceMax} ms  ${row.kilobytes} kB${bad ? `  ${bad} refused` : ''}`);
}
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), limit: { ...LIMIT, status: STATUS }, rows }, null, 2));
console.log(`response times: ${rows.length - failed} of ${rows.length} reads within p95 ${LIMIT.p95} ms and p99 ${LIMIT.p99} ms (${STATUS})`);
process.exit(failed ? 1 : 0);
