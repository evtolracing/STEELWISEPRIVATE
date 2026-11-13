# Quality scorecard

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit dffa7d2. Do not edit by hand: change the source and rerun.

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
| Platform infrastructure | 80 | 77% | 2 | 2 of 10 | No |
| Sales and customer operations | 76 | 97% | 4 | 32 of 97 | No |
| Inventory and purchasing | 76 | 97% | 3 | 20 of 40 | No |
| Manufacturing and processing | 74 | 97% | 1 | 26 of 91 | No |
| Logistics and financial operations | 79 | 97% | 2 | 31 of 40 | No |
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
| RFQs and quotes | IMPLEMENTED AND VERIFIED | 5 of 9 | S-021, B-012 |
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
| Stock items and stock levels | IMPLEMENTED AND VERIFIED | 8 of 9 |  |
| Receiving | IMPLEMENTED AND VERIFIED | 5 of 5 | I-007 |
| Second stock list (unit tracking) | DISCONNECTED | 0 of 5 | B-009, D-024 |
| Remnants | PARTIALLY IMPLEMENTED | 1 of 4 | S-009 |
| Jobs, job board and schedule | IMPLEMENTED AND VERIFIED | 9 of 20 | M-017 |
| Coil work orders | IMPLEMENTED AND VERIFIED | 5 of 5 |  |
| Dispatch, work centers and shop-floor operations | IMPLEMENTED BUT NOT VERIFIED | 6 of 17 | B-011 |
| Planning and optimization | IMPLEMENTED BUT NOT VERIFIED | 0 of 3 |  |
| Quality inspections | IMPLEMENTED BUT NOT VERIFIED | 2 of 6 |  |
| Material tracking, packages and drop tags | IMPLEMENTED BUT NOT VERIFIED | 0 of 31 | F-011 |
| Maintenance and assets | PARTIALLY IMPLEMENTED | 4 of 9 | X-009, B-017 |
| Shipping | IMPLEMENTED AND VERIFIED | 5 of 7 | F-011 |
| Returns | IMPLEMENTED AND VERIFIED | 2 of 3 |  |
| Documents | IMPLEMENTED AND VERIFIED | 2 of 3 | B-021 |
| Partner API | PARTIALLY IMPLEMENTED | 15 of 20 | H-014, B-019 |
| Integrations and scheduled work | IMPLEMENTED AND VERIFIED | 2 of 2 | B-019, E-017 |
| Freight and logistics planning | PLACEHOLDER OR MOCK | n/a | X-009 |
| Invoices, payments, credits and refunds | IMPLEMENTED AND VERIFIED | 5 of 5 | F-009, B-019 |
| Sales tax | IMPLEMENTED AND VERIFIED | n/a | F-008, D-035 |
| Request safeguards | IMPLEMENTED AND VERIFIED | n/a | E-014, E-017 |
| AI assistant and voice | IMPLEMENTED BUT NOT VERIFIED | 2 of 10 | H-012 |
| Help manual | IMPLEMENTED BUT NOT VERIFIED | n/a | M-018, X-010 |
| Background work, notifications, schedules | PARTIALLY IMPLEMENTED | n/a | B-019, D-034, H-015 |
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
| Data integrity | 15% | 86 | Phase 3: 188 foreign keys (15 added on money, stock and work references), 24 value checks (15 added), every decimal written exactly (G-001), all proven by refused writes and a residue check of 0. Held at 86: 217 reference columns still have no key (G-003), the two JSON stores remain (B-009). Was 75 (0 to 8 value checks; reconciliation clean. Balance identity still code-only (E-020)) |
| Reliability | 12% | 80 | Phase 4: a retry after a lost answer or a dropped connection gets the first result (H-004); one partner can no longer receive another's answer (H-003); a burst of 80 events is sent within a second (H-019). Held at 80: no restore has been tested (E-015), the host pool is unverified (G-015), the schedule that carries out retries is not set on the host (B-019). Was 62 (Job list failed under 20 simultaneous requests, now passes. Clean exit and shutdown. No restore test, no staging (E-015)) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 80 |
| Operational efficiency | 10% | NOT VERIFIED | No evidence gathered |
| User experience | 10% | NOT VERIFIED | No evidence gathered |
| Performance | 8% | 82 | Phase 3: measured on an 85-branch copy (72,240 orders, 100,233 stock items): every branch list within 500 ms; 400 requests at once with 0 failures. Held at 82: local machine only; stock search and job count grow with the company (G-013); 244 KB order list reply (G-014). Was 80 (7 routes over target to 0; 104 MB reply to 1.2 MB. Operations cockpit answers in about 1 s at volume, was no reply (E-023)) |
| Integration quality | 6% | 76 | Phase 4: every call to an outside service has a time limit, bounded tries, a breaker and a plain failure answer (H-005); events to partners are saved with the change, retried, stopped after five tries and replayable (H-002); reply shapes are pinned by contract tests; a database refusal is a 409, not a 500 (H-017). Held at 76: list shapes still differ (E-021); the host schedule is not set (B-019); email, cards, carriers, tax and accounting are not connected (H-015); the breaker and limits count per instance (H-012). Was 62 (155 of 352 screen calls have no route (D-020), unchanged; reply shapes inconsistent (E-021)) |
| Maintainability | 5% | 65 | Phase 2: the branch boundary, the department table and the login rules each live in one tested file; a coverage check fails the gates when a changing route has no rule. Held at 65: most rules still live in route handlers (B-014) and 1,524 lint warnings remain. Was 57 (47 unit tests on every pull request; no lint (E-016); large files (E-018)) |
| Observability | 4% | 70 | Phase 4: an Integrations screen and report show failed and waiting events, outside-service failures, orders shipped but not invoiced and when scheduled work last ran; failures are structured log lines with a request id and no secret (tested). Held at 70: nothing alerts anyone (E-017). Was 60 (Request id and log line added; no alerting (E-017)) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 77% that has evidence** | | **80** | Target 95 |

Changing routes with a success-path test: 2 of 10. Open findings against these modules: 8, of which P0 or P1: 2 (B-019, E-014).

### Sales and customer operations

Modules: Customers; RFQs and quotes; Order entry; Sales orders; Pricing and customer tiers; Credit control; Counter quick sale; Counter session flow (older); Web store; Customer account pages; Promise dates, cut-offs, branch comparison, split shipments; Order hub and intake pipeline; Mobile rep.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 80 | Placeholder counter price, tier prices, mobile orders, customer preferences save and the Pricing screen all repaired (S-001, S-002, S-005, S-014, S-017). Promise dates are still invented (S-010) |
| Data integrity | 15% | 90 | Phase 3: order totals enforced by the database; duplicate order requests answered once (C-006); a void is one transaction (C-010); quotes keep their price and branch; an order cannot ship or bill without reserved stock (G-019, owner decision). Held at 90: the void marker is text (G-009). Was 82 (Order entry validated and transactional, tax saved, field allow-lists (S-006, S-007, S-016). 150 of 150 jobs, reconciliation 0 problems) |
| Reliability | 12% | 78 | Phase 4: an order edit made from an old copy is refused on the API (G-020, opt-in); a quote accepted from two sides at once makes one order. Held at 78: no screen sends the version yet; most sales routes have no success-path test. Was 65 (A failed edit no longer destroys order lines. No retry or offline behaviour on mobile; says so) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 82 |
| Operational efficiency | 10% | 62 | One price everywhere removes re-keying. Quotes still priced by hand (S-027). Credit limits are now enforced with a manager release (rule 32) |
| User experience | 10% | 68 | Screens show the server's own error text; sample data removed from four screen groups. Branch list on entry screens still fixed (S-008) |
| Performance | 8% | 80 | Phase 3: order, quote, request and customer lists measured at 85 branches: 5 to 57 ms at the 95th percentile. Held at 80: local machine; 244 KB reply for 50 orders (G-014). Was null (New routes are counted or capped (200 rows). No benchmark of sales routes was run in this workstream) |
| Integration quality | 6% | 68 | Phase 4: a customer system can raise a request for quote, read and answer quotes, and read its orders, shipments and invoices, isolated from other customers (H-001); what a partner reads equals what staff see. Held at 68: no email or text (D-034, H-015); web checkout payment is a note (H-013); 18 sales calls have no route (S-026). Was 60 (Overrides, dashboard, mobile and pricing now have routes. 18 sales calls still have none (S-026). No card, email or text service (D-033, D-034)) |
| Maintainability | 5% | 70 | One pricing rule and one tax rule, pure and unit tested (55 tests). Two unused sales paths remain (S-021, S-022) |
| Observability | 4% | 72 | Phase 3: confirming, cancelling and reserving now leave a history line with the person, in the same transaction (G-010). Held at 72: edits to other order fields are not itemised (G-011). Was 65 (Audit entries for overrides, tier, credit limit, tax status and list price changes; request ids from Workstream 1) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 97% that has evidence** | | **76** | Target 95 |

Changing routes with a success-path test: 32 of 97. Open findings against these modules: 13, of which P0 or P1: 4 (B-009, S-010, X-007, X-009).

### Inventory and purchasing

Modules: Products, grades and heats; Processing recipes and bills of material; Customer specifications; Stock items and stock levels; Receiving; Second stock list (unit tracking); Remnants.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 72 | Stock, heat and receiving screens showed sample data and the upload saved nothing; all now run on real records (I-001, I-002, I-005, I-006). No purchase orders, adjustments or counts (I-007, I-016) |
| Data integrity | 15% | 91 | Phase 3: races closed; exact weights; 18 reconciliation checks at 0; the ledger explains every balance including pieces, cuts, scrap and corrections; nothing ships unreserved (G-019); corrections after a count with reason, note and person (I-016); a remnant reduces its parent (G-006). Held at 91: no in-transit stage (G-007); the second stock list (B-009); no cycle-count program. Was 85 (Field allow-lists on every stock and catalog write; receipt is one transaction; the database enforces the balance identity (I-004, I-013). 150 of 150 jobs, reconciliation 0 problems) |
| Reliability | 12% | 81 | Phase 3: reservations, receipts, holds, transfers, returns and corrections each raced and each safe; a correction racing a reservation and a shipment leaves the books in balance. Held at 81: transfer receipt does not exist to test. Was 70 (Upload reports each failed row and keeps the good ones; concurrent hold and transfer guarded by conditional updates. No retry or resume for a large upload) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 85 |
| Operational efficiency | 10% | 62 | Receive, hold, release and move can be done on screen. Heats must be added before stock (I-017); no expected deliveries (I-007) |
| User experience | 10% | 70 | Screens state errors in the server's words, say "not recorded" instead of inventing values, and the sample screens are labelled (I-011) |
| Performance | 8% | 78 | Phase 3: a branch's stock list 1.5 ms and one heat's 31,605 items 23 ms on the scale copy. Held at 78: the stock search scans every item (140 ms at 100,233; G-013); the benchmark branch held no stock. Was null (Lists are capped (500) and paged with a total count. An upload is capped at 2,000 rows and runs one row at a time; not timed) |
| Integration quality | 6% | 64 | Phase 4: a supplier reads and acknowledges its own purchase orders through the partner API. Held at 64: supplier shipping notices, corrective actions and scorecards answer 501 (H-014); no supplier or carrier connection. Was 60 (One stock list behind orders, receiving, shipping and the Inventory menu (I-012, pending confirmation). 15 dead calls removed (I-015). No supplier or carrier connection) |
| Maintainability | 5% | 75 | One receiving rule and one field reader, pure and unit tested (79 tests in all). The unused RFID stock screens remain in the code |
| Observability | 4% | 70 | Every receipt, move, hold and release is a movement or hold record with the person; list price changes are in the audit log |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 97% that has evidence** | | **76** | Target 95 |

Changing routes with a success-path test: 20 of 40. Open findings against these modules: 6, of which P0 or P1: 3 (B-009, I-007, I-011).

### Manufacturing and processing

Modules: Jobs, job board and schedule; Coil work orders; Dispatch, work centers and shop-floor operations; Planning and optimization; Quality inspections; Material tracking, packages and drop tags; Maintenance and assets.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 70 | The job, schedule, work order and old operator screens showed sample data or saved nothing (M-001, M-007, M-008, M-010); all now run on real records. Production quality and BOM screens are still samples (M-011); a work order does not move stock (M-016) |
| Data integrity | 15% | 87 | Phase 3, owner decision: completing a work order takes output and scrap off the source, creates the pieces with the source heat, and carries a line's reservation into them, in one transaction; several work orders on one item are safe under a lock (three raced: two fit, one refused). Three read-only checks at 0. Held at 87: shop-floor jobs record no weights; a completed work order cannot be reversed. Was 78 (Work orders read an allow-list and follow status rules (M-005, M-006); a status note no longer overwrites job notes (M-003). Backward job moves are loosely ruled (M-017)) |
| Reliability | 12% | 78 | Phase 2: simultaneous completion, start after cancel and double status moves are refused with a plain 409; work centers can be created again (C-004). Held at 78: 65 of 91 changing routes still have no success-path test. Was 70 (Missing jobs and work orders answer 404, not 500; concurrent work order moves are guarded; starting an inspection no longer reports failure after saving (M-015)) |
| Security | 12% | 78 | Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open. Was 80 |
| Operational efficiency | 10% | 60 | A job opens from the board and the schedule; its status changes on one screen. Scheduling by drag, capacity limits and re-planning were not examined |
| User experience | 10% | 68 | Real data, "not recorded" instead of invented values, refusals in the server's words, sample screens labelled, false AI claims removed (M-014) |
| Performance | 8% | 72 | Phase 3: the branch job list answers in 158 ms at the 95th percentile with 72,541 jobs. Held at 72: it reads every job in the company (G-013); nothing else in the group was measured. Was null (The schedule asks for one day of jobs, not the whole list. Nothing timed) |
| Integration quality | 6% | 65 | 73 dead calls removed (M-012). Work orders are not connected to stock or to jobs (M-016) |
| Maintainability | 5% | 72 | One job history module and one work order rule, pure and unit tested (87 tests in all). Three job routes still carry their own status checks (M-017) |
| Observability | 4% | 80 | Every job move, assignment and work order move is in the audit log with the person and is shown on the screen (M-002) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 97% that has evidence** | | **74** | Target 95 |

Changing routes with a success-path test: 26 of 91. Open findings against these modules: 5, of which P0 or P1: 1 (X-009).

### Logistics and financial operations

Modules: Shipping; Returns; Documents; Partner API; Integrations and scheduled work; Freight and logistics planning; Invoices, payments, credits and refunds; Sales tax.

| Category | Weight | Score | Evidence and weaknesses |
|---|---:|---:|---|
| Functional correctness | 15% | 75 | There was no screen to ship from and the one on the menu was a sample (F-002); web orders carried no tax (F-001). Both fixed and operated in a browser. Freight planning is still samples (F-007) |
| Data integrity | 15% | 92 | Phase 3: invoice identity and links enforced by the database; tax across part shipments to the cent; 11 financial checks at 0; a shipment cannot be billed unless stock left the books (G-019); invoice and credit memo numbers never skipped or repeated from the counter's start (twelve at once take twelve in a row). Held at 92: numbers issued earlier keep their gaps; carrier partner routes are broken (C-002). Was 82 (Web order totals saved; proof of delivery checked (F-005). The billing arithmetic was already sound: the cycles reconcile to zero problems) |
| Reliability | 12% | 84 | Phase 4: a billing failure at dispatch is said, recorded and listed until closed (H-006); a carrier's repeated or late report changes nothing; dispatch and delivery carry request keys from the screen (H-009). Held at 84: nothing retries a failed invoice on its own. Was 75 (Concurrent dispatch, payment and return were already guarded and still pass. Missing shipments answer 404) |
| Security | 12% | 78 | Credit terms no longer sent to the shipping desk (F-003); unsafe delivery links refused. Who may read invoices is undecided (F-009). Phase 2: the branch boundary is enforced on the server for 15 record types (37 checks) and every changing route falls under a department rule (coverage check, 0 without). Capped at 78 by judgement while C-009 (records with no branch column) and E-014 (request limit per instance) are open |
| Operational efficiency | 10% | 68 | A shipment is created from the order number in one dialog that shows what is left; dispatch raises the invoice. No documents print from the screen (F-011) |
| User experience | 10% | 72 | Plain status names, a confirmation before dispatch, refusals in the server's words, history with names |
| Performance | 8% | 80 | Phase 3: shipment and invoice lists measured at 85 branches: 18 and 101 ms at the 95th percentile for a branch login, 267 ms for an all-branch login. Held at 80: local machine; a branch's invoices are found by scanning every invoice (16 ms now). Was null (The list is capped at 200 and searched on the server. Nothing timed) |
| Integration quality | 6% | 78 | Phase 4: a carrier reports through the partner API under the same rules as the shipping desk (H-001); dispatch, delivery, exception and invoice raise durable events (H-002); an order shipped but not invoiced is reported (H-006). Held at 78: no carrier rating, label or tracking service and no card processor (H-015); web checkout takes no payment (H-013). Was 68 (Shipping, stock, order, jobs and invoice move together on dispatch (cycles). The store's tax estimate and the accepted order can disagree (F-008). No carrier connection) |
| Maintainability | 5% | 70 | Two small screens replace four sample ones; one event writer each for shipments and money. No unit tests added: the checks are in the sweep |
| Observability | 4% | 82 | Every shipment step and every money action is in the audit log with the person and shown on the screen (F-004, F-006) |
| Accessibility | 3% | NOT VERIFIED | NOT VERIFIED. Never tested. 301 icon-only buttons, 32 labels (B-015) |
| **Weighted over the 97% that has evidence** | | **79** | Target 95 |

Changing routes with a success-path test: 31 of 40. Open findings against these modules: 9, of which P0 or P1: 2 (B-019, X-009).

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

