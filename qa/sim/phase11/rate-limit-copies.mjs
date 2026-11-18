// Phase 11 measurement (E-014): is the sign-in limit per address one limit, or one per server copy?
// Start the cluster with a low limit (QA_LOGIN_RATE_LIMIT_MAX=10), then run this. It sends wrong passwords
// for an address that has no login from one network address, spread over the copies by the front door,
// and counts how many were let through to the password check (401) before the limit answered (429).
//   node qa/sim/phase11/rate-limit-copies.mjs --base http://localhost:3110 --limit 10 [--out file]
import fs from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3110'); const LIMIT = Number(arg('limit', '10')); const N = Number(arg('requests', '60'));
if (!/localhost|127\.0\.0\.1/.test(BASE)) throw new Error('Refusing: local QA servers only');
const state = await fetch(`${BASE}/__cluster/state`).then((r) => r.json()).catch(() => null);
const copies = state?.workers.filter((w) => w.up).length || 1;
const email = `nobody-${Date.now()}@qa.test`;
const one = async () => { const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'wrong-password-for-qa' }) }); return { status: r.status, copy: r.headers.get('x-qa-instance') }; };
const rs = []; for (let i = 0; i < N; i += 6) rs.push(...await Promise.all(Array.from({ length: Math.min(6, N - i) }, one)));
const through = rs.filter((r) => r.status === 401).length; const limited = rs.filter((r) => r.status === 429).length;
const out = { at: new Date().toISOString(), base: BASE, serverCopies: copies, limitPerWindow: LIMIT, requests: N, reachedThePasswordCheck: through, refusedByTheLimit: limited, otherAnswers: rs.length - through - limited, copiesThatAnswered: [...new Set(rs.map((r) => r.copy))].length, oneLimitForAllCopies: through <= LIMIT, perCopyWouldAllow: LIMIT * copies };
console.log(`${out.oneLimitForAllCopies ? '✓' : '✗'} sign-in limit ${LIMIT} on ${copies} server copies: ${through} of ${N} reached the password check, ${limited} refused (a limit per copy would have let ${Math.min(N, LIMIT * copies)} through)`);
if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(out, null, 2));
process.exit(out.oneLimitForAllCopies ? 0 : 1);
