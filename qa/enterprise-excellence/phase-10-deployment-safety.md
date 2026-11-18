# Phase 10: deployment, database update and rollback safety

## How a change reaches the live system

1. A pull request; CI (`.github/workflows/backend-tests.yml`) runs the backend tests, the frontend checks, `npm audit` at the critical level for both packages, and the secret scan.
2. The owner merges. Vercel builds from the commit (`vercel.json`: install, `node scripts/build.cjs`, static frontend, one API function with a 30 s limit and 1 GB).
3. A database update is never run by the build. The owner applies it himself in the Supabase SQL editor from the SQL Editor file, then runs the verify file.

## Rules that keep it safe, and their checks

| Rule | Check |
|---|---|
| The build does not change the database | group 8 "The build does not change the database": no migrate, db push or psql in `scripts/build.cjs` or the install or build command |
| A deployment says which commit it is | group 8: `/api/health` reports `VERCEL_GIT_COMMIT_SHA` when the host sets it |
| Every update builds from scratch and matches the schema | group 8: `migrate deploy` on an empty database, a second run has nothing to do, `migrate diff` finds nothing |
| An update can be run twice | File 17 run twice on a copy; on the restore it reports it is already applied |
| An update has a way back | File 17's rollback file, tested twice on a copy, then 17 reapplied, diff clean |
| The code says what is missing when the update is not applied | group 8: the finished code on a copy with file 17 rolled back answers sign-in 503 DATABASE_UPDATE_REQUIRED naming update 17, and health 200 (Y-022). **Apply file 17 before deploying this code** (below) |
| No secret is in the repository | `qa/tools/secret-scan.mjs` in CI and in group 8 |
| CI runs the tests on every pull request | group 8 reads the workflow |

## Order for this phase

1. Apply `17-20261118090000_security_hardening.sql` in the SQL editor, then `verify-6-to-17.sql`: every row should say OK or APPLIED.
2. Merge and let Vercel deploy. The application keeps connecting as before; nothing else changes on the host.
3. When you choose, switch to the least-privilege role: give it a password in the SQL editor, put it in `DATABASE_URL` (on the pooler the user is `steelwise_runtime.<project ref>`), keep `DIRECT_URL` as it is, redeploy.
4. Optional: set `ALERT_WEBHOOK_URL`.

If step 2 is done before step 1, nobody can sign in: the code reads `tokensValidAfter`, `failedLoginCount` and `lockedUntil`. Measured on a copy without file 17: before Y-022 every sign-in answered a bare 500; now it answers 503 "Database update 17 (security hardening) has to be applied first." and health keeps answering. The way back is to apply file 17 (safe at any time) or to promote the previous deployment.

## Rolling back

- Code: promote the previous deployment in Vercel. No database change is needed: file 17 is compatible with the earlier code (it adds columns and a role; the earlier code ignores both).
- File 17: switch `DATABASE_URL` back to the owner first, then run `rollback-17-20261118090000_security_hardening.sql`. It removes the role's rights and the role, the three columns and the update's record. Lost by rolling back: the pause state of any paused login and the session marks (every token stays valid until it expires, as before).
