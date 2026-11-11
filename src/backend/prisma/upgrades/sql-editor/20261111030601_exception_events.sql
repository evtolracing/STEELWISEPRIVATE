-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111030601_exception_events

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

-- 20261111030601_exception_events
DO $m_94832b7e$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111030601_exception_events' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111030601_exception_events (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_94832b7e$-- CreateTable
CREATE TABLE "ExceptionEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "locationId" TEXT,
    "workCenterId" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExceptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExceptionEvent_locationId_occurredAt_idx" ON "ExceptionEvent"("locationId", "occurredAt");

-- CreateIndex
CREATE INDEX "ExceptionEvent_acknowledged_occurredAt_idx" ON "ExceptionEvent"("acknowledged", "occurredAt");
$body_94832b7e$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'b32808e8edb75763e831da71a7e042bfe8c38d43c30bf55178ddc5a541915a2c', now(), '20261111030601_exception_events', 1);
END $m_94832b7e$;

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
