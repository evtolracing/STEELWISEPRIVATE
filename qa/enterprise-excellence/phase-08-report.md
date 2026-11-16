# Phase 8 of 12: final execution report

Shipping, packaging, dispatch, logistics, delivery, invoicing, financial reconciliation, order costing and customer order closeout.

Date: 2026-11-16. Branch `claude/project-thread-25z3jd`, pull request 31 (not merged). Baseline commit `b2e8c5d`. Governed by `qa/ENGINEERING-STANDARD.md` and `qa/UNIVERSAL-ENGINEERING-DIRECTIVE.md`. All testing ran on a local database whose name contains `qa`. Nothing was run against the live database or the host. No live customer order was touched, no real shipment was generated, no payment was processed, and no invoice or notice left the machine. Phase 8 ships one database change, SQL Editor file 14, which only adds three columns.

## FINAL STATUS

**PARTIALLY COMPLETE**

Readiness decision under the directive: **CONDITIONAL**.

Why not VERIFIED COMPLETE:

1. Four things the brief names do not exist in the product and were not built, because each needs a decision or a contract that is the owner's: an accounting system, ledger and cost of goods (N-025); carrier connections, freight rating, labels and tracking (N-026); a rule for a load that is lost, destroyed or refused for good (N-027); notices to customers (N-028, deferred by owner decision 5). The brief forbids inventing a carrier capability, an account mapping, or the moment cost of goods is recognised, so none was.
2. Gates C, D and E therefore pass on the part that exists and cannot be met on the part that does not.
3. Order cost and margin cover what owner decision 9 decided: material at actual cost, labor at the rates the owner enters, scrap. Overhead, freight paid, packaging and stock valuation are not in it, and the screen says so.
4. Live data, the host, printers, scales and scanners are NOT VERIFIED. SQL Editor files 6 to 13 are not confirmed on the live database, and file 14 has not been applied.

What is complete and verified: every confirmed Phase 8 defect in built code is corrected (24, of which 7 were P1), each has an automated check, 31 rules were removed one at a time and each made a scenario fail, and the full regression run on the final code is in `phase-08-regression-results.md`. 142 scenarios verify built behaviour and 8 more record, with evidence, a capability that is not built.

## FULFILLMENT DISCOVERY

Detail: `phase-08-fulfillment-inventory.md`.

- **The flow as built.** Material reserved for an order line, or a job that has passed inspection, is put on a shipment. Dispatch is one save: reserved stock leaves, the line's shipped quantity rises, the order becomes partial or complete, and one invoice is raised for that shipment. Delivery records who received it. Payments and credits are records typed by staff. A return brings stock back and raises a credit. Whether an order is finished was not answered anywhere.
- **Sound on arrival.** Shipment quantities, one invoice per shipment, invoice numbering, tax, payments, credits and returns, corrected in Phases 2 to 5, passed their existing checks unchanged.
- **Unsound on arrival.** Packing and drop tags had never completed in a test (N-008 to N-014). Stock could leave from the wrong branch (N-001), and the branch holding the stock could not ship another branch's order (N-002). A delivery needed no proof (N-004). There was no cost of sale (N-017), no closeout (N-018), and stock cost was readable by any staff login through three answers (N-020).
- **Not there at all.** Accounting, carriers, freight rating, tracking, customer notices, card payments, signature capture, statements, dunning and write-offs. Seven freight screens show sample data and say so (U-035).
- **Size.** Seven route files hold the 84 addresses of this flow, and three were added to the orders file. Three library files, two screens and one additive database file are new. No module was replaced.

## SHIPPING INTEGRITY

Detail: `phase-08-shipping-eligibility.md`, `phase-08-picking-packaging.md`, `phase-08-shipping-documents.md`, `phase-08-dispatch-logistics.md`, `phase-08-delivery-confirmation.md`.

- **What may ship.** Twelve rules are checked inside the dispatch save. Stock leaves only the dock it stands at (N-001). The branch that holds the stock ships; the branch that sold reads and bills (N-002). Nothing ships to a closed account (N-005). Cancelling an order cancels its shipments still on the dock in the same save (N-006).
- **Once only.** Stock leaves once and a line is never shipped beyond what was ordered, across splits, back orders and every race tried: two dispatches of one shipment, six shipments at once, dispatch against cancel, dispatch against a change to the order.
- **Packing.** The chain now completes: pack, send to quality, release, print the tag, apply, seal, stage, load. Heat, grade and form are read from the stock item and a different typed value is refused (N-009). Tag states move one way (N-010). Packages, tags and listings are numbered from the counter table (N-012). A step pressed twice happens once (N-013).
- **Who did what.** A custody record is written by the step itself, in the name of the signed-in person. The hand-entry address takes notes only and cannot write a status (N-011).
- **Papers.** The pick list, packing list and bill of lading are built by one reader from the shipment, the order, the branch record and the stock that actually left. A fact not on file prints as a blank and is named; no address, weight or number is invented (N-014). Text is escaped (N-019). A paper waiting to print is brought up to date and never queued twice (N-023). Each branch sees its own print jobs (N-015).
- **Delivery.** A delivery needs the receiver's name, a proof image address, or a written reason for having neither (N-004). A problem on the road needs a reason (N-003).
- **Not built.** Carriers, rating, labels and tracking (N-026). A pick is a list, not a confirmed scan. A package is not tied to one shipment. No rule for a lost load (N-027).

## FINANCIAL INTEGRITY

Detail: `phase-08-invoicing-review.md`, `phase-08-financial-reconciliation.md`, `phase-08-accounting-integrations.md`, `phase-08-job-costing.md`, `phase-08-returns-credits.md`, `phase-08-order-closeout.md`.

- **Invoices.** One per shipment, raised in the same step, numbered in sequence with no gap under six dispatches at once. Tax in proportion to what shipped, by the selling branch (owner decision 7). Freight billed once. An invoice is never edited: a correction is a credit.
- **Payments.** Part payments, an overpayment refused, three full payments at once taken once. A payment dated in the future is refused (N-007). A payment is a typed record; no money moves.
- **Credits and refunds.** Never more than the invoice, in total, by line, and under races. A typed amount over what is left is refused to the cent (N-021).
- **Returns.** A return received when its credit cannot be raised is flagged until a manager settles it, once (N-016).
- **Reconciliation.** For every record the run made: shipped quantity equals stock movements equals invoiced quantity; invoice totals equal their lines; payments and credits equal balances. Seven database checks were added. There is no ledger to reconcile against.
- **Cost of sale.** Dispatch fixes the item's unit cost on the stock movement (file 14). An order's cost and margin are read from those movements, the returns that came back, and the labor and scrap of its jobs. A later change to an item's cost does not change what a past sale cost. Each missing figure is named, never estimated (N-017). Cost is shown to managers, the inventory manager and buyers only, on every answer (N-020).
- **Closeout.** One rule lists, for each order, every reason it is not finished, with its figure: still to ship, on the road, not delivered, not invoiced, unpaid, a return open, a credit missing, a job open. A list of orders not closed, oldest first, by reason, held to the reader's branch (N-018). Nothing locks a closed order; that would be a new policy.
- **Not built.** Ledger, chart of accounts, cost of goods posting, period close, valuation (N-025). No financial adjustment was fabricated and no stock value was altered.

## DEFECTS AND CORRECTIONS

29 findings, N-001 to N-029. Full text in `findings-register.md`.

| Finding | Severity | What was wrong | Status |
|---|---|---|---|
| N-001 | P1 | Stock standing at another branch could be dispatched from this dock | VERIFIED FIXED |
| N-002 | P1 | The branch holding the stock could not ship another branch's order | VERIFIED FIXED |
| N-003 | P2 | A problem on the road was recorded with no reason | VERIFIED FIXED |
| N-004 | P2 | A delivery was recorded with no receiver and no reason | VERIFIED FIXED |
| N-005 | P2 | An order confirmed before an account was closed could still ship | VERIFIED FIXED |
| N-006 | P2 | A cancelled order kept a live shipment on the dock | VERIFIED FIXED |
| N-007 | P3 | A payment could be dated in the future | VERIFIED FIXED |
| N-008 | P1 | The packaging chain could not be completed: no step sent a package to quality | VERIFIED FIXED |
| N-009 | P2 | What went into a package was not checked against the stock item | VERIFIED FIXED |
| N-010 | P2 | Tag states contradicted each other; sealing revived a voided tag | VERIFIED FIXED |
| N-011 | P1 | Custody records could be written by hand under any name, role and status | VERIFIED FIXED |
| N-012 | P3 | Package, tag and listing numbers could collide | VERIFIED FIXED |
| N-013 | P2 | Two people pressing the same packing step at once both succeeded | VERIFIED FIXED |
| N-014 | P1 | Labels, packing list and bill of lading printed invented content | VERIFIED FIXED |
| N-015 | P2 | Every branch saw and could settle every branch's print jobs | VERIFIED FIXED |
| N-016 | P2 | A return could be received with its credit silently missing | VERIFIED FIXED |
| N-017 | P2 | No cost of sale and no order margin | VERIFIED FIXED, within decision 9 |
| N-018 | P2 | Nothing said whether an order was finished | VERIFIED FIXED |
| N-019 | P2 | Text on a printed paper was not escaped | VERIFIED FIXED |
| N-020 | P1 | Stock cost reached roles that must not see it | VERIFIED FIXED |
| N-021 | P3 | A typed credit could exceed what was left by a rounding allowance | VERIFIED FIXED |
| N-022 | P1 | Overlapping dispatches or credits could answer a server error instead of being run again | VERIFIED FIXED |
| N-023 | P3 | A paper waiting to print could be stale or queued twice | VERIFIED FIXED |
| N-024 | P4 | A Phase 5 test failed between midnight and the branch's start of day | FIXED — NOT VERIFIED (the proof depends on the time of day) |
| N-025 | P2 | No accounting system, ledger, cost of goods or valuation | REQUIRES BUSINESS DECISION |
| N-026 | P2 | No carrier, freight rating, label or tracking | REQUIRES BUSINESS DECISION |
| N-027 | P2 | No rule for a load that never arrives | REQUIRES BUSINESS DECISION |
| N-028 | P3 | No shipment, delivery or invoice notices | DEFERRED TO SPECIFIC PHASE (owner decision 5) |
| N-029 | P2 | A cancel and a dispatch of the same order at the same instant answered a server error to one user | VERIFIED FIXED |

Earlier findings closed in this phase: F-011 and U-036 (printing a bill of lading and packing list from the shipment screen) and F-012. Notes were added to L-026 and K-007, which stay IN PROGRESS: cost now reaches the sale, valuation still does not exist.

Corrections to this phase's own work, stated plainly:

- The first full run passed every scenario and still hid N-029. It was found by reading the server log, not by a failing check. The scenario now fails on any server error.
- One new database check counted the wrong series, and one new scenario left an order's totals wrong. Both were test defects and both were corrected.
- Two rule removals made no scenario fail because a second check covers the same request. They are recorded, not counted.
- The module dependency map had been missing its notes 21 to 28 since Phase 7: a misplaced bracket in the generator (`qa/tools/excellence-docs.mjs`) left them out of the file without any error. Found while adding this phase's notes. Corrected; the map now carries all 35.

### Behaviour that changes for staff

1. Dispatch is refused when reserved stock stands at another branch. The pick list marks it "At another branch" first. Transfer the stock, or ship from the branch that holds it.
2. A branch can open a shipment for another branch's order when the stock or the job is at its own dock. The selling branch can read that shipment but not change it.
3. Dispatch is refused for a customer whose account is closed.
4. Cancelling an order cancels its shipments still on the dock.
5. Marking a delivery asks "Received by". With no name, a reason must be written.
6. Reporting a problem on the road asks what happened.
7. A payment cannot be dated more than a day ahead.
8. Packing follows one order of steps: pack, send to quality, quality releases, print the tag, apply, seal with a seal number, stage, load. Only quality roles release or hold.
9. Heat, grade and form on a package come from the stock item. A different typed value is refused.
10. A further copy of a tag needs a reason from a short list, and after three copies a manager.
11. Custody notes are in the writer's own name. A status cannot be typed by hand.
12. The bill of lading and packing list print a blank where a fact is not on file. A branch with no street address on its record prints no shipper address.
13. Each branch sees its own print jobs. Jobs queued before file 14 are seen by all until printed or skipped.
14. A return received when its credit cannot be raised shows a warning and stays flagged until a manager settles it.
15. Stock cost is blank for every role except managers, the inventory manager and buyers.
16. New screens: Packing, and Orders Not Closed. New on the shipment screen: two print buttons and a papers panel. New on the order: a closeout panel and, for cost viewers, cost and margin.

## OPERATIONAL EFFICIENCY

Detail: `phase-08-ux-efficiency.md`, and `phase-08-regression-results.md` section 3.

- At 85 branches (72,565 orders, 50,869 shipments, 37,625 invoices, 20,000 print jobs) eighteen calls answer in 6 to 206 ms on the local machine. The slowest is the first page of orders not closed; every other call is under 40 ms.
- Printing a bill of lading or a packing list is now one button on the shipment. Before, there was none.
- "What is still open on this order" is one panel. Before, it took the order, its shipments, its invoices and its returns.
- The Packing screen walks the chain and offers only the next valid step.
- No real user was timed. No minutes-saved figure is claimed. The packing screens were not timed at scale because the scale data holds no packages.

## VERIFICATION

All run in this session. Figures are from the second full run, on a rebuilt database, on the final code.

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

| Proof by removal | Result |
|---|---|
| Rules removed one at a time | 31, each made at least one scenario fail |
| Removals that failed nothing | 2, each backed by a second check; recorded, not counted |

Server errors in the run, read from the server logs: four answers of 500, the same four as the baseline, each planted by a scenario that breaks a save on purpose to prove nothing is half-saved (the log shows "QA injected billing failure", "qa planted failure" and "QA fault" before each). No dispatch and no order save answered a server error; the first run had six. The answers of 501, 502, 503 and 504 are the addresses that say "not built" and the assistant and speech addresses, which have no outside service in this environment; the same as the baseline.

Database checks: see `phase-08-regression-results.md` section 2. Timings: section 3.

Not run, and why, is in `phase-08-regression-results.md` section 4.

### The Phase 8 prompt's gates

| Gate | Result | Basis |
|---|---|---|
| A. Fulfilment eligibility | PASS | Groups 1 and 2; N-001, N-002, N-005 |
| B. Picking and packaging | PASS for what exists | The packaging chain completes; a pick is a list, not a confirmed scan |
| C. Shipping and delivery | PARTIAL | Shipment, dispatch, delivery and proof pass. Carriers, rating and lost loads do not exist |
| D. Financial integrity | PARTIAL | Invoices, payments, credits and refunds pass and reconcile to shipments. No ledger |
| E. Costing and profitability | PARTIAL | Order cost and margin pass for what decision 9 covers |
| F. Returns and credits | PASS | Group 6; N-016 |
| G. Order closeout | PASS | Group 5; N-018 |
| H. Security and concurrency | PASS | Group 7; sweep; branch boundary; N-011, N-013, N-015, N-020, N-022, N-029 |
| I. Operational efficiency | PASS with stated limits | Local machine; no real users |
| J. Regression | PASS | `phase-08-regression-results.md` section 2 |

### The directive's gates A to J

| Gate | Result |
|---|---|
| A. Scope understood | PASS |
| B. Requirements met | PARTIAL: what exists is corrected and verified; four capabilities wait on the owner |
| C. Defects reproduced before correction | PASS: probe on the starting code; N-020 to N-023 and N-029 found by the new checks and the server log |
| D. Corrections minimal and in place | PASS |
| E. Automated checks fail without the fix | PASS for 31 rules; the limits are stated for N-024 and the second half of N-029 |
| F. Regression | PASS |
| G. Performance | PASS on the local machine; the host NOT VERIFIED |
| H. Security | PASS |
| I. Documentation | PASS |
| J. Readiness | CONDITIONAL |

## PRODUCTION READINESS

**CONDITIONAL.** The code may go live when all of these are true:

1. SQL Editor files 6 to 14 are applied to the live database in order, before the code is deployed, and `verify-6-to-14.sql` shows every line as present. Without file 14, dispatch, delivery and the print queue fail (R-49).
2. The read-only script `check-before-phase-8.sql` has been run on the live database and its ten counts read. It shows how many live shipments would be held by the new rules, how many branches have no street address, and how many print jobs are waiting (R-50, R-52, R-54).
3. Dispatch, drivers and packing staff have been told about the sixteen changes above, the first six most of all (R-51).
4. The owner has said "merge".

Rollback: the code can be put back to the previous commit at any time. File 14 only adds three columns and can stay in place; the older code does not read them.

Risks R-49 to R-56 are in `production-risk-register.md`.

### Decisions that are the owner's

| Item | Question | Recommended |
|---|---|---|
| N-025 | Which accounting system, if any, should receive invoices, payments and credits; and when is cost of goods recognised | Name the system first. Until then the product keeps receivables and order margin and posts nowhere |
| N-026 | Which carriers, and whether rating, labels and tracking are wanted in the product | Start with tracking numbers typed by dispatch, which works today; connect one carrier when a contract exists |
| N-027 | What happens to a load that is lost, destroyed or refused for good: who decides, is the stock written off, is the customer credited or reshipped | A manager's decision with a reason, a credit for the invoice, and a write-off movement; nothing automatic |
| F-009 | Whether every staff login should read every invoice and its payments | Limit to sales, accounting and managers of the branch |
| S-010 | Delivery promise dates and cutoff times shown from invented data | Remove the promise until it can be worked out from real stock and capacity |
| H-013 | Web checkout collects a payment method that does nothing | Sell on account only and say so, until a processor is chosen |

Also the owner's, from Phase 7 and still needed for margin to be complete: labor rates per kind of work center.

## PHASE 9 HANDOFF

Phase 9 is the enterprise UI and UX phase. It has not been started.

Carried to it from this phase:

- Seven freight and logistics screens that show sample data, labelled (U-035), and the delivery promise screens (S-010).
- Accessibility of the Packing, Shipment, Orders Not Closed and print pages beyond labels: not assessed.
- The Packing screen and the Orders Not Closed screen are new and have had no real user.
- The first page of orders not closed is the slowest call of this phase (133 to 206 ms at 85 branches).
- 1,522 lint warnings, and 38 effects that read a value they do not list (ceiling held).
- The printed papers were read in a browser, never on a printer.

Open from earlier phases and unchanged: K-006 to K-011, K-013, J-008, G-020, E-015, H-015, B-019, E-017, L-023 to L-027, L-030.

Continuation point if work on Phase 8 resumes: every task of this phase that does not need the owner is done. What remains is the owner's list above, the two read-only scripts, and the merge.
