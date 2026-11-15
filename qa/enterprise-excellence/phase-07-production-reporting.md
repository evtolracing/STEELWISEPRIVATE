# Phase 7: production reporting and figures

Every figure below is counted from records by the server. After this phase none is made up (findings L-008, L-009, L-010).

| Figure or list | Address | Defect found | Now | Scenario |
|---|---|---|---|---|
| Job counts by status | `GET /api/jobs/stats/summary` | The branch filter was ignored | Filter applied | Group 3, group 7 |
| Late and at-risk jobs | `GET /api/jobs/sla-risk` | Left out jobs waiting for inspection; a negative or huge window was accepted; read every job | Every unfinished status, overdue first; a nonsense window is 400; filtered in the query; at most 500 with `listLimited` | Group 3 |
| Shop-floor figures | `GET /api/dispatch/stats` | Counted steps of cancelled and closed jobs as waiting work | Waiting, scheduled, in process and unassigned count open jobs only; complete counts all | Group 7 "the shop-floor figures count work still to do on open jobs only, and agree with the queue" |
| Steps list | `GET /api/operations` | Unbounded (14.7 MB at the big branch) | 500 by default, 2,000 at most, with the total | Group 4 |
| Inspection queue | `GET /api/qc/queue` | Least urgent first; unbounded | Most urgent first; 200 by default with the total | Group 5; `ui-phase7` |
| Quality figures | `GET /api/qc/stats` | Pass rate 100% when nothing was decided | Null, shown as a dash | Group 5 |
| Work-center utilisation | Planner | 8 hours a day assumed | Only where hours are on file | Group 3 |
| Bottlenecks and late flags | Planner | From assumed times | From figures on file | Group 3 |
| Cockpit recommendations | `routes/opsCockpit.js` | "Expedite" set priority to a fixed value on any job; "rebalance" moved running work to unlike machines | Up by one to at most 5, open jobs only; rebalance between like machines at one branch, waiting work only (L-017) | Group 7 |

## Not available, and not invented

- Overall equipment effectiveness, machine availability, downtime by cause: no machine data (L-030).
- Cost per job, margin (L-026).
- First-pass yield across jobs: an inspection result exists per job, but no report totals it. Not built; no request on file.
- On-time production against a calendar plan (L-025).
- Operator productivity: time entries exist; no standard times are on file to compare against, and none were invented.

## Reconciliation

The database checks added to `qa/tools/db-facts.mjs` this phase compare the figures' sources with each other (queue against job status, clocks against step status, plan branch against order branch). Results after the full run are in `phase-07-regression-results.md`.
