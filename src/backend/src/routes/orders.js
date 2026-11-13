/**
 * Orders API.
 *
 *   GET  /api/orders?orderType=&status=&buyerId=
 *   GET  /api/orders/:id
 *   POST /api/orders                  create (totals are checked against the lines)
 *   PUT  /api/orders/:id              edit header fields or move status; cancelling
 *                                     gives reserved stock back
 *   POST /api/orders/:id/allocate     reserve stock for a line { lineId, coilId, qty }
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { orderMoveError, positiveQty } from '../lib/workflowRules.js';

const router = Router();

const ORDER_TYPES = ['RFQ', 'QUOTE', 'SO', 'PO', 'RETURN'];
const HEADER_FIELDS = [
  'buyerId', 'sellerId', 'shipToAddress', 'shipToCity', 'shipToState', 'shipToZip', 'requiredDate', 'promisedDate',
  'expireDate', 'currency', 'paymentTerms', 'freightTerms', 'poReference', 'notes',
];
const DATE_FIELDS = ['requiredDate', 'promisedDate', 'expireDate'];
const LINE_FIELDS = [
  'productId', 'gradeId', 'description', 'thicknessIn', 'widthIn', 'lengthIn', 'finish', 'coating', 'unit', 'unitPrice',
  'priceUnit', 'discountPct', 'notes', 'gradeOverride', 'surfaceFinish', 'tolerancePreset', 'thkTolerancePlus',
  'thkToleranceMinus', 'lenTolerancePlus', 'lenToleranceMinus', 'widTolerancePlus', 'widToleranceMinus',
  'certRequirements', 'specNotes',
];
const money = (n) => Math.round(n * 100) / 100;
const fail = (status, error) => ({ status, error });

function pickHeader(body) {
  const data = {};
  for (const f of HEADER_FIELDS) {
    if (body[f] === undefined) continue;
    if (DATE_FIELDS.includes(f) && body[f] !== null) {
      const d = new Date(body[f]);
      if (Number.isNaN(d.getTime())) return fail(400, `${f} is not a valid date`);
      data[f] = d;
    } else data[f] = body[f];
  }
  return { data };
}

/** Line total from quantity and price when both are on a unit we can convert. */
function extendedFor(qty, unit, unitPrice, priceUnit) {
  if (unitPrice == null) return null;
  const price = Number(unitPrice);
  if (!Number.isFinite(price) || price < 0) return undefined;
  if (priceUnit === 'EACH') return money(qty * price);
  if (unit !== 'LB') return null;
  if (priceUnit === 'LB') return money(qty * price);
  if (priceUnit === 'CWT') return money((qty / 100) * price);
  if (priceUnit === 'TON') return money((qty / 2000) * price);
  return null;
}

function buildLines(lines) {
  if (lines === undefined) return { lines: [] };
  if (!Array.isArray(lines)) return fail(400, 'lines must be a list');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] || {};
    const qty = positiveQty(raw.qtyOrdered);
    if (qty === null) return fail(400, `Line ${i + 1}: qtyOrdered must be more than zero`);
    const line = { lineNumber: i + 1, qtyOrdered: qty };
    for (const f of LINE_FIELDS) if (raw[f] !== undefined) line[f] = raw[f];
    const unit = line.unit || 'LB';
    const priceUnit = line.priceUnit || 'CWT';
    const computed = extendedFor(qty, unit, line.unitPrice, priceUnit);
    if (computed === undefined) return fail(400, `Line ${i + 1}: unitPrice must be zero or more`);
    if (raw.extendedPrice != null) {
      const given = Number(raw.extendedPrice);
      if (!Number.isFinite(given) || given < 0) return fail(400, `Line ${i + 1}: extendedPrice must be zero or more`);
      if (computed !== null && Math.abs(given - computed) > 0.01) {
        return fail(400, `Line ${i + 1}: extendedPrice ${given} does not match quantity × price (${computed})`);
      }
      line.extendedPrice = money(given);
    } else if (computed !== null) line.extendedPrice = computed;
    out.push(line);
  }
  return { lines: out };
}

/** Header totals, checked against the lines. Never silently replaces a total the caller sent. */
function buildTotals(body, lines) {
  const amount = (name) => {
    if (body[name] == null) return null;
    const n = Number(body[name]);
    return Number.isFinite(n) && n >= 0 ? money(n) : undefined;
  };
  const [subtotal, tax, freight, total] = ['subtotal', 'taxAmount', 'freightAmount', 'totalAmount'].map(amount);
  if ([subtotal, tax, freight, total].includes(undefined)) return fail(400, 'Amounts must be zero or more');
  const data = {};
  const allPriced = lines.length > 0 && lines.every((l) => l.extendedPrice != null);
  const fromLines = allPriced ? money(lines.reduce((s, l) => s + l.extendedPrice, 0)) : null;
  if (subtotal !== null && fromLines !== null && Math.abs(subtotal - fromLines) > 0.01) {
    return fail(400, `subtotal ${subtotal} does not match the lines (${fromLines})`);
  }
  const sub = subtotal ?? fromLines;
  if (sub !== null) data.subtotal = sub;
  if (tax !== null) data.taxAmount = tax;
  if (freight !== null) data.freightAmount = freight;
  if (sub !== null) {
    const expected = money(sub + (tax || 0) + (freight || 0));
    if (total !== null && Math.abs(total - expected) > 0.01) {
      return fail(400, `totalAmount ${total} does not match subtotal + tax + freight (${expected})`);
    }
    data.totalAmount = expected;
  } else if (total !== null) data.totalAmount = total;
  return { data };
}

async function checkRefs(header) {
  for (const f of ['buyerId', 'sellerId']) {
    if (header[f] && !(await prisma.organization.findUnique({ where: { id: header[f] }, select: { id: true } }))) {
      return `${f === 'buyerId' ? 'Customer' : 'Seller'} not found`;
    }
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { orderType, status, buyerId } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        ...(orderType && { orderType }),
        ...(status && { status }),
        ...(buyerId && { buyerId }),
      },
      include: { buyer: true, seller: true, lines: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(orders);
  } catch (error) {
    if (error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'Invalid orderType or status filter' });
    console.error('Orders: list failed:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: true,
        seller: true,
        lines: { include: { product: true, grade: true, allocations: { include: { coil: true } } } },
        shipments: true,
        invoices: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Orders: load failed:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const orderType = body.orderType || 'SO';
    if (!ORDER_TYPES.includes(orderType)) return res.status(400).json({ error: `orderType must be one of: ${ORDER_TYPES.join(', ')}` });
    if (orderType === 'RETURN') return res.status(400).json({ error: 'Returns are created on the returns page (POST /api/returns), against the order being returned' });
    const status = body.status || 'DRAFT';
    if (!['DRAFT', 'PENDING', 'CONFIRMED'].includes(status)) return res.status(400).json({ error: 'A new order must be DRAFT, PENDING or CONFIRMED' });

    const header = pickHeader(body);
    if (header.error) return res.status(header.status).json({ error: header.error });
    const built = buildLines(body.lines);
    if (built.error) return res.status(built.status).json({ error: built.error });
    const totals = buildTotals(body, built.lines);
    if (totals.error) return res.status(totals.status).json({ error: totals.error });
    if (!header.data.buyerId && !header.data.sellerId && !built.lines.length) {
      return res.status(400).json({ error: 'An order needs a customer or at least one line' });
    }
    const refError = await checkRefs(header.data);
    if (refError) return res.status(400).json({ error: refError });

    const order = await createNumbered({
      count: () => prisma.order.count(),
      format: padded(orderType),
      create: (orderNumber) => prisma.order.create({
        data: {
          ...header.data, ...totals.data, orderType, status, orderNumber,
          createdById: req.user.id,
          lines: { create: built.lines },
        },
        include: { lines: true, buyer: true },
      }),
    });
    res.status(201).json(order);
  } catch (error) {
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'Order has a field that is not valid (check product, grade and unit values)' });
    }
    console.error('Orders: create failed:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/** Gives every open reservation on the order back to stock. Runs inside a transaction. */
async function releaseAllocations(tx, orderId) {
  const allocations = await tx.orderLineAllocation.findMany({ where: { orderLine: { orderId } } });
  for (const a of allocations) {
    if (Number(a.qtyAllocated) <= 0) continue;
    await tx.inventory.update({
      where: { coilId: a.coilId },
      data: { qtyAllocated: { decrement: a.qtyAllocated }, qtyAvailable: { increment: a.qtyAllocated } },
    });
  }
  await tx.orderLineAllocation.deleteMany({ where: { orderLine: { orderId } } });
  for (const coilId of new Set(allocations.map((a) => a.coilId))) {
    const stillHeld = await tx.orderLineAllocation.count({ where: { coilId } });
    if (!stillHeld) await tx.coil.updateMany({ where: { id: coilId, status: 'ALLOCATED' }, data: { status: 'AVAILABLE' } });
  }
}

router.put('/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { id: true, status: true, orderType: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.orderType === 'RETURN') return res.status(409).json({ error: 'Returns are received or cancelled on the returns page' });

    const header = pickHeader(body);
    if (header.error) return res.status(header.status).json({ error: header.error });
    const data = header.data;
    if (['COMPLETE', 'CANCELLED'].includes(order.status) && (Object.keys(data).length || (body.status && body.status !== order.status))) {
      const why = orderMoveError(order.status, body.status && body.status !== order.status ? body.status : 'DRAFT');
      return res.status(409).json({ error: why || `A ${order.status.toLowerCase()} order cannot be changed` });
    }
    const refError = await checkRefs(data);
    if (refError) return res.status(400).json({ error: refError });

    const moving = body.status !== undefined && body.status !== order.status;
    if (moving) {
      const why = orderMoveError(order.status, body.status);
      if (why) return res.status(409).json({ error: why });
      data.status = body.status;
    }
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to update' });

    const updated = await prisma.$transaction(async (tx) => {
      // Guard against two people changing the status at once.
      const changed = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data });
      if (!changed.count) return null;
      if (moving && data.status === 'CANCELLED') {
        await releaseAllocations(tx, order.id);
        await tx.orderLine.updateMany({ where: { orderId: order.id }, data: { lineStatus: 'CANCELLED' } });
      }
      return tx.order.findUnique({ where: { id: order.id }, include: { lines: true } });
    });
    if (!updated) return res.status(409).json({ error: 'This order was just changed by someone else. Reload and try again.' });
    res.json(updated);
  } catch (error) {
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'Order has a field that is not valid' });
    console.error('Orders: update failed:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.post('/:id/allocate', async (req, res) => {
  try {
    const { lineId, coilId } = req.body || {};
    const qty = positiveQty(req.body?.qty);
    if (!lineId || !coilId) return res.status(400).json({ error: 'lineId and coilId are required' });
    if (qty === null) return res.status(400).json({ error: 'qty must be more than zero' });

    const line = await prisma.orderLine.findUnique({ where: { id: lineId }, include: { order: { select: { id: true, status: true } }, allocations: true } });
    if (!line || line.orderId !== req.params.id) return res.status(404).json({ error: 'Order line not found on this order' });
    if (['CANCELLED', 'COMPLETE'].includes(line.order.status)) return res.status(409).json({ error: `Cannot reserve stock for a ${line.order.status.toLowerCase()} order` });
    const held = line.allocations.reduce((s, a) => s + Number(a.qtyAllocated), 0);
    const open = Number(line.qtyOrdered) - Number(line.qtyShipped) - held;
    if (qty > open + 1e-9) return res.status(409).json({ error: `Only ${Math.max(open, 0)} is still unreserved on this line` });

    const coil = await prisma.coil.findUnique({ where: { id: coilId }, select: { id: true, status: true, qcStatus: true, inventory: { select: { qtyAvailable: true } } } });
    if (!coil || !coil.inventory) return res.status(404).json({ error: 'Stock item not found' });
    if (coil.status === 'HOLD' || ['FAILED', 'HOLD'].includes(coil.qcStatus)) return res.status(409).json({ error: 'This stock is on hold and cannot be reserved' });

    const allocation = await prisma.$transaction(async (tx) => {
      // Only succeeds while enough is still available, so two reservations can't both take the last of it.
      const taken = await tx.inventory.updateMany({
        where: { coilId, qtyAvailable: { gte: qty } },
        data: { qtyAllocated: { increment: qty }, qtyAvailable: { decrement: qty } },
      });
      if (!taken.count) return null;
      await tx.coil.updateMany({ where: { id: coilId, status: 'AVAILABLE' }, data: { status: 'ALLOCATED' } });
      return tx.orderLineAllocation.create({ data: { orderLineId: lineId, coilId, qtyAllocated: qty } });
    });
    if (!allocation) return res.status(409).json({ error: `Not enough available: ${Number(coil.inventory.qtyAvailable)} on hand to reserve` });
    res.status(201).json(allocation);
  } catch (error) {
    console.error('Orders: allocate failed:', error);
    res.status(500).json({ error: 'Failed to allocate' });
  }
});

export default router;
