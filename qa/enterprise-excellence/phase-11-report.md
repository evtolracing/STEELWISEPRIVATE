# Phase 11 report: 80-location enterprise stress simulation

Date: 2026-11-18. Everything here was measured in this session on one local machine (4 processors, 15.7 GB), against local PostgreSQL 16 databases whose names contain `qa`, with synthetic data only, three server copies connected as the least-privilege role `steelwise_runtime` behind one front door, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## FINAL STATUS

**IMPLEMENTED — VERIFICATION INCOMPLETE**

The work was done and measured: five cycles, each with 545 customer jobs and more than 5,000 transactions on three server copies; 320 of 320 scenarios; fourteen findings, every P1 among them fixed and proven by removal; the books reconcile to the cent in every final cycle and after a day of injected failures.

It is not VERIFIED COMPLETE because completion criterion 28 cannot be met: **no performance threshold is approved**, and against the proposed ones the dispatch misses its limit when 32 or more customer jobs are in flight at once (Z-006, a business decision), and counter sale paid is at P95 817 ms against 800 ms and return received and credited is at P95 816 ms against 800 ms over the day. Other things could not be verified on one local machine with stand-ins: server copies on separate machines, a year of data, real outside services, a real AI model, the live host. Enterprise readiness is **not declared**.

Directive readiness decision: **CONDITIONAL**.

What the owner has to do is in "What is needed from the owner" below.

## ENTERPRISE SIMULATION

- **Locations represented**: 80 branches in 16 states (8 large, 20 medium, 24 small, 12 warehouse, 10 sales, 6 outlet).
- **Users simulated**: 750 employee logins in 19 roles and 68 customer logins; 818 sign-ins at the start of each day.
- **Workload assumptions**: one working day per cycle, run at 8, 16, 32 and 48 customer jobs in flight. Every volume is an assumption written in `phase-11-enterprise-model.md` and `phase-11-workload-profile.md`; none is a real figure of the business.
- **Completed transactions** (required 2,000): cycle 1: 5,185; cycle 2: 5,187; cycle 3: 5,185; cycle 4: 5,185; cycle 5: 5,191. Final cycle: 5,191 attempted, 5,191 completed, 0 failed, 0 retried, 0 recovered, 5,191 reconciled.
- **Completed customer jobs** (required 500): cycle 1: 545 traced of 545; cycle 2: 545 traced of 545; cycle 3: 545 traced of 545; cycle 4: 545 traced of 545; cycle 5: 545 traced of 545. By kind in the final cycle: A Stock sale 185/185; B Processed-material sale 115/115; C Ecommerce order 55/55; D Counter (POS) sale 70/70; E Partial shipment 60/60; F Return and credit 60/60.

## OPERATIONAL RESULTS

| Area | Final cycle | Scenarios | Result |
|---|---|---|---|
| Sales | 650 completed, 0 failed | group 1 | PASS |
| Purchasing | 834 completed, 0 failed | group 1 | PASS |
| Inventory | 460 reservations and issues, 200 transfers, returns and adjustments; every stock check at zero | groups 1, 4, 7 | PASS |
| Manufacturing | 615 completed, 0 failed | group 2 (records only; no physical machine was tested) | PASS |
| Shipping | 960 completed, 0 failed; dispatch P95 4,617 ms | group 3 | PASS for correctness; slower than proposed at peak (Z-006) |
| Finance | 1,080 invoices, payments and credits; 212 ledger operations; 0 failed | group 4 | PASS |
| Reporting | Finance and executive reads P95 under 97 ms while the day ran | group 8 | PASS |
| Ecommerce, POS and portal | 180 completed, 0 failed | groups 1 and 6 | PASS |

## FINANCIAL RESULTS

All on the QA ledger with test accounts and a test approval. Nothing was posted to real books.

- **Journal posting integrity**: 2,687 entries posted in the final day; posted entries that do not balance: 0; business records with two postings of one kind: 0; ledger events failed or waiting: 0.
- **Ledger reconciliation**: trial balance debits 12074697.59, credits 12074697.59; the product's reconciliation is clean in every final cycle and after the failure day (cycle 4: clean).
- **Accounts receivable**: books 80357.51, records 80357.51, difference 0.00; also customer by customer in group 4.
- **Inventory valuation**: books 8653337.35, records 8653337.35, difference 0.00.
- **Gross margin reporting**: revenue (969882.84) and cost of goods post from the same shipments and both reconcile. A margin report compared line by line with the records: NOT VERIFIED.
- **Branch consolidation**: revenue by branch and by customer add to the same total; eighty branches post at once and the books balance.
- **Accounting export**: GENERIC file export only. Every batch holds exactly the entries it counts, no entry in two batches, a rejected batch withdrawn and made again, also with a server copy killed mid-export. No real accounting system received anything: NOT VERIFIED.
- **No approved rule exists** for freight income, carrier freight cost, labor or work in progress; the product posts none of them. Accountant, Phase 12.
- No discrepancy was forced to zero. The two differences met on the way are described in `phase-11-financial-reconciliation.md`.

## PERFORMANCE

Thresholds: **PROPOSED, PENDING OWNER APPROVAL**.

- **Throughput**: 80.7 requests a second over the day, up to 132.2 at the best level; 8,063 requests; peak 50 in flight.
- **Latency of all requests by level**: 8 in flight: P50 39 ms, P95 262 ms, P99 525 ms; 16 in flight: P50 48 ms, P95 706 ms, P99 1,621 ms; 32 in flight: P50 58 ms, P95 1,457 ms, P99 3,888 ms; 48 in flight: P50 52 ms, P95 3,299 ms, P99 4,714 ms.
- **Dispatch with its invoice**: P50 1,424 ms, P95 4,617 ms, P99 5,214 ms over the day (baseline P95 7,250 ms); by level 8: P95 696 ms, 16: P95 1,865 ms, 32: P95 4,617 ms, 48: P95 5,175 ms. Proposed limit 2,000 ms at P95.
- **Slower than proposed**: counter sale paid (P95 817 ms, limit 800 ms); return received and credited (P95 816 ms, limit 800 ms); shipment dispatched (P95 4,617 ms, limit 2,000 ms).
- **Error rate**: 0 failed of 5,191 transactions; answers of 5xx: none.
- **Database**: 100,787 commits, 204 rolled back (baseline 3,269), 0 deadlocks, cache hit ratio 0.9998, at most 30 sessions open of 100.
- **Queue**: the product has no queue service; partner events wait in a table and the scheduled run sends them. 12 scheduled runs during the day, 0 failed; a backlog of thirty events cleared once each.
- **Financial posting latency**: posting happens inside the save of its business event. Journal entry written P95 178 ms, posted by a second person P95 166 ms; reconciliation of the whole books P95 419 ms.
- **Invoices alone**: about 90 ms each; ceiling 21 to 28 a second.
- **Server copies**: one, three and four copies gave the same figures on this one machine. More copies on separate machines: NOT VERIFIED.

## RELIABILITY

- **Failure injection**: all twenty failures of the prompt, each as a real failure on the local machine (`phase-11-failure-injection.md`); 36 scenarios; and six faults in a row during a whole day.
- **Recovery**: failure day 545 of 545 jobs, 0 failed transactions, 20 resends, 2 shipments billed after a lost dispatch answer, every copy back up, books clean.
- **Concurrency**: 0 deadlocks in every cycle; no number used twice; no stock below zero; no invoice paid beyond its total; no shipment billed twice.
- **Idempotency**: payments, web orders, transfers, dispatches, deliveries, postings, reversals, period closes, scheduled runs and partner events each repeated at the same moment and after lost answers: one result each.
- **Transaction integrity**: nothing half saved after any kill; every transaction counted as completed was found in the database.

## DEFECTS

**Findings by severity (Phase 11, Z series, 14 findings)**: P0: 0, P1: 9, P2: 2, P3: 3. By status: 10 VERIFIED FIXED, 2 REQUIRES BUSINESS DECISION, 2 DEFERRED TO SPECIFIC PHASE. Earlier findings closed here: E-014 (request limits per server copy) and W-022 (invoice turns inside one process only).

| Finding | Severity | Status | Root cause | Correction |
|---|---|---|---|---|
| Z-001 | P1 | VERIFIED FIXED | Every invoice number was taken by reading the highest number in the whole invoice table inside the serializable save | Fixed: the number comes from DocumentCounter in one UPDATE; the first invoice of a series starts after the highest number already written |
| Z-002 | P1 | VERIFIED FIXED | W-021 made invoices take turns inside one server process | Fixed: a numbered save first takes a short table lock on DocumentCounter (SHARE UPDATE EXCLUSIVE, which does not block reads or ordinary row changes), then reads and writes |
| Z-003 | P1 | VERIFIED FIXED | Every other numbered document counted its table to find the next number and retried on a clash | Fixed: one counter per kind of document (and per year for dated series), stepping past numbers already on older documents |
| Z-004 | P1 | VERIFIED FIXED | A password check is deliberately slow processor work and ran on the thread that answers everything else | Fixed: password and key checks take turns, two at a time (PASSWORD_CHECKS_AT_ONCE) |
| Z-005 | P1 | VERIFIED FIXED | A save that overlapped others on every retry ended as a server error (500) | Fixed: an overlap that survives every retry is answered 409 with code BUSY; receiving a return retries 12 times |
| Z-006 | P2 | REQUIRES BUSINESS DECISION | Invoices are written one at a time for the whole company, because invoice numbers must never be skipped or repeated (owner decision of 2026-11-13) | Not changed: every option that raises the ceiling changes either how invoices are numbered (the owner's and the accountant's decision) or the hardware (the owner's) |
| Z-007 | P1 | VERIFIED FIXED | A partner's request limits (per second, minute and hour) were counted in the memory of each server copy, so a partner got its limit once per copy. | Fixed: the counts are kept in the RateWindow table (database update 18 (src/backend/prisma/upgrades/sql-editor/20261118150000_shared_rate_limits.sql)), one statement per request for all three windows |
| Z-008 | P2 | VERIFIED FIXED | A server copy asked to stop politely (as every deployment does) waited for idle keep-alive connections to close by themselves: under load it took about 6 seconds to leave. | Fixed: idle connections are closed while the copy drains |
| Z-009 | P1 | VERIFIED FIXED | When no database connection was free, or the connection was cut, routes answered "server error" (500) with no hint that sending again would work. | Fixed for queries |
| Z-010 | P3 | REQUIRES BUSINESS DECISION | The general ceiling on requests per address still counts per server copy | Left as it is, with the reason written in the code |
| Z-011 | P1 | VERIFIED FIXED | A transaction that failed when it was opened or committed on a connection the database had closed was still answered 500: the note that turns the reply into "try again" was taken only on single queries | Fixed: transactions are noted too |
| Z-012 | P3 | DEFERRED TO SPECIFIC PHASE | When the answer to a dispatch is lost because its server copy died after saving the dispatch and before billing, sending the dispatch again answers "already IN_TRANSIT" (409) | Not changed in Phase 11 |
| Z-013 | P1 | VERIFIED FIXED | When the request key of a changing request could not be claimed (no database connection at that instant) the request was run anyway, without its protection | Fixed: the request is refused with 503 and a time to retry; nothing is done |
| Z-014 | P3 | DEFERRED TO SPECIFIC PHASE | A request key claimed by a server copy that then died blocks the repeat of that request for 60 seconds ("still being processed"), after which the repeat takes the claim over and runs. | Not changed: a shorter wait risks running a slow first attempt twice |

- **Regression coverage**: 13 of 13 fixes taken out one at a time, each caught by a named check (`qa/results/phase11-mutations.json`); 320 of 320 scenarios kept in `qa/sim/phase11-scenarios.mjs` and in the full gate.
- **Unresolved confirmed P0 or P1 Phase 11 defects**: 0.
- **Remaining risks**: Z-006 (dispatch at peak), Z-010 (general request ceiling per copy), Z-012 (a repeated dispatch does not bill), Z-014 (60 s wait after a crash); earlier P0 and P1 findings still open across the whole register: 18 (B-009, B-016, B-019, E-011, E-015, E-023, I-011, I-012 (D-024), K-007, L-026, M-011, X-001, X-002, X-007, X-009, W-001, W-014, Y-008).

## VERIFICATION

### The five cycles

| Cycle | What ran | Jobs | Transactions completed / failed | Books | Rolled back |
|---|---|---|---|---|---|
| 1 | Baseline, before any fix | 545 of 545 | 5,185 / 0 | balance, reconcile clean | 3,269 |
| 2 | Correction, every fix up to Z-009, rebuilt database | 545 of 545 | 5,187 / 0 | balance, reconcile clean | 230 |
| 3 | Full revalidation, rebuilt database, then all scenarios and the full gate | 545 of 545 | 5,185 / 0 | balance, reconcile clean | 220 |
| 4 | Failure and recovery: six faults during the day, then the failure group | 545 of 545 | 5,185 / 0 | balance, reconcile clean | 206 |
| 5 | Final certification on the finished code, rebuilt database, then all scenarios | 545 of 545 | 5,191 / 0 | balance, reconcile clean | 204 |

### The Phase 11 prompt's gates

| Gate | Result | Evidence |
|---|---|---|
| A. Transaction Execution | PASS | 5,191 transactions and 545 traced jobs in the final cycle; every cycle above both minimums |
| B. Operational Integrity | PASS | 75 database checks and 14 invariants at zero |
| C. Financial Integrity | PASS on the QA ledger | entries balance; receivables and inventory reconcile to the cent; no duplicate posting |
| D. Concurrency | PASS | groups 1 to 4 on three copies; 0 deadlocks |
| E. Performance | **NOT PASSED** | No threshold is approved. Against the proposed ones: dispatch misses at 32 and 48 jobs in flight (Z-006); counter sale paid P95 817 ms against 800 ms; return received and credited P95 816 ms against 800 ms; every other kind of request is inside |
| F. Failure Recovery | PASS | twenty failures injected, detected and recovered; cycle 4 |
| G. Security | PASS on QA | 41 scenarios under load; the product has no division boundary to test; AI on a stand-in |
| H. User Experience | PASS with limits | seven screens in a browser at volume; honest busy and try-again answers; one browser only |
| I. Regression | PASS | Every earlier phase passes on the Phase 11 code on a rebuilt database (Phases 2 to 9.5 in full, unit tests 268 of 268, lint 0 errors, build). Phase 10 passed 276 of 277 once its restore server was started, and the one miss passes alone. Phase 11 in gate order passed 320 of 320 on its third run, after eight checks that made wrong assumptions about what earlier phases leave behind were corrected in the tests |
| J. Enterprise Readiness | **CONDITIONAL** | No unresolved P0 or P1 Phase 11 defect; the 23 documents are written; the Phase 12 handoff is below. Readiness itself is not declared: gate E, and the NOT VERIFIED list |

### The directive's gates A to J

| Gate | Result |
|---|---|
| A. Architecture | PASS: no module rebuilt, no new service, no new dependency, no TypeScript; four small library changes and one table |
| B. Functional Completeness | PASS for what the phase asked to build and run; PARTIAL for what needs approved thresholds and real services |
| C. Cross-Layer Integrity | PASS: every completed transaction was found in the database and, where it posts, in the books; screens opened on the same data |
| D. Data Integrity | PASS: no constraint weakened; invariants and reconciliation at zero; one duplicate payment found by injection and its cause fixed (Z-013) |
| E. Security | PASS on QA: no authorization bypassed; limits now shared across copies |
| F. Reliability | PASS: failures injected and recovered; four reliability faults fixed |
| G. Performance | CONDITIONAL: measured, improved, but no approved threshold and 3 kinds of request above the proposal (dispatch by far the most) |
| H. User Experience | PASS with limits: one browser |
| I. Regression | PASS: full gate on the Phase 11 code |
| J. Documentation | PASS: 23 Phase 11 documents and the shared registers |

### Completion criteria (prompt section 40)

| # | Criterion | Status | Note |
|---|---|---|---|
| 1 | Test environment isolated and documented | PASS | `phase-11-synthetic-data.md` |
| 2 | About 80 locations represented | PASS | 80 |
| 3 | Synthetic enterprise data configured | PASS |  |
| 4 | At least 2,000 transactions complete | PASS | 5,191 |
| 5 | At least 500 customer jobs traced | PASS | 545 |
| 6 | Sales and quoting pass | PASS |  |
| 7 | Inventory and purchasing pass | PASS |  |
| 8 | Manufacturing and scheduling pass | PASS | records only; no physical machine |
| 9 | Quality and traceability pass | PASS | group 2 |
| 10 | Shipping and logistics pass | PASS | no real carrier |
| 11 | Financial ledger posting passes | PASS | QA ledger |
| 12 | Journal balancing passes | PASS |  |
| 13 | Accounts receivable reconciles | PASS |  |
| 14 | Inventory financial valuation reconciles | PASS |  |
| 15 | Branch and enterprise totals reconcile | PASS |  |
| 16 | Accounting period controls pass | PASS |  |
| 17 | External accounting integrations verified where implemented | PARTIAL | the file export is verified; no real accounting system exists to receive it |
| 18 | Reporting under load passes | PASS |  |
| 19 | AI reporting permissions pass | PARTIAL | permissions pass; the model is a stand-in |
| 20 | Database performance measured | PASS |  |
| 21 | API throughput measured | PASS |  |
| 22 | Financial posting throughput measured | PASS | at one day of volume |
| 23 | Background job recovery passes | PASS | the host scheduler itself is not exercised |
| 24 | Controlled failure injection completed | PASS |  |
| 25 | Critical transaction recovery passes | PASS |  |
| 26 | Tenant and location isolation passes | PASS | no table-by-table audit (E-019) |
| 27 | Frontend usability under load passes | PARTIAL | one browser |
| 28 | Approved performance thresholds are met | **NOT MET** | none is approved; above the proposal: counter sale paid, return received and credited, shipment dispatched |
| 29 | Confirmed critical bottlenecks corrected | PARTIAL | Z-001 to Z-005 corrected; Z-006 needs a business decision |
| 30 | At least 300 scenarios pass | PASS | 320 of 320, every category minimum met |
| 31 | Multi-cycle revalidation completed | PASS | five cycles |
| 32 | Relevant regression tests pass | PASS | Every earlier phase passes on the Phase 11 code on a rebuilt database (Phases 2 to 9.5 in full, unit tests 268 of 268, lint 0 errors, build). Phase 10 passed 276 of 277 once its restore server was started, and the one miss passes alone. Phase 11 in gate order passed 320 of 320 on its third run, after eight checks that made wrong assumptions about what earlier phases leave behind were corrected in the tests |
| 33 | No unresolved confirmed P0/P1 Phase 11 defects | PASS |  |
| 34 | All findings explicitly dispositioned | PASS | `findings-register.md` |
| 35 | Phase 12 handoff complete | PASS | below |

## What is needed from the owner

1. **Apply database update 18** (`/mnt/project-files/database-updates/18-20261118150000_shared_rate_limits.sql`, then `verify-6-to-18.sql`). It adds one small table and changes no existing row. It is safe before or after the code: without it the server counts request limits per copy as before.
2. **Say when to merge** the Phase 11 pull request.
3. **Approve or change the proposed performance thresholds** (`phase-11-workload-profile.md`).
4. **Decide Z-006**: accept a few seconds at the dock at the busiest instant, or choose one of the options in `phase-11-capacity-recommendations.md`.
5. **Give real daily volumes** per branch if the model should be set to the business.

## PHASE 12 HANDOFF

Phase 12 (final production certification, financial acceptance, release readiness, sign-off, documentation, training, deployment governance) has not been started.

| Subject | What Phase 12 inherits |
|---|---|
| Remaining critical defects | No open P0 or P1 from Phase 11. Open P0 and P1 across the register: B-009, B-016, B-019, E-011, E-015, E-023, I-011, I-012 (D-024), K-007, L-026, M-011, X-001, X-002, X-007, X-009, W-001, W-014, Y-008 |
| Unverified workflows | Order types outside the six job kinds; the dispatch board lists (V-028); five dashboards figure by figure (V-037); real carrier, payment, tax and accounting flows |
| Performance risks | Dispatch at peak (Z-006); a year of data (W-023); unbounded job list (V-027); copies on separate machines; the live database's connection limit |
| Security risks | Tenant column audit (E-019); general request ceiling per copy (Z-010); live still connects as the database owner until the role switch (Y-008); no outside penetration test |
| Financial reconciliation issues | None open on QA. Not reconciled to a bank, supplier invoices or a real accounting system |
| Accounting policy approvals | Posting rules and the chart of accounts (W-001); freight income and cost, labor, work in progress; receipts without a purchase order (W-006); a number series per branch if chosen (Z-006) |
| Cutover dependencies | Database updates 17 and 18 applied; the runtime role given a password and DATABASE_URL switched; opening balances; the date the books start |
| Disaster recovery limitations | The host's backups never restored (E-015); recovery objectives not approved; the database server itself never failed in a test |
| Integration dependencies | Every outside service is a stand-in; a scheduler on the host for the scheduled run (B-019); an alert receiver (E-017) |
| Documentation gaps | Runbooks exist (Phase 10) but none is rehearsed; no user manual for the recovery steps a clerk takes after "busy" or "try again" |
| Training requirements | Dock: send again after "busy"; office: bill a shipment listed without an invoice; finance: retry a held ledger event, read a reconciliation difference |
| Deployment prerequisites | Update 18; confirm the pool size and pooler for several server copies; PASSWORD_CHECKS_AT_ONCE left at 2 unless the host has more processors per copy |
| Business sign-off requirements | Thresholds; Z-006; the accountant's approval of the ledger; real volumes; who receives alerts |

## Continuation point

- Branch `claude/project-thread-25z3jd`. Not merged; the owner says when.
- Database: update 18 is not applied to live. Update 17 status on live is the owner's.
- Phase 12 has not been started and will not start without the owner's word.
- To rerun: `qa/tools/phase11-cluster.sh 3 --rebuild`, then `node qa/sim/phase11-enterprise.mjs --base http://localhost:3110 --cycle 5` and `node qa/sim/phase11-scenarios.mjs --base http://localhost:3110 --stub-port 3166 --app http://localhost:5199` (the browser group needs a QA server on port 3001 and the frontend on 5199), all with `DATABASE_URL` set to the local QA database.
