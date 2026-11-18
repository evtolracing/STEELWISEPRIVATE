-- Takes database update 18 (shared request limits) back out. Only needed if update 18 must be undone.
-- What is lost: the request-limit counts of the last two hours. Nothing else. No business or
-- financial row is touched. The server then counts request limits per server copy again, as before.
-- It can be run more than once.
BEGIN;
DROP TABLE IF EXISTS "RateWindow";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261118150000_shared_rate_limits';
COMMIT;
