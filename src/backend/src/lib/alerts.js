/**
 * Alerts (Phase 10, Y-010).
 *
 * An alert is a condition a person must look at: a ledger posting that failed, an attempt to post an
 * entry that does not balance, a login paused after repeated wrong passwords, a partner event that
 * could not be delivered, a reconciliation difference, a scheduled run that stopped.
 *
 * raiseAlert() does three things, and never throws, so it can never break the work that raised it:
 *   1. one JSON log line with level "alert" (the host's log search and any log drain pick it up);
 *   2. one AuditLog row, category SYSTEM, event ALERT, so the Integrations page lists it and it cannot be
 *      changed or deleted by the application (the runtime database role cannot update AuditLog);
 *   3. when ALERT_WEBHOOK_URL is set, a POST of the same facts to that address (a chat or paging
 *      service of the owner's choosing). Nothing is sent when it is not set.
 * The same alert (kind and key) is written at most once per 15 minutes, so a storm of failures makes
 * one row, not thousands; the log line is written every time.
 *
 * No secret, token, password or customer document is ever put into an alert: callers pass ids and counts.
 */
import prisma from './db.js';
import { callOut } from './outbound.js';

export const ALERT_KINDS = {
  LEDGER_POSTING_FAILED: { severity: 'CRITICAL', what: 'A ledger posting failed' },
  LEDGER_UNBALANCED_ATTEMPT: { severity: 'CRITICAL', what: 'An entry that does not balance was refused' },
  LEDGER_RECONCILIATION_DIFFERENCE: { severity: 'CRITICAL', what: 'The books disagree with the business records' },
  LEDGER_EVENTS_WAITING: { severity: 'WARNING', what: 'Ledger events wait for a person' },
  INVENTORY_BALANCE_BROKEN: { severity: 'CRITICAL', what: 'A stock balance does not add up' },
  LOGIN_LOCKED: { severity: 'WARNING', what: 'A login was paused after repeated wrong passwords' },
  WEBHOOK_DEAD_LETTER: { severity: 'WARNING', what: 'Partner events could not be delivered' },
  SCHEDULED_RUN_LATE: { severity: 'WARNING', what: 'The scheduled run has not run on time' },
  SCHEDULED_RUN_FAILED: { severity: 'CRITICAL', what: 'The scheduled run failed' },
  DATABASE_UNREACHABLE: { severity: 'CRITICAL', what: 'The database did not answer' },
  SHIPPED_NOT_INVOICED: { severity: 'WARNING', what: 'Goods have left the dock without an invoice' },
};
export const DEDUPE_MINUTES = 15;

const safeKey = (v) => String(v ?? '').replace(/[^A-Za-z0-9:._-]/g, '').slice(0, 120);

/** Writes the alert. Returns { logged, stored, sent } and never throws. */
export async function raiseAlert(kind, details = {}, { key = '', requestId = null, db = prisma, now = new Date() } = {}) {
  const def = ALERT_KINDS[kind] || { severity: 'WARNING', what: kind };
  const out = { kind, logged: false, stored: false, duplicate: false, sent: false };
  const dedupeKey = `${kind}:${safeKey(key)}`;
  try {
    console.error(JSON.stringify({ t: now.toISOString(), level: 'alert', msg: 'alert', kind, severity: def.severity, what: def.what, key: dedupeKey, id: requestId, details }));
    out.logged = true;
  } catch { /* logging must never break the caller */ }
  try {
    const since = new Date(now.getTime() - DEDUPE_MINUTES * 60_000);
    const recent = await db.auditLog.findFirst({ where: { category: 'SYSTEM', eventType: 'ALERT', resourceType: 'Alert', resourceId: dedupeKey, timestamp: { gte: since } }, select: { id: true } });
    if (recent) out.duplicate = true;
    else {
      await db.auditLog.create({ data: { category: 'SYSTEM', eventType: 'ALERT', severity: def.severity, action: 'ALERT', resourceType: 'Alert', resourceId: dedupeKey, correlationId: requestId, details: { kind, what: def.what, ...details } } });
      out.stored = true;
    }
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', msg: 'alert_not_stored', kind, reason: String(error?.message || error).slice(0, 200) }));
  }
  const url = process.env.ALERT_WEBHOOK_URL;
  if (url && !out.duplicate) {
    try {
      await callOut('alerts', url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, severity: def.severity, what: def.what, key: dedupeKey, at: now.toISOString(), details }) }, { timeoutMs: 5000, tries: 2 });
      out.sent = true;
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', msg: 'alert_not_sent', kind, reason: String(error?.message || error).slice(0, 200) }));
    }
  }
  return out;
}

/** The same, without waiting: for code inside a business save, which must not slow down or fail for an alert. */
export function raiseAlertLater(kind, details, opts) {
  raiseAlert(kind, details, opts).catch(() => {});
}

/** The most recent alerts, newest first. */
export async function recentAlerts({ take = 50, db = prisma } = {}) {
  const rows = await db.auditLog.findMany({ where: { category: 'SYSTEM', eventType: 'ALERT' }, orderBy: { timestamp: 'desc' }, take: Math.min(Math.max(Number(take) || 50, 1), 200), select: { id: true, timestamp: true, severity: true, resourceId: true, correlationId: true, details: true } });
  return rows.map((r) => ({ id: r.id, at: r.timestamp, severity: r.severity, key: r.resourceId, kind: r.details?.kind, what: r.details?.what, requestId: r.correlationId, details: r.details }));
}
