# Phase 4: integration inventory

Every link between this system and something outside it, and every link between its own modules that carries a business transaction. Found by reading the code: a search for outbound calls and provider libraries across `src/backend`, the route table, the screen-to-route contract check, and the schema. Nothing is listed as verified because a setting exists; "verified" means a test in this session exercised it.

Classification used: IMPLEMENTED AND VERIFIED, IMPLEMENTED BUT NOT VERIFIED, PARTIALLY IMPLEMENTED, DISCONNECTED, PLACEHOLDER OR MOCK, BROKEN, DEPRECATED, NOT APPLICABLE.

## Summary

| ID | Integration | Classification |
|---|---|---|
| INT-01 | Database (PostgreSQL on Supabase) | IMPLEMENTED AND VERIFIED (locally); the host connection is NOT VERIFIED |
| INT-02 | Document storage | IMPLEMENTED AND VERIFIED |
| INT-03 | AI assistant providers (DeepSeek, OpenAI, Anthropic) | IMPLEMENTED BUT NOT VERIFIED (real providers never called; failure handling verified against a stand-in) |
| INT-04 | Speech provider (ElevenLabs) | IMPLEMENTED BUT NOT VERIFIED (as INT-03) |
| INT-05 | Partner API, inbound (customers, carriers, suppliers) | PARTIALLY IMPLEMENTED: customer, carrier, purchase orders, webhooks and sign-in are IMPLEMENTED AND VERIFIED; supplier shipping notices, corrective actions, scorecard and document upload are PLACEHOLDER (501) |
| INT-06 | Partner webhooks, outbound | IMPLEMENTED AND VERIFIED |
| INT-07 | Scheduled run | IMPLEMENTED AND VERIFIED locally; NOT VERIFIED on the host (B-019, BLOCKED on the owner's settings) |
| INT-08 | Email | DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION) |
| INT-09 | Text messages | DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION) |
| INT-10 | Card payments | DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION) |
| INT-11 | Carrier rates, labels and tracking | DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION) |
| INT-12 | Sales tax service | DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION) |
| INT-13 | Accounting system | DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION) |
| INT-20 | Staff screens to the server API | IMPLEMENTED AND VERIFIED for the flows under test; 80 calls from labelled sample screens have no route (X-009) |
| INT-21 | Web shop to the server API | IMPLEMENTED AND VERIFIED |
| INT-22 | Orders to inventory (reservation) | IMPLEMENTED AND VERIFIED |
| INT-23 | Orders to work orders and jobs | IMPLEMENTED AND VERIFIED |
| INT-24 | Shipping to inventory, orders and billing (dispatch) | IMPLEMENTED AND VERIFIED |
| INT-25 | Billing to payments, credits and refunds | IMPLEMENTED AND VERIFIED |
| INT-26 | Receiving to inventory | IMPLEMENTED AND VERIFIED |
| INT-27 | Returns to inventory and credit | IMPLEMENTED AND VERIFIED |
| INT-28 | Counter sale to stock, billing and payment | IMPLEMENTED AND VERIFIED |
| INT-29 | Quotes to orders | IMPLEMENTED AND VERIFIED |
| INT-30 | Request keys | IMPLEMENTED AND VERIFIED |
| INT-31 | Second stock list and order hub | DISCONNECTED (B-009, P1, unchanged) |
| INT-32 | Sample screens calling routes that do not exist | PLACEHOLDER OR MOCK (X-009) |

Not present in this system, so not listed: message queues, a job runner, sockets or server push, serverless functions other than the server itself, payment or carrier webhooks coming in, single sign-on, any call to an ERP or accounting system. BROKEN at the start of the phase and now corrected: the partner API (INT-05) and webhook retries (INT-06).

## Dependency graph

```
Browser (staff) ──INT-20──┐
Browser (customer) ─INT-21─┤
Partner systems ───INT-05──┤
Host scheduler ────INT-07──┤
                           ▼
                    Server (Express)
   request keys (INT-30) ─ access rules ─ branch scope
                           │
   Quotes ─INT-29─▶ Orders ─INT-22─▶ Inventory ◀─INT-26─ Receiving
                      │  └─INT-23─▶ Work orders / jobs ─▶ Inventory
                      ▼
                  Shipping ─INT-24─▶ Inventory, Orders, Billing ─INT-25─▶ Payments, credits
                      │                      ▲
   Returns ─INT-27────┴──────────────────────┘        Counter sale ─INT-28─▶ stock, billing, payment
                           │
                           ▼
                  Database (INT-01)  ─ documents (INT-02) ─ event rows
                           │
        ┌──────────────────┼───────────────────┐
        ▼                  ▼                   ▼
  Partner addresses   AI providers        Speech provider
     (INT-06)           (INT-03)            (INT-04)

Not connected: email, text, cards, carriers, tax, accounting (INT-08 to INT-13)
```

Every arrow into the database is a transaction. Every arrow out of the server (the bottom row) goes through the outside-call guard and is never made while a transaction is open.

## Detail

### INT-01 Database (PostgreSQL on Supabase)

**Classification:** IMPLEMENTED AND VERIFIED (locally); the host connection is NOT VERIFIED

| Field | Value |
|---|---|
| Purpose | Every record of the business |
| Owning module | Platform (`src/backend/src/lib/db.js`) |
| Source | The server |
| Destination | PostgreSQL |
| Trigger | Every request |
| Request | SQL through the Prisma client; numbers bound for decimal columns sent as exact strings |
| Response | Rows; errors by code |
| Authentication | Connection string in `DATABASE_URL` (owner's host setting) |
| Authorization | Database role of the connection string; row-level security policies are added by the SQL Editor files |
| Tenant and location context | None in the connection. Branch and customer scope are applied by the server on every query (`lib/branchScope.js`) |
| Data ownership | The database is the single owner of all business data |
| Retry | None by the server. A failed query fails the request; the caller may retry with the same request key |
| Timeout | Client default; the pool size and pooler are the host's (G-015, not verifiable from here) |
| Idempotency | Unique rules, value checks and the request-key table make a repeated write safe |
| Failure handling | Unreachable: 503 from the health route and a plain 500 or 503 from others, with no connection detail (tested). A refusal by a rule: 409 `RULE_REFUSED` (H-017) |
| Monitoring | `/api/health`; the Integrations screen; request log |
| Existing tests | `qa/sim/phase4-integration.mjs` "with the database unreachable the server says so and gives nothing away"; Phase 3 scenarios (74) |
| Missing tests | A dropped connection in the middle of a transaction on the host; pool exhaustion with several instances |
| Impact if unavailable | Nothing works |

### INT-02 Document storage

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Mill certificates and other files |
| Owning module | Documents (`routes/documents.js`) |
| Source | Staff screens, customer account pages, partner API |
| Destination | Database table for file contents (`storagePath: database`); a disk folder on a disk host |
| Trigger | Upload or download |
| Request | Multipart upload; download by document id |
| Response | File bytes with type and name |
| Authentication | Staff or customer token; partner token for the partner download |
| Authorization | Owner of the document; a customer or partner sees only documents of its own organisation |
| Tenant and location context | Owner organisation on the document |
| Data ownership | Documents module |
| Retry | None |
| Timeout | The request's own limit (60 s in the browser) |
| Idempotency | An upload is a new document each time; no key |
| Failure handling | A failed upload saves nothing |
| Monitoring | Request log |
| Existing tests | Sweep "Documents" (11 checks); `qa/sim/phase4-integration.mjs` "one customer's system cannot read another customer's records" (includes a document) |
| Missing tests | Large files; an interrupted upload; the `/uploads` path on a disk host (B-021) |
| Impact if unavailable | Documents cannot be uploaded or opened; everything else works |

### INT-03 AI assistant providers (DeepSeek, OpenAI, Anthropic)

**Classification:** IMPLEMENTED BUT NOT VERIFIED (real providers never called; failure handling verified against a stand-in)

| Field | Value |
|---|---|
| Purpose | The assistant in the top bar, chat and the quote assistant |
| Owning module | AI assistant (`services/ai/AIProviderService.js`, `routes/ai.js`, `routes/aiAssistant.js`) |
| Source | The server |
| Destination | The provider's HTTPS API |
| Trigger | A user asks the assistant |
| Request | Chat messages; no customer record is sent unless the user's question includes it |
| Response | Text |
| Authentication | Provider key in an environment variable (never logged, never returned) |
| Authorization | Staff sign-in on our route |
| Tenant and location context | None sent to the provider |
| Data ownership | The provider owns nothing; answers are not stored as business data |
| Retry | Two tries at most, only on no answer, 408, 429 or 5xx, with a growing wait; the provider library's own retries are off |
| Timeout | `AI_TIMEOUT_MS`, default 25 s |
| Idempotency | A question may be asked twice; it changes no record |
| Failure handling | Our own 502, 503 or 504 with a sentence; never the provider's status or words; a breaker leaves a failing provider alone for 30 s |
| Monitoring | Counters per service on the Integrations screen (per instance); log lines without the key |
| Existing tests | `qa/sim/phase4-integration.mjs`: provider fails, hangs, wrong key, breaker opens and recovers; `test/outbound.test.js` |
| Missing tests | The real providers; what the assistant may read and say |
| Impact if unavailable | The assistant says it is not available. No order, stock or money function depends on it |

### INT-04 Speech provider (ElevenLabs)

**Classification:** IMPLEMENTED BUT NOT VERIFIED (as INT-03)

| Field | Value |
|---|---|
| Purpose | Read-aloud |
| Owning module | AI assistant (`routes/tts.js`) |
| Source | The server |
| Destination | The provider's HTTPS API |
| Trigger | A user presses read aloud |
| Request | Text and a voice id |
| Response | Audio stream |
| Authentication | Provider key in an environment variable. Before Phase 4 its first characters were logged; removed (H-005) |
| Authorization | Staff sign-in |
| Tenant and location context | None |
| Data ownership | None |
| Retry | None: speech is not repeated on its own |
| Timeout | `SPEECH_TIMEOUT_MS`, default 20 s |
| Idempotency | Not needed |
| Failure handling | Our own 502, 503 or 504. Before Phase 4 a provider 401 reached the browser and signed the user out (H-005) |
| Monitoring | As INT-03 |
| Existing tests | `qa/sim/phase4-integration.mjs`: "the speech provider answers", "hangs", "a provider that keeps failing is left alone for a while, then tried again" |
| Missing tests | The real provider |
| Impact if unavailable | Read-aloud does not play |

### INT-05 Partner API, inbound (customers, carriers, suppliers)

**Classification:** PARTIALLY IMPLEMENTED: customer, carrier, purchase orders, webhooks and sign-in are IMPLEMENTED AND VERIFIED; supplier shipping notices, corrective actions, scorecard and document upload are PLACEHOLDER (501)

| Field | Value |
|---|---|
| Purpose | A partner's own system reads its records and acts on them |
| Owning module | Partner API (`routes/partner/*`) |
| Source | A partner system |
| Destination | The server, through the same service functions staff routes use |
| Trigger | A partner call |
| Request | JSON; lists take `limit` and `offset` |
| Response | `{ data, meta }` for lists; `{ error: { code, message } }` for refusals |
| Authentication | Client id and secret exchanged for a one-hour token (HS256); the key behind a token is re-checked on every call |
| Authorization | Partner type (customer, carrier, supplier), scopes per key, and ownership of every record read or changed |
| Tenant and location context | The partner's organisation. A carrier sees shipments assigned to it; a customer its own orders, quotes and invoices; a supplier its own purchase orders |
| Data ownership | The service center owns the records. A partner can add a request for quote, answer a quote, acknowledge a purchase order and report on a shipment in transit; it cannot dispatch, price or bill |
| Retry | The partner retries; safe with `Idempotency-Key` |
| Timeout | Server default |
| Idempotency | `Idempotency-Key` honoured per partner (H-003); carrier reports are idempotent by state |
| Failure handling | 4xx with a code and a sentence; 429 with `Retry-After` at the rate limit; 501 for what is not built |
| Monitoring | Partner request log table; request log |
| Existing tests | `qa/sim/phase4-integration.mjs`: 20 scenarios touch it (isolation, scopes, revoked keys, rate limit, keys, duplicates) |
| Missing tests | A real partner system; the four supplier routes once built |
| Impact if unavailable | Partners cannot read or send. Staff screens are not affected |

### INT-06 Partner webhooks, outbound

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Tell a partner system that something happened |
| Owning module | Partner API (`services/webhookService.js`) |
| Source | The server |
| Destination | An https address the partner registered |
| Trigger | A business change: order confirmed or status changed, shipment dispatched, delivered or in exception, order delayed, invoice issued, request for quote received |
| Request | `{ id, type, created_at, data, partner_id }` |
| Response | Any 2xx is success |
| Authentication | HMAC-SHA256 of the body (`X-SteelWise-Signature`) and of time plus body (`X-SteelWise-Signature-Timestamp`), with the subscription's secret |
| Authorization | Only the organisations the fact concerns are told |
| Tenant and location context | The partner id is in the body; the event carries only that partner's data |
| Data ownership | The server owns the event row until delivered |
| Retry | After 1, 5, 30 and 120 minutes; five tries; then kept as failed. An administrator or the partner can replay. Events older than 72 hours are not sent on their own (H-016) |
| Timeout | `WEBHOOK_TIMEOUT_MS`, default 10 s |
| Idempotency | The event id is the same on every attempt (header and body); a unique rule stops a second recording (H-002) |
| Failure handling | A subscription is stopped after five failed events in a row and says why; redirects are refused; private addresses are refused in production (H-008) |
| Monitoring | Integrations screen: waiting, waiting over 15 minutes, failed, stopped; log lines `webhook_dead_letter`, `webhook_disabled`, `webhook_expired` |
| Existing tests | `qa/sim/phase4-integration.mjs`: group "Event processing and background jobs" (13) and five scenarios in "Webhooks and external service failures"; `test/webhookRules.test.js` |
| Missing tests | A real partner receiver |
| Impact if unavailable | Events wait in the database and are sent when delivery runs again. None is lost |

### INT-07 Scheduled run

**Classification:** IMPLEMENTED AND VERIFIED locally; NOT VERIFIED on the host (B-019, BLOCKED on the owner's settings)

| Field | Value |
|---|---|
| Purpose | Send waiting events and clear old request keys |
| Owning module | Integrations (`lib/integrationReport.js`, `routes/integrations.js`) |
| Source | The host's scheduler, or an administrator pressing "Run now" |
| Destination | `GET` or `POST /api/internal/tasks/run` |
| Trigger | Every 5 minutes (recommended) |
| Request | None |
| Response | What it did, in counts |
| Authentication | `Authorization: Bearer <CRON_SECRET>`; compared in constant time; 503 when no secret is set |
| Authorization | Administrators for "Run now" |
| Tenant and location context | None: it works across all branches |
| Data ownership | None |
| Retry | The next scheduled call |
| Timeout | 20 s budget for deliveries, then it stops claiming and reports what it left |
| Idempotency | Safe to call from several places at once: each event is claimed by one caller |
| Failure handling | An error is answered 500 with a request id; nothing is half done |
| Monitoring | The time and result of the last run are stored and shown on the Integrations screen |
| Existing tests | `qa/sim/phase4-integration.mjs`: "the scheduled run needs its secret, does the periodic work and records that it ran", "five delivery runs at the same moment send each event once" |
| Missing tests | The host schedule itself |
| Impact if unavailable | A failed event waits for "Run now"; old request keys are cleared on the next call instead |

### INT-08 Email

**Classification:** DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION)

| Field | Value |
|---|---|
| Purpose | Order, shipping and invoice messages; receipts |
| Owning module | None yet |
| Source | — |
| Destination | — |
| Trigger | — |
| Request | — |
| Response | — |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | — |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | Nothing is emailed. The counter-sale "email receipt" route answers 501 |
| Monitoring | The Integrations screen lists it as NOT CONNECTED |
| Existing tests | `qa/sim/phase4-integration.mjs` "services that are not connected say so instead of pretending" |
| Missing tests | Everything, once a provider is chosen: success, refusal, time limit, duplicate notification, reconciliation, all against a sandbox |
| Impact if unavailable | Nothing is emailed. The counter-sale "email receipt" route answers 501 |

### INT-09 Text messages

**Classification:** DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION)

| Field | Value |
|---|---|
| Purpose | Alerts and delivery notices |
| Owning module | None yet |
| Source | — |
| Destination | — |
| Trigger | — |
| Request | — |
| Response | — |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | — |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | No text is sent |
| Monitoring | The Integrations screen lists it as NOT CONNECTED |
| Existing tests | `qa/sim/phase4-integration.mjs` "services that are not connected say so instead of pretending" |
| Missing tests | Everything, once a provider is chosen: success, refusal, time limit, duplicate notification, reconciliation, all against a sandbox |
| Impact if unavailable | No text is sent |

### INT-10 Card payments

**Classification:** DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION)

| Field | Value |
|---|---|
| Purpose | Authorise and capture a card |
| Owning module | None yet |
| Source | — |
| Destination | — |
| Trigger | — |
| Request | — |
| Response | — |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | — |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | Staff record payments. A counter card sale needs the approval code from the terminal. Web checkout takes no payment (H-013) |
| Monitoring | The Integrations screen lists it as NOT CONNECTED |
| Existing tests | `qa/sim/phase4-integration.mjs` "services that are not connected say so instead of pretending" |
| Missing tests | Everything, once a provider is chosen: success, refusal, time limit, duplicate notification, reconciliation, all against a sandbox |
| Impact if unavailable | Staff record payments. A counter card sale needs the approval code from the terminal. Web checkout takes no payment (H-013) |

### INT-11 Carrier rates, labels and tracking

**Classification:** DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION)

| Field | Value |
|---|---|
| Purpose | Rate a shipment, print a label, follow tracking |
| Owning module | None yet |
| Source | — |
| Destination | — |
| Trigger | — |
| Request | — |
| Response | — |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | — |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | Carrier, rate and tracking are typed in by staff, or reported by a carrier through INT-05 |
| Monitoring | The Integrations screen lists it as NOT CONNECTED |
| Existing tests | `qa/sim/phase4-integration.mjs` "services that are not connected say so instead of pretending" |
| Missing tests | Everything, once a provider is chosen: success, refusal, time limit, duplicate notification, reconciliation, all against a sandbox |
| Impact if unavailable | Carrier, rate and tracking are typed in by staff, or reported by a carrier through INT-05 |

### INT-12 Sales tax service

**Classification:** DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION)

| Field | Value |
|---|---|
| Purpose | Tax by address |
| Owning module | None yet |
| Source | — |
| Destination | — |
| Trigger | — |
| Request | — |
| Response | — |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | — |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | Tax comes from the rates kept in this system |
| Monitoring | The Integrations screen lists it as NOT CONNECTED |
| Existing tests | `qa/sim/phase4-integration.mjs` "services that are not connected say so instead of pretending" |
| Missing tests | Everything, once a provider is chosen: success, refusal, time limit, duplicate notification, reconciliation, all against a sandbox |
| Impact if unavailable | Tax comes from the rates kept in this system |

### INT-13 Accounting system

**Classification:** DISCONNECTED (no code calls such a service; H-015, REQUIRES BUSINESS DECISION)

| Field | Value |
|---|---|
| Purpose | Post invoices and payments |
| Owning module | None yet |
| Source | — |
| Destination | — |
| Trigger | — |
| Request | — |
| Response | — |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | — |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | Invoices and payments stay in this system |
| Monitoring | The Integrations screen lists it as NOT CONNECTED |
| Existing tests | `qa/sim/phase4-integration.mjs` "services that are not connected say so instead of pretending" |
| Missing tests | Everything, once a provider is chosen: success, refusal, time limit, duplicate notification, reconciliation, all against a sandbox |
| Impact if unavailable | Invoices and payments stay in this system |

### INT-20 Staff screens to the server API

**Classification:** IMPLEMENTED AND VERIFIED for the flows under test; 80 calls from labelled sample screens have no route (X-009)

| Field | Value |
|---|---|
| Purpose | Everything staff do |
| Owning module | Screens (`src/frontend/src/api/client.js`, `authFetch.js`) |
| Source | Browser |
| Destination | `/api/*` |
| Trigger | A person |
| Request | JSON |
| Response | JSON; lists are a bare array or `{ data, meta }` (E-021) |
| Authentication | Bearer token from sign-in |
| Authorization | Role, department and branch on the server |
| Tenant and location context | The server takes the branch from the signed-in user, never from the screen |
| Data ownership | The server |
| Retry | None automatic. The person presses again; the same request key is sent |
| Timeout | 60 s in the browser (new in Phase 4) |
| Idempotency | `Idempotency-Key` on every request that creates a document and on PUT steps that must not run twice (H-009) |
| Failure handling | A sentence on the screen for refusal, time limit and lost connection; 401 returns the user to sign-in; a late answer for an old filter is dropped (Shipping) |
| Monitoring | Request log with a request id |
| Existing tests | Six browser suites (160 checks); `qa/sim/ui-integration.cjs` (33 checks: the ten cases of section 7) |
| Missing tests | Late-answer handling on other list screens |
| Impact if unavailable | Staff cannot work |

### INT-21 Web shop to the server API

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | A customer browses, prices and places an order |
| Owning module | Web store (`routes/ecom.js`, `services/ecomService.js`) |
| Source | Browser (customer login) |
| Destination | `/api/ecom/*` |
| Trigger | A customer |
| Request | JSON |
| Response | JSON |
| Authentication | Customer token |
| Authorization | Held to the store routes; a customer sees its own organisation and division only |
| Tenant and location context | Customer organisation and division from the token |
| Data ownership | Orders module owns the order created |
| Retry | As INT-20 |
| Timeout | 60 s |
| Idempotency | `Idempotency-Key` on checkout |
| Failure handling | As INT-20. The price is the system's, never the browser's (sweep) |
| Monitoring | Request log |
| Existing tests | `ui-shop` (30 checks); sweep "Web checkout uses the system price" |
| Missing tests | Payment, once decided (H-013) |
| Impact if unavailable | Customers cannot order online |

### INT-22 Orders to inventory (reservation)

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Hold stock for an order line |
| Owning module | Orders (`routes/orders.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Reserving or cancelling |
| Request | `POST /api/orders/:id/allocate` |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | A row lock on the stock balance; cancellation gives the stock back in the same transaction |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | Phase 3 scenarios "Reservations" (9); `qa/sim/phase4-integration.mjs` "cancelling an order gives its stock back" |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-23 Orders to work orders and jobs

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Cut or process material for a line |
| Owning module | Work orders (`routes/workOrders.js`), jobs |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Completing a work order |
| Request | Work order completion |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | One transaction: output and scrap off the source, pieces created with the source heat, the line's reservation carried to the pieces |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | Phase 3 "Work orders, scrap and remnants" (11); `qa/sim/phase4-integration.mjs` "a work order feeds an order line, and the pieces ship under the same order" |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-24 Shipping to inventory, orders and billing (dispatch)

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | A truck leaves |
| Owning module | Shipping (`routes/shipments.js`), billing (`services/billing.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Dispatch |
| Request | `PUT /api/shipments/:id/dispatch` |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | Stock, order and shipment move in one transaction with the events about them. The invoice is raised in a second step; if it fails the dispatch stands and the gap is reported (H-006) |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | `qa/sim/phase4-integration.mjs` "a dispatch and everything that follows from it are saved together or not at all", "shipping succeeds and billing fails"; `qa/sim/ui-integration.cjs` |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-25 Billing to payments, credits and refunds

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Money against an invoice |
| Owning module | Invoices (`routes/invoices.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Taking a payment |
| Request | `POST /api/invoices/:id/payments` and others |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | One transaction per payment under a row lock; the database checks that paid equals the payments |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | Phase 3 "Orders, invoicing and financial records" (10); `qa/sim/phase4-integration.mjs` "ten copies of one payment at the same moment record one payment" |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-26 Receiving to inventory

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Material arrives |
| Owning module | Receiving (`lib/receiving.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | A receipt |
| Request | `POST /api/inventory/receipts` |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | One transaction: item, balance and movement |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | Phase 3 "Inventory receiving" (10); `qa/sim/phase4-integration.mjs` "receiving, transfers, credits and work order completion are each done once when sent twice" |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-27 Returns to inventory and credit

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Material comes back |
| Owning module | Returns (`routes/returns.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Receiving a return |
| Request | `POST /api/returns/:id/receive` |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | One transaction: stock back and one credit memo |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | Phase 3 concurrency; simulation |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-28 Counter sale to stock, billing and payment

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | A sale at the counter |
| Owning module | Counter quick sale (`routes/quickSale.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Taking payment |
| Request | `POST /api/pos/quick-sale/process-payment` |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | One transaction: order, stock movement, invoice and payment |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | `qa/sim/phase4-integration.mjs` "a counter sale reaches stock, billing and payment in one step, and a repeat is the same sale" |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-29 Quotes to orders

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | A quote is accepted |
| Owning module | Quotes (`routes/quotes.js`) |
| Source | The owning route |
| Destination | Function calls inside the server and one database transaction |
| Trigger | Acceptance by the sales desk or the customer's system |
| Request | `POST /api/quotes/:id/accept` and the partner route |
| Response | The changed records |
| Authentication | The caller's sign-in |
| Authorization | Role, department and branch rules of the route |
| Tenant and location context | Branch of the record; refused for another branch |
| Data ownership | Each module writes only its own tables through the shared transaction |
| Retry | None: it commits or it does not |
| Timeout | The request's |
| Idempotency | Request key on the route; conditional updates make a second run a refusal (409) |
| Failure handling | One function for both callers; a conditional update lets one acceptance win |
| Monitoring | Audit log entry with the person; request log |
| Existing tests | `qa/sim/phase4-integration.mjs` "a quote accepted by the customer and the sales desk at the same moment makes one order", "request for quote to payment" |
| Missing tests | None known for the path under test |
| Impact if unavailable | The step is refused; nothing is half saved |

### INT-30 Request keys

**Classification:** IMPLEMENTED AND VERIFIED

| Field | Value |
|---|---|
| Purpose | Run a request once however often it is sent |
| Owning module | Platform (`middleware/requestKeys.js`) |
| Source | Any caller that sends `Idempotency-Key` |
| Destination | Table `RequestKey` |
| Trigger | Every changing request that carries the header |
| Request | Header value; the request body is hashed |
| Response | The first answer, replayed, marked `Idempotent-Replayed: true` |
| Authentication | The caller's own |
| Authorization | Scope: the user or the partner, plus the route |
| Tenant and location context | Per caller |
| Data ownership | Platform |
| Retry | The caller's retry is the point |
| Timeout | A claim whose server died is taken over after 60 s |
| Idempotency | — |
| Failure handling | Same key with a different body: 422. In flight: 409. Stored answers are cleared after 24 hours by the scheduled run |
| Monitoring | Integrations screen: "requests never answered" |
| Existing tests | `qa/sim/phase4-integration.mjs` group "Idempotency, retries and concurrency" (10); `test/requestKeys.test.js` |
| Missing tests | Web checkout and order intake under this suite (covered by Phase 3 for order creation) |
| Impact if unavailable | Retries would create duplicates |

### INT-31 Second stock list and order hub

**Classification:** DISCONNECTED (B-009, P1, unchanged)

| Field | Value |
|---|---|
| Purpose | An older copy of stock and orders kept in JSON stores |
| Owning module | Unit tracking, order hub |
| Source | Their own screens |
| Destination | JSON stores, not the real tables |
| Trigger | A person |
| Request | — |
| Response | — |
| Authentication | Staff sign-in |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | Conflicts with the real tables |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | — |
| Monitoring | None |
| Existing tests | None |
| Missing tests | A reconciliation against the real tables |
| Impact if unavailable | Two answers to "what is in stock"; needs a read-only export of the live stores before it can be migrated |

### INT-32 Sample screens calling routes that do not exist

**Classification:** PLACEHOLDER OR MOCK (X-009)

| Field | Value |
|---|---|
| Purpose | Screens labelled as samples |
| Owning module | Various |
| Source | Browser |
| Destination | No route |
| Trigger | A person opens the screen |
| Request | — |
| Response | 404 |
| Authentication | — |
| Authorization | — |
| Tenant and location context | — |
| Data ownership | None |
| Retry | — |
| Timeout | — |
| Idempotency | — |
| Failure handling | The screen says it is a sample |
| Monitoring | `qa/api-contract.md` counts them in every gate run |
| Existing tests | Contract check |
| Missing tests | None until built |
| Impact if unavailable | None: nothing depends on them |

