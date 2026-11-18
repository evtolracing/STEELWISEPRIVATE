# Phase 11: performance baseline, corrections and before/after

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

Thresholds are PROPOSED, PENDING OWNER APPROVAL. "Within limit" below means within the proposed limit.

## Every measured operation: baseline against cycle 5

| Operation | Class | Requests | Baseline P50 | Baseline P95 | Baseline P99 | Now P50 | Now P95 | Now P99 | P95 limit | Within limit now |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| sign-in | sign-in | 818 | 704 ms | 1,016 ms | 1,148 ms | 725 ms | 974 ms | 1,122 ms | 1,500 ms | yes |
| buyer sees the order in the portal | screen read | 55 | 29 ms | 152 ms | 207 ms | 37 ms | 282 ms | 354 ms | 800 ms | yes |
| counter sale paid | simple change | 70 | 169 ms | 947 ms | 1,325 ms | 263 ms | 817 ms | 1,317 ms | 800 ms | NO |
| goods received | simple change | 417 | 152 ms | 249 ms | 361 ms | 159 ms | 283 ms | 441 ms | 800 ms | yes |
| inspection opened | screen read | 115 | 37 ms | 119 ms | 243 ms | 49 ms | 107 ms | 133 ms | 800 ms | yes |
| inspection passed | simple change | 115 | 59 ms | 135 ms | 174 ms | 72 ms | 142 ms | 151 ms | 800 ms | yes |
| invoice opened | screen read | 480 | 15 ms | 30 ms | 65 ms | 20 ms | 41 ms | 58 ms | 800 ms | yes |
| job cost read | screen read | 115 | 22 ms | 35 ms | 46 ms | 24 ms | 55 ms | 65 ms | 800 ms | yes |
| job opened | screen read | 115 | 32 ms | 111 ms | 214 ms | 39 ms | 126 ms | 375 ms | 800 ms | yes |
| job packed and staged for shipping | simple change | 115 | 41 ms | 108 ms | 131 ms | 54 ms | 100 ms | 109 ms | 800 ms | yes |
| job routed and scheduled | simple change | 115 | 70 ms | 260 ms | 360 ms | 92 ms | 273 ms | 491 ms | 800 ms | yes |
| journal entry posted by a second person | simple change | 200 | 25 ms | 109 ms | 150 ms | 38 ms | 166 ms | 225 ms | 800 ms | yes |
| journal entry written | simple change | 200 | 31 ms | 138 ms | 184 ms | 46 ms | 178 ms | 228 ms | 800 ms | yes |
| material issued to a work order | simple change | 40 | 18 ms | 140 ms | 266 ms | 26 ms | 136 ms | 367 ms | 800 ms | yes |
| order confirmed | simple change | 305 | 34 ms | 204 ms | 251 ms | 51 ms | 249 ms | 304 ms | 800 ms | yes |
| order written | simple change | 305 | 29 ms | 238 ms | 520 ms | 36 ms | 172 ms | 238 ms | 800 ms | yes |
| payment taken | simple change | 480 | 46 ms | 119 ms | 203 ms | 64 ms | 161 ms | 251 ms | 800 ms | yes |
| purchase order placed | simple change | 417 | 51 ms | 108 ms | 185 ms | 56 ms | 107 ms | 187 ms | 800 ms | yes |
| purchase order written | simple change | 417 | 73 ms | 169 ms | 186 ms | 48 ms | 87 ms | 135 ms | 800 ms | yes |
| quote accepted into an order | simple change | 115 | 54 ms | 469 ms | 1,081 ms | 72 ms | 250 ms | 330 ms | 800 ms | yes |
| quote priced | simple change | 115 | 38 ms | 206 ms | 294 ms | 52 ms | 208 ms | 238 ms | 800 ms | yes |
| quote sent | simple change | 115 | 24 ms | 111 ms | 196 ms | 35 ms | 133 ms | 170 ms | 800 ms | yes |
| reconciliation run | reconciliation of the books | 12 | 96 ms | 548 ms | 548 ms | 111 ms | 419 ms | 419 ms | 5,000 ms | yes |
| refund paid | simple change | 60 | 42 ms | 90 ms | 207 ms | 60 ms | 136 ms | 368 ms | 800 ms | yes |
| request for quote entered | simple change | 115 | 22 ms | 175 ms | 327 ms | 30 ms | 93 ms | 243 ms | 800 ms | yes |
| return opened | screen read | 60 | 31 ms | 51 ms | 110 ms | 33 ms | 64 ms | 75 ms | 800 ms | yes |
| return received and credited | simple change | 60 | 246 ms | 717 ms | 840 ms | 390 ms | 816 ms | 897 ms | 800 ms | NO |
| shipment delivered | simple change | 480 | 23 ms | 46 ms | 73 ms | 31 ms | 61 ms | 84 ms | 800 ms | yes |
| shipment dispatched | dispatch with its invoice | 480 | 1,322 ms | 7,250 ms | 8,817 ms | 1,424 ms | 4,617 ms | 5,214 ms | 2,000 ms | NO |
| shipment put together | simple change | 480 | 51 ms | 541 ms | 1,010 ms | 41 ms | 150 ms | 368 ms | 800 ms | yes |
| step finished | simple change | 230 | 64 ms | 190 ms | 275 ms | 75 ms | 193 ms | 254 ms | 800 ms | yes |
| step started | simple change | 230 | 71 ms | 247 ms | 333 ms | 92 ms | 272 ms | 365 ms | 800 ms | yes |
| stock count adjusted | simple change | 40 | 98 ms | 331 ms | 339 ms | 115 ms | 362 ms | 448 ms | 800 ms | yes |
| stock reserved | simple change | 420 | 43 ms | 233 ms | 285 ms | 58 ms | 241 ms | 342 ms | 800 ms | yes |
| transfer received | simple change | 50 | 83 ms | 363 ms | 418 ms | 121 ms | 386 ms | 458 ms | 800 ms | yes |
| transfer sent | simple change | 50 | 71 ms | 661 ms | 845 ms | 107 ms | 447 ms | 469 ms | 800 ms | yes |
| web order accepted into an order | simple change | 55 | 48 ms | 818 ms | 1,253 ms | 75 ms | 375 ms | 518 ms | 800 ms | yes |
| web order placed | simple change | 55 | 50 ms | 366 ms | 560 ms | 62 ms | 247 ms | 423 ms | 800 ms | yes |
| work order completed | simple change | 40 | 118 ms | 376 ms | 613 ms | 155 ms | 483 ms | 569 ms | 800 ms | yes |
| work order released | simple change | 40 | 20 ms | 115 ms | 178 ms | 26 ms | 80 ms | 179 ms | 800 ms | yes |
| work order written | simple change | 40 | 23 ms | 141 ms | 179 ms | 34 ms | 83 ms | 294 ms | 800 ms | yes |
| branch manager: invoices list | screen read | 71 | 14 ms | 46 ms | 53 ms | 22 ms | 54 ms | 167 ms | 800 ms | yes |
| branch manager: orders list | screen read | 71 | 16 ms | 64 ms | 127 ms | 20 ms | 57 ms | 114 ms | 800 ms | yes |
| branch manager: shipments list | screen read | 71 | 16 ms | 51 ms | 137 ms | 21 ms | 54 ms | 126 ms | 800 ms | yes |
| branch manager: stock list | screen read | 71 | 19 ms | 51 ms | 98 ms | 24 ms | 66 ms | 94 ms | 800 ms | yes |
| executive: KPIs | screen read | 34 | not measured | not measured | not measured | 15 ms | 54 ms | 182 ms | 800 ms | yes |
| executive: cockpit | screen read | 34 | not measured | not measured | not measured | 14 ms | 38 ms | 73 ms | 800 ms | yes |
| executive: company dashboard | screen read | 34 | not measured | not measured | not measured | 20 ms | 72 ms | 123 ms | 800 ms | yes |
| executive: inventory value | screen read | 34 | 34 ms | 78 ms | 131 ms | 43 ms | 97 ms | 154 ms | 800 ms | yes |
| finance: receivables | screen read | 52 | 23 ms | 47 ms | 180 ms | 30 ms | 72 ms | 180 ms | 800 ms | yes |
| finance: revenue by branch | screen read | 52 | 18 ms | 53 ms | 127 ms | 21 ms | 74 ms | 152 ms | 800 ms | yes |
| finance: trial balance (end of day) | screen read | 1 | 12 ms | 12 ms | 12 ms | 15 ms | 15 ms | 15 ms | 800 ms | yes |
| finance: trial balance | screen read | 52 | 18 ms | 52 ms | 153 ms | 25 ms | 61 ms | 117 ms | 800 ms | yes |
| operations: cockpit | simple change | 34 | not measured | not measured | not measured | 46 ms | 92 ms | 200 ms | 800 ms | yes |
| sales: dashboard | simple change | 34 | not measured | not measured | not measured | 30 ms | 68 ms | 335 ms | 800 ms | yes |

## The corrections (prompt section 33)

Each was measured failing or slow first, corrected in place, and has a check that fails without it (`qa/results/phase11-mutations.json`: 13 of 13 removals caught).

| Finding | Before | After | Evidence |
|---|---|---|---|
| Z-001, Z-002, Z-003: numbers by counter, invoices take turns in the database | Cycle 1: 3,269 transactions rolled back; dispatch P95 7,250 ms, P99 8,817 ms | cycle 5: 204 rolled back; dispatch P95 4,617 ms, P99 5,214 ms | cycle files |
| Z-004: password checks take turns | Twenty-four sign-ins at once on one process: health check unanswered for over 1.5 s, 768 requests turned away | 818 sign-ins 24 at a time: 0 failed, P95 974 ms, nothing turned away | measured before the fix in this session; cycle files after |
| Z-005: busy is 409, never 500 | Correction cycle, first run: 2 of 545 jobs failed on "return received and credited" with a 500 | cycle 5: returns 60 of 60, 0 failed transactions | cycle files |
| Z-007, E-014: request limits shared by all server copies | Limit 10 on 3 copies: 30 of 60 wrong sign-ins from one address reached the password check | 10 of 60 | `qa/results/phase11-rate-limit-before.json`, `-after.json` |
| Z-008: polite stop | A copy told to stop under load took about 6 s to leave | Under 3 s, checked in group 7 on every run | group 7 |
| Z-009, Z-011: no database connection is 503 "try again" | Requests answered 500; first failure-and-recovery run: 1 answer of 500 | Failure-and-recovery run after the fix: 0 answers of 500, 26 of 503 | `phase11-cycle-4-first-run.json`, `phase11-cycle-4.json` |
| Z-013: a keyed request is never run without its key | Failure group after the failure day: one invoice of eight received two payments | Failure group 36 of 36 on the same database; the request is refused with 503 and nothing is done | group 7; unit test Z-013 |

## Dispatch by level, cycle 5

| Jobs in flight | Dispatches | P50 | P95 | P99 | Within the proposed 2,000 ms at P95 |
|---|---:|---:|---:|---:|---|
| 8 | 123 | 288 ms | 696 ms | 1,129 ms | yes |
| 16 | 117 | 1,107 ms | 1,865 ms | 2,147 ms | yes |
| 32 | 118 | 2,359 ms | 4,617 ms | 5,097 ms | NO |
| 48 | 122 | 3,559 ms | 5,175 ms | 5,395 ms | NO |

## What is still slower than proposed

- **counter sale paid**: P95 817 ms (limit 800 ms), P99 1,317 ms (limit 1,500 ms).
- **return received and credited**: P95 816 ms (limit 800 ms), P99 897 ms (limit 1,500 ms).
- **shipment dispatched**: P95 4,617 ms (limit 2,000 ms), P99 5,214 ms (limit 4,000 ms).

The dispatch is Z-006: it is not a defect in the code but the cost of an owner decision (invoice numbers never skipped or repeated), measured on a small machine. It was not "fixed" by weakening the numbering. The options are in `phase-11-capacity-recommendations.md`.
