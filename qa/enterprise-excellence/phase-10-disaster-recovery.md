# Phase 10: disaster recovery

**The recovery objectives below are proposals. None has been approved. They are written so the owner can accept, change or refuse each one; until he does, there is no recovery commitment.**

## Proposed objectives

| Failure | Proposed recovery time (RTO) | Proposed recovery point (RPO) | What it rests on | Verified |
|---|---|---|---|---|
| A bad deployment | 15 minutes | Nothing lost | Vercel "promote" of the previous deployment; no deployment changes the database (group 8) | Read and tested: the build runs no migration and the health check names the deployed commit. Promote on the host NOT VERIFIED |
| A bad database update | 1 hour | Nothing lost | Update 17 has a tested rollback file. Files 1 to 16 have none; their way back is the restore below | File 17 rollback tested twice on a copy |
| The application's server process stops | Minutes, by the host | Nothing lost (each save is one transaction) | Group 7: kill -9 leaves no half-saved dispatch; a gap between dispatch and billing is listed and alerted | Yes, on QA |
| Data damaged by a person or a fault | 4 hours | The last good backup; with point-in-time recovery, minutes before the damage | Restore into a new project, compare, then switch | Procedure verified on QA; host backup NOT VERIFIED |
| The database host is lost | 1 business day | The host's latest backup (daily plans: up to 24 hours) | A new Supabase project, restore, update the host settings | NOT VERIFIED |
| The application host is lost | 1 business day | Nothing lost (code in Git) | Deploy the repository to another Node host with the same settings | NOT VERIFIED |

The owner should confirm the Supabase plan's backup frequency first: it fixes the true RPO for the last two rows.

## Order of recovery for a data loss

1. Stop writes: put the site in maintenance (Vercel: promote a maintenance deployment, or remove the API rewrite) so nothing new is written to a damaged database.
2. Decide the recovery point: the last backup before the damage (from the history: `AuditLog` shows who did what and when).
3. Restore into a **new** database, never over the live one (`phase-10-restore-test.md`, steps 3 to 9).
4. Compare the restore with what the business knows: the last invoices, payments and shipments of the day.
5. Point `DATABASE_URL` and `DIRECT_URL` at the restored database; redeploy.
6. Run a reconciliation (Finance, Reconciliation) and the system checks; both must be clean.
7. Re-enter anything written after the recovery point, from paper or the partner's records. The ledger posts it as normal.

## What is outside the software

Supabase and Vercel account security (two-factor sign-in for the owner), the domain registrar, the email provider, and who may act in an emergency. These are the owner's and are listed so they are not assumed.
