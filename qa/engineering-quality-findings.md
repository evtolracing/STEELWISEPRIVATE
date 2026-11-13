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

## Workstream 2: sales and customer experience

"Sweep 13" and "Sweep 14" are the sections "One customer, one price in every sales channel" and "Order entry screen follows the order rules" of `qa/sim/security.mjs`. "Browser" is `qa/sim/ui-sales.cjs`.

| ID | Module | Category | What it did | Standard expected | Evidence | Impact | Risk | Status | Proof of fix |
|---|---|---|---|---|---|---|---|---|---|
| S-001 | Counter (POS session) | Correctness | Priced every product at one placeholder figure, $54.88 per cwt | The catalog price for that customer | Code read, `POSPricingService.js`; Sweep 13 on the old code | Any sale through this path was mispriced | Critical | Fixed | Sweep 13, sim check "line is the catalog list price" |
| S-002 | Pricing | Correctness | A tier customer got the tier price only in the online store. The order entry lookup compared the wrong codes, and tier start and end dates were ignored | One customer, one price in every channel | Sweep 13: 16 of 21 checks failed on the code before this workstream | Staff quoted list price to contract customers, or contract price after a tier expired | Critical | Fixed | One shared rule (`lib/priceRules.js`, `lib/customerPricing.js`), 8 unit tests, Sweep 13 |
| S-003 | Online store | Security | The price endpoint used the price level sent by the browser | The server decides the level from the login | Code read, `routes/ecom.js` | A customer could ask for another level's prices | High | Fixed | Sweep 13 |
| S-004 | Counter | Control | Discounts had no bounds and approval was a typed PIN | Bounded discount, approval by a signed-in manager | Code read, `POSWorkflowService.js`, `routes/pos.js` | Unlimited discount with no accountable approver | High | Fixed | Sweep 13 |
| S-005 | Sales Rep Mobile | Correctness | Customers, products, stock and orders were invented in the browser; submit saved nothing; an "offline queue" did not exist | Real data, real save, honest failure | Code read, five pages | A rep's order was lost while the screen said it was sent | High | Fixed | Browser, 11 checks |
| S-006 | Order entry | Data integrity | The order entry API accepted zero or negative quantities and prices, recorded the wrong user, could change an order in any status, and replaced lines outside a transaction | Same rules as the rest of the order system | Sweep 14: 21 of the first 30 checks failed on the code before this workstream; a failed edit deleted every line of the test order | Corrupt orders from the screen staff use most | Critical | Fixed | Sweep 14, sim scenario "entry-screen" (2 of every 7 scenarios) |
| S-007 | Order entry, Retail POS | Money | Showed 6% tax on the screen and saved no tax on the order | Tax saved on the order by a stated rule | Code read; Sweep 14 | Tax shown to the customer was never billed | Critical | Fixed | Rule 27, decided by the owner 2026-11-13: selling branch state. Sweep 14, unit tests |
| S-008 | Order entry | Consistency | Two entry screens list four Michigan branches in code | Branches come from the database | Code read | The other branches cannot be picked there | Medium | Open | |
| S-009 | Remnants | Business rule | Remnant discount is fixed in code at 15% and 25% on two screens | A rule the owner sets | Code read | Cannot be changed without a release | Medium | Open | |
| S-010 | Delivery promise | Correctness | Delivery promise, cutoff times, branch comparison and split shipments run on invented data in the browser, including the promise date at web checkout | A promise from real capacity and stock, or none | Code read; `api-contract.md` | Customers may be shown a date nobody computed | High | Open | Mobile preview now carries a caution notice |
| S-011 | Overrides | Auditability | Override records were kept only in the browser | Saved on the server, attributed, listed on the order | Code read, `overrideApi.js` | No record of who overrode what | High | Fixed | `routes/overrides.js`, Sweep 14 |
| S-012 (D-036) | Sales Dashboard | Correctness | Fixed sample figures | Counted from the database, or "Not available" | Code read | Managers read invented numbers | High | Fixed | `routes/salesDashboard.js`, Sweep 14, Browser |
| S-013 | Customers | Correctness | The Pricing Tier chosen on the customer screen was stored where no price read it, and no screen set the real tier | The screen sets the tier prices use | Code read; Sweep 13 | Setting a tier had no effect | High | Fixed | Sweep 13: manager sets, price follows; clerk refused; audit entry |
| S-014 | Customers | Correctness | Saving customer preferences always failed with a server error: the save named two fields the database does not have | The save works | Server log, `PrismaClientValidationError`; Sweep 13 on the previous commit | No customer preference could ever be saved | High | Fixed | Sweep 13 "tolerances are saved" |
| S-015 | Customers | Security | A customer login could read the staff-only notes, contract notes, credit limit and discount on its own account | Staff-only fields stay with staff | Probe as a customer login; Sweep 13 on the previous commit | Internal remarks visible to the customer | High | Fixed | Sweep 13 |
| S-016 | Customers | Data integrity | Creating or editing a customer wrote whatever fields the request held; a change of tax-exempt status left no record | Only editable fields; tax status changes recorded | Code read, `routes/customers.js`; Sweep 13 on the previous commit (server error, self-parent accepted) | A request could rewrite codes or ids; no trail for tax exemption | High | Fixed | Sweep 13, 6 checks |
| S-017 | Pricing | Correctness | The Pricing screen showed sample prices, surcharges and quotes with buttons that did nothing | The real price book | Code read | Invented prices on a screen named Pricing | High | Fixed | `/api/pricing/overview`, `/api/pricing/price-list`, Sweep 13, Browser |
| S-018 | Pricing | Operational gap | No screen could change a list price | A controlled, recorded way to change one | Screen and route review | Price changes needed a developer | Medium | Fixed | Managers only, audit entry with old and new price. Rule 30, to confirm. Sweep 13, Browser |
| S-019 | Credit | Control | Credit limits are stored and never checked. The counter's credit guards read fields that do not exist | A stated rule: block, warn or neither | Code read, `POSValidationService.js`, order routes | Orders can exceed any limit | High | Fixed (rule 32) | Unit tests, sweep section 16, browser checks |
| S-020 | Customers | Consistency | "Default Discount %" on the customer screen is applied nowhere | A field either works or is not offered | Code read | Staff believe a discount is set | Medium | Open | |
| S-021 | Order Hub | Duplication | A second RFQ console, not in the menu, beside RFQs & Quotes | One place for one job | Route and menu review | Two lists of the same work | Medium | Open | |
| S-022 | Counter | Dead code | The POS session API is called by no screen and saves no tax | Unused paths are removed or finished | Contract scan, code read | A second, untested way to sell | Medium | Open | |
| S-023 | Inventory search | Confidentiality | Stock search returns unit cost to sales screens | Cost only to roles that need it | Reply of `/api/inventory/search` | Cost visible on a rep's phone | Medium | Open | Customer logins are refused this route (probe: 403) |
| S-024 | Help manual | Accuracy | Pricing, Sales Dashboard, Sales Rep Mobile and customer pages described tabs, contracts, signatures, visit logs and offline use that do not exist | The manual matches the screens | Manual read against the screens | Staff follow steps that are not there | Medium | Fixed in part | Those four sections rewritten. The other modules are not yet checked |
| S-025 | Products | Data integrity | Creating or editing a product writes whatever fields the request holds | Only editable fields | Code read, `routes/products.js` | A request could rewrite any product field | High | Open | |
| S-026 | Sales screens | Contract | Screen code calls 18 sales routes that do not exist: 13 under `/api/pricing` in `api/pricing.js`, 3 will-call, 2 split-shipment | No call without a route | `api-contract.md` | Buttons that fail when pressed | Medium | Open | |
| S-027 | Quotes | Efficiency | Quote lines are priced by hand; the screen offers no customer price because RFQ lines are free text, not products | The customer's price is offered when the product is known | Code read, `routes/quotes.js` | Slow quoting and prices that differ from the price book | Medium | Open | |

### Disposition of every Workstream 2 item not fixed and verified

| ID | Disposition | Owner | Depends on | What will show it is done |
|---|---|---|---|---|
| S-008 | Deferred with justification: the branch list belongs with the promise engine (S-010), which reads the same list | Sales | S-010 | Both entry screens list the branches in the database; Browser check |
| S-009 | Requires a business decision | Owner | The remnant discount rule and who may change it | Discount read from a setting; sweep check |
| S-010 | Requires a business decision, then a build | Owner | Cutoff times, capacity rules, whether to show a date at web checkout before the engine exists | Promise dates come from a server route; contract scan shows no promise call without a route |
| S-018 | Fixed, awaiting the owner's confirmation of rule 30 | Owner | None | Owner confirms who may change a list price |
| S-019 | Fixed in this workstream | Owner decided "Warn, manager approves" | Order saved on hold with a warning; manager releases; each release recorded (rule 32) | Sweep section 16: 22 checks, 17 fail on the previous code. 8 unit tests. 6 browser checks |
| S-020 | Requires a business decision | Owner | Whether a per-customer discount stacks with the tier | Field applied to prices and tested, or removed |
| S-021 | Requires a business decision | Owner | Retire Order Hub or merge it | One RFQ screen; route removed or linked |
| S-022 | Assigned to Workstream 6 | Enterprise experience | S-026 | Contract scan and route inventory show no unused sales route |
| S-023 | Assigned to Workstream 3 | Inventory | Which roles may see cost | Sweep check: cost absent for sales roles |
| S-024 | Assigned to Workstreams 3 to 6, per module | Each workstream | None | Each module's manual pages checked against its screens |
| S-025 | Assigned to Workstream 3 | Inventory | None | Sweep check: unknown fields ignored |
| S-026 | Assigned to Workstream 5 (will-call, split shipment) and 6 (`api/pricing.js`) | Logistics, Enterprise | S-010 | `api-contract.md` shows 0 sales calls without a route |
| S-027 | Requires a business decision | Owner | Whether RFQ lines should pick products | Quote line offers the customer's price; sweep check |
| Rules 27 to 31 | Rule 27 decided by the owner. Rules 28 to 31 require confirmation | Owner | None | Owner confirms or changes each rule |

Fixed and verified in Workstream 2, each with an automated check that fails without the fix: S-001 to S-007, S-011 to S-018. Against the previous commit, 23 of the 47 checks in Sweep 13 and 14 of the 43 in Sweep 14 fail; against the code before the workstream, 16 of the first 21 and 21 of the first 30 failed. NOT VERIFIED: anything on the hosted site, behaviour on MySQL, response times of the new routes at 80-branch volume.

