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
 *  - ROLE_MATRIX=off makes every role its built-in default again, without a deploy. Custom main
 *    roles, extra roles and personal exceptions then count for nothing as well.
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

const NONE = { byName: {}, byId: {} };
const ROLE_COLUMNS = { id: true, name: true, displayName: true, grants: true, branchScope: true, audience: true, baseRole: true, isSystem: true, isActive: true };

/**
 * Every saved role: { byName } the built-in ones by name, { byId } all of them (custom roles too).
 * Empty when they cannot be read or the matrix is switched off.
 */
export async function allRoles() {
  if (matrixOff() || !prisma) return NONE;
  if (kept.rows && Date.now() - kept.at < KEEP_MS) return kept.rows;
  try {
    const rows = await prisma.role.findMany({ select: ROLE_COLUMNS });
    kept = { at: Date.now(), rows: {
      byName: Object.fromEntries(rows.filter((r) => r.isSystem && Object.hasOwn(BUILTIN_DEFAULTS, r.name)).map((r) => [r.name, r])),
      byId: Object.fromEntries(rows.map((r) => [r.id, r])),
    } };
    warned = false;
  } catch (error) {
    if (!warned) console.error(JSON.stringify({ level: 'error', msg: 'role_matrix_unreadable', detail: 'Using the built-in default of every role until the role table can be read.', code: error?.code || null }));
    warned = true;
    // Do not ask again on every request while it fails.
    kept = { at: Date.now() - KEEP_MS + 10_000, rows: kept.rows || NONE };
  }
  return kept.rows;
}

/** The saved built-in roles, by name. Empty when they cannot be read or the matrix is switched off. */
export async function savedRoles() { return (await allRoles()).byName; }

/** Called after a role is changed, so the next request reads the roles again. */
export function forgetRoles() { kept = { at: 0, rows: null }; }

// ── What is set on one person: a custom main role, extra roles, exceptions (phase 4) ──
const NOTHING = { primaryRoleId: null, extras: [], overrides: [] };
const people = new Map();
const MOST = 5000;
let warnedPeople = false;

/**
 * The facts lib/userAccess.js needs for one login, kept for a minute. Each of the three is read on
 * its own, so a table a database update has not made yet (update 20) costs only its own part, and a
 * failure never opens anything up: the part that cannot be read counts as empty.
 */
export async function userFacts(userId) {
  if (matrixOff() || !prisma || !userId) return NOTHING;
  const had = people.get(userId);
  if (had && Date.now() - had.at < KEEP_MS) return had.facts;
  const read = async (query, empty) => {
    try { return await query(); } catch (error) {
      if (!warnedPeople) console.error(JSON.stringify({ level: 'error', msg: 'user_access_unreadable', detail: 'A part of a person\'s roles or exceptions could not be read and counts as empty.', code: error?.code || null }));
      warnedPeople = true;
      return empty;
    }
  };
  const [primary, extras, overrides] = await Promise.all([
    read(() => prisma.userPrimaryRole.findUnique({ where: { userId }, select: { roleId: true } }), null),
    read(() => prisma.userRoleAssignment.findMany({ where: { userId }, select: { roleId: true, expiresAt: true } }), []),
    read(() => prisma.userPermissionOverride.findMany({ where: { userId }, select: { permission: true, effect: true, reason: true, expiresAt: true } }), []),
  ]);
  const facts = { primaryRoleId: primary?.roleId || null, extras, overrides };
  if (people.size >= MOST) people.clear();
  people.set(userId, { at: Date.now(), facts });
  return facts;
}

/** Called after a person's roles or exceptions change (no id: everyone). */
export function forgetUser(userId) { if (userId) people.delete(userId); else people.clear(); }

/** The access of a role name right now. */
export async function accessFor(roleName) { return accessOf(roleName, await savedRoles()); }

/** May this request do that? Falls back to the role's built-in default when the request carries no access (never opens up). */
export function can(req, permission) {
  const grants = req?.access?.grants || (req?.user?.role ? accessOf(req.user.role).grants : null);
  return has(grants, permission);
}

/** A login's permissions as a plain list for the browser ("everything" written out). */
export const grantList = (access) => (access.grants.has(ALL) ? [...PERMISSIONS] : PERMISSIONS.filter((p) => access.grants.has(p)));
