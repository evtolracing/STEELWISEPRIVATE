#!/bin/bash
# Phase 11: N server copies on a local QA database behind one front door (qa/tools/qa-cluster.mjs).
#   qa/tools/phase11-cluster.sh [copies=3] [--rebuild]
#   P11_DB (default steelwise_qa_p11), P11_PORT (default 3110), P11_STUB (default 3166), EXTRA_ENV="K=V ..."
# The copies connect as the least-privilege role steelwise_runtime. --rebuild builds the database from the
# migrations first. Local QA only: the database name must contain "qa".
N=${1:-3}; DB=${P11_DB:-steelwise_qa_p11}; PORT=${P11_PORT:-3110}; STUB=${P11_STUB:-3166}
case "$DB" in *qa*) ;; *) echo "Refusing: $DB is not a QA database"; exit 2;; esac
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
OWNER=postgresql://postgres:password@localhost:5432/$DB
pkill -f "qa-cluster.mjs --workers" 2>/dev/null
for i in $(seq 1 20); do pgrep -f "qa-cluster.mjs --workers" >/dev/null || break; node -e "setTimeout(()=>{},200)"; done
for p in $(seq $PORT $((PORT + 8))); do pid=$(lsof -ti tcp:$p -sTCP:LISTEN 2>/dev/null); [ -n "$pid" ] && kill $pid; done
node -e "setTimeout(()=>{},800)"
if [ "$2" = "--rebuild" ]; then
  QA_DATABASE_URL=$OWNER bash qa/tools/rebuild-qa-db.sh > /tmp/p11-rebuild.log 2>&1 || { tail -5 /tmp/p11-rebuild.log; exit 1; }
  for i in $(seq 1 $N); do : > /tmp/qa-cluster-$i.log; done
fi
PGPASSWORD=password psql -U postgres -h localhost -d $DB -qAtc "ALTER ROLE steelwise_runtime LOGIN PASSWORD 'qa-runtime-not-a-secret'" || exit 1
(SERVER_DATABASE_URL=postgresql://steelwise_runtime:qa-runtime-not-a-secret@localhost:5432/$DB QA_DATABASE_URL=$OWNER QA_STUB_URL=http://127.0.0.1:$STUB LOG_REQUESTS=on nohup env $EXTRA_ENV node qa/tools/qa-cluster.mjs --workers $N --port $PORT >> /tmp/p11cluster.log 2>&1 &)
for i in $(seq 1 80); do
  if curl -s -m2 localhost:$PORT/__cluster/state | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const s=JSON.parse(d);process.exit(s.workers.length==$N&&s.workers.every(w=>w.up)?0:1)}catch{process.exit(1)}})"; then echo "up: $N copies on $DB behind port $PORT"; exit 0; fi
  node -e "setTimeout(()=>{},500)"
done
echo "not up"; exit 1
