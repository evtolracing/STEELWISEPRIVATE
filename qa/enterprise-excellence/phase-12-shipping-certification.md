# Phase 12: shipping and logistics certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

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

## End-to-end evidence from this phase

### WF-01: Flow 1: a new customer is quoted, orders, is shipped, invoiced and pays, and the books agree

PASS, 36 checks.

- pass: the customer account is created (201 )
- pass: the request for quote is saved for the customer (201 )
- pass: the quote is priced from the request (201 2400 vs 2400 )
- pass: an operator cannot accept a quote (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: the quote is sent (200 Quote marked as sent. Nothing is emailed from here: send the customer the quote yourself.)
- pass: accepting the quote makes one order (201 Quote accepted and order created)
- pass: accepting it a second time makes no second order (409)
- pass: one order for the quote in the database
- pass: the order carries the quote's price and the branch (2400 vs 2400; branch true)
- pass: stock is reserved for the line (201 )
- pass: the reservation holds the pounds and leaves the stock on hand (allocated 0→1200, available 4000→2800)
- pass: the shipment is put together (201 )
- pass: the shipment is dispatched and names its invoice (200 )
- pass: the stock on hand fell by the pounds shipped and the reservation was used up (on hand 4000→2800, allocated 0)
- pass: one SHIP movement records it ({"q":"1200"})
- pass: the invoice is posted once and its entry balances (POSTED {"1100":2400,"4000":-2400})
- pass: receivables rise by the invoice total and revenue by its subtotal (1100 2400 vs 2400; 4000 -2400 vs 2400)
- pass: cost of goods at the item's cost: an entry was posted (POSTED)
- pass: cost of goods at the item's cost: debits equal credits (1140 vs 1140, header 1140)
- pass: cost of goods at the item's cost: account 1200 moves by -1140 (got -1140; entry {"1200":-1140,"5000":1140})
- pass: cost of goods at the item's cost: account 5000 moves by 1140 (got 1140; entry {"1200":-1140,"5000":1140})
- pass: cost of goods at the item's cost: no other account is touched (also )
- pass: the invoice is for the order and the customer, at the quoted price (2400 vs 2400)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 2400.00 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 2400/2400)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":2400,"1100":-2400})
- pass: the order is complete (COMPLETE)
- pass: the customer owes nothing on the receivables report ("not listed")
- pass: the trail is in the audit log (6)
- pass: after the sale: the reconciliation ran (201)
- pass: after the sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the sale: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the sale: IN_TRANSIT agrees (MATCH 0.00 )

### WF-02: Flow 2: a quoted job is made on the floor, inspected, shipped and invoiced; it cannot leave before it passes

PASS, 41 checks.

- pass: the request for quote is saved for the customer (201 )
- pass: the quote is priced from the request (201 1162.5 vs 1162.5 )
- pass: an operator cannot accept a quote (403 Orders, quotes, customers and invoices can only be changed by sales staff or a manager. Your role (OPERATO)
- pass: the quote is sent (200 Quote marked as sent. Nothing is emailed from here: send the customer the quote yourself.)
- pass: accepting the quote makes one order (201 Quote accepted and order created)
- pass: accepting it a second time makes no second order (409)
- pass: one order for the quote in the database
- pass: the order carries the quote's price and the branch (1162.5 vs 1162.5; branch true)
- pass: the material is reserved for the order (201 )
- pass: the job is opened for the order line (201 )
- pass: the job is routed in two steps (200 )
- pass: step "Saw to length" is started and finished by the operator (200 200  )
- pass: step "Deburr and stack" is started and finished by the operator (200 200  )
- pass: time on each step is recorded against a person (2)
- pass: the dock cannot mark the job ready to ship before inspection (409 This job is waiting for inspection. Record the inspection result in Quality; a pass moves it to packaging.)
- pass: a shipment of the uninspected job cannot be dispatched (shipment 201, dispatch 409 This shipment cannot go out yet: JOB-00629 (waiting qc) is not finished. Finish or )
- pass: nothing left the building
- pass: the inspection is opened (201 )
- pass: a failed inspection is recorded (200 )
- pass: a job that failed inspection cannot be staged (409 Inspection INS-00349 failed. This job needs a passed inspection before it can move on: send it to inspecti)
- pass: the rework step "Rework (INS-00349)" is run (200 200  )
- pass: a new inspection is opened after the rework (201 )
- pass: the new inspection passes (200 )
- pass: both inspections are kept: the failure is not overwritten (2)
- pass: now the dock stages it (200 )
- pass: the shipment made earlier is still waiting on the dock (201)
- pass: the inspected job is dispatched and billed (200 )
- pass: the stock fell once by the pounds shipped (6000→4500)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 1162.50 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 1162.5/1162.5)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":1162.5,"1100":-1162.5})
- pass: the manager reads the job cost: material at the item's actual cost, and nothing assumed (200 )
- pass: a sales representative is not shown cost (403)
- pass: the job is closed (SHIPPED)
- pass: after the processed sale: the reconciliation ran (201)
- pass: after the processed sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the processed sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the processed sale: RECEIVABLES agrees (MATCH 0.00 )

### WF-09: Flow 9: an order ships in two parts, each billed for what left, and closes when the rest has gone

PASS, 15 checks.

- pass: the whole line is reserved (201 )
- pass: the first 1,200 lb leave and are billed (201 200 )
- pass: the first invoice is for 1,200 lb only (744 vs 744)
- pass: the order stays open with 800 lb still reserved (PARTIAL; allocated 800; on hand 3800)
- pass: more than the 800 lb left cannot be shipped (409 Line 1: only 800 is left to ship (ordered 2000, shipped 1200, on other open shipments 0))
- pass: the remaining 800 lb leave and are billed (201 200 )
- pass: two invoices that add up to the order (2: 744,496)
- pass: their numbers differ
- pass: the order is closed as shipped and nothing is left reserved (COMPLETE shipped 2000)
- pass: each invoice is posted once
- pass: after both parts: the reconciliation ran (201)
- pass: after both parts: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after both parts: INVENTORY agrees (MATCH 0.00 )
- pass: after both parts: RECEIVABLES agrees (MATCH 0.00 )
- pass: after both parts: IN_TRANSIT agrees (MATCH 0.00 )

## Earlier suites, rerun in the gate

- Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks
- Phase 11 "Shipping, logistics and invoicing": 35 scenarios pass

## Not built, stated plainly

- No carrier is connected: no rates, no bookings, no tracking from a carrier (N-026). The freight planning screens are labelled samples.
- Freight charged to a customer is in the invoice total and posts to freight revenue. No freight cost exists to post.
- Dispatch at the very busiest moment waits for its invoice number (Z-006): measured, and the owner's decision.

## Open findings in this area

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| H-014 | P2 | REQUIRES BUSINESS DECISION | Partner API | They answered 500. |
| K-013 | P3 | BLOCKED | Scanning | Lookup by typed or pasted number verified; hardware not tested. |
| N-026 | P2 | REQUIRES BUSINESS DECISION | Freight and carriers | None is. |
| N-028 | P3 | REQUIRES BUSINESS DECISION | Customer communication | Not built. |
| S-010 | P1 | ACCEPTED RISK WITH APPROVAL | Delivery promise | Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout |
| U-008 | P3 | ACCEPTED RISK WITH APPROVAL | Sales Rep Mobile, delivery preview | A date nobody computed |
| U-035 | P3 | REQUIRES BUSINESS DECISION | Freight and logistics | Invented routes, rates and tracking presented as real |
| Z-006 | P2 | REQUIRES BUSINESS DECISION | Shipping and invoicing | Invoices are written one at a time for the whole company, because invoice numbers must never be skipped or repeated (owner decision of 2026-11-13). Measured on a 4-proces |
| Z-012 | P3 | REQUIRES BUSINESS DECISION | Shipping and invoicing | When the answer to a dispatch is lost because its server copy died after saving the dispatch and before billing, sending the dispatch again answers "already IN_TRANSIT" ( |

## Certification

Engineering statement only: on the release candidate, on synthetic data, the capabilities marked VERIFIED ON QA above work as described. This is not business acceptance, and it is not a statement about the live system.
