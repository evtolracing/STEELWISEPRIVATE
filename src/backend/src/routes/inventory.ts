import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { locationId, status } = req.query;
    const inventory = await prisma.inventory.findMany({
      where: {
        ...(locationId && { locationId: locationId as string }),
        ...(status && { status: status as string })
      },
      include: {
        coil: { include: { grade: true, product: true, heat: true } },
        location: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 200
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const [total, available, allocated, onHold] = await Promise.all([
      prisma.inventory.aggregate({ _sum: { qtyOnHand: true } }),
      prisma.inventory.aggregate({ _sum: { qtyAvailable: true } }),
      prisma.inventory.aggregate({ _sum: { qtyAllocated: true } }),
      prisma.inventory.aggregate({ _sum: { qtyOnHold: true } })
    ]);
    res.json({
      totalOnHand: total._sum.qtyOnHand || 0,
      totalAvailable: available._sum.qtyAvailable || 0,
      totalAllocated: allocated._sum.qtyAllocated || 0,
      totalOnHold: onHold._sum.qtyOnHold || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.post('/receive', async (req, res) => {
  try {
    const { coilId, locationId, qty, userId } = req.body;
    const [inventory, movement] = await prisma.$transaction([
      prisma.inventory.upsert({
        where: { coilId },
        create: { coilId, locationId, qtyOnHand: qty, qtyAvailable: qty },
        update: { qtyOnHand: { increment: qty }, qtyAvailable: { increment: qty } }
      }),
      prisma.materialMovement.create({
        data: {
          coilId, toLocationId: locationId, movementType: 'RECEIVE',
          qtyMoved: qty, createdById: userId
        }
      })
    ]);
    res.status(201).json({ inventory, movement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to receive inventory' });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const { coilId, fromLocationId, toLocationId, qty, userId } = req.body;
    const [inventory, movement] = await prisma.$transaction([
      prisma.inventory.update({
        where: { coilId },
        data: { locationId: toLocationId }
      }),
      prisma.materialMovement.create({
        data: {
          coilId, fromLocationId, toLocationId, movementType: 'TRANSFER',
          qtyMoved: qty, createdById: userId
        }
      })
    ]);
    res.json({ inventory, movement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer inventory' });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

export default router;
