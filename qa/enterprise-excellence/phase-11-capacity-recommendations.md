# Phase 11: capacity planning

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

Measured and projected are kept apart. Nothing here claims support for a workload that was not run.

## Measured

| What | Measured | Where |
|---|---:|---|
| The modelled day | 545 customer jobs and 5,191 transactions in 99.9 s of work, 0 failed | cycle 5 |
| Requests | 80.7 a second overall; 132.2 a second at the best level; 50 in flight at the peak | cycle 5 |
| Ordinary reads and saves | P95 3,299 ms for all requests with 48 jobs in flight | cycle 5 |
| Dispatch with its invoice | 8 in flight: P95 696 ms; 16 in flight: P95 1,865 ms; 32 in flight: P95 4,617 ms; 48 in flight: P95 5,175 ms | cycle 5 |
| Sign-in | 818 people in 25.2 s, 24 at a time, P95 974 ms | cycle 5 |
| Database connections | at most 30 open with 3 copies, of 100 | cycle 5 |
| Posted journal entries | 2,687 in the day; reconciliation of the whole books 79 ms | cycle 5 |
| Storage growth | postedEntries 2,687, ledgerEvents 2,487, orders 1,022, auditRows 5,639, stockMovements 1,337 | cycle 5, rows added in one day |
| Server copies | one, three and four copies give the same throughput and the same dispatch time on this one machine | `phase-11-api-throughput.md` |

## The one known ceiling: invoices are written one at a time (Z-006)

Invoice numbers are never skipped or repeated (owner decision of 2026-11-13). To keep that true on several server copies, each invoice waits its turn in the database. Every dispatch therefore queues behind the dispatches before it. On this machine a dispatch met the proposed limit of 2 s at P95 with 8 and 16 customer jobs in flight and missed it with 32 and 48.

Options, none taken in this phase:

| Option | Effect | Cost | Whose decision |
|---|---|---|---|
| Keep it; approve a longer limit for dispatch at peak | No change. A dock waits a few seconds at the busiest instant | None | Owner |
| A number series per branch (for example INV-L07-000123) | Branches no longer wait for each other; the ceiling becomes per branch | Changes what an invoice number looks like; needs the accountant; a database update | Owner and accountant |
| Shorten the invoice save (fewer round trips inside the turn) | Raises the ceiling without changing numbering | A rewrite of the billing save, the most sensitive code in the product; needs its own phase and full regression | Owner |
| A larger database server | Raises the ceiling roughly in step with processor speed | Hosting cost. Projected, not measured | Owner |

## Projected (not measured)

- **More server copies on separate machines** should raise ordinary request throughput, since ordinary requests do not wait on each other. Not measured: all copies here shared one machine.
- **Connections**: each server copy opens its own pool. On a host that starts a copy per request burst (serverless functions), copies times pool size can exceed the database's limit. A pooler in front of the database, or a small pool per copy, is needed. The live setting was not read.
- **A year of data**: at about 2,687 entries a day the journal would pass 671,750 entries in 250 working days at this model's volume. Report and reconciliation times at that size were not measured (W-023).
- **Audit trail**: about 5,639 rows a day at this volume; it has no retention rule (owner).
- **Request-limit table**: rows are removed two hours after their window by the scheduled run. If the scheduler does not run, the table grows (B-019).

## Not assessed

Network capacity, the content delivery network, the limits of real carriers, payment processors and accounting products, and queue workers (the product has none: see `phase-11-event-queue-results.md`).

## Recommendations for the owner

1. Approve or change the proposed thresholds in `phase-11-workload-profile.md`. Until then no threshold is "approved" and gate E cannot pass.
2. Decide Z-006 (table above).
3. Apply database update 18 so the request limits are shared on live.
4. Confirm the live database's connection limit and pooler before running more than a few server copies.
5. Give real daily volumes (orders, shipments, invoices per branch) so the model can be set to the business instead of to assumptions.
