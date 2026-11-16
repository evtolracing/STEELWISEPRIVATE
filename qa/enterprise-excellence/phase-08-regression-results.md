# Phase 8: regression results

Everything below was run in this session, on a local database whose name contains `qa`, rebuilt from the migrations before each full run. Nothing was run against the live database or the host. No shipment was sent, no invoice or notice left the machine, no payment was processed, and no carrier, printer, scale or scanner was used.

## 1. Runs

| Run | Code | What it showed |
|---|---|---|
| Baseline | Commit `b2e8c5d` (end of Phase 7), before any Phase 8 change | Every suite passed except one Phase 5 scenario, 75 of 76. The failure was in the test, not the product: the scenario lapsed a quote "at the start of today", and between midnight and the branch's start of day that moment is still in the future (N-024). The sales dashboard was right |
| Probe on the starting code | `qa/sim/p8-probe.mjs`, same commit | Reproduced the Phase 8 defects before any correction: stock at another branch leaving a dock (N-001), a dock unable to ship another branch's order (N-002), a delivery and a road problem recorded with nothing (N-003, N-004), a closed account shipped to (N-005), a cancelled order with a live shipment (N-006), the packaging chain that could not be finished (N-008), forged custody records (N-011), and stock cost shown to roles that must not see it (N-020) |
| First full run | Phase 8 code before N-029 | Every suite passed: 150 of 150 Phase 8 scenarios, and every older suite. The server log of the run was then read call by call. It showed three things the scenarios had not caught: six dispatch requests answered 500 (N-029, below), one database check that counted the wrong series, and one order whose subtotal did not match its lines |
| Second full run | Final code | The result of record. Section 2 |

### What the first full run found, and what was done

- **N-029 (P2), a real defect.** A cancel and a dispatch of the same order in the same instant: the database stopped one of the two as a deadlock, and the server answered 500 to that user. No record was wrong in any round, which is why the scenario had passed. The retry in `lib/numbering.js` now recognises the form in which the database client reports this event, the order save in `routes/orders.js` uses the retry, and the user who loses is told plainly (409). The scenario now also fails if any answer is a server error.
- **A check that counted the wrong thing.** The database check "an invoice counter behind its highest invoice number" compared the invoice counter with the package, tag and listing series that Phase 8 moved to the same counter table (N-012). The check was split in two: one for the invoice series, one for the three packing series. Both read 0. No product change.
- **A fixture that did not add up.** One Phase 8 scenario cancelled an order line by writing to the database directly and did not correct the order's totals, so the standing check "order subtotal differs from the sum of its lines" read 1. The fixture now corrects the totals as the product's own route does. No product change.

### Older checks updated, and why

None was removed and none was loosened. Each change follows a rule that Phase 8 made stricter or a screen label that changed.

| Check | Change | Reason |
|---|---|---|
| `qa/sim/branch-boundary.mjs` | A user at another branch changing a shipment now expects 403 from the dock rule, then 404 for a shipment of a third branch, and confirms nothing was written | N-002: the selling branch can now read a shipment leaving another dock, so "not found" became "not yours to change" for that reader |
| `qa/sim/phase2-integrity.mjs` | Deliveries send the receiver's name | N-004: a delivery with neither a name nor a reason is refused |
| `qa/sim/phase5-sales.mjs` | The quote is lapsed one second ago, not at the start of today | N-024: the test failed between midnight and the start of the branch's day |
| `qa/sim/ui-shipping.cjs` | The delivery field is found by its new label "Received by"; one check added that the button stays disabled until a name or a reason is given (29 checks became 30) | N-004 |
| `qa/sim/ui-integration.cjs` | The fixture ships from the branch that sold the order; label as above | N-001, N-004 |
| `src/backend/test/branchScope.test.js` | The expected branch rule for shipments and print jobs | N-002, N-015 |

### Proof that the new checks catch the defects

Each rule was removed from the source, the server restarted, the scenario group run, and the source restored (`git diff` clean of the mutation afterwards).

| Rule removed | Scenarios that then fail |
|---|---|
| N-001 stock at another branch does not leave this dock | 1 |
| N-002 the selling branch sees the shipment | 1 |
| N-002 only the dock it leaves from changes a shipment | 1 |
| N-003 a problem on the road needs a reason | 1 |
| N-004 a delivery needs a name or a reason | 1 |
| N-005 a closed account does not ship | 1 |
| N-006 cancelling an order cancels its dock shipments | 1 |
| N-007 a payment date is not in the future | 1 |
| N-008 an empty package is not sent to quality | 1 |
| N-008 a tag needs quality release | 1 |
| N-009 the heat typed is checked against the stock item | 1 |
| N-010 a voided tag stays void at sealing | 1 |
| N-010 seal only after every tag is applied | 1 |
| N-011 a custody note is in the writer's own name | 1 |
| N-011 a made-up custody record is refused | 1 |
| N-013 a tag step taken twice happens once | 1 |
| N-013 a package step locks the package | 1 |
| N-014 nothing invented on shipping papers | 1 |
| N-015 each branch its own print jobs | 1 |
| N-016 a return without its credit is flagged | 1 |
| N-016 two managers settling at once leave one record | 1 |
| N-017 cost fixed on the movement at shipping | 7 |
| N-018 an unpaid order is not closed | 1 |
| N-019 text on a paper cannot carry markup | 1 |
| N-020 stock cost stays with cost viewers | 1 |
| N-021 a typed credit over what is left is refused | 1 |
| N-022 overlaps met by a raw statement are run again | 2 |
| N-023 a waiting paper is brought up to date | 1 |
| A print job is settled once | 1 |
| A further copy of a tag after three needs a manager | 1 |
| N-029 a deadlock reported by the database client is run again | 1 |

31 rules, each of which made at least one scenario fail.

Two further removals made no scenario fail, and are recorded as such, not counted:

- "A pretend hold is refused" (N-011): a second check in the same route refuses the same request, so removing one of the two changes nothing a user can see.
- "A missing credit is settled once" (N-016), the check before the save: the save itself is conditional, and removing that condition is the mutation "two managers settling at once", which does fail.

One more is stated plainly because it is not proven by mutation. The retry around the order save (N-029, second half) was run 36 rounds with no error. Without it about one round in twelve failed, so removing it does not fail the scenario reliably, and it is not counted among the 31. The first half of N-029, the recognition of the deadlock, is counted.

N-024 is a correction to a test. It is recorded FIXED — NOT VERIFIED because its proof depends on the time of day: the corrected test passed in both full runs, one of which ran inside the hours in which the old test failed.

## 2. Final results (second full run, final code)

| Check | Baseline (`b2e8c5d`) | Second full run, final code |
|---|---|---|
| Order-to-cash simulation, seeds 8001 to 8003 | 150 of 150 jobs, 0 reconciliation problems | 150 of 150 jobs, 0 reconciliation problems; payment and return races taken once in each seed |
| Security and safeguards sweep | 20 of 20 sections | 20 of 20 sections |
| Branch boundary | 39 of 39 | 39 of 39 |
| Phase 2 integrity | 82 of 82 | 82 of 82 |
| Phase 3 database scenarios | 74 of 74, 612 checks | 74 of 74, 612 checks |
| Phase 4 integration scenarios | 66 of 66, 555 checks | 66 of 66, 555 checks |
| Phase 5 sales scenarios | 75 of 76, 386 checks (N-024, a test defect) | 76 of 76, 386 checks |
| Phase 6 inventory scenarios | 106 of 106, 494 checks | 106 of 106, 494 checks |
| Phase 7 manufacturing scenarios | 141 of 141, 618 checks | 141 of 141, 618 checks |
| Phase 8 fulfilment scenarios | did not exist | 150 of 150, 496 checks |
| Unit tests | 178 of 178 | 201 of 201 |
| Browser suites | 22, 29, 31, 24, 23, 33, 14, 14, 39 | 22, 30, 31, 24, 23, 33, 14, 14, 39, and the new Phase 8 suite 45; 275 checks, 0 failed |
| Every screen opens | 128 of 128 | 130 of 130 (two new screens) |
| Read-only roles cannot change anything | 568 write calls, 0 not refused | 574 write calls, 0 not refused |
| Write routes sent an empty body | 289 routes, 0 server errors | 292 routes, 0 server errors |
| Changing routes under a rule | 334, 0 with no rule | 337, 0 with no rule |
| Screens showing made-up data with no notice | 0 | 0 |
| Lint | 0 errors, 1,526 warnings | 0 errors, 1,522 warnings |
| Screen ratchets | 38 of ceiling 38; 0 of ceiling 0 | 38 of ceiling 38; 0 of ceiling 0 |
| Production build | passes | passes |
| Findings on file | 321, 92 open | 350, 94 open |

Server errors in the run, read from the server logs: four answers of 500, the same four as the baseline, each planted by a scenario that breaks a save on purpose to prove nothing is half-saved (the log shows "QA injected billing failure", "qa planted failure" and "QA fault" before each). No dispatch and no order save answered a server error; the first run had six. The answers of 501, 502, 503 and 504 are the addresses that say "not built" and the assistant and speech addresses, which have no outside service in this environment; the same as the baseline.

The Phase 8 scenario count of checks is 496 here and 495 in the first run: one check was added to the cancel-against-dispatch scenario for N-029.

### Phase 8 scenarios by group

| Group | Required | Run | Verify built behaviour | Record a capability that is not built |
|---|---:|---:|---:|---:|
| 1. Finished goods release, picking and packaging | 20 | 20 | 20 | 0 |
| 2. Shipment creation, partial shipments and back orders | 25 | 25 | 25 | 0 |
| 3. Dispatch, carriers, freight and delivery | 25 | 25 | 21 | 4 |
| 4. Invoicing, payments and accounting sync | 25 | 25 | 22 | 3 |
| 5. Costing, reconciliation and closeout | 20 | 20 | 19 | 1 |
| 6. Returns, credits, refunds and adjustments | 15 | 15 | 15 | 0 |
| 7. Concurrency, security, exceptions and recovery | 20 | 20 | 20 | 0 |
| Total | 150 | 150 | 142 | 8 |

The eight NOT APPLICABLE scenarios each show, from the code and the database, that the capability does not exist, and invent nothing in its place: carrier rate shopping; parcel, LTL and truckload booking; carrier tracking updates; freight cost against freight billed; posting to an accounting system; card authorisation, capture and settlement; period close; overhead, freight cost, landed cost and cost of goods. They are counted as scenarios run, not as capabilities verified.

### Database checks added in Phase 8 (`qa/tools/db-facts.mjs`)

Read after the second full run.

| Check | Count |
|---|---:|
| Dispatched shipments whose stock movements add up to more than the shipment carries | 0 |
| Shipments still on the dock for a cancelled order | 0 |
| Packages with more than one live tag | 0 |
| Returns whose missing credit was settled more than once | 0 |
| Stock movements for a shipment with a negative cost | 0 |
| Package, tag or listing series whose counter is not the highest number on file (split from the invoice counter check, which also reads 0) | 0 |
| Shipments on the road or delivered with no invoice | 9 |
| Shipments delivered with neither a name nor a reason | 48 |

The last two are counts to be read, not rules that must be 0.

- The 9 shipments with no invoice are 4 of the demo seed and 5 made by scenarios, among them the ones that break billing on purpose (the server log shows the planted failure). The five were not traced one by one. Each is listed for billing in the integration report, which is what the count verifies.
- The 48 deliveries with neither a name nor a reason are 47 of the demo seed, written by the seed script and not through the delivery step, and 1 that a closeout scenario strips on purpose to stand for a delivery recorded before this phase. The server log shows that one was delivered through the product with a name. No delivery made through the product in this run lacks both: N-004. The same count can be read on the live database with `check-before-phase-8.sql`.

All 75 database checks were read after the run. 64 read 0. The 11 that do not are counts of demo seed data and of records the scenarios make on purpose; apart from the two above, each equals its baseline value except "shipments delivered with no proof of delivery name", 47 at the baseline and 51 now, the four added being three deliveries the new scenarios record with a written reason in place of a name, and the one stripped on purpose.

## 3. Performance at 85 branches

Database `steelwise_qa_scale3`: 85 branches, SQL files 13 and 14 applied, with 20,000 print jobs added for this measurement only. Median of 7 calls, milliseconds, local machine, measured on the Phase 8 code before the N-029 correction (which changes no query). The host is NOT VERIFIED.

Scale data: 72,565 orders, 50,869 shipments, 37,625 invoices, 20,000 print jobs. "All" is a login that sees every branch; "Branch" is a login held to one branch.

| Call | All, median (worst) | Branch, median (worst) | Answer size |
|---|---:|---:|---:|
| Shipments list, first page | 13 (14) | 13 (15) | 55 KB |
| Shipments on the dock | 13 (17) | 16 (22) | 55 KB |
| One shipment | 9 (14) | 13 (14) | 2 KB |
| Its papers (pick list, packing list, bill of lading data) | 10 (12) | 11 (13) | 1 KB |
| What can ship for its order | 9 (12) | 9 (14) | 1 KB |
| Invoices list, first page | 18 (19) | 15 (18) | 62 KB |
| Invoices, overdue only | 8 (10) | 11 (13) | 11 KB |
| One invoice | 8 (12) | 12 (14) | 1 KB |
| Owed by age | 6 (7) | 8 (10) | 6 KB |
| Orders not closed, first page | 133 (164) | 206 (228) | 19 KB |
| Orders not closed, still to ship | 10 (17) | 11 (12) | 21 KB |
| Orders not closed, unpaid, page 20 | 13 (15) | 14 (19) | 0 KB |
| Closeout of one order | 11 (14) | 12 (19) | 1 KB |
| Cost and margin of one order | 8 (9) | 8 (10) | 1 KB |
| Returns list | 25 (29) | 36 (39) | 25 KB |
| Print queue | 7 (11) | 7 (7) | 24 KB |
| Packages ready for a tag | 12 (17) | 12 (15) | 48 KB |
| Integration report | 11 (11) | refused (403), as intended | 9 KB |

Range of medians: 6 to 206 ms. The slowest is the first page of orders not closed, which works out the closeout position of each order on the page; every other call is under 40 ms.

No packages or drop tags exist in the scale data, so the packing screens were not timed at scale. That is recorded as not measured, not as fast.

## 4. Not run

| Subject | Status |
|---|---|
| The live database and the host | NOT VERIFIED. No access from this environment. The read-only script `check-before-phase-8.sql` is written for the owner to run |
| SQL Editor file 14 on the live database | NOT VERIFIED. Run twice on a local copy; the second run changed nothing |
| A printer, a label printer, a scale, a scanner | NOT EXECUTED. No hardware. The papers were read in a browser, not printed |
| A carrier, a freight rate, a tracking feed | NOT APPLICABLE. None is connected (N-026) |
| An accounting system, a ledger, cost of goods | NOT APPLICABLE. None exists (N-025) |
| Card or bank payments | NOT APPLICABLE. A payment is a typed record (H-013) |
| Email and text notices | NOT APPLICABLE. Not built (N-028, owner decision 5) |
| More than one server at once | NOT EXECUTED. Races were run against one server and one database |
| Real users timed on the screens | NOT EXECUTED. No minutes-saved figure is claimed |
