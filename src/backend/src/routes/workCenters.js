import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /work-centers - List work centers with optional location filter
router.get('/', async (req, res) => {
  try {
    const { locationId, isActive } = req.query;
    
    const where = {};
    if (locationId) where.locationId = locationId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const workCenters = await prisma.workCenter.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        location: {
          select: { id: true, code: true, name: true },
        },
      },
    });
    
    res.json(workCenters);
  } catch (error) {
    console.error('Error fetching work centers:', error);
    res.status(500).json({ error: 'Failed to fetch work centers' });
  }
});

// GET /work-centers/:id - Get work center details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const workCenter = await prisma.workCenter.findUnique({
      where: { id },
      include: {
        location: true,
        jobs: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROCESS'] },
          },
          orderBy: { scheduledStart: 'asc' },
          take: 20,
        },
      },
    });
    
    if (!workCenter) {
      return res.status(404).json({ error: 'Work center not found' });
    }
    
    res.json(workCenter);
  } catch (error) {
    console.error('Error fetching work center:', error);
    res.status(500).json({ error: 'Failed to fetch work center' });
  }
});

// POST /work-centers - Create a new work center
router.post('/', async (req, res) => {
  try {
    const { code, name, locationId, capabilities, hourlyRate, setupMinutes, isActive } = req.body;
    
    const workCenter = await prisma.workCenter.create({
      data: {
        code,
        name,
        locationId,
        capabilities: capabilities || [],
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        setupMinutes: setupMinutes ? parseInt(setupMinutes) : null,
        isActive: isActive !== false,
      },
      include: {
        location: true,
      },
    });
    
    res.status(201).json(workCenter);
  } catch (error) {
    console.error('Error creating work center:', error);
    res.status(500).json({ error: 'Failed to create work center' });
  }
});

// PATCH /work-centers/:id - Update work center
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.hourlyRate) {
      updateData.hourlyRate = parseFloat(updateData.hourlyRate);
    }
    if (updateData.setupMinutes) {
      updateData.setupMinutes = parseInt(updateData.setupMinutes);
    }
    
    const workCenter = await prisma.workCenter.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
      },
    });
    
    res.json(workCenter);
  } catch (error) {
    console.error('Error updating work center:', error);
    res.status(500).json({ error: 'Failed to update work center' });
  }
});

// GET /work-centers/:id/schedule - Get work center schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const where = {
      workCenterId: id,
    };
    
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = new Date(startDate);
      if (endDate) where.scheduledStart.lte = new Date(endDate);
    }
    
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { scheduledStart: 'asc' },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching work center schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

export default router;
