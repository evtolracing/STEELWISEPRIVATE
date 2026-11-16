# Phase 6: inventory valuation

Date: 2026-11-15. **No costing or accounting rule was changed in this phase.** The instruction forbids it without authorisation, so this document reports what exists and what the owner needs to decide.

## 1. What exists

| Field | Written by | State |
|---|---|---|
| `Coil.unitCost`, `Coil.landedCost` | A manager editing the item | 2,408 of 100,233 items on the 85-branch QA copy |
| `Inventory.unitCost`, `landedCost` | The scale script and edits | Filled on the QA copy by the generator; not written by receiving |
| `Inventory.avgCost` | Nothing | Empty on every row |
| Value on a movement | Nothing | No movement carries an amount |
| Purchase order line price | The buyer | Saved; not carried to the item at receipt |

Who sees cost is already controlled (Phase 2): managers, the inventory manager and buyers. Everyone else sees list price only. Unchanged and re-verified by the sweep.

## 2. What follows from that (finding K-007, P1)

- A receipt creates stock with no cost, even against a priced purchase order line. A cost sent in the receipt request is ignored (scenario "receiving does not create a cost").
- Inventory value by branch, the cost of scrap, of a transfer shortage, of a count variance and of goods sold cannot be reported from the records.
- Margin on an order is list price against a cost that is usually absent.
- Value in transit between branches cannot be stated.

## 3. Quantities are sound; value is not there

Everything a valuation would rest on was verified in this phase by quantity: every item's history adds up to its balance, receipts tie to purchase order lines, pieces tie to their parents, transfers conserve stock, and corrections carry a person and a note. Putting an amount on each of those movements is mechanical once the method is chosen.

## 4. The decision needed

| Question | Options | Recommendation |
|---|---|---|
| Costing method | Actual cost per item; moving average per grade and branch; standard cost | Actual cost per item. Steel is bought, traced and sold by the item and the heat, and the records already keep every item separate |
| Cost at receipt | The purchase order line price; typed at receipt; added later from the supplier's invoice | The purchase order line price at receipt, corrected when the invoice is matched (K-012) |
| Landed cost | Freight spread by weight | By weight across the receipt |
| Pieces and remnants | Inherit by weight; remnant written down by a rule | Inherit by weight; a write-down rule only if the owner wants one (S-009) |
| Scrap | Written off at cost; recovered at a scrap price | The owner's |

No part of this was built. It is recorded as REQUIRES BUSINESS DECISION and carried to the handoff.
