/**
 * Customer returns (RMAs).
 *
 *   GET  /api/returns                 list (orderId, customerId, status)
 *   GET  /api/returns/eligible?orderNumber=   what can still be returned on an order
 *   GET  /api/returns/:id             one return
 *   POST /api/returns                 { orderId, reason, lines: [{ orderLineId, quantity, disposition?, coilId?, notes? }] }
 *   POST /api/returns/:id/receive     material is back on the dock: restock or scrap it, and credit the customer
 *   POST /api/returns/:id/cancel      before anything has been received
 *
 * Rules:
 *  - Only material that has shipped can come back, and never more than shipped
 *    minus what is already on another return.
 *  - Each line is RESTOCK (goes back into the stock item it shipped from) or
 *    SCRAP (written off; stock does not change).
 *  - Receiving a return issues a credit memo for what was invoiced on the
 *    returned quantity. Material that was never invoiced gets no credit.
 *  - A return that has been received cannot be cancelled.
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded, retryOverlap } from '../lib/numbering.js';
import { positiveQty } from '../lib/workflowRules.js';
import { lineAmount } from '../lib/billingRules.js';
import { creditInvoice, BillingError } from '../services/billing.js';
import { placeHold } from '../lib/holds.js';
import { unitKey } from '../lib/reservationRules.js';
import { CREDIT_NOT_ISSUED, CREDIT_ISSUED_LATER } from '../lib/orderCloseout.js';
import { recordMovement } from '../services/ledger.js';

const router = Router();
// RESTOCK: back on the shelf. INSPECT: back on the books but held until inspected (Phase 6). SCRAP: not restocked.
const DISPOSITIONS = ['RESTOCK', 'INSPECT', 'SCRAP'];
const num = (d) => Number(d || 0);
const SERIALIZABLE = { isolationLevel: 'Serializable' };

class Refuse extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const refuse = (status, message) => { throw new Refuse(status, message); };
const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof Refuse || error instanceof BillingError || error?.refuse) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'The return has a field that is not valid' });
    console.error(`Returns: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

const INCLUDE = {
  lines: { orderBy: { lineNumber: 'asc' } },
  buyer: { select: { id: true, name: true, code: true } },
};

async function toApi(ret) {
  if (!ret) return ret;
  const [original, credits] = await Promise.all([
    ret.returnOfOrderId ? prisma.order.findUnique({ where: { id: ret.returnOfOrderId }, select: { id: true, orderNumber: true } }) : null,
    prisma.invoice.findMany({ where: { kind: 'CREDIT', notes: { contains: ret.orderNumber } }, select: { id: true, invoiceNumber: true, totalAmount: true, creditOfInvoiceId: true } }),
  ]);
  return {
    id: ret.id, returnNumber: ret.orderNumber, status: ret.status, reason: ret.notes,
    customer: ret.buyer, customerId: ret.buyerId, originalOrder: original,
    createdAt: ret.createdAt, updatedAt: ret.updatedAt, totalAmount: num(ret.totalAmount),
    lines: ret.lines.map((l) => ({
      id: l.id, lineNumber: l.lineNumber, orderLineId: l.returnOfLineId, description: l.description,
      quantity: num(l.qtyOrdered), qtyReceived: num(l.qtyReceived), unit: l.unit,
      disposition: l.returnDisposition, value: num(l.extendedPrice), status: l.lineStatus, notes: l.notes,
    })),
    credits: credits.map((c) => ({ ...c, totalAmount: num(c.totalAmount) })),
  };
}

/** Quantity of each original line already on a return that is not cancelled. */
async function returnedByLine(db, orderId, ignoreReturnId) {
  const rows = await db.orderLine.findMany({
    where: { returnOfLineId: { not: null }, lineStatus: { not: 'CANCELLED' }, order: { returnOfOrderId: orderId, orderType: 'RETURN', status: { not: 'CANCELLED' }, ...(ignoreReturnId && { id: { not: ignoreReturnId } }) } },
    select: { returnOfLineId: true, qtyOrdered: true },
  });
  const map = new Map();
  for (const r of rows) map.set(r.returnOfLineId, (map.get(r.returnOfLineId) || 0) + num(r.qtyOrdered));
  return map;
}

router.get('/', handle('fetch returns', async (req, res) => {
  const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const where = { orderType: 'RETURN' };
  if (req.query.orderId) where.returnOfOrderId = String(req.query.orderId);
  if (req.query.customerId) where.buyerId = String(req.query.customerId);
  if (req.query.status) {
    const status = String(req.query.status).toUpperCase();
    if (!['PENDING', 'COMPLETE', 'CANCELLED'].includes(status)) refuse(400, 'status must be one of: PENDING, COMPLETE, CANCELLED');
    where.status = status;
  }
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: INCLUDE }),
    prisma.order.count({ where }),
  ]);
  // Which of these came back without their credit and are still waiting for a manager (N-016).
  const ids = rows.map((r) => r.id);
  const marks = ids.length ? await prisma.auditLog.findMany({ where: { resourceType: 'Order', resourceId: { in: ids }, eventType: { in: ['CREDIT_NOT_ISSUED', 'CREDIT_NOT_ISSUED_SETTLED'] } }, select: { resourceId: true, eventType: true } }) : [];
  const settled = new Set(marks.filter((m) => m.eventType === 'CREDIT_NOT_ISSUED_SETTLED').map((m) => m.resourceId));
  const waiting = new Set(marks.filter((m) => m.eventType === 'CREDIT_NOT_ISSUED' && !settled.has(m.resourceId)).map((m) => m.resourceId));
  const data = await Promise.all(rows.map(toApi));
  res.json({ data: data.map((r) => ({ ...r, creditNotIssued: waiting.has(r.id) })), meta: { total, limit: take, offset: skip } });
}));

/** What can still come back on an order: looked up by order number for the "new return" form. */
router.get('/eligible', handle('look up order', async (req, res) => {
  const key = String(req.query.orderNumber || req.query.orderId || '').trim();
  if (!key) refuse(400, 'orderNumber is required');
  const order = await prisma.order.findFirst({
    where: { orderType: 'SO', OR: [{ id: key }, { orderNumber: { equals: key, mode: 'insensitive' } }] },
    include: { lines: { orderBy: { lineNumber: 'asc' } }, buyer: { select: { id: true, name: true } } },
  });
  if (!order) refuse(404, `No sales order found for "${key}"`);
  const already = await returnedByLine(prisma, order.id);
  res.json({
    orderId: order.id, orderNumber: order.orderNumber, customer: order.buyer,
    lines: order.lines.map((l) => ({
      orderLineId: l.id, lineNumber: l.lineNumber, description: l.description, unit: l.unit,
      shipped: num(l.qtyShipped), alreadyReturned: already.get(l.id) || 0,
      returnable: Math.max(num(l.qtyShipped) - (already.get(l.id) || 0), 0),
    })),
  });
}));

router.get('/:id', handle('fetch return', async (req, res) => {
  const ret = await prisma.order.findFirst({ where: { id: req.params.id, orderType: 'RETURN' }, include: INCLUDE });
  if (!ret) refuse(404, 'Return not found');
  res.json(await toApi(ret));
}));

router.post('/', handle('create return', async (req, res) => {
  const body = req.body || {};
  const reason = String(body.reason || '').trim();
  if (!body.orderId) refuse(400, 'orderId is required');
  if (!reason) refuse(400, 'A reason is required for a return');
  if (!Array.isArray(body.lines) || !body.lines.length) refuse(400, 'List at least one line being returned');
  const order = await prisma.order.findUnique({ where: { id: String(body.orderId) }, include: { lines: true } });
  if (!order) refuse(404, 'Order not found');
  if (order.orderType !== 'SO') refuse(409, 'Returns are made against a sales order');

  const ret = await createNumbered({
    count: () => prisma.order.count({ where: { orderType: 'RETURN' } }),
    format: padded('RMA', 6),
    create: (orderNumber) => retryOverlap(() => prisma.$transaction(async (tx) => {
      const already = await returnedByLine(tx, order.id);
      const seen = new Set();
      const lines = body.lines.map((raw, i) => {
        const line = order.lines.find((l) => l.id === raw?.orderLineId);
        if (!line) refuse(400, `Line ${i + 1}: that line is not on this order`);
        if (seen.has(line.id)) refuse(400, `Line ${i + 1}: order line ${line.lineNumber} is listed twice`);
        seen.add(line.id);
        const qty = positiveQty(raw.quantity);
        if (qty === null) refuse(400, `Line ${i + 1}: quantity must be more than zero`);
        const disposition = String(raw.disposition || 'RESTOCK').toUpperCase();
        if (!DISPOSITIONS.includes(disposition)) refuse(400, `Line ${i + 1}: disposition must be one of ${DISPOSITIONS.join(', ')}`);
        const open = num(line.qtyShipped) - (already.get(line.id) || 0);
        if (qty > open + 1e-9) {
          refuse(409, `Line ${line.lineNumber}: only ${Math.max(open, 0)} can be returned (shipped ${num(line.qtyShipped)}, already on returns ${already.get(line.id) || 0})`);
        }
        return {
          lineNumber: i + 1, productId: line.productId, gradeId: line.gradeId, description: line.description,
          thicknessIn: line.thicknessIn, widthIn: line.widthIn, lengthIn: line.lengthIn,
          qtyOrdered: qty, unit: line.unit, unitPrice: line.unitPrice, priceUnit: line.priceUnit,
          extendedPrice: lineAmount(line, qty), returnOfLineId: line.id, returnDisposition: disposition,
          notes: [raw.coilId ? `coil:${raw.coilId}` : null, raw.notes ? String(raw.notes) : null].filter(Boolean).join(' · ') || null,
        };
      });
      const total = lines.reduce((s, l) => s + l.extendedPrice, 0);
      return tx.order.create({
        data: {
          orderNumber, orderType: 'RETURN', status: 'PENDING', buyerId: order.buyerId, sellerId: order.sellerId,
          returnOfOrderId: order.id, notes: reason, subtotal: total, totalAmount: total,
          createdById: req.user.id, lines: { create: lines },
        },
        include: INCLUDE,
      });
    }, SERIALIZABLE)),
  });
  res.status(201).json(await toApi(ret));
}));

/** The stock item a returned line goes back into: the one named, else the only one that line's shipments drew from. */
async function restockTarget(tx, ret, line) {
  const named = (line.notes || '').match(/coil:([0-9a-f-]{36})/i)?.[1];
  const shipped = await tx.materialMovement.findMany({
    where: { movementType: 'SHIP', orderId: ret.returnOfOrderId, shipment: { items: { some: { orderLineId: line.returnOfLineId } } } },
    select: { coilId: true },
  });
  const coils = [...new Set(shipped.map((m) => m.coilId))];
  if (named) {
    if (!(await tx.inventory.findUnique({ where: { coilId: named }, select: { id: true } }))) refuse(400, `Line ${line.lineNumber}: the stock item named for restocking was not found`);
    return named;
  }
  if (coils.length === 1) return coils[0];
  refuse(409, coils.length
    ? `Line ${line.lineNumber}: this material shipped from more than one stock item. Say which one it goes back into (coilId), or scrap it.`
    : `Line ${line.lineNumber}: this material shipped without a stock item. Say which stock item it goes back into (coilId), or scrap it.`);
}

/** Credits what was invoiced for the returned quantity, newest invoice first. */
async function creditReturn(ret, userId) {
  const credits = [];
  const byInvoice = new Map();
  for (const line of ret.lines) {
    let left = num(line.qtyReceived);
    const invoiceLines = await prisma.invoiceLine.findMany({
      where: { orderLineId: line.returnOfLineId, invoice: { kind: 'INVOICE', status: { notIn: ['CANCELLED', 'DRAFT'] } } },
      include: { invoice: { select: { id: true, createdAt: true } } },
    });
    invoiceLines.sort((a, b) => b.invoice.createdAt - a.invoice.createdAt);
    for (const il of invoiceLines) {
      if (left <= 1e-9) break;
      const credited = await prisma.invoiceLine.aggregate({
        _sum: { quantity: true },
        where: { orderLineId: il.orderLineId, invoice: { kind: 'CREDIT', creditOfInvoiceId: il.invoiceId, status: { not: 'CANCELLED' } } },
      });
      const open = num(il.quantity) + num(credited._sum.quantity); // credit quantities are negative
      const qty = Math.min(left, open);
      if (qty <= 1e-9) continue;
      if (!byInvoice.has(il.invoiceId)) byInvoice.set(il.invoiceId, []);
      byInvoice.get(il.invoiceId).push({ invoiceLineId: il.id, quantity: qty });
      left -= qty;
    }
  }
  for (const [invoiceId, lines] of byInvoice) {
    credits.push(await creditInvoice(invoiceId, { reason: `Return ${ret.orderNumber}: ${ret.notes || 'returned material'}`, lines }, userId));
  }
  return credits;
}

router.post('/:id/receive', handle('receive return', async (req, res) => {
  const body = req.body || {};
  const overrides = new Map((Array.isArray(body.lines) ? body.lines : []).map((l) => [l?.lineId || l?.id, l]));
  const ret = await retryOverlap(() => prisma.$transaction(async (tx) => {
    const found = await tx.order.findFirst({ where: { id: req.params.id, orderType: 'RETURN' }, include: INCLUDE });
    if (!found) refuse(404, 'Return not found');
    if (found.status !== 'PENDING') refuse(409, `This return is ${found.status} and cannot be received`);
    // Only one receipt can win.
    const claimed = await tx.order.updateMany({ where: { id: found.id, status: 'PENDING' }, data: { status: 'COMPLETE' } });
    if (!claimed.count) refuse(409, 'This return was just changed by someone else. Reload and try again.');
    for (const line of found.lines) {
      const o = overrides.get(line.id) || {};
      let disposition = line.returnDisposition;
      if (o.disposition) {
        disposition = String(o.disposition).toUpperCase();
        if (!DISPOSITIONS.includes(disposition)) refuse(400, `Line ${line.lineNumber}: disposition must be one of ${DISPOSITIONS.join(', ')}`);
      }
      let qty = num(line.qtyOrdered);
      if (o.qtyReceived != null) {
        qty = Number(o.qtyReceived);
        if (!Number.isFinite(qty) || qty < 0) refuse(400, `Line ${line.lineNumber}: qtyReceived must be zero or more`);
        if (qty > num(line.qtyOrdered) + 1e-9) refuse(409, `Line ${line.lineNumber}: only ${num(line.qtyOrdered)} was authorised to come back`);
      }
      const withCoil = o.coilId ? { ...line, notes: `coil:${o.coilId}` } : line;
      if (qty > 1e-9) {
        if (disposition === 'RESTOCK' || disposition === 'INSPECT') {
          const coilId = await restockTarget(tx, found, withCoil);
          const stock = await tx.inventory.findUnique({ where: { coilId }, select: { unit: true, status: true, coil: { select: { coilNumber: true, unitCost: true } } } });
          // The quantity goes back in the unit the stock is counted in (Phase 6): 3 pieces are not 3 pounds.
          if (unitKey(stock.unit) !== unitKey(line.unit)) {
            refuse(409, `Line ${line.lineNumber}: the return is counted in ${line.unit} and stock item ${stock.coil.coilNumber} in ${stock.unit}. Receive it into a stock item counted in ${line.unit}, or scrap it.`);
          }
          if (stock.status === 'IN_TRANSIT') refuse(409, `Line ${line.lineNumber}: stock item ${stock.coil.coilNumber} is on its way to another branch. Name another stock item, or receive the return after the transfer arrives.`);
          const inv = await tx.inventory.update({
            where: { coilId },
            data: { qtyOnHand: { increment: qty }, qtyAvailable: { increment: qty }, lastMovement: new Date() },
          });
          await recordMovement(tx, await tx.materialMovement.create({
            // It comes back at the cost it carries (Phase 8, N-017), so the cost of the sale falls by what returned.
            data: { coilId, movementType: 'RECEIVE', toLocationId: inv.locationId, qtyMoved: qty, unit: inv.unit, orderId: found.id, reasonCode: 'CUSTOMER_RETURN', notes: found.orderNumber, createdById: req.user.id, unitCost: stock.coil.unitCost ?? null },
          }), { userId: req.user.id });
          await tx.coil.updateMany({ where: { id: coilId, status: { in: ['SHIPPED', 'CONSUMED'] } }, data: { status: 'AVAILABLE' } });
          // INSPECT: back on the books, but held until someone has looked at it (Phase 6).
          if (disposition === 'INSPECT') {
            const now = await tx.coil.findUnique({ where: { id: coilId }, select: { status: true } });
            const why = `Customer return ${found.orderNumber}, line ${line.lineNumber}: waiting for inspection. ${o.notes ? String(o.notes).slice(0, 300) : ''}`.trim();
            if (now.status !== 'HOLD') await placeHold(tx, { coilId, holdType: 'PENDING_TEST', reason: why, userId: req.user.id });
            else await tx.qCHold.create({ data: { coilId, holdType: 'PENDING_TEST', holdReason: why, holdById: req.user.id } });
          }
        } else {
          const named = (withCoil.notes || '').match(/coil:([0-9a-f-]{36})/i)?.[1];
          const shipped = named ? null : await tx.materialMovement.findFirst({
            where: { movementType: 'SHIP', orderId: found.returnOfOrderId, shipment: { items: { some: { orderLineId: line.returnOfLineId } } } }, select: { coilId: true },
          });
          const coilId = named || shipped?.coilId;
          // The scrap record needs a stock item to hang on; with none, the return line itself is the record.
          // It came back and it was scrapped: both are written, so the item's history still adds up to
          // its balance (Phase 6). Writing only the scrap took weight off an item that never got it back.
          if (coilId) {
            const at = await tx.inventory.findUnique({ where: { coilId }, select: { locationId: true, unit: true, coil: { select: { unitCost: true } } } });
            const unitCost = at?.coil?.unitCost ?? null;
            const unit = at?.unit || line.unit;
            await recordMovement(tx, await tx.materialMovement.create({
              data: { coilId, movementType: 'RECEIVE', toLocationId: at?.locationId || null, qtyMoved: qty, unit, orderId: found.id, reasonCode: 'CUSTOMER_RETURN', notes: `${found.orderNumber}: returned for scrap`, createdById: req.user.id, unitCost },
            }), { userId: req.user.id });
            await recordMovement(tx, await tx.materialMovement.create({
              data: { coilId, movementType: 'SCRAP', fromLocationId: at?.locationId || null, qtyMoved: qty, unit, orderId: found.id, reasonCode: 'CUSTOMER_RETURN', notes: found.orderNumber, createdById: req.user.id, unitCost },
            }), { userId: req.user.id });
          }
        }
      }
      await tx.orderLine.update({
        where: { id: line.id },
        data: { qtyReceived: qty, qtyOrdered: qty > 1e-9 ? qty : line.qtyOrdered, returnDisposition: disposition, lineStatus: qty > 1e-9 ? 'COMPLETE' : 'CANCELLED' },
      });
    }
    return tx.order.findUnique({ where: { id: found.id }, include: INCLUDE });
  }, SERIALIZABLE));

  let creditError = null;
  try {
    await creditReturn(ret, req.user?.id);
  } catch (error) {
    // The material is back and stays back. The missing credit is put on record, said in the answer,
    // shown on the order's closeout and listed in the integration report until it is settled (N-016).
    const reason = String(error?.message || error).slice(0, 300);
    console.error(JSON.stringify({ level: 'error', msg: 'credit_not_issued', returnNumber: ret.orderNumber, reason }));
    creditError = `The material was received, but the credit memo could not be issued: ${error instanceof BillingError ? reason : 'the credit failed'}. A manager can issue it from the return.`;
    await prisma.auditLog.create({ data: { category: 'FINANCIAL', eventType: CREDIT_NOT_ISSUED, severity: 'ERROR', action: 'CREATE', userId: req.user?.id || null, resourceType: 'Order', resourceId: ret.id, details: { returnNumber: ret.orderNumber, originalOrderId: ret.returnOfOrderId, reason } } }).catch(() => {});
  }
  res.json({ ...(await toApi(ret)), ...(creditError && { warning: creditError }) });
}));

/**
 * The credit of a return that was received without one (N-016). A manager either issues it now,
 * or records that it was settled another way (a credit already given by hand) with the reason.
 * It can be issued only once: a return that already has a credit memo is refused.
 */
router.post('/:id/credit', handle('credit return', async (req, res) => {
  const ret = await prisma.order.findFirst({ where: { id: req.params.id, orderType: 'RETURN' }, include: INCLUDE });
  if (!ret) refuse(404, 'Return not found');
  if (ret.status !== 'COMPLETE') refuse(409, `This return is ${ret.status}. A return is credited once it has been received.`);
  const body = req.body || {};
  const [flagged, settled, credited] = await Promise.all([
    prisma.auditLog.count({ where: { eventType: CREDIT_NOT_ISSUED, resourceType: 'Order', resourceId: ret.id } }),
    prisma.auditLog.count({ where: { eventType: CREDIT_ISSUED_LATER, resourceType: 'Order', resourceId: ret.id } }),
    prisma.invoice.count({ where: { kind: 'CREDIT', status: { not: 'CANCELLED' }, notes: { startsWith: `Return ${ret.orderNumber}:` } } }),
  ]);
  if (credited) refuse(409, 'This return already has a credit memo.');
  if (!flagged) refuse(409, 'This return was not received without its credit.');
  if (settled) refuse(409, 'The credit of this return was already settled.');
  let credits = [];
  let note;
  if (body.settledAnotherWay) {
    note = String(body.reason || '').trim();
    if (note.length < 5) refuse(400, 'Say how the credit was settled (for example the number of the credit memo given by hand).');
  } else {
    credits = await creditReturn(ret, req.user?.id);
    if (!credits.length) refuse(409, 'Nothing on the invoices of this order is left to credit for this return. If the credit was given another way, record that with the reason.');
    note = `Credit ${credits.map((c) => c.invoiceNumber).join(', ')} issued`;
  }
  // One settlement per return: the return's row is locked while it is checked and written, so two
  // managers pressing at the same moment leave one record.
  const first = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "Order" WHERE "id" = ${ret.id} FOR UPDATE`;
    if (await tx.auditLog.count({ where: { eventType: CREDIT_ISSUED_LATER, resourceType: 'Order', resourceId: ret.id } })) return false;
  await tx.auditLog.create({ data: { category: 'FINANCIAL', eventType: CREDIT_ISSUED_LATER, severity: 'INFO', action: 'UPDATE', userId: req.user?.id || null, resourceType: 'Order', resourceId: ret.id, details: { returnNumber: ret.orderNumber, originalOrderId: ret.returnOfOrderId, note, credits: credits.map((c) => c.invoiceNumber) } } });
    return true;
  });
  if (!first) refuse(409, 'The credit of this return was already settled.');
  res.status(201).json({ ...(await toApi(ret)), settled: note });
}));

router.post('/:id/cancel', handle('cancel return', async (req, res) => {
  const changed = await prisma.order.updateMany({ where: { id: req.params.id, orderType: 'RETURN', status: 'PENDING' }, data: { status: 'CANCELLED' } });
  if (!changed.count) {
    const ret = await prisma.order.findFirst({ where: { id: req.params.id, orderType: 'RETURN' }, select: { status: true } });
    if (!ret) refuse(404, 'Return not found');
    refuse(409, `This return is ${ret.status} and cannot be cancelled`);
  }
  const ret = await prisma.order.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  res.json(await toApi(ret));
}));

export default router;
