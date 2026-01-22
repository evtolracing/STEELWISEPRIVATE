import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { gradeId, status, qcStatus, locationId } = req.query;
    const coils = await prisma.coil.findMany({
      where: {
        ...(gradeId && { gradeId }),
        ...(status && { status }),
        ...(qcStatus && { qcStatus }),
        ...(locationId && { locationId })
      },
      include: { heat: true, grade: true, location: true, product: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(coils);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coils' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const coil = await prisma.coil.findUnique({
      where: { id: req.params.id },
      include: {
        heat: { include: { mill: true } },
        grade: true,
        location: true,
        product: true,
        parentCoil: true,
        childCoils: true,
        inventory: true,
        testResults: true,
        qcHolds: true,
        movements: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!coil) return res.status(404).json({ error: 'Coil not found' });
    res.json(coil);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coil' });
  }
});

router.get('/number/:coilNumber', async (req, res) => {
  try {
    const coil = await prisma.coil.findUnique({
      where: { coilNumber: req.params.coilNumber },
      include: {
        heat: { include: { mill: true } },
        grade: true,
        location: true,
        parentCoil: true,
        childCoils: true
      }
    });
    if (!coil) return res.status(404).json({ error: 'Coil not found' });
    res.json(coil);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coil' });
  }
});

router.post('/', async (req, res) => {
  try {
    const coil = await prisma.coil.create({
      data: req.body,
      include: { heat: true, grade: true }
    });
    res.status(201).json(coil);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coil' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const coil = await prisma.coil.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(coil);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update coil' });
  }
});

router.post('/:id/hold', async (req, res) => {
  try {
    const { holdType, holdReason, holdById } = req.body;
    const [hold, coil] = await prisma.$transaction([
      prisma.qCHold.create({
        data: { coilId: req.params.id, holdType, holdReason, holdById }
      }),
      prisma.coil.update({
        where: { id: req.params.id },
        data: { status: 'HOLD', qcStatus: 'HOLD', holdCode: holdType }
      })
    ]);
    res.status(201).json({ hold, coil });
  } catch (error) {
    res.status(500).json({ error: 'Failed to place hold' });
  }
});

export default router;
