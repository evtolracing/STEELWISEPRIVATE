/**
 * The role and permission matrix: who passes a role check, what the branch picker and an
 * administrator's role preview may change, and what each role's menu offers.
 *
 * Each test here failed before the fix it guards:
 *   - roleAllowed: a branch or operations manager passed every role check (they were in ADMIN_ROLES,
 *     which requireRole let through everywhere), so they could delete logins and manage API keys.
 *   - requestView / previewWriteDenial: there was no branch picker or role preview on the server.
 *   - the screen matrix: a branch or operations manager had the super admin's menu ('*').
 *   - the dashboard: it offered a made-up role and branch list that changed nothing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { roleAllowed } from '../src/middleware/auth.js';
import { requestView, previewRoleFor, previewWriteDenial, SYSTEM_ADMIN_ROLES } from '../src/lib/viewScope.js';
import { apiRoleDenial, STAFF_GROUPS, INVOICE_READERS } from '../src/lib/roleAccess.js';
import { canAccessPath, sectionForPath, OPEN_TO_STAFF, ALL_ROLES } from '../../frontend/src/config/roleAccess.js';

const A = 'branch-a', B = 'branch-b', C = 'branch-c';
const frontend = (rel) => fileURLToPath(new URL(`../../frontend/src/${rel}`, import.meta.url));

// ── Server role checks ────────────────────────────────────────────────────────

test('only the system administrators pass a role check that does not name them', () => {
  for (const role of SYSTEM_ADMIN_ROLES) assert.equal(roleAllowed(role, ['SUPER_ADMIN']), true, role);
  for (const role of ['BRANCH_MANAGER', 'OPS_MANAGER', 'CFO', 'SALES_REP']) {
    assert.equal(roleAllowed(role, ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN']), false, `${role} must not delete logins or reset passwords`);
    assert.equal(roleAllowed(role, []), false, `${role} must not manage partner API keys or change /api/admin`);
  }
  assert.equal(roleAllowed('BRANCH_MANAGER', ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER']), true, 'named roles still pass');
  assert.equal(roleAllowed('ADMIN', []), true);
});

// ── Branch picker ─────────────────────────────────────────────────────────────

test('the branch picker narrows a login to one of its own branches and never widens it', () => {
  const csr = { role: 'CSR', homeLocationId: A, userLocations: [{ locationId: B }] };
  assert.deepEqual(requestView(csr, {}).branches.sort(), [A, B]);
  assert.deepEqual(requestView(csr, { branchId: B }).branches, [B]);
  assert.equal(requestView(csr, { branchId: B }).home, B, 'a new order is entered at the picked branch');
  assert.deepEqual(requestView(csr, { branchId: C }).branches.sort(), [A, B], 'a branch that is not theirs is ignored');
  assert.equal(requestView(csr, { branchId: C }).branchId, null);
  assert.deepEqual(requestView(csr, { branchId: "x' OR 1=1" }).branches.sort(), [A, B], 'only an id-shaped value is read');

  const admin = { role: 'SUPER_ADMIN', homeLocationId: null, userLocations: [] };
  assert.equal(requestView(admin, {}).branches, null, 'every branch');
  assert.deepEqual(requestView(admin, { branchId: C }).branches, [C], 'a head office login can look at one branch');

  const customer = { role: 'CUSTOMER_BUYER', customerId: 'c1' };
  assert.equal(requestView(customer, { branchId: A }).branches, null, 'customers are held by account, not branch');
  assert.equal(requestView(customer, { branchId: A }).branchId, null);
});

// ── Role preview ──────────────────────────────────────────────────────────────

test('only a system administrator may preview, only a role at or below their own, never a customer', () => {
  assert.equal(previewRoleFor('SUPER_ADMIN', 'sales_rep'), 'SALES_REP');
  assert.equal(previewRoleFor('ADMIN', 'BRANCH_MANAGER'), 'BRANCH_MANAGER');
  assert.equal(previewRoleFor('ADMIN', 'SUPER_ADMIN'), null, 'an admin cannot look as the super admin');
  assert.equal(previewRoleFor('SUPER_ADMIN', 'CUSTOMER_ADMIN'), null);
  assert.equal(previewRoleFor('SUPER_ADMIN', 'NOT_A_ROLE'), null);
  for (const role of ['BRANCH_MANAGER', 'OPS_MANAGER', 'CFO', 'SALES_REP', 'CUSTOMER_ADMIN']) {
    assert.equal(previewRoleFor(role, 'CSR'), null, `${role} cannot preview`);
    assert.equal(requestView({ role, homeLocationId: A }, { viewAs: 'SUPER_ADMIN' }).user.role, role, `${role} cannot raise itself`);
  }
});

test('a preview runs the request as the previewed role, held to a branch, and changes nothing', () => {
  const admin = { id: 'u1', role: 'SUPER_ADMIN', homeLocationId: A, userLocations: [] };
  const view = requestView(admin, { viewAs: 'SALES_REP', branchId: B });
  assert.equal(view.user.role, 'SALES_REP');
  assert.equal(view.user.id, 'u1');
  assert.equal(view.realRole, 'SUPER_ADMIN');
  assert.deepEqual(view.branches, [B]);
  // A sales rep is refused what a sales rep is refused.
  assert.ok(apiRoleDenial(view.user, '/api/executive/summary', 'GET'));
  assert.ok(apiRoleDenial(view.user, '/api/inventory/adjust', 'POST'));
  // With no branch picked, a branch-held preview shows the administrator's own branches.
  assert.deepEqual(requestView(admin, { viewAs: 'SALES_REP' }).branches, [A]);
  assert.equal(requestView(admin, { viewAs: 'CFO' }).branches, null, 'a head office role sees every branch');
  // View-only.
  assert.ok(previewWriteDenial(view, '/api/orders', 'POST'));
  assert.ok(previewWriteDenial(view, '/api/users/u2', 'DELETE'));
  assert.equal(previewWriteDenial(view, '/api/orders', 'GET'), null);
  assert.equal(previewWriteDenial(view, '/api/auth/logout-all', 'POST'), null, 'signing out still works');
  assert.equal(previewWriteDenial(requestView(admin, {}), '/api/orders', 'POST'), null, 'no preview, no refusal');
});

// ── What each role's screens offer (src/frontend/src/config/roleAccess.js) ──────

test('a branch or operations manager does not get the super admin menu', () => {
  for (const role of ['BRANCH_MANAGER', 'OPS_MANAGER']) {
    for (const page of ['/admin/partners', '/admin/integrations', '/admin/audit-log', '/admin/tax-rates', '/admin/catalog', '/admin/online-settings']) {
      assert.equal(canAccessPath(role, page), false, `${role} must not open ${page}`);
    }
    for (const page of ['/orders', '/inventory', '/schedule', '/shipping', '/qc', '/ops-cockpit', '/purchase-orders', '/admin/staff', '/executive/cockpit']) {
      assert.equal(canAccessPath(role, page), true, `${role} runs ${page}`);
    }
  }
  assert.equal(canAccessPath('BRANCH_MANAGER', '/admin/users'), true, 'manages the logins of their branch');
  assert.equal(canAccessPath('OPS_MANAGER', '/admin/users'), false);
  for (const role of ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN']) assert.equal(canAccessPath(role, '/admin/partners'), true, role);
});

test('each department sees its own areas, and the menus differ by role', () => {
  const nav = readFileSync(frontend('config/navigation.jsx'), 'utf8');
  const pages = [...nav.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
  const menu = (role) => pages.filter((p) => canAccessPath(role, p)).join(' ');
  const admin = menu('SUPER_ADMIN');
  for (const role of ['BRANCH_MANAGER', 'OPS_MANAGER', 'SALES_REP', 'OPERATOR_SAW', 'RECEIVING_CLERK', 'QC_INSPECTOR', 'CFO', 'INTEGRATION_ADMIN']) {
    assert.notEqual(menu(role), admin, `${role} must not have the super admin menu`);
  }
  assert.equal(canAccessPath('OPERATOR_SAW', '/orders/new'), true);
  assert.equal(canAccessPath('OPERATOR_SAW', '/customers'), false);
  assert.equal(canAccessPath('OPERATOR_SAW', '/purchase-orders'), false);
  assert.equal(canAccessPath('OPERATOR_SAW', '/ops-cockpit'), false);
  assert.equal(canAccessPath('SALES_REP', '/admin/users'), false);
  assert.equal(canAccessPath('BUYER', '/purchase-orders'), true);
  assert.equal(canAccessPath('PRODUCTION_MANAGER', '/admin/staff'), false, 'no admin page outside management');
  assert.equal(canAccessPath('PRODUCTION_MANAGER', '/ops-cockpit'), true);
  assert.equal(canAccessPath('INTEGRATION_ADMIN', '/admin/users'), false);
  assert.equal(canAccessPath(null, '/'), false, 'no role, no page');
});

test('the invoice pages are on the menu of exactly the roles the server lets read invoices', () => {
  for (const role of Object.values(STAFF_GROUPS).flat()) {
    assert.equal(canAccessPath(role, '/orders/invoices'), INVOICE_READERS.has(role), role);
  }
  assert.equal(canAccessPath('OPERATOR_SAW', '/orders/credit-holds'), false);
  assert.equal(canAccessPath('OPERATOR_SAW', '/orders'), true);
});

test('every page on the menu belongs to an area or is open to all staff on purpose', () => {
  const nav = readFileSync(frontend('config/navigation.jsx'), 'utf8');
  const pages = [...nav.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
  const loose = pages.filter((p) => !sectionForPath(p) && !OPEN_TO_STAFF.includes(p.replace(/^\/+/, '').split('/')[0]));
  assert.deepEqual(loose, [], 'add each new page to SECTION_PATHS or OPEN_TO_STAFF');
});

test('the screens and the server know the same staff roles', () => {
  const server = Object.values(STAFF_GROUPS).flat().sort();
  const screens = ALL_ROLES.filter((r) => !['CUSTOMER_ADMIN', 'CUSTOMER_BUYER', 'CUSTOMER_VIEWER', 'SUPPLIER_USER', 'CARRIER_USER'].includes(r)).sort();
  assert.deepEqual(screens, server);
});

test('the dashboard follows the login, not a list of made-up roles and branches', () => {
  const page = readFileSync(frontend('apps/dashboard/RoleDashboardPage.jsx'), 'utf8');
  const app = readFileSync(frontend('apps/dashboard/DashboardApp.jsx'), 'utf8');
  assert.doesNotMatch(page, /'FWA'|Fort Wayne|searchParams\.get\('role'\)/);
  assert.doesNotMatch(app, /RoleSwitcher|searchParams\.get\('role'\)/);
  assert.match(page, /useAuth\(\)/);
});

// ── Owner decisions of 2026-11-20 ─────────────────────────────────────────────

test('the inventory manager saves the web shop settings; the integration admin runs the partner API and integrations', async () => {
  const { adminAreaRoles } = await import('../src/middleware/apiGate.js');
  const may = (role, path) => roleAllowed(role, adminAreaRoles(path));
  for (const path of ['/api/admin/catalog/p1/visibility', '/api/admin/online-settings/rules']) {
    assert.equal(may('INVENTORY_MANAGER', path), true, path);
    assert.equal(may('BRANCH_MANAGER', path), false, path);
    assert.equal(may('INTEGRATION_ADMIN', path), false, path);
  }
  for (const path of ['/api/v1/admin/partners', '/api/v1/admin/partners/x/keys', '/api/admin/integrations/run']) {
    assert.equal(may('INTEGRATION_ADMIN', path), true, path);
    assert.equal(may('INVENTORY_MANAGER', path), false, path);
    assert.equal(may('OPS_MANAGER', path), false, path);
  }
  for (const path of ['/api/admin/seed-demo', '/api/admin/tax', '/api/admin/retention']) {
    assert.equal(may('INVENTORY_MANAGER', path), false, path);
    assert.equal(may('INTEGRATION_ADMIN', path), false, path);
    assert.equal(may('ADMIN', path), true, path);
  }
  // The screens offer the same.
  assert.equal(canAccessPath('INVENTORY_MANAGER', '/admin/catalog'), true);
  assert.equal(canAccessPath('INVENTORY_MANAGER', '/admin/online-settings'), true);
  assert.equal(canAccessPath('INTEGRATION_ADMIN', '/admin/partners'), true);
  assert.equal(canAccessPath('INTEGRATION_ADMIN', '/admin/integrations'), true);
  assert.equal(canAccessPath('INTEGRATION_ADMIN', '/admin/audit-log'), false);
  assert.equal(canAccessPath('INTEGRATION_ADMIN', '/admin/tax-rates'), false);
});
