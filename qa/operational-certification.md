# Operational certification report

Date: 2026-11-13. Scope: the STEELWISE codebase at the commit of this pull request, tested on a local QA database. Production was not touched and nothing was deployed.

## Decision: NOT YET CERTIFIED

The core path (sales order, stock reservation, shop job, shipment, delivery, stock and order books) now passes three 50-job cycles in a row with no failures and reconciles to zero discrepancies. That part is verified within the tested scope.

The system as a whole cannot be certified, for four reasons:

1. **Money workflows do not exist.** There is no way to invoice, take a payment, issue a credit or process a return (D-015, D-016). Three of the 150 final jobs are blocked for this reason.
2. **Counter quick sale is a prototype** that cannot complete a sale and simulates card payments (D-014).
3. **Online checkout still takes the price sent by the browser** (D-017; low prices are now flagged for the CSR, not rejected), and the API does not limit staff by department (D-018).
4. **The fixes are not live.** They are in a pull request, tested locally only. The hosted site still has every defect in the "Fixed" list.

## What was done

| Phase | Result |
|---|---|
| Inventory | 581 server routes, 129 screens, 155 tables, 96 enums catalogued from the code (`system-inventory.md`) |
| History | 117 commits reviewed. None contained a test. No ticket files exist in the repository (`ticket-traceability.md`) |
| Workflow map | `workflow-coverage-matrix.md` |
| Test environment | Local database `steelwise_qa`: 80 branches, 280 work centers, 323 stock items, 16 customers, 6 logins across roles |
| Simulation engine | `qa/sim/run.mjs`: 50 jobs per cycle in the requested mix, replayable by seed, with database checks after each job, five simultaneous-request probes and a whole-database reconciliation |
| Baseline | 3 of 50 jobs passed, 46 failed, 1 blocked |
| Repair | 18 defects fixed at the root cause (`defect-register.md`) |
| Regression tests | 32 unit tests (`npm test` in `src/backend`), none existed before |
| Final cycles | Seeds 4001, 4002, 4003 on a freshly rebuilt QA database, rerun after the follow-up fixes: 150 jobs, 147 passed, 0 failed, 3 blocked (returns, D-015). 1,771 API steps, 1,478 checks. All 15 simultaneous-request probes passed. Reconciliation: 0 problems in 323 stock items and every order created during QA. The earlier certification cycles (seeds 3001 to 3003) are kept as `qa/results/r6-*.json` |
| Security sweep | 542 routes refuse a request with no sign-in. 519 staff routes refuse a customer login. Forged tokens refused. Customers cannot read each other's records. No error reply exposes database detail. One section has findings: 7 read requests answered with a server error (D-019 quotes/RFQs/sales stats, and the quick-sale receipt in D-014); this was 29 before the D-021 fix |
| Screens | All 120 openable screens load in a browser with no crash after 3 fixes. Buttons and forms inside the screens were not exercised |
| Build | Frontend production build succeeds |

Full numbers, generated from the recorded runs, are in `test-execution-results.md`.

## What was not tested

- Anything on the hosted site or the production database.
- Email, SMS, card payments, carriers, EDI, map services, AI features: no outside service was called.
- Load beyond 10 simultaneous requests. No stress or soak test was run.
- Clicking through forms and buttons on screens. The screen check opens each page only.
- Scheduling, QC, maintenance, drop tags, BOM, analytics and partner flows beyond "the route answers and refuses the wrong caller".
- The database on MySQL. All runs were on PostgreSQL.
- File upload on the hosted site, which has no file store yet (D-011b).

## Open defects by severity

- P1: D-014 quick sale, D-015 returns, D-016 invoicing and payments, D-017 checkout price (flagged, not enforced), D-011b file storage on the hosted site
- P2: D-018 staff permissions on the API, D-019 quotes and RFQs, D-020 screen calls with no server route (152 of 332), D-024 two stock systems and five mock services, D-028 division visibility, D-032 jobs not tied to shipments
- P3: D-023 demo seed data, D-027 rate limit per instance

## Decisions needed

Listed in `defect-register.md`: the ten rules this change introduces (to confirm), and D-014 to D-019 and D-028 (to decide).

## To reach certification

1. Review and merge this pull request, apply the one database update, deploy, and rerun the three cycles against a staging copy.
2. Decide and build invoicing, payments and returns, then extend the simulation to cover them.
3. Price web orders on the server.
4. Set the staff permission table and enforce it on the API.
5. Decide the fate of quick sale, quotes and RFQs: finish or remove.
6. Run the unit tests and one simulation cycle automatically on every pull request.

## Continuation checkpoint

Everything needed to resume is in `qa/README.md`. The QA database is local to the session that produced this report and will need rebuilding with the commands there. Results files in `qa/results/` are the record of what ran. No work continues after this session ends.
