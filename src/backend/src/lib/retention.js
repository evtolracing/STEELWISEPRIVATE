/**
 * How long history stays online. Owner decision of 2026-11-13: five years for now, with a warning
 * when records are old enough to archive. This only counts and warns. Nothing is ever deleted or
 * moved by this code: archiving is a separate, approved step.
 */
import prisma from './db.js';
import { acrossBranches } from './branchScope.js';

export const DEFAULT_RETENTION_YEARS = 5;
const WARN_AHEAD_DAYS = 183;

// [what people call it, table, date column]. Fixed names: nothing here comes from a request.
const RECORDS = [
  ['Sales orders', 'Order', 'createdAt'],
  ['Quotes', 'Quote', 'createdAt'],
  ['Shipments', 'Shipment', 'createdAt'],
  ['Invoices and credit memos', 'Invoice', 'invoiceDate'],
  ['Payments', 'Payment', 'paymentDate'],
  ['Stock movements', 'MaterialMovement', 'createdAt'],
  ['Jobs', 'Job', 'createdAt'],
  ['Work orders', 'WorkOrder', 'createdAt'],
  ['History (audit) lines', 'AuditLog', 'timestamp'],
];

export function cutoffs(years, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - years);
  const soon = new Date(cutoff.getTime() + WARN_AHEAD_DAYS * 86400000);
  return { cutoff, soon };
}

/** 'ARCHIVE' when anything is past the period, 'SOON' when something will be within six months, else 'OK'. */
export const levelFor = (past, soon) => (past > 0 ? 'ARCHIVE' : soon > 0 ? 'SOON' : 'OK');

export async function retentionYears() {
  const row = await prisma.appSetting.findUnique({ where: { key: 'retention.years' } }).catch(() => null);
  const years = Number(row?.value?.years ?? row?.value);
  return Number.isInteger(years) && years >= 1 && years <= 50 ? years : DEFAULT_RETENTION_YEARS;
}

export async function retentionReport(now = new Date()) {
  const years = await retentionYears();
  const { cutoff, soon } = cutoffs(years, now);
  const records = await acrossBranches(async () => {
    const out = [];
    for (const [label, table, column] of RECORDS) {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT count(*) FILTER (WHERE "${column}" < $1)::int AS past, count(*) FILTER (WHERE "${column}" >= $1 AND "${column}" < $2)::int AS soon, min("${column}") AS oldest, count(*)::int AS total FROM "${table}"`,
        cutoff, soon,
      );
      const r = rows[0];
      out.push({ record: label, total: r.total, pastPeriod: r.past, withinSixMonths: r.soon, oldest: r.oldest, level: levelFor(r.past, r.soon) });
    }
    return out;
  });
  const past = records.reduce((s, r) => s + r.pastPeriod, 0);
  const near = records.reduce((s, r) => s + r.withinSixMonths, 0);
  const level = levelFor(past, near);
  const warning = level === 'ARCHIVE'
    ? `${past.toLocaleString()} records are more than ${years} years old and are ready to archive. Nothing is removed until an archive is approved and run.`
    : level === 'SOON'
      ? `${near.toLocaleString()} records will pass ${years} years within six months. Plan the archive.`
      : null;
  return { years, cutoff, level, warning, records };
}
