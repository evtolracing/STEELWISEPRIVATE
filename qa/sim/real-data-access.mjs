#!/usr/bin/env node
// Who may ask the routes added or changed for the real locations and the screens rebuilt on real data
// (2026-11-22): nobody without a sign-in; a customer login only the store's own reads; staff the reads; and only
// people with the right to configure may save. Every row is asked on the QA server.
//   node qa/sim/real-data-access.mjs [--base http://localhost:3011]
import { QA_USERS } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
let pass = 0; const failed = [];
const token = {};
for (const who of ['admin', 'csr', 'branchA', 'custA']) {
  token[who] = (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS[who], password: 'qa-password-1' }) }).then((r) => r.json())).token;
  if (!token[who]) throw new Error(`QA sign-in failed for ${who}`);
}
const status = async (who, method, url) => (await fetch(BASE + url, { method, headers: { ...(who !== 'nobody' && { authorization: `Bearer ${token[who]}` }), 'content-type': 'application/json' }, body: method === 'GET' ? undefined : '{}' })).status;
const OK = (s) => s >= 200 && s < 300 || s === 400 || s === 404; // let in: answered, or refused for what was sent, not for who asked

//            route                                             nobody  customer  csr    branch sales  admin
const ROWS = [
  ['GET',  '/api/demand-shaping/config',                        401,    403,      'in',  'in',         'in'],
  ['PUT',  '/api/demand-shaping/config',                        401,    403,      403,   403,          'in'],
  ['POST', '/api/demand-shaping/suggestions',                   401,    403,      'in',  'in',         'in'],
  ['GET',  '/api/demand-shaping/analytics',                     401,    403,      'in',  'in',         'in'],
  ['GET',  '/api/shipments/ready-orders',                       401,    403,      'in',  'in',         'in'],
  ['GET',  '/api/shipments?scope=board',                        401,    403,      'in',  'in',         'in'],
  ['GET',  '/api/users?noBranch=true',                          401,    403,      'in',  'in',         'in'],
  ['GET',  '/api/admin/locations',                              401,    403,      'in',  'in',         'in'],
  ['POST', '/api/admin/locations',                              401,    403,      403,   403,          'in'],
  ['PUT',  '/api/admin/online-settings/cutoff-rules/none',      401,    403,      403,   403,          'in'],
  ['GET',  '/api/ecom/branches',                                401,    'in',     'in',  'in',         'in'],
  ['GET',  '/api/ecom/cutoff-rules',                            401,    'in',     'in',  'in',         'in'],
  ['POST', '/api/ecom/branch-comparison',                       401,    'in',     'in',  'in',         'in'],
];
const WHO = ['nobody', 'custA', 'csr', 'branchA', 'admin'];
for (const [method, url, ...want] of ROWS) {
  for (let i = 0; i < WHO.length; i += 1) {
    const got = await status(WHO[i], method, url);
    const ok = want[i] === 'in' ? OK(got) : got === want[i];
    if (ok) pass += 1; else failed.push(`${method} ${url} as ${WHO[i]}: got ${got}, expected ${want[i]}`);
  }
}
console.log(`who may ask: ${pass} passed, ${failed.length} failed`);
for (const f of failed) console.log(`  FAILED: ${f}`);
process.exit(failed.length ? 1 : 0);
