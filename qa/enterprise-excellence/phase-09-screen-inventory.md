# Phase 9: screen inventory

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

Every address the router serves was opened in a browser as an administrator at three sizes (`qa/sim/ui-audit.cjs`, 2026-11-16T07:25:05.016Z). 154 screens. Addresses with a record id were opened on a real record of the QA database where one exists.

## How a screen is classified

| Class | Rule used here |
|---|---|
| VERIFIED FUNCTIONAL | Reads real records, opens with no error, and at least one browser scenario acts on it (presses, types, compares the screen with the record). Nothing is left on it from the measurements. |
| FUNCTIONAL BUT SUBSTANDARD | Reads real records and opens with no error, but either no scenario acts on it, so its behaviour is verified only as far as opening, names and reach, or a measured item is still open on it. The reason is in the row. |
| PARTIALLY FUNCTIONAL | Part of the screen is real records and part is example figures (the static screen audit calls it MIXED). The example part carries a notice. |
| BROKEN | Raises an error on opening. |
| DISCONNECTED | Calls a server route that does not exist when opened. |
| PLACEHOLDER | A sample screen: example figures under a standing notice that nothing is saved (owner decision 4: to be built on real records later). |
| NOT APPLICABLE | An address that only leads to another screen. |

## Totals

| Class | Screens |
|---|---:|
| VERIFIED FUNCTIONAL | 45 |
| FUNCTIONAL BUT SUBSTANDARD | 40 |
| PARTIALLY FUNCTIONAL | 4 |
| BROKEN | 0 |
| DISCONNECTED | 0 |
| PLACEHOLDER | 58 |
| NOT APPLICABLE | 7 |
| All | 154 |

No screen is BROKEN: 0 page errors at any size. No screen is DISCONNECTED on opening: the smoke run (`qa/sim/ui-smoke.cjs`) finds no call to a missing route except the made-up record ids it uses. 66 calls to missing routes remain written in the code of sample screens, behind buttons that now answer "not built" (U-004).

## Every screen

| Address | Class | Why | Data | In the menu | Controls | File |
|---|---|---|---|---|---:|---|
| `/` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 140 |  |
| `/account/dashboard` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | STATIC | yes | 139 | `pages/Ecommerce/AccountDashboardPage.jsx` |
| `/account/documents` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 248 | `pages/Ecommerce/AccountDocumentsPage.jsx` |
| `/account/orders` | VERIFIED FUNCTIONAL | acted on by sales.cjs | REAL | no | 238 | `pages/Ecommerce/AccountOrdersPage.jsx` |
| `/account/shipments` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 134 | `pages/Ecommerce/AccountShipmentsPage.jsx` |
| `/admin/audit-log` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 131 | `pages/Admin/AuditLogPage.jsx` |
| `/admin/catalog` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 176 | `pages/Ecommerce/AdminCatalogPage.jsx` |
| `/admin/integrations` | VERIFIED FUNCTIONAL | acted on by ui-integration.cjs | REAL | yes | 131 | `pages/Admin/IntegrationsPage.jsx` |
| `/admin/online-settings` | PARTIALLY FUNCTIONAL | part real records, part example figures, with a notice on the example part | MIXED | yes | 196 | `pages/Ecommerce/OnlineSettingsPage.jsx` |
| `/admin/partners` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 156 | `pages/Partners/PartnerRegistryPage.jsx` |
| `/admin/processing-recipes` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 169 | `pages/Admin/RecipeEditorPage.jsx` |
| `/admin/staff` | VERIFIED FUNCTIONAL | acted on by form.cjs | REAL | yes | 184 | `pages/Admin/StaffManagementPage.jsx` |
| `/admin/tax-rates` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 151 | `pages/Admin/TaxRatesPage.jsx` |
| `/admin/users` | VERIFIED FUNCTIONAL | acted on by fail.cjs, form.cjs, nav.cjs and 1 more | REAL | yes | 167 | `pages/Admin/UserManagementPage.jsx` |
| `/bom` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 144 | `apps/bom/BomRecipeListPage.jsx` |
| `/bom/:recipeId` | VERIFIED FUNCTIONAL | acted on by ui-phase7.cjs | not in the static screen audit | no | 145 |  |
| `/bom/new` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 143 |  |
| `/boms` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 129 | `apps/boms/BOMsPage.jsx` |
| `/commercial/demand-shaping` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 124 | `pages/Commercial/DemandShapingDashboard.jsx` |
| `/contractors/active` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 146 | `pages/ContractorPortal/ActiveVisitorsDashboard.jsx` |
| `/contractors/invitations` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 149 | `pages/ContractorPortal/PreRegistrationPage.jsx` |
| `/contractors/kiosk` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 126 | `pages/ContractorPortal/CheckInKiosk.jsx` |
| `/contractors/registry` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 140 | `pages/ContractorPortal/ContractorRegistryPage.jsx` |
| `/customer-quality/car` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 133 | `pages/CustomerQuality/CARManagementPage.jsx` |
| `/customer-quality/claims` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 144 | `pages/CustomerQuality/ClaimsInboxPage.jsx` |
| `/customer-quality/credits` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 138 | `pages/CustomerQuality/CreditsApprovalsPage.jsx` |
| `/customer-quality/rma` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 136 | `pages/CustomerQuality/RMAManagementPage.jsx` |
| `/customers` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 2 more | REAL | yes | 157 | `pages/Customers/CustomersPage.jsx` |
| `/customers/preferences` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 230 | `pages/Customers/CustomerPreferencesPage.jsx` |
| `/executive/cockpit` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 140 | `pages/Executive/ExecutiveCockpit.jsx` |
| `/executive/compression-metrics` | FUNCTIONAL BUT SUBSTANDARD | acted on by fail.cjs; still: 2 hard-to-read texts | REAL | yes | 132 | `pages/Executive/CompressionMetricsDashboard.jsx` |
| `/executive/decisions` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 150 | `pages/Executive/DecisionLog.jsx` |
| `/executive/digital-twin` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 147 | `pages/Executive/DigitalTwinViewer.jsx` |
| `/executive/forecast` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 141 | `pages/Executive/ForecastExplorer.jsx` |
| `/executive/simulation` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 130 | `pages/Executive/SimulationWorkspace.jsx` |
| `/freight/comparison` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 130 | `pages/Freight/FreightComparison.jsx` |
| `/freight/comparison/:shipmentId` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 130 | `pages/Freight/FreightComparison.jsx` |
| `/freight/exceptions` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 138 | `pages/Freight/ExceptionInbox.jsx` |
| `/freight/planner` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 141 | `pages/Freight/ShipmentPlanner.jsx` |
| `/freight/pod/:shipmentId` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 132 | `pages/Freight/PODViewer.jsx` |
| `/freight/route/:shipmentId` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 128 | `pages/Freight/RouteView.jsx` |
| `/freight/tracking` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 149 | `pages/Freight/ShipmentTrackingBoard.jsx` |
| `/heats` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 2 more | REAL | yes | 150 | `pages/Heats/HeatListPage.jsx` |
| `/heats/:id` | VERIFIED FUNCTIONAL | acted on by fail.cjs, nav.cjs, stock.cjs and 1 more | REAL | no | 130 | `pages/Heats/HeatDetailPage.jsx` |
| `/help/manual` | VERIFIED FUNCTIONAL | acted on by fail.cjs, nav.cjs | STATIC | yes | 205 | `pages/Help/ManualPage.jsx` |
| `/intake` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 126 | `pages/MobileRep/MobileRepIntakePage.jsx` |
| `/inventory` | NOT APPLICABLE | leads to /units | STATIC | no | 156 | `apps/inventory/InventoryApp.jsx` |
| `/jobs/:id` | VERIFIED FUNCTIONAL | acted on by fail.cjs, make.cjs, ui-phase7.cjs and 1 more | REAL | no | 129 | `pages/JobDetailPage.jsx` |
| `/logistics/dispatch` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 137 | `screens/DispatchPlanningScreen.jsx` |
| `/logistics/route-optimization` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 133 | `screens/RouteOptimizationScreen.jsx` |
| `/logistics/shipments` | NOT APPLICABLE | leads to /shipping | not in the static screen audit | no | 228 |  |
| `/logistics/shipments/:id` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 131 |  |
| `/logistics/tracking` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 146 | `screens/ShipmentTrackingScreen.jsx` |
| `/maintenance/assets` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 1001 | `pages/Maintenance/AssetRegistry.jsx` |
| `/maintenance/dashboard` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 142 | `pages/Maintenance/MaintenanceDashboard.jsx` |
| `/maintenance/parts` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 161 | `pages/Maintenance/PartsInventory.jsx` |
| `/maintenance/pm-schedules` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 157 | `pages/Maintenance/PMSchedules.jsx` |
| `/maintenance/work-orders` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 139 | `pages/Maintenance/WorkOrderCenter.jsx` |
| `/material-tracking` | VERIFIED FUNCTIONAL | acted on by fail.cjs | REAL | yes | 132 | `pages/MaterialTracking/MaterialTrackingDashboard.jsx` |
| `/material-tracking/packages` | VERIFIED FUNCTIONAL | acted on by fail.cjs, form.cjs, stock.cjs and 1 more | REAL | yes | 137 | `pages/MaterialTracking/PackagesPage.jsx` |
| `/material-tracking/packaging` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 211 | `pages/MaterialTracking/PackagingQueue.jsx` |
| `/material-tracking/staging` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 145 | `pages/MaterialTracking/StagingLoading.jsx` |
| `/material-tracking/tags` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 131 | `pages/MaterialTracking/TagManagement.jsx` |
| `/material-tracking/traceability` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 129 | `pages/MaterialTracking/TraceabilityPage.jsx` |
| `/material-tracking/traceability/:jobId` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 129 | `pages/MaterialTracking/TraceabilityPage.jsx` |
| `/mobile-rep` | VERIFIED FUNCTIONAL | acted on by ui-sales.cjs | STATIC | no | 10 | `components/layout/MobileRepLayout.jsx` |
| `/ops-cockpit` | VERIFIED FUNCTIONAL | acted on by fail.cjs | REAL | yes | 140 | `pages/OpsCockpit/OpsCockpitPage.jsx` |
| `/optimization` | VERIFIED FUNCTIONAL | acted on by ui-phase7.cjs | REAL | no | 126 | `apps/optimization/WorkOrderOptimizationPage.jsx` |
| `/order-board` | VERIFIED FUNCTIONAL | acted on by fail.cjs, form.cjs, make.cjs and 2 more | REAL | yes | 669 | `pages/ModernOrderBoardPage.jsx` |
| `/orderhub` | NOT APPLICABLE | leads to /sales/rfq-inbox | not in the static screen audit | no | 151 |  |
| `/orderhub/orders/:orderId` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 151 |  |
| `/orderhub/rfq/:rfqId` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 151 |  |
| `/orderhub/rfq/new` | NOT APPLICABLE | leads to /sales/rfq-inbox | not in the static screen audit | no | 151 |  |
| `/orders` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 3 more | REAL | yes | 177 | `apps/orders/OrdersPage.jsx` |
| `/orders/:id` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, nav.cjs and 8 more | REAL | no | 133 | `pages/Orders/OrderDetailPage.jsx` |
| `/orders/closeout` | VERIFIED FUNCTIONAL | acted on by fail.cjs, ship.cjs, ui-phase8.cjs | REAL | yes | 189 | `pages/Orders/OrderCloseoutPage.jsx` |
| `/orders/credit-holds` | VERIFIED FUNCTIONAL | acted on by ui-sales.cjs | REAL | yes | 124 | `pages/Orders/CreditHoldsPage.jsx` |
| `/orders/intake` | PARTIALLY FUNCTIONAL | part real records, part example figures, with a notice on the example part | MIXED | yes | 164 | `pages/Orders/CSRIntakePage.jsx` |
| `/orders/invoices` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, nav.cjs and 4 more | REAL | yes | 230 | `pages/Orders/InvoicesPage.jsx` |
| `/orders/online-inbox` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 230 | `pages/Orders/OnlineInboxPage.jsx` |
| `/orders/returns` | VERIFIED FUNCTIONAL | acted on by fail.cjs, form.cjs, ship.cjs and 1 more | REAL | yes | 133 | `pages/Orders/ReturnsPage.jsx` |
| `/place-order` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 129 | `pages/MobileRep/MobileOrderPlacement.jsx` |
| `/planning` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 127 | `apps/planning/PlanningBoardPage.jsx` |
| `/planning/workflow` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 125 |  |
| `/portal/quote/:quoteToken` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 151 |  |
| `/pos` | PARTIALLY FUNCTIONAL | part real records, part example figures, with a notice on the example part | MIXED | no | 128 | `pages/POSPage.jsx` |
| `/pos/retail` | FUNCTIONAL BUT SUBSTANDARD | acted on by nav.cjs; still: 1 small target on a phone | REAL | yes | 143 | `pages/Orders/RetailPOSPage.jsx` |
| `/pricing` | VERIFIED FUNCTIONAL | acted on by fail.cjs, make.cjs, sales.cjs and 1 more | REAL | yes | 145 | `pages/Pricing/PricingDashboardPage.jsx` |
| `/pricing/quotes/new` | NOT APPLICABLE | leads to /sales/rfq-inbox | not in the static screen audit | no | 151 |  |
| `/production` | VERIFIED FUNCTIONAL | acted on by fail.cjs, make.cjs | REAL | no | 549 | `components/production/ProductionWorkflowBoard.jsx` |
| `/production-quality/dashboard` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 135 | `pages/ProductionQuality/QualityDashboard.jsx` |
| `/production-quality/inspections` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 133 | `pages/ProductionQuality/InspectionExecution.jsx` |
| `/production-quality/ncr` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 142 | `pages/ProductionQuality/NCRManagement.jsx` |
| `/production-quality/spc` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 134 | `pages/ProductionQuality/SPCChartsPage.jsx` |
| `/production-quality/trace` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 131 | `pages/ProductionQuality/TraceabilitySearch.jsx` |
| `/production/shipping` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 144 | `components/production/ShippingScreen.jsx` |
| `/production/shop-floor` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 262 | `components/production/ShopFloorScreen.jsx` |
| `/promise` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 125 | `pages/MobileRep/MobilePromisePreview.jsx` |
| `/provenance` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 127 | `pages/Provenance/ProvenanceLookupPage.jsx` |
| `/purchase-orders` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 3 more | REAL | yes | 158 | `pages/Purchasing/PurchaseOrdersPage.jsx` |
| `/qaqc` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 156 | `pages/QAQC/QualityDashboardPage.jsx` |
| `/qaqc/test-entry` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 133 | `pages/QAQC/TestEntryPage.jsx` |
| `/qc` | VERIFIED FUNCTIONAL | acted on by fail.cjs, make.cjs, nav.cjs and 1 more | REAL | yes | 166 | `pages/QC/QCDashboardPage.jsx` |
| `/qc/inspect/:id` | VERIFIED FUNCTIONAL | acted on by ui-phase7.cjs | REAL | no | 150 | `pages/QC/QCInspectionPage.jsx` |
| `/receiving` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 4 more | REAL | yes | 341 | `pages/ReceivingPage.jsx` |
| `/role-dashboard` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 131 | `apps/dashboard/RoleDashboardPage.jsx` |
| `/safety` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 143 | `apps/safety/SafetyDashboard.jsx` |
| `/safety/assistant` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 144 | `apps/safety/SafetyAssistantPage.jsx` |
| `/safety/capa` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 150 | `apps/safety/CorrectiveActionsPage.jsx` |
| `/safety/incidents` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 157 | `apps/safety/IncidentsPage.jsx` |
| `/safety/incidents/:incidentId` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 139 | `apps/safety/IncidentDetailPage.jsx` |
| `/safety/inspections` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 164 | `apps/safety/InspectionsPage.jsx` |
| `/safety/inspections/:inspectionId` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 131 | `apps/safety/InspectionDetailPage.jsx` |
| `/safety/observations` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 136 | `apps/safety/ObservationsPage.jsx` |
| `/safety/permits` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 158 | `apps/safety/PermitsPage.jsx` |
| `/safety/permits/:permitId` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 127 | `apps/safety/PermitDetailPage.jsx` |
| `/safety/stop-work` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 137 | `apps/safety/StopWorkDashboard.jsx` |
| `/safety/stop-work/:id` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | no | 132 | `apps/safety/StopWorkClearance.jsx` |
| `/safety/training` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 141 | `apps/safety/TrainingPage.jsx` |
| `/sales/dashboard` | VERIFIED FUNCTIONAL | acted on by fail.cjs, ui-sales.cjs | REAL | yes | 127 | `pages/Sales/SalesDashboard.jsx` |
| `/sales/quote/:quoteId` | FUNCTIONAL BUT SUBSTANDARD | opens with no error and every control named; the static screen audit does not class its data; no scenario acts on it | not in the static screen audit | no | 151 |  |
| `/sales/quote/new` | NOT APPLICABLE | leads to /sales/rfq-inbox | not in the static screen audit | no | 151 |  |
| `/sales/rfq-inbox` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 2 more | REAL | yes | 151 | `pages/Sales/QuotesPage.jsx` |
| `/schedule` | VERIFIED FUNCTIONAL | acted on by fail.cjs, make.cjs, nav.cjs and 2 more | REAL | yes | 138 | `pages/SchedulePage.jsx` |
| `/shipping` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, form.cjs and 5 more | REAL | yes | 228 | `pages/Shipping/ShippingPage.jsx` |
| `/shipping/:id` | VERIFIED FUNCTIONAL | acted on by fail.cjs, nav.cjs, ship.cjs and 3 more | REAL | no | 131 | `pages/Shipping/ShipmentPage.jsx` |
| `/shop` | VERIFIED FUNCTIONAL | acted on by nav.cjs, sales.cjs | REAL | yes | 151 | `pages/Ecommerce/ShopHomePage.jsx` |
| `/shop-floor` | NOT APPLICABLE | leads to /shopfloor | not in the static screen audit | no | 233 |  |
| `/shop/cart` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 127 | `pages/Ecommerce/CartPage.jsx` |
| `/shop/checkout` | PARTIALLY FUNCTIONAL | part real records, part example figures, with a notice on the example part | MIXED | no | 125 | `pages/Ecommerce/CheckoutPage.jsx` |
| `/shop/orders` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 134 | `pages/Ecommerce/MyOrdersPage.jsx` |
| `/shop/orders/:id` | VERIFIED FUNCTIONAL | acted on by sales.cjs | REAL | no | 125 | `pages/Ecommerce/MyOrderDetailPage.jsx` |
| `/shop/products/:id` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | no | 148 | `pages/Ecommerce/ProductDetailPage.jsx` |
| `/shop/remnants` | FUNCTIONAL BUT SUBSTANDARD | opens on real records with no error and every control named; no scenario acts on it | REAL | yes | 156 | `pages/Ecommerce/RemnantCategoryPage.jsx` |
| `/shop/search` | VERIFIED FUNCTIONAL | acted on by sales.cjs | REAL | yes | 157 | `pages/Ecommerce/SearchResultsPage.jsx` |
| `/shopfloor` | VERIFIED FUNCTIONAL | acted on by fail.cjs, form.cjs, make.cjs and 2 more | REAL | yes | 233 | `apps/shopfloor/WorkCenterSelectPage.jsx` |
| `/shopfloor/:workCenterId` | VERIFIED FUNCTIONAL | acted on by make.cjs | REAL | no | 127 | `apps/shopfloor/WorkCenterQueuePage.jsx` |
| `/sqm/inspections` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 133 | `pages/SQM/IQCInspectionsPage.jsx` |
| `/sqm/receiving` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 138 | `pages/SQM/InboundReceivingPage.jsx` |
| `/sqm/scar` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 133 | `pages/SQM/SCARManagementPage.jsx` |
| `/sqm/scorecards` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 136 | `pages/SQM/SupplierScorecardsPage.jsx` |
| `/sqm/snc` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 137 | `pages/SQM/SupplierNonconformancePage.jsx` |
| `/sqm/suppliers` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 143 | `pages/SQM/SupplierListPage.jsx` |
| `/time-tracking` | VERIFIED FUNCTIONAL | acted on by fail.cjs, make.cjs, ui-phase7.cjs and 1 more | REAL | yes | 135 | `pages/TimeTrackingPage.jsx` |
| `/training/courses` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 143 | `pages/Training/CourseCatalogPage.jsx` |
| `/training/dashboard` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 132 | `pages/Training/TrainingDashboard.jsx` |
| `/training/matrix` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 127 | `pages/Training/CompetencyMatrixPage.jsx` |
| `/training/my-certs` | PLACEHOLDER | example figures under a standing notice; its buttons say they are not built | SAMPLE, LABELLED | yes | 145 | `pages/Training/MyCertificationsPage.jsx` |
| `/transfers` | VERIFIED FUNCTIONAL | acted on by ui-phase6.cjs | REAL | yes | 131 | `pages/Transfers/TransfersPage.jsx` |
| `/units` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, nav.cjs and 2 more | REAL | yes | 156 | `pages/Units/UnitListPage.jsx` |
| `/units/:id` | VERIFIED FUNCTIONAL | acted on by fail.cjs, nav.cjs, stock.cjs and 2 more | REAL | no | 129 | `pages/Units/UnitDetailPage.jsx` |
| `/work-orders` | VERIFIED FUNCTIONAL | acted on by fail.cjs, fit.cjs, make.cjs and 2 more | REAL | no | 203 | `pages/WorkOrders/WorkOrderListPage.jsx` |
| `/work-orders/:id` | VERIFIED FUNCTIONAL | acted on by make.cjs, ui-phase7.cjs, ui-shop.cjs | REAL | no | 128 | `pages/WorkOrders/WorkOrderDetailPage.jsx` |
| `/work-orders/new` | VERIFIED FUNCTIONAL | acted on by make.cjs, ui-phase7.cjs | REAL | no | 132 | `pages/WorkOrders/WorkOrderCreatePage.jsx` |

