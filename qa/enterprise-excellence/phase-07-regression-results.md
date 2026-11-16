# Phase 7: regression results

Everything below was run in this session on a local database whose name contains `qa`, rebuilt from the migrations before each full run. Nothing was run against the live database or the host. No production work order was touched and no equipment was driven.

## 1. Runs

| Run | Code | Result |
|---|---|---|
| Baseline, before any Phase 7 change (commit `6cbedc5`) | Phase 6 end | Simulation 150 of 150; sweep 20 of 20; branch boundary 39; Phase 2: 80; Phase 3: 74 of 74 (612); Phase 4: 66 of 66 (555); Phase 5: 76 of 76 (386); Phase 6: 105 of 105 (486); unit 158 of 158; browser suites 22, 29, 30, 24, 23, 33, 14, 14; 332 changing routes, 0 with no rule; lint 0 errors, 1,528 warnings |
| Probe on the starting code | Phase 6 end | 17 defects reproduced before any fix (kept in the session evidence) |
| First full run | Phase 7 code | Every suite passed except the order-to-cash simulation: 147 "create job" steps were refused with 409 across the three seeds. Cause: a check added late in this phase refused a job on a work center at another branch than the order. Selling at one branch and working at another is established practice (the simulation's multi-branch jobs; `lib/branchScope.js` has always scoped a job by its order or its work center). The check was a mistake of this phase and was withdrawn. The scenario that had asked for it was rewritten to verify the established behaviour |
| Second full run | Phase 7 code before owner decision 9 (commit `88561a3`) | The result of record at that commit: every suite passed; Phase 7 scenarios 134 of 134 (542 checks) on a run made straight after, as described in that commit's issue of this document |
| Mutation run for decision 9 | Decision 9 code | 13 rules removed one at a time; each made 1 or more scenarios fail; source restored |
| Third full run | Decision 9 code | Every suite passed except: the security sweep section "Shop floor records" (5 of 50 checks), the shop browser suite (2 of 30) and the Phase 7 browser suite (stopped on a mistake in the new test script). All three were the tests, not the product: the two older checks completed a job with no planned steps straight to the dock, which decision 9 forbids. They were updated to follow the new rule (below) |
| Fourth full run | Decision 9 code with those tests updated | Every suite passed (Phase 7: 141 of 141, 617 checks; browser Phase 7: 30 of 30) |
| Browser checks added after the fourth run | Same | Nine checks for the work order, routing and kinds-of-work-center screens. The first run of them found a defect: the routing screen stopped with a script error on a routing whose step had been saved with no list of parameters (finding L-031, P3). Corrected in the screen and at the address; one check added to a Phase 7 scenario |
| Fifth full run | Final code | Section 2. Every suite passed except one check of the Phase 6 browser suite, explained under the table |

### Older checks updated, and why

| Check | Change | Reason |
|---|---|---|
| Order-to-cash simulation (`qa/sim/run.mjs`) | Where a job goes from inspection to packaging, the simulation opens and passes an inspection, as the Quality screen does | A job can no longer be released from inspection by hand (L-001). The check is stricter, not weaker |
| Security sweep, "Shop floor records" (`qa/sim/security.mjs`) | A completed job with no planned steps is expected at inspection, not at the dock; the "refused move" it then tries is a hand release from inspection | Owner decision 9 (L-021). Stricter, not weaker |
| Shop browser suite (`qa/sim/ui-shop.cjs`) | The job reaches the dock by being completed, inspected and passed. One check added: a job on hold cannot be sent straight to the dock | Owner decision 9 (L-021). 31 checks, was 30 |
| `qa/sim/phase6-inventory.mjs` | "Receiving does not create a cost" is now two scenarios: a cost typed on a receipt is still ignored and a receipt with no purchase order has no cost; a receipt against a purchase order line records the line's cost (hundredweight, pound, ton; a per-foot price leaves no cost) | Owner decision 9 (K-007). 106 scenarios, was 105 |
| Phase 7 scenarios: "one operator clocked on to two steps", "sent for rework", "rework is not routed or clocked", "production costing is not part of this product", "a work order does not carry cost" | Rewritten as verified scenarios of the new behaviour (section 2, by group). The two test kinds of work center shared by many scenarios are marked for two steps at once, because those scenarios leave operators clocked on | Owner decision 9. Five NOT APPLICABLE records became verified behaviour |
| Phase 7 scenario "across everything this run did" | A job released past inspection must have a passed or conditionally passed inspection, or a routing marked "no inspection" | Owner decision 9 (L-021) |
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

After owner decision 9, the same was done for its rules:

| Rule removed | Scenarios that then fail |
|---|---|
| Certification required where the kind is marked | 1 (group 4) |
| One step at a time unless the kind is marked | 1 (group 4) |
| Long-running clocks are listed | 1 (group 4) |
| Every job is inspected unless its routing says no | 19 (group 5) |
| A routing marked "no inspection" is honoured | 1 (group 5) |
| The kind's checklist starts an inspection | 1 (group 5) |
| Rework adds a step | 2 (group 6) |
| Cost at receipt from the purchase order line | 2 (group 6) |
| Pieces carry their source's cost | 1 (group 6) |
| Job cost only for cost roles | 1 (group 6) |
| The labor rate is hidden from the floor | 1 (group 6) |
| The labor rate is set only by cost roles | 1 (group 6) |
| A work order names a job that is on file, open and of the same order line | 1 (group 6) |

21 fixes and 13 decision rules, each caught by at least one scenario. A twenty-second mutation ("a job is opened at its order's branch") belonged to the check that was withdrawn and is not counted. The remaining corrections are covered by unit tests in `src/backend/test/phase7Rules.test.js` and by scenarios, without a separate mutation.

## 2. Final results (fifth full run, final code)

"Before" is the result of record before owner decision 9 (commit `88561a3`).

| Suite | Result | Before | Phase 6 end |
|---|---|---|---|
| Order-to-cash simulation, seeds 8001 to 8003 | 150 of 150 jobs pass; reconciliation 0 problems after each seed (plus 52 in demo seed data); no refused step | 150 of 150 | 150 of 150 |
| Database checks after the simulation and after the scenarios | 0 on every stock, reservation, transfer, purchase order, traceability and production check. Unchanged known rows from the demo seed and from scenarios that create them on purpose | 0 | 0 on every stock check |
| Security sweep | 20 of 20 sections | 20 of 20 | 20 of 20 |
| Branch boundary | 39 of 39 | 39 | 39 |
| Phase 2 integrity | 82 of 82 | 82 | 80 |
| Phase 3 database scenarios | 74 of 74, 612 checks | same | same |
| Phase 4 integration scenarios | 66 of 66, 555 checks | same | same |
| Phase 5 sales scenarios | 76 of 76, 386 checks | same | same |
| Phase 6 inventory scenarios | 106 of 106, 494 checks | 105 of 105, 486 checks | 105 of 105, 486 checks |
| Phase 7 manufacturing scenarios | 141 of 141, 618 checks | 134 of 134, 542 checks | New |
| Unit tests | 178 of 178 | 171 | 158 |
| Browser: experience, shipping, shop, sales, inventory, integration, Phase 5 | 22, 29, 31, 24, 23, 33, 14 checks, 0 failed | 22, 29, 30, 24, 23, 33, 14 | 22, 29, 30, 24, 23, 33, 14 |
| Browser: Phase 6 | 13 of 14 in the full run; 14 of 14 on each of four runs after the test was corrected (see below) | 14 | 14 |
| Browser: Phase 7 | 39 checks, 0 failed | 21 | New |
| Every screen opens | All 128 screens open | All | All |
| Baseline probe | All sections pass | All sections pass | All sections pass |
| Department rule coverage | 334 changing routes, 0 with no rule | 334, 0 with no rule | 332, 0 with no rule |
| Screen audit | 0 screens with made-up data and no notice | 0 | 0 |
| Screen ratchets | At their ceilings (38, 0) | 38, 0 | 38, 0 |
| Lint | Frontend clean; whole repository 0 errors, 1,526 warnings | 0 errors, 1,526 warnings | 0 errors, 1,528 warnings |
| Build | Succeeds | Succeeds | Succeeds |
| Documents | 50 modules, every route file and screen placed in one; 321 findings | 50 modules, 320 findings | 50 modules |

The one failure in the fifth full run: the Phase 6 browser check "supply position: rows for my branch only" found no rows. Cause, reproduced in isolation (1 time in 6): the screen draws the table before its rows arrive, and the test read the rows at once. The address answers in about 11 ms with the right rows and the screen shows them; the product was not changed. The test now waits for the first row before reading. It was then run four times on the same database: 14 of 14 each time. The same check had passed in the third and fourth full runs. A sixth full run was not made for this change to one test: NOT VERIFIED beyond those four runs.

### Phase 7 scenarios by group

| Group | Required | Run | Verified | NOT APPLICABLE (not built, with evidence) |
|---|---:|---:|---:|---:|
| 1. Work order creation and routing | 15 | 15 | 15 | 0 |
| 2. BOMs, material requirements and allocation | 15 | 17 | 15 | 2: bill of material; material requirements planning |
| 3. Capacity planning and scheduling | 20 | 22 | 21 | 1: shift calendars, operator availability and running work |
| 4. Shop-floor execution and labor and machine tracking | 20 | 23 | 22 | 1: machine time, downtime and telemetry |
| 5. Quality control and nonconformance | 20 | 25 | 22 | 3: nonconformance and corrective action; sampling plans, calibration and standards the owner has not entered; a disposition followed through to stock |
| 6. Scrap, remnants, rework and costing | 15 | 17 | 15 | 2: nesting; outsourced processing |
| 7. Cross-location production, concurrency and recovery | 20 | 22 | 20 | 2: lending an operator to another branch; machine connection |
| Total | 125 | 141 | 130 | 11 |

Each NOT APPLICABLE scenario still runs: it checks the evidence that the capability is absent (no table, no address, or the recorded behaviour) and fails if that stops being true. No scenario is BLOCKED.

Against the brief: 125 verified scenarios were asked for and 130 verify built behaviour; every group meets its number. Before owner decision 9 it was 119, because costing, rework routing and the labor rules had not been decided.

Scenarios added for owner decision 9 (all verified): group 4: two steps at once; certification where marked; long-running clocks. Group 5: a job with no steps goes to inspection; a routing marked "no inspection"; a checklist per kind of work. Group 6: the rework step; rework on another kind of work center; cost at receipt and to pieces; job cost; a job and its coil work orders. Group 7: two people sending one inspection for rework at once.

### Database checks added in Phase 7 (`qa/tools/db-facts.mjs`)

Time entries that end before they start; entries running on a finished step; entries running on a closed job; steps with more than one clock; entries with no operator or work center; finished steps with no start or end; steps running on the wrong kind of work center or at another branch; jobs with more than one open inspection; inspections decided with no result; jobs past inspection whose latest inspection failed; jobs past production with a step unfinished; jobs whose plan is at a branch other than their work center; operators clocked on while inactive. Added for owner decision 9: rework steps not tied to a rework inspection of the same job, or two for one inspection; coil work orders raised for a job but for a different order line; stock items with a cost below zero. All 16 are 0 after the fifth full run.

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
| Bill of material, material requirements, stock valuation and cost of goods, nesting, outsourced processing, nonconformance, calendar capacity | Not built (L-023 to L-027, K-007) |
| The 85-branch timings after owner decision 9 | Not re-run. Decision 9 adds one read of the kind of work center to a step start and three new read addresses (job material, job cost, long-running clocks); none was timed at scale. NOT VERIFIED |
| SQL Editor file 13 on the live database | The owner applies it. Run twice on a local copy only |
| Accessibility audit of the shop-floor screens | Deferred to Phase 9 |
| Timing with real users | None available; no minutes-saved figure is claimed |
| SQL Editor files 6 to 12 on the live database | The owner applies them; the result of the read-only verification query has not been received. NOT VERIFIED |
