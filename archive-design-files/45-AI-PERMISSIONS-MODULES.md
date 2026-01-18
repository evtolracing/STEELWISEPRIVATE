# 45 — AI Permissions & Modules

> **Purpose:** IAM permission model, module access controls, and tenant visibility rules for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Permission Matrix — Role × Module × Level

### Legend

| Level | Code | Description |
|-------|------|-------------|
| None | `-` | No access |
| View | `V` | Read-only access |
| Create | `C` | Create new records |
| Edit | `E` | Modify existing records |
| Delete | `D` | Remove records |
| Approve | `A` | Approve/reject workflows |
| Admin | `*` | Full access including config |
| Own | `o` | Only own records |
| Division | `d` | Division-scoped |
| Location | `l` | Location-scoped |
| All | `a` | All records |

### Internal Roles Permission Matrix

| Module | Capability | SUPER_ADMIN | BRANCH_MANAGER | SALES_MANAGER | INSIDE_SALES | COUNTER_SALES | WAREHOUSE_MGR | WAREHOUSE_OP | SHOP_FLOOR_MGR | MACHINE_OP | QA_MANAGER | QA_INSPECTOR | SHIPPING_COORD | DRIVER | RECEIVING | INVENTORY_CTRL | AR_CLERK | AP_CLERK | PURCHASING | SCHEDULER |
|--------|------------|-------------|----------------|---------------|--------------|---------------|---------------|--------------|----------------|------------|------------|--------------|----------------|--------|-----------|----------------|----------|----------|------------|-----------|
| **DASHBOARD** | view_kpis | *a | *l | Va | Vo | Vo | Vl | Vl | Vl | Vo | Vl | Vo | Vl | Vo | Vl | Vl | Va | Va | Va | Vl |
| | view_alerts | *a | *l | Va | Vo | Vo | Vl | Vl | Vl | Vo | Vl | Vo | Vl | Vo | Vl | Vl | Va | Va | Va | Vl |
| | customize | *a | El | Eo | Eo | Eo | El | Eo | El | Eo | El | Eo | El | Eo | Eo | El | Eo | Eo | Eo | El |
| **ORDERS** | view | *a | VCEAl | VCEAd | VCEo | VCo | Vl | Vl | Vl | - | Vl | - | VCEl | - | Vl | Vl | Va | - | Va | VCEl |
| | create | *a | Cl | Cd | Co | Co | - | - | - | - | - | - | Cl | - | - | - | - | - | - | Cl |
| | edit | *a | El | Ed | Eo | Eo | - | - | - | - | - | - | El | - | - | - | - | - | - | El |
| | approve | *a | Al | Ad | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | cancel | *a | Al | Ad | Ao | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | pricing_override | *a | Al | Ad | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | view_margin | *a | Vl | Vd | - | - | - | - | - | - | - | - | - | - | - | - | Va | - | Va | - |
| **QUOTES** | view | *a | VCEAl | VCEAd | VCEo | VCo | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | create | *a | Cl | Cd | Co | Co | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | edit | *a | El | Ed | Eo | Eo | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | approve | *a | Al | Ad | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | convert_to_order | *a | Cl | Cd | Co | Co | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **CUSTOMERS** | view | *a | VCEl | VCEd | VCEo | Vo | Vl | - | - | - | - | - | Vl | - | Vl | Vl | VCEa | - | Va | Vl |
| | create | *a | Cl | Cd | Co | - | - | - | - | - | - | - | - | - | - | - | Ca | - | - | - |
| | edit | *a | El | Ed | Eo | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | - |
| | credit_management | *a | Al | - | - | - | - | - | - | - | - | - | - | - | - | - | Aa | - | - | - |
| | view_ar_balance | *a | Vl | Vd | Vo | Vo | - | - | - | - | - | - | - | - | - | - | Va | - | - | - |
| **PRODUCTS** | view | *a | Vl | Va | Va | Va | Va | Va | Va | Va | Va | Va | Va | - | Va | Va | - | - | Va | Va |
| | create | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | Ca | - | - | Ca | - |
| | edit | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | Ea | - |
| | pricing | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | Ea | - |
| | deactivate | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | Aa | - | - | - | - |
| **INVENTORY** | view | *a | Vl | Va | Va | Va | VCEDl | VCEl | Vl | Vl | Vl | Vl | VCEl | - | VCEl | VCEDa | - | - | Va | Vl |
| | receive | *a | Al | - | - | - | Cl | Cl | - | - | - | - | - | - | VCEl | VCEa | - | - | - | - |
| | adjust | *a | Al | - | - | - | VCEl | - | - | - | - | - | - | - | - | VCEAa | - | - | - | - |
| | transfer | *a | Al | - | - | - | VCEl | VCl | - | - | - | - | VCl | - | - | VCEa | - | - | - | - |
| | allocate | *a | Al | Al | Ao | Ao | Al | - | - | - | - | - | Al | - | - | Aa | - | - | - | Al |
| | view_cost | *a | Vl | - | - | - | - | - | - | - | - | - | - | - | - | Va | - | Va | Va | - |
| | cycle_count | *a | Al | - | - | - | VCEAl | VCl | - | - | - | - | - | - | - | VCEAa | - | - | - | - |
| **HEATS_MTR** | view | *a | Vl | Va | Va | Va | Va | Va | Va | Va | Va | Va | Va | - | Va | Va | - | - | Va | Va |
| | create | *a | - | - | - | - | - | - | - | - | - | - | - | - | Cl | Ca | - | - | - | - |
| | edit | *a | - | - | - | - | - | - | - | - | - | - | - | - | El | Ea | - | - | - | - |
| | upload_mtr | *a | - | - | - | - | - | - | - | - | Al | Al | - | - | Cl | Ca | - | - | - | - |
| **WORK_ORDERS** | view | *a | Vl | Vl | Vl | Vl | Vl | Vl | VCEAl | VCEl | VCEAl | VCEl | Vl | - | - | Vl | - | - | - | VCEAl |
| | create | *a | Cl | - | - | - | - | - | Cl | - | - | - | Cl | - | - | - | - | - | - | Cl |
| | edit | *a | El | - | - | - | - | - | El | - | - | - | El | - | - | - | - | - | - | El |
| | release | *a | Al | - | - | - | - | - | Al | - | - | - | - | - | - | - | - | - | - | Al |
| | start_operation | *a | Al | - | - | - | - | - | Al | VCEl | - | - | - | - | - | - | - | - | - | - |
| | complete_operation | *a | Al | - | - | - | - | - | Al | VCEl | - | - | - | - | - | - | - | - | - | - |
| | record_scrap | *a | Al | - | - | - | - | - | El | El | - | - | - | - | - | - | - | - | - | - |
| | close | *a | Al | - | - | - | - | - | Al | - | - | - | - | - | - | - | - | - | - | Al |
| **SCHEDULING** | view | *a | Vl | Vl | Vl | Vl | Vl | Vl | VCEl | Vl | Vl | - | VCEl | - | Vl | Vl | - | - | Vl | VCEAl |
| | schedule_job | *a | Al | - | - | - | - | - | El | - | - | - | El | - | - | - | - | - | - | VCEAl |
| | reschedule | *a | Al | - | - | - | - | - | El | - | - | - | El | - | - | - | - | - | - | VCEAl |
| | capacity_planning | *a | Vl | - | - | - | - | - | Vl | - | - | - | - | - | - | - | - | - | - | VCEAl |
| **QAQC** | view | *a | Vl | Vl | Vl | Vl | Vl | Vl | Vl | Vl | VCEAl | VCEl | Vl | - | Vl | Vl | - | - | Vl | Vl |
| | create_inspection | *a | - | - | - | - | - | - | - | - | Cl | Cl | - | - | Cl | - | - | - | - | - |
| | record_results | *a | - | - | - | - | - | - | - | - | El | El | - | - | El | - | - | - | - | - |
| | approve_inspection | *a | - | - | - | - | - | - | - | - | Al | - | - | - | - | - | - | - | - | - |
| | hold_material | *a | Al | - | - | - | - | - | Al | - | Al | Al | - | - | Al | Al | - | - | - | - |
| | release_hold | *a | Al | - | - | - | - | - | - | - | Al | - | - | - | - | Al | - | - | - | - |
| | ncr_management | *a | Al | - | - | - | - | - | Al | - | VCEAl | VCEl | - | - | - | - | - | - | - | - |
| **SHIPPING** | view | *a | Vl | Vd | Vd | Vd | Vl | Vl | Vl | - | Vl | - | VCEAl | Vl | Vl | Vl | Va | - | - | Vl |
| | create_shipment | *a | Cl | - | - | - | - | - | - | - | - | - | Cl | - | - | - | - | - | - | Cl |
| | pick | *a | - | - | - | - | VCEl | VCEl | - | - | - | - | El | - | - | - | - | - | - | - |
| | stage | *a | - | - | - | - | VCEl | VCEl | - | - | - | - | El | - | - | - | - | - | - | - |
| | load | *a | - | - | - | - | El | El | - | - | - | - | El | El | - | - | - | - | - | - |
| | dispatch | *a | Al | - | - | - | Al | - | - | - | - | - | Al | - | - | - | - | - | - | - |
| | confirm_delivery | *a | El | - | - | - | - | - | - | - | - | - | El | El | - | - | - | - | - | - |
| | freight_quote | *a | El | - | Ed | Ed | - | - | - | - | - | - | VCEl | - | - | - | - | - | - | - |
| **WILL_CALL** | view | *a | Vl | Vd | Vd | Vd | Vl | Vl | - | - | - | - | VCEAl | - | - | - | - | - | - | - |
| | release | *a | Al | - | - | - | Al | Al | - | - | - | - | Al | - | - | - | - | - | - | - |
| | verify_pickup | *a | El | - | - | - | El | El | - | - | - | - | El | - | - | - | - | - | - | - |
| **RECEIVING** | view | *a | Vl | - | - | - | VCEAl | VCEl | - | - | Vl | Vl | - | - | VCEAl | VCEl | - | Va | Va | - |
| | receive_po | *a | Al | - | - | - | Al | El | - | - | - | - | - | - | VCEl | El | - | - | - | - |
| | inspect | *a | - | - | - | - | - | - | - | - | Al | El | - | - | El | - | - | - | - | - |
| | put_away | *a | - | - | - | - | El | El | - | - | - | - | - | - | El | - | - | - | - | - |
| **PURCHASING** | view | *a | Vl | - | - | - | Vl | - | Vl | - | Vl | - | - | - | Vl | Vl | - | Va | VCEAa | Vl |
| | create_po | *a | Cl | - | - | - | - | - | - | - | - | - | - | - | - | Cl | - | - | VCEa | - |
| | edit_po | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | El | - | - | VCEa | - |
| | approve_po | *a | Al | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | Aa | - |
| | receive_po | *a | - | - | - | - | - | - | - | - | - | - | - | - | El | El | - | El | - | - |
| **BILLING** | view | *a | Vl | Vd | Vd | Vd | - | - | - | - | - | - | Vl | - | - | - | VCEAa | VCEAa | Va | - |
| | create_invoice | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | - | VCEa | - | - | - |
| | adjust_invoice | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | - | VCEAa | - | - | - |
| | apply_payment | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | - | VCEa | - | - | - |
| | credit_memo | *a | Al | - | - | - | - | - | - | - | - | - | - | - | - | - | VCEAa | - | - | - |
| | process_ap | *a | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | VCEAa | - | - |
| **PRICING** | view | *a | Va | Vd | Vd | Vd | - | - | - | - | - | - | - | - | - | Va | Va | - | Va | - |
| | edit_list | *a | Ea | - | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | - | - |
| | contracts | *a | VCEAa | VCEAd | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | commodity_update | *a | Ea | - | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | Ea | - |
| **REPORTS** | view_operational | *a | Vl | Vd | Vd | Vo | Vl | Vl | Vl | Vo | Vl | Vo | Vl | Vo | Vl | Vl | Va | Va | Va | Vl |
| | view_financial | *a | Vl | - | - | - | - | - | - | - | - | - | - | - | - | - | Va | Va | Va | - |
| | view_executive | *a | Va | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | export | *a | El | Ed | Eo | Eo | El | Eo | El | Eo | El | Eo | El | - | Eo | El | Ea | Ea | Ea | El |
| | schedule_report | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | - | Ea | Ea | - | - |
| **USERS** | view | *a | Vl | - | Vd | - | Vl | - | Vl | - | Vl | - | Vl | - | - | - | - | - | - | - |
| | create | *a | Cl | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | edit | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | deactivate | *a | Al | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | assign_role | *a | Al | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | reset_password | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **SETTINGS** | view | *a | Vl | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | locations | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| | work_centers | *a | El | - | - | - | - | - | El | - | - | - | - | - | - | - | - | - | - | - |
| | carriers | *a | El | - | - | - | - | - | - | - | - | - | El | - | - | - | - | - | - | - |
| | payment_terms | *a | Ea | - | - | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | - |
| | tax_setup | *a | Ea | - | - | - | - | - | - | - | - | - | - | - | - | - | Ea | - | - | - |
| | integrations | *a | Ea | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **AUDIT** | view_logs | *a | Vl | - | - | - | - | - | - | - | - | - | - | - | - | - | Va | - | - | - |
| | export_logs | *a | El | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

### Customer Portal Roles Permission Matrix

| Module | Capability | PORTAL_VIEWER | PORTAL_BUYER | PORTAL_ADMIN | PORTAL_OWNER |
|--------|------------|---------------|--------------|--------------|--------------|
| **ORDERS** | view | Vo | Vd | Va | Va |
| | create | - | Cd | Ca | Ca |
| | edit_pending | - | Eo | Ea | Ea |
| | cancel | - | Ao | Aa | Aa |
| | reorder | - | Cd | Ca | Ca |
| **QUOTES** | view | Vo | Vd | Va | Va |
| | request | - | Cd | Ca | Ca |
| | accept | - | Ao | Aa | Aa |
| **SHIPMENTS** | view | Vo | Vd | Va | Va |
| | track | Vo | Vd | Va | Va |
| **DOCUMENTS** | view_packing_list | Vo | Vd | Va | Va |
| | view_bol | Vo | Vd | Va | Va |
| | view_mtr | Vo | Vd | Va | Va |
| | view_coc | Vo | Vd | Va | Va |
| | view_invoice | - | Vd | Va | Va |
| | download | Vo | Vd | Va | Va |
| **INVOICES** | view | - | Vd | Va | Va |
| | pay_online | - | - | Ea | Ea |
| | view_statement | - | - | Va | Va |
| **CLAIMS** | view | Vo | Vd | Va | Va |
| | submit | - | Cd | Ca | Ca |
| **RETURNS** | view | Vo | Vd | Va | Va |
| | request_rma | - | Cd | Ca | Ca |
| **SHIP_TOS** | view | Vo | Vd | Va | Va |
| | create | - | - | Ca | Ca |
| | edit | - | - | Ea | Ea |
| **CONTACTS** | view | - | Vd | Va | Va |
| | edit | - | - | Ea | Ea |
| **USERS** | view | - | - | Va | Va |
| | create | - | - | Ca | Ca |
| | edit | - | - | Ea | Ea |
| | deactivate | - | - | Aa | Aa |
| **ACCOUNT** | view_profile | Vo | Vo | Va | Va |
| | edit_profile | Eo | Eo | Ea | Ea |
| | view_credit | - | - | Va | Va |
| | request_credit_increase | - | - | - | Ca |
| **ANALYTICS** | view_spending | - | Vd | Va | Va |
| | view_reports | - | Vd | Va | Va |
| | export | - | Ed | Ea | Ea |

---

## 2. Scoping Rules — Structured List

```yaml
scoping_rules:

  tenant_scope:
    - rule_id: SCOPE-T-001
      name: "Tenant Isolation"
      description: "All data access filtered by authenticated user's tenant_id"
      implementation:
        - "RLS policy on all tenant-scoped tables"
        - "JWT claims include tenant_id"
        - "API middleware validates tenant context"
      exceptions:
        - "System admin can access cross-tenant"
        - "Support mode with audit logging"

    - rule_id: SCOPE-T-002
      name: "Tenant Feature Flags"
      description: "Module availability controlled by tenant subscription"
      implementation:
        - "Tenant.settings contains enabled_modules[]"
        - "API checks module access before processing"
        - "UI hides disabled modules"

  location_scope:
    - rule_id: SCOPE-L-001
      name: "User Location Assignment"
      description: "Users access only assigned locations"
      implementation:
        - "UserLocation junction table"
        - "home_location_id for default"
        - "Query filter by user.accessible_locations"
      entities_affected:
        - InventoryItem
        - WorkOrder
        - Shipment
        - WorkCenter
        - Zone
        - BinLocation

    - rule_id: SCOPE-L-002
      name: "Location Context Switching"
      description: "User can switch between assigned locations"
      implementation:
        - "Session stores current_location_id"
        - "API validates location in user's access list"
        - "UI location switcher in header"
      constraints:
        - "Cannot switch to non-assigned location"
        - "Switch logged in audit"

    - rule_id: SCOPE-L-003
      name: "Cross-Location Visibility"
      description: "Some roles can view all locations"
      permissions:
        - "INVENTORY_VIEW_ALL_LOCATIONS"
        - "ORDERS_VIEW_ALL_LOCATIONS"
        - "REPORTS_ALL_LOCATIONS"
      roles_with_permission:
        - SUPER_ADMIN
        - SALES_MANAGER (orders only)
        - INVENTORY_CTRL

    - rule_id: SCOPE-L-004
      name: "Location-Bound Operations"
      description: "Certain operations locked to current location"
      operations:
        - "Inventory receive: current location"
        - "Work order start: work center's location"
        - "Shipment dispatch: current location"
        - "Will-call release: current location"
      enforcement: "Cannot perform operation for other location"

  division_scope:
    - rule_id: SCOPE-D-001
      name: "Customer Division Filtering"
      description: "Portal users see only their division's data"
      implementation:
        - "Contact.division_id links user to divisions"
        - "null division_id = access all divisions"
        - "Query filter on division_id"
      entities_affected:
        - SalesOrder
        - ShipTo
        - Contact
        - Invoice

    - rule_id: SCOPE-D-002
      name: "Division-Specific Ship-To"
      description: "Ship-to addresses scoped to divisions"
      implementation:
        - "ShipTo.division_id optional"
        - "null = shared across all divisions"
        - "set = visible only to that division"

    - rule_id: SCOPE-D-003
      name: "Internal Division View"
      description: "Internal users see all customer divisions"
      permissions:
        - "CUSTOMER_VIEW_ALL_DIVISIONS"
      default_behavior: "Internal users see all by default"

  ownership_scope:
    - rule_id: SCOPE-O-001
      name: "Own Records Only"
      description: "User sees only self-created records"
      applicable_to:
        - COUNTER_SALES viewing orders
        - MACHINE_OP viewing work orders
        - DRIVER viewing shipments
      implementation:
        - "Filter by created_by = current_user.id"
        - "Or assigned_to = current_user.id"

    - rule_id: SCOPE-O-002
      name: "Team Records"
      description: "Manager sees team members' records"
      implementation:
        - "User.manager_id hierarchy"
        - "OR query on direct reports"
      applicable_to:
        - SALES_MANAGER viewing team quotes
        - SHOP_FLOOR_MGR viewing operators' work

    - rule_id: SCOPE-O-003
      name: "Assigned Customer Scope"
      description: "Sales sees only assigned customers"
      implementation:
        - "Customer.salesperson_id = current_user.id"
        - "CustomerAssignment junction for shared"
      permission_override:
        - "CUSTOMER_VIEW_ALL_ASSIGNED"
        - "CUSTOMER_VIEW_ALL"

  temporal_scope:
    - rule_id: SCOPE-TIME-001
      name: "Active Record Default"
      description: "Queries default to active/current records"
      implementation:
        - "is_active = true filter"
        - "status != CANCELLED filter"
        - "Explicit include_inactive param to override"

    - rule_id: SCOPE-TIME-002
      name: "Date Range Limits"
      description: "Reports limited to reasonable date ranges"
      limits:
        default_range: "30 days"
        max_range: "365 days"
        archive_access: "Requires special permission"

    - rule_id: SCOPE-TIME-003
      name: "Historical Data Access"
      description: "Archived data requires permission"
      permissions:
        - "VIEW_ARCHIVED_ORDERS"
        - "VIEW_ARCHIVED_INVENTORY"
      archive_threshold: "2 years"

  data_sensitivity_scope:
    - rule_id: SCOPE-S-001
      name: "Cost Visibility"
      description: "Product/inventory cost hidden from most users"
      visible_to:
        - SUPER_ADMIN
        - BRANCH_MANAGER
        - INVENTORY_CTRL
        - PURCHASING
        - AP_CLERK
      hidden_fields:
        - InventoryItem.cost_per_unit
        - Product.cost
        - WorkOrder.material_cost

    - rule_id: SCOPE-S-002
      name: "Margin Visibility"
      description: "Order margin visible to limited roles"
      visible_to:
        - SUPER_ADMIN
        - BRANCH_MANAGER
        - SALES_MANAGER
        - AR_CLERK
      hidden_fields:
        - SalesOrderLine.margin_pct
        - SalesOrder.order_margin

    - rule_id: SCOPE-S-003
      name: "Customer Financial Data"
      description: "AR balance, credit limit restricted"
      visible_to:
        - SUPER_ADMIN
        - BRANCH_MANAGER
        - AR_CLERK
        - CREDIT_MANAGER
      restricted_to_sales:
        - "INSIDE_SALES sees assigned customers only"
        - "COUNTER_SALES sees balance on current order"

    - rule_id: SCOPE-S-004
      name: "Employee Information"
      description: "Personal employee data protected"
      visible_to:
        - SUPER_ADMIN
        - HR (if module enabled)
      hidden_fields:
        - User.ssn (if stored)
        - User.salary
        - User.emergency_contact

  api_scope:
    - rule_id: SCOPE-API-001
      name: "API Key Scope"
      description: "External API keys have explicit scope"
      implementation:
        - "api_key.scopes[] defines allowed operations"
        - "api_key.location_ids[] limits location access"
        - "api_key.rate_limit controls usage"
      example_scopes:
        - "inventory:read"
        - "orders:write"
        - "shipments:read"

    - rule_id: SCOPE-API-002
      name: "Webhook Scope"
      description: "Webhooks receive scoped payloads"
      implementation:
        - "Webhook config defines event types"
        - "Payload includes only permitted fields"
        - "Sensitive fields omitted based on scope"

  aggregate_scope:
    - rule_id: SCOPE-AGG-001
      name: "Report Aggregation Level"
      description: "Reports aggregate to user's access level"
      implementation:
        - "Location-scoped user: location totals"
        - "All-location user: company totals"
        - "Division user: division totals"

    - rule_id: SCOPE-AGG-002
      name: "Dashboard KPI Scope"
      description: "KPIs reflect user's data scope"
      implementation:
        - "SQL aggregates include scope filters"
        - "UI indicates scope (e.g., 'Chicago' vs 'All Locations')"
```

---

## 3. Module Toggles — JSON Array

```json
{
  "module_toggles": [
    {
      "module_id": "MOD-CORE",
      "name": "Core Platform",
      "description": "Base platform functionality",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "CORE-AUTH",
          "name": "Authentication",
          "required": true,
          "configurable": false
        },
        {
          "feature_id": "CORE-USERS",
          "name": "User Management",
          "required": true,
          "configurable": false
        },
        {
          "feature_id": "CORE-ROLES",
          "name": "Role-Based Access",
          "required": true,
          "configurable": false
        },
        {
          "feature_id": "CORE-AUDIT",
          "name": "Audit Logging",
          "required": true,
          "configurable": false
        }
      ]
    },
    {
      "module_id": "MOD-PRODUCTS",
      "name": "Product Catalog",
      "description": "Product master data and pricing",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "PROD-CATALOG",
          "name": "Product Catalog",
          "required": true
        },
        {
          "feature_id": "PROD-GRADES",
          "name": "Material Grades",
          "required": true
        },
        {
          "feature_id": "PROD-PRICING",
          "name": "List Pricing",
          "required": true
        },
        {
          "feature_id": "PROD-CONTRACTS",
          "name": "Contract Pricing",
          "required": false,
          "default": true
        },
        {
          "feature_id": "PROD-COMMODITY",
          "name": "Commodity Pricing Integration",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        }
      ]
    },
    {
      "module_id": "MOD-INVENTORY",
      "name": "Inventory Management",
      "description": "Stock tracking and warehouse management",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "INV-TRACKING",
          "name": "Inventory Tracking",
          "required": true
        },
        {
          "feature_id": "INV-LOCATIONS",
          "name": "Multi-Location",
          "required": false,
          "default": true
        },
        {
          "feature_id": "INV-BINS",
          "name": "Bin Locations",
          "required": false,
          "default": true
        },
        {
          "feature_id": "INV-HEATS",
          "name": "Heat/Lot Tracking",
          "required": false,
          "default": true
        },
        {
          "feature_id": "INV-CYCLE",
          "name": "Cycle Counting",
          "required": false,
          "default": true
        },
        {
          "feature_id": "INV-BARCODE",
          "name": "Barcode Scanning",
          "required": false,
          "default": true
        },
        {
          "feature_id": "INV-RFID",
          "name": "RFID Integration",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-ORDERS",
      "name": "Order Management",
      "description": "Sales order processing",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "ORD-ENTRY",
          "name": "Order Entry",
          "required": true
        },
        {
          "feature_id": "ORD-POS",
          "name": "POS/Counter Sales",
          "required": false,
          "default": true
        },
        {
          "feature_id": "ORD-QUOTES",
          "name": "Quoting",
          "required": false,
          "default": true
        },
        {
          "feature_id": "ORD-BLANKET",
          "name": "Blanket Orders",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "ORD-APPROVAL",
          "name": "Order Approval Workflow",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "ORD-EDI",
          "name": "EDI Order Import",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-CUSTOMERS",
      "name": "Customer Management",
      "description": "Customer accounts and relationships",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "CUST-ACCOUNTS",
          "name": "Customer Accounts",
          "required": true
        },
        {
          "feature_id": "CUST-DIVISIONS",
          "name": "Multi-Division Customers",
          "required": false,
          "default": true
        },
        {
          "feature_id": "CUST-CREDIT",
          "name": "Credit Management",
          "required": false,
          "default": true
        },
        {
          "feature_id": "CUST-PORTAL",
          "name": "Customer Portal",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        }
      ]
    },
    {
      "module_id": "MOD-PROCESSING",
      "name": "Processing & Shop Floor",
      "description": "Cut-to-length, slitting, fabrication",
      "required": false,
      "can_disable": true,
      "default": true,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "PROC-WORKORDERS",
          "name": "Work Orders",
          "required": true
        },
        {
          "feature_id": "PROC-ROUTING",
          "name": "Operation Routing",
          "required": true
        },
        {
          "feature_id": "PROC-SCHEDULING",
          "name": "Production Scheduling",
          "required": false,
          "default": true
        },
        {
          "feature_id": "PROC-HMI",
          "name": "Shop Floor HMI",
          "required": false,
          "default": true
        },
        {
          "feature_id": "PROC-REMNANTS",
          "name": "Remnant Management",
          "required": false,
          "default": true
        },
        {
          "feature_id": "PROC-NESTING",
          "name": "Nesting Optimization",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "PROC-OEE",
          "name": "OEE Tracking",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "PROC-PLC",
          "name": "PLC Integration",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ],
      "dependencies": ["MOD-INVENTORY"]
    },
    {
      "module_id": "MOD-QAQC",
      "name": "Quality Assurance",
      "description": "Inspection and quality control",
      "required": false,
      "can_disable": true,
      "default": true,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "QA-INSPECTION",
          "name": "Inspection Records",
          "required": true
        },
        {
          "feature_id": "QA-HOLD",
          "name": "Material Hold",
          "required": true
        },
        {
          "feature_id": "QA-NCR",
          "name": "Non-Conformance Reports",
          "required": false,
          "default": true
        },
        {
          "feature_id": "QA-COC",
          "name": "Certificate of Conformance",
          "required": false,
          "default": true
        },
        {
          "feature_id": "QA-SPC",
          "name": "Statistical Process Control",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        },
        {
          "feature_id": "QA-CALIBRATION",
          "name": "Equipment Calibration",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-SHIPPING",
      "name": "Shipping & Logistics",
      "description": "Order fulfillment and delivery",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "SHIP-PICKING",
          "name": "Pick/Pack",
          "required": true
        },
        {
          "feature_id": "SHIP-STAGING",
          "name": "Staging",
          "required": true
        },
        {
          "feature_id": "SHIP-BOL",
          "name": "Bill of Lading",
          "required": true
        },
        {
          "feature_id": "SHIP-WILLCALL",
          "name": "Will-Call Management",
          "required": false,
          "default": true
        },
        {
          "feature_id": "SHIP-CARRIER",
          "name": "Carrier Integration",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "SHIP-ROUTING",
          "name": "Route Optimization",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        },
        {
          "feature_id": "SHIP-TRACKING",
          "name": "Real-Time Tracking",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-RECEIVING",
      "name": "Receiving",
      "description": "Purchase order receipt and inspection",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "RECV-PO",
          "name": "PO Receipt",
          "required": true
        },
        {
          "feature_id": "RECV-INSPECT",
          "name": "Receiving Inspection",
          "required": false,
          "default": true
        },
        {
          "feature_id": "RECV-PUTAWAY",
          "name": "Directed Put-Away",
          "required": false,
          "default": true
        },
        {
          "feature_id": "RECV-ASN",
          "name": "ASN Processing",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-PURCHASING",
      "name": "Purchasing",
      "description": "Purchase order management",
      "required": false,
      "can_disable": true,
      "default": true,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "PURCH-PO",
          "name": "Purchase Orders",
          "required": true
        },
        {
          "feature_id": "PURCH-VENDORS",
          "name": "Vendor Management",
          "required": true
        },
        {
          "feature_id": "PURCH-APPROVAL",
          "name": "PO Approval Workflow",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "PURCH-RFQ",
          "name": "RFQ Management",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "PURCH-FORECAST",
          "name": "Demand Forecasting",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-BILLING",
      "name": "Billing & Finance",
      "description": "Invoicing and accounts receivable",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "BILL-INVOICE",
          "name": "Invoicing",
          "required": true
        },
        {
          "feature_id": "BILL-AR",
          "name": "Accounts Receivable",
          "required": true
        },
        {
          "feature_id": "BILL-PAYMENTS",
          "name": "Payment Processing",
          "required": false,
          "default": true
        },
        {
          "feature_id": "BILL-CREDIT",
          "name": "Credit Memos",
          "required": false,
          "default": true
        },
        {
          "feature_id": "BILL-AP",
          "name": "Accounts Payable",
          "required": false,
          "default": false
        },
        {
          "feature_id": "BILL-GL",
          "name": "GL Integration",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "BILL-TAX",
          "name": "Tax Engine Integration",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        }
      ]
    },
    {
      "module_id": "MOD-REPORTS",
      "name": "Reporting & Analytics",
      "description": "Business intelligence and reporting",
      "required": true,
      "can_disable": false,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "RPT-STANDARD",
          "name": "Standard Reports",
          "required": true
        },
        {
          "feature_id": "RPT-DASHBOARD",
          "name": "Dashboards",
          "required": true
        },
        {
          "feature_id": "RPT-CUSTOM",
          "name": "Custom Reports",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "RPT-SCHEDULED",
          "name": "Scheduled Reports",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "RPT-BI",
          "name": "BI Tool Integration",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-TRACEABILITY",
      "name": "Traceability",
      "description": "Heat tracking and provenance",
      "required": false,
      "can_disable": true,
      "default": true,
      "tier_availability": ["STARTER", "PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "TRACE-HEAT",
          "name": "Heat/Lot Tracking",
          "required": true
        },
        {
          "feature_id": "TRACE-MTR",
          "name": "MTR Management",
          "required": true
        },
        {
          "feature_id": "TRACE-GENEALOGY",
          "name": "Material Genealogy",
          "required": false,
          "default": true
        },
        {
          "feature_id": "TRACE-RECALL",
          "name": "Recall Support",
          "required": false,
          "default": false,
          "tier_minimum": "PROFESSIONAL"
        },
        {
          "feature_id": "TRACE-BLOCKCHAIN",
          "name": "Blockchain Verification",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ],
      "dependencies": ["MOD-INVENTORY"]
    },
    {
      "module_id": "MOD-API",
      "name": "API & Integrations",
      "description": "External system integration",
      "required": false,
      "can_disable": true,
      "default": false,
      "tier_availability": ["PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "API-REST",
          "name": "REST API Access",
          "required": true
        },
        {
          "feature_id": "API-WEBHOOKS",
          "name": "Webhooks",
          "required": false,
          "default": true
        },
        {
          "feature_id": "API-EDI",
          "name": "EDI Integration",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        },
        {
          "feature_id": "API-ERP",
          "name": "ERP Integration",
          "required": false,
          "default": false,
          "tier_minimum": "ENTERPRISE"
        }
      ]
    },
    {
      "module_id": "MOD-MOBILE",
      "name": "Mobile Applications",
      "description": "Mobile device support",
      "required": false,
      "can_disable": true,
      "default": false,
      "tier_availability": ["PROFESSIONAL", "ENTERPRISE"],
      "features": [
        {
          "feature_id": "MOB-WAREHOUSE",
          "name": "Warehouse Mobile",
          "required": false,
          "default": true
        },
        {
          "feature_id": "MOB-SHOPFLOOR",
          "name": "Shop Floor Mobile",
          "required": false,
          "default": true
        },
        {
          "feature_id": "MOB-DRIVER",
          "name": "Driver Mobile",
          "required": false,
          "default": false
        },
        {
          "feature_id": "MOB-SALES",
          "name": "Sales Mobile",
          "required": false,
          "default": false
        }
      ]
    },
    {
      "module_id": "MOD-AI",
      "name": "AI & Machine Learning",
      "description": "Intelligent automation features",
      "required": false,
      "can_disable": true,
      "default": false,
      "tier_availability": ["ENTERPRISE"],
      "features": [
        {
          "feature_id": "AI-DEMAND",
          "name": "Demand Forecasting",
          "required": false,
          "default": false
        },
        {
          "feature_id": "AI-PRICING",
          "name": "Dynamic Pricing",
          "required": false,
          "default": false
        },
        {
          "feature_id": "AI-SCHEDULE",
          "name": "Smart Scheduling",
          "required": false,
          "default": false
        },
        {
          "feature_id": "AI-QUALITY",
          "name": "Predictive Quality",
          "required": false,
          "default": false
        },
        {
          "feature_id": "AI-ASSISTANT",
          "name": "AI Assistant",
          "required": false,
          "default": false
        }
      ]
    }
  ],

  "tier_definitions": [
    {
      "tier_id": "STARTER",
      "name": "Starter",
      "description": "Basic functionality for small operations",
      "max_users": 10,
      "max_locations": 1,
      "included_modules": [
        "MOD-CORE",
        "MOD-PRODUCTS",
        "MOD-INVENTORY",
        "MOD-ORDERS",
        "MOD-CUSTOMERS",
        "MOD-SHIPPING",
        "MOD-RECEIVING",
        "MOD-BILLING",
        "MOD-REPORTS"
      ],
      "optional_modules": [
        "MOD-PROCESSING",
        "MOD-QAQC",
        "MOD-PURCHASING",
        "MOD-TRACEABILITY"
      ]
    },
    {
      "tier_id": "PROFESSIONAL",
      "name": "Professional",
      "description": "Full functionality for growing operations",
      "max_users": 50,
      "max_locations": 5,
      "included_modules": [
        "MOD-CORE",
        "MOD-PRODUCTS",
        "MOD-INVENTORY",
        "MOD-ORDERS",
        "MOD-CUSTOMERS",
        "MOD-PROCESSING",
        "MOD-QAQC",
        "MOD-SHIPPING",
        "MOD-RECEIVING",
        "MOD-PURCHASING",
        "MOD-BILLING",
        "MOD-REPORTS",
        "MOD-TRACEABILITY",
        "MOD-API"
      ],
      "optional_modules": [
        "MOD-MOBILE"
      ]
    },
    {
      "tier_id": "ENTERPRISE",
      "name": "Enterprise",
      "description": "Full platform with advanced features",
      "max_users": null,
      "max_locations": null,
      "included_modules": [
        "MOD-CORE",
        "MOD-PRODUCTS",
        "MOD-INVENTORY",
        "MOD-ORDERS",
        "MOD-CUSTOMERS",
        "MOD-PROCESSING",
        "MOD-QAQC",
        "MOD-SHIPPING",
        "MOD-RECEIVING",
        "MOD-PURCHASING",
        "MOD-BILLING",
        "MOD-REPORTS",
        "MOD-TRACEABILITY",
        "MOD-API",
        "MOD-MOBILE"
      ],
      "optional_modules": [
        "MOD-AI"
      ]
    }
  ],

  "feature_flags": [
    {
      "flag_id": "FF-BETA-FEATURES",
      "name": "Beta Features",
      "description": "Enable beta/preview features",
      "scope": "tenant",
      "default": false
    },
    {
      "flag_id": "FF-DARK-MODE",
      "name": "Dark Mode UI",
      "description": "Enable dark mode interface",
      "scope": "user",
      "default": false
    },
    {
      "flag_id": "FF-NEW-SCHEDULER",
      "name": "New Scheduler UI",
      "description": "Enable redesigned scheduling interface",
      "scope": "tenant",
      "default": false
    },
    {
      "flag_id": "FF-AI-SUGGESTIONS",
      "name": "AI Suggestions",
      "description": "Enable AI-powered suggestions",
      "scope": "tenant",
      "default": false,
      "requires_module": "MOD-AI"
    },
    {
      "flag_id": "FF-VOICE-INPUT",
      "name": "Voice Input",
      "description": "Enable voice input for shop floor",
      "scope": "location",
      "default": false
    }
  ]
}
```

---

## 4. Tenant Visibility — Table

### Internal Data Visibility by Tenant Type

| Data Category | SINGLE_TENANT | MULTI_LOCATION | ENTERPRISE | WHITE_LABEL |
|---------------|:-------------:|:--------------:|:----------:|:-----------:|
| **Own Tenant Data** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Other Tenant Data** | ❌ None | ❌ None | ❌ None | ❌ None |
| **Shared Catalog (Grades)** | ✅ Read | ✅ Read | ✅ Read/Write | ✅ Read |
| **System UoM** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **Custom UoM** | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| **Carrier Master** | ✅ Read | ✅ Read | ✅ Read/Add | ✅ Read |
| **Mill Master** | ✅ Read | ✅ Read | ✅ Read/Add | ✅ Read |
| **Report Templates** | ✅ System | ✅ System+Own | ✅ All | ✅ System+Own |
| **Document Templates** | ✅ System | ✅ System+Own | ✅ All | ✅ Own Only |
| **API Keys** | ❌ N/A | ✅ Own | ✅ Own | ✅ Own |
| **Webhooks** | ❌ N/A | ✅ Own | ✅ Own | ✅ Own |
| **Usage Analytics** | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| **Benchmark Data** | ❌ None | 📊 Anonymized | 📊 Anonymized | ❌ None |

### Cross-Tenant Data Sharing Rules

| Sharing Scenario | Allowed | Conditions | Data Exposed |
|------------------|:-------:|------------|--------------|
| **Customer references across tenants** | ❌ | N/A | None |
| **Vendor/Mill shared catalog** | ✅ | Opt-in by tenant | Mill name, contact, certifications |
| **Carrier shared catalog** | ✅ | System maintained | Carrier name, SCAC, tracking URL |
| **Grade specifications** | ✅ | System maintained | ASTM/SAE specs, chemistry |
| **Benchmark analytics** | ✅ | Opt-in, anonymized | Aggregate metrics only |
| **Support access** | ✅ | Support ticket, time-limited | Read-only with audit |
| **Data migration** | ✅ | Admin request | Export only, no cross-tenant |

### Portal User Visibility by Account Type

| Data Type | SINGLE_DIVISION | MULTI_DIVISION | NATIONAL_ACCOUNT | HOLDING_COMPANY |
|-----------|:---------------:|:--------------:|:----------------:|:---------------:|
| **Own Division Orders** | ✅ | ✅ | ✅ | ✅ |
| **Other Division Orders** | ❌ | ⚙️ Config | ⚙️ Config | ✅ All |
| **Division Ship-Tos** | ✅ | ✅ Filtered | ✅ Filtered | ✅ All |
| **Shared Ship-Tos** | ✅ | ✅ | ✅ | ✅ |
| **Division Invoices** | ✅ | ✅ Filtered | ✅ Filtered | ✅ All |
| **Division AR Balance** | ✅ | ⚙️ Config | ⚙️ Config | ✅ All |
| **Contract Pricing** | ✅ Own | ✅ Own Div | ✅ All Divs | ✅ All |
| **Consolidated Reports** | ❌ | ⚙️ Config | ✅ | ✅ |
| **User Management** | ❌ | ❌ | ✅ Division | ✅ All |

### Location-Based Data Visibility

| User Location Access | Inventory | Work Orders | Shipments | Receiving | Reports |
|---------------------|:---------:|:-----------:|:---------:|:---------:|:-------:|
| **Single Location** | Own Loc | Own Loc | Own Loc | Own Loc | Own Loc |
| **Multi-Location (Assigned)** | Assigned | Assigned | Assigned | Assigned | Assigned |
| **Regional (Location Group)** | Region | Region | Region | Region | Region Agg |
| **All Locations** | All | All | All | All | All + Agg |
| **View-Only Cross-Location** | All (RO) | All (RO) | All (RO) | All (RO) | All |

### Sensitive Data Visibility Matrix

| Sensitive Field | Counter Sales | Inside Sales | Sales Mgr | Branch Mgr | Finance | Admin |
|-----------------|:-------------:|:------------:|:---------:|:----------:|:-------:|:-----:|
| **Product Cost** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Inventory Cost** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Order Margin %** | ❌ | ❌ | ✅ Own | ✅ | ✅ | ✅ |
| **Customer Credit Limit** | ⚠️ Current | ✅ Assigned | ✅ | ✅ | ✅ | ✅ |
| **Customer AR Balance** | ⚠️ Current | ✅ Assigned | ✅ | ✅ | ✅ | ✅ |
| **Customer Payment History** | ❌ | ❌ | ✅ Assigned | ✅ | ✅ | ✅ |
| **Vendor Pricing** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Employee Salary** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **User Login Activity** | ❌ | ❌ | ❌ | ⚠️ Team | ✅ | ✅ |
| **Audit Logs** | ❌ | ❌ | ❌ | ⚠️ Location | ✅ | ✅ |
| **API Keys** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Integration Credentials** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Legend for Visibility Tables

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access |
| ❌ | No access |
| ⚠️ | Conditional/partial access |
| ⚙️ | Configurable per account |
| 📊 | Aggregate/anonymized only |
| RO | Read-only |
| Own | Own records only |
| Loc | Location-scoped |
| Div | Division-scoped |
| Agg | Aggregated view |

### Tenant Configuration Options

```json
{
  "tenant_visibility_config": {
    "allow_cross_division_view": {
      "type": "boolean",
      "default": false,
      "description": "Allow portal users to see other divisions' orders",
      "configurable_by": ["PORTAL_ADMIN", "PORTAL_OWNER"]
    },
    "share_ship_tos_across_divisions": {
      "type": "boolean",
      "default": true,
      "description": "Ship-to addresses shared across all divisions",
      "configurable_by": ["PORTAL_OWNER"]
    },
    "consolidated_invoicing": {
      "type": "boolean",
      "default": false,
      "description": "Consolidate invoices across divisions",
      "configurable_by": ["INTERNAL_ADMIN"]
    },
    "show_margin_to_sales": {
      "type": "boolean",
      "default": false,
      "description": "Show margin percentage to sales roles",
      "configurable_by": ["INTERNAL_ADMIN"]
    },
    "require_po_for_orders": {
      "type": "boolean",
      "default": false,
      "description": "Require customer PO number on all orders",
      "configurable_by": ["INTERNAL_ADMIN"]
    },
    "allow_api_access": {
      "type": "boolean",
      "default": false,
      "description": "Enable API access for this tenant",
      "configurable_by": ["SUPER_ADMIN"],
      "requires_tier": "PROFESSIONAL"
    },
    "benchmark_opt_in": {
      "type": "boolean",
      "default": false,
      "description": "Share anonymized data for industry benchmarks",
      "configurable_by": ["SUPER_ADMIN"]
    },
    "support_access_enabled": {
      "type": "boolean",
      "default": true,
      "description": "Allow support team read access with audit",
      "configurable_by": ["SUPER_ADMIN"]
    }
  }
}
```

---

*Document generated for AI-build Phase 10: Permissions & Modules*
