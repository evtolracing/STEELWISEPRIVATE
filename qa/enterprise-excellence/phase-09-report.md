# Phase 9 of 12: final execution report

User interface, user experience, design system, role workspaces, navigation, responsive design, accessibility, workflow productivity and interaction verification.

Date: 2026-11-16. Branch `claude/project-thread-25z3jd`, stacked on owner decision 10, so pull request 32 carries both. Not merged. Phase 9 changes no database structure and has no SQL Editor file. Everything below was run in this session on a local machine against a local database whose name contains `qa`. Nothing was run against the live database or the host.

## FINAL STATUS

**IMPLEMENTED — VERIFICATION INCOMPLETE**

Why this status and not VERIFIED COMPLETE:

- What Phase 9 built is in place and verified by tool: 232 of 232 scenarios (1,093 checks) in one pass on the final code, 27 fixes proven by removing each, every screen measured at three sizes, and a full regression run of Phases 2 to 8 with every database check unchanged.
- Verification that the prompt asks for and that could not be done here: no real phone, tablet or shop terminal; no screen reader, switch or voice user; no member of staff; not the host. Accessibility is measured, not certified.
- The zero-omission audit of controls is met for a name, a label, keyboard reach and an action on every control, by tool. It is not met for "pressed and its effect read": that was done for the controls of the main workflows, not for all 24,795 measured.
- Five dashboards are not reconciled figure by figure (V-037), and 58 screens remain samples under a notice by owner decision 4.

No confirmed P0 or P1 fault found in Phase 9 is open: the five P1 findings (V-006, V-008, V-012, V-020, V-022) are VERIFIED FIXED.

Against the 25 completion requirements of the prompt: 1 to 14, 17 to 21 and 23 to 25 are met with the limits stated in each document. 15 (responsive) and 16 (accessibility) are met in a browser's window sizes and by automated and keyboard checks only. 22 is met.

## UI/UX DISCOVERY

| Item | Count | Source |
|---|---:|---|
| Addresses the router serves, each opened in a browser | 154 | `phase-09-screen-inventory.md` |
| Screens by class | VERIFIED FUNCTIONAL 45; FUNCTIONAL BUT SUBSTANDARD 40; PARTIALLY FUNCTIONAL 4; PLACEHOLDER (sample) 58; NOT APPLICABLE 7; BROKEN 0; DISCONNECTED 0 | same |
| JavaScript and JSX files read | 404, of which 154 under `pages/` and `apps/` | `phase-09-component-inventory.md` |
| Interactive controls measured | 24,795 at desktop size, each screen read again at tablet and phone size | `phase-09-interaction-audit.md` |
| Roles tested | 17, one navigation scenario each, plus role checks in each workflow group | `phase-09-role-workspaces.md` |
| Sizes | 1440 by 900, 768 by 1024 and 390 by 844 on every screen; 1920 wide, 360 wide, a phone on its side and text at twice the size on the main screens | `phase-09-responsive-design.md` |

One browser engine (Chromium) at set window sizes. No device.

The Phase 1 to 8 documents were read first. Seventeen findings from earlier phases had been pointed at this phase; each now has an outcome (below).

## DESIGN IMPROVEMENTS

**Design system** (`phase-09-design-system-audit.md`). The existing Material UI theme was audited and corrected in place. Named tokens for brand, text, surfaces, status, corners, spacing and layout; status colours that read on white and on their tints; one focus ring that component styles cannot override; minimum touch sizes; no animation for a person who asks for less motion. Brand colours, typeface and name are unchanged. No dependency, no second styling system, no TypeScript.

**Navigation** (`phase-09-navigation-review.md`). The search box in the top bar did nothing; it now finds pages and orders, customers, stock, heats and shipments, under the server's own branch and role rules, from anywhere with Ctrl+K. Every page has its own browser title and one main heading. A skip link. An unknown address says "Page not found". A session that ends returns the person to the page they were on. Work Orders is in the menu (V-038). The invented notifications bell is removed until notices exist.

**Role workspaces** (`phase-09-role-workspaces.md`). Each of the 17 roles starts on the page of its work and is refused what it may not open in the menu, by address and by the server.

**Dashboards** (`phase-09-dashboard-review.md`). No dashboard was redesigned. Verified: no real dashboard shows a figure the server did not send, with the server up or failing.

**Forms** (`phase-09-forms-validation.md`). Every field has a label (280 had none). Required is a property of the field. Twelve dialogs worked by scenario: named, keyboard kept inside, Escape sends nothing, an empty form cannot be saved. Leaving a half-entered order asks first.

**Responsive** (`phase-09-responsive-design.md`). 0 screens scroll sideways at any of the three sizes. Touch targets under 24 by 24 on a phone: 458 before, 3 now. The menu is a drawer below 1200 pixels and keeps the keyboard inside while open.

**Accessibility** (`phase-09-accessibility.md`). Measured on every screen, before (130 screens) and now (154 screens; the later run also opens record pages):

| Measure | Before | Now |
|---|---:|---:|
| Controls with no name | 613 | 0 |
| Fields with no label | 280 | 0 |
| Hard-to-read texts (under 4.5 to 1) | 1,751 | 17 on 4 screens |
| Screens with no main heading | 129 | 0 |
| Rows and cards that opened only on a click | 87 | 0 |
| Touch targets too small on a phone | 458 | 3 |

This is not a certificate of conformance to WCAG 2.2 AA.

## FUNCTIONAL CORRECTIONS

Thirty-eight findings were recorded in Phase 9 (V-001 to V-038). Twenty-nine are VERIFIED FIXED.

| Kind | What was corrected | Findings |
|---|---|---|
| Broken actions | An order's money on screen disagreed with the record; a double click on "Dispatch now" dispatched and then cancelled; the customers page crashed on an unreadable answer; the shop floor opened on the wrong branch; the order search narrowed nothing | V-020, V-022, V-023, V-021, V-019 |
| Disconnected controls | 206 buttons had no action. 34 were connected. 172 on sample screens now answer "is not built yet. Nothing was saved or sent." The search, Help and settings controls of the shell work. Two "Duplicate" buttons on real screens were removed and the question put to the owner | V-001, V-002, V-007, V-030 |
| False confirmations | Ten forms on sample and counter screens announced "created", "saved", "booked" or "sent" with nothing saved. They now say it is not built | V-008 |
| Invented data in the shell | The notifications bell (a fixed count and three made-up notices) and fixed initials on the counter sale screen | V-003, V-032 |
| Validation and forms | Required fields; unsaved order warning; refusals shown as the server's reason with entries kept | V-024, V-017 |
| Error handling | Page not found; session expiry; 26 browser boxes replaced by the application's dialogs, one of which asks for the reason the server requires | V-014, V-005, V-009 |
| Backend integration | The order list's search now narrows on the server; the stock list carries the stock state so an item on a transfer shows "In Transit" (K-014, open since Phase 6); one wasted call per page load removed | V-019, K-014, V-025 |
| Performance | The order board drew every job at once | V-026 |

Server code changed in two places only, both read paths: the order list search and one field added to the stock list answer. No business rule, permission or validation was changed or removed.

### Findings not fixed, each with its outcome

| Finding | Sev | Outcome | Why and where it goes |
|---|---|---|---|
| V-027 Three boards fetch every job | P2 | DEFERRED TO SPECIFIC PHASE | Phase 11, with scale data. The visible fault (V-026) is fixed |
| V-028 Dispatch routes answer another branch's work centres if asked directly | P2 | DEFERRED TO SPECIFIC PHASE | Phase 10. No screen asks; names and types only |
| V-037 Five dashboards not reconciled to the records | P2 | DEFERRED TO SPECIFIC PHASE | Phase 11, on a data set with known totals |
| V-011 Hard-to-read texts that remain | P3 | DEFERRED TO SPECIFIC PHASE | Phase 12, with the sample screens they sit on |
| V-018 Other long forms have no unsaved-work warning | P3 | DEFERRED TO SPECIFIC PHASE | Phase 12 |
| V-029 Dialogs open with focus on the dialog, not the first field | P3 | DEFERRED TO SPECIFIC PHASE | Phase 12 |
| V-035 94 files set colours of their own | P3 | DEFERRED TO SPECIFIC PHASE | Phase 12. Replacing them is the uncontrolled redesign the prompt forbids |
| V-036 Tables and dialogs built per screen | P3 | DEFERRED TO SPECIFIC PHASE | Phase 12. Merging 109 tables is a rebuild |
| V-030 Duplicate an order | P3 | REQUIRES BUSINESS DECISION | The owner's: build it or leave it out |
| V-031 Branch and cutoff in the top bar | P3 | ACCEPTED RISK WITH APPROVAL | The promise-date logic the owner left as it is in decision 10 |

Each deferred finding carries its reason, target phase, dependencies, correction, acceptance and verification in `findings-register.md`.

### The 17 findings carried into Phase 9

| Outcome | Findings |
|---|---|
| VERIFIED FIXED | B-015, J-013, K-014, U-020, U-028 |
| ACCEPTED RISK WITH APPROVAL (owner decision 10) | U-008, U-041 |
| DEFERRED TO SPECIFIC PHASE: Phase 12, with the sample modules of owner decision 4 | U-004, U-019, U-022, U-029, U-035, U-037, U-040, B-024, E-021 |
| DEFERRED TO SPECIFIC PHASE: Phase 10 | G-020 |

### Behaviour that changes for staff

1. After sign-in each role lands on the page of its work, not on one shared dashboard.
2. The search box in the top bar works. Ctrl+K reaches it.
3. Work Orders is in the Production section of the menu.
4. The notifications bell is gone until notices are built.
5. Buttons on sample screens that did nothing, or claimed a save, now say "not built. Nothing was saved or sent."
6. Questions such as "Cancel this shipment?" appear in the application's own dialog, not the browser's box.
7. A stock item on a transfer shows "In Transit" in the stock list.
8. Leaving a half-entered order asks first.
9. A session that ends brings the person back to the same page after signing in.
10. The order board shows the 30 most urgent cards of a column and a "Show more" button.

## PRODUCTIVITY

`phase-09-productivity-results.md`. Five frequent tasks were run by tool and counted.

| Task | Now | Before |
|---|---|---|
| Find an order by number and open it, from any screen | 2 keys and 8 typed characters | Not possible from the top bar: open the menu, the order list, type in its filter, click the row |
| A shipping coordinator signs in and reaches the shipping desk | Sign in; lands there | Sign in, then find Shipping in the menu |
| Reach the page content by keyboard | 2 keys | 122 stops through the menu first |
| Open a stock item from the list without a mouse | Enter on the row | Not possible |
| Come back to the same page after the session ends | Sign in; back on the page | Sign in, then find the page again |

No duplicate entry was found on the real screens in Phase 9 beyond what Phases 5 to 8 removed. No minutes-saved figure is claimed: no member of staff was timed and most tasks have no measured "before".

## VERIFICATION

`phase-09-regression-results.md` has every figure and the source file of each.

**Tests added in Phase 9**

- `qa/sim/phase9-ui.cjs`: 232 browser scenarios in eight groups, 1,093 checks.
- `qa/sim/ui-audit.cjs` with `qa/tools/ui-audit-gate.cjs`: every screen at three sizes, held by ceilings that may only fall.
- `qa/tools/frontend-checks.mjs`: static counts held at 0 (icon buttons with no name, fields with no name, pages with no heading, buttons with no action, browser boxes).
- `qa/tools/phase9-mutations.cjs`: removes a fix, runs its scenario, restores the source.
- `qa/tools/frontend-performance.cjs`, `qa/tools/productivity.cjs`.
- All of them run in `qa/tools/run-gates.sh`.

**Scenarios, second run on the final code, one pass**

| Group | Required | Passed | Failed |
|---|---:|---:|---:|
| Navigation, layout and role access | 25 | 43 | 0 |
| Forms, dialogs, validation and actions | 35 | 41 | 0 |
| Sales and customer workflows | 25 | 26 | 0 |
| Inventory and purchasing workflows | 25 | 27 | 0 |
| Manufacturing workflows | 25 | 26 | 0 |
| Shipping and closeout workflows | 25 | 25 | 0 |
| Responsive and accessibility | 20 | 20 | 0 |
| Failure and recovery | 20 | 24 | 0 |
| All | 200 | 232 | 0 |

**Two runs, reported as two**

1. The full run on a rebuilt database: Phase 3 to 8 scenarios 618 of 618; Phase 2 integrity 82 checks and branch boundary 39 checks, 0 problems; unit tests 209 of 209; security sweep 414 checks, all pass; ten earlier browser suites 286 checks, 0 failed; Phase 9 scenarios **230 of 231, 1 failed**. All 75 database checks equal the last run before Phase 9. The same four planted server errors as in Phase 8 and no other.
2. What that run found was fixed: the failed scenario was a real fault (Work Orders missing from the menu, V-038); hard-to-read colours on four real screens; one missing heading; one lint error in a QA tool. The measure of hard-to-read text was also corrected, because on one self-refreshing screen it had counted text caught while fading in; it now keeps a pair only if a second look finds it too.
3. The second browser run on the final code: lint 0 errors; build made; ten earlier browser suites 286 checks, 0 failed; Phase 9 scenarios 232 of 232 (1,093 checks); every screen opens with no call to a missing route except made-up record ids; all 154 screens measured at three sizes with no count over its limit.

The server-side suites were not run a second time: nothing on the server changed after the full run began. The figure "232 of 232" is from the second run; the full run on the rebuilt database read 230 of 231.

**Proof the scenarios catch the faults.** 27 fixes were removed one at a time; each made at least one scenario fail; the source was restored after each (`qa/results/phase9-mutations.json`).

**Failed tests:** one, in the full run, a real fault, fixed and re-run. **Blocked tests:** none. **Not run:** anything needing a device, assistive technology, a real user or the host.

### The Phase 9 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Complete UI inventory | PASS | Every address opened and classified; controls counted; what was not pressed is stated |
| B. Design system consistency | PARTIAL | Theme corrected, access behaviours uniform and held by ratchets, brand kept. V-035 and V-036 deferred to Phase 12 |
| C. Functional interactions | PASS for the real screens, with a stated limit | Every fault found is fixed and proven; no open P0 or P1. Not every control was pressed |
| D. Role-based experience | PASS | 17 roles; menu, address and server |
| E. Responsive design | PASS in a browser's window sizes | Devices NOT VERIFIED |
| F. Accessibility | PASS for automated and keyboard checks | Manual verification with assistive technology NOT DONE, and recorded |
| G. Productivity | PASS with a stated limit | Five tasks measured; no real user |
| H. Performance | PASS on the local machine | Host and scale NOT VERIFIED |
| I. Regression | PASS | Section above |

### The directive's gates A to J

| Gate | Result |
|---|---|
| A. Scope understood | PASS |
| B. Requirements met | PARTIAL: see "Findings not fixed" |
| C. Defects reproduced before correction | PASS: baseline audit and first scenario runs |
| D. Corrections minimal and in place | PASS: no screen rebuilt, no dependency, no TypeScript |
| E. Automated checks fail without the fix | PASS: 27 removals; ratchets |
| F. Regression | PASS |
| G. Performance | PASS on the local machine |
| H. Security | PASS for what Phase 9 touched; V-028 handed to Phase 10 |
| I. Documentation | PASS |
| J. Readiness | **CONDITIONAL** |

Scores are in `phase-09-quality-scorecard.md` and `quality-scorecard.md`. They are judgements from named evidence. No group reaches the target of 95.

## PRODUCTION READINESS

Readiness decision: **CONDITIONAL**.

**Remaining blockers before this code is deployed**

1. SQL Editor file 15 (owner decision 10) must be applied before pull request 32 is merged (R-57). Phase 9 itself adds no database change.
2. The branches should be told of the ten changes listed above before they meet them (R-60, R-61).

**Unverified screens.** 40 real screens are classed FUNCTIONAL BUT SUBSTANDARD, most because no scenario acts on them beyond opening, names and reach; the inventory gives the reason for each. 58 are samples. 4 are part real and part example.

**Unverified interactions.** Controls outside the main workflows were not pressed by a scenario. About 100 dialogs exist; twelve were worked. The counter sale and web checkout were not checked for keeping entries when stepping back.

**Not verified at all.** Real devices; assistive technology; real users; the host and a real network; data at 85 branches in the browser; other browser engines (R-66).

**Deferred findings.** The ten in "Findings not fixed" and the ten carried findings deferred above.

**Risks added** (`production-risk-register.md`): R-60 to R-66.

### Decisions that are the owner's

1. Apply file 15, run `verify-6-to-15.sql`, and say when to merge pull request 32.
2. Look at the start page chosen for each role and say if any should differ.
3. V-030: should "Duplicate order" be built?
4. Whether the six real screens reached only from their parent screens (production workflow board, recipes, schedule optimisation, three web shop account pages) should have menu entries.

## PHASE 10 HANDOFF

Security, authorization, multi-tenant isolation, reliability, observability, backup, disaster recovery and deployment hardening. Phase 10 has not been started.

| Subject | Finding | Module | What is known | Depends on | Required test |
|---|---|---|---|---|---|
| Authorization, location access | V-028 (P2) | Dispatch API | `GET /api/v1/dispatch/work-centers` and the queue beside it answer another branch's work centres when asked by address. No screen asks | The branch boundary library of Phase 2 | An operator asks for another branch: refused or empty |
| Authorization | C-009 (P2) | Access control | The branch boundary holds the order-to-cash and shop records; other record types are not under it | Phase 2 library | One read and one change refused per added record type |
| Tenant isolation | E-019 (P2) | Database | Some tables carry a tenant id; whether every query honours it was never audited | None | A sweep section: a login of one tenant reads no row of another on every route that carries a tenant id |
| Location access | G-018 (P3) | Database | The branch column on orders is optional | Live data check | "Orders with no branch" is 0; a refused write |
| Sensitive data exposure | B-021 (P2) | Documents | On a disk host an uploaded file is reachable by its address alone | The host's storage | `/uploads/...` answers 401 or 404 with no token |
| Session handling | New observation, not yet a finding | Sign-in | The session token is kept in the browser's local storage. Phase 9 verified that sign-out clears it, that Back shows nothing afterwards, and that the way back after sign-in accepts only a path inside the application. Token lifetime, renewal and revocation were not examined. The build flag `VITE_DEMO_MODE` must be off on the host: NOT VERIFIED | Host settings (the owner's) | Token expiry and revocation; the flag read from the deployed build |
| API security | E-014 (P1), H-012 (P2) | Platform | The request limit counts per server instance | How many instances the host runs | Two instances behind one address hold one limit |
| API security, load | R-65 | Search | Each pause in typing asks up to five lists with a text match. Measured on the QA data only | Scale data | The search under load at 85 branches; a limit per person |
| Concurrency | G-020 (P3) | Orders | Status is protected; other fields of an order are last write wins | None | Two edits at once: one 200, one 409 |
| Audit logging | G-011 (P2) | Platform | Audit rows can be rewritten by any code with database access | A database change (SQL Editor file) | An update and a delete of an audit row are refused by the database |
| Monitoring | B-019 (P1, BLOCKED) | Platform | Nothing runs unless a person opens a screen; no alert on failure | The host's scheduler (the owner's) | Per function |
| Backup verification | E-015 (P1, accepted by the owner in Phase 3) | Platform | No evidence that a backup has ever been restored | The owner's access to the host | One restore into a scratch database, timed, with the reconciliation run on the copy |
| Disaster recovery | E-015, G-015 | Platform | No recovery time or point is stated; the host's connection pool is unknown | Host | A staged restore; a load test on a staging copy |
| Deployment | R-57, R-66 | Release | The order "database file first, then code" is kept by hand; one browser engine tested | The owner applies database updates himself | A check in the release step that the expected migrations are present |
| Incident response | None recorded | Operations | No written procedure for an outage, a wrong shipment of data or a compromised login was found in the repository | The owner | A written runbook, exercised once |

Screens Phase 10 should look at first because Phase 9 changed how they are reached: sign-in and the return after session expiry (`pages/Auth/LoginPage.jsx`, `api/client.js`), the search (`components/layout/GlobalSearch.jsx`), and the role table (`config/roleAccess.js`), which is a convenience only; the server's rules decide.

## Continuation point

Phase 9 work is complete as far as this environment allows. Nothing is half-built. To resume:

1. `CLAUDE.md`, then this report.
2. `qa/tools/run-gates.sh <logdir>` runs everything, Phase 9 included (about 2.5 hours).
3. Open items are in `findings-register.md` and `phase-state.json` (`currentBlockers`, `nextActions`).
4. Do not begin Phase 10 until the owner issues its prompt.
