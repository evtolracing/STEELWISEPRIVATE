# New order to Run Dispatch: audit and fixes

Written 2026-11-20. The owner reported: saving a new order does not work properly, a saved order does not show under New Orders on the Order Board, and Run Dispatch does not work. He asked for an audit, fixes, and to watch the flow in the app browser.

## Status: CONDITIONAL. Six problems fixed and tested on the local QA database. No database update. Not merged, not yet seen on the live site.

## How the flow works

1. Order intake (`/orders/intake`): Save Draft, then Submit.
2. Each line of a submitted order becomes one work order (a job) with status ORDERED. The Order Board shows jobs, not orders. ORDERED jobs are the New Orders column.
3. On the board, click the job and choose Plan Job. This gives the job its route and moves it to Planned.
4. On the shop floor, Run Dispatch places the planned operations of the chosen branch on machines. It does nothing for a job that has no route.

## What was wrong

| # | Problem | Cause | Fix |
|---|---|---|---|
| 1 | "Save failed" with no reason | The server's reason was dropped | The message says why: "The draft was not saved. ..." |
| 2 | An empty line could be submitted. Lines added after Save Draft were left out of the submitted order | Submit sent the order as last saved, not as on screen, and did not check the lines | Submit checks every line, names the line at fault, saves the screen, then submits |
| 3 | A submitted order was not on the Order Board | Work orders were made only by a separate Create Work Orders button on the order's page | Submit makes the work orders in the same step (unless the order is on credit hold). The message says how many are in New Orders |
| 4 | An order could not be found on the board | Cards and search knew the job number only | Cards show the order number, search finds it, New Orders lists newest first, the order page lists its work orders with "See on Order Board" |
| 5 | Plan Job failed with "Unknown or inactive work center type: SAW" and started on the wrong branch | Routing templates used fixed type names that are not in the database; the dialog defaulted to the first branch | Templates use the branch's real work center types, only fitting templates are offered, the dialog starts on the order's branch, machines are those of the chosen branch |
| 6 | Run Dispatch seemed to do nothing | Unplanned jobs have nothing to place and the screen did not say so | The message says how many new jobs still need Plan Job and where to do it |

The live server logs for the owner's session showed no server error, and his Run Dispatch calls answered 200 before the phase 5 merge. Phase 5 did not cause these problems.

## What was built

| Piece | Where |
|---|---|
| Line checks before submit | `src/frontend/src/pages/Orders/intakeChecks.js`, `CSRIntakePage.jsx` |
| Work orders on submit | `workOrdersFor` in `src/backend/src/routes/intakeOrders.js`; `submitOrder(id, { createWorkOrders })` in `services/intakeOrdersApi.js` |
| Order number on jobs | `src/backend/src/routes/jobs.js`; `ModernJobCard.jsx`, `ModernKanbanBoard.jsx` |
| Work orders on the order page | `pages/Orders/OrderDetailPage.jsx` |
| Templates and default branch | `components/jobs/routingTemplates.js`, `JobPlanningDialog.jsx` |
| Dispatch message | `apps/shopfloor/dispatchMessage.js`, `WorkCenterSelectPage.jsx`; `notPlannedCount` from `routes/dispatchRoutes.js` |

## Evidence (all run in this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 354 of 354 (6 new in `test/orderFlow.test.js`) |
| The flow in a browser (`qa/sim/ui-order-flow.cjs`, now in the gate script) | 23 of 23: empty line refused, draft saved, lines added after a save are kept, submit puts the jobs in New Orders, the order page lists them, search by order number, Plan Job with a template, Run Dispatch places the job and reports unplanned ones |
| Full gate suite on a rebuilt QA database | See below |
| Lint, frontend build | 0 errors; build succeeds |

### Full gate suite

Pass: three simulation cycles (0 reconciliation problems), branch boundary 39, phase 2 integrity 82, phases 3 to 8, ten browser suites, six role matrix suites, the new order flow suite 23, phase 9 screens 232, ledger sandbox, phase 9.5 screens and load, phase 11 scenarios, phase 12 certification and manual, lint, build.

Not passing:

| Item | Why |
|---|---|
| Screen ratchet: effects that read a value they do not list, 39 against 38 | Caused by this work (`OrderDetailPage.jsx`). Fixed; rerun alone gives 38, and the order flow suite was rerun after it (23 of 23). Not rerun inside the full suite |
| Hard to read text, 18 against 17 | The "Tomorrow" figure on the role dashboard is brand orange on grey. Not from this work: the figure appears when there is load for tomorrow. Changed to the readable orange; that screen rerun alone shows 0. Not rerun inside the full suite |
| Security sweep, order entry section, 44 of 45 | The check reserved the first stock item by id, which this time sat at a branch the clerk cannot see (answer 404). A weakness in the check, not in the app. The check now picks stock at the clerk's branch. Rerun on the database left by the full suite: that check passes. Two other sections showed problems on that used database only; they passed in the full run. A sweep on a fresh database with the changed check is NOT VERIFIED |
| Phase 9.5 ledger, 157 of 158 | Same before this work |
| Phase 10 backup and restore group, 6 of 20 | Needs a second PostgreSQL server on port 5433 |
| Phase 11 enterprise run: three response times over the proposed limits | Flag known before this work. 545 jobs, 5,187 of 5,187 transactions, books agree |

NOT VERIFIED: anything on the hosted site. Submit with work orders for an order that goes on credit hold (the code leaves the work orders out and returns the hold; no test drives it). The screens on a phone.

## Open decision

Submit now makes the work orders at once. The alternative offered to the owner, showing submitted orders on the board before work orders exist, was not built.

## Directive gates

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One function makes work orders for both the button and submit; rules for lines, templates and the dispatch message are small pure modules |
| B Functional completeness | CONDITIONAL | Credit hold path not tested |
| C Cross-layer integrity | PASS | The browser suite runs intake to dispatch against the server and database |
| D Data integrity | PASS | No schema change; work orders are still made once per line |
| E Security | NOT ASSESSED beyond the sweep | No access rule changed |
| F Reliability | CONDITIONAL | A failure to make work orders after a good submit is reported, the order stays submitted |
| G Performance | NOT ASSESSED | Run Dispatch does one extra count |
| H User experience | CONDITIONAL | One browser at 1440 wide |
| I Regression | CONDITIONAL | Full suite run; three items from or near this work fixed and rerun alone |
| J Documentation | CONDITIONAL | This report. The manual was not updated |

Readiness: CONDITIONAL.

## Next

After the owner says merge: run one order marked TEST on the live site in the app browser while he watches, as he chose.
