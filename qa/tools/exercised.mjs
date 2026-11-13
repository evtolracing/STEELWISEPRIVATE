#!/usr/bin/env node
// Turns server request logs (LOG_REQUESTS=on) into the list of API calls the automated runs
// actually made, with how each ended. Evidence for "exercised by a test", not for "correct".
//   node qa/tools/exercised.mjs <log file> [<log file> ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tally = new Map(); const sources = [];
for (const f of process.argv.slice(2)) {
  let n = 0;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line.startsWith('{"t"')) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.msg !== 'request' || !r.path?.startsWith('/api')) continue;
    // ids out, so the same route with different records is one entry
    const p = r.path.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, '/:id').replace(/\/+$/, '');
    const k = `${r.method} ${p} ${r.status}`;
    const e = tally.get(k) || { method: r.method, path: p, status: r.status, count: 0, maxMs: 0, roles: [] };
    e.count += 1; e.maxMs = Math.max(e.maxMs, r.ms || 0); if (r.role && !e.roles.includes(r.role)) e.roles.push(r.role);
    tally.set(k, e); n += 1;
  }
  sources.push({ file: path.basename(f), requests: n });
}
const requests = [...tally.values()].sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));
fs.writeFileSync(path.join(root, 'qa/results/exercised-endpoints.json'), JSON.stringify({ at: new Date().toISOString(), sources, requests }, null, 1));
console.log(JSON.stringify({ sources, distinct: requests.length, serverErrors: requests.filter((r) => r.status >= 500).map((r) => `${r.method} ${r.path} ${r.status} x${r.count}`), slowest: requests.sort((a, b) => b.maxMs - a.maxMs).slice(0, 8).map((r) => `${r.maxMs}ms ${r.method} ${r.path}`) }, null, 1));
