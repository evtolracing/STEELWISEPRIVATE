import { Router } from 'express';
import prisma from '../lib/db.js';
import { onJobStatusChange } from '../services/printAutomationService.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { JOB_STATUSES, UNFINISHED_JOB_STATUSES, jobMoveError } from '../lib/workflowRules.js';
import { shipForJob } from './shipments.js';
import { recordJobAssignment, jobHistory } from '../lib/jobHistory.js';
import { changeJobStatusTx, sendRefusal, afterProduction } from '../lib/jobGates.js';
import { jobMaterial, jobCost, publicMaterial } from '../lib/costing.js';
import { COST_VIEWERS } from '../lib/roleAccess.js';

const router = Router();
const STALE = 'This job was changed by someone else a moment ago. Reload it and try again.';

/** A job tied to an order is shipped by its shipment. null when marking it SHIPPED by hand is fine. */
async function shippedByHandError(job, to) {
  if (to !== 'SHIPPED' || !job.orderId) return null;
  const left = await prisma.shipment.count({
    where: { orderId: job.orderId, status: { notIn: ['PENDING', 'LOADING', 'CANCELLED'] }, ...(job.orderLineId && { items: { some: { orderLineId: job.orderLineId } } }) },
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
    // A job runs a routing that is in use, on a work center that is on file and online.
    if (data.recipeId && data.recipeId !== job.recipeId) {
      const recipe = typeof data.recipeId === 'string' ? await prisma.bomRecipe.findUnique({ where: { id: data.recipeId }, select: { status: true, version: true, code: true } }).catch(() => null) : null;
      if (!recipe) return res.status(400).json({ error: 'That routing is not on file' });
      if (recipe.status !== 'ACTIVE') return res.status(409).json({ error: `Routing ${recipe.code} is ${recipe.status.toLowerCase()}. Only a routing that is in use can be put on a job.` });
      if (body.recipeVersion === undefined) data.recipeVersion = recipe.version;
    }
    if (data.workCenterId && data.workCenterId !== job.workCenterId) {
      const place = typeof data.workCenterId === 'string' ? await prisma.workCenter.findUnique({ where: { id: data.workCenterId }, select: { isActive: true, name: true } }).catch(() => null) : null;
      if (!place) return res.status(400).json({ error: 'That work center is not on file' });
      if (!place.isActive) return res.status(409).json({ error: `${place.name} is offline, so work cannot be put on it` });
      // A job with steps planned at one branch is not moved to a work center at another.
      const plan = await prisma.dispatchJob.findUnique({ where: { jobId: job.id }, select: { locationId: true } });
      const at = await prisma.workCenter.findUnique({ where: { id: data.workCenterId }, select: { locationId: true } });
      if (plan && at && plan.locationId !== at.locationId) return res.status(409).json({ error: 'This job has steps planned at another branch. Re-plan it there before moving it.' });
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
    } else if (['COMPLETED', 'CANCELLED'].includes(job.status) && Object.keys(data).length) {
      return res.status(409).json({ error: `A ${job.status.toLowerCase()} job cannot be changed` });
    }
    if (!moving && !Object.keys(data).length) return res.status(400).json({ error: 'Nothing to update' });

    // One step, with the job locked: the edit applies to the job as it is now, not as it was read above.
    // A status change goes through the same gates as every other route (lib/jobGates.js).
    const updated = await prisma.$transaction(async (tx) => {
      const { before } = await changeJobStatusTx(tx, job.id, moving ? body.status : job.status, {
        from: [job.status], fromError: () => 'This job was changed by someone else a moment ago. Reload it and try again.',
        data, via: 'edit', userId: req.user?.id,
      });
      if (data.assignedToId !== undefined) await recordJobAssignment(tx, { job: before, fromUserId: before.assignedToId, toUserId: data.assignedToId, userId: req.user?.id });
      return tx.job.findUnique({ where: { id: job.id }, include: JOB_INCLUDE });
    });
    if (moving) onJobStatusChange(updated, body.status, job.status).catch((e) => console.error('[PrintAutomation] status hook error:', e.message));
    res.json(mapJobForFrontend(updated));
  } catch (error) {
    if (error?.refused) return res.status(error.status === 400 ? 409 : error.status).json({ error: error.message });
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
const SLA_LIST_MAX = 500;
router.get('/sla-risk', async (req, res) => {
  try {
    const { locationId, hoursAhead = 24 } = req.query;

    const hours = Number(hoursAhead);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24 * 90) return res.status(400).json({ error: 'hoursAhead must be a number of hours from 0 to 2160' });
    // Every job that is not finished can be late: one waiting for inspection, in packaging or on hold as much as one on the floor.
    const where = {
      status: { in: UNFINISHED_JOB_STATUSES },
      scheduledEnd: { not: null },
    };
    // Filter by work center location
    if (locationId) {
      where.workCenter = { locationId };
    }

    // Only jobs due inside the window are read, and only the columns the list shows:
    // a branch with thousands of open jobs is not loaded whole to find the late ones.
    const now = new Date();
    const riskThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);
    where.scheduledEnd = { not: null, lte: riskThreshold };
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { scheduledEnd: 'asc' },
      select: {
        id: true, jobNumber: true, operationType: true, status: true, priority: true, scheduledEnd: true,
        order: { select: { orderNumber: true, buyer: { select: { name: true } } } },
        workCenter: { select: { name: true } },
      },
    });

    const atRiskJobs = jobs.map(job => {
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
      // ?? not ||: OVERDUE is 0, and || sent every overdue job to the bottom of the list.
      return (riskOrder[a.riskLevel] ?? 5) - (riskOrder[b.riskLevel] ?? 5) || a.hoursRemaining - b.hoursRemaining;
    });

    res.json({
      total: atRiskJobs.length,
      overdue: atRiskJobs.filter(j => j.riskLevel === 'OVERDUE').length,
      critical: atRiskJobs.filter(j => j.riskLevel === 'CRITICAL').length,
      high: atRiskJobs.filter(j => j.riskLevel === 'HIGH').length,
      medium: atRiskJobs.filter(j => j.riskLevel === 'MEDIUM').length,
      // The counts above are of every job in the window. The list is the most urgent ones.
      jobs: atRiskJobs.slice(0, SLA_LIST_MAX),
      listLimited: atRiskJobs.length > SLA_LIST_MAX,
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
    // Work is not opened for an order that is cancelled or finished, on a cancelled line, or at a work center that is offline.
    let order = null;
    if (data.orderId) {
      order = typeof data.orderId === 'string' ? await prisma.order.findUnique({ where: { id: data.orderId }, select: { status: true, orderNumber: true, locationId: true } }).catch(() => null) : null;
      if (!order) return res.status(400).json({ error: 'That order is not on file' });
      if (['CANCELLED', 'COMPLETE'].includes(order.status)) return res.status(409).json({ error: `Order ${order.orderNumber} is ${order.status.toLowerCase()}, so no new work can be opened for it` });
    }
    if (data.orderLineId) {
      const line = await prisma.orderLine.findUnique({ where: { id: data.orderLineId }, select: { lineStatus: true } });
      if (line?.lineStatus === 'CANCELLED') return res.status(409).json({ error: 'That order line is cancelled' });
    }
    if (workCenterId) {
      const place = typeof workCenterId === 'string' ? await prisma.workCenter.findUnique({ where: { id: workCenterId }, select: { isActive: true, name: true, locationId: true } }).catch(() => null) : null;
      if (!place) return res.status(400).json({ error: 'That work center is not on file' });
      if (!place.isActive) return res.status(409).json({ error: `${place.name} is offline, so work cannot be put on it` });
      // The job follows its work center: an order sold at one branch may be worked at another (the plan and its
      // steps are saved at the work center's branch). A branch login cannot reach another branch's work center at
      // all, because the look-up above is held to its own branches.
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
// GET /api/jobs/:id/material: the coil work orders raised for this job, with what they used, made and scrapped (L-024).
router.get('/:id/material', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id }, select: { id: true, workOrderId: true } }).catch(() => null);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(publicMaterial(await jobMaterial(prisma, job)));
  } catch (error) {
    console.error('Error reading job material:', error);
    res.status(500).json({ error: 'The material for this job could not be loaded' });
  }
});

// GET /api/jobs/:id/cost: material at actual cost plus labor at the rate on file (L-026). Cost goes only to the roles that manage it.
router.get('/:id/cost', async (req, res) => {
  try {
    if (!COST_VIEWERS.has(req.user?.role)) return res.status(403).json({ error: 'Job cost is shown to managers, the inventory manager and buyers.' });
    const job = await prisma.job.findUnique({ where: { id: req.params.id }, select: { id: true, workOrderId: true } }).catch(() => null);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const material = await jobMaterial(prisma, job);
    res.json({ jobId: job.id, ...(await jobCost(prisma, job, material)), material: publicMaterial(material).totals });
  } catch (error) {
    console.error('Error reading job cost:', error);
    res.status(500).json({ error: 'The cost of this job could not be worked out' });
  }
});

router.get('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    // A job that is not on file, or belongs to a branch this person does not work at, has no plan to show.
    if (!(await prisma.job.findUnique({ where: { id }, select: { id: true } }))) return res.status(404).json({ error: 'Job not found' });
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
    // What the material is comes from the request, else the job's own specification, else its order line.
    // Nothing is assumed: a grade that is not known is left empty (it used to be written as A36), and a
    // thickness that is not known is saved as 0, which the schedule reads as "not stated" (it used to be 0.5).
    const line = job.orderLineId ? await prisma.orderLine.findUnique({ where: { id: job.orderLineId }, select: { thicknessIn: true, gradeOverride: true, grade: { select: { code: true } } } }) : null;
    const known = {
      grade: grade || job.gradeOverride || line?.gradeOverride || line?.grade?.code || null,
      thickness: Number(thickness) > 0 ? Number(thickness) : Number(job.thicknessIn) > 0 ? Number(job.thicknessIn) : Number(line?.thicknessIn) > 0 ? Number(line.thicknessIn) : 0,
    };
    if (thickness != null && thickness !== '' && !(Number(thickness) > 0)) return res.status(400).json({ error: 'thickness must be more than zero' });
    if (planned?.workCenter?.locationId && locationId && locationId !== planned.workCenter.locationId) {
      return res.status(400).json({ error: "This job is assigned to a work center at another branch. Plan it at that branch, or change the job's work center first." });
    }
    // A plan is replaced only while none of its steps has been worked: recorded time is never deleted.
    const worked = await prisma.dispatchOperation.count({ where: { dispatchJob: { jobId: id }, OR: [{ status: { in: ['IN_PROCESS', 'COMPLETE'] } }, { timeLogs: { some: {} } }] } });
    if (worked) return res.status(409).json({ error: 'Work has been recorded against this plan, so it cannot be replaced. Finish the open steps instead.' });
    const branchId = locationId || planned?.workCenter?.locationId || planned?.order?.locationId || req.user?.homeLocationId;
    if (!branchId) return res.status(400).json({ error: 'Choose the branch this job will be worked at' });

    // One step (B-010): the job, the old plan and the new plan change together or not at all.
    const { updatedJob, newDispatchJob } = await prisma.$transaction(async (tx) => {
    // The job is locked and must still be waiting to start: a plan cannot land on a job that started or was cancelled a moment ago.
    await changeJobStatusTx(tx, id, 'SCHEDULED', { from: ['ORDERED', 'SCHEDULED'], fromError: (j) => `Job must be in ORDERED or SCHEDULED status to plan. Current status: ${j.status}`, note: 'Planned', via: 'plan', userId: req.user?.id });
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
        grade: known.grade,
        thickness: known.thickness,
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
            thickness: known.thickness,
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
    if (sendRefusal(res, error)) return;
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

    const updateData = {};
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
    // Quality and planned-step gates are checked on the locked job (lib/jobGates.js).
    delete updateData.status;
    const updatedJob = await prisma.$transaction(async (tx) => {
      await changeJobStatusTx(tx, id, status, { from: [job.status], fromError: () => STALE, data: updateData, note, userId: req.user?.id });
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
    if (error?.refused) return res.status(error.status === 400 ? 409 : error.status).json({ error: error.message });
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

    // Same rule as POST /:id/status: only if the job is still where it was checked, with its history line and gates.
    const job = await prisma.$transaction(async (tx) => {
      await changeJobStatusTx(tx, id, status, { from: [oldStatus], fromError: () => STALE, note: req.body?.note, userId: req.user?.id });
      return tx.job.findUnique({
        where: { id },
        include: {
          order: { include: { buyer: true } },
          workCenter: { select: { id: true, code: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    // Auto-queue print jobs based on status transition
    if (oldStatus !== status) {
      onJobStatusChange(job, status, oldStatus).catch((e) =>
        console.error('[PrintAutomation] status hook error:', e.message)
      );
    }

    res.json(mapJobForFrontend(job));
  } catch (error) {
    if (error?.refused) return res.status(error.status === 400 ? 409 : error.status).json({ error: error.message });
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

    // Applies only while the job is still open: an assignment cannot land on a job that closed a moment ago.
    const job = await prisma.$transaction(async (tx) => {
      const { before: locked } = await changeJobStatusTx(tx, id, before.status, {
        from: [before.status], fromError: () => STALE, data: { assignedToId: userId },
      });
      await recordJobAssignment(tx, { job: locked, fromUserId: locked.assignedToId, toUserId: userId, userId: req.user?.id });
      return tx.job.findUnique({ where: { id }, include: { assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } } } });
    });

    res.json({
      message: userId ? 'Job assigned successfully' : 'Assignment removed',
      job,
    });
  } catch (error) {
    if (error?.refused) return res.status(error.status === 400 ? 409 : error.status).json({ error: error.message });
    console.error('Error assigning job:', error);
    res.status(500).json({ error: 'Failed to assign job' });
  }
});

// POST /jobs/:id/start - Start a job (change from SCHEDULED to IN_PROCESS)
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    // Decided on the locked job: two people pressing Start get one start, and a job that was cancelled a moment ago stays cancelled.
    const updatedJob = await prisma.$transaction(async (tx) => {
      await changeJobStatusTx(tx, id, 'IN_PROCESS', {
        from: ['SCHEDULED', 'ORDERED'], fromError: (j) => `Cannot start job with status ${j.status}`, note, via: 'start', userId: req.user?.id,
      });
      return tx.job.findUnique({
        where: { id },
        include: {
          order: { select: { id: true, orderNumber: true, buyerId: true } },
          workCenter: { select: { id: true, code: true, name: true, locationId: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    res.json(updatedJob);
  } catch (error) {
    if (sendRefusal(res, error)) return;
    console.error('Error starting job:', error);
    res.status(500).json({ error: 'Failed to start job' });
  }
});

// POST /jobs/:id/complete - Complete a job (mark as READY_TO_SHIP)
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    // Decided on the locked job. Work that owes an inspection (its last inspection failed and it was
    // sent back for rework) goes to the inspection queue, not to the dock. A job with planned steps
    // still open is refused (lib/jobGates.js).
    let from = null; let to = null;
    const updatedJob = await prisma.$transaction(async (tx) => {
      const moved = await changeJobStatusTx(tx, id, 'READY_TO_SHIP', {
        from: ['IN_PROCESS', 'PACKAGING'], fromError: (j) => `Cannot complete job with status ${j.status}`, note, via: 'complete', userId: req.user?.id,
        decide: async (j, db) => (j.status === 'IN_PROCESS' ? afterProduction(db, j, 'READY_TO_SHIP') : 'READY_TO_SHIP'),
      });
      from = moved.from; to = moved.to;
      return tx.job.findUnique({
        where: { id },
        include: {
          order: { include: { buyer: true } },
          workCenter: { select: { id: true, code: true, name: true, locationId: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    // Auto-queue shipping label
    if (to === 'READY_TO_SHIP') onJobStatusChange(updatedJob, 'READY_TO_SHIP', from).catch((e) =>
      console.error('[PrintAutomation] complete hook error:', e.message)
    );
    if (to === 'WAITING_QC') return res.json({ ...updatedJob, message: 'This job has gone to inspection. It moves on when an inspection is passed.' });

    res.json(updatedJob);
  } catch (error) {
    if (sendRefusal(res, error)) return;
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

    // The shipment (above) may already have marked the job shipped; either way the carrier details are saved once,
    // on the locked job, and only a job that is ready or was just shipped by that shipment is accepted.
    const updatedJob = await prisma.$transaction(async (tx) => {
      await changeJobStatusTx(tx, id, 'SHIPPED', {
        from: ['READY_TO_SHIP', 'SHIPPED'], fromError: (j) => `Cannot ship job with status ${j.status}`,
        data: { shippedAt: new Date(), shippingCarrier: carrier, trackingNumber },
        note: note || `Shipped via ${carrier} - ${trackingNumber}`, via: 'ship', userId: req.user?.id,
      });
      return tx.job.findUnique({
        where: { id },
        include: {
          order: { select: { id: true, orderNumber: true, buyerId: true } },
          workCenter: { select: { id: true, code: true, name: true, locationId: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    res.json({ ...updatedJob, shipment: shipment && { id: shipment.id, shipmentNumber: shipment.shipmentNumber, invoice: shipment.invoice } });
  } catch (error) {
    if (sendRefusal(res, error)) return;
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
    // A job has no branch of its own: it is at its work center's branch, or its order's.
    if (locationId) where.OR = [{ workCenter: { locationId } }, { workCenterId: null, order: { locationId } }];
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

