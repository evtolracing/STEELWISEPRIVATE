/**
 * System checks (Phase 10, Y-010): the conditions that must raise an alert, read from the database.
 *
 * Each check answers ok or not, with a count and one sentence. Nothing is corrected here: a check only
 * reads. systemChecks() is used by:
 *   - GET /api/admin/integrations/checks  (company administrators: every check, with counts and recent alerts);
 *   - GET /api/health/ready                (anyone: ready or not, and the names of failing checks, no counts);
 *   - the scheduled run, which raises an alert for each failing check (lib/integrationReport.js runTasks).
 */
import prisma from './db.js';
import { getSetting } from './settings.js';

const tablesMissing = (e) => e?.code === 'P2021' || /does not exist/i.test(String(e?.message));
const SCHEDULE_LATE_MINUTES = Number(process.env.SCHEDULE_LATE_MINUTES) || 30;
// A shipment's invoice is raised a moment after it leaves; this long without one means it was not (Y-021).
const UNBILLED_MINUTES = Number(process.env.SHIPPED_NOT_INVOICED_MINUTES ?? 15);

async function count(sql, ...params) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return Number(rows[0]?.n || 0);
}

/** Runs every check. A check that cannot run is reported as such, never as passing. */
export async function systemChecks({ now = new Date() } = {}) {
  const checks = [];
  const add = async (key, alert, fn) => {
    try {
      const r = await fn();
      checks.push({ key, alert, ok: r.ok, count: r.count ?? null, detail: r.detail || null, ...(r.notInstalled && { notInstalled: true }) });
    } catch (error) {
      checks.push({ key, alert, ok: false, count: null, detail: `This check could not run: ${String(error?.message || error).split('\n').pop().slice(0, 160)}` });
    }
  };

  await add('database', 'DATABASE_UNREACHABLE', async () => {
    await Promise.race([prisma.$queryRaw`SELECT 1`, new Promise((_, no) => setTimeout(() => no(new Error('no answer within 5 seconds')), 5000))]);
    return { ok: true };
  });

  await add('stock balances add up', 'INVENTORY_BALANCE_BROKEN', async () => {
    const n = await count(`SELECT count(*)::int AS n FROM "Inventory" WHERE abs("qtyOnHand" - ("qtyAvailable"+"qtyAllocated"+"qtyOnHold"+"qtyInTransit")) > 0.0001 OR "qtyOnHand" < 0 OR "qtyAvailable" < 0`);
    return { ok: n === 0, count: n, detail: n ? `${n} stock rows whose quantities do not add up or are below zero.` : null };
  });

  // The ledger checks: each is "not installed" on a database without file 16, which is not a failure.
  const ledger = async (fn) => { try { return await fn(); } catch (e) { if (tablesMissing(e)) return { ok: true, notInstalled: true, detail: 'The ledger is not installed on this database.' }; throw e; } };

  await add('posted journal entries balance', 'LEDGER_UNBALANCED_ATTEMPT', () => ledger(async () => {
    const n = await count(`SELECT count(*)::int AS n FROM (SELECT e.id FROM "JournalEntry" e JOIN "JournalLine" l ON l."entryId" = e.id WHERE e.status IN ('POSTED','REVERSED') GROUP BY e.id HAVING sum(l.debit) <> sum(l.credit) OR sum(l.debit) <> max(e."totalDebit")) x`);
    return { ok: n === 0, count: n, detail: n ? `${n} posted entries do not balance. The database should make this impossible: treat it as a security incident.` : null };
  }));

  await add('ledger postings that failed', 'LEDGER_POSTING_FAILED', () => ledger(async () => {
    const n = await count(`SELECT count(*)::int AS n FROM "LedgerEvent" WHERE status = 'FAILED'`);
    return { ok: n === 0, count: n, detail: n ? `${n} business events could not be posted. Finance, Not posted lists each with its reason.` : null };
  }));

  await add('ledger events waiting for a person', 'LEDGER_EVENTS_WAITING', () => ledger(async () => {
    const n = await count(`SELECT count(*)::int AS n FROM "LedgerEvent" WHERE status IN ('RECONCILIATION_REQUIRED','PENDING') AND "updatedAt" < $1`, new Date(now.getTime() - 24 * 3600_000));
    return { ok: n === 0, count: n, detail: n ? `${n} ledger events have waited more than a day for a person (a cost, an account, a month reopened).` : null };
  }));

  await add('last reconciliation found no difference', 'LEDGER_RECONCILIATION_DIFFERENCE', () => ledger(async () => {
    const last = await prisma.ledgerReconciliation.findFirst({ orderBy: { asOf: 'desc' }, select: { asOf: true, passed: true, checks: true } });
    if (!last) return { ok: true, detail: 'No reconciliation has been run.' };
    const diff = (Array.isArray(last.checks) ? last.checks : []).filter((c) => c.status === 'DIFFERENCE').map((c) => c.key);
    return { ok: diff.length === 0, count: diff.length, detail: diff.length ? `The reconciliation of ${last.asOf.toISOString().slice(0, 16)} found differences in: ${diff.join(', ')}.` : null };
  }));

  await add('partner events delivered', 'WEBHOOK_DEAD_LETTER', async () => {
    const n = await prisma.webhookDelivery.count({ where: { status: 'FAILED' } });
    return { ok: n === 0, count: n, detail: n ? `${n} partner events could not be delivered and wait to be sent again.` : null };
  });

  await add('scheduled run on time', 'SCHEDULED_RUN_LATE', async () => {
    const setUp = Boolean(process.env.CRON_SECRET || process.env.TASKS_SECRET);
    if (!setUp) return { ok: true, detail: 'No scheduled run is set up on this server (B-019).' };
    const last = await getSetting('tasks.lastRun').catch(() => null);
    const at = last?.at ? new Date(last.at) : null;
    const late = !at || now.getTime() - at.getTime() > SCHEDULE_LATE_MINUTES * 60_000;
    return { ok: !late, detail: late ? `The scheduled run last ran ${at ? at.toISOString().slice(0, 16) : 'never'}; it should run at least every ${SCHEDULE_LATE_MINUTES} minutes.` : null };
  });

  // Dispatch and billing are two saves (H-006): a server stopped between them leaves goods shipped
  // with no invoice. The integrations report lists them at once; this check raises an alert when one
  // has waited longer than the moment billing takes (Phase 10, Y-021).
  await add('shipped goods invoiced', 'SHIPPED_NOT_INVOICED', async () => {
    const n = await count(`SELECT count(DISTINCT o.id)::int AS n
        FROM "OrderLine" l JOIN "Order" o ON o.id = l."orderId" AND o."orderType" = 'SO'
        LEFT JOIN (SELECT il."orderLineId", SUM(il.quantity) AS q FROM "InvoiceLine" il JOIN "Invoice" i ON i.id = il."invoiceId"
                    WHERE i.kind = 'INVOICE' AND i.status <> 'CANCELLED' AND il."orderLineId" IS NOT NULL GROUP BY il."orderLineId") b ON b."orderLineId" = l.id
       WHERE l."qtyShipped" - COALESCE(b.q, 0) > 0.000001 AND o."updatedAt" < $1`, new Date(now.getTime() - UNBILLED_MINUTES * 60_000));
    return { ok: n === 0, count: n, detail: n ? `${n} orders have goods shipped more than ${UNBILLED_MINUTES} minutes ago with no invoice. The integrations report lists them; raise each invoice from the order.` : null };
  });

  await add('logins paused now', 'LOGIN_LOCKED', async () => {
    const n = await prisma.user.count({ where: { lockedUntil: { gt: now } } });
    return { ok: n === 0, count: n, detail: n ? `${n} logins are paused after repeated wrong passwords.` : null };
  });

  return { at: now.toISOString(), ok: checks.every((c) => c.ok), checks };
}
