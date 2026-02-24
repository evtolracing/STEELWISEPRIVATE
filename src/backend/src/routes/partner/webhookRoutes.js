/**
 * Partner Webhook Management Routes
 * Self-service webhook subscription management for partners.
 * 
 * Mount: /api/v1/partner/webhooks
 */

import { Router } from 'express';
import prisma from '../../lib/db.js';
import crypto from 'crypto';
import { partnerAuth } from '../../middleware/partnerAuth.js';
import { partnerRateLimit, loadPartnerTier } from '../../middleware/partnerRateLimit.js';

const router = Router();

// Apply partner middleware stack
router.use(partnerAuth());
router.use(loadPartnerTier());
router.use(partnerRateLimit());

// Allowed events per partner type
const EVENTS_BY_TYPE = {
  CUSTOMER: [
    'rfq.received', 'quote.available', 'quote.expiring',
    'order.confirmed', 'order.status_changed', 'order.delayed',
    'shipment.dispatched', 'shipment.delivered', 'shipment.exception',
    'document.available', 'invoice.issued',
  ],
  SUPPLIER: [
    'po.issued', 'scar.issued', 'document.available',
    'order.confirmed',
  ],
  CARRIER: [
    'shipment.dispatched', 'shipment.delivered', 'shipment.exception',
  ],
  STRATEGIC: [
    'rfq.received', 'quote.available', 'quote.expiring',
    'order.confirmed', 'order.status_changed', 'order.delayed',
    'shipment.dispatched', 'shipment.delivered', 'shipment.exception',
    'document.available', 'invoice.issued',
    'po.issued',
  ],
};

// GET / — List webhook subscriptions
router.get('/', async (req, res) => {
  try {
    const webhooks = await prisma.partnerWebhook.findMany({
      where: { partnerId: req.partner.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: webhooks.map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        status: w.status,
        consecutiveFailures: w.consecutiveFailures,
        lastDeliveredAt: w.lastDeliveredAt,
        lastFailedAt: w.lastFailedAt,
        createdAt: w.createdAt,
      })),
      availableEvents: EVENTS_BY_TYPE[req.partner.type] || [],
    });
  } catch (error) {
    console.error('Webhook list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list webhooks' } });
  }
});

// POST / — Create webhook subscription
router.post('/', async (req, res) => {
  try {
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'url and events array are required' }
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'url must be a valid URL' }
      });
    }

    // Only allow HTTPS in production
    if (req.partner.environment === 'production' && !url.startsWith('https://')) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Production webhooks must use HTTPS' }
      });
    }

    // Validate events for partner type
    const allowedEvents = EVENTS_BY_TYPE[req.partner.type] || [];
    const invalidEvents = events.filter(e => !allowedEvents.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid events for ${req.partner.type}: ${invalidEvents.join(', ')}`,
          allowedEvents,
        }
      });
    }

    // Max 10 webhooks per partner
    const count = await prisma.partnerWebhook.count({
      where: { partnerId: req.partner.id },
    });
    if (count >= 10) {
      return res.status(400).json({
        error: { code: 'LIMIT_REACHED', message: 'Maximum 10 webhook subscriptions per partner' }
      });
    }

    const webhookSecret = secret || `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = await prisma.partnerWebhook.create({
      data: {
        partnerId: req.partner.id,
        url,
        secret: webhookSecret,
        events,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhookSecret, // Only shown once at creation
      status: webhook.status,
      createdAt: webhook.createdAt,
      note: 'Save the secret — it will not be shown again.',
    });
  } catch (error) {
    console.error('Webhook create error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create webhook' } });
  }
});

// PUT /:id — Update webhook subscription
router.put('/:id', async (req, res) => {
  try {
    const { url, events, status } = req.body;

    const webhook = await prisma.partnerWebhook.findFirst({
      where: { id: req.params.id, partnerId: req.partner.id },
    });

    if (!webhook) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } });
    }

    const updateData = {};

    if (url) {
      try { new URL(url); } catch { return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid URL' } }); }
      updateData.url = url;
    }

    if (events) {
      const allowedEvents = EVENTS_BY_TYPE[req.partner.type] || [];
      const invalidEvents = events.filter(e => !allowedEvents.includes(e));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: `Invalid events: ${invalidEvents.join(', ')}` }
        });
      }
      updateData.events = events;
    }

    if (status && ['ACTIVE', 'PAUSED'].includes(status)) {
      updateData.status = status;
      if (status === 'ACTIVE') {
        updateData.consecutiveFailures = 0;
        updateData.disabledAt = null;
        updateData.disableReason = null;
      }
    }

    const updated = await prisma.partnerWebhook.update({
      where: { id: webhook.id },
      data: updateData,
    });

    res.json({
      id: updated.id,
      url: updated.url,
      events: updated.events,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Webhook update error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update webhook' } });
  }
});

// DELETE /:id — Delete webhook subscription
router.delete('/:id', async (req, res) => {
  try {
    const webhook = await prisma.partnerWebhook.findFirst({
      where: { id: req.params.id, partnerId: req.partner.id },
    });

    if (!webhook) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } });
    }

    await prisma.partnerWebhook.delete({ where: { id: webhook.id } });

    res.json({ message: 'Webhook deleted', id: webhook.id });
  } catch (error) {
    console.error('Webhook delete error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete webhook' } });
  }
});

// GET /:id/deliveries — View delivery history for a webhook
router.get('/:id/deliveries', async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;

    const webhook = await prisma.partnerWebhook.findFirst({
      where: { id: req.params.id, partnerId: req.partner.id },
    });

    if (!webhook) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } });
    }

    const where = { webhookId: webhook.id };
    if (status) where.status = status;

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    res.json({
      data: deliveries.map(d => ({
        id: d.id,
        eventType: d.eventType,
        eventId: d.eventId,
        status: d.status,
        attempts: d.attempts,
        httpStatus: d.httpStatus,
        responseTimeMs: d.responseTimeMs,
        errorMessage: d.errorMessage,
        deliveredAt: d.deliveredAt,
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
    console.error('Webhook deliveries list error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list deliveries' } });
  }
});

// POST /:id/test — Send a test event
router.post('/:id/test', async (req, res) => {
  try {
    const webhook = await prisma.partnerWebhook.findFirst({
      where: { id: req.params.id, partnerId: req.partner.id },
    });

    if (!webhook) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } });
    }

    // Import webhook service dynamically to avoid circular deps
    const { dispatchWebhookEvent } = await import('../../services/webhookService.js');

    const result = await dispatchWebhookEvent('test.ping', {
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString(),
    }, [req.partner.id]);

    res.json({
      message: 'Test event dispatched',
      ...result,
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to send test' } });
  }
});

export default router;
