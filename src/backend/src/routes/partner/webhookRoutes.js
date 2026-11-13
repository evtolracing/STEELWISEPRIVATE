/**
 * Partner Webhook Management Routes
 * Self-service webhook subscription management for partners.
 * 
 * Mount: /api/v1/partner/webhooks
 */

import { Router } from 'express';
import prisma from '../../lib/db.js';
import crypto from 'crypto';
import { partnerStack } from './common.js';
import { targetProblem, queueEvent, deliverDue, replayDelivery } from '../../services/webhookService.js';

const router = Router();

// Apply partner middleware stack
router.use(...partnerStack());

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

    // The address must be one this server is allowed to call (https and public, in production).
    const problem = targetProblem(url, req.partner.environment === 'production' ? { production: true } : {});
    if (problem) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: problem } });
    }
    if (secret !== undefined && (typeof secret !== 'string' || secret.length < 16 || secret.length > 200)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'secret must be 16 to 200 characters. Leave it out to have one made.' } });
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
      const problem = targetProblem(url, req.partner.environment === 'production' ? { production: true } : {});
      if (problem) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: problem } });
      updateData.url = url;
    }

    if (events) {
      if (!Array.isArray(events) || !events.length) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'events must be a list with at least one event' } });
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
    const { status } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    if (status && !['PENDING', 'DELIVERED', 'FAILED', 'RETRYING'].includes(status)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'status must be one of: PENDING, DELIVERED, FAILED, RETRYING' } });
    }

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
        take: limit,
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
        nextRetryAt: d.nextRetryAt,
        deliveredAt: d.deliveredAt,
        createdAt: d.createdAt,
      })),
      pagination: {
        page,
        limit,
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

    if (webhook.status !== 'ACTIVE') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: `This subscription is ${webhook.status.toLowerCase()}` } });
    }
    // A test goes to this one subscription, whatever events it subscribes to.
    const queued = await queueEvent(prisma, 'test.ping', { message: 'This is a test webhook delivery', timestamp: new Date().toISOString() }, { subscriberIds: [webhook.id] });
    const rows = await prisma.webhookDelivery.findMany({ where: { eventId: queued.eventId, webhookId: webhook.id }, select: { id: true } });
    const tally = await deliverDue({ ids: rows.map((r) => r.id) });
    const delivery = rows[0] ? await prisma.webhookDelivery.findUnique({ where: { id: rows[0].id }, select: { id: true, status: true, httpStatus: true, errorMessage: true, responseTimeMs: true } }) : null;

    res.json({ message: tally.delivered ? 'Test event delivered' : 'Test event was not delivered', eventId: queued.eventId, delivered: tally.delivered === 1, delivery });
  } catch (error) {
    console.error('Webhook test error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to send test' } });
  }
});

// POST /:id/deliveries/:deliveryId/replay — Send a failed event again
router.post('/:id/deliveries/:deliveryId/replay', async (req, res) => {
  try {
    const delivery = await prisma.webhookDelivery.findFirst({
      where: { id: req.params.deliveryId, webhookId: req.params.id, webhook: { partnerId: req.partner.id } },
      select: { id: true },
    });
    if (!delivery) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
    }
    const result = await replayDelivery(delivery.id, null);
    if (result.status !== 200) {
      return res.status(result.status).json({ error: { code: 'CONFLICT', message: result.error } });
    }
    res.json({ message: 'Delivery sent again', delivery: result.delivery });
  } catch (error) {
    console.error('Webhook replay error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to replay delivery' } });
  }
});

export default router;
