/**
 * Deciding from a set of permissions (lib/permissionCatalog.js) instead of from a role's name.
 *
 * Phase 1 of the editable role matrix: pure functions, not yet called by the running server.
 * test/permissionMatrix.test.js holds them to today's rules.
 *
 *   subject = { audience, grants, customerId }
 *     audience  'STAFF', 'CUSTOMER' or 'PARTNER' (Role.audience)
 *     grants    the permissions the login holds: an array or Set of "<area>:<action>", or '*' for all
 */
import { EXTERNAL_PREFIXES } from './roleAccess.js';
import { OPEN_PAGES_PERMISSION, PAGE_PERMISSION, PERMISSION_SET, permissionFor } from './permissionCatalog.js';

export const ALL = '*';
const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export function has(grants, permission) {
  if (!grants) return false;
  const set = grants instanceof Set ? grants : new Set(grants);
  return set.has(ALL) || set.has(permission);
}

/**
 * What a login may do: everything its roles give, plus what was granted to this one person, minus
 * what was denied to them. A denial always wins. Roles that are switched off or whose assignment has
 * ended, and exceptions that have ended, count for nothing. Unknown permissions are dropped.
 *   roles:     [{ grants, isActive?, expiresAt? }]
 *   overrides: [{ permission, effect: 'GRANT' | 'DENY', expiresAt? }]
 */
export function effectiveGrants(roles = [], overrides = [], now = new Date()) {
  const live = (x) => !x.expiresAt || new Date(x.expiresAt) > now;
  const out = new Set();
  for (const role of roles) {
    if (role.isActive === false || !live(role)) continue;
    for (const g of role.grants || []) if (g === ALL || PERMISSION_SET.has(g)) out.add(g);
  }
  const mine = overrides.filter(live);
  for (const o of mine) if (o.effect === 'GRANT' && PERMISSION_SET.has(o.permission)) out.add(o.permission);
  const denied = mine.filter((o) => o.effect === 'DENY').map((o) => o.permission);
  if (denied.length && out.has(ALL)) {
    out.delete(ALL);
    for (const p of PERMISSION_SET) out.add(p);
  }
  for (const p of denied) out.delete(p);
  return out;
}

/** null when the request is allowed, otherwise the reason for a 403. */
export function apiDenial(subject, path, method = 'GET') {
  if (subject.audience !== 'STAFF') {
    if (EXTERNAL_PREFIXES.some((p) => under(path, p))) return null;
    if (method === 'GET' && subject.customerId && path === `/api/customers/${subject.customerId}/preferences`) return null;
    return 'Customer and partner accounts can only use the online store.';
  }
  const needed = permissionFor(path, method);
  if (!needed || has(subject.grants, needed)) return null;
  return 'Your role does not include this. Ask an administrator if you need it.';
}

/**
 * May the login open a page? section is the menu area the page belongs to (sectionForPath in
 * src/frontend/src/config/roleAccess.js), or null for the pages outside every area.
 */
export function pageAllowed(subject, section, pathname = '') {
  if (section) return has(subject.grants, PAGE_PERMISSION[section]);
  if (subject.audience === 'STAFF') return has(subject.grants, OPEN_PAGES_PERMISSION);
  return String(pathname).replace(/^\/+/, '').split('/')[0] === 'help';
}

/** null = every branch; otherwise the branch ids the login is held to. scope is Role.branchScope. */
export function branchesFor(scope, user) {
  if (scope === 'ALL') return null;
  if (scope === 'OWN') return user?.homeLocationId ? [user.homeLocationId] : [];
  const ids = new Set((user?.userLocations || []).map((l) => l.locationId));
  if (user?.homeLocationId) ids.add(user.homeLocationId);
  return [...ids];
}
