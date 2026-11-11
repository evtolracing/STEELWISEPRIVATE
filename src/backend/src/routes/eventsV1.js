/**
 * Events API v1 Routes
 * Exception events feed for shop floor and operations dashboards.
 * Stored in the ExceptionEvent table.
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../lib/db.js';

const router = Router();

/** API shape: the stored row, with occurredAt exposed as `timestamp`. */
function toApi(row) {
  const { occurredAt, acknowledgedAt, createdAt, ...rest } = row;
  const out = { ...rest, timestamp: occurredAt.toISOString() };
  if (acknowledgedAt) out.acknowledgedAt = acknowledgedAt.toISOString();
  if (!out.acknowledgedBy) delete out.acknowledgedBy;
  return out;
}

// ============================================
// EXCEPTIONS FEED
// ============================================

/**
 * GET /events/exceptions
 * Get exception events feed, most recent first
 */
router.get('/exceptions', async (req, res) => {
  try {
    const { locationId, workCenterId, type, limit = 20, acknowledged } = req.query;
    const where = {};
    if (locationId) where.locationId = locationId;
    if (workCenterId) where.workCenterId = workCenterId;
    if (type) where.type = type;
    if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';

    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 500);
    const rows = await prisma.exceptionEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, take });
    res.json(rows.map(toApi));
  } catch (error) {
    console.error('Error fetching exceptions:', error);
    res.status(500).json({ error: 'Failed to fetch exceptions' });
  }
});

/**
 * POST /events/exceptions
 * Create a new exception event
 */
router.post('/exceptions', async (req, res) => {
  try {
    const { type, message, severity = 'INFO', locationId, workCenterId } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'type and message are required' });
    }

    const row = await prisma.exceptionEvent.create({
      data: {
        id: `EXC-${randomUUID().slice(0, 8).toUpperCase()}`,
        type,
        message,
        severity,
        locationId: locationId || 'FWA',
        workCenterId: workCenterId || null,
      },
    });
    res.status(201).json(toApi(row));
  } catch (error) {
    console.error('Error creating exception:', error);
    res.status(500).json({ error: 'Failed to create exception' });
  }
});

/**
 * POST /events/exceptions/:id/acknowledge
 * Acknowledge an exception event
 */
router.post('/exceptions/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.exceptionEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Exception not found' });
    }

    const row = await prisma.exceptionEvent.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.body?.userId || 'system',
      },
    });
    res.json(toApi(row));
  } catch (error) {
    console.error('Error acknowledging exception:', error);
    res.status(500).json({ error: 'Failed to acknowledge exception' });
  }
});

/**
 * GET /events/exceptions/stats
 * Exception statistics for the last 24 hours
 */
router.get('/exceptions/stats', async (req, res) => {
  try {
    const { locationId } = req.query;
    const where = { occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
    if (locationId) where.locationId = locationId;

    const recent = await prisma.exceptionEvent.findMany({
      where,
      select: { type: true, severity: true, acknowledged: true },
    });

    const stats = {
      total: recent.length,
      unacknowledged: recent.filter(e => !e.acknowledged).length,
      critical: recent.filter(e => e.severity === 'CRITICAL').length,
      warning: recent.filter(e => e.severity === 'WARNING').length,
      info: recent.filter(e => e.severity === 'INFO').length,
      byType: {},
    };
    recent.forEach(e => {
      stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching exception stats:', error);
    res.status(500).json({ error: 'Failed to fetch exception stats' });
  }
});

export default router;
