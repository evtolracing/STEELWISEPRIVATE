# Phase 5: quote and order traceability

Date: 2026-11-15. Local QA databases only.

## 1. The customer-to-cash map

```
Request for quote ──► Quote (versions) ──► accept ──► Sales order ──► reservation ──► shipment ──► invoice ──► payment
   (branch, lines,       (tax, branch,        │          (branch, tax,     (stock item,     (dispatch     (tax share,     (credit memo,
    requirements)         requirements)       │           requirements)     heat)            refused        per shipment)   refund)
                                              │                │                             without a
                                              │                └──► work order (requirements) reservation)
Order entry (phone, walk-in, mobile rep) ─────┴──► Sales order (same branch and tax rules)
Web shop checkout ──► web order inbox ──► accept (customer named, branch) ──► Sales order
Counter sale (shelf items) ──► paid invoice, stock off the shelf, at the cashier's branch
Retail POS (counter orders) ──► order entry with source RETAIL, at the clerk's branch
```

Alternative paths: a request withdrawn (its open quotes close, it cannot be quoted again); a quote rejected or lapsed; a second quote version (accepting it closes the first); a credit hold on acceptance (a manager releases it); an order cancelled (reservations released); a partial shipment; a return (credit memo for the part returned, with its share of tax); a counter void (cancelled, credited, refunded, stock back).

## 2. What links each step (read from the saved rows in the tests)

| Link | Field | Checked by |
|---|---|---|
| Quote to request | `Quote.rfqId`; line `rfqLineId` (a line of another request is refused) | Group 3 |
| Order to quote | `Quote.convertedOrderId`; `Order.fromQuote` | Group 3 and the final reconciliation (no quote points at a missing order) |
| Order to branch | `Order.locationId` = the request's branch (not the acceptor's) | Group 3, group 7 reconciliation (every order of the run has a branch) |
| Order tax to quote tax | equal | Final reconciliation |
| Work order to order line | `Job.orderLineId`, requirements in instructions and notes | Group 3, group 4 |
| Shipment to reserved stock | allocation; dispatch refused beyond the reservation | Group 4 |
| Invoice to shipment and order line | `Invoice.shipmentId`, `InvoiceLine.orderLineId` | Group 4 |
| Credit memo to invoice | `Invoice.creditOfInvoiceId` (kind CREDIT) | Group 5 |
| Counter sale to order | `Order.poReference = QS:<sale id>` (unique by run) | Group 5 and the final reconciliation |
| Web order to sales order | `OnlineOrder.internalOrderId`; acceptance only with a customer (J-010) | Group 6 |

## 3. Duplicate protection

| Operation | Protection | Tested |
|---|---|---|
| Quote accepted by three people at once | Conditional claim | One order |
| Quote acceptance retried after a lost answer | Request key | One order |
| Counter sale sent three times; and after a dropped connection | Sale id | One order, one invoice |
| Web checkout twice with one key | Request key | One web order |
| Web order accepted twice | Status check | 409 |
| Work orders asked twice | Existing-job check | One job |
| Void twice | Conditional claim on status | 409, stock returned once |

## 4. Failure in the middle

A database refusal planted on order lines during acceptance: the answer is an error, no order exists, the quote stays SENT with no order, and once the fault is gone the same quote is accepted (group 7). Accept is one transaction.

## 5. Final reconciliation after the run (all 0)

Orders past draft with no line; orders of the run with no branch; orders taxed differently from their quote; order subtotal not equal to its lines; voided counter sales not cancelled; invoices with more tax than their order; quotes pointing at missing orders; counter sales recorded twice; repeated invoice numbers; negative stock balances.
