-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261121090000_user_primary_role

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

-- 20261121090000_user_primary_role
DO $m_85f9e48a$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261121090000_user_primary_role' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261121090000_user_primary_role (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_85f9e48a$-- Role matrix, phase 4: a custom role as a person's main role.
-- Adds one table and removes nothing. It can be run more than once.
-- A login with no row here keeps the built-in role named in "User"."role", exactly as before.
CREATE TABLE IF NOT EXISTS "UserPrimaryRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "setById" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPrimaryRole_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "UserPrimaryRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPrimaryRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserPrimaryRole_roleId_idx" ON "UserPrimaryRole" ("roleId");

-- The application's own role (update 17) reads and writes rows of this table like any other.
DO $user_primary_role_grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "UserPrimaryRole" TO steelwise_runtime;
  END IF;
END
$user_primary_role_grant$;
$body_85f9e48a$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '4c2881bbee090a7253c804e47bf8f9da135880e907a30bc3dd5187b6ad988835', now(), '20261121090000_user_primary_role', 1);
END $m_85f9e48a$;

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
