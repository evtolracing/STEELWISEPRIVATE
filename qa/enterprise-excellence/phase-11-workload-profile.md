# Phase 11: workload profile and acceptance thresholds

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## The day (assumptions)

One working day of the 80-branch model, played through the real server by `qa/sim/phase11-enterprise.mjs`:

1. 818 people sign in, 24 at a time.
2. 320 lots of opening stock are received.
3. 545 customer jobs of six kinds and 342 other pieces of work (50 transfer, 40 count, 40 workorder, 200 entry, 12 recon) are run in four equal parts with 8, 16, 32, 48 jobs in flight at once.
4. While that runs, branch managers, finance and executives keep reading their lists, reports and dashboards, and the scheduled task runs.
5. At the end every completed transaction is looked up in the database, every job is traced from order to money, and the books are reconciled.

Customer jobs by kind: A Stock sale 185; B Processed-material sale 115; C Ecommerce order 55; D Counter (POS) sale 70; E Partial shipment 60; F Return and credit 60. Jobs are dealt to branches by tier weight (see `phase-11-enterprise-model.md`).

"Jobs in flight" is whole customer jobs running at once, each made of 6 to 14 requests by 3 to 6 different people. 48 jobs in flight is not 48 users: it is 48 complete sales being worked at the same instant, with 50 requests in flight at the peak. Whether the real business ever reaches that is not known; it is the model's stress level.

## Thresholds

**Status: PROPOSED, PENDING OWNER APPROVAL.** No performance target existed in the repository. These were written before the first run and are a proposal for the owner.

| What | P95 limit | P99 limit | Why |
|---|---:|---:|---|
| sign-in | 1,500 ms | 2,500 ms | a password check is deliberately slow (bcrypt); a morning of sign-ins must still feel immediate |
| screen read (lists, dashboards, reports) | 800 ms | 1,500 ms | a list or a report opens in under a second |
| simple change (order, reservation, receipt, shipment, payment, shop step) | 800 ms | 1,500 ms | a save answers in under a second |
| dispatch with its invoice | 2,000 ms | 4,000 ms | invoice numbers are never skipped or repeated (owner decision of 2026-11-13), so invoices are written one at a time company-wide; a dispatch may wait its turn |
| reconciliation of the books | 5,000 ms | 10,000 ms | run by finance on demand and by the scheduled task, not on every screen |

| Rule | Limit | Why |
|---|---:|---|
| serverErrors | 0 | no request may end in a 5xx answer that was not a deliberate failure injection |
| failedTransactionsPercent | 0.5 | of attempted business transactions, after the product's own "busy, try again" resends |
| deadlocks | 0 | the database must never have to break a deadlock |
| invariantViolations | 0 | negative stock, double invoices, duplicate numbers, unbalanced entries, overpaid invoices |
| transactionsNotFoundInDatabase | 0 | everything counted as completed must be found in the database and, where it posts, in the books |
| reconciliationDifference | 0 | the books equal the records, to the cent; a difference is recorded, never adjusted away |
| requests per second | at least 40 | the day modelled here needs about 40 requests a second at its peak level on this machine |

Volume required by the phase: 500 customer jobs traced, 2,000 transactions reconciled, 300 scenarios.
