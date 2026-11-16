# Phase 8: customer order closeout

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## The gap (N-018)

An order became COMPLETE when its last line shipped. Nothing said whether it had been delivered, invoiced or paid, or whether a return, a credit, a job or reserved stock was still open on it.

## What was built

A closeout position, read from the records each time. Nothing is stored and no order status was added or changed, so there is nothing to drift out of step. The rule is one pure function, `closeoutPosition` in `lib/orderCloseout.js`, with nine unit tests.

An order is **closed** when none of these is open:

| Open item | Meaning |
|---|---|
| Not confirmed | Still a draft or pending |
| On hold | |
| Still to ship | Quantity ordered and not shipped (the back order) |
| On the dock | A shipment built and not dispatched |
| On the road | A shipment dispatched and not delivered |
| Shipment problem | A shipment in "problem" |
| Shipped, not invoiced | |
| Unpaid | A balance over half a cent on its invoices |
| Credit owed back | A credit memo not yet refunded |
| Return open | A return waiting to be received |
| Credit not issued | A return received without its credit (N-016) |
| Job open | A job for the order not finished |
| Stock still reserved | Also on a cancelled order |

A delivery with no proof on file, recorded before proof was required, is a note and not an open item. A cancelled order is closed only when nothing is left standing on it. A closed order opens again when something comes back.

## Where it shows

- **Order screen**: a Closeout panel listing what is open, each with its figure, and for cost viewers the order's cost and margin.
- **Orders Not Closed** (new, Orders menu): every order that is not closed, oldest first, with what each is waiting for, filtered by reason and by order number, paged, held to the reader's branches. At 85 branches and 72,565 orders the first page answered in 133 to 206 ms on the local machine.

## Verified

`qa/sim/phase8-fulfillment.mjs`: "a new order shows what stands between it and closed", "an order closes only when it is shipped, delivered, invoiced and paid", "a closed order opens again when something comes back", "an open job, a hold and a cancelled order each show for what they are", "a delivery recorded before proof was required is noted and does not hold the order open", "the list of orders not closed is paged, oldest first, and agrees with each order's own closeout", "closeout is kept to the reader's branches". Browser checks on the panel and the list.

## Not done

Nothing closes an order automatically or archives it, and no "closed" date is stored. Whether a closed order should lock (no further returns after a number of days, for example) is the owner's rule.
