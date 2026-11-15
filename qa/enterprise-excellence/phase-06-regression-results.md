# Phase 6: regression results

Date: 2026-11-15. Every run below was made in this session on a freshly rebuilt local QA database by `qa/tools/run-gates.sh`, which now also runs `qa/sim/phase6-inventory.mjs` and `qa/sim/ui-phase6.cjs`.

## 1. Runs

| Run | Code | Result |
|---|---|---|
| Baseline | Phase 5 final (`c43ee25`) | All green (kept in the session scratch file `p6-baseline-gates.txt`) |
| First full run | Phase 6 code | Every server suite green, Phase 6 scenarios 102 of 102. Failures: the sweep's "every foreign key has an index" (the new `StockTransfer.createdById`), four browser suites that still expected the old behaviour (below), and 3 lint warnings over the baseline. All corrected |
| Second full run | Corrected | One Phase 6 scenario failed for a real reason: in "forty stock changes at once" one hold answered 500. The server log showed a database deadlock between a hold and a count correction on the same item (finding K-015). The run was stopped there, the lock order fixed, and a scenario added that fails without the fix |
| Third full run | Final code | **All green.** Results in section 2 |

### Older checks updated, and why

| Suite | Check | Why it changed |
|---|---|---|
| Every suite with a balance formula (`run.mjs`, `phase2-integrity.mjs`, `phase3-db.mjs`, `phase4-integration.mjs`, `db-facts.mjs`) | on hand = available + reserved + on hold | Now also + in transit (G-007) |
| `qa/sim/run.mjs`, `branch-boundary.mjs`, `phase2-integrity.mjs`, `phase3-db.mjs`, `phase4-integration.mjs` | A transfer moved the item at once | A transfer is now sent and then received by the other branch; the checks do both and then compare the same balances. Branch boundary gained 2 checks (39), Phase 3 gained 5 (612), Phase 4 gained 1 (555) |
| `qa/sim/run.mjs` | Generated order lines | 17 jobs reserved an item smaller than the line and are now refused (K-001). Generated lines are made to fit the stock item |
| `qa/sim/phase2-integrity.mjs` | Two transfers of one item at once | The item picked could already be in transit. The picker skips those; exactly one of the two still wins |
| `qa/sim/security.mjs`, `ui-shipping.cjs`, `ui-integration.cjs` | Reserved pounds of steel for a line counted in pieces | That was K-001 itself. They now receive shelf goods by the piece and reserve those. The sweep's stock section has 40 checks |
| `qa/sim/ui-inventory.cjs` | "Move" on the item page; the receiving heading | Now "Send to another branch", shown in transit, received by the other branch; the heading names open purchase order lines. 23 checks (22 before) |
| `qa/sim/ui-shop.cjs` | Weights compared as whole numbers | Compared to two decimals, as the screen shows them |

No check was removed or weakened.

### Proof that the new checks catch the defects

| Change made on purpose | Result | Restored |
|---|---|---|
| Reservation fit rules return "no problem"; the receiving-branch check removed from transfer receipt; the RECEIVE movement removed from a scrapped return | 8 scenarios fail: six reservation scenarios, "the sending branch cannot receive its own transfer", "a return that is scrapped is recorded coming back and going out" | Yes |
| The balance lock removed from holds | "a hold queues behind a stock change in progress" fails: the hold answers 500 | Yes |

## 2. Final results (third full run)

| Suite | Result | Phase 5 end |
|---|---|---|
| Order-to-cash simulation, seeds 8001 to 8003 | 150 of 150 jobs; reconciliation 0 problems after each seed (plus 52 in demo seed data) | Same |
| Database checks after the simulation and after the scenarios | 0 on every stock, reservation, transfer, purchase order and traceability check. Unchanged known rows from the demo seed: 2 invoices whose subtotal differs from their lines, 1 paid amount, 47 shipment lines, orders with no branch 59 and 62. After the scenarios 2 stock items have no heat: the shelf goods the scenarios received, as designed | Same checks plus 7 new |
| Security sweep | 20 of 20 sections | 20 of 20 |
| Branch boundary | 39 of 39 | 37 |
| Phase 2 integrity | 80 of 80 | Same |
| Phase 3 database scenarios | 74 of 74, 612 checks | 607 checks |
| Phase 4 integration scenarios | 66 of 66, 555 checks | 554 checks |
| Phase 5 sales scenarios | 76 of 76, 386 checks | Same |
| Phase 6 inventory scenarios (new) | 105 of 105, 486 checks: purchasing and replenishment 16, receiving and putaway 15, reservations, allocation and picking 15, consumption, remnants and scrap 15, interbranch transfers 17, returns, counts and adjustments 10, concurrency, security and recovery 17 | New |
| Unit tests | 158 of 158 | 149 |
| Browser: experience, shipping, shop, sales, inventory, integration, Phase 5 | 22, 29, 30, 24, 23, 33, 14 checks, 0 failed | Same, inventory 22 |
| Browser: Phase 6 (new) | 14 checks, 0 failed | New |
| Every screen opens | All routes open | Same |
| Baseline probe | All sections pass | Same |
| Department rule coverage | 332 changing routes, 0 with no rule | 323 |
| Screen audit | 0 screens with made-up data and no notice | 0 |
| Screen ratchets | At their ceilings (38, 0) | Same |
| Lint | Frontend clean; whole repository 0 errors, 1,528 warnings | 1,528 |
| Build | Succeeds | Same |
| Documents | 50 modules, every route file and screen placed in one | 48 |

## 3. Performance at 85 branches

Measured on `steelwise_qa_scale3` (85 branches, 100,233 stock items) after SQL Editor file 12, median and worst of 7 runs, in ms. Local machine, not the host.

| Screen | All-branch login | One-branch login |
|---|---:|---:|
| Stock items, first page | 48 / 55 | 6 / 8 |
| Stock items, search by part of a number | 116 / 136 | 6 / 7 |
| Stock item by exact number | 9 / 14 | not found (see below) |
| Stock balances, first page | 39 / 46 | 5 / 6 |
| Stock summary | 22 / 33 | 5 / 5 |
| Recent receipts | 32 / 42 | 6 / 7 |
| Transfers coming in | 6 / 8 | 6 / 7 |
| Purchase orders | 19 / 42 | 8 / 12 |
| Supply position | 271 / 313 | 49 / 55 |

Everything is inside the half-second target. The one-branch login's branch holds no stock in the scale copy, so that column measures the empty case only. The scale copy holds no transfers or purchase orders beyond a handful, so those two rows show the cost of the query, not of volume. No index was added beyond the foreign key index the sweep requires.

## 4. Not run

Scanner, label printer and scale tests (K-013, no hardware). Valuation, cycle count schedules and reorder calculations (not built: K-007, K-008, K-010). Sustained load. The host. Live data.
