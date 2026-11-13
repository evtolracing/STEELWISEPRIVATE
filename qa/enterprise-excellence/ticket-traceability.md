# Ticket, feature and test traceability

Written by hand in Phase 1. The commit-by-commit table (every commit, its files, schema changes, API and screen areas, tests added) is generated in `qa/ticket-traceability.md` by `qa/tools/traceability.mjs` and was refreshed in this phase: 208 commits, 26 of which added tests.

## What evidence exists

| Source | State |
|---|---|
| Ticket files in the repository | NOT AVAILABLE. There are none |
| An issue tracker | NOT AVAILABLE. None is linked from the repository and none was given |
| Pull requests | 30. Numbers 1 to 29 are merged; 30 is open and holds the audit follow-up and all Phase 2 and Phase 1 work |
| Git history | 208 commits from 2026-01-16. Each commit or pull request title is treated as the ticket |
| Implementation plans and design files | `docs/` (9 files), `DESIGN FILES/` and `archive-design-files/`. These describe intended features. They were not read line by line in Phase 1 |
| Earlier QA reports | `qa/` (21 documents, 7 phase reports) |
| TODO and FIXME comments | 21 in the source, 9 of them in `routes/stopWork.js` and 6 in the stop-work screens |

Because there are no tickets, "original requirement" below is the title of the commit or pull request, and "fully implemented" is judged against what the code does today.

## History in four periods

| Period | Commits | What was done | What it left |
|---|---:|---|---|
| January to February 2026 | 89 | The first build: screens for most modules on sample data; shop floor, dispatch, quality inspection, material tracking, assets and maintenance orders wired to the database; deployment to Vercel | Many screens with no server (X-009); routes with no validation and one catch-all error (B-005, B-007) |
| 10 November 2026, PRs 1 to 24 | 35 | Security hardening; one schema with a baseline migration; then one pull request per module to "save X in the database" or make it "real": order hub, counter sessions, stop work, pipeline, exceptions, second stock list, print queue, order entry menus, web orders, remnants, store, customer portal, recipes, analytics | Several stores were moved from memory into tables as whole JSON records without redesign (B-009). Stop work was saved in the database but its screen was not connected (X-001) |
| 11 to 12 November, PRs 25 to 29 | about 50 | Sign-in on every route; pages and routes by role; customer logins tied to an account; the first system audit with the simulation suite and core workflow repairs | The department write rules cover the core records only (B-004) |
| 12 to 13 November, PR 30 (open) | 90 on the branch | Audit follow-up; six Phase 2 workstreams; Phase 1 of this program | See `qa/phase-reports/` and `phase-01-report.md` |

## Feature to implementation to test

One row per feature that a commit or pull request claims. "Protected" means an automated test would fail if the feature broke.

| Feature (title in history) | Where it is | Database change | Tests | Still works | Protected |
|---|---|---|---|---|---|
| Require sign-in on every API route (#23) | `middleware/apiGate.js` | No | Sweep: 557 routes | Yes | Yes |
| Limit pages and APIs by role (#25) | `lib/roleAccess.js`, `config/roleAccess.js` | No | Sweep, 14 unit tests, probe | Yes, with the gaps in B-003 and B-004 | Yes for what is ruled |
| Tie customer logins to one customer account (#26) | `lib/customerScope.js`, `services/portalService.js` | Yes | Sweep: 31 checks | Yes | Yes |
| Real online store (#19) | `routes/ecom.js`, `services/ecomService.js` | Yes | Simulation, sweep, browser | Yes | Yes |
| Real customer portal (#20) | `routes/portal.js` | No | Sweep | Yes | Access yes; content partly |
| Real online order inbox (#17) | `routes/onlineOrders.js` | Yes | Simulation, sweep | Yes | Yes |
| Real pricing, tax and processing menus for order intake (#16) | `routes/intakePricing.js`, `intakeProcessing.js` | Yes | Sweep (47 + 43 checks), unit | Yes | Yes |
| Real remnant inventory and pricing (#18) | `routes/remnants.js`, `services/remnantService.js` | Yes | Reads only | Lists and prices work. Nothing creates a remnant | No |
| Real processing recipes (#21) | `routes/processingRecipes.js` | Yes | None that succeeds | Screen opens | No |
| Real analytics (#22) | `routes/demandShaping.js`, `compressionMetrics.js`, `onlineSettings.js` | Yes | Reads; browser check of labels | Figures are from the database. Online cut-off settings are not saved (X-007) | Partly |
| Save v1 inventory in the database (#13) | `routes/inventoryV1.js`, `inventoryV1Store.js` | Yes | None that succeeds | Works on its own tables; conflicts with the main stock list (B-009) | No |
| Save OrderHub data in the database (#5) | `routes/orderHubRoutes.js`, `orderHubStore.js` | Yes | None that succeeds | Works on its own tables; conflicts with sales orders (S-021) | No |
| Save POS counter sessions in the database (#6) | `routes/pos.js`, `workflows/pos/sessionStore.js` | Yes | Simulation: 2 session sales per cycle | Session sale works; will call does not (X-008); three routes broken (B-006) | Partly |
| Save Stop-Work events in the database (#7) | `routes/stopWork.js`, `stopWorkStore.js` | Yes | None that succeeds | Server saves; the screen is a sample and does not call it | No |
| Save pipeline runs and dispatch divisions (#8) | `routes/pipelineRoutes.js`, `dispatchRoutes.js` | Yes | None that succeeds | Not verified | No |
| Save the exceptions feed (#11) | `routes/eventsV1.js` | Yes | Reads | Not verified | No |
| Run the schedule optimizer on real jobs (#12) | `routes/optimizationV1.js` | No | None | Not verified | No |
| Save the print queue (#14) | `routes/printQueue.js` | Yes | None that succeeds | Not verified | No |
| QC Inspection Module (February) | `routes/qcRoutes.js` | Yes | Pass path (Workstream 4) | Pass works | Partly |
| Material Tracking: packaging, drop tags, custody (February) | `routes/materialTrackingRoutes.js`, `dropTagRoutes.js` | Yes | None that succeeds | Screens open on real data | No |
| Persist dispatch data (February) | `routes/dispatchRoutes.js`, `operationsRoutes.js` | Yes | None that succeeds | Screens open on real data | No |
| Asset Registry and Work Order Center on the real database (February) | `routes/assets.js`, `maintenanceOrders.js` | Yes | None that succeeds | Two real screens; pass the whole request to the database (B-007) | No |
| Spec inheritance (February) | `routes/specInheritance.js` | No | None | Not verified | No |
| Customer Preferences (February) | `routes/customers.js` | Yes | Sweep: a customer reads only its own | Yes | Partly |
| System audit: core workflow repairs (#29) | orders, shipments, jobs, stock, invoices, returns, documents | Yes | Simulation, sweep, unit | Yes | Yes |
| Phase 2 workstreams 1 to 6 (#30) | See `qa/phase-reports/phase2-summary.md` | 4 SQL files not yet applied to the live database | All gates | Yes | Yes |

## Patterns across the history

1. **Unverified "real" conversions.** Eleven pull requests on 10 November each moved a module to the database. Six of them (second stock list, order hub, stop work, pipeline, exceptions, print queue) have no test that makes a change succeed, and two created records that duplicate core records (B-009).
2. **Screens before servers.** 58 screens exist with no server behind them. The schema has 52 tables with no code. Both come from the first build (X-009, B-017).
3. **Later work that changed earlier behaviour on purpose**: sign-in on every route (#23) and role limits (#25) closed routes that earlier commits had left open; the Phase 2 workstreams replaced sample dashboards with database figures or an error. No case was found of a later commit silently undoing an earlier fix. This was checked by the gates passing on the final code, not by reading every diff.
4. **Abandoned code**: 45 frontend files and 5 server files that nothing imports, and three counter-pricing routes that cannot work (B-013, B-006).
5. **Regression protection is concentrated**: 26 of 208 commits added tests, all from 12 November on. Everything built before that is protected only where the simulation, sweep or browser suites happen to reach it (B-016).

## Not done in Phase 1

The design files and `docs/` were not compared line by line with the code, so a requirement that was written down and never built would be missed here unless it is also on the program brief's capability list (those are in `system-inventory.md`, "Capabilities the code does not contain").
