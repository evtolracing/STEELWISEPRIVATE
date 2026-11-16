# Phase 8: owner decision 10

Date: 2026-11-15 (owner's time). Built after pull request 31 was merged, on the same branch name restarted from the merged code. All testing ran on a local database whose name contains `qa`. Nothing was run against the live database or the host.

## The decision

The Phase 8 report asked six questions. The owner's answer, in his words: "LETS GO WITH YOUR RECCOMENDED EXCEPT LEAVE THE PROMISE DATE FOR DEMO PURPOSES ITS FINE." He also asked for advice, and no build yet, on an internal basic accounting module.

| Item | Outcome | Status |
|---|---|---|
| N-027 A load that never arrives | Built | VERIFIED FIXED |
| F-009 Who reads invoices | Built | VERIFIED FIXED |
| H-013 Payment method at web checkout | Built | VERIFIED FIXED |
| N-026 Carriers | Decided: tracking numbers typed by dispatch until a carrier contract exists. Nothing built | DEFERRED TO SPECIFIC PHASE |
| S-010 Delivery promise dates | Left as they are, for demonstration, by the owner | ACCEPTED RISK WITH APPROVAL |
| N-025 Accounting | Advice given. Not built. Three answers needed first | REQUIRES BUSINESS DECISION |

## What was built

### A load that never arrives (N-027)

- A shipment that has a problem on record can be ended as **Lost** by a manager: the roles that may already issue a credit (branch and operations managers, administrators, leadership, the sales director and the credit manager).
- The manager chooses the kind (lost in transit, destroyed in transit, refused and not coming back) and writes what happened. Both are required and are kept in the shipment's history and on the credit.
- In the same save, everything not yet credited on the shipment's invoice is credited: each remaining quantity, its tax, and the freight. If the invoice was already paid, the credit stands as owed back to the customer until a refund is recorded, as with any credit. No money is moved by this step.
- Stock is not moved a second time. It left the books when the truck did. The cost of the lost material stays on the order as a sale with no revenue, so the order's margin shows the loss.
- It cannot be undone, it happens once, and a lost shipment takes no further step. A shipment with no invoice is refused until the invoice is raised.
- Nothing is automatic. A reshipment is a new order. Material that does come back is a return, as before. No carrier claim is tracked.
- Database: SQL Editor file 15 (`20261116230000_shipment_lost`) adds the state `LOST` to the list of shipment states. It changes no row. Run twice on a copy of the 85-branch database: the first run added the state, the second changed nothing, and the count of shipments (50,869) did not change.

### Who reads invoices (F-009)

- The invoice list, what customers owe by age, and a single invoice are read by sales staff, managers, leadership and the two view-only roles (auditor and data analyst). Accounting sits in leadership (the CFO) and in sales (the credit manager).
- Shop, warehouse, quality and maintenance staff are refused (403) with "Invoices and payments can be read by sales, accounting and managers."
- Where another answer carries an invoice (a shipment, an order, the answer to a dispatch), those staff receive the invoice's number and status and nothing else. The dock still sees that an invoice was raised.
- Not changed: counter sales (the clerk who takes the money sees the receipt), customers' own invoices in the web shop, and who may record a payment or issue a credit.
- Boundary, stated: the closeout panel still tells any staff reader that an amount is unpaid on an order, because the dock is asked whether an order is finished. It shows no invoice or payment record.

### Web checkout (H-013)

- The checkout form has no payment method. It reads "On account. No card is taken here and nothing is charged now. An invoice follows when your order ships."
- The server writes "Payment: on account" on every web order, whatever a browser sends, and stores no card detail.
- Card payment through a processor remains not built (H-015).

## Behaviour that changes for staff

1. On a shipment with a problem, managers have a new button, "Lost for good". Other staff who press it are told it needs a manager.
2. Shipments have a new state, "Lost".
3. The Invoices screen is closed to shop, warehouse, quality and maintenance staff, and says who may read invoices.
4. For those staff a shipment or an order shows an invoice's number and status with no amount.
5. Web shop customers no longer choose a payment method.

## Verification

A third full run of every check, on a rebuilt local database, after the decision 10 code (2026-11-16 UTC).

| Suite | Result |
|---|---|
| Phase 8 fulfilment scenarios | 155 of 155, 518 checks (150 before; 5 new for decision 10) |
| Phase 7 manufacturing scenarios | 141 of 141, 618 checks |
| Phase 6 inventory scenarios | 106 of 106, 494 checks |
| Phase 5 sales scenarios | 76 of 76, 387 checks |
| Phase 4 integration scenarios | 66 of 66, 555 checks |
| Phase 3 database scenarios | 74 of 74, 612 checks |
| Phase 2 integrity | 82 checks, 0 problems |
| Branch boundary | 39 checks, 0 problems |
| Unit tests | 209 of 209 (201 before; 8 new) |
| Browser checks, ten suites | 286 checks. 285 passed in the run. 1 failed: see below |
| Phase 8 browser checks | 56 of 56 (45 before; 11 new) |
| Security sweep, baseline probe | All sections pass |
| Department rule coverage | 338 changing routes, 0 with no rule |
| Database checks after the run | All 75 read. Every value equals the second full run of Phase 8: 64 read 0, and the 11 that do not are the same demo seed and planted records |
| Lint, build, screen audit | 0 errors; build made; 0 screens with made-up data and no notice |

**The one failure in the run, and what was done.** The shipping browser suite signs in as a dock user and had checked that the shipment screen shows the invoice's total ($79.50). Under F-009 the dock no longer receives the amount, so the check failed, correctly. The check now verifies the new rule: the dock sees the invoice number, the screen shows no amount, and the record, read as sales, holds 79.50. The suite was then run again alone on the same database: 30 of 30. The full run was not repeated after this one-line change to a check, so the figure "286 of 286" is from two runs, not one.

**Server errors in the run**, read from the log of calls: four answers of 500, the same four routes as the second full run of Phase 8, each planted by a scenario that breaks a save on purpose. None on the lost-load step, on invoices or on dispatch. The 501, 502, 503 and 504 answers are the routes that say they are not built and the AI and speech routes with no provider in the test setup, as before.

### Proof that the checks catch the rules

Each rule was removed from the source, the server restarted, the scenarios run, and the source restored.

| Rule removed | Scenarios that then fail |
|---|---|
| F-009 invoices are closed to other staff | 1 |
| F-009 invoices inside other answers are cut down | 1 |
| N-027 a lost load needs a manager (the route's check and the department rule, removed together) | 1 |
| N-027 what happened must be said | 1 |
| N-027 the invoice is credited | 3 |
| N-027 the credit covers only what earlier credits left | 1 |
| N-027 only a shipment with a problem (both checks removed together) | 1 |
| H-013 web orders are on account whatever the browser sends | 1 |

Two single removals failed nothing, and are recorded, not counted:

- "Only a shipment with a problem", the first of its two checks alone. The second check, inside the save, refuses the same request.
- "Ended once when two managers decide together", the state condition inside the save alone. The second manager's save is run again by the overlap retry and then finds nothing left to credit on the invoice, so it is refused anyway. The race scenario passes either way; the two checks removed together fail a scenario (row 7).

### Older checks updated, and why

None was removed and none was loosened.

| Check | Change | Reason |
|---|---|---|
| `qa/sim/phase8-fulfillment.mjs`, the shipped-order fixture | Reads the invoice amount from the record, not from the dock's dispatch answer | F-009: the dock's answer no longer carries the amount |
| `qa/sim/phase8-fulfillment.mjs`, "a shipment with a problem can end delivered" | Its last line recorded that a lost load had no state of its own. It now checks that a plain status change cannot reach "Lost" | N-027 is built |
| `qa/sim/phase8-fulfillment.mjs`, `qa/sim/phase4-integration.mjs`, `qa/sim/run.mjs`, `qa/tools/db-facts.mjs` | "Shipments that have left" now includes lost ones | A lost shipment did leave, and its stock movements and invoice still have to reconcile |
| `qa/sim/ui-shipping.cjs`, "the invoice raised by the dispatch is shown" | Signed in as the dock, it expected the total on the screen. It now checks the number is shown, no amount is shown, and the record holds the total | F-009: found by the full run, which failed it |
| `qa/sim/phase5-sales.mjs`, the web checkout scenario | Was recorded NOT APPLICABLE until the owner answered. It now verifies built behaviour, with one more check | H-013 is decided |

## Not verified

- The live database and the host. File 15 has not been applied there.
- Which live roles will lose the Invoices screen. The rule is by role, and live users' roles were not read.
- No real user has used the "Lost for good" step.

## Advice given on accounting (N-025): not built

The owner asked whether an internal basic accounting module could be built for reports and for AI queries, matching the dashboards, and connectable to outside accounting software later. The advice given:

- Build a ledger, not a full accounting system: every invoice, payment, credit, refund, stock receipt, cost of a shipment and write-off posts balanced entries to a short chart of accounts, in the same save as the event, never edited and only reversed.
- Reports from it: trial balance, sales and gross margin by branch, customer and product, tax collected by place, receivables by age, inventory value, a monthly statement down to gross margin.
- One source: dashboards and the AI read the same figures under the same branch and role rules.
- Outside software by a mapping of accounts and an export file first, a direct connection once a product is chosen.
- Left outside: payroll, bank reconciliation, paying suppliers, fixed assets, tax filing.
- Three answers needed before a build: when cost of goods counts (recommended: at shipment), the chart of accounts (a starter list for the accountant to confirm), and a start date (recommended: a cutover date, no rebuilt history).
- Limits: stock received before the cost update has no cost; margin has no overhead; an accountant should review it before anyone relies on it.

No account mapping, accounting policy or cost-of-goods rule was written into the product.
