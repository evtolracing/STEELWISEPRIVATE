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

## Addendum, 2026-11-20: orders submitted before the fix

Pull request 43 was merged on the owner's word and checked on the live site: test order SO-00075 was submitted, its job JOB-00069 appeared under New Orders and was planned.

The owner then reported that the seven orders submitted before the fix "have no way to create a work order". Cause: the Orders list (`/orders`) opens a side panel that offered Print and Email only. The Create Work Orders button was on the order's own page, which the list never linked to.

Fix (`src/frontend/src/apps/orders/OrdersPage.jsx`, `nextStepFor` in `pages/Orders/intakeChecks.js`): at the top of the panel, a submitted order shows a note that it is not on the Order Board yet and a Create Work Orders button; a confirmed order shows See on Order Board; every order shows Open Order. After the button, a message says how many work orders are under New Orders, with a link to the board.

Evidence (this session, local QA database): unit tests in `test/orderFlow.test.js` 7 of 7; `qa/sim/ui-order-flow.cjs` 28 of 28 (5 new checks: an order submitted with no work orders, the note, Open Order, the button makes the job, the button is then replaced by the board link); `ui-sales` 24, `ui-phase5` 14; the Orders screen at three sizes: no hard to read text, no overflow; lint 0 errors; build succeeds; effect ratchet 38 of 38. The full gate suite was not rerun for this addition (NOT VERIFIED as a whole).

Also seen on the live site, not changed: orders are taken for branches that have no machines (for example Detroit Service Center), while the saws are under Detroit Branch - Bay A and Jackson. A job planned at a branch with no machines is not placed by Run Dispatch. While the Plan Job box loads, it briefly says no template fits.

## Addendum 2, 2026-11-20: clicking an order in the list did nothing

Pull request 44 was merged on the owner's word and seen on the live site. The owner then reported that clicking an order under All Orders does nothing. Cause: below 900 px wide the details panel sits under the full-height list, out of sight, so a click changed something nobody could see.

Fix (`OrdersPage.jsx`): in a narrow window a click opens the order's own page, and the hidden panel is not drawn. In a wide window a click still shows the details beside the list, and a double click opens the order's page.

Evidence (this session, local QA database): `qa/sim/ui-order-flow.cjs` 31 of 31 (3 new checks: narrow click opens the order, the order shows its work order, wide double click opens it); the Orders screen at three sizes: no findings; lint 0 errors; build succeeds; effect ratchet 38 of 38. NOT VERIFIED: the full gate suite; `ui-shipping` could not start on the used QA database ("no test customer or branch") and was not rerun on a fresh one.

## Addendum 3, 2026-11-20: one order from intake to shipping on the live site

Pull request 45 was merged on the owner's word. He then asked for one order to be run through the whole process in the app browser, and for anything found broken to be fixed.

### What was run on the live site (order marked TEST, with the owner's approval)

| Step | Result |
|---|---|
| Intake: SO-00076, Eli White, PO "TEST 2 - DO NOT SHIP", 100 LB of A36 plate | Submitted, JOB-00073 under New Orders |
| Plan Job (saw, Detroit Branch - Bay A) | Planned |
| Run Dispatch at Bay A | Placed on KASTO 2 |
| Work center queue: START, COMPLETE | Job to Waiting QC |
| QC: inspection INS-00007, passed | Job to Packaging |
| Packaging: Mark Ready | Job to Ready to Ship |
| Shipping: shipment SHP-00053 created | Created |
| Dispatch (the owner chose "Dispatch it") | REFUSED: no stock is reserved on the order. Nothing was invoiced. The shipment is still Not yet loaded |

### What was found and fixed

| # | Problem | Fix |
|---|---|---|
| 1 | No screen could reserve stock for an order, and a shipment cannot be dispatched without it. No order could ship from the screens | New "Stock for this order" panel on the order page (`components/orders/OrderStockPanel.jsx`, `pages/Orders/reserveRules.js`): each line shows ordered and reserved, Reserve Stock lists available stock in the line's unit and grade with the order's branch first, the server's own refusals are shown. The shipment page links to it when nothing is reserved |
| 2 | An inspection started with no inspector could not be reached: it was in no tab and had no button | Starting an inspection opens its checklist. The queue row offers Open Inspection. The In Progress tab and count include it (`pages/QC/qcRules.js`, `QCDashboardPage.jsx`, `qcRoutes.js`) |
| 3 | The work center queue showed record ids for the job, the order and the branch, and a thickness of 0 | Job number and customer, order number, branch name (`apps/shopfloor/queueLabels.js`, `dispatchRoutes.js`) |
| 4 | In a narrow window START and COMPLETE were under the full-height job list | The job in hand and its buttons come first, the list after |
| 5 | A row clicked in the queue while the list was loading or refreshing jumped back to the first row | The refresh keeps the row chosen at the moment its answer arrives |
| 6 | The inspection page printed the job notes as raw JSON, and the "100% complete" chip was hard to read | Notes in words; outlined chip |
| 7 | Due dates showed a day early on the shop floor, packaging, staging and the Orders list | `utils/calendarDate.js`: a date with no time of day is shown as the day it names |
| 8 | Plan Job said no template fits while it was still loading | The note waits for the work center types |
| 9 | Intake showed "Draft #" with a record id | "Draft saved" |

Not changed: an order taken for a branch with no machines still has to be planned at another branch by hand. In a narrow window the Description column of an intake line is squeezed. The work center and print queues poll the server often (about 1,800 requests in six hours for one open tab). A reservation cannot be taken back from a screen, except by replacing the order's lines.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 360 of 360 (5 new in `test/orderFlow.test.js`: open inspections, notes in words, calendar dates, queue labels, reservation rules) |
| `qa/sim/ui-floor-to-ship.cjs` (new, added to the gate script) | 26 of 26, run three times: queue names and layout at 800 wide, START and COMPLETE, inspection opens and can be found again, packaging, the shipment links to the order, Reserve Stock (offer, refusal of too much, saved), dispatch raises the invoice |
| `qa/sim/ui-order-flow.cjs` | 31 of 31 |
| `qa/sim/ui-shop.cjs` | 31 of 31 |
| Lint, screen ratchets, build | 0 errors; ratchets at their ceilings (effects 38 of 38, click-only rows 0); build succeeds |

NOT VERIFIED: the full gate suite; `ui-shipping` and the QC suites on a fresh database; the new screens on the live site; phones.

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | Rules in small pure modules; the panel uses the existing reservation endpoint |
| B Functional completeness | CONDITIONAL | A reservation cannot be released from a screen |
| C Cross-layer integrity | PASS | The browser suite runs queue to dispatch against server and database |
| D Data integrity | PASS | No schema change; the server's reservation rules are unchanged |
| E Security | NOT ASSESSED | No access rule changed |
| F Reliability | PASS | Refusals from the server are shown where the person is working |
| G Performance | NOT ASSESSED | The stock list asks for up to 200 items twice |
| H User experience | CONDITIONAL | Checked at 800 and 1280 wide only |
| I Regression | CONDITIONAL | Three browser suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report. The manual was not updated |

Readiness: CONDITIONAL.
