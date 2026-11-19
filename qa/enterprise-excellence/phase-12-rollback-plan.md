# Phase 12: rollback and recovery plan

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

## What can be rolled back, how, and what was tested

| What | How | Data effect | Tested |
|---|---|---|---|
| A deployment of code | In the Vercel dashboard, promote the previous deployment. The build never changes the database, so the previous code meets the database it left, plus any update applied since. | None | The rule that makes it safe is tested (Phase 10 group 8). **The promote itself is NOT VERIFIED**: it is an action in the owner's host account |
| Database update 17 (least-privilege role) | Its rollback file, then the previous deployment | None | Run twice on a copy in Phase 10; 17 reapplied; schema diff clean |
| Database update 18 (shared request limits) | The code falls back to counting in memory when the table is missing; the table can be dropped | Request counters only | Fallback covered by the unit tests of Phase 11 |
| Database updates 1 to 16 | No rollback files. The way back is a restore to a point before the update | Everything entered after that point is lost unless re-entered | Restore procedure proven on QA only (W-020); **host backup never restored (E-015)** |
| Starting the books | Stop posting on Finance, Start and stop. Business carries on. Entries already posted stay: they are never deleted | None; events meanwhile are found and posted when posting resumes | Phase 9.5 and 10 scenarios; again in this phase (LC-20) |
| A branch going live | The branch returns to its present way of working. Records it entered stay in the system and are completed or cancelled by the ordinary screens | Orders and stock entered during the pilot must be reconciled by hand with the present system | Not testable here: it is a business procedure |
| A wrong business record | Never by editing the database. A wrong invoice is cancelled or credited; a wrong entry is reversed; a wrong stock figure is corrected with a reason | A trail of the correction | Every one of these has scenarios in Phases 5 to 9.5 |

## Order of decisions when a release goes wrong

1. Is money or stock being recorded wrongly? If yes, stop the affected step for everyone (tell the branches), then go to 3.
2. Is it only one screen or one role? Leave the release in place, work around, fix forward.
3. Promote the previous deployment. Check `/api/health` names the previous commit.
4. If a database update was applied with the release and the previous code cannot run with it: for 17 use its rollback file; for anything else, do not improvise SQL. Decide between fixing forward and a restore.
5. Run Finance, "Check now", and the stock checks, before telling the branches to carry on.
6. Record what happened under the incident procedure.

## What must be true before go-live for this plan to be real

- The owner has promoted a previous deployment once, on purpose, and seen it work (NOT VERIFIED).
- A host backup has been restored into a separate project and the checks in `phase-10-restore-test.md` run against it (E-015, NOT VERIFIED).
- Recovery time and recovery point objectives are approved. Those in `phase-12-disaster-recovery.md` are proposals.
