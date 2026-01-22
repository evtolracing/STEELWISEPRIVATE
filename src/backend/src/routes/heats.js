import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { gradeId, millId, status } = req.query;
    const heats = await prisma.heat.findMany({
      where: {
        ...(gradeId && { gradeId }),
        ...(millId && { millId }),
        ...(status && { status })
      },
      include: { grade: true, mill: true },
      orderBy: { castDate: 'desc' },
      take: 100
    });
    res.json(heats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heats' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const heat = await prisma.heat.findUnique({
      where: { id: req.params.id },
      include: { grade: true, mill: true, coils: true, testResults: true }
    });
    if (!heat) return res.status(404).json({ error: 'Heat not found' });
    res.json(heat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heat' });
  }
});

router.post('/', async (req, res) => {
  try {
    const heat = await prisma.heat.create({
      data: req.body,
      include: { grade: true, mill: true }
    });
    res.status(201).json(heat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create heat' });
  }
});

router.get('/:heatNumber/trace', async (req, res) => {
  try {
    const heat = await prisma.heat.findUnique({
      where: { heatNumber: req.params.heatNumber },
      include: {
        grade: true,
        mill: true,
        coils: {
          include: {
            childCoils: true,
            location: true,
            inventory: true
          }
        },
        testResults: true
      }
    });
    if (!heat) return res.status(404).json({ error: 'Heat not found' });
    res.json(heat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to trace heat' });
  }
});

export default router;
