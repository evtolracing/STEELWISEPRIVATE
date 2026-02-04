# 90 - Maintenance & Reliability Module (CMMS-Lite)

> **Document Version**: 1.0  
> **Date**: February 4, 2026  
> **Author**: Principal Maintenance & Reliability Systems Architect  
> **Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document defines the **Maintenance & Reliability Module**—a comprehensive CMMS-lite system designed for multi-location metals and plastics service centers. The module manages equipment lifecycle, preventive maintenance, breakdown response, and reliability analytics while integrating tightly with dispatch, safety, and quality systems.

**Core Principle**: Equipment reliability is the foundation of schedule confidence. Maintenance work is safety-governed. Return-to-service requires verification and audit. Dispatch must respect asset status.

---

## A) Maintenance Philosophy & Objectives

### A.1 Maintenance Strategy Pyramid

```
┌─────────────────────────────────────────────────────────────────────┐
│                 MAINTENANCE STRATEGY PYRAMID                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                           ┌─────────┐                                │
│                           │ PREDICT │  ◄─── Condition-based          │
│                          /│   IVE   │\      (SPC, vibration, AI)     │
│                         / └─────────┘ \                              │
│                        /               \                             │
│                       /   ┌─────────┐   \                            │
│                      /    │PREVENTIVE│    \  ◄─── Time/Meter-based   │
│                     /     │   (PM)   │     \     (Scheduled)         │
│                    /      └─────────┘      \                         │
│                   /                         \                        │
│                  /       ┌───────────┐       \                       │
│                 /        │ CORRECTIVE │        \  ◄─── Fix when      │
│                /         │ (REACTIVE) │         \     broken         │
│               /          └───────────┘          \                    │
│              /                                   \                   │
│             /          ┌─────────────────┐        \                  │
│            /           │   RUN-TO-FAIL    │         \  ◄─── Non-     │
│           /            │ (Non-Critical)   │          \     critical  │
│          ─────────────────────────────────────────────               │
│                                                                      │
│  GOAL: Move UP the pyramid → Less reactive, more proactive          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### A.2 Module Objectives

| Objective | How Achieved | Success Metric |
|-----------|--------------|----------------|
| **Reduce Unplanned Downtime** | PM compliance, condition monitoring | ↓ 30% unplanned stops |
| **Standardize PM Programs** | Templates, schedules, auto-generation | 95% PM completion rate |
| **Improve Schedule Confidence** | Asset status in dispatch, reliability data | ↑ 15% on-time delivery |
| **Link Maintenance to Safety** | LOTO integration, permit requirements | Zero safety incidents |
| **Link Maintenance to Quality** | SPC triggers, first-article after repair | ↓ 25% repeat defects |
| **Support Multi-Location** | Centralized asset registry, branch views | Consistent MTTR across sites |
| **Optimize Spare Parts** | Parts consumption, min/max, auto-reorder | 98% parts availability |

### A.3 Maintenance ↔ Operations Partnership

```
┌─────────────────────────────────────────────────────────────────────┐
│              MAINTENANCE-OPERATIONS PARTNERSHIP                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────────┐                   ┌───────────────────┐      │
│  │    OPERATIONS     │                   │   MAINTENANCE     │      │
│  │                   │                   │                   │      │
│  │  • Owns schedule  │                   │  • Owns equipment │      │
│  │  • Owns output    │◄─────────────────►│  • Owns reliability│     │
│  │  • Reports issues │   PARTNERSHIP     │  • Fixes issues   │      │
│  │  • Basic care     │                   │  • Improves uptime│      │
│  │                   │                   │                   │      │
│  └───────────────────┘                   └───────────────────┘      │
│                                                                      │
│  SHARED ACCOUNTABILITY:                                              │
│  ─────────────────────                                               │
│  • Overall Equipment Effectiveness (OEE)                             │
│  • Unplanned Downtime                                                │
│  • Safety Incidents                                                  │
│  • Quality Defects                                                   │
│                                                                      │
│  OPERATOR RESPONSIBILITIES:                                          │
│  ──────────────────────────                                          │
│  • Pre-shift equipment checks                                        │
│  • Report abnormalities immediately                                  │
│  • Basic lubrication and cleaning                                    │
│  • Do NOT operate defective equipment                                │
│                                                                      │
│  MAINTENANCE RESPONSIBILITIES:                                       │
│  ─────────────────────────────                                       │
│  • Execute PM on schedule                                            │
│  • Respond to breakdowns promptly                                    │
│  • Communicate estimated repair time                                 │
│  • Document all work performed                                       │
│  • Verify return-to-service                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### A.4 Safety-First Maintenance

| Principle | Implementation |
|-----------|----------------|
| **LOTO Required** | All energized equipment work requires lockout/tagout permit |
| **Permit Before Work** | Hot work, confined space, elevated work permits linked to WO |
| **No Shortcuts** | System enforces permit linkage before WO can start |
| **Return-to-Service** | Requires verification, safety signoff, audit trail |
| **Stop-Work Authority** | Any employee can halt unsafe maintenance |

### A.5 Total Productive Maintenance (TPM) Elements

| TPM Pillar | CMMS Support |
|------------|--------------|
| Autonomous Maintenance | Operator checklists, quick reporting |
| Planned Maintenance | PM schedules, templates, auto-generation |
| Quality Maintenance | SPC-triggered WOs, first-article inspection |
| Focused Improvement | Root cause tracking, repeat failure analysis |
| Early Equipment Management | New asset commissioning workflow |
| Training & Education | Competency requirements on WOs |
| Safety, Health, Environment | LOTO, permits, hazard integration |
| Office TPM | Maintenance analytics, KPI dashboards |

---

## B) Asset Model & Hierarchy

### B.1 Asset Hierarchy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ASSET HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ENTERPRISE                                                          │
│       │                                                              │
│       ├── SITE (Branch)                                              │
│       │       │                                                      │
│       │       ├── AREA (Zone)                                        │
│       │       │       │                                              │
│       │       │       ├── WORK CENTER                                │
│       │       │       │       │                                      │
│       │       │       │       ├── ASSET (Equipment)                  │
│       │       │       │       │       │                              │
│       │       │       │       │       ├── COMPONENT (Sub-Asset)      │
│       │       │       │       │       │       │                      │
│       │       │       │       │       │       └── PART               │
│       │       │       │       │       │                              │
│       │       │       │       │       ├── Component: Motor           │
│       │       │       │       │       ├── Component: Blade           │
│       │       │       │       │       └── Component: Hydraulics      │
│       │       │       │       │                                      │
│       │       │       │       ├── SAW-01 (DoALL C-916)              │
│       │       │       │       ├── SAW-02 (Kalamazoo K10)            │
│       │       │       │       └── ROUTER-01 (Thermwood 43)          │
│       │       │       │                                              │
│       │       │       ├── Sawing Area                                │
│       │       │       ├── CNC Area                                   │
│       │       │       └── Packaging Area                             │
│       │       │                                                      │
│       │       ├── Jackson Branch                                     │
│       │       ├── Detroit Branch                                     │
│       │       └── Chicago Branch                                     │
│       │                                                              │
│       └── ALROWARE (Enterprise)                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B.2 Asset Types

| Asset Type | Category | Examples | Typical PM Interval |
|------------|----------|----------|---------------------|
| **SAW** | Processing | Band saw, cold saw, plate saw | 500 hours / Weekly |
| **ROUTER** | Processing | CNC router, plasma table | 250 hours / Weekly |
| **LATHE** | Processing | CNC lathe, manual lathe | 500 hours / Weekly |
| **SHEAR** | Processing | Plate shear, bar shear | 1000 hours / Monthly |
| **PRESS_BRAKE** | Processing | Hydraulic press brake | 500 hours / Weekly |
| **CRANE** | Material Handling | Overhead crane, jib crane | Monthly / Annual cert |
| **FORKLIFT** | Material Handling | Propane, electric forklift | Daily / 250 hours |
| **PACKAGING** | Packaging | Bander, stretch wrapper | Weekly |
| **HVAC** | Facility | Heating, cooling, ventilation | Quarterly |
| **COMPRESSOR** | Utility | Air compressor | Weekly / 500 hours |
| **CONVEYOR** | Material Handling | Roller, belt conveyor | Monthly |

### B.3 Asset Criticality Classification

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ASSET CRITICALITY MATRIX                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CRITICALITY A (Critical)                                            │
│  ─────────────────────────                                           │
│  • Single point of failure for production                            │
│  • No backup or redundancy                                           │
│  • High revenue impact if down                                       │
│  • Safety-critical equipment                                         │
│                                                                      │
│  Examples: Main production saw, only CNC router, overhead crane      │
│  PM Strategy: Predictive + Preventive, condition monitoring          │
│  Response: Immediate, 24/7 on-call                                   │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  CRITICALITY B (Important)                                           │
│  ──────────────────────────                                          │
│  • Redundancy exists but limited                                     │
│  • Moderate revenue impact                                           │
│  • Can reroute work temporarily                                      │
│                                                                      │
│  Examples: Secondary saws, forklifts (multiple), packaging equip     │
│  PM Strategy: Time-based preventive                                  │
│  Response: Same shift / next day                                     │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  CRITICALITY C (Standard)                                            │
│  ─────────────────────────                                           │
│  • Plenty of redundancy                                              │
│  • Low revenue impact                                                │
│  • Non-production support                                            │
│                                                                      │
│  Examples: Office HVAC, backup equipment, hand tools                 │
│  PM Strategy: Run-to-failure or basic PM                             │
│  Response: Scheduled                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B.4 Asset Status States

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ASSET STATUS STATES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐                                                  │
│  │   IN_SERVICE   │◄─── Normal operating condition                   │
│  └───────┬────────┘     Dispatch can assign work                     │
│          │                                                           │
│          │ Breakdown / PM due / Safety issue / Quality issue         │
│          ▼                                                           │
│  ┌─────────────────────────────────────────────────────┐            │
│  │                                                     │            │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│            │
│  │  │ MAINTENANCE  │  │ SAFETY_HOLD  │  │QUALITY_HOLD││            │
│  │  └──────────────┘  └──────────────┘  └────────────┘│            │
│  │         │                  │               │       │            │
│  │         │                  │               │       │            │
│  │         ▼                  ▼               ▼       │            │
│  │  ┌─────────────────────────────────────────────┐  │            │
│  │  │            OUT_OF_SERVICE                    │  │            │
│  │  │  (Cannot be dispatched, removed from queues) │  │            │
│  │  └─────────────────────────────────────────────┘  │            │
│  │                                                     │            │
│  └─────────────────────────────────────────────────────┘            │
│          │                                                           │
│          │ Repair complete + verification + approval                 │
│          ▼                                                           │
│  ┌─────────────────┐                                                 │
│  │ PENDING_RETURN  │◄─── Awaiting return-to-service approval         │
│  └────────┬────────┘                                                 │
│           │                                                          │
│           │ Approved                                                 │
│           ▼                                                          │
│  ┌────────────────┐                                                  │
│  │   IN_SERVICE   │                                                  │
│  └────────────────┘                                                  │
│                                                                      │
│  SPECIAL STATES:                                                     │
│  ───────────────                                                     │
│  • DECOMMISSIONED - Permanently removed from service                 │
│  • STORED - Not currently deployed                                   │
│  • TRANSFERRED - Being moved to another location                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B.5 Prisma Schema - Assets

```prisma
// ============================================
// ASSET & EQUIPMENT DATA MODEL
// ============================================

model Asset {
  id                    String    @id @default(uuid())
  assetNumber           String    @unique  // SAW-JKS-001
  
  // Classification
  typeId                String
  type                  AssetType @relation(fields: [typeId], references: [id])
  category              AssetCategory
  criticality           AssetCriticality @default(B)
  
  // Identity
  name                  String
  description           String?
  manufacturer          String?
  model                 String?
  serialNumber          String?
  
  // Location
  branchId              String
  branch                Branch @relation(fields: [branchId], references: [id])
  zoneId                String?
  workCenterId          String?
  
  // Status
  status                AssetStatus @default(IN_SERVICE)
  statusChangedAt       DateTime?
  statusChangedBy       String?
  statusReason          String?
  
  // Acquisition
  purchaseDate          DateTime?
  purchaseCost          Float?
  warrantyExpiry        DateTime?
  vendorId              String?
  poNumber              String?
  
  // Commissioning
  installDate           DateTime?
  commissionedDate      DateTime?
  commissionedBy        String?
  
  // Metering
  hasHourMeter          Boolean   @default(false)
  currentHours          Float?
  lastHoursReading      DateTime?
  hasCycleMeter         Boolean   @default(false)
  currentCycles         Int?
  lastCyclesReading     DateTime?
  
  // PM Schedule
  pmScheduleId          String?
  lastPMDate            DateTime?
  nextPMDueDate         DateTime?
  pmOverdueThreshold    Int?      // Days before blocking
  
  // Inspection
  requiresCertification Boolean   @default(false)
  certificationExpiry   DateTime?
  lastInspectionDate    DateTime?
  lastInspectionResult  String?
  
  // Parent/Child
  parentAssetId         String?
  parentAsset           Asset? @relation("AssetHierarchy", fields: [parentAssetId], references: [id])
  childAssets           Asset[] @relation("AssetHierarchy")
  
  // Documents
  manualUrl             String?
  drawingUrl            String?
  photoUrl              String?
  
  // Lifecycle
  expectedLifeYears     Int?
  replacementCost       Float?
  depreciationMethod    String?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  deletedAt             DateTime?
  
  // Relations
  components            AssetComponent[]
  workOrders            WorkOrder[]
  meterReadings         MeterReading[]
  downtimeRecords       DowntimeRecord[]
  maintenanceHistory    MaintenanceHistory[]
  
  @@index([branchId])
  @@index([typeId])
  @@index([status])
  @@index([workCenterId])
  @@index([criticality])
}

enum AssetCategory {
  PROCESSING
  MATERIAL_HANDLING
  PACKAGING
  FACILITY
  UTILITY
  SAFETY
  QUALITY
}

enum AssetCriticality {
  A   // Critical - single point of failure
  B   // Important - limited redundancy
  C   // Standard - plenty of backup
}

enum AssetStatus {
  IN_SERVICE
  OUT_OF_SERVICE
  MAINTENANCE
  SAFETY_HOLD
  QUALITY_HOLD
  PENDING_RETURN
  DECOMMISSIONED
  STORED
  TRANSFERRED
}

model AssetType {
  id                    String    @id @default(uuid())
  code                  String    @unique
  name                  String
  category              AssetCategory
  
  // Default PM settings
  defaultPMIntervalDays Int?
  defaultPMIntervalHours Float?
  defaultPMTemplateId   String?
  
  // Competency requirements
  requiredCompetencies  String[]
  
  assets                Asset[]
  pmTemplates           PMTemplate[]
  
  createdAt             DateTime  @default(now())
}

model AssetComponent {
  id                    String    @id @default(uuid())
  assetId               String
  asset                 Asset @relation(fields: [assetId], references: [id])
  
  name                  String    // Motor, Blade, Hydraulic System
  componentType         String
  manufacturer          String?
  partNumber            String?
  serialNumber          String?
  
  // Lifecycle
  installDate           DateTime?
  expectedLifeHours     Float?
  currentHours          Float?
  
  // Status
  status                ComponentStatus @default(GOOD)
  lastInspectedAt       DateTime?
  
  // Replacement
  sparePartId           String?
  lastReplacedAt        DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([assetId])
}

enum ComponentStatus {
  GOOD
  WORN
  NEEDS_ATTENTION
  FAILED
  REPLACED
}

model MeterReading {
  id                    String    @id @default(uuid())
  assetId               String
  asset                 Asset @relation(fields: [assetId], references: [id])
  
  meterType             MeterType
  reading               Float
  previousReading       Float?
  delta                 Float?
  
  recordedAt            DateTime  @default(now())
  recordedBy            String
  source                String?   // MANUAL, AUTOMATIC, SHIFT_END
  
  @@index([assetId, meterType])
  @@index([recordedAt])
}

enum MeterType {
  HOURS
  CYCLES
  UNITS_PRODUCED
  MILES
}
```

---

## C) Work Order Model & Workflow (State Machines)

### C.1 Work Order Types

| Type | Trigger | Priority | Safety Requirements |
|------|---------|----------|---------------------|
| **PM** | Schedule (time/meter) | Planned | May require LOTO |
| **CORRECTIVE** | Operator report, inspection | Varies | Usually requires LOTO |
| **BREAKDOWN** | Equipment failure | Emergency | Requires LOTO |
| **INSPECTION** | Certification due, audit | Planned | Depends on scope |
| **SAFETY_RELATED** | SWA, safety incident | High | Mandatory LOTO + permit |
| **QUALITY_RELATED** | SPC drift, repeat NCR | High | May require first-article |
| **PROJECT** | Improvement, upgrade | Planned | Varies |
| **CALIBRATION** | Gage/instrument due | Planned | Usually none |

### C.2 Work Order State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                   WORK ORDER STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐                                                         │
│  │  DRAFT  │◄─── Created but not submitted                           │
│  └────┬────┘                                                         │
│       │                                                              │
│       │ Submit for approval                                          │
│       ▼                                                              │
│  ┌───────────┐                                                       │
│  │ SUBMITTED │◄─── Awaiting maintenance manager approval             │
│  └─────┬─────┘                                                       │
│        │                                                             │
│   ┌────┴────┐                                                        │
│   │         │                                                        │
│   ▼         ▼                                                        │
│ ┌────────┐ ┌──────────┐                                             │
│ │APPROVED│ │ REJECTED │───► Closed with reason                       │
│ └───┬────┘ └──────────┘                                             │
│     │                                                                │
│     │ Assign to schedule                                             │
│     ▼                                                                │
│ ┌───────────┐                                                        │
│ │ SCHEDULED │◄─── Assigned date, tech, assets                        │
│ └─────┬─────┘                                                        │
│       │                                                              │
│       │ Tech starts work (requires permit if applicable)             │
│       ▼                                                              │
│ ┌─────────────┐                                                      │
│ │ IN_PROGRESS │◄─── Work being performed                             │
│ └──────┬──────┘                                                      │
│        │                                                             │
│   ┌────┴────────────┐                                                │
│   │                 │                                                │
│   ▼                 ▼                                                │
│ ┌───────────────┐ ┌────────────────┐                                │
│ │ WAITING_PARTS │ │   ON_HOLD      │                                │
│ │               │ │ (Other reason) │                                │
│ └───────┬───────┘ └───────┬────────┘                                │
│         │                 │                                          │
│         │ Parts received  │ Issue resolved                           │
│         │                 │                                          │
│         └────────┬────────┘                                          │
│                  │                                                   │
│                  ▼                                                   │
│ ┌─────────────┐◄─── Resume work                                      │
│ │ IN_PROGRESS │                                                      │
│ └──────┬──────┘                                                      │
│        │                                                             │
│        │ Work complete, test run done                                │
│        ▼                                                             │
│ ┌───────────┐                                                        │
│ │ COMPLETED │◄─── Awaiting verification                              │
│ └─────┬─────┘                                                        │
│       │                                                              │
│       │ Supervisor/Manager verifies                                  │
│       ▼                                                              │
│ ┌──────────┐                                                         │
│ │ VERIFIED │◄─── Work verified, asset can return to service          │
│ └────┬─────┘                                                         │
│      │                                                               │
│      │ All documentation complete                                    │
│      ▼                                                               │
│ ┌──────────┐                                                         │
│ │  CLOSED  │◄─── WO complete, asset IN_SERVICE                       │
│ └──────────┘                                                         │
│                                                                      │
│  SPECIAL TRANSITIONS:                                                │
│  ────────────────────                                                │
│  • Any state → CANCELLED (with reason + approval)                    │
│  • IN_PROGRESS → ESCALATED (needs higher expertise)                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.3 Work Order Validation Rules

| Transition | Validation | Block If |
|------------|------------|----------|
| DRAFT → SUBMITTED | Required fields complete | Missing asset, description |
| SUBMITTED → APPROVED | Manager review | Budget exceeded, invalid request |
| SCHEDULED → IN_PROGRESS | Permit linked (if required) | LOTO not issued, permit missing |
| IN_PROGRESS → COMPLETED | Checklist complete, time logged | Checklist incomplete |
| COMPLETED → VERIFIED | Test run passed | Test failed, safety issue |
| VERIFIED → CLOSED | All evidence attached | Missing photos, signatures |

### C.4 Prisma Schema - Work Orders

```prisma
// ============================================
// WORK ORDER DATA MODEL
// ============================================

model WorkOrder {
  id                    String    @id @default(uuid())
  woNumber              String    @unique  // WO-2026-00542
  
  // Type & Classification
  type                  WorkOrderType
  priority              WorkOrderPriority @default(NORMAL)
  
  // Asset
  assetId               String
  asset                 Asset @relation(fields: [assetId], references: [id])
  componentId           String?
  
  // Problem/Work Description
  title                 String
  description           String
  problemCode           String?
  failureMode           String?
  
  // Source
  source                WorkOrderSource
  sourceReference       String?   // Operator report ID, PM schedule ID, NCR ID
  
  // Status
  status                WorkOrderStatus @default(DRAFT)
  statusChangedAt       DateTime?
  statusChangedBy       String?
  
  // Assignment
  assignedToId          String?
  assignedToTeam        String?
  scheduledDate         DateTime?
  scheduledShift        String?
  estimatedHours        Float?
  
  // Safety
  requiresLOTO          Boolean   @default(false)
  lotoPermitId          String?
  requiresHotWork       Boolean   @default(false)
  hotWorkPermitId       String?
  requiresConfinedSpace Boolean   @default(false)
  confinedSpacePermitId String?
  
  // Execution
  startedAt             DateTime?
  startedBy             String?
  completedAt           DateTime?
  completedBy           String?
  actualHours           Float?
  
  // Verification
  verifiedAt            DateTime?
  verifiedBy            String?
  verificationNotes     String?
  testRunPassed         Boolean?
  
  // Parts
  partsRequired         Boolean   @default(false)
  partsOrdered          Boolean   @default(false)
  partsReceivedAt       DateTime?
  
  // Downtime
  downtimeRecordId      String?
  causedDowntime        Boolean   @default(false)
  
  // Quality Link
  requiresFirstArticle  Boolean   @default(false)
  firstArticlePassed    Boolean?
  linkedNCRId           String?
  linkedSPCViolationId  String?
  
  // Cost
  laborCost             Float?
  partsCost             Float?
  totalCost             Float?
  
  // Template
  pmTemplateId          String?
  pmScheduleId          String?
  
  createdBy             String
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  closedAt              DateTime?
  
  // Relations
  tasks                 WorkOrderTask[]
  partsUsed             WorkOrderPart[]
  laborEntries          WorkOrderLabor[]
  attachments           WorkOrderAttachment[]
  comments              WorkOrderComment[]
  
  @@index([assetId])
  @@index([status])
  @@index([type])
  @@index([priority])
  @@index([scheduledDate])
  @@index([assignedToId])
}

enum WorkOrderType {
  PM
  CORRECTIVE
  BREAKDOWN
  INSPECTION
  SAFETY_RELATED
  QUALITY_RELATED
  PROJECT
  CALIBRATION
}

enum WorkOrderPriority {
  EMERGENCY     // Immediate response
  HIGH          // Same shift
  NORMAL        // Within 24-48 hours
  LOW           // When convenient
  PLANNED       // Scheduled
}

enum WorkOrderStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  SCHEDULED
  IN_PROGRESS
  WAITING_PARTS
  ON_HOLD
  COMPLETED
  VERIFIED
  CLOSED
  CANCELLED
  ESCALATED
}

enum WorkOrderSource {
  PM_SCHEDULE
  OPERATOR_REPORT
  INSPECTION
  SAFETY_INCIDENT
  QUALITY_NCR
  SPC_VIOLATION
  BREAKDOWN
  SUPERVISOR_REQUEST
  PROJECT
  AUDIT_FINDING
}

model WorkOrderTask {
  id                    String    @id @default(uuid())
  workOrderId           String
  workOrder             WorkOrder @relation(fields: [workOrderId], references: [id])
  
  sequence              Int
  description           String
  isRequired            Boolean   @default(true)
  estimatedMinutes      Int?
  
  // Completion
  completed             Boolean   @default(false)
  completedAt           DateTime?
  completedBy           String?
  completionNotes       String?
  
  // Measurement (if applicable)
  requiresMeasurement   Boolean   @default(false)
  measurementValue      String?
  measurementUnit       String?
  measurementSpec       String?
  measurementPassed     Boolean?
  
  @@index([workOrderId])
}

model WorkOrderPart {
  id                    String    @id @default(uuid())
  workOrderId           String
  workOrder             WorkOrder @relation(fields: [workOrderId], references: [id])
  
  sparePartId           String
  sparePart             SparePart @relation(fields: [sparePartId], references: [id])
  
  quantityRequired      Float
  quantityUsed          Float?
  unitCost              Float?
  
  requestedAt           DateTime  @default(now())
  requestedBy           String
  issuedAt              DateTime?
  issuedBy              String?
  
  @@index([workOrderId])
  @@index([sparePartId])
}

model WorkOrderLabor {
  id                    String    @id @default(uuid())
  workOrderId           String
  workOrder             WorkOrder @relation(fields: [workOrderId], references: [id])
  
  technicianId          String
  
  startTime             DateTime
  endTime               DateTime?
  hours                 Float?
  
  laborType             LaborType @default(REGULAR)
  hourlyRate            Float?
  totalCost             Float?
  
  notes                 String?
  
  @@index([workOrderId])
  @@index([technicianId])
}

enum LaborType {
  REGULAR
  OVERTIME
  DOUBLE_TIME
  CONTRACTOR
}

model WorkOrderAttachment {
  id                    String    @id @default(uuid())
  workOrderId           String
  workOrder             WorkOrder @relation(fields: [workOrderId], references: [id])
  
  type                  AttachmentType
  fileName              String
  fileUrl               String
  fileSize              Int?
  mimeType              String?
  
  uploadedAt            DateTime  @default(now())
  uploadedBy            String
  description           String?
  
  @@index([workOrderId])
}

enum AttachmentType {
  PHOTO_BEFORE
  PHOTO_AFTER
  DOCUMENT
  CHECKLIST
  PERMIT
  TEST_RESULT
  SIGNATURE
}

model WorkOrderComment {
  id                    String    @id @default(uuid())
  workOrderId           String
  workOrder             WorkOrder @relation(fields: [workOrderId], references: [id])
  
  comment               String
  createdBy             String
  createdAt             DateTime  @default(now())
  
  isInternal            Boolean   @default(false)  // For maintenance team only
  
  @@index([workOrderId])
}
```

### C.5 Return-to-Service Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                 RETURN-TO-SERVICE WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Work Order COMPLETED                                                │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────────────────────────────────┐                        │
│  │ VERIFICATION CHECKLIST                   │                        │
│  │                                          │                        │
│  │ □ Work performed as specified            │                        │
│  │ □ All tasks completed                    │                        │
│  │ □ Parts properly installed               │                        │
│  │ □ Guards/covers reinstalled              │                        │
│  │ □ LOTO removed by authorized person      │                        │
│  │ □ Test run performed                     │                        │
│  │ □ Test run passed                        │                        │
│  │ □ No abnormal noise/vibration/heat       │                        │
│  │ □ Safety devices functional              │                        │
│  │ □ Documentation complete                 │                        │
│  └─────────────────────────────────────────┘                        │
│         │                                                            │
│         │ All checks passed?                                         │
│         │                                                            │
│    ┌────┴────┐                                                       │
│    │         │                                                       │
│   YES        NO                                                      │
│    │         │                                                       │
│    │         ▼                                                       │
│    │    Return to IN_PROGRESS                                        │
│    │    (Additional work needed)                                     │
│    │                                                                 │
│    ▼                                                                 │
│  Was this a SAFETY_RELATED WO?                                       │
│    │                                                                 │
│    ├── YES ──► EHS Approval Required                                 │
│    │                                                                 │
│    └── NO ──► Maintenance Manager Approval                           │
│                   │                                                  │
│                   ▼                                                  │
│            ┌────────────┐                                            │
│            │  APPROVED  │                                            │
│            └─────┬──────┘                                            │
│                  │                                                   │
│                  ▼                                                   │
│         Was first-article inspection required?                       │
│                  │                                                   │
│             ┌────┴────┐                                              │
│            YES        NO                                             │
│             │         │                                              │
│             ▼         │                                              │
│      Quality performs │                                              │
│      first-article    │                                              │
│             │         │                                              │
│        ┌────┴────┐    │                                              │
│       PASS      FAIL  │                                              │
│        │         │    │                                              │
│        │         ▼    │                                              │
│        │    Return to │                                              │
│        │    maintenance│                                             │
│        │              │                                              │
│        └──────┬───────┘                                              │
│               │                                                      │
│               ▼                                                      │
│  ┌────────────────────────┐                                          │
│  │ ASSET STATUS:          │                                          │
│  │ IN_SERVICE             │                                          │
│  │                        │                                          │
│  │ • Available for dispatch│                                         │
│  │ • Audit trail complete │                                          │
│  │ • Notifications sent   │                                          │
│  └────────────────────────┘                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## D) Preventive Maintenance (PM) Engine

### D.1 PM Scheduling Methods

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PM SCHEDULING METHODS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  METHOD 1: TIME-BASED                                                │
│  ─────────────────────                                               │
│                                                                      │
│  Trigger: Calendar interval (daily, weekly, monthly, quarterly)      │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ Asset: FORKLIFT-01                                       │        │
│  │ PM: Daily Inspection                                     │        │
│  │ Interval: Every 1 day                                    │        │
│  │ Last PM: Feb 3, 2026                                     │        │
│  │ Next Due: Feb 4, 2026                                    │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  METHOD 2: METER-BASED                                               │
│  ──────────────────────                                              │
│                                                                      │
│  Trigger: Equipment runtime (hours, cycles, units produced)          │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ Asset: SAW-01                                            │        │
│  │ PM: Blade Inspection                                     │        │
│  │ Interval: Every 500 hours                                │        │
│  │ Current Hours: 4,850                                     │        │
│  │ Last PM Hours: 4,500                                     │        │
│  │ Next Due: 5,000 hours (in ~150 hours)                   │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  METHOD 3: CONDITION-BASED (PREDICTIVE)                              │
│  ───────────────────────────────────────                             │
│                                                                      │
│  Trigger: Sensor data, SPC deviation, AI prediction                  │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ Asset: CNC-LATHE-02                                      │        │
│  │ Condition: SPC Rule 4 violation (7 points above CL)      │        │
│  │ Possible Cause: Spindle bearing wear                     │        │
│  │ Recommendation: Inspect spindle, replace bearing         │        │
│  │ Auto-generated WO: Yes (draft for review)                │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  METHOD 4: HYBRID (Time + Meter whichever first)                     │
│  ───────────────────────────────────────────────                     │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ Asset: OVERHEAD-CRANE-01                                 │        │
│  │ PM: Annual Inspection OR 2,000 hours (whichever first)   │        │
│  │ Last PM: 8 months ago, 1,800 hours                       │        │
│  │ Next Due: 2,000 hours (200 hours to go) - meter wins     │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### D.2 PM Template Schema

```prisma
// ============================================
// PREVENTIVE MAINTENANCE ENGINE
// ============================================

model PMTemplate {
  id                    String    @id @default(uuid())
  code                  String    @unique
  name                  String
  description           String?
  
  // Scope
  assetTypeId           String
  assetType             AssetType @relation(fields: [assetTypeId], references: [id])
  applicableAssets      String[]  // Specific assets, or empty for all of type
  
  // Scheduling
  scheduleType          PMScheduleType
  intervalDays          Int?
  intervalHours         Float?
  intervalCycles        Int?
  
  // Execution
  estimatedHours        Float?
  requiredSkills        String[]
  requiredCompetencies  String[]
  requiredPermits       String[]  // LOTO, HOT_WORK, etc.
  
  // Tasks
  tasks                 PMTemplateTask[]
  
  // Parts
  requiredParts         PMTemplatePart[]
  
  // Documents
  procedureUrl          String?
  safetyInstructions    String?
  
  // Compliance
  isRegulatory          Boolean   @default(false)
  regulatoryReference   String?   // OSHA, ANSI, etc.
  
  // Status
  isActive              Boolean   @default(true)
  version               Int       @default(1)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  schedules             PMSchedule[]
  
  @@index([assetTypeId])
}

enum PMScheduleType {
  TIME_BASED
  METER_BASED
  CONDITION_BASED
  HYBRID
}

model PMTemplateTask {
  id                    String    @id @default(uuid())
  templateId            String
  template              PMTemplate @relation(fields: [templateId], references: [id])
  
  sequence              Int
  description           String
  detailedInstructions  String?
  
  isRequired            Boolean   @default(true)
  estimatedMinutes      Int?
  
  // Measurement
  requiresMeasurement   Boolean   @default(false)
  measurementUnit       String?
  measurementSpec       String?   // e.g., "1.5-2.0 mm"
  
  // Evidence
  requiresPhoto         Boolean   @default(false)
  requiresSignature     Boolean   @default(false)
  
  @@index([templateId])
}

model PMTemplatePart {
  id                    String    @id @default(uuid())
  templateId            String
  template              PMTemplate @relation(fields: [templateId], references: [id])
  
  sparePartId           String
  quantityRequired      Float     @default(1)
  isOptional            Boolean   @default(false)
  usageNotes            String?
  
  @@index([templateId])
}

model PMSchedule {
  id                    String    @id @default(uuid())
  
  // Template
  templateId            String
  template              PMTemplate @relation(fields: [templateId], references: [id])
  
  // Asset
  assetId               String
  
  // Schedule
  scheduleType          PMScheduleType
  intervalDays          Int?
  intervalHours         Float?
  intervalCycles        Int?
  
  // Timing
  lastExecutedAt        DateTime?
  lastExecutedWOId      String?
  lastMeterReading      Float?
  
  nextDueDate           DateTime?
  nextDueMeter          Float?
  
  // Alerts
  alertDaysBefore       Int       @default(7)
  alertHoursBefore      Float     @default(50)
  
  // Overdue handling
  overdueThresholdDays  Int       @default(14)
  overdueAction         OverdueAction @default(ALERT)
  
  // Status
  isActive              Boolean   @default(true)
  isPaused              Boolean   @default(false)
  pausedReason          String?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@unique([templateId, assetId])
  @@index([assetId])
  @@index([nextDueDate])
}

enum OverdueAction {
  ALERT         // Send alerts
  ESCALATE      // Alert + escalate to manager
  BLOCK         // Block asset from dispatch
}
```

### D.3 PM Auto-Generation Logic

```javascript
// PM Schedule Processor (runs daily or hourly)

async function processPMSchedules() {
  const today = new Date();
  
  // Get all active schedules
  const schedules = await prisma.pMSchedule.findMany({
    where: { isActive: true, isPaused: false },
    include: { template: true, asset: true }
  });
  
  for (const schedule of schedules) {
    const isDue = await checkIfDue(schedule);
    const isOverdue = await checkIfOverdue(schedule);
    
    // Generate WO if due and no pending WO exists
    if (isDue || isOverdue) {
      const existingWO = await findPendingPMWorkOrder(schedule.assetId, schedule.templateId);
      
      if (!existingWO) {
        const wo = await generatePMWorkOrder(schedule);
        
        // Notify maintenance team
        await notifyMaintenanceTeam('PM_DUE', {
          asset: schedule.asset,
          template: schedule.template,
          workOrder: wo,
          isOverdue
        });
      }
    }
    
    // Handle overdue
    if (isOverdue) {
      await handleOverdue(schedule);
    }
  }
}

async function checkIfDue(schedule) {
  const { scheduleType, nextDueDate, nextDueMeter, alertDaysBefore, alertHoursBefore } = schedule;
  const today = new Date();
  
  if (scheduleType === 'TIME_BASED' || scheduleType === 'HYBRID') {
    if (nextDueDate) {
      const alertDate = new Date(nextDueDate);
      alertDate.setDate(alertDate.getDate() - alertDaysBefore);
      if (today >= alertDate) return true;
    }
  }
  
  if (scheduleType === 'METER_BASED' || scheduleType === 'HYBRID') {
    if (nextDueMeter) {
      const asset = await prisma.asset.findUnique({ where: { id: schedule.assetId } });
      const currentMeter = asset.currentHours || 0;
      if (currentMeter >= nextDueMeter - alertHoursBefore) return true;
    }
  }
  
  return false;
}

async function handleOverdue(schedule) {
  const { overdueAction, overdueThresholdDays, assetId } = schedule;
  
  switch (overdueAction) {
    case 'ALERT':
      await sendOverdueAlert(schedule);
      break;
      
    case 'ESCALATE':
      await sendOverdueAlert(schedule);
      await escalateToManager(schedule);
      break;
      
    case 'BLOCK':
      await sendOverdueAlert(schedule);
      await escalateToManager(schedule);
      // Block asset from dispatch
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'OUT_OF_SERVICE',
          statusReason: `PM overdue by ${overdueThresholdDays}+ days`,
          statusChangedAt: new Date()
        }
      });
      // Notify dispatch
      await notifyDispatch('ASSET_BLOCKED_PM_OVERDUE', { assetId });
      break;
  }
}
```

### D.4 PM Dashboard Metrics

| Metric | Calculation | Target |
|--------|-------------|--------|
| **PM Compliance Rate** | (Completed on time / Total due) × 100 | ≥ 95% |
| **PM Backlog** | Count of overdue PMs | 0 |
| **PM Completion Time** | Avg actual vs estimated hours | ± 10% |
| **PM Effectiveness** | Failures within 30 days of PM | < 2% |
| **PM Cost per Asset** | Total PM cost / Asset count | Trend down |

---

## E) Corrective Maintenance & Breakdown Workflow

### E.1 Breakdown Response Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BREAKDOWN RESPONSE FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STEP 1: DETECTION                                                   │
│  ──────────────────                                                  │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    Operator     │    │   Supervisor    │    │     Sensor      │  │
│  │    Reports      │    │    Observes     │    │    Triggers     │  │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │
│           │                      │                      │            │
│           └──────────────────────┼──────────────────────┘            │
│                                  │                                   │
│                                  ▼                                   │
│  STEP 2: IMMEDIATE ACTIONS                                           │
│  ──────────────────────────                                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  □ Stop equipment safely                                    │    │
│  │  □ Report issue via app/terminal                            │    │
│  │  □ Mark asset OUT_OF_SERVICE (auto)                         │    │
│  │  □ Notify maintenance (auto)                                │    │
│  │  □ Start downtime clock (auto)                              │    │
│  │  □ Dispatch reroutes affected jobs (auto)                   │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                  │                                   │
│                                  ▼                                   │
│  STEP 3: TRIAGE                                                      │
│  ──────────────────                                                  │
│                                                                      │
│  Maintenance assesses:                                               │
│  • What's the failure?                                               │
│  • Safety hazard present?                                            │
│  • Can we fix immediately?                                           │
│  • Parts available?                                                  │
│  • Estimated repair time?                                            │
│                                                                      │
│  Priority assignment:                                                │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │ EMERGENCY  │    HIGH    │   NORMAL   │    LOW     │              │
│  │ Drop all   │ Same shift │  24-48 hrs │ Scheduled  │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│                                  │                                   │
│                                  ▼                                   │
│  STEP 4: REPAIR                                                      │
│  ──────────────                                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  □ Obtain LOTO permit (if required)                         │    │
│  │  □ Isolate energy sources                                   │    │
│  │  □ Request parts (if needed)                                │    │
│  │  □ Perform repair                                           │    │
│  │  □ Document work performed                                  │    │
│  │  □ Take photos before/after                                 │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                  │                                   │
│                                  ▼                                   │
│  STEP 5: TEST RUN                                                    │
│  ────────────────                                                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  □ Remove LOTO (authorized person)                          │    │
│  │  □ Power up equipment                                       │    │
│  │  □ Run test cycle                                           │    │
│  │  □ Check for abnormalities                                  │    │
│  │  □ Verify safety devices                                    │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                  │                                   │
│                                  ▼                                   │
│  STEP 6: RETURN TO SERVICE                                           │
│  ──────────────────────────                                          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │  □ Verification checklist complete                          │    │
│  │  □ Supervisor/Manager approval                              │    │
│  │  □ EHS approval (if safety-related)                         │    │
│  │  □ First-article inspection (if major repair)               │    │
│  │  □ Asset status → IN_SERVICE                                │    │
│  │  □ Stop downtime clock                                      │    │
│  │  □ Notify dispatch: asset available                         │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### E.2 Downtime Tracking

```prisma
model DowntimeRecord {
  id                    String    @id @default(uuid())
  
  // Asset
  assetId               String
  asset                 Asset @relation(fields: [assetId], references: [id])
  
  // Classification
  type                  DowntimeType
  reasonCode            String
  reasonDetails         String?
  
  // Timing
  startTime             DateTime
  endTime               DateTime?
  durationMinutes       Int?
  
  // Impact
  plannedDowntime       Boolean   @default(false)
  impactedJobs          String[]
  productionLossUnits   Float?
  productionLossValue   Float?
  
  // Work Order Link
  workOrderId           String?
  
  // Reporting
  reportedBy            String
  reportedAt            DateTime  @default(now())
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([assetId])
  @@index([startTime])
  @@index([type])
  @@index([reasonCode])
}

enum DowntimeType {
  BREAKDOWN             // Unexpected failure
  PM                    // Planned maintenance
  SETUP_CHANGEOVER      // Setup/changeover
  NO_OPERATOR           // No operator available
  NO_MATERIAL           // Waiting for material
  QUALITY_HOLD          // Quality issue
  SAFETY_HOLD           // Safety issue
  OTHER
}
```

### E.3 Downtime Reason Codes

| Code | Category | Description | Examples |
|------|----------|-------------|----------|
| **BD-MECH** | Breakdown | Mechanical failure | Bearing, gear, shaft |
| **BD-ELEC** | Breakdown | Electrical failure | Motor, control, wiring |
| **BD-HYDR** | Breakdown | Hydraulic failure | Pump, valve, cylinder |
| **BD-PNEU** | Breakdown | Pneumatic failure | Air system, cylinder |
| **BD-TOOL** | Breakdown | Tooling failure | Blade, die, fixture |
| **PM-SCHED** | PM | Scheduled PM | Time-based PM |
| **PM-METER** | PM | Meter-based PM | Hour-based PM |
| **SU-CHNG** | Setup | Product changeover | Different product |
| **SU-TOOL** | Setup | Tool change | Blade, die change |
| **QL-HOLD** | Quality | Quality hold | NCR, SPC violation |
| **SF-HOLD** | Safety | Safety hold | SWA, incident |
| **OP-NONE** | Operator | No operator | Break, absent |
| **MT-WAIT** | Material | Waiting material | No stock |

### E.4 Operator Equipment Report Form

```javascript
// Operator Quick Report Schema
const equipmentReportSchema = {
  assetId: { type: 'string', required: true },  // From QR scan or selection
  reportType: { 
    type: 'enum', 
    values: ['BREAKDOWN', 'ABNORMALITY', 'SAFETY_CONCERN', 'QUALITY_ISSUE'],
    required: true 
  },
  severity: {
    type: 'enum',
    values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    required: true
  },
  symptom: {
    type: 'enum',
    values: [
      'NOT_STARTING',
      'UNUSUAL_NOISE',
      'UNUSUAL_VIBRATION',
      'OVERHEATING',
      'FLUID_LEAK',
      'SMOKE_SMELL',
      'QUALITY_DEFECT',
      'SLOW_PERFORMANCE',
      'INTERMITTENT',
      'OTHER'
    ],
    required: true
  },
  description: { type: 'string', required: true },
  stoppedEquipment: { type: 'boolean', required: true },
  safetyHazard: { type: 'boolean', required: true },
  photos: { type: 'array', items: 'file', maxItems: 5 },
  impactedJob: { type: 'string' }  // Current job on machine
};
```

---

## F) Integration with Dispatch, Safety, and Quality

### F.1 Dispatch Integration Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│              MAINTENANCE-DISPATCH INTEGRATION RULES                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RULE 1: OUT_OF_SERVICE → REMOVE FROM DISPATCH                      │
│  ──────────────────────────────────────────────                      │
│                                                                      │
│  When: Asset.status changes to OUT_OF_SERVICE or MAINTENANCE         │
│  Then:                                                               │
│    • Remove asset from dispatch queues                               │
│    • Flag affected jobs                                              │
│    • Suggest alternate work centers                                  │
│    • Notify scheduler                                                │
│                                                                      │
│  RULE 2: PM DUE → SCHEDULE WINDOW                                   │
│  ─────────────────────────────────                                   │
│                                                                      │
│  When: PM is due within alert window                                 │
│  Then:                                                               │
│    • Show PM indicator on dispatch board                             │
│    • Block scheduling during planned PM window                       │
│    • Coordinate with production for downtime                         │
│                                                                      │
│  RULE 3: BREAKDOWN → IMMEDIATE REROUTE                              │
│  ──────────────────────────────────────                              │
│                                                                      │
│  When: Breakdown reported                                            │
│  Then:                                                               │
│    • Auto-reroute affected jobs                                      │
│    • Calculate new ETAs                                              │
│    • Alert customers if delivery impacted                            │
│    • Track which jobs affected (for downtime cost)                   │
│                                                                      │
│  RULE 4: RETURN TO SERVICE → RESTORE CAPACITY                       │
│  ─────────────────────────────────────────────                       │
│                                                                      │
│  When: Asset status changes to IN_SERVICE                            │
│  Then:                                                               │
│    • Add asset back to dispatch pool                                 │
│    • Recalculate schedules                                           │
│    • Notify scheduler of restored capacity                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.2 Dispatch Validation Hook

```javascript
// Check if asset is available for dispatch
async function validateAssetForDispatch(assetId) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      pmSchedules: true,
      workOrders: {
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }
      }
    }
  });
  
  const blocks = [];
  
  // Check status
  if (asset.status !== 'IN_SERVICE') {
    blocks.push({
      type: 'ASSET_STATUS',
      message: `Asset is ${asset.status}`,
      reason: asset.statusReason
    });
  }
  
  // Check for active maintenance WO
  const activeWO = asset.workOrders.find(wo => 
    wo.status === 'IN_PROGRESS' || wo.status === 'SCHEDULED'
  );
  if (activeWO) {
    blocks.push({
      type: 'ACTIVE_WORK_ORDER',
      message: `Active WO: ${activeWO.woNumber}`,
      estimatedCompletion: activeWO.scheduledDate
    });
  }
  
  // Check for overdue PM with blocking
  const overdueSchedules = asset.pmSchedules.filter(s => 
    s.overdueAction === 'BLOCK' && 
    s.nextDueDate && 
    new Date(s.nextDueDate) < new Date()
  );
  if (overdueSchedules.length > 0) {
    blocks.push({
      type: 'PM_OVERDUE',
      message: 'PM overdue - asset blocked',
      schedules: overdueSchedules.map(s => s.templateId)
    });
  }
  
  // Check certification expiry
  if (asset.requiresCertification && asset.certificationExpiry) {
    if (new Date(asset.certificationExpiry) < new Date()) {
      blocks.push({
        type: 'CERTIFICATION_EXPIRED',
        message: 'Certification expired',
        expiredAt: asset.certificationExpiry
      });
    }
  }
  
  return {
    canDispatch: blocks.length === 0,
    blocks
  };
}
```

### F.3 Safety Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│              MAINTENANCE-SAFETY INTEGRATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LOTO REQUIREMENTS                                                   │
│  ─────────────────                                                   │
│                                                                      │
│  Work Order types requiring LOTO:                                    │
│  • Any work on energized equipment                                   │
│  • Electrical repairs                                                │
│  • Hydraulic system work                                             │
│  • Guard removal                                                     │
│  • Inside machinery envelope                                         │
│                                                                      │
│  WO cannot transition to IN_PROGRESS without:                        │
│  ┌─────────────────────────────────────────┐                        │
│  │ □ LOTO permit issued                     │                        │
│  │ □ Energy sources verified isolated       │                        │
│  │ □ Lockout applied by authorized person   │                        │
│  │ □ Permit ID linked to Work Order         │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  STOP-WORK AUTHORITY                                                 │
│  ────────────────────                                                │
│                                                                      │
│  If SWA triggered on asset:                                          │
│  • Asset status → SAFETY_HOLD                                        │
│  • All active WOs → ON_HOLD                                          │
│  • Cannot start new WOs                                              │
│  • Requires SWA clearance before return                              │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  RETURN-TO-SERVICE SAFETY REQUIREMENTS                               │
│  ──────────────────────────────────────                              │
│                                                                      │
│  For SAFETY_RELATED work orders:                                     │
│  ┌─────────────────────────────────────────┐                        │
│  │ □ LOTO removed by authorized person      │                        │
│  │ □ All guards reinstalled                 │                        │
│  │ □ Safety devices tested                  │                        │
│  │ □ EHS signoff required                   │                        │
│  │ □ Test run witnessed                     │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.4 Quality Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│              MAINTENANCE-QUALITY INTEGRATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SPC TRIGGERS MAINTENANCE                                            │
│  ─────────────────────────                                           │
│                                                                      │
│  When SPC detects:                                                   │
│  • Rule 1 violation (beyond control limits)                          │
│  • Rule 4 (7+ points same side - trend)                              │
│  • Rule 5 (7+ points trending up/down)                               │
│                                                                      │
│  System can auto-generate:                                           │
│  ┌─────────────────────────────────────────┐                        │
│  │ Work Order (QUALITY_RELATED)             │                        │
│  │ • Source: SPC_VIOLATION                  │                        │
│  │ • Link to SPC violation ID               │                        │
│  │ • Suggested cause: {from AI or history}  │                        │
│  │ • Priority: HIGH                         │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  REPEAT NCR TRIGGERS MAINTENANCE                                     │
│  ────────────────────────────────                                    │
│                                                                      │
│  When NCR analysis shows:                                            │
│  • Same defect type 3+ times                                         │
│  • Same asset involved                                               │
│  • Within 30 days                                                    │
│                                                                      │
│  System flags:                                                       │
│  ┌─────────────────────────────────────────┐                        │
│  │ Maintenance review required              │                        │
│  │ • Pattern detected                       │                        │
│  │ • Recommended: Root cause investigation  │                        │
│  │ • Suggested: Preventive action           │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  MAJOR REPAIR → FIRST-ARTICLE INSPECTION                            │
│  ────────────────────────────────────────                            │
│                                                                      │
│  When work order involves:                                           │
│  • Spindle/axis replacement                                          │
│  • Major alignment                                                   │
│  • Tooling system changes                                            │
│  • Control system changes                                            │
│                                                                      │
│  Return-to-service requires:                                         │
│  ┌─────────────────────────────────────────┐                        │
│  │ □ First-article inspection required      │                        │
│  │ □ Quality notified                       │                        │
│  │ □ Test piece produced                    │                        │
│  │ □ Inspection passed                      │                        │
│  │ □ Documented in WO                       │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.5 Inventory (Spare Parts) Integration

```prisma
model SparePart {
  id                    String    @id @default(uuid())
  partNumber            String    @unique
  name                  String
  description           String?
  
  // Classification
  category              String    // MECHANICAL, ELECTRICAL, HYDRAULIC, CONSUMABLE
  criticality           SparePartCriticality @default(STANDARD)
  
  // Vendor
  preferredVendorId     String?
  manufacturerPartNum   String?
  unitCost              Float?
  leadTimeDays          Int?
  
  // Inventory
  quantityOnHand        Float     @default(0)
  quantityReserved      Float     @default(0)
  quantityAvailable     Float     @default(0)
  minQuantity           Float     @default(0)
  maxQuantity           Float?
  reorderPoint          Float?
  reorderQuantity       Float?
  
  // Location
  warehouseLocation     String?
  binLocation           String?
  
  // Usage
  lastUsedAt            DateTime?
  usageRate             Float?    // Per month
  
  // Assets
  applicableAssets      String[]  // Which assets use this part
  applicableAssetTypes  String[]
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  workOrderParts        WorkOrderPart[]
  
  @@index([partNumber])
  @@index([category])
  @@index([quantityOnHand])
}

enum SparePartCriticality {
  CRITICAL      // Single source, long lead, stops production
  IMPORTANT     // Limited sources, moderate lead
  STANDARD      // Multiple sources, short lead
}
```

### F.6 Parts Consumption Flow

```javascript
// Issue parts to work order
async function issuePartsToWorkOrder(workOrderId, partId, quantity, issuedBy) {
  const part = await prisma.sparePart.findUnique({ where: { id: partId } });
  
  if (part.quantityAvailable < quantity) {
    throw new Error('Insufficient stock');
  }
  
  // Update part inventory
  await prisma.sparePart.update({
    where: { id: partId },
    data: {
      quantityOnHand: { decrement: quantity },
      quantityAvailable: { decrement: quantity },
      lastUsedAt: new Date()
    }
  });
  
  // Record on work order
  await prisma.workOrderPart.update({
    where: { workOrderId_sparePartId: { workOrderId, sparePartId: partId } },
    data: {
      quantityUsed: quantity,
      issuedAt: new Date(),
      issuedBy
    }
  });
  
  // Check reorder point
  const updatedPart = await prisma.sparePart.findUnique({ where: { id: partId } });
  if (updatedPart.quantityOnHand <= updatedPart.reorderPoint) {
    await triggerReorderAlert(updatedPart);
  }
  
  // Record inventory transaction
  await prisma.inventoryTransaction.create({
    data: {
      partId,
      type: 'ISSUE',
      quantity: -quantity,
      referenceType: 'WORK_ORDER',
      referenceId: workOrderId,
      performedBy: issuedBy
    }
  });
}
```

---

## G) AI Maintenance Assistant

### G.1 AI Assistant Capabilities

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI MAINTENANCE ASSISTANT                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CAPABILITY 1: SYMPTOM ANALYSIS                                      │
│  ───────────────────────────────                                     │
│                                                                      │
│  Input: Operator symptom report                                      │
│  Output: Probable causes ranked by likelihood                        │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Symptom: SAW-01 making unusual grinding noise                │    │
│  │                                                               │    │
│  │ AI Analysis:                                                  │    │
│  │ 1. Blade dull/worn (78% confidence) - History: 3 similar     │    │
│  │ 2. Bearing wear (15% confidence) - Last replaced 18mo ago    │    │
│  │ 3. Coolant issue (7% confidence) - Low coolant reported 2w   │    │
│  │                                                               │    │
│  │ Recommended Action: Inspect blade first, check bearing play  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  CAPABILITY 2: PM OPTIMIZATION                                       │
│  ─────────────────────────────                                       │
│                                                                      │
│  Input: PM history, failure history, usage patterns                  │
│  Output: PM interval recommendations                                 │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Asset: FORKLIFT-03                                           │    │
│  │ Current PM Interval: 250 hours                               │    │
│  │                                                               │    │
│  │ AI Recommendation:                                            │    │
│  │ "Based on 24 months of data, this forklift shows no          │    │
│  │  failures between PMs. Consider extending to 300 hours.      │    │
│  │  Potential savings: 4 fewer PMs per year (~$800)"            │    │
│  │                                                               │    │
│  │ Confidence: 72% | Requires: Manager approval                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  CAPABILITY 3: WORK ORDER DRAFTING                                   │
│  ──────────────────────────────────                                  │
│                                                                      │
│  Input: Problem description, asset                                   │
│  Output: Draft work order with tasks, parts, time estimate           │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Problem: Hydraulic cylinder leaking on SHEAR-01              │    │
│  │                                                               │    │
│  │ AI Draft WO:                                                  │    │
│  │ Title: Repair hydraulic cylinder leak - SHEAR-01             │    │
│  │ Type: CORRECTIVE                                              │    │
│  │ Priority: HIGH                                                │    │
│  │ Estimated Hours: 4                                            │    │
│  │                                                               │    │
│  │ Suggested Tasks:                                              │    │
│  │ 1. Isolate hydraulic system (LOTO required)                  │    │
│  │ 2. Relieve system pressure                                   │    │
│  │ 3. Remove cylinder                                           │    │
│  │ 4. Replace seals                                             │    │
│  │ 5. Reinstall and test                                        │    │
│  │                                                               │    │
│  │ Suggested Parts:                                              │    │
│  │ • Seal kit P/N 45678-SK (Qty: 1)                             │    │
│  │ • Hydraulic fluid (2 gal)                                    │    │
│  │                                                               │    │
│  │ Permits: LOTO required                                        │    │
│  │ [Create WO Draft] [Modify] [Cancel]                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  CAPABILITY 4: PARTS STAGING                                         │
│  ────────────────────────────                                        │
│                                                                      │
│  Input: Scheduled work orders, PM schedule                           │
│  Output: Parts to stage for upcoming work                            │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Tomorrow's Scheduled Work (Jackson Branch):                   │    │
│  │                                                               │    │
│  │ Stage these parts:                                            │    │
│  │ • 3x Saw blades (14" bi-metal) - SAW-01, 02, 03 PM           │    │
│  │ • 1x Hydraulic filter - FORKLIFT-02 PM                       │    │
│  │ • 1x Seal kit - SHEAR-01 repair                              │    │
│  │                                                               │    │
│  │ Current stock check:                                          │    │
│  │ ✓ Saw blades: 5 in stock                                     │    │
│  │ ✓ Hydraulic filter: 2 in stock                               │    │
│  │ ⚠ Seal kit: 0 in stock - ORDER EXPEDITE                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  CAPABILITY 5: FAILURE PATTERN LEARNING                              │
│  ───────────────────────────────────────                             │
│                                                                      │
│  Input: Work order history, failure modes                            │
│  Output: Recurring failure patterns, root cause suggestions          │
│                                                                      │
│  Example:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Pattern Detected: ROUTER-02                                   │    │
│  │                                                               │    │
│  │ Observation:                                                  │    │
│  │ "Spindle bearing failures occur every 6-8 months.            │    │
│  │  3 failures in past 2 years, always after heavy aluminum     │    │
│  │  routing jobs."                                               │    │
│  │                                                               │    │
│  │ Possible Root Causes:                                         │    │
│  │ 1. Coolant contamination from aluminum chips                 │    │
│  │ 2. Spindle speed too high for aluminum                       │    │
│  │ 3. Bearing lubrication inadequate                            │    │
│  │                                                               │    │
│  │ Recommended Actions:                                          │    │
│  │ • Add spindle bearing inspection to monthly PM               │    │
│  │ • Review aluminum routing parameters                         │    │
│  │ • Consider upgrade to sealed bearings                        │    │
│  │                                                               │    │
│  │ [Create Improvement Project] [Dismiss] [Investigate More]    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### G.2 AI Guardrails

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI MAINTENANCE GUARDRAILS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║  GUARDRAIL 1: NEVER BYPASS SAFETY                              ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                                ║  │
│  ║  AI CANNOT:                                                    ║  │
│  ║  ✗ Waive LOTO requirements                                     ║  │
│  ║  ✗ Skip permit requirements                                    ║  │
│  ║  ✗ Recommend work without proper isolation                     ║  │
│  ║  ✗ Override safety holds                                       ║  │
│  ║  ✗ Approve work in hazardous conditions                        ║  │
│  ║                                                                ║  │
│  ║  If safety concern detected:                                   ║  │
│  ║  → AI flags for human review                                   ║  │
│  ║  → AI includes safety warnings in recommendations              ║  │
│  ║  → AI refuses to proceed without safety acknowledgment         ║  │
│  ║                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║  GUARDRAIL 2: NEVER AUTHORIZE RETURN-TO-SERVICE                ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                                ║  │
│  ║  AI CANNOT:                                                    ║  │
│  ║  ✗ Approve return-to-service                                   ║  │
│  ║  ✗ Change asset status to IN_SERVICE                           ║  │
│  ║  ✗ Close work orders                                           ║  │
│  ║  ✗ Remove equipment holds                                      ║  │
│  ║  ✗ Verify repair completion                                    ║  │
│  ║                                                                ║  │
│  ║  Return-to-service ALWAYS requires:                            ║  │
│  ║  → Human verification                                          ║  │
│  ║  → Authorized approver signature                               ║  │
│  ║  → Test run confirmation                                       ║  │
│  ║                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║  GUARDRAIL 3: ALWAYS REQUIRE HUMAN VERIFICATION                ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                                ║  │
│  ║  AI recommendations are SUGGESTIONS only:                      ║  │
│  ║  • Maintenance tech reviews before executing                   ║  │
│  ║  • Manager approves PM interval changes                        ║  │
│  ║  • Technician confirms parts requirements                      ║  │
│  ║  • Supervisor validates failure analysis                       ║  │
│  ║                                                                ║  │
│  ║  All AI suggestions tagged with:                               ║  │
│  ║  → Confidence level                                            ║  │
│  ║  → Data basis                                                  ║  │
│  ║  → Human approval required (Y/N)                               ║  │
│  ║                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║  GUARDRAIL 4: TRANSPARENT REASONING                            ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                                ║  │
│  ║  AI must explain:                                              ║  │
│  ║  • Why this recommendation?                                    ║  │
│  ║  • What data was used?                                         ║  │
│  ║  • What is the confidence level?                               ║  │
│  ║  • What are the alternatives?                                  ║  │
│  ║  • What could go wrong?                                        ║  │
│  ║                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### G.3 AI Prompt Template

```javascript
const maintenanceAIPrompt = {
  systemPrompt: `You are a maintenance AI assistant for industrial equipment 
in a metals and plastics service center. You help maintenance technicians 
diagnose problems, plan work, and optimize PM schedules.

CRITICAL RULES:
1. NEVER recommend bypassing safety procedures (LOTO, permits)
2. NEVER authorize return-to-service - always require human approval
3. ALWAYS flag safety concerns prominently
4. ALWAYS include confidence levels in recommendations
5. ALWAYS explain your reasoning
6. If uncertain, say so and recommend expert review

You have access to:
- Equipment history (work orders, failures, PMs)
- Parts inventory
- Operator reports
- SPC data
- PM schedules`,

  responseFormat: {
    analysis: 'string',
    recommendations: [{
      action: 'string',
      confidence: 'number',
      reasoning: 'string',
      safetyConsiderations: 'string[]',
      requiresApproval: 'boolean',
      approvalLevel: 'string'
    }],
    partsNeeded: [{
      partNumber: 'string',
      quantity: 'number',
      inStock: 'boolean'
    }],
    estimatedTime: 'number',
    warnings: 'string[]'
  }
};
```

---

## H) UI / UX Design (Material UI)

### H.1 Maintenance Module Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│                 MAINTENANCE MODULE NAVIGATION                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  🏭 ALROWARE  │  Maintenance                 👤 Maint Manager │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  📊 Dashboard  🔧 Work Orders  ⚙️ Assets  📅 PM  📦 Parts     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  TABS:                                                               │
│  ┌────────────┐                                                      │
│  │ Dashboard  │ Today's WOs, overdue PM, downtime metrics           │
│  ├────────────┤                                                      │
│  │ Work Orders│ Active, pending, history                            │
│  ├────────────┤                                                      │
│  │ Assets     │ Equipment registry, status, history                 │
│  ├────────────┤                                                      │
│  │ PM         │ Schedules, templates, compliance                    │
│  ├────────────┤                                                      │
│  │ Parts      │ Spare parts inventory, usage                        │
│  ├────────────┤                                                      │
│  │ Downtime   │ Analytics, trends, costs                            │
│  ├────────────┤                                                      │
│  │ Reports    │ MTTR, MTBF, OEE, compliance                         │
│  └────────────┘                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### H.2 Maintenance Dashboard

```jsx
// MaintenanceDashboard.jsx
import React from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent,
  Chip, Alert, List, ListItem, ListItemText, LinearProgress,
  IconButton, Button
} from '@mui/material';
import {
  Build, Warning, Schedule, CheckCircle,
  TrendingDown, AccessTime, LocalShipping
} from '@mui/icons-material';

const MetricCard = ({ title, value, subtitle, color, icon: Icon }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>
        <Icon sx={{ color: `${color}.main` }} />
      </Box>
      <Typography variant="h3" sx={{ color: `${color}.main`, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
);

const WorkOrderCard = ({ wo }) => (
  <Card sx={{ mb: 1, borderLeft: 4, borderColor: getPriorityColor(wo.priority) }}>
    <CardContent sx={{ py: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2">{wo.woNumber}</Typography>
          <Typography variant="body2" color="text.secondary">
            {wo.asset} - {wo.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            size="small" 
            label={wo.type} 
            color={wo.type === 'BREAKDOWN' ? 'error' : 'default'} 
          />
          <Chip 
            size="small" 
            label={wo.status} 
            variant="outlined" 
          />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const MaintenanceDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Alerts */}
      <Alert severity="error" sx={{ mb: 2 }}>
        <strong>BREAKDOWN:</strong> SAW-02 reported down - Technician en route
      </Alert>
      <Alert severity="warning" sx={{ mb: 3 }}>
        2 PM work orders are overdue - Immediate attention required
      </Alert>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Active Work Orders"
            value="12"
            subtitle="4 high priority"
            color="primary"
            icon={Build}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="PM Compliance"
            value="94%"
            subtitle="This month"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Assets Down"
            value="2"
            subtitle="SAW-02, FORKLIFT-05"
            color="error"
            icon={Warning}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Avg MTTR"
            value="2.4h"
            subtitle="↓ 15% vs last month"
            color="info"
            icon={AccessTime}
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Today's Work Orders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Today's Work Orders</Typography>
              <Button size="small">View All</Button>
            </Box>
            <WorkOrderCard wo={{
              woNumber: 'WO-2026-0892',
              asset: 'SAW-02',
              title: 'Breakdown - Motor overheating',
              type: 'BREAKDOWN',
              status: 'IN_PROGRESS',
              priority: 'EMERGENCY'
            }} />
            <WorkOrderCard wo={{
              woNumber: 'WO-2026-0891',
              asset: 'FORKLIFT-03',
              title: 'Weekly PM',
              type: 'PM',
              status: 'SCHEDULED',
              priority: 'NORMAL'
            }} />
            <WorkOrderCard wo={{
              woNumber: 'WO-2026-0890',
              asset: 'ROUTER-01',
              title: 'Spindle vibration check',
              type: 'CORRECTIVE',
              status: 'WAITING_PARTS',
              priority: 'HIGH'
            }} />
          </Paper>
        </Grid>
        
        {/* Overdue PMs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'warning.main' }}>
              ⚠️ Overdue PMs
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="SHEAR-01 - Monthly Inspection"
                  secondary="Due: Feb 1 (3 days overdue)"
                />
                <Button size="small" variant="contained" color="warning">
                  Create WO
                </Button>
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="CRANE-02 - Quarterly Cert"
                  secondary="Due: Jan 31 (4 days overdue)"
                />
                <Button size="small" variant="contained" color="warning">
                  Create WO
                </Button>
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* Downtime Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Downtime This Week
            </Typography>
            {/* Downtime chart would go here */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">SAW-02</Typography>
                <Typography variant="body2">4.5 hours</Typography>
              </Box>
              <LinearProgress variant="determinate" value={45} color="error" />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">FORKLIFT-05</Typography>
                <Typography variant="body2">2.0 hours</Typography>
              </Box>
              <LinearProgress variant="determinate" value={20} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Parts Low Stock */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Parts Below Reorder Point
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Saw Blade 14in Bi-Metal"
                  secondary="Stock: 2 | Reorder: 5"
                />
                <Chip size="small" color="warning" label="Low" />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Hydraulic Filter HF-4500"
                  secondary="Stock: 0 | Reorder: 2"
                />
                <Chip size="small" color="error" label="Out" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### H.3 Asset Registry Screen

```jsx
// AssetRegistry.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, IconButton, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, List, ListItem, ListItemText, Divider,
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot
} from '@mui/material';
import {
  Search, QrCodeScanner, Edit, History, Build,
  CheckCircle, Warning, Error, Description
} from '@mui/icons-material';

const AssetStatusChip = ({ status }) => {
  const config = {
    IN_SERVICE: { color: 'success', label: 'In Service' },
    OUT_OF_SERVICE: { color: 'error', label: 'Out of Service' },
    MAINTENANCE: { color: 'warning', label: 'Maintenance' },
    SAFETY_HOLD: { color: 'error', label: 'Safety Hold' },
    QUALITY_HOLD: { color: 'warning', label: 'Quality Hold' },
    PENDING_RETURN: { color: 'info', label: 'Pending Return' }
  };
  
  return (
    <Chip 
      size="small" 
      color={config[status]?.color || 'default'} 
      label={config[status]?.label || status}
    />
  );
};

const CriticalityChip = ({ criticality }) => (
  <Chip 
    size="small" 
    variant="outlined"
    label={`Class ${criticality}`}
    color={criticality === 'A' ? 'error' : criticality === 'B' ? 'warning' : 'default'}
  />
);

const AssetDetailDialog = ({ asset, open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      {asset?.assetNumber} - {asset?.name}
    </DialogTitle>
    <DialogContent>
      <Grid container spacing={3}>
        {/* Asset Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary">Details</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Manufacturer" secondary={asset?.manufacturer} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Model" secondary={asset?.model} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Serial Number" secondary={asset?.serialNumber} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Location" secondary={asset?.location} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Criticality" secondary={asset?.criticality} />
            </ListItem>
          </List>
        </Grid>
        
        {/* Status & Meters */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary">Status & Meters</Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Status" 
                secondary={<AssetStatusChip status={asset?.status} />} 
              />
            </ListItem>
            <ListItem>
              <ListItemText primary="Current Hours" secondary={asset?.currentHours} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Last PM" secondary={asset?.lastPMDate} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Next PM Due" secondary={asset?.nextPMDueDate} />
            </ListItem>
          </List>
        </Grid>
        
        {/* Recent History */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Recent Maintenance History
          </Typography>
          <Timeline position="right">
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success"><CheckCircle /></TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2">Weekly PM Completed</Typography>
                <Typography variant="body2" color="text.secondary">
                  Jan 28, 2026 - WO-2026-0845
                </Typography>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="warning"><Build /></TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2">Blade Replacement</Typography>
                <Typography variant="body2" color="text.secondary">
                  Jan 15, 2026 - WO-2026-0712
                </Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </Grid>
      </Grid>
    </DialogContent>
  </Dialog>
);

export const AssetRegistry = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const assets = [
    {
      assetNumber: 'SAW-JKS-001',
      name: 'DoALL C-916 Band Saw',
      type: 'SAW',
      manufacturer: 'DoALL',
      model: 'C-916',
      location: 'Jackson - Sawing Area',
      status: 'IN_SERVICE',
      criticality: 'A',
      currentHours: 4850
    },
    {
      assetNumber: 'SAW-JKS-002',
      name: 'Kalamazoo K10 Cold Saw',
      type: 'SAW',
      manufacturer: 'Kalamazoo',
      model: 'K10',
      location: 'Jackson - Sawing Area',
      status: 'MAINTENANCE',
      criticality: 'B',
      currentHours: 3200
    }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Asset Registry</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<QrCodeScanner />} variant="outlined">
            Scan QR
          </Button>
          <Button variant="contained">
            Add Asset
          </Button>
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Asset number, name..."
              InputProps={{ startAdornment: <Search fontSize="small" /> }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Type"
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="SAW">Saw</option>
              <option value="ROUTER">Router</option>
              <option value="FORKLIFT">Forklift</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="IN_SERVICE">In Service</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
              <option value="MAINTENANCE">Maintenance</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Criticality"
              SelectProps={{ native: true }}
            >
              <option value="">All</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Asset Table */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Asset Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criticality</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map(asset => (
              <TableRow 
                key={asset.assetNumber}
                hover
                onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{asset.assetNumber}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell><AssetStatusChip status={asset.status} /></TableCell>
                <TableCell><CriticalityChip criticality={asset.criticality} /></TableCell>
                <TableCell>{asset.currentHours?.toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton size="small"><Edit fontSize="small" /></IconButton>
                  <IconButton size="small"><History fontSize="small" /></IconButton>
                  <IconButton size="small"><Description fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      
      <AssetDetailDialog 
        asset={selectedAsset}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
};
```

### H.4 Work Order Center

```jsx
// WorkOrderCenter.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Tabs, Tab, Card, CardContent, Chip, Stepper, Step,
  StepLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select,
  MenuItem, Checkbox, FormControlLabel, Alert
} from '@mui/material';
import {
  Add, Assignment, Build, CheckCircle, 
  Warning, Schedule, LocalShipping
} from '@mui/icons-material';

const WorkOrderWizard = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const steps = ['Select Asset', 'Describe Problem', 'Safety & Permits', 'Review'];
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Work Order</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 4, mt: 2 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {step === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Asset Number or Scan QR"
                placeholder="SAW-JKS-001"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Work Order Type</InputLabel>
                <Select label="Work Order Type">
                  <MenuItem value="CORRECTIVE">Corrective</MenuItem>
                  <MenuItem value="PM">Preventive Maintenance</MenuItem>
                  <MenuItem value="BREAKDOWN">Breakdown</MenuItem>
                  <MenuItem value="INSPECTION">Inspection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select label="Priority">
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {step === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                placeholder="Brief description of the problem"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Detailed Description"
                placeholder="Describe the problem, symptoms, when it started..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Problem Code</InputLabel>
                <Select label="Problem Code">
                  <MenuItem value="MECH">Mechanical</MenuItem>
                  <MenuItem value="ELEC">Electrical</MenuItem>
                  <MenuItem value="HYDR">Hydraulic</MenuItem>
                  <MenuItem value="TOOL">Tooling</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {step === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning">
                This work order may require safety permits. Please review.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox />}
                label="LOTO (Lockout/Tagout) Required"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox />}
                label="Hot Work Permit Required"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox />}
                label="Confined Space Entry Required"
              />
            </Grid>
          </Grid>
        )}
        
        {step === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Review Work Order</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Asset</Typography>
                <Typography>SAW-JKS-001</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Typography>Corrective</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Priority</Typography>
                <Chip label="HIGH" color="warning" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">LOTO Required</Typography>
                <Typography>Yes</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step > 0 && (
          <Button onClick={() => setStep(step - 1)}>Back</Button>
        )}
        {step < steps.length - 1 ? (
          <Button variant="contained" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="contained" color="primary">
            Create Work Order
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export const WorkOrderCenter = () => {
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Work Order Center</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
        >
          Create Work Order
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Active (12)" icon={<Build />} iconPosition="start" />
          <Tab label="Pending Approval (3)" icon={<Schedule />} iconPosition="start" />
          <Tab label="Waiting Parts (4)" icon={<LocalShipping />} iconPosition="start" />
          <Tab label="Completed" icon={<CheckCircle />} iconPosition="start" />
        </Tabs>
      </Paper>
      
      {/* Work order list would go here */}
      
      <WorkOrderWizard open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
};
```

### H.5 Return-to-Service Approval Screen

```jsx
// ReturnToServiceApproval.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip,
  List, ListItem, ListItemText, ListItemIcon,
  Checkbox, TextField, Alert, Divider, Card, CardContent
} from '@mui/material';
import {
  CheckCircle, Cancel, Warning, Security,
  Build, Assignment, Camera
} from '@mui/icons-material';

export const ReturnToServiceApproval = ({ workOrderId }) => {
  const [checklistComplete, setChecklistComplete] = useState({});
  
  const checklist = [
    { id: 'work', label: 'Work performed as specified', required: true },
    { id: 'tasks', label: 'All tasks completed and documented', required: true },
    { id: 'parts', label: 'Parts properly installed', required: true },
    { id: 'guards', label: 'All guards and covers reinstalled', required: true },
    { id: 'loto', label: 'LOTO removed by authorized person', required: true },
    { id: 'testrun', label: 'Test run performed', required: true },
    { id: 'testpassed', label: 'Test run passed - no abnormalities', required: true },
    { id: 'safety', label: 'All safety devices functional', required: true },
    { id: 'clean', label: 'Work area clean', required: false }
  ];
  
  const allRequiredComplete = checklist
    .filter(c => c.required)
    .every(c => checklistComplete[c.id]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Return-to-Service Approval
      </Typography>
      
      <Grid container spacing={3}>
        {/* Work Order Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Work Order Summary</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">WO Number</Typography>
                <Typography>WO-2026-0892</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Asset</Typography>
                <Typography>SAW-JKS-002</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Chip label="BREAKDOWN" color="error" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Technician</Typography>
                <Typography>Mike Johnson</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Work Performed</Typography>
                <Typography>
                  Replaced motor bearings. Cleaned and relubricated. 
                  Checked alignment. Test run 30 minutes - no issues.
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip icon={<Camera />} label="Before Photo" size="small" clickable />
              <Chip icon={<Camera />} label="After Photo" size="small" clickable />
              <Chip icon={<Assignment />} label="Checklist" size="small" clickable />
            </Box>
          </Paper>
        </Grid>
        
        {/* Verification Checklist */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verification Checklist
            </Typography>
            
            <List dense>
              {checklist.map(item => (
                <ListItem key={item.id} disablePadding>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      checked={!!checklistComplete[item.id]}
                      onChange={(e) => setChecklistComplete(prev => ({
                        ...prev,
                        [item.id]: e.target.checked
                      }))}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    secondary={item.required ? 'Required' : 'Optional'}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Safety-Related Alert */}
        <Grid item xs={12}>
          <Alert severity="warning" icon={<Security />}>
            This was a <strong>SAFETY-RELATED</strong> work order. 
            EHS signoff is required before return-to-service.
          </Alert>
        </Grid>
        
        {/* First Article Required */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                First-Article Inspection Required
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Major bearing replacement requires quality verification before 
                returning asset to full production.
              </Typography>
              <Button variant="outlined" color="info">
                Request First-Article Inspection
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Approval Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Notes"
            placeholder="Enter any additional notes for the approval record..."
          />
        </Grid>
        
        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<Cancel />}
            >
              Reject - Needs More Work
            </Button>
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckCircle />}
              disabled={!allRequiredComplete}
            >
              Approve Return-to-Service
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### H.6 Operator Equipment Report Form

```jsx
// OperatorEquipmentReport.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  ToggleButton, ToggleButtonGroup, Alert, Chip,
  FormControlLabel, Switch, Card, CardContent
} from '@mui/material';
import {
  Warning, Error, CameraAlt, Send, QrCodeScanner
} from '@mui/icons-material';

export const OperatorEquipmentReport = () => {
  const [reportType, setReportType] = useState('BREAKDOWN');
  const [severity, setSeverity] = useState('HIGH');
  const [symptom, setSymptom] = useState('');
  const [stoppedEquipment, setStoppedEquipment] = useState(false);
  const [safetyHazard, setSafetyHazard] = useState(false);
  
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        Report Equipment Problem
      </Typography>
      
      {/* Quick QR Scan */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<QrCodeScanner />}
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            Scan Equipment QR Code
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Or enter asset number below
          </Typography>
        </CardContent>
      </Card>
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Asset ID */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Asset Number"
              placeholder="SAW-JKS-001"
              required
            />
          </Grid>
          
          {/* Report Type */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>What's the issue?</Typography>
            <ToggleButtonGroup
              value={reportType}
              exclusive
              onChange={(e, v) => v && setReportType(v)}
              fullWidth
            >
              <ToggleButton value="BREAKDOWN" color="error">
                <Error sx={{ mr: 1 }} /> Breakdown
              </ToggleButton>
              <ToggleButton value="ABNORMALITY" color="warning">
                <Warning sx={{ mr: 1 }} /> Abnormality
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          {/* Severity */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>How urgent?</Typography>
            <ToggleButtonGroup
              value={severity}
              exclusive
              onChange={(e, v) => v && setSeverity(v)}
              fullWidth
            >
              <ToggleButton value="CRITICAL">Critical</ToggleButton>
              <ToggleButton value="HIGH">High</ToggleButton>
              <ToggleButton value="MEDIUM">Medium</ToggleButton>
              <ToggleButton value="LOW">Low</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          {/* Symptom */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>What's happening?</Typography>
            <Grid container spacing={1}>
              {[
                'Not Starting', 'Unusual Noise', 'Vibration',
                'Overheating', 'Leaking', 'Smoke/Smell',
                'Quality Issue', 'Slow', 'Intermittent'
              ].map(s => (
                <Grid item key={s}>
                  <Chip
                    label={s}
                    onClick={() => setSymptom(s)}
                    color={symptom === s ? 'primary' : 'default'}
                    variant={symptom === s ? 'filled' : 'outlined'}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Describe the problem"
              placeholder="What happened? When did it start?"
              required
            />
          </Grid>
          
          {/* Safety Questions */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={stoppedEquipment}
                  onChange={(e) => setStoppedEquipment(e.target.checked)}
                />
              }
              label="I have stopped the equipment"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={safetyHazard}
                  onChange={(e) => setSafetyHazard(e.target.checked)}
                  color="error"
                />
              }
              label="This is a safety hazard"
            />
          </Grid>
          
          {safetyHazard && (
            <Grid item xs={12}>
              <Alert severity="error">
                A safety hazard has been flagged. EHS will be notified immediately.
              </Alert>
            </Grid>
          )}
          
          {/* Photo */}
          <Grid item xs={12}>
            <Button 
              variant="outlined" 
              startIcon={<CameraAlt />}
              fullWidth
            >
              Add Photo
            </Button>
          </Grid>
          
          {/* Submit */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<Send />}
              fullWidth
            >
              Submit Report
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
```

---

## I) Roles & Permissions

### I.1 Maintenance Module Roles

| Role | Description | Typical User |
|------|-------------|--------------|
| **MAINT_ADMIN** | Full access to all maintenance functions | Maintenance Director |
| **MAINT_MANAGER** | Manage WOs, approve return-to-service | Maintenance Manager |
| **MAINT_PLANNER** | Schedule PMs, manage parts | Maintenance Planner |
| **MAINT_TECH** | Execute work orders, log time | Maintenance Technician |
| **MAINT_SUPERVISOR** | Approve WOs, manage team | Maintenance Supervisor |
| **OPERATOR** | Report problems, basic checks | Machine Operator |
| **EHS** | Safety holds, LOTO verification | Safety Officer |
| **QUALITY** | View quality-linked WOs | Quality Engineer |

### I.2 Permission Matrix

| Action | ADMIN | MANAGER | PLANNER | TECH | SUPER | OPERATOR | EHS |
|--------|-------|---------|---------|------|-------|----------|-----|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | Limited | ✓ |
| Create WO | ✓ | ✓ | ✓ | ✓ | ✓ | Report only | ✓ |
| Approve WO | ✓ | ✓ | — | — | ✓ | — | Safety only |
| Execute WO | ✓ | ✓ | — | ✓ | ✓ | — | — |
| Close WO | ✓ | ✓ | — | — | ✓ | — | — |
| Return to Service | ✓ | ✓ | — | — | — | — | Safety WOs |
| Change Asset Status | ✓ | ✓ | — | — | ✓ | — | Safety holds |
| Manage PM Schedules | ✓ | ✓ | ✓ | — | — | — | — |
| Manage PM Templates | ✓ | ✓ | ✓ | — | — | — | — |
| Manage Parts Inventory | ✓ | ✓ | ✓ | Issue | — | — | — |
| View All Assets | ✓ | ✓ | ✓ | ✓ | ✓ | Assigned | ✓ |
| Edit Asset Details | ✓ | ✓ | ✓ | — | — | — | — |
| Decommission Asset | ✓ | ✓ | — | — | — | — | — |
| View Reports | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Configure System | ✓ | — | — | — | — | — | — |

### I.3 Return-to-Service Authorization

| Work Order Type | Approver Required | EHS Required |
|-----------------|-------------------|--------------|
| PM | Supervisor or Manager | No (unless safety-related) |
| Corrective | Manager | No (unless safety-related) |
| Breakdown | Manager | No (unless safety-related) |
| Safety-Related | Manager + EHS | **Yes** |
| Quality-Related | Manager | No (but first-article may be required) |
| After SWA | Manager + EHS + Operations | **Yes** |

---

## J) APIs & Eventing

### J.1 REST API Endpoints

```yaml
# Asset APIs
GET    /api/v1/maintenance/assets                    # List assets
GET    /api/v1/maintenance/assets/:id                # Get asset details
POST   /api/v1/maintenance/assets                    # Create asset
PUT    /api/v1/maintenance/assets/:id                # Update asset
POST   /api/v1/maintenance/assets/:id/status         # Change status
GET    /api/v1/maintenance/assets/:id/history        # Get maintenance history
GET    /api/v1/maintenance/assets/:id/meters         # Get meter readings
POST   /api/v1/maintenance/assets/:id/meters         # Record meter reading

# Work Order APIs
GET    /api/v1/maintenance/work-orders               # List work orders
GET    /api/v1/maintenance/work-orders/:id           # Get WO details
POST   /api/v1/maintenance/work-orders               # Create WO
PUT    /api/v1/maintenance/work-orders/:id           # Update WO
POST   /api/v1/maintenance/work-orders/:id/submit    # Submit for approval
POST   /api/v1/maintenance/work-orders/:id/approve   # Approve WO
POST   /api/v1/maintenance/work-orders/:id/start     # Start work
POST   /api/v1/maintenance/work-orders/:id/complete  # Complete work
POST   /api/v1/maintenance/work-orders/:id/verify    # Verify completion
POST   /api/v1/maintenance/work-orders/:id/close     # Close WO
POST   /api/v1/maintenance/work-orders/:id/tasks/:taskId/complete  # Complete task
POST   /api/v1/maintenance/work-orders/:id/parts     # Request parts
POST   /api/v1/maintenance/work-orders/:id/labor     # Log labor

# PM Schedule APIs
GET    /api/v1/maintenance/pm-schedules              # List PM schedules
GET    /api/v1/maintenance/pm-schedules/:id          # Get schedule details
POST   /api/v1/maintenance/pm-schedules              # Create schedule
PUT    /api/v1/maintenance/pm-schedules/:id          # Update schedule
GET    /api/v1/maintenance/pm-schedules/due          # Get due PMs
GET    /api/v1/maintenance/pm-schedules/overdue      # Get overdue PMs

# PM Template APIs
GET    /api/v1/maintenance/pm-templates              # List templates
GET    /api/v1/maintenance/pm-templates/:id          # Get template
POST   /api/v1/maintenance/pm-templates              # Create template
PUT    /api/v1/maintenance/pm-templates/:id          # Update template

# Parts APIs
GET    /api/v1/maintenance/parts                     # List spare parts
GET    /api/v1/maintenance/parts/:id                 # Get part details
POST   /api/v1/maintenance/parts                     # Create part
PUT    /api/v1/maintenance/parts/:id                 # Update part
POST   /api/v1/maintenance/parts/:id/issue           # Issue part
POST   /api/v1/maintenance/parts/:id/receive         # Receive part
GET    /api/v1/maintenance/parts/low-stock           # Get low stock parts

# Downtime APIs
GET    /api/v1/maintenance/downtime                  # List downtime records
POST   /api/v1/maintenance/downtime                  # Start downtime
PUT    /api/v1/maintenance/downtime/:id              # End downtime
GET    /api/v1/maintenance/downtime/analytics        # Get downtime analytics

# Operator Report API
POST   /api/v1/maintenance/reports/operator          # Submit operator report
```

### J.2 Event Types

| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `asset.status_changed` | Asset status changes | Dispatch, Quality, Safety |
| `asset.pm_due` | PM coming due | Maintenance team |
| `asset.pm_overdue` | PM is overdue | Manager, escalation |
| `asset.certification_expiring` | Cert expiring soon | Manager, compliance |
| `wo.created` | Work order created | Assigned tech, supervisor |
| `wo.approved` | WO approved | Assigned tech |
| `wo.started` | Work started | Supervisor, dispatch |
| `wo.completed` | Work completed | Manager for verification |
| `wo.verified` | WO verified | Operations, dispatch |
| `wo.closed` | WO closed | Analytics |
| `wo.waiting_parts` | Parts needed | Planner, purchasing |
| `downtime.started` | Asset went down | Dispatch, scheduler, manager |
| `downtime.ended` | Asset back up | Dispatch, scheduler |
| `return_to_service.requested` | RTS requested | Manager, EHS (if safety) |
| `return_to_service.approved` | RTS approved | Dispatch, operations |
| `parts.low_stock` | Below reorder point | Planner, purchasing |
| `parts.out_of_stock` | Zero quantity | Planner, manager |

### J.3 Express.js Route Implementation

```javascript
// routes/maintenance.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { emitMaintenanceEvent } = require('../services/events');

// Change asset status
router.post('/assets/:id/status',
  requireAuth,
  requireRole(['MAINT_ADMIN', 'MAINT_MANAGER', 'MAINT_SUPERVISOR', 'EHS']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      const previousAsset = await prisma.asset.findUnique({ where: { id } });
      
      // Validate status transition
      if (!isValidStatusTransition(previousAsset.status, status, req.user.roles)) {
        return res.status(400).json({ 
          error: `Cannot transition from ${previousAsset.status} to ${status}` 
        });
      }
      
      // EHS required for safety holds
      if (status === 'SAFETY_HOLD' && !req.user.roles.includes('EHS')) {
        return res.status(403).json({ error: 'EHS role required for safety holds' });
      }
      
      const asset = await prisma.asset.update({
        where: { id },
        data: {
          status,
          statusReason: reason,
          statusChangedAt: new Date(),
          statusChangedBy: req.user.id
        }
      });
      
      // Emit event
      await emitMaintenanceEvent('asset.status_changed', {
        assetId: id,
        previousStatus: previousAsset.status,
        newStatus: status,
        reason,
        changedBy: req.user.id
      });
      
      // If out of service, start downtime
      if (status !== 'IN_SERVICE' && previousAsset.status === 'IN_SERVICE') {
        await prisma.downtimeRecord.create({
          data: {
            assetId: id,
            type: mapStatusToDowntimeType(status),
            reasonCode: reason,
            startTime: new Date(),
            reportedBy: req.user.id
          }
        });
        
        await emitMaintenanceEvent('downtime.started', { assetId: id });
      }
      
      // If returning to service, end downtime
      if (status === 'IN_SERVICE' && previousAsset.status !== 'IN_SERVICE') {
        const activeDowntime = await prisma.downtimeRecord.findFirst({
          where: { assetId: id, endTime: null },
          orderBy: { startTime: 'desc' }
        });
        
        if (activeDowntime) {
          await prisma.downtimeRecord.update({
            where: { id: activeDowntime.id },
            data: {
              endTime: new Date(),
              durationMinutes: calculateDuration(activeDowntime.startTime, new Date())
            }
          });
          
          await emitMaintenanceEvent('downtime.ended', { assetId: id });
        }
      }
      
      res.json(asset);
    } catch (error) {
      console.error('Change asset status error:', error);
      res.status(500).json({ error: 'Failed to change asset status' });
    }
  }
);

// Return to service approval
router.post('/work-orders/:id/return-to-service',
  requireAuth,
  requireRole(['MAINT_ADMIN', 'MAINT_MANAGER', 'EHS']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        checklistItems, 
        testRunPassed, 
        notes,
        firstArticlePassed 
      } = req.body;
      
      const wo = await prisma.workOrder.findUnique({
        where: { id },
        include: { asset: true }
      });
      
      if (!wo) {
        return res.status(404).json({ error: 'Work order not found' });
      }
      
      if (wo.status !== 'COMPLETED' && wo.status !== 'VERIFIED') {
        return res.status(400).json({ error: 'Work order must be completed first' });
      }
      
      // Safety-related WOs require EHS
      if (wo.type === 'SAFETY_RELATED' && !req.user.roles.includes('EHS')) {
        return res.status(403).json({ 
          error: 'EHS approval required for safety-related work orders' 
        });
      }
      
      // Validate checklist
      const requiredItems = checklistItems.filter(c => c.required);
      if (!requiredItems.every(c => c.completed)) {
        return res.status(400).json({ 
          error: 'All required checklist items must be completed' 
        });
      }
      
      // First-article check
      if (wo.requiresFirstArticle && firstArticlePassed === undefined) {
        return res.status(400).json({ 
          error: 'First-article inspection result required' 
        });
      }
      
      // Update work order
      await prisma.workOrder.update({
        where: { id },
        data: {
          status: 'CLOSED',
          verifiedBy: req.user.id,
          verifiedAt: new Date(),
          verificationNotes: notes,
          testRunPassed,
          firstArticlePassed,
          closedAt: new Date()
        }
      });
      
      // Update asset status
      await prisma.asset.update({
        where: { id: wo.assetId },
        data: {
          status: 'IN_SERVICE',
          statusReason: `Returned to service per WO ${wo.woNumber}`,
          statusChangedAt: new Date(),
          statusChangedBy: req.user.id
        }
      });
      
      // Emit events
      await emitMaintenanceEvent('return_to_service.approved', {
        workOrderId: id,
        assetId: wo.assetId,
        approvedBy: req.user.id
      });
      
      await emitMaintenanceEvent('asset.status_changed', {
        assetId: wo.assetId,
        newStatus: 'IN_SERVICE',
        changedBy: req.user.id
      });
      
      res.json({ success: true, message: 'Asset returned to service' });
    } catch (error) {
      console.error('Return to service error:', error);
      res.status(500).json({ error: 'Failed to return asset to service' });
    }
  }
);

module.exports = router;
```

---

## K) Audit & Evidence

### K.1 Audit Log Schema

```prisma
model MaintenanceAuditLog {
  id                    String    @id @default(uuid())
  
  // What
  entityType            String    // ASSET, WORK_ORDER, PM_SCHEDULE
  entityId              String
  action                String
  
  // Before/After
  previousState         Json?
  newState              Json?
  changedFields         String[]
  
  // Who
  userId                String
  userRole              String
  userName              String
  
  // When
  occurredAt            DateTime  @default(now())
  
  // Context
  ipAddress             String?
  reason                String?
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([occurredAt])
}
```

### K.2 Evidence Requirements

| Action | Evidence Required | Retention |
|--------|-------------------|-----------|
| Work Order Completion | Checklist, time log, parts used | 7 years |
| Return-to-Service | Verification checklist, test run, approval | 10 years |
| LOTO Application | Permit, energy isolation verification | 10 years |
| LOTO Removal | Authorized person verification | 10 years |
| Safety-Related WO | All safety documentation, EHS approval | 10 years |
| PM Execution | Checklist, measurements, photos | 7 years |
| Asset Status Change | Reason, approver, timestamp | 7 years |
| Downtime Record | Start, end, reason, impacted jobs | 5 years |
| First-Article | Inspection results, approval | 7 years |

### K.3 Attachment Requirements

```javascript
const workOrderEvidenceRules = {
  BREAKDOWN: {
    required: ['PHOTO_BEFORE', 'PHOTO_AFTER', 'CHECKLIST'],
    optional: ['DOCUMENT', 'TEST_RESULT']
  },
  PM: {
    required: ['CHECKLIST'],
    optional: ['PHOTO_BEFORE', 'PHOTO_AFTER', 'DOCUMENT']
  },
  SAFETY_RELATED: {
    required: ['PERMIT', 'CHECKLIST', 'PHOTO_BEFORE', 'PHOTO_AFTER', 'SIGNATURE'],
    optional: ['TEST_RESULT', 'DOCUMENT']
  },
  CORRECTIVE: {
    required: ['CHECKLIST'],
    optional: ['PHOTO_BEFORE', 'PHOTO_AFTER', 'DOCUMENT']
  }
};
```

---

## L) Testing & Validation

### L.1 Critical Test Scenarios

#### Scenario 1: Out-of-Service Blocks Dispatch

```gherkin
Feature: Asset Status Integration with Dispatch

Scenario: Out-of-service asset removed from dispatch
  Given Asset SAW-01 is IN_SERVICE
  And Job JOB-001 is scheduled on SAW-01
  When Operator reports breakdown on SAW-01
  Then Asset status changes to OUT_OF_SERVICE
  And Dispatch receives asset.status_changed event
  And SAW-01 is removed from available work centers
  And JOB-001 is flagged for rerouting
  And Scheduler is notified

Scenario: Returned asset restored to dispatch
  Given Asset SAW-01 is OUT_OF_SERVICE
  When Work order is closed with return-to-service approved
  Then Asset status changes to IN_SERVICE
  And Dispatch receives asset.status_changed event
  And SAW-01 is added back to available work centers
```

#### Scenario 2: PM Overdue Triggers Alerts

```gherkin
Feature: PM Overdue Handling

Scenario: PM overdue sends alerts
  Given Asset FORKLIFT-01 has weekly PM due Feb 1
  And Today is Feb 8 (7 days overdue)
  And PM schedule has overdueAction = ALERT
  When PM processor runs
  Then Alert is sent to maintenance team
  And Manager receives escalation notification
  And Dashboard shows overdue PM

Scenario: Severely overdue PM blocks asset
  Given Asset CRANE-01 has monthly PM due Jan 15
  And Today is Feb 4 (20 days overdue)
  And PM schedule has overdueAction = BLOCK and threshold 14 days
  When PM processor runs
  Then Asset status changes to OUT_OF_SERVICE
  And Reason shows "PM overdue - blocked per policy"
  And Dispatch is notified
  And Asset cannot be scheduled until PM complete
```

#### Scenario 3: Return-to-Service Requires Approvals

```gherkin
Feature: Return-to-Service Workflow

Scenario: Standard return-to-service
  Given Work order WO-001 is COMPLETED
  And All checklist items are checked
  And Test run is passed
  When Manager approves return-to-service
  Then Work order status is CLOSED
  And Asset status is IN_SERVICE
  And Audit log records approval

Scenario: Safety-related requires EHS
  Given Work order WO-002 is COMPLETED
  And WO type is SAFETY_RELATED
  When Manager (non-EHS) attempts return-to-service
  Then Request is blocked
  And Message shows "EHS approval required"
  
  When EHS user approves return-to-service
  Then Work order status is CLOSED
  And Asset status is IN_SERVICE
  And Audit log records EHS approval
```

#### Scenario 4: Parts Consumption Updates Inventory

```gherkin
Feature: Parts Inventory Integration

Scenario: Issue parts reduces inventory
  Given Part P-001 has quantity 10 on hand
  And Work order WO-001 requires 2 of P-001
  When Technician issues 2 of P-001 to WO-001
  Then Part P-001 quantity on hand is 8
  And Work order shows 2 parts used
  And Inventory transaction is recorded

Scenario: Low stock triggers reorder alert
  Given Part P-002 has quantity 3 on hand
  And Reorder point is 5
  And Work order WO-002 requires 2 of P-002
  When Technician issues 2 of P-002
  Then Part P-002 quantity on hand is 1
  And Low stock alert is triggered
  And Planner is notified
```

#### Scenario 5: Downtime Metrics Accuracy

```gherkin
Feature: Downtime Tracking

Scenario: Downtime is accurately captured
  Given Asset SAW-01 is IN_SERVICE
  And Current time is 10:00 AM
  When Operator reports breakdown at 10:00 AM
  Then Downtime record starts at 10:00 AM
  
  When Repair is completed and asset returned at 2:30 PM
  Then Downtime record ends at 2:30 PM
  And Duration is 4.5 hours
  And Reason code is recorded
  And Impacted jobs are linked
```

#### Scenario 6: LOTO Integration

```gherkin
Feature: LOTO Safety Integration

Scenario: Cannot start work without LOTO
  Given Work order WO-001 requires LOTO
  And No LOTO permit is linked
  When Technician attempts to start work
  Then System blocks transition to IN_PROGRESS
  And Message shows "LOTO permit required"
  
  When LOTO permit is issued and linked
  Then Technician can start work
  And Work order transitions to IN_PROGRESS
```

#### Scenario 7: Quality-Triggered Maintenance

```gherkin
Feature: Quality-Maintenance Integration

Scenario: SPC violation creates maintenance WO
  Given Asset LATHE-01 has active SPC monitoring
  When SPC detects Rule 4 violation (7 points above center)
  Then System creates draft work order
  And WO type is QUALITY_RELATED
  And WO links to SPC violation
  And Maintenance and Quality are notified

Scenario: Major repair requires first-article
  Given Work order WO-001 involves spindle replacement
  And WO is flagged requiresFirstArticle = true
  When Technician completes work
  Then Return-to-service requires first-article result
  And Quality is notified to perform inspection
  And Asset cannot return to service until inspection passes
```

### L.2 Performance Requirements

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Asset status change | < 500ms | API response time |
| Work order creation | < 1s | Including notifications |
| PM auto-generation | < 5s per batch | Scheduled job |
| Downtime start/stop | < 500ms | Real-time |
| Dashboard load | < 3s | All widgets |
| Asset search | < 1s | With filters |

---

## M) Rollout & Go/No-Go Criteria

### M.1 Rollout Phases

| Phase | Scope | Duration | Success Criteria |
|-------|-------|----------|------------------|
| **Phase 1** | Pilot assets (3) | 2 weeks | Basic WO flow, status changes work |
| **Phase 2** | One branch | 4 weeks | PM compliance tracked, dispatch integrated |
| **Phase 3** | All processing equipment | 4 weeks | Full PM program, safety integration |
| **Phase 4** | All assets | 4 weeks | Parts inventory, analytics complete |

### M.2 Pilot Assets

| Asset | Type | Criticality | Why Pilot |
|-------|------|-------------|-----------|
| SAW-JKS-001 | Saw | A | High-use, good PM history baseline |
| FORKLIFT-JKS-003 | Forklift | B | Daily PM, simple checklist |
| ROUTER-JKS-001 | Router | A | Quality-sensitive, SPC integration test |

### M.3 Data Seeding Requirements

| Data Type | Quantity | Source |
|-----------|----------|--------|
| Assets | All equipment | Existing spreadsheet/system |
| Asset types | 15-20 types | Define during setup |
| PM Templates | 10-15 templates | Existing procedures |
| Spare parts | Critical spares | Existing inventory |
| Reason codes | 20-30 codes | Define during setup |

### M.4 Go/No-Go Criteria

#### Phase 1 → Phase 2

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| Work order completion | 100% can complete flow | — |
| Asset status changes | Working correctly | — |
| Dispatch integration | Status changes visible | — |
| Critical bugs | 0 | — |
| User acceptance | Pilot users approve | — |

#### Phase 2 → Phase 3

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| PM compliance tracking | Accurate | — |
| PM auto-generation | Working | — |
| Downtime capture | Accurate ± 5 min | — |
| Parts issuance | Inventory updates | — |
| Training complete | All maintenance staff | — |

#### Phase 3 → Phase 4

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| Safety integration | LOTO required, enforced | — |
| Quality integration | SPC → WO flow working | — |
| Return-to-service | Approval flow working | — |
| Reporting | Key metrics accurate | — |
| Multi-branch | Ready for rollout | — |

#### Phase 4 Complete (GA)

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| PM compliance rate | ≥ 90% | — |
| Downtime reduction | ≥ 10% vs baseline | — |
| MTTR tracking | Accurate | — |
| Parts availability | ≥ 95% | — |
| User satisfaction | ≥ 4/5 | — |

### M.5 Success Metrics (6-Month Target)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| PM Compliance | Unknown | 95% | System data |
| Unplanned Downtime | 8% of available hours | 5% | Downtime records |
| MTTR | Unknown | Baseline -20% | Work order data |
| MTBF | Unknown | Baseline +15% | Failure data |
| Parts Stockout | 10% | 2% | Parts data |
| Work Order Backlog | Unknown | < 5 days average | WO data |
| First-Time Fix Rate | Unknown | 85% | WO data |

### M.6 Training Requirements

| Role | Training Modules | Duration | Certification |
|------|-----------------|----------|---------------|
| Maintenance Tech | WO execution, parts, mobile app | 4 hours | Practical test |
| Maintenance Planner | PM schedules, templates, parts | 6 hours | System test |
| Maintenance Manager | Full system, approvals, reporting | 8 hours | Scenario-based |
| Operator | Equipment reporting, basic checks | 1 hour | Demonstration |
| EHS | Safety holds, LOTO verification, RTS | 2 hours | Scenario-based |

---

## Appendix A: Reliability Metrics Formulas

| Metric | Formula | Description |
|--------|---------|-------------|
| **MTBF** | Total operating time / Number of failures | Mean Time Between Failures |
| **MTTR** | Total repair time / Number of repairs | Mean Time To Repair |
| **Availability** | MTBF / (MTBF + MTTR) × 100 | % time asset is available |
| **OEE** | Availability × Performance × Quality | Overall Equipment Effectiveness |
| **PM Compliance** | PM completed on time / PM due × 100 | % PMs completed on schedule |
| **Wrench Time** | Actual work time / Total labor time × 100 | % time actively working |

---

## Appendix B: Problem/Failure Codes

| Code | Category | Description |
|------|----------|-------------|
| MECH-BEAR | Mechanical | Bearing failure |
| MECH-GEAR | Mechanical | Gear/transmission failure |
| MECH-SEAL | Mechanical | Seal/gasket failure |
| MECH-BELT | Mechanical | Belt failure |
| ELEC-MOTR | Electrical | Motor failure |
| ELEC-CTRL | Electrical | Control system failure |
| ELEC-SENS | Electrical | Sensor failure |
| ELEC-WIRE | Electrical | Wiring/connection failure |
| HYDR-PUMP | Hydraulic | Pump failure |
| HYDR-VALV | Hydraulic | Valve failure |
| HYDR-CYL | Hydraulic | Cylinder failure |
| HYDR-LEAK | Hydraulic | Leak |
| PNEU-COMP | Pneumatic | Compressor failure |
| PNEU-VALV | Pneumatic | Valve failure |
| TOOL-WEAR | Tooling | Normal wear |
| TOOL-BRKN | Tooling | Broken tool |
| OPER-ERRS | Operator | Operator error |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 4, 2026 | Principal Architect | Initial release |

---

**END OF DOCUMENT**
```

