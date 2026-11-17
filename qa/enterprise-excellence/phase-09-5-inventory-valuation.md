# Phase 9.5: inventory valuation in the ledger

Date: 2026-11-16. Method proposed, not approved (policy decision 6). Evidence is `qa/sim/phase95-ledger.mjs`, group "Inventory valuation and adjustments" (27 scenarios) on a local QA database.

## Method

Specific identification by item. Each stock item carries its own unit cost, set at receipt from the purchase order line (owner decision 9). The ledger values every movement at quantity times that cost. No average and no FIFO layer is computed, and the ledger never sets or changes a cost: it reads it.

This is the method the product already used for operations. Whether it is also the book valuation method is the accountant's decision.

## What moves inventory value in the books

| Movement | Effect on inventory | Other side |
|---|---|---|
| Receipt against a purchase order | Up | Payables clearing |
| Shipment, counter sale | Down, at the cost on the movement | Material cost of goods |
| Customer return to stock, counter void | Up, at the cost it left at | Material cost of goods |
| Scrap, damage, shortage written off | Down | Scrap and write-offs |
| Count up or down, found, correction | Up or down | Count variance |
| Cost changed on stock on hand | Up or down by quantity on hand times the change | Cost adjustments |
| Work order | Source down; pieces up as finished goods; scrap expensed | Within inventory, and scrap |
| Transfer sent, received | Sending branch down, in transit up; then in transit down, receiving branch up | Within inventory |
| Piece cut outside a work order | Parent down, piece up | Within inventory |

## The rule for a missing cost

A movement of an item with no cost on file is **not posted and not valued at zero**. Its event is held (RECONCILIATION_REQUIRED) with the item's number in the reason. The business action itself is saved. When a cost is entered on the item, its held events are posted again in order, with that cost.

An item whose cost is entered as zero is different: it has a cost, and its value is nothing. Its movements are settled as "nothing to post" and are not exceptions.

Tested: "Material shipped with no cost on file: revenue posts, the cost is held and named, never posted at zero; entering the cost posts it"; "A count on an item with no cost is held by name"; "An item whose cost is zero has no value".

## Receipts without a purchase order

The product lets stock be received with no purchase order (the plain receive address and the upload). Such a receipt has no cost and no supplier, so there is no approved rule for the other side. It is held. An accountant can post it again by naming the account for the other side, once the item has a cost. Naming an account that is not in the chart posts nothing. Recorded as W-006.

Counter stock sold by the piece has no receiving screen at all (W-007). Its receipt is found by the completeness check ("record what is missing") and posted the same way.

## Rounding

Unit cost has six decimal places; the books are in cents. An item relieved in several parts is valued a part at a time, so the parts can add up to a cent or two more or less than the whole. When a movement empties the item, what is left for it in the books, up to 5 cents, goes to the Rounding account in the same entry. Tested: "An item relieved in three parts ends at exactly zero in the books: the odd cent goes to Rounding".

Until an item is used up, it can differ from quantity times cost by cents. The reconciliation reports those separately as ROUNDING with their sum, and reports anything above 5 cents on an item as a real difference.

## Reconciliation of stock

The reconciliation compares, item by item, what the books hold for the item (sum of its inventory lines) with quantity on hand times unit cost. It also compares in-transit value with the transfer lines still on the road. It corrects nothing.

Tested by damaging the data on purpose: "A stock balance changed behind the product's back shows as a named difference; the reconciliation corrects nothing". After the change is put back, the check matches again.

The inventory valuation report shows, per branch, the books beside the records, the items that differ, and the number of items with no cost on file, which are in neither figure.

## Concurrency

"Three corrections of the same item at once are all posted, and the books equal quantity times cost". "A receipt sent three times at once" is received and posted once (existing request-key rule plus the unique event).

## What is not valued

- Stock with no cost on file. It is counted and named, never estimated.
- Landed cost, freight in, duty: no record exists (N-026, K-012).
- Labor or overhead in finished goods (policy decision 8).
- Lower of cost or market, obsolescence, remnant markdowns: no rule is posted. "A remnant sold below cost posts the sale and the cost as they are: no write-down is invented".

## On the QA database

The test data holds about a thousand stock items with no cost on file, left by earlier phases' scenarios. They are in neither side of the stock comparison and are named in every reconciliation run. On the live system, the dry run lists every such item so the owner can decide each cost before cutover; see `phase-09-5-cutover-plan.md`.
