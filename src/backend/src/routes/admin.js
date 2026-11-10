import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/admin/seed-demo
 * Loads (or refreshes) the demo data set. Safe to run repeatedly.
 * Turned off when DEMO_SEED_ENABLED is "false", e.g. in real production.
 */
router.post('/seed-demo', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  if (process.env.DEMO_SEED_ENABLED === 'false') {
    return res.status(403).json({ error: 'Demo seeding is turned off on this server' });
  }
  if (!['SUPER_ADMIN', 'TENANT_OWNER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only an owner or super admin can load demo data' });
  }
  try {
    const { seedDemo } = await import('../seeds/demo/index.js');
    res.json({ status: 'ok', loaded: await seedDemo() });
  } catch (error) {
    console.error('Demo seed failed:', error);
    res.status(500).json({ error: 'Demo seed failed', reason: error.message });
  }
});

export default router;
