#!/usr/bin/env bash
# The database update that cancels the jobs left over from the demo (owner's decision, 2026-11-21), run twice on a
# copy of the QA database. It must cancel every open demo job with no plan (J-DEMO-*, J-C2007), and leave alone a
# shipped one, a planned one and every other job. The second run must change nothing.
#   PGPASSWORD=password qa/sim/db-cancel-demo-jobs.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_demo_jobs
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
FILE="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor/20261121200000_cancel_demo_jobs.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
$P -c "DELETE FROM \"Job\" WHERE \"jobNumber\" LIKE 'J-DEMO-%' OR \"jobNumber\" = 'J-C2007';
  INSERT INTO \"Job\" (id, \"jobNumber\", status, \"updatedAt\") VALUES
   ('t-d1','J-DEMO-001','SCHEDULED',now()), ('t-d6','J-DEMO-006','IN_PROCESS',now()), ('t-c','J-C2007','SCHEDULED',now()),
   ('t-ds','J-DEMO-011','SHIPPED',now()), ('t-dp','J-DEMO-012','SCHEDULED',now());
  INSERT INTO \"DispatchJob\" (id, \"jobId\", \"jobNumber\", \"locationId\", \"updatedAt\") SELECT 't-dj','t-dp','J-DEMO-012', id, now() FROM \"Location\" LIMIT 1;" >/dev/null
OTHERS=$($P -c "SELECT md5(string_agg(id||status, ',' ORDER BY id)) FROM \"Job\" WHERE id NOT LIKE 't-%'")
STATE() { $P -c "SELECT string_agg(\"jobNumber\"||'='||status, ' ' ORDER BY \"jobNumber\") FROM \"Job\" WHERE id LIKE 't-%'"; }
WANT="J-C2007=CANCELLED J-DEMO-001=CANCELLED J-DEMO-006=CANCELLED J-DEMO-011=SHIPPED J-DEMO-012=SCHEDULED"
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  FAILED: $1: got [$2] want [$3]"; fi; }
$P -f "$FILE" >/dev/null 2>&1
check "first run cancels the open demo jobs with no plan, and only those" "$(STATE)" "$WANT"
check "no other job changes" "$($P -c "SELECT md5(string_agg(id||status, ',' ORDER BY id)) FROM \"Job\" WHERE id NOT LIKE 't-%'")" "$OTHERS"
check "the cancelled job says why" "$($P -c "SELECT notes FROM \"Job\" WHERE id='t-d1'")" "Cancelled: left over from the demo data (2026-11-21)."
$P -f "$FILE" >/dev/null 2>&1
check "a second run changes nothing" "$(STATE)" "$WANT"
check "it is recorded once as applied" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='20261121200000_cancel_demo_jobs'")" "1"
echo "cancel demo jobs: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
