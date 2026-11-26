#!/usr/bin/env bash
# The table that keeps where a card sits in its column of the Production Workflow board (2026-11-25), run twice on
# a copy of the QA database. The table must be made once with its key to the job, recorded once, hold nothing, and
# leave every job as it was; a place is removed with its job; and the second run changes nothing.
#   PGPASSWORD=password qa/sim/db-job-board-position.sh
set -euo pipefail
HOST=${PGHOST:-localhost}; USER_=${PGUSER:-postgres}; SRC=${QA_DB:-steelwise_qa}; COPY=${SRC}_copy_boardpos
case "$SRC" in *qa*) ;; *) echo "Refusing: $SRC is not a QA database"; exit 2 ;; esac
NAME=20261125230000_job_board_position
FILE="$(dirname "$0")/../../src/backend/prisma/upgrades/sql-editor/$NAME.sql"
P="psql -h $HOST -U $USER_ -v ON_ERROR_STOP=1 -q -At -d $COPY"
dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY" 2>/dev/null
createdb -h "$HOST" -U "$USER_" "$COPY"
trap 'dropdb -h "$HOST" -U "$USER_" --if-exists "$COPY"' EXIT
pg_dump -h "$HOST" -U "$USER_" "$SRC" | $P >/dev/null 2>&1
$P -c "DROP TABLE IF EXISTS \"JobBoardPosition\"; DELETE FROM _prisma_migrations WHERE migration_name='$NAME';" >/dev/null
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "  ✗ $1: expected $3, got $2"; fi; }
JOBS=$($P -c "SELECT count(*) || ':' || coalesce(md5(string_agg(id || status::text, ',' ORDER BY id)), '') FROM \"Job\"")

$P -f "$FILE" >/dev/null
check "the table is made" "$($P -c "SELECT count(*) FROM information_schema.tables WHERE table_name='JobBoardPosition'")" 1
check "it has its five columns" "$($P -c "SELECT string_agg(column_name, ',' ORDER BY column_name) FROM information_schema.columns WHERE table_name='JobBoardPosition'")" "jobId,position,stage,updatedAt,updatedById"
check "a place is tied to its job" "$($P -c "SELECT count(*) FROM pg_constraint WHERE conname='JobBoardPosition_jobId_fkey' AND confdeltype='c'")" 1
check "it holds nothing" "$($P -c 'SELECT count(*) FROM "JobBoardPosition"')" 0
check "the update is recorded once" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='$NAME' AND finished_at IS NOT NULL")" 1
check "every job is as it was" "$($P -c "SELECT count(*) || ':' || coalesce(md5(string_agg(id || status::text, ',' ORDER BY id)), '') FROM \"Job\"")" "$JOBS"

# A place is kept, one per job, and goes with its job.
$P >/dev/null <<'SQL'
INSERT INTO "Job" ("id","jobNumber","status","createdAt","updatedAt") VALUES ('qa-boardpos-job','QA-BOARDPOS-1','ORDERED',now(),now());
INSERT INTO "JobBoardPosition" ("jobId","stage","position") VALUES ('qa-boardpos-job','NOT_PLANNED',1000);
SQL
check "a second place for the same job is refused" "$($P -c "INSERT INTO \"JobBoardPosition\" (\"jobId\",\"stage\",\"position\") VALUES ('qa-boardpos-job','QUEUED',5)" 2>&1 | grep -c 'duplicate key')" 1
check "a place for a job not on file is refused" "$($P -c "INSERT INTO \"JobBoardPosition\" (\"jobId\",\"stage\",\"position\") VALUES ('no-such-job','QUEUED',5)" 2>&1 | grep -c 'foreign key')" 1

$P -f "$FILE" >/dev/null
check "the second run keeps the place already saved" "$($P -c "SELECT stage || ':' || position FROM \"JobBoardPosition\" WHERE \"jobId\"='qa-boardpos-job'")" "NOT_PLANNED:1000"
check "the second run records nothing more" "$($P -c "SELECT count(*) FROM _prisma_migrations WHERE migration_name='$NAME'")" 1
$P -c "DELETE FROM \"Job\" WHERE id='qa-boardpos-job'" >/dev/null
check "a place goes with its job" "$($P -c 'SELECT count(*) FROM "JobBoardPosition"')" 0

echo "job board position: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
