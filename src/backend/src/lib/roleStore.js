/**
 * What each role may do, as the running server knows it (role matrix, phase 3).
 *
 * The roles are read from the database (Role.grants, saved from the Roles and permissions screens)
 * and kept for a minute, so a request does not cost a query. A change made on this server copy is
 * seen at once (routes/roles.js calls forgetRoles); other copies see it within the minute.
 *
 * Safe in every direction:
 *  - A role the database does not have, a database that cannot be read, or update 19 not applied:
 *    the role gets its built-in default (lib/builtinRoleDefaults.js), which is what the rules were
 *    before the switchover. The server never opens up and never locks everyone out because the role
 *    table could not be read.
 *  - Super admin and tenant owner always hold everything, whatever the database says.
 *  - Whether a role is staff, customer or partner comes from the built-in list, never from the
 *    database: a saved row cannot turn a customer login into a staff login.
 *  - ROLE_MATRIX=off makes every role its built-in default again, without a deploy.
 */
import prisma from './db.js';
import { BUILTIN_DEFAULTS } from './builtinRoleDefaults.js';
import { LOCKED_ROLES } from './roleEditRules.js';
import { PERMISSIONS } from './permissionCatalog.js';
import { ALL, has } from './permissions.js';

const KEEP_MS = 60_000;
let kept = { at: 0, rows: null };
let warned = false;

export const matrixOff = () => String(process.env.ROLE_MATRIX || '').toLowerCase() === 'off';

/** Pure: the access of one role name, given the saved built-in rows ({ name: { grants, branchScope } }). */
export function accessOf(roleName, rows = {}) {
  const base = BUILTIN_DEFAULTS[roleName];
  const row = rows?.[roleName];
  const saved = row && Array.isArray(row.grants) && !LOCKED_ROLES.has(roleName) ? row : null;
  return {
    role: roleName,
    audience: base?.audience || 'STAFF',
    branchScope: saved?.branchScope || base?.branchScope || 'ASSIGNED',
    grants: new Set(LOCKED_ROLES.has(roleName) ? [ALL] : saved ? saved.grants : base?.grants || []),
    fromDatabase: Boolean(saved),
  };
}

/** The saved built-in roles, by name. Empty when they cannot be read or the matrix is switched off. */
export async function savedRoles() {
  if (matrixOff() || !prisma) return {};
  if (kept.rows && Date.now() - kept.at < KEEP_MS) return kept.rows;
  try {
    const rows = await prisma.role.findMany({ where: { isSystem: true, name: { in: Object.keys(BUILTIN_DEFAULTS) } }, select: { name: true, grants: true, branchScope: true } });
    kept = { at: Date.now(), rows: Object.fromEntries(rows.map((r) => [r.name, r])) };
    warned = false;
  } catch (error) {
    if (!warned) console.error(JSON.stringify({ level: 'error', msg: 'role_matrix_unreadable', detail: 'Using the built-in default of every role until the role table can be read.', code: error?.code || null }));
    warned = true;
    // Do not ask again on every request while it fails.
    kept = { at: Date.now() - KEEP_MS + 10_000, rows: kept.rows || {} };
  }
  return kept.rows;
}

/** Called after a role is changed, so the next request reads the roles again. */
export function forgetRoles() { kept = { at: 0, rows: null }; }

/** The access of a role name right now. */
export async function accessFor(roleName) { return accessOf(roleName, await savedRoles()); }

/** May this request do that? Falls back to the role's built-in default when the request carries no access (never opens up). */
export function can(req, permission) {
  const grants = req?.access?.grants || (req?.user?.role ? accessOf(req.user.role).grants : null);
  return has(grants, permission);
}

/** A login's permissions as a plain list for the browser ("everything" written out). */
export const grantList = (access) => (access.grants.has(ALL) ? [...PERMISSIONS] : PERMISSIONS.filter((p) => access.grants.has(p)));
