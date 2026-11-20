// Role matrix, phase 2: what may be changed about a role, and by whom (lib/roleEditRules.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cleanGrants, grantsDiff, isLocked, roleChangeDenial, roleDeleteDenial, roleName, SENSITIVE } from '../src/lib/roleEditRules.js';
import { BUILTIN_DEFAULTS } from '../src/lib/builtinRoleDefaults.js';
import { PERMISSIONS } from '../src/lib/permissionCatalog.js';
import { BUILTIN_ROLES, defaultsModule, ENDPOINTS, todayAllows } from '../scripts/permission-defaults.js';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const owner = { role: 'SUPER_ADMIN', grants: ['*'] };
const admin = { role: 'ADMIN', grants: BUILTIN_DEFAULTS.ADMIN.grants };
const csr = { id: 'r-csr', name: 'CSR', displayName: 'CSR', isSystem: true, isActive: true, audience: 'STAFF', branchScope: 'ASSIGNED', grants: BUILTIN_DEFAULTS.CSR.grants };
const custom = { id: 'r-x', name: 'NIGHT_LEAD', displayName: 'Night lead', isSystem: false, isActive: true, audience: 'STAFF', branchScope: 'ASSIGNED', grants: ['orders:view'] };

test('the defaults a built-in role is reset to are today\'s rules', () => {
  assert.equal(readFileSync(here('../src/lib/builtinRoleDefaults.js'), 'utf8').trim(), defaultsModule().trim(), 'Run: node scripts/permission-defaults.js --module > src/lib/builtinRoleDefaults.js');
  assert.deepEqual(Object.keys(BUILTIN_DEFAULTS), BUILTIN_ROLES.map((r) => r.name));
});

test('only a login that holds roles:edit changes a role', () => {
  assert.equal(roleChangeDenial(admin, csr, { grants: csr.grants.filter((g) => g !== 'orders:delete') }), null);
  assert.match(roleChangeDenial({ role: 'BRANCH_MANAGER', grants: BUILTIN_DEFAULTS.BRANCH_MANAGER.grants }, csr, { grants: [] }), /administrator/);
  assert.match(roleChangeDenial({ role: 'CSR', grants: csr.grants }, custom, { displayName: 'x' }), /administrator/);
  assert.match(roleDeleteDenial({ role: 'CSR', grants: csr.grants }, custom, { holders: 0 }), /administrator/);
});

test('super admin and tenant owner cannot be changed by anyone', () => {
  for (const name of ['SUPER_ADMIN', 'TENANT_OWNER']) {
    const role = { id: name, name, displayName: name, isSystem: true, isActive: true, audience: 'STAFF', grants: ['*'] };
    assert.equal(isLocked(role), true);
    for (const change of [{ grants: [] }, { displayName: 'Boss' }, { isActive: false }, { branchScope: 'OWN' }]) assert.match(roleChangeDenial(owner, role, change), /cannot be changed/);
  }
  // A custom role that happens to share the name is not the locked one.
  assert.equal(isLocked({ name: 'SUPER_ADMIN', isSystem: false }), false);
  assert.match(roleChangeDenial(owner, custom, { grants: ['*'] }), /hold everything/);
});

test('nobody gives a permission they do not hold', () => {
  // An administrator holds everything except starting and stopping the books.
  assert.match(roleChangeDenial(admin, csr, { grants: [...csr.grants, 'finance:activate'] }), /do not hold/);
  assert.equal(roleChangeDenial(owner, csr, { grants: [...csr.grants, 'finance:activate'] }), null);
  // Leaving in place what the role already has is not giving it.
  const cfo = { id: 'r-cfo', name: 'CFO', isSystem: true, isActive: true, audience: 'STAFF', grants: BUILTIN_DEFAULTS.CFO.grants };
  assert.ok(cfo.grants.includes('finance:activate'));
  assert.equal(roleChangeDenial(admin, cfo, { grants: cfo.grants.filter((g) => g !== 'orders:delete') }), null);
  assert.match(roleChangeDenial(admin, null, { name: 'Books', displayName: 'Books', grants: ['finance:activate'] }, { takenNames: [] }), /do not hold/);
});

test('the right to edit roles cannot be lost', () => {
  const adminRole = { id: 'r-admin', name: 'ADMIN', isSystem: true, isActive: true, audience: 'STAFF', grants: admin.grants };
  const without = admin.grants.filter((g) => g !== 'roles:edit');
  assert.match(roleChangeDenial(admin, adminRole, { grants: without }), /your own role/);
  assert.match(roleChangeDenial(admin, adminRole, { grants: admin.grants.filter((g) => g !== 'admin:view') }), /lose this screen/);
  assert.match(roleChangeDenial(owner, adminRole, { grants: without }, { editorsAfter: 0 }), /nobody who can edit roles/);
  assert.equal(roleChangeDenial(owner, adminRole, { grants: without }, { editorsAfter: 2 }), null);
});

test('a built-in role is never deleted or switched off, and a held role is not removed', () => {
  assert.match(roleDeleteDenial(owner, csr, { holders: 0 }), /built-in/);
  assert.match(roleChangeDenial(owner, csr, { isActive: false }, { holders: 0 }), /built-in/);
  assert.match(roleDeleteDenial(owner, custom, { holders: 3 }), /3 people hold/);
  assert.match(roleChangeDenial(owner, custom, { isActive: false }, { holders: 1 }), /1 person holds/);
  assert.equal(roleDeleteDenial(owner, custom, { holders: 0 }), null);
  assert.equal(roleChangeDenial(owner, custom, { isActive: false }, { holders: 0 }), null);
});

test('a new role needs a free name, a display name, real permissions and a real branch choice', () => {
  const taken = { takenNames: ['CSR', 'NIGHT_LEAD'] };
  assert.equal(roleName('  Night shift lead! '), 'NIGHT_SHIFT_LEAD');
  assert.equal(roleChangeDenial(owner, null, { name: 'Day lead', displayName: 'Day lead', grants: ['orders:view'] }, taken), null);
  assert.match(roleChangeDenial(owner, null, { name: 'csr', displayName: 'Csr', grants: [] }, taken), /already a role/);
  assert.match(roleChangeDenial(owner, null, { name: 'x', displayName: 'x', grants: [] }, taken), /name of 3 to 40/);
  assert.match(roleChangeDenial(owner, null, { name: 'Day lead', displayName: ' ', grants: [] }, taken), /display name/);
  assert.match(roleChangeDenial(owner, custom, { grants: ['orders:view', 'orders:fly'] }), /Not a permission/);
  assert.match(roleChangeDenial(owner, custom, { grants: 'orders:view' }), /list/);
  assert.match(roleChangeDenial(owner, custom, { branchScope: 'EVERYWHERE' }), /branches/);
});

test('a customer or partner role holds the web shop only', () => {
  const buyer = { id: 'r-b', name: 'CUSTOMER_BUYER', isSystem: true, isActive: true, audience: 'CUSTOMER', grants: ['ecommerce:view'] };
  assert.match(roleChangeDenial(owner, buyer, { grants: ['ecommerce:view', 'orders:view'] }), /web shop only/);
  assert.equal(roleChangeDenial(owner, buyer, { grants: [] }), null);
});

test('what changed is reported exactly, and permissions are stored clean', () => {
  assert.deepEqual(grantsDiff(['a', 'b'], ['b', 'c']), { added: ['c'], removed: ['a'] });
  assert.deepEqual(cleanGrants(['orders:edit', 'orders:view', 'orders:edit', 'made:up']), PERMISSIONS.filter((p) => ['orders:view', 'orders:edit'].includes(p)));
  for (const p of ['billing:credit', 'counterSales:void', 'finance:activate', 'roles:edit', 'adminUsers:resetPassword', 'admin:preview']) assert.ok(SENSITIVE.has(p), p);
});

test('the role routes: any staff login reads, only a system administrator changes', () => {
  const routes = ENDPOINTS.filter((e) => e.mount === '/api/users/roles');
  assert.ok(routes.length >= 8, `only ${routes.length} role routes were read`);
  for (const e of routes.filter((r) => r.method !== 'GET' || r.path === '/:id/history')) {
    for (const role of ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN']) assert.equal(todayAllows(role, e), true, `${role} ${e.key}`);
    for (const role of ['BRANCH_MANAGER', 'OPS_MANAGER', 'CFO', 'CSR', 'AUDITOR', 'INTEGRATION_ADMIN']) assert.equal(todayAllows(role, e), false, `${role} ${e.key}`);
  }
});
