# Phase 2: service boundaries

Who may do what, where each boundary is enforced, and how one part of the server may call another. Written by hand on 2026-11-13. "Enforced" means on the server; what a screen hides is a convenience, not a boundary.

## 1. The four boundaries, in the order a request meets them

| Boundary | Question | Enforced in | Proven by |
|---|---|---|---|
| Sign-in | Is this a known, active login? | `middleware/apiGate.js`, `middleware/auth.js` | Sweep: 611 routes, 0 answer without a sign-in; forged and expired tokens refused |
| Kind of login | Customer and partner logins reach only the store API; partner tokens only the partner API | `lib/roleAccess.js` (`EXTERNAL_PREFIXES`), `lib/customerScope.js` | Sweep: 534 staff routes tried as a customer, 0 not refused; 31 checks that customers and divisions cannot see each other |
| Department | May this role change this kind of record? | `lib/roleAccess.js` (`WRITE_RULES`, `MANAGER_ONLY`, the admin area in the gate) | Unit tests on the table; probe: 540 changing calls by view-only roles, 0 not refused; `phase2-integrity`: 10 refusals through the API; `access-coverage`: 0 changing routes without a rule |
| Branch | Does this record belong to one of the user's branches? | `lib/branchScope.js`, applied by `lib/db.js` under every query | `branch-boundary`: 37 checks |

A fifth, narrower boundary sits inside user administration: who may give a login which role and which branches (`lib/userAdminRules.js`, C-001).

## 2. The department table (owner's decision 3)

Managers (super admin, tenant owner, admin, branch manager, operations manager) and leadership (executive, CFO, COO, CIO, division director, service center) may change anything below. View-only roles (data analyst, auditor) may change nothing. Reading is not limited by department.

The first seven lines existed before Phase 2. The rest are new and are the engineer's assignment under decision 3; the owner can change any line.

| Area | Who may change it, besides managers and leadership |
|---|---|
| Reserving stock for an order; receiving a return | Sales, warehouse, production |
| Counter sales | Sales, warehouse |
| Orders, quotes, requests for quotation, returns, customers, invoices | Sales |
| Stock items, stock levels, heats | Warehouse, production, quality |
| Shipments | Warehouse, sales, and the production manager, packaging lead, material handler and work center lead |
| Jobs and work orders | Production, sales, warehouse, quality |
| Credits, refunds, cancelling an invoice, voiding a counter sale, tax rates | Managers, leadership, credit manager and sales director only |
| **Deleting a document** (attaching one stays open to all staff) | A department manager: production, inventory, quality, maintenance, sales director, credit manager |
| **Processing recipes and bills of material** | Production manager, scheduler, quality manager |
| **Work centers** | Production manager, scheduler, maintenance manager |
| **Dispatch set-up and scheduling runs** | Production manager, scheduler, work center lead |
| **Operators, skills and shifts** | Production manager, scheduler, work center lead |
| **Equipment records** | Maintenance, production manager |
| **Maintenance orders** | Maintenance and production staff; deleting one: the maintenance or production manager |
| **Tag templates** | Production manager, inventory manager, packaging lead |
| **Drop tags and packages** | Production, warehouse |
| **Print queue** | Production, warehouse, sales, quality |
| **Stop-work: raising one, adding evidence** | Any staff in a working department (anyone may stop work for safety) |
| **Stop-work: moving it on, completing a step, clearing it** | Production, maintenance or quality manager, or a work center lead |
| **Second stock list** (`/api/v1/inventory`) | Warehouse, production, quality |
| **Order hub: planning or packaging an order** | Production, sales, warehouse |
| **Order hub: contacts, requests, quotes, orders; the order pipeline; email intake** | Sales |
| **Demand shaping: settings** | Sales director |
| **Demand shaping: accepting or dismissing a suggestion** | Sales |
| **Exception events** | Any staff in a working department |
| **Material tracking** | Warehouse, production, quality |
| **Shop-floor operations** (start, pause, complete, reassign) | Production |
| **Inspections** | Quality, production manager |
| **Operations recommendations** (accept, dismiss) | Production manager, scheduler, inventory manager |

Areas with their own check inside the handler, unchanged: grades (managers, inventory manager, buyer, quality manager), products (managers, inventory manager, buyer; a list price needs a manager), price overrides (requested by sales, approved by a manager), users (section 4), everything under `/api/admin` (administrators).

`qa/tools/access-coverage.mjs` reads the route list and this table and fails the gates if a changing route has neither a rule nor a stated reason. This session: 319 changing routes, 0 without.

## 3. The branch boundary (owner's decision 2)

**Who is held to their branches.** Every staff role except: super admin, tenant owner, admin, executive, CFO, COO, CIO, division director, operations manager, sales director, credit manager, data analyst, auditor, integration admin. A held login sees and changes records of its home branch and of any branch assigned to it (a regional manager is a branch manager with three branches assigned).

**What belongs to a branch, and how the branch is known.**

| Record | Its branch is |
|---|---|
| Order | `Order.locationId` (new in Phase 2): the branch of the person who enters it, or the branch named on entry |
| Order line, invoice, invoice line, payment | The branch of its order |
| Stock item, stock level | Where the item is |
| Shipment, shipment item | The branch it ships from |
| Job | The branch of its order, or of its work center, or (with neither) of the person who created it |
| Work order | Where its source stock item is |
| Work center | Its branch |
| Dispatch job, dispatch operation | The branch the plan was made for |
| Stock movement | The branch it left or the branch it arrived at |

**Behaviour.** A record of another branch is "not found" (404) when read, changed or deleted, and is absent from every list and total. Creating a record for a branch you are not in is refused (403). Handing your own order or shipment to a branch you are not in is refused (403).

**Crossing branches on purpose.** A transfer sends stock from one of your branches to any branch; you can send, you cannot pull. Head office can enter an order for any branch. Order, shipment and invoice numbers stay one company-wide series (`acrossBranches` in `lib/numbering.js` is the single place the boundary is lifted, for counting only).

**What it does not cover yet** is finding C-009: quotes and requests for quotation, packages, drop tags, documents and the two JSON stores have no branch column; and records reached through a nested include of another type. (Raw SQL is used in two places only: the health check, and the two row locks when an operation is completed, which name the row by id after the scoped read has found it.) Customers and products are shared company-wide by design.

## 4. Who may change a login (C-001)

| Actor | May | May not |
|---|---|---|
| Super admin, tenant owner | Anything | |
| Admin | Create and change any login below super admin | Create, change, switch off or reset a super admin or tenant owner |
| Branch manager | Create and change staff of their own branches, in roles below branch manager | Grant an all-branch role, an admin role or branch manager; assign a branch they are not in; change a login outside their branches; change their own role or branches; grant extra roles |
| Everyone else | | Any of it |

## 5. How server code may call server code

These are the conventions the code follows today; Phase 2 found one breach of the first (C-002) and fixed none by moving code, in line with "no mass refactors".

1. **One implementation per business step.** Dispatching a shipment, raising an invoice, taking a payment, crediting, receiving stock, moving a job: each exists once. A second entry point (a partner route, a second address) calls the first; it does not copy it. The carrier partner routes copy shipping and are wrong (C-002).
2. **Rules with no database access live in `lib/*Rules.js`** and are unit tested. A handler asks the rule and then saves.
3. **A step that saves more than one record uses one transaction**, and takes the database client as a parameter (`tx`) so it can be part of a larger one. `recordJobMove`, `moveJob`, `recordMoney`, `takeShelfStock` follow this. `creditInvoice` and `recordRefund` do not yet (C-010).
4. **A status change is conditional on the status it was checked in** (`updateMany … where status = …`), so two people cannot both win. Orders, shipments, invoices, returns and work orders did this already; jobs and operations do since Phase 2.
5. **Handlers never trust an id of a person sent by the browser.** Who did something comes from the sign-in (`req.user`). Phase 2 corrected three places that took it from the request body (job creator, counter session, executive decision).
6. **No handler filters by branch itself.** The database client does.

## 6. Modules and what they may write

| Module | Owns (writes) | Reads from others | Notes |
|---|---|---|---|
| Sales (orders, quotes, RFQs, customers, intake, counter) | Order, OrderLine, Quote, RFQ, Organization, allocations | Product, stock levels, tax rates, credit | The counter also writes Invoice, Payment and stock movements, inside one transaction |
| Inventory (stock items, receiving, transfer, holds) | Coil, Inventory, MaterialMovement, Heat | Product, Location | The only writers of stock levels are: receiving, transfer, hold and release, allocation, shipping dispatch, return receipt, counter sale and void |
| Shipping | Shipment, ShipmentItem; on dispatch: stock levels, movements, order status, invoice | Orders, allocations | The only place an order becomes PARTIAL or COMPLETE |
| Billing | Invoice, InvoiceLine, Payment, credit memos | Orders, shipments | Money events are written by one function (`recordMoney`) |
| Shop floor (jobs, work orders, operations, dispatch) | Job, WorkOrder, DispatchJob, DispatchOperation, DispatchTimeLog | Orders, work centers, operators | Completing a work order moves no stock (M-016, the owner's decision) |
| Quality | Inspection records; job status on a result | Jobs | |
| Set-up (work centers, recipes, BOMs, staff, equipment) | Its own tables | | Department rules new in Phase 2 |
| Second stock list, order hub | JSON documents in AppSetting | Nothing | To be connected or retired (B-009) |
