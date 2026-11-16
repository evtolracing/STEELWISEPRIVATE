# Phase 8: what may ship

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

Every rule below is checked on the server at the moment of dispatch, inside the same save that moves the stock. Each has a scenario in `qa/sim/phase8-fulfillment.mjs` (group "Finished goods release, picking and packaging" unless noted) and was removed once to prove the scenario fails.

| Rule | Refusal | Since |
|---|---|---|
| The order is confirmed or partly shipped | 409, names the order's state | Phase 2 |
| The order is not on hold | 409 | Phase 2 |
| The line is not cancelled and has quantity left | 409 with the figures | Phase 2 |
| Two shipments together cannot carry more than the line | 409 | Phase 3 |
| The job that makes the material is finished and passed inspection | 409 | Phase 7 |
| The stock reserved for the line is not on hold or failed | 409, names the item | Phase 6 |
| The stock is not in transit between branches | 409 | Phase 6 |
| The shipment does not carry more than is reserved | 409; flagged on the pick list before anyone loads | Phase 3, shown in Phase 8 |
| **The reserved stock stands at the dock the shipment leaves from** (N-001) | 409, names the item and where it is | Phase 8 |
| **The customer's account is not closed** (N-005) | 409 | Phase 8 |
| **Only the dock it leaves from changes a shipment** (N-002) | 403 | Phase 8 |
| A shipment with nothing on it cannot leave | 409 | Phase 2 |

## Across branches

Phase 7 confirmed that an order may be sold at one branch and made at another. Phase 8 makes shipping follow that:

- The branch that holds the reserved stock, or made the job, may open the shipment and dispatch it, even though another branch sold the order.
- A branch that holds nothing for the order cannot find it (404).
- The selling branch sees the shipment and its papers. It cannot change them.
- The invoice belongs to the order, so the selling branch bills. Tax follows the selling branch (owner decision 7).

## Not decided, not built

Credit hold at dispatch: an order over its credit limit already waits for a manager at confirmation (Phase 5). Nothing checks credit again at dispatch, and none was added: whether a late payer's confirmed orders should stop at the dock is the owner's rule.
