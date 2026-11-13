# Testing gap analysis

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit c4da120. Do not edit by hand: change the source and rerun.

## What exists

| Kind | Where | Size | Runs on GitHub |
|---|---|---|:-:|
| Unit tests | src/backend/test (17 files) | 118 tests | yes |
| Order-to-cash simulation with database checks and reconciliation | qa/sim/run.mjs | 50 jobs per cycle, 3 cycles per gate run | no |
| Security and safeguards sweep | qa/sim/security.mjs | 20 sections | no |
| Baseline probe (Phase 1) | qa/sim/baseline-probe.mjs | 4 sections over every write route | no |
| Browser suites that operate screens | qa/sim/ui-*.cjs | 5 suites, 125 checks, plus a check that every route opens | no |
| Screen audit, lint, production build | qa/tools/screen-audit.mjs, src/frontend | all screens, whole frontend | audit and lint yes; build on the host |
| Frontend unit tests | none | 0 | |
| Performance benchmark | qa/perf (Workstream 1) | not rerun in Phase 1 | no |
| Accessibility, mobile and tablet layout | none | 0 | |
| Restore from backup, failover | none | 0 | |

## What the tests actually reach

Measured from the server's request log during the full gate run of this session (`qa/tools/exercised.mjs`). "Success" means the route answered 2xx at least once. A refusal test (no token, wrong role, bad input) is real coverage of the refusal and none of the function.

| Measure | Count |
|---|---:|
| Routes that returned a success | 285 of 611 (47%) |
| Changing routes that returned a success | 88 of 319 (28%) |
| Routes called at all (including refusals) | 595 of 611 |
| Screens operated by a browser suite (not just opened) | about 30 of 143 |
| Screens opened without a crash | 125 of 125 that take no record id |

## Changing routes with no success-path test, by module

| Module | Changing routes | With a success-path test | Without |
|---|---:|---:|---:|
| Counter session flow (older) | 36 | 5 | 31 |
| Material tracking, packages and drop tags | 31 | 0 | 31 |
| Partner API | 19 | 0 | 19 |
| Order hub and intake pipeline | 18 | 0 | 18 |
| Processing recipes and bills of material | 11 | 0 | 11 |
| Jobs, job board and schedule | 20 | 9 | 11 |
| Dispatch, work centers and shop-floor operations | 17 | 6 | 11 |
| AI assistant and voice | 10 | 0 | 10 |
| Executive tools | 10 | 0 | 10 |
| Staff and operators | 9 | 0 | 9 |
| Operations cockpit and dashboards | 9 | 0 | 9 |
| Stop work | 7 | 0 | 7 |
| Settings, tax rates and online settings | 6 | 0 | 6 |
| Web store | 10 | 4 | 6 |
| RFQs and quotes | 9 | 4 | 5 |
| Second stock list (unit tracking) | 5 | 0 | 5 |
| Maintenance and assets | 9 | 4 | 5 |
| Users, roles and branches | 6 | 2 | 4 |
| Quality inspections | 6 | 2 | 4 |
| Counter quick sale | 6 | 3 | 3 |
| Remnants | 4 | 1 | 3 |
| Planning and optimization | 3 | 0 | 3 |
| Sign-in and sessions | 3 | 1 | 2 |
| Customers | 4 | 2 | 2 |
| Shipping | 7 | 5 | 2 |
| Customer account pages | 1 | 0 | 1 |
| Stock items and stock levels | 8 | 7 | 1 |
| Returns | 3 | 2 | 1 |
| Documents | 3 | 2 | 1 |
| Order entry | 7 | 7 | 0 |
| Sales orders | 4 | 4 | 0 |
| Pricing and customer tiers | 2 | 2 | 0 |
| Products, grades and heats | 6 | 6 | 0 |
| Receiving | 4 | 4 | 0 |
| Coil work orders | 5 | 5 | 0 |
| Invoices, payments, credits and refunds | 5 | 5 | 0 |

## Weaknesses in the existing tests

- **Data isolation between runs.** The simulation, sweep and probes share one QA database and leave their records behind; the gate script rebuilds the database first. A test run on a database that was not rebuilt can pass or fail for reasons left by an earlier run.
- **Refusal-heavy.** The sweep proves that 557 routes refuse a missing token and 534 refuse a customer, which is right, but most of those routes are never made to succeed.
- **Browser checks read text.** They assert that a row or a message appears. They do not check layout, keyboard use or what a screen reader would say.
- **Unit tests cover rules that were moved into `lib/`.** 17 files, none of which needs a database. Rules still inside route handlers (dispatch, operations, staff, quality, drop tags, order hub) cannot be unit tested where they are (B-014).
- **No concurrency test outside order to cash.** Reservation, dispatch, payment and return races are tested. Nothing tests two requests at once on the second stock list, operations, counter sessions or user edits.
- **No cross-branch test**, because there is no cross-branch rule to test (B-003).
- **One flake seen in earlier sessions and not since**: none recorded in this session; all gates passed on two consecutive full runs before any change.

## Prioritised gaps

| Priority | Gap | Why | Assigned |
|---|---|---|---|
| 1 | Database-backed gates do not run on GitHub | A regression in order to cash is caught only if someone runs the gates locally | Phase 2 (workflow change: add a Postgres service) |
| 2 | Shop-floor operations: start, pause, complete, reassign; time logs | 0 of 15 changing routes ever succeed in a test; labor time depends on them | Manufacturing phase |
| 3 | Material tracking, packages, drop tags, print queue | 0 of 30; this is the physical identity of what ships | Manufacturing and shipping phases |
| 4 | Partner API success paths and webhook delivery | 0 of 18; outside parties depend on it | Integration phase |
| 5 | User administration success paths | Creating and disabling users is never tested end to end | Security phase |
| 6 | Quality inspections beyond pass | 2 of 6 | Manufacturing phase |
| 7 | Staff, work centers, recipes, BOMs, assets, maintenance | Set-up data everything else reads | Phase 2 as each handler is given validation |
| 8 | Dashboard and report figures reconciled to records | A wrong figure would not be seen | Reporting phase |
| 9 | Accessibility scan and tablet layout in the browser suites | Never run | Phase 9 |
| 10 | Frontend unit tests for the price, tax and total calculations done in the browser | None exist | Phase 2 |

