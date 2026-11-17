# Phase 9.5: reporting validation

Date: 2026-11-16. Each ledger report, what it is cut from, what it is checked against, and what it must not be mistaken for. Evidence is `qa/sim/phase95-ledger.mjs` (mainly the group "Periods, cutover and reporting") and `qa/sim/phase95-ui.cjs`, on a local QA database. Measured times are in `phase-09-5-regression-results.md`.

## One source

Every report is a query over posted journal lines (`src/backend/src/services/ledgerReports.js`). No report keeps a running total of its own, and drafts are in none of them. "Every report is cut from the same posted lines: revenue, margin, tax, stock and scrap agree with the trial balance" checks each report's total against the trial balance account it comes from.

## The reports

| Report | API | Shows | Validated by |
|---|---|---|---|
| Trial balance | `/api/ledger/reports/trial-balance` | Every account: debits, credits, balance on its normal side; total debits and credits; whether they balance; as of any day or between two days | "The trial balance is the sum of the posted lines, as of any day, and drafts are not in it" |
| General ledger activity | `/reports/account?code=` | One account: balance brought forward, each line with its entry, running to the closing balance | "General ledger activity for an account: brought forward plus the period equals the closing balance, line by line to its entry" |
| Journal | `/api/ledger/entries`, `/entries/:id` | Entries with lines, source record, rule version, who and when; found from the source record's id | "Journal entry detail: an entry shows its lines, its source record, its rule version, who and when, and can be found from the source" |
| Revenue | `/reports/revenue?by=branch|division|customer|product` | Sales, returns and net, grouped | "The revenue report by customer rises by exactly what was invoiced to that customer"; "Revenue is reported by product and by division when the order line names a product" |
| Gross margin on material | `/reports/gross-margin?by=branch|division` | Net sales, material cost, the margin between them; scrap and stock adjustments shown beside, not netted in | "The gross margin report shows sales less material cost, and says it is not a profit and loss statement"; "The gross margin report by branch separates the two branches' sales and costs" |
| Receivables | `/reports/receivables` | Per customer: owed, credit owed back, the records' figure, the books' figure, the difference | "The receivables report shows, for one customer, the same balance as that customer's invoices"; "A credit on an invoice already paid leaves a credit balance for the customer, shown apart" |
| Sales tax | `/reports/sales-tax` | Tax payable by ship-to state | "The sales tax report by state rises by the tax invoiced to that state" |
| Inventory value | `/reports/inventory` | Per branch: the books beside the stock records, items that differ, items with no cost | "The inventory valuation report: every branch's books equal its stock records, to within the stated rounding" |
| Scrap | `/reports/scrap` | Write-offs by cause | "The scrap report, read from the books, rises by exactly what was written off"; "Scrap from work orders shows in the scrap report under its cause" |
| Monthly statement | `/reports/monthly?year=&month=` | Every account for a month: opening, debits, credits, closing; a summary | "The monthly statement carries balance-sheet accounts forward, starts income and expense at zero, and does not call itself a P&L" |
| Not posted | `/reports/exceptions` | Events by status with reasons | "Posting states mean one thing each: every event is in a known state, posted events have a posted entry, and held ones say why" |

## What the reports are not

The instruction is that gross margin must not be labelled a profit and loss statement. The software says so in the data itself, so every screen and every export of it carries the statement:

- Gross margin: title "Gross margin on material", and a note that it is not a profit and loss statement and that labor, machine time, freight cost, overhead and everything kept outside this ledger are not in it.
- Monthly statement: a note that it is a statement of this ledger and not a profit and loss statement or a balance sheet: payroll, rent, supplier invoices and bank activity are not here. Its summary line is named "sales less expenses in this ledger", never profit.
- Cash clearing: described as payments recorded, not a bank balance. "A recorded payment sits in a clearing account; nothing in the books claims it reached the bank".
- The assistant is given the same statements as rules and told never to call the margin profit, net income or a P&L.

Income and expense accounts start each monthly statement at zero. No year-end closing entry is made by this product: closing the year into retained earnings is the accounting system's job.

## Branch reporting

Every line carries its branch. Company readers see all branches. A branch manager sees the lines of their own branches in the trial balance, account activity, revenue, margin, inventory, scrap and monthly reports, with a note that a branch view need not balance because the other side of an entry may be at another branch or at none. Receivables and sales tax are company reports and are refused to a branch manager.

- "The branches add up to the company: every posted line is in exactly one branch total or in 'no branch'"
- "A sale made and shipped at the second branch is booked to the second branch on every line"
- "The branch valuation follows the transfer: the sender's books fall and the receiver's rise by the same amount"
- "Every entry from a branch names the organisation that owns the branch"

## Agreement with the operational reports

The product's earlier reports are unchanged and are the "records" side of the reconciliation: receivables by age (invoices), stock valuation (quantity times cost), order cost (job costing). The ledger's receivables and inventory figures are compared with them customer by customer and item by item; see `phase-09-5-financial-reconciliation.md`. "Job cost and the books agree on material".

## The screens

`src/frontend/src/pages/Finance/` (React, Material UI, JSX). Tabs: Overview, Trial balance, Reports, Journal, and for company readers Not posted, Months, Accounts, Start and stop, Export. `qa/sim/phase95-ui.cjs`, 13 scenarios in a real browser:

- "The CFO finds Finance on the menu and the overview says since when the books run"
- "A sales rep has no Finance on the menu and is turned away from its address"
- "An operations manager, who opens every other area, does not get Finance"
- "The trial balance shown is the server's, balances, and an account opens to its lines and then to an entry"
- "A manual entry is saved as a draft, cannot be posted by its writer, and is posted by a second person"
- "An entry from a business record offers no reversal by hand and says how to undo it"
- "Reports: gross margin is titled for what it is, and sales tax and receivables show the server's totals" (this one found the crash on changing report, W-013)
- "Events that did not post are listed with their reasons, and settling one needs a note"
- "Months: a closed month shows who may reopen it, and reopening asks for a reason"
- "The auditor reads everything and is offered no way to change anything"
- "A branch manager gets the branch reports only and is told the view is of their branch"
- "Export says plainly that nothing is connected or sent, and the accounts page shows every approval"
- "On a phone the Finance screen has no sideways scroll and the tabs can be reached"

Every figure on the screen comes from the server. The screen adds nothing up.

## Limits stated

- Validated on synthetic QA data only.
- No report has been compared with the company's actual accounts.
- Report times are measured at the volume of the load check (about 3,000 entries on top of the QA data). At a year's volume they are NOT VERIFIED (W-023, Phase 11).
- There is no comparative period, budget or consolidation report. None was asked for and none is implied.
