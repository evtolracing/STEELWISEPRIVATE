import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded } from '../lib/numbering.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status, woType } = req.query;
    const workOrders = await prisma.workOrder.findMany({
      where: {
        ...(status && { status }),
        ...(woType && { woType })
      },
      include: { sourceCoil: { include: { grade: true } }, outputs: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(workOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id: req.params.id },
      include: {
        sourceCoil: { include: { grade: true, heat: true, location: true } },
        outputs: { include: { outputCoil: true } }
      }
    });
    if (!wo) return res.status(404).json({ error: 'Work order not found' });
    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const wo = await createNumbered({ count: () => prisma.workOrder.count(), format: padded('WO'), create: (woNumber) => prisma.workOrder.create({
      data: { ...req.body, woNumber },
      include: { sourceCoil: true }
    }) });
    res.status(201).json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

router.put('/:id/start', async (req, res) => {
  try {
    const wo = await prisma.workOrder.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() }
    });
    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start work order' });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const { outputWeightLb, scrapWeightLb, yieldPct } = req.body;
    const wo = await prisma.workOrder.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETE', completedAt: new Date(), outputWeightLb, scrapWeightLb, yieldPct }
    });
    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete work order' });
  }
});

export default router;
