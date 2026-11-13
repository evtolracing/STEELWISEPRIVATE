/**
 * Partner webhooks: events this system sends to a partner's address.
 *
 * How an event is kept from being lost (findings B-018, H-002):
 *   1. `queueEvent` writes one delivery row per subscriber. When it is given the transaction
 *      of the business change, the event is saved if and only if the change is saved. Nothing
 *      is sent at this point.
 *   2. `deliverDue` sends what is due. It claims each row first (one conditional update), so
 *      two instances, or a scheduled run and a manual run, never send the same row at the
 *      same moment. A failure is put back with a growing wait. After `maxAttempts` the row is
 *      FAILED and stays on file until someone replays it (`replayDelivery`).
 *   3. Nothing waits in memory. A row that was claimed by an instance that died becomes due
 *      again when its claim runs out.
 *
 * Delivery is at-least-once: a partner can receive the same event twice (for example when
 * their answer is lost). The event id in the body and the `X-SteelWise-Event-Id` header are
 * the same on every attempt, so the receiver can recognise a repeat. One event is queued
 * once per subscriber: the pair (subscriber, event id) is unique in the database.
 */

import crypto from 'crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import prisma from '../lib/db.js';
import { guarded } from '../lib/outbound.js';

// Wait after a failed attempt, by attempt number just made (1-based).
export const RETRY_AFTER_MS = [60_000, 300_000, 1_800_000, 7_200_000];
export const CLAIM_MS = 120_000; // how long one instance may hold a row it is sending
export const SEND_TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS) > 0 ? Number(process.env.WEBHOOK_TIMEOUT_MS) : 10_000;
export const MAX_AGE_MS = (Number(process.env.WEBHOOK_MAX_AGE_HOURS) > 0 ? Number(process.env.WEBHOOK_MAX_AGE_HOURS) : 72) * 3_600_000;
const SEND_TOGETHER = 8; // deliveries in flight at once within one run
const MAX_FAILURES_BEFORE_DISABLE = 5;
const OPEN = ['PENDING', 'RETRYING'];

export const retryDelay = (attemptsMade) => RETRY_AFTER_MS[Math.min(Math.max(attemptsMade, 1), RETRY_AFTER_MS.length) - 1];

// ─── Where an event may be sent ────────────────────────────────────────────────
const isProduction = () => process.env.NODE_ENV === 'production';

export function privateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return privateAddress(v.slice(7));
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb');
  }
  return false;
}

/**
 * Why an address may not receive events, or null. In production an address must be https and
 * must not name this machine or a private network, so a subscription cannot be used to make
 * this server call services that only it can reach.
 */
export function targetProblem(url, { production = isProduction() } = {}) {
  let u;
  try { u = new URL(String(url)); } catch { return 'url must be a valid address'; }
  if (!['http:', 'https:'].includes(u.protocol)) return 'url must start with https://';
  if (u.username || u.password) return 'url must not contain a user name or password';
  if (!production) return null;
  if (u.protocol !== 'https:') return 'Production webhooks must use https';
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || privateAddress(host)) {
    return 'url must be a public address';
  }
  return null;
}

async function resolvesPrivately(url) {
  if (!isProduction()) return false;
  const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) return privateAddress(host);
  const found = await dns.lookup(host, { all: true }).catch(() => []);
  return found.some((a) => privateAddress(a.address));
}

// ─── Signatures ───────────────────────────────────────────────────────────────
const hmac = (secret, text) => crypto.createHmac('sha256', secret).update(text).digest('hex');

/** The signature over the body alone (the original header). */
export function generateSignature(payload, secret) {
  return `sha256=${hmac(secret, typeof payload === 'string' ? payload : JSON.stringify(payload))}`;
}

/** The signature over the send time and the body, so an old captured request cannot be sent again later. */
export const timedSignature = (secret, body, timestamp) => `t=${timestamp},v1=${hmac(secret, `${timestamp}.${body}`)}`;

/** For receivers and tests: true when `header` is a valid timed signature no older than `toleranceSec`. */
export function verifyTimedSignature(secret, body, header, { toleranceSec = 300, now = Date.now() } = {}) {
  const parts = Object.fromEntries(String(header || '').split(',').map((p) => p.split('=')));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v1) return false;
  if (Math.abs(now / 1000 - t) > toleranceSec) return false;
  const expected = hmac(secret, `${t}.${body}`);
  return expected.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

// ─── Who is told ──────────────────────────────────────────────────────────────
/** Active partner accounts of the organisations a business event concerns. */
export async function partnersFor(db, { customerOrgId, carrierOrgId, supplierOrgId } = {}) {
  const OR = [];
  if (customerOrgId) OR.push({ organizationId: customerOrgId, partnerType: { in: ['CUSTOMER', 'STRATEGIC'] } });
  if (carrierOrgId) OR.push({ organizationId: carrierOrgId, partnerType: 'CARRIER' });
  if (supplierOrgId) OR.push({ organizationId: supplierOrgId, partnerType: 'SUPPLIER' });
  if (!OR.length) return [];
  return (await db.partner.findMany({ where: { status: 'ACTIVE', OR }, select: { id: true } })).map((p) => p.id);
}

// ─── Step 1: record the event ─────────────────────────────────────────────────
/**
 * Save one delivery per subscriber of `eventType` among `partnerIds`. Pass the transaction
 * of the business change as `db` so the two are saved together. `eventId` should be the same
 * for the same business fact (for example `shipment.dispatched:<shipment id>`), so a repeat
 * of the same change queues nothing new.
 */
export async function queueEvent(db, eventType, data, { partnerIds = [], eventId, subscriberIds } = {}) {
  if (!partnerIds.length && !subscriberIds?.length) return { eventId: null, queued: 0 };
  const where = { status: 'ACTIVE', ...(subscriberIds?.length ? { id: { in: subscriberIds } } : { partnerId: { in: partnerIds } }) };
  // Event lists are JSON arrays, so the subscription match happens here rather than in SQL.
  const webhooks = (await db.partnerWebhook.findMany({ where, select: { id: true, partnerId: true, events: true } }))
    .filter((w) => subscriberIds?.length || (Array.isArray(w.events) && w.events.includes(eventType)));
  const id = eventId ? `evt_${eventId}` : `evt_${crypto.randomUUID()}`;
  if (!webhooks.length) return { eventId: id, queued: 0 };
  const createdAt = new Date();
  const made = await db.webhookDelivery.createMany({
    data: webhooks.map((w) => ({
      webhookId: w.id, eventType, eventId: id, status: 'PENDING', attempts: 0, nextRetryAt: createdAt,
      payload: { id, type: eventType, created_at: createdAt.toISOString(), data, partner_id: w.partnerId },
    })),
    skipDuplicates: true,
  });
  return { eventId: id, queued: made.count, subscribers: webhooks.length };
}

/**
 * Record a business fact for the partners it concerns, inside the transaction that made it.
 * `key` identifies the fact (the shipment id for a dispatch), so the same fact is recorded once.
 * Returns the number of deliveries queued (0 when no partner subscribes, which is the usual case).
 */
export async function recordBusinessEvent(tx, eventType, key, data, orgs = {}) {
  const partnerIds = await partnersFor(tx, orgs);
  if (!partnerIds.length) return 0;
  const queued = await queueEvent(tx, eventType, data, { partnerIds, eventId: `${eventType}:${key}` });
  return queued.queued;
}

// ─── Step 2: send what is due ─────────────────────────────────────────────────
async function send(delivery, webhook) {
  const body = JSON.stringify(delivery.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  if (targetProblem(webhook.url) || await resolvesPrivately(webhook.url)) {
    return { ok: false, final: true, errorMessage: 'The address is not allowed to receive events' };
  }
  const started = Date.now();
  try {
    const response = await guarded('partner-webhooks', async (signal) => {
      const res = await fetch(webhook.url, {
        method: 'POST',
        redirect: 'manual', // a redirect could point anywhere, so it is a failure
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SteelWise-Webhook/1.0',
          'X-SteelWise-Signature': generateSignature(body, webhook.secret),
          'X-SteelWise-Signature-Timestamp': timedSignature(webhook.secret, body, timestamp),
          'X-SteelWise-Event': delivery.eventType,
          'X-SteelWise-Event-Id': delivery.eventId,
          'X-SteelWise-Delivery': delivery.id,
          'X-SteelWise-Attempt': String(delivery.attempts),
        },
        body,
        signal,
      });
      const text = await res.text().catch(() => '');
      return { status: res.status, ok: res.ok, text };
    }, { timeoutMs: SEND_TIMEOUT_MS, breakerAfter: Number.POSITIVE_INFINITY });
    const base = { httpStatus: response.status, responseBody: response.text.slice(0, 1000), responseTimeMs: Date.now() - started };
    return response.ok ? { ok: true, ...base } : { ok: false, ...base, errorMessage: `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, responseTimeMs: Date.now() - started, errorMessage: error?.kind === 'TIMEOUT' ? `No answer within ${SEND_TIMEOUT_MS / 1000} seconds` : 'The address could not be reached' };
  }
}

async function settle(delivery, webhook, result) {
  const common = { httpStatus: result.httpStatus ?? null, responseBody: result.responseBody ?? null, responseTimeMs: result.responseTimeMs ?? null };
  if (result.ok) {
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { ...common, status: 'DELIVERED', deliveredAt: new Date(), nextRetryAt: null, errorMessage: null } });
    await prisma.partnerWebhook.update({ where: { id: webhook.id }, data: { consecutiveFailures: 0, lastDeliveredAt: new Date() } });
    return 'delivered';
  }
  if (result.final || delivery.attempts >= delivery.maxAttempts) {
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { ...common, status: 'FAILED', nextRetryAt: null, errorMessage: result.errorMessage } });
    const updated = await prisma.partnerWebhook.update({ where: { id: webhook.id }, data: { consecutiveFailures: { increment: 1 }, lastFailedAt: new Date() } });
    if (updated.consecutiveFailures >= MAX_FAILURES_BEFORE_DISABLE && updated.status === 'ACTIVE') {
      await prisma.partnerWebhook.update({ where: { id: webhook.id }, data: { status: 'DISABLED', disabledAt: new Date(), disableReason: `Stopped after ${updated.consecutiveFailures} events in a row could not be delivered` } });
      console.warn(JSON.stringify({ level: 'warn', msg: 'webhook_disabled', webhookId: webhook.id, failures: updated.consecutiveFailures }));
    }
    console.error(JSON.stringify({ level: 'error', msg: 'webhook_dead_letter', deliveryId: delivery.id, eventType: delivery.eventType, eventId: delivery.eventId, attempts: delivery.attempts, reason: result.errorMessage }));
    return 'failed';
  }
  await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { ...common, status: 'RETRYING', errorMessage: result.errorMessage, nextRetryAt: new Date(Date.now() + retryDelay(delivery.attempts)) } });
  return 'retrying';
}

/**
 * Send deliveries that are due. Safe to call from several places at once.
 *   { limit, ids } - `ids` restricts the run to those rows (still only if they are due).
 */
export async function deliverDue({ limit = 25, ids, together = SEND_TOGETHER, budgetMs = Infinity } = {}) {
  const startedAt = Date.now();
  const now = new Date();
  const due = { status: { in: OPEN }, OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] };
  // An event that has waited longer than the limit is not sent on its own: a partner acting on a
  // days-old "dispatched" is worse than a partner asking. It goes to the failed list, where a
  // person can send it again. A run for named rows (a replay) is a person's decision and is sent.
  let expired = 0;
  if (!ids) {
    const old = await prisma.webhookDelivery.updateMany({
      where: { ...due, createdAt: { lt: new Date(now.getTime() - MAX_AGE_MS) } },
      data: { status: 'FAILED', nextRetryAt: null, errorMessage: `Not sent: it waited longer than ${Math.round(MAX_AGE_MS / 3_600_000)} hours. Send it again if the partner still needs it.` },
    });
    expired = old.count;
    if (expired) console.error(JSON.stringify({ level: 'warn', msg: 'webhook_expired', count: expired }));
  }
  const rows = await prisma.webhookDelivery.findMany({
    where: { ...due, ...(ids && { id: { in: ids } }), webhook: { status: 'ACTIVE' } },
    orderBy: { createdAt: 'asc' }, take: Math.min(Math.max(limit, 1), 200), select: { id: true },
  });
  const tally = { due: rows.length, claimed: 0, delivered: 0, retrying: 0, failed: 0, expired, leftForNextRun: 0 };
  // Several are sent at a time, so one slow partner does not hold up the others, and the run
  // stops claiming when its time budget is spent (a host limits how long one call may run).
  let next = 0;
  const worker = async () => {
    for (;;) {
      const row = rows[next]; next += 1;
      if (!row) return;
      if (Date.now() - startedAt > budgetMs) { tally.leftForNextRun += 1; continue; }
      // The claim: only one caller moves the row's due time forward and counts the attempt.
      const claimed = await prisma.webhookDelivery.updateMany({ where: { id: row.id, ...due }, data: { nextRetryAt: new Date(Date.now() + CLAIM_MS), attempts: { increment: 1 }, status: 'RETRYING' } });
      if (claimed.count !== 1) continue;
      tally.claimed += 1;
      const delivery = await prisma.webhookDelivery.findUnique({ where: { id: row.id }, include: { webhook: true } });
      if (!delivery?.webhook) continue;
      let outcome;
      try { outcome = await settle(delivery, delivery.webhook, await send(delivery, delivery.webhook)); }
      catch (error) { console.error(JSON.stringify({ level: 'error', msg: 'webhook_settle_failed', deliveryId: row.id, reason: String(error?.message || error).slice(0, 200) })); continue; }
      tally[outcome] += 1;
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(together, rows.length)) }, worker));
  return tally;
}

/**
 * Start delivery without waiting for it. The rows are already saved, so nothing is lost if this
 * instance stops. One drain runs at a time in an instance: when eighty requests finish in the
 * same second, they share one drain that keeps going until nothing is due, instead of eighty
 * runs all reaching for the same few rows (measured: 12 of 160 events sent, the rest left for
 * the scheduled run).
 */
let draining = false;
let askedAgain = false;
const kickFailed = (error) => console.error(JSON.stringify({ level: 'error', msg: 'webhook_kick_failed', reason: String(error?.message || error).slice(0, 200) }));
export function kick(ids) {
  if (ids?.length) { deliverDue({ ids }).catch(kickFailed); return; }
  if (draining) { askedAgain = true; return; }
  draining = true;
  (async () => {
    try {
      let passes = 0;
      do {
        askedAgain = false;
        let tally;
        do { tally = await deliverDue({ limit: 50 }); passes += 1; } while (tally.claimed > 0 && passes < 40);
      } while (askedAgain && passes < 40);
    } catch (error) { kickFailed(error); } finally { draining = false; }
  })();
}

/** Record an event and try to send it now. Kept for callers that are not inside a transaction. */
export async function dispatchWebhookEvent(eventType, data, partnerIds = [], options = {}) {
  try {
    const queued = await queueEvent(prisma, eventType, data, { partnerIds, ...options });
    if (!queued.queued) return { eventId: queued.eventId, total: 0, succeeded: 0, failed: 0 };
    const rows = await prisma.webhookDelivery.findMany({ where: { eventId: queued.eventId }, select: { id: true } });
    const tally = await deliverDue({ ids: rows.map((r) => r.id) });
    return { eventId: queued.eventId, total: queued.queued, succeeded: tally.delivered, failed: tally.failed, retrying: tally.retrying };
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'webhook_dispatch_failed', eventType, reason: String(error?.message || error).slice(0, 200) }));
    return { error: 'The event could not be recorded' };
  }
}

/** Put a failed (or stuck) delivery back in line. The event id does not change, so the receiver can still recognise it. */
export async function replayDelivery(id, userId = null) {
  const delivery = await prisma.webhookDelivery.findUnique({ where: { id }, include: { webhook: { select: { id: true, status: true, partnerId: true } } } });
  if (!delivery) return { status: 404, error: 'Delivery not found' };
  if (delivery.status === 'DELIVERED') return { status: 409, error: 'This event was already delivered' };
  if (delivery.webhook.status !== 'ACTIVE') return { status: 409, error: `The subscription is ${delivery.webhook.status.toLowerCase()}. Turn it back on first.` };
  const changed = await prisma.webhookDelivery.updateMany({ where: { id, status: delivery.status }, data: { status: 'PENDING', attempts: 0, nextRetryAt: new Date() } });
  if (!changed.count) return { status: 409, error: 'This delivery was just changed. Reload and try again.' };
  await prisma.auditLog.create({ data: { category: 'INTEGRATION', eventType: 'WEBHOOK_REPLAYED', severity: 'INFO', action: 'UPDATE', userId, resourceType: 'WebhookDelivery', resourceId: id, details: { eventType: delivery.eventType, eventId: delivery.eventId, was: delivery.status, attempts: delivery.attempts } } }).catch(() => {});
  const tally = await deliverDue({ ids: [id] });
  return { status: 200, delivery: await prisma.webhookDelivery.findUnique({ where: { id }, select: { id: true, status: true, attempts: true, httpStatus: true, errorMessage: true, nextRetryAt: true, deliveredAt: true } }), tally };
}

/** What is waiting, late or dead, for the health report. */
export async function webhookQueueStats(now = new Date()) {
  const [waiting, late, failed, oldest, disabled] = await Promise.all([
    prisma.webhookDelivery.count({ where: { status: { in: OPEN } } }),
    prisma.webhookDelivery.count({ where: { status: { in: OPEN }, createdAt: { lt: new Date(now.getTime() - 15 * 60_000) } } }),
    prisma.webhookDelivery.count({ where: { status: 'FAILED' } }),
    prisma.webhookDelivery.findFirst({ where: { status: { in: OPEN } }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.partnerWebhook.count({ where: { status: 'DISABLED' } }),
  ]);
  return { waiting, waitingOver15Minutes: late, failed, oldestWaitingMinutes: oldest ? Math.round((now - oldest.createdAt) / 60_000) : 0, subscriptionsStopped: disabled };
}

/** Kept under its old name: sends whatever is due. */
export const processPendingRetries = () => deliverDue({ limit: 100 });

export default { dispatchWebhookEvent, queueEvent, deliverDue, kick, replayDelivery, generateSignature, processPendingRetries };
