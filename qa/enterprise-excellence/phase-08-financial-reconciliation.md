# Phase 8: order-to-cash reconciliation

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## What is reconciled

The scenarios do not only check answers. After acting they read the database, and three scenarios reconcile everything the run did.

**"orders, shipments, stock and invoices reconcile across everything this run has done"** checks, for every record the run made:

- no line has shipped more than was ordered;
- every line's shipped quantity equals its dispatched shipment items, and the stock movements that name the line add up to it;
- no line is invoiced for more than has shipped;
- every shipment that left has an invoice, or its order is listed as shipped and not invoiced;
- no stock record is below zero or reserved beyond what is on hand;
- no shipment was dispatched twice (one departure row in each history), and none has two invoices.

**"money figures hold to the cent on every invoice the product has issued"** checks every issued invoice: total is goods plus tax plus freight; paid is the sum of its payment rows; nothing is paid over its total or below zero; the subtotal is the sum of its lines; every invoice marked paid is paid in full, and none marked sent has money on it.

**"after every simultaneous request in this run, nothing was duplicated or lost"** checks, after the concurrency scenarios: no shipment has two invoices; no invoice, credit memo, shipment, package, tag or listing number is used twice; no shipment line moved more stock than the shipment carries; no return was received twice; no stock record is negative or over-reserved; no request is left half-done under a request key.

## Database checks

`qa/tools/db-facts.mjs` runs read-only rules after the simulation and again after every scenario suite. Seven were added in Phase 8:

| Check | Meaning of a non-zero count |
|---|---|
| Dispatched shipments whose stock movements add up to more than the shipment carries | Stock taken twice. Must be 0 |
| Shipments still on the dock for a cancelled order | N-006 not applied. Must be 0 |
| Packages with more than one live tag | N-010 not applied. Must be 0 |
| Returns whose missing credit was settled more than once | N-016 not applied. Must be 0 |
| Stock movements with a negative cost | Must be 0 |
| Shipments delivered with neither a name nor a reason | Only deliveries written before the rule, or written straight into the database by test fixtures |
| Shipments on the road or delivered with no invoice | Each is listed for billing on the Integrations screen. The tests create some on purpose |

The figures from the final run are in `phase-08-regression-results.md`.

## What is not reconciled, because it does not exist

There is no ledger, so there is nothing to reconcile invoices and payments against (N-025). There is no bank feed. There is no stock valuation report; the cost of what was sold is per order (`phase-08-job-costing.md`).

## Live data

NOT VERIFIED. No figure in this document is about the live database. The read-only script `check-before-phase-8.sql` (in `/mnt/project-files/database-updates/` and `src/backend/prisma/upgrades/checks/`) counts, on the live database, the records the new rules will refuse or print blank. It changes nothing.
