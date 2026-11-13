-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113150000_stock_balance_identity

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

-- 20261113150000_stock_balance_identity
DO $m_2b7bb72b$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113150000_stock_balance_identity' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113150000_stock_balance_identity (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_2b7bb72b$-- Stock balance identity (finding E-020): for every stock balance,
--   on hand = available + reserved + on hold
-- Every code path that changes a balance moves these figures together; from
-- now on the database refuses a row where they do not add up, so a future
-- change cannot break the identity unnoticed.
-- Added only if every existing row already satisfies it; otherwise it is
-- skipped with a notice so nothing that works today starts failing.
DO $chk$
DECLARE
  bad bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inventory_balance_identity') THEN RETURN; END IF;
  SELECT count(*) INTO bad FROM "Inventory"
   WHERE NOT (abs("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold")) <= 0.0001);
  IF bad > 0 THEN
    RAISE NOTICE 'Check Inventory_balance_identity skipped: % existing row(s) in "Inventory" do not add up', bad;
  ELSE
    ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_balance_identity"
      CHECK (abs("qtyOnHand" - ("qtyAvailable" + "qtyAllocated" + "qtyOnHold")) <= 0.0001);
  END IF;
END
$chk$;
$body_2b7bb72b$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '7c1e2d1ffa9dadce8ce987ad8a2eff12c23338eeae098b47454c6cfcd9dc2cd5', now(), '20261113150000_stock_balance_identity', 1);
END $m_2b7bb72b$;

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
