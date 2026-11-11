-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111053542_analytics_settings

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

-- 20261111053542_analytics_settings
DO $m_33fbc58d$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111053542_analytics_settings' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111053542_analytics_settings (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_33fbc58d$-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "DemandSuggestionEvent" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "savingsAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "source" TEXT,
    "branchKey" TEXT,
    "orderId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSuggestionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandSuggestionEvent_createdAt_idx" ON "DemandSuggestionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DemandSuggestionEvent_suggestionId_idx" ON "DemandSuggestionEvent"("suggestionId");
$body_33fbc58d$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '6bc98560c54b0b2a12aa281c839ff1c78a9763930684da2778464a61e4f0e297', now(), '20261111053542_analytics_settings', 1);
END $m_33fbc58d$;

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
