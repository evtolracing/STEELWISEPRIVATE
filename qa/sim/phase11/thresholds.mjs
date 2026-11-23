// Phase 11 acceptance thresholds. Written BEFORE the baseline cycle was run, as a proposal, because no performance
// target existed in the repository. APPROVED by the owner on 2026-11-22: "whatever is proposed and not approved in the
// system, use your recommendations and complete". The recommendation adopted is option 1 of
// qa/enterprise-excellence/phase-11-capacity-recommendations.md: every proposed limit stands as written, except the
// saves that write a numbered invoice or credit memo. Those wait their turn company-wide (numbers are never skipped
// or repeated, owner decision of 2026-11-13), so they are given the time that waiting takes, and the dispatch keeps
// the 2-second limit at ordinary load. Nothing in the product was changed to meet a limit, and no limit was set
// below what was proposed for any other kind of request.
// They are judged on the QA machine the run reports (4 processors, one PostgreSQL on the same machine, which also
// carries the load generator); they are not a statement about the production host.
export const STATUS = 'APPROVED BY THE OWNER, 2026-11-22 (engineer\'s recommendation adopted)';
export const THRESHOLDS = {
  // Response time in milliseconds, at up to 48 customer jobs in flight across 80 branches.
  latency: {
    'sign-in': { p95: 1500, p99: 2500, why: 'a password check is deliberately slow (bcrypt); a morning of sign-ins must still feel immediate' },
    'screen read (lists, dashboards, reports)': { p95: 800, p99: 1500, why: 'a list or a report opens in under a second' },
    'simple change (order, reservation, receipt, shipment, payment, shop step)': { p95: 800, p99: 1500, why: 'a save answers in under a second' },
    // Before 2026-11-22 the proposal was p95 2,000 and p99 4,000 for the whole day. Measured in six full runs with 48
    // customer jobs in flight across 80 branches: p95 4,581 to 5,728 ms, p99 4,995 to 6,145 ms. With 8 in flight: p95
    // 696 to 807 ms. Every server copy count gave the same figures: the wait is the invoice's turn, not the server.
    'dispatch with its invoice': { p95: 6500, p99: 8000, why: 'invoice numbers are never skipped or repeated (owner decision of 2026-11-13), so invoices are written one at a time company-wide; at the very busiest instant (dozens of trucks dispatched in the same second) a dock waits a few seconds for its paperwork, and nothing is lost or numbered wrongly' },
    'sale or credit with its numbered document': { p95: 2000, p99: 4000, why: 'a counter sale writes its invoice and a credited return writes its credit memo inside the save, in the same number series as the dispatches, so each waits its turn behind them' },
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
  // The dispatch at ordinary load: with up to this many customer jobs in flight it keeps the limit first proposed.
  dispatchAtOrdinaryLoad: { jobsInFlight: 8, p95: 2000, why: 'a dock gets its paperwork within two seconds on an ordinary day' },
  capacity: { requestsPerSecond: { min: 40, why: 'the day modelled here needs about 40 requests a second at its peak level on this machine' } },
};
/** Which threshold a measured kind of request is judged by. */
export function classOf(kind) {
  if (/sign-in/i.test(kind)) return 'sign-in';
  if (/shipment dispatched/.test(kind)) return 'dispatch with its invoice';
  if (/^(counter sale paid|return received and credited)$/.test(kind)) return 'sale or credit with its numbered document';
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
/** The dispatch at ordinary load, from the run's figures by load level. A level with no dispatches is not judged. */
export function judgeDispatchAtOrdinaryLoad(levels = []) {
  const t = THRESHOLDS.dispatchAtOrdinaryLoad;
  return levels.filter((l) => l.jobsInFlight <= t.jobsInFlight && l.dispatchMs?.p95 != null)
    .map((l) => ({ jobsInFlight: l.jobsInFlight, requests: l.dispatchMs.requests, p95: l.dispatchMs.p95, limitP95: t.p95, pass: l.dispatchMs.p95 <= t.p95 }));
}
