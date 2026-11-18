-- Phase 10: security hardening.
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
