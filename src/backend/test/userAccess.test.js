// Role matrix, phase 4: one person's access from their main role, extra roles and personal exceptions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveAccess, baseOf } from '../src/lib/userAccess.js';
import { accessChangeDenial, roleGiftDenial, MOST_EXCEPTIONS } from '../src/lib/userAccessRules.js';
import { accessOf } from '../src/lib/roleStore.js';
import { BUILTIN_DEFAULTS } from '../src/lib/builtinRoleDefaults.js';
import { apiDenial } from '../src/lib/permissions.js';
import { roleChangeDenial } from '../src/lib/roleEditRules.js';

const NOW = Date.parse('2026-11-20T12:00:00Z');
const later = '2026-12-01T00:00:00Z';
const past = '2026-11-01T00:00:00Z';
const builtin = (name) => ({ id: `id-${name}`, name, displayName: name, grants: BUILTIN_DEFAULTS[name].grants, branchScope: BUILTIN_DEFAULTS[name].branchScope, audience: BUILTIN_DEFAULTS[name].audience, baseRole: name, isSystem: true, isActive: true });
const made = (name, grants, more = {}) => ({ id: `id-${name}`, name, displayName: name, grants, branchScope: 'OWN', audience: 'STAFF', baseRole: 'VIEWER', isSystem: false, isActive: true, ...more });
const rolesOf = (...rows) => ({ byName: Object.fromEntries(rows.filter((r) => r.isSystem).map((r) => [r.name, r])), byId: Object.fromEntries(rows.map((r) => [r.id, r])) });
const NIGHT = made('NIGHT_LEAD', ['orders:view', 'inventory:view', 'general:view']);
const COSTS = made('COST_READER', ['inventory:viewCost', 'finance:view'], { branchScope: 'ALL' });
const every = rolesOf(...Object.keys(BUILTIN_DEFAULTS).map(builtin), NIGHT, COSTS);
const list = (a) => [...a.grants].sort();

test('with nothing set on a person, their access is their role\'s, for every built-in role', () => {
  for (const name of Object.keys(BUILTIN_DEFAULTS)) {
    const a = effectiveAccess(name, every, { primaryRoleId: null, extras: [], overrides: [] }, NOW);
    assert.deepEqual(list(a), [...accessOf(name, every.byName).grants].sort(), name);
    assert.equal(a.branchScope, accessOf(name).branchScope, name);
    assert.equal(a.primary.custom, false);
  }
  assert.deepEqual(list(effectiveAccess('CSR', {}, undefined, NOW)), [...BUILTIN_DEFAULTS.CSR.grants].sort(), 'nothing readable: the built-in default');
});

test('extra roles add their permissions and the widest branch reach', () => {
  const a = effectiveAccess('CSR', every, { extras: [{ roleId: COSTS.id, expiresAt: null }] }, NOW);
  assert.ok(a.grants.has('inventory:viewCost') && a.grants.has('orders:edit'));
  assert.equal(a.branchScope, 'ALL');
  assert.deepEqual(a.sources['inventory:viewCost'], ['COST_READER']);
  assert.equal(apiDenial(a, '/api/ledger/status', 'GET'), null);
  assert.ok(apiDenial(effectiveAccess('CSR', every, {}, NOW), '/api/ledger/status', 'GET'));
  const both = effectiveAccess('CSR', every, { extras: [{ roleId: 'id-QC_INSPECTOR' }] }, NOW);
  assert.ok(both.grants.has('quality:edit'));
  assert.deepEqual(both.sources['general:view'], ['CSR', 'QC_INSPECTOR']);
});

test('an extra role past its end date, switched off, locked or for customers counts for nothing', () => {
  const none = [...BUILTIN_DEFAULTS.CSR.grants].sort();
  assert.deepEqual(list(effectiveAccess('CSR', every, { extras: [{ roleId: COSTS.id, expiresAt: past }] }, NOW)), none);
  assert.ok(effectiveAccess('CSR', every, { extras: [{ roleId: COSTS.id, expiresAt: later }] }, NOW).grants.has('finance:view'));
  assert.deepEqual(list(effectiveAccess('CSR', rolesOf(builtin('CSR'), { ...COSTS, isActive: false }), { extras: [{ roleId: COSTS.id }] }, NOW)), none);
  assert.deepEqual(list(effectiveAccess('CSR', every, { extras: [{ roleId: 'id-SUPER_ADMIN' }, { roleId: 'id-TENANT_OWNER' }, { roleId: 'id-CUSTOMER_ADMIN' }, { roleId: 'gone' }] }, NOW)), none);
  assert.deepEqual(list(effectiveAccess('CSR', rolesOf(builtin('CSR'), made('ALL_OF_IT', ['*', 'made:up', 'finance:view'])), { extras: [{ roleId: 'id-ALL_OF_IT' }] }, NOW)), [...none, 'finance:view'].sort(), 'a custom role never carries "everything" or a made-up permission');
});

test('a denial always wins; a grant adds; an exception past its end date does nothing', () => {
  const a = effectiveAccess('CSR', every, { extras: [{ roleId: COSTS.id }], overrides: [
    { permission: 'inventory:viewCost', effect: 'DENY', reason: 'New starter' },
    { permission: 'orders:edit', effect: 'DENY', reason: 'Read only for now' },
    { permission: 'executive:view', effect: 'GRANT', reason: 'Covers for the manager' },
    { permission: 'billing:credit', effect: 'GRANT', reason: 'old', expiresAt: past },
    { permission: 'orders:view', effect: 'DENY', reason: 'old', expiresAt: past },
    { permission: 'made:up', effect: 'GRANT', reason: 'x' },
  ] }, NOW);
  assert.equal(a.grants.has('inventory:viewCost'), false, 'denied although an extra role gives it');
  assert.equal(a.grants.has('orders:edit'), false, 'denied although the main role gives it');
  assert.ok(a.grants.has('executive:view') && a.grants.has('orders:view') && a.grants.has('finance:view'));
  assert.equal(a.grants.has('billing:credit'), false);
  assert.equal(a.grants.has('made:up'), false);
  assert.equal(a.denied['orders:edit'], 'Read only for now');
  assert.deepEqual(a.sources['executive:view'], ['Exception']);
  const same = effectiveAccess('CSR', every, { overrides: [{ permission: 'executive:view', effect: 'GRANT', reason: 'a' }, { permission: 'executive:view', effect: 'DENY', reason: 'b' }] }, NOW);
  assert.equal(same.grants.has('executive:view'), false, 'given and denied: denied');
});

test('a custom main role replaces the built-in permissions, only while it stands on the login\'s role', () => {
  const a = effectiveAccess('VIEWER', every, { primaryRoleId: NIGHT.id }, NOW);
  assert.deepEqual(list(a), ['general:view', 'inventory:view', 'orders:view']);
  assert.equal(a.branchScope, 'OWN');
  assert.deepEqual(a.primary, { id: NIGHT.id, name: 'NIGHT_LEAD', displayName: 'NIGHT_LEAD', custom: true });
  // The login's role was changed since: the custom role no longer counts.
  assert.deepEqual(list(effectiveAccess('CSR', every, { primaryRoleId: NIGHT.id }, NOW)), [...BUILTIN_DEFAULTS.CSR.grants].sort());
  assert.deepEqual(list(effectiveAccess('VIEWER', rolesOf(builtin('VIEWER'), { ...NIGHT, isActive: false }), { primaryRoleId: NIGHT.id }, NOW)), [...BUILTIN_DEFAULTS.VIEWER.grants].sort());
  assert.deepEqual(list(effectiveAccess('VIEWER', every, { primaryRoleId: 'id-ADMIN' }, NOW)), [...BUILTIN_DEFAULTS.VIEWER.grants].sort(), 'a built-in role is never a custom main role');
  assert.equal(baseOf({ baseRole: null }), 'VIEWER');
  assert.equal(baseOf({ baseRole: 'CSR' }), 'CSR');
});

test('super admin, tenant owner and customer logins: nothing set on the person changes anything', () => {
  const facts = { primaryRoleId: NIGHT.id, extras: [{ roleId: COSTS.id }], overrides: [{ permission: 'orders:view', effect: 'DENY', reason: 'x' }, { permission: 'finance:view', effect: 'GRANT', reason: 'x' }] };
  for (const name of ['SUPER_ADMIN', 'TENANT_OWNER']) assert.deepEqual(list(effectiveAccess(name, every, facts, NOW)), ['*']);
  const buyer = effectiveAccess('CUSTOMER_BUYER', every, facts, NOW);
  assert.deepEqual(list(buyer), [...BUILTIN_DEFAULTS.CUSTOMER_BUYER.grants].sort());
  assert.equal(buyer.audience, 'CUSTOMER');
});

const admin = { id: 'a1', grants: new Set(BUILTIN_DEFAULTS.ADMIN.grants) };
const manager = { id: 'm1', grants: new Set(BUILTIN_DEFAULTS.BRANCH_MANAGER.grants) };
const clerk = { id: 'u1', role: 'CSR', audience: 'STAFF', extraIds: [], exceptions: [] };

test('nobody gives a role that holds more than they do, a locked role, a customer role or one switched off', () => {
  assert.equal(roleGiftDenial(admin, NIGHT), null);
  assert.match(roleGiftDenial(manager, builtin('ADMIN')), /holds what you do not/);
  assert.match(roleGiftDenial(admin, made('BOOKS', ['finance:activate'])), /holds what you do not/);
  assert.match(roleGiftDenial(admin, builtin('SUPER_ADMIN')), /not given on top/);
  assert.match(roleGiftDenial({ id: 'x', grants: new Set(['*']) }, builtin('TENANT_OWNER')), /not given on top/);
  assert.match(roleGiftDenial(admin, builtin('CUSTOMER_ADMIN')), /customer or partner/);
  assert.match(roleGiftDenial(admin, { ...NIGHT, isActive: false }), /switched off/);
  assert.match(roleGiftDenial(admin, null), /does not exist/);
  assert.match(accessChangeDenial(manager, clerk, { extras: [{ role: builtin('ADMIN') }] }, {}, NOW), /holds what you do not/);
  assert.equal(accessChangeDenial(manager, { ...clerk, extraIds: ['id-ADMIN'] }, { extras: [{ role: builtin('ADMIN') }] }, {}, NOW), null, 'a role the person already holds may stay');
  assert.match(accessChangeDenial(admin, clerk, { primary: made('BOOKS', ['finance:activate']) }, {}, NOW), /holds what you do not/);
  assert.match(accessChangeDenial(admin, clerk, { primary: builtin('CSR') }, {}, NOW), /Role box/);
  assert.match(accessChangeDenial(admin, clerk, { primary: NIGHT, extras: [{ role: made('BOOKS', ['finance:activate']), expiresAt: later }] }, {}, NOW), /holds what you do not/);
  assert.equal(accessChangeDenial({ id: 'o', grants: new Set(['*']) }, clerk, { primary: NIGHT, extras: [{ role: COSTS, expiresAt: later }] }, {}, NOW), null);
});

test('who and what: not yourself, not the locked logins, not customers, end dates in the future', () => {
  assert.match(accessChangeDenial(admin, { ...clerk, id: 'a1' }, { extras: [] }, {}, NOW), /your own/);
  assert.match(accessChangeDenial(admin, { ...clerk, role: 'SUPER_ADMIN' }, { extras: [{ role: NIGHT }] }, {}, NOW), /holds everything already/);
  assert.equal(accessChangeDenial(admin, { ...clerk, role: 'SUPER_ADMIN' }, { extras: [], exceptions: [], primary: null }, {}, NOW), null, 'clearing is allowed');
  assert.match(accessChangeDenial(admin, { ...clerk, role: 'CUSTOMER_BUYER', audience: 'CUSTOMER' }, { extras: [{ role: NIGHT }] }, {}, NOW), /customer or partner login/);
  assert.match(accessChangeDenial(admin, clerk, { extras: [{ role: NIGHT, expiresAt: past }] }, {}, NOW), /future/);
  assert.match(accessChangeDenial(admin, clerk, { extras: [{ role: NIGHT, expiresAt: 'soon' }] }, {}, NOW), /future/);
  assert.match(accessChangeDenial(admin, clerk, { extras: [{ role: NIGHT }, { role: NIGHT }] }, {}, NOW), /twice/);
  assert.match(accessChangeDenial(admin, clerk, { extras: [{ role: null }] }, {}, NOW), /does not exist/);
  assert.equal(accessChangeDenial(admin, clerk, {}, { editorsAfter: 0 }, NOW), null, 'nothing changed, nothing judged');
});

test('exceptions: need role editing, a reason, a real permission, and nothing the giver lacks', () => {
  const ex = (more) => ({ exceptions: [{ permission: 'orders:edit', effect: 'DENY', reason: 'Training', ...more }] });
  assert.equal(accessChangeDenial(admin, clerk, ex(), {}, NOW), null);
  assert.match(accessChangeDenial(manager, clerk, ex(), {}, NOW), /right to edit roles/);
  assert.match(accessChangeDenial(admin, clerk, ex({ reason: '  ' }), {}, NOW), /Say why/);
  assert.match(accessChangeDenial(admin, clerk, ex({ reason: 'x'.repeat(301) }), {}, NOW), /under 300/);
  assert.match(accessChangeDenial(admin, clerk, ex({ permission: 'orders:fly' }), {}, NOW), /Not a permission/);
  assert.match(accessChangeDenial(admin, clerk, ex({ permission: '*' }), {}, NOW), /Not a permission/);
  assert.match(accessChangeDenial(admin, clerk, ex({ effect: 'MAYBE' }), {}, NOW), /gives or takes away/);
  assert.match(accessChangeDenial(admin, clerk, ex({ expiresAt: past }), {}, NOW), /future/);
  assert.match(accessChangeDenial(admin, clerk, ex({ permission: 'finance:activate', effect: 'GRANT' }), {}, NOW), /do not hold/);
  assert.equal(accessChangeDenial(admin, clerk, ex({ permission: 'finance:activate', effect: 'DENY' }), {}, NOW), null, 'taking away needs no holding');
  assert.equal(accessChangeDenial(admin, { ...clerk, exceptions: [{ permission: 'finance:activate', effect: 'GRANT' }] }, ex({ permission: 'finance:activate', effect: 'GRANT' }), {}, NOW), null, 'one already given may stay');
  assert.match(accessChangeDenial(admin, clerk, { exceptions: [ex().exceptions[0], ex().exceptions[0]] }, {}, NOW), /twice/);
  assert.match(accessChangeDenial(admin, clerk, { exceptions: Array.from({ length: MOST_EXCEPTIONS + 1 }, () => ex().exceptions[0]) }, {}, NOW), /At most/);
  assert.match(accessChangeDenial(admin, clerk, { exceptions: 'all' }, {}, NOW), /list/);
});

test('a change may not leave nobody who can edit roles', () => {
  const change = { exceptions: [{ permission: 'roles:edit', effect: 'DENY', reason: 'Leaving' }] };
  assert.match(accessChangeDenial(admin, { ...clerk, role: 'ADMIN' }, change, { editorsAfter: 0 }, NOW), /nobody who can edit roles/);
  assert.equal(accessChangeDenial(admin, { ...clerk, role: 'ADMIN' }, change, { editorsAfter: 1 }, NOW), null);
});

test('the role editor knows a person\'s custom main role as their own role', () => {
  const actor = { id: 'a1', role: 'VIEWER', mainRoleId: 'id-LEADS', grants: ['roles:edit', 'admin:view', 'orders:view'] };
  const own = { id: 'id-LEADS', name: 'LEADS', displayName: 'Leads', grants: ['roles:edit', 'admin:view', 'orders:view'], audience: 'STAFF', isSystem: false };
  assert.match(roleChangeDenial(actor, own, { grants: ['admin:view', 'orders:view'] }, { editorsAfter: 3 }), /your own role/);
  assert.match(roleChangeDenial(actor, own, { grants: ['roles:edit', 'orders:view'] }), /lose this screen/);
  assert.equal(roleChangeDenial(actor, { ...own, id: 'id-OTHER' }, { grants: ['admin:view', 'orders:view'] }, { editorsAfter: 3 }), null);
});
