# Phase 2: who owns each business rule

For every rule the business depends on: the one place in the code that decides it, whether a unit test reaches it, and whether any other place decides the same thing differently. Written by hand on 2026-11-13 from reading the code. "Owner" means a file, not a person.

A rule is **well owned** when it is decided in one function with no database access, a unit test covers it, and every entry point calls that function. It is **owned in a handler** when it is decided in one place but inside a route file, where only an API test can reach it. It is **split** when two places decide it.

## Pricing, tax, credit, billing

| Rule | Owner | Unit tests | Other places that decide it | State |
|---|---|---|---|---|
| What a customer pays for a catalog item (list, price level, contract) | `lib/customerPricing.js`, `lib/priceRules.js` | 8 | None. Order entry, the counter, the quick sale and the web store all call it. Sweep "One customer, one price in every sales channel": 47 checks | Well owned |
| Web checkout uses the system price, not the browser's | `routes/ecom.js` through the same functions | Sweep: 4 checks | None | Well owned |
| Sales tax: selling branch's state, exempt customers (owner's earlier decision) | `lib/orderTax.js` for staff-entered orders; the quick sale reads the same rate table | Sweep | The quick sale computes subtotal × rate itself instead of calling `orderTax`. Same table, same rule, two computations | Split in form, not in result. Recorded here; no behaviour difference found |
| A price override needs a reason and a manager's approval | `routes/overrides.js` (`isManager`) | Sweep | None | Owned in a handler |
| Credit limit: over the limit the order is saved on hold and a manager releases it (owner's earlier decision) | `lib/creditRules.js`, `lib/creditControl.js` | 8; sweep 22 checks | None | Well owned |
| Invoice totals, what can be credited, refund limits | `lib/billingRules.js` | 6; simulation reconciliation | None | Well owned |
| An invoice is raised when a shipment is dispatched, once | `routes/shipments.js` (dispatch) | Simulation race "invoiced three more times at once: billed once" | The carrier partner route does not call it (C-002) | Owned in a handler; one would-be bypass, unreachable today |
| A payment cannot exceed what is owed | `routes/invoices.js` with `billingRules` | Simulation race; `phase2-integrity` | None | Owned in a handler |
| Voiding a counter sale: manager only, once, credit memo and refund | `routes/quickSale.js`; the role in `lib/roleAccess.js` | `phase2-integrity` | None | Owned in a handler; not atomic end to end (C-010) |

No pricing, tax or credit policy was changed in Phase 2.

## Orders, stock, shipping

| Rule | Owner | Unit tests | Other places | State |
|---|---|---|---|---|
| Which order status may follow which | `lib/workflowRules.js` (`orderMoveError`) | 16 in the file | None | Well owned |
| An order becomes PARTIAL or COMPLETE only by shipping | `routes/shipments.js` | Simulation | None | Owned in a handler |
| Reserving stock: never more than is available; two reservations cannot both win | `routes/orders.js` (allocate), conditional update; the database refuses a negative balance | Simulation race | None | Owned in a handler, backed by the database |
| Stock balance: on hand = available + reserved + on hold, never negative | The database (check constraints) | Database refuses it; `phase2-integrity` re-checks after the counter tests | None | Owned by the database |
| Receiving: what a receipt must contain | `lib/receivingRules.js`, `lib/receiving.js` | 9 | None | Well owned |
| Transfer: all of an item moves; reserved or held stock does not move | `routes/inventory.js` | Sweep; `branch-boundary`; `phase2-integrity` race | The second stock list has its own transfers (B-009) | Owned in a handler; one parallel copy |
| A counter sale reduces shelf stock; a void returns it (decision 6) | `routes/quickSale.js` (`takeShelfStock`, `returnShelfStock`) | `phase2-integrity`: 13 checks | None | Owned in a handler |
| Material cannot ship while the job that makes it is unfinished | `lib/workflowRules.js` | In the 16 | None | Well owned |
| A shipment is dispatched once; delivered only after dispatch | `routes/shipments.js` | Simulation race; `phase2-integrity` | C-002 | Owned in a handler |
| Record numbers are one company-wide series with no gaps reused | `lib/numbering.js` | 7 | None | Well owned |

## Shop floor

| Rule | Owner | Unit tests | Other places | State |
|---|---|---|---|---|
| Which job status may follow which | `lib/workflowRules.js` (`jobMoveError`) | In the 16 | Three job routes (`start`, `complete`, `ship`) carry their own status checks (M-017) | Split: one table plus three handlers |
| A job move is recorded with who and why, in the same save | `lib/jobHistory.js` | 8 | None since Phase 2 (planning and operations now call it inside their transaction) | Well owned |
| A job move applies only if the job is still where it was checked (Phase 2) | `routes/jobs.js` (both status routes) | `phase2-integrity` race | The general edit route (`PUT /:id`) still writes unconditionally | Owned in a handler; one gap, recorded for the manufacturing phase |
| The last operation finishing sends the job to inspection, once (Phase 2) | `routes/operationsRoutes.js` (complete) | `phase2-integrity` race | The order hub has `POST /api/v1/jobs/:id/complete`, which is the job route at its second address | Owned in a handler |
| Work on a cancelled or finished job is refused (Phase 2) | `routes/operationsRoutes.js` | `phase2-integrity` | None | Owned in a handler |
| Which work order status may follow which; yield is worked out by the server | `lib/workOrderRules.js`, `routes/workOrders.js` | In the workflow tests; browser suite | None | Well owned |
| What a completed work order consumes and produces; remnants | Nobody. Completing a work order changes no stock (M-016) | | | No rule exists. The owner's to give |
| Scheduling: which work center, which operator, in what order | `routes/dispatchRoutes.js`, `routes/opsCockpit.js` | None | Recommendations are generated on request and acted on from browser text (C-013) | Not owned. The owner's rules are needed first |

## Access

| Rule | Owner | Unit tests | State |
|---|---|---|---|
| Customer and partner logins reach only the store | `lib/roleAccess.js`, `lib/customerScope.js` | 9 in `roleAccess.test.js`; sweep | Well owned |
| Which department may change what | `lib/roleAccess.js` (`WRITE_RULES`) | Same file; coverage check | Well owned |
| Which branch a login may see and change (decision 2) | `lib/branchScope.js` | 9; `branch-boundary` 37 | Well owned |
| Who may give which role and branches | `lib/userAdminRules.js` | 5; `phase2-integrity` 14 | Well owned |
| Which fields of a record a request may set | `lib/fieldRules.js`, one list per record in its route file | 7 | Well owned where used: products, grades, heats, stock items, work orders, work centers, equipment, maintenance orders |

## Rules decided in the browser that should be decided on the server

Unchanged by Phase 2, already in the register: delivery promise dates, cut-off times and "ship from another branch" suggestions (X-007, S-010) are invented in the browser and need the owner's rules. Phase 2 found and removed two smaller cases of the same kind (C-007).

## Conflicts found

One real conflict, and it is the one the owner has decided: two stock lists and two order pipelines (B-009). No two implementations of a price, a tax amount, a credit decision or an invoice total were found to disagree; the sweep section on one price in every channel passes with 47 checks.
