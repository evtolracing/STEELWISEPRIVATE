-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113190000_order_branch

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

-- 20261113190000_order_branch
DO $m_7bb30a65$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113190000_order_branch' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113190000_order_branch (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_7bb30a65$-- The branch that owns an order (finding B-003, owner's decision 2 of 2026-11-13:
-- staff see and change only their own branch's records).
-- Adds one optional column. Nothing is removed or rewritten.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_locationId_idx" ON "Order"("locationId");
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_locationId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$fk$;

-- Existing orders: the branch it shipped from if it has a shipment, otherwise the home
-- branch of the person who entered it. An order with neither stays without a branch and
-- is seen only by roles that see every branch, until someone assigns it.
UPDATE "Order" o SET "locationId" = s."fromLocationId"
  FROM (SELECT DISTINCT ON ("orderId") "orderId", "fromLocationId" FROM "Shipment" WHERE "orderId" IS NOT NULL ORDER BY "orderId", "createdAt") s
 WHERE s."orderId" = o.id AND o."locationId" IS NULL;
UPDATE "Order" o SET "locationId" = u."homeLocationId"
  FROM "User" u
 WHERE u.id = o."createdById" AND o."locationId" IS NULL AND u."homeLocationId" IS NOT NULL;
$body_7bb30a65$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'ef5b54e937cb2fec818e0e330de2eccf6b25292609d4d99fb692099817b1bad1', now(), '20261113190000_order_branch', 1);
END $m_7bb30a65$;

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
