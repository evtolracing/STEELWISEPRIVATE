/**
 * Database reads behind the role matrix safeguards (phase 4): who could still edit roles after a change.
 * Counts by each active login's whole access (main role, extra roles, exceptions), not by role name.
 */
import prisma from './db.js';
import { has } from './permissions.js';
import { effectiveAccess } from './userAccess.js';

const quiet = async (query) => { try { return await query(); } catch { return []; } };

/**
 * Active logins of the company that would hold "roles:edit" if the change were saved.
 * change: { role: { id, grants } }                       a role's permissions replaced
 *       | { person: { id, role, facts } }                one person's role and facts replaced
 */
export async function editorsAfter(organizationId, change = {}) {
  const where = { user: { organizationId, isActive: true } };
  const [users, roles, primaries, extras, overrides] = await Promise.all([
    prisma.user.findMany({ where: { organizationId, isActive: true }, select: { id: true, role: true } }),
    prisma.role.findMany({ select: { id: true, name: true, displayName: true, grants: true, branchScope: true, audience: true, baseRole: true, isSystem: true, isActive: true } }),
    quiet(() => prisma.userPrimaryRole.findMany({ where, select: { userId: true, roleId: true } })),
    quiet(() => prisma.userRoleAssignment.findMany({ where, select: { userId: true, roleId: true, expiresAt: true } })),
    quiet(() => prisma.userPermissionOverride.findMany({ where, select: { userId: true, permission: true, effect: true, expiresAt: true } })),
  ]);
  const rows = roles.map((r) => (change.role && r.id === change.role.id ? { ...r, grants: change.role.grants } : r));
  const every = { byName: Object.fromEntries(rows.filter((r) => r.isSystem).map((r) => [r.name, r])), byId: Object.fromEntries(rows.map((r) => [r.id, r])) };
  const facts = new Map(users.map((u) => [u.id, { primaryRoleId: null, extras: [], overrides: [] }]));
  for (const p of primaries) if (facts.has(p.userId)) facts.get(p.userId).primaryRoleId = p.roleId;
  for (const e of extras) facts.get(e.userId)?.extras.push(e);
  for (const o of overrides) facts.get(o.userId)?.overrides.push(o);
  let count = 0;
  for (const u of users) {
    const changed = change.person && change.person.id === u.id ? change.person : null;
    if (has(effectiveAccess(changed ? changed.role : u.role, every, changed ? changed.facts : facts.get(u.id)).grants, 'roles:edit')) count += 1;
  }
  return count;
}
