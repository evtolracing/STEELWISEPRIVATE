# Phase 10: backup review

## What exists

| Layer | Backup | Who controls it | Exercised |
|---|---|---|---|
| Live database (Supabase PostgreSQL) | The host's daily backups, and point-in-time recovery if the plan includes it | The owner, in the Supabase dashboard | **No.** Not visible from this environment; never restored (E-015) |
| Stored documents | In the database (`DocumentBlob`) on the host; on a disk host also files under `src/backend/uploads` | With the database | Database part: yes, in the restore test below |
| Application code | Git (GitHub), every deployment from a commit | The owner | Yes: every phase builds from the repository |
| Host settings (secrets, addresses) | The Vercel project settings; no copy in the repository by design | The owner | No |
| QA | `pg_dump` of the QA database, restored to a separate server | This phase | **Yes** (`phase-10-restore-test.md`) |

## What a backup must contain to be useful

The restore test checks each of these, comparing the restored database with the figures read just before the backup:

- every table, every constraint, the record of applied updates;
- posted journal lines with their debit and credit totals, every journal entry, the entry number sequence, the four journal guards;
- invoices with what is still owed, stock rows with quantities, logins, history rows;
- stored document files (count and bytes);
- the application role's rights (file 17).

## Gaps for the owner

1. Confirm in Supabase which backups the plan keeps (daily for how many days, point-in-time recovery or not). That decides the real recovery point (`phase-10-disaster-recovery.md`).
2. Restore one of those backups into a new Supabase project (never over the live one) once, following `phase-10-restore-test.md`, and record the time. Until then E-015 stays FIXED — NOT VERIFIED.
3. Keep a copy of the Vercel environment settings somewhere safe outside Vercel; they are not in any backup.
4. Files under `src/backend/uploads` exist only on a disk host. The deployed host stores documents in the database; nothing extra is needed there.
