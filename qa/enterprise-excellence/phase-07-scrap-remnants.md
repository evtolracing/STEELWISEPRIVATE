# Phase 7: scrap, remnants, material consumption and yield

Evidence: group 2 (15 verified) and group 6 (11 verified, 5 NOT APPLICABLE). No scrap accounting, remnant valuation or costing rule was changed in this phase. The stock rules are those of Phase 3 and Phase 6; Phase 7 tested them from the production side and added the checks in section 3.

## 1. Consumption (coil work orders)

| Property | Scenario |
|---|---|
| A work order for an order line cuts the stock reserved for that line; the books balance | Group 2 |
| It cannot cut stock reserved for another order, or for a different line | Group 2 |
| Two work orders on one item cannot together use more than it holds; completed at the same moment, stock is used once | Group 2 |
| More cannot come off the line than went on | Group 2 |
| Pieces carry the heat, grade and owner of the source | Group 2 |
| Part use leaves the rest available | Group 2 |
| Cannot be completed twice | Group 2 |
| A completion with one bad piece saves no piece and moves no stock | Group 7 |

## 2. Scrap, yield and drops

| Property | Scenario |
|---|---|
| Scrap reported on a work order is written to the stock history with the person; yield is worked out from the weights | Group 6 |
| A run that is all scrap makes no pieces and still balances | Group 6 |
| Weight neither made nor scrapped stays on the source | Group 6 |
| A drop keeps the heat and its parent; weights add up; it cannot weigh more than what is free on the parent | Group 6 |
| A made piece can be cut again; the trail leads back to the original item and heat | Group 6 |
| Scrapping a made piece needs a reason and is done by inventory staff | Group 6 |
| A cancelled work order leaves stock as it was | Group 6 |
| Completion racing a hand scrap on the same item: the balance adds up | Group 6 |

Yield is a calculation from recorded weights. No yield assumption or standard was added.

## 3. Checks added this phase (finding L-013)

- Material in transit to another branch cannot be put on a work order (found by a group 7 scenario; 409). Once received, the receiving branch cuts it and the pieces are at that branch.
- Failed or held material cannot be put on a work order.
- A grade different from the order line needs a recorded substitution reason.

## 4. Gaps

- A job consumes nothing itself. Since owner decision 9 a coil work order raised for the job ties its scrap and yield to the job (L-024); one raised without a job does not.
- Nesting and cut optimisation: not built (L-027, NOT APPLICABLE in group 6).
- Remnant and scrap value: since owner decision 9 a piece or remnant cut by a work order carries its source's cost per pound (group 6, checked). Scrap is given no value, and no movement carries an amount (K-007).
- Outlet remnants have no heat link (K-006, Phase 6, still the owner's question).
