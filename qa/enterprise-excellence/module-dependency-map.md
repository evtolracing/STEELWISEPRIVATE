# Module dependency map

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit 958e90b. Do not edit by hand: change the source and rerun.

Two views. The first is the business flow, written by hand in the module map. The second is measured: which tables more than one module touches, and which shared code files the route files import. A change to a shared table or a shared file needs the tests of every module listed beside it.

## Business flow

| Module | Depends on | Feeds |
|---|---|---|
| Sign-in and sessions | Users | Every module |
| Users, roles and branches | Sign-in | Access control |
| Access control | Sign-in | Every module |
| Staff and operators | Users, work centers | Dispatch, time tracking |
| Settings, tax rates and online settings | Access control | Order tax, web store |
| Customers | Access control | Quotes, orders, pricing, credit, invoices |
| RFQs and quotes | Customers, products, pricing | Sales orders |
| Order entry | Customers, products, pricing, tax, credit | Sales orders, jobs |
| Sales orders | Order entry, quotes, web store, counter | Jobs, shipments, invoices |
| Pricing and customer tiers | Products, customers | Every sales channel |
| Credit control | Customers, invoices | Sales orders |
| Counter quick sale | Products, pricing, tax | Invoices, payments |
| Counter session flow (older) | Products, customers | None found |
| Web store | Products, pricing, tax, customers | Sales orders |
| Customer account pages | Sign-in, sales orders, documents | None |
| Promise dates, cut-offs, branch comparison, split shipments | None | Order entry, web checkout |
| Order hub and intake pipeline | None | None |
| Mobile rep |  |  |
| Products, grades and heats | Access control | Stock, pricing, order entry, receiving |
| Processing recipes and bills of material | Products, work centers | Jobs, planning |
| Customer specifications | Customers | Jobs |
| Stock items and stock levels | Products, heats, receiving | Reservation, shipping, returns |
| Receiving | Products, heats | Stock |
| Second stock list (unit tracking) | None | None |
| Remnants | Stock, work orders (not connected) | Web store |
| Jobs, job board and schedule | Sales orders | Shipping (unfinished jobs hold their lines) |
| Coil work orders | Stock | Stock (not yet: M-016) |
| Dispatch, work centers and shop-floor operations | Jobs, staff | Jobs, time and labor |
| Planning and optimization | Jobs, work centers | Schedule |
| Quality inspections | Jobs | Jobs (waiting on quality), shipping |
| Material tracking, packages and drop tags | Jobs | Shipping |
| Maintenance and assets | Work centers | Scheduling (not connected) |
| Shipping | Sales orders, jobs, stock | Invoices, stock |
| Returns | Shipping, invoices | Stock, credits |
| Documents | Heats, shipments | Customer account pages, partner API |
| Partner API | Sales orders, shipments, invoices | Outside systems |
| Freight and logistics planning |  |  |
| Invoices, payments, credits and refunds | Shipping, counter, returns | Customer account pages, partner API |
| Sales tax | Tax rates | Orders, invoices |
| Request safeguards | None | Every module |
| AI assistant and voice | Read access to records | None |
| Help manual |  |  |
| Background work, notifications, schedules |  |  |
| Operations cockpit and dashboards | Every operational module | None |
| Executive tools |  |  |
| Stop work |  |  |
| Safety, training, contractors, customer quality, supplier quality, production quality, provenance |  |  |

## Tables touched by more than one module

| Table | Modules | Count |
|---|---|---:|
| Organization | Customers; RFQs and quotes; Order entry; Counter session flow (older); Web store; Products, grades and heats; Stock items and stock levels; Dispatch, work centers and shop-floor operations; Partner API; Operations cockpit and dashboards | 10 |
| Job | Order entry; Customer specifications; Jobs, job board and schedule; Dispatch, work centers and shop-floor operations; Planning and optimization; Quality inspections; Material tracking, packages and drop tags; Shipping; Partner API; Operations cockpit and dashboards | 10 |
| Order | RFQs and quotes; Order entry; Sales orders; Counter quick sale; Web store; Shipping; Returns; Partner API; Operations cockpit and dashboards | 9 |
| AuditLog | Users, roles and branches; Customers; Order entry; Pricing and customer tiers; Counter quick sale; Coil work orders; Shipping; Operations cockpit and dashboards | 8 |
| Location | Users, roles and branches; Staff and operators; Settings, tax rates and online settings; Stock items and stock levels; Receiving; Dispatch, work centers and shop-floor operations; Shipping | 7 |
| Coil | Sales orders; Stock items and stock levels; Receiving; Coil work orders; Shipping; Returns; Operations cockpit and dashboards | 7 |
| WorkCenter | Staff and operators; Dispatch, work centers and shop-floor operations; Planning and optimization; Maintenance and assets; Shipping; Operations cockpit and dashboards | 6 |
| OrderLine | Order entry; Sales orders; Customer specifications; Jobs, job board and schedule; Shipping; Returns | 6 |
| Inventory | Sales orders; Stock items and stock levels; Receiving; Shipping; Returns; Operations cockpit and dashboards | 6 |
| User | Sign-in and sessions; Users, roles and branches; RFQs and quotes; Stock items and stock levels; Jobs, job board and schedule | 5 |
| Product | Order entry; Counter quick sale; Web store; Products, grades and heats; Stock items and stock levels | 5 |
| MaterialMovement | Stock items and stock levels; Receiving; Shipping; Returns; Operations cockpit and dashboards | 5 |
| Quote | RFQs and quotes; Order entry; Partner API; Operations cockpit and dashboards | 4 |
| Shipment | Material tracking, packages and drop tags; Shipping; Partner API; Operations cockpit and dashboards | 4 |
| Operator | Staff and operators; Dispatch, work centers and shop-floor operations; Quality inspections | 3 |
| WorkCenterType | Staff and operators; Jobs, job board and schedule; Dispatch, work centers and shop-floor operations | 3 |
| RFQ | RFQs and quotes; Partner API; Operations cockpit and dashboards | 3 |
| OrderLineAllocation | Sales orders; Stock items and stock levels; Shipping | 3 |
| Invoice | Counter quick sale; Shipping; Partner API | 3 |
| Grade | Products, grades and heats; Stock items and stock levels; Operations cockpit and dashboards | 3 |
| Heat | Products, grades and heats; Stock items and stock levels; Documents | 3 |
| CustomerPreference | Customers; Customer specifications | 2 |
| CustomerPricingTier | Customers; Order entry | 2 |
| InvoiceLine | Counter quick sale; Returns | 2 |
| QCHold | Stock items and stock levels; Operations cockpit and dashboards | 2 |
| DispatchJob | Jobs, job board and schedule; Dispatch, work centers and shop-floor operations | 2 |
| DispatchOperation | Dispatch, work centers and shop-floor operations; Operations cockpit and dashboards | 2 |
| JobInspection | Quality inspections; Material tracking, packages and drop tags | 2 |
| Document | Documents; Partner API | 2 |

## Shared server code and who imports it

| File | Imported by (route files) | Count |
|---|---|---:|
| lib/db.js | aiAssistant.js, analyticsV1.js, assets.js, auth.js, bomV1.js, coils.js, compressionMetrics.js, customers.js, … | 57 |
| lib/numbering.js | intakeOrders.js, jobs.js, maintenanceOrders.js, orders.js, qcRoutes.js, quickSale.js, quotes.js, returns.js, … | 12 |
| lib/roleAccess.js | coils.js, customers.js, grades.js, heats.js, intakeOrders.js, intakePricing.js, inventory.js, orders.js, … | 11 |
| lib/dbText.js | bomV1.js, coils.js, customers.js, intakePricing.js, inventory.js, orderHubStore.js, processingRecipes.js, quickSale.js, … | 10 |
| lib/workflowRules.js | intakeOrders.js, inventory.js, jobs.js, orders.js, returns.js, rfqs.js, shipments.js | 7 |
| middleware/partnerAuth.js | adminRoutes.js, carrierRoutes.js, customerRoutes.js, partnerAuthRoutes.js, supplierRoutes.js, webhookRoutes.js | 6 |
| lib/jobHistory.js | jobs.js, materialTrackingRoutes.js, operationsRoutes.js, qcRoutes.js, shipments.js | 5 |
| services/intakeCatalogService.js | coils.js, intakePricing.js, inventory.js, products.js | 4 |
| lib/fieldRules.js | grades.js, heats.js, products.js, workOrders.js | 4 |
| lib/creditControl.js | intakeOrders.js, onlineOrders.js, orders.js, quotes.js | 4 |
| lib/billingRules.js | intakeOrders.js, onlineOrders.js, quickSale.js, returns.js | 4 |
| services/billing.js | invoices.js, quickSale.js, returns.js, shipments.js | 4 |
| middleware/partnerRateLimit.js | carrierRoutes.js, customerRoutes.js, supplierRoutes.js, webhookRoutes.js | 4 |
| middleware/auth.js | admin.js, auth.js, users.js | 3 |
| services/ai/AIProviderService.js | ai.js, aiAssistant.js, opsCockpit.js | 3 |
| lib/settings.js | compressionMetrics.js, demandShaping.js, onlineSettings.js | 3 |
| lib/customerScope.js | ecom.js, portal.js, users.js | 3 |
| lib/customerPricing.js | ecom.js, intakePricing.js, quickSale.js | 3 |
| lib/orderTax.js | intakeOrders.js, intakePricing.js, onlineOrders.js | 3 |
| services/webhookService.js | carrierRoutes.js, customerRoutes.js, supplierRoutes.js | 3 |
| lib/priceRules.js | customers.js, intakePricing.js | 2 |
| services/printAutomationService.js | jobs.js, printQueue.js | 2 |
| lib/quoteRules.js | quotes.js, rfqs.js | 2 |
| services/dropTagService.js | dropTagRoutes.js | 1 |
| services/dropTagListingService.js | dropTagRoutes.js | 1 |
| services/scanService.js | dropTagRoutes.js | 1 |
| services/templateService.js | dropTagRoutes.js | 1 |
| services/ecomService.js | ecom.js | 1 |
| services/cockpitService.js | executive.js | 1 |
| services/simulationService.js | executive.js | 1 |
| services/forecastService.js | executive.js | 1 |
| services/decisionService.js | executive.js | 1 |
| lib/receiving.js | inventory.js | 1 |
| lib/receivingRules.js | inventory.js | 1 |
| services/portalService.js | portal.js | 1 |
| lib/zip.js | portal.js | 1 |
| services/tagRenderer.js | printQueue.js | 1 |
| services/remnantService.js | remnants.js | 1 |
| services/pricingIntelligenceService.js | salesRoutes.js | 1 |
| lib/workOrderRules.js | workOrders.js | 1 |

## Highest-risk dependencies

1. `lib/db.js`, `middleware/apiGate.js`, `lib/roleAccess.js`: every request passes through them. Covered by unit tests and the sweep.
2. The Job table: read or written by jobs, dispatch, operations, quality, material tracking, shipping, order entry, cockpit, planning, print queue and the partner API. Its moves are governed in one place (`lib/workflowRules.js`, `lib/jobHistory.js`) only for the routes that use them; dispatch and operations change related records without those rules (B-011).
3. Order, OrderLine, Coil, Inventory, Shipment, Invoice: the order-to-cash chain. Covered in depth by the simulation and its reconciliation.
4. `services/billing.js`: every money action. Covered by unit tests, the simulation and the sweep.
5. Two stock lists and two order pipelines that do not depend on each other at all (B-009): the risk is that they disagree.

