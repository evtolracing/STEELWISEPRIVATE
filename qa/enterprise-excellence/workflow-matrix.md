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
| Quote to order | Yes | Yes | No revisions, no approval step |
| Credit hold and release | Yes | Yes | |
| Stock hold and release | Yes | Yes | Whether held or uninspected stock may ship is partly decided |
| Coil work order | Yes | Yes | Does not consume or produce stock (M-016) |
| Quality inspection of a job | Yes | Pass path only | Fail, hold and rework paths mapped only |
| Shipment documents and tags | Routes exist | No | Not examined (F-011) |
| Partner API (customer, supplier, carrier) | Routes exist | Refusal only | No success-path test; failed webhooks are not retried (B-018) |
| User life cycle | Yes | Refusal only | No success-path test |

17 workflows mapped. 9 verified end to end, 3 verified in part, 5 mapped only.

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
