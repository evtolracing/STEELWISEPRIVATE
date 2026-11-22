import test from 'node:test';
import assert from 'node:assert/strict';
import { userChangeDenial, visibleUsersWhere } from '../src/lib/userAdminRules.js';

const A = 'branch-a', B = 'branch-b';
const superAdmin = { id: 's', role: 'SUPER_ADMIN' };
const admin = { id: 'a', role: 'ADMIN' };
const manager = { id: 'm', role: 'BRANCH_MANAGER', homeLocationId: A, userLocations: [] };
const clerk = { id: 'c', role: 'CSR', homeLocationId: A, userLocations: [] };
const clerkB = { id: 'd', role: 'CSR', homeLocationId: B, userLocations: [] };

test('a super admin may do anything', () => {
  assert.equal(userChangeDenial(superAdmin, null, { role: 'SUPER_ADMIN' }), null);
  assert.equal(userChangeDenial(superAdmin, admin, { role: 'TENANT_OWNER', locationIds: [B] }), null);
});

test('an admin cannot make or change a super admin or tenant owner', () => {
  assert.ok(userChangeDenial(admin, null, { role: 'SUPER_ADMIN' }));
  assert.ok(userChangeDenial(admin, clerk, { role: 'TENANT_OWNER' }));
  assert.ok(userChangeDenial(admin, superAdmin, {}), 'not even to reset the password or deactivate');
  assert.equal(userChangeDenial(admin, clerk, { role: 'OPS_MANAGER', homeLocationId: B }), null);
});

test('a branch manager cannot grant a role above the branch', () => {
  for (const role of ['SUPER_ADMIN', 'ADMIN', 'CFO', 'OPS_MANAGER', 'AUDITOR', 'BRANCH_MANAGER']) {
    assert.ok(userChangeDenial(manager, null, { role, homeLocationId: A }), role);
    assert.ok(userChangeDenial(manager, clerk, { role }), role);
  }
  assert.ok(userChangeDenial(manager, clerk, { roleIds: ['custom-role'] }));
});

test('a branch manager cannot change their own role or branches', () => {
  assert.ok(userChangeDenial(manager, manager, { role: 'SUPER_ADMIN' }));
  assert.ok(userChangeDenial(manager, manager, { locationIds: [A, B] }));
  assert.ok(userChangeDenial(manager, manager, { homeLocationId: B }));
  assert.equal(userChangeDenial(manager, manager, {}), null, 'their own name or phone is fine');
});

test('a branch manager manages only the staff of their own branches', () => {
  assert.equal(userChangeDenial(manager, null, { role: 'CSR', homeLocationId: A, locationIds: [A], roleIds: [] }), null);
  assert.equal(userChangeDenial(manager, clerk, { role: 'SALES_REP' }), null);
  assert.ok(userChangeDenial(manager, null, { role: 'CSR', homeLocationId: B }), 'home in another branch');
  assert.ok(userChangeDenial(manager, null, { role: 'CSR' }), 'no home branch');
  assert.ok(userChangeDenial(manager, clerk, { locationIds: [A, B] }), 'adding a branch the manager is not in');
  assert.ok(userChangeDenial(manager, clerkB, {}), 'a login of another branch');
  assert.ok(userChangeDenial(manager, { id: 'x', role: 'CSR', userLocations: [] }, {}), 'a login with no branch');
  assert.ok(userChangeDenial(manager, admin, {}), 'a login with a higher role');
  assert.ok(userChangeDenial(manager, { id: 'r', role: 'CSR', homeLocationId: A, userLocations: [{ locationId: B }] }, {}), 'a login that also works at another branch');
});

test('a person held to branches sees the people of those branches and themselves; head office sees everyone', () => {
  assert.equal(visibleUsersWhere(superAdmin), null);
  assert.equal(visibleUsersWhere(admin), null);
  assert.deepEqual(visibleUsersWhere(manager), { OR: [
    { id: 'm' },
    { homeLocationId: { in: [A] } },
    { userLocations: { some: { locationId: { in: [A] } } } },
  ] });
  const regional = { id: 'r', role: 'BRANCH_MANAGER', homeLocationId: A, userLocations: [{ locationId: B }] };
  assert.deepEqual(visibleUsersWhere(regional).OR[1].homeLocationId.in.sort(), [A, B]);
  // No branch on file: only their own login.
  assert.deepEqual(visibleUsersWhere({ id: 'n', role: 'CSR' }).OR[1], { homeLocationId: { in: [] } });
});
