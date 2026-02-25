import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// GET /api/assets — List all assets
router.get('/', async (req, res) => {
  try {
    const { status, criticality, type, workCenterId } = req.query;
    const where = { isActive: true };
    if (status) where.status = status;
    if (criticality) where.criticality = criticality;
    if (workCenterId) where.workCenterId = workCenterId;
    if (type) where.assetType = { category: type };

    const assets = await prisma.asset.findMany({
      where,
      include: {
        assetType: { select: { id: true, code: true, name: true, category: true } },
        site: { select: { id: true, code: true, name: true } },
        workCenter: { select: { id: true, code: true, name: true } },
        maintenanceOrders: {
          where: { status: { notIn: ['CLOSED', 'CANCELLED'] } },
          select: { id: true, woNumber: true, type: true, status: true, title: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { assetNumber: 'asc' },
    });
    res.json(assets);
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// GET /api/assets/stats — Summary counts
router.get('/stats', async (req, res) => {
  try {
    const [total, inService, down, maintenance] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.asset.count({ where: { isActive: true, status: 'IN_SERVICE' } }),
      prisma.asset.count({ where: { isActive: true, status: { in: ['OUT_OF_SERVICE', 'SAFETY_HOLD', 'QUALITY_HOLD', 'DECOMMISSIONED'] } } }),
      prisma.asset.count({ where: { isActive: true, status: 'MAINTENANCE' } }),
    ]);
    res.json({ total, inService, down: down + maintenance, maintenance });
  } catch (error) {
    console.error('Failed to fetch asset stats:', error);
    res.status(500).json({ error: 'Failed to fetch asset stats' });
  }
});

// GET /api/assets/types — List asset types for dropdowns
router.get('/types', async (req, res) => {
  try {
    const types = await prisma.assetType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(types);
  } catch (error) {
    console.error('Failed to fetch asset types:', error);
    res.status(500).json({ error: 'Failed to fetch asset types' });
  }
});

// POST /api/assets/seed-from-work-centers — Create assets from existing work centers
router.post('/seed-from-work-centers', async (req, res) => {
  try {
    const workCenters = await prisma.workCenter.findMany({
      where: { isActive: true },
      include: { location: true },
    });

    if (workCenters.length === 0) {
      return res.status(400).json({ error: 'No work centers found to seed from' });
    }

    // Ensure a default AssetType exists
    let defaultType = await prisma.assetType.findUnique({ where: { code: 'WORK-CENTER' } });
    if (!defaultType) {
      defaultType = await prisma.assetType.create({
        data: {
          id: 'at-work-center',
          code: 'WORK-CENTER',
          name: 'Work Center Equipment',
          category: 'WORK_CENTER',
          description: 'Equipment associated with a work center',
          defaultCriticality: 'B',
        },
      });
    }

    const results = [];
    for (const wc of workCenters) {
      // Check if asset already exists for this work center
      const existing = await prisma.asset.findFirst({
        where: { workCenterId: wc.id },
      });
      if (existing) {
        results.push({ workCenter: wc.code, status: 'skipped', reason: 'Asset already exists', assetNumber: existing.assetNumber });
        continue;
      }

      const assetNumber = wc.code; // Use work center code as asset number
      // Check if assetNumber already taken
      const numberTaken = await prisma.asset.findUnique({ where: { assetNumber } });
      if (numberTaken) {
        results.push({ workCenter: wc.code, status: 'skipped', reason: 'Asset number already taken' });
        continue;
      }

      const asset = await prisma.asset.create({
        data: {
          assetNumber,
          name: wc.name,
          description: `Work center: ${wc.code} — ${wc.name}`,
          assetTypeId: defaultType.id,
          siteId: wc.locationId,
          workCenterId: wc.id,
          criticality: 'B',
          status: 'IN_SERVICE',
        },
      });
      results.push({ workCenter: wc.code, status: 'created', assetNumber: asset.assetNumber, assetId: asset.id });
    }

    res.json({ message: `Processed ${workCenters.length} work centers`, results });
  } catch (error) {
    console.error('Failed to seed assets from work centers:', error);
    res.status(500).json({ error: 'Failed to seed assets from work centers', details: error.message });
  }
});

// GET /api/assets/:id — Single asset detail
router.get('/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        assetType: true,
        site: true,
        workCenter: true,
        maintenanceOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, woNumber: true, type: true, status: true, title: true,
            priority: true, createdAt: true, completedAt: true, assignedTeam: true,
          },
        },
        components: { orderBy: { name: 'asc' } },
      },
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    console.error('Failed to fetch asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// POST /api/assets — Create a new asset
router.post('/', async (req, res) => {
  try {
    const {
      assetNumber, name, description, assetTypeId, siteId, workCenterId,
      manufacturer, model, serialNumber, criticality, status,
    } = req.body;

    if (!assetNumber || !name || !assetTypeId || !siteId) {
      return res.status(400).json({ error: 'assetNumber, name, assetTypeId, and siteId are required' });
    }

    const asset = await prisma.asset.create({
      data: {
        assetNumber,
        name,
        description: description || null,
        assetTypeId,
        siteId,
        workCenterId: workCenterId || null,
        manufacturer: manufacturer || null,
        model: model || null,
        serialNumber: serialNumber || null,
        criticality: criticality || 'C',
        status: status || 'IN_SERVICE',
      },
      include: {
        assetType: true,
        site: true,
        workCenter: true,
      },
    });
    res.status(201).json(asset);
  } catch (error) {
    console.error('Failed to create asset:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Asset number already exists' });
    }
    res.status(500).json({ error: 'Failed to create asset', details: error.message });
  }
});

// PATCH /api/assets/:id — Update an asset
router.patch('/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        assetType: true,
        site: true,
        workCenter: true,
      },
    });
    res.json(asset);
  } catch (error) {
    console.error('Failed to update asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id — Soft delete an asset
router.delete('/:id', async (req, res) => {
  try {
    await prisma.asset.update({
      where: { id: req.params.id },
      data: { isActive: false, status: 'DECOMMISSIONED' },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
