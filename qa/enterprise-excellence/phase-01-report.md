# Phase 1 report: forensic discovery, quality baseline, gap analysis and first corrections

Written 2026-11-13 to the format in `qa/ENGINEERING-STANDARD.md`, Rule 11, followed by the program's final execution report and the Phase 2 handoff.

## Completion status: PARTIALLY COMPLETE

This is not a pass and the product is not ready for production across branches.

What is complete: the whole code base is inventoried from source (47 modules, 611 routes, 157 tables, 143 screens, 48 roles), every gate was run before and after the changes, 17 workflows are mapped, 210 findings are in one register, four defects are fixed with a check that fails without the fix, and the 15 program files exist.

What keeps it from VERIFIED COMPLETE: 12 modules were classified from a code read and have no test that makes them succeed; five workflows are mapped only; the design files and `docs/` were not compared line by line with the code; no performance, accessibility or device test was run; and nothing on the live system was examined. Each of these is listed below with its phase.

Nothing here is live. Pull request 30 is open and not merged.

## 1. Scope and discovery

In scope: everything in the repository. Discovery was done by tools that read the source, so the counts can be reproduced:

| Tool | What it reads | Output |
|---|---|---|
| `qa/tools/discover.mjs` | Schema, migrations, route files, mounts, screens, imports, packages, tests | `.discovery.json` |
| `qa/tools/exercised.mjs` | The server's request log from a full gate run | Which routes the tests really reached, and with what answer |
| `qa/tools/db-facts.mjs` | The local QA database, read-only | Row counts, the rules the database enforces, 17 consistency checks |
| `qa/sim/baseline-probe.mjs` | Every changing route, as a view-only role and with an empty body | Refusals, crashes, records saved from nothing |
| `qa/tools/excellence-docs.mjs` | All of the above plus the module map and `findings.json` | Nine of the program files |

Baseline recorded before any change (commit `2d801ff`): unit 87 of 87; three simulation cycles 150 of 150 with reconciliation clean; sweep 20 of 20; browser suites 22, 27, 30, 24 and 22 with 0 failed; every route opens; screen audit 0 unlabelled; frontend lint passes; build passes; root lint 201 errors.

Not examined, and why:

- The live database, the host and its settings: the standing rule is that testing never touches them.
- `docs/`, `DESIGN FILES/` and `archive-design-files/` line by line against the code.
- Tickets: there are none. NOT AVAILABLE. Commit and pull-request titles were used (`ticket-traceability.md`).
- AI and voice features: they need provider keys that the test environment does not have.
- Performance at volume, accessibility, tablet and mobile layouts, restore from backup.

## 2. Findings

210 in `findings-register.md` (source: `findings.json`). 185 were carried in from the first audit, the six earlier workstreams and the user-experience register, each with its original ID. Phase 1 added 25, B-001 to B-025.

| | P0 | P1 | P2 | P3 | Total |
|---|---:|---:|---:|---:|---:|
| All findings | 20 | 69 | 63 | 58 | 210 |
| Not yet verified fixed | 2 | 20 | 37 | 25 | 84 |

By status: VERIFIED FIXED 126, REQUIRES BUSINESS DECISION 40, OPEN 36, IN PROGRESS 4, DEFERRED WITH JUSTIFICATION 3, BLOCKED 1.

The fifteen that matter most, in order:

| # | ID | Severity | Finding | Status |
|---:|---|---|---|---|
| 1 | X-001, X-002 | P0 | 36 screens in safety, maintenance, training, customer quality, executive and quality are samples that save nothing. All are labelled; none works | Decision: build or remove |
| 2 | B-003 | P1 | No branch, division or region boundary on the server. Any staff login reads every branch | Decision: the access rule |
| 3 | B-009, I-012, S-021 | P1 | Two stock lists and two order pipelines | Decision: which is real |
| 4 | B-004 | P1 | 16 areas have no department rule | Decision: the owning department |
| 5 | I-016, M-016 | P1 | Stock cannot be corrected, and completing a work order moves no stock | Decision: the rules |
| 6 | X-007, S-010 | P1 | Promise dates, cut-offs and branch suggestions are invented in the browser and shown to customers | Decision: the rules |
| 7 | B-016 | P1 | 72 of 319 changing routes succeed in any test. Database-backed suites do not run on pull requests | Open |
| 8 | B-019 | P1 | Nothing runs on a schedule; no email or text | Decision: host trigger and provider |
| 9 | I-007 | P1 | No purchase order | Decision |
| 10 | E-011 | P1 | Known vulnerabilities in installed packages (1 critical). Not re-run in Phase 1 | Decision on major upgrades |
| 11 | E-015 | P1 | No restore from backup has been tried; no staging database | Decision |
| 12 | I-011, M-011, X-009 | P1 | Supplier quality, bills of material and 58 screens in all are samples | Decision |
| 13 | E-014 | P1 | Request limit counts per server instance | Open |
| 14 | B-010 | P2 | 16 handlers make several saves with no transaction | Open, Phase 2 |
| 15 | B-007, B-008 | P2 | Four handlers pass the whole request to the database; seven routes save a record from an empty request | Open, Phase 2 |

## 3. Root causes

1. **Access was built by role and department, never by place.** Branch is a field and a filter. The tables that would assign users to branches exist and are empty (B-003).
2. **The write rules were written for the core records and matched by address.** A second address for the same records (`/api/v1/jobs`) skipped the rule (B-001), and a view-only role was refused only where a rule happened to exist (B-002).
3. **Modules were made "real" one pull request at a time** by saving their in-memory records as JSON, without joining them to the core records (B-009).
4. **Screens were built before servers** (X-009), and tables before code (B-017: 52 tables nothing uses).
5. **Most handlers do not check their input.** A wrong value reached the database and came back as a server error (B-005) or was saved (B-007, B-008).
6. **Tests arrived late and follow order-to-cash.** 26 of 208 commits added tests, all from 12 November (B-016).

## 4. Changes implemented

Four corrections, each small and each with a check that fails without it. No business rule was changed and no database structure was touched.

| ID | Defect | Fix |
|---|---|---|
| B-001 | `/api/v1/jobs` and `/api/v1/work-centers` are the same records as `/api/jobs` and `/api/work-centers` and skipped their department rule | `lib/roleAccess.js`: the rule is looked up by the canonical address (`ruledPath`) |
| B-002 | View-only roles (auditor, data analyst and the rest of the read-only group) could change records wherever no department rule existed: 290 of 542 changing calls were not refused | `lib/roleAccess.js`: a read-only role is refused on every changing request, except a short list of calls that only ask a question (sign-in, price a basket, ask the assistant) |
| B-005 | 19 changing routes answered an empty or wrong request with a server error | `lib/db.js`, `lib/requestContext.js`, `middleware/safeErrors.js`: when the database refuses a value the caller sent, or the record is not there, the reply is 400 or 404 with a plain sentence. `routes/executive.js`: a scenario needs a name. Three routes still crash (B-006, a different cause) |
| B-023 | Root lint: 201 errors, all from QA scripts linted without Node globals | `eslint.config.js`: two blocks for `qa/` |

Also added: the five tools in section 1, `qa/tools/run-gates.sh` (every gate in one command on a rebuilt QA database), and `rows` in the screen audit's output.

## 5. Files modified

Server: `src/backend/src/lib/roleAccess.js`, `lib/requestContext.js`, `lib/db.js`, `middleware/safeErrors.js`, `routes/executive.js`.
Tests: `src/backend/test/roleAccess.test.js`, `test/safeErrors.test.js`, `qa/sim/baseline-probe.mjs` (new).
Tools: `qa/tools/discover.mjs`, `exercised.mjs`, `db-facts.mjs`, `findings-import.mjs`, `excellence-modules.mjs`, `excellence-docs.mjs`, `run-gates.sh` (all new), `qa/tools/screen-audit.mjs`.
Configuration: `eslint.config.js`, `.gitignore`. Earlier in this session, before Phase 1: `.github/workflows/backend-tests.yml` (commit `2d801ff`).
Documents: `qa/enterprise-excellence/` (new), `qa/README.md`, and the regenerated registers and results in `qa/`.

## 6. Database changes

None. No migration, no SQL Editor file, no data change outside the local QA database.

## 7. Tests added

- Unit: 3 (two for the access rules, one for caller-mistake replies). 87 to 90.
- `qa/sim/baseline-probe.mjs`, four sections: view-only roles against every changing route; the second address; every changing route with an empty body, with a ceiling on server errors that can only go down; branch-to-branch access, reported and not judged because the rule is the owner's.

## 8. Tests actually executed (this session, local QA database, final code)

Run with `qa/tools/run-gates.sh` on a rebuilt database.

| Test | Result |
|---|---|
| Unit tests | 90 of 90 pass |
| Three 50-job simulation cycles, seeds 8001 to 8003 | 150 of 150 pass; 2,134 API steps; 2,357 checks; reconciliation 0 problems |
| Security and safeguards sweep | 20 of 20 sections pass |
| Baseline probe | 4 of 4 sections pass. 542 view-only write calls, 0 not refused. 275 routes with an empty body, 3 server errors (ceiling 3, B-006), 7 saved a record from nothing (B-008, reported) |
| Baseline probe against the commit before the fixes | Fails: 290 not refused; 4 problems on the second address; 19 server errors |
| Browser suites | 22, 27, 30, 24, 22 checks; 0 failed |
| Every route opens | 125 routes, no crash. 10 screens made a call that returned 404 because the check opens detail screens with a made-up id |
| Screen audit | 143 screens; 0 show made-up data with no notice |
| Lint, frontend | Passes |
| Lint, whole repository | 0 errors (201 before), 1,524 warnings (B-024) |
| Frontend production build | Passes |
| Database consistency checks, read-only, after the simulation | 0 problems outside the demo seed rows. 4 counter-sale lines marked shipped with no stock movement (B-025). 47 delivered seed shipments with no proof-of-delivery name (B-022) |
| Pull-request workflow on GitHub for this commit | NOT VERIFIED at the time of writing; it runs after the push |
| Dependency audit (`npm audit`) | NOT RUN in Phase 1; E-011 carries the earlier figures |
| Performance, accessibility, tablet and mobile, restore | NOT RUN |

## 9. Regression results

No job, sweep section or browser check that passed at the baseline fails on the final code. Behaviour changed on purpose in two places: a view-only login is now refused when it tries to change anything, and a wrong or empty request to a changing route now gets a 400 or 404 where it used to get a 500.

## 10. Connected-module verification

The access change touches every changing route, so every suite was rerun: the simulation (sales, warehouse, production, shipping and finance roles all still do their work), the sweep's role and department section (18 checks), and the five browser suites signed in as real roles. The error-reply change sits in front of every route; the sweep's "read routes do not crash" (789 reads) and "core write routes reject bad input cleanly" (38) sections pass, and the simulation's 2,134 steps show no legitimate request was turned into a 4xx.

## 11. Remaining findings and blockers

Decisions needed from the owner, in the order they unblock work:

1. **Which stock list and which order pipeline is the real one** (B-009; the decision card "Choose which stock list is the real one" is still open).
2. **Branch access** (B-003): may a user see and change other branches' records, and who may (regional, corporate)?
3. **Department for 16 areas** (B-004). The list is in `permissions-matrix.md`.
4. **Sample modules** (X-009): build or remove, per module.
5. **A scheduled trigger on the host and an email or text provider** (B-018, B-019).
6. **Shelf items at the counter** (B-025): are they counted stock?
7. The earlier open decisions: promise dates and cut-offs (X-007), stock adjustment and what processing consumes (I-016, M-016), purchasing (I-007), package upgrades (E-011), restore test (E-015).

Carried to later phases with the phase named on each finding: 84 in all.

## 12. Continuation point

Phase 1 is closed as PARTIALLY COMPLETE. Phase 2 has not been started and will not start until the owner issues its prompt. To resume: read `progress.json`, then the handoff below. To reproduce every number here: `qa/tools/run-gates.sh`.

---

# Final execution report

## A. System discovery

| | Count |
|---|---:|
| Modules | 47 (22 implemented and verified, 12 implemented but not verified, 4 partial, 5 placeholder or mock, 3 disconnected, 1 not applicable) |
| API routes | 611 in 72 files, 319 change data |
| Database tables | 157, with 96 enumerations and 22 migrations. 52 tables are used by no code |
| Screens | 143: 76 real, 58 labelled samples, 5 static, 4 mixed |
| Roles | 48, in 9 groups |
| Workflows mapped | 17: 9 verified end to end, 3 in part, 5 mapped only |
| Job types | 5 order types in the schema (PO unused), 6 sales channels, 2 kinds of shop work, 9 simulated scenario families |
| Background jobs | None exist |
| Integrations | AI providers, voice, partner API with webhooks. No card, email, text, carrier, accounting or EDI |

Disconnected or mock: order hub and intake pipeline, second stock list, stop work (disconnected); promise dates and cut-offs, mobile rep, safety, supplier quality and the other sample modules (mock). Detail in `system-inventory.md`.

## B. Quality baseline

Scores are a judgement from named evidence, carried from the earlier workstreams and changed only where Phase 1 produced evidence. Full table and criteria in `quality-scorecard.md`.

| Module group | Weighted score | Open P0 or P1 | Meets 95 |
|---|---:|---:|:-:|
| Platform infrastructure | 70 | 2 | No |
| Sales and customer operations | 70 | 5 | No |
| Inventory and purchasing | 70 | 6 | No |
| Manufacturing and processing | 69 | 3 | No |
| Logistics and financial operations | 73 | 3 | No |
| Enterprise experience | 57 | 7 | No |

No single overall score is given: accessibility is NOT VERIFIED everywhere and performance is NOT VERIFIED outside the Workstream 1 benchmark, so an overall figure would be invented. Highest-risk modules: access control across branches, the second stock list and order hub, shop-floor operations, and every sample module. Lowest-confidence modules: the 12 marked IMPLEMENTED BUT NOT VERIFIED.

## C. Findings

Totals and the top fifteen are in section 2. P0 open: 2 (X-001, X-002, both labelled and awaiting a build-or-remove decision). P1 open: 20. P2 open: 37. P3 open: 25.

## D. Corrective actions

Section 4 (changes), section 5 (files), section 7 (tests added), section 8 (tests run, with results), section 9 (no regressions), and for what remains unverified, section 8's NOT RUN and NOT VERIFIED rows.

## E. Production readiness

Not production ready. Blockers and conditions for a one-branch pilot are in `production-risk-register.md` (20 risks, 9 of which block go-live across branches). Business decisions required: section 11. Phases still needed: all of 2 to 12.

## F. Phase 2 readiness

Ready to begin when the prompt is issued. The handoff follows. Two of its items wait on decisions 1 and 3 above; the rest do not.

## Final status

**PARTIALLY COMPLETE**

---

# Phase 2 handoff: architecture and code quality hardening

Not started. This is the brief for it, from Phase 1's evidence.

## 1. Highest-risk architectural weaknesses

1. Two generations of store for the same things: relational core records, and whole-record JSON stores for the second stock list, order hub and stop work (B-009). Waits on the owner's decision; until then, do not build on either second store.
2. Access rules matched by address prefix in one file. Phase 1 closed the two holes found; the structure still lets a new route ship with no rule (B-004). Recommended: every changing route must resolve to a named rule or the server refuses to start, with a test that lists unruled routes.
3. Business rules inside route handlers: 72 route files against 21 rule files (B-014).
4. No input validation layer. `express-validator` is installed and unused.
5. No place for scheduled work (B-019). Phase 2 can only prepare the entry point; the trigger is the owner's.

## 2. Duplicated logic

- Two counter flows: `routes/quickSale.js` (tested) and `routes/pos.js` with `workflows/pos/` (14 files, 5 of 36 changing routes tested, three broken: B-006, S-022).
- Job routes at two addresses with separate handlers (`/api/jobs`, `/api/v1/jobs`).
- Three reply shapes across the API (E-021).
- Stock transfers in the core and in the second stock list.

## 3. Fragile module boundaries

Dispatch, shipping and billing share one transaction and are well protected. The fragile ones: shop-floor operations write to job, dispatch job, operation and time log in separate saves (B-010); order hub to sales order has no link at all; remnants have no producer.

## 4. Oversized components

Listed in `system-inventory.md` and B-014: the largest route files and screens by line count, led by `routes/pos.js` (1,390 lines), `routes/dispatchRoutes.js`, `routes/stopWork.js` and `routes/jobs.js` on the server, and `router/AppRouter.jsx`, the staff management page and the operations cockpit page in the frontend. Split only along a boundary a test already covers, or add the test first.

## 5. Unsafe asynchronous flows

- 16 handlers with several saves and no transaction (B-010, listed in `api-inventory.md`).
- `webhookService.processPendingRetries` is never called (B-018).
- 39 React effects whose dependency list does not match what they read (B-024). Not yet read one by one.
- A void of a counter sale claims the sale by rewriting its notes (B-025). It is safe against a double refund; it is not a status.

## 6. Missing validation

- Seven routes save a record from an empty request (B-008).
- Four handlers pass the request body straight to the database (B-007).
- 147 of 275 changing routes already answer 400 to an empty body; the rest rely on "not found" or the Phase 1 safety net. The net is a backstop and not a substitute.

## 7. Inconsistent API behaviour

Three reply shapes (E-021); 80 calls in the screens with no server route (D-020); 58 list routes with no limit (B-012, performance phase, but the paging helper belongs in Phase 2); role `MILL_OPERATOR` used in code and absent from the database (B-020).

## 8. Maintainability

45 frontend files and 5 server files nothing imports (B-013). 1,524 lint warnings (B-024). Six unused packages. 52 unused tables (B-017, after the X-009 decision).

## 9. Dependency concerns

E-011: re-run `npm audit` first, since the figures are from the first audit. Remove the unused packages (frontend: `@elevenlabs/elevenlabs-js`, `elevenlabs`, `date-fns`; server: `@elevenlabs/elevenlabs-js`, `pg`, and `express-validator` unless it is adopted for validation) only after a build and a full gate run show nothing loads them.

## 10. Regression tests required before any refactor

- `qa/tools/run-gates.sh` green before and after every change.
- Before touching shop-floor operations: a success-path test for plan, start, pause, complete and reassign (none exists).
- Before touching `routes/pos.js`: decide with the owner whether the session flow stays (S-022); if it goes, the simulation's two session sales per cycle move to the quick sale.
- Before removing dead files: the build and the "every route opens" check.
- Put the simulation and sweep into the pull-request workflow against a disposable database, so Phase 2 changes are checked on GitHub and not only here.

## 11. Recommended sequence

1. Re-run the dependency audit; fix what needs no major upgrade.
2. Simulation and sweep on pull requests.
3. Validation: the seven empty-body routes, the four mass-assignment handlers, then a shared validator for new work.
4. Transactions for the 16 handlers, shop-floor operations first, each with a failure test.
5. A rule for every changing route, enforced at start-up (needs B-004 for the 16 areas; until then they are listed as "undecided" and the list can only shrink).
6. Remove dead code and unused packages; fix the three broken counter-pricing routes or remove them with the session flow.
7. One reply shape and one paging helper, applied module by module with the screens.
8. Move rules out of the largest handlers into `lib/`, each with unit tests.
9. After the owner's decision: retire or connect the second stock list and the order hub.

## 12. Risks while refactoring

- The four invariants in `workflow-matrix.md` ("What must be preserved") must hold: one transaction for dispatch, payment, return receipt and reservation; a person on every move; the stock balance rule; PARTIAL and COMPLETE only from shipping.
- Screens call routes by address in 387 files; changing a reply shape without the contract scan (`qa/tools/api-contract.mjs`) will break a screen silently.
- Removing a "dead" file that a sample screen imports changes what the screen audit sees.
- Any change to `lib/roleAccess.js` must keep the probe at 0 not refused.
- No database change without its SQL Editor file, run twice on a copy.
