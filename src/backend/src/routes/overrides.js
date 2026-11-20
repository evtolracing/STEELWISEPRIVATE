/**
 * Order overrides: a permanent record of each time someone at order entry went
 * past a warning (cutoff time, capacity, price), with who, when and why.
 * Stored in the audit log, so nothing here can be edited away: a revoke adds to
 * the record, it does not remove it.
 *
 *   POST /api/overrides                 { type, reasonCode, notes, orderId, orderNumber, originalValue, overrideValue, location, division, customerName }
 *   GET  /api/overrides?orderId=
 *   GET  /api/overrides/audit           ?type=&status=&user=&location=&dateFrom=&dateTo=&orderId=   (managers)
 *   GET  /api/overrides/count?orderId=&status=
 *   GET  /api/overrides/stats           (managers)
 *   POST /api/overrides/:id/revoke      { reason }                                                  (managers)
 */
import { Router } from 'express';
import { can } from '../lib/roleStore.js';
import prisma from '../lib/db.js';

const router = Router();
const EVENT = 'ORDER_OVERRIDE';
const TYPES = ['CUTOFF_VIOLATION', 'CAPACITY_WARNING', 'PRICING_OVERRIDE'];
const text = (v, max = 500) => (v == null || v === '' ? null : String(v).slice(0, max));
const isManager = (req) => can(req, 'sales:approveOverride');
const managersOnly = (req, res, next) => (isManager(req) ? next() : res.status(403).json({ error: 'Only a manager can do this' }));

function toApi(row) {
  const d = row.details || {};
  const name = row.user ? [row.user.firstName, row.user.lastName].filter(Boolean).join(' ') || row.user.email : 'Unknown';
  return {
    id: row.id,
    type: d.type,
    status: d.status || 'ACTIVE',
    orderId: row.resourceId,
    orderNumber: d.orderNumber || row.resourceId,
    reasonCode: d.reasonCode,
    reasonLabel: d.reasonLabel || d.reasonCode,
    notes: d.notes || '',
    originalValue: d.originalValue ?? null,
    overrideValue: d.overrideValue ?? null,
    user: row.user?.email || row.userId,
    userName: name,
    userRole: d.userRole || row.user?.role || null,
    timestamp: row.timestamp.toISOString(),
    location: d.location || null,
    division: d.division || null,
    customerName: d.customerName || null,
    revokedBy: d.revokedBy || null,
    revokedAt: d.revokedAt || null,
    revokeReason: d.revokeReason || null,
  };
}

const withUser = { user: { select: { email: true, firstName: true, lastName: true, role: true } } };

// An override's history line is never changed (Y-011). A revoke is its own line, and an override reads as
// revoked when such a line names it.
async function revocations(rows) {
  const ids = new Set(rows.map((r) => r.id));
  if (!ids.size) return new Map();
  const found = await prisma.auditLog.findMany({ where: { eventType: 'ORDER_OVERRIDE_REVOKED', resourceId: { in: [...new Set(rows.map((r) => r.resourceId).filter(Boolean))] } }, include: withUser, orderBy: { timestamp: 'asc' } });
  const out = new Map();
  for (const r of found) if (ids.has(r.details?.overrideId) && !out.has(r.details.overrideId)) out.set(r.details.overrideId, r);
  return out;
}
function withRevoke(row, rev) {
  if (!rev) return row;
  return { ...row, details: { ...row.details, status: 'REVOKED', revokedBy: rev.user?.email || rev.userId, revokedAt: rev.timestamp.toISOString(), revokeReason: rev.details?.reason || null } };
}
async function load(where, take = 500) {
  const rows = await prisma.auditLog.findMany({ where: { eventType: EVENT, ...where }, include: withUser, orderBy: { timestamp: 'desc' }, take });
  const revoked = await revocations(rows);
  return rows.map((r) => toApi(withRevoke(r, revoked.get(r.id))));
}

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!TYPES.includes(b.type)) return res.status(400).json({ error: `type must be one of: ${TYPES.join(', ')}` });
    if (!text(b.reasonCode, 60)) return res.status(400).json({ error: 'A reason is required' });
    const row = await prisma.auditLog.create({
      data: {
        category: 'WORKFLOW', eventType: EVENT, severity: 'WARNING', action: 'CREATE',
        userId: req.user.id, resourceType: 'Order', resourceId: text(b.orderId, 80),
        ipAddress: text(req.ip, 80), requestPath: '/api/overrides', requestMethod: 'POST', responseCode: 201,
        details: {
          type: b.type, status: 'ACTIVE', reasonCode: text(b.reasonCode, 60), reasonLabel: text(b.reasonLabel, 200),
          notes: text(b.notes, 2000), originalValue: text(b.originalValue, 300), overrideValue: text(b.overrideValue, 300),
          orderNumber: text(b.orderNumber, 80), location: text(b.location, 80), division: text(b.division, 40),
          customerName: text(b.customerName, 200), userRole: req.user.role,
        },
      },
      include: withUser,
    });
    res.status(201).json({ data: toApi(row) });
  } catch (error) {
    console.error('Overrides: create failed:', error);
    res.status(500).json({ error: 'Failed to record the override' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orderId = text(req.query.orderId, 80);
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });
    res.json({ data: await load({ resourceId: orderId }) });
  } catch (error) {
    console.error('Overrides: list failed:', error);
    res.status(500).json({ error: 'Failed to load overrides' });
  }
});

router.get('/count', async (req, res) => {
  try {
    const orderId = text(req.query.orderId, 80);
    if (!orderId) return res.json({ count: 0 });
    const rows = await load({ resourceId: orderId });
    const status = text(req.query.status, 20);
    res.json({ count: rows.filter((o) => !status || o.status === status).length });
  } catch (error) {
    console.error('Overrides: count failed:', error);
    res.status(500).json({ error: 'Failed to count overrides' });
  }
});

const tally = (rows, key, values) => Object.fromEntries(values.map((v) => [v, rows.filter((o) => o[key] === v).length]));

router.get('/audit', managersOnly, async (req, res) => {
  try {
    const q = req.query;
    const where = {};
    if (q.orderId) where.resourceId = String(q.orderId);
    const from = q.dateFrom ? new Date(String(q.dateFrom)) : null;
    const to = q.dateTo ? new Date(String(q.dateTo)) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return res.status(400).json({ error: 'Dates are not valid' });
    if (from || to) where.timestamp = { ...(from && { gte: from }), ...(to && { lte: to }) };
    let rows = await load(where, 2000);
    if (q.type) rows = rows.filter((o) => o.type === q.type);
    if (q.status) rows = rows.filter((o) => o.status === q.status);
    if (q.location) rows = rows.filter((o) => o.location === q.location);
    if (q.user) { const u = String(q.user).toLowerCase(); rows = rows.filter((o) => `${o.user} ${o.userName}`.toLowerCase().includes(u)); }
    res.json({ data: rows, meta: { total: rows.length, byType: tally(rows, 'type', TYPES), byStatus: tally(rows, 'status', ['ACTIVE', 'REVOKED', 'EXPIRED']) } });
  } catch (error) {
    console.error('Overrides: audit failed:', error);
    res.status(500).json({ error: 'Failed to load the override log' });
  }
});

router.get('/stats', managersOnly, async (req, res) => {
  try {
    const rows = await load({}, 5000);
    const today = new Date().toISOString().slice(0, 10);
    const byUser = new Map();
    for (const o of rows) byUser.set(o.user, { user: o.user, userName: o.userName, count: (byUser.get(o.user)?.count || 0) + 1 });
    res.json({ data: {
      totalActive: rows.filter((o) => o.status === 'ACTIVE').length,
      totalAllTime: rows.length,
      todayCount: rows.filter((o) => o.timestamp.startsWith(today)).length,
      byType: tally(rows, 'type', TYPES),
      topUsers: [...byUser.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    } });
  } catch (error) {
    console.error('Overrides: stats failed:', error);
    res.status(500).json({ error: 'Failed to load override figures' });
  }
});

router.post('/:id/revoke', managersOnly, async (req, res) => {
  try {
    const row = await prisma.auditLog.findFirst({ where: { id: req.params.id, eventType: EVENT }, include: withUser });
    if (!row) return res.status(404).json({ error: 'Override not found' });
    if ((await revocations([row])).has(row.id)) return res.status(409).json({ error: 'This override was already revoked' });
    const reason = text(req.body?.reason, 500) || 'Revoked by manager';
    // The revoke is its own history line; the override's line is left as it was written.
    const rev = await prisma.auditLog.create({ data: { category: 'WORKFLOW', eventType: 'ORDER_OVERRIDE_REVOKED', severity: 'WARNING', action: 'REVOKE', userId: req.user.id, resourceType: 'Order', resourceId: row.resourceId, details: { overrideId: row.id, reason } }, include: withUser });
    const updated = withRevoke(row, rev);
    res.json({ data: toApi(updated) });
  } catch (error) {
    console.error('Overrides: revoke failed:', error);
    res.status(500).json({ error: 'Failed to revoke the override' });
  }
});

export default router;
