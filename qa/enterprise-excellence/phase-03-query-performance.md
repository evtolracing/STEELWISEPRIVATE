# Phase 3: query performance and capacity

Measured in this session on a local machine (4 processors, 16 GB of memory, PostgreSQL 16.15 with default settings: 128 MB shared buffers, 4 MB work memory). These are measurements of this machine, not of the host. They show how the queries behave as data grows and where the time goes; absolute times on the host will differ.

## 1. The data set

`steelwise_qa_scale3`: the Workstream 1 scale database (`qa/perf/scale-up.sql`) brought to the current schema by the migrations and the three Phase 3 SQL Editor files.

| Table | Rows |
|---|---:|
| Branches | 85 |
| Orders | 72,240 (48,160 assigned to 60 branches, about 3,600 at the busiest) |
| Order lines | 74,347 |
| Stock items and balances | 100,233 |
| Jobs | 72,541 |
| Shipments | 50,869 |
| Invoices | 37,625 |
| Stock movements | 42,441 |
| Size on disk | 325 MB |

**Assumptions, stated plainly.** The data is synthetic and uniform; real branches differ in size and real data is skewed toward recent months. About 900 orders a branch is under a year of work for a busy service center. There is no measured production volume to compare with, so no claim is made about how many years this represents. The scale data's invoices were generated without matching payments (301 differ), which does not affect timings.

## 2. Screens a branch works from

`qa/perf/branch-bench.mjs`, 9 runs each, through the real server, as a login held to one branch and as an all-branch login. Times are median / 95th percentile in milliseconds. Target from Workstream 1: a list answers within 500 ms. Results: `qa/results/phase3-branch-bench-before.json`.

| Screen | Branch login | All-branch login |
|---|---:|---:|
| Orders, newest 50 | 33 / 34 | 44 / 54 |
| Orders, confirmed | 8 / 10 | 33 / 38 |
| Orders, page 40 | 26 / 29 | 42 / 57 |
| Orders, search | 28 / 32 | 39 / 42 |
| Invoices | 24 / 28 | 209 / 267 |
| Invoices, sent | 80 / 101 | 210 / 238 |
| Shipments | 16 / 18 | 43 / 52 |
| Stock balances | 5 / 6 (this branch holds no stock in the scale data) | 59 / 64 |
| Stock items | 6 / 6 (same) | 50 / 66 |
| Stock search | 7 / 8 (same) | 73 / 86 |
| Jobs | 143 / 158 | 42 / 50 |
| Quotes, requests, returns, customers | 5 to 10 | 6 to 110 |
| 40 requests at once | 454 ms for all 40 | 1,192 ms for all 40 |

Every screen is inside the target for both kinds of login. The branch boundary added in Phase 2 does not make any list slow at this volume. Three routes in the first list of addresses did not exist (404) and are not counted.

A weakness of the measurement: the branch chosen for the login has orders, shipments and jobs but no stock in the scale data, so the branch stock lists returned empty. The stock query was measured directly instead (section 3): 1.5 ms for a branch with 2,408 items.

## 3. Query plans

`qa/perf/phase3-plans.sh` runs each statement with `EXPLAIN (ANALYZE, BUFFERS)`. Full output: `qa/results/phase3-plans.txt`.

| Statement | Plan | Time | Grows with |
|---|---|---:|---|
| One branch's newest 50 orders | Index on branch, then sort of 3,612 rows | 5.5 ms | The branch |
| Count of one branch's orders | Index-only scan | 0.6 ms | The branch |
| One branch's confirmed orders | Index on branch, filter | 3.2 ms | The branch |
| One branch's invoices (through the order) | Index on the order's branch; sequential scan of all 37,625 invoices; hash join | 16 ms | **The company** |
| One branch's open jobs, counted | Parallel sequential scan of all jobs and all orders | 25 ms | **The company** (G-013) |
| One branch's stock, newest 50 | Index on branch, sort of 2,408 rows | 1.5 ms | The branch |
| Stock search by number, heat or grade | Sequential scan of all 100,233 items | 140 ms | **The company** (G-013) |
| Customer order history | Index on customer | 8.7 ms | The customer |
| Every item of one heat (31,605 rows) | Index on heat | 23 ms | The heat |
| One item's movements | Index on item | 0.1 ms | The item |
| Reservations on one item | Index on item | 0.1 ms | The item |
| Invoice for a shipment (duplicate check) | Index on shipment | 0.1 ms | Constant |
| Reconciliation of every stock row against its reservations | Sequential scan with an index probe per row | 2,139 ms | The company. A nightly check, not a screen |
| Reconciliation of every invoice against its payments | Same shape | 162 ms | The company |

## 4. Decisions on indexes

The instruction for this phase is to measure first and not to add indexes indiscriminately. On that basis:

| Candidate | Measured need | Decision |
|---|---|---|
| Order (branch, created date) to avoid sorting a branch's orders | 5.5 ms now; a branch would need about 300,000 orders before the sort reached 500 ms | Not added |
| Trigram index for stock search | 140 ms at 100,000 items; over a second at about a million. The search is a contains-match across three tables joined with OR, which no single index serves; the query has to change too | Not added. G-013, deferred to Phase 11 with the measurement and an acceptance figure |
| Branch column on Job | 25 ms at 72,541 jobs | Not added. Same finding |
| Indexes for the eight new foreign keys | Without them, deleting or changing a parent scans the child table, and the sweep's rule that every foreign key is indexed fails | Added |
| Ten duplicate indexes | Pure cost | Dropped (G-005) |

Before and after for the only index change that touches existing queries (dropping duplicates): the plans above are from after the change and each uses the surviving index of the pair. No plan changed.

## 5. Many requests at once

`qa/perf/phase3-load.mjs`: list requests started together, three in four as the branch login. Results: `qa/results/phase3-load.txt`.

| Requests at once | Time for all | Median wait | 95th percentile | Failures | Peak database connections |
|---:|---:|---:|---:|---:|---:|
| 50 | 1.3 s | 1.0 s | 1.2 s | 0 | 16 |
| 100 | 2.3 s | 1.4 s | 2.2 s | 0 | 16 |
| 200 | 4.6 s | 2.5 s | 4.5 s | 0 | 16 |
| 400 | 9.5 s | 5.1 s | 9.3 s | 0 | 16 |

One server process answers about 43 list requests a second, with no failures and a bounded number of connections. The limit is not the database: the busiest reply, 50 orders, is 244 KB because every order comes with its lines and customer (G-014, deferred to Phase 4). On the host, requests are spread across instances, which was not measured here.

Writes: 80 orders at the same moment are all saved (after G-017); a 40-change burst of reservations, receipts and cancellations completes with the books in balance.

## 6. Connections

| Item | Finding |
|---|---|
| Pool in the repository | The database client's default: no size or timeout is set in code or in `.env.example`. 16 connections observed under load on 4 processors |
| On the host | Each serverless instance opens its own pool. Whether `DATABASE_URL` is the provider's pooler address, and its limits, is the owner's setting and NOT VERIFIED (G-015, BLOCKED on the owner reading two settings) |
| Leaks | One client for the whole process (`lib/db.js`); after each load test the connection count returned to idle. No leak observed |
| Long transactions | The longest by design is a serializable money transaction, a few milliseconds. None is held across an outside call in the handlers read |
| Migrations | Use `DIRECT_URL`; the SQL Editor files are applied by the owner in the provider's editor and never through the pool |

## 7. Capacity outlook

What the measurements support, and no more:

- At the measured volume, every branch screen answers in well under half a second on a small machine.
- Queries that are indexed by branch, customer, item, heat or shipment will stay fast as the company grows, because their cost follows the branch or the record.
- Three things grow with the whole company: a branch's invoice list and job count (through joins), the stock search, and replies that send more than the screen shows. At ten times this volume the stock search would exceed a second; the others would still be inside the target.
- Partitioning, read replicas, archiving and summary tables are not justified by anything measured and were not introduced.
- Not measured: sustained load, the host's cold starts, real data skew, report and dashboard queries (E-023 is known to load far more than it shows), and storage growth over time.
