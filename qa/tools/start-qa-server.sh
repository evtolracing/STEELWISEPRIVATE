#!/usr/bin/env bash
# Starts the backend against the local QA database on port 3011.
# The request limits are raised because one simulation cycle sends ~600
# requests from a single address; the limits themselves are tested separately.
set -euo pipefail
# SERVER_DATABASE_URL lets the server connect as a different database role from the tests, such as the
# least-privilege role "steelwise_runtime" (Phase 10, W-014). The tests keep the owner's connection.
export DATABASE_URL="${SERVER_DATABASE_URL:-${QA_DATABASE_URL:-postgresql://postgres:password@localhost:5432/steelwise_qa}}"
export DIRECT_URL="$DATABASE_URL"
case "$DATABASE_URL" in *localhost*qa*|*127.0.0.1*qa*) ;; *) echo "Refusing: not a local QA database"; exit 1;; esac
export LOG_REQUESTS="${LOG_REQUESTS:-off}" RATE_LIMIT_MAX=1000000 LOGIN_RATE_LIMIT_MAX=100000 PORT="${PORT:-3011}"
# Outside services. A simulation must never reach a real provider, so every provider address
# points at the local stand-in that the Phase 4 scenarios start (qa/sim/phase4-integration.mjs),
# with keys that are not real. Short time limits keep the failure scenarios quick.
STUB="${QA_STUB_URL:-http://127.0.0.1:3056}"
export ELEVENLABS_API_KEY=qa-not-a-real-speech-key ELEVENLABS_BASE_URL="$STUB/speech" SPEECH_TIMEOUT_MS=1500
export DEEPSEEK_API_KEY=qa-not-a-real-ai-key DEEPSEEK_BASE_URL="$STUB/ai" OPENAI_API_KEY= ANTHROPIC_API_KEY= AI_TIMEOUT_MS=1500
# Phase 10: a fixed QA signing secret, so the scenarios can forge tokens (expired, other algorithms, changed
# claims) and prove the server refuses them; and the alert channel points at the stand-in (Y-010).
export JWT_SECRET="${QA_JWT_SECRET:-qa-jwt-secret-not-real-0123456789abcdef}" ALERT_WEBHOOK_URL="${QA_ALERT_URL:-$STUB/alerts}"
export WEBHOOK_TIMEOUT_MS=1500 OUTBOUND_BREAKER_REST_MS=3000 TASKS_SECRET=qa-tasks-secret-not-real
cd "$(dirname "$0")/../../src/backend"
exec node src/server.js
