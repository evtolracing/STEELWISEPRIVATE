# Phase 9.5: financial reconciliation

Date: 2026-11-16. How the books are compared with the business records, what each check proves, and how it behaves when they disagree. Evidence is from this session on a local QA database. Measured figures are in `phase-09-5-regression-results.md`.

## Principle

The reconciliation reads and compares. **It never corrects.** A difference stays on the report until its cause is dealt with by a person: a cost entered, an event posted again, a manual entry written by one finance user and posted by another. There is no "force to zero", and no plug entry is ever made by the software.

Each run is stored (`LedgerReconciliation`) with who ran it, when, and every check's figures, and is never changed afterwards.

## The ten checks

`src/backend/src/services/ledgerReports.js` `reconcile`. Run from Finance, Overview, by a finance user.

| Check | Books | Records | Result when they differ |
|---|---|---|---|
| BOOKS_BALANCE | Sum of debits of posted lines | Sum of credits; also every entry on its own, and every entry against its stored total | DIFFERENCE, naming the entries |
| RECEIVABLES | Receivables account, per customer | Open invoices less payments, and credit owed back, per customer | DIFFERENCE, naming up to 25 customers with both figures |
| INVENTORY | Inventory lines per stock item | Quantity on hand times unit cost, per item | DIFFERENCE for any item off by more than 5 cents; ROUNDING, with the sum, when only cents differ; the count of items with no cost is stated and they are in neither figure |
| IN_TRANSIT | In-transit account | Transfer lines dispatched and not received, at cost, same owner | DIFFERENCE |
| REVENUE | Revenue and returns from business events | Invoices and credits since the books began: subtotal plus freight | DIFFERENCE |
| SALES_TAX | Tax payable from business events | Tax on invoices less tax on credits since the books began | DIFFERENCE |
| PAYMENTS | Clearing account from business events | Payments less refunds since the books began | DIFFERENCE. The note says whether money reached a bank is not known here |
| EVENTS | | Events that are FAILED, held or pending | EXCEPTIONS, with each event and its reason |
| COMPLETENESS | | Invoices, credits, payments, movements, transfer lines, work orders and cost changes since the books began that have no ledger event at all | EXCEPTIONS, listing them. "Record what is missing" posts each from its own record |
| SHIPPED_NOT_BILLED | | Shipments that left since the books began with no invoice | INFO only: for the accountant's accrual |

A run passes when no check is DIFFERENCE or EXCEPTIONS.

## Proof that the checks find real differences

A check that always says MATCH proves nothing. Each of these scenarios damages the QA data on purpose, confirms the check reports it by name, confirms nothing was "fixed", puts the data back, and confirms the check matches again.

| Scenario (`qa/sim/phase95-ledger.mjs`) | What was done | What the check said |
|---|---|---|
| "A stock balance changed behind the product's back shows as a named difference; the reconciliation corrects nothing" | Quantity on hand changed by SQL with no movement | INVENTORY: DIFFERENCE, naming the item |
| "Receivables in the books against the invoices: a record changed outside the product shows as a difference by customer, and nothing is 'fixed'" | An invoice's paid amount changed by SQL | RECEIVABLES: DIFFERENCE, naming the customer |
| "A payment written to the database without its ledger event is found by the completeness check and posted from its own record" | A payment inserted by SQL | COMPLETENESS: EXCEPTIONS, then posted from the record by a finance user |
| "An invoice from before the books began is cancelled: nothing is posted, the books show the difference, and the accountant settles it with a named adjustment" | An opening-balance invoice cancelled | RECEIVABLES differs until a manual entry, written and posted by two people, settles it |
| "Posting stopped and started again: business goes on while it is stopped, and what happened meanwhile is found and posted in order" | Posting stopped, business done, posting resumed | COMPLETENESS lists everything in between; all posted in order |

## After cutover

"Right after cutover the books agree with the records: the reconciliation finds no difference": BOOKS_BALANCE, RECEIVABLES, IN_TRANSIT, REVENUE, SALES_TAX, PAYMENTS and COMPLETENESS match, and INVENTORY matches item by item. Stock that was on a truck at cutover with no cost on file cannot be valued; each such transfer line is held by name. On the QA data there are three, left by earlier phases' scenarios, so EVENTS reports three exceptions from the first run onward. That is the correct answer: they are real, and nothing clears them but entering the costs.

## At the end of every scenario group

The last scenario of the ledger run is "At the end of every scenario the books still balance and agree with the records; what does not agree is a held event with its reason". After all 158 scenarios, including every concurrency and failure scenario, the checks above are run once more.

## Under load

`qa/sim/phase95-load.mjs`, after 80 branches posted at once and 2,000 manual entries: "the reconciliation finds no difference", "every entry balances", "the trial balance balances", "no business record has two entries", "nothing the load sent is left unposted". Reconciliation time is measured there.

## Reports reconcile to each other

"Every report is cut from the same posted lines: revenue, margin, tax, stock and scrap agree with the trial balance". There is one source (posted journal lines) and no report keeps its own totals.

## What is not reconciled, and why

| Not reconciled | Why |
|---|---|
| Cash clearing against a bank | No bank record is in the product. The account is what was recorded as received, and says so |
| Payables clearing against supplier invoices | Supplier invoices are not in the product (W-009) |
| Sales tax payable against returns filed | Remittances are not in the product |
| The ledger against the company's accounting system | No connection exists (W-011) |
| Labor and overhead | Not posted (policy decision 8) |

## Limits stated

- Agreement is proven on synthetic QA data. Nothing has been reconciled on live data: the ledger is not active there.
- The INVENTORY check reads at most 5,000 differing items per run. With more than that it would count only the first 5,000 and does not say so; at that size it needs paging (Phase 11, W-023). The QA data has far fewer.
- A difference of 5 cents or less per item is classed as rounding by rule. The accountant may want a different threshold.
