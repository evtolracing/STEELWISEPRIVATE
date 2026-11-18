# Phase 10: restore test

An actual backup was restored into a separate database server and checked. Nothing was restored over the QA database or any live database. Group 8 of the Phase 10 suite (`qa/sim/phase10/g8-recovery.mjs`, 25 scenarios); the measured times are written to `qa/results/phase10-restore.json` by every run that takes a backup.

## Set-up

- Source: the local QA database after groups 1 to 7 had run, with an active test ledger (thousands of rows of journal, stock and invoices).
- Target: a second PostgreSQL 16 server with its own data folder, on port 5433 (`initdb -D /tmp/pg2`, then `pg_ctl -D /tmp/pg2 -o "-p 5433 -k /tmp" start`), database `steelwise_qa_restore`.
- A guard refuses any target that is not on localhost, not on a port other than 5432, or whose name does not contain both "qa" and "restore". Tested: a hosted Supabase address, the QA database itself, a name without "restore" on 5433, and a "restore" name on 5432 are all refused.

## Steps (the same steps are the runbook for a real restore)

1. Read the comparison figures from the source with nothing else writing.
2. `pg_dump -Fc -Z 6 -f <file> <source>`. A marker row is written to history 300 ms after the dump starts.
3. On the target server: create the role `steelwise_runtime` (`NOLOGIN`) if it does not exist (roles are server-wide and are not in a database dump), then `createdb`.
4. `pg_restore --exit-on-error --no-owner --role=postgres -d <target> <file>`.
5. Compare: tables, posted journal lines and totals, journal entries, invoices and amounts owed, stock rows and quantities, logins, applied database updates, constraints, stored document files.
6. Check the recovery point: the marker must be absent from the restore.
7. Check the journal guards (four, and an update of a posted line is refused), the entry numbering (the sequence is at or past the highest number), that the books balance, and that the application role has the same rights.
8. Start the application on the restore (port 3014, as the application role) and sign in as the CFO, read the trial balance, run a reconciliation.
9. Run database update 17 on the restore: it reports it is already applied and changes nothing.

## Results of the run recorded with this phase

| Measure | Value |
|---|---|
| Backup | 0.3 s, about 1 MB, custom format with compression 6 |
| Restore | 1.4 to 1.5 s, exit 0, no errors |
| Comparison | All nine figures equal |
| Recovery point | The moment `pg_dump` started: the marker written 300 ms later is not in the restore, and the history count is the count at the start |
| Journal | Four guards present; an update of a posted line refused; numbering continues without reuse; debits equal credits |
| Application on the restore | Answers; the CFO signs in; the trial balance balances; the reconciliation agrees (MATCH) |
| Update 17 again | Skipped as already applied |
| Every update from scratch on an empty database | `prisma migrate deploy` 2.1 s; a second run has nothing to do; `prisma migrate diff` finds no difference from the schema |
| Rollback of update 17 on a copy | Removes the columns and the role's rights; applying 17 again restores them; schema matches |

These times are for a QA-sized database on one container. The live database is larger: its restore time is NOT VERIFIED and must be measured by the owner's first restore of a host backup (`phase-10-backup-review.md`).

## Found during the test (test-side)

The backup scenario waited for the end of `pg_dump` after writing the marker; on a small database `pg_dump` had already finished, so the wait never ended. The wait now starts the moment the dump starts. The restore record is written only by a run that took a backup.
