# Phase gate report: Phase 2, Workstream 1 (architecture and infrastructure)

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11.

## Completion status: PARTIALLY COMPLETE

This is not a pass. Twelve findings are fixed. Four infrastructure findings cannot be closed without the owner (E-014, E-015, E-016, E-017), three fixes are awaiting verification outside the local environment (E-009, E-010, D-011b), and nothing here has run against the hosted site.

## 1. Scope and discovery

In scope: database structure, API layer, security configuration, dependencies, logging, startup and shutdown, deployment configuration, performance at 80-branch volume.

How it was examined: catalog queries on the test database; reading `app.js`, `server.js`, `config/`, `middleware/`, `lib/db.js`, `vercel.json`, `api/index.js`; `npm audit`; a benchmark of all 146 parameter-free read routes on a copy scaled to 100,233 stock items and 72,240 orders.

NOT VERIFIED (no access or not attempted): production environment settings, database backups, connection-pool settings on the host, cold-start time, behaviour on MySQL, any outside service, load beyond 20 simultaneous reads.

## 2. Findings

`qa/engineering-quality-findings.md`, E-001 to E-023, with a disposition for every open item.

## 3. Root causes

| Findings | Root cause |
|---|---|
| E-001, E-005, E-006, E-023 | Routes were written against a small demo data set: load every row, then count or filter in JavaScript |
| E-002 | An earlier fallback to a second database client was left in one route |
| E-003, E-004 | The schema was generated from the data model, which declares relations but few indexes and cannot declare value checks |
| E-006, E-007, E-023 (status part) | Code written against status names that were later changed or never existed, with invented fallback figures |
| E-008, E-010 | No operational tooling had been added beyond console output |
| E-009 | A development convenience (seed on start) with a condition that also matched production |
| E-011 | Packages not updated since first install |

## 4. Changes implemented

Bounded job and staging lists; one code path for the job list; analytics and the operations cockpit count in the database; margin reported as not available; shipping summary and cockpit use real status names; 87 indexes; 8 value checks; request id and request log; demo seed only on request; clean exit and shutdown; non-breaking package updates.

## 5. Files modified

`src/backend/src/app.js`, `server.js`, `middleware/requestLog.js` (new), `middleware/safeErrors.js`, `routes/jobs.js`, `routes/materialTrackingRoutes.js`, `routes/analyticsV1.js`, `routes/shippingV1.js`, `routes/opsCockpit.js`, `prisma/schema.prisma`, both `package-lock.json` files, `src/frontend/src/dashboard/widgets/index.jsx`, `qa/sim/security.mjs`, `qa/perf/*` (new), `qa/tools/start-qa-server.sh`.

## 6. Database changes

One additive migration, `20261113062621_fk_indexes_and_stock_checks`. SQL Editor file run twice on a copy; schema comparison reports no difference. Not applied to production.

## 7. Tests added

- Unit: `test/requestLog.test.js` (2 tests). Total now 47.
- Sweep section "Platform safeguards": 31 checks covering E-001 to E-008 and E-023.
- Benchmark tool `qa/perf/bench.mjs` and data multiplier `qa/perf/scale-up.sql`.

## 8. Tests actually executed (this session, local)

| Test | Result |
|---|---|
| Unit tests | 47 of 47 pass |
| Three 50-job cycles, seeds 8001 to 8003, rebuilt QA database | 150 of 150 pass; 2,107 API steps; 2,331 checks; 24 of 24 simultaneous-request probes; reconciliation 0 problems |
| Security and safeguards sweep | 12 of 12 sections pass |
| New safeguard checks run against the code before this workstream | 9 of 30 fail there, as they should |
| Screen check | 123 of 123 screens open |
| Frontend production build | Passes |
| Benchmark before and after | `performance-benchmarks.md` |
| Cockpit old reply against new reply on QA data | Identical apart from clock-dependent text and the corrected shipped counts |
| Lint | NOT RUN: none configured (E-016) |

## 9. Regression results

No previously passing job, sweep check or screen regressed. Phase 1 results for comparison are `qa/results/r8-700*.json`.

## 10. Connected-module verification

- Job list change: job board, order detail (jobs for an order), shop-floor and rework simulation jobs, planning screens open without error.
- Shipping summary and cockpit: figures compared with the database by the sweep.
- Index and check migration: every simulated workflow (orders, reservations, jobs, shipments, invoices, payments, returns, quick sale, quotes) ran with the checks in force.
- NOT VERIFIED: screens were opened, not operated. No one has looked at the job board with more than 1,000 open jobs.

## 11. Remaining findings and blockers

See the disposition table. Blocked on the owner: E-014, E-015, E-016, E-017, and approval of E-011 and E-018.

## 12. Continuation point

Next: Workstream 2 (sales and customer experience). Start by reading this report, the disposition table, and D-036, D-020 (sales routes) and E-021. First tasks: audit quote pricing against price lists, the customer portal journey as a customer login, and the Sales Dashboard data source.
