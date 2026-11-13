# System inventory

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit 181a874. Do not edit by hand: change the source and rerun.

Every figure here is counted from the code or measured in a test run. The module map itself (which files make a module, and its classification) is written by hand in `qa/tools/excellence-modules.mjs`.

## Totals

| Item | Count |
|---|---:|
| Modules | 47 |
| Server route files | 72 |
| API routes (each address counted; two route files are mounted twice) | 611 |
| API routes that change data | 319 |
| Database tables in the schema | 158 |
| Enumerations | 96 |
| Migrations | 26 |
| Screens (routes in the browser) | 143 |
| Frontend source files | 388 (117,893 lines) |
| Server route code | 25,442 lines |
| Background jobs, queues, schedules, event bus | 0 |
| Email or text providers | 0 |
| Outside services called | 4 (three AI providers, one voice provider) plus partner webhooks |
| Feature flags | 0 |

## Modules by classification

| Classification | Modules |
|---|---:|
| IMPLEMENTED AND VERIFIED | 22 |
| IMPLEMENTED BUT NOT VERIFIED | 12 |
| PLACEHOLDER OR MOCK | 5 |
| PARTIALLY IMPLEMENTED | 4 |
| DISCONNECTED | 3 |
| NOT APPLICABLE | 1 |

IMPLEMENTED AND VERIFIED means the module's critical behaviour was run successfully by an automated test in this session and the result was checked. It does not mean the module is complete: see the findings listed against it.

## Enterprise administration

### Sign-in and sessions

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep: forged, expired and wrong-key tokens refused; disabled users refused
- **Purpose:** Staff and customer sign-in, the signed token, first-user registration
- **Screens:** 1 (1 static): /login
- **Server:** `src/backend/src/routes/auth.js`; served at /api/auth
- **Routes:** 4, of which 3 change data. Returned a success in a test this session: 2 of 4; of the changing routes, 1 of 3
- **Tables:** User
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Users
- **Feeds:** Every module
- **Findings:** none open
- **Production concern:** Tokens last 8 hours and cannot be revoked early; the browser keeps the token in local storage

### Users, roles and branches

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Sweep proves who may not change users. No test creates, edits and removes a user and checks the result. Branch and division assignments are saved and read by nothing
- **Purpose:** Create and edit users, assign role, home branch, divisions
- **Screens:** 1 (1 real): /admin/users
- **Server:** `src/backend/src/routes/users.js`; served at /api/users
- **Routes:** 13, of which 6 change data. Returned a success in a test this session: 6 of 13; of the changing routes, 2 of 6
- **Tables:** User, AuditLog, UserLocation, UserDivision, UserRoleAssignment, Role, Location, Division
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sign-in
- **Feeds:** Access control
- **Findings:** none open
- **Production concern:** User changes are several saves with no transaction

### Access control

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep sections on access (4), probe sections 1 and 2, 14 unit tests
- **Purpose:** One gate for every API route: sign-in, customer limits, department write rules, leadership pages
- **Screens:** none
- **Server:** `src/backend/src/middleware/apiGate.js`, `src/backend/src/lib/roleAccess.js`, `src/backend/src/lib/customerScope.js`
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sign-in
- **Feeds:** Every module
- **Findings:** F-009
- **Production concern:** No branch, division or region boundary. 16 areas have no department rule

### Staff and operators

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Screen opens on real data. 0 of 9 write routes succeed in any test
- **Purpose:** Operators, skills, shifts
- **Screens:** 1 (1 real): /admin/staff
- **Server:** `src/backend/src/routes/staff.js`; served at /api/staff
- **Routes:** 15, of which 9 change data. Returned a success in a test this session: 4 of 15; of the changing routes, 0 of 9
- **Tables:** Operator, Location, WorkCenter, OperatorSkill, WorkCenterType, Shift
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Users, work centers
- **Feeds:** Dispatch, time tracking
- **Findings:** B-012, B-014
- **Production concern:** Any staff login can change operators and shifts

### Settings, tax rates and online settings

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Tax rates verified (sweep, browser). Online cut-off settings are lost on reload (X-007)
- **Purpose:** Sales tax by state, store rules, catalogue visibility, demo seed switch
- **Screens:** 8 (7 real, 1 mixed): /admin/users, /admin/partners, /admin/tax-rates, /admin/audit-log, /admin/processing-recipes, /admin/staff, /admin/catalog, /admin/online-settings
- **Server:** `src/backend/src/routes/taxRates.js`, `src/backend/src/routes/onlineSettings.js`, `src/backend/src/routes/admin.js`; served at /api/tax-rates, /api/admin/online-settings, /api/admin
- **Routes:** 11, of which 6 change data. Returned a success in a test this session: 5 of 11; of the changing routes, 0 of 6
- **Tables:** SalesTaxRate, Location
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Access control
- **Feeds:** Order tax, web store
- **Findings:** X-007, D-035
- **Production concern:** Cut-off and promise settings are not stored

## Customer and sales operations

### Customers

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Browser suite (sales) and sweep price and credit sections
- **Purpose:** Customer accounts, addresses, terms, credit limit, pricing tier, preferences
- **Screens:** 2 (2 real): /customers, /customers/preferences
- **Server:** `src/backend/src/routes/customers.js`; served at /api/customers
- **Routes:** 8, of which 4 change data. Returned a success in a test this session: 5 of 8; of the changing routes, 2 of 4
- **Tables:** Organization, AuditLog, CustomerPreference, CustomerPricingTier
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Access control
- **Feeds:** Quotes, orders, pricing, credit, invoices
- **Findings:** S-009

### RFQs and quotes

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation quote scenarios; unit tests for quote rules; browser suite (sales)
- **Purpose:** Requests for quote, quotes, accept and convert to an order
- **Screens:** 3 (3 real): /commercial/demand-shaping, /sales/rfq-inbox, /sales/dashboard
- **Server:** `src/backend/src/routes/rfqs.js`, `src/backend/src/routes/quotes.js`, `src/backend/src/routes/salesRoutes.js`, `src/backend/src/routes/salesDashboard.js`; served at /api/sales-dashboard, /api/rfqs, /api/quotes, /api/sales
- **Routes:** 18, of which 9 change data. Returned a success in a test this session: 11 of 18; of the changing routes, 4 of 9
- **Tables:** RFQ, Quote, User, Organization, Order
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Customers, products, pricing
- **Feeds:** Sales orders
- **Findings:** S-021, B-012
- **Production concern:** No quote revisions or approvals

### Order entry

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Order entry screen follows the order rules" (43 checks); browser suite (sales)
- **Purpose:** The order entry screen: lines, price, processing, tax, credit check
- **Screens:** 9 (8 real, 1 mixed): /intake, /place-order, /orders/invoices, /orders/returns, /orders, /orders/intake, /orders/online-inbox, /orders/credit-holds, /orders/:id
- **Server:** `src/backend/src/routes/intakeOrders.js`, `src/backend/src/routes/intakePricing.js`, `src/backend/src/routes/intakeProcessing.js`; served at /api/orders/intake, /api/pricing, /api/processing
- **Routes:** 16, of which 7 change data. Returned a success in a test this session: 14 of 16; of the changing routes, 7 of 7
- **Tables:** Organization, Order, Quote, Job, OrderLine, Product, PriceLevel, CustomerPricingTier, AuditLog, ProcessingOperation, ProcessingTemplate
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Customers, products, pricing, tax, credit
- **Feeds:** Sales orders, jobs
- **Findings:** X-007
- **Production concern:** Promise date and branch suggestion on this screen are mock rules

### Sales orders

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation: every job; race tests on reservation; unit tests on the move table
- **Purpose:** The order record: confirm, hold, cancel, reserve stock
- **Screens:** 7 (6 real, 1 mixed): /orders/invoices, /orders/returns, /orders, /orders/intake, /orders/online-inbox, /orders/credit-holds, /orders/:id
- **Server:** `src/backend/src/routes/orders.js`; served at /api/orders
- **Routes:** 7, of which 4 change data. Returned a success in a test this session: 7 of 7; of the changing routes, 4 of 4
- **Tables:** Order, OrderLineAllocation, Inventory, Coil, AuditLog, OrderLine
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Order entry, quotes, web store, counter
- **Feeds:** Jobs, shipments, invoices
- **Findings:** F-009

### Pricing and customer tiers

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "One customer, one price in every sales channel" (47 checks); unit tests
- **Purpose:** One price rule for every channel, price levels, overrides with a record
- **Screens:** 1 (1 real): /pricing
- **Server:** `src/backend/src/routes/overrides.js`; served at /api/overrides
- **Routes:** 6, of which 2 change data. Returned a success in a test this session: 6 of 6; of the changing routes, 2 of 2
- **Tables:** AuditLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, customers
- **Feeds:** Every sales channel
- **Findings:** S-009
- **Production concern:** Contract pricing does not exist; override approval is a record, not a workflow

### Credit control

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Credit hold" (22 checks); unit tests
- **Purpose:** Warn at the limit, hold the order, a manager releases
- **Screens:** none
- **Server:** `src/backend/src/lib/creditControl.js`
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Customers, invoices
- **Feeds:** Sales orders
- **Findings:** none open

### Counter quick sale

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation counter scenarios; sweep money records
- **Purpose:** Walk-in sale: look up, price, take payment, invoice
- **Screens:** 1 (1 real): /pos/retail
- **Server:** `src/backend/src/routes/quickSale.js`; served at /api/pos/quick-sale
- **Routes:** 10, of which 6 change data. Returned a success in a test this session: 6 of 10; of the changing routes, 3 of 6
- **Tables:** Product, Order, Invoice, MaterialMovement, AuditLog, Payment, InvoiceLine
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, pricing, tax
- **Feeds:** Invoices, payments
- **Findings:** D-033, D-034
- **Production concern:** Card approval is typed in from a separate terminal; receipts are not sent

### Counter session flow (older)

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Off the menu. Will-call screens use sample orders (X-008). Three pricing routes cannot work (B-006). 5 of 36 write routes succeed in a test
- **Purpose:** A multi-screen counter flow with sessions, will call and its own pricing calls
- **Screens:** 2 (1 mixed, 1 real): /pos, /pos/retail
- **Server:** `src/backend/src/routes/pos.js`; served at /api/pos
- **Routes:** 57, of which 36 change data. Returned a success in a test this session: 12 of 57; of the changing routes, 5 of 36
- **Tables:** Organization
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, customers
- **Feeds:** None found
- **Findings:** X-008, B-014
- **Production concern:** 1,391-line route file kept alive beside the quick sale

### Web store

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation web orders; sweep "Web checkout uses the system price"; browser suite (sales)
- **Purpose:** Catalogue, cart, checkout at the system price, my orders
- **Screens:** 8 (7 real, 1 mixed): /shop, /shop/search, /shop/remnants, /shop/products/:id, /shop/cart, /shop/checkout, /shop/orders, /shop/orders/:id
- **Server:** `src/backend/src/routes/ecom.js`, `src/backend/src/routes/onlineOrders.js`; served at /api/orders/online, /api/ecom, /api/admin/catalog
- **Routes:** 17, of which 10 change data. Returned a success in a test this session: 9 of 17; of the changing routes, 4 of 10
- **Tables:** OnlineOrder, Organization, Product, Order
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, pricing, tax, customers
- **Feeds:** Sales orders
- **Findings:** X-007, F-008
- **Production concern:** Checkout shows a promise date from mock rules

### Customer account pages

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Customers and divisions cannot see each other" (31 checks)
- **Purpose:** A customer login sees its own orders, documents and invoices
- **Screens:** 4 (1 static, 3 real): /account/dashboard, /account/orders, /account/shipments, /account/documents
- **Server:** `src/backend/src/routes/portal.js`; served at /api/ecom/my-orders, /api/enterprise
- **Routes:** 12, of which 1 change data. Returned a success in a test this session: 7 of 12; of the changing routes, 0 of 1
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sign-in, sales orders, documents
- **Feeds:** None
- **Findings:** none open
- **Production concern:** One of four account screens is a sample

### Promise dates, cut-offs, branch comparison, split shipments

- **Status:** PLACEHOLDER OR MOCK
- **Basis:** No server route. Rules are built into the browser (X-007)
- **Purpose:** Tells the customer when and from where an order can ship
- **Screens:** 1 (1 real): /promise
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** None
- **Feeds:** Order entry, web checkout
- **Findings:** X-007, S-010
- **Production concern:** A customer is shown a date and a branch from invented rules

### Order hub and intake pipeline

- **Status:** DISCONNECTED
- **Basis:** Works on its own tables and creates nothing in sales orders. Email parsing needs an AI key and was not run
- **Purpose:** A second RFQ, quote, order and job pipeline with AI email parsing
- **Screens:** 4 (4 real): /orderhub, /orderhub/rfq/new, /orderhub/rfq/:rfqId, /orderhub/orders/:orderId
- **Server:** `src/backend/src/routes/orderHubRoutes.js`, `src/backend/src/routes/aiOrderHubRoutes.js`, `src/backend/src/routes/ingestRoutes.js`, `src/backend/src/routes/pipelineRoutes.js`; served at /api/v1, /api/v1/ai, /api/v1/ingest, /api/v1/pipeline
- **Routes:** 31, of which 18 change data. Returned a success in a test this session: 7 of 31; of the changing routes, 0 of 18
- **Tables:** IntakeJob
- **Who may change it:** see permissions-matrix.md
- **Depends on:** None
- **Feeds:** None
- **Findings:** S-021, B-009
- **Production concern:** A second order pipeline that the rest of the system does not see

### Mobile rep

- **Status:** PLACEHOLDER OR MOCK
- **Basis:** Sample screen, labelled
- **Purpose:** Field sales screen
- **Screens:** 1 (1 static): /mobile-rep
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** X-009

## Product and material management

### Products, grades and heats

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Heats, products and grades" (47 checks); unit tests on field rules; browser suite (stock)
- **Purpose:** Catalogue with list prices, grades and chemistry, heats with mill certificates
- **Screens:** 2 (2 real): /heats, /heats/:id
- **Server:** `src/backend/src/routes/products.js`, `src/backend/src/routes/grades.js`, `src/backend/src/routes/heats.js`; served at /api/grades, /api/products, /api/heats
- **Routes:** 16, of which 6 change data. Returned a success in a test this session: 14 of 16; of the changing routes, 6 of 6
- **Tables:** Grade, Product, Heat, Organization
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Access control
- **Feeds:** Stock, pricing, order entry, receiving
- **Findings:** B-012
- **Production concern:** GET /api/products returns the whole catalogue

### Processing recipes and bills of material

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Screens open on real data. 0 of 11 write routes succeed in a test
- **Purpose:** Recipes, routing templates, BOM recipes for processing
- **Screens:** 4 (1 sample, labelled, 3 real): /boms, /bom//, /bom//new, /bom//:recipeId
- **Server:** `src/backend/src/routes/processingRecipes.js`, `src/backend/src/routes/bomV1.js`; served at /api/processing-recipes, /api/v1/bom
- **Routes:** 16, of which 11 change data. Returned a success in a test this session: 3 of 16; of the changing routes, 0 of 11
- **Tables:** ProcessingRecipe, RecipeRoutingTemplate, BomRecipe
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, work centers
- **Feeds:** Jobs, planning
- **Findings:** I-011
- **Production concern:** Any staff login can change a recipe

### Customer specifications

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** No test
- **Purpose:** Customer preferences carried onto order lines and jobs
- **Screens:** none
- **Server:** `src/backend/src/routes/specInheritance.js`; served at /api/specs
- **Routes:** 3, of which 0 change data. Returned a success in a test this session: 1 of 3; of the changing routes, 0 of 0
- **Tables:** OrderLine, Job, CustomerPreference
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Customers
- **Feeds:** Jobs
- **Findings:** none open

## Inventory and purchasing

### Stock items and stock levels

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation; sweep "Stock items" (29 checks); database balance rule; browser suite (stock)
- **Purpose:** Coils, plates and bars by heat and location; holds; transfers; adjustments
- **Screens:** 4 (3 real, 1 static): /inventory, /units, /units/:id, /inventory/*
- **Server:** `src/backend/src/routes/coils.js`, `src/backend/src/routes/inventory.js`; served at /api/coils, /api/inventory
- **Routes:** 18, of which 8 change data. Returned a success in a test this session: 16 of 18; of the changing routes, 7 of 8
- **Tables:** Coil, MaterialMovement, QCHold, OrderLineAllocation, Heat, Grade, Organization, Location, Product, User, Inventory
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, heats, receiving
- **Feeds:** Reservation, shipping, returns
- **Findings:** I-016
- **Production concern:** No screen for adjustments or counts (I-016)

### Receiving

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Receiving" (32 checks); unit tests on receiving rules
- **Purpose:** A receipt or an upload makes real stock with heat and location
- **Screens:** 1 (1 real): /receiving
- **Server:** `src/backend/src/routes/inventory.js`; served at /api/inventory
- **Routes:** 10, of which 4 change data. Returned a success in a test this session: 10 of 10; of the changing routes, 4 of 4
- **Tables:** Inventory, Coil, Location, MaterialMovement
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, heats
- **Feeds:** Stock
- **Findings:** I-007
- **Production concern:** Receiving is not tied to a purchase order because there are none

### Second stock list (unit tracking)

- **Status:** DISCONNECTED
- **Basis:** Its own five tables. Orders and shipping never read it. 0 of 5 write routes succeed in a test
- **Purpose:** A separate unit, RFID, transfer and adjustment store
- **Screens:** none
- **Server:** `src/backend/src/routes/inventoryV1.js`; served at /api/v1/inventory
- **Routes:** 13, of which 5 change data. Returned a success in a test this session: 7 of 13; of the changing routes, 0 of 5
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** None
- **Feeds:** None
- **Findings:** B-009, D-024
- **Production concern:** Reloads five whole tables on every request

### Remnants

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Lists read in the sweep. Reserve and release never succeed in a test. No server code creates a remnant record: processing does not produce one
- **Purpose:** Remnant listing, pricing, reserve and release for the store
- **Screens:** none
- **Server:** `src/backend/src/routes/remnants.js`; served at /api/remnants
- **Routes:** 9, of which 4 change data. Returned a success in a test this session: 5 of 9; of the changing routes, 1 of 4
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Stock, work orders (not connected)
- **Feeds:** Web store
- **Findings:** S-009
- **Production concern:** Remnants exist only where data was loaded directly

## Manufacturing and processing

### Jobs, job board and schedule

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation: every job; sweep "Shop floor records" (51 checks); unit tests on moves and history; browser suite (shop)
- **Purpose:** Shop jobs: create, plan, move through the shop, every move recorded against a person
- **Screens:** 6 (6 real): /production, /production/shop-floor, /production/shipping, /order-board, /schedule, /jobs/:id
- **Server:** `src/backend/src/routes/jobs.js`; served at /api/jobs, /api/v1/jobs
- **Routes:** 32, of which 20 change data. Returned a success in a test this session: 19 of 32; of the changing routes, 9 of 20
- **Tables:** Job, OrderLine, DispatchJob, WorkCenterType, User
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sales orders
- **Feeds:** Shipping (unfinished jobs hold their lines)
- **Findings:** M-017
- **Production concern:** A job can be created with no order and no content

### Coil work orders

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep and unit tests on the work order move table; browser suite (shop)
- **Purpose:** Release, start, complete a processing work order against a coil
- **Screens:** 3 (3 real): /work-orders, /work-orders/new, /work-orders/:id
- **Server:** `src/backend/src/routes/workOrders.js`; served at /api/work-orders
- **Routes:** 7, of which 5 change data. Returned a success in a test this session: 7 of 7; of the changing routes, 5 of 5
- **Tables:** WorkOrder, AuditLog, Coil
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Stock
- **Feeds:** Stock (not yet: M-016)
- **Findings:** M-016
- **Production concern:** Completing a work order does not move stock

### Dispatch, work centers and shop-floor operations

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Screens open on real data (browser suite). 0 of 15 write routes succeed in a test: starting and completing an operation has never been exercised
- **Purpose:** Work-center types, queues, start, pause and complete an operation, time logs
- **Screens:** 3 (3 real): /time-tracking, /shopfloor, /shopfloor/:workCenterId
- **Server:** `src/backend/src/routes/dispatchRoutes.js`, `src/backend/src/routes/operationsRoutes.js`, `src/backend/src/routes/workCenters.js`; served at /api/work-centers, /api/v1/work-centers, /api/v1/dispatch, /api/v1/operations
- **Routes:** 34, of which 17 change data. Returned a success in a test this session: 18 of 34; of the changing routes, 6 of 17
- **Tables:** WorkCenter, Location, Job, WorkCenterType, DispatchDivision, DispatchOperation, Organization, Operator, DispatchJob, DispatchTimeLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs, staff
- **Feeds:** Jobs, time and labor
- **Findings:** B-011
- **Production concern:** No move rules on operations; half-saved time logs possible

### Planning and optimization

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** No test. Not examined
- **Purpose:** Suggests a schedule for work orders
- **Screens:** 3 (3 real): /optimization//, /planning//, /planning//workflow
- **Server:** `src/backend/src/routes/optimizationV1.js`; served at /api/v1/ai/work-order-optimize
- **Routes:** 4, of which 3 change data. Returned a success in a test this session: 1 of 4; of the changing routes, 0 of 3
- **Tables:** Job, WorkCenter
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs, work centers
- **Feeds:** Schedule
- **Findings:** none open
- **Production concern:** Not examined

### Quality inspections

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Workstream 4 fixed and checked the reply. 2 of 6 write routes succeed in a test
- **Purpose:** Inspection of a job: pass, fail, hold
- **Screens:** 2 (2 real): /qc, /qc/inspect/:id
- **Server:** `src/backend/src/routes/qcRoutes.js`; served at /api/qc
- **Routes:** 11, of which 6 change data. Returned a success in a test this session: 6 of 11; of the changing routes, 2 of 6
- **Tables:** Job, JobInspection, Operator
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs
- **Feeds:** Jobs (waiting on quality), shipping
- **Findings:** none open
- **Production concern:** Whether stock pending inspection may ship is not decided

### Material tracking, packages and drop tags

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Screens open on real data. 0 of 30 write routes succeed in a test
- **Purpose:** Custody log, packages, tags, staging, print queue
- **Screens:** 6 (6 real): /material-tracking, /material-tracking/packaging, /material-tracking/tags, /material-tracking/staging, /material-tracking/traceability, /material-tracking/traceability/:jobId
- **Server:** `src/backend/src/routes/materialTrackingRoutes.js`, `src/backend/src/routes/dropTagRoutes.js`, `src/backend/src/routes/printQueue.js`; served at /api/drop-tags, /api/material-tracking, /api/print-queue
- **Routes:** 48, of which 31 change data. Returned a success in a test this session: 11 of 48; of the changing routes, 0 of 31
- **Tables:** Job, Package, DropTag, TraceEvent, JobInspection, Shipment
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs
- **Feeds:** Shipping
- **Findings:** F-011
- **Production concern:** Tag and package life cycle has never been run end to end

### Maintenance and assets

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Two real screens, three sample screens. 0 of 8 write routes succeed in a test
- **Purpose:** Assets, maintenance orders
- **Screens:** 5 (3 sample, labelled, 2 real): /maintenance/dashboard, /maintenance/work-orders, /maintenance/assets, /maintenance/pm-schedules, /maintenance/parts
- **Server:** `src/backend/src/routes/maintenanceOrders.js`, `src/backend/src/routes/assets.js`; served at /api/maintenance-orders, /api/assets
- **Routes:** 17, of which 9 change data. Returned a success in a test this session: 10 of 17; of the changing routes, 4 of 9
- **Tables:** MaintenanceOrder, Asset, AssetType, WorkCenter
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Work centers
- **Feeds:** Scheduling (not connected)
- **Findings:** X-009, B-017
- **Production concern:** 11 maintenance tables have no code

## Shipping and logistics

### Shipping

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation: every shipping job incl. triple-dispatch race; sweep (37 checks); browser suite (shipping, 27 checks)
- **Purpose:** Create, dispatch and deliver a shipment; partial shipments; proof of delivery
- **Screens:** 2 (2 real): /shipping, /shipping/:id
- **Server:** `src/backend/src/routes/shipments.js`, `src/backend/src/routes/shippingV1.js`; served at /api/shipments, /api/v1/shipping, /api/v1/shipments
- **Routes:** 15, of which 7 change data. Returned a success in a test this session: 12 of 15; of the changing routes, 5 of 7
- **Tables:** Shipment, Order, Job, Invoice, AuditLog, Location, ShipmentItem, OrderLineAllocation, Coil, Inventory, MaterialMovement, OrderLine, WorkCenter
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sales orders, jobs, stock
- **Feeds:** Invoices, stock
- **Findings:** F-011
- **Production concern:** Shipping documents and printing not examined; no carrier rates or freight cost

### Returns

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation return jobs incl. triple-receive race
- **Purpose:** Return against shipped quantity, receive, restock or scrap, credit
- **Screens:** none
- **Server:** `src/backend/src/routes/returns.js`; served at /api/returns
- **Routes:** 6, of which 3 change data. Returned a success in a test this session: 3 of 6; of the changing routes, 2 of 3
- **Tables:** Order, MaterialMovement, Inventory, InvoiceLine, Coil, OrderLine
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Shipping, invoices
- **Feeds:** Stock, credits
- **Findings:** none open
- **Production concern:** Whether a return must be inspected before credit is not decided

### Documents

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Documents" (11 checks)
- **Purpose:** Mill certificates and other files linked to any record
- **Screens:** none
- **Server:** `src/backend/src/routes/documents.js`; served at /api/documents
- **Routes:** 7, of which 3 change data. Returned a success in a test this session: 5 of 7; of the changing routes, 2 of 3
- **Tables:** Document, DocumentLink, DocumentBlob, Heat
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Heats, shipments
- **Feeds:** Customer account pages, partner API
- **Findings:** B-021
- **Production concern:** Any staff login can delete a document

### Partner API

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Sweep proves a call with no partner token is refused. No test signs in as a partner and succeeds. 0 of 18 write routes succeed in a test
- **Purpose:** Token-protected API for customers, suppliers and carriers; webhooks
- **Screens:** none
- **Server:** `src/backend/src/routes/partner/partnerAuthRoutes.js`, `src/backend/src/routes/partner/customerRoutes.js`, `src/backend/src/routes/partner/supplierRoutes.js`, `src/backend/src/routes/partner/carrierRoutes.js`, `src/backend/src/routes/partner/webhookRoutes.js`, `src/backend/src/routes/partner/adminRoutes.js`; served at /api/v1/partner/auth, /api/v1/partner/customer, /api/v1/partner/supplier, /api/v1/partner/carrier, /api/v1/partner/webhooks, /api/v1/admin/partners
- **Routes:** 46, of which 19 change data. Returned a success in a test this session: 3 of 46; of the changing routes, 0 of 19
- **Tables:** RFQ, Quote, Order, Job, Document, Shipment, Invoice, Organization, Partner, PartnerWebhook, WebhookDelivery, PartnerApiKey, PartnerApiLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sales orders, shipments, invoices
- **Feeds:** Outside systems
- **Findings:** B-018
- **Production concern:** Failed webhook deliveries are never retried

### Freight and logistics planning

- **Status:** PLACEHOLDER OR MOCK
- **Basis:** Sample screens, labelled
- **Purpose:** Carrier comparison, routes, load planning
- **Screens:** 10 (10 sample, labelled): /freight/planner, /freight/comparison, /freight/comparison/:shipmentId, /freight/route/:shipmentId, /freight/tracking, /freight/exceptions, /freight/pod/:shipmentId, /logistics/route-optimization, /logistics/tracking, /logistics/dispatch
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** X-009

## Financial operations

### Invoices, payments, credits and refunds

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation incl. triple-payment race; sweep money records (37 checks); unit tests on billing rules
- **Purpose:** Invoice on dispatch, payments, credit memos, refunds, cancel, every action recorded against a person
- **Screens:** 1 (1 real): /orders/invoices
- **Server:** `src/backend/src/routes/invoices.js`, `src/backend/src/services/billing.js`; served at /api/invoices
- **Routes:** 7, of which 5 change data. Returned a success in a test this session: 7 of 7; of the changing routes, 5 of 5
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Shipping, counter, returns
- **Feeds:** Customer account pages, partner API
- **Findings:** F-009, B-019
- **Production concern:** No statements, no ageing, no overdue by date, no export to accounting

### Sales tax

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Unit tests; sweep
- **Purpose:** Selling-branch state rate on every order
- **Screens:** none
- **Server:** `src/backend/src/lib/orderTax.js`
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Tax rates
- **Feeds:** Orders, invoices
- **Findings:** F-008, D-035
- **Production concern:** A state with no rate charges no tax

## Platform infrastructure

### Request safeguards

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Platform safeguards" (33 checks), "Error replies do not expose internals"; unit tests
- **Purpose:** Request id and log line, safe error replies, paging guard, rate limits, health check, security headers
- **Screens:** none
- **Server:** `src/backend/src/middleware/requestLog.js`, `src/backend/src/middleware/safeErrors.js`, `src/backend/src/app.js`
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** None
- **Feeds:** Every module
- **Findings:** E-014, E-017
- **Production concern:** Rate limit counts per server instance; no alerting

### AI assistant and voice

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Needs provider keys that are not in the QA environment. Not run
- **Purpose:** Top-bar assistant, chat, quote assistant, text to speech
- **Screens:** none
- **Server:** `src/backend/src/routes/ai.js`, `src/backend/src/routes/aiAssistant.js`, `src/backend/src/routes/tts.js`; served at /api/ai, /api/ai/tts, /api/ai/assistant
- **Routes:** 14, of which 10 change data. Returned a success in a test this session: 4 of 14; of the changing routes, 0 of 10
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Read access to records
- **Feeds:** None
- **Findings:** none open
- **Production concern:** What the assistant may read and say has not been examined

### Help manual

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Pages rewritten in workstreams 2 to 5 were checked against their screens; the rest were not (M-018, X-010)
- **Purpose:** In-app manual
- **Screens:** 1 (1 static): /help/manual
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** M-018, X-010

### Background work, notifications, schedules

- **Status:** NOT APPLICABLE
- **Basis:** Does not exist in the code (B-019)
- **Purpose:** Anything that happens without a person pressing a button
- **Screens:** none
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** B-019, B-018, D-034
- **Production concern:** Nothing is sent, retried, escalated or changed by time

## Analytics and executive

### Operations cockpit and dashboards

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Figures come from the database and failed figures show an error (browser suite). The figures have not been reconciled to the records they summarise
- **Purpose:** Role dashboard, operations cockpit, sales and pricing dashboards, exception events
- **Screens:** 2 (2 real): /ops-cockpit, /role-dashboard//
- **Server:** `src/backend/src/routes/dashboard.js`, `src/backend/src/routes/opsCockpit.js`, `src/backend/src/routes/analyticsV1.js`, `src/backend/src/routes/eventsV1.js`, `src/backend/src/routes/demandShaping.js`, `src/backend/src/routes/compressionMetrics.js`; served at /api/demand-shaping, /api/metrics/compression, /api/dashboard, /api/v1/analytics, /api/v1/events, /api/ops-cockpit
- **Routes:** 29, of which 9 change data. Returned a success in a test this session: 20 of 29; of the changing routes, 0 of 9
- **Tables:** DemandSuggestionEvent, Inventory, Order, QCHold, Coil, Shipment, Job, RFQ, Quote, Organization, WorkCenter, ExceptionEvent, DispatchOperation, MaterialMovement, Grade, AuditLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Every operational module
- **Feeds:** None
- **Findings:** B-012

### Executive tools

- **Status:** PLACEHOLDER OR MOCK
- **Basis:** Five of six screens are samples, labelled. The server routes behind them store scenarios and decisions and have no success-path test
- **Purpose:** Cockpit, simulation, forecast, decision log, digital twin
- **Screens:** 6 (5 sample, labelled, 1 real): /executive/cockpit, /executive/simulation, /executive/forecast, /executive/decisions, /executive/digital-twin, /executive/compression-metrics
- **Server:** `src/backend/src/routes/executive.js`; served at /api/executive
- **Routes:** 21, of which 10 change data. Returned a success in a test this session: 8 of 21; of the changing routes, 0 of 10
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** X-009

## Safety, quality systems and other sample modules

### Stop work

- **Status:** DISCONNECTED
- **Basis:** Server routes exist and save. The screen is a sample and does not call them
- **Purpose:** Stop-work events with clearance steps and evidence
- **Screens:** 2 (2 sample, labelled): /safety/stop-work, /safety/stop-work/:id
- **Server:** `src/backend/src/routes/stopWork.js`; served at /api/safety/stop-work
- **Routes:** 13, of which 7 change data. Returned a success in a test this session: 4 of 13; of the changing routes, 0 of 7
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** X-001, B-009

### Safety, training, contractors, customer quality, supplier quality, production quality, provenance

- **Status:** PLACEHOLDER OR MOCK
- **Basis:** Sample screens, labelled. No server code. 41 safety tables exist with no code
- **Purpose:** Incidents, permits, inspections, training, visitors, claims, supplier scorecards, NCRs, chain of custody
- **Screens:** 39 (39 sample, labelled): /qaqc, /qaqc/test-entry, /sqm/receiving, /sqm/inspections, /sqm/snc, /sqm/scar, /sqm/scorecards, /sqm/suppliers, /customer-quality/claims, /customer-quality/rma, …
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** nothing
- **Feeds:** nothing
- **Findings:** X-001, X-002, X-009, B-017
- **Production concern:** Work entered on these screens is not saved

## Capabilities in the program brief that the code does not contain

These are not modules. Nothing was built for them in Phase 1; each is a decision for the owner or a later phase.

| Capability | Finding |
|---|---|
| Purchase requisitions, purchase orders, vendor management | I-007 |
| Cycle counts and a stock adjustment screen | I-016 |
| Replenishment | I-007 |
| Lead and opportunity tracking (CRM) |  |
| Quote revisions and quote approvals |  |
| Contract pricing | S-009 |
| Carrier assignment with rates, freight cost | F-007 |
| Statements, ageing, accounting export or integration |  |
| Material and processing costing, profitability reporting from actual cost |  |
| Email or text notifications of any kind | D-034, B-019 |
| Card payment processing | D-033 |
| Scheduled tasks, queues, background jobs | B-019 |
| Feature flags |  |
| Region as a level between branch and company | B-003 |
| Approval authority and approval workflows (the tables exist with no code) | B-017 |
| Backups and a tested restore, a staging environment, alerting | E-015, E-017 |

## Code nothing uses

Found by following imports from the application entry points. 45 frontend files (7,063 lines) and 5 server files. Finding B-013.

| File | Lines |
|---|---:|
| src/frontend/src/hooks/useRealTimePricing.js | 610 |
| src/frontend/src/apps/inventory/InventoryDetailPage.jsx | 587 |
| src/frontend/src/services/splitShipmentApi.js | 571 |
| src/frontend/src/apps/inventory/InventoryDashboardPage.jsx | 545 |
| src/frontend/src/hooks/useValidation.js | 529 |
| src/frontend/src/components/InventoryAiAssistantPanel.jsx | 418 |
| src/frontend/src/components/shipping/SplitShipmentDialog.jsx | 405 |
| src/frontend/src/pages/OrderBoardPage.jsx | 362 |
| src/frontend/src/components/logistics/DeliveryZoneMap.jsx | 302 |
| src/frontend/src/components/shipping/ShipmentTracker.jsx | 296 |
| src/frontend/src/components/logistics/InboundShipmentTracker.jsx | 282 |
| src/frontend/src/components/logistics/AddressAutocomplete.jsx | 276 |
| src/frontend/src/components/shipping/PartialFulfillmentBanner.jsx | 259 |
| src/frontend/src/constants/permissions.js | 242 |
| src/frontend/src/components/shipping/OrderStatusTimeline.jsx | 214 |
| src/frontend/src/components/logistics/LoadDiagram.jsx | 193 |
| src/frontend/src/components/logistics/RouteMap.jsx | 167 |
| src/frontend/src/hooks/useSplitShipment.js | 151 |
| src/frontend/src/services/aiService.js | 124 |
| src/frontend/src/apps/shopfloor/ShopFloorApp.jsx | 121 |
| src/frontend/src/components/help/HelpDrawer.jsx | 98 |
| src/frontend/src/components/production/ProductionLayout.jsx | 76 |
| src/frontend/src/api/authFetch.js | 66 |
| src/frontend/src/services/inventoryAiApi.js | 31 |
| src/frontend/src/components/logistics/index.js | 29 |
| src/frontend/src/config/supabaseClient.js | 28 |
| src/frontend/src/hooks/index.js | 14 |
| src/frontend/src/dashboard/index.js | 9 |
| src/frontend/src/pages/Executive/index.js | 7 |
| src/frontend/src/apps/orderhub/index.js | 6 |
| src/frontend/src/constants/index.js | 6 |
| src/frontend/src/apps/inventory/index.js | 4 |
| src/frontend/src/apps/planning/index.js | 4 |
| src/frontend/src/pages/Admin/index.js | 4 |
| src/frontend/src/pages/WorkOrders/index.js | 4 |
| src/frontend/src/pages/Heats/index.js | 3 |
| src/frontend/src/pages/QAQC/index.js | 3 |
| src/frontend/src/pages/Units/index.js | 3 |
| src/frontend/src/apps/bom/index.js | 2 |
| src/frontend/src/apps/optimization/index.js | 2 |
| src/frontend/src/pages/Auth/index.js | 2 |
| src/frontend/src/pages/Dashboard/index.js | 2 |
| src/frontend/src/pages/OpsCockpit/index.js | 2 |
| src/frontend/src/pages/Pricing/index.js | 2 |
| src/frontend/src/pages/Provenance/index.js | 2 |
| src/backend/src/config/env.js | |
| src/backend/src/workflows/index.js | |
| src/backend/src/workflows/pos/WillCallService.js | |
| src/backend/src/workflows/pos/index.js | |
| src/backend/src/workflows/pos/types.js | |

Packages no source file imports: frontend @elevenlabs/elevenlabs-js, @emotion/react, @emotion/styled, date-fns, elevenlabs; server @elevenlabs/elevenlabs-js, express-validator, pg. (@emotion/react and @emotion/styled are required by Material UI although nothing imports them.)

## Largest files

Finding B-014.

| File | Lines | Pieces of state (useState) |
|---|---:|---:|
| src/frontend/src/help/manualContent.js | 3546 | 0 |
| src/frontend/src/router/AppRouter.jsx | 1529 | 0 |
| src/frontend/src/pages/Admin/StaffManagementPage.jsx | 1335 | 35 |
| src/frontend/src/pages/OpsCockpit/OpsCockpitPage.jsx | 1093 | 14 |
| src/frontend/src/components/pos/POSContext.jsx | 1032 | 0 |
| src/frontend/src/apps/safety/StopWorkDashboard.jsx | 979 | 9 |
| src/frontend/src/components/jobs/ModernJobCard.jsx | 958 | 6 |
| src/frontend/src/apps/bom/BomRecipeEditorPage.jsx | 949 | 22 |
| src/frontend/src/pages/Maintenance/WorkOrderCenter.jsx | 927 | 12 |
| src/frontend/src/pages/SQM/SupplierListPage.jsx | 908 | 6 |
| src/frontend/src/dashboard/widgets/index.jsx | 900 | 3 |
| src/frontend/src/components/layout/HeaderAIAssistant.jsx | 867 | 11 |
| src/frontend/src/components/inventory/InventoryUpload.jsx | 852 | 7 |
| src/frontend/src/apps/safety/SafetyAssistantPage.jsx | 834 | 4 |
| src/frontend/src/pages/QC/QCInspectionPage.jsx | 829 | 16 |
| src/frontend/src/components/pos/screens/LineEntryScreen.jsx | 823 | 13 |
| src/frontend/src/pages/Customers/CustomerPreferencesPage.jsx | 795 | 11 |
| src/frontend/src/apps/safety/PermitsPage.jsx | 786 | 13 |
| src/frontend/src/screens/ShipmentTrackingScreen.jsx | 769 | 10 |
| src/frontend/src/pages/Maintenance/PartsInventory.jsx | 762 | 5 |
| src/backend/src/routes/pos.js | 1336 | |
| src/backend/src/routes/dispatchRoutes.js | 1034 | |
| src/backend/src/routes/stopWork.js | 985 | |
| src/backend/src/routes/jobs.js | 948 | |
| src/backend/src/routes/opsCockpit.js | 868 | |
| src/backend/src/routes/inventoryV1.js | 864 | |
| src/backend/src/routes/staff.js | 720 | |
| src/backend/src/routes/partner/customerRoutes.js | 718 | |
| src/backend/src/routes/dropTagRoutes.js | 716 | |
| src/backend/src/routes/users.js | 692 | |
| src/backend/src/routes/bomV1.js | 671 | |
| src/backend/src/routes/aiOrderHubRoutes.js | 652 | |

## Other counts from the frontend

| Item | Count |
|---|---:|
| Files over 600 lines | 65 |
| Files over 1,000 lines | 5 |
| TypeScript files | 0 |
| Icon-only buttons | 301 |
| aria-label attributes | 32 |
| Browser alert or confirm calls | 25 in 15 files |
| Timers started (setInterval, setTimeout) | 66 |
| Timers cleared | 36 |
| console.log calls | 18 |
| Dialogs | 123 |
| Frontend unit test files | 0 |

