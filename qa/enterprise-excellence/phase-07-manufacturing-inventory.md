# Phase 7: manufacturing inventory (what exists)

Written from the code at the Phase 7 baseline (commit `6cbedc5`) and re-checked on the final code. "Tested" means a scenario in `qa/sim/phase7-manufacturing.mjs` (called "the scenarios" below) exercises it and reads the database afterwards. Nothing here was run against the live database.

## 1. Two production records, not one

The product has two separate production records. They are not linked to each other (finding L-024, the owner's question).

| Record | Tables | What it is for | Touches stock |
|---|---|---|---|
| Job | `Job`, `DispatchJob` (the plan), `DispatchOperation` (a step), `DispatchTimeLog` (a clock entry), `JobInspection` | Work for an order line: planned steps, operators, time, inspection, then packaging and shipping | No. A job has input, output and scrap weight columns that no address writes (only the demo seed fills them), and it consumes nothing |
| Coil work order | `WorkOrder`, `WorkOrderOutput` | Cutting a stock item: weight in, pieces out, scrap | Yes. Completion takes output and scrap off the source and creates the pieces with the source heat (Phase 3) |

## 2. Server code

| Area | File | Addresses (changing) | State after Phase 7 |
|---|---|---:|---|
| Jobs, plan, status, late list, counts | `routes/jobs.js` | 16 (10) | Every status change goes through `lib/jobGates.js`. Tested |
| Coil work orders | `routes/workOrders.js`, `lib/workOrderRules.js` | 9 (7) | Tested: move table, quality hold, substitution, material checks |
| Work-center kinds, work centers, queues, the scheduling run, shop-floor figures | `routes/dispatchRoutes.js`, `lib/dispatchPlan.js` | 17 (9) | Tested |
| Step start, pause, finish, reassign, time entries | `routes/operationsRoutes.js`, `lib/productionRules.js` | 7 (4) | Tested |
| Work centers (second address) | `routes/workCenters.js`, `lib/workCenterGuard.js` | 5 (2) | Tested |
| Inspections | `routes/qcRoutes.js` | 11 (6) | Tested |
| Routings ("BOM recipes") | `routes/bomV1.js` | 9 (7) | Tested |
| Job planner: preview, apply, what-if | `routes/optimizationV1.js`, `lib/capacityPlan.js` | 4 (3) | Tested |
| Operators, skills, certifications | `routes/staff.js` | 15 (9) | Operator rules tested; shifts not (no screen writes them) |
| Maintenance orders (lockout) | `routes/maintenanceOrders.js` | 9 (5) | State rules and lockout tested |
| Cockpit recommendations | `routes/opsCockpit.js` | 5 (3) | Expedite and rebalance tested |
| Processing recipes | `routes/processingRecipes.js` | 7 (4) | Read in the sweep only. NOT VERIFIED beyond that |

New this phase, all pure functions or single-purpose helpers with unit tests (`src/backend/test/phase7Rules.test.js`): `lib/productionRules.js`, `lib/jobGates.js`, `lib/dispatchPlan.js`, `lib/capacityPlan.js`, `lib/workCenterGuard.js`.

## 3. Screens

| Screen | Address | Reads real records |
|---|---|---|
| Order board, job detail | `/order-board`, `/jobs/:id` | Yes |
| Schedule | `/schedule` | Yes |
| Shop floor and work-center queues | `/shopfloor` | Yes |
| Time tracking | `/time-tracking` | Yes |
| Coil work orders | `/work-orders` | Yes |
| Quality queue and inspection | `/qc` | Yes |
| Planner | `/planning`, `/optimization` | Yes |
| Routings | `/bom`, `/boms` | Yes |
| Maintenance | `/maintenance` | Two real screens, three samples (labelled) |
| Production quality, customer quality, supplier quality | `/production-quality` and others | Samples, labelled (owner decision 4 says build them on real records: M-011) |

## 4. Capabilities the brief names, and whether they exist

| Capability | Exists | Evidence or finding |
|---|---|---|
| Work order creation | Yes (both records) | Group 1 |
| Routing and process definitions | Yes: versioned routings with steps | Group 1; L-011 |
| Bill of material (materials and quantities) | No. "BOM recipe" is a routing; it lists steps, not materials | Group 2, NOT APPLICABLE; L-024 |
| Material requirements for a job | No | Group 2, NOT APPLICABLE; L-024 |
| Work-center master data | Yes | `phase-07-work-center-capabilities.md` |
| Capacity planning | Partly: hours per day on a work center, no calendar | L-025 |
| Scheduling and dispatch queues | Yes | Group 3 |
| Execution state transitions enforced by the server | Yes, after this phase | L-001, L-004, L-006 |
| Material issue and consumption | On coil work orders only | Group 2 |
| Cutting, yield | Yield from weights on a coil work order. No nesting | Group 6; L-027 |
| Labor time | Yes: clock entries per step and operator | Group 4 |
| Machine time, downtime | No machine connection. `DowntimeRecord` exists and nothing writes it | Group 4, NOT APPLICABLE; L-030 |
| Quality control and inspection | Yes | Group 5 |
| Nonconformance and corrective action | No. A failed inspection is the only record | L-023 |
| Rework | Sent back with instructions; not routed or clocked | L-020 |
| Scrap and remnants | Yes, on coil work orders (Phase 3 and 6) | Group 6 |
| Production costing | No | L-026, K-007 |
| Outsourced processing | No | L-027 |
| Cross-location manufacturing | A job is worked at the branch of its work center, which may be a different branch from the one that sold the order. Material moves by transfer | Group 7; the multi-branch jobs of the simulation |
| Machine integration | None. No equipment is driven | L-030 |
