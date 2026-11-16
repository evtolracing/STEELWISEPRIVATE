# Phase 8: returns, credits, refunds and adjustments

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## How a return works

1. Opened against a shipped sales order line, for no more than shipped less what is already on other returns, with a reason and a disposition per line (restock, scrap, or hold for inspection). Opening moves nothing.
2. Received by sales, warehouse or production staff of the selling branch. In one save: the material comes back on the books (restock: available; hold: on hold until released; scrap: recorded in and out), with its unit taken from the stock item, and the return is complete. Receiving less than authorised credits only what came back.
3. A credit memo is raised for what came back, with the tax that was on it. On a paid invoice the credit is owed back until a refund is recorded.

Two people receiving the same return at once bring it back once. Two returns cannot together bring back more than shipped. A cancelled return cannot be received, and a received one cannot be cancelled.

## Corrected: a return whose credit cannot be issued (N-016)

If the invoice has already been credited in full (for example a goodwill credit), the material still comes back, but no credit can be raised. Before, that fact went to the server log and nowhere else. Now:

- the receipt answers with a warning;
- the return is flagged "Credit not issued" on the Returns screen, on the order's closeout and under "Needs action" on the Integrations screen;
- a manager either issues the credit (if room has appeared) or records, with a reason, how it was settled another way;
- it can be settled once, also when two managers press at the same moment.

## Adjustments

An invoice is never edited. The only adjustments are a credit memo, a refund against a credit, and a cancel before any payment or credit. Each is a manager's action with a reason and is written to the invoice's history. Limits are in `phase-08-invoicing-review.md`.

## Verified

`qa/sim/phase8-fulfillment.mjs` group "Returns, credits, refunds and adjustments", fifteen scenarios, and four in the concurrency group. Browser: the flag and the settlement on the Returns screen.

## Not built, and for the owner

- Restocking fees, return authorisation approval levels and return windows: no rule exists.
- A load that never arrived, or was destroyed, is not a return: a manager ends it as lost and its invoice is credited (N-027, owner decision 10).
- A return to a supplier: purchasing (Phase 6, K-series).
- Refunds move no money. A refund is a record that money was sent back by some other means.
