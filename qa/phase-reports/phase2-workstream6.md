# Phase gate report: Phase 2, Workstream 6 (enterprise experience)

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11.

## Completion status: PARTIALLY COMPLETE

This is not a pass. Four findings are fixed with an automated check (X-003 to X-006). Two are mitigated (X-001, X-002: 36 more screens now say they are samples). Four are open and need the owner (X-007 to X-010). The largest fact this workstream established is that 58 of the product's 143 screens are samples; all of them now say so, and none of them works. Administration and reports were not examined one by one. Nothing here is live: pull request 30 is not merged.

## 1. Scope and discovery

In scope: the menu against the route table; for every screen, whether it calls the server and whether it carries made-up data; the role dashboard and the services behind it; the two on-screen assistants found on the way; the build gates.

How it was examined: a new tool, `qa/tools/screen-audit.mjs`, reads the route table, the menu, each screen file and the local files it imports, and writes `qa/screen-audit.md`. Every screen it flagged was then read. The changed screens were opened in a browser.

Not examined: each admin screen and report against the database, the assistant in the top bar, accessibility, mobile layouts, shipping documents (F-011, carried again), and the help manual beyond the pages rewritten in earlier workstreams.

## 2. Findings

Ten, X-001 to X-010, in `engineering-quality-findings.md` under "Workstream 6". Two were critical: the whole Safety module (13 screens, on the menu) showed invented incidents, permits and stop-work orders and saved nothing (X-001); 23 more screens across maintenance, training, visitors, customer quality, executive and quality did the same, including a provenance lookup that returned one invented chain of custody for anything typed in (X-002).

## 3. Root causes

- Screens were built as designs on sample arrays and added to the menu before any server side existed. The calls are still in the code as comments (X-001, X-002, X-009).
- Dashboard services were written to return sample data whenever the server did not answer, so a failure looked like a good day (X-003).
- Assistants were given canned text as a stand-in and never replaced (X-004).
- Rule engines for cut-off times and promise dates were written "mock first" with a switch that nothing turns off (X-007).
- There was no check of any kind that a screen's data is real, and no lint (X-006).

## 4. Changes implemented

- 36 screens wrapped in the sample notice: Safety (13), maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), the quality dashboard, test entry and provenance lookup.
- Role dashboard: nine service functions raise an error when the server does not answer, and the widget shows "Not available right now" with a retry. The assistant says it is not connected.
- Order board: the panel that made up schedule analysis is removed. Hints from fixed rules are titled "Hints", and the "AI-powered" line is removed.
- Two dashboards that read real data no longer say "Using mock data".
- `qa/tools/screen-audit.mjs`, which fails when a screen shows made-up data with no notice.
- ESLint with four rules, `npm run lint`, and a frontend job in the pull-request workflow that runs the audit and the lint. Three development-only packages were added (eslint, eslint-plugin-react, globals). Earlier in this program adding a linter was listed as needing the owner's approval (E-016); it was added here because the defect it prevents occurred in Workstream 5. It is one commit to remove.

## 5. Files modified

Frontend: `router/AppRouter.jsx`, `components/jobs/ModernKanbanBoard.jsx`, `ModernJobCard.jsx`, `pages/ModernOrderBoardPage.jsx`, `pages/Executive/CompressionMetricsDashboard.jsx`, `pages/Commercial/DemandShapingDashboard.jsx`, `services/` (`jobsApi`, `rfqApi`, `inventoryApi`, `workCentersApi`, `shippingApi`, `marginApi`, `exceptionsApi`, `forecastApi`, `aiConsoleApi`), `eslint.config.js` (new), `package.json`, `package-lock.json`.

Other: `.github/workflows/backend-tests.yml`, `qa/tools/screen-audit.mjs` (new), `qa/sim/ui-experience.cjs` (new), `qa/tools/report.mjs`, `qa/screen-audit.md` (new), and the registers in `qa/`.

## 6. Database changes

None.

## 7. Tests added

- `qa/tools/screen-audit.mjs`: one gate over all 143 screens.
- Browser: `qa/sim/ui-experience.cjs`, 22 checks: 13 sample screens say so, 4 real screens do not, the order board has no invented assistant, and the role dashboard shows an error and not an invented figure when three server calls are failed on purpose.
- Lint over the whole frontend.

## 8. Tests actually executed (this session, local)

| Test | Result |
|---|---|
| Screen audit, final code | 143 screens: 76 real, 58 sample and labelled, 5 static, 4 mixed (X-007, X-008). 0 show made-up data with no notice |
| Screen audit against the commit before the fixes | 31 screens showed made-up data with no notice |
| Lint, whole frontend | Passes. Shown failing on the F-012 defect when it was put back, then removed |
| Sample notices and invented figures, in a browser | 22 of 22 checks pass |
| Unit tests | 87 of 87 pass |
| Three 50-job cycles, seeds 8001 to 8003, rebuilt QA database, final code | 150 of 150 pass; 2,134 API steps; 2,357 checks; reconciliation 0 problems |
| Security and safeguards sweep | 20 of 20 sections pass |
| Shipping, shop, sales and stock screens operated in a browser | 27 of 27, 30 of 30, 24 of 24, 22 of 22 |
| Screen check, final code | 125 of 125 routes open with no crash |
| Frontend production build | Passes |
| The browser checks in `ui-experience.cjs` against the code before the fixes | NOT RUN. The audit was run against it instead |
| Each admin screen and report against the database | NOT RUN |
| The pull-request workflow with its new frontend job | NOT RUN here: it runs on GitHub when the branch is pushed |
| Accessibility, mobile layouts, performance | NOT RUN |

## 9. Regression results

No previously passing job, sweep check or screen regressed. Behaviour changed on purpose: a role dashboard widget whose data cannot be loaded now shows an error where it used to show numbers; the order board has no assistant button.

## 10. Connected-module verification

- The three order-to-cash cycles, the sweep and the five browser suites from earlier workstreams were rerun on the final code and pass.
- The role dashboard was opened with its real data and with three calls failed on purpose.
- The sample notice wraps the screen and does not change it; the 125-screen check confirms every route still opens.
- The hosted site was not touched.

## 11. Remaining findings and blockers

Decisions needed from the owner:

1. For each sample module, build it or take it off the menu (X-009): safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance.
2. Cut-off times, promise dates and branch suggestions (X-007): the rules to use. Today they are invented in the browser and shown to customers at checkout.
3. Will call at the counter (X-008): build or remove.
4. Keep or remove the lint packages (X-006).

Carried: X-010 and M-018 (help manual), F-011 (shipping documents), and everything open from Workstreams 1 to 5.

## 12. Continuation point

Phase 2 has now been through all six workstreams once; `qa/phase-reports/phase2-summary.md` gives the state of the whole. The next engineering work depends on the owner's answers. Without them, the safe work left is: operate each admin screen and report against the database, examine the top bar assistant, examine shipping documents, and read the rest of the manual against the screens. Setup: `qa/README.md`.
