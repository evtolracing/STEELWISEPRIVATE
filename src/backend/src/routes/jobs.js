import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /jobs - List jobs with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, locationId, workCenterId, orderId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (workCenterId) where.workCenterId = workCenterId;
    if (orderId) where.orderId = orderId;
    
    const jobs = await prisma.job.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { scheduledStart: 'asc' },
      ],
      include: {
        order: {
          select: { id: true, orderNumber: true, buyerId: true },
        },
        workCenter: {
          select: { id: true, code: true, name: true, locationId: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /jobs/:id - Get job details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            buyer: true,
            lines: true,
          },
        },
        workCenter: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /jobs - Create a new job
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      workCenterId,
      operationType,
      scheduledStart,
      scheduledEnd,
      priority,
      instructions,
      assignedToId,
      createdById,
    } = req.body;
    
    // Generate job number
    const jobCount = await prisma.job.count();
    const jobNumber = `JOB-${String(jobCount + 1).padStart(6, '0')}`;
    
    const job = await prisma.job.create({
      data: {
        jobNumber,
        orderId,
        workCenterId,
        operationType,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        priority: priority || 5,
        instructions,
        assignedToId,
        createdById,
      },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
        workCenter: {
          select: { id: true, code: true, name: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// POST /jobs/:id/status - Update job status
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scrapWeight, note } = req.body;
    
    // Find job first
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Prepare update data
    const updateData = { status };
    
    // Handle scrapWeight accumulation
    if (typeof scrapWeight === 'number') {
      updateData.scrapWeightLb = (job.scrapWeightLb || 0) + scrapWeight;
    }
    
    // Handle note
    if (note) {
      updateData.notes = note;
    }
    
    // Set timestamps based on status
    if (status === 'IN_PROCESS' && !job.actualStart) {
      updateData.actualStart = new Date();
    } else if (['COMPLETED', 'READY_TO_SHIP', 'SHIPPED'].includes(status) && !job.actualEnd) {
      updateData.actualEnd = new Date();
    }
    
    // Update job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: { id: true, orderNumber: true, buyerId: true },
        },
        workCenter: {
          select: { id: true, code: true, name: true, locationId: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// PATCH /jobs/:id - Update job details
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle date conversions
    if (updateData.scheduledStart) {
      updateData.scheduledStart = new Date(updateData.scheduledStart);
    }
    if (updateData.scheduledEnd) {
      updateData.scheduledEnd = new Date(updateData.scheduledEnd);
    }
    
    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
        workCenter: {
          select: { id: true, code: true, name: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// POST /jobs/:id/assign - Assign job to operator
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const job = await prisma.job.update({
      where: { id },
      data: { assignedToId: userId },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    
    res.json({
      message: 'Job assigned successfully',
      job,
    });
  } catch (error) {
    console.error('Error assigning job:', error);
    res.status(500).json({ error: 'Failed to assign job' });
  }
});

export default router;
