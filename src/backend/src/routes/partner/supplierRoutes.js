/**
 * Supplier partner API. Mount: /api/v1/partner/supplier
 *
 * A supplier reads the purchase orders placed with its own organisation (orders of type PO
 * whose seller is that organisation) and acknowledges them.
 *
 * Purchasing beyond that is not built in this system yet: there is no advance ship notice,
 * supplier corrective action or supplier scorecard record to read or write. Those addresses
 * answer 501 with a plain reason instead of failing, so a supplier's system can tell "not
 * offered" from "broken". They are listed in the integration inventory as placeholders.
 */
import { Router } from 'express';
import prisma from '../../lib/db.js';
import { requireScope } from '../../middleware/partnerAuth.js';
import { partnerStack, wrap, refuse, paging, pageOf, num, oneOf, text, notAvailable } from './common.js';

const router = Router();
router.use(...partnerStack('SUPPLIER'));

const STATUSES = ['DRAFT', 'PENDING', 'CONFIRMED', 'PARTIAL', 'COMPLETE', 'CANCELLED', 'HOLD'];
const mine = (req) => ({ orderType: 'PO', sellerId: req.partner.orgId, status: { not: 'DRAFT' } });
const poApi = (o, full = false) => ({
  id: o.id, poNumber: o.orderNumber, status: o.status, orderDate: o.orderDate, requiredDate: o.requiredDate, promisedDate: o.promisedDate,
  subtotal: num(o.subtotal), totalAmount: num(o.totalAmount), currency: o.currency, paymentTerms: o.paymentTerms, freightTerms: o.freightTerms,
  shipTo: { address: o.shipToAddress, city: o.shipToCity, state: o.shipToState, postalCode: o.shipToZip },
  ...(full && { lines: (o.lines || []).map((l) => ({ lineNumber: l.lineNumber, description: l.description, quantityOrdered: num(l.qtyOrdered), quantityReceived: num(l.qtyReceived), unit: l.unit, unitPrice: num(l.unitPrice), priceUnit: l.priceUnit, thicknessIn: num(l.thicknessIn), widthIn: num(l.widthIn), lengthIn: num(l.lengthIn) })) }),
  createdAt: o.createdAt, updatedAt: o.updatedAt,
});

router.get('/purchase-orders', requireScope('po:read'), wrap('list purchase orders', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, STATUSES, 'status');
  const where = { ...mine(req), ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.order.count({ where }),
  ]);
  res.json(pageOf(rows.map((o) => poApi(o)), total, p));
}));

async function own(req) {
  const order = await prisma.order.findFirst({ where: { id: req.params.id, ...mine(req) }, include: { lines: { orderBy: { lineNumber: 'asc' } } } });
  if (!order) refuse(404, 'NOT_FOUND', 'Purchase order not found');
  req.partnerResourceType = 'Order';
  req.partnerResourceId = order.id;
  return order;
}

router.get('/purchase-orders/:id', requireScope('po:read'), wrap('get purchase order', async (req, res) => {
  res.json(poApi(await own(req), true));
}));

// An acknowledgement is put on record with the date the supplier expects to ship. It does not
// change the purchase order's status: confirming a purchase order is the buyer's step.
router.post('/purchase-orders/:id/acknowledge', requireScope('po:acknowledge'), wrap('acknowledge purchase order', async (req, res) => {
  const order = await own(req);
  if (['CANCELLED', 'COMPLETE'].includes(order.status)) refuse(409, 'CONFLICT', `This purchase order is ${order.status.toLowerCase()}`);
  const estimatedShipDate = req.body?.estimatedShipDate ? new Date(req.body.estimatedShipDate) : null;
  if (estimatedShipDate && Number.isNaN(estimatedShipDate.getTime())) refuse(400, 'VALIDATION_ERROR', 'estimatedShipDate is not a valid date');
  const notes = text(req.body?.notes, 'notes', 1000);
  const before = await prisma.auditLog.findFirst({ where: { resourceType: 'Order', resourceId: order.id, eventType: 'PO_ACKNOWLEDGED' }, select: { id: true } });
  await prisma.auditLog.create({ data: {
    category: 'WORKFLOW', eventType: 'PO_ACKNOWLEDGED', severity: 'INFO', action: 'UPDATE', userId: null, resourceType: 'Order', resourceId: order.id,
    details: { poNumber: order.orderNumber, partnerId: req.partner.id, estimatedShipDate: estimatedShipDate?.toISOString() || null, notes, repeat: Boolean(before) },
  } });
  res.json({ id: order.id, poNumber: order.orderNumber, status: order.status, acknowledged: true, estimatedShipDate, message: before ? 'Acknowledgement updated' : 'Purchase order acknowledged' });
}));

router.post('/asn', requireScope('asn:write'), notAvailable('Sending an advance ship notice'));
router.get('/asn', requireScope('asn:read'), notAvailable('Reading advance ship notices'));
router.post('/documents', requireScope('documents:write'), notAvailable('Uploading a document'));
router.get('/scars', requireScope('scar:read'), notAvailable('Reading corrective action requests'));
router.post('/scars/:id/respond', requireScope('scar:respond'), notAvailable('Answering a corrective action request'));
router.get('/scorecard', requireScope('scorecard:read'), notAvailable('The supplier scorecard'));

export default router;
