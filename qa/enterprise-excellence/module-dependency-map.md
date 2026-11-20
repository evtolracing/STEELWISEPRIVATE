# Module dependency map

Generated 2026-11-20 by `qa/tools/excellence-docs.mjs` at commit 77af9b4. Do not edit by hand: change the source and rerun.

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
| Routings and processing recipes | Products, work centers | Jobs, planning |
| Customer specifications | Customers | Jobs |
| Stock items and stock levels | Products, heats, receiving | Reservation, shipping, returns |
| Receiving | Products, heats, purchase orders | Stock |
| Purchase orders and supply position | Suppliers, grades, products | Receiving, stock |
| Interbranch transfers | Stock, branches | Stock, reservation, shipping |
| Second stock list (unit tracking) | None | None |
| Remnants | Stock, work orders (not connected) | Web store |
| Jobs, job board and schedule | Sales orders, routings | Shipping (unfinished jobs hold their lines), quality |
| Coil work orders | Stock | Stock (pieces, scrap, drops) |
| Dispatch, work centers and shop-floor operations | Jobs, staff, maintenance (lockout) | Jobs, time and labor, quality |
| Planning and optimization | Jobs, work centers, routings | Schedule |
| Quality inspections | Jobs | Jobs (packaging or hold), shipping |
| Material tracking, packages and drop tags | Jobs | Shipping |
| Maintenance and assets | Work centers | Scheduling and step start (lockout) |
| Shipping | Sales orders, jobs, stock | Invoices, stock |
| Returns | Shipping, invoices | Stock, credits |
| Documents | Heats, shipments | Customer account pages, partner API |
| Partner API | Sales orders, quotes, shipments, invoices, purchase orders | Outside systems |
| Integrations and scheduled work | Partner API, shipments, invoices, request keys | Company administrators; the host scheduler |
| Freight and logistics planning |  |  |
| Invoices, payments, credits and refunds | Shipping, counter, returns | Customer account pages, partner API |
| Financial ledger | Invoices and payments, stock, receiving, transfers, work orders, shipping | Reports, export to an accounting system, the assistant |
| Sales tax | Tax rates | Orders, invoices |
| Request safeguards | None | Every module |
| AI assistant and voice | Read access to records; outside providers | None |
| Help manual |  |  |
| Background work, notifications, schedules | Integrations and scheduled work |  |
| Operations cockpit and dashboards | Every operational module | None |
| Executive tools |  |  |
| Stop work |  |  |
| Safety, training, contractors, customer quality, supplier quality, production quality, provenance |  |  |

## Tables touched by more than one module

| Table | Modules | Count |
|---|---|---:|
| AuditLog | Sign-in and sessions; Users, roles and branches; Customers; Order entry; Sales orders; Pricing and customer tiers; Counter quick sale; Stock items and stock levels; Purchase orders and supply position; Coil work orders; Quality inspections; Shipping; Returns; Partner API; Operations cockpit and dashboards | 15 |
| Location | Sign-in and sessions; Users, roles and branches; Staff and operators; Settings, tax rates and online settings; Order entry; Web store; Stock items and stock levels; Receiving; Purchase orders and supply position; Interbranch transfers; Dispatch, work centers and shop-floor operations; Shipping | 12 |
| Organization | Customers; RFQs and quotes; Order entry; Counter session flow (older); Web store; Products, grades and heats; Stock items and stock levels; Purchase orders and supply position; Dispatch, work centers and shop-floor operations; Partner API; Operations cockpit and dashboards | 11 |
| Order | RFQs and quotes; Order entry; Sales orders; Counter quick sale; Web store; Purchase orders and supply position; Jobs, job board and schedule; Shipping; Returns; Partner API; Operations cockpit and dashboards | 11 |
| Job | Order entry; Customer specifications; Jobs, job board and schedule; Coil work orders; Dispatch, work centers and shop-floor operations; Planning and optimization; Quality inspections; Material tracking, packages and drop tags; Shipping; Operations cockpit and dashboards | 10 |
| Coil | Sales orders; Stock items and stock levels; Receiving; Interbranch transfers; Coil work orders; Material tracking, packages and drop tags; Shipping; Returns; Operations cockpit and dashboards | 9 |
| OrderLine | Order entry; Sales orders; Customer specifications; Purchase orders and supply position; Jobs, job board and schedule; Coil work orders; Shipping; Returns | 8 |
| Inventory | Sales orders; Stock items and stock levels; Receiving; Interbranch transfers; Coil work orders; Shipping; Returns; Operations cockpit and dashboards | 8 |
| MaterialMovement | Counter quick sale; Products, grades and heats; Stock items and stock levels; Receiving; Interbranch transfers; Shipping; Returns; Operations cockpit and dashboards | 8 |
| WorkCenter | Staff and operators; Jobs, job board and schedule; Dispatch, work centers and shop-floor operations; Planning and optimization; Maintenance and assets; Shipping; Operations cockpit and dashboards | 7 |
| User | Sign-in and sessions; Users, roles and branches; RFQs and quotes; Sales orders; Stock items and stock levels; Jobs, job board and schedule | 6 |
| Product | Order entry; Counter quick sale; Web store; Products, grades and heats; Stock items and stock levels | 5 |
| WorkCenterType | Staff and operators; Jobs, job board and schedule; Dispatch, work centers and shop-floor operations; Quality inspections | 4 |
| Quote | RFQs and quotes; Order entry; Partner API; Operations cockpit and dashboards | 4 |
| Shipment | Sales orders; Shipping; Partner API; Operations cockpit and dashboards | 4 |
| Invoice | Counter quick sale; Shipping; Returns; Partner API | 4 |
| DispatchOperation | Jobs, job board and schedule; Dispatch, work centers and shop-floor operations; Quality inspections; Operations cockpit and dashboards | 4 |
| Operator | Staff and operators; Dispatch, work centers and shop-floor operations; Quality inspections | 3 |
| RFQ | RFQs and quotes; Partner API; Operations cockpit and dashboards | 3 |
| OrderLineAllocation | Sales orders; Stock items and stock levels; Shipping | 3 |
| Grade | Products, grades and heats; Stock items and stock levels; Operations cockpit and dashboards | 3 |
| Heat | Products, grades and heats; Stock items and stock levels; Documents | 3 |
| QCHold | Stock items and stock levels; Returns; Operations cockpit and dashboards | 3 |
| StockTransfer | Stock items and stock levels; Receiving; Interbranch transfers | 3 |
| DispatchJob | Jobs, job board and schedule; Dispatch, work centers and shop-floor operations; Quality inspections | 3 |
| DispatchTimeLog | Staff and operators; Dispatch, work centers and shop-floor operations | 2 |
| CustomerPreference | Customers; Customer specifications | 2 |
| CustomerPricingTier | Customers; Order entry | 2 |
| InvoiceLine | Counter quick sale; Returns | 2 |
| JobInspection | Quality inspections; Material tracking, packages and drop tags | 2 |
| Document | Documents; Partner API | 2 |
| DocumentBlob | Documents; Partner API | 2 |
| WebhookDelivery | Partner API; Integrations and scheduled work | 2 |

## Shared server code and who imports it

| File | Imported by (route files) | Count |
|---|---|---:|
| lib/db.js | aiAssistant.js, analyticsV1.js, assets.js, auth.js, bomV1.js, coils.js, compressionMetrics.js, customers.js, … | 61 |
| lib/numbering.js | intakeOrders.js, inventory.js, invoices.js, jobs.js, maintenanceOrders.js, orders.js, qcRoutes.js, quickSale.js, … | 15 |
| lib/roleStore.js | auth.js, coils.js, dispatchRoutes.js, heats.js, integrations.js, inventory.js, jobs.js, ledger.js, … | 11 |
| lib/roleAccess.js | auth.js, customers.js, grades.js, intakeOrders.js, intakePricing.js, orders.js, overrides.js, pos.js, … | 11 |
| lib/dbText.js | bomV1.js, coils.js, customers.js, intakePricing.js, inventory.js, orderHubStore.js, processingRecipes.js, quickSale.js, … | 10 |
| lib/branchScope.js | auth.js, dispatchRoutes.js, documents.js, intakeOrders.js, inventory.js, ledger.js, purchaseOrders.js, shipments.js | 8 |
| lib/fieldRules.js | assets.js, grades.js, heats.js, maintenanceOrders.js, products.js, workCenters.js, workOrders.js | 7 |
| lib/workflowRules.js | intakeOrders.js, inventory.js, jobs.js, orders.js, returns.js, rfqs.js, shipments.js | 7 |
| services/ledger.js | coils.js, inventory.js, ledger.js, quickSale.js, returns.js, shipments.js | 6 |
| services/webhookService.js | integrations.js, orders.js, carrierRoutes.js, customerRoutes.js, webhookRoutes.js, shipments.js | 6 |
| middleware/partnerAuth.js | adminRoutes.js, carrierRoutes.js, common.js, customerRoutes.js, partnerAuthRoutes.js, supplierRoutes.js | 6 |
| middleware/auth.js | admin.js, auth.js, adminRoutes.js, roles.js, users.js | 5 |
| lib/customerScope.js | auth.js, ecom.js, portal.js, users.js | 4 |
| lib/permissionCatalog.js | auth.js, integrations.js, ledger.js, roles.js | 4 |
| services/intakeCatalogService.js | coils.js, intakePricing.js, inventory.js, products.js | 4 |
| lib/settings.js | compressionMetrics.js, demandShaping.js, onlineSettings.js, operationsRoutes.js | 4 |
| lib/workCenterGuard.js | dispatchRoutes.js, operationsRoutes.js, optimizationV1.js, workCenters.js | 4 |
| lib/creditControl.js | intakeOrders.js, onlineOrders.js, orders.js, quotes.js | 4 |
| lib/billingRules.js | intakeOrders.js, onlineOrders.js, quickSale.js, returns.js | 4 |
| lib/orderTax.js | intakeOrders.js, intakePricing.js, onlineOrders.js, quotes.js | 4 |
| services/billing.js | invoices.js, quickSale.js, returns.js, shipments.js | 4 |
| lib/jobGates.js | jobs.js, materialTrackingRoutes.js, operationsRoutes.js, qcRoutes.js | 4 |
| lib/quoteRules.js | customerRoutes.js, quotes.js, rfqs.js, salesDashboard.js | 4 |
| lib/outbound.js | ai.js, aiAssistant.js, tts.js | 3 |
| services/ai/AIProviderService.js | ai.js, aiAssistant.js, opsCockpit.js | 3 |
| lib/passwords.js | auth.js, adminRoutes.js, users.js | 3 |
| lib/customerPricing.js | ecom.js, intakePricing.js, quickSale.js | 3 |
| lib/lineSpecs.js | intakeOrders.js, quotes.js, rfqs.js | 3 |
| lib/userAdminRules.js | auth.js, users.js | 2 |
| lib/holds.js | coils.js, returns.js | 2 |
| lib/priceRules.js | customers.js, intakePricing.js | 2 |
| lib/workCenterKindRules.js | dispatchRoutes.js, qcRoutes.js | 2 |
| services/dropTagService.js | dropTagRoutes.js, materialTrackingRoutes.js | 2 |
| lib/listing.js | inventory.js, orders.js | 2 |
| lib/stockChanges.js | inventory.js, workOrders.js | 2 |
| services/printAutomationService.js | jobs.js, printQueue.js | 2 |
| lib/jobHistory.js | jobs.js, shipments.js | 2 |
| lib/productionRules.js | operationsRoutes.js, qcRoutes.js | 2 |
| lib/reservationRules.js | orders.js, returns.js | 2 |
| lib/orderCloseout.js | orders.js, returns.js | 2 |
| services/ledgerAssistant.js | aiAssistant.js | 1 |
| lib/assistantInput.js | aiAssistant.js | 1 |
| lib/alerts.js | auth.js | 1 |
| lib/viewScope.js | auth.js | 1 |
| lib/dispatchPlan.js | dispatchRoutes.js | 1 |
| services/dropTagListingService.js | dropTagRoutes.js | 1 |
| services/scanService.js | dropTagRoutes.js | 1 |
| services/templateService.js | dropTagRoutes.js | 1 |
| services/ecomService.js | ecom.js | 1 |
| services/cockpitService.js | executive.js | 1 |
| services/simulationService.js | executive.js | 1 |
| services/forecastService.js | executive.js | 1 |
| services/decisionService.js | executive.js | 1 |
| lib/integrationReport.js | integrations.js | 1 |
| lib/receiving.js | inventory.js | 1 |
| lib/receivingRules.js | inventory.js | 1 |
| lib/transfers.js | inventory.js | 1 |
| lib/costing.js | jobs.js | 1 |
| services/ledgerReports.js | ledger.js | 1 |
| services/ledgerCutover.js | ledger.js | 1 |
| lib/ledgerRules.js | ledger.js | 1 |
| lib/capacityPlan.js | optimizationV1.js | 1 |
| middleware/partnerRateLimit.js | common.js | 1 |
| middleware/requestKeys.js | common.js | 1 |
| services/portalService.js | portal.js | 1 |
| lib/zip.js | portal.js | 1 |
| services/tagRenderer.js | printQueue.js | 1 |
| services/remnantService.js | remnants.js | 1 |
| lib/permissions.js | roles.js | 1 |
| lib/builtinRoleDefaults.js | roles.js | 1 |
| lib/roleEditRules.js | roles.js | 1 |
| services/pricingIntelligenceService.js | salesRoutes.js | 1 |
| lib/shippingDocuments.js | shipments.js | 1 |
| lib/workOrderRules.js | workOrders.js | 1 |

## Highest-risk dependencies

1. `lib/db.js`, `lib/branchScope.js`, `middleware/apiGate.js`, `lib/roleAccess.js`: every request and, since Phase 2, every query on a branch-owned table passes through them. A mistake here hides records from everyone or shows them to everyone. Covered by unit tests, the sweep, the probe and `qa/sim/branch-boundary.mjs` (37 checks).
2. The Job table: read or written by jobs, dispatch, operations, quality, material tracking, shipping, order entry, cockpit, planning, print queue and the partner API. Its moves are governed by `lib/workflowRules.js` and recorded by `lib/jobHistory.js`. Since Phase 2, planning and operations record their moves in the same transaction, completing an operation locks the job, and a status move applies only if the job is still where it was checked (C-005; `qa/sim/phase2-integrity.mjs`). Still outside: the general edit route writes a status unconditionally, and three job routes carry their own status checks (M-017).
3. Order, OrderLine, Coil, Inventory, Shipment, Invoice: the order-to-cash chain. Covered in depth by the simulation and its reconciliation.
4. `services/billing.js`: every money action. Covered by unit tests, the simulation and the sweep.
5. Two stock lists and two order pipelines that do not depend on each other at all (B-009): the risk is that they disagree. Decided by the owner (decision 1). Audited in Phase 3 and not migrated: the live contents must be exported and read first.
6. Shelf stock: the counter quick sale now writes stock levels and movements (B-025), joining receiving, transfer, hold, allocation, dispatch and return receipt as the only writers of stock.
7. `routes/shipments.js` holds dispatch and delivery as private functions; the carrier partner routes re-implemented them and are wrong (C-002).
8. `lib/numbering.js`: every numbered document (orders, shipments, invoices, credit memos, jobs, work orders, quotes, requests, returns) is created through it. Phase 3 found it failed under 80 simultaneous saves and after deleted rows (G-017, fixed). Covered by 9 unit tests and the 80-at-once scenario.
9. `lib/moneyColumns.js` (new in Phase 3): every write to a decimal column passes through it inside the database client, after the branch boundary. A mistake here corrupts amounts everywhere. Covered by 6 unit tests, the residue check in `db-facts` and the exact-cent scenarios.
10. `middleware/requestKeys.js` (new in Phase 3): sits in front of every changing route. It acts only when a request carries an Idempotency-Key. Covered by 3 unit tests and three database scenarios.
11. The order row lock: a reservation, a cancellation and (through conditional updates) a status move now queue on the Order row. Any new code that changes reservations must take the same lock first, or the race of G-004 returns.
12. Foreign keys added in Phase 3 with RESTRICT: an invoiced shipment, a credited invoice, a returned order and an invoiced order line can no longer be deleted. Seed and clean-up scripts must delete children first.
13. `lib/lineSpecs.js` (new in Phase 5): carries the customer's requirements from the request line to the quote line, the order line and the work order. Imported by requests, quotes and order intake. A change here can drop a requirement between steps. Covered by 5 unit tests and the Phase 5 traceability scenarios.
14. `lib/orderTax.js` `sellingBranch()` (Phase 5): decides the branch an order is taxed at and filed under, for quotes, quote acceptance, order intake, Retail POS and web order acceptance. Covered by the Phase 5 tax and branch scenarios and the sweep.
15. `GET /api/orders/intake/branches` (Phase 5): the branch list of order entry, Retail POS and the mobile rep screen. It follows the branch boundary (`branchesOf`). Covered by the API and browser checks.
16. `lib/transfers.js` (new in Phase 6): the only code that sends, receives, settles and calls back a transfer. Used by the stock routes and the old one-item transfer address. Stock in transit is refused by reservations, holds, corrections, work orders and shipping; any new code that changes a balance must refuse it too. Covered by 17 transfer scenarios and seven database checks.
17. `lib/reservationRules.js` (new in Phase 6): decides whether a stock item fits an order line (unit, grade, size, tolerance, owner, in transit). Called wherever a reservation is made. Covered by unit tests and the reservation scenarios.
18. `lib/holds.js` (new in Phase 6): places and releases holds with their reasons for receiving, transfers, returns and the stock routes.
19. `routes/purchaseOrders.js` (new in Phase 6): purchase orders are Orders of type PO. Receiving (`routes/inventory.js`, `lib/receiving.js`) reads the line and writes what was received on it; the supply position reads stock, open purchase orders, open transfers and open order lines.
20. The balance check now includes the in-transit quantity (SQL Editor file 12). Every script that writes `Inventory` directly must keep on hand = available + reserved + on hold + in transit.
21. `lib/jobGates.js` (new in Phase 7): the only code that changes a job's status. It locks the job, applies the move table, the quality gate (no release without a passed inspection) and the open-steps gate, writes the history row, and closes running clocks on a cancel. Called by every status address in `routes/jobs.js`, by `routes/operationsRoutes.js` and by `routes/qcRoutes.js`.
22. `lib/productionRules.js` (new in Phase 7): the state rules of a step and who may run it where (kind of work center, branch, operator, certification, planned order). The planned-order rule reads the setting `production.rules` in `lib/settings.js` (owner decision 8).
23. `lib/dispatchPlan.js` and `lib/capacityPlan.js` (new in Phase 7): the scheduling run and the planner decide in pure functions with unit tests; the routes only read, lock and write. `lib/workCenterGuard.js` answers whether a machine is locked out (maintenance orders, asset status) and validates a work center change; scheduling, the planner and step start all ask it.
24. `lib/branchScope.js` (Phase 7): inspections, time entries and operators are branch-owned. A job is scoped by its order's branch or its work center's branch, so an order sold at one branch can be worked at another.
25. `lib/costing.js` (new, owner decision 9): the only code that turns a purchase price into a unit cost and adds up a job's cost. Called by `lib/receiving.js` at receipt and by `routes/jobs.js`. A change to the unit rules changes the cost of every item received afterwards. Covered by unit tests, group 6 of the Phase 7 scenarios and the Phase 6 receiving scenario.
26. `WorkOrder.jobId` (SQL Editor file 13): ties a coil work order to a job. `lib/costing.js` `jobMaterial` reads it for the job's material and cost; deleting a job clears the link and keeps the work order.
27. `WorkCenterType` carries rules read on every step start (`routes/operationsRoutes.js` `checkWho`: certification required, two steps at once), the labor rate read by job cost, and the checklist read when an inspection is opened (`routes/qcRoutes.js`). The labor rate must never be sent to roles outside `COST_VIEWERS` (`kindForViewer` in `routes/dispatchRoutes.js`).
28. `lib/jobGates.js` `afterProduction` and `inspectionRequiredFor` (owner decision 9): every address that takes a job out of production asks here whether it goes to inspection. `BomRecipe.inspectionRequired` is the only exception. A new address that moves a job must go through `changeJobStatusTx` or the rule is bypassed.
29. `lib/shippingDocuments.js` (new in Phase 8): the only reader behind the pick list, the packing list and the bill of lading. The shipment screen, the print queue and the papers all take its answer, so they cannot disagree. It fills in nothing; a missing fact is named in `missing`.
30. `lib/orderCloseout.js` (new in Phase 8): what stands between an order and closed (`closeoutPosition`, pure), the list of orders not closed, and an order's cost and margin. It stores nothing. It reads shipments, invoices, returns, jobs, reservations and stock movements, so a change to any of those states must keep its rule in step.
31. `lib/costView.js` (new in Phase 8): one guard on every API answer removes stock cost for readers who are not cost viewers (`lib/roleAccess.js` `COST_VIEWERS`). A new field that carries cost must be added to its list, and a new role that should see cost to `COST_VIEWERS`.
32. `routes/shipments.js` dispatch writes `MaterialMovement.unitCost` (SQL Editor file 14) from the stock item at the moment it leaves; `lib/orderCloseout.js` `orderCost` reads it. A new path that takes stock out for a sale must write it too.
33. `lib/branchScope.js` (Phase 8): a shipment is seen by the dock it leaves from and by the branch that sold the order; only the dock changes it (`routes/shipments.js` `ownDock`). A print job belongs to a branch (`PrintQueueJob.locationId`, file 14).
34. `lib/numbering.js` `isOverlap` (Phase 8): the retry recognises a database overlap from Prisma's own queries (P2034) and from raw statements (P2010 with 40001 or 40P01). Any new raw statement inside a serializable save is covered by it. A deadlock met by one of the client's own statements arrives with no code at all, only the database's words; that third form is recognised too (N-029), and the order save in `routes/orders.js` runs under the same retry because cancelling an order and dispatching its shipment take the same rows in opposite order.
35. `services/dropTagService.js` (Phase 8): every package and tag step locks the package row and moves a tag only from the state the person saw. Package, tag and listing numbers come from the document counter (`nextNumber`).

