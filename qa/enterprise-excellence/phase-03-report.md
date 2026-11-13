# Phase 3 of 12: final execution report

**Forensic database audit, transactional correctness, inventory and financial reconciliation, concurrency hardening and 80-location scalability**

Date: 2026-11-13. Branch `claude/project-thread-25z3jd`, restarted from `main` at `181a874` (the merge of pull request 30). Pull request 31 carries Phase 3; it is not merged.

**Updated the same day after the owner answered the six questions at the end of this report.** The answers and what was built from them are in `phase-03-owner-decisions.md`; this report now describes the state after that work.

All testing ran on local databases: `steelwise_qa` for function and `steelwise_qa_scale3` for volume. This environment holds no connection to the live database; nothing was read from it, written to it or run against it. A statement in this report that says a test passed refers to a run in this session; anything else is marked NOT VERIFIED or NOT EXECUTED.

## FINAL STATUS

**PARTIALLY COMPLETE**

Reasons, stated exactly:

1. **One P1 from Phase 2 that was assigned to this phase is not corrected** (completion condition 17): the second stock list and order hub (B-009). They were audited. They were not migrated, because the live contents of the two JSON stores cannot be seen from here and moving unread records into the order and stock tables would be changing business data on a guess.
2. **Transfer reconciliation is verified only for the transfer that exists** (condition 6). A transfer is one immediate step. In-transit stock, partial receipt, shortage, damage, loss and duplicate receipt cannot occur and were NOT EXECUTED (G-007).
3. **Backup and recovery are NOT VERIFIED** (Gate H). The owner has decided backups come later (E-015, ACCEPTED RISK WITH APPROVAL). No dry run of the database files on a copy of live data was possible.
4. **One of the twelve concurrency tests could not be executed**: concurrent transfer receipts, for the reason in 2.
5. **Traceability through shop-floor jobs rests on the reservation.** A work order now records what it consumed and made. A shop-floor job records operations, not weights; its material is known from the stock reserved for the line it ships.
6. **Performance was measured on a local machine**, not the host.

Everything that was corrected is VERIFIED FIXED with an automated check that fails without it. Five P1 defects found in this phase were fixed (G-001, G-002, G-004, G-017, G-019), and three P1 findings from earlier phases were closed (E-004, M-016, I-016), with C-006 and C-010 at P2.

Closed by the owner's decisions of 2026-11-13, each built and tested: shipping with nothing reserved is refused (G-019); cutting takes weight off the source and creates the pieces (M-016, G-006, G-008); stock corrections after a count (I-016); invoice numbers never skipped or repeated (G-017); a five-year archive warning (G-016).

---

## DATABASE DISCOVERY

| Item | Result |
|---|---|
| Method | `qa/tools/db-schema.mjs` reads PostgreSQL's catalogues; output `qa/results/db-schema.json`; now part of the gates |
| Tables examined | 160 (158 at the start; `RequestKey` and `DocumentCounter` added) |
| Columns | 2,465 |
| Relationships examined | 188 foreign keys (171 at the start), all validated; 217 reference-like columns with no key, each classified |
| Constraints examined | 160 primary keys, 82 unique indexes, 25 value checks (9 at the start) |
| Indexes examined | 582 (578 at the start; 10 exact duplicates dropped, 14 added) |
| Views, triggers, functions, partitions | None exist. All logic is in the server |
| Row-level security | None in the test database. On the host each SQL Editor file adds a policy per table that shuts out Supabase's public API roles; whether it is in force is NOT VERIFIED |
| Migrations | 27 apply to an empty database with 0 failures |
| Critical data flows mapped | Receipt, reservation, transfer, hold, dispatch, invoice, payment, credit, refund, return, counter sale and void, work order: `phase-03-data-ownership.md`, `phase-03-transaction-safety.md` section 2 |
| Isolation of the test databases | Verified before any mutating test: `phase-03-schema-audit.md` section 1 |

Detail: `phase-03-schema-audit.md`, `phase-03-data-ownership.md`, `database-inventory.md`.

## DATA INTEGRITY

**Inventory reconciliation.** 18 read-only checks (balance identity, negatives, reserved against reservation rows, lines over-reserved, reservations on cancelled orders, on hand against the movement ledger, branch agreement, transfer shape, shipped movements) return 0 after three simulation seeds and again after the Phase 3 scenarios. Inside the scenarios the same four-part check runs on every item after every stock operation. Two defects were found and fixed (G-004). After the owner's decisions the ledger also carries pieces made, material cut away, scrap and corrections, and the same checks hold. Detail: `phase-03-inventory-reconciliation.md`.

**Transfer reconciliation.** Nine scenarios. The whole item moves with one movement; the sending branch falls and the receiving branch rises by exactly the quantity; the company total is unchanged; a reserved item keeps its reservation and ships from the new branch; the same transfer twice at once happens once. In-transit and receipt stages do not exist: NOT EXECUTED (G-007).

**Material traceability.** Every stock item has a heat; remnants inherit heat, grade and owner and a mismatch is refused; reserved shipments tie item, order and shipment; the forward trace from heat to customer was run as a query (144 shipping movements, 6 heats, 19 customers). Since the owner's decisions, a shipment cannot leave without reserved stock (G-019) and a work order's pieces carry the source heat (M-016): a scenario follows a heat from the item received, through the pieces cut for an order, to the customer's shipment. Shop-floor jobs do not record weights. Detail: `phase-03-traceability-audit.md`.

**Financial reconciliation.** 11 checks return 0 outside the demo seed rows. Amounts are stored to the cent (12 columns held stray digits before; 0 after, G-001). The database now enforces invoice and order totals. Tax and freight across part shipments add to the cent. Detail: `phase-03-financial-reconciliation.md`.

**Referential integrity.** 15 foreign keys added on references that tie money, stock and work to their source (G-002); 2 more for the branch of quotes and requests. Orphan values exist only in sample and JSON-backed modules, written by the demo seed. 217 columns remain without a key, most in tables no code writes (G-003, deferred).

## TRANSACTION RELIABILITY

| Item | Result |
|---|---|
| Concurrency scenarios executed | 19 in the Phase 3 suite (18 in group 6 and a correction racing a reservation and a shipment), plus the 8 probes of each simulation seed and the Phase 2 integrity races, all in the final run |
| The twelve required tests | 11 executed in whole or for the part that exists and pass; 1 NOT EXECUTED (transfer receipts). `phase-03-concurrency-results.md` |
| Duplicate request tests | Same order three times at once with one key: one order. Dispatch four times, invoice three more times, payment five times, return receipt four times, void twice, receipt five times, transfer twice: each happens once |
| Rollback tests | Order with one bad line; receipt with an unknown heat; dispatch with a hold on the second line; credit whose last step is forced to fail. Each leaves nothing behind |
| Idempotency results | A `RequestKey` table and middleware (C-006): replay, wait, different body refused, refusals not remembered, stale claim taken over. The screens send a key on every request that creates a document or moves stock |
| Deadlocks | 0 in the PostgreSQL log for the session |
| Remaining transaction risks | Edits to fields other than status are last write wins (G-020); a caller that sends no key is not protected on order creation or reservation; nothing retries in the background (B-019); a dropped connection mid-transaction was not simulated; one server process only |

Detail: `phase-03-transaction-safety.md`.

## PERFORMANCE

| Item | Result |
|---|---|
| Dataset | 85 branches, 72,240 orders, 74,347 order lines, 100,233 stock items, 72,541 jobs, 50,869 shipments, 37,625 invoices, 42,441 movements; 325 MB. Synthetic and uniform; assumptions stated in the document |
| Environment | Local: 4 processors, 16 GB, PostgreSQL 16 defaults. Not the host |
| Query benchmarks | 18 branch screens through the server, 9 runs each: slowest 158 ms at the 95th percentile for a branch login, 267 ms for an all-branch login; target 500 ms. 14 statements with `EXPLAIN (ANALYZE, BUFFERS)` |
| Concurrent workloads | 50, 100, 200 and 400 list requests at once: 0 failures, about 43 a second from one process, 16 database connections at peak. 80 order writes at once: all saved |
| Bottlenecks identified | None over target. Two statements grow with the whole company instead of the branch: stock search (140 ms, sequential scan of every item) and a branch's job count (25 ms). The order list reply is 244 KB for 50 orders |
| Improvements measured | None was needed for speed, so none is claimed. Ten duplicate indexes were dropped and eight added for new foreign keys; no plan changed |
| Not done, on purpose | No index, partition, replica or summary table was added without a measurement that calls for it |

Detail: `phase-03-query-performance.md`.

## CORRECTIVE ENGINEERING

**Defects discovered: 20 (G-001 to G-020). Corrected and verified: 12. Earlier findings closed: 5 (C-006, C-010, E-004, M-016, I-016).**

| Finding | Severity | What | Status |
|---|---|---|---|
| G-001 | P1 | Amounts and weights stored with floating-point digits | VERIFIED FIXED |
| G-002 | P1 | 15 references on money, stock and work with no foreign key | VERIFIED FIXED |
| G-004 | P1 | A line reserved beyond its need; a cancelled order keeping stock | VERIFIED FIXED |
| G-017 | P1 | Numbering loses orders under 80 simultaneous saves, and stops for good after enough deleted rows | VERIFIED FIXED |
| G-019 | P1 | Shipping with nothing reserved records no item or heat and moves no stock | VERIFIED FIXED (owner: refuse) |
| M-016 | P1 | Completing a work order moved no stock | VERIFIED FIXED (owner: always tracked) |
| I-016 | P1 | No way to correct stock after a count | VERIFIED FIXED (owner: as recommended) |
| G-005 | P3 | Ten duplicate indexes | VERIFIED FIXED |
| G-010 | P2 | Order status moves and reservations left no history | VERIFIED FIXED |
| G-012 | P2 | Quotes and requests readable across branches | VERIFIED FIXED |
| C-006 | P2 | Repeated order request made a second order | VERIFIED FIXED |
| C-010 | P2 | A void could stop half-way | VERIFIED FIXED |
| E-004 | P1 | Almost no value checks in the database | VERIFIED FIXED |
| G-003, G-007, G-009, G-011, G-013, G-014, G-018, G-020 | P2, P3 | See the register | DEFERRED TO SPECIFIC PHASE, each with reason, phase, correction, dependencies, acceptance and verification |
| G-006, G-008, G-016 | P2, P3 | Remnant and parent; several work orders on one item; retention | VERIFIED FIXED (owner's decisions) |
| E-015 | P1 | No backup confirmed, no restore tested | ACCEPTED RISK WITH APPROVAL (owner: later) |
| G-015 | P2 | Host connection settings | BLOCKED on the owner |

One change was made and withdrawn: refusing to transfer reserved stock. The existing simulation showed it is an established workflow, so the behaviour is now tested instead.

**Migrations created: 4**, each with a SQL Editor file, each run twice on the 85-branch copy.

| # | File | Content |
|---|---|---|
| 6 | `20261113210000_reference_integrity` | 15 foreign keys, 8 indexes, 15 value checks, a bad default removed, 10 duplicate indexes dropped |
| 7 | `20261113211000_request_keys` | `RequestKey` table |
| 8 | `20261113212000_quote_branch` | Branch on quotes and requests, with backfill |
| 9 | `20261113220000_document_counters` | `DocumentCounter`: the last invoice and credit memo number |

**Files modified.** Server: `prisma/schema.prisma`, `src/app.js`, `lib/db.js`, `lib/branchScope.js`, `lib/numbering.js`, `routes/orders.js`, `routes/quickSale.js`, `routes/inventory.js` (comment only), `services/billing.js`, `seeds/demo/index.js`. `routes/shipments.js`, `routes/workOrders.js`, `lib/receiving.js`, `routes/admin.js`. New: `lib/moneyColumns.js`, `middleware/requestKeys.js`, `lib/stockChanges.js`, `lib/retention.js`. Screens: `api/authFetch.js`, `api/client.js`, the stock item screen (Correct quantity), the work order screen (pieces), user administration (archive notice); new `api/requestKey.js`, `components/common/RetentionNotice.jsx`. Tools: `qa/tools/db-facts.mjs`, `run-gates.sh`, `excellence-docs.mjs`, `findings-import.mjs`; new `qa/tools/db-schema.mjs`, `qa/sim/phase3-db.mjs`, `qa/perf/branch-bench.mjs`, `phase3-plans.sh`, `phase3-load.mjs`.

**Tests added.** 74 database scenarios with 607 checks; 27 read-only consistency checks; 21 unit tests (126 in all); the schema inventory; three performance tools.

## VERIFICATION

| Item | Result |
|---|---|
| Tests executed | The full gate run on the final code: `phase-03-regression-results.md` section 1 |
| Passed | Every step: 150 of 150 simulated jobs; sweep 20 of 20; branch boundary 37 of 37; Phase 2 integrity 80 of 80; Phase 3 scenarios 74 of 74 (607 checks); unit 126 of 126; five browser suites, 127 checks; 125 screens open; baseline probe 4 of 4; coverage 320 of 320; lint 0 errors; build |
| Failed | None in the final run. Failures during the phase and what was done about each: `phase-03-regression-results.md` section 4 |
| Blocked or not executed | Transfer receipt and in-transit cases; restore of a backup; dry run on live data; old code on the new schema; a dropped connection; anything on the host |
| Operational scenarios completed | 74 database-backed scenarios (50 required): receiving and holds 10, reservations and shipping 9, work orders and remnants 11, transfers 9, orders and money 10, concurrency and recovery 18, stock corrections, invoice numbers and retention 7 |
| Regression | Four older tests were changed because the owner's rules changed what they should expect (a shipment now needs reserved stock; a reserved item may be cut; a work order's input is what the item holds); each now asserts the new rule. Reach by route: 285 of 611, 88 of 319 changing |
| GitHub workflow for the final commit | NOT VERIFIED at the time of writing |

### Quality gates

| Gate | Result |
|---|---|
| A. Schema integrity | PASS for the order-to-cash tables. Open: G-003, B-009 |
| B. Inventory integrity | PASS. Open: G-007 (no in-transit stage), B-009 |
| C. Financial integrity | PASS. Invoice numbers have no gaps from the counter's start |
| D. Transaction reliability | PASS for what was tested. Open: G-020 |
| E. Security and isolation | PASS for the record types covered. Open: C-009 remainder, G-011, G-018 |
| F. Performance | PASS on a local machine; host not measured |
| G. Regression | PASS |
| H. Migration and recovery | Migrations PASS. Recovery NOT VERIFIED (owner: backups later) |

### The twenty completion conditions

| # | Condition | Met |
|---:|---|---|
| 1 | Schema inventoried from the database | Yes |
| 2 | Authoritative data sources documented | Yes |
| 3 | Critical relationships and constraints validated | Yes, for money, stock and work |
| 4 | Inventory reconciliation tests pass | Yes, for what the application records |
| 5 | Material traceability tests pass | Yes for receipts, work orders, remnants and shipments. Shop-floor jobs record no weights |
| 6 | Transfer reconciliation tests pass | In part: only the immediate transfer exists |
| 7 | Financial reconciliation tests pass | Yes |
| 8 | Critical transaction boundaries verified | Yes |
| 9 | Concurrency tests pass | In part: 11 of 12; transfer receipts cannot be executed |
| 10 | Duplicate transaction protection verified | Yes, for order creation and by state for the rest; web checkout and intake not separately exercised |
| 11 | Tenant and location isolation tests pass | Yes, for the record types covered |
| 12 | Critical query performance measured | Yes, locally |
| 13 | Confirmed unacceptable bottlenecks corrected | None was confirmed |
| 14 | Required migrations safely tested | Yes on a copy at volume; no dry run on live data |
| 15 | At least 50 database-backed scenarios pass | Yes: 74 |
| 16 | Connected-module regression passes | Yes |
| 17 | No unresolved confirmed P0 or P1 database integrity defect | **No**: B-009 |
| 18 | All findings resolved or dispositioned | Yes: 243 findings, each with a permitted status |
| 19 | Project artifacts updated | Yes |
| 20 | Phase 4 handoff complete | Yes, below |

Because conditions 6, 9 and 17 are not met in full, and recovery is not verified, the phase is not reported as verified complete.

## PRODUCTION READINESS

**Confirmed blockers**

1. SQL Editor files 6, 7, 8 and 9 must be applied, in order, before the Phase 3 code is merged. Without file 9 no invoice can be numbered.
2. E-015: no backup confirmed, no restore tested. The owner has decided this comes later; it remains a blocker for calling the system production ready.
3. B-009: two stock lists. Needs a read-only export of the live stores.

**What staff will notice after the merge.** A shipment with nothing reserved is refused, with a message that says to reserve the stock on the order. Completing a work order changes stock. Counter sale invoices are numbered in the one invoice series.

**Unverified areas.** Listed in full in `progress.json`. The main ones: everything about the live database and host; shipments already dispatched on the live system with nothing reserved; request keys on web checkout and order intake; sustained load and more than one server instance.

**Remaining risks.** `production-risk-register.md`, updated: R-08 reduced, R-25 closed in the code, R-26 (connection exhaustion on the host), R-27 (live rows that break the new rules), R-28 (audit trail can be rewritten), R-29 (search and job lists grow with the company).

**Questions still open for the owner**

1. Is `DATABASE_URL` on the host the provider's pooler address, and with what connection limit? (G-015)
2. Should shop-floor jobs record weights, scrap and pieces the way work orders now do?
3. When records pass five years, where should the archive go and who approves it?
4. A read-only export of the second stock list and order hub, so they can be migrated. (B-009)

## PHASE 4 HANDOFF

**Phase 4 of 12: API contracts, external integrations, event reliability, error recovery and cross-module communication.** Not started. What Phases 1 to 3 found that belongs to it:

| # | Subject | Modules and endpoints | Findings | Evidence | Depends on | Tests required |
|---|---|---|---|---|---|---|
| 1 | **Inconsistent response formats** | Every list route: some return a bare list, some `{ data, meta }`; some success bodies are wrapped in `{ success, data }` | E-021 | `phase-02-api-contracts.md` section 2 | The screens that read each shape | A contract test per route family; the five browser suites |
| 2 | **Replies larger than the screen needs** | `GET /api/orders` (244 KB for 50 orders), `GET /api/inventory` (519 KB for 50 rows for an all-branch login), `GET /api/ops-cockpit` | G-014, E-023 | `qa/results/phase3-branch-bench-before.json` | Item 1 | Reply size and requests per second before and after |
| 3 | **Lists with no row limit** | 76 list queries in handlers | B-012, E-008 | `api-inventory.md` | Paging in the screens | Each list capped; screens page |
| 4 | **Missing request validation** | Validation is written by hand per handler. Covered: orders, stock, shipments, billing, jobs, work orders, users. Not systematically covered: the 231 changing routes with no success-path test | B-016, B-006 | Baseline probe: 0 server errors on an empty body, which proves no crash, not that bad values are refused | None | A bad-value matrix per route: wrong type, out of range, unknown reference |
| 5 | **Lost updates on edit** | `PUT /api/orders/:id` and every other edit route: fields other than status are last write wins | G-020 | Code read; Phase 3 concurrency test 2 | A version or updated-at in the request | Two edits at once: one 200, one 409 |
| 6 | **Idempotency gaps** | Request keys are opt-in by header. Protected by test: `POST /api/orders`. Same middleware, not exercised: `POST /api/ecom/checkout/*`, `POST /api/orders/intake*`, `POST /api/orders/:id/allocate`. Not covered at all: the partner API, which does not send keys | C-006 (closed for order creation) | `phase-03-transaction-safety.md` section 3 | Partner contract | The same key twice on each document-creating route; a browser test that the header is sent |
| 7 | **Partner API: carriers** | `src/backend/src/routes/partner/carrierRoutes.js`: filters on columns that do not exist, sets statuses that do not exist, bypasses dispatch and delivery rules | C-002 | Code read in Phase 2 | Export of the dispatch and deliver steps from `routes/shipments.js` | A carrier update goes through the same rules as staff dispatch; stock and invoice reconcile |
| 8 | **Partner API: customers and suppliers; partner sign-in** | `routes/partner/customerRoutes.js`, `supplierRoutes.js`, `partnerAuthRoutes.js`, `adminRoutes.js` | Phase 2 unverified area | Sweep proves refusal without a token (60 calls). No success path has ever been run | A partner token and fixture | Success-path tests; customer isolation between partners |
| 9 | **Webhooks: delivery is recorded for retry and never retried** | `services/webhookService.js` (`processPendingRetries`), `routes/partner/webhookRoutes.js`, table `WebhookDelivery` | B-018 (BLOCKED) | Code read: nothing calls the retry function | A scheduler (B-019) | Failed delivery is retried with backoff; a duplicate delivery is recognised by the receiver id; a dead letter after N tries |
| 10 | **No scheduler, queue or background work** | Whole server | B-019 (REQUIRES BUSINESS DECISION) | No such code | The owner: may the host run a scheduled trigger? | A scheduled job that runs once per period even with several instances |
| 11 | **Timeouts and retries to outside services** | `routes/tts.js`, AI assistant routes, `services/webhookService.js` are the only code that calls out | Not audited | Code search in Phase 3 | Provider keys | Each outside call has a timeout, a bounded retry and a plain failure answer; none is made inside a database transaction |
| 12 | **External service dependencies** | Database and file storage (Supabase), host (Vercel), AI providers (three keys in `.env.example`), speech (one key). Not connected: email, text messages, card processor, carrier rating, tax service, accounting | D-033, D-034, decision 5 | `.env.example` | The owner's choice of providers | A failure of each dependency degrades one function and says so |
| 13 | **Screen calls with no server route** | 80 of 283 distinct calls from the screens match no route; all are in labelled sample modules | X-009 | `qa/api-contract.md` | Decision 4 (build everything) | The contract check stays in the gates; the count falls as modules are built |
| 14 | **Two addresses for the same resource** | Jobs and work centers answer at `/api/…` and `/api/v1/…` | B-001 (fixed for access rules) | Probe: both follow the same rules | The screens | One address, or a test that both stay identical |
| 15 | **Missing observability** | One log line per request with a request id. No error tracker, no alert, no metric on failed sign-ins, slow queries or queue depth | E-017 (REQUIRES BUSINESS DECISION), R-18 | Code read | The owner's choice of service | An alert fires on a forced server error |
| 16 | **Request limits per instance** | `middleware` rate limit counts per server instance | E-014 | Phase 1 | A shared counter or the host's firewall | The limit holds across two instances |
| 17 | **Uploads reachable before the sign-in gate on a disk host** | `app.use('/uploads', …)` in `src/backend/src/app.js` | B-021 | Code read; NOT VERIFIED on the host | None | A probe on both paths |
| 18 | **Cross-module data inconsistencies** | Second stock list and order hub against the real tables (B-009); order intake seller by fixed code (C-012); operations cockpit acts on text sent by the browser (C-013); dashboards not compared with records | B-009, C-012, C-013 | Phases 2 and 3 | Owner decisions | A check that each summary equals the records it summarises |
| 19 | **Missing endpoint: forward trace** | `GET /api/heats/:heatNumber/trace` lists items and cut pieces, not shipments or customers | `phase-03-traceability-audit.md` | Route read | None | A heat returns every shipment and customer that received it, including through pieces cut on a work order |
| 20 | **Error contract on rule refusals from the database** | A value check or foreign key refused by the database surfaces as a 400 or 500 depending on the handler | Phase 3: checks added | Scenario: bad totals answered 4xx on orders; other routes not audited | None | Each new check has a route test that expects a 4xx with a plain reason |

Phase 4 should start by reading `phase-02-api-contracts.md`, `qa/api-contract.md` and `phase-03-transaction-safety.md` section 3.

**Phase 4 has not been started.**

---

## Completion requirements of the Phase 3 instruction: files

| File | Written |
|---|---|
| `phase-03-schema-audit.md` | Yes |
| `phase-03-data-ownership.md` | Yes |
| `phase-03-inventory-reconciliation.md` | Yes |
| `phase-03-financial-reconciliation.md` | Yes |
| `phase-03-traceability-audit.md` | Yes |
| `phase-03-transaction-safety.md` | Yes |
| `phase-03-concurrency-results.md` | Yes |
| `phase-03-query-performance.md` | Yes |
| `phase-03-migration-review.md` | Yes |
| `phase-03-recovery-assessment.md` | Yes |
| `phase-03-regression-results.md` | Yes |
| `phase-03-quality-scorecard.md` | Yes |
| `phase-03-report.md` | This file |
| `phase-03-owner-decisions.md` | Yes (added after the owner's answers) |
| Updated: `database-inventory.md`, `module-dependency-map.md`, `findings-register.md`, `quality-scorecard.md`, `production-risk-register.md`, `progress.json` | Yes, rebuilt by tool from the final run; the risk register by hand |
