# Database inventory

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit 2d801ff. Do not edit by hand: change the source and rerun.

Schema: `src/backend/prisma/schema.prisma`. Row counts and enforced rules are read from the local QA database after a full gate run (2026-11-13 17:38 UTC); they describe test data, not the live database, which was not touched.

## Totals

| Item | Count |
|---|---:|
| Tables | 157 |
| Tables no server code reads or writes | 52 |
| Tables empty after a full test run | 102 of 158 |
| Rows in the QA database | 5,621 |
| Indexes | 577 |
| Foreign keys | 170 |
| Foreign keys with no index | 0 |
| Value rules the database enforces (CHECK) | 9 |
| Views | 0 |
| Triggers | 0 |
| Columns holding free-form JSON | 160 |
| Tables with a branch or location column | 26 |
| Tables with an organization or tenant column | 35 |
| Tables with a status column backed by an enumeration | 38 |
| Tables with no updatedAt | 51 |
| Foreign keys that delete children with the parent (cascade) | 39 |
| Money or quantity columns stored as floating point | 9 (Remnant, ProcessingRecipe) |

## Rules the database itself enforces

| Table | Rule |
|---|---|
| Inventory | `CHECK ((abs(("qtyOnHand" - (("qtyAvailable" + "qtyAllocated") + "qtyOnHold"))) <= 0.0001))` |
| Inventory | `CHECK (("qtyAllocated" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyAvailable" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyOnHand" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyOnHold" >= (0)::numeric))` |
| Invoice | `CHECK ((abs("paidAmount") <= (abs("totalAmount") + 0.005)))` |
| OrderLine | `CHECK (("qtyOrdered" > (0)::numeric))` |
| OrderLine | `CHECK (("qtyShipped" >= (0)::numeric))` |
| ShipmentItem | `CHECK (("qtyShipped" > (0)::numeric))` |

Everything else (status moves, totals, who may change what) is enforced in server code only.

## Read-only consistency checks on the QA database

Run by `qa/tools/db-facts.mjs`. Each number is how many rows break the rule. The demo seed writes rows directly and is known to break some (D-023, B-022); the "outside the demo seed" rows are the ones that matter.

| Check | Rows that break it |
|---|---:|
| stock balance: on hand = available + allocated + on hold | 0 |
| stock: any quantity below zero | 0 |
| order lines shipped more than ordered | 0 |
| order line shipped quantity differs from its dispatched shipment items | 47 |
| order line shipped quantity differs from its dispatched shipment items, outside the demo seed orders | 0 |
| counter quick sale lines marked shipped with no shipment and no stock movement (B-025) | 4 |
| invoice paid amount differs from its payments, outside the demo seed invoices | 0 |
| invoices paid more than their total | 0 |
| invoice total differs from subtotal + tax + freight | 0 |
| invoice paid amount differs from its payments | 1 |
| orders with no lines (not draft or cancelled), outside seed and fixture orders | 0 |
| jobs with no order and no order line | 32 |
| stock items (coils) with no heat | 0 |
| stock items with no location | 0 |
| shipments delivered with no proof of delivery name | 47 |
| users with no home branch | 6 |
| invoices and credit memos with no record of who raised them, outside the demo seed | 0 |

## Migrations

| Migration | Lines | Tables created | Drops | Indexes |
|---|---:|---:|---:|---:|
| 0_init | 4396 | 120 | 0 | 275 |
| 20261110221503_customer_addresses_and_executive | 108 | 4 | 0 | 7 |
| 20261111010902_orderhub_intake | 121 | 5 | 0 | 7 |
| 20261111012618_pos_sessions | 18 | 1 | 0 | 1 |
| 20261111021952_stop_work_events | 68 | 4 | 0 | 6 |
| 20261111022456_dispatch_divisions | 12 | 1 | 0 | 0 |
| 20261111022628_pipeline_runs | 18 | 1 | 0 | 2 |
| 20261111030601_exception_events | 23 | 1 | 0 | 2 |
| 20261111031628_inventory_v1 | 88 | 6 | 0 | 7 |
| 20261111032142_print_queue | 23 | 1 | 0 | 2 |
| 20261111032749_product_divisions | 31 | 0 | 0 | 0 |
| 20261111040434_intake_pricing_processing | 59 | 4 | 0 | 3 |
| 20261111041827_online_orders | 29 | 1 | 0 | 2 |
| 20261111043052_remnants | 48 | 1 | 0 | 4 |
| 20261111043718_store_listings | 23 | 1 | 0 | 0 |
| 20261111052353_processing_recipes | 46 | 2 | 0 | 2 |
| 20261111053542_analytics_settings | 31 | 2 | 0 | 2 |
| 20261112053256_customer_logins | 9 | 0 | 0 | 1 |
| 20261113031734_document_links_any_record | 9 | 0 | 1 | 2 |
| 20261113052550_billing_returns_file_store | 65 | 2 | 0 | 7 |
| 20261113062621_fk_indexes_and_stock_checks | 290 | 0 | 0 | 87 |
| 20261113150000_stock_balance_identity | 23 | 0 | 0 | 0 |

SQL Editor files for the owner to apply are under `src/backend/prisma/upgrades/` (23 files). Phase 1 made no database change.

## Tables no server code reads or writes (B-017)

ApprovalRequest, ApprovalDecision, CommodityPrice, MeterReading, MaintenanceOrderPart, MaintenanceOrderLabor, MaintenanceAttachment, PMTemplate, PMSchedule, DowntimeRecord, SparePart, SparePartTransaction, MaintenanceAuditLog, QuoteAcceptance, RFQSource, CustomerTagRequirement, SafetyPolicyDocument, SafetyPolicyAcknowledgement, SafetyTrainingCourse, SafetyTrainingAssignment, SafetyTrainingCompletion, SafetyIncident, SafetyIncidentInvestigation, SafetyInjuryDetails, SafetyCorrectiveAction, SafetyInspectionTemplate, SafetyInspectionDefect, SafetyPermit, SafetyPermitLoto, SafetyPermitHotWork, SafetyPermitElectrical, SafetyPermitConfinedSpace, SafetyPermitSignoff, SafetyLotoProcedure, SafetyObservation, SafetyStopWorkEvent, SafetyEquipmentAsset, SafetyEquipmentGuard, SafetySDSRecord, SafetySDSRevision, SafetyMeeting, SafetyMeetingAttendee, SafetyAudit, SafetyAuditFinding, SafetyContractorCompany, SafetyContractorWorker, SafetyVisitorSignIn, SafetyPPEMatrix, SafetyAttachment, SafetyAuditEvent, SafetyElectronicSignature, SafetyJobHazardAnalysis

## Records kept as one JSON value per row (B-009)

InventoryCatalogItem, InventorySite, InventoryUnit, InventoryTransfer, RfidScanEvent (the second stock list); the order hub tables; StopWorkEvent, StopWorkAudit, StopWorkStep, StopWorkEvidence. The database cannot check any value inside them.

## Every table

| Table | Columns | Foreign keys | Unique | Indexes | Status | Branch | Org | Rows (QA) | Read by | Written by |
|---|---:|---:|---:|---:|---|:-:|:-:|---:|---|---|
| Organization | 17 | 1 | 1 | 1 |  |  |  | 29 | creditControl, customerPricing, orderTax, receiving, … | customers, quickSale, index, supabaseSeed, … |
| CustomerPreference | 49 | 1 | 1 | 1 |  |  |  | 0 | customers, specInheritance | customers |
| User | 17 | 3 | 1 | 3 |  | yes | yes | 13 | jobHistory, orderTax, receiving, auth, … | auth, users, index, supabaseSeed |
| Role | 9 | 0 | 1 | 0 |  |  |  | 10 | users | users |
| UserRoleAssignment | 6 | 2 | 1 | 2 |  |  |  | 0 | nothing | users |
| UserLocation | 5 | 2 | 1 | 2 |  | yes |  | 0 | nothing | users |
| UserDivision | 4 | 2 | 1 | 2 |  |  |  | 0 | nothing | users |
| Division | 7 | 0 | 1 | 0 |  |  | yes | 0 | users | nothing |
| ApprovalRequest | 12 | 1 | 0 | 2 | ApprovalStatus |  | yes | 0 | nothing | nothing |
| ApprovalDecision | 6 | 2 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| AuditLog | 21 | 1 | 0 | 4 |  |  | yes | 1382 | creditControl, jobHistory, opsCockpit, overrides, … | creditControl, jobHistory, customers, intakePricing, … |
| Grade | 17 | 0 | 1 | 0 |  |  |  | 8 | receiving, aiAssistant, coils, grades, … | grades, index, supabaseSeed |
| Product | 20 | 1 | 1 | 1 |  |  |  | 12 | receiving, aiAssistant, coils, intakeOrders, … | intakePricing, products, index, ecomService |
| Heat | 15 | 4 | 1 | 4 | HeatStatus |  |  | 15 | receiving, aiAssistant, coils, heats | documents, heats, index, supabaseSeed |
| Coil | 32 | 8 | 1 | 8 | CoilStatus | yes | yes | 333 | receiving, aiAssistant, coils, dashboard, … | receiving, coils, inventory, orders, … |
| Location | 19 | 2 | 1 | 2 |  |  | yes | 85 | orderTax, receiving, coils, compressionMetrics, … | dispatchRoutes, index, supabaseSeed |
| Inventory | 16 | 2 | 1 | 1 |  | yes |  | 333 | dashboard, inventory, returns, shipments, … | receiving, coils, inventory, orders, … |
| MaterialMovement | 14 | 7 | 0 | 7 |  | yes |  | 143 | receiving, coils, opsCockpit, returns | receiving, inventory, returns, shipments |
| TestResult | 16 | 4 | 0 | 4 |  |  |  | 0 | (with its parent) | (with its parent) |
| QCHold | 14 | 3 | 0 | 3 | HoldStatus |  |  | 2 | coils, dashboard, opsCockpit | coils |
| RFQ | 13 | 1 | 1 | 1 | RFQStatus |  |  | 22 | aiAssistant, analyticsV1, customerRoutes, quotes, … | customerRoutes, quotes, rfqs, index |
| RFQLine | 12 | 1 | 0 | 1 |  |  |  | 3 | (with its parent) | (with its parent) |
| Quote | 22 | 2 | 2 | 1 | QuoteStatus |  |  | 25 | aiAssistant, analyticsV1, intakeOrders, customerRoutes, … | customerRoutes, quotes, rfqs, index |
| QuoteLine | 28 | 2 | 0 | 2 |  |  |  | 6 | (with its parent) | (with its parent) |
| Operator | 21 | 3 | 2 | 3 | OperatorStatus | yes |  | 0 | dispatchRoutes, operationsRoutes, qcRoutes, staff | staff |
| OperatorSkill | 10 | 1 | 1 | 1 |  |  |  | 0 | staff | staff |
| Shift | 13 | 1 | 0 | 2 | ShiftStatus | yes |  | 0 | staff | staff |
| DispatchJob | 16 | 1 | 1 | 2 |  | yes |  | 0 | dispatchRoutes, jobs | jobs |
| DispatchOperation | 19 | 1 | 1 | 3 |  |  |  | 0 | dispatchRoutes, operationsRoutes, opsCockpit | dispatchRoutes, operationsRoutes |
| DispatchTimeLog | 11 | 1 | 0 | 3 |  |  |  | 0 | operationsRoutes | operationsRoutes |
| JobInspection | 18 | 2 | 1 | 3 |  |  |  | 0 | materialTrackingRoutes, qcRoutes | qcRoutes |
| WorkCenterType | 9 | 0 | 0 | 0 |  |  |  | 0 | dispatchRoutes, jobs, staff | dispatchRoutes |
| WorkCenter | 10 | 1 | 1 | 1 |  | yes |  | 284 | aiAssistant, analyticsV1, assets, dispatchRoutes, … | dispatchRoutes, workCenters, index |
| Job | 44 | 5 | 1 | 5 | JobStatus |  |  | 244 | jobHistory, aiAssistant, analyticsV1, intakeOrders, … | jobHistory, intakeOrders, jobs, materialTrackingRoutes, … |
| Order | 27 | 3 | 1 | 4 | OrderStatus |  |  | 260 | creditControl, aiAssistant, analyticsV1, compressionMetrics, … | creditControl, intakeOrders, onlineOrders, orders, … |
| OrderLine | 36 | 3 | 0 | 4 |  |  |  | 275 | jobs, orders, returns, shipments, … | intakeOrders, orders, returns, shipments, … |
| OrderLineAllocation | 5 | 2 | 0 | 2 |  |  |  | 6 | coils, orders, shipments | orders, shipments |
| WorkOrder | 19 | 1 | 1 | 1 | WOStatus |  |  | 1 | workOrders | workOrders |
| WorkOrderOutput | 9 | 2 | 0 | 2 |  |  |  | 0 | (with its parent) | (with its parent) |
| Shipment | 21 | 2 | 1 | 2 | ShipmentStatus | yes |  | 175 | aiAssistant, dashboard, jobs, opsCockpit, … | carrierRoutes, supplierRoutes, shipments, index |
| ShipmentItem | 6 | 2 | 0 | 2 |  |  |  | 143 | shipments | shipments, index |
| ShipmentStop | 12 | 1 | 0 | 1 |  |  |  | 0 | (with its parent) | (with its parent) |
| Invoice | 17 | 1 | 1 | 3 | InvoiceStatus |  |  | 131 | creditControl, customerRoutes, quickSale, returns, … | quickSale, index, billing |
| InvoiceLine | 11 | 1 | 0 | 2 |  |  |  | 141 | quickSale, returns, billing | nothing |
| DocumentBlob | 3 | 1 | 0 | 0 |  |  |  | 0 | documents | nothing |
| Payment | 8 | 1 | 0 | 1 |  |  |  | 91 | nothing | quickSale, billing |
| Document | 18 | 1 | 0 | 1 |  |  | yes | 0 | aiAssistant, documents, customerRoutes, portalService | documents, carrierRoutes, supplierRoutes |
| DocumentLink | 6 | 1 | 0 | 2 |  |  |  | 0 | documents | documents |
| CommodityPrice | 8 | 0 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| BomRecipe | 14 | 0 | 0 | 4 | BomRecipeStatus |  |  | 0 | operations, bomV1 | bomV1 |
| BomOperation | 11 | 1 | 0 | 1 |  |  |  | 0 | nothing | bomV1 |
| Asset | 35 | 4 | 1 | 7 | AssetStatus |  |  | 0 | assets, maintenanceOrders | assets |
| AssetType | 12 | 0 | 1 | 2 |  |  |  | 0 | assets | assets |
| AssetComponent | 14 | 1 | 0 | 1 | ComponentStatus |  |  | 0 | (with its parent) | (with its parent) |
| MeterReading | 9 | 1 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| MaintenanceOrder | 47 | 4 | 1 | 9 | MaintenanceOrderStatus |  |  | 0 | aiAssistant, maintenanceOrders | maintenanceOrders |
| MaintenanceTask | 12 | 1 | 0 | 1 | TaskStatus |  |  | 0 | (with its parent) | (with its parent) |
| MaintenanceOrderPart | 12 | 2 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| MaintenanceOrderLabor | 11 | 1 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| MaintenanceAttachment | 10 | 1 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| PMTemplate | 20 | 1 | 1 | 2 |  |  |  | 0 | nothing | nothing |
| PMSchedule | 15 | 2 | 0 | 4 | PMScheduleStatus |  |  | 0 | nothing | nothing |
| DowntimeRecord | 18 | 1 | 0 | 3 |  |  |  | 0 | nothing | nothing |
| SparePart | 22 | 1 | 1 | 3 |  |  |  | 0 | nothing | nothing |
| SparePartTransaction | 10 | 1 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| MaintenanceAuditLog | 13 | 0 | 0 | 3 |  |  |  | 0 | nothing | nothing |
| CustomerPricingTier | 16 | 1 | 1 | 0 |  |  |  | 1 | customerPricing, customers, intakePricing, portalService, … | customers, index |
| PricingRecommendation | 31 | 0 | 0 | 0 |  | yes |  | 0 | nothing | pricingIntelligenceService |
| PricingOverride | 17 | 0 | 0 | 0 |  |  |  | 0 | nothing | pricingIntelligenceService |
| QuoteAcceptance | 11 | 0 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| RFQSource | 11 | 0 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| PricingAnalytics | 17 | 0 | 1 | 0 |  | yes |  | 0 | pricingIntelligenceService | nothing |
| DropTag | 54 | 7 | 1 | 10 | DropTagStatus |  | yes | 0 | materialTrackingRoutes, dropTagListingService, dropTagService, scanService, … | dropTagListingService, dropTagService, scanService |
| DropTagListing | 27 | 2 | 1 | 3 | DropTagListingStatus |  | yes | 0 | dropTagListingService | dropTagListingService |
| Package | 30 | 4 | 1 | 6 | PackageStatus |  | yes | 0 | materialTrackingRoutes, dropTagService, scanService | dropTagService, scanService |
| PackageItem | 15 | 1 | 0 | 3 |  |  |  | 0 | dropTagService | dropTagService |
| TagIdentifier | 6 | 1 | 1 | 1 |  |  |  | 0 | scanService | scanService |
| LabelTemplate | 17 | 0 | 1 | 3 |  |  | yes | 0 | templateService | templateService |
| TraceEvent | 23 | 1 | 1 | 8 |  | yes |  | 0 | materialTrackingRoutes | materialTrackingRoutes, dropTagListingService, dropTagService, scanService |
| CustomerTagRequirement | 19 | 1 | 1 | 1 |  |  |  | 0 | nothing | nothing |
| Partner | 19 | 1 | 1 | 3 | PartnerStatus |  | yes | 0 | partnerAuth, partnerRateLimit, adminRoutes, carrierRoutes | partnerAuth, adminRoutes |
| PartnerApiKey | 14 | 1 | 0 | 3 | ApiKeyStatus |  |  | 0 | partnerAuth, adminRoutes | partnerAuth, adminRoutes |
| PartnerWebhook | 13 | 1 | 0 | 2 | WebhookStatus |  |  | 0 | webhookRoutes, webhookService | webhookRoutes, webhookService |
| WebhookDelivery | 15 | 1 | 0 | 4 | WebhookDeliveryStatus |  |  | 0 | webhookRoutes, webhookService | webhookService |
| PartnerApiLog | 15 | 1 | 0 | 5 |  |  |  | 0 | adminRoutes | partnerAuth |
| SafetyPolicyDocument | 24 | 1 | 1 | 3 | PolicyStatus |  | yes | 0 | nothing | nothing |
| SafetyPolicyAcknowledgement | 7 | 1 | 1 | 1 |  |  |  | 0 | nothing | nothing |
| SafetyTrainingCourse | 20 | 0 | 1 | 2 |  |  | yes | 0 | nothing | nothing |
| SafetyTrainingAssignment | 12 | 1 | 1 | 3 | TrainingAssignmentStatus |  | yes | 0 | nothing | nothing |
| SafetyTrainingCompletion | 16 | 2 | 1 | 3 |  |  |  | 0 | nothing | nothing |
| SafetyIncident | 38 | 0 | 1 | 5 | IncidentStatus | yes | yes | 0 | nothing | nothing |
| SafetyIncidentInvestigation | 23 | 1 | 1 | 2 |  |  |  | 0 | nothing | nothing |
| SafetyInjuryDetails | 14 | 1 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| SafetyCorrectiveAction | 32 | 4 | 1 | 8 | CapaStatus |  | yes | 0 | nothing | nothing |
| SafetyInspectionTemplate | 16 | 0 | 1 | 2 |  |  | yes | 0 | nothing | nothing |
| SafetyInspection | 26 | 1 | 1 | 6 | InspectionStatus | yes | yes | 0 | (with its parent) | (with its parent) |
| SafetyInspectionDefect | 16 | 1 | 0 | 2 | DefectStatus |  |  | 0 | nothing | nothing |
| SafetyPermit | 32 | 0 | 1 | 4 | PermitStatus | yes | yes | 0 | nothing | nothing |
| SafetyPermitLoto | 12 | 1 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| SafetyPermitHotWork | 16 | 1 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| SafetyPermitElectrical | 14 | 1 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| SafetyPermitConfinedSpace | 15 | 1 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| SafetyPermitSignoff | 9 | 1 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| SafetyLotoProcedure | 26 | 0 | 1 | 2 | PolicyStatus |  | yes | 0 | nothing | nothing |
| SafetyObservation | 25 | 0 | 1 | 4 |  | yes | yes | 0 | nothing | nothing |
| SafetyStopWorkEvent | 28 | 0 | 1 | 3 | StopWorkStatus | yes | yes | 0 | nothing | nothing |
| SafetyEquipmentAsset | 25 | 0 | 1 | 3 |  | yes | yes | 0 | nothing | nothing |
| SafetyEquipmentGuard | 12 | 1 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| SafetySDSRecord | 23 | 0 | 0 | 3 |  |  | yes | 0 | nothing | nothing |
| SafetySDSRevision | 11 | 1 | 1 | 1 |  |  |  | 0 | nothing | nothing |
| SafetyMeeting | 19 | 0 | 1 | 3 |  | yes | yes | 0 | nothing | nothing |
| SafetyMeetingAttendee | 7 | 1 | 1 | 1 |  |  |  | 0 | nothing | nothing |
| SafetyAudit | 21 | 0 | 1 | 3 | AuditStatus |  | yes | 0 | nothing | nothing |
| SafetyAuditFinding | 14 | 1 | 0 | 2 | AuditFindingStatus |  |  | 0 | nothing | nothing |
| SafetyContractorCompany | 16 | 0 | 1 | 2 |  |  | yes | 0 | nothing | nothing |
| SafetyContractorWorker | 14 | 1 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| SafetyVisitorSignIn | 15 | 0 | 0 | 2 |  | yes | yes | 0 | nothing | nothing |
| SafetyPPEMatrix | 12 | 0 | 1 | 0 |  |  | yes | 0 | nothing | nothing |
| SafetyAttachment | 15 | 4 | 0 | 4 |  |  | yes | 0 | nothing | nothing |
| SafetyAuditEvent | 20 | 0 | 0 | 5 |  |  | yes | 0 | nothing | nothing |
| SafetyElectronicSignature | 18 | 0 | 0 | 3 |  |  | yes | 0 | nothing | nothing |
| SafetyJobHazardAnalysis | 25 | 0 | 2 | 2 | PolicyStatus | yes | yes | 0 | nothing | nothing |
| Address | 17 | 1 | 0 | 1 |  |  | yes | 4 | DivisionService | index, DivisionService |
| SimulationScenario | 10 | 0 | 0 | 1 |  |  |  | 1 | simulationService | index, simulationService |
| ForecastSnapshot | 6 | 0 | 0 | 1 |  |  |  | 0 | nothing | forecastService |
| ExecutiveDecision | 19 | 0 | 1 | 2 |  |  |  | 3 | decisionService | index, decisionService |
| IntakeContact | 10 | 0 | 1 | 1 |  |  |  | 4 | orderHubStore, index | orderHubStore, index |
| IntakeRfq | 11 | 1 | 0 | 2 |  |  |  | 3 | orderHubStore, index | orderHubStore, index |
| IntakeQuote | 10 | 2 | 0 | 3 |  |  |  | 1 | orderHubStore, index | orderHubStore, index |
| IntakeOrder | 12 | 2 | 0 | 3 |  | yes |  | 2 | orderHubStore, index | orderHubStore, index |
| IntakeJob | 9 | 1 | 0 | 2 |  | yes |  | 1 | orderHubStore, index | orderHubRoutes, orderHubStore, index |
| PosSession | 9 | 0 | 0 | 1 |  |  |  | 8 | sessionStore | sessionStore |
| StopWorkEvent | 10 | 0 | 1 | 2 |  |  |  | 0 | stopWorkStore | nothing |
| StopWorkAudit | 5 | 0 | 0 | 1 |  |  |  | 0 | stopWorkStore | stopWorkStore |
| StopWorkStep | 7 | 0 | 0 | 1 |  |  |  | 0 | stopWorkStore | stopWorkStore |
| StopWorkEvidence | 4 | 0 | 0 | 1 |  |  |  | 0 | stopWorkStore | stopWorkStore |
| DispatchDivision | 6 | 0 | 0 | 0 |  |  |  | 2 | dispatchRoutes | dispatchRoutes |
| PipelineRun | 6 | 0 | 0 | 2 |  |  |  | 0 | orchestrator | orchestrator |
| ExceptionEvent | 11 | 0 | 0 | 2 |  | yes |  | 8 | eventsV1 | eventsV1, index |
| InventoryCatalogItem | 3 | 0 | 0 | 0 |  |  |  | 8 | inventoryV1Store | inventoryV1Store |
| InventorySite | 5 | 0 | 0 | 0 |  |  |  | 13 | inventoryV1Store | inventoryV1Store |
| InventoryUnit | 9 | 0 | 0 | 3 |  | yes |  | 15 | inventoryV1Store | inventoryV1Store |
| InventoryTransfer | 5 | 0 | 0 | 1 |  |  |  | 3 | inventoryV1Store | inventoryV1Store |
| RfidScanEvent | 5 | 0 | 0 | 2 |  |  |  | 5 | inventoryV1Store | inventoryV1Store |
| InventoryAdjustment | 4 | 0 | 0 | 1 |  |  |  | 0 | nothing | inventoryV1Store |
| PrintQueueJob | 11 | 0 | 0 | 2 |  |  |  | 2 | printAutomationService | printAutomationService |
| PriceLevel | 5 | 0 | 0 | 0 |  |  |  | 4 | customerPricing, intakePricing, ecomService | index |
| SalesTaxRate | 3 | 0 | 0 | 0 |  |  |  | 4 | orderTax, quickSale, taxRates, ecomService | taxRates, index |
| ProcessingOperation | 12 | 0 | 1 | 1 |  |  |  | 10 | intakeProcessing, ecomService | index |
| ProcessingTemplate | 6 | 0 | 0 | 1 |  |  |  | 6 | intakeProcessing | index |
| OnlineOrder | 17 | 0 | 1 | 1 |  |  |  | 39 | compressionMetrics, onlineOrders, ecomService, portalService | onlineOrders, index, ecomService |
| Remnant | 30 | 0 | 1 | 3 |  |  |  | 10 | remnantService | index, remnantService |
| StoreListing | 14 | 1 | 0 | 0 |  |  |  | 10 | nothing | index, ecomService |
| ProcessingRecipe | 23 | 0 | 1 | 1 |  |  |  | 12 | processingRecipes | processingRecipes, index |
| RecipeRoutingTemplate | 5 | 0 | 0 | 0 |  |  |  | 6 | processingRecipes | index |
| AppSetting | 3 | 0 | 0 | 0 |  |  |  | 0 | settings | settings |
| DemandSuggestionEvent | 10 | 0 | 0 | 2 |  |  |  | 1242 | demandShaping | demandShaping, index |

