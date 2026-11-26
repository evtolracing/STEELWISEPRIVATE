-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261126053000_move_old_machines_to_real_branches

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

-- 20261126053000_move_old_machines_to_real_branches
DO $m_82c86ad6$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261126053000_move_old_machines_to_real_branches' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261126053000_move_old_machines_to_real_branches (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_82c86ad6$-- Machines that still sit at a switched-off placeholder location move to a real branch (owner, 2026-11-25:
-- "machines aren't showing in other locations than the ones I added at Charlotte. I thought the ones from before
-- were distributed amongst the locations"). The stock was moved on 2026-11-24; the machines were not part of that.
-- The same map is used, so a machine arrives at the branch its stock went to:
--
--   old location                                      -> real branch
--   DEMO-JAX Jackson Service Center, JAX-WH Jackson   -> JX Jackson Steel
--   DET-A Detroit Bay A, DEMO-DET, DEMO-KZO           -> BC Battle Creek
--   DET-B Detroit Bay B                               -> PV Potterville
--   GR-YARD Grand Rapids Yard, DEMO-GR                -> L2 Lansing Steel
--   WH-MAIN Main Warehouse                            -> CT Charlotte
--
-- What moves: machines (work centers); the plans of jobs still open, so a job stays at the branch of its
-- machines; and the home branch of shop-floor operators. A machine keeps its name, code, kind, division, queue
-- and whether it is switched on. Plans of finished jobs, recorded time and other history are not rewritten.
-- Each machine moved gets a line in the audit log. A row moves only when its real branch is on file and switched
-- on, and only from a placeholder made before the real locations. Running it again changes nothing.

CREATE TEMP TABLE "_machine_move" ON COMMIT DROP AS
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

-- Machines, with one audit line each.
WITH moved AS (
  UPDATE "WorkCenter" AS w
  SET "locationId" = m."newId", "updatedAt" = now()
  FROM "_machine_move" m
  WHERE w."locationId" = m."oldId"
  RETURNING w."id", w."code", w."name", m."oldCode", m."newCode"
)
INSERT INTO "AuditLog" ("id", "category", "eventType", "severity", "resourceType", "resourceId", "action", "details", "timestamp")
SELECT gen_random_uuid()::text, 'DATA', 'MACHINE_LOCATION_CORRECTED', 'INFO', 'WorkCenter', moved."id", 'UPDATE',
       jsonb_build_object('code', moved."code", 'name', moved."name", 'from', moved."oldCode", 'to', moved."newCode",
                          'note', 'Moved from a switched-off placeholder location to a real branch (2026-11-26).'),
       now()
FROM moved;

-- The plans of jobs still open follow their machines.
UPDATE "DispatchJob" AS d
SET "locationId" = m."newId", "updatedAt" = now()
FROM "_machine_move" m, "Job" j
WHERE d."locationId" = m."oldId" AND j."id" = d."jobId"
  AND j."status" NOT IN ('SHIPPED', 'COMPLETED', 'CANCELLED');

-- Shop-floor operators whose home branch was a placeholder.
UPDATE "Operator" AS o
SET "homeLocationId" = m."newId", "updatedAt" = now()
FROM "_machine_move" m
WHERE o."homeLocationId" = m."oldId";
$body_82c86ad6$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '591f31cb021b2d40a38deda6fe31b071e2d9f9ea7f128d883dcce20b094326b1', now(), '20261126053000_move_old_machines_to_real_branches', 1);
END $m_82c86ad6$;

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
