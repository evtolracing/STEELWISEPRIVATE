# Phase 2 of 12: final execution report

**Enterprise architecture, code quality, service integrity and system-wide engineering hardening**

Date: 2026-11-13. Branch `claude/project-thread-25z3jd`, pull request 30, not merged. Phase 2 started from commit `0ad7857`.

All testing ran on the local database `steelwise_qa`. Nothing was run against the live database or the host. A statement in this report that says a test passed refers to a run in this session; anything else is marked NOT VERIFIED.

## FINAL STATUS

**PARTIALLY COMPLETE**

Reasons, stated exactly:

1. One P1 architecture defect in scope is not corrected: the two stock lists and two order pipelines (B-009). It is decided, fenced by access rules and deferred to Phase 3 because the correction is a data migration the owner must apply.
2. Two of the twenty end-to-end scenarios could not be executed because the application does not have the function (11 remnant generation from processing, 17 background job retry). One is not verified (20 corporate reporting figures).
3. One of the ten concurrency tests could not be executed (4, concurrent transfer receipts: transfers have no receipt step).
4. Forty-five of 72 route files and the 18 service files were examined by tool, not read line by line.
5. The branch boundary covers 15 record types. Quotes, requests for quotation, packages, drop tags, documents and the two JSON stores have no branch column yet (C-009).

Everything that was corrected is VERIFIED FIXED with a check that fails without it. No confirmed critical vulnerability is left open.

---

## ARCHITECTURE ASSESSMENT

**Current architecture.** One React application (JavaScript and JSX, Material UI) and one Express server over one PostgreSQL database through Prisma, deployed as a single function. 611 routes in 72 files, 319 of which change data; 157 tables; 143 screens (76 real, 58 labelled samples, 5 static, 4 mixed). No queue, scheduler, cache or second service. Detail: `phase-02-architecture-audit.md`, `architecture-map.md`.

**Modules examined.** Read in full: the access layer (`lib/db.js`, `lib/roleAccess.js`, `lib/branchScope.js`, both gates), numbering, job history, workflow rules, receiving, and 21 route files covering orders, stock, shipping, jobs, shop-floor operations, work orders, work centers, users, counter sales, intake, the order hub, material tracking, recipes, equipment, maintenance, executive decisions, the cockpit, demand shaping and the carrier partner routes. Five screens. The rest by tool only.

**Critical weaknesses found.**

| Weakness | Finding | Severity |
|---|---|---|
| Any staff login could read and change every branch | B-003 | P1 |
| A branch manager could create a super admin, or become one | C-001 | P1, new |
| Shop-floor records went wrong under simultaneous use: jobs stuck in process in 8 of 8 trials; cancelled jobs revived | C-005 | P1, new |
| Sixteen areas had no department rule | B-004 | P1 |
| Two stock lists and two order pipelines | B-009 | P1 |
| Sixteen handlers saved in several steps with no transaction | B-010 | P2 |
| Handlers passed the request body straight to the database | B-007 | P2 |
| A counter sale changed no stock | B-025 | P2 |

**Dependency risks.** No circular import on a critical path. One harmful coupling: shipping's dispatch and deliver functions are private to their route file, so the carrier partner routes copied them, wrongly (C-002). The Job table is read or written by eleven modules. Detail: `module-dependency-map.md`.

**Service-boundary risks.** Before Phase 2 there was no branch boundary and an incomplete department boundary. Both now sit in one place each. What remains is C-009. Detail: `phase-02-service-boundaries.md`.

**Business-rule ownership risks.** Most rules still live in route handlers (B-014). Rules that have an owner file and unit tests: pricing, tax, credit, billing, workflow status, receiving, work orders, field lists, numbering, branch scope, department rules, login rules. Rules the application needs and the owner has not given: what processing consumes and produces, stock adjustment, promise dates, purchasing, scheduling. Detail: `phase-02-business-rule-ownership.md`.

---

## CORRECTIVE ENGINEERING

Five batches. Each was tested before the next began. Detail: `phase-02-correction-plan.md`.

**Defects corrected (16 findings moved to VERIFIED FIXED).** B-003, B-004, B-006, B-007, B-008, B-010, B-025, C-001, C-003, C-004, C-005, C-007, C-008, and three that the Phase 2 runs showed were already resolved: E-012, E-016, I-018.

| Area | What changed |
|---|---|
| Branch boundary (B-003) | The database client adds the user's branches to every query on a branch-owned table. Another branch's record is "not found". Orders now carry a branch |
| Login rules (C-001) | One rule file decides who may create, change, switch off or reset which login, on all four routes |
| Shop floor (C-005, B-010) | Start, complete, reassign and plan are all-or-nothing. Completion locks the rows it reads. Job moves are conditional on the status they were checked in. A closed job refuses further work |
| Department rules (B-004) | Every changing route has a rule or a stated reason; a check in the gates fails otherwise |
| Counter sale (B-025, decision 6) | The sale takes shelf stock in its own transaction and is refused when the shelf is short; a void puts the stock back |
| Field lists and empty saves (B-007, B-008) | Work centers, equipment and maintenance orders read a field list; five routes refuse a save with nothing in it |
| Crashes (B-006) | Three counter pricing routes that could never work answer "not built" plainly |
| Screens (C-007, C-008) | Two real screens show an empty list and the reason instead of inventing records; the override handler on order entry uses current values |

**Files changed.** 33 source files, 834 lines added and 245 removed, plus the final commit's change to `routes/users.js`:

- New: `lib/branchScope.js`, `lib/userAdminRules.js`, three unit test files, one migration and its SQL Editor file.
- Server: `lib/db.js`, `lib/numbering.js`, `lib/roleAccess.js`, `middleware/auth.js`, `middleware/safeErrors.js`, and the routes `assets`, `bomV1`, `executive`, `intakeOrders`, `inventory`, `jobs`, `maintenanceOrders`, `materialTrackingRoutes`, `operationsRoutes`, `orderHubRoutes`, `orders`, `pos`, `quickSale`, `users`, `workCenters`.
- Screens: `WorkCenterQueuePage.jsx`, `QuickSale.jsx`, `WillCallQueueScreen.jsx`, `CSRIntakePage.jsx`, `UnitDetailPage.jsx`.
- QA: `qa/sim/branch-boundary.mjs`, `qa/sim/phase2-integrity.mjs`, `qa/tools/access-coverage.mjs`, `qa/tools/frontend-checks.mjs` (all new); `run-gates.sh`, `baseline-probe.mjs`, `db-facts.mjs`, `findings-import.mjs`, `excellence-docs.mjs`.

**Business rules affected.** None was changed silently. Three were applied from the owner's decisions of 2026-11-13 and are written down where they can be changed:

| Decision | Rule as applied | Engineer's reading that the owner should confirm |
|---|---|---|
| 2 | Staff see and change only their own branches | Which roles count as "high-level management" and see every branch: super admin, tenant owner, admin, executive, CFO, COO, CIO, division director, operations manager, sales director, credit manager, data analyst, auditor, integration admin |
| 3 | A department for each of the 16 unruled areas | The whole table in `phase-02-service-boundaries.md`, section 2 |
| 6 | A counter sale reduces stock | A product with no shelf stock on file still sells, with a note on the receipt screen, because nothing can yet receive shelf items by the piece (C-011) |

No pricing, tax or credit rule changed. No manufacturing rule was invented.

**API contracts affected.** No reply shape changed and no route was removed. Behaviour that is new: a login held to its branches gets 404 for another branch's record; `GET /api/inventory/locations` returns the user's own branches unless `?all=true`; orders accept and return `locationId`; new 403 and 409 refusals where none existed. Detail: `phase-02-api-contracts.md`.

**Database changes.** One: `Order.locationId` (nullable, indexed, foreign key to Location) with a backfill. Migration `20261113190000_order_branch`; SQL Editor file `src/backend/prisma/upgrades/sql-editor/20261113190000_order_branch.sql`, made by `npm run db:sql-editor` and run twice on a populated copy (first run placed 163 of 170 orders; second run changed nothing). Not destructive. **Not applied to the live database: the owner applies it.** It is the fifth file waiting; the order is in the pull request.

---

## VERIFICATION

Detail, including every scenario and the tests that failed during the phase: `phase-02-regression-results.md`.

**Tests added.** 37 branch-boundary checks, 80 integrity and concurrency checks, 15 unit tests (90 to 105), a department-coverage check, two screen ratchets, one database consistency check on counter sales.

**Tests executed on the final code, and passed.** Simulation 150 of 150 jobs over three seeds with reconciliation clean; sweep 20 of 20; branch boundary 37 of 37; integrity 80 of 80; unit 105 of 105; five browser suites, 125 checks, 0 failed; 125 screens open; probe 4 of 4 with 0 server errors; coverage 319 of 319; screen audit; lint; build.

**Tests failed.** None in the final run. Six failures during the phase are listed with cause and correction in the regression file; one was a product defect (a repeated counter sale for the last piece), five were in test code or fixtures.

**Workflow scenarios executed.** Seventeen of twenty, passed in whole or for the part the application supports.

**Scenarios that could not be executed.** 11 (processing moves no stock, M-016), 17 (no background jobs exist, B-018 and B-019). Concurrency test 4 (no transfer receipt step).

**Unverified areas.**

- Scenario 20: no test compares a reported figure with the records behind it.
- Records with no branch column (C-009).
- Forty-five route files and 18 service files, read by tool only.
- The cost of the branch filter at 80 branches; any behaviour under load; a database connection dropped mid-save.
- Coverage by line of code: not measured.
- The pull-request workflow on GitHub for the final commit: NOT VERIFIED at the time of writing.
- The live database and the host: not touched.

**Gates.** A build and static quality PASS. B functional regression PASS. C transaction and data integrity PASS for what was tested. D security and access PASS for 15 record types. E API contracts PASS. F end-to-end scenarios NOT FULLY MET. G documentation and traceability PASS.

---

## QUALITY IMPROVEMENT

| Module group | Baseline | Updated |
|---|---:|---:|
| Platform infrastructure | 70 | 73 |
| Sales and customer operations | 70 | 72 |
| Inventory and purchasing | 70 | 73 |
| Manufacturing and processing | 69 | 73 |
| Logistics and financial operations | 73 | 75 |
| Enterprise experience | 57 | 60 |

Target 95. No group meets it.

**Measured improvements.** Open P1 20 to 17. Findings VERIFIED FIXED 126 to 142 of 223. Changing routes with a success in a test 72 to 87 of 319. Changing routes with no department rule: 16 areas to 0. Server errors on an empty body 3 to 0. Multi-step saves with no transaction 16 to 5. Screens that invent records 2 to 0. Automated checks on branch access 0 to 37.

**Remaining deficiencies.** 232 changing routes with no success-path test (B-016). 58 sample screens to build (decision 4). Rules in handlers (B-014). 1,524 lint warnings. Nineteen findings waiting on the owner's rules. Detail: `phase-02-quality-scorecard.md`.

**Findings register after Phase 2.** 223 findings: VERIFIED FIXED 142, DEFERRED TO SPECIFIC PHASE 58, REQUIRES BUSINESS DECISION 19, IN PROGRESS 2 (M-018, S-024), BLOCKED 1 (B-018), NOT APPLICABLE 1 (B-020). None is OPEN without a disposition, none was deleted, and each deferral states its reason, target phase, required correction, dependencies, acceptance criteria and verification.

---

## PRODUCTION RISKS

Full list with likelihood and effect: `production-risk-register.md` (R-01 to R-24).

**Critical risks remaining.** None rated critical in effect and likely. The two P0 findings (X-001, X-002) are sample modules, every screen of which is labelled.

**High-priority risks.**

| Risk | Finding | State |
|---|---|---|
| Two stock lists and two order pipelines can disagree | B-009 | Deferred to Phase 3 |
| A defect outside order-to-cash reaches users untested | B-016 | 87 of 319 changing routes tested |
| Stock on the books drifts from the floor: no adjustment, processing moves no stock | I-016, M-016 | The owner's rules are needed |
| No restore has ever been tested | E-015 | The owner's database |
| Nothing happens without a person: no reminders or retries | B-019 | Undecided |
| **New:** a staff login with no home branch sees nothing after this code is merged | R-21 | The owner must set home branches first |
| **New:** a repeated order request creates a second order | C-006 | Deferred to Phase 3 |

**Deferred risks, with justification.** Each of the 58 deferrals carries its own in `findings-register.md`. The ones Phase 2 deferred itself: C-002 (carrier partner routes, unreachable today, integration phase), C-006, C-009, C-010 and C-011 (each needs a database change, Phase 3), C-012 (cosmetic), C-013 (needs the owner's scheduling rules), E-014 (host, Phase 10), E-023 (Phase 11).

**Required business decisions.** B-011, B-019, D-033, D-035, E-011, E-015, E-017, F-008, F-009, I-007, I-016, M-016, M-017, S-009, S-010, S-020, S-027, U-012, X-007. The three that block the most: what a completed work order consumes and produces (M-016), stock adjustment (I-016), approval of the major package upgrades (E-011: none critical; one high in the development server only).

**Before this code is merged, the owner must:**

1. Apply the five SQL Editor files in order.
2. Give every staff login a home branch.
3. Confirm or change the list of all-branch roles and the department table.

---

## PHASE 3 HANDOFF

**Phase 3 of 12: database integrity, transactional correctness, performance and 80-location scalability.** Not started. What Phase 2 found that belongs to it:

| # | Subject | Evidence | Tables | Depends on | Tests required |
|---|---|---|---|---|---|
| 1 | **Schema: two JSON stores hold whole records** (B-009, P1) | Code read of `orderHubRoutes.js` and the v1 inventory routes: records kept as JSON in `AppSetting` | AppSetting; target Order, Coil, Inventory | Decision 1 (which list is real) | Migration run twice on a copy; counts before and after; the second stock list and order hub screens read the real tables |
| 2 | **Missing branch columns** (C-009) | `lib/branchScope.js` lists what is covered; these are not | Quote, RFQ, Package, DropTag, Document | Backfill rule per table | Extend `branch-boundary.mjs` to each |
| 3 | **Orders without a branch** | The Phase 2 file placed 163 of 170 on the copy; 7 remain null and are visible only to all-branch roles | Order | Owner applies the file; someone assigns the rest | A database check that counts orders with no branch; then make the column required |
| 4 | **A branch stored as free text with no foreign key** (C-003) | `DispatchJob.locationId` held "FWA", a branch that does not exist | DispatchJob, DispatchOperation | Clean-up of existing rows | Foreign key added; a check for rows that match no branch |
| 5 | **Missing constraints: value checks** (E-004, P1) | 0 to 8 value checks in the database; quantities and amounts can be saved negative by any future code path | Order, OrderLine, Invoice, Payment, Shipment, Coil, Inventory | None | Each check proven by a refused insert |
| 6 | **No duplicate-request protection on order creation** (C-006) | Concurrency test 2: two identical order requests make two orders | New RequestKey table; Order | A request key sent by the screens | The same request sent three times at once saves one order |
| 7 | **A void is two transactions** (C-010) | `quickSale.js`: the claim and stock return commit, then the credit and refund | Order, Invoice, Payment, credit memos | `creditInvoice` and `recordRefund` must accept a transaction | A forced failure in the credit leaves the sale un-voided |
| 8 | **Shelf items cannot be received** (C-011) | `Coil.heatId` and `gradeId` are required, so a box of fasteners cannot be received; shelf stock exists only by fixture | Coil, Inventory | The owner's rule for piece goods | Receive by the piece, sell at the counter, reconcile |
| 9 | **The void marker is text inside order notes** | `quickSale.js` claims a void by matching text | Order | A column or status | Conditional update on the new column |
| 10 | **Home branch is optional** (R-21) | `User.homeLocationId` is nullable; a held login without one sees nothing | User, UserLocation | Owner sets home branches | A database check that counts held logins with no branch |
| 11 | **Indexing and expensive queries** | The branch filter reaches invoices, payments, order lines and shipment items through their order: one more join per query. 76 list queries have no row limit. The cockpit loads far more than it shows (E-023). No measurement at volume was taken | Order, OrderLine, Invoice, Payment, ShipmentItem, Job | A data set at 80-branch scale | Query plans and timings at volume, before and after any index |
| 12 | **Transaction isolation and locking** | Everything runs at read committed. Correctness rests on conditional updates and, in one place, row locks taken in a fixed order (dispatch job, then job). Not tested beyond a handful of simultaneous requests | Job, DispatchJob, Coil, Inventory, Shipment, Invoice | None | The eight probes and the integrity races at higher concurrency; a deadlock check |
| 13 | **Inventory reconciliation** | Clean on three seeds for what the application does. It does not adjust, count or scrap (I-016), and processing moves no stock (M-016) | Coil, Inventory, MaterialMovement | The owner's rules | Reconciliation after each new kind of movement |
| 14 | **Data duplication** | Second stock list and order hub (item 1); 52 tables that no code uses; stock balance kept both on the item and in movements (identity enforced since Workstream 5) | Many | None | The identity check stays in the gates |
| 15 | **Migration safety** | Five SQL Editor files are waiting; each was run twice on a copy. There is no staging database | All | The owner | A dry run on a restored copy of the live database |
| 16 | **Backup and recovery** (E-015, P1) | No restore has been tested | All | The owner's database provider | A timed restore to a scratch database |
| 17 | **Data retention** | Audit and movement tables grow without limit; no retention rule exists | AuditLog, MaterialMovement, time logs | The owner's rule | None until the rule exists |
| 18 | **Concurrency bottleneck: numbering** | Order, shipment and invoice numbers are one company-wide series, counted across branches inside the creating transaction. Ten at once pass. Not measured at volume | Order, Shipment, Invoice | None | 80 branches creating at once |

Phase 3 should start by reading `phase-02-transaction-safety.md` section 5 and `database-inventory.md`.

---

## Completion requirements of the Phase 2 instruction

| Requirement | Met |
|---|---|
| Baseline recorded before changes | Yes: commit `0ad7857`, scores and test counts |
| Architecture analysed and documented | Yes |
| Confirmed in-scope P0 and P1 architecture defects corrected | **In part: B-003, B-004, C-001, C-005 yes; B-009 no** |
| Corrections in small tested batches | Yes, five |
| Transaction and concurrency tests | Nine of ten executed; one not supported by the application |
| API contracts documented, none broken | Yes |
| Multi-location safety | Yes for 15 record types; C-009 open |
| Twenty scenarios | **In part: 17 executed, 2 not executable, 1 not verified** |
| Gates A to G with evidence | Six pass; F not fully met |
| Every finding dispositioned | Yes |
| Nine Phase 2 files; six registers updated | Yes |
| No existing functionality removed; no test disabled; no mock in place of a real implementation | Yes |
| No destructive migration; nothing run on production | Yes |
| Phase 3 handoff prepared; Phase 3 not started | Yes |

Because two requirements are met only in part, the phase is reported as PARTIALLY COMPLETE and not as verified complete.
