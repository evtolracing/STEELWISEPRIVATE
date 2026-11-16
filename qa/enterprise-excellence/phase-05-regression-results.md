# Phase 5: regression results

Date: 2026-11-15. Every run below was made in this session on a freshly rebuilt local QA database by `qa/tools/run-gates.sh`, which now also runs `qa/sim/phase5-sales.mjs` and `qa/sim/ui-phase5.cjs`.

## 1. Runs

| Run | Code | Result |
|---|---|---|
| Baseline | Phase 4 final (`fce9593`) | All green (kept in the session scratch file `p5-baseline-gates.txt`) |
| First full run | Phase 5 code, older tests unchanged | Five older checks failed, each because it expected the old behaviour that Phase 5 corrected (below). Everything else green |
| Second full run | Phase 5 code, those tests updated | All green except one Phase 5 portal check, which failed on a test-code error (it sorted web orders by a column the table does not have). Corrected and the suite re-run against the same database right after: 76 of 76 |

### Older checks updated, and why

| Suite | Check | Why it changed |
|---|---|---|
| `qa/sim/run.mjs` | Counter job submitted through the POS session | The session submit is closed (S-022). The job now enters the counter order through Retail POS and checks the clerk's branch; it also checks the old route answers 410 |
| `qa/sim/run.mjs` | "quote total = quantity x price" | A quote now carries tax (J-001): subtotal = quantity x price; total = subtotal + tax; the order carries the quote's tax |
| `qa/sim/security.mjs` | Order entry at a Michigan branch | The first Michigan branch in the data is not the CSR's own; since Phase 5 another branch is refused (S-008, owner decision 2). Uses the CSR's own Michigan branch and adds two checks: the order is filed at that branch, and a branch not the person's own is refused |
| `qa/sim/phase3-db.mjs` | Quote and order total 591.88 | Now the subtotal; the total adds tax |
| `qa/sim/phase4-integration.mjs` | Two flows compared totals to 800 and 1,900 | Now subtotals; totals, invoice and payment follow the taxed total |

No check was removed or weakened: each compares the same amounts, now split into subtotal and tax.

## 2. Final results (second full run)

| Suite | Result | Phase 4 end |
|---|---|---|
| Order-to-cash simulation, seeds 8001 to 8003 | 150 of 150 jobs; reconciliation 0 problems after each seed (plus 52 in demo seed data) | Same |
| Database checks after the simulation and after the scenarios | 0 outside the known seed and demo rows; orders with no branch 59 and 62 (63 before) | Same checks |
| Security sweep | 20 of 20 sections; order entry 45 checks (43 before) | 20 of 20 |
| Branch boundary | 37 of 37 | Same |
| Phase 2 integrity | 80 of 80 | Same |
| Phase 3 database scenarios | 74 of 74, 607 checks | Same |
| Phase 4 integration scenarios | 66 of 66, 554 checks | Same |
| Phase 5 sales scenarios (new) | 76 of 76, 386 checks (re-run, see §1) | New |
| Unit tests | 149 of 149 | 144 |
| Browser: experience, shipping, shop, sales, inventory, integration | 22, 29, 30, 24, 22, 33 checks, 0 failed | Same |
| Browser: Phase 5 (new) | 14 checks, 0 failed | New |
| Every screen opens | All routes open | Same |
| Baseline probe | All sections pass | Same |
| Department rule coverage | 323 changing routes, 0 with no rule | Same |
| Screen audit | 0 screens with made-up data and no notice; 140 screens (4 fewer: the Order Hub) | 0 |
| Screen ratchets | At their ceilings (38, 0) | Same |
| Lint | Frontend clean; whole repository 0 errors, 1,528 warnings (1,532 before) | |
| Build | Succeeds | Same |

## 3. Performance at 85 branches

`qa/perf/branch-bench.mjs --set sales` on `steelwise_qa_scale3` (72,565 orders; 18,027 requests and 18,028 quotes after `qa/perf/phase5-sales-scale.sql`, 720 of them lapsed and still marked sent), 9 runs each, median / 95th percentile in ms. Result file: `qa/results/phase5-sales-bench.json`. Local machine, not the host.

| Screen | Branch login | All-branch login |
|---|---:|---:|
| Home figures `/api/dashboard` | 26 / 30 | 56 / 67 |
| Sales dashboard, month | 27 / 48 | 57 / 63 |
| Quotes, newest 50 | 22 / 25 | 34 / 38 |
| Quotes, sent | 19 / 21 | 24 / 28 |
| Quotes, expired | 19 / 21 | 32 / 35 |
| Requests | 17 / 25 | 22 / 26 |
| Orders, summary | 24 / 28 | 48 / 55 |
| Order entry branch list | 8 / 12 | 8 / 10 |
| Order entry list | 26 / 30 | 50 / 53 |
| Credit holds | 12 / 16 | 22 / 25 |
| Web order inbox | 10 / 10 | 10 / 10 |
| Price list | 8 / 10 | 7 / 9 |
| Pricing overview | 8 / 9 | 8 / 11 |
| Counter day figures | 12 / 13 | 22 / 24 |
| Customer search | 9 / 11 | 9 / 11 |
| 40 requests at once | 234 ms wall, 0 failed | 593 ms wall, 0 failed |

Every sales screen answers within 70 ms at the 95th percentile; the Workstream 1 target is 500 ms. No cache or new infrastructure was added.

## 4. Not run

Payment scenarios (H-013); the host; live data; tablet layouts.
