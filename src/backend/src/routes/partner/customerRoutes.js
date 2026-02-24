/**
 * Customer Partner API Routes
 * External-facing endpoints for customer integrations.
 * All routes require partner auth with CUSTOMER type.
 * 
 * Mount: /api/v1/partner/customer
 */

import { Router } from 'express';
import prisma from '../../lib/db.js';
import { partnerAuth, requireScope, requirePartnerType } from '../../middleware/partnerAuth.js';
import { partnerRateLimit, loadPartnerTier } from '../../middleware/partnerRateLimit.js';
import { dispatchWebhookEvent } from '../../services/webhookService.js';

const router = Router();

// Apply partner middleware stack to all routes
router.use(partnerAuth());
router.use(requirePartnerType('CUSTOMER', 'STRATEGIC'));
router.use(loadPartnerTier());
router.use(partnerRateLimit());

// ─── RFQs ──────────────────────────────────────────────────────────────────────

// POST / — Submit an RFQ
router.post('/rfqs', requireScope('rfq:write'), async (req, res) => {
  try {
    const { items, notes, requestedDeliveryDate, poNumber } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'items array is required with at least one item' }
      });
    }

    // Create RFQ linked to partner's organization
    const rfq = await prisma.rFQ.create({
      data: {
        customerId: req.partner.orgId,
        status: 'PENDING',
        notes: notes || null,
        requestedDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : null,
        source: 'PARTNER_API',
        externalRef: poNumber || null,
        lines: {
          create: items.map((item, idx) => ({
            lineNumber: idx + 1,
            productType: item.productType || null,
            gradeCode: item.gradeCode || null,
            thickness: item.thickness || null,
            width: item.width || null,
            length: item.length || null,
            quantity: item.quantity || 1,
            unit: item.unit || 'EA',
            notes: item.notes || null,
          })),
        },
      },
      include: { lines: true },
    });

    req.partnerResourceType = 'RFQ';
    req.partnerResourceId = rfq.id;

    // Dispatch webhook event
    dispatchWebhookEvent('rfq.received', {
      rfqId: rfq.id,
      status: rfq.status,
      lineCount: rfq.lines.length,
    }, [req.partner.id]).catch(console.error);

    res.status(201).json({
      id: rfq.id,
      status: rfq.status,
      lineCount: rfq.lines.length,
      createdAt: rfq.createdAt,
    });
  } catch (error) {
    console.error('Customer RFQ create error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create RFQ' } });
  }
});

// GET /rfqs — List own RFQs
router.get('/rfqs', requireScope('rfq:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    const where = { customerId: req.partner.orgId };
    if (status) where.status = status;

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.rFQ.count({ where }),
    ]);

    res.json({
      data: rfqs.map(rfq => ({
        id: rfq.id,
        status: rfq.status,
        lineCount: rfq.lines.length,
        notes: rfq.notes,
        createdAt: rfq.createdAt,
        updatedAt: rfq.updatedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customer RFQ list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list RFQs' } });
  }
});

// GET /rfqs/:id — RFQ detail
router.get('/rfqs/:id', requireScope('rfq:read'), async (req, res) => {
  try {
    const rfq = await prisma.rFQ.findFirst({
      where: { id: req.params.id, customerId: req.partner.orgId },
      include: { lines: true },
    });

    if (!rfq) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'RFQ not found' } });
    }

    req.partnerResourceType = 'RFQ';
    req.partnerResourceId = rfq.id;

    res.json({
      id: rfq.id,
      status: rfq.status,
      notes: rfq.notes,
      externalRef: rfq.externalRef,
      lines: rfq.lines.map(line => ({
        lineNumber: line.lineNumber,
        productType: line.productType,
        gradeCode: line.gradeCode,
        thickness: line.thickness,
        width: line.width,
        length: line.length,
        quantity: line.quantity,
        unit: line.unit,
        notes: line.notes,
      })),
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
    });
  } catch (error) {
    console.error('Customer RFQ detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get RFQ' } });
  }
});

// ─── Quotes ────────────────────────────────────────────────────────────────────

// GET /quotes — List quotes for this customer
router.get('/quotes', requireScope('quotes:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    const where = { customerId: req.partner.orgId };
    if (status) where.status = status;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      data: quotes.map(q => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        status: q.status,
        totalAmount: q.totalAmount,
        currency: q.currency || 'USD',
        validUntil: q.validUntil,
        lineCount: q.lines.length,
        createdAt: q.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customer quotes list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list quotes' } });
  }
});

// GET /quotes/:id — Quote detail
router.get('/quotes/:id', requireScope('quotes:read'), async (req, res) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, customerId: req.partner.orgId },
      include: { lines: true },
    });

    if (!quote) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Quote not found' } });
    }

    req.partnerResourceType = 'Quote';
    req.partnerResourceId = quote.id;

    res.json({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      totalAmount: quote.totalAmount,
      currency: quote.currency || 'USD',
      validUntil: quote.validUntil,
      lines: quote.lines.map(line => ({
        lineNumber: line.lineNumber,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      createdAt: quote.createdAt,
    });
  } catch (error) {
    console.error('Customer quote detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get quote' } });
  }
});

// POST /quotes/:id/respond — Accept or reject a quote
router.post('/quotes/:id/respond', requireScope('quotes:respond'), async (req, res) => {
  try {
    const { action, poNumber, notes } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'action must be "accept" or "reject"' }
      });
    }

    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, customerId: req.partner.orgId },
    });

    if (!quote) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Quote not found' } });
    }

    if (quote.status !== 'SENT' && quote.status !== 'PENDING') {
      return res.status(409).json({
        error: { code: 'INVALID_STATE', message: `Quote is in ${quote.status} state and cannot be responded to` }
      });
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: newStatus,
        externalRef: poNumber || quote.externalRef,
        notes: notes ? `${quote.notes || ''}\n[Partner API] ${notes}`.trim() : quote.notes,
      },
    });

    req.partnerResourceType = 'Quote';
    req.partnerResourceId = quote.id;

    // If accepted, dispatch event
    if (action === 'accept') {
      dispatchWebhookEvent('order.confirmed', {
        quoteId: quote.id,
        action: 'accepted',
        poNumber,
      }, [req.partner.id]).catch(console.error);
    }

    res.json({
      id: updated.id,
      status: updated.status,
      message: `Quote ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Customer quote respond error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to respond to quote' } });
  }
});

// ─── Orders ────────────────────────────────────────────────────────────────────

// GET /orders — List customer's orders
router.get('/orders', requireScope('orders:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    const where = { buyerOrgId: req.partner.orgId };
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
        type: o.type,
        status: o.status,
        totalAmount: o.totalAmount,
        currency: o.currency || 'USD',
        lineCount: o.lines.length,
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
    console.error('Customer orders list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list orders' } });
  }
});

// GET /orders/:id — Order detail with status
router.get('/orders/:id', requireScope('orders:read'), async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, buyerOrgId: req.partner.orgId },
      include: {
        lines: true,
        shipments: {
          select: {
            id: true,
            status: true,
            carrier: true,
            trackingNumber: true,
            estimatedDelivery: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    req.partnerResourceType = 'Order';
    req.partnerResourceId = order.id;

    res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency || 'USD',
      lines: order.lines.map(line => ({
        lineNumber: line.lineNumber,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        status: line.status,
      })),
      shipments: order.shipments.map(s => ({
        id: s.id,
        status: s.status,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        estimatedDelivery: s.estimatedDelivery,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error('Customer order detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get order' } });
  }
});

// GET /orders/:id/milestones — Production milestones for an order
router.get('/orders/:id/milestones', requireScope('orders:read'), async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, buyerOrgId: req.partner.orgId },
    });

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    // Get jobs linked to this order for production milestones
    const jobs = await prisma.job.findMany({
      where: { orderId: order.id },
      select: {
        id: true,
        jobNumber: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        actualStart: true,
        actualEnd: true,
      },
    });

    req.partnerResourceType = 'Order';
    req.partnerResourceId = order.id;

    // Map job statuses to customer-friendly milestones
    const milestones = [];

    milestones.push({
      milestone: 'ORDER_PLACED',
      status: 'COMPLETED',
      timestamp: order.createdAt,
    });

    if (jobs.length > 0) {
      const allScheduled = jobs.every(j => ['SCHEDULED', 'IN_PROCESS', 'WAITING_QC', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'].includes(j.status));
      const anyInProcess = jobs.some(j => ['IN_PROCESS', 'WAITING_QC'].includes(j.status));
      const allPackaging = jobs.every(j => ['PACKAGING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED'].includes(j.status));
      const allShipped = jobs.every(j => ['SHIPPED', 'COMPLETED'].includes(j.status));
      const allCompleted = jobs.every(j => j.status === 'COMPLETED');

      milestones.push({
        milestone: 'PRODUCTION_SCHEDULED',
        status: allScheduled ? 'COMPLETED' : 'PENDING',
        timestamp: jobs[0]?.scheduledStart || null,
      });

      milestones.push({
        milestone: 'IN_PRODUCTION',
        status: anyInProcess ? 'IN_PROGRESS' : (allPackaging ? 'COMPLETED' : 'PENDING'),
        timestamp: jobs.find(j => j.actualStart)?.actualStart || null,
      });

      milestones.push({
        milestone: 'QUALITY_CHECK',
        status: allPackaging ? 'COMPLETED' : (jobs.some(j => j.status === 'WAITING_QC') ? 'IN_PROGRESS' : 'PENDING'),
      });

      milestones.push({
        milestone: 'READY_TO_SHIP',
        status: allShipped ? 'COMPLETED' : (jobs.some(j => j.status === 'READY_TO_SHIP') ? 'IN_PROGRESS' : 'PENDING'),
      });

      milestones.push({
        milestone: 'SHIPPED',
        status: allShipped ? 'COMPLETED' : 'PENDING',
      });

      milestones.push({
        milestone: 'DELIVERED',
        status: allCompleted ? 'COMPLETED' : 'PENDING',
      });
    }

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      milestones,
    });
  } catch (error) {
    console.error('Customer milestones error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get milestones' } });
  }
});

// ─── Documents ─────────────────────────────────────────────────────────────────

// GET /documents — List documents for this customer
router.get('/documents', requireScope('documents:read'), async (req, res) => {
  try {
    const { type, page = 1, limit = 25 } = req.query;

    const where = { organizationId: req.partner.orgId };
    if (type) where.type = type;

    const [docs, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      data: docs.map(d => ({
        id: d.id,
        type: d.type,
        title: d.title,
        fileName: d.fileName,
        mimeType: d.mimeType,
        createdAt: d.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customer documents list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list documents' } });
  }
});

// GET /documents/:id/download — Download a document
router.get('/documents/:id/download', requireScope('documents:read'), async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, organizationId: req.partner.orgId },
    });

    if (!doc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    req.partnerResourceType = 'Document';
    req.partnerResourceId = doc.id;

    // In production, this would stream from S3/Supabase storage
    res.json({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      fileName: doc.fileName,
      downloadUrl: doc.fileUrl || null,
      message: doc.fileUrl ? 'Use downloadUrl to fetch the file' : 'File not yet available',
    });
  } catch (error) {
    console.error('Customer document download error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get document' } });
  }
});

// ─── Shipments ─────────────────────────────────────────────────────────────────

// GET /shipments — List shipments for this customer
router.get('/shipments', requireScope('shipments:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    // Find orders for this customer first, then their shipments
    const customerOrders = await prisma.order.findMany({
      where: { buyerOrgId: req.partner.orgId },
      select: { id: true },
    });

    const orderIds = customerOrders.map(o => o.id);

    const where = { orderId: { in: orderIds } };
    if (status) where.status = status;

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      data: shipments.map(s => ({
        id: s.id,
        orderId: s.orderId,
        status: s.status,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        estimatedDelivery: s.estimatedDelivery,
        actualDelivery: s.actualDelivery,
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
    console.error('Customer shipments list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list shipments' } });
  }
});

// GET /shipments/:id — Shipment tracking detail
router.get('/shipments/:id', requireScope('shipments:read'), async (req, res) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        stops: true,
        order: { select: { buyerOrgId: true } },
      },
    });

    if (!shipment || shipment.order?.buyerOrgId !== req.partner.orgId) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    }

    req.partnerResourceType = 'Shipment';
    req.partnerResourceId = shipment.id;

    res.json({
      id: shipment.id,
      status: shipment.status,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      itemCount: shipment.items.length,
      stops: shipment.stops.map(stop => ({
        sequence: stop.sequence,
        type: stop.type,
        address: stop.address,
        estimatedArrival: stop.estimatedArrival,
        actualArrival: stop.actualArrival,
      })),
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    });
  } catch (error) {
    console.error('Customer shipment detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment' } });
  }
});

// ─── Invoices (Read-Only) ──────────────────────────────────────────────────────

// GET /invoices — List invoices for this customer
router.get('/invoices', requireScope('invoices:read'), async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    const where = {};
    // Find invoices linked to customer's orders
    const customerOrders = await prisma.order.findMany({
      where: { buyerOrgId: req.partner.orgId },
      select: { id: true },
    });

    const orderIds = customerOrders.map(o => o.id);
    where.orderId = { in: orderIds };
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      data: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orderId: inv.orderId,
        status: inv.status,
        totalAmount: inv.totalAmount,
        currency: inv.currency || 'USD',
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customer invoices list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list invoices' } });
  }
});

export default router;
