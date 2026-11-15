# Phase 6: warehouse operations

Date: 2026-11-15.

## 1. Material lifecycles mapped

| Lifecycle | Steps | Records | State after Phase 6 |
|---|---|---|---|
| Buy and receive | Purchase order, place, receive against a line, hold on mismatch, release | Order (PO), OrderLine, Coil, Inventory, MaterialMovement RECEIVE, QCHold | Built and verified |
| Receive without an order | Receipt form or upload | Coil, Inventory, RECEIVE | Verified (Phases 2 and 3) |
| Put away and find | Bin on the item; search by number, heat, grade | Coil.binLocation | Works; bins are free text (K-009) |
| Reserve and pick | Reserve an item for an order line; ship the reserved stock | OrderLineAllocation, Inventory, SHIP | Verified; the item must now fit the line (K-001) |
| Process | Work order consumes a source, makes pieces and scrap | WorkOrder, PROCESS, CONSUME, SCRAP, child Coil | Verified; refused on an item in transit |
| Remnant | Entered against a parent, or made by a work order | Child Coil with parent, heat, grade, owner | Verified; the Steel Outlet list is separate (K-006) |
| Scrap | Stock correction with reason SCRAP; work order scrap; scrapped return | SCRAP movement | Verified; no value on scrap (K-007) |
| Transfer | Ship, in transit, receive, settle a shortage, or call back | StockTransfer, StockTransferLine, Inventory.qtyInTransit, TRANSFER, ADJUST | Built and verified (G-007) |
| Return | Authorise, receive, restock, inspect or scrap, credit | Order (RETURN), RECEIVE, SCRAP, QCHold, credit memo | Verified; inspect and unit rules added (K-003, K-004) |
| Count and correct | One item to a counted quantity, with a note | COUNT, ADJUST, audit row | Verified; no count program (K-008) |

## 2. Locations and bins

All 85 location rows are branches. A bin is text on the item. Putaway to a typed bin and finding the item afterwards are verified; nothing validates the bin. Whether the branches want bins on file is the owner's (K-009).

## 3. Scanning

An item is found by its exact number at `GET /api/coils/number/:n` and by search on the stock items screen, which is what a keyboard-style barcode scanner needs. **HARDWARE NOT VERIFIED**: no scanner, label printer or RFID reader was available, and no claim of compatibility is made (K-013). The old RFID scan write went to the retired second stock list and now answers 410.

## 4. Holds

A hold takes the free quantity out of sale; what is reserved stays reserved but cannot ship. Since this phase one piece of code places and releases every hold (K-005), used by the stock item screen, a transfer received short or damaged, a receipt that does not match its purchase order line and a return waiting for inspection. An item in transit cannot be put on hold (the receiving branch holds it on arrival); an item already on hold can be sent and arrives still on hold.

## 5. Who may do what

| Action | Roles |
|---|---|
| Receive, send and receive transfers, hold | Warehouse, production and quality staff, at their own branch |
| Correct a balance, settle a transfer shortage | Managers and the inventory manager |
| Write and place purchase orders | Buyer, inventory manager, managers |
| Read stock | Every internal login, own branches only |
| Customers | None of it |

Each row is checked by a scenario (sales, operator, shipping, clerk and customer logins refused where they should be).

## 6. At 85 branches

Measured on `steelwise_qa_scale3` (100,233 stock items) with SQL Editor file 12 applied, median of 7 calls, all-branch login: first page of stock items 48 ms; search by part of a number 116 ms; item by exact number 9 ms; stock balances 39 ms; summary 22 ms; recent receipts 32 ms; transfers coming in 6 ms; purchase orders 19 ms; supply position 271 ms. All inside the half-second target. The one-branch login used for the benchmark has no stock in the scale copy, so its figures (5 to 49 ms) measure the empty case only.
