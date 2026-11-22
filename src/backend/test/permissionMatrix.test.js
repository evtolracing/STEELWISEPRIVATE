// Phase 1 of the editable role matrix: the built-in roles are exactly today's rules.
//
// scripts/permission-defaults.js asks today's rules what each role may do and writes it down as a
// set of permissions. These tests then judge every role on every route and every menu page twice,
// once by today's rules and once by the permissions alone (lib/permissions.js), and the two must
// agree. They also hold the database update that fills the roles to the same answers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AREAS, PERMISSIONS, PERMISSION_SET, permissionFor } from '../src/lib/permissionCatalog.js';
import { apiDenial, branchesFor, effectiveGrants, has, pageAllowed } from '../src/lib/permissions.js';
import { branchesOf } from '../src/lib/branchScope.js';
import { EXTERNAL_ROLES, staffGroupOf } from '../src/lib/roleAccess.js';
import { acceptedDifferences, BUILTIN_ROLES, conflicts, ENDPOINTS, ENDPOINTS_BY_PERMISSION, ROLES, SEED_BEGIN, SEED_END, seedSql, todayAllows } from '../scripts/permission-defaults.js';
import { canAccessPath, sectionForPath, SECTION_PATHS, ALL_ROLES } from '../../frontend/src/config/roleAccess.js';

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const role = (name) => BUILTIN_ROLES.find((r) => r.name === name);
// The grid the rules give a role. The two top roles are stored as "everything"; a test below shows that is the same thing.
const subject = (r, extra = {}) => ({ audience: r.audience, grants: r.grants, customerId: 'cust-1', ...extra });
const OLD_NAMES = ['SALES', 'QUALITY', 'LOGISTICS', 'FINANCE', 'VIEWER'];

test('the catalog has no duplicate and no orphan: every permission is one a route, a page or a handler stands behind', () => {
  assert.equal(new Set(PERMISSIONS).size, PERMISSIONS.length);
  assert.equal(new Set(AREAS.map((a) => a.id)).size, AREAS.length);
  assert.deepEqual(conflicts, []);
  for (const a of AREAS.filter((x) => x.page)) assert.ok(SECTION_PATHS[a.page], `${a.id} names a menu area that does not exist: ${a.page}`);
  const pages = new Set(AREAS.map((a) => a.page).filter(Boolean));
  for (const section of Object.keys(SECTION_PATHS)) assert.ok(pages.has(section), `menu area ${section} has no permission`);
});

test('every route resolves to a permission in the catalog, or to none', () => {
  assert.ok(ENDPOINTS.length > 600, `only ${ENDPOINTS.length} routes were read`);
  for (const e of ENDPOINTS) {
    const key = permissionFor(e.url, e.method);
    if (key) assert.ok(PERMISSION_SET.has(key), `${e.key} needs ${key}, which is not in the catalog`);
  }
  assert.ok(Object.keys(ENDPOINTS_BY_PERMISSION).length >= 90);
});

test('there is a built-in role for every role name the database knows', () => {
  assert.deepEqual(BUILTIN_ROLES.map((r) => r.name), ROLES);
  for (const name of ALL_ROLES) assert.ok(role(name), `${name} is on the menu rules but has no built-in role`);
  for (const r of BUILTIN_ROLES) assert.equal(r.audience === 'STAFF', !EXTERNAL_ROLES.has(r.name), r.name);
});

test('every role on every route: the permissions answer as today\'s rules do', () => {
  let checked = 0;
  const differ = [];
  for (const r of BUILTIN_ROLES) {
    for (const e of ENDPOINTS) {
      checked += 1;
      const today = todayAllows(r.name, e, { role: r.name, customerId: 'cust-1' });
      const matrix = apiDenial(subject(r), e.url, e.method) === null;
      if (today !== matrix) differ.push(`${r.name} ${e.key}: today ${today ? 'allowed' : 'refused'}, matrix ${matrix ? 'allowed' : 'refused'}`);
    }
  }
  assert.ok(checked > 30000, `only ${checked} checks ran`);
  // The one difference, on purpose: five old role names lose invoice reading through the API (see acceptedDifferences).
  const expected = OLD_NAMES.flatMap((name) => ENDPOINTS.filter((e) => permissionFor(e.url, e.method) === 'billing:view').map((e) => `${name} ${e.key}: today allowed, matrix refused`));
  assert.deepEqual(differ.sort(), expected.sort());
  assert.equal(acceptedDifferences.length, OLD_NAMES.length);
  for (const name of OLD_NAMES) assert.equal(staffGroupOf(name), null, `${name} now has a department: remove it from the accepted difference`);
});

test('every role on every menu page: the permissions open what the menu opens today', () => {
  const nav = readFileSync(here('../../frontend/src/config/navigation.jsx'), 'utf8');
  const pages = [...new Set([...nav.matchAll(/path: '([^']+)'/g)].map((m) => m[1]).concat(Object.values(SECTION_PATHS).flat().map((p) => `/${p}`), ['/', '/safety', '/training', '/help', '/help/manual', '/role-dashboard']))];
  assert.ok(pages.length > 90, `only ${pages.length} pages were read`);
  let checked = 0;
  for (const r of BUILTIN_ROLES) {
    for (const page of pages) {
      checked += 1;
      assert.equal(pageAllowed(subject(r), sectionForPath(page), page), canAccessPath(r.name, page), `${r.name} ${page}`);
    }
  }
  assert.ok(checked > 4000);
});

test('every role sees the branches it sees today', () => {
  const user = (name) => ({ role: name, homeLocationId: 'b1', userLocations: [{ locationId: 'b2' }, { locationId: 'b1' }] });
  for (const r of BUILTIN_ROLES) assert.deepEqual(branchesFor(r.branchScope, user(r.name)), branchesOf(user(r.name)), r.name);
  assert.deepEqual(branchesFor('OWN', user('CSR')), ['b1']);
  assert.deepEqual(branchesFor('OWN', { role: 'CSR' }), []);
});

test('"everything" is exactly what the rules give the two top roles, and only them', () => {
  for (const name of ['SUPER_ADMIN', 'TENANT_OWNER']) {
    assert.deepEqual(role(name).grants, ['*']);
    assert.deepEqual(role(name).ruled, PERMISSIONS, name);
  }
  for (const r of BUILTIN_ROLES.filter((x) => !['SUPER_ADMIN', 'TENANT_OWNER'].includes(x.name))) assert.ok(!r.grants.includes('*'), r.name);
  // An administrator has everything except starting and stopping the books (routes/ledger.js), and adding
  // or removing a location, which is for the two top roles (owner, 2026-11-22). It may change a location's details.
  assert.deepEqual(PERMISSIONS.filter((p) => !role('ADMIN').grants.includes(p)), ['finance:activate', 'locations:add', 'locations:remove']);
  assert.ok(role('ADMIN').grants.includes('locations:edit'));
  for (const p of ['locations:add', 'locations:edit', 'locations:remove']) {
    assert.deepEqual(BUILTIN_ROLES.filter((r) => has(r.grants, p)).map((r) => r.name).sort(), p === 'locations:edit' ? ['ADMIN', 'SUPER_ADMIN', 'TENANT_OWNER'] : ['SUPER_ADMIN', 'TENANT_OWNER'], p);
  }
  // Who may edit roles (owner, 2026-11-20): super admin, tenant owner and admin. Nobody else.
  assert.deepEqual(BUILTIN_ROLES.filter((r) => has(r.grants, 'roles:edit')).map((r) => r.name).sort(), ['ADMIN', 'SUPER_ADMIN', 'TENANT_OWNER']);
});

test('a permission decides: taking one away refuses the request, giving one allows it', () => {
  const csr = role('CSR');
  assert.equal(apiDenial(subject(csr), '/api/orders/o1', 'PUT'), null);
  assert.ok(apiDenial(subject(csr, { grants: csr.grants.filter((g) => g !== 'orders:edit') }), '/api/orders/o1', 'PUT'));
  assert.ok(apiDenial(subject(csr), '/api/invoices/i1/refund', 'POST'));
  assert.equal(apiDenial(subject(csr, { grants: [...csr.grants, 'billing:credit'] }), '/api/invoices/i1/refund', 'POST'), null);
  assert.ok(apiDenial(subject(role('OPERATOR_SAW')), '/api/invoices', 'GET'));
  assert.equal(pageAllowed(subject(csr), 'executive'), false);
  assert.equal(pageAllowed(subject(csr, { grants: ['executive:view'] }), 'executive'), true);
  // A customer login is held to the store whatever it is given.
  assert.ok(apiDenial({ audience: 'CUSTOMER', grants: ['*'], customerId: 'cust-1' }, '/api/orders', 'GET'));
  assert.equal(apiDenial({ audience: 'CUSTOMER', grants: [], customerId: 'cust-1' }, '/api/ecom/catalog', 'GET'), null);
  assert.ok(apiDenial({ audience: 'CUSTOMER', grants: [], customerId: 'cust-1' }, '/api/customers/cust-2/preferences', 'GET'));
});

test('what a login may do is its roles, plus what it was granted, minus what it was denied', () => {
  const now = new Date('2026-11-20T00:00:00Z');
  const a = { grants: ['orders:view', 'orders:edit'] };
  const b = { grants: ['quality:view', 'not:a-permission'] };
  assert.deepEqual([...effectiveGrants([a, b], [], now)].sort(), ['orders:edit', 'orders:view', 'quality:view']);
  assert.deepEqual([...effectiveGrants([a, { ...b, isActive: false }], [], now)].sort(), ['orders:edit', 'orders:view']);
  assert.deepEqual([...effectiveGrants([a, { ...b, expiresAt: '2026-11-19T00:00:00Z' }], [], now)].sort(), ['orders:edit', 'orders:view']);
  const grant = { permission: 'billing:credit', effect: 'GRANT' };
  const deny = { permission: 'orders:edit', effect: 'DENY' };
  assert.deepEqual([...effectiveGrants([a], [grant, deny], now)].sort(), ['billing:credit', 'orders:view']);
  // A denial beats a grant from any role, and an exception that has ended counts for nothing.
  assert.ok(!effectiveGrants([a, { grants: ['orders:edit'] }], [deny], now).has('orders:edit'));
  assert.ok(effectiveGrants([a], [{ ...deny, expiresAt: '2026-11-01T00:00:00Z' }], now).has('orders:edit'));
  assert.ok(!effectiveGrants([a], [{ ...grant, expiresAt: '2026-11-01T00:00:00Z' }], now).has('billing:credit'));
  assert.ok(!effectiveGrants([a], [{ permission: 'made:up', effect: 'GRANT' }], now).has('made:up'));
  // Even "everything" loses what is denied, and keeps the rest.
  const all = effectiveGrants([{ grants: ['*'] }], [deny], now);
  assert.ok(!has(all, 'orders:edit'));
  assert.ok(has(all, 'orders:view') && has(all, 'finance:activate'));
  assert.equal(all.size, PERMISSIONS.length - 1);
});

test('the newest database update that fills the built-in roles matches today\'s rules', () => {
  const dir = here('../prisma/migrations');
  const withSeed = readdirSync(dir).filter((name) => !name.endsWith('.toml')).sort().reverse()
    .map((name) => readFileSync(`${dir}/${name}/migration.sql`, 'utf8')).find((sql) => sql.includes(SEED_BEGIN));
  assert.ok(withSeed, 'no database update fills the built-in roles');
  const block = withSeed.slice(withSeed.indexOf(SEED_BEGIN), withSeed.indexOf(SEED_END) + SEED_END.length);
  assert.equal(block, seedSql(), 'Today\'s rules changed. Add a database update with the output of: node scripts/permission-defaults.js');
});
