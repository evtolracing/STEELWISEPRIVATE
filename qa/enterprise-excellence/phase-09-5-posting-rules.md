# Phase 9.5: posting rules

Date: 2026-11-16. Rule version 1. **Proposed. Not approved.** Every rule below is a pure function in `src/backend/src/lib/ledgerRules.js` with unit tests in `src/backend/test/ledgerRules.test.js`. A rule names purposes, never accounts; the account for each purpose is the approved mapping (`phase-09-5-chart-of-accounts.md`). The account codes shown are the proposed ones.

All amounts are exact decimals to the cent, rounded half up. A line with a zero amount is left out. An entry that would have no value posts nothing and its event says why (NOT_POSTED).

## Sales and money

| Event | Debit | Credit | Dimensions | Not posted, held or failed when |
|---|---|---|---|---|
| INVOICE_ISSUED (source: Invoice) | 1100 Receivables: invoice total | 4000 Product revenue: one line per invoice line. 4200 Freight revenue: freight. 2100 Sales tax payable: tax | Branch of the order, customer; product and division on revenue lines; ship-to state on the tax line | Total zero: nothing to post. Lines do not add up to the subtotal, or negative total: FAILED |
| CREDIT_ISSUED (source: the credit memo) | 4300 Returns and allowances: one line per credit line. 4200: freight credited. 2100: tax credited | 1100: credit total | As the invoice | Same checks |
| PAYMENT_RECORDED (source: Payment) | 1000 Cash clearing | 1100 Receivables | Branch, customer; method in the memo | Method CREDIT: nothing to post (the credit memo's own entry covers it). Amount not above zero: FAILED |
| REFUND_RECORDED (source: Payment, negative) | 1100 Receivables | 1000 Cash clearing | Branch, customer | Amount not above zero: FAILED |
| Invoice cancelled | Reversal of the invoice's entry | | | Invoice recorded before the books began: held as INVOICE_ISSUED_UNDONE for the accountant |

The date of an invoice or credit entry is the invoice date. The date of a payment entry is the payment date. A payment whose own date is before the books began is posted on the day it was recorded, and its memo says so. A payment whose own date falls in a closed month is held.

## Stock

Value is quantity times the unit cost. The cost used is the one written on the movement when it has one (a shipment does), otherwise the item's own cost.

| Event | Debit | Credit | Held when |
|---|---|---|---|
| STOCK_RECEIVED against a purchase order | 1200 Raw material (or 1210 for a work order piece) | 2000 Payables clearing, with the supplier | No cost on file |
| STOCK_RECEIVED with no purchase order | Held. An accountant may post it again naming the account for the other side; the rule never picks one | | Always, until a person names the account |
| STOCK_SHIPPED (shipment or counter sale) | 5000 Material cost of goods, with the customer | Inventory of that item | No cost on file |
| RETURN_RESTOCKED (customer return, counter void) | Inventory | 5000 Material cost of goods | No cost on file |
| STOCK_SCRAPPED (outside a work order) | 5300 Scrap and write-offs | Inventory | No cost on file |
| STOCK_ADJUSTED down, reason DAMAGE, SCRAP or TRANSFER_SHORT | 5300 | Inventory | No cost; any other reason has no approved rule and is held |
| STOCK_ADJUSTED down, reason COUNT, FOUND or CORRECTION | 5310 Count variance | Inventory | Same |
| STOCK_ADJUSTED up | Inventory | 5300 or 5310 by the same reasons | Same |
| PIECE_CUT (a piece recorded against its parent, outside a work order) | Inventory of the piece | Inventory of the parent | Parent has no cost; piece names no parent: FAILED |
| COST_CHANGED on stock on hand | Inventory (or 5320 Cost adjustments when the cost goes down) | 5320 (or Inventory) for quantity on hand times the change | Cost removed: held |
| COST_CHANGED, first cost on an item that was on hand with no cost at the opening | Inventory | 3000 Opening balance equity | |
| COST_CHANGED, first cost on an item received after the books began | Nothing by this rule: the item's own held events are posted again with the cost | | |
| Any other movement type | Held: "has no approved rule" | | Always |

**Rounding.** An item relieved in parts is valued a part at a time, each to the cent. When a movement empties the item, the cents left for it in the books (5 cents at most) go to 5390 Rounding in the same entry, so the item ends at exactly zero. A larger difference is not rounding and is left for the reconciliation to show.

## Work orders

| Event | Debit | Credit |
|---|---|---|
| WORK_ORDER_COMPLETED (source: the work order; quantities are its own stock movements) | 1210 Finished goods: one line per piece, at weight times the source item's unit cost. 5300: scrap at the same unit cost | Inventory of the source item: the sum of those lines |
| The same, with the "through work in progress" setting on | 1220 for that sum, then 1210 and 5300 | The source item, then 1220. 1220 nets to zero within the entry |

Held when the source item has no cost, or a piece carries a cost different from its source (a person decides which is right). No labor, machine or overhead cost is posted (policy decision 8).

## Transfers

| Event | Debit | Credit | Held when |
|---|---|---|---|
| TRANSFER_SHIPPED (source: the transfer line) | 1300 In transit, at the sending branch | Inventory at the sending branch | No cost; the two branches have different owning organisations (no intercompany rule) |
| TRANSFER_RECEIVED (source: the receiving movement) | Inventory at the receiving branch | 1300 at the sending branch | Same |
| Shortage written off | 5300 | Inventory (adjustment, reason TRANSFER_SHORT) | No cost |
| Transfer called back | Reversal of the TRANSFER_SHIPPED entry | | |

No revenue, markup or freight is posted on a transfer.

## Opening balances

One OPENING entry per branch for stock (each item on hand at its cost) and one for receivables (each customer's open invoices, and credit owed back as a credit balance), each balanced against 3000. Stock on a truck at that moment is opened at the sending branch and then moved to in transit by the ordinary transfer rule. See `phase-09-5-cutover-plan.md`.

## Manual entries

Any balanced set of lines to approved, active accounts, with a memo, written by one finance user and posted by another. A control account needs the named approval. No more than two decimal places; no negative or zero line; each line at most 999,999,999,999.99.

## What no rule does

- Picks an account when the mapped one is missing, unapproved or inactive.
- Values anything at zero for want of a cost.
- Moves an entry out of a closed month.
- Posts labor, machine time, overhead, carrier cost, supplier invoices, deposits, tax remittances or bank movements. The product has no record of those to post from.
- Recognises revenue on shipment. Revenue follows the invoice (policy decision 1).

## Evidence

- `src/backend/test/ledgerRules.test.js`: 24 tests of the rules as functions.
- `qa/sim/phase95-ledger.mjs`: each rule driven through the real server and the entry read back from the database, account by account.
- `qa/tools/phase95-mutations.mjs`: 14 rule checks removed one at a time; each removal is caught by a named test.
