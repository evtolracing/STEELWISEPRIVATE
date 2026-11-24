#!/usr/bin/env bash
# Stock at a switched-off placeholder location moves to a real branch (2026-11-24), run twice on a copy of the QA
# database. Stock items, balances, loose units and packages must move to the mapped branch; a branch that is
# switched off receives nothing; a location with an old code made after the real locations is not touched; each
# stock item moved gets one audit line; nothing else changes; and the second run changes nothing.
#   PGPASSWORD=password qa/sim/db-move-old-stock.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_stockmove
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
DIR="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor"
FILE="$DIR/20261124070000_move_old_stock_to_real_branches.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY" 2>/dev/null
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
$P -c "DELETE FROM _prisma_migrations WHERE migration_name='20261124070000_move_old_stock_to_real_branches';" >/dev/null
# The starting point: the nine placeholders (old, switched off), four real branches switched on and Battle Creek
# switched off, and a look-alike 'GR-YARD2' is not in the list at all. DEMO-KZO is remade after the real locations.
# Three stock items with balances sit at each placeholder; two packages at GR-YARD; two loose units at WH-MAIN.
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
CREATE TABLE t_old AS SELECT id, code, row_number() OVER (ORDER BY code) rn FROM "Location" WHERE code IN ('DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DEMO-KZO','DET-B','GR-YARD','DEMO-GR','WH-MAIN');
-- Stock the QA data already keeps at a placeholder is put aside first, so the counts below are exact.
UPDATE "Coil" SET "locationId" = (SELECT id FROM "Location" WHERE code = 'QA-L01') WHERE "locationId" IN (SELECT id FROM t_old);
UPDATE "Inventory" SET "locationId" = (SELECT id FROM "Location" WHERE code = 'QA-L01') WHERE "locationId" IN (SELECT id FROM t_old);
UPDATE "Package" SET "currentLocationId" = NULL WHERE "currentLocationId" IN (SELECT id FROM t_old);
UPDATE "InventoryUnit" SET "locationId" = (SELECT id FROM "Location" WHERE code = 'QA-L01') WHERE "locationId" IN (SELECT id FROM t_old);
CREATE TABLE t_pick AS SELECT c.id, ((row_number() OVER (ORDER BY c.id) - 1) % 9) + 1 rn FROM "Coil" c JOIN "Inventory" i ON i."coilId" = c.id
  JOIN "Location" l ON l.id = c."locationId" WHERE l.code NOT IN (SELECT code FROM t_old) ORDER BY c.id LIMIT 27;
UPDATE "Coil" c SET "locationId" = o.id FROM t_pick p JOIN t_old o ON o.rn = p.rn WHERE c.id = p.id;
UPDATE "Inventory" i SET "locationId" = c."locationId" FROM "Coil" c WHERE i."coilId" = c.id AND c.id IN (SELECT id FROM t_pick);
CREATE TABLE t_pkg AS SELECT id FROM "Package" ORDER BY id LIMIT 2;
UPDATE "Package" SET "currentLocationId" = (SELECT id FROM t_old WHERE code = 'GR-YARD') WHERE id IN (SELECT id FROM t_pkg);
CREATE TABLE t_unit AS SELECT id FROM "InventoryUnit" ORDER BY id LIMIT 2;
UPDATE "InventoryUnit" SET "locationId" = (SELECT id FROM t_old WHERE code = 'WH-MAIN') WHERE id IN (SELECT id FROM t_unit);
SQL
CODES="'CT','PV','L2','JX','BC','DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DEMO-KZO','DET-B','GR-YARD','DEMO-GR','WH-MAIN'"
WHERE_() { $P -c "SELECT string_agg(l.code||'='||n, ' ' ORDER BY l.code) FROM (SELECT l.code, (SELECT count(*) FROM \"$1\" x WHERE x.\"$2\" = l.id) n FROM \"Location\" l WHERE l.code IN ($CODES)) l WHERE n > 0"; }
OTHERS() { $P -c "SELECT md5(
  (SELECT coalesce(string_agg(id||coalesce(\"locationId\",'')||status||coalesce(\"binLocation\",'')||coalesce(\"netWeightLb\"::text,''), ',' ORDER BY id), '') FROM \"Coil\" WHERE id NOT IN (SELECT id FROM t_pick)) ||
  (SELECT coalesce(string_agg(\"coilId\"||\"locationId\", ',' ORDER BY \"coilId\"), '') FROM \"Inventory\" WHERE \"coilId\" NOT IN (SELECT id FROM t_pick)) ||
  (SELECT coalesce(string_agg(\"coilId\"||\"qtyOnHand\"||\"qtyAvailable\"||\"qtyAllocated\", ',' ORDER BY \"coilId\"), '') FROM \"Inventory\") ||
  (SELECT coalesce(string_agg(id||status||coalesce(\"binLocation\",''), ',' ORDER BY id), '') FROM \"Coil\") ||
  (SELECT string_agg(id||code||\"isActive\"||\"isBranch\", ',' ORDER BY id) FROM \"Location\") ||
  (SELECT coalesce(string_agg(id||coalesce(\"fromLocationId\",'')||coalesce(\"toLocationId\",''), ',' ORDER BY id), '') FROM \"MaterialMovement\") ||
  (SELECT count(*)::text FROM \"Coil\") || (SELECT count(*)::text FROM \"Inventory\") || (SELECT count(*)::text FROM \"Package\"))"; }
AUDIT() { $P -c "SELECT coalesce(string_agg(x, ' ' ORDER BY x), '') FROM (SELECT (details->>'from')||'>'||(details->>'to')||'='||count(*) x FROM \"AuditLog\" WHERE \"eventType\" = 'STOCK_LOCATION_CORRECTED' GROUP BY details->>'from', details->>'to') q"; }
APART() { $P -c "SELECT count(*) FROM \"Inventory\" i JOIN \"Coil\" c ON c.id = i.\"coilId\" WHERE c.id IN (SELECT id FROM t_pick) AND i.\"locationId\" IS DISTINCT FROM c.\"locationId\""; }
pass=0; fail=0; ERR=$(mktemp)
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
START="DEMO-DET=3 DEMO-GR=3 DEMO-JAX=3 DEMO-KZO=3 DET-A=3 DET-B=3 GR-YARD=3 JAX-WH=3 WH-MAIN=3"
check "the starting point is as described" "$(WHERE_ Coil locationId)" "$START"
BEFORE=$(OTHERS)
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the update failed:"; head -5 "$ERR"; exit 1; }
# Battle Creek is switched off, so DET-A and DEMO-DET stay; DEMO-KZO was made after the real locations, so it stays.
WANT="CT=3 DEMO-DET=3 DEMO-KZO=3 DET-A=3 JX=6 L2=6 PV=3"
check "stock items move to their branch; a switched-off branch and a newer look-alike are left alone" "$(WHERE_ Coil locationId)" "$WANT"
check "stock balances move with their items" "$(WHERE_ Inventory locationId)" "$WANT"
check "no balance is left at a different location from its item" "$(APART)" "0"
check "packages move" "$($P -c "SELECT string_agg(DISTINCT l.code, ',') FROM \"Package\" p JOIN \"Location\" l ON l.id = p.\"currentLocationId\" WHERE p.id IN (SELECT id FROM t_pkg)")" "L2"
check "loose units move" "$($P -c "SELECT string_agg(DISTINCT l.code, ',') FROM \"InventoryUnit\" u JOIN \"Location\" l ON l.id = u.\"locationId\" WHERE u.id IN (SELECT id FROM t_unit)")" "CT"
check "each stock item moved has one audit line" "$(AUDIT)" "DEMO-GR>L2=3 DEMO-JAX>JX=3 DET-B>PV=3 GR-YARD>L2=3 JAX-WH>JX=3 WH-MAIN>CT=3"
check "nothing else changes: other stock, weights, status, bins, locations and movement history" "$(OTHERS)" "$BEFORE"
# Battle Creek is switched on: the next run moves what was waiting for it, and only that.
$P -c "UPDATE \"Location\" SET \"isActive\" = true WHERE code = 'BC'; DELETE FROM _prisma_migrations WHERE migration_name='20261124070000_move_old_stock_to_real_branches';" >/dev/null
BEFORE=$(OTHERS)
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the second update failed:"; head -5 "$ERR"; exit 1; }
check "once the branch is on, its stock arrives" "$(WHERE_ Coil locationId)" "BC=6 CT=3 DEMO-KZO=3 JX=6 L2=6 PV=3"
AFTER="$(WHERE_ Coil locationId)|$(WHERE_ Inventory locationId)|$(AUDIT)|$(OTHERS)|$($P -c "SELECT md5(string_agg(id||\"updatedAt\"::text, ',' ORDER BY id)) FROM \"Coil\"")"
$P -c "DELETE FROM _prisma_migrations WHERE migration_name='20261124070000_move_old_stock_to_real_branches';" >/dev/null
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the repeat run failed:"; head -5 "$ERR"; exit 1; }
check "running it again changes nothing" "$(WHERE_ Coil locationId)|$(WHERE_ Inventory locationId)|$(AUDIT)|$(OTHERS)|$($P -c "SELECT md5(string_agg(id||\"updatedAt\"::text, ',' ORDER BY id)) FROM \"Coil\"")" "$AFTER"
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the skipped run failed:"; head -5 "$ERR"; exit 1; }
check "and the file skips itself once it is recorded" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='20261124070000_move_old_stock_to_real_branches'")" "1"
rm -f "$ERR"
echo "move old stock: $pass passed, $fail failed"
[ "$fail" = 0 ]
