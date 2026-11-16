# Phase 8: delivery confirmation, proof of delivery and exceptions

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## Proof of delivery (N-004)

A delivery is recorded with one of:

1. the name of the person who received it,
2. the address of a proof image, or
3. a written reason why there is neither (for example "left at the gate as the customer asked").

A carrier's own system reporting delivery counts as 3, with a fixed reason that says so. Nothing is filled in by the product. A shipment is delivered once, and never before it has left. Three reports at the same moment record one delivery.

The delivery, the receiver or the reason, the time and the user who recorded it appear on the shipment, in its history and on the packing list printed afterwards.

Deliveries recorded before this rule keep what they have. The order closeout notes them ("delivered with no proof on file") and does not hold the order open for them.

Not built: a signature drawn on a screen, a photo taken in the product (an image address can be stored; nothing uploads one from a phone), GPS or time-window checks.

## Exceptions (N-003)

A problem on the road is recorded with what happened. The shipment can then go back on the road, without shipping or billing a second time, or be delivered. It cannot be cancelled or put back on the dock, because the stock has left and the invoice exists.

Since owner decision 10 (2026-11-15) a manager can end a shipment that has a problem as lost, destroyed or refused for good (N-027): the kind and what happened are required, and what is left on its invoice is credited in the same save. Stock is not moved a second time. Detail in `phase-08-owner-decision-10.md`.

## Verified

`qa/sim/phase8-fulfillment.mjs` group "Dispatch, carriers, freight and delivery": "a delivery is recorded with the name of the person who received it", "a delivery with no name and no reason is refused (N-004)", "proof of delivery text and image address are checked", "a shipment is delivered once, and never before it has left", "a problem on the road is recorded with what happened (N-003)", "a shipment with a problem goes back on the road without shipping or billing twice", "a delivery reported three times at once is recorded once". Browser: `qa/sim/ui-phase8.cjs`, and the older `ui-shipping.cjs` updated to the new field.
