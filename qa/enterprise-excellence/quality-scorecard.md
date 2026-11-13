# Quality scorecard

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit bcba5a1. Do not edit by hand: change the source and rerun.

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
| Platform infrastructure | 73 | 77% | 2 | 0 of 10 | No |
| Sales and customer operations | 72 | 89% | 4 | 31 of 97 | No |
| Inventory and purchasing | 73 | 89% | 4 | 18 of 38 | No |
| Manufacturing and processing | 73 | 89% | 2 | 26 of 91 | No |
| Logistics and financial operations | 75 | 89% | 2 | 13 of 37 | No |
| Enterprise experience | 60 | 89% | 5 | 3 of 50 | No |

No group meets the target of 95, and every group has at least one open P0 or P1 finding. Lowest: enterprise experience, then manufacturing.

## Modules below the groups

The groups hide large differences. Classification and test reach per module:

| Module | Classification | Changing routes with a success-path test | Open findings |
|---|---|---|---|
| Sign-in and sessions | IMPLEMENTED AND VERIFIED | 1 of 3 |  |
| Users, roles and branches | IMPLEMENTED BUT NOT VERIFIED | 2 of 6 |  |
| Access control | IMPLEMENTED AND VERIFIED | n/a | F-009 |
| Staff and operators | IMPLEMENTED BUT NOT VERIFIED | 0 of 9 | B-012, B-014 |
| Settings, tax rates and online settings | PARTIALLY IMPLEMENTED | 0 of 6 | X-007, D-035 |
| Customers | IMPLEMENTED AND VERIFIED | 2 of 4 | S-009 |
| RFQs and quotes | IMPLEMENTED AND VERIFIED | 4 of 9 | S-021, B-012 |
| Order entry | IMPLEMENTED AND VERIFIED | 7 of 7 | X-007 |
| Sales orders | IMPLEMENTED AND VERIFIED | 4 of 4 | F-009 |
| Pricing and customer tiers | IMPLEMENTED AND VERIFIED | 2 of 2 | S-009 |
| Credit control | IMPLEMENTED AND VERIFIED | n/a |  |
| Counter quick sale | IMPLEMENTED AND VERIFIED | 3 of 6 | D-033, D-034 |
| Counter session flow (older) | PARTIALLY IMPLEMENTED | 5 of 36 | X-008, B-014 |
| Web store | IMPLEMENTED AND VERIFIED | 4 of 10 | X-007, F-008 |
| Customer account pages | IMPLEMENTED AND VERIFIED | 0 of 1 |  |
| Promise dates, cut-offs, branch comparison, split shipments | PLACEHOLDER OR MOCK | n/a | X-007, S-010 |
| Order hub and intake pipeline | DISCONNECTED | 0 of 18 | S-021, B-009 |
| Mobile rep | PLACEHOLDER OR MOCK | n/a | X-009 |
| Products, grades and heats | IMPLEMENTED AND VERIFIED | 6 of 6 | B-012 |
| Processing recipes and bills of material | IMPLEMENTED BUT NOT VERIFIED | 0 of 11 | I-011 |
| Customer specifications | IMPLEMENTED BUT NOT VERIFIED | n/a |  |
| Stock items and stock levels | IMPLEMENTED AND VERIFIED | 7 of 8 | I-016 |
| Receiving | IMPLEMENTED AND VERIFIED | 4 of 4 | I-007 |
| Second stock list (unit tracking) | DISCONNECTED | 0 of 5 | B-009, D-024 |
| Remnants | PARTIALLY IMPLEMENTED | 1 of 4 | S-009 |
| Jobs, job board and schedule | IMPLEMENTED AND VERIFIED | 9 of 20 | M-017 |
| Coil work orders | IMPLEMENTED AND VERIFIED | 5 of 5 | M-016 |
| Dispatch, work centers and shop-floor operations | IMPLEMENTED BUT NOT VERIFIED | 6 of 17 | B-011 |
| Planning and optimization | IMPLEMENTED BUT NOT VERIFIED | 0 of 3 |  |
| Quality inspections | IMPLEMENTED BUT NOT VERIFIED | 2 of 6 |  |
| Material tracking, packages and drop tags | IMPLEMENTED BUT NOT VERIFIED | 0 of 31 | F-011 |
| Maintenance and assets | PARTIALLY IMPLEMENTED | 4 of 9 | X-009, B-017 |
| Shipping | IMPLEMENTED AND VERIFIED | 5 of 7 | F-011 |
| Returns | IMPLEMENTED AND VERIFIED | 2 of 3 |  |
| Documents | IMPLEMENTED AND VERIFIED | 2 of 3 | B-021 |
| Partner API | IMPLEMENTED BUT NOT VERIFIED | 0 of 19 | B-018 |
| Freight and logistics planning | PLACEHOLDER OR MOCK | n/a | X-009 |
| Invoices, payments, credits and refunds | IMPLEMENTED AND VERIFIED | 4 of 5 | F-009, B-019 |
| Sales tax | IMPLEMENTED AND VERIFIED | n/a | F-008, D-035 |
| Request safeguards | IMPLEMENTED AND VERIFIED | n/a | E-014, E-017 |
| AI assistant and voice | IMPLEMENTED BUT NOT VERIFIED | 0 of 10 |  |
| Help manual | IMPLEMENTED BUT NOT VERIFIED | n/a | M-018, X-010 |
| Background work, notifications, schedules | NOT APPLICABLE | n/a | B-019, B-018, D-034 |
| Operations cockpit and dashboards | IMPLEMENTED BUT NOT VERIFIED | 0 of 9 | B-012 |
| Executive tools | PLACEHOLDER OR MOCK | 0 of 10 | X-009 |
| Stop work | DISCONNECTED | 0 of 7 | X-001, B-009 |
| Safety, training, contractors, customer quality, supplier quality, production quality, provenance | PLACEHOLDER OR MOCK | n/a | X-001, X-002, X-009, B-017 |

## Module groups

### Platform infrastructure

Modules: Request safeguards; AI assistant and voice; Help manual; Background work, notifications, schedules.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 85 | 150 of 150 jobs before and after; job-list second path removed (E-002); invented analytics removed (E-006) |
| Data integrity | 15% | 75 | 0 to 8 value checks; reconciliation clean. Balance identity still code-only (E-020) |
| Reliability | 12% | 62 | Job list failed under 20 simultaneous requests, now passes. Clean exit and shutdown. No restore test, no staging (E-015) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 80 |
| Operational efficiency | 10% | NOT VERIFIED | No evidence gathered |
| User experience | 10% | NOT VERIFIED | No evidence gathered |
| Performance | 8% | 80 | 7 routes over target to 0; 104 MB reply to 1.2 MB. Operations cockpit answers in about 1 s at volume, was no reply (E-023) |
| Integration quality | 6% | 62 | 155 of 352 screen calls have no route (D-020), unchanged; reply shapes inconsistent (E-021) |
| Maintainability | 5% | 65 | Phase 2: the branch boundary, the department table and the login rules each live in one tested file; a coverage check fails the gates when a changing route has no rule. Held at 65: most rules still live in route handlers (B-014) and 1,524 lint warnings remain. Was 57 (47 unit tests on every pull request; no lint (E-016); large files (E-018)) |
| Observability | 4% | 60 | Request id and log line added; no alerting (E-017) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 77% that has evidence** | | **73** | Target 95 |

Changing routes with a success-path test: 0 of 10. Open findings against these modules: 7, of which P0 or P1: 2 (B-019, E-014).

### Sales and customer operations

Modules: Customers; RFQs and quotes; Order entry; Sales orders; Pricing and customer tiers; Credit control; Counter quick sale; Counter session flow (older); Web store; Customer account pages; Promise dates, cut-offs, branch comparison, split shipments; Order hub and intake pipeline; Mobile rep.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 80 | Placeholder counter price, tier prices, mobile orders, customer preferences save and the Pricing screen all repaired (S-001, S-002, S-005, S-014, S-017). Promise dates are still invented (S-010) |
| Data integrity | 15% | 84 | Phase 2: a counter sale takes shelf stock and a void returns it in the sale's own transaction; orders carry a branch. Held at 84: no duplicate-request protection on order creation (C-006) and a void's credit is a second transaction (C-010). Was 82 (Order entry validated and transactional, tax saved, field allow-lists (S-006, S-007, S-016). 150 of 150 jobs, reconciliation 0 problems) |
| Reliability | 12% | 65 | A failed edit no longer destroys order lines. No retry or offline behaviour on mobile; says so |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 82 |
| Operational efficiency | 10% | 62 | One price everywhere removes re-keying. Quotes still priced by hand (S-027). Credit limits are now enforced with a manager release (rule 32) |
| User experience | 10% | 68 | Screens show the server's own error text; sample data removed from four screen groups. Branch list on entry screens still fixed (S-008) |
| Performance | 8% | NOT VERIFIED | NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured |
| Integration quality | 6% | 60 | Overrides, dashboard, mobile and pricing now have routes. 18 sales calls still have none (S-026). No card, email or text service (D-033, D-034) |
| Maintainability | 5% | 70 | One pricing rule and one tax rule, pure and unit tested (55 tests). Two unused sales paths remain (S-021, S-022) |
| Observability | 4% | 65 | Audit entries for overrides, tier, credit limit, tax status and list price changes; request ids from Workstream 1 |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 89% that has evidence** | | **72** | Target 95 |

Changing routes with a success-path test: 31 of 97. Open findings against these modules: 13, of which P0 or P1: 4 (B-009, S-010, X-007, X-009).

### Inventory and purchasing

Modules: Products, grades and heats; Processing recipes and bills of material; Customer specifications; Stock items and stock levels; Receiving; Second stock list (unit tracking); Remnants.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 72 | Stock, heat and receiving screens showed sample data and the upload saved nothing; all now run on real records (I-001, I-002, I-005, I-006). No purchase orders, adjustments or counts (I-007, I-016) |
| Data integrity | 15% | 85 | Field allow-lists on every stock and catalog write; receipt is one transaction; the database enforces the balance identity (I-004, I-013). 150 of 150 jobs, reconciliation 0 problems |
| Reliability | 12% | 70 | Upload reports each failed row and keeps the good ones; concurrent hold and transfer guarded by conditional updates. No retry or resume for a large upload |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 85 |
| Operational efficiency | 10% | 62 | Receive, hold, release and move can be done on screen. Heats must be added before stock (I-017); no expected deliveries (I-007) |
| User experience | 10% | 70 | Screens state errors in the server's words, say "not recorded" instead of inventing values, and the sample screens are labelled (I-011) |
| Performance | 8% | NOT VERIFIED | NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured |
| Integration quality | 6% | 60 | One stock list behind orders, receiving, shipping and the Inventory menu (I-012, pending confirmation). 15 dead calls removed (I-015). No supplier or carrier connection |
| Maintainability | 5% | 75 | One receiving rule and one field reader, pure and unit tested (79 tests in all). The unused RFID stock screens remain in the code |
| Observability | 4% | 70 | Every receipt, move, hold and release is a movement or hold record with the person; list price changes are in the audit log |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 89% that has evidence** | | **73** | Target 95 |

Changing routes with a success-path test: 18 of 38. Open findings against these modules: 7, of which P0 or P1: 4 (B-009, I-007, I-011, I-016).

### Manufacturing and processing

Modules: Jobs, job board and schedule; Coil work orders; Dispatch, work centers and shop-floor operations; Planning and optimization; Quality inspections; Material tracking, packages and drop tags; Maintenance and assets.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 70 | The job, schedule, work order and old operator screens showed sample data or saved nothing (M-001, M-007, M-008, M-010); all now run on real records. Production quality and BOM screens are still samples (M-011); a work order does not move stock (M-016) |
| Data integrity | 15% | 82 | Phase 2: shop-floor start, complete, reassign and job planning are all-or-nothing; job status moves are conditional on the status they were checked in (phase2-integrity, 80 checks; 8 of 8 race trials left a job stuck before the fix, 0 of 8 after). Held at 82 because a completed work order still moves no stock (M-016). Was 78 (Work orders read an allow-list and follow status rules (M-005, M-006); a status note no longer overwrites job notes (M-003). Backward job moves are loosely ruled (M-017)) |
| Reliability | 12% | 78 | Phase 2: simultaneous completion, start after cancel and double status moves are refused with a plain 409; work centers can be created again (C-004). Held at 78: 65 of 91 changing routes still have no success-path test. Was 70 (Missing jobs and work orders answer 404, not 500; concurrent work order moves are guarded; starting an inspection no longer reports failure after saving (M-015)) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 80 |
| Operational efficiency | 10% | 60 | A job opens from the board and the schedule; its status changes on one screen. Scheduling by drag, capacity limits and re-planning were not examined |
| User experience | 10% | 68 | Real data, "not recorded" instead of invented values, refusals in the server's words, sample screens labelled, false AI claims removed (M-014) |
| Performance | 8% | NOT VERIFIED | NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured |
| Integration quality | 6% | 65 | 73 dead calls removed (M-012). Work orders are not connected to stock or to jobs (M-016) |
| Maintainability | 5% | 72 | One job history module and one work order rule, pure and unit tested (87 tests in all). Three job routes still carry their own status checks (M-017) |
| Observability | 4% | 80 | Every job move, assignment and work order move is in the audit log with the person and is shown on the screen (M-002) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 89% that has evidence** | | **73** | Target 95 |

Changing routes with a success-path test: 26 of 91. Open findings against these modules: 6, of which P0 or P1: 2 (M-016, X-009).

### Logistics and financial operations

Modules: Shipping; Returns; Documents; Partner API; Freight and logistics planning; Invoices, payments, credits and refunds; Sales tax.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 75 | There was no screen to ship from and the one on the menu was a sample (F-002); web orders carried no tax (F-001). Both fixed and operated in a browser. Freight planning is still samples (F-007) |
| Data integrity | 15% | 82 | Web order totals saved; proof of delivery checked (F-005). The billing arithmetic was already sound: the cycles reconcile to zero problems |
| Reliability | 12% | 75 | Concurrent dispatch, payment and return were already guarded and still pass. Missing shipments answer 404 |
| Security | 12% | 78 | Credit terms no longer sent to the shipping desk (F-003); unsafe delivery links refused. Who may read invoices is undecided (F-009). Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open |
| Operational efficiency | 10% | 68 | A shipment is created from the order number in one dialog that shows what is left; dispatch raises the invoice. No documents print from the screen (F-011) |
| User experience | 10% | 72 | Plain status names, a confirmation before dispatch, refusals in the server's words, history with names |
| Performance | 8% | NOT VERIFIED | NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured |
| Integration quality | 6% | 68 | Shipping, stock, order, jobs and invoice move together on dispatch (cycles). The store's tax estimate and the accepted order can disagree (F-008). No carrier connection |
| Maintainability | 5% | 70 | Two small screens replace four sample ones; one event writer each for shipments and money. No unit tests added: the checks are in the sweep |
| Observability | 4% | 82 | Every shipment step and every money action is in the audit log with the person and shown on the screen (F-004, F-006) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 89% that has evidence** | | **75** | Target 95 |

Changing routes with a success-path test: 13 of 37. Open findings against these modules: 8, of which P0 or P1: 2 (B-019, X-009).

### Enterprise experience

Modules: Sign-in and sessions; Users, roles and branches; Access control; Staff and operators; Settings, tax rates and online settings; Operations cockpit and dashboards; Executive tools; Stop work; Safety, training, contractors, customer quality, supplier quality, production quality, provenance.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 45 | 58 of 143 screens are samples (X-009). None is presented as real any more, but the functions are still missing |
| Data integrity | 15% | 72 | Phase 2: two real screens no longer invent records when the server fails (C-007); an executive decision records the signed-in person. Held at 72: dashboard figures are not checked against the records. Was 70 (No invented figure is shown as real: screens labelled (X-001, X-002), dashboard fallbacks removed (X-003). Promise and cut-off rules are still invented in the browser (X-007)) |
| Reliability | 12% | 65 | A failed dashboard figure shows an error and a retry |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open |
| Operational efficiency | 10% | 40 | The menu still lists modules that do nothing; a decision per module is needed |
| User experience | 10% | 60 | One notice, in the same words, on every sample screen; false AI claims removed (X-004) |
| Performance | 8% | NOT VERIFIED | NOT VERIFIED for this group. Only the routes in the Workstream 1 benchmark were measured |
| Integration quality | 6% | 45 | Five browser-side rule services have no server (X-007) |
| Maintainability | 5% | 70 | A screen audit and a lint step run in the pull-request workflow (X-006) |
| Observability | 4% | 60 | `qa/screen-audit.md` states, for every screen, where its data comes from |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 89% that has evidence** | | **60** | Target 95 |

Changing routes with a success-path test: 3 of 50. Open findings against these modules: 10, of which P0 or P1: 5 (B-009, X-001, X-002, X-007, X-009).

