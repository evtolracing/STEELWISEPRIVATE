import { Router } from 'express';
import prisma from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { checkPassword, hashPassword } from '../lib/passwords.js';
import { authenticate, requireRole, signUserToken, missingUpdate17, UPDATE_17 } from '../middleware/auth.js';
import { raiseAlertLater } from '../lib/alerts.js';
import { userChangeDenial } from '../lib/userAdminRules.js';
import { CUSTOMER_ROLES } from '../lib/customerScope.js';

const router = Router();

// Per-account protection against password guessing (Y-002). It is kept on the login itself, in the
// database, so it holds across server instances and whatever address the attempts come from.
export const LOCK_AFTER = 10;
export const LOCK_MINUTES = 15;
/** After this many wrong passwords in a row, the time the login is paused until; otherwise null. */
export function pauseUntil(failedInARow, now = new Date()) {
  return Number(failedInARow) >= LOCK_AFTER ? new Date(now.getTime() + LOCK_MINUTES * 60000) : null;
}
// One answer for every refusal, so a reply never says whether an address has a login (Y-003).
const REFUSED = 'Invalid credentials. After repeated failures an account is paused for 15 minutes.';
// A hash of a password nobody has, compared when the address has no login, so the answer takes as long
// either way (Y-003).
const NO_LOGIN_HASH = bcrypt.hashSync('steelwise-no-such-login-' + Math.random(), 10);

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organization: user.organization,
    customerId: user.customerId || null,
    customer: user.customer || null,
    // The person's own branch, so a screen can start there instead of at the first branch of a list.
    homeLocationId: user.homeLocationId || null,
  };
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true, customer: { select: { id: true, code: true, name: true } } }
    });

    const now = new Date();
    if (user?.lockedUntil && user.lockedUntil > now) {
      // Paused: the password is not even compared. The same answer as a wrong password.
      await checkPassword(password, NO_LOGIN_HASH);
      return res.status(401).json({ error: REFUSED });
    }
    const matches = await checkPassword(password, user?.passwordHash || NO_LOGIN_HASH);
    if (!user || !user.passwordHash || !matches) {
      if (user) {
        const failed = await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } }, select: { failedLoginCount: true } });
        const until = pauseUntil(failed.failedLoginCount, now);
        // Only the request that starts the pause records it: a burst of guesses makes one pause, one row
        // and one alert, not one per guess (the condition is checked by the database, Y-002).
        const took = until ? await prisma.user.updateMany({ where: { id: user.id, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] }, data: { lockedUntil: until, failedLoginCount: 0 } }) : { count: 0 };
        if (took.count) {
          await prisma.$transaction([
            prisma.auditLog.create({ data: { tenantId: user.organizationId, category: 'AUTH', eventType: 'LOGIN_LOCKED', severity: 'WARNING', action: 'LOCK', userId: user.id, resourceType: 'User', resourceId: user.id, ipAddress: String(req.ip || '').slice(0, 80), details: { failedInARow: failed.failedLoginCount, lockedUntil: until.toISOString() } } }),
          ]);
          raiseAlertLater('LOGIN_LOCKED', { userId: user.id, failedInARow: failed.failedLoginCount, lockedUntil: until.toISOString() }, { key: user.id, requestId: req.id });
        }
      }
      return res.status(401).json({ error: REFUSED });
    }
    if (user.isActive === false) {
      return res.status(403).json({ error: 'User account is disabled' });
    }
    if (user.failedLoginCount || user.lockedUntil) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
    }

    res.json({ token: signUserToken(user), user: publicUser(user) });
  } catch (error) {
    if (missingUpdate17(error)) return res.status(503).json(UPDATE_17);
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

async function createUser(req, res) {
  try {
    const { email, password, firstName, lastName, role, organizationId } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
    }
    if (typeof firstName !== 'string' || !firstName.trim() || typeof lastName !== 'string' || !lastName.trim()) {
      return res.status(400).json({ error: 'First and last name are required' });
    }

    // After the first login exists, this route is the same as adding a login on the Users screen and
    // keeps the same rules (Y-013): the new login belongs to the creator's company, never to an
    // organization named in the request, and a customer login is made on the Users screen, where it is
    // tied to its customer account.
    const caller = req.user || null;
    const wanted = role || 'VIEWER';
    if (caller) {
      const denial = userChangeDenial(caller, null, { role: wanted });
      if (denial) return res.status(403).json({ error: denial });
      if (CUSTOMER_ROLES.has(wanted)) return res.status(400).json({ error: 'A customer login is added on the Users screen, where it is tied to its customer account.' });
      if (organizationId && organizationId !== caller.organizationId) return res.status(403).json({ error: 'A login is added to your own company only.' });
    }
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: wanted,
        organizationId: caller ? caller.organizationId : organizationId
      }
    });
    await prisma.auditLog.create({ data: { tenantId: user.organizationId, category: 'DATA', eventType: 'CREATE', severity: 'INFO', action: 'user.create', userId: caller?.id || user.id, resourceType: 'User', resourceId: user.id, details: { email, role: wanted, through: 'register', firstLogin: !caller } } });

    res.status(201).json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// Register: open only while the database has no users (to create the first
// admin). After that, only admins can create accounts.
router.post('/register', async (req, res, next) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) return createUser(req, res);
  } catch (error) {
    return next(error);
  }

  authenticate(req, res, (err) => {
    if (err) return next(err);
    requireRole('SUPER_ADMIN', 'TENANT_OWNER')(req, res, () => createUser(req, res));
  });
});

// Change your own password. Requires the current password.
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'The new password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.passwordHash || !await checkPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Every other sign-in of this login ends (Y-001); this one carries on with the new token.
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword, 10), tokensValidAfter: new Date() } });
      await tx.auditLog.create({ data: { tenantId: user.organizationId, category: 'AUTH', eventType: 'PASSWORD_CHANGED', severity: 'INFO', action: 'UPDATE', userId: user.id, resourceType: 'User', resourceId: user.id, details: { otherSessionsEnded: true } } });
      return u;
    });
    res.json({ success: true, token: signUserToken(updated) });
  } catch (error) {
    next(error);
  }
});

// Sign out everywhere: every token issued for this login so far stops working, this one included (Y-001).
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: req.user.id }, data: { tokensValidAfter: new Date() } }),
      prisma.auditLog.create({ data: { tenantId: req.user.organizationId, category: 'AUTH', eventType: 'SIGNED_OUT_EVERYWHERE', severity: 'INFO', action: 'UPDATE', userId: req.user.id, resourceType: 'User', resourceId: req.user.id, details: {} } }),
    ]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get current user. The user is returned under `user` (what the frontend
// reads) and also at the top level for older callers.
router.get('/me', authenticate, (req, res) => {
  const user = publicUser(req.user);
  res.json({ ...user, user });
});

export default router;
