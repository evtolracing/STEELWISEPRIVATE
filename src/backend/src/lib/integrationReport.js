/**
 * The integration report: what this system talks to, whether each link is set up and
 * answering, what is waiting to be sent, and where two modules disagree and someone has to act.
 *
 * It reads; it changes nothing. It never returns a key, a secret or a partner's address.
 */
import { Prisma } from '@prisma/client';
import prisma from './db.js';
import { outboundStats } from './outbound.js';
import { webhookQueueStats } from '../services/webhookService.js';
import { getSetting } from './settings.js';

const has = (name) => Boolean(process.env[name] && !/your_.*_here|^changeme$/i.test(process.env[name]));

/** Every link to something outside the server, with an honest state. */
export function integrationList() {
  const ai = ['DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'].filter(has).length;
  return [
    { id: 'INT-01', name: 'Database (Postgres)', kind: 'required', configured: has('DATABASE_URL'), state: has('DATABASE_URL') ? 'IN USE' : 'NOT SET UP', ifDown: 'Nothing works. Every request answers 503 or 500.' },
    { id: 'INT-02', name: 'File storage for documents', kind: 'required for documents', configured: true, state: 'IN USE', ifDown: 'Documents cannot be uploaded or opened. Everything else works.' },
    { id: 'INT-03', name: 'AI assistant providers', kind: 'optional', configured: ai > 0, state: ai > 0 ? 'SET UP' : 'NOT SET UP', providersSetUp: ai, ifDown: 'The assistant answers that it is not available. No order, stock or money function depends on it.' },
    { id: 'INT-04', name: 'Speech (read aloud)', kind: 'optional', configured: has('ELEVENLABS_API_KEY'), state: has('ELEVENLABS_API_KEY') ? 'SET UP' : 'NOT SET UP', ifDown: 'Read-aloud does not play. Nothing else is affected.' },
    { id: 'INT-05', name: 'Partner API (customers, suppliers, carriers calling in)', kind: 'optional', configured: has('PARTNER_JWT_SECRET') || process.env.NODE_ENV !== 'production', state: 'AVAILABLE', ifDown: 'Partners cannot read or send. Staff screens are not affected.' },
    { id: 'INT-06', name: 'Partner webhooks (events sent out)', kind: 'optional', configured: true, state: 'AVAILABLE', ifDown: 'Events wait in the database and are sent when delivery runs again. None is lost.' },
    { id: 'INT-07', name: 'Scheduled run (sends waiting events, clears old request keys)', kind: 'recommended', configured: has('CRON_SECRET') || has('TASKS_SECRET'), state: has('CRON_SECRET') || has('TASKS_SECRET') ? 'SET UP' : 'NOT SET UP', ifDown: 'A failed event is sent again only when someone presses Run now, or when the next event goes out.' },
    { id: 'INT-08', name: 'Email', kind: 'not connected', configured: false, state: 'NOT CONNECTED', ifDown: 'Nothing is emailed by this system. Screens say so where a message would be expected.' },
    { id: 'INT-09', name: 'Text messages', kind: 'not connected', configured: false, state: 'NOT CONNECTED', ifDown: 'No text message is sent by this system.' },
    { id: 'INT-10', name: 'Card payments', kind: 'not connected', configured: false, state: 'NOT CONNECTED', ifDown: 'Payments are recorded by staff. No card is charged by this system.' },
    { id: 'INT-11', name: 'Carrier rates and labels', kind: 'not connected', configured: false, state: 'NOT CONNECTED', ifDown: 'Carrier, rate and tracking are typed in by staff.' },
    { id: 'INT-12', name: 'Sales tax service', kind: 'not connected', configured: false, state: 'NOT CONNECTED', ifDown: 'Tax comes from the tax rates kept in this system.' },
    { id: 'INT-13', name: 'Accounting system', kind: 'not connected', configured: false, state: 'NOT CONNECTED', ifDown: 'Invoices and payments stay in this system. Nothing is posted elsewhere.' },
  ];
}

/** Shipped quantity that is on no invoice: the one place where shipping and billing can part ways. */
export async function shippedNotInvoiced(limit = 25) {
  const open = Prisma.sql`
      FROM "OrderLine" l
      JOIN "Order" o ON o."id" = l."orderId" AND o."orderType" = 'SO'
      LEFT JOIN (
        SELECT il."orderLineId", SUM(il."quantity") AS q
          FROM "InvoiceLine" il JOIN "Invoice" i ON i."id" = il."invoiceId"
         WHERE i."kind" = 'INVOICE' AND i."status" <> 'CANCELLED' AND il."orderLineId" IS NOT NULL
         GROUP BY il."orderLineId"
      ) b ON b."orderLineId" = l."id"
     WHERE l."qtyShipped" - COALESCE(b.q, 0) > 0.000001`;
  const [rows, [{ n }]] = await Promise.all([
    // Newest first: a gap that opened today is the one someone can still close today.
    prisma.$queryRaw(Prisma.sql`
      SELECT o."id" AS "orderId", o."orderNumber", o."locationId", COUNT(*)::int AS "lines",
             SUM(l."qtyShipped" - COALESCE(b.q, 0))::float AS "quantityNotInvoiced", MAX(o."updatedAt") AS "lastChanged"
      ${open}
       GROUP BY o."id", o."orderNumber", o."locationId"
       ORDER BY MAX(o."updatedAt") DESC
       LIMIT ${limit}`),
    prisma.$queryRaw(Prisma.sql`SELECT COUNT(DISTINCT o."id")::int AS n ${open}`),
  ]);
  return { count: n, shown: rows.length, orders: rows };
}

/** Returns that came back and whose credit memo could not be issued, until a manager settles each (Phase 8, N-016). */
export async function creditsNotIssued(limit = 25) {
  const rows = await prisma.auditLog.findMany({ where: { eventType: { in: ['CREDIT_NOT_ISSUED', 'CREDIT_NOT_ISSUED_SETTLED'] }, resourceType: 'Order' }, orderBy: { timestamp: 'desc' }, take: 2000, select: { eventType: true, resourceId: true, timestamp: true, details: true } });
  const settled = new Set(rows.filter((r) => r.eventType === 'CREDIT_NOT_ISSUED_SETTLED').map((r) => r.resourceId));
  const open = new Map();
  for (const r of rows) if (r.eventType === 'CREDIT_NOT_ISSUED' && !settled.has(r.resourceId) && !open.has(r.resourceId)) open.set(r.resourceId, { returnId: r.resourceId, returnNumber: r.details?.returnNumber || null, since: r.timestamp, reason: r.details?.reason || null });
  return { count: open.size, shown: Math.min(open.size, limit), returns: [...open.values()].slice(0, limit) };
}

export async function integrationReport() {
  const now = new Date();
  const [queue, deadLetters, unbilled, stuckKeys, notRaised, lastRun, uncredited] = await Promise.all([
    webhookQueueStats(now),
    prisma.webhookDelivery.findMany({ where: { status: 'FAILED' }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, eventType: true, eventId: true, attempts: true, httpStatus: true, errorMessage: true, createdAt: true, webhookId: true } }),
    shippedNotInvoiced(),
    prisma.requestKey.count({ where: { status: 'IN_PROGRESS', createdAt: { lt: new Date(now.getTime() - 5 * 60_000) } } }),
    prisma.auditLog.count({ where: { eventType: 'INVOICE_NOT_RAISED', timestamp: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60_000) } } }),
    getSetting('tasks.lastRun').catch(() => null),
    creditsNotIssued(),
  ]);
  const needsAction = [];
  if (unbilled.orders.length) needsAction.push({ what: 'Shipped but not invoiced', count: unbilled.count, do: 'Open each order and raise its invoice from the invoices page.' });
  if (uncredited.count) needsAction.push({ what: 'Returns received without their credit', count: uncredited.count, do: 'A manager opens each return and issues the credit, or records how it was settled.' });
  if (queue.failed) needsAction.push({ what: 'Partner events that could not be delivered', count: queue.failed, do: 'Check the partner\'s address, then send each one again.' });
  if (queue.subscriptionsStopped) needsAction.push({ what: 'Partner subscriptions stopped after repeated failures', count: queue.subscriptionsStopped, do: 'Ask the partner to fix their address and turn the subscription back on.' });
  if (queue.waitingOver15Minutes) needsAction.push({ what: 'Partner events waiting more than 15 minutes', count: queue.waitingOver15Minutes, do: 'Press Run now. If this keeps happening, the scheduled run is not set up.' });
  if (stuckKeys) needsAction.push({ what: 'Requests that started and never answered', count: stuckKeys, do: 'No action: each is released when the same request is sent again. A rising number means the server is being stopped mid-request.' });
  return {
    generatedAt: now.toISOString(),
    integrations: integrationList(),
    outsideCalls: outboundStats(now.getTime()),
    outsideCallsNote: 'Counted by this server instance since it started. Another instance keeps its own counts.',
    webhooks: { ...queue, recentFailed: deadLetters },
    shippedNotInvoiced: unbilled,
    invoicesNotRaisedAtDispatchLast30Days: notRaised,
    returnsReceivedWithoutCredit: uncredited,
    requestsNeverAnswered: stuckKeys,
    scheduledRun: { setUp: Boolean(process.env.CRON_SECRET || process.env.TASKS_SECRET), lastRun: lastRun || null },
    needsAction,
  };
}

/** The periodic work. Safe to run from several places at once. */
export async function runTasks({ by = 'schedule' } = {}) {
  const { deliverDue } = await import('../services/webhookService.js');
  const { putSetting } = await import('./settings.js');
  const started = Date.now();
  // At most 100 events and about 20 seconds per call, so the call fits inside a host's time limit.
  const webhooks = await deliverDue({ limit: 100, budgetMs: 20_000 });
  const oldKeys = await prisma.requestKey.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } });
  // Each failing system check raises its alert (Y-010). An alert already raised in the last 15 minutes is not repeated.
  const { systemChecks } = await import('./opsChecks.js');
  const { raiseAlert } = await import('./alerts.js');
  const health = await systemChecks();
  const alerts = [];
  for (const c of health.checks.filter((x) => !x.ok && x.key !== 'scheduled run on time')) alerts.push(await raiseAlert(c.alert, { check: c.key, count: c.count, detail: c.detail }, { key: c.key }));
  const result = { at: new Date().toISOString(), by, ms: Date.now() - started, webhooks, requestKeysCleared: oldKeys.count, checksFailing: health.checks.filter((x) => !x.ok).map((x) => x.key), alertsRaised: alerts.filter((a) => a.stored).length };
  await putSetting('tasks.lastRun', result).catch(() => {});
  return result;
}
