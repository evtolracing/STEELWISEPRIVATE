/**
 * Requests for quote.
 *
 *   GET   /api/rfqs?status=&customerId=     list
 *   GET   /api/rfqs/:id                     one RFQ with its lines and quotes
 *   POST  /api/rfqs                         { customerId, contactName?, requestedDate?, notes?, lines: [{ description, requestedQty, unit?, productId? }] }
 *   PATCH /api/rfqs/:id                     notes, contact, dates; status WITHDRAWN or REJECTED to close it
 *   POST  /api/rfqs/:id/quotes              price the RFQ: see routes/quotes.js (same as POST /api/quotes)
 */
import { Router } from 'express';
import prisma from '../lib/db.js';
import { createNumbered, padded } from '../lib/numbering.js';
import { positiveQty } from '../lib/workflowRules.js';
import { RFQ_OPEN } from '../lib/quoteRules.js';
import { createQuote, handle, refuse } from './quotes.js';

const router = Router();
const STATUSES = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'];
const INCLUDE = {
  customer: { select: { id: true, name: true, code: true } },
  lines: { orderBy: { lineNumber: 'asc' } },
  quotes: { orderBy: { createdAt: 'desc' }, select: { id: true, quoteNumber: true, version: true, status: true, totalAmount: true, validUntil: true, convertedOrderId: true } },
};
const dateOrNull = (v, name) => {
  if (v == null || v === '') return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) refuse(400, `${name} is not a valid date`);
  return d;
};

router.get('/', handle('fetch RFQs', async (req, res) => {
  const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const where = {};
  if (req.query.status) {
    const status = String(req.query.status).toUpperCase();
    if (status === 'OPEN') where.status = { in: RFQ_OPEN };
    else if (!STATUSES.includes(status)) refuse(400, `status must be OPEN or one of: ${STATUSES.join(', ')}`);
    else where.status = status;
  }
  if (req.query.customerId) where.customerId = String(req.query.customerId);
  const [data, total] = await Promise.all([
    prisma.rFQ.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: INCLUDE }),
    prisma.rFQ.count({ where }),
  ]);
  res.json({ data, meta: { total, limit: take, offset: skip } });
}));

router.get('/:id', handle('fetch RFQ', async (req, res) => {
  const rfq = await prisma.rFQ.findUnique({ where: { id: req.params.id }, include: { ...INCLUDE, quotes: { orderBy: { createdAt: 'desc' }, include: { lines: { orderBy: { lineNumber: 'asc' } } } } } });
  if (!rfq) refuse(404, 'RFQ not found');
  res.json(rfq);
}));

router.post('/', handle('create RFQ', async (req, res) => {
  const body = req.body || {};
  if (!body.customerId) refuse(400, 'customerId is required');
  const customer = await prisma.organization.findUnique({ where: { id: String(body.customerId) }, select: { id: true } });
  if (!customer) refuse(400, 'Customer not found');
  if (!Array.isArray(body.lines) || !body.lines.length) refuse(400, 'An RFQ needs at least one line');
  const lines = body.lines.map((raw, i) => {
    const qty = positiveQty(raw?.requestedQty ?? raw?.quantity);
    if (qty === null) refuse(400, `Line ${i + 1}: requestedQty must be more than zero`);
    const description = String(raw.description || raw.productDescription || '').trim();
    if (!description && !raw.productId) refuse(400, `Line ${i + 1}: say what is being asked for`);
    return {
      lineNumber: i + 1, description: description || null, productId: raw.productId ? String(raw.productId) : null,
      requestedQty: qty, unit: String(raw.unit || 'LB').toUpperCase().slice(0, 10), notes: raw.notes ? String(raw.notes) : null,
      materialCode: raw.materialCode ? String(raw.materialCode) : null, division: raw.division ? String(raw.division) : null,
    };
  });
  const rfq = await createNumbered({
    count: () => prisma.rFQ.count(),
    format: padded('RFQ', 6),
    create: (rfqNumber) => prisma.rFQ.create({
      data: {
        rfqNumber, customerId: customer.id, status: 'SUBMITTED', submittedAt: new Date(),
        contactName: body.contactName ? String(body.contactName) : null, contactEmail: body.contactEmail ? String(body.contactEmail) : null,
        contactPhone: body.contactPhone ? String(body.contactPhone) : null,
        requestedDate: dateOrNull(body.requestedDate ?? body.requiredDate, 'requestedDate'), expiresAt: dateOrNull(body.expiresAt, 'expiresAt'),
        notes: body.notes ? String(body.notes) : null, lines: { create: lines },
      },
      include: INCLUDE,
    }),
  });
  res.status(201).json(rfq);
}));

router.patch('/:id', handle('update RFQ', async (req, res) => {
  const body = req.body || {};
  const rfq = await prisma.rFQ.findUnique({ where: { id: req.params.id }, select: { id: true, status: true } });
  if (!rfq) refuse(404, 'RFQ not found');
  const data = {};
  for (const f of ['notes', 'contactName', 'contactEmail', 'contactPhone']) if (body[f] !== undefined) data[f] = body[f] === null ? null : String(body[f]);
  if (body.requestedDate !== undefined) data.requestedDate = dateOrNull(body.requestedDate, 'requestedDate');
  if (body.expiresAt !== undefined) data.expiresAt = dateOrNull(body.expiresAt, 'expiresAt');
  if (body.status !== undefined && body.status !== rfq.status) {
    const to = String(body.status).toUpperCase();
    if (!['WITHDRAWN', 'REJECTED', 'IN_REVIEW'].includes(to)) refuse(400, 'An RFQ can be set to IN_REVIEW, WITHDRAWN or REJECTED here. Quoting and accepting change it on their own.');
    if (!RFQ_OPEN.includes(rfq.status)) refuse(409, `This RFQ is ${rfq.status} and cannot be changed`);
    data.status = to;
  }
  if (!Object.keys(data).length) refuse(400, 'Nothing to update');
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.rFQ.update({ where: { id: rfq.id }, data, include: INCLUDE });
    // Closing an RFQ closes its open quotes too.
    if (['WITHDRAWN', 'REJECTED'].includes(data.status)) {
      await tx.quote.updateMany({ where: { rfqId: rfq.id, status: { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'COUNTERED'] } }, data: { status: 'REJECTED' } });
    }
    return saved;
  });
  res.json(updated);
}));

router.post('/:id/quotes', handle('create quote', async (req, res) => {
  res.status(201).json(await createQuote({ ...(req.body || {}), rfqId: req.params.id }, req.user.id));
}));

export default router;
