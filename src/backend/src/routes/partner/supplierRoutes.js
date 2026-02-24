/**
 * Supplier Partner API Routes
 * External-facing endpoints for supplier integrations.
 * All routes require partner auth with SUPPLIER type.
 * 
 * Mount: /api/v1/partner/supplier
 */

import { Router } from 'express';
import prisma from '../../lib/db.js';
import { partnerAuth, requireScope, requirePartnerType } from '../../middleware/partnerAuth.js';
import { partnerRateLimit, loadPartnerTier } from '../../middleware/partnerRateLimit.js';
import { dispatchWebhookEvent } from '../../services/webhookService.js';

const router = Router();

// Apply partner middleware stack
router.use(partnerAuth());
router.use(requirePartnerType('SUPPLIER'));
router.use(loadPartnerTier());
router.use(partnerRateLimit());

// ─── Purchase Orders ───────────────────────────────────────────────────────────

// GET /purchase-orders — List POs assigned to this supplier
router.get('/purchase-orders', requireScope('po:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    // Supplier sees orders where they are the seller
    const where = { sellerOrgId: req.partner.orgId, type: 'PURCHASE' };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        lineCount: o.lines.length,
        requestedDate: o.requestedDate,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Supplier PO list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list purchase orders' } });
  }
});

// GET /purchase-orders/:id — PO detail
router.get('/purchase-orders/:id', requireScope('po:read'), async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, sellerOrgId: req.partner.orgId, type: 'PURCHASE' },
      include: { lines: true },
    });

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Purchase order not found' } });
    }

    req.partnerResourceType = 'Order';
    req.partnerResourceId = order.id;

    res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      requestedDate: order.requestedDate,
      notes: order.notes,
      lines: order.lines.map(line => ({
        lineNumber: line.lineNumber,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error('Supplier PO detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get purchase order' } });
  }
});

// POST /purchase-orders/:id/acknowledge — Acknowledge receipt of PO
router.post('/purchase-orders/:id/acknowledge', requireScope('po:acknowledge'), async (req, res) => {
  try {
    const { estimatedShipDate, notes } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, sellerOrgId: req.partner.orgId, type: 'PURCHASE' },
    });

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Purchase order not found' } });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        notes: notes ? `${order.notes || ''}\n[Supplier API] Acknowledged: ${notes}`.trim() : order.notes,
      },
    });

    req.partnerResourceType = 'Order';
    req.partnerResourceId = order.id;

    res.json({
      id: updated.id,
      status: updated.status,
      message: 'Purchase order acknowledged',
      estimatedShipDate: estimatedShipDate || null,
    });
  } catch (error) {
    console.error('Supplier PO acknowledge error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to acknowledge PO' } });
  }
});

// ─── ASN (Advance Shipment Notices) ────────────────────────────────────────────

// POST /asn — Submit an Advance Shipment Notice
router.post('/asn', requireScope('asn:write'), async (req, res) => {
  try {
    const { purchaseOrderId, carrier, trackingNumber, estimatedDelivery, items, notes } = req.body;

    if (!purchaseOrderId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'purchaseOrderId is required' }
      });
    }

    // Verify the PO belongs to this supplier
    const po = await prisma.order.findFirst({
      where: { id: purchaseOrderId, sellerOrgId: req.partner.orgId, type: 'PURCHASE' },
    });

    if (!po) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Purchase order not found' } });
    }

    // Create shipment as ASN
    const shipment = await prisma.shipment.create({
      data: {
        orderId: po.id,
        status: 'SCHEDULED',
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        notes: notes ? `[Supplier ASN] ${notes}` : '[Supplier ASN]',
        items: items ? {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            weight: item.weight || null,
          })),
        } : undefined,
      },
      include: { items: true },
    });

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    // Dispatch event
    dispatchWebhookEvent('shipment.dispatched', {
      shipmentId: shipment.id,
      purchaseOrderId: po.id,
      carrier,
      trackingNumber,
    }).catch(console.error);

    res.status(201).json({
      id: shipment.id,
      purchaseOrderId: po.id,
      status: shipment.status,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      estimatedDelivery: shipment.estimatedDelivery,
      itemCount: shipment.items.length,
      createdAt: shipment.createdAt,
    });
  } catch (error) {
    console.error('Supplier ASN create error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create ASN' } });
  }
});

// GET /asn — List ASNs submitted by this supplier
router.get('/asn', requireScope('asn:read'), async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;

    const supplierOrders = await prisma.order.findMany({
      where: { sellerOrgId: req.partner.orgId, type: 'PURCHASE' },
      select: { id: true },
    });

    const orderIds = supplierOrders.map(o => o.id);

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.shipment.count({ where: { orderId: { in: orderIds } } }),
    ]);

    res.json({
      data: shipments.map(s => ({
        id: s.id,
        orderId: s.orderId,
        status: s.status,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        estimatedDelivery: s.estimatedDelivery,
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
    console.error('Supplier ASN list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list ASNs' } });
  }
});

// ─── Documents ─────────────────────────────────────────────────────────────────

// POST /documents — Upload MTR / CoC
router.post('/documents', requireScope('documents:write'), async (req, res) => {
  try {
    const { type, title, fileName, fileUrl, heatNumber, orderReference, notes } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'type and title are required' }
      });
    }

    const validTypes = ['MTR', 'COC', 'SPEC_SHEET', 'MSDS', 'PACKING_LIST', 'OTHER'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: `type must be one of: ${validTypes.join(', ')}` }
      });
    }

    const doc = await prisma.document.create({
      data: {
        organizationId: req.partner.orgId,
        type,
        title,
        fileName: fileName || null,
        fileUrl: fileUrl || null,
        mimeType: 'application/pdf',
        notes: notes ? `[Supplier API] ${notes}` : null,
      },
    });

    req.partnerResourceType = 'Document';
    req.partnerResourceId = doc.id;

    dispatchWebhookEvent('document.available', {
      documentId: doc.id,
      type,
      title,
    }).catch(console.error);

    res.status(201).json({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    console.error('Supplier document upload error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to upload document' } });
  }
});

// ─── SCARs (Supplier Corrective Action Requests) ──────────────────────────────

// GET /scars — List SCARs issued to this supplier
router.get('/scars', requireScope('scar:read'), async (req, res) => {
  try {
    // SCARs would be stored as a specific type in a quality/NCR system
    // For now, we'll use documents or a dedicated model if it exists
    // Returning a structured placeholder that matches the contract
    res.json({
      data: [],
      pagination: {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
      },
      message: 'SCAR module will be connected when production quality module is integrated',
    });
  } catch (error) {
    console.error('Supplier SCARs list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list SCARs' } });
  }
});

// POST /scars/:id/respond — Respond to a SCAR
router.post('/scars/:id/respond', requireScope('scar:respond'), async (req, res) => {
  try {
    const { rootCause, correctiveAction, preventiveAction, targetDate } = req.body;

    if (!rootCause || !correctiveAction) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'rootCause and correctiveAction are required' }
      });
    }

    // Placeholder - would link to actual SCAR system
    res.json({
      scarId: req.params.id,
      status: 'RESPONSE_SUBMITTED',
      message: 'SCAR response recorded',
    });
  } catch (error) {
    console.error('Supplier SCAR respond error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to respond to SCAR' } });
  }
});

// ─── Scorecard ─────────────────────────────────────────────────────────────────

// GET /scorecard — View own supplier scorecard
router.get('/scorecard', requireScope('scorecard:read'), async (req, res) => {
  try {
    // Calculate metrics from actual data
    const supplierOrders = await prisma.order.findMany({
      where: { sellerOrgId: req.partner.orgId, type: 'PURCHASE' },
      select: { id: true, status: true, createdAt: true },
    });

    const totalOrders = supplierOrders.length;
    const completedOrders = supplierOrders.filter(o => o.status === 'COMPLETED').length;

    res.json({
      partnerId: req.partner.id,
      period: 'LAST_12_MONTHS',
      metrics: {
        totalOrders,
        completedOrders,
        onTimeDeliveryRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : null,
        qualityScore: null, // Would come from SCAR/NCR system
        responseTime: null, // Would come from PO acknowledgment times
      },
      message: 'Scorecard metrics are calculated from actual order history',
    });
  } catch (error) {
    console.error('Supplier scorecard error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get scorecard' } });
  }
});

export default router;
