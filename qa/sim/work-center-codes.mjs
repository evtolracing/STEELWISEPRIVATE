#!/usr/bin/env node
// A branch may have several work centers of one kind, and so may every other branch (owner, 2026-11-22: "some of
// them have multiples of each machine"). Found on the live site: adding a second router failed with "already
// exists" or "Failed to create work center", because the new code was numbered by a count taken inside the branch
// being worked in, while codes are one list for the company.
//   node qa/sim/work-center-codes.mjs [--base http://localhost:3011]
import { QA_USERS, prismaClient, assertSafeDatabase } from './lib.mjs';

assertSafeDatabase(); const prisma = prismaClient();

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3011');
let pass = 0; const failed = [];
const check = (name, ok, detail = '') => { if (ok) pass += 1; else failed.push(`${name}${detail === '' ? '' : `: ${detail}`}`); };
const token = (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS.admin, password: 'qa-password-1' }) }).then((r) => r.json())).token;
if (!token) throw new Error('QA sign-in failed');
const call = async (method, url, body, branchId) => { const r = await fetch(BASE + url, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(branchId && { 'x-branch-id': branchId }) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };

const KIND = `QAWC${Date.now().toString(36).toUpperCase()}`;
const [a, b] = await prisma.location.findMany({ where: { isBranch: true, isActive: true }, orderBy: { code: 'asc' }, take: 2 });
if (!a || !b) throw new Error('two QA branches are needed');
await prisma.workCenterType.create({ data: { id: KIND, label: `QA kind ${KIND}`, divisions: [], isActive: true } });
const made = [];
const add = async (name, loc, working = loc) => { const r = await call('POST', '/api/v1/dispatch/work-centers', { name, locationId: loc.id, workCenterType: KIND }, working.id); if (r.body?.data?.id) made.push(r.body.data.id); return r; };
try {
  const one = await add('QA machine 1', a); check('the first of a kind is saved', one.status === 201, `${one.status} ${JSON.stringify(one.body).slice(0, 160)}`);
  const two = await add('QA machine 2', a); check('a second of the same kind at the same branch is saved', two.status === 201, `${two.status} ${JSON.stringify(two.body).slice(0, 160)}`);
  // The case that failed on live: working in another branch, where none of this kind is on file yet.
  const three = await add('QA machine 3', b); check('one of the same kind at another branch, added while working in that branch, is saved', three.status === 201, `${three.status} ${JSON.stringify(three.body).slice(0, 160)}`);
  // One is taken offline, then another is added at the same branch.
  if (made[0]) { const off = await call('DELETE', `/api/v1/dispatch/work-centers/${made[0]}`, null, a.id); check('a work center can be taken offline', off.status === 200, off.status); }
  const four = await add('QA machine 4', a); check('another is saved after one was taken offline', four.status === 201, `${four.status} ${JSON.stringify(four.body).slice(0, 160)}`);
  // A code that no longer follows the count: the lowest number is renamed away, as an edit or an import may do.
  if (made[1]) await prisma.workCenter.update({ where: { id: made[1] }, data: { code: `${KIND}-HAND` } });
  const five = await add('QA machine 5', b); check('another is saved when the numbers no longer match the count', five.status === 201, `${five.status} ${JSON.stringify(five.body).slice(0, 160)}`);
  const six = await Promise.all([add('QA machine 6', a), add('QA machine 7', b), add('QA machine 8', a)]);
  check('three added at the same moment are all saved', six.every((r) => r.status === 201), six.map((r) => r.status).join(','));
  const rows = await prisma.workCenter.findMany({ where: { type: KIND }, select: { code: true, name: true, locationId: true, isActive: true } });
  check('eight work centers of the kind are on file', rows.length === 8, rows.length);
  check('every code is different', new Set(rows.map((r) => r.code)).size === rows.length, rows.map((r) => r.code).join(','));
  check('both branches hold several of the kind', rows.filter((r) => r.locationId === a.id).length >= 2 && rows.filter((r) => r.locationId === b.id).length >= 2);
  check('the one taken offline is kept, not deleted', rows.some((r) => r.name === 'QA machine 1' && r.isActive === false));
  const dup = await call('POST', '/api/v1/dispatch/work-centers', { id: `${KIND}-HAND`, name: 'QA typed code', locationId: b.id, workCenterType: KIND }, b.id);
  check('a typed code already in use at another branch is refused plainly, not with a server error', dup.status === 409 && /already exists/.test(dup.body?.error || ''), `${dup.status} ${dup.body?.error}`);
} finally {
  await prisma.workCenter.deleteMany({ where: { type: KIND } }); await prisma.workCenterType.deleteMany({ where: { id: KIND } }); await prisma.$disconnect();
}
for (const f of failed) console.log(`✗ ${f}`);
console.log(`work center codes: ${pass} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
