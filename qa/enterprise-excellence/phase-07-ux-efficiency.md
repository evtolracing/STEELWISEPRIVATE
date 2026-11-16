# Phase 7: shop-floor user experience and efficiency

## 1. What was checked in a browser

`qa/sim/ui-phase7.cjs`, 21 checks, 0 failed, run in this session against the QA server:

- the quality queue opens on real records and states how many are shown of how many are waiting;
- an inspection: a conditional pass asks for conditions and offers only the two dispositions that fit;
- the shop floor shows the server's sentence when scheduling places nothing or reports a gap;
- a new work center gets no default limits;
- the planner shows its notes (what it does not count);
- the same screens at phone width (390 px): no sideways scroll, actions reachable.

The older shop suite (`ui-shop`) is in the full run.

## 2. Changes a person on the floor will notice

Each refusal is one plain sentence that names the thing in the way.

| Situation | Message says |
|---|---|
| Starting step 2 before step 1 | Which step must be finished first |
| Wrong machine | The kind of work center the step needs |
| Lapsed certification | The certification and the date it expired |
| Machine locked out | The machine and the maintenance order |
| Passing an inspection with a check unanswered | Which check |
| Releasing a job from inspection by hand | That only a passed inspection moves it on |
| Completing a job with a step open | The first open step |
| A second step for an operator already clocked on (decision 9) | The step and job already running, and that this kind of work is not marked for two at once |
| No certification where one is required (decision 9) | That none is on file, and to add it to the operator's record |
| Moving a job that has not been inspected (decision 9) | That it has not been inspected, and that it moves on when an inspection is passed |
| Job cost with a rate or a material cost missing (decision 9) | "Total so far", and what is missing by name |

## 3. Efficiency

No minutes-saved figure is claimed: no real user was timed. Measured instead:

- the scheduling run at the largest branch: 45 s to 1.9 s;
- the late list: 653 ms to 74 ms;
- the inspection queue: 303 ms and 3.7 MB to 76 ms and 441 KB.

## 4. Accessibility

NOT ASSESSED beyond the above. The MUI controls on the changed screens keep their labels (the browser checks find them by label and role). A keyboard-only pass, screen-reader pass and contrast audit of the shop-floor screens were not done and belong to Phase 9 with the items already deferred there (K-014).

## 5. Gaps

- No screen sets a work center's hours per day (L-025).
- No tablet or kiosk mode with large targets for gloved hands; the screens are the desktop ones, usable at phone width. Not built; no request on file.
- No barcode start and stop at the machine (no hardware: K-013).

## Screens added or changed for owner decision 9

| Screen | Change | Checked in a browser |
|---|---|---|
| Job | A Material section (work orders cut for the job, weight used, made, scrap, yield) with "Cut material for this job"; a Cost section for cost roles, with a plain warning when a figure is missing and the sentence that no overhead is included | Yes (`qa/sim/ui-phase7.cjs`) |
| New work order | Opened from a job, it says which job it is for and sends the link | Yes |
| Work order | Shows "For job" with a link | Yes |
| Time tracking | A notice listing clocks running longer than the hours on file | Yes |
| Kinds of work center | Two tick boxes ("An operator needs a current certification to run it"; "One operator may run two steps at once"), a labor rate shown only to cost roles, and a checklist typed one check per line. Ticking, typing and saving are checked against the database | Yes |
| Routing | A tick box "Jobs on this routing must pass inspection", with a warning when unticked. Saving is checked against the database | Yes |

The routing check found a defect that was already there: the routing screen stopped with an error on a routing whose step had no list of parameters (L-031, fixed).
