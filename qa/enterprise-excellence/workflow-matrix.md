# Workflow matrix

Written by hand in Phase 1 from the code (`src/backend/src/lib/workflowRules.js`, `lib/workOrderRules.js`, `lib/quoteRules.js`, `lib/billingRules.js`, the route files) and from what the automated runs exercised. An earlier, step-by-step version for order to cash is in `qa/workflow-coverage-matrix.md` and is still accurate.

"Verified" below means an automated test in this session ran the step successfully and checked the database afterwards. "Mapped only" means the code was read and no test runs it.

## Summary

| Workflow | Exists in the code | Verified | Where it stops |
|---|---|---|---|
| Customer to cash | Yes, end to end | Yes | No statements, ageing or accounting export after payment |
| Procure to stock | Receiving only | Receiving: yes | No requisition, purchase order, vendor or approval exists (I-007) |
| Make to order | Yes | To job level: yes. Operations, time logs, packaging, tags: mapped only | Operations have no move rules (B-011); completing a work order does not move stock (M-016) |
| Branch transfer | One step | Yes | A transfer is immediate. No request, approval, in-transit state or receipt at the other branch |
| Return and credit | Yes | Yes | No inspection step before credit (owner's decision) |
| Remnant life cycle | Listing, pricing, reserve | No | Nothing creates a remnant from processing |
| Exception management | A record and an acknowledge | No | No shortage, re-sourcing, reschedule or customer notice flow |
| Counter sale | Yes | Yes | Card approval typed in by hand; no receipt sent |
| Web store order | Yes | Yes | Promise date and cut-off shown from mock rules (X-007) |
| Quote to order | Yes | Yes | No approval step beyond credit (none exists); versions verified in Phase 5 |
| Credit hold and release | Yes | Yes | |
| Stock hold and release | Yes | Yes | Whether held or uninspected stock may ship is partly decided |
| Coil work order | Yes | Yes | Does not consume or produce stock (M-016) |
| Quality inspection of a job | Yes | Yes (Phase 7: pass, conditional, fail, hold, rework, re-inspection) | Nonconformance records are not built (L-023); the inspection checklists are the owner's to enter (L-028) |
| Shipment documents and tags | Routes exist | No | Not examined (F-011) |
| Partner API (customer, supplier, carrier) | Routes exist | Refusal only | No success-path test; failed webhooks are not retried (B-018) |
| User life cycle | Yes | Refusal only | No success-path test |

17 workflows mapped. 9 verified end to end, 3 verified in part, 5 mapped only.

### Phase 5 update (2026-11-15)

| Workflow | Change | Verified by |
|---|---|---|
| Customer to cash | Requirements (grade, size, tolerances, finish, certificates, processing) carried from request to quote, order and work order; quotes carry tax by rule 27; the order belongs to the request's branch; closed accounts refused in every channel | `qa/sim/phase5-sales.mjs` (76 scenarios, 386 checks) |
| Quote to order | Versions verified (accepting one closes the others); lapsed quotes read, filter and count as expired; still no approval step beyond credit (none exists; none invented) | same, group 3 |
| Counter sale | A void sets the order CANCELLED (G-009) | same, group 5 |
| Counter order (Retail POS) | At the clerk's branch, not Jackson (J-006); the old session flow's submit is closed (S-022) | same, group 5; `qa/sim/ui-phase5.cjs` |
| Web store order | Acceptance taxes and files at one branch, per-piece lines, a customer required (J-005, J-010) | same, group 6 |
| Order entry | Branch, seller and tax from the branch named, which must be the person's own; an order cannot leave draft with no lines (H-011) | same, group 4 |

Sales channels that create a sales order after Phase 5: order entry (including Retail POS and the mobile rep), quote acceptance, web store acceptance, counter quick sale, partner API. The counter session flow no longer creates orders. The Order Hub screen is retired; its address opens RFQs & Quotes.

### Phase 6 update (2026-11-15)

| Workflow | Change | Verified by |
|---|---|---|
| Procure to stock | Purchase orders exist: a buyer writes and places one, a receipt names the line it fills, part and full receipt, close and cancel. A mismatch, an over-receipt or a missing certificate is held. No requisition or approval step (no rule on file, K-011); supplier invoices are not matched (K-012) | `qa/sim/phase6-inventory.mjs`, groups 1 and 2; `qa/sim/ui-phase6.cjs` |
| Branch transfer | Now send, in transit, receive, with short, missing and damaged held and settled by a manager, and call back by the sender (G-007). Still no request and approval step | same, group 5 and the concurrency group; seven reconciliation checks at 0 |
| Reserve to ship | A reservation must fit the line: unit, grade, size, thickness tolerance, owner, and not in transit (K-001) | same, group 3 |
| Remnant life cycle | A remnant that is stock is created from a parent or a work order, reserved, moved between branches and scrapped, keeping heat and parent. The Steel Outlet list is still separate (K-006) | same, group 4 (the ten remnant tests) |
| Return and credit | The unit follows the stock item; an inspected return is held; a scrapped return is recorded in and out (K-003, K-004) | same, group 6 |
| Shelf goods | Received by the piece against a product, with no heat (C-011) | same, group 2; security sweep section 20 |
| Count and correct | Corrections with reason, note and person verified. No cycle count program exists (K-008) | same, group 6 |
| Replenishment | A supply position per branch and grade (stock, inbound, demand). Nothing is calculated or ordered (K-010) | same, group 1 |

Inventory valuation is not a workflow in the code. Since owner decision 9 (2026-11-15) a receipt against a purchase order line records the item's cost; nothing values movements or stock (K-007).

### Phase 7 update (2026-11-15)

| Workflow | Change | Verified by |
|---|---|---|
| Make to order: open and plan a job | Opened only for a live order and line; planned once, steps in order at the work center's branch; grade and thickness from the order line, nothing assumed; a plan with recorded work is never replaced (L-010, L-012) | `qa/sim/phase7-manufacturing.mjs`, group 1 |
| Make to order: routing | Draft, review, in use, retired; only a routing in use goes on a job, and the job records the version (L-011) | same, groups 1 and 2 |
| Make to order: schedule | The scheduling run places waiting steps of open jobs on like work centers at the branch with certified operators, once, under a branch lock; machines off or locked out get no work (L-007, L-016). The planner assumes no times or hours (L-008) | same, group 3 |
| Make to order: run a step | Start, pause, finish in planned order (owner decision 8), on the right kind of work center, by an operator of that branch whose certification has not lapsed (L-004, L-005) | same, group 4; `qa/sim/phase2-integrity.mjs` |
| Make to order: leave production | Not with a planned step unfinished (L-006). Cancelling stops the clocks (L-018) | same, groups 4 and 7 |
| Quality inspection of a job | Now verified on every path: pass, conditional pass, fail and hold, rework and re-inspection. A job leaves inspection only by a passed inspection (L-001, L-002, L-003) | same, group 5; `qa/sim/ui-phase7.cjs` |
| Coil work order | Quality hold cannot be completed; substitution needs a reason; failed, held or in-transit material is refused (L-013) | same, groups 2, 5 and 6 |
| Rework | Sent back with instructions and inspected again. Since owner decision 9 a rework step is added to the plan and clocked like any step (L-020) | same, group 6 |
| Which jobs are inspected | Every job, unless its routing is marked "no inspection" (L-021, owner decision 9) | same, group 5 |
| Material for a job | A coil work order can be raised for a job; the job shows what was used, made and scrapped (L-024, owner decision 9) | same, group 6; `qa/sim/ui-phase7.cjs` |
| Cost of a job | Material at actual cost from the purchase order at receipt, plus labor at the owner's rate per kind of work center; no overhead; shown to cost roles only (L-026, K-007, owner decision 9) | same, group 6; `qa/sim/phase6-inventory.mjs` |
| Labor rules | Certification required and two steps at once, each by a mark on the kind of work center; long-running clocks listed for the supervisor (L-022, owner decision 9) | same, group 4 |
| Sold at one branch, worked at another | Unchanged and confirmed: the job follows its work center | same, group 7; the multi-branch jobs of the order-to-cash simulation |

Not workflows in the code, recorded as such: bill of material and material requirements (L-024), calendar capacity (L-025), stock valuation and cost of goods (K-007), nonconformance and corrective action (L-023), outside processing and nesting (L-027), machine connection (L-030).

### Phase 8 update (2026-11-16)

Workflow 1 (customer to cash) and workflow 5 (return and credit) were walked from "ready to ship" to "closed" with 150 scenarios (`qa/sim/phase8-fulfillment.mjs`) and 45 browser checks (`qa/sim/ui-phase8.cjs`).

| Step | Before Phase 8 | Now |
|---|---|---|
| Pick | No pick list | The shipment shows the reserved stock to pick, with heat and bin, and flags stock at another branch (N-001) |
| Pack | Could not be completed through the product (N-008) | Open, pack, quality release, tag, seal, each checked, on a new Packing screen |
| Papers | Invented content; no button (N-014, N-019) | Packing list and bill of lading drawn from the records, blanks for what is missing, opened from the shipment |
| Ship across branches | The branch with the stock could not ship another branch's order (N-002) | It can; the selling branch sees it; only the dock changes it |
| Dispatch | Sound, except under simultaneous load (N-022) and for closed accounts (N-005) | One step; overlap retried; closed account refused |
| Deliver | No proof needed (N-004) | Receiver's name, or a reason |
| Problem on the road | No reason (N-003) | Reason required. A lost load still has no rule (N-027) |
| Invoice, payment, credit | Sound | Future payment date refused (N-007); typed credit exact to the cent (N-021); receivables by age |
| Return | A missing credit was invisible (N-016) | Flagged until a manager settles it |
| Cost of the sale | None (N-017) | Fixed at dispatch; order cost and margin for cost viewers |
| Close | No such idea (N-018) | Closeout position per order; Orders Not Closed list |

Not part of any workflow, because they do not exist: an accounting ledger (N-025), carrier rating and tracking (N-026), customer notices and invoice delivery (N-028).

### Phase 9 update (2026-11-16)

Phase 9 changed no workflow rule. It walked the screens of each workflow in a browser (232 scenarios, `qa/sim/phase9-ui.cjs`) and compared what each shows with the record. What the screens now guarantee, by workflow:

| Workflow | Before Phase 9 | Now |
|---|---|---|
| 1. Customer to cash: find and read an order | The top-bar search did nothing; the order list ignored a search; the order page worked out its own total at 6% tax with no freight and did not name the customer (V-001, V-019, V-020) | Search by number from any screen; the page shows the stored subtotal, tax, freight and total, and the customer |
| 1. Customer to cash: enter an order | A half-entered order was lost on a stray click, Back or reload (V-017) | Asks first; Stay keeps every entry |
| 1. Customer to cash: dispatch | A double click on "Dispatch now" dispatched and then cancelled the shipment (V-022) | One press, one action; one invoice |
| 1. Customer to cash: invoice and payment | Sound | Verified on screen: every figure of an invoice as stored; a failed payment is not shown as paid; the dock sees a number and no amount |
| 2. Procure to stock | Sound | Verified on screen: purchase order lines and totals as stored; a receipt appears in stock; an item in transit says so in the list (K-014) |
| 3. Make to order | The shop floor opened on the first branch for everyone (V-021); the order board froze for over a second (V-026) | Opens on the person's branch; the board draws 30 cards a column |
| 4. Branch transfer | In transit shown only on the item's page | Shown on the list row |
| 5. Return and credit | Sound | Verified on screen: a return for an order not on file says so and creates nothing |
| 7. Exception management | An unknown address showed the dashboard; a session that ended dropped the person at home; a server failure could crash a list (V-014, V-005, V-023) | Page not found; back to the same page after sign-in; an error with Retry |
| All | Rows opened only with a mouse; controls and fields with no name; confirmations in the browser's own box | Keyboard throughout the paths the scenarios walk; names on every control; the application's own dialogs |

## Job types found

Order types in the schema: RFQ, QUOTE, SO (sales order), PO, RETURN. PO is never used. Sales channels that create a sales order: order entry, quote acceptance, web store, counter quick sale, counter session flow, partner API. The order hub creates its own orders that are not sales orders (B-009).

The simulation runs nine scenario families per cycle (50 jobs): standard metals, multi-step metals, plastics, counter and web, multi-location, transfers and receiving, rush and exceptions, partial shipment with rework and return, mixed division. Shop work is of two kinds in the code: a Job (the board, the schedule, moves recorded against a person) and a coil WorkOrder (slitting and similar). Dispatch adds DispatchJob and DispatchOperation under a Job.

## 1. Customer to cash

| | |
|---|---|
| Trigger | A customer asks for a price or places an order: at a desk (order entry), on the web store, at the counter, or by accepting a quote |
| Required input | Customer, lines (product, quantity, unit), ship-to, branch. Price, tax and credit are worked out by the server |
| Who | Sales roles create and change orders. Warehouse and production may reserve stock. Shipping roles ship. Managers issue credits and refunds |
| Initial state | Quote DRAFT, or Order DRAFT or PENDING |
| Approvals | Over the credit limit: the order waits on HOLD for a manager (rule 32). Credits, refunds, cancelling an invoice: a manager |
| Final state | Order COMPLETE, shipment DELIVERED, invoice PAID |
| Audit | Price overrides, credit release, job moves, shipment steps and every money action are recorded with the person (AuditLog) |

| Record | Allowed moves | Refused |
|---|---|---|
| Quote | DRAFT → SENT → ACCEPTED or REJECTED; shown as expired after its date | Accepting twice; lines that cannot be priced |
| Order | DRAFT → PENDING, CONFIRMED, HOLD, CANCELLED; PENDING → CONFIRMED, HOLD, CANCELLED, DRAFT; CONFIRMED → HOLD, CANCELLED; HOLD → PENDING, CONFIRMED, CANCELLED | PARTIAL and COMPLETE can never be set by hand; nothing after COMPLETE or CANCELLED; a partly shipped order cannot be cancelled, held or reopened |
| Reservation | Up to what is available and what the line still needs | Held stock; more than available; cancelled or completed orders |
| Job | ORDERED → SCHEDULED → IN_PROCESS → WAITING_QC → PACKAGING → READY_TO_SHIP → SHIPPED → COMPLETED; ON_HOLD and back; rework between working columns | Finishing work that never started; any change after COMPLETED or CANCELLED |
| Shipment | PENDING → LOADING → IN_TRANSIT → DELIVERED; EXCEPTION and back | Dispatching twice; delivering before dispatch; cancelling on the road; shipping a line whose job is unfinished; shipping more than is left |
| Invoice | Raised at dispatch for what shipped, once; SENT → PARTIAL → PAID; CANCELLED | Paying more than the total; a second invoice for the same shipment |

Database changes: Order, OrderLine, OrderLineAllocation, Inventory, Coil, Job, Shipment, ShipmentItem, MaterialMovement (SHIP), Invoice, InvoiceLine, Payment, AuditLog. Dispatch updates line and order status, removes the reserved stock and raises the invoice in one transaction.

Recovery: cancelling an order gives reserved stock back. A shipment can be cancelled before it leaves. An invoice can be cancelled or credited by a manager. A delivered shipment is corrected by a return.

Information carried across: customer, price level and tax state from order to invoice; heat from stock item to shipment item. Not carried: the job's actual time and cost (no costing exists).

Verified by: 150 simulated jobs per gate run with 2,357 database checks and a reconciliation; eight simultaneous-request probes; sweep sections on prices, order rules, credit, shipping and money records; browser suites for sales and shipping.

## 2. Procure to stock

Only the last step exists.

| Step | State |
|---|---|
| Purchase request, approval, purchase order, vendor | Not built. The order type PO exists in the schema and nothing uses it (I-007) |
| Receipt | `POST /api/inventory/receipts` (form) and `/bulk-upload` (file). Needs item number, heat, grade, weight and location. Creates the stock item and the stock level, records a RECEIVE movement and the person |
| Inspection | A stock item has a quality status and can be put on hold (`POST /api/coils/:id/hold`), which blocks reservation. Receiving does not require an inspection |
| Availability | Immediate on receipt |

Recovery: a wrong receipt is corrected by editing the item or by an adjustment route; there is no screen for adjustments (I-016). Verified by the sweep section "Receiving" (32 checks) and unit tests.

## 3. Make to order

Order → reserve → `POST /api/jobs` (or the order entry screen creates jobs with the order) → `POST /api/jobs/:id/plan` creates a DispatchJob and its DispatchOperations from the routing → work centers pull from the dispatch queue → `POST /api/v1/operations/:id/start`, `/pause`, `/complete` write time logs → when every operation is complete the job moves to WAITING_QC → `POST /api/qc/inspections/:id/pass` moves it on → packaging, drop tags and staging (material tracking) → shipment.

| Record | Allowed moves | Enforced by |
|---|---|---|
| Job | As in section 1 | `lib/workflowRules.js`, every route that moves a job records who (`lib/jobHistory.js`) |
| Dispatch operation | Start, pause, complete, reassign | Nothing. Any call is accepted in any state (B-011) |
| Coil work order | DRAFT → READY → IN_PROGRESS → QC_HOLD or COMPLETE; CANCELLED | `lib/workOrderRules.js` |
| Inspection | PENDING → PASSED, FAILED, HOLD | Route code |
| Package and drop tag | Ten and ten states in the schema | Service code, never run by a test |

Verified: job creation and every job move (simulation, 51 sweep checks, browser suite). Mapped only: planning, operations and time logs, inspection fail and hold, packages and tags.

Gaps: starting, completing and reassigning an operation are several saves with no transaction (B-010). Consumed material, scrap and remnants are not recorded by any step. Machine capacity is not checked when a job is scheduled.

## 4. Branch transfer

`POST /api/inventory/transfer`: the whole stock item moves from one location to another at once and a TRANSFER movement is recorded with the person. Refused when the from-location is wrong or only part of an item is asked for.

There is no transfer request, approval, reservation for transfer, shipment between branches, in-transit state, receipt at the destination or reconciliation. The second stock list has transfers with statuses and is not connected to this stock (B-009). Verified by the simulation's multi-location and transfer scenarios.

## 5. Return and credit

`POST /api/returns` against a shipped line, no more than was shipped → `POST /api/returns/:id/receive` with a disposition of restock or scrap → stock is put back (or not) and a credit memo is raised against the invoice in the same transaction → the return is closed. `POST /api/returns/:id/cancel` before receipt.

Who: sales opens; warehouse, production or sales receives. The credit is automatic on receipt; there is no inspection step and no approval. Verified by the simulation's return jobs including three receipts at once (counted once, one credit memo).

## 6. Remnant life cycle

Remnant records can be listed, priced, reserved and released (`/api/remnants`) and are shown in the web store. Nothing in the server creates a remnant: no processing step produces one, and no route issues material to a job. The life cycle in the brief (issue, process, generate, identify, store, reallocate) does not exist beyond the last two steps. Not verified.

## 7. Exception management

`POST /api/v1/events/exceptions` saves an exception record; `/acknowledge` marks it seen; the operations cockpit and the role dashboard list them. There is no shortage detection, no alternative sourcing (the branch comparison on the order screen uses invented stock, X-007), no rescheduling step and no customer notification (B-019). Over-reservation and over-shipment are refused at the time, which is prevention, not exception handling. Not verified.

## What must be preserved when these workflows are changed

1. Dispatch, payment, return receipt and reservation are each one transaction and are safe under simultaneous requests. Any refactor must keep the race tests passing.
2. Every job move, shipment step and money action writes a record with the person.
3. The stock balance rule (on hand = available + allocated + on hold) is enforced by the database.
4. Order status PARTIAL and COMPLETE come only from shipping.
