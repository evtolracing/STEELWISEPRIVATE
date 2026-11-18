# Phase 11: synthetic data and the safe test environment

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## The fourteen environment checks (prompt section 4)

| # | Check | Result |
|---|---|---|
| 1 | Environment isolation | Every tool refuses a database whose address is not local or whose name does not contain `qa` (`qa/tools/phase11-cluster.sh`, `qa/tools/phase11-mutations.mjs`, `qa/sim/phase10/ctx.mjs`). The runs used `steelwise_qa_p11`, built from the migrations for this phase only. |
| 2 | Git branch and commit | Branch `claude/project-thread-25z3jd`, started from the merge of Phase 10 (`fdbece6`). |
| 3 | Application version | Every server copy reports its build on `/api/health`; group 8 checks that all copies report the same one. |
| 4 | Database version | PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), max_connections 100. |
| 5 | Infrastructure resources | One machine: 4 processors (Intel(R) Xeon(R) Processor @ 2.10GHz), 15.7 GB, Node v22.23.4. The database, the server copies and the load all ran on it. |
| 6 | Service configuration | 3 server copies behind one front door (`qa/tools/qa-cluster.mjs`, round robin, health checked), each connected as `steelwise_runtime`. Outside-service time limits on QA: AI 1.5 s, webhooks 1.5 s, breaker rest 3 s. |
| 7 | Integration sandbox | One local stand-in on port 3166 answers for the partner webhooks, the AI service and the alert channel, and can be told to fail, hang or answer late. The accounting export is the GENERIC file export, which calls nothing. |
| 8 | Monitoring | Request log per copy with request ids, the database statistics (`pg_stat_database`, `pg_stat_activity`, `pg_locks`) sampled during every run, the front door's counters, and the product's own system checks and alerts. |
| 9 | Synthetic data isolation | Branches QA-L01 to QA-L80, logins at `@p11.qa.test`, customers and suppliers named P11; nothing is copied from the live system. |
| 10 | Cleanup | The database is dropped and rebuilt from the migrations before cycles 2, 3, 4 and 5 (`qa/tools/phase11-cluster.sh 3 --rebuild`). Nothing needs cleaning anywhere else because nothing else was written. |
| 11 | No production side effects | No payment, email, text message, carrier booking or accounting post left the machine: every outside address is the stand-in, and group 6 checks that an export under load calls no outside address. |
| 12 | Existing automated tests | The full gate of every earlier phase: Every earlier phase passes on the Phase 11 code on a rebuilt database (Phases 2 to 9.5 in full, unit tests 268 of 268, lint 0 errors, build). Phase 10 passed 276 of 277 once its restore server was started, and the one miss passes alone. Phase 11 in gate order passed 320 of 320 on its third run, after eight checks that made wrong assumptions about what earlier phases leave behind were corrected in the tests |
| 13 | Baseline failures | Cycle 1: 545 of 545 jobs, 3,269 database transactions rolled back, verdict items not met: responseTimesWithinProposedLimits. See `phase-11-performance-baseline.md`. |
| 14 | Acceptance thresholds | Written before the baseline run in `qa/sim/phase11/thresholds.mjs` (commit `4e17d9e`). Status: PROPOSED, PENDING OWNER APPROVAL. |

## What is generated

Built by `qa/sim/phase11/model.mjs` on a rebuilt QA database: the people of every branch by role, customer accounts with buyer logins, suppliers, work centers and certified operators, a product catalog, and at the start of each day 320 stock lots received through the product's own receiving route (320 received in 5.7 s). Opening stock therefore has purchase orders, receipts, costs and ledger postings like any other stock.

## What is never generated

Real names, real customers, real prices, card numbers, bank details. Passwords are one QA password hashed per login. The QA ledger is started with test accounts and a test approval marked "QA Synthetic Accountant (test data only)".
