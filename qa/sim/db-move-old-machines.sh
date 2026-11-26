#!/usr/bin/env bash
# Machines at a switched-off placeholder location move to a real branch (2026-11-26), run twice on a copy of the
# QA database. Machines, the plans of open jobs and operators' home branch must move to the mapped branch; a
# finished job's plan stays; a branch that is switched off receives nothing; a look-alike made after the real
# locations is not touched; each machine moved gets one audit line; a machine keeps everything else; and the
# second run changes nothing.
#   PGPASSWORD=password qa/sim/db-move-old-machines.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_machinemove
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
NAME=20261126053000_move_old_machines_to_real_branches
FILE="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor/$NAME.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY" 2>/dev/null
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
$P -c "DELETE FROM _prisma_migrations WHERE migration_name='$NAME';" >/dev/null
# The starting point: nine placeholders (old, switched off; DEMO-KZO remade after the real locations), four real
# branches on and Battle Creek off. Two machines at each placeholder. At WH-MAIN: an open job's plan, a finished
# job's plan and an operator.
$P >/dev/null <<'SQL'
INSERT INTO "Location" ("id","code","name","type","ownerId","isBranch","isActive","createdAt","updatedAt")
SELECT gen_random_uuid()::text, v.code, v.code, 'WAREHOUSE'::"LocationType", (SELECT "ownerId" FROM "Location" LIMIT 1), v.br, v.act, now(), now()
FROM (VALUES ('CT',true,true),('PV',true,true),('L2',true,true),('JX',true,true),('BC',true,true),
  ('DEMO-JAX',false,false),('JAX-WH',false,false),('DET-A',false,false),('DEMO-DET',false,false),('DEMO-KZO',false,false),
  ('DET-B',false,false),('GR-YARD',false,false),('DEMO-GR',false,false),('WH-MAIN',false,false)) v(code,br,act)
ON CONFLICT (code) DO NOTHING;
UPDATE "Location" SET "isBranch" = true, "isActive" = true WHERE code IN ('CT','PV','L2','JX');
UPDATE "Location" SET "isBranch" = true, "isActive" = false WHERE code = 'BC';
UPDATE "Location" SET "isActive" = false, "createdAt" = TIMESTAMP '2026-01-01' WHERE code IN ('DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DET-B','GR-YARD','DEMO-GR','WH-MAIN');
UPDATE "Location" SET "isActive" = false, "createdAt" = TIMESTAMP '2026-11-23 00:00:00' WHERE code = 'DEMO-KZO';
CREATE TABLE t_old AS SELECT id, code FROM "Location" WHERE code IN ('DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DEMO-KZO','DET-B','GR-YARD','DEMO-GR','WH-MAIN');
-- Anything the QA data already keeps at a placeholder is put aside first, so the counts below are exact.
UPDATE "WorkCenter" SET "locationId" = (SELECT id FROM "Location" WHERE code = 'QA-L01') WHERE "locationId" IN (SELECT id FROM t_old);
UPDATE "DispatchJob" SET "locationId" = (SELECT id FROM "Location" WHERE code = 'QA-L01') WHERE "locationId" IN (SELECT id FROM t_old);
UPDATE "Operator" SET "homeLocationId" = NULL WHERE "homeLocationId" IN (SELECT id FROM t_old);
INSERT INTO "WorkCenter" ("id","code","name","locationId","type","capabilities","isActive","createdAt","updatedAt")
SELECT 'qamm-' || o.code || '-' || n, 'QAMM-' || o.code || '-' || n, 'Old machine ' || n, o.id, 'SAW', '{"division":"METALS"}'::jsonb, n = 1, now(), TIMESTAMP '2026-02-02'
FROM t_old o, generate_series(1, 2) n;
CREATE TABLE t_jobs AS SELECT j.id, j.status::text AS status FROM "Job" j JOIN "DispatchJob" d ON d."jobId" = j.id
  WHERE j.id IN ((SELECT j2.id FROM "Job" j2 JOIN "DispatchJob" d2 ON d2."jobId" = j2.id WHERE j2.status = 'SCHEDULED' ORDER BY j2.id LIMIT 1)
              UNION (SELECT j3.id FROM "Job" j3 JOIN "DispatchJob" d3 ON d3."jobId" = j3.id WHERE j3.status IN ('SHIPPED','COMPLETED') ORDER BY j3.id LIMIT 1));
UPDATE "DispatchJob" SET "locationId" = (SELECT id FROM t_old WHERE code = 'WH-MAIN') WHERE "jobId" IN (SELECT id FROM t_jobs);
CREATE TABLE t_op AS SELECT id FROM "Operator" ORDER BY id LIMIT 1;
UPDATE "Operator" SET "homeLocationId" = (SELECT id FROM t_old WHERE code = 'WH-MAIN') WHERE id IN (SELECT id FROM t_op);
SQL
CODES="'CT','PV','L2','JX','BC','DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DEMO-KZO','DET-B','GR-YARD','DEMO-GR','WH-MAIN'"
WHERE_() { $P -c "SELECT string_agg(l.code||'='||n, ' ' ORDER BY l.code) FROM (SELECT l.code, (SELECT count(*) FROM \"WorkCenter\" x WHERE x.\"locationId\" = l.id AND x.id LIKE 'qamm-%') n FROM \"Location\" l WHERE l.code IN ($CODES)) l WHERE n > 0"; }
PLAN() { $P -c "SELECT string_agg(CASE WHEN t.status IN ('SHIPPED','COMPLETED') THEN 'finished' ELSE 'open' END || '@' || l.code, ' ' ORDER BY 1) FROM t_jobs t JOIN \"DispatchJob\" d ON d.\"jobId\" = t.id JOIN \"Location\" l ON l.id = d.\"locationId\""; }
OTHERS() { $P -c "SELECT md5(
  (SELECT string_agg(id||code||name||coalesce(type,'')||capabilities::text||\"isActive\", ',' ORDER BY id) FROM \"WorkCenter\") ||
  (SELECT coalesce(string_agg(id||\"locationId\", ',' ORDER BY id), '') FROM \"WorkCenter\" WHERE id NOT LIKE 'qamm-%') ||
  (SELECT coalesce(string_agg(id||\"locationId\", ',' ORDER BY id), '') FROM \"DispatchJob\" WHERE \"jobId\" NOT IN (SELECT id FROM t_jobs)) ||
  (SELECT coalesce(string_agg(id||coalesce(\"assignedWorkCenterId\",'')||status::text||sequence, ',' ORDER BY id), '') FROM \"DispatchOperation\") ||
  (SELECT coalesce(string_agg(id||coalesce(\"homeLocationId\",''), ',' ORDER BY id), '') FROM \"Operator\" WHERE id NOT IN (SELECT id FROM t_op)) ||
  (SELECT string_agg(id||code||\"isActive\"||\"isBranch\", ',' ORDER BY id) FROM \"Location\") ||
  (SELECT coalesce(string_agg(id||coalesce(\"locationId\",''), ',' ORDER BY id), '') FROM \"Coil\") ||
  (SELECT coalesce(string_agg(id||coalesce(\"homeLocationId\",''), ',' ORDER BY id), '') FROM \"User\"))"; }
AUDIT() { $P -c "SELECT coalesce(string_agg(x, ' ' ORDER BY x), '') FROM (SELECT (details->>'from')||'>'||(details->>'to')||'='||count(*) x FROM \"AuditLog\" WHERE \"eventType\" = 'MACHINE_LOCATION_CORRECTED' GROUP BY details->>'from', details->>'to') q"; }
pass=0; fail=0; ERR=$(mktemp)
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
check "the starting point is as described" "$(WHERE_)" "DEMO-DET=2 DEMO-GR=2 DEMO-JAX=2 DEMO-KZO=2 DET-A=2 DET-B=2 GR-YARD=2 JAX-WH=2 WH-MAIN=2"
check "the two plans start at the placeholder" "$(PLAN)" "finished@WH-MAIN open@WH-MAIN"
BEFORE=$(OTHERS)
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the update failed:"; head -5 "$ERR"; exit 1; }
# Battle Creek is switched off, so DET-A and DEMO-DET stay; DEMO-KZO was made after the real locations, so it stays.
check "machines move to their branch; a switched-off branch and a newer look-alike are left alone" "$(WHERE_)" "CT=2 DEMO-DET=2 DEMO-KZO=2 DET-A=2 JX=4 L2=4 PV=2"
check "the open job's plan follows; the finished job's plan stays" "$(PLAN)" "finished@WH-MAIN open@CT"
check "the operator's home branch follows" "$($P -c "SELECT l.code FROM \"Operator\" o JOIN \"Location\" l ON l.id = o.\"homeLocationId\" WHERE o.id IN (SELECT id FROM t_op)")" "CT"
check "each machine moved has one audit line" "$(AUDIT)" "DEMO-GR>L2=2 DEMO-JAX>JX=2 DET-B>PV=2 GR-YARD>L2=2 JAX-WH>JX=2 WH-MAIN>CT=2"
check "a machine keeps its name, code, kind, division and on or off; nothing else moves" "$(OTHERS)" "$BEFORE"
check "the update is recorded once" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='$NAME' AND finished_at IS NOT NULL")" "1"
# Run again as it stands: it is skipped, and nothing changes.
STAMP() { $P -c "SELECT md5(string_agg(id||\"updatedAt\"::text||\"locationId\", ',' ORDER BY id)) FROM \"WorkCenter\""; }
S1="$(STAMP)|$(AUDIT)|$(OTHERS)|$(PLAN)"
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the second run failed:"; head -5 "$ERR"; exit 1; }
check "the second run changes nothing" "$(STAMP)|$(AUDIT)|$(OTHERS)|$(PLAN)" "$S1"
# Battle Creek is switched on and the file is run fresh: what was waiting for it arrives, and only that.
$P -c "UPDATE \"Location\" SET \"isActive\" = true WHERE code = 'BC'; DELETE FROM _prisma_migrations WHERE migration_name='$NAME';" >/dev/null
BEFORE=$(OTHERS)
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the third run failed:"; head -5 "$ERR"; exit 1; }
check "once the branch is on, its machines arrive" "$(WHERE_)" "BC=4 CT=2 DEMO-KZO=2 JX=4 L2=4 PV=2"
check "machines already moved get no second audit line" "$(AUDIT)" "DEMO-DET>BC=2 DEMO-GR>L2=2 DEMO-JAX>JX=2 DET-A>BC=2 DET-B>PV=2 GR-YARD>L2=2 JAX-WH>JX=2 WH-MAIN>CT=2"
check "and still nothing else changes" "$(OTHERS)" "$BEFORE"
echo "move old machines: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
