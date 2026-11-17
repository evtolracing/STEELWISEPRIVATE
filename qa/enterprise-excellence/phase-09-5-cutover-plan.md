# Phase 9.5: cutover plan

Date: 2026-11-16. How the books are started on the live system. **Nothing in this plan has been done on the live system.** The ledger there is off, and stays off until the steps below are completed by the people named.

## Principle (policy decision 16)

No history is rebuilt. The books start on the day the ledger is activated. Opening balances are taken from the business records at that moment and posted against Opening Balance Equity. Nothing is invented: what the records cannot support is not opened, and is listed for the accountant.

## What is opened, and from what

| Opened | From | How |
|---|---|---|
| Accounts receivable, per customer and branch | Every invoice not cancelled whose total differs from what is paid | Debit receivables for what is owed |
| Credit owed back to customers | Credit memos not fully applied or refunded | Credit balance in receivables for that customer, with a memo |
| Stock on hand, per item | Quantity on hand times the item's unit cost | Debit raw material or finished goods; each line names the item |
| Stock in transit | Transfer lines dispatched and not received | Opened at the sending branch, then moved to in transit by the ordinary transfer rule, so receiving or cancelling it later works like any other |

## What is not opened, and why

| Not opened | Why | Whose it is |
|---|---|---|
| Stock with no cost on file | A cost of zero would be an invention. Each item is listed in the dry run. When its cost is entered later, its value comes on against opening equity | Owner: decide each cost before or after cutover |
| Sales tax owed to the states | The records hold what was charged, not what has been remitted | Accountant: manual opening entry |
| Goods received and not invoiced by the supplier | Supplier invoices are not in this product | Accountant |
| Cash and bank balances | Not in this product | Accountant |
| Revenue for shipments that left and are not yet invoiced | Their cost left stock before the books began; their invoice will post revenue after. Each is listed | Accountant: accrual if wanted |
| Any balance from the existing accounting system | Unknown to this product | Accountant |

## Steps

| # | Step | Who | Where | Block if skipped |
|---|---|---|---|---|
| 1 | Apply database file 16 | Owner | Supabase SQL Editor: `16-20261117090000_financial_ledger.sql`, then `verify-6-to-16.sql` | No ledger tables: the Finance screen says so |
| 2 | Accountant reviews the 16 policy decisions and the chart | Accountant | `phase-09-5-accounting-policy-decisions.md`, `phase-09-5-chart-of-accounts.md` | Phase 12 acceptance |
| 3 | Load the proposed chart; change what the accountant changed | CFO or administrator | Finance, Accounts | Activation refused: "The chart of accounts has not been loaded" |
| 4 | Record the accountant's approval of accounts and mappings, by name | CFO or administrator | Finance, Accounts | Activation refused, naming each unapproved account and mapping |
| 5 | Resolve stock with no cost: enter costs, or accept that those items stay out | Owner | Inventory | Not blocked; the items are left out and listed |
| 6 | Dry run on a **copy** of the live database | Owner with the engineer | A copy whose name contains `qa` | This plan |
| 7 | Accountant signs the dry run totals | Accountant | The dry run result | Phase 12 acceptance |
| 8 | Dry run on the live system (reads only, posts nothing) | Owner, super administrator or CFO | Finance, Start and stop | Activation refused without a dry run less than 7 days old |
| 9 | Activate: accountant's name, approval date, time zone | Owner, super administrator or CFO | Finance, Start and stop | |
| 10 | Reconcile immediately | CFO | Finance, Overview | |
| 11 | Accountant posts the opening entries for what was not opened | Two finance users (one writes, one posts) | Finance, Journal | |

Steps 3 to 11 are in the product and need no engineer. Step 1 is the owner's, as every database update is.

## What activation does, exactly

One database transaction (`ledgerCutover.js` `activate`):

1. Locks the invoice, payment, stock, movement and transfer tables against writes, so every business save is either in the opening balances or posted as an entry afterwards, never both and never neither.
2. Checks again that every account and mapping is approved, and that the ledger was never started before.
3. Records the activation: date, time zone, accountant's name and approval date, the dry run it follows, who activated.
4. Reads the records and posts the OPENING entries, per branch, in parts of 400 lines, each balanced against opening equity.
5. Moves stock that is on a truck to in transit.
6. Writes the audit row with the totals posted beside the dry run's totals.

If any step fails, nothing is activated and nothing is posted. Activation cannot be run twice: a second attempt is refused ("already active"), and after a stop it is refused in favour of "resume posting".

Business saves wait while this runs. Its duration on live data is NOT VERIFIED; the dry run on a copy (step 6) will show the size. On the QA database, with about 480,000.00 of costed stock across the test branches, it completes within the scenario's normal time.

## Stopping and starting again

Posting can be stopped with a reason by the owner, a super administrator or the CFO. Business goes on. What is posted stays. On "resume", the cutover date does not move; the completeness check finds every record made while posting was stopped and "record what is missing" posts each from its own record, in order. Tested: "Posting stopped and started again: business goes on while it is stopped, and what happened meanwhile is found and posted in order".

## Rolling back

There is no "undo cutover" and none is offered: posted entries are permanent. If the opening balances are wrong, the accountant corrects them with manual entries against opening equity, which is what the account is for. To abandon the ledger, stop posting; the product works exactly as before.

Before activation on live, the owner takes a database backup (Phase 10 item: backup and restore of the ledger is to be proven there).

## Evidence on the QA database

`qa/sim/phase95-ledger.mjs`, set-up scenarios:

- "Before activation, a sale, a payment, a receipt and a shipment post nothing"
- "Activation is refused while nothing is approved, and says exactly what is missing"
- "The proposed chart loads once, unapproved, and loading it again adds nothing"
- "A loaded but unapproved chart still blocks activation, account by account"
- "The accountant's approval is recorded with a name; a mapping that is changed loses its approval"
- "Only the owner, a super administrator or the CFO can start the books; activation needs a name, a date, a time zone and a dry run"
- "The cutover dry run shows the opening balances from the records and writes nothing to the books"
- "Activation posts the opening balances from the records at that moment, balanced against opening equity"
- "Right after cutover the books agree with the records: the reconciliation finds no difference"

The approval recorded in those scenarios is synthetic test data on the QA database. No approval exists anywhere else.

## Outstanding before live activation

| Item | Owner |
|---|---|
| Accountant's approval of the 16 policies, the chart and the mappings | Accountant, recorded by the owner |
| How many legal entities the branches are (policy 14) | Owner |
| Time zone the books are kept in | Owner and accountant |
| Costs for stock with none on file | Owner |
| Dry run on a copy of live data, signed | Owner and accountant |
| Backup and restore proven with ledger tables | Phase 10 |
| Formal accounting acceptance | Phase 12 |
