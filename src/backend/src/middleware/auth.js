/**
 * Shared authentication middleware for internal (staff) API routes.
 */
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import config from '../config/index.js';
import { setBranchScope } from '../lib/branchScope.js';
import { requestView, SYSTEM_ADMIN_ROLES } from '../lib/viewScope.js';
import { accessOf, savedRoles } from '../lib/roleStore.js';
import { permissionFor } from '../lib/permissionCatalog.js';
import { has } from '../lib/permissions.js';

// The roles of the "admin" department in lib/roleAccess.js: their changes are not held to a department.
// They are NOT all system administrators: a branch or operations manager runs a branch, not the system,
// and does not pass a role check that does not name them (see requireRole).
export const ADMIN_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER'];

/** The login's session mark: 0 until its sessions are first ended, then the moment they were ended, in ms. */
const sessionMark = (user) => (user?.tokensValidAfter ? new Date(user.tokensValidAfter).getTime() : 0);

export function signUserToken(user) {
  return jwt.sign(
    // "sv" is the session mark at the time of signing (Y-001): the token stops working when it changes.
    { userId: user.id, role: user.role, orgId: user.organizationId, sv: sessionMark(user) },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyUserToken(token) {
  // Only the one algorithm the server signs with (Y-007): a token claiming any other is refused.
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}

/**
 * A token stops working when the login's sessions are ended (Y-001): the password was changed or reset,
 * the login was switched off, or the person signed out everywhere. Each of those sets "tokensValidAfter";
 * a token is accepted only when it carries the mark the login has now. A token from before any such
 * change carries none and is accepted only while the login has never had its sessions ended.
 */
export function tokenStillValid(decoded, user) {
  return Number(decoded?.sv || 0) === sessionMark(user);
}

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Verifies the JWT and loads the active user onto req.user.
export async function authenticate(req, res, next) {
  const token = readBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let decoded;
  try {
    decoded = verifyUserToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  // A signed token that names no login is refused here, not passed to the database (Y-018).
  if (typeof decoded?.userId !== 'string' || !decoded.userId) return res.status(401).json({ error: 'Invalid token' });

  // With no database there is nobody to check the token against: say the service is unavailable,
  // not that the server failed (Phase 12, AA-001; M-013).
  if (!prisma) return res.status(503).json({ error: 'The database is not available. Try again shortly.' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true, customer: { select: { id: true, code: true, name: true } }, userLocations: { select: { locationId: true } } },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ error: 'User account is disabled' });
    if (!tokenStillValid(decoded, user)) return res.status(401).json({ error: 'This sign-in has ended. Please sign in again.', code: 'SESSION_ENDED' });

    // The branch picked in the top bar and an administrator's role preview (lib/viewScope.js). Both can
    // only narrow what the login may see. req.realUser is the login itself.
    // What each role may do and which branches it sees: the saved roles (lib/roleStore.js).
    const roles = await savedRoles();
    const own = accessOf(user.role, roles);
    user.branchScope = own.branchScope;
    const view = requestView(user, { viewAs: req.headers['x-view-as-role'], branchId: req.headers['x-branch-id'] }, { seesEveryBranch: (role) => accessOf(role, roles).branchScope === 'ALL', mayPreview: has(own.grants, 'admin:preview') });
    // req.access is what this request may do: the previewed role's permissions while previewing.
    const access = accessOf(view.user.role, roles);
    if (view.previewRole) view.user.branchScope = access.branchScope;
    req.realUser = user;
    req.view = view;
    req.user = view.user;
    req.access = { ...access, customerId: view.user.customerId || null };
    req.realAccess = own;
    setBranchScope(view.user, view);
    next();
  } catch (error) {
    if (missingUpdate17(error)) return res.status(503).json(UPDATE_17);
    next(error);
  }
}

/**
 * True when the database is missing the sign-in columns of database update 17 (Y-022). The code
 * reads them on every sign-in; deployed before the owner applied update 17, every sign-in failed
 * with a bare server error. It now answers 503 with a sentence that names the update.
 */
export function missingUpdate17(error) {
  return error?.code === 'P2022' && /tokensValidAfter|failedLoginCount|lockedUntil/.test(`${error?.meta?.column || ''} ${error?.message || ''}`);
}
export const UPDATE_17 = { error: 'Database update 17 (security hardening) has to be applied first.', code: 'DATABASE_UPDATE_REQUIRED' };

/**
 * Allows the listed roles plus the system administrators (SUPER_ADMIN, TENANT_OWNER, ADMIN). With no
 * roles listed it means the system administrators only.
 *
 * Until this change every role in ADMIN_ROLES passed every check, so a branch manager or operations
 * manager could delete any login, reset passwords, manage partner API keys, create roles and load
 * demo data: they could do what the super admin could.
 */
export function roleAllowed(role, roles = []) {
  return SYSTEM_ADMIN_ROLES.has(role) || roles.includes(role);
}

/**
 * Since the role matrix switchover (phase 3) the check is by permission wherever the catalog names
 * one for the request (lib/permissionCatalog.js): the roles listed are then the built-in default,
 * and what decides is whether the login's role holds that permission now. Where the catalog names
 * none, the listed roles decide as before.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const needed = req.access ? permissionFor((req.originalUrl || '').split('?')[0].replace(/\/+$/, '') || '/', req.method) : null;
    if (needed ? !has(req.access.grants, needed) : !roleAllowed(req.user.role, roles)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
