import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { readFields } from '../lib/fieldRules.js';
import { workOrderMoveError, WO_TYPES, WO_STATUSES } from '../lib/workOrderRules.js';
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
        include: { sourceCoil: { select: { id: true, coilNumber: true, netWeightLb: true, grade: { select: { code: true } } } }, outputs: { select: { id: true } } },
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
    res.json({ ...wo, history });
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

    const coil = await prisma.coil.findUnique({ where: { id: data.sourceCoilId }, select: { id: true, status: true, netWeightLb: true, qcStatus: true } }).catch(() => null);
    if (!coil) return res.status(400).json({ error: 'The source stock item is not on file' });
    // One item may feed several work orders, and an item reserved for an order is cut for it.
    // Each work order takes only what is free, or reserved for its own line, when it completes.
    if (!['AVAILABLE', 'ALLOCATED', 'IN_PROCESS'].includes(coil.status)) return res.status(409).json({ error: `The source stock item is ${String(coil.status).toLowerCase().replace(/_/g, ' ')}, so it cannot be put on a work order` });
    if (data.lineId) {
      const line = await prisma.orderLine.findUnique({ where: { id: data.lineId }, select: { id: true, orderId: true, lineStatus: true } }).catch(() => null);
      if (!line) return res.status(400).json({ error: 'The order line is not on file' });
      if (line.lineStatus === 'CANCELLED') return res.status(409).json({ error: 'That order line is cancelled' });
      data.salesOrderId = line.orderId;
    }
    if (Array.isArray(req.body?.slitPattern) && req.body.slitPattern.length) {
      const pattern = req.body.slitPattern;
      const bad = pattern.length > 60 || pattern.some((w) => !(w && Number(w.width) > 0 && Number(w.width) < 1000 && (w.qty == null || (Number.isInteger(Number(w.qty)) && Number(w.qty) > 0 && Number(w.qty) <= 100))));
      if (bad) return res.status(400).json({ error: 'Each cut needs a width more than zero (and a whole-number count if given)' });
      data.slitPattern = pattern.map((w) => ({ width: Number(w.width), qty: w.qty == null ? 1 : Number(w.qty) }));
    }
    // What goes on the line is what the item holds now, not what it weighed when it was received.
    const balance = await prisma.inventory.findUnique({ where: { coilId: coil.id }, select: { qtyOnHand: true } });
    const onHand = balance ? Number(balance.qtyOnHand) : null;
    if (onHand != null && onHand <= 0) return res.status(409).json({ error: 'The source stock item has nothing on hand, so it cannot be put on a work order' });
    if (data.inputWeightLb != null && onHand != null && data.inputWeightLb > onHand + 1e-6) return res.status(400).json({ error: `inputWeightLb is more than the ${onHand.toLocaleString()} lb the item has on hand` });
    if (data.inputWeightLb == null) data.inputWeightLb = onHand ?? coil.netWeightLb;

    const wo = await createNumbered({
      count: () => prisma.workOrder.count(),
      format: padded('WO'),
      create: (woNumber) => prisma.workOrder.create({ data: { ...data, woNumber }, include: { sourceCoil: { select: { id: true, coilNumber: true } } } }),
    });
    await prisma.auditLog.create({
      data: { category: 'WORKFLOW', eventType: 'WORK_ORDER_CREATED', action: 'CREATE', userId: req.user?.id || null, resourceType: 'WorkOrder', resourceId: wo.id, details: { woNumber: wo.woNumber, woType: wo.woType, sourceCoilId: wo.sourceCoilId } },
    });
    res.status(201).json(wo);
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

/** Move a work order, refusing a move its status does not allow. Two people pressing at once: one wins. */
async function move(req, res, to, extra = {}) {
  const wo = await prisma.workOrder.findUnique({ where: { id: req.params.id } });
  if (!wo) return res.status(404).json({ error: 'Work order not found' });
  const why = workOrderMoveError(wo.status, to);
  if (why) return res.status(409).json({ error: why });
  const moved = await prisma.workOrder.updateMany({ where: { id: wo.id, status: wo.status }, data: { status: to, ...extra } });
  if (!moved.count) return res.status(409).json({ error: 'This work order was just changed by someone else. Reload and try again.' });
  await prisma.auditLog.create({
    data: { category: 'WORKFLOW', eventType: 'WORK_ORDER_STATUS_CHANGED', action: 'UPDATE', userId: req.user?.id || null, resourceType: 'WorkOrder', resourceId: wo.id, details: { woNumber: wo.woNumber, from: wo.status, to, note: typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) || null : null } },
  });
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

router.put('/:id/cancel', guard((req, res) => move(req, res, 'CANCELLED')));

export default router;
