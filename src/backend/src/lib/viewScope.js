/**
 * What one request is allowed to see: the role it acts as and the branches it reads.
 *
 * Two choices a person makes in the top bar travel with every request as headers:
 *
 *   X-Branch-Id     the branch to work in. A login held to some branches may pick one of them; a
 *                   login that sees every branch may pick any branch, or none for all of them. A
 *                   branch the login may not see is ignored, so the header can only narrow access.
 *   X-View-As-Role  an administrator previewing what another role sees. Only system administrators
 *                   (SUPER_ADMIN, TENANT_OWNER, ADMIN) may preview, only a role at or below their
 *                   own, never a customer or partner role, and the preview is view-only (the API
 *                   gate refuses every change while it is on). The request then runs as that role
 *                   through every rule: menus, the API gate, route guards and the branch boundary.
 *
 * Pure: the same inputs give the same output. The headers can never widen what a login may do.
 */
import { ALL_BRANCH_ROLES, branchesOf } from './branchScope.js';
import { EXTERNAL_ROLES, STAFF_GROUPS } from './roleAccess.js';

/** Roles that hold every right in the system. Only these pass a role check they are not named in. */
export const TOP_ROLES = new Set(['SUPER_ADMIN', 'TENANT_OWNER']);
export const SYSTEM_ADMIN_ROLES = new Set([...TOP_ROLES, 'ADMIN']);

/** Every staff role that can be previewed. */
export const PREVIEW_ROLES = new Set(Object.values(STAFF_GROUPS).flat());

const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** The role to preview, or null. Never a role above the person's own. */
export function previewRoleFor(realRole, asked) {
  const role = String(asked || '').trim().toUpperCase();
  if (!role || role === realRole || !SYSTEM_ADMIN_ROLES.has(realRole)) return null;
  if (!PREVIEW_ROLES.has(role) || EXTERNAL_ROLES.has(role)) return null;
  // An ADMIN may not preview the two roles above it.
  if (TOP_ROLES.has(role) && !TOP_ROLES.has(realRole)) return null;
  return role;
}

/**
 * user:    the signed-in login, with userLocations
 * headers: { viewAs, branchId } as sent (strings or undefined)
 * Returns { user, realRole, previewRole, branchId, branches, home }
 *   user      the login as this request sees it (role replaced while previewing)
 *   branches  null = every branch, otherwise the branch ids this request is held to
 */
export function requestView(user, { viewAs, branchId } = {}) {
  const realRole = user?.role || null;
  const previewRole = previewRoleFor(realRole, viewAs);
  const effective = previewRole ? { ...user, role: previewRole } : user;

  // Which branches the person may pick from: their own login decides, never the preview.
  const mayPick = branchesOf(user);
  const asked = typeof branchId === 'string' && ID.test(branchId.trim()) ? branchId.trim() : null;
  const picked = asked && !EXTERNAL_ROLES.has(realRole) && (mayPick === null || mayPick.includes(asked)) ? asked : null;

  let branches;
  if (picked) branches = [picked];
  else if (previewRole) {
    // A preview of a role held to branches, with no branch picked, shows the administrator's own
    // branches; one that sees every branch shows every branch.
    branches = ALL_BRANCH_ROLES.has(previewRole) ? null : (branchesOf({ ...user, role: 'CSR' }) || []);
  } else branches = branchesOf(user);

  return {
    user: effective,
    realRole,
    previewRole,
    branchId: picked,
    branches,
    home: picked || user?.homeLocationId || null,
  };
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

/** null when allowed. A preview is for looking: it changes nothing except the person's own sign-in. */
export function previewWriteDenial(view, path, method) {
  if (!view?.previewRole || READ_METHODS.has(method) || under(path, '/api/auth')) return null;
  return `You are previewing the ${view.previewRole.replace(/_/g, ' ').toLowerCase()} role, which is view-only. End the preview to make changes.`;
}
