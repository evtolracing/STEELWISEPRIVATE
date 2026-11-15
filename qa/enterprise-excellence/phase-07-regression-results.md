# Phase 7: regression results

Everything below was run in this session on a local database whose name contains `qa`, rebuilt from the migrations before each full run. Nothing was run against the live database or the host. No production work order was touched and no equipment was driven.

## 1. Runs

| Run | Code | Result |
|---|---|---|
| Baseline, before any Phase 7 change (commit `6cbedc5`) | Phase 6 end | Simulation 150 of 150; sweep 20 of 20; branch boundary 39; Phase 2: 80; Phase 3: 74 of 74 (612); Phase 4: 66 of 66 (555); Phase 5: 76 of 76 (386); Phase 6: 105 of 105 (486); unit 158 of 158; browser suites 22, 29, 30, 24, 23, 33, 14, 14; 332 changing routes, 0 with no rule; lint 0 errors, 1,528 warnings |
| Probe on the starting code | Phase 6 end | 17 defects reproduced before any fix (kept in the session evidence) |
| First full run | Phase 7 code | Every suite passed except the order-to-cash simulation: 147 "create job" steps were refused with 409 across the three seeds. Cause: a check added late in this phase refused a job on a work center at another branch than the order. Selling at one branch and working at another is established practice (the simulation's multi-branch jobs; `lib/branchScope.js` has always scoped a job by its order or its work center). The check was a mistake of this phase and was withdrawn. The scenario that had asked for it was rewritten to verify the established behaviour |
| Second full run | Final code | Section 2 |

### Older checks updated, and why

| Check | Change | Reason |
|---|---|---|
| Order-to-cash simulation (`qa/sim/run.mjs`) | Where a job goes from inspection to packaging, the simulation opens and passes an inspection, as the Quality screen does | A job can no longer be released from inspection by hand (L-001). The check is stricter, not weaker |
| `qa/sim/phase2-integrity.mjs` | New check: step 2 cannot start before step 1. The parallel-completion race runs with the planned-order rule switched off, then removes the setting. A fixture work center uses a kind that is on file | Owner decision 8; L-004; L-005 |

No test was disabled, skipped or loosened to obtain a pass.

### Proof that the new checks catch the defects

Each fix was removed from the source one at a time, the affected group was run, and the source was restored (`git diff` empty against the fixed tree afterwards).

| Fix removed | Scenarios that then fail |
|---|---|
| Planned order is the default | 1 (group 4) |
| Cancelling a job stops its clocks | 3 (group 7) |
| A planner schedules only their own branch | 1 (group 3) |
| Shop-floor figures count open jobs only | 1 (group 7) |
| No work order on material in transit | 1 (group 7) |
| Conditional pass disposition | 1 (group 5) |
| Inspection edit checks the inspector | 1 (group 5) |
| Plan of another branch's job is 404 | 1 (group 7) |
| Release from inspection needs a pass | 2 (group 5) |
| Open steps stop a job leaving production | 1 (group 4) |
| Expired certification refuses a start | 1 (group 4) |
| An unstarted step cannot be finished | 1 (group 4) |
| A failed required check blocks a pass | 1 (group 5) |
| A locked-out machine gets no work | 2 (group 3) |
| No time is assumed for a job | 1 (group 3) |
| A step runs on its own kind of work center at its branch | 2 (group 4) |
| Grade substitution needs a reason | 1 (group 1) |
| Quality hold released by quality only | 1 (group 5) |
| Pay is hidden from the floor | 1 (group 4) |
| Expedite raises priority | 1 (group 7) |
| One open inspection per job | 1 (group 5) |

21 fixes, each caught by at least one scenario. A twenty-second mutation ("a job is opened at its order's branch") belonged to the check that was withdrawn and is not counted. The remaining corrections are covered by unit tests in `src/backend/test/phase7Rules.test.js` and by scenarios, without a separate mutation.

## 2. Final results (second full run, final code)

| Suite | Result | Phase 6 end |
|---|---|---|
| Order-to-cash simulation, seeds 8001 to 8003 | 150 of 150 jobs pass; reconciliation 0 problems after each seed (plus 52 in demo seed data); no refused step | 150 of 150 |
| Database checks after the simulation and after the scenarios | 0 on every stock, reservation, transfer, purchase order, traceability and production check. Unchanged known rows from the demo seed and from scenarios that create them on purpose (invoices from the demo seed, orders and jobs opened with no branch or order by negative tests, shelf goods with no heat) | 0 on every stock check |
| Security sweep | 20 of 20 sections | 20 of 20 |
| Branch boundary | 39 of 39 | 39 |
| Phase 2 integrity | 82 of 82 (2 new) | 80 |
| Phase 3 database scenarios | 74 of 74, 612 checks | 74 of 74, 612 checks |
| Phase 4 integration scenarios | 66 of 66, 555 checks | 66 of 66, 555 checks |
| Phase 5 sales scenarios | 76 of 76, 386 checks | 76 of 76, 386 checks |
| Phase 6 inventory scenarios | 105 of 105, 486 checks | 105 of 105, 486 checks |
| Phase 7 manufacturing scenarios (new) | 134 of 134 scenarios pass, 542 checks, on a run made straight after the full run, on the same database and the same server. In the full run itself 133 of 134 passed (538 checks): the one scenario rewritten after the first run stopped on a mistake in the test script (a helper called the wrong way), not on the product. The script was corrected, no product code changed, and the whole Phase 7 suite was run again | New |
| Unit tests | 171 of 171 (13 new) | 158 |
| Browser: experience, shipping, shop, sales, inventory, integration, Phase 5, Phase 6 | 22, 29, 30, 24, 23, 33, 14, 14 checks, 0 failed | 22, 29, 30, 24, 23, 33, 14, 14 |
| Browser: Phase 7 (new) | 21 checks, 0 failed | New |
| Every screen opens | All routes open | All |
| Baseline probe | All sections pass | All sections pass |
| Department rule coverage | 334 changing routes, 0 with no rule | 332 changing routes, 0 with no rule |
| Screen audit | 0 screens with made-up data and no notice | 0 |
| Screen ratchets | At their ceilings (38, 0) | 38, 0 |
| Lint | Frontend clean; whole repository 0 errors, 1,526 warnings | 0 errors, 1,528 warnings |
| Build | Succeeds | Succeeds |
| Documents | 50 modules, every route file and screen placed in one; 320 findings | 50 modules |

### Phase 7 scenarios by group

| Group | Required | Run | Verified | NOT APPLICABLE (not built, with evidence) |
|---|---:|---:|---:|---:|
| 1. Work order creation and routing | 15 | 15 | 15 | 0 |
| 2. BOMs, material requirements and allocation | 15 | 17 | 15 | 2: bill of material; material requirements planning |
| 3. Capacity planning and scheduling | 20 | 22 | 21 | 1: shift calendars, operator availability and running work |
| 4. Shop-floor execution and labor and machine tracking | 20 | 21 | 19 | 2: a rule against two steps at once (none on file); machine time, downtime and telemetry |
| 5. Quality control and nonconformance | 20 | 22 | 19 | 3: nonconformance and corrective action; inspection standards, sampling and calibration; a disposition followed through to stock |
| 6. Scrap, remnants, rework and costing | 15 | 16 | 11 | 5: rework routing and clocking; production costing; cost carried to pieces; nesting; outsourced processing |
| 7. Cross-location production, concurrency and recovery | 20 | 21 | 19 | 2: lending an operator to another branch; machine connection |
| Total | 125 | 134 | 119 | 15 |

Each NOT APPLICABLE scenario still runs: it checks the evidence that the capability is absent (no table, no address, or the recorded behaviour) and fails if that stops being true. No scenario is BLOCKED.

Shortfall against the brief, stated plainly: 134 scenarios were run where 125 were asked for, but 119 verify built behaviour. Group 6 has 11 verified against 15 asked for, because costing, nesting, outsourced processing and rework routing do not exist and were not invented.

### Database checks added in Phase 7 (`qa/tools/db-facts.mjs`)

Time entries that end before they start; entries running on a finished step; entries running on a closed job; steps with more than one clock; entries with no operator or work center; finished steps with no start or end; steps running on the wrong kind of work center or at another branch; jobs with more than one open inspection; inspections decided with no result; jobs past inspection whose latest inspection failed; jobs past production with a step unfinished; jobs whose plan is at a branch other than their work center; operators clocked on while inactive. All 13 are 0 after the full run and after the final Phase 7 run.

## 3. Performance at 85 branches

Database `steelwise_qa_scale3`: 85 branches, with synthetic rows added for this measurement only: 1,020 operators, about 9,300 plans, about 18,600 steps, 1,500 inspections; one branch holds 7,090 waiting jobs. Median of 7 calls, milliseconds, local machine. "All" is a login that sees every branch; "branch" is a production manager of the big branch.

| Call | All | Branch | Answer size | Before this phase |
|---|---:|---:|---:|---|
| Job list, first page | 41 | 82 | 64 KB | |
| Job counts for the big branch | 43 | 45 | under 1 KB | |
| Late jobs, next 24 hours | 74 | 83 | 138 KB | 653 ms |
| Shop-floor figures | 73 | 98 | 1 KB | |
| Work center queue | 6 | 8 | under 1 KB | |
| Operators at the big branch | 6 | 7 | 4 KB | |
| Inspection queue | 76 | 75 | 441 KB | 303 ms, 3.7 MB |
| Quality figures | 24 | 21 | 6 KB | |
| Inspections list | 11 | 13 | 34 KB | |
| Planner preview | 137 | 139 | 1.2 MB | |
| Planner analysis | 101 | 132 | 1 KB | |
| Scheduling run, small branch (single call) | 48 | | 75 KB | |
| Scheduling run again, nothing to place (single call) | 38 | | 75 KB | |
| Scheduling run, 7,090 waiting jobs, 14,180 steps placed (single call) | | 1,859 | 8.3 MB | 45,342 ms |

Not re-timed after its cap was added: the steps list (1,457 ms and 14.7 MB uncapped; now 500 rows by default). Open point: the scheduling run's answer for the largest branch is 8.3 MB and the planner preview is 1.2 MB; both list every placement. Recorded for Phase 9; no change made.

These are local figures. The host was not measured: NOT VERIFIED.

## 4. Not run

| Subject | Why |
|---|---|
| Anything against the live database or the host | No access; the rule forbids it |
| Machines, scales, scanners, label printers | No hardware (L-030, K-013). No certification is claimed |
| Bill of material, material requirements, costing, nesting, outsourced processing, nonconformance, calendar capacity | Not built (L-023 to L-027) |
| Accessibility audit of the shop-floor screens | Deferred to Phase 9 |
| Timing with real users | None available; no minutes-saved figure is claimed |
| SQL Editor files 6 to 12 on the live database | The owner applies them; the result of the read-only verification query has not been received. NOT VERIFIED |
