/**
 * Quotes.
 *
 *   GET  /api/quotes?status=&customerId=&rfqId=   list
 *   GET  /api/quotes/:id                          one quote
 *   POST /api/quotes                              { rfqId, validUntil?, paymentTerms?, notes?, lines: [{ rfqLineId?, description?, quantity, unit?, unitPrice, priceUnit?, leadTimeDays? }] }
 *   POST /api/quotes/:id/send                     mark as sent to the customer (nothing is emailed from here)
 *   POST /api/quotes/:id/accept                   { poReference?, shipTo… } → creates the sales order
 *   POST /api/quotes/:id/reject                   { reason? }
 *
 * Rules:
 *  - Every quote answers an RFQ, so it always has a customer.
 *  - Line totals are worked out on the server.
 *  - Tax is worked out on the server by rule 27 (the branch the request belongs to), so the
 *    quote's total is what the order and the invoice will bill (J-001).
 *  - What the customer asked for (grade, size, tolerances, certificates, processing) is
 *    carried from the request to the quote and to the order (lib/lineSpecs.js, J-001).
 *  - The order belongs to the branch of the request, not of whoever presses accept (J-001).
 *  - Accepting a quote creates a confirmed sales order with the quoted lines
 *    and prices, closes the RFQ, and rejects the RFQ's other open quotes.
 *    A quote can be accepted once; an expired quote cannot be accepted.
 */
import { statusAfterCreditCheck, recordCreditHold } from '../lib/creditControl.js';
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded, retryOverlap } from '../lib/numbering.js';
import { quoteLineTotal, quoteMoveError, isExpired, RFQ_OPEN } from '../lib/quoteRules.js';
import { readSpecs, mergeSpecs, specColumns, specsOfLine } from '../lib/lineSpecs.js';
import { orderTax, branchStateFor } from '../lib/orderTax.js';

const router = Router();
const num = (d) => Number(d || 0);
const ORDER_PRICE_UNITS = ['CWT', 'LB', 'TON', 'EACH', 'LF'];
const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
const OPEN = ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED'];

class Refuse extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const refuse = (status, message) => { throw new Refuse(status, message); };
export const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof Refuse) return res.status(error.status).json({ error: error.message });
    if (error?.busy) return res.status(409).json({ error: error.message, code: 'BUSY' });
    if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'The request has a field that is not valid' });
    console.error(`Quotes: ${label} failed:`, error);
    res.status(500).json({ error: `Failed to ${label}` });
  }
};

const INCLUDE = {
  lines: { orderBy: { lineNumber: 'asc' } },
  rfq: { select: { id: true, rfqNumber: true, status: true, customerId: true, customer: { select: { id: true, name: true, code: true } } } },
  convertedOrder: { select: { id: true, orderNumber: true, status: true } },
};
const toApi = (q) => q && ({
  ...q, customer: q.rfq?.customer || null, customerId: q.rfq?.customerId || null,
  subtotal: num(q.subtotal), taxAmount: q.taxAmount == null ? null : num(q.taxAmount), totalAmount: num(q.totalAmount),
  displayStatus: isExpired(q) && OPEN.includes(q.status) ? 'EXPIRED' : q.status,
});

export async function createQuote(body, userId) {
  if (!body.rfqId) refuse(400, 'rfqId is required: a quote answers an RFQ');
  const rfq = await prisma.rFQ.findUnique({ where: { id: String(body.rfqId) }, include: { lines: true } });
  if (!rfq) refuse(404, 'RFQ not found');
  if (!RFQ_OPEN.includes(rfq.status)) refuse(409, `This RFQ is ${rfq.status} and can no longer be quoted`);
  if (!Array.isArray(body.lines) || !body.lines.length) refuse(400, 'A quote needs at least one priced line');
  let validUntil = new Date(Date.now() + 30 * 864e5);
  if (body.validUntil != null && body.validUntil !== '') {
    validUntil = new Date(body.validUntil);
    if (Number.isNaN(validUntil.getTime())) refuse(400, 'validUntil is not a valid date');
    if (validUntil < new Date()) refuse(400, 'validUntil must be in the future');
  }
  const lines = body.lines.map((raw, i) => {
    const from = raw?.rfqLineId ? rfq.lines.find((l) => l.id === raw.rfqLineId) : null;
    if (raw?.rfqLineId && !from) refuse(400, `Line ${i + 1}: that line is not on this RFQ`);
    const quantity = raw.quantity ?? (from ? num(from.requestedQty) : undefined);
    const unit = String(raw.unit || from?.unit || 'LB').toUpperCase();
    const priceUnit = String(raw.priceUnit || 'CWT').toUpperCase();
    const total = quoteLineTotal(quantity, unit, raw.unitPrice, priceUnit);
    if (total.error) refuse(400, `Line ${i + 1}: ${total.error}`);
    const read = readSpecs(raw);
    if (read.error) refuse(400, `Line ${i + 1}: ${read.error}`);
    const specs = mergeSpecs(read.specs, from?.specifications);
    let leadTimeDays = null;
    if (raw.leadTimeDays != null && raw.leadTimeDays !== '') {
      leadTimeDays = Number(raw.leadTimeDays);
      if (!Number.isInteger(leadTimeDays) || leadTimeDays < 0) refuse(400, `Line ${i + 1}: leadTimeDays must be a whole number`);
    }
    return {
      lineNumber: i + 1, rfqLineId: from?.id || null, productId: raw.productId || from?.productId || null,
      description: String(raw.description || from?.description || '').trim() || null,
      quantity: Number(quantity), unit, unitPrice: Number(raw.unitPrice), priceUnit, extendedPrice: total.extended,
      leadTimeDays, notes: raw.notes ? String(raw.notes) : null, ...specColumns(specs),
    };
  });
  const subtotal = Math.round(lines.reduce((s, l) => s + l.extendedPrice, 0) * 100) / 100;
  const tax = await orderTax({ subtotal, customerId: rfq.customerId, branchState: await branchStateFor({ id: userId }, rfq.locationId) });
  const version = (await prisma.quote.count({ where: { rfqId: rfq.id } })) + 1;
  const quote = await createNumbered({
    count: () => prisma.quote.count(),
    format: padded('QT', 6),
    create: (quoteNumber) => prisma.quote.create({
      data: {
        quoteNumber, rfqId: rfq.id, version, status: 'DRAFT', subtotal, taxAmount: tax.taxAmount, totalAmount: Math.round((subtotal + tax.taxAmount) * 100) / 100, validUntil,
        ...(rfq.locationId && { locationId: rfq.locationId }),
        paymentTerms: body.paymentTerms ? String(body.paymentTerms) : null, freightTerms: body.freightTerms ? String(body.freightTerms) : null,
        notes: body.notes ? String(body.notes) : null, createdById: userId, lines: { create: lines },
      },
      include: INCLUDE,
    }),
  });
  if (['DRAFT', 'SUBMITTED'].includes(rfq.status)) await prisma.rFQ.update({ where: { id: rfq.id }, data: { status: 'IN_REVIEW' } });
  return toApi(quote);
}

router.get('/', handle('fetch quotes', async (req, res) => {
  const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const where = {};
  if (req.query.status) {
    const status = String(req.query.status).toUpperCase();
    if (!STATUSES.includes(status)) refuse(400, `status must be one of: ${STATUSES.join(', ')}`);
    // The list filters by what the screen shows (displayStatus): a quote past its valid-until
    // date is EXPIRED, not SENT (J-004).
    const now = new Date();
    if (status === 'EXPIRED') where.OR = [{ status: 'EXPIRED' }, { status: { in: OPEN }, validUntil: { lt: now } }];
    else if (OPEN.includes(status)) Object.assign(where, { status, OR: [{ validUntil: null }, { validUntil: { gte: now } }] });
    else where.status = status;
  }
  if (req.query.rfqId) where.rfqId = String(req.query.rfqId);
  if (req.query.customerId) where.rfq = { customerId: String(req.query.customerId) };
  const [rows, total] = await Promise.all([
    prisma.quote.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: INCLUDE }),
    prisma.quote.count({ where }),
  ]);
  res.json({ data: rows.map(toApi), meta: { total, limit: take, offset: skip } });
}));

router.get('/:id', handle('fetch quote', async (req, res) => {
  const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  if (!quote) refuse(404, 'Quote not found');
  res.json(toApi(quote));
}));

router.post('/', handle('create quote', async (req, res) => {
  res.status(201).json(await createQuote(req.body || {}, req.user.id));
}));

/** Moves a quote, guarding against two people doing it at once. */
async function move(tx, quote, to, extra = {}) {
  const why = quoteMoveError(quote, to);
  if (why) refuse(409, why);
  const changed = await tx.quote.updateMany({ where: { id: quote.id, status: quote.status }, data: { ...extra, status: to } });
  if (!changed.count) refuse(409, 'This quote was just changed by someone else. Reload and try again.');
}

router.post('/:id/send', handle('send quote', async (req, res) => {
  const quote = await prisma.quote.findUnique({ where: { id: req.params.id } });
  if (!quote) refuse(404, 'Quote not found');
  if (isExpired(quote)) refuse(409, 'This quote has expired. Create a new quote with current prices.');
  await prisma.$transaction(async (tx) => {
    await move(tx, quote, 'SENT', { sentAt: new Date() });
    await tx.rFQ.updateMany({ where: { id: quote.rfqId, status: { in: RFQ_OPEN } }, data: { status: 'QUOTED' } });
  });
  res.json({ message: 'Quote marked as sent. Nothing is emailed from here: send the customer the quote yourself.', quote: toApi(await prisma.quote.findUnique({ where: { id: quote.id }, include: INCLUDE })) });
}));

/** Reject a quote. `customerId` limits the action to that customer's quotes (the partner API). */
export async function rejectQuote(id, body = {}, { customerId } = {}) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: { rfq: { select: { customerId: true } } } });
  if (!quote || (customerId && quote.rfq.customerId !== customerId)) refuse(404, 'Quote not found');
  const reason = body?.reason ? String(body.reason).slice(0, 500) : null;
  await prisma.$transaction((tx) => move(tx, quote, 'REJECTED', reason ? { internalNotes: [quote.internalNotes, `Rejected: ${reason}`].filter(Boolean).join(' · ') } : {}));
  return toApi(await prisma.quote.findUnique({ where: { id: quote.id }, include: INCLUDE }));
}

router.post('/:id/reject', handle('reject quote', async (req, res) => {
  res.json(await rejectQuote(req.params.id, req.body || {}));
}));

/**
 * Accept a quote and create its sales order, in one transaction. `actor` is the staff user;
 * for the partner API it is `{ id: <the user who wrote the quote>, via: 'partner' }` and
 * `customerId` limits the action to that customer's quotes.
 */
export async function acceptQuote(id, body = {}, actor, { customerId, onOrder } = {}) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: { lines: { orderBy: { lineNumber: 'asc' }, include: { rfqLine: { select: { specifications: true } } } }, rfq: { include: { customer: { select: { isActive: true } } } } } });
  if (!quote || (customerId && quote.rfq.customerId !== customerId)) refuse(404, 'Quote not found');
  if (quote.rfq.customer && quote.rfq.customer.isActive === false) refuse(409, 'This customer account is inactive. Reactivate it before taking the order.');
  const userId = actor?.id || quote.createdById;
  if (!userId) refuse(409, 'This quote has to be accepted by the sales desk');
  const why = quoteMoveError(quote, 'ACCEPTED');
  if (why) refuse(409, why);
  if (!quote.lines.length) refuse(409, 'This quote has no lines');

  // The order bills what the quote said. A quote written before quotes carried tax gets its tax
  // now, by the same rule 27 every other order is taxed by.
  const branchId = quote.locationId || quote.rfq.locationId || null;
  const subtotal = num(quote.subtotal);
  const taxAmount = quote.taxAmount != null ? num(quote.taxAmount)
    : (await orderTax({ subtotal, customerId: quote.rfq.customerId, shipToState: body.shipToState, branchState: await branchStateFor(actor?.id ? actor : { id: userId }, branchId) })).taxAmount;
  const freightAmount = num(quote.freightAmount);
  const totalAmount = Math.round((subtotal + taxAmount + freightAmount) * 100) / 100;
  // Rule 32: the quote is still accepted, but the order waits on hold when it would pass the credit limit.
  const gate = await statusAfterCreditCheck(prisma, { customerId: quote.rfq.customerId, orderTotal: totalAmount, wanted: 'CONFIRMED' });
  const order = await createNumbered({
    count: () => prisma.order.count(),
    format: padded('SO'),
    create: (orderNumber) => retryOverlap(() => prisma.$transaction(async (tx) => {
      await move(tx, quote, 'ACCEPTED', { acceptedAt: new Date() });
      const created = await tx.order.create({
        data: {
          orderNumber, orderType: 'SO', status: gate.status, buyerId: quote.rfq.customerId, ...(branchId && { locationId: branchId }),
          shipToAddress: body.shipToAddress ? String(body.shipToAddress) : null, shipToCity: body.shipToCity ? String(body.shipToCity) : null,
          shipToState: body.shipToState ? String(body.shipToState) : null, shipToZip: body.shipToZip ? String(body.shipToZip) : null,
          subtotal, taxAmount, freightAmount, totalAmount,
          paymentTerms: quote.paymentTerms, poReference: body.poReference ? String(body.poReference) : null,
          requiredDate: quote.rfq.requestedDate, notes: `From quote ${quote.quoteNumber}`, createdById: userId,
          lines: {
            create: quote.lines.map((l) => {
              const asked = mergeSpecs(specsOfLine(l), l.rfqLine?.specifications);
              return {
                lineNumber: l.lineNumber, productId: l.productId, description: l.description, ...(asked.gradeId && { gradeId: asked.gradeId }),
                qtyOrdered: l.quantity, unit: l.unit, unitPrice: l.unitPrice,
                priceUnit: ORDER_PRICE_UNITS.includes(l.priceUnit) ? l.priceUnit : 'CWT', extendedPrice: l.extendedPrice, notes: l.notes,
                ...specColumns(asked),
              };
            }),
          },
        },
        include: { lines: true, buyer: { select: { id: true, name: true } } },
      });
      if (gate.creditHold) await recordCreditHold(tx, { orderId: created.id, orderNumber: created.orderNumber, creditHold: gate.creditHold, user: actor?.email ? actor : { id: userId } });
      await tx.quote.update({ where: { id: quote.id }, data: { convertedOrderId: created.id } });
      await tx.quote.updateMany({ where: { rfqId: quote.rfqId, id: { not: quote.id }, status: { in: OPEN } }, data: { status: 'REJECTED' } });
      await tx.rFQ.update({ where: { id: quote.rfqId }, data: { status: 'ACCEPTED' } });
      if (onOrder) await onOrder(tx, created, quote);
      return created;
    })),
  });
  return { message: gate.creditHold ? 'Quote accepted. The order is on credit hold.' : 'Quote accepted and order created', ...(gate.creditHold && { creditHold: gate.creditHold, warning: gate.creditHold.message }), order, quote: toApi(await prisma.quote.findUnique({ where: { id: quote.id }, include: INCLUDE })) };
}

router.post('/:id/accept', handle('accept quote', async (req, res) => {
  res.status(201).json(await acceptQuote(req.params.id, req.body || {}, req.user));
}));

export default router;
