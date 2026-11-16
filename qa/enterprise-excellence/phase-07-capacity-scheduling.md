# Phase 7: capacity planning and scheduling

Evidence: group 3 "Capacity planning and scheduling" (21 verified, 1 NOT APPLICABLE), unit tests on `lib/dispatchPlan.js` and `lib/capacityPlan.js`, and the 85-branch timings.

## 1. Two schedulers

| Tool | Address | What it does |
|---|---|---|
| Scheduling run | `POST /api/dispatch/run` | Places each waiting step of a branch on a work center of the right kind and puts an operator on it |
| Job planner | `/api/v1/optimization` preview, apply, what-if | Lays jobs out on work centers over time and reports load and late jobs |

## 2. Scheduling run (finding L-007)

Before: it placed steps of cancelled and held jobs, chose operators from any branch regardless of certification, used machines that were switched off, could be run twice at once (placing a step twice), could be run by another branch's planner, and wrote one row at a time.

Now the decision is one pure function, `planAssignments`, and the run:

- takes a lock per branch, so two planners at once place each step once;
- places steps of open jobs only, and leaves cancelled and held jobs alone;
- uses a work center of the step's kind, at this branch, switched on, not locked out;
- respects a recorded thickness limit, and says so where none is recorded;
- shares work between like work centers by queue length;
- puts on an operator of this branch with a current certification for that kind; when there is none the step is still placed and the gap is reported;
- states a start time only for the step at the front of each queue. It does not make up times for the rest;
- reports a step whose kind the branch does not have, instead of dropping it;
- is refused with 403 for another branch, and for people outside planning;
- run again, changes nothing.

Writes are grouped by work center, operator and queue position. At a branch with 7,090 waiting jobs the run took 45.3 seconds before and 1.9 seconds after, placing 14,180 steps.

## 3. Job planner (finding L-008)

Before: a job with no time on file was given 60 minutes, a work center with no hours was given 8 hours a day, and "apply" saved whatever it was sent, including a work center at another branch.

Now: a job takes its time from its routing (set-up plus run minutes) or its own dates; otherwise it is queued with no start or end. A work center with no hours on file has no utilisation figure. An overloaded work center is reported as a bottleneck from the figures on file, and a job that would finish after its promised date is flagged. Preview and what-if save nothing. Apply checks every line (branch, kind, on line, times in order), saves what passes, and counts only what it saved. The plan carries notes saying what it does not count.

## 4. What capacity planning is not (finding L-025, deferred)

The plan does not know shift calendars, holidays, operator availability, changeover, or work already running. `Shift` and `DowntimeRecord` exist and are empty. This is recorded NOT APPLICABLE in group 3, and the planner screen now states it. A finite-capacity scheduling engine is a build whose rules (shift patterns, overtime, changeover) are the owner's; none were invented.

## 5. Customer promises

Nothing in this phase changes a promise date. The planner flags a job that would finish late; it does not move the date. The promise-date screens remain browser-only samples (X-007, earlier phases).

## 6. Timings at 85 branches

See `phase-07-regression-results.md` section 3. Planner preview 137 ms; scheduling run at a small branch 48 ms and at the 7,090-job branch 1,859 ms; work-center queue 7 ms. Local machine, not the host.
