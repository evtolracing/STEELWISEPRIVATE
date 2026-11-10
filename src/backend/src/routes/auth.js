import { Router } from 'express';
import prisma from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { authenticate, requireRole, signUserToken } from '../middleware/auth.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organization: user.organization,
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
      include: { organization: true }
    });

    if (!user || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ error: 'User account is disabled' });
    }

    res.json({ token: signUserToken(user), user: publicUser(user) });
  } catch (error) {
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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'VIEWER',
        organizationId
      }
    });

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
    if (!user?.passwordHash || !await bcrypt.compare(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
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
