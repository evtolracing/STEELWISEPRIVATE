# 63 — Build Permission Structure

> **Purpose:** IAM and permission structure for hybrid-shell UI.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. permission_matrix

### App-Level Access by Role

| Role | order_intake_app | planning_app | shop_floor_app | shipping_app | inventory_app | billing_app | retail_pos_app | portal_app | analytics_app | admin_app |
|------|-----------------|--------------|----------------|--------------|---------------|-------------|----------------|------------|---------------|-----------|
| CSR | write | read | read | read | read | read | none | none | read | none |
| PLANNER | read | admin | read | read | read | none | none | none | read | none |
| OPERATOR | none | none | write | none | read | none | none | none | none | none |
| SHIPPING | read | read | read | admin | write | none | none | none | read | none |
| RETAIL_COUNTER | write | none | none | read | read | read | admin | none | none | none |
| CUSTOMER_PORTAL | none | none | none | none | none | none | none | write | none | none |
| BRANCH_MANAGER | admin | admin | admin | admin | admin | read | admin | read | admin | read |
| DIVISION_MANAGER | admin | admin | admin | admin | admin | admin | admin | read | admin | write |
| FINANCE | read | none | none | read | read | admin | read | none | admin | none |
| ADMIN | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin |
| QA_MANAGER | read | read | write | read | write | none | none | none | read | none |
| PURCHASING | read | read | none | read | admin | none | none | none | read | none |

### Access Level Definitions

| Level | Description | Capabilities |
|-------|-------------|--------------|
| none | No access | App hidden from navigation, routes blocked |
| read | View only | View screens, export data, no create/edit/delete |
| write | Full operational | Create, edit, delete within role scope |
| admin | Full + configuration | All write + app settings, workflow config, user assignment |

---

## 2. Fine-Grained Permissions

### Order Intake App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| order.create | Create new orders | ✓ | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| order.read | View orders | ✓ | ✓ | — | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| order.update | Edit orders | ✓ | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| order.cancel | Cancel orders | ✓ | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| order.approve_discount | Approve discounts >10% | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| order.override_price | Override pricing | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| order.override_credit | Override credit hold | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| quote.create | Create quotes | ✓ | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| quote.convert | Convert quote to order | ✓ | — | — | — | ✓ | ✓* | ✓ | ✓ | — | ✓ | — | — |
| customer.create | Create customers | ✓ | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| customer.edit | Edit customer info | ✓ | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| customer.view_credit | View credit details | ✓ | — | — | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | — | — |
| contract.create | Create pricing contracts | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| contract.approve | Approve contracts | — | — | — | — | — | — | — | ✓ | — | ✓ | — | — |

*Portal users see only their own orders/quotes

### Planning App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| schedule.view | View schedule board | ✓ | ✓ | — | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| schedule.create | Create/assign jobs | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| schedule.update | Reschedule jobs | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| schedule.prioritize | Change job priority | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| schedule.transfer | Transfer between locations | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| workcenter.view | View work center status | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| workcenter.config | Configure work centers | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| capacity.view | View capacity reports | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| capacity.plan | Adjust capacity | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |

### Shop Floor App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| job.view | View job queue | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| job.start | Start job | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| job.pause | Pause job | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| job.complete | Complete job | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| job.scrap | Record scrap | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| job.measurement | Record measurements | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| job.issue | Report issues | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| job.hold | Place job on hold | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| job.release_hold | Release from hold | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| job.reassign | Reassign operator | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| qc.submit | Submit for QC | — | — | ✓ | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| qc.approve | Approve QC | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — |
| qc.reject | Reject QC | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — |
| qc.waive | Waive QC requirement | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |

### Shipping App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| shipment.view | View shipments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| shipment.create | Create shipments | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| shipment.package | Package items | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| shipment.assign_carrier | Assign carrier | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| shipment.dispatch | Dispatch shipment | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| shipment.confirm_delivery | Confirm delivery | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| receiving.view | View receiving queue | — | ✓ | — | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| receiving.receive | Receive material | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | ✓ |
| receiving.qc_hold | Place on QC hold | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| receiving.release | Release from hold | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| willcall.release | Release will-call | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| claim.file | File damage claim | — | — | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| claim.resolve | Resolve claim | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |

### Inventory App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| inventory.view | View inventory | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| inventory.view_all_locations | View all locations | — | ✓ | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| inventory.view_cost | View cost data | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| inventory.allocate | Allocate inventory | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| inventory.deallocate | Deallocate | — | ✓ | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| inventory.transfer | Transfer locations | — | ✓ | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | ✓ |
| inventory.adjust | Adjust quantities | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| inventory.scrap | Scrap inventory | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| inventory.split | Split units | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| inventory.merge | Merge units | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| location.view | View storage locations | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| location.manage | Manage locations | — | — | — | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |

### Billing App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| billing.view | View billing queue | ✓ | — | — | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | — | — |
| invoice.view | View invoices | ✓ | — | — | ✓ | ✓ | ✓* | ✓ | ✓ | ✓ | ✓ | — | — |
| invoice.create | Create invoices | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| invoice.edit | Edit invoices | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| invoice.void | Void invoices | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | — | — |
| invoice.send | Send to customer | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| payment.record | Record payments | — | — | — | — | ✓ | — | — | — | ✓ | ✓ | — | — |
| payment.apply | Apply to invoices | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| credit.issue | Issue credits | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| aging.view | View aging reports | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |

### Retail POS App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| pos.access | Access POS | — | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| pos.sale | Process sales | — | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| pos.return | Process returns | — | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| pos.void | Void transactions | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| pos.discount | Apply discounts | — | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| pos.discount_override | Override discount limits | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| pos.open_drawer | Open cash drawer | — | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — | — |
| pos.no_sale | No-sale drawer open | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| pos.close_register | Close/balance register | — | — | — | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | — | — |
| pos.view_reports | View POS reports | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |

### Portal App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| portal.view_orders | View own orders | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| portal.place_order | Place orders | — | — | — | — | — | ✓* | — | — | — | — | — | — |
| portal.view_quotes | View quotes | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| portal.request_quote | Request quotes | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| portal.track_shipment | Track shipments | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| portal.download_docs | Download documents | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| portal.view_invoices | View invoices | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| portal.pay_invoice | Pay invoices | — | — | — | — | — | ✓* | — | — | — | — | — | — |
| portal.manage_users | Manage portal users | — | — | — | — | — | ✓* | — | — | — | — | — | — |
| portal.impersonate | Impersonate portal user | ✓ | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |

*Requires customer-level permission enabled

### Analytics App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| analytics.view | View analytics | ✓ | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| analytics.sales | Sales dashboards | ✓ | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| analytics.operations | Operations dashboards | — | ✓ | — | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ | — |
| analytics.inventory | Inventory dashboards | — | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| analytics.financial | Financial dashboards | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | — | — |
| analytics.export | Export reports | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| analytics.schedule | Schedule reports | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| analytics.create | Create custom reports | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — |

### Admin App Permissions

| Permission Code | Description | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL | PORTAL | BR_MGR | DIV_MGR | FINANCE | ADMIN | QA_MGR | PURCH |
|----------------|-------------|-----|---------|----------|----------|--------|--------|--------|---------|---------|-------|--------|-------|
| admin.access | Access admin app | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| user.view | View users | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| user.create | Create users | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| user.edit | Edit users | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| user.deactivate | Deactivate users | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| user.reset_password | Reset passwords | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| role.view | View roles | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| role.assign | Assign roles | — | — | — | — | — | — | ✓* | ✓ | — | ✓ | — | — |
| role.create | Create custom roles | — | — | — | — | — | — | — | ✓ | — | ✓ | — | — |
| location.config | Configure locations | — | — | — | — | — | — | — | ✓ | — | ✓ | — | — |
| division.config | Configure divisions | — | — | — | — | — | — | — | ✓ | — | ✓ | — | — |
| tenant.config | Configure tenant | — | — | — | — | — | — | — | — | — | ✓ | — | — |
| integration.manage | Manage integrations | — | — | — | — | — | — | — | ✓ | — | ✓ | — | — |
| audit.view | View audit logs | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — |
| system.maintenance | System maintenance | — | — | — | — | — | — | — | — | — | ✓ | — | — |

*Branch Manager can only assign roles ≤ their hierarchy level

---

## 2. scoping_rules

```json
[
  {
    "id": "tenant_isolation",
    "description": "All data is isolated by tenant; users cannot access data from other tenants",
    "applies_to": "tenant",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "Row-level security policy on all tenant-scoped tables",
      "frontend": "Tenant context from auth token, no cross-tenant navigation",
      "api": "All queries include tenant_id from session"
    },
    "exceptions": [],
    "audit": true
  },
  {
    "id": "division_visibility",
    "description": "Users see only data for divisions they have access to",
    "applies_to": "division",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "Filter by user.division_access OR user_role.division_id",
      "frontend": "Division picker only shows accessible divisions",
      "api": "division_id filter applied to applicable queries"
    },
    "affected_entities": ["Product", "Grade", "Order", "ProcessingJob", "InventoryUnit", "WorkCenter"],
    "exceptions": [
      {
        "condition": "user has 'cross_division_view' permission",
        "behavior": "Can view all divisions, but cannot modify"
      }
    ],
    "audit": false
  },
  {
    "id": "location_access",
    "description": "Users see only data for locations in their access list",
    "applies_to": "location",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "Filter by user_location_access.location_id",
      "frontend": "Location picker only shows accessible locations",
      "api": "location_id IN (user_locations) filter applied"
    },
    "affected_entities": ["Order", "ProcessingJob", "InventoryUnit", "Shipment", "WorkCenter", "StorageLocation"],
    "exceptions": [
      {
        "condition": "user has 'inventory.view_all_locations' permission",
        "behavior": "Can view inventory at all locations"
      },
      {
        "condition": "user has 'schedule.transfer' permission",
        "behavior": "Can initiate transfers to other locations"
      }
    ],
    "audit": false
  },
  {
    "id": "customer_data_scope",
    "description": "Portal users see only their own customer's data",
    "applies_to": "customer",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "Filter by portal_user.customer_id",
      "frontend": "No customer selection UI in portal",
      "api": "customer_id = session.customer_id for all portal requests"
    },
    "affected_entities": ["Order", "Quote", "Shipment", "Invoice", "Document"],
    "exceptions": [
      {
        "condition": "internal user with 'portal.impersonate' permission",
        "behavior": "Can view as specific customer for support"
      }
    ],
    "audit": true
  },
  {
    "id": "operator_job_scope",
    "description": "Operators see only jobs assigned to their work center or self",
    "applies_to": "assignment",
    "enforced_in": ["frontend"],
    "implementation": {
      "backend": "No restriction - all location jobs visible at API level",
      "frontend": "Default filter to assigned jobs; 'show all' toggle if permitted"
    },
    "affected_entities": ["ProcessingJob"],
    "exceptions": [
      {
        "condition": "job.status = 'READY_TO_SHIP' or 'PACKAGING'",
        "behavior": "Visible to shipping regardless of assignment"
      }
    ],
    "audit": false
  },
  {
    "id": "financial_data_restriction",
    "description": "Cost and margin data restricted to authorized roles",
    "applies_to": "data_field",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "Field-level permissions in API response serialization",
      "frontend": "Conditional rendering of cost columns/fields"
    },
    "restricted_fields": ["cost", "margin", "margin_percent", "vendor_cost", "cost_per_unit"],
    "allowed_roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN", "PURCHASING"],
    "audit": true
  },
  {
    "id": "hierarchy_escalation",
    "description": "Role hierarchy determines which roles a user can assign/manage",
    "applies_to": "role_management",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "user.role.hierarchy_level >= target_role.hierarchy_level",
      "frontend": "Role dropdown only shows assignable roles"
    },
    "hierarchy": {
      "ADMIN": 100,
      "DIVISION_MANAGER": 90,
      "BRANCH_MANAGER": 80,
      "FINANCE": 70,
      "QA_MANAGER": 60,
      "PURCHASING": 60,
      "CSR": 50,
      "PLANNER": 50,
      "SHIPPING": 40,
      "RETAIL_COUNTER": 40,
      "OPERATOR": 30,
      "CUSTOMER_PORTAL": 10
    },
    "audit": true
  },
  {
    "id": "approval_scope",
    "description": "Approval authority limited by location and amount thresholds",
    "applies_to": "approval",
    "enforced_in": ["backend"],
    "implementation": {
      "backend": "Approval rules engine checks role + location + amount"
    },
    "rules": [
      {
        "action": "discount_approval",
        "threshold_field": "discount_percent",
        "thresholds": [
          { "max": 10, "required_role": "CSR" },
          { "max": 20, "required_role": "BRANCH_MANAGER" },
          { "max": 100, "required_role": "DIVISION_MANAGER" }
        ]
      },
      {
        "action": "credit_override",
        "threshold_field": "amount",
        "thresholds": [
          { "max": 5000, "required_role": "BRANCH_MANAGER" },
          { "max": 50000, "required_role": "DIVISION_MANAGER" },
          { "max": null, "required_role": "ADMIN" }
        ]
      },
      {
        "action": "scrap_approval",
        "threshold_field": "value",
        "thresholds": [
          { "max": 500, "required_role": "OPERATOR" },
          { "max": 5000, "required_role": "BRANCH_MANAGER" },
          { "max": null, "required_role": "DIVISION_MANAGER" }
        ]
      }
    ],
    "audit": true
  },
  {
    "id": "time_based_access",
    "description": "Historical data access limited by age",
    "applies_to": "data_age",
    "enforced_in": ["backend"],
    "implementation": {
      "backend": "Date filters applied based on role permissions"
    },
    "rules": [
      {
        "role": "OPERATOR",
        "max_age_days": 90,
        "entities": ["ProcessingJob", "JobEventLog"]
      },
      {
        "role": "CSR",
        "max_age_days": 365,
        "entities": ["Order", "Quote"]
      },
      {
        "role": "FINANCE",
        "max_age_days": null,
        "entities": ["Invoice", "Payment"]
      }
    ],
    "audit": false
  },
  {
    "id": "document_visibility",
    "description": "Document access based on document type and user role",
    "applies_to": "document_type",
    "enforced_in": ["backend", "frontend"],
    "implementation": {
      "backend": "Document type + role matrix for access control",
      "frontend": "Document links hidden if no access"
    },
    "matrix": {
      "MTR": ["QA_MANAGER", "SHIPPING", "CSR", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN", "CUSTOMER_PORTAL"],
      "internal_note": ["CSR", "PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
      "cost_analysis": ["FINANCE", "DIVISION_MANAGER", "ADMIN"],
      "packing_list": ["SHIPPING", "CSR", "RETAIL_COUNTER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN", "CUSTOMER_PORTAL"],
      "invoice": ["FINANCE", "CSR", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN", "CUSTOMER_PORTAL"]
    },
    "audit": true
  }
]
```

---

## 3. module_toggles

```json
[
  {
    "id": "multi_location",
    "label": "Multi-Location Support",
    "description": "Enable multiple warehouse/branch locations with inventory tracking and job transfers",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["Location", "InventoryUnit", "ProcessingJob", "Shipment"],
    "ui_impact": ["location_picker", "transfer_workflows", "cross_location_reports"],
    "license_tier": "professional"
  },
  {
    "id": "plastics_division",
    "label": "Plastics Division",
    "description": "Enable plastics product catalog, processing types, and work centers",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": ["Division", "Product", "Grade", "ProcessingType", "WorkCenter"],
    "ui_impact": ["division_picker", "plastics_processing_options", "plastics_catalog"],
    "license_tier": "professional"
  },
  {
    "id": "customer_portal",
    "label": "Customer Portal",
    "description": "Enable customer self-service portal for orders, tracking, and documents",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["Contact", "User", "Order", "Shipment", "Document"],
    "ui_impact": ["portal_app", "customer_portal_setup", "portal_user_management"],
    "license_tier": "standard"
  },
  {
    "id": "retail_pos",
    "label": "Retail POS",
    "description": "Enable retail point-of-sale for walk-in customers and will-call pickups",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": ["Order", "Payment", "InventoryUnit"],
    "ui_impact": ["retail_pos_app", "cash_drawer_management", "pos_reports"],
    "license_tier": "professional"
  },
  {
    "id": "advanced_scheduling",
    "label": "Advanced Scheduling",
    "description": "Enable capacity planning, constraint-based scheduling, and optimization",
    "default_enabled": false,
    "dependencies": ["multi_location"],
    "affects_entities": ["WorkCenter", "ProcessingJob", "OperationStep"],
    "ui_impact": ["capacity_heatmap", "constraint_editor", "schedule_optimization"],
    "license_tier": "enterprise"
  },
  {
    "id": "heat_traceability",
    "label": "Heat Traceability",
    "description": "Enable full heat/lot tracking with MTR management and compliance reporting",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["Heat", "InventoryUnit", "ProcessingJob", "Document"],
    "ui_impact": ["heat_lookup", "mtr_upload", "traceability_tree", "compliance_reports"],
    "license_tier": "standard"
  },
  {
    "id": "contract_pricing",
    "label": "Contract Pricing",
    "description": "Enable customer-specific pricing contracts with approval workflows",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["ContractPricing", "ContractPricingLine", "OrderLine"],
    "ui_impact": ["contract_management", "price_lookup", "contract_approval_workflow"],
    "license_tier": "standard"
  },
  {
    "id": "qc_module",
    "label": "QC/QA Module",
    "description": "Enable quality control workflows, measurement recording, and NCR management",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["MeasurementRecord", "ProcessingJob", "OperationStep"],
    "ui_impact": ["qc_queue", "measurement_entry", "ncr_workflow", "qc_reports"],
    "license_tier": "standard"
  },
  {
    "id": "billing_integration",
    "label": "Billing Integration",
    "description": "Enable billing triggers, invoice generation, and AR management",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["Invoice", "Payment", "Order", "Shipment"],
    "ui_impact": ["billing_app", "invoice_generation", "payment_recording", "aging_reports"],
    "license_tier": "standard"
  },
  {
    "id": "carrier_integration",
    "label": "Carrier Integration",
    "description": "Enable real-time carrier rates, tracking, and label printing",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": ["Carrier", "Shipment", "Package"],
    "ui_impact": ["rate_shopping", "tracking_updates", "label_printing"],
    "license_tier": "professional"
  },
  {
    "id": "edi_integration",
    "label": "EDI Integration",
    "description": "Enable EDI document exchange (850, 856, 810, etc.)",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": ["Order", "Shipment", "Invoice"],
    "ui_impact": ["edi_inbox", "edi_mapping", "edi_errors"],
    "license_tier": "enterprise"
  },
  {
    "id": "api_access",
    "label": "API Access",
    "description": "Enable REST API access for external integrations",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": [],
    "ui_impact": ["api_key_management", "webhook_configuration", "api_logs"],
    "license_tier": "professional"
  },
  {
    "id": "advanced_analytics",
    "label": "Advanced Analytics",
    "description": "Enable custom report builder, scheduled reports, and data export",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": [],
    "ui_impact": ["report_builder", "scheduled_reports", "data_export", "dashboard_customization"],
    "license_tier": "enterprise"
  },
  {
    "id": "ai_features",
    "label": "AI Features",
    "description": "Enable AI-powered demand forecasting, anomaly detection, and recommendations",
    "default_enabled": false,
    "dependencies": ["advanced_analytics"],
    "affects_entities": [],
    "ui_impact": ["demand_forecast", "anomaly_alerts", "ai_recommendations", "copilot"],
    "license_tier": "enterprise"
  },
  {
    "id": "mobile_apps",
    "label": "Mobile Apps",
    "description": "Enable native mobile apps for shop floor and delivery",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": [],
    "ui_impact": ["mobile_shop_floor", "mobile_delivery", "mobile_inventory"],
    "license_tier": "professional"
  },
  {
    "id": "purchasing_module",
    "label": "Purchasing Module",
    "description": "Enable purchase orders, vendor management, and receiving",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": ["Vendor", "PurchaseOrder", "PurchaseOrderLine"],
    "ui_impact": ["purchase_orders", "vendor_management", "receiving_po_match"],
    "license_tier": "standard"
  },
  {
    "id": "audit_trail",
    "label": "Audit Trail",
    "description": "Enable comprehensive audit logging with retention and reporting",
    "default_enabled": true,
    "dependencies": [],
    "affects_entities": [],
    "ui_impact": ["audit_log_viewer", "audit_reports", "compliance_reports"],
    "license_tier": "standard"
  },
  {
    "id": "sso_integration",
    "label": "SSO Integration",
    "description": "Enable SAML/OIDC single sign-on integration",
    "default_enabled": false,
    "dependencies": [],
    "affects_entities": ["User", "Session"],
    "ui_impact": ["sso_configuration", "identity_provider_setup"],
    "license_tier": "enterprise"
  }
]
```

---

## 4. tenant_visibility

### Surface Access by Role

| Surface | Description | Default Modules | Allowed Roles |
|---------|-------------|-----------------|---------------|
| internal_shell | Main application shell for employees | order_intake_app, planning_app, shop_floor_app, shipping_app, inventory_app, billing_app, analytics_app | CSR, PLANNER, OPERATOR, SHIPPING, RETAIL_COUNTER, BRANCH_MANAGER, DIVISION_MANAGER, FINANCE, ADMIN, QA_MANAGER, PURCHASING |
| retail_shell | Simplified shell for retail counter | retail_pos_app, inventory_app (read-only) | RETAIL_COUNTER, BRANCH_MANAGER, DIVISION_MANAGER, ADMIN |
| customer_portal | External customer self-service | portal_app | CUSTOMER_PORTAL |
| admin_shell | Administration and configuration | admin_app, analytics_app | BRANCH_MANAGER, DIVISION_MANAGER, ADMIN |

### Module Visibility by Surface

| Module | internal_shell | retail_shell | customer_portal | admin_shell |
|--------|---------------|--------------|-----------------|-------------|
| order_intake_app | ✓ | — | — | — |
| planning_app | ✓ | — | — | — |
| shop_floor_app | ✓ | — | — | — |
| shipping_app | ✓ | — | — | — |
| inventory_app | ✓ | read-only | — | — |
| billing_app | ✓ | — | — | — |
| retail_pos_app | — | ✓ | — | — |
| portal_app | — | — | ✓ | — |
| analytics_app | ✓ | — | — | ✓ |
| admin_app | — | — | — | ✓ |

### Shell Features by Surface

| Feature | internal_shell | retail_shell | customer_portal | admin_shell |
|---------|---------------|--------------|-----------------|-------------|
| Global search | ✓ | ✓ (products only) | ✓ (own orders only) | ✓ |
| Notifications | ✓ | ✓ | ✓ | ✓ |
| Location picker | ✓ | — (single location) | — | ✓ |
| Division picker | ✓ | — | — | ✓ |
| Quick actions | ✓ | ✓ (POS actions) | ✓ (order/quote) | ✓ |
| Help/docs | ✓ | ✓ | ✓ | ✓ |
| Theme switcher | ✓ | — | ✓ | ✓ |
| Keyboard shortcuts | ✓ | ✓ | — | ✓ |
| Session timeout | 8 hours | 2 hours | 30 minutes | 8 hours |
| MFA required | by policy | by policy | by policy | required |
| Offline mode | shop_floor only | — | — | — |

### Customer Portal Visibility

| Portal Feature | Visibility Condition | Data Scope |
|---------------|---------------------|------------|
| Order List | Always | Own customer orders only |
| Order Detail | Always | Own customer orders only |
| Quote List | Always | Own customer quotes only |
| Quote Request | If enabled for customer | N/A |
| Place Order | If enabled for customer | From approved quotes or catalog |
| Shipment Tracking | Always | Own customer shipments only |
| Document Download | Always | Own customer documents only |
| Invoice List | If billing_access enabled | Own customer invoices only |
| Pay Invoice | If online_payment enabled | Own customer invoices only |
| User Management | If portal_admin role | Own customer portal users only |
| Address Book | Always | Own customer addresses only |
| Contact Info | Always | Own customer contacts only |
| Reorder | Always | From own order history |
| Support Request | Always | Own customer tickets only |

### Navigation Rules

```json
{
  "internal_shell": {
    "primary_nav": [
      { "id": "dashboard", "label": "Dashboard", "icon": "dashboard", "always_visible": true },
      { "id": "orders", "label": "Orders", "icon": "receipt", "app": "order_intake_app", "min_access": "read" },
      { "id": "planning", "label": "Planning", "icon": "event", "app": "planning_app", "min_access": "read" },
      { "id": "shop_floor", "label": "Shop Floor", "icon": "precision_manufacturing", "app": "shop_floor_app", "min_access": "read" },
      { "id": "shipping", "label": "Shipping", "icon": "local_shipping", "app": "shipping_app", "min_access": "read" },
      { "id": "inventory", "label": "Inventory", "icon": "inventory", "app": "inventory_app", "min_access": "read" },
      { "id": "billing", "label": "Billing", "icon": "payments", "app": "billing_app", "min_access": "read" },
      { "id": "analytics", "label": "Analytics", "icon": "analytics", "app": "analytics_app", "min_access": "read" },
      { "id": "admin", "label": "Admin", "icon": "settings", "app": "admin_app", "min_access": "read" }
    ],
    "secondary_nav": [
      { "id": "help", "label": "Help", "icon": "help", "always_visible": true },
      { "id": "notifications", "label": "Notifications", "icon": "notifications", "always_visible": true },
      { "id": "profile", "label": "Profile", "icon": "account_circle", "always_visible": true }
    ],
    "hide_if_no_access": true
  },
  "customer_portal": {
    "primary_nav": [
      { "id": "dashboard", "label": "Dashboard", "icon": "dashboard", "always_visible": true },
      { "id": "orders", "label": "Orders", "icon": "receipt", "always_visible": true },
      { "id": "quotes", "label": "Quotes", "icon": "request_quote", "always_visible": true },
      { "id": "shipments", "label": "Shipments", "icon": "local_shipping", "always_visible": true },
      { "id": "documents", "label": "Documents", "icon": "folder", "always_visible": true },
      { "id": "invoices", "label": "Invoices", "icon": "receipt_long", "visible_if": "billing_access" },
      { "id": "account", "label": "Account", "icon": "settings", "always_visible": true }
    ],
    "secondary_nav": [
      { "id": "support", "label": "Support", "icon": "support", "always_visible": true },
      { "id": "profile", "label": "Profile", "icon": "account_circle", "always_visible": true }
    ]
  }
}
```

---

## 5. Permission Inheritance

```json
{
  "role_hierarchy": [
    {
      "role": "ADMIN",
      "level": 100,
      "inherits_from": null,
      "description": "Full system access, all permissions"
    },
    {
      "role": "DIVISION_MANAGER",
      "level": 90,
      "inherits_from": "BRANCH_MANAGER",
      "description": "Multi-location oversight, financial access"
    },
    {
      "role": "BRANCH_MANAGER",
      "level": 80,
      "inherits_from": null,
      "description": "Location-level authority, cross-functional access"
    },
    {
      "role": "FINANCE",
      "level": 70,
      "inherits_from": null,
      "description": "Financial operations, billing, AR/AP"
    },
    {
      "role": "QA_MANAGER",
      "level": 60,
      "inherits_from": null,
      "description": "Quality control authority"
    },
    {
      "role": "PURCHASING",
      "level": 60,
      "inherits_from": null,
      "description": "Procurement and vendor management"
    },
    {
      "role": "CSR",
      "level": 50,
      "inherits_from": null,
      "description": "Customer service and order entry"
    },
    {
      "role": "PLANNER",
      "level": 50,
      "inherits_from": null,
      "description": "Production scheduling"
    },
    {
      "role": "SHIPPING",
      "level": 40,
      "inherits_from": null,
      "description": "Shipping and receiving operations"
    },
    {
      "role": "RETAIL_COUNTER",
      "level": 40,
      "inherits_from": null,
      "description": "Retail counter sales"
    },
    {
      "role": "OPERATOR",
      "level": 30,
      "inherits_from": null,
      "description": "Shop floor operations"
    },
    {
      "role": "CUSTOMER_PORTAL",
      "level": 10,
      "inherits_from": null,
      "description": "External customer access"
    }
  ],
  "inheritance_rules": [
    "Higher level roles can assign permissions to lower levels only",
    "Inherited permissions can be restricted but not expanded",
    "Location/division scope from parent role applies to inherited permissions",
    "Custom permissions cannot exceed base role permissions"
  ],
  "multi_role_support": {
    "enabled": true,
    "combination_rule": "union",
    "description": "User with multiple roles gets union of all permissions",
    "conflict_resolution": "most_permissive"
  }
}
```

---

*Document generated for Build Phase: Permission Structure*
