/**
 * Customer partner API. Mount: /api/v1/partner/customer
 *
 * A customer's own system reads its requests for quote, quotes, orders, shipments, invoices
 * and documents, sends a request for quote, and accepts or rejects a quote.
 *
 * Rules:
 *   - Everything is limited to the partner's own organisation. Another customer's record
 *     answers 404.
 *   - Sending a request for quote and accepting a quote run the same steps staff use
 *     (`createRfq`, `acceptQuote`), so numbering, credit control and the order are the same.
 *   - A customer sees a quote once it has been sent, never a draft, and never internal notes.
 *   - A changing request may carry `Idempotency-Key`; a repeat gets the first answer back.
 */
import fs from 'node:fs';
import { Router } from 'express';
import prisma from '../../lib/db.js';
import { requireScope } from '../../middleware/partnerAuth.js';
import { createRfq } from '../rfqs.js';
import { acceptQuote, rejectQuote } from '../quotes.js';
import { queueEvent, recordBusinessEvent, kick } from '../../services/webhookService.js';
import { isExpired } from '../../lib/quoteRules.js';
import { partnerStack, wrap, refuse, paging, pageOf, num, oneOf, text } from './common.js';

const router = Router();
router.use(...partnerStack('CUSTOMER', 'STRATEGIC'));

const org = (req) => req.partner.orgId;
const seen = (req, type, id) => { req.partnerResourceType = type; req.partnerResourceId = id; };

// ─── Requests for quote ────────────────────────────────────────────────────────
const RFQ_STATUSES = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'];
const rfqApi = (r) => ({
  id: r.id, rfqNumber: r.rfqNumber, status: r.status, requestedDate: r.requestedDate, notes: r.notes, submittedAt: r.submittedAt, createdAt: r.createdAt,
  lines: (r.lines || []).map((l) => ({ lineNumber: l.lineNumber, description: l.description, productId: l.productId, quantity: num(l.requestedQty), unit: l.unit, notes: l.notes })),
  quotes: (r.quotes || []).filter((q) => VISIBLE_QUOTES.includes(q.status)).map((q) => ({ id: q.id, quoteNumber: q.quoteNumber, status: q.status, totalAmount: num(q.totalAmount), validUntil: q.validUntil })),
});
const VISIBLE_QUOTES = ['SENT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

/** A line described the way a buyer's system sends it, as the one description staff will price from. */
function describe(item) {
  const given = text(item.description, 'description', 500);
  if (given) return given;
  const dims = [item.thickness, item.width, item.length].filter((v) => v !== undefined && v !== null && v !== '').join(' x ');
  return [item.productType, item.gradeCode, dims].filter(Boolean).map(String).join(' ').trim().slice(0, 500) || null;
}

router.post('/rfqs', requireScope('rfq:write'), wrap('create RFQ', async (req, res) => {
  const body = req.body || {};
  const items = body.items ?? body.lines;
  if (!Array.isArray(items) || !items.length) refuse(400, 'VALIDATION_ERROR', 'items is required, with at least one item');
  if (items.length > 200) refuse(400, 'VALIDATION_ERROR', 'An RFQ can have 200 items at most');
  const rfq = await createRfq({
    customerId: org(req),
    contactName: text(body.contactName, 'contactName', 200), contactEmail: text(body.contactEmail, 'contactEmail', 200), contactPhone: text(body.contactPhone, 'contactPhone', 60),
    requestedDate: body.requestedDeliveryDate ?? body.requestedDate ?? null,
    notes: [text(body.poNumber, 'poNumber', 100) && `Customer PO ${text(body.poNumber, 'poNumber', 100)}`, text(body.notes, 'notes', 2000)].filter(Boolean).join(' · ') || null,
    lines: items.map((item) => ({ description: describe(item || {}), productId: item?.productId, requestedQty: item?.quantity ?? item?.requestedQty, unit: item?.unit, notes: text(item?.notes, 'item notes', 500) })),
  });
  seen(req, 'RFQ', rfq.id);
  // The partner's own subscription is told. The request is already saved, so a failure here loses nothing but the notice.
  await queueEvent(prisma, 'rfq.received', { rfqId: rfq.id, rfqNumber: rfq.rfqNumber, status: rfq.status, lineCount: rfq.lines.length }, { partnerIds: [req.partner.id], eventId: `rfq.received:${rfq.id}` }).then(() => kick()).catch(() => {});
  res.status(201).json({ id: rfq.id, rfqNumber: rfq.rfqNumber, status: rfq.status, lineCount: rfq.lines.length, createdAt: rfq.createdAt });
}));

router.get('/rfqs', requireScope('rfq:read'), wrap('list RFQs', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, RFQ_STATUSES, 'status');
  const where = { customerId: org(req), ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.rFQ.findMany({ where, include: { lines: { orderBy: { lineNumber: 'asc' } }, quotes: true }, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.rFQ.count({ where }),
  ]);
  res.json(pageOf(rows.map(rfqApi), total, p));
}));

router.get('/rfqs/:id', requireScope('rfq:read'), wrap('get RFQ', async (req, res) => {
  const rfq = await prisma.rFQ.findFirst({ where: { id: req.params.id, customerId: org(req) }, include: { lines: { orderBy: { lineNumber: 'asc' } }, quotes: true } });
  if (!rfq) refuse(404, 'NOT_FOUND', 'RFQ not found');
  seen(req, 'RFQ', rfq.id);
  res.json(rfqApi(rfq));
}));

// ─── Quotes ────────────────────────────────────────────────────────────────────
const quoteApi = (q) => ({
  id: q.id, quoteNumber: q.quoteNumber, rfqId: q.rfqId, rfqNumber: q.rfq?.rfqNumber || null, version: q.version,
  status: isExpired(q) && ['SENT', 'COUNTERED'].includes(q.status) ? 'EXPIRED' : q.status,
  subtotal: num(q.subtotal), taxAmount: num(q.taxAmount), freightAmount: num(q.freightAmount), totalAmount: num(q.totalAmount), currency: q.currency,
  validFrom: q.validFrom, validUntil: q.validUntil, paymentTerms: q.paymentTerms, freightTerms: q.freightTerms, notes: q.notes,
  sentAt: q.sentAt, acceptedAt: q.acceptedAt, orderId: q.convertedOrderId,
  lines: (q.lines || []).map((l) => ({ lineNumber: l.lineNumber, description: l.description, productId: l.productId, quantity: num(l.quantity), unit: l.unit, unitPrice: num(l.unitPrice), priceUnit: l.priceUnit, extendedPrice: num(l.extendedPrice), leadTimeDays: l.leadTimeDays, thicknessIn: num(l.thicknessIn), widthIn: num(l.widthIn), lengthIn: num(l.lengthIn) })),
});
const QUOTE_INCLUDE = { lines: { orderBy: { lineNumber: 'asc' } }, rfq: { select: { rfqNumber: true, customerId: true } } };

router.get('/quotes', requireScope('quotes:read'), wrap('list quotes', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, VISIBLE_QUOTES, 'status');
  const where = { rfq: { customerId: org(req) }, status: status || { in: VISIBLE_QUOTES } };
  const [rows, total] = await Promise.all([
    prisma.quote.findMany({ where, include: QUOTE_INCLUDE, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.quote.count({ where }),
  ]);
  res.json(pageOf(rows.map(quoteApi), total, p));
}));

router.get('/quotes/:id', requireScope('quotes:read'), wrap('get quote', async (req, res) => {
  const quote = await prisma.quote.findFirst({ where: { id: req.params.id, rfq: { customerId: org(req) }, status: { in: VISIBLE_QUOTES } }, include: QUOTE_INCLUDE });
  if (!quote) refuse(404, 'NOT_FOUND', 'Quote not found');
  seen(req, 'Quote', quote.id);
  res.json(quoteApi(quote));
}));

router.post('/quotes/:id/respond', requireScope('quotes:respond'), wrap('respond to quote', async (req, res) => {
  const body = req.body || {};
  const action = String(body.action || '').toLowerCase();
  if (!['accept', 'reject'].includes(action)) refuse(400, 'VALIDATION_ERROR', 'action must be "accept" or "reject"');
  // A draft is not the customer's to answer: it looks the same as a quote that does not exist.
  const visible = await prisma.quote.findFirst({ where: { id: req.params.id, rfq: { customerId: org(req) }, status: { in: VISIBLE_QUOTES } }, select: { id: true } });
  if (!visible) refuse(404, 'NOT_FOUND', 'Quote not found');
  seen(req, 'Quote', visible.id);
  if (action === 'reject') {
    const quote = await rejectQuote(visible.id, { reason: text(body.reason, 'reason') }, { customerId: org(req) });
    return res.json({ id: quote.id, status: quote.status, message: 'Quote rejected' });
  }
  const result = await acceptQuote(visible.id, {
    poReference: text(body.poNumber ?? body.poReference, 'poNumber', 100),
    shipToAddress: text(body.shipToAddress, 'shipToAddress', 300), shipToCity: text(body.shipToCity, 'shipToCity', 100),
    shipToState: text(body.shipToState, 'shipToState', 50), shipToZip: text(body.shipToZip, 'shipToZip', 20),
  }, null, {
    customerId: org(req),
    // The order and its event are one save.
    onOrder: (tx, order) => (order.status === 'CONFIRMED'
      ? recordBusinessEvent(tx, 'order.confirmed', order.id, { orderId: order.id, orderNumber: order.orderNumber, status: order.status, quoteId: visible.id }, { customerOrgId: org(req) })
      : null),
  });
  kick();
  res.status(201).json({
    id: visible.id, status: 'ACCEPTED', message: result.message,
    order: { id: result.order.id, orderNumber: result.order.orderNumber, status: result.order.status, totalAmount: num(result.order.totalAmount) },
    ...(result.creditHold && { onHold: true }),
  });
}));

// ─── Orders ────────────────────────────────────────────────────────────────────
const ORDER_STATUSES = ['DRAFT', 'PENDING', 'CONFIRMED', 'PARTIAL', 'COMPLETE', 'CANCELLED', 'HOLD'];
const orderApi = (o, full = false) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, poReference: o.poReference, orderDate: o.orderDate, requiredDate: o.requiredDate, promisedDate: o.promisedDate,
  subtotal: num(o.subtotal), taxAmount: num(o.taxAmount), freightAmount: num(o.freightAmount), totalAmount: num(o.totalAmount), currency: o.currency, paymentTerms: o.paymentTerms,
  shipTo: { address: o.shipToAddress, city: o.shipToCity, state: o.shipToState, postalCode: o.shipToZip },
  ...(full && { lines: (o.lines || []).map((l) => ({ lineNumber: l.lineNumber, description: l.description, quantityOrdered: num(l.qtyOrdered), quantityShipped: num(l.qtyShipped), unit: l.unit, unitPrice: num(l.unitPrice), priceUnit: l.priceUnit, extendedPrice: num(l.extendedPrice), status: l.lineStatus })) }),
  createdAt: o.createdAt, updatedAt: o.updatedAt,
});
const ownOrders = (req) => ({ buyerId: org(req), orderType: 'SO' });

router.get('/orders', requireScope('orders:read'), wrap('list orders', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, ORDER_STATUSES, 'status');
  const where = { ...ownOrders(req), ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.order.count({ where }),
  ]);
  res.json(pageOf(rows.map((o) => orderApi(o)), total, p));
}));

async function ownOrder(req) {
  const order = await prisma.order.findFirst({ where: { id: req.params.id, ...ownOrders(req) }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
  if (!order) refuse(404, 'NOT_FOUND', 'Order not found');
  seen(req, 'Order', order.id);
  return order;
}

router.get('/orders/:id', requireScope('orders:read'), wrap('get order', async (req, res) => {
  res.json(orderApi(await ownOrder(req), true));
}));

// What has happened to an order, from the records themselves.
router.get('/orders/:id/milestones', requireScope('orders:read'), wrap('get order milestones', async (req, res) => {
  const order = await ownOrder(req);
  const [shipments, invoices] = await Promise.all([
    prisma.shipment.findMany({ where: { orderId: order.id, status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'asc' }, select: { shipmentNumber: true, status: true, shippedAt: true, deliveredAt: true } }),
    prisma.invoice.findMany({ where: { orderId: order.id, kind: 'INVOICE', status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'asc' }, select: { invoiceNumber: true, invoiceDate: true, status: true } }),
  ]);
  const milestones = [{ type: 'ORDER_PLACED', at: order.orderDate, reference: order.orderNumber }];
  for (const s of shipments) {
    if (s.shippedAt) milestones.push({ type: 'SHIPPED', at: s.shippedAt, reference: s.shipmentNumber });
    if (s.deliveredAt) milestones.push({ type: 'DELIVERED', at: s.deliveredAt, reference: s.shipmentNumber });
  }
  for (const i of invoices) milestones.push({ type: 'INVOICED', at: i.invoiceDate, reference: i.invoiceNumber });
  milestones.sort((a, b) => new Date(a.at) - new Date(b.at));
  res.json({ orderId: order.id, orderNumber: order.orderNumber, status: order.status, milestones });
}));

// ─── Shipments ─────────────────────────────────────────────────────────────────
const SHIPMENT_STATUSES = ['PENDING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'CANCELLED'];
const SHIPMENT_INCLUDE = { order: { select: { orderNumber: true } }, items: { include: { orderLine: { select: { lineNumber: true, description: true, unit: true } } } } };
const shipmentApi = (s) => ({
  id: s.id, shipmentNumber: s.shipmentNumber, status: s.status, orderId: s.orderId, orderNumber: s.order?.orderNumber || null,
  carrierName: s.carrierName, bolNumber: s.bolNumber, scheduledDate: s.scheduledDate, shippedAt: s.shippedAt, deliveredAt: s.deliveredAt,
  totalWeightLb: num(s.totalWeightLb), proofOfDelivery: s.podCaptured, signedBy: s.podSignature,
  items: (s.items || []).map((i) => ({ lineNumber: i.orderLine?.lineNumber ?? null, description: i.orderLine?.description || null, quantity: num(i.qtyShipped), unit: i.orderLine?.unit || null, weightLb: num(i.weightLb) })),
});

router.get('/shipments', requireScope('shipments:read'), wrap('list shipments', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, SHIPMENT_STATUSES, 'status');
  const where = { order: ownOrders(req), ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.shipment.findMany({ where, include: SHIPMENT_INCLUDE, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.shipment.count({ where }),
  ]);
  res.json(pageOf(rows.map(shipmentApi), total, p));
}));

router.get('/shipments/:id', requireScope('shipments:read'), wrap('get shipment', async (req, res) => {
  const shipment = await prisma.shipment.findFirst({ where: { id: req.params.id, order: ownOrders(req) }, include: SHIPMENT_INCLUDE });
  if (!shipment) refuse(404, 'NOT_FOUND', 'Shipment not found');
  seen(req, 'Shipment', shipment.id);
  res.json(shipmentApi(shipment));
}));

// ─── Invoices ──────────────────────────────────────────────────────────────────
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];
router.get('/invoices', requireScope('invoices:read'), wrap('list invoices', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, INVOICE_STATUSES, 'status');
  const where = { order: ownOrders(req), status: status || { not: 'DRAFT' } };
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: { order: { select: { orderNumber: true, poReference: true } } }, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.invoice.count({ where }),
  ]);
  res.json(pageOf(rows.map((i) => ({
    id: i.id, invoiceNumber: i.invoiceNumber, kind: i.kind, status: i.status, orderId: i.orderId, orderNumber: i.order?.orderNumber || null, poReference: i.order?.poReference || null,
    invoiceDate: i.invoiceDate, dueDate: i.dueDate, subtotal: num(i.subtotal), taxAmount: num(i.taxAmount), freightAmount: num(i.freightAmount),
    totalAmount: num(i.totalAmount), paidAmount: num(i.paidAmount), balance: Math.round((num(i.totalAmount) - num(i.paidAmount)) * 100) / 100,
  })), total, p));
}));

// ─── Documents ─────────────────────────────────────────────────────────────────
const DOC_TYPES = ['MTR', 'CERT', 'BOL', 'POD', 'INVOICE', 'SPEC', 'COA', 'MSDS', 'DRAWING', 'OTHER'];
router.get('/documents', requireScope('documents:read'), wrap('list documents', async (req, res) => {
  const p = paging(req.query);
  const type = oneOf(req.query.type, DOC_TYPES, 'type');
  const where = { ownerId: org(req), ...(type && { documentType: type }) };
  const [rows, total] = await Promise.all([
    prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take, select: { id: true, documentType: true, documentNumber: true, title: true, fileName: true, fileType: true, fileSizeBytes: true, issueDate: true, createdAt: true } }),
    prisma.document.count({ where }),
  ]);
  res.json(pageOf(rows.map((d) => ({ ...d, downloadPath: `/api/v1/partner/customer/documents/${d.id}/download` })), total, p));
}));

router.get('/documents/:id/download', requireScope('documents:read'), wrap('download document', async (req, res) => {
  const document = await prisma.document.findFirst({ where: { id: req.params.id, ownerId: org(req) } });
  if (!document) refuse(404, 'NOT_FOUND', 'Document not found');
  seen(req, 'Document', document.id);
  const onDisk = document.storagePath && document.storagePath !== 'database' && fs.existsSync(document.storagePath);
  const stored = onDisk ? null : await prisma.documentBlob.findUnique({ where: { documentId: document.id } }).catch(() => null);
  if (!onDisk && !stored) refuse(404, 'FILE_NOT_AVAILABLE', 'The file for this document is not available');
  res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${String(document.fileName).replace(/["\r\n]/g, '')}"`);
  if (stored) return res.end(Buffer.from(stored.data));
  fs.createReadStream(document.storagePath).pipe(res);
}));

export default router;
