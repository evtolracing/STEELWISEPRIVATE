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
import { listWindow, sendWindow } from '../lib/listing.js';
import { recordBusinessEvent, kick } from '../services/webhookService.js';
import { COMMITTED_STATUSES, HOLD_PLACED, statusAfterCreditCheck, recordCreditHold, openCreditHold, releaseCreditHold, creditHoldMessage } from '../lib/creditControl.js';
import { MONEY_MANAGERS, COST_VIEWERS } from '../lib/roleAccess.js';
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded, retryOverlap } from '../lib/numbering.js';
import { orderMoveError, positiveQty } from '../lib/workflowRules.js';
import { reservationProblem } from '../lib/reservationRules.js';

const STALE_EDIT = 'This order was just changed by someone else. Reload and try again.';
import { closeoutOf, openOrders, orderCost } from '../lib/orderCloseout.js';
const CLOSEOUT_REASONS = ['TO_SHIP', 'ON_DOCK', 'ON_ROAD', 'SHIPMENT_PROBLEM', 'NOT_INVOICED', 'UNPAID', 'CREDIT_OWED', 'RETURN_OPEN', 'JOB_OPEN', 'STOCK_RESERVED', 'ON_HOLD'];
const router = Router();

const ORDER_TYPES = ['RFQ', 'QUOTE', 'SO', 'PO', 'RETURN'];
const HEADER_FIELDS = [
  'buyerId', 'sellerId', 'shipToAddress', 'shipToCity', 'shipToState', 'shipToZip', 'requiredDate', 'promisedDate',
  'expireDate', 'currency', 'paymentTerms', 'freightTerms', 'poReference', 'notes', 'locationId',
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

/** A closed account takes no new business, the same rule as counter sales and order intake (J-002). */
async function inactiveBuyer(buyerId) {
  if (!buyerId) return false;
  const buyer = await prisma.organization.findUnique({ where: { id: String(buyerId) }, select: { isActive: true } });
  return buyer ? buyer.isActive === false : false;
}
const INACTIVE = 'This customer account is inactive. Reactivate it before entering an order for it.';
// An order with nothing on it can be kept as a draft to fill in later, but it cannot go any
// further: there is nothing to reserve, make, ship or bill (H-011; the database check
// "orders with no lines (not draft or cancelled)" holds the same rule).
const NO_LINES = 'An order needs at least one line before it leaves draft.';

async function checkRefs(header) {
  for (const f of ['buyerId', 'sellerId']) {
    if (header[f] && !(await prisma.organization.findUnique({ where: { id: header[f] }, select: { id: true } }))) {
      return `${f === 'buyerId' ? 'Customer' : 'Seller'} not found`;
    }
  }
  if (header.locationId && !(await prisma.location.findUnique({ where: { id: header.locationId }, select: { id: true } }))) return 'Branch not found';
  return null;
}

router.get('/', async (req, res) => {
  try {
    const { orderType, status, buyerId, view } = req.query;
    if (view !== undefined && view !== 'summary') return res.status(400).json({ error: 'view must be "summary" when it is given' });
    // `search` narrows the list by order number, customer PO or customer name. It only ever narrows:
    // the branch and role rules below still decide which orders can be listed at all.
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 60) : '';
    const like = { contains: search, mode: 'insensitive' };
    const where = {
      ...(orderType && { orderType }),
      ...(status && { status }),
      ...(buyerId && { buyerId }),
      ...(search && { OR: [{ orderNumber: like }, { poReference: like }, { buyer: { name: like } }] }),
    };
    const window = listWindow(req.query, { max: 100 });
    // `view=summary` is the list a screen shows: the header, who it is for and how many lines.
    // Without it the answer is unchanged: every line and both organisations in full.
    const shape = view === 'summary'
      ? { include: { buyer: { select: { id: true, code: true, name: true } } } }
      : { include: { buyer: true, seller: true, lines: true } };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, ...shape, orderBy: { createdAt: 'desc' }, take: window.take, skip: window.skip }),
      window.windowed || view ? prisma.order.count({ where }) : null,
    ]);
    // Lines are counted for the orders on this page only. Asking for the count as part of the
    // list query made the database count the lines of every order (measured at 80 branches:
    // the summary was slower than the full list).
    let rows = orders;
    if (view === 'summary') {
      const counts = orders.length ? await prisma.orderLine.groupBy({ by: ['orderId'], where: { orderId: { in: orders.map((o) => o.id) } }, _count: { _all: true } }) : [];
      const lineCount = new Map(counts.map((c) => [c.orderId, c._count._all]));
      rows = orders.map((o) => ({ ...o, lineCount: lineCount.get(o.id) || 0 }));
    }
    sendWindow(res, rows, { ...window, total });
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

// What stands between each order and closed (Phase 8, N-018). Oldest first; ?reason= narrows to one kind of open item.
router.get('/closeout', async (req, res) => {
  try {
    const reason = req.query.reason ? String(req.query.reason).toUpperCase() : null;
    if (reason && !CLOSEOUT_REASONS.includes(reason)) return res.status(400).json({ error: `reason must be one of: ${CLOSEOUT_REASONS.join(', ')}` });
    res.json(await openOrders({ limit: req.query.limit, offset: req.query.offset, reason, locationId: req.query.locationId, customerId: req.query.customerId, search: typeof req.query.search === 'string' ? req.query.search.trim() : '' }));
  } catch (error) {
    console.error('Orders: closeout list failed:', error);
    res.status(500).json({ error: 'Failed to list open orders' });
  }
});

router.get('/:id/closeout', async (req, res) => {
  try {
    const position = await closeoutOf(req.params.id);
    if (!position) return res.status(404).json({ error: 'Order not found' });
    res.json(position);
  } catch (error) {
    console.error('Orders: closeout failed:', error);
    res.status(500).json({ error: 'Failed to read the order closeout' });
  }
});

// What the order brought in and what it cost (N-017). Cost is for the people who may see cost.
router.get('/:id/cost', async (req, res) => {
  try {
    if (!COST_VIEWERS.has(req.user?.role)) return res.status(403).json({ error: 'Cost and margin are shown to managers, the inventory manager and buyers.' });
    const cost = await orderCost(req.params.id);
    if (!cost) return res.status(404).json({ error: 'Order not found' });
    res.json(cost);
  } catch (error) {
    console.error('Orders: cost failed:', error);
    res.status(500).json({ error: 'Failed to read the order cost' });
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
    if (await inactiveBuyer(header.data.buyerId)) return res.status(409).json({ error: INACTIVE, code: 'CUSTOMER_INACTIVE' });
    if (status !== 'DRAFT' && !built.lines.length) return res.status(400).json({ error: NO_LINES, code: 'NO_LINES' });

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
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { id: true, status: true, orderType: true, orderNumber: true, buyerId: true, totalAmount: true, updatedAt: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // An edit may say which version of the order it was made from. If the order has been saved
    // since, the edit is refused instead of silently overwriting the other person's change (G-020).
    const expected = body.expectedUpdatedAt;
    if (expected !== undefined && expected !== null) {
      const at = new Date(expected);
      if (Number.isNaN(at.getTime())) return res.status(400).json({ error: 'expectedUpdatedAt is not a valid date' });
      if (at.getTime() !== order.updatedAt.getTime()) return res.status(409).json({ error: STALE_EDIT, code: 'STALE_EDIT', updatedAt: order.updatedAt });
    }
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
    if (data.buyerId && data.buyerId !== order.buyerId && (await inactiveBuyer(data.buyerId))) return res.status(409).json({ error: INACTIVE, code: 'CUSTOMER_INACTIVE' });

    const moving = body.status !== undefined && body.status !== order.status;
    if (moving) {
      const why = orderMoveError(order.status, body.status);
      if (why) return res.status(409).json({ error: why });
      if (body.status !== 'CANCELLED' && !(await prisma.orderLine.count({ where: { orderId: order.id } }))) return res.status(409).json({ error: NO_LINES, code: 'NO_LINES' });
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

    // Run again when it overlaps another save (N-029): cancelling releases stock while a dispatch of the same
    // order takes it, and the database stops one of the two. The second pass sees what the other did.
    const updated = await retryOverlap(() => prisma.$transaction(async (tx) => {
      // Guard against two people changing the status at once.
      const changed = await tx.order.updateMany({ where: { id: order.id, status: order.status, ...(expected != null && { updatedAt: order.updatedAt }) }, data });
      if (!changed.count) return null;
      if (order.orderType === 'SO' && data.status !== undefined && data.status !== order.status) {
        const fact = { orderId: order.id, orderNumber: order.orderNumber, from: order.status, status: data.status };
        if (data.status === 'CONFIRMED') await recordBusinessEvent(tx, 'order.confirmed', order.id, fact, { customerOrgId: order.buyerId });
        await recordBusinessEvent(tx, 'order.status_changed', `${order.id}:${order.status}>${data.status}:${Date.now()}`, fact, { customerOrgId: order.buyerId });
      }
      // Who moved the order, from what to what, in the same save as the move itself.
      if (data.status !== undefined && data.status !== order.status) {
        await tx.auditLog.create({ data: {
          category: 'WORKFLOW', eventType: 'ORDER_STATUS_CHANGED', action: 'UPDATE', userId: req.user?.id || null, resourceType: 'Order', resourceId: order.id,
          details: { orderNumber: order.orderNumber, from: order.status, to: data.status, ...(data.totalAmount !== undefined && Number(data.totalAmount) !== Number(order.totalAmount) && { totalFrom: Number(order.totalAmount), totalTo: Number(data.totalAmount) }) },
        } });
      }
      if (moving && data.status === 'CANCELLED') {
        await releaseAllocations(tx, order.id);
        await tx.orderLine.updateMany({ where: { orderId: order.id }, data: { lineStatus: 'CANCELLED' } });
        // Shipments still on the dock go with the order (Phase 8, N-006): nothing has left, and
        // none of them could ever be dispatched. Each keeps a line in its history saying why.
        const open = await tx.shipment.findMany({ where: { orderId: order.id, status: { in: ['PENDING', 'LOADING'] } }, select: { id: true, shipmentNumber: true, status: true } });
        for (const sh of open) {
          await tx.shipment.update({ where: { id: sh.id }, data: { status: 'CANCELLED' } });
          await tx.auditLog.create({ data: {
            category: 'WORKFLOW', eventType: 'SHIPMENT_STATUS_CHANGED', severity: 'INFO', action: 'UPDATE', userId: req.user?.id || null, resourceType: 'Shipment', resourceId: sh.id,
            details: { shipmentNumber: sh.shipmentNumber, from: sh.status, to: 'CANCELLED', note: `Order ${order.orderNumber} was cancelled` },
          } });
        }
      }
      if (gate.creditHold) await recordCreditHold(tx, { orderId: order.id, orderNumber: order.orderNumber, creditHold: gate.creditHold, user: req.user });
      return tx.order.findUnique({ where: { id: order.id }, include: { lines: true } });
    }));
    if (!updated) return res.status(409).json({ error: STALE_EDIT, code: 'STALE_EDIT' });
    kick();
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

    // Seen through the user's branch first: a line they may not open is "not found".
    const seen = await prisma.orderLine.findUnique({ where: { id: lineId }, select: { orderId: true } });
    if (!seen || seen.orderId !== req.params.id) return res.status(404).json({ error: 'Order line not found on this order' });
    const coil = await prisma.coil.findUnique({
      where: { id: coilId },
      select: {
        id: true, coilNumber: true, status: true, qcStatus: true, gradeId: true, ownerId: true, thicknessIn: true, widthIn: true, lengthIn: true,
        grade: { select: { code: true } }, owner: { select: { name: true } }, inventory: { select: { qtyAvailable: true, unit: true, status: true } },
      },
    });
    if (!coil || !coil.inventory) return res.status(404).json({ error: 'Stock item not found' });
    if (coil.status === 'HOLD' || ['FAILED', 'HOLD'].includes(coil.qcStatus)) return res.status(409).json({ error: 'This stock is on hold and cannot be reserved' });
    // What the line needs and what the item is must agree (Phase 6, lib/reservationRules.js).
    const want = await prisma.orderLine.findUnique({
      where: { id: lineId },
      select: { lineNumber: true, unit: true, gradeId: true, thicknessIn: true, widthIn: true, lengthIn: true, thkTolerancePlus: true, thkToleranceMinus: true, grade: { select: { code: true } }, order: { select: { buyerId: true, sellerId: true } } },
    });
    const me = await prisma.user.findUnique({ where: { id: req.user.id }, select: { organizationId: true } });
    const problem = reservationProblem({
      line: { ...want, gradeCode: want.grade?.code }, order: want.order,
      coil: { ...coil, gradeCode: coil.grade?.code, ownerName: coil.owner?.name }, inventory: coil.inventory,
      houseOrgIds: [me?.organizationId, want.order?.sellerId].filter(Boolean),
    });
    if (problem) return res.status(problem.status).json({ error: problem.error, code: problem.code });

    const outcome = await prisma.$transaction(async (tx) => {
      // The order row is locked for the length of the reservation. A cancellation, or a second
      // reservation for the same order, waits its turn and then sees what this one saved, so a
      // line is never reserved beyond what it needs and a cancelled order never keeps stock.
      const [locked] = await tx.$queryRaw`SELECT status::text AS status FROM "Order" WHERE id = ${req.params.id} FOR UPDATE`;
      if (!locked) return fail(404, 'Order line not found on this order');
      if (['CANCELLED', 'COMPLETE'].includes(locked.status)) return fail(409, `Cannot reserve stock for a ${locked.status.toLowerCase()} order`);
      const line = await tx.orderLine.findUnique({ where: { id: lineId }, include: { allocations: true } });
      const held = line.allocations.reduce((sum, a) => sum + Number(a.qtyAllocated), 0);
      const open = Number(line.qtyOrdered) - Number(line.qtyShipped) - held;
      if (qty > open + 1e-9) return fail(409, `Only ${Math.max(open, 0)} is still unreserved on this line`);
      // Only succeeds while enough is still available, so two reservations can't both take the last of it.
      const taken = await tx.inventory.updateMany({
        where: { coilId, qtyAvailable: { gte: qty } },
        data: { qtyAllocated: { increment: qty }, qtyAvailable: { decrement: qty } },
      });
      if (!taken.count) return fail(409, `Not enough available: ${Number(coil.inventory.qtyAvailable)} on hand to reserve`);
      await tx.coil.updateMany({ where: { id: coilId, status: 'AVAILABLE' }, data: { status: 'ALLOCATED' } });
      const allocation = await tx.orderLineAllocation.create({ data: { orderLineId: lineId, coilId, qtyAllocated: qty } });
      await tx.auditLog.create({ data: {
        category: 'WORKFLOW', eventType: 'STOCK_RESERVED', action: 'CREATE', userId: req.user?.id || null, resourceType: 'Order', resourceId: req.params.id,
        details: { orderLineId: lineId, coilId, qty, allocationId: allocation.id },
      } });
      return { allocation };
    });
    if (outcome.error) return res.status(outcome.status).json({ error: outcome.error });
    const { allocation } = outcome;
    res.status(201).json(allocation);
  } catch (error) {
    console.error('Orders: allocate failed:', error);
    res.status(500).json({ error: 'Failed to allocate' });
  }
});

export default router;
