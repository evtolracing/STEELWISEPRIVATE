# Phase 3: inventory reconciliation

How stock is kept, whether the books agree with themselves, and where the model stops. Everything was run in this session on the local QA database. No quantity was changed to make a total agree; the two defects found were fixed in the code and the scenarios run again.

## 1. The model as built

- A **stock item** (`Coil`) is one physical piece: a coil, plate, bar or shelf product at one branch, with its heat, grade and dimensions.
- Its **balance** (`Inventory`, one row per item) holds four quantities: on hand, available, reserved and on hold. The database refuses a row where on hand is not the sum of the other three, or where any is negative.
- Each physical change writes a **movement** (`MaterialMovement`) in the same transaction as the balance: receive, ship, transfer, counter sale, customer return.
- A **reservation** (`OrderLineAllocation`) ties quantity on one item to one order line. It moves quantity from available to reserved and writes no movement, because nothing has moved.
- Quantities are stored as exact decimals. Since G-001 a weight of 1234.5678 lb is stored as exactly that.

## 2. Reconciliation checks

`qa/tools/db-facts.mjs` runs read-only after the simulation and again after the Phase 3 scenarios, in every gate run. Each number is how many rows break the rule.

| Check | After three simulation seeds | After the Phase 3 scenarios |
|---|---:|---:|
| On hand = available + reserved + on hold | 0 | 0 |
| Any quantity below zero | 0 | 0 |
| Reserved quantity differs from the reservations on file for the item | 0 | 0 |
| Reservations on items that have no balance row | 0 | 0 |
| Order line reserved more than is left to ship | 0 | 0 |
| Reservations left on cancelled or completed orders | 0 | 0 |
| Received items whose on hand differs from receipts minus shipments in the ledger | 0 | 0 |
| Item and its balance row disagree about the branch | 0 | 0 |
| Transfers with the same branch at both ends, or one missing | 0 | 0 |
| Last transfer of an item did not end where the item now is | 0 | 0 |
| Shipped movements with no shipment (counter sales excluded) | 0 | 0 |
| Remnants whose heat differs from their parent's | 0 | 0 |
| Order lines shipped more than ordered | 0 | 0 |
| Order line shipped quantity differs from its dispatched shipment items, outside the demo seed | 0 | 0 |

The simulation's own reconciliation (every item and order after each seed) also reports 0 problems on all three seeds.

Inside the scenarios, a helper (`books`) checks four things for each item touched: the balance identity, reserved against reservation rows, on hand against the ledger, and item branch against balance branch. It is called after every operation that changes stock.

## 3. What the scenarios proved

Detail of every scenario and check is in `phase-03-regression-results.md`. In summary:

| Area | Proven against the database |
|---|---|
| Receiving | Item, balance and movement are saved together or not at all. A duplicate item number, an unknown heat, a negative or zero quantity, and a receipt at a branch the item is not at each change nothing. An upload with one bad row saves the good rows and reports the bad one. A branch-held login cannot receive into another branch |
| Exactness | 1234.5678 lb, 0.1875 in and 36.125 in are stored digit for digit in the item, the balance and the movement |
| Holds | A hold moves available to on hold; a release moves it back; a second hold is refused; the identity holds at each step |
| Reservations | Reserve, over-reserve against stock (refused), over-reserve against the line (refused), cancel (all returned), reserve on a cancelled order (refused), reserve stock on hold (refused) |
| Shipping | Reserved stock leaves the shelf at dispatch with one movement tied to the order and shipment. A part shipment leaves the rest reserved. A dispatch that hits a hold on one of two lines saves nothing for either |
| Transfers | The whole item moves, with one movement; the sending branch falls and the receiving branch rises by exactly the quantity; the company total does not change. A reserved item keeps its reservation when moved and ships from the new branch |
| Returns | A return received four times at once is counted once |
| The database's own rules | A negative balance, a broken identity, a zero movement and a negative weight written directly are each refused |

## 4. Defects found and corrected

| Finding | What happened | Evidence before | After |
|---|---|---|---|
| G-004 | One order line needing 1000 lb, reserved 700 lb from two items at the same moment, ended with 1400 lb reserved | 6 of 6 rounds | 0 of 6 |
| G-004 | An order cancelled at the same moment as a reservation kept the reservation for ever | 6 of 6 rounds | 0 of 6 |
| G-001 | Weights passed as ordinary numbers were stored with stray digits | 12 columns affected | 0 |

Before-fix results are kept in `qa/results/phase3-db-before-fixes.json`.

One change was made and then withdrawn. The first reading of the transfer code was that moving an item with stock reserved on it was a defect, and a refusal was added. The existing simulation showed otherwise: reserving at one branch and transferring to the branch that ships is an established workflow (cross-location fulfilment), and the reservation travels correctly with the item. The refusal was removed and the behaviour is now tested instead.

## 5. Where the model stops

These are not reconciliation failures. They are things the books cannot say because the function does not exist or the rule has not been given. None was papered over.

| Gap | Evidence | Finding | Status |
|---|---|---|---|
| A shipment with no reservation records no stock item, no heat, and reduces no balance | Scenario: 300 lb dispatched and invoiced with nothing reserved; no movement written | G-019 (P1) | REQUIRES BUSINESS DECISION |
| Completing a work order moves no stock | Scenario: 1900 lb out and 100 lb scrap recorded; the item still shows 2000 lb | M-016 | REQUIRES BUSINESS DECISION |
| A remnant does not reduce its parent | Scenario: a 51.25 lb remnant leaves its 6000 lb parent at 6000 lb | G-006 | REQUIRES BUSINESS DECISION |
| Several work orders can name the same item as their whole input | Scenario: two at once, both accepted | G-008 | REQUIRES BUSINESS DECISION |
| No stock adjustment, cycle count or scrap write-off on the real stock list | No route exists | I-016 | REQUIRES BUSINESS DECISION |
| A transfer has no in-transit stage or receipt | Nine transfer scenarios; partial receipt, shortage, damage, loss and duplicate receipt cannot occur and were NOT EXECUTED | G-007 | DEFERRED to the inventory module |
| Shelf goods cannot be received by the piece | Heat and grade are required on every item | C-011 | DEFERRED to the inventory module |
| The second stock list is not connected | See `phase-03-data-ownership.md` | B-009 (P1) | DEFERRED to the inventory module |
| Stock that existed before the system has no opening movement | Seed and fixture items | B-022 | The ledger check covers items received through the system only |
| Cost (unit, landed, average) | The columns exist; no code maintains them | I-series | Not in scope of any decision yet |

## 6. Units and weight

- Every balance in the order-to-cash flow is in pounds, except shelf products counted each.
- Price units (per pound, per hundredweight, per ton, each) are converted in one function in `routes/orders.js` and one in `lib/quoteRules.js`; a quote of 1250 lb at 47.35 per hundredweight is 591.88 on the quote and on the order made from it (scenario).
- Theoretical weight from dimensions and density is not computed by the server; weight is entered at receipt. No rule exists for tolerance between theoretical and actual weight.
- Kilograms, metres and other units are not supported and nothing converts to them.

## 7. Historical data

The checks above describe test data. The live database may hold rows written before the rules existed: balances with stray digits, reservations on cancelled orders, lines reserved beyond their need. The SQL Editor files change no quantities. To find such rows, the owner can run `qa/tools/db-facts.mjs` read-only against a restored copy; a repair plan would follow from what it reports and needs the owner's approval before any row is changed.
