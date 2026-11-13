# Screen-to-server API contract

Generated 2026-11-13 by `qa/tools/api-contract.mjs` (static analysis of literal API paths in the frontend).

- Distinct API calls found in the screens: **352**
- Matched to a server route: **197**
- No matching server route (the call would get a 404): **155**

Calls built from variables (a base URL constant plus a suffix) are not seen by this scan, so the real number of calls is higher.

## Calls with no server route, by area

### /api/work-centers (21)

| Call | Used in |
|---|---|
| `PUT /api/work-centers/:x` | api/workCenters.js |
| `DELETE /api/work-centers/:x` | api/workCenters.js |
| `GET /api/work-centers/:x/capabilities` | api/workCenters.js |
| `PUT /api/work-centers/:x/capabilities` | api/workCenters.js |
| `GET /api/work-centers/:x/capacity` | api/workCenters.js |
| `GET /api/work-centers/:x/current-job` | api/workCenters.js |
| `GET /api/work-centers/:x/downtime` | api/workCenters.js |
| `POST /api/work-centers/:x/downtime` | api/workCenters.js |
| `POST /api/work-centers/:x/downtime/:x/end` | api/workCenters.js |
| `GET /api/work-centers/:x/jobs` | api/jobs.js |
| `GET /api/work-centers/:x/maintenance` | api/workCenters.js |
| `POST /api/work-centers/:x/maintenance` | api/workCenters.js |
| `POST /api/work-centers/:x/maintenance/:x/complete` | api/workCenters.js |
| `GET /api/work-centers/:x/metrics` | api/workCenters.js |
| `GET /api/work-centers/:x/operators` | api/workCenters.js |
| `POST /api/work-centers/:x/operators` | api/workCenters.js |
| `DELETE /api/work-centers/:x/operators/:x` | api/workCenters.js |
| `GET /api/work-centers/:x/queue` | api/workCenters.js |
| `PUT /api/work-centers/:x/queue` | api/workCenters.js |
| `PATCH /api/work-centers/:x/status` | api/workCenters.js |
| `GET /api/work-centers/:x/utilization` | api/workCenters.js |

### /api/jobs (17)

| Call | Used in |
|---|---|
| `DELETE /api/jobs/:x` | api/jobs.js |
| `POST /api/jobs/:x/cancel` | api/jobs.js |
| `GET /api/jobs/:x/documents` | api/jobs.js |
| `POST /api/jobs/:x/documents` | api/jobs.js |
| `POST /api/jobs/:x/measurements` | api/jobs.js |
| `GET /api/jobs/:x/notes` | api/jobs.js |
| `POST /api/jobs/:x/notes` | api/jobs.js |
| `POST /api/jobs/:x/pause` | api/jobs.js |
| `PATCH /api/jobs/:x/priority` | api/jobs.js |
| `POST /api/jobs/:x/resume` | api/jobs.js |
| `POST /api/jobs/:x/schedule` | api/jobs.js |
| `PUT /api/jobs/:x/schedule` | api/jobs.js |
| `POST /api/jobs/:x/scrap` | api/jobs.js |
| `POST /api/jobs/:x/split` | api/jobs.js |
| `GET /api/jobs/:x/timeline` | api/jobs.js |
| `POST /api/jobs/:x/unassign` | api/jobs.js |
| `POST /api/jobs/merge` | api/jobs.js |

### /api/qaqc (15)

| Call | Used in |
|---|---|
| `GET /api/qaqc/holds` | api/qaqc.js |
| `POST /api/qaqc/holds` | api/qaqc.js |
| `PUT /api/qaqc/holds/:x/release` | api/qaqc.js |
| `GET /api/qaqc/inspections` | api/qaqc.js |
| `POST /api/qaqc/inspections` | api/qaqc.js |
| `GET /api/qaqc/inspections/:x` | api/qaqc.js |
| `GET /api/qaqc/ncrs` | api/qaqc.js |
| `POST /api/qaqc/ncrs` | api/qaqc.js |
| `GET /api/qaqc/ncrs/:x` | api/qaqc.js |
| `PUT /api/qaqc/ncrs/:x` | api/qaqc.js |
| `PUT /api/qaqc/ncrs/:x/close` | api/qaqc.js |
| `GET /api/qaqc/standards` | api/qaqc.js |
| `POST /api/qaqc/standards` | api/qaqc.js |
| `GET /api/qaqc/test-types` | api/qaqc.js |
| `POST /api/qaqc/test-types` | api/qaqc.js |

### /api/pricing (12)

| Call | Used in |
|---|---|
| `GET /api/pricing` | api/pricing.js |
| `GET /api/pricing/market` | api/pricing.js |
| `GET /api/pricing/prices` | api/pricing.js |
| `POST /api/pricing/prices` | api/pricing.js |
| `GET /api/pricing/prices/:x` | api/pricing.js |
| `PUT /api/pricing/prices/:x` | api/pricing.js |
| `GET /api/pricing/quotes` | api/pricing.js |
| `POST /api/pricing/quotes` | api/pricing.js |
| `GET /api/pricing/quotes/:x` | api/pricing.js |
| `PUT /api/pricing/quotes/:x` | api/pricing.js |
| `GET /api/pricing/surcharges` | api/pricing.js |
| `PUT /api/pricing/surcharges/:x` | api/pricing.js |

### /api/boms (11)

| Call | Used in |
|---|---|
| `GET /api/boms` | api/boms.js, apps/boms/BOMsPage.jsx |
| `POST /api/boms` | api/boms.js |
| `GET /api/boms/:x` | api/boms.js |
| `PUT /api/boms/:x` | api/boms.js |
| `DELETE /api/boms/:x` | api/boms.js |
| `GET /api/boms/:x/items` | api/boms.js |
| `POST /api/boms/:x/items` | api/boms.js |
| `PUT /api/boms/:x/items/:x` | api/boms.js |
| `DELETE /api/boms/:x/items/:x` | api/boms.js |
| `GET /api/boms/:x/versions` | api/boms.js |
| `POST /api/boms/:x/versions` | api/boms.js |

### /api/provenance (11)

| Call | Used in |
|---|---|
| `POST /api/provenance/anchor` | api/provenance.js |
| `GET /api/provenance/blockchain` | api/provenance.js |
| `POST /api/provenance/certificate/:x` | api/provenance.js |
| `GET /api/provenance/certificates` | api/provenance.js |
| `GET /api/provenance/certificates/:x/verify` | api/provenance.js |
| `GET /api/provenance/certifications/:x` | api/provenance.js |
| `GET /api/provenance/chain/:x` | api/provenance.js |
| `GET /api/provenance/events/:x` | api/provenance.js |
| `GET /api/provenance/lookup/:x` | api/provenance.js |
| `GET /api/provenance/units/:x` | api/provenance.js |
| `GET /api/provenance/verify/:x` | api/provenance.js |

### /api/units (10)

| Call | Used in |
|---|---|
| `GET /api/units/:x` | api/units.js |
| `GET /api/units/:x/certifications` | api/qaqc.js |
| `POST /api/units/:x/certifications` | api/qaqc.js |
| `GET /api/units/:x/certifications/:x` | api/qaqc.js |
| `DELETE /api/units/:x/certifications/:x` | api/qaqc.js |
| `GET /api/units/:x/tests` | api/qaqc.js |
| `POST /api/units/:x/tests` | api/qaqc.js |
| `GET /api/units/:x/tests/:x` | api/qaqc.js |
| `PUT /api/units/:x/tests/:x` | api/qaqc.js |
| `GET /api/units/tag/:x` | api/units.js |

### /api/fabrication-work-orders (9)

| Call | Used in |
|---|---|
| `GET /api/fabrication-work-orders` | api/fabrication.js |
| `POST /api/fabrication-work-orders` | api/fabrication.js |
| `GET /api/fabrication-work-orders/:x` | api/fabrication.js |
| `PUT /api/fabrication-work-orders/:x` | api/fabrication.js |
| `DELETE /api/fabrication-work-orders/:x` | api/fabrication.js |
| `GET /api/fabrication-work-orders/:x/materials` | api/fabrication.js |
| `GET /api/fabrication-work-orders/:x/outputs` | api/fabrication.js |
| `POST /api/fabrication-work-orders/:x/outputs` | api/fabrication.js |
| `PATCH /api/fabrication-work-orders/:x/status` | api/fabrication.js |

### /api/work-orders (9)

| Call | Used in |
|---|---|
| `PUT /api/work-orders/:x` | api/workOrders.js |
| `PUT /api/work-orders/:x/cancel` | api/workOrders.js |
| `GET /api/work-orders/:x/outputs` | api/workOrders.js |
| `POST /api/work-orders/:x/outputs` | api/workOrders.js |
| `PATCH /api/work-orders/:x/status` | api/workOrders.js |
| `GET /api/work-orders/:x/steps` | api/workOrders.js |
| `POST /api/work-orders/:x/steps` | api/workOrders.js |
| `PUT /api/work-orders/:x/steps/:x` | api/workOrders.js |
| `PATCH /api/work-orders/:x/steps/:x/status` | api/workOrders.js |

### /api/inventory (6)

| Call | Used in |
|---|---|
| `POST /api/inventory/adjust` | api/inventory.js |
| `GET /api/inventory/aggregate` | api/inventory.js |
| `POST /api/inventory/locations` | api/inventory.js |
| `GET /api/inventory/locations/:x` | api/inventory.js |
| `GET /api/inventory/locations/:x/stock` | api/inventory.js |
| `GET /api/inventory/movements` | api/inventory.js |

### /api/batches (5)

| Call | Used in |
|---|---|
| `GET /api/batches` | api/batches.js |
| `POST /api/batches` | api/batches.js |
| `GET /api/batches/:x` | api/batches.js |
| `PUT /api/batches/:x` | api/batches.js |
| `DELETE /api/batches/:x` | api/batches.js |

### /api/shipments (5)

| Call | Used in |
|---|---|
| `GET /api/shipments/:x/loading-plan` | api/logistics.js |
| `POST /api/shipments/:x/optimize-route` | api/logistics.js |
| `POST /api/shipments/:x/plan-loading` | api/logistics.js |
| `GET /api/shipments/:x/tracking` | api/logistics.js |
| `PUT /api/shipments/splits/:x/status` | services/splitShipmentApi.js |

### /api/coils (4)

| Call | Used in |
|---|---|
| `GET /api/coils/:x/genealogy` | api/units.js |
| `GET /api/coils/:x/history` | api/units.js |
| `POST /api/coils/:x/release` | api/units.js |
| `GET /api/coils/:x/trace` | api/units.js |

### /api/heats (4)

| Call | Used in |
|---|---|
| `PUT /api/heats/:x` | api/heats.js |
| `GET /api/heats/:x/chemistry` | api/heats.js |
| `GET /api/heats/:x/tests` | api/heats.js |
| `GET /api/heats/number/:x` | api/heats.js |

### /api/orders (4)

| Call | Used in |
|---|---|
| `GET /api/orders/:x/fulfillment` | services/splitShipmentApi.js |
| `GET /api/orders/:x/fulfillment/timeline` | services/splitShipmentApi.js |
| `POST /api/orders/:x/splits` | services/splitShipmentApi.js |
| `PATCH /api/orders/:x/status` | api/index.js |

### /api/pricing-records (4)

| Call | Used in |
|---|---|
| `GET /api/pricing-records` | api/pricing.js |
| `POST /api/pricing-records` | api/pricing.js |
| `PUT /api/pricing-records/:x` | api/pricing.js |
| `DELETE /api/pricing-records/:x` | api/pricing.js |

### /api/logistics (3)

| Call | Used in |
|---|---|
| `GET /api/logistics/carriers` | api/logistics.js |
| `GET /api/logistics/routes` | api/logistics.js |
| `POST /api/logistics/routes/calculate` | api/logistics.js |

### /api/pos (3)

| Call | Used in |
|---|---|
| `POST /api/pos/will-call/:x/complete` | components/pos/screens/WillCallLoadScreen.jsx |
| `POST /api/pos/will-call/:x/verify` | components/pos/screens/WillCallVerifyScreen.jsx |
| `GET /api/pos/will-call/queue` | components/pos/screens/WillCallQueueScreen.jsx |

### /api/auth (1)

| Call | Used in |
|---|---|
| `PUT /api/auth/profile` | hooks/useAuth.jsx |

### /api/returns (1)

| Call | Used in |
|---|---|
| `POST /api/returns/:x/:x` | pages/Orders/ReturnsPage.jsx |
