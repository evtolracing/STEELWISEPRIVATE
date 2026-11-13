/**
 * Shipping API v1 Routes
 * Shipping summary and shipment management for dashboard
 */

import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// ============================================
// SHIPPING SUMMARY
// ============================================

/**
 * GET /shipping/summary
 * Get shipping summary stats for dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const { locationId, date } = req.query;

    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      createdAt: { gte: today, lt: tomorrow },
    };
    if (locationId) where.fromLocationId = locationId;

    const count = (statuses) => prisma.shipment.count({ where: { ...where, status: { in: statuses } } });
    // STAGED, PICKING, READY and PACKED are not shipment statuses in the database, so those two are PENDING and LOADING.
    const [todayTotal, staged, readyToShip, dispatched, lateRisk] = await Promise.all([
      prisma.shipment.count({ where }),
      count(['PENDING']),
      count(['LOADING']),
      count(['IN_TRANSIT', 'DELIVERED']),
      // Late risk: past its scheduled date and still on the dock.
      prisma.shipment.count({ where: { ...where, scheduledDate: { lt: new Date() }, status: { in: ['PENDING', 'LOADING'] } } }),
    ]);
    const shipments = { length: todayTotal };

    res.json({
      staged,
      readyToShip,
      dispatched,
      lateRisk,
      todayTotal: shipments.length,
      locationId: locationId || 'ALL',
    });
  } catch (error) {
    console.error('Error fetching shipping summary:', error);
    res.status(500).json({ error: 'Failed to fetch shipping summary' });
  }
});

// ============================================
// SHIPMENTS LIST
// ============================================

/**
 * GET /shipments
 * Get list of shipments with filters
 */
router.get('/', async (req, res) => {
  try {
    const { locationId, status, date, limit = 50 } = req.query;

    const where = {};
    if (locationId) where.fromLocationId = locationId;
    if (status) where.status = status;
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: targetDate, lt: nextDay };
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: {
          include: { buyer: true },
        },
        fromLocation: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    // Transform to dashboard-friendly format
    const result = shipments.map(s => ({
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      customerName: s.order?.buyer?.name || 'Unknown',
      orderNumber: s.order?.orderNumber || 'N/A',
      status: s.status,
      carrier: s.carrier || 'TBD',
      scheduledTime: s.scheduledShipDate ? new Date(s.scheduledShipDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD',
      weight: s.actualWeight || s.estimatedWeight || 0,
      pieces: s.items?.length || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

export default router;
