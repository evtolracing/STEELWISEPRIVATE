-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261126090800_working_inventory_9_retire_demo

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

-- 20261126090800_working_inventory_9_retire_demo
DO $m_91af07e9$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261126090800_working_inventory_9_retire_demo' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261126090800_working_inventory_9_retire_demo (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_91af07e9$-- Working inventory, part 9 of 10: the demo catalog comes off the shelves and out of the store (owner, 2026-11-26: "getting rid of any mock
-- data in these areas"). Run it after parts 1 to 8.
-- - The 12 demo and sample products are switched off and hidden from the online store. One that nothing points to is deleted.
-- - Demo stock (tag numbers starting DEMO- or COIL-) that is free, not reserved, not on the road and not in a job is taken off the shelf:
--   its balance goes to zero with an adjustment line in its history, and it leaves the stock lists. Its history stays.
--   Demo stock that is reserved, in a job or on the road is left as it is; the check file lists it.
-- - The 10 demo Steel Outlet pieces are deleted, unless one is reserved for an order.
-- Customers, orders, jobs and shipments are not touched. Safe to run twice.

UPDATE "Product" SET "isActive" = false, "updatedAt" = now() WHERE "sku" IN ('HR-A36-PL', 'CR-1018-BR', 'SS-304-SH', 'AL-6061-PL', 'HR-A572-PL', 'HDPE-SH-NAT', 'UHMW-ROD-WH', 'WG-25', 'CUT-DISC-9', 'REM-A36-PL', 'HRC-A36-048', 'CRC-A36-060') AND "isActive" = true;
UPDATE "StoreListing" sl SET "visible" = false, "updatedAt" = now() FROM "Product" p WHERE p.id = sl."productId" AND p."sku" IN ('HR-A36-PL', 'CR-1018-BR', 'SS-304-SH', 'AL-6061-PL', 'HR-A572-PL', 'HDPE-SH-NAT', 'UHMW-ROD-WH', 'WG-25', 'CUT-DISC-9', 'REM-A36-PL', 'HRC-A36-048', 'CRC-A36-060') AND sl."visible" = true;
DELETE FROM "Product" p
WHERE p."sku" IN ('HR-A36-PL', 'CR-1018-BR', 'SS-304-SH', 'AL-6061-PL', 'HR-A572-PL', 'HDPE-SH-NAT', 'UHMW-ROD-WH', 'WG-25', 'CUT-DISC-9', 'REM-A36-PL', 'HRC-A36-048', 'CRC-A36-060')
  AND NOT EXISTS (SELECT 1 FROM "Coil" c WHERE c."productId" = p.id)
  AND NOT EXISTS (SELECT 1 FROM "OrderLine" o WHERE o."productId" = p.id)
  AND NOT EXISTS (SELECT 1 FROM "QuoteLine" q WHERE q."productId" = p.id);

WITH retired AS (
  SELECT c.id, c."coilNumber", c."locationId", i."qtyOnHand", i.unit, c."unitCost"
  FROM "Coil" c
  JOIN "Inventory" i ON i."coilId" = c.id
  WHERE (c."coilNumber" LIKE 'DEMO-%' OR c."coilNumber" LIKE 'COIL-%')
    AND c."status" IN ('AVAILABLE', 'HOLD')
    AND i."qtyOnHand" > 0 AND i."qtyAllocated" = 0 AND i."qtyInTransit" = 0
    AND NOT EXISTS (SELECT 1 FROM "OrderLineAllocation" a WHERE a."coilId" = c.id)
    AND NOT EXISTS (SELECT 1 FROM "WorkOrder" w WHERE w."sourceCoilId" = c.id)
),
moved AS (
  INSERT INTO "MaterialMovement" ("id", "coilId", "movementType", "fromLocationId", "qtyMoved", "unit", "reasonCode", "notes", "unitCost", "createdAt", "createdById")
  SELECT gen_random_uuid()::text, r.id, 'ADJUST'::"MovementType", r."locationId", r."qtyOnHand", r.unit, 'DEMO_RETIRED',
         'Demo stock taken off the shelf: replaced by the working inventory (2026-11-26).', r."unitCost", now(), (SELECT id FROM "User" ORDER BY "createdAt", id LIMIT 1)
  FROM retired r
  RETURNING "coilId"
),
zeroed AS (
  UPDATE "Inventory" i SET "qtyOnHand" = 0, "qtyAvailable" = 0, "qtyOnHold" = 0, "status" = 'RETIRED', "lastMovement" = now(), "updatedAt" = now()
  FROM retired r WHERE i."coilId" = r.id
  RETURNING i."coilId"
),
closed AS (
  UPDATE "Coil" c SET "status" = 'CONSUMED', "updatedAt" = now() FROM retired r WHERE c.id = r.id RETURNING c.id
)
INSERT INTO "AuditLog" ("id", "category", "eventType", "severity", "resourceType", "resourceId", "action", "details", "timestamp")
SELECT gen_random_uuid()::text, 'DATA', 'DEMO_STOCK_RETIRED', 'INFO', 'Coil', r.id, 'UPDATE',
       jsonb_build_object('coilNumber', r."coilNumber", 'qty', r."qtyOnHand", 'unit', r.unit, 'note', 'Demo stock taken off the shelf (2026-11-26).'), now()
FROM retired r
WHERE EXISTS (SELECT 1 FROM moved) AND EXISTS (SELECT 1 FROM zeroed) AND EXISTS (SELECT 1 FROM closed);

DELETE FROM "Remnant" WHERE "id" IN ('rem-001', 'rem-002', 'rem-003', 'rem-004', 'rem-005', 'rem-006', 'rem-007', 'rem-008', 'rem-009', 'rem-010') AND "reserved" = false;
$body_91af07e9$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '4527b33ec6bb85bf0e327f3bfba1052168fa109d676054f4d796aaaa649cc582', now(), '20261126090800_working_inventory_9_retire_demo', 1);
END $m_91af07e9$;

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
