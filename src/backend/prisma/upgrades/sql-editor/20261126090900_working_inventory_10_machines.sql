-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261126090900_working_inventory_10_machines

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

-- 20261126090900_working_inventory_10_machines
DO $m_a41d57e5$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261126090900_working_inventory_10_machines' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261126090900_working_inventory_10_machines (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_a41d57e5$-- Working inventory, part 10 of 10: machines, so jobs can be planned and run at every branch (owner, 2026-11-26: "make full job plans and runs").
-- A branch gets a machine of a kind of work (saw, shear, laser, plasma, waterjet, CNC, router, plastics saw, packout) only when it has
-- no machine of that kind yet, so machines already set up are never doubled. A kind of work the company already has is used as it is;
-- one it does not have is added. Each machine works one 8-hour shift; change names and capacity on Admin > Work Centers.

INSERT INTO "WorkCenterType" ("id", "label", "divisions", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT ON (v.type) v.type, v.label, jsonb_build_array(v.division), true, now(), now()
FROM (VALUES
('CT', 'CT-SAW-01', 'Precision Plate Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('CT', 'CT-SAW-02', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('CT', 'CT-SHEAR-01', 'Plate Shear 1/2" x 12 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('CT', 'CT-LASER-01', 'Plate Fiber Laser 12 kW', 'LASER', 'LASER', 'Laser', 'METALS'),
('CT', 'CT-LASER-02', 'Tube Laser', 'LASER', 'LASER', 'Laser', 'METALS'),
('CT', 'CT-PLASMA-01', 'High Definition Plasma Table', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('CT', 'CT-WATERJET-01', 'Waterjet 6 ft x 12 ft', 'WATERJET', 'WATERJET', 'Waterjet', 'METALS'),
('CT', 'CT-CNC-01', 'Precision Mill (squaring)', 'CNC', 'CNC', 'CNC Machining', 'METALS'),
('CT', 'CT-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('JX', 'JX-SAW-01', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('JX', 'JX-SAW-02', 'Cold Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('JX', 'JX-SHEAR-01', 'Sheet Shear 1/4" x 10 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('JX', 'JX-PLASMA-01', 'Plasma Table', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('JX', 'JX-ROUTER-01', 'CNC Router (plastics)', 'ROUTER', 'ROUTER', 'Router', 'PLASTICS'),
('JX', 'JX-PLASTICSAW-01', 'Panel Saw (plastics)', 'PLASTIC_SAW', 'PLASTIC', 'Plastic Saw', 'PLASTICS'),
('JX', 'JX-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('BC', 'BC-SAW-01', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('BC', 'BC-SAW-02', 'Cold Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('BC', 'BC-SHEAR-01', 'Sheet Shear 1/4" x 10 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('BC', 'BC-LASER-01', 'Sheet Fiber Laser 6 kW', 'LASER', 'LASER', 'Laser', 'METALS'),
('BC', 'BC-ROUTER-01', 'CNC Router (plastics)', 'ROUTER', 'ROUTER', 'Router', 'PLASTICS'),
('BC', 'BC-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('PV', 'PV-SAW-01', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('PV', 'PV-SAW-02', 'Vertical Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('PV', 'PV-SHEAR-01', 'Sheet Shear 3/16" x 10 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('PV', 'PV-PLASMA-01', 'Plasma Table', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('PV', 'PV-PLASTICSAW-01', 'Panel Saw (plastics)', 'PLASTIC_SAW', 'PLASTIC', 'Plastic Saw', 'PLASTICS'),
('PV', 'PV-ROUTER-01', 'CNC Router (plastics)', 'ROUTER', 'ROUTER', 'Router', 'PLASTICS'),
('PV', 'PV-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('L2', 'L2-SAW-01', 'Structural Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('L2', 'L2-SAW-02', 'Structural Band Saw, Miter', 'SAW', 'SAW', 'Saw', 'METALS'),
('L2', 'L2-SAW-03', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('L2', 'L2-SHEAR-01', 'Angle and Flat Shear', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('L2', 'L2-PLASMA-01', 'Beam Coping Plasma', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('L2', 'L2-CNC-01', 'Beam Drill Line', 'CNC', 'CNC', 'CNC Machining', 'METALS'),
('L2', 'L2-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS')
) AS v(branch, code, name, type, word, label, division)
WHERE NOT EXISTS (SELECT 1 FROM "WorkCenterType" t WHERE upper(t.id) = v.type OR (t."isActive" AND upper(t.id || ' ' || t.label) LIKE '%' || v.word || '%'))
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "WorkCenter" ("id", "code", "name", "locationId", "type", "capabilities", "capacity", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, x.code, x.name, x.lid, x.kind, '[]'::jsonb, jsonb_build_object('division', x.division, 'shiftCapacityMinutesPerDay', 480), true, now(), now()
FROM (
  SELECT v.*, l.id AS lid, (SELECT t.id FROM "WorkCenterType" t WHERE upper(t.id) = v.type OR (t."isActive" AND upper(t.id || ' ' || t.label) LIKE '%' || v.word || '%')
     ORDER BY (upper(t.id) = v.type) DESC, t."isActive" DESC, t.id LIMIT 1) AS kind
  FROM (VALUES
('CT', 'CT-SAW-01', 'Precision Plate Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('CT', 'CT-SAW-02', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('CT', 'CT-SHEAR-01', 'Plate Shear 1/2" x 12 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('CT', 'CT-LASER-01', 'Plate Fiber Laser 12 kW', 'LASER', 'LASER', 'Laser', 'METALS'),
('CT', 'CT-LASER-02', 'Tube Laser', 'LASER', 'LASER', 'Laser', 'METALS'),
('CT', 'CT-PLASMA-01', 'High Definition Plasma Table', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('CT', 'CT-WATERJET-01', 'Waterjet 6 ft x 12 ft', 'WATERJET', 'WATERJET', 'Waterjet', 'METALS'),
('CT', 'CT-CNC-01', 'Precision Mill (squaring)', 'CNC', 'CNC', 'CNC Machining', 'METALS'),
('CT', 'CT-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('JX', 'JX-SAW-01', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('JX', 'JX-SAW-02', 'Cold Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('JX', 'JX-SHEAR-01', 'Sheet Shear 1/4" x 10 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('JX', 'JX-PLASMA-01', 'Plasma Table', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('JX', 'JX-ROUTER-01', 'CNC Router (plastics)', 'ROUTER', 'ROUTER', 'Router', 'PLASTICS'),
('JX', 'JX-PLASTICSAW-01', 'Panel Saw (plastics)', 'PLASTIC_SAW', 'PLASTIC', 'Plastic Saw', 'PLASTICS'),
('JX', 'JX-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('BC', 'BC-SAW-01', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('BC', 'BC-SAW-02', 'Cold Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('BC', 'BC-SHEAR-01', 'Sheet Shear 1/4" x 10 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('BC', 'BC-LASER-01', 'Sheet Fiber Laser 6 kW', 'LASER', 'LASER', 'Laser', 'METALS'),
('BC', 'BC-ROUTER-01', 'CNC Router (plastics)', 'ROUTER', 'ROUTER', 'Router', 'PLASTICS'),
('BC', 'BC-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('PV', 'PV-SAW-01', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('PV', 'PV-SAW-02', 'Vertical Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('PV', 'PV-SHEAR-01', 'Sheet Shear 3/16" x 10 ft', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('PV', 'PV-PLASMA-01', 'Plasma Table', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('PV', 'PV-PLASTICSAW-01', 'Panel Saw (plastics)', 'PLASTIC_SAW', 'PLASTIC', 'Plastic Saw', 'PLASTICS'),
('PV', 'PV-ROUTER-01', 'CNC Router (plastics)', 'ROUTER', 'ROUTER', 'Router', 'PLASTICS'),
('PV', 'PV-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS'),
('L2', 'L2-SAW-01', 'Structural Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('L2', 'L2-SAW-02', 'Structural Band Saw, Miter', 'SAW', 'SAW', 'Saw', 'METALS'),
('L2', 'L2-SAW-03', 'Horizontal Band Saw', 'SAW', 'SAW', 'Saw', 'METALS'),
('L2', 'L2-SHEAR-01', 'Angle and Flat Shear', 'SHEAR', 'SHEAR', 'Shear', 'METALS'),
('L2', 'L2-PLASMA-01', 'Beam Coping Plasma', 'PLASMA', 'PLASMA', 'Plasma', 'METALS'),
('L2', 'L2-CNC-01', 'Beam Drill Line', 'CNC', 'CNC', 'CNC Machining', 'METALS'),
('L2', 'L2-PACKOUT-01', 'Packaging and Shipping Station', 'PACKOUT', 'PACK', 'Packout', 'METALS')
) AS v(branch, code, name, type, word, label, division)
  JOIN "Location" l ON l."code" = v.branch AND l."isActive" = true
) x
WHERE x.kind IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "WorkCenter" w WHERE w."locationId" = x.lid AND w."isActive" = true AND upper(w.type) = upper(x.kind))
ON CONFLICT ("code") DO NOTHING;
$body_a41d57e5$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'a540f9d205e3a009e4f7f0b2c39a8761939ca90ffe918872736c4357dd6aa5bc', now(), '20261126090900_working_inventory_10_machines', 1);
END $m_a41d57e5$;

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
