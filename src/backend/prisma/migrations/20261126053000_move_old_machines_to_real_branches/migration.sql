-- Machines that still sit at a switched-off placeholder location move to a real branch (owner, 2026-11-25:
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
