-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111052353_processing_recipes

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

-- 20261111052353_processing_recipes
DO $m_0c259055$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111052353_processing_recipes' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111052353_processing_recipes (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_0c259055$-- CreateTable
CREATE TABLE "ProcessingRecipe" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "operationType" TEXT NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'METALS',
    "workCenter" TEXT,
    "setupMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runMinutesPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minRunMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applicableMaterials" JSONB NOT NULL DEFAULT '[]',
    "applicableForms" JSONB NOT NULL DEFAULT '[]',
    "thicknessMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thicknessMax" DOUBLE PRECISION NOT NULL DEFAULT 99,
    "toleranceClass" TEXT NOT NULL DEFAULT 'STANDARD',
    "pricePerUnit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priceUnit" TEXT NOT NULL DEFAULT 'EA',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeRoutingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'METALS',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeRoutingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingRecipe_code_key" ON "ProcessingRecipe"("code");

-- CreateIndex
CREATE INDEX "ProcessingRecipe_division_operationType_status_idx" ON "ProcessingRecipe"("division", "operationType", "status");
$body_0c259055$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'fe1d0c7b9ba08f2392747d605453b441aa6213ade296b82dcc0727bb881aff28', now(), '20261111052353_processing_recipes', 1);
END $m_0c259055$;

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
