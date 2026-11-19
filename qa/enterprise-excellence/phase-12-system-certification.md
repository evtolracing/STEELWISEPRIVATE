# Phase 12: what the system has, capability by capability

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

Every capability the Phase 12 prompt lists, with what the product actually has. Nothing was invented to fill a gap. "VERIFIED ON QA" is given only where the suite named passed in this run; the tool that writes this page downgrades a row whose suite did not.

**129 capabilities: 42 PARTIAL, 70 VERIFIED ON QA, 1 SAMPLE ONLY, 15 NOT BUILT, 1 NOT VERIFIED.**

Screens: 146 in all; 78 real, 4 mixed, 58 labelled samples, 6 static (`qa/screen-audit.md`). not in the gate log

## System inventory (section 5)

13 PARTIAL, 13 VERIFIED ON QA, 1 SAMPLE ONLY.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| CRM | PARTIAL | Customer accounts, divisions, contacts on a request, price tier, credit settings are real. Rep activity, visits, opportunities and follow-ups have no table | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | J-008, S-020 |
| RFQ | NOT VERIFIED (its suite did not pass in this run) | Requests from the sales desk, the web shop and the partner API reach one inbox with every requirement kept | FAIL: p5: not in the gate log; FAIL: p4: not in the gate log | S-027 |
| Quoting | NOT VERIFIED (its suite did not pass in this run) | Quote, approval, send, accept to order, lapse; lines priced by hand | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | S-027 |
| Pricing | PARTIAL | List price and customer tier and contract price are applied. Six customer settings, including the default discount, are stored and applied nowhere | FAIL: p5: not in the gate log | J-008, S-020, U-012 |
| Product configuration | PARTIAL | Grade, size, tolerances, finish, certificates and processing travel from request to work order. No configurator with rules between fields | FAIL: p5: not in the gate log |  |
| Sales orders | NOT VERIFIED (its suite did not pass in this run) | Entry, change with a stale-copy check, hold, cancel, close | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; FAIL: p11s: not in the gate log | G-020 |
| POS | NOT VERIFIED (its suite did not pass in this run) | Counter sale paid on the spot, void, branch of the cashier; three presses make one sale | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | J-012, W-012, D-033 |
| Ecommerce | NOT VERIFIED (its suite did not pass in this run) | Shop, cart, checkout with a request key, order inbox. The promise date at checkout is a demonstration and labelled | FAIL: p5: not in the gate log; FAIL: shop browser suite: ; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | F-008, S-010, X-007 |
| Customer portal | NOT VERIFIED (its suite did not pass in this run) | A customer login sees its own account's orders, shipments, invoices and documents only | FAIL: p5: not in the gate log; FAIL: sweep: 0 groups pass, 0 fail; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Purchasing | PARTIAL | Purchase orders, placing, receipts in parts, close, supply position. No requisitions, no approvals, no supplier invoices, no replenishment | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | K-010, K-011, K-012, W-009 |
| Receiving | NOT VERIFIED (its suite did not pass in this run) | Against a purchase order line with heat, certificate hold and over-receipt hold | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | I-017, W-006, W-007 |
| Inventory | PARTIAL | One authoritative stock list with heat, cost and branch. A second, unconnected unit-tracking list still exists beside it | FAIL: p6: not in the gate log; FAIL: p3: not in the gate log; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | I-012 (D-024), B-009, K-007 |
| Reservations | NOT VERIFIED (its suite did not pass in this run) | Reserve, release, refuse over-reservation under concurrency | FAIL: p6: not in the gate log; FAIL: p11s: not in the gate log |  |
| Transfers | NOT VERIFIED (its suite did not pass in this run) | Send, in transit, receive, shortage decided; both branches agree | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; pass: Phase 12 "Multi-location readiness" 6 of 6 | W-002 |
| Manufacturing | PARTIAL | Work orders with pieces and scrap; jobs through planned steps. No bill of materials, no material requirements, no outside processing | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | L-026, L-027, M-011 |
| Scheduling | PARTIAL | Queue order per work center with times where estimates exist. No capacity against a calendar | FAIL: p7: not in the gate log | L-025 |
| MES | PARTIAL | Start, pause, complete by an operator, time recorded from them. No machine connection | FAIL: p7: not in the gate log; FAIL: p11s: not in the gate log | L-030 |
| Quality | PARTIAL | A QC gate on jobs with pass, fail, rework and holds. Nonconformance, corrective action, supplier quality and SPC are sample screens | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | L-023, L-028, I-011, M-011 |
| Shipping | NOT VERIFIED (its suite did not pass in this run) | Shipment, papers, dispatch with its invoice in one step, delivery, part shipment, problem shipments | FAIL: p8: not in the gate log; FAIL: p11s: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | Z-006, Z-012 |
| Logistics | SAMPLE ONLY | No carrier, rate, route or tracking feed is connected. The freight and logistics planning screens are labelled samples | FAIL: not run | N-026, U-035 |
| Invoicing | NOT VERIFIED (its suite did not pass in this run) | Written at dispatch, gapless numbers, payment, credit, refund, cancel | FAIL: p8: not in the gate log; FAIL: p11s: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; pass: Phase 12 "Financial ledger certification" 16 of 16 | Z-006 |
| Financial ledger | PARTIAL | Built, verified on test data, and switched off. Blocked by design until an accountant approves the chart, mappings and policies | FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | W-001 and W-002 to W-012 |
| Reporting | PARTIAL | Operational dashboards and ledger reports agree with the records. No report builder; exports are the ledger export and CSV where a screen offers it | pass: Phase 12 "Dashboards and reports agree with the records" 7 of 7; FAIL: p9: not in the gate log | V-037 |
| AI assistants | PARTIAL | A read-only assistant limited by role and branch. Tested against a stand-in for the AI service: what a real model answers is not verified | pass: Phase 12 "AI assistants" 9 of 9; FAIL: p11s: not in the gate log |  |
| Administration | NOT VERIFIED (its suite did not pass in this run) | Users, roles, home branch, partner keys, tax rates, audit log, integrations report | FAIL: p10: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Security | NOT VERIFIED (its suite did not pass in this run) | See the security certification | FAIL: p10: not in the gate log; FAIL: sweep: 0 groups pass, 0 fail; pass: Phase 12 "Security and access revalidation" 11 of 11 | Y-008, W-014, E-011 |
| Integrations | PARTIAL | Partner API and webhooks are built and tested against stubs. Card, email, text, carrier and accounting systems are not connected | FAIL: p4: not in the gate log; FAIL: p11s: not in the gate log | H-015, D-034, N-025 |

## Sales and customer lifecycle (section 7)

7 VERIFIED ON QA, 2 NOT BUILT, 4 PARTIAL.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Customer creation | NOT VERIFIED (its suite did not pass in this run) | Created, edited, closed and reopened with an audit line | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| CRM activity | NOT BUILT | No activity, visit or follow-up record exists | none |  |
| RFQ intake | NOT VERIFIED (its suite did not pass in this run) | Three channels, one inbox | FAIL: p5: not in the gate log; FAIL: p4: not in the gate log |  |
| Product configuration | PARTIAL | Requirements carried end to end; no rule engine | FAIL: p5: not in the gate log |  |
| Contract pricing | NOT VERIFIED (its suite did not pass in this run) | Contract and tier price applied at order entry and at the counter | FAIL: p5: not in the gate log | J-008 |
| Quoting | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | S-027 |
| Approvals | PARTIAL | Quote approval and price-floor override with a reason and an audit line. No approval chain by amount | FAIL: p5: not in the gate log |  |
| Quote revisions | PARTIAL | A quote is edited until sent; a new quote replaces a lapsed one. No numbered revision history | FAIL: p5: not in the gate log |  |
| Sales orders | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Backorders | PARTIAL | A line shipped in part stays open for the remainder. No backorder record of its own | FAIL: p8: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Order changes | NOT VERIFIED (its suite did not pass in this run) | Changes refused from a stale copy; status moves by rule | FAIL: p5: not in the gate log; FAIL: p4: not in the gate log | G-020 |
| Cancellations | NOT VERIFIED (its suite did not pass in this run) | Cancel releases reservations; a cancel racing a dispatch never leaves both | FAIL: p11s: not in the gate log; FAIL: p5: not in the gate log |  |
| Customer communication | NOT BUILT | No email or text is sent. The buttons say so. The owner put this later (decision 5) | none | D-034, N-028 |

## POS and ecommerce (section 8)

8 VERIFIED ON QA, 2 PARTIAL, 1 NOT BUILT.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Product search and selection | NOT VERIFIED (its suite did not pass in this run) | Shop search and counter item pick | FAIL: shop browser suite: ; FAIL: p5: not in the gate log |  |
| Customer identification | NOT VERIFIED (its suite did not pass in this run) | Account forced from the login on the web; chosen at the counter | FAIL: p5: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Pricing | NOT VERIFIED (its suite did not pass in this run) | List, tier, contract | FAIL: p5: not in the gate log |  |
| Tax | PARTIAL | By state, where a rate is on file; none charged where none is, and the screen says so. Counties and cities are not on record. Web estimate by ship-to, order taxed by selling branch | FAIL: p5: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 | D-035, F-008 |
| Payment or approved terms | PARTIAL | A payment is a typed record with the approval code from a separate terminal. No card is charged by the product | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | D-033, H-015 |
| Order creation | NOT VERIFIED (its suite did not pass in this run) | One order per request key | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10; FAIL: p11s: not in the gate log |  |
| Inventory effects | NOT VERIFIED (its suite did not pass in this run) | Shelf stock falls once; refused when short | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | W-012 |
| Receipt generation | NOT VERIFIED (its suite did not pass in this run) | Receipt shown and reprintable. Not printed on a printer here | FAIL: p5: not in the gate log | K-013 |
| Ecommerce order intake | NOT VERIFIED (its suite did not pass in this run) | Online inbox, accept to sales order | FAIL: p5: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Customer portal updates | NOT VERIFIED (its suite did not pass in this run) | Order, shipment and invoice state read by the customer | FAIL: p5: not in the gate log |  |
| Sandbox payment systems | NOT BUILT | There is no payment integration to put in a sandbox | none | D-033 |

## Inventory (section 9)

11 VERIFIED ON QA, 4 PARTIAL, 2 NOT BUILT.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Material master | NOT VERIFIED (its suite did not pass in this run) | Grades, products, heat and grade required by the database | FAIL: p6: not in the gate log; FAIL: p3: not in the gate log |  |
| Units of measure | NOT VERIFIED (its suite did not pass in this run) | One unit per balance; conversions by rule | FAIL: p6: not in the gate log |  |
| Heat and lot tracking | NOT VERIFIED (its suite did not pass in this run) | Heat carried from receipt to every piece and shipment | FAIL: p6: not in the gate log; FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Certifications | PARTIAL | Certificate upload and a hold when a required one is missing. The check is that a document is attached, not what it says | FAIL: p6: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Receiving | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 | I-017 |
| Putaway | NOT BUILT | No putaway step or task | none | K-009 |
| Bin locations | NOT BUILT | A typed bin text on the item; no bin master | none | K-009 |
| Reservations and allocation | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p6: not in the gate log; FAIL: p11s: not in the gate log |  |
| Picking | PARTIAL | Pick list paper from the shipment. No pick confirmation by scan | FAIL: p8: not in the gate log | K-013 |
| Transfers | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Adjustments | NOT VERIFIED (its suite did not pass in this run) | With a reason, an audit line and a ledger entry | FAIL: p6: not in the gate log; FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Cycle counts | PARTIAL | A single-item correction only. No count programme, sheets or variance approval | FAIL: p6: not in the gate log | K-008 |
| Remnants | PARTIAL | Pieces from a work order are stock. The Steel Outlet remnant list is separate and its discounts are fixed in code | FAIL: p7: not in the gate log | K-006, S-009 |
| Scrap | NOT VERIFIED (its suite did not pass in this run) | Recorded on work orders and returns, valued at cost on file | FAIL: p7: not in the gate log; FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Returns | NOT VERIFIED (its suite did not pass in this run) | Return, receive, restock or scrap, credit with tax | FAIL: p8: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Authoritative quantities reconciled | NOT VERIFIED (its suite did not pass in this run) | On hand equals available plus reserved plus held on every item; books equal stock at cost | pass: Phase 12 "Financial and inventory reconciliation" 6 of 6; FAIL: database checks after the scenarios |  |
| Branch isolation | NOT VERIFIED (its suite did not pass in this run) | Enforced under every route | FAIL: branch: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |

## Purchasing (section 10)

5 PARTIAL, 3 NOT BUILT, 3 VERIFIED ON QA.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Supplier management | PARTIAL | Suppliers are organisations with contact details. No supplier terms, ratings or approvals | FAIL: p6: not in the gate log | I-011 |
| Purchase requisitions | NOT BUILT | None | none |  |
| Purchase orders | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Approvals | NOT BUILT | A purchase order needs no approval | none | K-011 |
| Supplier pricing | PARTIAL | The price typed on the line; no supplier price list | FAIL: p6: not in the gate log |  |
| Partial receipts | NOT VERIFIED (its suite did not pass in this run) | A line received in parts; the remainder stays on order | FAIL: p6: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Overreceipts | PARTIAL | Exact quantity enforced; more is held. No tolerance is set | FAIL: p6: not in the gate log | K-011 |
| Cost updates | NOT VERIFIED (its suite did not pass in this run) | Cost per item from the purchase order line at receipt, carried to pieces | FAIL: p7: not in the gate log; FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 | K-007 |
| Replenishment | NOT BUILT | A supply position to read; no reorder points or suggestions | none | K-010 |
| Receiving discrepancies | PARTIAL | Over-receipt and missing certificate are held. No discrepancy report to the supplier | FAIL: p6: not in the gate log | I-011 |
| Financial consequences | PARTIAL | A receipt debits inventory and credits a clearing account. Nothing ever clears it: supplier invoices are not in the product | FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 | W-009, K-012 |

## Manufacturing and MES (section 11)

10 VERIFIED ON QA, 2 NOT BUILT, 4 PARTIAL.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Work orders | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Routing | NOT VERIFIED (its suite did not pass in this run) | Processing recipes: versioned steps a job follows in order | FAIL: p7: not in the gate log |  |
| BOMs | NOT BUILT | What is called a BOM recipe is a routing. No bill of materials | none | M-011 |
| Work centers | NOT VERIFIED (its suite did not pass in this run) | Master data with validation and lockout | FAIL: p7: not in the gate log; FAIL: p2: not in the gate log |  |
| Scheduling | PARTIAL | As above | FAIL: p7: not in the gate log | L-025 |
| Dispatch | NOT VERIFIED (its suite did not pass in this run) | Dispatch board per branch | FAIL: p7: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Material consumption | NOT VERIFIED (its suite did not pass in this run) | Through the work order: weight in, pieces and scrap out, nothing created from nothing | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Machine assignment | NOT VERIFIED (its suite did not pass in this run) | A step runs on a work center of the right kind | FAIL: p7: not in the gate log |  |
| Labor tracking | PARTIAL | Time from start and complete. Labor rates must be entered before job cost means anything | FAIL: p7: not in the gate log | L-026 |
| Production completion | NOT VERIFIED (its suite did not pass in this run) | Completion moves the job on, to QC where required | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Scrap | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p7: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Remnants | PARTIAL | As above | FAIL: p7: not in the gate log | K-006 |
| Rework | NOT VERIFIED (its suite did not pass in this run) | A rework step added to the plan and clocked | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Outside processing | NOT BUILT | None | none | L-027 |
| Job costing | PARTIAL | Material and labor per job. No overhead, no cost report across jobs, no work-in-progress valuation | FAIL: p7: not in the gate log; FAIL: p95: not in the gate log | L-026 |
| Traceability | NOT VERIFIED (its suite did not pass in this run) | Shipped piece back to heat, parent item and work order | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |

## Quality control (section 12)

2 NOT BUILT, 2 PARTIAL, 6 VERIFIED ON QA.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Incoming inspection | NOT BUILT | A certificate hold at receipt only. Supplier quality screens are samples | none | I-011 |
| In-process inspection | PARTIAL | An inspection can be required at a step | FAIL: p7: not in the gate log | L-028 |
| Final inspection | NOT VERIFIED (its suite did not pass in this run) | The QC gate before packaging | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Quality holds | NOT VERIFIED (its suite did not pass in this run) | Held stock cannot be reserved or shipped | FAIL: p6: not in the gate log; FAIL: p7: not in the gate log; FAIL: p8: not in the gate log |  |
| Nonconformance | NOT BUILT | No nonconformance or corrective-action record | none | L-023 |
| Rework and reinspection | NOT VERIFIED (its suite did not pass in this run) | Fail, rework, inspect again | FAIL: p7: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Material certification | PARTIAL | Attached and required; content not read | FAIL: p6: not in the gate log |  |
| Traceability | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p7: not in the gate log |  |
| Release authorization | NOT VERIFIED (its suite did not pass in this run) | Release by the quality role or a manager, recorded | FAIL: p7: not in the gate log |  |
| Nonconforming material cannot bypass controls | NOT VERIFIED (its suite did not pass in this run) | A failed or held job cannot be packed or dispatched; checked inside the dispatch save | FAIL: p8: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |

## Shipping and logistics (section 13)

6 VERIFIED ON QA, 5 PARTIAL, 2 NOT BUILT.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Finished goods availability | NOT VERIFIED (its suite did not pass in this run) | Only reserved, released stock ships | FAIL: p8: not in the gate log |  |
| Picking | PARTIAL | As above | FAIL: p8: not in the gate log |  |
| Packaging | NOT VERIFIED (its suite did not pass in this run) | Packages from reserved stock, sealed, tagged | FAIL: p8: not in the gate log |  |
| Staging | NOT VERIFIED (its suite did not pass in this run) | Ready-to-ship and shipped lists | FAIL: p8: not in the gate log |  |
| Carrier selection | PARTIAL | A carrier name typed on the shipment. No carrier integration | FAIL: p8: not in the gate log | N-026 |
| Shipping labels | PARTIAL | Tags and papers rendered; not printed on a printer here | FAIL: p8: not in the gate log | K-013 |
| Partial shipments | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p8: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Tracking | PARTIAL | A tracking number typed. No feed | FAIL: p8: not in the gate log | N-026 |
| Proof of delivery | NOT VERIFIED (its suite did not pass in this run) | Receiver's name and time on delivery | FAIL: p8: not in the gate log; FAIL: p11s: not in the gate log |  |
| Returns | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p8: not in the gate log; pass: Phase 12 "Cross-module workflows end to end" 10 of 10 |  |
| Freight costs | PARTIAL | Freight typed on the order is billed once. No rating, no freight cost | FAIL: p8: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 | N-026 |
| Customer notifications | NOT BUILT | None sent | none | D-034 |
| Sandbox integrations | NOT BUILT | No carrier integration exists to sandbox; the partner API was tested against a stand-in | FAIL: p4: not in the gate log |  |

## 80-location readiness (section 23)

6 VERIFIED ON QA, 3 PARTIAL, 1 NOT BUILT, 1 NOT VERIFIED.

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Multiple branches | NOT VERIFIED (its suite did not pass in this run) | 80 synthetic branches of six kinds | FAIL: p11: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Multiple divisions | PARTIAL | Division is on products and reports. Staff are not limited by division | FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Location-specific inventory | NOT VERIFIED (its suite did not pass in this run) | Stock belongs to a branch | FAIL: branch: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Location-specific pricing | NOT BUILT | One price book for the company; tiers and contracts are per customer | none |  |
| Location-specific manufacturing | NOT VERIFIED (its suite did not pass in this run) | Work centers and jobs belong to a branch | FAIL: p7: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Location-specific permissions | NOT VERIFIED (its suite did not pass in this run) | Home branch plus assigned branches | FAIL: branch: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Cross-location transfers | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p6: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 | W-002 |
| Corporate reporting | VERIFIED ON QA | Head-office roles read every branch | pass: Phase 12 "Dashboards and reports agree with the records" 7 of 7; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Financial consolidation | PARTIAL | One set of books with a branch on every line. Whether branches are one legal entity or several is not on record | FAIL: p95: not in the gate log; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | W-002 |
| Regional operations | PARTIAL | A regional manager is a user given several branches. No region record or regional report | FAIL: branch: not in the gate log |  |
| Proven live capacity | NOT VERIFIED | Nothing here was measured on the live system, with real volumes or real users | none | W-023 |
