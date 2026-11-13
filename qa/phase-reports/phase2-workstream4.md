# Phase gate report: Phase 2, Workstream 4 (manufacturing execution)

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11.

## Completion status: PARTIALLY COMPLETE

This is not a pass. Fourteen findings are fixed, each with an automated check. One is mitigated (M-011: the five production quality screens and the BOM screen are labelled as samples). Two are open and need the owner (M-016: completing a coil work order moves no stock; M-017: which backward moves a job may make). One is partly fixed (M-018: the help manual). A large part of the shop floor was not examined and is listed in section 1. Nothing here is live: pull request 30 is not merged, and four database updates from earlier workstreams still wait for the owner. This workstream needs no database update.

## 1. Scope and discovery

In scope: jobs and the job screen, the two order boards, the Schedule screen, Time Tracking, coil work orders (list, form, detail and their server routes), the old operator screen at `/shop-floor`, the production quality screens, the BOM screen, and the frontend calls for jobs, work centers, work orders, BOMs and batches.

How it was examined: each screen was read against the server routes it calls; every place in the server that changes a job's status was listed (twelve, in six files); the frontend calls were checked against the route table with `qa/tools/api-contract.mjs`; the job, schedule, time tracking and work order screens were then operated in a real browser as an operator and as a manager.

Not examined: the dispatch engine and how it assigns operations, the planning boards, processing recipes and their versions, the shop floor queue screens beyond what the simulation drives through the API, packaging and drop tags, maintenance, downtime, capacity limits, scheduling by drag and drop, and labor costing. These are listed in the scorecard and in `remaining-risks.md`.

## 2. Findings

Eighteen, M-001 to M-018, in `engineering-quality-findings.md` under "Workstream 4", each with evidence, risk, status and proof. Three were critical: the job screen showed one sample job for every job and saved nothing; the Schedule screen showed random work centers and jobs; the old operator screen recorded output into nothing.

One was found while writing the tests, not by reading: starting a quality inspection saved it and then answered "Failed to create inspection" (M-015). The faulty line came from the numbering change made earlier on this branch (commit f3db70a), so it is a regression this program introduced and has now fixed. It was never live: that commit is not on the main branch.

## 3. Root causes

- Screens were built on sample generators with the real call left as a comment ("In production: ..."), and the routes were added to the menu anyway (M-001, M-008, M-010, M-011).
- A job's status is changed in twelve places and none of them recorded the change, so there was nothing to build a history from (M-002).
- A single `notes` field was used both for the job's standing instructions and for the reason typed with a move (M-003).
- The work order routes passed the request body to the database and updated by id with no check of the current status (M-005, M-006).
- A fallback to sample data on error was treated as friendlier than an error (M-009, M-013).
- A variable was renamed inside a helper and a log line outside it still used the old name; no test called the route (M-015).

## 4. Changes implemented

Jobs: every status change, from every route (the status routes, edit, start, complete, ship, the shipment, the staging screen, inspection results and operations), is written to the audit log with the person, the status before and after, and the reason. The job history is read from those records. A reason typed with a move is kept with the move and no longer replaces the job's notes. Assigning a job checks that the user is on file and active, refuses a finished job, and is recorded. Jobs can be listed for one day.

Job screen: rebuilt on the real job and its real history, with a Change status dialog that saves and shows the server's reason when a move is refused. The order boards and the schedule open it.

Schedule: the real work centers and the jobs really scheduled for the day. "Utilization" was a random number; it is now "Booked", the share of the day with a job scheduled. Jobs with no work center are counted in a notice. The "AI-optimized" claim is removed.

Time tracking: the generator of random hours is removed. A load error shows an error and an empty report.

Work orders: the server reads an allow-list, checks the source stock item, follows status rules (Draft, Ready, In progress, Quality hold, Complete, Cancelled), works out yield from the weights, refuses more out than went in, and records each step with the person. The list and detail screens are rebuilt on what the server sends, with working Release, Start, Complete and Cancel. The fixed "AI tip" on the form is removed. The detail screen states that completing a work order does not change stock.

Old operator screen: deleted; its address opens the real shop floor.

Production quality and BOM screens: wrapped in the "sample screen" notice, which now points to the real screen for that work.

Inspections: starting one answers with the inspection.

Cleanup: 73 unused frontend calls removed; the sample-job reply when no database is configured is now a 503.

## 5. Files modified

Backend: `lib/jobHistory.js` (new), `lib/workOrderRules.js` (new), `routes/jobs.js`, `routes/workOrders.js`, `routes/shipments.js`, `routes/materialTrackingRoutes.js`, `routes/qcRoutes.js`, `routes/operationsRoutes.js`, `test/jobHistory.test.js` (new).

Frontend: `pages/JobDetailPage.jsx`, `pages/SchedulePage.jsx`, `pages/TimeTrackingPage.jsx`, `pages/OrderBoardPage.jsx`, `pages/ModernOrderBoardPage.jsx`, `pages/WorkOrders/WorkOrderListPage.jsx`, `WorkOrderDetailPage.jsx`, `WorkOrderCreatePage.jsx`, `pages/ShopFloorPage.jsx` (deleted), `components/common/SampleScreen.jsx`, `router/AppRouter.jsx`, `constants/permissions.js`, `api/jobs.js`, `api/workCenters.js`, `api/workOrders.js`, `api/index.js`, `api/boms.js` and `api/batches.js` (deleted), `help/manualContent.js`.

QA: `qa/sim/security.mjs` (section 19), `qa/sim/ui-shop.cjs` (new), `qa/tools/report.mjs`, and the registers in `qa/`.

## 6. Database changes

None. Job and work order history use the existing audit log table.

Four files from earlier workstreams still wait for the owner, in this order: `20261113031734_document_links_any_record.sql`, `20261113052550_billing_returns_file_store.sql`, `20261113062621_fk_indexes_and_stock_checks.sql`, `20261113150000_stock_balance_identity.sql`.

## 7. Tests added

- Unit: `jobHistory` and `workOrderRules`, 8 tests. Total now 87.
- Sweep section 19, "Shop floor records: who moved a job, and work orders that follow the rules": 51 checks.
- Browser: `qa/sim/ui-shop.cjs`, 30 checks on the job screen, order board, schedule, time tracking, work orders, the old operator address and the sample notices.

## 8. Tests actually executed (this session, local)

| Test | Result |
|---|---|
| Unit tests | 87 of 87 pass |
| Three 50-job cycles, seeds 8001 to 8003, rebuilt QA database | 150 of 150 pass; 2,134 API steps; 2,357 checks; reconciliation 0 problems |
| Job moves recorded during the three cycles | 788, every one with a person |
| Security and safeguards sweep | 19 of 19 sections pass |
| Section 19 (first 48 checks) against the commit before the fixes | 42 of 48 fail there |
| The three inspection checks added later | Seen failing before the fix to M-015, passing after |
| Shop screens operated in a browser | 30 of 30 checks pass |
| Sales screens operated in a browser | 24 of 24 checks pass |
| Stock screens operated in a browser | 22 of 22 checks pass |
| Screen check | 124 of 124 screens open. The job screen now asks the server for the placeholder job the check uses and gets a 404, as the other record screens do |
| Frontend production build | Passes |
| Browser checks against the code before the fixes | NOT RUN |
| Time tracking error path (server unreachable) | NOT RUN |
| Jobs list with no database configured | NOT RUN |
| Performance of the schedule or job routes | NOT RUN |
| Lint | NOT RUN: none configured (E-016) |
| Accessibility | NOT RUN |

## 9. Regression results

No previously passing job, sweep check or screen regressed. No simulation expectation was changed. Behaviour changed on purpose: a note sent with a job move is stored in the history, not in the job's notes; assigning a job to an unknown or inactive user is refused; creating a work order ignores every field but type, stock item, priority, date, notes, weight in and cut pattern; a work order must be In progress to be completed; `/shop-floor` redirects to `/shopfloor`.

## 10. Connected-module verification

- Orders, reservation, production, inspection, packaging, shipping, invoices, payments, returns and the counter were rerun in the three cycles with job moves recorded on every route, and pass.
- The shipment marks its jobs shipped and records each one (151 in the cycles).
- An inspection result moves the job and records the move with the inspector (Sweep 19). The pass and fail results were not checked one by one, only rework: NOT VERIFIED for pass, fail and conditional pass beyond the code being the same call.
- Work orders are not connected to jobs, orders or stock (M-016), so there is nothing to verify there.
- Customer and division isolation (sweep section 5) still passes.
- The hosted site was not touched.

## 11. Remaining findings and blockers

Decisions needed from the owner:

1. Coil work orders (M-016): do they stay as a module beside jobs? If yes, completing one should use up the source item and add the pieces made.
2. Production quality and bills of material (M-011): build them, or take the six sample screens off the menu.
3. Which backward moves a job may make (M-017). Today a job in process can be sent back to ordered.
4. Rules 39 to 41 to confirm (job history, assigning, work order moves).

Carried: M-018 (the rest of the help manual, Workstream 6), and everything still open from Workstreams 2 and 3, including the card on the stock list.

## 12. Continuation point

Workstream 5, Shipping and Financial Operations. Start with I-018 (accepted web orders carry no tax or total), then shipping, freight, invoices, payments, credits and returns: screens against routes first, as here. Setup: `qa/README.md`; rebuild the QA database, run one cycle before the sweep, and start the QA server on 3001 with the frontend on 5199 for the four browser suites.
