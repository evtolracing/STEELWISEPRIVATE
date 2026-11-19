# Phase 12: sales, customer lifecycle, counter and web store certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

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

### WF-06: Flow 6: a web order is placed once, accepted, fulfilled, paid, and shown to the buyer

PASS, 21 checks.

- pass: the checkout pressed twice makes one web order (409 200 The same request is still being processed. Wait a moment before trying again. )
- pass: the branch accepts it into an order (200 )
- pass: accepting it again makes no second order (409)
- pass: the order is the buyer's company's, at the branch, for three pieces (1 lines, qty 3)
- pass: the buyer sees the order in the portal (200)
- pass: a buyer of another company does not
- pass: three pieces are reserved (201 )
- pass: the pickup is put together (201 )
- pass: it is handed over and billed (200 )
- pass: the invoice total is the order total (19.47 vs 19.47)
- pass: the shelf fell by three (7)
- pass: the delivery is confirmed with a proof of delivery (200 DELIVERED)
- pass: a payment larger than the invoice is refused (409 Only 19.47 is still owed on this invoice)
- pass: the payment is taken (201 )
- pass: the invoice shows it (PAID 19.47/19.47)
- pass: the payment is posted once: receivables down by the amount, the entry balances (POSTED {"1000":19.47,"1100":-19.47})
- pass: after the web order: the reconciliation ran (201)
- pass: after the web order: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the web order: INVENTORY agrees (MATCH 0.00 )
- pass: after the web order: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the web order: IN_TRANSIT agrees (MATCH 0.00 )

### WF-07: Flow 7: a counter sale takes stock, gives a receipt and posts once, however often the button is pressed

PASS, 13 checks.

- pass: pressed three times at once, the sale is taken once (200  \| 200  \| 201 )
- pass: one order for the sale
- pass: one invoice, paid in full (1 PAID)
- pass: the receipt total is the invoice total (13.89 vs 13.89)
- pass: the shelf fell by two, once (396→394)
- pass: the sale is posted once and balances ({"1100":13.89,"2100":-0.91,"4000":-12.98})
- pass: one payment, posted once (1)
- pass: more than the shelf holds cannot be sold (400 Item 1: quantity must be a whole number more than zero)
- pass: after the counter sale: the reconciliation ran (201)
- pass: after the counter sale: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the counter sale: INVENTORY agrees (MATCH 0.00 )
- pass: after the counter sale: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the counter sale: IN_TRANSIT agrees (MATCH 0.00 )

### WF-08: Flow 8: goods come back, are checked in with a decision, credited once, refunded, and the books reverse

PASS, 21 checks.

- pass: more than was shipped cannot be returned (409 Line 1: only 800 can be returned (shipped 800, already on returns 0))
- pass: the return is opened (201 )
- pass: nothing is credited before the goods are checked in
- pass: checked in twice at once, it is received once (409,200)
- pass: 200 lb are back in stock, once (2200→2400)
- pass: one credit memo for a quarter of the invoice (1 -124 vs 124)
- pass: the credit is posted once: revenue and receivables reversed, the entry balances (CREDIT_ISSUED:POSTED {"1100":-124,"4300":124})
- pass: the stock comes back at cost: an entry was posted (POSTED)
- pass: the stock comes back at cost: debits equal credits (76 vs 76, header 76)
- pass: the stock comes back at cost: account 1200 moves by 76 (got 76; entry {"1200":76,"5000":-76})
- pass: the stock comes back at cost: account 5000 moves by -76 (got -76; entry {"1200":76,"5000":-76})
- pass: the stock comes back at cost: no other account is touched (also )
- pass: the original invoice is untouched (PAID 496)
- pass: a clerk cannot pay the refund (403)
- pass: the manager pays the refund (201 )
- pass: it cannot be refunded twice (409 Only 0.00 is still owed back on this credit memo)
- pass: after the return: the reconciliation ran (201)
- pass: after the return: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the return: INVENTORY agrees (MATCH 0.00 )
- pass: after the return: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the return: IN_TRANSIT agrees (MATCH 0.00 )

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

- Phase 5 sales scenarios: 76 of 76 pass, 387 checks
- shop browser suite: 31 checks, 0 failed
- sweep: 20 groups pass, 0 fail

## Open findings in this area

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| B-009 | P1 | IN PROGRESS | Second stock list, order hub, stop work | Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other. |
| F-008 | P2 | REQUIRES BUSINESS DECISION | Web store checkout | The store shows the buyer an estimate of tax by the ship-to state. On acceptance the order is taxed by the selling branch (rule 27). The two can differ |
| G-018 | P3 | REQUIRES BUSINESS DECISION | Database | The column is optional, so that existing rows and all-branch logins keep working. |
| G-020 | P3 | REQUIRES BUSINESS DECISION | Orders | Status is protected; other fields are last write wins. |
| J-008 | P2 | REQUIRES BUSINESS DECISION | Customers | Six settings look active and do nothing. |
| J-012 | P3 | REQUIRES BUSINESS DECISION | Retail POS | Free text, linked to no stock item (code read), so the sale has no stock record to reduce. |
| K-011 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Exact, held. |
| K-012 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Not recorded. |
| N-024 | P4 | FIXED — NOT VERIFIED | Tests | Failed in the first hour of each week. |
| N-028 | P3 | REQUIRES BUSINESS DECISION | Customer communication | Not built. |
| S-020 | P2 | REQUIRES BUSINESS DECISION | Customers | "Default Discount %" on the customer screen is applied nowhere |
| S-027 | P2 | REQUIRES BUSINESS DECISION | Quotes | Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products |
| U-008 | P3 | ACCEPTED RISK WITH APPROVAL | Sales Rep Mobile, delivery preview | A date nobody computed |
| U-012 | P3 | REQUIRES BUSINESS DECISION | Customers > Preferences | "Default Discount %" is offered and applied nowhere |
| U-037 | P3 | REQUIRES BUSINESS DECISION | Safety, maintenance, training, contractors, customer quality, executive, provenance | Invented data presented as real |
| U-041 | P3 | ACCEPTED RISK WITH APPROVAL | Checkout, order entry | Promise dates and branch suggestions from invented rules |
| V-027 | P2 | REQUIRES BUSINESS DECISION | Order board, production board, schedule | Grows with the data. |
| V-030 | P3 | REQUIRES BUSINESS DECISION | Orders | Dead buttons on real screens. |
| X-002 | P0 | REQUIRES BUSINESS DECISION | Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup | 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or item typed in |
| X-007 | P1 | REQUIRES BUSINESS DECISION | Order entry, web checkout, online settings | Order cut-off times, delivery promise dates, the "ship from another branch" comparison (with invented branch stock), the fulfilment override and split shipments run from  |
| X-008 | P2 | REQUIRES BUSINESS DECISION | Counter (`/pos`), will-call screens | The will-call pickup queue and completion screens use sample orders. The screen is not on the menu |
| W-007 | P2 | REQUIRES BUSINESS DECISION | Counter stock; receiving | Stock sold by the piece at the counter has no receiving screen. Its receipt reaches the books only through the completeness check ("record what is missing"), posted by th |
| W-010 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; sales orders | An order line carries one price. Nothing marks processing (cutting) apart from material, so all line revenue posts to Product Sales Revenue and nothing posts to Processin |
| W-012 | P2 | REQUIRES BUSINESS DECISION | Counter quick sale; financial ledger | A counter sale of an item that has no stock record posts its revenue and no cost of goods, because there is no stock movement to cost. |

## Certification

Engineering statement only: on the release candidate, on synthetic data, the capabilities marked VERIFIED ON QA above work as described. This is not business acceptance, and it is not a statement about the live system.
