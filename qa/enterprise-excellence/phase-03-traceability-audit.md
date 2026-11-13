# Phase 3: traceability audit

Can a piece of material be followed from the mill heat to the customer, and back? Read from the schema and the code, and tested on the local QA database in this session.

## 1. The chain as built

| Link | Held in | Enforced by |
|---|---|---|
| Heat to mill, grade and test results | `Heat` (unique heat number), `Grade`, test result rows | Foreign keys; heat number unique |
| Stock item to heat and grade | `Coil.heatId`, `Coil.gradeId`, both required | Foreign keys, NOT NULL. Receiving refuses a heat that is not on file and saves nothing (scenario) |
| Remnant or cut piece to its parent | `Coil.parentCoilId` | Foreign key. Receiving copies heat, grade and owner from the parent and refuses a remnant that names a different heat or grade, or a parent not on file (scenario: three refused, none saved) |
| Item to every place it has been | `MaterialMovement` (from branch, to branch, quantity, person, time) | Written in the same transaction as the balance |
| Item to the order it was reserved for | `OrderLineAllocation` | Foreign keys |
| Item to the shipment and order it left on | `MaterialMovement` of type SHIP, with `orderId` and `shipmentId` | Written when reserved stock is consumed at dispatch (scenario: one movement, tied to both) |
| Shipment to invoice | `Invoice.shipmentId` | Foreign key, added in Phase 3 |
| Customer return to the original line and item | `Order.returnOfOrderId`, `OrderLine.returnOfLineId`, a RECEIVE movement with reason CUSTOMER_RETURN | Foreign keys, added in Phase 3 |
| Mill certificate to heat or item | `Document` linked to any record | Document links (Workstream 4) |
| Who did it | `createdById` on movements; `AuditLog` for jobs, shipments, invoices, payments, work orders, prices and, since Phase 3, order status and reservations | Written in or beside the transaction |

## 2. Trace queries run on the QA database

| Question | Result |
|---|---|
| Forward: which customers received material from each heat? | Answered from SHIP movements joined to items and orders: 144 shipping movements across 6 heats, 127 shipments and 19 customers. Every one of those movements names its order |
| Backward: which heat did a shipped item come from? | Every stock item has a heat (0 of 410 without). 0 remnants disagree with their parent's heat |
| Where has this item been? | The movement list for an item, in order. The check "last transfer did not end where the item now is" returns 0 |
| Speed at volume | Every item of one heat (31,605 rows on the scale copy): 23 ms. One item's movements: 0.1 ms |

The route `GET /api/heats/:heatNumber/trace` returns a heat with its items, their cut pieces and its test results. It does not list shipments or customers; the forward trace above was run as a query, not through a screen.

## 3. Breaks in the chain

| Break | Evidence | Finding | Status |
|---|---|---|---|
| **A shipment with no reservation names no stock item.** `ShipmentItem` has no column for the item; the only link is the movement written when reserved stock is consumed. Ship without reserving and nothing connects that shipment to a heat | Scenario: 300 lb dispatched and invoiced, 0 movements. Database check: 3 such shipment items in the QA database after a full run | G-019 (P1) | REQUIRES BUSINESS DECISION |
| **Processing leaves no trace.** A work order records input, output and scrap weights. It creates no output items, no scrap record and no movement. `WorkOrderOutput` and `TraceEvent` hold no rows | Scenarios in the work order group | M-016 | REQUIRES BUSINESS DECISION |
| **Cut pieces exist only when someone enters them by upload** with the parent's number | Remnant scenario | G-006, M-016 | REQUIRES BUSINESS DECISION |
| **Operator and machine on a piece.** A job records its work center and who moved it. Which item a job consumed is known only through the order line's reservation | Code read | M-016 | With the processing rule |
| **No forward-trace screen or report** for a recall | Route read | New work, belongs to the quality module | Recorded in the Phase 4 handoff as a missing endpoint |
| **Split, merge and regrade of items** | No route exists | I-016 | REQUIRES BUSINESS DECISION |
| **Packages and drop tags** carry their order; the table that links a package to stock items is in the material tracking module, which the tests reach only in part | Test reach, Phase 2 | B-016 | Deferred |
| **Supplier lot and purchase order** | Receiving stores a purchase order reference as text; there is no purchase order table in use | I-007 | REQUIRES BUSINESS DECISION |

## 4. Judgement

Where stock is reserved before it ships, and the item was received through the system, the chain from heat to customer is complete, enforced by foreign keys, and fast to query. It breaks at the two points where the system does not record a physical event: shipping without a reservation, and processing. Both wait on a rule from the owner, not on engineering. Until they are closed, a recall can be answered for reserved shipments of unprocessed stock and for nothing else with certainty.
