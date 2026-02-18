import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// GET /api/maintenance-orders — List all maintenance orders
router.get('/', async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const orders = await prisma.maintenanceOrder.findMany({
      where,
      include: {
        asset: {
          select: { id: true, assetNumber: true, name: true, workCenterId: true, status: true, criticality: true }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch maintenance orders:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance orders' });
  }
});

// GET /api/maintenance-orders/stats — Summary counts
router.get('/stats', async (req, res) => {
  try {
    const [total, active, inProgress, waitingParts, breakdowns, completed] = await Promise.all([
      prisma.maintenanceOrder.count(),
      prisma.maintenanceOrder.count({ where: { status: { notIn: ['COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED'] } } }),
      prisma.maintenanceOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.maintenanceOrder.count({ where: { status: 'WAITING_PARTS' } }),
      prisma.maintenanceOrder.count({ where: { type: 'BREAKDOWN', status: { notIn: ['COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED'] } } }),
      prisma.maintenanceOrder.count({ where: { status: { in: ['COMPLETED', 'VERIFIED', 'CLOSED'] } } }),
    ]);
    res.json({ total, active, inProgress, waitingParts, breakdowns, completed });
  } catch (error) {
    console.error('Failed to fetch maintenance order stats:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance order stats' });
  }
});

// GET /api/maintenance-orders/assets/list — List assets for dropdowns
router.get('/assets/list', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        workCenterId: true,
        criticality: true,
        status: true,
        manufacturer: true,
        model: true,
        workCenter: { select: { id: true, code: true, name: true } },
      },
      orderBy: { assetNumber: 'asc' },
    });
    res.json(assets);
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /api/maintenance-orders/:id — Single maintenance order
router.get('/:id', async (req, res) => {
  try {
    const mo = await prisma.maintenanceOrder.findUnique({
      where: { id: req.params.id },
      include: {
        asset: true,
        tasks: { orderBy: { sequence: 'asc' } },
        parts: true,
        labor: true,
      },
    });
    if (!mo) return res.status(404).json({ error: 'Maintenance order not found' });
    res.json(mo);
  } catch (error) {
    console.error('Failed to fetch maintenance order:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance order' });
  }
});

// POST /api/maintenance-orders — Create a new maintenance order
router.post('/', async (req, res) => {
  try {
    const count = await prisma.maintenanceOrder.count();
    const woNumber = `MO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const {
      assetId,
      type,
      priority,
      title,
      description,
      problemCode,
      estimatedHours,
      assignedToId,
      assignedTeam,
      lotoRequired,
      hotWorkRequired,
      confinedSpaceRequired,
      permitRequired,
      scheduledStart,
      scheduledEnd,
      status,
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: 'assetId is required' });
    }
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const mo = await prisma.maintenanceOrder.create({
      data: {
        woNumber,
        assetId,
        type,
        priority: priority || 'NORMAL',
        title,
        description: description || null,
        problemCode: problemCode || null,
        status: status || 'SCHEDULED',
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        assignedToId: assignedToId || null,
        assignedTeam: assignedTeam || null,
        lotoRequired: lotoRequired || false,
        hotWorkRequired: hotWorkRequired || false,
        confinedSpaceRequired: confinedSpaceRequired || false,
        permitRequired: permitRequired || false,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      },
      include: {
        asset: {
          select: { id: true, assetNumber: true, name: true, workCenterId: true }
        },
      },
    });
    res.status(201).json(mo);
  } catch (error) {
    console.error('Failed to create maintenance order:', error);
    res.status(500).json({ error: 'Failed to create maintenance order', details: error.message });
  }
});

// PATCH /api/maintenance-orders/:id — Update a maintenance order
router.patch('/:id', async (req, res) => {
  try {
    const mo = await prisma.maintenanceOrder.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        asset: {
          select: { id: true, assetNumber: true, name: true, workCenterId: true }
        },
      },
    });
    res.json(mo);
  } catch (error) {
    console.error('Failed to update maintenance order:', error);
    res.status(500).json({ error: 'Failed to update maintenance order' });
  }
});

// PUT /api/maintenance-orders/:id/start — Start work
router.put('/:id/start', async (req, res) => {
  try {
    const mo = await prisma.maintenanceOrder.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', actualStart: new Date() },
      include: { asset: true },
    });
    res.json(mo);
  } catch (error) {
    console.error('Failed to start maintenance order:', error);
    res.status(500).json({ error: 'Failed to start maintenance order' });
  }
});

// PUT /api/maintenance-orders/:id/complete — Complete work
router.put('/:id/complete', async (req, res) => {
  try {
    const { actualHours, completionNotes } = req.body || {};
    const mo = await prisma.maintenanceOrder.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date(),
        completedAt: new Date(),
        actualHours: actualHours ? parseFloat(actualHours) : null,
        completionNotes: completionNotes || null,
      },
      include: { asset: true },
    });
    res.json(mo);
  } catch (error) {
    console.error('Failed to complete maintenance order:', error);
    res.status(500).json({ error: 'Failed to complete maintenance order' });
  }
});

// DELETE /api/maintenance-orders/:id — Delete (cancel) a maintenance order
router.delete('/:id', async (req, res) => {
  try {
    await prisma.maintenanceOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel maintenance order:', error);
    res.status(500).json({ error: 'Failed to cancel maintenance order' });
  }
});

export default router;
