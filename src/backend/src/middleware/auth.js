/**
 * Shared authentication middleware for internal (staff) API routes.
 */
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import config from '../config/index.js';
import { setBranchScope } from '../lib/branchScope.js';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER'];

export function signUserToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, orgId: user.organizationId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyUserToken(token) {
  return jwt.verify(token, config.jwtSecret);
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true, customer: { select: { id: true, code: true, name: true } }, userLocations: { select: { locationId: true } } },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ error: 'User account is disabled' });

    req.user = user;
    setBranchScope(user);
    next();
  } catch (error) {
    next(error);
  }
}

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
