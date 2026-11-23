-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261122230000_release_stock_of_cancelled_test_orders

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

-- 20261122230000_release_stock_of_cancelled_test_orders
DO $m_c0d48dae$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261122230000_release_stock_of_cancelled_test_orders' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261122230000_release_stock_of_cancelled_test_orders (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_c0d48dae$-- Gives back to stock what the cancelled test orders still had reserved. Follows
-- 20261122213000_retire_test_orders_and_demo_locations, which cancelled the orders but left their
-- reservations in place, so that stock stayed "reserved" for orders that will never ship.
-- Only reservations of orders carrying that clean-up's own note are touched. The reservation rows are removed,
-- exactly as the Cancel button removes them (routes/orders.js, releaseAllocations): a reservation is a hold on
-- stock, not a record of something that happened, and the database refuses a reservation of zero. Every order,
-- order line, stock record and piece stays on file. Running it again changes nothing.
WITH held AS (
  SELECT a."id", a."coilId", a."qtyAllocated"
  FROM "OrderLineAllocation" a
  JOIN "OrderLine" ol ON ol."id" = a."orderLineId"
  JOIN "Order" o ON o."id" = ol."orderId"
  WHERE a."qtyAllocated" > 0
    AND o."status" = 'CANCELLED'
    AND o."notes" LIKE '%Cancelled: test data cleared before the real locations (2026-11-22).%'
),
per_coil AS (
  SELECT "coilId", sum("qtyAllocated") AS qty FROM held GROUP BY "coilId"
),
-- The stock record: reserved goes down and available goes up by the same amount, never below zero reserved.
stock AS (
  UPDATE "Inventory" i
  SET "qtyAllocated" = i."qtyAllocated" - LEAST(p.qty, i."qtyAllocated"),
      "qtyAvailable" = i."qtyAvailable" + LEAST(p.qty, i."qtyAllocated"),
      "updatedAt" = now()
  FROM per_coil p
  WHERE i."coilId" = p."coilId"
  RETURNING i."coilId"
),
released AS (
  DELETE FROM "OrderLineAllocation" a USING held h WHERE a."id" = h."id"
  RETURNING a."coilId"
)
-- A piece marked as reserved goes back to available when no other order still holds any of it.
UPDATE "Coil" c
SET "status" = 'AVAILABLE', "updatedAt" = now()
WHERE c."status" = 'ALLOCATED'
  AND c."id" IN (SELECT "coilId" FROM per_coil)
  AND NOT EXISTS (
    SELECT 1 FROM "OrderLineAllocation" other
    WHERE other."coilId" = c."id" AND other."qtyAllocated" > 0
      AND other."id" NOT IN (SELECT "id" FROM held)
  );
$body_c0d48dae$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'ac997359285874db0cc31847e3c5c5b22e2d78363118ac4de51d1e3ca8915ff0', now(), '20261122230000_release_stock_of_cancelled_test_orders', 1);
END $m_c0d48dae$;

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
