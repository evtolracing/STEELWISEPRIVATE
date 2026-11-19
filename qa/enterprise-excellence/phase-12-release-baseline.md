# Phase 12: release baseline

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

| Item | Value |
|---|---|
| Release candidate | **RC-2** |
| Branch | `claude/project-thread-25z3jd` |
| RC-1 (frozen at the start) | commit `9e12319`, the merge of Phase 11 into main |
| RC-2 | RC-1 plus the changes below; the commit is the head of this pull request (working tree at `d5062a3` plus this change when the documents were written) |
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
| `src/backend/src/app.js` | AA-005 | The whole gate, on RC-2 |
| `src/backend/src/lib/assistantInput.js` | AA-003, AA-004 | The whole gate, on RC-2 |
| `src/backend/src/middleware/auth.js` | AA-001 | The whole gate, on RC-2 |
| `src/backend/src/routes/aiAssistant.js` | AA-003, AA-004 | The whole gate, on RC-2 |
| `src/backend/src/routes/customers.js` | see the commit | The whole gate, on RC-2 |
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

## Results on RC-2 (final gate)

- Phase 2 integrity: 82 checks, 0 problems
- Phase 3 database scenarios: 74 of 74 pass, 612 checks
- Phase 4 integration scenarios: 66 of 66 pass, 555 checks
- Phase 5 sales scenarios: 76 of 76 pass, 387 checks
- Phase 6 inventory scenarios: 106 of 106 pass, 494 checks
- Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks
- Phase 8 fulfilment scenarios: 155 of 155 pass, 518 checks
- Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks
- Phase 9.5 ledger: 158 of 158 pass, 915 checks
- Phase 9.5 UI: 13 of 13 pass, 69 checks
- Phase 10 security: 277 of 277 pass, 889 checks
- Phase 9.5 load: 16 of 16 checks pass
- Phase 11 enterprise cycle gate: jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold yes, booksAgree yes, nothingCountedIsMissing yes, noServerError yes, noDeadlock yes, failedT
- Phase 11 scenarios: 319 of 320 pass, 1383 checks
- Phase 12 certification: 68 of 68 pass, 601 checks
- Phase 12 UI: 5 of 5 pass, 18 checks
- # tests 276
- # pass 276
- # fail 0
- reconciliation ✓ 323 stock items, 59 orders, 0 problems (plus 52 in demo seed data)
- LINT-OK
- built in 16.21s

## What failed in the final gate, and the reruns

- 113 STOCK a stock item opens from its row with the keyboard and shows what is on file  — the heading is the item number:
- slower than the proposed limit: counter sale paid p95 940.5 (limit 800), p99 1659.1 (limit 1500)
- slower than the proposed limit: shipment dispatched p95 4870.3 (limit 2000), p99 6798.1 (limit 4000)
- Phase 11 enterprise cycle gate: jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold yes, booksAgree yes, nothingCountedIsMissing yes, noServerError yes, noDeadlock yes, failedTransactionsWithinLimit yes, responseTimesWithinProposedLimit
- [Failure injection and recovery] Every database connection of the servers is cut while thirty requests are in flight
- Phase 11 scenarios: 319 of 320 pass, 1383 checks; Sales, inventory and purchasing concurrency 48/48; Manufacturing, scheduling and quality 40/40; Shipping, logistics and invoicing 35/35; Ledger posting and reconciliation 63/63; Tenant, branch, RBAC and AI secu

The response-time lines are Z-006 and the proposed limits, which nobody has approved (`phase-12-performance-certification.md`). The other two are one scenario each in the Phase 9 browser suite and the Phase 11 failure suite. Both were timing in the test on a busy machine, not the product (AA-012): a heading read before it was drawn, and a reconciliation asked of a server copy still reconnecting after its database connections were cut on purpose, which answered "try again" as designed. The checks now wait for the heading and try again for up to ten seconds. No product file changed, and the two whole suites were run again on the same build and database (`qa/results/phase12-gate-reruns.txt`):

- ✗ 210 FAIL  /customers: when the server fails, the screen says so in words, invents no records, and loads again once the server is back  — with the server back the records appear: Customers Manage customer organizations,
- Phase 9 UI scenarios: 231 of 232 passed, 1 failed, 0 not applicable, 1093 checks
- ✓ Phase 11 scenarios: 320 of 320 pass, 1384 checks
- Phase 9 UI scenarios: 1 of 1 passed, 0 failed, 0 not applicable, 5 checks
- ✗ 211 FAIL  /units: when the server fails, the screen says so in words, invents no records, and loads again once the server is back  — with the server back the records appear: Inventory Every tracked stock item, with its
- Phase 9 UI scenarios: 6 of 7 passed, 1 failed, 0 not applicable, 35 checks

Read the Phase 9 rerun with care: scenario 113 passed in it, and a different one (210, the customers list) failed. That failure comes from running the suite out of its gate position: after the gate the database also holds the customers and stock Phase 11 adds later, and scenarios 210 and 211 look for the suite's own records on the first page of a list. They fail every time on that database and passed in the gate. So every one of the 232 browser scenarios passed in the final gate or, for 113, in the rerun, **but the Phase 9 suite did not pass whole in a single run on the final code.** That is reported as it is.

The gate was not run a further time from the start for changes to three test files. The gate log is kept as it ended, with its two failures.

Proof by removal: 13 of 13 corrections are caught by their check when taken out (`qa/results/phase12-mutations.json`).
