# Phase 10: Access Control & Permissions Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Platform Architecture Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the comprehensive access control architecture for the SteelWise multi-division service center platform. It establishes how users interact with the system based on:

- **What they can do** (Role-based permissions)
- **What they can see** (Division and location scoping)
- **What features are available** (Module toggles)
- **Where they access from** (Internal vs Customer portal)

**Design Principles:**
- **Least Privilege** - Users get minimum access needed for their job
- **Defense in Depth** - Multiple layers of access control
- **Auditable** - Every access decision is logged
- **Flexible** - Configuration without code changes

---

## 2. ACCESS CONTROL LAYERS

### 2.1 Five-Layer Access Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ACCESS CONTROL LAYERS                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 5: MODULE TOGGLES                                                  │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Is this feature enabled for this company/division?                       │ │
│  │  Example: "Traceability module is OFF for Supplies division"             │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 4: PORTAL/CHANNEL                                                  │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Is this an internal user or customer portal user?                        │ │
│  │  Example: "Customer portal cannot access shop floor screens"             │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 3: DIVISION SCOPE                                                  │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Which divisions can this user access?                                    │ │
│  │  Example: "User can only see Steel and Aluminum divisions"               │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 2: LOCATION SCOPE                                                  │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Which locations can this user access?                                    │ │
│  │  Example: "User can only see Houston and Dallas locations"               │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 1: ROLE PERMISSIONS                                                │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  What actions can this role perform?                                      │ │
│  │  Example: "Operator role can start/stop jobs but not void orders"        │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════ │
│                                                                                 │
│  ACCESS DECISION: All layers must PASS for access to be granted               │
│                                                                                 │
│  Check Order:                                                                   │
│  1. Is module enabled? → NO → Block (feature unavailable)                      │
│  2. Is portal allowed? → NO → Block (wrong channel)                            │
│  3. Is division in scope? → NO → Block (data not visible)                      │
│  4. Is location in scope? → NO → Block (data not visible)                      │
│  5. Does role permit action? → NO → Block (permission denied)                  │
│  6. All YES → ALLOW                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Access Decision Flow

```typescript
interface AccessDecision {
  allowed: boolean;
  reason?: string;
  layer?: 'MODULE' | 'PORTAL' | 'DIVISION' | 'LOCATION' | 'PERMISSION';
}

async function checkAccess(
  user: User,
  action: string,
  resource: Resource,
  context: RequestContext
): Promise<AccessDecision> {
  
  // Layer 5: Module Toggle
  if (!isModuleEnabled(resource.module, context.divisionId)) {
    return { allowed: false, reason: 'Module not enabled', layer: 'MODULE' };
  }
  
  // Layer 4: Portal/Channel
  if (!isPortalAllowed(context.portal, resource.module)) {
    return { allowed: false, reason: 'Not available in this portal', layer: 'PORTAL' };
  }
  
  // Layer 3: Division Scope
  if (!userHasDivisionAccess(user, resource.divisionId)) {
    return { allowed: false, reason: 'Division access denied', layer: 'DIVISION' };
  }
  
  // Layer 2: Location Scope
  if (resource.locationId && !userHasLocationAccess(user, resource.locationId)) {
    return { allowed: false, reason: 'Location access denied', layer: 'LOCATION' };
  }
  
  // Layer 1: Role Permission
  if (!roleHasPermission(user.roles, action, resource.type)) {
    return { allowed: false, reason: 'Permission denied', layer: 'PERMISSION' };
  }
  
  return { allowed: true };
}
```

---

## 3. MODULE TOGGLES

### 3.1 Module Definition

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MODULE TOGGLE SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Modules can be toggled at two levels:                                          │
│                                                                                 │
│  1. COMPANY LEVEL                                                               │
│     └── Is module licensed/purchased for this company?                          │
│                                                                                 │
│  2. DIVISION LEVEL                                                              │
│     └── Is module relevant for this division?                                   │
│         (e.g., Traceability ON for Steel, OFF for Supplies)                    │
│                                                                                 │
│  Logic: Module available = Company.enabled AND Division.enabled                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Module Toggle Table

| Module | Code | Description | Default | Steel | Aluminum | Plastics | Supplies |
|--------|------|-------------|:-------:|:-----:|:--------:|:--------:|:--------:|
| **Order Management** | `ORD` | Quotes, orders, order lines | ON | ✓ | ✓ | ✓ | ✓ |
| **Point of Sale** | `POS` | Counter sales, will-call | ON | ✓ | ✓ | ✓ | ✓ |
| **Inventory** | `INV` | Stock tracking, locations | ON | ✓ | ✓ | ✓ | ✓ |
| **Receiving** | `RCV` | Inbound receipts | ON | ✓ | ✓ | ✓ | ✓ |
| **Shop Floor** | `SHP` | Work orders, job execution | ON | ✓ | ✓ | ✓ | ○ |
| **Scheduling** | `SCH` | Capacity planning, scheduling | ON | ✓ | ✓ | ✓ | ○ |
| **Traceability** | `TRC` | Heat/lot tracking, MTRs | ON | ✓ | ✓ | ○ | ○ |
| **QA/QC** | `QAC` | Quality inspection, certs | ON | ✓ | ✓ | ✓ | ○ |
| **Shipping** | `OUT` | Packaging, BOL, delivery | ON | ✓ | ✓ | ✓ | ✓ |
| **Billing** | `BIL` | Invoicing, payments | ON | ✓ | ✓ | ✓ | ✓ |
| **Customer Portal** | `CPT` | Customer self-service | OFF | ○ | ○ | ○ | ○ |
| **Analytics** | `ANL` | Reporting, dashboards | ON | ✓ | ✓ | ✓ | ✓ |
| **Pricing Engine** | `PRC` | Advanced pricing, contracts | OFF | ○ | ○ | ○ | ○ |
| **EDI** | `EDI` | Electronic data interchange | OFF | ○ | ○ | ○ | ○ |
| **API Access** | `API` | External integrations | OFF | ○ | ○ | ○ | ○ |

**Legend:** ✓ = Enabled by default | ○ = Disabled by default (optional)

### 3.3 Module Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODULE DEPENDENCIES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Some modules require other modules to be enabled:                              │
│                                                                                 │
│  Shop Floor (SHP)                                                               │
│  ├── Requires: Inventory (INV)                                                  │
│  └── Requires: Order Management (ORD)                                           │
│                                                                                 │
│  Scheduling (SCH)                                                               │
│  └── Requires: Shop Floor (SHP)                                                 │
│                                                                                 │
│  Traceability (TRC)                                                             │
│  └── Requires: Inventory (INV)                                                  │
│                                                                                 │
│  QA/QC (QAC)                                                                    │
│  ├── Requires: Shop Floor (SHP)                                                 │
│  └── Optional: Traceability (TRC) - Enhanced if enabled                         │
│                                                                                 │
│  Shipping (OUT)                                                                 │
│  └── Requires: Order Management (ORD)                                           │
│                                                                                 │
│  Billing (BIL)                                                                  │
│  └── Requires: Order Management (ORD)                                           │
│                                                                                 │
│  Customer Portal (CPT)                                                          │
│  └── Requires: Order Management (ORD)                                           │
│                                                                                 │
│  Analytics (ANL)                                                                │
│  └── No dependencies (reads from all enabled modules)                           │
│                                                                                 │
│  Pricing Engine (PRC)                                                           │
│  └── Requires: Order Management (ORD)                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Module Configuration Schema

```typescript
interface ModuleConfig {
  moduleCode: string;
  companyEnabled: boolean;
  divisionSettings: {
    [divisionId: string]: {
      enabled: boolean;
      settings?: Record<string, any>;  // Module-specific config
    };
  };
}

// Example configuration
const traceabilityModule: ModuleConfig = {
  moduleCode: 'TRC',
  companyEnabled: true,
  divisionSettings: {
    'STL': { enabled: true, settings: { requireMTR: true, dfarsRequired: true } },
    'ALU': { enabled: true, settings: { requireMTR: true, dfarsRequired: false } },
    'PLA': { enabled: false },
    'SUP': { enabled: false }
  }
};
```

---

## 4. ROLE-BASED ACCESS CONTROL (RBAC)

### 4.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ROLE HIERARCHY                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                          ┌─────────────────┐                                    │
│                          │  SYSTEM_ADMIN   │                                    │
│                          │  (God Mode)     │                                    │
│                          └────────┬────────┘                                    │
│                                   │                                             │
│              ┌────────────────────┼────────────────────┐                       │
│              │                    │                    │                       │
│      ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐               │
│      │ COMPANY_ADMIN │   │ DIVISION_MGR  │   │ LOCATION_MGR  │               │
│      │               │   │               │   │               │               │
│      └───────┬───────┘   └───────┬───────┘   └───────┬───────┘               │
│              │                   │                   │                        │
│              │         ┌─────────┴─────────┐         │                        │
│              │         │                   │         │                        │
│              │  ┌──────▼──────┐    ┌──────▼──────┐   │                        │
│              │  │  SALES_MGR  │    │   OPS_MGR   │   │                        │
│              │  └──────┬──────┘    └──────┬──────┘   │                        │
│              │         │                  │          │                        │
│       ┌──────┼─────────┼──────────────────┼──────────┼───────┐               │
│       │      │         │                  │          │       │               │
│  ┌────▼────┐ │  ┌──────▼──────┐   ┌──────▼──────┐   │ ┌─────▼─────┐         │
│  │  QC_MGR │ │  │ SALES_REP   │   │ SUPERVISOR  │   │ │ SCHEDULER │         │
│  └────┬────┘ │  └─────────────┘   └──────┬──────┘   │ └───────────┘         │
│       │      │                           │          │                        │
│       │      │                    ┌──────▼──────┐   │                        │
│       │      │                    │  OPERATOR   │   │                        │
│       │      │                    └─────────────┘   │                        │
│       │      │                                      │                        │
│  ┌────▼────┐ │  ┌─────────────┐   ┌─────────────┐   │  ┌─────────────┐      │
│  │QC_INSP  │ │  │   COUNTER   │   │   PACKER    │   │  │   DRIVER    │      │
│  └─────────┘ │  │   CLERK     │   │             │   │  │             │      │
│              │  └─────────────┘   └─────────────┘   │  └─────────────┘      │
│              │                                      │                        │
│              │  ┌─────────────┐                     │  ┌─────────────┐      │
│              │  │  RECEIVING  │                     │  │  SHIPPING   │      │
│              │  │   CLERK     │                     │  │   CLERK     │      │
│              │  └─────────────┘                     │  └─────────────┘      │
│              │                                      │                        │
│              └──────────────────────────────────────┘                        │
│                                                                               │
│  ════════════════════════════════════════════════════════════════════════    │
│                                                                               │
│  EXTERNAL ROLES (Customer Portal):                                           │
│                                                                               │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │
│  │ CUSTOMER_ADMIN  │   │  CUSTOMER_USER  │   │ CUSTOMER_VIEWER │            │
│  │ (Company admin) │   │ (Place orders)  │   │ (View only)     │            │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Role Definitions

| Role | Code | Description | Scope | Typical User |
|------|------|-------------|-------|--------------|
| **System Admin** | `SYS_ADMIN` | Full system access, configuration | Global | IT Admin |
| **Company Admin** | `CO_ADMIN` | Company-wide settings, all divisions | Company | Owner/CFO |
| **Division Manager** | `DIV_MGR` | Full access within division | Division | Division VP |
| **Location Manager** | `LOC_MGR` | Full access at location | Location | Branch Manager |
| **Sales Manager** | `SALES_MGR` | Manage sales team, pricing | Division | Sales Director |
| **Operations Manager** | `OPS_MGR` | Production oversight | Division/Location | Ops Director |
| **QC Manager** | `QC_MGR` | Quality oversight, cert management | Division | Quality Director |
| **Scheduler** | `SCHEDULER` | Capacity planning, scheduling | Location | Scheduler |
| **Sales Rep** | `SALES_REP` | Quotes, orders, customer mgmt | Division | Sales Person |
| **Supervisor** | `SUPERVISOR` | Shop floor oversight | Work Center | Shift Lead |
| **Operator** | `OPERATOR` | Execute jobs, record production | Work Center | Machine Operator |
| **Counter Clerk** | `COUNTER` | POS, will-call, walk-in sales | Location | Counter Staff |
| **Receiving Clerk** | `RECV_CLERK` | Inbound receipts | Location | Receiving Staff |
| **Packer** | `PACKER` | Packaging, labels | Location | Shipping Staff |
| **Shipping Clerk** | `SHIP_CLERK` | BOL, dispatch, carrier mgmt | Location | Shipping Staff |
| **Driver** | `DRIVER` | Delivery, POD capture | Route | Driver |
| **QC Inspector** | `QC_INSP` | Inspections, measurements | Location | QC Technician |
| **Customer Admin** | `CUST_ADMIN` | Manage customer users | Customer | Customer Manager |
| **Customer User** | `CUST_USER` | Place orders, view status | Customer | Customer Buyer |
| **Customer Viewer** | `CUST_VIEW` | View only access | Customer | Customer Staff |

### 4.3 Permission Categories

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PERMISSION CATEGORIES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Each resource has up to 6 permission types:                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   CREATE    - Create new records                                        │   │
│  │   READ      - View records                                              │   │
│  │   UPDATE    - Modify existing records                                   │   │
│  │   DELETE    - Remove records (soft delete)                              │   │
│  │   APPROVE   - Approve/reject workflows                                  │   │
│  │   ADMIN     - Configure settings, override rules                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Permission Format: {MODULE}_{RESOURCE}_{ACTION}                               │
│                                                                                 │
│  Examples:                                                                      │
│  • ORD_QUOTE_CREATE     - Create quotes                                        │
│  • ORD_ORDER_APPROVE    - Approve orders                                       │
│  • INV_ITEM_UPDATE      - Modify inventory                                     │
│  • SHP_JOB_DELETE       - Delete/void jobs                                     │
│  • BIL_INVOICE_ADMIN    - Configure billing                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. PERMISSIONS MATRIX

### 5.1 Order Management Permissions

| Permission | SYS | CO | DIV | LOC | SALES_M | SALES_R | COUNTER | CUST_A | CUST_U |
|------------|:---:|:--:|:---:|:---:|:-------:|:-------:|:-------:|:------:|:------:|
| `ORD_QUOTE_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ORD_QUOTE_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ORD_QUOTE_UPDATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `ORD_QUOTE_DELETE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `ORD_QUOTE_APPROVE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `ORD_ORDER_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ORD_ORDER_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ORD_ORDER_UPDATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `ORD_ORDER_CANCEL` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `ORD_ORDER_ADMIN` | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ | ○ | ○ |
| `ORD_PRICE_OVERRIDE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `ORD_DISCOUNT_APPLY` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |

**Legend:** ✓ = Granted | ○ = Not Granted

### 5.2 Inventory Permissions

| Permission | SYS | CO | DIV | LOC | OPS_M | SUPER | OPERATOR | RECV | CUST |
|------------|:---:|:--:|:---:|:---:|:-----:|:-----:|:--------:|:----:|:----:|
| `INV_ITEM_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `INV_ITEM_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `INV_ITEM_UPDATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `INV_ITEM_MOVE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `INV_ITEM_ADJUST` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `INV_ITEM_DELETE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `INV_COUNT_PERFORM` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `INV_COUNT_APPROVE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `INV_LOCATION_ADMIN` | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ | ○ |
| `INV_HEAT_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `INV_HEAT_UPDATE` | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ | ○ | ○ |

### 5.3 Shop Floor Permissions

| Permission | SYS | CO | DIV | LOC | OPS_M | SCHED | SUPER | OPERATOR |
|------------|:---:|:--:|:---:|:---:|:-----:|:-----:|:-----:|:--------:|
| `SHP_WORKORDER_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ |
| `SHP_WORKORDER_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `SHP_WORKORDER_UPDATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `SHP_WORKORDER_DELETE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `SHP_JOB_START` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ✓ |
| `SHP_JOB_COMPLETE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ✓ |
| `SHP_JOB_PAUSE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ✓ |
| `SHP_JOB_OVERRIDE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `SHP_SCRAP_RECORD` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ✓ |
| `SHP_SCRAP_APPROVE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `SHP_WORKCENTER_ADMIN` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `SHP_SCHEDULE_VIEW` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `SHP_SCHEDULE_EDIT` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ |

### 5.4 Shipping Permissions

| Permission | SYS | CO | DIV | LOC | OPS_M | SUPER | PACKER | SHIP | DRIVER |
|------------|:---:|:--:|:---:|:---:|:-----:|:-----:|:------:|:----:|:------:|
| `OUT_PACKAGE_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `OUT_PACKAGE_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `OUT_LABEL_PRINT` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `OUT_BOL_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `OUT_BOL_VOID` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `OUT_CARRIER_ASSIGN` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `OUT_DRIVER_CHECKIN` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `OUT_SHIPMENT_RELEASE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ |
| `OUT_POD_CAPTURE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ✓ |
| `OUT_DELIVERY_CONFIRM` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ✓ |

### 5.5 Billing Permissions

| Permission | SYS | CO | DIV | LOC | SALES_M | OPS_M | SHIP | CUST_A | CUST_U |
|------------|:---:|:--:|:---:|:---:|:-------:|:-----:|:----:|:------:|:------:|
| `BIL_INVOICE_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `BIL_INVOICE_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `BIL_INVOICE_SEND` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `BIL_INVOICE_VOID` | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ | ○ | ○ |
| `BIL_PAYMENT_RECORD` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `BIL_PAYMENT_PROCESS` | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ✓ | ✓ |
| `BIL_CREDIT_APPROVE` | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ | ○ |
| `BIL_REFUND_ISSUE` | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ | ○ |
| `BIL_PRICING_ADMIN` | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ | ○ |

### 5.6 Quality/Traceability Permissions

| Permission | SYS | CO | DIV | LOC | QC_M | QC_INSP | SUPER | OPERATOR |
|------------|:---:|:--:|:---:|:---:|:----:|:-------:|:-----:|:--------:|
| `QAC_INSPECTION_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `QAC_INSPECTION_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `QAC_INSPECTION_APPROVE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `QAC_HOLD_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| `QAC_HOLD_RELEASE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `QAC_NCR_CREATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `QAC_NCR_CLOSE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `TRC_HEAT_READ` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `TRC_MTR_UPLOAD` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ |
| `TRC_MTR_APPROVE` | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `TRC_CERT_GENERATE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ |

### 5.7 Administration Permissions

| Permission | SYS | CO | DIV | LOC | OPS_M | SALES_M | QC_M |
|------------|:---:|:--:|:---:|:---:|:-----:|:-------:|:----:|
| `ADM_USER_CREATE` | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `ADM_USER_UPDATE` | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `ADM_USER_DEACTIVATE` | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `ADM_ROLE_ASSIGN` | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| `ADM_DIVISION_CONFIG` | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| `ADM_LOCATION_CONFIG` | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ |
| `ADM_MODULE_TOGGLE` | ✓ | ✓ | ○ | ○ | ○ | ○ | ○ |
| `ADM_INTEGRATION_CONFIG` | ✓ | ✓ | ○ | ○ | ○ | ○ | ○ |
| `ADM_AUDIT_VIEW` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ADM_AUDIT_EXPORT` | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |

---

## 6. DIVISION-BASED ACCESS

### 6.1 Division Scoping Rules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DIVISION SCOPING RULES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULE 1: PRIMARY DIVISION                                                       │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Every user has a primary division that determines their default data view.     │
│                                                                                 │
│  Example: User "John" has primaryDivision: "STL"                                │
│  • When John logs in, he sees Steel division data by default                   │
│  • UI division selector shows "Steel" pre-selected                             │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 2: ADDITIONAL DIVISIONS                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Users can have access to additional divisions beyond their primary.            │
│                                                                                 │
│  Example: User "John" has additionalDivisions: ["ALU", "SUP"]                  │
│  • John can switch context to Aluminum or Supplies                             │
│  • Permissions may differ per division                                         │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 3: ALL DIVISIONS ACCESS                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Certain roles (Company Admin, System Admin) have all-division access.         │
│                                                                                 │
│  Example: Company Admin can see and manage all divisions                       │
│  • No division filter applied to queries                                       │
│  • Can run cross-division reports                                              │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 4: DIVISION DATA ISOLATION                                                │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Data queries are automatically filtered by active division context.           │
│                                                                                 │
│  API Request: GET /api/orders                                                  │
│  Header: X-Division-Context: STL                                               │
│  Query: SELECT * FROM orders WHERE division_id = 'STL' AND ...                 │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 5: CROSS-DIVISION REFERENCES                                              │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Some entities (Customer, Vendor, Heat) are visible across divisions.          │
│                                                                                 │
│  Example: Customer "ACME" exists globally                                       │
│  • Visible from any division                                                   │
│  • Division-specific settings (pricing, terms) scoped to active division      │
│  • Orders for ACME scoped to issuing division                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Division Access Configuration

```typescript
interface UserDivisionAccess {
  userId: string;
  primaryDivisionId: string;          // Default division
  additionalDivisionIds: string[];    // Other allowed divisions
  allDivisionsAccess: boolean;        // Override for admins
  
  // Per-division role overrides (optional)
  divisionRoleOverrides?: {
    [divisionId: string]: {
      additionalPermissions?: string[];
      restrictedPermissions?: string[];
    };
  };
}

// Example: Sales manager for Steel, read-only for Aluminum
const userAccess: UserDivisionAccess = {
  userId: 'user-123',
  primaryDivisionId: 'STL',
  additionalDivisionIds: ['ALU'],
  allDivisionsAccess: false,
  divisionRoleOverrides: {
    'ALU': {
      restrictedPermissions: ['ORD_ORDER_CREATE', 'ORD_QUOTE_CREATE']
    }
  }
};
```

---

## 7. LOCATION-BASED ACCESS

### 7.1 Location Scoping Rules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LOCATION SCOPING RULES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULE 1: PRIMARY LOCATION                                                       │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Users have a primary work location that determines their physical context.     │
│                                                                                 │
│  Example: Operator "Mike" has primaryLocation: "HOU"                            │
│  • Mike sees Houston work centers and jobs by default                          │
│  • Mike's actions are logged to Houston location                               │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 2: LOCATION-SPECIFIC DATA                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Certain data types are strictly location-scoped:                              │
│                                                                                 │
│  • Inventory Items      - Physical stock at a location                         │
│  • Work Centers         - Equipment at a location                              │
│  • Bin Locations        - Storage at a location                                │
│  • Jobs (active)        - Work being performed at a location                   │
│  • Shipments (outbound) - Leaving from a location                              │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 3: MULTI-LOCATION ACCESS                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Managers may have access to multiple locations.                               │
│                                                                                 │
│  Example: Regional Manager has locations: ["HOU", "DAL", "AUS"]                │
│  • Can view data from all three locations                                      │
│  • Can run reports across locations                                            │
│  • Location context required for creating data                                 │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 4: LOCATION-AGNOSTIC DATA                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Some data is visible regardless of location:                                  │
│                                                                                 │
│  • Customers             - Global customer master                              │
│  • Products              - Catalog (may have location availability)            │
│  • Orders (read)         - Can view orders from other locations                │
│  • Heats/Materials       - Reference data                                      │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  RULE 5: TRANSFER VISIBILITY                                                    │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Inter-location transfers are visible to both source and destination.          │
│                                                                                 │
│  Example: Transfer from HOU to DAL                                              │
│  • HOU users see as "Transfer Out"                                             │
│  • DAL users see as "Transfer In"                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Location Access Matrix by Role

| Role | Primary Location | Multi-Location | All Locations |
|------|:----------------:|:--------------:|:-------------:|
| System Admin | N/A | N/A | ✓ |
| Company Admin | N/A | N/A | ✓ |
| Division Manager | Optional | ✓ | Optional |
| Location Manager | ✓ | Optional | ○ |
| Operations Manager | ✓ | ✓ | ○ |
| Sales Manager | ✓ | ✓ | ○ |
| Scheduler | ✓ | Optional | ○ |
| Supervisor | ✓ | ○ | ○ |
| Operator | ✓ | ○ | ○ |
| Counter Clerk | ✓ | ○ | ○ |
| Receiving Clerk | ✓ | ○ | ○ |
| Shipping Clerk | ✓ | ○ | ○ |
| Driver | ✓ | ✓ (route) | ○ |

**Legend:** ✓ = Has this access type | ○ = Does not have

---

## 8. CUSTOMER PORTAL ACCESS

### 8.1 Portal Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     INTERNAL vs CUSTOMER PORTAL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┬─────────────────────────────────────────┐ │
│  │       INTERNAL PORTAL           │         CUSTOMER PORTAL                 │ │
│  │       (Employees)               │         (External Users)                │ │
│  ├─────────────────────────────────┼─────────────────────────────────────────┤ │
│  │                                 │                                         │ │
│  │  Full application access        │  Limited to customer-facing features    │ │
│  │                                 │                                         │ │
│  │  All modules available          │  Order, Quote, Shipping, Billing only   │ │
│  │                                 │                                         │ │
│  │  See all customers' data        │  See only their own data                │ │
│  │                                 │                                         │ │
│  │  Shop floor access              │  No shop floor access                   │ │
│  │                                 │                                         │ │
│  │  Inventory management           │  No inventory access                    │ │
│  │                                 │                                         │ │
│  │  Pricing/cost visibility        │  Sell price only (no cost)              │ │
│  │                                 │                                         │ │
│  │  Full editing capabilities      │  Limited editing (own orders)           │ │
│  │                                 │                                         │ │
│  │  Admin functions                │  No admin functions                     │ │
│  │                                 │                                         │ │
│  └─────────────────────────────────┴─────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Customer Portal Feature Matrix

| Feature | CUST_ADMIN | CUST_USER | CUST_VIEWER |
|---------|:----------:|:---------:|:-----------:|
| **Dashboard** | ✓ | ✓ | ✓ |
| View order history | ✓ | ✓ | ✓ |
| View order status | ✓ | ✓ | ✓ |
| Track shipments | ✓ | ✓ | ✓ |
| View invoices | ✓ | ✓ | ✓ |
| Download POD | ✓ | ✓ | ✓ |
| Download MTR/certs | ✓ | ✓ | ✓ |
| **Ordering** | | | |
| Create quotes | ✓ | ✓ | ○ |
| Place orders | ✓ | ✓ | ○ |
| Reorder from history | ✓ | ✓ | ○ |
| Upload RFQ | ✓ | ✓ | ○ |
| Cancel orders | ✓ | ○ | ○ |
| **Account Management** | | | |
| View account info | ✓ | ✓ | ✓ |
| Update contacts | ✓ | ○ | ○ |
| Add ship-to addresses | ✓ | ✓ | ○ |
| Manage users | ✓ | ○ | ○ |
| View credit status | ✓ | ○ | ○ |
| **Payments** | | | |
| Pay invoices online | ✓ | ✓ | ○ |
| View payment history | ✓ | ✓ | ✓ |
| Set up autopay | ✓ | ○ | ○ |

### 8.3 Customer Data Isolation

```typescript
// Customer portal queries are automatically scoped
interface CustomerPortalContext {
  portal: 'CUSTOMER';
  customerId: string;           // Customer they belong to
  customerUserId: string;       // Their user ID
  customerRole: CustomerRole;   // ADMIN, USER, or VIEWER
}

// Middleware automatically adds customer filter
async function customerScopeMiddleware(req, res, next) {
  if (req.context.portal === 'CUSTOMER') {
    // All queries filtered to this customer
    req.queryFilter.customerId = req.context.customerId;
    
    // Prevent access to internal-only resources
    const internalOnlyResources = ['inventory', 'workOrders', 'jobs', 'workCenters'];
    if (internalOnlyResources.includes(req.resource)) {
      return res.status(403).json({ error: 'Not available in customer portal' });
    }
  }
  next();
}

// Example: Customer viewing their orders
// GET /api/orders
// Internal user: SELECT * FROM orders WHERE division_id = :div
// Customer user: SELECT * FROM orders WHERE customer_id = :customerId
```

---

## 9. SCOPING RULES SUMMARY

### 9.1 Entity Scoping Matrix

| Entity | Division Scoped | Location Scoped | Customer Scoped | Portal Access |
|--------|:---------------:|:---------------:|:---------------:|:-------------:|
| **Company** | ○ | ○ | ○ | Internal |
| **Division** | ○ | ○ | ○ | Internal |
| **Location** | ○ | ○ | ○ | Internal |
| **User** | ✓ | ✓ | ○ | Internal |
| **Customer** | Shared | ○ | Self | Both |
| **Vendor** | Shared | ○ | ○ | Internal |
| **Product** | ✓ | ○ | ○ | Both |
| **Material** | Shared | ○ | ○ | Internal |
| **InventoryItem** | ✓ | ✓ | ○ | Internal |
| **Heat** | Shared | ○ | ○ | Internal |
| **Quote** | ✓ | ✓ | ✓ | Both |
| **Order** | ✓ | ✓ | ✓ | Both |
| **OrderLine** | ✓ | ✓ | ✓ | Both |
| **WorkOrder** | ✓ | ✓ | ○ | Internal |
| **Job** | ✓ | ✓ | ○ | Internal |
| **Package** | ✓ | ✓ | ✓ | Both |
| **Shipment** | ✓ | ✓ | ✓ | Both |
| **Invoice** | ✓ | ○ | ✓ | Both |
| **WorkCenter** | ✓ | ✓ | ○ | Internal |

**Legend:**
- ✓ = Strictly scoped to this dimension
- Shared = Visible across all, settings may be scoped
- Self = Customer portal users see only their own
- ○ = Not scoped by this dimension

### 9.2 Query Scoping Rules

```typescript
interface QueryScope {
  // Always applied based on user context
  divisionId?: string;          // Required if user not all-division
  locationId?: string;          // Required if entity is location-scoped
  customerId?: string;          // Required if portal is CUSTOMER
  
  // For cross-scope queries (requires permission)
  crossDivision?: boolean;      // Requires CROSS_DIVISION_READ permission
  crossLocation?: boolean;      // Requires CROSS_LOCATION_READ permission
  allCustomers?: boolean;       // Only for internal users
}

// Standard query builder
function buildQuery(baseQuery: Query, scope: QueryScope): Query {
  let query = baseQuery;
  
  // Division scope
  if (scope.divisionId && !scope.crossDivision) {
    query = query.where('division_id', scope.divisionId);
  }
  
  // Location scope (if entity is location-scoped)
  if (scope.locationId && !scope.crossLocation && entityIsLocationScoped(query.entity)) {
    query = query.where('location_id', scope.locationId);
  }
  
  // Customer scope (portal users)
  if (scope.customerId) {
    query = query.where('customer_id', scope.customerId);
  }
  
  // Soft delete filter
  query = query.whereNull('deleted_at');
  
  return query;
}
```

### 9.3 Write Scope Rules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WRITE SCOPE RULES                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULE: Users can only CREATE data within their accessible scope                 │
│                                                                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  Division Write Rules:                                                          │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  • New records inherit user's active division context                           │
│  • Cannot create in division without access                                     │
│  • Cross-division create requires explicit permission                          │
│                                                                                 │
│  Location Write Rules:                                                          │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  • Location-scoped entities require location selection                          │
│  • Must have access to target location                                          │
│  • Inventory creates require physical location                                  │
│                                                                                 │
│  Customer Portal Write Rules:                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  • Quotes/Orders auto-assigned to customer's account                           │
│  • Cannot specify different customer                                           │
│  • Division determined by product selection                                     │
│                                                                                 │
│  Example Validations:                                                           │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  User creates order:                                                            │
│  ✓ division_id = user's active division                                        │
│  ✓ location_id = user's primary location (or selected if multi-location)       │
│  ✓ customer_id = selected customer (internal) or own account (portal)          │
│                                                                                 │
│  User creates inventory item:                                                   │
│  ✓ division_id = user's active division                                        │
│  ✓ location_id = must match user's location access                             │
│  ✗ Cannot create at location without access                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. IMPLEMENTATION ARCHITECTURE

### 10.1 Permission Check Implementation

```typescript
// Permission service
class PermissionService {
  
  async checkAccess(
    user: User,
    permission: string,
    resource: ResourceContext
  ): Promise<PermissionResult> {
    
    // 1. Check module toggle
    const moduleEnabled = await this.checkModuleEnabled(
      permission,
      resource.divisionId
    );
    if (!moduleEnabled) {
      return { allowed: false, reason: 'MODULE_DISABLED' };
    }
    
    // 2. Check portal access
    const portalAllowed = await this.checkPortalAccess(
      user.portalType,
      permission
    );
    if (!portalAllowed) {
      return { allowed: false, reason: 'PORTAL_RESTRICTED' };
    }
    
    // 3. Check division scope
    if (resource.divisionId) {
      const divisionAccess = this.userHasDivisionAccess(
        user,
        resource.divisionId
      );
      if (!divisionAccess) {
        return { allowed: false, reason: 'DIVISION_DENIED' };
      }
    }
    
    // 4. Check location scope
    if (resource.locationId) {
      const locationAccess = this.userHasLocationAccess(
        user,
        resource.locationId
      );
      if (!locationAccess) {
        return { allowed: false, reason: 'LOCATION_DENIED' };
      }
    }
    
    // 5. Check role permission
    const rolePermission = await this.checkRolePermission(
      user.roles,
      permission,
      resource.divisionId  // Role may vary by division
    );
    if (!rolePermission) {
      return { allowed: false, reason: 'PERMISSION_DENIED' };
    }
    
    // All checks passed
    return { allowed: true };
  }
  
  private userHasDivisionAccess(user: User, divisionId: string): boolean {
    if (user.allDivisionsAccess) return true;
    if (user.primaryDivisionId === divisionId) return true;
    return user.additionalDivisionIds.includes(divisionId);
  }
  
  private userHasLocationAccess(user: User, locationId: string): boolean {
    if (user.allLocationsAccess) return true;
    if (user.primaryLocationId === locationId) return true;
    return user.additionalLocationIds.includes(locationId);
  }
}
```

### 10.2 UI Permission Integration

```typescript
// React hook for permission checks
function usePermission(permission: string): boolean {
  const { user, activeContext } = useAuth();
  const [allowed, setAllowed] = useState(false);
  
  useEffect(() => {
    const check = async () => {
      const result = await permissionService.checkAccess(
        user,
        permission,
        activeContext
      );
      setAllowed(result.allowed);
    };
    check();
  }, [user, permission, activeContext]);
  
  return allowed;
}

// Usage in component
function OrderActions({ order }: { order: Order }) {
  const canEdit = usePermission('ORD_ORDER_UPDATE');
  const canCancel = usePermission('ORD_ORDER_CANCEL');
  const canApprove = usePermission('ORD_ORDER_APPROVE');
  
  return (
    <div>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canCancel && <Button onClick={handleCancel}>Cancel</Button>}
      {canApprove && order.status === 'PENDING_APPROVAL' && (
        <Button onClick={handleApprove}>Approve</Button>
      )}
    </div>
  );
}
```

### 10.3 API Middleware Chain

```typescript
// Express middleware chain
app.use('/api/*', [
  // 1. Authenticate
  authMiddleware,
  
  // 2. Extract context
  contextMiddleware,  // Sets division, location from headers/session
  
  // 3. Module toggle check
  moduleToggleMiddleware,
  
  // 4. Portal restriction check
  portalRestrictionMiddleware,
  
  // 5. Apply scope filters
  scopeFilterMiddleware,
  
  // 6. Permission check (per-route)
  // Applied at route level via decorator
]);

// Route with permission requirement
router.post('/orders',
  requirePermission('ORD_ORDER_CREATE'),
  orderController.create
);

router.delete('/orders/:id',
  requirePermission('ORD_ORDER_CANCEL'),
  orderController.cancel
);
```

---

## 11. AUDIT LOGGING

### 11.1 Access Audit Trail

```typescript
interface AccessAuditLog {
  id: string;
  timestamp: Date;
  
  // Who
  userId: string;
  userName: string;
  userRoles: string[];
  portal: 'INTERNAL' | 'CUSTOMER';
  
  // What
  action: string;              // Permission code
  resource: string;            // Entity type
  resourceId?: string;         // Specific record
  
  // Context
  divisionId: string;
  locationId?: string;
  customerId?: string;         // If customer portal
  
  // Result
  allowed: boolean;
  deniedReason?: string;
  
  // Request details
  ipAddress: string;
  userAgent: string;
  requestPath: string;
  requestMethod: string;
}

// Log every access decision
async function logAccessDecision(
  context: RequestContext,
  permission: string,
  result: PermissionResult
) {
  await auditLog.create({
    timestamp: new Date(),
    userId: context.user.id,
    userName: context.user.name,
    userRoles: context.user.roles,
    portal: context.portal,
    action: permission,
    resource: context.resource,
    resourceId: context.resourceId,
    divisionId: context.divisionId,
    locationId: context.locationId,
    customerId: context.customerId,
    allowed: result.allowed,
    deniedReason: result.reason,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestPath: context.path,
    requestMethod: context.method
  });
}
```

---

## 12. CONFIGURATION MANAGEMENT

### 12.1 Admin UI for Permissions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ PERMISSION CONFIGURATION                               System Admin       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  TABS: [Roles] [Permissions] [Module Toggles] [Division Access] [Audit Log]   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ROLE: Sales Representative                               [Edit] [Copy] │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  Description: Standard sales role for order and quote management       │   │
│  │                                                                         │   │
│  │  PERMISSIONS:                                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ ORDER MANAGEMENT                                                │   │   │
│  │  │ ☑ ORD_QUOTE_CREATE    ☑ ORD_QUOTE_READ    ☑ ORD_QUOTE_UPDATE  │   │   │
│  │  │ ☐ ORD_QUOTE_DELETE    ☐ ORD_QUOTE_APPROVE                      │   │   │
│  │  │ ☑ ORD_ORDER_CREATE    ☑ ORD_ORDER_READ    ☑ ORD_ORDER_UPDATE  │   │   │
│  │  │ ☐ ORD_ORDER_CANCEL    ☐ ORD_ORDER_ADMIN                        │   │   │
│  │  │ ☐ ORD_PRICE_OVERRIDE  ☑ ORD_DISCOUNT_APPLY (up to 10%)        │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ INVENTORY                                                       │   │   │
│  │  │ ☐ INV_ITEM_CREATE     ☑ INV_ITEM_READ     ☐ INV_ITEM_UPDATE   │   │   │
│  │  │ ☐ INV_ITEM_MOVE       ☐ INV_ITEM_ADJUST   ☐ INV_ITEM_DELETE   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  DEFAULT SCOPE:                                                         │   │
│  │  Division: Primary only (can request additional)                       │   │
│  │  Location: Primary + assigned territories                              │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [+ Add Role] [Import/Export] [View Usage]                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Module Toggle Admin

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ MODULE TOGGLES                                          Company Admin      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  COMPANY: SteelWise Distribution                                               │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ MODULE             │ COMPANY │ STEEL │ ALUM │ PLASTIC │ SUPPLIES │      │   │
│  │ ───────────────────│─────────│───────│──────│─────────│──────────│      │   │
│  │ Order Management   │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  │ Point of Sale      │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  │ Inventory          │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  │ Receiving          │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  │ Shop Floor         │   ✓     │  ✓    │  ✓   │   ✓     │    ○     │      │   │
│  │ Scheduling         │   ✓     │  ✓    │  ✓   │   ✓     │    ○     │      │   │
│  │ Traceability       │   ✓     │  ✓    │  ✓   │   ○     │    ○     │ [⚙️] │   │
│  │ QA/QC              │   ✓     │  ✓    │  ✓   │   ✓     │    ○     │      │   │
│  │ Shipping           │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  │ Billing            │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  │ Customer Portal    │   ○     │  ○    │  ○   │   ○     │    ○     │ [⚙️] │   │
│  │ Analytics          │   ✓     │  ✓    │  ✓   │   ✓     │    ✓     │      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ✓ = Enabled  │  ○ = Disabled  │  [⚙️] = Has additional settings              │
│                                                                                 │
│  ⚠️ Changing module toggles may affect user access immediately                 │
│                                                                                 │
│  [Save Changes] [Reset to Defaults]                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. SUMMARY

### Key Principles

1. **Five-Layer Security** - Module → Portal → Division → Location → Permission
2. **Least Privilege** - Default to no access, grant explicitly
3. **Scope Isolation** - Data automatically filtered by context
4. **Audit Everything** - Every access decision logged
5. **Configurable** - Permissions and modules managed without code

### Quick Reference

| Access Layer | Controls | Configured By |
|--------------|----------|---------------|
| Module Toggle | Feature availability | Company/Division Admin |
| Portal | Internal vs Customer | System design |
| Division | Data visibility by BU | User assignment |
| Location | Data visibility by site | User assignment |
| Permission | Action authorization | Role assignment |

---

**End of Access Control & Permissions Architecture Specification**
