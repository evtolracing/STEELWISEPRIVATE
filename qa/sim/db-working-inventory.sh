#!/usr/bin/env bash
# The working inventory (2026-11-26), run twice on a copy of the QA database set up like the live site: the five real
# branches on file, the placeholder locations switched off, their old stock and machines moved to the real branches.
# Checks: every part loads; counts per category and per branch; every piece has a balance, a receipt and a heat of its
# own grade; holds are on hold; no name says demo, test, sample or mock; the demo products and demo stock come off the
# shelf with their history kept; a branch that is switched off gets nothing; started books refuse the stock; and the
# second run changes nothing.
#   PGPASSWORD=password qa/sim/db-working-inventory.sh            (KEEP=1 keeps the copy as steelwise_qa_inv)
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${COPY_DB:-${SRC}_inv}
case "$SRC$COPY" in *qa*qa*) ;; *) echo "Refusing: not a QA database"; exit 2 ;; esac
DIR="$(cd "$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor" && pwd)"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY" 2>/dev/null
createdb -h "$HOST" -U "$USER_" "$COPY"
[ -n "${KEEP:-}" ] || trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
PARTS=$(ls "$DIR" | grep working_inventory | sort)
NAMES=$(for f in $PARTS; do printf "'%s'," "${f%.sql}"; done)
$P -c "DELETE FROM _prisma_migrations WHERE migration_name IN (${NAMES}'20261122100000_first_five_locations','20261124070000_move_old_stock_to_real_branches','20261126053000_move_old_machines_to_real_branches','20261126080000_product_weight_per_foot')" >/dev/null
# Like the live site: the real branches, the placeholders switched off (2026-11-22), old stock and machines moved.
$P -f "$DIR/20261122100000_first_five_locations.sql" >/dev/null 2>&1
$P -c "UPDATE \"Location\" SET \"isActive\" = false WHERE code IN ('DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DEMO-KZO','DET-B','GR-YARD','DEMO-GR','WH-MAIN')" >/dev/null
$P -c "UPDATE \"Location\" SET \"createdAt\" = TIMESTAMP '2026-01-01' WHERE code IN ('DEMO-JAX','JAX-WH','DET-A','DEMO-DET','DEMO-KZO','DET-B','GR-YARD','DEMO-GR','WH-MAIN')" >/dev/null
for f in 20261124070000_move_old_stock_to_real_branches 20261126053000_move_old_machines_to_real_branches 20261126080000_product_weight_per_foot; do $P -f "$DIR/$f.sql" >/dev/null 2>&1; done
# A sixth branch that is switched off must get nothing; Potterville is switched off for the first run only.
$P -c "UPDATE \"Location\" SET \"isActive\" = false WHERE code = 'PV'" >/dev/null

pass=0; fail=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
q() { $P -c "$1"; }
DEMO_BEFORE=$(q "SELECT count(*) FROM \"Coil\" c JOIN \"Inventory\" i ON i.\"coilId\" = c.id WHERE (c.\"coilNumber\" LIKE 'DEMO-%' OR c.\"coilNumber\" LIKE 'COIL-%') AND c.status IN ('AVAILABLE','HOLD') AND i.\"qtyOnHand\" > 0 AND i.\"qtyAllocated\" = 0 AND i.\"qtyInTransit\" = 0 AND NOT EXISTS (SELECT 1 FROM \"OrderLineAllocation\" a WHERE a.\"coilId\" = c.id) AND NOT EXISTS (SELECT 1 FROM \"WorkOrder\" w WHERE w.\"sourceCoilId\" = c.id)")
MOVES_BEFORE=$(q "SELECT count(*) FROM \"MaterialMovement\"")
JX_MACHINES=$(q "SELECT count(*) FROM \"WorkCenter\" w JOIN \"Location\" l ON l.id = w.\"locationId\" WHERE l.code = 'JX'")

# Started books: the stock file still runs to the end (so a migration run is not stopped) but loads nothing, with a notice.
q "INSERT INTO \"AppSetting\" (key, value, \"updatedAt\") VALUES ('ledger.activation', '{\"active\": true, \"effectiveDate\": \"2026-11-26\"}', now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value" >/dev/null
for f in $PARTS; do case "$f" in *_1_catalog*|*_2_heats*) $P -f "$DIR/$f" >/dev/null 2>&1 ;; esac; done
OUT=$($P -f "$DIR/$(echo "$PARTS" | grep stock_jx)" 2>&1 && echo EXIT0 || echo EXIT1)
case "$OUT" in *"books are already started"*EXIT0*) REFUSED=skipped ;; *) REFUSED="$OUT" ;; esac
check "started books: the stock file finishes without an error and says it loaded nothing" "$REFUSED" "skipped"
check "nothing stocked while the books are started" "$(q "SELECT count(*) FROM \"Coil\" WHERE \"coilNumber\" LIKE 'JX-2%'")" "0"
q "DELETE FROM \"AppSetting\" WHERE key = 'ledger.activation'" >/dev/null
$P -c "DELETE FROM _prisma_migrations WHERE migration_name IN (${NAMES}'x')" >/dev/null

run_all() { for f in $PARTS; do $P -f "$DIR/$f" >/dev/null 2>&1 || { echo "  FAILED: $f did not run"; $P -f "$DIR/$f" 2>&1 | grep -i error | head -3; fail=$((fail+1)); }; done; }
run_all
check "a switched-off branch gets no stock" "$(q "SELECT count(*) FROM \"Coil\" c JOIN \"Location\" l ON l.id = c.\"locationId\" WHERE l.code = 'PV' AND c.\"coilNumber\" LIKE 'PV-2%'")" "0"
check "a switched-off branch gets no outlet pieces" "$(q "SELECT count(*) FROM \"Remnant\" WHERE location = 'PV'")" "0"
# Potterville switched back on, and its part run again on its own (as the owner would after fixing it).
q "UPDATE \"Location\" SET \"isActive\" = true WHERE code = 'PV'" >/dev/null
for f in $(echo "$PARTS" | grep -E 'stock_pv|outlet|machines'); do $P -c "DELETE FROM _prisma_migrations WHERE migration_name = '${f%.sql}'" >/dev/null; $P -f "$DIR/$f" >/dev/null 2>&1; done

SNAP() { q "SELECT md5(
  (SELECT count(*)::text FROM \"Product\") || (SELECT count(*)::text FROM \"StoreListing\") || (SELECT count(*)::text FROM \"Grade\") ||
  (SELECT count(*)::text FROM \"Heat\") || (SELECT count(*)::text FROM \"Coil\") || (SELECT count(*)::text FROM \"Inventory\") ||
  (SELECT count(*)::text FROM \"MaterialMovement\") || (SELECT count(*)::text FROM \"QCHold\") || (SELECT count(*)::text FROM \"Remnant\") ||
  (SELECT count(*)::text FROM \"AuditLog\") || (SELECT count(*)::text FROM \"Organization\") || (SELECT count(*)::text FROM \"WorkCenter\") ||
  (SELECT coalesce(string_agg(c.\"coilNumber\" || c.status || i.\"qtyOnHand\" || i.\"qtyAvailable\", ',' ORDER BY c.\"coilNumber\"), '') FROM \"Coil\" c JOIN \"Inventory\" i ON i.\"coilId\" = c.id) ||
  (SELECT coalesce(string_agg(sku || \"isActive\", ',' ORDER BY sku), '') FROM \"Product\"))"; }
FIRST=$(SNAP)

check "products in the 13 categories" "$(q "SELECT count(*) FROM \"Product\" WHERE \"isActive\" AND division IN ('METALS','PLASTICS') AND \"createdAt\" > now() - interval '15 minutes'")" "1300"
check "every category has 100 products" "$(q "SELECT string_agg(DISTINCT n::text, ',') FROM (SELECT category, count(*) n FROM \"Product\" WHERE \"isActive\" AND division IN ('METALS','PLASTICS') AND category IN ('Carbon & HSLA Plate','Carbon Sheet & Coil','Carbon & Alloy Bar','Structural Shapes','Tube & Pipe','Stainless Sheet & Plate','Stainless Bar, Tube & Angle','Aluminum Sheet & Plate','Aluminum Bar, Extrusions & Tube','Plastic Sheet','Plastic Rod & Tube','Tool Steel','Brass, Copper & Bronze') GROUP BY category) x")" "100"
check "13 categories" "$(q "SELECT count(DISTINCT category) FROM \"Product\" WHERE \"isActive\" AND sku NOT LIKE 'SUP-%' AND category IN ('Carbon & HSLA Plate','Carbon Sheet & Coil','Carbon & Alloy Bar','Structural Shapes','Tube & Pipe','Stainless Sheet & Plate','Stainless Bar, Tube & Angle','Aluminum Sheet & Plate','Aluminum Bar, Extrusions & Tube','Plastic Sheet','Plastic Rod & Tube','Tool Steel','Brass, Copper & Bronze')")" "13"
check "supplies" "$(q "SELECT count(*) FROM \"Product\" WHERE sku LIKE 'SUP-%' AND division = 'SUPPLIES' AND \"isActive\"")" "98"
check "every new product has a visible store listing" "$(q "SELECT count(*) FROM \"Product\" p LEFT JOIN \"StoreListing\" s ON s.\"productId\" = p.id WHERE p.\"createdAt\" > now() - interval '15 minutes' AND (s.\"productId\" IS NULL OR NOT s.visible)")" "0"
check "heats" "$(q "SELECT count(*) FROM \"Heat\" h JOIN \"Organization\" o ON o.id = h.\"millId\" WHERE o.type = 'MILL' AND h.\"createdAt\" > now() - interval '15 minutes'")" "606"
check "stock pieces at the five branches" "$(q "SELECT count(*) FROM \"Coil\" c JOIN \"Location\" l ON l.id = c.\"locationId\" WHERE c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$'")" "4313"
check "pieces per branch" "$(q "SELECT string_agg(l.code || '=' || n, ' ' ORDER BY l.code) FROM (SELECT c.\"locationId\", count(*) n FROM \"Coil\" c WHERE c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-' GROUP BY 1) x JOIN \"Location\" l ON l.id = x.\"locationId\"")" "BC=743 CT=949 JX=900 L2=971 PV=750"
check "every branch has stock in every category" "$(q "SELECT count(*) FROM (SELECT DISTINCT category FROM \"Product\" WHERE sku NOT LIKE 'SUP-%' AND \"createdAt\" > now() - interval '15 minutes') c CROSS JOIN (SELECT id FROM \"Location\" WHERE code IN ('JX','BC','PV','L2','CT')) l WHERE NOT EXISTS (SELECT 1 FROM \"Coil\" k JOIN \"Product\" p ON p.id = k.\"productId\" WHERE p.category = c.category AND k.\"locationId\" = l.id)")" "0"
check "every piece has one balance and one receipt" "$(q "SELECT count(*) FROM \"Coil\" c WHERE c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-' AND ((SELECT count(*) FROM \"Inventory\" i WHERE i.\"coilId\" = c.id) <> 1 OR (SELECT count(*) FROM \"MaterialMovement\" m WHERE m.\"coilId\" = c.id AND m.\"movementType\" = 'RECEIVE') <> 1)")" "0"
check "every metal or plastic piece has a heat of its own grade" "$(q "SELECT count(*) FROM \"Coil\" c LEFT JOIN \"Heat\" h ON h.id = c.\"heatId\" WHERE c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-' AND c.form <> 'SUPPLY' AND (h.id IS NULL OR h.\"gradeId\" <> c.\"gradeId\")")" "0"
check "a piece's balance matches its weight (metal) or its count (supplies)" "$(q "SELECT count(*) FROM \"Coil\" c JOIN \"Inventory\" i ON i.\"coilId\" = c.id WHERE c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-' AND ((c.form <> 'SUPPLY' AND (i.\"qtyOnHand\" <> c.\"netWeightLb\" OR i.unit <> 'LB')) OR (c.form = 'SUPPLY' AND i.unit <> 'EA'))")" "0"
check "held pieces are on hold, with a hold record" "$(q "SELECT count(*) FROM \"Coil\" c JOIN \"Inventory\" i ON i.\"coilId\" = c.id WHERE c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-' AND c.status = 'HOLD' AND (i.\"qtyAvailable\" <> 0 OR i.\"qtyOnHold\" <> i.\"qtyOnHand\" OR NOT EXISTS (SELECT 1 FROM \"QCHold\" h WHERE h.\"coilId\" = c.id AND h.status = 'ACTIVE'))")" "0"
check "held pieces" "$(q "SELECT count(*) FROM \"Coil\" WHERE \"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-' AND status = 'HOLD'")" "89"
check "outlet pieces at real branches" "$(q "SELECT count(*) FROM \"Remnant\" r JOIN \"Location\" l ON l.code = r.location WHERE r.id LIKE 'out-%' AND l.\"isActive\"")" "100"
check "outlet heats are on file with the same grade" "$(q "SELECT count(*) FROM \"Remnant\" r LEFT JOIN \"Heat\" h ON h.\"heatNumber\" = r.\"heatNumber\" LEFT JOIN \"Grade\" g ON g.id = h.\"gradeId\" WHERE r.id LIKE 'out-%' AND (g.code IS DISTINCT FROM r.grade)")" "0"
check "no new name says demo, test, sample or mock" "$(q "SELECT count(*) FROM (SELECT name t FROM \"Product\" WHERE \"isActive\" AND sku NOT LIKE 'QA-%' UNION ALL SELECT \"coilNumber\" FROM \"Coil\" c JOIN \"Inventory\" i ON i.\"coilId\" = c.id WHERE i.\"qtyOnHand\" > 0 AND c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-' UNION ALL SELECT name FROM \"Remnant\" UNION ALL SELECT notes FROM \"Remnant\" UNION ALL SELECT \"heatNumber\" FROM \"Heat\" WHERE \"createdAt\" > now() - interval '15 minutes' UNION ALL SELECT name FROM \"Organization\" WHERE type = 'MILL' AND \"createdAt\" > now() - interval '15 minutes') x WHERE t ~* '(demo|test|sample|mock|fake|dummy)'")" "0"
check "the demo products are switched off or gone" "$(q "SELECT count(*) FROM \"Product\" WHERE sku IN ('HR-A36-PL','CR-1018-BR','SS-304-SH','AL-6061-PL','HR-A572-PL','HDPE-SH-NAT','UHMW-ROD-WH','WG-25','CUT-DISC-9','REM-A36-PL','HRC-A36-048','CRC-A36-060') AND (\"isActive\" OR EXISTS (SELECT 1 FROM \"StoreListing\" s WHERE s.\"productId\" = \"Product\".id AND s.visible))")" "0"
check "the free demo stock is off the shelf" "$(q "SELECT count(*) FROM \"Coil\" c JOIN \"Inventory\" i ON i.\"coilId\" = c.id WHERE (c.\"coilNumber\" LIKE 'DEMO-%' OR c.\"coilNumber\" LIKE 'COIL-%') AND i.status = 'RETIRED' AND i.\"qtyOnHand\" = 0 AND c.status = 'CONSUMED'")" "$DEMO_BEFORE"
check "each piece taken off has one adjustment line, and history before it is kept" "$(q "SELECT (SELECT count(*) FROM \"MaterialMovement\" WHERE \"reasonCode\" = 'DEMO_RETIRED') || ' ' || ((SELECT count(*) FROM \"MaterialMovement\") - (SELECT count(*) FROM \"MaterialMovement\" WHERE \"reasonCode\" = 'DEMO_RETIRED' OR notes LIKE 'Opening stock: working inventory%'))")" "$DEMO_BEFORE $MOVES_BEFORE"
check "the demo outlet pieces are gone" "$(q "SELECT count(*) FROM \"Remnant\" WHERE id LIKE 'rem-%' AND NOT reserved")" "0"
check "the balance identity holds everywhere" "$(q "SELECT count(*) FROM \"Inventory\" WHERE abs(\"qtyOnHand\" - (\"qtyAvailable\" + \"qtyAllocated\" + \"qtyOnHold\" + \"qtyInTransit\")) > 0.0001")" "0"
check "a branch gets only the kinds of machine it lacked" "$(q "SELECT string_agg(l.code || '=' || (SELECT count(*) FROM \"WorkCenter\" w WHERE w.\"locationId\" = l.id AND w.code ~ '^(JX|BC|PV|L2|CT)-'), ' ' ORDER BY l.code) FROM \"Location\" l WHERE l.code IN ('JX','BC','PV','L2','CT')")" "BC=6 CT=9 JX=3 L2=7 PV=7"
check "the branch that already had saws, a shear and a router keeps them and gets none of those again" "$(q "SELECT count(*) || ' ' || string_agg(DISTINCT w.type, ',' ORDER BY w.type) FROM \"WorkCenter\" w JOIN \"Location\" l ON l.id = w.\"locationId\" WHERE l.code = 'JX' AND w.code ~ '^JX-'")" "3 PACKOUT,PLASMA,PLASTIC_SAW"
check "the old machines at that branch are all still there" "$(q "SELECT count(*) FROM \"WorkCenter\" w JOIN \"Location\" l ON l.id = w.\"locationId\" WHERE l.code = 'JX' AND w.code !~ '^JX-'")" "$JX_MACHINES"
check "every machine's kind of work is on file" "$(q "SELECT count(*) FROM \"WorkCenter\" w WHERE w.code ~ '^(JX|BC|PV|L2|CT)-' AND NOT EXISTS (SELECT 1 FROM \"WorkCenterType\" t WHERE t.id = w.type AND t.\"isActive\")")" "0"
check "one load line per branch" "$(q "SELECT count(*) FROM \"AuditLog\" WHERE \"eventType\" = 'WORKING_INVENTORY_LOADED'")" "5"

# Second run of every part (as if pasted again with the skip records gone): nothing changes.
$P -c "DELETE FROM _prisma_migrations WHERE migration_name IN (${NAMES}'x')" >/dev/null
run_all
check "running every part a second time changes nothing" "$(SNAP)" "$FIRST"
# And with the skip records in place, the files say so and change nothing either.
run_all
check "a third run with the skip records changes nothing" "$(SNAP)" "$FIRST"

# The read-only check and verify files, and the removal file (run twice), on the loaded copy.
HELP="$(cd "$DIR/../working-inventory" && pwd)"
check "the check-before file sees the five branches switched on and the stock loaded" "$($P -F'|' -f "$HELP/check-before.sql" | grep -c 'on file, switched on')" "5"
VERIFY="$($P -F'|' -f "$HELP/verify-after.sql")"
check "the verify file: balances, heats and costs all add up" "$(echo "$VERIFY" | grep -E '^(balances off|pieces with no heat|pieces with no cost)' | cut -d'|' -f2 | tr '\n' ' ')" "0 0 0 "
check "the verify file: 13 categories of 100 products in the store" "$(echo "$VERIFY" | grep -c '^products, .*|100$')" "13"
RM=${COPY}_rm
dropdb -h "$HOST" -U "$USER_" --if-exists "$RM" 2>/dev/null; createdb -h "$HOST" -U "$USER_" "$RM"
pg_dump -h "$HOST" -U "$USER_" "$COPY" | psql -h "$HOST" -U "$USER_" -q -d "$RM" >/dev/null 2>&1
R="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $RM"
$R -c "INSERT INTO \"AppSetting\" (key, value, \"updatedAt\") VALUES ('ledger.activation', '{\"active\": true}', now())" >/dev/null
OUT="$($R -f "$HELP/remove.sql" 2>&1 || true)"
case "$OUT" in *"books are already started"*) GOT=refused ;; *) GOT="$OUT" ;; esac
check "the removal file refuses once the books are started" "$GOT" "refused"
check "and removed nothing" "$($R -c "SELECT count(*) FROM \"Product\" WHERE \"isActive\" AND sku ~ '^(PL|SS|AL|WF|SUP)-'" )" "$(q "SELECT count(*) FROM \"Product\" WHERE \"isActive\" AND sku ~ '^(PL|SS|AL|WF|SUP)-'")"
$R -c "DELETE FROM \"AppSetting\" WHERE key = 'ledger.activation'" >/dev/null
$R -f "$HELP/remove.sql" >/dev/null; $R -f "$HELP/remove.sql" >/dev/null
OURS="c.\"coilNumber\" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$'"
check "removal takes every free piece off the shelf once, with history kept" "$($R -c "SELECT count(*) FILTER (WHERE i.\"qtyOnHand\" > 0) || ' ' || (SELECT count(*) FROM \"MaterialMovement\" WHERE \"reasonCode\" = 'WORKING_INVENTORY_REMOVED') || ' ' || (SELECT count(*) FROM \"MaterialMovement\" m JOIN \"Coil\" c ON c.id = m.\"coilId\" WHERE $OURS AND m.\"movementType\" = 'RECEIVE') FROM \"Inventory\" i JOIN \"Coil\" c ON c.id = i.\"coilId\" WHERE $OURS")" "0 $(q "SELECT count(*) FROM \"Coil\" c WHERE $OURS") $(q "SELECT count(*) FROM \"Coil\" c WHERE $OURS")"
check "removal: no product, outlet piece, hold or added machine left on, other machines untouched" "$($R -c "SELECT (SELECT count(*) FROM \"Product\" p WHERE p.\"isActive\" AND EXISTS (SELECT 1 FROM \"Coil\" c WHERE c.\"productId\" = p.id AND $OURS)) || ' ' || (SELECT count(*) FROM \"Remnant\" WHERE id LIKE 'out-%') || ' ' || (SELECT count(*) FROM \"QCHold\" h JOIN \"Coil\" c ON c.id = h.\"coilId\" WHERE h.status = 'ACTIVE' AND $OURS) || ' ' || (SELECT count(*) FROM \"WorkCenter\" WHERE \"isActive\" AND code ~ '^(JX|BC|PV|L2|CT)-[A-Z]+-[0-9]{2}$') || ' ' || (SELECT count(*) FROM \"WorkCenter\" WHERE \"isActive\" AND code !~ '^(JX|BC|PV|L2|CT)-[A-Z]+-[0-9]{2}$')")" "0 0 0 0 $(q "SELECT count(*) FROM \"WorkCenter\" WHERE \"isActive\" AND code !~ '^(JX|BC|PV|L2|CT)-[A-Z]+-[0-9]{2}$'")"
check "removal keeps every balance adding up" "$($R -c "SELECT count(*) FROM \"Inventory\" WHERE abs(\"qtyOnHand\" - (\"qtyAvailable\" + \"qtyAllocated\" + \"qtyOnHold\" + \"qtyInTransit\")) > 0.0001")" "0"
dropdb -h "$HOST" -U "$USER_" --if-exists "$RM"

echo "Working inventory on a copy: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
