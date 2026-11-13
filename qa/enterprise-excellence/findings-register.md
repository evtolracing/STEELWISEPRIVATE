# Findings register

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit 958e90b. Do not edit by hand: change the source and rerun.

Source of truth: `findings.json` in this folder. Nothing is ever deleted from it. IDs are permanent: B = Phase 1 baseline; E, S, I, M, F, X = the six earlier workstreams; D = the first audit; U = user-experience register. The older registers in `qa/` are kept as history.

Severity: P0 critical security, financial integrity, data corruption or outage risk. P1 essential workflow failure or significant operational risk. P2 functional, architectural, performance or maintainability deficiency. P3 minor.

## Counts

| Severity | All | Still open |
|---|---:|---:|
| P0 | 20 | 2 |
| P1 | 69 | 20 |
| P2 | 63 | 37 |
| P3 | 58 | 25 |
| Total | 210 | 84 |

| Status | Count |
|---|---:|
| VERIFIED FIXED | 126 |
| REQUIRES BUSINESS DECISION | 40 |
| OPEN | 36 |
| IN PROGRESS | 4 |
| DEFERRED WITH JUSTIFICATION | 3 |
| BLOCKED | 1 |

## Open findings, most severe first

| ID | Sev | Status | Module | What is wrong | Assigned to |
|---|---|---|---|---|---|
| X-001 | P0 | REQUIRES BUSINESS DECISION | Safety (13 screens, on the menu) | Incidents, inspections, permits, training, observations, corrective actions and stop work all showed invented records. The calls to the server are commented out in the code. Nothing entered was saved | Enterprise experience |
| X-002 | P0 | REQUIRES BUSINESS DECISION | Maintenance (3), training (4), contractors and visitors (4), customer quality (4), executive (5), quality dashboard, test entry, provenance lookup | 23 more screens, most on the menu, showed invented data with no notice. Provenance lookup returned the same invented chain of custody for any heat or item typed in | Enterprise experience |
| B-003 | P1 | REQUIRES BUSINESS DECISION | Access control | Branch, division and region are fields on records and filters on screens. They are not an access boundary: every staff login reads every branch, and changes any branch within its department. | Security and multi-location phase (extends E-019) |
| B-004 | P1 | REQUIRES BUSINESS DECISION | Access control | 16 areas have no department rule. Any staff login that is not read-only can change them. | Security and multi-location phase |
| B-009 | P1 | REQUIRES BUSINESS DECISION | Second stock list, order hub, stop work | Two stock lists and two order pipelines. The second of each has no database rule on any value, and two requests at once can overwrite each other. | Phase 2: architecture and code quality (after the decision) |
| B-016 | P1 | OPEN | Testing | Order to cash is covered in depth. Outside it, most changing routes have no success-path test. | Testing phase; each phase for its own area |
| B-019 | P1 | REQUIRES BUSINESS DECISION | Platform | Everything happens only when someone opens a screen or presses a button. | Integration phase |
| E-004 | P1 | IN PROGRESS | Database | No check constraints anywhere | Phase 2: architecture and code quality |
| E-011 | P1 | REQUIRES BUSINESS DECISION | Platform | Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high) | Phase 2: architecture and code quality |
| E-014 | P1 | OPEN | Platform | The request rate limit counts per server instance | Phase 2: architecture and code quality |
| E-015 | P1 | REQUIRES BUSINESS DECISION | Platform | No evidence that a backup has ever been restored | Phase 2: architecture and code quality |
| E-023 | P1 | IN PROGRESS | Operations cockpit | `GET /api/ops-cockpit` loaded every job, order with lines, stock item, shipment and dispatch operation on each call. It also tested for job and shipment statuses that do not exist, so completed jobs were treated as open  | Phase 2: architecture and code quality |
| I-007 | P1 | REQUIRES BUSINESS DECISION | Purchasing | There is no purchase order: nothing records what was ordered from a mill, what is due, or whether a receipt matches an order or a supplier invoice | Inventory and purchasing |
| I-011 | P1 | REQUIRES BUSINESS DECISION | Supplier quality (six screens) | Inbound receiving, IQC inspections, nonconformances, SCARs, scorecards and suppliers show invented suppliers, inspections and scores. No server side exists | Inventory and purchasing |
| I-012 (D-024) | P1 | REQUIRES BUSINESS DECISION | Inventory | Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory menu opened the second | Inventory and purchasing |
| I-016 | P1 | REQUIRES BUSINESS DECISION | Stock corrections | There is no way to correct a stock quantity: no count, adjustment or scrap on the real stock list | Inventory and purchasing |
| I-018 | P1 | OPEN | Web orders | An accepted web order saves its subtotal and no tax or total (seen while adding the credit hold) | Inventory and purchasing |
| M-011 | P1 | REQUIRES BUSINESS DECISION | Production quality (5 screens), Bills of material | Sample data presented as real; the BOM screen was hard-wired to samples | Manufacturing and processing |
| M-016 | P1 | REQUIRES BUSINESS DECISION | Work orders | Completing a work order changes no stock: the source item is not used up and the pieces made are not added | Manufacturing and processing |
| S-010 | P1 | REQUIRES BUSINESS DECISION | Delivery promise | Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout | Sales and customer operations |
| X-007 | P1 | REQUIRES BUSINESS DECISION | Order entry, web checkout, online settings | Order cut-off times, delivery promise dates, the "ship from another branch" comparison (with invented branch stock), the fulfilment override and split shipments run from sample rules built into the browser. No server rou | Enterprise experience |
| X-009 | P1 | REQUIRES BUSINESS DECISION | Scale of sample screens | 58 of 143 screens are samples. All now say so | Enterprise experience |
| B-007 | P2 | OPEN | Work centers, assets, maintenance orders, executive decisions | Any column can be set by the caller, including status, ids and timestamps. | Phase 2: architecture and code quality |
| B-008 | P2 | OPEN | Jobs, order hub, counter sessions, demand shaping | Seven create routes save from nothing. | Phase 2: architecture and code quality |
| B-010 | P2 | OPEN | Users, shop-floor operations, job planning, material tracking, cockpit, partner carrier | A failure between two changes leaves the first one saved. Example: an operation is marked started and its time log is not created. | Phase 2: architecture and code quality |
| B-011 | P2 | REQUIRES BUSINESS DECISION | Shop-floor operations | Any call is accepted. | Manufacturing phase |
| B-012 | P2 | OPEN | Lists across the server | Some are small set-up lists where no limit is harmless; others grow with products, operators and partners. | Performance phase |
| B-014 | P2 | OPEN | Code base | Business rules sit inside route handlers and large screens, where a unit test cannot reach them. | Phase 2: architecture and code quality |
| B-015 | P2 | OPEN | Frontend | Most icon buttons have no name (some have tooltips, which were not counted). | Phase 9: user experience |
| B-017 | P2 | REQUIRES BUSINESS DECISION | Database | A third of the schema is design that was never built (see X-009). | Data integrity phase (after X-009) |
| B-018 | P2 | BLOCKED | Partner API | It is marked for retry and never sent again. | Integration phase |
| B-021 | P2 | OPEN | Documents | On a disk host the file is also reachable by its address alone. | Security and multi-location phase |
| B-025 | P2 | REQUIRES BUSINESS DECISION | Counter quick sale | Shelf items sold at the counter never reduce stock. Any report that filters on order status counts a voided sale as a completed one; only the counter's own daily figures read the note. | Inventory and purchasing |
| D-020 | P2 | OPEN |  | 155 of 352 distinct API calls written in the screens have no server route (`qa/api-contract.md`). Largest groups: work centers, jobs, QA/QC, pricing, BOMs, provenance. | By subject (see the finding) |
| D-024 | P2 | OPEN |  | Stock is held in two unconnected sets of tables: the coil and inventory records used by orders and shipping, and a separate unit-tracking set under `/api/v1/inventory`. Five screen services still return made-up data (`br | By subject (see the finding) |
| D-033 | P2 | REQUIRES BUSINESS DECISION |  | The app does not charge cards. A card sale is recorded with the approval code from a separate card terminal. | By subject (see the finding) |
| D-034 | P2 | REQUIRES BUSINESS DECISION |  | Receipts, quotes and invoices are not emailed or texted. The buttons say so. | By subject (see the finding) |
| D-036 | P2 | OPEN |  | Sales Dashboard fixed in Phase 2 Workstream 2 (S-012): it now counts from the database. The Order Hub RFQ pages remain a separate console, not in the menu. | By subject (see the finding) |
| E-016 | P2 | REQUIRES BUSINESS DECISION | Platform | No lint configuration | Phase 2: architecture and code quality |
| E-017 | P2 | REQUIRES BUSINESS DECISION | Platform | No error tracking or alerting service; logs only | Phase 2: architecture and code quality |
| E-019 | P2 | OPEN | Database | Some tables carry a tenant id; whether every query honours it has not been audited | Phase 2: architecture and code quality |
| E-021 | P2 | OPEN | API | List routes answer in two shapes: a bare list, or `{ data, meta }` | Phase 2: architecture and code quality |
| F-008 | P2 | REQUIRES BUSINESS DECISION | Web store checkout | The store shows the buyer an estimate of tax by the ship-to state. On acceptance the order is taxed by the selling branch (rule 27). The two can differ | Shipping and financial operations |
| F-009 | P2 | REQUIRES BUSINESS DECISION | Invoices | Any staff login can read every invoice and its payments (reads are open to all staff by design; only changes are restricted) | Shipping and financial operations |
| F-011 | P2 | OPEN | Shipping documents | Whether a bill of lading or packing list can be printed for a shipment was not examined. Print code exists in the server (`printQueue`, `printAutomationService`); the new Shipment screen has no print button | Shipping and financial operations |
| F-012 | P2 | OPEN | Frontend build | A stray word left in `AppRouter.jsx` by a patch in this workstream passed the production build and broke every screen at run time. Caught by the browser check before commit | Shipping and financial operations |
| I-017 | P2 | DEFERRED WITH JUSTIFICATION | Receiving | A heat must be on file before stock is received against it, and heats are added one at a time | Inventory and purchasing |
| M-017 | P2 | REQUIRES BUSINESS DECISION | Jobs | The job rules allow some backward moves (for example in process back to ordered); `/start` and `/complete` keep their own checks; the print hook runs on some status routes and not others | Manufacturing and processing |
| M-018 | P2 | IN PROGRESS | Help manual | The pages for time tracking and the order board described features that do not exist (clock in and out, timesheet approval, an order panel) | Manufacturing and processing |
| S-008 | P2 | DEFERRED WITH JUSTIFICATION | Order entry | Two entry screens list four Michigan branches in code | Sales and customer operations |
| S-009 | P2 | REQUIRES BUSINESS DECISION | Remnants | Remnant discount is fixed in code at 15% and 25% on two screens | Sales and customer operations |
| S-020 | P2 | REQUIRES BUSINESS DECISION | Customers | "Default Discount %" on the customer screen is applied nowhere | Sales and customer operations |
| S-021 | P2 | REQUIRES BUSINESS DECISION | Order Hub | A second RFQ console, not in the menu, beside RFQs & Quotes | Sales and customer operations |
| S-022 | P2 | OPEN | Counter | The POS session API is called by no screen and saves no tax | Sales and customer operations |
| S-024 | P2 | IN PROGRESS | Help manual | Pricing, Sales Dashboard, Sales Rep Mobile and customer pages described tabs, contracts, signatures, visit logs and offline use that do not exist | Sales and customer operations |
| S-026 | P2 | OPEN | Sales screens | Screen code calls 18 sales routes that do not exist: 13 under `/api/pricing` in `api/pricing.js`, 3 will-call, 2 split-shipment | Sales and customer operations |
| S-027 | P2 | REQUIRES BUSINESS DECISION | Quotes | Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products | Sales and customer operations |
| X-008 | P2 | REQUIRES BUSINESS DECISION | Counter (`/pos`), will-call screens | The will-call pickup queue and completion screens use sample orders. The screen is not on the menu | Enterprise experience |
| X-010 | P2 | OPEN | Help manual | Only the pages rewritten in Workstreams 2 to 5 were checked against their screens. The pages for sample modules (safety, maintenance, training and others) still describe them as working | Enterprise experience |
| B-006 | P3 | OPEN | Counter (older session flow) | Three routes cannot work. No screen reaches them. | Phase 2: architecture and code quality |
| B-013 | P3 | OPEN | Code base | It is kept, read by new engineers and scanned by every tool. | Phase 2: architecture and code quality |
| B-020 | P3 | OPEN | Access control | One name matches nothing. | Phase 2: architecture and code quality |
| B-022 | P3 | OPEN | Demo and QA data | The demo seed writes rows directly and skips the rules. | Data integrity phase |
| B-024 | P3 | OPEN | Code base | The 39 effect warnings are the ones that can be defects: an effect that reads a value it does not list can show stale data. They have not been read one by one. | Phase 2: architecture and code quality |
| D-023 | P3 | OPEN |  | The demo seed data contains 49 inconsistent orders (shipped quantities with no shipment, fully shipped orders still marked confirmed). | By subject (see the finding) |
| D-027 | P3 | OPEN |  | The request rate limit counts per server instance, so on the hosted site the real limit is higher than configured. | By subject (see the finding) |
| D-035 | P3 | REQUIRES BUSINESS DECISION |  | Sales tax is charged only for states that have a rate set. A sale at a branch in a state with no rate charges no tax and says so on the screen. A login with no home branch also charges no tax. A new screen, Admin > Sales | By subject (see the finding) |
| E-012 | P3 | OPEN | API | 39 routes send the raw error text on a server error | Phase 2: architecture and code quality |
| E-018 | P3 | DEFERRED WITH JUSTIFICATION | Code | Five server route files of 870 to 1,390 lines; five screen files over 1,000 lines | Phase 2: architecture and code quality |
| U-002 | P3 | REQUIRES BUSINESS DECISION | Order Hub RFQ pages | A second RFQ console beside RFQs & Quotes | Phase 9: user experience |
| U-004 | P3 | OPEN | Several secondary screens | Call server routes that do not exist (D-020) | Phase 9: user experience |
| U-008 | P3 | OPEN | Sales Rep Mobile, delivery preview | A date nobody computed | Phase 9: user experience |
| U-011 | P3 | OPEN | Order entry, Retail POS | Branch list fixed at four Michigan branches | Phase 9: user experience |
| U-012 | P3 | REQUIRES BUSINESS DECISION | Customers > Preferences | "Default Discount %" is offered and applied nowhere | Phase 9: user experience |
| U-019 | P3 | REQUIRES BUSINESS DECISION | Supplier quality, six screens | Invented data presented as real | Phase 9: user experience |
| U-020 | P3 | REQUIRES BUSINESS DECISION | Menu | "Inventory" and "Units" were two different stock lists | Phase 9: user experience |
| U-022 | P3 | OPEN | Receiving | A heat must be added before its stock, one at a time | Phase 9: user experience |
| U-028 | P3 | OPEN | Old operator screen | Recorded output into nothing | Phase 9: user experience |
| U-029 | P3 | REQUIRES BUSINESS DECISION | Production quality, BOMs | Invented data presented as real | Phase 9: user experience |
| U-035 | P3 | REQUIRES BUSINESS DECISION | Freight and logistics | Invented routes, rates and tracking presented as real | Phase 9: user experience |
| U-036 | P3 | OPEN | Shipment | No button to print a bill of lading or packing list | Phase 9: user experience |
| U-037 | P3 | REQUIRES BUSINESS DECISION | Safety, maintenance, training, contractors, customer quality, executive, provenance | Invented data presented as real | Phase 9: user experience |
| U-040 | P3 | OPEN | Menu | Lists 58 sample screens beside the real ones | Phase 9: user experience |
| U-041 | P3 | OPEN | Checkout, order entry | Promise dates and branch suggestions from invented rules | Phase 9: user experience |

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

### B-003 · P1 · REQUIRES BUSINESS DECISION

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
- **First recorded in:** Phase 1 discovery

### B-004 · P1 · REQUIRES BUSINESS DECISION

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

### B-006 · P3 · OPEN

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
- **First recorded in:** Phase 1 discovery

### B-007 · P2 · OPEN

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
- **First recorded in:** Phase 1 discovery

### B-008 · P2 · OPEN

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
- **First recorded in:** Phase 1 discovery

### B-009 · P1 · REQUIRES BUSINESS DECISION

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
- **Assigned phase:** Phase 2: architecture and code quality (after the decision)
- **First recorded in:** Phase 1 discovery

### B-010 · P2 · OPEN

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

### B-012 · P2 · OPEN

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
- **Required tests:** The existing "bounded lists" sweep check extended to these routes.
- **Assigned phase:** Performance phase
- **First recorded in:** Phase 1 discovery

### B-013 · P3 · OPEN

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
- **Required tests:** Build, lint and the 125-screen check after removal.
- **Assigned phase:** Phase 2: architecture and code quality
- **First recorded in:** Phase 1 discovery

### B-014 · P2 · OPEN

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
- **Required tests:** Unit tests for each rule moved; the browser suites before and after.
- **Assigned phase:** Phase 2: architecture and code quality
- **First recorded in:** Phase 1 discovery

### B-015 · P2 · OPEN

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
- **Assigned phase:** Phase 9: user experience
- **First recorded in:** Phase 1 discovery

### B-016 · P1 · OPEN

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
- **Required tests:** The measured number rises each phase; it is recorded in progress.json.
- **Assigned phase:** Testing phase; each phase for its own area
- **First recorded in:** Phase 1 discovery

### B-017 · P2 · REQUIRES BUSINESS DECISION

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
- **Required tests:** The inventory shows no table without code.
- **Assigned phase:** Data integrity phase (after X-009)
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

### B-020 · P3 · OPEN

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
- **First recorded in:** Phase 1 discovery

### B-021 · P2 · OPEN

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
- **Required tests:** Sweep: /uploads/… answers 401 or 404 with no token.
- **Assigned phase:** Security and multi-location phase
- **Status note:** NOT VERIFIED by a probe
- **First recorded in:** Phase 1 discovery

### B-022 · P3 · OPEN

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

### B-024 · P3 · OPEN

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
- **Required tests:** Root lint with a ceiling that can only go down.
- **Assigned phase:** Phase 2: architecture and code quality
- **First recorded in:** Phase 1 discovery

### B-025 · P2 · REQUIRES BUSINESS DECISION

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
- **First recorded in:** Phase 1 discovery

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

### D-020 · P2 · OPEN

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** 155 of 352 distinct API calls written in the screens have no server route (`qa/api-contract.md`). Largest groups: work centers, jobs, QA/QC, pricing, BOMs, provenance.
- **Recommended correction:** Many are helper functions no page uses. The screen check shows which pages actually hit a missing route when they open. Buttons inside pages were not clicked.
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

### D-023 · P3 · OPEN

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** The demo seed data contains 49 inconsistent orders (shipped quantities with no shipment, fully shipped orders still marked confirmed).
- **Recommended correction:** Seed script, not app behaviour. Matters only because the demo site shows them.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: engineering work
- **First recorded in:** qa/defect-register.md

### D-024 · P2 · OPEN

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** Stock is held in two unconnected sets of tables: the coil and inventory records used by orders and shipping, and a separate unit-tracking set under `/api/v1/inventory`. Five screen services still return made-up data (`branchComparisonApi`, `cutoffRulesApi`, `intakeCustomersApi`, `overrideApi`, `splitShipmentApi`).
- **Recommended correction:** Needs consolidation.
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

### D-027 · P3 · OPEN

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** The request rate limit counts per server instance, so on the hosted site the real limit is higher than configured.
- **Recommended correction:** Already noted in the code.
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

### D-034 · P2 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-12
- **Category:** Missing function
- **Actual:** Receipts, quotes and invoices are not emailed or texted. The buttons say so.
- **Affected dependencies:** The email and text provider to connect.
- **Recommended correction:** The email and text provider to connect.
- **Assigned phase:** By subject (see the finding)
- **Status note:** Open: needs something from the business
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

### D-036 · P2 · OPEN

- **Discovered:** 2026-11-12
- **Category:** Defect
- **Actual:** Sales Dashboard fixed in Phase 2 Workstream 2 (S-012): it now counts from the database. The Order Hub RFQ pages remain a separate console, not in the menu.
- **Recommended correction:** Order Hub needs a decision (S-021).
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

### E-004 · P1 · IN PROGRESS

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
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Fixed in part
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
- **Status note:** Fixed in part
- **First recorded in:** qa/engineering-quality-findings.md

### E-012 · P3 · OPEN

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
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### E-014 · P1 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Platform
- **Category:** Security
- **Source file or endpoint:** Phase 1 D-027
- **Evidence:** Phase 1 D-027
- **Expected:** Shared counter
- **Actual:** The request rate limit counts per server instance
- **Operational impact:** On the hosted site the real limit is several times the configured one
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

### E-016 · P2 · REQUIRES BUSINESS DECISION

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
- **Status note:** Open: adding a linter is a new development dependency, so it needs approval
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

### E-018 · P3 · DEFERRED WITH JUSTIFICATION

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
- **Required tests:** Owner agrees large files are split only when they are next changed for another reason
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open. Not refactored for style alone
- **First recorded in:** qa/engineering-quality-findings.md

### E-019 · P2 · OPEN

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
- **Required tests:** Sweep section proving a login from one tenant cannot read another's rows on every route that carries a tenant id
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: audit in Workstream 6
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

### E-021 · P2 · OPEN

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
- **Required tests:** Every list route in the module answers `{ data, meta }` and its screens are updated; contract scan shows no mismatch
- **Assigned phase:** Phase 2: architecture and code quality
- **Status note:** Open: changing a reply shape affects screens, so it is done per workstream. Job list now sends the total in a header
- **First recorded in:** qa/engineering-quality-findings.md

### E-023 · P1 · IN PROGRESS

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

### F-011 · P2 · OPEN

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
- **Assigned phase:** Shipping and financial operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### F-012 · P2 · OPEN

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
- **Assigned phase:** Shipping and financial operations
- **Status note:** Open (see E-016)
- **First recorded in:** qa/engineering-quality-findings.md

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

### I-011 · P1 · REQUIRES BUSINESS DECISION

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
- **Required tests:** The six screens read real data and the notice is removed
- **Assigned phase:** Inventory and purchasing
- **Status note:** Mitigated
- **First recorded in:** qa/engineering-quality-findings.md

### I-012 (D-024) · P1 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Inventory
- **Category:** Architecture
- **Source file or endpoint:** Route and schema read
- **Evidence:** Route and schema read
- **Expected:** One stock list
- **Actual:** Two stock lists: the one orders, receiving, shipping and invoices update, and a second in RFID unit tables that none of them update. The Inventory menu opened the second
- **Operational impact:** Stock received or shipped did not show under "Inventory"
- **Assigned phase:** Inventory and purchasing
- **Status note:** Fixed pending the owner's answer
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

### I-017 · P2 · DEFERRED WITH JUSTIFICATION

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
- **Required tests:** A heats upload template; sweep check
- **Assigned phase:** Inventory and purchasing
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### I-018 · P1 · OPEN

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
- **Status note:** Open: Workstream 5
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

### M-011 · P1 · REQUIRES BUSINESS DECISION

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
- **Required tests:** The screens read real data and the notice is removed
- **Assigned phase:** Manufacturing and processing
- **Status note:** Mitigated
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

### S-008 · P2 · DEFERRED WITH JUSTIFICATION

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

### S-021 · P2 · REQUIRES BUSINESS DECISION

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
- **Assigned phase:** Sales and customer operations
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### S-022 · P2 · OPEN

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

### S-026 · P2 · OPEN

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

### U-002 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Order Hub RFQ pages
- **Category:** User experience
- **Source file or endpoint:** Order Hub RFQ pages
- **Actual:** A second RFQ console beside RFQs & Quotes
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open: decision S-021
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

### U-004 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Several secondary screens
- **Category:** User experience
- **Source file or endpoint:** Several secondary screens
- **Actual:** Call server routes that do not exist (D-020)
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

### U-008 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Sales Rep Mobile, delivery preview
- **Category:** User experience
- **Source file or endpoint:** Sales Rep Mobile, delivery preview
- **Actual:** A date nobody computed
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

### U-011 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Order entry, Retail POS
- **Category:** User experience
- **Source file or endpoint:** Order entry, Retail POS
- **Actual:** Branch list fixed at four Michigan branches
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

### U-019 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Supplier quality, six screens
- **Category:** User experience
- **Source file or endpoint:** Supplier quality, six screens
- **Actual:** Invented data presented as real
- **Assigned phase:** Phase 9: user experience
- **Status note:** Labelled as samples (I-011); build is a decision
- **First recorded in:** qa/ux-improvement-register.md

### U-020 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Menu
- **Category:** User experience
- **Source file or endpoint:** Menu
- **Actual:** "Inventory" and "Units" were two different stock lists
- **Assigned phase:** Phase 9: user experience
- **Status note:** One entry, Inventory, on the real list (I-012, pending the owner's answer)
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

### U-022 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Receiving
- **Category:** User experience
- **Source file or endpoint:** Receiving
- **Actual:** A heat must be added before its stock, one at a time
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

### U-028 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Old operator screen
- **Category:** User experience
- **Source file or endpoint:** Old operator screen
- **Actual:** Recorded output into nothing
- **Assigned phase:** Phase 9: user experience
- **Status note:** Removed (M-010): opens the real shop floor
- **First recorded in:** qa/ux-improvement-register.md

### U-029 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Production quality, BOMs
- **Category:** User experience
- **Source file or endpoint:** Production quality, BOMs
- **Actual:** Invented data presented as real
- **Assigned phase:** Phase 9: user experience
- **Status note:** Labelled as samples (M-011); build is a decision
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

### U-035 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Freight and logistics
- **Category:** User experience
- **Source file or endpoint:** Freight and logistics
- **Actual:** Invented routes, rates and tracking presented as real
- **Assigned phase:** Phase 9: user experience
- **Status note:** Labelled as samples (F-007); build is a decision
- **First recorded in:** qa/ux-improvement-register.md

### U-036 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Shipment
- **Category:** User experience
- **Source file or endpoint:** Shipment
- **Actual:** No button to print a bill of lading or packing list
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (F-011)
- **First recorded in:** qa/ux-improvement-register.md

### U-037 · P3 · REQUIRES BUSINESS DECISION

- **Discovered:** 2026-11-13
- **Module:** Safety, maintenance, training, contractors, customer quality, executive, provenance
- **Category:** User experience
- **Source file or endpoint:** Safety, maintenance, training, contractors, customer quality, executive, provenance
- **Actual:** Invented data presented as real
- **Assigned phase:** Phase 9: user experience
- **Status note:** Labelled as samples (X-001, X-002); build or remove is a decision
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

### U-040 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Menu
- **Category:** User experience
- **Source file or endpoint:** Menu
- **Actual:** Lists 58 sample screens beside the real ones
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (X-009)
- **First recorded in:** qa/ux-improvement-register.md

### U-041 · P3 · OPEN

- **Discovered:** 2026-11-13
- **Module:** Checkout, order entry
- **Category:** User experience
- **Source file or endpoint:** Checkout, order entry
- **Actual:** Promise dates and branch suggestions from invented rules
- **Assigned phase:** Phase 9: user experience
- **Status note:** Open (X-007)
- **First recorded in:** qa/ux-improvement-register.md

### X-001 · P0 · REQUIRES BUSINESS DECISION

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
- **Required tests:** The audit shows the screen as REAL, or the route is gone
- **Assigned phase:** Enterprise experience
- **Status note:** Mitigated
- **First recorded in:** qa/engineering-quality-findings.md

### X-002 · P0 · REQUIRES BUSINESS DECISION

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
- **Required tests:** The audit shows the screen as REAL, or the route is gone
- **Assigned phase:** Enterprise experience
- **Status note:** Mitigated
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

### X-008 · P2 · REQUIRES BUSINESS DECISION

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
- **Required tests:** Built on real orders, or removed
- **Assigned phase:** Enterprise experience
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### X-009 · P1 · REQUIRES BUSINESS DECISION

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
- **Required tests:** The audit shows the screen as REAL, or the route is gone
- **Assigned phase:** Enterprise experience
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

### X-010 · P2 · OPEN

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
- **Required tests:** Every manual page read against its screen
- **Assigned phase:** Enterprise experience
- **Status note:** Open
- **First recorded in:** qa/engineering-quality-findings.md

