# Module quality scorecard

Rubric and weights are in `enterprise-excellence-audit.md`. A module is scored only once its workstream has audited it; a score without an audit would be a guess.

## Platform infrastructure (Workstream 1)

User experience, operational efficiency and accessibility do not apply to the platform layer, so the remaining weights are rescaled to 100.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 80 | 85 | 150 of 150 jobs before and after; job-list second path removed (E-002); invented analytics removed (E-006) |
| Data integrity | 60 | 75 | 0 to 8 value checks; reconciliation clean. Balance identity still code-only (E-020) |
| Reliability | 50 | 62 | Job list failed under 20 simultaneous requests, now passes. Clean exit and shutdown. No restore test, no staging (E-015) |
| Security | 72 | 80 | Sweep passes; vulnerable packages 19 to 3, none high. Rate limit still per instance (E-014) |
| Performance | 35 | 80 | 7 routes over target to 0; 104 MB reply to 1.2 MB. Operations cockpit answers in about 1 s at volume, was no reply (E-023) |
| Integration quality | 60 | 62 | 155 of 352 screen calls have no route (D-020), unchanged; reply shapes inconsistent (E-021) |
| Maintainability | 55 | 57 | 47 unit tests on every pull request; no lint (E-016); large files (E-018) |
| Observability | 25 | 60 | Request id and log line added; no alerting (E-017) |
| **Weighted** | **59** | **73** | |

Target is 95. The platform layer is not there. The largest gaps are a tested restore, a staging environment, alerting and the shared rate limit.

## Other modules

| Module group | Workstream | Score |
|---|---|---|
| Sales and customer operations | 2 | 73 (was 45), see below |
| Inventory and purchasing | 3 | 68 (was 30), see below |
| Manufacturing and processing | 4 | 66 (was 35), see below |
| Logistics and financial operations | 5 | 70 (was 40), see below |
| Enterprise administration, reporting, navigation | 6 | Not yet audited |

## Sales and customer operations (Workstream 2)

Covers customers, pricing, RFQs and quotes, order entry, Retail POS and counter sale, Sales Rep Mobile, Sales Dashboard, overrides and the online store's pricing.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 40 | 80 | Placeholder counter price, tier prices, mobile orders, customer preferences save and the Pricing screen all repaired (S-001, S-002, S-005, S-014, S-017). Promise dates are still invented (S-010) |
| Data integrity | 40 | 82 | Order entry validated and transactional, tax saved, field allow-lists (S-006, S-007, S-016). 150 of 150 jobs, reconciliation 0 problems |
| Reliability | 50 | 65 | A failed edit no longer destroys order lines. No retry or offline behaviour on mobile; says so |
| Security | 55 | 82 | Server decides the price level; staff-only fields hidden from customer logins; tier, credit limit and list price need a manager and are audited (S-003, S-013, S-015, S-018). Cost is no longer sent to sales roles (S-023, fixed in Workstream 3) |
| Operational efficiency | 45 | 62 | One price everywhere removes re-keying. Quotes still priced by hand (S-027). Credit limits are now enforced with a manager release (rule 32) |
| User experience | 45 | 68 | Screens show the server's own error text; sample data removed from four screen groups. Branch list on entry screens still fixed (S-008) |
| Performance | Not measured | Not measured | New routes are counted or capped (200 rows). No benchmark of sales routes was run in this workstream |
| Integration quality | 40 | 60 | Overrides, dashboard, mobile and pricing now have routes. 18 sales calls still have none (S-026). No card, email or text service (D-033, D-034) |
| Maintainability | 45 | 70 | One pricing rule and one tax rule, pure and unit tested (55 tests). Two unused sales paths remain (S-021, S-022) |
| Observability | 40 | 65 | Audit entries for overrides, tier, credit limit, tax status and list price changes; request ids from Workstream 1 |
| Accessibility | Not measured | Not measured | New screens use labelled tables and controls. No keyboard or contrast audit was run |
| **Weighted** | **45** | **73** | Performance and accessibility left out and the other weights rescaled to 100 |

Target is 95. The module is not there. The largest gaps are the promise engine (S-010), quote pricing (S-027), outside services, and the fact that none of this is live.

## Inventory and purchasing (Workstream 3)

Covers stock items, heats, grades, products, receiving, the stock upload, holds, transfers, stock balances and the supplier quality screens. Purchasing itself does not exist (I-007), which caps this module.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 20 | 72 | Stock, heat and receiving screens showed sample data and the upload saved nothing; all now run on real records (I-001, I-002, I-005, I-006). No purchase orders, adjustments or counts (I-007, I-016) |
| Data integrity | 40 | 85 | Field allow-lists on every stock and catalog write; receipt is one transaction; the database enforces the balance identity (I-004, I-013). 150 of 150 jobs, reconciliation 0 problems |
| Reliability | 45 | 70 | Upload reports each failed row and keeps the good ones; concurrent hold and transfer guarded by conditional updates. No retry or resume for a large upload |
| Security | 40 | 85 | Cost limited to buying and managing roles; list price changes need a manager and are recorded; identities come from the sign-in (I-009, I-010, I-004) |
| Operational efficiency | 25 | 62 | Receive, hold, release and move can be done on screen. Heats must be added before stock (I-017); no expected deliveries (I-007) |
| User experience | 30 | 70 | Screens state errors in the server's words, say "not recorded" instead of inventing values, and the sample screens are labelled (I-011) |
| Performance | Not measured | Not measured | Lists are capped (500) and paged with a total count. An upload is capped at 2,000 rows and runs one row at a time; not timed |
| Integration quality | 30 | 60 | One stock list behind orders, receiving, shipping and the Inventory menu (I-012, pending confirmation). 15 dead calls removed (I-015). No supplier or carrier connection |
| Maintainability | 40 | 75 | One receiving rule and one field reader, pure and unit tested (79 tests in all). The unused RFID stock screens remain in the code |
| Observability | 35 | 70 | Every receipt, move, hold and release is a movement or hold record with the person; list price changes are in the audit log |
| Accessibility | Not measured | Not measured | New screens use labelled tables and controls. No keyboard or contrast audit was run |
| **Weighted** | **30** | **68** | Performance and accessibility left out and the other weights rescaled to 100 |

Target is 95. The module is not there. The largest gaps are purchasing (I-007), stock adjustments and counts (I-016), supplier quality (I-011), and the fact that none of this is live.

Not examined in this workstream: cycle counting, reorder points and replenishment, stock valuation and costing method, consignment stock, whether customer-owned stock can be reserved for another customer, the remnant marketplace, RFID and etched-ID scanning, bin-level capacity.

## Manufacturing and processing (Workstream 4)

Covers jobs, the job screen, the order boards, the schedule screen, time tracking, coil work orders, and the production quality and BOM screens. The path an order really takes (job created, planned, operations run, inspected, packaged, shipped) is exercised 150 times by the simulation and passes.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 35 | 70 | The job, schedule, work order and old operator screens showed sample data or saved nothing (M-001, M-007, M-008, M-010); all now run on real records. Production quality and BOM screens are still samples (M-011); a work order does not move stock (M-016) |
| Data integrity | 45 | 78 | Work orders read an allow-list and follow status rules (M-005, M-006); a status note no longer overwrites job notes (M-003). Backward job moves are loosely ruled (M-017) |
| Reliability | 50 | 70 | Missing jobs and work orders answer 404, not 500; concurrent work order moves are guarded; starting an inspection no longer reports failure after saving (M-015) |
| Security | 45 | 80 | No mass assignment on work orders; assignee checked; identities from the sign-in; customers refused (Sweep 19 and the existing sweeps) |
| Operational efficiency | 35 | 60 | A job opens from the board and the schedule; its status changes on one screen. Scheduling by drag, capacity limits and re-planning were not examined |
| User experience | 30 | 68 | Real data, "not recorded" instead of invented values, refusals in the server's words, sample screens labelled, false AI claims removed (M-014) |
| Performance | Not measured | Not measured | The schedule asks for one day of jobs, not the whole list. Nothing timed |
| Integration quality | 40 | 65 | 73 dead calls removed (M-012). Work orders are not connected to stock or to jobs (M-016) |
| Maintainability | 40 | 72 | One job history module and one work order rule, pure and unit tested (87 tests in all). Three job routes still carry their own status checks (M-017) |
| Observability | 20 | 80 | Every job move, assignment and work order move is in the audit log with the person and is shown on the screen (M-002) |
| Accessibility | Not measured | Not measured | New screens use labelled tables and controls. No keyboard or contrast audit was run |
| **Weighted** | **35** | **66** | Performance and accessibility left out and the other weights rescaled to 100 |

Target is 95. The module is not there. The largest gaps are production quality and bills of material (M-011), work orders that do not move stock (M-016), and everything listed below as not examined.

Not examined in this workstream: the dispatch engine and how it assigns operations, the planning boards, processing recipes and their versions, the shop floor queue screens beyond what the cycles drive through the API, packaging and drop tags, maintenance, downtime, capacity limits, scheduling by drag and drop, and labor costing.

## Logistics and financial operations (Workstream 5)

Covers the Shipping and Shipment screens, the shipment routes, accepted web orders, invoices, payments, credits, refunds, and the freight and logistics sample screens. The money path (dispatch, invoice, payment, credit, refund, return) is exercised by the three 50-job cycles on every run, including three payments at once on one invoice. Not examined: shipping documents and printing (F-011), freight cost on orders, the carrier and tracking screens beyond labelling them, customer statements and ageing, the tax rate admin screen, the counter sale screens (Workstream 2 examined pricing there), and returns beyond crediting.

| Category | Before | After | Evidence |
|---|---:|---:|---|
| Functional correctness | 35 | 75 | There was no screen to ship from and the one on the menu was a sample (F-002); web orders carried no tax (F-001). Both fixed and operated in a browser. Freight planning is still samples (F-007) |
| Data integrity | 55 | 82 | Web order totals saved; proof of delivery checked (F-005). The billing arithmetic was already sound: the cycles reconcile to zero problems |
| Reliability | 60 | 75 | Concurrent dispatch, payment and return were already guarded and still pass. Missing shipments answer 404 |
| Security | 50 | 78 | Credit terms no longer sent to the shipping desk (F-003); unsafe delivery links refused. Who may read invoices is undecided (F-009) |
| Operational efficiency | 25 | 68 | A shipment is created from the order number in one dialog that shows what is left; dispatch raises the invoice. No documents print from the screen (F-011) |
| User experience | 30 | 72 | Plain status names, a confirmation before dispatch, refusals in the server's words, history with names |
| Performance | Not measured | Not measured | The list is capped at 200 and searched on the server. Nothing timed |
| Integration quality | 45 | 68 | Shipping, stock, order, jobs and invoice move together on dispatch (cycles). The store's tax estimate and the accepted order can disagree (F-008). No carrier connection |
| Maintainability | 50 | 70 | Two small screens replace four sample ones; one event writer each for shipments and money. No unit tests added: the checks are in the sweep |
| Observability | 15 | 82 | Every shipment step and every money action is in the audit log with the person and shown on the screen (F-004, F-006) |
| Accessibility | Not measured | Not measured | New screens use labelled tables and controls. No keyboard or contrast audit was run |
| **Weighted** | **40** | **70** | Performance and accessibility left out and the other weights rescaled to 100. The figures are a judgement from the evidence listed, not a measurement |
