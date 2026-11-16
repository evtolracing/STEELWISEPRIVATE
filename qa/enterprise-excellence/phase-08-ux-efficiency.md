# Phase 8: screens, reporting and timings at about 80 branches

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## Screens changed or added

| Screen | Change |
|---|---|
| Shipment | "Stock to pick" before dispatch and "Stock that left" after, with tag, heat, grade, bin and quantity. A warning naming what the papers will print blank. "Packing list" and "Bill of lading" open the paper as it will print. "Mark delivered" asks who received it, or why nobody signed. "Report a problem" asks what happened |
| Order | A Closeout panel: what is still open, each with its figure. Cost and margin for the roles that manage cost |
| Orders Not Closed (new) | Every open order, oldest first, with what it is waiting for |
| Invoices | "Owed by age": receivables by customer in five columns |
| Returns | "Credit not issued" flag, "Issue credit", "Settled another way" |
| Packing (new) | Open a package, add material from the stock reserved for the line, send to quality, release or hold, make the tag, seal. Only the next allowed step is offered |

Every refusal from the server is one sentence that says what is in the way and what to do, and gives away nothing about the inside (verified: "error answers say what to do and give away nothing about the inside").

## Browser checks

`qa/sim/ui-phase8.cjs`: 45 checks on the six screens above in a real browser, including that the delivery and problem buttons stay switched off until the text is typed, that both papers open and read correctly, that sales sees no cost, and that the shipment, Orders Not Closed and Packing screens fit a 390-pixel phone without sideways scrolling.

## Timings at 85 branches

Local machine, a database with 85 branches, 72,565 orders, 74,671 lines, 50,869 shipments, 37,625 invoices and credit memos, 26,789 payments, 42,441 stock movements and 20,000 print jobs. Median of seven calls (five for the closeout list), as a head-office login and as a branch manager.

| Call | Median, all branches | Median, one branch |
|---|---|---|
| Shipments list, first page | 18 ms | 13 ms |
| Shipments on the dock | 15 ms | 12 ms |
| One shipment | 13 ms | 9 ms |
| Its papers (data for pick list, packing list, bill of lading) | 14 ms | 10 ms |
| What can ship for an order | 9 ms | 9 ms |
| Invoices list, first page | 18 ms | 14 ms |
| Invoices, overdue only | 11 ms | 9 ms |
| One invoice | 10 ms | 9 ms |
| Owed by age | 6 ms | 8 ms |
| Orders not closed, first page | 133 to 148 ms | 148 to 206 ms |
| Orders not closed, still to ship | 10 ms | 11 ms |
| Closeout of one order | 15 ms | 10 ms |
| Cost and margin of one order | 9 ms | 8 ms |
| Returns list | 26 ms | 43 ms |
| Print queue | 7 ms | 7 ms |

The slowest call is the first page of Orders Not Closed with no filter, because it works out the position of every open order before paging. It is well inside a usable time at this size. If it grows, the fix is an index-backed summary, not made now because nothing measured calls for it.

## Limits

- These are times on one local machine with one user. Times on the host, under many users, are NOT VERIFIED. The simulated database has no packages; the Packing screen was not timed at scale.
- No real user was timed doing a task, so no "minutes saved" is claimed.
- Accessibility beyond named buttons, labelled fields and phone width is NOT ASSESSED (Phase 9).
- The seven freight sample screens are unchanged and belong to Phase 9 (U-035).

## Reporting

Built this phase: receivables by age, orders not closed by reason, order cost and margin, shipments not invoiced and returns without credit on the Integrations screen. Not built: on-time delivery, fill rate, days sales outstanding, margin by customer or branch. Each needs a definition from the owner (what counts as on time, for example) and belongs with the reporting work of a later phase.
