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
import { COMMITTED_STATUSES, HOLD_PLACED, statusAfterCreditCheck, recordCreditHold, openCreditHold, releaseCreditHold, creditHoldMessage } from '../lib/creditControl.js';
import { MONEY_MANAGERS } from '../lib/roleAccess.js';
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

// GET /api/orders/credit-holds: the orders waiting for a manager, oldest first.
router.get('/credit-holds', async (req, res) => {
  try {
    const held = await prisma.order.findMany({
      where: { orderType: 'SO', status: 'HOLD' },
      select: { id: true, orderNumber: true, totalAmount: true, createdAt: true, buyer: { select: { id: true, code: true, name: true } }, createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { updatedAt: 'asc' }, take: 500,
    });
    const rows = [];
    for (const o of held) {
      const hold = await openCreditHold(prisma, o.id);
      if (!hold) continue;
      rows.push({
        id: o.id, orderNumber: o.orderNumber, customer: o.buyer?.name || null, customerCode: o.buyer?.code || null, total: Number(o.totalAmount || 0),
        enteredBy: o.createdBy ? `${o.createdBy.firstName || ''} ${o.createdBy.lastName || ''}`.trim() : null,
        heldAt: hold.timestamp, limit: hold.details?.limit ?? null, exposure: hold.details?.exposure ?? null, overBy: hold.details?.overBy ?? null,
      });
    }
    res.json({ data: rows, canRelease: MONEY_MANAGERS.has(req.user?.role) });
  } catch (error) {
    console.error('Orders: credit holds failed:', error);
    res.status(500).json({ error: 'The credit holds could not be loaded' });
  }
});

// POST /api/orders/:id/credit-release { note? }: a manager lets a held order go ahead.
router.post('/:id/credit-release', async (req, res) => {
  try {
    if (!MONEY_MANAGERS.has(req.user?.role)) return res.status(403).json({ error: 'Releasing a credit hold needs a manager.' });
    const note = req.body?.note ? String(req.body.note).trim().slice(0, 500) : null;
    const order = await releaseCreditHold({ orderId: req.params.id, user: req.user, note });
    res.json(order);
  } catch (error) {
    if (error?.refuse) return res.status(error.status).json({ error: error.message });
    console.error('Orders: credit release failed:', error);
    res.status(500).json({ error: 'The credit hold could not be released' });
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
    const hold = order.status === 'HOLD' ? await openCreditHold(prisma, order.id) : null;
    res.json(hold ? { ...order, creditHold: { ...hold.details, placedAt: hold.timestamp, message: creditHoldMessage(hold.details) } } : order);
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

    // Rule 32: a sales order that would put the account over its credit limit is saved on hold.
    const gate = orderType === 'SO'
      ? await statusAfterCreditCheck(prisma, { customerId: header.data.buyerId, orderTotal: totals.data.totalAmount, wanted: status })
      : { status, creditHold: null };

    const order = await createNumbered({
      count: () => prisma.order.count(),
      format: padded(orderType),
      create: (orderNumber) => prisma.order.create({
        data: {
          ...header.data, ...totals.data, orderType, status: gate.status, orderNumber,
          createdById: req.user.id,
          lines: { create: built.lines },
        },
        include: { lines: true, buyer: true },
      }),
    });
    if (gate.creditHold) await recordCreditHold(prisma, { orderId: order.id, orderNumber: order.orderNumber, creditHold: gate.creditHold, user: req.user });
    res.status(201).json(gate.creditHold ? { ...order, creditHold: gate.creditHold, warning: gate.creditHold.message } : order);
  } catch (error) {
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'Order has a field that is not valid (check product, grade and unit values)' });
    }
    console.error('Orders: create failed:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/** Gives every open reservation on the order back to stock. Runs inside a transaction. */
export async function releaseAllocations(tx, orderId) {
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
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { id: true, status: true, orderType: true, orderNumber: true, buyerId: true, totalAmount: true } });
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

    // Rule 32. An order on credit hold goes ahead only when a manager releases it.
    let gate = { creditHold: null };
    if (order.orderType === 'SO' && moving && COMMITTED_STATUSES.includes(data.status)) {
      if (order.status === 'HOLD' && (await openCreditHold(prisma, order.id))) {
        return res.status(409).json({ error: 'This order is on credit hold. A manager releases it.' });
      }
      gate = await statusAfterCreditCheck(prisma, {
        customerId: data.buyerId !== undefined ? data.buyerId : order.buyerId, orderId: order.id,
        orderTotal: data.totalAmount !== undefined ? data.totalAmount : order.totalAmount, wanted: data.status,
      });
      if (gate.creditHold) {
        if (order.status === 'HOLD') return res.status(409).json({ error: gate.creditHold.message, creditHold: gate.creditHold });
        data.status = 'HOLD';
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Guard against two people changing the status at once.
      const changed = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data });
      if (!changed.count) return null;
      if (moving && data.status === 'CANCELLED') {
        await releaseAllocations(tx, order.id);
        await tx.orderLine.updateMany({ where: { orderId: order.id }, data: { lineStatus: 'CANCELLED' } });
      }
      if (gate.creditHold) await recordCreditHold(tx, { orderId: order.id, orderNumber: order.orderNumber, creditHold: gate.creditHold, user: req.user });
      return tx.order.findUnique({ where: { id: order.id }, include: { lines: true } });
    });
    if (!updated) return res.status(409).json({ error: 'This order was just changed by someone else. Reload and try again.' });
    res.json(gate.creditHold ? { ...updated, creditHold: gate.creditHold, warning: gate.creditHold.message } : updated);
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
