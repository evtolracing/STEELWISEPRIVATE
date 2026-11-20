-- Takes database update 20 (role matrix, phase 4) back out. Only needed if update 20 must be undone.
-- What is lost: which people have a custom role as their main role. Each of them is left with the
-- built-in role in "User"."role" (the one the custom role stands on). No user, role, business or
-- financial row is touched. It can be run more than once.
BEGIN;
DROP TABLE IF EXISTS "UserPrimaryRole";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261121090000_user_primary_role';
COMMIT;
