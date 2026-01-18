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

// POST /jobs/:id/start - Start a job (change from SCHEDULED to IN_PROCESS)
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'SCHEDULED' && job.status !== 'ORDERED') {
      return res.status(400).json({ error: `Cannot start job with status ${job.status}` });
    }
    
    const updateData = {
      status: 'IN_PROCESS',
      actualStart: new Date(),
    };
    
    if (note) {
      updateData.notes = note;
    }
    
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
    console.error('Error starting job:', error);
    res.status(500).json({ error: 'Failed to start job' });
  }
});

// POST /jobs/:id/complete - Complete a job (mark as READY_TO_SHIP)
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'IN_PROCESS' && job.status !== 'PACKAGING') {
      return res.status(400).json({ error: `Cannot complete job with status ${job.status}` });
    }
    
    const updateData = {
      status: 'READY_TO_SHIP',
      actualEnd: new Date(),
    };
    
    if (note) {
      updateData.notes = note;
    }
    
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
    console.error('Error completing job:', error);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

// POST /jobs/:id/ship - Ship a job
router.post('/:id/ship', async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, note } = req.body;
    
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ error: 'Carrier and tracking number are required' });
    }
    
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'READY_TO_SHIP') {
      return res.status(400).json({ error: `Cannot ship job with status ${job.status}` });
    }
    
    const updateData = {
      status: 'SHIPPED',
      shippedAt: new Date(),
      shippingCarrier: carrier,
      trackingNumber: trackingNumber,
    };
    
    if (note) {
      updateData.notes = note;
    }
    
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
    console.error('Error shipping job:', error);
    res.status(500).json({ error: 'Failed to ship job' });
  }
});

// GET /jobs/:id/history - Get job status history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Build history from job data
    const history = [];
    
    if (job.createdAt) {
      history.push({
        timestamp: job.createdAt,
        status: 'ORDERED',
        note: 'Job created',
      });
    }
    
    if (job.actualStart) {
      history.push({
        timestamp: job.actualStart,
        status: 'IN_PROCESS',
        note: 'Job started',
      });
    }
    
    if (job.actualEnd) {
      history.push({
        timestamp: job.actualEnd,
        status: 'READY_TO_SHIP',
        note: 'Job completed',
      });
    }
    
    if (job.shippedAt) {
      history.push({
        timestamp: job.shippedAt,
        status: 'SHIPPED',
        note: job.trackingNumber ? `Shipped via ${job.shippingCarrier} - ${job.trackingNumber}` : 'Shipped',
      });
    }
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching job history:', error);
    res.status(500).json({ error: 'Failed to fetch job history' });
  }
});

// GET /jobs/stats/summary - Get job statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { locationId, workCenterId, divisionId } = req.query;
    
    const where = {};
    if (locationId) where.locationId = locationId;
    if (workCenterId) where.workCenterId = workCenterId;
    // Note: divisionId would need to be joined through workCenter if needed
    
    const statusCounts = await prisma.job.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });
    
    const stats = {
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      total: statusCounts.reduce((sum, item) => sum + item._count.id, 0),
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export default router;

