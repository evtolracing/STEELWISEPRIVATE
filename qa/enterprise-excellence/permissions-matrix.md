# Permissions matrix

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit 2d801ff. Do not edit by hand: change the source and rerun.

How access is decided today, read from `src/backend/src/middleware/apiGate.js`, `lib/roleAccess.js`, `lib/customerScope.js` and the route guards, and checked by the sweep and the baseline probe.

## The layers, in the order a request meets them

1. **Sign-in.** Every `/api` route needs a signed token except sign-in, first-user registration, the health check and the partner API (which has its own tokens). Sweep: 557 routes tried with no token, 0 let in.
2. **Customer and partner logins** reach only the store routes, and only their own account and the accounts beneath it. Sweep: 534 staff routes tried as a customer, 0 let in; 31 cross-account checks.
3. **Leadership pages** (executive, order-speed metrics) are limited to leadership roles, for reading too.
4. **Department write rules.** Staff may change only the records their department owns (table below). Reading is open to every staff login by design.
5. **Read-only roles** (auditor, data analyst) change nothing (B-002, fixed in Phase 1).
6. **Admin routes**: changing anything under `/api/admin` needs an admin role.

## What does not exist

- **No branch, division or region boundary.** `User.homeLocationId`, `UserLocation` and `UserDivision` are stored and read by no route. Every staff login reads every branch and, within its department, changes any branch (B-003).
- **No tenant boundary between companies on staff routes.** Only the user list is filtered by organization. The system runs as one company. If a second company is ever hosted in the same database, every staff route would show it both (E-019).
- **No approval authority.** ApprovalRequest and ApprovalDecision tables exist with no code. The only approvals are: a manager releases a credit hold; a manager issues credits and refunds.
- **No permission inheritance.** `Role`, `UserRoleAssignment` tables are saved by the user screen and read by no access check; access comes from the single `User.role` value.
- **The screens have their own list** (`src/frontend/src/config/roleAccess.js`, 113 lines; `constants/permissions.js` is imported by nothing). The server list is the one that counts.

## Roles and their department

48 roles in the schema.

| Department | Roles |
|---|---|
| admin | SUPER_ADMIN, TENANT_OWNER, ADMIN, BRANCH_MANAGER, OPS_MANAGER |
| leadership | EXECUTIVE, CFO, COO, CIO, DIVISION_DIRECTOR, SERVICE_CENTER |
| sales | SALES_DIRECTOR, SALES_REP, CSR, ESTIMATOR, CREDIT_MANAGER, SUPPORT_AGENT |
| production | PRODUCTION_MANAGER, SCHEDULER, WORKCENTER_LEAD, OPERATOR_SAW, OPERATOR_ROUTER, OPERATOR_SHEAR, OPERATOR_PLASMA, OPERATOR_GENERAL, MILL_OPERATOR, PACKAGING_LEAD, MATERIAL_HANDLER |
| warehouse | INVENTORY_MANAGER, BUYER, RECEIVING_CLERK, SHIPPING_COORDINATOR |
| quality | QC_MANAGER, QC_INSPECTOR |
| maintenance | MAINTENANCE_MANAGER |
| readOnly | DATA_ANALYST, AUDITOR |
| integration | INTEGRATION_ADMIN |
| customer and partner logins | CUSTOMER_ADMIN, CUSTOMER_BUYER, CUSTOMER_VIEWER, SUPPLIER_USER, CARRIER_USER |

## Who may change what

Admin and leadership departments may change everything below.

| Records | Departments that may change them |
|---|---|
| Orders, quotes, RFQs, customers, invoices and payments, opening a return | sales |
| Counter sales | sales, warehouse |
| Reserving stock for an order; receiving a return | sales, warehouse, production |
| Stock records (stock items, heats, receiving, holds, transfers) | warehouse, production, quality |
| Shipments | warehouse, sales, plus production manager, packaging lead, material handler, work-center lead |
| Jobs and coil work orders (at both addresses since B-001) | production, sales, warehouse, quality |
| Credits, refunds, cancelling an invoice, voiding a counter sale, tax rates | managers only: admin, leadership, credit manager, sales director |
| Anything under /api/admin and /api/v1/admin | admin group only |
| Users | SUPER_ADMIN, TENANT_OWNER, ADMIN, BRANCH_MANAGER, OPS_MANAGER (route guard) |
| Products, grades, price levels | checked inside the handlers (sweep section "Heats, products and grades") |
| Executive pages and order-speed metrics (reading too) | leadership roles |

## Areas with no department rule (B-004)

Any staff login that is not read-only can change these. Measured with a saw-operator login against every write route.

| Area | Write routes | Routes |
|---|---:|---|
| Processing recipes | 4 | /api/processing-recipes |
| Work centers | 2 | /api/work-centers |
| Staff, skills and shifts | 9 | /api/staff |
| Dispatch set-up and queue | 9 | /api/v1/dispatch |
| Shop-floor operations | 4 | /api/v1/operations |
| Bills of material | 7 | /api/v1/bom |
| Assets | 4 | /api/assets |
| Maintenance orders | 5 | /api/maintenance-orders |
| Documents (upload, delete) | 3 | /api/documents |
| Drop tags and packages | 23 | /api/drop-tags |
| Print queue | 5 | /api/print-queue |
| Stop work | 7 | /api/safety/stop-work |
| Second stock list | 5 | /api/v1/inventory |
| Order hub | 9 | /api/v1 |
| Demand shaping | 4 | /api/demand-shaping |
| Exception events | 2 | /api/v1/events |
| Material tracking | 3 | /api/material-tracking |
| Quality inspections | 6 | /api/qc |
| Operations cockpit actions | 3 | /api/ops-cockpit |

## Evidence from this session

| Check | Result |
|---|---|
| Read-only roles cannot change anything | 542 write calls as auditor and data analyst, 0 not refused |
| A second address follows the same department rules | 4 checks, 0 problems |
| Write routes sent an empty body do not crash | 275 write routes, 3 answered with a server error (allowed: 3), 7 saved a record from nothing |
| Branch to branch access (reported, not judged) | a login whose home branch is DEMO-KZO read 6 stock rows of another branch → 200; the same login listed orders of every branch → 200; it opened one order by id → 200; it placed a hold on a stock item at the other branch → 400; rows that assign users to branches (UserLocation): 0; to divisions (UserDivision): 0 |

## Decisions needed from the owner

1. Which roles are held to their own branch, and which to a region, for reading and for changing (B-003).
2. The owner department for each area in the table above (B-004).
3. Whether every staff login should read invoices and cost-bearing records (F-009).

