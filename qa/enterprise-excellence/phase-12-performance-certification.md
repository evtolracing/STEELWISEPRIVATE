# Phase 12: performance certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

## The dependency that decides this certification

**No performance threshold was ever approved.** Phase 11 proposed limits (`phase-11-workload-profile.md`, status "PROPOSED, PENDING OWNER APPROVAL") and measured against them. Gate F asks for "approved workload thresholds": until the owner approves or changes the proposal, performance is **NOT VERIFIED** as a gate, whatever the figures. No capacity claim is made for the live system: nothing was measured there.

## What was measured, on the release candidate, in the final gate

| Item | Value |
|---|---|
| Machine | 4 processors (Intel(R) Xeon(R) Processor @ 2.10GHz), 15.7 GB; it carried the database, the server copies and the load |
| Server copies | 3 |
| Workload | one simulated enterprise day for 80 branches: 9 customer jobs |
| Duration | 110.4 s |
| Transactions | transactions: attempted 5191, completed 5191, failed 0, retried 0, recovered 0, reconciled 5191 |
| Customer jobs | customer jobs: 545/545 completed, 545 traced end to end; A 185/185, B 115/115, C 55/55, D 70/70, E 60/60, F 60/60 |
| Books and database | books: trial balance balances; reconciliation clean; database: 0 deadlocks, 94 rolled back, lock waiters max 5 |
| Verdict of the run | jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold yes, booksAgree yes, nothingCountedIsMissing yes, noServerError yes, noDeadlock yes, failedTransactionsWithinLimit yes, responseTimesWithinProposedLimits **no** |

### Response times of the transactions that matter

| Transaction | Requests | Median | p95 | p99 | Proposed limit p95 / p99 | Within the proposal |
|---|---|---|---|---|---|---|
| order written | 305 | 42 ms | 215 ms | 261 ms | none proposed for this one | n/a |
| quote accepted into an order | 115 | 86 ms | 373 ms | 440 ms | none proposed for this one | n/a |
| goods received | 417 | 291 ms | 493 ms | 630 ms | none proposed for this one | n/a |
| stock reserved | 420 | 63 ms | 269 ms | 375 ms | none proposed for this one | n/a |
| work order completed | 40 | 170 ms | 414 ms | 681 ms | none proposed for this one | n/a |
| shipment dispatched | 480 | 1,509 ms | 4,870 ms | 6,798 ms | none proposed for this one | n/a |
| payment taken | 480 | 72 ms | 146 ms | 231 ms | none proposed for this one | n/a |
| counter sale paid | 70 | 272 ms | 941 ms | 1,659 ms | none proposed for this one | n/a |
| web order placed | 55 | 85 ms | 352 ms | 697 ms | none proposed for this one | n/a |
| return received and credited | 60 | 406 ms | 770 ms | 1,171 ms | none proposed for this one | n/a |
| transfer received | 50 | 112 ms | 559 ms | 574 ms | none proposed for this one | n/a |
| journal entry written | 200 | 54 ms | 211 ms | 315 ms | none proposed for this one | n/a |
| reconciliation run | 12 | 199 ms | 527 ms | 527 ms | none proposed for this one | n/a |

Slower than the proposal in this run:

- slower than the proposed limit: counter sale paid p95 940.5 (limit 800), p99 1659.1 (limit 1500)
- slower than the proposed limit: shipment dispatched p95 4870.3 (limit 2000), p99 6798.1 (limit 4000)

Any other line in that list was within the proposal in earlier runs and is reported as measured in this one: the figures move from run to run on a machine that carries the database, the servers and the load together. Dispatch is the constant one (Z-006): invoices are numbered one at a time for the whole company, by the owner's decision that numbers are never skipped or repeated. The options and their cost are in `phase-11-capacity-recommendations.md`. It is the owner's and the accountant's decision, not a defect to be tuned away.

## Section 22, item by item

| Item | Evidence | State |
|---|---|---|
| Workload configuration | `phase-11-workload-profile.md`, `phase-11-enterprise-model.md`: built on stated assumptions, not on the business's real volumes | Reviewed; **assumptions not confirmed by the business** |
| Environment configuration | One machine, above | Reviewed; **not the live host** |
| Throughput, median, p95, p99 | Above, and the five cycles of Phase 11 | Measured on QA |
| Error rates | transactions: attempted 5191, completed 5191, failed 0, retried 0, recovered 0, reconciled 5191 | Measured on QA |
| Database performance | books: trial balance balances; reconciliation clean; database: 0 deadlocks, 94 rolled back, lock waiters max 5; `phase-11-database-performance.md` | Measured on QA |
| Queue performance | Partner events and scheduled work: `phase-11-event-queue-results.md`; rerun in Phase 11 scenarios group 6 | Measured on QA |
| Ledger posting throughput | Phase 9.5 load: 16 of 16 checks pass | Measured on QA |
| Reporting performance | Reports read while the day ran; reconciliation 109 ms; cockpit read 72 ms | Measured on QA |
| Comparison with approved thresholds | None approved | **Certification dependency: open** |
| A year of data; the live host; separate machines | W-023 | **NOT VERIFIED** |

## 80-location readiness (section 23)

6 of 6 scenarios pass.

| ID | Scenario | Result | Checks |
|---|---|---|---|
| ML-01 | Locations 1: all 80 branches exist, each with a time zone, an address state and its own people | pass | 4 |
| ML-02 | Locations 2: each kind of branch sees only itself, and head office sees all 80 | pass | 11 |
| ML-03 | Locations 3: stock moves between branches only by a transfer, and both ends agree | pass | 5 |
| ML-04 | Locations 4: numbers that must be unique stay unique across all branches | pass | 5 |
| ML-05 | Locations 5: a branch's tax and financial reporting follow the branch | pass | 3 |
| ML-06 | Locations 6: a new branch can be added and is at once separate from the rest | pass | 5 |

| Capability | State | What the product has | Evidence in this run | Open findings |
|---|---|---|---|---|
| Multiple branches | NOT VERIFIED (its suite did not pass in this run) | 80 synthetic branches of six kinds | FAIL: Phase 11 enterprise cycle gate: jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold ye; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Multiple divisions | PARTIAL | Division is on products and reports. Staff are not limited by division | pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Location-specific inventory | VERIFIED ON QA | Stock belongs to a branch | pass: Branch boundary: 39 checks, 0 problems; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Location-specific pricing | NOT BUILT | One price book for the company; tiers and contracts are per customer | none |  |
| Location-specific manufacturing | VERIFIED ON QA | Work centers and jobs belong to a branch | pass: Phase 7 manufacturing scenarios: 141 of 141 pass, 618 checks; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Location-specific permissions | VERIFIED ON QA | Home branch plus assigned branches | pass: Branch boundary: 39 checks, 0 problems; pass: Phase 12 "Security and access revalidation" 11 of 11; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Cross-location transfers | VERIFIED ON QA | As above | pass: Phase 6 inventory scenarios: 106 of 106 pass, 494 checks; pass: Phase 12 "Multi-location readiness" 6 of 6 | W-002 |
| Corporate reporting | VERIFIED ON QA | Head-office roles read every branch | pass: Phase 12 "Dashboards and reports agree with the records" 7 of 7; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Financial consolidation | PARTIAL | One set of books with a branch on every line. Whether branches are one legal entity or several is not on record | pass: Phase 9.5 ledger: 158 of 158 pass, 915 checks; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | W-002 |
| Regional operations | PARTIAL | A regional manager is a user given several branches. No region record or regional report | pass: Branch boundary: 39 checks, 0 problems |  |
| Proven live capacity | NOT VERIFIED | Nothing here was measured on the live system, with real volumes or real users | none | W-023 |

Two facts that matter for a company in several time zones or one that adds branches often: a branch record holds no time zone (AA-007), and no screen adds a branch (AA-008). Both are the owner's decisions.
