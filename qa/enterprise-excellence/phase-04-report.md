# Phase 4 of 12: final execution report

**Enterprise API contracts, cross-module integration, event reliability, external services, webhooks, error recovery and distributed transaction hardening**

Date: 2026-11-13. Branch `claude/project-thread-25z3jd`, on top of the Phase 3 work at `dffa7d2`. Pull request 31 carries Phases 3 and 4; it is not merged.

All testing ran on local databases: `steelwise_qa` for function and `steelwise_qa_scale3` (85 branches) for volume. This environment has no connection to the live database or the host. No real payment, shipment, customer message or provider call was made: every outside address in the test server points at a stand-in started by the tests, with keys that are not real. A statement here that a test passed means it was run in this session.

## FINAL STATUS

**PARTIALLY COMPLETE**

Reasons, stated exactly:

1. **Most outside services the phase asks to verify are not connected**, so their scenarios could not be executed: card payments, carrier rating and labels, email, text messages, tax and accounting (H-015), and payment at web checkout (H-013). They were inventoried and classified, not simulated as if they existed. Gate D is PARTIAL for this reason.
2. **The scheduled trigger is not set on the host** (B-019, BLOCKED). The scheduled work exists and is tested locally. Setting the secret and the schedule is the owner's host setting.
3. **Nothing was verified on the host**: real providers, several server instances, function time limits, the live database.
4. **No alert reaches anyone** (E-017, the owner's choice of service). An Integrations screen now shows every integration failure; it has to be opened.
5. **Some corrections cover the path under test, not every screen or route**: the late-answer guard is on the Shipping screens; the version check on edits is on the orders API and no screen sends it (G-020); list paging is on orders and stock, and no screen uses the summary view yet (G-014).
6. Carried from Phase 3, unchanged: backup and restore not verified (E-015); the second stock list and order hub (B-009).

Every confirmed P0 or P1 integration defect found in this phase is VERIFIED FIXED with an automated check that fails without the fix. Six P1 defects were found and fixed (H-001 to H-006). Nineteen findings were recorded; all are dispositioned.

---

## INTEGRATION DISCOVERY

| Item | Result |
|---|---|
| Method | Read of the code: every outbound call and provider library in `src/backend`; the route table (618 routes); the screen-to-route contract check; the schema |
| APIs examined | 618 routes; 323 change something. Contract scenarios on orders, stock, shipments, invoices, quotes, requests for quote, customers, jobs, work orders, users and the whole partner API |
| Integrations discovered | 26, each with 20 fields, in `phase-04-integration-inventory.md`: 7 that exist to the outside (database, documents, AI providers, speech, partner API in, partner events out, scheduled run), 6 not connected (email, text, cards, carriers, tax, accounting), 2 screen-to-server, 8 between modules, request keys, 1 disconnected (second stock list and order hub), 1 placeholder (sample screens) |
| Webhooks examined | Outbound: the partner event service, rewritten. Inbound: none exist |
| Event producers | Order confirmation and status change, dispatch, delivery, exception, carrier delay report, invoice creation, request for quote from a partner |
| Event consumers | Partner systems, through subscriptions. Nothing inside the server consumes events: modules call each other inside one transaction |
| Background jobs examined | None existed. One scheduled task was added: send waiting events and clear old request keys |
| Realtime | None exists (no socket, stream or polling). NOT APPLICABLE |
| Phase 1 to 3 handoff | 20 items reviewed; disposition of each below |

### Disposition of the Phase 3 handoff

| # | Subject | Disposition |
|---|---|---|
| 1 | Inconsistent reply shapes (E-021) | Shapes pinned by contract tests; paging added without changing a body. One shape everywhere stays deferred to Phase 9 |
| 2 | Replies larger than needed (G-014, E-023) | API done: order summary 40.6 KB against 95.9 KB. Screens deferred to Phase 5. E-023 unchanged |
| 3 | Lists with no limit (B-012) | Orders and stock done (H-010); the rest stays deferred |
| 4 | Missing request validation (B-016) | Bad-value matrices on orders, shipments, payments, corrections, transfers and partner routes. 214 changing routes still without a success-path test |
| 5 | Lost updates on edit (G-020) | Orders API done, opt-in. Other routes and all screens deferred to Phase 5 |
| 6 | Idempotency gaps (C-006) | Exercised on 20 operations; two defects in the mechanism fixed (H-003, H-004) |
| 7 | Partner API: carriers (C-002) | VERIFIED FIXED |
| 8 | Partner API: customers, suppliers, sign-in | VERIFIED FIXED (H-001, H-007) except four supplier functions, which answer 501 (H-014) |
| 9 | Webhook retries (B-018) | VERIFIED FIXED (H-002) |
| 10 | No scheduler (B-019) | Built and tested; BLOCKED on the owner's host settings |
| 11 | Time limits and retries to outside services | VERIFIED FIXED (H-005) |
| 12 | External service dependencies | Inventoried; H-015 REQUIRES BUSINESS DECISION |
| 13 | Screen calls with no route (X-009) | Unchanged; the check stays in the gates |
| 14 | Two addresses for one resource (B-001) | Held identical by a contract test |
| 15 | Missing observability (E-017) | Integration report and screen added; alerting still a decision |
| 16 | Request limits per instance (E-014) | Unchanged; H-012 added; Phase 10 |
| 17 | Uploads before the sign-in gate (B-021) | Not touched; NOT VERIFIED on the host; stays where assigned |
| 18 | Cross-module inconsistencies (B-009, C-012, C-013) | Unchanged. C-012 now targeted at Phase 5 |
| 19 | Forward trace of a heat | VERIFIED FIXED (H-018) |
| 20 | Error contract on database refusals | VERIFIED FIXED (H-017) |

Earlier fixes were checked to be intact by the full regression run: nothing regressed.

---

## DEFECTS AND CORRECTIONS

### Findings of this phase

| ID | Severity | Finding | Status |
|---|---|---|---|
| H-001 | P1 | The partner API answered 500 on nearly every route and would have bypassed staff rules | VERIFIED FIXED |
| H-002 | P1 | Partner events were lost on any failure; staff actions raised none | VERIFIED FIXED |
| H-003 | P1 | One partner could be answered with another partner's stored reply | VERIFIED FIXED |
| H-004 | P1 | A dropped connection led to a duplicate order on retry | VERIFIED FIXED |
| H-005 | P1 | Outside calls had no time limit; a provider fault signed users out; part of a key was logged | VERIFIED FIXED |
| H-006 | P1 | A shipment could leave with no invoice and no word about it | VERIFIED FIXED |
| H-007 | P2 | Partner sign-in disclosed key state; a revoked key's token lived on | VERIFIED FIXED |
| H-008 | P2 | Events could be sent to internal addresses, followed redirects and could be replayed | VERIFIED FIXED |
| H-009 | P2 | Screens waited for ever, showed "Network Error", let a late answer replace a newer one | VERIFIED FIXED |
| H-010 | P2 | Order and stock lists ignored `limit` and gave no total | VERIFIED FIXED |
| H-011 | P3 | An order with no lines is accepted | REQUIRES BUSINESS DECISION |
| H-012 | P2 | Limits and the breaker count per server instance | DEFERRED TO SPECIFIC PHASE (10) |
| H-013 | P2 | Web checkout collects a payment method and takes no payment | REQUIRES BUSINESS DECISION |
| H-014 | P2 | Four supplier partner functions are not built | DEFERRED TO SPECIFIC PHASE (purchasing and supplier quality); they now answer 501 |
| H-015 | P2 | Email, text, cards, carriers, tax and accounting are not connected | REQUIRES BUSINESS DECISION |
| H-016 | P2 | Old waiting events would all be sent when delivery resumed | VERIFIED FIXED |
| H-017 | P3 | A database refusal surfaced as a server error | VERIFIED FIXED |
| H-018 | P2 | The heat trace did not show where a heat went | VERIFIED FIXED |
| H-019 | P2 | After a burst most events waited for the scheduled run | VERIFIED FIXED |

Totals: P0 0; P1 6, all fixed; P2 11, 7 fixed; P3 2, 1 fixed. Fourteen VERIFIED FIXED, two DEFERRED TO SPECIFIC PHASE with all seven fields recorded, three REQUIRES BUSINESS DECISION. From earlier phases: C-002 and B-018 are now VERIFIED FIXED; B-019 moved from a decision to BLOCKED on a host setting.

| Subject | What was done |
|---|---|
| API contracts improved | Paging with totals on orders and stock; an order summary view; a version check on order edits; a warning in the dispatch reply; shipments and customers in the heat trace; 409 with a code for database refusals; one list shape and one error shape across the partner API; our own 502, 503 and 504 for provider failures |
| Reliability safeguards added | An outbox on the existing delivery table with claim, backoff, dead letter, replay, stale limit and a unique rule; one guard for every outside call (time limit, bounded tries, breaker); request keys that survive a dropped connection and are scoped per caller; request keys on PUT steps; a 60-second limit and plain messages in the browser; a scheduled task; an integration report |
| Security issues corrected | Cross-partner reply disclosure; partner sign-in disclosure and late revocation; token algorithm pinned; webhook address rules, no redirects, timed signature; provider words and part of a key no longer in replies or logs |
| Not introduced | No message broker, no job framework, no new service. One migration (a unique index and an index), non-destructive |

---

## FAILURE RECOVERY

| Scenario kind | Result |
|---|---|
| Time limit | Browser 60 s; AI 25 s; speech 20 s; partner address 10 s. Each tested: the caller gets a plain answer and the system stays usable |
| Retry | AI: one repeat on a passing failure. Partner events: 1, 5, 30, 120 minutes, five tries, then failed. No retry of a 4xx. No unbounded loop |
| Duplicate event | Recorded once per subscriber (unique rule); the same id on every attempt; five overlapping runs send once |
| Duplicate request | A lost answer, a dropped connection, a double click, ten simultaneous payments, two dispatches, two acceptances, a carrier's repeated report: one effect each |
| Provider outage | Breaker opens after five failures and tries again after 30 s; the user sees a sentence and stays signed in |
| Partner outage | Events wait; a subscription that keeps failing is stopped with the reason; replay by an administrator or the partner |
| Database outage | 503 from the health route, no detail in any reply |
| Partial failure | Dispatch without an invoice is said on screen, audited, logged and listed until closed |
| Server stops mid-work | A claimed event is picked up after two minutes; a claimed request key after one |

Full table with detection, automatic and manual recovery, replay, reconciliation and duplicate prevention per integration: `phase-04-failure-recovery.md`.

---

## TESTING

| Item | Count |
|---|---|
| Test files added | 7: `qa/sim/phase4-integration.mjs`, `qa/sim/phase4-lib.mjs`, `qa/sim/ui-integration.cjs`, `qa/perf/phase4-load.mjs`, `test/outbound.test.js`, `test/webhookRules.test.js`, `test/listing.test.js` (and one test added to `test/safeErrors.test.js`) |
| Integration scenarios | 66 run, 66 pass, 554 checks, in six groups of at least ten |
| Browser checks, integration | 33 run, 33 pass (7 fail without the fixes) |
| Unit tests | 144 run, 144 pass (18 new) |
| Regression | Every earlier suite unchanged: simulation 150 of 150; sweep 20 of 20; branch boundary 37; Phase 2 integrity 80; Phase 3 scenarios 74 of 74; five browser suites 127 checks; baseline probe; lint; build |
| Failed | 0 in the final run |
| Blocked or not executed | Payment, carrier, email, text, tax and accounting scenarios (not connected); real providers; anything on the host; realtime (does not exist) |

Both new suites run in `qa/tools/run-gates.sh`. Detail: `phase-04-regression-results.md`.

---

## PERFORMANCE

Measured on the 85-branch copy, one local server process; workload assumptions are stated in `phase-04-performance-results.md` and are not production figures.

| Measure | Result |
|---|---|
| Error rate | 0 failed requests in every burst |
| Branch login, 80 list loads at once | p95 0.3 to 0.5 s |
| All-branch login, 80 order lists at once | p95 1.3 to 1.6 s (36 ms alone) |
| Order list size, 50 orders | 95.9 KB in full, 40.6 KB as a summary |
| Partner API, 80 at once | p95 0.2 to 0.8 s |
| 80 orders confirmed at once | p95 431 ms with a subscribed partner, 312 ms without |
| Events after that burst | 80 of 80 delivered 0.6 s later |
| Backlog of 500 events | Cleared in 1.0 s (489 a second); 36 a second when the partner takes 200 ms |
| Bottlenecks corrected | The order summary counted the lines of every order (60 ms, now 32 ms); a burst left most events waiting (20.8 s and a scheduled run, now 0.6 s); deliveries went one at a time (5 a second with a slow partner, now 36) |

---

## PRODUCTION READINESS

**Not ready for production across branches.** Phase 4 removes six P1 integration defects; what remains is settings, decisions and functions that do not exist.

| Blocker | Who |
|---|---|
| SQL Editor files 6, 7, 8, 9 and 10 applied in order before pull request 31 is merged | Owner |
| `CRON_SECRET` and a 5-minute schedule for `/api/internal/tasks/run` on the host (B-019) | Owner |
| Backup confirmed and a restore tested (E-015) | Owner: later |
| The second stock list and order hub (B-009) | Needs a read-only export of the live stores |
| Host connection settings (G-015) | Owner |

| Unverified integration | Why |
|---|---|
| Real AI and speech providers | Only a stand-in was called |
| The host: schedule, instances, time limits | No access |
| A real partner system | None exists yet |
| Card, carrier, email, text, tax, accounting | Not connected |

Deferred findings of this phase: H-012 (Phase 10), H-014 (purchasing and supplier quality). Each carries its reason, target phase, dependencies, correction, acceptance criteria and verification in `findings-register.md`.

### Questions for the owner

1. **An order with no lines** (H-011): refuse it, or keep it as a draft to fill in later?
2. **Web shop checkout** (H-013): do customers pay by card at checkout, or only on account? Today the choice is a note and no payment is taken.
3. **Outside services** (H-015): which of email, text messages, a card processor, a carrier service, a tax service and an accounting system do you want, with which providers, and in what order?

### What the owner does next

1. Apply files 6 to 10 from `/mnt/project-files/database-updates/`, in order, and keep any notices.
2. Say when to merge pull request 31.
3. On the host, set `CRON_SECRET` to a long random value and add a schedule that calls `/api/internal/tasks/run` every 5 minutes with `Authorization: Bearer <CRON_SECRET>`.
4. After deployment, open Admin > Integrations and read "Shipped but not invoiced" and "Needs action".

---

## COMPLETION CONDITIONS

| # | Condition | Met | Basis |
|---|---|:-:|---|
| 1 | Critical APIs inventoried | Yes | `api-inventory.md`, `phase-04-api-contract-audit.md` |
| 2 | Dependencies mapped | Yes | `phase-04-integration-inventory.md`, `module-dependency-map.md` |
| 3 | Phase 1 to 3 integration findings reviewed | Yes | The 20-item table above; `phase-04-dispositions.json` |
| 4 | Critical contract defects corrected | Yes | H-001, H-010, H-017 and the table above |
| 5 | Cross-module communication verified | Yes | 10 scenarios; B-009 remains from Phase 3 |
| 6 | Event reliability tested | Yes, locally | 13 scenarios; the host schedule is not set |
| 7 | Duplicate protection verified | Yes | 10 scenarios; `phase-04-idempotency-review.md` |
| 8 | Retry and time limit verified | Yes | Scenarios and `test/outbound.test.js` |
| 9 | Webhook security verified | Yes, outbound; inbound NOT APPLICABLE | `phase-04-webhook-security.md` |
| 10 | External failure recovery tested | Partly | For what exists, against stand-ins; not for unconnected services |
| 11 | Tenant and location isolation tests pass | Yes | Partner isolation, branch paths, the sweep and the branch boundary suite |
| 12 | Observability established or limits documented | Yes, with limits | `phase-04-observability.md`; no alerting (E-017) |
| 13 | At least 60 scenarios pass | Yes | 66 of 66 |
| 14 | Regression passes | Yes | Full gate run, exit 0 |
| 15 | No unresolved confirmed P0 or P1 integration defect | Yes for defects found in this phase. B-019 (P1, BLOCKED on a host setting) and E-014 (P1, Phase 10) are integration-related and open | Findings register |
| 16 | All findings dispositioned | Yes | 19 of 19 |
| 17 | Artifacts updated | Yes | Twelve Phase 4 files; six shared files |
| 18 | Phase 5 handoff complete | Yes | Below |

Conditions 10 and 15 are why the status is PARTIALLY COMPLETE and not VERIFIED COMPLETE.

---

## PHASE 5 HANDOFF

**Phase 5 of 12: customer lifecycle, sales operations, CRM, quoting, order intake, POS, ecommerce and customer portal excellence.** Not started.

| # | Subject | Modules and endpoints | Findings | Depends on | Tests required |
|---|---|---|---|---|---|
| 1 | **Customer data inconsistencies** | Customers (`routes/customers.js`); "Default Discount %" is saved and applied nowhere; orders and staff with no branch | S-020, U-012, G-018 | The owner's rule for the discount; the branch backfill | The discount either changes a price in every channel or the field is gone; no order without a branch |
| 2 | **CRM integration weaknesses** | No CRM connection exists; contacts and preferences live on the customer record; Mobile Rep screens are samples | X-009, U-008 | Decision 4 (build everything) | Each rep screen reads real records or is labelled |
| 3 | **Quote-to-order defects** | `routes/rfqs.js`, `routes/quotes.js` (`createRfq`, `acceptQuote`, `rejectQuote`, now shared with the partner API); a second RFQ console in the Order Hub; quote lines priced by hand | S-021, U-002, S-027, B-009 | The owner's rule for pricing a quote line | Request to quote to order with the customer's price on every line; one console |
| 4 | **Pricing contract inconsistencies** | 13 screen calls to `/api/pricing/*` routes that do not exist; one price per customer across channels is verified (47 checks) | S-026 | None | Each call has a route or is removed; the price sweep stays green |
| 5 | **POS workflow issues** | Counter quick sale (`routes/quickSale.js`) is verified; the older POS session flow (`workflows/pos/*`, 36 changing routes, 5 with a success test) is called by no screen and saves no tax; will-call screens use sample orders; a voided counter sale leaves the order COMPLETE; shelf items cannot be received by the piece | S-022, X-008, G-009, C-011 | Decide whether the session flow is kept | One counter flow; void and refund reconcile to stock, invoice and payment |
| 6 | **Ecommerce synchronization issues** | `routes/ecom.js`, `services/ecomService.js`: the tax shown differs from the tax on the accepted order; promise dates, cut-offs and branch suggestions are invented in the browser; stock shown against stock at checkout was not audited | F-008, S-010, X-007, U-041 | The owner's tax rule and promise rule | Tax shown equals tax charged; a promise date comes from the server or is not shown; stock checked at checkout |
| 7 | **Customer portal weaknesses** | Customer account pages (1 changing route, no success-path test); the customer partner API now works and is the model for the portal's reads | B-016 | None | A customer sees only its own orders, invoices, shipments and documents in the portal, as proven for the partner API |
| 8 | **Payment integration risks** | Web checkout takes no payment; no card processor; card sales at the counter rest on a typed approval code | H-013, H-015, D-033 | The owner's answer to question 2 and 3 | Per the answer; for a processor: approved, declined, time limit, duplicate notification, refund, reconciliation, all in a sandbox |
| 9 | **Duplicate order risks** | Request keys cover order creation, checkout, intake, quote acceptance and counter sale. Partners are not required to send a key. An order with no lines is accepted | H-011, C-006 | The owner's answer to question 1 | The same checkout, intake and quote acceptance sent twice from each screen: one order |
| 10 | **Missing customer notifications** | Nothing is emailed or texted; partner events exist for a customer's own system | D-034, H-015 | Provider choice (decision 5: later) | Each message is sent once per event, through the outside-call guard, with a record of what was sent |
| 11 | **Sales workflow inefficiencies** | Order lists load every line (use `view=summary` and paging); order edits can overwrite each other (send `expectedUpdatedAt`); two entry screens list four branches in code; intake reads the seller from a fixed code | G-014, G-020, S-008, U-011, C-012 | H-010 (done) | Order list under 50 KB a page; two editors: one saved, one told; branch list from the server |

What Phase 4 leaves ready for Phase 5: the functions `createRfq`, `acceptQuote` and `rejectQuote` are single entry points for staff and partners; `GET /api/orders?view=summary` and `expectedUpdatedAt` exist and are tested; events `order.confirmed` and `order.status_changed` are raised; the outside-call guard is there for any provider; `qa/sim/phase4-lib.mjs` has building blocks for orders, reservations, shipments and partner accounts.

Phase 5 should start by reading `phase-04-external-integrations.md` sections 3 and 4, `phase-04-idempotency-review.md` section 3 and `qa/api-contract.md`.

**Phase 5 has not been started.**
