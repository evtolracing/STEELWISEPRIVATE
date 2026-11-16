# Phase 7: quality scorecard for manufacturing execution

Scores are a judgement from the evidence named, not a measurement, on the scale of `quality-scorecard.md` (target 95). A subject with no evidence is NOT ASSESSED and gets no number. The whole-system scorecard is rebuilt by `qa/tools/excellence-docs.mjs`; the Phase 7 adjustments to the "Manufacturing and processing" group are recorded in `phase-state.json`.

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Work order integrity | 91 | Group 1 (15 scenarios) and group 7; one function for every job move; database checks at 0 (L-001, L-006, L-012); a coil work order can be raised for a job (L-024, decision 9) | No bill of material; thickness "not stated" stored as 0 (L-029) |
| Routing integrity | 84 | Routing life cycle, validation, versioning (L-011); nothing assumed (L-010) | Processing recipe writes untested; live routings NOT VERIFIED |
| Bill of material and material requirements | NOT ASSESSED | Not built (L-024) | |
| Work-center master data | 82 | Validation at both addresses, no change under open work, lockout (L-015, L-016) | No screen sets hours per day; live machine limits NOT VERIFIED |
| Scheduling | 80 | 21 scenarios; pure decision function with unit tests; branch lock; 1.9 s at 7,090 jobs (L-007, L-008) | Not finite-capacity: no calendar, absence or running work (L-025) |
| Shop-floor execution | 91 | 22 scenarios, five races, the planned-order rule (owner decision 8), branch isolation, certification and two-steps rules by kind of work center (L-004, L-005, L-018, L-019, L-022) | Live work-center marks NOT VERIFIED |
| Labor tracking | 85 | Clock entries reconcile with steps and jobs; six database checks at 0; long-running clocks listed; rework time recorded | No shift length, break or overtime rule (L-025) |
| Machine tracking | NOT ASSESSED | No machine is connected; no hardware (L-030) | |
| Quality control | 90 | 22 scenarios; the gate on every job move; decisions audited against the signed-in user; every job inspected unless its routing says no (L-001, L-002, L-003, L-021) | The checklists are the owner's to enter (L-028); no sampling or calibration |
| Nonconformance and corrective action | NOT ASSESSED | Not built (L-023) | |
| Rework | 85 | A rework step per failed inspection, clocked, on the kind of work center quality names; compulsory re-inspection; a race of two senders leaves one step (L-020, decision 9) | No rework count or rework cost report |
| Material consumption, scrap and remnants | 90 | Groups 2 and 6 on the Phase 3 and 6 stock rules; in-transit, held and failed material refused (L-013); used, made, scrap and yield per job (L-024) | Work orders raised without a job are not tied to one |
| Production costing | 70 | Decision 9: cost at receipt from the purchase order line, carried to pieces, job cost from material and labor, hidden from the floor; unit tests, 2 scenarios, 5 mutations (L-026, K-007) | No rates on file yet; stock on hand uncosted; no overhead, valuation, movement value or cost of goods |
| Outsourced processing | NOT ASSESSED | Not built (L-027) | |
| Production reporting | 80 | Every figure counted from records; lists capped with totals (L-009, L-017) | No equipment, cost or calendar figures |
| Security and branch isolation | 90 | Group 7, the security sweep, the branch boundary suite; 334 changing routes, 0 with no rule | Live roles and users NOT VERIFIED |
| Shop-floor UX | 76 | 39 browser checks including phone width and the screens of decision 9; plain refusal sentences | No real user timed; accessibility pass deferred to Phase 9 |
| Performance at 85 branches | see `phase-07-regression-results.md` section 3 | 25 timings on about 9,300 plans and 18,600 steps | Local machine, not the host; planner preview answer is 1.2 MB |

## The Phase 7 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Work order integrity | PASS | Group 1; group 7 end-to-end trace; database checks at 0; a job and its coil work orders are linked (L-024, decision 9) |
| B. Routing and BOM integrity | PARTIAL | Routing: pass (L-011). Bill of material: not built, so that half cannot be met (L-024) |
| C. Scheduling and capacity | PARTIAL | Scheduling: pass, idempotent, branch-locked, nothing invented. Capacity against a calendar: not built (L-025) |
| D. Shop-floor execution | PASS | Group 4, group 7 races and recovery, `phase2-integrity` |
| E. Material and cost integrity | PARTIAL | Material: pass (groups 2 and 6, stock balance checks at 0). Cost: pass for what decision 9 built (cost at receipt, to pieces, per job). Stock valuation and cost of goods: not built, NOT ASSESSED (K-007) |
| F. Quality control | PASS with stated limits | Group 5. Limits: the checklists are the owner's to enter (L-028), no nonconformance record (L-023) |
| G. Security and location isolation | PASS | Group 7; sweep 20 of 20; branch boundary 39 of 39; 0 changing routes with no rule |
| H. Operational efficiency | PASS with stated limits | Timings in the regression results; scheduling 45 s to 1.9 s. No minutes-saved figure: no real users |
| I. Regression | PASS | 141 scenarios run: 130 verified (125 required), 11 NOT APPLICABLE with evidence. No unresolved confirmed P0 or P1 Phase 7 defect in built code. The full run on the final code, after decision 9, is recorded in `phase-07-regression-results.md` |

## The directive's gates A to J

| Gate | Result | Basis |
|---|---|---|
| A. Requirements understood | PASS | `phase-07-manufacturing-inventory.md` maps every capability in the prompt to code or to a finding |
| B. Implementation complete | PARTIAL | 26 defects corrected; the six owner decisions built. Five capabilities are not built and were not invented (L-023, L-025, L-027, L-030, bill of material); costing stops at job cost |
| C. Automated checks | PASS | 178 unit tests; 141 scenarios; 39 browser checks; every fix and every decision rule has a check that fails without it (34 mutations) |
| D. Regression | PASS | Full run on a rebuilt database, final code |
| E. Data integrity | PASS | Database checks at 0 after the full run, including 16 added this phase |
| F. Security | PASS | As gate G above |
| G. Performance | PASS with stated limits | 85-branch timings; local machine only |
| H. Usability and accessibility | PARTIAL | Browser checks pass; accessibility NOT ASSESSED |
| I. Documentation | PASS | The 16 Phase 7 documents and the updated registers |
| J. Production readiness | CONDITIONAL | See `phase-07-report.md`: SQL files 6 to 12 not confirmed on live; file 13 not applied; live data NOT VERIFIED; labor rates and checklists not entered |

Readiness decision: **CONDITIONAL**.
