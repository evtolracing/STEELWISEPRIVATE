# Quality scorecard

Generated 2026-11-18 by `qa/tools/excellence-docs.mjs` at commit 60ce6d2. Do not edit by hand: change the source and rerun.

The scores are a judgement from the evidence named beside them, not a measurement. They are carried from `qa/module-quality-scorecard.md` (each was set when its workstream audited the group) and changed in Phase 1 only where Phase 1 produced new evidence. A category with no evidence is NOT VERIFIED and is left out of the weighted figure, which is why no weighted figure here should be read as "out of 100 across everything". A score never overrides an open P0 or P1: the last column is the gate.

## Weights and what earns the score

| Category | Weight | Acceptance criteria for 95 |
|---|---:|---|
| Functional correctness | 15% | Every function the module offers works on real records, proven by a success-path test; no sample data |
| Data integrity | 15% | Totals, balances and identities enforced by the database or a tested rule; saves are all-or-nothing; reconciliation is clean |
| Reliability | 12% | No server error on bad input; safe under simultaneous requests; recovery path tested |
| Security | 12% | Sign-in, role, department and branch boundaries enforced on the server and proven by test |
| Operational efficiency | 10% | No duplicate entry; the next department is informed; exceptions are visible |
| User experience | 10% | Consistent screens, clear errors, loading and empty states, safe correction |
| Performance | 8% | Measured at the target volume with a stated environment |
| Integration quality | 6% | Every screen call has a route; one reply shape; outside calls have timeouts and retries |
| Maintainability | 5% | Rules in testable units; no dead code; lint clean |
| Observability | 4% | Every action traceable to a person and a request; alerts on failure |
| Accessibility | 3% | Keyboard and screen-reader use verified |

## Summary

| Module group | Weighted score | Share of the weights that has evidence | Open P0 or P1 | Changing routes with a success-path test | Meets the gate |
|---|---:|---:|---:|---|:-:|
| Platform infrastructure | 80 | 90% | 2 | 2 of 10 | No |
| Sales and customer operations | 80 | 100% | 4 | 37 of 97 | No |
| Inventory and purchasing | 77 | 100% | 3 | 47 of 62 | No |
| Manufacturing and processing | 82 | 100% | 1 | 63 of 95 | No |
| Logistics and financial operations | 86 | 100% | 2 | 58 of 66 | No |
| Enterprise experience | 60 | 92% | 5 | 14 of 51 | No |

No group meets the target of 95, and every group has at least one open P0 or P1 finding. Lowest: enterprise experience, then manufacturing.

## Modules below the groups

The groups hide large differences. Classification and test reach per module:

| Module | Classification | Changing routes with a success-path test | Open findings |
|---|---|---|---|
| Sign-in and sessions | IMPLEMENTED AND VERIFIED | 4 of 4 |  |
| Users, roles and branches | IMPLEMENTED BUT NOT VERIFIED | 4 of 6 |  |
| Access control | IMPLEMENTED AND VERIFIED | n/a |  |
| Staff and operators | PARTIALLY IMPLEMENTED | 4 of 9 | B-012, B-014 |
| Settings, tax rates and online settings | PARTIALLY IMPLEMENTED | 0 of 6 | X-007, D-035 |
| Customers | IMPLEMENTED AND VERIFIED | 3 of 4 | S-009 |
| RFQs and quotes | IMPLEMENTED AND VERIFIED | 7 of 9 | B-012 |
| Order entry | IMPLEMENTED AND VERIFIED | 7 of 7 | X-007 |
| Sales orders | IMPLEMENTED AND VERIFIED | 4 of 4 |  |
| Pricing and customer tiers | IMPLEMENTED AND VERIFIED | 2 of 2 | S-009 |
| Credit control | IMPLEMENTED AND VERIFIED | n/a |  |
| Counter quick sale | IMPLEMENTED AND VERIFIED | 3 of 6 | D-033, D-034 |
| Counter session flow (older) | PARTIALLY IMPLEMENTED | 5 of 36 | X-008, B-014 |
| Web store | IMPLEMENTED AND VERIFIED | 6 of 10 | X-007, F-008 |
| Customer account pages | IMPLEMENTED AND VERIFIED | 0 of 1 |  |
| Promise dates, cut-offs, branch comparison, split shipments | PLACEHOLDER OR MOCK | n/a | X-007, S-010 |
| Order hub and intake pipeline | DISCONNECTED | 0 of 18 | B-009 |
| Mobile rep | PLACEHOLDER OR MOCK | n/a | X-009 |
| Products, grades and heats | IMPLEMENTED AND VERIFIED | 6 of 6 | B-012 |
| Routings and processing recipes | PARTIALLY IMPLEMENTED | 7 of 11 | I-011 |
| Customer specifications | IMPLEMENTED BUT NOT VERIFIED | n/a |  |
| Stock items and stock levels | IMPLEMENTED AND VERIFIED | 12 of 13 | K-007, K-008, K-009 |
| Receiving | IMPLEMENTED AND VERIFIED | 9 of 9 | K-011, K-013 |
| Purchase orders and supply position | IMPLEMENTED AND VERIFIED | 1 of 1 | K-010, K-011, K-012 |
| Interbranch transfers | IMPLEMENTED AND VERIFIED | 9 of 9 |  |
| Second stock list (unit tracking) | DISCONNECTED | 0 of 9 | B-009, D-024 |
| Remnants | PARTIALLY IMPLEMENTED | 3 of 4 | S-009 |
| Jobs, job board and schedule | IMPLEMENTED AND VERIFIED | 10 of 20 | M-017, L-029 |
| Coil work orders | IMPLEMENTED AND VERIFIED | 7 of 7 |  |
| Dispatch, work centers and shop-floor operations | IMPLEMENTED AND VERIFIED | 12 of 17 | L-030 |
| Planning and optimization | PARTIALLY IMPLEMENTED | 3 of 3 | L-025 |
| Quality inspections | IMPLEMENTED AND VERIFIED | 6 of 6 | L-023, L-028 |
| Material tracking, packages and drop tags | IMPLEMENTED BUT NOT VERIFIED | 19 of 33 |  |
| Maintenance and assets | PARTIALLY IMPLEMENTED | 6 of 9 | X-009, B-017 |
| Shipping | IMPLEMENTED AND VERIFIED | 8 of 8 |  |
| Returns | IMPLEMENTED AND VERIFIED | 4 of 4 |  |
| Documents | IMPLEMENTED AND VERIFIED | 2 of 3 | B-021 |
| Partner API | PARTIALLY IMPLEMENTED | 15 of 20 | H-014, B-019 |
| Integrations and scheduled work | IMPLEMENTED AND VERIFIED | 2 of 2 | B-019, E-017 |
| Freight and logistics planning | PLACEHOLDER OR MOCK | n/a | X-009 |
| Invoices, payments, credits and refunds | IMPLEMENTED AND VERIFIED | 5 of 5 | B-019 |
| Financial ledger | IMPLEMENTED AND VERIFIED | 22 of 24 | W-001 to W-027 |
| Sales tax | IMPLEMENTED AND VERIFIED | n/a | F-008, D-035 |
| Request safeguards | IMPLEMENTED AND VERIFIED | n/a | E-014, E-017 |
| AI assistant and voice | IMPLEMENTED BUT NOT VERIFIED | 2 of 10 | H-012 |
| Help manual | IMPLEMENTED BUT NOT VERIFIED | n/a | M-018, X-010 |
| Background work, notifications, schedules | PARTIALLY IMPLEMENTED | n/a | B-019, D-034, H-015 |
| Operations cockpit and dashboards | IMPLEMENTED BUT NOT VERIFIED | 2 of 9 | B-012 |
| Executive tools | PLACEHOLDER OR MOCK | 0 of 10 | X-009 |
| Stop work | DISCONNECTED | 0 of 7 | X-001, B-009 |
| Safety, training, contractors, customer quality, supplier quality, production quality, provenance | PLACEHOLDER OR MOCK | n/a | X-001, X-002, X-009, B-017 |

## Module groups

### Platform infrastructure

Modules: Request safeguards; AI assistant and voice; Help manual; Background work, notifications, schedules.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 85 | 150 of 150 jobs before and after; job-list second path removed (E-002); invented analytics removed (E-006) |
| Data integrity | 15% | 86 | Phase 3: 188 foreign keys (15 added on money, stock and work references), 24 value checks (15 added), every decimal written exactly (G-001), all proven by refused writes and a residue check of 0. Held at 86: 217 reference columns still have no key (G-003), the two JSON stores remain (B-009). Was 75 (0 to 8 value checks; reconciliation clean. Balance identity still code-only (E-020)) |
| Reliability | 12% | 80 | Phase 4: a retry after a lost answer or a dropped connection gets the first result (H-004); one partner can no longer receive another's answer (H-003); a burst of 80 events is sent within a second (H-019). Held at 80: no restore has been tested (E-015), the host pool is unverified (G-015), the schedule that carries out retries is not set on the host (B-019). Was 62 (Job list failed under 20 simultaneous requests, now passes. Clean exit and shutdown. No restore test, no staging (E-015)) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 80 |
| Operational efficiency | 10% | NOT VERIFIED | No evidence gathered |
| User experience | 10% | 80 | Phase 9: every screen of the group opened at three sizes with 0 page errors and 0 sideways scroll; one search, page titles, a skip link, role start pages, the application's own dialogs, session expiry returning to the same page; 43 navigation scenarios, one for each role among them. Held at 80: no real user, device or host took part; 94 files set colours of their own (V-035). Was null (No evidence gathered) |
| Performance | 8% | 82 | Phase 3: measured on an 85-branch copy (72,240 orders, 100,233 stock items): every branch list within 500 ms; 400 requests at once with 0 failures. Held at 82: local machine only; stock search and job count grow with the company (G-013); 244 KB order list reply (G-014). Was 80 (7 routes over target to 0; 104 MB reply to 1.2 MB. Operations cockpit answers in about 1 s at volume, was no reply (E-023)) |
| Integration quality | 6% | 76 | Phase 4: every call to an outside service has a time limit, bounded tries, a breaker and a plain failure answer (H-005); events to partners are saved with the change, retried, stopped after five tries and replayable (H-002); reply shapes are pinned by contract tests; a database refusal is a 409, not a 500 (H-017). Held at 76: list shapes still differ (E-021); the host schedule is not set (B-019); email, cards, carriers, tax and accounting are not connected (H-015); the breaker and limits count per instance (H-012). Was 62 (155 of 352 screen calls have no route (D-020), unchanged; reply shapes inconsistent (E-021)) |
| Maintainability | 5% | 65 | Phase 2: the branch boundary, the department table and the login rules each live in one tested file; a coverage check fails the gates when a changing route has no rule. Held at 65: most rules still live in route handlers (B-014) and 1,524 lint warnings remain. Was 57 (47 unit tests on every pull request; no lint (E-016); large files (E-018)) |
| Observability | 4% | 70 | Phase 4: an Integrations screen and report show failed and waiting events, outside-service failures, orders shipped but not invoiced and when scheduled work last ran; failures are structured log lines with a request id and no secret (tested). Held at 70: nothing alerts anyone (E-017). Was 60 (Request id and log line added; no alerting (E-017)) |
| Accessibility | 3% | 72 | Phase 9, measured by tool on every screen: controls with no name 613 to 0, fields with no label 280 to 0, one main heading, a visible focus ring, a skip link, announcements, reduced motion; 87 rows and cards open from the keyboard. Held at 72: not a WCAG certificate; no screen reader, switch or voice user; focus return after a dialog verified on the main dialogs only (V-029). Was null (No evidence gathered) |
| **Weighted over the 90% that has evidence** | | **80** | Target 95 |

Changing routes with a success-path test: 2 of 10. Open findings against these modules: 8, of which P0 or P1: 2 (B-019, E-014).

### Sales and customer operations

Modules: Customers; RFQs and quotes; Order entry; Sales orders; Pricing and customer tiers; Credit control; Counter quick sale; Counter session flow (older); Web store; Customer account pages; Promise dates, cut-offs, branch comparison, split shipments; Order hub and intake pipeline; Mobile rep.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 88 | Phase 5: tax by rule 27 on every sales path (J-001, J-005, J-006); expired quotes and pipeline values corrected (J-004); 15 pricing scenarios and the 47-check price sweep. Held at 88: discount, minimums and quote-line catalog pricing are the owner's decisions (J-008, S-027). Was 80 (Placeholder counter price, tier prices, mobile orders, customer preferences save and the Pricing screen all repaired (S-001, S-002, S-005, S-014, S-017). Promise dates are still invented (S-010)) |
| Data integrity | 15% | 92 | Phase 5: requirements, tax and branch carried from request to quote to order to work order (J-001, J-009); closed accounts refused in every channel (J-002); a void is CANCELLED (G-009); web orders need a customer (J-010); final reconciliation of the 76 scenarios 0 problems. Held at 92: six preference fields not applied (J-008); live data unverified. Was 82 (Order entry validated and transactional, tax saved, field allow-lists (S-006, S-007, S-016). 150 of 150 jobs, reconciliation 0 problems) |
| Reliability | 12% | 84 | Phase 5: races, retries, lost answers and a database failure mid-acceptance tested on quotes, counter sales and web checkout, each leaving one record or none. Held at 84: the order entry screen does not warn on a stale edit (G-020). Was 65 (A failed edit no longer destroys order lines. No retry or offline behaviour on mobile; says so) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 82 |
| Operational efficiency | 10% | 62 | One price everywhere removes re-keying. Quotes still priced by hand (S-027). Credit limits are now enforced with a manager release (rule 32) |
| User experience | 10% | 80 | Phase 9: every screen of the group opened at three sizes with 0 page errors and 0 sideways scroll; one search, page titles, a skip link, role start pages, the application's own dialogs, session expiry returning to the same page; 26 sales scenarios in a browser; an order's money on screen equals the record (V-020); a changed order asks before it is left (V-017). Held at 80: no real user, device or host took part; other long forms do not ask (V-018); duplicate order not built (V-030). Was 68 (Screens show the server's own error text; sample data removed from four screen groups. Branch list on entry screens still fixed (S-008)) |
| Performance | 8% | 84 | Phase 5: every sales screen within 67 ms at the 95th percentile at 85 branches with 18,000 quotes; 40 at once 0 failed. Held at 84: local machine only. Was null (New routes are counted or capped (200 rows). No benchmark of sales routes was run in this workstream) |
| Integration quality | 6% | 68 | Phase 4: a customer system can raise a request for quote, read and answer quotes, and read its orders, shipments and invoices, isolated from other customers (H-001); what a partner reads equals what staff see. Held at 68: no email or text (D-034, H-015); web checkout payment is a note (H-013); 18 sales calls have no route (S-026). Was 60 (Overrides, dashboard, mobile and pricing now have routes. 18 sales calls still have none (S-026). No card, email or text service (D-033, D-034)) |
| Maintainability | 5% | 70 | One pricing rule and one tax rule, pure and unit tested (55 tests). Two unused sales paths remain (S-021, S-022) |
| Observability | 4% | 72 | Phase 3: confirming, cancelling and reserving now leave a history line with the person, in the same transaction (G-010). Held at 72: edits to other order fields are not itemised (G-011). Was 65 (Audit entries for overrides, tier, credit limit, tax status and list price changes; request ids from Workstream 1) |
| Accessibility | 3% | 68 | Phase 9, measured by tool on every screen of the group: 0 controls with no name, 0 fields with no label, one main heading, text contrast corrected in the theme, rows open from the keyboard, forms say what is required and what is wrong. Held at 68: not a WCAG certificate; no screen reader, switch or voice user; no real device. Was null (New screens use labelled tables and controls. No keyboard or contrast audit was run) |
| **Weighted over the 100% that has evidence** | | **80** | Target 95 |

Changing routes with a success-path test: 37 of 97. Open findings against these modules: 11, of which P0 or P1: 4 (B-009, S-010, X-007, X-009).

### Inventory and purchasing

Modules: Products, grades and heats; Routings and processing recipes; Customer specifications; Stock items and stock levels; Receiving; Purchase orders and supply position; Interbranch transfers; Second stock list (unit tracking); Remnants.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 72 | Stock, heat and receiving screens showed sample data and the upload saved nothing; all now run on real records (I-001, I-002, I-005, I-006). No purchase orders, adjustments or counts (I-007, I-016) |
| Data integrity | 15% | 93 | Phase 6: transfers have an in-transit stage and a receipt, with shortages held and settled (G-007); a reservation must fit the line by unit, grade, size, tolerance and owner (K-001); receipts tie to purchase order lines (I-007); a scrapped return is recorded in and out (K-003); 25 stock checks at 0 after 105 scenarios. Held at 93: no cost on stock (K-007); no cycle count program (K-008); the Steel Outlet remnant list is separate (K-006); live data unverified. Was 85 (Field allow-lists on every stock and catalog write; receipt is one transaction; the database enforces the balance identity (I-004, I-013). 150 of 150 jobs, reconciliation 0 problems) |
| Reliability | 12% | 86 | Phase 6: transfer send, receive, settle and call-back each raced and each safe; a save that fails part way leaves stock as it was; a hold no longer deadlocks with another stock change (K-015, found by the gate run). Held at 86: scanners not tested (K-013); local machine only. Was 70 (Upload reports each failed row and keeps the good ones; concurrent hold and transfer guarded by conditional updates. No retry or resume for a large upload) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 85 |
| Operational efficiency | 10% | 62 | Receive, hold, release and move can be done on screen. Heats must be added before stock (I-017); no expected deliveries (I-007) |
| User experience | 10% | 80 | Phase 9: every screen of the group opened at three sizes with 0 page errors and 0 sideways scroll; one search, page titles, a skip link, role start pages, the application's own dialogs, session expiry returning to the same page; 27 stock scenarios in a browser; a stock item on a transfer shows In Transit in the list (K-014); rows open from the keyboard. Held at 80: no real user, device or host took part; tables are built per screen (V-036). Was 70 (Screens state errors in the server's words, say "not recorded" instead of inventing values, and the sample screens are labelled (I-011)) |
| Performance | 8% | 82 | Phase 6: at 85 branches and 100,233 items the stock list answers in 48 ms, a search by part of a number in 116 ms, the supply position in 271 ms. Held at 82: local machine; the one-branch benchmark login has no stock; no index added without evidence (G-013). Was null (Lists are capped (500) and paged with a total count. An upload is capped at 2,000 rows and runs one row at a time; not timed) |
| Integration quality | 6% | 60 | One stock list behind orders, receiving, shipping and the Inventory menu (I-012, pending confirmation). 15 dead calls removed (I-015). No supplier or carrier connection |
| Maintainability | 5% | 75 | One receiving rule and one field reader, pure and unit tested (79 tests in all). The unused RFID stock screens remain in the code |
| Observability | 4% | 70 | Every receipt, move, hold and release is a movement or hold record with the person; list price changes are in the audit log |
| Accessibility | 3% | 68 | Phase 9, measured by tool on every screen of the group: 0 controls with no name, 0 fields with no label, one main heading, text contrast corrected in the theme, rows open from the keyboard, forms say what is required and what is wrong. Held at 68: not a WCAG certificate; no screen reader, switch or voice user; no real device. Was null (New screens use labelled tables and controls. No keyboard or contrast audit was run) |
| **Weighted over the 100% that has evidence** | | **77** | Target 95 |

Changing routes with a success-path test: 47 of 62. Open findings against these modules: 12, of which P0 or P1: 3 (B-009, I-011, K-007).

### Manufacturing and processing

Modules: Jobs, job board and schedule; Coil work orders; Dispatch, work centers and shop-floor operations; Planning and optimization; Quality inspections; Material tracking, packages and drop tags; Maintenance and assets.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 89 | Phase 7: 130 verified scenarios across work orders, routing, scheduling, shop floor, quality, material, rework, job cost and cross-branch production; every job move through one gate (L-001, L-006); steps in planned order (owner decision 8); the six rules of owner decision 9 built and each proven by mutation. Held at 89: bill of material, calendar capacity, nonconformance, stock valuation and cost of goods are not built (L-023 to L-026, K-007); labor rates and checklists not yet entered. Was 70 (The job, schedule, work order and old operator screens showed sample data or saved nothing (M-001, M-007, M-008, M-010); all now run on real records. Production quality and BOM screens are still samples (M-011); a work order does not move stock (M-016)) |
| Data integrity | 15% | 91 | Phase 7: 13 new database checks at 0 after the full run (clocks, steps, inspections, plan branch); a plan with recorded work is never replaced (L-012); cancelling a job closes its clocks (L-018); nothing assumed for grade, thickness, time or hours (L-008, L-010). Phase 3: a coil work order consumes and creates stock in one transaction. Owner decision 9: a job names its coil work orders and shows material used, made and scrap (L-024); 3 more database checks at 0. Held at 91: no bill of material; stock on hand before the update has no cost (K-007); thickness not stated is stored as 0 (L-029). Was 78 (Work orders read an allow-list and follow status rules (M-005, M-006); a status note no longer overwrites job notes (M-003). Backward job moves are loosely ruled (M-017)) |
| Reliability | 12% | 88 | Phase 7: races on planning, scheduling, step start, finish against pause, inspection decisions, status moves and cancel against the last finish each end in one consistent state; a step left running across a gap recovers; a refused request saves nothing. Held at 88: local machine only; no machine connection to fail (L-030). Was 70 (Missing jobs and work orders answer 404, not 500; concurrent work order moves are guarded; starting an inspection no longer reports failure after saving (M-015)) |
| Security | 12% | 90 | Phase 7: inspections, time entries and operators are branch-owned (L-019); a planner schedules only their own branch (L-007); pay and emergency contacts go to managers only (L-014); quality decisions are for quality staff and production management and are audited against the signed-in user (L-003). Held at 90: live roles NOT VERIFIED. Was 78 (Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 80) |
| Operational efficiency | 10% | 60 | A job opens from the board and the schedule; its status changes on one screen. Scheduling by drag, capacity limits and re-planning were not examined |
| User experience | 10% | 78 | Phase 9: every screen of the group opened at three sizes with 0 page errors and 0 sideways scroll; one search, page titles, a skip link, role start pages, the application's own dialogs, session expiry returning to the same page; 26 shop scenarios in a browser; the shop floor opens on the operator's own branch (V-021); the order board draws 30 cards a column and offers the rest (V-026). Held at 78: no real user, device or host took part; no shop terminal or glove; three boards still fetch everything (V-027). Was 68 (Real data, "not recorded" instead of invented values, refusals in the server's words, sample screens labelled, false AI claims removed (M-014)) |
| Performance | 8% | 84 | Phase 7: at 85 branches with about 18,600 steps the production screens answer in 6 to 139 ms; the scheduling run at a branch with 7,090 waiting jobs fell from 45.3 s to 1.9 s; the late list from 653 to 74 ms; lists are capped with totals. Held at 84: local machine; the scheduling and planner answers are 8.3 MB and 1.2 MB at the largest branch. Was null (The schedule asks for one day of jobs, not the whole list. Nothing timed) |
| Integration quality | 6% | 65 | 73 dead calls removed (M-012). Work orders are not connected to stock or to jobs (M-016) |
| Maintainability | 5% | 72 | One job history module and one work order rule, pure and unit tested (87 tests in all). Three job routes still carry their own status checks (M-017) |
| Observability | 4% | 80 | Every job move, assignment and work order move is in the audit log with the person and is shown on the screen (M-002) |
| Accessibility | 3% | 68 | Phase 9, measured by tool on every screen of the group: 0 controls with no name, 0 fields with no label, one main heading, text contrast corrected in the theme, rows open from the keyboard, forms say what is required and what is wrong. Held at 68: not a WCAG certificate; no screen reader, switch or voice user; no real device. Was null (New screens use labelled tables and controls. No keyboard or contrast audit was run) |
| **Weighted over the 100% that has evidence** | | **82** | Target 95 |

Changing routes with a success-path test: 63 of 95. Open findings against these modules: 8, of which P0 or P1: 1 (X-009).

### Logistics and financial operations

Modules: Shipping; Returns; Documents; Partner API; Integrations and scheduled work; Freight and logistics planning; Invoices, payments, credits and refunds; Financial ledger; Sales tax.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 90 | Phase 9.5: every money and stock save posts by a documented rule, read back account by account in 158 scenarios; 26 rules proven by removal; nothing is valued at zero or posted to a fallback account. Held at 90: the rules are proposals no accountant has approved; receipts with no purchase order, counter stock and items with no stock record need a person (W-006, W-007, W-012). Earlier: Owner decision 10: a load that never arrives is ended as lost by a manager, with its invoice credited in the same save (N-027); web checkout says it is on account (H-013). Held at 89: no carriers (N-026, deferred by the owner), no accounting (N-025), freight planning screens are samples. Before decision 10 (87): Phase 8: 142 verified scenarios across release, packing, shipments, dispatch, delivery, invoices, payments, credits, returns, costing and closeout; the packaging chain completes for the first time (N-008); stock leaves only the dock it stands at and the holding branch ships (N-001, N-002); papers are built from records with nothing invented (N-014); an order's open items are answered in one place (N-018). Held at 87: no carriers, freight rating or tracking (N-026); no accounting or cost of goods (N-025); no rule for a lost load (N-027); freight planning screens are samples (U-035). Was 75. Was 75 (There was no screen to ship from and the one on the menu was a sample (F-002); web orders carried no tax (F-001). Both fixed and operated in a browser. Freight planning is still samples (F-007)) |
| Data integrity | 15% | 94 | Phase 9.5: a double-entry journal whose balance, period, draft-then-post and immutability rules are enforced by the database and were each attacked by direct SQL; one entry per business event by a unique key; ten reconciliation checks of the books against the records, each of the four main ones proven by damaging data on purpose; clean after 158 scenarios and after the load run. Held at 94: verified on synthetic data only; no accountant has approved a rule; a database superuser can switch the triggers off (W-014). Earlier: Phase 8: 7 new database checks; cost fixed on the stock movement at dispatch and unchanged by later edits (N-017); packing inputs read from the stock item (N-009); fixed tag states (N-010); custody records cannot be forged (N-011); a cancelled order keeps no live shipment (N-006); reconciliation of shipped, moved and invoiced quantities across every record of the run. Held at 93: no ledger to reconcile against; a package is not tied to one shipment; movements before file 14 carry no cost. Earlier: Phase 3: invoice identity and links enforced by the database; tax across part shipments to the cent; 11 financial checks at 0; a shipment cannot be billed unless stock left the books (G-019); invoice and credit memo numbers never skipped or repeated from the counter's start (twelve at once take twelve in a row). Held at 92: numbers issued earlier keep their gaps; carrier partner routes are broken . Was 82 (Web order totals saved; proof of delivery checked (F-005). The billing arithmetic was already sound: the cycles reconcile to zero problems) |
| Reliability | 12% | 90 | Phase 9.5: the ledger event is written in the business save behind a savepoint, so a ledger failure neither blocks nor half-posts; every once-only rule raced three to five at a time; under 16 dispatches in flight ten invoices were lost and the cause fixed (W-021), 240 of 240 after. Held at 90: one server process (W-022); backup and restore not exercised (W-020). Earlier: Phase 8: 20 concurrency and recovery scenarios; every once-only rule raced; overlaps met by raw statements and deadlocks reported by the database client are run again (N-022, N-029); a packing step pressed twice happens once (N-013); a return whose credit fails is flagged until settled, once (N-016). Held at 89: one server and one database only; N-029 was found in a log, not by a failing check; nothing retries a failed invoice on its own. Earlier: Phase 4: a billing failure at dispatch is said, recorded and listed until closed (H-006); a carrier's repeated or late report changes nothing; dispatch and delivery carry request keys from the screen (H-009). Held at 84: nothing retries a failed invoice on its own. Was 75 (Concurrent dispatch, payment and return were already guarded and still pass. Missing shipments answer 404) |
| Security | 12% | 90 | Owner decision 10: invoices and payments are read by sales, managers, leadership and view-only roles; other staff receive an invoice's number and status only, on every answer (F-009); 2 rule removals each failed a scenario. Held at 90: live roles NOT VERIFIED. Before decision 10 (88): Phase 8: stock cost removed from every answer for roles outside cost viewers (N-020); print jobs per branch (N-015); shipment changes held to the dock they leave from (N-002); text on printed papers escaped (N-019); custody notes only in the writer's own name (N-011); 337 changing routes, 0 with no rule. Held at 88: who may read invoices is undecided (F-009); live roles NOT VERIFIED. Was 78. Was 78 (Credit terms no longer sent to the shipping desk (F-003); unsafe delivery links refused. Who may read invoices is undecided (F-009). Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open) |
| Operational efficiency | 10% | 78 | Phase 8: the bill of lading and packing list print from the shipment in one button (F-011, U-036); one panel answers what is still open on an order, and one list shows every order not closed by reason (N-018); the Packing screen offers only the next valid step. Held at 78: a pick is a list, not a confirmed scan; no carrier booking; no real user timed. Was 68. Was 68 (A shipment is created from the order number in one dialog that shows what is left; dispatch raises the invoice. No documents print from the screen (F-011)) |
| User experience | 10% | 82 | Phase 9: every screen of the group opened at three sizes with 0 page errors and 0 sideways scroll; one search, page titles, a skip link, role start pages, the application's own dialogs, session expiry returning to the same page; 25 shipping scenarios in a browser on top of the 56 Phase 8 browser checks; dispatch cannot be pressed twice (V-022); refusals in plain words. Held at 82: no real user, device or host took part; seven freight screens are samples (U-035). Before Phase 9: 77 (Phase 8: 45 browser checks on six screens including phone width; refusals in plain words naming the item and the branch (N-001), the missing name (N-004), the missing reason (N-003); blanks on papers are named so they can be written in by hand. Held at 77: two new screens have had no real user; accessibility beyond labels is Phase 9. Was 72). Was 72 (Plain status names, a confirmation before dispatch, refusals in the server's words, history with names) |
| Performance | 8% | 84 | Phase 8: eighteen shipping, invoicing, closeout, returns and print calls at 85 branches (72,565 orders, 50,869 shipments, 37,625 invoices): 6 to 206 ms, all but one under 40 ms. Held at 84: local machine, the host NOT VERIFIED; the first page of orders not closed works out every open order before paging; packing not timed at scale. Was 80. Was null (The list is capped at 200 and searched on the server. Nothing timed) |
| Integration quality | 6% | 78 | Phase 4: a carrier reports through the partner API under the same rules as the shipping desk (H-001); dispatch, delivery, exception and invoice raise durable events (H-002); an order shipped but not invoiced is reported (H-006). Held at 78: no carrier rating, label or tracking service and no card processor (H-015); web checkout takes no payment (H-013). Was 68 (Shipping, stock, order, jobs and invoice move together on dispatch (cycles). The store's tax estimate and the accepted order can disagree (F-008). No carrier connection) |
| Maintainability | 5% | 80 | Phase 8: three small libraries with pure rules (shipping papers, order closeout, order cost) and 23 unit tests; one reader for three papers; one guard for cost on every answer; one retry for every overlap form. Held at 80: the drop tag route file is large (33 addresses). Was 70. Was 70 (Two small screens replace four sample ones; one event writer each for shipments and money. No unit tests added: the checks are in the sweep) |
| Observability | 4% | 82 | Every shipment step and every money action is in the audit log with the person and shown on the screen (F-004, F-006) |
| Accessibility | 3% | 68 | Phase 9, measured by tool on every screen of the group: 0 controls with no name, 0 fields with no label, one main heading, text contrast corrected in the theme, rows open from the keyboard, forms say what is required and what is wrong. Held at 68: not a WCAG certificate; no screen reader, switch or voice user; no real device. Was null (New screens use labelled tables and controls. No keyboard or contrast audit was run) |
| **Weighted over the 100% that has evidence** | | **86** | Target 95 |

Changing routes with a success-path test: 58 of 66. Open findings against these modules: 7, of which P0 or P1: 2 (B-019, X-009).

### Enterprise experience

Modules: Sign-in and sessions; Users, roles and branches; Access control; Staff and operators; Settings, tax rates and online settings; Operations cockpit and dashboards; Executive tools; Stop work; Safety, training, contractors, customer quality, supplier quality, production quality, provenance.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 45 | 58 of 143 screens are samples (X-009). None is presented as real any more, but the functions are still missing |
| Data integrity | 15% | 72 | Phase 2: two real screens no longer invent records when the server fails (C-007); an executive decision records the signed-in person. Held at 72: dashboard figures are not checked against the records. Was 70 (No invented figure is shown as real: screens labelled (X-001, X-002), dashboard fallbacks removed (X-003). Promise and cut-off rules are still invented in the browser (X-007)) |
| Reliability | 12% | 65 | A failed dashboard figure shows an error and a retry |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open |
| Operational efficiency | 10% | 40 | The menu still lists modules that do nothing; a decision per module is needed |
| User experience | 10% | 62 | Phase 9: no dashboard shows a figure the server did not send, with the server up or failing; 172 dead buttons on sample screens say "not built" and 10 false "saved" messages are gone (V-007, V-008). Held at 62: 58 screens are still samples (owner decision 4); five dashboards are not reconciled to the records (V-037). Was 60 (One notice, in the same words, on every sample screen; false AI claims removed (X-004)) |
| Performance | 8% | NOT VERIFIED | NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured |
| Integration quality | 6% | 45 | Five browser-side rule services have no server (X-007) |
| Maintainability | 5% | 70 | A screen audit and a lint step run in the pull-request workflow (X-006) |
| Observability | 4% | 60 | `qa/screen-audit.md` states, for every screen, where its data comes from |
| Accessibility | 3% | 60 | Phase 9, measured by tool: 0 controls with no name and 0 fields with no label on the sample screens too. Held at 60: the hard-to-read texts that remain are on these screens (V-011); they are to be rebuilt (owner decision 4); no assistive technology user. Was null (No evidence gathered) |
| **Weighted over the 92% that has evidence** | | **60** | Target 95 |

Changing routes with a success-path test: 14 of 51. Open findings against these modules: 9, of which P0 or P1: 5 (B-009, X-001, X-002, X-007, X-009).

