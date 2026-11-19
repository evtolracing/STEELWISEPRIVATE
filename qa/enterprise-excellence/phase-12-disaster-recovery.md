# Phase 12: backup and disaster recovery certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

## Verdict

**Recovery is verified for the method, on a local database. It is NOT VERIFIED for the live system.** The host's backups have never been restored (E-015; owner, 2026-11-13: "backups later"). Unverified backup recovery is a named release blocker and it stands.

## The actual restore evidence (Phase 10, `qa/results/phase10-restore.json`)

| Item | Measured |
|---|---|
| Source | local QA database steelwise_qa |
| Target | separate PostgreSQL 16 server on port 5433, database steelwise_qa_restore |
| Backup | pg_dump custom format, compression 6; 2,492,751 bytes in 0.4 s |
| Restore | 1.7 s, exit 0, 0 errors |
| Recovery point | the start of pg_dump (one consistent snapshot); written after the start and lost: 1 |
| Tables | 173 |
| Journal (lines : debits : credits) before | 1478:277130.84:277130.84 |
| Journal after | 1478:277130.84:277130.84 |
| Stock (items : value) before / after | 1306:5881060.807800000000000000000000000000 / 1306:5881060.807800000000000000000000000000 |
| Audit rows before / after | 6578 / 6578 |
| Run at | 2026-11-19T00:15:38.728Z |

The restore test is part of the Phase 10 security suite, which ran again in the final gate: p10: not in the gate log.

## Section 24, item by item

| Item | On QA | On live |
|---|---|---|
| Backup coverage | Whole database, one consistent snapshot | **Not confirmed**: the host's backup plan and retention were not read (G-015) |
| Restore success | Yes, into a separate server | **Never done** |
| Database integrity | Tables, rows and migrations identical | unknown |
| Ledger integrity | Journal balances; the four guards and the numbering are kept; the restored application reconciles with no difference | unknown |
| Inventory integrity | Stock count and value identical | unknown |
| Audit history | Identical | unknown |
| Recovery time | Seconds, at QA size. **Not a figure for the live database** | unknown |
| Recovery point | The moment the backup starts; anything after is lost | Depends on the host's plan: **not confirmed** |
| Recovery procedures | `phase-10-disaster-recovery.md`, `phase-10-restore-test.md` | Written for the owner; not rehearsed |

## Does RC-2 change recovery behaviour

No. This phase made no database change (no migration, no SQL Editor file) and changed no backup or restore code. Product files changed: 10, all in request handling and the help manual. An additional restore test is therefore not required by the change; the one in the gate was run anyway.

## Unresolved limitations

- The live restore (E-015). One restore of a host backup into a scratch project, followed by the reconciliation, closes it. Only the owner can do it.
- Uploaded files are not in the database backup. Where they live on the host and whether they are backed up is not confirmed (D-011b).
- No measured recovery time for the real database size.
- No second region or standby is configured, and none is claimed.
