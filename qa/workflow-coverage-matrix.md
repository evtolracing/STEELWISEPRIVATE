# Workflow and coverage matrix

What each business workflow does in the code today, whether the simulation exercises it, and where it stops. "Sim" means the 50-job cycle in `qa/sim/run.mjs`; "Sweep" means `qa/sim/security.mjs`; "Unit" means `src/backend/test`.

Status key: **Covered** = exercised end to end with checks on the database afterwards. **Partial** = some steps exercised. **Blocked** = the app has no working path, so there is nothing to simulate. **Not covered** = a path exists but this audit did not exercise it.

## Order to delivery

| Step | Route | Rules now enforced | Coverage |
|---|---|---|---|
| Create sales order | `POST /api/orders` | Signed-in user is the creator. Quantities above zero. Line total must equal quantity × price. Subtotal must equal the lines. Total must equal subtotal + tax + freight. Customer must exist. Unique number under simultaneous saves. | Covered (Sim, Sweep) |
| Confirm, hold, cancel | `PUT /api/orders/:id` | Status table in `lib/workflowRules.js`. PARTIAL and COMPLETE only come from shipping. Cancelled and completed orders are final. Cancelling gives reserved stock back. Only header fields can be edited. | Covered (Sim, Unit) |
| Reserve stock | `POST /api/orders/:id/allocate` | Quantity above zero, no more than available, no more than the line still needs. Not on held stock. Not on cancelled or completed orders. Safe under simultaneous requests. | Covered (Sim incl. race) |
| Create shop job | `POST /api/jobs` | Unique number. New jobs start as ORDERED, SCHEDULED or ON_HOLD. | Covered |
| Run the job | `POST` / `PATCH /api/jobs/:id/status` | Status table: no finishing work that never started, no changes after completed or cancelled, shipped can only be completed. | Covered (Sim, Unit) |
| Edit a job | `PATCH` / `PUT /api/jobs/:id` | Only listed fields. Job number and timestamps cannot be overwritten. A started job cannot be moved to another order. | Covered |
| Create shipment | `POST /api/shipments` | Order must be CONFIRMED or PARTIAL. Lines must belong to the order. Cannot exceed what is left to ship, counting other open shipments. | Covered (Sim incl. race) |
| Dispatch | `PUT /api/shipments/:id/dispatch` | Only from PENDING or LOADING, once. Updates line shipped quantity, line status, order status, takes reserved stock out, writes a SHIP movement. | Covered (Sim incl. triple dispatch) |
| Deliver | `PUT /api/shipments/:id/deliver` | Only after dispatch. | Covered |
| Partial shipments | same | Order becomes PARTIAL then COMPLETE. | Covered |
| Invoice | `POST /api/invoices`, and automatically at dispatch | Bills what shipped, once. Terms, tax and freight per rules 11 to 13. | Covered by every shipping job |
| Payment, credit | `/api/invoices/:id/payments`, `/credit`, `/refund`, `/cancel` | No overpayment; credits and refunds need a manager. | Covered |
| Return, RMA | `/api/returns` | Against shipped quantity only; restock or scrap; credit on receipt. | Covered by the return jobs |

## Inventory

| Step | Route | Rules now enforced | Coverage |
|---|---|---|---|
| Receive | `POST /api/inventory/receive` | Quantity above zero, item and location exist, signed-in user recorded, cannot receive at a different location from where the item is. | Covered |
| Transfer between locations | `POST /api/inventory/transfer` | From-location must match. Whole item moves. Both the stock record and the item record move. Movement recorded. | Covered |
| Books check | n/a | On hand = available + reserved + hold; reserved = open reservations; no negatives; one location per item. Checked for all 323 QA stock items after every cycle. | Covered |
| Cycle count, adjustment, scrap | not examined | | Not covered |
| v1 unit tracking (`/api/v1/inventory`, RFID) | separate tables | Not linked to the stock records above (D-024). | Not covered |

## Online store and customer accounts

| Step | Coverage |
|---|---|
| Customer signs in, browses catalog | Covered |
| Checkout creates a web order under the customer's own account | Covered |
| CSR accepts the web order into a sales order | Covered |
| One customer cannot open another customer's order | Covered (Sim and Sweep) |
| Customer login cannot reach any staff route (519 routes tried) | Covered (Sweep) |
| Price at checkout | The server saves the system price for the customer's level (D-017 fixed) |

## Counter sales (POS)

| Path | Coverage |
|---|---|
| POS session: pick customer, add product, price, submit as a sales order | Covered after repair (D-010) |
| Delivery, will-call, payment steps of the session | Not covered |
| Quick sale (walk-in, cash or card) | Covered: priced and taxed by the server, saved once, void by a manager. Cards are recorded, not charged (D-033) |

## Quotes and RFQs

Covered. RFQ, quote, send, accept into a sales order, with one working screen (D-019 fixed). A quote-to-order job runs in every cycle.

## Documents (mill certs)

List, upload, download, delete repaired (D-011) and checked by the sweep for bad input. On the hosted site files are stored in the database (D-011b fixed, run locally in hosted mode). Not part of the 50-job cycle.

## Not examined in this audit

Scheduling and dispatch planning, QC inspections, maintenance, drop tags, BOM recipes, partner API flows with real partner tokens, analytics, executive dashboards, label printing, AI features, and every external integration (email, SMS, carriers, payments, EDI). These have routes that answered the sweep, but their business results were not verified.

## Scenario mix per cycle

| Category | Jobs | What it does |
|---|---|---|
| Standard metals | 8 | Order, confirm, reserve, one job through the shop, ship, deliver |
| Multi-step metals | 6 | Same with two or more work centers |
| Plastics | 6 | Same on plastics stock and plastics machines |
| POS and online store | 5 | 3 web orders, 2 POS session sales |
| Multi-location | 6 | Stock at another branch: transfer in, or ship from there |
| Transfers and receiving | 5 | Receive, transfer, and the refusals (negative, wrong branch, part of an item) |
| Rush, backorder, exception | 5 | Rush job, over-reservation refused, cancel gives stock back, reopen refused, bad status moves refused, over-ship refused, deliver before dispatch refused |
| Partial, rework, return | 5 | Two-part shipment, rework loop in the shop, double-ship refused; 1 return scenario is blocked |
| Mixed division | 4 | Metals and plastics lines on one order |

Every cycle also runs eight simultaneous-request probes and a whole-database reconciliation.
