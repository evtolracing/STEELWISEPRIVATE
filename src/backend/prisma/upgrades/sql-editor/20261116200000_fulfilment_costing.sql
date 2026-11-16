-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261116200000_fulfilment_costing

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

-- 20261116200000_fulfilment_costing
DO $m_2494e4f5$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261116200000_fulfilment_costing' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261116200000_fulfilment_costing (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_2494e4f5$-- Phase 8: shipping, delivery and the cost of what is sold (findings N-004, N-015, N-017).
-- Adds three empty columns, one check and one index. Nothing is removed, and no existing row changes value.
--
-- 1. What one unit cost when it moved (N-017). Written from now on when material ships or comes back.
--    Movements already on file keep an empty cost: none is worked out after the fact.
ALTER TABLE "MaterialMovement" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(18,6);

-- 2. Why a delivery has no name and no image (N-004).
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "noPodReason" TEXT;

-- 3. The branch a print job is for (N-015). Rows already on file stay visible to every branch.
ALTER TABLE "PrintQueueJob" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
CREATE INDEX IF NOT EXISTS "PrintQueueJob_locationId_status_idx" ON "PrintQueueJob"("locationId", "status");

DO $p8$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaterialMovement_unitCost_not_negative') THEN
    ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_unitCost_not_negative" CHECK ("unitCost" IS NULL OR "unitCost" >= 0);
  END IF;
END
$p8$;
$body_2494e4f5$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '91c72539765f8a0f04cf9b06706cf30d51587371671c2a11995c179e4c7590f5', now(), '20261116200000_fulfilment_costing', 1);
END $m_2494e4f5$;

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
