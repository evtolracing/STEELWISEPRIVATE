# Phase 10: secrets review

No secret value is printed in this document, in the logs of this phase or in the commit.

## Where secrets live

| Secret | Where it is set | Read by | Phase 10 note |
|---|---|---|---|
| `JWT_SECRET` | Host environment (owner) | `config/index.js` | The server refuses to start in production without it (group 3) |
| `DATABASE_URL`, `DIRECT_URL` | Host environment | Prisma | File 17 adds a least-privilege role; switching to it is the owner's (phase-10-database-security.md) |
| `PARTNER_JWT_SECRET` | Host environment, optional | partner token issuer | When not set it is derived from `JWT_SECRET` by HMAC, so the two keys always differ; a staff-signed token is refused by the partner API (group 6) |
| Partner client secrets | Database, hashed | partner auth | Shown once when a key is made |
| Webhook secrets | Database | webhook signer | Shown once at creation, never in a list (group 6) |
| `CRON_SECRET` / `TASKS_SECRET` | Host environment | scheduled run | A missing, wrong or in-address secret is refused (group 6) |
| AI provider keys | Host environment or Supabase | AI service | What is sent to the model carries no secret (group 4) |
| `ALERT_WEBHOOK_URL` | Host environment (new, optional) | alerts | An address may carry a token; it is never logged or shown; the checks say only "SET UP" or "NOT SET UP" |

## Checks added

- `qa/tools/secret-scan.mjs`: searches every tracked file (lock files aside) for AI provider and payment keys, cloud access keys, private keys, hosted database addresses carrying a password, chat and source-host tokens, and signed tokens. It prints the file and line only, never the match. An allowlist covers QA fixtures marked as not real (`qa-...-not-a-secret`, `not-a-real`), `example.invalid` and `.env.example`. It passes; it runs in CI (`.github/workflows/backend-tests.yml`) and in group 8 ("No secret is in the repository or the frontend source").
- Group 9: the server log carries no password and no bearer token; alert bodies carry nothing secret (the check matches secret-shaped values, not the word "password").

## QA values

QA uses fixed, deliberately fake values so runs are repeatable: a JWT secret named `qa-jwt-secret-not-real-...` and a runtime-role password `qa-runtime-not-a-secret`, set only on the local QA database by `qa/tools/run-gates.sh`. Neither is used anywhere else.

## Not done, by rule

No production credential was read, displayed or rotated. Rotation is the owner's decision; the runbook "A secret has leaked" in `phase-10-incident-runbooks.md` says how.
