-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113062621_fk_indexes_and_stock_checks

BEGIN;

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"            VARCHAR(64) NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- 20261113062621_fk_indexes_and_stock_checks
DO $m_79211b2c$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113062621_fk_indexes_and_stock_checks' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113062621_fk_indexes_and_stock_checks (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_79211b2c$-- CreateIndex
CREATE INDEX "ApprovalDecision_deciderId_idx" ON "ApprovalDecision"("deciderId");

-- CreateIndex
CREATE INDEX "Asset_parentAssetId_idx" ON "Asset"("parentAssetId");

-- CreateIndex
CREATE INDEX "Asset_workCenterId_idx" ON "Asset"("workCenterId");

-- CreateIndex
CREATE INDEX "Coil_createdById_idx" ON "Coil"("createdById");

-- CreateIndex
CREATE INDEX "Coil_gradeId_idx" ON "Coil"("gradeId");

-- CreateIndex
CREATE INDEX "Coil_heatId_idx" ON "Coil"("heatId");

-- CreateIndex
CREATE INDEX "Coil_locationId_idx" ON "Coil"("locationId");

-- CreateIndex
CREATE INDEX "Coil_originOrderId_idx" ON "Coil"("originOrderId");

-- CreateIndex
CREATE INDEX "Coil_ownerId_idx" ON "Coil"("ownerId");

-- CreateIndex
CREATE INDEX "Coil_parentCoilId_idx" ON "Coil"("parentCoilId");

-- CreateIndex
CREATE INDEX "Coil_productId_idx" ON "Coil"("productId");

-- CreateIndex
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId");

-- CreateIndex
CREATE INDEX "DropTag_jobId_idx" ON "DropTag"("jobId");

-- CreateIndex
CREATE INDEX "DropTag_listingId_idx" ON "DropTag"("listingId");

-- CreateIndex
CREATE INDEX "DropTag_orderLineId_idx" ON "DropTag"("orderLineId");

-- CreateIndex
CREATE INDEX "Heat_createdById_idx" ON "Heat"("createdById");

-- CreateIndex
CREATE INDEX "Heat_gradeId_idx" ON "Heat"("gradeId");

-- CreateIndex
CREATE INDEX "Heat_millId_idx" ON "Heat"("millId");

-- CreateIndex
CREATE INDEX "Heat_mtrDocumentId_idx" ON "Heat"("mtrDocumentId");

-- CreateIndex
CREATE INDEX "IntakeOrder_contactId_idx" ON "IntakeOrder"("contactId");

-- CreateIndex
CREATE INDEX "IntakeOrder_quoteId_idx" ON "IntakeOrder"("quoteId");

-- CreateIndex
CREATE INDEX "IntakeQuote_contactId_idx" ON "IntakeQuote"("contactId");

-- CreateIndex
CREATE INDEX "IntakeQuote_rfqId_idx" ON "IntakeQuote"("rfqId");

-- CreateIndex
CREATE INDEX "IntakeRfq_contactId_idx" ON "IntakeRfq"("contactId");

-- CreateIndex
CREATE INDEX "Inventory_locationId_idx" ON "Inventory"("locationId");

-- CreateIndex
CREATE INDEX "Job_assignedToId_idx" ON "Job"("assignedToId");

-- CreateIndex
CREATE INDEX "Job_createdById_idx" ON "Job"("createdById");

-- CreateIndex
CREATE INDEX "Job_orderId_idx" ON "Job"("orderId");

-- CreateIndex
CREATE INDEX "Job_workCenterId_idx" ON "Job"("workCenterId");

-- CreateIndex
CREATE INDEX "Location_ownerId_idx" ON "Location"("ownerId");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_downtimeRecordId_idx" ON "MaintenanceOrder"("downtimeRecordId");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_pmScheduleId_idx" ON "MaintenanceOrder"("pmScheduleId");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_pmTemplateId_idx" ON "MaintenanceOrder"("pmTemplateId");

-- CreateIndex
CREATE INDEX "MaintenanceOrderPart_sparePartId_idx" ON "MaintenanceOrderPart"("sparePartId");

-- CreateIndex
CREATE INDEX "MaterialMovement_coilId_idx" ON "MaterialMovement"("coilId");

-- CreateIndex
CREATE INDEX "MaterialMovement_createdById_idx" ON "MaterialMovement"("createdById");

-- CreateIndex
CREATE INDEX "MaterialMovement_fromLocationId_idx" ON "MaterialMovement"("fromLocationId");

-- CreateIndex
CREATE INDEX "MaterialMovement_orderId_idx" ON "MaterialMovement"("orderId");

-- CreateIndex
CREATE INDEX "MaterialMovement_shipmentId_idx" ON "MaterialMovement"("shipmentId");

-- CreateIndex
CREATE INDEX "MaterialMovement_toLocationId_idx" ON "MaterialMovement"("toLocationId");

-- CreateIndex
CREATE INDEX "MaterialMovement_workOrderId_idx" ON "MaterialMovement"("workOrderId");

-- CreateIndex
CREATE INDEX "Operator_homeWorkCenterId_idx" ON "Operator"("homeWorkCenterId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_createdById_idx" ON "Order"("createdById");

-- CreateIndex
CREATE INDEX "Order_sellerId_idx" ON "Order"("sellerId");

-- CreateIndex
CREATE INDEX "OrderLine_gradeId_idx" ON "OrderLine"("gradeId");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderLine_productId_idx" ON "OrderLine"("productId");

-- CreateIndex
CREATE INDEX "OrderLineAllocation_coilId_idx" ON "OrderLineAllocation"("coilId");

-- CreateIndex
CREATE INDEX "OrderLineAllocation_orderLineId_idx" ON "OrderLineAllocation"("orderLineId");

-- CreateIndex
CREATE INDEX "PMSchedule_pmTemplateId_idx" ON "PMSchedule"("pmTemplateId");

-- CreateIndex
CREATE INDEX "Package_jobId_idx" ON "Package"("jobId");

-- CreateIndex
CREATE INDEX "Package_orderLineId_idx" ON "Package"("orderLineId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Product_gradeId_idx" ON "Product"("gradeId");

-- CreateIndex
CREATE INDEX "QCHold_coilId_idx" ON "QCHold"("coilId");

-- CreateIndex
CREATE INDEX "QCHold_holdById_idx" ON "QCHold"("holdById");

-- CreateIndex
CREATE INDEX "QCHold_resolvedById_idx" ON "QCHold"("resolvedById");

-- CreateIndex
CREATE INDEX "Quote_rfqId_idx" ON "Quote"("rfqId");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLine_rfqLineId_idx" ON "QuoteLine"("rfqLineId");

-- CreateIndex
CREATE INDEX "RFQ_customerId_idx" ON "RFQ"("customerId");

-- CreateIndex
CREATE INDEX "RFQLine_rfqId_idx" ON "RFQLine"("rfqId");

-- CreateIndex
CREATE INDEX "SafetyAttachment_entityId_idx" ON "SafetyAttachment"("entityId");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_auditId_idx" ON "SafetyCorrectiveAction"("auditId");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_incidentId_idx" ON "SafetyCorrectiveAction"("incidentId");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_inspectionId_idx" ON "SafetyCorrectiveAction"("inspectionId");

-- CreateIndex
CREATE INDEX "SafetyCorrectiveAction_observationId_idx" ON "SafetyCorrectiveAction"("observationId");

-- CreateIndex
CREATE INDEX "SafetyInspection_templateId_idx" ON "SafetyInspection"("templateId");

-- CreateIndex
CREATE INDEX "SafetyPolicyDocument_supersededById_idx" ON "SafetyPolicyDocument"("supersededById");

-- CreateIndex
CREATE INDEX "SafetyTrainingCompletion_courseId_idx" ON "SafetyTrainingCompletion"("courseId");

-- CreateIndex
CREATE INDEX "Shipment_fromLocationId_idx" ON "Shipment"("fromLocationId");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "ShipmentItem_orderLineId_idx" ON "ShipmentItem"("orderLineId");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentStop_shipmentId_idx" ON "ShipmentStop"("shipmentId");

-- CreateIndex
CREATE INDEX "TestResult_approvedById_idx" ON "TestResult"("approvedById");

-- CreateIndex
CREATE INDEX "TestResult_coilId_idx" ON "TestResult"("coilId");

-- CreateIndex
CREATE INDEX "TestResult_heatId_idx" ON "TestResult"("heatId");

-- CreateIndex
CREATE INDEX "TestResult_testedById_idx" ON "TestResult"("testedById");

-- CreateIndex
CREATE INDEX "User_homeLocationId_idx" ON "User"("homeLocationId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "WorkCenter_locationId_idx" ON "WorkCenter"("locationId");

-- CreateIndex
CREATE INDEX "WorkOrder_sourceCoilId_idx" ON "WorkOrder"("sourceCoilId");

-- CreateIndex
CREATE INDEX "WorkOrderOutput_outputCoilId_idx" ON "WorkOrderOutput"("outputCoilId");

-- CreateIndex
CREATE INDEX "WorkOrderOutput_workOrderId_idx" ON "WorkOrderOutput"("workOrderId");

-- Value checks the database enforces from now on. Each one is added only if
-- every existing row already satisfies it; otherwise it is skipped with a
-- notice so nothing that works today starts failing.
DO $chk$
DECLARE
  r record;
  bad bigint;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('Inventory', 'Inventory_qtyOnHand_not_negative',    '"qtyOnHand" >= 0'),
    ('Inventory', 'Inventory_qtyAvailable_not_negative', '"qtyAvailable" >= 0'),
    ('Inventory', 'Inventory_qtyAllocated_not_negative', '"qtyAllocated" >= 0'),
    ('Inventory', 'Inventory_qtyOnHold_not_negative',    '"qtyOnHold" >= 0'),
    ('OrderLine', 'OrderLine_qtyOrdered_positive',       '"qtyOrdered" > 0'),
    ('OrderLine', 'OrderLine_qtyShipped_not_negative',   '"qtyShipped" >= 0'),
    ('ShipmentItem', 'ShipmentItem_qtyShipped_positive', '"qtyShipped" > 0'),
    ('Invoice', 'Invoice_paid_within_total',             'abs("paidAmount") <= abs("totalAmount") + 0.005')
  ) AS t(tbl, name, expr) LOOP
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = r.name) THEN CONTINUE; END IF;
    EXECUTE format('SELECT count(*) FROM %I WHERE NOT (%s)', r.tbl, r.expr) INTO bad;
    IF bad > 0 THEN
      RAISE NOTICE 'Check % skipped: % existing row(s) in "%" do not satisfy it', r.name, bad, r.tbl;
    ELSE
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)', r.tbl, r.name, r.expr);
    END IF;
  END LOOP;
END
$chk$;
$body_79211b2c$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '49ff7f236fb45bc2d35fc0ca85c39f80b7bbc0cbe36af0f8e52d76ce0e663a92', now(), '20261113062621_fk_indexes_and_stock_checks', 1);
END $m_79211b2c$;

-- Row Level Security on every table (blocks Supabase's public API keys).
DO $rls$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $rls$;

-- Let the app in on every table; keep Supabase's anon/authenticated out.
DO $app$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS steelwise_app ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY steelwise_app ON public.%I FOR ALL TO PUBLIC '
      'USING (current_user NOT IN (''anon'', ''authenticated'')) '
      'WITH CHECK (current_user NOT IN (''anon'', ''authenticated''))',
      t.tablename);
  END LOOP;
END $app$;

COMMIT;
