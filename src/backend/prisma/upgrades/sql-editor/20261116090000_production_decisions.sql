-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261116090000_production_decisions

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

-- 20261116090000_production_decisions
DO $m_79da2d17$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261116090000_production_decisions' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261116090000_production_decisions (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_79da2d17$-- Phase 7, the owner's decisions of 2026-11-15 (findings L-020, L-021, L-022, L-024, L-026, L-028, K-007).
-- Adds columns, checks and indexes only. Nothing is removed, and no existing row changes value.
--
-- 1. A coil work order can name the job it was raised for (L-024), so a job knows its material, scrap and yield.
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
CREATE INDEX IF NOT EXISTS "WorkOrder_jobId_idx" ON "WorkOrder"("jobId");

-- 2. A rework step names the failed inspection it answers (L-020).
ALTER TABLE "DispatchOperation" ADD COLUMN IF NOT EXISTS "reworkOfInspectionId" TEXT;
CREATE INDEX IF NOT EXISTS "DispatchOperation_reworkOfInspectionId_idx" ON "DispatchOperation"("reworkOfInspectionId");

-- 3. Every job is inspected unless its routing says otherwise (L-021). Existing routings keep inspection on.
ALTER TABLE "BomRecipe" ADD COLUMN IF NOT EXISTS "inspectionRequired" BOOLEAN NOT NULL DEFAULT true;

-- 4. Rules and rates per kind of work center (L-022, L-026, L-028). All off or empty until someone sets them.
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "certificationRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "allowsConcurrentSteps" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(12,2);
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "inspectionChecklist" JSONB;

DO $p7$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOrder_jobId_fkey') THEN
    ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DispatchOperation_reworkOfInspectionId_fkey') THEN
    ALTER TABLE "DispatchOperation" ADD CONSTRAINT "DispatchOperation_reworkOfInspectionId_fkey" FOREIGN KEY ("reworkOfInspectionId") REFERENCES "JobInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkCenterType_hourlyRate_not_negative') THEN
    ALTER TABLE "WorkCenterType" ADD CONSTRAINT "WorkCenterType_hourlyRate_not_negative" CHECK ("hourlyRate" IS NULL OR "hourlyRate" >= 0);
  END IF;
END
$p7$;
$body_79da2d17$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '5a717c75efd0386ac2ba4ed40a5fe1b0eb665d259d85c1aaa43705627fb933af', now(), '20261116090000_production_decisions', 1);
END $m_79da2d17$;

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
