# Phase 9.5: discovery of the existing financial architecture

Date: 2026-11-16. Written from the code and the schema before any ledger code was added. Every statement names the file it was read from.

## What existed before this phase

| Area | What exists | Where | What it means for a ledger |
|---|---|---|---|
| Invoices | `Invoice` (kind INVOICE or CREDIT), `InvoiceLine`. One invoice per shipment, raised at dispatch; a catch-up invoice bills what shipped without one. Never edited. Cancelled only with no payments | `services/billing.js`, `lib/billingRules.js` | The invoice is the revenue document. Shipment and invoice are separate saves: a dispatch whose invoice fails still leaves (H-006) |
| Invoice numbers | `DocumentCounter`: never skipped, never repeated, taken inside the save | `billing.js` `takeNumber` | The invoice number is safe to use as a reference on an entry |
| Payments and refunds | `Payment` rows on an invoice. A refund is a negative payment on a credit memo. A credit applied to an invoice is a payment with method CREDIT | `billing.js` `recordPayment`, `recordRefund`, `applyPayment` | A CREDIT payment moves no money and must not post |
| Money audit | Every money action writes an `AuditLog` row with category FINANCIAL in the same save | `billing.js` `recordMoney` | The ledger keeps its own events; it does not post from audit rows, except a cost change, whose only record is its audit row |
| Sales tax | Rate by ship-to state on the order; carried to invoices in proportion, to the cent | `lib/orderTax.js`, `billingRules.js` | The ledger takes tax from the invoice and never recalculates it |
| Freight billed | On the order, billed once on the first invoice | `billingRules.js` | Freight revenue comes from the invoice |
| Freight cost | None. No carrier is connected and no carrier cost is stored (N-026) | `routes/shipments.js` | Nothing can post to freight expense |
| Stock cost | Each stock item (`Coil`) has its own `unitCost`, set at receipt from the purchase order line (owner decision 9). A piece cut from an item costs per unit what its parent cost | `lib/receiving.js`, `lib/costing.js` | Valuation is specific identification by item |
| Cost of what left | `MaterialMovement.unitCost` is written on the SHIP movement at dispatch (database file 14, N-017) | `routes/shipments.js` | Cost of goods can be taken from the movement, so a later cost change does not change a past sale |
| Stock movements | `MaterialMovement` for receive, ship, consume, scrap, adjust, count, transfer, process | `lib/stockChanges.js`, `lib/receiving.js`, `lib/transfers.js` | One movement, one ledger event |
| Transfers | `StockTransfer`, `StockTransferLine`; stock is "in transit" between dispatch and receipt; shortages are settled as found or written off | `lib/transfers.js` | Two events per line: sent and received |
| Work orders | A coil work order consumes the source item and creates pieces and scrap in one save; movements carry reason WORK_ORDER | `lib/stockChanges.js` | One entry per completed work order, built from its own movements |
| Labor and machine cost | Time is clocked per step. An hourly rate per kind of work center may be entered; none is on file. No machine rate, no overhead | `lib/costing.js` | Nothing can be posted without inventing a rate |
| Counter sales | Sale, payment and invoice in one save; shelf stock is relieved by the piece; a void puts it back | `routes/quickSale.js` | Same events as a shipped sale |
| Returns | Material restocked at the cost it left at, or scrapped; a credit memo for the money | `routes/returns.js`, `billing.js` | Three events: credit, restock, scrap |
| Branch and owner | Every branch (`Location`) names the organisation that owns it. Orders, movements and shipments carry a branch | schema | Every line can carry a branch; intercompany can be told from interbranch |
| Reports | Receivables by age, order margin, stock valuation as operational reports | `routes/invoices.js`, `lib/costing.js` | Kept. The ledger reports sit beside them and are reconciled to them |
| Assistant | Reads business data through fixed queries by question type | `routes/aiAssistant.js` | A ledger question type is added with its own permission check |

## What did not exist

Searched for in the schema (161 models before this phase) and in every route and service file: a chart of accounts, a journal, a posting period, an account mapping, an opening balance, a reconciliation record, an export to an accounting product. None existed. This matches the Phase 8 finding N-025 (`phase-08-accounting-integrations.md`).

No code for QuickBooks, Xero or any other accounting product existed (text search of `src/backend/src` and `src/frontend/src`). No credential for one is configured. See `phase-09-5-accounting-export.md`.

## What was reused and not rebuilt

- Invoices, payments, credits, refunds, tax, freight, cost, movements, transfers, work orders: unchanged in behaviour. The ledger is told about each in the same save by one added call.
- The operational reports are unchanged. No second receivables, valuation or margin calculation replaces them; the ledger's figures are compared with them.
- The audit log, the access gate, branch scoping and the retry helper for overlapping saves are the existing ones.

## Gaps found during discovery that limit what the ledger can do

| Gap | Effect | Recorded as |
|---|---|---|
| A receipt without a purchase order has no cost | Held, not valued at zero | W-006 |
| Counter stock sold by the piece has no receiving screen | Its receipt is found by "record what is missing" and posted by the CFO naming the other account | W-007 |
| No carrier cost | Freight expense is never posted | N-026 (existing) |
| No labor or machine rate | Not posted | L-026, K-007 (existing) |
| No supplier invoices | Payables clearing only grows | K-012 (existing), W-009 |
| No deposits | Account 2200 exists, no rule posts to it | policy decision 3 |
| Order lines do not mark processing apart from material | All line revenue posts to one account | W-010 |
| Whether the branches are one legal entity or several is not on record | A transfer between different owners is held | policy decision 14 |
