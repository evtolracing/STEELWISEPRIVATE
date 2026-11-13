import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/admin/seed-demo
 * Loads (or refreshes) the demo data set. Safe to run repeatedly.
 * ?part=<name> loads one part; without it every part is loaded, which can
 * take longer than one serverless request allows. GET lists the parts.
 * Turned off when DEMO_SEED_ENABLED is "false", e.g. in real production.
 */
router.get('/seed-demo', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  const { DEMO_PARTS } = await import('../seeds/demo/index.js');
  res.json({ parts: Object.keys(DEMO_PARTS) });
});

router.post('/seed-demo', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  if (process.env.DEMO_SEED_ENABLED === 'false') {
    return res.status(403).json({ error: 'Demo seeding is turned off on this server' });
  }
  if (!['SUPER_ADMIN', 'TENANT_OWNER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only an owner or super admin can load demo data' });
  }
  try {
    const { seedDemo } = await import('../seeds/demo/index.js');
    const part = typeof req.query.part === 'string' && req.query.part ? req.query.part : undefined;
    res.json({ status: 'ok', loaded: await seedDemo(part) });
  } catch (error) {
    console.error('Demo seed failed:', error);
    res.status(500).json({ error: 'Demo seed failed', reason: error.message });
  }
});

/**
 * GET /api/admin/retention
 * How much history is older than the period it must stay online (five years unless changed),
 * with a warning when records are ready to archive. Read-only: it never removes anything.
 */
router.get('/retention', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER', 'EXECUTIVE', 'CFO', 'COO', 'CIO'), async (req, res) => {
  try {
    const { retentionReport } = await import('../lib/retention.js');
    res.json(await retentionReport());
  } catch (error) {
    console.error('Retention report failed:', error);
    res.status(500).json({ error: 'Could not read the retention report' });
  }
});

export default router;
