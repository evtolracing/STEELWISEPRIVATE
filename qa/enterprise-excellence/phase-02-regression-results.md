# Phase 2: regression and scenario results

Everything in this file was run in this session, on 2026-11-13, on a local database named `steelwise_qa`, rebuilt from nothing at the start of the run. Nothing was run against the live system. The run is `qa/tools/run-gates.sh`, started after the last code change of the phase. Result files are in `qa/results/`.

A line marked NOT EXECUTED or NOT VERIFIED is not a pass.

## 1. The full run on the final code

| Step | Result | Before Phase 2 |
|---|---|---|
| Order-to-cash simulation, seed 8001 | 50 of 50 jobs, 714 steps, 784 checks, 0 failed | 50 of 50 |
| Order-to-cash simulation, seed 8002 | 50 of 50 jobs, 709 steps, 785 checks, 0 failed | 50 of 50 |
| Order-to-cash simulation, seed 8003 | 50 of 50 jobs, 711 steps, 788 checks, 0 failed | 50 of 50 |
| Reconciliation after each seed (stock, orders, invoices, payments) | 0 problems | 0 |
| Eight concurrency probes, each seed | 8 of 8 pass, three times | 8 of 8 |
| Database consistency checks (read-only) | 0 problems outside the demo seed rows | Counter-sale lines moved no stock |
| Security and safeguards sweep | 20 of 20 sections | 20 of 20 |
| Branch boundary (`qa/sim/branch-boundary.mjs`) | 37 of 37 | New in Phase 2 |
| Phase 2 integrity and concurrency (`qa/sim/phase2-integrity.mjs`) | 80 of 80 | New in Phase 2 |
| Unit tests (`npm test` in `src/backend`) | 105 of 105 | 90 of 90 |
| Browser suite: experience | 22 checks, 0 failed | Same |
| Browser suite: shipping | 27 checks, 0 failed | Same |
| Browser suite: shop floor | 30 checks, 0 failed | Same |
| Browser suite: sales | 24 checks, 0 failed | Same |
| Browser suite: inventory | 22 checks, 0 failed | Same |
| Every route opens in a browser | 125 of 125, no crash | 125 |
| Baseline probe | 4 of 4 sections. 540 changing calls by view-only roles, 0 not refused. 275 changing routes sent an empty body, 0 server errors, 2 saves from nothing (both by design) | 3 server errors, 7 saves from nothing |
| Department rule coverage (`qa/tools/access-coverage.mjs`) | 319 changing routes, 0 with no rule or stated reason | New in Phase 2 |
| Screen audit | 143 screens, 0 show made-up data without a notice | Same |
| Screen ratchets (`qa/tools/frontend-checks.mjs`) | 38 effect warnings (ceiling 38), 0 screens that invent records | New in Phase 2 |
| Lint, frontend | Passes | Passes |
| Lint, whole repository | 0 errors, 1,524 warnings | Same |
| Frontend production build | Passes | Passes |
| SQL Editor file for `Order.locationId`, run twice on a populated copy | Second run changed nothing | New in Phase 2 |
| Pull-request workflow on GitHub for the final commit | NOT VERIFIED when this file was written | |

**Test reach, measured from the server logs of this run:** 284 of 611 routes returned a success in a test (269 before Phase 2); of the 319 routes that change data, 87 did (72 before). Coverage by line of code was not measured and no figure for it is claimed.

## 2. Proof that the new checks fail without the fixes

| Check | Run against | Result |
|---|---|---|
| `phase2-integrity`, as it stood after batch 3 (43 checks) | The code before batches 2 and 3 | 32 of 43 failed |
| `branch-boundary` (37 checks) | The final code with the boundary switched off | 25 failed |
| `frontend-checks` | The code before batch 5 | 2 screens reported as inventing records |
| `access-coverage` | The rule table before batch 4 | Routes in 16 areas reported with no rule |
| Baseline probe with a ceiling of 0 server errors | The code before batch 5 | 3 server errors |
| Database check on counter sales | The code before batch 4 | Every counter-sale line reported |

## 3. Tests that failed during the phase, and what was done

Nothing below was hidden or skipped. Each was run again after the correction and is in the final run above.

| What failed | Cause | Correction |
|---|---|---|
| Shop browser suite, one check ("yield 100") | A test fixture I added (a 1 lb shelf item) was picked up by the suite as its work order source | The fixture, not the product code: the shelf item is now 250 lb. No check was changed |
| `phase2-integrity`: the same counter sale sent three times for the last piece on the shelf | The second and third copies were refused for stock before the server noticed they were copies | Product code: a refused copy is now answered with the first sale |
| Baseline probe: three "crashes" | The three counter pricing routes now answer 501 "not built"; the probe counted any 5xx as a crash | The probe counts 501 as a plain answer; a 500 still fails it |
| Baseline probe: one view-only call "not refused" | The cockpit "explain" route is a question, not a change | Added to the list of ask-only routes in `lib/roleAccess.js`, with a unit test |
| `phase2-integrity` on its first run against old code | It promoted a regional login to super admin (the defect C-001 itself), which polluted the QA database | The database was rebuilt; the fix went in; the check now proves the refusal |
| A gate run in the middle of the phase | I ran other tests against the same server at the same time | That run was discarded. The final run was left undisturbed from start to finish |

## 4. The ten concurrency tests

Detail and evidence are in `phase-02-transaction-safety.md`, section 2. In short:

| # | Test | Outcome |
|---|---|---|
| 1 | Two users reserving the same material | PASS |
| 2 | Duplicate order submissions | PASS for the counter sale. Staff order entry and the web store have no duplicate protection: NOT PROTECTED, finding C-006, deferred to Phase 3 |
| 3 | Simultaneous inventory adjustments | PASS for holds and transfers. Stock adjustment itself does not exist (I-016) |
| 4 | Concurrent transfer receipts | NOT EXECUTED: a transfer is immediate, there is no receipt step to race |
| 5 | Repeated shipment confirmation | PASS |
| 6 | Duplicate invoice generation | PASS |
| 7 | Work order completion during cancellation | PASS |
| 8 | Interrupted processing | PASS for a save refused part-way (nothing is left behind). A dropped database connection was NOT EXECUTED |
| 9 | Retried requests | PASS |
| 10 | Out-of-order events | PASS |

## 5. The twenty end-to-end scenarios

"Executed" means the steps ran through the real server and database and the records were checked afterwards.

| # | Scenario | Executed | Result | Evidence |
|---|---|---|---|---|
| 1 | Standard metals order, quote to fulfillment | Yes | PASS | Simulation families `standard-metals` (5 per seed) and `quote-to-order`: order, reservation, job, shipment, delivery, invoice, payment, reconciled |
| 2 | Multi-step processing work order | Yes | PASS | Family `multi-step-metals` (5 per seed); `phase2-integrity` plans a job and runs its operations in order |
| 3 | Plastics processing order | Yes | PASS | Family `plastics` (6 per seed) |
| 4 | POS sale | Yes | PASS | Families `pos-ecommerce` and `quick-sale`; `phase2-integrity`: the sale takes shelf stock, a short shelf is refused, a void returns the stock |
| 5 | Ecommerce order | Yes | PASS | Family `pos-ecommerce`; the sweep's web-store sections (a customer sees only their own orders, totals saved) |
| 6 | Inventory receiving and reservation | Yes | PASS | Family `transfers-receiving` (5 per seed); probe 1 above |
| 7 | Branch-to-branch transfer | Yes | PASS | Family `transfers-receiving`; `branch-boundary`: you can send to a branch you are not in, you cannot pull from one |
| 8 | Cross-location fulfillment | Yes | PASS | Family `multi-location` (6 per seed) |
| 9 | Partial shipment | Yes | PASS | Family `partial-rework-return` (5 per seed): the order becomes PARTIAL, then COMPLETE |
| 10 | Work order cancellation | Yes | PASS | `phase2-integrity`: cancel against complete, 4 rounds; operations of a cancelled job refused |
| 11 | Material remnant generation | **No** | NOT EXECUTED | Completing a work order moves no stock, so processing cannot produce a remnant. What it should consume and produce is the owner's rule (M-016, REQUIRES BUSINESS DECISION). What does exist was run: a remnant entered by upload takes its heat and grade from its parent (sweep), and remnant pricing answers |
| 12 | Pricing override with authorization | In part | PASS for what exists | Sweep: an override is saved under the signed-in clerk, appears on its order, a clerk cannot read the log or revoke, a manager can; a list price change needs a manager and is recorded; an order over the credit limit is released by a manager. A price below a floor approved line by line does not exist as a function |
| 13 | Customer return and credit | Yes | PASS | Family `partial-rework-return`; probe: one return received three times is counted once, with one credit memo |
| 14 | Concurrent inventory reservation | Yes | PASS | Probe 1, three seeds |
| 15 | Duplicate request handling | In part | PASS where protection exists | Counter sale, dispatch, invoice, payment, return receipt, operation completion. Order creation is not protected (C-006) |
| 16 | Unauthorized cross-location access | Yes | PASS | `branch-boundary`, 37 checks: read, list, change, delete, create and totals across 15 record types |
| 17 | Background job failure and retry | **No** | NOT EXECUTED | The application has no background jobs, queue or scheduler (B-018 BLOCKED, B-019 REQUIRES BUSINESS DECISION). There is nothing to fail or retry |
| 18 | Shipping confirmation | Yes | PASS | Every simulated job that ships; proof of delivery checked (sweep); shipping browser suite, 27 checks |
| 19 | Invoice generation | Yes | PASS | Every simulated job that ships; probe: invoiced three more times, billed once |
| 20 | Corporate reporting after operational changes | In part | NOT VERIFIED | The dashboards, executive and analytics routes answer after the simulation (smoke and sweep), and a branch login's totals count only its own branch (`branch-boundary`). No test compares a reported figure with the records it summarises. Assigned to the reporting phase |

Seventeen scenarios executed and passed in whole or for the part the application supports. Two could not be executed (11, 17), for the reasons given. One is not verified (20).

## 6. Quality gates

| Gate | Requirement | Evidence | Result |
|---|---|---|---|
| A. Build and static quality | Builds; lint; no new errors | Frontend build passes; frontend lint passes; repository lint 0 errors (1,524 warnings, unchanged); ratchets hold | PASS |
| B. Functional regression | Existing behaviour unchanged | 150 of 150 simulated jobs; 125 browser checks in five suites; 125 screens open; sweep 20 of 20 | PASS |
| C. Transaction and data integrity | All-or-nothing saves; clean reconciliation; safe under simultaneous use | Reconciliation 0 problems on three seeds; 8 probes; `phase2-integrity` 80 of 80 | PASS for what was tested. Open: C-006, C-010, test 4 and a dropped connection not executed |
| D. Security and access | Sign-in, role, department and branch on the server | Sweep; probe (540 refusals, 0 misses); coverage 319 of 319; `branch-boundary` 37 of 37; login rules (C-001) | PASS for 15 record types. Open: C-009, E-014 |
| E. API contracts | No incompatible change; documented | `qa/api-contract.md`: 203 screen calls match a route, the 80 that do not are all in labelled sample modules; five browser suites pass against the changed server; changes listed in `phase-02-api-contracts.md` | PASS. Open: E-021 (several reply shapes) |
| F. End-to-end scenarios | The 20 scenarios | Section 5 | NOT FULLY MET: 2 not executable, 1 not verified |
| G. Documentation and traceability | Every finding dispositioned; files written | 223 findings, 0 without a status or, when deferred, without the seven required fields; nine Phase 2 files; registers rebuilt by tool | PASS |

Gate F is why the phase is not reported as complete.
