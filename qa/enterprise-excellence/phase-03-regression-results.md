# Phase 3: regression and scenario results

Everything in this file was run in this session, on 2026-11-13, on local databases: `steelwise_qa`, rebuilt from nothing at the start of the run, and `steelwise_qa_scale3` for volume. Nothing was run against the live system. The run is `qa/tools/run-gates.sh`, started after the last code change of the phase and left undisturbed from start to finish. Result files are in `qa/results/`.

A line marked NOT EXECUTED or NOT VERIFIED is not a pass.

## 1. The full run on the final code

| Step | Result | At the end of Phase 2 |
|---|---|---|
| Order-to-cash simulation, seeds 8001, 8002, 8003 | 150 of 150 jobs; reconciliation 0 problems after each seed; 8 concurrency probes pass in each | 150 of 150 |
| Database consistency checks after the simulation (37 checks, read-only) | 0 problems outside the demo seed rows | 16 checks |
| Security and safeguards sweep | 20 of 20 sections | 20 of 20 |
| Branch boundary | 37 of 37 | 37 of 37 |
| Phase 2 integrity and concurrency | 80 of 80 | 80 of 80 |
| **Phase 3 database scenarios** (`qa/sim/phase3-db.mjs`) | **64 of 64 scenarios, 447 checks** | New in Phase 3 |
| Database consistency checks after the scenarios | 0 problems outside the demo seed rows; 3 shipment items shipped with nothing reserved (G-019, the current rule) | New in Phase 3 |
| Schema inventory from the catalogues | 159 tables, 188 foreign keys, 0 not validated, 24 value checks, 0 duplicate indexes, 0 failed migrations | New in Phase 3 |
| Unit tests (`npm test` in `src/backend`) | 118 of 118 | 105 of 105 |
| Browser suites: experience, shipping, shop floor, sales, inventory | 22, 27, 30, 24 and 22 checks, 0 failed | Same |
| Every route opens in a browser | 125 of 125, no crash | 125 |
| Baseline probe | 4 of 4 sections. 540 changing calls by view-only roles, 0 not refused. 275 changing routes sent an empty body, 0 server errors, 2 saves from nothing (both by design) | Same |
| Department rule coverage | 319 changing routes, 0 with no rule or stated reason | Same |
| Screen audit | 143 screens, 0 show made-up data without a notice | Same |
| Screen ratchets | 38 effect warnings (ceiling 38), 0 screens that invent records | Same |
| Lint, frontend | Passes | Passes |
| Lint, whole repository | 0 errors, 1,524 warnings | Same |
| Frontend production build | Passes | Passes |
| Three SQL Editor files, each run twice on the 85-branch copy | Second runs changed nothing; every rule validated | New |
| Deadlocks in the PostgreSQL log for the whole session | 0 | Not checked |
| Pull-request workflow on GitHub for the final commit | NOT VERIFIED when this file was written | |

**Test reach, measured from the server logs of this run:** 285 of 611 routes returned a success in a test (284 at the end of Phase 2); of the 319 routes that change data, 88 did (87 before). Phase 3 went deeper into routes already reached, not wider. Coverage by line of code was not measured and no figure for it is claimed.

## 2. The database scenarios

Each scenario drives the real server and then reads the database directly. The minimum asked for was 50, with 8, 8, 8, 8, 8 and 10 in the six groups. 64 were run.

### Inventory receiving and adjustments: 10 of 10 pass, 60 checks

| # | Scenario | Checks | Result |
|---:|---|---:|---|
| 1 | A receipt saves the item, its balance and its movement together | 9 | PASS |
| 2 | The same item number received twice is refused and nothing is added | 2 | PASS |
| 3 | A receipt naming a heat that is not on file saves nothing | 2 | PASS |
| 4 | A fractional weight is kept exactly as entered | 4 | PASS |
| 5 | Receiving more of an item adds exactly that much, with a movement | 7 | PASS |
| 6 | Receiving at a branch the item is not at, or a zero or negative quantity, changes nothing | 3 | PASS |
| 7 | An upload with one bad row saves the good rows and reports the bad one | 12 | PASS |
| 8 | A hold takes stock out of sale and a release puts it back, with the books in balance throughout | 13 | PASS |
| 9 | A warehouse login held to one branch cannot receive into another | 3 | PASS |
| 10 | The database itself refuses a negative balance, a broken balance and a movement of nothing | 5 | PASS |

### Reservations and material consumption: 9 of 9 pass, 63 checks

| # | Scenario | Checks | Result |
|---:|---|---:|---|
| 11 | A reservation moves quantity from available to reserved and is on file against the line | 9 | PASS |
| 12 | Reserving more than is available is refused and changes nothing | 2 | PASS |
| 13 | Reserving more than the order line still needs is refused | 7 | PASS |
| 14 | Cancelling an order gives every reservation back | 16 | PASS |
| 15 | Shipping reserved stock takes it off hand, writes the movement and updates the line | 10 | PASS |
| 16 | A part shipment leaves the rest reserved, and the order is not complete | 7 | PASS |
| 17 | Stock on hold cannot be reserved | 2 | PASS |
| 18 | A dispatch that hits a hold on one of two lines saves nothing for either line | 6 | PASS |
| 19 | Shipping a line that has no reservation: the order and invoice move, the stock does not (the current rule) | 4 | PASS |

### Work orders, scrap and remnants: 8 of 8 pass, 33 checks

| # | Scenario | Checks | Result |
|---:|---|---:|---|
| 20 | A work order runs from created to complete with weights, yield and a history line for each move | 6 | PASS |
| 21 | More cannot come off the line than went on, and weights cannot be negative | 3 | PASS |
| 22 | A completed work order cannot be completed again or cancelled | 4 | PASS |
| 23 | Steps out of order are refused | 4 | PASS |
| 24 | A work order needs a real, available source item | 3 | PASS |
| 25 | A remnant entered against its parent keeps the heat, grade and owner, and is traceable both ways | 10 | PASS |
| 26 | A remnant that names a different heat or grade than its parent, or a parent not on file, is refused | 1 | PASS |
| 27 | Completing a work order records the weights and leaves the stock balance alone (the current rule) | 2 | PASS |

### Interbranch transfers: 9 of 9 pass, 57 checks

| # | Scenario | Checks | Result |
|---:|---|---:|---|
| 28 | A transfer moves the whole item, on both records, with one movement, and creates or loses nothing | 10 | PASS |
| 29 | Part of a tracked item cannot be transferred | 2 | PASS |
| 30 | A transfer that names the wrong sending branch, the same branch or an unknown branch is refused | 5 | PASS |
| 31 | The same transfer sent twice at once happens once | 6 | PASS |
| 32 | Two transfers of one item to different branches at once: one wins and the ledger ends where the item is | 6 | PASS |
| 33 | A branch can send its stock to another branch but cannot pull stock from one it is not in | 5 | PASS |
| 34 | A reserved item transferred to the branch that will ship it keeps its reservation, and ships from there | 14 | PASS |
| 35 | A transfer out and back leaves two movements and the item where it started | 7 | PASS |
| 36 | An item with nothing on hand cannot be transferred | 2 | PASS |

### Orders, invoicing and financial records: 10 of 10 pass, 72 checks

| # | Scenario | Checks | Result |
|---:|---|---:|---|
| 37 | Order to invoice: every amount is exact to the cent and the totals add up | 7 | PASS |
| 38 | Two part shipments: tax and freight are billed once in total, to the cent | 6 | PASS |
| 39 | Payments: the paid amount is the sum of the payments, and an overpayment is refused | 8 | PASS |
| 40 | Credit memos: linked to the invoice, never more than it, and the money owed back is exact | 8 | PASS |
| 41 | An order whose total does not equal subtotal + tax + freight is refused or corrected, never saved wrong | 4 | PASS |
| 42 | An order with one bad line saves no part of the order | 2 | PASS |
| 43 | A quote keeps its price when it becomes an order, and belongs to the branch of the person who wrote it | 8 | PASS |
| 44 | The database refuses money that does not add up, whoever writes it | 8 | PASS |
| 45 | Voiding a counter sale: stock back, credit memo, refund and the void mark all happen together | 14 | PASS |
| 46 | A credit that fails part-way saves nothing: no memo, no refund, and the step before it is undone | 7 | PASS |

### Concurrency, retries and failure recovery: 18 of 18 pass, 162 checks

| # | Scenario | Checks | Result |
|---:|---|---:|---|
| 47 | Two orders reserving the last of one item at once: exactly one gets it | 6 | PASS |
| 48 | Eight reservations at once against one item never reserve more than it holds | 6 | PASS |
| 49 | One order line reserved from two items at once is never reserved beyond what it needs | 49 | PASS |
| 50 | Cancelling an order while stock is being reserved for it leaves no reservation behind | 25 | PASS |
| 51 | Two people changing one order at once: one wins and the other is told | 3 | PASS |
| 52 | The same order sent three times at once with one request key is saved once | 4 | PASS |
| 53 | Request keys: a different body is refused, another user is separate, and a refused request can be corrected and sent again | 9 | PASS |
| 54 | A key claimed by a request that never finished is taken over after a minute, not blocked for ever | 4 | PASS |
| 55 | One shipment dispatched four times at once leaves the shelf once and is billed once | 7 | PASS |
| 56 | Five payments at once on one invoice: the balance is taken once | 2 | PASS |
| 57 | Three part payments at once that together fit: all are taken and the total is exact | 2 | PASS |
| 58 | Stock received while reservations are being made: neither is lost | 6 | PASS |
| 59 | The same item number received five times at once becomes one item | 2 | PASS |
| 60 | Two managers changing one list price at once: one price stands and both changes are on record | 3 | PASS |
| 61 | A return received four times at once is counted once and credited once | 9 | PASS |
| 62 | Two work orders raised on one item at once each get their own number and nothing is lost | 4 | PASS |
| 63 | Eighty orders entered at the same moment each get their own number, and none is lost | 3 | PASS |
| 64 | The books are in balance at every moment while forty changes run at once | 18 | PASS |

Every scenario that changes stock also runs the four-part books check on each item it touched (balance identity, reserved against reservation rows, on hand against the movement ledger, item branch against balance branch). Scenarios in the money group read amounts as text from the database to prove no digit beyond the cent is stored.

**What the scenarios recorded but did not assert**, because the behaviour is the current rule and the rule is the owner's:

- Shipping without a reservation: a dispatch of 300 lb with nothing reserved was accepted, invoiced, and left no stock movement. No stock item, and so no heat, is recorded against that shipment, and no balance went down. Whether a shipment must be fully reserved before it can leave is the owner's rule; recorded as finding G-019.
- Remnant quantity: entering a 51.25 lb remnant left its parent at 6000 lb. The application does not take the remnant out of the parent, because processing moves no stock (M-016). Not asserted; recorded as finding G-006.
- Work order completion: 2000 lb is still on hand for an item whose work order recorded 1900 lb out and 100 lb scrap. What processing consumes and produces is the owner's rule (M-016, REQUIRES BUSINESS DECISION).
- Transfers: on the real stock list a transfer is one immediate step. There is no request, approval, picking, in-transit or receipt stage, so partial receipt, shortage, damage in transit, lost in transit and duplicate receipt cannot occur and were NOT EXECUTED. Recorded as finding G-007.
- Two work orders on one item: 2 open work orders now name the same 4000 lb item as their source, each with 4000 lb as input. The application does not claim an item for a work order, because processing moves no stock (M-016). Whether one item may feed several work orders is the owner's rule; recorded as finding G-008.

## 3. Proof that the new checks fail without the fixes

| Check | Run against | Result |
|---|---|---|
| The first 61 scenarios | The code before correction batch 2 | 53 of 61 passed (`qa/results/phase3-db-before-fixes.json`). Of the eight failures, four came from mistakes in the test's own inputs, two from rules I had assumed and the product does not have, and two were real defects, listed next |
| One order line reserved from two items at once | Same | Over-reserved in 6 of 6 rounds |
| Cancelling while reserving | Same | Reservation left on the cancelled order in 6 of 6 rounds |
| Eighty orders at once | The code before correction batch 3 | 72 saved, 8 server errors |
| `test/numbering.test.js`, two new tests | `lib/numbering.js` before the fix | Both fail |
| Residue check in `db-facts` | The code before `lib/moneyColumns.js` | 12 columns with residue; 8 of 62 invoices |
| Sweep rule "every foreign key has an index" | The first version of migration 6 | Failed with 8 unindexed keys; indexes were added to the migration |
| Refused direct writes (13) | The schema before migration 6 | Not run against the old schema. The checks and keys did not exist, so the writes would have been accepted |

## 4. Tests that failed during the phase, and what was done

Nothing below was hidden or skipped. Each was run again after the correction and is in the final run above.

| What failed | Cause | Correction |
|---|---|---|
| Line over-reserved; cancelled order kept stock | Product defect (G-004) | Order row lock; checks moved inside the transaction |
| 8 of 80 simultaneous orders lost | Product defect (G-017) | Numbering widens its search after collisions |
| "Stock reserved for an order cannot be transferred" | My reading was wrong. The simulation showed that reserving at one branch and transferring to the branch that ships is an established workflow, and two simulated jobs failed on my refusal | The refusal was withdrawn; the scenario now proves the reservation travels with the item and ships from the new branch |
| "Two work orders on one item: at most one open" | The assertion was a rule I assumed. Nothing in the product claims an item for a work order | The scenario now asserts what is verifiable and records the open question (G-008) |
| Hold scenarios (3) and the upload scenario | Wrong hold type and upload type names in the test's requests | Test inputs corrected; no product change |
| Sweep: every foreign key has an index | My migration added 8 keys without indexes | Indexes added to the schema and the migration |
| Sweep crashed when run alone | It expects the simulation's orders to exist | None needed: the gates run the simulation first. Not a product fault |
| Counter-sale void and held-dispatch scenarios, inside the full run only | They relied on shelf stock and on a customer's credit room that earlier suites had used up | The scenarios now create their own shelf stock and use a customer with no credit limit |
| Two full gate runs before the final one | Each was followed by a code change (the numbering fix, then scenario and lint corrections) | Superseded. Only the last run, on the final code, is reported |

## 5. Cross-module regression

| Module | Evidence in the final run |
|---|---|
| Sales | Simulation families for quotes, orders, counter and web; sales browser suite (24); order entry sweep section (43) |
| Purchasing | Not built (I-007). Nothing to regress |
| Inventory | Simulation receiving and transfer families; inventory browser suite (22); 19 scenarios in two groups |
| Work orders and production | Simulation multi-step families; shop browser suite (30); Phase 2 integrity (80); 8 scenarios |
| Shipping | Simulation; shipping browser suite (27); dispatch scenarios |
| Invoicing and finance | Simulation reconciliation; 10 scenarios; sweep money section (37) |
| Dashboards and reporting | Every screen opens (125); figures not compared with records (NOT VERIFIED, as in Phase 2) |
| Permissions | Sweep; baseline probe (540 refusals); branch boundary (37); department coverage (319) |
| Notifications, imports and exports, background jobs, external integrations | Uploads tested (scenario and sweep). The rest do not exist or are Phase 4 |

## 6. Quality gates

| Gate | Requirement | Evidence | Result |
|---|---|---|---|
| A. Schema integrity | Critical relationships and constraints are right; migrations succeed; no critical orphan or duplicate | 188 foreign keys, 0 not validated; 24 value checks; 13 direct bad writes refused; 26 migrations, 0 failed; orphans only in sample modules; no duplicate business numbers on a unique column | PASS for the order-to-cash tables. Open: 217 unconstrained references elsewhere (G-003); B-009 not migrated |
| B. Inventory integrity | Ledger and balances reconcile; movements traceable; no unexplained change | 14 inventory checks at 0; books check after every stock operation in 64 scenarios; simulation reconciliation 0 problems | PASS for what the application records. NOT MET for what it does not: unreserved shipments (G-019), processing (M-016), adjustments (I-016), in-transit (G-007) |
| C. Financial integrity | Order, pricing, invoice and payment records consistent; history preserved | 11 financial checks at 0; exact cents; totals enforced by the database; partial shipments add to the cent | PASS. Open: G-019 bills a shipment that moved no stock |
| D. Transaction reliability | Atomic; safe under simultaneous use; retries do not duplicate | Section 2 of `phase-03-transaction-safety.md`; 18 concurrency scenarios; forced failures; request keys; 0 deadlocks | PASS for what was tested. Open: G-008, G-020; test 5 not executable |
| E. Security and isolation | Tenant and location boundaries enforced; no unauthorized cross-location access | Branch boundary 37 of 37; quotes and requests now held (G-012); sweep; probe | PASS for the record types covered. Open: C-009 remainder, G-011, G-018 |
| F. Performance | Critical queries measured; improvements shown; no critical query without reason | 14 plans; branch screens at 85 branches all within target; load to 400 at once | PASS on a local machine. The host was not measured. No query needed an improvement, so none is shown; two are recorded as growing with the company (G-013) |
| G. Regression | Existing workflows still work; existing tests pass | Section 1 | PASS |
| H. Migration and recovery | Migrations tested; rollback or recovery documented; data-change risks disclosed | Each file run twice at volume; rollback per change documented; risks in `phase-03-migration-review.md` | NOT MET in full: no dry run on live data, and no backup or restore verified (E-015) |

Gates B and H are why the phase is not reported as verified complete.
