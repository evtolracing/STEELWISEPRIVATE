/**
 * Shared authentication middleware for internal (staff) API routes.
 */
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import config from '../config/index.js';
import { setBranchScope } from '../lib/branchScope.js';

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

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true, customer: { select: { id: true, code: true, name: true } }, userLocations: { select: { locationId: true } } },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ error: 'User account is disabled' });
    if (!tokenStillValid(decoded, user)) return res.status(401).json({ error: 'This sign-in has ended. Please sign in again.', code: 'SESSION_ENDED' });

    req.user = user;
    setBranchScope(user);
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

// Allows the listed roles plus the admin roles.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    if (!roles.includes(req.user.role) && !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
