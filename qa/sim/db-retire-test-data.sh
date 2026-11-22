#!/usr/bin/env bash
# The clean-up before the real locations (owner's decision, 2026-11-22), run twice on a copy of the QA database.
# It must cancel the listed open orders with their open jobs and shipments, switch off the placeholder locations and
# their machines, move their people to Charlotte, delete nothing, leave everything else alone, and change nothing
# on the second run.
#   PGPASSWORD=password qa/sim/db-retire-test-data.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_retire
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
DIR="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor"
FILE="$DIR/20261122213000_retire_test_orders_and_demo_locations.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY" 2>/dev/null
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
LISTED="'SO-00001','SO-00002','SO-00003','SO-00004','SO-00005','SO-00006','SO-000001','SO-00008','SO-00067','SO-00068','SO-00069','SO-00070','SO-00071','SO-00072','SO-00073','SO-00074','SO-00075','SO-00076','SO-P1001','SO-P1002','SO-P1003','SO-P1004','SO-P1005','SO-DEMO-001','SO-DEMO-002','SO-DEMO-003','SO-DEMO-004','SO-C2007'"
CODES="'DEMO-DET','DEMO-GR','DEMO-JAX','DEMO-KZO','DET-A','DET-B','GR-YARD','JAX-WH','WH-MAIN'"
# Both updates are taken off the copy's applied list: a database built after them has them recorded (and, built
# empty, has no Charlotte yet), and a recorded update skips itself.
$P -c "DELETE FROM _prisma_migrations WHERE migration_name IN ('20261122213000_retire_test_orders_and_demo_locations', '20261122100000_first_five_locations');" >/dev/null
$P -f "$DIR/20261122100000_first_five_locations.sql" >/dev/null 2>&1
# The starting point: placeholder locations switched on with a machine; listed orders open, one finished, and one
# made after the update was written; an open and a shipped job; shipments of a listed order, from a placeholder
# location, and an unrelated one; a person at a placeholder location.
$P >/dev/null <<SQL
UPDATE "Location" SET "isActive" = true, "deactivatedAt" = NULL, "createdAt" = '2026-01-01' WHERE code IN ($CODES);
UPDATE "Order" SET status = 'CONFIRMED', "createdAt" = '2026-03-01', notes = NULL WHERE "orderNumber" IN ('SO-000001','SO-P1001','SO-DEMO-001');
UPDATE "Order" SET status = 'COMPLETE', "createdAt" = '2026-03-01' WHERE "orderNumber" = 'SO-00069';
UPDATE "Order" SET status = 'CONFIRMED', "createdAt" = '2026-12-01', notes = 'kept' WHERE "orderNumber" = 'SO-C2007';
INSERT INTO "WorkCenter" (id, code, name, "locationId", "updatedAt") SELECT 't-wc', 'T-RETIRE-WC', 'Test saw', id, now() FROM "Location" WHERE code = 'DEMO-JAX';
INSERT INTO "Job" (id, "jobNumber", status, "orderId", "updatedAt")
  SELECT 't-open', 'T-RETIRE-1', 'SCHEDULED'::"JobStatus", id, now() FROM "Order" WHERE "orderNumber" = 'SO-P1001'
  UNION ALL SELECT 't-shipped', 'T-RETIRE-2', 'SHIPPED'::"JobStatus", id, now() FROM "Order" WHERE "orderNumber" = 'SO-P1001'
  UNION ALL SELECT 't-kept', 'T-RETIRE-3', 'SCHEDULED'::"JobStatus", id, now() FROM "Order" WHERE "orderNumber" = 'SO-C2007';
UPDATE "Shipment" SET status = 'DELIVERED' WHERE "fromLocationId" IN (SELECT id FROM "Location" WHERE code IN ($CODES)) OR "orderId" IN (SELECT id FROM "Order" WHERE "orderNumber" IN ('SO-000001','SO-P1001','SO-DEMO-001'));
CREATE TEMP TABLE pick AS SELECT id, row_number() OVER (ORDER BY id) n FROM "Shipment" WHERE status = 'IN_TRANSIT' LIMIT 3;
CREATE TABLE t_ship AS SELECT * FROM pick;
-- Dated before the update was written, whenever this QA database was built.
UPDATE "Shipment" SET "createdAt" = '2026-03-01' WHERE id IN (SELECT id FROM t_ship);
UPDATE "Shipment" SET "orderId" = (SELECT id FROM "Order" WHERE "orderNumber" = 'SO-P1001') WHERE id = (SELECT id FROM t_ship WHERE n = 1);
UPDATE "Shipment" SET "fromLocationId" = (SELECT id FROM "Location" WHERE code = 'DEMO-JAX') WHERE id = (SELECT id FROM t_ship WHERE n = 2);
UPDATE "User" SET "homeLocationId" = (SELECT id FROM "Location" WHERE code = 'WH-MAIN') WHERE email = 'qa-branch-b@qa.test';
DELETE FROM "UserLocation" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'qa-branch-b@qa.test');
INSERT INTO "UserLocation" (id, "userId", "locationId") SELECT 't-ul-' || l.code, u.id, l.id FROM "User" u, "Location" l WHERE u.email = 'qa-branch-b@qa.test' AND l.code IN ('DEMO-DET','WH-MAIN');
SQL
COUNTS() { $P -c "SELECT (SELECT count(*) FROM \"Order\")||'/'||(SELECT count(*) FROM \"Job\")||'/'||(SELECT count(*) FROM \"Shipment\")||'/'||(SELECT count(*) FROM \"Location\")||'/'||(SELECT count(*) FROM \"WorkCenter\")||'/'||(SELECT count(*) FROM \"Inventory\")||'/'||(SELECT count(*) FROM \"Invoice\")||'/'||(SELECT count(*) FROM \"User\")"; }
OTHERS() { $P -c "SELECT md5(
  (SELECT string_agg(id||status, ',' ORDER BY id) FROM \"Order\" WHERE \"orderNumber\" NOT IN ($LISTED)) ||
  (SELECT string_agg(id||status, ',' ORDER BY id) FROM \"Job\" WHERE \"orderId\" IS NULL OR \"orderId\" NOT IN (SELECT id FROM \"Order\" WHERE \"orderNumber\" IN ($LISTED) AND \"orderNumber\" <> 'SO-C2007')) ||
  (SELECT string_agg(id||status, ',' ORDER BY id) FROM \"Shipment\" WHERE id NOT IN (SELECT id FROM t_ship WHERE n IN (1,2)) AND \"orderId\" NOT IN (SELECT id FROM \"Order\" WHERE \"orderNumber\" IN ($LISTED))) ||
  (SELECT string_agg(id||\"isActive\", ',' ORDER BY id) FROM \"Location\" WHERE code NOT IN ($CODES)) ||
  (SELECT string_agg(w.id||w.\"isActive\", ',' ORDER BY w.id) FROM \"WorkCenter\" w JOIN \"Location\" l ON l.id = w.\"locationId\" WHERE l.code NOT IN ($CODES)) ||
  (SELECT string_agg(id||coalesce(\"homeLocationId\",''), ',' ORDER BY id) FROM \"User\" WHERE \"homeLocationId\" IS NULL OR \"homeLocationId\" NOT IN (SELECT id FROM \"Location\" WHERE code IN ($CODES, 'CT'))))"; }
STATE() { $P -c "SELECT
  (SELECT string_agg(\"orderNumber\"||'='||status, ' ' ORDER BY \"orderNumber\") FROM \"Order\" WHERE \"orderNumber\" IN ('SO-000001','SO-P1001','SO-DEMO-001','SO-00069','SO-C2007'))
  ||' | '||(SELECT string_agg(id||'='||status, ' ' ORDER BY id) FROM \"Job\" WHERE id LIKE 't-%')
  ||' | '||(SELECT string_agg(t.n||'='||s.status, ' ' ORDER BY t.n) FROM \"Shipment\" s JOIN t_ship t ON t.id = s.id)
  ||' | on='||(SELECT count(*) FROM \"Location\" WHERE code IN ($CODES) AND \"isActive\")||' off='||(SELECT count(*) FROM \"Location\" WHERE code IN ($CODES) AND NOT \"isActive\" AND \"deactivatedAt\" IS NOT NULL)
  ||' machines on='||(SELECT count(*) FROM \"WorkCenter\" w JOIN \"Location\" l ON l.id = w.\"locationId\" WHERE l.code IN ($CODES) AND w.\"isActive\")
  ||' | home='||(SELECT l.code FROM \"User\" u JOIN \"Location\" l ON l.id = u.\"homeLocationId\" WHERE u.email = 'qa-branch-b@qa.test')
  ||' branches='||(SELECT string_agg(l.code, ',' ORDER BY l.code) FROM \"UserLocation\" x JOIN \"Location\" l ON l.id = x.\"locationId\" JOIN \"User\" u ON u.id = x.\"userId\" WHERE u.email = 'qa-branch-b@qa.test')"; }
NLOC=$($P -c "SELECT count(*) FROM \"Location\" WHERE code IN ($CODES)")
WANT="SO-000001=CANCELLED SO-00069=COMPLETE SO-C2007=CONFIRMED SO-DEMO-001=CANCELLED SO-P1001=CANCELLED | t-kept=SCHEDULED t-open=CANCELLED t-shipped=SHIPPED | 1=CANCELLED 2=CANCELLED 3=IN_TRANSIT | on=0 off=$NLOC machines on=0 | home=CT branches=CT"
BEFORE=$(OTHERS); N=$(COUNTS)
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
$P -f "$FILE" >/dev/null 2>&1
check "first run cancels, switches off and moves exactly what it should" "$(STATE)" "$WANT"
check "nothing else changes" "$(OTHERS)" "$BEFORE"
check "nothing is deleted" "$(COUNTS)" "$N"
check "a cancelled order says why, and a kept one keeps its notes" "$($P -c "SELECT (SELECT notes FROM \"Order\" WHERE \"orderNumber\"='SO-P1001')||'|'||(SELECT notes FROM \"Order\" WHERE \"orderNumber\"='SO-C2007')")" "Cancelled: test data cleared before the real locations (2026-11-22).|kept"
STAMP=$($P -c "SELECT md5(string_agg(code||\"deactivatedAt\"||coalesce(notes,''), ',' ORDER BY code)) FROM \"Location\" WHERE code IN ($CODES)")
$P -f "$FILE" >/dev/null 2>&1
check "a second run changes nothing" "$(STATE)|$(OTHERS)|$(COUNTS)|$($P -c "SELECT md5(string_agg(code||\"deactivatedAt\"||coalesce(notes,''), ',' ORDER BY code)) FROM \"Location\" WHERE code IN ($CODES)")|$($P -c "SELECT notes FROM \"Order\" WHERE \"orderNumber\"='SO-P1001'")" "$WANT|$BEFORE|$N|$STAMP|Cancelled: test data cleared before the real locations (2026-11-22)."
check "it is recorded once as applied" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='20261122213000_retire_test_orders_and_demo_locations'")" "1"
echo "retire test data: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
