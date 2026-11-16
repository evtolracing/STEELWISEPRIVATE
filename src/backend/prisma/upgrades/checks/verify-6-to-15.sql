-- Read-only. Changes nothing. Paste into the SQL Editor and click Run.
-- Every row should say APPLIED and every check should say OK.
SELECT f.file, f.name,
       CASE WHEN m.finished_at IS NOT NULL THEN 'APPLIED' ELSE 'MISSING' END AS result
FROM (VALUES
  (6,  '20261113210000_reference_integrity'),
  (7,  '20261113211000_request_keys'),
  (8,  '20261113212000_quote_branch'),
  (9,  '20261113220000_document_counters'),
  (10, '20261113230000_webhook_delivery_once'),
  (11, '20261115090000_voided_counter_sales_cancelled'),
  (12, '20261115200000_stock_transfers_po_receipts_piece_stock'),
  (13, '20261116090000_production_decisions'),
  (14, '20261116200000_fulfilment_costing'),
  (15, '20261116230000_shipment_lost')
) AS f(file, name)
LEFT JOIN "_prisma_migrations" m ON m.migration_name = f.name
UNION ALL
SELECT 100, 'check: tables RequestKey, DocumentCounter, StockTransfer, StockTransferLine',
       CASE WHEN (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'
                  AND table_name IN ('RequestKey', 'DocumentCounter', 'StockTransfer', 'StockTransferLine')) = 4
            THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 101, 'check: column Inventory.qtyInTransit',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
                         AND table_name = 'Inventory' AND column_name = 'qtyInTransit')
            THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 102, 'check: balance rule counts stock in transit',
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_balance_identity'
                         AND pg_get_constraintdef(oid) LIKE '%qtyInTransit%')
            THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 103, 'check: updates that started and did not finish',
       CASE WHEN (SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NULL) = 0
            THEN 'OK' ELSE 'FOUND SOME' END
UNION ALL
SELECT 104, 'check: the seven columns of file 13 (job on a work order, rework step, routing inspection, four on kinds of work center)',
       CASE WHEN (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND (table_name, column_name) IN (
                    ('WorkOrder', 'jobId'), ('DispatchOperation', 'reworkOfInspectionId'), ('BomRecipe', 'inspectionRequired'),
                    ('WorkCenterType', 'certificationRequired'), ('WorkCenterType', 'allowsConcurrentSteps'),
                    ('WorkCenterType', 'hourlyRate'), ('WorkCenterType', 'inspectionChecklist'))) = 7
            THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 105, 'check: the three columns of file 14 (cost on a stock movement, why a delivery has no name, branch of a print job)',
       CASE WHEN (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND (table_name, column_name) IN (
                    ('MaterialMovement', 'unitCost'), ('Shipment', 'noPodReason'), ('PrintQueueJob', 'locationId'))) = 3
            THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 106, 'check: a shipment can be ended as lost (file 15)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'ShipmentStatus' AND e.enumlabel = 'LOST')
            THEN 'OK' ELSE 'MISSING' END
ORDER BY 1;
