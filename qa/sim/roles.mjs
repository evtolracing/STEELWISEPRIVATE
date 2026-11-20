#!/usr/bin/env node
// Role matrix, phase 2: the roles API against a running QA server (local QA database only).
//   node qa/sim/roles.mjs [--base http://localhost:3011]
// Reads the grid and the roles, then creates, changes, resets and deletes roles as a super admin,
// an administrator and a clerk, and checks every safeguard and the audit trail. Leaves no test role behind.
import { api, assertSafeDatabase, QA_PASSWORD, QA_USERS } from './lib.mjs';

assertSafeDatabase();
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'http://localhost:3011';
const a = api(base);
let passed = 0;
const failed = [];
const check = (name, ok, detail = '') => { if (ok) passed += 1; else failed.push(`${name} ${detail}`); };
const R = '/api/users/roles';

await a.login('admin');
await a.login('csr');

// An administrator (role ADMIN) to act as: made here so its password is known.
const stamp = Date.now().toString(36);
QA_USERS.roleAdmin = `qa-roles-admin-${stamp}@qa.test`;
const me = await a.get('/api/auth/me');
const made = await a.post('/api/users', { email: QA_USERS.roleAdmin, password: QA_PASSWORD, firstName: 'Roles', lastName: 'Admin', role: 'ADMIN', homeLocationId: me.body?.user?.homeLocationId || me.body?.homeLocationId || undefined });
check('an ADMIN login can be made for the run', made.status === 201, JSON.stringify(made.body).slice(0, 200));
await a.login('roleAdmin');

// ── Reading ──
const catalog = await a.get(`${R}/catalog`, 'csr');
check('any staff login reads the grid', catalog.status === 200 && catalog.body.areas.length > 30 && catalog.body.enforced === false);
const list = await a.get(`${R}/list?all=1`);
check('the roles are listed with who holds them', list.status === 200 && list.body.length >= 48 && list.body.every((r) => Array.isArray(r.grants) && typeof r.holders === 'number'));
const byName = Object.fromEntries(list.body.map((r) => [r.name, r]));
check('super admin and tenant owner are locked', byName.SUPER_ADMIN.locked && byName.TENANT_OWNER.locked && !byName.ADMIN.locked);
check('built-in roles are marked', byName.CSR.builtIn && byName.CSR.holders > 0);
const one = await a.get(`${R}/${byName.CSR.id}`);
check('a role shows its people, its default and what the reader may tick', one.status === 200 && one.body.users.length === byName.CSR.holders && one.body.defaults.grants.length > 0 && one.body.myGrants.includes('*'));
check('a clerk cannot read a role\'s history', (await a.get(`${R}/${byName.CSR.id}/history`, 'csr')).status === 403);

// ── Who may change ──
const body = { displayName: `QA night lead ${stamp}`, description: 'made by qa/sim/roles.mjs', grants: ['orders:view', 'orders:edit'], branchScope: 'OWN' };
check('a clerk cannot create a role', (await a.post(R, body, 'csr')).status === 403);
check('a clerk cannot change a role', (await a.put(`${R}/${byName.CSR.id}`, { grants: [] }, 'csr')).status === 403);

// ── Create, change, history ──
const created = await a.post(R, body, 'roleAdmin');
check('an administrator creates a role', created.status === 201 && created.body.name === `QA_NIGHT_LEAD_${stamp.toUpperCase()}` && created.body.branchScope === 'OWN' && !created.body.builtIn, JSON.stringify(created.body).slice(0, 200));
const id = created.body.id;
check('the same name twice is refused', (await a.post(R, body, 'roleAdmin')).status === 400);
const saved = await a.put(`${R}/${id}`, { grants: ['orders:view', 'billing:credit', 'made:up'].filter((g) => g !== 'made:up'), branchScope: 'ASSIGNED' }, 'roleAdmin');
check('a change is saved', saved.status === 200 && saved.body.grants.join() === 'orders:view,billing:credit' && saved.body.branchScope === 'ASSIGNED', JSON.stringify(saved.body).slice(0, 200));
check('a made-up permission is refused', (await a.put(`${R}/${id}`, { grants: ['orders:fly'] }, 'roleAdmin')).status === 400);
check('"everything" cannot be given to a role', (await a.put(`${R}/${id}`, { grants: ['*'] })).status === 400);
const beyond = await a.put(`${R}/${id}`, { grants: ['orders:view', 'finance:activate'] }, 'roleAdmin');
check('an administrator cannot give a permission they do not hold', beyond.status === 400 && /do not hold/.test(beyond.body.error), JSON.stringify(beyond.body));
check('the super admin can give it', (await a.put(`${R}/${id}`, { grants: ['orders:view', 'finance:activate'] })).status === 200);
const history = await a.get(`${R}/${id}/history`, 'roleAdmin');
check('every change is in the history with before and after', history.status === 200 && history.body.length === 3 && history.body[0].added.includes('finance:activate') && history.body[0].removed.includes('billing:credit') && history.body[2].event === 'ROLE_CREATED' && history.body[1].before.grants.join() === 'orders:view,orders:edit', JSON.stringify(history.body).slice(0, 300));

// ── Safeguards on built-in roles ──
check('the super admin role cannot be changed', (await a.put(`${R}/${byName.SUPER_ADMIN.id}`, { grants: [] })).status === 400);
check('the tenant owner role cannot be changed', (await a.put(`${R}/${byName.TENANT_OWNER.id}`, { displayName: 'x' })).status === 400);
check('a built-in role cannot be switched off', (await a.put(`${R}/${byName.CSR.id}`, { isActive: false })).status === 400);
check('a built-in role cannot be deleted', (await a.call('DELETE', `${R}/${byName.CSR.id}`)).status === 400);
const own = await a.put(`${R}/${byName.ADMIN.id}`, { grants: byName.ADMIN.grants.filter((g) => g !== 'roles:edit') }, 'roleAdmin');
check('an administrator cannot take role editing from their own role', own.status === 400 && /your own role/.test(own.body.error), JSON.stringify(own.body));
check('a customer role holds the web shop only', (await a.put(`${R}/${byName.CUSTOMER_BUYER.id}`, { grants: ['ecommerce:view', 'orders:view'] })).status === 400);

// ── Change a built-in role, then reset it ──
const before = byName.QC_INSPECTOR.grants;
const trimmed = await a.put(`${R}/${byName.QC_INSPECTOR.id}`, { grants: before.filter((g) => g !== 'quality:delete') }, 'roleAdmin');
check('a built-in role can be changed', trimmed.status === 200 && !trimmed.body.grants.includes('quality:delete') && trimmed.body.grants.length === before.length - 1);
const reset = await a.post(`${R}/${byName.QC_INSPECTOR.id}/reset`, {}, 'roleAdmin');
check('reset returns it to its default', reset.status === 200 && reset.body.grants.join() === before.join(), JSON.stringify(reset.body).slice(0, 200));
check('a custom role has no default to reset to', (await a.post(`${R}/${id}/reset`, {}, 'roleAdmin')).status === 400);

// ── Preview is view-only here too ──
const preview = await fetch(`${base}${R}/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${(await (await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: QA_USERS.admin, password: QA_PASSWORD }) })).json()).token}`, 'x-view-as-role': 'CSR' }, body: JSON.stringify({ grants: [] }) });
check('nothing is changed while previewing another role', preview.status === 403);

// ── Delete, and clean up ──
check('a clerk cannot delete a role', (await a.call('DELETE', `${R}/${id}`, undefined, 'csr')).status === 403);
check('a custom role nobody holds is deleted', (await a.call('DELETE', `${R}/${id}`, undefined, 'roleAdmin')).status === 200);
check('it is gone', (await a.get(`${R}/${id}`)).status === 404);
check('the user form still gets its list of active roles', (await a.get(`${R}/list`, 'csr')).status === 200);
const off = await a.call('DELETE', `/api/users/${made.body?.id || made.body?.user?.id}`);
check('the run\'s ADMIN login is switched off again', off.status === 200, JSON.stringify(off.body).slice(0, 120));

console.log(`roles API: ${passed} passed, ${failed.length} failed`);
for (const f of failed) console.log(`  FAILED: ${f}`);
process.exit(failed.length ? 1 : 0);
