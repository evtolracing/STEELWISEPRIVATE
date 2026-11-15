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
