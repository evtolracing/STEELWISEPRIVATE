#!/usr/bin/env bash
# Stock reserved for the cancelled test orders goes back to available (2026-11-22), run twice on a copy of the QA
# database. It must release only the reservations of orders the clean-up cancelled, leave a piece reserved while
# another order still holds some of it, remove only those reservations, leave everything else alone, and change nothing on the
# second run.
#   PGPASSWORD=password qa/sim/db-release-test-stock.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_release
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
DIR="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor"
FILE="$DIR/20261122230000_release_stock_of_cancelled_test_orders.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY" 2>/dev/null
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
$P -c "DELETE FROM _prisma_migrations WHERE migration_name='20261122230000_release_stock_of_cancelled_test_orders';" >/dev/null
NOTE='Cancelled: test data cleared before the real locations (2026-11-22).'
# The starting point. Three pieces of stock with nothing reserved, then:
#   piece 1: 40 reserved by a cleared test order only
#   piece 2: 5 reserved by the cleared test order and 10 by a live order
#   piece 3: 7 reserved by an order cancelled for another reason (not ours to touch)
$P >/dev/null <<SQL
CREATE TABLE t_coil AS SELECT i."coilId" AS id, row_number() OVER (ORDER BY i."coilId") n FROM "Inventory" i
  WHERE i."qtyAllocated" = 0 AND i."qtyAvailable" >= 100 AND NOT EXISTS (SELECT 1 FROM "OrderLineAllocation" a WHERE a."coilId" = i."coilId") LIMIT 3;
CREATE TABLE t_ord AS SELECT o.id, row_number() OVER (ORDER BY o.id) n FROM "Order" o WHERE o."orderType" = 'SO' AND o.status = 'CONFIRMED'
  AND NOT EXISTS (SELECT 1 FROM "OrderLine" ol JOIN "OrderLineAllocation" a ON a."orderLineId" = ol.id WHERE ol."orderId" = o.id) LIMIT 3; -- orders holding nothing of their own
UPDATE "Order" SET status = 'CANCELLED', notes = 'kept note' || E'\n' || '$NOTE' WHERE id = (SELECT id FROM t_ord WHERE n = 1);
UPDATE "Order" SET status = 'CANCELLED', notes = 'Customer changed their mind' WHERE id = (SELECT id FROM t_ord WHERE n = 3);
INSERT INTO "OrderLine" (id, "orderId", "lineNumber", "qtyOrdered", "updatedAt") SELECT 't-line-' || n, id, 900 + n, 100, now() FROM t_ord;
INSERT INTO "OrderLineAllocation" (id, "orderLineId", "coilId", "qtyAllocated") VALUES
  ('t-a1', 't-line-1', (SELECT id FROM t_coil WHERE n = 1), 40),
  ('t-a2', 't-line-1', (SELECT id FROM t_coil WHERE n = 2), 5),
  ('t-a3', 't-line-2', (SELECT id FROM t_coil WHERE n = 2), 10),
  ('t-a4', 't-line-3', (SELECT id FROM t_coil WHERE n = 3), 7);
UPDATE "Inventory" i SET "qtyAllocated" = x.q, "qtyAvailable" = i."qtyAvailable" - x.q
  FROM (SELECT "coilId", sum("qtyAllocated") q FROM "OrderLineAllocation" WHERE id LIKE 't-a%' GROUP BY 1) x WHERE i."coilId" = x."coilId";
UPDATE "Coil" SET status = 'ALLOCATED' WHERE id IN (SELECT id FROM t_coil);
CREATE TABLE t_before AS SELECT i."coilId", i."qtyOnHand", i."qtyAvailable" + i."qtyAllocated" AS free_plus_held FROM "Inventory" i;
SQL
STATE() { $P -c "SELECT string_agg(t.n||': reserved='||trim_scale(i.\"qtyAllocated\")||' '||c.status, ' | ' ORDER BY t.n) FROM t_coil t JOIN \"Inventory\" i ON i.\"coilId\" = t.id JOIN \"Coil\" c ON c.id = t.id"; }
ROWS() { $P -c "SELECT string_agg(id||'='||trim_scale(\"qtyAllocated\"), ' ' ORDER BY id) FROM \"OrderLineAllocation\" WHERE id LIKE 't-a%'"; }
OTHERS() { $P -c "SELECT md5(
  (SELECT coalesce(string_agg(i.\"coilId\"||i.\"qtyAllocated\"||i.\"qtyAvailable\", ',' ORDER BY i.\"coilId\"), '') FROM \"Inventory\" i WHERE i.\"coilId\" NOT IN (SELECT id FROM t_coil WHERE n IN (1,2))) ||
  (SELECT coalesce(string_agg(id||\"qtyAllocated\", ',' ORDER BY id), '') FROM \"OrderLineAllocation\" WHERE id NOT IN ('t-a1','t-a2')) ||
  (SELECT string_agg(id||status, ',' ORDER BY id) FROM \"Coil\" WHERE id NOT IN (SELECT id FROM t_coil WHERE n = 1)) ||
  (SELECT string_agg(id||status||coalesce(notes,''), ',' ORDER BY id) FROM \"Order\"))"; }
COUNTS() { $P -c "SELECT (SELECT count(*) FROM \"OrderLineAllocation\")||'/'||(SELECT count(*) FROM \"Inventory\")||'/'||(SELECT count(*) FROM \"Coil\")||'/'||(SELECT count(*) FROM \"Order\")||'/'||(SELECT count(*) FROM \"OrderLine\")"; }
BALANCED() { $P -c "SELECT count(*) FROM \"Inventory\" i JOIN t_before b ON b.\"coilId\" = i.\"coilId\" WHERE i.\"qtyOnHand\" <> b.\"qtyOnHand\" OR i.\"qtyAvailable\" + i.\"qtyAllocated\" <> b.free_plus_held OR i.\"qtyAllocated\" < 0"; }
pass=0; fail=0; ERR=$(mktemp)
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
check "the starting point is as described" "$(STATE)" "1: reserved=40 ALLOCATED | 2: reserved=15 ALLOCATED | 3: reserved=7 ALLOCATED"
BEFORE=$(OTHERS); N=$(COUNTS); WANT_N="$(( ${N%%/*} - 2 ))/${N#*/}"
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the update failed:"; head -5 "$ERR"; exit 1; }
check "the test order's stock is released; a piece another order holds stays reserved for that order" "$(STATE)" "1: reserved=0 AVAILABLE | 2: reserved=10 ALLOCATED | 3: reserved=7 ALLOCATED"
check "the test order's reservations are gone, the others are as they were" "$(ROWS)" "t-a3=10 t-a4=7"
check "what left reserved went to available: on hand and the total are unchanged on every record" "$(BALANCED)" "0"
check "nothing else changes" "$(OTHERS)" "$BEFORE"
check "only the two reservations are removed: every order, line, stock record and piece is still on file" "$(COUNTS)" "$WANT_N"
AFTER="$(STATE)|$(ROWS)|$(OTHERS)|$(COUNTS)|$($P -c "SELECT md5(string_agg(\"coilId\"||\"qtyAvailable\"||\"qtyAllocated\", ',' ORDER BY \"coilId\")) FROM \"Inventory\"")"
$P -f "$FILE" >/dev/null 2>"$ERR" || { echo "  the update failed:"; head -5 "$ERR"; exit 1; }
check "a second run changes nothing" "$(STATE)|$(ROWS)|$(OTHERS)|$(COUNTS)|$($P -c "SELECT md5(string_agg(\"coilId\"||\"qtyAvailable\"||\"qtyAllocated\", ',' ORDER BY \"coilId\")) FROM \"Inventory\"")" "$AFTER"
check "it is recorded once as applied" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='20261122230000_release_stock_of_cancelled_test_orders'")" "1"
echo "release test stock: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
