/**
 * Carrier partner API. Mount: /api/v1/partner/carrier
 *
 * A carrier sees the shipments assigned to its own organisation (Shipment.carrierId) and
 * reports on them. Rules (finding C-002):
 *   - A carrier never dispatches. Stock, the order and the invoice change only when the
 *     service center dispatches the shipment. A carrier report on a shipment that has not been
 *     dispatched is refused.
 *   - "Delivered" and "exception" go through the same step staff use, so the same history is
 *     written and the same events are raised.
 *   - Reports can arrive twice or late. A repeat of the current state answers 200 with
 *     `duplicate: true` and changes nothing. A report that is older than the shipment's state
 *     (in transit after delivered) is refused with 409.
 *   - A carrier sees what it needs to move the load: no prices.
 */
import { Router } from 'express';
import prisma from '../../lib/db.js';
import { requireScope } from '../../middleware/partnerAuth.js';
import { deliver, moveShipment } from '../shipments.js';
import { recordBusinessEvent, kick } from '../../services/webhookService.js';
import { partnerStack, wrap, refuse, paging, pageOf, num, oneOf, text, partnerNote } from './common.js';

const router = Router();
router.use(...partnerStack('CARRIER'));

const STATUSES = ['PENDING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION', 'CANCELLED'];
const REPORTS = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'EXCEPTION'];
const INCLUDE = {
  items: { include: { orderLine: { select: { lineNumber: true, description: true, unit: true } } } },
  stops: { orderBy: { stopNumber: 'asc' } },
  fromLocation: { select: { code: true, name: true, addressLine1: true, city: true, state: true, postalCode: true } },
  order: { select: { orderNumber: true, shipToAddress: true, shipToCity: true, shipToState: true, shipToZip: true, buyerId: true, buyer: { select: { name: true } } } },
};
const mine = (req, id) => ({ carrierId: req.partner.orgId, ...(id && { id }) });

const toApi = (s) => ({
  id: s.id, shipmentNumber: s.shipmentNumber, status: s.status, orderNumber: s.order?.orderNumber || null,
  scheduledDate: s.scheduledDate, shippedAt: s.shippedAt, deliveredAt: s.deliveredAt,
  totalWeightLb: num(s.totalWeightLb), bolNumber: s.bolNumber, truckNumber: s.truckNumber, driverName: s.driverName,
  proofOfDelivery: s.podCaptured,
  origin: s.fromLocation ? { code: s.fromLocation.code, name: s.fromLocation.name, address: s.fromLocation.addressLine1, city: s.fromLocation.city, state: s.fromLocation.state, postalCode: s.fromLocation.postalCode } : null,
  destination: s.order ? { name: s.order.buyer?.name || null, address: s.order.shipToAddress, city: s.order.shipToCity, state: s.order.shipToState, postalCode: s.order.shipToZip } : null,
  items: (s.items || []).map((i) => ({ id: i.id, lineNumber: i.orderLine?.lineNumber ?? null, description: i.orderLine?.description || null, quantity: num(i.qtyShipped), unit: i.orderLine?.unit || null, weightLb: num(i.weightLb) })),
  stops: (s.stops || []).map((p) => ({ sequence: p.stopNumber, address: p.address, city: p.city, state: p.state, postalCode: p.zipCode, scheduledTime: p.scheduledTime, arrivedAt: p.arrivedAt, departedAt: p.departedAt, notes: p.notes })),
  createdAt: s.createdAt, updatedAt: s.updatedAt,
});

async function own(req) {
  const shipment = await prisma.shipment.findFirst({ where: mine(req, String(req.params.id || req.body?.shipmentId || '')), include: INCLUDE });
  if (!shipment) refuse(404, 'NOT_FOUND', 'Shipment not found');
  req.partnerResourceType = 'Shipment';
  req.partnerResourceId = shipment.id;
  return shipment;
}

/** A report that changes nothing on the shipment itself is still kept, with who sent it. */
const track = (db, req, shipment, report, details = {}) => db.auditLog.create({
  data: {
    category: 'WORKFLOW', eventType: 'CARRIER_REPORT', severity: report === 'DELAYED' ? 'WARNING' : 'INFO', action: 'UPDATE', userId: null,
    resourceType: 'Shipment', resourceId: shipment.id,
    details: { shipmentNumber: shipment.shipmentNumber, report, partnerId: req.partner.id, ...details },
  },
});

router.get('/shipments', requireScope('shipments:read'), wrap('list shipments', async (req, res) => {
  const p = paging(req.query);
  const status = oneOf(req.query.status, STATUSES, 'status');
  const where = { ...mine(req), ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.shipment.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take }),
    prisma.shipment.count({ where }),
  ]);
  res.json(pageOf(rows.map(toApi), total, p));
}));

router.get('/shipments/:id', requireScope('shipments:read'), wrap('get shipment', async (req, res) => {
  res.json(toApi(await own(req)));
}));

// Accept or decline a load. Recorded for the shipping desk; the shipment itself is not changed,
// because reassigning or cancelling a load is the service center's decision.
router.post('/shipments/:id/respond', requireScope('shipments:respond'), wrap('respond to shipment', async (req, res) => {
  const action = String(req.body?.action || '').toLowerCase();
  if (!['accept', 'decline'].includes(action)) refuse(400, 'VALIDATION_ERROR', 'action must be "accept" or "decline"');
  const reason = text(req.body?.reason, 'reason');
  const shipment = await own(req);
  if (!['PENDING', 'LOADING'].includes(shipment.status)) refuse(409, 'CONFLICT', `This shipment is ${shipment.status}, so it can no longer be accepted or declined`);
  await track(prisma, req, shipment, action === 'accept' ? 'ACCEPTED' : 'DECLINED', { reason, estimatedPickup: text(req.body?.estimatedPickup, 'estimatedPickup', 40) });
  res.json({ id: shipment.id, status: shipment.status, response: action === 'accept' ? 'ACCEPTED' : 'DECLINED', message: action === 'accept' ? 'Acceptance recorded' : 'Decline recorded. The shipping desk will reassign the load.' });
}));

async function report(req, shipment, status, body) {
  const location = text(body.location, 'location', 200);
  const notes = text(body.notes, 'notes', 1000);
  const at = body.timestamp ? new Date(body.timestamp) : new Date();
  if (Number.isNaN(at.getTime())) refuse(400, 'VALIDATION_ERROR', 'timestamp is not a valid date');
  const details = { location, notes, reportedAt: at.toISOString() };
  const done = (extra = {}) => ({ id: shipment.id, carrierStatus: status, message: 'Status recorded', ...extra });

  if (['PENDING', 'LOADING'].includes(shipment.status)) refuse(409, 'NOT_DISPATCHED', 'The service center has not dispatched this shipment yet');
  if (shipment.status === 'CANCELLED') refuse(409, 'CONFLICT', 'This shipment was cancelled');
  if (shipment.status === 'DELIVERED') {
    if (status === 'DELIVERED') return done({ status: 'DELIVERED', duplicate: true, message: 'Already recorded as delivered' });
    refuse(409, 'ALREADY_DELIVERED', 'This shipment is already delivered, so an earlier status cannot be applied');
  }

  if (status === 'DELIVERED') {
    const updated = await deliver(shipment.id, { podSignature: text(body.signedBy ?? body.podSignature, 'signedBy', 200) || undefined, podImageUrl: text(body.podImageUrl ?? body.imageUrl, 'podImageUrl', 2000) || undefined }, null, partnerNote(req, `delivered${location ? ` at ${location}` : ''}`));
    await track(prisma, req, shipment, status, details);
    return done({ status: updated.status });
  }
  if (status === 'EXCEPTION') {
    if (shipment.status === 'EXCEPTION') { await track(prisma, req, shipment, status, details); return done({ status: 'EXCEPTION', duplicate: true }); }
    const updated = await moveShipment(shipment.id, 'EXCEPTION', {}, null, partnerNote(req, notes || 'exception reported'));
    await track(prisma, req, shipment, status, details);
    return done({ status: updated.status });
  }
  if (status === 'DELAYED') {
    // A delay does not change where the shipment is. It is recorded and the customer's system is told.
    await prisma.$transaction(async (tx) => {
      await track(tx, req, shipment, status, details);
      await recordBusinessEvent(tx, 'order.delayed', `${shipment.id}:${at.getTime()}`, { shipmentId: shipment.id, shipmentNumber: shipment.shipmentNumber, orderNumber: shipment.order?.orderNumber || null, reason: notes, location }, { customerOrgId: shipment.order?.buyerId });
    });
    kick();
    return done({ status: shipment.status });
  }
  // PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY: the shipment is on the road.
  if (shipment.status === 'EXCEPTION') {
    const updated = await moveShipment(shipment.id, 'IN_TRANSIT', {}, null, partnerNote(req, 'back on the road'));
    await track(prisma, req, shipment, status, details);
    return done({ status: updated.status });
  }
  await track(prisma, req, shipment, status, details);
  return done({ status: shipment.status });
}

router.post('/shipments/:id/status', requireScope('shipments:status'), wrap('update shipment status', async (req, res) => {
  const status = oneOf(req.body?.status, REPORTS, 'status');
  if (!status) refuse(400, 'VALIDATION_ERROR', `status must be one of: ${REPORTS.join(', ')}`);
  res.json(await report(req, await own(req), status, req.body || {}));
}));

// Proof of delivery. Same step as a "delivered" report, with who signed.
router.post('/shipments/:id/pod', requireScope('pod:write'), wrap('record proof of delivery', async (req, res) => {
  const body = req.body || {};
  if (!text(body.signedBy ?? body.podSignature, 'signedBy', 200) && !text(body.podImageUrl ?? body.imageUrl, 'podImageUrl', 2000)) {
    refuse(400, 'VALIDATION_ERROR', 'signedBy or podImageUrl is required');
  }
  res.json(await report(req, await own(req), 'DELIVERED', body));
}));

router.post('/exceptions', requireScope('exceptions:write'), wrap('report exception', async (req, res) => {
  const body = req.body || {};
  if (!body.shipmentId) refuse(400, 'VALIDATION_ERROR', 'shipmentId is required');
  const description = text(body.description ?? body.notes, 'description', 1000);
  if (!description) refuse(400, 'VALIDATION_ERROR', 'description is required');
  const result = await report(req, await own(req), 'EXCEPTION', { ...body, notes: [text(body.type, 'type', 60), description].filter(Boolean).join(': ') });
  res.status(result.duplicate ? 200 : 201).json(result);
}));

router.get('/performance', requireScope('performance:read'), wrap('get performance', async (req, res) => {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await prisma.shipment.findMany({ where: { ...mine(req), createdAt: { gte: since } }, select: { status: true, scheduledDate: true, deliveredAt: true } });
  const delivered = rows.filter((r) => r.status === 'DELIVERED');
  const dated = delivered.filter((r) => r.scheduledDate && r.deliveredAt);
  // On time: delivered by the end of the scheduled day.
  const onTime = dated.filter((r) => r.deliveredAt.getTime() <= new Date(r.scheduledDate).setUTCHours(23, 59, 59, 999)).length;
  res.json({
    periodDays: 90, total: rows.length, delivered: delivered.length,
    inTransit: rows.filter((r) => r.status === 'IN_TRANSIT').length, exceptions: rows.filter((r) => r.status === 'EXCEPTION').length,
    cancelled: rows.filter((r) => r.status === 'CANCELLED').length,
    onTimeDeliveryPct: dated.length ? Math.round((onTime / dated.length) * 1000) / 10 : null, measuredDeliveries: dated.length,
  });
}));

export default router;
