// Phase 11 acceptance thresholds, written BEFORE the baseline cycle was run (committed with the engine,
// before any result file). No approved performance target existed in the repository, so every figure here
// is PROPOSED and PENDING THE OWNER'S APPROVAL. They are judged on the QA machine the run reports
// (4 processors, one PostgreSQL on the same machine); they are not a statement about the production host.
export const STATUS = 'PROPOSED, PENDING OWNER APPROVAL';
export const THRESHOLDS = {
  // Response time in milliseconds, at up to 48 customer jobs in flight across 80 branches.
  latency: {
    'sign-in': { p95: 1500, p99: 2500, why: 'a password check is deliberately slow (bcrypt); a morning of sign-ins must still feel immediate' },
    'screen read (lists, dashboards, reports)': { p95: 800, p99: 1500, why: 'a list or a report opens in under a second' },
    'simple change (order, reservation, receipt, shipment, payment, shop step)': { p95: 800, p99: 1500, why: 'a save answers in under a second' },
    'dispatch with its invoice': { p95: 2000, p99: 4000, why: 'invoice numbers are never skipped or repeated (owner decision of 2026-11-13), so invoices are written one at a time company-wide; a dispatch may wait its turn' },
    'reconciliation of the books': { p95: 5000, p99: 10000, why: 'run by finance on demand and by the scheduled task, not on every screen' },
  },
  reliability: {
    serverErrors: { max: 0, why: 'no request may end in a 5xx answer that was not a deliberate failure injection' },
    failedTransactionsPercent: { max: 0.5, why: 'of attempted business transactions, after the product\'s own "busy, try again" resends' },
    deadlocks: { max: 0, why: 'the database must never have to break a deadlock' },
  },
  integrity: {
    invariantViolations: { max: 0, why: 'negative stock, double invoices, duplicate numbers, unbalanced entries, overpaid invoices' },
    transactionsNotFoundInDatabase: { max: 0, why: 'everything counted as completed must be found in the database and, where it posts, in the books' },
    reconciliationDifference: { max: 0, why: 'the books equal the records, to the cent; a difference is recorded, never adjusted away' },
  },
  volume: { customerJobsTraced: 500, transactionsReconciled: 2000, scenarios: 300 },
  capacity: { requestsPerSecond: { min: 40, why: 'the day modelled here needs about 40 requests a second at its peak level on this machine' } },
};
/** Which threshold a measured kind of request is judged by. */
export function classOf(kind) {
  if (/sign-in/i.test(kind)) return 'sign-in';
  if (/shipment dispatched/.test(kind)) return 'dispatch with its invoice';
  if (/reconciliation/.test(kind)) return 'reconciliation of the books';
  if (/^(finance|executive|branch manager|read)|opened|read$|sees the order/.test(kind)) return 'screen read (lists, dashboards, reports)';
  return 'simple change (order, reservation, receipt, shipment, payment, shop step)';
}
export function judge(latencyByKind) {
  const out = [];
  for (const [kind, v] of Object.entries(latencyByKind)) {
    const cls = classOf(kind); const t = THRESHOLDS.latency[cls];
    if (!v || v.p95 == null) continue;
    out.push({ kind, class: cls, requests: v.requests, p50: v.p50, p95: v.p95, p99: v.p99, limitP95: t.p95, limitP99: t.p99, pass: v.p95 <= t.p95 && (v.requests < 100 || v.p99 <= t.p99) });
  }
  return out;
}
