# Ticket-to-functionality traceability

There are no ticket files in the repository, so each commit is treated as one ticket. Commits #1–#28 are squashed pull requests; older commits came before the PR workflow. Requested scope is taken from the commit or PR title; "implemented" is what the diff touched.

Commits: 193. Commits that changed the database schema: 56. Commits that added tests: 12.

| Commit | Date | Ticket (title) | Files | Schema | API areas | UI areas | Tests added |
|---|---|---|---:|:-:|---|---|---:|
| 805bc0b | 2026-11-13 | Operations cockpit counts in the database instead of loading whole tables | 16 |  | api:opsCockpit |  | 15 |
| ec86163 | 2026-11-13 | Phase 2 workstream 1: bounded lists, indexes, value checks, request tracing, dependency fixes, reports | 41 | yes | api:package-lock.json, api:app, api:requestLog, api:safeErrors, api:analyticsV1, api:jobs, api:materialTrackingRoutes, api:shippingV1 | ui:package-lock.json, ui:dashboard | 27 |
| a775ff5 | 2026-11-13 | Sales tax rates screen, quick-sale and quote simulations, money race probes, QA documents | 29 |  | api:app, api:roleAccess, api:taxRates, api:roleAccess.test | ui:components, ui:help, ui:Admin, ui:router | 21 |
| 35fb137 | 2026-11-13 | Uploaded files are kept in the database when the host has no disk | 1 |  | api:documents |  | 0 |
| 55dd63a | 2026-11-13 | Jobs and shipments are tied; shop-floor Ship makes the shipment | 6 |  | api:workflowRules, api:jobs, api:materialTrackingRoutes, api:shipments, api:workflowRules.test |  | 2 |
| a4fd843 | 2026-11-13 | Division logins see only their own division | 5 |  | api:portalService |  | 4 |
| bc09fcd | 2026-11-13 | Staff can only change the records their department owns | 4 |  | api:roleAccess, api:roleAccess.test |  | 3 |
| 8fa89b1 | 2026-11-13 | Web checkout: server price, price level and tax are what get saved | 6 |  | api:ecomService, api:portalService |  | 4 |
| a81a1ad | 2026-11-13 | Quotes and RFQs: one working implementation with a real screen | 17 |  | api:db, api:quoteRules, api:safeErrors, api:quotes, api:rfqs, api:salesRoutes, api:quoteRules.test, api:safeErrors.test | ui:components, ui:Pricing, ui:Sales, ui:router | 2 |
| ec13ee7 | 2026-11-13 | Counter quick sale saved as a real sale; invoices and returns pages | 15 |  | api:app, api:pos, api:quickSale, api:returns | ui:components, ui:Orders, ui:POSPage, ui:router | 0 |
| f562b37 | 2026-11-13 | Invoices, payments, credit memos and customer returns | 12 | yes | api:app, api:billingRules, api:invoices, api:orders, api:returns, api:shipments, api:billing, api:billingRules.test |  | 3 |
| 3f3c799 | 2026-11-13 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| f3db70a | 2026-11-13 | Fix open audit items: numbering, bad filters, checkout price check, CI | 22 |  | api:db, api:requestContext, api:safeErrors, api:maintenanceOrders, api:qcRoutes, api:staff, api:workOrders, api:ecomService |  | 13 |
| 9967c56 | 2026-11-12 | System audit: simulation suite and core workflow repairs (#29) | 59 | yes | api:package.json, api:app, api:numbering, api:workflowRules, api:safeErrors, api:documents, api:intakeOrders, api:inventory | ui:components, ui:partnerApi | 37 |
| 650a0af | 2026-11-13 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 9bb89da | 2026-11-13 | Audit, simulation suite and core workflow repairs | 59 | yes | api:package.json, api:app, api:numbering, api:workflowRules, api:safeErrors, api:documents, api:intakeOrders, api:inventory | ui:components, ui:partnerApi | 37 |
| d23fb7a | 2026-11-11 | Show each role only its own chapters of the help manual (#28) | 4 |  |  | ui:components, ui:help, ui:Help | 0 |
| a440fad | 2026-11-12 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| ad19d9d | 2026-11-12 | Show each role only its own chapters of the help manual | 4 |  |  | ui:components, ui:help, ui:Help | 0 |
| a725ec5 | 2026-11-11 | Fix empty customer list on the user form (#27) | 2 |  | api:users | ui:Admin | 0 |
| 4cf5535 | 2026-11-12 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 19d849a | 2026-11-12 | Fix empty customer list on the user form | 2 |  | api:users | ui:Admin | 0 |
| 0bfb7b5 | 2026-11-11 | Tie customer logins to one customer account (#26) | 14 | yes | api:customerScope, api:roleAccess, api:apiGate, api:auth, api:ecom, api:portal, api:users, api:portalService | ui:contexts, ui:Admin | 0 |
| ad9302b | 2026-11-12 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 59d6f01 | 2026-11-12 | Tie customer logins to one customer account | 14 | yes | api:customerScope, api:roleAccess, api:apiGate, api:auth, api:ecom, api:portal, api:users, api:portalService | ui:contexts, ui:Admin | 0 |
| 65bd1f9 | 2026-11-11 | Limit pages and APIs by role (#25) | 6 |  | api:roleAccess, api:apiGate | ui:components, ui:config, ui:router | 0 |
| 34aa6db | 2026-11-12 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 9e2586c | 2026-11-12 | Limit pages and APIs by role | 6 |  | api:roleAccess, api:apiGate | ui:components, ui:config, ui:router | 0 |
| 6efa8bd | 2026-11-10 | Fix store cart totals, product sizing, and logout on refresh (#24) | 9 |  |  | ui:contexts, ui:hooks, ui:Ecommerce | 0 |
| 55d1bb4 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 327689d | 2026-11-11 | Fix store cart totals, product sizing, and logout on refresh | 9 |  |  | ui:contexts, ui:hooks, ui:Ecommerce | 0 |
| 639d098 | 2026-11-10 | Require sign-in on every API route (#23) | 5 |  | api:app, api:apiGate | ui:api, ui:src, ui:printQueueApi | 0 |
| a264663 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| fab95cf | 2026-11-11 | Require sign-in on every API route | 5 |  | api:app, api:apiGate | ui:api, ui:src, ui:printQueueApi | 0 |
| 0b37091 | 2026-11-10 | Real analytics: online settings, demand shaping, compression metrics (#22) | 16 | yes | api:app, api:settings, api:compressionMetrics, api:demandShaping, api:onlineSettings, api:demo | ui:hooks, ui:Executive, ui:Orders, ui:compressionMetricsApi, ui:demandShapingApi, ui:onlineEventsApi | 0 |
| b9615ce | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 5ae81cb | 2026-11-11 | Real analytics: online settings, demand shaping, compression metrics | 16 | yes | api:app, api:settings, api:compressionMetrics, api:demandShaping, api:onlineSettings, api:demo | ui:hooks, ui:Executive, ui:Orders, ui:compressionMetricsApi, ui:demandShapingApi, ui:onlineEventsApi | 0 |
| af6af20 | 2026-11-10 | Real processing recipes and routing templates (#21) | 8 | yes | api:app, api:processingRecipes, api:demo | ui:processingRecipesApi | 0 |
| 94773d3 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| c02c8cc | 2026-11-11 | Real processing recipes and routing templates | 8 | yes | api:app, api:processingRecipes, api:demo | ui:processingRecipesApi | 0 |
| 0989591 | 2026-11-10 | Real customer portal: My Orders, account orders, shipments and documents (#20) | 13 |  | api:app, api:zip, api:intakeOrders, api:portal, api:demo, api:ecomService, api:portalService | ui:contexts, ui:hooks, ui:Ecommerce, ui:customerAccountApi, ui:customerOrdersApi | 0 |
| b19e64a | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| c735024 | 2026-11-11 | Real customer portal: My Orders, account orders, shipments and documents | 13 |  | api:app, api:zip, api:intakeOrders, api:portal, api:demo, api:ecomService, api:portalService | ui:contexts, ui:hooks, ui:Ecommerce, ui:customerAccountApi, ui:customerOrdersApi | 0 |
| 724f614 | 2026-11-10 | Real online store: catalog, pricing, cart and checkout (#19) | 14 | yes | api:app, api:ecom, api:onlineOrders, api:demo, api:ecomService | ui:adminCatalogApi, ui:cartApi, ui:checkoutApi, ui:ecomCatalogApi, ui:ecomPricingApi | 0 |
| 518739c | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| e84d215 | 2026-11-11 | Real online store: catalog, pricing, cart and checkout | 14 | yes | api:app, api:ecom, api:onlineOrders, api:demo, api:ecomService | ui:adminCatalogApi, ui:cartApi, ui:checkoutApi, ui:ecomCatalogApi, ui:ecomPricingApi | 0 |
| 88eaaa5 | 2026-11-10 | Real remnant inventory and aging-based remnant pricing (#18) | 10 | yes | api:app, api:remnants, api:demo, api:remnantService | ui:remnantInventoryApi, ui:remnantPricingApi | 0 |
| 1802584 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 38575e6 | 2026-11-11 | Real remnant inventory and aging-based remnant pricing | 10 | yes | api:app, api:remnants, api:demo, api:remnantService | ui:remnantInventoryApi, ui:remnantPricingApi | 0 |
| 1249c9d | 2026-11-10 | Real online order inbox backed by the database (#17) | 9 | yes | api:app, api:intakeOrders, api:onlineOrders, api:demo | ui:intakeOnlineOrdersApi | 0 |
| 19bb6fd | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 60aa26a | 2026-11-11 | Real online order inbox backed by the database | 9 | yes | api:app, api:intakeOrders, api:onlineOrders, api:demo | ui:intakeOnlineOrdersApi | 0 |
| 31a0dd7 | 2026-11-10 | Real pricing, tax and processing menus for order intake (#16) | 11 | yes | api:app, api:intakePricing, api:intakeProcessing, api:demo, api:intakeCatalogService | ui:intakePricingApi, ui:intakeProcessingApi | 0 |
| 021b4ef | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| b23f597 | 2026-11-11 | Real pricing, tax and processing menus for order intake | 11 | yes | api:app, api:intakePricing, api:intakeProcessing, api:demo, api:intakeCatalogService | ui:intakePricingApi, ui:intakeProcessingApi | 0 |
| 78cb1d2 | 2026-11-10 | Real product and stock search for order intake; seed demo data in parts (#15) | 12 | yes | api:admin, api:inventory, api:products, api:demo, api:intakeCatalogService | ui:intakeInventoryApi, ui:intakeProductsApi | 0 |
| 0bd5354 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 07275d8 | 2026-11-11 | Real product and stock search for order intake; seed demo data in parts | 12 | yes | api:admin, api:inventory, api:products, api:demo, api:intakeCatalogService | ui:intakeInventoryApi, ui:intakeProductsApi | 0 |
| 61a621a | 2026-11-10 | Save the print queue in the database (#14) | 5 | yes | api:printQueue, api:printAutomationService |  | 0 |
| ff7e14c | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 0b8c580 | 2026-11-11 | Save the print queue in the database | 5 | yes | api:printQueue, api:printAutomationService |  | 0 |
| 893f4c3 | 2026-11-10 | Save v1 inventory (RFID, etched IDs, transfers) in the database (#13) | 7 | yes | api:inventoryV1, api:inventoryV1Store, api:demo |  | 0 |
| eaf47f1 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| c1aa9d8 | 2026-11-11 | Save v1 inventory (RFID, etched IDs, transfers) in the database | 7 | yes | api:inventoryV1, api:inventoryV1Store, api:demo |  | 0 |
| 7f53311 | 2026-11-10 | Run the schedule optimizer on real jobs and work centers (#12) | 3 |  | api:optimizationV1, api:demo |  | 0 |
| 5adce37 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 81785f3 | 2026-11-11 | Run the schedule optimizer on real jobs and work centers | 3 |  | api:optimizationV1, api:demo |  | 0 |
| a0bf3cd | 2026-11-10 | Save the exceptions feed in the database (#11) | 6 | yes | api:eventsV1, api:demo |  | 0 |
| f337c50 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 5dc2817 | 2026-11-11 | Save the exceptions feed in the database | 6 | yes | api:eventsV1, api:demo |  | 0 |
| 9b30977 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| c8ac84a | 2026-11-10 | Let the app through RLS with a policy (#10) | 4 |  | api:sql-editor-bundle |  | 0 |
| aff68fa | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 9e70b8e | 2026-11-11 | Let the app through RLS with a policy instead of changing table owners | 4 |  | api:sql-editor-bundle |  | 0 |
| 5b43b9c | 2026-11-10 | Fix RLS blocking the app on SQL Editor-created tables (#9) | 3 |  | api:sql-editor-bundle |  | 0 |
| e69a71e | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 05a1d93 | 2026-11-11 | Give SQL Editor-created tables the app's owner so RLS doesn't block it | 3 |  | api:sql-editor-bundle |  | 0 |
| 355204c | 2026-11-10 | Save pipeline runs and dispatch divisions in the database (#8) | 8 | yes | api:orchestrator, api:dispatchRoutes, api:opsCockpit, api:pipelineRoutes |  | 0 |
| 2dbe9b2 | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| d08602d | 2026-11-11 | Save pipeline runs and dispatch divisions in the database | 8 | yes | api:orchestrator, api:dispatchRoutes, api:opsCockpit, api:pipelineRoutes |  | 0 |
| 4586388 | 2026-11-10 | Save Stop-Work events in the database (#7) | 5 | yes | api:stopWork, api:stopWorkStore |  | 0 |
| f02a41b | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| 7974f52 | 2026-11-11 | Save Stop-Work events, audit trail, clearance steps and evidence | 5 | yes | api:stopWork, api:stopWorkStore |  | 0 |
| 71b194a | 2026-11-10 | Save POS counter sessions in the database (#6) | 8 | yes | api:pos |  | 0 |
| 3c147eb | 2026-11-11 | Merge old branch history (already in main via squash) | 0 |  |  |  | 0 |
| e19e0ed | 2026-11-11 | Save POS counter sessions in the database | 8 | yes | api:pos |  | 0 |
| 6eb229d | 2026-11-10 | Save OrderHub (order intake) data in the database (#5) | 12 | yes | api:app, api:handlers, api:aiOrderHubRoutes, api:ingestRoutes, api:orderHubRoutes, api:orderHubStore, api:demo |  | 0 |
| 8f10636 | 2026-11-11 | Save OrderHub contacts, RFQs, quotes, orders and jobs in the database | 12 | yes | api:app, api:handlers, api:aiOrderHubRoutes, api:ingestRoutes, api:orderHubRoutes, api:orderHubStore, api:demo |  | 0 |
| a573a93 | 2026-11-11 | Merge main after PR #4 | 0 |  |  |  | 0 |
| 888141b | 2026-11-10 | Make logout, login errors and password change work (#4) | 5 |  | api:auth | ui:api, ui:components, ui:hooks | 0 |
| 171289b | 2026-11-10 | Make logout, login errors and password change work | 5 |  | api:auth | ui:api, ui:components, ui:hooks | 0 |
| 820c574 | 2026-11-10 | Merge main after PR #3 | 0 |  |  |  | 0 |
| e75d965 | 2026-11-10 | Phase 1b: customer divisions, ship-tos and executive data in the database (#3) | 17 | yes | api:package.json, api:sql-editor-bundle, api:app, api:admin, api:pos, api:demo, api:decisionService, api:forecastService |  | 0 |
| 2febbf7 | 2026-11-10 | Turn on Row Level Security for every table in SQL Editor updates | 3 |  | api:sql-editor-bundle |  | 0 |
| 159c5fa | 2026-11-10 | Phase 1b: customer divisions, ship-tos and executive data in the database | 17 | yes | api:package.json, api:sql-editor-bundle, api:app, api:admin, api:pos, api:demo, api:decisionService, api:forecastService |  | 0 |
| d372975 | 2026-11-10 | Merge main after PR #2 | 0 |  |  |  | 0 |
| 1f6c950 | 2026-11-10 | Phase 1a: one MySQL-ready schema with a baseline migration (#2) | 18 | yes | api:package.json, api:dbText, api:bomV1, api:customers, api:inventory, api:staff, api:users, api:webhookService |  | 0 |
| 8dedbc5 | 2026-11-10 | Add a one-paste Supabase SQL Editor version of the database upgrade | 2 |  |  |  | 0 |
| 407f245 | 2026-11-10 | Join already-merged Phase 0 branch history | 0 |  |  |  | 0 |
| a9d3808 | 2026-11-10 | Phase 1a: one MySQL-ready schema with a baseline migration | 17 | yes | api:package.json, api:dbText, api:bomV1, api:customers, api:inventory, api:staff, api:users, api:webhookService |  | 0 |
| cc13a6f | 2026-11-10 | Phase 0: security hardening and repo cleanup (#1) | 52 |  | api:.env.example, api:check-db.mjs, api:check-schema, api:fix-permissions, api:package-lock.json, api:package.json, api:app, api:env | ui:.env.example, ui:apps, ui:config, ui:hooks, ui:screens, ui:aiService, ui:mapService | 0 |
| 3db9f57 | 2026-11-10 | Show which settings are missing when the API fails to start | 1 |  |  |  | 0 |
| 3b1c3ca | 2026-11-10 | Health check reports database connectivity | 1 |  | api:app |  | 0 |
| e6f664b | 2026-11-10 | Phase 0: security hardening and repo cleanup | 52 |  | api:.env.example, api:check-db.mjs, api:check-schema, api:fix-permissions, api:package-lock.json, api:package.json, api:app, api:env | ui:.env.example, ui:apps, ui:config, ui:hooks, ui:screens, ui:aiService, ui:mapService | 0 |
| a92396a | 2026-02-25 | Merge remote changes and resolve conflicts | 0 |  |  |  | 0 |
| a092628 | 2026-02-25 | Update project files and configuration | 30 |  | api:.env.example, api:check-schema, api:fix-permissions, api:package-lock.json, api:package.json, api:env, api:supabaseClient, api:db | ui:.env.example, ui:package.json, ui:config | 0 |
| 65f679e | 2026-02-24 | chore: update Node engine to >=22.x | 1 |  |  |  | 0 |
| a462ba8 | 2026-02-24 | vercel repair | 3 |  |  |  | 0 |
| 27475d7 | 2026-02-24 | fix: replace hardcoded localhost:3001 with relative /api URLs for Vercel deployment | 45 |  |  | ui:components, ui:hooks, ui:Admin, ui:Customers, ui:adminCatalogApi, ui:aiConsoleApi, ui:bomApi, ui:branchComparisonApi | 0 |
| 5d7d34f | 2026-02-24 | fix: skip filesystem operations on Vercel (uploads dir, multer) | 2 |  | api:app, api:documents |  | 0 |
| 861d3fa | 2026-02-24 | fix: install vite devDeps on Vercel (--include=dev) | 2 |  |  |  | 0 |
| 9ec8b6e | 2026-02-24 | fix: use node build script via vercel-build npm script | 1 |  |  |  | 0 |
| ddc1657 | 2026-02-24 | fix: use node build script for Vercel builds | 2 |  |  |  | 0 |
| 557e2e0 | 2026-02-24 | fix: Vercel deployment - pin Node 20.x, fix prisma deps, add debug handler, clean env vars | 12 |  | api:package-lock.json, api:package.json | ui:package-lock.json, ui:package.json | 0 |
| ea48db8 | 2026-02-24 | deploy | 32 | yes | api:app, api:partnerAuth, api:partnerRateLimit, api:handlers, api:orchestrator, api:partner, api:supabaseSeed, api:server |  | 0 |
| 011d0d5 | 2026-02-18 | feat: automated print queue engine with manual print & reprint | 11 |  | api:jobs, api:opsCockpit, api:printQueue, api:server, api:printAutomationService, api:tagRenderer | ui:components, ui:OpsCockpit, ui:opsCockpitApi, ui:printQueueApi | 0 |
| 5aee0b9 | 2026-02-18 | feat: spec inheritance system  Customer  Quote  Order  Job with per-level overrides | 8 | yes | api:orderHubStore, api:specInheritance, api:server | ui:apps, ui:components | 0 |
| f3f5027 | 2026-02-17 | feat: per-dimension tolerances (thickness, length, width) on customer preferences | 3 | yes |  | ui:Customers, ui:customerPreferencesApi | 0 |
| 4151ddf | 2026-02-17 | feat: Customer Preferences system + Steel Outlet rename | 10 | yes | api:customers | ui:components, ui:help, ui:hooks, ui:Customers, ui:Ecommerce, ui:customerPreferencesApi, ui:ecomCatalogApi | 0 |
| dfa4e6b | 2026-02-17 | Wire Asset Registry to real database, remove all mock data | 4 |  | api:assets, api:server | ui:api, ui:Maintenance | 0 |
| 8da42fc | 2026-02-17 | feat: wire Work Order Center to real database (remove all mock data) | 4 |  | api:maintenanceOrders, api:server | ui:api, ui:Maintenance | 0 |
| bbbbea2 | 2026-02-17 | fix: show selected work center as read-only in Step 3 instead of duplicate dropdown | 1 |  |  | ui:Maintenance | 0 |
| 40ca649 | 2026-02-17 | fix: replace Asset Number text input with work center dropdown in Create Work Order step 0 | 1 |  |  | ui:Maintenance | 0 |
| df62d60 | 2026-02-17 | feat: add Work Center dropdown to maintenance Create Work Order dialog | 1 |  |  | ui:Maintenance | 0 |
| 0ab2d22 | 2026-02-17 | fix: add PATCH /jobs/:id/status endpoint, fix DOM nesting warning | 2 |  | api:jobs | ui:ProductionQuality | 0 |
| d0a286a | 2026-02-17 | refactor: restructure sidebar to follow workflow order, remove duplicates | 2 |  |  | ui:components, ui:router | 0 |
| b56efed | 2026-02-17 | cleanup: remove old Packaging/ and DropTags/ pages, legacy routes, and unused imports | 19 |  |  | ui:components, ui:Customers, ui:DropTags, ui:MaterialTracking, ui:Packaging, ui:router | 0 |
| 344e40f | 2026-02-17 | feat: unify Packaging, Drop Tag Engine, and Chain of Custody into Material Tracking module | 10 |  | api:materialTrackingRoutes, api:server | ui:api, ui:components, ui:MaterialTracking, ui:router | 0 |
| 16fc3e6 | 2026-02-17 | fix: consolidate packaging pages - wire PackagingQueue to real Supabase data, remove duplicate PackagingPage | 4 |  |  | ui:components, ui:Packaging, ui:PackagingPage, ui:router | 0 |
| c639588 | 2026-02-17 | fix: Packaging queue now fetches real jobs from API instead of mock data | 1 |  |  | ui:PackagingPage | 0 |
| 935e2a6 | 2026-02-17 | feat: QC Inspection Module  production-ready job quality control | 9 | yes | api:operationsRoutes, api:qcRoutes, api:server | ui:api, ui:components, ui:QC, ui:router | 0 |
| bb1a151 | 2026-02-16 | feat: Persist dispatch data to Prisma/Supabase | 16 | yes | api:dispatchRoutes, api:intakeOrders, api:jobs, api:operationsRoutes, api:staff, api:server | ui:api, ui:apps, ui:components, ui:Admin, ui:ModernOrderBoardPage, ui:router, ui:jobsApi | 0 |
| 303a1bb | 2026-02-14 | Rewire shop floor to use Supabase data, clean up seed jobs, renumber jobs sequentially | 14 |  | api:dispatchData, api:dispatchRoutes, api:jobs, api:supabaseSeed | ui:apps, ui:components, ui:constants, ui:OrderBoardPage, ui:dispatchApi, ui:jobsApi | 0 |
| 28bc80f | 2026-02-10 | Update .gitignore for Supabase temp files and update config | 5 |  |  |  | 0 |
| 802aa1d | 2026-02-10 | Complete order intake workflow fixes | 19 | yes | api:coils, api:customers, api:jobs, api:supabaseSeed, api:server | ui:apps, ui:components, ui:Ecommerce, ui:ModernOrderBoardPage, ui:Orders, ui:Units, ui:intakeCustomersApi, ui:intakeOrdersApi | 0 |
| 6e45584 | 2026-02-10 | Fix work order creation and remove auto-split shipment functionality | 2 |  | api:intakeOrders | ui:Orders | 0 |
| c327e79 | 2026-02-09 | feat: add Documents tab with upload to ProductDetailPage | 1 |  |  | ui:Ecommerce | 0 |
| 1b60171 | 2026-02-09 | feat: add document upload to Customers & Suppliers pages | 2 |  |  | ui:Customers, ui:SQM | 0 |
| ca06799 | 2026-02-09 | feat: add Upload MTR button and dialog to HeatListPage | 1 |  |  | ui:Heats | 0 |
| f6895ec | 2026-02-09 | feat: add file upload infrastructure and wire uploads across all pages | 19 |  | api:documents, api:server | ui:api, ui:apps, ui:components, ui:help, ui:CustomerQuality, ui:Ecommerce, ui:Heats, ui:SQM | 0 |
| 5db3d1c | 2026-02-08 | feat: complete exhaustive instruction manual covering all 37 sidebar modules | 3 |  |  | ui:components, ui:help, ui:Help | 0 |
| e75b029 | 2026-02-08 | feat: add in-app instruction manual with per-module step-by-step guides | 10 |  |  | ui:components, ui:help, ui:Admin, ui:Help, ui:router | 0 |
| c328b85 | 2026-02-07 | Fix session context null safety in e-commerce pages | 6 |  |  | ui:Ecommerce | 0 |
| ce2c3ca | 2026-02-07 | fix: add null safety for session.locationId in SearchResultsPage | 1 |  |  | ui:Ecommerce | 0 |
| bf9fd1a | 2026-02-07 | fix: add null safety for session.accountType in ShopHomePage | 1 |  |  | ui:Ecommerce | 0 |
| ff3c205 | 2026-02-07 | fix: add null safety check for session.locationId in ShopHomePage | 1 |  |  | ui:Ecommerce | 0 |
| 800f442 | 2026-02-07 | feat: add sidebar to POS page by moving routes into AppLayout | 3 |  |  | ui:POSPage, ui:router, ui:screens | 0 |
| 52cbb68 | 2026-02-07 | fix: implement Prisma singleton to prevent Supabase connection pool exhaustion | 27 |  | api:db, api:aiAssistant, api:analyticsV1, api:auth, api:bomV1, api:coils, api:customers, api:dashboard | ui:inventoryApi | 0 |
| 94754e9 | 2026-02-07 | feat: enterprise customer account views  multi-branch orders, shipments, documents | 9 |  |  | ui:components, ui:hooks, ui:Ecommerce, ui:router, ui:customerAccountApi | 0 |
| b3c4dd8 | 2026-02-07 | feat: sales rep mobile mode - optimized flows for phones/tablets | 10 |  |  | ui:components, ui:hooks, ui:MobileRep, ui:router | 0 |
| 864a145 | 2026-02-07 | feat: demand shaping suggestions - reduce peaks without saying no | 9 |  |  | ui:components, ui:hooks, ui:Commercial, ui:Ecommerce, ui:Orders, ui:router, ui:demandShapingApi | 0 |
| dc7a866 | 2026-02-07 | feat: customer preference memory  remember every customer like a great CSR | 8 |  |  | ui:components, ui:contexts, ui:hooks, ui:Customers, ui:Orders, ui:router, ui:customerPreferencesApi | 0 |
| 0371427 | 2026-02-07 | feat: quote-to-order compression metrics dashboard | 4 |  |  | ui:components, ui:Executive, ui:router, ui:compressionMetricsApi | 0 |
| 77de21b | 2026-02-07 | feat: processing recipes & time standards library | 9 |  |  | ui:components, ui:Admin, ui:Ecommerce, ui:Orders, ui:router, ui:processingRecipesApi, ui:promiseApi, ui:timeEstimationHelper | 0 |
| 44a6f61 | 2026-02-07 | feat: remnants as first-class inventory + CSR overrides integration | 18 |  |  | ui:components, ui:Admin, ui:Ecommerce, ui:Orders, ui:router, ui:overrideApi, ui:remnantInventoryApi, ui:remnantPricingApi | 0 |
| 3a76755 | 2026-02-07 | feat: add partial fulfillment, split shipments, branch fulfillment, cutoff clock, e-commerce, order intake, AI assistant, and voice TTS | 85 |  | api:package-lock.json, api:package.json, api:supabaseClient, api:aiAssistant, api:customers, api:tts, api:server, api:ai | ui:package-lock.json, ui:package.json, ui:src, ui:components, ui:contexts, ui:hooks, ui:Customers, ui:Ecommerce | 0 |
| 9414a29 | 2026-02-05 | feat: Alro Board Demo - guided tour with exec pitch document | 5 |  |  | ui:components, ui:contexts | 0 |
| 588dca4 | 2026-02-05 | feat: External Partner API Layer - OAuth2 auth, rate limiting, webhooks, admin UI | 22 | yes | api:partnerAuth, api:partnerRateLimit, api:partner, api:server, api:webhookService | ui:components, ui:DropTags, ui:Partners, ui:router, ui:partnerApi | 0 |
| 0434ee6 | 2026-02-05 | refactor: Migrate to Supabase standard migration format | 5 | yes |  |  | 0 |
| a012843 | 2026-02-05 | feat: Add Drop Tag Engine module - Complete drop tag lifecycle from production to delivery | 19 | yes | api:dropTagRoutes, api:server, api:dropTagListingService, api:dropTagService, api:scanService, api:templateService | ui:components, ui:DropTags, ui:router | 0 |
| 8d51ddd | 2026-02-05 | Add Executive Cockpit, Sales/Pricing, Packaging, Freight, Maintenance, Training modules and collapsible sidebar | 71 | yes | api:executiveRoutes, api:cockpitService, api:decisionService, api:forecastService, api:simulationService, api:executive, api:salesRoutes, api:server | ui:components, ui:ContractorPortal, ui:CustomerQuality, ui:Executive, ui:Freight, ui:Maintenance, ui:Packaging, ui:ProductionQuality | 0 |
| ef54982 | 2026-02-04 | server files | 6 |  | api:supabaseSeed, api:server, api:test-server | ui:components | 0 |
| 6eaae4f | 2026-02-04 | schema | 4 | yes | api:stopWork |  | 0 |
| 2373fba | 2026-02-04 | SAFETY - Stop-Work Authority System | 4 |  |  |  | 0 |
| 9ce8a33 | 2026-02-04 | safety/stopwork | 24 |  | api:stopWork, api:server | ui:package.json, ui:apps, ui:components, ui:router | 0 |
| 7d62e72 | 2026-02-03 | safety | 5 |  |  |  | 0 |
| dffe16f | 2026-02-03 | user roles | 20 | yes | api:inventory, api:users, api:server | ui:api, ui:apps, ui:components, ui:Admin, ui:ReceivingPage, ui:Units, ui:router | 0 |
| f309fcb | 2026-02-03 | flows | 13 | yes | api:check-db.mjs, api:package-lock.json, api:aiDecisionEngine, api:handlerRegistry, api:handlers, api:index, api:orchestrator, api:bomV1 |  | 0 |
| 078aa64 | 2026-01-21 | Merge branch 'main' of https://github.com/evtolracing/STEELWISEPRIVATE | 0 |  |  |  | 0 |
| 72745ba | 2026-01-21 | changes doc | 2 |  |  |  | 0 |
| 2f9fddb | 2026-01-21 | feat: OrderHub MVP - centralized store, RFQ/Quote/Order pipeline, AI parsing, n8n ingest endpoint | 26 |  | api:aiOrderHubRoutes, api:ingestRoutes, api:initOrderHubData, api:orderHubRoutes, api:orderHubStore, api:server | ui:apps, ui:components, ui:WorkOrders, ui:router, ui:aiOrderHubApi, ui:contactApi, ui:orderApi, ui:quoteApi | 0 |
| 7d0ec9a | 2026-01-20 | feat: Add modern UI styling, dispatch engine, shop floor queue, and time tracking | 37 |  | api:dispatchData, api:dispatchRoutes, api:jobs, api:operationsRoutes, api:server | ui:apps, ui:components, ui:constants, ui:Dashboard, ui:Heats, ui:JobDetailPage, ui:ModernOrderBoardPage, ui:OpsCockpit | 0 |
| 0db6ac7 | 2026-01-20 | feat: enable job card editing and drag-drop with database integration | 8 |  |  | ui:apps, ui:components, ui:constants, ui:OrderBoardPage | 0 |
| 81f91f9 | 2026-01-19 | feat: Add role-based dashboard engine with real API services | 33 |  | api:DEEPSEEK_SETUP.md, api:analyticsV1, api:eventsV1, api:jobs, api:shippingV1, api:server, api:ai, api:test-ai-providers | ui:apps, ui:components, ui:dashboard, ui:OrderBoardPage, ui:router, ui:aiConsoleApi, ui:exceptionsApi, ui:forecastApi | 0 |
| a4b1fe4 | 2026-01-18 | routing | 10 | yes | api:optimizationV1, api:server | ui:apps, ui:components, ui:router, ui:optimizationApi | 0 |
| fa6f3e8 | 2026-01-18 | Add BOM Recipes module with workflow lifecycle, versioning, and matching | 12 |  | api:bomV1, api:server | ui:apps, ui:components, ui:router, ui:screens, ui:bomApi | 0 |
| 90ebd2d | 2026-01-18 | Add RFID + Etched ID support to inventory module, Ops Cockpit, and fix production imports | 17 |  | api:inventoryV1, api:server | ui:apps, ui:components, ui:OpsCockpit, ui:router, ui:inventoryAiApi, ui:inventoryApi | 0 |
| 0c9f3f0 | 2026-01-18 | datasetup | 33 |  |  | ui:package.json, ui:components, ui:ReceivingPage, ui:ShippingDeskPage, ui:router, ui:screens, ui:aiService, ui:mapService | 0 |
| 08dc4b1 | 2026-01-18 | Archive old design files and add documentation restructure summary | 80 |  |  |  | 0 |
| 5a9f311 | 2026-01-18 | Consolidate documentation into docs/ directory with comprehensive guides | 9 |  |  |  | 0 |
| 79890a1 | 2026-01-18 | Add implementation summary and quick start guide | 1 |  |  |  | 0 |
| d266e76 | 2026-01-18 | Add production workflow system with 3 screens (Workflow Board, Shop Floor, Shipping) | 10 | yes | api:jobs | ui:components, ui:router, ui:jobsService | 0 |
| f2bd0c7 | 2026-01-18 | Add unified AI provider system with DeepSeek, OpenAI, and Anthropic support | 13 |  | api:AI_PROVIDER_GUIDE.md, api:package.json, api:ai, api:server, api:test-ai-providers |  | 0 |
| bf62949 | 2026-01-18 | Implement POS order intake workflow with real-time pricing and validation | 42 |  | api:pos, api:server, api:index | ui:api, ui:components, ui:hooks, ui:POSPage, ui:router | 0 |
| 2a619ba | 2026-01-18 | fix(frontend): Correct import paths for mock data in app pages | 3 |  |  | ui:apps | 0 |
| f719722 | 2026-01-18 | feat(frontend): Add distinct visual layouts for Shipments, Orders, and BOMs | 4 |  |  | ui:apps, ui:router | 0 |
| 073dc03 | 2026-01-18 | feat(frontend): Add distinct mock data for shipments, orders, and BOMs | 208 | yes | api:package-lock.json, api:package.json, api:auth, api:coils, api:customers, api:dashboard, api:documents, api:grades | ui:index.html, ui:package-lock.json, ui:package.json, ui:src, ui:api, ui:apps, ui:components, ui:constants | 0 |
| 1b22259 | 2026-01-17 | routes and cards | 51 |  |  | ui:package-lock.json, ui:package.json, ui:src, ui:api, ui:components, ui:constants, ui:hooks, ui:JobDetailPage | 0 |
| 1064014 | 2026-01-17 | feat: Complete full-stack integration with database seed script and comprehensive UI | 87 |  | api:package.json | ui:index.html, ui:package-lock.json, ui:package.json, ui:postcss.config.js, ui:src, ui:api, ui:components, ui:hooks | 0 |
| 9a6012d | 2026-01-16 | feat: Add full-stack SteelWise ERP application | 37 | yes | api:package-lock.json, api:package.json, api:auth.ts, api:coils.ts, api:dashboard.ts, api:grades.ts, api:heats.ts, api:inventory.ts | ui:index.html, ui:package-lock.json, ui:package.json, ui:postcss.config.js, ui:src, ui:components, ui:Coils.tsx, ui:Dashboard.tsx | 0 |
| 2dad293 | 2026-01-16 | Add SteelWise ERP platform design specification - 18 module documents | 19 |  |  |  | 0 |
| 844473f | 2026-01-16 | Add README and gitignore | 2 |  |  |  | 0 |
| 2268ce5 | 2026-01-16 | Initial commit | 1 |  |  |  | 0 |
