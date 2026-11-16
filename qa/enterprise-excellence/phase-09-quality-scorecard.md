# Phase 9: quality scorecard for screens, navigation, access and interaction

Scores are a judgement from the evidence named, not a measurement, on the scale of `quality-scorecard.md` (target 95). A subject with no evidence is NOT ASSESSED and gets no number. The whole-system scorecard is rebuilt by `qa/tools/excellence-docs.mjs`; the Phase 9 adjustments to "User experience" and "Accessibility" in each module group are in `phase-state.json`, each with its evidence and what holds it back.

Everything here was measured on a local machine against a local database whose name contains `qa`. No real user, no real phone or tablet, no shop terminal and no screen reader user took part. That one fact holds every score below 90.

| Subject | Score | Evidence | Held back by |
|---|---:|---|---|
| Screen inventory | 90 | Every address the router serves opened in a browser at three sizes and classified by a stated rule (`phase-09-screen-inventory.md`); the static audit agrees on which screens are samples | Opened as an administrator only at all three sizes; other roles are covered by scenarios on the main screens, not on every screen |
| Design system (theme) | 78 | Theme audited and corrected in place: contrast of the secondary text, focus ring, touch sizes, reduced motion, status colours in one place (`phase-09-design-system-audit.md`); brand colours kept | 94 files still set colours of their own (V-035); tables and dialogs are built per screen (V-036) |
| Navigation and search | 86 | One search that reads real records under the server's own branch and role rules; page titles; skip link; Page not found; retired addresses lead on; Work Orders in the menu (V-038); 43 navigation scenarios | Six real screens are reached only from their parent screens, left for the owner (V-038 note); breadcrumbs exist on few screens |
| Role workspaces | 84 | Each of the 17 roles starts on its own page and is refused, in the menu, by address and by the server, what it may not open; one scenario per role (`phase-09-role-workspaces.md`) | The start page per role is a judgement the owner has not yet seen (R-60); no saved personal layout |
| Dashboards | 70 | No dashboard shows a figure the server did not send, with the server up or failing; sample dashboards carry a standing notice (`phase-09-dashboard-review.md`) | Five dashboards are not reconciled tile by tile to the records (V-037, Phase 11); 58 sample screens remain samples by owner decision 4 |
| Data tables | 74 | Names, header cells, keyboard row opening, scrolling inside the frame on a phone and empty states verified on the main lists; the order board pages its columns (V-026) | No one table component (V-036); sorting and paging differ by screen; lists still fetch whole sets on three boards (V-027) |
| Forms and validation | 84 | 41 scenarios: required fields, the server's refusal shown in its own words, nothing saved on refusal, double press safe, unsaved-work warning on order entry; fields labelled on every screen (`phase-09-forms-validation.md`) | The unsaved-work warning covers order entry only (V-018); no draft recovery after a closed tab |
| Buttons and actions | 80 | 206 buttons with no action found: 34 connected, 172 say "not built" and send nothing, 0 left; 10 false "saved" messages removed; 26 browser boxes replaced; 1,093 checks press controls and compare with the record | Not every one of the 24,795 measured controls was pressed and read (`phase-09-interaction-audit.md` states the limit) |
| Dialogs and drawers | 80 | One application dialog for every question and notice, with focus kept inside, Escape, and a required reason where the server needs one; drawer is a landmark and closes on Escape | 98 files draw dialogs of their own; where focus returns after closing was verified on the main ones only (V-029) |
| Loading, empty and error states | 82 | Failure group: 24 scenarios with the server failing, slow or refusing; no screen invents a record (ratchet at 0) | Verified on the main screens; sample screens have no such states |
| Session and unsaved work | 82 | Session expiry returns the person to the page they were on; leaving a changed order asks first | Other long forms do not ask (V-018) |
| Responsive layout | 80 | 0 screens wider than the window at 1440, 768 and 390; touch targets under 24 by 24: 458 to 3; scenarios at 1920 and 360 wide, twice-size text and a phone on its side | A browser's window sizes, not devices; no shop terminal, glove or scanner |
| Accessibility | 70 | Controls with no name 613 to 0; fields with no label 280 to 0; hard-to-read texts 1,751 to 17; one main heading per screen; keyboard reach of 87 rows and cards; focus ring; announcements; reduced motion | **Not a WCAG certificate.** No screen reader user, no switch or voice user. The 17 hard-to-read texts left are on four screens, three of them samples (V-011). Focus return (V-029) |
| Front-end performance | 80 | Production build measured on 20 main screens (median heading 654 ms, quiet 1,154 ms); order board block 1,175 ms to about 500 ms; one wasted call per page removed (`phase-09-frontend-performance.md`) | Local machine; not at 85-branch data; three boards fetch everything (V-027) |
| Productivity | NOT ASSESSED as a score | Five tasks counted in keys and clicks (`phase-09-productivity-results.md`). There is no "before" time for most, and no real user | No minutes-saved figure is claimed |
| Branch and role isolation on screens | 88 | Role scenarios; the search shows nothing the lists would not; the shop floor opens on the operator's branch (V-021); security sweep and branch boundary suite pass in the full run | The dispatch and work-centre answers can still be asked for another branch by address (V-028, Phase 10) |
| Regression | see `phase-09-regression-results.md` | Full run on a rebuilt database, then a second browser run on the final code | |

## The Phase 9 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Complete UI inventory | PASS | 154 addresses opened and classified; controls counted per screen and kind; what was not pressed is stated |
| B. Design system consistency | PARTIAL | The theme is corrected and the access behaviours are the same everywhere, held by ratchets. 94 files with colours of their own and hand-built tables remain (V-035, V-036, Phase 12). Brand kept |
| C. Functional interactions | PASS for the real screens, with a stated limit | Every fault the scenarios found is fixed and proven; no open P0 or P1. Not every control was pressed |
| D. Role-based experience | PASS | 17 roles, menu, address and server; restricted amounts stay hidden (F-009, N-020 scenarios) |
| E. Responsive design | PASS in a browser's window sizes | 0 sideways scroll on any screen at three sizes; main workflows run at phone width. Devices NOT VERIFIED |
| F. Accessibility | PASS for the automated and keyboard checks; manual verification NOT DONE | See `phase-09-accessibility.md`, "Not verified" |
| G. Productivity | PASS with a stated limit | Five tasks measured; unnecessary steps removed where found; controls and confirmations kept |
| H. Performance | PASS on the local machine | One bottleneck found and fixed; the host and scale are NOT VERIFIED |
| I. Regression | see `phase-09-regression-results.md` | |

## The directive's gates A to J

| Gate | Result | Basis |
|---|---|---|
| A. Scope understood | PASS | Screen, component and control inventories |
| B. Requirements met | PARTIAL | What is built is corrected and verified by tool. Component merging, the remaining colours and dashboard reconciliation are deferred with reasons; sample screens stay samples by owner decision 4 |
| C. Defects reproduced before correction | PASS | The baseline audit and the first scenario runs recorded each fault before its fix |
| D. Corrections minimal and in place | PASS | No screen rebuilt; Material UI kept; no dependency added; no TypeScript; codemods for the repeated faults |
| E. Automated checks fail without the fix | PASS | 27 fixes removed one at a time; each failed a scenario (`qa/results/phase9-mutations.json`). The counted faults are ratchets that fail the gate run if a count rises |
| F. Regression | see `phase-09-regression-results.md` | |
| G. Performance | PASS on the local machine | `phase-09-frontend-performance.md` |
| H. Security | PASS for what Phase 9 touched | Sweep and branch boundary in the full run; V-028 recorded for Phase 10 |
| I. Documentation | PASS | The 15 Phase 9 documents; registers updated |
| J. Readiness | CONDITIONAL | `phase-09-report.md`, "Production readiness" |
