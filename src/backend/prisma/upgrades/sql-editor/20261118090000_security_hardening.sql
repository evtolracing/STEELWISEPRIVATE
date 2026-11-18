-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261118090000_security_hardening

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

-- 20261118090000_security_hardening
DO $m_fd902ec4$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261118090000_security_hardening' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261118090000_security_hardening (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_fd902ec4$-- Phase 10: security hardening.
--
-- 1. Sign-in (Y-001, Y-002). Three columns on "User":
--    "tokensValidAfter"  a sign-in token issued before this moment is refused. Set when a password is
--                        changed or reset, when a login is switched off, and by "sign out everywhere".
--    "failedLoginCount"  wrong passwords in a row; set back to 0 by a correct one.
--    "lockedUntil"       after 10 wrong passwords in a row, no sign-in for this account until then,
--                        whatever address the attempts come from.
--    No existing row changes value: the new columns start empty or at 0.
--
-- 2. A database role for the running application (W-014, Y-009): "steelwise_runtime".
--    It can read and write rows, and nothing else: it does not own the tables, so it cannot switch off
--    or drop the ledger's triggers, truncate a table, change the schema or bypass the journal's rules.
--    The history (AuditLog) can be added to and read by it, never changed or deleted.
--    The role is created without a password and cannot sign in. Using it is a separate step for the
--    owner: give it a password and LOGIN, then point the server's DATABASE_URL at it
--    (see qa/enterprise-excellence/phase-10-database-security.md). Until then nothing changes.
--    Migrations keep running as the table owner.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokensValidAfter" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

DO $runtime_role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN
    CREATE ROLE steelwise_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END $runtime_role$;

GRANT USAGE ON SCHEMA public TO steelwise_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO steelwise_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO steelwise_runtime;
-- Tables and sequences made later by the same owner get the same rights.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO steelwise_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO steelwise_runtime;

-- The history is append-only for the application.
REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM steelwise_runtime;
-- Nothing the application does needs to rewrite the record of applied migrations.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON "_prisma_migrations" FROM steelwise_runtime;
$body_fd902ec4$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '0790e049adf8331acf1de8752d586af54a53c80b1aaf3959c7f41eebf30aef0f', now(), '20261118090000_security_hardening', 1);
END $m_fd902ec4$;

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
