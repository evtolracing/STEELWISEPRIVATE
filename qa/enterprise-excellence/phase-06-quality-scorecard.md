# Phase 6: quality scorecard for inventory, purchasing and warehouse operations

Scores are a judgement from the evidence named, not a measurement, on the scale of `quality-scorecard.md` (target 95). The whole-system scorecard is rebuilt by `qa/tools/excellence-docs.mjs`; the Phase 6 adjustments to the "Inventory and purchasing" group are recorded in `phase-state.json`.

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Material master data | 78 | `phase-06-material-master-audit.md`; heat and grade required by the database for every form except shelf goods; one unit per balance | QA data only: 97,223 of 100,233 scale items carry no product, no heat has a certificate attached; live master data NOT VERIFIED |
| Purchasing | 80 | 16 scenarios: write, place, part and full receipt, over-receipt held, close, cancel, roles, branches (I-007, K-002) | No approval rule and no tolerance on file (K-011); supplier invoices not matched (K-012) |
| Replenishment | 60 | Supply position per branch and grade, checked against the records in the scenarios | No reorder points, lead times or safety stock on file; nothing is suggested or ordered automatically (K-010) |
| Receiving and putaway | 86 | 15 scenarios: against a line, mismatch held with every reason, duplicate refused, heat on file, certificate hold, shelf goods by the piece (C-011) | Bins are free text (K-009); scanners not tested (K-013) |
| Reservations and allocation | 92 | 15 scenarios: unit, grade, size, thickness tolerance, owner and in-transit refusals (K-001); races; ship only what is reserved | No automatic allocation rule (none on file, not invented) |
| Traceability and certificates | 88 | `phase-06-traceability-audit.md`; pieces inherit heat, grade and owner (database fact 0); a transfer keeps identity | The system checks that a certificate is attached, not what it says; outlet remnants have no heat link (K-006) |
| Remnants and scrap | 84 | The ten remnant tests; scrap by four paths, each a movement with a person | No valuation or minimum-size rule (K-007, S-009); the outlet list is separate (K-006) |
| Interbranch transfers | 93 | 17 scenarios plus six under concurrency; seven reconciliation facts at 0 (G-007) | No request and approval step, no freight or transfer price (no rule on file); list row does not say in transit (K-014) |
| Returns, counts and corrections | 82 | 10 scenarios: unit and INSPECT fixed (K-004), scrapped return ledger (K-003), corrections with reason, note and person | No cycle count program (K-008) |
| Inventory valuation | 35 | `phase-06-inventory-valuation.md` states what exists | No cost at receipt and no method chosen (K-007). Not changed: costing rules need the owner's authorisation |
| Warehouse UX efficiency | 76 | 14 browser checks; receive from the order line; one screen to receive a transfer | Scanner-first flows, keyboard pass and the list badge are later (K-013, K-014, Phase 9) |
| Performance at 85 branches | see `phase-06-regression-results.md` §3 | Stock, receipts, transfers, purchase orders and supply position timed on 100,233 items | Local machine, not the host |

## Gates (§29)

| Gate | Result | Basis |
|---|---|---|
| A. Material master data | PASS with stated limits | Master data audit; unit, grade and size rules enforced at reservation and receipt. Live master data NOT VERIFIED |
| B. Purchasing and receiving | PASS with stated limits | Groups 1 and 2; duplicate receipts refused; discrepancies held; the certificate requirement on a line is enforced. Tolerance and approval are the owner's (K-011) |
| C. Inventory balances | PASS | Balance identity including in transit, reservations, consumption and the ledger at 0 after every group and after the full suite (`qa/tools/db-facts.mjs`) |
| D. Traceability | PASS with stated limits | Traceability audit. Certificate content is not read; outlet remnants excluded (K-006) |
| E. Remnants and scrap | PARTIAL | Quantities, parents and scrap movements reconcile. "Cost treatment follows documented policy" cannot be met: no policy exists (K-007) |
| F. Transfers | PASS | Group 5 and the reconciliation table in `phase-06-transfer-reconciliation.md` |
| G. Security and concurrency | PASS | Group 7 (17 scenarios, including the hold deadlock K-015), the security sweep and the branch boundary suite |
| H. Operational efficiency | PASS with stated limits | `phase-06-ux-efficiency.md`. No time saving is claimed: none was measured with users. Hardware NOT VERIFIED |
| I. Regression | see `phase-06-regression-results.md` | Every earlier suite on the final code; 105 scenarios. One P1 stays open as a business decision (K-007) |
