# Phase 12: release baseline

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

| Item | Value |
|---|---|
| Release candidate | **RC-2** |
| Branch | `claude/project-thread-25z3jd` |
| RC-1 (frozen at the start) | commit `9e12319`, the merge of Phase 11 into main |
| RC-2 | RC-1 plus the changes below; the commit is the head of this pull request (working tree at `9e12319` plus this change when the documents were written) |
| Application version | No version number is kept in the product. `/api/health` names the commit; the release is identified by commit |
| Database version | PostgreSQL 16 locally. Schema: the migrations in `src/backend/prisma/migrations`; SQL Editor files 1 to 18 for the owner. **No database change in this phase** |
| Infrastructure in this certification | One machine: 4 processors, 15.7 GB; database, three server copies behind one address, and the load all on it |
| Deployment environment | Vercel (application) and Supabase (database), as before. **Not touched and not read in this phase.** Host settings are the owner's |
| Integration configuration | Every outside service was a local stand-in with keys that are not real. No real provider was called |
| Outstanding defects | 114 open (2 P0, 17 P1, 53 P2, 41 P3, 1 P4) |
| Outstanding approvals | All of them: see the final report |

## Changes to the candidate during certification

The candidate was frozen at RC-1 and the full gate run on it (`qa/results/phase12-gate-run-1.txt`). Certification then found defects; each was corrected at its cause, and the candidate became RC-2. Every product file changed:

| File | Why | Rerun |
|---|---|---|
| `src/backend/src/lib/assistantInput.js` | AA-003, AA-004 | The whole gate, on RC-2 |
| `src/backend/src/middleware/auth.js` | AA-001 | The whole gate, on RC-2 |
| `src/backend/src/routes/aiAssistant.js` | AA-003, AA-004 | The whole gate, on RC-2 |
| `src/backend/src/routes/dashboard.js` | AA-001 | The whole gate, on RC-2 |
| `src/backend/src/routes/executive.js` | AA-002 | The whole gate, on RC-2 |
| `src/backend/test/assistantInput.test.js` | AA-003, AA-004 | The whole gate, on RC-2 |
| `src/frontend/src/components/help/HelpAccordion.jsx` | AA-006 | The whole gate, on RC-2 |
| `src/frontend/src/help/manualContent.js` | AA-006 | The whole gate, on RC-2 |
| `src/frontend/src/help/manualOperations.js` | AA-006 | The whole gate, on RC-2 |
| `src/frontend/src/pages/Executive/ExecutiveCockpit.jsx` | AA-002 | The whole gate, on RC-2 |

Because the changes touch the sign-in check and the application entry, the affected area is everything: the whole gate was run again on RC-2, not a part of it.

## Results on RC-1 (first gate)

- Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks. The one failure was a timing fault in the test (AA-009); it passed alone on the same build.
- ✓ Phase 11 scenarios: 320 of 320 pass, 1383 checks
- ✗ Phase 11 enterprise cycle gate: jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold yes, books: every verdict yes except response times against the proposed limits (Z-006, known).

## Results on RC-2 (final gate NOT FINISHED)

- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log
- not in the gate log

Proof by removal: 12 of 12 corrections are caught by their check when taken out (`qa/results/phase12-mutations.json`).
