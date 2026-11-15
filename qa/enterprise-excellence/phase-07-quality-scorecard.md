# Phase 7: quality scorecard for manufacturing execution

Scores are a judgement from the evidence named, not a measurement, on the scale of `quality-scorecard.md` (target 95). A subject with no evidence is NOT ASSESSED and gets no number. The whole-system scorecard is rebuilt by `qa/tools/excellence-docs.mjs`; the Phase 7 adjustments to the "Manufacturing and processing" group are recorded in `phase-state.json`.

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Work order integrity | 88 | Group 1 (15 scenarios) and group 7; one function for every job move; database checks at 0 (L-001, L-006, L-012) | A job names no stock (L-024); thickness "not stated" stored as 0 (L-029) |
| Routing integrity | 84 | Routing life cycle, validation, versioning (L-011); nothing assumed (L-010) | Processing recipe writes untested; live routings NOT VERIFIED |
| Bill of material and material requirements | NOT ASSESSED | Not built (L-024) | |
| Work-center master data | 82 | Validation at both addresses, no change under open work, lockout (L-015, L-016) | No screen sets hours per day; live machine limits NOT VERIFIED |
| Scheduling | 80 | 21 scenarios; pure decision function with unit tests; branch lock; 1.9 s at 7,090 jobs (L-007, L-008) | Not finite-capacity: no calendar, absence or running work (L-025) |
| Shop-floor execution | 90 | 19 scenarios, five races, the planned-order rule (owner decision 8), branch isolation (L-004, L-005, L-018, L-019) | Labor rules not on file (L-022) |
| Labor tracking | 82 | Clock entries reconcile with steps and jobs; six database checks at 0 | No shift length, break or overtime rule; no pay calculation (L-022, L-026) |
| Machine tracking | NOT ASSESSED | No machine is connected; no hardware (L-030) | |
| Quality control | 88 | 19 scenarios; the gate on every job move; decisions audited against the signed-in user (L-001, L-002, L-003) | No inspection standard on file (L-028); jobs with no steps skip inspection (L-021) |
| Nonconformance and corrective action | NOT ASSESSED | Not built (L-023) | |
| Rework | 55 | Send back, instructions, compulsory re-inspection verified | Not routed or clocked (L-020) |
| Material consumption, scrap and remnants | 88 | Groups 2 and 6 on the Phase 3 and 6 stock rules; in-transit, held and failed material refused (L-013) | Per coil work order only, not per job (L-024) |
| Production costing | NOT ASSESSED | Not built (L-026, K-007) | |
| Outsourced processing | NOT ASSESSED | Not built (L-027) | |
| Production reporting | 80 | Every figure counted from records; lists capped with totals (L-009, L-017) | No equipment, cost or calendar figures |
| Security and branch isolation | 90 | Group 7, the security sweep, the branch boundary suite; 334 changing routes, 0 with no rule | Live roles and users NOT VERIFIED |
| Shop-floor UX | 74 | 21 browser checks including phone width; plain refusal sentences | No real user timed; accessibility pass deferred to Phase 9 |
| Performance at 85 branches | see `phase-07-regression-results.md` section 3 | 25 timings on about 9,300 plans and 18,600 steps | Local machine, not the host; planner preview answer is 1.2 MB |

## The Phase 7 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Work order integrity | PASS with stated limits | Group 1; group 7 end-to-end trace; database checks at 0. Limit: job and coil work order are not linked (L-024) |
| B. Routing and BOM integrity | PARTIAL | Routing: pass (L-011). Bill of material: not built, so that half cannot be met (L-024) |
| C. Scheduling and capacity | PARTIAL | Scheduling: pass, idempotent, branch-locked, nothing invented. Capacity against a calendar: not built (L-025) |
| D. Shop-floor execution | PASS | Group 4, group 7 races and recovery, `phase2-integrity` |
| E. Material and cost integrity | PARTIAL | Material: pass (groups 2 and 6, stock balance checks at 0). Cost: not built and not assessed (L-026, K-007) |
| F. Quality control | PASS with stated limits | Group 5. Limits: no standard on file (L-028), jobs with no steps (L-021), no nonconformance record (L-023) |
| G. Security and location isolation | PASS | Group 7; sweep 20 of 20; branch boundary 39 of 39; 0 changing routes with no rule |
| H. Operational efficiency | PASS with stated limits | Timings in the regression results; scheduling 45 s to 1.9 s. No minutes-saved figure: no real users |
| I. Regression | PASS | 134 scenarios run (at least 125 required): 119 verified, 15 NOT APPLICABLE with evidence. No unresolved confirmed P0 or P1 Phase 7 defect in built code. The second full run on the final code is recorded in `phase-07-regression-results.md` |

## The directive's gates A to J

| Gate | Result | Basis |
|---|---|---|
| A. Requirements understood | PASS | `phase-07-manufacturing-inventory.md` maps every capability in the prompt to code or to a finding |
| B. Implementation complete | PARTIAL | 26 defects corrected. Seven capabilities are not built and were not invented (L-020, L-023 to L-027, L-030) |
| C. Automated checks | PASS | 171 unit tests; 134 scenarios; 21 browser checks; every fix has a check that fails without it (mutation run) |
| D. Regression | PASS | Full run on a rebuilt database, final code |
| E. Data integrity | PASS | Database checks at 0 after the full run, including 13 added this phase |
| F. Security | PASS | As gate G above |
| G. Performance | PASS with stated limits | 85-branch timings; local machine only |
| H. Usability and accessibility | PARTIAL | Browser checks pass; accessibility NOT ASSESSED |
| I. Documentation | PASS | The 16 Phase 7 documents and the updated registers |
| J. Production readiness | CONDITIONAL | See `phase-07-report.md`: SQL files 6 to 12 not confirmed on live; live data NOT VERIFIED; owner decisions open |

Readiness decision: **CONDITIONAL**.
