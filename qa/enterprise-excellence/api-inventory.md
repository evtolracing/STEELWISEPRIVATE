# API inventory

Generated 2026-11-13 by `qa/tools/excellence-docs.mjs` at commit c4da120. Do not edit by hand: change the source and rerun.

611 routes in 72 route files, served at 74 mount points. 319 change data.

## What the columns mean

- **Tested OK**: the route returned a success at least once during the full gate run of this session (from server request logs). A route that only ever returned a refusal is not counted.
- **Tx**: the handler uses a database transaction. **Writes**: database changes written in the handler itself (a handler that calls a service shows 0).
- **No limit**: the handler has a list query with no row limit. **Record**: the handler writes an audit or history record.
- These are counts from reading the code by pattern. They locate candidates; they do not prove a defect.

## Totals

| Measure | Count |
|---|---:|
| Routes that returned a success in a test | 285 of 611 |
| Changing routes that returned a success in a test | 88 of 319 |
| Changing handlers with two or more database writes and no transaction | 5 |
| Read routes with a list query that has no row limit | 58 |
| Handlers with no try/catch of their own | 135 (many use a shared wrapper) |
| Routes that use raw SQL | 2 |
| Calls the screens make that have no server route | 80 |

## Reply shapes

Three shapes are in use: a bare record or list (most older routes), `{ data, meta }` (order entry, products search), and `{ success, data }` or `{ success, error }` (dispatch, operations, order hub). Finding E-021.

## Changing handlers with several writes and no transaction (B-010)

| Route | Writes | File |
|---|---:|---|
| `POST /api/demand-shaping/suggestions` | 2 | demandShaping.js:124 |
| `DELETE /api/v1/dispatch/work-center-types/:id` | 2 | dispatchRoutes.js:206 |
| `POST /api/assets/seed-from-work-centers` | 2 | assets.js:66 |
| `POST /api/ops-cockpit/recommendations/accept` | 3 | opsCockpit.js:527 |
| `POST /api/v1/partner/carrier/shipments/:id/pod` | 2 | partner/carrierRoutes.js:291 |

## Read routes with an unlimited list query (B-012)

| Route | File |
|---|---|
| `GET /api/users/roles/list` | users.js:459 |
| `GET /api/users/locations` | users.js:614 |
| `GET /api/users/divisions` | users.js:631 |
| `GET /api/grades` | grades.js:25 |
| `GET /api/products` | products.js:40 |
| `GET /api/coils/:id/history` | coils.js:113 |
| `GET /api/inventory/locations` | inventory.js:153 |
| `GET /api/processing-recipes` | processingRecipes.js:67 |
| `GET /api/processing-recipes/routing-templates` | processingRecipes.js:81 |
| `GET /api/demand-shaping/analytics` | demandShaping.js:166 |
| `GET /api/processing/operations` | intakeProcessing.js:20 |
| `GET /api/processing/templates` | intakeProcessing.js:43 |
| `GET /api/shipments/shippable` | shipments.js:123 |
| `GET /api/shipments/:id/items` | shipments.js:222 |
| `GET /api/tax-rates` | taxRates.js:8 |
| `GET /api/customers/preferences/list` | customers.js:86 |
| `GET /api/work-centers` | workCenters.js:7 |
| `GET /api/work-centers/:id/schedule` | workCenters.js:117 |
| `GET /api/jobs/sla-risk` | jobs.js:200 |
| `GET /api/documents/entity/:entityType/:entityId` | documents.js:155 |
| `GET /api/pos/quick-sale/daily-stats` | quickSale.js:292 |
| `GET /api/v1/bom/recipes` | bomV1.js:73 |
| `GET /api/v1/analytics/ops-forecast` | analyticsV1.js:12 |
| `GET /api/v1/analytics/rfq-funnel` | analyticsV1.js:126 |
| `GET /api/v1/analytics/work-centers/utilization` | analyticsV1.js:227 |
| `GET /api/v1/events/exceptions/stats` | eventsV1.js:91 |
| `GET /api/v1/jobs/sla-risk` | jobs.js:200 |
| `GET /api/v1/work-centers` | workCenters.js:7 |
| `GET /api/v1/work-centers/:id/schedule` | workCenters.js:117 |
| `GET /api/v1/dispatch/work-center-types` | dispatchRoutes.js:112 |
| `GET /api/v1/dispatch/locations` | dispatchRoutes.js:440 |
| `GET /api/v1/dispatch/work-centers` | dispatchRoutes.js:495 |
| `GET /api/v1/dispatch/operators` | dispatchRoutes.js:520 |
| `GET /api/v1/dispatch/queue` | dispatchRoutes.js:729 |
| `GET /api/v1/dispatch/stats` | dispatchRoutes.js:836 |
| `GET /api/v1/operations` | operationsRoutes.js:45 |
| `GET /api/v1/operations/:id/time-logs` | operationsRoutes.js:387 |
| `GET /api/sales/dashboard/leaderboard` | salesRoutes.js:228 |
| `GET /api/staff/operators` | staff.js:12 |
| `GET /api/staff/operators/:id/skills` | staff.js:284 |
| `GET /api/staff/shifts` | staff.js:404 |
| `GET /api/staff/available` | staff.js:586 |
| `GET /api/qc/inspectors` | qcRoutes.js:440 |
| `GET /api/material-tracking/custody-log` | materialTrackingRoutes.js:77 |
| `GET /api/material-tracking/jobs/:jobId/tags` | materialTrackingRoutes.js:188 |
| `GET /api/material-tracking/jobs/:jobId/packages` | materialTrackingRoutes.js:210 |
| `GET /api/material-tracking/jobs/:jobId/timeline` | materialTrackingRoutes.js:233 |
| `GET /api/maintenance-orders/assets/list` | maintenanceOrders.js:50 |
| `GET /api/assets/types` | assets.js:53 |
| `GET /api/ops-cockpit` | opsCockpit.js:28 |
| `GET /api/v1/partner/customer/orders/:id/milestones` | partner/customerRoutes.js:390 |
| `GET /api/v1/partner/customer/shipments` | partner/customerRoutes.js:543 |
| `GET /api/v1/partner/customer/invoices` | partner/customerRoutes.js:634 |
| `GET /api/v1/partner/supplier/asn` | partner/supplierRoutes.js:194 |
| `GET /api/v1/partner/supplier/scorecard` | partner/supplierRoutes.js:333 |
| `GET /api/v1/partner/carrier/performance` | partner/carrierRoutes.js:440 |
| `GET /api/v1/partner/webhooks` | partner/webhookRoutes.js:38 |
| `GET /api/v1/admin/partners/:id/usage` | partner/adminRoutes.js:273 |

## Every route, by route file

### auth.js (4 routes, 125 lines)

Mounted at /api/auth. Tables: User.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/auth/login` | yes | 1 |  |  |  |  |
| `POST /api/auth/register` |  |  |  |  |  |  |
| `PUT /api/auth/password` |  | 1 |  |  |  |  |
| `GET /api/auth/me` | yes |  |  |  |  |  |

### users.js (13 routes, 692 lines)

Mounted at /api/users. Tables: User, AuditLog, UserLocation, UserDivision, UserRoleAssignment, Role, Location, Division.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/users` | yes |  |  |  |  |  |
| `GET /api/users/:id` | yes |  |  |  |  |  |
| `POST /api/users` | yes | 2 | yes |  | yes | requireRole('SUPER_ADMIN','TENANT_OWNER','ADMIN','BRANCH_MAN |
| `PUT /api/users/:id` | yes | 8 | yes |  | yes | requireRole('SUPER_ADMIN','TENANT_OWNER','ADMIN','BRANCH_MAN |
| `DELETE /api/users/:id` |  | 2 | yes |  | yes | requireRole('SUPER_ADMIN','TENANT_OWNER','ADMIN') |
| `POST /api/users/:id/reset-password` |  | 2 | yes |  | yes | requireRole('SUPER_ADMIN','TENANT_OWNER','ADMIN') |
| `GET /api/users/roles/list` | yes |  |  | yes |  |  |
| `GET /api/users/roles/:id` |  |  |  |  |  |  |
| `POST /api/users/roles` |  | 1 |  |  |  | requireRole('SUPER_ADMIN','TENANT_OWNER') |
| `PUT /api/users/roles/:id` |  | 1 |  |  |  | requireRole('SUPER_ADMIN','TENANT_OWNER') |
| `GET /api/users/enums/roles` | yes |  |  |  |  |  |
| `GET /api/users/locations` |  |  |  | yes |  |  |
| `GET /api/users/divisions` |  |  |  | yes |  |  |

### grades.js (4 routes, 94 lines)

Mounted at /api/grades. Tables: Grade.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/grades` | yes |  |  | yes |  |  |
| `GET /api/grades/:id` |  |  |  |  |  |  |
| `POST /api/grades` | yes | 1 |  |  |  |  |
| `PUT /api/grades/:id` | yes | 1 |  |  |  |  |

### products.js (6 routes, 139 lines)

Mounted at /api/products. Tables: Product, Grade.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/products` | yes |  |  | yes |  |  |
| `GET /api/products/search` | yes |  |  |  |  |  |
| `GET /api/products/categories` | yes |  |  |  |  |  |
| `GET /api/products/:id` |  |  |  |  |  |  |
| `POST /api/products` | yes | 1 | yes |  |  |  |
| `PUT /api/products/:id` | yes | 1 | yes |  |  |  |

### heats.js (6 routes, 161 lines)

Mounted at /api/heats. Tables: Heat, Organization.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/heats` | yes |  |  |  |  |  |
| `GET /api/heats/mills` | yes |  |  |  |  |  |
| `GET /api/heats/:id` | yes |  |  |  |  |  |
| `POST /api/heats` | yes | 1 |  |  |  |  |
| `PUT /api/heats/:id` | yes | 1 |  |  |  |  |
| `GET /api/heats/:heatNumber/trace` | yes |  |  |  |  |  |

### coils.js (8 routes, 282 lines)

Mounted at /api/coils. Tables: Coil, MaterialMovement, QCHold, OrderLineAllocation, Heat, Grade, Organization, Location, Product, User, Inventory.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/coils` | yes |  |  |  |  |  |
| `GET /api/coils/number/:coilNumber` |  |  |  |  |  |  |
| `GET /api/coils/:id` | yes |  |  |  |  |  |
| `GET /api/coils/:id/history` | yes |  |  | yes |  |  |
| `POST /api/coils` |  | 1 |  |  |  |  |
| `PUT /api/coils/:id` | yes | 1 |  |  |  |  |
| `POST /api/coils/:id/hold` | yes | 3 | yes |  |  |  |
| `POST /api/coils/:id/release` | yes | 3 | yes |  |  |  |

### inventory.js (10 routes, 281 lines)

Mounted at /api/inventory. Tables: Inventory, Coil, Location, MaterialMovement.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/inventory` | yes |  |  |  |  |  |
| `GET /api/inventory/search` | yes |  |  |  |  |  |
| `GET /api/inventory/summary` | yes |  |  |  |  |  |
| `POST /api/inventory/receive` | yes | 2 | yes |  |  |  |
| `POST /api/inventory/transfer` | yes | 3 | yes |  |  |  |
| `GET /api/inventory/locations` | yes |  |  | yes |  |  |
| `POST /api/inventory/receipts` | yes |  |  |  |  |  |
| `GET /api/inventory/receipts` | yes |  |  |  |  |  |
| `POST /api/inventory/bulk-upload` | yes |  |  |  |  |  |
| `GET /api/inventory/templates/:type` | yes |  |  |  |  |  |

### intakeOrders.js (7 routes, 606 lines)

Mounted at /api/orders/intake. Tables: Organization, Order, Quote, Job, OrderLine.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/orders/intake` | yes | 1 |  |  |  |  |
| `GET /api/orders/intake` | yes |  |  |  |  |  |
| `GET /api/orders/intake/summary` | yes |  |  |  |  |  |
| `GET /api/orders/intake/:id` |  |  |  |  |  |  |
| `PATCH /api/orders/intake/:id` | yes | 4 | yes |  |  |  |
| `POST /api/orders/intake/:id/submit` | yes | 1 |  |  |  |  |
| `POST /api/orders/intake/:id/create-work-orders` | yes | 2 | yes |  |  |  |

### onlineOrders.js (4 routes, 184 lines)

Mounted at /api/orders/online. Tables: OnlineOrder, Organization, Product, Order.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/orders/online` | yes |  |  |  |  |  |
| `POST /api/orders/online/:id/accept` | yes | 2 | yes | yes |  |  |
| `POST /api/orders/online/:id/hold` |  | 1 |  |  |  |  |
| `POST /api/orders/online/:id/reject` |  | 1 |  |  |  |  |

### remnants.js (9 routes, 48 lines)

Mounted at /api/remnants. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/remnants` | yes |  |  |  |  |  |
| `GET /api/remnants/stats` | yes |  |  |  |  |  |
| `GET /api/remnants/suggestions` | yes |  |  |  |  |  |
| `POST /api/remnants/pricing` | yes |  |  |  |  |  |
| `POST /api/remnants/pricing/batch` |  |  |  |  |  |  |
| `GET /api/remnants/pricing/floor` | yes |  |  |  |  |  |
| `GET /api/remnants/:id` |  |  |  |  |  |  |
| `POST /api/remnants/:id/reserve` |  |  |  |  |  |  |
| `POST /api/remnants/:id/release` |  |  |  |  |  |  |

### portal.js (12 routes, 112 lines)

Mounted at /api/ecom/my-orders, /api/enterprise. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/ecom/my-orders` | yes |  |  |  |  |  |
| `GET /api/ecom/my-orders/:id` |  |  |  |  |  |  |
| `GET /api/ecom/my-orders/:id/documents` | yes |  |  |  |  |  |
| `GET /api/enterprise/accounts/:accountId` | yes |  |  |  |  |  |
| `GET /api/enterprise/accounts/:accountId/kpis` | yes |  |  |  |  |  |
| `GET /api/enterprise/orders` | yes |  |  |  |  |  |
| `GET /api/enterprise/orders/export` |  |  |  |  |  |  |
| `GET /api/enterprise/orders/:orderId` |  |  |  |  |  |  |
| `GET /api/enterprise/shipments` | yes |  |  |  |  |  |
| `GET /api/enterprise/documents` | yes |  |  |  |  |  |
| `GET /api/enterprise/documents/:docId/download` |  |  |  |  |  |  |
| `POST /api/enterprise/documents/bulk-download` |  |  |  |  |  |  |

### ecom.js (13 routes, 83 lines)

Mounted at /api/ecom, /api/admin/catalog. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/ecom/catalog` | yes |  |  |  |  |  |
| `GET /api/ecom/catalog/divisions` | yes |  |  |  |  |  |
| `GET /api/ecom/catalog/families` |  |  |  |  |  |  |
| `GET /api/ecom/catalog/availability` | yes |  |  |  |  |  |
| `GET /api/ecom/catalog/:id` |  |  |  |  |  |  |
| `POST /api/ecom/pricing/config` | yes |  |  |  |  |  |
| `POST /api/ecom/pricing/tax` | yes |  |  |  |  |  |
| `POST /api/ecom/cart/validate` |  |  |  |  |  |  |
| `POST /api/ecom/checkout/submit` | yes |  |  |  |  | requireLinkedCustomer |
| `POST /api/ecom/checkout/quote` |  |  |  |  |  | requireLinkedCustomer |
| `GET /api/admin/catalog` | yes |  |  |  |  |  |
| `PATCH /api/admin/catalog/:productId/visibility` |  |  |  |  |  |  |
| `PATCH /api/admin/catalog/:productId/metadata` |  |  |  |  |  |  |

### processingRecipes.js (7 routes, 143 lines)

Mounted at /api/processing-recipes. Tables: ProcessingRecipe, RecipeRoutingTemplate.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/processing-recipes` | yes |  |  | yes |  |  |
| `GET /api/processing-recipes/routing-templates` | yes |  |  | yes |  |  |
| `GET /api/processing-recipes/:id` |  |  |  |  |  |  |
| `POST /api/processing-recipes` |  | 1 |  |  |  |  |
| `PUT /api/processing-recipes/:id` |  | 1 |  |  |  |  |
| `DELETE /api/processing-recipes/:id` |  | 1 |  |  |  |  |
| `POST /api/processing-recipes/:id/activate` |  | 1 |  |  |  |  |

### demandShaping.js (6 routes, 249 lines)

Mounted at /api/demand-shaping. Tables: DemandSuggestionEvent.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/demand-shaping/suggestions` |  | 2 |  |  |  |  |
| `POST /api/demand-shaping/accept` |  |  |  |  |  |  |
| `POST /api/demand-shaping/dismiss` |  |  |  |  |  |  |
| `GET /api/demand-shaping/analytics` | yes |  |  | yes |  |  |
| `GET /api/demand-shaping/config` | yes |  |  |  |  |  |
| `PUT /api/demand-shaping/config` |  |  |  |  |  |  |

### compressionMetrics.js (7 routes, 272 lines)

Mounted at /api/metrics/compression. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/metrics/compression` | yes |  |  |  |  |  |
| `GET /api/metrics/compression/trend` | yes |  |  |  |  |  |
| `GET /api/metrics/compression/branches` | yes |  |  |  |  |  |
| `GET /api/metrics/compression/csrs` | yes |  |  |  |  |  |
| `GET /api/metrics/compression/sla-risk` | yes |  |  |  |  |  |
| `GET /api/metrics/compression/export` | yes |  |  |  |  |  |
| `GET /api/metrics/compression/filters` | yes |  |  |  |  |  |

### intakePricing.js (6 routes, 187 lines)

Mounted at /api/pricing. Tables: Product, PriceLevel, CustomerPricingTier, AuditLog.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/pricing/calculate` | yes |  |  |  |  |  |
| `POST /api/pricing/tax-estimate` | yes |  |  |  |  |  |
| `GET /api/pricing/contracts` | yes |  |  |  |  |  |
| `GET /api/pricing/overview` | yes |  |  |  |  |  |
| `GET /api/pricing/price-list` | yes |  |  |  |  |  |
| `PUT /api/pricing/list-price/:productId` | yes | 2 | yes |  | yes |  |

### intakeProcessing.js (3 routes, 74 lines)

Mounted at /api/processing. Tables: ProcessingOperation, ProcessingTemplate.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/processing/operations` | yes |  |  | yes |  |  |
| `GET /api/processing/operations/:id` |  |  |  |  |  |  |
| `GET /api/processing/templates` | yes |  |  | yes |  |  |

### orders.js (7 routes, 391 lines)

Mounted at /api/orders. Tables: Order, OrderLineAllocation, Inventory, Coil, AuditLog, OrderLine.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/orders` | yes |  |  |  |  |  |
| `GET /api/orders/credit-holds` | yes |  |  |  |  |  |
| `POST /api/orders/:id/credit-release` | yes |  |  |  |  |  |
| `GET /api/orders/:id` | yes |  |  |  |  |  |
| `POST /api/orders` | yes | 4 | yes | yes |  |  |
| `PUT /api/orders/:id` | yes | 3 | yes |  | yes |  |
| `POST /api/orders/:id/allocate` | yes | 4 | yes |  | yes |  |

### workOrders.js (7 routes, 164 lines)

Mounted at /api/work-orders. Tables: WorkOrder, AuditLog, Coil.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/work-orders` | yes |  |  |  |  |  |
| `GET /api/work-orders/:id` | yes |  |  |  |  |  |
| `POST /api/work-orders` | yes | 4 | yes |  | yes |  |
| `PUT /api/work-orders/:id/release` | yes |  |  |  |  |  |
| `PUT /api/work-orders/:id/start` | yes |  |  |  |  |  |
| `PUT /api/work-orders/:id/complete` | yes |  |  |  |  |  |
| `PUT /api/work-orders/:id/cancel` | yes |  |  |  |  |  |

### shipments.js (11 routes, 456 lines)

Mounted at /api/shipments. Tables: Shipment, Order, Job, Invoice, AuditLog, Location, ShipmentItem, OrderLineAllocation, Coil, Inventory, MaterialMovement, OrderLine, WorkCenter.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/shipments` | yes |  |  |  |  |  |
| `GET /api/shipments/shippable` | yes |  |  | yes |  |  |
| `GET /api/shipments/:id` | yes |  |  |  |  |  |
| `POST /api/shipments` | yes | 1 | yes |  | yes |  |
| `PUT /api/shipments/:id` | yes | 1 |  |  |  |  |
| `GET /api/shipments/:id/items` |  |  |  | yes |  |  |
| `POST /api/shipments/:id/items` |  | 1 | yes |  |  |  |
| `DELETE /api/shipments/:id/items/:itemId` |  | 14 | yes | yes | yes |  |
| `PUT /api/shipments/:id/dispatch` | yes |  |  |  |  |  |
| `PUT /api/shipments/:id/deliver` | yes |  |  |  |  |  |
| `PATCH /api/shipments/:id/status` | yes |  |  |  |  |  |

### invoices.js (7 routes, 64 lines)

Mounted at /api/invoices. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/invoices` | yes |  |  |  |  |  |
| `GET /api/invoices/:id` | yes |  |  |  |  |  |
| `POST /api/invoices` | yes |  |  |  |  |  |
| `POST /api/invoices/:id/payments` | yes |  |  |  |  |  |
| `POST /api/invoices/:id/credit` | yes |  |  |  |  |  |
| `POST /api/invoices/:id/refund` | yes |  |  |  |  |  |
| `POST /api/invoices/:id/cancel` | yes |  |  |  |  |  |

### returns.js (6 routes, 307 lines)

Mounted at /api/returns. Tables: Order, MaterialMovement, Inventory, InvoiceLine, Coil, OrderLine.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/returns` | yes |  |  |  |  |  |
| `GET /api/returns/eligible` |  |  |  |  |  |  |
| `GET /api/returns/:id` |  |  |  |  |  |  |
| `POST /api/returns` | yes | 1 | yes | yes |  |  |
| `POST /api/returns/:id/receive` | yes | 6 | yes |  |  |  |
| `POST /api/returns/:id/cancel` |  | 1 |  |  |  |  |

### taxRates.js (3 routes, 64 lines)

Mounted at /api/tax-rates. Tables: SalesTaxRate, Location.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/tax-rates` | yes |  |  | yes |  |  |
| `PUT /api/tax-rates/:state` |  | 1 |  |  |  |  |
| `DELETE /api/tax-rates/:state` |  | 1 |  |  |  |  |

### overrides.js (6 routes, 175 lines)

Mounted at /api/overrides. Tables: AuditLog.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/overrides` | yes | 1 |  |  | yes |  |
| `GET /api/overrides` | yes |  |  |  |  |  |
| `GET /api/overrides/count` | yes |  |  |  |  |  |
| `GET /api/overrides/audit` | yes |  |  |  |  |  |
| `GET /api/overrides/stats` | yes |  |  |  |  |  |
| `POST /api/overrides/:id/revoke` | yes | 2 | yes |  | yes |  |

### salesDashboard.js (1 routes, 116 lines)

Mounted at /api/sales-dashboard. Tables: RFQ, Quote, User.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/sales-dashboard` | yes |  |  |  |  |  |

### dashboard.js (2 routes, 144 lines)

Mounted at /api/dashboard. Tables: Inventory, Order, QCHold, Coil, Shipment.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/dashboard` | yes |  |  |  |  |  |
| `GET /api/dashboard/kpis` | yes |  |  |  |  |  |

### customers.js (8 routes, 424 lines)

Mounted at /api/customers. Tables: Organization, AuditLog, CustomerPreference, CustomerPricingTier.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/customers` | yes |  |  |  |  |  |
| `GET /api/customers/preferences/list` | yes |  |  | yes |  |  |
| `GET /api/customers/:id` |  |  |  |  |  |  |
| `POST /api/customers` |  | 1 |  |  |  |  |
| `PATCH /api/customers/:id` | yes | 2 | yes |  | yes |  |
| `GET /api/customers/:id/preferences` | yes |  |  |  |  |  |
| `PUT /api/customers/:id/preferences` | yes | 3 | yes |  | yes |  |
| `DELETE /api/customers/:id/preferences` |  | 1 |  |  |  |  |

### rfqs.js (5 routes, 120 lines)

Mounted at /api/rfqs. Tables: RFQ, Organization, Quote.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/rfqs` | yes |  |  |  |  |  |
| `GET /api/rfqs/:id` |  |  |  |  |  |  |
| `POST /api/rfqs` | yes | 1 | yes |  |  |  |
| `PATCH /api/rfqs/:id` |  | 2 | yes |  |  |  |
| `POST /api/rfqs/:id/quotes` | yes |  |  |  |  |  |

### quotes.js (6 routes, 206 lines)

Mounted at /api/quotes. Tables: Quote, RFQ, Order.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/quotes` | yes |  |  |  |  |  |
| `GET /api/quotes/:id` |  |  |  |  |  |  |
| `POST /api/quotes` |  | 1 |  |  |  |  |
| `POST /api/quotes/:id/send` | yes | 1 | yes |  |  |  |
| `POST /api/quotes/:id/reject` |  |  | yes |  |  |  |
| `POST /api/quotes/:id/accept` | yes | 4 | yes |  |  |  |

### workCenters.js (10 routes, 156 lines)

Mounted at /api/work-centers, /api/v1/work-centers. Tables: WorkCenter, Location, Job.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/work-centers` | yes |  |  | yes |  |  |
| `GET /api/work-centers/:id` |  |  |  |  |  |  |
| `POST /api/work-centers` | yes | 1 |  |  |  |  |
| `PATCH /api/work-centers/:id` | yes | 1 |  |  |  |  |
| `GET /api/work-centers/:id/schedule` | yes |  |  | yes |  |  |
| `GET /api/v1/work-centers` | yes |  |  | yes |  |  |
| `GET /api/v1/work-centers/:id` |  |  |  |  |  |  |
| `POST /api/v1/work-centers` |  | 1 |  |  |  |  |
| `PATCH /api/v1/work-centers/:id` |  | 1 |  |  |  |  |
| `GET /api/v1/work-centers/:id/schedule` | yes |  |  | yes |  |  |

### jobs.js (32 routes, 948 lines)

Mounted at /api/jobs, /api/v1/jobs. Tables: Job, OrderLine, DispatchJob, WorkCenterType, User.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/jobs` | yes |  |  |  |  |  |
| `GET /api/jobs/sla-risk` | yes |  |  | yes |  |  |
| `GET /api/jobs/:id` | yes |  |  |  |  |  |
| `POST /api/jobs` | yes | 1 | yes |  |  |  |
| `GET /api/jobs/:id/plan` | yes |  |  |  |  |  |
| `POST /api/jobs/:id/plan` | yes | 3 | yes | yes | yes |  |
| `POST /api/jobs/:id/status` | yes | 1 | yes |  | yes |  |
| `PATCH /api/jobs/:id` | yes |  |  |  |  |  |
| `PATCH /api/jobs/:id/status` | yes | 1 | yes |  | yes |  |
| `PUT /api/jobs/:id` | yes |  |  |  |  |  |
| `POST /api/jobs/:id/assign` | yes | 1 |  |  | yes |  |
| `POST /api/jobs/:id/start` |  | 1 |  |  | yes |  |
| `POST /api/jobs/:id/complete` | yes | 1 |  |  | yes |  |
| `POST /api/jobs/:id/ship` | yes | 1 |  |  | yes |  |
| `GET /api/jobs/:id/history` | yes |  |  |  |  |  |
| `GET /api/jobs/stats/summary` | yes |  |  |  |  |  |
| `GET /api/v1/jobs` | yes |  |  |  |  |  |
| `GET /api/v1/jobs/sla-risk` | yes |  |  | yes |  |  |
| `GET /api/v1/jobs/:id` |  |  |  |  |  |  |
| `POST /api/v1/jobs` |  | 1 | yes |  |  |  |
| `GET /api/v1/jobs/:id/plan` | yes |  |  |  |  |  |
| `POST /api/v1/jobs/:id/plan` |  | 3 | yes | yes | yes |  |
| `POST /api/v1/jobs/:id/status` |  | 1 | yes |  | yes |  |
| `PATCH /api/v1/jobs/:id` |  |  |  |  |  |  |
| `PATCH /api/v1/jobs/:id/status` |  | 1 | yes |  | yes |  |
| `PUT /api/v1/jobs/:id` |  |  |  |  |  |  |
| `POST /api/v1/jobs/:id/assign` |  | 1 |  |  | yes |  |
| `POST /api/v1/jobs/:id/start` |  | 1 |  |  | yes |  |
| `POST /api/v1/jobs/:id/complete` |  | 1 |  |  | yes |  |
| `POST /api/v1/jobs/:id/ship` |  | 1 |  |  | yes |  |
| `GET /api/v1/jobs/:id/history` |  |  |  |  |  |  |
| `GET /api/v1/jobs/stats/summary` | yes |  |  |  |  |  |

### documents.js (7 routes, 260 lines)

Mounted at /api/documents. Tables: Document, DocumentLink, DocumentBlob, Heat.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/documents` | yes |  |  |  |  |  |
| `GET /api/documents/entity/:entityType/:entityId` | yes |  |  | yes |  |  |
| `GET /api/documents/:id` |  |  |  |  |  |  |
| `GET /api/documents/:id/download` | yes |  |  |  |  |  |
| `POST /api/documents/upload` | yes |  |  |  |  |  |
| `POST /api/documents/upload-multiple` |  |  |  |  |  |  |
| `DELETE /api/documents/:id` | yes | 3 | yes |  |  |  |

### quickSale.js (10 routes, 378 lines)

Mounted at /api/pos/quick-sale. Tables: Product, Order, Invoice, MaterialMovement, AuditLog, Payment, InvoiceLine.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/pos/quick-sale/items` | yes |  |  |  |  |  |
| `GET /api/pos/quick-sale/lookup` |  |  |  |  |  |  |
| `POST /api/pos/quick-sale/lookup` |  |  |  |  |  |  |
| `POST /api/pos/quick-sale/price` | yes |  |  |  |  |  |
| `POST /api/pos/quick-sale/process-payment` | yes | 7 | yes |  | yes |  |
| `GET /api/pos/quick-sale/daily-stats` | yes |  |  | yes |  |  |
| `GET /api/pos/quick-sale/:saleId/receipt` | yes |  |  |  |  |  |
| `POST /api/pos/quick-sale/:saleId/void` | yes | 1 |  |  |  |  |
| `POST /api/pos/quick-sale/email-receipt` |  |  |  |  |  |  |
| `POST /api/pos/quick-sale/sms-receipt` |  |  |  |  |  |  |

### pos.js (57 routes, 1336 lines)

Mounted at /api/pos. Tables: Organization.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/pos/workflow/definition` | yes |  |  |  |  |  |
| `GET /api/pos/flows` | yes |  |  |  |  |  |
| `GET /api/pos/flows/:flowId` |  |  |  |  |  |  |
| `GET /api/pos/flows/:flowId/screens` |  |  |  |  |  |  |
| `GET /api/pos/flows/:flowId/screens/:screenId` |  |  |  |  |  |  |
| `GET /api/pos/components` | yes |  |  |  |  |  |
| `GET /api/pos/validation-rules` | yes |  |  |  |  |  |
| `GET /api/pos/validation/rules` | yes |  |  |  |  |  |
| `POST /api/pos/validation/field` |  |  |  |  |  |  |
| `POST /api/pos/validation/entity` |  |  |  |  |  |  |
| `POST /api/pos/validation/business-rules` |  |  |  |  |  |  |
| `POST /api/pos/validation/screen` |  |  |  |  |  |  |
| `POST /api/pos/validation/order` |  |  |  |  |  |  |
| `POST /api/pos/validation/quick-sale` |  |  |  |  |  |  |
| `POST /api/pos/validation/will-call` |  |  |  |  |  |  |
| `POST /api/pos/pricing/session` |  |  |  |  |  |  |
| `POST /api/pos/pricing/line` |  |  |  |  |  |  |
| `DELETE /api/pos/pricing/line/:lineNumber` |  |  |  |  |  |  |
| `POST /api/pos/pricing/discount/preview` |  |  |  |  |  |  |
| `POST /api/pos/pricing/discount/apply` |  |  |  |  |  |  |
| `POST /api/pos/pricing/refresh` |  |  |  |  |  |  |
| `GET /api/pos/pricing/:sessionId` |  |  |  |  |  |  |
| `POST /api/pos/pricing/estimate` |  |  |  |  |  |  |
| `POST /api/pos/pricing/margin/validate` |  |  |  |  |  |  |
| `POST /api/pos/pricing/processing` |  |  |  |  |  |  |
| `POST /api/pos/pricing/quantity-breaks` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/screen` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/screen/validate` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/screen/next` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/screen/previous` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/progress` |  |  |  |  |  |  |
| `POST /api/pos/sessions` | yes |  |  |  |  |  |
| `GET /api/pos/sessions` | yes |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId` |  |  |  |  |  |  |
| `DELETE /api/pos/sessions/:sessionId` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/suspend` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/transition` | yes |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/actions` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/customers/search` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/customers/select` | yes |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/customers` |  |  |  |  |  |  |
| `POST /api/pos/division-flow` |  |  |  |  |  |  |
| `GET /api/pos/divisions/:divisionId/ship-tos` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/division` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/tax-jurisdiction` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/products/search` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/products/:productId` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/products/add` | yes |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/products/add-processed` |  |  |  |  |  |  |
| `PUT /api/pos/sessions/:sessionId/lines/:lineId` |  |  |  |  |  |  |
| `DELETE /api/pos/sessions/:sessionId/lines/:lineId` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/pricing/discount` | yes |  |  |  |  |  |
| `DELETE /api/pos/sessions/:sessionId/pricing/discount/:discountId` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/pricing/discount/:discountId/approve` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/pricing/calculate` |  |  |  |  |  |  |
| `POST /api/pos/sessions/:sessionId/pricing/recalculate` |  |  |  |  |  |  |
| `GET /api/pos/sessions/:sessionId/pricing` | yes |  |  |  |  |  |

### ai.js (9 routes, 332 lines)

Mounted at /api/ai. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/ai/providers` | yes |  |  |  |  |  |
| `GET /api/ai/usage` | yes |  |  |  |  |  |
| `POST /api/ai/chat` |  |  |  |  |  |  |
| `POST /api/ai/chat/stream` |  |  |  |  |  |  |
| `POST /api/ai/embeddings` |  |  |  |  |  |  |
| `POST /api/ai/test` |  |  |  |  |  |  |
| `POST /api/ai/analyze-product` |  |  |  |  |  |  |
| `POST /api/ai/quote-assistant` |  |  |  |  |  |  |
| `DELETE /api/ai/usage` |  |  |  |  |  |  |

### tts.js (3 routes, 206 lines)

Mounted at /api/ai/tts. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/ai/tts/voices` | yes |  |  |  |  |  |
| `GET /api/ai/tts/test` | yes |  |  |  |  |  |
| `POST /api/ai/tts/speak` |  |  |  |  |  |  |

### aiAssistant.js (2 routes, 427 lines)

Mounted at /api/ai/assistant. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/ai/assistant` |  |  |  |  |  |  |
| `POST /api/ai/assistant/stream` |  |  |  |  |  |  |

### inventoryV1.js (13 routes, 864 lines)

Mounted at /api/v1/inventory. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/inventory` | yes |  |  |  |  |  |
| `GET /api/v1/inventory/locations` | yes |  |  |  |  |  |
| `GET /api/v1/inventory/catalog` | yes |  |  |  |  |  |
| `GET /api/v1/inventory/summary` | yes |  |  |  |  |  |
| `GET /api/v1/inventory/transfers` | yes |  |  |  |  |  |
| `GET /api/v1/inventory/:id` |  |  |  |  |  |  |
| `POST /api/v1/inventory/adjust` |  |  |  |  |  |  |
| `POST /api/v1/inventory/rfid-scan` |  |  |  |  |  |  |
| `GET /api/v1/inventory/rfid/:rfidTagId` | yes |  |  |  |  |  |
| `GET /api/v1/inventory/etched/:etchedId` | yes |  |  |  |  |  |
| `POST /api/v1/inventory/transfers` |  |  |  |  |  |  |
| `POST /api/v1/inventory/transfers/:id/status` |  |  |  |  |  |  |
| `POST /api/v1/inventory/ai-assistant` |  |  |  |  |  |  |

### bomV1.js (9 routes, 671 lines)

Mounted at /api/v1/bom. Tables: BomRecipe.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/bom/recipes` | yes |  |  | yes |  |  |
| `GET /api/v1/bom/recipes/:id` |  |  |  |  |  |  |
| `POST /api/v1/bom/recipes` |  | 1 |  |  |  |  |
| `PUT /api/v1/bom/recipes/:id` |  | 1 |  |  |  |  |
| `POST /api/v1/bom/recipes/:id/activate` |  | 1 |  |  |  |  |
| `POST /api/v1/bom/recipes/:id/transition` |  | 1 |  |  |  |  |
| `POST /api/v1/bom/recipes/:id/clone` |  | 1 |  | yes |  |  |
| `POST /api/v1/bom/recipes/match` |  |  |  | yes |  |  |
| `POST /api/v1/bom/ai-suggest` |  |  |  |  |  |  |

### optimizationV1.js (4 routes, 441 lines)

Mounted at /api/v1/ai/work-order-optimize. Tables: Job, WorkCenter.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/v1/ai/work-order-optimize/preview` |  |  |  |  |  |  |
| `POST /api/v1/ai/work-order-optimize/apply` |  | 1 | yes | yes |  |  |
| `GET /api/v1/ai/work-order-optimize/analysis` | yes |  |  |  |  |  |
| `POST /api/v1/ai/work-order-optimize/simulate` |  |  |  |  |  |  |

### analyticsV1.js (5 routes, 339 lines)

Mounted at /api/v1/analytics. Tables: Job, RFQ, Quote, Order, Organization, WorkCenter.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/analytics/ops-forecast` | yes |  |  | yes |  |  |
| `GET /api/v1/analytics/rfq-funnel` | yes |  |  | yes |  |  |
| `GET /api/v1/analytics/margin` | yes |  |  |  |  |  |
| `GET /api/v1/analytics/work-centers/utilization` | yes |  |  | yes |  |  |
| `GET /api/v1/analytics/inventory/risk` | yes |  |  |  |  |  |

### shippingV1.js (4 routes, 117 lines)

Mounted at /api/v1/shipping, /api/v1/shipments. Tables: Shipment.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/shipping/summary` | yes |  |  |  |  |  |
| `GET /api/v1/shipping` | yes |  |  |  |  |  |
| `GET /api/v1/shipments/summary` | yes |  |  |  |  |  |
| `GET /api/v1/shipments` | yes |  |  |  |  |  |

### eventsV1.js (4 routes, 139 lines)

Mounted at /api/v1/events. Tables: ExceptionEvent.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/events/exceptions` | yes |  |  |  |  |  |
| `POST /api/v1/events/exceptions` |  | 1 |  |  |  |  |
| `POST /api/v1/events/exceptions/:id/acknowledge` |  | 1 |  |  |  |  |
| `GET /api/v1/events/exceptions/stats` | yes |  |  | yes |  |  |

### dispatchRoutes.js (17 routes, 1034 lines)

Mounted at /api/v1/dispatch. Tables: WorkCenterType, WorkCenter, DispatchDivision, Location, DispatchOperation, Organization, Operator, DispatchJob.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/dispatch/work-center-types` | yes |  |  | yes |  |  |
| `GET /api/v1/dispatch/work-center-types/:id` |  |  |  |  |  |  |
| `POST /api/v1/dispatch/work-center-types` |  | 1 |  |  |  |  |
| `PATCH /api/v1/dispatch/work-center-types/:id` |  | 1 |  |  |  |  |
| `DELETE /api/v1/dispatch/work-center-types/:id` |  | 2 |  | yes |  |  |
| `GET /api/v1/dispatch/divisions` | yes |  |  |  |  |  |
| `POST /api/v1/dispatch/divisions` |  | 1 |  |  |  |  |
| `POST /api/v1/dispatch/work-centers` |  | 1 |  | yes |  |  |
| `PATCH /api/v1/dispatch/work-centers/:id` |  | 1 |  |  |  |  |
| `DELETE /api/v1/dispatch/work-centers/:id` |  | 1 |  |  |  |  |
| `GET /api/v1/dispatch/locations` | yes |  |  | yes |  |  |
| `POST /api/v1/dispatch/locations` |  | 1 |  |  |  |  |
| `GET /api/v1/dispatch/work-centers` | yes |  |  | yes |  |  |
| `GET /api/v1/dispatch/operators` | yes |  |  | yes |  |  |
| `POST /api/v1/dispatch/run` |  | 1 |  | yes |  |  |
| `GET /api/v1/dispatch/queue` | yes |  |  | yes |  |  |
| `GET /api/v1/dispatch/stats` | yes |  |  | yes |  |  |

### operationsRoutes.js (7 routes, 566 lines)

Mounted at /api/v1/operations. Tables: DispatchOperation, Operator, WorkCenter, Job, DispatchTimeLog.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/operations` | yes |  |  | yes |  |  |
| `GET /api/v1/operations/:id` |  |  |  |  |  |  |
| `POST /api/v1/operations/:id/start` | yes | 3 | yes | yes |  |  |
| `POST /api/v1/operations/:id/pause` | yes | 1 |  | yes |  |  |
| `POST /api/v1/operations/:id/complete` | yes | 2 | yes | yes | yes |  |
| `GET /api/v1/operations/:id/time-logs` |  |  |  | yes |  |  |
| `POST /api/v1/operations/:id/reassign` | yes | 2 | yes |  |  |  |

### orderHubRoutes.js (18 routes, 211 lines)

Mounted at /api/v1. Tables: IntakeJob.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/v1/contacts` |  |  |  |  |  |  |
| `GET /api/v1/contacts` | yes |  |  |  |  |  |
| `GET /api/v1/contacts/:id` |  |  |  |  |  |  |
| `POST /api/v1/rfq` |  |  |  |  |  |  |
| `GET /api/v1/rfq` | yes |  |  |  |  |  |
| `GET /api/v1/rfq/:id` |  |  |  |  |  |  |
| `PATCH /api/v1/rfq/:id/status` |  |  |  |  |  |  |
| `POST /api/v1/quotes` |  |  |  |  |  |  |
| `GET /api/v1/quotes` | yes |  |  |  |  |  |
| `GET /api/v1/quotes/:id` |  |  |  |  |  |  |
| `POST /api/v1/quotes/:id/accept` |  |  |  |  |  |  |
| `POST /api/v1/orders` |  |  |  |  |  |  |
| `GET /api/v1/orders` | yes |  |  |  |  |  |
| `GET /api/v1/orders/:id` |  |  |  |  |  |  |
| `POST /api/v1/orders/:id/plan` |  |  |  |  |  |  |
| `POST /api/v1/orders/:id/mark-packaging` |  | 1 |  |  |  |  |
| `GET /api/v1/jobs` | yes |  |  |  |  |  |
| `POST /api/v1/jobs/:id/complete` |  |  |  |  |  |  |

### aiOrderHubRoutes.js (2 routes, 652 lines)

Mounted at /api/v1/ai. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/v1/ai/parse-email-rfq` |  |  |  |  |  |  |
| `POST /api/v1/ai/quote-assistant` |  |  |  |  |  |  |

### ingestRoutes.js (1 routes, 462 lines)

Mounted at /api/v1/ingest. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/v1/ingest/email-rfq` |  |  |  |  |  |  |

### pipelineRoutes.js (10 routes, 417 lines)

Mounted at /api/v1/pipeline. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/pipeline/stages` | yes |  |  |  |  |  |
| `POST /api/v1/pipeline/simulate` |  |  |  |  |  |  |
| `POST /api/v1/pipeline` |  |  |  |  |  |  |
| `GET /api/v1/pipeline/:id` |  |  |  |  |  |  |
| `POST /api/v1/pipeline/:id/advance` |  |  |  |  |  |  |
| `POST /api/v1/pipeline/:id/auto-advance` |  |  |  |  |  |  |
| `GET /api/v1/pipeline` | yes |  |  |  |  |  |
| `POST /api/v1/pipeline/:id/approve` |  |  |  |  |  |  |
| `GET /api/v1/pipeline/:id/analysis` |  |  |  |  |  |  |
| `POST /api/v1/pipeline/:id/pricing-recommendation` |  |  |  |  |  |  |

### stopWork.js (13 routes, 985 lines)

Mounted at /api/safety/stop-work. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/safety/stop-work` | yes |  |  |  |  |  |
| `GET /api/safety/stop-work/active` | yes |  |  |  |  |  |
| `GET /api/safety/stop-work/blocked-resources` | yes |  |  |  |  |  |
| `GET /api/safety/stop-work/:id` |  |  |  |  |  |  |
| `POST /api/safety/stop-work` |  |  |  |  |  |  |
| `PATCH /api/safety/stop-work/:id/status` |  |  |  |  |  |  |
| `POST /api/safety/stop-work/:id/steps/:stepId/complete` |  |  |  |  |  |  |
| `POST /api/safety/stop-work/:id/evidence` |  |  |  |  |  |  |
| `POST /api/safety/stop-work/:id/clearance` |  |  |  |  |  |  |
| `GET /api/safety/stop-work/:id/audit` |  |  |  |  |  |  |
| `POST /api/safety/stop-work/validate-assignment` |  |  |  |  |  |  |
| `POST /api/safety/stop-work/check-override` |  |  |  |  |  |  |
| `GET /api/safety/stop-work/stats/summary` | yes |  |  |  |  |  |

### salesRoutes.js (6 routes, 295 lines)

Mounted at /api/sales. Tables: RFQ, Quote, User.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/sales/pricing/recommend` |  |  |  |  |  |  |
| `GET /api/sales/pricing/customer/:customerId/tier` | yes |  |  |  |  |  |
| `POST /api/sales/pricing/override` |  |  |  |  |  |  |
| `GET /api/sales/pricing/substitutions` | yes |  |  |  |  |  |
| `GET /api/sales/dashboard/stats` | yes |  |  |  |  |  |
| `GET /api/sales/dashboard/leaderboard` | yes |  |  | yes |  |  |

### executive.js (21 routes, 527 lines)

Mounted at /api/executive. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/executive/cockpit` | yes |  |  |  |  |  |
| `GET /api/executive/cockpit/tile/:tileId` |  |  |  |  |  |  |
| `GET /api/executive/simulation/scenarios` | yes |  |  |  |  |  |
| `POST /api/executive/simulation/scenarios` |  |  |  |  |  |  |
| `POST /api/executive/simulation/run` |  |  |  |  |  |  |
| `GET /api/executive/simulation/baseline` | yes |  |  |  |  |  |
| `POST /api/executive/simulation/compare` |  |  |  |  |  |  |
| `GET /api/executive/forecast` | yes |  |  |  |  |  |
| `GET /api/executive/forecast/assumptions` | yes |  |  |  |  |  |
| `GET /api/executive/forecast/:category` |  |  |  |  |  |  |
| `POST /api/executive/forecast/sensitivity` |  |  |  |  |  |  |
| `POST /api/executive/forecast/snapshot` |  |  |  |  |  |  |
| `GET /api/executive/decisions` | yes |  |  |  |  |  |
| `GET /api/executive/decisions/stats` | yes |  |  |  |  |  |
| `GET /api/executive/decisions/report` | yes |  |  |  |  |  |
| `GET /api/executive/decisions/:id` |  |  |  |  |  |  |
| `POST /api/executive/decisions` |  |  |  |  |  |  |
| `PUT /api/executive/decisions/:id/status` |  |  |  |  |  |  |
| `POST /api/executive/decisions/:id/outcome` |  |  |  |  |  |  |
| `POST /api/executive/decisions/compare` |  |  |  |  |  |  |
| `POST /api/executive/ai/query` |  |  |  |  |  |  |

### onlineSettings.js (6 routes, 87 lines)

Mounted at /api/admin/online-settings. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/admin/online-settings/rules` | yes |  |  |  |  |  |
| `PUT /api/admin/online-settings/rules` |  |  |  |  |  |  |
| `GET /api/admin/online-settings/cutoffs` | yes |  |  |  |  |  |
| `PUT /api/admin/online-settings/cutoffs` |  |  |  |  |  |  |
| `GET /api/admin/online-settings/processes` | yes |  |  |  |  |  |
| `PUT /api/admin/online-settings/processes` |  |  |  |  |  |  |

### admin.js (2 routes, 36 lines)

Mounted at /api/admin. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/admin/seed-demo` | yes |  |  |  |  | requireRole('SUPER_ADMIN','TENANT_OWNER') |
| `POST /api/admin/seed-demo` |  |  |  |  |  | requireRole('SUPER_ADMIN','TENANT_OWNER') |

### dropTagRoutes.js (31 routes, 716 lines)

Mounted at /api/drop-tags. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/drop-tags` |  |  |  |  |  |  |
| `GET /api/drop-tags` | yes |  |  |  |  |  |
| `GET /api/drop-tags/ready-to-print` | yes |  |  |  |  |  |
| `GET /api/drop-tags/templates` | yes |  |  |  |  |  |
| `GET /api/drop-tags/templates/:id` |  |  |  |  |  |  |
| `POST /api/drop-tags/templates` |  |  |  |  |  |  |
| `PUT /api/drop-tags/templates/:id` |  |  |  |  |  |  |
| `POST /api/drop-tags/templates/:id/preview` |  |  |  |  |  |  |
| `POST /api/drop-tags/templates/seed` |  |  |  |  |  |  |
| `GET /api/drop-tags/:id` |  |  |  |  |  |  |
| `POST /api/drop-tags/validate` |  |  |  |  |  |  |
| `POST /api/drop-tags/:id/validate` |  |  |  |  |  |  |
| `POST /api/drop-tags/:id/print` |  |  |  |  |  |  |
| `POST /api/drop-tags/:id/reprint` |  |  |  |  |  |  |
| `POST /api/drop-tags/:id/apply` |  |  |  |  |  |  |
| `POST /api/drop-tags/:id/void` |  |  |  |  |  |  |
| `POST /api/drop-tags/packages` |  |  |  |  |  |  |
| `GET /api/drop-tags/packages/ready` | yes |  |  |  |  |  |
| `POST /api/drop-tags/packages/:id/items` |  |  |  |  |  |  |
| `POST /api/drop-tags/packages/:id/seal` |  |  |  |  |  |  |
| `POST /api/drop-tags/packages/:id/qc-release` |  |  |  |  |  |  |
| `POST /api/drop-tags/listings` |  |  |  |  |  |  |
| `GET /api/drop-tags/listings` |  |  |  |  |  |  |
| `GET /api/drop-tags/listings/:id` |  |  |  |  |  |  |
| `POST /api/drop-tags/listings/:id/tags` |  |  |  |  |  |  |
| `DELETE /api/drop-tags/listings/:id/tags` |  |  |  |  |  |  |
| `POST /api/drop-tags/listings/:id/print` |  |  |  |  |  |  |
| `POST /api/drop-tags/listings/:id/lock` |  |  |  |  |  |  |
| `POST /api/drop-tags/listings/:id/deliver` |  |  |  |  |  |  |
| `POST /api/drop-tags/listings/:id/close` |  |  |  |  |  |  |
| `POST /api/drop-tags/scans` |  |  |  |  |  |  |

### staff.js (15 routes, 720 lines)

Mounted at /api/staff. Tables: Operator, Location, WorkCenter, OperatorSkill, WorkCenterType, Shift.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/staff/operators` | yes |  |  | yes |  |  |
| `GET /api/staff/operators/:id` |  |  |  |  |  |  |
| `POST /api/staff/operators` |  | 1 | yes |  |  |  |
| `PATCH /api/staff/operators/:id` |  | 1 |  |  |  |  |
| `DELETE /api/staff/operators/:id` |  | 1 |  |  |  |  |
| `GET /api/staff/operators/:id/skills` | yes |  |  | yes |  |  |
| `POST /api/staff/operators/:id/skills` |  | 1 |  |  |  |  |
| `PATCH /api/staff/operators/:operatorId/skills/:skillId` |  | 1 |  |  |  |  |
| `DELETE /api/staff/operators/:operatorId/skills/:skillId` |  | 1 |  |  |  |  |
| `GET /api/staff/shifts` | yes |  |  | yes |  |  |
| `POST /api/staff/shifts` |  | 1 |  |  |  |  |
| `PATCH /api/staff/shifts/:id` |  | 1 |  |  |  |  |
| `DELETE /api/staff/shifts/:id` |  | 1 |  |  |  |  |
| `GET /api/staff/stats` | yes |  |  |  |  |  |
| `GET /api/staff/available` |  |  |  | yes |  |  |

### qcRoutes.js (11 routes, 530 lines)

Mounted at /api/qc. Tables: Job, JobInspection, Operator.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/qc/queue` | yes |  |  |  |  |  |
| `GET /api/qc/stats` | yes |  |  |  |  |  |
| `GET /api/qc/inspections` | yes |  |  |  |  |  |
| `GET /api/qc/inspections/:id` |  |  |  |  |  |  |
| `POST /api/qc/inspections` | yes | 1 | yes |  |  |  |
| `PATCH /api/qc/inspections/:id` |  | 1 |  |  |  |  |
| `POST /api/qc/inspections/:id/pass` |  | 1 |  |  | yes |  |
| `POST /api/qc/inspections/:id/fail` |  | 1 |  |  | yes |  |
| `POST /api/qc/inspections/:id/rework` | yes | 1 |  |  | yes |  |
| `POST /api/qc/inspections/:id/conditional` |  | 1 |  |  | yes |  |
| `GET /api/qc/inspectors` | yes |  |  | yes |  |  |

### materialTrackingRoutes.js (9 routes, 514 lines)

Mounted at /api/material-tracking. Tables: Job, Package, DropTag, TraceEvent, JobInspection.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/material-tracking/stats` | yes |  |  |  |  |  |
| `GET /api/material-tracking/custody-log` | yes |  |  | yes |  |  |
| `POST /api/material-tracking/custody-log` |  | 1 |  |  |  |  |
| `GET /api/material-tracking/jobs/:jobId/tags` | yes |  |  | yes |  |  |
| `GET /api/material-tracking/jobs/:jobId/packages` | yes |  |  | yes |  |  |
| `GET /api/material-tracking/jobs/:jobId/timeline` |  |  |  | yes |  |  |
| `GET /api/material-tracking/staging` | yes |  |  |  |  |  |
| `PATCH /api/material-tracking/staging/:jobId/ship` |  | 2 | yes |  | yes |  |
| `POST /api/material-tracking/log-status-change` |  | 1 |  |  |  |  |

### maintenanceOrders.js (9 routes, 248 lines)

Mounted at /api/maintenance-orders. Tables: MaintenanceOrder, Asset.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/maintenance-orders` | yes |  |  |  |  |  |
| `GET /api/maintenance-orders/stats` | yes |  |  |  |  |  |
| `GET /api/maintenance-orders/assets/list` | yes |  |  | yes |  |  |
| `GET /api/maintenance-orders/:id` |  |  |  |  |  |  |
| `POST /api/maintenance-orders` | yes | 1 | yes |  |  |  |
| `PATCH /api/maintenance-orders/:id` | yes | 1 |  |  |  |  |
| `PUT /api/maintenance-orders/:id/start` |  | 1 |  |  |  |  |
| `PUT /api/maintenance-orders/:id/complete` |  | 1 |  |  |  |  |
| `DELETE /api/maintenance-orders/:id` |  | 1 |  |  |  |  |

### assets.js (8 routes, 255 lines)

Mounted at /api/assets. Tables: Asset, AssetType, WorkCenter.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/assets` | yes |  |  |  |  |  |
| `GET /api/assets/stats` | yes |  |  |  |  |  |
| `GET /api/assets/types` | yes |  |  | yes |  |  |
| `POST /api/assets/seed-from-work-centers` | yes | 2 |  | yes |  |  |
| `GET /api/assets/:id` |  |  |  |  |  |  |
| `POST /api/assets` |  | 1 |  |  |  |  |
| `PATCH /api/assets/:id` | yes | 1 |  |  |  |  |
| `DELETE /api/assets/:id` |  | 1 |  |  |  |  |

### specInheritance.js (3 routes, 163 lines)

Mounted at /api/specs. Tables: OrderLine, Job, CustomerPreference.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/specs/resolve/order-line/:id` |  |  |  |  |  |  |
| `GET /api/specs/resolve/job/:id` |  |  |  |  |  |  |
| `GET /api/specs/customer/:customerId` | yes |  |  |  |  |  |

### opsCockpit.js (5 routes, 868 lines)

Mounted at /api/ops-cockpit. Tables: Job, WorkCenter, Order, Coil, Shipment, DispatchOperation, QCHold, MaterialMovement, Grade, AuditLog.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/ops-cockpit` | yes |  |  | yes |  |  |
| `POST /api/ops-cockpit/recommendations/accept` |  | 3 |  | yes | yes |  |
| `POST /api/ops-cockpit/recommendations/dismiss` |  | 1 |  |  | yes |  |
| `POST /api/ops-cockpit/recommendations/explain` |  | 1 |  |  | yes |  |
| `GET /api/ops-cockpit/recommendations/history` | yes |  |  |  |  |  |

### printQueue.js (8 routes, 182 lines)

Mounted at /api/print-queue. Tables: Job, Shipment.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/print-queue` | yes |  |  |  |  |  |
| `GET /api/print-queue/history` | yes |  |  |  |  |  |
| `GET /api/print-queue/:id/render` |  |  |  |  |  |  |
| `POST /api/print-queue/:id/printed` |  |  |  |  |  |  |
| `POST /api/print-queue/:id/skip` |  |  |  |  |  |  |
| `POST /api/print-queue/trigger` |  |  |  |  |  |  |
| `POST /api/print-queue/:id/reprint` |  |  |  |  |  |  |
| `POST /api/print-queue/trigger-shipment` |  |  |  |  |  |  |

### partner/partnerAuthRoutes.js (1 routes, 49 lines)

Mounted at /api/v1/partner/auth. Tables: through a service or none.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/v1/partner/auth/token` |  |  |  |  |  |  |

### partner/customerRoutes.js (14 routes, 718 lines)

Mounted at /api/v1/partner/customer. Tables: RFQ, Quote, Order, Job, Document, Shipment, Invoice.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `POST /api/v1/partner/customer/rfqs` |  | 1 |  |  |  |  |
| `GET /api/v1/partner/customer/rfqs` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/rfqs/:id` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/quotes` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/quotes/:id` |  |  |  |  |  |  |
| `POST /api/v1/partner/customer/quotes/:id/respond` |  | 1 |  |  |  |  |
| `GET /api/v1/partner/customer/orders` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/orders/:id` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/orders/:id/milestones` |  |  |  | yes |  |  |
| `GET /api/v1/partner/customer/documents` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/documents/:id/download` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/shipments` |  |  |  | yes |  |  |
| `GET /api/v1/partner/customer/shipments/:id` |  |  |  |  |  |  |
| `GET /api/v1/partner/customer/invoices` |  |  |  | yes |  |  |

### partner/supplierRoutes.js (9 routes, 389 lines)

Mounted at /api/v1/partner/supplier. Tables: Order, Shipment, Document.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/partner/supplier/purchase-orders` |  |  |  |  |  |  |
| `GET /api/v1/partner/supplier/purchase-orders/:id` |  |  |  |  |  |  |
| `POST /api/v1/partner/supplier/purchase-orders/:id/acknowledge` |  | 1 |  |  |  |  |
| `POST /api/v1/partner/supplier/asn` |  | 1 |  |  |  |  |
| `GET /api/v1/partner/supplier/asn` |  |  |  | yes |  |  |
| `POST /api/v1/partner/supplier/documents` |  | 1 |  |  |  |  |
| `GET /api/v1/partner/supplier/scars` |  |  |  |  |  |  |
| `POST /api/v1/partner/supplier/scars/:id/respond` |  |  |  |  |  |  |
| `GET /api/v1/partner/supplier/scorecard` |  |  |  | yes |  |  |

### partner/carrierRoutes.js (7 routes, 510 lines)

Mounted at /api/v1/partner/carrier. Tables: Organization, Shipment, Order, Partner, Document.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/partner/carrier/shipments` |  |  |  |  |  |  |
| `GET /api/v1/partner/carrier/shipments/:id` |  |  |  |  |  |  |
| `POST /api/v1/partner/carrier/shipments/:id/respond` |  | 1 |  |  |  |  |
| `POST /api/v1/partner/carrier/shipments/:id/status` |  | 1 |  |  |  |  |
| `POST /api/v1/partner/carrier/shipments/:id/pod` |  | 2 |  |  |  |  |
| `POST /api/v1/partner/carrier/exceptions` |  | 1 |  |  |  |  |
| `GET /api/v1/partner/carrier/performance` |  |  |  | yes |  |  |

### partner/webhookRoutes.js (6 routes, 309 lines)

Mounted at /api/v1/partner/webhooks. Tables: PartnerWebhook, WebhookDelivery.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/partner/webhooks` |  |  |  | yes |  |  |
| `POST /api/v1/partner/webhooks` |  | 1 |  |  |  |  |
| `PUT /api/v1/partner/webhooks/:id` |  | 1 |  |  |  |  |
| `DELETE /api/v1/partner/webhooks/:id` |  | 1 |  |  |  |  |
| `GET /api/v1/partner/webhooks/:id/deliveries` |  |  |  |  |  |  |
| `POST /api/v1/partner/webhooks/:id/test` |  |  |  |  |  |  |

### partner/adminRoutes.js (9 routes, 433 lines)

Mounted at /api/v1/admin/partners. Tables: Partner, Organization, PartnerApiKey, PartnerApiLog.

| Route | Tested OK | Writes | Tx | No limit | Record | Own guard |
|---|:-:|---:|:-:|:-:|:-:|---|
| `GET /api/v1/admin/partners` | yes |  |  |  |  |  |
| `POST /api/v1/admin/partners` |  | 1 |  |  |  |  |
| `GET /api/v1/admin/partners/:id` |  |  |  |  |  |  |
| `PUT /api/v1/admin/partners/:id` |  | 1 |  |  |  |  |
| `POST /api/v1/admin/partners/:id/keys` |  | 1 |  |  |  |  |
| `DELETE /api/v1/admin/partners/:id/keys/:keyId` |  | 1 |  |  |  |  |
| `GET /api/v1/admin/partners/:id/usage` |  |  |  | yes |  |  |
| `GET /api/v1/admin/partners/:id/logs` | yes |  |  |  |  |  |
| `GET /api/v1/admin/partners/dashboard/summary` | yes |  |  |  |  |  |

