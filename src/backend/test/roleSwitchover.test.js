// Role matrix, phase 3: the running server decides from each role's saved permissions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { accessOf, can, grantList } from '../src/lib/roleStore.js';
import { BUILTIN_DEFAULTS } from '../src/lib/builtinRoleDefaults.js';
import { PERMISSIONS } from '../src/lib/permissionCatalog.js';
import { apiDenial } from '../src/lib/permissions.js';
import { branchesOf, ALL_BRANCH_ROLES } from '../src/lib/branchScope.js';
import { previewRoleFor, requestView } from '../src/lib/viewScope.js';
import { requireRole } from '../src/middleware/auth.js';
import { BUILTIN_ROLES, ENDPOINTS, todayAllows } from '../scripts/permission-defaults.js';

const saved = (name, change) => ({ [name]: { name, grants: BUILTIN_DEFAULTS[name].grants, branchScope: BUILTIN_DEFAULTS[name].branchScope, ...change } });
const answer = () => { const res = { code: 200, status(c) { this.code = c; return this; }, json() { return this; } }; return res; };
const ask = (guard, req) => { const res = answer(); let passed = false; guard(req, res, () => { passed = true; }); return passed ? 200 : res.code; };

test('with nothing saved, every role has exactly its built-in default', () => {
  for (const r of BUILTIN_ROLES) {
    const a = accessOf(r.name);
    assert.deepEqual([...a.grants], r.grants, r.name);
    assert.equal(a.audience, r.audience);
    assert.equal(a.branchScope, r.branchScope);
    assert.equal(a.fromDatabase, false);
  }
});

test('the access a request carries answers every route as today\'s rules do', () => {
  // The same proof as permissionMatrix.test.js, through the object the server attaches to a request.
  const old = new Set(['SALES', 'QUALITY', 'LOGISTICS', 'FINANCE', 'VIEWER']);
  let checked = 0;
  for (const r of BUILTIN_ROLES.filter((x) => !old.has(x.name))) {
    const access = { ...accessOf(r.name), customerId: 'cust-1' };
    for (const e of ENDPOINTS) {
      checked += 1;
      assert.equal(apiDenial(access, e.url, e.method) === null, todayAllows(r.name, e, { role: r.name, customerId: 'cust-1' }), `${r.name} ${e.key}`);
    }
  }
  assert.ok(checked > 25000);
});

test('what is saved for a role decides, in both directions', () => {
  const less = accessOf('CSR', saved('CSR', { grants: BUILTIN_DEFAULTS.CSR.grants.filter((g) => g !== 'orders:edit') }));
  assert.equal(less.fromDatabase, true);
  assert.ok(apiDenial(less, '/api/orders/o1', 'PUT'));
  assert.equal(apiDenial(less, '/api/orders', 'POST'), null);
  const more = accessOf('CSR', saved('CSR', { grants: [...BUILTIN_DEFAULTS.CSR.grants, 'billing:credit', 'executive:view'] }));
  assert.equal(apiDenial(more, '/api/invoices/i1/refund', 'POST'), null);
  assert.equal(apiDenial(more, '/api/executive/summary', 'GET'), null);
  assert.ok(apiDenial(accessOf('CSR'), '/api/executive/summary', 'GET'));
});

test('the two top roles hold everything whatever is saved, and a saved row cannot change who is staff', () => {
  for (const name of ['SUPER_ADMIN', 'TENANT_OWNER']) {
    const a = accessOf(name, saved(name, { grants: [], branchScope: 'OWN' }));
    assert.deepEqual([...a.grants], ['*']);
    assert.equal(a.branchScope, 'ALL');
    assert.deepEqual(grantList(a), PERMISSIONS);
  }
  const buyer = accessOf('CUSTOMER_BUYER', { CUSTOMER_BUYER: { name: 'CUSTOMER_BUYER', grants: ['*', 'orders:view'], branchScope: 'ALL', audience: 'STAFF' } });
  assert.equal(buyer.audience, 'CUSTOMER');
  assert.ok(apiDenial({ ...buyer, customerId: 'c1' }, '/api/orders', 'GET'));
});

test('a role the database does not describe, or describes badly, keeps its default; an unknown role gets nothing', () => {
  assert.deepEqual([...accessOf('CSR', { CSR: { name: 'CSR', grants: 'everything' } }).grants], BUILTIN_DEFAULTS.CSR.grants);
  assert.deepEqual([...accessOf('CSR', {}).grants], BUILTIN_DEFAULTS.CSR.grants);
  const unknown = accessOf('NOT_A_ROLE');
  assert.equal(unknown.grants.size, 0);
  assert.ok(apiDenial(unknown, '/api/orders', 'POST'));
});

test('a role check inside a route goes by the permission, and by the named roles where there is none', () => {
  const req = (role, access, method, url) => ({ user: { role }, access, method, originalUrl: url });
  const guard = requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN');
  // DELETE /api/users/:id needs adminUsers:delete. By default only system administrators hold it.
  assert.equal(ask(guard, req('ADMIN', accessOf('ADMIN'), 'DELETE', '/api/users/u1')), 200);
  assert.equal(ask(guard, req('BRANCH_MANAGER', accessOf('BRANCH_MANAGER'), 'DELETE', '/api/users/u1')), 403);
  const given = accessOf('BRANCH_MANAGER', saved('BRANCH_MANAGER', { grants: [...BUILTIN_DEFAULTS.BRANCH_MANAGER.grants, 'adminUsers:delete'] }));
  assert.equal(ask(guard, req('BRANCH_MANAGER', given, 'DELETE', '/api/users/u1?x=1')), 200);
  const taken = accessOf('ADMIN', saved('ADMIN', { grants: BUILTIN_DEFAULTS.ADMIN.grants.filter((g) => g !== 'adminUsers:delete') }));
  assert.equal(ask(guard, req('ADMIN', taken, 'DELETE', '/api/users/u1/')), 403);
  // No permission is named for this address: the listed roles decide, as before.
  assert.equal(ask(requireRole('SUPER_ADMIN', 'TENANT_OWNER'), req('ADMIN', accessOf('ADMIN'), 'POST', '/api/auth/register')), 200);
  assert.equal(ask(requireRole('SUPER_ADMIN', 'TENANT_OWNER'), req('CSR', accessOf('CSR'), 'POST', '/api/auth/register')), 403);
  // A request with no access attached is judged by the listed roles.
  assert.equal(ask(guard, { user: { role: 'CSR' }, method: 'DELETE', originalUrl: '/api/users/u1' }), 403);
  assert.equal(ask(guard, { method: 'DELETE', originalUrl: '/api/users/u1' }), 401);
});

test('can() never opens up when a request carries no access', () => {
  assert.equal(can({ user: { role: 'CSR' } }, 'inventory:viewCost'), false);
  assert.equal(can({ user: { role: 'BUYER' } }, 'inventory:viewCost'), true);
  assert.equal(can({}, 'inventory:viewCost'), false);
  assert.equal(can({ user: { role: 'CSR' }, access: accessOf('CSR', saved('CSR', { grants: ['inventory:viewCost'] })) }, 'inventory:viewCost'), true);
});

test('branch reach follows the role\'s saved reach, and the role\'s name where none is attached', () => {
  const login = (role, branchScope) => ({ role, branchScope, homeLocationId: 'b1', userLocations: [{ locationId: 'b2' }] });
  assert.equal(branchesOf(login('CSR', 'ALL')), null);
  assert.deepEqual(branchesOf(login('CSR', 'ASSIGNED')).sort(), ['b1', 'b2']);
  assert.deepEqual(branchesOf(login('CSR', 'OWN')), ['b1']);
  assert.deepEqual(branchesOf(login('CFO', 'OWN')), ['b1'], 'a role held to its home branch is held there whatever its name');
  assert.equal(branchesOf(login('CFO', undefined)), null);
  assert.equal(branchesOf(login('CUSTOMER_BUYER', 'OWN')), null, 'a customer login is held to its account, not to a branch');
  for (const r of BUILTIN_ROLES.filter((x) => x.audience === 'STAFF')) assert.equal(accessOf(r.name).branchScope === 'ALL', ALL_BRANCH_ROLES.has(r.name), r.name);
});

test('previewing follows the permission, and a preview shows the previewed role\'s branches', () => {
  assert.equal(previewRoleFor('ADMIN', 'CSR'), 'CSR');
  assert.equal(previewRoleFor('ADMIN', 'CSR', false), null);
  assert.equal(previewRoleFor('BRANCH_MANAGER', 'CSR', true), 'CSR');
  assert.equal(previewRoleFor('BRANCH_MANAGER', 'SUPER_ADMIN', true), null, 'never a role above their own');
  const admin = { role: 'ADMIN', branchScope: 'ALL', homeLocationId: 'b1', userLocations: [] };
  assert.deepEqual(requestView(admin, { viewAs: 'CSR' }, { seesEveryBranch: () => false, mayPreview: true }).branches, ['b1']);
  assert.equal(requestView(admin, { viewAs: 'CSR' }, { seesEveryBranch: () => true, mayPreview: true }).branches, null);
  assert.equal(requestView(admin, { viewAs: 'CSR' }, { mayPreview: false }).previewRole, null);
});
