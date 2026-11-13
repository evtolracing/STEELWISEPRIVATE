#!/usr/bin/env bash
# Starts the backend against the local QA database on port 3011.
# The request limits are raised because one simulation cycle sends ~600
# requests from a single address; the limits themselves are tested separately.
set -euo pipefail
export DATABASE_URL="${QA_DATABASE_URL:-postgresql://postgres:password@localhost:5432/steelwise_qa}"
export DIRECT_URL="$DATABASE_URL"
case "$DATABASE_URL" in *localhost*qa*|*127.0.0.1*qa*) ;; *) echo "Refusing: not a local QA database"; exit 1;; esac
export LOG_REQUESTS="${LOG_REQUESTS:-off}" RATE_LIMIT_MAX=1000000 LOGIN_RATE_LIMIT_MAX=100000 PORT="${PORT:-3011}"
cd "$(dirname "$0")/../../src/backend"
exec node src/server.js
