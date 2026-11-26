-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261125230000_job_board_position

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

-- 20261125230000_job_board_position
DO $m_6b9d65a4$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261125230000_job_board_position' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261125230000_job_board_position (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_6b9d65a4$-- Where a planner has put a job's card within its column of the Production Workflow board (owner, 2026-11-25).
-- One row per arranged job, in a table of its own: nothing else reads it, so the board works without it
-- (cards then keep the order of priority and due date). Safe to run again.
CREATE TABLE IF NOT EXISTS "JobBoardPosition" (
  "jobId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "position" DOUBLE PRECISION NOT NULL,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobBoardPosition_pkey" PRIMARY KEY ("jobId")
);
DO $$ BEGIN
  ALTER TABLE "JobBoardPosition" ADD CONSTRAINT "JobBoardPosition_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
$body_6b9d65a4$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '2b4dc5c629b410a75292b3b77d610167cb799fe9f0c2e8d07a5d5a54706fc3bd', now(), '20261125230000_job_board_position', 1);
END $m_6b9d65a4$;

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
