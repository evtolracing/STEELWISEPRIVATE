# Phase 10: regression and test results

Date: 2026-11-18. Every figure here was produced in this session on a local machine, against local PostgreSQL 16 databases whose names contain `qa`, with one server process connected as the least-privilege role `steelwise_runtime`, and a local stub in place of every outside service. Nothing was run against the live database or the host. Anything not run is marked NOT VERIFIED.

## Summary

| Check | Result | Where |
|---|---|---|
| Full run of every gate on a rebuilt database, finished code | Every earlier phase passes; Phase 10 276 of 277 (a wrong expectation in the test, corrected and rerun below) | `qa/results/phase10-gate-run-3.txt` |
| Phase 10 scenarios (250 required, nine minimums) | 277 of 277, 889 checks, in gate order on a rebuilt database | `qa/results/phase10-security.json` |
| Proof by removal | 30 of 30 removals caught by the named test | `qa/results/phase10-mutations.json` |
| Backend unit tests | 245 of 245 (12 Phase 10 security tests) | gate log |
| Isolated restore | Backup 0.3 s, restore 1.8 s, 0 errors; books, guards and numbering identical; the restored application signs in and reconciles clean | `qa/results/phase10-restore.json` |
| Database file 17, run twice on a copy | Second run reports it is already applied; schema identical; rollback run twice, then 17 again, schema identical | `phase-10-database-security.md` |
| Finished code on a database without file 17 | Sign-in answers 503 naming update 17; health 200 (Y-022) | group 8 |

## The full runs

`qa/tools/run-gates.sh` rebuilds the QA database from the migrations, gives the runtime role a QA-only password, starts the servers as that role, then runs every check of every phase in order: three simulations, the sweep, branch boundary, Phases 2 to 8, unit tests, ten earlier browser suites, Phase 9 browser scenarios, every screen opened and measured, Phase 9.5 ledger and browser scenarios, Phase 10, the 80-branch ledger load, the baseline probe, the rule coverage, lint and the build. Every earlier phase therefore ran with the Phase 10 code and with the server unable to change history or the books outside the product.

It was run three times in this phase.

**Run 1** (`qa/results/phase10-gate-run-1.txt`). Every earlier step passed. Phase 10: 239 of 277. Group 5 (7 of 30) and group 7 (13 of 26) failed at their first reconciliation with an inventory difference of -1,580.00 that was there before either group began, and one group 8 and one group 6 scenario failed with them.

Cause, reproduced on a rebuilt database by running only the Phase 9.5 ledger and browser suites and then the first scenario of group 5: Phase 9.5 deliberately leaves eight receipts with no purchase order held by name ("There is no approved rule for what it is owed to"), as the product intends (W-006). Their work orders had posted, their receipts had not, so the books carried less stock than the records. In the separate Phase 10 runs those suites had not run first, so the books started clean. Not a product fault. Fixed in the suite: at start-up the CFO posts each such receipt through the product's own path (`POST /api/ledger/events/:id/retry` naming accounts payable, 2000); an item with no cost stays held by name and is in neither figure; the group 5 start scenario reports what was settled and fails if anything was refused (`qa/sim/phase10/ctx.mjs`, `settleHeldReceipts`).

**Run 2** (`qa/results/phase10-gate-run-2.txt`). Every earlier step passed; Phase 10 275 of 277:

- Group 5 start: one of the eight held receipts answered NOT_POSTED, the engine's answer when there is correctly nothing to post. The books agreed. The scenario now accepts NOT_POSTED and records its reason.
- Group 6 dead letter: no new WEBHOOK_DEAD_LETTER alert, because Phase 4 leaves failed deliveries and the suite's first scheduled run had already raised that alert shortly before (stored 08:32:25); the same alert is stored once in 15 minutes by design (tested in its own scenario). The scenario now accepts the open alert within the quiet window and records whether it was raised fresh.
- The run's list of server errors showed one new 500: `GET /api/ledger/entries/%%%`, sent by a group 9 scenario. That is a product fault (Y-023): an address that does not decode is the caller's error. Fixed; the scenario now requires 400 with the request id.

**Run 3**, on the finished code (`qa/results/phase10-gate-run-3.txt`):

| Step | Result |
|---|---|
| Rebuild from migrations; servers connect as `steelwise_runtime` | Done |
| Simulation, three seeds | Three payments and returns raced at once each taken once; reconciliation 0 problems on each seed |
| Database checks after the simulation and after the scenarios | Every count 0 where 0 is required |
| Sweep (`qa/sim/security.mjs`) | All sections pass: 622 routes refuse with no token; 598 staff routes refuse a customer; 873 reads on bad input with 0 server errors; 0 replies expose internals |
| Branch boundary; Phase 2 integrity | 39 checks, 0 problems; 82 checks, 0 problems |
| Phase 3 to Phase 8 | 74 of 74; 66 of 66; 76 of 76; 106 of 106; 141 of 141; 155 of 155 |
| Backend unit tests | 245 of 245 |
| Ten earlier browser suites | 286 checks, 0 failed |
| Phase 9 browser scenarios | 232 of 232, 1,093 checks |
| Every screen opened and measured at three sizes | Every ceiling held; 0 page errors |
| Phase 9.5 ledger; Phase 9.5 browser | 158 of 158; 13 of 13 |
| Phase 10 | 276 of 277, every category minimum met. The one miss is described below |
| Phase 9.5 load, 80 branches, after Phase 10 | 16 of 16 checks; 1,120 entries from business events in 30.9 s, 2,000 manual entries in 16.1 s |
| Server errors seen by the run | The same list as Phase 9.5's last gate (deliberate outside-service failures and earlier phases' injected faults), plus `GET /api/health` 503 from the deliberate database-down and update-17 scenarios. The `%%%` 500 of run 2 is gone |
| Baseline probe; rule coverage; screen audit | All sections pass; 0 changing routes with no rule; 0 screens with made-up data and no notice |
| Lint; build | 0 errors (1,572 warnings, unchanged ceiling); built |

The one Phase 10 miss: in "The server killed in the middle of twenty dispatches ...", three shipments were dispatched with no invoice; their invoices were raised, and the check "and only once" expected a second request for the same shipment to be refused. The product answers it with the invoice already raised (`invoiceShipment`, "Returns the existing invoice if it was already billed"), and the database held one live invoice per shipment. The expectation was wrong, not the product. In the separate runs this branch had never executed, because the kill came 150 ms after the dispatches were sent and fell before any was saved. Both are corrected: the check now requires the same invoice and one live invoice per shipment, the kill waits for the first dispatch to be saved so it always falls in the middle of the batch (a new check says so), and a shipment billed before the kill is raised again after it. Run three times on the gate database after the run: 12 of 12 checks each time, with one shipment left without an invoice and closed each time.

The Phase 10 suite was then run once more in gate order on a rebuilt database (Phase 9.5 ledger, Phase 9.5 browser, then Phase 10), for the final figures below: 277 of 277, 889 checks, every category at or above its minimum (`qa/results/phase10-gate-order-final.txt`).

## Phase 10 scenarios by category

| Category | Required | Ran | Passed | Checks |
|---|---:|---:|---:|---:|
| Authentication, sessions and roles | 30 | 36 | 36 | 104 |
| Tenant, division and branch isolation | 30 | 31 | 31 | 84 |
| API, database and document security | 30 | 40 | 40 | 71 |
| Ledger security and posting integrity | 40 | 41 | 41 | 104 |
| Inventory-to-ledger and receivables reconciliation | 30 | 30 | 30 | 171 |
| Integrations, events and background jobs | 25 | 26 | 26 | 75 |
| Concurrency and failure recovery | 25 | 26 | 26 | 147 |
| Backup, restore, deployment and rollback | 20 | 26 | 26 | 69 |
| Observability, alerting and infrastructure | 20 | 21 | 21 | 64 |
| **Total** | **250** | **277** | **277** | **889** |

From the run in gate order on a rebuilt database (`qa/results/phase10-gate-order-final.txt`, `qa/results/phase10-security.json`).

Each scenario records its initial state, authorized scope, expected and actual result, security, database and financial outcome, recovery behaviour, audit evidence and regression coverage (`record` in `qa/results/phase10-security.json`). A scenario counts only if it ran and every check in it passed; the per-category minimum is counted from those, never from scenarios that did not run.

## Proof by removal

`qa/tools/phase10-mutations.mjs` takes each fix or guard out of the source (or gives a database grant back), runs the test that names it, and puts the source back.

30 of 30 caught. Kinds: `unit` runs `src/backend/test/securityRules.test.js`; `sim` restarts the QA server on the changed source and runs the named Phase 10 scenario; `sql` gives the runtime role a right back and runs the scenario that must then fail.

| Fix | Kind | What was taken out | Result |
|---|---|---|---|
| Y-001 | unit | a token stops working once its login is cut off | caught |
| Y-001s | sim | changing a password ends the other sign-ins | caught |
| Y-002 | unit | ten wrong passwords pause the login | caught |
| Y-002s | sim | a burst of wrong passwords records one pause | caught |
| Y-003 | sim | an address with no login takes as long to refuse as one with a login | caught |
| Y-004 | unit | an upload cannot name a folder outside the uploads folder | caught |
| Y-005 | unit | a stored file takes the extension of its accepted type | caught |
| Y-006 | unit | a file whose bytes do not match its type is refused | caught |
| Y-007 | unit | only HS256 tokens are accepted | caught |
| Y-008 | sql | the application role cannot rewrite the record of applied updates | caught |
| Y-009 | sql | the application role cannot make tables | caught |
| Y-010 | unit | the same alert is stored once in fifteen minutes | caught |
| Y-010b | unit | a scheduled run that fails raises an alert | caught |
| Y-011 | sql | the application role cannot change or delete history | caught |
| Y-013 | sim | register cannot place a login in another organization | caught |
| Y-013b | sim | register applies the Users rules to the role | caught |
| Y-014 | sim | the public readiness answer is kept for a while | caught |
| Y-015 | sim | guard fields are hidden from colleagues | caught |
| Y-016 | sim | documents obey the branch boundary | caught |
| Y-016b | sim | an upload cannot be attached to another branch's record | caught |
| Y-017 | sim | a revoked key records the signed-in person | caught |
| Y-018 | sim | a token without a user id is refused, not a server error | caught |
| Y-019 | sim | partner administration reads are for administrators | caught |
| Y-020 | unit | money on one invoice takes turns | caught |
| Y-020b | unit | an overlap that survives every retry answers 409, not 500 | caught |
| Y-020s | sim | twenty payments at once on one invoice are all recorded | caught |
| Y-021 | sim | goods shipped long ago with no invoice fail the checks | caught |
| Y-022 | sim | sign-in on a database without update 17 names the update | caught |
| Y-023 | unit | an address that cannot be decoded is the caller's error | caught |
| Y-023s | sim | the server answers an undecodable address 400, not 500 | caught |

27 of these ran earlier in this session on the Phase 10 code; Y-022, Y-023 and Y-023s ran on the finished code. Each run restores the source; a run stopped by hand once left `errorAnswer.js` changed, which was found by the next run ("text not found"), put back, checked against `git diff`, and the two checks run again.

## Not run, and why

| What | Why | Status |
|---|---|---|
| Anything on the live database or host | Forbidden by the phase rules | NOT VERIFIED |
| The host's own backups restored | The owner's account; procedure written | NOT VERIFIED (E-015) |
| A Vercel promote or rollback | The owner's account | NOT VERIFIED |
| Alerts to a real channel | No channel is set; simulated emergencies to production channels are forbidden without approval | NOT VERIFIED (E-017) |
| Several server processes | Phase 11 | NOT VERIFIED (W-022) |
| Real partners, carriers, accounting products, AI service | Stubs only | NOT VERIFIED |
