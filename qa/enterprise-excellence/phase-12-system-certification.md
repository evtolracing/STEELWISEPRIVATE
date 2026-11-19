# Phase 12: what the system has, capability by capability

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

Every capability the Phase 12 prompt lists, with what the product actually has. Nothing was invented to fill a gap. "VERIFIED ON QA" is given only where the suite named passed in this run; the tool that writes this page downgrades a row whose suite did not.

**129 capabilities: 42 PARTIAL, 70 VERIFIED ON QA, 1 SAMPLE ONLY, 15 NOT BUILT, 1 NOT VERIFIED.**

Screens: 146 in all; 78 real, 4 mixed, 58 labelled samples, 6 static (`qa/screen-audit.md`). endpoints 662, mounts 82, routes 140, models 172, enums 96, mock services 4

## System inventory (section 5)

13 PARTIAL, 13 VERIFIED ON QA, 1 SAMPLE ONLY.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| CRM | PARTIAL | Customer accounts, divisions, contacts on a request, price tier, credit settings are real. Rep activity, visits, opportunities and follow-ups have no table | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | J-008, S-020 |
| RFQ | VERIFIED ON QA | Requests from the sales desk, the web shop and the partner API reach one inbox with every requirement kept | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 4 integration scenarios: 66 of 66 pass, 555 checks | S-027 |
| Quoting | VERIFIED ON QA | Quote, approval, send, accept to order, lapse; lines priced by hand | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | S-027 |
| Pricing | PARTIAL | List price and customer tier and contract price are applied. Six customer settings, including the default discount, are stored and applied nowhere | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks | J-008, S-020, U-012 |
| Product configuration | PARTIAL | Grade, size, tolerances, finish, certificates and processing travel from request to work order. No configurator with rules between fields | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Sales orders | VERIFIED ON QA | Entry, change with a stale-copy check, hold, cancel, close | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks | G-020 |
| POS | VERIFIED ON QA | Counter sale paid on the spot, void, branch of the cashier; three presses make one sale | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | J-012, W-012, D-033 |
| Ecommerce | VERIFIED ON QA | Shop, cart, checkout with a request key, order inbox. The promise date at checkout is a demonstration and labelled | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: shop browser suite: 31 checks, 0 failed; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | F-008, S-010, X-007 |
| Customer portal | VERIFIED ON QA | A customer login sees its own account's orders, shipments, invoices and documents only | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: sweep: 20 groups pass, 0 fail; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Purchasing | PARTIAL | Purchase orders, placing, receipts in parts, close, supply position. No requisitions, no approvals, no supplier invoices, no replenishment | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | K-010, K-011, K-012, W-009 |
| Receiving | VERIFIED ON QA | Against a purchase order line with heat, certificate hold and over-receipt hold | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | I-017, W-006, W-007 |
| Inventory | PARTIAL | One authoritative stock list with heat, cost and branch. A second, unconnected unit-tracking list still exists beside it | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 3 database scenarios: 74 of 74 pass, 612 checks; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | I-012 (D-024), B-009, K-007 |
| Reservations | VERIFIED ON QA | Reserve, release, refuse over-reservation under concurrency | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks |  |
| Transfers | VERIFIED ON QA | Send, in transit, receive, shortage decided; both branches agree | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; pass: Phase 12 "Multi-location readiness" 6 of 6 | W-002 |
| Manufacturing | PARTIAL | Work orders with pieces and scrap; jobs through planned steps. No bill of materials, no material requirements, no outside processing | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | L-026, L-027, M-011 |
| Scheduling | PARTIAL | Queue order per work center with times where estimates exist. No capacity against a calendar | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-025 |
| MES | PARTIAL | Start, pause, complete by an operator, time recorded from them. No machine connection | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks | L-030 |
| Quality | PARTIAL | A QC gate on jobs with pass, fail, rework and holds. Nonconformance, corrective action, supplier quality and SPC are sample screens | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | L-023, L-028, I-011, M-011 |
| Shipping | VERIFIED ON QA | Shipment, papers, dispatch with its invoice in one step, delivery, part shipment, problem shipments | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | Z-006, Z-012 |
| Logistics | SAMPLE ONLY | No carrier, rate, route or tracking feed is connected. The freight and logistics planning screens are labelled samples | pass: 155 screens measured; 0 counts over the ceiling | N-026, U-035 |
| Invoicing | VERIFIED ON QA | Written at dispatch, gapless numbers, payment, credit, refund, cancel | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; pass: Phase 12 "Financial ledger certification" 16 of 16 | Z-006 |
| Financial ledger | PARTIAL | Built, verified on test data, and switched off. Blocked by design until an accountant approves the chart, mappings and policies | pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | W-001 and W-002 to W-012 |
| Reporting | PARTIAL | Operational dashboards and ledger reports agree with the records. No report builder; exports are the ledger export and CSV where a screen offers it | pass: Phase 12 "Dashboards and reports agree with the records" 7 of 7; pass: in the gate Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks (the gate's failure passed; a different scenario failed because the rerun followed Phase 11's data, and passes in gate order) | V-037 |
| AI assistants | PARTIAL | A read-only assistant limited by role and branch. Tested against a stand-in for the AI service: what a real model answers is not verified | pass: Phase 12 "AI assistants" 9 of 9; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks |  |
| Administration | VERIFIED ON QA | Users, roles, home branch, partner keys, tax rates, audit log, integrations report | pass: Phase 10 security: 277 of 277 pass, 889 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Security | VERIFIED ON QA | See the security certification | pass: Phase 10 security: 277 of 277 pass, 889 checks; pass: sweep: 20 groups pass, 0 fail; pass: Phase 12 "Security and access revalidation" 11 of 11 | Y-008, W-014, E-011 |
| Integrations | PARTIAL | Partner API and webhooks are built and tested against stubs. Card, email, text, carrier and accounting systems are not connected | pass: Phase 4 integration scenarios: 66 of 66 pass, 555 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks | H-015, D-034, N-025 |

## Sales and customer lifecycle (section 7)

7 VERIFIED ON QA, 2 NOT BUILT, 4 PARTIAL.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Customer creation | VERIFIED ON QA | Created, edited, closed and reopened with an audit line | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| CRM activity | NOT BUILT | No activity, visit or follow-up record exists | none |  |
| RFQ intake | VERIFIED ON QA | Three channels, one inbox | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 4 integration scenarios: 66 of 66 pass, 555 checks |  |
| Product configuration | PARTIAL | Requirements carried end to end; no rule engine | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Contract pricing | VERIFIED ON QA | Contract and tier price applied at order entry and at the counter | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks | J-008 |
| Quoting | VERIFIED ON QA | As above | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | S-027 |
| Approvals | PARTIAL | Quote approval and price-floor override with a reason and an audit line. No approval chain by amount | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Quote revisions | PARTIAL | A quote is edited until sent; a new quote replaces a lapsed one. No numbered revision history | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Sales orders | VERIFIED ON QA | As above | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Backorders | PARTIAL | A line shipped in part stays open for the remainder. No backorder record of its own | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Order changes | VERIFIED ON QA | Changes refused from a stale copy; status moves by rule | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 4 integration scenarios: 66 of 66 pass, 555 checks | G-020 |
| Cancellations | VERIFIED ON QA | Cancel releases reservations; a cancel racing a dispatch never leaves both | pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks; pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Customer communication | NOT BUILT | No email or text is sent. The buttons say so. The owner put this later (decision 5) | none | D-034, N-028 |

## POS and ecommerce (section 8)

8 VERIFIED ON QA, 2 PARTIAL, 1 NOT BUILT.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Product search and selection | VERIFIED ON QA | Shop search and counter item pick | pass: shop browser suite: 31 checks, 0 failed; pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Customer identification | VERIFIED ON QA | Account forced from the login on the web; chosen at the counter | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Pricing | VERIFIED ON QA | List, tier, contract | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Tax | PARTIAL | By state, where a rate is on file; none charged where none is, and the screen says so. Counties and cities are not on record. Web estimate by ship-to, order taxed by selling branch | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Multi-location readiness" 6 of 6 | D-035, F-008 |
| Payment or approved terms | PARTIAL | A payment is a typed record with the approval code from a separate terminal. No card is charged by the product | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | D-033, H-015 |
| Order creation | VERIFIED ON QA | One order per request key | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks |  |
| Inventory effects | VERIFIED ON QA | Shelf stock falls once; refused when short | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | W-012 |
| Receipt generation | VERIFIED ON QA | Receipt shown and reprintable. Not printed on a printer here | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks | K-013 |
| Ecommerce order intake | VERIFIED ON QA | Online inbox, accept to sales order | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Customer portal updates | VERIFIED ON QA | Order, shipment and invoice state read by the customer | pass: Phase 5 sales scenarios: 76 of 76 pass, 387 checks |  |
| Sandbox payment systems | NOT BUILT | There is no payment integration to put in a sandbox | none | D-033 |

## Inventory (section 9)

11 VERIFIED ON QA, 4 PARTIAL, 2 NOT BUILT.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Material master | VERIFIED ON QA | Grades, products, heat and grade required by the database | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 3 database scenarios: 74 of 74 pass, 612 checks |  |
| Units of measure | VERIFIED ON QA | One unit per balance; conversions by rule | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks |  |
| Heat and lot tracking | VERIFIED ON QA | Heat carried from receipt to every piece and shipment | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Certifications | PARTIAL | Certificate upload and a hold when a required one is missing. The check is that a document is attached, not what it says | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Receiving | VERIFIED ON QA | As above | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | I-017 |
| Putaway | NOT BUILT | No putaway step or task | none | K-009 |
| Bin locations | NOT BUILT | A typed bin text on the item; no bin master | none | K-009 |
| Reservations and allocation | VERIFIED ON QA | As above | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks |  |
| Picking | PARTIAL | Pick list paper from the shipment. No pick confirmation by scan | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks | K-013 |
| Transfers | VERIFIED ON QA | As above | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Adjustments | VERIFIED ON QA | With a reason, an audit line and a ledger entry | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Cycle counts | PARTIAL | A single-item correction only. No count programme, sheets or variance approval | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks | K-008 |
| Remnants | PARTIAL | Pieces from a work order are stock. The Steel Outlet remnant list is separate and its discounts are fixed in code | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | K-006, S-009 |
| Scrap | VERIFIED ON QA | Recorded on work orders and returns, valued at cost on file | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Returns | VERIFIED ON QA | Return, receive, restock or scrap, credit with tax | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Authoritative quantities reconciled | VERIFIED ON QA | On hand equals available plus reserved plus held on every item; books equal stock at cost | pass: Phase 12 "Financial and inventory reconciliation" 6 of 6; pass: database checks after the scenarios |  |
| Branch isolation | VERIFIED ON QA | Enforced under every route | pass: Branch boundary: 39 checks, 0 problems; pass: Phase 12 "Security and access revalidation" 11 of 11; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |

## Purchasing (section 10)

5 PARTIAL, 3 NOT BUILT, 3 VERIFIED ON QA.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Supplier management | PARTIAL | Suppliers are organisations with contact details. No supplier terms, ratings or approvals | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks | I-011 |
| Purchase requisitions | NOT BUILT | None | none |  |
| Purchase orders | VERIFIED ON QA | As above | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Approvals | NOT BUILT | A purchase order needs no approval | none | K-011 |
| Supplier pricing | PARTIAL | The price typed on the line; no supplier price list | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks |  |
| Partial receipts | VERIFIED ON QA | A line received in parts; the remainder stays on order | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Overreceipts | PARTIAL | Exact quantity enforced; more is held. No tolerance is set | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks | K-011 |
| Cost updates | VERIFIED ON QA | Cost per item from the purchase order line at receipt, carried to pieces | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 | K-007 |
| Replenishment | NOT BUILT | A supply position to read; no reorder points or suggestions | none | K-010 |
| Receiving discrepancies | PARTIAL | Over-receipt and missing certificate are held. No discrepancy report to the supplier | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks | I-011 |
| Financial consequences | PARTIAL | A receipt debits inventory and credits a clearing account. Nothing ever clears it: supplier invoices are not in the product | pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 | W-009, K-012 |

## Manufacturing and MES (section 11)

10 VERIFIED ON QA, 2 NOT BUILT, 4 PARTIAL.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Work orders | VERIFIED ON QA | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Routing | VERIFIED ON QA | Processing recipes: versioned steps a job follows in order | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| BOMs | NOT BUILT | What is called a BOM recipe is a routing. No bill of materials | none | M-011 |
| Work centers | VERIFIED ON QA | Master data with validation and lockout | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 2 integrity: 82 checks, 0 problems |  |
| Scheduling | PARTIAL | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-025 |
| Dispatch | VERIFIED ON QA | Dispatch board per branch | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Material consumption | VERIFIED ON QA | Through the work order: weight in, pieces and scrap out, nothing created from nothing | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Machine assignment | VERIFIED ON QA | A step runs on a work center of the right kind | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| Labor tracking | PARTIAL | Time from start and complete. Labor rates must be entered before job cost means anything | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-026 |
| Production completion | VERIFIED ON QA | Completion moves the job on, to QC where required | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Scrap | VERIFIED ON QA | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Remnants | PARTIAL | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | K-006 |
| Rework | VERIFIED ON QA | A rework step added to the plan and clocked | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Outside processing | NOT BUILT | None | none | L-027 |
| Job costing | PARTIAL | Material and labor per job. No overhead, no cost report across jobs, no work-in-progress valuation | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks | L-026 |
| Traceability | VERIFIED ON QA | Shipped piece back to heat, parent item and work order | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |

## Quality control (section 12)

2 NOT BUILT, 2 PARTIAL, 6 VERIFIED ON QA.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Incoming inspection | NOT BUILT | A certificate hold at receipt only. Supplier quality screens are samples | none | I-011 |
| In-process inspection | PARTIAL | An inspection can be required at a step | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks | L-028 |
| Final inspection | VERIFIED ON QA | The QC gate before packaging | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Quality holds | VERIFIED ON QA | Held stock cannot be reserved or shipped | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks |  |
| Nonconformance | NOT BUILT | No nonconformance or corrective-action record | none | L-023 |
| Rework and reinspection | VERIFIED ON QA | Fail, rework, inspect again | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Material certification | PARTIAL | Attached and required; content not read | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks |  |
| Traceability | VERIFIED ON QA | As above | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| Release authorization | VERIFIED ON QA | Release by the quality role or a manager, recorded | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks |  |
| Nonconforming material cannot bypass controls | VERIFIED ON QA | A failed or held job cannot be packed or dispatched; checked inside the dispatch save | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |

## Shipping and logistics (section 13)

6 VERIFIED ON QA, 5 PARTIAL, 2 NOT BUILT.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Finished goods availability | VERIFIED ON QA | Only reserved, released stock ships | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks |  |
| Picking | PARTIAL | As above | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks |  |
| Packaging | VERIFIED ON QA | Packages from reserved stock, sealed, tagged | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks |  |
| Staging | VERIFIED ON QA | Ready-to-ship and shipped lists | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks |  |
| Carrier selection | PARTIAL | A carrier name typed on the shipment. No carrier integration | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks | N-026 |
| Shipping labels | PARTIAL | Tags and papers rendered; not printed on a printer here | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks | K-013 |
| Partial shipments | VERIFIED ON QA | As above | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Tracking | PARTIAL | A tracking number typed. No feed | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks | N-026 |
| Proof of delivery | VERIFIED ON QA | Receiver's name and time on delivery | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: in the gate Phase 11 scenarios: 319 of 320 pass, 1383 checks; one scenario failed on timing in the test (AA-012); whole suite run again on the same build: Phase 11 scenarios: 320 of 320 pass, 1384 checks |  |
| Returns | VERIFIED ON QA | As above | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Freight costs | PARTIAL | Freight typed on the order is billed once. No rating, no freight cost | pass: Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 | N-026 |
| Customer notifications | NOT BUILT | None sent | none | D-034 |
| Sandbox integrations | NOT BUILT | No carrier integration exists to sandbox; the partner API was tested against a stand-in | pass: Phase 4 integration scenarios: 66 of 66 pass, 555 checks |  |

## 80-location readiness (section 23)

6 VERIFIED ON QA, 3 PARTIAL, 1 NOT BUILT, 1 NOT VERIFIED.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Multiple branches | NOT VERIFIED (its suite did not pass in this run) | 80 synthetic branches of six kinds | FAIL: Phase 11 enterprise cycle gate: jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold ye; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Multiple divisions | PARTIAL | Division is on products and reports. Staff are not limited by division | pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Location-specific inventory | VERIFIED ON QA | Stock belongs to a branch | pass: Branch boundary: 39 checks, 0 problems; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Location-specific pricing | NOT BUILT | One price book for the company; tiers and contracts are per customer | none |  |
| Location-specific manufacturing | VERIFIED ON QA | Work centers and jobs belong to a branch | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Location-specific permissions | VERIFIED ON QA | Home branch plus assigned branches | pass: Branch boundary: 39 checks, 0 problems; pass: Phase 12 "Security and access revalidation" 11 of 11; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Cross-location transfers | VERIFIED ON QA | As above | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Multi-location readiness" 6 of 6 | W-002 |
| Corporate reporting | VERIFIED ON QA | Head-office roles read every branch | pass: Phase 12 "Dashboards and reports agree with the records" 7 of 7; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Financial consolidation | PARTIAL | One set of books with a branch on every line. Whether branches are one legal entity or several is not on record | pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | W-002 |
| Regional operations | PARTIAL | A regional manager is a user given several branches. No region record or regional report | pass: Branch boundary: 39 checks, 0 problems |  |
| Proven live capacity | NOT VERIFIED | Nothing here was measured on the live system, with real volumes or real users | none | W-023 |
