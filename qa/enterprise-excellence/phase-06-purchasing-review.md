# Phase 6: purchasing review

Date: 2026-11-15. Tested on the local QA database only. **No purchase order was sent to any supplier, and the system does not send one: "placed" is a status a person sets.**

## 1. Before

A purchase order was an order of type PO saved through `/api/orders`, whose department rule is sales. A buyer got 403 (K-002). Nothing linked a receipt to what was ordered, so over-receipt, the wrong grade and a missing mill certificate went unnoticed (I-007). There was no screen.

## 2. Now

| Step | Who | What happens | Record |
|---|---|---|---|
| Write | Buyer, inventory manager, any manager | Supplier (mill or distributor on file), required date, lines with grade, size, quantity, unit (LB, CWT, TON, pieces), price and whether an MTR is required. Saved as a draft at the person's branch with a server number | `Order` (type PO), `OrderLine`, `createdById` |
| Place | Same | DRAFT to CONFIRMED | Audit row with the person |
| Receive | Receiving clerk, inventory manager, manager, at the order's branch | The Receiving screen lists open lines; choosing one fills the receipt. The line counts what came in its own unit and becomes PARTIAL or COMPLETE | `MaterialMovement.orderLineId` (new), `OrderLine.qtyReceived` |
| Mismatch | The server | Wrong grade or product, size outside the line's tolerance, more than ordered, MTR required and none on file: the material is received on hold with every reason listed. It is never refused at the dock | `QCHold` (DISPUTE, or PENDING_TEST when only the certificate is missing) |
| Close | Buyer | Nothing more is coming: order and open lines COMPLETE. A later receipt is refused | Audit row |
| Cancel | Buyer | Only when nothing has been received; otherwise 409, "close it instead" | |

Refused, with a sentence and nothing saved: a receipt against a draft, cancelled or closed order; against another branch's order; against a line whose unit receiving cannot convert; a sales or shop login writing a purchase order; opening another branch's order.

## 3. The 12 purchase order scenarios the instruction asks for

All in `qa/sim/phase6-inventory.mjs`, group "Purchasing and replenishment" (16 scenarios, all pass).

| # | Scenario | Result |
|---|---|---|
| 1 | Buyer writes and places an order | PASS |
| 2 | Sales login refused | PASS |
| 3 | The address shows and changes purchase orders only | PASS |
| 4 | Another branch's order not found | PASS |
| 5 | Nothing received against a draft | PASS |
| 6 | Partial receipt, movement names the line | PASS |
| 7 | Second receipt completes the line | PASS |
| 8 | Over-receipt held | PASS |
| 9 | Wrong grade and size held with both reasons | PASS |
| 10 | MTR required, none on file: held; manager releases | PASS |
| 11 | CWT line counts 5,000 lb as 50 | PASS |
| 12 | Order with receipts: cancel refused, close works, late receipt refused | PASS |
| 13 | Order with nothing received cancels | PASS |
| 14 | Another branch's order cannot be received here | PASS |
| 15, 16 | Supply position | PASS (see the replenishment review) |

Two receipts against one line at the same moment both count (the line is locked while each is booked): PASS.

## 4. Not built, and why

| Item | Finding | Why |
|---|---|---|
| Approval before placing | K-011 | No approval policy exists. The instruction forbids inventing one |
| Over-receipt and size tolerance by percentage | K-011 | The owner's numbers. Today the line is compared as written |
| Cost of the receipt from the order price | K-007 | A costing rule; forbidden without authorisation |
| Supplier invoice matching | K-012 | No payables module; deferred to the finance phase |
| Sending the order to the supplier (email, EDI) | Decision 5 | Email comes later |
| Supplier shipping notices, scorecards, corrective actions | I-011, H-014 | Quality records, not built in this phase |
