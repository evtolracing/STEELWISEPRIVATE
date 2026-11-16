# Phase 8: order costing and profitability

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## The rule (owner decision 9, 2026-11-15)

Actual cost per item. No overhead. No rate is invented. Cost is shown to managers, the inventory manager and buyers only.

Phase 7 built cost at receipt, cost carried to cut pieces, and job cost (material used plus clocked time at the owner's labor rate per kind of work center). Phase 8 adds the last link: what a sale cost.

## What was built (N-017)

1. **Cost is fixed when material leaves.** Dispatch writes the stock item's unit cost on the shipment's stock movement (`MaterialMovement.unitCost`, database file 14). A later change to the item's cost does not change what a past sale cost. Dispatch does not change the cost on the item.
2. **An order's cost and margin** (`GET /api/orders/:id/cost`, and "Cost and margin" on the order screen):

| Line | From |
|---|---|
| Goods invoiced, less credits | The goods lines of the order's invoices and credit memos. Tax and freight are left out |
| Material shipped, less returned to stock | Shipment movements at their fixed cost, less return movements that went back to stock. Material returned and scrapped stays a cost |
| Labor on its jobs | Phase 7 job cost: clocked time at the labor rate of the kind of work center |
| Scrap on its jobs | Phase 7 |
| Margin | The first line less the other three, and as a percentage |

3. **A gap is named, never filled.** If any movement has no cost, or a kind of work center has no labor rate, the screen says which, and the margin is not shown. Verified: "when a stock item has no cost on file, the margin is not shown and the gap is named".
4. **Who sees it (N-020).** A scenario found stock cost being sent to sales and operators inside other answers (an order with its reserved stock; a stock item's movement history). One guard now removes cost from every stock item, stock record and stock movement in every answer unless the reader is a cost viewer.

## Verified

`qa/sim/phase8-fulfillment.mjs` group "Costing, reconciliation and closeout", twelve scenarios: cost fixed at dispatch; unchanged by a later cost edit; item value unchanged by shipping; missing cost named; a line filled from two items costed item by item; a partly shipped order counts only what shipped and was invoiced; tax and freight not revenue; a return to stock takes its cost back and the credit takes the revenue back; a scrapped return stays a cost; cost and margin only for cost viewers; no leak through the order, the shipment or the stock item. With the cost not written at dispatch, seven of them fail. Unit tests for the guard. Browser: a manager sees the panel with the right margin; sales does not.

## Limits, stated plainly

- "Do not invent labor rates or machine rates": none was. Labor shows only where the owner has entered a rate. Machine rates do not exist.
- Movements written before file 14 carry no cost. Orders shipped before it show "cost not on file", not a wrong margin. Nothing was backfilled, because the cost on the day is not known.
- Not in the margin, because nothing records them: overhead, freight paid to carriers, landed-cost allocation, packaging materials, commissions, early-payment discounts.
- There is no stock valuation report and no cost-of-goods posting (N-025). L-026 and K-007 stay IN PROGRESS for those.
