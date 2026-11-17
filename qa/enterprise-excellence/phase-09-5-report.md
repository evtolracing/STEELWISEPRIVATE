# Phase 9.5 of 12: final execution report

Enterprise financial ledger and accounting foundation.

Date: 2026-11-16. Branch `claude/project-thread-25z3jd`, started from `main` at `3081208` (pull request 32, merged). Not merged. Phase 9.5 changes the database: SQL Editor file 16. Everything below was run in this session on a local machine against a local database whose name contains `qa`, with synthetic data and a synthetic approval. Nothing was run against the live database or the host. No real payment was made and nothing was sent to any accounting product.

## FINAL STATUS

**IMPLEMENTED — VERIFICATION INCOMPLETE. The ledger is built, tested and switched off. Production posting is BLOCKED until an accountant approves it.**

Two different things are reported here and must not be confused:

| | Status |
|---|---|
| Engineering completion: the ledger exists, is wired into every business save, and behaves as its documents say on test data | Complete, with the limits below |
| Production activation readiness: the ledger may post on the live system | **NOT READY. Blocked by design** (W-001) |

Why not VERIFIED COMPLETE:

- No accountant has reviewed any policy, account, mapping or rule. The sixteen policy decisions, the chart of accounts and every posting rule are an engineer's proposals. The prompt forbids inventing policy, so the software refuses to start posting until an approval with the accountant's name and date is recorded for every account and mapping.
- Nothing was run on live data or a copy of it. The opening balances, the number of items with no cost and the time activation takes on the live database are unknown (W-005).
- No accounting product is connected. The export is a controlled file whose import into QuickBooks or Xero is NOT VERIFIED (W-011).
- Scale was measured on one container with one server process (W-022, W-023).
- Backup and restore of the ledger and the protection of its triggers against a database superuser are Phase 10 (W-014, W-020).

No confirmed P0 fault is open. Of the P1 findings: W-021 is VERIFIED FIXED; W-001 is the approval block itself; W-014 and W-020 are handed to Phase 10 and do not matter while the ledger is off.

## DISCOVERY

`phase-09-5-ledger-discovery.md`. Read from the code and the schema before any ledger code was written.

- Existing and reused, unchanged in behaviour: invoices and credit memos, gapless invoice numbers, payments and refunds, sales tax carried to invoices to the cent, freight billed, item-level cost set at receipt, cost written on the shipping movement, stock movements, transfers with stock in transit, work orders, counter sales, returns, the financial audit log, branch and owning organisation on every record, and the operational receivables, margin and valuation reports.
- Not existing before this phase, in 161 models and every route: a chart of accounts, a journal, a posting period, an account mapping, an opening balance, a reconciliation record, an export. No code or credential for any accounting product.
- Nothing was duplicated. The ledger is told of each business event by one added call inside the existing save. No second receivables, valuation or margin calculation was written; the ledger's figures are compared with the existing ones.
- Gaps in the source data that limit the ledger, none of which was papered over: receipts with no purchase order have no cost (W-006); counter stock has no receiving screen (W-007); no carrier cost (N-026); no labor or machine rate (L-026, K-007); no supplier invoices (K-012, W-009); no deposits; order lines do not separate processing from material (W-010); the number of legal entities is not on record (W-002).

## WHAT WAS BUILT

| Part | What it is | Document |
|---|---|---|
| Policy | Sixteen decisions, each with what the product does today, a proposal, alternatives and who decides. All unapproved | `phase-09-5-accounting-policy-decisions.md` |
| Chart and mappings | 22 proposed accounts, 1000 to 5390, and a mapping from each posting purpose to one account. An account or mapping that is changed loses its approval | `phase-09-5-chart-of-accounts.md` |
| Journal | Ten tables (database file 16). An entry is written as a draft and then posted. The database itself refuses an entry that does not balance, has fewer than two lines, falls in a closed month, or is changed or deleted after posting. A correction is a reversal, once | `phase-09-5-ledger-architecture.md` |
| Posting engine | One place (`services/ledger.js`) and pure rules (`lib/ledgerRules.js`). One entry per business event by a unique key, written in the event's own transaction behind a savepoint. No fallback account: a missing, unapproved or inactive account holds the event with its reason | `phase-09-5-posting-rules.md`, `phase-09-5-transaction-mapping.md` |
| Events posted | Invoice, credit memo, payment, refund, cancellation; stock received, shipped, restocked, scrapped, adjusted, cut, cost changed; work order completed; transfer sent and received; and the undoing of each | same |
| Inventory value | Specific identification by item, at the item's own cost. An item with no cost is held by name and never valued at zero | `phase-09-5-inventory-valuation.md` |
| Manufacturing | Material and scrap at the source item's cost. No labor, machine or overhead cost is posted: no rate is on file and none was invented | `phase-09-5-manufacturing-costing.md` |
| Periods | Months that are closed and reopened with a reason, by two different people | `phase-09-5-ledger-architecture.md` |
| Cutover | A dry run that writes nothing; activation in one transaction, with opening balances read from the records at that moment; cannot be run twice; can be stopped and started | `phase-09-5-cutover-plan.md` |
| Reconciliation | Ten checks of the books against the business records. It reads and compares and never corrects | `phase-09-5-financial-reconciliation.md` |
| Reports | Eleven, all cut from posted lines: trial balance, account activity, journal, revenue by branch, customer and product, gross margin on material, receivables against invoices, sales tax by state, stock value, monthly activity, exceptions. Gross margin is not labelled profit and loss | `phase-09-5-reporting-validation.md` |
| Finance screen | One screen with nine tabs, in JSX with Material UI. Every figure is the server's | `src/frontend/src/pages/Finance/` |
| Assistant | Read-only ledger answers through fixed queries, scoped by role and branch, each read logged | `phase-09-5-security-review.md` |
| Export | A file of posted entries by external account code, each entry once, with a checksum. Nothing is sent anywhere | `phase-09-5-accounting-export.md` |

Counts after the phase: 171 models (161 before), 661 endpoints (626 before), 51 modules.

## FINDINGS

27 findings, W-001 to W-027, in `findings.json` and `findings-register.md`.

| Outcome | Findings |
|---|---|
| VERIFIED FIXED (9) | W-013 report change crashed the Finance page; W-016 report grouping by an inherited name; W-017 text as an amount threw; W-018 malformed approval answered a server error; **W-021 (P1)** ten of 240 invoices not raised under load; W-024 draft accepted in a closed month; W-025 ledger routes had no rule at the access gate; W-026 Finance addresses answered a bare error on a database without file 16; W-027 two Phase 8 scenarios still asserted that no ledger exists |
| For the owner and the accountant (10) | **W-001 (P1)** approval; W-002 legal entities; W-003 time zone; W-004 gaps in journal numbers; W-006 receipts with no purchase order; W-007 counter stock; W-009 payables clearing is never relieved; W-010 processing revenue; W-011 which accounting product; W-012 counter items with no stock record |
| Phase 10 (4) | **W-014 (P1)** a database superuser can switch the triggers off; W-015 single finance user; W-019 journal reads not logged; **W-020 (P1)** backup and restore |
| Phase 11 (2) | W-022 invoice numbering across several server processes; W-023 a year's volume |
| Phase 12 (1) | W-005 dry run on a copy of live data |
| NOT APPLICABLE (1) | W-008 an unapproved account in use blocks restarting, deliberately |

W-021 deserves a plain account. The 80-branch load run found that with 16 dispatches in flight, 10 of 240 invoices were not raised: every invoice advances one counter row, and ten saves used up all 25 retries. The shipments themselves were saved and listed as "shipped, not billed", so no stock or money was wrong, but invoices were missing. It was already slow before the ledger (95 in 100 dispatches under 1.95 seconds with the ledger stopped, none failed); the ledger's extra work in the same save tipped it over. Fixed by having invoices of one numbering series take turns inside a server process. After the fix: 240 of 240, and the load check fails if any invoice is missing. The fix holds inside one process only (W-022).

Earlier findings noted, not closed: N-025 (no ledger) now reads that a ledger exists and is off, and stays with the owner; K-012, K-007, L-026 and N-026 each carry a note of what the ledger does and does not do about them.

### Behaviour that changes for staff

- A "Ledger" entry appears in the menu for the owner, administrators, the CFO, executives, auditors and branch managers. It shows that posting has not been started.
- Nothing else changes until the ledger is started. With it off, every business save reads one settings row and goes no further.
- Two invoices raised at the same instant are now saved one after the other. No one will notice except under heavy load, where they now succeed.

## VERIFICATION

All run in this session. Figures for the full run are in `phase-09-5-regression-results.md`.

| Check | Result |
|---|---|
| Ledger scenarios through the real server, journal read back from the database (`qa/sim/phase95-ledger.mjs`); 150 required | 158 of 158, 915 checks, in seven groups |
| Finance screen in a browser (`qa/sim/phase95-ui.cjs`) | 13 of 13, 69 checks |
| Rules as functions (`src/backend/test/ledgerRules.test.js`) | 24 of 24; backend unit tests 233 of 233 |
| Proof by removal (`qa/tools/phase95-mutations.mjs`) | 26 rules and guards removed one at a time; each removal made a named test fail; the source was restored after each |
| Load at 80 branches (`qa/sim/phase95-load.mjs`) | 16 of 16 checks. 1,120 entries from business events in 24.8 seconds (45.1 a second), then 2,000 manual entries in 14.1 seconds (141.9 a second); 4,980 requests, 0 failed, 0 deadlocks, 0 duplicates, reconciliation clean |
| Database file 16 | Made by the project's tool; run twice on a copy, the second run changing nothing; schema compared with no difference; the public API roles read 0 rows and change 0 rows; `verify-6-to-16.sql` all APPLIED/OK on the copy |
| Finished code on a database without file 16 | Phase 8 scenarios 155 of 155 on a copy with the ledger tables removed; the Finance addresses answer 503 "Database update 16 has to be applied first"; invoices and the health check answer as before |
| Full regression on a rebuilt database | Second run, on the finished code, every step passes: three simulations, the sweep, branch boundary 39 checks, Phase 2 integrity 82 checks, Phase 3 74 of 74, Phase 4 66 of 66, Phase 5 76 of 76, Phase 6 106 of 106, Phase 7 141 of 141, Phase 8 155 of 155, ten earlier browser suites 286 checks with 0 failed, Phase 9 browser scenarios 232 of 232, 155 screens measured with 0 counts over a ceiling, 0 routes with no rule, lint 0 errors, build made. The database checks after the scenarios are identical to the first run. The first run read Phase 8 153 of 155 and Phase 9 231 of 232; both causes were in the tests and are described in the regression document |

### The Phase 9.5 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Accounting design | **NOT PASSED: awaiting approval** | Policies, chart, mappings and rules are written and implemented as configuration. None is approved. The gate needs an accountant, and that is the reason production posting is blocked |
| B. Journal integrity | PASS on test data | Balance, two lines, open period, draft-then-post, immutability and no-truncate are enforced by the database and each was attacked by direct SQL; reversal once. Limit: W-014 |
| C. Transaction integrity | PASS on test data | One entry per event by unique key; same transaction as the business save; a ledger failure neither blocks nor half-posts; races of three to five requests on every once-only rule; 0 duplicates after the load run. Limit: one server process |
| D. Operational integration | PASS with named gaps | Every money and stock save calls the engine; scenarios in five business groups read the journal back. Gaps held, not guessed: W-006, W-007, W-012 |
| E. Reporting | PASS on test data | Each report agrees with the trial balance and with the records; the reconciliation is clean after all scenarios and after load. Not compared with any real accounts |
| F. Security | PASS for this phase's scope | Roles at the gate and in the route, branch scope, two-person posting, every change logged, assistant read-only. Full review is Phase 10 |
| G. Cutover | CONDITIONAL | Dry run and activation proven on QA data, including refusal without approval. Not run on a copy of live data (W-005) |
| H. External accounting | NOT VERIFIED | A safe file exists. No product is connected and no import was tested (W-011). Nothing live was created |
| I. Regression | PASS | Full run of every earlier check on a rebuilt database with the new code and the ledger off, then the ledger checks: no failure (`qa/results/phase95-gate-run-2.txt`). Two Phase 8 scenarios that asserted "no ledger exists" were rewritten (W-027) |

### The directive's gates A to J

| Gate | Result |
|---|---|
| A. Scope understood | PASS: discovery written first |
| B. Requirements met | PARTIAL: engineering requirements met; approval, live data and an external product are outside what a session can do |
| C. Defects reproduced before correction | PASS: W-013, W-016 to W-018, W-021, W-024 and W-025 each seen failing first; the load failure is kept in `qa/results/phase95-load-before-fix.json` |
| D. Corrections minimal and in place | PASS: one call added per existing save; no existing calculation replaced; no TypeScript; no new dependency |
| E. Automated checks fail without the fix | PASS: 26 removals |
| F. Regression | PASS: second full run, no failure |
| G. Performance | PASS on the local machine, at the size measured; W-022 and W-023 open |
| H. Security | PASS for what the phase added; W-014, W-019, W-020 to Phase 10 |
| I. Documentation | PASS: sixteen documents and the registers |
| J. Readiness | **Code: CONDITIONAL. Posting on live: FAIL until approved, by design** |

Scores are in `phase-09-5-quality-scorecard.md`. They are judgements from named evidence. No score of the ledger itself reaches 90, because no accountant has reviewed the design and nothing ran on live data.

## PRODUCTION READINESS

**Merging and deploying the code.** CONDITIONAL. The code is safe to deploy with the ledger off: no business save changes its outcome, which the full regression shows. Conditions:

1. Apply SQL Editor file 16 (`src/backend/prisma/upgrades/sql-editor/20261117090000_financial_ledger.sql`), then run `verify-6-to-16.sql`. It adds ten tables and changes none. If the code arrives first, only the Finance screen is unavailable and it says why (R-68, tested).
2. Rolling back the code needs no database change: the tables can stay, empty.

**Starting the ledger on live.** NOT READY. The software enforces this: activation is refused while any account or mapping is unapproved, and needs the accountant's name, an approval date, a time zone and a dry run less than seven days old. Before it can be considered:

1. The accountant reviews and approves, or changes, the sixteen policy decisions, the chart and the mappings.
2. The owner answers: how many legal entities the branches are; the time zone of the books; which accounting product, if any; what to do about receipts with no purchase order, counter stock and stock with no cost.
3. Phase 10 closes W-014 and W-020.
4. Phase 11 closes W-022 and W-023.
5. Phase 12: a dry run on a copy of live data, read and signed by the accountant, and formal acceptance.

Risks R-67 to R-75 are in `production-risk-register.md`.

### Decisions that are the owner's

| Decision | Finding |
|---|---|
| Name the accountant who will review the proposals in `phase-09-5-accounting-policy-decisions.md` and `phase-09-5-chart-of-accounts.md` | W-001 |
| One legal entity or several | W-002 |
| Time zone the books are kept in (cannot be changed after starting) | W-003 |
| Whether gaps in journal entry numbers are acceptable | W-004 |
| How receipts with no purchase order and counter stock get a cost and a supplier | W-006, W-007, W-012 |
| Whether supplier invoices will come into the product; until then payables clearing only grows | W-009 |
| Whether processing is to be priced apart from material | W-010 |
| Which accounting product the export is for | W-011 |

## HANDOFFS

### Phase 10: security, reliability, recovery

| Subject | What Phase 10 must do | Finding |
|---|---|---|
| Ledger authorization | Attack `/api/ledger` beyond the inputs tried here; confirm the role table (`phase-09-5-security-review.md`) against stolen and downgraded tokens and across branches | |
| Immutability | The triggers stop the application. A database superuser or table owner can switch them off. Run the application under a role without those rights and prove an update of a posted line is refused for it. Hosting change, the owner's | W-014 |
| Financial data protection | Row level security is on for all ten tables and the public API roles read nothing (tested on a copy). Review encryption at rest, who holds database credentials, and what the export file contains once downloaded | |
| Transaction recovery | The business save and its ledger event are one transaction, so there is nothing in between. Confirm by killing the server mid-save. Confirm that FAILED and held events are all found again by "record what is missing" after a crash | |
| Backup and restore | Restore a backup that includes the ledger; prove the journal still balances, the triggers and the numbering sequence are present, and the reconciliation is clean | W-020 |
| Audit logging | Journal list and single-entry reads are not logged; reports are. Review retention of financial audit rows | W-019 |
| Separation of duties | Whether the reopen rule may yield where there is one finance user | W-015 |

### Phase 11: performance and scale

| Subject | What Phase 11 must do | Finding |
|---|---|---|
| Concurrent posting | Repeat `qa/sim/phase95-load.mjs` with several server processes. Invoice numbering takes turns inside one process only; across processes the database retry is the only guard and it is what failed | W-022 |
| Volume | A year at 80 branches (hundreds of thousands of entries): trial balance, account activity, monthly activity and reconciliation times; index review from real plans | W-023 |
| Duplicate recovery | Retried and replayed requests at volume: 0 duplicates was shown at about 3,000 entries | |
| Reconciliation | The inventory check reads at most 5,000 differing items and does not say when it stops; it needs paging | W-023 |
| Reporting under load | Reports were read while posting at 16 in flight (95 in 100 under 45 ms). Repeat at volume | |
| Activation | Business saves wait while opening balances are taken. Measure that wait at live size | W-005 |
| Dispatch time | The dispatch save took about 1.0 second at the median under load with the ledger on. It is the slowest save in the product | W-022 |

Baselines to compare with are in `qa/results/phase95-load.json`.

### Phase 12: acceptance

Formal accounting acceptance before production activation:

1. Each of the sixteen policy decisions accepted or changed in writing by the accountant.
2. Chart and mappings approved in the software under the accountant's name.
3. A dry run on a copy of live data: opening stock and receivables agreed to the company's own books; the list of items with no cost dealt with.
4. One month run in parallel on the copy and reconciled by the accountant.
5. The export imported into a test company of the chosen product, or the export declared out of scope.
6. A cutover date, time zone and rollback agreed.
7. Only then: activation on live, by the owner or the CFO.

## Continuation point

- Branch `claude/project-thread-25z3jd`, pull request 33. Not merged; the owner says when.
- Database: file 16 is not applied to live. The owner applies it.
- The ledger is off everywhere except the local QA database, where a synthetic approval is used by the tests.
- Nothing is half-done in the code. Open work is the approvals and the handoffs above.
- To rerun everything: `qa/tools/run-gates.sh`. The ledger alone: `node qa/sim/phase95-ledger.mjs --base http://localhost:3011`, then `node qa/sim/phase95-ui.cjs`, then `node qa/sim/phase95-load.mjs`.
- Do not start Phase 10 without the owner's word.
