# RBAC/ABAC Permissions Specification
## AlroWare Steel & Plastics Service Center Platform
### Version 1.0 | February 2026

---

# A) SCOPE & PRINCIPLES

## Guiding Principles

### 1. Least Privilege
- Users receive only the minimum permissions required for their job function
- Default deny: if not explicitly granted, access is denied
- Permissions are additive through role composition

### 2. Separation of Duties
- High-impact actions require approval from a different user/role
- Financial actions separated from operational actions
- Data entry separated from approval where material

### 3. Explicit Approvals
- Margin overrides, price below cost, inventory adjustments above threshold
- Promise date changes beyond capacity
- Scrap/write-off above dollar threshold
- Break-glass/emergency access

### 4. Immutable Audit Trail
- All state changes logged with before/after
- Approval chains recorded with timestamps
- No audit log deletion (append-only)
- Correlation IDs for tracing multi-step workflows

### 5. Location + Division Scoping (Default Rule)
- Users are scoped to one or more locations by default
- Users are scoped to one or more divisions (METALS, PLASTICS, SUPPLIES)
- Cross-scope access requires explicit grant or elevated role
- HQ/Executive roles may have "ALL" scope

### 6. Emergency Access Procedure (Break-Glass)
- Requires documented reason
- Creates high-priority audit event
- Auto-notifies security officer and manager
- Time-limited (4 hours max)
- Requires post-incident review within 24 hours

---

# B) MODULES & RESOURCES (PROTECTED SURFACES)

## Module Catalog

| ID | Module | Description | Key Resources |
|----|--------|-------------|---------------|
| 01 | Identity & Access | User management, roles, permissions, sessions | User, Role, Permission, Session, ApiKey |
| 02 | Tenant Admin | Organization settings, locations, divisions, config | Tenant, Location, Division, OrgSettings |
| 03 | CRM / Contacts | Customer and supplier contacts | Contact, Company, Address, ContactNote |
| 04 | RFQ Intake | Quote requests via email, phone, web, EDI | RFQ, RFQLine, RFQAttachment, ParsedEmail |
| 05 | Quoting & Pricing | Price books, quotes, margin, surcharges | Quote, QuoteLine, PriceBook, PriceRule, Surcharge |
| 06 | Orders | Order entry, promises, allocations | Order, OrderLine, Allocation, Promise |
| 07 | Inventory | Stock, bins, transfers, adjustments, cycle count | InventoryItem, StockLot, Bin, Transfer, Adjustment, CycleCount |
| 08 | Purchasing | Supplier RFQ/PO, inbound purchasing | SupplierRFQ, PurchaseOrder, POLine, SupplierQuote |
| 09 | Receiving | Inbound receiving, putaway, inspection | Receipt, ReceiptLine, Putaway, InboundInspection |
| 10 | BOM / Recipes | Operations, work centers, routings, standards | Recipe, RecipeLine, Routing, OperationDef, WorkCenter |
| 11 | Production / Jobs | Job creation, WIP tracking, rework | Job, JobLine, JobOperation, WIPRecord, ReworkOrder |
| 12 | Dispatch Engine | Auto-assign, queues, resequence, optimization | DispatchQueue, DispatchRun, Assignment, QueueSlot |
| 13 | Shop Floor Execution | Start/pause/complete, time logs, downtime | Execution, TimeLog, DowntimeEvent, ScanEvent |
| 14 | QC / Compliance | Holds, releases, scrap, rework disposition | QCHold, QCRelease, ScrapRecord, ReworkDisposition, Cert |
| 15 | Packaging | Pack, label, stage, container management | Package, PackageLine, Label, StagingArea, Container |
| 16 | Shipping / Logistics | Shipments, carriers, freight, ASN, BOL | Shipment, ShipmentLine, Carrier, FreightQuote, BOL, ASN |
| 17 | Invoicing / Finance | Invoice prep, credits, write-offs, AR | Invoice, InvoiceLine, Credit, WriteOff, Payment |
| 18 | Analytics & KPIs | Dashboards, reports, exports | Dashboard, Report, KPI, ExportJob, Alert |
| 19 | Simulation & Forecasting | What-if scenarios, demand forecasting | SimulationRun, Scenario, Forecast, ForecastLine |
| 20 | Integrations | EDI, ecommerce, email, ERP hooks | IntegrationConfig, EDIMap, Webhook, SyncJob, ApiCredential |
| 21 | Master Data | Materials, grades, forms, commodity pricing | Material, Grade, Form, CommodityIndex, Region |
| 22 | Traceability | Heat/lot, RFID, chain-of-custody | TraceEvent, HeatRecord, LotRecord, RFIDTag, ChainLink |
| 23 | Support Tools | Impersonation, tickets, logs, diagnostics | SupportTicket, ImpersonationSession, SystemLog, Diagnostic |

---

## Resource Sensitivity Levels

| Level | Description | Access Requirement |
|-------|-------------|-------------------|
| NORMAL | Standard operational data | Role-based access |
| FINANCIAL | Cost, margin, pricing data | Finance role or explicit grant |
| EXEC_ONLY | Strategic forecasts, sensitive analytics | Executive role only |
| PII | Personal identifiable information | Data privacy compliance |
| AUDIT | Audit logs and compliance records | Auditor role, immutable |

---

# C) ROLE CATALOG

## Role Hierarchy Diagram

```
SUPER_ADMIN (Platform)
    └── TENANT_OWNER (Alro HQ)
            ├── EXECUTIVE
            │       ├── CFO
            │       ├── COO
            │       └── CIO
            ├── DIVISION_DIRECTOR (Metals/Plastics)
            │       └── BRANCH_MANAGER
            │               ├── OPS_MANAGER
            │               ├── SALES_DIRECTOR
            │               └── INVENTORY_MANAGER
            └── AUDITOR (cross-cutting, read-only)
```

---

## Executive Roles

### SUPER_ADMIN
- **Purpose**: Platform-level administration (SaaS operator)
- **Scope**: All tenants
- **Dashboard**: System health, tenant list, platform metrics
- **Notes**: Can impersonate any user, configure platform settings

### TENANT_OWNER
- **Purpose**: Top-level administrator for a single tenant (e.g., Alro HQ)
- **Scope**: Entire tenant (all locations, all divisions)
- **Dashboard**: Org overview, user management, license usage
- **Notes**: Can create/modify all roles within tenant

### EXECUTIVE
- **Purpose**: C-suite visibility, strategic decisions
- **Scope**: Entire tenant
- **Dashboard**: Executive KPIs, margin trends, forecast vs actual
- **Notes**: Read-heavy, limited write except approvals

### CFO
- **Purpose**: Financial oversight, pricing approval authority
- **Scope**: Entire tenant (financial focus)
- **Dashboard**: AR aging, margin analysis, write-off queue, cash flow
- **Notes**: Approval authority for price-below-cost, large credits

### COO
- **Purpose**: Operations oversight
- **Scope**: Entire tenant (operations focus)
- **Dashboard**: On-time delivery, WIP aging, capacity utilization
- **Notes**: Approval authority for major schedule changes

### CIO
- **Purpose**: Technology and integration oversight
- **Scope**: Entire tenant (IT focus)
- **Dashboard**: Integration health, system performance, security events
- **Notes**: Manages API keys, integration configs

### DIVISION_DIRECTOR
- **Purpose**: Division-level leadership (Metals OR Plastics)
- **Scope**: Single division, all locations within division
- **Dashboard**: Division P&L, inventory turns, sales pipeline
- **Notes**: Cross-location visibility within division

### BRANCH_MANAGER
- **Purpose**: Single location P&L ownership
- **Scope**: Single location, assigned divisions at that location
- **Dashboard**: Branch scorecard, staffing, local inventory
- **Notes**: Full operational control within location

---

## Sales / Customer Roles

### SALES_DIRECTOR
- **Purpose**: Sales leadership, team management, pricing authority
- **Scope**: Assigned locations or all locations
- **Dashboard**: Sales pipeline, quote conversion, rep performance
- **Notes**: Can override margins within limit, assign accounts

### SALES_REP
- **Purpose**: Account ownership, quote creation, order entry
- **Scope**: Assigned accounts, assigned location(s)
- **Dashboard**: My accounts, my quotes, callbacks, order status
- **Notes**: Cannot override margin, limited to assigned accounts

### CSR (Customer Service Rep)
- **Purpose**: Customer support, order entry, status updates
- **Scope**: Assigned location(s), all customers at location
- **Dashboard**: New RFQs, pending quotes, customer calls, order exceptions
- **Notes**: Broader customer access than Sales Rep, no margin control

### ESTIMATOR
- **Purpose**: Technical quoting, BOM creation, pricing calculations
- **Scope**: Assigned location(s)
- **Dashboard**: Quote queue, material lookup, recipe builder
- **Notes**: Can create/edit quotes, limited pricing authority

### ACCOUNT_MANAGER
- **Purpose**: Strategic account relationship management
- **Scope**: Assigned key accounts (cross-location)
- **Dashboard**: Account health, contract status, volume trends
- **Notes**: Similar to Sales Rep but for strategic accounts

### CREDIT_MANAGER
- **Purpose**: Credit decisions, AR management, collections
- **Scope**: Assigned location(s) or all
- **Dashboard**: Credit holds, AR aging, payment history
- **Notes**: Can place/release credit holds, set credit limits

---

## Operations Roles

### OPS_MANAGER
- **Purpose**: Branch operations leadership
- **Scope**: Single location
- **Dashboard**: Dispatch overview, blockers, utilization, hot jobs
- **Notes**: Full job/dispatch control, approval authority for overrides

### PRODUCTION_MANAGER
- **Purpose**: Production planning and execution oversight
- **Scope**: Single location or zone
- **Dashboard**: Job queue, WIP, machine status, scrap rates
- **Notes**: Can create/modify jobs, assign work centers

### SCHEDULER
- **Purpose**: Dispatch and sequencing optimization
- **Scope**: Assigned location(s) or work centers
- **Dashboard**: Dispatch queue, capacity calendar, constraint view
- **Notes**: Can run dispatch, resequence, cannot override promises

### WORKCENTER_LEAD
- **Purpose**: Supervise specific work center(s)
- **Scope**: Assigned work center(s)
- **Dashboard**: Work center queue, operator assignments, downtime
- **Notes**: Can reassign operators within work center

### INVENTORY_MANAGER
- **Purpose**: Inventory control, adjustments, transfers
- **Scope**: Assigned location(s)
- **Dashboard**: Stock levels, aging, transfer requests, cycle count
- **Notes**: Approval authority for large adjustments

### BUYER
- **Purpose**: Purchasing, supplier management
- **Scope**: Assigned location(s) or categories
- **Dashboard**: Open POs, supplier quotes, receiving queue
- **Notes**: Can create POs within limits, approve receipts

### RECEIVING_CLERK
- **Purpose**: Inbound receiving, putaway
- **Scope**: Single location
- **Dashboard**: Expected receipts, receiving queue, putaway tasks
- **Notes**: Can receive, cannot adjust inventory

### SHIPPING_COORDINATOR
- **Purpose**: Shipping execution, carrier coordination
- **Scope**: Single location
- **Dashboard**: Staged shipments, carrier schedule, BOL queue
- **Notes**: Can dispatch shipments, print documents

### PACKAGING_LEAD
- **Purpose**: Packaging operations supervision
- **Scope**: Single location
- **Dashboard**: Packaging queue, label queue, staging status
- **Notes**: Can assign packaging tasks, seal packages

### QC_INSPECTOR
- **Purpose**: Quality inspection, hold/release authority
- **Scope**: Assigned location(s)
- **Dashboard**: Inspection queue, holds, pending releases
- **Notes**: Can place/release holds, record test results

### MAINTENANCE_MANAGER
- **Purpose**: Equipment maintenance, downtime tracking
- **Scope**: Assigned location(s)
- **Dashboard**: Equipment status, PM schedule, downtime analysis
- **Notes**: Can mark equipment out of service

---

## Shop Floor Roles

### OPERATOR_SAW
- **Purpose**: Saw operation execution
- **Scope**: Assigned work center(s) at location
- **Dashboard**: My queue, current job, timer, next job
- **Notes**: Start/pause/complete own jobs only

### OPERATOR_ROUTER
- **Purpose**: Router operation execution
- **Scope**: Assigned work center(s) at location
- **Dashboard**: My queue, current job, timer, next job
- **Notes**: Start/pause/complete own jobs only

### OPERATOR_SHEAR
- **Purpose**: Shear/laser operation execution
- **Scope**: Assigned work center(s) at location
- **Dashboard**: My queue, current job, timer, next job
- **Notes**: Start/pause/complete own jobs only

### OPERATOR_GENERAL
- **Purpose**: General machine operation
- **Scope**: Assigned work center(s) at location
- **Dashboard**: My queue, current job, timer, next job
- **Notes**: Start/pause/complete own jobs only

### MATERIAL_HANDLER
- **Purpose**: Forklift operation, material movement
- **Scope**: Single location
- **Dashboard**: Move tasks, staging requests, putaway queue
- **Notes**: Can scan material moves, cannot adjust inventory

### TIMECLOCK_USER
- **Purpose**: Time tracking only (minimal system access)
- **Scope**: Single location (own records only)
- **Dashboard**: Clock in/out, own time history
- **Notes**: No operational access beyond timekeeping

---

## IT / Support Roles

### INTEGRATION_ADMIN
- **Purpose**: Integration configuration and monitoring
- **Scope**: Entire tenant (IT focus)
- **Dashboard**: Integration status, sync logs, error queues
- **Notes**: Can configure integrations, rotate API keys

### DATA_ANALYST
- **Purpose**: Reporting, data export, analysis
- **Scope**: Assigned location(s) or all (read-only)
- **Dashboard**: Report builder, export queue, data explorer
- **Notes**: Read-only with export capability

### SUPPORT_AGENT
- **Purpose**: Internal help desk, user assistance
- **Scope**: Entire tenant (support focus)
- **Dashboard**: Support tickets, user lookup, impersonation log
- **Notes**: Can impersonate users (audited), reset passwords

### AUDITOR
- **Purpose**: Compliance review, audit trail access
- **Scope**: Entire tenant (read-only)
- **Dashboard**: Audit log viewer, compliance reports
- **Notes**: Cannot modify any data, cannot export without approval

---

## External Portal Roles

### CUSTOMER_ADMIN
- **Purpose**: Customer company administrator
- **Scope**: Own company's data only
- **Dashboard**: Company users, order history, account settings
- **Notes**: Can manage users within their company

### CUSTOMER_BUYER
- **Purpose**: Customer purchasing agent
- **Scope**: Own company's orders
- **Dashboard**: Create RFQ, view quotes, place orders, track shipments
- **Notes**: Can create orders, cannot see pricing internals

### CUSTOMER_VIEWER
- **Purpose**: Customer read-only access
- **Scope**: Own company's data (read-only)
- **Dashboard**: Order status, shipment tracking, documents
- **Notes**: No create/edit capability

### SUPPLIER_USER
- **Purpose**: Supplier portal access
- **Scope**: Own supplier's POs and RFQs
- **Dashboard**: Open RFQs, PO acknowledgment, ASN submission
- **Notes**: Can respond to RFQs, confirm POs

### CARRIER_USER
- **Purpose**: Carrier/logistics portal access
- **Scope**: Assigned shipments only
- **Dashboard**: Pickup schedule, BOL access, POD upload
- **Notes**: Can update shipment status, upload POD

---

# D) PERMISSION MATRIX

## Standard Action Verbs

| Verb | Description |
|------|-------------|
| view | View single resource |
| list | List/search resources |
| create | Create new resource |
| update | Modify existing resource |
| delete | Soft delete resource |
| export | Export data to file |
| approve | Approve pending action |
| reject | Reject pending action |
| override | Override system constraint (audited) |
| assign | Assign resource to user/entity |
| start | Start execution (shop floor) |
| pause | Pause execution |
| complete | Complete execution |
| cancel | Cancel order/job |
| adjust | Adjust quantity (inventory) |
| transfer | Transfer between locations |
| hold | Place on hold |
| release | Release from hold |
| configure | Configure system settings |
| impersonate | Act as another user (audited) |
| break_glass | Emergency access (audited) |

---

## Module Permission Definitions

### 01 - Identity & Access (iam.*)
```
iam.user.view, iam.user.list, iam.user.create, iam.user.update, iam.user.delete
iam.user.password_reset, iam.user.unlock, iam.user.impersonate
iam.role.view, iam.role.list, iam.role.create, iam.role.update, iam.role.delete
iam.role.assign, iam.role.revoke
iam.permission.view, iam.permission.list
iam.session.view, iam.session.terminate
iam.apikey.view, iam.apikey.create, iam.apikey.rotate, iam.apikey.revoke
```

### 02 - Tenant Admin (tenant.*)
```
tenant.settings.view, tenant.settings.update
tenant.location.view, tenant.location.list, tenant.location.create, tenant.location.update
tenant.division.view, tenant.division.list, tenant.division.create, tenant.division.update
tenant.config.view, tenant.config.update
tenant.branding.update
tenant.license.view
```

### 03 - CRM / Contacts (crm.*)
```
crm.contact.view, crm.contact.list, crm.contact.create, crm.contact.update, crm.contact.delete
crm.contact.merge, crm.contact.export
crm.company.view, crm.company.list, crm.company.create, crm.company.update
crm.company.credit_limit.view, crm.company.credit_limit.update
crm.note.create, crm.note.view, crm.note.update
crm.activity.log, crm.activity.view
```

### 04 - RFQ Intake (rfq.*)
```
rfq.view, rfq.list, rfq.create, rfq.update, rfq.delete
rfq.parse_ai, rfq.parse_manual
rfq.assign_owner, rfq.reassign
rfq.merge_duplicate, rfq.mark_spam
rfq.convert_to_quote
rfq.attachment.view, rfq.attachment.upload
rfq.export
```

### 05 - Quoting & Pricing (quote.*)
```
quote.view, quote.list, quote.create, quote.update, quote.delete
quote.line.add, quote.line.update, quote.line.remove
quote.price_calculate, quote.price_edit
quote.discount.apply, quote.discount.override
quote.margin.view, quote.margin.override
quote.surcharge.add, quote.surcharge.remove
quote.send, quote.resend
quote.accept, quote.reject, quote.expire
quote.lock, quote.unlock
quote.convert_to_order
quote.clone
quote.export
quote.approval.request, quote.approval.approve, quote.approval.reject
```

### 06 - Orders (order.*)
```
order.view, order.list, order.create, order.update, order.cancel
order.line.add, order.line.update, order.line.remove
order.promise.view, order.promise.update, order.promise.override
order.allocate, order.deallocate
order.split, order.merge
order.hold, order.release
order.status.advance, order.status.revert
order.priority.update
order.ship_to.update
order.notes.add
order.export
order.acknowledgment.send
```

### 07 - Inventory (inv.*)
```
inv.item.view, inv.item.list, inv.item.create, inv.item.update
inv.stock.view, inv.stock.list
inv.lot.view, inv.lot.list, inv.lot.assign, inv.lot.split, inv.lot.merge
inv.bin.view, inv.bin.list, inv.bin.assign
inv.adjust, inv.adjust.approve, inv.adjust.override
inv.transfer.request, inv.transfer.approve, inv.transfer.execute
inv.cycle_count.create, inv.cycle_count.count, inv.cycle_count.approve
inv.substitute.suggest, inv.substitute.approve
inv.scrap.record, inv.scrap.approve
inv.hold, inv.release
inv.export
inv.valuation.view
```

### 08 - Purchasing (po.*)
```
po.view, po.list, po.create, po.update, po.cancel
po.line.add, po.line.update, po.line.remove
po.approve, po.reject
po.send, po.resend
po.acknowledge
po.receipt.link
po.supplier_rfq.create, po.supplier_rfq.send
po.export
```

### 09 - Receiving (recv.*)
```
recv.receipt.view, recv.receipt.list, recv.receipt.create, recv.receipt.update
recv.line.receive, recv.line.reject, recv.line.partial
recv.inspect.start, recv.inspect.pass, recv.inspect.fail
recv.putaway.assign, recv.putaway.complete
recv.discrepancy.report
recv.export
```

### 10 - BOM / Recipes (bom.*)
```
bom.recipe.view, bom.recipe.list, bom.recipe.create, bom.recipe.update, bom.recipe.delete
bom.recipe.version, bom.recipe.activate, bom.recipe.deactivate
bom.routing.view, bom.routing.list, bom.routing.create, bom.routing.update
bom.operation.view, bom.operation.list, bom.operation.create, bom.operation.update
bom.workcenter.view, bom.workcenter.list, bom.workcenter.create, bom.workcenter.update
bom.standard.view, bom.standard.update
bom.export
```

### 11 - Production / Jobs (job.*)
```
job.view, job.list, job.create, job.update, job.delete
job.release, job.hold, job.cancel
job.priority.update
job.operation.view, job.operation.list
job.operation.assign, job.operation.reassign
job.operation.sequence.update
job.rework.create, job.rework.approve
job.split, job.merge
job.material.issue, job.material.return
job.wip.view
job.export
```

### 12 - Dispatch Engine (dispatch.*)
```
dispatch.queue.view, dispatch.queue.list
dispatch.run.execute, dispatch.run.schedule
dispatch.assignment.view, dispatch.assignment.override
dispatch.resequence, dispatch.resequence.override
dispatch.constraint.view, dispatch.constraint.update
dispatch.optimization.run
dispatch.simulation.run
dispatch.export
```

### 13 - Shop Floor Execution (floor.*)
```
floor.op.view, floor.op.list
floor.op.start, floor.op.pause, floor.op.resume, floor.op.complete
floor.op.scrap, floor.op.rework
floor.time.log, floor.time.edit, floor.time.approve
floor.downtime.start, floor.downtime.end, floor.downtime.reason
floor.scan.rfid, floor.scan.barcode
floor.output.record
floor.defect.record
floor.queue.view
```

### 14 - QC / Compliance (qc.*)
```
qc.inspection.view, qc.inspection.list, qc.inspection.create
qc.inspection.pass, qc.inspection.fail, qc.inspection.conditional
qc.hold.place, qc.hold.release, qc.hold.override
qc.scrap.dispose, qc.scrap.approve
qc.rework.order, qc.rework.approve
qc.cert.view, qc.cert.attach, qc.cert.generate
qc.ncr.create, qc.ncr.update, qc.ncr.close
qc.calibration.view, qc.calibration.record
qc.export
```

### 15 - Packaging (pack.*)
```
pack.package.view, pack.package.list, pack.package.create
pack.package.add_item, pack.package.remove_item
pack.package.seal, pack.package.unseal
pack.label.generate, pack.label.print, pack.label.reprint
pack.stage, pack.unstage
pack.container.view, pack.container.assign
pack.weight.record
pack.export
```

### 16 - Shipping / Logistics (ship.*)
```
ship.shipment.view, ship.shipment.list, ship.shipment.create, ship.shipment.update
ship.shipment.cancel
ship.line.add, ship.line.remove
ship.stage, ship.load, ship.dispatch
ship.carrier.select, ship.carrier.override
ship.freight.view, ship.freight.quote, ship.freight.override
ship.bol.generate, ship.bol.print
ship.asn.generate, ship.asn.send
ship.track.update
ship.pod.upload
ship.return.create, ship.return.process
ship.export
```

### 17 - Invoicing / Finance (fin.*)
```
fin.invoice.view, fin.invoice.list, fin.invoice.create, fin.invoice.update
fin.invoice.send, fin.invoice.void
fin.invoice.line.add, fin.invoice.line.remove
fin.credit.create, fin.credit.approve
fin.writeoff.request, fin.writeoff.approve
fin.payment.view, fin.payment.record, fin.payment.apply
fin.ar.view, fin.ar.export
fin.cost.view
fin.margin.view
fin.pricing.index.view, fin.pricing.index.update
fin.pricebook.view, fin.pricebook.update
fin.report.view, fin.report.export
```

### 18 - Analytics & KPIs (analytics.*)
```
analytics.dashboard.view
analytics.kpi.view
analytics.report.view, analytics.report.create, analytics.report.schedule
analytics.export
analytics.alert.view, analytics.alert.create, analytics.alert.acknowledge
analytics.drill.down
```

### 19 - Simulation & Forecasting (sim.*)
```
sim.scenario.view, sim.scenario.list, sim.scenario.create, sim.scenario.update
sim.scenario.run, sim.scenario.compare
sim.forecast.view, sim.forecast.create, sim.forecast.update
sim.forecast.approve
sim.whatif.run
sim.export
```

### 20 - Integrations (int.*)
```
int.config.view, int.config.list, int.config.create, int.config.update
int.config.activate, int.config.deactivate
int.credential.view, int.credential.create, int.credential.rotate
int.edi.map.view, int.edi.map.update
int.webhook.view, int.webhook.create, int.webhook.update, int.webhook.test
int.sync.view, int.sync.trigger, int.sync.retry
int.log.view
int.export
```

### 21 - Master Data (master.*)
```
master.material.view, master.material.list, master.material.create, master.material.update
master.grade.view, master.grade.list, master.grade.create, master.grade.update
master.form.view, master.form.list, master.form.create, master.form.update
master.uom.view, master.uom.list, master.uom.create, master.uom.update
master.commodity.view, master.commodity.update
master.region.view, master.region.update
master.export
```

### 22 - Traceability (trace.*)
```
trace.event.view, trace.event.list
trace.event.create, trace.event.correct
trace.heat.view, trace.heat.list
trace.lot.view, trace.lot.list
trace.rfid.scan, trace.rfid.assign
trace.chain.view
trace.export
trace.report.generate
```

### 23 - Support Tools (support.*)
```
support.ticket.view, support.ticket.list, support.ticket.create, support.ticket.update
support.ticket.assign, support.ticket.close
support.impersonate.start, support.impersonate.stop
support.log.view
support.diagnostic.run
support.break_glass.request, support.break_glass.approve
```

---

## Permission Matrix by Role

### SUPER_ADMIN
```
ALL PERMISSIONS (*)
```

### TENANT_OWNER
```
All permissions within tenant except:
- support.break_glass.approve (requires SUPER_ADMIN)
```

### EXECUTIVE (CEO/President)
```
# View/List across all modules
*.view, *.list (all modules)
analytics.*, sim.*
fin.margin.view, fin.cost.view
order.hold, order.release
quote.approval.approve
inv.adjust.override (approval)
```

### CFO
```
fin.* (all finance permissions)
quote.margin.view, quote.margin.override
quote.discount.override
quote.approval.approve, quote.approval.reject
order.view, order.list
inv.valuation.view, inv.adjust.approve
analytics.*, sim.forecast.*
crm.company.credit_limit.view, crm.company.credit_limit.update
```

### COO
```
job.*, dispatch.*, floor.* (view/list)
bom.*, inv.* (view/list)
order.promise.override (approval)
analytics.*
qc.hold.override (approval)
ship.carrier.override (approval)
```

### CIO
```
iam.* (all identity)
int.* (all integrations)
tenant.* (all tenant admin)
support.* (all support)
analytics.* (all analytics)
```

### DIVISION_DIRECTOR
```
# Within assigned division:
crm.*, rfq.*, quote.*, order.* (view, list, export)
inv.* (view, list, export)
job.*, dispatch.* (view, list)
analytics.*
quote.approval.approve (within division)
quote.margin.override (within limits)
```

### BRANCH_MANAGER
```
# Within assigned location:
crm.*, rfq.*, quote.*, order.* (all except margin.override)
inv.* (all except override)
job.*, dispatch.* (all)
floor.* (view, list)
qc.* (all)
pack.*, ship.* (all)
recv.* (all)
analytics.* (location-scoped)
iam.user.view, iam.user.list (location users)
quote.approval.approve
inv.adjust.approve
job.rework.approve
```

### SALES_DIRECTOR
```
# Within assigned scope:
crm.* (all)
rfq.* (all)
quote.* (all including margin.override within limit)
order.view, order.list, order.create, order.update, order.hold, order.release
order.promise.view
inv.view, inv.list (no adjust)
analytics.* (sales-focused)
```

### SALES_REP
```
# Within assigned accounts:
crm.contact.view, crm.contact.list, crm.contact.create, crm.contact.update
crm.note.create, crm.note.view
rfq.view, rfq.list, rfq.create, rfq.update
rfq.convert_to_quote
quote.view, quote.list, quote.create, quote.update
quote.line.*, quote.send, quote.clone
quote.accept (cannot override price)
order.view, order.list, order.create, order.notes.add
inv.view, inv.list
```

### CSR
```
# Within assigned location:
crm.* (all except credit_limit.update)
rfq.* (all)
quote.view, quote.list, quote.create, quote.update
quote.line.*, quote.send, quote.accept
order.* (all except promise.override)
inv.view, inv.list
ship.shipment.view, ship.track.update
```

### ESTIMATOR
```
rfq.view, rfq.list
quote.view, quote.list, quote.create, quote.update
quote.line.*, quote.price_calculate
bom.recipe.view, bom.recipe.list, bom.recipe.create
bom.routing.*, bom.operation.*
master.* (view only)
inv.view, inv.list
```

### CREDIT_MANAGER
```
crm.company.view, crm.company.list
crm.company.credit_limit.view, crm.company.credit_limit.update
order.hold, order.release (credit-related)
fin.ar.view, fin.ar.export
fin.payment.view, fin.payment.record
fin.writeoff.request
analytics.* (AR-focused)
```

### OPS_MANAGER
```
# Within assigned location:
job.* (all)
dispatch.* (all)
floor.* (view, list, time.approve)
bom.* (view, list)
inv.* (all)
qc.* (all)
pack.*, ship.* (all)
recv.* (all)
order.promise.override (approval)
analytics.* (ops-focused)
```

### PRODUCTION_MANAGER
```
job.* (all)
dispatch.queue.view, dispatch.run.execute, dispatch.resequence
floor.* (view, list, time.approve)
bom.* (all)
inv.view, inv.list, inv.transfer.*, inv.adjust (within limit)
qc.view, qc.list
analytics.* (production-focused)
```

### SCHEDULER
```
dispatch.* (all)
job.view, job.list, job.priority.update
job.operation.assign, job.operation.sequence.update
bom.workcenter.view, bom.routing.view
inv.view, inv.list
floor.queue.view
```

### WORKCENTER_LEAD
```
# Within assigned work centers:
dispatch.queue.view
job.view, job.list
job.operation.assign (within work center)
floor.* (all)
qc.hold.place, qc.inspection.* (at work center)
inv.view
```

### INVENTORY_MANAGER
```
inv.* (all)
recv.* (all)
bom.recipe.view (material lookup)
order.view (allocation context)
job.view (WIP context)
master.material.*, master.grade.*, master.form.* (view)
analytics.* (inventory-focused)
```

### BUYER
```
po.* (all)
crm.company.view (suppliers)
inv.view, inv.list
recv.view, recv.list
master.material.view, master.commodity.view
analytics.* (purchasing-focused)
```

### RECEIVING_CLERK
```
recv.* (all except discrepancy override)
po.view, po.list
inv.view, inv.lot.assign
pack.label.print (receiving labels)
```

### SHIPPING_COORDINATOR
```
ship.* (all)
pack.view, pack.list, pack.stage
order.view (shipping context)
inv.view (stock location)
```

### PACKAGING_LEAD
```
pack.* (all)
ship.stage
order.view
job.view (packaging jobs)
inv.view
```

### QC_INSPECTOR
```
qc.* (all)
inv.hold, inv.release
job.view, job.operation.view
recv.inspect.*
trace.* (view, create)
```

### MAINTENANCE_MANAGER
```
bom.workcenter.view, bom.workcenter.update (status)
floor.downtime.* (view, categorize)
job.hold (equipment down)
analytics.* (equipment-focused)
support.diagnostic.run
```

### OPERATOR_SAW / OPERATOR_ROUTER / OPERATOR_SHEAR / OPERATOR_GENERAL
```
floor.op.view, floor.op.list (own queue)
floor.op.start, floor.op.pause, floor.op.resume, floor.op.complete
floor.time.log
floor.downtime.start, floor.downtime.end, floor.downtime.reason
floor.scan.rfid, floor.scan.barcode
floor.output.record
floor.defect.record
floor.queue.view
job.view (own jobs)
```

### MATERIAL_HANDLER
```
inv.view, inv.list
floor.scan.rfid, floor.scan.barcode
pack.stage, pack.unstage
recv.putaway.complete
ship.load
trace.rfid.scan
```

### TIMECLOCK_USER
```
floor.time.log (own time only)
```

### INTEGRATION_ADMIN
```
int.* (all)
iam.apikey.* (all)
tenant.config.view
support.log.view
analytics.* (integration-focused)
```

### DATA_ANALYST
```
analytics.* (all)
*.view, *.list (all modules, read-only)
*.export (all modules)
sim.* (all)
```

### SUPPORT_AGENT
```
support.* (all)
iam.user.view, iam.user.password_reset, iam.user.unlock
*.view, *.list (all modules, read-only)
```

### AUDITOR
```
*.view, *.list (all modules, read-only)
support.log.view
trace.* (view only)
# NO export unless explicitly approved
# NO create/update/delete on any resource
```

### CUSTOMER_ADMIN
```
# Own company only:
crm.contact.view, crm.contact.list, crm.contact.create, crm.contact.update (company users)
order.view, order.list
ship.shipment.view, ship.track.view
rfq.create, rfq.view, rfq.list
quote.view, quote.list, quote.accept
```

### CUSTOMER_BUYER
```
# Own company only:
rfq.create, rfq.view, rfq.list
quote.view, quote.list, quote.accept, quote.reject
order.create, order.view, order.list
ship.shipment.view, ship.track.view
```

### CUSTOMER_VIEWER
```
# Own company only:
order.view, order.list
ship.shipment.view, ship.track.view
```

### SUPPLIER_USER
```
# Own supplier only:
po.view, po.list, po.acknowledge
po.supplier_rfq.view, po.supplier_rfq.respond
ship.asn.create
recv.view (own POs)
```

### CARRIER_USER
```
# Assigned shipments only:
ship.shipment.view
ship.track.update
ship.pod.upload
ship.bol.view
```

---

# E) ABAC (Attribute-Based Access Control) RULES

## Overview
ABAC provides dynamic, context-aware access decisions based on resource attributes, user attributes, environmental conditions, and organizational hierarchy.

## Core Scoping Dimensions

### 1. Tenant Scope
```typescript
interface TenantScope {
  tenantId: string;       // Always enforced - no cross-tenant access
  isMultiTenant: boolean; // Platform-wide flag
}

// Rule: ALL queries MUST include tenantId filter
// Enforcement: Prisma middleware auto-appends tenantId
```

### 2. Division Scope
```typescript
interface DivisionScope {
  divisionIds: string[];     // User's assigned divisions
  divisionViewAll: boolean;  // Can view all divisions (executives)
  divisionEditOwn: boolean;  // Can only edit own division
}

// Rule: Non-executives see only assigned division data
// Example: Sales Director for "West" division cannot see "East" orders
```

### 3. Location Scope
```typescript
interface LocationScope {
  locationIds: string[];     // User's assigned locations
  locationViewAll: boolean;  // Can view all locations
  homeLocationId: string;    // Primary location
}

// Rule: Floor operators see only their location
// Rule: Branch managers can view/edit only their locations
// Example: SAW_OPERATOR at "Dallas" cannot see "Houston" jobs
```

### 4. Customer Scope
```typescript
interface CustomerScope {
  assignedAccountIds: string[];  // Sales rep assigned accounts
  customerViewAll: boolean;      // Can view all customers
  portfolioType: 'house' | 'assigned' | 'all';
}

// Rule: Sales reps only see assigned accounts
// Rule: House accounts visible to all sales at location
// Example: Rep cannot see competitor's pricing on unassigned account
```

### 5. Ownership Scope
```typescript
interface OwnershipScope {
  createdById: string;       // Who created the record
  assignedToId: string;      // Who owns/is assigned the record
  teamIds: string[];         // Team membership
}

// Rule: CSRs can edit own quotes, view team quotes
// Rule: Scheduler can reassign jobs only within work centers
```

---

## ABAC Policy Rules

### Data Visibility Rules

```yaml
# Rule: Order Visibility
order.view:
  conditions:
    - role in [EXECUTIVE, COO, CFO]: allow ALL
    - role == DIVISION_DIRECTOR: allow where order.divisionId IN user.divisionIds
    - role == BRANCH_MANAGER: allow where order.locationId IN user.locationIds
    - role == SALES_REP: allow where order.customerId IN user.assignedAccountIds OR order.createdById == user.id
    - role == CSR: allow where order.locationId IN user.locationIds
    - role == CUSTOMER_*: allow where order.customerId == user.customerId
    - DEFAULT: deny

# Rule: Inventory Visibility  
inv.stock.view:
  conditions:
    - role in [EXECUTIVE, INVENTORY_MANAGER]: allow ALL
    - role == BRANCH_MANAGER: allow where inventory.locationId IN user.locationIds
    - role == SALES_*: allow where inventory.locationId IN user.locationIds (qty only, not cost)
    - role == OPERATOR_*: allow where inventory.locationId == user.homeLocationId
    - DEFAULT: deny

# Rule: Quote Margin Visibility
quote.margin.view:
  conditions:
    - role in [EXECUTIVE, CFO, SALES_DIRECTOR]: allow
    - role == DIVISION_DIRECTOR: allow where quote.divisionId IN user.divisionIds
    - role == BRANCH_MANAGER: allow where quote.locationId IN user.locationIds
    - role == ESTIMATOR: allow (needed for pricing)
    - role == SALES_REP: deny (sees final price only)
    - DEFAULT: deny

# Rule: Cost Visibility
*.cost.view:
  conditions:
    - role in [EXECUTIVE, CFO, COO]: allow
    - role == PRODUCTION_MANAGER: allow (job cost)
    - role == INVENTORY_MANAGER: allow (inventory cost)
    - role == BUYER: allow (PO cost)
    - DEFAULT: deny (no cost visibility)
```

### Data Modification Rules

```yaml
# Rule: Quote Price Override
quote.price.override:
  conditions:
    - role in [EXECUTIVE, CFO]: allow, maxDiscount: 100%
    - role == SALES_DIRECTOR: allow, maxDiscount: 25%, requires: manager_approval if > 15%
    - role == DIVISION_DIRECTOR: allow, maxDiscount: 20%
    - role == BRANCH_MANAGER: allow, maxDiscount: 15%
    - role == SALES_REP: allow, maxDiscount: 5%, requires: manager_approval if > 2%
    - DEFAULT: deny

# Rule: Inventory Adjustment
inv.adjust:
  conditions:
    - role == EXECUTIVE: allow, maxValue: unlimited
    - role == INVENTORY_MANAGER: allow, maxValue: $50,000, requires: approval if > $10,000
    - role == BRANCH_MANAGER: allow, maxValue: $10,000, requires: approval if > $5,000
    - role == RECEIVING_CLERK: allow, maxValue: $2,000, requires: approval if > $500
    - DEFAULT: deny

# Rule: Order Promise Date Change
order.promise.override:
  conditions:
    - role in [EXECUTIVE, COO]: allow
    - role == OPS_MANAGER: allow where order.locationId IN user.locationIds
    - role == PRODUCTION_MANAGER: allow, requires: customer_notification
    - role == SCHEDULER: deny (must go through manager)
    - role == SALES_*: deny (cannot unilaterally change promise)
    - DEFAULT: deny
```

### Temporal Rules

```yaml
# Rule: After-Hours Access
time.after_hours:
  definition: outside 6:00 AM - 10:00 PM local time
  conditions:
    - role in [SUPER_ADMIN, TENANT_OWNER]: allow
    - role == OPERATOR_*: allow (shop floor 24/7)
    - role == SHIPPING_COORDINATOR: allow (dock hours vary)
    - role == SUPPORT_AGENT: allow (on-call support)
    - DEFAULT: require MFA re-verification

# Rule: Weekend Access
time.weekend:
  conditions:
    - role in [EXECUTIVE, SUPER_ADMIN]: allow
    - role == OPERATOR_*: allow
    - DEFAULT: log access, allow if MFA verified in last 1 hour

# Rule: Quote Expiration
quote.accept:
  conditions:
    - quote.expirationDate >= now(): allow
    - quote.expirationDate < now() AND days_expired <= 7: allow, requires: sales_approval
    - quote.expirationDate < now() AND days_expired > 7: deny, must_requote
```

### Environmental Rules

```yaml
# Rule: IP Restriction
access.ip_restriction:
  conditions:
    - user.ip IN tenant.allowedIpRanges: allow
    - role in [EXECUTIVE, SALES_*]: allow (field access permitted)
    - role == OPERATOR_*: deny if not on plant network
    - DEFAULT: require MFA step-up

# Rule: Device Trust
access.device:
  conditions:
    - device.trusted == true: allow
    - device.trusted == false AND role in [SUPER_ADMIN, INTEGRATION_ADMIN]: deny
    - device.trusted == false: allow with limited session (4 hours)

# Rule: Geofencing (for mobile)
access.geofence:
  conditions:
    - role == OPERATOR_*: require within plant geofence
    - role == MATERIAL_HANDLER: require within plant geofence
    - role == SHIPPING_COORDINATOR: allow anywhere (driver handoff)
    - DEFAULT: allow anywhere
```

---

## ABAC Implementation

### Policy Evaluation Engine

```typescript
interface PolicyContext {
  user: {
    id: string;
    tenantId: string;
    roles: string[];
    locationIds: string[];
    divisionIds: string[];
    assignedAccountIds: string[];
    attributes: Record<string, any>;
  };
  resource: {
    type: string;
    id: string;
    tenantId: string;
    locationId?: string;
    divisionId?: string;
    customerId?: string;
    createdById?: string;
    attributes: Record<string, any>;
  };
  action: string;
  environment: {
    timestamp: Date;
    ipAddress: string;
    deviceId?: string;
    deviceTrusted: boolean;
    geoLocation?: { lat: number; lng: number };
  };
}

interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  conditions?: string[];
  requiresApproval?: boolean;
  approverRole?: string;
  auditLevel: 'none' | 'standard' | 'elevated';
}
```

### Scope Filter Generator

```typescript
// Automatically applies WHERE clauses based on user context
function generateScopeFilter(user: User, resource: string): PrismaWhereClause {
  const filters: any = {
    tenantId: user.tenantId  // ALWAYS applied
  };

  // Location scoping
  if (!user.hasPermission(`${resource}.viewAll`)) {
    if (user.locationIds.length > 0) {
      filters.locationId = { in: user.locationIds };
    }
  }

  // Division scoping
  if (!user.hasPermission(`${resource}.viewAllDivisions`)) {
    if (user.divisionIds.length > 0) {
      filters.divisionId = { in: user.divisionIds };
    }
  }

  // Customer scoping (for sales roles)
  if (user.hasRole(['SALES_REP']) && !user.hasPermission('crm.viewAll')) {
    filters.OR = [
      { customerId: { in: user.assignedAccountIds } },
      { createdById: user.id }
    ];
  }

  return filters;
}
```

---

# F) APPROVAL AUTHORITIES

## Approval Workflow Matrix

### Financial Approvals

| Action | Threshold | Approver 1 | Approver 2 | Escalation |
|--------|-----------|------------|------------|------------|
| Quote discount > 5% | $0 - $5,000 | SALES_DIRECTOR | - | - |
| Quote discount > 5% | $5,001 - $25,000 | DIVISION_DIRECTOR | - | CFO |
| Quote discount > 5% | > $25,000 | CFO | CEO (if > $100K) | - |
| Quote margin override | Any | SALES_DIRECTOR | CFO (if < 10% margin) | - |
| Credit limit increase | ≤ $50,000 | CREDIT_MANAGER | - | CFO |
| Credit limit increase | > $50,000 | CFO | CEO (if > $250K) | - |
| Invoice write-off | ≤ $5,000 | CREDIT_MANAGER | - | CFO |
| Invoice write-off | > $5,000 | CFO | - | - |
| Credit memo | ≤ $10,000 | BRANCH_MANAGER | - | CFO |
| Credit memo | > $10,000 | CFO | - | - |

### Inventory Approvals

| Action | Threshold | Approver 1 | Approver 2 | Escalation |
|--------|-----------|------------|------------|------------|
| Inventory adjustment | ≤ $500 | Self (auto-approved) | - | - |
| Inventory adjustment | $501 - $2,000 | INVENTORY_MANAGER | - | OPS_MANAGER |
| Inventory adjustment | $2,001 - $10,000 | OPS_MANAGER | - | COO |
| Inventory adjustment | > $10,000 | COO | CFO | - |
| Scrap disposition | ≤ $1,000 | QC_INSPECTOR | - | - |
| Scrap disposition | > $1,000 | OPS_MANAGER | - | - |
| Inventory transfer | Same division | INVENTORY_MANAGER | - | - |
| Inventory transfer | Cross division | DIVISION_DIRECTOR (both) | - | COO |

### Production Approvals

| Action | Threshold | Approver 1 | Approver 2 | Escalation |
|--------|-----------|------------|------------|------------|
| Job rework | ≤ 4 hours | WORKCENTER_LEAD | - | - |
| Job rework | > 4 hours | PRODUCTION_MANAGER | - | OPS_MANAGER |
| QC hold override | Non-critical | QC_INSPECTOR | - | - |
| QC hold override | Critical/MTR | QC_MANAGER | - | COO |
| Recipe change | Minor | PRODUCTION_MANAGER | - | - |
| Recipe change | Major/safety | OPS_MANAGER | Safety Officer | - |
| Equipment downtime > 4hr | Any | MAINTENANCE_MANAGER | OPS_MANAGER | - |

### Order Approvals

| Action | Approver 1 | Approver 2 | Notes |
|--------|------------|------------|-------|
| Promise date change | OPS_MANAGER | Customer notified | - |
| Order cancellation | SALES_DIRECTOR | - | If value > $50K: CFO |
| Rush order priority | SCHEDULER | OPS_MANAGER | If bumps existing |
| Order hold (credit) | CREDIT_MANAGER | - | Auto-releases when paid |
| Order hold (QC) | QC_MANAGER | - | - |
| Partial shipment | SALES_REP | Customer approval | - |

### User & Access Approvals

| Action | Approver 1 | Approver 2 | Notes |
|--------|------------|------------|-------|
| New user creation | BRANCH_MANAGER | - | HR for employee validation |
| Role assignment | Role owner + manager | - | Separation of duties check |
| Elevated role (Admin) | TENANT_OWNER | CIO | - |
| Break-glass access | SUPER_ADMIN | Incident documented | Time-limited (1hr) |
| API key creation | CIO | Security review | - |
| Integration activation | INTEGRATION_ADMIN | CIO | - |

---

## Approval Workflow States

```typescript
enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

interface ApprovalRequest {
  id: string;
  tenantId: string;
  requestType: string;
  requesterId: string;
  resourceType: string;
  resourceId: string;
  currentApproverId: string;
  approverChain: string[];
  status: ApprovalStatus;
  requestData: Record<string, any>;
  justification: string;
  createdAt: Date;
  expiresAt: Date;
  decisions: ApprovalDecision[];
}

interface ApprovalDecision {
  approverId: string;
  decision: 'approve' | 'reject' | 'escalate';
  comments: string;
  timestamp: Date;
  delegatedFrom?: string;
}
```

---

# G) UI DASHBOARD MAPPING

## Dashboard Components by Role

### Executive Dashboards

#### CEO / President Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTIVE OVERVIEW                                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Revenue MTD     │ Revenue YTD     │ Trend Sparkline             │
│ $2.4M           │ $28.5M          │ ▅▆▇█▇▆▅▄▃▂                  │
├─────────────────┴─────────────────┴─────────────────────────────┤
│ Key Metrics Grid                                                 │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐       │
│ │ Margin %    │ On-Time %   │ Turns/Year  │ Open Orders │       │
│ │ 24.5%       │ 94.2%       │ 8.2         │ 847         │       │
│ └─────────────┴─────────────┴─────────────┴─────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│ Division Performance Comparison Chart                            │
├─────────────────────────────────────────────────────────────────┤
│ Pending Approvals (High Value)                                  │
│ • Quote #Q-2024-1847 - $185K - Discount 18% - [Approve][Reject] │
│ • Credit Limit - ABC Steel - $500K → $750K - [Approve][Reject]  │
├─────────────────────────────────────────────────────────────────┤
│ Alerts & Exceptions                                              │
│ ⚠️ 3 orders at risk of late delivery                            │
│ ⚠️ Inventory value exceeds threshold at Dallas (+$180K)         │
└─────────────────────────────────────────────────────────────────┘
```

**Widgets**: RevenueKPI, MarginKPI, OTDPerformance, TurnsKPI, DivisionComparison, ApprovalQueue, AlertFeed

---

#### CFO Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  FINANCIAL COMMAND CENTER                                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Cash Position   │ AR Outstanding  │ DSO                         │
│ $4.2M           │ $8.7M           │ 42 days                     │
├─────────────────┴─────────────────┴─────────────────────────────┤
│ Margin Analysis by Product Line (Chart)                         │
├─────────────────────────────────────────────────────────────────┤
│ Aging Buckets                                                    │
│ Current: $5.2M | 30d: $2.1M | 60d: $0.9M | 90+: $0.5M           │
├─────────────────────────────────────────────────────────────────┤
│ Inventory Valuation by Location                                  │
├─────────────────────────────────────────────────────────────────┤
│ Financial Approvals Queue                                        │
│ • Write-off: Invoice #INV-8847 - $12,400 - [Review]             │
│ • Credit: DEF Industries - $100K limit - [Review]               │
├─────────────────────────────────────────────────────────────────┤
│ Cost Variance Alerts                                             │
│ ⚠️ Steel Plate +8% vs budget | ⚠️ Freight +12% this week        │
└─────────────────────────────────────────────────────────────────┘
```

**Widgets**: CashPosition, ARSummary, DSOMetric, MarginByProduct, AgingBuckets, InventoryValuation, FinancialApprovals, CostAlerts

---

### Operations Dashboards

#### OPS Manager Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  OPERATIONS COMMAND CENTER                     [Location: All]   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Jobs In Progress│ Due Today       │ Past Due                    │
│ 47              │ 23              │ 4 ⚠️                        │
├─────────────────┴─────────────────┴─────────────────────────────┤
│ Production Board (Gantt View)                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Saw-1  ████████░░░░░░░░░░░░░░░░                                 │
│ Saw-2  ░░░░████████████░░░░░░░░                                 │
│ Shear  ████████████████████░░░░                                 │
├─────────────────────────────────────────────────────────────────┤
│ Work Center Utilization          │ Upcoming Shipments           │
│ Saw: 78% | Shear: 92% | Plasma:  │ 2:00 PM - Truck 1 (8 items)  │
│ 45% | Router: 88%                │ 4:30 PM - Truck 2 (3 items)  │
├─────────────────────────────────────────────────────────────────┤
│ Pending Approvals                │ Quality Holds                │
│ • Rework: Job #J-4421 [Review]   │ • Lot #L-8847 - MTR mismatch │
│ • Adj: -50 pcs Sheet [Review]    │ • Lot #L-8901 - Dimension OOS│
└─────────────────────────────────────────────────────────────────┘
```

**Widgets**: JobCounters, ProductionGantt, WorkCenterUtilization, ShipmentSchedule, OpsApprovals, QualityHolds

---

#### Shop Floor Operator Dashboard (Simplified Touch UI)
```
┌─────────────────────────────────────────────────────────────────┐
│  SAW-1 WORK QUEUE                        👤 John D. | 🕐 2:34 PM │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  CURRENT JOB: #J-4421-OP3                                   │ │
│  │  Customer: ABC Steel Co                                     │ │
│  │  Material: 1/2" A36 Plate (Coil #C-8847)                   │ │
│  │  Cut: 48" x 96" (Qty: 12 of 20)                            │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │   ⏸️ PAUSE   │  │  ✅ COMPLETE │  │  ⚠️ ISSUE   │      │ │
│  │  │              │  │   PIECE      │  │              │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  NEXT UP:                                                        │
│  • #J-4422 - 3/8" HR Plate - Qty 8                              │
│  • #J-4425 - 1" A572-50 - Qty 4                                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [📋 Full Queue]  [📦 Scan Material]  [🔧 Log Downtime]         │
└─────────────────────────────────────────────────────────────────┘
```

**Widgets**: CurrentJobCard (large touch), NextUpQueue, QuickActions

---

### Sales Dashboards

#### Sales Rep Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  MY SALES DASHBOARD                          📅 March 15, 2024   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ MTD Revenue     │ Quota Progress  │ Open Quotes                 │
│ $342,000        │ 68% ████████░░  │ 23 ($1.2M)                  │
├─────────────────┴─────────────────┴─────────────────────────────┤
│ My Pipeline                                                      │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┐            │
│ │ RFQ (8) │Quote(23)│ Pending │Accepted │ Ordered │            │
│ │ $450K   │ $1.2M   │ $380K   │ $220K   │ $890K   │            │
│ └─────────┴─────────┴─────────┴─────────┴─────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ Recent Activity (My Accounts)                                    │
│ • ABC Steel - Quote #Q-4421 viewed (2 min ago)                  │
│ • DEF Fab - Order #O-8847 shipped                               │
│ • GHI Corp - RFQ received (needs response)                      │
├─────────────────────────────────────────────────────────────────┤
│ My Accounts                    │ Available Inventory (Local)     │
│ 12 Active | 3 Overdue AR       │ Coil: 847 tons | Sheet: 234 pcs│
└─────────────────────────────────────────────────────────────────┘
```

**Widgets**: RevenueProgress, QuotaPipeline, ActivityFeed, AccountList, InventorySnapshot

---

### Customer Portal Dashboard

#### Customer Buyer Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  ABC STEEL CO - CUSTOMER PORTAL               Welcome, Jane D.   │
├─────────────────────────────────────────────────────────────────┤
│  Quick Actions                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ 📝 New RFQ  │ │ 📦 Track    │ │ 📄 Order    │ │ 📊 Reports │ │
│  │             │ │ Shipment    │ │ History     │ │            │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Open Orders                                                      │
│ #O-8847 | 12 items | Ship: Mar 18 | Status: In Production       │
│ #O-8901 | 4 items  | Ship: Mar 22 | Status: Scheduled           │
├─────────────────────────────────────────────────────────────────┤
│ Pending Quotes                                                   │
│ #Q-4421 | $24,500 | Expires: Mar 20 | [Accept] [Request Change] │
├─────────────────────────────────────────────────────────────────┤
│ Recent Shipments                                                 │
│ #S-7741 | Delivered Mar 12 | [View BOL] [Download MTRs]         │
└─────────────────────────────────────────────────────────────────┘
```

**Widgets**: QuickActionCards, OpenOrdersList, PendingQuotes, RecentShipments

---

## Widget-to-Permission Mapping

| Widget | Required Permission | Fallback |
|--------|---------------------|----------|
| RevenueKPI | analytics.kpi.view | Hide widget |
| MarginKPI | fin.margin.view | Show "N/A" |
| CostBreakdown | fin.cost.view | Hide widget |
| ApprovalQueue | *.approve | Show count only |
| ProductionGantt | job.view, dispatch.queue.view | Location-filtered |
| InventoryValuation | inv.valuation.view | Hide widget |
| CustomerList | crm.company.view | Assigned only |
| QualityHolds | qc.hold.view | Location-filtered |
| WorkCenterUtilization | floor.*.view | Assigned WC only |
| ARAgingBuckets | fin.ar.view | Hide widget |

---

# H) API ENFORCEMENT PLAN

## Middleware Architecture

### Request Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  API Request                                                     │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. AUTHENTICATION MIDDLEWARE                               │ │
│  │     • Validate JWT token                                    │ │
│  │     • Extract user context                                  │ │
│  │     • Check token expiration                                │ │
│  │     • Verify tenant membership                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  2. TENANT ISOLATION MIDDLEWARE                             │ │
│  │     • Inject tenantId into request context                  │ │
│  │     • Verify resource belongs to tenant                     │ │
│  │     • CRITICAL: Prevents cross-tenant access                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  3. RBAC PERMISSION MIDDLEWARE                              │ │
│  │     • Check role has required permission                    │ │
│  │     • Evaluate permission string (module.resource.action)   │ │
│  │     • Return 403 if denied                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  4. ABAC POLICY MIDDLEWARE                                  │ │
│  │     • Evaluate attribute-based rules                        │ │
│  │     • Check location/division/customer scope                │ │
│  │     • Apply conditional permissions                         │ │
│  │     • Inject scope filters for queries                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  5. AUDIT MIDDLEWARE (Pre-execution)                        │ │
│  │     • Log request details                                   │ │
│  │     • Capture before-state for sensitive ops                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ROUTE HANDLER                                              │ │
│  │     • Execute business logic                                │ │
│  │     • Prisma queries auto-scoped via middleware             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  6. AUDIT MIDDLEWARE (Post-execution)                       │ │
│  │     • Log response status                                   │ │
│  │     • Capture after-state for mutations                     │ │
│  │     • Record execution time                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│      │                                                           │
│      ▼                                                           │
│  API Response                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Decorator Pattern

```typescript
// Route-level permission enforcement
@RequirePermission('quote.create')
@ScopeToLocation()
@AuditLog('quote:create')
async createQuote(req: Request, res: Response) {
  // Handler only executes if permission granted
}

// Multiple permissions (AND logic)
@RequirePermissions(['quote.create', 'quote.price_calculate'])
async createQuoteWithPricing(req: Request, res: Response) { }

// Any permission (OR logic)  
@RequireAnyPermission(['quote.approve', 'quote.reject'])
async reviewQuote(req: Request, res: Response) { }

// Conditional permission based on data
@RequirePermission('order.update')
@ConditionalAccess(async (req, user) => {
  const order = await getOrder(req.params.id);
  return order.locationId === user.homeLocationId || user.hasRole('EXECUTIVE');
})
async updateOrder(req: Request, res: Response) { }
```

---

## Middleware Implementation

### Authentication Middleware
```typescript
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = await verifyJWT(token);
    const user = await getUserWithRoles(decoded.userId);
    
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User inactive or not found' });
    }
    
    // Attach user context to request
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      roles: user.roles.map(r => r.name),
      permissions: await getEffectivePermissions(user),
      locationIds: user.locations.map(l => l.id),
      divisionIds: user.divisions.map(d => d.id),
      assignedAccountIds: user.assignedAccounts?.map(a => a.id) || [],
      homeLocationId: user.homeLocationId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Tenant Isolation Middleware
```typescript
async function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {
  // All database queries MUST include tenant filter
  req.tenantId = req.user.tenantId;
  
  // For routes accessing specific resources, verify tenant ownership
  if (req.params.id) {
    const resourceType = getResourceTypeFromRoute(req.path);
    if (resourceType) {
      const resource = await prisma[resourceType].findUnique({
        where: { id: req.params.id },
        select: { tenantId: true }
      });
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (resource.tenantId !== req.user.tenantId) {
        // Log potential security violation
        await logSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
          userId: req.user.id,
          attemptedTenantId: resource.tenantId,
          resourceType,
          resourceId: req.params.id
        });
        return res.status(404).json({ error: 'Resource not found' });
      }
    }
  }
  
  next();
}
```

### RBAC Permission Middleware
```typescript
function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hasPermission = checkPermission(req.user.permissions, permission);
    
    if (!hasPermission) {
      await logAccessDenied(req.user.id, permission, req.path);
      return res.status(403).json({ 
        error: 'Forbidden',
        required: permission 
      });
    }
    
    next();
  };
}

function checkPermission(userPermissions: string[], required: string): boolean {
  // Check for exact match
  if (userPermissions.includes(required)) return true;
  
  // Check for wildcard (e.g., "quote.*" matches "quote.create")
  const [module, resource, action] = required.split('.');
  if (userPermissions.includes(`${module}.*`)) return true;
  if (userPermissions.includes(`${module}.${resource}.*`)) return true;
  if (userPermissions.includes('*')) return true; // Super admin
  
  return false;
}
```

### ABAC Scope Middleware
```typescript
function scopeToUserContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const scopeFilters: any = { tenantId: user.tenantId };
    
    // Apply location scope if not view-all
    if (!user.permissions.includes('*.viewAll') && user.locationIds.length > 0) {
      scopeFilters.locationId = { in: user.locationIds };
    }
    
    // Apply division scope
    if (!user.permissions.includes('*.viewAllDivisions') && user.divisionIds.length > 0) {
      scopeFilters.divisionId = { in: user.divisionIds };
    }
    
    // Apply customer scope for sales roles
    if (user.roles.some(r => r.startsWith('SALES_'))) {
      if (!user.permissions.includes('crm.viewAll')) {
        scopeFilters.OR = [
          { customerId: { in: user.assignedAccountIds } },
          { createdById: user.id }
        ];
      }
    }
    
    req.scopeFilters = scopeFilters;
    next();
  };
}
```

---

## API Endpoint Permission Matrix

### Quote Endpoints
```
POST   /api/quotes                → quote.create
GET    /api/quotes                → quote.list (scoped)
GET    /api/quotes/:id            → quote.view (scoped)
PUT    /api/quotes/:id            → quote.update (scoped)
DELETE /api/quotes/:id            → quote.delete (scoped)
POST   /api/quotes/:id/lines      → quote.line.add
POST   /api/quotes/:id/send       → quote.send
POST   /api/quotes/:id/approve    → quote.approval.approve
POST   /api/quotes/:id/convert    → quote.convert_to_order
```

### Order Endpoints
```
POST   /api/orders                → order.create
GET    /api/orders                → order.list (scoped)
GET    /api/orders/:id            → order.view (scoped)
PUT    /api/orders/:id            → order.update (scoped)
POST   /api/orders/:id/hold       → order.hold
POST   /api/orders/:id/release    → order.release
POST   /api/orders/:id/allocate   → order.allocate
POST   /api/orders/:id/cancel     → order.cancel
```

### Inventory Endpoints
```
GET    /api/inventory             → inv.stock.list (scoped)
GET    /api/inventory/:id         → inv.item.view (scoped)
POST   /api/inventory/adjust      → inv.adjust (threshold checked)
POST   /api/inventory/transfer    → inv.transfer.request
GET    /api/inventory/valuation   → inv.valuation.view
POST   /api/inventory/bulk-upload → inv.item.create (batch)
```

### Shop Floor Endpoints
```
GET    /api/floor/queue           → floor.queue.view (work center scoped)
GET    /api/floor/operations/:id  → floor.op.view
POST   /api/floor/operations/:id/start    → floor.op.start
POST   /api/floor/operations/:id/complete → floor.op.complete
POST   /api/floor/operations/:id/pause    → floor.op.pause
POST   /api/floor/time            → floor.time.log
POST   /api/floor/downtime        → floor.downtime.start
```

### Admin Endpoints
```
GET    /api/admin/users           → iam.user.list
POST   /api/admin/users           → iam.user.create
PUT    /api/admin/users/:id/roles → iam.role.assign
POST   /api/admin/api-keys        → iam.apikey.create
GET    /api/admin/audit-log       → support.log.view
POST   /api/admin/impersonate     → support.impersonate.start
```

---

# I) AUDIT & SECURITY LOGGING

## Audit Event Categories

### Category 1: Authentication Events
```typescript
interface AuthEvent {
  category: 'AUTH';
  eventType: 
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'TOKEN_REFRESH'
    | 'PASSWORD_CHANGE'
    | 'PASSWORD_RESET_REQUEST'
    | 'MFA_ENABLED'
    | 'MFA_DISABLED'
    | 'MFA_CHALLENGE_SUCCESS'
    | 'MFA_CHALLENGE_FAILED'
    | 'SESSION_TIMEOUT'
    | 'CONCURRENT_SESSION_TERMINATED';
  userId: string;
  ipAddress: string;
  userAgent: string;
  geoLocation?: string;
  timestamp: Date;
}
```

### Category 2: Authorization Events
```typescript
interface AuthzEvent {
  category: 'AUTHZ';
  eventType:
    | 'PERMISSION_GRANTED'
    | 'PERMISSION_DENIED'
    | 'ROLE_ASSIGNED'
    | 'ROLE_REVOKED'
    | 'SCOPE_VIOLATION_ATTEMPT'
    | 'CROSS_TENANT_ATTEMPT'
    | 'IMPERSONATION_START'
    | 'IMPERSONATION_END'
    | 'BREAK_GLASS_ACTIVATED'
    | 'BREAK_GLASS_EXPIRED';
  userId: string;
  targetUserId?: string;
  permission?: string;
  resourceType?: string;
  resourceId?: string;
  denialReason?: string;
  timestamp: Date;
}
```

### Category 3: Data Events
```typescript
interface DataEvent {
  category: 'DATA';
  eventType:
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'EXPORT'
    | 'BULK_IMPORT'
    | 'ARCHIVE'
    | 'RESTORE';
  userId: string;
  resourceType: string;
  resourceId: string;
  fieldChanges?: FieldChange[];
  previousState?: Record<string, any>; // For sensitive ops
  newState?: Record<string, any>;
  recordCount?: number; // For bulk ops
  timestamp: Date;
}

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  masked: boolean; // True for sensitive fields
}
```

### Category 4: Financial Events (Enhanced Audit)
```typescript
interface FinancialEvent {
  category: 'FINANCIAL';
  eventType:
    | 'PRICE_OVERRIDE'
    | 'DISCOUNT_APPLIED'
    | 'MARGIN_OVERRIDE'
    | 'CREDIT_LIMIT_CHANGE'
    | 'PAYMENT_RECORDED'
    | 'INVOICE_VOIDED'
    | 'CREDIT_MEMO_ISSUED'
    | 'WRITE_OFF_APPROVED'
    | 'INVENTORY_ADJUSTMENT';
  userId: string;
  approverId?: string;
  resourceType: string;
  resourceId: string;
  amount?: number;
  percentChange?: number;
  justification: string;
  approvalId?: string;
  timestamp: Date;
}
```

### Category 5: Workflow Events
```typescript
interface WorkflowEvent {
  category: 'WORKFLOW';
  eventType:
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_GRANTED'
    | 'APPROVAL_REJECTED'
    | 'APPROVAL_ESCALATED'
    | 'APPROVAL_EXPIRED'
    | 'STATUS_TRANSITION'
    | 'HOLD_PLACED'
    | 'HOLD_RELEASED'
    | 'PRIORITY_CHANGED';
  userId: string;
  workflowType: string;
  resourceType: string;
  resourceId: string;
  fromState?: string;
  toState?: string;
  comments?: string;
  timestamp: Date;
}
```

### Category 6: System Events
```typescript
interface SystemEvent {
  category: 'SYSTEM';
  eventType:
    | 'CONFIG_CHANGE'
    | 'INTEGRATION_ACTIVATED'
    | 'INTEGRATION_DEACTIVATED'
    | 'API_KEY_CREATED'
    | 'API_KEY_ROTATED'
    | 'API_KEY_REVOKED'
    | 'WEBHOOK_TRIGGERED'
    | 'SYNC_STARTED'
    | 'SYNC_COMPLETED'
    | 'SYNC_FAILED'
    | 'BACKUP_CREATED'
    | 'MAINTENANCE_MODE';
  userId?: string;
  systemId?: string;
  configKey?: string;
  details: Record<string, any>;
  timestamp: Date;
}
```

---

## Audit Log Schema

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  tenantId      String
  category      String   // AUTH, AUTHZ, DATA, FINANCIAL, WORKFLOW, SYSTEM
  eventType     String
  severity      String   // INFO, WARNING, ERROR, CRITICAL
  userId        String?
  targetUserId  String?
  resourceType  String?
  resourceId    String?
  action        String?
  ipAddress     String?
  userAgent     String?
  sessionId     String?
  correlationId String?  // For tracing related events
  requestPath   String?
  requestMethod String?
  responseCode  Int?
  durationMs    Int?
  details       Json?
  fieldChanges  Json?
  previousState Json?
  newState      Json?
  timestamp     DateTime @default(now())
  
  @@index([tenantId, timestamp])
  @@index([tenantId, userId, timestamp])
  @@index([tenantId, resourceType, resourceId])
  @@index([tenantId, category, eventType])
  @@index([correlationId])
}
```

---

## Audit Retention Policy

| Category | Retention | Archive Policy |
|----------|-----------|----------------|
| AUTH | 2 years | Compress after 90 days |
| AUTHZ | 2 years | Compress after 90 days |
| DATA (standard) | 1 year | Compress after 30 days |
| DATA (exports) | 7 years | Required for compliance |
| FINANCIAL | 7 years | Required for SOX/compliance |
| WORKFLOW | 3 years | Compress after 1 year |
| SYSTEM | 1 year | Compress after 30 days |

---

## Real-time Alerts

### Alert Rules
```yaml
# Immediate Security Alerts (Slack/Email)
alerts:
  - name: Multiple Failed Logins
    condition: COUNT(AUTH.LOGIN_FAILED) > 5 IN 5 minutes WHERE userId = same
    action: Lock account, notify security

  - name: Cross-Tenant Access Attempt
    condition: ANY(AUTHZ.CROSS_TENANT_ATTEMPT)
    action: Terminate session, notify security, log incident

  - name: Break-Glass Activation
    condition: ANY(AUTHZ.BREAK_GLASS_ACTIVATED)
    action: Notify all admins, start recording

  - name: Bulk Export
    condition: DATA.EXPORT WHERE recordCount > 1000
    action: Notify data owner, log for review

  - name: Large Financial Adjustment
    condition: FINANCIAL.INVENTORY_ADJUSTMENT WHERE amount > $10,000
    action: Notify CFO

  - name: Off-Hours Admin Activity
    condition: ANY(SYSTEM.*) WHERE hour NOT IN 6-22
    action: Notify security team

  - name: Unusual Data Access Pattern
    condition: COUNT(DATA.READ) > 500 IN 10 minutes WHERE userId = same
    action: Flag for review, potential data scraping
```

---

# J) SEED USERS & ROLE ASSIGNMENTS

## Default Tenant Setup

### Organizations (Tenants)
```json
{
  "tenants": [
    {
      "id": "tenant_steelwise",
      "name": "SteelWise Service Center",
      "code": "STWI",
      "type": "HEADQUARTERS",
      "settings": {
        "timezone": "America/Chicago",
        "currency": "USD",
        "defaultUOM": "LB"
      }
    }
  ]
}
```

### Locations
```json
{
  "locations": [
    {
      "id": "loc_dallas",
      "tenantId": "tenant_steelwise",
      "code": "DAL",
      "name": "Dallas Service Center",
      "address": "1234 Steel Way, Dallas, TX 75201",
      "type": "SERVICE_CENTER",
      "capabilities": ["SAW_CUT", "SHEAR", "PLASMA", "SHIPPING"]
    },
    {
      "id": "loc_houston",
      "tenantId": "tenant_steelwise",
      "code": "HOU",
      "name": "Houston Distribution",
      "address": "5678 Industrial Blvd, Houston, TX 77001",
      "type": "DISTRIBUTION",
      "capabilities": ["SHIPPING", "STORAGE"]
    }
  ]
}
```

### Divisions
```json
{
  "divisions": [
    {
      "id": "div_structural",
      "tenantId": "tenant_steelwise",
      "code": "STR",
      "name": "Structural Products",
      "locationIds": ["loc_dallas", "loc_houston"]
    },
    {
      "id": "div_plate",
      "tenantId": "tenant_steelwise",
      "code": "PLT",
      "name": "Plate Products",
      "locationIds": ["loc_dallas"]
    }
  ]
}
```

---

## Seed Users by Role Category

### Executive Users
```json
{
  "executives": [
    {
      "id": "user_ceo",
      "email": "john.smith@steelwise.com",
      "name": "John Smith",
      "title": "CEO",
      "roles": ["EXECUTIVE"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "divisionIds": ["div_structural", "div_plate"],
      "permissions": ["*"],
      "dashboardOverride": "CEO_DASHBOARD"
    },
    {
      "id": "user_cfo",
      "email": "sarah.johnson@steelwise.com",
      "name": "Sarah Johnson",
      "title": "CFO",
      "roles": ["CFO"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "divisionIds": ["div_structural", "div_plate"],
      "dashboardOverride": "CFO_DASHBOARD"
    },
    {
      "id": "user_coo",
      "email": "mike.williams@steelwise.com",
      "name": "Mike Williams",
      "title": "COO",
      "roles": ["COO"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "divisionIds": ["div_structural", "div_plate"],
      "dashboardOverride": "COO_DASHBOARD"
    }
  ]
}
```

### Branch Management
```json
{
  "branchManagers": [
    {
      "id": "user_dallas_mgr",
      "email": "tom.davis@steelwise.com",
      "name": "Tom Davis",
      "title": "Dallas Branch Manager",
      "roles": ["BRANCH_MANAGER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "divisionIds": ["div_structural", "div_plate"],
      "dashboardOverride": "BRANCH_DASHBOARD"
    },
    {
      "id": "user_houston_mgr",
      "email": "lisa.brown@steelwise.com",
      "name": "Lisa Brown",
      "title": "Houston Branch Manager",
      "roles": ["BRANCH_MANAGER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_houston",
      "locationIds": ["loc_houston"],
      "divisionIds": ["div_structural"]
    }
  ]
}
```

### Sales Team
```json
{
  "salesTeam": [
    {
      "id": "user_sales_dir",
      "email": "rachel.green@steelwise.com",
      "name": "Rachel Green",
      "title": "Sales Director - Structural",
      "roles": ["SALES_DIRECTOR"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "divisionIds": ["div_structural"],
      "maxDiscountPercent": 25
    },
    {
      "id": "user_sales_rep1",
      "email": "david.miller@steelwise.com",
      "name": "David Miller",
      "title": "Account Executive",
      "roles": ["SALES_REP"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "divisionIds": ["div_structural"],
      "assignedAccountIds": ["cust_abc_steel", "cust_def_fab"],
      "maxDiscountPercent": 5
    },
    {
      "id": "user_csr1",
      "email": "emily.jones@steelwise.com",
      "name": "Emily Jones",
      "title": "Customer Service Representative",
      "roles": ["CSR"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "divisionIds": ["div_structural", "div_plate"]
    }
  ]
}
```

### Operations Team
```json
{
  "opsTeam": [
    {
      "id": "user_ops_mgr",
      "email": "chris.taylor@steelwise.com",
      "name": "Chris Taylor",
      "title": "Operations Manager",
      "roles": ["OPS_MANAGER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "divisionIds": ["div_structural", "div_plate"]
    },
    {
      "id": "user_prod_mgr",
      "email": "amanda.white@steelwise.com",
      "name": "Amanda White",
      "title": "Production Manager",
      "roles": ["PRODUCTION_MANAGER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "assignedWorkCenters": ["wc_saw1", "wc_saw2", "wc_shear1"]
    },
    {
      "id": "user_scheduler",
      "email": "kevin.lee@steelwise.com",
      "name": "Kevin Lee",
      "title": "Production Scheduler",
      "roles": ["SCHEDULER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"]
    },
    {
      "id": "user_inv_mgr",
      "email": "maria.garcia@steelwise.com",
      "name": "Maria Garcia",
      "title": "Inventory Manager",
      "roles": ["INVENTORY_MANAGER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "adjustmentLimit": 50000
    }
  ]
}
```

### Shop Floor Team
```json
{
  "shopFloor": [
    {
      "id": "user_wc_lead1",
      "email": "james.wilson@steelwise.com",
      "name": "James Wilson",
      "title": "Saw Department Lead",
      "roles": ["WORKCENTER_LEAD"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "assignedWorkCenters": ["wc_saw1", "wc_saw2"]
    },
    {
      "id": "user_operator1",
      "email": "robert.martinez@steelwise.com",
      "name": "Robert Martinez",
      "title": "Saw Operator",
      "roles": ["OPERATOR_SAW"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "assignedWorkCenters": ["wc_saw1"],
      "badgeNumber": "EMP-1001"
    },
    {
      "id": "user_operator2",
      "email": "jose.hernandez@steelwise.com",
      "name": "Jose Hernandez",
      "title": "Shear Operator",
      "roles": ["OPERATOR_SHEAR"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "assignedWorkCenters": ["wc_shear1"],
      "badgeNumber": "EMP-1002"
    },
    {
      "id": "user_handler1",
      "email": "carlos.rodriguez@steelwise.com",
      "name": "Carlos Rodriguez",
      "title": "Material Handler",
      "roles": ["MATERIAL_HANDLER"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "badgeNumber": "EMP-1003"
    }
  ]
}
```

### Quality & Shipping
```json
{
  "qualityShipping": [
    {
      "id": "user_qc_inspector",
      "email": "patricia.clark@steelwise.com",
      "name": "Patricia Clark",
      "title": "QC Inspector",
      "roles": ["QC_INSPECTOR"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"],
      "certifications": ["AWS_CWI", "ASNT_NDT"]
    },
    {
      "id": "user_shipping_coord",
      "email": "michael.anderson@steelwise.com",
      "name": "Michael Anderson",
      "title": "Shipping Coordinator",
      "roles": ["SHIPPING_COORDINATOR"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"]
    },
    {
      "id": "user_receiving",
      "email": "jennifer.thomas@steelwise.com",
      "name": "Jennifer Thomas",
      "title": "Receiving Clerk",
      "roles": ["RECEIVING_CLERK"],
      "tenantId": "tenant_steelwise",
      "homeLocationId": "loc_dallas",
      "locationIds": ["loc_dallas"]
    }
  ]
}
```

### IT & Admin
```json
{
  "itAdmin": [
    {
      "id": "user_super_admin",
      "email": "admin@steelwise.com",
      "name": "System Administrator",
      "title": "IT Administrator",
      "roles": ["SUPER_ADMIN"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "divisionIds": ["div_structural", "div_plate"],
      "mfaRequired": true
    },
    {
      "id": "user_int_admin",
      "email": "integrations@steelwise.com",
      "name": "Integration Admin",
      "title": "Integration Specialist",
      "roles": ["INTEGRATION_ADMIN"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "apiKeyAccess": true
    },
    {
      "id": "user_analyst",
      "email": "analyst@steelwise.com",
      "name": "Data Analyst",
      "title": "Business Analyst",
      "roles": ["DATA_ANALYST"],
      "tenantId": "tenant_steelwise",
      "locationIds": ["loc_dallas", "loc_houston"],
      "divisionIds": ["div_structural", "div_plate"]
    }
  ]
}
```

### External Portal Users
```json
{
  "externalUsers": [
    {
      "id": "user_cust_admin",
      "email": "purchasing@abcsteel.com",
      "name": "Jane Cooper",
      "title": "Purchasing Manager",
      "roles": ["CUSTOMER_ADMIN"],
      "tenantId": "tenant_steelwise",
      "customerId": "cust_abc_steel",
      "portalAccess": true
    },
    {
      "id": "user_cust_buyer",
      "email": "buyer@abcsteel.com",
      "name": "Bob Thompson",
      "title": "Buyer",
      "roles": ["CUSTOMER_BUYER"],
      "tenantId": "tenant_steelwise",
      "customerId": "cust_abc_steel",
      "portalAccess": true
    },
    {
      "id": "user_carrier",
      "email": "dispatch@rapidfreight.com",
      "name": "Rapid Freight Dispatch",
      "title": "Carrier User",
      "roles": ["CARRIER_USER"],
      "tenantId": "tenant_steelwise",
      "carrierId": "carrier_rapid",
      "portalAccess": true
    }
  ]
}
```

---

## Role-to-Permission Seed Script

```typescript
// prisma/seed-permissions.ts
const rolePermissions = {
  SUPER_ADMIN: ['*'],
  
  TENANT_OWNER: [
    'iam.*', 'tenant.*', 'crm.*', 'rfq.*', 'quote.*', 'order.*',
    'inv.*', 'po.*', 'recv.*', 'bom.*', 'job.*', 'dispatch.*',
    'floor.*', 'qc.*', 'pack.*', 'ship.*', 'fin.*', 'analytics.*',
    'sim.*', 'int.*', 'master.*', 'trace.*', 'support.*'
  ],
  
  EXECUTIVE: [
    '*.view', '*.list', '*.export',
    'analytics.*', 'sim.*',
    'quote.approval.approve', 'quote.approval.reject',
    'order.hold', 'order.release',
    'inv.adjust.approve'
  ],
  
  CFO: [
    'fin.*',
    'quote.margin.view', 'quote.margin.override', 'quote.discount.override',
    'quote.approval.approve', 'quote.approval.reject',
    'order.view', 'order.list',
    'inv.valuation.view', 'inv.adjust.approve',
    'analytics.*', 'sim.forecast.*',
    'crm.company.credit_limit.view', 'crm.company.credit_limit.update'
  ],
  
  COO: [
    'job.view', 'job.list', 'dispatch.view', 'dispatch.list',
    'floor.view', 'floor.list', 'bom.view', 'bom.list',
    'inv.view', 'inv.list', 'qc.view', 'qc.list',
    'analytics.*',
    'order.promise.override', 'qc.hold.override', 'ship.carrier.override'
  ],
  
  BRANCH_MANAGER: [
    'crm.*', 'rfq.*', 'quote.*',
    'order.*',
    'inv.*',
    'job.*', 'dispatch.*',
    'floor.view', 'floor.list', 'floor.time.approve',
    'qc.*', 'pack.*', 'ship.*', 'recv.*',
    'analytics.*',
    'iam.user.view', 'iam.user.list'
  ],
  
  SALES_REP: [
    'crm.contact.view', 'crm.contact.list', 'crm.contact.create', 'crm.contact.update',
    'crm.note.create', 'crm.note.view',
    'rfq.view', 'rfq.list', 'rfq.create', 'rfq.update', 'rfq.convert_to_quote',
    'quote.view', 'quote.list', 'quote.create', 'quote.update',
    'quote.line.add', 'quote.line.update', 'quote.line.remove',
    'quote.send', 'quote.clone', 'quote.accept',
    'order.view', 'order.list', 'order.create', 'order.notes.add',
    'inv.view', 'inv.list'
  ],
  
  OPERATOR_SAW: [
    'floor.op.view', 'floor.op.list',
    'floor.op.start', 'floor.op.pause', 'floor.op.resume', 'floor.op.complete',
    'floor.time.log',
    'floor.downtime.start', 'floor.downtime.end', 'floor.downtime.reason',
    'floor.scan.rfid', 'floor.scan.barcode',
    'floor.output.record', 'floor.defect.record',
    'floor.queue.view',
    'job.view'
  ],
  
  // ... Additional role mappings
};

async function seedRolePermissions() {
  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { permissions },
      create: {
        name: roleName,
        permissions,
        description: `${roleName} role with standard permissions`
      }
    });
    console.log(`Seeded role: ${role.name}`);
  }
}
```

---

# END OF DOCUMENT

**Document Version**: 1.0  
**Last Updated**: 2024-03-15  
**Author**: AI Architecture Assistant  
**Status**: DRAFT - Pending Review

---

## Appendix: Quick Reference

### Common Permission Patterns
```
module.resource.action     → Specific permission
module.resource.*          → All actions on resource
module.*                   → All permissions in module
*                          → Super admin (all permissions)
```

### Scope Hierarchy
```
Tenant → Division → Location → Work Center → User
         └── Customer (for sales roles)
```

### Audit Levels
```
Level 1: Standard (all CRUD ops)
Level 2: Enhanced (financial, pricing, adjustments)
Level 3: Critical (auth, config, exports, admin actions)
```
