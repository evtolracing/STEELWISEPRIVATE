# Findings register

Generated 2026-11-16 by `qa/tools/excellence-docs.mjs` at commit 143cdcf. Do not edit by hand: change the source and rerun.

Source of truth: `findings.json` in this folder. Nothing is ever deleted from it. IDs are permanent: B = Phase 1 baseline; C = Phase 2 architecture review; E, S, I, M, F, X = the six earlier workstreams; D = the first audit; U = user-experience register. The older registers in `qa/` are kept as history.

Severity: P0 critical security, financial integrity, data corruption or outage risk. P1 essential workflow failure or significant operational risk. P2 functional, architectural, performance or maintainability deficiency. P3 minor.

## Counts

| Severity | All | Still open |
|---|---:|---:|
| P0 | 20 | 2 |
| P1 | 108 | 15 |
| P2 | 156 | 44 |
| P3 | 103 | 34 |
| Total | 388 | 96 |

| Status | Count |
|---|---:|
| VERIFIED FIXED | 291 |
| DEFERRED TO SPECIFIC PHASE | 60 |
| REQUIRES BUSINESS DECISION | 21 |
| IN PROGRESS | 6 |
| ACCEPTED RISK WITH APPROVAL | 5 |
| BLOCKED | 3 |
| NOT APPLICABLE | 1 |
| FIXED — NOT VERIFIED | 1 |

## Open findings, most severe first

| ID | Sev | Status | Module | What is wrong | Assigned to |
|---|---|---|---|---|---|
| N-024 | P4 | FIXED — NOT VERIFIED | Tests | Failed in the first hour of each week. | Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout |
| X-001 | P0 | DEFERRED TO SPECIFIC PHASE | Safety (13 screens, on the menu) | Incidents, inspections, permits, training, observations, corrective actions and stop work all showed invented records. The calls to the server are commented out in the code. Nothing entered was saved | Enterprise experience |
| X-002 | P0 | DEFERRED TO SPECIFIC PHASE | Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup | 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or item typed in | Enterprise experience |
| B-009 | P1 | IN PROGRESS | Second stock list, order hub, stop work | Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| B-016 | P1 | DEFERRED TO SPECIFIC PHASE | Testing | Order to cash is covered in depth. Outside it, most changing routes have no success-path test. | Testing phase; each phase for its own area |
| B-019 | P1 | BLOCKED | Platform | Everything happens only when someone opens a screen or presses a button. | Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication |
| E-011 | P1 | REQUIRES BUSINESS DECISION | Platform | Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high) | Phase 2: architecture and code quality |
| E-014 | P1 | DEFERRED TO SPECIFIC PHASE | Platform | The request rate limit counts per server instance | Phase 2: architecture and code quality |
| E-015 | P1 | ACCEPTED RISK WITH APPROVAL | Platform | No evidence that a backup has ever been restored | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| E-023 | P1 | DEFERRED TO SPECIFIC PHASE | Operations cockpit | `GET /api/ops-cockpit` loaded every job, order with lines, stock item, shipment and dispatch operation on each call. It also tested for job and shipment statuses that do not exist, so completed jobs were treated as open  | Phase 2: architecture and code quality |
| I-011 | P1 | DEFERRED TO SPECIFIC PHASE | Supplier quality (six screens) | Inbound receiving, IQC inspections, nonconformances, SCARs, scorecards and suppliers show invented suppliers, inspections and scores. No server side exists | Inventory and purchasing |
| I-012 (D-024) | P1 | DEFERRED TO SPECIFIC PHASE | Inventory | Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory menu opened the second | Inventory and purchasing |
| K-007 | P1 | IN PROGRESS | Inventory valuation | No cost unless typed by hand. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| L-026 | P1 | IN PROGRESS | Production costing | No production cost exists. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| M-011 | P1 | DEFERRED TO SPECIFIC PHASE | Production quality (5 screens), Bills of material | Sample data presented as real; the BOM screen was hard-wired to samples | Manufacturing and processing |
| S-010 | P1 | ACCEPTED RISK WITH APPROVAL | Delivery promise | Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout | Sales and customer operations |
| X-007 | P1 | REQUIRES BUSINESS DECISION | Order entry, web checkout, online settings | Order cut-off times, delivery promise dates, the "ship from another branch" comparison (with invented branch stock), the fulfilment override and split shipments run from sample rules built into the browser. No server rou | Enterprise experience |
| X-009 | P1 | DEFERRED TO SPECIFIC PHASE | Scale of sample screens | 58 of 143 screens are samples. All now say so | Enterprise experience |
| B-012 | P2 | DEFERRED TO SPECIFIC PHASE | Lists across the server | Some are small set-up lists where no limit is harmless; others grow with products, operators and partners. | Performance phase |
| B-014 | P2 | DEFERRED TO SPECIFIC PHASE | Code base | Business rules sit inside route handlers and large screens, where a unit test cannot reach them. | Phase 2: architecture and code quality |
| B-017 | P2 | DEFERRED TO SPECIFIC PHASE | Database | A third of the schema is design that was never built (see X-009). | Data integrity phase (after X-009) |
| B-021 | P2 | DEFERRED TO SPECIFIC PHASE | Documents | On a disk host the file is also reachable by its address alone. | Security and multi-location phase |
| C-009 | P2 | DEFERRED TO SPECIFIC PHASE | Access control | The core order-to-cash and shop records are held; the rest are not. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
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
| G-003 | P2 | DEFERRED TO SPECIFIC PHASE | Database | Most of the 217 are in the 93 tables that hold no rows and belong to modules that are designed but not built (X-009, B-017). | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-011 | P2 | DEFERRED TO SPECIFIC PHASE | Platform | History can be rewritten by any code with database access. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-015 | P2 | BLOCKED | Platform | Unknown. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| H-012 | P2 | DEFERRED TO SPECIFIC PHASE | Platform | With N instances a limit is up to N times its number, and the report shows the calls of the instance that answered. | Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication |
| H-014 | P2 | DEFERRED TO SPECIFIC PHASE | Partner API | They answered 500. | Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication |
| H-015 | P2 | REQUIRES BUSINESS DECISION | Platform | Not connected. Since Phase 4 the integration report lists each one with its state and what happens without it. | Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication |
| I-017 | P2 | DEFERRED TO SPECIFIC PHASE | Receiving | A heat must be on file before stock is received against it, and heats are added one at a time | Inventory and purchasing |
| J-008 | P2 | REQUIRES BUSINESS DECISION | Customers | Six settings look active and do nothing. | Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal |
| K-006 | P2 | REQUIRES BUSINESS DECISION | Steel Outlet remnants | A separate list. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| K-008 | P2 | REQUIRES BUSINESS DECISION | Cycle counts | Single-item correction only. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| K-010 | P2 | REQUIRES BUSINESS DECISION | Replenishment | Nothing. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| K-011 | P2 | REQUIRES BUSINESS DECISION | Purchasing | Exact, held. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| K-012 | P2 | DEFERRED TO SPECIFIC PHASE | Purchasing | Not recorded. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| L-023 | P2 | DEFERRED TO SPECIFIC PHASE | Quality control | Not built. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| L-025 | P2 | DEFERRED TO SPECIFIC PHASE | Scheduling | A queue order with times where estimates exist, clearly labelled. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| L-028 | P2 | IN PROGRESS | Quality control | A fixed list of unknown origin. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| M-017 | P2 | REQUIRES BUSINESS DECISION | Jobs | The job rules allow some backward moves (for example in process back to ordered); `/start` and `/complete` keep their own checks; the print hook runs on some status routes and not others | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| M-018 | P2 | IN PROGRESS | Help manual | The pages for time tracking and the order board described features that do not exist (clock in and out, timesheet approval, an order panel) | Manufacturing and processing |
| N-025 | P2 | REQUIRES BUSINESS DECISION | Accounting | Not built. | Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout |
| N-026 | P2 | DEFERRED TO SPECIFIC PHASE | Freight and carriers | None is. | Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout |
| S-009 | P2 | REQUIRES BUSINESS DECISION | Remnants | Remnant discount is fixed in code at 15% and 25% on two screens | Sales and customer operations |
| S-020 | P2 | REQUIRES BUSINESS DECISION | Customers | "Default Discount %" on the customer screen is applied nowhere | Sales and customer operations |
| S-024 | P2 | IN PROGRESS | Help manual | Pricing, Sales Dashboard, Sales Rep Mobile and customer pages described tabs, contracts, signatures, visit logs and offline use that do not exist | Sales and customer operations |
| S-027 | P2 | REQUIRES BUSINESS DECISION | Quotes | Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products | Sales and customer operations |
| V-027 | P2 | DEFERRED TO SPECIFIC PHASE | Order board, production board, schedule | Grows with the data. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-028 | P2 | DEFERRED TO SPECIFIC PHASE | Dispatch API | Readable across branches by asking. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-037 | P2 | DEFERRED TO SPECIFIC PHASE | Dashboards | Verified for the home dashboard's recent orders, the quality station counts, what customers owe by age and the time report. Not for the five dashboards named. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| X-008 | P2 | DEFERRED TO SPECIFIC PHASE | Counter (`/pos`), will-call screens | The will-call pickup queue and completion screens use sample orders. The screen is not on the menu | Enterprise experience |
| X-010 | P2 | DEFERRED TO SPECIFIC PHASE | Help manual | Only the pages rewritten in Workstreams 2 to 5 were checked against their screens. The pages for sample modules (safety, maintenance, training and others) still describe them as working | Enterprise experience |
| B-013 | P3 | DEFERRED TO SPECIFIC PHASE | Code base | It is kept, read by new engineers and scanned by every tool. | Phase 2: architecture and code quality |
| B-022 | P3 | DEFERRED TO SPECIFIC PHASE | Demo and QA data | The demo seed writes rows directly and skips the rules. | Data integrity phase |
| B-024 | P3 | DEFERRED TO SPECIFIC PHASE | Code base | The 39 effect warnings are the ones that can be defects: an effect that reads a value it does not list can show stale data. They have not been read one by one. | Phase 2: architecture and code quality |
| D-023 | P3 | DEFERRED TO SPECIFIC PHASE |  | The demo seed data contains 49 inconsistent orders (shipped quantities with no shipment, fully shipped orders still marked confirmed). | By subject (see the finding) |
| D-027 | P3 | DEFERRED TO SPECIFIC PHASE |  | The request rate limit counts per server instance, so on the hosted site the real limit is higher than configured. | By subject (see the finding) |
| D-035 | P3 | REQUIRES BUSINESS DECISION |  | Sales tax is charged only for states that have a rate set. A sale at a branch in a state with no rate charges no tax and says so on the screen. A login with no home branch also charges no tax. A new screen, Admin > Sales | By subject (see the finding) |
| E-018 | P3 | DEFERRED TO SPECIFIC PHASE | Code | Five server route files of 870 to 1,390 lines; five screen files over 1,000 lines | Phase 2: architecture and code quality |
| G-013 | P3 | DEFERRED TO SPECIFIC PHASE | Stock items, stock search, heat trace | Both grow in step with the whole company's data. Both are far inside the half-second target today. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-018 | P3 | DEFERRED TO SPECIFIC PHASE | Database | The column is optional, so that existing rows and all-branch logins keep working. | Phase 3: database integrity, transactional correctness, performance and 80-location scalability |
| G-020 | P3 | DEFERRED TO SPECIFIC PHASE | Orders | Status is protected; other fields are last write wins. | Phase 9: user experience, visual design and accessibility |
| J-012 | P3 | REQUIRES BUSINESS DECISION | Retail POS | Free text, linked to no stock item (code read), so the sale has no stock record to reduce. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| K-009 | P3 | REQUIRES BUSINESS DECISION | Warehouse locations | Free text. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| K-013 | P3 | BLOCKED | Scanning | Lookup by typed or pasted number verified; hardware not tested. | Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer |
| L-027 | P3 | DEFERRED TO SPECIFIC PHASE | Manufacturing | Not built. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| L-029 | P3 | DEFERRED TO SPECIFIC PHASE | Jobs | 0 by convention. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| L-030 | P3 | DEFERRED TO SPECIFIC PHASE | Equipment | None is made. | Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence |
| N-028 | P3 | DEFERRED TO SPECIFIC PHASE | Customer communication | Not built. | Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout |
| U-004 | P3 | DEFERRED TO SPECIFIC PHASE | Several secondary screens | Call server routes that do not exist (D-020) | Phase 9: user experience |
| U-008 | P3 | ACCEPTED RISK WITH APPROVAL | Sales Rep Mobile, delivery preview | A date nobody computed | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| U-012 | P3 | REQUIRES BUSINESS DECISION | Customers > Preferences | "Default Discount %" is offered and applied nowhere | Phase 9: user experience |
| U-019 | P3 | DEFERRED TO SPECIFIC PHASE | Supplier quality, six screens | Invented data presented as real | Phase 9: user experience |
| U-022 | P3 | DEFERRED TO SPECIFIC PHASE | Receiving | A heat must be added before its stock, one at a time | Phase 9: user experience |
| U-029 | P3 | DEFERRED TO SPECIFIC PHASE | Production quality, BOMs | Invented data presented as real | Phase 9: user experience |
| U-035 | P3 | DEFERRED TO SPECIFIC PHASE | Freight and logistics | Invented routes, rates and tracking presented as real | Phase 9: user experience |
| U-037 | P3 | DEFERRED TO SPECIFIC PHASE | Safety, maintenance, training, contractors, customer quality, executive, provenance | Invented data presented as real | Phase 9: user experience |
| U-040 | P3 | DEFERRED TO SPECIFIC PHASE | Menu | Lists 58 sample screens beside the real ones | Phase 9: user experience |
| U-041 | P3 | ACCEPTED RISK WITH APPROVAL | Checkout, order entry | Promise dates and branch suggestions from invented rules | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-011 | P3 | DEFERRED TO SPECIFIC PHASE | Sample screens mostly | 17. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-018 | P3 | DEFERRED TO SPECIFIC PHASE | Other long forms | Order entry only. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-029 | P3 | DEFERRED TO SPECIFIC PHASE | Dialogs | Focus on the dialog. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-030 | P3 | REQUIRES BUSINESS DECISION | Orders | Dead buttons on real screens. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-031 | P3 | ACCEPTED RISK WITH APPROVAL | Application shell | A fixed list. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-035 | P3 | DEFERRED TO SPECIFIC PHASE | Design system | A third of the files carry their own. | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |
| V-036 | P3 | DEFERRED TO SPECIFIC PHASE | Tables and dialogs | Tables are built by hand per screen, so sorting, paging, an empty state and keyboard row opening exist on some and not on others. Phase 9 made the behaviours that matter for access the same everywhere (names, headings, k | Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification |

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
- **Status note:** Phase 4: a contract test now holds the two addresses for jobs and work centers to the same answer and the same rules.
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

### B-009 · P1 · IN PROGRESS

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
- **Required tests:** A two-requests-at-once test on whichever store is kept; the audit shows one stock list.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice. Decided by the owner (decision 1): the stock items list and sales orders are the real ones. Phase 2 put both second copies under a department rule and inside the gates; it did not connect or retire them. Phase 3 audited the two stores and did not migrate them. The QA database holds only fixture rows in them; what the live stores hold cannot be seen from here, and moving records nobody has inspected into the order and stock tables would be changing business data on a guess. Phase 5: the Order Hub screen is retired (S-021). The second stock list and its JSON store remain; they belong with inventory in Phase 6. Phase 6: the second stock list can no longer be written. POST /api/v1/inventory/adjust, /rfid-scan, /transfers and /transfers/:id/status answer 410 RETIRED with where to go instead; its reads remain so nothing on screen breaks. The order hub half was handled in Phase 5 (S-021). What remains: remove the v1 reads and their demo data once the screens that read them are pointed at the stock items list (Phase 9 screen work).
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "the retired v1 stock writes change nothing", "the old transfer address still works but now ships, and the old v1 transfer writes are retired".
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

### B-011 · P2 · VERIFIED FIXED

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
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 8, 2026-11-15: A step cannot start until the steps before it are finished. It is one setting (production.rules.stepsInOrder), on by default. Phase 7: confirmed by running it (L-004) and corrected. A step must be started before it is finished, a finished step cannot be started again, and a pause needs a running clock. The owner decided on 2026-11-15 that steps run in their planned order (decision 8). Whether a finished step may be reopened for rework is now finding L-020.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "steps run in their planned order", "a step that was never started cannot be finished", "finishing the last step sends the job to inspection once; finishing it again changes nothing"; qa/sim/phase2-integrity.mjs; src/backend/test/phase7Rules.test.js.
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
- **Status note:** Phase 3 measured the branch list screens on the 85-branch copy: every one answered in under 160 ms at the 95th percentile for a branch login and under 270 ms for an all-branch login (qa/results/phase3-branch-bench-before.json). The unlimited lists were not changed in this phase. Phase 4: orders and stock now honour limit and offset and report their total (H-010). The other unbounded lists are unchanged.
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

### B-015 · P2 · VERIFIED FIXED

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
- **Required tests:** An accessibility scan in the browser suites.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Phase 9: measured at 613 controls with no name and 280 fields with no label on 154 screens; both are 0 (V-006). The 26 browser confirm, alert and prompt boxes are replaced by the application's own (V-008, V-009). An automated accessibility measure runs in the gates.
- **Verification evidence:** qa/sim/ui-audit.cjs final run: 0 and 0; qa/tools/ui-audit-gate.cjs holds them; qa/tools/frontend-checks.mjs fails on a new unnamed icon button or a browser box (each proved by adding one); qa/sim/phase9-ui.cjs: "deactivating a user asks in the application's own box, and Cancel changes nothing".
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
- **Status note:** Phase 4: success-path tests now exist for the partner API (customer, carrier, supplier, webhooks, sign-in, administration), the integration report and replay, the scheduled address, and request keys on shipments, payments, receipts, transfers, credits, work order completion, purchase orders, quotes and counter sales. The count of changing routes with a success-path test is in progress.json.
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

### B-018 · P2 · VERIFIED FIXED

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
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Needs a scheduled trigger on the host, which is the owner's setting Phase 4: delivery is now durable (see H-002): a failed event waits in the database for 1, 5, 30 and 120 minutes and is kept as failed after five tries. The retries are carried out when the scheduled address is called; setting that schedule on the host is B-019.
- **Verification evidence:** qa/sim/phase4-integration.mjs, group "Event processing and background jobs".
- **First recorded in:** Phase 1 discovery

### B-019 · P1 · BLOCKED

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
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Phase 4: the scheduled work now exists as one address, GET or POST /api/internal/tasks/run, protected by a secret (CRON_SECRET). It sends waiting partner events and clears old request keys, is safe to call from several places at once, and records when it last ran; the Integrations screen shows that time and has a "Run now" button. Blocked on two host settings that are the owner's: (1) set CRON_SECRET to a long random value; (2) add a schedule that calls the address every 5 minutes with "Authorization: Bearer <CRON_SECRET>". It was not added to vercel.json because a schedule the plan does not allow can fail the deployment. Until then nothing is lost: events are sent right after each action, and a failed one waits for "Run now".
- **Verification evidence:** qa/sim/phase4-integration.mjs: "the scheduled run needs its secret, does the periodic work and records that it ran", "five delivery runs at the same moment send each event once". The host schedule itself is NOT VERIFIED.
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
- **Deferred: reason:** Rewriting 38 effects changes when screens reload their data, with no defect known among them; it is consolidation work, not a user-facing fault.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Rewrite each effect so it lists what it reads.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** qa/tools/frontend-checks.mjs reports 0.
- **Deferred: verification:** The ratchet.
- **Required tests:** Root lint with a ceiling that can only go down.
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Phase 2 read all 39. One was a defect and is fixed: on the order entry screen the override confirmation could submit through an older copy of the submit handler (C-008). 28 are the same harmless shape (load once when the screen opens). 10 are in the session counter flow, the map and the voice assistant. Phase 9: 38 remain, held by the ceiling in qa/tools/frontend-checks.mjs. None was added by the Phase 9 changes. They were read one by one in Phase 2 and the one defect among them was fixed then.
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

### C-002 · P2 · VERIFIED FIXED

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
- **Required tests:** A carrier token dispatches and delivers a shipment and the simulation's reconciliation stays at zero problems.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Phase 4: the carrier routes were rewritten on the real schema and on the staff dispatch and delivery steps (see H-001). A carrier can never dispatch; a report on a shipment that has not left is refused; a repeated report changes nothing.
- **Verification evidence:** qa/sim/phase4-integration.mjs: "a carrier reports delivery through the partner API: shipping, history and the customer all see it", "a carrier reports delivered twice, and again late", "a carrier sees only its own loads, and no prices".
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
- **Status note:** Phase 3: a RequestKey table with a unique rule on (user and route, key); middleware on every changing route that honours an Idempotency-Key header; the screens send a key for every request that creates a document (src/frontend/src/api/requestKey.js). A repeat gets the first answer back; the same key with a different body is refused (422); a refused request is not remembered. Phase 4: the request-key middleware is now exercised on shipments (create, dispatch, deliver), payments, receipts, transfers, credits, work order completion, purchase orders, quote acceptance and counter sales, and by partners; two defects in it were found and fixed (H-003, H-004). A browser test asserts that the screens send the key and reuse it on a retry.
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

### C-011 · P2 · VERIFIED FIXED

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
- **Required tests:** Receive 10, sell 3, void 1 sale, count 7 then 10.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Phase 3 did not change Coil.heatId or gradeId. Making them optional changes what every stock screen and trace report may assume, and the rule for piece goods is the owner's. No database change was made on a guess. Phase 6: shelf goods are received by the piece (form SUPPLY) against a product in the catalog, with no heat or grade; the stock is counted in EA. A database check (Coil_heat_and_grade_unless_supply, SQL Editor file 12) keeps heat and grade required for every other form. The counter sale and its void already move piece stock (Phase 2 and 5).
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "shelf goods are received by the piece against a product, with no heat or grade", "shelf goods need a whole number of pieces and a product that is in the catalog"; qa/sim/security.mjs section 20 ships a web line of pieces from a received lot; src/backend/test/phase6Rules.test.js.
- **First recorded in:** Phase 2 architecture review

### C-012 · P3 · VERIFIED FIXED

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
- **Required tests:** An intake order by a login of another company carries that company as seller.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Phase 5: an intake order's seller is the company that owns the branch it is sold from; the fixed company code is used only when the branch has no owner on file.
- **Verification evidence:** qa/sim/phase5-sales.mjs: "order entry sells from the person's own branch: taxed, filed and sold by that branch" (seller equals the branch owner).
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
- **Status note:** Open: needs a shared store, which is a new service Phase 4: the same per-instance limit applies to the partner request limit and to the new breaker for outside services (H-012).
- **First recorded in:** qa/engineering-quality-findings.md

### E-015 · P1 · ACCEPTED RISK WITH APPROVAL

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
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Open: needs the owner (see `production-readiness-checklist.md`) Owner, 2026-11-13: "backups later". Until a backup is confirmed and a restore has been tested, a loss or corruption of the live database may not be recoverable. This stays a production blocker in the risk register (R-08) and is raised again at each phase gate.
- **Verification evidence:** None. No backup was confirmed and no restore was run.
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
- **Status note:** Open: needs a provider choice Phase 4: an Integrations screen and report now show failed and waiting events, outside-service failures, orders shipped but not invoiced, requests never answered and when the scheduled work last ran; failures are written as structured log lines with the request id. Nothing is sent to anyone: there is still no alert and no error tracker. That remains the owner's choice of service.
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
- **Deferred: reason:** Changing a list's shape changes every screen that reads it and the contract tests; it is consolidation work.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Move every screen to one reader, then change the routes.
- **Deferred: dependencies:** The Phase 4 contract tests.
- **Deferred: acceptance criteria:** One list shape on every route.
- **Deferred: verification:** Contract tests.
- **Required tests:** Every list route in the module answers `{ data, meta }` and its screens are updated; contract scan shows no mismatch
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: changing a reply shape affects screens, so it is done per workstream. Job list now sends the total in a header phase-02-api-contracts.md records both shapes and which routes use each. Phase 4: the present reply shapes are now pinned by contract tests, so they cannot drift further unnoticed, and paging was added to the bare-array lists through headers without changing a body (H-010). Making every list one shape is still a change to every screen and stays where it was assigned. Phase 9: the new search and the Phase 9 scenarios read both list shapes through one reader. The routes still answer in two shapes, pinned by the Phase 4 contract tests.
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
- **Status note:** Open Phase 5: reviewed. Acceptance taxes by the selling branch (rule 27) and now files the order under the same branch (J-005). The store's estimate uses the ship-to state, which is rule 27's fallback when no branch is chosen; the buyer sees an estimate and the CSR confirms. Unchanged pending the owner.
- **First recorded in:** qa/engineering-quality-findings.md

### F-009 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Invoices
- **Category:** Access
- **Source file or endpoint:** src/backend/src/lib/roleAccess.js (INVOICE_READERS, invoiceReadDenial); src/backend/src/lib/invoiceView.js (new)
- **Evidence:** `lib/roleAccess.js`; a check written for it was withdrawn because it tested a rule nobody set
- **Expected:** Owner decision 10: invoices and payments are read by sales, accounting and managers.
- **Actual:** Any staff login can read every invoice and its payments (reads are open to all staff by design; only changes are restricted)
- **Operational impact:** Shop staff can see what customers owe and paid
- **Affected dependencies:** Who may read invoices and payments
- **Recommended correction:** Reads of /api/invoices are refused (403) to staff outside sales, managers, leadership and the view-only roles. Where another answer carries an invoice (a shipment, an order, the answer to a dispatch), those staff receive its number and status only. Counter sales are untouched: the clerk who takes the money sees the receipt. Customers keep their own rules.
- **Required tests:** A sweep check per role
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Owner's decision 10, 2026-11-15: Built as recommended: (1) a manager ends a shipment that has a problem as lost, destroyed or refused for good, with what happened, and what is not yet credited on its invoice is credited in the same save; nothing is automatic. (2) Invoices and payments are read by sales, managers, leadership and the view-only roles; other staff see only that an invoice exists, its number and status. (3) The web shop takes no payment method and says every web order is on account. Not built, by the same decision: (4) carriers stay as tracking numbers typed by dispatch until a carrier contract exists; (5) the delivery promise screens stay as they are, for demonstration. Still open: (6) accounting. The owner asked for advice on an internal ledger; three answers are needed before it is built (when cost of goods counts, the chart of accounts, the start date). Decided by the owner (decision 10) and built. Boundary stated: the closeout panel still tells any staff reader that an amount is unpaid on an order, because the dock is asked whether an order is finished; it shows no invoice or payment record.
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "invoices and payments are read by sales, accounting and managers only"; src/backend/test/decision10.test.js (6 tests); qa/sim/ui-phase8.cjs (shipping desk). With the rule removed the scenario fails; with the answer guard removed the scenario fails.
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

### F-011 · P2 · VERIFIED FIXED

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
- **Required tests:** The print path examined and either wired to the Shipment screen or recorded as a gap
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Open Phase 8: examined (N-014, N-019). A packing list and a bill of lading are drawn for a shipment from what is on file, with blanks for what is not, and opened from the shipment screen.
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "the bill of lading and packing list are drawn from the shipment, with nothing invented (N-014)"; qa/sim/ui-phase8.cjs: packing list and bill of lading checks.
- **First recorded in:** qa/engineering-quality-findings.md

### F-012 · P2 · VERIFIED FIXED

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
- **Required tests:** `npm run lint` fails on an undefined name; shown failing on the F-012 defect
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Open (see E-016) Phase 8: checked in this session. A file with an undefined name was added to the frontend and linted: eslint answered "'strayWord' is not defined (no-undef)", 1 error. The file was removed. Lint runs in every gate run.
- **Verification evidence:** npx eslint on a file with an undefined name: 1 error (no-undef), 2026-11-16. qa/tools/run-gates.sh "lint, frontend": 0 errors.
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

### G-006 · P2 · VERIFIED FIXED

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
- **Status note:** The question for the owner is the one already asked under M-016: when a piece is cut, what happens to the weight of the piece it was cut from? Owner decision of 2026-11-13: everything is always tracked. Recording a remnant against its parent takes the remnant's weight off the parent in the same transaction, with a movement on the parent that names the piece (lib/receiving.js, takeFromParent). A remnant heavier than what is free on the parent is refused.
- **Verification evidence:** qa/sim/phase3-db.mjs "a remnant entered against its parent...": parent 6000 to 5948.75, movement on the parent, the two together still 6000; a heavier remnant refused. On the old code the parent stays at 6000.
- **First recorded in:** Phase 3 database audit

### G-007 · P2 · VERIFIED FIXED

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
- **Required tests:** The eight transfer scenarios of Phase 3 plus partial receipt, shortage, damage, duplicate receipt and cancellation.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Phase 6: a transfer is shipped, is in transit and is received. Sending puts the item's free quantity in an in-transit bucket at the sending branch (reservations and holds travel with it); it cannot be sold, reserved, cut, corrected or sent again. The receiving branch books it in; anything short, missing or damaged is held with a note until a manager or the inventory manager settles it. The sender can call it back before it arrives. Tables StockTransfer and StockTransferLine, column Inventory.qtyInTransit, and the balance identity now includes in transit (SQL Editor file 12).
- **Verification evidence:** qa/sim/phase6-inventory.mjs: the 17 "Interbranch transfers" scenarios and the transfer scenarios under "Concurrency, security and recovery"; qa/sim/ui-phase6.cjs: transfers received from the screen; src/backend/test/phase6Rules.test.js (4 tests); qa/tools/db-facts.mjs: five transfer checks at 0. Older suites updated to ship then receive (phase-06-regression-results.md).
- **First recorded in:** Phase 3 database audit

### G-008 · P2 · VERIFIED FIXED

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
- **Status note:** Question for the owner: may one stock item feed more than one open work order at a time? Owner decision of 2026-11-13: one item may feed several work orders if the system tracks it. It now does: a work order may be raised on an item that is available or reserved, and each takes only what is free (or reserved for its own line) at the moment it completes, under a lock on the item's balance. The item can never go below zero.
- **Verification evidence:** qa/sim/phase3-db.mjs "one item feeding several work orders at once": three work orders of 1500 lb on a 4000 lb item completed at the same moment: two succeed, the third is refused, 1000 lb left; the third then completes with what is left and the item is marked consumed.
- **First recorded in:** Phase 3 database audit

### G-009 · P3 · VERIFIED FIXED

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
- **Required tests:** A report by status excludes voided sales.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Phase 5: a void now sets the order to CANCELLED in the same conditional claim that adds the note, so every report that filters on status leaves it out; the day's counter figures leave it out. Earlier voided sales are set to CANCELLED by SQL Editor file 11 (20261115090000_voided_counter_sales_cancelled), which the owner applies.
- **Verification evidence:** qa/sim/phase5-sales.mjs: "a voided sale is cancelled, credited, refunded and put back on the shelf, once" and the final reconciliation ("no voided counter sale is left COMPLETE"); SQL Editor file 11 run twice on a copy of the 85-branch database: 903 voided sales left COMPLETE before, 0 after; second run skipped.
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
- **Status note:** Phase 6 measurement on the 85-branch copy (100,233 stock items) after SQL Editor file 12: stock search by part of a number 116 ms median, first page of stock items 48 ms, supply position 271 ms for an all-branch login. No index was added: the instruction forbids one without evidence of need, and all are inside the half-second target.
- **First recorded in:** Phase 3 database audit

### G-014 · P3 · VERIFIED FIXED

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
- **Required tests:** Reply size and requests per second before and after.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Phase 4: the API half is done and tested (H-010): GET /api/orders?view=summary answers 50 orders in 41 KB against 95 KB in full (qa/results/phase4-load.json), and limit and offset are honoured. No screen was switched to it in this phase. Phase 5: reviewed for the screens. No screen lists GET /api/orders: the All Orders screen reads the order intake list, which it shows master and detail (the selected order's lines), and the home page reads /api/dashboard. The summary view of /api/orders, built in Phase 4, is what a list without lines uses, and is checked again in Phase 5.
- **Verification evidence:** qa/sim/phase5-sales.mjs: "the order list answers a page in summary form" (smaller reply, line count, no lines).
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

### G-016 · P3 · VERIFIED FIXED

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
- **Status note:** Question for the owner: how many years of audit history and stock movements must stay online? Owner decision of 2026-11-13: five years for now, with warnings to archive. GET /api/admin/retention counts records older than the period, and those within six months of it, for nine record types, and returns a warning. Managers see the warning on the user administration screen. The period is 5 years unless an AppSetting 'retention.years' says otherwise. Nothing is removed or moved: archiving itself is not built and would need the owner's approval of what is archived and where.
- **Verification evidence:** qa/sim/phase3-db.mjs "history older than five years raises an archive warning, and nothing is removed"; test/stockChanges.test.js (cutoff and level).
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
- **Status note:** Document numbers can have gaps. If the owner needs invoice numbers with no gaps, that is a different mechanism (a counter row locked per series) and a decision. As before for orders, shipments, jobs and work orders: a number is never repeated and none is lost under 80 simultaneous saves, though a number can be skipped. Owner decision of 2026-11-13 for invoices: never skipped or repeated. Invoice and credit memo numbers now come from a DocumentCounter row that is advanced inside the transaction that saves the document, at the moment it is written, so a save that fails or is refused gives its number back. Counter sales take their invoice number from the same series (they were INV-QS-<order number> before). A counter sale sent twice is held by a lock on the sale id instead of being written and deleted. Numbers issued before this change keep whatever gaps they have.
- **Verification evidence:** qa/sim/phase3-db.mjs group 7: twelve invoices raised at once take twelve consecutive numbers; a credit that fails after taking its number, a refused credit and an order with nothing to bill take none; a counter sale sent three times at once is one sale with the next number. db-facts: counter equals the highest number on file, no number repeated. SQL Editor file 20261113220000_document_counters run twice on the 85-branch copy.
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
- **Status note:** Phase 5: quotes, accepted quotes, web orders, order intake and counter sales now set the order's branch (J-001, J-005, S-008). The column stays optional for all-branch logins with no home branch; orders with no branch after the final gate run: 59 after the simulation and 62 after all scenarios (63 at the end of Phase 4); the rest are seed orders and orders entered by all-branch logins with no home branch.
- **First recorded in:** Phase 3 database audit

### G-019 · P1 · VERIFIED FIXED

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
- **Status note:** Question for the owner: may an order ship when no stock has been reserved for it? If yes, in which cases (direct from the mill, buy-outs), and how should the heat be recorded? Owner decision of 2026-11-13: refuse. A shipment that carries more than is reserved for its line is refused at dispatch (routes/shipments.js, consumeReserved), with a message that says to reserve the stock first. Nothing is saved for any line of the shipment. Every shipment therefore names its stock items, and through them the heat, and reduces the balance. The shop-floor Ship button goes through the same step.
- **Verification evidence:** qa/sim/phase3-db.mjs "a shipment with nothing reserved, or less reserved than it carries, is refused and changes nothing": nothing reserved is refused; half a pound short is refused; fully reserved goes, with movements naming the item. db-facts check for dispatched shipment items not covered by stock movements is 0 after the gate run. On the old code the first check fails (dispatch was accepted).
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
- **Deferred: reason:** The remaining edit routes need the same server check, which is reliability work.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** Require the version on every edit route and send it from every edit form.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** Two people editing the same record: the second is told and loses nothing silently.
- **Deferred: verification:** A two-user scenario per record type.
- **Required tests:** Two edits at once: one 200, one 409.
- **Assigned phase:** Phase 9: user experience, visual design and accessibility
- **Status note:** Phase 4: PUT /api/orders/:id accepts expectedUpdatedAt and refuses an edit made from an older copy with 409 and the code STALE_EDIT. It is opt-in, so no existing caller breaks. No screen edits an order header today, so no screen sends it; the other edit routes are unchanged. Phase 5: reviewed. No screen edits an order through PUT /api/orders/:id (the call in api/index.js has no user). Orders are edited on the order entry screen through PATCH /api/orders/intake/:id, which does not check the version. The API check from Phase 4 is tested again in Phase 5. Phase 9: the screens' order save helper now sends the version it read, and the server refuses a save made from an older one (409). No screen edits an order's header fields today, so no user can meet the fault through the product. The other edit routes (customers, stock items, work orders) are unchanged.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the order save helper sends the version it read, and the server refuses a save made from an older one".
- **First recorded in:** Phase 3 database audit

### H-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Customers, carriers and suppliers reading and acting through the API
- **Category:** Broken code; rule bypass
- **Source file or endpoint:** src/backend/src/routes/partner/customerRoutes.js, carrierRoutes.js, supplierRoutes.js
- **Evidence:** First success-path run of the partner API in this program, with a real partner key and token: almost every route answered 500. The handlers filtered on columns that do not exist, set statuses that do not exist and read relations by the wrong name. Where a carrier route could have run, it changed a shipment directly and skipped the dispatch and delivery rules staff go through. Extends C-002 from carriers to all three partner kinds.
- **Expected:** A partner reads its own records and acts through the same rules as staff.
- **Actual:** The API could not be used; had it been repaired in place it would have bypassed stock, order and invoice rules.
- **Root cause or suspected cause:** Written against an earlier idea of the schema and never run.
- **Operational impact:** No partner integration could go live; a repaired-in-place carrier update could mark a load delivered that never left.
- **Affected dependencies:** C-002.
- **Recommended correction:** The three route files were rewritten on the real schema and on the staff steps themselves: a carrier report calls the same deliver and move steps as the shipping desk and can never dispatch; a customer creates a request for quote and accepts or declines a quote through the same functions as the sales desk; a supplier reads and acknowledges its own purchase orders. Shared parsing, paging and refusal shape in routes/partner/common.js.
- **Required tests:** Success path and refusal path for every working route; isolation between two partners of the same kind.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Verification evidence:** qa/sim/phase4-integration.mjs: "a carrier reports delivery through the partner API", "a supplier reads and acknowledges only purchase orders placed with it", "what a partner reads equals what staff see", "a carrier sees only its own loads, and no prices", "scopes and partner types are enforced on every kind of route", "the partner API keeps one shape for lists, one for errors". On the code before, the same calls answered 500.
- **First recorded in:** Phase 4 integration audit

### H-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Events sent to partner systems (webhooks)
- **Category:** Reliability: lost events
- **Source file or endpoint:** src/backend/src/services/webhookService.js; table WebhookDelivery
- **Evidence:** Code read and test: a failed delivery was marked for retry and the retry lived only in the memory of the server instance, so it was lost on restart and never resumed (B-018). No staff action raised an event at all: a dispatch at the shipping desk told no partner. Nothing stopped the same event being recorded twice for a subscriber. A row was written after the business change, so a crash between the two lost the event.
- **Expected:** A business change and the events about it are saved together; each event reaches each subscriber once, is retried on a schedule, stops after a limit and can be sent again by a person.
- **Actual:** Events were best effort, raised only by partner calls, and lost on any failure.
- **Root cause or suspected cause:** No durable queue and no link from the staff routes.
- **Operational impact:** A customer or carrier system that relies on events silently misses dispatches, deliveries and invoices.
- **Affected dependencies:** B-018, B-019.
- **Recommended correction:** The existing WebhookDelivery table is used as an outbox. The row is written inside the transaction that makes the change (order confirmed, status changed, shipment dispatched, delivered, exception, invoice issued). Delivery claims a row with a conditional update, so several servers can run it at once; failures wait 1, 5, 30 and 120 minutes; after five tries the event is kept as failed; an administrator can send it again; a unique rule on (subscription, event) makes a second recording impossible (migration 20261113230000_webhook_delivery_once). No new infrastructure.
- **Required tests:** Delivered once; refused change leaves no event; backoff honoured; dead letter after five; replay; five runs at once; claim taken over after a crash.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** The retry schedule runs only when the host calls the scheduled address (B-019, the owner's setting). Without it, an event is still sent right after the action, and a failed one waits until an administrator presses "Run now" on the Integrations screen.
- **Verification evidence:** qa/sim/phase4-integration.mjs, group "Event processing and background jobs": 13 scenarios, all pass. SQL Editor file 10 ran twice on the 85-branch copy with duplicate rows planted: the later duplicates were renamed, none deleted, and the second run changed nothing.
- **First recorded in:** Phase 4 integration audit

### H-003 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** Request keys on the partner API
- **Category:** Security: one caller receiving another's answer
- **Source file or endpoint:** src/backend/src/middleware/requestKeys.js
- **Evidence:** qa/sim/phase4-integration.mjs on the code before: two different partners sent the same Idempotency-Key to the same address. The request-key middleware ran before partner sign-in and filed both under "anonymous", so the second partner was answered with the first partner's stored reply.
- **Expected:** A key belongs to the caller who sent it.
- **Actual:** All partner calls shared one scope.
- **Root cause or suspected cause:** The middleware is mounted globally, before the partner token is read.
- **Operational impact:** One partner could be shown another partner's created record, and its own request was not carried out.
- **Recommended correction:** At the global mount the middleware steps aside for partner addresses; the partner route stack runs it after sign-in, scoped to the partner.
- **Required tests:** Same key from two partners: two separate requests.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Verification evidence:** qa/sim/phase4-integration.mjs: "the same key with a different request is refused, and the same key from another person is their own request" and the partner checks in "a quote accepted by the customer and the sales desk at the same moment makes one order".
- **First recorded in:** Phase 4 integration audit

### H-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** A request whose connection drops
- **Category:** Reliability: duplicate business transaction
- **Source file or endpoint:** src/backend/src/middleware/requestKeys.js
- **Evidence:** qa/sim/phase4-integration.mjs on the code before: a client sent an order with a key and hung up before the answer. The middleware released the key when the connection closed, while the handler was still running. The client's retry with the same key was treated as new and a second order was saved.
- **Expected:** A retry after a lost answer gets the first result.
- **Actual:** Two orders.
- **Root cause or suspected cause:** The key was released on connection close rather than when the handler finished.
- **Operational impact:** Duplicate orders, shipments or payments exactly when the network is poor, which is when people retry.
- **Recommended correction:** A dropped connection no longer releases the key. The handler finishes and its answer is stored; the retry is answered with it. A claim whose server died is taken over after a minute, once.
- **Required tests:** Send and hang up, then retry: one record.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Verification evidence:** qa/sim/phase4-integration.mjs: "the answer is lost after the server saved: the retry gets the same order back, not a second one", "a request whose first attempt died is taken over once, not twice". qa/sim/ui-integration.cjs: "answer lost after saving (new shipment)": one shipment, same key on both attempts.
- **First recorded in:** Phase 4 integration audit

### H-005 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** Calls to outside services (speech, AI providers, partner addresses)
- **Category:** Reliability and security: no time limit; provider answers passed through
- **Source file or endpoint:** src/backend/src/routes/tts.js, services/ai/AIProviderService.js and providers, routes/aiAssistant.js, routes/ai.js
- **Evidence:** Code read and test against a local stand-in: (1) no outside call had a time limit, so a provider that hangs holds the request open until the host kills it; (2) the speech route passed the provider's own status to the browser, and the screens treat any 401 as "your session ended", so a wrong provider key signed the user out; (3) the AI routes returned the provider's error text to the caller; (4) the first characters of the speech key were written to the log and returned by a test route; (5) the AI client library retried on its own, with no bound set by us.
- **Expected:** Every outside call has a time limit, a bounded number of tries, a breaker, and a plain answer of our own on failure.
- **Actual:** None of these.
- **Root cause or suspected cause:** Each call site was written on its own.
- **Operational impact:** A slow provider ties up the server; a provider fault signs users out; provider messages and part of a key leak.
- **Recommended correction:** One guard for every outside call (lib/outbound.js): time limit, at most five tries and only where the caller marks the call as safe to repeat, a breaker per service, and counters for the integration report. A provider failure is answered 502, 503 or 504 with a sentence written here. The key is no longer logged or returned. The library's own retries are turned off.
- **Required tests:** Hang, error, wrong key, repeated failure and recovery, each against a stand-in.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** The breaker and its counters are per server instance (H-012). No real provider was called in any test; the real providers' behaviour is NOT VERIFIED.
- **Verification evidence:** test/outbound.test.js (8 tests). qa/sim/phase4-integration.mjs, group "Webhooks and external service failures": 11 scenarios, including "the speech provider hangs: the user gets a plain answer at the time limit and stays signed in" and "the server log holds request ids and reasons, and no key, token or signing secret".
- **First recorded in:** Phase 4 integration audit

### H-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipments
- **Workflow:** Dispatch raises the invoice
- **Category:** Partial failure concealed
- **Source file or endpoint:** src/backend/src/routes/shipments.js (dispatchAndInvoice)
- **Evidence:** qa/sim/phase4-integration.mjs with billing made to fail for one order: the dispatch answered 200 with no invoice and no word about it. The failure went to the server console only. Nothing listed orders that had shipped and were never billed.
- **Expected:** The truck leaving is not undone by a billing fault, but the gap is said, recorded and listed until it is closed.
- **Actual:** Silent.
- **Root cause or suspected cause:** The invoice step runs after the dispatch commits and its failure was caught and dropped.
- **Operational impact:** Material leaves and is never billed, and nobody knows.
- **Recommended correction:** The dispatch answer carries a warning in words; the shipment screen shows it; an audit entry INVOICE_NOT_RAISED and a structured log line are written; the integration report lists every order shipped but not invoiced, newest first, with the count under "Needs action".
- **Required tests:** Forced billing failure: stock and order move, warning shown, listed, then closed by raising the invoice.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** On the QA database the list also shows 51 seeded demo orders that the seed never billed. How many live orders are in this state is NOT VERIFIED (no access); the report will show it once deployed.
- **Verification evidence:** qa/sim/phase4-integration.mjs: "shipping succeeds and billing fails: the gap is said, recorded, reported and closed". qa/sim/ui-integration.cjs: "part of a step failed" (3 checks).
- **First recorded in:** Phase 4 integration audit

### H-007 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Partner sign-in
- **Category:** Security: disclosure and late revocation
- **Source file or endpoint:** src/backend/src/middleware/partnerAuth.js
- **Evidence:** Code read and test: the token route answered differently for an unknown key, a revoked key and a wrong secret, so a caller could learn which key ids exist and their state; the secret was compared only after the key was found, so timing differed too. A token stayed valid until it expired after its key was revoked. The accepted signing algorithm was not pinned.
- **Expected:** One answer for every failed sign-in; a revoked key stops at once.
- **Actual:** Three answers; up to an hour of use after revocation.
- **Operational impact:** Key enumeration; a leaked key cannot be cut off promptly.
- **Recommended correction:** The secret is always checked, against a dummy hash when the key is unknown, and every failure gets the same answer. Each call checks that the key behind the token is still active (401 KEY_REVOKED). The algorithm is fixed to HS256.
- **Required tests:** Unknown, revoked, expired and wrong-secret sign-ins are indistinguishable; a revoked key's token is refused on the next call.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Verification evidence:** qa/sim/phase4-integration.mjs: "a revoked key, a suspended partner and a wrong secret all stop at once and say the same little", "staff and partner credentials do not work on each other's API".
- **First recorded in:** Phase 4 integration audit

### H-008 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Where events may be sent and how they are signed
- **Category:** Security: request forgery from the server; replay
- **Source file or endpoint:** src/backend/src/services/webhookService.js, routes/partner/webhookRoutes.js
- **Evidence:** Code read: a partner could register any address, including one inside the host's network; redirects were followed; the signature covered the body only, so a captured event could be sent again later and still verify.
- **Expected:** Events go to public https addresses only, redirects are not followed, and a signature is tied to its time.
- **Actual:** None of the three.
- **Operational impact:** A partner key could be used to make the server call internal addresses; a receiver could not tell a replay.
- **Recommended correction:** In production an address must be https and public, checked when registered and again when sent (the name is resolved); a redirect is a failed delivery; a second header X-SteelWise-Signature-Timestamp signs the time with the body. The older header is still sent, unchanged, for receivers already using it.
- **Required tests:** Private and redirecting addresses refused; forged, altered and old events fail verification.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** The public-address rule is on only when NODE_ENV is production, so the local stand-in can be used in tests. The rule itself is unit tested with production set.
- **Verification evidence:** test/webhookRules.test.js (6 tests). qa/sim/phase4-integration.mjs: "a webhook address must be one this server may call", "a partner address that redirects is not followed", "a forged, altered or old event fails the signature check a receiver would make".
- **First recorded in:** Phase 4 integration audit

### H-009 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Screens
- **Workflow:** What a screen does when the server is slow, silent or gone
- **Category:** Error recovery in the browser
- **Source file or endpoint:** src/frontend/src/api/client.js, api/authFetch.js, api/requestKey.js, pages/Shipping/ShippingPage.jsx, ShipmentPage.jsx
- **Evidence:** qa/sim/ui-integration.cjs on the code before: 7 of 33 checks fail. A request had no time limit and waited for ever; a lost connection showed nothing or the words "Network Error"; an answer for an old search arriving late replaced the list for the current one; after a step whose answer was lost, the screen kept showing the old state; dispatch, delivery and work order completion are sent with PUT and carried no request key.
- **Expected:** A time limit, a sentence that says what happened and what to check, the newest filter wins, and the screen re-reads the record after a lost answer.
- **Actual:** As above.
- **Operational impact:** People wait on a dead request, repeat a step that was saved, or act on a stale list.
- **Recommended correction:** A 60-second limit on every request; a plain sentence for "no answer" and "took too long" that tells the user it may have been saved; list loads are numbered so a late answer is dropped; after a lost answer the shipment screen reads the shipment again; PUT steps that must not run twice carry a request key.
- **Required tests:** The ten cases of Phase 4 section 7 in a browser.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** The late-answer guard and the re-read after a lost answer were added to the shipping screens, which the test drives. Other list screens share the time limit, the messages and the request keys through the API client; their own late-answer handling was not audited one by one.
- **Verification evidence:** qa/sim/ui-integration.cjs: 33 checks, 0 failed (7 fail with the four changed files reverted).
- **First recorded in:** Phase 4 integration audit

### H-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** API
- **Workflow:** Lists of orders and stock
- **Category:** Contract: limit ignored; reply larger than needed
- **Source file or endpoint:** GET /api/orders, GET /api/inventory; src/backend/src/lib/listing.js
- **Evidence:** Phase 3 measured 244 KB for 50 orders. The routes ignored ?limit and ?offset, always returned their fixed maximum, and gave no total, so a screen could not page (E-021, B-012, G-014).
- **Expected:** A caller can ask for a page and learn how many there are, without the body changing shape for existing screens.
- **Actual:** Fixed maximum, no total.
- **Operational impact:** Slow list screens at 80 branches; no way to reach older records.
- **Recommended correction:** The bare-array body is kept. limit and offset are honoured up to the route maximum; X-Total-Count, X-Limit and X-Offset carry the window. GET /api/orders?view=summary returns the header, the customer and a line count instead of every line. A call with no parameters answers exactly as before.
- **Required tests:** Window honoured; body still an array; summary holds what the list shows.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Applied to orders and stock, the two lists the handoff measured. The other bare-array lists are unchanged and stay under B-012. The screens do not yet ask for the summary view; that is a screen change for the phase that owns each screen. During the load measurement the summary was first slower than the full list, because the line count was computed for every order in the database; corrected in this phase (see phase-04-performance-results.md).
- **Verification evidence:** test/listing.test.js (3 tests). qa/sim/phase4-integration.mjs: "a bare-array list can be windowed without changing its body, and says how many there are". qa/results/phase4-load.json: 50 orders for an all-branch login, 95 KB in full and 41 KB as a summary.
- **First recorded in:** Phase 4 integration audit

### H-011 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Orders
- **Workflow:** Order entry
- **Category:** Business rule not decided
- **Source file or endpoint:** POST /api/orders
- **Evidence:** qa/sim/phase4-integration.mjs, exploration: an order with a customer and no lines is accepted and saved as a draft. There is no route to add a line afterwards.
- **Expected:** Not decided.
- **Actual:** Accepted.
- **Operational impact:** Empty orders can accumulate; none can be confirmed into work.
- **Recommended correction:** Either refuse an order with no lines, or keep it as a draft and add a way to add lines.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Question for the owner: should an order with no lines be refused, or kept as a draft to fill in later? Left unchanged because changing it is a business rule. Belongs with order intake in Phase 5. Phase 5, following the rule already checked by the database checks ("orders with no lines, not draft or cancelled"): an order may be kept as a draft with no lines, but cannot be created past draft or moved to any status except cancelled without a line (400 or 409 NO_LINES). The owner is asked to confirm.
- **Verification evidence:** qa/sim/phase5-sales.mjs: "an order with no lines may be kept as a draft but cannot go further".
- **First recorded in:** Phase 4 integration audit

### H-012 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** Protection that counts in memory
- **Category:** Scalability: per-instance state
- **Source file or endpoint:** src/backend/src/lib/outbound.js (breaker and counters), middleware rate limits, partner rate limit
- **Evidence:** Code read: the breaker for outside services, its counters on the integration report, and the staff and partner request limits all live in the memory of one server instance. On a host that runs several instances each keeps its own.
- **Expected:** A limit that holds across instances, or a stated bound.
- **Actual:** With N instances a limit is up to N times its number, and the report shows the calls of the instance that answered.
- **Operational impact:** A provider that is down is tried by each instance before each one backs off; a partner can exceed its limit by the number of instances. Nothing is lost or duplicated.
- **Affected dependencies:** E-014.
- **Recommended correction:** A shared counter (a database row or the host's firewall rule) for the limits; the breaker can stay per instance.
- **Deferred: reason:** It needs a shared store or a host firewall rule, which is infrastructure and the owner's host setting; adding a store only for this would be new infrastructure the phase rules ask not to introduce without need.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** As above, together with E-014.
- **Deferred: dependencies:** E-014; the owner's choice between a firewall rule on the host and a shared counter.
- **Deferred: acceptance criteria:** A limit of N per minute holds at N with two instances running.
- **Deferred: verification:** A test that starts two servers on one database and sends 2N requests.
- **Required tests:** Two instances behind one address hold one limit.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **First recorded in:** Phase 4 integration audit

### H-013 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Web shop
- **Workflow:** Checkout
- **Category:** Payment not connected
- **Source file or endpoint:** src/backend/src/services/ecomService.js (checkout); POST /api/ecom/checkout/:id
- **Evidence:** Code read: the web shop checkout takes a payment method from the customer and writes it into the order notes ("Payment: ..."). No payment is authorised, captured or recorded, and the order is not marked paid. Every web order is in effect on account. At the counter, a card sale needs the approval code typed from the card terminal by staff; that is a member of staff attesting, not a customer's browser.
- **Expected:** Either the shop sells on account only and says so, or a card is authorised by a processor and the order is marked paid only on the processor's confirmed notification.
- **Actual:** A payment method is collected and has no effect.
- **Operational impact:** A customer may believe a card was charged. No order is wrongly marked paid: the risk is unpaid orders shipped to customers without terms.
- **Recommended correction:** Owner decision 10: the web shop sells on account only and says so. The checkout form has no payment method; it reads "On account. No card is taken here and nothing is charged now." The server writes "Payment: on account" on every web order whatever the browser sends, and stores no card detail.
- **Required tests:** Per the decision; for a processor: approved, declined, timeout, duplicate notification, refund, and reconciliation against invoices.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Owner's decision 10, 2026-11-15: Built as recommended: (1) a manager ends a shipment that has a problem as lost, destroyed or refused for good, with what happened, and what is not yet credited on its invoice is credited in the same save; nothing is automatic. (2) Invoices and payments are read by sales, managers, leadership and the view-only roles; other staff see only that an invoice exists, its number and status. (3) The web shop takes no payment method and says every web order is on account. Not built, by the same decision: (4) carriers stay as tracking numbers typed by dispatch until a carrier contract exists; (5) the delivery promise screens stay as they are, for demonstration. Still open: (6) accounting. The owner asked for advice on an internal ledger; three answers are needed before it is built (when cost of goods counts, the chart of accounts, the start date). Phase 5: checked again. Web checkout stores no card number and records no payment; no order is marked paid by the shop. Payment scenarios are NOT APPLICABLE until the owner answers. Decided by the owner (decision 10) and built. Card payment through a processor remains not built (H-015).
- **Verification evidence:** qa/sim/phase5-sales.mjs: "web checkout takes no payment and says so: every web order is on account, whatever the browser sends" (fails with the old line restored); qa/sim/ui-phase8.cjs (web checkout: 2 checks).
- **First recorded in:** Phase 4 integration audit

### H-014 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Supplier shipping notices, corrective actions, scorecard and document upload
- **Category:** Placeholder
- **Source file or endpoint:** src/backend/src/routes/partner/supplierRoutes.js
- **Evidence:** Code read: these supplier routes were written against tables and columns that do not exist (there is no table for an advance shipping notice from a supplier, and the corrective-action and scorecard screens are labelled samples).
- **Expected:** A route either works or says it is not available.
- **Actual:** They answered 500.
- **Operational impact:** A supplier integration would fail in a way that looks like our fault on every call.
- **Recommended correction:** They now answer 501 with the code NOT_AVAILABLE and a sentence. Building them needs the purchasing and supplier-quality records to exist first.
- **Deferred: reason:** The records these routes would read and write (supplier shipping notices, corrective actions, scorecards) are sample screens with no tables. They are built with purchasing and supplier quality, not in the integration layer.
- **Deferred: target phase:** The phase the owner issues for purchasing, receiving and supplier quality (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Build the tables and staff screens, then the partner routes on the same service functions.
- **Deferred: dependencies:** X-009; owner decision 4 (build everything).
- **Deferred: acceptance criteria:** A supplier posts a shipping notice that the receiving desk sees; none of the four answers 501.
- **Deferred: verification:** Scenarios in the style of the Phase 4 supplier scenario.
- **Required tests:** Each answers 501, never 500, and changes nothing.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Phase 6: unchanged. Purchase orders and receipts now exist, so a supplier's shipping notice has something to refer to; the notice itself and the supplier quality records are not built (I-011).
- **Verification evidence:** qa/sim/phase4-integration.mjs: "services that are not connected say so instead of pretending".
- **First recorded in:** Phase 4 integration audit

### H-015 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Workflow:** Outside services that are not connected
- **Category:** Disconnected integrations
- **Source file or endpoint:** .env.example; src/backend/src/lib/integrationReport.js
- **Evidence:** Search of the whole repository for outbound calls and provider libraries: the server calls a speech provider, up to three AI providers and partner webhook addresses, and nothing else. Email, text messages, a card processor, carrier rating and labels, a tax service and an accounting system are not connected. The counter-sale "email receipt" route answers 501. Card payments are recorded as an amount and a reference typed by staff; no processor confirms them.
- **Expected:** Each is connected, or the system says plainly that it is not.
- **Actual:** Not connected. Since Phase 4 the integration report lists each one with its state and what happens without it.
- **Operational impact:** Customers get no order, shipping or invoice messages; a card payment is only as true as what was typed; freight is entered by hand; tax is a rate on the order; invoices are re-keyed into accounting.
- **Recommended correction:** For each, the owner picks a provider; the call then goes through the outside-call guard, with a sandbox account for tests.
- **Required tests:** Per provider: success, refusal, time limit, duplicate notification, and a reconciliation.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Owner decision 5 (2026-11-13) puts email and text messages later. Questions for the owner: which card processor, carrier service, tax service and accounting system, if any, and in what order. Payment, shipping-carrier and notification scenarios against a provider sandbox were NOT EXECUTED because no provider exists to test against; nothing was simulated as if it were connected.
- **Verification evidence:** qa/sim/phase4-integration.mjs: "services that are not connected say so instead of pretending" checks the report and the 501 answers.
- **First recorded in:** Phase 4 integration audit

### H-016 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Events that have waited a long time
- **Category:** Reliability: stale events
- **Source file or endpoint:** src/backend/src/services/webhookService.js (deliverDue)
- **Evidence:** Found while testing SQL Editor file 10: rows left waiting by the old code (and any that wait while the scheduler is not running) would all be sent the first time delivery runs, however old. A partner system would be told days later that a shipment "was dispatched".
- **Expected:** An event too old to be useful is not sent on its own.
- **Actual:** Sent whenever delivery next ran.
- **Operational impact:** A partner system acts on old news; on first deployment, every leftover row is sent at once.
- **Recommended correction:** An event that has waited more than 72 hours (WEBHOOK_MAX_AGE_HOURS) is moved to the failed list with the reason in words. An administrator can still send it.
- **Required tests:** A four-day-old event is not sent, is listed, and can be replayed; a fresh one beside it is delivered.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Verification evidence:** qa/sim/phase4-integration.mjs: "an event that waited for days is not sent on its own; a person can still send it".
- **First recorded in:** Phase 4 integration audit

### H-017 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** API
- **Workflow:** A change the database refuses
- **Category:** Contract: server error for a refusal
- **Source file or endpoint:** src/backend/src/middleware/safeErrors.js, lib/db.js, lib/requestContext.js
- **Evidence:** Probe of 22 routes with references to rows that do not exist: the audited modules check first and answer 400. POST /api/users with a home branch that does not exist answered 500. Phase 3 added 16 value checks and 17 foreign keys; any route that does not check first surfaces them as 500.
- **Expected:** A refusal by a database rule is a 4xx with a reason.
- **Actual:** 500 "Something went wrong".
- **Operational impact:** The caller cannot tell a mistake of theirs from a fault of ours; monitoring counts a refusal as an outage.
- **Recommended correction:** When the database refuses a change for a missing reference or a value check and the route answered 500, the reply becomes 409 with the code RULE_REFUSED, a sentence, and the request id. The detail is logged with the note that the route should check first.
- **Required tests:** A unit test of the mapping and a route that used to answer 500.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** This is a safety net, not a replacement for checking in the route. Each such log line names a route to tighten.
- **Verification evidence:** test/safeErrors.test.js (new test). qa/sim/phase4-integration.mjs: "a change the database itself refuses is answered 409 with a reason, not a server error".
- **First recorded in:** Phase 4 integration audit

### H-018 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Heats and traceability
- **Workflow:** Where a heat went
- **Category:** Missing endpoint data
- **Source file or endpoint:** GET /api/heats/:heatNumber/trace (src/backend/src/routes/heats.js)
- **Evidence:** Phase 3 traceability audit: the trace listed the stock items and cut pieces of a heat, not the shipments or customers that received them. The data exists: every shipment takes stock from a named item and writes a movement.
- **Expected:** A heat number returns every shipment and customer that received it, including through pieces cut on a work order.
- **Actual:** Backward trace only.
- **Operational impact:** A recall or a mill-certificate question needed a database query.
- **Recommended correction:** The reply gains two lists, shipments (shipment, order, customer, item, quantity) and customers. Everything it returned before is unchanged.
- **Required tests:** A plate cut on a work order, the pieces shipped: the trace names the shipment, the pounds and the customer.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Status note:** Shipments dispatched on the live system before reservations became mandatory (owner decision of 2026-11-13) wrote no movement and will not appear. Their number is NOT VERIFIED.
- **Verification evidence:** qa/sim/phase4-integration.mjs: "a work order feeds an order line, and the pieces ship under the same order" (3 trace checks; they fail on the code before).
- **First recorded in:** Phase 4 integration audit

### H-019 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Partner API
- **Workflow:** Many events at the same moment
- **Category:** Scalability: events left waiting
- **Source file or endpoint:** src/backend/src/services/webhookService.js (kick, deliverDue)
- **Evidence:** qa/perf/phase4-load.mjs on the 85-branch copy, before: 80 orders confirmed at once for a subscribed customer recorded 80 events per subscription, and only about 12 of 160 were sent; the rest waited for the scheduled run. Each finished request started its own delivery run and all of them reached for the same ten oldest rows. A backlog of 200 events to a partner that takes 200 ms to answer took 42 seconds, one at a time.
- **Expected:** A burst is sent promptly; one slow partner does not hold up the rest; a run fits in the host's time limit.
- **Actual:** As measured.
- **Operational impact:** At a busy moment most events are late by up to the scheduler interval, or indefinitely if the scheduler is not set up.
- **Recommended correction:** One drain per server instance that keeps going until nothing is due; eight deliveries in flight at a time; the scheduled run stops claiming after 20 seconds and reports what it left.
- **Required tests:** Forty confirmations at once: forty events delivered within ten seconds with no scheduled run.
- **Assigned phase:** Phase 4: API contracts, external integrations, event reliability, error recovery and cross-module communication
- **Verification evidence:** qa/sim/phase4-integration.mjs: "forty orders confirmed in the same second: every event is sent, once, without waiting for the scheduled run". qa/results/phase4-load.json against phase4-load-before.json: all 80 delivered after 0.6 s (before: 20.8 s and only after a scheduled run); 500 waiting events cleared at 489 a second (before 119); slow partner 36 a second (before 5).
- **First recorded in:** Phase 4 integration audit

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

### I-007 · P1 · VERIFIED FIXED

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
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Open Phase 6, under owner decision 4 (build every sample module): purchase orders are written and placed by a buyer or the inventory manager, a receipt names the line it fills, the line counts what came (in its own unit: LB, CWT, TON or pieces), and a receipt that does not match the line (grade, product, size, over-receipt, certificate required but not on file) is received on hold with every reason. A purchase order with receipts is closed, not cancelled. No approval rule was invented (K-011). Matching the supplier's invoice is K-012.
- **Verification evidence:** qa/sim/phase6-inventory.mjs: the 16 "Purchasing and replenishment" scenarios, "two receipts against the same purchase order line at once both count"; qa/sim/ui-phase6.cjs: purchase order and receiving checks; qa/tools/db-facts.mjs: purchase order receipt checks at 0.
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
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work. Phase 6: not built. The Phase 6 instruction covers purchasing, receiving and stock; inspection at receipt, nonconformance, corrective actions and supplier scorecards are quality records and stay for the quality phase. What Phase 6 added that they will stand on: suppliers on file (mills and distributors), purchase orders, receipts linked to their lines, and material held at receipt with the reason.
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
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice. Phase 6: see B-009. The second list's writes are retired; the RFID unit tables hold no rows and nothing writes them. Removing them is a destructive schema change and was not made (Phase 6 forbids destructive migrations); it stays with X-009 and B-017.
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

### I-016 · P1 · VERIFIED FIXED

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
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Open Owner decision of 2026-11-13: use the recommendation. POST /api/inventory/adjust corrects one item's balance from a count or by a difference, with a reason (count, damage, scrap, found stock, keying error) and a required note. It writes a movement with the person, the direction and the note, and a history line with before and after. Only branch and company managers and the inventory manager may do it, and only at their own branches. Stock that is reserved or on hold cannot be taken away; the balance cannot go below zero. The stock item screen has a Correct quantity button. Not built: a scheduled cycle-count program (count sheets, a count calendar, approval of large differences); corrections are per item.
- **Verification evidence:** qa/sim/phase3-db.mjs group 7: count down, found stock, a count that agrees, refusals for reserved stock, below zero and ten malformed requests, role and branch limits, and a correction racing a reservation and a shipment. test/stockChanges.test.js. db-facts: corrections with no note or person: 0.
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
- **Status note:** Open Phase 6: unchanged, and confirmed as the rule: a receipt for a heat not on file is refused with "add it under Heats first" (qa/sim/phase6-inventory.mjs, "metal is received only against a heat on file"). Adding several heats at once is a speed improvement for first load and stays deferred.
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

### J-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Quotes and orders
- **Workflow:** Request for quote to quote to sales order
- **Category:** Lost customer requirements; wrong tax and branch
- **Source file or endpoint:** src/backend/src/routes/rfqs.js, quotes.js (createQuote, acceptQuote); new src/backend/src/lib/lineSpecs.js
- **Evidence:** Probe on the QA database, before: a request line kept only a description, quantity and unit, so grade, size, tolerances, certificates and processing typed at the request were nowhere on the quote or the order. A quote saved no tax; the order made from it was untaxed unless someone edited it. The order was filed under the branch of the person who pressed accept, not the branch that owned the request.
- **Expected:** What the customer asked for is typed once and reaches the quote, the order and the shop floor; a quote shows tax by rule 27 and the order carries it; the order belongs to the request's branch.
- **Actual:** Requirements, tax and branch were dropped at each step.
- **Root cause or suspected cause:** Request lines had no place for requirements; quote creation and acceptance were written before rule 27 and branch ownership.
- **Operational impact:** Wrong material or missing certificates shipped; untaxed orders; orders filed and reported under the wrong branch.
- **Recommended correction:** Request lines keep the requirements (validated, stored in their existing JSON column). Quote and order lines get them in their own columns, the quote line may change any of them, the order line keeps the grade record. A quote is taxed by rule 27 at the request's branch and keeps tax and total; acceptance carries them and files the order under the request's branch. No schema change.
- **Required tests:** Requirements, tax, branch and links checked on the saved rows from request to order and invoice; a bad requirement refused with the field named.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "a request for quote keeps grade, size, tolerances, certificates and processing", "request to quote to order: every requirement, the branch, the tax and the links arrive", "a quote line can change a requirement", "a quoted order is reserved, shipped and invoiced with the quote's tax"; src/backend/test/lineSpecs.test.js (5 tests); qa/sim/ui-phase5.cjs: the request and quote screens show the requirements and "subtotal + tax = total". On the code before, the same scenarios fail on every requirement and on tax.
- **First recorded in:** Phase 5 sales operations audit

### J-002 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Customers
- **Workflow:** A closed customer account
- **Category:** Rule not enforced
- **Source file or endpoint:** routes/orders.js, rfqs.js, quotes.js (accept), onlineOrders.js (accept), services/ecomService.js (checkout), routes/customers.js
- **Evidence:** Probe: with the account set inactive, staff order entry, a new request for quote, accepting an open quote and the web shop checkout all succeeded. Closing or reopening an account left no record of who did it.
- **Expected:** A closed account takes no new business in any channel, its history stays readable, and closing and reopening are on the record.
- **Actual:** Only the counter and order intake refused it.
- **Operational impact:** Orders for accounts closed for credit, fraud or a merger; no trace of who closed or reopened one.
- **Recommended correction:** Each channel refuses an inactive buyer with 409 CUSTOMER_INACTIVE and a sentence; the account change writes an audit row (CUSTOMER_DEACTIVATED, CUSTOMER_REACTIVATED) with the person.
- **Required tests:** Every channel refused, nothing saved, history readable, reopening allows the same quote.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "a closed account takes no new business in any channel, and its history stays", "closing and reopening an account is on the record".
- **First recorded in:** Phase 5 sales operations audit

### J-003 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Customers
- **Workflow:** Accounts and divisions
- **Category:** Data integrity
- **Source file or endpoint:** PATCH /api/customers/:id (parentId)
- **Evidence:** Probe: an account could be placed under its own sub-division. Pricing walks up the parents to find the contract, so a loop leaves a division without a defined price.
- **Expected:** A parent is never one of the account's own divisions.
- **Actual:** Saved.
- **Operational impact:** A loop in the account tree; prices found by walking it stop at an arbitrary point.
- **Recommended correction:** Walk up from the new parent and refuse with 400 when the account itself is met.
- **Required tests:** Self, child and grandchild refused; the tree unchanged.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "an account cannot be placed under one of its own divisions".
- **First recorded in:** Phase 5 sales operations audit

### J-004 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Quotes
- **Workflow:** Expired quotes and the sales dashboard
- **Category:** Wrong figures
- **Source file or endpoint:** routes/quotes.js (list), routes/salesDashboard.js
- **Evidence:** Probe: a quote past its valid-until date still listed under Sent or Draft and counted in "awaiting the customer" and the open value; the Expired filter returned nothing, because no job marks quotes expired; dashboard values summed totals including tax.
- **Expected:** A lapsed quote reads, filters and counts as expired (lost), and pipeline values are before tax.
- **Actual:** As described.
- **Operational impact:** Inflated pipeline and win figures; sales staff chase quotes that can no longer be accepted.
- **Recommended correction:** A quote is expired when its date has passed, whatever its stored status: the Expired filter includes those, the open filters leave them out, the dashboard leaves them out of open work and counts them as lost in the period; values use the subtotal. Acceptance of a lapsed quote was already refused.
- **Required tests:** Filters and dashboard deltas measured around one live and one lapsed quote.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "an expired quote cannot be sent or accepted, and is listed as expired, not sent", "the sales dashboard counts open business before tax and leaves expired quotes out".
- **First recorded in:** Phase 5 sales operations audit

### J-005 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Web shop
- **Workflow:** Accepting a web order into a sales order
- **Category:** Wrong branch; wrong unit
- **Source file or endpoint:** routes/onlineOrders.js (accept)
- **Evidence:** Probe: accepting a web order and naming a branch taxed it at that branch's state but filed the order under none (or the acceptor's), and per-piece web lines were saved with the default price unit (per hundredweight).
- **Expected:** The order is taxed and filed at one and the same branch, and each web line keeps its per-piece price.
- **Actual:** As described.
- **Operational impact:** Branch reports and stock reservations at the wrong branch; a line total that a recalculation would change by a factor of a hundredweight.
- **Recommended correction:** The named branch is checked and becomes the order's branch; web lines are saved as EACH; an inactive buyer is refused.
- **Required tests:** Tax, branch and unit on the saved order; a second accept refused; a one-branch clerk refused another branch.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "accepting a web order: taxed and filed at one branch, priced per piece".
- **First recorded in:** Phase 5 sales operations audit

### J-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Retail POS
- **Workflow:** Counter order at the retail outlet
- **Category:** Wrong tax
- **Source file or endpoint:** src/frontend/src/pages/Orders/RetailPOSPage.jsx
- **Evidence:** Code read and probe: the screen sent the fixed branch "JACKSON" (Jackson, Michigan) for every sale, for the tax estimate and for the order, whatever branch the clerk worked at.
- **Expected:** A counter order is taxed and filed at the clerk's branch (rule 27, owner decision 2).
- **Actual:** Every sale taxed in Michigan.
- **Operational impact:** Wrong sales tax collected and reported at every outlet outside Michigan.
- **Recommended correction:** The screen takes the clerk's branches from the server (GET /api/orders/intake/branches) and uses the home branch; the server refuses a branch that is not the clerk's.
- **Required tests:** Browser: the tax request names the home branch; API: the old fixed branch refused for an Ohio clerk, the own branch taxed in Ohio.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/ui-phase5.cjs: "Retail POS: tax is estimated at the home branch"; qa/sim/phase5-sales.mjs: "the counter sells from the cashier's branch; another branch is refused, a manager can choose".
- **First recorded in:** Phase 5 sales operations audit

### J-007 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Home page
- **Workflow:** The first screen after sign-in
- **Category:** Made-up data
- **Source file or endpoint:** src/frontend/src/pages/Dashboard/DashboardPage.jsx (route /)
- **Evidence:** Code read: the home page showed fixed figures, four invented orders (for example SO-2024-001 for "Acme Steel Co") and invented alerts ("Carrier reported 2hr delay on route 45"), not records.
- **Expected:** Every figure, order and alert on the home page comes from the records.
- **Actual:** Invented.
- **Operational impact:** Staff act on orders and alerts that do not exist; real holds go unseen.
- **Recommended correction:** The page reads GET /api/dashboard: stock on hand and available, open orders, quality holds, recent orders and hold alerts. The invented rows and the stock panel built on them are removed.
- **Required tests:** Browser: the open-order count equals the server's; none of the invented rows shown.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/ui-phase5.cjs: "home: Open Orders is the server's count", "home: none of the old made-up orders or alerts".
- **First recorded in:** Phase 5 sales operations audit

### J-008 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-14
- **Module:** Customers
- **Workflow:** Customer preferences
- **Category:** Business rule not decided
- **Source file or endpoint:** src/frontend/src/pages/Customers/CustomerPreferencesPage.jsx; table CustomerPreference
- **Evidence:** Code search: Default Discount %, Fuel Surcharge Exempt, Auto-Approve Orders, Require PO Number, Minimum Order Quantity and Minimum Order Value are saved and read back, and no order, quote, price or checkout reads them. Extends S-020 and U-012 (the discount) to five more fields.
- **Expected:** A setting either does what its name says or says that it does nothing yet.
- **Actual:** Six settings look active and do nothing.
- **Operational impact:** Staff believe a customer gets a discount, must give a PO number or is held to a minimum, and none of it happens.
- **Recommended correction:** Interim, done: each field now says "Saved for reference. Not applied to any order or price yet." Applying them needs the owner's rules (how a discount combines with a contract tier, which channels, what a minimum blocks), which were not invented.
- **Required tests:** Per the decision; for each rule a refusal or price test in every channel.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Question for the owner: which of these six should take effect, and for a discount, does it apply on top of the contract tier, instead of it, or only when there is no tier?
- **First recorded in:** Phase 5 sales operations audit

### J-009 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Order intake and shop floor
- **Workflow:** Work orders made from a sales order
- **Category:** Lost customer requirements
- **Source file or endpoint:** routes/intakeOrders.js (create-work-orders, buildIntakeLines)
- **Evidence:** Probe: a work order made from an order line got only the line description; size, tolerance, certificates, finish and notes typed at order entry or carried from the quote stayed on the order line.
- **Expected:** The shop floor sees what the customer asked for.
- **Actual:** Description only.
- **Operational impact:** Material cut or finished to the wrong requirement; certificates missed.
- **Recommended correction:** Order entry lines keep the requirement fields; a work order's instructions carry them as text and its notes keep them as data. Asking twice makes no second job (unchanged).
- **Required tests:** Job instructions and notes checked after a quoted order and after an intake order.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "the accepted order goes to the shop floor with what the customer asked for", "requirements typed at order entry reach the order line and the work order".
- **First recorded in:** Phase 5 sales operations audit

### J-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Web shop
- **Workflow:** A web order with no customer account
- **Category:** Rule not enforced
- **Source file or endpoint:** routes/onlineOrders.js (accept)
- **Evidence:** qa/sim/phase5-sales.mjs, first run: a web order placed by a staff login with no customer named reached the inbox as "Online Customer"; accepting it made a confirmed sales order with no buyer, so no credit check, no exemption and no account to bill.
- **Expected:** A sales order is made only for a customer account.
- **Actual:** A sales order with no buyer.
- **Operational impact:** Unbillable orders released to the floor; credit limits skipped.
- **Recommended correction:** Acceptance refuses with 400 CUSTOMER_REQUIRED until the CSR names the customer; the inbox now shows the server's reason instead of "Action failed".
- **Required tests:** Accept with no customer refused and nothing made; with a customer named, accepted.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "a web order cannot be placed without signing in" (staff order with no customer cannot become a sales order). Failed before the change (200 and an order made).
- **First recorded in:** Phase 5 sales operations audit

### J-011 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Pricing
- **Workflow:** Price check and tax estimate on the order screens
- **Category:** Input validation
- **Source file or endpoint:** routes/intakePricing.js (POST /api/pricing/calculate, /tax-estimate)
- **Evidence:** qa/sim/phase5-sales.mjs, first run: a weight of -500 lb was priced at -1,225.00; a quantity of "heavy" priced at 0; a remnant discount of 150% would give a negative price; a negative subtotal was "taxed" at -5.75.
- **Expected:** A nonsense amount is refused with a sentence.
- **Actual:** Priced.
- **Operational impact:** A screen can show a negative or zero line; saved orders were already protected by the order rules, so no wrong order could be saved.
- **Recommended correction:** Weight and quantity must be numbers of zero or more; a remnant discount a fraction below 1; a subtotal zero or more. Refused with 400.
- **Required tests:** Each bad amount refused.
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Verification evidence:** qa/sim/phase5-sales.mjs: "a price check with a negative or nonsense amount is refused, never priced below zero". Failed before the change.
- **First recorded in:** Phase 5 sales operations audit

### J-012 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-14
- **Module:** Retail POS
- **Workflow:** Adding a remnant at the counter
- **Category:** Traceability
- **Source file or endpoint:** src/frontend/src/components/pos/RemnantQuickAdd.jsx
- **Evidence:** Code read: the remnant quick-add takes the remnant's location as free text (it used to default to "JACKSON"); it is not one of the stock items on file.
- **Expected:** A remnant sold at the counter is a stock item on file, so the sale takes it off the books.
- **Actual:** Free text, linked to no stock item (code read), so the sale has no stock record to reduce.
- **Operational impact:** Remnants sold at the counter stay on the books.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Phase 5 removed the fixed Michigan default. Picking a remnant from stock is a stock-traceability change. Phase 6: folded into K-006. The counter remnant quick-add reads the Steel Outlet remnant list, which is not linked to stock. Connecting it waits for the remnant pricing and valuation rule (S-009, K-006).
- **First recorded in:** Phase 5 sales operations audit

### J-013 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-14
- **Module:** Order intake
- **Workflow:** Order entry header
- **Category:** Accessibility
- **Source file or endpoint:** src/frontend/src/pages/Orders/CSRIntakePage.jsx (Source, Division, Location, Priority selects)
- **Evidence:** Browser check (qa/sim/ui-phase5.cjs): the Location select cannot be found by its label; the MUI selects have a visible label with no link to the field, so a screen reader announces them without a name.
- **Expected:** Each field has an accessible name.
- **Actual:** Visible label only.
- **Operational impact:** Screen reader users cannot tell the header fields apart.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Phase 9: the four selects on order entry, and every other field in the product, have a name a screen reader can say (V-006).
- **Verification evidence:** qa/sim/ui-audit.cjs final run: 0 fields with no label on /orders/intake and on every other screen; held at 0 by qa/tools/ui-audit-gate.cjs.
- **First recorded in:** Phase 5 sales operations audit

### K-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Reservations
- **Workflow:** Reserving a stock item for an order line
- **Category:** Data integrity: wrong material or quantity reserved
- **Source file or endpoint:** src/backend/src/routes/orders.js (POST /:id/allocate); new src/backend/src/lib/reservationRules.js
- **Evidence:** Probe on the QA database, before: a line for 3 pieces reserved "3" from an item counted in pounds, so 3 lb left the balance when it shipped; a line for one grade reserved stock of another; a 135 inch line reserved a 96 inch plate (the order simulation did this 17 times in one seed); material owned by one customer could be reserved for another.
- **Expected:** A reservation is accepted only when the item can fill the line: same unit, same grade, large enough, thickness inside the tolerance the line gives, and owned by the house or by the buyer.
- **Actual:** Only the quantity and the branch were checked.
- **Root cause or suspected cause:** The reservation route was written around weight alone.
- **Operational impact:** The wrong material shipped against an order; stock balances reduced by pieces as if they were pounds; a customer's own material shipped to someone else.
- **Recommended correction:** reservationProblem() refuses with 409 and a code (UNIT_MISMATCH, GRADE_MISMATCH, SIZE_MISMATCH, OWNER_MISMATCH, IN_TRANSIT) and a sentence. Thickness is compared only when the line gives a tolerance.
- **Required tests:** Each refusal with nothing reserved; the fitting case accepted.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "a line counted in pieces cannot reserve stock counted in pounds", "stock of another grade cannot be reserved for a line", "a piece smaller than the line needs cannot be reserved for it", "thickness is held to the line's own tolerance", "material a customer owns can be reserved only for that customer"; src/backend/test/phase6Rules.test.js (3 tests). The order simulation's first run on the new rule failed 17 jobs whose lines were longer than the stock; the generator now cuts lines from the item.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-002 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Purchasing
- **Workflow:** Placing a purchase order
- **Category:** Wrong department rule
- **Source file or endpoint:** src/backend/src/lib/roleAccess.js; new src/backend/src/routes/purchaseOrders.js
- **Evidence:** Code read and probe: a purchase order is an order of type PO saved through /api/orders, whose department rule is sales. A buyer or the inventory manager got 403; a sales clerk could create one.
- **Expected:** Purchasing belongs to the people who buy (owner decision 3).
- **Actual:** Only sales logins could save a purchase order.
- **Operational impact:** Buyers cannot record what they ordered; sales staff can.
- **Recommended correction:** /api/purchase-orders takes the same routes for purchase orders only, for the buyer, the inventory manager and managers. The order type is forced to PO; a sales order is not found through it.
- **Required tests:** Buyer accepted, sales and operator refused, a sales order not reachable through the address.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "a buyer places a purchase order at their own branch", "a sales login cannot place a purchase order, and nothing is saved", "the purchase order address only ever shows and changes purchase orders"; qa/sim/ui-phase6.cjs: purchase order checks.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-003 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Returns
- **Workflow:** A customer return that is scrapped
- **Category:** Ledger does not add up
- **Source file or endpoint:** src/backend/src/routes/returns.js (receive)
- **Evidence:** Code read: receiving a return with disposition SCRAP wrote one SCRAP movement against the item it shipped from and did not change the balance. The item's movements then added up to less than its balance by the scrapped quantity.
- **Expected:** An item's history adds up to its balance after every step.
- **Actual:** A scrapped return left the history short.
- **Operational impact:** The reconciliation check reports the item as out of balance, or a later correction "fixes" a balance that was right.
- **Recommended correction:** The return is written coming back (RECEIVE, reason CUSTOMER_RETURN, "returned for scrap") and going out (SCRAP). The balance is unchanged and the history adds up.
- **Required tests:** History equals balance after a scrapped return.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "a return that is scrapped is recorded coming back and going out, so the history still adds up".
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-004 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Returns
- **Workflow:** A customer return that goes back to stock
- **Category:** Wrong unit; no inspection step
- **Source file or endpoint:** src/backend/src/routes/returns.js (receive)
- **Evidence:** Code read and probe: a returned quantity was added to the item's balance whatever unit the item is counted in (3 pieces became 3 lb), an item on its way to another branch could be restocked into, and there was no way to bring a return back without putting it straight on sale.
- **Expected:** A return goes back in the item's own unit, and material that needs a look is held until someone has looked.
- **Actual:** As described.
- **Operational impact:** Wrong balances; returned material resold before inspection.
- **Recommended correction:** RESTOCK and the new INSPECT disposition refuse a unit mismatch and an item in transit. INSPECT restocks on a PENDING_TEST hold. An item that had shipped out entirely becomes available again.
- **Required tests:** Restock, inspect and scrap each checked on the balance, the hold and the history.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "a return to restock goes back on the item it shipped from", "a return for inspection comes back on hold until someone has looked at it", "more cannot be returned than shipped".
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-005 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Stock items
- **Workflow:** Holds placed by the system
- **Category:** One rule in one place
- **Source file or endpoint:** new src/backend/src/lib/holds.js; routes/coils.js
- **Evidence:** Code read: placing and releasing a hold lived inside the stock item route, so a step that needed to hold material on arrival would have had to copy it.
- **Expected:** A hold means the same thing wherever it is placed.
- **Actual:** One copy, inside a route.
- **Operational impact:** Low today; three new steps in this phase place holds.
- **Recommended correction:** placeHold and releaseHold in lib/holds.js, used by the stock item screen, transfer receipt, purchase order receipt and return inspection.
- **Required tests:** Hold and release checked through each of the four.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Verification evidence:** qa/sim/phase6-inventory.mjs: the hold scenarios in receiving, transfers and returns; qa/sim/security.mjs "Stock items: lists, cost, edits, holds" unchanged and passing.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-006 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-15
- **Module:** Steel Outlet remnants
- **Workflow:** Selling a remnant
- **Category:** Third stock list
- **Source file or endpoint:** src/backend/src/routes/remnants.js, table Remnant; src/frontend/src/components/pos/RemnantQuickAdd.jsx
- **Evidence:** Schema and code read, and qa/sim/phase6-inventory.mjs "the Steel Outlet remnant list is separate from stock": the outlet's Remnant table has no link to a stock item, its "reserve" is a flag, and reserving or selling one moves no stock balance. Remnants made by a work order or entered against a parent are stock items and are fully traced; the outlet list is a different list of the same kind of material.
- **Expected:** One stock list (owner decision 1): an outlet remnant is a stock item, and selling it takes it off the books.
- **Actual:** A separate list.
- **Operational impact:** A remnant can be sold at the outlet and still be on the books, or the reverse. Includes J-012 (the counter remnant quick-add).
- **Recommended correction:** Make the outlet list a view of stock items that are remnants (parent item set, or flagged), keep its pricing fields beside the item, and make reserve and sale use the stock reservation and counter-sale rules. The outlet price of a remnant needs the owner's rule first (S-009: the 15% and 25% discounts fixed in code).
- **Required tests:** A remnant sold at the outlet leaves the books once and returns on a void.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Question for the owner: how is a remnant priced and valued (S-009)? The connection is not built until that is answered, because the outlet list is where the remnant price lives today.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-007 · P1 · IN PROGRESS

- **Discovered:** 2026-11-15
- **Module:** Inventory valuation
- **Workflow:** What stock is worth
- **Category:** Business rule not decided
- **Source file or endpoint:** Inventory.unitCost, landedCost, avgCost; Coil.unitCost, landedCost; lib/receiving.js
- **Evidence:** Schema and code read, and qa/sim/phase6-inventory.mjs "receiving does not create a cost": a receipt records no cost, even against a purchase order line that has a price. Cost is typed on the item by a manager afterwards. Inventory.avgCost is never written. No movement carries a value, so scrap, shortage, count variance and cost of goods sold have no amount.
- **Expected:** A costing method chosen by the owner (actual cost per item, average, or standard), applied at receipt and carried by every movement.
- **Actual:** No cost unless typed by hand.
- **Operational impact:** Inventory value, margin and the cost of scrap and shortages cannot be reported from the records.
- **Recommended correction:** Not made: the instruction forbids changing costing rules without authorisation. Recommended: actual cost per item from the purchase order line at receipt (steel is bought and traced by the item), landed cost added when freight is known, pieces inherit cost by weight.
- **Required tests:** Per the decision: receipt, cut, scrap, transfer and shipment each carry the value; the sum of item values equals the ledger.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): actual cost per item. A receipt against a purchase order line now records the item's cost per stocked unit from the line's price (per hundredweight, pound or ton for stock kept in pounds; each for stock kept in pieces). Pieces cut by a work order and pieces received from a parent carry the parent's cost. A price that cannot be turned into a unit cost (for example per foot for stock kept in pounds) leaves the cost empty. Still open: stock already on hand has no cost unless typed; landed cost (freight, duty) is not worked out; stock movements carry no value, so scrap, shortage and count variance have no amount; Inventory.avgCost is still never written; there is no valuation report. These belong to Phase 8 (accounting). Phase 8: shipment movements now carry the item's unit cost (N-017). A valuation report and a ledger are not built (N-025).
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "an item's cost is taken from its purchase order line when it is received, and the pieces cut from it carry the same cost per pound"; qa/sim/phase6-inventory.mjs "receiving records the cost from the purchase order line". Mutation: 2 rules removed in turn, group 6 fails each time.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-008 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-15
- **Module:** Cycle counts
- **Workflow:** Counting stock
- **Category:** Not built; rule not decided
- **Source file or endpoint:** POST /api/inventory/adjust (one item at a time)
- **Evidence:** Code read: a manager or the inventory manager can correct one item to a counted quantity with a note, and the count is recorded. There is no count sheet, no schedule, no blind count, no recount and no threshold above which a variance needs a second person.
- **Expected:** A count program whose frequency, tolerance and approval the owner sets.
- **Actual:** Single-item correction only.
- **Operational impact:** Counts are done item by item with no record of what was due or missed.
- **Recommended correction:** Not built: the frequency, the variance that needs approval and who approves are the owner's. The single-item count, its refusals and its record are verified.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Question for the owner: how often is each class of stock counted, and what size of variance needs a manager's approval?
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-009 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-15
- **Module:** Warehouse locations
- **Workflow:** Bins and putaway
- **Category:** Master data
- **Source file or endpoint:** Location table (85 rows, all branches); Coil.binLocation (free text)
- **Evidence:** Database read: every Location row is a branch. A bin is free text on the item, so two spellings of one bin are two bins, a bin that does not exist is accepted, and nothing lists what is in a bin except a text search.
- **Expected:** Bins on file per branch, chosen from a list.
- **Actual:** Free text.
- **Operational impact:** Slower picking and mis-typed bins; no capacity or zone rules possible.
- **Recommended correction:** Not built in this phase: a bin master needs each branch's real layout, which is not on file. Putaway to a typed bin is verified.
- **Required tests:** A bin not on file refused; a bin lists its items.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Question for the owner: do the branches want bins on file (each branch supplies its list), or is a typed bin enough?
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-010 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-15
- **Module:** Replenishment
- **Workflow:** Deciding what to buy
- **Category:** Not built; rule not decided
- **Source file or endpoint:** new GET /api/purchase-orders/supply-position; Purchase orders screen, Supply position tab
- **Evidence:** Schema and code read: only spare parts have a reorder point. For material there was nothing: no minimum, no maximum, no view of what is on order or coming by transfer against open sales.
- **Expected:** The buyer sees the position per branch and grade, and reorder levels the owner sets raise suggestions.
- **Actual:** Nothing.
- **Operational impact:** Buying from memory; stock-outs and double orders.
- **Recommended correction:** Built: the supply position (on hand, free, reserved, on hold, sent in transit, on order, coming by transfer, open sales not reserved, projected free), kept to the person's branches. Not built: minimums, maximums and suggested orders, which are the owner's numbers. No purchase order is created by the system.
- **Required tests:** On-order and on-hand deltas around an order and a receipt; branch boundary.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** The supply position is VERIFIED. Question for the owner: is a reorder point wanted per grade and branch, and who sets it?
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "the supply position shows what is on order and moves it to on hand when it arrives", "the supply position keeps to the branch the person works at, and suggests nothing"; qa/sim/ui-phase6.cjs: "supply position: rows for my branch only".
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-011 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-15
- **Module:** Purchasing
- **Workflow:** Receiving against a purchase order line
- **Category:** Business rule not decided
- **Source file or endpoint:** src/backend/src/lib/receiving.js (matchPurchaseLine)
- **Evidence:** Built in this phase with the narrowest rule that invents nothing: a receipt is compared with the line as written. Size is held to the tolerance on the line and is exact when the line gives none; any quantity over the line is an over-receipt; a mismatch is received on hold, never refused.
- **Expected:** The owner's receiving tolerances: how much over or under a line is acceptable, and whether a mismatch is held or refused.
- **Actual:** Exact, held.
- **Operational impact:** More holds than the business may want (a mill shipping 2% over is normal), until a tolerance is set.
- **Recommended correction:** A percentage over-receipt tolerance and a default size tolerance, once the owner gives them. No approval step for purchase orders was invented either.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** Questions for the owner: what over-receipt is accepted without a hold (for example 5% or 10%), and does a purchase order above some value need approval before it is placed?
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-012 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-15
- **Module:** Purchasing
- **Workflow:** Matching the supplier's invoice
- **Category:** Not built
- **Source file or endpoint:** No table or route
- **Evidence:** Schema read: purchase orders and receipts now exist and are linked; nothing records a supplier's invoice or compares it with what was ordered and received.
- **Expected:** A supplier invoice is checked against the order and the receipts before it is paid.
- **Actual:** Not recorded.
- **Operational impact:** Payables are checked outside the system.
- **Deferred: reason:** Supplier invoices and payables are accounting records; no payables module exists and none is in the scope of Phase 6.
- **Deferred: target phase:** The phase the owner issues for finance, costing and supplier invoices
- **Deferred: required correction:** A supplier invoice record matched to purchase order lines and receipts, with the costing decision K-007.
- **Deferred: dependencies:** K-007.
- **Deferred: acceptance criteria:** An invoice for more than was received is flagged.
- **Deferred: verification:** A scenario that receives short and invoices in full.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-013 · P3 · BLOCKED

- **Discovered:** 2026-11-15
- **Module:** Scanning
- **Workflow:** Finding an item by scanning its tag
- **Category:** Not verified
- **Source file or endpoint:** GET /api/coils/number/:coilNumber; stock items screen search
- **Evidence:** An item is found by its exact number through the server, which is what a keyboard-wedge scanner types. No scanner, label printer or RFID reader was available in this environment. The old RFID scan write (/api/v1/inventory/rfid-scan) wrote to the retired second stock list and is switched off.
- **Expected:** Scanners used at the branches are tested with the screens.
- **Actual:** Lookup by typed or pasted number verified; hardware not tested.
- **Operational impact:** Unknown until tried at a branch.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Status note:** HARDWARE NOT VERIFIED: blocked on access to the scanners, printers and readers the branches use. No claim of compatibility with any scanner, printer or reader is made.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-014 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Stock items
- **Workflow:** How an item in transit is shown in lists
- **Category:** Clarity
- **Source file or endpoint:** Coil.status; stock items list
- **Evidence:** An item in transit keeps its item status (for example AVAILABLE) and its balance carries the in-transit state. The item's own page says it is in transit and switches Move off; the stock list shows the item status and a free quantity of 0.
- **Expected:** The list says "in transit" on the row.
- **Actual:** Shown on the item page and the Transfers screen only.
- **Operational impact:** A person reading only the list sees an available item with nothing free.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Phase 9: a stock item on its way to another branch says "In Transit" on its row in the stock list. The list answer now carries the stock record's state.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "an item on its way to another branch says In Transit on its row in the stock list (K-014)"; qa/tools/phase9-mutations.cjs 25.
- **First recorded in:** Phase 6 inventory and purchasing audit

### K-015 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Stock items
- **Workflow:** A hold or release at the same moment as another change to the same item
- **Category:** Reliability: lock order
- **Source file or endpoint:** src/backend/src/lib/holds.js
- **Evidence:** Second full gate run of Phase 6, scenario "forty stock changes at once": one hold answered 500. The server log shows PostgreSQL error 40P01, deadlock detected: the hold had updated the item and was waiting for its balance while a count correction held the balance and was waiting for the item.
- **Expected:** Every stock change takes the balance row first and the item second, so two changes queue.
- **Actual:** A hold and a release took the item first. The database ended one of the two transactions; nothing was saved wrongly, and the person saw "Could not place the hold".
- **Operational impact:** Rare: needs two people changing one item in the same instant. No balance was wrong. The person had to try again with no explanation.
- **Recommended correction:** placeHold and releaseHold lock the balance row first, like lib/stockChanges.js and lib/transfers.js.
- **Required tests:** Holds and releases raced against counts and cuts on the same items, many at once: no server error, books in balance.
- **Assigned phase:** Phase 6: inventory, purchasing, receiving, reservations, replenishment, material traceability, remnants, scrap and interbranch transfer
- **Verification evidence:** qa/sim/phase6-inventory.mjs: "a hold queues behind a stock change in progress on the same item instead of deadlocking" (with the lock removed the hold answers 500; with it, 201), "a hold racing counts and cuts on the same item never ends in a server error" (144 requests on 12 items) and "forty stock changes at once leave every balance in step".
- **First recorded in:** Phase 6 inventory and purchasing audit

### L-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Quality control
- **Workflow:** Releasing a job from inspection
- **Category:** Quality control bypass
- **Source file or endpoint:** src/backend/src/routes/jobs.js (every status address); new src/backend/src/lib/jobGates.js and lib/productionRules.js
- **Evidence:** Probe on the QA database, before: a sales login moved a job from waiting for inspection to ready to ship with no inspection on file (200). After an inspection failed, the same login moved the job from on hold to ready to ship (200). A job sent back for rework was started and completed straight to ready to ship with no second inspection (200).
- **Expected:** Only a passed inspection moves a job on from inspection, and a job whose last inspection failed cannot be packed, shipped or completed until a new inspection passes.
- **Actual:** The job move table allowed the moves and nothing looked at the inspections.
- **Root cause or suspected cause:** Job status and inspection result were two unconnected records; five routes each changed the status in their own way.
- **Operational impact:** Material that was never inspected, or that failed inspection, could be shipped to a customer.
- **Recommended correction:** Every job status change now goes through one function (changeJobStatusTx) that locks the job and applies the quality gate: no release with an inspection open, none after a failed inspection, none from the inspection queue without a pass recorded since the job arrived there. "Complete" on a reworked job sends it to inspection.
- **Required tests:** Each bypass refused at every address and for every role; the legitimate path still works.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job waiting for inspection cannot be released by hand", "a job that failed inspection cannot be packed, shipped or completed by any route until a new inspection passes", "sent for rework, a job goes back to the floor with the instructions and must pass a new inspection"; src/backend/test/phase7Rules.test.js; with the gate removed two quality scenarios fail (mutation run); qa/tools/db-facts.mjs "jobs past inspection whose latest decided inspection failed" at 0.
- **First recorded in:** Phase 7 manufacturing audit

### L-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Quality control
- **Workflow:** Deciding an inspection
- **Category:** Quality control weakened
- **Source file or endpoint:** src/backend/src/routes/qcRoutes.js
- **Evidence:** Probe, before: an inspection with a required check marked FAIL was passed (200). A conditional pass was accepted with no conditions and replaced the inspector's notes. Found while writing the scenarios: a conditional pass could carry the disposition SCRAP or REWORK and still send the job to packaging.
- **Expected:** A pass needs every required check answered as passed and no measurement out of tolerance; a conditional pass states its conditions and keeps what the inspector wrote.
- **Actual:** The pass address saved whatever it was sent.
- **Operational impact:** A recorded failure could be signed off as a pass; the reason for a concession was lost.
- **Recommended correction:** Pass is refused with 409 naming the failed or unanswered check or the measurement out of tolerance. Conditional pass requires conditions, keeps earlier notes beneath them, and accepts only USE_AS_IS or SELL_SECONDARY. Dispositions are validated.
- **Required tests:** Each refusal leaves the inspection open and the job waiting; the valid cases are saved as entered.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "an inspection cannot be passed with a required check unanswered or failed, or a measurement out of tolerance", "a conditional pass must state its conditions, keeps the inspector's earlier notes, and cannot carry a disposition that says the material is not going on"; qa/sim/ui-phase7.cjs: the screen refuses a conditional pass with no conditions; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-003 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Quality control
- **Workflow:** Opening and deciding inspections at the same moment
- **Category:** Concurrency and audit trail
- **Source file or endpoint:** src/backend/src/routes/qcRoutes.js
- **Evidence:** Probe, before: two inspections could be opened for one job (201, 201). The decision and the job move were separate writes. The audit log did not say which signed-in person decided. An inspection could name an inspector who is not on file, at creation and (found this phase) by editing.
- **Expected:** One open inspection per job; a decision and the job's move are one step; who decided is on record.
- **Actual:** No lock and no check.
- **Operational impact:** Two inspectors could reach different results on one job; the job could be left in a state that matched neither.
- **Recommended correction:** Opening and deciding lock the job. One open inspection per job. The decision, the job move and an audit row INSPECTION_DECIDED (with the signed-in user, result, disposition and where the job went) are one transaction. The inspector is validated on create and edit; checklist and measurements must be lists.
- **Required tests:** Pass and fail sent together: one wins and inspection, job, history and audit agree.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job has one open inspection at a time, even when two inspectors open one at the same moment", "an inspection passed and failed at the same moment has one result" (6 rounds), "passing an inspection moves the job to packaging in the same step, and records who decided", "an open inspection can be filled in as the inspector goes"; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-004 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Shop-floor operations
- **Workflow:** Starting, pausing and finishing a step
- **Category:** Execution state rules
- **Source file or endpoint:** src/backend/src/routes/operationsRoutes.js; lib/productionRules.js; lib/settings.js (production.rules)
- **Evidence:** Probe, before: step 2 started before step 1 (200); a step that was never started was completed (200); a completed step was started again and went back to in process (200); a step with nothing running was "paused" (200). This is finding B-011 confirmed by running it.
- **Expected:** A step is started, then paused or finished; a finished step stays finished; steps follow the planned order if the owner says so.
- **Actual:** No check of the step's present state.
- **Operational impact:** Start and end times and labor time could be overwritten or invented; a job could reach inspection with work recorded out of order.
- **Recommended correction:** State rules decided on the locked plan: complete requires started, pause requires a running clock, a finished step cannot be restarted, nothing starts on a job that is closed, on hold or past production. Planned order is the owner's decision of 2026-11-15 (decision 8): a step cannot start until the steps before it are finished. The rule is one setting (production.rules.stepsInOrder), on by default.
- **Required tests:** Each refusal with no clock started; the order rule on, off and by default; two starts at once leave one clock.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "steps run in their planned order", "the planned-order rule is one setting", "a step that was never started cannot be finished", "finishing the last step sends the job to inspection once; finishing it again changes nothing", "pausing closes the clock with the reason given", "two operators starting the same step at the same moment leave one clock running"; qa/sim/phase2-integrity.mjs (two new checks); mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-005 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Shop-floor operations
- **Workflow:** Who and where a step is run
- **Category:** Location isolation and qualification
- **Source file or endpoint:** src/backend/src/routes/operationsRoutes.js (checkWho); lib/productionRules.js
- **Evidence:** Probe, before: a step of a QA-L01 job was started at a QA-L02 work center by a QA-L02 operator (200). A step could be started on a work center of another kind or one switched off, by an operator whose certification had expired or who was inactive.
- **Expected:** A step runs on a work center of its own kind at the job's branch, by an active operator of that branch whose certification for that kind, if on file, has not expired.
- **Actual:** Only that the operator and work center existed.
- **Operational impact:** Work recorded at the wrong branch; time booked against a machine that cannot do the step; lapsed certifications ignored.
- **Recommended correction:** checkWho() refuses with 409 and a sentence naming the work center, branch, operator or the certification and its expiry date. The same check applies to reassigning a step.
- **Required tests:** Each refusal; a valid start; a reassign.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a step is run only on a work center of its own kind, at the job's branch, that is switched on", "an operator whose certification has lapsed, who is inactive, or who works at another branch cannot start a step", "a step is moved to another work center or operator only where it can be run"; qa/tools/db-facts.mjs "steps running on a work center of another kind, or at another branch"; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Jobs
- **Workflow:** Moving a job out of production
- **Category:** Work order integrity
- **Source file or endpoint:** lib/jobGates.js (gateError); lib/productionRules.js (openStepsError)
- **Evidence:** Probe, before: a job with two planned steps, neither finished, was completed by hand to ready to ship (200).
- **Expected:** A job with planned steps leaves production when its steps are finished.
- **Actual:** The steps were not consulted.
- **Operational impact:** A job could be shipped with planned work not done and no time recorded.
- **Recommended correction:** A move to inspection, packaging, ready to ship, shipped or completed is refused with 409 naming the first open step. Cancelling and holding are still allowed.
- **Required tests:** Refused at every address; cancel and hold accepted.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job cannot leave production while a planned step is unfinished", "a job put on hold while its last step is running stays on hold when the step is finished"; qa/tools/db-facts.mjs "jobs past production with a planned step unfinished" at 0; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-007 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Scheduling
- **Workflow:** Running the scheduling engine for a branch
- **Category:** Scheduling and capacity
- **Source file or endpoint:** src/backend/src/routes/dispatchRoutes.js (POST /run); new src/backend/src/lib/dispatchPlan.js
- **Evidence:** Probe, before: the run scheduled steps of a cancelled job; it chose an operator whose certification had expired; it considered operators of other branches; it wrote a start time for every step though no duration is on file; it gave no reason for steps it left unplaced. Two runs at once could both place a step. Found while writing the scenarios: a production manager of one branch could run the engine for another branch (200).
- **Expected:** Open jobs only, this branch's qualified people and machines, no invented times, a reason for anything unplaced, one run at a time, own branch only.
- **Actual:** As described.
- **Operational impact:** Work queued for cancelled jobs; unqualified assignments; start times nobody had grounds for.
- **Recommended correction:** The decision is a pure function (planAssignments). The run takes a per-branch lock, places steps of open jobs only, uses this branch's operators with a current certification, skips machines that are off or locked out, writes a start time only for the step at the front of a queue, and returns what it could not place and what it did not check (for example thickness, where a work center has no limit on file). A branch planner gets 403 for another branch. The writes are grouped (one statement per work center, operator and queue position), which took a run at a branch with 7,090 waiting jobs from 45 seconds to under 2. Another branch's run is refused with 403.
- **Required tests:** Each case; three runs at once place each step once.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: the first 12 "Capacity planning and scheduling" scenarios; qa/sim/ui-phase7.cjs: the shop-floor screen reports what was placed and what was not, with the reason; src/backend/test/phase7Rules.test.js; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-008 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Scheduling
- **Workflow:** The job planner: preview, apply, what-if
- **Category:** Invented planning figures; unchecked write
- **Source file or endpoint:** src/backend/src/routes/optimizationV1.js; new src/backend/src/lib/capacityPlan.js; src/frontend/src/apps/optimization/WorkOrderOptimizationPage.jsx
- **Evidence:** Code read and probe, before: every job with no estimate was given 60 minutes and every work center 480 minutes a day, and utilisation was reported from those. Apply wrote whatever the browser sent: a work center at another branch, an end before the start, a job already finished; it answered "applied 2" having checked nothing.
- **Expected:** Figures come from the records or are reported as not known; a schedule line is checked on the server before it is saved.
- **Actual:** Assumed figures presented as real; an unchecked write.
- **Operational impact:** A capacity picture nobody had entered; jobs moved to machines that could not run them.
- **Recommended correction:** A job takes its time from its routing (set-up plus machine minutes) or from its own dates; otherwise it is queued with no start or end. A work center with no hours on file has no utilisation figure. The plan carries notes saying what is not counted. Apply checks each line against the job and work center as they are now, saves only jobs still waiting to start, and reports the true count with a reason for each line skipped.
- **Required tests:** Routing time, no time, no hours, overload, apply refusals, branch.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "the planner takes a job's time from its routing", "a work center with no working hours on file has no utilisation figure", "an overloaded work center is reported as a bottleneck from the figures on file", "applying a schedule saves the work center and times, and counts only what it saved", "a schedule line is refused when the work center is at another branch, the wrong kind, switched off, or the times run backwards", "the planner places a job only at its own branch", "a preview and a what-if save nothing"; qa/sim/ui-phase7.cjs; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-009 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Production reporting
- **Workflow:** Counts and lists shown to planners and inspectors
- **Category:** Reporting accuracy
- **Source file or endpoint:** routes/jobs.js (/stats/summary, /sla-risk); routes/qcRoutes.js (/stats); routes/dispatchRoutes.js (/stats, /queue); src/frontend/src/pages/QC/QCDashboardPage.jsx
- **Evidence:** Probe, before: job counts for a named branch answered 500. The late-jobs list left out jobs waiting for inspection, in packaging or on hold, and its sort compared missing values. The quality pass rate read 100% on a day with no decisions. Found this phase: the shop-floor figures counted waiting steps of cancelled and held jobs as work to do, so they disagreed with the queue beside them.
- **Expected:** Each figure equals a count of the records, and "not known" is shown as such.
- **Actual:** As described.
- **Operational impact:** Planners and managers reading wrong numbers.
- **Recommended correction:** The inspection queue lists the most urgent first (it listed the least urgent first), and the inspection queue, the steps list and the late list are capped with the total stated, so a large branch gets a short answer. The branch filter is fixed; the late list covers every unfinished status, overdue first, and refuses a nonsense window; the pass rate is null (shown as a dash) when nothing was decided; the shop-floor figures count work to do on open jobs only.
- **Required tests:** Each figure compared with a direct count.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "the late-jobs list puts overdue first, includes jobs waiting for inspection, and refuses a nonsense time window", "the quality figures are counted from the records", "the shop-floor figures count work still to do on open jobs only, and agree with the queue", "leadership sees production at every branch" (branch counts equal the records); qa/sim/ui-phase7.cjs; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Jobs; work centers; routings
- **Workflow:** Values filled in when none was entered
- **Category:** Invented manufacturing data
- **Source file or endpoint:** routes/jobs.js (plan); routes/dispatchRoutes.js (mapPrismaWC); routes/bomV1.js (/ai-suggest); src/frontend/src/apps/shopfloor/CreateWorkCenterDialog.jsx
- **Evidence:** Probe, before: a plan for a job with no grade or thickness was saved as grade A36, thickness 0.5 in. A work center with no type was reported as a saw, with a division and a 12 in thickness limit; the new work center window started at 12 in. The routing suggestion returned minutes and tolerances that came from nowhere.
- **Expected:** What is not known is saved and shown as not known.
- **Actual:** Defaults that read as facts.
- **Operational impact:** Steps matched to machines on a made-up thickness; routings carrying made-up times.
- **Recommended correction:** A plan takes grade and thickness from the job or its order line, else no grade and thickness 0 (not stated). A work center reports only what is on its record. The suggestion names steps only, with times 0 and tolerances empty, and says so. The window starts with no limit.
- **Required tests:** Each case reads back as entered or as not stated.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** The plan's thickness column does not accept "empty", so "not stated" is saved as 0 (L-029).
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a plan takes the grade and thickness from the order line and assumes neither", "a suggested routing names steps only: no times or tolerances are made up", "a work center's recorded thickness limit is respected, and where none is recorded the answer says thickness was not checked"; qa/sim/ui-phase7.cjs: a new work center starts with no thickness limit.
- **First recorded in:** Phase 7 manufacturing audit

### L-011 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Routings
- **Workflow:** Putting a routing into use
- **Category:** Routing integrity
- **Source file or endpoint:** src/backend/src/routes/bomV1.js
- **Evidence:** Code read and probe: a routing with no steps could be made active; a step could name a kind of work center that is not on file, share a sequence number with another, or carry negative minutes; a status change was read-then-write.
- **Expected:** An active routing has at least one valid step; status moves draft, review, active, retired, one at a time.
- **Actual:** No validation.
- **Operational impact:** A job could be given a routing that cannot be run.
- **Recommended correction:** Steps are validated; activation needs at least one step on a kind on file; transitions are conditional updates; only an active routing goes on a job, and the job records the version.
- **Required tests:** Each refusal; the life cycle; a new version is a separate draft.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a routing goes draft, review, in use; only a routing in use can be put on a job", "a routing step must have a name, a kind of work center on file, its own place in the order and times that are not negative", "a routing with no steps cannot go into use", "the routing offered for a material is one that is in use", "sales staff can read routings but cannot create, change or put one into use".
- **First recorded in:** Phase 7 manufacturing audit

### L-012 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Jobs
- **Workflow:** Opening and planning a job
- **Category:** Work order integrity
- **Source file or endpoint:** src/backend/src/routes/jobs.js
- **Evidence:** Code read and probe: a job could be opened for a cancelled or completed order, for a cancelled line, or on a work center that is switched off; a plan with recorded work could be replaced, deleting its time entries. Found this phase: asking for the plan of another branch's job answered "no plan" instead of not found.
- **Expected:** Work is opened only for live orders; recorded work is never replaced.
- **Actual:** No check.
- **Operational impact:** Work done for an order nobody wants; labor records deleted by a re-plan.
- **Recommended correction:** Each case is refused (400 or 409) with a sentence. Re-planning before any work replaces the steps; after work is recorded it is refused. The plan address answers 404 for a job the person cannot see.
- **Required tests:** Each refusal saves nothing; two planners at once leave one plan.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** A check added during the phase refused a job on a work center at another branch than the order. The full regression run showed that this broke an established practice (an order sold at one branch and processed at another; 147 simulation steps failed). The check was withdrawn the same day: the job follows its work center, as before, and a branch planner still cannot reach another branch's work center.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: the first 10 "Work order creation and routing" scenarios; "an order sold at one branch can be worked at another"; "a job belongs to its order's branch"; qa/tools/db-facts.mjs "jobs whose plan is at a branch other than their work center"; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-013 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Coil work orders
- **Workflow:** Holding, substituting and choosing material
- **Category:** Quality hold bypass; traceability
- **Source file or endpoint:** src/backend/src/routes/workOrders.js; lib/workOrderRules.js
- **Evidence:** Code read and probe: a work order on quality hold could be completed directly, and there was no address to place or release the hold. Material of a different grade than the order line calls for could be cut for it with nothing recorded. Material whose quality status was failed or held could be put on a work order. Found this phase: a work order could be opened on material in a truck between branches (201).
- **Expected:** A hold stops the run until quality releases it; a substitution is a recorded decision; material that failed quality or is in transit is not cut.
- **Actual:** As described.
- **Operational impact:** Held or failed material turned into sellable pieces; a customer shipped a grade they did not order with no record why.
- **Recommended correction:** QC_HOLD can no longer go to COMPLETE. PUT /hold needs a reason; PUT /release-hold is for quality staff and production management. A different grade needs a substitution reason, kept in the audit log. Failed, held and in-transit material is refused.
- **Required tests:** Each refusal moves no stock; the release is audited.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a coil work order put on quality hold cannot be completed, and is released only by quality or production management", "a coil work order cut for an order line in another grade is refused unless it is recorded as a substitution", "material that failed quality or is on a quality hold is not put on a work order", "material on its way to another branch cannot be cut"; qa/tools/db-facts.mjs "work orders on quality hold or cancelled that moved stock" at 0; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-014 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Operators
- **Workflow:** Operator records
- **Category:** Privacy; master data
- **Source file or endpoint:** src/backend/src/routes/staff.js
- **Evidence:** Code read and probe: every signed-in role received each operator's hourly pay rate and emergency contact. A certification could name a kind of work center that is not on file or expire before it was issued. An operator clocked on to a step could be made inactive or moved to another branch.
- **Expected:** Pay and personal contacts are for managers; certifications are valid records; a person on the clock is not removed from under their work.
- **Actual:** As described.
- **Operational impact:** Pay rates readable by co-workers and sales staff; time entries pointing at an inactive operator.
- **Recommended correction:** Private fields are sent to administrators, leadership and production managers only. Certifications are validated. Deactivating, deleting or moving a clocked-on operator is refused with 409. Operators are held to their branch.
- **Required tests:** Each role; each refusal.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "an operator's pay rate and emergency contact are shown to managers only", "a certification must be for a kind of work center on file, and cannot expire before it was issued", "an operator who is clocked on cannot be made inactive or moved to another branch"; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-015 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Work centers; maintenance orders
- **Workflow:** Changing a work center; running maintenance
- **Category:** Master data integrity
- **Source file or endpoint:** routes/workCenters.js; routes/dispatchRoutes.js; routes/maintenanceOrders.js; new lib/workCenterGuard.js
- **Evidence:** Code read and probe: hours per day accepted -1, 25 or a word; a work center's kind or branch could be changed, or the work center deleted, with steps queued on it; a maintenance order could be completed without being started, and unknown ids answered 500.
- **Expected:** Capacity figures are real numbers; a work center with open work keeps its kind and branch; maintenance follows scheduled, in progress, complete.
- **Actual:** No validation.
- **Operational impact:** Capacity plans built on impossible figures; queued steps left on a machine that can no longer run them.
- **Recommended correction:** Validation at both addresses that change a work center; 409 when open work would be stranded; maintenance state rules and 404s.
- **Required tests:** Each refusal; a valid change.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a work center's working hours must be a real figure, and its kind cannot be changed under open work", "an operator or work center with history is switched off, never deleted", "a work center that is switched off is given no work"; src/backend/test/phase7Rules.test.js.
- **First recorded in:** Phase 7 manufacturing audit

### L-016 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Scheduling; shop-floor operations
- **Workflow:** A machine under maintenance lockout
- **Category:** Safety interlock
- **Source file or endpoint:** lib/workCenterGuard.js (lockedOut); routes/dispatchRoutes.js; routes/operationsRoutes.js; routes/optimizationV1.js
- **Evidence:** Code read: maintenance orders record lock-out/tag-out and a machine can be recorded as out of service or on a safety hold, but scheduling and step start never looked. Work could be queued and started on a machine that maintenance had locked out.
- **Expected:** A machine locked out for maintenance in progress, or recorded as out of service, on safety hold or on quality hold, is given no work and cannot have a step started on it.
- **Actual:** Maintenance and production did not read each other.
- **Operational impact:** An operator directed by the system to a locked-out machine.
- **Recommended correction:** lockedOut() is consulted by the scheduling run, the planner and step start; the answer names the machine and the maintenance order.
- **Required tests:** Lockout stops scheduling and start; finishing maintenance releases it.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** This is a software interlock on the records. No machine is connected; the physical lockout is the maintenance crew's (L-030).
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a machine locked out for maintenance is given no work until the maintenance is finished", "a machine recorded as out of service or on a safety hold is given no work"; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-017 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Operations cockpit
- **Workflow:** Accepting a recommendation
- **Category:** Wrong action
- **Source file or endpoint:** src/backend/src/routes/opsCockpit.js
- **Evidence:** Code read and probe: "Expedite" lowered the job's priority number, and priority runs from 1 (low) to 5 (hot), so expediting pushed the job back. "Rebalance" moved jobs to the named work center whatever its kind, branch or state, including jobs already started.
- **Expected:** Expedite raises priority; work moves only between like machines at one branch, and only jobs still waiting.
- **Actual:** As described.
- **Operational impact:** The opposite of what the manager asked for; jobs on a machine that cannot run them.
- **Recommended correction:** Priority goes up by one, to at most 5, on open jobs only. Rebalance requires the target to be on, of the same kind and at the same branch, moves only jobs still waiting, and says why when it does nothing.
- **Required tests:** Both actions, and the refusals.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "expediting a job raises its priority; moving work between work centers only happens between like machines at one branch"; mutation run.
- **First recorded in:** Phase 7 manufacturing audit

### L-018 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Shop-floor operations
- **Workflow:** Cancelling a job with a step running
- **Category:** Labor record integrity
- **Source file or endpoint:** lib/jobGates.js (changeJobStatusTx)
- **Evidence:** Found while writing the scenarios: cancelling a job left its running time entry open for ever. The step could no longer be finished (the job is cancelled), so the operator stayed clocked on to it and, by the rule in L-014, could not be made inactive or moved.
- **Expected:** Cancelling a job stops its clocks and keeps the time already worked.
- **Actual:** The clock ran on.
- **Operational impact:** Labor time growing without limit on cancelled work; an operator record that could not be changed.
- **Recommended correction:** Cancelling closes every running time entry of the job at that moment with the reason "Job cancelled".
- **Required tests:** The entry is closed with the reason; the operator is free; a cancel racing the last completion ends consistently.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job cancelled while a step is running: the step cannot be finished, and the clock is stopped with the reason", "cancelling a job while its last step is being finished" (6 rounds); qa/tools/db-facts.mjs "time entries still running on a job that is cancelled, shipped or completed" at 0; mutation run (3 scenarios fail without it).
- **First recorded in:** Phase 7 manufacturing audit

### L-019 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Branch scope
- **Workflow:** Seeing and changing another branch's production records
- **Category:** Location isolation
- **Source file or endpoint:** src/backend/src/lib/branchScope.js (BRANCH_OWNED)
- **Evidence:** Code read and probe: jobs and plans were held to a branch, but inspections, time entries and operators were not. An inspector at one branch could read, edit and decide another branch's inspection; a manager could open another branch's operator record.
- **Expected:** Owner decision 2: staff work only at their own branch; leadership sees all.
- **Actual:** Three production tables were outside the branch rule.
- **Operational impact:** A branch deciding another branch's quality result; pay and certification records readable across branches.
- **Recommended correction:** JobInspection (through its job), DispatchTimeLog (through its step's plan) and Operator (home branch) are branch-owned. Another branch gets 404.
- **Required tests:** View, edit, decide and list from another branch.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "inspections at one branch cannot be seen or decided from another branch", "shop-floor work at one branch cannot be seen or touched from another branch", "a job belongs to its order's branch", "scheduling one branch leaves the other branch's work alone", "a production manager cannot open a work order on another branch's stock"; qa/sim/branch-boundary.mjs.
- **First recorded in:** Phase 7 manufacturing audit

### L-020 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Rework
- **Workflow:** Doing and recording rework
- **Category:** Not built; rule not decided
- **Source file or endpoint:** routes/qcRoutes.js (/rework); routes/operationsRoutes.js; routes/jobs.js (plan)
- **Evidence:** qa/sim/phase7-manufacturing.mjs "rework is not routed or clocked": sending a job for rework returns it to scheduled with the instructions in its notes and it must pass a new inspection (L-001). But its steps are all finished and cannot be run again, and a rework step cannot be added because the plan has recorded work. The time spent on rework is recorded nowhere, and there is no rework count.
- **Expected:** The owner decides how rework is recorded: reopen the failed step, or add a rework step with its own time.
- **Actual:** Rework happens off the record between two inspections.
- **Operational impact:** Rework labor and its causes cannot be reported.
- **Recommended correction:** Not made: it is a new record and a labor-recording policy. Recommended: a rework step added to the plan by quality when it sends the job back, named for the failed inspection, clocked like any step.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): a rework step. Sending a job for rework from an inspection adds one step named for the inspection, after the last step, on the same kind of work center or the kind the inspector names. It is started, clocked and finished like any step, the job cannot be packed while it is open, and finishing it sends the job back to inspection. A job with no planned steps goes back with the instructions only. Needs database update 13.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "sent for rework, a job gets a rework step that is started and clocked like any step, and must pass a new inspection"; "the rework step can be sent to another kind of work center; an unknown kind is refused; a job with no plan gets the instructions only". Mutation: with the step removed, 1 scenario of group 6 fails.
- **First recorded in:** Phase 7 manufacturing audit

### L-021 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Quality control
- **Workflow:** Which jobs must be inspected
- **Category:** Business rule not decided
- **Source file or endpoint:** routes/jobs.js (/complete); lib/jobGates.js
- **Evidence:** Code read: a job with planned steps goes to inspection when its last step is finished, and cannot leave it without a pass (L-001). A job with no planned steps can be started and then completed straight to ready to ship; no inspection is called for.
- **Expected:** The owner states whether every job is inspected.
- **Actual:** Inspection is tied to having planned steps.
- **Operational impact:** Unplanned jobs ship uninspected, by design or by omission.
- **Recommended correction:** Not made: making inspection compulsory for every job is a quality policy. Recommended: every job passes inspection before packaging unless its routing is marked "no inspection".
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): every job passes inspection before packing or the dock, including a job with no planned steps, unless its routing is marked "no inspection" (a checkbox on the routing, on by default). Work already in packaging or beyond when the update is applied carries on. Needs database update 13.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job with no planned steps goes to inspection when it is completed; it cannot skip to the dock"; "a routing marked \"no inspection\" lets its jobs go straight to packaging; every other job is inspected"; src/backend/test/phase7Rules.test.js. Mutation: 2 rules removed in turn, group 5 fails each time.
- **First recorded in:** Phase 7 manufacturing audit

### L-022 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Operators; time entries
- **Workflow:** Labor rules
- **Category:** Business rule not decided
- **Source file or endpoint:** lib/productionRules.js (operatorEligibility); routes/operationsRoutes.js
- **Evidence:** qa/sim/phase7-manufacturing.mjs: an operator with no certification on file for a kind of work center is not stopped from starting a step there (only an expired one is); "one operator clocked on to two steps at once" is accepted and both clocks run; "a step left running since yesterday" produces a 20-hour entry that nothing flags. There is no timesheet approval or time-correction record.
- **Expected:** The owner's labor rules: is a certification required to run a machine, may one operator run two, and who reviews long or forgotten entries.
- **Actual:** None of the three is on file, and none was invented.
- **Operational impact:** Labor hours per job can be overstated; unqualified work is possible where no certification was ever entered.
- **Recommended correction:** Not made. Recommended: require a current certification where the kind of work center is marked as needing one; allow two steps at once only on work centers marked for it; list entries over a shift length for the supervisor to confirm or correct, with the correction audited.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): (a) a current certification is required where the kind of work center is marked "certification required"; (b) one operator may be clocked on to two steps at once only where every kind involved is marked for it; (c) clocks running longer than the hours on file (12 by default, setting production.rules.longEntryHours) are listed on the time tracking screen for the supervisor; nothing is stopped automatically. Both marks are off until the owner turns them on, so no labor policy was invented. Shift length, breaks and overtime are still not on file (L-025). Needs database update 13.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "one operator on two steps at once is refused, unless the kind of work center is marked for it"; "where a kind of work center is marked \"certification required\", an operator with none on file cannot be clocked on"; "a clock left running is listed for the supervisor after the hours on file; nothing is stopped". Mutation: 3 rules removed in turn, group 4 fails each time.
- **First recorded in:** Phase 7 manufacturing audit

### L-023 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-15
- **Module:** Quality control
- **Workflow:** Nonconformance and corrective action
- **Category:** Not built
- **Source file or endpoint:** No table; JobInspection.defects, disposition, reworkInstructions
- **Evidence:** qa/sim/phase7-manufacturing.mjs "nonconformance reports and corrective actions are not part of this product" and "a scrap or return disposition on a failed inspection is a record only": a failed inspection with its defects and disposition is the only nonconformance record. There is no root cause, containment, corrective action or verification, and a SCRAP or RETURN disposition changes no stock, because a job is not tied to the stock it was made from (L-024).
- **Expected:** A nonconformance record that follows the material to its disposition.
- **Actual:** Not built.
- **Operational impact:** Repeat defects cannot be traced to a cause; scrapped material stays on the books until someone scraps it by hand in inventory.
- **Recommended correction:** Not made: a new module. The existing production-quality sample screens are to be built on real records by owner decision 4 (M-011); this belongs with that work.
- **Deferred: reason:** A new module, not a correction to a working one; the Phase 7 instruction forbids building a new platform. Owner decision 4 already calls for the quality modules to be built on real records.
- **Deferred: target phase:** The phase the owner issues for quality modules on real records (owner decision 4, M-011) (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Nonconformance record raised from a failed inspection, with cause, corrective action, owner and closure; a scrap disposition writes the SCRAP movement once jobs are tied to stock.
- **Deferred: dependencies:** L-024, M-011.
- **Deferred: acceptance criteria:** A failed inspection opens a nonconformance; its scrap disposition reduces stock with a movement; it cannot be closed without a recorded action.
- **Deferred: verification:** Scenarios for each step.
- **Required tests:** Per the build.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **First recorded in:** Phase 7 manufacturing audit

### L-024 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Jobs; material
- **Workflow:** What material a job needs and uses
- **Category:** Not built; architecture
- **Source file or endpoint:** Job, DispatchJob (order-line jobs with steps); WorkOrder (coil processing that consumes stock); BomRecipe, BomOperation (routings)
- **Evidence:** qa/sim/phase7-manufacturing.mjs "bills of material are not part of this product" and "material requirements planning for a job is not part of this product": the tables named Bom hold routings (steps), not materials. There are two kinds of "work order" that do not know each other: a job for an order line has steps, time and inspection but names no material; a coil work order consumes stock and makes traceable pieces but has no steps, time or inspection. Material is reserved on the order line (Phase 6), and a coil work order for that line cuts what the line reserved.
- **Expected:** One production record from order line to steps to the material consumed and the pieces made.
- **Actual:** Two partial records joined only by the order line.
- **Operational impact:** Yield and material used cannot be reported per job; a scrap disposition on a job has no stock to act on; traceability from a shipped piece to the labor that made it goes through the order line, not directly.
- **Recommended correction:** Not made: joining them changes established production workflow. Recommended: a job names the coil work orders raised for it (or a coil work order names its job), so steps, time, inspection, consumption and pieces are one chain.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): linked. A coil work order can be raised for a job (from the job screen); it takes the job's order line, and the job shows each work order with its source, heat, pieces, weight used, made, scrap and yield. A bill of material (materials and quantities per routing) and material requirements planning are still not built; the decision did not ask for them. Needs database update 13.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job names the coil work orders raised for it, and shows what they used, made and scrapped". Mutation: with the checks removed, 1 scenario of group 6 fails.
- **First recorded in:** Phase 7 manufacturing audit

### L-025 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-15
- **Module:** Scheduling
- **Workflow:** Capacity against the calendar
- **Category:** Not built
- **Source file or endpoint:** lib/capacityPlan.js; Shift, DowntimeRecord tables; work center capacity
- **Evidence:** qa/sim/phase7-manufacturing.mjs "shift calendars, operator availability and running work are not part of the plan, and the plan says so": the planner counts minutes per day from the work center's record and nothing else. Shifts are on file but not read by the planner; the downtime table is written by no screen; jobs already running are not counted. No screen sets a work center's hours per day: it is set through the work center address only, so on a new installation every utilisation figure reads "not known".
- **Expected:** Finite capacity from shifts, availability and downtime.
- **Actual:** A queue order with times where estimates exist, clearly labelled.
- **Operational impact:** The planner cannot promise dates; it can only rank and flag.
- **Recommended correction:** Not made: a scheduling engine is a build, and its rules (shift patterns, overtime, changeover) are the owner's. Corrected this phase: the invented figures were removed and the screen says what is not counted (L-008).
- **Deferred: reason:** New capability, and the figures it needs (shift patterns, hours per work center, changeover times) have not been entered or decided. Nothing wrong is recorded today: the plan states what it does not count.
- **Deferred: target phase:** The phase the owner issues for scheduling against shift calendars (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** A field for hours per day on the work center screen; the planner reads shifts and recorded downtime; running jobs are counted.
- **Deferred: dependencies:** Owner supplies shift patterns and hours.
- **Deferred: acceptance criteria:** A job's planned end moves when a shift is removed or downtime is recorded.
- **Deferred: verification:** Scenarios with a calendar fixture.
- **Required tests:** Per the build.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **First recorded in:** Phase 7 manufacturing audit

### L-026 · P1 · IN PROGRESS

- **Discovered:** 2026-11-15
- **Module:** Production costing
- **Workflow:** What a job or a piece cost to make
- **Category:** Not built; business rule not decided
- **Source file or endpoint:** No table; Operator.hourlyRate; Coil and Inventory cost columns
- **Evidence:** qa/sim/phase7-manufacturing.mjs "production costing is not part of this product" and "a work order does not carry cost from the source to the pieces it makes": jobs, steps, time entries, work orders, work centers, routings and stock movements carry no cost or rate. An operator's hourly rate is on file and nothing multiplies it by time. Pieces made by a work order have no cost; scrap has no value.
- **Expected:** Per the owner's costing method (K-007): material cost carried to pieces by weight, labor and machine cost from recorded time and rates.
- **Actual:** No production cost exists.
- **Operational impact:** Job margin, the cost of scrap and rework, and inventory value of processed material cannot be reported.
- **Affected dependencies:** K-007.
- **Recommended correction:** Not made: the instruction forbids inventing cost rates or changing costing, and K-007 is still the owner's question.
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): built as decided. A job's cost is the material its coil work orders used at actual cost per pound, plus the time clocked on its steps at the labor rate the owner enters for each kind of work center. No overhead. Shown to managers, the inventory manager and buyers only. Where a rate or a material cost is not on file the figure is left out and named as missing; nothing is assumed. Still to do by the owner: enter a labor rate for each kind of work center. Still not built: overhead, machine rates separate from labor, outside processing cost, and a cost report across jobs. Needs database update 13. Phase 8: the cost of what is sold is now fixed on the stock movement when it leaves (database file 14), and an order shows its cost and margin from actual item cost, job labor and scrap (N-017). Still not built: posting to a ledger, overhead, freight cost and stock valuation reports; these wait on the owner (N-025).
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "a job's cost is the material its work orders used at actual cost plus the time on its steps at the rate the owner entered; there is no overhead"; src/backend/test/phase7Rules.test.js (unit cost from price, hours, adding up). Mutation: 3 rules removed in turn, group 6 fails each time.
- **First recorded in:** Phase 7 manufacturing audit

### L-027 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-15
- **Module:** Manufacturing
- **Workflow:** Outside processing; nesting
- **Category:** Not built
- **Source file or endpoint:** No table
- **Evidence:** qa/sim/phase7-manufacturing.mjs "outsourced processing is not part of this product" and "nesting and cut optimisation are not part of this product": no table or column names an outside processor, a subcontract step, a nest or a cut plan. A coil work order records weights in and out and the yield that results; it plans no layout and predicts no yield.
- **Expected:** Recorded as a gap, as the Phase 7 instruction asks.
- **Actual:** Not built.
- **Operational impact:** Material sent to an outside processor is tracked by hand; cut layouts are planned outside the system.
- **Recommended correction:** Not made.
- **Deferred: reason:** New capabilities the owner has not asked for. Nothing recorded today is wrong.
- **Deferred: target phase:** The phase the owner issues for outside processing and nesting, if the owner wants them (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Outside processing as a transfer to a vendor location and back with a step on the routing; nesting as a planning aid that proposes, never commits.
- **Deferred: dependencies:** Owner request.
- **Deferred: acceptance criteria:** Per the build.
- **Deferred: verification:** Per the build.
- **Required tests:** None.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **First recorded in:** Phase 7 manufacturing audit

### L-028 · P2 · IN PROGRESS

- **Discovered:** 2026-11-15
- **Module:** Quality control
- **Workflow:** What an inspection checks
- **Category:** Inspection standard not on file
- **Source file or endpoint:** src/backend/src/routes/qcRoutes.js (getDefaultChecklist)
- **Evidence:** Code read, and qa/sim/phase7-manufacturing.mjs "inspection standards, sampling plans and gauge calibration are not on file": the checklist is a list written in the program by kind of work, and one item carries a tolerance in its text (width within plus or minus 0.005 in for slitting). There is no inspection plan per customer, product or specification, no sampling plan and no gauge or calibration record.
- **Expected:** The checklist and tolerances come from the owner's quality standard.
- **Actual:** A fixed list of unknown origin.
- **Operational impact:** Inspectors sign a checklist that may not be the company's standard.
- **Recommended correction:** Not made: the instruction forbids inventing or changing inspection standards. The product now enforces the checklist it has (L-002).
- **Required tests:** Per the decision.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Owner's decision 9, 2026-11-15: (1) Cost: actual cost per item, taken from the purchase order line at receipt; pieces cut from an item carry its cost per pound; a job costs the material its work orders used plus the time on its steps at a rate the owner enters per kind of work center; no overhead; no rate is invented. (2) A coil work order can be raised for a job, and the job shows material used, made, scrap and yield. (3) Sending a job for rework adds a rework step that is started and clocked like any step. (4) Every job passes inspection before packing unless its routing is marked "no inspection". (5) A certification is required where the kind of work center is marked; one operator on two steps at once only where marked; clocks running longer than 12 hours are listed for the supervisor. (6) Each kind of work center can carry its own inspection checklist, entered by the owner; the standard list is used until then. Owner decision 9 (2026-11-15): each kind of work center can carry its own inspection checklist (up to 40 checks, each required or not), typed on the kinds-of-work-center screen. A new inspection of that kind of work starts with it; with none entered the built-in list is used. Waiting on the owner: the checks themselves. No inspection standard, tolerance or sampling plan was written for him. Per-customer checklists, sampling plans and gauge calibration are not built. Needs database update 13.
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "an inspection starts with the checklist the owner entered for that kind of work; with none entered, the standard list". Mutation: with the rule removed, 1 scenario of group 5 fails.
- **First recorded in:** Phase 7 manufacturing audit

### L-029 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-15
- **Module:** Jobs
- **Workflow:** Thickness not stated on a plan
- **Category:** Schema
- **Source file or endpoint:** DispatchJob.thickness, DispatchOperation.thickness (NOT NULL)
- **Evidence:** Schema read: the two thickness columns do not accept empty, so "not stated" is saved as 0 and every reader treats 0 as not stated (lib/dispatchPlan.js).
- **Expected:** An empty value for "not stated".
- **Actual:** 0 by convention.
- **Operational impact:** None found: the convention is applied in one place and tested.
- **Recommended correction:** Not made in Phase 7. The one database file of Phase 7 (file 13) was written for owner decision 9 and holds only what that decision needs.
- **Deferred: reason:** Needs a database change for no change in behaviour. It was not added to file 13, which is limited to owner decision 9.
- **Deferred: target phase:** Phase 12: final consolidation (or the next phase that ships a database change)
- **Deferred: required correction:** Make both columns nullable and save null.
- **Deferred: dependencies:** A SQL Editor file.
- **Deferred: acceptance criteria:** No plan has thickness 0.
- **Deferred: verification:** qa/tools/db-facts.mjs check.
- **Required tests:** A plan with no thickness reads back empty.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **First recorded in:** Phase 7 manufacturing audit

### L-030 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-15
- **Module:** Equipment
- **Workflow:** Machines, scales, telemetry
- **Category:** Not verified
- **Source file or endpoint:** None
- **Evidence:** qa/sim/phase7-manufacturing.mjs "no equipment is driven by this product": there is no machine connection, PLC, OPC or telemetry table and no such library. Starting and finishing a step are entries a person makes at a screen.
- **Expected:** No claim of hardware certification without physical verification.
- **Actual:** None is made.
- **Operational impact:** Machine time is whatever the operator clocks.
- **Recommended correction:** None.
- **Deferred: reason:** No hardware is connected or available to test. NOT VERIFIED.
- **Deferred: target phase:** The phase the owner issues for equipment connection, if the owner wants it (prompts 4 to 8 and 12 have not been issued yet); if none covers it, Phase 12
- **Deferred: required correction:** Per the equipment.
- **Deferred: dependencies:** Hardware.
- **Deferred: acceptance criteria:** Per the equipment.
- **Deferred: verification:** Physical test.
- **Required tests:** None possible here.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **First recorded in:** Phase 7 manufacturing audit

### L-031 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-15
- **Module:** Routings
- **Workflow:** Opening a routing
- **Category:** Defect
- **Source file or endpoint:** src/frontend/src/apps/bom/BomRecipeEditorPage.jsx; src/backend/src/routes/bomV1.js
- **Evidence:** Found by the browser check added for owner decision 9 (qa/sim/ui-phase7.cjs "routing"): a routing whose step had been saved without a list of parameters opened as an error ("op.parameters.map is not a function"). The routing screen always sends a list, so this happened only to routings saved another way (the address directly, or an import); the server stored whatever shape it was given, and an empty object when given nothing.
- **Expected:** A routing on file can always be opened.
- **Actual:** The screen stopped with a script error.
- **Operational impact:** A routing saved by an import or another program could not be opened or edited on the screen. No stored figure was wrong.
- **Recommended correction:** The server saves an empty list when a step has no parameters and refuses parameters that are not a list (400). The screen shows a step with no list as having none.
- **Required tests:** Open a routing saved with no parameters; refuse an object.
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Routings already saved in the live database with another shape are opened by the corrected screen; they are not rewritten. Whether any exist is NOT VERIFIED.
- **Verification evidence:** qa/sim/ui-phase7.cjs: "routing: no script errors" and the three routing checks before it, on a routing saved through the address with no parameters; qa/sim/phase7-manufacturing.mjs "a routing marked "no inspection" lets its jobs go straight to packaging": "a step whose parameters are not a list is refused; a step with none is saved with an empty list". With the fix removed the browser checks failed (that is how it was found).
- **First recorded in:** Phase 7 manufacturing audit

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

### M-016 · P1 · VERIFIED FIXED

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
- **Assigned phase:** Phase 3: database integrity, transactional correctness, performance and 80-location scalability
- **Status note:** Open Owner decision of 2026-11-13: everything is always tracked. Completing a work order is one transaction that takes the output weight and the scrap off the source item (movements CONSUME and SCRAP naming the work order), creates each piece as a stock item with the source's heat, grade, owner and branch (movement PROCESS, a WorkOrderOutput row), and leaves anything unused on the source. Stock reserved on the source for the work order's own order line is carried into the pieces, still reserved for that line. More than the item has free is refused. lib/stockChanges.js. Not covered: the shop-floor job route (Job, DispatchJob) records operations and not weights; material for a job is tracked through the reservation it ships from. Cost by job is not maintained.
- **Verification evidence:** qa/sim/phase3-db.mjs group 3: completion with three pieces (source 2000 to 500, pieces + scrap + remainder = 2000, heat inherited); completion over what is free refused with nothing saved; reserved stock cut for its order stays reserved in the pieces and ships with its heat. db-facts: completed work orders matched by movements, pieces weigh the output, pieces carry the source heat: 0 exceptions. On the old code each of these fails (no movement, no piece).
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
- **Assigned phase:** Phase 7: manufacturing execution, work orders, routing, capacity planning, scheduling, shop-floor operations, quality control, material consumption, remnants, rework and operational intelligence
- **Status note:** Open Phase 7: the first half is done. Every job status change, from every address, now goes through one function (lib/jobGates.js changeJobStatusTx) with one history entry and the same quality and open-step gates (L-001, L-006). What remains for the owner is narrower: the move table still allows some backward moves (for example in process back to ordered). Question: which backward moves should be allowed, and by whom?
- **Verification evidence:** qa/sim/phase7-manufacturing.mjs: "across everything this run did: every job is where its history says"; "one job moved by two people at the same moment".
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

### N-001 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping
- **Workflow:** Dispatching a shipment
- **Category:** Stock taken at the wrong branch
- **Source file or endpoint:** src/backend/src/routes/shipments.js (consumeReserved)
- **Evidence:** Probe on the QA database, before (qa/sim/p8-probe.mjs): an order was reserved against a stock item standing at branch 2 and put on a shipment leaving from branch 1. Dispatch answered 200 and took the quantity from the item at branch 2.
- **Expected:** What leaves a dock is stock standing at that dock.
- **Actual:** Dispatch drew whatever was reserved, wherever it stood.
- **Root cause or suspected cause:** The dispatch step read the reservation and never compared the item's branch with the shipment's.
- **Operational impact:** Branch 2's books fell for a truck that left branch 1. Branch 1 still showed material it had loaded.
- **Recommended correction:** Dispatch refuses (409) and names the item and the branch it is at. The pick list marks such an item "At another branch" before anyone loads it.
- **Required tests:** Reserve at one branch, ship from another: refused, nothing moves.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "stock standing at another branch is not picked for a shipment from this dock (N-001)". With the rule removed the scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-002 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping
- **Workflow:** An order sold at one branch and shipped from another
- **Category:** Branch boundary
- **Source file or endpoint:** src/backend/src/lib/branchScope.js (Shipment, ShipmentItem); routes/shipments.js (ownDock, orderToShip)
- **Evidence:** Probe, before: a shipping clerk at branch 2 could not find an order sold by branch 1 whose stock was reserved at branch 2 (404), so the order could not be shipped from where the material was. The selling branch could not see a shipment that left from another dock.
- **Expected:** The branch that holds the stock ships it; the branch that sold the order sees the shipment; only the dock it leaves from changes it.
- **Actual:** A shipment belonged only to its dock, and an order only to the branch that sold it.
- **Operational impact:** Cross-branch orders, which Phase 7 confirmed are normal practice, could not be shipped by the branch holding the material without a head-office login.
- **Recommended correction:** A branch may open a shipment for another branch's order when stock reserved for it, or a job for it, stands at its own dock. The selling branch reads the shipment. Changes are held to the dock (403). A dock that is not the user's is refused first (403).
- **Required tests:** Ship and bill across branches; refuse when nothing is held; refuse changes from the selling branch.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "an order sold by one branch is shipped and billed from the branch that holds the stock (N-002)", "a branch cannot ship another branch's order when it holds nothing for it", "a warehouse cannot open a shipment from another branch's dock". Two rules removed one at a time; each made a scenario fail. src/backend/test/branchScope.test.js. qa/sim/branch-boundary.mjs updated to the new answer.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-003 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping
- **Workflow:** Reporting a problem on the road
- **Category:** Missing record
- **Source file or endpoint:** routes/shipments.js (move)
- **Evidence:** Probe, before: PATCH status EXCEPTION with no text answered 200 and the history line said nothing.
- **Expected:** A problem is recorded with what happened.
- **Actual:** Any text, or none.
- **Operational impact:** A shipment marked as a problem told nobody what the problem was.
- **Recommended correction:** A reason is required (400 without). It is kept in the history. The screen asks "What happened".
- **Required tests:** Refuse without a reason; keep the reason.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a problem on the road is recorded with what happened (N-003)"; qa/sim/ui-phase8.cjs: "problem: it cannot be recorded without saying what happened". Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-004 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Delivery
- **Workflow:** Recording a delivery
- **Category:** Missing proof of delivery
- **Source file or endpoint:** routes/shipments.js (deliver); Shipment.noPodReason (database file 14)
- **Evidence:** Probe, before: PUT deliver with an empty body answered 200. The shipment was DELIVERED with no name, no image and no reason.
- **Expected:** A delivery names who received it, or says why there is no name.
- **Actual:** Nothing was required.
- **Operational impact:** A disputed delivery had nothing on file.
- **Recommended correction:** A delivery needs the receiver's name or a proof image address, or a written reason for having neither. A carrier's own system reporting delivery is recorded as that reason. Nothing is filled in.
- **Required tests:** Refuse empty; accept a name; accept a reason; carrier report marked as such.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Deliveries recorded before this rule keep what they have and are not rewritten. The order closeout notes them and does not hold the order open for them. How many exist in the live database is NOT VERIFIED.
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a delivery with no name and no reason is refused (N-004)", "a delivery is recorded with the name of the person who received it", "a carrier's system reports delivery with no name: it is accepted and marked as such"; qa/sim/ui-phase8.cjs delivery checks. Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-005 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping
- **Workflow:** Dispatching to a closed account
- **Category:** Business rule not applied
- **Source file or endpoint:** routes/shipments.js (dispatch)
- **Evidence:** Probe, before: an account was closed after its order was confirmed; the shipment was dispatched and invoiced (200).
- **Expected:** A closed account takes no new business (J-002), and a shipment is a new invoice.
- **Actual:** The rule was applied at order entry only.
- **Operational impact:** Material could leave for, and an invoice be raised on, an account the owner had closed.
- **Recommended correction:** Dispatch refuses (409) and says to reopen the account or cancel the order.
- **Required tests:** Close the account, dispatch: refused, nothing moves.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "nothing ships to a customer whose account was closed after the order was confirmed (N-005)". Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-006 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Orders
- **Workflow:** Cancelling an order
- **Category:** Orphan record
- **Source file or endpoint:** routes/orders.js (cancel)
- **Evidence:** Probe, before: an order with a shipment on the dock was cancelled; the shipment stayed PENDING for ever and could not be dispatched.
- **Expected:** Shipments that have not left go with the order.
- **Actual:** They were left standing.
- **Operational impact:** The dock list showed loads for cancelled orders.
- **Recommended correction:** Cancelling the order cancels its shipments still on the dock in the same save, each with a history line saying why.
- **Required tests:** Cancel with a dock shipment: shipment cancelled, history written.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "cancelling an order cancels its shipments still on the dock (N-006)" and "an order cancelled at the very moment its shipment is dispatched ends one way or the other, never half of each". Rule removed: scenario fails. qa/tools/db-facts.mjs "shipments still on the dock for a cancelled order".
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-007 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Payments
- **Workflow:** Recording a payment
- **Category:** Input not checked
- **Source file or endpoint:** services/billing.js (recordPayment)
- **Evidence:** Probe, before: a payment dated a year ahead was accepted (201).
- **Expected:** A payment is recorded once received.
- **Actual:** Any date.
- **Operational impact:** Aging and cash reports could be distorted by a mistyped year.
- **Recommended correction:** A payment date more than a day ahead is refused (400). A day is allowed for time zones.
- **Required tests:** Refuse a future date.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "what is typed for a payment is checked, including its date (N-007)". Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-008 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Packaging
- **Workflow:** Sending a package to quality
- **Category:** Workflow could not be completed
- **Source file or endpoint:** services/dropTagService.js; routes/dropTagRoutes.js; new screen src/frontend/src/pages/MaterialTracking/PackagesPage.jsx
- **Evidence:** Probe, before: no address moved a package to "ready for quality", so quality could never release one, and a drop tag (which needs a released package) could not be made through the product. There was no screen to open a package or put material in it.
- **Expected:** A package is opened, packed, sent to quality, released, tagged and sealed.
- **Actual:** The chain stopped after packing.
- **Root cause or suspected cause:** The step was never written; the states existed in the schema only.
- **Operational impact:** Packaging and drop tags could not be used end to end.
- **Recommended correction:** The step exists (only a package with something in it; gross weight not less than its contents). Only quality roles release or hold. A new Packing screen walks the chain. A seal needs a seal number.
- **Required tests:** The whole chain; each step refused out of order; roles.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a packed package is sent to quality; an empty one is not (N-008)", "only quality releases or holds a package", "a tag is printed only for a package that quality has released", "print, apply and seal happen in that order"; qa/sim/ui-phase8.cjs packing checks. Two rules removed one at a time: each made a scenario fail.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-009 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Packaging
- **Workflow:** Putting material in a package
- **Category:** Input not checked
- **Source file or endpoint:** services/dropTagService.js (createPackage, addPackageItem)
- **Evidence:** Probe, before: a package was opened for an order that does not exist, of a kind that does not exist; an item was added with a heat that is not the stock item's, zero pieces and a negative weight (all 201).
- **Expected:** A package is for a real order line; its contents agree with the stock item.
- **Actual:** Whatever was typed was saved.
- **Operational impact:** A tag could print a heat or grade the material does not have.
- **Recommended correction:** The order, line and kind are checked. Heat, grade and form are read from the stock item, and a different typed value is refused. Pieces and weight must be positive, and no more than the item weighs across all packages. Stock on hold cannot be packed.
- **Required tests:** Each refusal; the happy path.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a package is opened only for a real order line and a known kind of package", "what goes into a package is checked against the stock item". Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Drop tags
- **Workflow:** Tag states
- **Category:** State rule
- **Source file or endpoint:** services/dropTagService.js
- **Evidence:** Probe, before: sealing a package set every tag on it to SEALED, including a voided one; a package could be sealed with a tag not applied; two live tags could be made for one package; a tag could be printed again without limit.
- **Expected:** One live tag per package; print, apply, seal in order; a void tag stays void; further copies are controlled.
- **Actual:** Each step changed the status without looking at the others.
- **Operational impact:** A voided tag came back to life at sealing; duplicate tags for one bundle.
- **Recommended correction:** Fixed moves, checked in the same save. Sealing touches applied tags only. A further copy needs one of the listed reasons, and after three a manager.
- **Required tests:** Each rule, and a second tag refused.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a package has one live tag at a time", "print, apply and seal happen in that order", "a voided tag stays void when the package is sealed (N-010)", "a further copy of a tag needs a reason, and after three copies a manager". Three rules removed one at a time: each made a scenario fail. qa/tools/db-facts.mjs "packages with more than one live tag".
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-011 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Custody records
- **Workflow:** Who did what to material
- **Category:** Records could be forged
- **Source file or endpoint:** routes/materialTrackingRoutes.js; services/dropTagService.js; services/scanService.js
- **Evidence:** Probe, before: any signed-in user could post a custody record of any kind ("job shipped", "hold placed") for any job, with any person's id as the actor; the role on packing records was a fixed word, not the user's role; the record's "hash" was a random string.
- **Expected:** A custody record is written by the system when the thing happens, in the name of the signed-in person.
- **Actual:** It could be typed by hand in anyone's name.
- **Operational impact:** The chain of custody could not be relied on.
- **Recommended correction:** The hand-entry address takes notes only, from a short list of kinds, marked as manual and always in the writer's own name and role. Status records are written by the step itself. The second address that accepted them answers 410. The fingerprint is a SHA-256 of the record.
- **Required tests:** Forged kinds refused; a note kept under the writer's name; real role on packing records.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "packing records name the real person and role, and custody records cannot be forged (N-011)". Two rules removed one at a time: each made the scenario fail. A third line (holds refused by name) was found to be backed by the list of kinds, so removing it alone changes nothing.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-012 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Packaging
- **Workflow:** Numbering packages, tags and listings
- **Category:** Numbering
- **Source file or endpoint:** services/dropTagService.js (nextNumber); services/dropTagListingService.js
- **Evidence:** Code read and probe, before: package, tag and listing numbers were made from the clock and a random number, so two made together could collide and the numbers had no order.
- **Expected:** Numbers run one after another and are never repeated.
- **Actual:** Random.
- **Operational impact:** A rare duplicate number; numbers that cannot be read in sequence.
- **Recommended correction:** The three series use the document counter table (Phase 3), taken inside the same save.
- **Required tests:** Many at once: all different, in sequence.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a package is opened only for a real order line and a known kind of package" (number format and sequence) and "package steps taken twice at once happen once (N-013)".
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-013 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Packaging
- **Workflow:** Two people pressing at once
- **Category:** Concurrency
- **Source file or endpoint:** services/dropTagService.js (lockPackage, moveTag)
- **Evidence:** Probe, before: two "print" requests for one tag at the same moment both answered 200 and two print records were written; two tags could be made for one package at the same moment.
- **Expected:** Each step happens once.
- **Actual:** Read, then write, with nothing held between.
- **Operational impact:** Duplicate tags and duplicate print records.
- **Recommended correction:** Each package step locks the package row; each tag move succeeds only if the tag is still in the state the person saw (409 otherwise).
- **Required tests:** Each step sent twice at once.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "package steps taken twice at once happen once (N-013)". The lock and the state check removed one at a time: each made the scenario fail.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-014 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping documents
- **Workflow:** Labels, packing list and bill of lading
- **Category:** Invented content on printed papers
- **Source file or endpoint:** services/tagRenderer.js; services/printAutomationService.js; new lib/shippingDocuments.js
- **Evidence:** Code read and probe, before: the bill of lading and the job labels printed a fixed company name and address that are not the branch's, a ship-to built from placeholder text, "1" for pieces and weights that were not on file. The packing list listed nothing from the shipment.
- **Expected:** A paper prints what is on file, and a blank for what is not.
- **Actual:** Placeholders were printed as facts.
- **Root cause or suspected cause:** The templates were written before the data was connected.
- **Operational impact:** A bill of lading is a legal document. A wrong shipper, address or weight on it is a real exposure.
- **Recommended correction:** One reader (lib/shippingDocuments.js) builds the pick list, packing list and bill of lading from the shipment, the order, the branch and the stock movements. Anything missing is left blank on the paper and named on the screen before printing. Job labels read the real branch, order and customer PO.
- **Required tests:** Papers agree with the records; blanks for missing facts; nothing invented.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** No printer, label stock or scanner was used. What a paper looks like on a real printer is NOT VERIFIED.
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "the papers show a blank, never an invented value, for what is not on file", "the bill of lading and packing list are drawn from the shipment, with nothing invented (N-014)", "a job label prints the real branch, order and customer PO, and blanks for what is not on file", "the pick list names the reserved stock items with their heat and bin, oldest reservation first"; qa/sim/ui-phase8.cjs paper checks. An invented address put back: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-015 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Print queue
- **Workflow:** Whose print jobs
- **Category:** Branch boundary
- **Source file or endpoint:** PrintQueueJob.locationId (database file 14); lib/branchScope.js; routes/printQueue.js; services/printAutomationService.js
- **Evidence:** Probe, before: every branch saw and could settle every other branch's print jobs; a job could be marked printed twice, or printed and then skipped; nothing recorded who.
- **Expected:** A print job is for one branch's printer and is settled once by a named person.
- **Actual:** One shared list.
- **Operational impact:** Branch 2 could mark branch 1's tags printed, so they were never printed.
- **Recommended correction:** A print job carries its branch. Each branch sees its own (and jobs with no branch on file). A job is settled once (409 after), with who did it in the audit log.
- **Required tests:** Two branches; settle twice.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Print jobs already waiting in the live database have no branch and stay visible to every branch until settled.
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "each branch sees and settles its own print jobs (N-015)", "a print job is settled once, by a named person". Each rule removed: scenario fails. src/backend/test/branchScope.test.js.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-016 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Returns
- **Workflow:** A return received when its credit cannot be issued
- **Category:** Money owed not recorded
- **Source file or endpoint:** routes/returns.js; lib/orderCloseout.js; lib/integrationReport.js; src/frontend/src/pages/Orders/ReturnsPage.jsx
- **Evidence:** Probe, before: a return was received on an order whose invoice had already been credited in full. The material came back, the credit was refused, and the answer was 200 with a line in the server log. Nothing on any screen showed that the customer had returned material without a credit.
- **Expected:** A return received without its credit is listed until someone settles it.
- **Actual:** It was lost.
- **Operational impact:** A customer owed a credit, or a duplicate return, with nothing to find it by.
- **Recommended correction:** The receipt answers with a warning and writes a record. The return is flagged on the returns list, on the order's closeout and in the integration report until a manager issues the credit or records, with a reason, how it was settled. It can be settled once.
- **Required tests:** Flag raised; settled by a manager only, once.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a return received when its credit cannot be issued is flagged until a manager settles it (N-016)", "only a manager settles a missing credit, with the reason, once", "two managers settling the same missing credit at once leave one record"; qa/sim/ui-phase8.cjs returns checks. The flag and the once-only check removed one at a time: each made a scenario fail. A first-pass duplicate check before the lock was found to be backed by the one inside it.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-017 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Order costing
- **Workflow:** What a sale cost
- **Category:** Not built
- **Source file or endpoint:** MaterialMovement.unitCost (database file 14); routes/shipments.js; lib/orderCloseout.js (orderCost); src/frontend/src/components/orders/OrderCloseoutPanel.jsx
- **Evidence:** Schema and code read, before: a shipment movement recorded quantity only. The cost of the item on the day it left was kept nowhere, so the margin on an order could not be worked out, and a later change to the item's cost would have changed history.
- **Expected:** By owner decision 9, actual cost per item: the cost of what was sold is fixed when it leaves.
- **Actual:** No cost of sale.
- **Operational impact:** No order margin.
- **Recommended correction:** Dispatch writes the item's unit cost on the stock movement. An order's cost and margin are read from those movements, the returns that came back to stock, the labor and scrap on its jobs (Phase 7) and the goods lines of its invoices, less credits. Tax and freight billed are not revenue. A missing cost is named and the margin is not shown. Shown to the roles that manage cost only.
- **Required tests:** Cost fixed at dispatch; unchanged by later cost edits; partial shipments; returns; missing cost; roles.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** This is cost of sale per order from actual item cost. Posting cost of goods to a ledger, overhead, freight cost and landed-cost allocation are not built (N-025). Movements written before database file 14 carry no cost, and orders shipped before it show "cost not on file".
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs group "Costing, reconciliation and closeout" (twelve cost scenarios, among them "the cost of what was sold is the cost fixed on the stock movement when it left" and "a later change to the stock item's cost does not change what a past sale cost"); qa/sim/ui-phase8.cjs "order: a manager sees cost and margin, from what left". With the cost not written at dispatch seven scenarios fail.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-018 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Order closeout
- **Workflow:** Knowing an order is finished
- **Category:** Not built
- **Source file or endpoint:** new lib/orderCloseout.js; routes/orders.js (GET /:id/closeout, GET /closeout); new screen pages/Orders/OrderCloseoutPage.jsx
- **Evidence:** Code read: an order became COMPLETE when its last line shipped. Nothing said whether it was delivered, invoiced, paid, or had a return, credit, job or reserved stock still open.
- **Expected:** One answer to "is this order done, and if not, what is it waiting for".
- **Actual:** None.
- **Operational impact:** Back orders, unbilled shipments and unpaid invoices were found only by looking in four places.
- **Recommended correction:** A closeout position per order (pure rule, lib/orderCloseout.js closeoutPosition) lists each open item with its figure. A list of orders not closed, oldest first, by reason, held to the reader's branches. Nothing is stored and no order status is changed: it is read from the records each time.
- **Required tests:** Each open reason; closed; reopened by a return; list agrees with each order.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: eight closeout scenarios, among them "an order closes only when it is shipped, delivered, invoiced and paid" and "the list of orders not closed is paged, oldest first, and agrees with each order's own closeout"; src/backend/test/phase8Rules.test.js (nine closeout tests); qa/sim/ui-phase8.cjs closeout checks. Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-019 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping documents
- **Workflow:** Printing from the shipment screen
- **Category:** Not built; unsafe text
- **Source file or endpoint:** src/frontend/src/pages/Shipping/ShipmentPage.jsx; routes/printQueue.js; services/tagRenderer.js
- **Evidence:** Screen read: no button printed a packing list or bill of lading (U-036). Probe: text typed into a shipment (carrier, notes) was written into the paper's HTML as it was.
- **Expected:** The papers can be opened and printed from the shipment; typed text is text.
- **Actual:** No button; markup passed through.
- **Operational impact:** Papers were written by hand. A typed tag could have changed what a paper showed.
- **Recommended correction:** Two buttons open the paper exactly as the server draws it, with Print. Every value is escaped before it is drawn.
- **Required tests:** Open each paper; markup shows as text.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "text on a printed paper cannot carry markup"; qa/sim/ui-phase8.cjs: packing list and bill of lading checks. Escaping removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-020 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Costing
- **Workflow:** Who sees stock cost
- **Category:** Cost shown to roles that should not see it
- **Source file or endpoint:** new src/backend/src/lib/costView.js; src/backend/src/app.js
- **Evidence:** Found by a Phase 8 scenario: a sales login read GET /api/orders/:id and received the unit cost of the reserved stock item; an operator read GET /api/coils/:id and received the cost on each movement. Owner decision 9 keeps cost to managers, the inventory manager and buyers.
- **Expected:** Cost is sent only to the roles that manage it, on every answer.
- **Actual:** Each route had to remember to remove it, and two did not.
- **Root cause or suspected cause:** The rule was applied route by route.
- **Operational impact:** Any staff login could read what the company paid for material.
- **Recommended correction:** One guard on every API answer removes cost from every stock item, stock record and stock movement, wherever it sits in the answer, unless the reader is a cost viewer.
- **Required tests:** Search every answer a non-cost role can read for a cost field.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "stock cost does not leak through the order, the shipment or the stock item (N-020)", "cost and margin are shown only to the roles that manage cost"; src/backend/test/phase8Rules.test.js (two cost-view tests). Guard removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-021 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Credit memos
- **Workflow:** A typed credit amount
- **Category:** Arithmetic
- **Source file or endpoint:** services/billing.js (createCredit)
- **Evidence:** Found by a Phase 8 scenario: a typed credit of up to two cents more than was left on an invoice was accepted, and the difference was taken off a tax figure that was zero, giving a credit with tax of the wrong sign.
- **Expected:** A typed amount over what is left is refused, to the cent.
- **Actual:** A rounding allowance meant for line-by-line credits was applied to typed amounts.
- **Operational impact:** A credit memo with a small tax figure of the wrong sign.
- **Recommended correction:** The allowance applies only to a credit by line, and only when the tax can absorb it. Otherwise 409 with the amount left.
- **Required tests:** One cent over: refused.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a credit memo is a manager's decision, needs a reason, and never exceeds the invoice". Rule removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-022 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Invoicing
- **Workflow:** Many dispatches or credits at the same moment
- **Category:** Concurrency
- **Source file or endpoint:** src/backend/src/lib/numbering.js (isOverlap, retryOverlap)
- **Evidence:** Found by a Phase 8 scenario: six shipments dispatched at the same moment. Some left with no invoice (the answer carried an invoice warning), and simultaneous credits answered 500. The database had reported a serialization failure on a raw statement, which arrives under a different error code from the one the retry looked for.
- **Expected:** Work that overlaps is run again, as Phase 3 built.
- **Actual:** Retried for one error code only.
- **Root cause or suspected cause:** Prisma reports the same database condition as P2034 from its own queries and as P2010 from raw statements.
- **Operational impact:** Under load, shipments leaving without an invoice. Each was listed for billing in the integration report, so none was lost, but each needed a person.
- **Recommended correction:** Both forms are recognised and retried.
- **Required tests:** Six dispatches at once: six invoices, numbers in sequence. Credits at once: no 500.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "six shipments dispatched at once get six different invoice numbers with no gap", "credits issued together never exceed the invoice"; src/backend/test/phase8Rules.test.js (two overlap tests). Fix removed: two scenarios fail.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-023 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Print queue
- **Workflow:** A paper waiting to print
- **Category:** Stale content
- **Source file or endpoint:** services/printAutomationService.js (queueShipmentPapers)
- **Evidence:** Found by a Phase 8 scenario: a packing list queued before dispatch still said "not yet dispatched", and showed the old carrier, when printed after the shipment had left.
- **Expected:** A waiting paper prints what the shipment says now.
- **Actual:** It printed what the shipment said when it was queued.
- **Operational impact:** A wrong carrier or status on a printed paper.
- **Recommended correction:** A paper still waiting is brought up to date when it is asked for again; one waiting copy of each per shipment.
- **Required tests:** Queue, change the shipment, print.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a paper waiting in the queue is brought up to date, never printed stale, and never queued twice". Fix removed: scenario fails.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-024 · P4 · FIXED — NOT VERIFIED

- **Discovered:** 2026-11-16
- **Module:** Tests
- **Workflow:** Phase 5 sales scenarios
- **Category:** Test defect
- **Source file or endpoint:** qa/sim/phase5-sales.mjs ("the sales dashboard counts open business before tax and leaves expired quotes out")
- **Evidence:** The Phase 8 baseline run started at 00:20 UTC on a Monday and this scenario failed (75 of 76). It lapses a quote "an hour ago" and expects the week's figures to count it. In the first hour of a week, an hour ago is last week.
- **Expected:** A check that does not depend on the time of day.
- **Actual:** Failed in the first hour of each week.
- **Operational impact:** A false alarm. The product was right.
- **Recommended correction:** The quote is lapsed one second ago.
- **Required tests:** Run in the first hour of a week.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** The scenario passes at other hours (this session). It was not run again in the first hour of a week, which is the only time the defect shows.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-025 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-16
- **Module:** Accounting
- **Workflow:** Ledger, cost of goods and valuation
- **Category:** Not built; needs the owner
- **Source file or endpoint:** No table
- **Evidence:** qa/sim/phase8-fulfillment.mjs: "there is no accounting system connected: nothing is posted to a ledger", "overhead, freight cost, landed cost allocation and cost of goods posting are not built". There is no chart of accounts, journal, period or accounting connection in the schema or the code. Invoices, payments and credits are the only financial records.
- **Expected:** Recorded as a gap. The Phase 8 instruction forbids assuming when cost of goods is recognised and inventing account mappings.
- **Actual:** Not built.
- **Operational impact:** Books are kept in another system by hand, from the invoice and payment lists.
- **Recommended correction:** Not made. Built this phase: cost of sale per order (N-017) and receivables by age.
- **Required tests:** None until decided.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** The owner decides: which accounting system, if any, the product posts to; the chart of accounts; when cost of goods is recognised (at shipment, at invoice or at delivery); whether overhead and freight cost are part of cost; the period-close rule. Nothing was assumed. Owner, 2026-11-15: asked for advice on an internal basic ledger for reports and AI queries, to connect to outside accounting software later, and said not to build yet. Advice given. Three answers are needed before a build: when cost of goods counts (recommended: at shipment), the chart of accounts, and the start date.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-026 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Freight and carriers
- **Workflow:** Rates, labels, pickups, tracking
- **Category:** Not built; needs the owner
- **Source file or endpoint:** src/frontend/src/pages/Freight (seven sample screens); routes/partner/carrierRoutes.js
- **Evidence:** qa/sim/phase8-fulfillment.mjs: "freight rates are not calculated by this product", "no carrier is connected: there is no label purchase, pickup request or tracking pull to test", "the six freight planning screens are marked as sample screens". Freight on an invoice is the amount staff type on the order, billed once on the first shipment. A carrier that has been given a partner key can report status and delivery for its own shipments; that is the only carrier connection.
- **Expected:** No carrier capability is invented.
- **Actual:** None is.
- **Operational impact:** Rating, booking and tracking are done outside the product.
- **Recommended correction:** Not made.
- **Deferred: reason:** Owner decision 10 (2026-11-15): start with tracking numbers typed by dispatch, which works today; connect one carrier when a contract exists.
- **Deferred: target phase:** The phase the owner issues once a carrier contract exists; if none, Phase 12 records it as not built
- **Deferred: required correction:** Rating, labels, pickups and tracking through the chosen carrier's own service, behind the outside-call guard, with a sandbox account for tests.
- **Deferred: dependencies:** A carrier contract and its credentials, which are the owner's.
- **Deferred: acceptance criteria:** A rate, a label and a tracking update from the carrier's sandbox, each verified by a scenario.
- **Deferred: verification:** None yet.
- **Required tests:** None until a carrier is chosen.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Owner's decision 10, 2026-11-15: Built as recommended: (1) a manager ends a shipment that has a problem as lost, destroyed or refused for good, with what happened, and what is not yet credited on its invoice is credited in the same save; nothing is automatic. (2) Invoices and payments are read by sales, managers, leadership and the view-only roles; other staff see only that an invoice exists, its number and status. (3) The web shop takes no payment method and says every web order is on account. Not built, by the same decision: (4) carriers stay as tracking numbers typed by dispatch until a carrier contract exists; (5) the delivery promise screens stay as they are, for demonstration. Still open: (6) accounting. The owner asked for advice on an internal ledger; three answers are needed before it is built (when cost of goods counts, the chart of accounts, the start date). Owner decision 10: tracking numbers typed by dispatch for now; a carrier is connected when a contract exists.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-027 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping
- **Workflow:** A load that is lost, destroyed or refused for good
- **Category:** Needs the owner
- **Source file or endpoint:** src/backend/src/routes/shipments.js (markLost, PUT /api/shipments/:id/lost); src/backend/src/services/billing.js (creditInvoice, rest); SQL Editor file 20261116230000_shipment_lost
- **Evidence:** qa/sim/phase8-fulfillment.mjs: "a shipment with a problem can end delivered, and cannot be cancelled or put back on the dock". A shipment that has left has taken stock and raised an invoice. From "problem" it can go back on the road or be delivered. There is no way to end it as lost or destroyed, and none was invented.
- **Expected:** A rule from the owner for loads that never arrive.
- **Actual:** Handled today by a return (material back) or a credit memo (money back), each by hand.
- **Operational impact:** A lost load stays "problem" and holds its order open on the closeout list, which is visible and correct, until someone credits it.
- **Recommended correction:** Owner decision 10. A manager (the roles that may issue a credit) ends a shipment that has a problem on record as LOST, naming the kind (lost, destroyed, refused for good) and what happened. In the same save every quantity not yet credited on its invoice, its tax and its freight are credited. Stock is not moved a second time: it left the books at dispatch, and the cost stays on the order as a sale with no revenue. Nothing is automatic, and it cannot be undone. Material that comes back is a return, as before.
- **Required tests:** None until decided.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Owner's decision 10, 2026-11-15: Built as recommended: (1) a manager ends a shipment that has a problem as lost, destroyed or refused for good, with what happened, and what is not yet credited on its invoice is credited in the same save; nothing is automatic. (2) Invoices and payments are read by sales, managers, leadership and the view-only roles; other staff see only that an invoice exists, its number and status. (3) The web shop takes no payment method and says every web order is on account. Not built, by the same decision: (4) carriers stay as tracking numbers typed by dispatch until a carrier contract exists; (5) the delivery promise screens stay as they are, for demonstration. Still open: (6) accounting. The owner asked for advice on an internal ledger; three answers are needed before it is built (when cost of goods counts, the chart of accounts, the start date). Built after the Phase 8 report, by owner decision 10. Needs database file 15 (one new shipment state).
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "a load that never arrives is ended as lost by a manager, with what happened, and its invoice is credited in full", "only a shipment with a problem on record can be ended as lost; when the invoice was already paid the credit is owed back", "a lost load credits only what earlier credits left", "two managers ending the same shipment as lost at the same moment leave one credit"; src/backend/test/decision10.test.js; qa/sim/ui-phase8.cjs (lost load). Removed one at a time, each of these failed a scenario: the manager rule (both guards), the reason, the credit, the credit for what is left. The problem-state rule is held by two checks; removing either alone fails nothing, removing both fails a scenario. Ending once under a race is held by the state check and by the invoice having nothing left to credit; removing the state check alone fails nothing.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-028 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Customer communication
- **Workflow:** Shipment, delivery and invoice notices
- **Category:** Not built
- **Source file or endpoint:** None
- **Evidence:** qa/sim/phase8-fulfillment.mjs: "no email or text is sent when a shipment leaves or arrives", "invoices are not sent by this product". A customer's own system that has subscribed is told of shipments and invoices by webhook (Phase 4). No person is told anything.
- **Expected:** By owner decision 5, email and text come later.
- **Actual:** Not built.
- **Operational impact:** Staff tell customers by phone or their own email; invoices are printed or sent from another system.
- **Recommended correction:** Not made.
- **Deferred: reason:** Owner decision 5 (2026-11-14): email and text notices later.
- **Deferred: target phase:** The phase the owner issues for notifications; if none covers it, Phase 12
- **Deferred: required correction:** Notices on dispatch and delivery, and invoice delivery, through the service the owner chooses.
- **Deferred: dependencies:** A mail or text service, and its host settings, which are the owner's.
- **Deferred: acceptance criteria:** A customer contact receives one notice per event, never from a test.
- **Deferred: verification:** Scenario with a captured outbox; nothing sent from simulations.
- **Required tests:** None.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

### N-029 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Orders and shipping
- **Workflow:** Cancelling an order at the moment its shipment is dispatched
- **Category:** Concurrency
- **Source file or endpoint:** src/backend/src/lib/numbering.js (isOverlap); src/backend/src/routes/orders.js (update)
- **Evidence:** Found by reading the server log of the first full Phase 8 regression run: six dispatch requests answered 500 in the scenario that cancels an order while its shipment is dispatched. The database had stopped one of the two saves as a deadlock (the cancel releases the reserved stock while the dispatch takes it). The scenario itself had passed, because the records were right in every round: the save that lost was rolled back whole. A later run showed the cancel side answering 500 the same way.
- **Expected:** The save that loses is run again and its user is told plainly what happened (409).
- **Actual:** A 500 with "Failed to dispatch" or "Failed to update order". Nothing was half-saved.
- **Root cause or suspected cause:** A deadlock met by one of the database client's own statements is reported with no error code, only the database's words, so the retry did not recognise it; and the order save had no retry.
- **Operational impact:** Rare: needs a cancel and a dispatch of the same order within the same fraction of a second. The user saw an error and had to look again. No record was wrong.
- **Recommended correction:** The retry recognises this third form of the same event, and the order save uses the retry. The loser now answers 409.
- **Required tests:** Cancel and dispatch together, many rounds: every answer is 200 or 409.
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Verification evidence:** qa/sim/phase8-fulfillment.mjs: "an order cancelled at the very moment its shipment is dispatched ends one way or the other, never half of each" now also checks that no request is answered with a server error; src/backend/test/phase8Rules.test.js (overlap forms). With the recognition removed the scenario fails. The order-save retry was run 36 rounds with no error; without it one round in about twelve failed, so its removal is not a reliable mutation and is not counted.
- **First recorded in:** Phase 8 fulfilment and order-to-cash audit

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

### S-008 · P2 · VERIFIED FIXED

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
- **Required tests:** Both entry screens list the branches in the database; Browser check
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Open Phase 5: order entry, Retail POS and the mobile rep screen take the branch list from the server (GET /api/orders/intake/branches): the person's own branches, home branch first, every branch for a manager. The fixed list of four Michigan branches is gone.
- **Verification evidence:** qa/sim/ui-phase5.cjs: "order entry: the home branch is chosen to start", "order entry: only this login's branches are offered"; qa/sim/phase5-sales.mjs: "order entry sells from the person's own branch".
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
- **Status note:** Open Phase 6: still the owner's. It now also blocks K-006 (connecting the Steel Outlet remnant list to stock).
- **First recorded in:** qa/engineering-quality-findings.md

### S-010 · P1 · ACCEPTED RISK WITH APPROVAL

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
- **Status note:** Owner's decision 10, 2026-11-15: Built as recommended: (1) a manager ends a shipment that has a problem as lost, destroyed or refused for good, with what happened, and what is not yet credited on its invoice is credited in the same save; nothing is automatic. (2) Invoices and payments are read by sales, managers, leadership and the view-only roles; other staff see only that an invoice exists, its number and status. (3) The web shop takes no payment method and says every web order is on account. Not built, by the same decision: (4) carriers stay as tracking numbers typed by dispatch until a carrier contract exists; (5) the delivery promise screens stay as they are, for demonstration. Still open: (6) accounting. The owner asked for advice on an internal ledger; three answers are needed before it is built (when cost of goods counts, the chart of accounts, the start date). Owner decision 10 (2026-11-15): "leave the promise date for demo purposes its fine". The delivery promise, cutoff and branch comparison screens stay on sample data, and the screens stay labelled as samples. Risk accepted by the owner: a promise date shown at web checkout is not worked out from real stock or capacity.
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
- **Status note:** Open Phase 5: the field now says it is not applied (see J-008, which extends this to five more fields). Still the owner's decision how a discount combines with a contract tier.
- **First recorded in:** qa/engineering-quality-findings.md

### S-021 · P2 · VERIFIED FIXED

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
- **Required tests:** One RFQ screen; route removed or linked
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice. Phase 5, owner decision 1 (connect or retire the Order Hub): retired. Every /orderhub address now opens RFQs & Quotes, the one console that saves requests, quotes and orders in the database. The help text was updated.
- **Verification evidence:** qa/sim/ui-phase5.cjs: "old Order Hub address: goes to the request inbox".
- **First recorded in:** qa/engineering-quality-findings.md

### S-022 · P2 · VERIFIED FIXED

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
- **Required tests:** Contract scan and route inventory show no unused sales route
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Open Phase 5: the counter-session routes that created customers and orders by their own rules (no tax, no credit check) now answer 410 SESSION_FLOW_CLOSED and say which screen to use. The reading steps of the session still answer. The simulation's counter job now enters the counter order through Retail POS.
- **Verification evidence:** qa/sim/phase5-sales.mjs: "the unused counter-session flow no longer creates customers or orders"; qa/sim/run.mjs counter job.
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

### S-026 · P2 · VERIFIED FIXED

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
- **Required tests:** `api-contract.md` shows 0 sales calls without a route
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Open Phase 5: the screen calls to routes that do not exist were removed (api/pricing.js keeps only the price check and contract lookup; api/index.js lost three order calls with no route). No screen used them.
- **Verification evidence:** Lint and production build pass; the screen audit and every-screen-opens check pass; qa/tools/frontend-checks.mjs ratchets unchanged or lower.
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

### U-002 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order Hub RFQ pages
- **Category:** User experience
- **Source file or endpoint:** Order Hub RFQ pages
- **Actual:** A second RFQ console beside RFQs & Quotes
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice. Phase 5: see S-021.
- **Verification evidence:** qa/sim/ui-phase5.cjs.
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
- **Deferred: reason:** The 66 calls are in the code of sample modules that are to be rebuilt on real records (owner decision 4).
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Remove each call with its sample screen, or build its route with the module.
- **Deferred: dependencies:** Owner decision 4.
- **Deferred: acceptance criteria:** qa/api-contract.md reports 0 calls with no route.
- **Deferred: verification:** qa/tools/api-contract.mjs in the gate run.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open; 18 are sales calls (S-026) Phase 9: on opening, no screen of the 130 in the smoke run calls a route that does not exist (the only 404 answers are for the made-up record ids the run uses). The static scan (qa/api-contract.md) still finds 66 calls written in screen code with no server route, down from 155; they sit behind controls on sample screens, which now answer "not built" (V-007) and do not make the call.
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

### U-008 · P3 · ACCEPTED RISK WITH APPROVAL

- **Discovered:** 2026-11-13
- **Module:** Sales Rep Mobile, delivery preview
- **Category:** User experience
- **Source file or endpoint:** Sales Rep Mobile, delivery preview
- **Actual:** A date nobody computed
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Caution notice added; engine open (S-010) Phase 9: this is the delivery promise logic of S-010. Owner decision 10 (2026-11-15) leaves promise dates as they are for demonstration. The caution notice stays on the screen.
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

### U-011 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Order entry, Retail POS
- **Category:** User experience
- **Source file or endpoint:** Order entry, Retail POS
- **Actual:** Branch list fixed at four Michigan branches
- **Assigned phase:** Phase 5: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal
- **Status note:** Open (S-008) Phase 5: see S-008.
- **Verification evidence:** qa/sim/ui-phase5.cjs, order entry checks.
- **First recorded in:** qa/ux-improvement-register.md

### U-012 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Customers > Preferences
- **Category:** User experience
- **Source file or endpoint:** Customers > Preferences
- **Actual:** "Default Discount %" is offered and applied nowhere
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open: decision S-020 Phase 5: see J-008.
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
- **Deferred: reason:** Owner decision 4 (2026-11-14): the sample modules are to be built on real records later; they are not to be removed or dressed up.
- **Deferred: target phase:** The phase the owner issues for building the sample modules; if none does, Phase 12 records them as not built
- **Deferred: required correction:** Build supplier quality on real records.
- **Deferred: dependencies:** Owner decision 4.
- **Deferred: acceptance criteria:** The screens read and write real records and the sample notice is gone.
- **Deferred: verification:** qa/tools/screen-audit.mjs classes them REAL.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work. Phase 9: examined. The six screens stay marked as samples. Every control on them now has a name, every button answers (with the not-built notice where nothing is behind it, V-007) and none announces a save that did not happen (V-008).
- **First recorded in:** qa/ux-improvement-register.md

### U-020 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Menu
- **Category:** User experience
- **Source file or endpoint:** Menu
- **Actual:** "Inventory" and "Units" were two different stock lists
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Owner's decision 1, 2026-11-13: The stock items list that orders, receiving, shipping and invoices update is the real stock, and sales orders are the real orders. The second stock list and the order hub are to be connected to them or retired, never built on separately. This is the engineer's recommendation, adopted under the owner's instruction to use the best logical choice. Phase 9: verified. The menu has one stock list, Inventory, and the address of the second list leads to it.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the addresses of two retired screens lead to the real ones (U-020, U-028)".
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
- **Deferred: reason:** A new function, not a defect in a screen; it needs the owner's word on how mill certificates arrive.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Add a heat from the receiving form, or several from a file.
- **Deferred: dependencies:** I-017.
- **Deferred: acceptance criteria:** A receipt for a new heat is completed on one screen.
- **Deferred: verification:** A receiving scenario.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (I-017) Phase 9: examined. Receiving against a heat not on file is refused with what to do (Phase 6). Adding several heats in one step is a speed improvement for a first load and was not built.
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

### U-028 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Old operator screen
- **Category:** User experience
- **Source file or endpoint:** Old operator screen
- **Actual:** Recorded output into nothing
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Removed (M-010): opens the real shop floor Phase 9: verified. The old operator screen's address leads to the real shop floor.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the addresses of two retired screens lead to the real ones (U-020, U-028)".
- **First recorded in:** qa/ux-improvement-register.md

### U-029 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Production quality, BOMs
- **Category:** User experience
- **Source file or endpoint:** Production quality, BOMs
- **Actual:** Invented data presented as real
- **Deferred: reason:** Owner decision 4 (2026-11-14).
- **Deferred: target phase:** The phase the owner issues for building the sample modules; if none does, Phase 12 records them as not built
- **Deferred: required correction:** Build production quality and bills of material on real records.
- **Deferred: dependencies:** Owner decision 4.
- **Deferred: acceptance criteria:** The screens read and write real records and the sample notice is gone.
- **Deferred: verification:** qa/tools/screen-audit.mjs classes them REAL.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work. Phase 9: examined. The screens stay marked as samples. Two buttons that announced "NCR created successfully!" and "Inspection submitted successfully!" with nothing saved now say nothing was saved (V-008).
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
- **Deferred: reason:** Owner decision 4, and N-026: tracking numbers are typed by dispatch until a carrier contract exists.
- **Deferred: target phase:** The phase the owner issues for carriers and freight; if none does, Phase 12 records them as not built
- **Deferred: required correction:** Build freight on a real carrier connection.
- **Deferred: dependencies:** A carrier contract (N-026).
- **Deferred: acceptance criteria:** The screens read real rates and tracking and the sample notice is gone.
- **Deferred: verification:** qa/tools/screen-audit.mjs classes them REAL.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work. Phase 9: examined. The freight screens stay marked as samples. "Book shipment" announced a booking with a carrier that was never made; it now says nothing was booked (V-008). No carrier is connected (N-026).
- **First recorded in:** qa/ux-improvement-register.md

### U-036 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-13
- **Module:** Shipment
- **Category:** User experience
- **Source file or endpoint:** Shipment
- **Actual:** No button to print a bill of lading or packing list
- **Assigned phase:** Phase 8: shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout
- **Status note:** Open (F-011) Phase 8: the shipment screen has "Packing list" and "Bill of lading" buttons that open the paper as it will print (N-019).
- **Verification evidence:** qa/sim/ui-phase8.cjs: "packing list: opens as it will print, with the shipment, the order and the stock item", "bill of lading: drawn from the shipment".
- **First recorded in:** qa/ux-improvement-register.md

### U-037 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-13
- **Module:** Safety, maintenance, training, contractors, customer quality, executive, provenance
- **Category:** User experience
- **Source file or endpoint:** Safety, maintenance, training, contractors, customer quality, executive, provenance
- **Actual:** Invented data presented as real
- **Deferred: reason:** Owner decision 4 (2026-11-14).
- **Deferred: target phase:** The phase the owner issues for building the sample modules; if none does, Phase 12 records them as not built
- **Deferred: required correction:** Build each module on real records.
- **Deferred: dependencies:** Owner decision 4.
- **Deferred: acceptance criteria:** The screens read and write real records and the sample notice is gone.
- **Deferred: verification:** qa/tools/screen-audit.mjs classes them REAL.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work. Phase 9: examined. The screens stay marked as samples. Three maintenance buttons that announced a purchase order, a parts receipt and a schedule with nothing saved now say nothing was saved (V-008).
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
- **Deferred: reason:** Owner decision 4 (2026-11-14).
- **Deferred: target phase:** The phase the owner issues for building the sample modules; if none does, Phase 12 records them as not built
- **Deferred: required correction:** Build the modules, or mark sample entries in the menu if the owner asks.
- **Deferred: dependencies:** Owner decision 4.
- **Deferred: acceptance criteria:** No sample screen sits unmarked beside a real one.
- **Deferred: verification:** qa/tools/screen-audit.mjs.
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (X-009) Phase 9: the 58 sample screens are still in the menu beside the real ones, each with its standing notice. They were not hidden (the Phase 9 instruction forbids hiding in place of fixing) and not removed (owner decision 4). The search and each role's menu offer only the pages the role may open. The menu itself does not mark which entries are samples; that is a small change the owner may want and is not made here because it changes the look of the menu for every user.
- **First recorded in:** qa/ux-improvement-register.md

### U-041 · P3 · ACCEPTED RISK WITH APPROVAL

- **Discovered:** 2026-11-13
- **Module:** Checkout, order entry
- **Category:** User experience
- **Source file or endpoint:** Checkout, order entry
- **Actual:** Promise dates and branch suggestions from invented rules
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Open (X-007) Phase 9: this is the delivery promise and branch suggestion logic of S-010. Owner decision 10 (2026-11-15) leaves it as it is for demonstration. The cutoff shown in the top bar is the same logic (V-031).
- **First recorded in:** qa/ux-improvement-register.md

### V-001 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Application shell
- **Workflow:** Finding a record
- **Category:** Control with nothing behind it
- **Source file or endpoint:** src/frontend/src/components/layout/TopBar (search box)
- **Evidence:** Baseline audit and code read: the search box in the top bar took typing and did nothing. No handler, no call.
- **Expected:** The search finds pages and records the person may open.
- **Actual:** A box that looked like a search and searched nothing.
- **Operational impact:** Every user met a dead control on every screen. Finding an order meant opening the Orders page and paging through the list.
- **Recommended correction:** A real search (components/layout/GlobalSearch.jsx): pages of the menu by name, and orders, customers, stock, heats and shipments by number or name, from lists the server already limits by branch and role. Ctrl+K or Command+K from anywhere; arrow keys and Enter.
- **Required tests:** Find each kind of record; a role is offered only its own pages; another branch's record is not found.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs, navigation group: the search scenarios (pages, each record kind, keyboard, roles, branches). qa/tools/phase9-mutations.cjs 13: with the role filter removed a scenario fails.
- **First recorded in:** Phase 9 screen and interaction audit

### V-002 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Application shell
- **Workflow:** Help and settings
- **Category:** Control with nothing behind it
- **Source file or endpoint:** Top bar Help icon; sidebar settings icon
- **Evidence:** Baseline audit: both icons had no action.
- **Expected:** An icon does something or is not there.
- **Actual:** Two dead icons on every screen.
- **Operational impact:** Small, but on every screen.
- **Recommended correction:** Help opens the instruction manual. The settings icon was a second, dead way to nowhere and is gone; settings pages are in the menu for the roles that have them.
- **Required tests:** Help opens the manual.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs, navigation group: "the help button opens the instruction manual".
- **First recorded in:** Phase 9 screen and interaction audit

### V-003 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Application shell
- **Workflow:** Notifications
- **Category:** Invented data
- **Source file or endpoint:** Top bar bell
- **Evidence:** Code read: the bell showed a fixed count and three invented notifications, the same for every user.
- **Expected:** No invented operational data (Phase 9 prohibition).
- **Actual:** Invented notifications presented as real.
- **Operational impact:** Users could act on a notice that was never raised.
- **Recommended correction:** The bell is removed. No notification service exists in the product; email and text notices are owner decision 5 (later).
- **Required tests:** No screen shows a notification that the server did not send.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** An in-product notification list is not built. It belongs with owner decision 5 and is not invented here.
- **Verification evidence:** qa/sim/phase9-ui.cjs, navigation group: "the top bar shows no notification the server did not send".
- **First recorded in:** Phase 9 screen and interaction audit

### V-004 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** All screens
- **Workflow:** Knowing where you are
- **Category:** Accessibility and orientation
- **Source file or endpoint:** index.html title; 129 page components
- **Evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json): 130 screens shared one browser title ("SteelWise ERP"); 129 of 154 had no main heading.
- **Expected:** Each page has its own title and one main heading (WCAG 2.4.2, 1.3.1, 2.4.6).
- **Actual:** A screen reader user, and anyone with several tabs open, could not tell one page from another.
- **Operational impact:** Orientation, tab switching, browser history.
- **Recommended correction:** Each page has one main heading (codemod qa/tools/codemods/phase9-a11y.cjs plus hand edits), the browser title follows it, a record page is titled with its number, and focus moves to the content on a real change of page. A skip link leads past the menu.
- **Required tests:** Titles differ; one main heading; focus and skip link.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), final run: see phase-09-accessibility.md for the count of screens left without a main heading. qa/sim/phase9-ui.cjs: "every page has its own browser title, taken from its heading", "each main screen has one heading, one main area, a named menu and a search landmark", "the skip link is the first stop and jumps past the menu", "moving between pages by the menu announces the page and moves focus to it". qa/tools/phase9-mutations.cjs 14. qa/tools/frontend-checks.mjs fails if a page component loses its heading.
- **First recorded in:** Phase 9 screen and interaction audit

### V-005 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Sign-in
- **Workflow:** A session that ends while working
- **Category:** Lost place
- **Source file or endpoint:** src/frontend/src/api/client.js; pages/Auth/LoginPage.jsx
- **Evidence:** Reproduced in a browser before the fix: with an expired token on /orders/invoices the person was sent to sign in and then landed on the home page.
- **Expected:** After signing in again the person is back where they were, and is told why they were asked.
- **Actual:** Dropped at home with no explanation.
- **Operational impact:** Lost place many times a day on shared terminals.
- **Recommended correction:** The sign-in page says the session ended and returns to the page asked for. The way back is checked: only a path inside the application is accepted.
- **Required tests:** Expired session returns to the page; an outside address is ignored.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the session ends in the middle of work: the person is told, signs in, and is back on the same page" and "the way back after sign-in cannot be pointed at another site". qa/tools/phase9-mutations.cjs 17 and 18.
- **First recorded in:** Phase 9 screen and interaction audit

### V-006 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** All screens
- **Workflow:** Using the product with a keyboard or a screen reader
- **Category:** Accessibility
- **Source file or endpoint:** 613 controls and 280 fields across 154 screens
- **Evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json): 613 controls with no name a screen reader can say and 280 fields with no label. This is the measured size of B-015 and J-013.
- **Expected:** Every control and field has an accessible name (WCAG 4.1.2, 1.3.1, 3.3.2).
- **Actual:** Icon buttons announced as "button"; fields announced as "edit text".
- **Operational impact:** The product could not be used without sight on most screens.
- **Recommended correction:** Every icon button is named and every field labelled (codemod plus hand edits); a column with no name is not offered for sorting.
- **Required tests:** Audit reads 0 and 0.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), final run: 0 controls with no name, 0 fields with no label. qa/tools/ui-audit-gate.cjs holds both at 0 in the gate run; qa/tools/frontend-checks.mjs fails on a new unnamed icon button (proved by adding one).
- **First recorded in:** Phase 9 screen and interaction audit

### V-007 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Sample screens and several real ones
- **Workflow:** Pressing a button
- **Category:** Control with nothing behind it
- **Source file or endpoint:** 206 buttons
- **Evidence:** Static scan (qa/tools/codemods/phase9-not-built.cjs): 206 buttons had no action at all.
- **Expected:** A button acts, or says plainly that it is not built. It is not hidden.
- **Actual:** Pressing did nothing and said nothing.
- **Operational impact:** Users pressed, waited and pressed again.
- **Recommended correction:** 34 were connected to the function that already existed. 172, all on screens marked as samples, now answer with a notice: the name of the button, "is not built yet", "Nothing was saved or sent".
- **Required tests:** Press sample buttons: each answers; nothing is sent.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The functions behind the 172 are not built. They belong to the sample modules (owner decision 4, U-040).
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a button on a sample screen says it is not built and sends nothing". qa/tools/phase9-mutations.cjs 19. qa/tools/frontend-checks.mjs fails on a new button with no action.
- **First recorded in:** Phase 9 screen and interaction audit

### V-008 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Sample screens; counter sales
- **Workflow:** Saving a form
- **Category:** False confirmation
- **Source file or endpoint:** Maintenance (PM schedules, parts), production quality (inspection, NCR), freight comparison, counter sale confirmation, will-call completion, order hub
- **Evidence:** Code read in Phase 9: ten buttons opened a browser box announcing "Purchase order created!", "Parts received and inventory updated!", "PM Schedule created!", "NCR created successfully!", "Disposition saved successfully!", "Inspection submitted successfully!", "Shipment booked with ...", "Email confirmation sent to ..." and the like. None sent anything to the server.
- **Expected:** The product never says a record was saved, sent or booked when it was not.
- **Actual:** A plain statement of success for work that did not happen. Two were on real counter-sale screens (the email confirmations).
- **Operational impact:** A person could walk away believing an NCR, a purchase order or a customer email existed.
- **Recommended correction:** Each now shows the not-built notice: "is not built yet. Nothing was saved or sent."
- **Required tests:** Press one: no browser box, the notice shows, nothing is sent.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a sample form that used to announce a save now says nothing was saved". qa/tools/phase9-mutations.cjs 24.
- **First recorded in:** Phase 9 screen and interaction audit

### V-009 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shop floor, staff, users, order audit log, schedule optimisation
- **Workflow:** Confirming an action
- **Category:** Dialogs
- **Source file or endpoint:** 16 uses of the browser's confirm(), alert() and prompt()
- **Evidence:** Static scan: 26 browser boxes in all (10 are V-008). The other 16 asked real questions or reported real errors through the browser's own box, which freezes the page, reads "localhost says" and cannot be styled.
- **Expected:** The application's own dialogs (the second half of B-015).
- **Actual:** Browser boxes.
- **Operational impact:** Inconsistent, poor for screen readers, and blocked by some browser settings so the action silently never happens.
- **Recommended correction:** One service (utils/ask.js, components/common/AskHost.jsx): a question with named buttons, an optional required reason, and a message bar. All 26 uses are gone.
- **Required tests:** Deactivate a user: asked in the application's box; Cancel sends nothing; confirm sends once.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "deactivating a user asks in the application's own box, and Cancel changes nothing". qa/tools/phase9-mutations.cjs 23. qa/tools/frontend-checks.mjs fails on any browser box (proved by adding one).
- **First recorded in:** Phase 9 screen and interaction audit

### V-010 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Design system
- **Workflow:** Reading the screen
- **Category:** Colour contrast
- **Source file or endpoint:** src/frontend/src/theme/index.js; chips, captions, status colours
- **Evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json): 1,751 texts below 4.5 to 1 against their background (WCAG 1.4.3).
- **Expected:** Text can be read.
- **Actual:** Grey captions, status chips and tinted labels below the ratio on most screens.
- **Operational impact:** Hard to read on a shop terminal or in daylight.
- **Recommended correction:** Status and text colours darkened once, in the theme, with named tokens (tint, ink); no screen was restyled by hand except where it set its own colour.
- **Required tests:** Audit count falls and cannot rise.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The 17 that remain are V-011.
- **Verification evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), final run: 17 texts on 4 screens. qa/tools/ui-audit-gate.cjs holds the ceiling.
- **First recorded in:** Phase 9 screen and interaction audit

### V-011 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Sample screens mostly
- **Workflow:** Reading the screen
- **Category:** Colour contrast
- **Source file or endpoint:** 17 texts on 4 screens; 6 colour pairs
- **Evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), final run: 17 texts on 4 screens remain below 4.5 to 1: chart limit labels on the statistical process control sample screen, which the tool reads as drawn in the colour of their own line (12); two figures on the order speed metrics dashboard, which the tool reads as white on white because they sit on a shaded panel it cannot read (2); and three status chips on the stop-work sample screens at 3.96 to 4.23 to 1 (3). An earlier measure read 42 on 10 screens; the fall to 17 is the four real screens corrected after the full run and a correction of the measure, which had counted text caught while fading in.
- **Expected:** 0.
- **Actual:** 17.
- **Operational impact:** Small labels on four screens, three of them samples.
- **Recommended correction:** Not made in Phase 9: each sets its colour in its own file, most on sample screens that are to be rebuilt on real records.
- **Deferred: reason:** Each is a one-off colour in a screen file, most of them sample screens due to be rebuilt (owner decision 4).
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Use the theme tokens in those ten screens.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** The audit reads 0 hard-to-read texts.
- **Deferred: verification:** qa/tools/ui-audit-gate.cjs, ceiling lowered to 0.
- **Required tests:** Audit reads 0.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-012 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Lists and cards on 60 screens
- **Workflow:** Opening a record without a mouse
- **Category:** Accessibility
- **Source file or endpoint:** 87 rows and cards with a click handler only
- **Evidence:** Static scan (qa/tools/codemods/phase9-clickable.cjs): 87 table rows and cards opened on a mouse click and could not be reached or opened from the keyboard (WCAG 2.1.1).
- **Expected:** Anything that opens with a click opens with the keyboard.
- **Actual:** Mouse only.
- **Operational impact:** Keyboard and switch users could see a list and not open anything in it.
- **Recommended correction:** Each takes focus and opens on Enter or Space (utils/activateOnKey.js).
- **Required tests:** Open a stock item from its row with the keyboard.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a stock item opens from its row with the keyboard and shows what is on file", and the same for a work order and a shipment. qa/tools/phase9-mutations.cjs 11. qa/tools/frontend-checks.mjs fails on a new click-only row (proved).
- **First recorded in:** Phase 9 screen and interaction audit

### V-013 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Design system
- **Workflow:** Seeing where the keyboard is
- **Category:** Accessibility
- **Source file or endpoint:** theme/index.js
- **Evidence:** Found by a Phase 9 scenario that tabs through the shell: several controls took focus with no visible ring (WCAG 2.4.7); the theme's ring was overridden by component styles.
- **Expected:** A visible ring on every control that has keyboard focus.
- **Actual:** No ring on menu items, chips and contained buttons.
- **Operational impact:** A keyboard user loses their place.
- **Recommended correction:** One rule in the theme that component styles cannot override; a white ring where the control is itself the brand colour.
- **Required tests:** Tab through the shell: every stop has a ring.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the keyboard's place is always visible: every stop of the first twenty has a focus ring". qa/tools/phase9-mutations.cjs 10.
- **First recorded in:** Phase 9 screen and interaction audit

### V-014 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Routing
- **Workflow:** A wrong or old address
- **Category:** Error handling
- **Source file or endpoint:** router catch-all
- **Evidence:** Reproduced: an address that does not exist showed the dashboard under the wrong address.
- **Expected:** A page that says the address is wrong and offers the way back.
- **Actual:** The dashboard, silently.
- **Operational impact:** An old bookmark looks as if it worked.
- **Recommended correction:** A "Page not found" page (components/common/NotFoundPage.jsx).
- **Required tests:** Open an unknown address.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "an address that is not a page says so and offers a way on". qa/tools/phase9-mutations.cjs 6.
- **First recorded in:** Phase 9 screen and interaction audit

### V-015 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Application shell on a phone
- **Workflow:** Opening the menu
- **Category:** Accessibility
- **Source file or endpoint:** components/layout/Sidebar.jsx
- **Evidence:** Found by a Phase 9 scenario: on a phone the menu was outside any navigation landmark and Tab left the open menu for the page behind it.
- **Expected:** The menu is a navigation landmark and keeps focus while open.
- **Actual:** Neither.
- **Operational impact:** Screen reader and keyboard use on phones.
- **Recommended correction:** Both menus are a navigation landmark named "Main menu"; the phone menu keeps focus and closes on Escape.
- **Required tests:** Phone width: open, tab, Escape.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "on a phone the menu is a drawer: it opens, traps nothing behind it, and closes on a choice". qa/tools/phase9-mutations.cjs 9.
- **First recorded in:** Phase 9 screen and interaction audit

### V-016 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Role workspaces
- **Workflow:** Starting work after sign-in
- **Category:** Productivity
- **Source file or endpoint:** config/roleAccess.js; LoginPage; AppLayout
- **Evidence:** Every role landed on the same general dashboard, which several roles could not use for their work.
- **Expected:** A role starts where its work is.
- **Actual:** One more navigation at every sign-in.
- **Operational impact:** One click and one page load per sign-in for most staff.
- **Recommended correction:** Each role starts at its workspace: sales at Orders, planners at the schedule, operators at the shop floor, stock and buying at Inventory, receiving at Receiving, the dock at Shipping, quality at QC; managers and leadership at the dashboard. A page asked for by address still wins.
- **Required tests:** Seventeen roles sign in: each lands on its workspace and sees only its menu.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The mapping of role to start page is the engineer's choice from the role's permissions; the owner may change any of them in config/roleAccess.js.
- **Verification evidence:** qa/sim/phase9-ui.cjs, navigation group: one scenario per role, "signs in at the form, starts at its workspace, and the menu and the server refuse what the role may not open". qa/tools/phase9-mutations.cjs 5. Measured in qa/results/productivity.json.
- **First recorded in:** Phase 9 screen and interaction audit

### V-017 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Order entry
- **Workflow:** Leaving a half-entered order
- **Category:** Unsaved work
- **Source file or endpoint:** pages/Orders/CSRIntakePage.jsx
- **Evidence:** Reproduced: a half-entered order was lost without a word on a menu click, a browser Back or a reload.
- **Expected:** A warning before typed work is thrown away.
- **Actual:** Silent loss.
- **Operational impact:** Re-keying an order.
- **Recommended correction:** A guard (components/common/UnsavedWorkGuard.jsx) asks before leaving inside the application and before a reload or tab close.
- **Required tests:** Type, leave: asked. Stay keeps the work. Leave goes.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Applied to order entry, the longest form. Other long forms are V-018.
- **Verification evidence:** qa/sim/phase9-ui.cjs: the three "order entry:" scenarios (leaving asks and Stay keeps every entry; Leave leaves and an untouched form never asks; closing or reloading the tab warns). qa/tools/phase9-mutations.cjs 7 and 8.
- **First recorded in:** Phase 9 screen and interaction audit

### V-018 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Other long forms
- **Workflow:** Leaving a half-entered form
- **Category:** Unsaved work
- **Source file or endpoint:** Quote builder, receiving, purchase order entry, customer form, user form
- **Evidence:** Code read: only order entry uses the guard. Dialog forms close on Cancel without asking; that is checked ("Cancel changes nothing") and is the intended behaviour, but a typed dialog closed by Escape loses its text.
- **Expected:** The same warning wherever more than a few fields can be lost.
- **Actual:** Order entry only.
- **Operational impact:** Occasional re-keying.
- **Recommended correction:** Not made.
- **Deferred: reason:** Phase 9 guarded the form where loss costs most and proved the guard; the others are the same component applied form by form.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Use UnsavedWorkGuard in the remaining full-page forms; ask before Escape closes a typed dialog.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** Each named form asks before typed work is lost.
- **Deferred: verification:** Scenarios as for V-017.
- **Required tests:** As V-017 for each form.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-019 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Orders
- **Workflow:** Searching orders
- **Category:** Search that does not narrow
- **Source file or endpoint:** src/backend/src/routes/orders.js (list)
- **Evidence:** Found by a Phase 9 scenario: the order list ignored the search text and answered the first page whatever was typed.
- **Expected:** The list narrows to the text.
- **Actual:** Unfiltered.
- **Operational impact:** An order outside the first page could not be found by number.
- **Recommended correction:** The list accepts a search over order number, purchase order reference and buyer name. It only narrows: branch and role limits are applied first.
- **Required tests:** Search a number; search nonsense.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "search: an order is found by its number and opens the order" and "search: nothing found says what to try, and Escape closes and clears" (an unknown number must find no order). qa/tools/phase9-mutations.cjs 4.
- **First recorded in:** Phase 9 screen and interaction audit

### V-020 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Orders
- **Workflow:** Reading an order's money
- **Category:** Wrong figures on screen
- **Source file or endpoint:** pages/Orders/OrderDetailPage.jsx; components/orders/PricingSummaryPanel.jsx
- **Evidence:** Found by a Phase 9 scenario comparing the screen with the record: the order page computed tax at a fixed 6% and showed no freight, so its total differed from the order on file and from the invoice. It also did not name the customer.
- **Expected:** The screen shows the subtotal, tax, freight and total on file.
- **Actual:** A total recomputed on the screen from an invented rate.
- **Operational impact:** Staff quoting a wrong total to a customer. No stored figure was wrong.
- **Recommended correction:** The panel shows the stored figures. The customer is named at the top of the order.
- **Required tests:** Compare each figure on screen with the record.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "an order page shows the number, customer, lines and money exactly as stored". qa/tools/phase9-mutations.cjs 2 and 3.
- **First recorded in:** Phase 9 screen and interaction audit

### V-021 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shop floor
- **Workflow:** Choosing a work centre
- **Category:** Wrong branch by default
- **Source file or endpoint:** apps/shopfloor/WorkCenterSelectPage.jsx; routes/auth.js
- **Evidence:** Found by a Phase 9 scenario: the shop floor opened on the first branch in the list for everyone.
- **Expected:** It opens on the person's own branch.
- **Actual:** Another branch's work centres, until changed by hand.
- **Operational impact:** An operator could open another branch's queue.
- **Recommended correction:** The screen starts at the person's home branch; the sign-in answer carries it.
- **Required tests:** An operator of branch 1 opens the shop floor.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The server still answers another branch's work centres if asked: V-028, Phase 10.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the shop floor lists the work centres of the operator's branch and opens one". qa/tools/phase9-mutations.cjs 15.
- **First recorded in:** Phase 9 screen and interaction audit

### V-022 · P1 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Shipping
- **Workflow:** Dispatching a shipment
- **Category:** Double click
- **Source file or endpoint:** pages/Shipping/ShipmentPage.jsx
- **Evidence:** Found by a Phase 9 scenario: a double click on "Dispatch now" in the confirmation dialog dispatched the shipment and then, the dialog having moved on to its next state, sent the next action too, which cancelled the shipment.
- **Expected:** One press, one action.
- **Actual:** A shipment that had just left was marked cancelled.
- **Operational impact:** A truck on the road with a cancelled shipment and its invoice in question.
- **Recommended correction:** The confirm button is off while a save is in flight and each dialog acts only on the question it asked.
- **Required tests:** Double click the confirmation.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "Dispatch asks first, and a double click on Dispatch now ships once and raises one invoice". qa/tools/phase9-mutations.cjs 1.
- **First recorded in:** Phase 9 screen and interaction audit

### V-023 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Customers
- **Workflow:** A bad answer from the server
- **Category:** Error handling
- **Source file or endpoint:** pages/Customers/CustomersPage.jsx
- **Evidence:** Found by a Phase 9 scenario feeding the screen an answer of the wrong shape: the page crashed to the error boundary.
- **Expected:** An error message and a way to retry.
- **Actual:** A crash.
- **Operational impact:** A blank page on a proxy or network fault.
- **Recommended correction:** An answer that cannot be read is an error with Retry.
- **Required tests:** Feed an unreadable answer.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "/customers: when there is nothing to list, the screen says there is nothing, not that something failed". qa/tools/phase9-mutations.cjs 12 (the first scenario chosen for this proof could not catch it and was replaced; recorded in qa/results/phase9-mutations.json).
- **First recorded in:** Phase 9 screen and interaction audit

### V-024 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Forms
- **Workflow:** Knowing what is required
- **Category:** Forms
- **Source file or endpoint:** 22 fields on six screens
- **Evidence:** Code read: required fields were marked by typing an asterisk into the label, which a screen reader reads as "star" and the browser does not treat as required.
- **Expected:** Required is a property of the field.
- **Actual:** A typed asterisk.
- **Operational impact:** Accessibility; inconsistent marking.
- **Recommended correction:** The 22 fields are marked required.
- **Required tests:** A required field says so to assistive technology.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a form tells a screen reader what is required and what is wrong". qa/tools/phase9-mutations.cjs 16.
- **First recorded in:** Phase 9 screen and interaction audit

### V-025 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Application shell
- **Workflow:** Every page load
- **Category:** Wasted call
- **Source file or endpoint:** contexts/CustomerSessionContext.jsx
- **Evidence:** Baseline audit: every staff screen asked the server for the web shop preferences of a fixed sample customer.
- **Expected:** A screen asks only for what it shows.
- **Actual:** One wasted call per page load, for every user.
- **Operational impact:** Load; noise in logs.
- **Recommended correction:** Asked for only by the web shop pages.
- **Required tests:** Twenty-four staff screens: no such call.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a long round of 24 screens in one tab" checks that no staff screen makes the call. qa/results/frontend-performance.json: 76 calls for 20 screens, none of them this one.
- **First recorded in:** Phase 9 screen and interaction audit

### V-026 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Order board
- **Workflow:** Opening the board
- **Category:** Performance
- **Source file or endpoint:** components/jobs/ModernKanbanBoard.jsx
- **Evidence:** qa/tools/frontend-performance.cjs on the production build: with 451 jobs the board blocked the page for 1,175 ms while it drew every card.
- **Expected:** No freeze a person notices.
- **Actual:** Over a second.
- **Operational impact:** Worse with every job added.
- **Recommended correction:** A column draws its 30 most urgent cards and offers the rest; counts and search still cover every job.
- **Required tests:** A full column offers more; search finds a job far down.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The board still receives every job from the server: V-027.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a full column on the order board draws its first cards and offers the rest". qa/tools/phase9-mutations.cjs 22. Measured after: 488 to 512 ms.
- **First recorded in:** Phase 9 screen and interaction audit

### V-027 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Order board, production board, schedule
- **Workflow:** Loading
- **Category:** Performance
- **Source file or endpoint:** GET /api/jobs with no limit; work centre list for administrators
- **Evidence:** qa/results/frontend-performance.json and the audit: the order board and the production board ask for every job (451 in the QA data) and the schedule for every work centre the role may see. The board still blocks for about 0.5 s.
- **Expected:** A bounded first load.
- **Actual:** Grows with the data.
- **Operational impact:** Slow boards at 85 branches for roles that see all branches.
- **Recommended correction:** Not made: it changes what the job list answers, which other screens and the contract tests depend on.
- **Deferred: reason:** A server change to a shared list, best made with the performance measurements of Phase 11.
- **Deferred: target phase:** Phase 11: performance and full simulation cycles
- **Deferred: required correction:** Ask for open jobs by column with a limit; load work centres by branch.
- **Deferred: dependencies:** The job list contract (Phase 4).
- **Deferred: acceptance criteria:** The boards block for under 200 ms at 85-branch scale.
- **Deferred: verification:** qa/tools/frontend-performance.cjs against scale data.
- **Required tests:** Measured load at 85-branch scale.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-028 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Dispatch API
- **Workflow:** Reading work centres
- **Category:** Branch boundary
- **Source file or endpoint:** GET /api/v1/dispatch/work-centers?locationId=; GET /api/v1/dispatch/locations
- **Evidence:** Found while fixing V-021: asked with another branch's id, the route answers that branch's work centres to an operator, and the locations route lists all branches to any signed-in user. Read only: names and types of work centres.
- **Expected:** A branch-limited role reads its own branch.
- **Actual:** Readable across branches by asking.
- **Operational impact:** Low: no stock, order, customer or money data. It is still a boundary that does not hold.
- **Recommended correction:** Not made in Phase 9. The screen no longer asks for another branch by default.
- **Deferred: reason:** A server access rule; Phase 10 is the security phase and owns the branch boundary suite.
- **Deferred: target phase:** Phase 10: security and infrastructure
- **Deferred: required correction:** Apply the branch scope to both routes.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** An operator cannot read another branch's work centres.
- **Deferred: verification:** qa/sim/branch-boundary.mjs gains the two routes.
- **Required tests:** An operator asks for another branch: refused or empty.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-029 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Dialogs
- **Workflow:** Opening a dialog with the keyboard
- **Category:** Accessibility
- **Source file or endpoint:** About 60 dialogs
- **Evidence:** Phase 9 dialog scenarios: every dialog has a name, keeps focus inside and closes on Escape. Focus lands on the dialog itself, not on its first field, so a keyboard user presses Tab once before typing.
- **Expected:** Focus on the first field of a form dialog.
- **Actual:** Focus on the dialog.
- **Operational impact:** One extra key press per dialog. It meets WCAG as it is.
- **Recommended correction:** Not made.
- **Deferred: reason:** It conforms as it is; the change is an autoFocus per dialog, about sixty edits, with a risk of stealing focus from an error message.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Give the first field of each form dialog initial focus.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** Each form dialog opens with the first field focused.
- **Deferred: verification:** The dialog scenarios gain the check.
- **Required tests:** Open a form dialog: the first field has focus.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-030 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-16
- **Module:** Orders
- **Workflow:** Duplicating an order
- **Category:** Not built
- **Source file or endpoint:** Order list and order page
- **Evidence:** Code read: two "Duplicate" buttons had no action and there is no server route that copies an order.
- **Expected:** A button acts or says it is not built.
- **Actual:** Dead buttons on real screens.
- **Operational impact:** Small.
- **Recommended correction:** The two buttons were taken off the real screens, because a "not built" notice on a working order page reads as a fault. Recorded here so the function is not forgotten.
- **Required tests:** None until built.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The owner decides whether copying an order is wanted, and what a copy carries over (prices at today's price book or the old ones, the purchase order reference, the dates).
- **First recorded in:** Phase 9 screen and interaction audit

### V-031 · P3 · ACCEPTED RISK WITH APPROVAL

- **Discovered:** 2026-11-16
- **Module:** Application shell
- **Workflow:** The branch and cutoff shown in the top bar
- **Category:** Invented rule
- **Source file or endpoint:** Top bar chip ("Jackson, Metals, Cutoff 3:30"); contexts/CustomerSessionContext.jsx
- **Evidence:** Code read: the chip takes its branch names and cutoff times from a fixed list in the screen code, not from the branches on file. It is part of the promise-date sample logic (S-010, U-041).
- **Expected:** Real branches and a real rule, or nothing.
- **Actual:** A fixed list.
- **Operational impact:** A user may read the cutoff as policy.
- **Recommended correction:** Not changed.
- **Required tests:** None.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** Owner decision 10 (2026-11-15): promise dates are left as they are for demonstration. The chip is the same logic and is left with it.
- **First recorded in:** Phase 9 screen and interaction audit

### V-032 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Counter sales
- **Workflow:** Who is signed in
- **Category:** Invented data
- **Source file or endpoint:** pages/Orders/RetailPOSPage.jsx and the counter sale screens
- **Evidence:** Code read: the counter sale screen showed the initials "JD" for every user.
- **Expected:** The person signed in.
- **Actual:** A fixed pair of letters.
- **Operational impact:** Small; misleading on a shared till.
- **Recommended correction:** The badge shows the initials and name of the person signed in.
- **Required tests:** Open the screen as a named user.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/phase9-ui.cjs: "the counter sale screen shows the initials of the person signed in".
- **First recorded in:** Phase 9 screen and interaction audit

### V-033 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Web shop
- **Workflow:** Checkout with an empty cart; product search
- **Category:** Accessibility
- **Source file or endpoint:** pages/Ecommerce/CheckoutPage.jsx; SearchResultsPage.jsx
- **Evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), clean run: these two screens had no main heading.
- **Expected:** One main heading.
- **Actual:** None.
- **Operational impact:** Orientation.
- **Recommended correction:** Headings added.
- **Required tests:** Audit.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), final run; see phase-09-accessibility.md.
- **First recorded in:** Phase 9 screen and interaction audit

### V-034 · P3 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Phones
- **Workflow:** Touching a control
- **Category:** Responsive
- **Source file or endpoint:** Icon buttons, chips and links on phone width
- **Evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json): 458 touch targets smaller than 24 by 24 CSS pixels at phone width (WCAG 2.5.8).
- **Expected:** Targets large enough to hit.
- **Actual:** 458 too small.
- **Operational impact:** Mis-taps on phones and on gloved shop terminals.
- **Recommended correction:** Minimum sizes set once in the theme for icon buttons, chips with actions and small buttons.
- **Required tests:** Audit.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Verification evidence:** qa/sim/ui-audit.cjs (154 screens at three sizes; before: qa/results/ui-audit-baseline.json), final run: 3 remain (a search box and a slider on two sample screens and one on the counter sale screen, each a text box measured by its inner part). Held by the ceiling.
- **First recorded in:** Phase 9 screen and interaction audit

### V-035 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Design system
- **Workflow:** One look across the product
- **Category:** Consistency
- **Source file or endpoint:** 94 screen and component files
- **Evidence:** Static count in Phase 9: 94 files set a colour of their own in code (92 different colours) where the theme has tokens for the meanings.
- **Expected:** Screens take colours, spacing and radii from the theme.
- **Actual:** A third of the files carry their own.
- **Operational impact:** The same status is a slightly different colour on different screens; the 17 hard-to-read texts left (V-011) are all of this kind.
- **Recommended correction:** Not made in Phase 9, which fixed the theme itself and the colours that failed contrast. Phase 9 forbids an uncontrolled global redesign.
- **Deferred: reason:** Replacing 92 colours across 94 files changes how every such screen looks and needs the owner to see it; most are sample screens to be rebuilt.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Replace each with the theme token of the same meaning, a module at a time, with before and after pictures.
- **Deferred: dependencies:** Owner decision 4 for the sample modules.
- **Deferred: acceptance criteria:** No screen file sets a colour the theme defines.
- **Deferred: verification:** A static count in qa/tools/frontend-checks.mjs, as a ceiling that only falls.
- **Required tests:** Static count.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-036 · P3 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Tables and dialogs
- **Workflow:** Reusing one component
- **Category:** Component reuse
- **Source file or endpoint:** 109 files draw a table; 3 use components/common/DataTable.jsx. 98 files draw a dialog
- **Evidence:** Static count in Phase 9.
- **Expected:** One table component with sorting, paging, empty and error states.
- **Actual:** Tables are built by hand per screen, so sorting, paging, an empty state and keyboard row opening exist on some and not on others. Phase 9 made the behaviours that matter for access the same everywhere (names, headings, keyboard rows, focus) by codemod, not by merging the components.
- **Operational impact:** Each new list repeats the work and can miss a state.
- **Recommended correction:** Not made: merging 109 tables is a rebuild of most screens, which Phase 9 forbids.
- **Deferred: reason:** A rebuild of most list screens; the access behaviours are already uniform and held by ratchets.
- **Deferred: target phase:** Phase 12
- **Deferred: required correction:** Move lists to the shared table as each module is next changed.
- **Deferred: dependencies:** None.
- **Deferred: acceptance criteria:** New and changed lists use the shared table.
- **Deferred: verification:** A static count that only falls.
- **Required tests:** None.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-037 · P2 · DEFERRED TO SPECIFIC PHASE

- **Discovered:** 2026-11-16
- **Module:** Dashboards
- **Workflow:** Trusting a summary figure
- **Category:** Not reconciled
- **Source file or endpoint:** Operations cockpit, sales dashboard, role dashboard, material tracking dashboard, order speed metrics
- **Evidence:** qa/sim/phase9-ui.cjs: "dashboards show no figure the server did not send: with the server failing, no tile shows a number" proves no figure is invented on six real dashboards. No test compares each summary figure with the records it summarises (testing gap 8, open since Phase 1).
- **Expected:** Each figure on a dashboard equals the same figure worked out from the records.
- **Actual:** Verified for the home dashboard's recent orders, the quality station counts, what customers owe by age and the time report. Not for the five dashboards named.
- **Operational impact:** A wrong summary would not be noticed by a test.
- **Recommended correction:** Not made in Phase 9.
- **Deferred: reason:** It needs a data set with known totals; the full simulation cycles of Phase 11 produce one.
- **Deferred: target phase:** Phase 11: performance and full simulation cycles
- **Deferred: required correction:** After a simulation cycle, read each dashboard in a browser and compare every figure with a query.
- **Deferred: dependencies:** The Phase 11 simulation.
- **Deferred: acceptance criteria:** Every tile of the five dashboards equals its query.
- **Deferred: verification:** A browser scenario per dashboard.
- **Required tests:** A run with known totals, compared tile by tile.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **First recorded in:** Phase 9 screen and interaction audit

### V-038 · P2 · VERIFIED FIXED

- **Discovered:** 2026-11-16
- **Module:** Menu
- **Workflow:** Reaching a real screen
- **Category:** Navigation
- **Source file or endpoint:** config/navigation.jsx
- **Evidence:** Found by the one Phase 9 scenario that failed in the full run ("a scheduler signs in at the form...": the menu did not offer Work Orders). The static screen audit confirms it: the work order list, a real screen that planners and schedulers use, had no entry in the menu for any role and was reached only from links on other screens. The same is true of the production workflow board (/production), bill of material recipes (/bom), schedule optimisation (/optimization) and the three account pages of the web shop, which are reached from buttons on their parent screens.
- **Expected:** A real list screen can be reached from the menu and found by the search.
- **Actual:** The work order list could not.
- **Operational impact:** Planners reached work orders only through a job or by a saved address; the search, which offers the pages of the menu, did not offer it.
- **Recommended correction:** Work Orders is in the Production section of the menu, for the roles that may open it, and so in the search.
- **Required tests:** A scheduler's menu offers Work Orders.
- **Assigned phase:** Phase 9: user interface, user experience, design system, role workspaces, navigation, responsive design, accessibility and interaction verification
- **Status note:** The other screens named are reached from their parent screens and were left as they are: adding them to the menu is a choice about the menu's shape, which is the owner's.
- **Verification evidence:** qa/sim/phase9-ui.cjs: "a scheduler signs in at the form, starts at /schedule, and the menu and the server refuse what the role may not open" (failed in the full run before the entry was added, passes after).
- **First recorded in:** Phase 9 screen and interaction audit

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
- **Status note:** Owner's decision 4, 2026-11-13: Every sample module is to be built on real records: safety, maintenance, training, contractors and visitors, customer quality, executive tools, production quality, supplier quality, freight planning, bills of material, provenance, will call. None is removed. The unused tables stay for that work. Phase 4: the screen-to-route contract check stays in the gates. Supplier shipping notices, corrective actions and scorecards in the partner API now answer 501 instead of failing (H-014).
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

