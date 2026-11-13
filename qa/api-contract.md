# Screen-to-server API contract

Generated 2026-11-13 by `qa/tools/api-contract.mjs` (static analysis of literal API paths in the frontend).

- Distinct API calls found in the screens: **282**
- Matched to a server route: **202**
- No matching server route (the call would get a 404): **80**

Calls built from variables (a base URL constant plus a suffix) are not seen by this scan, so the real number of calls is higher.

## Calls with no server route, by area

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

### /api/units (8)

| Call | Used in |
|---|---|
| `GET /api/units/:x/certifications` | api/qaqc.js |
| `POST /api/units/:x/certifications` | api/qaqc.js |
| `GET /api/units/:x/certifications/:x` | api/qaqc.js |
| `DELETE /api/units/:x/certifications/:x` | api/qaqc.js |
| `GET /api/units/:x/tests` | api/qaqc.js |
| `POST /api/units/:x/tests` | api/qaqc.js |
| `GET /api/units/:x/tests/:x` | api/qaqc.js |
| `PUT /api/units/:x/tests/:x` | api/qaqc.js |

### /api/shipments (5)

| Call | Used in |
|---|---|
| `GET /api/shipments/:x/loading-plan` | api/logistics.js |
| `POST /api/shipments/:x/optimize-route` | api/logistics.js |
| `POST /api/shipments/:x/plan-loading` | api/logistics.js |
| `GET /api/shipments/:x/tracking` | api/logistics.js |
| `PUT /api/shipments/splits/:x/status` | services/splitShipmentApi.js |

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

### /api/work-centers (2)

| Call | Used in |
|---|---|
| `PUT /api/work-centers/:x` | api/workCenters.js |
| `DELETE /api/work-centers/:x` | api/workCenters.js |

### /api/auth (1)

| Call | Used in |
|---|---|
| `PUT /api/auth/profile` | hooks/useAuth.jsx |

### /api/boms (1)

| Call | Used in |
|---|---|
| `GET /api/boms` | apps/boms/BOMsPage.jsx |

### /api/returns (1)

| Call | Used in |
|---|---|
| `POST /api/returns/:x/:x` | pages/Orders/ReturnsPage.jsx |

### /api/work-orders (1)

| Call | Used in |
|---|---|
| `PUT /api/work-orders/:x/:x` | pages/WorkOrders/WorkOrderDetailPage.jsx |
