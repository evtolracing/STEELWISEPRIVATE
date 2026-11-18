# Phase 11: regression and test results

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## Summary

| Check | Result | Where |
|---|---:|---|
| Five enterprise cycles | 1: 545/545 jobs, 5,185 transactions; 2: 545/545 jobs, 5,187 transactions; 3: 545/545 jobs, 5,185 transactions; 4: 545/545 jobs, 5,185 transactions; 5: 545/545 jobs, 5,191 transactions | `qa/results/phase11-cycle-*.json` |
| Phase 11 scenarios (300 required, eight minimums) | 320 of 320 pass, 1,383 checks, on 3 server copies | the final run on a rebuilt database (`qa/results/phase11-scenarios.json`) |
| Proof by removal | 13 of 13 removals caught by the named check | `qa/results/phase11-mutations.json` |
| Backend unit tests | 268 of 268 (23 Phase 11 tests in `enterpriseScale.test.js` and others) | `src/backend/test/` |
| Full gate of every earlier phase on the Phase 11 code | Every earlier phase passes on the Phase 11 code on a rebuilt database (Phases 2 to 9.5 in full, unit tests 268 of 268, lint 0 errors, build). Phase 10 passed 276 of 277 once its restore server was started, and the one miss passes alone. Phase 11 in gate order passed 320 of 320 on its third run, after eight checks that made wrong assumptions about what earlier phases leave behind were corrected in the tests | `qa/results/phase11-gate-run-1.txt` |
| Database update 18, run twice on a copy | second run reports it is already applied; schema identical; rollback run twice, then 18 again, schema identical; the verify script reports every row APPLIED or OK | `/mnt/project-files/database-updates/` |

## Scenarios by category

| Category | Required | Ran | Passed | Checks |
|---|---:|---:|---:|---:|
| Sales, inventory and purchasing concurrency | 45 | 48 | 48 | 154 |
| Manufacturing, scheduling and quality | 40 | 40 | 40 | 128 |
| Shipping, logistics and invoicing | 35 | 35 | 35 | 120 |
| Ledger posting and reconciliation | 60 | 63 | 63 | 379 |
| Tenant, branch, RBAC and AI security | 35 | 41 | 41 | 174 |
| Integrations, events and background jobs | 35 | 39 | 39 | 166 |
| Failure injection and recovery | 35 | 36 | 36 | 158 |
| Reporting, frontend and deployment | 15 | 18 | 18 | 104 |
| **Total** | 300 | 320 | 320 | 1383 |

Each scenario records its initial conditions, expected result, actual result, business state, database state, financial state, security result, recovery result, audit evidence and regression result (`record` in the result file). A scenario counts only if it ran and every check in it passed.

The scenarios were run in full twice on rebuilt databases: cycle 3 (320 of 320) and cycle 5 (320 of 320).

## Proof by removal

`qa/tools/phase11-mutations.mjs` takes each fix out of the source, runs the check that names it, and puts the source back.

| Fix | Kind | What was taken out | Result |
|---|---|---|---|
| E-014 | unit | the sign-in limit per address is counted in the shared table | caught |
| Z-001 | unit | an invoice number comes from the counter, not from a read of every invoice | caught |
| Z-002 | unit | a numbered document waits for its turn in the database first | caught |
| Z-003 | unit | a document number is handed out by the counter | caught |
| Z-004 | unit | password checks take turns | caught |
| Z-005 | unit | an overlap that survives every retry answers 409, not 500 | caught |
| Z-007 | unit | a partner limit is counted in the shared table | caught |
| Z-007s | sim | a partner cannot multiply its limit by the number of server copies | caught |
| Z-008 | sim | a politely stopped copy closes idle connections and leaves quickly | caught |
| Z-009 | unit | a 500 for want of a database connection is answered 503 with a time to retry | caught |
| Z-009s | sim | with the database connections used up a change is told to try again, never 500 | caught |
| Z-011 | unit | a transaction that lost its connection is answered 503, not 500 | caught |
| Z-013 | unit | a keyed request is not run when its key cannot be claimed | caught |

## The full gate

- Rebuild from migrations; servers connect as `steelwise_runtime`.
- Simulation on three seeds, the sweep, branch boundary (39 checks) and Phase 2 integrity (82 checks): 0 problems.
- Phase 3 to Phase 8: 74 of 74; 66 of 66; 76 of 76; 106 of 106; 141 of 141; 155 of 155.
- Backend unit tests: 268 of 268.
- Ten earlier browser suites: 0 failed. Phase 9 browser scenarios: 232 of 232. Every screen opened and measured: every ceiling held.
- Phase 9.5 ledger 158 of 158; Phase 9.5 browser 13 of 13; Phase 9.5 load on 80 branches 16 of 16 (1,120 entries from business events in 21.1 s, 2,000 manual entries in 12.9 s).
- Phase 10 in the gate: 257 of 277. Cause: the 26 scenarios of its backup and restore group need a second PostgreSQL server on port 5433, which was not running on this machine after a restart. Not a product fault. With that server started the group passed 26 of 26 and the whole suite 276 of 277. The one miss ("Stock changed outside the product...") expected a fresh alert inside the product's 15-minute quiet window for the same alert; run alone it passes 1 of 1.
- Phase 11 enterprise day in the gate, after every earlier phase's data: 545 of 545 jobs traced, books balance and reconcile (`qa/results/phase11-gate-enterprise.json`).
- Phase 11 scenarios in the gate: 312 of 320 on the first run. All eight misses were assumptions in the tests: two ledger events held by name by earlier phases were counted as new, a stock-value check added goods in transit twice, and one request through the test's own front door met a reused connection that a restarted copy had closed (502 from the front door, not from the product). Corrected in the tests. Second run 319 of 320 (a partner request-limit window from the first run was counted); corrected. Third run 320 of 320, 1,384 checks (`qa/results/phase11-gate-scenarios.json`).
- After the front door stopped reusing connections, the check for the polite stop (Z-008) no longer depended on the fix. The scenario now holds its own kept-alive connections to the copy being stopped, with reads in flight; with the fix removed it fails again (13 of 13 removals caught).
- Server errors seen by the run: the same list as Phase 10's gate (deliberate outside-service failures and injected faults). No new 500.
- Baseline probe, rule coverage and screen audit pass; lint 0 errors (1,572 warnings, unchanged ceiling); build ok.
- Response times are not part of the gate. The final cycle's times are in `phase-11-performance-baseline.md`.

## Corrections made to tests, not to the product

- The load driver asked for an executive dashboard address that does not exist (40 answers of 404 in cycle 1). Corrected in the driver.
- The failure group's export scenario relied on the ledger group having mapped the export accounts first. It now maps them itself.
- The load driver did not follow the product's recovery for a dispatch whose answer was lost. It now does, and counts each as a recovery.
- A helper that restarted a politely stopped copy did not wait for it to exit first.

## Not run, and why

| What | Why | Status |
|---|---|---|
| Anything on the live database or host | Forbidden by the phase rules | NOT VERIFIED |
| Server copies on separate machines | One machine was available | NOT VERIFIED |
| A year of data | One day was modelled | NOT VERIFIED (W-023) |
| Real partners, carriers, payments, tax, accounting products, AI service | Stand-ins only; real calls are forbidden | NOT VERIFIED |
| Physical machines | No hardware testing was authorized | NOT VERIFIED |
| Many browsers at once | One browser; load came from the driver | NOT VERIFIED |
