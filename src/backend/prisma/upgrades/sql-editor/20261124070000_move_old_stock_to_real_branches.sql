-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261124070000_move_old_stock_to_real_branches

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

-- 20261124070000_move_old_stock_to_real_branches
DO $m_70d4fceb$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261124070000_move_old_stock_to_real_branches' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261124070000_move_old_stock_to_real_branches (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_70d4fceb$-- Stock that still sits at a switched-off placeholder location moves to a real branch (owner, 2026-11-23:
-- "change all the old location information to the new correct locations in the inventory").
-- The placeholder locations were switched off on 2026-11-22, but their stock stayed there, so no real branch
-- had anything to cut and the work order material list was empty in every branch.
--
--   old location                                      -> real branch
--   DEMO-JAX Jackson Service Center, JAX-WH Jackson   -> JX Jackson Steel
--   DET-A Detroit Bay A, DEMO-DET, DEMO-KZO           -> BC Battle Creek
--   DET-B Detroit Bay B                               -> PV Potterville
--   GR-YARD Grand Rapids Yard, DEMO-GR                -> L2 Lansing Steel
--   WH-MAIN Main Warehouse                            -> CT Charlotte
--
-- What moves: stock items, their stock balances, loose stock units and packages. The bin, weights, status,
-- reservations and holds are left exactly as they are. History (movements, transfers, shipments, ledger) is not
-- rewritten: it still says where things were at the time. Each stock item moved gets a line in the audit log.
-- A row moves only when its real branch is on file and switched on, and only from a placeholder made before the
-- real locations, so nothing else is touched. Running it again changes nothing.

CREATE TEMP TABLE "_stock_move" ON COMMIT DROP AS
SELECT o."id" AS "oldId", o."code" AS "oldCode", n."id" AS "newId", n."code" AS "newCode"
FROM (VALUES
  ('DEMO-JAX', 'JX'), ('JAX-WH', 'JX'),
  ('DET-A', 'BC'), ('DEMO-DET', 'BC'), ('DEMO-KZO', 'BC'),
  ('DET-B', 'PV'),
  ('GR-YARD', 'L2'), ('DEMO-GR', 'L2'),
  ('WH-MAIN', 'CT')
) AS m(old_code, new_code)
JOIN "Location" o ON o."code" = m.old_code AND o."createdAt" < TIMESTAMP '2026-11-22 21:30:00'
JOIN "Location" n ON n."code" = m.new_code AND n."isActive" = true AND n."isBranch" = true;

-- Stock items, with one audit line each.
WITH moved AS (
  UPDATE "Coil" AS c
  SET "locationId" = m."newId", "updatedAt" = now()
  FROM "_stock_move" m
  WHERE c."locationId" = m."oldId"
  RETURNING c."id", c."coilNumber", m."oldCode", m."newCode"
)
INSERT INTO "AuditLog" ("id", "category", "eventType", "severity", "resourceType", "resourceId", "action", "details", "timestamp")
SELECT gen_random_uuid()::text, 'DATA', 'STOCK_LOCATION_CORRECTED', 'INFO', 'Coil', moved."id", 'UPDATE',
       jsonb_build_object('coilNumber', moved."coilNumber", 'from', moved."oldCode", 'to', moved."newCode",
                          'note', 'Moved from a switched-off placeholder location to a real branch (2026-11-24).'),
       now()
FROM moved;

-- Stock balances follow their item.
UPDATE "Inventory" AS i
SET "locationId" = m."newId", "updatedAt" = now()
FROM "_stock_move" m
WHERE i."locationId" = m."oldId";

-- Loose stock units.
UPDATE "InventoryUnit" AS u
SET "locationId" = m."newId", "updatedAt" = now()
FROM "_stock_move" m
WHERE u."locationId" = m."oldId";

-- Packages still sitting at a placeholder.
UPDATE "Package" AS p
SET "currentLocationId" = m."newId", "updatedAt" = now()
FROM "_stock_move" m
WHERE p."currentLocationId" = m."oldId";
$body_70d4fceb$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '4f5217dfb1f05eb123c18e3da4f213fde1d4f57f884c2f3b54d9eebf3fec5023', now(), '20261124070000_move_old_stock_to_real_branches', 1);
END $m_70d4fceb$;

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
