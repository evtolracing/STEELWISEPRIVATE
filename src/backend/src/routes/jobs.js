import { Router } from 'express';
import prisma from '../lib/db.js';
import { supabase } from '../config/supabaseClient.js';

const router = Router();

// GET /jobs - List jobs with optional filters
router.get('/', async (req, res) => {
  try {
    // Try Supabase JS client first if available
    if (supabase) {
      try {
        const { data: jobs, error } = await supabase
          .from('Job')  // Prisma uses PascalCase (capital J)
          .select('*')
          .order('createdAt', { ascending: false })
          .limit(100);

        if (!error && jobs) {
          return res.json(jobs);
        }
        console.error('Supabase query failed, falling back:', error);
      } catch (supabaseError) {
        console.error('Supabase query failed, falling back:', supabaseError);
      }
    }

    // Return mock data if Prisma is not configured
    if (!prisma) {
      const mockJobs = [
        {
          id: '1',
          jobNumber: 'JOB-000001',
          operationType: 'SLITTING',
          instructions: 'Slit 48" x 0.125" CR coil into 12" strips',
          priority: 5,
          status: 'SCHEDULED',
          scheduledStart: new Date('2026-02-10T08:00:00Z'),
          scheduledEnd: new Date('2026-02-10T12:00:00Z'),
          order: { id: '1', orderNumber: 'SO-1001', buyerId: 'CUST-001' },
          workCenter: { id: '1', code: 'SLIT-01', name: 'Slitter #1', locationId: 'LOC-01' },
          assignedTo: null
        }
      ];
      return res.json(mockJobs);
    }

    // Fall back to Prisma
    const { status, locationId, workCenterId, orderId } = req.query;
    
    const where = {};
    // Handle comma-separated status values
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }
    // Filter by work center location
    if (locationId) {
      where.workCenter = { locationId };
    }
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

// GET /jobs/sla-risk - Get jobs at risk of missing SLA
router.get('/sla-risk', async (req, res) => {
  try {
    const { locationId, hoursAhead = 24 } = req.query;

    const where = {
      status: { in: ['SCHEDULED', 'IN_PROCESS'] },
      scheduledEnd: { not: null },
    };
    // Filter by work center location
    if (locationId) {
      where.workCenter = { locationId };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { scheduledEnd: 'asc' },
      include: {
        order: {
          include: { buyer: { select: { name: true } } },
        },
        workCenter: true,
      },
    });

    // Calculate SLA risk based on scheduledEnd
    const now = new Date();
    const riskThreshold = new Date(now.getTime() + parseInt(hoursAhead) * 60 * 60 * 1000);

    const atRiskJobs = jobs.filter(job => {
      if (!job.scheduledEnd) return false;
      const due = new Date(job.scheduledEnd);
      return due <= riskThreshold;
    }).map(job => {
      const due = new Date(job.scheduledEnd);
      const hoursRemaining = Math.round((due - now) / (1000 * 60 * 60));
      
      let riskLevel = 'LOW';
      if (hoursRemaining < 0) riskLevel = 'OVERDUE';
      else if (hoursRemaining < 4) riskLevel = 'CRITICAL';
      else if (hoursRemaining < 12) riskLevel = 'HIGH';
      else if (hoursRemaining < 24) riskLevel = 'MEDIUM';

      return {
        id: job.id,
        jobNumber: job.jobNumber,
        operationType: job.operationType,
        status: job.status,
        priority: job.priority,
        dueDate: job.scheduledEnd,
        hoursRemaining,
        riskLevel,
        customerName: job.order?.buyer?.name || 'Unknown',
        orderNumber: job.order?.orderNumber || 'N/A',
        workCenter: job.workCenter?.name || 'Unassigned',
      };
    });

    // Sort by risk (overdue first, then by hours remaining)
    atRiskJobs.sort((a, b) => {
      const riskOrder = { OVERDUE: 0, CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return (riskOrder[a.riskLevel] || 5) - (riskOrder[b.riskLevel] || 5);
    });

    res.json({
      total: atRiskJobs.length,
      overdue: atRiskJobs.filter(j => j.riskLevel === 'OVERDUE').length,
      critical: atRiskJobs.filter(j => j.riskLevel === 'CRITICAL').length,
      high: atRiskJobs.filter(j => j.riskLevel === 'HIGH').length,
      medium: atRiskJobs.filter(j => j.riskLevel === 'MEDIUM').length,
      jobs: atRiskJobs,
    });
  } catch (error) {
    console.error('Error fetching SLA risk jobs:', error);
    res.status(500).json({ error: 'Failed to fetch SLA risk jobs' });
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
      status,
    } = req.body;
    
    // Generate job number
    const jobCount = await prisma.job.count();
    const jobNumber = `JOB-${String(jobCount + 1).padStart(6, '0')}`;
    
    // Build data object with only defined fields
    const data = {
      jobNumber,
      priority: priority || 3,
      status: status || 'SCHEDULED',
    };
    
    // Add optional fields only if provided
    if (orderId) data.orderId = orderId;
    if (workCenterId) data.workCenterId = workCenterId;
    if (operationType) data.operationType = operationType;
    if (instructions) data.instructions = instructions;
    if (assignedToId) data.assignedToId = assignedToId;
    if (createdById) data.createdById = createdById;
    if (scheduledStart) data.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) data.scheduledEnd = new Date(scheduledEnd);
    
    const job = await prisma.job.create({
      data,
    });
    
    // Fetch with includes only if relations exist
    const jobWithRelations = await prisma.job.findUnique({
      where: { id: job.id },
      include: {
        order: orderId ? {
          select: { id: true, orderNumber: true },
        } : false,
        workCenter: workCenterId ? {
          select: { id: true, code: true, name: true },
        } : false,
        assignedTo: assignedToId ? {
          select: { id: true, firstName: true, lastName: true },
        } : false,
      },
    });
    
    res.status(201).json(jobWithRelations || job);
  } catch (error) {
    console.error('Error creating job:', error);
    console.error('Request body:', req.body);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
});

// POST /jobs/:id/status - Update job status
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scrapWeight, note } = req.body;
    
    console.log('Updating job status:', { id, status, scrapWeight, note });
    
    // Find job first
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      console.log('Job not found:', id);
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
    
    console.log('Update data:', updateData);
    
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
    
    console.log('Job updated successfully');
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job status:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update job status', details: error.message });
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

