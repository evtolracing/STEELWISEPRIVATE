# Phase 10: security baseline

Measured on 2026-11-18 before any Phase 10 correction, on the local QA database (`steelwise_qa`), with the code at `main` `60ce6d2` (Phase 9.5 merged). Nothing here was run against the live system.

The probe is `qa/sim/p10-probe.mjs`. It makes its own throwaway login, so it does not lock or change any fixture login.

## What the probe measured

| Probe | Result at the baseline | Finding |
|---|---|---|
| Old token after a password change | 200 (still worked) | Y-001 |
| Old token after an administrator reset the password | 200 (still worked) | Y-001 |
| 30 wrong passwords for one login, each from a different address | 30 × 401; nothing paused the login | Y-002 |
| Time to refuse a wrong password: address with a login / without one | 90.7 ms / 4.3 ms (median of 8) | Y-003 |
| Upload with entity type `../../../qa-p10-escape` | 201; the file was written to `qa-p10-escape/` in the repository root, outside the uploads folder | Y-004 |
| An uploaded `.html` file fetched by its address with no sign-in | 200, `text/html` | Y-005, B-021 |
| A "PDF" whose bytes start `MZ` (a Windows program) | 201, accepted | Y-006 |
| Token verification names its algorithm | No | Y-007 |
| Database role the application connects as | `postgres`, superuser, owner of the journal tables | Y-008, Y-009, W-014 |

The stray `qa-p10-escape/` folder made by the probe was deleted the same session; it is not in the commit.

## Read from the code at the baseline

- Sign-in: JWT in a `Bearer` header, 24-hour life by default, HS256 by the library's default only. No server-side session record, no way to end a token early.
- Roles: `requireRole()` always admits `SUPER_ADMIN`, `TENANT_OWNER`, `ADMIN`, `BRANCH_MANAGER`, `OPS_MANAGER`. The access gate (`lib/roleAccess.js`) adds department rules; reads under `/api/admin` and `/api/v1/admin` are open to any signed-in staff login (Y-019 for the partner part).
- Branch isolation: a Prisma extension (`lib/branchScope.js`) on branch-owned models. Documents are not branch-owned and had no check of their own (Y-016).
- History (`AuditLog`): written by the application; two routes updated or deleted rows in it (Y-011).
- Alerting: none. `/api/health` answered whether the process and database answer (Y-010).
- Ledger: posted entries guarded by four database triggers (Phase 9.5), which the connecting role could switch off (W-014).
- Backup and restore: never exercised (W-020, E-015).

## What was already sound and was kept

- Passwords hashed with bcrypt (cost 10); the hash is never in an answer.
- Partner API: separate token issuer and secret, hashed client secrets, scopes, per-partner rate limit, signed webhooks.
- Request ids on every answer, one JSON log line per request, error answers without internals (Phase 4).
- The ledger's own rules: balance, two people, closed months, idempotent posting (Phase 9.5, 158 scenarios).
- Gapless invoice numbers, idempotency keys on money and stock routes (Phases 3 to 8).

The baseline is the "before" column of every finding in `findings-register.md` (Y-001 to Y-021).
