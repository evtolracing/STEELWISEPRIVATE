/**
 * Who may give a login which role and which branches (finding C-001).
 *
 *  - Super admin and tenant owner may do anything.
 *  - Admin may do anything except create or change a super admin or tenant owner.
 *  - A branch manager manages the staff of their own branches only: they may not grant a role that
 *    sees every branch, an admin role or another branch manager; they may not put anyone in a branch
 *    they are not in; they may not change a login that is outside their branches or holds a higher
 *    role; and they may not change their own role or branches.
 *
 * Without this a branch manager could make themselves super admin, which would also undo the
 * branch boundary (lib/branchScope.js).
 */
import { ALL_BRANCH_ROLES, branchesOf } from './branchScope.js';
import { EXTERNAL_ROLES } from './roleAccess.js';

const TOP = new Set(['SUPER_ADMIN', 'TENANT_OWNER']);
const ABOVE_BRANCH = new Set([...ALL_BRANCH_ROLES, 'BRANCH_MANAGER']);

/**
 * actor:  the signed-in user (with userLocations)
 * target: the login being changed (with userLocations), or null when creating
 * change: { role?, homeLocationId?, locationIds?, roleIds? } as sent; undefined means "not changed"
 * Returns a sentence to refuse with, or null.
 */
export function userChangeDenial(actor, target, change = {}) {
  if (TOP.has(actor.role)) return null;
  if (target && TOP.has(target.role)) return 'Only a super admin can change this login.';
  if (change.role !== undefined && TOP.has(change.role)) return 'Only a super admin can grant that role.';
  if (actor.role === 'ADMIN') return null;

  // Branch manager from here on.
  const mine = branchesOf(actor) || [];
  const inMine = (id) => id === null || id === undefined || mine.includes(id);
  if (target) {
    if (target.id === actor.id && (change.role !== undefined || change.homeLocationId !== undefined || change.locationIds !== undefined || change.roleIds !== undefined)) {
      return 'You cannot change your own role or branches.';
    }
    if (ABOVE_BRANCH.has(target.role) && target.id !== actor.id) return 'You can manage only the staff of your own branches.';
    const theirs = branchesOf({ ...target, role: 'CSR' }) || [];
    if (!theirs.length || !theirs.every((b) => mine.includes(b))) return 'You can manage only the staff of your own branches.';
  }
  if (change.role !== undefined && ABOVE_BRANCH.has(change.role)) return 'A branch manager cannot grant that role.';
  if (change.roleIds !== undefined && change.roleIds.length) return 'A branch manager cannot grant extra roles.';
  if (!target && !change.homeLocationId) return 'Choose a home branch for the new login.';
  if (!inMine(change.homeLocationId) || (change.locationIds || []).some((b) => !mine.includes(b))) return 'You can assign only your own branches.';
  return null;
}

/**
 * Which logins a person may see (owner's decision 4 of 2026-11-22): someone held to branches sees the
 * people of those branches and themselves; head office sees everyone. A login with no branch on file is
 * seen by head office only, who are the ones able to give it one.
 * Returns a filter to add to the search, or null for "no limit".
 */
export function visibleUsersWhere(actor) {
  const mine = branchesOf(actor);
  if (mine === null) return null;
  return { OR: [
    { id: actor.id },
    { homeLocationId: { in: mine } },
    { userLocations: { some: { locationId: { in: mine } } } },
  ] };
}

/**
 * Staff held to branches who have no branch at all: they can sign in and then see nothing that belongs to a
 * branch, which reads to them as a broken system. The Users screen counts and lists them so head office can
 * give each one a branch. Customer and partner logins, and roles that see every branch, are never counted.
 */
const BRANCH_HELD_EXEMPT = [...EXTERNAL_ROLES, ...ALL_BRANCH_ROLES];
export function noBranchWhere() {
  return { isActive: true, role: { notIn: BRANCH_HELD_EXEMPT }, homeLocationId: null, userLocations: { none: {} } };
}
export function hasNoBranch(user) {
  return Boolean(user) && user.isActive !== false && !BRANCH_HELD_EXEMPT.includes(user.role)
    && !user.homeLocationId && !(user.userLocations || []).length;
}
