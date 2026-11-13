#!/usr/bin/env bash
# Runs every gate on a freshly rebuilt local QA database and prints one summary.
# Needs PostgreSQL on localhost and nothing else running on ports 3011, 3001 and 5199.
#   qa/tools/run-gates.sh [log directory]      (default: qa/results/gate-logs)
# Request logging is on, so the run also records which API calls the tests made
# (qa/results/exercised-endpoints.json). The baseline probe runs after that record is
# written, because it sends empty bodies and would count as "success" where it should not.
set -uo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$root"
LOGS="${1:-$root/qa/results/gate-logs}"; mkdir -p "$LOGS"
export DATABASE_URL="${QA_DATABASE_URL:-postgresql://postgres:password@localhost:5432/steelwise_qa}"
export DIRECT_URL="$DATABASE_URL" LOG_REQUESTS=on
case "$DATABASE_URL" in *localhost*qa*|*127.0.0.1*qa*) ;; *) echo "Refusing: not a local QA database"; exit 1;; esac
wait_for() { for _ in $(seq 1 60); do curl -s -m2 -o /dev/null "$1" && return 0; node -e "setTimeout(()=>{},1000)"; done; echo "timed out waiting for $1"; return 1; }
fuser -k 3011/tcp 3001/tcp >/dev/null 2>&1 || true
pg_isready -q || { echo "PostgreSQL is not running"; exit 1; }

echo "== rebuild"; qa/tools/rebuild-qa-db.sh > "$LOGS/rebuild.log" 2>&1 && echo "rebuilt" || { echo "rebuild FAILED, see $LOGS/rebuild.log"; exit 1; }
(nohup qa/tools/start-qa-server.sh > "$LOGS/server-3011.log" 2>&1 &); wait_for http://localhost:3011/api/health || exit 1
echo "== simulation"
for seed in 8001 8002 8003; do node qa/sim/run.mjs --base http://localhost:3011 --seed $seed --out qa/results/final-$seed.json 2>&1 | tail -3; done
echo "== database checks after the simulation"; node qa/tools/db-facts.mjs | sed -n '/"checks"/,$p'
echo "== sweep"; node qa/sim/security.mjs --base http://localhost:3011 2>&1 | grep -v "^    " | tail -26
echo "== branch boundary"; node qa/sim/branch-boundary.mjs --base http://localhost:3011 2>&1 | tail -8
echo "== phase 2 integrity"; node qa/sim/phase2-integrity.mjs --base http://localhost:3011 2>&1 | tail -8
echo "== phase 3 database scenarios"; node qa/sim/phase3-db.mjs --base http://localhost:3011 2>&1 | tail -12
echo "== database checks after the scenarios"; node qa/tools/db-facts.mjs | sed -n '/"checks"/,$p'
echo "== schema inventory"; node qa/tools/db-schema.mjs 2>&1 | tail -4
echo "== unit"; (cd src/backend && npm test 2>&1 | grep -E "^not ok|^# (tests|pass|fail)")
(PORT=3001 nohup qa/tools/start-qa-server.sh > "$LOGS/server-3001.log" 2>&1 &); wait_for http://localhost:3001/api/health || exit 1
curl -s -m2 -o /dev/null http://localhost:5199 || { (cd src/frontend && nohup npx vite --port 5199 --strictPort > "$LOGS/vite.log" 2>&1 &); wait_for http://localhost:5199; }
for t in ui-experience ui-shipping ui-shop ui-sales ui-inventory; do echo "== $t"; node qa/sim/$t.cjs 2>&1 | grep "✗\|checks,"; done
echo "== every screen opens"; node qa/sim/ui-smoke.cjs 2>&1 | tail -8
echo "== calls the tests made"; node qa/tools/exercised.mjs "$LOGS/server-3011.log" "$LOGS/server-3001.log" | sed -n '/"distinct"/,$p'
echo "== baseline probe"; node qa/tools/discover.mjs > /dev/null; node qa/sim/baseline-probe.mjs --base http://localhost:3011 --max-crash 0 2>&1 | tail -12
echo "== department rule coverage"; node qa/tools/access-coverage.mjs
echo "== screen audit"; node qa/tools/screen-audit.mjs | head -2
echo "== lint, frontend"; (cd src/frontend && npx eslint src && echo LINT-OK)
echo "== screen ratchets"; node qa/tools/frontend-checks.mjs
echo "== lint, whole repository"; npx eslint . 2>&1 | tail -3
echo "== build"; (cd src/frontend && npx vite build 2>&1 | tail -1)
echo "== documents"; node qa/tools/inventory.mjs | tail -1; node qa/tools/api-contract.mjs > /dev/null; node qa/tools/report.mjs > /dev/null 2>&1; node qa/tools/discover.mjs > /dev/null; node qa/tools/excellence-docs.mjs
echo "== ALL DONE"
