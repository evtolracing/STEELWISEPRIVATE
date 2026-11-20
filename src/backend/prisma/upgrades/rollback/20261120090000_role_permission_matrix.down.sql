-- Takes database update 19 (role permission matrix, phase 1) back out. Only needed if update 19 must be undone.
-- What is lost: the permissions kept on each role and any per-person exceptions. Role rows stay
-- (their names, display names and old "permissions" column are untouched). No user, business or
-- financial row is touched. Until phase 3 the server does not read what this removes.
-- It can be run more than once.
BEGIN;
DROP TABLE IF EXISTS "UserPermissionOverride";
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_audience_check";
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_branchScope_check";
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_grants_array_check";
ALTER TABLE "Role" DROP COLUMN IF EXISTS "grants", DROP COLUMN IF EXISTS "audience", DROP COLUMN IF EXISTS "branchScope", DROP COLUMN IF EXISTS "baseRole", DROP COLUMN IF EXISTS "updatedById";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261120090000_role_permission_matrix';
COMMIT;
