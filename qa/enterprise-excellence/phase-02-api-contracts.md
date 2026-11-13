# Phase 2: API contracts

What a caller of the server can rely on, what Phase 2 changed, and how each statement is checked. Written by hand on 2026-11-13; the counts come from the tools run in this session.

## 1. The contract every route follows

| Aspect | Contract | Checked by |
|---|---|---|
| Sign-in | Every route under `/api` except sign-in and health needs a valid token; otherwise 401 | Sweep: 611 routes, 0 answer without one; 5 forged and invalid sign-ins refused |
| Not allowed | 403 with `{ error: "<a sentence that says who may>" }` | Sweep "Staff roles and departments": 18 checks; probe: 540 calls; `phase2-integrity`: 10 |
| Not found, or not in your branch | 404. A record of another branch is indistinguishable from one that does not exist | `branch-boundary`: 37 checks |
| Bad or missing values | 400 with `{ error }` naming the field where the handler knows it | Sweep "Core write routes reject bad input cleanly": 38 bad requests, 0 not answered with a 4xx |
| Right record, wrong state | 409 with `{ error }` saying why (already shipped, already paid, changed by someone else) | Simulation races; `phase2-integrity` |
| Not available | 501 with `{ error }` (email and text receipts; three counter pricing questions) | Probe: counted separately from crashes |
| Server fault | 500 with a fixed sentence and `requestId`; never internal text | Sweep "Error replies do not expose internals": 0 exposed; probe: 275 changing routes sent an empty body, 0 server errors |
| Request id | Every reply carries a request id header; every server-error body repeats it | Sweep "Platform safeguards": 33 checks |
| List size | A list that takes `limit` is capped by `pagingGuard` | Same section |
| Who did it | Taken from the sign-in, never from the request body | `phase2-integrity`: counter session; Phase 1 sweep sections on history |

## 2. Known inconsistencies, kept on purpose

| Inconsistency | Why it stays | Finding |
|---|---|---|
| List replies come in two shapes: a bare list, or `{ data, meta }` | Changing a shape breaks the screens that read it. Phase 2 may not introduce an incompatible contract | E-021, deferred to Phase 9 with the screens |
| Success bodies: some routes wrap in `{ success, data }`, most return the record | Same | E-021 |
| Jobs and work centers answer at `/api/…` and `/api/v1/…` | Screens use both. The rules treat them as one (`ruledPath`); the probe proves it | B-001, fixed in Phase 1 |
| 76 list queries have no row limit in the handler | Paging changes the reply | B-012, E-008 |

## 3. Screen calls against server routes

`qa/tools/api-contract.mjs` reads every literal API path in the screens and looks for a matching route (`qa/api-contract.md`).

| | Count |
|---|---:|
| Distinct calls found in the screens | 283 |
| Matched to a server route | 203 |
| No route: the call would get a 404 | 80 |

All 80 are in screens labelled as samples or in files nothing imports (quality NCRs, fabrication work orders, logistics, pricing records and others). They are the build list for decision 4, not a regression: the number was 80 at the Phase 1 baseline and is 80 now. Calls built from a variable are not seen by this scan, so it is a floor, not a full contract test.

## 4. What Phase 2 changed in the contract

Nothing was removed and no existing success reply changed shape. Additions and new refusals:

| Route | Change | Kind |
|---|---|---|
| Every route that reads or changes a branch-owned record | A login held to its branches gets 404 for another branch's record, an empty or shorter list, and 403 when creating a record for a branch it is not in. All-branch roles see no change | New refusal (the purpose of B-003) |
| `POST /api/orders`, `PUT /api/orders/:id` | Accept and return `locationId` (the order's branch). Optional; defaults to the user's home branch | Additive |
| `GET /api/inventory/locations` | Returns the user's own branches by default; `?all=true` returns every branch (used by the transfer dialog) | **Behaviour change.** A caller that relied on getting every branch must add `?all=true`. One screen did; it was changed in the same commit |
| `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`, `POST /api/users/:id/reset-password` | 403 when the change is above the caller's own standing | New refusal (C-001) |
| `POST /api/jobs`, `/api/v1/jobs` | 400 when there is no order, order line, work center or instructions. `createdById` in the body is ignored | New refusal (B-008) |
| `POST /api/jobs/:id/plan` | 400 when no branch can be worked out. The plan's `locationId` is a real branch | Correction (C-003) |
| `POST` and `PATCH /api/jobs/:id/status` | 409 when the job changed between being read and being moved | New refusal (C-005) |
| `POST /api/v1/operations/:id/start`, `/complete` | 409 when the job is cancelled, completed or shipped. Completing an already complete operation returns 200 and changes nothing | New refusal; repeat-safe |
| `POST /api/v1/operations/:id/reassign` | An unknown operator or work center is refused before the clock is paused | Correction |
| `POST /api/work-centers`, `PATCH /api/work-centers/:id` (both addresses) | Create works (it answered 400 for every body before). Unknown fields are ignored; 409 on a duplicate code; 400 on an unknown branch | Correction (C-004) |
| `PATCH /api/assets/:id`, `PATCH /api/maintenance-orders/:id` | Only listed fields are saved; 400 when nothing listed was sent | New refusal (B-007) |
| `POST /api/v1/contacts`, `/api/v1/orders`, `/api/orders/intake` | 400 for a body with nothing in it | New refusal (B-008) |
| `POST /api/pos/sessions` | The session's user is the signed-in user; `userId` in the body is ignored | Correction |
| `POST /api/pos/quick-sale/process-payment` | 409 when the shelf is short. The reply may carry `stockNote`. A repeat of the same sale id, even at the same moment, is answered with the first sale and `duplicate: true` | Additive; new refusal (B-025) |
| `POST /api/pos/quick-sale/:saleId/void` | Also returns the pieces to the shelf | Additive |
| `POST /api/pos/pricing/margin/validate`, `/processing`, `/quantity-breaks` | 501 with a sentence (they answered 500 on every call) | Correction (B-006) |
| The sixteen areas in `phase-02-service-boundaries.md` | 403 for roles outside the owning department | New refusal (B-004) |

## 5. Contract tests that exist

There is no separate contract-test framework and none was added. The contract is tested by programs that call the running server and check both the reply and the database:

| Program | What it pins down |
|---|---|
| `qa/sim/security.mjs` (the sweep), 20 sections | Sign-in, customer isolation, roles, bad input, error bodies, prices, documents, history, money records |
| `qa/sim/baseline-probe.mjs`, 4 sections | Every changing route: view-only roles refused; an empty body never crashes |
| `qa/sim/branch-boundary.mjs`, 37 checks | The branch contract in section 4 |
| `qa/sim/phase2-integrity.mjs`, 80 checks | Every row of section 4 that is not about branches |
| `qa/sim/run.mjs`, 50 jobs per seed | The order-to-cash routes in sequence, with reconciliation |
| `qa/tools/api-contract.mjs` | Screen calls against routes |
| `qa/tools/access-coverage.mjs` | Every changing route has a department rule or a stated reason |

Not covered by any of them: the reply shape of most read routes (only status codes are checked by the sweep's 789 reads), the partner API's success paths, and webhooks.

## 6. Events and background processing

There is none to verify. The server has no queue, no scheduler and no event emitter (discovery: one timer, for the partner rate limit; one route that describes a schedule but does not run one). Partner webhook deliveries that fail are marked for retry and never retried (B-018, blocked on the owner's decision about a scheduled trigger, B-019). "Background job failure and retry" therefore cannot be tested and is recorded as not executed in `phase-02-regression-results.md`.
