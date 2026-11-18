# Phase 10 of 12: final execution report

Enterprise security, financial integrity, zero-trust authorization, multi-tenant isolation, reliability, observability, disaster recovery and deployment hardening.

Date: 2026-11-18. Branch `claude/project-thread-25z3jd`, started from `main` at `60ce6d2` (pull request 33, merged). Not merged. Phase 10 changes the database: SQL Editor file 17, with a rollback file. Everything below was run in this session on a local machine against local databases whose names contain `qa`, with synthetic data, one server process, and a local stub in place of every outside service. Nothing was run against the live database or the host. No secret was rotated, no alert was sent to a real channel, nothing was restored over any database in use, and nothing was sent to any accounting product.

## FINAL STATUS

**IMPLEMENTED — VERIFICATION INCOMPLETE.**

The engineering is done and verified on QA: 23 Phase 10 findings, 21 VERIFIED FIXED and 2 FIXED — NOT VERIFIED; 277 of 277 Phase 10 scenarios pass with every category at or above its minimum; every fix has a check that fails without it (30 of 30 removals caught); the full regression of Phases 2 to 9.5 passes on the finished code.

It is not VERIFIED COMPLETE because four completion criteria depend on the live system, which only the owner can change:

| Criterion | Why it is not verified on live | What closes it |
|---|---|---|
| 8. Database access controls; 14. ledger immutability | On QA the server runs as the least-privilege role and cannot alter the books. The live server still connects as the database owner, which can (Y-008, W-014) | The owner applies file 17 and points `DATABASE_URL` at `steelwise_runtime` |
| 23. Critical alerting | Alerts are raised and delivered to a QA stub. No live receiver is set (E-017) | The owner sets `ALERT_WEBHOOK_URL` and the scheduled run |
| 26. Isolated restore of the live backups | A real backup and restore was proven on QA (W-020). The host's own backups have never been restored (E-015) | The owner restores one host backup into a new project once |
| 28. Rollback on the host | Database rollback (file 17) tested twice on a copy; code rollback is a Vercel promote, not exercised here | The owner promotes a previous deployment once |

No confirmed P0 or P1 Phase 10 defect is open. The seven P1 findings (Y-001, Y-002, Y-004, Y-005, Y-011, Y-013 VERIFIED FIXED; Y-008 FIXED — NOT VERIFIED) are each closed in code and tested; Y-008 needs the owner's switch on live to take effect.

## SECURITY

### Findings and corrections

| Finding | Sev | What was wrong (measured) | Correction | Status |
|---|---|---|---|---|
| Y-001 | P1 | A token kept working for its whole life after a password change, a reset, switching the login off and sign-out | Session mark per user (`tokensValidAfter`, file 17) carried in the token; refused once it moves | VERIFIED FIXED |
| Y-002 | P1 | 30 wrong passwords from 30 addresses for one login were all just 401 | Per-login pause after 10 wrong passwords, taken by a conditional update so a race cannot pass it | VERIFIED FIXED |
| Y-003 | P2 | Unknown address answered in 4 ms, a real one in 91 ms | Unknown addresses compared against a hash nobody has; one sentence for every refusal | VERIFIED FIXED |
| Y-004 | P1 | An upload's entity type `../../../` wrote outside the uploads folder | Folder name restricted to letters and underscores | VERIFIED FIXED |
| Y-005 | P1 | A stored `.html` file was served by its address with no sign-in | Static `/uploads` removed; stored name takes the accepted type's extension (closes B-021) | VERIFIED FIXED |
| Y-006 | P2 | A Windows program declared as PDF was accepted | File signature checked against the declared type | VERIFIED FIXED |
| Y-007 | P2 | Token verification did not name the algorithm | HS256 pinned | VERIFIED FIXED |
| Y-008 | P1 | The application connects as the database owner, which can switch off the journal guards, set `session_replication_role`, change history | Role `steelwise_runtime` (file 17) with only the rights the application uses; every QA suite runs the server as it | FIXED — NOT VERIFIED (live needs the switch) |
| Y-009 | P2 | The connection could create and drop objects in `public` | Runtime role has no CREATE and owns nothing | FIXED — NOT VERIFIED (same) |
| Y-010 | P2 | Nothing raised an alert for any failure | Ten system checks, eleven alert kinds with severities, administrator checks page, liveness and readiness | VERIFIED FIXED |
| Y-011 | P1 | Two places changed history rows (override revoke; duplicate counter sale) | Both now add a line; history is append-only for the application | VERIFIED FIXED |
| Y-012 | P3 | A Phase 9.5 scenario depended on an earlier one | Self-contained | VERIFIED FIXED |
| Y-013 | P1 | `POST /api/auth/register` skipped the Users rules: organization from the body, customer roles in staff organizations, roles above one's own | Follows `createUser` | VERIFIED FIXED |
| Y-014 | P2 | Public readiness ran whole-table checks on every call | Answer kept for 30 s | VERIFIED FIXED |
| Y-015 | P3 | Guard fields shown in the user list to colleagues | Stripped for others | VERIFIED FIXED |
| Y-016 | P2 | Documents ignored the branch boundary | Each document route checks the linked record through the branch-scoped client | VERIFIED FIXED |
| Y-017 | P3 | "Revoked by" on a partner key came from a request header | From the signed-in user | VERIFIED FIXED |
| Y-018 | P3 | A signed token with no user id caused a 500 | Refused 401 | VERIFIED FIXED |
| Y-019 | P2 | Partner administration reads were open to any staff login | Administrator only | VERIFIED FIXED |
| Y-020 | P2 | Twenty payments at once on one invoice: some answered 500 after every retry | Money changes on one invoice take turns in the process, 12 attempts, an overlap left answers 409 BUSY | VERIFIED FIXED |
| Y-021 | P2 | A server killed between dispatch and billing left 9 shipments dispatched and not invoiced, with nothing to say so | Check "shipped goods invoiced", alert SHIPPED_NOT_INVOICED, list on the integrations page | VERIFIED FIXED |
| Y-022 | P2 | The finished code on a database without file 17 answered every sign-in with a bare 500 | 503 DATABASE_UPDATE_REQUIRED naming update 17; health keeps answering | VERIFIED FIXED |
| Y-023 | P3 | An address whose % signs do not decode answered 500 and was logged as a fault (found in the gate's list of server errors) | Answered 400 BAD_ADDRESS with the request id; body-too-large and bad JSON keep their answers | VERIFIED FIXED |

Earlier findings closed or noted: W-019 and W-020 VERIFIED FIXED; B-021 VERIFIED FIXED (Y-005); W-014 and E-015 FIXED — NOT VERIFIED; W-015, E-011, E-014, E-017, E-019, C-009, V-028 and B-019 carry Phase 10 notes (`phase-10-dispositions.json`). No finding was removed.

### Authorization results

`phase-10-rbac-audit.md`. Every route has a rule at the access gate (0 without one, `qa/results/access-coverage.json`); group 1 (36 scenarios) covers sessions, lockout, role downgrade, stale-role tokens, administrator limits and the finance-only ledger routes. The sweep (`qa/sim/security.mjs`) refuses every route without a token and every staff route to a customer.

### Tenant isolation results

`phase-10-tenant-isolation.md`. Group 2 (31 scenarios): customer accounts, divisions, branches, partners, documents and the assistant. A finding was made and fixed (Y-016). Not covered: a table-by-table audit of every query (E-019) and the dispatch board lists (V-028), both handed on.

## FINANCIAL INTEGRITY

All on the QA ledger, started with a synthetic approval; the live ledger stays off until the accountant approves (W-001).

- **Journal immutability** (`phase-10-ledger-security.md`): for the application's role the database refuses update, delete and insert on posted lines, truncation, switching off triggers and `session_replication_role` (group 3 and 4; mutations Y-008 and Y-011 by taking a grant back). A table owner can still do all of it, which is why the role switch matters (R-76).
- **Posting integrity** (`phase-10-financial-posting-integrity.md`): an unbalanced entry, a single line, a closed month and a second posting of one business event are each refused by the database; group 4 (41 scenarios).
- **Reversals**: a reversal balances and links both ways; a second reversal is refused; an entry made from a business record cannot be reversed by hand; two reversals of one entry at the same moment end in one (group 4 and 7); only finance roles may reverse.
- **Accounts receivable reconciliation** (`phase-10-financial-reconciliation.md`): after invoice, payment, refund, credit, cancel, counter sale and a credit larger than owed, the books agree customer by customer (group 5, 30 scenarios). An invoice changed outside the product shows as a difference and raises an alert; nothing posts an entry to hide it.
- **Inventory valuation reconciliation**: after receipt, shipment, transfer, adjustment, cost change, scrap and a work order, item by item, at three far branches (group 5). Stock changed outside the product is named as a difference.

In the full gate, the suite now starts by having the CFO post, through the product, the receipts with no purchase order that Phase 9.5 deliberately leaves held; an item with no cost stays held by name. The first gate run had failed group 5 and 7 because their starting state carried those held receipts (`phase-10-regression-results.md`).

## RELIABILITY

- **Transaction recovery** (`phase-10-transaction-recovery.md`): kill -9 during twenty dispatches leaves no half-saved dispatch; the gap to billing is now listed and alerted (Y-021). SIGTERM during payments, lock waits and a dropped database connection recover; a refused request saves nothing.
- **Concurrency** (group 7, 26 scenarios): races on payments, credits, refunds, cancels, dispatch, numbering, reversal, posting and stock removal each end in one consistent state; twenty payments of 5.00 at once are all taken (Y-020).
- **Queue recovery** (`phase-10-event-queue-reliability.md`): ledger events that fail are held with a reason and found again by "record what is missing"; partner deliveries retry, then dead-letter and alert; a replay sends each once.
- **Integration recovery** (group 6, 26 scenarios): an undeliverable partner event is retried, then kept as failed and alerted; two scheduled runs at once send nothing twice; an alert channel that is down does not affect the work that raised the alert; an AI service that fails or hangs gets a plain refusal within its time limit; revoked keys stop at once; signatures, issuer, scopes and the per-partner rate limit are enforced. Every outside service is a stub.

80-location load: the Phase 9.5 load run (80 branches, 16 requests in flight) ran in the same gate after Phase 10 on the finished code with the server as the least-privilege role: 16 of 16 checks, 1,120 entries from business events in 30.9 s and 2,000 manual entries in 16.1 s, reconciliation clean. Failure injection at that scale is Phase 11.

## OBSERVABILITY

- **Logging** (`phase-10-observability.md`): a request id on every answer (a malformed one is replaced); errors logged without internals; no secret in the logs checked.
- **Metrics**: the checks page and readiness give counts per check; no time-series store exists (the host's console only).
- **Alerts** (`phase-10-alerting.md`): eleven kinds with severities, each raised once per condition, sent to `ALERT_WEBHOOK_URL` when set, and recorded in the audit trail. Proven against the stub (group 9, 21 scenarios). No live receiver (E-017).
- **Audit trails**: sign-in, password changes, lockouts, journal reads (W-019), ledger and administrative changes; the application's role cannot change or delete history.

## DISASTER RECOVERY

- **Backup coverage** (`phase-10-backup-review.md`): the live database is backed up by the host on its plan; frequency and retention are not on record. Uploaded files on a disk host are not in a database backup.
- **Actual restore results** (`phase-10-restore-test.md`, `qa/results/phase10-restore.json`): `pg_dump` of the QA database (2.5 MB, 0.3 s) restored into a separate PostgreSQL 16 server (1.8 s, 0 errors). Journal totals, entries, invoices, stock, history, users and migrations identical; the four guards and the numbering sequence present; a QA server on the restore signs in and reconciles with no difference (group 8, 26 scenarios).
- **Recovery time**: measured on QA only (seconds). Proposed objectives for live are in `phase-10-disaster-recovery.md` and **are not approved**.
- **Recovery limitations**: the host's backups were never restored (E-015); point-in-time recovery depends on the plan; a host loss is not exercised.

## DEPLOYMENT

- **CI/CD** (`phase-10-deployment-safety.md`): CI runs backend tests, frontend checks, `npm audit` at the critical level and the secret scan; the build runs no migration; the health check names the deployed commit.
- **Migration safety**: every migration builds from an empty database and matches the schema; file 17 made by the project's tool, run twice on a copy with the second run changing nothing, `verify-6-to-17.sql` all APPLIED/OK on the copy.
- **Rollback results**: file 17's rollback run twice on a copy, then 17 reapplied, schema clean. Code ahead of the database now says which update is missing (Y-022). Code rollback by promoting on Vercel NOT VERIFIED.

## VERIFICATION

Figures from the full run are in `phase-10-regression-results.md`.

| | Count |
|---|---|
| Tests executed | Phase 10: 277 scenarios (889 checks), 30 removal checks, 12 security unit tests; the full gate of every earlier phase (below) |
| Tests passed | Phase 10: 277 of 277 in the final run; 30 of 30 removals caught; unit 245 of 245 |
| Tests failed | 0 in the final runs. Earlier runs in this phase failed and are kept: gate run 1 Phase 10 239 of 277, gate run 2 275 of 277, gate run 3 276 of 277; each cause is in `phase-10-regression-results.md` (test set-up twice, a wrong expectation once, and one product fault, Y-023) |
| Tests blocked | 0 (nothing was skipped; what could not be run is listed as NOT VERIFIED, not as a test) |
| Regression | Full gate on the finished code: Phases 2 to 9.5 all pass (Phase 3 74, Phase 4 66, Phase 5 76, Phase 6 106, Phase 7 141, Phase 8 155, Phase 9 browser 232, Phase 9.5 ledger 158 and browser 13, earlier browser suites 286 checks), unit 245 of 245, 80-branch load 16 of 16, lint 0 errors, build made |

### The Phase 10 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Authentication and authorization | PASS on QA | Group 1; Y-001, Y-002, Y-003, Y-007, Y-013, Y-018, Y-019 fixed with removal checks; every route has a rule |
| B. Tenant and location isolation | PASS on QA | Group 2; Y-016 fixed. Limits: E-019, V-028 |
| C. Application and API security | PASS | Group 3; Y-004, Y-005, Y-006 fixed; 0 critical dependency advisories in production |
| D. Financial ledger integrity | PASS on QA; CONDITIONAL on live | Group 4; immutability holds for the application's role; live until the role switch (Y-008) |
| E. Financial reconciliation | PASS on QA | Group 5, every scenario reconciles item by item and customer by customer |
| F. Transactional reliability | PASS on QA | Group 7; Y-020, Y-021 fixed. One server process |
| G. Observability | PASS on QA; CONDITIONAL on live | Group 9; checks and alerts proven against the stub; no live receiver (E-017) |
| H. Backup and recovery | PASS for the isolated restore; NOT VERIFIED for the host | Group 8; `phase10-restore.json`; E-015 |
| I. Deployment safety | PASS for CI, build and database update; NOT VERIFIED for host promote | Group 8; file 17 and its rollback on a copy; Y-022 |
| J. Enterprise regression | PASS on QA: 277 of 277 (250 required), every earlier phase passes, no open confirmed P0 or P1 in code (Y-008 waits on the owner's switch on live) | Full gate on the finished code |

### The directive's gates A to J

| Gate | Result |
|---|---|
| A. Scope understood | PASS: baseline and threat model written before changes |
| B. Requirements met | PARTIAL: engineering requirements met on QA; four criteria need the owner on live |
| C. Defects reproduced before correction | PASS: each Y finding was measured failing first; the measurement is in its record |
| D. Corrections minimal and in place | PASS: no module rebuilt, no TypeScript, no new dependency, no constraint weakened, no control switched off |
| E. Automated checks fail without the fix | PASS: 30 of 30 |
| F. Regression | PASS: full gate on the finished code; Phase 10 in gate order 277 of 277 |
| G. Performance | PASS at the size measured; readiness cached (Y-014); one process (W-022) |
| H. Security | PASS on QA; CONDITIONAL on live (Y-008, E-017) |
| I. Documentation | PASS: the 24 Phase 10 documents and the shared registers |
| J. Readiness | **Code: CONDITIONAL. Live security posture: CONDITIONAL until file 17 and the role switch** |

Scores are in `phase-10-quality-scorecard.md`.

### Completion criteria (prompt section 44)

| # | Criterion | Result |
|---|---|---|
| 1 | Security and infrastructure inventories | Done: `phase-10-security-baseline.md` |
| 2 | Threat model | Done: `phase-10-threat-model.md` |
| 3 | Authentication | Verified on QA (group 1) |
| 4 | Backend RBAC | Verified (group 1, access coverage, sweep) |
| 5 | Tenant and location isolation | Passes (group 2); limits E-019, V-028 |
| 6 | Session and token security | Verified (Y-001, Y-007, Y-018) |
| 7 | API security | Pass (group 3, sweep) |
| 8 | Database access controls | Verified on QA; **not on live until the role switch** |
| 9 | Sensitive data protections | Assessed (`phase-10-secrets-review.md`, Y-015) |
| 10 | Secrets handling | Verified (secret scan, responses, logs) |
| 11 | File access controls | Verified (Y-004, Y-005, Y-006, Y-016) |
| 12 | Integration and webhook security | Verified against stubs (group 6) |
| 13 | Critical dependency risks | Addressed: 0 critical in production dependencies |
| 14 | Ledger immutability | Verified for the application's role; **live needs the switch** |
| 15 | Journal balancing | Verified (group 4) |
| 16 | Posting authorization | Verified (group 4) |
| 17 | Financial idempotency | Verified (group 4 and 7) |
| 18 | Inventory-to-ledger reconciliation | Passes (group 5) |
| 19 | Receivables reconciliation | Passes (group 5) |
| 20 | Transactional recovery | Verified (group 7) |
| 21 | Background job recovery | Verified (group 6 and 9; Y-010) |
| 22 | Health checks and observability | Verified (group 9) |
| 23 | Critical alerting | Verified against the stub; **no live receiver** |
| 24 | Audit trails | Verified (group 9; Y-011, W-019) |
| 25 | Backup coverage documented | Done: `phase-10-backup-review.md` |
| 26 | Isolated restore | Passes on QA; **host backups NOT VERIFIED** |
| 27 | DR procedures | Documented; objectives proposed, not approved |
| 28 | Deployment and rollback tested | Database: yes. **Host promote NOT VERIFIED** |
| 29 | Infrastructure risks addressed | Listed with owners in `production-risk-register.md` (R-76 to R-78) |
| 30 | Incident runbooks | Prepared: `phase-10-incident-runbooks.md` |
| 31 | 250 scenarios pass | Met: 277 of 277, every category at or above its minimum |
| 32 | Regression passes | Met: full gate on the finished code |
| 33 | No open confirmed P0/P1 | Met in code; Y-008 waits on the owner's switch |
| 34 | Every finding dispositioned | Done: Y-001 to Y-023 and the earlier findings touched |
| 35 | Phase 11 handoff | Below |

## PRODUCTION READINESS

**Merging and deploying the code: CONDITIONAL.** Order matters:

1. Apply `17-20261118090000_security_hardening.sql` in the SQL editor, then `verify-6-to-17.sql`; every row OK or APPLIED. File 17 is safe with the earlier code.
2. Then merge and deploy. If the code arrives first, nobody can sign in (Y-022: the answer says so); applying file 17 or promoting the previous deployment fixes it.
3. When the owner chooses: give `steelwise_runtime` a password in the SQL editor, put it in `DATABASE_URL` (pooler user `steelwise_runtime.<project ref>`), keep `DIRECT_URL`, redeploy. Until then Y-008 and W-014 stay open on live.
4. Set `ALERT_WEBHOOK_URL` and confirm the scheduled run.
5. Restore one host backup into a new project and compare (E-015).

Risks R-76 to R-78 are in `production-risk-register.md`.

## PHASE 11 HANDOFF

Phase 11 (80-location stress, cross-module concurrency, ledger load, failure injection, reconciliation, performance certification) has not been started.

| Subject | What Phase 11 must do | Finding |
|---|---|---|
| Security findings to carry | Repeat the Phase 10 groups under load; the per-address limit counts per server instance; check lockout and session marks with several processes | E-014, Y-001, Y-002 |
| Performance bottlenecks | Dispatch is the slowest save (about 1 s median under the 9.5 load); readiness is cached 30 s; reconciliation reads at most 5,000 differing items | W-022, W-023, Y-014 |
| Concurrency risks | Money changes and invoice numbering take turns inside one process only; across processes only the serializable retry guards them (12 attempts, then 409 BUSY) | W-022, Y-020 |
| Financial posting limitations | Receipts with no purchase order and items with no cost are held by name and need a person; labor and freight cost are not posted | W-006, W-007, W-012 |
| Ledger reconciliation requirements | A clean reconciliation after every stage of the load, item by item and customer by customer, with the server as `steelwise_runtime` | |
| Queue capacity | Partner deliveries and the scheduled run were tested at QA volume; measure backlog and catch-up after an outage at 80 branches | B-019 |
| Database contention | Lock waits and serialization retries per save type at 80 branches; the counter row behind invoice numbers | W-022 |
| Recovery limitations | Kill -9 and SIGTERM proven with one process and twenty requests; repeat with several processes and at volume; shipped-not-invoiced catch-up time | Y-021 |
| Required load-testing environment | A database separate from live (a Supabase branch or a restored copy), several server processes behind one address, the runtime role, the alert stub, synthetic data at 80 branches. Never the live database | |

## Continuation point

- Branch `claude/project-thread-25z3jd`; pull request @@PR@@. Not merged; the owner says when.
- Database: file 17 is not applied to live. The owner applies it before the merge.
- Phase 11 has not been started.
