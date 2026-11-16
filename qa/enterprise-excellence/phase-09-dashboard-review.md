# Phase 9: dashboard review

Written by hand in Phase 9 (2026-11-16). Evidence: the static screen audit (`qa/tools/screen-audit.mjs`), which reads where each screen's figures come from; the scenarios named below (`qa/sim/phase9-ui.cjs`, results in `phase-09-interaction-audit.md`); and the measurements of `qa/sim/ui-audit.cjs`.

## The rule

A dashboard shows figures the server sent, or says it has none. It never shows a figure of its own. A dashboard on example figures carries the standing sample notice and is counted as a sample screen.

## The dashboards

| Dashboard | Address | Data | Verified in Phase 9 |
|---|---|---|---|
| Home | `/` | Real records | Recent orders are the server's newest orders, each a real order, and stay so after Refresh. With the server failing: no tile shows a number, no crash |
| Operations cockpit | `/ops-cockpit` | Real records | With the server failing: no tile shows a number, no crash. Its figures were not reconciled one by one with the records |
| My dashboard (by role) | `/role-dashboard` | Real records | Opens with no error for an administrator. Not reconciled |
| Sales dashboard | `/sales/dashboard` | Real records | With the server failing: no tile shows a number, no crash. Not reconciled |
| Material tracking | `/material-tracking` | Real records | With the server failing: no tile shows a number, no crash. Not reconciled |
| Order speed metrics | `/executive/compression-metrics` | Real records | With the server failing: no tile shows a number, no crash. Not reconciled |
| Quality station | `/qc` | Real records | The tab counts equal the queue the server sent; the rows are the jobs sent; no job of another branch |
| What customers owe, by age | `/orders/invoices`, "Owed by age" | Real records | The figures on screen are the figures the server sent |
| Supply position | `/purchase-orders`, tab | Real records | Asked from the server; shows a table or says there is nothing |
| Time report | `/time-tracking` | Real records | Totals come from the server; the export holds the same rows |
| Orders not closed | `/orders/closeout` | Real records | Verified in Phase 8 (the list agrees with each order) |
| Executive cockpit, simulation, forecast, decisions, digital twin | `/executive/...` | Example figures, marked | Sample screens. Not judged |
| Quality, maintenance, safety, training, contractor dashboards | several | Example figures, marked | Sample screens. Not judged |

## The scenario that guards the rule

"dashboards show no figure the server did not send: with the server failing, no tile shows a number". Every call from six real dashboards is made to fail, and the screen is read for any heading that is a number other than zero. None shows one, and none crashes. A dashboard that carried a figure in its own code would fail this; the static check `qa/tools/frontend-checks.mjs` separately fails any screen that invents a record when the server fails (0 today).

This proves the absence of invented figures. It does not prove that each real figure is the right one.

## What was not done

- **Figure-by-figure reconciliation** of the operations cockpit, the sales dashboard, the role dashboard, material tracking and order speed metrics against the records. The lists and record pages those figures summarise were reconciled in Phases 5 to 8 and on screen in Phase 9; the summaries themselves were not. Recorded in `testing-gap-analysis.md` since Phase 1 (gap 8) and handed to Phase 11, whose full simulation cycles produce known totals to compare with.
- **No dashboard was redesigned.** Which figures a manager needs first is a question for the people who run the branches. None was added, removed or reordered.
- **Role dashboards.** The role dashboard exists and reads real records. Roles that do floor or desk work now start at their workspace, not at a dashboard (`phase-09-role-workspaces.md`).
- **Charts** have no text alternative (see `phase-09-accessibility.md`).
- **Refresh.** Dashboards do not update by themselves; the home dashboard has a Refresh for recent orders. Stale figures on a screen left open are possible and the screens do not say when they were read.

## Findings

No new finding of invented data on a dashboard that claims to be real. The sample dashboards stay under U-037 and U-040 (owner decision 4).
