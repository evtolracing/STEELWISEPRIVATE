# Phase 9.5: manufacturing in the ledger

Date: 2026-11-16. Proposed treatment (policy decisions 7, 8 and 9), not approved. Evidence is `qa/sim/phase95-ledger.mjs`, group "Manufacturing, work in progress and costing" (20 scenarios) on a local QA database.

## What a work order does to the books

A coil work order consumes a source item and creates pieces and scrap in one save. The ledger posts one entry for the completed work order, built from the work order's own stock movements, so the journal and the stock history cannot disagree on quantities.

| Line | Amount |
|---|---|
| Debit finished goods, one line per piece | The piece's weight times the source item's unit cost |
| Debit scrap and write-offs | Scrap weight times the same unit cost |
| Credit the source item's inventory | The sum of the lines above |

Each piece is rounded to the cent and the source is relieved for exactly their sum, so the entry balances by construction. When the work order uses the source up, the cents left on the source go to Rounding.

A remnant is what is left on the source item. It keeps its cost per unit and nothing is posted for it.

## Work in progress

The product has no work-in-progress stock: consumption and output are one save. No balance is carried in 1220. A setting, off by default and changed only by the owner, a super administrator or the CFO, shows the same work order passing through 1220 inside the one entry. The account still ends at zero. Tested: "No balance is carried in work in progress; with the setting on, the same work order is shown passing through it and still ends at zero".

## Labor, machine time and overhead

**Not posted.** Time is clocked per step. An hourly rate per kind of work center can be entered (owner decision 9) and none is on file. There is no machine rate and no overhead rate. Posting labor would need a rate, and the instruction is not to fabricate one. Capitalising labor into finished goods would also change every piece's unit cost, which decision 9 fixed as "cost follows weight".

Tested: "Labor and machine time are not posted: clocked work changes nothing in the books and processing cost stays at zero". Account 5100 Processing Cost of Goods Sold exists and no rule posts to it.

Consequence the accountant must know: gross margin in the ledger is sales less material cost only. The report says so on its face and does not call itself a profit and loss statement.

## Scrap

Expensed at the source item's cost when the work order completes, with no recovery value. Nothing is credited back for scrap metal sold to a dealer, because the product has no record of such a sale. Tested: "Scrap is expensed at cost with no recovery value". The scrap report, read from the books, shows scrap by cause and rises by exactly what was written off.

## Missing cost

A work order on material with no cost completes on the floor as usual and is held in the books by name, never posted at zero. If a piece carries a cost different from its source, the entry is held for a person to decide which is right. Tested: "A work order on material with no cost completes on the floor and is held in the books".

## Job cost against the ledger

The order cost report (`lib/costing.js`, Phase 8) and the journal agree on material: "Job cost and the books agree on material: what the order's cost report says was used is what left the source in the journal". Labor appears in the job cost report only where a rate exists and never in the journal. That difference is by design and is stated here so it is not mistaken for an error.

## Jobs that are not coil work orders

Steps on the dispatch board (saw, shear, router and so on) record time and status. They move no stock value, so they post nothing. Stock leaves the books when the finished order ships.

## Concurrency and failure

- "Completing the same work order three times at once posts one entry."
- "Two work orders on one source completed at the same moment are both posted and the source still agrees."
- "When finished goods has no approved account the work order still completes; the event fails by name and posts after the mapping is restored."
- "A work order cancelled before completion moves no stock and posts nothing."

## Decisions for the accountant

1. Finished goods kept apart from raw material (proposed), or one inventory account.
2. Whether work order material should be shown passing through work in progress.
3. Labor: stay outside the ledger (proposed), expense from payroll, or absorb at a standard rate. The last needs rates from the owner and a new costing rule.
4. Scrap at full cost (proposed) or net of a recovery value.
