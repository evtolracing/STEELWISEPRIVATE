/**
 * What one person may do (role matrix, phase 4): their main role, the roles given on top, and the
 * exceptions set on that one person.
 *
 *   permissions = main role  +  every extra role  +  permissions granted to the person
 *                 -  permissions denied to the person        (a denial always wins)
 *
 *  - The main role is the built-in role in User.role, unless the person has a custom role as their
 *    main role (UserPrimaryRole): then the custom role's permissions replace the built-in ones.
 *  - Super admin and tenant owner hold everything. Nothing here adds to or takes from them.
 *  - A customer or partner login has its one role and nothing else: no extra roles, no exceptions.
 *  - An extra role or an exception past its end date counts for nothing. So does a role that is
 *    switched off, a customer or partner role, and the two locked roles given as extras.
 *  - The person sees the widest branch reach among their roles.
 *
 * Pure: no database. lib/roleStore.js loads the facts.
 */
import { LOCKED_ROLES } from './roleEditRules.js';
import { PERMISSION_SET } from './permissionCatalog.js';
import { ALL } from './permissions.js';
import { accessOf } from './roleStore.js';

export const DEFAULT_BASE = 'VIEWER';
const REACH = { OWN: 0, ASSIGNED: 1, ALL: 2 };
const live = (row, now) => !row.expiresAt || new Date(row.expiresAt).getTime() > now;
const custom = (role) => Boolean(role) && !role.isSystem;
/** The built-in role a custom role stands on. */
export const baseOf = (role) => role?.baseRole || DEFAULT_BASE;

/**
 * roleName: User.role
 * roles:    { byName, byId } the saved roles (lib/roleStore.js allRoles)
 * facts:    { primaryRoleId, extras: [{ roleId, expiresAt }], overrides: [{ permission, effect, reason, expiresAt }] }
 * Returns the access of accessOf() plus:
 *   primary   { id, name, displayName, custom }   the main role as it counts
 *   extras    [{ id, name, displayName }]         the extra roles that count
 *   sources   { permission: [where it comes from] }
 *   denied    { permission: reason }              taken away by an exception
 */
export function effectiveAccess(roleName, roles = {}, facts = {}, now = Date.now()) {
  const byName = roles.byName || {};
  const byId = roles.byId || {};
  const base = accessOf(roleName, byName);
  const label = (r) => r?.displayName || r?.name || roleName;
  const builtinRow = Object.values(byId).find((r) => r.isSystem && r.name === roleName);
  const out = { ...base, primary: { id: builtinRow?.id || null, name: roleName, displayName: label(builtinRow), custom: false }, extras: [], sources: {}, denied: {} };
  if (LOCKED_ROLES.has(roleName) || base.audience !== 'STAFF') {
    for (const p of base.grants) out.sources[p] = [out.primary.displayName];
    return out;
  }

  let grants = base.grants;
  let reach = base.branchScope;
  const main = facts.primaryRoleId ? byId[facts.primaryRoleId] : null;
  // A custom main role counts only while it is active and stands on the role the login carries.
  if (custom(main) && main.isActive !== false && main.audience === 'STAFF' && Array.isArray(main.grants) && baseOf(main) === roleName) {
    grants = new Set(main.grants.filter((p) => PERMISSION_SET.has(p)));
    reach = REACH[main.branchScope] === undefined ? 'ASSIGNED' : main.branchScope;
    out.primary = { id: main.id, name: main.name, displayName: label(main), custom: true };
    out.fromDatabase = true;
  }
  const sources = {};
  const add = (p, from) => { (sources[p] ||= []).push(from); };
  for (const p of grants) add(p, out.primary.displayName);

  const seen = new Set([out.primary.id]);
  for (const given of facts.extras || []) {
    const role = byId[given.roleId];
    if (!role || seen.has(role.id) || !live(given, now) || role.isActive === false || role.audience !== 'STAFF' || LOCKED_ROLES.has(role.name)) continue;
    seen.add(role.id);
    const theirs = role.isSystem ? accessOf(role.name, byName) : { grants: new Set((Array.isArray(role.grants) ? role.grants : []).filter((p) => PERMISSION_SET.has(p))), branchScope: role.branchScope };
    if (role.isSystem && theirs.audience !== 'STAFF') continue;
    for (const p of theirs.grants) if (p !== ALL) add(p, label(role));
    if ((REACH[theirs.branchScope] ?? 1) > REACH[reach]) reach = theirs.branchScope;
    out.extras.push({ id: role.id, name: role.name, displayName: label(role), expiresAt: given.expiresAt || null });
  }

  const overrides = (facts.overrides || []).filter((o) => PERMISSION_SET.has(o.permission) && live(o, now));
  for (const o of overrides) if (o.effect === 'GRANT') add(o.permission, 'Exception');
  for (const o of overrides) if (o.effect === 'DENY') { delete sources[o.permission]; out.denied[o.permission] = o.reason || 'Denied for this person'; }

  out.grants = new Set(Object.keys(sources));
  out.branchScope = reach;
  out.sources = sources;
  return out;
}
