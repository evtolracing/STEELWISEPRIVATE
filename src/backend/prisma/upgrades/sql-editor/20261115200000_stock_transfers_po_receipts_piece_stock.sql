-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261115200000_stock_transfers_po_receipts_piece_stock

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

-- 20261115200000_stock_transfers_po_receipts_piece_stock
DO $m_23d15b4e$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261115200000_stock_transfers_po_receipts_piece_stock' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261115200000_stock_transfers_po_receipts_piece_stock (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_23d15b4e$-- Phase 6: material in transit, receipts against purchase order lines, and stock counted by the piece.
-- Adds tables, columns and checks only. Nothing is removed, and no existing row changes value.
--
-- 1. Material in a truck between branches (finding G-007). A transfer document with its lines,
--    and an in-transit quantity on the stock balance: off the sender's shelf, not yet on the receiver's.
ALTER TABLE "Inventory" ADD COLUMN IF NOT EXISTS "qtyInTransit" DECIMAL(65,30) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "StockTransfer" (
    "id"             TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId"   TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'SHIPPED',
    "carrier"        TEXT,
    "reference"      TEXT,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById"    TEXT NOT NULL,
    "shippedAt"      TIMESTAMP(3),
    "shippedById"    TEXT,
    "receivedAt"     TIMESTAMP(3),
    "receivedById"   TEXT,
    "cancelledAt"    TIMESTAMP(3),
    "cancelledById"  TEXT,
    "cancelReason"   TEXT,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");
CREATE INDEX IF NOT EXISTS "StockTransfer_fromLocationId_status_idx" ON "StockTransfer"("fromLocationId", "status");
CREATE INDEX IF NOT EXISTS "StockTransfer_toLocationId_status_idx" ON "StockTransfer"("toLocationId", "status");
CREATE INDEX IF NOT EXISTS "StockTransfer_createdById_idx" ON "StockTransfer"("createdById");

CREATE TABLE IF NOT EXISTS "StockTransferLine" (
    "id"          TEXT NOT NULL,
    "transferId"  TEXT NOT NULL,
    "coilId"      TEXT NOT NULL,
    "qtyShipped"  DECIMAL(65,30) NOT NULL,
    "qtyReceived" DECIMAL(65,30),
    "unit"        TEXT NOT NULL DEFAULT 'LB',
    "condition"   TEXT,
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockTransferLine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StockTransferLine_transferId_coilId_key" ON "StockTransferLine"("transferId", "coilId");
CREATE INDEX IF NOT EXISTS "StockTransferLine_coilId_idx" ON "StockTransferLine"("coilId");

-- 2. A receipt names the purchase order line it fills (finding I-007, in part: matching only).
ALTER TABLE "MaterialMovement" ADD COLUMN IF NOT EXISTS "orderLineId" TEXT;
CREATE INDEX IF NOT EXISTS "MaterialMovement_orderLineId_idx" ON "MaterialMovement"("orderLineId");

-- 3. Shelf goods counted by the piece (finding C-011): a supply item (gloves, discs) has no heat or grade.
--    Every other form still needs both, now held by a database check instead of by the column alone.
ALTER TABLE "Coil" ALTER COLUMN "heatId" DROP NOT NULL;
ALTER TABLE "Coil" ALTER COLUMN "gradeId" DROP NOT NULL;

DO $p6$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_fromLocationId_fkey') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_toLocationId_fkey') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_createdById_fkey') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransferLine_transferId_fkey') THEN
    ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransferLine_coilId_fkey') THEN
    ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_coilId_fkey" FOREIGN KEY ("coilId") REFERENCES "Coil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaterialMovement_orderLineId_fkey') THEN
    ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_branches_differ') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_branches_differ" CHECK ("fromLocationId" <> "toLocationId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransfer_status_known') THEN
    ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_status_known" CHECK ("status" IN ('SHIPPED', 'RECEIVED', 'CANCELLED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockTransferLine_quantities') THEN
    ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_quantities" CHECK ("qtyShipped" > 0 AND ("qtyReceived" IS NULL OR "qtyReceived" >= 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_qtyInTransit_not_negative') THEN
    ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_qtyInTransit_not_negative" CHECK ("qtyInTransit" >= 0);
  END IF;
  -- The balance identity now counts what is on the road. Every existing row has 0 in transit, so it still holds.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_balance_identity')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_balance_identity' AND pg_get_constraintdef(oid) LIKE '%qtyInTransit%') THEN
    ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_balance_identity";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_balance_identity') THEN
    ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_balance_identity" CHECK (abs("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold" + "qtyInTransit")) <= 0.0001);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Coil_heat_and_grade_unless_supply') THEN
    ALTER TABLE "Coil" ADD CONSTRAINT "Coil_heat_and_grade_unless_supply" CHECK ("form" = 'SUPPLY' OR ("heatId" IS NOT NULL AND "gradeId" IS NOT NULL));
  END IF;
END
$p6$;
$body_23d15b4e$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'a83b983b9a506f4bb43b07de6d9c1d508026d1618af98d7facf77b1b2f56f1c7', now(), '20261115200000_stock_transfers_po_receipts_piece_stock', 1);
END $m_23d15b4e$;

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
