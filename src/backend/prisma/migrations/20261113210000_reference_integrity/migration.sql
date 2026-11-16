-- Phase 3 of the Enterprise Excellence Program: reference integrity and value checks.
-- Findings G-002 (reference columns with no foreign key), E-004 (value checks),
-- G-005 (duplicate indexes), C-003 (dispatch plans defaulted to a branch that does not exist).
-- Nothing is deleted and no existing row is changed.

-- 1. Sixteen reference columns get a foreign key.
-- Each is added NOT VALID, which makes the database check every new and changed row at once
-- without reading the table. It is then validated only if every existing row already passes.
-- If some do not, the key stays in force for new rows and a notice says how many old rows to review.
DO $fk$
DECLARE
  r record;
  bad bigint;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('Quote',             'createdById',          'User',         'SET NULL'),
    ('QuoteLine',         'productId',            'Product',      'RESTRICT'),
    ('DispatchJob',       'orderId',              'Order',        'SET NULL'),
    ('DispatchJob',       'locationId',           'Location',     'RESTRICT'),
    ('DispatchOperation', 'assignedWorkCenterId', 'WorkCenter',   'SET NULL'),
    ('Job',               'orderLineId',          'OrderLine',    'SET NULL'),
    ('Job',               'workOrderId',          'WorkOrder',    'SET NULL'),
    ('Order',             'returnOfOrderId',      'Order',        'RESTRICT'),
    ('OrderLine',         'returnOfLineId',       'OrderLine',    'RESTRICT'),
    ('WorkOrder',         'salesOrderId',         'Order',        'SET NULL'),
    ('WorkOrder',         'lineId',               'OrderLine',    'SET NULL'),
    ('Shipment',          'carrierId',            'Organization', 'SET NULL'),
    ('Invoice',           'shipmentId',           'Shipment',     'RESTRICT'),
    ('Invoice',           'creditOfInvoiceId',    'Invoice',      'RESTRICT'),
    ('InvoiceLine',       'orderLineId',          'OrderLine',    'RESTRICT')
  ) AS t(tbl, col, ref, del) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = r.tbl || '_' || r.col || '_fkey') THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I("id") ON DELETE %s ON UPDATE CASCADE NOT VALID',
                     r.tbl, r.tbl || '_' || r.col || '_fkey', r.col, r.ref, r.del);
    END IF;
    EXECUTE format('SELECT count(*) FROM %I x WHERE x.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I p WHERE p."id" = x.%I)', r.tbl, r.col, r.ref, r.col) INTO bad;
    IF bad > 0 THEN
      RAISE NOTICE 'Foreign key %.% is in force for new rows; % existing row(s) point at no "%" and were left as they are', r.tbl, r.col, bad, r.ref;
    ELSE
      EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', r.tbl, r.tbl || '_' || r.col || '_fkey');
    END IF;
  END LOOP;
END
$fk$;

-- Each foreign key column has an index, so that deleting or renumbering a parent row does not scan the child table.
CREATE INDEX IF NOT EXISTS "Quote_createdById_idx" ON "Quote"("createdById");
CREATE INDEX IF NOT EXISTS "QuoteLine_productId_idx" ON "QuoteLine"("productId");
CREATE INDEX IF NOT EXISTS "DispatchJob_orderId_idx" ON "DispatchJob"("orderId");
CREATE INDEX IF NOT EXISTS "Job_orderLineId_idx" ON "Job"("orderLineId");
CREATE INDEX IF NOT EXISTS "Job_workOrderId_idx" ON "Job"("workOrderId");
CREATE INDEX IF NOT EXISTS "WorkOrder_salesOrderId_idx" ON "WorkOrder"("salesOrderId");
CREATE INDEX IF NOT EXISTS "WorkOrder_lineId_idx" ON "WorkOrder"("lineId");
CREATE INDEX IF NOT EXISTS "Shipment_carrierId_idx" ON "Shipment"("carrierId");

-- 2. A dispatch plan no longer defaults to branch "FWA". The server always names the branch (Phase 2, C-003).
ALTER TABLE "DispatchJob" ALTER COLUMN "locationId" DROP DEFAULT;

-- 3. Value checks. Each is added only if every existing row already passes; otherwise a notice names it.
DO $chk$
DECLARE
  r record;
  bad bigint;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('OrderLine',           'OrderLine_unitPrice_not_negative',          '"unitPrice" >= 0'),
    ('OrderLine',           'OrderLine_extendedPrice_not_negative',      '"extendedPrice" >= 0'),
    ('OrderLine',           'OrderLine_discountPct_range',               '"discountPct" IS NULL OR ("discountPct" >= 0 AND "discountPct" <= 100)'),
    ('Order',               'Order_amounts_not_negative',                '"subtotal" >= 0 AND "taxAmount" >= 0 AND "freightAmount" >= 0 AND "totalAmount" >= 0'),
    ('Order',               'Order_total_identity',                      'abs("totalAmount" - ("subtotal" + "taxAmount" + "freightAmount")) <= 0.005'),
    ('Invoice',             'Invoice_total_identity',                    'abs("totalAmount" - ("subtotal" + "taxAmount" + "freightAmount")) <= 0.005'),
    ('Payment',             'Payment_amount_not_zero',                   '"amount" <> 0'),
    ('QuoteLine',           'QuoteLine_quantity_positive',               '"quantity" > 0'),
    ('QuoteLine',           'QuoteLine_unitPrice_not_negative',          '"unitPrice" >= 0'),
    ('MaterialMovement',    'MaterialMovement_qtyMoved_positive',        '"qtyMoved" > 0'),
    ('OrderLineAllocation', 'OrderLineAllocation_qtyAllocated_positive', '"qtyAllocated" > 0'),
    ('ShipmentItem',        'ShipmentItem_weightLb_not_negative',        '"weightLb" IS NULL OR "weightLb" >= 0'),
    ('Coil',                'Coil_weights_not_negative',                 '("netWeightLb" IS NULL OR "netWeightLb" >= 0) AND ("grossWeightLb" IS NULL OR "grossWeightLb" >= 0)'),
    ('WorkOrder',           'WorkOrder_weights_not_negative',            '("inputWeightLb" IS NULL OR "inputWeightLb" >= 0) AND ("outputWeightLb" IS NULL OR "outputWeightLb" >= 0) AND ("scrapWeightLb" IS NULL OR "scrapWeightLb" >= 0)'),
    ('Job',                 'Job_weights_not_negative',                  '("inputWeightLb" IS NULL OR "inputWeightLb" >= 0) AND ("outputWeightLb" IS NULL OR "outputWeightLb" >= 0) AND ("scrapWeightLb" IS NULL OR "scrapWeightLb" >= 0)')
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

-- 4. Ten plain indexes that repeat a unique index on the same column.
DROP INDEX IF EXISTS "Asset_assetNumber_idx";
DROP INDEX IF EXISTS "AssetType_code_idx";
DROP INDEX IF EXISTS "CustomerPreference_customerId_idx";
DROP INDEX IF EXISTS "CustomerTagRequirement_customerId_idx";
DROP INDEX IF EXISTS "DropTag_dropTagId_idx";
DROP INDEX IF EXISTS "LabelTemplate_code_idx";
DROP INDEX IF EXISTS "MaintenanceOrder_woNumber_idx";
DROP INDEX IF EXISTS "PMTemplate_code_idx";
DROP INDEX IF EXISTS "Package_packageId_idx";
DROP INDEX IF EXISTS "SparePart_partNumber_idx";
