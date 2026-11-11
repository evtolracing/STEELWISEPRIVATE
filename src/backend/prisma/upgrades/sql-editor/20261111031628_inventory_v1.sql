-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111031628_inventory_v1

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

-- 20261111031628_inventory_v1
DO $m_545c8bc3$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111031628_inventory_v1' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111031628_inventory_v1 (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_545c8bc3$-- CreateTable
CREATE TABLE "InventoryCatalogItem" (
    "materialCode" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCatalogItem_pkey" PRIMARY KEY ("materialCode")
);

-- CreateTable
CREATE TABLE "InventorySite" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryUnit" (
    "id" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rfidTagId" TEXT,
    "etchedId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidScanEvent" (
    "id" TEXT NOT NULL,
    "rfidTagId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "RfidScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryUnit_locationId_materialCode_idx" ON "InventoryUnit"("locationId", "materialCode");

-- CreateIndex
CREATE INDEX "InventoryUnit_rfidTagId_idx" ON "InventoryUnit"("rfidTagId");

-- CreateIndex
CREATE INDEX "InventoryUnit_etchedId_idx" ON "InventoryUnit"("etchedId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_status_idx" ON "InventoryTransfer"("status");

-- CreateIndex
CREATE INDEX "RfidScanEvent_rfidTagId_occurredAt_idx" ON "RfidScanEvent"("rfidTagId", "occurredAt");

-- CreateIndex
CREATE INDEX "RfidScanEvent_inventoryId_idx" ON "RfidScanEvent"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_inventoryId_idx" ON "InventoryAdjustment"("inventoryId");
$body_545c8bc3$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '836948be1cb5ab90f0255125b9f38557ccca6f23e9913f9d5a329ba151262df6', now(), '20261111031628_inventory_v1', 1);
END $m_545c8bc3$;

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
