# Phase 10: transaction safety and failure recovery

Group 7 of the Phase 10 suite (`qa/sim/phase10/g7-concurrency.mjs`, 26 scenarios). Each scenario ends by reconciling the books against the records: the books balance, stock and receivables MATCH, and no posted entry is unbalanced.

## Requests at the same moment

| Scenario | Result required |
|---|---|
| Thirty payments of 10.00 at once on an invoice of 100.00 | At most 100.00 paid; payments add up to the paid amount; the rest refused, not failed |
| Six credit memos of 30.00 at once on 100.00 | At most 100.00 credited |
| Ten payments of 10.00 and a credit of 30.00 at once on 50.00 | Paid never above the total |
| Twenty payments of 5.00 at once on 200.00 (Y-020) | All twenty recorded, none a server error |
| One shipment dispatched twice at once | One invoice and one entry |
| One transfer received twice at once | Received once, stock counted once |
| One coil reserved for two orders at once | Never allocated beyond on hand |
| A request sent twice with one Idempotency-Key; ten copies at the same instant | One order; the repeat says it was replayed |
| The same key with a different body | 422 |
| The same key from another person | Two orders (a key is per person) |
| Eighty receipts at once, one at each branch | 80 entries; MATCH |
| Eighty people signing in at once | 80 tokens; none paused |
| A counter sale sent twice with the same sale id | Charged once |
| Two count adjustments of one coil at once (-10, -15 on 1,000) | Both kept: 975 with two movements |
| Two removals of 60 at once on 100 | Never below zero; on hand equals the movements |
| One manual entry reversed twice at once | Exactly one reversal |
| One draft posted twice at once | Posted once |
| "Record what is missing" started twice at once | Each event posted once |

## Processes and connections failing

| Scenario | What was done | Result |
|---|---|---|
| Server killed in the middle of twenty dispatches | `kill -9` of the QA server 150 ms after twenty dispatches were sent, then restart | No dispatch half saved. In one full run 9 shipments were dispatched with no invoice (two saves by design, H-006): each was listed on the integrations report, its invoice raised once from the shipment, and the books agreed (Y-021) |
| Server stopped politely (SIGTERM) during twenty payments | A second server on port 3015 | In-flight requests finished, later ones were refused at the socket; every saved payment has its entry; the paid amount equals the payments |
| Every database connection of the server cut | `pg_terminate_backend` on its connections | It answers again within seconds without a restart |
| Database unreachable | A server pointed at a closed port | `/api/health` 503, `/api/health/ready` 503, `/api/health/live` 200; sign-in fails with a plain sentence and no internals |
| A payment waiting on a row another session holds for 2 s | `SELECT ... FOR UPDATE` in a separate session | Completes once the lock is released and is counted once |
| Books stopped and resumed | Owner stops, a shipment is dispatched, owner resumes | Nothing posted while stopped; the gap is visible in the reconciliation; "record what is missing" posts it once |

## Found and fixed

- **Y-020**: with twenty payments at once on one invoice, some used up every serializable retry and answered 500. Money on one invoice now takes turns inside the process (payments, refunds, credits, cancels), with 12 attempts; an overlap that still survives answers 409 BUSY with "Nothing was saved; please try again".
- **Y-021**: the gap between dispatch and billing after a crash is now a failing check and an alert after 15 minutes.
- Test-side: the scenario that cuts connections also cut the test runner's own pool; the runner now reconnects (it was not a product fault).

## Not verified

Several server processes against one database (turns are per process; the database still serializes). Phase 11.
