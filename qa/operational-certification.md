# Operational certification report

Date: 2026-11-13. Scope: the STEELWISE codebase at the commit of this pull request, tested on a local QA database. Production was not touched and nothing was deployed.

## Decision: NOT YET CERTIFIED

Every defect that was waiting on a business decision has been repaired using a recommended rule (rules 11 to 21 in `defect-register.md`). The whole path from quote to order, stock, shop job, shipment, invoice, payment, return and credit passes three 50-job cycles in a row with no failures, no blocked jobs, and reconciles to zero discrepancies, on the local QA database.

It is not certified yet, for three reasons:

1. **This work is not live.** It is in a pull request and was tested on a local database only. It needs two database updates applied and a deploy, then a rerun against a staging copy.
2. **Outside services are not connected.** No card is charged and no email or text is sent by the app (D-033, D-034). Sales tax rates must be entered for each branch state (D-035); the QA data has four.
3. **Screens were opened, not operated.** Every screen loads without a crash, but forms and buttons were exercised through the API, not by clicking. Some secondary screens still call routes that do not exist or show sample data (D-020, D-024, D-036).

## What was done

| Phase | Result |
|---|---|
| Inventory | 574 server routes, 132 screens, 157 tables, 96 enums catalogued from the code (`system-inventory.md`) |
| History | 117 commits reviewed. None contained a test. No ticket files exist in the repository (`ticket-traceability.md`) |
| Workflow map | `workflow-coverage-matrix.md` |
| Test environment | Local database `steelwise_qa`: 80 branches, 280 work centers, 323 stock items, 16 customers, 7 logins across roles |
| Simulation engine | `qa/sim/run.mjs`: 50 jobs per cycle, replayable by seed, with database checks after each job, eight simultaneous-request probes and a whole-database reconciliation of stock, orders, invoices, payments, credits and returns |
| Baseline | 3 of 50 jobs passed, 46 failed, 1 blocked |
| Repair | 30 defects fixed at the root cause (`defect-register.md`) |
| Regression tests | 45 unit tests (`npm test` in `src/backend`), run automatically on every pull request. None existed before |
| Final cycles | Seeds 7001, 7002, 7003 on a freshly rebuilt QA database: 150 jobs, 150 passed, 0 failed, 0 blocked. 2,120 API steps, 2,316 checks. All 24 simultaneous-request probes passed. Reconciliation: 0 problems. Earlier cycles are kept as `qa/results/r6-*.json` and `r7-*.json` |
| Security sweep | All 11 sections pass. 535 routes refuse a request with no sign-in. 512 staff routes refuse a customer login. Forged tokens refused. Customers and divisions cannot read each other's records. Staff are held to their department. 750 read requests with bad input caused 0 server errors. Web checkout saves the system price. No error reply exposes database detail |
| Screens | All 123 openable screens load in a browser with no crash. Buttons and forms inside the screens were not clicked |
| Build | Frontend production build succeeds |

Full numbers, generated from the recorded runs, are in `test-execution-results.md`.

## What was not tested

- Anything on the hosted site or the production database.
- Email, SMS, card payments, carriers, EDI, map services, AI features: no outside service was called.
- Load beyond 10 simultaneous requests. No stress or soak test was run.
- Clicking through forms and buttons on screens. The screen check opens each page only.
- Scheduling, QC, maintenance, drop tags, BOM, analytics and partner flows beyond "the route answers and refuses the wrong caller".
- The database on MySQL. All runs were on PostgreSQL.
- File upload on the hosted site. Storing files in the database was run locally in hosted mode only.

## Open defects by severity

- P1: none
- P2: D-020 screen calls with no server route, D-024 two stock systems and five mock services, D-033 cards are not charged by the app, D-034 email and text not connected, D-036 Sales Dashboard and Order Hub RFQ pages show sample data
- P3: D-023 demo seed data, D-027 rate limit per instance, D-035 sales tax rates to be entered per state

## Decisions needed

Rules 1 to 21 in `defect-register.md` are enforced now and should be confirmed. D-033 to D-035 need a provider or data from the business.

## To reach certification

1. Merge the pull request, apply the two database updates (`20261113031734_document_links_any_record.sql`, then `20261113052550_billing_returns_file_store.sql`), deploy, and rerun the three cycles against a staging copy.
2. Enter the tax rate for every state with a branch (Admin > Sales Tax Rates) and give each counter login its home branch.
3. Choose the card processor and the email and text provider, or confirm the app should stay without them.
4. Click through the main screens by hand on staging: quick sale, invoices, returns, RFQs and quotes.
5. Repair or remove the screens in D-020, D-024 and D-036.

## Continuation checkpoint

Everything needed to resume is in `qa/README.md`. The QA database is local to the session that produced this report and will need rebuilding with the commands there. Results files in `qa/results/` are the record of what ran. No work continues after this session ends.
