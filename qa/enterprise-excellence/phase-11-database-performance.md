# Phase 11: database performance

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), default settings, max_connections 100, on the same machine as everything else. Statistics are read from `pg_stat_database` before and after the day, and `pg_stat_activity` and `pg_locks` are sampled about four times a second during it.

## During the day, by cycle

| Cycle | Committed | Rolled back | Deadlocks | Cache hit ratio | Temp files | Lock waiters: most at once | Lock waiters: mean | Active sessions: most | Sessions open: most |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 Baseline | 99,073 | 3,269 | 0 | 0.9998 | 0 | 15 | 0.58 | 18 | 29 |
| 2 Correction | 99,934 | 230 | 0 | 0.9998 | 0 | 5 | 1.08 | 9 | 30 |
| 3 Full Revalidation | 99,962 | 220 | 0 | 0.9998 | 0 | 5 | 1.09 | 6 | 30 |
| 4 Failure and Recovery | 100,736 | 206 | 0 | 0.9998 | 0 | 6 | 1.08 | 9 | 31 |
| 5 Final Certification | 100,787 | 204 | 0 | 0.9998 | 0 | 5 | 1.05 | 8 | 30 |

Reading:

- **Rollbacks** fell from 3,269 at the baseline to 204: the baseline's were serializable saves repeated because every invoice and every numbered document read its whole table (Z-001, Z-003).
- **Deadlocks**: none in any cycle.
- **Connections**: at most 30 sessions open with 3 server copies, of 100 allowed. Each copy keeps its own pool. On a host that starts many copies the total is copies times pool size: see the capacity document.
- **Lock waits**: at most 5 sessions waiting at once. They are the invoices waiting their turn (Z-002), by design.
- **Memory**: the cache hit ratio is 0.9998 and no temporary file was written, at this data size.

## Largest tables after the day (cycle 5)

| Table | Rows | Bytes | Sequential scans | Index scans |
|---|---:|---:|---:|---:|
| AuditLog | 5,689 | 3,604,480 | 9 | 897 |
| JournalLine | 5,530 | 3,063,808 | 135 | 18,190 |
| JournalEntry | 2,701 | 2,809,856 | 97 | 155,317 |
| LedgerEvent | 2,493 | 1,662,976 | 130 | 6,182 |
| MaterialMovement | 1,347 | 1,277,952 | 167 | 5,336 |
| DemandSuggestionEvent | 1,242 | 417,792 | 5 | 0 |
| Order | 1,089 | 901,120 | 535 | 42,241 |
| OrderLine | 1,088 | 778,240 | 68 | 18,321 |
| Inventory | 871 | 524,288 | 210 | 6,266 |
| Coil | 871 | 712,704 | 412 | 9,780 |
| User | 848 | 573,440 | 59 | 24,226 |
| RateWindow | 842 | 385,024 | 3 | 854 |
| Invoice | 613 | 589,824 | 476 | 19,183 |
| InvoiceLine | 612 | 540,672 | 25 | 5,460 |

Sequential scans at this size are scans of small tables and cost little. They are the place to look first as the data grows: `Order`, `Invoice` and `Coil` are read by scan more often than their size alone explains. No index was added in this phase, because none was shown to be needed at the size measured and an index on the live database is the owner's to apply.

## Growth in one day

| What | Rows added in one simulated day |
|---|---:|
| postedEntries | 2,687 |
| ledgerEvents | 2,487 |
| orders | 1,022 |
| auditRows | 5,639 |
| stockMovements | 1,337 |

## Under failure

Group 7 exhausts the connections (all but six taken by other sessions), cuts every connection of the servers, holds the invoice counter for 3 and for 23 seconds, and holds an invoice row for 2 seconds. Results in `phase-11-failure-injection.md`.

## Not measured

- A year of data. The largest table here has 5,689 rows. Query plans at hundreds of thousands of rows were not examined (W-023).
- The live database, its pooler and its limits. NOT VERIFIED.
