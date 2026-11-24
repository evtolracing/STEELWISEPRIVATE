#!/usr/bin/env bash
# Runs every gate on a freshly rebuilt local QA database and prints one summary.
# Needs PostgreSQL on localhost and nothing else running on ports 3011, 3001 and 5199.
#   qa/tools/run-gates.sh [log directory]      (default: qa/results/gate-logs)
# Request logging is on, so the run also records which API calls the tests made
# (qa/results/exercised-endpoints.json). The baseline probe runs after that record is
# written, because it sends empty bodies and would count as "success" where it should not.
set -uo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$root"
LOGS="${1:-$root/qa/results/gate-logs}"; mkdir -p "$LOGS"; LOGS="$(cd "$LOGS" && pwd)"   # absolute: a later step writes to it from another directory
export DATABASE_URL="${QA_DATABASE_URL:-postgresql://postgres:password@localhost:5432/steelwise_qa}"
export DIRECT_URL="$DATABASE_URL" LOG_REQUESTS=on
case "$DATABASE_URL" in *localhost*qa*|*127.0.0.1*qa*) ;; *) echo "Refusing: not a local QA database"; exit 1;; esac
wait_for() { for _ in $(seq 1 60); do curl -s -m2 -o /dev/null "$1" && return 0; node -e "setTimeout(()=>{},1000)"; done; echo "timed out waiting for $1"; return 1; }
fuser -k 3011/tcp 3001/tcp >/dev/null 2>&1 || true
pg_isready -q || { echo "PostgreSQL is not running"; exit 1; }

echo "== rebuild"; qa/tools/rebuild-qa-db.sh > "$LOGS/rebuild.log" 2>&1 && echo "rebuilt" || { echo "rebuild FAILED, see $LOGS/rebuild.log"; exit 1; }
# Phase 10 (W-014): the QA servers connect as the least-privilege role steelwise_runtime, as the live server should.
# The role is made by migration 20261118090000 without a login; only here, on the QA database, is it given one.
# The password below is a QA fixture, not a secret. Set QA_SERVER_AS_OWNER=1 to run the servers as the owner instead.
if [ -z "${QA_SERVER_AS_OWNER:-}" ]; then
  psql "$DATABASE_URL" -qc "ALTER ROLE steelwise_runtime LOGIN PASSWORD 'qa-runtime-not-a-secret'" && export SERVER_DATABASE_URL="${DATABASE_URL/postgres:password@/steelwise_runtime:qa-runtime-not-a-secret@}" && echo "servers connect as steelwise_runtime"
fi
(nohup qa/tools/start-qa-server.sh > "$LOGS/server-3011.log" 2>&1 &); wait_for http://localhost:3011/api/health || exit 1
echo "== simulation"
for seed in 8001 8002 8003; do node qa/sim/run.mjs --base http://localhost:3011 --seed $seed --out qa/results/final-$seed.json 2>&1 | tail -3; done
echo "== database checks after the simulation"; node qa/tools/db-facts.mjs | sed -n '/"checks"/,$p'
echo "== sweep"; node qa/sim/security.mjs --base http://localhost:3011 2>&1 | grep -v "^    " | tail -26
echo "== branch boundary"; node qa/sim/branch-boundary.mjs --base http://localhost:3011 2>&1 | tail -8
echo "== phase 2 integrity"; node qa/sim/phase2-integrity.mjs --base http://localhost:3011 2>&1 | tail -8
echo "== phase 3 database scenarios"; node qa/sim/phase3-db.mjs --base http://localhost:3011 2>&1 | tail -12
echo "== phase 4 integration scenarios"; node qa/sim/phase4-integration.mjs --base http://localhost:3011 --server-log "$LOGS/server-3011.log" 2>&1 | tail -12
echo "== phase 5 sales scenarios"; node qa/sim/phase5-sales.mjs --base http://localhost:3011 2>&1 | grep -v "^\s*at " | tail -12
echo "== phase 6 inventory scenarios"; node qa/sim/phase6-inventory.mjs --base http://localhost:3011 2>&1 | grep -v "^\s*at " | tail -12
echo "== phase 7 manufacturing scenarios"; node qa/sim/phase7-manufacturing.mjs --base http://localhost:3011 2>&1 | grep -v "^\s*at " | tail -12
echo "== phase 8 fulfilment scenarios"; node qa/sim/phase8-fulfillment.mjs --base http://localhost:3011 2>&1 | grep -v "^\s*at " | tail -12
echo "== database checks after the scenarios"; node qa/tools/db-facts.mjs | sed -n '/"checks"/,$p'
echo "== schema inventory"; node qa/tools/db-schema.mjs 2>&1 | tail -4
echo "== unit"; (cd src/backend && npm test 2>&1 | grep -E "^not ok|^# (tests|pass|fail)")
(PORT=3001 nohup qa/tools/start-qa-server.sh > "$LOGS/server-3001.log" 2>&1 &); wait_for http://localhost:3001/api/health || exit 1
curl -s -m2 -o /dev/null http://localhost:5199 || { (cd src/frontend && nohup npx vite --port 5199 --strictPort > "$LOGS/vite.log" 2>&1 &); wait_for http://localhost:5199; }
for t in ui-experience ui-shipping ui-shop ui-sales ui-inventory ui-integration ui-phase5 ui-phase6 ui-phase7 ui-phase8; do echo "== $t"; node qa/sim/$t.cjs 2>&1 | grep "✗\|checks,"; done
# Role matrix: the roles API and screens, and one person's roles and exceptions (phases 2 to 4).
echo "== role matrix"; node qa/sim/roles.mjs --base http://localhost:3011 | tail -4; node qa/sim/user-access.mjs --base http://localhost:3011 | tail -4; node qa/sim/role-rights.mjs --base http://localhost:3011 | tail -4; node qa/sim/ui-roles.cjs 2>&1 | tail -4; node qa/sim/ui-user-access.cjs 2>&1 | tail -4; node qa/sim/ui-role-rights.cjs 2>&1 | tail -4
echo "== new order to dispatch"; node qa/sim/ui-order-flow.cjs 2>&1 | tail -6
echo "== shop floor to shipping"; node qa/sim/ui-floor-to-ship.cjs 2>&1 | tail -6
echo "== time tracking"; node qa/sim/ui-time-tracking.cjs 2>&1 | tail -6
echo "== production screens"; node qa/sim/ui-production-overview.cjs 2>&1 | tail -6
echo "== cancel demo jobs (database update, on a copy)"; PGPASSWORD=${PGPASSWORD:-password} qa/sim/db-cancel-demo-jobs.sh 2>&1 | tail -6
echo "== first five locations (database update, on a copy)"; PGPASSWORD=${PGPASSWORD:-password} qa/sim/db-first-five-locations.sh 2>&1 | tail -8
echo "== retire test data (database update, on a copy)"; PGPASSWORD=${PGPASSWORD:-password} qa/sim/db-retire-test-data.sh 2>&1 | tail -8
echo "== release stock of cancelled test orders (database update, on a copy)"; PGPASSWORD=${PGPASSWORD:-password} qa/sim/db-release-test-stock.sh 2>&1 | tail -8
echo "== move old stock to the real branches (database update, on a copy)"; PGPASSWORD=${PGPASSWORD:-password} qa/sim/db-move-old-stock.sh 2>&1 | tail -8
echo "== store on real branches"; node qa/sim/store-branches.mjs --base http://localhost:3011 2>&1 | tail -6; node qa/sim/ui-store-branches.cjs 2>&1 | tail -6
echo "== freight screens on real shipments"; node qa/sim/ui-freight.cjs 2>&1 | tail -6
echo "== staff with no branch"; node qa/sim/ui-staff-no-branch.cjs 2>&1 | tail -6
echo "== failed reads on the real-data screens"; node qa/sim/ui-failed-reads.cjs 2>&1 | tail -6
echo "== real-data screens at three sizes"; node qa/sim/ui-real-data-sizes.cjs 2>&1 | tail -6
echo "== who may ask the real-data routes"; node qa/sim/real-data-access.mjs --base http://localhost:3011 2>&1 | tail -6
echo "== work center codes: several of one kind at each branch"; node qa/sim/work-center-codes.mjs --base http://localhost:3011 2>&1 | grep "✗\|work center codes"
echo "== plan change: a job's plan changed while it is in production"; node qa/sim/plan-change.mjs --base http://localhost:3011 2>&1 | grep "✗\|plan change"
echo "== work order job: a new work order makes a job to be planned"; node qa/sim/work-order-job.mjs --base http://localhost:3011 2>&1 | grep "✗\|work order job"
echo "== response times of the real-data routes"; node qa/sim/perf-real-data-routes.mjs --base http://localhost:3011 2>&1 | tail -15
echo "== locations"; node qa/sim/ui-locations.cjs 2>&1 | tail -6
echo "== phase 9 UI scenarios"; node qa/sim/phase9-ui.cjs 2>&1 | grep "✗\|Phase 9 UI"
echo "== every screen opens"; node qa/sim/ui-smoke.cjs 2>&1 | tail -8
echo "== every screen measured at three sizes"; node qa/sim/ui-audit.cjs --out qa/results/ui-audit.json > "$LOGS/ui-audit.log" 2>&1; node qa/tools/ui-audit-gate.cjs qa/results/ui-audit.json
# Phase 9.5 runs last of the scenarios: it starts the QA ledger, and everything above is checked with the ledger never started, as it is on the live system until the accountant approves.
echo "== phase 9.5 ledger scenarios"; node qa/sim/phase95-ledger.mjs --base http://localhost:3011 2>&1 | grep -v "^\s*at " | tail -12
echo "== finance ledger sandbox"; node qa/sim/ledger-sandbox.mjs --base http://localhost:3011 2>&1 | grep -v "^\s*at " | tail -4
echo "== finance ledger sandbox UI"; node qa/sim/ledger-sandbox-ui.cjs 2>&1 | grep "✗\|sandbox UI"
echo "== phase 9.5 UI scenarios"; node qa/sim/phase95-ui.cjs 2>&1 | grep "✗\|Phase 9.5 UI"
echo "== phase 10 security scenarios"; [ -f qa/sim/phase10-security.mjs ] && node qa/sim/phase10-security.mjs --base http://localhost:3011 --server-log "$LOGS/server-3011.log" 2>&1 | grep -v "^\s*at " | tail -14
echo "== phase 9.5 load, 80 branches"; node qa/sim/phase95-load.mjs --base http://localhost:3011 2>&1 | grep "✗\|stage 1\|Phase 9.5 load"
# Phase 11: three server copies behind one front door on the same QA database; the enterprise day, then the 320 scenarios.
echo "== phase 11 enterprise run, three server copies"; P11_DB="$(basename "${DATABASE_URL%%\?*}")" qa/tools/phase11-cluster.sh 3 | tail -1; node qa/sim/phase11-enterprise.mjs --base http://localhost:3110 --cycle gate --label "Gate" --out qa/results/phase11-gate-enterprise.json 2>&1 | grep -E "customer jobs|transactions:|books:|^✗|^✓ Phase|slower|dispatch with"
echo "== phase 11 scenarios"; node qa/sim/phase11-scenarios.mjs --base http://localhost:3110 --stub-port 3166 --app http://localhost:5199 --out qa/results/phase11-gate-scenarios.json 2>&1 | grep -v "^\s*at " | tail -16
# Phase 12: the certification suite on the same three server copies (ten cross-module flows, the ledger, reconciliation,
# dashboards, the assistant, security, multi-location), then the browser checks, the process checks and the manual check.
echo "== phase 12 certification"; node qa/sim/phase12-certification.mjs --base http://localhost:3110 --stub-port 3166 --out qa/results/phase12-certification.json 2>&1 | grep -v "^\s*at " | tail -14; pkill -f "qa-cluster.mjs --workers"
echo "== phase 12 UI scenarios"; node qa/sim/phase12-ui.cjs 2>&1 | grep "✗\|Phase 12 UI"
echo "== phase 12 process checks"; node qa/tools/phase12-process.mjs 2>&1 | grep "✗\|checks,"
echo "== phase 12 manual check"; node qa/tools/phase12-manual.mjs | tail -3
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
