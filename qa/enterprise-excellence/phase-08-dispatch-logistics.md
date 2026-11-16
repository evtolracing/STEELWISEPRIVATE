# Phase 8: staging, shipment creation, partial shipments, dispatch

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## Shipment states

PENDING or LOADING (on the dock) → IN_TRANSIT (dispatched) → DELIVERED. From IN_TRANSIT a shipment can be marked EXCEPTION (a problem, with a reason), and from there go back on the road or be delivered. A shipment on the dock can be CANCELLED; one that has left cannot. The table of moves is fixed in one place and verified move by move.

## Dispatch is one step

Stock out, order line shipped quantity, order status, the partner event and the history line are one database save. The invoice follows at once; if it cannot be raised, the shipment has still left, the screen says so, and the shipment is listed under "Needs action" on the Integrations screen until it is billed, once.

Verified under load: five people dispatching the same shipment (it leaves once); two shipments drawing on one stock item at the same moment (both leave, the stock is exact); six shipments at once (six invoices, numbers in sequence, no gap; this found N-022); a dropped connection (done in full or not at all, and safe to try again); the same request sent twice with one key (carried out once).

## Partial shipments and back orders

- A shipment may carry part of a line. The rest stays on the order as a back order, visible on the order, on the packing list ("still to ship") and on the new Orders Not Closed list.
- The stock reserved for the rest stays reserved.
- A later shipment ships the rest, and the order completes. An order split over three shipments ships exactly once in total.
- More than is left, or two dock shipments that together exceed the line, are refused with the figures.
- Tax and freight follow the parts: see `phase-08-invoicing-review.md`.

## Shipping from the shop floor and from staging

A finished job can be shipped from the shop-floor screen or the staging screen. Both now make a real shipment through the same code as the Shipping screen (stock, order, invoice), refuse a job whose line is already on a dock shipment, and leave nothing behind when they are refused.

## Corrected this phase

N-001 (stock at another branch), N-002 (cross-branch shipping), N-003 (problem needs a reason), N-005 (closed account), N-006 (order cancel cancels dock shipments), N-022 (overlap retry), N-029 (a cancel and a dispatch of the same order at the same instant answered a server error to one of the two users; no record was wrong; the one who loses is now told plainly). Each has a scenario that fails without it; for N-029 that is the recognition of the deadlock, and the limit of the proof is stated in `phase-08-regression-results.md` section 1.

## Not built

Route planning, load building, dock scheduling, driver assignment and truck capacity. The seven screens that appear to do these are samples with invented data and say so (N-026, U-035). A rule for a load that is lost or destroyed (N-027).
