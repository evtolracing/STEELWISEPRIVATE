# Phase 9.5: transaction mapping

Date: 2026-11-16. Each business action, the code that saves it, the ledger event it raises in the same database transaction, how it is undone, and the scenario that proves it. Scenario names are from `qa/sim/phase95-ledger.mjs` (groups in `qa/sim/phase95/`).

The ledger is told by one added call inside the existing transaction of each action. If that transaction rolls back, nothing is in the books. If the ledger's own step fails, the action still saves and the event is left FAILED or RECONCILIATION_REQUIRED with the reason.

## Sales and money

| Action | Saved by | Event and source | Undone by | Proved by |
|---|---|---|---|---|
| Shipment dispatched | `routes/shipments.js` `dispatch` | STOCK_SHIPPED on the SHIP movement (cost of goods) | Not undone; a return brings material back | "The cost of what shipped is recognised at shipment, in its own entry, at the cost on the movement" |
| Invoice raised at dispatch, by catch-up or by hand | `services/billing.js` `buildInvoice` | INVOICE_ISSUED on the Invoice | Cancel: reversal entry in the cancel's transaction | "An invoice raised at dispatch debits receivables and credits product sales"; "Cancelling an unpaid invoice reverses its entry with a new entry; the original is untouched" |
| Dispatch succeeds, invoice fails | `dispatchAndInvoice` (two transactions by design, H-006) | Only STOCK_SHIPPED. The reconciliation lists it under "shipped, not billed" | Raising the invoice later posts INVOICE_ISSUED | "A shipment that leaves in one save and its invoice are two events" |
| Payment recorded | `billing.js` `recordPayment` → `applyPayment` | PAYMENT_RECORDED on the Payment | No undo exists in the product | "A payment in full debits the clearing account and credits receivables for the customer" |
| Credit memo issued | `billing.js` `creditInvoice` | CREDIT_ISSUED on the credit memo. The CREDIT "payment" that applies it posts nothing | A credit is not cancelled | "A money credit on an unpaid invoice posts sales returns against receivables; applying it moves no cash" |
| Refund recorded | `billing.js` `recordRefund` | REFUND_RECORDED on the (negative) Payment | None | "A refund of credit owed back debits receivables and credits the clearing account" |
| Lost load ended by a manager | `routes/shipments.js` `markLost` | CREDIT_ISSUED for what is left on the invoice. No stock event | None | "A lost load credited in full reduces receivables through sales returns; no stock comes back and the cost stays in cost of goods" |
| Counter sale | `routes/quickSale.js` | INVOICE_ISSUED, PAYMENT_RECORDED and one STOCK_SHIPPED per stock row, in one save | Void: CREDIT_ISSUED, REFUND_RECORDED, RETURN_RESTOCKED | "A counter sale posts the invoice, the payment and the cost of the pieces in one save"; "Voiding a counter sale posts the credit, the refund and the stock coming back" |

## Stock

| Action | Saved by | Event | Proved by (group "Inventory valuation and adjustments") |
|---|---|---|---|
| Receipt against a purchase order | `lib/receiving.js`, `routes/inventory.js` | STOCK_RECEIVED on the RECEIVE movement | Receipt scenarios, including partial receipts and a receipt sent three times at once |
| Receipt with no purchase order | same | STOCK_RECEIVED, held until an accountant names the other account | Held-receipt scenario |
| Count, damage, correction | `lib/stockChanges.js` | STOCK_ADJUSTED on the movement | Count up, count down, damage scenarios |
| Scrap outside a work order | `lib/stockChanges.js`, `routes/returns.js` | STOCK_SCRAPPED | Scrap scenarios |
| Cost entered or changed on an item | `routes/coils.js` | COST_CHANGED on the audit row of the change; the item's held events are then posted again | Cost-change scenarios |
| Customer return restocked | `routes/returns.js` | RETURN_RESTOCKED | "A return put back in stock and credited" |
| Customer return scrapped | `routes/returns.js` | RETURN_RESTOCKED then STOCK_SCRAPPED | "A return that is scrapped" |
| A move inside a branch (bin to bin) | `lib/stockChanges.js` | None: no value changes | |

## Work orders

| Action | Saved by | Event | Proved by (group "Manufacturing, work in progress and costing") |
|---|---|---|---|
| Coil work order completed | `lib/stockChanges.js` | WORK_ORDER_COMPLETED on the work order, built from its PROCESS and SCRAP movements. The movements themselves raise no event of their own | Pieces, scrap, remnant, whole-coil, through-WIP and no-cost scenarios |
| Time clocked on a step | Shop floor routes | None. Labor is not posted (policy 8) | "labor is not posted" scenario |
| Job without a coil work order (dispatch board steps) | Job routes | None: no stock value changes until shipment | |

## Transfers

| Action | Saved by | Event | Undone by | Proved by (group "Freight, transfers and location accounting") |
|---|---|---|---|---|
| Transfer dispatched | `lib/transfers.js` | TRANSFER_SHIPPED per line | Cancel: reversal entry | "A transfer that leaves a branch moves the item's value from that branch's stock to in-transit; no sale is recorded"; "A transfer called back is reversed with a new entry" |
| Transfer received | `lib/transfers.js` | TRANSFER_RECEIVED per receiving movement | Not undone | "Receiving the transfer moves the value from in-transit to the receiving branch's stock" |
| Shortage written off | `lib/transfers.js` | STOCK_ADJUSTED, reason TRANSFER_SHORT | | "A transfer that arrives short" |
| Transfer between branches of different owners | same | Held, both ends | | "A transfer between branches of different owning organisations is not posted" |

## Finance's own actions

| Action | API | Result |
|---|---|---|
| Load proposed chart, change an account or mapping, record approval | `/api/ledger/chart/load-proposed`, `/accounts/:code`, `/mappings/:key`, `/approvals` | Audit row each; a change clears approval |
| Dry run, activate, stop, resume, setting | `/cutover/dry-run`, `/activate`, `/deactivate`, `/resume`, `/settings` | Audit row each; activation posts OPENING entries |
| Manual entry: draft, post, delete draft, reverse | `/entries`, `/entries/:id/post`, `DELETE /entries/:id`, `/entries/:id/reverse` | MANUAL and REVERSAL entries; audit row each |
| Close and reopen a month | `/periods/:year/:month/close`, `/reopen` | Audit row each |
| Post an event again, settle an event, record what is missing | `/events/:id/retry`, `/events/:id/resolve`, `/events/record-missing` | Event status changes; audit row |
| Reconcile | `/reconciliations` | One `LedgerReconciliation` row; nothing corrected |
| Export | `/exports`, `/exports/:id/file`, `/exports/:id/settle` | Batch row; audit row for create, download and settle |

## Actions that raise no ledger event, and why

| Action | Why |
|---|---|
| Quote, order, order confirmation, reservation, pick, pack | No money or stock value changes |
| Purchase order placed | A commitment, not a liability. The receipt posts |
| Delivery confirmed | Revenue follows the invoice (policy 1) |
| Supplier invoice, supplier payment | Not in the product |
| Carrier bill | Not in the product |
| Payroll, labor | Not in the product |
| Bank deposit | Not in the product: 1000 is a clearing account |

## Before the books began

A record made before the cutover is in the opening balances and has no event. If it is undone afterwards (an old invoice cancelled, an old transfer called back) nothing is posted automatically: an event named `..._UNDONE` is left for the accountant with the reason. Payments and refunds against old invoices and credits post normally and clear the opening balance ("A payment on an invoice from before the books began clears the opening receivable").
