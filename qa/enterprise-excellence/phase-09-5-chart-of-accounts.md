# Phase 9.5: proposed chart of accounts

Date: 2026-11-16. **Proposed. Not approved.** The chart is loaded by the CFO or an administrator from the Finance screen ("Load the proposed chart"). Every account arrives with its approval empty. The ledger cannot be started while any account that a posting rule uses is unapproved. An accountant may rename, add, deactivate or re-map before approving.

Source: `src/backend/src/lib/ledgerRules.js` (`PROPOSED_ACCOUNTS`, `PROPOSED_MAPPING`). The numbers 1000 to 5300 are the ones in the phase instruction. 2250, 5310, 5320 and 5390 are additions proposed in this phase and are marked.

## Accounts

| Code | Name | Type | Normal side | Control | Posted to by | Note |
|---|---|---|---|---|---|---|
| 1000 | Cash / Payment Clearing | Asset | Debit | Yes | Payments, refunds | Payments recorded as received. Not a bank balance: nothing is reconciled to a bank |
| 1100 | Accounts Receivable | Asset | Debit | Yes | Invoices, credits, payments, refunds | A customer with credit not yet applied or refunded shows a credit balance here |
| 1200 | Raw Material Inventory | Asset | Debit | Yes | Receipts, shipments, adjustments, transfers, work orders | Each item at its own cost |
| 1210 | Finished Goods Inventory | Asset | Debit | Yes | Work orders, shipments of pieces | Pieces made by a work order |
| 1220 | Work in Progress | Asset | Debit | Yes | Work orders, only when the setting is on | Carries no balance |
| 1300 | Inventory in Transit | Asset | Debit | Yes | Transfers | Between two branches of the same owner |
| 2000 | Accounts Payable Clearing | Liability | Credit | Yes | Receipts against a purchase order | Goods received, not invoiced. Supplier invoices are not in this product |
| 2100 | Sales Tax Payable | Liability | Credit | Yes | Invoices, credits | Tagged with the ship-to state |
| 2200 | Customer Deposits / Deferred Revenue | Liability | Credit | No | Nothing | The product has no deposit record |
| 2250 | Customer Credits Owed (added) | Liability | Credit | No | Nothing | Only if the accountant chooses to carry unapplied credit as a liability |
| 3000 | Opening Balance Equity / Clearing | Equity | Credit | No | The opening entry at cutover | |
| 4000 | Product Sales Revenue | Revenue | Credit | Yes | Invoice lines | |
| 4100 | Processing Revenue | Revenue | Credit | Yes | Nothing | Order lines do not mark processing apart from material (W-010) |
| 4200 | Freight Revenue | Revenue | Credit | Yes | Freight on invoices and credits | |
| 4300 | Sales Returns and Allowances | Contra revenue | Debit | Yes | Credit memos | |
| 5000 | Material Cost of Goods Sold | Expense | Debit | Yes | Shipments, counter sales, returns to stock | |
| 5100 | Processing Cost of Goods Sold | Expense | Debit | No | Nothing | Labor and machine cost are not posted (policy 8) |
| 5200 | Freight Expense | Expense | Debit | No | Nothing | No carrier cost is recorded (N-026) |
| 5300 | Scrap and Inventory Write-offs | Expense | Debit | Yes | Scrap, damage, transfer shortages written off | |
| 5310 | Inventory Count Variance (added) | Expense | Debit | Yes | Count corrections | Kept apart from scrap |
| 5320 | Inventory Cost Adjustments (added) | Expense | Debit | Yes | A cost changed on stock on hand | |
| 5390 | Rounding (added) | Expense | Debit | Yes | Cent differences when an item is relieved in parts | |

"Control" means the account takes entries from business events only. A manual entry to a control account is refused unless the request carries the "adjust a control account" approval, which only the owner, a super administrator or the CFO can give and which is written to the audit log.

## Purposes and the account proposed for each

A posting rule never names an account. It names a purpose; the mapping says which account serves it. A purpose with no approved account is never replaced by another account: the event fails with that reason.

| Purpose | Proposed account |
|---|---|
| CASH_CLEARING | 1000 |
| RECEIVABLES | 1100 |
| INVENTORY_RAW | 1200 |
| INVENTORY_FINISHED | 1210 |
| WORK_IN_PROGRESS | 1220 |
| INVENTORY_IN_TRANSIT | 1300 |
| PAYABLES_CLEARING | 2000 |
| SALES_TAX_PAYABLE | 2100 |
| OPENING_EQUITY | 3000 |
| REVENUE_PRODUCT | 4000 |
| REVENUE_FREIGHT | 4200 |
| SALES_RETURNS | 4300 |
| COGS_MATERIAL | 5000 |
| SCRAP_WRITEOFF | 5300 |
| COUNT_VARIANCE | 5310 |
| COST_ADJUSTMENT | 5320 |
| ROUNDING | 5390 |

## Rules the software enforces on the chart

- An account code is unique. The type is one of asset, liability, equity, revenue, contra revenue, expense.
- An account that has posted lines cannot change its type. There is no way to delete an account. It can be made inactive unless a posting purpose is mapped to it; an inactive account takes no new lines.
- Any change to an account (name, type, description, in use, control) clears its approval.
- Changing a mapping clears that mapping's approval. Posting through it stops until it is approved again (tested: "A posting rule whose mapping loses its approval stops posting").
- Approval records who approved (a name typed by the finance user), which user recorded it and when.
- An account that exists and is not approved blocks "start posting again" even if no rule uses it (W-008). That is deliberate: every account in the books has an owner's approval.

## What the accountant is asked to decide

1. Approve, rename or replace each account, and the four additions.
2. One clearing account for all payment methods, or one per method.
3. Whether unapplied customer credit stays inside receivables (proposed) or moves to 2250.
4. Whether finished goods are kept apart from raw material (proposed) or in one inventory account.
5. The names of the same accounts in the accounting product used, for the export mapping.
