# Phase 6: reservations and allocation

Date: 2026-11-15. Group "Reservations, allocation and picking": 15 scenarios, all pass.

## 1. The defect found (K-001, P1)

A reservation checked the quantity and the branch and nothing else. On the QA database, before the change:

- A line for 3 pieces reserved "3" from an item counted in pounds. Shipping it took 3 lb off the balance.
- A line for one grade reserved stock of another grade.
- A line 135 inches long reserved a 96 inch plate. The order simulation had been doing this silently: on its first run against the new rule 17 of 50 jobs in one seed were refused for it.
- Material owned by one customer could be reserved for another customer's order.

## 2. The rule now (`lib/reservationRules.js`)

A reservation is refused with 409, a code and a sentence when:

| Code | When |
|---|---|
| IN_TRANSIT | The item is on its way to another branch |
| UNIT_MISMATCH | The line and the item are counted in different units (LB and LBS are one unit; EA, EACH, PC and PCS are one unit) |
| GRADE_MISMATCH | The line names a grade and the item is another |
| SIZE_MISMATCH | The item is narrower or shorter than the line needs, or its thickness is outside the tolerance the line gives. With no tolerance on the line, thickness is not compared |
| OWNER_MISMATCH | The item belongs to a customer other than the buyer |

Unchanged and re-verified: no more than is free; no more than the line still needs; not on hold; not another branch's stock; two reservations racing for the last of an item, one wins.

## 3. Through the rest of the flow

| Scenario | Result |
|---|---|
| Shipping reserved stock: SHIP movement, balance down, reservation used | PASS |
| Cancelling an order gives the stock back and leaves no reservation | PASS |
| A hold on a reserved item keeps the reservation, holds the rest, and stops the shipment until released | PASS |
| A reserved item sent to another branch keeps its reservation and ships from there | PASS |
| A work order for the line moves the reservation onto the pieces | PASS |
| A remnant can be reserved for a line it fits | PASS |

## 4. What was not decided here

Automatic allocation (first in first out, oldest heat first, nearest branch) does not exist: a person picks the item. Which rule to apply is the owner's and none was invented. Picking lists and pick confirmation by scan are not built; shipping takes the reserved stock at dispatch.
