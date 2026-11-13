# Findings register

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit c4da120. Do not edit by hand: change the source and rerun.

Source of truth: `findings.json` in this folder. Nothing is ever deleted from it. IDs are permanent: B = Phase 1 baseline; C = Phase 2 architecture review; E, S, I, M, F, X = the six earlier workstreams; D = the first audit; U = user-experience register. The older registers in `qa/` are kept as history.

Severity: P0 critical security, financial integrity, data corruption or outage risk. P1 essential workflow failure or significant operational risk. P2 functional, architectural, performance or maintainability deficiency. P3 minor.

## Counts

| Severity | All | Still open |
|---|---:|---:|
| P0 | 20 | 2 |
| P1 | 76 | 17 |
| P2 | 80 | 42 |
| P3 | 67 | 29 |
| Total | 243 | 90 |

| Status | Count |
|---|---:|
| VERIFIED FIXED | 152 |
| DEFERRED TO SPECIFIC PHASE | 63 |
| REQUIRES BUSINESS DECISION | 23 |
| BLOCKED | 2 |
| IN PROGRESS | 2 |
| NOT APPLICABLE | 1 |

## Open findings, most severe first

| ID | Sev | Status | Module | What is wrong | Assigned to |
|---|---|---|---|---|---|
| X-001 | P0 | DEFERRED TO SPECIFIC PHASE | Safety (13 screens, on the menu) | Incidents, inspections, permits, training, observations, corrective actions and stop work all showed invented records. The calls to the server are commented out in the code. Nothing entered was saved | Enterprise experience |
| X-002 | P0 | DEFERRED TO SPECIFIC PHASE | Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup | 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or item typed in | Enterprise experience |
| B-009 | P1 | DEFERRED TO SPECIFIC PHASE | Second stock list, order hub, stop work | Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other. | Phase 2: architecture and code quality (after the decision) |
| B-016 | P1 | DEFERRED TO SPECIFIC PHASE | Testing | Order to cash is covered in depth. Outside it, most changing routes have no success-path test. | Testing phase; each phase for its own area |
| B-019 | P1 | REQUIRES BUSINESS DECISION | Platform | Everything happens only when someone opens a screen or presses a button. | Integration phase |
| E-011 | P1 | REQUIRES BUSINESS DECISION | Platform | Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high) | Phase 2: architecture and code quality |
| E-014 | P1 | DEFERRED TO SPECIFIC PHASE | Platform | The request rate limit counts per server instance | Phase 2: architecture and code quality |
| E-015 | P1 | REQUIRES BUSINESS DECISION | Platform | No evidence that a backup has ever been restored | Phase 2: architecture and code quality |
| E-023 | P1 | DEFERRED TO SPECIFIC PHASE | Operations cockpit | `GET /api/ops-cockpit` loaded every job, order with lines, stock item, shipment and dispatch operation on each call. It also tested for job and shipment statuses that do not exist, so completed jobs were treated as open  | Phase 2: architecture and code quality |
| G-019 | P1 | REQUIRES BUSINESS DECISION | Shipments | Shipping reserved stock is fully recorded. Shipping without a reservation is accepted and records nothing about the material. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| I-007 | P1 | REQUIRES BUSINESS DECISION | Purchasing | There is no purchase order: nothing records what was ordered from a mill, what is due, or whether a receipt matches an order or a supplier invoice | Inventory and purchasing |
| I-011 | P1 | DEFERRED TO SPECIFIC PHASE | Supplier quality (six screens) | Inbound receiving, IQC inspections, nonconformances, SCARs, scorecards and suppliers show invented suppliers, inspections and scores. No server side exists | Inventory and purchasing |
| I-012 (D-024) | P1 | DEFERRED TO SPECIFIC PHASE | Inventory | Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory menu opened the second | Inventory and purchasing |
| I-016 | P1 | REQUIRES BUSINESS DECISION | Stock corrections | There is no way to correct a stock quantity: no count, adjustment or scrap on the real stock list | Inventory and purchasing |
| M-011 | P1 | DEFERRED TO SPECIFIC PHASE | Production quality (5 screens), Bills of material | Sample data presented as real; the BOM screen was hard-wired to samples | Manufacturing and processing |
| M-016 | P1 | REQUIRES BUSINESS DECISION | Work orders | Completing a work order changes no stock: the source item is not used up and the pieces made are not added | Manufacturing and processing |
| S-010 | P1 | REQUIRES BUSINESS DECISION | Delivery promise | Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout | Sales and customer operations |
| X-007 | P1 | REQUIRES BUSINESS DECISION | Order entry, web checkout, online settings | Order cut-off times, delivery promise dates, the "ship from another branch" comparison (with invented branch stock), the fulfilment override and split shipments run from sample rules built into the browser. No server rou | Enterprise experience |
| X-009 | P1 | DEFERRED TO SPECIFIC PHASE | Scale of sample screens | 58 of 143 screens are samples. All now say so | Enterprise experience |
| B-011 | P2 | REQUIRES BUSINESS DECISION | Shop-floor operations | Any call is accepted. | Manufacturing phase |
| B-012 | P2 | DEFERRED TO SPECIFIC PHASE | Lists across the server | Some are small set-up lists where no limit is harmless; others grow with products, operators and partners. | Performance phase |
| B-014 | P2 | DEFERRED TO SPECIFIC PHASE | Code base | Business rules sit inside route handlers and large screens, where a unit test cannot reach them. | Phase 2: architecture and code quality |
| B-015 | P2 | DEFERRED TO SPECIFIC PHASE | Frontend | Most icon buttons have no name (some have tooltips, which were not counted). | Phase 9: user experience |
| B-017 | P2 | DEFERRED TO SPECIFIC PHASE | Database | A third of the schema is design that was never built (see X-009). | Data integrity phase (after X-009) |
| B-018 | P2 | BLOCKED | Partner API | It is marked for retry and never sent again. | Integration phase |
| B-021 | P2 | DEFERRED TO SPECIFIC PHASE | Documents | On a disk host the file is also reachable by its address alone. | Security and multi-location phase |
| C-002 | P2 | DEFERRED TO SPECIFIC PHASE | Partner API: carriers | The carrier routes cannot work as written, and if repaired in place would skip those rules. | Integration phase |
| C-009 | P2 | DEFERRED TO SPECIFIC PHASE | Access control | The core order-to-cash and shop records are held; the rest are not. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| C-011 | P2 | DEFERRED TO SPECIFIC PHASE | Receiving | They cannot. The counter rule built in Phase 2 takes effect only where piece-counted stock exists; elsewhere the sale goes through and the receipt says no stock was reduced. | Inventory and purchasing |
| C-013 | P2 | DEFERRED TO SPECIFIC PHASE | Operations cockpit | Any text shaped like a recommendation moves jobs. | Manufacturing and processing |
| D-020 | P2 | DEFERRED TO SPECIFIC PHASE |  | 155 of 352 distinct API calls written in the screens have no server route (`qa/api-contract.md`). Largest groups: work centers, jobs, QA/QC, pricing, BOMs, provenance. | By subject (see the finding) |
| D-024 | P2 | DEFERRED TO SPECIFIC PHASE |  | Stock is held in two unconnected sets of tables: the coil and inventory records used by orders and shipping, and a separate unit-tracking set under `/api/v1/inventory`. Five screen services still return made-up data (`br | By subject (see the finding) |
| D-033 | P2 | REQUIRES BUSINESS DECISION |  | The app does not charge cards. A card sale is recorded with the approval code from a separate card terminal. | By subject (see the finding) |
| D-034 | P2 | DEFERRED TO SPECIFIC PHASE |  | Receipts, quotes and invoices are not emailed or texted. The buttons say so. | By subject (see the finding) |
| D-036 | P2 | DEFERRED TO SPECIFIC PHASE |  | Sales Dashboard fixed in Phase 2 Workstream 2 (S-012): it now counts from the database. The Order Hub RFQ pages remain a separate console, not in the menu. | By subject (see the finding) |
| E-017 | P2 | REQUIRES BUSINESS DECISION | Platform | No error tracking or alerting service; logs only | Phase 2: architecture and code quality |
| E-019 | P2 | DEFERRED TO SPECIFIC PHASE | Database | Some tables carry a tenant id; whether every query honours it has not been audited | Phase 2: architecture and code quality |
| E-021 | P2 | DEFERRED TO SPECIFIC PHASE | API | List routes answer in two shapes: a bare list, or `{ data, meta }` | Phase 2: architecture and code quality |
| F-008 | P2 | REQUIRES BUSINESS DECISION | Web store checkout | The store shows the buyer an estimate of tax by the ship-to state. On acceptance the order is taxed by the selling branch (rule 27). The two can differ | Shipping and financial operations |
| F-009 | P2 | REQUIRES BUSINESS DECISION | Invoices | Any staff login can read every invoice and its payments (reads are open to all staff by design; only changes are restricted) | Shipping and financial operations |
| F-011 | P2 | DEFERRED TO SPECIFIC PHASE | Shipping documents | Whether a bill of lading or packing list can be printed for a shipment was not examined. Print code exists in the server (`printQueue`, `printAutomationService`); the new Shipment screen has no print button | Shipping and financial operations |
| F-012 | P2 | DEFERRED TO SPECIFIC PHASE | Frontend build | A stray word left in `AppRouter.jsx` by a patch in this workstream passed the production build and broke every screen at run time. Caught by the browser check before commit | Shipping and financial operations |
| G-003 | P2 | DEFERRED TO SPECIFIC PHASE | Database | Most of the 217 are in the 93 tables that hold no rows and belong to modules that are designed but not built (X-009, B-017). | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-006 | P2 | REQUIRES BUSINESS DECISION | Stock items | The company total rises by the remnant's weight. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-007 | P2 | DEFERRED TO SPECIFIC PHASE | Inventory | The item is at the destination the moment the sender presses the button. What is on the road is counted as on the receiver's shelf. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-008 | P2 | REQUIRES BUSINESS DECISION | Work orders | A work order does not claim its source item. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-011 | P2 | DEFERRED TO SPECIFIC PHASE | Platform | History can be rewritten by any code with database access. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-015 | P2 | BLOCKED | Platform | Unknown. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| I-017 | P2 | DEFERRED TO SPECIFIC PHASE | Receiving | A heat must be on file before stock is received against it, and heats are added one at a time | Inventory and purchasing |
| M-017 | P2 | REQUIRES BUSINESS DECISION | Jobs | The job rules allow some backward moves (for example in process back to ordered); `/start` and `/complete` keep their own checks; the print hook runs on some status routes and not others | Manufacturing and processing |
| M-018 | P2 | IN PROGRESS | Help manual | The pages for time tracking and the order board described features that do not exist (clock in and out, timesheet approval, an order panel) | Manufacturing and processing |
| S-008 | P2 | DEFERRED TO SPECIFIC PHASE | Order entry | Two entry screens list four Michigan branches in code | Sales and customer operations |
| S-009 | P2 | REQUIRES BUSINESS DECISION | Remnants | Remnant discount is fixed in code at 15% and 25% on two screens | Sales and customer operations |
| S-020 | P2 | REQUIRES BUSINESS DECISION | Customers | "Default Discount %" on the customer screen is applied nowhere | Sales and customer operations |
| S-021 | P2 | DEFERRED TO SPECIFIC PHASE | Order Hub | A second RFQ console, not in the menu, beside RFQs & Quotes | Sales and customer operations |
| S-022 | P2 | DEFERRED TO SPECIFIC PHASE | Counter | The POS session API is called by no screen and saves no tax | Sales and customer operations |
| S-024 | P2 | IN PROGRESS | Help manual | Pricing, Sales Dashboard, Sales Rep Mobile and customer pages described tabs, contracts, signatures, visit logs and offline use that do not exist | Sales and customer operations |
| S-026 | P2 | DEFERRED TO SPECIFIC PHASE | Sales screens | Screen code calls 18 sales routes that do not exist: 13 under `/api/pricing` in `api/pricing.js`, 3 will-call, 2 split-shipment | Sales and customer operations |
| S-027 | P2 | REQUIRES BUSINESS DECISION | Quotes | Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products | Sales and customer operations |
| X-008 | P2 | DEFERRED TO SPECIFIC PHASE | Counter (`/pos`), will-call screens | The will-call pickup queue and completion screens use sample orders. The screen is not on the menu | Enterprise experience |
| X-010 | P2 | DEFERRED TO SPECIFIC PHASE | Help manual | Only the pages rewritten in Workstreams 2 to 5 were checked against their screens. The pages for sample modules (safety, maintenance, training and others) still describe them as working | Enterprise experience |
| B-013 | P3 | DEFERRED TO SPECIFIC PHASE | Code base | It is kept, read by new engineers and scanned by every tool. | Phase 2: architecture and code quality |
| B-022 | P3 | DEFERRED TO SPECIFIC PHASE | Demo and QA data | The demo seed writes rows directly and skips the rules. | Data integrity phase |
| B-024 | P3 | DEFERRED TO SPECIFIC PHASE | Code base | The 39 effect warnings are the ones that can be defects: an effect that reads a value it does not list can show stale data. They have not been read one by one. | Phase 2: architecture and code quality |
| C-012 | P3 | DEFERRED TO SPECIFIC PHASE | Order intake | A fixed code. If the company record has another code the seller is left empty. | Sales and customer operations |
| D-023 | P3 | DEFERRED TO SPECIFIC PHASE |  | The demo seed data contains 49 inconsistent orders (shipped quantities with no shipment, fully shipped orders still marked confirmed). | By subject (see the finding) |
| D-027 | P3 | DEFERRED TO SPECIFIC PHASE |  | The request rate limit counts per server instance, so on the hosted site the real limit is higher than configured. | By subject (see the finding) |
| D-035 | P3 | REQUIRES BUSINESS DECISION |  | Sales tax is charged only for states that have a rate set. A sale at a branch in a state with no rate charges no tax and says so on the screen. A login with no home branch also charges no tax. A new screen, Admin > Sales | By subject (see the finding) |
| E-018 | P3 | DEFERRED TO SPECIFIC PHASE | Code | Five server route files of 870 to 1,390 lines; five screen files over 1,000 lines | Phase 2: architecture and code quality |
| G-009 | P3 | DEFERRED TO SPECIFIC PHASE | Counter quick sale | Free text. The order stays COMPLETE. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-013 | P3 | DEFERRED TO SPECIFIC PHASE | Stock items, stock search, heat trace | Both grow in step with the whole company's data. Both are far inside the half-second target today. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-014 | P3 | DEFERRED TO SPECIFIC PHASE | Orders | Each order comes with its full lines and customer record. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-016 | P3 | REQUIRES BUSINESS DECISION | Database | Everything is kept for ever in the working tables. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-018 | P3 | DEFERRED TO SPECIFIC PHASE | Database | The column is optional, so that existing rows and all-branch logins keep working. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-020 | P3 | DEFERRED TO SPECIFIC PHASE | Orders | Status is protected; other fields are last write wins. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| U-002 | P3 | DEFERRED TO SPECIFIC PHASE | Order Hub RFQ pages | A second RFQ console beside RFQs & Quotes | Phase 9: user experience |
| U-004 | P3 | DEFERRED TO SPECIFIC PHASE | Several secondary screens | Call server routes that do not exist (D-020) | Phase 9: user experience |
| U-008 | P3 | DEFERRED TO SPECIFIC PHASE | Sales Rep Mobile, delivery preview | A date nobody computed | Phase 9: user experience |
| U-011 | P3 | DEFERRED TO SPECIFIC PHASE | Order entry, Retail POS | Branch list fixed at four Michigan branches | Phase 9: user experience |
| U-012 | P3 | REQUIRES BUSINESS DECISION | Customers > Preferences | "Default Discount %" is offered and applied nowhere | Phase 9: user experience |
| U-019 | P3 | DEFERRED TO SPECIFIC PHASE | Supplier quality, six screens | Invented data presented as real | Phase 9: user experience |
| U-020 | P3 | DEFERRED TO SPECIFIC PHASE | Menu | "Inventory" and "Units" were two different stock lists | Phase 9: user experience |
| U-022 | P3 | DEFERRED TO SPECIFIC PHASE | Receiving | A heat must be added before its stock, one at a time | Phase 9: user experience |
| U-028 | P3 | DEFERRED TO SPECIFIC PHASE | Old operator screen | Recorded output into nothing | Phase 9: user experience |
| U-029 | P3 | DEFERRED TO SPECIFIC PHASE | Production quality, BOMs | Invented data presented as real | Phase 9: user experience |
| U-035 | P3 | DEFERRED TO SPECIFIC PHASE | Freight and logistics | Invented routes, rates and tracking presented as real | Phase 9: user experience |
| U-036 | P3 | DEFERRED TO SPECIFIC PHASE | Shipment | No button to print a bill of lading or packing list | Phase 9: user experience |
| U-037 | P3 | DEFERRED TO SPECIFIC PHASE | Safety, maintenance, training, contractors, customer quality, executive, provenance | Invented data presented as real | Phase 9: user experience |
| U-040 | P3 | DEFERRED TO SPECIFIC PHASE | Menu | Lists 58 sample screens beside the real ones | Phase 9: user experience |
| U-041 | P3 | DEFERRED TO SPECIFIC PHASE | Checkout, order entry | Promise dates and branch suggestions from invented rules | Phase 9: user experience |

## Every finding in full

### B-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Access control
- **Workflow:** Shop floor: job changes
- **Category:** Security
- **Source file or endpoint:** src/backend/src/lib/roleAccess.js; src/backend/src/app.js (jobs and work centers are mounted at /api/… and /api/v1/…)
- **Evidence:** qa/sim/baseline-probe.mjs section 2, run on commit 2d801ff: a maintenance login got 403 on PATCH and POST /api/jobs/… and 200 or 201 on the same calls at /api/v1/jobs/…; the job moved from SCHEDULED to IN_PROCESS.
- **Expected:** The department rule for a record applies at every address that serves it.
- **Actual:** The rule was written for /api/jobs only. The same routes at /api/v1/jobs had no rule.
- **Root cause or suspected cause:** The write rules match on the address text, and the second mount was never added to them.
- **Operational impact:** Any staff login outside production, sales, warehouse and quality could create, edit and move shop jobs.
- **Affected dependencies:** Job board, schedule, time tracking, shipping (jobs gate shipments).
- **Recommended correction:** The rule now judges the second address as if it were the first (ruledPath).
- **Required tests:** Unit test and probe section 2.
- **Assigned phase:** Phase 1 (done)
- **Verification evidence:** Probe section 2: 4 problems before, 0 after. Unit test "the second address for jobs and work centers is judged by the same rule as the first".
- **First recorded in:** Phase 1 discovery

### B-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Access control
- **Workflow:** All
- **Category:** Security
- **Source file or endpoint:** src/backend/src/lib/roleAccess.js (staffWriteDenial)
- **Evidence:** qa/sim/baseline-probe.mjs section 1, run on commit 2d801ff: of 542 write calls made as AUDITOR and DATA_ANALYST, 290 were not refused; 28 succeeded outright, including creating jobs, order-hub orders and contacts, starting pipeline runs and changing demand settings.
- **Expected:** A read-only role changes nothing. The code names these roles "readOnly".
- **Actual:** Read-only roles were refused only where a department rule existed. Every route with no rule let them in.
- **Root cause or suspected cause:** The rules list who may change each listed area and allow everything not listed.
- **Operational impact:** An auditor or analyst login could change production, pricing set-up and master data.
- **Affected dependencies:** Every write route.
- **Recommended correction:** Read-only roles are now refused on every changing request except a short list of requests that only ask a question (sign-in, the assistant, price calculations, form checks).
- **Required tests:** Unit test and probe section 1, which covers every write route in the discovery file.
- **Assigned phase:** Phase 1 (done)
- **Verification evidence:** Probe section 1: 290 not refused before, 0 after (542 calls). Unit test "read-only roles change nothing, and may still ask questions that change nothing".
- **First recorded in:** Phase 1 discovery

### B-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Access control
- **Workflow:** All
- **Category:** Security: multi-location
- **Source file or endpoint:** Every route file under src/backend/src/routes; User.homeLocationId, UserLocation, UserDivision in schema.prisma
- **Evidence:** Code: no route reads req.user.homeLocationId, UserLocation or UserDivision to limit a query (only routes/users.js scopes by organization, and only for user records). Database: UserLocation and UserDivision hold 0 rows after a full run. qa/sim/baseline-probe.mjs section 4: a login whose home branch has no stock read another branch's stock (200), listed and opened orders of every branch (200).
- **Expected:** To be decided. The program brief describes tenant, division and location access as an existing architecture.
- **Actual:** Branch, division and region are fields on records and filters on screens. They are not an access boundary: every staff login reads every branch, and changes any branch within its department.
- **Root cause or suspected cause:** The access model was built on role and department only.
- **Operational impact:** At 80 branches every employee can see, and within their department change, every other branch's orders, stock, prices and customers.
- **Affected dependencies:** Every list and detail route; reports; the screens' branch pickers.
- **Recommended correction:** Needs the owner's rule first: which roles are held to their own branch or region for reading, and which for changing. Then one scoping helper used by every route, and a sweep section that proves it.
- **Required tests:** A sweep section: a branch login cannot read or change another branch's rows on every route that carries a location.
- **Assigned phase:** Security and multi-location phase (extends E-019)
- **Status note:** Owner's decision 2, 2026-11-13: Read as: staff see and change only their own branch's records. Super admin and high-level management see every branch. Which roles count as high-level management, and how transfers and ship-from-another-branch work under this rule, will be proposed in the security and multi-location phase for the owner to confirm. Phase 2: enforced in the database client (lib/branchScope.js, lib/db.js) for orders, order lines, invoices, invoice lines, payments, stock items, stock levels, shipments, shipment items, jobs, work orders, work centers, dispatch jobs, dispatch operations and stock movements. Roles that see every branch: super admin, tenant owner, admin, executive, CFO, COO, CIO, division director, operations manager, sales director, credit manager, data analyst, auditor, integration admin. What it does not yet cover is finding C-009.
- **Verification evidence:** qa/sim/branch-boundary.mjs: 37 checks, 0 problems (25 fail with the boundary switched off). test/branchScope.test.js: 9 unit tests. Simulation 150 of 150 and sweep 20 of 20 with the boundary on.
- **First recorded in:** Phase 1 discovery

### B-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Access control
- **Workflow:** Set-up and shop floor
- **Category:** Security
- **Source file or endpoint:** src/backend/src/lib/roleAccess.js (WRITE_RULES)
- **Evidence:** A saw-operator login was sent every write route (scratch probe, this session). Refused everywhere under orders, quotes, customers, invoices, shipments, products, grades, users, tax rates and the counter. Not refused on any write route under: processing recipes, work centers, staff and shifts, dispatch set-up, bills of material, assets, maintenance orders, documents (upload and delete), drop tags, print queue, stop work, the second stock list (/api/v1/inventory), the order hub (/api/v1 contacts, RFQs, quotes, orders), demand shaping, exception events, material tracking.
- **Expected:** Each of these has an owner department.
- **Actual:** 16 areas have no department rule. Any staff login that is not read-only can change them.
- **Root cause or suspected cause:** Rules were added for the core order-to-cash records only.
- **Operational impact:** An operator can delete a work center, change a recipe or an operator's skills, or delete a mill certificate.
- **Affected dependencies:** Scheduling, routing, quality records, documents.
- **Recommended correction:** Needs the owner's matrix. Proposed: set-up records (work centers, recipes, BOMs, staff, assets, dispatch set-up) to production managers and admins; documents delete to quality, warehouse leads and managers; maintenance to maintenance and production managers; order hub to sales.
- **Required tests:** Probe: one refused role per area, generated from the rule table.
- **Assigned phase:** Security and multi-location phase
- **Status note:** Owner's decision 3, 2026-11-13: The engineer assigns each area to the department that does that work, lists the assignment in permissions-matrix.md when it is implemented, and the owner can change any line. Phase 2, under the owner's decision 3: every area now has a department or role (lib/roleAccess.js WRITE_RULES; the table is in phase-02-service-boundaries.md and permissions-matrix.md). The owner can change any line.
- **Verification evidence:** test/roleAccess.test.js "the areas that had no department now have one"; qa/sim/phase2-integrity.mjs: 10 refusals through the API; qa/tools/access-coverage.mjs: 319 changing routes, 0 with no rule or stated reason (it fails the gates if one appears).
- **First recorded in:** Phase 1 discovery

### B-005 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** API error handling
- **Workflow:** Work centers, assets, maintenance orders, partner admin, pricing override, executive, material tracking
- **Category:** Reliability
- **Source file or endpoint:** src/backend/src/middleware/safeErrors.js; src/backend/src/lib/db.js; routes/workCenters.js, assets.js, maintenanceOrders.js, salesRoutes.js, executive.js, materialTrackingRoutes.js, partner/adminRoutes.js
- **Evidence:** qa/sim/baseline-probe.mjs section 3 on commit 2d801ff: 19 of 275 write routes answered an empty body or an unknown id with a 500.
- **Expected:** An unknown record is a 404. Missing or wrong values are a 400. A 500 means the server is at fault.
- **Actual:** These handlers catch every failure and answer 500, including "that record does not exist".
- **Root cause or suspected cause:** No validation in the handler, and one catch-all reply.
- **Operational impact:** Staff see "failed" with no reason; monitoring cannot tell a typing mistake from an outage.
- **Affected dependencies:** Error monitoring; the screens' messages.
- **Recommended correction:** The reply layer now turns a failed change into 404 when the record was not there and 400 when the database layer refused the values, and logs the detail. One handler (new scenario) checks its name. Field-by-field validation in these handlers is still owed (see B-007).
- **Required tests:** Unit test for the rule; probe section 3 with a ceiling that can only go down.
- **Assigned phase:** Phase 1 (done); validation in Phase 2
- **Verification evidence:** Probe section 3: 19 server errors before, 3 after (the 3 are B-006). Unit test "a change aimed at a missing record…".
- **First recorded in:** Phase 1 discovery

### B-006 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Counter (older session flow)
- **Workflow:** Counter pricing
- **Category:** Broken code
- **Source file or endpoint:** src/backend/src/routes/pos.js: POST /api/pos/pricing/margin/validate, /pricing/processing, /pricing/quantity-breaks
- **Evidence:** qa/sim/baseline-probe.mjs section 3: all three answer 500 every time. Server log: "Cannot read properties of undefined (reading 'calculateMargin')". The routes import a name the pricing module does not export, and getQuantityBreaks exists nowhere. The only caller in the screens is hooks/useRealTimePricing.js, which nothing imports.
- **Expected:** A route works or is not there.
- **Actual:** Three routes cannot work. No screen reaches them.
- **Root cause or suspected cause:** Left from an earlier counter design.
- **Operational impact:** None in use today. They inflate the route count and the crash count.
- **Affected dependencies:** None found.
- **Recommended correction:** Remove the three routes and the unreachable hook, or repair them if the session counter flow is kept (X-008 decides).
- **Required tests:** Probe section 3 ceiling drops from 3 to 0.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2: the three routes answer 501 with a plain sentence instead of crashing. Nothing was removed; whether the session counter flow is finished or retired stays with X-008.
- **Verification evidence:** Baseline probe section 3: 275 changing routes, 0 server errors (ceiling lowered from 3 to 0 in qa/tools/run-gates.sh).
- **First recorded in:** Phase 1 discovery

### B-007 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Work centers, assets, maintenance orders, executive decisions
- **Workflow:** Set-up
- **Category:** Data integrity: validation
- **Source file or endpoint:** routes/workCenters.js (PATCH /:id), assets.js (PATCH /:id), maintenanceOrders.js (PATCH /:id), executive.js (decision create)
- **Evidence:** Code read: each passes the request body to the database as it arrived ("data: req.body" or a spread of it).
- **Expected:** A handler reads the fields it expects and nothing else (lib/fieldRules.js does this for products, grades and heats).
- **Actual:** Any column can be set by the caller, including status, ids and timestamps.
- **Root cause or suspected cause:** Handlers written before the field rules existed.
- **Operational impact:** A request can put a record into a state the screens never would, or re-point it to another parent.
- **Affected dependencies:** Scheduling reads work centers; maintenance reads assets.
- **Recommended correction:** Read these four through lib/fieldRules.js.
- **Required tests:** Sweep: an unlisted field in the body is not saved.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2: work centers (create and change), equipment (change) and maintenance orders (change) read a field list (lib/fieldRules.js). Creating a work center used to fail every time because it named two columns that do not exist; it works now (C-004). The executive decision route was not mass assignment (its service picks the fields); only who made the decision was wrong, and that now comes from the signed-in user.
- **Verification evidence:** qa/sim/phase2-integrity.mjs: 9 checks on work centers, equipment and maintenance orders. The executive decision change has no automated check: FIXED, NOT VERIFIED for that one line.
- **First recorded in:** Phase 1 discovery

### B-008 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs, order hub, counter sessions, demand shaping
- **Workflow:** Record creation
- **Category:** Data integrity: validation
- **Source file or endpoint:** POST /api/jobs, /api/v1/jobs, /api/v1/orders, /api/v1/contacts, /api/pos/sessions, /api/demand-shaping/suggestions, /api/orders/intake
- **Evidence:** qa/sim/baseline-probe.mjs section 3: each answered 200 or 201 to an empty body and saved a record. After the probe the QA database held shop jobs with no order, no order line and no description.
- **Expected:** A record needs its minimum content. (A draft order with no lines yet is legitimate; a job with nothing is not.)
- **Actual:** Seven create routes save from nothing.
- **Root cause or suspected cause:** No required-field check.
- **Operational impact:** Empty jobs appear on the board and the schedule; empty order-hub orders appear in the pipeline.
- **Affected dependencies:** Job board, schedule, order hub.
- **Recommended correction:** Required fields per route. Which of the seven may legitimately start empty needs one line from the owner each (drafts).
- **Required tests:** Probe section 3 reports "saved from nothing" as 0, or lists the allowed drafts.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2: jobs (both addresses), order hub contacts and orders, and intake drafts refuse a save with nothing in it. Two of the seven are by design and stay: a counter session needs only the signed-in user (it now ignores a user id sent by the browser), and demand-shaping suggestions log which suggestions were shown.
- **Verification evidence:** qa/sim/phase2-integrity.mjs: 6 checks. Baseline probe section 3: records saved from nothing fell from 7 routes to the 2 that are by design.
- **First recorded in:** Phase 1 discovery

### B-009 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Second stock list, order hub, stop work
- **Workflow:** Stock, RFQ to order, safety
- **Category:** Architecture: duplicate records
- **Source file or endpoint:** routes/inventoryV1.js + inventoryV1Store.js; routes/orderHubRoutes.js + orderHubStore.js; routes/stopWork.js + stopWorkStore.js
- **Evidence:** Code read. Each keeps whole records as one JSON value per row. inventoryV1.js reloads five whole tables at the start of every request (refresh(), 13 call sites), changes the copies in memory and writes rows back one at a time with no transaction. /api/v1/inventory has its own adjust and transfer routes on stock that orders and shipping never see. The order hub has its own contacts, RFQs, quotes, orders and jobs.
- **Expected:** One stock ledger and one order record, with database rules on them.
- **Actual:** Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other.
- **Root cause or suspected cause:** Prototype stores that were moved from memory into tables without being redesigned.
- **Operational impact:** Stock adjusted or transferred in the second list changes nothing the business ships from. At volume, each request to it reads every row.
- **Affected dependencies:** D-024, S-021, I-011 and the open decision card "Choose which stock list is the real one".
- **Recommended correction:** The owner chooses the real one of each pair. Then the other is removed or made a view of the first.
- **Deferred: reason:** Decision 1 says the second stock list and the order hub are to be connected to the real tables or retired. Either needs the live contents of the two JSON stores to be read first (a read-only export the owner runs), and the screens rebuilt on the real routes, which is module work.
- **Deferred: target phase:** The phase the owner issues for inventory and purchasing, and for sales (prompts 5 to 8 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Export the two stores read-only; decide record by record whether each is a real order or stock item; point the screens at /api/orders and /api/coils; remove the stores.
- **Deferred: dependencies:** A read-only export of AppSetting from the live database; decision 1.
- **Deferred: acceptance criteria:** No route reads or writes an order or a stock record in AppSetting; the two screens show the same records as the main ones.
- **Deferred: verification:** A database check that the two keys hold no records; the browser suites for both screens.
- **Required tests:** A two-requests-at-once test on whichever store is kept; the audit shows one stock list.
- **Assigned phase:** Phase 2: architecture and code quality (after the decision)
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice. Decided by the owner (decision 1): the stock items list and sales orders are the real ones. Phase 2 put both second copies under a department rule and inside the gates; it did not connect or retire them. Phase 3 audited the two stores and did not migrate them. The QA database holds only fixture rows in them; what the live stores hold cannot be seen from here, and moving records nobody has inspected into the order and stock tables would be changing business data on a guess.
- **First recorded in:** Phase 1 discovery

### B-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Users, shop-floor operations, job planning, material tracking, cockpit, partner carrier
- **Workflow:** Several
- **Category:** Data integrity: partial save
- **Source file or endpoint:** users.js (create, edit, delete, reset password), jobs.js (POST /:id/plan), operationsRoutes.js (start, complete, reassign), materialTrackingRoutes.js (staging ship), opsCockpit.js (accept recommendation), bomV1.js (PUT recipe), dispatchRoutes.js (delete work-center type), demandShaping.js, assets.js (seed), partner/carrierRoutes.js (proof of delivery)
- **Evidence:** Discovery count: 16 handlers make two or more database changes outside a transaction (qa/enterprise-excellence/api-inventory.md lists them). Read in full: operationsRoutes.js start (three changes in sequence) and complete.
- **Expected:** Changes that belong together are saved together or not at all.
- **Actual:** A failure between two changes leaves the first one saved. Example: an operation is marked started and its time log is not created.
- **Root cause or suspected cause:** Sequential awaits.
- **Operational impact:** Time logs, user role assignments and job plans can be half-saved after an error.
- **Affected dependencies:** Time tracking, labor costing, user administration.
- **Recommended correction:** Wrap each in one transaction.
- **Required tests:** A test per handler that fails the second change and checks the first was not kept.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2: 10 of the 16 handlers now save in one transaction: users (create, edit, delete, reset password), job plan, operation start, complete and reassign, staging ship, recipe change. One was never a multi-step save (deleting a work center type is a single write). Three are separate findings: accepting a cockpit recommendation (C-013), the equipment seed and demand shaping (repeatable set-up writes, by design), and the carrier proof of delivery (C-002).
- **Verification evidence:** qa/sim/phase2-integrity.mjs: start, complete, reassign and plan checked against the database, including a refused reassign that leaves the clock running. 32 of the first 43 checks fail on the code before the change.
- **First recorded in:** Phase 1 discovery

### B-011 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Shop-floor operations
- **Workflow:** Start and complete an operation
- **Category:** Workflow rules
- **Source file or endpoint:** routes/operationsRoutes.js: POST /:id/start, /:id/complete
- **Evidence:** Code read: neither checks the operation's present status. A completed operation can be started again; an operation can be completed twice or without having started.
- **Expected:** An operation follows not-started, running, paused, complete (lib/workflowRules.js does this for jobs, orders and shipments).
- **Actual:** Any call is accepted.
- **Root cause or suspected cause:** No move table for operations.
- **Operational impact:** Actual start and end times and the time logs can be overwritten; labor time is unreliable.
- **Affected dependencies:** Time tracking, schedule, job status.
- **Recommended correction:** A move table for operations in lib/workflowRules.js. Whether a completed operation may be reopened for rework is the owner's rule (extends M-017).
- **Required tests:** Unit tests for the table; a sweep check per refused move.
- **Assigned phase:** Manufacturing phase
- **First recorded in:** Phase 1 discovery

### B-012 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Lists across the server
- **Workflow:** Reading
- **Category:** Performance
- **Source file or endpoint:** qa/enterprise-excellence/api-inventory.md, column "list with no limit"
- **Evidence:** Discovery: 58 read routes contain a list query with no row limit. Read and confirmed: GET /api/products returns the whole catalogue; GET /api/staff/operators returns every operator with skills; GET /api/work-centers every work center. The rest are candidates from the code scan and have not each been read.
- **Expected:** A list that grows with the business has a limit and paging.
- **Actual:** Some are small set-up lists where no limit is harmless; others grow with products, operators and partners.
- **Root cause or suspected cause:** Lists written for a demo-sized database.
- **Operational impact:** Response size and time grow with the data at 80 branches.
- **Affected dependencies:** Screens that expect the whole list.
- **Recommended correction:** Read each of the 58; give the growing ones a limit and paging, and record the fixed-size ones as accepted.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Performance phase.
- **Deferred: target phase:** Performance phase: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Screens that expect the whole list.
- **Deferred: acceptance criteria:** A list that grows with the business has a limit and paging.
- **Deferred: verification:** The existing "bounded lists" sweep check extended to these routes.
- **Required tests:** The existing "bounded lists" sweep check extended to these routes.
- **Assigned phase:** Performance phase
- **Status note:** Phase 3 measured the branch list screens on the 85-branch copy: every one answered in under 160 ms at the 95th percentile for a branch login and under 270 ms for an all-branch login (qa/results/phase3-branch-bench-before.json). The unlimited lists were not changed in this phase.
- **First recorded in:** Phase 1 discovery

### B-013 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Code base
- **Category:** Maintainability: dead code
- **Source file or endpoint:** qa/enterprise-excellence/system-inventory.md, "Code nothing uses"
- **Evidence:** Discovery, by following imports from the app entry points: 45 frontend files and 5 server files are imported by nothing. Packages no source file imports: frontend @elevenlabs/elevenlabs-js, elevenlabs, date-fns; server @elevenlabs/elevenlabs-js, express-validator, pg. (@emotion/react and @emotion/styled are also not imported but Material UI needs them installed.)
- **Expected:** Code that is not used is removed.
- **Actual:** It is kept, read by new engineers and scanned by every tool.
- **Root cause or suspected cause:** Screens were replaced without deleting what they replaced.
- **Operational impact:** Slower builds and reviews; old mock code can be wired back in by mistake.
- **Affected dependencies:** None by definition; confirm each before deleting.
- **Recommended correction:** Delete after confirming each file; remove the packages.
- **Deferred: reason:** The owner decided on 13 November that every sample module is to be built (decision 4). Most of the 45 unused screen files belong to those modules, so deleting them now would remove material the build will start from. The six unused packages are left for the same change, so the lock files change once.
- **Deferred: target phase:** The phase the owner issues for each module that is built (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** When a module is built, delete the files it replaced. Remove the packages no file imports.
- **Deferred: dependencies:** Decision 4. X-001, X-002.
- **Deferred: acceptance criteria:** Discovery reports 0 files imported by nothing and 0 unused packages.
- **Deferred: verification:** qa/tools/discover.mjs; build, lint and the 125-screen check after each removal.
- **Required tests:** Build, lint and the 125-screen check after removal.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Reviewed in Phase 2. Not deleted.
- **First recorded in:** Phase 1 discovery

### B-014 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Code base
- **Category:** Maintainability: size
- **Source file or endpoint:** qa/enterprise-excellence/system-inventory.md, "Largest files"
- **Evidence:** Discovery: 65 frontend files are over 600 lines and 5 over 1,000 (router/AppRouter.jsx 1,529; pages/Admin/StaffManagementPage.jsx 1,335 with 35 separate pieces of state; pages/OpsCockpit/OpsCockpitPage.jsx 1,093; components/pos/POSContext.jsx 1,032). Server: routes/pos.js 1,391 lines and 57 routes; dispatchRoutes.js 1,034; jobs.js 923. Route files hold the business logic directly: 72 route files, 18 service files.
- **Expected:** A screen or a handler small enough to read and test.
- **Actual:** Business rules sit inside route handlers and large screens, where a unit test cannot reach them.
- **Root cause or suspected cause:** Growth without refactoring.
- **Operational impact:** Changes are risky and slow; most rules can only be tested through the whole server.
- **Affected dependencies:** Every phase that changes these files.
- **Recommended correction:** Move rules out of the largest handlers into lib/ as they are touched (already done for prices, tax, credit, receiving, workflow moves). Split the five largest screens.
- **Deferred: reason:** The remaining rules sit in 14 route files of 500 to 1,390 lines. Moving them is a refactor of working, tested code, and the Phase 2 instruction is not to refactor in bulk. Each move is safest when its module is being worked on anyway.
- **Deferred: target phase:** The phase the owner issues for each module (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Per module: move the rule out of the handler into lib/ as a pure function with unit tests; the handler calls it.
- **Deferred: dependencies:** E-018.
- **Deferred: acceptance criteria:** Every rule in phase-02-business-rule-ownership.md has a named owner file and a unit test.
- **Deferred: verification:** Unit tests per rule; the simulation and sweep unchanged.
- **Required tests:** Unit tests for each rule moved; the browser suites before and after.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2 moved three rules into testable units: the branch boundary (lib/branchScope.js), who may change a login (lib/userAdminRules.js) and the department table (lib/roleAccess.js). phase-02-business-rule-ownership.md lists every critical rule, its owner file and whether a unit test reaches it.
- **First recorded in:** Phase 1 discovery

### B-015 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Frontend
- **Workflow:** All screens
- **Category:** Accessibility
- **Source file or endpoint:** src/frontend/src (counts in system-inventory.md)
- **Evidence:** Discovery: 301 icon-only buttons and 32 aria-label attributes in the whole frontend. 15 files use the browser's own alert or confirm boxes (25 calls). No accessibility test has ever been run.
- **Expected:** Every control has a name a screen reader can say; confirmations use the application's own dialogs.
- **Actual:** Most icon buttons have no name (some have tooltips, which were not counted).
- **Root cause or suspected cause:** Not checked.
- **Operational impact:** Keyboard and screen-reader users; inconsistent confirmations.
- **Affected dependencies:** None.
- **Recommended correction:** Name every icon button; replace the 25 native boxes; add an automated accessibility check to the browser suites.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** Every control has a name a screen reader can say; confirmations use the application's own dialogs.
- **Deferred: verification:** An accessibility scan in the browser suites.
- **Required tests:** An accessibility scan in the browser suites.
- **Assigned phase:** Phase 9: user experience
- **First recorded in:** Phase 1 discovery

### B-016 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Testing
- **Workflow:** All
- **Category:** Test coverage
- **Source file or endpoint:** qa/enterprise-excellence/testing-gap-analysis.md
- **Evidence:** Measured from server request logs during a full gate run in this session (qa/tools/exercised.mjs): 269 of 611 routes returned a success at least once; of the 319 routes that change data, 72 did. The other 247 write routes have only ever been called by tests that expect a refusal. There are no frontend unit tests. The GitHub check runs the unit tests, the screen audit and lint; the simulation, sweep and browser suites need a database and run only on a developer machine.
- **Expected:** Every route the business depends on has a test that makes it succeed and checks the result.
- **Actual:** Order to cash is covered in depth. Outside it, most changing routes have no success-path test.
- **Root cause or suspected cause:** Tests were built around the order-to-cash path first.
- **Operational impact:** A regression in dispatch, staff, quality records, drop tags, maintenance, the partner API or the order hub would not be seen.
- **Affected dependencies:** Every later phase relies on these gates.
- **Recommended correction:** Add success-path tests area by area as each phase reaches it; run the database-backed gates in the pull-request workflow with a Postgres service.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Testing phase; each phase for its own area.
- **Deferred: target phase:** Testing phase; each phase for its own area: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Every later phase relies on these gates.
- **Deferred: acceptance criteria:** Every route the business depends on has a test that makes it succeed and checks the result.
- **Deferred: verification:** The measured number rises each phase; it is recorded in progress.json.
- **Required tests:** The measured number rises each phase; it is recorded in progress.json.
- **Assigned phase:** Testing phase; each phase for its own area
- **First recorded in:** Phase 1 discovery

### B-017 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Database
- **Category:** Schema
- **Source file or endpoint:** qa/enterprise-excellence/database-inventory.md
- **Evidence:** Discovery: 52 of 157 tables are read or written by no server code (41 safety tables, 11 maintenance, approvals, commodity prices and others). After a full simulation run 96 of 158 tables in the QA database are empty. 160 columns hold free-form JSON, which the database cannot check.
- **Expected:** A table exists because something uses it.
- **Actual:** A third of the schema is design that was never built (see X-009).
- **Root cause or suspected cause:** Schema written ahead of the features.
- **Operational impact:** Migrations, backups and reviews carry tables that mean nothing; the schema overstates what the product does.
- **Affected dependencies:** X-009 decides which modules are built.
- **Recommended correction:** After the X-009 decisions, drop the tables of modules that will not be built. Dropping tables is a destructive change and needs the owner's approval and a SQL Editor file.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Data integrity phase (after X-009).
- **Deferred: target phase:** Data integrity phase (after X-009): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** X-009 decides which modules are built.
- **Deferred: acceptance criteria:** A table exists because something uses it.
- **Deferred: verification:** The inventory shows no table without code.
- **Required tests:** The inventory shows no table without code.
- **Assigned phase:** Data integrity phase (after X-009)
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** Phase 1 discovery

### B-018 · P2 · BLOCKED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Webhooks
- **Category:** Integration
- **Source file or endpoint:** src/backend/src/services/webhookService.js (processPendingRetries)
- **Evidence:** Code read: a failed delivery is marked RETRYING with a next-retry time, and processPendingRetries() would resend it. Nothing calls that function (no import, no schedule), and the server has no scheduler, queue or background worker of any kind.
- **Expected:** A failed delivery is retried.
- **Actual:** It is marked for retry and never sent again.
- **Root cause or suspected cause:** The hosted server runs per request; nothing runs between requests.
- **Operational impact:** A partner that was briefly unreachable never receives the event.
- **Affected dependencies:** Any future integration that needs scheduled work (email, statements, replenishment, overdue invoices).
- **Recommended correction:** A scheduled trigger on the host that calls the retry function. Setting up a schedule on the host is the owner's.
- **Required tests:** A test that fails a delivery, runs the retry and sees it delivered.
- **Assigned phase:** Integration phase
- **Status note:** Needs a scheduled trigger on the host, which is the owner's setting
- **First recorded in:** Phase 1 discovery

### B-019 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Operations
- **Source file or endpoint:** Whole server
- **Evidence:** Discovery: no scheduler, queue, worker, event bus or email or text provider exists in the server code. Nothing is sent to a customer or a colleague by the system (D-033, D-034); exception records are created only when a person or a request creates them; an expired quote or an overdue invoice is worked out when someone looks at it and nobody is told.
- **Expected:** To be decided per function.
- **Actual:** Everything happens only when someone opens a screen or presses a button.
- **Root cause or suspected cause:** Per-request hosting and no provider chosen.
- **Operational impact:** No reminders, no escalation, no automatic status by date, no customer notification.
- **Affected dependencies:** D-033, D-034, B-018, E-017.
- **Recommended correction:** Choose the provider and the host schedule; then build each timed function.
- **Required tests:** Per function.
- **Assigned phase:** Integration phase
- **First recorded in:** Phase 1 discovery

### B-020 · P3 · NOT APPLICABLE

- **Discovered:** 2026-11-13
- **Module:** Access control
- **Category:** Maintainability
- **Source file or endpoint:** src/backend/src/lib/roleAccess.js (STAFF_GROUPS.production)
- **Evidence:** Code read: the production group lists MILL_OPERATOR, which is not a role in the database schema.
- **Expected:** The rule table names only roles that exist.
- **Actual:** One name matches nothing.
- **Root cause or suspected cause:** A role removed or never added.
- **Operational impact:** None today.
- **Affected dependencies:** None.
- **Recommended correction:** Remove the name, or add the role if mills need it.
- **Required tests:** A unit test that every role in the rule table exists in the schema.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2: the finding was wrong. MILL_OPERATOR is in the role list of the database schema (an older role kept for existing logins), so the name does match.
- **Verification evidence:** Read prisma/schema.prisma, enum UserRole.
- **First recorded in:** Phase 1 discovery

### B-021 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Documents
- **Workflow:** Uploaded files
- **Category:** Security
- **Source file or endpoint:** src/backend/src/app.js: app.use('/uploads', express.static(…)) is registered before the sign-in gate
- **Evidence:** Code read only; not probed. On a host with a disk, uploaded files are served from /uploads without a sign-in. On the current host (Vercel) uploads are kept in the database and this path serves nothing.
- **Expected:** A mill certificate or signed delivery note is served only to a signed-in user who may see it (GET /api/documents/:id/download does this).
- **Actual:** On a disk host the file is also reachable by its address alone.
- **Root cause or suspected cause:** Static serving added before the gate existed.
- **Operational impact:** None on the current host. A move to a disk host would expose customer documents to anyone with the address.
- **Affected dependencies:** Screens that link to /uploads directly, if any.
- **Recommended correction:** Remove the static mount and serve only through the download route.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Security and multi-location phase.
- **Deferred: target phase:** Security and multi-location phase: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Screens that link to /uploads directly, if any.
- **Deferred: acceptance criteria:** A mill certificate or signed delivery note is served only to a signed-in user who may see it (GET /api/documents/:id/download does this).
- **Deferred: verification:** Sweep: /uploads/… answers 401 or 404 with no token.
- **Required tests:** Sweep: /uploads/… answers 401 or 404 with no token.
- **Assigned phase:** Security and multi-location phase
- **Status note:** NOT VERIFIED by a probe
- **First recorded in:** Phase 1 discovery

### B-022 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Demo and QA data
- **Workflow:** Reconciliation
- **Category:** Data integrity
- **Source file or endpoint:** qa/results/db-facts.json
- **Evidence:** qa/tools/db-facts.mjs after a full run: outside the demo seed rows every stock, shipment and invoice check returns 0. Inside the demo seed: order lines marked shipped with no shipment, one invoice marked paid with no payment, four confirmed demo orders with no lines, 12 invoices with no record of who issued them (D-023).
- **Expected:** Seed data obeys the same rules as real data.
- **Actual:** The demo seed writes rows directly and skips the rules.
- **Root cause or suspected cause:** Seed script predates the rules.
- **Operational impact:** Reports on a demo database show mismatches; the same seed must never be run on the live database.
- **Affected dependencies:** D-023.
- **Recommended correction:** Rebuild the demo seed through the API, or delete it.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Data integrity phase.
- **Deferred: target phase:** Data integrity phase: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** D-023.
- **Deferred: acceptance criteria:** Seed data obeys the same rules as real data.
- **Deferred: verification:** db-facts checks return 0 with no demo exclusion.
- **Required tests:** db-facts checks return 0 with no demo exclusion.
- **Assigned phase:** Data integrity phase
- **First recorded in:** Phase 1 discovery

### B-023 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Build gates
- **Category:** Tooling
- **Source file or endpoint:** eslint.config.js at the repository root (npm run lint)
- **Evidence:** Baseline run in this session: the root lint command reported 201 errors, all "no-undef" in 22 files under qa/ (process, fetch, console): the configuration gave the QA scripts no Node globals. The command is not part of the pull-request check, so nobody saw it.
- **Expected:** The repository lint command passes or its errors are real.
- **Actual:** 201 false errors hid whether there were any real ones.
- **Root cause or suspected cause:** qa/ was added after the configuration was written.
- **Operational impact:** A lint command nobody can trust is not run.
- **Affected dependencies:** None.
- **Recommended correction:** qa/ scripts are given Node globals (and browser globals for the browser suites).
- **Required tests:** npm run lint at the root reports 0 errors.
- **Assigned phase:** Phase 1 (done)
- **Verification evidence:** npm run lint at the root: 201 errors before, 0 after (1,524 warnings remain, B-024).
- **First recorded in:** Phase 1 discovery

### B-024 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Code base
- **Category:** Maintainability
- **Source file or endpoint:** npm run lint at the repository root
- **Evidence:** Root lint, this session: 1,524 warnings. 1,438 unused variables or imports, 39 React effects whose dependency list does not match what they use (react-hooks/exhaustive-deps), 20 needless escapes, 17 declarations inside case blocks, 4 empty blocks, 3 needless catches, 2 list items with no key.
- **Expected:** Warnings are few enough that a new one is noticed.
- **Actual:** The 39 effect warnings are the ones that can be defects: an effect that reads a value it does not list can show stale data. They have not been read one by one.
- **Root cause or suspected cause:** Lint was never a gate.
- **Operational impact:** Possible stale data on screens; noise that hides new problems.
- **Affected dependencies:** None.
- **Recommended correction:** Read the 39 effect warnings and fix the real ones; remove unused imports; then make the root lint a pull-request check with a warning ceiling.
- **Deferred: reason:** The other 38 change no saved data. Rewriting each effect is screen work with a visual check, which belongs to the screen phase.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** Rewrite each effect so it lists what it reads, screen by screen.
- **Deferred: dependencies:** X-008 for the session counter files.
- **Deferred: acceptance criteria:** qa/tools/frontend-checks.mjs reports 0.
- **Deferred: verification:** The ratchet in the gates: the ceiling is 38 and can only go down.
- **Required tests:** Root lint with a ceiling that can only go down.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2 read all 39. One was a defect and is fixed: on the order entry screen the override confirmation could submit through an older copy of the submit handler (C-008). 28 are the same harmless shape (load once when the screen opens). 10 are in the session counter flow, the map and the voice assistant.
- **First recorded in:** Phase 1 discovery

### B-025 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Counter quick sale
- **Workflow:** Counter sale
- **Category:** Data integrity
- **Source file or endpoint:** src/backend/src/routes/quickSale.js (process-payment, void)
- **Evidence:** Code read and the QA database after three simulation cycles: a finished counter quick sale is a COMPLETE order whose lines say they shipped, with no shipment, no stock movement and no change to any stock level. A voided sale is still COMPLETE; the void is the word VOIDED added to the order notes, plus a credit memo and a refund. qa/tools/db-facts.mjs counts these lines separately.
- **Expected:** A rule, written down: either shelf items are counted stock and a sale reduces it (and a void puts it back), or they are not counted and the system says so. A void that reports can filter on without reading free text.
- **Actual:** Shelf items sold at the counter never reduce stock. Any report that filters on order status counts a voided sale as a completed one; only the counter's own daily figures read the note.
- **Root cause or suspected cause:** The quick sale was built as a priced receipt on top of orders and invoices; stock for items priced each was left out and the void marker was put in the notes.
- **Operational impact:** Shelf stock cannot be trusted if it is ever counted in the system. Sales reports by order status overstate by the voided sales (the money side is correct: the credit memo and refund exist).
- **Affected dependencies:** The owner: are shelf items counted stock? I-016 (no stock adjustment).
- **Recommended correction:** After the decision: record a stock movement on sale and on void, and give a voided sale its own status or flag.
- **Required tests:** Simulation: a counter sale reduces the shelf item and a void restores it; reports exclude voided sales.
- **Assigned phase:** Inventory and purchasing
- **Status note:** Owner's decision 6, 2026-11-13: A counter sale reduces stock, and a void puts it back. Phase 2, owner's decision 6: a counter sale takes its pieces from the shelf stock of the selling branch and a void puts them back. What is still missing is a way to receive shelf items by the piece (C-011), so in practice a product has shelf stock only once that exists.
- **Verification evidence:** qa/sim/phase2-integrity.mjs: 13 checks, including three sales at once for the last pieces and one sale sent three times.
- **First recorded in:** Phase 1 discovery

### C-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** User administration
- **Workflow:** Creating and changing logins
- **Category:** Security: privilege escalation
- **Source file or endpoint:** src/backend/src/routes/users.js (POST /, PUT /:id, DELETE /:id, POST /:id/reset-password)
- **Evidence:** Code read, then qa/sim/phase2-integrity.mjs on the code before the fix: a branch manager created SUPER_ADMIN, ADMIN, EXECUTIVE and BRANCH_MANAGER logins (201 each), changed their own role to SUPER_ADMIN (200), added a branch to themselves (200) and changed the super admin's name (200).
- **Expected:** Nobody can grant a role above their own or a branch they are not in.
- **Actual:** The four routes checked only that the caller was a manager. A branch manager could make themselves super admin; an admin could reset a super admin's password or switch the account off.
- **Root cause or suspected cause:** requireRole checked the caller and never the change.
- **Operational impact:** Any branch manager could take over the system, and with it undo the branch boundary.
- **Recommended correction:** lib/userAdminRules.js: one rule for who may give which role and which branches, used by all four routes.
- **Required tests:** Unit tests for the rule; the same attempts through the API.
- **Assigned phase:** Phase 2: architecture and code quality
- **Verification evidence:** test/userAdminRules.test.js (5 tests). qa/sim/phase2-integrity.mjs: 14 checks through the API; 10 of them fail on the code before the fix.
- **First recorded in:** Phase 2 architecture review

### C-002 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Partner API: carriers
- **Workflow:** Carrier status and proof of delivery
- **Category:** Broken code; rule bypass
- **Source file or endpoint:** src/backend/src/routes/partner/carrierRoutes.js
- **Evidence:** Code read against prisma/schema.prisma: the routes filter on Shipment.carrier and read order.buyerOrgId, neither of which exists; they set the statuses CONFIRMED and DELAYED, which are not shipment statuses; and they write the shipment directly instead of calling the dispatch and delivery steps in routes/shipments.js.
- **Expected:** A carrier update goes through the same rules as a dispatch or delivery entered by staff (stock leaves, the invoice is raised, proof of delivery is checked).
- **Actual:** The carrier routes cannot work as written, and if repaired in place would skip those rules.
- **Root cause or suspected cause:** Written against an earlier schema.
- **Operational impact:** None today: no carrier has a token and the sweep shows the partner API refuses every call without one. A risk the day a carrier is connected.
- **Affected dependencies:** B-018, B-019 (partner messages and the scheduled trigger).
- **Recommended correction:** Export the dispatch and deliver steps from routes/shipments.js and have the carrier routes call them.
- **Deferred: reason:** It needs a carrier connection to test against, and the owner has deferred partner messaging (decision 5). Nothing reaches these routes today.
- **Deferred: target phase:** The phase the owner issues for integrations (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Call the core dispatch and deliver steps; remove the two statuses that do not exist.
- **Deferred: dependencies:** Decision 5; B-018; B-019.
- **Deferred: acceptance criteria:** A carrier update produces exactly the records a staff dispatch or delivery does.
- **Deferred: verification:** A sweep section using a carrier token; reconciliation 0 problems.
- **Required tests:** A carrier token dispatches and delivers a shipment and the simulation's reconciliation stays at zero problems.
- **Assigned phase:** Integration phase
- **First recorded in:** Phase 2 architecture review

### C-003 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Workflow:** Planning a job
- **Category:** Data integrity
- **Source file or endpoint:** src/backend/src/routes/jobs.js (POST /:id/plan)
- **Evidence:** qa/sim/phase2-integrity.mjs on the code before the fix: the dispatch job of a job at branch QA-L01 was saved with the branch "FWA", a piece of text that is no branch; and the job's move to SCHEDULED left no line in its history.
- **Expected:** A plan belongs to the branch the work is done at, and every job move is in the history.
- **Actual:** Every plan made without a branch in the request was filed under "FWA". Under the branch boundary those plans are invisible to branch staff, so operators got "not found" on their own operations.
- **Root cause or suspected cause:** A hard-coded default from the first demo.
- **Operational impact:** Shop-floor operations unusable for branch staff once the boundary is on; history incomplete.
- **Recommended correction:** The branch comes from the job's work center, else the order, else the planner's home branch; the move is recorded in the same transaction.
- **Required tests:** Plan a job and read its dispatch job and history from the database.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Existing rows in the live database that hold "FWA" or other text are a data clean-up for Phase 3 (see the handoff). Phase 3: DispatchJob.locationId now has a foreign key to Location and the default text "FWA" is removed (migration 20261113210000_reference_integrity). The key is validated only if every live row names a real branch; otherwise the SQL Editor file prints a notice and the key holds for new rows. Any live rows holding "FWA" are a clean-up the owner approves (phase-03-migration-review.md, section 4).
- **Verification evidence:** qa/sim/phase2-integrity.mjs: "the plan belongs to the branch of the job's work center" and "planning moves the job to SCHEDULED and the history says so".
- **First recorded in:** Phase 2 architecture review

### C-004 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Work centers
- **Workflow:** Set-up
- **Category:** Broken code
- **Source file or endpoint:** src/backend/src/routes/workCenters.js (POST /)
- **Evidence:** qa/sim/phase2-integrity.mjs on the code before the fix: POST /api/work-centers answered 400 for a complete, valid work center.
- **Expected:** A work center can be created.
- **Actual:** The handler wrote hourlyRate and setupMinutes, which are not columns, so every create failed.
- **Root cause or suspected cause:** Written against an earlier schema.
- **Operational impact:** No work center could be added through the product.
- **Recommended correction:** A field list for create and change; branch and duplicate-code checks.
- **Required tests:** Create, duplicate, bad branch, change.
- **Assigned phase:** Phase 2: architecture and code quality
- **Verification evidence:** qa/sim/phase2-integrity.mjs: 6 checks.
- **First recorded in:** Phase 2 architecture review

### C-005 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shop-floor operations and jobs
- **Workflow:** Starting and completing operations; moving a job
- **Category:** Data integrity: simultaneous requests
- **Source file or endpoint:** src/backend/src/routes/operationsRoutes.js (start, complete); src/backend/src/routes/jobs.js (POST and PATCH /:id/status)
- **Evidence:** qa/sim/phase2-integrity.mjs on the code before the fix. Two operators completing the last two operations of a job at the same moment: in 8 of 8 rounds the job stayed IN_PROCESS for ever, because each request counted the other operation as still open. Completing an operation of a cancelled job moved the cancelled job to WAITING_QC. Two people moving one job at once both succeeded and the history did not match the job.
- **Expected:** Whatever the timing, the job, its operations and its history agree, and a cancelled job stays cancelled.
- **Actual:** Three ways for the shop-floor record to end up wrong under ordinary simultaneous use.
- **Root cause or suspected cause:** Read, decide, write with no lock and no condition on the write.
- **Operational impact:** Jobs stuck in process that are in fact finished; cancelled work reappearing in the inspection queue.
- **Recommended correction:** Completing an operation locks the dispatch job and the job first. Operations of a finished or cancelled job are refused (409). A repeated completion changes nothing. A job status move applies only if the job is still in the status it was checked in, and is saved with its history line.
- **Required tests:** Race rounds for each case, checked against the database.
- **Assigned phase:** Phase 2: architecture and code quality
- **Verification evidence:** qa/sim/phase2-integrity.mjs: four race checks of 8 rounds each, plus the cancelled-job and repeated-completion checks. All fail on the code before the fix.
- **First recorded in:** Phase 2 architecture review

### C-006 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Workflow:** Order entry and web checkout
- **Category:** Reliability: duplicate requests
- **Source file or endpoint:** POST /api/orders, POST /api/orders/intake, POST /api/ecom/checkout/submit
- **Evidence:** Code read: none of the three accepts a request key. The simulation probe "10 simultaneous orders all saved with distinct numbers" shows identical bodies are each saved. The counter quick sale is the one sale route that recognises a repeat (by its sale id).
- **Expected:** A request repeated after a timeout or a double press creates one order.
- **Actual:** It creates two. Only the screens guard against it, by disabling the button while saving.
- **Root cause or suspected cause:** No idempotency key.
- **Operational impact:** A duplicate order on a slow connection, found later by a person.
- **Affected dependencies:** A new table for request keys.
- **Recommended correction:** An Idempotency-Key header on order creation, stored with a unique rule per user, answering a repeat with the first reply.
- **Required tests:** The same key twice, in sequence and at once: one order, the same answer.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Phase 3: a RequestKey table with a unique rule on (user and route, key); middleware on every changing route that honours an Idempotency-Key header; the screens send a key for every request that creates a document (src/frontend/src/api/requestKey.js). A repeat gets the first answer back; the same key with a different body is refused (422); a refused request is not remembered.
- **Verification evidence:** qa/sim/phase3-db.mjs: the same order sent three times at once with one key saves one order and the retry is marked as a replay; different body 422; another user's same key is separate; a stale claim is taken over after a minute. test/requestKeys.test.js (3 tests). Order creation only was exercised through the API; the web checkout and order intake use the same middleware and were not separately run (NOT VERIFIED for those two routes).
- **First recorded in:** Phase 2 architecture review

### C-007 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shop floor screen; counter will-call screen
- **Workflow:** Work center queue; will-call queue
- **Category:** Data honesty
- **Source file or endpoint:** src/frontend/src/apps/shopfloor/WorkCenterQueuePage.jsx; src/frontend/src/components/pos/screens/WillCallQueueScreen.jsx
- **Evidence:** Code read while triaging B-024: when the operator list failed to load, the work center queue showed an operator called "Default Operator" with the id OP-001; when the will-call queue failed to load, the screen showed three invented orders for invented customers.
- **Expected:** A failed load shows an error and nothing else.
- **Actual:** Two real screens showed made-up records as if they were real.
- **Root cause or suspected cause:** Left from the prototype.
- **Operational impact:** An operator could try to start work under a name that is not on file (the server refuses it); counter staff could look for material for an order that does not exist.
- **Recommended correction:** Both show an empty list and the reason.
- **Required tests:** A check that fails when a catch block sets a list holding a literal record.
- **Assigned phase:** Phase 2: architecture and code quality
- **Verification evidence:** qa/tools/frontend-checks.mjs: 0 (it reports 2 on the code before the fix). In the gates.
- **First recorded in:** Phase 2 architecture review

### C-008 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry screen
- **Workflow:** Submitting an order that needs an override
- **Category:** Frontend state
- **Source file or endpoint:** src/frontend/src/pages/Orders/CSRIntakePage.jsx (handleOverrideConfirm)
- **Evidence:** The lint rule for effects: the handler called doSubmit without listing it, so it kept the copy of doSubmit from the render in which the override dialog opened.
- **Expected:** The order submitted is the one on the screen.
- **Actual:** A change made to the form between opening the dialog and confirming it would not have been in the order sent.
- **Root cause or suspected cause:** A missing dependency.
- **Operational impact:** Small: the dialog is modal, so the form cannot normally change underneath it.
- **Recommended correction:** The handler is declared after doSubmit and lists it.
- **Required tests:** The effect ratchet.
- **Assigned phase:** Phase 2: architecture and code quality
- **Verification evidence:** qa/tools/frontend-checks.mjs: 38, down from 39; the ceiling in the gates is 38. The order entry browser checks pass.
- **First recorded in:** Phase 2 architecture review

### C-009 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Access control
- **Workflow:** Branch boundary
- **Category:** Security: incomplete isolation
- **Source file or endpoint:** src/backend/src/lib/branchScope.js (BRANCH_OWNED); prisma/schema.prisma
- **Evidence:** Code read. The boundary covers 15 record types. It does not cover: quotes and requests for quotation (no branch column), customers and contacts (shared by design, not decided), packages, drop tags, documents, inspections, maintenance orders and equipment (reachable only through a branch-owned record today), the second stock list and order hub (JSON stores, B-009), records read through a nested include of a record of another type, and the 14 raw SQL statements. A login with no home branch and no all-branch role sees no branch records at all.
- **Expected:** Every record that belongs to a branch is held to it, and every staff login has a branch.
- **Actual:** The core order-to-cash and shop records are held; the rest are not.
- **Root cause or suspected cause:** The tables have no branch column to filter on.
- **Operational impact:** A branch login can still read another branch's quotes and the records listed. Stock, orders, invoices, shipments, jobs and work orders are held.
- **Affected dependencies:** Branch columns on Quote, RFQ, Package, DropTag, Document; a home branch on every staff login in the live database.
- **Recommended correction:** Add the columns (Phase 3), add the models to BRANCH_OWNED, extend qa/sim/branch-boundary.mjs with one refusal per model.
- **Deferred: reason:** The remaining records are either JSON stores that must first become real tables (B-009) or depend on the owner assigning home branches in the live database.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** Enforce the boundary on the second stock list once it reads the real tables; add API tests for drop tags and packages; require a branch on every order.
- **Deferred: dependencies:** B-009, G-018, the owner's backfill.
- **Deferred: acceptance criteria:** A branch login cannot read any record of another branch through any route.
- **Deferred: verification:** qa/sim/branch-boundary.mjs extended to each record type.
- **Required tests:** One read and one change refused per added model.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Phase 3: quotes, requests for quotation and their lines now carry a branch and are held to it (G-012, verified). Drop tags are held through their order and packages through their order or the branch they stand at (unit-tested in test/branchScope.test.js; not exercised through the API: FIXED, NOT VERIFIED end to end). Documents are shared by design: a mill certificate follows the material from branch to branch. What remains: the second stock list and order hub (B-009), a home branch on every live staff login, and making Order.locationId required (G-018).
- **First recorded in:** Phase 2 architecture review

### C-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Counter quick sale
- **Workflow:** Voiding a sale
- **Category:** Data integrity: partial save
- **Source file or endpoint:** src/backend/src/routes/quickSale.js (POST /:saleId/void)
- **Evidence:** Code read: the void is claimed and the stock returned in one transaction (Phase 2). The credit memo and the refund are then made by two further calls, each its own transaction.
- **Expected:** A void is all or nothing.
- **Actual:** A failure after the claim leaves a sale marked void, its stock returned, and no credit memo or refund.
- **Root cause or suspected cause:** creditInvoice and recordRefund open their own transactions and cannot be nested as written.
- **Operational impact:** Rare (it needs a failure between two calls), and visible: the sale shows as void with money still taken.
- **Affected dependencies:** F-series billing functions.
- **Recommended correction:** Let creditInvoice and recordRefund accept an open transaction, and run the whole void in one.
- **Required tests:** A failure forced after the claim leaves the sale exactly as it was.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Phase 3: creditInvoice accepts steps that run inside its own transaction. A void now claims the sale, returns the shelf stock, writes the credit memo and records the refund in one transaction.
- **Verification evidence:** qa/sim/phase3-db.mjs: a credit whose last step is forced to fail leaves no memo, no refund, no history line, and undoes the step before it; a sale voided twice at once is voided once, with one credit memo, one stock return and money netting to zero.
- **First recorded in:** Phase 2 architecture review

### C-011 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Receiving
- **Workflow:** Shelf items
- **Category:** Missing function
- **Source file or endpoint:** src/backend/src/lib/receiving.js
- **Evidence:** Code read: receiving creates stock by weight only (unit LB) and needs a heat and a grade. No route creates stock counted in pieces. The QA database holds 333 stock levels, all in LB.
- **Expected:** Shelf items (discs, gloves) can be received by the piece, so the counter sale has stock to reduce.
- **Actual:** They cannot. The counter rule built in Phase 2 takes effect only where piece-counted stock exists; elsewhere the sale goes through and the receipt says no stock was reduced.
- **Root cause or suspected cause:** Receiving was built for metal by weight.
- **Operational impact:** Shelf stock is still uncounted in practice until this is built.
- **Affected dependencies:** I-016 (count and adjustment). The owner: may an item with no shelf stock on file be sold? Today it may, with the note.
- **Recommended correction:** A receipt by the piece for products priced EACH, with no heat or grade.
- **Deferred: reason:** The columns can only be relaxed together with the receiving function that needs it, and the rule for which products are counted by the piece is not decided.
- **Deferred: target phase:** The phase the owner issues for inventory and purchasing (prompts 5 to 8 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** A receipt by the piece for products priced EACH, with heat and grade optional for those products only (a database check ties the exemption to the unit).
- **Deferred: dependencies:** I-016; the owner's list of piece goods.
- **Deferred: acceptance criteria:** A shelf item is received by the piece, sold at the counter and reconciles.
- **Deferred: verification:** Database scenarios: receive 10, sell 3, void 1, count 8.
- **Required tests:** Receive 10, sell 3, void 1 sale, count 7 then 10.
- **Assigned phase:** Inventory and purchasing
- **Status note:** Phase 3 did not change Coil.heatId or gradeId. Making them optional changes what every stock screen and trace report may assume, and the rule for piece goods is the owner's. No database change was made on a guess.
- **First recorded in:** Phase 2 architecture review

### C-012 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Order intake
- **Workflow:** Order entry
- **Category:** Maintainability: hard-coded value
- **Source file or endpoint:** src/backend/src/routes/intakeOrders.js (seller lookup by the code "ALRO")
- **Evidence:** Code read: the seller on an intake order is found by the fixed code "ALRO".
- **Expected:** The seller is the signed-in user's company.
- **Actual:** A fixed code. If the company record has another code the seller is left empty.
- **Root cause or suspected cause:** Left from the first customer set-up.
- **Operational impact:** None while the code matches.
- **Recommended correction:** Use the user's organization.
- **Deferred: reason:** Changing it changes which company appears on existing order documents; it should be done with the sales module and checked against live data the engineer does not have.
- **Deferred: target phase:** The phase the owner issues for sales and customer operations (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** No company code in the source.
- **Deferred: verification:** A sweep check.
- **Required tests:** An intake order by a login of another company carries that company as seller.
- **Assigned phase:** Sales and customer operations
- **First recorded in:** Phase 2 architecture review

### C-013 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Operations cockpit
- **Workflow:** Accepting a recommendation
- **Category:** Data integrity: trust in browser input
- **Source file or endpoint:** src/backend/src/routes/opsCockpit.js (POST /recommendations/accept)
- **Evidence:** Code read: the handler decides what to do from the words in the recommendation's title as sent by the browser (it looks for "bottleneck" or "Rebalance" and reads a work center code out of the text), then moves jobs between work centers in several separate writes.
- **Expected:** The server acts on a recommendation it made and kept, identified by id, in one transaction.
- **Actual:** Any text shaped like a recommendation moves jobs.
- **Root cause or suspected cause:** Recommendations are generated on request and not stored.
- **Operational impact:** Limited by Phase 2 to the production manager, schedulers and the inventory manager. A partial failure can leave some jobs moved.
- **Affected dependencies:** M-series scheduling rules, which are not decided.
- **Recommended correction:** Store recommendations; accept by id; one transaction.
- **Deferred: reason:** What a recommendation may do is a scheduling rule the owner has not set, and inventing it is outside what Phase 2 may do.
- **Deferred: target phase:** The phase the owner issues for manufacturing and processing (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** The owner's scheduling rules.
- **Deferred: acceptance criteria:** Accepting acts only on a stored recommendation, once, all or nothing.
- **Deferred: verification:** Checks in qa/sim/phase2-integrity.mjs.
- **Required tests:** Accept twice; accept an id that does not exist; a forced failure.
- **Assigned phase:** Manufacturing and processing
- **First recorded in:** Phase 2 architecture review

### D-001 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim: "create sales order", "order created by the signed-in user". Baseline `baseline-1001.json`.
- **Actual:** Creating a sales order through `POST /api/orders` failed with a server error unless the browser sent the id of the user creating it. Whatever id was sent was trusted. 46 of 50 baseline jobs stopped here.
- **Root cause or suspected cause:** The route wrote the request body straight into the database.
- **Recommended correction:** The signed-in user is the creator. Only listed fields are accepted. Lines, prices and totals are validated. `routes/orders.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim: "create sales order", "order created by the signed-in user". Baseline `baseline-1001.json`.
- **First recorded in:** qa/defect-register.md

### D-002 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim: books checks after every shipment; whole-database reconciliation.
- **Actual:** Dispatching a shipment changed nothing else. The order line's shipped quantity, the line and order status, and stock all stayed as they were, so orders never completed and stock never went down.
- **Root cause or suspected cause:** Dispatch only set the shipment's own status.
- **Recommended correction:** Dispatch now updates the lines, sets the order to PARTIAL or COMPLETE, takes the reserved stock out and writes a stock movement, in one transaction. `routes/shipments.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim: books checks after every shipment; whole-database reconciliation.
- **First recorded in:** qa/defect-register.md

### D-003 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim: over-reservation refused; race probe "exactly one wins"; reconciliation (no negatives).
- **Actual:** Stock could be reserved without limit: more than was available, more than the order line needed, on cancelled orders, with zero or negative quantities. Available stock could go negative.
- **Root cause or suspected cause:** No checks on `POST /api/orders/:id/allocate`.
- **Recommended correction:** All of those are refused. The update only succeeds while enough is available, so two requests cannot both take the last of it.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim: over-reservation refused; race probe "exactly one wins"; reconciliation (no negatives).
- **First recorded in:** qa/defect-register.md

### D-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: 6 order tests. Sim: reopen refused, cancel releases stock.
- **Actual:** Any order status could be written by hand, including reopening a cancelled order or marking an order complete. Cancelling left its stock reserved for ever.
- **Root cause or suspected cause:** No status rules.
- **Recommended correction:** Status table in `lib/workflowRules.js`. Cancelling releases reservations and cancels the lines.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: 6 order tests. Sim: reopen refused, cancel releases stock.
- **First recorded in:** qa/defect-register.md

### D-005 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: shipment tests. Sim: double-ship, over-ship, deliver-before-dispatch refused; triple-dispatch probe.
- **Actual:** A shipment could be delivered without ever leaving, dispatched more than once, created for a draft or cancelled order, or carry more than was ordered. Shipment lines were not saved at all.
- **Root cause or suspected cause:** `POST /api/shipments` wrote the raw body; dispatch and deliver had no checks.
- **Recommended correction:** Shipments need a CONFIRMED or PARTIAL order, valid lines and quantities within what is left. Dispatch and deliver follow a status table and are safe against double-clicks. Added the item and status routes the logistics screens already call.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: shipment tests. Sim: double-ship, over-ship, deliver-before-dispatch refused; triple-dispatch probe.
- **First recorded in:** qa/defect-register.md

### D-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: 7 numbering tests. Probes: 10 simultaneous orders and 10 simultaneous jobs, all distinct.
- **Actual:** Order, job, shipment and web-order numbers were "row count + 1". Two people saving at the same moment got the same number and one save failed.
- **Root cause or suspected cause:** Counting rows is not a sequence.
- **Recommended correction:** `lib/numbering.js` retries with the next number when the database reports a duplicate. Applied to sales orders (the order API, order intake, accepted web orders and POS), jobs (both places they are created), shipments and web orders.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: 7 numbering tests. Probes: 10 simultaneous orders and 10 simultaneous jobs, all distinct.
- **First recorded in:** qa/defect-register.md

### D-006b · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: numbering tests.
- **Actual:** Work orders, QC inspections, maintenance orders and operator codes were also numbered "row count + 1".
- **Root cause or suspected cause:** Same as D-006.
- **Recommended correction:** Those four now use `lib/numbering.js`. Quotes and RFQs are left with D-019, because those routes are broken anyway. (Follow-up PR)
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: numbering tests.
- **First recorded in:** qa/defect-register.md

### D-007 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim: transfers-receiving category (15 jobs in the final cycles). Reconciliation: "one location per item".
- **Actual:** Receiving and transferring stock failed with a server error unless the browser sent a user id. Negative receipts were accepted. A transfer ignored where the item actually was and moved only one of the two records that hold its location.
- **Root cause or suspected cause:** Raw body written to the database; two tables hold the location.
- **Recommended correction:** Signed-in user recorded. Quantity must be above zero. From-location must match. Both records move together. `routes/inventory.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim: transfers-receiving category (15 jobs in the final cycles). Reconciliation: "one location per item".
- **First recorded in:** qa/defect-register.md

### D-008 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: 5 job tests plus "every move the job board offers is accepted by the server". Sim: exception category.
- **Actual:** A job could jump to any status (for example from scheduled straight to shipped). An unknown status caused a server error. Editing a job could overwrite its number, timestamps and creator.
- **Root cause or suspected cause:** No status rules; raw body written.
- **Recommended correction:** Status table that matches the job board's own list of moves. Only listed fields can be edited. A started job cannot be moved to another order. `routes/jobs.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: 5 job tests plus "every move the job board offers is accepted by the server". Sim: exception category.
- **First recorded in:** qa/defect-register.md

### D-009 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sweep: bad-input cases.
- **Actual:** Editing an order could overwrite its number, totals and creator.
- **Root cause or suspected cause:** Raw body written by `PUT /api/orders/:id`.
- **Recommended correction:** Only header fields are accepted.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sweep: bad-input cases.
- **First recorded in:** qa/defect-register.md

### D-010 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim: 6 POS session jobs in the final cycles ("POS line is priced", "POS order saved with its total", "refuse to submit the same sale twice").
- **Actual:** A counter sale through the POS session saved an order with a price of $0 and no totals. The session's order totals were overwritten by one line's price detail. The same sale could be submitted twice. A session could be opened in another user's name. The POS screen posted to an address the server did not have.
- **Root cause or suspected cause:** The line's price fields had different names from what the line builder read; the line detail was copied over the totals; no submit guard.
- **Recommended correction:** Prices carried onto the line; totals rebuilt from the lines at submit; second submit refused; session belongs to the signed-in user; the address the screen uses now works.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim: 6 POS session jobs in the final cycles ("POS line is priced", "POS order saved with its total", "refuse to submit the same sale twice").
- **First recorded in:** qa/defect-register.md

### D-011 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sweep: "Documents: upload, list, download, delete" (11 checks, including no download without signing in or as a customer).
- **Actual:** Document upload, list, open and delete (mill certs on heats and stock items) all failed with a server error. A document could only ever be linked to a stock item, never to a heat or an order. Separately, one route let a signed-in user register a "document" pointing at any file path on the server, which the download route would then send back.
- **Root cause or suspected cause:** The routes used column names that are not in the database. The link table had a database constraint tying every link to a stock item.
- **Recommended correction:** Routes rewritten against the real columns, keeping the field names the screens use. The constraint is removed by a small database update (`20261113031734_document_links_any_record`, SQL Editor file included). Refused file types answer with a clear message. The route that accepted a file path is removed. `routes/documents.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sweep: "Documents: upload, list, download, delete" (11 checks, including no download without signing in or as a customer).
- **First recorded in:** qa/defect-register.md

### D-011b · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Upload, download (byte-for-byte) and delete run by hand against a server started in hosted mode on the QA database. The 4 MB limit itself was not exercised. Not yet run on the hosted site.
- **Actual:** On the hosted site uploaded files had nowhere to be stored.
- **Root cause or suspected cause:** The host's disk is read-only.
- **Recommended correction:** Where there is no disk, the file is stored in the database (limit 4 MB there, 25 MB on a server with a disk). Nothing to set up. `routes/documents.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Upload, download (byte-for-byte) and delete run by hand against a server started in hosted mode on the QA database. The 4 MB limit itself was not exercised. Not yet run on the hosted site.
- **First recorded in:** qa/defect-register.md

### D-012 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: 4 tests. Sweep: "Error replies do not expose internals", checked on every reply the sweep receives.
- **Actual:** Error replies in 114 places sent the raw error text, which for database errors names tables, columns and query shapes.
- **Root cause or suspected cause:** Handlers return `error.message`.
- **Recommended correction:** One middleware cleans database and server detail out of every error reply and logs it on the server. `middleware/safeErrors.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: 4 tests. Sweep: "Error replies do not expose internals", checked on every reply the sweep receives.
- **First recorded in:** qa/defect-register.md

### D-013 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Module loads; sweep no longer reports it.
- **Actual:** Every live-pricing route under `/api/pos/pricing` failed.
- **Root cause or suspected cause:** The module imported a name that does not exist, so it never loaded.
- **Recommended correction:** Import corrected.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Module loads; sweep no longer reports it.
- **First recorded in:** qa/defect-register.md

### D-014 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim quick-sale job in every cycle (23 steps and checks). Sweep: a clerk cannot void.
- **Actual:** Counter quick sale could not add an item or take payment, saved nothing, simulated card payments and reported receipts as emailed or texted when nothing was sent.
- **Root cause or suspected cause:** It was a prototype held in server memory.
- **Recommended correction:** Rebuilt as one screen on `/api/pos/quick-sale`. The server prices each item from the product list and taxes it at the branch's state rate. The sale is saved as a completed order with a paid invoice. The same sale sent twice is saved once. Cards and checks are recorded by the approval code or check number; no card is charged by the app. Email and text receipts answer "not set up" instead of pretending. A void needs a manager and a reason and refunds the sale. `routes/quickSale.js`, `components/pos/QuickSale.jsx`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim quick-sale job in every cycle (23 steps and checks). Sweep: a clerk cannot void.
- **First recorded in:** qa/defect-register.md

### D-015 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sim return jobs (restock, scrap, paid and unpaid invoices, over-return refused). Probe: one return received three times at once is counted once with one credit.
- **Actual:** There was no way to record a customer return.
- **Root cause or suspected cause:** The workflow did not exist.
- **Recommended correction:** `/api/returns` and a Returns screen. A return is opened against shipped lines, then received: restocked material goes back on hand in the stock item it shipped from, scrapped material does not, and the customer is credited for what was invoiced. `routes/returns.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sim return jobs (restock, scrap, paid and unpaid invoices, over-return refused). Probe: one return received three times at once is counted once with one credit.
- **First recorded in:** qa/defect-register.md

### D-016 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit `billingRules.test.js`. Sim: every shipped order's invoices are checked against what shipped, paid in part and in full, overpayment refused. Probes: three invoices at once bill once, three payments at once are taken once. Reconciliation covers every invoice, credit and payment.
- **Actual:** There was no way to create an invoice, record a payment or issue a credit.
- **Root cause or suspected cause:** The tables existed; nothing wrote to them.
- **Recommended correction:** `/api/invoices` and an Invoices screen. Dispatching a shipment invoices what shipped. Payments, credit memos, refunds and cancelling an unpaid invoice all run in one database transaction each. `services/billing.js`, `lib/billingRules.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit `billingRules.test.js`. Sim: every shipped order's invoices are checked against what shipped, paid in part and in full, overpayment refused. Probes: three invoices at once bill once, three payments at once are taken once. Reconciliation covers every invoice, credit and payment.
- **First recorded in:** qa/defect-register.md

### D-017 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sweep section "Web checkout uses the system price, not the browser's".
- **Actual:** Online checkout took the price from the customer's browser.
- **Root cause or suspected cause:** The server trusted the cart it was sent.
- **Recommended correction:** Checkout saves the system price for the customer's price level and works out tax itself. A different price from the browser is replaced and noted on the order. Remnant lines are flagged for the CSR. `services/ecomService.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sweep section "Web checkout uses the system price, not the browser's".
- **First recorded in:** qa/defect-register.md

### D-018 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit `roleAccess.test.js`. Sweep section "Staff roles and departments" (18 checks).
- **Actual:** Any signed-in staff member could call any staff route (a saw operator could edit a sales order).
- **Root cause or suspected cause:** Screens were limited by role; the API was not.
- **Recommended correction:** Changes are limited by department on the server: sales records by sales, stock by warehouse, production and quality, shipments by warehouse and sales, jobs by the shop, sales and warehouse. Credits, refunds, invoice cancellation and quick-sale voids need a manager. Analysts and auditors can read but not change these. Reading is unchanged. `lib/roleAccess.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit `roleAccess.test.js`. Sweep section "Staff roles and departments" (18 checks).
- **First recorded in:** qa/defect-register.md

### D-019 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit `quoteRules.test.js`. Sim quote-to-order job in every cycle, including a quote accepted twice at once making one order.
- **Actual:** Quotes and RFQs failed with a server error, existed in two competing versions, and the screens showed made-up data.
- **Root cause or suspected cause:** Routes used relations that are not in the database; screens called routes that did not exist.
- **Recommended correction:** One version kept: `/api/rfqs` and `/api/quotes`, with a working RFQs & Quotes screen. Accepting a quote creates the confirmed sales order, closes the other quotes on that RFQ and marks the RFQ accepted. "Send" only marks the quote sent. Four mock screens removed. `routes/rfqs.js`, `routes/quotes.js`, `lib/quoteRules.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit `quoteRules.test.js`. Sim quote-to-order job in every cycle, including a quote accepted twice at once making one order.
- **First recorded in:** qa/defect-register.md

### D-020 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** 155 of 352 distinct API calls written in the screens have no server route (`qa/api-contract.md`). Largest groups: work centers, jobs, QA/QC, pricing, BOMs, provenance.
- **Recommended correction:** Many are helper functions no page uses. The screen check shows which pages actually hit a missing route when they open. Buttons inside pages were not clicked.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: By subject (see the finding).
- **Deferred: target phase:** By subject (see the finding): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: engineering work
- **First recorded in:** qa/defect-register.md

### D-021 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sweep: 753 reads, 7 server errors, down from 29.
- **Actual:** Read routes answered a nonsense filter value (for example `status=';--`) with a server error instead of "bad request". No data was exposed.
- **Root cause or suspected cause:** Unchecked filter values reached the database client, which rejected them.
- **Recommended correction:** `lib/requestContext.js` + `lib/db.js` note when the database client rejects a value, and `safeErrors` turns that 500 into a 400 on read requests. 22 of the 29 sweep findings are gone; the 7 left are the broken quote/RFQ/sales-stats routes (D-019) and the quick-sale receipt (D-014). (Follow-up PR)
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sweep: 753 reads, 7 server errors, down from 29.
- **First recorded in:** qa/defect-register.md

### D-022 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit: paging test. Sweep: bad-paging variant on every read route.
- **Actual:** A list address with `limit=abc` or `page=-1` caused a server error on many routes.
- **Root cause or suspected cause:** Paging values passed to the database unchecked.
- **Recommended correction:** One guard refuses paging values that are not whole numbers.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit: paging test. Sweep: bad-paging variant on every read route.
- **First recorded in:** qa/defect-register.md

### D-023 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** The demo seed data contains 49 inconsistent orders (shipped quantities with no shipment, fully shipped orders still marked confirmed).
- **Recommended correction:** Seed script, not app behaviour. Matters only because the demo site shows them.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: By subject (see the finding).
- **Deferred: target phase:** By subject (see the finding): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: engineering work
- **First recorded in:** qa/defect-register.md

### D-024 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** Stock is held in two unconnected sets of tables: the coil and inventory records used by orders and shipping, and a separate unit-tracking set under `/api/v1/inventory`. Five screen services still return made-up data (`branchComparisonApi`, `cutoffRulesApi`, `intakeCustomersApi`, `overrideApi`, `splitShipmentApi`).
- **Recommended correction:** Needs consolidation.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: By subject (see the finding).
- **Deferred: target phase:** By subject (see the finding): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: engineering work
- **First recorded in:** qa/defect-register.md

### D-025 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** The workflow itself.
- **Actual:** The repository had no automated tests and nothing ran them.
- **Recommended correction:** `.github/workflows/backend-tests.yml` runs the 32 unit tests on every pull request and on main. (Follow-up PR)
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** The workflow itself.
- **First recorded in:** qa/defect-register.md

### D-026 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sweep.
- **Actual:** An order with no customer and no lines could be created.
- **Root cause or suspected cause:** No check.
- **Recommended correction:** Refused.
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sweep.
- **First recorded in:** qa/defect-register.md

### D-027 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** The request rate limit counts per server instance, so on the hosted site the real limit is higher than configured.
- **Recommended correction:** Already noted in the code.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: By subject (see the finding).
- **Deferred: target phase:** By subject (see the finding): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: engineering work
- **First recorded in:** qa/defect-register.md

### D-028 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Sweep section "Customers and divisions cannot see each other" (31 checks) with two QA divisions.
- **Actual:** A customer login on one division of a company saw the whole parent company's records.
- **Root cause or suspected cause:** The account scope started from the top-level company.
- **Recommended correction:** A login sees its own organization and anything beneath it. A head-office login still sees every division. Pricing level and terms still come from the parent company. `services/portalService.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Sweep section "Customers and divisions cannot see each other" (31 checks) with two QA divisions.
- **First recorded in:** qa/defect-register.md

### D-029 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Screen check.
- **Actual:** The POS page crashed on open.
- **Root cause or suspected cause:** A screen imported an icon that does not exist.
- **Recommended correction:** Icon import corrected. `WillCallLoadScreen.jsx`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Screen check.
- **First recorded in:** qa/defect-register.md

### D-030 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Screen check.
- **Actual:** The route-optimization page crashed when no map key is set.
- **Root cause or suspected cause:** The map library throws without a key.
- **Recommended correction:** The map area shows a notice instead; the rest of the page works. `MapComponent.jsx`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Screen check.
- **First recorded in:** qa/defect-register.md

### D-031 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Screen check.
- **Actual:** The partner admin page could not load its list.
- **Root cause or suspected cause:** The address had `/api` twice.
- **Recommended correction:** Address corrected. `partnerApi.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Screen check.
- **First recorded in:** qa/defect-register.md

### D-032 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Evidence:** Unit `workflowRules.test.js`. Sim rework jobs.
- **Actual:** Nothing tied a shop job to its shipment. An order could ship with its job unfinished, and marking a job shipped needed no shipment. `POST /api/jobs` also silently dropped the order line it was given.
- **Root cause or suspected cause:** The two were built separately.
- **Recommended correction:** A line cannot be dispatched while its job is unfinished. Pressing Ship on the shop floor creates and dispatches the shipment for that job's line. A job is marked shipped when its line has shipped. Stock orders with no job ship as before. `lib/workflowRules.js`, `routes/shipments.js`, `routes/jobs.js`
- **Assigned phase:** Done before the program
- **Status note:** Fixed in the first audit
- **Verification evidence:** Unit `workflowRules.test.js`. Sim rework jobs.
- **First recorded in:** qa/defect-register.md

### D-033 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-12
- **Category:** Missing function
- **Actual:** The app does not charge cards. A card sale is recorded with the approval code from a separate card terminal.
- **Affected dependencies:** The name of the card processor to connect, if cards should be charged from the screen.
- **Recommended correction:** The name of the card processor to connect, if cards should be charged from the screen.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: needs something from the business
- **First recorded in:** qa/defect-register.md

### D-034 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-12
- **Category:** Missing function
- **Actual:** Receipts, quotes and invoices are not emailed or texted. The buttons say so.
- **Affected dependencies:** The email and text provider to connect.
- **Recommended correction:** The email and text provider to connect.
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: By subject (see the finding).
- **Deferred: target phase:** By subject (see the finding): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** The email and text provider to connect.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Owner's decision 5, 2026-11-13: Email and text are deferred by the owner. The scheduled trigger (a timer on the host that lets the system act without a person, for example to retry a failed partner message) was not decided and will be asked again, in plain terms, in the integration phase.
- **First recorded in:** qa/defect-register.md

### D-035 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-12
- **Category:** Missing function
- **Actual:** Sales tax is charged only for states that have a rate set. A sale at a branch in a state with no rate charges no tax and says so on the screen. A login with no home branch also charges no tax. A new screen, Admin > Sales Tax Rates, lists the branch states with no rate and lets a manager set them.
- **Affected dependencies:** The tax rate for each state with a branch, and each counter login given its home branch (Admin > User Management).
- **Recommended correction:** The tax rate for each state with a branch, and each counter login given its home branch (Admin > User Management).
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: needs something from the business
- **First recorded in:** qa/defect-register.md

### D-036 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** Sales Dashboard fixed in Phase 2 Workstream 2 (S-012): it now counts from the database. The Order Hub RFQ pages remain a separate console, not in the menu.
- **Recommended correction:** Order Hub needs a decision (S-021).
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: By subject (see the finding).
- **Deferred: target phase:** By subject (see the finding): The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: engineering work
- **First recorded in:** qa/defect-register.md

### E-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Category:** Performance
- **Source file or endpoint:** Bench before: 104 MB, 9.6 s median; 20 simultaneous requests all failed after 30 s
- **Evidence:** Bench before: 104 MB, 9.6 s median; 20 simultaneous requests all failed after 30 s
- **Expected:** Lists are bounded
- **Actual:** `GET /api/jobs` returned every job with no limit
- **Operational impact:** Job board and every screen that lists jobs stops working as history grows
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Bench after: 1.2 MB, 121 ms; 20 simultaneous in 1.4 s, 0 failed. `routes/jobs.js`
- **First recorded in:** qa/engineering-quality-findings.md

### E-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Category:** Consistency
- **Source file or endpoint:** Code read, `routes/jobs.js` before this change
- **Evidence:** Code read, `routes/jobs.js` before this change
- **Expected:** One code path per route
- **Actual:** When a second database client was configured, the job list used it instead: 100 rows, no filters, no order or work-center detail
- **Operational impact:** A filter such as "jobs for this order" could silently return unrelated jobs
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Path removed. Sim rework jobs and UI check pass
- **First recorded in:** qa/engineering-quality-findings.md

### E-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Database
- **Category:** Performance
- **Source file or endpoint:** Catalog query on the test database
- **Evidence:** Catalog query on the test database
- **Expected:** Every foreign key is indexed
- **Actual:** 87 of 170 foreign keys had no index
- **Operational impact:** Lookups by parent (lines of an order, jobs of an order, movements of a stock item) scan the whole table
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Migration `20261113062621`. Order detail 20 ms to 9 ms; jobs for an order 12 ms to 6 ms
- **First recorded in:** qa/engineering-quality-findings.md

### E-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Database
- **Category:** Data integrity
- **Source file or endpoint:** Catalog query: 0
- **Evidence:** Catalog query: 0
- **Expected:** Impossible values are refused by the database, not only by the code
- **Actual:** No check constraints anywhere
- **Operational impact:** A bug or a manual edit could leave negative stock
- **Affected dependencies:** Owner applies the SQL file
- **Recommended correction:** Fixed in Workstream 3
- **Required tests:** The database refuses a row where on hand differs from available + reserved + on hold; three cycles pass with the rule on
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Fixed in part Phase 3: 15 value checks added to the 9 that existed (24 in all): prices, quantities and weights cannot be negative; a discount is 0 to 100; an order total and an invoice total equal subtotal plus tax plus freight; a payment and a stock movement cannot be zero; a reservation is more than zero. Each is added only if no existing row breaks it.
- **Verification evidence:** qa/sim/phase3-db.mjs, two scenarios that write directly to the database: 13 bad writes, each refused by a check or a key. SQL Editor file run twice on the scale copy (72,240 orders, 37,625 invoices): every check validated; second run changed nothing.
- **First recorded in:** qa/engineering-quality-findings.md

### E-005 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Staging
- **Category:** Performance
- **Source file or endpoint:** Bench before: 18 MB, 6.0 s
- **Evidence:** Bench before: 18 MB, 6.0 s
- **Expected:** Bounded
- **Actual:** Staging list returned every ready or shipped job
- **Operational impact:** Staging screen slows with history
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Bench after: 0.3 MB, 100 ms
- **First recorded in:** qa/engineering-quality-findings.md

### E-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Analytics
- **Category:** Correctness, performance
- **Source file or endpoint:** Code read; Bench before: 7.7 s and 2.5 s
- **Evidence:** Code read; Bench before: 7.7 s and 2.5 s
- **Expected:** Reports show measured figures or say "not available"
- **Actual:** RFQ funnel and margin loaded all orders into memory. Margin returned invented figures
- **Operational impact:** Managers see numbers that are not real
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Counted in the database, 23 ms each. Margin shows "not available" on the dashboard
- **First recorded in:** qa/engineering-quality-findings.md

### E-007 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipping summary
- **Category:** Correctness
- **Source file or endpoint:** Code read against the status list
- **Evidence:** Code read against the status list
- **Expected:** Summary matches the real statuses
- **Actual:** Counted shipment statuses that do not exist, so "staged" and "ready" were always zero
- **Operational impact:** Dashboard tiles always zero
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Staged = waiting, ready = loading, late = past scheduled date and still on the dock. Rule 23, to confirm
- **First recorded in:** qa/engineering-quality-findings.md

### E-008 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Observability
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Every request traceable
- **Actual:** No request id and no request log
- **Operational impact:** A reported error could not be tied to a log line
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** `middleware/requestLog.js`, unit `requestLog.test.js`. Header and log line seen on the test server
- **First recorded in:** qa/engineering-quality-findings.md

### E-009 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Safety
- **Source file or endpoint:** `server.js`
- **Evidence:** `server.js`
- **Expected:** Demo data is never loaded implicitly
- **Actual:** The standalone server loaded demo companies into any empty non-local database at start
- **Operational impact:** A new production database would start with demo customers
- **Affected dependencies:** A standalone-server deployment
- **Recommended correction:** Fixed, awaiting verification
- **Required tests:** Server started against an empty non-local test database loads no demo data. Verified by reading the code only; no automated test
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Now only with `SEED_ON_START=true`. Does not affect the current hosted site, which does not use this file
- **First recorded in:** qa/engineering-quality-findings.md

### E-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Reliability
- **Source file or endpoint:** `server.js`
- **Evidence:** `server.js`
- **Expected:** Exit cleanly and let the process manager restart
- **Actual:** After an unexpected error the server kept running; shutdown left database connections open
- **Operational impact:** Undefined behaviour after a crash; connection leaks on restart
- **Affected dependencies:** Same
- **Recommended correction:** Fixed, awaiting verification
- **Required tests:** A forced error makes the process exit with code 1 and close its pool. Not exercised
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Code change; not exercised by a test
- **First recorded in:** qa/engineering-quality-findings.md

### E-011 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Security
- **Source file or endpoint:** `npm audit --omit=dev`
- **Evidence:** `npm audit --omit=dev`
- **Expected:** No known high or critical
- **Actual:** Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high)
- **Operational impact:** Exposure to published exploits in the web framework's dependencies
- **Affected dependencies:** Approval for two major upgrades (uuid 14, react-router 7)
- **Recommended correction:** Requires a business decision
- **Required tests:** `npm audit --omit=dev` reports 0 in both packages and the full suite passes
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed in part Audited again in Phase 2 (13 November). Server: 1 moderate (uuid; the affected functions are not used, only v4 is). Screens: 1 high and 3 moderate (vite and esbuild, which run only on a developer machine; react-router, an open redirect through a crafted link). None is critical. Every fix is a major-version upgrade (uuid 14, vite 8, react-router-dom 7), which needs the owner's approval.
- **Verification evidence:** npm audit in src/backend and src/frontend, this session.
- **First recorded in:** qa/engineering-quality-findings.md

### E-012 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** API
- **Category:** Consistency
- **Source file or endpoint:** grep
- **Evidence:** grep
- **Expected:** Errors written for people
- **Actual:** 39 routes send the raw error text on a server error
- **Operational impact:** Already masked by the reply filter, so no leak; the code is still inconsistent
- **Affected dependencies:** None
- **Recommended correction:** Assigned to Workstream 6
- **Required tests:** No route sends raw error text; sweep section "Error replies" still at 0
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open The reply layer (middleware/safeErrors.js) removes internal text from every error reply, whatever the route sent.
- **Verification evidence:** Sweep section "Error replies do not expose internals": 0 replies exposed internal detail, this session.
- **First recorded in:** qa/engineering-quality-findings.md

### E-014 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Security
- **Source file or endpoint:** Phase 1 D-027
- **Evidence:** Phase 1 D-027
- **Expected:** Shared counter
- **Actual:** The request rate limit counts per server instance
- **Operational impact:** On the hosted site the real limit is several times the configured one
- **Deferred: reason:** A shared counter needs a store on the host or a firewall rule, and host settings are the owner's.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** A shared rate counter (the database or the host's firewall).
- **Deferred: dependencies:** Owner: host settings.
- **Deferred: acceptance criteria:** The limit holds across server instances.
- **Deferred: verification:** A burst test against two instances.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: needs a shared store, which is a new service
- **First recorded in:** qa/engineering-quality-findings.md

### E-015 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Disaster recovery
- **Source file or endpoint:** No runbook or record in the repository
- **Evidence:** No runbook or record in the repository
- **Expected:** A restore is tested
- **Actual:** No evidence that a backup has ever been restored
- **Operational impact:** Unknown recovery time and data loss after an incident
- **Affected dependencies:** Database host backup settings and approval
- **Recommended correction:** Blocked by a dependency
- **Required tests:** One restore into a scratch database, timed, with the reconciliation run on the restored copy
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: needs the owner (see `production-readiness-checklist.md`)
- **First recorded in:** qa/engineering-quality-findings.md

### E-016 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Maintainability
- **Source file or endpoint:** No config file in either package
- **Evidence:** No config file in either package
- **Expected:** Lint runs on every change
- **Actual:** No lint configuration
- **Operational impact:** Gate 1 "lint passes" cannot be run
- **Affected dependencies:** Approval to add a linter as a development dependency
- **Recommended correction:** Requires a business decision
- **Required tests:** Lint runs in the pull-request workflow and passes
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: adding a linter is a new development dependency, so it needs approval A lint configuration exists and runs on every pull request.
- **Verification evidence:** Lint, frontend: passes. Lint, whole repository: 0 errors. Both run this session.
- **First recorded in:** qa/engineering-quality-findings.md

### E-017 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Observability
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Someone is told when errors spike
- **Actual:** No error tracking or alerting service; logs only
- **Operational impact:** Failures are found by users
- **Affected dependencies:** Choice of an error-tracking service
- **Recommended correction:** Requires a business decision
- **Required tests:** A forced server error raises an alert
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: needs a provider choice
- **First recorded in:** qa/engineering-quality-findings.md

### E-018 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Code
- **Category:** Maintainability
- **Source file or endpoint:** Line counts
- **Evidence:** Line counts
- **Expected:** Smaller units
- **Actual:** Five server route files of 870 to 1,390 lines; five screen files over 1,000 lines
- **Operational impact:** Harder to change safely
- **Affected dependencies:** None
- **Recommended correction:** Accepted risk proposed, awaiting approval
- **Deferred: reason:** Splitting large working files is a refactor with no change in behaviour; Phase 2 is told not to refactor in bulk.
- **Deferred: target phase:** The phase the owner issues for each module (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Split a file when its module is worked on.
- **Deferred: dependencies:** B-014.
- **Deferred: acceptance criteria:** No route file over 600 lines.
- **Deferred: verification:** Simulation, sweep and unit tests unchanged after each split.
- **Required tests:** Owner agrees large files are split only when they are next changed for another reason
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open. Not refactored for style alone
- **First recorded in:** qa/engineering-quality-findings.md

### E-019 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Database
- **Category:** Isolation
- **Source file or endpoint:** Schema read
- **Evidence:** Schema read
- **Expected:** Tenant scoping proven by test
- **Actual:** Some tables carry a tenant id; whether every query honours it has not been audited
- **Operational impact:** Unknown
- **Affected dependencies:** None
- **Recommended correction:** Assigned to Workstream 6
- **Deferred: reason:** The product runs one company. Whether a second tenant will ever share the database is not decided, and the audit is a per-table review.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** Decide whether more than one tenant will share a database; if so, scope every query the way the branch boundary does.
- **Deferred: dependencies:** C-009.
- **Deferred: acceptance criteria:** Every table with a tenant id is either scoped or documented as unused.
- **Deferred: verification:** A sweep section with two tenants.
- **Required tests:** Sweep section proving a login from one tenant cannot read another's rows on every route that carries a tenant id
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: audit in Workstream 6 Phase 2 added the branch boundary, which is the isolation the business uses (one company, many branches). The tenant id columns were not audited.
- **First recorded in:** qa/engineering-quality-findings.md

### E-020 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Inventory
- **Category:** Data integrity
- **Source file or endpoint:** Schema read
- **Evidence:** Schema read
- **Expected:** Database-enforced once every write path is known to update the figures together
- **Actual:** "On hand = available + reserved + on hold" is kept by code and checked by the reconciliation, not by the database
- **Operational impact:** A future code path could break the identity unnoticed until reconciliation
- **Affected dependencies:** Owner applies the SQL file
- **Recommended correction:** Fixed in Workstream 3
- **Required tests:** The database refuses a row where on hand differs from available + reserved + on hold; three cycles pass with the rule on
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed
- **Verification evidence:** Migration `20261113150000_stock_balance_identity`; sweep: the check exists and a balance that does not add up is refused (both fail before the migration). Every write path reviewed: receive, reserve, release, ship, return, hold, release hold
- **First recorded in:** qa/engineering-quality-findings.md

### E-021 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** API
- **Category:** Consistency
- **Source file or endpoint:** Bench responses
- **Evidence:** Bench responses
- **Expected:** One shape
- **Actual:** List routes answer in two shapes: a bare list, or `{ data, meta }`
- **Operational impact:** Screens need per-route handling; totals unavailable on bare lists
- **Affected dependencies:** Screen changes with each route
- **Recommended correction:** Assigned to Workstreams 2 to 5, per module
- **Deferred: reason:** Changing a list reply from a bare list to { data, meta } breaks every screen that reads it. Phase 2 may not introduce an incompatible contract.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** Move the screens to one reader that accepts both, then change the routes.
- **Deferred: dependencies:** E-008 (paging).
- **Deferred: acceptance criteria:** One list shape on every route.
- **Deferred: verification:** qa/tools/api-contract.mjs extended to check the shape.
- **Required tests:** Every list route in the module answers `{ data, meta }` and its screens are updated; contract scan shows no mismatch
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: changing a reply shape affects screens, so it is done per workstream. Job list now sends the total in a header phase-02-api-contracts.md records both shapes and which routes use each.
- **First recorded in:** qa/engineering-quality-findings.md

### E-023 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Operations cockpit
- **Category:** Performance, correctness
- **Source file or endpoint:** Bench before: no reply within 30 s on the scaled database
- **Evidence:** Bench before: no reply within 30 s on the scaled database
- **Expected:** Aggregated in the database; real status names
- **Actual:** `GET /api/ops-cockpit` loaded every job, order with lines, stock item, shipment and dispatch operation on each call. It also tested for job and shipment statuses that do not exist, so completed jobs were treated as open and shipments in transit were not counted as shipped
- **Operational impact:** The cockpit page stops loading as history grows
- **Affected dependencies:** Screen decision on how many hot jobs to list
- **Recommended correction:** Fixed in part; remainder assigned to Workstream 4
- **Deferred: reason:** It is a performance defect that needs measuring at volume.
- **Deferred: target phase:** Phase 11: performance and full simulation cycles
- **Deferred: required correction:** Load the cockpit from counted queries.
- **Deferred: dependencies:** B-012.
- **Deferred: acceptance criteria:** Measured under the target at 80-branch volume.
- **Deferred: verification:** The benchmark with a stated environment.
- **Required tests:** Cockpit answers under 500 ms on the scaled database
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed in part
- **First recorded in:** qa/engineering-quality-findings.md

### F-001 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Web orders (was I-018)
- **Category:** Money
- **Source file or endpoint:** Code read; Sweep 20 on the old commit: tax null, invoice tax 0 where 5.00 was due
- **Evidence:** Code read; Sweep 20 on the old commit: tax null, invoice tax 0 where 5.00 was due
- **Expected:** Tax and total by rule 27
- **Actual:** An accepted web order saved its lines and no subtotal, tax or total. Its invoices therefore carried no tax, and it counted as zero against a credit limit
- **Operational impact:** Every web order under-billed by its tax
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 20: 7 checks, including an exempt customer and the invoice. Fail without it
- **First recorded in:** qa/engineering-quality-findings.md

### F-002 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipping screen (`/shipping`)
- **Category:** Functional
- **Source file or endpoint:** Screen read against `routes/shipments.js`; Browser
- **Evidence:** Screen read against `routes/shipments.js`; Browser
- **Expected:** Real shipments, created and moved on the screen
- **Actual:** The Shipping menu item listed sample shipments. There was no screen to create, dispatch or deliver a real shipment; it could only be done through the API
- **Operational impact:** Shipping staff could not do their work in the system, and saw invented shipments
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Browser: 17 checks from New shipment to Delivered
- **First recorded in:** qa/engineering-quality-findings.md

### F-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipments list
- **Category:** Performance, privacy
- **Source file or endpoint:** Sweep 20 on the old commit
- **Evidence:** Sweep 20 on the old commit
- **Expected:** Search and count on the server; only what the desk needs
- **Actual:** The list sent the 50 newest with no count, no search, and the customer's whole record (credit limit, terms, tax status) to the shipping desk
- **Operational impact:** Older shipments could not be found; credit terms shown to staff with no need
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 20: 6 checks. Fail without it
- **First recorded in:** qa/engineering-quality-findings.md

### F-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipments
- **Category:** Observability
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Every move in the audit log with the person
- **Actual:** Nothing recorded who created, dispatched, delivered or cancelled a shipment
- **Operational impact:** A wrong dispatch, which moves stock and raises an invoice, could not be traced to anyone
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 20: 5 checks; Browser history checks. Fail without it
- **First recorded in:** qa/engineering-quality-findings.md

### F-005 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Proof of delivery
- **Category:** Input
- **Source file or endpoint:** Sweep 20 on the old commit: a 201-character signature was accepted
- **Evidence:** Sweep 20 on the old commit: a 201-character signature was accepted
- **Expected:** Text of a sensible length; an https or stored-document address
- **Actual:** The signature and image address were stored as sent: any length, any type, any address
- **Operational impact:** Stored junk, and an unsafe link shown later on a screen
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 20: 2 checks. Fail without it
- **First recorded in:** qa/engineering-quality-findings.md

### F-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Invoices, payments, credits, refunds
- **Category:** Observability, financial control
- **Source file or endpoint:** Code read of `services/billing.js`
- **Evidence:** Code read of `services/billing.js`
- **Expected:** Each one in the audit log with the person, in the same transaction as the money
- **Actual:** No money action recorded who did it. `Payment` has no user field and billing wrote no audit row
- **Operational impact:** A payment, credit, refund or cancelled invoice could not be traced to a person
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 20: 9 checks, counter sales included; Browser: 2. Fail without it. No database change: the audit log table is used
- **First recorded in:** qa/engineering-quality-findings.md

### F-007 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Freight and logistics screens; All Orders
- **Category:** Mock data
- **Source file or endpoint:** Screen read
- **Evidence:** Screen read
- **Expected:** Real data, or a clear label
- **Actual:** Nine freight and logistics screens showed invented shipments, routes and rates as real. All Orders fell back to sample orders on error and showed tax 0 and total equal to subtotal for every order
- **Operational impact:** Staff could act on invented freight figures; order totals looked wrong
- **Affected dependencies:** Whether freight planning (rates, routes, tracking, exceptions) is built or taken off the menu
- **Recommended correction:** Mitigated; requires a business decision
- **Required tests:** The screens read real data, or are removed
- **Assigned phase:** Shipping and financial operations
- **Status note:** Mitigated and fixed
- **Verification evidence:** The nine screens carry the sample notice and point to Shipping (Browser: 3). All Orders has no fallback and shows saved tax and total. Two old sample shipment screens and one unused sample shipping desk deleted; old addresses redirect (Browser: 2)
- **First recorded in:** qa/engineering-quality-findings.md

### F-008 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Web store checkout
- **Category:** Business rule
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** One rule the buyer and the invoice agree on
- **Actual:** The store shows the buyer an estimate of tax by the ship-to state. On acceptance the order is taxed by the selling branch (rule 27). The two can differ
- **Operational impact:** A buyer could be shown one tax and invoiced another
- **Affected dependencies:** Which state the store's tax estimate uses
- **Recommended correction:** Requires a business decision
- **Required tests:** A sweep check that the estimate equals the tax on the accepted order
- **Assigned phase:** Shipping and financial operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### F-009 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Invoices
- **Category:** Access
- **Source file or endpoint:** `lib/roleAccess.js`; a check written for it was withdrawn because it tested a rule nobody set
- **Evidence:** `lib/roleAccess.js`; a check written for it was withdrawn because it tested a rule nobody set
- **Expected:** To be decided
- **Actual:** Any staff login can read every invoice and its payments (reads are open to all staff by design; only changes are restricted)
- **Operational impact:** Shop staff can see what customers owe and paid
- **Affected dependencies:** Who may read invoices and payments
- **Recommended correction:** Requires a business decision
- **Required tests:** A sweep check per role
- **Assigned phase:** Shipping and financial operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### F-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Help manual, Shipping
- **Category:** Documentation
- **Source file or endpoint:** Screen read
- **Evidence:** Screen read
- **Expected:** The manual matches the screens
- **Actual:** The page described steps that are not on any screen: selecting packages, service levels, shipping cost, generating a BOL, packing list and label, tracking numbers, customer notification, signature capture
- **Operational impact:** Staff trained on steps that are not there
- **Assigned phase:** Shipping and financial operations
- **Status note:** Fixed
- **Verification evidence:** Rewritten from the screens as built
- **First recorded in:** qa/engineering-quality-findings.md

### F-011 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Shipping documents
- **Category:** Not examined
- **Source file or endpoint:** None
- **Evidence:** None
- **Expected:** To be examined
- **Actual:** Whether a bill of lading or packing list can be printed for a shipment was not examined. Print code exists in the server (`printQueue`, `printAutomationService`); the new Shipment screen has no print button
- **Operational impact:** Unknown
- **Affected dependencies:** None
- **Recommended correction:** Not examined in this workstream either
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Shipping and financial operations.
- **Deferred: target phase:** Shipping and financial operations: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None
- **Deferred: acceptance criteria:** To be examined
- **Deferred: verification:** The print path examined and either wired to the Shipment screen or recorded as a gap
- **Required tests:** The print path examined and either wired to the Shipment screen or recorded as a gap
- **Assigned phase:** Shipping and financial operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### F-012 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Frontend build
- **Category:** Tooling
- **Source file or endpoint:** Seen in this session
- **Evidence:** Seen in this session
- **Expected:** A build or lint step that rejects an undefined name
- **Actual:** A stray word left in `AppRouter.jsx` by a patch in this workstream passed the production build and broke every screen at run time. Caught by the browser check before commit
- **Operational impact:** A broken release could pass the build
- **Affected dependencies:** None
- **Recommended correction:** Fixed in Workstream 6 (X-006)
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Shipping and financial operations.
- **Deferred: target phase:** Shipping and financial operations: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None
- **Deferred: acceptance criteria:** A build or lint step that rejects an undefined name
- **Deferred: verification:** `npm run lint` fails on an undefined name; shown failing on the F-012 defect
- **Required tests:** `npm run lint` fails on an undefined name; shown failing on the F-012 defect
- **Assigned phase:** Shipping and financial operations
- **Status note:** Open (see E-016)
- **First recorded in:** qa/engineering-quality-findings.md

### G-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Database
- **Workflow:** Every amount, weight and price
- **Category:** Data integrity: inexact numbers
- **Source file or endpoint:** src/backend/src/lib/db.js (every write); columns of type numeric
- **Evidence:** Query over every numeric column of the QA database after one simulation: 12 columns held values with digits nobody entered, for example Invoice.taxAmount 9.380000000000001 and OrderLine.extendedPrice 162.49999999999997. Eight of 62 invoices were affected.
- **Expected:** An amount is stored as entered, to the cent.
- **Actual:** A number passed from JavaScript to a decimal column was written with every binary digit of its floating-point form. Sums of such values drift by fractions of a cent, and two amounts that print the same can compare as different.
- **Root cause or suspected cause:** The database client serialises a JavaScript number in full; the columns have no fixed scale (numeric with 30 places).
- **Operational impact:** Invoice, payment and tax totals that do not add up exactly; reconciliation reports that flag false differences or hide real ones.
- **Recommended correction:** lib/moneyColumns.js: every number bound for a decimal column is sent as an exact decimal string; amounts of money are rounded to the cent first. Applied in the database client, so every route is covered.
- **Required tests:** A database check for residue in every numeric column; scenarios that store fractional weights, four-place prices and split tax.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Existing rows in the live database keep the digits they were saved with. They are not changed by this fix; a repair of historical rows needs the owner's approval (see phase-03-financial-reconciliation.md, section 5).
- **Verification evidence:** test/moneyColumns.test.js (6 tests). qa/tools/db-facts.mjs check "amounts kept with digits beyond what was entered": 12 columns before, 0 after three simulation seeds and the Phase 3 scenarios. qa/sim/phase3-db.mjs: fractional weight 1234.5678 and price 0.8125 stored exactly; tax split across two invoices adds to the cent.
- **First recorded in:** Phase 3 database audit

### G-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Database
- **Workflow:** Invoices, credit memos, returns, jobs, work orders, quotes, shipments, dispatch
- **Category:** Data integrity: missing foreign keys
- **Source file or endpoint:** prisma/schema.prisma; migration 20261113210000_reference_integrity
- **Evidence:** qa/tools/db-schema.mjs against the catalogues: 232 columns named like a reference had no foreign key. Fifteen of them tie money, stock or work to its source: Invoice.shipmentId, Invoice.creditOfInvoiceId, InvoiceLine.orderLineId, Job.orderLineId, Job.workOrderId, Order.returnOfOrderId, OrderLine.returnOfLineId, Quote.createdById, QuoteLine.productId, WorkOrder.salesOrderId, WorkOrder.lineId, DispatchJob.orderId, DispatchJob.locationId, DispatchOperation.assignedWorkCenterId, Shipment.carrierId.
- **Expected:** An invoice cannot name a shipment that does not exist, and a shipment that has been invoiced cannot be deleted.
- **Actual:** Nothing in the database stopped either. DispatchJob.locationId also carried the default text "FWA", which is no branch (C-003).
- **Root cause or suspected cause:** The columns were added as plain text ids.
- **Operational impact:** Orphaned financial and production records after any delete or bad write.
- **Recommended correction:** Fifteen foreign keys, each added without locking the table and validated only when no existing row breaks it; eight indexes for the new keys; the "FWA" default removed.
- **Required tests:** Each key proven by a refused write; the migration run twice on a populated copy.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Takes effect in the live database when the owner applies database update 6. If live rows break a key, the file says so in a notice and leaves that key in force for new rows only.
- **Verification evidence:** qa/sim/phase3-db.mjs "the database refuses money that does not add up": an invoice pointed at a missing shipment, an invoice line at a missing order line, and the delete of an invoiced shipment are each refused. SQL Editor file run twice on the 85-branch copy (72,240 orders): all 15 keys validated, second run changed nothing. Catalogue count 171 foreign keys before, 188 after (with the two branch keys of G-012).
- **First recorded in:** Phase 3 database audit

### G-003 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Database
- **Category:** Data integrity: missing foreign keys
- **Source file or endpoint:** qa/results/db-schema.json (unconstrained)
- **Evidence:** After G-002: 217 reference-like columns still have no foreign key; for 79 the target table is evident. Ten hold values that match no row in the QA database, all in sample modules or JSON-backed stores (ExceptionEvent, IntakeJob, IntakeOrder, InventoryUnit, RfidScanEvent, PrintQueueJob, DispatchTimeLog). Seventeen tables have a locationId with no key to Location. Job.operatorId has two possible targets (User or Operator) and the code uses both readings.
- **Expected:** Every reference is enforced or is documented as free text.
- **Actual:** Most of the 217 are in the 93 tables that hold no rows and belong to modules that are designed but not built (X-009, B-017).
- **Root cause or suspected cause:** Schema written ahead of the code.
- **Operational impact:** None on stock or money today. Each becomes a risk when its module is built.
- **Affected dependencies:** X-009 and decision 4 (build everything): each module phase decides its tables.
- **Recommended correction:** Add the key when the module is built or the table is retired; decide the target of Job.operatorId.
- **Deferred: reason:** Adding keys to tables no code writes cannot be tested, and the instruction forbids adding constraints blindly. The 15 that guard money, stock and work were added in this phase.
- **Deferred: target phase:** The phase the owner issues for each module (inventory, manufacturing, logistics, safety) (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** As above, table by table, with the module that owns it.
- **Deferred: dependencies:** X-009, B-017.
- **Deferred: acceptance criteria:** No reference column with a known target lacks a key; no orphan rows.
- **Deferred: verification:** qa/tools/db-schema.mjs in the gates; the count is recorded in each phase report.
- **Required tests:** db-schema.mjs count of unconstrained references with a known target falls to 0.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Workflow:** Reserving stock for an order line
- **Category:** Data integrity: simultaneous requests
- **Source file or endpoint:** src/backend/src/routes/orders.js (POST /:id/allocate)
- **Evidence:** qa/sim/phase3-db.mjs on the code before the fix (qa/results/phase3-db-before-fixes.json): one order line needing 1000 lb, reserved 700 lb from each of two items at the same moment, ended with 1400 lb reserved in 6 of 6 rounds. An order cancelled at the same moment as a reservation kept the reservation in 6 of 6 rounds: stock held for a cancelled order, for ever.
- **Expected:** A line is never reserved beyond what it still needs, and a cancelled order holds no stock.
- **Actual:** The open quantity and the order status were read before the transaction and not checked again inside it.
- **Root cause or suspected cause:** Read, decide, write with the decision made outside the transaction.
- **Operational impact:** Stock tied up that nobody can see a reason for; available stock understated; in the cancelled case nothing ever releases it.
- **Recommended correction:** The reservation locks the order row first, then reads the status and the line's open quantity inside the transaction. A cancellation waits for it and releases what it saved.
- **Required tests:** Both races, six rounds each; eight reservations at once on one item.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Verification evidence:** qa/sim/phase3-db.mjs: both race scenarios pass 6 of 6 after the fix and failed 6 of 6 before; db-facts checks "order line reserved more than is left to ship" and "reservations left on cancelled or completed orders" return 0.
- **First recorded in:** Phase 3 database audit

### G-005 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Database
- **Category:** Performance: redundant indexes
- **Source file or endpoint:** migration 20261113210000_reference_integrity
- **Evidence:** Catalogue read: 10 indexes were exact duplicates of another index on the same columns (578 indexes in all).
- **Expected:** One index per need.
- **Actual:** Every write to those tables maintained the same index twice.
- **Root cause or suspected cause:** A unique rule and a plain index declared on the same column.
- **Operational impact:** Slower writes and wasted space; no effect on correctness.
- **Recommended correction:** The ten duplicates are dropped. Four more are prefixes of a unique index and were left, because dropping them is not measured to help.
- **Required tests:** db-schema.mjs reports 0 duplicate indexes; the sweep check "every foreign key has an index" still passes.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Verification evidence:** qa/results/db-schema.json: duplicateIndexes 10 before, 0 after. Sweep "Platform safeguards": 33 checks pass.
- **First recorded in:** Phase 3 database audit

### G-006 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Stock items
- **Workflow:** Remnants
- **Category:** Inventory accounting
- **Source file or endpoint:** src/backend/src/lib/receiving.js (parentTag)
- **Evidence:** qa/sim/phase3-db.mjs: a 51.25 lb remnant entered against a 6000 lb parent leaves the parent at 6000 lb. The remnant inherits heat, grade and owner and is linked both ways.
- **Expected:** Material is conserved: what a remnant weighs comes out of its parent, or the system says the parent weight is not maintained.
- **Actual:** The company total rises by the remnant's weight.
- **Root cause or suspected cause:** Processing moves no stock (M-016), so there is no step at which the parent is reduced.
- **Operational impact:** Stock by weight is overstated by every remnant entered.
- **Affected dependencies:** M-016.
- **Recommended correction:** Decided together with M-016: what a completed work order consumes, produces and scraps.
- **Required tests:** Parent plus children plus scrap equals the parent before, for every work order.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** The question for the owner is the one already asked under M-016: when a piece is cut, what happens to the weight of the piece it was cut from?
- **First recorded in:** Phase 3 database audit

### G-007 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Inventory
- **Workflow:** Transfers between branches
- **Category:** Missing function
- **Source file or endpoint:** src/backend/src/routes/inventory.js (POST /transfer)
- **Evidence:** qa/sim/phase3-db.mjs, nine transfer scenarios: a transfer is one immediate step that moves the whole item and writes one movement. There is no request, approval, pick, in-transit or receipt stage. The tables InventoryTransfer and InventoryAdjustment hold only the second stock list's JSON records (B-009).
- **Expected:** Material in a truck is in transit: off the sender's shelf, not yet on the receiver's, with shortage and damage recorded at receipt.
- **Actual:** The item is at the destination the moment the sender presses the button. What is on the road is counted as on the receiver's shelf.
- **Root cause or suspected cause:** Never built.
- **Operational impact:** A receiving branch can sell or reserve material that has not arrived. Loss or damage in transit has no record.
- **Affected dependencies:** B-009 (the second stock list has transfer screens with no real data behind them); I-016.
- **Recommended correction:** A transfer document with statuses (requested, shipped, received), an in-transit balance, and receipt by quantity with a variance.
- **Deferred: reason:** It is a new function with screens, not a correction. Decision 4 says build everything; it belongs with the inventory module.
- **Deferred: target phase:** The phase the owner issues for inventory and purchasing (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** B-009, I-016.
- **Deferred: acceptance criteria:** Stock in transit is on neither shelf; sender plus in transit plus receiver is constant; a receipt cannot be entered twice.
- **Deferred: verification:** Database scenarios for each stage, including two receipts at once.
- **Required tests:** The eight transfer scenarios of Phase 3 plus partial receipt, shortage, damage, duplicate receipt and cancellation.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-008 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Work orders
- **Workflow:** Raising a work order
- **Category:** Inventory accounting
- **Source file or endpoint:** src/backend/src/routes/workOrders.js (POST /)
- **Evidence:** qa/sim/phase3-db.mjs: two work orders raised on one 4000 lb item, at once or one after the other, are both accepted, each with 4000 lb as its input.
- **Expected:** The same material is not planned for consumption twice, or the rule says it may be.
- **Actual:** A work order does not claim its source item.
- **Root cause or suspected cause:** Processing moves no stock (M-016).
- **Operational impact:** Two jobs can be planned against the same steel.
- **Affected dependencies:** M-016.
- **Recommended correction:** Decided with M-016.
- **Required tests:** Per the rule.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Question for the owner: may one stock item feed more than one open work order at a time?
- **First recorded in:** Phase 3 database audit

### G-009 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Counter quick sale
- **Workflow:** Voiding a sale
- **Category:** Data model
- **Source file or endpoint:** src/backend/src/routes/quickSale.js
- **Evidence:** Code read: a voided sale is known by the word VOIDED in the order's notes; the void is claimed by matching that text.
- **Expected:** A status or column that reports can filter on.
- **Actual:** Free text. The order stays COMPLETE.
- **Root cause or suspected cause:** No status for it.
- **Operational impact:** Any report by order status counts a voided sale as a sale. The money side is right (credit memo and refund).
- **Recommended correction:** A voidedAt column, or a status.
- **Deferred: reason:** It changes what order statuses mean to every report and screen that reads them, which is a sales-module decision; the void itself is now all-or-nothing (C-010).
- **Deferred: target phase:** The phase the owner issues for sales and customer operations (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** No code reads the notes to learn that a sale is void.
- **Deferred: verification:** A database scenario that voids and then reads the status.
- **Required tests:** A report by status excludes voided sales.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Workflow:** Order status and reservations
- **Category:** Audit trail
- **Source file or endpoint:** src/backend/src/routes/orders.js (PUT /:id, POST /:id/allocate)
- **Evidence:** AuditLog of the QA database after three simulation seeds: jobs, shipments, invoices, payments, credits, prices and work orders each leave a line with the person. Confirming or cancelling an order left none, and a reservation records no person anywhere (OrderLineAllocation has no user column).
- **Expected:** Who confirmed, cancelled or reserved, and when.
- **Actual:** Not recorded.
- **Root cause or suspected cause:** Never added to these two routes.
- **Operational impact:** A cancelled order or a reservation cannot be traced to a person.
- **Recommended correction:** ORDER_STATUS_CHANGED and STOCK_RESERVED are written inside the same transaction as the change.
- **Required tests:** A scenario reads the history after each.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Verification evidence:** qa/sim/phase3-db.mjs: the reservation scenario reads who reserved what; the cancellation scenario reads the confirmation and the cancellation; two status changes at once leave exactly one line.
- **First recorded in:** Phase 3 database audit

### G-011 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** Audit trail
- **Category:** Audit trail: can be altered
- **Source file or endpoint:** AuditLog table; src/backend/src/routes/quickSale.js:308; src/backend/src/routes/overrides.js:159
- **Evidence:** Catalogue read: no trigger and no rule protects AuditLog; the application's database role may update and delete it. Two code paths do: a duplicate counter sale deletes the history lines of the copy it removes, and revoking an override updates its line. Changes to an order's fields other than status, edits to a stock item, and the release of reservations by a cancellation are not itemised.
- **Expected:** History is append-only; critical field changes carry before and after values.
- **Actual:** History can be rewritten by any code with database access.
- **Root cause or suspected cause:** An ordinary table.
- **Operational impact:** The audit trail is evidence only as long as nobody with access wants otherwise.
- **Affected dependencies:** The owner's database roles on the host.
- **Recommended correction:** Revoke update and delete on AuditLog from the application role, or add a trigger that refuses them; change the two code paths to add a line instead; add before and after values for order and stock item edits.
- **Deferred: reason:** It needs a change to database roles on the host, which are the owner's, and it is the subject of the security phase.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** Host database roles.
- **Deferred: acceptance criteria:** No statement issued by the application can change or remove an audit row.
- **Deferred: verification:** A database scenario that tries both.
- **Required tests:** An update and a delete of an audit row are refused by the database.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-012 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Quotes
- **Workflow:** Quotes and requests for quotation
- **Category:** Security: branch isolation
- **Source file or endpoint:** Quote.locationId, RFQ.locationId; lib/branchScope.js
- **Evidence:** C-009: a sales login at one branch could read every branch's quotes, because the tables had no branch.
- **Expected:** A quote belongs to the branch of the person who wrote it.
- **Actual:** No branch column.
- **Root cause or suspected cause:** Schema.
- **Operational impact:** Prices quoted by one branch visible to another.
- **Recommended correction:** A branch column on both, filled from the writer's home branch (existing quotes) and set on creation; the boundary holds quotes, requests and their lines to it. One with no branch is seen by every branch.
- **Required tests:** Read and list from another branch.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Takes effect in the live database when the owner applies database update 8.
- **Verification evidence:** qa/sim/phase3-db.mjs: a quote written at one branch answers 404 to a sales login at another and is absent from its list; the order made from it carries the same branch. test/branchScope.test.js: 2 new tests. SQL Editor file run twice on the scale copy.
- **First recorded in:** Phase 3 database audit

### G-013 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Stock items, stock search, heat trace
- **Workflow:** Lists at company scale
- **Category:** Performance
- **Source file or endpoint:** GET /api/coils?search=, GET /api/jobs (branch filter)
- **Evidence:** Measured on the scale copy (100,233 stock items, 72,541 jobs, 85 branches; qa/results/phase3-plans.txt): the stock search reads every stock item (sequential scan, 140 ms); a branch's job count reads every job in the company (parallel sequential scan, 25 ms) because a job reaches its branch through its order, its work center or its creator.
- **Expected:** The cost of a branch screen grows with the branch, not the company.
- **Actual:** Both grow in step with the whole company's data. Both are far inside the half-second target today.
- **Root cause or suspected cause:** A contains-search across three tables cannot use an ordinary index; Job has no branch column of its own.
- **Operational impact:** None now. At ten times the volume the search would take over a second.
- **Recommended correction:** A trigram index and a search limited to one column at a time; a branch column on Job, kept by the same code that sets its order and work center.
- **Deferred: reason:** Both are measured at 4 to 20 times under the target. The instruction forbids adding indexes or structure without evidence of need.
- **Deferred: target phase:** Phase 11: performance and full simulation cycles
- **Deferred: required correction:** As above, if the measurement at ten times the volume shows the need.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** p95 under 500 ms for both at 1,000,000 stock items and jobs.
- **Deferred: verification:** qa/perf/phase3-plans.sh and qa/perf/branch-bench.mjs on a larger copy.
- **Required tests:** The same two measurements at one million rows.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-014 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Workflow:** Lists
- **Category:** Performance: reply size
- **Source file or endpoint:** GET /api/orders
- **Evidence:** qa/results/phase3-branch-bench-before.json: 50 orders are a 244 KB reply. qa/results/phase3-load.txt: one server process answers about 43 list requests a second on the scale copy; 400 at once all succeed, with a 95th-percentile wait of 9.3 s.
- **Expected:** A list sends what the list shows.
- **Actual:** Each order comes with its full lines and customer record.
- **Root cause or suspected cause:** One include clause for list and detail.
- **Operational impact:** Bandwidth and server time on the busiest screen; the limit on requests per second is the size of the replies, not the database (it peaked at 16 connections).
- **Recommended correction:** A list shape with the columns the screen shows.
- **Deferred: reason:** It changes the reply of an endpoint the screens depend on, which is the subject of the API contract phase.
- **Deferred: target phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** E-021 (reply shapes).
- **Deferred: acceptance criteria:** 50 orders in under 50 KB; no screen loses a field it shows.
- **Deferred: verification:** qa/perf/branch-bench.mjs; the five browser suites.
- **Required tests:** Reply size and requests per second before and after.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-015 · P2 · BLOCKED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** Database connections on the host
- **Category:** Configuration not verifiable
- **Source file or endpoint:** DATABASE_URL on the host (the owner's setting)
- **Evidence:** The repository sets no pool size or timeout; the database client's default is used (16 connections observed under load on a 4-processor machine). On the host each serverless instance opens its own pool. Whether DATABASE_URL points at the provider's connection pooler, and with what limits, cannot be read from here.
- **Expected:** A stated limit per instance and a pooler in front of the database, so that many instances cannot exhaust it.
- **Actual:** Unknown.
- **Root cause or suspected cause:** Host settings are the owner's.
- **Operational impact:** If the direct address is used, a burst of traffic that starts many instances can use every connection the database allows.
- **Affected dependencies:** The owner.
- **Recommended correction:** Confirm that DATABASE_URL is the pooler address (port 6543 on Supabase, with pgbouncer=true and a connection_limit) and DIRECT_URL the direct one.
- **Required tests:** A load test against a staging copy.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Blocked on the owner reading two host settings. Nothing was changed.
- **First recorded in:** Phase 3 database audit

### G-016 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Database
- **Workflow:** Retention
- **Category:** Capacity
- **Source file or endpoint:** AuditLog, MaterialMovement, RequestKey, time logs
- **Evidence:** No retention or archive rule exists for any table. RequestKey rows are removed after 24 hours by the middleware itself. Sizes on the scale copy: the whole database is 325 MB at 72,240 orders.
- **Expected:** A rule for how long history is kept and where it goes.
- **Actual:** Everything is kept for ever in the working tables.
- **Root cause or suspected cause:** Not decided.
- **Operational impact:** None for years at the measured growth; a decision, not a defect.
- **Recommended correction:** The owner sets the periods; archive tables or partitions follow only if the volume needs them.
- **Required tests:** None until the rule exists.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Question for the owner: how many years of audit history and stock movements must stay online?
- **First recorded in:** Phase 3 database audit

### G-017 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Database
- **Workflow:** Numbering of orders, shipments, invoices and other documents
- **Category:** Reliability: simultaneous requests
- **Source file or endpoint:** src/backend/src/lib/numbering.js (used by 15 route and service files)
- **Evidence:** qa/sim/phase3-db.mjs on the code before the fix: 80 orders entered at the same moment, 72 saved and 8 answered "Failed to create order" (server log: "Could not assign a unique number"). Unit test on the same code: a series that has had rows deleted, so that its row count is more than 25 below its highest number, can never issue another number.
- **Expected:** Eighty branches can save at once, and a series keeps working after rows are deleted.
- **Actual:** The next number was the row count plus one, tried 25 times in step with every other request.
- **Root cause or suspected cause:** Every simultaneous request started from the same count and walked forward together.
- **Operational impact:** Lost orders at a busy moment; and a document type that stops working for good once enough rows have been deleted (a duplicate counter sale deletes its order).
- **Recommended correction:** After two collisions the search waits a random moment, counts again and steps ahead by a random distance that doubles. A series may skip numbers; the unique rule in the database guarantees none repeats.
- **Required tests:** 80 at once; a series whose count lags its highest number by 300.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Document numbers can have gaps. If the owner needs invoice numbers with no gaps, that is a different mechanism (a counter row locked per series) and a decision.
- **Verification evidence:** test/numbering.test.js: 2 new tests, both fail on the code before. qa/sim/phase3-db.mjs "eighty orders entered at the same moment": 80 saved with 80 numbers.
- **First recorded in:** Phase 3 database audit

### G-018 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Database
- **Workflow:** Orders
- **Category:** Data integrity: optional branch
- **Source file or endpoint:** Order.locationId, User.homeLocationId
- **Evidence:** db-facts on the QA database: orders with no branch 59 (the demo seed) rising to 62 after the scenarios, because an order entered by a login with no home branch gets none; 2 staff logins have no home branch.
- **Expected:** Every order has a branch.
- **Actual:** The column is optional, so that existing rows and all-branch logins keep working.
- **Root cause or suspected cause:** The column was added in Phase 2 to a table with rows.
- **Operational impact:** An order with no branch is seen only by all-branch roles.
- **Affected dependencies:** The owner gives every staff login a home branch and assigns the orders that have none.
- **Recommended correction:** After the backfill: make Order.locationId required, and refuse an order from a login with no branch unless it names one.
- **Deferred: reason:** Making the column required before the live rows are assigned would fail the migration or lose orders from view.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** The owner's backfill in the live database.
- **Deferred: acceptance criteria:** No order without a branch; the column is NOT NULL.
- **Deferred: verification:** db-facts in the gates; the migration run twice on a copy.
- **Required tests:** db-facts "orders with no branch" is 0; a database scenario for the refusal.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### G-019 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Shipments
- **Workflow:** Dispatch
- **Category:** Traceability and inventory accounting
- **Source file or endpoint:** src/backend/src/routes/shipments.js (consumeReserved: "Stock with no reservation is left alone")
- **Evidence:** qa/sim/phase3-db.mjs: a shipment of 300 lb for an order line with nothing reserved is dispatched and invoiced; no stock movement is written, no stock item is named and no balance goes down. ShipmentItem has no column for the stock item; the only link from a shipment to an item, and so to its heat, is the movement written when reserved stock is consumed.
- **Expected:** Every pound that leaves is taken from a named stock item, so the heat can be traced to the customer and the shelf balance is right; or the shipment is marked as material that was never in stock (a direct shipment from the mill).
- **Actual:** Shipping reserved stock is fully recorded. Shipping without a reservation is accepted and records nothing about the material.
- **Root cause or suspected cause:** Dispatch consumes reservations and does nothing when there are none.
- **Operational impact:** For such a shipment a mill certificate cannot be matched to the customer from the records, and the stock on the books stays too high.
- **Affected dependencies:** I-016 (no stock adjustment), M-016.
- **Recommended correction:** The engineer's recommendation: refuse to dispatch a line that is not fully reserved, unless the order line is marked as shipped direct from a supplier.
- **Required tests:** Dispatch with a part reservation is refused; a direct shipment is accepted and marked; the database check for uncovered shipment items returns 0.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Question for the owner: may an order ship when no stock has been reserved for it? If yes, in which cases (direct from the mill, buy-outs), and how should the heat be recorded?
- **First recorded in:** Phase 3 database audit

### G-020 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Workflow:** Two people editing one record
- **Category:** Reliability: lost update
- **Source file or endpoint:** PUT /api/orders/:id and the other edit routes
- **Evidence:** Code read and qa/sim/phase3-db.mjs: a change of status is conditional on the status the editor saw, so of two simultaneous status changes one wins and the other is told (409). A change to other fields (dates, notes, ship-to) carries no version: two people saving different edits both succeed and the later one silently replaces the earlier where they touch the same field.
- **Expected:** The second editor is told the record changed.
- **Actual:** Status is protected; other fields are last write wins.
- **Root cause or suspected cause:** No version or updated-at check on edits.
- **Operational impact:** An edit can be lost without notice. No quantity or amount is at risk: totals are recomputed and checked by the database.
- **Recommended correction:** Send the record's updatedAt with an edit and refuse the edit if it has changed (409).
- **Deferred: reason:** It changes the request contract of every edit route and the screens that call them, which is the subject of the API contract phase.
- **Deferred: target phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Deferred: required correction:** As above.
- **Deferred: dependencies:** E-021.
- **Deferred: acceptance criteria:** No edit route accepts a change based on a stale copy.
- **Deferred: verification:** A database scenario per record type.
- **Required tests:** Two edits at once: one 200, one 409.
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **First recorded in:** Phase 3 database audit

### I-001 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock items (Units)
- **Category:** Correctness
- **Source file or endpoint:** Code read; Browser
- **Evidence:** Code read; Browser
- **Expected:** The real stock, searchable
- **Actual:** The list and the item screen always showed sample rows: the screen looked for a field the server never sends
- **Operational impact:** Staff looked at stock that does not exist
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Screens rebuilt on `/api/coils`; Browser: 7 checks
- **First recorded in:** qa/engineering-quality-findings.md

### I-002 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Heats
- **Category:** Correctness
- **Source file or endpoint:** Code read; Browser
- **Evidence:** Code read; Browser
- **Expected:** The real heats
- **Actual:** The list and the heat screen always showed sample heats, chemistry and units
- **Operational impact:** Invented mill certificates data on screen
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Screens rebuilt on `/api/heats`; Browser: 8 checks
- **First recorded in:** qa/engineering-quality-findings.md

### I-003 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry
- **Category:** Money
- **Source file or endpoint:** Code read, `MaterialPicker.jsx`; Sweep 15
- **Evidence:** Code read, `MaterialPicker.jsx`; Sweep 15
- **Expected:** List price; cost not shown to sales
- **Actual:** Picking stock for an order line set the selling price to what the stock cost us, and showed that cost
- **Operational impact:** Orders sold at cost; cost disclosed
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Picker uses `listPrice`; Sweep 15
- **First recorded in:** qa/engineering-quality-findings.md

### I-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock items, heats, products, grades
- **Category:** Data integrity
- **Source file or endpoint:** Code read; Sweep 15, 17
- **Evidence:** Code read; Sweep 15, 17
- **Expected:** Listed fields only, typed and range-checked; identity from the sign-in
- **Actual:** Create and edit wrote whatever the request held, including who created a record and who placed a hold
- **Operational impact:** Any field could be rewritten or forged
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** `lib/fieldRules.js` (7 unit tests); Sweep 15 (26 of 29 fail without it), Sweep 17 (32 of 37)
- **First recorded in:** qa/engineering-quality-findings.md

### I-005 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock upload
- **Category:** Correctness
- **Source file or endpoint:** Code read; Sweep 18
- **Evidence:** Code read; Sweep 18
- **Expected:** Rows become stock, and the reply is the count saved
- **Actual:** The upload answered "imported" and saved nothing: every row failed on a missing field, and the screen reported the row count as a success
- **Operational impact:** Staff believed stock was loaded
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** `lib/receiving.js`, `lib/receivingRules.js` (9 unit tests); Sweep 18 (27 of 32 fail without it)
- **First recorded in:** qa/engineering-quality-findings.md

### I-006 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Receiving
- **Category:** Correctness
- **Source file or endpoint:** Code read; Browser
- **Evidence:** Code read; Browser
- **Expected:** Real receipts; a receipt makes stock
- **Actual:** The screen listed sample deliveries and its Receive form saved nothing
- **Operational impact:** Receiving could not be done in the system
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Screen rebuilt; `POST/GET /api/inventory/receipts`; Sweep 18; Browser: 6 checks
- **First recorded in:** qa/engineering-quality-findings.md

### I-007 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Purchasing
- **Category:** Operational gap
- **Source file or endpoint:** Schema read: no model; no route
- **Evidence:** Schema read: no model; no route
- **Expected:** A purchasing record that receiving and payables match against
- **Actual:** There is no purchase order: nothing records what was ordered from a mill, what is due, or whether a receipt matches an order or a supplier invoice
- **Operational impact:** Expected deliveries unknown; three-way match impossible
- **Affected dependencies:** Whether purchasing is built into STEELWISE and how purchase orders are approved
- **Recommended correction:** Requires a business decision, then a build
- **Required tests:** A purchase order model; receipts match a PO line; a cycle with purchasing in the simulation
- **Assigned phase:** Inventory and purchasing
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### I-008 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Holds
- **Category:** Control
- **Source file or endpoint:** Code read; Sweep 15
- **Evidence:** Code read; Sweep 15
- **Expected:** A hold removes availability, blocks shipping, and can be released with a record
- **Actual:** A hold could be placed and never released; it took nothing out of availability; stock reserved before a hold could still ship
- **Operational impact:** Held material could be sold and shipped
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** `routes/coils.js`, `routes/shipments.js`; Sweep 15
- **First recorded in:** qa/engineering-quality-findings.md

### I-009 (S-023) · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock items, stock search, heat trace
- **Category:** Confidentiality
- **Source file or endpoint:** Replies of the three routes; Sweep 15, 17
- **Evidence:** Replies of the three routes; Sweep 15, 17
- **Expected:** Cost to managers, the inventory manager and buyers
- **Actual:** Unit cost and landed cost were sent to every signed-in role
- **Operational impact:** Cost visible to any staff login
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** `COST_VIEWERS`; Sweep 15, 17
- **First recorded in:** qa/engineering-quality-findings.md

### I-010 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Products
- **Category:** Control
- **Source file or endpoint:** Code read; Sweep 17
- **Evidence:** Code read; Sweep 17
- **Expected:** A manager, recorded
- **Actual:** Any staff login could change a list price by editing the product record, with no record, around rule 30
- **Operational impact:** Prices could be changed unseen
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** `routes/products.js` audits `LIST_PRICE_CHANGED`; Sweep 17
- **First recorded in:** qa/engineering-quality-findings.md

### I-011 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Supplier quality (six screens)
- **Category:** Correctness
- **Source file or endpoint:** Code read: no routes, no models
- **Evidence:** Code read: no routes, no models
- **Expected:** Real records, or a clear statement
- **Actual:** Inbound receiving, IQC inspections, nonconformances, SCARs, scorecards and suppliers show invented suppliers, inspections and scores. No server side exists
- **Operational impact:** Someone could act on an invented supplier score
- **Affected dependencies:** Whether supplier quality is built, and on what records
- **Recommended correction:** Requires a business decision, then a build
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Inventory and purchasing.
- **Deferred: target phase:** Inventory and purchasing: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Whether supplier quality is built, and on what records
- **Deferred: acceptance criteria:** Real records, or a clear statement
- **Deferred: verification:** The six screens read real data and the notice is removed
- **Required tests:** The six screens read real data and the notice is removed
- **Assigned phase:** Inventory and purchasing
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/engineering-quality-findings.md

### I-012 (D-024) · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Inventory
- **Category:** Architecture
- **Source file or endpoint:** Route and schema read
- **Evidence:** Route and schema read
- **Expected:** One stock list
- **Actual:** Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory menu opened the second
- **Operational impact:** Stock received or shipped did not show under "Inventory"
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Inventory and purchasing.
- **Deferred: target phase:** Inventory and purchasing: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** One stock list
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Inventory and purchasing
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice.
- **First recorded in:** qa/engineering-quality-findings.md

### I-013 (E-020) · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock balances
- **Category:** Data integrity
- **Source file or endpoint:** Schema read
- **Evidence:** Schema read
- **Expected:** Enforced by the database
- **Actual:** "On hand = available + reserved + on hold" was kept only by code
- **Operational impact:** A future change could break balances unnoticed
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Migration and SQL Editor file, run twice on a copy; sweep checks
- **First recorded in:** qa/engineering-quality-findings.md

### I-014 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock items
- **Category:** Operational gap
- **Source file or endpoint:** Screen review
- **Evidence:** Screen review
- **Expected:** A Move action with a record
- **Actual:** No screen could move an item to another location (the route existed)
- **Operational impact:** Transfers could not be done by staff
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Move on the item screen; Browser: 2 checks
- **First recorded in:** qa/engineering-quality-findings.md

### I-015 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock screens
- **Category:** Contract
- **Source file or endpoint:** `api-contract.mjs`
- **Evidence:** `api-contract.mjs`
- **Expected:** No call without a route
- **Actual:** Screen code held 15 calls to stock routes that do not exist
- **Operational impact:** Dead code that fails if used
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed
- **Verification evidence:** Removed from `api/units.js`, `api/heats.js`, `api/inventory.js`. 16 more in `api/boms.js` and `api/batches.js` belong to Workstream 4
- **First recorded in:** qa/engineering-quality-findings.md

### I-016 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Stock corrections
- **Category:** Operational gap
- **Source file or endpoint:** Route review
- **Evidence:** Route review
- **Expected:** A recorded adjustment with a rule for who may make it
- **Actual:** There is no way to correct a stock quantity: no count, adjustment or scrap on the real stock list
- **Operational impact:** A wrong weight stays wrong
- **Affected dependencies:** Who may adjust stock, and above what amount a second approval is needed
- **Recommended correction:** Requires a business decision
- **Required tests:** An adjustment route and screen; sweep checks on the rule
- **Assigned phase:** Inventory and purchasing
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### I-017 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Receiving
- **Category:** Efficiency
- **Source file or endpoint:** Sweep 18; screen review
- **Evidence:** Sweep 18; screen review
- **Expected:** Heats can be loaded from a file with the stock
- **Actual:** A heat must be on file before stock is received against it, and heats are added one at a time
- **Operational impact:** Slow first load of a large delivery
- **Affected dependencies:** None
- **Recommended correction:** Deferred with justification: receiving works; this is speed of first load
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Inventory and purchasing.
- **Deferred: target phase:** Inventory and purchasing: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** None
- **Deferred: acceptance criteria:** Heats can be loaded from a file with the stock
- **Deferred: verification:** A heats upload template; sweep check
- **Required tests:** A heats upload template; sweep check
- **Assigned phase:** Inventory and purchasing
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### I-018 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Web orders
- **Category:** Money
- **Source file or endpoint:** Code read, `routes/onlineOrders.js`
- **Evidence:** Code read, `routes/onlineOrders.js`
- **Expected:** Tax and total by rule 27
- **Actual:** An accepted web order saves its subtotal and no tax or total (seen while adding the credit hold)
- **Operational impact:** Web orders understate what is owed
- **Affected dependencies:** None
- **Recommended correction:** Fixed in Workstream 5 (F-001)
- **Required tests:** Sweep 20
- **Assigned phase:** Inventory and purchasing
- **Status note:** Open: Workstream 5 Phase 2 register correction: this was fixed in Workstream 5 as F-001 and the Phase 1 import carried the older "open" line.
- **Verification evidence:** Sweep section "Shipping and money records: web order tax, shipments and who did what": 37 checks, 0 problems, this session.
- **First recorded in:** qa/engineering-quality-findings.md

### M-001 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Job screen (`/jobs/:id`)
- **Category:** Functional
- **Source file or endpoint:** Screen read against `routes/jobs.js`; Browser
- **Evidence:** Screen read against `routes/jobs.js`; Browser
- **Expected:** The real job; a status change that saves
- **Actual:** Showed the same sample job ("ABC Steel Corporation") for every job, and its status dialog saved nothing
- **Operational impact:** Anyone opening a job saw invented facts
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Browser: 8 job checks. The order boards and the schedule now open it
- **First recorded in:** qa/engineering-quality-findings.md

### M-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Category:** Traceability
- **Source file or endpoint:** Sweep 19
- **Evidence:** Sweep 19
- **Expected:** Every status change recorded with the person, from, to and reason
- **Actual:** No record of who moved a job or why. The "history" was guessed from four timestamps
- **Operational impact:** A job put on hold or cancelled could not be traced to anyone
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Sweep 19; in the three cycles 788 moves were recorded, every one with a person. 42 of 48 fail without it
- **First recorded in:** qa/engineering-quality-findings.md

### M-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Category:** Data integrity
- **Source file or endpoint:** Sweep 19
- **Evidence:** Sweep 19
- **Expected:** The note belongs to the move
- **Actual:** A note typed with a status change, start, complete or ship replaced the job's own notes
- **Operational impact:** Customer instructions on a job were lost the first time someone moved it with a note
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Sweep 19, two checks
- **First recorded in:** qa/engineering-quality-findings.md

### M-004 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Category:** Validation
- **Source file or endpoint:** Sweep 19
- **Evidence:** Sweep 19
- **Expected:** An active user, or a clear refusal
- **Actual:** Assigning a job wrote any value as the assignee and answered 500 for a job or user that was not on file
- **Operational impact:** Jobs assigned to nobody; server errors
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Sweep 19, eight checks. Assignments are recorded
- **First recorded in:** qa/engineering-quality-findings.md

### M-005 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Work orders
- **Category:** Security
- **Source file or endpoint:** Sweep 19
- **Evidence:** Sweep 19
- **Expected:** Only the fields the form has
- **Actual:** Creating a work order wrote the request body to the database, so a caller could set its number, status, completion time and yield
- **Operational impact:** Forged production records
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Sweep 19
- **First recorded in:** qa/engineering-quality-findings.md

### M-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Work orders
- **Category:** Workflow
- **Source file or endpoint:** Sweep 19; unit tests
- **Evidence:** Sweep 19; unit tests
- **Expected:** Moves follow the status; yield worked out from weights; output plus scrap cannot exceed what went in
- **Actual:** Start and complete worked from any status, any number of times; yield was whatever the browser sent; a missing work order was a 500; there was no cancel
- **Operational impact:** A completed work order could be restarted; yields could be invented
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Sweep 19, 19 work order checks; `workOrderRules` unit tests
- **First recorded in:** qa/engineering-quality-findings.md

### M-007 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Work order screens
- **Category:** Functional
- **Source file or endpoint:** Browser
- **Evidence:** Browser
- **Expected:** Real records and working buttons
- **Actual:** The detail screen showed a sample work order when the real one was missing; the list read fields the server never sent, so most columns were blank; Start, Pause and Complete did nothing
- **Operational impact:** The module could not be used
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Browser: 10 work order checks
- **First recorded in:** qa/engineering-quality-findings.md

### M-008 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Schedule screen
- **Category:** Functional
- **Source file or endpoint:** Browser; Sweep 19 (jobs by day)
- **Evidence:** Browser; Sweep 19 (jobs by day)
- **Expected:** The real work centers and the jobs scheduled that day
- **Actual:** Always showed generated work centers and random jobs, different on every load
- **Operational impact:** A scheduler was planning against fiction
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Browser: 4 checks. "Utilization" is now "Booked", worked out from the day's scheduled hours
- **First recorded in:** qa/engineering-quality-findings.md

### M-009 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Time tracking
- **Category:** Honesty
- **Source file or endpoint:** Code read; Browser
- **Evidence:** Code read; Browser
- **Expected:** An error and an empty report
- **Actual:** On any load error it filled the report with randomly generated hours under a small "Using demo data" note
- **Operational impact:** Invented hours could be exported and used for costing or pay
- **Affected dependencies:** None
- **Recommended correction:** Fixed; error path not exercised
- **Required tests:** A browser check that blocks the request and sees the error
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Browser opens the report; the generator is removed. The error path itself was not triggered in a test: NOT VERIFIED
- **First recorded in:** qa/engineering-quality-findings.md

### M-010 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Old operator screen (`/shop-floor`)
- **Category:** Functional
- **Source file or endpoint:** Code read; Browser
- **Evidence:** Code read; Browser
- **Expected:** The real shop floor
- **Actual:** A full operator kiosk on sample jobs: start, record output and report issue saved nothing
- **Operational impact:** An operator could record a shift of output into nothing
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** The address now opens the real shop floor (`/shopfloor`); the sample screen is deleted. Browser
- **First recorded in:** qa/engineering-quality-findings.md

### M-011 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Production quality (5 screens), Bills of material
- **Category:** Honesty
- **Source file or endpoint:** Browser
- **Evidence:** Browser
- **Expected:** Real data, or a clear notice
- **Actual:** Sample data presented as real; the BOM screen was hard-wired to samples
- **Operational impact:** Decisions made on invented quality figures
- **Affected dependencies:** Whether production quality (NCR, SPC, in-process inspection) and bills of material are built
- **Recommended correction:** Requires a business decision, then a build
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Manufacturing and processing.
- **Deferred: target phase:** Manufacturing and processing: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Whether production quality (NCR, SPC, in-process inspection) and bills of material are built
- **Deferred: acceptance criteria:** Real data, or a clear notice
- **Deferred: verification:** The screens read real data and the notice is removed
- **Required tests:** The screens read real data and the notice is removed
- **Assigned phase:** Manufacturing and processing
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/engineering-quality-findings.md

### M-012 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Frontend API layer
- **Category:** Maintainability
- **Source file or endpoint:** `qa/tools/api-contract.mjs`
- **Evidence:** `qa/tools/api-contract.mjs`
- **Expected:** No dead calls
- **Actual:** 73 calls in `api/workCenters.js`, `jobs.js`, `workOrders.js`, `boms.js` and `batches.js` had no server route or no caller
- **Operational impact:** Misleads the next developer
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Removed; the frontend builds
- **First recorded in:** qa/engineering-quality-findings.md

### M-013 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Jobs list
- **Category:** Honesty
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Say the database is not configured
- **Actual:** With no database configured the server answered with a sample job
- **Operational impact:** Small: the hosted site always has a database
- **Affected dependencies:** None
- **Recommended correction:** Accepted: low risk, cannot occur with a database configured
- **Required tests:** Not planned
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Now 503. No automated check (it needs a server with no database): NOT VERIFIED
- **First recorded in:** qa/engineering-quality-findings.md

### M-014 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Schedule, work order form
- **Category:** Honesty
- **Source file or endpoint:** Browser
- **Evidence:** Browser
- **Expected:** No claim the system cannot back
- **Actual:** The schedule claimed to be "AI-optimized" and the work order form showed a fixed "AI tip" about tomorrow morning
- **Operational impact:** False confidence in a schedule nobody optimised
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Browser, two checks
- **First recorded in:** qa/engineering-quality-findings.md

### M-015 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** QC Inspections
- **Category:** Functional
- **Source file or endpoint:** Sweep 19; server log
- **Evidence:** Sweep 19; server log
- **Expected:** Answer with the inspection
- **Actual:** Starting an inspection saved it and then answered "Failed to create inspection" (an error in a log line). Found while writing Sweep 19
- **Operational impact:** The inspector sees a failure, presses again, and a second inspection is created
- **Assigned phase:** Manufacturing and processing
- **Status note:** Fixed
- **Verification evidence:** Sweep 19. Seen failing before the fix in this session. The faulty line came from the numbering change made earlier on this branch (f3db70a), so it was never live
- **First recorded in:** qa/engineering-quality-findings.md

### M-016 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Work orders
- **Category:** Operational gap
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Stock follows production
- **Actual:** Completing a work order changes no stock: the source item is not used up and the pieces made are not added
- **Operational impact:** Inventory is wrong after every work order unless someone corrects it by hand, and there is no way to (I-016)
- **Affected dependencies:** Whether coil work orders stay as a module beside jobs, and if so how completing one consumes and creates stock
- **Recommended correction:** Requires a business decision
- **Required tests:** A completion that moves stock in one transaction; a cycle in the simulation
- **Assigned phase:** Manufacturing and processing
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### M-017 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Jobs
- **Category:** Workflow
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** One rule for every route
- **Actual:** The job rules allow some backward moves (for example in process back to ordered); `/start` and `/complete` keep their own checks; the print hook runs on some status routes and not others
- **Operational impact:** Inconsistent behaviour between screens
- **Affected dependencies:** Which backward moves a job may make
- **Recommended correction:** Requires a business decision
- **Required tests:** One move table used by every route; unit tests
- **Assigned phase:** Manufacturing and processing
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### M-018 · P2 · IN PROGRESS

- **Discovered:** 2026-11-13
- **Module:** Help manual
- **Category:** Documentation
- **Source file or endpoint:** Screen read
- **Evidence:** Screen read
- **Expected:** The manual matches the screens
- **Actual:** The pages for time tracking and the order board described features that do not exist (clock in and out, timesheet approval, an order panel)
- **Operational impact:** Staff trained on steps that are not there
- **Affected dependencies:** None
- **Recommended correction:** Assigned to Workstream 6
- **Required tests:** Every manual page read against its screen
- **Assigned phase:** Manufacturing and processing
- **Status note:** Partly fixed
- **First recorded in:** qa/engineering-quality-findings.md

### S-001 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Counter (POS session)
- **Category:** Correctness
- **Source file or endpoint:** Code read, `POSPricingService.js`; Sweep 13 on the old code
- **Evidence:** Code read, `POSPricingService.js`; Sweep 13 on the old code
- **Expected:** The catalog price for that customer
- **Actual:** Priced every product at one placeholder figure, $54.88 per cwt
- **Operational impact:** Any sale through this path was mispriced
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13, sim check "line is the catalog list price"
- **First recorded in:** qa/engineering-quality-findings.md

### S-002 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Pricing
- **Category:** Correctness
- **Source file or endpoint:** Sweep 13: 16 of 21 checks failed on the code before this workstream
- **Evidence:** Sweep 13: 16 of 21 checks failed on the code before this workstream
- **Expected:** One customer, one price in every channel
- **Actual:** A tier customer got the tier price only in the online store. The order entry lookup compared the wrong codes, and tier start and end dates were ignored
- **Operational impact:** Staff quoted list price to contract customers, or contract price after a tier expired
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** One shared rule (`lib/priceRules.js`, `lib/customerPricing.js`), 8 unit tests, Sweep 13
- **First recorded in:** qa/engineering-quality-findings.md

### S-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Online store
- **Category:** Security
- **Source file or endpoint:** Code read, `routes/ecom.js`
- **Evidence:** Code read, `routes/ecom.js`
- **Expected:** The server decides the level from the login
- **Actual:** The price endpoint used the price level sent by the browser
- **Operational impact:** A customer could ask for another level's prices
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13
- **First recorded in:** qa/engineering-quality-findings.md

### S-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Counter
- **Category:** Control
- **Source file or endpoint:** Code read, `POSWorkflowService.js`, `routes/pos.js`
- **Evidence:** Code read, `POSWorkflowService.js`, `routes/pos.js`
- **Expected:** Bounded discount, approval by a signed-in manager
- **Actual:** Discounts had no bounds and approval was a typed PIN
- **Operational impact:** Unlimited discount with no accountable approver
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13
- **First recorded in:** qa/engineering-quality-findings.md

### S-005 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Sales Rep Mobile
- **Category:** Correctness
- **Source file or endpoint:** Code read, five pages
- **Evidence:** Code read, five pages
- **Expected:** Real data, real save, honest failure
- **Actual:** Customers, products, stock and orders were invented in the browser; submit saved nothing; an "offline queue" did not exist
- **Operational impact:** A rep's order was lost while the screen said it was sent
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Browser, 11 checks
- **First recorded in:** qa/engineering-quality-findings.md

### S-006 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry
- **Category:** Data integrity
- **Source file or endpoint:** Sweep 14: 21 of the first 30 checks failed on the code before this workstream; a failed edit deleted every line of the test order
- **Evidence:** Sweep 14: 21 of the first 30 checks failed on the code before this workstream; a failed edit deleted every line of the test order
- **Expected:** Same rules as the rest of the order system
- **Actual:** The order entry API accepted zero or negative quantities and prices, recorded the wrong user, could change an order in any status, and replaced lines outside a transaction
- **Operational impact:** Corrupt orders from the screen staff use most
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 14, sim scenario "entry-screen" (2 of every 7 scenarios)
- **First recorded in:** qa/engineering-quality-findings.md

### S-007 · P0 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry, Retail POS
- **Category:** Money
- **Source file or endpoint:** Code read; Sweep 14
- **Evidence:** Code read; Sweep 14
- **Expected:** Tax saved on the order by a stated rule
- **Actual:** Showed 6% tax on the screen and saved no tax on the order
- **Operational impact:** Tax shown to the customer was never billed
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Rule 27, decided by the owner 2026-11-13: selling branch state. Sweep 14, unit tests
- **First recorded in:** qa/engineering-quality-findings.md

### S-008 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Order entry
- **Category:** Consistency
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Branches come from the database
- **Actual:** Two entry screens list four Michigan branches in code
- **Operational impact:** The other branches cannot be picked there
- **Affected dependencies:** S-010
- **Recommended correction:** Deferred with justification: the branch list belongs with the promise engine (S-010), which reads the same list
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Sales and customer operations.
- **Deferred: target phase:** Sales and customer operations: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** S-010
- **Deferred: acceptance criteria:** Branches come from the database
- **Deferred: verification:** Both entry screens list the branches in the database; Browser check
- **Required tests:** Both entry screens list the branches in the database; Browser check
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-009 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Remnants
- **Category:** Business rule
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** A rule the owner sets
- **Actual:** Remnant discount is fixed in code at 15% and 25% on two screens
- **Operational impact:** Cannot be changed without a release
- **Affected dependencies:** The remnant discount rule and who may change it
- **Recommended correction:** Requires a business decision
- **Required tests:** Discount read from a setting; sweep check
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-010 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Delivery promise
- **Category:** Correctness
- **Source file or endpoint:** Code read; `api-contract.md`
- **Evidence:** Code read; `api-contract.md`
- **Expected:** A promise from real capacity and stock, or none
- **Actual:** Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout
- **Operational impact:** Customers may be shown a date nobody computed
- **Affected dependencies:** Cutoff times, capacity rules, whether to show a date at web checkout before the engine exists
- **Recommended correction:** Requires a business decision, then a build
- **Required tests:** Promise dates come from a server route; contract scan shows no promise call without a route
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-011 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Overrides
- **Category:** Auditability
- **Source file or endpoint:** Code read, `overrideApi.js`
- **Evidence:** Code read, `overrideApi.js`
- **Expected:** Saved on the server, attributed, listed on the order
- **Actual:** Override records were kept only in the browser
- **Operational impact:** No record of who overrode what
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** `routes/overrides.js`, Sweep 14
- **First recorded in:** qa/engineering-quality-findings.md

### S-012 (D-036) · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Sales Dashboard
- **Category:** Correctness
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Counted from the database, or "Not available"
- **Actual:** Fixed sample figures
- **Operational impact:** Managers read invented numbers
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** `routes/salesDashboard.js`, Sweep 14, Browser
- **First recorded in:** qa/engineering-quality-findings.md

### S-013 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Customers
- **Category:** Correctness
- **Source file or endpoint:** Code read; Sweep 13
- **Evidence:** Code read; Sweep 13
- **Expected:** The screen sets the tier prices use
- **Actual:** The Pricing Tier chosen on the customer screen was stored where no price read it, and no screen set the real tier
- **Operational impact:** Setting a tier had no effect
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13: manager sets, price follows; clerk refused; audit entry
- **First recorded in:** qa/engineering-quality-findings.md

### S-014 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Customers
- **Category:** Correctness
- **Source file or endpoint:** Server log, `PrismaClientValidationError`; Sweep 13 on the previous commit
- **Evidence:** Server log, `PrismaClientValidationError`; Sweep 13 on the previous commit
- **Expected:** The save works
- **Actual:** Saving customer preferences always failed with a server error: the save named two fields the database does not have
- **Operational impact:** No customer preference could ever be saved
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13 "tolerances are saved"
- **First recorded in:** qa/engineering-quality-findings.md

### S-015 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Customers
- **Category:** Security
- **Source file or endpoint:** Probe as a customer login; Sweep 13 on the previous commit
- **Evidence:** Probe as a customer login; Sweep 13 on the previous commit
- **Expected:** Staff-only fields stay with staff
- **Actual:** A customer login could read the staff-only notes, contract notes, credit limit and discount on its own account
- **Operational impact:** Internal remarks visible to the customer
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13
- **First recorded in:** qa/engineering-quality-findings.md

### S-016 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Customers
- **Category:** Data integrity
- **Source file or endpoint:** Code read, `routes/customers.js`; Sweep 13 on the previous commit (server error, self-parent accepted)
- **Evidence:** Code read, `routes/customers.js`; Sweep 13 on the previous commit (server error, self-parent accepted)
- **Expected:** Only editable fields; tax status changes recorded
- **Actual:** Creating or editing a customer wrote whatever fields the request held; a change of tax-exempt status left no record
- **Operational impact:** A request could rewrite codes or ids; no trail for tax exemption
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Sweep 13, 6 checks
- **First recorded in:** qa/engineering-quality-findings.md

### S-017 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Pricing
- **Category:** Correctness
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** The real price book
- **Actual:** The Pricing screen showed sample prices, surcharges and quotes with buttons that did nothing
- **Operational impact:** Invented prices on a screen named Pricing
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** `/api/pricing/overview`, `/api/pricing/price-list`, Sweep 13, Browser
- **First recorded in:** qa/engineering-quality-findings.md

### S-018 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Pricing
- **Category:** Operational gap
- **Source file or endpoint:** Screen and route review
- **Evidence:** Screen and route review
- **Expected:** A controlled, recorded way to change one
- **Actual:** No screen could change a list price
- **Operational impact:** Price changes needed a developer
- **Affected dependencies:** None
- **Recommended correction:** Fixed, awaiting the owner's confirmation of rule 30
- **Required tests:** Owner confirms who may change a list price
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed
- **Verification evidence:** Managers only, audit entry with old and new price. Rule 30, to confirm. Sweep 13, Browser
- **First recorded in:** qa/engineering-quality-findings.md

### S-019 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Credit
- **Category:** Control
- **Source file or endpoint:** Code read, `POSValidationService.js`, order routes
- **Evidence:** Code read, `POSValidationService.js`, order routes
- **Expected:** A stated rule: block, warn or neither
- **Actual:** Credit limits are stored and never checked. The counter's credit guards read fields that do not exist
- **Operational impact:** Orders can exceed any limit
- **Affected dependencies:** Order saved on hold with a warning; manager releases; each release recorded (rule 32)
- **Recommended correction:** Fixed in this workstream
- **Required tests:** Sweep section 16: 22 checks, 17 fail on the previous code. 8 unit tests. 6 browser checks
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed (rule 32)
- **Verification evidence:** Unit tests, sweep section 16, browser checks
- **First recorded in:** qa/engineering-quality-findings.md

### S-020 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Customers
- **Category:** Consistency
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** A field either works or is not offered
- **Actual:** "Default Discount %" on the customer screen is applied nowhere
- **Operational impact:** Staff believe a discount is set
- **Affected dependencies:** Whether a per-customer discount stacks with the tier
- **Recommended correction:** Requires a business decision
- **Required tests:** Field applied to prices and tested, or removed
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-021 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Order Hub
- **Category:** Duplication
- **Source file or endpoint:** Route and menu review
- **Evidence:** Route and menu review
- **Expected:** One place for one job
- **Actual:** A second RFQ console, not in the menu, beside RFQs & Quotes
- **Operational impact:** Two lists of the same work
- **Affected dependencies:** Retire Order Hub or merge it
- **Recommended correction:** Requires a business decision
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Sales and customer operations.
- **Deferred: target phase:** Sales and customer operations: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Retire Order Hub or merge it
- **Deferred: acceptance criteria:** One place for one job
- **Deferred: verification:** One RFQ screen; route removed or linked
- **Required tests:** One RFQ screen; route removed or linked
- **Assigned phase:** Sales and customer operations
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice.
- **First recorded in:** qa/engineering-quality-findings.md

### S-022 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Counter
- **Category:** Dead code
- **Source file or endpoint:** Contract scan, code read
- **Evidence:** Contract scan, code read
- **Expected:** Unused paths are removed or finished
- **Actual:** The POS session API is called by no screen and saves no tax
- **Operational impact:** A second, untested way to sell
- **Affected dependencies:** S-026
- **Recommended correction:** Assigned to Workstream 6
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Sales and customer operations.
- **Deferred: target phase:** Sales and customer operations: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** S-026
- **Deferred: acceptance criteria:** Unused paths are removed or finished
- **Deferred: verification:** Contract scan and route inventory show no unused sales route
- **Required tests:** Contract scan and route inventory show no unused sales route
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-023 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Inventory search
- **Category:** Confidentiality
- **Source file or endpoint:** Reply of `/api/inventory/search`
- **Evidence:** Reply of `/api/inventory/search`
- **Expected:** Cost only to roles that need it
- **Actual:** Stock search returns unit cost to sales screens
- **Operational impact:** Cost visible on a rep's phone
- **Affected dependencies:** None
- **Recommended correction:** Fixed in Workstream 3 (I-009)
- **Required tests:** Sweep section 15: cost absent for sales roles on stock items, stock search and heat trace
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed (I-009)
- **Verification evidence:** Customer logins are refused this route (probe: 403)
- **First recorded in:** qa/engineering-quality-findings.md

### S-024 · P2 · IN PROGRESS

- **Discovered:** 2026-11-13
- **Module:** Help manual
- **Category:** Accuracy
- **Source file or endpoint:** Manual read against the screens
- **Evidence:** Manual read against the screens
- **Expected:** The manual matches the screens
- **Actual:** Pricing, Sales Dashboard, Sales Rep Mobile and customer pages described tabs, contracts, signatures, visit logs and offline use that do not exist
- **Operational impact:** Staff follow steps that are not there
- **Affected dependencies:** None
- **Recommended correction:** Assigned to Workstreams 3 to 6, per module
- **Required tests:** Each module's manual pages checked against its screens
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed in part
- **First recorded in:** qa/engineering-quality-findings.md

### S-025 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Products
- **Category:** Data integrity
- **Source file or endpoint:** Code read, `routes/products.js`
- **Evidence:** Code read, `routes/products.js`
- **Expected:** Only editable fields
- **Actual:** Creating or editing a product writes whatever fields the request holds
- **Operational impact:** A request could rewrite any product field
- **Affected dependencies:** None
- **Recommended correction:** Fixed in Workstream 3 (I-004)
- **Required tests:** Sweep section 17: unknown fields ignored on products, grades and heats
- **Assigned phase:** Sales and customer operations
- **Status note:** Fixed (I-004)
- **Verification evidence:** Sweep section 17
- **First recorded in:** qa/engineering-quality-findings.md

### S-026 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Sales screens
- **Category:** Contract
- **Source file or endpoint:** `api-contract.md`
- **Evidence:** `api-contract.md`
- **Expected:** No call without a route
- **Actual:** Screen code calls 18 sales routes that do not exist: 13 under `/api/pricing` in `api/pricing.js`, 3 will-call, 2 split-shipment
- **Operational impact:** Buttons that fail when pressed
- **Affected dependencies:** S-010
- **Recommended correction:** Assigned to Workstream 5 (will-call, split shipment) and 6 (`api/pricing.js`)
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Sales and customer operations.
- **Deferred: target phase:** Sales and customer operations: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** S-010
- **Deferred: acceptance criteria:** No call without a route
- **Deferred: verification:** `api-contract.md` shows 0 sales calls without a route
- **Required tests:** `api-contract.md` shows 0 sales calls without a route
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-027 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Quotes
- **Category:** Efficiency
- **Source file or endpoint:** Code read, `routes/quotes.js`
- **Evidence:** Code read, `routes/quotes.js`
- **Expected:** The customer's price is offered when the product is known
- **Actual:** Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products
- **Operational impact:** Slow quoting and prices that differ from the price book
- **Affected dependencies:** Whether RFQ lines should pick products
- **Recommended correction:** Requires a business decision
- **Required tests:** Quote line offers the customer's price; sweep check
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### U-001 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Sales Dashboard
- **Category:** User experience
- **Source file or endpoint:** Sales Dashboard
- **Actual:** Showed fixed sample figures (D-036)
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (S-012): counted figures, "Not available" where nothing is measured
- **Verification evidence:** Fixed (S-012): counted figures, "Not available" where nothing is measured
- **First recorded in:** qa/ux-improvement-register.md

### U-002 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Order Hub RFQ pages
- **Category:** User experience
- **Source file or endpoint:** Order Hub RFQ pages
- **Actual:** A second RFQ console beside RFQs & Quotes
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice.
- **First recorded in:** qa/ux-improvement-register.md

### U-003 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Margin widget
- **Category:** User experience
- **Source file or endpoint:** Margin widget
- **Actual:** Showed invented margin figures
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (E-006)
- **Verification evidence:** Fixed (E-006)
- **First recorded in:** qa/ux-improvement-register.md

### U-004 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Several secondary screens
- **Category:** User experience
- **Source file or endpoint:** Several secondary screens
- **Actual:** Call server routes that do not exist (D-020)
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open; 18 are sales calls (S-026)
- **First recorded in:** qa/ux-improvement-register.md

### U-005 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry, Retail POS, order detail
- **Category:** User experience
- **Source file or endpoint:** Order entry, Retail POS, order detail
- **Actual:** A failed save said only "failed"
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed: the screen shows the server's reason
- **Verification evidence:** Fixed: the screen shows the server's reason
- **First recorded in:** qa/ux-improvement-register.md

### U-006 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry
- **Category:** User experience
- **Source file or endpoint:** Order entry
- **Actual:** Showed a tax figure that was not saved
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (S-007)
- **Verification evidence:** Fixed (S-007)
- **First recorded in:** qa/ux-improvement-register.md

### U-007 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Sales Rep Mobile
- **Category:** User experience
- **Source file or endpoint:** Sales Rep Mobile
- **Actual:** Sample customers, products and orders; "submitted" when nothing was saved
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (S-005)
- **Verification evidence:** Fixed (S-005)
- **First recorded in:** qa/ux-improvement-register.md

### U-008 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Sales Rep Mobile, delivery preview
- **Category:** User experience
- **Source file or endpoint:** Sales Rep Mobile, delivery preview
- **Actual:** A date nobody computed
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Caution notice added; engine open (S-010)
- **First recorded in:** qa/ux-improvement-register.md

### U-009 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Customers > Preferences
- **Category:** User experience
- **Source file or endpoint:** Customers > Preferences
- **Actual:** Save always failed; Pricing Tier did nothing
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (S-013, S-014). Helper text says who can change the tier
- **Verification evidence:** Fixed (S-013, S-014). Helper text says who can change the tier
- **First recorded in:** qa/ux-improvement-register.md

### U-010 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Pricing
- **Category:** User experience
- **Source file or endpoint:** Pricing
- **Actual:** Sample rows and dead buttons; not in the menu
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (S-017, S-018): real price book, in the menu under Sales & Customers
- **Verification evidence:** Fixed (S-017, S-018): real price book, in the menu under Sales & Customers
- **First recorded in:** qa/ux-improvement-register.md

### U-011 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Order entry, Retail POS
- **Category:** User experience
- **Source file or endpoint:** Order entry, Retail POS
- **Actual:** Branch list fixed at four Michigan branches
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (S-008)
- **First recorded in:** qa/ux-improvement-register.md

### U-012 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Customers > Preferences
- **Category:** User experience
- **Source file or endpoint:** Customers > Preferences
- **Actual:** "Default Discount %" is offered and applied nowhere
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open: decision S-020
- **First recorded in:** qa/ux-improvement-register.md

### U-013 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Help manual, sales pages
- **Category:** User experience
- **Source file or endpoint:** Help manual, sales pages
- **Actual:** Described features that do not exist
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed for pricing, dashboard, mobile and customers (S-024)
- **Verification evidence:** Fixed for pricing, dashboard, mobile and customers (S-024)
- **First recorded in:** qa/ux-improvement-register.md

### U-014 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Inventory (stock items), Heats
- **Category:** User experience
- **Source file or endpoint:** Inventory (stock items), Heats
- **Actual:** Sample rows on every screen
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (I-001, I-002): real records, server-side search, honest empty states
- **Verification evidence:** Fixed (I-001, I-002): real records, server-side search, honest empty states
- **First recorded in:** qa/ux-improvement-register.md

### U-015 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry, stock picker
- **Category:** User experience
- **Source file or endpoint:** Order entry, stock picker
- **Actual:** Showed our cost and priced the line at it
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (I-003): list price
- **Verification evidence:** Fixed (I-003): list price
- **First recorded in:** qa/ux-improvement-register.md

### U-016 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock upload
- **Category:** User experience
- **Source file or endpoint:** Stock upload
- **Actual:** Said "Successfully uploaded N items" whatever happened
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (I-005): the count saved, and each failed row with its reason
- **Verification evidence:** Fixed (I-005): the count saved, and each failed row with its reason
- **First recorded in:** qa/ux-improvement-register.md

### U-017 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Receiving
- **Category:** User experience
- **Source file or endpoint:** Receiving
- **Actual:** Sample deliveries; the form saved nothing
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (I-006). Says plainly that expected deliveries need purchase orders (I-007)
- **Verification evidence:** Fixed (I-006). Says plainly that expected deliveries need purchase orders (I-007)
- **First recorded in:** qa/ux-improvement-register.md

### U-018 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Stock item
- **Category:** User experience
- **Source file or endpoint:** Stock item
- **Actual:** A hold could not be released; no way to move an item
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (I-008, I-014): Release hold and Move
- **Verification evidence:** Fixed (I-008, I-014): Release hold and Move
- **First recorded in:** qa/ux-improvement-register.md

### U-019 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Supplier quality, six screens
- **Category:** User experience
- **Source file or endpoint:** Supplier quality, six screens
- **Actual:** Invented data presented as real
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/ux-improvement-register.md

### U-020 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Menu
- **Category:** User experience
- **Source file or endpoint:** Menu
- **Actual:** "Inventory" and "Units" were two different stock lists
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice.
- **First recorded in:** qa/ux-improvement-register.md

### U-021 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Category:** User experience
- **Source file or endpoint:** Orders
- **Actual:** No sign that an order was over the credit limit
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (rule 32): warning on entry, a Credit Holds list, Release for managers
- **Verification evidence:** Fixed (rule 32): warning on entry, a Credit Holds list, Release for managers
- **First recorded in:** qa/ux-improvement-register.md

### U-022 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Receiving
- **Category:** User experience
- **Source file or endpoint:** Receiving
- **Actual:** A heat must be added before its stock, one at a time
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (I-017)
- **First recorded in:** qa/ux-improvement-register.md

### U-023 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Job screen
- **Category:** User experience
- **Source file or endpoint:** Job screen
- **Actual:** A sample job for every job; status dialog saved nothing
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (M-001): real job, real history with names, a status change that saves and explains a refusal
- **Verification evidence:** Fixed (M-001): real job, real history with names, a status change that saves and explains a refusal
- **First recorded in:** qa/ux-improvement-register.md

### U-024 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order boards, Schedule
- **Category:** User experience
- **Source file or endpoint:** Order boards, Schedule
- **Actual:** Clicking a job that was past planning did nothing
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed: opens the job screen
- **Verification evidence:** Fixed: opens the job screen
- **First recorded in:** qa/ux-improvement-register.md

### U-025 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Schedule
- **Category:** User experience
- **Source file or endpoint:** Schedule
- **Actual:** Random work centers and jobs; "AI-optimized"
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (M-008, M-014): the real day; a notice for jobs with no work center
- **Verification evidence:** Fixed (M-008, M-014): the real day; a notice for jobs with no work center
- **First recorded in:** qa/ux-improvement-register.md

### U-026 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Time tracking
- **Category:** User experience
- **Source file or endpoint:** Time tracking
- **Actual:** Random hours shown when loading failed
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (M-009)
- **Verification evidence:** Fixed (M-009)
- **First recorded in:** qa/ux-improvement-register.md

### U-027 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Work orders
- **Category:** User experience
- **Source file or endpoint:** Work orders
- **Actual:** Blank columns, a sample work order, buttons that did nothing
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (M-007): list with server search, detail with Release, Start, Complete (weights) and Cancel, and history
- **Verification evidence:** Fixed (M-007): list with server search, detail with Release, Start, Complete (weights) and Cancel, and history
- **First recorded in:** qa/ux-improvement-register.md

### U-028 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Old operator screen
- **Category:** User experience
- **Source file or endpoint:** Old operator screen
- **Actual:** Recorded output into nothing
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Removed (M-010): opens the real shop floor
- **First recorded in:** qa/ux-improvement-register.md

### U-029 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Production quality, BOMs
- **Category:** User experience
- **Source file or endpoint:** Production quality, BOMs
- **Actual:** Invented data presented as real
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/ux-improvement-register.md

### U-030 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** QC Inspections
- **Category:** User experience
- **Source file or endpoint:** QC Inspections
- **Actual:** "Failed to create inspection" although it was created
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (M-015)
- **Verification evidence:** Fixed (M-015)
- **First recorded in:** qa/ux-improvement-register.md

### U-031 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipping
- **Category:** User experience
- **Source file or endpoint:** Shipping
- **Actual:** Menu item showed invented shipments; no way to ship on screen
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (F-002): real list, New shipment, Dispatch, Mark delivered
- **Verification evidence:** Fixed (F-002): real list, New shipment, Dispatch, Mark delivered
- **First recorded in:** qa/ux-improvement-register.md

### U-032 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipment
- **Category:** User experience
- **Source file or endpoint:** Shipment
- **Actual:** No one could see who dispatched or delivered
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (F-004): history table with names
- **Verification evidence:** Fixed (F-004): history table with names
- **First recorded in:** qa/ux-improvement-register.md

### U-033 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Invoices
- **Category:** User experience
- **Source file or endpoint:** Invoices
- **Actual:** No one could see who took a payment or issued a credit
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (F-006): history on the invoice
- **Verification evidence:** Fixed (F-006): history on the invoice
- **First recorded in:** qa/ux-improvement-register.md

### U-034 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** All Orders
- **Category:** User experience
- **Source file or endpoint:** All Orders
- **Actual:** Tax shown as 0 and total as subtotal; sample orders on error
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (F-007)
- **Verification evidence:** Fixed (F-007)
- **First recorded in:** qa/ux-improvement-register.md

### U-035 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Freight and logistics
- **Category:** User experience
- **Source file or endpoint:** Freight and logistics
- **Actual:** Invented routes, rates and tracking presented as real
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/ux-improvement-register.md

### U-036 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Shipment
- **Category:** User experience
- **Source file or endpoint:** Shipment
- **Actual:** No button to print a bill of lading or packing list
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (F-011)
- **First recorded in:** qa/ux-improvement-register.md

### U-037 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Safety, maintenance, training, contractors, customer quality, executive, provenance
- **Category:** User experience
- **Source file or endpoint:** Safety, maintenance, training, contractors, customer quality, executive, provenance
- **Actual:** Invented data presented as real
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/ux-improvement-register.md

### U-038 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Role dashboard
- **Category:** User experience
- **Source file or endpoint:** Role dashboard
- **Actual:** Invented figures when the server failed
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (X-003): error and retry
- **Verification evidence:** Fixed (X-003): error and retry
- **First recorded in:** qa/ux-improvement-register.md

### U-039 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Role dashboard, order board
- **Category:** User experience
- **Source file or endpoint:** Role dashboard, order board
- **Actual:** Assistants that made up answers
- **Assigned phase:** Phase 9: user experience
- **Status note:** Fixed (X-004)
- **Verification evidence:** Fixed (X-004)
- **First recorded in:** qa/ux-improvement-register.md

### U-040 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Menu
- **Category:** User experience
- **Source file or endpoint:** Menu
- **Actual:** Lists 58 sample screens beside the real ones
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (X-009)
- **First recorded in:** qa/ux-improvement-register.md

### U-041 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Checkout, order entry
- **Category:** User experience
- **Source file or endpoint:** Checkout, order entry
- **Actual:** Promise dates and branch suggestions from invented rules
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Phase 9: user experience.
- **Deferred: target phase:** Phase 9: user experience
- **Deferred: required correction:** See "Recommended correction".
- **Deferred: dependencies:** None recorded.
- **Deferred: acceptance criteria:** The behaviour under "Expected".
- **Deferred: verification:** A success-path test and a refusal test for the corrected behaviour.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (X-007)
- **First recorded in:** qa/ux-improvement-register.md

### X-001 · P0 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Safety (13 screens, on the menu)
- **Category:** Mock data
- **Source file or endpoint:** Audit; code read
- **Evidence:** Audit; code read
- **Expected:** Real records, or a clear label
- **Actual:** Incidents, inspections, permits, training, observations, corrective actions and stop work all showed invented records. The calls to the server are commented out in the code. Nothing entered was saved
- **Operational impact:** A safety incident or a stop-work order entered here is lost, and the lists shown are not the company's
- **Affected dependencies:** Build or remove: safety, maintenance, training, contractors, customer quality, executive, production quality, supplier quality, freight, BOMs, provenance
- **Recommended correction:** Mitigated; requires a business decision per module
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Enterprise experience.
- **Deferred: target phase:** Enterprise experience: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Build or remove: safety, maintenance, training, contractors, customer quality, executive, production quality, supplier quality, freight, BOMs, provenance
- **Deferred: acceptance criteria:** Real records, or a clear label
- **Deferred: verification:** The audit shows the screen as REAL, or the route is gone
- **Required tests:** The audit shows the screen as REAL, or the route is gone
- **Assigned phase:** Enterprise experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/engineering-quality-findings.md

### X-002 · P0 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup
- **Category:** Mock data
- **Source file or endpoint:** Audit; code read
- **Evidence:** Audit; code read
- **Expected:** Real records, or a clear label
- **Actual:** 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or item typed in
- **Operational impact:** Staff could act on, or show a customer, records that do not exist
- **Affected dependencies:** Build or remove: safety, maintenance, training, contractors, customer quality, executive, production quality, supplier quality, freight, BOMs, provenance
- **Recommended correction:** Mitigated; requires a business decision per module
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Enterprise experience.
- **Deferred: target phase:** Enterprise experience: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Build or remove: safety, maintenance, training, contractors, customer quality, executive, production quality, supplier quality, freight, BOMs, provenance
- **Deferred: acceptance criteria:** Real records, or a clear label
- **Deferred: verification:** The audit shows the screen as REAL, or the route is gone
- **Required tests:** The audit shows the screen as REAL, or the route is gone
- **Assigned phase:** Enterprise experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/engineering-quality-findings.md

### X-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Role dashboard
- **Category:** Mock data
- **Source file or endpoint:** Code read of nine service files
- **Evidence:** Code read of nine service files
- **Expected:** An error, with a retry
- **Actual:** When a figure could not be loaded (margin, shipping, forecast, work centers, exceptions, late-risk jobs, RFQ funnel, stock risk, transfers) the dashboard silently showed invented numbers, for example a 28.5 percent margin
- **Operational impact:** A manager reads invented margin or late-risk figures on a bad day and cannot tell
- **Assigned phase:** Enterprise experience
- **Status note:** Fixed
- **Verification evidence:** The services raise an error and the widget shows "Not available right now". Browser: 2 checks with the server calls failed on purpose
- **First recorded in:** qa/engineering-quality-findings.md

### X-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Role dashboard assistant; order board assistant
- **Category:** False claim
- **Source file or endpoint:** Code read; both server addresses answer 404
- **Evidence:** Code read; both server addresses answer 404
- **Expected:** No invented answers; no AI claim without one
- **Actual:** The dashboard's "Ops Assistant" has no server behind it and answered every question with invented figures ("Utilization at 85%, SLA compliance at 94%"). The order board's "AI Assistant" panel made up schedule analysis, conflicts and a forecast from fixed text. Job card hints from four fixed rules were titled "AI Insights"
- **Operational impact:** Decisions made on invented analysis
- **Assigned phase:** Enterprise experience
- **Status note:** Fixed
- **Verification evidence:** The dashboard assistant says it is not connected. The board panel is removed; the hints are titled "Hints". Browser: 2. The assistant in the top bar is a different feature that calls the server; it was not examined
- **First recorded in:** qa/engineering-quality-findings.md

### X-005 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Two dashboards
- **Category:** Wrong label
- **Source file or endpoint:** Code read
- **Evidence:** Code read
- **Expected:** Say what is true
- **Actual:** Compression Metrics and Demand Shaping read real data and said "Using mock data" in their footer
- **Operational impact:** Real figures distrusted
- **Assigned phase:** Enterprise experience
- **Status note:** Fixed
- **Verification evidence:** Text removed
- **First recorded in:** qa/engineering-quality-findings.md

### X-006 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Frontend build (E-016, F-012)
- **Category:** Tooling
- **Source file or endpoint:** Seen in Workstream 5
- **Evidence:** Seen in Workstream 5
- **Expected:** A check that rejects an undefined name
- **Actual:** No lint step. A stray word passed the build and broke every screen
- **Operational impact:** A broken release passes the build
- **Assigned phase:** Enterprise experience
- **Status note:** Fixed
- **Verification evidence:** ESLint with `no-undef` and three JSX rules; `npm run lint`; a frontend job in the pull-request workflow that runs the audit and the lint. Shown failing on the F-012 defect, passing now. Three development-only packages added (eslint, eslint-plugin-react, globals): they are not part of what is served. The owner can remove them
- **First recorded in:** qa/engineering-quality-findings.md

### X-007 · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Order entry, web checkout, online settings
- **Category:** Mock rules
- **Source file or endpoint:** Audit (4 screens marked MIXED); code read: `cutoffRulesApi`, `promiseApi`, `branchComparisonApi`, `splitShipmentApi`, `useFulfillmentOverride`
- **Evidence:** Audit (4 screens marked MIXED); code read: `cutoffRulesApi`, `promiseApi`, `branchComparisonApi`, `splitShipmentApi`, `useFulfillmentOverride`
- **Expected:** Rules stored on the server and set by the business
- **Actual:** Order cut-off times, delivery promise dates, the "ship from another branch" comparison (with invented branch stock), the fulfilment override and split shipments run from sample rules built into the browser. No server route exists for any of them. Cut-off times changed under Admin, Online Settings are lost on reload
- **Operational impact:** A customer or a clerk is shown a promise date and a branch choice that rest on invented rules and stock
- **Affected dependencies:** Cut-off times per branch, how a promise date is worked out, whether another branch may be offered
- **Recommended correction:** Requires a business decision, then a build
- **Required tests:** Server routes; the audit shows the four screens as REAL; a sweep section
- **Assigned phase:** Enterprise experience
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### X-008 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Counter (`/pos`), will-call screens
- **Category:** Mock data
- **Source file or endpoint:** Audit; code read
- **Evidence:** Audit; code read
- **Expected:** Real orders or removal
- **Actual:** The will-call pickup queue and completion screens use sample orders. The screen is not on the menu
- **Operational impact:** Low while it is off the menu
- **Affected dependencies:** Whether will call is used
- **Recommended correction:** Requires a business decision
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Enterprise experience.
- **Deferred: target phase:** Enterprise experience: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Whether will call is used
- **Deferred: acceptance criteria:** Real orders or removal
- **Deferred: verification:** Built on real orders, or removed
- **Required tests:** Built on real orders, or removed
- **Assigned phase:** Enterprise experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/engineering-quality-findings.md

### X-009 · P1 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Scale of sample screens
- **Category:** Product
- **Source file or endpoint:** `qa/screen-audit.md`
- **Evidence:** `qa/screen-audit.md`
- **Expected:** To be decided
- **Actual:** 58 of 143 screens are samples. All now say so
- **Operational impact:** The menu promises far more than the product does
- **Affected dependencies:** Build or remove: safety, maintenance, training, contractors, customer quality, executive, production quality, supplier quality, freight, BOMs, provenance
- **Recommended correction:** Mitigated; requires a business decision per module
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Enterprise experience.
- **Deferred: target phase:** Enterprise experience: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** Build or remove: safety, maintenance, training, contractors, customer quality, executive, production quality, supplier quality, freight, BOMs, provenance
- **Deferred: acceptance criteria:** To be decided
- **Deferred: verification:** The audit shows the screen as REAL, or the route is gone
- **Required tests:** The audit shows the screen as REAL, or the route is gone
- **Assigned phase:** Enterprise experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work.
- **First recorded in:** qa/engineering-quality-findings.md

### X-010 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Help manual
- **Category:** Documentation
- **Source file or endpoint:** Not examined line by line
- **Evidence:** Not examined line by line
- **Expected:** The manual matches the screens
- **Actual:** Only the pages rewritten in Workstreams 2 to 5 were checked against their screens. The pages for sample modules (safety, maintenance, training and others) still describe them as working
- **Operational impact:** Staff trained on features that are samples
- **Affected dependencies:** The decisions above
- **Recommended correction:** Assigned
- **Deferred: reason:** Outside the scope of Phase 2 (architecture and code quality). It was assigned in Phase 1 to: Enterprise experience.
- **Deferred: target phase:** Enterprise experience: The phase the owner issues for that subject (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: dependencies:** The decisions above
- **Deferred: acceptance criteria:** The manual matches the screens
- **Deferred: verification:** Every manual page read against its screen
- **Required tests:** Every manual page read against its screen
- **Assigned phase:** Enterprise experience
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

