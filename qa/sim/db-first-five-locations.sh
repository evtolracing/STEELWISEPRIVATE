#!/usr/bin/env bash
# The database update that adds the first five real locations (owner's choice, 2026-11-22), run twice on a copy of
# the QA database. It must add CT, PV, L2, BC and JX as active branches with their details, leave a code already on
# file untouched, change no other location, and change nothing on the second run.
#   PGPASSWORD=password qa/sim/db-first-five-locations.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_five_locations
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
FILE="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor/20261122100000_first_five_locations.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
# Start clean of the five, with one of them (BC) already on file under another name: it must be left alone.
$P -c "DELETE FROM _prisma_migrations WHERE migration_name='20261122100000_first_five_locations';
  DELETE FROM \"Location\" WHERE code IN ('CT','PV','L2','BC','JX');
  INSERT INTO \"Location\" (id, code, name, type, \"ownerId\", \"updatedAt\")
    SELECT 't-bc', 'BC', 'Already here', 'YARD', \"ownerId\", now() FROM \"Location\" LIMIT 1;" >/dev/null
OTHERS() { $P -c "SELECT md5(string_agg(id||code||name||\"isActive\"||\"isBranch\", ',' ORDER BY id)) FROM \"Location\" WHERE code NOT IN ('CT','PV','L2','JX')"; }
BEFORE=$(OTHERS)
STATE() { $P -c "SELECT string_agg(code||'='||name||'/'||city||'/'||\"isBranch\"||\"isActive\"||\"sellsFrom\"||\"shipsFrom\", ' ' ORDER BY code) FROM \"Location\" WHERE code IN ('CT','PV','L2','JX')"; }
WANT="CT=Charlotte/Charlotte/truetruetruetrue JX=Jackson Steel/Jackson/truetruetruetrue L2=Lansing Steel/Lansing/truetruetruetrue PV=Potterville/Potterville/truetruetruetrue"
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
$P -f "$FILE" >/dev/null 2>&1
check "first run adds the missing locations as active branches" "$(STATE)" "$WANT"
check "Charlotte carries its address, phone, fax, floor area and processes" \
  "$($P -c "SELECT \"addressLine1\"||'|'||state||' '||\"postalCode\"||'|'||phone||'|'||fax||'|'||\"squareFeet\"||'|'||array_length(processes,1)||'|'||type||'|'||timezone FROM \"Location\" WHERE code='CT'")" \
  "1298 Lipsey Dr.|MI 48813|(517) 541-2558|(517) 541-2559|126600|13|WAREHOUSE|America/Detroit"
check "they belong to the company that owns the other locations" \
  "$($P -c "SELECT count(DISTINCT \"ownerId\") FROM \"Location\" WHERE code IN ('CT','PV','L2','JX') AND \"ownerId\" = (SELECT \"ownerId\" FROM \"Location\" WHERE code NOT IN ('CT','PV','L2','JX') GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1)")" "1"
check "a code already on file is left as it was" "$($P -c "SELECT id||'/'||name||'/'||type FROM \"Location\" WHERE code='BC'")" "t-bc/Already here/YARD"
check "no other location changes" "$(OTHERS)" "$BEFORE"
IDS=$($P -c "SELECT string_agg(id, ',' ORDER BY code) FROM \"Location\" WHERE code IN ('CT','PV','L2','JX')")
$P -f "$FILE" >/dev/null 2>&1
check "a second run changes nothing" "$(STATE)|$($P -c "SELECT string_agg(id, ',' ORDER BY code) FROM \"Location\" WHERE code IN ('CT','PV','L2','JX')")|$($P -c "SELECT count(*) FROM \"Location\" WHERE code IN ('CT','PV','L2','BC','JX')")" "$WANT|$IDS|5"
check "it is recorded once as applied" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='20261122100000_first_five_locations'")" "1"
echo "first five locations: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
