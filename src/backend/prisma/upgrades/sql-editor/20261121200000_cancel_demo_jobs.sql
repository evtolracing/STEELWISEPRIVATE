-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261121200000_cancel_demo_jobs

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

-- 20261121200000_cancel_demo_jobs
DO $m_5a8f5b9a$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261121200000_cancel_demo_jobs' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261121200000_cancel_demo_jobs (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_5a8f5b9a$-- Cancel the jobs left over from the hidden Alro demo (owner's decision, 2026-11-21).
-- They are J-DEMO-001 to J-DEMO-010 and J-C2007: no route, no branch of their own, never worked,
-- yet marked Scheduled (one In process), so every board counted them as open work.
-- Only those numbers are touched, and only while they are still open and have no plan, no time
-- on the clock and nothing shipped. Their orders are left as they are. Running it again changes nothing.
UPDATE "Job" AS j
SET "status" = 'CANCELLED',
    "notes" = CASE WHEN j."notes" IS NULL OR j."notes" = '' THEN 'Cancelled: left over from the demo data (2026-11-21).'
                   ELSE j."notes" || E'\nCancelled: left over from the demo data (2026-11-21).' END,
    "updatedAt" = now()
WHERE (j."jobNumber" LIKE 'J-DEMO-%' OR j."jobNumber" = 'J-C2007')
  AND j."status" NOT IN ('SHIPPED', 'COMPLETED', 'CANCELLED')
  AND NOT EXISTS (SELECT 1 FROM "DispatchJob" d WHERE d."jobId" = j."id");
$body_5a8f5b9a$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'f2aaa9011a4ff23c7389becb255e82ad3ad7a8d46773dff2b13d04ab69c29999', now(), '20261121200000_cancel_demo_jobs', 1);
END $m_5a8f5b9a$;

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
