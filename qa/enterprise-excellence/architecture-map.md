# Architecture map

Written by hand in Phase 1 from the code. Counts are in `system-inventory.md`.

## One picture

```
Browser (React 18, Material UI, Vite build, JavaScript and JSX)
  src/frontend/src
    router/AppRouter.jsx      one route table, 143 screens, each loaded on demand
    pages/, apps/, screens/   the screens
    components/               shared parts; layout/Sidebar.jsx is the menu
    api/, services/           one small file per server area; the token is added to every call
    config/roleAccess.js      which menu items and screens a role sees (the server decides access)
        |
        |  HTTPS, JSON, "Authorization: Bearer <token>"
        v
Vercel: one serverless function for all of /api (api/index.js, 30 s limit, 1 GB)
  src/backend/src/app.js      Express application
    requestLog   → request id, one log line per request
    helmet, CORS, body limits
    rate limits  → per address; sign-in has its own
    /api/health
    safeErrors   → no database detail in an error reply; caller mistakes are 4xx
    pagingGuard  → paging values must be whole numbers
    apiGate      → sign-in, customer limits, department write rules, leadership pages
    72 route files, 611 routes
        |                               |
        |  Prisma client                |  outbound, only when asked
        v                               v
PostgreSQL on Supabase            AI providers (Anthropic, OpenAI, DeepSeek), voice (ElevenLabs),
  157 tables                       partner webhooks
```

The static frontend and the function are served from the same domain. Everything that is not `/api/…` returns the frontend's `index.html`.

## Server layers

| Layer | Where | Notes |
|---|---|---|
| Entry | `api/index.js` (hosted), `src/backend/src/server.js` (local) | The hosted entry loads the app once per function instance and reports a start-up failure safely |
| Configuration | `src/config/index.js` | Reads the environment once. In production a missing or weak secret stops the start |
| Cross-cutting | `src/middleware/` (6 files) | Listed above, in order |
| Routes | `src/routes/` (72 files) | Most business logic is here, inside the handlers (B-014) |
| Rules | `src/lib/` (23 files) | Rules that were moved out of handlers so they can be unit tested: price, tax, credit, receiving, field rules, workflow moves, work order moves, quote and billing rules, numbering, job history, role access, and since Phase 2 the branch boundary (`branchScope.js`) and who may change a login (`userAdminRules.js`) |
| Services | `src/services/` (18 files) | Billing, web store, portal, drop tags, remnants, executive tools, AI providers, webhooks |
| Older counter engine | `src/workflows/pos/` (14 files) | A state machine and pricing calculator for the session counter flow |
| Intake pipeline | `src/pipeline/` | The order hub's staged pipeline with an AI decision step |
| Database client | `src/lib/db.js` | One shared client. It notes on the request when a query fails because of a value the caller sent. Since Phase 2 it also adds the branch filter to every query on a branch-owned table (`lib/branchScope.js`), so no handler has to |

There are three generations of route in the same server:

1. **Core records** under `/api/…` (orders, shipments, invoices, stock, jobs). Relational tables, rules in `lib/`, transactions, tests.
2. **`/api/v1/…` consoles** (dispatch, operations, analytics, second stock list, order hub, pipeline). Written as separate applications. Several keep whole records as JSON and have no rules in the database (B-009).
3. **Partner API** under `/api/v1/partner/…` with its own tokens and rate limits.

## Data

- One PostgreSQL database. Schema in `src/backend/prisma/schema.prisma` (5,218 lines), 22 migrations in `prisma/migrations`. An older set of three SQL files in `supabase/migrations` predates Prisma and is not used by the current process.
- The database enforces: primary and foreign keys (170), unique numbers, 9 value checks (stock never negative, stock balance, order and shipment quantities, invoice paid within total). Everything else is enforced in server code.
- Every foreign key has an index. No views, no triggers, no stored procedures.
- Numbers (orders, jobs, shipments, invoices) are made by `lib/numbering.js`, which is safe under simultaneous requests.
- Database changes reach the live database only through SQL Editor files that the owner applies (`prisma/upgrades/sql-editor/`).

## Identity and access

Described in `permissions-matrix.md`. A signed token (8 hours) names the user; the user and role are read from the database on every request, so disabling a user takes effect at once. Access is by role, department and, since Phase 2, branch: a staff login outside head-office roles sees and changes only records of its home branch and of branches assigned to it, enforced in the database client (B-003, verified fixed; `phase-02-service-boundaries.md` has the tables). Every changing route falls under a department rule or a stated reason (B-004, verified fixed). Not yet held to a branch: records with no branch column (C-009). There is no tenant boundary beyond the customer account (E-019).

## What happens without a person

Nothing. There is no scheduler, queue, worker, event bus, or email or text provider (B-019). The server acts only inside a request. The one in-process timer cleans up the partner rate-limit counters.

## Hosting and delivery

| Item | State |
|---|---|
| Host | Vercel: static frontend plus one function. Settings on the host are the owner's |
| Database | Supabase PostgreSQL |
| Files | On the hosted site, uploaded files are stored in the database because the function has no disk |
| Preview | Every push to a pull request gets a preview deployment |
| Checks on a pull request | Unit tests, screen audit, frontend lint. Not the simulation, sweep or browser suites (they need a database) |
| Environments | Production and previews. No staging environment with its own database (E-015) |
| Backups and restore | Whatever Supabase provides. No restore has been tested (E-015) |
| Monitoring | One structured log line per request with a request id. No alerting (E-017) |
| Rate limit | Counted per function instance, so the real limit on the host is higher than configured (E-014) |

## Outside services

| Service | Used for | Safeguards found |
|---|---|---|
| Anthropic, OpenAI, DeepSeek | Assistant, quote helper, email parsing in the order hub | Keys from the environment. Timeouts and failure handling were not examined |
| ElevenLabs | Text to speech | Not examined |
| Partner webhooks | Telling a partner about an event | Signed with a shared secret. A failed delivery is never retried (B-018) |
| Card processor, email, text | None | Not connected (D-033, D-034) |
| Carriers, accounting, EDI | None | Not built |

## Architectural weaknesses, in order of risk

Updated at the end of Phase 2 (2026-11-13). The full review is `phase-02-architecture-audit.md`.

1. Two stock lists and two order pipelines (B-009). Decided by the owner; fenced by department rules; connecting or retiring them is in the Phase 3 handoff.
2. No way to do anything on a schedule (B-019). The owner has deferred email and text; the scheduled trigger is undecided.
3. Records with no branch column are outside the branch boundary (C-009): quotes, requests for quotation, packages, drop tags, documents.
4. Business rules inside route handlers, where only a whole-server test can reach them (B-014). 72 route files against 23 rule files.
5. No duplicate-request protection on order creation (C-006); a void is not atomic end to end (C-010).
6. Two reply shapes across the API (E-021); 80 calls in the screens with no server route (D-020), all in sample modules.
7. Database-backed tests do not run on pull requests (B-016).
8. Five handlers still save in several steps (down from 16; each dispositioned in `phase-02-transaction-safety.md`).

Closed in Phase 2: no branch boundary (B-003); sixteen areas with no department rule (B-004); a branch manager able to become super admin (C-001); shop-floor records going wrong under simultaneous use (C-005).
