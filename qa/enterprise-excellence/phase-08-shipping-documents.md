# Phase 8: drop tags, labels and shipping documents

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## What prints

| Paper | Drawn from | Where it is opened |
|---|---|---|
| Pick list / packing list (before dispatch) | The shipment, its order, the branch, the stock reserved for each line | Shipment screen, "Packing list" |
| Packing list (after dispatch) | The same, with the stock movements that left, and who received it or why nobody signed | Shipment screen |
| Bill of lading | The shipment, shipper (the branch), consignee (the order's ship-to), carrier, lines, weights | Shipment screen, "Bill of lading" |
| Drop tag | The package, its items, heat, grade, order and line | Tag Management |
| Job labels | The job, its order, branch and customer PO | Print queue |
| Load listing | The tags loaded on one shipment | Staging and Loading |

One reader, `lib/shippingDocuments.js`, builds the first three, so they cannot disagree with each other or with the screen.

## The rule: nothing is invented (N-014)

Before this phase the bill of lading and labels printed a fixed company name and address, a placeholder ship-to, "1" for pieces and weights that were not on file. Now:

- A fact that is not on file prints as a blank to be written in by hand, or "(not entered)" for the bill of lading number.
- The shipment screen lists what is missing before anyone prints: no branch street address, no ship-to address, no carrier, no bill of lading number, no weight, less reserved than carried, stock at another branch.
- Total weight is the weight typed on the shipment; if none, the sum of the line weights; if any line has none, blank. The paper says which.
- Every typed value is escaped, so text cannot change the layout of a paper (N-019).
- A paper waiting in the print queue is brought up to date when it is asked for again, and there is one waiting copy of each per shipment (N-023).

## Print queue (N-015)

A print job belongs to a branch. Each branch sees and settles its own. A job is marked printed or skipped once, by a named person, and a further copy is a new job.

## Verified

`qa/sim/phase8-fulfillment.mjs`: "the papers show a blank, never an invented value, for what is not on file", "the bill of lading and packing list are drawn from the shipment, with nothing invented (N-014)", "a paper waiting in the queue is brought up to date, never printed stale, and never queued twice", "text on a printed paper cannot carry markup", "each branch sees and settles its own print jobs (N-015)", "a print job is settled once, by a named person", "a job label prints the real branch, order and customer PO", "the papers after delivery carry who received it". Browser: `qa/sim/ui-phase8.cjs` opens both papers and reads them.

## Not verified, and for the owner

- No paper was printed on a printer. Layout on label stock is NOT VERIFIED.
- **The branch street address must be on file for it to print.** The read-only check `check-before-phase-8.sql` counts branches without one.
- The bill of lading carries the facts on file and blanks. Legal wording (terms, hazardous material statements, NMFC class) is not on it, because none is on file and none was invented. If the carrier or counsel requires wording, it is the owner's to supply.
- Certificates (mill test reports) are attached to heats (Phase 6). They are not printed with the packing list.
