# Phase 5: quality scorecard for sales operations

Scores are a judgement from the evidence named, not a measurement, on the scale of `quality-scorecard.md` (target 95). The whole-system scorecard is rebuilt by `qa/tools/excellence-docs.mjs`; the Phase 5 adjustments to the "Sales and customer operations" group are recorded in `phase-state.json`.

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Customer data | 82 | Create, duplicate, close and reopen (audited), divisions without loops, closed accounts refused in every channel: group 1 | No merge; live data quality unknown; six preference fields not applied (J-008) |
| CRM and request intake | 74 | Requests keep every requirement and their branch; pipeline figures corrected (J-004) | No activity, opportunity or follow-up records (not required, not invented); no inbound email |
| Product configuration | 85 | Requirements carried request to quote to order to work order, validated, unit tested (J-001, J-009) | No rules between fields (none given) |
| Pricing | 88 | 15 scenarios plus the 47-check cross-channel sweep; tax by rule 27 on every path | Discount and minimums undecided (J-008, S-020); quote lines priced by hand (S-027) |
| Quoting and conversion | 89 | 15 scenarios: versions, expiry, credit hold, races, lost answers, a database failure mid-acceptance, branch isolation | No approval rule beyond credit exists (not invented) |
| Sales orders and hand-off | 87 | 10 scenarios: empty orders, reserve to invoice with tax, partial shipments, stale edits, cancellation, intake branch and requirements | Order entry screen does not warn on a stale edit (G-020, Phase 9) |
| Counter (POS) | 86 | The prompt's 12 checks, all pass; Retail POS branch fixed (J-006); voids cancelled (G-009) | Card processor (D-033); shelf receiving by the piece and remnants (C-011, J-012: Phase 6); will-call samples (X-008) |
| Web shop | 80 | 10 scenarios; acceptance fixed (J-005, J-010); price notices to the buyer | No payment at checkout (H-013); promise dates invented in the browser (S-010, X-007) |
| Customer portal | 84 | Isolation in group 6 and the sweep (537 staff routes, 31 division checks) | Tablet layout not checked; no statements or online payment |
| Sales UX efficiency | 72 | 10 screen changes that remove retyping or wrong choices; 14 browser checks | Major redesign is Phase 9; J-013, G-020 |
| Performance at 80 branches | see `phase-05-regression-results.md` §3 | Sales screens timed on the 85-branch copy with 18,000 extra requests and quotes | Local machine, not the host |

## Gates (§29)

| Gate | Result | Basis |
|---|---|---|
| A. Customer data integrity | PASS with stated limits | Group 1; J-002, J-003 fixed; merge NOT APPLICABLE |
| B. Product configuration and pricing correctness | PASS with stated limits | Group 2 and the price sweep; open business decisions J-008, S-020, S-027 stated |
| C. Quote and approval integrity | PASS | Group 3; no approval rule beyond credit exists, none invented |
| D. Order and fulfilment hand-off | PASS | Group 4; final reconciliation 0 |
| E. POS integrity | PASS with stated limits | Group 5, all 12 prompt checks; no card processor |
| F. Ecommerce and portal integrity | PARTIAL | Group 6 passes; payment at checkout NOT APPLICABLE until H-013 is answered |
| G. Security and isolation | PASS | Group 7, the sweep, branch boundary, browser checks |
| H. Regression | see `phase-05-regression-results.md` | Every earlier suite on the final code |
