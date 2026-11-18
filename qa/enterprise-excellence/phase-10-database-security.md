# Phase 10: database security and least privilege

## The problem (Y-008, Y-009, W-014)

The application connected as the database owner. On QA that is a superuser; on the host it is the owner of every table. Whoever controls the server process could therefore:

- switch off the four journal guards for a session (`SET session_replication_role = replica`) or drop them, and change posted entries;
- update or delete history rows;
- rewrite `_prisma_migrations`, the record of which updates were applied;
- create or drop tables and functions.

Application-level immutability is not enough when the connection itself can turn it off.

## The correction: database update 17

`src/backend/prisma/migrations/20261118090000_security_hardening/migration.sql`, SQL Editor file `src/backend/prisma/upgrades/sql-editor/20261118090000_security_hardening.sql` (copy: `/mnt/project-files/database-updates/17-20261118090000_security_hardening.sql`), rollback file beside it.

1. Three columns on `User`: `tokensValidAfter`, `failedLoginCount`, `lockedUntil` (for Y-001 and Y-002).
2. Role `steelwise_runtime`, created `NOLOGIN` (no password is put in a file). It gets `USAGE` on the schema, `SELECT, INSERT, UPDATE, DELETE` on tables, `USAGE, SELECT` on sequences, and the same by default for tables added later.
3. `UPDATE, DELETE, TRUNCATE` on `AuditLog` taken away: history is insert-only.
4. Writes on `_prisma_migrations` taken away.
5. It owns nothing, is not a superuser, cannot bypass row security and has no `CREATE` on the schema.

The owner gives the role a password and points `DATABASE_URL` at it when he chooses. Until then nothing changes on the live system: the application keeps connecting as before. Migrations keep running as the owner (`DIRECT_URL`).

## Tested

**On a copy** (a separate PostgreSQL 16 server, port 5433, database built from migrations 1 to 16): file 17 run twice (the second run reports it is already applied), `prisma migrate diff` finds nothing, the verify file `verify-6-to-17.sql` answers every row OK. As `steelwise_runtime` with row security on: insert into history allowed; update, delete and truncate of history denied; truncate of the journal denied; disable trigger answers "must be owner"; `session_replication_role` denied; create and drop of tables and functions denied; writes on `_prisma_migrations` denied. Rollback file run twice, then file 17 again, diff clean.

**On QA**: every suite of the gate runs with the server connected as `steelwise_runtime` (`qa/tools/run-gates.sh` gives the role a QA-only password). Group 3 has 14 "The application's database role cannot ..." scenarios plus: it cannot give itself more rights; it can do its work (rolled back); it is not a superuser, cannot bypass row security and owns nothing; the running QA server's `current_user` is `steelwise_runtime`. Proof by removal: granting back the history, update-record or create rights makes the named scenario fail (Y-011, Y-008, Y-009).

## What remains for the owner

- Apply file 17, then `verify-6-to-17.sql`.
- Decide when to switch `DATABASE_URL` to the role: `ALTER ROLE steelwise_runtime LOGIN PASSWORD '...'` in the SQL editor; on the Supabase pooler the user name is `steelwise_runtime.<project ref>`. Keep `DIRECT_URL` as the owner for migrations.
- Until the switch, W-014 and Y-008 stay FIXED — NOT VERIFIED on the live system.
