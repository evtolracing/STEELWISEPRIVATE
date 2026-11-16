# Phase 6: traceability and certificates audit

Date: 2026-11-15.

## 1. The chain

Mill heat, to the item received, to the pieces and remnants cut from it, to the order line it was reserved for, to the shipment and invoice. Phase 3 verified this chain; Phase 6 extended it at both ends and kept every link.

| Link | Record | Verified by |
|---|---|---|
| Supplier and purchase order to the item | `MaterialMovement.orderId` and the new `orderLineId` on the receipt; the purchase order screen lists the items received on each line | "a receipt against a placed line fills it part way, and the movement names the line" |
| Heat to item | `Coil.heatId`; a heat must be on file first | "metal is received only against a heat on file" |
| Item to piece or remnant | `Coil.parentCoilId`; heat, grade and owner inherited | "pieces made by a work order carry the heat, grade and owner", "a remnant entered against its parent keeps the heat"; database fact "pieces whose heat, grade or owner differs from the item they were cut from": 0 |
| Across a transfer | The item keeps its id, heat and parent; the transfer line and the TRANSFER movement name both branches and the people | "a remnant travels to another branch and keeps its parent and heat" |
| Shortage, damage, loss in transit | Transfer line condition and note; hold with the reason; ADJUST movement with reason TRANSFER_SHORT_DOWN | Transfer scenarios |
| Item to order, shipment, invoice | Reservation, SHIP movement with the shipment | Phase 3 and "shipping reserved stock" |
| Return to the item | RECEIVE movement with reason CUSTOMER_RETURN on the item it shipped from | Return scenarios |
| History on the screen | `GET /api/coils/:id/history` | "an item's history shows where it came from and what was cut from it" |

Nothing that carries traceability was removed. Heat and grade became optional only for form SUPPLY (gloves, blades), and a database check keeps them required for metal.

## 2. Certificates

A purchase order line can require a mill certificate. A receipt against it whose heat has no certificate document on file is received on a PENDING_TEST hold, off sale, until a manager or the inventory manager releases it. A piece inherits its parent's heat, so the same test applies to it.

Limits, stated plainly:

- The check is that a document is attached to the heat. Whether the document's chemistry and properties meet the grade is not read by the system.
- No heat in the QA data has a certificate attached. Whether live heats do is NOT VERIFIED.
- Sending certificates with a shipment was reviewed in Phase 3 and is unchanged.

## 3. Customer-owned material

An item whose owner is a customer can be reserved only for that customer (K-001). It can be transferred and processed; pieces keep the owner.

## 4. Gaps

| Gap | Finding |
|---|---|
| Steel Outlet remnants are not stock items, so a remnant sold there has no heat link | K-006 |
| Shelf goods carry an optional lot note, not a traced lot | By design for consumables (C-011) |
| Supplier quality records (inspection at receipt, nonconformance) | I-011, not built |
