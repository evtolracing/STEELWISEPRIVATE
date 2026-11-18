-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261118150000_shared_rate_limits

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

-- 20261118150000_shared_rate_limits
DO $m_dcb1e5f5$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261118150000_shared_rate_limits' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261118150000_shared_rate_limits (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_dcb1e5f5$-- Phase 11: request limits counted once for every server copy (E-014, Z-007).
--
-- The sign-in limit per address and the partner API limits were counted in the memory of each server
-- copy. With several copies running (every hosted function instance is one), a caller got the limit
-- once per copy. "RateWindow" holds the count of one limit in one window of time, so every copy adds
-- to the same number. Rows are small, short-lived, and removed by the scheduled run two hours after
-- their window began. No existing table or row is changed.
--
-- Until this update is applied the server keeps counting per copy, as before, and says so once in its log.

CREATE TABLE IF NOT EXISTS "RateWindow" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RateWindow_pkey" PRIMARY KEY ("key", "windowStart")
);
CREATE INDEX IF NOT EXISTS "RateWindow_windowStart_idx" ON "RateWindow" ("windowStart");

-- The application's own role (update 17) reads and writes rows of this table like any other.
DO $rate_window_grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "RateWindow" TO steelwise_runtime;
  END IF;
END
$rate_window_grant$;
$body_dcb1e5f5$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '1852da56927579f08d0d13d2a8b3b78c664350ef542e2f2c0e7b0dd6fd603f59', now(), '20261118150000_shared_rate_limits', 1);
END $m_dcb1e5f5$;

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
