# Phase 3: backup and recovery assessment

**Summary: no backup or restore of the live database has been verified.** The live database is hosted by the owner's provider and cannot be reached from this environment. What follows is what can be said from the repository and from tests on local databases, and what the owner needs to check. Nothing here claims that a backup exists or works.

## 1. What was verified, and where

| Item | Verified? | Evidence |
|---|---|---|
| The schema can be rebuilt from nothing | Yes, locally | 26 migrations apply to an empty database with no failure, at the start of every gate run |
| A populated database can be copied and upgraded | Yes, locally | A 325 MB copy was created from a template and upgraded with the SQL Editor files in under a second each |
| An unfinished transaction leaves nothing behind | Yes, locally | Forced-failure scenarios: order with a bad line, dispatch with a held line, credit whose last step fails |
| Backups of the live database are being taken | **NOT VERIFIED** | The provider's settings are the owner's |
| Point-in-time recovery is switched on | **NOT VERIFIED** | Same |
| How long backups are kept | **NOT VERIFIED** | Same |
| A backup has ever been restored | **NOT VERIFIED.** No record of one exists in the repository | E-015 (P1) |
| Uploaded files (documents, certificates) are backed up | **NOT VERIFIED** | They live in the provider's file storage, outside the database |
| Secrets and settings can be recreated | **NOT VERIFIED** | Host settings are the owner's; `.env.example` lists the names |
| A staging database exists | No | Stated in Phase 2 |

## 2. What the application assumes

- One primary database. No replica, no failover logic in the code.
- No scheduled job exports or archives anything (B-019).
- The audit trail and the stock ledger live in the same database as the records they describe. Losing the database loses both.
- Document numbers come from row counts. After a restore to an earlier point, numbers issued after that point will be issued again to different documents. Paper already sent to customers with those numbers would then collide with new records. This is a property of the design and matters for any point-in-time restore.

## 3. Recovery objectives

No recovery point or recovery time objective has been set. Suggested starting points for the owner to accept or change, on the reasoning that this system holds stock, invoices and payments for about 80 branches:

| Objective | Suggestion | Needs |
|---|---|---|
| Recovery point (how much work may be lost) | 5 minutes or less | Point-in-time recovery on the provider's plan |
| Recovery time (how long until working again) | 1 hour | A written, rehearsed procedure |
| Backup retention | 30 days, plus month-end copies for 7 years if the accountant requires | Provider settings and an export |

## 4. The test that is missing

One restore, timed and written down:

1. In the provider's console, restore the latest backup into a new, separate project (not over the live one).
2. Note the time it takes.
3. Point a copy of the server at it and run `node qa/tools/db-facts.mjs` read-only. It reports row counts and every consistency check in this phase. This doubles as the dry run that shows whether live data breaks any new rule.
4. Apply SQL Editor files 6 to 8 to the restored copy first, before the live database, and read the notices.
5. Delete the copy.

Only the owner can do steps 1 and 5. Steps 3 and 4 can be done in a session like this one if the owner supplies a connection string to the restored copy, which would be a database that is safe to test against.

## 5. Failure cases and what would happen today

| Failure | Outcome with what is verified |
|---|---|
| A bad deployment | Revert the pull request; the host keeps earlier deployments. The schema changes of this phase are compatible with the previous code |
| A SQL Editor file applied twice | Skips itself |
| A SQL Editor file fails half-way | Each file runs in a transaction; nothing is applied. NOT VERIFIED against the live database |
| A table dropped or rows deleted by mistake | Depends entirely on the provider's backups: NOT VERIFIED |
| The database is lost | Same |
| Corrupted amounts or quantities written by a defect | The database checks added in this phase refuse the commonest kinds. For others, the stock ledger and audit trail allow reconstruction by hand for records that have movements and history lines; there is no tool for it |

## 6. Disposition

E-015 stays open as a P1 with the status REQUIRES BUSINESS DECISION, because the next step is the owner's. This phase's Gate H is therefore not met in full: migrations are tested and reversible; recovery is unverified.
