// Role matrix, phase 5: rights that were decided by a role's name became boxes in the grid
// without a database update. A role saved before they existed keeps what its name gave it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ADDED_IN, addedSince, CATALOG_VERSION, PERMISSION_SET } from '../src/lib/permissionCatalog.js';
import { SENSITIVE } from '../src/lib/roleEditRules.js';
import { BUILTIN_DEFAULTS } from '../src/lib/builtinRoleDefaults.js';
import { accessOf, can, catalogMark, storedRole, toStore } from '../src/lib/roleStore.js';
import { COST_VIEWERS, MONEY_MANAGERS } from '../src/lib/roleAccess.js';
import { seedSql } from '../scripts/permission-defaults.js';

const NEW = Object.keys(ADDED_IN);
const row = (name, grants, more = {}) => ({ id: name, name, grants, isSystem: true, isActive: true, baseRole: name, ...more });

test('every permission added after the first catalog is a real permission with a version', () => {
  assert.equal(CATALOG_VERSION, 2);
  for (const p of NEW) { assert.ok(PERMISSION_SET.has(p), p); assert.ok(ADDED_IN[p] > 1 && ADDED_IN[p] <= CATALOG_VERSION, p); }
  assert.deepEqual(addedSince(1).sort(), [...NEW].sort());
  assert.deepEqual(addedSince(CATALOG_VERSION), []);
});

test('the rights over money, stock and pay are marked sensitive', () => {
  for (const p of ['sales:setListPrice', 'sales:approveOverride', 'customers:setCredit', 'orders:releaseCreditHold', 'inventory:adjust', 'staff:viewPay']) assert.ok(SENSITIVE.has(p), p);
});

test('database update 19 is untouched: its seed holds none of the later permissions', () => {
  const first = seedSql(1);
  for (const p of NEW) assert.ok(!first.includes(`"${p}"`), p);
  assert.ok(seedSql(CATALOG_VERSION).includes('"inventory:adjust"'));
  const dir = new URL('../prisma/migrations/', import.meta.url);
  const migration = fs.readdirSync(dir).find((d) => d.endsWith('_role_permission_matrix'));
  const sql = fs.readFileSync(new URL(`${migration}/migration.sql`, dir), 'utf8');
  for (const p of NEW) assert.ok(!sql.includes(`"${p}"`), p);
});

test('the defaults give each new right to exactly the roles whose names held it', () => {
  const holders = (p) => Object.keys(BUILTIN_DEFAULTS).filter((r) => BUILTIN_DEFAULTS[r].grants.includes(p)).sort();
  // The old lists by name, still in lib/roleAccess.js, are the reference.
  const named = (set) => Object.keys(BUILTIN_DEFAULTS).filter((r) => set.has(r) && !BUILTIN_DEFAULTS[r].grants.includes('*')).sort();
  for (const p of ['sales:setListPrice', 'sales:approveOverride', 'customers:setCredit', 'orders:releaseCreditHold']) assert.deepEqual(holders(p), named(MONEY_MANAGERS), p);
  assert.deepEqual(holders('sales:editProducts'), named(COST_VIEWERS));
  assert.deepEqual(holders('sales:editGrades'), named(new Set([...COST_VIEWERS, 'QC_MANAGER'])));
  for (const r of ['CSR', 'SALES_REP', 'OPERATOR', 'SHIPPING', 'VIEWER', 'CUSTOMER']) for (const p of NEW) assert.ok(!BUILTIN_DEFAULTS[r]?.grants.includes(p), `${r} ${p}`);
  assert.ok(holders('inventory:adjust').includes('INVENTORY_MANAGER'));
  assert.ok(holders('jobs:releaseQualityHold').includes('QC_MANAGER'));
  assert.ok(holders('staff:viewPay').includes('PRODUCTION_MANAGER'));
  assert.ok(holders('sales:editGrades').includes('QC_MANAGER') && !holders('sales:editProducts').includes('QC_MANAGER'));
});

test('a role saved before the new boxes existed keeps what its name gave it', () => {
  const old = BUILTIN_DEFAULTS.BRANCH_MANAGER.grants.filter((p) => !ADDED_IN[p]);
  const read = storedRole(row('BRANCH_MANAGER', old));
  assert.equal(read.catalogVersion, 1);
  for (const p of NEW) assert.equal(read.grants.includes(p), BUILTIN_DEFAULTS.BRANCH_MANAGER.grants.includes(p), p);
  assert.ok(read.grants.includes('customers:setCredit'));
});

test('a role that never had the right by name does not get it', () => {
  const read = storedRole(row('CSR', ['sales:view', 'customers:edit']));
  for (const p of NEW) assert.ok(!read.grants.includes(p), p);
  assert.deepEqual(read.grants, ['sales:view', 'customers:edit']);
});

test('once a role is saved under this catalog, an unticked box stays unticked', () => {
  const saved = toStore(BUILTIN_DEFAULTS.BRANCH_MANAGER.grants.filter((p) => p !== 'customers:setCredit'));
  assert.equal(saved.at(-1), catalogMark());
  const read = storedRole(row('BRANCH_MANAGER', saved));
  assert.equal(read.catalogVersion, CATALOG_VERSION);
  assert.ok(!read.grants.includes('customers:setCredit'));
  assert.ok(read.grants.includes('sales:setListPrice'));
});

test('the mark never reaches the grants the server works with, and is written once', () => {
  const read = storedRole(row('CSR', ['sales:view', '@catalog:2']));
  assert.deepEqual(read.grants, ['sales:view']);
  assert.deepEqual(toStore(toStore(['sales:view'])), ['sales:view', catalogMark()]);
  assert.ok(!PERMISSION_SET.has(catalogMark()));
});

test('a custom role stands on its built-in role; without one, on the plainest', () => {
  const onManager = storedRole(row('QA_X', ['orders:view'], { isSystem: false, baseRole: 'BRANCH_MANAGER' }));
  assert.ok(onManager.grants.includes('customers:setCredit'));
  const plain = storedRole(row('QA_Y', ['orders:view'], { isSystem: false, baseRole: null }));
  assert.deepEqual(plain.grants, ['orders:view']);
});

test('the roles that hold everything are left as they are', () => {
  assert.deepEqual(storedRole(row('SUPER_ADMIN', ['*'])).grants, ['*']);
  assert.equal(storedRole(null), null);
});

test('with the role table unread, a manager still holds the new rights and a clerk does not', () => {
  const req = (role) => ({ access: accessOf(role, {}) });
  assert.ok(can(req('BRANCH_MANAGER'), 'orders:releaseCreditHold'));
  assert.ok(!can(req('CSR'), 'orders:releaseCreditHold'));
  assert.ok(can(req('INVENTORY_MANAGER'), 'inventory:adjust') && !can(req('SHIPPING'), 'inventory:adjust'));
});

// ── View as for a custom role ──
import { customPreview, previewableCustom, requestView } from '../src/lib/viewScope.js';

const customRole = (name, grants, more = {}) => ({ id: name, name, displayName: name.toLowerCase(), grants, isSystem: false, isActive: true, audience: 'STAFF', baseRole: 'VIEWER', branchScope: 'ASSIGNED', ...more });
const ROLES = [
  customRole('QA_SMALL', ['orders:view']),
  customRole('QA_BOOKS', ['orders:view', 'finance:activate']),
  customRole('QA_OFF', ['orders:view'], { isActive: false }),
  customRole('QA_SHOP', ['ecommerce:view'], { audience: 'CUSTOMER' }),
  { ...customRole('CSR', ['orders:view']), isSystem: true },
];

test('only custom staff roles that are on and hold nothing the login lacks can be previewed', () => {
  const holdsOrders = (p) => p === 'orders:view';
  assert.deepEqual(previewableCustom(ROLES, holdsOrders).map((r) => r.name), ['QA_SMALL']);
  assert.deepEqual(previewableCustom(ROLES, () => true).map((r) => r.name), ['QA_SMALL', 'QA_BOOKS']);
  assert.deepEqual(previewableCustom(ROLES, () => false), []);
  assert.equal(customPreview(ROLES, holdsOrders, 'qa_small ').name, 'QA_SMALL');
  assert.equal(customPreview(ROLES, holdsOrders, 'QA_BOOKS'), null);
  assert.equal(customPreview(ROLES, () => true, 'QA_OFF'), null);
  assert.equal(customPreview(ROLES, () => true, 'CSR'), null);
  assert.equal(customPreview(ROLES, () => true, ''), null);
});

test('a previewed custom role: the login carries the role it stands on, and the branches follow the role', () => {
  const admin = { id: 'u', role: 'ADMIN', homeLocationId: 'A', userLocations: [{ locationId: 'B' }] };
  const picked = customPreview(ROLES, () => true, 'QA_SMALL');
  const view = requestView(admin, { viewAs: 'QA_SMALL' }, { mayPreview: true, customRole: picked });
  assert.equal(view.previewRole, 'QA_SMALL');
  assert.equal(view.user.role, 'VIEWER');
  assert.equal(view.realRole, 'ADMIN');
  assert.deepEqual([...view.branches].sort(), ['A', 'B']);
  const wide = requestView(admin, {}, { mayPreview: true, customRole: { ...picked, branchScope: 'ALL' } });
  assert.equal(wide.branches, null);
  // Without the right to preview, the custom role counts for nothing.
  const none = requestView({ ...admin, role: 'CSR' }, { viewAs: 'QA_SMALL' }, { mayPreview: false, customRole: picked });
  assert.equal(none.previewRole, null);
  assert.equal(none.user.role, 'CSR');
  // A customer login never previews.
  assert.equal(requestView({ id: 'c', role: 'CUSTOMER_BUYER' }, {}, { mayPreview: true, customRole: picked }).previewRole, null);
});

// ── The user list hides what only a login manager sees, by permission ──
import { forViewer } from '../src/routes/users.js';

test('the user list shows a login\'s private fields to whoever may edit logins, whatever their role is called', () => {
  const person = { id: 'p', email: 'p@x.test', role: 'CSR', firstName: 'P', lastName: 'Q' };
  const full = forViewer(person, { id: 'v', role: 'CSR' }, true);
  const less = forViewer(person, { id: 'v', role: 'ADMIN' }, false);
  assert.ok(Object.keys(full).length >= Object.keys(less).length);
  assert.deepEqual(forViewer(person, { id: 'p', role: 'CSR' }, false), forViewer(person, { id: 'x', role: 'CSR' }, true));
});
