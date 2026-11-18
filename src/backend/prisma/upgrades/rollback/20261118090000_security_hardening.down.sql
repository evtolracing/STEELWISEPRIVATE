-- Rollback of database update 17 (20261118090000_security_hardening). Paste into the SQL Editor and click Run.
-- Use it only if update 17 must be taken back. Read first:
--   * Switch the server's DATABASE_URL back to the owner connection BEFORE running this, if it was moved
--     to steelwise_runtime. Otherwise the server loses its database connection.
--   * The server code of Phase 10 reads the three sign-in columns. Roll the deployment back to the
--     version before Phase 10 first (Vercel: promote the earlier deployment), then run this.
--   * What is lost: who is paused after wrong passwords, the wrong-password counts, and the session
--     cut-off times. Nothing else. No business or financial row is touched.
-- It can be run more than once.
BEGIN;
DO $down$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM steelwise_runtime';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM steelwise_runtime';
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM steelwise_runtime';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM steelwise_runtime';
    EXECUTE 'REVOKE USAGE ON SCHEMA public FROM steelwise_runtime';
    -- The role is removed only when nothing else in this cluster still uses it.
    BEGIN
      EXECUTE 'DROP ROLE steelwise_runtime';
    EXCEPTION WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'steelwise_runtime still has rights in another database of this cluster; it was kept and has no rights here.';
    END;
  END IF;
END $down$;
ALTER TABLE "User" DROP COLUMN IF EXISTS "tokensValidAfter";
ALTER TABLE "User" DROP COLUMN IF EXISTS "failedLoginCount";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lockedUntil";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261118090000_security_hardening';
COMMIT;
