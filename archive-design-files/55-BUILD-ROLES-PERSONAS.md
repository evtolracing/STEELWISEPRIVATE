# 55 — Build Roles & Personas

> **Purpose:** Structured role and persona definitions for UI generation and permission systems.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. roles

```json
[
  {
    "id": "CSR",
    "label": "Customer Service Representative / Inside Sales",
    "description": "Primary customer-facing role handling quotes, orders, inquiries, and account management from office",
    "primary_apps": ["order_intake", "analytics"],
    "responsibilities": [
      "Process inbound customer inquiries via phone, email, chat",
      "Create and follow up on quotes",
      "Enter and manage sales orders",
      "Check inventory availability across locations",
      "Provide order status updates to customers",
      "Manage customer account information",
      "Handle pricing inquiries and apply discounts within limits",
      "Coordinate with planning on delivery dates",
      "Process RMAs and credits"
    ],
    "key_actions": [
      "quote.create",
      "quote.edit",
      "quote.send",
      "order.create",
      "order.edit",
      "order.cancel",
      "inventory.search",
      "inventory.check_atp",
      "customer.view",
      "customer.edit",
      "pricing.lookup",
      "pricing.apply_discount",
      "shipment.track",
      "rma.create"
    ],
    "KPIs": [
      "Quotes created per day",
      "Quote-to-order conversion rate",
      "Average response time to inquiry",
      "Order entry accuracy rate",
      "Customer satisfaction score",
      "Revenue per CSR"
    ],
    "constraints": [
      "Cannot approve discounts above 10% without manager",
      "Cannot override credit holds",
      "Cannot modify shipped orders",
      "Cannot access other reps' commission data"
    ],
    "tools_today": [
      "Legacy ERP green screen",
      "Excel for pricing",
      "Email client",
      "Phone system with CRM popup",
      "Paper quote forms"
    ]
  },
  {
    "id": "PLANNER",
    "label": "Production Planner / Scheduler",
    "description": "Manages production schedule, capacity allocation, and work order sequencing across work centers",
    "primary_apps": ["planning", "analytics"],
    "responsibilities": [
      "Create and schedule work orders",
      "Balance capacity across work centers",
      "Prioritize and sequence jobs",
      "Coordinate material availability with purchasing",
      "Manage rush orders and expedites",
      "Communicate delivery dates to sales",
      "Monitor production progress",
      "Identify and resolve scheduling conflicts",
      "Plan for maintenance windows"
    ],
    "key_actions": [
      "work_order.create",
      "work_order.schedule",
      "work_order.prioritize",
      "work_order.release",
      "work_order.reschedule",
      "capacity.view",
      "capacity.simulate",
      "schedule.optimize",
      "schedule.publish",
      "promise_date.calculate",
      "promise_date.override"
    ],
    "KPIs": [
      "Schedule adherence rate",
      "On-time completion rate",
      "Capacity utilization percentage",
      "Setup time ratio",
      "Rush order percentage",
      "Work order cycle time"
    ],
    "constraints": [
      "Cannot release work orders without material allocated",
      "Cannot schedule beyond capacity without flagging",
      "Cannot change customer promise date without sales approval",
      "Limited to assigned work centers/locations"
    ],
    "tools_today": [
      "Whiteboard scheduling",
      "Excel Gantt charts",
      "Legacy ERP work order module",
      "Email for coordination",
      "Printed job packets"
    ]
  },
  {
    "id": "OPERATOR",
    "label": "Machine Operator / Shop Floor Worker",
    "description": "Executes production operations on equipment, records labor and output, performs quality checks",
    "primary_apps": ["shop_floor"],
    "responsibilities": [
      "Clock in/out of work orders and operations",
      "Execute processing steps per routing",
      "Record quantities produced and scrapped",
      "Perform first-piece and in-process inspections",
      "Document scrap reasons",
      "Report equipment issues",
      "Request material moves",
      "Follow safety protocols"
    ],
    "key_actions": [
      "operation.start",
      "operation.pause",
      "operation.complete",
      "operation.record_output",
      "operation.record_scrap",
      "quality.record_check",
      "quality.flag_issue",
      "equipment.report_issue",
      "material.request_move",
      "labor.clock_in",
      "labor.clock_out"
    ],
    "KPIs": [
      "Units produced per hour",
      "First-pass yield rate",
      "Scrap percentage",
      "Setup time vs standard",
      "Downtime percentage",
      "Labor efficiency ratio"
    ],
    "constraints": [
      "Cannot modify work order routing",
      "Cannot adjust standard times",
      "Cannot skip required quality checks",
      "Cannot access other operators' labor records",
      "Cannot view pricing or customer information"
    ],
    "tools_today": [
      "Paper job travelers",
      "Time clock punch cards",
      "Whiteboard for queue",
      "Printed work instructions",
      "Handheld calipers/gauges"
    ]
  },
  {
    "id": "SHIPPING",
    "label": "Shipping & Receiving Clerk",
    "description": "Manages inbound receiving, outbound shipping, carrier coordination, and dock operations",
    "primary_apps": ["shipping", "shop_floor"],
    "responsibilities": [
      "Receive and inspect inbound material",
      "Verify weights and quantities",
      "Collect MTRs and COAs from suppliers",
      "Create putaway assignments",
      "Stage material for shipment",
      "Generate BOLs and packing lists",
      "Coordinate carrier pickups",
      "Load trucks and verify shipments",
      "Process will-call pickups",
      "Handle returns and RMAs"
    ],
    "key_actions": [
      "receipt.create",
      "receipt.inspect",
      "receipt.complete",
      "receipt.putaway",
      "shipment.stage",
      "shipment.create_bol",
      "shipment.print_labels",
      "shipment.confirm",
      "shipment.load",
      "carrier.schedule",
      "carrier.track",
      "willcall.process",
      "rma.receive"
    ],
    "KPIs": [
      "Receiving turnaround time",
      "Shipping accuracy rate",
      "On-time shipment rate",
      "Will-call wait time",
      "Carrier on-time pickup rate",
      "Dock utilization"
    ],
    "constraints": [
      "Cannot ship orders on credit hold",
      "Cannot ship without required documentation",
      "Cannot modify order quantities",
      "Cannot approve freight charges above threshold",
      "Must verify weight within 2% tolerance"
    ],
    "tools_today": [
      "Legacy shipping module",
      "Carrier websites for BOL",
      "Floor scale for weights",
      "Paper pick tickets",
      "Email for carrier coordination",
      "Printed packing lists"
    ]
  },
  {
    "id": "RETAIL_COUNTER",
    "label": "Retail Counter / Will-Call Attendant",
    "description": "Serves walk-in customers at retail counter with cash/card sales and will-call pickups",
    "primary_apps": ["retail_pos", "order_intake"],
    "responsibilities": [
      "Assist walk-in customers with product selection",
      "Process cash, credit, and account sales",
      "Handle will-call order pickups",
      "Cut small quantities from stock",
      "Provide pricing and availability",
      "Manage cash drawer and end-of-day closeout",
      "Handle returns and exchanges",
      "Maintain retail display area"
    ],
    "key_actions": [
      "pos.new_transaction",
      "pos.add_item",
      "pos.apply_payment",
      "pos.complete_sale",
      "pos.void_transaction",
      "pos.return",
      "pos.drawer_count",
      "willcall.lookup",
      "willcall.release",
      "inventory.check_local",
      "cut_ticket.create"
    ],
    "KPIs": [
      "Transactions per hour",
      "Average transaction value",
      "Customer wait time",
      "Drawer accuracy",
      "Retail revenue per day",
      "Return rate"
    ],
    "constraints": [
      "Cannot process returns above $500 without manager",
      "Cannot apply discounts above 5%",
      "Cannot access customer account details beyond balance",
      "Cannot modify scheduled orders",
      "Cash drawer limits apply"
    ],
    "tools_today": [
      "Basic POS terminal",
      "Cash drawer",
      "Card reader",
      "Barcode scanner",
      "Receipt printer",
      "Inventory lookup on legacy system"
    ]
  },
  {
    "id": "CUSTOMER_PORTAL",
    "label": "Customer Portal User",
    "description": "External customer accessing self-service portal for orders, quotes, and account management",
    "primary_apps": ["portal"],
    "responsibilities": [
      "Search product catalog and availability",
      "Request quotes for custom requirements",
      "Enter and manage orders",
      "Track order and shipment status",
      "Download invoices and statements",
      "Access MTRs and certifications",
      "Manage user access for their organization",
      "View order history and reorder"
    ],
    "key_actions": [
      "catalog.search",
      "catalog.view_specs",
      "rfq.create",
      "rfq.view",
      "order.create",
      "order.view",
      "order.reorder",
      "shipment.track",
      "invoice.view",
      "invoice.download",
      "document.download_mtr",
      "account.view_balance",
      "user.manage_contacts"
    ],
    "KPIs": [
      "Portal adoption rate",
      "Self-service order percentage",
      "Customer satisfaction score",
      "Repeat order rate",
      "Time spent on portal"
    ],
    "constraints": [
      "Can only see own company's data",
      "Cannot see cost/margin information",
      "Cannot modify shipped orders",
      "Order limits may apply per customer agreement",
      "Approval workflows may be required by customer"
    ],
    "tools_today": [
      "Phone calls to CSR",
      "Email orders",
      "Fax for some customers",
      "EDI for large accounts",
      "Competitor portals"
    ]
  },
  {
    "id": "BRANCH_MANAGER",
    "label": "Branch / Location Manager",
    "description": "Oversees all operations at single service center location with P&L responsibility",
    "primary_apps": ["analytics", "planning", "order_intake", "admin"],
    "responsibilities": [
      "Manage location P&L",
      "Oversee sales, operations, and shipping teams",
      "Approve pricing exceptions and discounts",
      "Manage staffing and schedules",
      "Handle customer escalations",
      "Ensure safety and compliance",
      "Coordinate with corporate",
      "Drive local business development",
      "Manage capital equipment and maintenance"
    ],
    "key_actions": [
      "pricing.approve_exception",
      "credit.override_hold",
      "order.approve_rush",
      "analytics.view_location",
      "analytics.view_team",
      "user.manage_location",
      "report.run_operations",
      "report.run_financials",
      "schedule.approve_overtime",
      "inventory.approve_adjustment"
    ],
    "KPIs": [
      "Location revenue vs target",
      "Gross margin percentage",
      "Operating expense ratio",
      "On-time delivery rate",
      "Customer satisfaction score",
      "Employee turnover rate",
      "Safety incident rate"
    ],
    "constraints": [
      "Cannot access other locations' detailed data",
      "Cannot approve discounts above 20% without division approval",
      "Cannot modify corporate pricing policies",
      "Cannot hire above headcount budget without approval"
    ],
    "tools_today": [
      "Excel reports from ERP",
      "Email for approvals",
      "Meetings for coordination",
      "Phone for escalations",
      "Paper forms for HR/safety"
    ]
  },
  {
    "id": "DIVISION_MANAGER",
    "label": "Division / Regional Manager",
    "description": "Manages multiple locations with responsibility for regional P&L and strategic initiatives",
    "primary_apps": ["analytics", "admin"],
    "responsibilities": [
      "Oversee multiple branch locations",
      "Drive regional sales strategy",
      "Manage division P&L",
      "Allocate capital across locations",
      "Develop branch managers",
      "Coordinate cross-location inventory",
      "Report to executive leadership",
      "Lead strategic initiatives"
    ],
    "key_actions": [
      "analytics.view_division",
      "analytics.compare_locations",
      "pricing.set_regional_policy",
      "pricing.approve_exception_large",
      "inventory.approve_transfer",
      "report.run_division",
      "budget.manage",
      "user.manage_division"
    ],
    "KPIs": [
      "Division revenue vs target",
      "Division gross margin",
      "Division market share",
      "Cross-sell revenue",
      "Inventory turns by location",
      "Branch manager performance"
    ],
    "constraints": [
      "Cannot access other divisions' data",
      "Cannot change corporate policies",
      "Budget approval required for major investments",
      "Cannot override HR policies"
    ],
    "tools_today": [
      "BI tool (limited)",
      "Excel consolidation",
      "Monthly review meetings",
      "Phone/email coordination",
      "Travel to locations"
    ]
  },
  {
    "id": "FINANCE",
    "label": "Finance / Accounting",
    "description": "Manages AR, AP, credit, costing, and financial reporting across the organization",
    "primary_apps": ["analytics", "admin", "order_intake"],
    "responsibilities": [
      "Process customer invoices",
      "Manage accounts receivable",
      "Process supplier invoices",
      "Manage accounts payable",
      "Set and monitor credit limits",
      "Manage credit holds",
      "Reconcile inventory valuation",
      "Prepare financial reports",
      "Handle tax compliance",
      "Manage banking and cash"
    ],
    "key_actions": [
      "invoice.create",
      "invoice.void",
      "payment.apply",
      "payment.process",
      "credit.set_limit",
      "credit.place_hold",
      "credit.release_hold",
      "report.run_financial",
      "report.run_aging",
      "costing.review",
      "journal.create",
      "reconciliation.perform"
    ],
    "KPIs": [
      "Days sales outstanding (DSO)",
      "Days payable outstanding (DPO)",
      "Bad debt percentage",
      "Invoice accuracy rate",
      "Month-end close time",
      "Audit findings"
    ],
    "constraints": [
      "Cannot modify sales orders",
      "Cannot access operational systems directly",
      "Segregation of duties for payments",
      "Audit trail required for all changes"
    ],
    "tools_today": [
      "Legacy ERP finance module",
      "Excel for analysis",
      "Bank portals",
      "Tax software",
      "Paper checks"
    ]
  },
  {
    "id": "ADMIN",
    "label": "System Administrator",
    "description": "Manages system configuration, user access, integrations, and technical operations",
    "primary_apps": ["admin"],
    "responsibilities": [
      "Provision and manage users",
      "Assign roles and permissions",
      "Configure system settings",
      "Manage integrations (ERP, EDI, carriers)",
      "Monitor system health",
      "Handle data imports/exports",
      "Manage tenant configuration",
      "Support end users",
      "Maintain audit logs"
    ],
    "key_actions": [
      "user.create",
      "user.edit",
      "user.deactivate",
      "role.assign",
      "permission.configure",
      "integration.configure",
      "integration.monitor",
      "config.edit_system",
      "config.edit_tenant",
      "audit.view_logs",
      "data.import",
      "data.export"
    ],
    "KPIs": [
      "System uptime percentage",
      "User provisioning time",
      "Support ticket resolution time",
      "Integration success rate",
      "Security incident count"
    ],
    "constraints": [
      "Cannot view business transaction data beyond troubleshooting",
      "Cannot process financial transactions",
      "Must document all configuration changes",
      "Cannot delete audit logs"
    ],
    "tools_today": [
      "ERP admin console",
      "Active Directory",
      "VPN management",
      "Email for tickets",
      "Spreadsheets for user lists"
    ]
  },
  {
    "id": "QA_MANAGER",
    "label": "Quality Assurance Manager",
    "description": "Oversees quality system, certifications, NCR management, and supplier quality",
    "primary_apps": ["shop_floor", "analytics", "admin"],
    "responsibilities": [
      "Manage quality inspection processes",
      "Review and disposition NCRs",
      "Maintain quality certifications (ISO, AS9100)",
      "Manage calibration schedules",
      "Conduct supplier audits",
      "Analyze quality trends",
      "Train staff on quality procedures",
      "Handle customer quality complaints"
    ],
    "key_actions": [
      "ncr.create",
      "ncr.disposition",
      "ncr.close",
      "inspection.configure",
      "inspection.review",
      "calibration.schedule",
      "calibration.record",
      "supplier.audit",
      "supplier.rate",
      "report.run_quality",
      "certificate.manage"
    ],
    "KPIs": [
      "First-pass yield rate",
      "NCR count and trend",
      "Customer complaint rate",
      "Supplier quality score",
      "Calibration compliance rate",
      "Audit finding count"
    ],
    "constraints": [
      "Cannot release material without proper inspection",
      "Cannot modify test results after approval",
      "Cannot skip certification requirements",
      "Audit trail required for dispositions"
    ],
    "tools_today": [
      "Paper NCR forms",
      "Excel for tracking",
      "Calibration stickers",
      "Filing cabinets for certs",
      "Email for communication"
    ]
  },
  {
    "id": "PURCHASING",
    "label": "Purchasing Agent / Buyer",
    "description": "Sources material, manages supplier relationships, and executes replenishment",
    "primary_apps": ["order_intake", "planning", "analytics"],
    "responsibilities": [
      "Create and manage purchase orders",
      "Negotiate pricing and terms with suppliers",
      "Evaluate and qualify suppliers",
      "Monitor supplier performance",
      "Manage inventory replenishment",
      "Handle expedites for shortages",
      "Process supplier claims",
      "Track commodity pricing trends"
    ],
    "key_actions": [
      "po.create",
      "po.edit",
      "po.send",
      "po.cancel",
      "po.expedite",
      "supplier.create",
      "supplier.edit",
      "supplier.evaluate",
      "pricing.update_cost",
      "inventory.review_reorder",
      "claim.create",
      "report.run_purchasing"
    ],
    "KPIs": [
      "Purchase price variance",
      "Supplier on-time delivery rate",
      "Supplier quality rate",
      "Inventory turns",
      "Stock-out frequency",
      "Cost savings achieved"
    ],
    "constraints": [
      "Cannot approve POs above authority limit",
      "Cannot add unapproved suppliers",
      "Cannot change payment terms without finance approval",
      "Must follow approved supplier list"
    ],
    "tools_today": [
      "Legacy ERP purchasing",
      "Supplier websites/portals",
      "Email for quotes",
      "Excel for price tracking",
      "Phone for negotiations"
    ]
  }
]
```

---

## 2. handoff_graph

```json
{
  "CSR": [
    "PLANNER",
    "SHIPPING",
    "FINANCE",
    "BRANCH_MANAGER",
    "PURCHASING"
  ],
  "PLANNER": [
    "OPERATOR",
    "SHIPPING",
    "CSR",
    "PURCHASING"
  ],
  "OPERATOR": [
    "PLANNER",
    "SHIPPING",
    "QA_MANAGER"
  ],
  "SHIPPING": [
    "CSR",
    "OPERATOR",
    "RETAIL_COUNTER",
    "FINANCE"
  ],
  "RETAIL_COUNTER": [
    "SHIPPING",
    "CSR",
    "BRANCH_MANAGER"
  ],
  "CUSTOMER_PORTAL": [
    "CSR"
  ],
  "BRANCH_MANAGER": [
    "CSR",
    "PLANNER",
    "SHIPPING",
    "DIVISION_MANAGER",
    "FINANCE"
  ],
  "DIVISION_MANAGER": [
    "BRANCH_MANAGER",
    "FINANCE",
    "ADMIN"
  ],
  "FINANCE": [
    "CSR",
    "BRANCH_MANAGER",
    "ADMIN"
  ],
  "ADMIN": [
    "BRANCH_MANAGER",
    "DIVISION_MANAGER"
  ],
  "QA_MANAGER": [
    "OPERATOR",
    "PLANNER",
    "SHIPPING",
    "PURCHASING"
  ],
  "PURCHASING": [
    "CSR",
    "PLANNER",
    "FINANCE",
    "QA_MANAGER"
  ]
}
```

---

## 3. persona_requirements_matrix

| Role | order_intake | planning | shop_floor | shipping | retail_pos | portal | analytics | admin |
|------|--------------|----------|------------|----------|------------|--------|-----------|-------|
| CSR | **own** | read | none | read | none | none | read | none |
| PLANNER | read | **own** | read | read | none | none | read | none |
| OPERATOR | none | read | **own** | none | none | none | none | none |
| SHIPPING | read | read | read | **own** | none | none | read | none |
| RETAIL_COUNTER | write | none | none | read | **own** | none | none | none |
| CUSTOMER_PORTAL | none | none | none | none | none | **own** | none | none |
| BRANCH_MANAGER | write | write | read | read | read | none | **own** | write |
| DIVISION_MANAGER | read | read | read | read | read | none | **own** | write |
| FINANCE | read | none | none | read | read | none | **own** | read |
| ADMIN | read | read | read | read | read | read | read | **own** |
| QA_MANAGER | read | read | **own** | write | none | none | read | read |
| PURCHASING | write | read | none | read | none | none | read | none |

### Access Level Definitions

| Level | Definition |
|-------|------------|
| **none** | No access to this app/module |
| **read** | Can view data but not create or modify |
| **write** | Can create and edit within assigned scope |
| **own** | Full access including delete, configure, approve; primary responsibility |

### Scope Modifiers (Applied per Tenant Configuration)

| Modifier | Description |
|----------|-------------|
| `location` | Access limited to assigned location(s) |
| `team` | Access limited to assigned team members |
| `customer` | Access limited to assigned customer accounts |
| `division` | Access limited to assigned division |
| `all` | No scope restriction within access level |

### Role-to-Scope Defaults

| Role | Default Scope |
|------|---------------|
| CSR | `location` + `customer` (assigned accounts) |
| PLANNER | `location` |
| OPERATOR | `location` + `work_center` (assigned equipment) |
| SHIPPING | `location` |
| RETAIL_COUNTER | `location` |
| CUSTOMER_PORTAL | `customer` (own company only) |
| BRANCH_MANAGER | `location` |
| DIVISION_MANAGER | `division` |
| FINANCE | `all` |
| ADMIN | `all` |
| QA_MANAGER | `location` or `all` (configurable) |
| PURCHASING | `all` |

---

## 4. Role Hierarchy

```
ADMIN (system-wide)
    │
    └── DIVISION_MANAGER (division scope)
            │
            └── BRANCH_MANAGER (location scope)
                    │
                    ├── CSR (location + customer scope)
                    │
                    ├── PLANNER (location scope)
                    │       │
                    │       └── OPERATOR (work_center scope)
                    │
                    ├── SHIPPING (location scope)
                    │
                    ├── RETAIL_COUNTER (location scope)
                    │
                    ├── QA_MANAGER (location scope)
                    │
                    └── PURCHASING (all scope)

FINANCE (all scope - parallel to operations)

CUSTOMER_PORTAL (external - customer scope only)
```

---

## 5. App-to-Role Primary Ownership

```json
{
  "order_intake": {
    "owner": "CSR",
    "contributors": ["RETAIL_COUNTER", "PURCHASING", "BRANCH_MANAGER"]
  },
  "planning": {
    "owner": "PLANNER",
    "contributors": ["BRANCH_MANAGER"]
  },
  "shop_floor": {
    "owner": "OPERATOR",
    "contributors": ["QA_MANAGER", "PLANNER"]
  },
  "shipping": {
    "owner": "SHIPPING",
    "contributors": ["RETAIL_COUNTER"]
  },
  "retail_pos": {
    "owner": "RETAIL_COUNTER",
    "contributors": ["BRANCH_MANAGER"]
  },
  "portal": {
    "owner": "CUSTOMER_PORTAL",
    "contributors": []
  },
  "analytics": {
    "owner": "BRANCH_MANAGER",
    "contributors": ["DIVISION_MANAGER", "FINANCE", "CSR", "PLANNER", "SHIPPING", "QA_MANAGER", "PURCHASING"]
  },
  "admin": {
    "owner": "ADMIN",
    "contributors": ["BRANCH_MANAGER", "DIVISION_MANAGER"]
  }
}
```

---

*Document generated for Build Phase: Roles & Personas for UI and Permission Systems*
