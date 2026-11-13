/**
 * Customer returns (RMAs).
 *
 *   GET  /api/returns                 list (orderId, customerId, status)
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

const router = Router();
const DISPOSITIONS = ['RESTOCK', 'SCRAP'];
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
    if (error instanceof Refuse || error instanceof BillingError) {
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
  res.json({ data: await Promise.all(rows.map(toApi)), meta: { total, limit: take, offset: skip } });
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
        if (!DISPOSITIONS.includes(disposition)) refuse(400, `Line ${i + 1}: disposition must be RESTOCK or SCRAP`);
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
async function creditReturn(ret) {
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
    credits.push(await creditInvoice(invoiceId, { reason: `Return ${ret.orderNumber}: ${ret.notes || 'returned material'}`, lines }));
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
        if (!DISPOSITIONS.includes(disposition)) refuse(400, `Line ${line.lineNumber}: disposition must be RESTOCK or SCRAP`);
      }
      let qty = num(line.qtyOrdered);
      if (o.qtyReceived != null) {
        qty = Number(o.qtyReceived);
        if (!Number.isFinite(qty) || qty < 0) refuse(400, `Line ${line.lineNumber}: qtyReceived must be zero or more`);
        if (qty > num(line.qtyOrdered) + 1e-9) refuse(409, `Line ${line.lineNumber}: only ${num(line.qtyOrdered)} was authorised to come back`);
      }
      const withCoil = o.coilId ? { ...line, notes: `coil:${o.coilId}` } : line;
      if (qty > 1e-9) {
        if (disposition === 'RESTOCK') {
          const coilId = await restockTarget(tx, found, withCoil);
          const inv = await tx.inventory.update({
            where: { coilId },
            data: { qtyOnHand: { increment: qty }, qtyAvailable: { increment: qty }, lastMovement: new Date() },
          });
          await tx.materialMovement.create({
            data: { coilId, movementType: 'RECEIVE', toLocationId: inv.locationId, qtyMoved: qty, unit: line.unit, orderId: found.id, reasonCode: 'CUSTOMER_RETURN', notes: found.orderNumber, createdById: req.user.id },
          });
          await tx.coil.updateMany({ where: { id: coilId, status: 'SHIPPED' }, data: { status: 'AVAILABLE' } });
        } else {
          const named = (withCoil.notes || '').match(/coil:([0-9a-f-]{36})/i)?.[1];
          const shipped = named ? null : await tx.materialMovement.findFirst({
            where: { movementType: 'SHIP', orderId: found.returnOfOrderId, shipment: { items: { some: { orderLineId: line.returnOfLineId } } } }, select: { coilId: true },
          });
          const coilId = named || shipped?.coilId;
          // The scrap record needs a stock item to hang on; with none, the return line itself is the record.
          if (coilId) {
            await tx.materialMovement.create({
              data: { coilId, movementType: 'SCRAP', qtyMoved: qty, unit: line.unit, orderId: found.id, reasonCode: 'CUSTOMER_RETURN', notes: found.orderNumber, createdById: req.user.id },
            });
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
    await creditReturn(ret);
  } catch (error) {
    console.error(`Returns: could not credit return ${ret.orderNumber}:`, error?.message || error);
    creditError = 'The material was received, but the credit memo could not be issued. Issue it from the invoice.';
  }
  res.json({ ...(await toApi(ret)), ...(creditError && { warning: creditError }) });
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
