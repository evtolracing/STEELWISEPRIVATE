# Phase 9: regression results

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

Two runs are reported, and they are not the same thing.

1. **The full run** (`qa/tools/run-gates.sh`, output kept in `qa/results/phase9-gate-run-1.txt`): the database rebuilt from nothing, then every suite from Phase 2 to Phase 9 in order.
2. **The second browser run** (`qa/results/phase9-final-browser-run.txt`): after the faults the full run found were fixed, every browser suite again on the final code, on the database the full run left. The fixes changed screen code only; no server code changed after the full run started, so the server-side suites were not run a second time.

## 1. The full run

| Suite | Result |
|---|---|
| Simulation, three seeds | 323 stock items, 59 orders, 0 problems (plus 52 in demo seed data); 323 stock items, 118 orders, 0 problems (plus 52 in demo seed data); 323 stock items, 177 orders, 0 problems (plus 52 in demo seed data) |
| Security sweep | 20 sections, 414 checks, all pass |
| Branch boundary | 39 checks, 0 problems |
| Phase 2 integrity | 82 checks, 0 problems |
| Phase 3 database scenarios | 74 of 74, 612 checks |
| Phase 4 integration scenarios | 66 of 66, 555 checks |
| Phase 5 sales scenarios | 76 of 76, 387 checks |
| Phase 6 inventory scenarios | 106 of 106, 494 checks |
| Phase 7 manufacturing scenarios | 141 of 141, 618 checks |
| Phase 8 fulfilment scenarios | 155 of 155, 518 checks |
| Unit tests | 209 of 209, 0 failed |
| Browser checks, ten earlier suites | 286 checks, 0 failed |
| Phase 9 UI scenarios, one pass | 230 of 231 passed, 1 failed, 0 not applicable, 1090 checks |
| Every screen opens (smoke) | No call to a missing route except the made-up record ids the run uses |
| Every screen measured at three sizes | controlsWithNoName: 0 (ceiling 0); fieldsWithNoLabel: 0 (ceiling 0); **over:** hardToReadTexts: 85 (ceiling 42); screensWithNoMainHeading: 1 (ceiling 6); screensWithSeveralMainHeadings: 0 (ceiling 0); screensWiderThanTheWindow: 0 (ceiling 0); smallTargetsOnAPhone: 3 (ceiling 3); screensWithAPageError: 0 (ceiling 0); screensSharingATitle: 34 (ceiling 34) |
| Baseline probe | All sections pass |
| Department rule coverage | 338 changing routes: 254 under a department rule, 12 guarded in the route file, 72 covered another way, 0 with no rule |
| Screen audit | 0 screens show made-up data with no notice (allowed: 0) |
| Lint, screens | 0 errors |
| Lint, whole repository | ✖ 1558 problems (1 error, 1557 warnings) |
| Build | ✓ built in 18.46s |

### What the full run found

| Found | What it was | What was done |
|---|---|---|
| 1 of 231 Phase 9 scenarios failed: "a scheduler signs in at the form..." | A real fault. The work order list had no entry in the menu for any role (V-038). The scenario had been written to expect one | Work Orders added to the Production section; a scenario added for the menu and the search; proved by removing the entry |
| Hard-to-read texts: 85, over the ceiling of 42 set from the earlier measure | Two things. On the operations cockpit, 39 texts were measured as white on white at a moment when the screen, which refreshes itself, was redrawing its cards. Measured again and looked at, they are dark on white: a fault of the measure, not of the screen. On four real screens (shop floor, users, processing recipes, planning) the fuller database showed colours the earlier measure had not met | The measure now keeps a hard-to-read pair only if a second look, a second later, finds it too. The four screens were corrected |
| 1 screen with no main heading | The web shop's "Order not found" state | Heading added |
| Lint, whole repository: 1 error | A line added in Phase 9 to `qa/tools/excellence-docs.mjs` | Corrected; the count of errors is 0 in the second run |
| Screen audit: 1 screen of unknown kind | The new "Page not found" page, which the static audit could not place | Classed as static |

### Database checks after the run

All 75 were read after the Phase 2 to 8 scenarios. 64 read 0. The 11 that do not are counts of demo seed data and of records the scenarios make on purpose. Every one of the 75 equals its value in the last full run before Phase 9 (owner decision 10).

### Server errors in the run

Read from the log of calls the tests made:

- POST /api/ai/assistant 502 x3
- POST /api/ai/tts/speak 504 x1
- POST /api/ai/tts/speak 502 x6
- POST /api/ai/tts/speak 503 x4
- POST /api/inventory/transfers/:id/receive 500 x1
- POST /api/inventory/transfers 500 x1
- POST /api/invoices 500 x1
- POST /api/pos/quick-sale/email-receipt 501 x4
- POST /api/quotes/:id/accept 500 x1
- GET /api/v1/partner/supplier/asn 501 x2
- POST /api/v1/partner/supplier/asn 501 x1
- POST /api/v1/partner/supplier/documents 501 x1
- GET /api/v1/partner/supplier/scars 501 x1
- GET /api/v1/partner/supplier/scorecard 501 x1

The four answers of 500 are the same four routes as in the Phase 8 runs, each planted by a scenario that breaks a save on purpose. The 501, 502, 503 and 504 answers are routes that say they are not built and the AI and speech routes, which have no provider in the test setup. None is from a Phase 9 change.

## 2. The second browser run, on the final code

| Suite | Result |
|---|---|
| ui-experience | 22 checks, 0 failed |
| ui-shipping | 30 checks, 0 failed |
| ui-shop | 31 checks, 0 failed |
| ui-sales | 24 checks, 0 failed |
| ui-inventory | 23 checks, 0 failed |
| ui-integration | 33 checks, 0 failed |
| ui-phase5 | 14 checks, 0 failed |
| ui-phase6 | 14 checks, 0 failed |
| ui-phase7 | 39 checks, 0 failed |
| ui-phase8 | 56 checks, 0 failed |
| Ten earlier suites together | 286 checks, 0 failed |
| Phase 9 UI scenarios, one pass | 232 of 232 passed, 0 failed, 0 not applicable, 1093 checks |
| Every screen measured at three sizes | controlsWithNoName: 0 (ceiling 0); fieldsWithNoLabel: 0 (ceiling 0); hardToReadTexts: 17 (ceiling 42); screensWithNoMainHeading: 0 (ceiling 6); screensWithSeveralMainHeadings: 0 (ceiling 0); screensWiderThanTheWindow: 0 (ceiling 0); smallTargetsOnAPhone: 3 (ceiling 3); screensWithAPageError: 0 (ceiling 0); screensSharingATitle: 32 (ceiling 34) |
| Lint, screens | 0 errors |
| Lint, whole repository | ✖ 1557 problems (0 errors, 1557 warnings) |
| Screen ratchets | {"iconButtonsWithNoName":0,"fieldsWithNoName":0,"pagesMissingAMainHeading":0,"pagesWhereNoTitleCouldBeFound":1,"sampleButtonsWithNoActionAndNoNotice":0,"clickOnlyRowsAndCards":0,"browserPopUpBoxes":0} |
| Build | ✓ built in 17.53s |

## 3. Checks changed in older suites, and why

None was removed, skipped or loosened in Phase 9. The ten earlier browser suites passed unchanged after the shell was rebuilt (search, titles, start pages), because they sign in with a token and open each page by address.

| Tool | Change | Reason |
|---|---|---|
| `qa/sim/ui-audit.cjs` | Waits for a screen to draw before measuring it; confirms a hard-to-read pair with a second look | Screens whose code arrives late were measured blank; colours in the middle of a fade were counted |
| `qa/tools/frontend-checks.mjs` | New ratchets: unnamed icon buttons, unlabelled fields, pages with no heading, buttons with no action, click-only rows, browser boxes | Phase 9 fixes must not come back |
| `qa/tools/run-gates.sh` | Runs the Phase 9 scenarios and the screen measure with its ceilings | So every later phase runs them |
| `qa/tools/screen-audit.mjs`, `qa/tools/excellence-docs.mjs` | The catch-all "Page not found" page is classed | It is new |

## 4. Not verified

- The live database and the host. Phase 9 has no database change and nothing was run against either.
- Any browser but Chromium; any real phone, tablet or shop terminal.
- The server-side suites were not repeated after the screen-only fixes of section 2.
- No screen reader, and no member of staff.

