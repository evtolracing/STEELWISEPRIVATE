# Phase 9.5: regression and test results

Date: 2026-11-16. Every figure here was produced in this session on a local machine, against a local PostgreSQL database named `steelwise_qa`, with one server process. Nothing was run against the live database or the host. Anything not run is marked NOT VERIFIED.

## Summary

| Check | Result | Where |
|---|---|---|
| Full run of every gate on a rebuilt database, finished code | Every step passes, 0 failures | `qa/results/phase95-gate-run-2.txt` |
| Ledger scenarios (150 required) | 158 of 158, 915 checks | `qa/results/phase95-ledger.json` |
| Finance screen in a browser | 13 of 13, 69 checks | `qa/results/phase95-ui.json` |
| Load at 80 branches | 16 of 16 checks; 4,980 requests, 0 failed, 0 deadlocks | `qa/results/phase95-load.json` |
| Proof by removal | 26 of 26 removals caught | `qa/results/phase95-mutations.json` |
| Backend unit tests | 233 of 233 | gate log |
| Database file 16, run twice on a copy | Second run changed nothing; schema identical | below |
| New code on a database without file 16 | Phase 8 scenarios 155 of 155; Finance answers 503 with a plain message | below |

## The full run

`qa/tools/run-gates.sh` rebuilds the QA database from the migrations, then runs every check of every phase in order. The ledger is not started until the Phase 9.5 scenarios begin, so Phases 2 to 9 run with the new code and the ledger off, which is how the code would arrive on the live system.

It was run twice in this phase.

**First run** (`qa/results/phase95-gate-run-1.txt`). Everything passed except:

- Phase 8: 153 of 155. Two scenarios asserted that no ledger table exists. They had recorded the gap N-025, which this phase fills, so they failed for a reason that is not a fault in the product. Both were rewritten to state what must hold now (W-027): with the ledger not started an invoice writes no ledger event, no outside system is called, and a dispatch adds no debit to inventory.
- Phase 9 browser scenarios: 231 of 232. Scenario 102 read the RFQ dialog before its number had loaded. It passed alone three times of three, and the whole suite was then run again: 232 of 232, 1,093 checks. The scenario now waits for the number.

After that run, the server code changed in one place only: the Finance addresses answer 503 with a plain message when the ledger tables are missing (W-026).

**Second run**, on the finished code (`qa/results/phase95-gate-run-2.txt`):

| Step | Result |
|---|---|
| Rebuild from migrations | Done |
| Simulation, three seeds | Payments and returns raced three at a time are each taken once; reconciliation 0 problems on each seed |
| Database checks after the simulation and after the scenarios | Every count identical to the first run |
| Sweep (`qa/sim/security.mjs`) | All sections pass: 621 routes refuse with no token; 598 staff routes refuse a customer; 873 reads on bad input with 0 server errors |
| Branch boundary | 39 checks, 0 problems |
| Phase 2 integrity | 82 checks, 0 problems |
| Phase 3 database scenarios | 74 of 74, 612 checks |
| Phase 4 integration scenarios | 66 of 66, 555 checks |
| Phase 5 sales scenarios | 76 of 76, 387 checks |
| Phase 6 inventory scenarios | 106 of 106, 494 checks |
| Phase 7 manufacturing scenarios | 141 of 141, 618 checks |
| Phase 8 fulfilment scenarios | 155 of 155, 518 checks |
| Backend unit tests | 233 of 233 |
| Ten earlier browser suites | 286 checks, 0 failed |
| Phase 9 browser scenarios | 232 of 232, 1,093 checks |
| Every screen opens | No call to a missing route except the eight made-up record ids |
| Every screen measured at three sizes | 155 screens, 0 counts over a ceiling |
| Phase 9.5 ledger scenarios | 158 of 158, 915 checks |
| Phase 9.5 Finance screen | 13 of 13, 69 checks |
| Phase 9.5 load, 80 branches | 16 of 16 checks |
| Baseline probe | All sections pass: 624 write calls as read-only roles, 0 not refused; 317 write routes sent an empty body, 0 server errors |
| Department rule coverage | 362 changing routes, 0 with no rule |
| Screen audit | 0 screens show made-up data with no notice |
| Lint | 0 errors (1,572 warnings, unchanged in kind from earlier phases) |
| Build | Made |
| Documents | 661 endpoints, 171 models, 51 modules; no route file or screen unclaimed |

Server errors recorded during the run: the same list as the Phase 9 run and the first run of this phase, and none from the ledger. Each is produced on purpose by a scenario: the assistant and speech stand-ins failing (502, 503, 504), four planted failures (one each on transfer, transfer receipt, invoice and quote acceptance), and the "not built" answers of the supplier partner addresses and the emailed receipt (501).

## Ledger scenarios

`qa/sim/phase95-ledger.mjs`. Each scenario drives the real server as a signed-in user and reads the journal back from the database.

| Group | Scenarios |
|---|---:|
| Periods, cutover and reporting | 24 of 24 |
| Sales, invoices and revenue | 25 of 25 |
| Payments, credits and refunds | 21 of 21 |
| Inventory valuation and adjustments | 27 of 27 |
| Manufacturing, work in progress and costing | 20 of 20 |
| Freight, transfers and location accounting | 21 of 21 |
| Concurrency, authorization and failure recovery | 20 of 20 |
| **All** | **158 of 158, 915 checks** |

The last scenario runs the reconciliation over everything the others left behind.

## Proof that the tests can fail

`qa/tools/phase95-mutations.mjs` removes one rule or guard from the source, runs the named test, checks that it fails, and restores the source. 26 of 26 removals were caught: 14 posting-rule checks, and 12 guards (database triggers, no-fallback, two-person posting, branch scope, activation refusal and others). Two removals were at first not caught because the tool looked for the wrong failure text (E1, E4); the tool was corrected, not the product. Result file: `qa/results/phase95-mutations.json`.

This run was made before the last two small changes (W-026, W-027), neither of which touches a rule or guard it covers. It was not repeated after them.

## Load: 80 branches

`qa/sim/phase95-load.mjs`. Machine: one container, 4 processors, one server process and one PostgreSQL on the same machine. **Not the production host.** These are measurements of this machine, not predictions of the live one.

- Stage 1: 80 branches each receive two purchase-order receipts, ship and invoice 3 sales, take 3 payments, send and receive one transfer and make one stock adjustment, with 16 branches working at the same moment and a reader pulling reports throughout.
- Stage 2: 2,000 two-line manual entries, each saved by one finance user and posted by another, 16 at once.
- Stage 3: each report five times, and the reconciliation twice.

Figures below are from the run recorded in `qa/results/phase95-load.json` (the second full run; the first full run gave the same picture: 43.2 and 148.2 entries a second, 0 failed).

| Measure | Result |
|---|---|
| Stage 1 | 1,120 entries (2,240 lines) from business events in 24.8 seconds: 45.1 entries a second |
| Stage 2 | 2,000 entries in 14.1 seconds: 141.9 a second |
| Requests sent | 4,980; 0 failed; error rate 0 |
| Deadlocks | 0 |
| Lock waits | 165 samples taken; a session was waiting in 23 of them; 3 waiting at once at most |
| Transactions rolled back by the database and retried | 1,006 (986 in stage 1, 20 in stage 2). Counted by the database. No request failed, so none of them reached a user |
| Journal at the end | 3,129 entries, 6,482 lines, 1,123 events |
| Duplicate entries for one business record | 0 |
| Reconciliation after the load | No difference; 65 ms a run |

Latency in milliseconds:

| Request | Count | Median | 95 in 100 | 99 in 100 | Slowest |
|---|---:|---:|---:|---:|---:|
| trial balance while posting | 24 | 15.3 | 35.9 | 53.7 | 53.7 |
| revenue by branch while posting | 24 | 14.6 | 44.8 | 57 | 57 |
| receipt | 160 | 99.7 | 150.8 | 189.5 | 197.8 |
| dispatch (invoice and cost of sale) | 240 | 1040.3 | 1679.1 | 1835.3 | 1917.5 |
| payment | 240 | 57.3 | 96.3 | 260.9 | 297.8 |
| transfer sent | 80 | 113.4 | 217.9 | 234.8 | 234.8 |
| transfer received | 80 | 83.7 | 122.7 | 144.1 | 144.1 |
| stock count | 80 | 68.1 | 104.6 | 135.4 | 135.4 |
| manual entry saved | 2000 | 59.9 | 81.8 | 91 | 102.2 |
| manual entry posted | 2000 | 49.8 | 70.6 | 80.1 | 93 |
| report: trial balance | 5 | 9.7 | 12.4 | 12.4 | 12.4 |
| report: revenue by branch | 5 | 7.8 | 10.4 | 10.4 | 10.4 |
| report: revenue by customer | 5 | 6.6 | 6.9 | 6.9 | 6.9 |
| report: gross margin by branch | 5 | 10.1 | 11.9 | 11.9 | 11.9 |
| report: receivables | 5 | 9.4 | 11 | 11 | 11 |
| report: sales tax | 5 | 5.3 | 5.5 | 5.5 | 5.5 |
| report: inventory value | 5 | 21.4 | 24.5 | 24.5 | 24.5 |
| report: monthly activity | 5 | 22.8 | 25.3 | 25.3 | 25.3 |
| report: journal, first page | 5 | 10.1 | 10.9 | 10.9 | 10.9 |
| report: one account, activity | 5 | 15 | 17.4 | 17.4 | 17.4 |
| reconciliation | 2 | 65.1 | 65.2 | 65.2 | 65.2 |

Sixteen assertions decide pass or fail: every expected entry exists once, every entry balances, the trial balance balances, the reconciliation finds no difference, no request failed, no deadlock, and every invoice was raised.

### What the load run found (W-021)

| Run | Invoices raised of 240 | Dispatch median | Dispatch 95 in 100 | File |
|---|---:|---:|---:|---|
| Ledger on, before the fix | 230 | 689 ms | 5,672 ms | `phase95-load-before-fix.json` |
| Ledger stopped, before the fix | 240 | 265 ms | 1,953 ms | `phase95-load-ledger-stopped.json` |
| Ledger on, after the fix | 240 | 1,040 ms | 1,679 ms | `phase95-load.json` |

Every invoice advances one counter row so that invoice numbers have no gaps. Under 16 simultaneous dispatches the saves collided on that row and were retried; ten used up all 25 attempts. The fix makes invoices of one series take turns inside the server process. The median went up, because saves now queue instead of colliding and retrying, and the worst case came down by more than two thirds; no invoice is lost.

What the ledger costs, from the same three files: a payment took 30 ms at the median with the ledger stopped and 57 ms with it on; a receipt 58 ms and 100 ms.

Not shown by this run: several server processes (W-022), a year's volume (W-023), the live host.

## Database file 16

- Made with `npm run db:sql-editor -- 20261117090000_financial_ledger` in `src/backend`.
- Run twice on a copy of the QA database taken before the migration. The first run created ten tables and their triggers. The second run changed nothing and said so.
- `prisma migrate diff` between the copy and the schema: no difference.
- Row level security is on for every public table (172 of 172). With the roles `anon` and `authenticated` created on the copy, `anon` read 0 of 22 accounts and an update as `authenticated` changed 0 rows.
- `verify-6-to-16.sql` on the copy: every row APPLIED or OK.
- The copy and the two roles were dropped afterwards.

The file adds tables and changes no existing table. It has not been applied to the live database: the owner does that.

## New code on a database without file 16

The code may be deployed before the owner applies the file (R-68). Tried on the finished code, on a copy of the QA database with the ten ledger tables, the ledger settings and the migration record removed:

- Phase 8 fulfilment scenarios: 155 of 155, 518 checks. Every business save reads one settings row, finds no ledger and goes no further.
- `/api/ledger/status`, `/api/ledger/chart` and `/api/ledger/reports/trial-balance` each answered 503: "The ledger's tables are not in this database yet. Database update 16 (financial ledger) has to be applied first. Nothing else in the system is affected."
- `/api/health` and `/api/invoices` answered 200.

The copy was dropped afterwards.

## Not verified

- Anything on the live database, a copy of it, or the host.
- Import of the export file into QuickBooks, Xero or any other product.
- More than one server process; more than about 3,000 journal entries.
- Backup and restore with the ledger tables.
- Any browser engine other than Chromium; any real finance user.
- The accountant's agreement with any figure. The tests prove the software does what its documents say, not that the documents are the right accounting.
