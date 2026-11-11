-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111021952_stop_work_events

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

-- 20261111021952_stop_work_events
DO $m_e99af511$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111021952_stop_work_events' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111021952_stop_work_events (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_e99af511$-- CreateTable
CREATE TABLE "StopWorkEvent" (
    "id" TEXT NOT NULL,
    "eventNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopWorkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkAudit" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopWorkAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkStep" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopWorkStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkEvidence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopWorkEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StopWorkEvent_eventNumber_key" ON "StopWorkEvent"("eventNumber");

-- CreateIndex
CREATE INDEX "StopWorkEvent_status_idx" ON "StopWorkEvent"("status");

-- CreateIndex
CREATE INDEX "StopWorkEvent_initiatedAt_idx" ON "StopWorkEvent"("initiatedAt");

-- CreateIndex
CREATE INDEX "StopWorkAudit_eventId_performedAt_idx" ON "StopWorkAudit"("eventId", "performedAt");

-- CreateIndex
CREATE INDEX "StopWorkStep_eventId_idx" ON "StopWorkStep"("eventId");

-- CreateIndex
CREATE INDEX "StopWorkEvidence_eventId_idx" ON "StopWorkEvidence"("eventId");
$body_e99af511$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '2f40b0d00f93f20d974320713c1b9b510757bab1b10ff1ac338d29c6eeca08c8', now(), '20261111021952_stop_work_events', 1);
END $m_e99af511$;

-- Row Level Security on every table (blocks Supabase's public API keys;
-- the app connects as the table owner and is not affected).
DO $rls$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $rls$;

COMMIT;
