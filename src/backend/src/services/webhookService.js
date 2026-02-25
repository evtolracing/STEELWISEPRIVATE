/**
 * Webhook Service
 * Handles webhook event dispatch, HMAC signing, delivery tracking, and retry logic.
 */

import crypto from 'crypto';
import prisma from '../lib/db.js';

// Retry intervals in milliseconds
const RETRY_INTERVALS = [
  0,            // Attempt 1: immediate
  60_000,       // Attempt 2: 1 minute
  300_000,      // Attempt 3: 5 minutes
  1_800_000,    // Attempt 4: 30 minutes
  7_200_000,    // Attempt 5: 2 hours
];

const MAX_FAILURES_BEFORE_DISABLE = 5;

// ─── Dispatch Event to All Matching Webhooks ───────────────────────────────────
export async function dispatchWebhookEvent(eventType, data, partnerIds = []) {
  try {
    // Find all active webhooks subscribed to this event type
    const whereClause = {
      status: 'ACTIVE',
      events: { has: eventType },
    };

    if (partnerIds.length > 0) {
      whereClause.partnerId = { in: partnerIds };
    }

    const webhooks = await prisma.partnerWebhook.findMany({
      where: whereClause,
      include: { partner: true },
    });

    if (webhooks.length === 0) return;

    const eventId = `evt_${crypto.randomUUID()}`;

    // Create delivery records and dispatch
    const deliveries = await Promise.allSettled(
      webhooks.map(webhook => createAndDeliver(webhook, eventType, eventId, data))
    );

    const succeeded = deliveries.filter(d => d.status === 'fulfilled').length;
    const failed = deliveries.filter(d => d.status === 'rejected').length;

    console.log(`📡 Webhook ${eventType}: ${succeeded} delivered, ${failed} failed out of ${webhooks.length} subscribers`);

    return { eventId, total: webhooks.length, succeeded, failed };
  } catch (error) {
    console.error('Webhook dispatch error:', error);
    return { error: error.message };
  }
}

// ─── Create Delivery Record and Attempt Delivery ──────────────────────────────
async function createAndDeliver(webhook, eventType, eventId, data) {
  const payload = {
    id: eventId,
    type: eventType,
    created_at: new Date().toISOString(),
    data,
    partner_id: webhook.partnerId,
  };

  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      eventType,
      eventId,
      payload,
      status: 'PENDING',
      attempts: 0,
    },
  });

  // Attempt immediate delivery
  await attemptDelivery(delivery.id, webhook, payload);

  return delivery;
}

// ─── Attempt Delivery ─────────────────────────────────────────────────────────
async function attemptDelivery(deliveryId, webhook, payload) {
  const delivery = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.status === 'DELIVERED') return;

  const attempt = delivery.attempts + 1;
  const payloadString = JSON.stringify(payload);

  // HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(payloadString)
    .digest('hex');

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SteelWise-Signature': `sha256=${signature}`,
        'X-SteelWise-Event': payload.type,
        'X-SteelWise-Delivery': deliveryId,
        'User-Agent': 'SteelWise-Webhook/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const responseTimeMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => '');

    if (response.ok) {
      // Success
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          attempts: attempt,
          httpStatus: response.status,
          responseBody: responseBody.substring(0, 1000),
          responseTimeMs,
          deliveredAt: new Date(),
        },
      });

      // Reset webhook failure counter
      await prisma.partnerWebhook.update({
        where: { id: webhook.id },
        data: {
          consecutiveFailures: 0,
          lastDeliveredAt: new Date(),
        },
      });
    } else {
      // HTTP error
      await handleDeliveryFailure(deliveryId, webhook, attempt, {
        httpStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        responseTimeMs,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      });
    }
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    await handleDeliveryFailure(deliveryId, webhook, attempt, {
      responseTimeMs,
      errorMessage: error.message || 'Network error',
    });
  }
}

// ─── Handle Failed Delivery ───────────────────────────────────────────────────
async function handleDeliveryFailure(deliveryId, webhook, attempt, details) {
  const delivery = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return;

  const maxAttempts = delivery.maxAttempts;

  if (attempt >= maxAttempts) {
    // Final failure
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED',
        attempts: attempt,
        httpStatus: details.httpStatus || null,
        responseBody: details.responseBody || null,
        responseTimeMs: details.responseTimeMs || null,
        errorMessage: details.errorMessage,
      },
    });

    // Increment webhook failure counter
    const updated = await prisma.partnerWebhook.update({
      where: { id: webhook.id },
      data: {
        consecutiveFailures: { increment: 1 },
        lastFailedAt: new Date(),
      },
    });

    // Auto-disable if too many failures
    if (updated.consecutiveFailures >= MAX_FAILURES_BEFORE_DISABLE) {
      await prisma.partnerWebhook.update({
        where: { id: webhook.id },
        data: {
          status: 'DISABLED',
          disabledAt: new Date(),
          disableReason: `Auto-disabled after ${updated.consecutiveFailures} consecutive failures`,
        },
      });
      console.warn(`⚠️ Webhook ${webhook.id} auto-disabled after ${updated.consecutiveFailures} failures`);
    }
  } else {
    // Schedule retry
    const nextRetryDelay = RETRY_INTERVALS[attempt] || RETRY_INTERVALS[RETRY_INTERVALS.length - 1];
    const nextRetryAt = new Date(Date.now() + nextRetryDelay);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'RETRYING',
        attempts: attempt,
        httpStatus: details.httpStatus || null,
        responseBody: details.responseBody || null,
        responseTimeMs: details.responseTimeMs || null,
        errorMessage: details.errorMessage,
        nextRetryAt,
      },
    });

    // Schedule retry (in-process for simplicity; production would use a queue)
    setTimeout(async () => {
      try {
        const freshWebhook = await prisma.partnerWebhook.findUnique({ where: { id: webhook.id } });
        if (freshWebhook && freshWebhook.status === 'ACTIVE') {
          const freshDelivery = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
          if (freshDelivery) {
            await attemptDelivery(deliveryId, freshWebhook, freshDelivery.payload);
          }
        }
      } catch (error) {
        console.error(`Webhook retry failed for delivery ${deliveryId}:`, error.message);
      }
    }, nextRetryDelay);
  }
}

// ─── Verify Webhook Signature (utility for partners to verify our webhooks) ───
export function generateSignature(payload, secret) {
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
}

// ─── Process Pending Retries (call on server startup) ─────────────────────────
export async function processPendingRetries() {
  try {
    const pending = await prisma.webhookDelivery.findMany({
      where: {
        status: 'RETRYING',
        nextRetryAt: { lte: new Date() },
      },
      include: {
        webhook: true,
      },
      take: 100,
    });

    for (const delivery of pending) {
      if (delivery.webhook.status === 'ACTIVE') {
        await attemptDelivery(delivery.id, delivery.webhook, delivery.payload);
      }
    }

    if (pending.length > 0) {
      console.log(`📡 Processed ${pending.length} pending webhook retries`);
    }
  } catch (error) {
    console.error('Failed to process pending retries:', error);
  }
}

export default { dispatchWebhookEvent, generateSignature, processPendingRetries };
