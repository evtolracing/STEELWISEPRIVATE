# Phase 7 of 12: final execution report

Manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence.

Date: 2026-11-15. Branch `claude/project-thread-25z3jd`, pull request 31 (not merged). Baseline commit `6cbedc5`. Governed by `qa/ENGINEERING-STANDARD.md` and `qa/UNIVERSAL-ENGINEERING-DIRECTIVE.md`. All testing ran on a local database whose name contains `qa`. Nothing was run against the live database or the host, no production work order was touched and no equipment was driven. Phase 7 ships one database change, SQL Editor file 13, made for owner decision 9.

**Updated 2026-11-15 after owner decision 9.** The first issue of this report asked six questions. The owner answered "use the recommended option" for all six, and they were built, tested and added here. Sections changed by that work are marked "decision 9".

## FINAL STATUS

**PARTIALLY COMPLETE**

Readiness decision under the directive: **CONDITIONAL**.

Why not VERIFIED COMPLETE:

1. Five capabilities the brief names do not exist in the product and were not built, because nobody has decided their rules: bill of material and material requirements (part of L-024), calendar capacity (L-025), nonconformance and corrective action (L-023), outsourced processing and nesting (L-027), machine connection (L-030).
2. Costing is built only as far as the owner decided it (decision 9): cost at receipt, cost carried to pieces, and job cost from material and labor. Stock valuation, value on movements, overhead and cost of goods are not built (L-026 and K-007 stay IN PROGRESS).
3. Gates B and C pass on the half that exists (routing, scheduling) and cannot be met on the half that does not (bill of material, calendar capacity).
4. Live data, the host and hardware are NOT VERIFIED. SQL Editor files 6 to 12 are not confirmed on the live database, and file 13 has not been applied.

What is complete and verified: every confirmed Phase 7 defect in built code is corrected (26, of which 8 were P1), the six owner decisions are built, each rule has an automated check that fails without it, and the full regression run on the final code is in `phase-07-regression-results.md`. 130 scenarios now verify built behaviour, where the brief asks for 125.

## MANUFACTURING DISCOVERY

Detail: `phase-07-manufacturing-inventory.md`.

- Two production records exist: the **job** (order line, planned steps, operators, time, inspection; touches no stock) and the **coil work order** (weight in, pieces out, scrap; moves stock with the heat). They were not linked (finding L-024). Decision 9: a coil work order can now be raised for a job, and the job shows its material, scrap and yield.
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
| Shop floor | Start, pause, finish in planned order; five races safe; clocks reconcile. Decision 9: certification and two-steps-at-once rules by kind of work center; long clocks listed | `phase-07-shop-floor-execution.md`, `phase-07-labor-machine-tracking.md` |
| Quality | A job leaves inspection only by a passed inspection; decisions audited; one open inspection. Decision 9: every job is inspected unless its routing says otherwise; checklists can be entered per kind of work | `phase-07-quality-control.md` |
| Rework and nonconformance | Decision 9: rework is a step added to the plan and clocked. Nonconformance and corrective action not built | `phase-07-nonconformance-rework.md` |
| Material, scrap, remnants | Phase 3 and 6 rules verified from the production side; three checks added | `phase-07-scrap-remnants.md` |
| Costing | Decision 9: actual cost per item from the purchase order at receipt, carried to pieces; job cost from material and labor; no overhead. Valuation and cost of goods not built | `phase-07-production-costing.md` |
| Figures | Counted from records; nothing assumed; lists capped | `phase-07-production-reporting.md` |

Traceability was not reduced anywhere: pieces keep heat, grade, owner and parent; time entries keep operator and work center after either is switched off; every job move and inspection decision names the signed-in person.

## DEFECTS AND CORRECTIONS

31 findings, L-001 to L-031, in `findings-register.md`.

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
| L-020 | P2 | Rework is not routed or clocked | VERIFIED FIXED (decision 9: a rework step) |
| L-021 | P2 | A job with no planned steps is never inspected | VERIFIED FIXED (decision 9) |
| L-022 | P2 | Labor rules are not on file | VERIFIED FIXED (decision 9; shifts and overtime stay with L-025) |
| L-023 | P2 | Nonconformance and corrective action not built | DEFERRED (quality modules, owner decision 4) |
| L-024 | P2 | A job and a coil work order are not linked; no bill of material | VERIFIED FIXED for the link (decision 9); a bill of material is still not built |
| L-025 | P2 | Capacity is not planned against a calendar | DEFERRED |
| L-026 | P1 | Production costing does not exist | IN PROGRESS (decision 9: job cost built; rates to be entered; overhead and reports not built) |
| L-027 | P3 | Outsourced processing and nesting not built | DEFERRED |
| L-028 | P2 | No inspection standard on file; the checklist is five fixed lines | IN PROGRESS (decision 9: checklists per kind of work can be entered; the owner supplies them) |
| L-029 | P3 | Thickness "not stated" is stored as 0 | DEFERRED (needs a database change) |
| L-030 | P3 | No machine is connected; nothing verified on hardware | DEFERRED |
| L-031 | P3 | The routing screen stopped with an error on a routing whose step was saved with no parameter list (found by a browser check added for decision 9) | VERIFIED FIXED |

Also closed: B-011 (half-saved time entries). M-017 is narrowed and still the owner's. K-007 (Phase 6, costing method) is IN PROGRESS after decision 9.

Confirmed P0: none. Confirmed P1 in built code: 8, all fixed. The one P1 still open, L-026, is now built as far as the owner decided it and waits on his labor rates; no built code is known to be wrong.

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

Added by decision 9 (in force once database update 13 is applied and the code is live):

11. Every job goes to inspection when production finishes, including a job with no planned steps. The exception is a job on a routing where "Jobs on this routing must pass inspection" has been unticked.
12. One operator cannot be clocked on to two steps at once, unless the kind of work center is ticked "One operator may run two steps at once". **Tick this for any kind of machine one person tends in pairs before go-live** (risk R-47).
13. Where a kind of work center is ticked "An operator needs a current certification to run it", an operator with no certification on file for it cannot start a step.
14. Sending a job for rework adds a "Rework" step that must be started and finished before the job returns to inspection.
15. Material for a job is cut from the job screen ("Cut material for this job"), so the job shows what it used.
16. Items received against a purchase order take their cost from the order line. Managers, the inventory manager and buyers see job cost; nobody else does.
17. The time tracking screen lists clocks that have run more than 12 hours.

## OPERATIONAL EFFICIENCY

Detail: `phase-07-ux-efficiency.md`, `phase-07-regression-results.md` section 3.

- Scheduling run at a branch with 7,090 waiting jobs: 45.3 s to 1.9 s.
- Late-jobs list: 653 ms to 74 ms. Inspection queue: 303 ms and 3.7 MB to 76 ms and 441 KB, most urgent first.
- Production screens at 85 branches answer in 6 to 139 ms on the local machine.
- Every refusal is one sentence naming what is in the way.
- No minutes-saved figure is claimed: no real user was timed. Accessibility is NOT ASSESSED.

## VERIFICATION

Detail and exact figures: `phase-07-regression-results.md`.

- 141 manufacturing scenarios in seven groups, each reading the database after acting: 130 verified, 11 NOT APPLICABLE with evidence, 0 blocked. Before decision 9: 134, 119 and 15.
- 34 rules removed one at a time (21 fixes, 13 decision rules): each made a scenario fail.
- 178 unit tests, 20 new in this phase.
- 39 browser checks on the quality, shop-floor, planner, job, work order, routing, kinds-of-work-center and time tracking screens, including phone width.
- 16 database checks added; all 0 after the full run.
- The whole earlier suite was re-run on a rebuilt database five times in this phase. The first found my mistake described above. The second was the result of record before decision 9. The third, after decision 9, found two older checks that completed a job straight to the dock, which decision 9 forbids, and a mistake in my new browser script; the tests were updated to follow the new rule, with no product change. The fourth passed. Browser checks added after it found the routing screen defect L-031, which was fixed. The fifth, on the final code, is the result of record: every suite passed except one older browser check (Phase 6 suite, supply position) that read a table before its rows had arrived. That is a timing fault in the test, not in the product; the test now waits for the first row and passed four times in a row on the same database. Detail is in `phase-07-regression-results.md` section 1.
- Not run: anything on live data or the host, hardware, and the capabilities that are not built.

Gates of the Phase 7 prompt:

| Gate | Result |
|---|---|
| A. Work order integrity | PASS |
| B. Routing and BOM integrity | PARTIAL: routing passes; no bill of material exists |
| C. Scheduling and capacity | PARTIAL: scheduling passes; no calendar capacity exists |
| D. Shop-floor execution | PASS |
| E. Material and cost integrity | PARTIAL: material passes; cost passes for what decision 9 built; valuation and cost of goods do not exist |
| F. Quality control | PASS with stated limits (L-023; the checklists are the owner's to enter, L-028) |
| G. Security and location isolation | PASS |
| H. Operational efficiency | PASS with stated limits (local machine; no real users) |
| I. Regression | PASS: 141 scenarios run, 130 verified (125 required), no unresolved confirmed P0 or P1 defect in built code |

The directive's gates A to J are in `phase-07-quality-scorecard.md`: A, C, D, E, F, I pass; G passes on the local machine; B and H are partial; J is CONDITIONAL.

## PRODUCTION READINESS

**CONDITIONAL.** The corrected code is safer than what is live: it closes eight P1 holes in quality release, step execution, lockout and branch isolation. Conditions before it goes live:

1. SQL Editor files 6 to 12 applied in order.
2. SQL Editor file 13 applied after them: `/mnt/project-files/database-updates/13-20261116090000_production_decisions.sql`. It only adds columns, each empty or with a safe default, and can be run twice. **The code of decision 9 will fail on a database without it**, so apply it before the pull request is merged and deployed. Then run the read-only check `/mnt/project-files/database-updates/verify-6-to-13.sql` and send the result: every row should say APPLIED or OK.
3. A read-only check of live operators, certifications, work-center kinds and jobs now waiting for inspection, because the new rules will refuse records that do not meet them (risk R-46).
4. Before the first shift on the new code: tick "One operator may run two steps at once" on the kinds of work center where that is normal, and untick "must pass inspection" on any routing that needs none (risk R-47).
5. Branches told about the seventeen behaviour changes above (risk R-40).
6. You say "merge". Nothing is merged without that.

After go-live, at your pace: enter a labor rate for each kind of work center (job cost shows material only until then), and type your inspection checklists.

Rollback: revert the pull request. The columns of file 13 can stay; the older code ignores them. Costs written at receipt and rework steps created in the meantime stay on file and do no harm.

Not production-ready, whatever is merged: bill of material, calendar capacity, nonconformance, outsourced processing, machine connection, stock valuation and cost of goods. They do not exist.

### Owner decisions on the six questions (decision 9, 2026-11-15)

You answered "use the recommended option" for all six. What was built:

| Finding | Question | Built |
|---|---|---|
| L-026, K-007 (P1) | How is a job costed? | Actual cost per item from the purchase order line at receipt; pieces carry it; labor at a rate you enter per kind of work center; no overhead. Nothing is guessed: a missing rate or cost is named on the screen |
| L-024 | Should a job name its coil work orders? | Yes. Raised from the job screen; the job shows material used, made, scrap and yield |
| L-020 | How is rework done and recorded? | A rework step is added to the plan and clocked like any step |
| L-021 | Must every job pass inspection? | Yes, unless its routing is marked "no inspection" |
| L-022 | Labor rules | Certification required where the kind of work center is marked; two steps at once only where marked; clocks over 12 hours listed for the supervisor |
| L-028 | What does an inspection check? | You can type a checklist per kind of work center; the built-in list is used until you do. I wrote no standards for you |

Still yours to supply: the labor rates, the checklists, and which kinds of work center and routings get the three tick boxes.

## PHASE 8 HANDOFF

Phase 8 (shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order closeout) has **not** been started. It should take these from Phase 7:

1. **Jobs reach shipping only through inspection.** Packaging and ready-to-ship now always follow a passed inspection, for every job except one on a routing marked "no inspection" (decision 9). Phase 8 should verify that a shipment cannot be built from a job that is not ready.
2. **Cost exists per item and per job, not yet per sale.** After decision 9 an item received on a purchase order has a cost, pieces carry it, and a job has a cost. Nothing yet values a stock movement or puts cost of goods beside an invoice line, and stock received before the update has no cost (L-026, K-007). Phase 8 should build cost of goods on that base and decide what to do about uncosted stock.
3. **Dispositions stop at the record.** A failed inspection marked scrap or return to supplier moves no stock and raises no credit (L-023). Phase 8's returns and credit work meets this.
4. **Pieces, not jobs, carry the heat.** What ships is traced through coil work orders and stock. Since decision 9 a job lists the coil work orders raised for it with their heats; work orders raised without a job are still found through the order line's reservation.
5. **Sold at one branch, worked and shipped at another** is supported and tested in production. Phase 8 should test the shipping, tax (decision 7) and invoice side of the same case.
6. **Packages, drop tags, staging and the print queue** (`materialTrackingRoutes.js`, `dropTagRoutes.js`, `printQueue.js`: about 30 changing addresses) have no success-path test. They sit between production and shipping and were out of Phase 7's defect scope; Phase 8 should audit them first.
7. **Partial completion.** A job is whole: there is no partial quantity complete on a job, so a part shipment is driven by the order line, not by job progress.
8. **Open from earlier phases and relevant to Phase 8:** shipments delivered with no proof-of-delivery name (47 in QA data), freight and carrier rates (F-007), supplier invoices not matched (K-012), customer preference rules not applied (J-008), payment at web checkout (H-013, H-015).
9. **Large answers:** the scheduling run and planner preview return 8.3 MB and 1.2 MB at the largest branch. For Phase 9.
