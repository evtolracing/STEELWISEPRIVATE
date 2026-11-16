# Phase 7: shop-floor execution

Evidence: group 4 (22 verified, 1 NOT APPLICABLE), group 7, `qa/sim/phase2-integrity.mjs` (82 checks), unit tests on `lib/productionRules.js`.

## 1. State rules for a step (finding L-004)

Decided on the locked plan, in one transaction, by `lib/productionRules.js`.

| Action | Allowed when | Otherwise |
|---|---|---|
| Start | The step is waiting or paused; the job is open, not on hold and not past production; every earlier step is finished (owner decision 8) | 409 with the reason |
| Pause | A clock is running | 409 |
| Finish | The step was started | 409 "was never started" |
| Start again | Not after it is finished | 409 |
| Reassign | Only to a work center and operator that could run it; a running clock is paused by the move | 409 |

Planned order is one setting, `production.rules.stepsInOrder`, on by default by the owner's decision of 2026-11-15. With it off, steps may run in any order; switching it on applies at once (group 4).

## 2. Who and where (finding L-005)

A step is run on a work center of its own kind, at the branch where the job is planned, switched on and not locked out, by an operator who is on file, active, at that branch, and whose certification for that kind has not lapsed. Each refusal names what is wrong, including the certification and its expiry date.

## 3. Job moves that follow from steps

- Starting the first step moves the job into production, once.
- Finishing the last step sends the job to inspection, once. Finishing it again changes nothing. Two people finishing it at the same moment send it once (group 7).
- A job put on hold while its last step runs stays on hold when the step is finished.
- A job cannot leave production with a planned step unfinished (L-006).
- Cancelling a job stops its running clocks at that moment with the reason "Job cancelled" (L-018). Before, the clock ran for ever and the operator could not be freed.
- A job stuck in production with every step finished can be sent on by hand (group 7), so nothing is trapped.

## 4. Concurrency and recovery

Raced in the scenarios, each ending in one consistent state: two operators starting one step (one clock); finish and pause together; two planners; two status moves (one saved, one history chain); cancel against the last finish. A step left running across a gap is still running, can be paused, and its time is what the clock says. A refused request saves nothing.

## 5. Branch isolation (finding L-019)

Time entries, inspections and operators are now branch-owned in `lib/branchScope.js`. From another branch: view, start, pause, finish and reassign answer 404; lists do not include them. People outside production cannot change shop-floor records.

## 6. Not built

- One operator on two steps at once is refused, unless every kind of work center involved is marked for it (L-022, owner decision 9). Where it is marked, both clocks are on record.
- Machine time, downtime and telemetry: no machine is connected (L-030).
- No equipment was triggered in testing; there is nothing to trigger.
