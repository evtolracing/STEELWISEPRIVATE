# Phase 7: production costing

Updated 2026-11-15 after owner decision 9 ("use the recommended option"). Before that decision this document recorded that costing did not exist and that nothing had been changed.

## 1. The method the owner chose (findings L-026 and K-007)

Actual cost per item.

| Element | Rule now in the code | Where |
|---|---|---|
| Material cost at receipt | A receipt against a purchase order line records the item's cost per stocked unit from the line's price: per hundredweight divided by 100, per pound as it is, per ton divided by 2,000, for stock kept in pounds; "each" for stock kept in pieces | `lib/costing.js` `unitCostFromPrice`, `lib/receiving.js` |
| A price that cannot be related to the stocked unit (for example per foot for stock kept in pounds) | The item is received with no cost. No conversion is assumed | Same |
| A receipt with no purchase order | No cost. A figure typed on the receipt is ignored, as before | `qa/sim/phase6-inventory.mjs` |
| Pieces cut by a coil work order, and pieces received from a parent | Carry the parent's cost per unit (cost follows weight) | `lib/stockChanges.js`, `lib/receiving.js` |
| Labor | Hours clocked on the job's steps, multiplied by the rate on file for each step's kind of work center | `lib/costing.js` `jobCost` |
| The labor rate | Entered by the owner on the kinds-of-work-center screen. Set and seen only by managers, the inventory manager and buyers. Empty until entered | `routes/dispatchRoutes.js`, `lib/workCenterKindRules.js` |
| Overhead | None. None is on file and none was invented. The answer says so | `basis` in the job cost answer |
| Job cost | Material used by the job's completed coil work orders (output plus scrap, at the source's cost per pound) plus labor | `GET /api/jobs/:id/cost` |
| Something missing | The figure is left out, the total is marked "so far", and the answer names what is missing ("No labor rate is on file for Saw") | Same |
| Who sees job cost | Managers, the inventory manager and buyers. Everyone else gets 403 and the job screen shows no cost section | Same |

## 2. Evidence

- Group 6: "an item's cost is taken from its purchase order line when it is received, and the pieces cut from it carry the same cost per pound" and "a job's cost is the material its work orders used at actual cost plus the time on its steps at the rate the owner entered; there is no overhead".
- `qa/sim/phase6-inventory.mjs`: "receiving records the cost from the purchase order line" (hundredweight, pound, ton, and a per-foot price that is left without a cost).
- Unit tests in `src/backend/test/phase7Rules.test.js`: unit cost from price, hours of an entry, adding up, missing items.
- Mutation: cost at receipt, cost carried to pieces, the 403 on job cost, the hidden rate and the role that may set it were each removed in turn; group 6 failed each time.
- Browser: the job screen shows material, labor, total and the "no overhead" sentence (`qa/sim/ui-phase7.cjs`).

Every rate and price in these tests was typed by the test as the owner would type it. None is a default in the product.

## 3. What the owner still has to do

1. Apply database update 13.
2. Enter a labor rate for each kind of work center (Shop floor, "Kinds of work center"). Until then job cost shows material only and says labor is missing.

## 4. What is still not built

| Subject | State |
|---|---|
| Stock already on hand | Has no cost unless one was typed. Nothing was back-filled: that would be inventing cost |
| Landed cost (freight, duty) | Not worked out |
| Value on stock movements | None. Scrap, shortage and count variance have no amount (K-007, for Phase 8) |
| Average cost (`Inventory.avgCost`) | Still never written; the method chosen is actual cost |
| Overhead, machine rate separate from labor | None |
| Outside processing cost | Not built (L-027) |
| A cost or margin report across jobs | Not built. Cost is shown per job |
| Cost of goods on an invoice | Not built. Phase 8 |

L-026 and K-007 are therefore IN PROGRESS, not closed. Gate E "Material and cost integrity": material passes; cost passes for what is built (cost at receipt, cost to pieces, job cost) and is NOT ASSESSED for valuation and cost of goods.
