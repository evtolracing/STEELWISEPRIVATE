# Phase 12: deployment checklist

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**Nothing in this checklist has been executed. Claude does not deploy, does not apply database updates and does not change host settings.** It is written to be executed by the owner, top to bottom. A step that cannot be ticked stops the deployment.

## A. Before the day

| # | Step | Who | How to verify | Done |
|---|---|---|---|---|
| 1 | Written authorization to deploy this release candidate to the agreed scope (stage and branches) | Executive, owner | The approvals table in `phase-12-final-report.md` filled in by the people themselves | [ ] |
| 2 | The pull request for RC-2 is merged by the owner's word, and the commit to deploy is recorded | Owner | Commit id written here: ________________ | [ ] |
| 3 | A backup of the live database is taken **and restored once into a scratch project** (E-015) | Owner | The restored copy signs in; `phase-10-restore-test.md` steps pass | [ ] |
| 4 | Which database updates are applied on live is established (files 1 to 18 in `src/backend/prisma/upgrades/sql-editor/`) | Owner | Sign-in on the current site names a missing update; the `_prisma_migrations` table lists the applied ones | [ ] |
| 5 | Host settings reviewed against `phase-10-deployment-safety.md`: `NODE_ENV=production`, `JWT_SECRET` (32 characters or more), `DATABASE_URL`, `CORS_ORIGIN` empty or the site's own address, **`SEED_ON_START` absent** | Owner | Read on the host; never pasted into a document or chat | [ ] |
| 6 | The alert address (`ALERT_WEBHOOK_URL`) is set to a receiver that a named person reads (E-017) | Owner | A test alert arrives | [ ] |
| 7 | The scheduled run is configured on the host (B-019) | Owner | Admin, Integrations shows when it last ran | [ ] |
| 8 | An outside monitor polls `/api/health/ready` | Owner or IT | It alerts when the address is wrong on purpose | [ ] |

## B. Database, then code (in this order)

| # | Step | Who | How to verify | Done |
|---|---|---|---|---|
| 1 | Apply the missing SQL Editor files in number order. Each is safe to run twice | Owner | Each ends without error; run the file's own check query | [ ] |
| 2 | File 17 last among them, then point `DATABASE_URL` at the limited role `steelwise_runtime` (Y-008). **Deploying the Phase 10 code before file 17 stops every sign-in** | Owner | `/api/health/ready` is 200; a sign-in works | [ ] |
| 3 | Deploy the recorded commit | Owner | `/api/health` names that commit | [ ] |
| 4 | Frontend build is the one from the same commit | Owner | The page footer or `/api/health` commit matches | [ ] |

## C. First hour

| # | Step | Who | How to verify | Done |
|---|---|---|---|---|
| 1 | Sign in as an administrator, a branch user and a customer login | IT | Each sees its own menu; the customer sees only its account | [ ] |
| 2 | Admin, Integrations: no failed events, no shipped-not-invoiced, scheduled run recent | IT | Screen read | [ ] |
| 3 | Upload a small file and download it again (D-011b: never verified on the host) | IT | Bytes identical | [ ] |
| 4 | The first real outside call, if any provider is configured (H-005: never verified against a real provider) | IT | Admin, Integrations shows the call succeeded | [ ] |
| 5 | Counts on live data that were unknown here: H-006, H-018, L-031, N-004 | IT | Read from the reports named in each finding | [ ] |
| 6 | Finance, Overview says the books are **not running** (the ledger stays off until the accountant approves) | Finance | Screen read | [ ] |

## D. Section 25, item by item: what was verified here

| Item | Verified in this phase | State |
|---|---|---|
| Production configuration | A server started in production mode on QA: pass: a production server starts on the QA database; pass: in production, with no list of allowed websites, another website is given no permission to read answers; pass: with a list, a website not on it is given no permission; pass: and the listed website is | Verified for the code; **host values not read** |
| Environment variables and secrets | The server refuses to start in production with a short or missing secret (Phase 10); no secret is in the repository or the page bundle (Security 10) | Verified for the code |
| Database migrations | Rebuilt from migrations in the gate; no new one in this phase | Verified on QA; **live state unknown** |
| API compatibility | Phase 4 integration scenarios: 66 of 66 pass, 555 checks | Verified on QA |
| Frontend build | built in 16.21s | Verified |
| Worker deployment and queue configuration | There is no separate worker: scheduled work is one route a scheduler calls. Tested on three copies in Phase 11 | **Not configured on the host (B-019)** |
| Integration configuration | Stand-ins only | **NOT VERIFIED against real providers** |
| Monitoring and alerting | See `phase-12-operational-acceptance.md` | **Reaches nobody on live (E-017)** |
| Backups | See `phase-12-disaster-recovery.md` | **Not verified on live (E-015)** |
