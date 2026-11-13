# Quality improvement register (Phase 2)

Risk: **Critical** security, data integrity, money or an essential workflow. **High** significant reliability, operational or performance weakness. **Medium** substandard implementation or inefficient workflow. **Low** minor.

Evidence files are in `qa/results/`. "Bench" is `qa/perf/bench.mjs` on the scaled database.

## Workstream 1: architecture and infrastructure

| ID | Module | Category | What it did | Standard expected | Evidence | Impact | Risk | Status | Proof of fix |
|---|---|---|---|---|---|---|---|---|---|
| E-001 | Jobs | Performance | `GET /api/jobs` returned every job with no limit | Lists are bounded | Bench before: 104 MB, 9.6 s median; 20 simultaneous requests all failed after 30 s | Job board and every screen that lists jobs stops working as history grows | High | Fixed | Bench after: 1.2 MB, 121 ms; 20 simultaneous in 1.4 s, 0 failed. `routes/jobs.js` |
| E-002 | Jobs | Consistency | When a second database client was configured, the job list used it instead: 100 rows, no filters, no order or work-center detail | One code path per route | Code read, `routes/jobs.js` before this change | A filter such as "jobs for this order" could silently return unrelated jobs | High | Fixed | Path removed. Sim rework jobs and UI check pass |
| E-003 | Database | Performance | 87 of 170 foreign keys had no index | Every foreign key is indexed | Catalog query on the test database | Lookups by parent (lines of an order, jobs of an order, movements of a stock item) scan the whole table | High | Fixed | Migration `20261113062621`. Order detail 20 ms to 9 ms; jobs for an order 12 ms to 6 ms |
| E-004 | Database | Data integrity | No check constraints anywhere | Impossible values are refused by the database, not only by the code | Catalog query: 0 | A bug or a manual edit could leave negative stock | High | Fixed in part | Eight checks added, each only if existing rows already pass. Three cycles pass with them on. The stock balance identity is still code-only (E-020) |
| E-005 | Staging | Performance | Staging list returned every ready or shipped job | Bounded | Bench before: 18 MB, 6.0 s | Staging screen slows with history | Medium | Fixed | Bench after: 0.3 MB, 100 ms |
| E-006 | Analytics | Correctness, performance | RFQ funnel and margin loaded all orders into memory. Margin returned invented figures | Reports show measured figures or say "not available" | Code read; Bench before: 7.7 s and 2.5 s | Managers see numbers that are not real | High | Fixed | Counted in the database, 23 ms each. Margin shows "not available" on the dashboard |
| E-007 | Shipping summary | Correctness | Counted shipment statuses that do not exist, so "staged" and "ready" were always zero | Summary matches the real statuses | Code read against the status list | Dashboard tiles always zero | Medium | Fixed | Staged = waiting, ready = loading, late = past scheduled date and still on the dock. Rule 23, to confirm |
| E-008 | Platform | Observability | No request id and no request log | Every request traceable | Code read | A reported error could not be tied to a log line | High | Fixed | `middleware/requestLog.js`, unit `requestLog.test.js`. Header and log line seen on the test server |
| E-009 | Platform | Safety | The standalone server loaded demo companies into any empty non-local database at start | Demo data is never loaded implicitly | `server.js` | A new production database would start with demo customers | High | Fixed | Now only with `SEED_ON_START=true`. Does not affect the current hosted site, which does not use this file |
| E-010 | Platform | Reliability | After an unexpected error the server kept running; shutdown left database connections open | Exit cleanly and let the process manager restart | `server.js` | Undefined behaviour after a crash; connection leaks on restart | Medium | Fixed | Code change; not exercised by a test |
| E-011 | Platform | Security | Known vulnerabilities in installed packages: backend 8 (1 critical, 4 high), frontend 11 (4 high) | No known high or critical | `npm audit --omit=dev` | Exposure to published exploits in the web framework's dependencies | High | Fixed in part | Backend 1 moderate (uuid), frontend 2 moderate (react-router). Each needs a major version change, so left for a decision. Full suite passes on the updated packages |
| E-012 | API | Consistency | 39 routes send the raw error text on a server error | Errors written for people | grep | Already masked by the reply filter, so no leak; the code is still inconsistent | Low | Open | |
| E-014 | Platform | Security | The request rate limit counts per server instance | Shared counter | Phase 1 D-027 | On the hosted site the real limit is several times the configured one | High | Open: needs a shared store, which is a new service | |
| E-015 | Platform | Disaster recovery | No evidence that a backup has ever been restored | A restore is tested | No runbook or record in the repository | Unknown recovery time and data loss after an incident | High | Open: needs the owner (see `production-readiness-checklist.md`) | |
| E-016 | Platform | Maintainability | No lint configuration | Lint runs on every change | No config file in either package | Gate 1 "lint passes" cannot be run | Medium | Open: adding a linter is a new development dependency, so it needs approval | |
| E-017 | Platform | Observability | No error tracking or alerting service; logs only | Someone is told when errors spike | Code read | Failures are found by users | Medium | Open: needs a provider choice | |
| E-018 | Code | Maintainability | Five server route files of 870 to 1,390 lines; five screen files over 1,000 lines | Smaller units | Line counts | Harder to change safely | Low | Open. Not refactored for style alone | |
| E-019 | Database | Isolation | Some tables carry a tenant id; whether every query honours it has not been audited | Tenant scoping proven by test | Schema read | Unknown | Medium | Open: audit in Workstream 6 | |
| E-020 | Inventory | Data integrity | "On hand = available + reserved + on hold" is kept by code and checked by the reconciliation, not by the database | Database-enforced once every write path is known to update the figures together | Schema read | A future code path could break the identity unnoticed until reconciliation | Medium | Open: Workstream 3 | |
| E-021 | API | Consistency | List routes answer in two shapes: a bare list, or `{ data, meta }` | One shape | Bench responses | Screens need per-route handling; totals unavailable on bare lists | Medium | Open: changing a reply shape affects screens, so it is done per workstream. Job list now sends the total in a header | |
| E-023 | Operations cockpit | Performance, correctness | `GET /api/ops-cockpit` loaded every job, order with lines, stock item, shipment and dispatch operation on each call. It also tested for job and shipment statuses that do not exist, so completed jobs were treated as open and shipments in transit were not counted as shipped | Aggregated in the database; real status names | Bench before: no reply within 30 s on the scaled database | The cockpit page stops loading as history grows | High | Fixed in part | Loads open jobs and today's activity only; everything else is counted in the database. On the QA data the reply is identical to the old one field for field, apart from clock-dependent text and the corrected shipped counts. On the scaled database with 13,000 open jobs it answers in about 1.0 s. Still over the 0.5 s target at that extreme because the page lists every hot job; capping that list is a screen decision for Workstream 4 |

## Rules this phase introduces (to confirm)

22. The job list with no status filter shows every open job (up to 1,000) plus the 200 most recently finished. Asking for a status or an order pages through all of them.
23. Shipping summary: "staged" counts shipments waiting on the dock, "ready" counts shipments being loaded, "late risk" counts those past their scheduled date and not yet dispatched.
24. Margin is shown as not available until cost is recorded on order lines.
25. The staging list shows everything ready to ship (up to 1,000) and the 200 most recently shipped.
26. On the operations cockpit a completed job counts as finished, and a shipment counts as shipped once it is in transit or delivered.

## Disposition of every open or partly fixed finding (standard Rule 10)

D-numbers are from Phase 1 (`defect-register.md`); E-numbers are from Phase 2. Nothing is dropped: an item leaves this table only when it is fixed and verified.

| ID | Disposition | Owner | Depends on | Accepted as done when |
|---|---|---|---|---|
| E-004, E-020 | Assigned to Workstream 3 | Inventory | Review of every stock write path | The database refuses a row where on hand differs from available + reserved + on hold, and three cycles still pass |
| E-009 | Fixed, awaiting verification | Platform | A standalone-server deployment | Server started against an empty non-local test database loads no demo data. Verified by reading the code only; no automated test |
| E-010 | Fixed, awaiting verification | Platform | Same | A forced error makes the process exit with code 1 and close its pool. Not exercised |
| E-011 | Requires a business decision | Owner | Approval for two major upgrades (uuid 14, react-router 7) | `npm audit --omit=dev` reports 0 in both packages and the full suite passes |
| E-012 | Assigned to Workstream 6 | Enterprise experience | None | No route sends raw error text; sweep section "Error replies" still at 0 |
| E-014 (D-027) | Blocked by a dependency | Owner | A shared store service | Login throttle holds across instances, shown by a test with two server processes |
| E-015 | Blocked by a dependency | Owner | Database host backup settings and approval | One restore into a scratch database, timed, with the reconciliation run on the restored copy |
| E-016 | Requires a business decision | Owner | Approval to add a linter as a development dependency | Lint runs in the pull-request workflow and passes |
| E-017 | Requires a business decision | Owner | Choice of an error-tracking service | A forced server error raises an alert |
| E-018 | Accepted risk proposed, awaiting approval | Owner | None | Owner agrees large files are split only when they are next changed for another reason |
| E-019 | Assigned to Workstream 6 | Enterprise experience | None | Sweep section proving a login from one tenant cannot read another's rows on every route that carries a tenant id |
| E-021 | Assigned to Workstreams 2 to 5, per module | Each workstream | Screen changes with each route | Every list route in the module answers `{ data, meta }` and its screens are updated; contract scan shows no mismatch |
| E-023 | Fixed in part; remainder assigned to Workstream 4 | Manufacturing | Screen decision on how many hot jobs to list | Cockpit answers under 500 ms on the scaled database |
| D-011b | Fixed, awaiting verification | Platform | Deploy | A file uploaded on the hosted site downloads byte for byte |
| D-020 | Assigned to Workstreams 2 to 6, per module | Each workstream | None | `api-contract.md` shows 0 calls with no server route for that module |
| D-023 | Assigned to Workstream 6 | Enterprise experience | None | Reconciliation reports 0 problems in demo seed data |
| D-024 | Assigned to Workstream 3 (two stock systems) and 6 (mock services) | Inventory, Enterprise | A decision on which stock tables are authoritative | One stock system; `inventory.mjs` reports 0 mock services |
| D-033 | Requires a business decision | Owner | Card processor choice | A test-mode charge and refund complete from the quick-sale screen |
| D-034 | Requires a business decision | Owner | Email and text provider choice | A receipt reaches a test inbox |
| D-035 | Requires a business decision | Owner | Tax rates per state | Admin > Sales Tax Rates shows no branch state without a rate |
| D-036 | Assigned to Workstream 2 | Sales | None | Sales Dashboard and Order Hub RFQ pages read the database; sweep check compares their figures to it |
| Rules 1 to 26 | Requires a business decision | Owner | None | Owner confirms or changes each rule |

Fixed and verified in Workstream 1, each with an automated check that fails without the fix (sweep section "Platform safeguards", 31 checks; nine were shown failing against the code before this workstream): E-001, E-002, E-003, E-005, E-006, E-007, E-008, and the answering, totals and status parts of E-023. E-003 and E-004 are checked against the database catalog.
