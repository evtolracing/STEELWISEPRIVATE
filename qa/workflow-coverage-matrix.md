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
| Invoice | none | No route creates an invoice. | **Blocked** (D-016) |
| Payment, credit | none | No route. | **Blocked** (D-016) |
| Return, RMA | none | Order type RETURN exists, nothing processes one. | **Blocked** (D-015) |

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
| Price at checkout | Partial: the price is taken from the browser (D-017) |

## Counter sales (POS)

| Path | Coverage |
|---|---|
| POS session: pick customer, add product, price, submit as a sales order | Covered after repair (D-010) |
| Delivery, will-call, payment steps of the session | Not covered |
| Quick sale (walk-in, cash or card) | **Blocked**: cannot add an item or pay, nothing is saved (D-014) |

## Quotes and RFQs

Blocked. The server routes do not match the database and the screens call routes that do not exist (D-019).

## Documents (mill certs)

List, upload, download, delete repaired (D-011) and checked by the sweep for bad input. Upload on the hosted site is blocked until file storage is chosen (D-011b). Not part of the 50-job cycle.

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

Every cycle also runs five simultaneous-request probes and a whole-database reconciliation.
