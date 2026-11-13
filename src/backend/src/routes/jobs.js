import { Router } from 'express';
import prisma from '../lib/db.js';
import { onJobStatusChange } from '../services/printAutomationService.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { JOB_STATUSES, jobMoveError } from '../lib/workflowRules.js';
import { shipForJob } from './shipments.js';
import { recordJobMove, recordJobAssignment, jobHistory } from '../lib/jobHistory.js';

const router = Router();

/** A job tied to an order is shipped by its shipment. null when marking it SHIPPED by hand is fine. */
async function shippedByHandError(job, to) {
  if (to !== 'SHIPPED' || !job.orderId) return null;
  const left = await prisma.shipment.count({
    where: { orderId: job.orderId, status: { in: ['IN_TRANSIT', 'DELIVERED', 'EXCEPTION'] }, ...(job.orderLineId && { items: { some: { orderLineId: job.orderLineId } } }) },
  });
  return left ? null : 'This job is for a customer order, so it is marked shipped when its shipment is dispatched. Nothing has shipped for it yet.';
}

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

// Fields a person may change on a job. Anything else in the request is ignored,
// so the job number, timestamps and who created it can't be overwritten.
const JOB_EDIT_FIELDS = [
  'orderId', 'orderLineId', 'workCenterId', 'workOrderId', 'assignedToId', 'operatorId', 'operationType', 'priority',
  'scheduledStart', 'scheduledEnd', 'inputWeightLb', 'outputWeightLb', 'scrapWeightLb', 'instructions', 'notes',
  'shippingCarrier', 'trackingNumber', 'hasCustomRouting', 'recipeId', 'recipeVersion', 'thicknessIn', 'widthIn',
  'lengthIn', 'gradeOverride', 'surfaceFinish', 'tolerancePreset', 'thkTolerancePlus', 'thkToleranceMinus',
  'lenTolerancePlus', 'lenToleranceMinus', 'widTolerancePlus', 'widToleranceMinus', 'certRequirements', 'specNotes',
  'specsInherited',
];
const JOB_WEIGHTS = ['inputWeightLb', 'outputWeightLb', 'scrapWeightLb'];
const JOB_INCLUDE = {
  order: { select: { id: true, orderNumber: true } },
  workCenter: { select: { id: true, code: true, name: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
};

/** Timestamps that go with a status change. */
function stampsFor(job, status) {
  if (status === 'IN_PROCESS' && !job.actualStart) return { actualStart: new Date() };
  if (['COMPLETED', 'READY_TO_SHIP', 'SHIPPED'].includes(status) && !job.actualEnd) return { actualEnd: new Date() };
  return {};
}

/** Shared by PATCH and PUT /jobs/:id. */
async function editJob(req, res) {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const body = req.body || {};
    const data = {};
    for (const f of JOB_EDIT_FIELDS) if (body[f] !== undefined) data[f] = body[f];
    if (typeof data.priority === 'string') data.priority = PRIORITY_STRING_TO_INT[data.priority] || 3;
    for (const f of ['scheduledStart', 'scheduledEnd']) {
      if (data[f]) {
        data[f] = new Date(data[f]);
        if (Number.isNaN(data[f].getTime())) return res.status(400).json({ error: `${f} is not a valid date` });
      }
    }
    for (const f of JOB_WEIGHTS) {
      if (data[f] != null && !(Number(data[f]) >= 0)) return res.status(400).json({ error: `${f} must be zero or more` });
    }
    // Once work has started, the job stays tied to the order it was cut for.
    const relinking = ['orderId', 'orderLineId'].some((f) => data[f] !== undefined && data[f] !== job[f]);
    if (relinking && !['ORDERED', 'SCHEDULED', 'ON_HOLD'].includes(job.status)) {
      return res.status(409).json({ error: 'This job has started, so it cannot be moved to a different order' });
    }
    const moving = body.status !== undefined && body.status !== job.status;
    if (moving) {
      const why = jobMoveError(job.status, body.status) || await shippedByHandError(job, body.status);
      if (why) return res.status(JOB_STATUSES.includes(body.status) ? 409 : 400).json({ error: why });
      Object.assign(data, { status: body.status }, stampsFor(job, body.status));
    } else if (['COMPLETED', 'CANCELLED'].includes(job.status) && Object.keys(data).length) {
      return res.status(409).json({ error: `A ${job.status.toLowerCase()} job cannot be changed` });
    }
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to update' });

    const updated = await prisma.job.update({ where: { id: job.id }, data, include: JOB_INCLUDE });
    if (data.assignedToId !== undefined) await recordJobAssignment(prisma, { job, fromUserId: job.assignedToId, toUserId: data.assignedToId, userId: req.user?.id });
    if (moving) {
      await recordJobMove(prisma, { job, from: job.status, to: body.status, via: 'edit', userId: req.user?.id });
      onJobStatusChange(updated, body.status, job.status).catch((e) => console.error('[PrintAutomation] status hook error:', e.message));
    }
    res.json(mapJobForFrontend(updated));
  } catch (error) {
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'Job has a field that is not valid' });
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
}

// GET /jobs - List jobs with optional filters
// List limits. With no status filter the list is every open job plus the most
// recently finished ones; ask for a status (or an order) to page through history.
const JOB_LIST_DEFAULT = 1000;
const JOB_LIST_MAX = 5000;
const JOB_LIST_RECENT_FINISHED = 200;
const FINISHED_JOB_STATUSES = ['SHIPPED', 'COMPLETED', 'CANCELLED'];

router.get('/', async (req, res) => {
  try {
    // No database configured: say so. Sample jobs are never sent as if they were real.
    if (!prisma) return res.status(503).json({ error: 'The database is not configured' });

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
    // Jobs scheduled to start inside a window (the Schedule screen asks for one day).
    const window = {};
    for (const [name, op] of [['scheduledFrom', 'gte'], ['scheduledTo', 'lt']]) {
      const value = req.query[name];
      if (value === undefined || value === '') continue;
      const d = new Date(value);
      if (typeof value !== 'string' || Number.isNaN(d.getTime())) return res.status(400).json({ error: `${name} is not a valid date` });
      window[op] = d;
    }
    const scheduled = Object.keys(window).length > 0;
    if (scheduled) where.scheduledStart = window;

    const include = {
      order: {
        select: { id: true, orderNumber: true, buyerId: true, buyer: { select: { name: true } } },
      },
      workCenter: {
        select: { id: true, code: true, name: true, locationId: true },
      },
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    };
    const orderBy = [{ priority: 'desc' }, { scheduledStart: 'asc' }, { id: 'asc' }];
    // The reply is capped so a board never downloads the whole job history.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || JOB_LIST_DEFAULT, 1), JOB_LIST_MAX);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    let jobs;
    let total;
    if (status || orderId || scheduled) {
      [jobs, total] = await Promise.all([
        prisma.job.findMany({ where, orderBy, include, take: limit, skip: offset }),
        prisma.job.count({ where }),
      ]);
    } else {
      // No status asked for: every open job first, then the most recently finished ones.
      const open = { ...where, status: { notIn: FINISHED_JOB_STATUSES } };
      const finished = { ...where, status: { in: FINISHED_JOB_STATUSES } };
      const [openJobs, openCount, finishedCount] = await Promise.all([
        prisma.job.findMany({ where: open, orderBy, include, take: limit, skip: offset }),
        prisma.job.count({ where: open }),
        prisma.job.count({ where: finished }),
      ]);
      const room = Math.min(limit - openJobs.length, JOB_LIST_RECENT_FINISHED);
      const recent = room > 0 && offset === 0
        ? await prisma.job.findMany({ where: finished, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], include, take: room })
        : [];
      jobs = [...openJobs, ...recent];
      total = openCount + finishedCount;
    }
    res.setHeader('X-Total-Count', String(total));
    if (jobs.length < total) res.setHeader('X-Result-Limited', 'true');

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
      status,
    } = req.body || {};
    
    if (status && !JOB_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${JOB_STATUSES.join(', ')}` });
    }
    if (status && !['ORDERED', 'SCHEDULED', 'ON_HOLD'].includes(status)) {
      return res.status(400).json({ error: 'A new job starts as ORDERED, SCHEDULED or ON_HOLD' });
    }
    for (const [name, value] of [['scheduledStart', scheduledStart], ['scheduledEnd', scheduledEnd]]) {
      if (value && Number.isNaN(new Date(value).getTime())) return res.status(400).json({ error: `${name} is not a valid date` });
    }

    // A job has to say what it is: the order it is for, where it runs, or what to do (B-008).
    if (!orderId && !req.body.orderLineId && !workCenterId && !(typeof instructions === 'string' && instructions.trim())) {
      return res.status(400).json({ error: 'A job needs an order, a work center or instructions' });
    }

    // Build data object with only defined fields
    const data = {
      priority: typeof priority === 'string' ? (PRIORITY_STRING_TO_INT[priority] || 3) : (priority || 3),
      status: status || 'SCHEDULED',
    };
    
    // Add optional fields only if provided
    if (orderId) data.orderId = orderId;
    // The order line this job makes. It ties the job to what ships.
    const orderLineId = req.body.orderLineId;
    if (orderLineId) {
      const line = typeof orderLineId === 'string' ? await prisma.orderLine.findUnique({ where: { id: orderLineId }, select: { orderId: true } }).catch(() => null) : null;
      if (!line || (orderId && line.orderId !== orderId)) return res.status(400).json({ error: 'orderLineId is not a line on this order' });
      data.orderLineId = orderLineId;
      data.orderId = line.orderId;
    }
    if (workCenterId) data.workCenterId = workCenterId;
    if (operationType) data.operationType = operationType;
    if (instructions) data.instructions = instructions;
    if (assignedToId) data.assignedToId = assignedToId;
    data.createdById = req.user.id; // the signed-in person, never an id sent in the request
    if (scheduledStart) data.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) data.scheduledEnd = new Date(scheduledEnd);
    
    const job = await createNumbered({
      count: () => prisma.job.count(),
      format: padded('JOB'),
      create: (jobNumber) => prisma.job.create({ data: { ...data, jobNumber } }),
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
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'Job has a field that is not valid (check the order, work center and assignee)' });
    }
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
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

    // A dispatch job belongs to the branch the work is done at: the job's work center, else the order's
    // branch, else the planner's home branch. (It used to default to the text 'FWA', which is not a branch.)
    const planned = await prisma.job.findUnique({ where: { id }, select: { workCenter: { select: { locationId: true } }, order: { select: { locationId: true } } } });
    const branchId = locationId || planned?.workCenter?.locationId || planned?.order?.locationId || req.user?.homeLocationId;
    if (!branchId) return res.status(400).json({ error: 'Choose the branch this job will be worked at' });

    // One step (B-010): the job, the old plan and the new plan change together or not at all.
    const { updatedJob, newDispatchJob } = await prisma.$transaction(async (tx) => {
    if (job.status !== 'SCHEDULED') await recordJobMove(tx, { job, from: job.status, to: 'SCHEDULED', note: 'Planned', via: 'plan', userId: req.user?.id });
    const updatedJob = await tx.job.update({
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
    await tx.dispatchJob.deleteMany({ where: { jobId: id } });

    const newDispatchJob = await tx.dispatchJob.create({
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
        locationId: branchId,
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
    return { updatedJob, newDispatchJob };
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
    const { status, scrapWeight, note } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const why = jobMoveError(job.status, status) || await shippedByHandError(job, status);
    if (why) return res.status(JOB_STATUSES.includes(status) ? 409 : 400).json({ error: why });

    const updateData = { status, ...stampsFor(job, status) };
    if (scrapWeight != null) {
      if (typeof scrapWeight !== 'number' || !Number.isFinite(scrapWeight) || scrapWeight < 0) {
        return res.status(400).json({ error: 'scrapWeight must be zero or more' });
      }
      updateData.scrapWeightLb = Number(job.scrapWeightLb || 0) + scrapWeight;
    }
    // The note says why the job moved. It belongs to the move, so it goes in the
    // job's history; the job's own notes are left as they were.
    // The move applies only if the job is still in the status it was checked in, and it is saved
    // together with its history line. Two people moving the same job cannot both succeed (C-005).
    const updatedJob = await prisma.$transaction(async (tx) => {
      const moved = await tx.job.updateMany({ where: { id, status: job.status }, data: updateData });
      if (!moved.count) return null;
      await recordJobMove(tx, { job, from: job.status, to: status, note, userId: req.user?.id });
      return tx.job.findUnique({
        where: { id },
        include: {
          order: { select: { id: true, orderNumber: true, buyerId: true } },
          workCenter: { select: { id: true, code: true, name: true, locationId: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });
    if (!updatedJob) return res.status(409).json({ error: 'This job was changed by someone else a moment ago. Reload it and try again.' });
    res.json(mapJobForFrontend(updatedJob));
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// PATCH /jobs/:id - Update job details
router.patch('/:id', editJob);

// PATCH /jobs/:id/status - Update job status (used by PackagingQueue, Material Tracking)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const prevJob = await prisma.job.findUnique({ where: { id } });
    if (!prevJob) return res.status(404).json({ error: 'Job not found' });
    const why = jobMoveError(prevJob.status, status) || await shippedByHandError(prevJob, status);
    if (why) return res.status(JOB_STATUSES.includes(status) ? 409 : 400).json({ error: why });
    const oldStatus = prevJob.status;

    // Same rule as POST /:id/status: only if the job is still where it was checked, with its history line.
    const job = await prisma.$transaction(async (tx) => {
      const moved = await tx.job.updateMany({ where: { id, status: oldStatus }, data: { status, ...stampsFor(prevJob, status) } });
      if (!moved.count) return null;
      await recordJobMove(tx, { job: prevJob, from: oldStatus, to: status, note: req.body?.note, userId: req.user?.id });
      return tx.job.findUnique({
        where: { id },
        include: {
          order: { include: { buyer: true } },
          workCenter: { select: { id: true, code: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });
    if (!job) return res.status(409).json({ error: 'This job was changed by someone else a moment ago. Reload it and try again.' });

    // Auto-queue print jobs based on status transition
    if (oldStatus !== status) {
      onJobStatusChange(job, status, oldStatus).catch((e) =>
        console.error('[PrintAutomation] status hook error:', e.message)
      );
    }

    res.json(mapJobForFrontend(job));
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// PUT /jobs/:id - Update job (alias for PATCH, used by frontend jobsApi)
router.put('/:id', editJob);

// POST /jobs/:id/assign - Assign job to operator
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body?.userId ?? null;
    if (userId !== null && typeof userId !== 'string') return res.status(400).json({ error: 'userId must be a user id, or null to remove the assignment' });

    const before = await prisma.job.findUnique({ where: { id } });
    if (!before) return res.status(404).json({ error: 'Job not found' });
    if (['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(before.status)) {
      return res.status(409).json({ error: `A ${before.status.toLowerCase()} job cannot be assigned` });
    }
    if (userId) {
      const person = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } }).catch(() => null);
      if (!person) return res.status(400).json({ error: 'That user is not on file' });
      if (!person.isActive) return res.status(400).json({ error: 'That user is not active, so work cannot be assigned to them' });
    }

    const job = await prisma.job.update({
      where: { id },
      data: { assignedToId: userId },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    await recordJobAssignment(prisma, { job: before, fromUserId: before.assignedToId, toUserId: userId, userId: req.user?.id });

    res.json({
      message: userId ? 'Job assigned successfully' : 'Assignment removed',
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
      actualStart: job.actualStart || new Date(),
    };
    
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
    await recordJobMove(prisma, { job, from: job.status, to: 'IN_PROCESS', note, via: 'start', userId: req.user?.id });

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
    
    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        order: { include: { buyer: true } },
        workCenter: { select: { id: true, code: true, name: true, locationId: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await recordJobMove(prisma, { job, from: job.status, to: 'READY_TO_SHIP', note, via: 'complete', userId: req.user?.id });

    // Auto-queue shipping label
    onJobStatusChange(updatedJob, 'READY_TO_SHIP', job.status).catch((e) =>
      console.error('[PrintAutomation] complete hook error:', e.message)
    );
    
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
    
    // For a customer order this is a real shipment: stock, the order and the invoice follow.
    let shipment = null;
    try {
      shipment = await shipForJob(job, { carrier, trackingNumber, userId: req.user.id });
    } catch (error) {
      if (error?.status && error.status < 500) return res.status(error.status).json({ error: error.message });
      throw error;
    }
    if (!shipment) {
      const why = await shippedByHandError(job, 'SHIPPED');
      if (why) return res.status(409).json({ error: why });
    }

    const updateData = {
      status: 'SHIPPED',
      shippedAt: new Date(),
      shippingCarrier: carrier,
      trackingNumber: trackingNumber,
    };
    
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
    
    await recordJobMove(prisma, { job, from: job.status, to: 'SHIPPED', note: note || `Shipped via ${carrier} - ${trackingNumber}`, via: 'ship', userId: req.user?.id });

    res.json({ ...updatedJob, shipment: shipment && { id: shipment.id, shipmentNumber: shipment.shipmentNumber, invoice: shipment.invoice } });
  } catch (error) {
    console.error('Error shipping job:', error);
    res.status(500).json({ error: 'Failed to ship job' });
  }
});

// GET /jobs/:id/history - Get job status history
router.get('/:id/history', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { createdBy: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(await jobHistory(job));
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

