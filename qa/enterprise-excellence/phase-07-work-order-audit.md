# Phase 7: work order audit

Scope: the job (`Job`) and the coil work order (`WorkOrder`). Evidence is the scenarios of group 1 "Work order creation and routing" (15), group 2 (15 verified) and group 7, in `qa/sim/phase7-manufacturing.mjs`, and the probe taken on the starting code.

## 1. Rules now enforced by the server

| Rule | Before Phase 7 | Now | Finding |
|---|---|---|---|
| A job needs an order line of its own order, and a starting status it may start in | Accepted a line of another order and any status | Refused with a sentence (400 or 409) | L-012 |
| No job for a cancelled order or line, or on a work center that is offline | Accepted | 409 | L-012 |
| A job follows its work center: an order sold at one branch may be worked at another, and the plan and steps sit at the work center's branch | Established practice | Unchanged. A check that refused it was added and withdrawn in this phase after the full run showed it broke the order-to-cash simulation | L-012 note |
| Planning saves steps in order at the work center's branch (the order's branch when the job names no work center), grade and thickness from the order line | Grade was written as "A36" and thickness as 0.5 when not given | Taken from the job or its line; otherwise no grade and thickness 0 (not stated) | L-010 |
| A plan with no steps, an unknown kind of work center, or thickness 0 where one was typed | Saved | Refused, nothing saved | L-012 |
| A started, finished or cancelled job cannot be planned; a plan with recorded time cannot be replaced | Replaced, losing the time entries | 409; the time is kept | L-012 |
| Two people planning at once | Two plans | One plan (job row lock) | L-012 |
| Every job status change goes through one function | Five addresses, each with its own checks | `changeJobStatusTx` in `lib/jobGates.js`: lock, move table, quality gate, open-steps gate, history row | L-001, L-006 |
| A job cannot leave production with a planned step unfinished | Could be marked complete with steps open | 409 naming the first open step. Hold and cancel still allowed | L-006 |
| Coil work order follows draft, released, started, complete | Held (Phase 2) | Unchanged; QC hold can no longer jump to complete | L-013 |
| Coil work order in a different grade from its order line | Accepted silently | Needs a substitution reason, kept in the audit log | L-013 |
| Coil work order on failed, held or in-transit material | Accepted | 409 | L-013 |

## 2. What a job record carries

Order, order line, branch (the order's), status, priority, due date, work center, routing and routing version when one was put on it, who opened it, and a history row for every move with the person. One job was followed end to end (group 7, "one job followed end to end"): order line, job, steps, time entries, inspection and shipment all point at each other.

## 3. What is not there

- A job does not name the stock it will use, and a coil work order does not name a job (L-024). Yield and scrap are therefore known per coil work order, not per job.
- No cost on either record (L-026).
- A job with no planned steps can be started and completed without an inspection being called for (L-021, the owner's question).
- Thickness is a required column on the plan; "not stated" is stored as 0 (L-029, needs a database change, deferred).

## 4. Database checks (`qa/tools/db-facts.mjs`)

Added this phase and read after the full run: a job's plan is at its work center's branch; no finished step has a clock running; no closed job has a clock running; no job is past production with an open step; no job is past inspection with a failed last inspection; one open inspection per job. Results are in `phase-07-regression-results.md`.
