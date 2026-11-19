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
| Duration | 104.5 s |
| Transactions | not in the gate log |
| Customer jobs | not in the gate log |
| Books and database | not in the gate log |
| Verdict of the run | jobs500 yes, transactions2000 yes, everyCategoryMinimum yes, invariantsHold yes, booksAgree yes, nothingCountedIsMissing yes, noServerError yes, noDeadlock yes, failedTransactionsWithinLimit yes, responseTimesWithinProposedLimits **no** |

### Response times of the transactions that matter

| Transaction | Requests | Median | p95 | p99 | Proposed limit p95 / p99 | Within the proposal |
|---|---|---|---|---|---|---|
| order written | 305 | 37 ms | 202 ms | 300 ms | none proposed for this one | n/a |
| quote accepted into an order | 115 | 74 ms | 275 ms | 346 ms | none proposed for this one | n/a |
| goods received | 415 | 288 ms | 487 ms | 606 ms | none proposed for this one | n/a |
| stock reserved | 420 | 62 ms | 264 ms | 395 ms | none proposed for this one | n/a |
| work order completed | 40 | 148 ms | 360 ms | 438 ms | none proposed for this one | n/a |
| shipment dispatched | 480 | 1,293 ms | 4,949 ms | 5,790 ms | none proposed for this one | n/a |
| payment taken | 480 | 67 ms | 139 ms | 208 ms | none proposed for this one | n/a |
| counter sale paid | 70 | 252 ms | 877 ms | 1,513 ms | none proposed for this one | n/a |
| web order placed | 55 | 71 ms | 359 ms | 494 ms | none proposed for this one | n/a |
| return received and credited | 60 | 374 ms | 784 ms | 955 ms | none proposed for this one | n/a |
| transfer received | 50 | 114 ms | 374 ms | 523 ms | none proposed for this one | n/a |
| journal entry written | 200 | 48 ms | 198 ms | 274 ms | none proposed for this one | n/a |
| reconciliation run | 12 | 169 ms | 630 ms | 630 ms | none proposed for this one | n/a |

Slower than the proposal in this run:

Dispatch is the known one (Z-006): invoices are numbered one at a time for the whole company, by the owner's decision that numbers are never skipped or repeated. The options and their cost are in `phase-11-capacity-recommendations.md`. It is the owner's and the accountant's decision, not a defect to be tuned away.

## Section 22, item by item

| Item | Evidence | State |
|---|---|---|
| Workload configuration | `phase-11-workload-profile.md`, `phase-11-enterprise-model.md`: built on stated assumptions, not on the business's real volumes | Reviewed; **assumptions not confirmed by the business** |
| Environment configuration | One machine, above | Reviewed; **not the live host** |
| Throughput, median, p95, p99 | Above, and the five cycles of Phase 11 | Measured on QA |
| Error rates | not in the gate log | Measured on QA |
| Database performance | not in the gate log; `phase-11-database-performance.md` | Measured on QA |
| Queue performance | Partner events and scheduled work: `phase-11-event-queue-results.md`; rerun in Phase 11 scenarios group 6 | Measured on QA |
| Ledger posting throughput | not in the gate log | Measured on QA |
| Reporting performance | Reports read while the day ran; reconciliation 115 ms; cockpit read 59 ms | Measured on QA |
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
| Multiple branches | NOT VERIFIED (its suite did not pass in this run) | 80 synthetic branches of six kinds | FAIL: p11: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Multiple divisions | PARTIAL | Division is on products and reports. Staff are not limited by division | FAIL: p95: not in the gate log; pass: Phase 12 "Financial ledger certification" 16 of 16 |  |
| Location-specific inventory | NOT VERIFIED (its suite did not pass in this run) | Stock belongs to a branch | FAIL: branch: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Location-specific pricing | NOT BUILT | One price book for the company; tiers and contracts are per customer | none |  |
| Location-specific manufacturing | NOT VERIFIED (its suite did not pass in this run) | Work centers and jobs belong to a branch | FAIL: p7: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11 |  |
| Location-specific permissions | NOT VERIFIED (its suite did not pass in this run) | Home branch plus assigned branches | FAIL: branch: not in the gate log; pass: Phase 12 "Security and access revalidation" 11 of 11; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Cross-location transfers | NOT VERIFIED (its suite did not pass in this run) | As above | FAIL: p6: not in the gate log; pass: Phase 12 "Multi-location readiness" 6 of 6 | W-002 |
| Corporate reporting | VERIFIED ON QA | Head-office roles read every branch | pass: Phase 12 "Dashboards and reports agree with the records" 7 of 7; pass: Phase 12 "Multi-location readiness" 6 of 6 |  |
| Financial consolidation | PARTIAL | One set of books with a branch on every line. Whether branches are one legal entity or several is not on record | FAIL: p95: not in the gate log; pass: Phase 12 "Financial and inventory reconciliation" 6 of 6 | W-002 |
| Regional operations | PARTIAL | A regional manager is a user given several branches. No region record or regional report | FAIL: branch: not in the gate log |  |
| Proven live capacity | NOT VERIFIED | Nothing here was measured on the live system, with real volumes or real users | none | W-023 |

Two facts that matter for a company in several time zones or one that adds branches often: a branch record holds no time zone (AA-007), and no screen adds a branch (AA-008). Both are the owner's decisions.
