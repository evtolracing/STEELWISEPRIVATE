#!/usr/bin/env node
// Phase 1 baseline probes against the QA server. Reads every mounted route from the discovery
// file, so a route added later is covered without editing this file.
//   node qa/tools/discover.mjs && node qa/sim/baseline-probe.mjs --base http://localhost:3011
// Sections:
//   1. Read-only roles (auditor, data analyst) cannot change anything.
//   2. A second address for the same records follows the same department rules.
//   3. Every route that changes data, sent an empty body by an admin: none may crash (5xx).
//      --max-crash N tolerates N known ones (the baseline), so the number can only go down.
//   4. What a login at one branch can read and change at another (reported, not judged).
import fs from 'node:fs';
import path from 'node:path';
import { prismaClient, QA_USERS, QA_PASSWORD } from './lib.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
const OUT = arg('out', 'qa/results/baseline-probe.json');
const MAX_CRASH = Number(arg('max-crash', 0));
const here = path.dirname(new URL(import.meta.url).pathname);
const discovery = JSON.parse(fs.readFileSync(path.join(here, '../enterprise-excellence/.discovery.json'), 'utf8'));
const prisma = prismaClient();
const FAKE = '00000000-0000-4000-8000-000000000000';
const under = (p, list) => list.some((x) => p === x || p.startsWith(`${x}/`));

const send = async (method, url, token, body = {}) => {
  try {
    const res = await fetch(BASE + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, body: json, text: text.slice(0, 160) };
  } catch (e) { return { status: 0, text: String(e.message) }; }
};
const login = async (email, password = QA_PASSWORD) => (await send('POST', '/api/auth/login', null, { email, password })).body?.token;
const report = { base: BASE, at: new Date().toISOString(), sections: {} };
const section = (name, data) => { report.sections[name] = data; console.log(`${data.pass ? '✓' : '✗'} ${name}: ${data.summary}`); for (const f of (data.findings || []).slice(0, 12)) console.log('    ', f); };

const admin = await login(QA_USERS.admin);
if (!admin) { console.error('admin login failed'); process.exit(2); }
/** A QA login with the given role, made through the user API. */
async function loginAs(role, extra = {}) {
  const email = `qa-probe-${role.toLowerCase().replace(/_/g, '-')}${extra.tag || ''}@qa.test`;
  const made = await send('POST', '/api/users', admin, { email, password: QA_PASSWORD, firstName: 'Probe', lastName: role, role, ...extra.fields });
  if (![201, 200, 400, 409].includes(made.status)) throw new Error(`could not create ${email}: ${made.status} ${made.text}`);
  if (extra.fields?.homeLocationId) await prisma.user.updateMany({ where: { email }, data: { homeLocationId: extra.fields.homeLocationId } });
  const token = await login(email);
  if (!token) throw new Error(`could not sign in ${email}: ${made.status} ${made.text}`);
  return token;
}

const writes = discovery.backend.endpoints.filter((e) => e.method !== 'GET' && !e.full.includes('*'));
const urlOf = (e) => e.full.replace(/:[A-Za-z_]+\??/g, FAKE);
const PARTNER = ['/api/v1/partner'];
// Asking the assistant, pricing a basket or checking a form changes no record. These stay open to read-only roles.
const ASK_ONLY = ['/api/auth', '/api/ai', '/api/v1/ai', '/api/pricing', '/api/pos/validation', '/api/v1/bom/recipes/match', '/api/v1/bom/ai-suggest', '/api/pos/quick-sale/lookup', '/api/pos/quick-sale/price', '/api/v1/pipeline/simulate'];

// 1 ─ Read-only roles change nothing
{
  const findings = []; let tested = 0;
  for (const role of ['AUDITOR', 'DATA_ANALYST']) {
    const token = await loginAs(role);
    for (const e of writes) {
      if (under(e.full, PARTNER) || under(e.full, ASK_ONLY)) continue;
      tested += 1;
      const r = await send(e.method, urlOf(e), token);
      if (r.status !== 403) findings.push(`${role}: ${e.key} → ${r.status} (expected 403)`);
    }
    // and reading still works
    const read = await send('GET', '/api/orders?limit=1', token);
    if (read.status !== 200) findings.push(`${role}: cannot read orders → ${read.status}`);
    const ask = await send('POST', '/api/pricing/calculate', token, {});
    if (ask.status === 403) findings.push(`${role}: refused a price calculation, which changes nothing`);
  }
  section('Read-only roles cannot change anything', { pass: findings.length === 0, summary: `${tested} write calls as auditor and data analyst, ${findings.length} not refused`, tested, findings });
}

// 2 ─ The second address for jobs and work centers follows the same rules as the first
{
  const findings = []; let checks = 0;
  const token = await loginAs('MAINTENANCE_MANAGER'); // not a production, sales, warehouse or quality role
  const job = await prisma.job.findFirst({ where: { status: 'SCHEDULED' } }) || await prisma.job.findFirst();
  for (const [m, tail, body] of [['PATCH', `/${job?.id || FAKE}`, { instructions: 'changed by a maintenance login (QA probe)' }], ['POST', `/${job?.id || FAKE}/status`, { status: 'IN_PROCESS' }], ['POST', '', {}]]) {
    const first = await send(m, `/api/jobs${tail}`, token, body); const second = await send(m, `/api/v1/jobs${tail}`, token, body);
    checks += 1;
    if (first.status !== 403) findings.push(`maintenance login: ${m} /api/jobs${tail ? '/…' : ''} → ${first.status} (expected 403)`);
    if (second.status !== first.status) findings.push(`${m} /api/v1/jobs${tail ? '/…' : ''} → ${second.status}, but /api/jobs gives ${first.status}: the second address skips the department rule`);
  }
  const after = job ? await prisma.job.findUnique({ where: { id: job.id } }) : null;
  checks += 1;
  if (job && (after.status !== job.status || after.instructions !== job.instructions)) findings.push(`the job was changed by a login that may not change jobs (status ${job.status} → ${after.status})`);
  section('A second address follows the same department rules', { pass: findings.length === 0, summary: `${checks} checks, ${findings.length} problems`, findings });
}

// 3 ─ Empty body to every write route as an admin
{
  const SKIP = ['/api/ai', '/api/v1/ai', '/api/v1/ingest', '/api/v1/pipeline', '/api/auth', '/api/admin/seed-demo', '/api/pos/quick-sale/email-receipt', '/api/pos/quick-sale/sms-receipt', '/api/v1/partner', '/api/assets/seed-from-work-centers'];
  const crashes = []; const saved = []; const byStatus = {}; let tested = 0;
  for (const e of writes) {
    if (under(e.full, SKIP) || /^(POST|DELETE) \/api\/ai/.test(e.key)) continue;
    tested += 1;
    const r = await send(e.method, urlOf(e), admin);
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.status >= 500 || r.status === 0) crashes.push(`${e.key} → ${r.status}  (${e.file.split('/').pop()}:${e.line})`);
    else if (r.status === 201 || (r.status === 200 && e.method === 'POST' && !e.full.includes(':') && e.writes > 0)) saved.push(`${e.key} → ${r.status}`);
  }
  section('Write routes sent an empty body do not crash', { pass: crashes.length <= MAX_CRASH, summary: `${tested} write routes, ${crashes.length} answered with a server error (allowed: ${MAX_CRASH}), ${saved.length} saved a record from nothing`, tested, byStatus, findings: crashes, savedFromNothing: saved });
}

// 4 ─ One branch reading and changing another branch's records (reported for the owner)
{
  const observations = [];
  const withStock = (await prisma.inventory.findMany({ distinct: ['locationId'], select: { locationId: true }, take: 200 })).map((s) => s.locationId);
  const sites = await prisma.location.findMany({ where: { isActive: true }, take: 200 });
  const home = sites.find((s) => !withStock.includes(s.id)) || sites[0];
  const other = withStock.find((id) => id !== home?.id);
  if (!home || !other) observations.push('not enough branches with stock in the QA data to compare');
  else {
    const token = await loginAs('INVENTORY_MANAGER', { tag: '-branch', fields: { homeLocationId: home.id } });
    const list = await send('GET', `/api/inventory?locationId=${other}&limit=5`, token);
    const rows = Array.isArray(list.body) ? list.body : list.body?.data || list.body?.items || [];
    observations.push(`a login whose home branch is ${home.code} read ${rows.length} stock rows of another branch → ${list.status}`);
    const all = await send('GET', '/api/orders?limit=5', token);
    observations.push(`the same login listed orders of every branch → ${all.status}`);
    const otherOrder = await prisma.order.findFirst({ where: { status: { in: ['DRAFT', 'PENDING', 'CONFIRMED'] } } });
    if (otherOrder) { const one = await send('GET', `/api/orders/${otherOrder.id}`, token); observations.push(`it opened one order by id → ${one.status}`); }
    const coil = await prisma.coil.findFirst({ where: { locationId: other } });
    if (coil) { const hold = await send('POST', `/api/coils/${coil.id}/hold`, token, { reason: 'QA probe: hold placed from another branch' }); observations.push(`it placed a hold on a stock item at the other branch → ${hold.status}`); if (hold.status < 300) await send('POST', `/api/coils/${coil.id}/release`, token, { reason: 'QA probe: released' }); }
    observations.push(`rows that assign users to branches (UserLocation): ${await prisma.userLocation.count()}; to divisions (UserDivision): ${await prisma.userDivision.count()}`);
  }
  section('Branch to branch access (reported, not judged)', { pass: true, summary: observations.join('; '), observations });
}

report.pass = Object.values(report.sections).every((s) => s.pass);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
console.log(`\n${report.pass ? 'ALL SECTIONS PASS' : 'FINDINGS — see'} ${OUT}`);
await prisma.$disconnect();
process.exit(report.pass ? 0 : 1);
