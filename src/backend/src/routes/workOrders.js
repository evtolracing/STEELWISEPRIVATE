import { Router } from 'express';
import { can } from '../lib/roleStore.js';
import prisma from '../lib/db.js';
import { planLights } from '../lib/productionView.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { readFields } from '../lib/fieldRules.js';
import { workOrderMoveError, gradeFitError, jobForWorkOrder, workOrderJobText, cancelsItsJob, OPEN_JOB_STATUSES, WO_TYPES, WO_STATUSES } from '../lib/workOrderRules.js';
import { createJobNumbered } from '../lib/jobNumbers.js';
import { changeJobStatusTx } from '../lib/jobGates.js';
import { completeWorkOrder, readPieces } from '../lib/stockChanges.js';
import { retryOverlap } from '../lib/numbering.js';

const FORMS = ['COIL', 'SHEET', 'PLATE', 'BAR', 'TUBE', 'BEAM', 'REBAR', 'WIRE', 'ROD', 'SUPPLY'];

const router = Router();

// What a person may set on a work order. The number, status and timestamps are
// set by the server, so nothing else in the request is read.
const WO_FIELDS = {
  woType: { type: 'enum', values: WO_TYPES, required: true },
  sourceCoilId: { type: 'id', required: true },
  priority: { type: 'number', min: 1, max: 5 },
  scheduledDate: { type: 'date' },
  notes: { type: 'string', maxLength: 2000 },
  inputWeightLb: { type: 'number', min: 0, max: 10000000 },
  // The order line this work is for. Stock reserved on the source item for that line is what gets cut.
  lineId: { type: 'id' },
  // The job this work is for (finding L-024). The job then shows what it used, what it made and what was scrapped.
  jobId: { type: 'id' },
};

const LIST_MAX = 200;

router.get('/', async (req, res) => {
  try {
    const { status, woType } = req.query;
    if (status && !WO_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${WO_STATUSES.join(', ')}` });
    if (woType && !WO_TYPES.includes(woType)) return res.status(400).json({ error: `woType must be one of: ${WO_TYPES.join(', ')}` });
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 60) : '';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), LIST_MAX);
    const where = {
      ...(status && { status }),
      ...(woType && { woType }),
      ...(search && { OR: [{ woNumber: { contains: search, mode: 'insensitive' } }, { sourceCoil: { coilNumber: { contains: search, mode: 'insensitive' } } }] }),
    };
    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: { sourceCoil: { select: { id: true, coilNumber: true, netWeightLb: true, grade: { select: { code: true } } } }, outputs: { select: { id: true } }, job: { select: { id: true, jobNumber: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);
    res.set('X-Total-Count', String(total));
    res.json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id: req.params.id },
      include: {
        sourceCoil: { select: { id: true, coilNumber: true, netWeightLb: true, status: true, grade: { select: { code: true, name: true } }, heat: { select: { id: true, heatNumber: true } }, location: { select: { id: true, code: true, name: true } } } },
        outputs: { include: { outputCoil: { select: { id: true, coilNumber: true, netWeightLb: true, status: true } } } },
        // The job's plan steps come with it, so the work order shows how far the job has got.
        job: { select: { id: true, jobNumber: true, status: true, dispatchJob: { select: { operations: { select: { sequence: true, status: true, name: true, assignedWorkCenterId: true, assignedWorkCenter: { select: { name: true } } } } } } } },
      },
    });
    if (!wo) return res.status(404).json({ error: 'Work order not found' });
    const rows = await prisma.auditLog.findMany({
      where: { resourceType: 'WorkOrder', resourceId: wo.id, eventType: { in: ['WORK_ORDER_CREATED', 'WORK_ORDER_STATUS_CHANGED'] } },
      orderBy: { timestamp: 'asc' },
      take: 200,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    const history = rows.map((r) => ({
      timestamp: r.timestamp,
      type: r.eventType === 'WORK_ORDER_CREATED' ? 'CREATED' : 'STATUS',
      from: r.details?.from || null,
      to: r.details?.to || null,
      note: r.details?.note || null,
      by: r.user ? [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.email : null,
    }));
    const job = wo.job ? { id: wo.job.id, jobNumber: wo.job.jobNumber, status: wo.job.status, planSteps: planLights(wo.job.dispatchJob?.operations || []) } : null;
    res.json({ ...wo, job, history });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ error: 'Failed to fetch work order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const read = readFields(req.body, WO_FIELDS, { creating: true });
    if (read.error) return res.status(400).json({ error: read.error });
    const data = read.data;
    if (data.priority != null && !Number.isInteger(data.priority)) return res.status(400).json({ error: 'priority must be a whole number from 1 to 5' });

    const coil = await prisma.coil.findUnique({ where: { id: data.sourceCoilId }, select: { id: true, coilNumber: true, status: true, netWeightLb: true, qcStatus: true, grade: { select: { id: true, code: true } } } }).catch(() => null);
    if (!coil) return res.status(400).json({ error: 'The source stock item is not on file' });
    // One item may feed several work orders, and an item reserved for an order is cut for it.
    // Each work order takes only what is free, or reserved for its own line, when it completes.
    if (!['AVAILABLE', 'ALLOCATED', 'IN_PROCESS'].includes(coil.status)) return res.status(409).json({ error: `The source stock item is ${String(coil.status).toLowerCase().replace(/_/g, ' ')}, so it cannot be put on a work order` });
    // Material that failed inspection is not cut for anyone.
    if (['FAILED', 'HOLD'].includes(coil.qcStatus)) return res.status(409).json({ error: 'The source stock item has not been released by quality, so it cannot be put on a work order' });
    if (data.jobId) {
      // Read under the signed-in person's branches: another branch's job is not on file for them.
      const job = await prisma.job.findUnique({ where: { id: data.jobId }, select: { id: true, jobNumber: true, status: true, orderLineId: true } }).catch(() => null);
      if (!job) return res.status(400).json({ error: 'That job is not on file' });
      if (['CANCELLED', 'SHIPPED', 'COMPLETED'].includes(job.status)) return res.status(409).json({ error: `Job ${job.jobNumber} is ${job.status.toLowerCase()}, so no material can be cut for it` });
      // A job for an order line cuts for that line, so the stock reserved for the line is what is used.
      if (job.orderLineId && data.lineId && data.lineId !== job.orderLineId) return res.status(409).json({ error: `Job ${job.jobNumber} is for a different order line` });
      if (job.orderLineId && !data.lineId) data.lineId = job.orderLineId;
    }
    const substitutionReason = typeof req.body?.substitutionReason === 'string' ? req.body.substitutionReason.trim().slice(0, 500) : null;
    let substitution = null;
    let line = null;
    if (data.lineId) {
      line = await prisma.orderLine.findUnique({ where: { id: data.lineId }, select: { id: true, orderId: true, lineNumber: true, lineStatus: true, order: { select: { id: true, orderNumber: true } }, grade: { select: { id: true, code: true } } } }).catch(() => null);
      if (!line) return res.status(400).json({ error: 'The order line is not on file' });
      if (line.lineStatus === 'CANCELLED') return res.status(409).json({ error: 'That order line is cancelled' });
      data.salesOrderId = line.orderId;
      // The customer ordered a grade. Another grade is cut for the line only as a recorded substitution.
      const fit = gradeFitError({ sourceGrade: coil.grade, lineGrade: line.grade, substitutionReason });
      if (fit) return res.status(409).json({ error: fit });
      if (coil.grade && line.grade && coil.grade.id !== line.grade.id) substitution = { ordered: line.grade.code, used: coil.grade.code, reason: substitutionReason };
    }
    if (Array.isArray(req.body?.slitPattern) && req.body.slitPattern.length) {
      const pattern = req.body.slitPattern;
      const bad = pattern.length > 60 || pattern.some((w) => !(w && Number(w.width) > 0 && Number(w.width) < 1000 && (w.qty == null || (Number.isInteger(Number(w.qty)) && Number(w.qty) > 0 && Number(w.qty) <= 100))));
      if (bad) return res.status(400).json({ error: 'Each cut needs a width more than zero (and a whole-number count if given)' });
      data.slitPattern = pattern.map((w) => ({ width: Number(w.width), qty: w.qty == null ? 1 : Number(w.qty) }));
    }
    // What goes on the line is what the item holds now, not what it weighed when it was received.
    const balance = await prisma.inventory.findUnique({ where: { coilId: coil.id }, select: { qtyOnHand: true, qtyInTransit: true } });
    const onHand = balance ? Number(balance.qtyOnHand) : null;
    // Material in a truck between branches is not on anyone's floor to cut.
    if (balance && Number(balance.qtyInTransit) > 0) return res.status(409).json({ error: 'The source stock item is in transit to another branch, so it cannot be put on a work order until it is received' });
    if (onHand != null && onHand <= 0) return res.status(409).json({ error: 'The source stock item has nothing on hand, so it cannot be put on a work order' });
    if (data.inputWeightLb != null && onHand != null && data.inputWeightLb > onHand + 1e-6) return res.status(400).json({ error: `inputWeightLb is more than the ${onHand.toLocaleString()} lb the item has on hand` });
    if (data.inputWeightLb == null) data.inputWeightLb = onHand ?? coil.netWeightLb;

    // A work order is work for the shop, so it always has a job (owner's decision, 2026-11-23). Opened from
    // a job, it is that job's. For an order line it joins the line's open job. Otherwise it makes its own,
    // which starts on the Order Board to be planned.
    let job = null;
    let madeJob = false;
    if (!data.jobId) {
      if (line) job = await prisma.job.findFirst({ where: { orderLineId: line.id, status: { in: OPEN_JOB_STATUSES } }, orderBy: { createdAt: 'asc' }, select: { id: true, jobNumber: true } });
      if (!job) {
        const jobData = jobForWorkOrder({ ...data, coilNumber: coil.coilNumber, line, userId: req.user.id });
        job = await createJobNumbered({
          client: prisma,
          order: line?.order || null,
          lineNumber: line?.lineNumber ?? null,
          create: (jobNumber) => prisma.job.create({ data: { ...jobData, jobNumber }, select: { id: true, jobNumber: true } }),
        });
        madeJob = true;
      }
      data.jobId = job.id;
    }

    let wo;
    try {
      wo = await createNumbered({
        count: () => prisma.workOrder.count(),
        format: padded('WO'),
        create: (woNumber) => prisma.workOrder.create({ data: { ...data, woNumber }, include: { sourceCoil: { select: { id: true, coilNumber: true } }, job: { select: { id: true, jobNumber: true, status: true } } } }),
      });
    } catch (error) {
      // No work order was saved, so the job made for it a moment ago is taken back.
      if (madeJob) await prisma.job.delete({ where: { id: job.id } }).catch(() => {});
      throw error;
    }
    if (madeJob) {
      // The job names its work order, so the traveler leads back to the stock that is cut.
      await prisma.job.update({ where: { id: job.id }, data: { workOrderId: wo.id, instructions: workOrderJobText({ ...data, coilNumber: coil.coilNumber, woNumber: wo.woNumber, forOrder: Boolean(line) }) } });
    }
    await prisma.auditLog.create({
      data: { category: 'WORKFLOW', eventType: 'WORK_ORDER_CREATED', action: 'CREATE', userId: req.user?.id || null, resourceType: 'WorkOrder', resourceId: wo.id, details: { jobNumber: wo.job?.jobNumber || null, jobMade: madeJob, woNumber: wo.woNumber, woType: wo.woType, sourceCoilId: wo.sourceCoilId, ...(substitution && { substitution }) } },
    });
    res.status(201).json({ ...wo, jobMade: madeJob });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

/** Move a work order, refusing a move its status does not allow. Two people pressing at once: one wins. */
async function move(req, res, to, extra = {}, after = null) {
  const wo = await prisma.workOrder.findUnique({ where: { id: req.params.id } });
  if (!wo) return res.status(404).json({ error: 'Work order not found' });
  const why = workOrderMoveError(wo.status, to);
  if (why) return res.status(409).json({ error: why });
  const moved = await prisma.workOrder.updateMany({ where: { id: wo.id, status: wo.status }, data: { status: to, ...extra } });
  if (!moved.count) return res.status(409).json({ error: 'This work order was just changed by someone else. Reload and try again.' });
  await prisma.auditLog.create({
    data: { category: 'WORKFLOW', eventType: 'WORK_ORDER_STATUS_CHANGED', action: 'UPDATE', userId: req.user?.id || null, resourceType: 'WorkOrder', resourceId: wo.id, details: { woNumber: wo.woNumber, from: wo.status, to, note: typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || null : null } },
  });
  // What follows from the move is done before the answer goes back, so the screen reloads to the finished state.
  if (after) await after(wo);
  return res.json(await prisma.workOrder.findUnique({ where: { id: wo.id } }));
}

const guard = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error('Error changing work order:', error);
    res.status(500).json({ error: 'Failed to change work order' });
  }
};

router.put('/:id/release', guard((req, res) => move(req, res, 'READY')));

router.put('/:id/start', guard((req, res) => move(req, res, 'IN_PROGRESS', { startedAt: new Date() })));

router.put('/:id/complete', guard(async (req, res) => {
  const read = readFields(req.body, {
    outputWeightLb: { type: 'number', min: 0, max: 10000000 },
    scrapWeightLb: { type: 'number', min: 0, max: 10000000 },
  }, { creating: true });
  if (read.error) return res.status(400).json({ error: read.error });
  let reported;
  try {
    reported = readPieces(req.body, FORMS);
  } catch (error) {
    if (error?.refuse) return res.status(error.status).json({ error: error.message });
    throw error;
  }
  const out = reported.out;
  if (!Number.isFinite(out) || out < 0) return res.status(400).json({ error: 'outputWeightLb is required: the weight that came off the line (or the list of pieces in outputs)' });
  const scrap = read.data.scrapWeightLb ?? 0;
  const wo = await prisma.workOrder.findUnique({ where: { id: req.params.id } });
  if (!wo) return res.status(404).json({ error: 'Work order not found' });
  const why = workOrderMoveError(wo.status, 'COMPLETE');
  if (why) return res.status(409).json({ error: why });
  const input = wo.inputWeightLb == null ? null : Number(wo.inputWeightLb);
  // More cannot come off the line than went on (a little slack for scale differences).
  if (input != null && out + scrap > input * 1.02 + 1) {
    return res.status(400).json({ error: `Output plus scrap (${(out + scrap).toLocaleString()} lb) is more than the ${input.toLocaleString()} lb that went in` });
  }
  const yieldPct = input ? Math.round((out / input) * 10000) / 100 : null;
  // The status, the stock taken off the source, the new pieces and the history are one change.
  try {
    const result = await retryOverlap(() => prisma.$transaction(async (tx) => {
      const moved = await tx.workOrder.updateMany({ where: { id: wo.id, status: wo.status }, data: { status: 'COMPLETE', completedAt: new Date(), outputWeightLb: out, scrapWeightLb: scrap, yieldPct } });
      if (!moved.count) throw Object.assign(new Error('This work order was just changed by someone else. Reload and try again.'), { refuse: true, status: 409 });
      const booked = await completeWorkOrder(tx, wo, { out, scrap, pieces: reported.pieces }, req.user.id);
      await tx.auditLog.create({
        data: { category: 'WORKFLOW', eventType: 'WORK_ORDER_STATUS_CHANGED', action: 'UPDATE', userId: req.user.id, resourceType: 'WorkOrder', resourceId: wo.id, details: { woNumber: wo.woNumber, from: wo.status, to: 'COMPLETE', outputLb: out, scrapLb: scrap, source: booked.source, pieces: booked.pieces, note: typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || null : null } },
      });
      return booked;
    }));
    const saved = await prisma.workOrder.findUnique({ where: { id: wo.id }, include: { outputs: { include: { outputCoil: { select: { id: true, coilNumber: true, netWeightLb: true, status: true } } } } } });
    return res.json({ ...saved, stock: result });
  } catch (error) {
    if (error?.refuse) return res.status(error.status).json({ error: error.message });
    throw error;
  }
}));

// Quality hold: the work stops, nothing can be completed, and quality (or the production manager) releases it.
router.put('/:id/hold', guard((req, res) => {
  if (typeof req.body?.reason !== 'string' || req.body.reason.trim().length < 3) return res.status(400).json({ error: 'Say why this work order is being held' });
  return move(req, res, 'QC_HOLD');
}));

router.put('/:id/release-hold', guard(async (req, res) => {
  if (!can(req, 'jobs:releaseQualityHold')) return res.status(403).json({ error: 'A quality hold is released by quality staff or the production manager' });
  const wo = await prisma.workOrder.findUnique({ where: { id: req.params.id }, select: { status: true } });
  if (wo && wo.status !== 'QC_HOLD') return res.status(409).json({ error: 'This work order is not on quality hold' });
  return move(req, res, 'IN_PROGRESS');
}));

// The job this work order made goes with it while nobody has started it, so the boards do not keep
// work that is no longer wanted. A job that came from an order, or has other cutting on it, stays.
async function cancelItsJob(wo, userId) {
  if (!wo.jobId) return;
  try {
    const [job, others] = await Promise.all([
      prisma.job.findUnique({ where: { id: wo.jobId }, select: { id: true, status: true, workOrderId: true } }),
      prisma.workOrder.count({ where: { jobId: wo.jobId, id: { not: wo.id }, status: { not: 'CANCELLED' } } }),
    ]);
    if (!cancelsItsJob({ workOrderId: wo.id, job, otherLiveWorkOrders: others })) return;
    await prisma.$transaction((tx) => changeJobStatusTx(tx, job.id, 'CANCELLED', { from: ['ORDERED', 'SCHEDULED'], note: `Work order ${wo.woNumber} was cancelled`, via: 'work-order', userId, skipGates: true }));
  } catch (error) {
    // The work order is cancelled either way; the job can still be cancelled from its own page.
    console.error('Work order cancelled, but its job could not be cancelled:', error);
  }
}

router.put('/:id/cancel', guard((req, res) => move(req, res, 'CANCELLED', {}, (wo) => cancelItsJob(wo, req.user?.id))));

export default router;
