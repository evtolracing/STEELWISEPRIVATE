# Phase 9.5: accounting policy decisions

Date: 2026-11-16. Written first, before any ledger code, as the Phase 9.5 instruction requires.

**None of the sixteen decisions below is approved.** Each has a proposed setting, so that the ledger can be built and tested on synthetic data. The ledger posts nothing on the live system until an accountant has approved the chart of accounts and these policies, the owner has recorded that approval, and a cutover date is set. That block is in the software: see "How the block works" at the end.

For each decision: what the product does today (a fact, read from the code), what the ledger is configured to do if approved as proposed, the alternatives, and what stays blocked until it is decided.

Sources read: `src/backend/src/services/billing.js`, `lib/billingRules.js`, `lib/costing.js`, `lib/receiving.js`, `lib/stockChanges.js`, `lib/transfers.js`, `routes/shipments.js`, `routes/returns.js`, `routes/quickSale.js`, the Phase 8 documents (`phase-08-accounting-integrations.md`, `phase-08-job-costing.md`, `phase-08-financial-reconciliation.md`, `phase-08-owner-decision-10.md`) and owner decisions 8, 9 and 10.

## Decisions already on record that the ledger follows

| Decision | Where | What it fixes for the ledger |
|---|---|---|
| A shipment is invoiced when it leaves the dock; one invoice per shipment; a catch-up invoice bills anything shipped and not yet invoiced | `billing.js`, Phase 8 | The invoice is the revenue document. Shipment and invoice are usually the same save, but not always |
| Freight is billed once, on the order's first invoice. Tax is shared across an order's invoices in proportion, to the cent | `billingRules.js` | The ledger takes tax and freight from the invoice, never recalculates them |
| Actual cost per item: what the purchase order line said at receipt, per stocked unit. A piece cut from an item costs per pound what its parent cost. No overhead | Owner decision 9 (2026-11-15), `costing.js` | The valuation method in use is specific identification by item |
| Nothing is assumed where a cost or a rate is missing; the figure is left empty and named | Owner decision 9 | A movement with no cost is not posted at zero. It is an exception |
| A lost load is credited in full by a manager; no stock moves a second time | Owner decision 10 | The credit posts; the cost stays in cost of goods |
| Invoices are never edited. Corrections are credit memos. A cancelled invoice has no payments | `billing.js` | Matches reversal-only ledger history |
| The owner's stated wish for accounting (decision 10 advice, not approved): a ledger and not a full accounting system; cost of goods "recommended: at shipment"; "a cutover date, no rebuilt history" | `phase-08-owner-decision-10.md` | Used as the proposal in 2 and 16 below. Still needs his accountant |

## The sixteen decisions

### 1. Revenue recognition timing

- **Today:** an invoice is raised when a shipment is dispatched. Nothing is recognised anywhere.
- **Proposed:** revenue is recognised when the invoice is issued, dated the invoice date. Debit Accounts Receivable for the invoice total; credit sales revenue for each line, freight revenue for the freight, sales tax payable for the tax.
- **Alternatives:** at delivery (proof of delivery); at shipment with an "unbilled receivables" account when shipment and invoice are in different periods.
- **Consequence of the proposal:** a shipment that leaves on the last day of a month and is invoiced by catch-up the next month has its cost in one month and its revenue in the next. The reconciliation report lists every shipment that has left and is not invoiced ("shipped not billed") so the accountant can accrue it by a manual entry.
- **Needs:** accountant.

### 2. Inventory cost recognition timing (cost of goods)

- **Today:** the cost of what left is written on the stock movement at dispatch (Phase 8, N-017). Nothing is recognised.
- **Proposed:** cost of goods is recognised when the material ships: debit Material Cost of Goods Sold, credit inventory, for quantity times the unit cost written on the movement. This is the owner's stated preference; it is not approved accounting policy.
- **Alternatives:** at invoice; at delivery.
- **Needs:** accountant.

### 3. Customer deposits

- **Today:** the product has no deposit or prepayment record. A payment can only be recorded against an invoice, and never for more than is owed.
- **Proposed:** account 2200 exists in the chart and no rule posts to it. Nothing to decide until deposits are built.
- **Needs:** owner (whether deposits are wanted). Nothing is blocked.

### 4. Partial shipments

- **Today:** each shipment relieves only what it carries and raises its own invoice for that quantity.
- **Proposed:** each shipment posts its own cost; each invoice posts its own revenue. No accrual for the unshipped remainder.
- **Needs:** accountant, with 1.

### 5. Partial invoicing

- **Today:** a line can never be invoiced for more than has shipped; tax is apportioned; the invoice that finishes the order takes the remaining cents.
- **Proposed:** the ledger posts each invoice as issued, using the invoice's own subtotal, tax and freight.
- **Needs:** accountant, with 1.

### 6. Inventory valuation method

- **Today:** specific identification. Every stock item (coil, plate, bar, piece) carries its own unit cost, set at receipt from the purchase order line. Counter stock sold by the piece carries a cost per piece.
- **Proposed:** keep it. The ledger values a movement at quantity times that item's unit cost. No average and no FIFO layer is computed.
- **Alternatives:** weighted average by product and branch; FIFO. Either would be a new valuation system and is not built.
- **Needs:** accountant. The owner approved the costing method for operations (decision 9); whether it is also the book valuation method is the accountant's call.

### 7. Work-in-progress valuation

- **Today:** there is no work-in-progress stock. A coil work order consumes the source item and creates the pieces in the same save.
- **Proposed:** no balance is carried in 1220 Work in Progress. A setting, off by default, routes a work order's material through 1220 in the same entry (in and out at once) for accountants who want to see the flow.
- **Needs:** accountant.

### 8. Manufacturing labor and machine costs

- **Today:** time is clocked per step. An hourly rate per kind of work center may be entered (owner decision 9); the owner has not entered rates. Order margin shows labor only where a rate exists. There is no machine rate and no overhead.
- **Proposed:** labor and machine cost are **not posted**. They stay an operational report (`costing.js`). Capitalising labor into inventory would change every item's unit cost, which decision 9 fixed as "cost follows weight".
- **Alternatives:** expense labor as a period cost from payroll (outside this product); absorb labor into finished goods at a standard rate.
- **Needs:** accountant and owner. The manufacturing costing document reconciles job cost to the ledger for material and scrap only and says so.

### 9. Scrap and remnant valuation

- **Today:** scrap reported on a work order leaves the books by weight. A remnant is an ordinary stock item with its parent's unit cost.
- **Proposed:** scrap is expensed at the source item's unit cost: debit 5300 Scrap and Inventory Write-offs, credit inventory. Remnants keep their cost; no markdown is posted when the selling price of a remnant is discounted.
- **Alternatives:** scrap at a recovery (scrap dealer) value with the difference expensed; remnants written down by age.
- **Needs:** accountant.

### 10. Freight income and expense

- **Today:** freight charged to the customer is on the order and billed once. No carrier cost is recorded anywhere (N-026: no carrier is connected).
- **Proposed:** freight billed posts to 4200 Freight Revenue. Nothing posts to 5200 Freight Expense, because there is no source record. The account exists for when carrier costs are recorded.
- **Needs:** accountant for the revenue account; owner for N-026.

### 11. Sales tax liability recognition

- **Today:** tax is calculated on the order from the ship-to state's rate and carried to invoices.
- **Proposed:** the liability is recognised when the invoice is issued, credited to 2100 Sales Tax Payable and tagged with the ship-to state. A credit memo reduces it by the credit's own tax. No remittance to a tax authority is recorded (not built).
- **Alternatives:** cash basis (when paid).
- **Needs:** accountant. Local jurisdictions below state level are not on record and are not reported.

### 12. Returns and credits

- **Today:** a credit memo reduces what is owed on its invoice; what is left over is owed back to the customer until a refund is recorded. Returned material comes back to stock at the cost it left at, or is scrapped.
- **Proposed:** a credit memo debits 4300 Sales Returns and Allowances (and tax payable, and freight revenue for credited freight) and credits Accounts Receivable for its total. Credit not yet applied or refunded therefore shows as a credit balance for that customer inside receivables; the reconciliation and the aging report show it separately and never net it silently. A refund debits receivables and credits the payment clearing account. Material restocked: debit inventory, credit cost of goods, at the cost on the return movement. Material scrapped on return: debit inventory and credit cost of goods, then debit 5300 and credit inventory.
- **Alternatives:** carry unapplied customer credit in a liability account (2250, proposed in the chart, not used unless chosen).
- **Needs:** accountant.

### 13. Inventory transfers between branches

- **Today:** a transfer moves stock out of the sending branch into "in transit" and into the receiving branch on receipt. Shortages are settled as found or written off.
- **Proposed:** at shipment, debit 1300 Inventory in Transit and credit the sending branch's inventory. At receipt, debit the receiving branch's inventory and credit 1300. A shortage written off debits 5300. No revenue, no markup, no freight.
- **Needs:** accountant.

### 14. Intercompany versus interbranch

- **Today:** every branch record names the organisation that owns it. Whether the owner's branches are one legal entity or several is not on record in the documents read.
- **Proposed:** a transfer between two branches of the same owning organisation is interbranch (rule 13). A transfer between branches of **different** owning organisations is not posted: it is marked "reconciliation required: intercompany transfer has no approved rule". No intercompany revenue or due-to and due-from balance is invented.
- **Needs:** owner (how many legal entities) and accountant.

### 15. Accounting period close

- **Today:** none. A payment may be dated in the past; an invoice is dated when issued.
- **Proposed:** calendar months. A period is open or closed. Closing and reopening are done by the CFO, an administrator or the owner's login, and reopening requires a written reason; both are logged. An entry dated in a closed period is **refused**, never moved silently. A business event whose own date falls in a closed period (a payment dated last month, recorded today) is held as "reconciliation required" for the accountant to post into the open period by choice.
- **Alternatives:** post late events automatically on the first day of the open period.
- **Needs:** accountant.

### 16. Opening balances and cutover

- **Today:** no ledger history.
- **Proposed:** no history is rebuilt. On an approved cutover date the ledger starts. A dry run produces the opening detail from the records: every open invoice and its balance, every credit owed back, every stock item with quantity and cost, stock in transit, and shipments not yet invoiced. Stock with no cost on file is **listed for resolution and left out of the opening value**; it is never valued at zero. The opening entry debits and credits the control accounts against 3000 Opening Balance Equity, and is posted only after the accountant signs the dry run.
- **Needs:** accountant (sign-off and the date) and owner. On the live database the owner runs any database step himself.

## Further questions the accountant must answer

| Question | Why it matters |
|---|---|
| Is processing (cutting) billed separately from material? | Order lines carry one price. The ledger cannot split revenue between 4000 and 4100 unless a line is marked as processing. Proposed: all line revenue to 4000 until lines are marked |
| Is the payment clearing account one account or one per method? | Payments carry a method (cash, check, card, ACH, wire). Proposed: one account, method kept on the line |
| What is the accounts payable treatment for received stock? | Receipts post to 2000 Accounts Payable Clearing (goods received, not invoiced). Supplier invoices are not in this product, so that account grows until the accountant clears it from the accounting system |
| Count gains and losses | Proposed new account 5310 Inventory Count Variance, separate from scrap |
| Cost corrections on stock already received | Proposed new account 5320 Inventory Cost Adjustments |
| Rounding | Invoices are in whole cents. Inventory value is quantity times a six-place unit cost, rounded to the cent per line. Proposed account 5390 Rounding for the cent differences that arise when an item is relieved in parts |

## How the block works

1. The chart of accounts, the account mappings and the posting rules ship as **proposed**. Each carries an approval field that is empty.
2. Activation is a recorded step that needs: the chart approved, the mappings approved, the policies approved (who and when, typed by the owner or CFO), and a cutover date. Until all four exist, no business event posts anything and the ledger screens say "Not active".
3. A missing account mapping never falls back to another account. The event is recorded as failed with the reason and appears in the exceptions list.
4. On the QA database the scenarios record a synthetic approval, so that the engine can be tested end to end. That approval exists only in test data.

## Updated after the build (2026-11-16)

The sixteen proposals above are unchanged and still unapproved. Building and testing them settled the details below. Each is what the software now does on the QA database; each is still the accountant's to accept or change. Scenario names are from `qa/sim/phase95-ledger.mjs`.

| Decision | Detail settled in the build | Tested by |
|---|---|---|
| 1, 2 | A shipment and its invoice are two events and two entries. A dispatch whose invoice is not raised posts its cost only, and is listed by the reconciliation as "shipped, not billed" for the accountant's accrual | "A shipment that leaves in one save and its invoice are two events: each can be found, and each is posted once" |
| 6 | A movement of an item with no cost is held by name. When the cost is entered, the item's held events post in order. An item with a cost of zero has no value and is not an exception | "Material shipped with no cost on file: revenue posts, the cost is held and named, never posted at zero; entering the cost posts it" |
| 6 | A receipt with no purchase order is held. An accountant may post it by naming the account for the other side. The rule never picks one (W-006) | "Stock received with no purchase order is held for the accountant" |
| 7 | The work-in-progress setting can be changed only by the owner, a super administrator or the CFO, and is logged | "No balance is carried in work in progress; with the setting on, the same work order is shown passing through it and still ends at zero" |
| 12 | A credit applied to an invoice posts nothing of its own: the credit memo's entry already reduced receivables. A lost load posts its credit and no stock | "A money credit on an unpaid invoice posts sales returns against receivables; applying it moves no cash" |
| 13, 14 | In transit is carried at the sending branch until receipt. A transfer between different owners is held at both ends (W-002) | "A transfer between branches of different owning organisations is not posted" |
| 15 | A month can be closed only after its last day, and not while a draft is open in it. Reopening needs a reason of ten characters and a different person from the one who closed it, while another finance user exists (W-015). A draft dated in a closed month is refused. A payment dated in a closed month is saved and held; a person chooses the date it posts on | "Closing a month: the current month is refused, an open draft blocks it, then it closes and says who closed it"; "A payment dated in the closed month is saved and held" |
| 15 | A payment whose own date is before the books began is posted on the day it was recorded, and its memo says so | "A payment dated before the books began is posted on the day it is recorded, and the entry says so" |
| 16 | Activation needs the accountant's name, the approval date, a time zone (W-003) and a dry run less than 7 days old. The opening balances are taken inside the activation itself, with business saves waiting, so no event falls between them and the first entry. Activation cannot be run twice | "Activation posts the opening balances from the records at that moment, balanced against opening equity" |
| 16 | An item left out of the opening for want of a cost comes onto the books against opening equity when its cost is entered | "An item that had no cost at the opening balance comes onto the books against opening equity when its cost is entered" |
| 16 | A record from before the books began that is undone afterwards posts nothing automatically. It is left as an exception for the accountant | "An invoice from before the books began is cancelled: nothing is posted, the books show the difference, and the accountant settles it with a named adjustment" |
| New | Journal entry numbers are unique and increasing, with gaps where a save was rolled back (W-004) | |
| New | Rounding: an item relieved in parts ends at exactly zero; up to 5 cents per item goes to 5390 | "An item relieved in three parts ends at exactly zero in the books: the odd cent goes to Rounding" |
| New | Manual entries: written by one finance user, posted by another. A control account needs the owner, a super administrator or the CFO | "Manual entries: the server refuses every malformed draft and saves none of them" |

Questions added for the accountant by the build: W-004 (gaps in journal numbers), W-009 (how the payables clearing account is relieved), W-010 (processing revenue), W-011 (which accounting product), W-012 (counter items with no stock record post revenue and no cost).

## What this document does not do

It does not approve anything, set a cutover date, state an opening balance, or assign a cost or a rate. Those are the owner's and the accountant's.
