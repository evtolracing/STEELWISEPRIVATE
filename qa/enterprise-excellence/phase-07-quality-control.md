# Phase 7: quality control

Evidence: group 5 "Quality control and nonconformance" (22 verified, 3 NOT APPLICABLE), `qa/sim/ui-phase7.cjs`, unit tests on `lib/jobGates.js`. No quality control was weakened; every change here adds a check.

## 1. The quality gate (finding L-001, P1)

Before Phase 7 a job waiting for inspection could be moved to packaging, ready to ship or complete by hand from five addresses, with an inspection open or failed. Now every job status change passes through `changeJobStatusTx`, which refuses:

- release from the inspection queue by hand: only a passed inspection moves the job on;
- any move forward while an inspection is open;
- any move to packaging, ready to ship, shipped or complete when the last inspection failed, until a new one passes.

Checked at every address that moves a job (group 5, "cannot be packed, shipped or completed by any route").

## 2. Deciding an inspection (findings L-002, L-003)

| Rule | Before | Now |
|---|---|---|
| Pass | Accepted with required checks unanswered or failed and measurements out of tolerance | 409 naming the check or the measurement |
| Conditional pass | No conditions needed; overwrote the inspector's notes; any disposition | Conditions required; earlier notes kept beneath them; only "use as is" or "sell as secondary" |
| Fail | Put the job on hold, but anyone could then move it on to ready to ship | Job goes on hold with defects and disposition on record, and stays held until a new inspection passes |
| One decision | Pass and fail at the same moment could both save | One result; the job matches it (job row lock) |
| After the decision | Could be decided again or edited | 409 |
| Who decided | Whatever name the browser sent | The signed-in user, in an audit row `INSPECTION_DECIDED` with result, disposition and where the job went |
| Who may decide | Any staff login | Quality staff and production management |
| One open inspection per job | Two could be opened | One, even when two inspectors open at once |
| Inspector | Any id | On file and active |
| Cancelled job | Could be decided | 409 |
| Edits while open | Any shape saved | Inspector on file; checklist, measurements and defects must be lists |
| Another branch | Could read and decide | 404 (L-019) |

## 3. Coil work orders and material (finding L-013)

A coil work order on quality hold cannot be completed. Holding needs a reason. Release is for quality staff and production management. Material that failed quality or is on a quality hold is not put on a work order, and a hold placed mid-run stops the completion (group 2).

## 4. Queue and figures (finding L-009)

The queue lists what is waiting, most urgent first (it listed the least urgent first), with the latest inspection, capped at 200 with the total stated; the screen says "Showing the N most urgent of M". The figures (queue, in progress, passed and failed today) are counted from the records; the pass rate is a dash when nothing was decided, not 100%.

## 5. Which jobs are inspected (finding L-021, owner decision 9)

Every job passes inspection before it can be packed or sent to the dock, including a job with no planned steps: "complete" sends such a job to the inspection queue and says so, and it cannot be moved on by hand. The one exception is a job whose routing is marked "no inspection" (a checkbox on the routing, ticked "must pass inspection" by default): its last step sends it straight to packaging. Work already in packaging or beyond when the update is applied carries on. Evidence: group 5 "a job with no planned steps goes to inspection..." and "a routing marked "no inspection"..."; two rules removed in turn, group 5 failed each time.

## 6. What an inspection checks (finding L-028, owner decision 9)

Each kind of work center can carry its own checklist: up to 40 checks, each marked required or not, typed one per line on the kinds-of-work-center screen. A new inspection of that kind of work starts with that list; an inspection already open keeps the list it started with. With no list entered the built-in list is used, unchanged. Evidence: group 5 "an inspection starts with the checklist the owner entered...".

The checks themselves are the owner's to supply. No inspection standard, tolerance or sampling plan was written for him, and this run cannot verify any checklist against a customer or industry standard.

## 7. What the product does not hold

- Sampling plans, gauge calibration, per-customer checklists: none.
- A scrap or return-to-supplier disposition is a record only; nothing follows it to stock (L-023).
- Certificates of conformance for finished work: none.
