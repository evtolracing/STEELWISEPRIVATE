# Phase 3: data ownership

> **Updated after the owner's decisions of 2026-11-13.** Shipping without a reservation (G-019), stock movement in processing and remnants (M-016, G-006, G-008), stock corrections (I-016), invoice numbering (G-017) and retention (G-016) were decided and built after this file was first written. Rows below that name those findings are marked. The detail is in `phase-03-owner-decisions.md`.

For each kind of business record: the one place that is authoritative, what writes it, what is derived from it, and where a second copy exists. Built from the schema inventory (`qa/results/db-schema.json`), the code that writes each table (`database-inventory.md`, "Written by"), and the Phase 3 scenarios, which read the tables directly after every operation.

## 1. Source of truth, by record

| Record | Authoritative tables | Written only by | Derived or cached values, and how they are kept in step | A second copy exists? |
|---|---|---|---|---|
| Stock item (what the material is) | `Coil`: number, heat, grade, form, dimensions, owner, parent item, branch | `lib/receiving.js` (receipt, upload, remnant), `routes/coils.js` (edit, hold), `routes/inventory.js` (transfer) | `Coil.locationId` is repeated on `Inventory.locationId`; both are changed in the transfer's one transaction. Database check: 0 rows disagree | Yes: the second stock list (below) |
| Stock quantity | `Inventory`: on hand, available, reserved, on hold. One row per stock item | Receiving, reservation, cancellation, dispatch, return receipt, hold and release, counter sale and void | The database enforces on hand = available + reserved + on hold, and no quantity below zero. Reserved is repeated as the sum of `OrderLineAllocation`; check: 0 rows disagree | Yes: the second stock list |
| Stock history | `MaterialMovement`: receive, ship, transfer, counter sale, return | The same transactions that change `Inventory` | For any item received through the system, on hand equals receipts minus shipments in the ledger; check: 0 rows disagree. Seed and fixture items have no opening movement and are excluded | No |
| Reservation | `OrderLineAllocation` | `POST /api/orders/:id/allocate`; released by cancellation, consumed by dispatch | See stock quantity | No |
| Sales order | `Order`, `OrderLine` | `routes/orders.js`, quote acceptance, web checkout, counter sale, order intake, returns | `Order.subtotal` repeats the sum of line prices; the database enforces total = subtotal + tax + freight; check on subtotal against lines: 0 outside seed rows. `OrderLine.qtyShipped` repeats dispatched shipment items; check: 0 outside seed rows | Yes: the order hub (below) |
| Quote and request | `RFQ`, `RFQLine`, `Quote`, `QuoteLine` | `routes/rfqs.js`, `routes/quotes.js` | Quote total repeats its lines. The price is copied onto the order line at acceptance and does not change afterwards (scenario) | No |
| Shipment | `Shipment`, `ShipmentItem` | `routes/shipments.js` | Total weight repeats the items | Carrier partner routes re-implement dispatch and are broken (C-002); nothing reaches them |
| Invoice and credit memo | `Invoice`, `InvoiceLine` | `services/billing.js` only | `Invoice.paidAmount` repeats the sum of `Payment`; both are written in one serializable transaction; check: 0 outside seed rows. Total identity enforced by the database | No |
| Payment and refund | `Payment` | `services/billing.js` only | See invoice | No |
| Price | `Product.basePriceCwt` (list), customer pricing tables, `OrderOverride` | `routes/products.js`, pricing routes; each change writes an audit line | The price on an order line is a copy taken at entry: a historical order is never repriced by a later list change | No |
| Work order | `WorkOrder` | `routes/workOrders.js` | Yield is computed from output and input at completion | No |
| Job and its operations | `Job`, `DispatchJob`, `DispatchOperation` | `routes/jobs.js`, `routes/operationsRoutes.js`, dispatch routes | Job status follows its operations inside one locked transaction (Phase 2) | No |
| Heat and grade | `Heat`, `Grade` | `routes/heats.js`, `routes/grades.js` | A stock item's grade is copied from its heat at receipt; a remnant copies both from its parent. Check: 0 remnants disagree with their parent | No |
| Customer and credit | `Organization`, credit hold records | Customer routes, `lib/creditControl.js` | Open balance is computed from invoices when needed, not stored | No |
| User, role, branch | `User`, `UserLocation` | `routes/users.js` under `lib/userAdminRules.js` | None | No |
| History | `AuditLog` | Each route, in or beside its transaction | None | No |
| Repeat-request record | `RequestKey` (new) | `middleware/requestKeys.js` | Removed after 24 hours | No |
| Invoice and credit memo numbers | `DocumentCounter` (new): one row per series with the last number used | `services/billing.js` and the counter sale, inside the transaction that writes the invoice | Must equal the highest number on file; checked after every gate run | No |
| Stock correction | `MaterialMovement` of type ADJUST, COUNT or SCRAP, with an `AuditLog` line | `lib/stockChanges.js` only (`POST /api/inventory/adjust`) | The balance changes in the same transaction | No |
| Pieces made by a work order | `Coil` with `parentCoilId`, `WorkOrderOutput`, movements PROCESS (piece), CONSUME and SCRAP (source) | `lib/stockChanges.js` only | Pieces weigh the work order's output; source movements equal output plus scrap; both checked after every gate run | No |

## 2. Conflicting ownership

**The second stock list and the order hub (B-009, P1).** The inventory "units" screens and the order hub keep whole records as JSON in `AppSetting` and in `InventoryUnit`, `InventoryTransfer`, `InventoryAdjustment`, `IntakeOrder`. Nothing in order entry, receiving, shipping or billing reads or writes them, and they have no rule on any value. The owner decided (decision 1) that the stock items list and sales orders are the real ones.

Phase 3 audited these stores and did not migrate them. The reason is in the finding: the live contents cannot be seen from here, and turning records nobody has read into real orders and stock would be changing business data on a guess. The next step is a read-only export, which the owner runs.

**Nothing else has two writers that disagree.** The stock branch is stored twice (item and balance) and reservations are stored twice (balance and reservation rows); both pairs are changed together in one transaction and both are checked after every gate run.

## 3. Records with no owner in the code

Ninety-three tables hold no rows after every test in the gates has run, and 52 are not read or written by any server code (`database-inventory.md`, B-017). They are designs for modules that have not been built. They were not dropped: the owner has decided to build every module (decision 4), and the instruction for this phase forbids deleting tables because they look unused.

## 4. What is calculated and never stored

Available-to-promise, customer open balance, invoice ageing, dashboard totals and yield reports are computed from the tables above at the time of asking. No stored summary can drift, because none exists. The cost is that some of them read many rows; see `phase-03-query-performance.md`.

## 5. Rules for new code

1. Stock quantity changes only inside a transaction that also writes the movement.
2. A reservation takes the order row lock first (`SELECT … FOR UPDATE` on `Order`), then reads, then writes.
3. Money is written only through `services/billing.js`.
4. A numbered document is created only through `lib/numbering.js`; an invoice or credit memo takes its number only from `takeNumber` in `services/billing.js`, inside the transaction that writes it.
6. A stock quantity is corrected only through `lib/stockChanges.js`, never by writing the balance.
5. No new table may hold a copy of a quantity or an amount unless a database check or a gate check compares it with its source.
