# Database inventory

Generated 2026-11-15 by `qa/tools/excellence-docs.mjs` at commit 6cbedc5. Do not edit by hand: change the source and rerun.

Schema: `src/backend/prisma/schema.prisma`. Row counts and enforced rules are read from the local QA database after a full gate run (2026-11-15 22:25 UTC); they describe test data, not the live database, which was not touched.

## Totals

| Item | Count |
|---|---:|
| Tables | 161 |
| Tables no server code reads or writes | 53 |
| Tables empty after a full test run | 78 of 162 |
| Rows in the QA database | 15,949 |
| Indexes | 593 |
| Foreign keys | 194 |
| Foreign keys with no index | 0 |
| Value rules the database enforces (CHECK) | 30 |
| Views | 0 |
| Triggers | 0 |
| Columns holding free-form JSON | 161 |
| Tables with a branch or location column | 30 |
| Tables with an organization or tenant column | 35 |
| Tables with a status column backed by an enumeration | 38 |
| Tables with no updatedAt | 53 |
| Foreign keys that delete children with the parent (cascade) | 39 |
| Money or quantity columns stored as floating point | 9 (Remnant, ProcessingRecipe) |

## Read from the database catalogues (Phase 3)

`qa/tools/db-schema.mjs` reads PostgreSQL's own catalogues on the QA database (steelwise_qa, PostgreSQL 16.15, isolation read committed). The schema file says what was intended; this says what exists.

| Item | Count |
|---|---:|
| Tables | 162 |
| Columns | 2494 |
| Primary keys | 162 |
| Foreign keys | 194 (cascade 39, restrict 83, set null 72) |
| Foreign keys not validated | 0 |
| Unique indexes | 85 |
| Value checks | 30 |
| Indexes | 593 |
| Exact duplicate indexes | 0 |
| Views, materialized views, triggers, functions, partitioned tables | 0, 0, 0, 0, 0 |
| Row-level security policies in the QA database | 0 (the SQL Editor files add one per table on the host; see phase-03-schema-audit.md) |
| Sequences | 1 |
| Enumerations | 96 |
| Migrations applied, failed | 30, 0 |
| Columns named like a reference with no foreign key | 220 (target evident for 79; G-003) |
| Floating-point columns | 9 (ProcessingRecipe.setupMinutes, ProcessingRecipe.runMinutesPerUnit, ProcessingRecipe.minRunMinutes, ProcessingRecipe.thicknessMin, ProcessingRecipe.thicknessMax, Remnant.thickness, Remnant.width, Remnant.length, Remnant.estimatedWeight) |
| Deletes that cascade into money or stock rows | InvoiceLine.invoiceId → Invoice; ShipmentItem.shipmentId → Shipment |

## Rules the database itself enforces

| Table | Rule |
|---|---|
| Coil | `CHECK (((form = 'SUPPLY'::"ProductForm") OR (("heatId" IS NOT NULL) AND ("gradeId" IS NOT NULL))))` |
| Coil | `CHECK (((("netWeightLb" IS NULL) OR ("netWeightLb" >= (0)::numeric)) AND (("grossWeightLb" IS NULL) OR ("grossWeightLb" >= (0)::numeric))))` |
| DocumentCounter | `CHECK (("lastNumber" >= 0))` |
| Inventory | `CHECK ((abs(("qtyOnHand" - ((("qtyAvailable" + "qtyAllocated") + "qtyOnHold") + "qtyInTransit"))) <= 0.0001))` |
| Inventory | `CHECK (("qtyAllocated" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyAvailable" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyInTransit" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyOnHand" >= (0)::numeric))` |
| Inventory | `CHECK (("qtyOnHold" >= (0)::numeric))` |
| Invoice | `CHECK ((abs("paidAmount") <= (abs("totalAmount") + 0.005)))` |
| Invoice | `CHECK ((abs(("totalAmount" - ((subtotal + "taxAmount") + "freightAmount"))) <= 0.005))` |
| Job | `CHECK (((("inputWeightLb" IS NULL) OR ("inputWeightLb" >= (0)::numeric)) AND (("outputWeightLb" IS NULL) OR ("outputWeightLb" >= (0)::numeric)) AND (("scrapWeightLb" IS NULL) OR ("scrapWeightLb" >= (0` |
| MaterialMovement | `CHECK (("qtyMoved" > (0)::numeric))` |
| Order | `CHECK (((subtotal >= (0)::numeric) AND ("taxAmount" >= (0)::numeric) AND ("freightAmount" >= (0)::numeric) AND ("totalAmount" >= (0)::numeric)))` |
| Order | `CHECK ((abs(("totalAmount" - ((subtotal + "taxAmount") + "freightAmount"))) <= 0.005))` |
| OrderLine | `CHECK ((("discountPct" IS NULL) OR (("discountPct" >= (0)::numeric) AND ("discountPct" <= (100)::numeric))))` |
| OrderLine | `CHECK (("extendedPrice" >= (0)::numeric))` |
| OrderLine | `CHECK (("qtyOrdered" > (0)::numeric))` |
| OrderLine | `CHECK (("qtyShipped" >= (0)::numeric))` |
| OrderLine | `CHECK (("unitPrice" >= (0)::numeric))` |
| OrderLineAllocation | `CHECK (("qtyAllocated" > (0)::numeric))` |
| Payment | `CHECK ((amount <> (0)::numeric))` |
| QuoteLine | `CHECK ((quantity > (0)::numeric))` |
| QuoteLine | `CHECK (("unitPrice" >= (0)::numeric))` |
| ShipmentItem | `CHECK (("qtyShipped" > (0)::numeric))` |
| ShipmentItem | `CHECK ((("weightLb" IS NULL) OR ("weightLb" >= (0)::numeric)))` |
| StockTransfer | `CHECK (("fromLocationId" <> "toLocationId"))` |
| StockTransfer | `CHECK ((status = ANY (ARRAY['SHIPPED'::text, 'RECEIVED'::text, 'CANCELLED'::text])))` |
| StockTransferLine | `CHECK ((("qtyShipped" > (0)::numeric) AND (("qtyReceived" IS NULL) OR ("qtyReceived" >= (0)::numeric))))` |
| WorkOrder | `CHECK (((("inputWeightLb" IS NULL) OR ("inputWeightLb" >= (0)::numeric)) AND (("outputWeightLb" IS NULL) OR ("outputWeightLb" >= (0)::numeric)) AND (("scrapWeightLb" IS NULL) OR ("scrapWeightLb" >= (0` |

Everything else (status moves, totals, who may change what) is enforced in server code only.

## Read-only consistency checks on the QA database

Run by `qa/tools/db-facts.mjs`. Each number is how many rows break the rule. The demo seed writes rows directly and is known to break some (D-023, B-022); the "outside the demo seed" rows are the ones that matter.

| Check | Rows that break it |
|---|---:|
| stock balance: on hand = available + allocated + on hold + in transit | 0 |
| stock: any quantity below zero | 0 |
| stock reserved differs from the reservations on file for the item | 0 |
| reservations on stock items that have no stock row | 0 |
| order line reserved more than is left to ship | 0 |
| reservations left on cancelled or completed orders | 0 |
| items whose on-hand differs from what their movements add up to (receipts and pieces made in; shipments, cuts and scrap out; corrections either way) | 0 |
| completed work orders whose output and scrap are not matched by movements on the source item | 0 |
| completed work orders whose pieces do not weigh what the work order says came out | 0 |
| pieces whose heat, grade or owner differs from the item they were cut from | 0 |
| invoice series whose counter is not the highest number on file | 0 |
| invoice numbers repeated | 0 |
| stock corrections with no note or no person | 0 |
| stock row and its item disagree about the branch | 0 |
| transfers whose two branches are the same, or missing | 0 |
| stock in transit that is not on an open transfer, or an open transfer whose stock is not in transit | 0 |
| stock on an open transfer that is not at the sending branch | 0 |
| an item on more than one open transfer | 0 |
| received transfers with no TRANSFER movement for an item on them | 0 |
| transfer lines received more than shipped, or a good line not received whole | 0 |
| purchase order lines (by weight) whose received quantity differs from the receipts booked against them | 0 |
| receipts booked against a line that is not on a purchase order | 0 |
| last transfer of an item did not end where the item now is | 0 |
| time entries that end before they start | 0 |
| time entries still running on a step that is finished | 0 |
| time entries still running on a job that is cancelled, shipped or completed | 0 |
| steps with more than one clock running | 0 |
| time entries with no operator or no work center | 0 |
| finished steps with no start or no end time | 0 |
| steps running on a work center of another kind, or at another branch, than the step calls for | 0 |
| jobs with more than one open inspection | 0 |
| inspections decided with no result or no completion time, or still open with a result | 0 |
| jobs past inspection (packaging, ready to ship, shipped, completed) whose latest decided inspection failed, outside rows written directly as fixtures | 0 |
| jobs past production with a planned step unfinished, outside rows written directly as fixtures | 0 |
| jobs whose plan is at a branch other than their work center | 0 |
| operators clocked on while recorded as inactive | 0 |
| work orders on quality hold or cancelled that moved stock | 0 |
| shipped stock movements with no shipment | 0 |
| dispatched shipment items whose quantity is not fully covered by stock movements: every shipment must come off reserved stock (G-019, refused since the owner decision of 2026-11-13) | 0 |
| stock items cut from a parent that lost the parent heat | 0 |
| amounts kept with digits beyond what was entered (floating-point residue) | 0 |
| invoice subtotal differs from its lines | 2 |
| order subtotal differs from its lines (orders that are not draft) | 0 |
| order lines invoiced more than shipped | 0 |
| tax invoiced on an order is more than the order tax | 0 |
| credit memos larger than the invoice they credit | 0 |
| two live invoices for the same shipment | 0 |
| quotes or requests whose branch does not exist | 0 |
| orders with no branch | 62 |
| order lines shipped more than ordered | 0 |
| order line shipped quantity differs from its dispatched shipment items | 47 |
| order line shipped quantity differs from its dispatched shipment items, outside the demo seed orders | 0 |
| counter quick sale lines with no stock movement, because the product has no shelf stock on file at the branch (B-025) | 6 |
| invoice paid amount differs from its payments, outside the demo seed invoices | 0 |
| invoices paid more than their total | 0 |
| invoice total differs from subtotal + tax + freight | 0 |
| invoice paid amount differs from its payments | 1 |
| orders with no lines (not draft or cancelled), outside seed and fixture orders | 0 |
| jobs with no order and no order line | 65 |
| stock items (coils) with no heat | 10 |
| stock items with no location | 0 |
| shipments delivered with no proof of delivery name | 47 |
| users with no home branch | 5 |
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
| 20261113190000_order_branch | 24 | 0 | 0 | 1 |
| 20261113210000_reference_integrity | 104 | 0 | 0 | 8 |
| 20261113211000_request_keys | 17 | 1 | 0 | 2 |
| 20261113212000_quote_branch | 30 | 0 | 0 | 2 |
| 20261113220000_document_counters | 26 | 1 | 0 | 0 |
| 20261113230000_webhook_delivery_once | 17 | 0 | 0 | 2 |
| 20261115090000_voided_counter_sales_cancelled | 12 | 0 | 0 | 0 |
| 20261115200000_stock_transfers_po_receipts_piece_stock | 103 | 2 | 1 | 7 |

SQL Editor files for the owner to apply are under `src/backend/prisma/upgrades/` (31 files). Phase 1 made no database change.

## Tables no server code reads or writes (B-017)

ApprovalRequest, ApprovalDecision, CommodityPrice, MeterReading, MaintenanceOrderPart, MaintenanceOrderLabor, MaintenanceAttachment, PMTemplate, PMSchedule, DowntimeRecord, SparePart, SparePartTransaction, MaintenanceAuditLog, QuoteAcceptance, RFQSource, CustomerTagRequirement, SafetyPolicyDocument, SafetyPolicyAcknowledgement, SafetyTrainingCourse, SafetyTrainingAssignment, SafetyTrainingCompletion, SafetyIncident, SafetyIncidentInvestigation, SafetyInjuryDetails, SafetyCorrectiveAction, SafetyInspectionTemplate, SafetyInspectionDefect, SafetyPermit, SafetyPermitLoto, SafetyPermitHotWork, SafetyPermitElectrical, SafetyPermitConfinedSpace, SafetyPermitSignoff, SafetyLotoProcedure, SafetyObservation, SafetyStopWorkEvent, SafetyEquipmentAsset, SafetyEquipmentGuard, SafetySDSRecord, SafetySDSRevision, SafetyMeeting, SafetyMeetingAttendee, SafetyAudit, SafetyAuditFinding, SafetyContractorCompany, SafetyContractorWorker, SafetyVisitorSignIn, SafetyPPEMatrix, SafetyAttachment, SafetyAuditEvent, SafetyElectronicSignature, SafetyJobHazardAnalysis, DocumentCounter

## Records kept as one JSON value per row (B-009)

InventoryCatalogItem, InventorySite, InventoryUnit, InventoryTransfer, RfidScanEvent (the second stock list); the order hub tables; StopWorkEvent, StopWorkAudit, StopWorkStep, StopWorkEvidence. The database cannot check any value inside them.

## Every table

| Table | Columns | Foreign keys | Unique | Indexes | Status | Branch | Org | Rows (QA) | Read by | Written by |
|---|---:|---:|---:|---:|---|:-:|:-:|---:|---|---|
| Organization | 17 | 1 | 1 | 1 |  |  |  | 93 | creditControl, customerPricing, orderTax, receiving, … | customers, quickSale, index, supabaseSeed, … |
| CustomerPreference | 49 | 1 | 1 | 0 |  |  |  | 2 | customers, specInheritance | customers |
| User | 17 | 3 | 1 | 3 |  | yes | yes | 48 | jobHistory, orderTax, receiving, auth, … | auth, users, index, supabaseSeed |
| Role | 9 | 0 | 1 | 0 |  |  |  | 10 | users | users |
| UserRoleAssignment | 6 | 2 | 1 | 2 |  |  |  | 0 | nothing | users |
| UserLocation | 5 | 2 | 1 | 2 |  | yes |  | 246 | nothing | users |
| UserDivision | 4 | 2 | 1 | 2 |  |  |  | 0 | nothing | users |
| Division | 7 | 0 | 1 | 0 |  |  | yes | 0 | users | nothing |
| ApprovalRequest | 12 | 1 | 0 | 2 | ApprovalStatus |  | yes | 0 | nothing | nothing |
| ApprovalDecision | 6 | 2 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| AuditLog | 21 | 1 | 0 | 4 |  |  | yes | 4306 | creditControl, integrationReport, jobGates, jobHistory, … | creditControl, jobHistory, stockChanges, transfers, … |
| Grade | 17 | 0 | 1 | 0 |  |  |  | 9 | lineSpecs, receiving, aiAssistant, coils, … | lineSpecs, grades, index, supabaseSeed |
| Product | 20 | 1 | 1 | 1 |  |  |  | 17 | receiving, aiAssistant, coils, intakeOrders, … | intakePricing, products, index, ecomService |
| Heat | 15 | 4 | 1 | 4 | HeatStatus |  |  | 19 | receiving, aiAssistant, coils, heats | documents, heats, index, supabaseSeed |
| Coil | 32 | 8 | 1 | 8 | CoilStatus | yes | yes | 818 | holds, receiving, stockChanges, transfers, … | holds, receiving, stockChanges, transfers, … |
| Location | 19 | 2 | 1 | 2 |  |  | yes | 85 | orderTax, receiving, coils, compressionMetrics, … | dispatchRoutes, index, supabaseSeed |
| Inventory | 17 | 2 | 1 | 1 |  | yes |  | 818 | receiving, transfers, dashboard, inventory, … | holds, receiving, stockChanges, transfers, … |
| MaterialMovement | 15 | 8 | 0 | 8 |  | yes |  | 990 | receiving, coils, heats, opsCockpit, … | receiving, stockChanges, transfers, inventory, … |
| TestResult | 16 | 4 | 0 | 4 |  |  |  | 0 | (with its parent) | (with its parent) |
| QCHold | 14 | 3 | 0 | 3 | HoldStatus |  |  | 59 | coils, dashboard, opsCockpit | holds, transfers, returns |
| RFQ | 14 | 2 | 1 | 2 | RFQStatus | yes |  | 62 | aiAssistant, analyticsV1, customerRoutes, quotes, … | quotes, rfqs, index |
| RFQLine | 12 | 1 | 0 | 1 |  |  |  | 47 | (with its parent) | (with its parent) |
| Quote | 23 | 4 | 2 | 3 | QuoteStatus | yes |  | 58 | aiAssistant, analyticsV1, intakeOrders, customerRoutes, … | quotes, rfqs, index |
| QuoteLine | 28 | 3 | 0 | 3 |  |  |  | 42 | (with its parent) | (with its parent) |
| Operator | 21 | 3 | 2 | 3 | OperatorStatus | yes |  | 95 | dispatchRoutes, operationsRoutes, qcRoutes, staff | staff |
| OperatorSkill | 10 | 1 | 1 | 1 |  |  |  | 105 | staff | staff |
| Shift | 13 | 1 | 0 | 2 | ShiftStatus | yes |  | 0 | staff | staff |
| DispatchJob | 16 | 3 | 1 | 3 |  | yes |  | 309 | jobGates, dispatchRoutes, jobs | jobs |
| DispatchOperation | 19 | 2 | 1 | 3 |  |  |  | 352 | workCenterGuard, dispatchRoutes, jobs, operationsRoutes, … | dispatchRoutes, operationsRoutes |
| DispatchTimeLog | 11 | 1 | 0 | 3 |  |  |  | 234 | operationsRoutes, staff | jobGates, operationsRoutes |
| JobInspection | 18 | 2 | 1 | 3 |  |  |  | 241 | jobGates, materialTrackingRoutes, qcRoutes | qcRoutes |
| WorkCenterType | 9 | 0 | 0 | 0 |  |  |  | 77 | workCenterGuard, bomV1, dispatchRoutes, jobs, … | dispatchRoutes |
| WorkCenter | 10 | 1 | 1 | 1 |  | yes |  | 381 | aiAssistant, analyticsV1, assets, dispatchRoutes, … | dispatchRoutes, workCenters, index |
| Job | 44 | 7 | 1 | 7 | JobStatus |  |  | 603 | jobGates, jobHistory, aiAssistant, analyticsV1, … | jobGates, jobHistory, intakeOrders, jobs, … |
| Order | 28 | 5 | 1 | 5 | OrderStatus | yes |  | 982 | creditControl, aiAssistant, analyticsV1, compressionMetrics, … | creditControl, intakeOrders, onlineOrders, orders, … |
| OrderLine | 36 | 4 | 0 | 4 |  |  |  | 1003 | receiving, jobs, orders, returns, … | receiving, intakeOrders, orders, purchaseOrders, … |
| OrderLineAllocation | 5 | 2 | 0 | 2 |  |  |  | 57 | holds, stockChanges, coils, orders, … | stockChanges, orders, shipments |
| WorkOrder | 19 | 3 | 1 | 3 | WOStatus |  |  | 109 | workOrders | workOrders |
| WorkOrderOutput | 9 | 2 | 0 | 2 |  |  |  | 79 | nothing | stockChanges |
| Shipment | 21 | 3 | 1 | 3 | ShipmentStatus | yes |  | 270 | aiAssistant, dashboard, jobs, opsCockpit, … | shipments, index |
| ShipmentItem | 6 | 2 | 0 | 2 |  |  |  | 239 | shipments | shipments, index |
| ShipmentStop | 12 | 1 | 0 | 1 |  |  |  | 0 | (with its parent) | (with its parent) |
| Invoice | 17 | 3 | 1 | 3 | InvoiceStatus |  |  | 244 | creditControl, customerRoutes, quickSale, returns, … | quickSale, index, billing |
| InvoiceLine | 11 | 2 | 0 | 2 |  |  |  | 255 | quickSale, returns, billing | nothing |
| DocumentBlob | 3 | 1 | 0 | 0 |  |  |  | 1 | documents, customerRoutes | nothing |
| Payment | 8 | 1 | 0 | 1 |  |  |  | 140 | nothing | quickSale, billing |
| Document | 18 | 1 | 0 | 1 |  |  | yes | 1 | aiAssistant, documents, customerRoutes, portalService | documents |
| DocumentLink | 6 | 1 | 0 | 2 |  |  |  | 0 | documents | documents |
| CommodityPrice | 8 | 0 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| BomRecipe | 14 | 0 | 0 | 4 | BomRecipeStatus |  |  | 22 | operations, bomV1, jobs | bomV1 |
| BomOperation | 11 | 1 | 0 | 1 |  |  |  | 34 | bomV1, optimizationV1 | nothing |
| Asset | 35 | 4 | 1 | 6 | AssetStatus |  |  | 292 | workCenterGuard, assets, maintenanceOrders | assets |
| AssetType | 12 | 0 | 1 | 1 |  |  |  | 2 | assets | assets |
| AssetComponent | 14 | 1 | 0 | 1 | ComponentStatus |  |  | 0 | (with its parent) | (with its parent) |
| MeterReading | 9 | 1 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| MaintenanceOrder | 47 | 4 | 1 | 8 | MaintenanceOrderStatus |  |  | 3 | aiAssistant, maintenanceOrders | maintenanceOrders |
| MaintenanceTask | 12 | 1 | 0 | 1 | TaskStatus |  |  | 0 | (with its parent) | (with its parent) |
| MaintenanceOrderPart | 12 | 2 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| MaintenanceOrderLabor | 11 | 1 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| MaintenanceAttachment | 10 | 1 | 0 | 1 |  |  |  | 0 | nothing | nothing |
| PMTemplate | 20 | 1 | 1 | 1 |  |  |  | 0 | nothing | nothing |
| PMSchedule | 15 | 2 | 0 | 4 | PMScheduleStatus |  |  | 0 | nothing | nothing |
| DowntimeRecord | 18 | 1 | 0 | 3 |  |  |  | 0 | nothing | nothing |
| SparePart | 22 | 1 | 1 | 2 |  |  |  | 0 | nothing | nothing |
| SparePartTransaction | 10 | 1 | 0 | 2 |  |  |  | 0 | nothing | nothing |
| MaintenanceAuditLog | 13 | 0 | 0 | 3 |  |  |  | 0 | nothing | nothing |
| CustomerPricingTier | 16 | 1 | 1 | 0 |  |  |  | 12 | customerPricing, customers, intakePricing, portalService, … | customers, index |
| PricingRecommendation | 31 | 0 | 0 | 0 |  | yes |  | 0 | nothing | pricingIntelligenceService |
| PricingOverride | 17 | 0 | 0 | 0 |  |  |  | 0 | nothing | pricingIntelligenceService |
| QuoteAcceptance | 11 | 0 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| RFQSource | 11 | 0 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| PricingAnalytics | 17 | 0 | 1 | 0 |  | yes |  | 0 | pricingIntelligenceService | nothing |
| DropTag | 54 | 7 | 1 | 9 | DropTagStatus |  | yes | 0 | materialTrackingRoutes, dropTagListingService, dropTagService, scanService, … | dropTagListingService, dropTagService, scanService |
| DropTagListing | 27 | 2 | 1 | 3 | DropTagListingStatus |  | yes | 0 | dropTagListingService | dropTagListingService |
| Package | 30 | 4 | 1 | 5 | PackageStatus |  | yes | 0 | materialTrackingRoutes, dropTagService, scanService | dropTagService, scanService |
| PackageItem | 15 | 1 | 0 | 3 |  |  |  | 0 | dropTagService | dropTagService |
| TagIdentifier | 6 | 1 | 1 | 1 |  |  |  | 0 | scanService | scanService |
| LabelTemplate | 17 | 0 | 1 | 2 |  |  | yes | 2 | templateService | templateService |
| TraceEvent | 23 | 1 | 1 | 8 |  | yes |  | 0 | materialTrackingRoutes | materialTrackingRoutes, dropTagListingService, dropTagService, scanService |
| CustomerTagRequirement | 19 | 1 | 1 | 0 |  |  |  | 0 | nothing | nothing |
| Partner | 19 | 1 | 1 | 3 | PartnerStatus |  | yes | 8 | partnerAuth, partnerRateLimit, adminRoutes, webhookService | partnerAuth, adminRoutes |
| PartnerApiKey | 14 | 1 | 0 | 3 | ApiKeyStatus |  |  | 12 | partnerAuth, adminRoutes | partnerAuth, adminRoutes |
| PartnerWebhook | 13 | 1 | 0 | 2 | WebhookStatus |  |  | 15 | webhookRoutes, webhookService | webhookRoutes, webhookService |
| WebhookDelivery | 15 | 1 | 1 | 5 | WebhookDeliveryStatus |  |  | 227 | integrationReport, integrations, webhookRoutes, webhookService | webhookService |
| PartnerApiLog | 15 | 1 | 0 | 5 |  |  |  | 148 | adminRoutes | partnerAuth |
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
| PosSession | 9 | 0 | 0 | 1 |  |  |  | 11 | sessionStore | sessionStore |
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
| OnlineOrder | 17 | 0 | 1 | 1 |  |  |  | 49 | compressionMetrics, onlineOrders, ecomService, portalService | onlineOrders, index, ecomService |
| Remnant | 30 | 0 | 1 | 3 |  |  |  | 10 | remnantService | index, remnantService |
| StoreListing | 14 | 1 | 0 | 0 |  |  |  | 10 | nothing | index, ecomService |
| ProcessingRecipe | 23 | 0 | 1 | 1 |  |  |  | 12 | processingRecipes | processingRecipes, index |
| RecipeRoutingTemplate | 5 | 0 | 0 | 0 |  |  |  | 6 | processingRecipes | index |
| AppSetting | 3 | 0 | 0 | 0 |  |  |  | 3 | retention, settings | settings |
| DemandSuggestionEvent | 10 | 0 | 0 | 2 |  |  |  | 1254 | demandShaping | demandShaping, index |
| DocumentCounter | 3 | 0 | 0 | 0 |  |  |  | 2 | nothing | nothing |
| RequestKey | 8 | 0 | 1 | 1 |  |  |  | 38 | integrationReport, requestKeys | integrationReport, requestKeys |
| StockTransfer | 18 | 3 | 1 | 3 |  | yes |  | 69 | transfers, inventory | transfers |
| StockTransferLine | 9 | 2 | 1 | 1 |  |  |  | 73 | transfers | transfers |

