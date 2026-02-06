/**
 * Carrier Partner API Routes
 * External-facing endpoints for carrier/logistics integrations.
 * All routes require partner auth with CARRIER type.
 * 
 * Mount: /api/v1/partner/carrier
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { partnerAuth, requireScope, requirePartnerType } from '../../middleware/partnerAuth.js';
import { partnerRateLimit, loadPartnerTier } from '../../middleware/partnerRateLimit.js';
import { dispatchWebhookEvent } from '../../services/webhookService.js';

const router = Router();
const prisma = new PrismaClient();

// Apply partner middleware stack
router.use(partnerAuth());
router.use(requirePartnerType('CARRIER'));
router.use(loadPartnerTier());
router.use(partnerRateLimit());

// ─── Shipments ─────────────────────────────────────────────────────────────────

// GET /shipments — List shipments assigned to this carrier
router.get('/shipments', requireScope('shipments:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    // Carrier org name is stored as the carrier field on shipments
    // In production, there would be a carrierId FK. Using org name match for now.
    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const where = {
      OR: [
        { carrier: org.name },
        { carrier: org.code },
        { carrierId: req.partner.orgId },
      ],
    };
    if (status) where.status = status;

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          items: { select: { id: true, description: true, quantity: true, weight: true } },
          stops: { orderBy: { sequence: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      data: shipments.map(s => ({
        id: s.id,
        status: s.status,
        trackingNumber: s.trackingNumber,
        estimatedDelivery: s.estimatedDelivery,
        itemCount: s.items.length,
        totalWeight: s.items.reduce((sum, i) => sum + (i.weight || 0), 0),
        stopCount: s.stops.length,
        createdAt: s.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Carrier shipments list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list shipments' } });
  }
});

// GET /shipments/:id — Shipment detail
router.get('/shipments/:id', requireScope('shipments:read'), async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { carrier: org.name },
          { carrier: org.code },
          { carrierId: req.partner.orgId },
        ],
      },
      include: {
        items: true,
        stops: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    res.json({
      id: shipment.id,
      status: shipment.status,
      trackingNumber: shipment.trackingNumber,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      items: shipment.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        weight: item.weight,
      })),
      stops: shipment.stops.map(stop => ({
        sequence: stop.sequence,
        type: stop.type,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        postalCode: stop.postalCode,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        scheduledArrival: stop.estimatedArrival,
        actualArrival: stop.actualArrival,
        notes: stop.notes,
      })),
      notes: shipment.notes,
      createdAt: shipment.createdAt,
    });
  } catch (error) {
    console.error('Carrier shipment detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment' } });
  }
});

// POST /shipments/:id/respond — Accept or decline a shipment assignment
router.post('/shipments/:id/respond', requireScope('shipments:respond'), async (req, res) => {
  try {
    const { action, reason, estimatedPickup } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'action must be "accept" or "decline"' }
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { carrier: org.name },
          { carrier: org.code },
          { carrierId: req.partner.orgId },
        ],
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    const newStatus = action === 'accept' ? 'CONFIRMED' : 'CANCELLED';

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: newStatus,
        notes: `${shipment.notes || ''}\n[Carrier API] ${action === 'accept' ? 'Accepted' : `Declined: ${reason || 'No reason given'}`}`.trim(),
      },
    });

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    res.json({
      id: updated.id,
      status: updated.status,
      message: `Shipment ${action}ed`,
    });
  } catch (error) {
    console.error('Carrier shipment respond error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to respond to shipment' } });
  }
});

// POST /shipments/:id/status — Update shipment status
router.post('/shipments/:id/status', requireScope('shipments:status'), async (req, res) => {
  try {
    const { status, location, notes, timestamp } = req.body;

    const validStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELAYED', 'EXCEPTION'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${validStatuses.join(', ')}` }
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { carrier: org.name },
          { carrier: org.code },
          { carrierId: req.partner.orgId },
        ],
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    // Map carrier statuses to internal shipment statuses
    const statusMap = {
      'PICKED_UP': 'IN_TRANSIT',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'IN_TRANSIT',
      'DELIVERED': 'DELIVERED',
      'DELAYED': 'DELAYED',
      'EXCEPTION': 'EXCEPTION',
    };

    const updateData = {
      status: statusMap[status] || shipment.status,
      notes: `${shipment.notes || ''}\n[Carrier API ${new Date().toISOString()}] Status: ${status}${location ? ` at ${location}` : ''}${notes ? ` - ${notes}` : ''}`.trim(),
    };

    if (status === 'DELIVERED') {
      updateData.actualDelivery = timestamp ? new Date(timestamp) : new Date();
    }

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData,
    });

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    // Dispatch webhook events based on status
    const eventMap = {
      'PICKED_UP': 'shipment.dispatched',
      'DELIVERED': 'shipment.delivered',
      'DELAYED': 'shipment.exception',
      'EXCEPTION': 'shipment.exception',
    };

    const eventType = eventMap[status];
    if (eventType) {
      // Find customer partner for this order
      const order = shipment.orderId ? await prisma.order.findUnique({
        where: { id: shipment.orderId },
        select: { buyerOrgId: true },
      }) : null;

      const customerPartner = order ? await prisma.partner.findFirst({
        where: { organizationId: order.buyerOrgId, partnerType: 'CUSTOMER', status: 'ACTIVE' },
        select: { id: true },
      }) : null;

      const targetPartnerIds = [req.partner.id];
      if (customerPartner) targetPartnerIds.push(customerPartner.id);

      dispatchWebhookEvent(eventType, {
        shipmentId: shipment.id,
        status,
        location,
        timestamp: timestamp || new Date().toISOString(),
      }, targetPartnerIds).catch(console.error);
    }

    res.json({
      id: updated.id,
      status: updated.status,
      carrierStatus: status,
      message: 'Status updated',
    });
  } catch (error) {
    console.error('Carrier status update error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
  }
});

// POST /shipments/:id/pod — Upload Proof of Delivery
router.post('/shipments/:id/pod', requireScope('pod:write'), async (req, res) => {
  try {
    const { signedBy, signatureUrl, photoUrls, notes, deliveredAt } = req.body;

    if (!signedBy) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'signedBy is required' }
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { carrier: org.name },
          { carrier: org.code },
          { carrierId: req.partner.orgId },
        ],
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    // Create POD as a document
    const podDoc = await prisma.document.create({
      data: {
        organizationId: req.partner.orgId,
        type: 'POD',
        title: `POD - Shipment ${shipment.trackingNumber || shipment.id}`,
        fileName: `pod_${shipment.id}.json`,
        fileUrl: signatureUrl || null,
        mimeType: 'application/json',
        notes: JSON.stringify({
          signedBy,
          signatureUrl,
          photoUrls: photoUrls || [],
          deliveredAt: deliveredAt || new Date().toISOString(),
          notes,
        }),
      },
    });

    // Update shipment status to delivered
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: 'DELIVERED',
        actualDelivery: deliveredAt ? new Date(deliveredAt) : new Date(),
        notes: `${shipment.notes || ''}\n[Carrier API] POD uploaded - Signed by: ${signedBy}`.trim(),
      },
    });

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    // Dispatch delivery event
    dispatchWebhookEvent('shipment.delivered', {
      shipmentId: shipment.id,
      signedBy,
      deliveredAt: deliveredAt || new Date().toISOString(),
    }).catch(console.error);

    res.status(201).json({
      id: podDoc.id,
      shipmentId: shipment.id,
      signedBy,
      message: 'Proof of delivery uploaded',
      createdAt: podDoc.createdAt,
    });
  } catch (error) {
    console.error('Carrier POD upload error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to upload POD' } });
  }
});

// ─── Exceptions ────────────────────────────────────────────────────────────────

// POST /exceptions — Report a shipment exception
router.post('/exceptions', requireScope('exceptions:write'), async (req, res) => {
  try {
    const { shipmentId, type, description, location, severity, photoUrls } = req.body;

    if (!shipmentId || !type || !description) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'shipmentId, type, and description are required' }
      });
    }

    const validTypes = ['DAMAGE', 'DELAY', 'REFUSED', 'ADDRESS_ISSUE', 'WEATHER', 'MECHANICAL', 'OTHER'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `type must be one of: ${validTypes.join(', ')}` }
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const shipment = await prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        OR: [
          { carrier: org.name },
          { carrier: org.code },
          { carrierId: req.partner.orgId },
        ],
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    // Update shipment with exception
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: 'EXCEPTION',
        notes: `${shipment.notes || ''}\n[EXCEPTION ${new Date().toISOString()}] ${type}: ${description}${location ? ` at ${location}` : ''}`.trim(),
      },
    });

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    // Dispatch exception event
    dispatchWebhookEvent('shipment.exception', {
      shipmentId: shipment.id,
      type,
      description,
      location,
      severity: severity || 'MEDIUM',
    }).catch(console.error);

    res.status(201).json({
      shipmentId: shipment.id,
      exceptionType: type,
      severity: severity || 'MEDIUM',
      message: 'Exception reported',
    });
  } catch (error) {
    console.error('Carrier exception report error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to report exception' } });
  }
});

// ─── Performance ───────────────────────────────────────────────────────────────

// GET /performance — Carrier performance metrics
router.get('/performance', requireScope('performance:read'), async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.partner.orgId },
      select: { name: true, code: true },
    });

    const shipments = await prisma.shipment.findMany({
      where: {
        OR: [
          { carrier: org.name },
          { carrier: org.code },
          { carrierId: req.partner.orgId },
        ],
      },
      select: { status: true, estimatedDelivery: true, actualDelivery: true, createdAt: true },
    });

    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'DELIVERED').length;
    const onTime = shipments.filter(s =>
      s.status === 'DELIVERED' &&
      s.actualDelivery &&
      s.estimatedDelivery &&
      new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
    ).length;
    const exceptions = shipments.filter(s => s.status === 'EXCEPTION').length;

    res.json({
      partnerId: req.partner.id,
      period: 'ALL_TIME',
      metrics: {
        totalShipments: total,
        deliveredShipments: delivered,
        onTimeDeliveryRate: delivered > 0 ? Math.round((onTime / delivered) * 100) : null,
        exceptionRate: total > 0 ? Math.round((exceptions / total) * 100) : null,
      },
    });
  } catch (error) {
    console.error('Carrier performance error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get performance' } });
  }
});

export default router;
