# Phase 2: architecture audit

Written by hand on 2026-11-13 from reading the code and from what the tools measured in this session. Nothing here was measured on the live system. Where a statement rests on reading rather than on a test, it says "code read".

## 1. What the application is, as built

One React screen application (JavaScript and JSX, Material UI, built by Vite) and one Express server over one PostgreSQL database through Prisma. The server is deployed as a single function on the host. There is no queue, no scheduler, no cache, no second service and no message bus: every action happens inside one HTTP request.

| Layer | What is there | Measured |
|---|---|---|
| Screens | `src/frontend/src`: pages, apps, components, hooks, contexts | 143 screens; 76 real, 58 labelled samples, 5 static, 4 mixed (screen audit, this session) |
| Screen to server | Literal API calls in the screens | 283 distinct calls; 203 match a server route; 80 do not, all in sample modules (`qa/api-contract.md`) |
| Access gate | `middleware/auth.js`, `middleware/apiGate.js`, `lib/roleAccess.js`, `lib/branchScope.js` | Every one of 611 routes needs a sign-in (sweep) |
| Routes | `src/backend/src/routes`: 72 files, 74 mounts | 611 routes, 319 that change data |
| Rules | `src/backend/src/lib`: 23 files; `src/backend/src/services`: 18 files | 105 unit tests reach the rules in `lib` |
| Database client | `lib/db.js`: one Prisma client with an extension that every query passes through | The branch boundary and the "unknown record" translation live here |
| Database | 157 tables, 96 enumerations | 5 SQL Editor files waiting to be applied by the owner |

## 2. The path of one request

```
screen ── fetch /api/… ──► safeErrors (request id, request store, reply scrubbing)
                         ► pagingGuard (caps list sizes)
                         ► apiGate: sign-in ► customer or staff? ► leadership pages ► department rule ► admin area
                         ► auth: loads the user, sets the branch scope for this request
                         ► route handler (validation, the rule, the saves)
                         ► lib/db.js extension: adds the branch filter to every query on a branch-owned table
                         ► PostgreSQL (value checks, foreign keys, the stock balance identity)
```

Three properties of this path matter for everything below.

1. **Authorization is on the server and in one place per kind.** Sign-in and role in the gate; department in one table (`WRITE_RULES`); branch in the database client. No handler has to remember to check the branch. A handler that forgets cannot leak, because the filter is added underneath it.
2. **Most rules still live in the handlers.** 319 routes talk to the database directly from the route file. The rules that have been moved out into `lib/` are the ones with unit tests (pricing, tax, credit, billing, workflow status, receiving, work orders, field lists, numbering, branch scope, department rules, login rules).
3. **There is no background path.** A reminder, a retry or a report runs only if a person presses something (B-019, a decision the owner has deferred).

## 3. Modules examined

Read in full in Phase 2: `lib/db.js`, `lib/roleAccess.js`, `lib/branchScope.js` (new), `lib/numbering.js`, `lib/jobHistory.js`, `lib/workflowRules.js`, `lib/receiving.js`, `middleware/auth.js`, `middleware/apiGate.js`, `middleware/safeErrors.js`, and the routes `orders.js`, `inventory.js`, `coils.js` (stock items), `shipments.js` (dispatch and deliver), `jobs.js`, `operationsRoutes.js`, `workOrders.js`, `workCenters.js`, `users.js`, `quickSale.js`, `pos.js` (pricing section), `intakeOrders.js`, `orderHubRoutes.js`, `materialTrackingRoutes.js`, `bomV1.js` (recipe change), `assets.js`, `maintenanceOrders.js`, `executive.js` (decisions), `opsCockpit.js` (accept), `demandShaping.js`, `partner/carrierRoutes.js`. Screens read: order entry, counter quick sale, work center queue, will-call queue, stock item detail.

Examined by tool only (discovery, probe, sweep), not read line by line: the other 45 route files and the 18 service files. That is recorded as unverified in the report.

## 4. Dependency review

- **No circular imports on a critical path.** `lib/db.js` imports `requestContext` and `branchScope`; `branchScope` imports `requestContext` only. `roleAccess` imports nothing. `userAdminRules` imports `branchScope`. Routes import `lib`; `lib` never imports a route. (Code read of the import lines of every file in `lib/` and `middleware/`.)
- **One tight coupling found:** dispatching and delivering a shipment are functions inside `routes/shipments.js` and are not exported, so the carrier partner routes re-implemented them, wrongly (C-002).
- **Two parallel implementations of core records** (B-009): a second stock list and a second order pipeline, each keeping whole records as JSON. The owner has decided which is real. They are fenced (department rules, sign-in, probe) and not yet connected or retired.
- **Two addresses for the same routes:** jobs and work centers answer at `/api/…` and `/api/v1/…`. The department rules treat the second as the first (`ruledPath`), proven by the probe's section 2 and by `phase2-integrity`.

## 5. Weaknesses found, most serious first

| # | Weakness | Finding | Severity | State after Phase 2 |
|---|---|---|---|---|
| 1 | No branch boundary on the server: any staff login read and changed every branch | B-003 | P1 | VERIFIED FIXED for 15 record types. The rest is C-009 |
| 2 | A branch manager could create a super admin, or become one | C-001 | P1 | VERIFIED FIXED |
| 3 | Shop-floor records went wrong under simultaneous use: jobs stuck in process in 8 of 8 trials, cancelled jobs revived | C-005 | P1 | VERIFIED FIXED |
| 4 | 16 areas with no department rule | B-004 | P1 | VERIFIED FIXED: 319 changing routes, 0 with no rule or stated reason |
| 5 | Two stock lists and two order pipelines | B-009 | P1 | Decided; fenced; DEFERRED to Phase 3 with a handoff |
| 6 | 16 handlers saved in several steps with no transaction | B-010 | P2 | 10 corrected, 1 was never multi-step, 4 dispositioned (C-002, C-013 and two by design) |
| 7 | Handlers that passed the request body straight to the database | B-007 | P2 | VERIFIED FIXED |
| 8 | Seven create routes saved a record from nothing | B-008 | P2 | VERIFIED FIXED (5), by design (2) |
| 9 | Counter sale changed no stock | B-025 | P2 | VERIFIED FIXED on the server; receiving by the piece is C-011 |
| 10 | Plans filed under a branch that does not exist; work centers could not be created | C-003, C-004 | P2 | VERIFIED FIXED |
| 11 | Two real screens invented records when the server failed | C-007 | P2 | VERIFIED FIXED |
| 12 | No duplicate-request protection on order creation | C-006 | P2 | DEFERRED to Phase 3 (needs a table) |
| 13 | A void is claimed and credited in separate transactions | C-010 | P2 | DEFERRED to Phase 3 |
| 14 | Cockpit "accept" acts on text sent by the browser | C-013 | P2 | Limited to three roles; DEFERRED (needs the owner's scheduling rules) |
| 15 | Carrier partner routes cannot work and would bypass shipping rules | C-002 | P2 | DEFERRED to the integration phase; unreachable today |
| 16 | Rules inside handlers; large files; dead code | B-014, E-018, B-013 | P2, P3 | DEFERRED per module, with reasons |

## 6. Security weaknesses in the architecture

No confirmed critical vulnerability is left open. The two that could have been called critical in effect (anyone at any branch changing any branch; a branch manager becoming super admin) are fixed and tested. What remains is listed in `production-risk-register.md`: records with no branch column (C-009), the per-instance request limit (E-014), package upgrades that need approval (E-011: none critical, none on the production server path), and files served before the sign-in gate on a local server (B-021, not verified on the host).

## 7. Performance weaknesses in the architecture

Nothing was optimised and no cache was added, as instructed: no measurement at volume was taken in this phase. What the code shows:

- 76 list queries have no row limit in the handler (discovery; `pagingGuard` caps the ones that take `limit`).
- The branch boundary adds a filter to every query on a branch-owned table. For invoices, payments, order lines and shipment items the filter goes through the parent order, which is one more join per query. `Order.locationId` has an index (added with the column). The cost at 80 branches is NOT VERIFIED; it is in the Phase 3 handoff.
- Completing an operation takes two row locks (dispatch job, then job). Always in that order, so no deadlock between two completions; contention is per job, not global.
- The cockpit route loads far more than it shows (E-023).
- The slowest call in the whole gate run was 1.4 s (the equipment seed); the slowest ordinary call 0.3 s (sign-in, by design of the password hash).

## 8. What was deliberately not changed

- No new framework, no new service, no cache, no queue.
- No reply shape changed (E-021 stays; changing it would break screens).
- No working module rebuilt. The three routes that could never work answer plainly instead of being removed.
- No pricing, tax or credit rule changed.
- No manufacturing rule invented: what a completed work order consumes and produces (M-016), stock adjustment (I-016) and scheduling rules (C-013) stay with the owner.
