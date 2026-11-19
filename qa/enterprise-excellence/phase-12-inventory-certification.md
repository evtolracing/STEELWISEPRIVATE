# Phase 12: inventory and purchasing certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

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

## End-to-end evidence from this phase

### WF-03: Flow 3: a purchase order is approved, received in two parts, costed from its line and posted

PASS, 30 checks.

- pass: the purchase order is written (201 )
- pass: goods cannot be received against a purchase order that is not placed (409 Purchase order PO-02005 is still a draft: it has not been placed with the supplier)
- pass: the purchase order is placed (200 )
- pass: a sales representative cannot receive goods (403)
- pass: the first part is received (201 )
- pass: the rest is received (201 )
- pass: 500 lb more than was ordered is received on hold, not into free stock (201 hold 500 available 0 )
- pass: with a hold that says why ([["DISPUTE","Received against PO PO-02005 line 1, and more than ordered: 4500 LB received against 4000 ordered)
- pass: and it cannot be reserved for a customer while held (409 This stock is on hold and cannot be reserved)
- pass: the 2500 lb item is in stock at the branch at the line's price (true cost 0.38 on hand 2500)
- pass: the 2500 lb receipt: an entry was posted (POSTED)
- pass: the 2500 lb receipt: debits equal credits (950 vs 950, header 950)
- pass: the 2500 lb receipt: account 1200 moves by 950 (got 950; entry {"1200":950,"2000":-950})
- pass: the 2500 lb receipt: account 2000 moves by -950 (got -950; entry {"1200":950,"2000":-950})
- pass: the 2500 lb receipt: no other account is touched (also )
- pass: the 2500 lb item carries its heat (83f5e26f-41fa-403d-a088-c06de504c7ab)
- pass: the 1500 lb item is in stock at the branch at the line's price (true cost 0.38 on hand 1500)
- pass: the 1500 lb receipt: an entry was posted (POSTED)
- pass: the 1500 lb receipt: debits equal credits (570 vs 570, header 570)
- pass: the 1500 lb receipt: account 1200 moves by 570 (got 570; entry {"1200":570,"2000":-570})
- pass: the 1500 lb receipt: account 2000 moves by -570 (got -570; entry {"1200":570,"2000":-570})
- pass: the 1500 lb receipt: no other account is touched (also )
- pass: the 1500 lb item carries its heat (83f5e26f-41fa-403d-a088-c06de504c7ab)
- pass: the purchase order line shows what arrived, including the part on hold (4500)
- pass: the buyer closes it, and nothing more can be received against it (200 )
- pass: after receiving: the reconciliation ran (201)
- pass: after receiving: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after receiving: INVENTORY agrees (MATCH 0.00 )
- pass: after receiving: RECEIVABLES agrees (MATCH 0.00 )
- pass: after receiving: IN_TRANSIT agrees (MATCH 0.00 )

### WF-04: Flow 4: stock is transferred, is in transit, is received at the other branch, and the books agree at each moment

PASS, 21 checks.

- pass: another branch cannot send this branch's stock (404 Stock item not found)
- pass: the transfer is sent (201 )
- pass: in transit, none of it is available to either branch (available 0, in transit 2200, IN_TRANSIT)
- pass: stock in transit cannot be reserved for an order (409 Stock item P11-MWMU3MUB-35 is on its way to another branch. Reserve it after the receiving branch has rece)
- pass: while in transit: the reconciliation ran (201)
- pass: while in transit: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: while in transit: INVENTORY agrees (MATCH 0.00 )
- pass: while in transit: RECEIVABLES agrees (MATCH 0.00 )
- pass: while in transit: IN_TRANSIT agrees (MATCH 0.00 )
- pass: the in-transit figure carries the item's value (1536.00 vs 836)
- pass: the sending branch cannot receive its own transfer (403 Only the branch the material was sent to can receive it.)
- pass: the receiving branch receives it (200 )
- pass: receiving it twice changes nothing (409)
- pass: the item is at the receiving branch, whole and at the same cost (true 2200 0.38)
- pass: the transfer is closed (RECEIVED)
- pass: every movement of the item is posted once (TRANSFER_RECEIVED:POSTED, STOCK_RECEIVED:POSTED)
- pass: after receipt: the reconciliation ran (201)
- pass: after receipt: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after receipt: INVENTORY agrees (MATCH 0.00 )
- pass: after receipt: RECEIVABLES agrees (MATCH 0.00 )
- pass: after receipt: IN_TRANSIT agrees (MATCH 0.00 )

### WF-05: Flow 5: a work order consumes an item, makes two pieces and scrap, and the stock value follows

PASS, 20 checks.

- pass: the work order is written (201 )
- pass: the operator starts it (200 )
- pass: it cannot be started twice (409 This work order is already in progress)
- pass: 100 lb of the item are reserved for a customer (201 )
- pass: the work order cannot use the pounds promised to the customer (409 Stock item P11-MWMU3MUB-37 has 2,900 lb this work order can use, which is less than the 3,000 lb of output)
- pass: and the refusal changed nothing
- pass: completed with two pieces and 30 lb of scrap (200 )
- pass: the source keeps exactly the 100 lb promised to the customer (ALLOCATED: on hand 100, reserved 100)
- pass: two pieces came out, each 1,435 lb, at the source's cost per pound, on the source's heat ([["0.38",true],["0.38",true]])
- pass: the pieces are in stock (1435,1435)
- pass: weight is conserved: pieces plus scrap equal the source
- pass: the work order records the scrap and is complete (COMPLETE 30)
- pass: the work order's postings are all posted (WORK_ORDER_COMPLETED:POSTED, STOCK_RECEIVED:POSTED)
- pass: together they balance, and scrap is expensed at 30 lb times cost ({"1200":38,"1210":1090.6,"2000":-1140,"5300":11.4})
- pass: the scrap report answers (200)
- pass: after the work order: the reconciliation ran (201)
- pass: after the work order: BOOKS_BALANCE agrees (MATCH 0.00 )
- pass: after the work order: INVENTORY agrees (MATCH 0.00 )
- pass: after the work order: RECEIVABLES agrees (MATCH 0.00 )
- pass: after the work order: IN_TRANSIT agrees (MATCH 0.00 )

## Earlier suites, rerun in the gate

- p6: not in the gate log
- p3: not in the gate log

## Purchasing: how the product behaves, as observed

- A purchase order must be approved (confirmed) before anything can be received against it.
- More than was ordered is **received on hold** with the reason, not refused: the material is on the dock. It is on the books and cannot be reserved until released.
- A fully received purchase order stays open until the buyer closes it ("nothing more to come"); after that a receipt against it is refused.
- Supplier invoices and payables are not in the product (K-012, W-009): goods received and not invoiced accumulate in one account that nothing relieves.

## Open findings in this area

| Finding | Severity | Status | Area | What is open |
|---|---|---|---|---|
| B-009 | P1 | IN PROGRESS | Second stock list, order hub, stop work | Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other. |
| G-013 | P3 | REQUIRES BUSINESS DECISION | Stock items, stock search, heat trace | Both grow in step with the whole company's data. Both are far inside the half-second target today. |
| I-012 (D-024) | P1 | REQUIRES BUSINESS DECISION | Inventory | Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory menu opened the second |
| I-017 | P2 | REQUIRES BUSINESS DECISION | Receiving | A heat must be on file before stock is received against it, and heats are added one at a time |
| J-012 | P3 | REQUIRES BUSINESS DECISION | Retail POS | Free text, linked to no stock item (code read), so the sale has no stock record to reduce. |
| K-006 | P2 | REQUIRES BUSINESS DECISION | Steel Outlet remnants | A separate list. |
| K-007 | P1 | IN PROGRESS | Inventory valuation | No cost unless typed by hand. |
| K-008 | P2 | REQUIRES BUSINESS DECISION | Cycle counts | Single-item correction only. |
| K-011 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Exact, held. |
| K-012 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Not recorded. |
| K-013 | P3 | BLOCKED | Scanning | Lookup by typed or pasted number verified; hardware not tested. |
| N-025 | P2 | REQUIRES BUSINESS DECISION | Accounting | Not built. |
| S-009 | P2 | REQUIRES BUSINESS DECISION | Remnants | Remnant discount is fixed in code at 15% and 25% on two screens |
| U-022 | P3 | REQUIRES BUSINESS DECISION | Receiving | A heat must be added before its stock, one at a time |
| W-002 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; stock transfers | Whether the branches are one legal entity or several is not on record. A transfer between branches of different owning organisations is held at both ends and not posted. |
| W-006 | P2 | REQUIRES BUSINESS DECISION | Receiving; financial ledger | Stock can be received with no purchase order (the plain receive address and the upload). Such a receipt has no cost and no supplier, so no approved rule says what it is o |
| W-007 | P2 | REQUIRES BUSINESS DECISION | Counter stock; receiving | Stock sold by the piece at the counter has no receiving screen. Its receipt reaches the books only through the completeness check ("record what is missing"), posted by th |
| W-009 | P2 | REQUIRES BUSINESS DECISION | Financial ledger; purchasing | A receipt credits Accounts Payable Clearing (goods received, not invoiced). Supplier invoices are not in the product, so nothing ever debits that account. |

## Certification

Engineering statement only: on the release candidate, on synthetic data, the capabilities marked VERIFIED ON QA above work as described. This is not business acceptance, and it is not a statement about the live system.
