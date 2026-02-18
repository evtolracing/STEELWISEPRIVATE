import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// Priority mapping: DB stores Int, frontend expects string labels
const PRIORITY_INT_TO_STRING = { 1: 'LOW', 2: 'LOW', 3: 'NORMAL', 4: 'HIGH', 5: 'HOT' }
const PRIORITY_STRING_TO_INT = { LOW: 1, NORMAL: 3, HIGH: 4, RUSH: 4, URGENT: 4, HOT: 5 }

function mapJobForFrontend(job) {
  return {
    ...job,
    // Map numeric priority → string for frontend cards/board
    priority: PRIORITY_INT_TO_STRING[job.priority] || 'NORMAL',
    // Alias operationType → processingType for card display
    processingType: job.operationType || null,
    // Alias scheduledEnd → dueDate for card display
    dueDate: job.scheduledEnd || job.scheduledStart || null,
    // Customer name from related order's buyer
    customerName: job.order?.buyer?.name || (job.instructions ? job.instructions.split(' - ')[0] : null) || 'Unassigned',
    // Material hint from instructions
    material: job.instructions || null,
  }
}

// GET /jobs - List jobs with optional filters
router.get('/', async (req, res) => {
  try {
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
          select: { id: true, orderNumber: true, buyerId: true, buyer: { select: { name: true } } },
        },
        workCenter: {
          select: { id: true, code: true, name: true, locationId: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    const mapped = jobs.map(mapJobForFrontend);
    res.json(mapped);
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
    
    res.json(mapJobForFrontend(job));
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
    const jobNumber = `JOB-${String(jobCount + 1).padStart(5, '0')}`;
    
    // Build data object with only defined fields
    const data = {
      jobNumber,
      priority: typeof priority === 'string' ? (PRIORITY_STRING_TO_INT[priority] || 3) : (priority || 3),
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
    
    res.status(201).json(mapJobForFrontend(jobWithRelations || job));
  } catch (error) {
    console.error('Error creating job:', error);
    console.error('Request body:', req.body);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
});

// GET /jobs/:id/plan - Retrieve existing dispatch plan for a job
router.get('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const dispatchJob = await prisma.dispatchJob.findUnique({
      where: { jobId: id },
      include: {
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!dispatchJob || dispatchJob.operations.length === 0) {
      return res.json({ exists: false, dispatchJob: null, operations: [] });
    }

    // Map to the shape the frontend expects
    const mappedJob = {
      ...dispatchJob,
      thickness: Number(dispatchJob.thickness),
    };
    const mappedOps = dispatchJob.operations.map((op) => ({
      id: op.id,
      jobId: op.dispatchJobId,
      sequence: op.sequence,
      name: op.name,
      requiredWorkCenterType: op.requiredWorkCenterType,
      requiredDivision: op.requiredDivision,
      requiredSkillLevel: op.requiredSkillLevel,
      specialization: op.specialization,
      thickness: Number(op.thickness),
      materialCode: op.materialCode,
      status: op.status,
      assignedWorkCenterId: op.assignedWorkCenterId,
      assignedOperatorId: op.assignedOperatorId,
      scheduledStart: op.scheduledStart,
      scheduledEnd: op.scheduledEnd,
    }));

    res.json({
      exists: true,
      dispatchJob: mappedJob,
      operations: mappedOps,
    });
  } catch (error) {
    console.error('Error fetching job plan:', error);
    res.status(500).json({ error: 'Failed to fetch job plan', details: error.message });
  }
});

// POST /jobs/:id/plan - Plan a job and create dispatch operations
// Persists dispatch job + operations to Supabase via Prisma
router.post('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      operations,  // Array of { workCenterType, name, skillLevel }
      division,
      dueDate,
      materialCode,
      commodity,
      thickness,
      form,
      grade,
      locationId,
    } = req.body;

    // Validate operations array
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        error: 'operations array is required with at least one routing step',
      });
    }

    // Validate each operation's work center type exists (from Supabase)
    for (const op of operations) {
      if (!op.workCenterType) {
        return res.status(400).json({ error: 'Each operation must have a workCenterType' });
      }
      const typeExists = await prisma.workCenterType.findUnique({ where: { id: op.workCenterType } });
      if (!typeExists || !typeExists.isActive) {
        const allActive = await prisma.workCenterType.findMany({ where: { isActive: true }, select: { id: true } });
        return res.status(400).json({
          error: `Unknown or inactive work center type: ${op.workCenterType}`,
          availableTypes: allActive.map((t) => t.id),
        });
      }
    }

    // Find the Prisma job
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        order: {
          select: { id: true, orderNumber: true, buyerId: true, buyer: { select: { name: true } } },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'ORDERED' && job.status !== 'SCHEDULED') {
      return res.status(400).json({
        error: `Job must be in ORDERED or SCHEDULED status to plan. Current status: ${job.status}`,
      });
    }

    // 1. Update Prisma job status to SCHEDULED
    const updateData = {
      status: 'SCHEDULED',
    };
    if (dueDate) {
      updateData.scheduledEnd = new Date(dueDate);
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: { id: true, orderNumber: true, buyerId: true, buyer: { select: { name: true } } },
        },
        workCenter: {
          select: { id: true, code: true, name: true, locationId: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const priorityMap = { 1: 'NORMAL', 2: 'NORMAL', 3: 'NORMAL', 4: 'RUSH', 5: 'HOT' };

    // 2. Upsert dispatch job in database (delete old one if re-planning)
    await prisma.dispatchJob.deleteMany({ where: { jobId: id } });

    const newDispatchJob = await prisma.dispatchJob.create({
      data: {
        jobId: id,
        jobNumber: job.jobNumber,
        orderId: job.orderId || null,
        materialCode: materialCode || job.instructions || 'N/A',
        commodity: commodity || 'METALS',
        form: form || 'PLATE',
        grade: grade || 'A36',
        thickness: thickness || 0.5,
        division: division || 'METALS',
        locationId: locationId || 'FWA',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: priorityMap[job.priority] || 'NORMAL',
        customerName: job.order?.buyer?.name || (job.instructions ? job.instructions.split(' - ')[0] : 'Customer'),
        operations: {
          create: operations.map((op, idx) => ({
            sequence: idx + 1,
            name: op.name || `Step ${idx + 1}: ${op.workCenterType}`,
            requiredWorkCenterType: op.workCenterType,
            requiredDivision: division || 'METALS',
            requiredSkillLevel: op.skillLevel || 'STANDARD',
            specialization: op.specialization || null,
            thickness: thickness || 0.5,
            materialCode: materialCode || job.instructions || 'N/A',
            status: 'PENDING',
          })),
        },
      },
      include: {
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    console.log(`Job ${job.jobNumber} planned: ${newDispatchJob.operations.length} operations persisted to database`);

    res.json({
      success: true,
      job: mapJobForFrontend(updatedJob),
      dispatchJob: { ...newDispatchJob, thickness: Number(newDispatchJob.thickness) },
      operations: newDispatchJob.operations.map((op) => ({
        id: op.id,
        jobId: op.dispatchJobId,
        sequence: op.sequence,
        name: op.name,
        requiredWorkCenterType: op.requiredWorkCenterType,
        requiredDivision: op.requiredDivision,
        requiredSkillLevel: op.requiredSkillLevel,
        specialization: op.specialization,
        thickness: Number(op.thickness),
        materialCode: op.materialCode,
        status: op.status,
        assignedWorkCenterId: op.assignedWorkCenterId,
        assignedOperatorId: op.assignedOperatorId,
        scheduledStart: op.scheduledStart,
        scheduledEnd: op.scheduledEnd,
      })),
    });
  } catch (error) {
    console.error('Error planning job:', error);
    res.status(500).json({ error: 'Failed to plan job', details: error.message });
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
    res.json(mapJobForFrontend(updatedJob));
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
    
    // Convert string priority to int for DB
    if (typeof updateData.priority === 'string') {
      updateData.priority = PRIORITY_STRING_TO_INT[updateData.priority] || 3;
    }
    
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
    
    res.json(mapJobForFrontend(job));
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// PATCH /jobs/:id/status - Update job status (used by PackagingQueue, Material Tracking)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['ORDERED', 'SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const job = await prisma.job.update({
      where: { id },
      data: { status },
      include: {
        order: { select: { id: true, orderNumber: true } },
        workCenter: { select: { id: true, code: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    
    res.json(mapJobForFrontend(job));
  } catch (error) {
    console.error('Error updating job status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// PUT /jobs/:id - Update job (alias for PATCH, used by frontend jobsApi)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert string priority to int for DB
    if (typeof updateData.priority === 'string') {
      updateData.priority = PRIORITY_STRING_TO_INT[updateData.priority] || 3;
    }
    
    // Handle date conversions
    if (updateData.scheduledStart) {
      updateData.scheduledStart = new Date(updateData.scheduledStart);
    }
    if (updateData.scheduledEnd) {
      updateData.scheduledEnd = new Date(updateData.scheduledEnd);
    }

    // Remove virtual fields that don't exist in DB
    delete updateData.processingType;
    delete updateData.dueDate;
    delete updateData.customerName;
    delete updateData.material;
    
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
    
    res.json(mapJobForFrontend(job));
  } catch (error) {
    console.error('Error updating job (PUT):', error);
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

