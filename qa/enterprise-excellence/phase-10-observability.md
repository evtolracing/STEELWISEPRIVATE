# Phase 10: observability

Group 9 of the Phase 10 suite (`qa/sim/phase10/g9-observability.mjs`, 21 scenarios).

## What the system says about itself

| Signal | Where | Who may read it |
|---|---|---|
| Request id | `x-request-id` on every answer; a caller's id is kept when it is plain (letters, digits, dashes, at most a set length), replaced otherwise | Anyone |
| One log line per request | JSON: time, level, id, method, path, status, milliseconds, user id and role when signed in. Never the body, the password or the token | The host's log |
| Slow and failed requests | Level `warn` at 1 s or more, `error` at 500 or more | The host's log |
| Unhandled error | Answered with a plain sentence and the request id; logged with the id | Caller, host log |
| Liveness | `GET /api/health/live`: the process answers, without the database | Anyone |
| Readiness | `GET /api/health/ready`: 503 when the database does not answer; otherwise 200 "ready" or "attention" with the names of failing checks (no counts); kept 30 s | Anyone |
| Health | `GET /api/health`: database round trip in milliseconds, the deployed commit when the host sets it, no database address | Anyone |
| System checks | `GET /api/admin/integrations/checks`: every check with its count and sentence, the latest alerts, whether an alert channel is set up | Company administrators |
| History | `AuditLog`: sign-ins paused, passwords changed, sign-out everywhere, journal and report reads, ledger actions, overrides and their revocation | Auditors and administrators through the screens |

## The checks

database; stock balances add up; posted journal entries balance; ledger postings that failed; ledger events waiting for a person (over a day); last reconciliation found no difference; partner events delivered; scheduled run on time; shipped goods invoiced (Y-021); logins paused now. A check that cannot run is reported as failing with the reason, never as passing.

## Tested

Request ids (including three malformed ones), the log line (id present, no password or bearer token), liveness and readiness, the 30-second readiness cache, the health check's database measure, each named check present, a paused login counted and cleared, a failed posting raised and listed, alerts newest first with kind, severity and request id, sign-in events in history for one throwaway login, override history kept on revoke, rate limits configured, secrets never printed at start, a sales rep refused the operations pages, an unhandled error answered plainly, journal reads in history, the books' time zone and the server clock recorded with each reconciliation, the alert channel switched off, background posting failures not slowing the sale, and the host's function limits (30 s, 1 GB) read from `vercel.json`.

## Not in place (stated)

- No log store, dashboard or tracing service: logs go to the host's console. Choosing one is the owner's (E-017).
- No metrics endpoint for a scraper. The checks and the per-request log carry the counts and times that matter today.
