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
  SHIPPABLE_ORDER_STATUSES, shipmentMoveError, positiveQty, lineStatusFor, orderStatusFromLines,
} from '../lib/workflowRules.js';

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

router.get('/', handle('fetch shipments', async (req, res) => {
  const { status } = req.query;
  const shipments = await prisma.shipment.findMany({
    where: { ...(status && { status }) },
    include: { order: { include: { buyer: true } }, fromLocation: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(shipments);
}));

router.get('/:id', handle('fetch shipment', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
    include: {
      order: { include: { buyer: true, lines: true } },
      fromLocation: true,
      items: { include: { orderLine: true } },
      stops: { orderBy: { stopNumber: 'asc' } },
    },
  });
  if (!shipment) refuse(404, 'Shipment not found');
  res.json(shipment);
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
  }
  const edits = pickEdits(body);

  return retryOverlap(() => prisma.$transaction(async (tx) => {
    // Only one dispatch can win.
    const claimed = await tx.shipment.updateMany({
      where: { id, status: shipment.status },
      data: { ...edits, status: 'IN_TRANSIT', ...(!resuming && { shippedAt: new Date() }) },
    });
    if (!claimed.count) refuse(409, 'This shipment was just changed by someone else. Reload and try again.');
    if (!resuming) {
      for (const item of shipment.items) {
        const line = await tx.orderLine.update({ where: { id: item.orderLineId }, data: { qtyShipped: { increment: item.qtyShipped } } });
        if (num(line.qtyShipped) > num(line.qtyOrdered) + 1e-9) refuse(409, `Line ${line.lineNumber} would ship more than was ordered`);
        await tx.orderLine.update({ where: { id: line.id }, data: { lineStatus: lineStatusFor(num(line.qtyOrdered), num(line.qtyShipped)) } });
        await consumeReserved(tx, shipment, item, userId);
      }
      const lines = await tx.orderLine.findMany({ where: { orderId: shipment.orderId }, select: { lineStatus: true } });
      const status = orderStatusFromLines(lines.map((l) => l.lineStatus));
      if (status) await tx.order.update({ where: { id: shipment.orderId }, data: { status } });
    }
    return tx.shipment.findUnique({ where: { id }, include: { items: true, order: { select: { id: true, status: true } } } });
  }));
}

async function move(id, to, extra = {}) {
  const shipment = await prisma.shipment.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!shipment) refuse(404, 'Shipment not found');
  const why = shipmentMoveError(shipment.status, to);
  if (why) refuse(409, why);
  const changed = await prisma.shipment.updateMany({ where: { id, status: shipment.status }, data: { ...extra, status: to } });
  if (!changed.count) refuse(409, 'This shipment was just changed by someone else. Reload and try again.');
  return prisma.shipment.findUnique({ where: { id }, include: { items: true } });
}

const deliver = (id, body) => move(id, 'DELIVERED', {
  deliveredAt: new Date(),
  podCaptured: Boolean(body.podSignature || body.podImageUrl),
  ...(body.podSignature !== undefined && { podSignature: body.podSignature }),
  ...(body.podImageUrl !== undefined && { podImageUrl: body.podImageUrl }),
});

router.put('/:id/dispatch', handle('dispatch', async (req, res) => {
  res.json(await dispatch(req.params.id, req.body || {}, req.user.id));
}));

router.put('/:id/deliver', handle('mark delivered', async (req, res) => {
  res.json(await deliver(req.params.id, req.body || {}));
}));

router.patch('/:id/status', handle('update shipment status', async (req, res) => {
  const { status, ...rest } = req.body || {};
  if (status === 'IN_TRANSIT') return res.json(await dispatch(req.params.id, rest, req.user.id));
  if (status === 'DELIVERED') return res.json(await deliver(req.params.id, rest));
  res.json(await move(req.params.id, status));
}));

export default router;
