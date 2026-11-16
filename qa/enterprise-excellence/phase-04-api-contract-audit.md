# Phase 4: API contract audit

Scope: the contracts between the screens and the server, between modules inside the server, and between the server and partner systems. Method: the route table (`qa/api-contract.md`, 618 routes), the screen-to-route check, a read of every handler changed in this phase, and the scenarios in `qa/sim/phase4-integration.mjs`, group "Internal API contracts and validation" (11 scenarios).

No contract was changed in a way that breaks a caller. Every change in this phase is additive or opt-in; the consumer analysis for each is in section 4.

## 1. What the contracts are today

| Subject | Staff and shop API (`/api/*`) | Partner API (`/api/v1/partner/*`) |
|---|---|---|
| List reply | Two shapes: a bare array (orders, stock, shipments, invoices and most others) or `{ data, meta }` (E-021) | Always `{ data, meta: { total, limit, offset, hasMore } }` |
| Paging | `limit` and `offset`; honoured on orders and stock since this phase, with `X-Total-Count`, `X-Limit`, `X-Offset` (H-010). Other bare lists return their fixed maximum (B-012) | `limit` (up to 100) and `offset` on every list |
| Refusal | A status and `{ error: "<sentence>" }`; a server error adds `requestId`. Some carry `code` (`STALE_EDIT`, `RULE_REFUSED`) | A status and `{ error: { code, message } }` |
| Statuses | 400 bad value, 401 not signed in, 403 not allowed or another branch, 404 not found, 409 conflict with the present state, 422 same request key with a different body, 429 too many requests, 5xx ours | The same, plus 501 for what is not built |
| Dates | ISO 8601 in UTC | The same |
| Money | Numbers with two decimals; stored as exact decimals | The same; a carrier sees no prices |
| Identifiers | UUID, plus a human number per document (`SO-…`, `SHP-…`, `INV-…`) | The same |
| Repeat safety | `Idempotency-Key` on any changing request | The same, scoped to the partner |
| Versions | `/api/…`; jobs and work centers also answer at `/api/v1/…` with the same rules (tested) | `/api/v1/partner/…` |

## 2. Contract tests

| Scenario | What it pins |
|---|---|
| every critical list answers in its documented shape, with the fields the screens read | Orders, stock, shipments, invoices, quotes, requests for quote, customers, jobs, work orders: shape and the fields each list screen reads |
| a bare-array list can be windowed without changing its body, and says how many there are | `limit`, `offset`, the three headers, and that a call with no parameters is unchanged |
| every kind of refusal has the same shape: a status and a plain sentence | 400, 401, 403, 404, 409 across modules; no internal text |
| a change the database itself refuses is answered 409 with a reason, not a server error | `RULE_REFUSED` (H-017) |
| an order with bad values is refused with a reason and nothing is saved | Wrong type, out of range, unknown reference, totals that do not add up |
| shipments, payments, stock corrections and transfers refuse bad values without a server error | A bad-value matrix on the four money and stock routes |
| an edit made from an old copy of an order is refused instead of overwriting | `expectedUpdatedAt` and 409 `STALE_EDIT` (G-020) |
| two edits of the same order at the same moment: one is saved, one is told to reload | The same, under a race |
| the two addresses for jobs and work centers give the same answer | `/api/jobs` against `/api/v1/jobs` (B-001) |
| the partner API keeps one shape for lists, one for errors | Every partner list and every partner refusal |
| fields a caller must not set are ignored or refused, never applied | Ids, numbers, totals, branch, status and audit fields sent by the caller |

The screen side is held by `qa/api-contract.md` (every call a screen makes is matched to a route in each gate run) and by the six browser suites.

## 3. Defects found and corrected

| Finding | Contract defect | Correction |
|---|---|---|
| H-001 | The partner API's documented routes answered 500 | Rewritten on the real schema |
| H-010 | `limit` and `offset` ignored; no total | Honoured; headers added |
| H-017 | A database refusal surfaced as 500 | 409 with a code and a sentence |
| H-005 | A provider's status and words passed through our API | Our own 502, 503, 504 |
| H-007 | Three different answers to a failed partner sign-in | One |
| H-018 | The heat trace lacked shipments and customers | Two lists added to the reply |
| G-020 | An edit could overwrite a newer one | Opt-in version check on orders |

## 4. Compatibility of each change

| Change | Who calls it | Why nothing breaks |
|---|---|---|
| `limit`, `offset` and headers on `GET /api/orders` and `GET /api/inventory` | Order and stock list screens, the simulation, partner routes (through their own queries) | A call without the parameters gets the same body as before. The screens already sent `limit`; it was ignored and is now honoured up to the same maximum. Browser suites pass unchanged |
| `view=summary` on `GET /api/orders` | Nobody yet | New parameter; any other value is refused with 400 |
| `expectedUpdatedAt` on `PUT /api/orders/:id` | Nobody yet | Optional; without it the route behaves as before |
| `invoiceWarning` in the dispatch reply | The shipment screen | A new field; the screen now shows it |
| `shipments` and `customers` in the heat trace | The traceability screen | New fields beside the old ones |
| 409 `RULE_REFUSED` where a route answered 500 | Any caller | A 500 was never a contract; callers treat 4xx as "fix and resend" |
| 502, 503, 504 from the speech and assistant routes | The assistant panel and read-aloud | The screens showed any failure as "not available"; they no longer see a 401 that signed the user out |
| Partner routes | No partner has ever been able to use them (they answered 500) | No working consumer existed. Field names follow the partner documentation where it existed |
| Second signature header on webhooks | Any receiver | The first header is unchanged |
| A dropped connection no longer releases a request key | Any caller that retries | The retry now gets the first answer instead of running twice |
| 60-second limit in the browser | Every screen | No server route under test takes more than 4 s; uploads and streams are excluded |

## 5. What is not done

| Subject | State | Finding |
|---|---|---|
| One list shape everywhere | Not done: it changes every screen | E-021, deferred to Phase 9 |
| Limits on the other bare lists | Not done | B-012 |
| Screens using the summary view and paging | Not done | G-014, deferred to Phase 5 |
| Version check on the other edit routes, and screens sending it | Not done | G-020, deferred to Phase 5 |
| A bad-value matrix on every changing route | Done for orders, shipments, payments, corrections, transfers and the partner routes; 214 changing routes still have no success-path test | B-016 |
| A written contract file (OpenAPI) | Does not exist. The contract is `qa/api-contract.md`, generated from the code, plus the tests above | Recorded here; no finding raised, since the generated table is checked on every run |
