#!/usr/bin/env node
// Role matrix, phase 4: one person's roles and exceptions against a running QA server (local QA database only).
//   node qa/sim/user-access.mjs [--base http://localhost:3011]
// Makes a clerk and an administrator, gives the clerk extra roles, exceptions and a custom main role,
// and checks after each step what the clerk's own sign-in may do. Leaves no test role or exception behind.
import { api, assertSafeDatabase, QA_PASSWORD, QA_USERS } from './lib.mjs';

assertSafeDatabase();
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3011';
const a = api(base);
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 220)}`); };
const R = '/api/users/roles';
const NOBODY = '00000000-0000-0000-0000-000000000000';
const stamp = Date.now().toString(36);
const soon = new Date(Date.now() + 7 * 864e5).toISOString();

await a.login('admin');
await a.login('csr');
const me = await a.get('/api/auth/me');
const home = me.body?.user?.homeLocationId || me.body?.homeLocationId || undefined;
const meId = me.body?.user?.id || me.body?.id;
const make = async (key, role) => {
  QA_USERS[key] = `qa-access-${key}-${stamp}@qa.test`;
  const r = await a.post('/api/users', { email: QA_USERS[key], password: QA_PASSWORD, firstName: 'Access', lastName: key, role, homeLocationId: home });
  check(`a ${role} login is made for the run`, r.status === 201, r.body);
  await a.login(key);
  return r.body?.id || r.body?.user?.id;
};
const targetId = await make('target', 'CSR');
const adminId = await make('roleAdmin', 'ADMIN');
const A = (id) => `/api/users/${id}/access`;
const perms = async (who) => { const r = await a.get('/api/auth/me', who); return r.body?.user?.permissions || r.body?.permissions || []; };
const mayEditCustomer = async () => (await a.put(`/api/customers/${NOBODY}`, { name: 'x' }, 'target')).status !== 403;
const readsLedger = async () => (await a.get('/api/ledger/status', 'target')).status === 200;

// ── Reading ──
const first = await a.get(A(targetId));
check('a person\'s access is shown: main role, nothing extra, and what it adds up to', first.status === 200 && first.body.mainRole.name === 'CSR' && !first.body.mainRole.custom && first.body.extras.length === 0 && first.body.exceptions.length === 0 && first.body.effective.permissions.includes('orders:edit') && first.body.effective.sources['orders:edit'].length === 1 && first.body.canSetExceptions === true && first.body.customMainRoleReady === true, first.body);
check('a clerk cannot look at another person\'s access', (await a.get(A(adminId), 'csr')).status === 403);
check('anyone can look at their own', (await a.get(A(targetId), 'target')).status === 200);
check('before: the clerk cannot read the ledger, can change a customer', !(await readsLedger()) && await mayEditCustomer());

// ── Two custom roles to give ──
const ledgerRole = await a.post(R, { displayName: `QA ledger reader ${stamp}`, grants: ['finance:view'], branchScope: 'ALL' });
const floorRole = await a.post(R, { displayName: `QA floor viewer ${stamp}`, grants: ['general:view', 'orders:view', 'inventory:view'], branchScope: 'OWN' });
const booksRole = await a.post(R, { displayName: `QA books starter ${stamp}`, grants: ['finance:activate'], baseRole: 'CSR' });
check('custom roles are made, standing on the plainest built-in role unless one is named', ledgerRole.status === 201 && floorRole.status === 201 && floorRole.body.baseRole === 'VIEWER' && booksRole.body.baseRole === 'CSR', floorRole.body);

// ── Extra roles ──
check('a clerk cannot give roles', (await a.put(A(targetId), { extras: [{ roleId: ledgerRole.body.id }] }, 'csr')).status === 403);
check('nobody changes their own roles', (await a.put(A(adminId), { extras: [] }, 'roleAdmin')).status === 400);
check('an end date in the past is refused', (await a.put(A(targetId), { extras: [{ roleId: ledgerRole.body.id, expiresAt: '2020-01-01' }] }, 'roleAdmin')).status === 400);
const beyond = await a.put(A(targetId), { extras: [{ roleId: booksRole.body.id }] }, 'roleAdmin');
check('an administrator cannot give a role that holds more than they do', beyond.status === 400 && /holds what you do not/.test(beyond.body.error), beyond.body);
const top = (await a.get(`${R}/list?all=1`)).body.find((r) => r.name === 'SUPER_ADMIN');
check('the super admin role is never given on top', (await a.put(A(targetId), { extras: [{ roleId: top.id }] })).status === 400);
check('nor through the user form', (await a.put(`/api/users/${targetId}`, { roleIds: [top.id] }, 'roleAdmin')).status === 400);
const given = await a.put(A(targetId), { extras: [{ roleId: ledgerRole.body.id, expiresAt: soon }] }, 'roleAdmin');
check('an administrator gives an extra role with an end date', given.status === 200, given.body);
check('after: the clerk reads the ledger at once, with the same sign-in', await readsLedger());
check('and is told the new permission', (await perms('target')).includes('finance:view'));
const shownExtra = await a.get(A(targetId));
check('the screen shows the extra role and where each permission comes from', shownExtra.body.extras.length === 1 && shownExtra.body.extras[0].counts && shownExtra.body.effective.sources['finance:view'][0].startsWith('QA ledger reader') && shownExtra.body.effective.branchScope === 'ALL', shownExtra.body.extras);
check('a role people hold is not deleted', (await a.call('DELETE', `${R}/${ledgerRole.body.id}`)).status === 400);

// ── Exceptions ──
const deny = { permission: 'customers:edit', effect: 'DENY', reason: 'New starter: read only for the first month', expiresAt: soon };
check('an exception needs a reason', (await a.put(A(targetId), { exceptions: [{ ...deny, reason: '' }] }, 'roleAdmin')).status === 400);
check('an administrator cannot give one person a permission they do not hold', (await a.put(A(targetId), { exceptions: [{ permission: 'finance:activate', effect: 'GRANT', reason: 'x' }] }, 'roleAdmin')).status === 400);
check('a made-up permission is refused', (await a.put(A(targetId), { exceptions: [{ permission: 'orders:fly', effect: 'GRANT', reason: 'x' }] }, 'roleAdmin')).status === 400);
const setEx = await a.put(A(targetId), { exceptions: [deny, { permission: 'executive:view', effect: 'GRANT', reason: 'Covers for the branch manager' }, { permission: 'finance:view', effect: 'DENY', reason: 'Not the ledger after all' }] }, 'roleAdmin');
check('exceptions are saved', setEx.status === 200, setEx.body);
check('a denial wins over the main role: the clerk can no longer change a customer', !(await mayEditCustomer()));
check('a denial wins over an extra role: the ledger is closed again', !(await readsLedger()));
check('a grant opens what no role gives', (await a.get('/api/executive/summary', 'target')).status !== 403 && (await perms('target')).includes('executive:view'));
const shownEx = await a.get(A(targetId));
check('the screen shows the exceptions, who set them, and what is denied', shownEx.body.exceptions.length === 3 && shownEx.body.exceptions.every((x) => x.by && x.reason) && shownEx.body.effective.denied['customers:edit'] === deny.reason && !shownEx.body.effective.permissions.includes('finance:view'), shownEx.body.exceptions);
check('the extra roles were left alone by that change', shownEx.body.extras.length === 1);
check('exceptions are cleared', (await a.put(A(targetId), { exceptions: [] }, 'roleAdmin')).status === 200 && await mayEditCustomer() && await readsLedger());

// ── A custom role as the main role ──
check('before: the clerk may create an order (not refused by role)', (await a.post('/api/orders', {}, 'target')).status !== 403);
check('a built-in role is not set here', (await a.put(A(targetId), { primaryRoleId: top.id })).status === 400);
const main = await a.put(A(targetId), { primaryRoleId: floorRole.body.id }, 'roleAdmin');
check('an administrator gives a custom role as the main role', main.status === 200, main.body);
const told = await a.get('/api/auth/me', 'target');
const toldUser = told.body?.user || told.body;
check('the login now stands on the custom role\'s built-in role and carries its name', toldUser.role === 'VIEWER' && String(toldUser.mainRole).startsWith('QA floor viewer'), { role: toldUser.role, mainRole: toldUser.mainRole });
const now = await perms('target');
check('its permissions are the custom role\'s plus the extra role\'s, nothing of the old role', now.includes('orders:view') && now.includes('finance:view') && !now.includes('orders:edit') && !now.includes('customers:edit'), now);
check('after: creating an order is refused', (await a.post('/api/orders', {}, 'target')).status === 403);
const held = (await a.get(`${R}/${floorRole.body.id}`)).body;
check('the role shows who holds it', held.holders === 1 && held.users.some((u) => u.id === targetId), { holders: held.holders });
check('and is not deleted while held', (await a.call('DELETE', `${R}/${floorRole.body.id}`)).status === 400);
const trimmed = await a.put(`${R}/${floorRole.body.id}`, { grants: ['general:view', 'orders:view', 'inventory:view', 'orders:create'] });
check('changing the custom role changes what the person may do, at once', trimmed.status === 200 && (await a.post('/api/orders', {}, 'target')).status !== 403);
const backToClerk = await a.put(`/api/users/${targetId}`, { role: 'CSR' }, 'roleAdmin');
check('picking a built-in role in the user form ends the custom main role', backToClerk.status === 200 && (await a.get(A(targetId))).body.mainRole.name === 'CSR' && (await perms('target')).includes('orders:edit'));

// ── Safeguards on who ──
check('nothing is set on a super admin login', (await a.put(A(meId), { extras: [{ roleId: ledgerRole.body.id }] }, 'roleAdmin')).status !== 200);
check('an unknown person', (await a.get(A(NOBODY))).status === 404);

// ── History ──
const history = await a.get(`${A(targetId)}/history`);
check('every change is in the history with who, and what was added and removed', history.status === 200 && history.body.length >= 4 && history.body.every((h) => h.by && h.before && h.after) && history.body.some((h) => h.added.includes('finance:view')) && history.body.some((h) => h.removed.includes('customers:edit')), history.body.length);
check('a clerk cannot read it', (await a.get(`${A(targetId)}/history`, 'csr')).status === 403);

// ── Clean up ──
check('extra roles are cleared', (await a.put(A(targetId), { extras: [], exceptions: [], primaryRoleId: null }, 'roleAdmin')).status === 200 && !(await readsLedger()));
for (const r of [ledgerRole, floorRole, booksRole]) check('the run\'s role is deleted', (await a.call('DELETE', `${R}/${r.body.id}`)).status === 200);
for (const id of [targetId, adminId]) check('the run\'s login is switched off', (await a.call('DELETE', `/api/users/${id}`)).status === 200);

console.log(`user access API: ${passed} passed, ${failed.length} failed`);
for (const f of failed) console.log(`  FAILED: ${f}`);
process.exit(failed.length ? 1 : 0);
