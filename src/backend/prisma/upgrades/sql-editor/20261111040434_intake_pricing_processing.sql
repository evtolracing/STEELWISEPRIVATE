-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111040434_intake_pricing_processing

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

-- 20261111040434_intake_pricing_processing
DO $m_68d76a4a$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111040434_intake_pricing_processing' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111040434_intake_pricing_processing (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_68d76a4a$-- CreateTable
CREATE TABLE "PriceLevel" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceLevel_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "SalesTaxRate" (
    "state" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTaxRate_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "ProcessingOperation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
    "pricePerOp" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priceUnit" TEXT NOT NULL DEFAULT 'EA',
    "machines" JSONB NOT NULL DEFAULT '[]',
    "params" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingOperation_code_key" ON "ProcessingOperation"("code");

-- CreateIndex
CREATE INDEX "ProcessingOperation_division_type_idx" ON "ProcessingOperation"("division", "type");

-- CreateIndex
CREATE INDEX "ProcessingTemplate_division_idx" ON "ProcessingTemplate"("division");
$body_68d76a4a$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '9072836bfc2729b0a7b9a1a57b1bb38aabb0c58934851513126b1121a18473cf', now(), '20261111040434_intake_pricing_processing', 1);
END $m_68d76a4a$;

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
