# Phase 7 of 12: final execution report

Manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence.

Date: 2026-11-15. Branch `claude/project-thread-25z3jd`, pull request 31 (not merged). Baseline commit `6cbedc5`. Governed by `qa/ENGINEERING-STANDARD.md` and `qa/UNIVERSAL-ENGINEERING-DIRECTIVE.md`. All testing ran on a local database whose name contains `qa`. Nothing was run against the live database or the host, no production work order was touched and no equipment was driven. Phase 7 ships no database change.

## FINAL STATUS

**PARTIALLY COMPLETE**

Readiness decision under the directive: **CONDITIONAL**.

Why not VERIFIED COMPLETE:

1. Seven capabilities the brief names do not exist in the product and were not built, because building them would mean inventing rules the instruction reserves for the owner: bill of material and material requirements (L-024), calendar capacity (L-025), production costing (L-026), nonconformance and corrective action (L-023), rework routing and labor (L-020), outsourced processing and nesting (L-027), machine connection (L-030).
2. As a result 119 scenarios verify built behaviour, where the brief asks for 125. 134 were run; 15 record with evidence that a capability is absent.
3. Gates B, C and E pass on the half that exists (routing, scheduling, material) and cannot be met on the half that does not (bill of material, calendar capacity, cost).
4. Live data, the host and hardware are NOT VERIFIED, and SQL Editor files 6 to 12 are not confirmed on the live database.

What is complete and verified: every confirmed Phase 7 defect in built code is corrected (26, of which 8 were P1), each with an automated check that fails without it, and the full regression run on the final code is in `phase-07-regression-results.md`.

## MANUFACTURING DISCOVERY

Detail: `phase-07-manufacturing-inventory.md`.

- Two production records exist and are not linked: the **job** (order line, planned steps, operators, time, inspection; touches no stock) and the **coil work order** (weight in, pieces out, scrap; moves stock with the heat). Finding L-024.
- What the code calls a BOM recipe is a routing: steps, not materials.
- Twelve route files and about 110 addresses make up production. Before this phase the steps, time entries, scheduling run, planner and most of inspection had never succeeded in a test.
- The planned-order rule, the quality gate and the "who and where" checks did not exist on the server: the screens assumed them.
- An order may be sold at one branch and worked at another; the job follows its work center. Confirmed as established practice and left unchanged.

## PRODUCTION INTEGRITY

| Subject | State | Document |
|---|---|---|
| Work orders | Created only for live orders and lines; one plan; every move through one gate; history against a person | `phase-07-work-order-audit.md` |
| Routing | Draft, review, in use, retired; validated steps; version recorded on the job | `phase-07-routing-bom-review.md` |
| Work centers and operators | Validated; no change under open work; lockout; certifications checked | `phase-07-work-center-capabilities.md` |
| Scheduling | Idempotent, branch-locked, open jobs only, like machines, certified operators; no invented times | `phase-07-capacity-scheduling.md` |
| Shop floor | Start, pause, finish in planned order; five races safe; clocks reconcile | `phase-07-shop-floor-execution.md`, `phase-07-labor-machine-tracking.md` |
| Quality | A job leaves inspection only by a passed inspection; decisions audited; one open inspection | `phase-07-quality-control.md` |
| Rework and nonconformance | Send back and re-inspect verified; the rest not built | `phase-07-nonconformance-rework.md` |
| Material, scrap, remnants | Phase 3 and 6 rules verified from the production side; three checks added | `phase-07-scrap-remnants.md` |
| Costing | Not built; nothing changed | `phase-07-production-costing.md` |
| Figures | Counted from records; nothing assumed; lists capped | `phase-07-production-reporting.md` |

Traceability was not reduced anywhere: pieces keep heat, grade, owner and parent; time entries keep operator and work center after either is switched off; every job move and inspection decision names the signed-in person.

## DEFECTS AND CORRECTIONS

30 findings, L-001 to L-030, in `findings-register.md`.

| Finding | Severity | Subject | Status |
|---|---|---|---|
| L-001 | P1 | A job could be released from inspection by hand, even after a failed inspection | VERIFIED FIXED |
| L-002 | P1 | An inspection could be passed with required checks failed or unanswered | VERIFIED FIXED |
| L-003 | P2 | Two decisions or two open inspections at once; the decider was whatever the browser sent | VERIFIED FIXED |
| L-004 | P1 | No state rules on steps: finish without start, restart after finish, any order | VERIFIED FIXED (planned order by owner decision 8) |
| L-005 | P1 | A step could be run on the wrong kind of machine, at another branch, by an inactive or uncertified operator | VERIFIED FIXED |
| L-006 | P1 | A job could leave production with planned steps unfinished | VERIFIED FIXED |
| L-007 | P2 | Scheduling run: closed jobs, any branch's operators, machines off, double placement, another branch's planner, 45 s at a large branch | VERIFIED FIXED |
| L-008 | P2 | Planner assumed 60 minutes per job and 8 hours per day; "apply" saved anything | VERIFIED FIXED |
| L-009 | P2 | Wrong counts and lists: branch filter ignored, late list incomplete, pass rate 100% from nothing, queue least urgent first, unbounded lists | VERIFIED FIXED |
| L-010 | P2 | Grade "A36", thickness, machine limits and routing times filled in when none were entered | VERIFIED FIXED |
| L-011 | P2 | Routings: unvalidated steps, empty routing put into use, drafts put on jobs | VERIFIED FIXED |
| L-012 | P2 | Jobs opened for cancelled orders or on offline work centers; a re-plan deleted recorded time | VERIFIED FIXED |
| L-013 | P1 | Coil work order on quality hold could be completed; silent grade substitution; failed, held or in-transit material accepted | VERIFIED FIXED |
| L-014 | P2 | Operator pay and emergency contact sent to every login; a clocked-on operator could be removed | VERIFIED FIXED |
| L-015 | P2 | Work centers and maintenance orders: no validation, no state rules | VERIFIED FIXED |
| L-016 | P1 | A machine locked out for maintenance was still scheduled and could be started | VERIFIED FIXED |
| L-017 | P2 | Cockpit "expedite" and "rebalance" did the wrong thing | VERIFIED FIXED |
| L-018 | P2 | Cancelling a job left its clock running for ever | VERIFIED FIXED |
| L-019 | P1 | Inspections, time entries and operators of one branch visible and changeable from another | VERIFIED FIXED |
| L-020 | P2 | Rework is not routed or clocked | REQUIRES BUSINESS DECISION |
| L-021 | P2 | A job with no planned steps is never inspected | REQUIRES BUSINESS DECISION |
| L-022 | P2 | Labor rules are not on file | REQUIRES BUSINESS DECISION |
| L-023 | P2 | Nonconformance and corrective action not built | DEFERRED (quality modules, owner decision 4) |
| L-024 | P2 | A job and a coil work order are not linked; no bill of material | REQUIRES BUSINESS DECISION |
| L-025 | P2 | Capacity is not planned against a calendar | DEFERRED |
| L-026 | P1 | Production costing does not exist | REQUIRES BUSINESS DECISION (with K-007) |
| L-027 | P3 | Outsourced processing and nesting not built | DEFERRED |
| L-028 | P2 | No inspection standard on file; the checklist is five fixed lines | REQUIRES BUSINESS DECISION |
| L-029 | P3 | Thickness "not stated" is stored as 0 | DEFERRED (needs a database change) |
| L-030 | P3 | No machine is connected; nothing verified on hardware | DEFERRED |

Also closed: B-011 (half-saved time entries). M-017 is narrowed and still the owner's.

Confirmed P0: none. Confirmed P1 in built code: 8, all fixed. The one P1 still open, L-026, is a capability that does not exist and a decision that is the owner's; no built code is known to be wrong.

**A correction to my own work.** Late in the phase I added a check that refused a job on a work center at another branch than its order. The first full regression run showed that it broke the simulation's multi-branch jobs: 147 steps refused. Selling at one branch and working at another is established practice, so the check changed a manufacturing policy without approval. It was withdrawn, the scenario was rewritten to verify the established behaviour, and everything was run again. Nothing with that check was committed.

### Behaviour that changes for staff

1. A job waiting for inspection moves on only when an inspection is passed.
2. An inspection cannot be passed with a required check unanswered or failed, or a measurement out of tolerance. A conditional pass needs its conditions.
3. Steps run in their planned order (your decision of 2026-11-15). It is one setting.
4. A step runs on the right kind of work center, at the branch of its plan, by an operator of that branch whose certification has not lapsed. A step must be started before it is finished.
5. A job cannot leave production with a planned step unfinished.
6. A locked-out machine gets no work.
7. A coil work order on quality hold is released by quality or production management; a different grade needs a reason.
8. Cancelling a job stops its clocks.
9. Inspectors, planners and operators see their own branch.
10. The planner shows no time or utilisation it does not have on file.

## OPERATIONAL EFFICIENCY

Detail: `phase-07-ux-efficiency.md`, `phase-07-regression-results.md` section 3.

- Scheduling run at a branch with 7,090 waiting jobs: 45.3 s to 1.9 s.
- Late-jobs list: 653 ms to 74 ms. Inspection queue: 303 ms and 3.7 MB to 76 ms and 441 KB, most urgent first.
- Production screens at 85 branches answer in 6 to 139 ms on the local machine.
- Every refusal is one sentence naming what is in the way.
- No minutes-saved figure is claimed: no real user was timed. Accessibility is NOT ASSESSED.

## VERIFICATION

Detail and exact figures: `phase-07-regression-results.md`.

- 134 manufacturing scenarios in seven groups, each reading the database after acting: 119 verified, 15 NOT APPLICABLE with evidence, 0 blocked.
- 21 fixes removed one at a time: each made a scenario fail.
- 171 unit tests, 13 new.
- 21 browser checks on the quality, shop-floor and planner screens, including phone width.
- 13 database checks added; all 0 after the full run.
- The whole earlier suite re-run twice on a rebuilt database. The first run found my mistake described above; the second is the result of record. In that second run every suite passed except one Phase 7 scenario, the one rewritten after the first run, which stopped on a mistake in the test script itself. The script was corrected, no product code changed, and the Phase 7 suite was run again in full: 134 of 134, 542 checks.
- Not run: anything on live data or the host, hardware, and the capabilities that are not built.

Gates of the Phase 7 prompt:

| Gate | Result |
|---|---|
| A. Work order integrity | PASS with stated limits (L-024) |
| B. Routing and BOM integrity | PARTIAL: routing passes; no bill of material exists |
| C. Scheduling and capacity | PARTIAL: scheduling passes; no calendar capacity exists |
| D. Shop-floor execution | PASS |
| E. Material and cost integrity | PARTIAL: material passes; cost does not exist |
| F. Quality control | PASS with stated limits (L-021, L-023, L-028) |
| G. Security and location isolation | PASS |
| H. Operational efficiency | PASS with stated limits (local machine; no real users) |
| I. Regression | PASS: 134 scenarios run, no unresolved confirmed P0 or P1 defect in built code |

The directive's gates A to J are in `phase-07-quality-scorecard.md`: A, C, D, E, F, I pass; G passes on the local machine; B and H are partial; J is CONDITIONAL.

## PRODUCTION READINESS

**CONDITIONAL.** The corrected code is safer than what is live: it closes eight P1 holes in quality release, step execution, lockout and branch isolation. Conditions before it goes live:

1. SQL Editor files 6 to 12 applied in order and confirmed (send the result of `/mnt/project-files/database-updates/verify-6-to-12.sql`). Phase 7 adds no file.
2. A read-only check of live operators, certifications, work-center kinds and jobs now waiting for inspection, because the new rules will refuse records that do not meet them (risk R-46).
3. Branches told about the ten behaviour changes above (risk R-40).
4. You say "merge". Nothing is merged without that.

Rollback: Phase 7 is code only. Reverting the pull request needs no database step.

Not production-ready, whatever is merged: production costing, bill of material, calendar capacity, nonconformance, rework labor, outsourced processing, machine connection. They do not exist.

### Decisions needed from the owner

| Finding | Question | Recommendation |
|---|---|---|
| L-026, K-007 (P1) | How is a job costed: material cost at receipt, labor at whose rate, machine rates, overhead? | Decide the material method first (K-007); labor at a rate per kind of work center |
| L-024 | Should a job name the coil work orders raised for it, so its material, scrap and yield are known? | Yes: link them, no change to either screen's flow |
| L-020 | How is rework done and recorded? | Quality adds a rework step to the plan, clocked like any step |
| L-021 | Must every job pass inspection? | Yes, unless its routing is marked "no inspection" |
| L-022 | Labor rules: is a certification required; may an operator be on two steps; a maximum shift length? | Required where the kind of work center is marked; two steps only where marked; list long entries for the supervisor |
| L-028 | What does an inspection check: your standards, sampling and tolerances by product? | Supply them; until then the five-line checklist is enforced as it stands |

## PHASE 8 HANDOFF

Phase 8 (shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order closeout) has **not** been started. It should take these from Phase 7:

1. **Jobs reach shipping only through inspection.** Packaging and ready-to-ship now always follow a passed inspection for jobs with steps. Phase 8 should verify that a shipment cannot be built from a job that is not ready, and decide what "ready" means for jobs with no steps (L-021).
2. **No cost of goods.** Invoicing and reconciliation will have revenue with no production or material cost beside it (L-026, K-007). Margin cannot be reported.
3. **Dispositions stop at the record.** A failed inspection marked scrap or return to supplier moves no stock and raises no credit (L-023). Phase 8's returns and credit work meets this.
4. **Pieces, not jobs, carry the heat.** What ships is traced through coil work orders and stock. A job has no stock link (L-024), so "which heat went on this job" is answered through the order line's reservation, not the job.
5. **Sold at one branch, worked and shipped at another** is supported and tested in production. Phase 8 should test the shipping, tax (decision 7) and invoice side of the same case.
6. **Packages, drop tags, staging and the print queue** (`materialTrackingRoutes.js`, `dropTagRoutes.js`, `printQueue.js`: about 30 changing addresses) have no success-path test. They sit between production and shipping and were out of Phase 7's defect scope; Phase 8 should audit them first.
7. **Partial completion.** A job is whole: there is no partial quantity complete on a job, so a part shipment is driven by the order line, not by job progress.
8. **Open from earlier phases and relevant to Phase 8:** shipments delivered with no proof-of-delivery name (47 in QA data), freight and carrier rates (F-007), supplier invoices not matched (K-012), customer preference rules not applied (J-008), payment at web checkout (H-013, H-015).
9. **Large answers:** the scheduling run and planner preview return 8.3 MB and 1.2 MB at the largest branch. For Phase 9.
