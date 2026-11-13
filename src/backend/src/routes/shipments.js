/**
 * Shipments API.
 *
 *   GET    /api/shipments?status=
 *   GET    /api/shipments/:id
 *   POST   /api/shipments                     { orderId, fromLocationId, items: [{ orderLineId, qtyShipped, weightLb }] }
 *   PUT    /api/shipments/:id                 edit carrier / truck / dates while it has not left
 *   GET    /api/shipments/:id/items
 *   POST   /api/shipments/:id/items           add a line while it has not left
 *   DELETE /api/shipments/:id/items/:itemId
 *   PUT    /api/shipments/:id/dispatch        leaves the dock: order lines, order status and stock are updated
 *   PUT    /api/shipments/:id/deliver         proof of delivery
 *   PATCH  /api/shipments/:id/status          { status } — same rules as above
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded, retryOverlap } from '../lib/numbering.js';
import {
  SHIPPABLE_ORDER_STATUSES, shipmentMoveError, positiveQty, lineStatusFor, orderStatusFromLines, jobsBlockingShipment,
} from '../lib/workflowRules.js';

import { invoiceShipment } from '../services/billing.js';
import { moveJobsWhere } from '../lib/jobHistory.js';
const router = Router();

const EDIT_FIELDS = ['carrierId', 'carrierName', 'truckNumber', 'driverName', 'driverPhone', 'scheduledDate', 'totalWeightLb', 'bolNumber', 'notes'];
const OPEN = ['PENDING', 'LOADING'];
const num = (d) => Number(d || 0);

class Refuse extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const refuse = (status, message) => { throw new Refuse(status, message); };
const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof Refuse) return res.status(error.status).json({ error: error.message });
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'Shipment has a field that is not valid' });
    console.error(`Shipments: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

function pickEdits(body) {
  const data = {};
  for (const f of EDIT_FIELDS) {
    if (body[f] === undefined) continue;
    if (f === 'scheduledDate' && body[f] !== null) {
      const d = new Date(body[f]);
      if (Number.isNaN(d.getTime())) refuse(400, 'scheduledDate is not a valid date');
      data[f] = d;
    } else if (f === 'totalWeightLb' && body[f] !== null) {
      const n = Number(body[f]);
      if (!Number.isFinite(n) || n < 0) refuse(400, 'totalWeightLb must be zero or more');
      data[f] = n;
    } else data[f] = body[f];
  }
  return data;
}

/**
 * Checks requested items against what is still open on the order: ordered,
 * minus already shipped, minus what other shipments still on the dock hold.
 */
async function checkItems(db, orderId, rawItems, ignoreShipmentId) {
  if (!Array.isArray(rawItems)) refuse(400, 'items must be a list');
  const lines = await db.orderLine.findMany({
    where: { orderId },
    include: { shipmentItems: { where: { shipment: { status: { in: OPEN }, ...(ignoreShipmentId && { id: { not: ignoreShipmentId } }) } } } },
  });
  const byId = new Map(lines.map((l) => [l.id, l]));
  const wanted = new Map();
  const items = rawItems.map((raw, i) => {
    const line = byId.get(raw?.orderLineId);
    if (!line) refuse(400, `Item ${i + 1}: that line is not on this order`);
    if (line.lineStatus === 'CANCELLED') refuse(409, `Item ${i + 1}: line ${line.lineNumber} is cancelled`);
    const qty = positiveQty(raw.qtyShipped);
    if (qty === null) refuse(400, `Item ${i + 1}: qtyShipped must be more than zero`);
    let weightLb;
    if (raw.weightLb != null) {
      weightLb = Number(raw.weightLb);
      if (!Number.isFinite(weightLb) || weightLb < 0) refuse(400, `Item ${i + 1}: weightLb must be zero or more`);
    }
    wanted.set(line.id, (wanted.get(line.id) || 0) + qty);
    return { orderLineId: line.id, qtyShipped: qty, ...(weightLb !== undefined && { weightLb }) };
  });
  for (const [lineId, qty] of wanted) {
    const line = byId.get(lineId);
    const onDock = line.shipmentItems.reduce((s, it) => s + num(it.qtyShipped), 0);
    const open = num(line.qtyOrdered) - num(line.qtyShipped) - onDock;
    if (qty > open + 1e-9) {
      refuse(409, `Line ${line.lineNumber}: only ${Math.max(open, 0)} is left to ship (ordered ${num(line.qtyOrdered)}, shipped ${num(line.qtyShipped)}, on other open shipments ${onDock})`);
    }
  }
  return items;
}

const SHIPMENT_STATUSES = ['PENDING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'CANCELLED'];
const LIST_MAX = 200;
// The customer as the shipping desk needs it: who and where, not credit terms or pricing.
const BUYER = { select: { id: true, code: true, name: true, city: true, state: true } };

/** Who did what to a shipment, for the audit log. */
function recordShipmentEvent(db, { shipment, from, to, userId, note }) {
  return db.auditLog.create({
    data: {
      category: 'WORKFLOW', eventType: 'SHIPMENT_STATUS_CHANGED', severity: 'INFO', action: from ? 'UPDATE' : 'CREATE',
      userId: userId || null, resourceType: 'Shipment', resourceId: shipment.id,
      details: { shipmentNumber: shipment.shipmentNumber || null, from: from || null, to, note: note || null },
    },
  });
}

router.get('/', handle('fetch shipments', async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && !SHIPMENT_STATUSES.includes(status)) refuse(400, `status must be one of: ${SHIPMENT_STATUSES.join(', ')}`);
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 60) : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), LIST_MAX);
  const like = { contains: search, mode: 'insensitive' };
  const where = {
    ...(status && { status }),
    ...(search && { OR: [{ shipmentNumber: like }, { bolNumber: like }, { carrierName: like }, { order: { orderNumber: like } }, { order: { buyer: { name: like } } }] }),
  };
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: { order: { select: { id: true, orderNumber: true, status: true, buyer: BUYER } }, fromLocation: { select: { id: true, code: true, name: true } }, items: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);
  res.set('X-Total-Count', String(total));
  res.json(shipments);
}));

/**
 * What can still be shipped on an order: each line with what is left after
 * what has shipped and what other open shipments already hold, and anything
 * that would stop it going out. The New shipment form is built from this.
 */
router.get('/shippable', handle('look up what can ship', async (req, res) => {
  const orderNumber = typeof req.query.orderNumber === 'string' ? req.query.orderNumber.trim() : '';
  if (!orderNumber) refuse(400, 'orderNumber is required');
  const order = await prisma.order.findFirst({
    where: { orderNumber: { equals: orderNumber, mode: 'insensitive' } },
    select: {
      id: true, orderNumber: true, status: true, buyer: BUYER,
      lines: { orderBy: { lineNumber: 'asc' }, include: { shipmentItems: { where: { shipment: { status: { in: OPEN } } } } } },
    },
  });
  if (!order) refuse(404, `Order ${orderNumber} is not on file`);
  const jobs = await prisma.job.findMany({ where: { orderId: order.id }, select: { jobNumber: true, status: true, orderLineId: true, workCenter: { select: { locationId: true } } } });
  const lines = order.lines.filter((l) => l.lineStatus !== 'CANCELLED').map((l) => {
    const onDock = l.shipmentItems.reduce((sum, it) => sum + num(it.qtyShipped), 0);
    const open = Math.max(0, num(l.qtyOrdered) - num(l.qtyShipped) - onDock);
    return {
      orderLineId: l.id, lineNumber: l.lineNumber, description: l.description, unit: l.unit,
      qtyOrdered: num(l.qtyOrdered), qtyShipped: num(l.qtyShipped), qtyOnOpenShipments: onDock, qtyOpen: open,
      waitingOn: jobsBlockingShipment(jobs, [l.id]) ? jobs.filter((j) => (!j.orderLineId || j.orderLineId === l.id) && !['READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(j.status)).map((j) => j.jobNumber) : [],
    };
  });
  const canShip = SHIPPABLE_ORDER_STATUSES.includes(order.status);
  res.json({
    orderId: order.id, orderNumber: order.orderNumber, status: order.status, customer: order.buyer, lines,
    suggestedLocationId: jobs.find((j) => j.workCenter?.locationId)?.workCenter.locationId || null,
    reason: canShip ? (lines.some((l) => l.qtyOpen > 0) ? null : 'Everything on this order has shipped or is already on a shipment.') : `Order ${order.orderNumber} is ${String(order.status).toLowerCase()}. Only confirmed orders can be shipped.`,
  });
}));

router.get('/:id', handle('fetch shipment', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
    include: {
      order: { select: { id: true, orderNumber: true, status: true, poReference: true, buyer: BUYER, lines: { select: { id: true, lineNumber: true, description: true, unit: true, qtyOrdered: true, qtyShipped: true, lineStatus: true } } } },
      fromLocation: { select: { id: true, code: true, name: true, city: true, state: true } },
      items: { include: { orderLine: { select: { id: true, lineNumber: true, description: true, unit: true, qtyOrdered: true, qtyShipped: true } } } },
      stops: { orderBy: { stopNumber: 'asc' } },
    },
  });
  if (!shipment) refuse(404, 'Shipment not found');
  const [invoices, rows] = await Promise.all([
    prisma.invoice.findMany({ where: { shipmentId: shipment.id }, select: { id: true, invoiceNumber: true, status: true, totalAmount: true, kind: true }, orderBy: { createdAt: 'asc' } }),
    prisma.auditLog.findMany({
      where: { resourceType: 'Shipment', resourceId: shipment.id, eventType: 'SHIPMENT_STATUS_CHANGED' },
      orderBy: { timestamp: 'asc' }, take: 100,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);
  const history = rows.map((r) => ({
    timestamp: r.timestamp, from: r.details?.from || null, to: r.details?.to || null, note: r.details?.note || null,
    by: r.user ? [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.email : null,
  }));
  res.json({ ...shipment, invoices, history });
}));

router.post('/', handle('create shipment', async (req, res) => {
  const body = req.body || {};
  if (!body.orderId || !body.fromLocationId) refuse(400, 'orderId and fromLocationId are required');
  const [order, location] = await Promise.all([
    prisma.order.findUnique({ where: { id: body.orderId }, select: { id: true, status: true, orderNumber: true } }),
    prisma.location.findUnique({ where: { id: body.fromLocationId }, select: { id: true } }),
  ]);
  if (!order) refuse(404, 'Order not found');
  if (!location) refuse(400, 'Ship-from location not found');
  if (!SHIPPABLE_ORDER_STATUSES.includes(order.status)) {
    refuse(409, `Order ${order.orderNumber} is ${order.status}. Only confirmed orders can be shipped.`);
  }
  const edits = pickEdits(body);

  const shipment = await createNumbered({
    count: () => prisma.shipment.count(),
    format: padded('SHP'),
    create: (shipmentNumber) => prisma.$transaction(async (tx) => {
      // Checked inside the transaction so two shipments can't both take the last of a line.
      const items = await checkItems(tx, order.id, body.items ?? []);
      return tx.shipment.create({
        data: { ...edits, shipmentNumber, orderId: order.id, fromLocationId: location.id, items: { create: items } },
        include: { order: true, fromLocation: true, items: true },
      });
    }, { isolationLevel: 'Serializable' }),
  });
  await recordShipmentEvent(prisma, { shipment, from: null, to: shipment.status, userId: req.user?.id });
  res.status(201).json(shipment);
}));

async function openShipment(id) {
  const shipment = await prisma.shipment.findUnique({ where: { id }, include: { items: true } });
  if (!shipment) refuse(404, 'Shipment not found');
  if (!OPEN.includes(shipment.status)) refuse(409, `This shipment is ${shipment.status} and can no longer be changed`);
  return shipment;
}

router.put('/:id', handle('update shipment', async (req, res) => {
  const shipment = await openShipment(req.params.id);
  const data = pickEdits(req.body || {});
  if (!Object.keys(data).length) refuse(400, 'Nothing to update');
  res.json(await prisma.shipment.update({ where: { id: shipment.id }, data, include: { items: true } }));
}));

router.get('/:id/items', handle('fetch shipment items', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!shipment) refuse(404, 'Shipment not found');
  res.json(await prisma.shipmentItem.findMany({ where: { shipmentId: shipment.id }, include: { orderLine: true }, orderBy: { createdAt: 'asc' } }));
}));

router.post('/:id/items', handle('add shipment item', async (req, res) => {
  const shipment = await openShipment(req.params.id);
  const item = await retryOverlap(() => prisma.$transaction(async (tx) => {
    const [checked] = await checkItems(tx, shipment.orderId, [req.body || {}]);
    return tx.shipmentItem.create({ data: { ...checked, shipmentId: shipment.id } });
  }, { isolationLevel: 'Serializable' }));
  res.status(201).json(item);
}));

router.delete('/:id/items/:itemId', handle('remove shipment item', async (req, res) => {
  const shipment = await openShipment(req.params.id);
  const removed = await prisma.shipmentItem.deleteMany({ where: { id: req.params.itemId, shipmentId: shipment.id } });
  if (!removed.count) refuse(404, 'Item not found on this shipment');
  res.json({ success: true });
}));

/** Takes shipped quantity out of the stock reserved for the line. Stock with no reservation is left alone. */
async function consumeReserved(tx, shipment, item, userId) {
  let left = num(item.qtyShipped);
  const allocations = await tx.orderLineAllocation.findMany({ where: { orderLineId: item.orderLineId }, orderBy: { allocatedAt: 'asc' } });
  for (const a of allocations) {
    if (left <= 1e-9) break;
    const take = Math.min(left, num(a.qtyAllocated));
    if (take <= 0) continue;
    const held = await tx.coil.findUnique({ where: { id: a.coilId }, select: { coilNumber: true, status: true, qcStatus: true } });
    if (held && (held.status === 'HOLD' || ['FAILED', 'HOLD'].includes(held.qcStatus))) {
      refuse(409, `Stock item ${held.coilNumber} reserved for this shipment is on hold. Release the hold, or reserve other stock, before shipping.`);
    }
    const moved = await tx.inventory.updateMany({
      where: { coilId: a.coilId, qtyOnHand: { gte: take }, qtyAllocated: { gte: take } },
      data: { qtyOnHand: { decrement: take }, qtyAllocated: { decrement: take }, lastMovement: new Date() },
    });
    if (!moved.count) refuse(409, 'The stock reserved for this shipment is no longer on hand. Check the inventory record before shipping.');
    if (take + 1e-9 >= num(a.qtyAllocated)) await tx.orderLineAllocation.delete({ where: { id: a.id } });
    else await tx.orderLineAllocation.update({ where: { id: a.id }, data: { qtyAllocated: { decrement: take } } });
    const inv = await tx.inventory.findUnique({ where: { coilId: a.coilId }, select: { qtyOnHand: true, locationId: true } });
    await tx.materialMovement.create({
      data: {
        coilId: a.coilId, movementType: 'SHIP', fromLocationId: inv.locationId, qtyMoved: take,
        orderId: shipment.orderId, shipmentId: shipment.id, createdById: userId,
      },
    });
    if (num(inv.qtyOnHand) <= 1e-9) await tx.coil.update({ where: { id: a.coilId }, data: { status: 'SHIPPED' } });
    else if (!(await tx.orderLineAllocation.count({ where: { coilId: a.coilId } }))) {
      await tx.coil.updateMany({ where: { id: a.coilId, status: 'ALLOCATED' }, data: { status: 'AVAILABLE' } });
    }
    left -= take;
  }
}

async function dispatch(id, body, userId) {
  const shipment = await prisma.shipment.findUnique({ where: { id }, include: { items: true, order: { select: { status: true, orderNumber: true } } } });
  if (!shipment) refuse(404, 'Shipment not found');
  const why = shipmentMoveError(shipment.status, 'IN_TRANSIT');
  if (why) refuse(409, why);
  const resuming = shipment.status === 'EXCEPTION';
  if (!resuming) {
    if (!shipment.items.length) refuse(409, 'Add what is being shipped before dispatching');
    if (!SHIPPABLE_ORDER_STATUSES.includes(shipment.order.status)) {
      refuse(409, `Order ${shipment.order.orderNumber} is ${shipment.order.status}, so this shipment cannot go out`);
    }
    const jobs = await prisma.job.findMany({ where: { orderId: shipment.orderId }, select: { jobNumber: true, status: true, orderLineId: true } });
    const blocked = jobsBlockingShipment(jobs, shipment.items.map((i) => i.orderLineId));
    if (blocked) refuse(409, blocked);
  }
  const edits = pickEdits(body);

  return retryOverlap(() => prisma.$transaction(async (tx) => {
    // Only one dispatch can win.
    const claimed = await tx.shipment.updateMany({
      where: { id, status: shipment.status },
      data: { ...edits, status: 'IN_TRANSIT', ...(!resuming && { shippedAt: new Date() }) },
    });
    if (!claimed.count) refuse(409, 'This shipment was just changed by someone else. Reload and try again.');
    await recordShipmentEvent(tx, { shipment, from: shipment.status, to: 'IN_TRANSIT', userId });
    if (!resuming) {
      for (const item of shipment.items) {
        const line = await tx.orderLine.update({ where: { id: item.orderLineId }, data: { qtyShipped: { increment: item.qtyShipped } } });
        if (num(line.qtyShipped) > num(line.qtyOrdered) + 1e-9) refuse(409, `Line ${line.lineNumber} would ship more than was ordered`);
        await tx.orderLine.update({ where: { id: line.id }, data: { lineStatus: lineStatusFor(num(line.qtyOrdered), num(line.qtyShipped)) } });
        await consumeReserved(tx, shipment, item, userId);
      }
      const lines = await tx.orderLine.findMany({ where: { orderId: shipment.orderId }, select: { id: true, lineStatus: true } });
      // Jobs that were ready to ship go with the material once their line has fully shipped.
      const gone = lines.filter((l) => l.lineStatus === 'COMPLETE').map((l) => l.id);
      const allGone = lines.every((l) => ['COMPLETE', 'CANCELLED'].includes(l.lineStatus));
      await moveJobsWhere(
        tx,
        { orderId: shipment.orderId, status: 'READY_TO_SHIP', OR: [{ orderLineId: { in: gone } }, ...(allGone ? [{ orderLineId: null }] : [])] },
        'SHIPPED',
        { note: `Left on shipment ${shipment.shipmentNumber}`, via: 'shipment', userId },
      );
      const status = orderStatusFromLines(lines.map((l) => l.lineStatus));
      if (status) await tx.order.update({ where: { id: shipment.orderId }, data: { status } });
    }
    return tx.shipment.findUnique({ where: { id }, include: { items: true, order: { select: { id: true, status: true } } } });
  }));
}

async function move(id, to, extra = {}, userId = null) {
  const shipment = await prisma.shipment.findUnique({ where: { id }, select: { id: true, status: true, shipmentNumber: true } });
  if (!shipment) refuse(404, 'Shipment not found');
  const why = shipmentMoveError(shipment.status, to);
  if (why) refuse(409, why);
  const changed = await prisma.shipment.updateMany({ where: { id, status: shipment.status }, data: { ...extra, status: to } });
  if (!changed.count) refuse(409, 'This shipment was just changed by someone else. Reload and try again.');
  await recordShipmentEvent(prisma, { shipment, from: shipment.status, to, userId, note: extra.podSignature ? `Signed for by ${extra.podSignature}` : null });
  return prisma.shipment.findUnique({ where: { id }, include: { items: true } });
}

function podText(value, name, max) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') refuse(400, `${name} must be text`);
  const text = value.trim();
  if (text.length > max) refuse(400, `${name} is too long (${max} characters at most)`);
  return text || undefined;
}

function deliver(id, body, userId) {
  const podSignature = podText(body.podSignature, 'podSignature', 200);
  const podImageUrl = podText(body.podImageUrl, 'podImageUrl', 2000);
  if (podImageUrl && !/^(https:\/\/|\/api\/documents\/)/.test(podImageUrl)) refuse(400, 'podImageUrl must be an https address or a stored document');
  return move(id, 'DELIVERED', {
    deliveredAt: new Date(),
    podCaptured: Boolean(podSignature || podImageUrl),
    ...(podSignature !== undefined && { podSignature }),
    ...(podImageUrl !== undefined && { podImageUrl }),
  }, userId);
}

/**
 * Dispatch, then bill what left the dock. Billing never undoes a dispatch: if it
 * fails the shipment still goes, and the order can be invoiced from the invoices page.
 */
async function dispatchAndInvoice(id, body, userId) {
  const shipment = await dispatch(id, body, userId);
  let invoice = null;
  try {
    invoice = await invoiceShipment(id, userId);
  } catch (error) {
    console.error(`Shipments: could not invoice shipment ${id}:`, error?.message || error);
  }
  return { ...shipment, invoice: invoice && { id: invoice.id, invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount } };
}

/**
 * "Ship" pressed on a job at the shop-floor shipping screen: creates and
 * dispatches a shipment for what is still open on the job's order line, so
 * stock, the order and the invoice all follow. Returns null when there is
 * nothing to ship (the line already went out on a shipment, or the job is not
 * for an order line). Throws an error with .status and .message when refused.
 */
export async function shipForJob(job, { carrier, trackingNumber, userId }) {
  if (!job.orderId) return null;
  const [order, workCenter] = await Promise.all([
    prisma.order.findUnique({
      where: { id: job.orderId },
      select: { id: true, status: true, orderNumber: true, lines: { where: job.orderLineId ? { id: job.orderLineId } : {}, include: { shipmentItems: { where: { shipment: { status: { in: OPEN } } } } } } },
    }),
    job.workCenterId ? prisma.workCenter.findUnique({ where: { id: job.workCenterId }, select: { locationId: true } }) : null,
  ]);
  if (!order) return null;
  // A job with no line is for the whole order: everything still open goes.
  const lines = order.lines.filter((l) => l.lineStatus !== 'CANCELLED');
  const waiting = lines.find((l) => l.shipmentItems.some((it) => num(it.qtyShipped) > 1e-9));
  if (waiting) refuse(409, `Line ${waiting.lineNumber} of ${order.orderNumber} is already on a shipment that has not left. Dispatch that shipment from the shipping desk.`);
  const wanted = lines.map((l) => ({ orderLineId: l.id, qtyShipped: num(l.qtyOrdered) - num(l.qtyShipped) })).filter((w) => w.qtyShipped > 1e-9);
  if (!wanted.length) return null;
  if (!SHIPPABLE_ORDER_STATUSES.includes(order.status)) refuse(409, `Order ${order.orderNumber} is ${order.status}, so this job cannot ship`);
  if (!workCenter?.locationId) refuse(409, 'This job has no work center, so the branch it ships from is not known. Create the shipment on the shipping desk.');
  const shipment = await createNumbered({
    count: () => prisma.shipment.count(),
    format: padded('SHP'),
    create: (shipmentNumber) => prisma.$transaction(async (tx) => {
      const items = await checkItems(tx, order.id, wanted);
      return tx.shipment.create({
        data: {
          shipmentNumber, orderId: order.id, fromLocationId: workCenter.locationId, carrierName: carrier || null, bolNumber: trackingNumber || null,
          notes: `Shipped from the shop floor for ${job.jobNumber}`, items: { create: items },
        },
      });
    }, { isolationLevel: 'Serializable' }),
  });
  try {
    return await dispatchAndInvoice(shipment.id, {}, userId);
  } catch (error) {
    // Nothing left the dock: do not leave an empty shipment behind.
    await prisma.shipment.delete({ where: { id: shipment.id } }).catch(() => {});
    throw error;
  }
}

router.put('/:id/dispatch', handle('dispatch', async (req, res) => {
  res.json(await dispatchAndInvoice(req.params.id, req.body || {}, req.user.id));
}));

router.put('/:id/deliver', handle('mark delivered', async (req, res) => {
  res.json(await deliver(req.params.id, req.body || {}, req.user?.id));
}));

router.patch('/:id/status', handle('update shipment status', async (req, res) => {
  const { status, ...rest } = req.body || {};
  if (status === 'IN_TRANSIT') return res.json(await dispatchAndInvoice(req.params.id, rest, req.user.id));
  if (status === 'DELIVERED') return res.json(await deliver(req.params.id, rest, req.user?.id));
  res.json(await move(req.params.id, status, {}, req.user?.id));
}));

export default router;
