#!/usr/bin/env bash
# Drops and rebuilds the local QA database: tables, demo seed data and QA fixtures.
# Each simulation cycle uses up QA stock, so run this before a certification run.
set -euo pipefail
export DATABASE_URL="${QA_DATABASE_URL:-postgresql://postgres:password@localhost:5432/steelwise_qa}"
export DIRECT_URL="$DATABASE_URL"
case "$DATABASE_URL" in *localhost*qa*|*127.0.0.1*qa*) ;; *) echo "Refusing: not a local QA database"; exit 1;; esac
root="$(cd "$(dirname "$0")/../.." && pwd)"
db="${DATABASE_URL##*/}"
admin="${DATABASE_URL%/*}/postgres"
psql "$admin" -q -c "DROP DATABASE IF EXISTS \"$db\" WITH (FORCE)" -c "CREATE DATABASE \"$db\""
cd "$root/src/backend"
npx prisma migrate deploy >/dev/null
node prisma/seed.js >/dev/null
npm run -s db:seed:demo >/dev/null
cd "$root" && node qa/sim/fixtures.mjs
