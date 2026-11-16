/**
 * Integration report and recovery actions.
 *
 *   GET  /api/admin/integrations                         the report (lib/integrationReport.js)
 *   GET  /api/admin/integrations/deliveries?status=      partner events and how each delivery went
 *   POST /api/admin/integrations/deliveries/:id/replay   send a failed event again
 *   POST /api/admin/integrations/run                     run the periodic work now
 *
 *   GET|POST /api/internal/tasks/run                     the same periodic work, for a scheduler.
 *        Needs `Authorization: Bearer <CRON_SECRET or TASKS_SECRET>`. Refused when no secret is set.
 */
import crypto from 'node:crypto';
import { Router } from 'express';
import prisma from '../lib/db.js';
import { requireRole } from '../middleware/auth.js';
import { integrationReport, runTasks } from '../lib/integrationReport.js';
import { replayDelivery } from '../services/webhookService.js';

const router = Router();
// The report covers the whole company, so it is for the people who see the whole company.
const COMPANY_WIDE = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'CIO', 'COO'];
const only = (...roles) => (req, res, next) => (roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'This page is for company administrators.' }));
const fail = (res, label, error, req) => {
  console.error(JSON.stringify({ level: 'error', msg: 'integrations_failed', label, id: req.id }), error);
  res.status(500).json({ error: `Could not ${label}`, requestId: req.id });
};

router.get('/', only(...COMPANY_WIDE), async (req, res) => {
  try { res.json(await integrationReport()); } catch (error) { fail(res, 'read the integration report', error, req); }
});

const DELIVERY_STATUSES = ['PENDING', 'RETRYING', 'DELIVERED', 'FAILED'];
router.get('/deliveries', only(...COMPANY_WIDE), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;
    if (status && !DELIVERY_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${DELIVERY_STATUSES.join(', ')}` });
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
    const where = status ? { status } : {};
    const [rows, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: offset, take: limit,
        select: { id: true, eventType: true, eventId: true, status: true, attempts: true, maxAttempts: true, httpStatus: true, errorMessage: true, responseTimeMs: true, nextRetryAt: true, deliveredAt: true, createdAt: true,
          webhook: { select: { id: true, status: true, partner: { select: { id: true, partnerType: true, organization: { select: { name: true, code: true } } } } } } },
      }),
      prisma.webhookDelivery.count({ where }),
    ]);
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (error) { fail(res, 'list deliveries', error, req); }
});

router.post('/deliveries/:id/replay', only('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const result = await replayDelivery(req.params.id, req.user.id);
    if (result.status !== 200) return res.status(result.status).json({ error: result.error });
    res.json({ message: result.delivery.status === 'DELIVERED' ? 'Delivered' : 'Sent again; it was not accepted this time', delivery: result.delivery });
  } catch (error) { fail(res, 'send the event again', error, req); }
});

router.post('/run', only('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN'), async (req, res) => {
  try { res.json(await runTasks({ by: `user ${req.user.id}` })); } catch (error) { fail(res, 'run the periodic work', error, req); }
});

/** For a scheduler. It carries no user, so it proves itself with the shared secret. */
export async function scheduledRun(req, res) {
  const secret = process.env.CRON_SECRET || process.env.TASKS_SECRET;
  if (!secret) return res.status(503).json({ error: 'The scheduled run is not set up on this server.' });
  const given = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(secret).digest();
  if (!given || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Not authorised' });
  try { res.json(await runTasks({ by: 'schedule' })); } catch (error) { fail(res, 'run the periodic work', error, req); }
}

export default router;
