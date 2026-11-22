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

## Addendum 4, 2026-11-21: Time Tracking showed nothing

The owner reported that Time Tracking is not working and should be fully functional.

### What was wrong

| # | Problem | Severity | Fix |
|---|---|---|---|
| 1 | The Time Tracking screen was always empty. It looked for the clock records inside the list of operations, and that list never carried them. Checked read-only on the live site: 20 operations, 18 with time on them, 0 records reaching the screen | P1 | New read-only endpoint `GET /api/v1/operations/time-entries` (`lib/timeEntries.js`) returns the clock records, newest first, with the job, order, customer, step, work center, branch and operator by name. The screen reads it |
| 2 | Had records arrived, the screen would have shown record ids for the job and work center, and no duration (the records carry no stored duration) | P2 | Names from the server; the duration is worked out from start and end; a running clock counts up on screen |
| 3 | The From and To dates were read as London midnight, so a day could start or end hours off | P2 | The whole of both days in the viewer's own time zone (`pages/timeTrackingRules.js`); the server filters by those instants |
| 4 | "Downtime" and "Utilization" were sums that do not mean what the labels said (time worked before a pause was counted as downtime) | P2 | Replaced by figures the records support: steps finished, clocks running now, steps on hold, pauses with a reason, operators. The share bars are labelled Share of Time |
| 5 | The CSV file broke on a name with a quote in it and carried ids | P3 | Quotes kept inside the cell, names, hours as a number, cells that look like formulas are not run |
| 6 | The running clock on the work center queue always read 0s: it asked for a field the server never sent, and restarted on every refresh | P2 | The queue sends the step's clock (time already closed, and when the open entry started); the screen counts on from there, so pausing and opening the screen again keep the time |

Filter lists (branch, work center, operator) now come from the records in the chosen dates, so someone who has since left still appears. The job number opens the job. A list cut short at 1,000 entries says so.

No database change. No access rule changed: the new endpoint sits in the same router as the other operations reads.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 371 of 371 (11 new in `test/timeTracking.test.js`: entry and clock seconds, the address filter and its refusals, rows by name, date range in local time, card sums, filters, CSV) |
| `qa/sim/ui-time-tracking.cjs` (new, added to the gate script) | 18 of 18, run twice: the queue clock counts and carries on after reopening, a running entry is listed and counts, pause with a reason and completion give two entries, no record ids, Total Time above zero, Status and Operator filters, By Operator, By Work Center, the CSV file, To set to yesterday, bad date refused |
| `qa/sim/ui-floor-to-ship.cjs` | 26 of 26 |
| `qa/sim/ui-shop.cjs` | 31 of 31 |
| `qa/sim/ui-phase7.cjs` | 39 of 39 (includes the long-running clock notice on Time Tracking) |
| `qa/sim/phase12-ui.cjs` | 5 of 5 (includes: when records cannot be loaded the screen says so and shows no hours) |
| Lint, screen ratchets, build | 0 errors; ratchets at their ceilings (effects 38 of 38, click-only rows 0); build succeeds |

NOT VERIFIED: the full gate suite; the new screen on the live site (it reaches the live site only after merge); phones; a branch with more than 1,000 entries in the chosen dates.

Not changed: there is no screen to correct a wrong entry (a clock left running overnight can only be closed by pausing or completing the step); time is tracked per step, not as attendance (clock in and out for a shift).

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One read endpoint; sums in pure modules on both sides |
| B Functional completeness | CONDITIONAL | Entries cannot be corrected from a screen |
| C Cross-layer integrity | PASS | The browser suite starts, pauses and completes a step and reads it back on the screen |
| D Data integrity | PASS | Read only; no schema change |
| E Security | NOT ASSESSED | No access rule changed; the route sweep was not re-run |
| F Reliability | PASS | A failed load shows a notice and no hours (phase 12 scenario) |
| G Performance | NOT ASSESSED | One query capped at 1,000 rows by default, 5,000 at most; `startAt` has no index |
| H User experience | CONDITIONAL | Checked at 1280 wide only |
| I Regression | CONDITIONAL | Five browser suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report. The manual was not updated |

Readiness: CONDITIONAL.

## Addendum 5, 2026-11-21: job numbers follow the order number

The owner reported that sales order and job numbers did not match (SO-00078 made JOB-00075), which confused tracking, and chose the format below.

### What changed

| Case | Before | Now |
|---|---|---|
| Line 1 of SO-00078 | JOB-00075 (its own counter) | JOB-00078-1 |
| Line 2 of the same order | JOB-00076 | JOB-00078-2 |
| A second job for a line (after a cancellation, or a split) | next counter number | JOB-00078-1B, then 1C |
| A job for the order with no line | next counter number | the number after its lines and jobs, JOB-00078-3 |
| An order that is not SO- | next counter number | its whole number is kept, JOB-TO-00012-1 |
| A job with no order | JOB-NNNNN | its own series, JS-00012 |

`src/backend/src/lib/jobNumbers.js`, used by both places a job is made (`routes/intakeOrders.js` Create Work Orders, `routes/jobs.js` POST /api/jobs). The Ops Cockpit Expedite action finds old and new numbers. Jobs numbered before this keep their numbers: the old ones never end in "-line", so they cannot collide with the new ones. No database change.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 379 of 379 (8 new in `test/jobNumbers.test.js`) |
| `qa/sim/ui-floor-to-ship.cjs` | 27 of 27 (new check: the job made from SO-NNNNN is JOB-NNNNN-1) |
| `qa/sim/ui-time-tracking.cjs` | 18 of 18 |
| `qa/sim/phase7-manufacturing.mjs --only 1` | 15 of 15 (the job number now must start with the order's digits) |
| `qa/sim/phase9-ui.cjs --cat MAKE` | 24 of 26. The two failures (schedule Today button, schedule Queue View) fail the same way with this change taken out, so they are not caused by it |
| Lint, screen ratchets, build | 0 errors; ratchets at their ceilings; build succeeds |

NOT VERIFIED: the full gate suite; the live site.

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One module makes every job number |
| B Functional completeness | PASS | Both creation paths covered; old numbers kept on purpose |
| C Cross-layer integrity | PASS | Browser suite checks the number from intake to the shop floor |
| D Data integrity | PASS | The unique rule on the job number still decides; a refusal for another reason is not hidden |
| E Security | NOT ASSESSED | No access rule changed |
| F Reliability | PASS | A taken number moves to the next letter |
| G Performance | NOT ASSESSED | A job with no line reads its order's lines and jobs once |
| H User experience | PASS | The order is readable from the job number |
| I Regression | CONDITIONAL | Four suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report. The manual was not updated |

Readiness: CONDITIONAL.

## Addendum 6, 2026-11-21: shop floor, planning and workflow board counts

The owner reported that the shop floor figures were wrong (Total Operations 20, Pending 1, Scheduled 1, In Process 0, Complete 18, Unassigned 0), that the division filters were wrong and the job counts wrong, and asked for a full audit of the shop floor screens.

### What was found (live site, read only, 2026-11-21)

| # | Screen | Problem | Severity |
|---|---|---|---|
| 1 | Shop Floor | The header counted steps, not jobs, and "Complete" was every step ever finished. The live branch had 26 open jobs; the header showed 2 open steps | P1 |
| 2 | Shop Floor | "Done" on each machine card was every step ever finished there | P2 |
| 3 | Shop Floor | It ignored the branch picked in the top bar, and while loading said "No work centers at this location" with 0 types | P2 |
| 4 | Shop Floor | No division filter | P2 |
| 5 | GET /api/jobs?locationId= | Matched only jobs with the old machine field set, which planning never fills: a branch's new jobs were missing from every branch filter (also the late-jobs list) | P1 |
| 6 | Planning | Machine Active and Queued looked at that old field, so almost every machine showed 0; counts were by job status only (a SCHEDULED job with no route looked scheduled) | P2 |
| 7 | Workflow board (/planning/workflow) | Branch list was made up (Phoenix, Denver, Riverside); every job showed "No WC" | P1 |
| 8 | /production | Branch, machine and division lists were made up (Location 1, Cutting, Division A); "No customer" on every card; "Move to" buttons outside the job's checks | P1 |
| 9 | /production/shop-floor | Started and finished whole jobs, bypassing their steps | P1 |

Data seen on the live site, not changed: nine demonstration jobs (J-DEMO-001 to 010, J-C2007) are SCHEDULED with no route and orders with no branch. They now show as Not planned under All branches only.

### What was changed

One rule for every production screen, in `src/backend/src/lib/productionView.js`: a job's branch is its plan's branch, else its machine's, else the selling branch; its division likewise; its machine is the machine of its current step; its stage is Not planned, Waiting for a machine, Queued, Running, Steps done, Waiting QC, Packaging, Ready to ship or On hold. New `GET /api/jobs/overview?locationId=&division=&since=` returns the open jobs with these, the counts, and per machine the steps queued, running and done since the start of the viewer's day. The branch boundary applies to it as to every read.

- Shop Floor: header is In production, Not planned, Waiting for a machine, Queued, Running, Steps done today, with a line for jobs past the floor; machine cards show Queued, Running, Done today; a Division filter from the divisions on file; starts at the top bar's branch; keeps the spinner until its branch is known.
- Planning: counts by stage and machine cards from the overview, with Branch and Division pickers.
- Workflow board: columns by stage, real Branch and Division pickers, each card with order, customer, step, machine, branch, division and due date, and a link to the job.
- /production opens the workflow board; /production/shop-floor opens the Shop Floor.
- GET /api/jobs and /api/jobs/sla-risk find a job at a branch by the same rule.

No database change.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 389 of 389 (10 new in `test/productionView.test.js`) |
| `qa/sim/ui-production-overview.cjs` (new, added to the gate script) | 24 of 24, run twice: a new job is found at its selling branch; the overview stages it Not planned, Queued, Running, then past the floor with a step done today; the Shop Floor, Planning and workflow board figures equal the server's; division filter; real branch and division lists; old addresses redirect |
| `qa/sim/phase7-manufacturing.mjs --only 7` | 22 of 22, with 3 new checks: the overview agrees with the queue; another branch's manager sees no machines and only jobs of its own orders |
| `ui-floor-to-ship`, `ui-time-tracking`, `ui-phase7`, `phase12-ui` | 27 of 27, 18 of 18, 39 of 39, 5 of 5 |
| `ui-shop` | 30 of 31. The failing check (order board: clicking a job opens its screen) fails the same way with this change taken out |
| `phase9-ui --cat MAKE` | 24 of 26. The two schedule failures fail the same way without this change; the production board scenario was updated to the new stage names |
| Lint, screen ratchets, build | 0 errors; ratchets at their ceilings; build succeeds |

NOT VERIFIED: the full gate suite; the live site after merge; phones.

Not changed, for the owner: the Schedule screen still places jobs by the old machine field (its "Booked" share reads 0%); the Order Board header total counts recently shipped jobs as well as open ones.

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | One server rule and one endpoint feed three screens |
| B Functional completeness | CONDITIONAL | Schedule and Order Board header not changed |
| C Cross-layer integrity | PASS | Browser suite compares each screen figure with the server's |
| D Data integrity | PASS | Read only; no schema change |
| E Security | PASS | Branch boundary checked for the new endpoint (phase 7 scenario) |
| F Reliability | PASS | A failed load says so and shows no figures |
| G Performance | NOT ASSESSED | One read of up to 5,000 open jobs with their steps |
| H User experience | CONDITIONAL | Checked at 1400 wide only |
| I Regression | CONDITIONAL | Eight suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report. The manual was not updated |

Readiness: CONDITIONAL.

## Addendum 7: Schedule, Order Board totals and the demo jobs (2026-11-21)

The owner asked to fix the three items Addendum 6 left open ("yes fix anythng you find") and chose to cancel the demo jobs.

### What changed

- Schedule: a job is booked on the machine of the step it is on (its last step's machine once all are done; the old machine field only for a job with no plan). `GET /api/jobs?scheduledFrom&scheduledTo` returns `bookedWorkCenterId`. "Booked" counts only the part of each job inside the 6 AM to 4 PM grid, so a job spanning days no longer fills every day.
- Order Board: the header says Open jobs and counts open jobs only. Hot, Overdue and In progress skip the recently finished jobs the Completed column also shows, and a shipped job is never counted overdue. The toolbar shows "N open" and "M recently finished" apart.
- Database update `20261121200000_cancel_demo_jobs` (SQL Editor file made with `npm run db:sql-editor`): cancels J-DEMO-* and J-C2007 jobs that are open with no plan, with a note. On the live data that is 11 jobs (10 Scheduled, 1 In process), read through the live API without changes. The owner applies it.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 392 of 392 (3 new) |
| `qa/sim/ui-production-overview.cjs` | 28 of 28; the 4 new checks fail with the code change taken out (server restarted on the old code) |
| `qa/sim/db-cancel-demo-jobs.sh` (new, in the gate script) | 5 of 5 on a copy of the QA database: run twice, open demo jobs with no plan cancelled, shipped and planned ones and every other job unchanged, recorded once. It fails 4 of 5 with the update emptied |
| `ui-floor-to-ship` | 27 of 27 |
| `ui-shop` | 30 of 31, same pre-existing failure |
| `phase9-ui --cat MAKE` | 25 of 26; scenario 144 (two Today buttons on the Schedule) fails the same way as before |
| Lint, screen ratchets, build | 0 errors; ratchets at their ceilings; build succeeds |

NOT VERIFIED: the full gate suite; the live site after merge; the database update on the live database (the owner runs it).

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | The Schedule uses the same current-step rule as the other production screens |
| B Functional completeness | PASS | The three open items are done |
| C Cross-layer integrity | PASS | Browser checks compare the Schedule and Order Board figures with the server's |
| D Data integrity | PASS | The update is narrow, idempotent and tested twice on a copy |
| E Security | PASS | No new access; branch scope unchanged |
| F Reliability | PASS | No new failure paths |
| G Performance | NOT ASSESSED | The day's schedule now reads each job's steps |
| H User experience | CONDITIONAL | Checked at 1400 wide only |
| I Regression | CONDITIONAL | Five suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report. The manual was not updated |

Readiness: CONDITIONAL.

## Addendum 8: Locations a person can manage (2026-11-22)

The owner asked for real locations that can be added, changed and removed at any time with all their information, adding to be a super admin right, and people at each location to see only what they need. He reviewed the plan and decided: add and remove for the super admin and the tenant owner; details for those two and the admin; customers stay shared; a branch manager sees only their own people; older screens included. This addendum is the first step (plan steps 2 to 4). The visibility gaps, the clean-up of live data and the older screens follow.

### What was found

- No screen managed locations. The only way to add one was `POST /api/v1/dispatch/locations`, open to a production manager, scheduler or work center lead, with a name alone. No screen called it.
- A location held a code, name, type, one address line, city, state, postal code, country and three flags.
- Nothing told a branch from a storage area, so every active location was offered in every branch list.

### What changed

- Database update `20261122090000_location_details` (SQL Editor file made with `npm run db:sql-editor`): phone, fax, email, second address line, time zone, hours, manager, divisions, processes, floor area, sells from, ships from, notes, the day it was switched off, and a mark for a real branch. Existing top-level warehouses and yards, and any top-level location with orders, people, machines or plans, are marked as branches. **The owner applies it, before or with the deploy: the new code reads the new columns.**
- `/api/admin/locations`: list, read (with what is open there and whether it was ever used), history, add, change, switch off, switch on, delete. Rules in `lib/locationRules.js`.
  - A location is switched off only when nothing is open there (orders, jobs, stock, shipments, transfers, active machines, people, storage areas). Its people can be moved to another branch in the same step.
  - A location that was ever used is never deleted, only switched off.
  - Every change is written to the audit log.
- Permissions (catalog version 3): `locations:add` and `locations:remove` for the super admin and tenant owner; `locations:edit` for those and the admin. They show on the Roles screen. The dispatch add route is removed.
- Admin > Locations screen.
- Branch lists (top bar, order entry, dispatch and shop floor, users, stock) offer only active branches. Order entry also needs "sells from here".

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| Backend unit tests | 401 of 401 (9 new in `test/locations.test.js`; two role matrix expectations updated for the new rights) |
| `qa/sim/ui-locations.cjs` (new, in the gate script) | 40 of 40: who may add, change and remove at the server and on the screen; branch lists before and after; a storage area is in none; switch-off blocked with reasons, then done with people moved; a used location is not deleted, an unused one is; audit history |
| Database update | Run twice on a copy with the columns removed first: same result both times, recorded once; a rack inside a branch and a loose bin are not marked as branches |
| `ui-roles`, `ui-role-rights`, `ui-user-access`, `ui-production-overview` | 24 of 24, 19 of 19, 17 of 17, 28 of 28 |
| Lint, screen ratchets, build | 0 errors; ratchets at their ceilings; build succeeds |

NOT VERIFIED: the full gate suite; the live site; the database update on the live database; phones.

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | Rules in one pure module; permissions through the existing catalog and gate |
| B Functional completeness | CONDITIONAL | Steps 5 and 6 of the plan and the live clean-up are not in this change |
| C Cross-layer integrity | PASS | Browser checks compare the screen with the server and every branch list |
| D Data integrity | PASS | No delete of a used location; switch-off only when nothing is open; update tested twice |
| E Security | PASS | Open add route closed; rights checked at the gate for five roles |
| F Reliability | PASS | A failed load says so and shows no rows |
| G Performance | NOT ASSESSED | The list reads up to 2,000 locations with three grouped counts |
| H User experience | CONDITIONAL | Checked at 1500 wide only |
| I Regression | CONDITIONAL | Five suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report. The manual lists the new page; no manual chapter yet |

Readiness: CONDITIONAL. Deploy order matters: the database update first.

## Addendum 9: The first five locations, and two gaps in what a branch sees (2026-11-22)

The owner chose five locations to start: CT Charlotte, PV Potterville, L2 Lansing Steel, BC Battle Creek, JX Jackson Steel.

### What was found

- A job sold at one branch and planned at another was hidden from the branch that makes it: the branch boundary (`lib/branchScope.js`) looked at the order's branch and the machine's branch, but not the plan's branch. The job list's own filter already used the plan's branch, so the two disagreed.
- The users list and a user's record were open to every signed-in person in the company, whatever their branch. The owner's decision 4: a person held to branches sees only the people of those branches.
- `qa/sim/branch-boundary.mjs` failed 4 checks on the current QA data before any change here: it picked a stock item counted in pieces to reserve for a line counted in pounds.

### What changed

- Database update `20261122100000_first_five_locations`: adds the five as active branches that sell and ship, with the published name, address, phone and fax. A code already on file is left as it is. Email, hours and manager are left blank.
- `jobIn` in `lib/branchScope.js` now also matches the plan's branch (`dispatchJob.locationId`). Inspections follow, since they use the same rule.
- `visibleUsersWhere` in `lib/userAdminRules.js`, used by `GET /api/users` and `GET /api/users/:id`: head office sees everyone; anyone else sees the people of their branches and themselves. A login with no branch is seen by head office only.
- The sim now reserves stock counted in pounds.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| `qa/sim/db-first-five-locations.sh` (new, in the gate script) | 7 of 7: runs the SQL Editor file twice on a copy. With the file emptied, 5 of 7 fail |
| `qa/sim/branch-boundary.mjs` | 48 of 48 (9 new). On the code before the fix: 4 of the new checks fail (the planning branch cannot open the job; branch A lists 480 people from elsewhere; a regional manager 466; another branch's person opens by id) |
| Backend unit tests | 402 of 402 (1 new, 1 widened) |
| `roles.mjs`, `user-access.mjs` | 43 of 43, 48 of 48 |
| `ui-user-access`, `ui-locations`, `ui-production-overview` | 17 of 17, 40 of 40, 28 of 28 |
| Backend lint | 0 errors |

NOT VERIFIED: the full gate suite; the live site; either database update on the live database.

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| A Architecture | PASS | Both rules sit where the existing rules are; no route carries its own copy |
| B Functional completeness | CONDITIONAL | Still open: staff with no branch are not flagged on a screen; the older screens with made-up location lists; the live clean-up |
| C Cross-layer integrity | PASS | The sim checks each answer against the database |
| D Data integrity | PASS | The update adds rows only, and is the same on a second run |
| E Security | PASS | Two cross-branch reads closed, each with a check that fails without the fix |
| F Reliability | NOT ASSESSED | No change to failure handling |
| G Performance | NOT ASSESSED | One more OR branch on job reads; not measured |
| H User experience | NOT ASSESSED | No screen changed |
| I Regression | CONDITIONAL | Seven suites and unit tests, not the full suite |
| J Documentation | CONDITIONAL | This report |

Readiness: CONDITIONAL.

## Addendum 10: Clean-up of the test orders and placeholder locations (2026-11-22)

The owner chose "Cancel and switch off, keep history" for the 28 open test orders and 9 placeholder locations found on the live site (`live-data-audit-2026-11-22.md`).

### What changed

Database update `20261122213000_retire_test_orders_and_demo_locations`, for the owner to run after the first five locations are added:

- The 28 listed orders are cancelled while still open, with their open jobs and open shipments. Each says why in its notes.
- The 9 placeholder locations are switched off, with their machines. Open shipments leaving from them are cancelled.
- People whose home or assigned branch was a placeholder location move to Charlotte (CT), when CT is on file and switched on. Otherwise they stay where they are.
- Nothing is deleted. Stock records at the placeholder locations stay on file, at locations that are now switched off.
- Only records made before 2026-11-22 21:30 UTC are touched, so a real order that later takes one of the numbers is safe.

### Evidence (this session, local QA database only)

| Check | Result |
|---|---|
| `qa/sim/db-retire-test-data.sh` (new, in the gate script) | 6 of 6: runs the SQL Editor file twice on a copy; a finished listed order, a listed order made after the cut-off, a shipped job and an unrelated shipment are left alone; row counts of eight tables are unchanged. With the file emptied, the check fails |

NOT VERIFIED: the update on the live database; the live site afterwards; the full gate suite (no application code changed).

### Directive gates for this addendum

| Gate | Result | Evidence |
|---|---|---|
| D Data integrity | PASS | Nothing deleted; exact numbers and codes; same result on a second run |
| I Regression | CONDITIONAL | One new check; no sim reads the placeholder codes (searched `qa/sim`, `qa/tools`) |
| J Documentation | CONDITIONAL | This report |
| A, B, C, E, F, G, H | NOT ASSESSED | A data update only |

Known limit: stock reserved for a cancelled order is not released by this update. The stock sits at locations that are switched off.

Readiness: CONDITIONAL, on the owner running the update.
