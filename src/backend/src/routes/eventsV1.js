/**
 * Events API v1 Routes
 * Exception events feed for shop floor and operations dashboards
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// In-memory events store (for demo - would be database in production)
let events = [
  { id: 'EXC-001', type: 'SCRAP', message: 'Material scrap on JOB-2026-003 - 15 lbs aluminum', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: 'FWA', workCenterId: 'SAW-01', acknowledged: false },
  { id: 'EXC-002', type: 'QC_HOLD', message: 'QC hold on JOB-2026-005 - dimension check required', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), severity: 'CRITICAL', locationId: 'FWA', workCenterId: 'SHEAR-01', acknowledged: false },
  { id: 'EXC-003', type: 'DOWNTIME', message: 'Saw Line 1 blade change - 20 min delay', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: 'FWA', workCenterId: 'SAW-01', acknowledged: true },
  { id: 'EXC-004', type: 'REWORK', message: 'Rework needed on JOB-2026-002 - edge finish issue', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), severity: 'INFO', locationId: 'FWA', workCenterId: 'RTR-01', acknowledged: false },
  { id: 'EXC-005', type: 'LATE_MATERIAL', message: 'Material late for JOB-2026-008 - ETA 2 hours', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: 'FWA', workCenterId: null, acknowledged: false },
  { id: 'EXC-006', type: 'MACHINE_ALERT', message: 'Router spindle temp elevated - monitoring', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), severity: 'INFO', locationId: 'FWA', workCenterId: 'RTR-01', acknowledged: true },
  { id: 'EXC-007', type: 'PRIORITY_CHANGE', message: 'JOB-2026-010 upgraded to HOT by customer request', timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: 'FWA', workCenterId: null, acknowledged: false },
  { id: 'EXC-008', type: 'INVENTORY_LOW', message: 'SS-304-0125 below reorder point - 45 lbs remaining', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(), severity: 'CRITICAL', locationId: 'FWA', workCenterId: null, acknowledged: false },
];

// ============================================
// EXCEPTIONS FEED
// ============================================

/**
 * GET /events/exceptions
 * Get exception events feed
 */
router.get('/exceptions', async (req, res) => {
  try {
    const { locationId, workCenterId, type, limit = 20, acknowledged } = req.query;

    let filtered = [...events];

    if (locationId) {
      filtered = filtered.filter(e => e.locationId === locationId);
    }
    if (workCenterId) {
      filtered = filtered.filter(e => e.workCenterId === workCenterId);
    }
    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }
    if (acknowledged !== undefined) {
      const ack = acknowledged === 'true';
      filtered = filtered.filter(e => e.acknowledged === ack);
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    filtered = filtered.slice(0, parseInt(limit));

    res.json(filtered);
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

    const newEvent = {
      id: `EXC-${String(events.length + 1).padStart(3, '0')}`,
      type,
      message,
      severity,
      locationId: locationId || 'FWA',
      workCenterId: workCenterId || null,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    events.unshift(newEvent);
    res.status(201).json(newEvent);
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
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({ error: 'Exception not found' });
    }

    event.acknowledged = true;
    event.acknowledgedAt = new Date().toISOString();
    event.acknowledgedBy = req.body.userId || 'system';

    res.json(event);
  } catch (error) {
    console.error('Error acknowledging exception:', error);
    res.status(500).json({ error: 'Failed to acknowledge exception' });
  }
});

/**
 * GET /events/exceptions/stats
 * Get exception statistics
 */
router.get('/exceptions/stats', async (req, res) => {
  try {
    const { locationId } = req.query;

    let filtered = [...events];
    if (locationId) {
      filtered = filtered.filter(e => e.locationId === locationId);
    }

    // Last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = filtered.filter(e => new Date(e.timestamp) >= cutoff);

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
