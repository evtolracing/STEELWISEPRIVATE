# System inventory

Generated 2026-11-18 by `qa/tools/excellence-docs.mjs` at commit 3953a52. Do not edit by hand: change the source and rerun.

Every figure here is counted from the code or measured in a test run. The module map itself (which files make a module, and its classification) is written by hand in `qa/tools/excellence-modules.mjs`.

## Totals

| Item | Count |
|---|---:|
| Modules | 51 |
| Server route files | 76 |
| API routes (each address counted; two route files are mounted twice) | 686 |
| API routes that change data | 363 |
| Database tables in the schema | 172 |
| Enumerations | 96 |
| Migrations | 36 |
| Screens (routes in the browser) | 146 |
| Frontend source files | 409 (121,101 lines) |
| Server route code | 25,632 lines |
| Background jobs, queues, schedules, event bus | 0 |
| Email or text providers | 0 |
| Outside services called | 4 (three AI providers, one voice provider) plus partner webhooks |
| Feature flags | 0 |

## Modules by classification

| Classification | Modules |
|---|---:|
| IMPLEMENTED AND VERIFIED | 28 |
| PARTIALLY IMPLEMENTED | 9 |
| IMPLEMENTED BUT NOT VERIFIED | 6 |
| PLACEHOLDER OR MOCK | 5 |
| DISCONNECTED | 3 |

IMPLEMENTED AND VERIFIED means the module's critical behaviour was run successfully by an automated test in this session and the result was checked. It does not mean the module is complete: see the findings listed against it.

## Enterprise administration

### Sign-in and sessions

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep: forged, expired and wrong-key tokens refused; disabled users refused
- **Purpose:** Staff and customer sign-in, the signed token, first-user registration
- **Screens:** 1 (1 static): /login
- **Server:** `src/backend/src/routes/auth.js`; served at /api/auth
- **Routes:** 5, of which 4 change data. Returned a success in a test this session: 5 of 5; of the changing routes, 4 of 4
- **Tables:** User, AuditLog
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
- **Routes:** 13, of which 6 change data. Returned a success in a test this session: 8 of 13; of the changing routes, 4 of 6
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
- **Findings:** none open
- **Production concern:** No branch, division or region boundary. 16 areas have no department rule

### Staff and operators

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Phase 7: operator rules tested (private fields to managers only, certifications validated, a clocked-on operator cannot be removed or moved, branch-owned: L-014, L-019). Shift routes have no success-path test and nothing schedules against a shift
- **Purpose:** Operators, skills, certifications, shifts
- **Screens:** 1 (1 real): /admin/staff
- **Server:** `src/backend/src/routes/staff.js`; served at /api/staff
- **Routes:** 15, of which 9 change data. Returned a success in a test this session: 9 of 15; of the changing routes, 4 of 9
- **Tables:** Operator, WorkCenterType, Location, WorkCenter, DispatchTimeLog, OperatorSkill, Shift
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Users, work centers
- **Feeds:** Dispatch, time tracking
- **Findings:** B-012, B-014
- **Production concern:** Labor rules (certification required, two steps at once, shift length) are not on file (L-022)

### Settings, tax rates and online settings

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Tax rates verified (sweep, browser). Online cut-off settings are lost on reload (X-007)
- **Purpose:** Sales tax by state, store rules, catalogue visibility, demo seed switch
- **Screens:** 9 (8 real, 1 mixed): /admin/integrations, /admin/users, /admin/partners, /admin/tax-rates, /admin/audit-log, /admin/processing-recipes, /admin/staff, /admin/catalog, /admin/online-settings
- **Server:** `src/backend/src/routes/taxRates.js`, `src/backend/src/routes/onlineSettings.js`, `src/backend/src/routes/admin.js`; served at /api/tax-rates, /api/admin/online-settings, /api/admin
- **Routes:** 12, of which 6 change data. Returned a success in a test this session: 6 of 12; of the changing routes, 0 of 6
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
- **Routes:** 8, of which 4 change data. Returned a success in a test this session: 6 of 8; of the changing routes, 3 of 4
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
- **Routes:** 18, of which 9 change data. Returned a success in a test this session: 16 of 18; of the changing routes, 7 of 9
- **Tables:** RFQ, Quote, User, Organization, Order
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Customers, products, pricing
- **Feeds:** Sales orders
- **Findings:** B-012
- **Production concern:** No quote revisions or approvals

### Order entry

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Order entry screen follows the order rules" (43 checks); browser suite (sales)
- **Purpose:** The order entry screen: lines, price, processing, tax, credit check
- **Screens:** 10 (9 real, 1 mixed): /intake, /place-order, /orders/invoices, /orders/closeout, /orders/returns, /orders, /orders/intake, /orders/online-inbox, /orders/credit-holds, /orders/:id
- **Server:** `src/backend/src/routes/intakeOrders.js`, `src/backend/src/routes/intakePricing.js`, `src/backend/src/routes/intakeProcessing.js`; served at /api/orders/intake, /api/pricing, /api/processing
- **Routes:** 17, of which 7 change data. Returned a success in a test this session: 16 of 17; of the changing routes, 7 of 7
- **Tables:** Organization, Order, Location, Quote, Job, OrderLine, Product, PriceLevel, CustomerPricingTier, AuditLog, ProcessingOperation, ProcessingTemplate
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Customers, products, pricing, tax, credit
- **Feeds:** Sales orders, jobs
- **Findings:** X-007
- **Production concern:** Promise date and branch suggestion on this screen are mock rules

### Sales orders

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation: every job; race tests on reservation; unit tests on the move table
- **Purpose:** The order record: confirm, hold, cancel, reserve stock
- **Screens:** 8 (7 real, 1 mixed): /orders/invoices, /orders/closeout, /orders/returns, /orders, /orders/intake, /orders/online-inbox, /orders/credit-holds, /orders/:id
- **Server:** `src/backend/src/routes/orders.js`; served at /api/orders
- **Routes:** 10, of which 4 change data. Returned a success in a test this session: 10 of 10; of the changing routes, 4 of 4
- **Tables:** Order, OrderLine, OrderLineAllocation, Inventory, Coil, AuditLog, Shipment, User
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Order entry, quotes, web store, counter
- **Feeds:** Jobs, shipments, invoices
- **Findings:** none open

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
- **Tables:** Product, Order, Invoice, Payment, MaterialMovement, AuditLog, InvoiceLine
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
- **Routes:** 17, of which 10 change data. Returned a success in a test this session: 12 of 17; of the changing routes, 6 of 10
- **Tables:** OnlineOrder, Organization, Location, Product, Order
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
- **Routes:** 12, of which 1 change data. Returned a success in a test this session: 8 of 12; of the changing routes, 0 of 1
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
- **Screens:** none
- **Server:** `src/backend/src/routes/orderHubRoutes.js`, `src/backend/src/routes/aiOrderHubRoutes.js`, `src/backend/src/routes/ingestRoutes.js`, `src/backend/src/routes/pipelineRoutes.js`; served at /api/v1, /api/v1/ai, /api/v1/ingest, /api/v1/pipeline
- **Routes:** 31, of which 18 change data. Returned a success in a test this session: 7 of 31; of the changing routes, 0 of 18
- **Tables:** IntakeJob
- **Who may change it:** see permissions-matrix.md
- **Depends on:** None
- **Feeds:** None
- **Findings:** B-009
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
- **Routes:** 16, of which 6 change data. Returned a success in a test this session: 15 of 16; of the changing routes, 6 of 6
- **Tables:** Grade, Product, Heat, Organization, MaterialMovement
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Access control
- **Feeds:** Stock, pricing, order entry, receiving
- **Findings:** B-012
- **Production concern:** GET /api/products returns the whole catalogue

### Routings and processing recipes

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Phase 7: routing life cycle, step validation, activation, versioning and who may change one are tested (qa/sim/phase7-manufacturing.mjs groups 1 and 2; L-011). Processing recipe writes have no success-path test. No bill of material exists (L-024)
- **Purpose:** Versioned routings (called BOM recipes in the code: steps, not materials) and processing recipes
- **Screens:** 4 (1 sample, labelled, 3 real): /boms, /bom//, /bom//new, /bom//:recipeId
- **Server:** `src/backend/src/routes/processingRecipes.js`, `src/backend/src/routes/bomV1.js`; served at /api/processing-recipes, /api/v1/bom
- **Routes:** 16, of which 11 change data. Returned a success in a test this session: 11 of 16; of the changing routes, 7 of 11
- **Tables:** ProcessingRecipe, RecipeRoutingTemplate, BomRecipe
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, work centers
- **Feeds:** Jobs, planning
- **Findings:** I-011
- **Production concern:** A bill of material and material requirements do not exist

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
- **Basis:** Simulation; sweep "Stock items" (29 checks); qa/sim/phase6-inventory.mjs (105 scenarios); database balance rule including in transit; browser suite (stock)
- **Purpose:** Coils, plates, bars and shelf goods by heat and location; holds; corrections; reservation fit rules
- **Screens:** 4 (3 real, 1 static): /inventory, /units, /units/:id, /inventory/*
- **Server:** `src/backend/src/routes/coils.js`, `src/backend/src/routes/inventory.js`; served at /api/coils, /api/inventory
- **Routes:** 25, of which 13 change data. Returned a success in a test this session: 23 of 25; of the changing routes, 12 of 13
- **Tables:** Coil, MaterialMovement, QCHold, OrderLineAllocation, Heat, Grade, Organization, Location, Product, User, Inventory, AuditLog, StockTransfer
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, heats, receiving
- **Feeds:** Reservation, shipping, returns
- **Findings:** K-007, K-008, K-009
- **Production concern:** No cost is written at receipt (K-007); no cycle count program (K-008)

### Receiving

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Sweep "Receiving" (32 checks); unit tests on receiving rules; qa/sim/phase6-inventory.mjs group "Receiving and putaway"; qa/sim/ui-phase6.cjs
- **Purpose:** A receipt or an upload makes real stock with heat and location; a receipt against a purchase order line is checked against it
- **Screens:** 1 (1 real): /receiving
- **Server:** `src/backend/src/routes/inventory.js`; served at /api/inventory
- **Routes:** 17, of which 9 change data. Returned a success in a test this session: 17 of 17; of the changing routes, 9 of 9
- **Tables:** Inventory, Coil, Location, MaterialMovement, StockTransfer
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Products, heats, purchase orders
- **Feeds:** Stock
- **Findings:** K-011, K-013
- **Production concern:** Receiving tolerance is not set by the owner (K-011); scanners not tested (K-013)

### Purchase orders and supply position

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** qa/sim/phase6-inventory.mjs group "Purchasing and replenishment" (16 scenarios); qa/sim/ui-phase6.cjs
- **Purpose:** Buyers write, place, close and cancel purchase orders; receipts fill lines; stock, inbound and demand per branch and grade
- **Screens:** 1 (1 real): /purchase-orders
- **Server:** `src/backend/src/routes/purchaseOrders.js`; served at /api/purchase-orders
- **Routes:** 4, of which 1 change data. Returned a success in a test this session: 4 of 4; of the changing routes, 1 of 1
- **Tables:** Organization, Location, Order, OrderLine, AuditLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Suppliers, grades, products
- **Feeds:** Receiving, stock
- **Findings:** K-010, K-011, K-012
- **Production concern:** No approval rule and no reorder policy on file (K-010, K-011); supplier invoices are not matched (K-012)

### Interbranch transfers

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** qa/sim/phase6-inventory.mjs group "Interbranch transfers" (17 scenarios) and concurrency group; seven reconciliation facts in qa/tools/db-facts.mjs; qa/sim/ui-phase6.cjs
- **Purpose:** Send, in transit, receive, short or damaged held, settle, call back
- **Screens:** 1 (1 real): /transfers
- **Server:** `src/backend/src/routes/inventory.js`; served at /api/inventory
- **Routes:** 17, of which 9 change data. Returned a success in a test this session: 17 of 17; of the changing routes, 9 of 9
- **Tables:** Inventory, Coil, Location, MaterialMovement, StockTransfer
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Stock, branches
- **Feeds:** Stock, reservation, shipping
- **Findings:** none open
- **Production concern:** The stock list row does not say in transit (K-014)

### Second stock list (unit tracking)

- **Status:** DISCONNECTED
- **Basis:** Its own five tables. Orders and shipping never read it. 0 of 5 write routes succeed in a test
- **Purpose:** A separate unit, RFID, transfer and adjustment store
- **Screens:** none
- **Server:** `src/backend/src/routes/inventoryV1.js`; served at /api/v1/inventory
- **Routes:** 17, of which 9 change data. Returned a success in a test this session: 7 of 17; of the changing routes, 0 of 9
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
- **Routes:** 9, of which 4 change data. Returned a success in a test this session: 7 of 9; of the changing routes, 3 of 4
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Stock, work orders (not connected)
- **Feeds:** Web store
- **Findings:** S-009
- **Production concern:** Remnants exist only where data was loaded directly

## Manufacturing and processing

### Jobs, job board and schedule

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation: every job; sweep "Shop floor records" (50 checks); qa/sim/phase7-manufacturing.mjs groups 1, 4, 5 and 7; unit tests on moves, gates and history; browser suite (shop)
- **Purpose:** Shop jobs: create, plan, move through the shop, every move recorded against a person and passed through one quality and open-steps gate
- **Screens:** 6 (6 real): /production, /production/shop-floor, /production/shipping, /order-board, /schedule, /jobs/:id
- **Server:** `src/backend/src/routes/jobs.js`, `src/backend/src/lib/jobGates.js`, `src/backend/src/lib/costing.js`; served at /api/jobs, /api/v1/jobs
- **Routes:** 36, of which 20 change data. Returned a success in a test this session: 21 of 36; of the changing routes, 10 of 20
- **Tables:** Job, OrderLine, Order, WorkCenter, DispatchJob, WorkCenterType, DispatchOperation, User
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sales orders, routings
- **Feeds:** Shipping (unfinished jobs hold their lines), quality
- **Findings:** M-017, L-029
- **Production concern:** Job cost waits on the owner's labor rates and has no overhead (L-026); no bill of material (L-024)

### Coil work orders

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Phase 3 completion to stock; qa/sim/phase7-manufacturing.mjs groups 2, 5 and 6 (consumption, quality hold, substitution, scrap and yield); unit tests on the move table; browser suite (shop)
- **Purpose:** Release, start, complete a processing work order against a coil: weight in, pieces out, scrap, with the source heat
- **Screens:** 3 (3 real): /work-orders, /work-orders/new, /work-orders/:id
- **Server:** `src/backend/src/routes/workOrders.js`; served at /api/work-orders
- **Routes:** 9, of which 7 change data. Returned a success in a test this session: 9 of 9; of the changing routes, 7 of 7
- **Tables:** WorkOrder, AuditLog, Coil, Job, OrderLine, Inventory
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Stock
- **Feeds:** Stock (pieces, scrap, drops)
- **Findings:** none open
- **Production concern:** Not linked to a job (L-024); carries no cost (L-026)

### Dispatch, work centers and shop-floor operations

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** qa/sim/phase7-manufacturing.mjs groups 3, 4 and 7 (59 verified scenarios); qa/sim/phase2-integrity.mjs; unit tests; qa/sim/ui-phase7.cjs; timed at 85 branches
- **Purpose:** Work-center kinds, queues, the scheduling run, start, pause and finish a step, time entries
- **Screens:** 3 (3 real): /time-tracking, /shopfloor, /shopfloor/:workCenterId
- **Server:** `src/backend/src/routes/dispatchRoutes.js`, `src/backend/src/routes/operationsRoutes.js`, `src/backend/src/routes/workCenters.js`, `src/backend/src/lib/productionRules.js`, `src/backend/src/lib/dispatchPlan.js`, `src/backend/src/lib/workCenterGuard.js`; served at /api/work-centers, /api/v1/work-centers, /api/v1/dispatch, /api/v1/operations
- **Routes:** 35, of which 17 change data. Returned a success in a test this session: 27 of 35; of the changing routes, 12 of 17
- **Tables:** WorkCenter, Location, Job, WorkCenterType, DispatchDivision, DispatchOperation, Organization, Operator, DispatchJob, DispatchTimeLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs, staff, maintenance (lockout)
- **Feeds:** Jobs, time and labor, quality
- **Findings:** L-030
- **Production concern:** No machine is connected (L-030); no screen sets hours per day (L-025)

### Planning and optimization

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Phase 7: examined and tested (qa/sim/phase7-manufacturing.mjs group 3; unit tests): no assumed times or hours, apply checks every line (L-008). Partial because it knows no shift calendar, absence or running work (L-025)
- **Purpose:** Lays jobs out on work centers, reports load, bottlenecks and late jobs; preview, apply, what-if
- **Screens:** 3 (3 real): /optimization//, /planning//, /planning//workflow
- **Server:** `src/backend/src/routes/optimizationV1.js`, `src/backend/src/lib/capacityPlan.js`; served at /api/v1/ai/work-order-optimize
- **Routes:** 4, of which 3 change data. Returned a success in a test this session: 4 of 4; of the changing routes, 3 of 3
- **Tables:** Job, WorkCenter
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs, work centers, routings
- **Feeds:** Schedule
- **Findings:** L-025
- **Production concern:** Not a finite-capacity schedule (L-025)

### Quality inspections

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** qa/sim/phase7-manufacturing.mjs group 5 (22 scenarios) and group 6 rework; qa/sim/ui-phase7.cjs; unit tests on the gate
- **Purpose:** Inspection of a job: open, fill in, pass, conditional pass, fail and hold, rework; the only way out of the inspection queue
- **Screens:** 2 (2 real): /qc, /qc/inspect/:id
- **Server:** `src/backend/src/routes/qcRoutes.js`; served at /api/qc
- **Routes:** 11, of which 6 change data. Returned a success in a test this session: 11 of 11; of the changing routes, 6 of 6
- **Tables:** Job, JobInspection, Operator, WorkCenterType, AuditLog, DispatchJob, DispatchOperation
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs
- **Feeds:** Jobs (packaging or hold), shipping
- **Findings:** L-023, L-028
- **Production concern:** The inspection checklists are the owner's to enter (L-028); no nonconformance record (L-023)

### Material tracking, packages and drop tags

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Screens open on real data. 0 of 30 write routes succeed in a test
- **Purpose:** Custody log, packages, tags, staging, print queue
- **Screens:** 7 (7 real): /material-tracking, /material-tracking/packaging, /material-tracking/packages, /material-tracking/tags, /material-tracking/staging, /material-tracking/traceability, /material-tracking/traceability/:jobId
- **Server:** `src/backend/src/routes/materialTrackingRoutes.js`, `src/backend/src/routes/dropTagRoutes.js`, `src/backend/src/routes/printQueue.js`; served at /api/drop-tags, /api/material-tracking, /api/print-queue
- **Routes:** 50, of which 33 change data. Returned a success in a test this session: 32 of 50; of the changing routes, 19 of 33
- **Tables:** Job, Package, DropTag, TraceEvent, Coil, JobInspection
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Jobs
- **Feeds:** Shipping
- **Findings:** none open
- **Production concern:** Tag and package life cycle has never been run end to end

### Maintenance and assets

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Two real screens, three sample screens. Phase 7: maintenance order state rules and the lockout are tested (qa/sim/phase7-manufacturing.mjs group 3; L-015, L-016). Asset writes have no success-path test
- **Purpose:** Assets, maintenance orders, lockout of a machine from scheduling
- **Screens:** 5 (3 sample, labelled, 2 real): /maintenance/dashboard, /maintenance/work-orders, /maintenance/assets, /maintenance/pm-schedules, /maintenance/parts
- **Server:** `src/backend/src/routes/maintenanceOrders.js`, `src/backend/src/routes/assets.js`; served at /api/maintenance-orders, /api/assets
- **Routes:** 17, of which 9 change data. Returned a success in a test this session: 12 of 17; of the changing routes, 6 of 9
- **Tables:** MaintenanceOrder, Asset, AssetType, WorkCenter
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Work centers
- **Feeds:** Scheduling and step start (lockout)
- **Findings:** X-009, B-017
- **Production concern:** 11 maintenance tables have no code

## Shipping and logistics

### Shipping

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation: every shipping job incl. triple-dispatch race; sweep (37 checks); browser suite (shipping, 27 checks)
- **Purpose:** Create, dispatch and deliver a shipment; partial shipments; proof of delivery
- **Screens:** 2 (2 real): /shipping, /shipping/:id
- **Server:** `src/backend/src/routes/shipments.js`, `src/backend/src/routes/shippingV1.js`; served at /api/shipments, /api/v1/shipping, /api/v1/shipments
- **Routes:** 17, of which 8 change data. Returned a success in a test this session: 16 of 17; of the changing routes, 8 of 8
- **Tables:** Shipment, Job, Invoice, AuditLog, Location, ShipmentItem, OrderLineAllocation, Coil, Inventory, MaterialMovement, OrderLine, Order, WorkCenter
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sales orders, jobs, stock
- **Feeds:** Invoices, stock
- **Findings:** none open
- **Production concern:** Shipping documents and printing not examined; no carrier rates or freight cost

### Returns

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** Simulation return jobs incl. triple-receive race
- **Purpose:** Return against shipped quantity, receive, restock or scrap, credit
- **Screens:** none
- **Server:** `src/backend/src/routes/returns.js`; served at /api/returns
- **Routes:** 7, of which 4 change data. Returned a success in a test this session: 6 of 7; of the changing routes, 4 of 4
- **Tables:** Order, AuditLog, MaterialMovement, Inventory, InvoiceLine, Coil, QCHold, OrderLine, Invoice
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
- **Findings:** none open
- **Production concern:** Any staff login can delete a document

### Partner API

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Phase 4: qa/sim/phase4-integration.mjs signs in as customer, carrier and supplier partners and succeeds on every working route; isolation between partners, scopes, revoked keys, rate limit, request keys and event delivery are tested. Supplier shipping notices, corrective actions, scorecard and document upload answer 501 (not built)
- **Purpose:** Token-protected API for customers, suppliers and carriers; events sent to partner systems (webhooks)
- **Screens:** none
- **Server:** `src/backend/src/routes/partner/partnerAuthRoutes.js`, `src/backend/src/routes/partner/customerRoutes.js`, `src/backend/src/routes/partner/supplierRoutes.js`, `src/backend/src/routes/partner/carrierRoutes.js`, `src/backend/src/routes/partner/webhookRoutes.js`, `src/backend/src/routes/partner/adminRoutes.js`; served at /api/v1/partner/auth, /api/v1/partner/customer, /api/v1/partner/supplier, /api/v1/partner/carrier, /api/v1/partner/webhooks, /api/v1/admin/partners
- **Routes:** 47, of which 20 change data. Returned a success in a test this session: 36 of 47; of the changing routes, 15 of 20
- **Tables:** RFQ, Quote, Order, Shipment, Invoice, Document, DocumentBlob, AuditLog, PartnerWebhook, WebhookDelivery, Partner, Organization, PartnerApiKey, PartnerApiLog
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Sales orders, quotes, shipments, invoices, purchase orders
- **Feeds:** Outside systems
- **Findings:** H-014, B-019
- **Production concern:** Failed events are retried only when the host calls the scheduled address (B-019)

### Integrations and scheduled work

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** qa/sim/phase4-integration.mjs (report, replay, scheduled run, secrets not shown); qa/sim/ui-integration.cjs (the screen, Run now, a clerk is refused)
- **Purpose:** The integration report (what is connected, calls to outside services, events waiting or failed, orders shipped but not invoiced), replay of a failed event, and the address the host calls on a schedule
- **Screens:** 1 (1 real): /admin/integrations
- **Server:** `src/backend/src/routes/integrations.js`; served at /api/admin/integrations
- **Routes:** 5, of which 2 change data. Returned a success in a test this session: 5 of 5; of the changing routes, 2 of 2
- **Tables:** WebhookDelivery
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Partner API, shipments, invoices, request keys
- **Feeds:** Company administrators; the host scheduler
- **Findings:** B-019, E-017
- **Production concern:** Counters for outside calls are per server instance; no alert is sent anywhere (E-017)

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
- **Routes:** 8, of which 5 change data. Returned a success in a test this session: 8 of 8; of the changing routes, 5 of 5
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Shipping, counter, returns
- **Feeds:** Customer account pages, partner API
- **Findings:** B-019
- **Production concern:** No statements, no ageing, no overdue by date, no export to accounting

### Financial ledger

- **Status:** IMPLEMENTED AND VERIFIED
- **Basis:** qa/sim/phase95-ledger.mjs (158 scenarios in seven groups); qa/sim/phase95-ui.cjs (13); qa/sim/phase95-load.mjs (80 branches, measured); 24 unit tests; qa/tools/phase95-mutations.mjs (26 rules removed, 26 caught)
- **Purpose:** Double-entry books behind sales, payments, stock, work orders and transfers: chart of accounts, approved posting rules, immutable journal, periods, cutover, reconciliation, reports and export. Switched off until an accountant approves
- **Screens:** 1 (1 real): /finance
- **Server:** `src/backend/src/routes/ledger.js`, `src/backend/src/services/ledger.js`, `src/backend/src/services/ledgerCutover.js`, `src/backend/src/services/ledgerReports.js`, `src/backend/src/services/ledgerAssistant.js`, `src/backend/src/lib/ledgerRules.js`; served at /api/ledger
- **Routes:** 35, of which 24 change data. Returned a success in a test this session: 33 of 35; of the changing routes, 22 of 24
- **Tables:** LedgerPeriod, JournalEntry
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Invoices and payments, stock, receiving, transfers, work orders, shipping
- **Feeds:** Reports, export to an accounting system, the assistant
- **Findings:** W-001 to W-027
- **Production concern:** Verified as engineering only. Not active on the live system: the chart, the posting rules and 16 policy decisions need an accountant's approval, and the cutover needs a dry run on a copy of live data (W-001)

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
- **Findings:** E-017
- **Production concern:** Rate limit counts per server instance; no alerting

### AI assistant and voice

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Phase 4: the calls out to the speech and AI providers are tested against a local stand-in for success, hang, error, wrong key and repeated failure (qa/sim/phase4-integration.mjs). No real provider was called, so the answers themselves are not verified
- **Purpose:** Top-bar assistant, chat, quote assistant, text to speech
- **Screens:** none
- **Server:** `src/backend/src/routes/ai.js`, `src/backend/src/routes/aiAssistant.js`, `src/backend/src/routes/tts.js`; served at /api/ai, /api/ai/tts, /api/ai/assistant
- **Routes:** 14, of which 10 change data. Returned a success in a test this session: 6 of 14; of the changing routes, 2 of 10
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Read access to records; outside providers
- **Feeds:** None
- **Findings:** H-012
- **Production concern:** What the assistant may read and say has not been examined; real providers not exercised

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

- **Status:** PARTIALLY IMPLEMENTED
- **Basis:** Phase 4: one scheduled address exists and is tested (it sends waiting partner events and clears old request keys); see "Integrations and scheduled work". Nothing else runs on a schedule, and no email or text message is sent (owner decision 5: later). The host schedule is not set (B-019)
- **Purpose:** Anything that happens without a person pressing a button
- **Screens:** none
- **Server:** none
- **Routes:** 0
- **Tables:** none directly in the route files (through a service, or none)
- **Who may change it:** see permissions-matrix.md
- **Depends on:** Integrations and scheduled work
- **Feeds:** nothing
- **Findings:** B-019, D-034, H-015
- **Production concern:** Until the host schedule is set, a failed event waits for a person; nothing is escalated or changed by time

## Analytics and executive

### Operations cockpit and dashboards

- **Status:** IMPLEMENTED BUT NOT VERIFIED
- **Basis:** Figures come from the database and failed figures show an error (browser suite). The figures have not been reconciled to the records they summarise
- **Purpose:** Role dashboard, operations cockpit, sales and pricing dashboards, exception events
- **Screens:** 2 (2 real): /ops-cockpit, /role-dashboard//
- **Server:** `src/backend/src/routes/dashboard.js`, `src/backend/src/routes/opsCockpit.js`, `src/backend/src/routes/analyticsV1.js`, `src/backend/src/routes/eventsV1.js`, `src/backend/src/routes/demandShaping.js`, `src/backend/src/routes/compressionMetrics.js`; served at /api/demand-shaping, /api/metrics/compression, /api/dashboard, /api/v1/analytics, /api/v1/events, /api/ops-cockpit
- **Routes:** 29, of which 9 change data. Returned a success in a test this session: 22 of 29; of the changing routes, 2 of 9
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
| Purchase requisitions, purchase order approval, vendor scorecards | K-011 |
| Cycle count program and a stock correction screen | I-016, K-008 |
| Automatic replenishment (reorder points) | K-010 |
| Inventory costing and valuation | K-007 |
| Lead and opportunity tracking (CRM) |  |
| Quote revisions and quote approvals |  |
| Contract pricing | S-009 |
| Carrier assignment with rates, freight cost | F-007 |
| Statements, ageing, accounting export or integration |  |
| Overhead, stock valuation, cost of goods and profitability reporting (job cost from material and labor exists since owner decision 9) | L-026, K-007 |
| Bill of material and material requirements for a job | L-024 |
| Finite-capacity scheduling against shift calendars | L-025 |
| Nonconformance reports and corrective actions | L-023 |
| Outside processing; nesting and cut optimisation | L-027 |
| Machine connection, machine time and downtime capture | L-030 |
| Email or text notifications of any kind | D-034, B-019 |
| Card payment processing | D-033 |
| Scheduled tasks, queues, background jobs | B-019 |
| Feature flags |  |
| Region as a level between branch and company | B-003 |
| Approval authority and approval workflows (the tables exist with no code) | B-017 |
| Backups and a tested restore, a staging environment, alerting | E-015, E-017 |

## Code nothing uses

Found by following imports from the application entry points. 54 frontend files (9,362 lines) and 5 server files. Finding B-013.

| File | Lines |
|---|---:|
| src/frontend/src/apps/orderhub/RfqCreatePage.jsx | 617 |
| src/frontend/src/hooks/useRealTimePricing.js | 610 |
| src/frontend/src/apps/inventory/InventoryDetailPage.jsx | 587 |
| src/frontend/src/services/splitShipmentApi.js | 571 |
| src/frontend/src/apps/orderhub/RfqDetailPage.jsx | 554 |
| src/frontend/src/apps/inventory/InventoryDashboardPage.jsx | 546 |
| src/frontend/src/apps/orderhub/OrderDetailPage.jsx | 538 |
| src/frontend/src/hooks/useValidation.js | 529 |
| src/frontend/src/components/InventoryAiAssistantPanel.jsx | 419 |
| src/frontend/src/components/shipping/SplitShipmentDialog.jsx | 405 |
| src/frontend/src/pages/OrderBoardPage.jsx | 362 |
| src/frontend/src/apps/orderhub/RfqListPage.jsx | 332 |
| src/frontend/src/components/logistics/DeliveryZoneMap.jsx | 302 |
| src/frontend/src/components/shipping/ShipmentTracker.jsx | 297 |
| src/frontend/src/components/logistics/InboundShipmentTracker.jsx | 283 |
| src/frontend/src/components/logistics/AddressAutocomplete.jsx | 276 |
| src/frontend/src/components/shipping/PartialFulfillmentBanner.jsx | 259 |
| src/frontend/src/constants/permissions.js | 242 |
| src/frontend/src/components/shipping/OrderStatusTimeline.jsx | 214 |
| src/frontend/src/components/logistics/LoadDiagram.jsx | 194 |
| src/frontend/src/components/logistics/RouteMap.jsx | 167 |
| src/frontend/src/hooks/useSplitShipment.js | 151 |
| src/frontend/src/services/aiService.js | 124 |
| src/frontend/src/apps/shopfloor/ShopFloorApp.jsx | 121 |
| src/frontend/src/components/help/HelpDrawer.jsx | 98 |
| src/frontend/src/api/authFetch.js | 82 |
| src/frontend/src/components/production/ProductionLayout.jsx | 76 |
| src/frontend/src/services/orderApi.js | 74 |
| src/frontend/src/services/quoteApi.js | 53 |
| src/frontend/src/services/aiOrderHubApi.js | 52 |
| src/frontend/src/services/contactApi.js | 39 |
| src/frontend/src/services/inventoryAiApi.js | 31 |
| src/frontend/src/components/logistics/index.js | 29 |
| src/frontend/src/config/supabaseClient.js | 28 |
| src/frontend/src/apps/orderhub/OrderHubApp.jsx | 19 |
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
| src/frontend/src/help/manualContent.js | 3542 | 0 |
| src/frontend/src/router/AppRouter.jsx | 1581 | 0 |
| src/frontend/src/pages/Admin/StaffManagementPage.jsx | 1337 | 35 |
| src/frontend/src/pages/OpsCockpit/OpsCockpitPage.jsx | 1093 | 14 |
| src/frontend/src/components/pos/POSContext.jsx | 1032 | 0 |
| src/frontend/src/apps/safety/StopWorkDashboard.jsx | 979 | 9 |
| src/frontend/src/apps/bom/BomRecipeEditorPage.jsx | 969 | 23 |
| src/frontend/src/components/jobs/ModernJobCard.jsx | 959 | 6 |
| src/frontend/src/pages/Maintenance/WorkOrderCenter.jsx | 928 | 12 |
| src/frontend/src/pages/SQM/SupplierListPage.jsx | 909 | 6 |
| src/frontend/src/dashboard/widgets/index.jsx | 902 | 3 |
| src/frontend/src/components/layout/HeaderAIAssistant.jsx | 868 | 11 |
| src/frontend/src/components/inventory/InventoryUpload.jsx | 853 | 7 |
| src/frontend/src/apps/safety/SafetyAssistantPage.jsx | 835 | 4 |
| src/frontend/src/pages/QC/QCInspectionPage.jsx | 829 | 16 |
| src/frontend/src/components/pos/screens/LineEntryScreen.jsx | 823 | 13 |
| src/frontend/src/pages/Customers/CustomerPreferencesPage.jsx | 802 | 11 |
| src/frontend/src/apps/safety/PermitsPage.jsx | 787 | 13 |
| src/frontend/src/screens/ShipmentTrackingScreen.jsx | 770 | 10 |
| src/frontend/src/pages/Maintenance/PartsInventory.jsx | 765 | 5 |
| src/backend/src/routes/pos.js | 1313 | |
| src/backend/src/routes/jobs.js | 1007 | |
| src/backend/src/routes/stopWork.js | 985 | |
| src/backend/src/routes/dispatchRoutes.js | 921 | |
| src/backend/src/routes/inventoryV1.js | 876 | |
| src/backend/src/routes/opsCockpit.js | 873 | |
| src/backend/src/routes/staff.js | 788 | |
| src/backend/src/routes/bomV1.js | 734 | |
| src/backend/src/routes/users.js | 706 | |
| src/backend/src/routes/operationsRoutes.js | 672 | |
| src/backend/src/routes/aiOrderHubRoutes.js | 652 | |
| src/backend/src/routes/intakeOrders.js | 651 | |

## Other counts from the frontend

| Item | Count |
|---|---:|
| Files over 600 lines | 66 |
| Files over 1,000 lines | 5 |
| TypeScript files | 0 |
| Icon-only buttons | 301 |
| aria-label attributes | 265 |
| Browser alert or confirm calls | 0 in 0 files |
| Timers started (setInterval, setTimeout) | 70 |
| Timers cleared | 41 |
| console.log calls | 17 |
| Dialogs | 141 |
| Frontend unit test files | 0 |

