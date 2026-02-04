# 89 - Production Quality Module

> **Document Version**: 1.0  
> **Date**: February 4, 2026  
> **Author**: Principal Manufacturing Quality Systems Architect  
> **Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document defines the **Production Quality Module**—a comprehensive quality management system that embeds quality control throughout the production process, not just at final inspection. The module integrates Statistical Process Control (SPC), complete traceability, defect containment, and audit-ready evidence generation.

**Core Principle**: Build quality in, don't inspect it out. Quality gates are enforceable barriers. Traceability is immutable and end-to-end. SPC surfaces trends before failures occur.

---

## A) Quality Philosophy & Objectives

### A.1 From Inspect-at-End to Build-Quality-In

```
┌─────────────────────────────────────────────────────────────────────┐
│              TRADITIONAL vs. MODERN QUALITY APPROACH                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TRADITIONAL (Inspect-at-End)                                        │
│  ─────────────────────────────                                       │
│                                                                      │
│  Raw Material → Op1 → Op2 → Op3 → Op4 → [FINAL INSPECTION] → Ship   │
│                                                │                     │
│                                                ▼                     │
│                                          DEFECT FOUND               │
│                                                │                     │
│                                    ┌───────────┴───────────┐        │
│                                    │                       │        │
│                                  Rework                  Scrap      │
│                                    │                       │        │
│                                 $$ Lost                 $$$ Lost    │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  MODERN (Build-Quality-In)                                           │
│  ──────────────────────────                                          │
│                                                                      │
│  Raw Material → [QC] → Op1 → [QC] → Op2 → [QC] → Op3 → [QC] → Ship  │
│       │          │           │           │           │              │
│       │          ▼           ▼           ▼           ▼              │
│       │       VERIFY      VERIFY      VERIFY      VERIFY            │
│       │          │           │           │           │              │
│       ▼       PASS/FAIL   PASS/FAIL   PASS/FAIL   PASS/FAIL        │
│    INCOMING      │           │           │           │              │
│    INSPECTION    │           │           │           │              │
│                  │           │           │           │              │
│                  └─────┬─────┴─────┬─────┴─────┬─────┘              │
│                        │           │           │                    │
│                        ▼           ▼           ▼                    │
│                   Catch Early → Lower Cost → Higher Quality         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### A.2 Cost of Quality Detection

| Detection Point | Cost Multiplier | Example |
|-----------------|-----------------|---------|
| **At Source (SPC)** | 1x | $10 - Adjust machine |
| **In-Process** | 10x | $100 - Rework single piece |
| **Final Inspection** | 100x | $1,000 - Rework batch, delay shipment |
| **At Customer** | 1,000x | $10,000 - Returns, credits, reputation |

**Key Insight**: Every dollar spent on prevention saves $100+ in failure costs.

### A.3 Quality, Safety, and Throughput Triangle

```
                    QUALITY
                       ▲
                      /│\
                     / │ \
                    /  │  \
                   /   │   \
                  /    │    \
                 /     │     \
                /      │      \
               /       │       \
              /        │        \
             ◀─────────┼─────────▶
          SAFETY       │       THROUGHPUT
                       │
                       ▼
                 MUTUAL REINFORCEMENT
```

| Relationship | How They Support Each Other |
|--------------|----------------------------|
| Quality → Safety | Quality processes catch hazardous materials, equipment issues |
| Safety → Quality | Safe conditions enable focused, error-free work |
| Quality → Throughput | Right-first-time eliminates rework, delays |
| Throughput → Quality | Steady flow enables consistent processes |
| Safety → Throughput | No incidents = no downtime |

### A.4 Why Traceability is Non-Negotiable

| Stakeholder | Traceability Requirement |
|-------------|-------------------------|
| **Customers (OEMs)** | Require lot/heat traceability for warranty, recalls |
| **Aerospace/Defense** | AS9100/NADCAP require full process traceability |
| **Automotive** | IATF 16949 mandates traceable inspection records |
| **ISO 9001** | Clause 8.5.2 requires identification and traceability |
| **Liability** | "Who did what, when, to what material?" must be answerable |
| **Recalls** | Ability to identify all affected customers quickly |

### A.5 Quality Module Objectives

| Objective | How Achieved |
|-----------|--------------|
| **Early Detection** | In-process inspection, SPC trending |
| **Prevention** | SPC alerts before out-of-spec |
| **Containment** | Quality holds block defective material |
| **Traceability** | Heat-to-shipment chain, immutable |
| **Continuous Improvement** | Defect Pareto, trend analysis |
| **Audit Readiness** | One-click evidence packages |
| **Customer Confidence** | Accurate Certificates of Conformance |

---

## B) Quality Data Model

### B.1 Entity Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUALITY DATA MODEL OVERVIEW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                    │
│  │ QualityPlan  │◄─── Defines what to inspect for product/customer  │
│  └──────┬───────┘                                                    │
│         │                                                            │
│         │ contains                                                   │
│         ▼                                                            │
│  ┌────────────────────┐                                              │
│  │ QualityCharacteristic│◄─── Dimensions, tolerances, surface, etc. │
│  └──────────┬─────────┘                                              │
│             │                                                        │
│             │ measured at                                            │
│             ▼                                                        │
│  ┌─────────────────┐      ┌──────────────────┐                      │
│  │ InspectionPoint │──────│  JobOperation    │                      │
│  └────────┬────────┘      └──────────────────┘                      │
│           │                                                          │
│           │ produces                                                 │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ InspectionRecord │◄─── One inspection event                       │
│  └────────┬─────────┘                                                │
│           │                                                          │
│           │ contains                                                 │
│           ▼                                                          │
│  ┌─────────────┐                                                     │
│  │ Measurement │◄─── Individual measurement value                    │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         ├──── PASS ────▶ Continue processing                         │
│         │                                                            │
│         └──── FAIL ────▶ ┌──────────────────┐                       │
│                          │  Nonconformance  │                       │
│                          └────────┬─────────┘                       │
│                                   │                                  │
│                                   ▼                                  │
│                          ┌─────────────┐                             │
│                          │ Disposition │                             │
│                          └─────────────┘                             │
│                          (Use-As-Is / Rework / Scrap)                │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  PARALLEL SYSTEMS:                                                   │
│                                                                      │
│  ┌──────────┐     ┌───────────────┐     ┌─────────────┐             │
│  │ SPCChart │     │ QualityHold   │     │ TraceEvent  │             │
│  └────┬─────┘     └───────────────┘     └─────────────┘             │
│       │                                                              │
│       ▼                                                              │
│  ┌──────────────┐                                                    │
│  │ ControlLimit │                                                    │
│  └──────────────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B.2 Prisma Schema

```prisma
// ============================================
// PRODUCTION QUALITY DATA MODEL
// ============================================

// Quality Plan Definition

model QualityPlan {
  id                    String    @id @default(uuid())
  code                  String    @unique
  name                  String
  description           String?
  
  // Scope
  productId             String?
  productFamily         String?
  customerId            String?   // Customer-specific requirements
  materialType          String?   // Applies to material type
  
  // Version Control
  version               Int       @default(1)
  effectiveDate         DateTime  @default(now())
  expiryDate            DateTime?
  status                QualityPlanStatus @default(DRAFT)
  
  // Approval
  approvedBy            String?
  approvedAt            DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  characteristics       QualityCharacteristic[]
  inspectionPoints      InspectionPoint[]
  
  @@index([productId])
  @@index([customerId])
  @@index([status])
}

enum QualityPlanStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  SUPERSEDED
  RETIRED
}

model QualityCharacteristic {
  id                    String    @id @default(uuid())
  planId                String
  plan                  QualityPlan @relation(fields: [planId], references: [id])
  
  code                  String
  name                  String
  description           String?
  
  // Characteristic Type
  type                  CharacteristicType
  category              CharacteristicCategory
  
  // Specification
  nominalValue          Float?
  upperLimit            Float?
  lowerLimit            Float?
  unit                  String?
  
  // For attribute characteristics
  acceptanceCriteria    String?   // e.g., "No visible scratches"
  
  // Inspection Method
  inspectionMethod      String?
  gageId                String?   // Measuring instrument
  sampleSize            Int       @default(1)
  sampleFrequency       String?   // e.g., "Every 10 pieces", "Start of run"
  
  // Criticality
  isCritical            Boolean   @default(false)
  isSPC                 Boolean   @default(false)  // Track on SPC chart
  
  // Drawing Reference
  drawingNumber         String?
  drawingRevision       String?
  characteristicRef     String?   // Balloon/reference on drawing
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  measurements          Measurement[]
  spcChart              SPCChart?
  
  @@unique([planId, code])
  @@index([planId])
}

enum CharacteristicType {
  VARIABLE              // Measurable (dimensions)
  ATTRIBUTE             // Pass/Fail (visual, functional)
}

enum CharacteristicCategory {
  DIMENSION
  TOLERANCE
  SURFACE_FINISH
  HARDNESS
  MATERIAL_PROPERTY
  VISUAL
  FUNCTIONAL
  WEIGHT
  TEMPERATURE
  PRESSURE
  OTHER
}

// Inspection Points

model InspectionPoint {
  id                    String    @id @default(uuid())
  planId                String
  plan                  QualityPlan @relation(fields: [planId], references: [id])
  
  code                  String
  name                  String
  
  // When inspection occurs
  stage                 InspectionStage
  operationSequence     Int?      // After which operation
  
  // Scope
  characteristics       String[]  // List of characteristic codes to inspect
  
  // Requirements
  isRequired            Boolean   @default(true)
  isBatchLevel          Boolean   @default(false)  // One per batch vs per piece
  
  // Gate Behavior
  isGate                Boolean   @default(true)   // Blocks progression if fail
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  inspectionRecords     InspectionRecord[]
  
  @@unique([planId, code])
  @@index([planId])
  @@index([stage])
}

enum InspectionStage {
  INCOMING              // Material receiving
  FIRST_PIECE           // First article
  IN_PROCESS            // During production
  FINAL                 // Before packaging
  OUTGOING              // Before shipment
}

// Inspection Execution

model InspectionRecord {
  id                    String    @id @default(uuid())
  
  // Links
  inspectionPointId     String
  inspectionPoint       InspectionPoint @relation(fields: [inspectionPointId], references: [id])
  jobId                 String?
  operationId           String?
  materialLotId         String?
  packageId             String?
  
  // Inspector
  inspectorId           String
  
  // Timing
  scheduledAt           DateTime?
  startedAt             DateTime?
  completedAt           DateTime?
  
  // Result
  status                InspectionStatus @default(PENDING)
  overallResult         InspectionResult?
  
  // Quantities
  lotSize               Int?
  sampleSize            Int?
  acceptedQty           Int?
  rejectedQty           Int?
  
  // Notes
  notes                 String?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  measurements          Measurement[]
  nonconformances       Nonconformance[]
  
  @@index([jobId])
  @@index([inspectorId])
  @@index([status])
  @@index([completedAt])
}

enum InspectionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum InspectionResult {
  PASS
  FAIL
  CONDITIONAL   // Pass with deviation
}

model Measurement {
  id                    String    @id @default(uuid())
  inspectionRecordId    String
  inspectionRecord      InspectionRecord @relation(fields: [inspectionRecordId], references: [id])
  characteristicId      String
  characteristic        QualityCharacteristic @relation(fields: [characteristicId], references: [id])
  
  // Measurement Data
  value                 Float?    // For variable characteristics
  attributeResult       Boolean?  // For attribute characteristics (true=pass)
  
  // Result
  result                MeasurementResult
  deviation             Float?    // How far from nominal
  
  // Metadata
  gageId                String?
  gageReading           String?   // Raw gage display
  sampleNumber          Int       @default(1)
  pieceId               String?   // Individual piece if tracked
  
  // Traceability
  measuredAt            DateTime  @default(now())
  measuredBy            String
  
  // SPC Link
  includedInSPC         Boolean   @default(false)
  spcDataPointId        String?
  
  createdAt             DateTime  @default(now())
  
  @@index([inspectionRecordId])
  @@index([characteristicId])
  @@index([measuredAt])
}

enum MeasurementResult {
  PASS
  FAIL
  MARGINAL    // Within spec but near limit
}

// Nonconformance Management

model Nonconformance {
  id                    String    @id @default(uuid())
  ncrNumber             String    @unique  // NCR-2026-0001
  
  // Source
  inspectionRecordId    String?
  inspectionRecord      InspectionRecord? @relation(fields: [inspectionRecordId], references: [id])
  jobId                 String?
  operationId           String?
  materialLotId         String?
  workCenterId          String?
  
  // Classification
  defectTypeId          String
  defectType            DefectType @relation(fields: [defectTypeId], references: [id])
  severity              NCRSeverity
  
  // Description
  description           String
  quantityAffected      Int       @default(1)
  
  // Status
  status                NCRStatus @default(OPEN)
  
  // Investigation
  rootCause             String?
  containmentAction     String?
  
  // Disposition
  disposition           Disposition?
  dispositionBy         String?
  dispositionAt         DateTime?
  dispositionNotes      String?
  
  // Verification
  verifiedBy            String?
  verifiedAt            DateTime?
  
  // Cost
  estimatedCost         Float?
  actualCost            Float?
  
  // Links
  linkedNCRs            String[]  // Related NCRs
  reworkJobId           String?   // Generated rework job
  
  createdBy             String
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  closedAt              DateTime?
  closedBy              String?
  
  @@index([status])
  @@index([defectTypeId])
  @@index([jobId])
  @@index([createdAt])
}

enum NCRSeverity {
  MINOR       // Cosmetic, does not affect function
  MAJOR       // Affects function, may be usable
  CRITICAL    // Safety or total loss of function
}

enum NCRStatus {
  OPEN
  INVESTIGATING
  DISPOSITION_SET
  ACTION_TAKEN
  PENDING_VERIFICATION
  VERIFIED
  CLOSED
  CANCELLED
}

enum Disposition {
  USE_AS_IS           // Accept with deviation
  REWORK              // Fix and reinspect
  REPAIR              // Fix with documented process
  RETURN_TO_SUPPLIER  // Material defect
  SCRAP               // Cannot be used
  SORT                // 100% inspection to segregate
}

model DefectType {
  id                    String    @id @default(uuid())
  code                  String    @unique
  name                  String
  description           String?
  category              String    // DIMENSIONAL, SURFACE, MATERIAL, PROCESS
  
  // Default severity
  defaultSeverity       NCRSeverity @default(MINOR)
  
  // Requires special handling
  requiresContainment   Boolean   @default(false)
  requiresCustomerNotification Boolean @default(false)
  
  createdAt             DateTime  @default(now())
  
  nonconformances       Nonconformance[]
  
  @@index([category])
}

// Quality Holds

model QualityHold {
  id                    String    @id @default(uuid())
  holdNumber            String    @unique  // HOLD-2026-0001
  
  // Scope
  holdType              HoldType
  jobId                 String?
  materialLotId         String?
  workCenterId          String?
  locationId            String?
  
  // Reason
  reason                String
  ncrId                 String?   // Linked NCR
  
  // Status
  status                HoldStatus @default(ACTIVE)
  
  // Quantity
  quantityHeld          Float?
  unit                  String?
  
  // Actions
  containmentAction     String?
  
  // Resolution
  resolution            String?
  resolvedBy            String?
  resolvedAt            DateTime?
  
  // Approval for release
  approvalRequired      Boolean   @default(true)
  approvedBy            String?
  approvedAt            DateTime?
  
  createdBy             String
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([status])
  @@index([jobId])
  @@index([materialLotId])
}

enum HoldType {
  JOB_HOLD
  MATERIAL_HOLD
  WORK_CENTER_HOLD
  LOCATION_HOLD
  SUPPLIER_HOLD
}

enum HoldStatus {
  ACTIVE
  INVESTIGATING
  PENDING_APPROVAL
  CLEARED
  ESCALATED
}

// SPC (Statistical Process Control)

model SPCChart {
  id                    String    @id @default(uuid())
  characteristicId      String    @unique
  characteristic        QualityCharacteristic @relation(fields: [characteristicId], references: [id])
  
  // Chart Type
  chartType             SPCChartType
  
  // Control Limits (calculated or manual)
  ucl                   Float?    // Upper Control Limit
  lcl                   Float?    // Lower Control Limit
  centerLine            Float?    // Mean / Target
  
  // For R-chart or MR-chart
  uclRange              Float?
  lclRange              Float?
  centerLineRange       Float?
  
  // Calculation basis
  subgroupSize          Int       @default(5)
  calculationPeriod     String?   // e.g., "Last 25 subgroups"
  limitsLockedAt        DateTime? // When limits were frozen
  limitsLockedBy        String?
  
  // Status
  status                SPCChartStatus @default(ACTIVE)
  lastDataPointAt       DateTime?
  lastViolationAt       DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  dataPoints            SPCDataPoint[]
  violations            SPCViolation[]
  
  @@index([status])
}

enum SPCChartType {
  X_BAR_R           // Average and Range
  X_BAR_S           // Average and Std Dev
  I_MR              // Individual and Moving Range
  P_CHART           // Proportion defective
  NP_CHART          // Number defective
  C_CHART           // Count of defects
  U_CHART           // Defects per unit
}

enum SPCChartStatus {
  ACTIVE
  PAUSED
  RECALCULATING
  RETIRED
}

model SPCDataPoint {
  id                    String    @id @default(uuid())
  chartId               String
  chart                 SPCChart @relation(fields: [chartId], references: [id])
  
  // Subgroup data
  subgroupNumber        Int
  subgroupTime          DateTime
  
  // Values
  mean                  Float?    // X-bar
  range                 Float?    // R
  stdDev                Float?    // S
  individualValue       Float?    // For I-MR
  movingRange           Float?    // For I-MR
  
  // For attribute charts
  sampleSize            Int?
  defectCount           Int?
  defectiveCount        Int?
  
  // Raw measurements
  rawValues             Float[]   // Individual readings in subgroup
  
  // Violation check
  hasViolation          Boolean   @default(false)
  
  createdAt             DateTime  @default(now())
  
  @@index([chartId, subgroupNumber])
  @@index([chartId, subgroupTime])
}

model SPCViolation {
  id                    String    @id @default(uuid())
  chartId               String
  chart                 SPCChart @relation(fields: [chartId], references: [id])
  dataPointId           String?
  
  // Violation Type
  ruleViolated          SPCRule
  description           String
  
  // Impact
  severity              ViolationSeverity
  
  // Response
  acknowledged          Boolean   @default(false)
  acknowledgedBy        String?
  acknowledgedAt        DateTime?
  
  actionTaken           String?
  actionTakenBy         String?
  actionTakenAt         DateTime?
  
  // Escalation
  escalatedToHold       Boolean   @default(false)
  holdId                String?
  escalatedToSWA        Boolean   @default(false)
  swaId                 String?
  
  createdAt             DateTime  @default(now())
  
  @@index([chartId])
  @@index([severity])
  @@index([acknowledged])
}

enum SPCRule {
  RULE_1_BEYOND_3SIGMA        // Point beyond UCL/LCL
  RULE_2_ZONE_A               // 2 of 3 points in Zone A
  RULE_3_ZONE_B               // 4 of 5 points in Zone B
  RULE_4_ZONE_C               // 7+ points same side of center
  RULE_5_TREND                // 7+ points trending up or down
  RULE_6_ALTERNATING          // 14+ points alternating up/down
  RULE_7_STRATIFICATION       // 15+ points within 1 sigma
  RULE_8_MIXTURE              // 8+ points beyond 1 sigma both sides
  CUSTOM                      // Custom rule
}

enum ViolationSeverity {
  WARNING     // Trending, needs attention
  ALERT       // Out of control, investigate
  CRITICAL    // Multiple rules, immediate action
}

// Traceability

model TraceEvent {
  id                    String    @id @default(uuid())
  
  // Subject
  entityType            TraceEntityType
  entityId              String
  
  // Event
  eventType             String
  eventDescription      String
  eventData             Json?
  
  // Links
  materialLotId         String?
  heatNumber            String?
  jobId                 String?
  operationId           String?
  workCenterId          String?
  operatorId            String?
  inspectionRecordId    String?
  ncrId                 String?
  packageId             String?
  shipmentId            String?
  
  // Timestamp
  occurredAt            DateTime  @default(now())
  
  // Immutability
  previousHash          String?
  hash                  String
  
  createdAt             DateTime  @default(now())
  
  @@index([entityType, entityId])
  @@index([materialLotId])
  @@index([jobId])
  @@index([shipmentId])
  @@index([occurredAt])
}

enum TraceEntityType {
  MATERIAL
  JOB
  OPERATION
  PACKAGE
  SHIPMENT
  INSPECTION
  NCR
}

// Certificate of Conformance

model CertificateOfConformance {
  id                    String    @id @default(uuid())
  cocNumber             String    @unique  // COC-2026-0001
  
  // Links
  shipmentId            String?
  orderId               String?
  customerId            String
  
  // Content
  items                 Json      // Array of items with specs
  
  // Certifications
  materialCerts         String[]  // Mill test report references
  inspectionSummary     Json?     // Summary of inspections
  
  // Approval
  preparedBy            String
  preparedAt            DateTime  @default(now())
  approvedBy            String?
  approvedAt            DateTime?
  
  // Status
  status                CoCStatus @default(DRAFT)
  
  // Delivery
  sentAt                DateTime?
  sentTo                String?
  sentMethod            String?   // EMAIL, PORTAL, MAIL
  
  // PDF
  pdfUrl                String?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([shipmentId])
  @@index([customerId])
  @@index([status])
}

enum CoCStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  ARCHIVED
}

// Quality Approvals

model QualityApproval {
  id                    String    @id @default(uuid())
  
  // What is being approved
  approvalType          QualityApprovalType
  referenceId           String    // ID of NCR, Hold, Plan, etc.
  
  // Request
  requestedBy           String
  requestedAt           DateTime  @default(now())
  requestReason         String?
  
  // Decision
  decision              ApprovalDecision?
  decidedBy             String?
  decidedAt             DateTime?
  decisionNotes         String?
  
  // Escalation
  escalatedTo           String?
  escalatedAt           DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([approvalType, referenceId])
  @@index([decision])
}

enum QualityApprovalType {
  NCR_DISPOSITION
  USE_AS_IS
  HOLD_RELEASE
  PLAN_APPROVAL
  OVERRIDE
  COC_APPROVAL
}

enum ApprovalDecision {
  APPROVED
  REJECTED
  APPROVED_WITH_CONDITIONS
  ESCALATED
}
```

---

## C) QC Workflows (State Machines)

### C.1 In-Process Inspection Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│              IN-PROCESS INSPECTION STATE MACHINE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Operation Reaches Inspection Point                                  │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │   PENDING   │◄─── Inspection scheduled/required                   │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         │ Inspector begins                                           │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │ IN_PROGRESS │◄─── Taking measurements                             │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         │ All measurements complete                                  │
│         ▼                                                            │
│  ┌─────────────┐                                                     │
│  │  MEASURED   │◄─── Evaluating results                              │
│  └──────┬──────┘                                                     │
│         │                                                            │
│    ┌────┴────┐                                                       │
│    │         │                                                       │
│    ▼         ▼                                                       │
│ ┌──────┐  ┌──────┐                                                  │
│ │ PASS │  │ FAIL │                                                  │
│ └──┬───┘  └──┬───┘                                                  │
│    │         │                                                       │
│    │         │ Auto-create NCR                                       │
│    │         ▼                                                       │
│    │    ┌─────────────┐                                              │
│    │    │ NCR_CREATED │                                              │
│    │    └──────┬──────┘                                              │
│    │           │                                                     │
│    │           │ Disposition decision                                │
│    │           ▼                                                     │
│    │    ┌─────────────────┐                                          │
│    │    │ DISPOSITION_SET │                                          │
│    │    └────────┬────────┘                                          │
│    │             │                                                   │
│    │    ┌────────┴────────┐                                          │
│    │    │        │        │                                          │
│    │    ▼        ▼        ▼                                          │
│    │ ┌──────┐ ┌───────┐ ┌───────┐                                   │
│    │ │REWORK│ │ SCRAP │ │USE_AS │                                   │
│    │ │      │ │       │ │ _IS   │                                   │
│    │ └──┬───┘ └───┬───┘ └───┬───┘                                   │
│    │    │         │         │                                        │
│    │    │         │         │ Approval required                      │
│    │    │         │         ▼                                        │
│    │    │         │    ┌──────────┐                                  │
│    │    │         │    │ APPROVED │                                  │
│    │    │         │    └────┬─────┘                                  │
│    │    │         │         │                                        │
│    │    ▼         ▼         ▼                                        │
│    │ Create    Update    Continue                                    │
│    │ Rework    Inventory   with                                      │
│    │  Job      (Scrap)   marking                                     │
│    │    │         │         │                                        │
│    └────┴─────────┴─────────┘                                        │
│              │                                                       │
│              ▼                                                       │
│         ┌──────────┐                                                 │
│         │ VERIFIED │◄─── QC verifies action taken                    │
│         └──────────┘                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.2 Final Inspection Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                 FINAL INSPECTION STATE MACHINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Job Operations Complete                                             │
│         │                                                            │
│         ▼                                                            │
│  ┌───────────┐                                                       │
│  │   READY   │◄─── Awaiting final inspection                         │
│  └─────┬─────┘                                                       │
│        │                                                             │
│        │ Inspector begins                                            │
│        ▼                                                             │
│  ┌────────────┐                                                      │
│  │ INSPECTING │◄─── All characteristics being verified               │
│  └──────┬─────┘                                                      │
│         │                                                            │
│    ┌────┴────┐                                                       │
│    │         │                                                       │
│    ▼         ▼                                                       │
│ ┌──────┐  ┌──────┐                                                  │
│ │ PASS │  │ FAIL │                                                  │
│ └──┬───┘  └──┬───┘                                                  │
│    │         │                                                       │
│    │         │ Place quality hold                                    │
│    │         ▼                                                       │
│    │    ┌──────┐                                                     │
│    │    │ HOLD │                                                     │
│    │    └──┬───┘                                                     │
│    │       │                                                         │
│    │  ┌────┴────┐                                                    │
│    │  │         │                                                    │
│    │  ▼         ▼                                                    │
│    │ ┌──────┐ ┌───────┐                                             │
│    │ │REWORK│ │ SCRAP │                                             │
│    │ └──┬───┘ └───────┘                                             │
│    │    │                                                            │
│    │    │ Rework complete                                            │
│    │    │ Re-inspect                                                 │
│    │    │                                                            │
│    │◀───┘                                                            │
│    │                                                                 │
│    ▼                                                                 │
│ ┌─────────┐                                                          │
│ │ RELEASE │◄─── Cleared for packaging                                │
│ └─────────┘                                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.3 Nonconformance (NCR) Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NCR STATE MACHINE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Defect Detected (Inspection, Operator, Customer)                    │
│         │                                                            │
│         ▼                                                            │
│  ┌───────────┐                                                       │
│  │   OPEN    │◄─── NCR created, awaiting investigation               │
│  └─────┬─────┘                                                       │
│        │                                                             │
│        │ Assigned to investigator                                    │
│        ▼                                                             │
│  ┌───────────────┐                                                   │
│  │ INVESTIGATING │◄─── Root cause analysis underway                  │
│  └───────┬───────┘                                                   │
│          │                                                           │
│          │ Root cause identified, containment done                   │
│          ▼                                                           │
│  ┌─────────────────┐                                                 │
│  │ DISPOSITION_SET │◄─── Decision made (Rework/Scrap/Use-As-Is)     │
│  └────────┬────────┘                                                 │
│           │                                                          │
│           │ Disposition executed                                     │
│           ▼                                                          │
│  ┌──────────────┐                                                    │
│  │ ACTION_TAKEN │◄─── Rework done, scrap recorded, etc.             │
│  └───────┬──────┘                                                    │
│          │                                                           │
│          │ QC verifies action                                        │
│          ▼                                                           │
│  ┌──────────┐                                                        │
│  │ VERIFIED │◄─── Action confirmed effective                         │
│  └────┬─────┘                                                        │
│       │                                                              │
│       │ All actions complete, corrective action (if needed)         │
│       ▼                                                              │
│  ┌──────────┐                                                        │
│  │  CLOSED  │◄─── NCR complete                                       │
│  └──────────┘                                                        │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│  TIMEOUT RULES:                                                      │
│  - OPEN > 24h → Auto-escalate to Quality Manager                    │
│  - INVESTIGATING > 72h → Alert to Quality Director                  │
│  - ACTION_TAKEN > 48h → Escalate verification                       │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.4 Quality Hold Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUALITY HOLD STATE MACHINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Issue Detected (NCR, SPC Violation, Customer Complaint)             │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────┐                                                        │
│  │  ACTIVE  │◄─── Material/Job/Work Center blocked                   │
│  └────┬─────┘                                                        │
│       │                                                              │
│       │ Begin investigation                                          │
│       ▼                                                              │
│  ┌───────────────┐                                                   │
│  │ INVESTIGATING │◄─── Determining scope and cause                   │
│  └───────┬───────┘                                                   │
│          │                                                           │
│     ┌────┴────┐                                                      │
│     │         │                                                      │
│     ▼         ▼                                                      │
│ ┌─────────┐ ┌───────────┐                                           │
│ │ CLEARED │ │ ESCALATED │                                           │
│ └────┬────┘ └─────┬─────┘                                           │
│      │            │                                                  │
│      │            │ More severe than expected                        │
│      │            │ Stop-Work Authority triggered                    │
│      │            ▼                                                  │
│      │      ┌───────────────┐                                        │
│      │      │ SWA_TRIGGERED │                                        │
│      │      └───────────────┘                                        │
│      │                                                               │
│      ▼                                                               │
│ Release material/job                                                 │
│ Update dispatch                                                      │
│ Notify stakeholders                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### C.5 Gate Enforcement Rules

| Gate Type | Trigger | Block Behavior | Override |
|-----------|---------|----------------|----------|
| **First Piece** | First piece of run | Cannot continue run | Quality Engineer approval |
| **In-Process** | After operation | Cannot start next operation | Quality Manager approval |
| **Final** | Before packaging | Cannot package/ship | Quality Manager approval |
| **SPC** | Rule violation | Warning → Hold → SWA | Based on severity |

---

## D) SPC Design (Statistical Process Control)

### D.1 SPC Chart Types

| Chart Type | Use Case | Data Required |
|------------|----------|---------------|
| **X-bar/R** | Subgroups of 2-10 | Subgroup measurements |
| **X-bar/S** | Subgroups >10 | Subgroup measurements |
| **I-MR** | Single measurements | Individual values |
| **p-chart** | Proportion defective | Sample size, defective count |
| **np-chart** | Number defective (fixed n) | Defective count |
| **c-chart** | Defects per unit (fixed size) | Defect count |
| **u-chart** | Defects per unit (variable size) | Defect count, unit size |

### D.2 Control Limit Calculations

```javascript
// X-bar/R Chart Limits
function calculateXbarRLimits(subgroups, subgroupSize) {
  const A2 = getA2Factor(subgroupSize);
  const D3 = getD3Factor(subgroupSize);
  const D4 = getD4Factor(subgroupSize);
  
  const xBarBar = mean(subgroups.map(s => mean(s)));
  const rBar = mean(subgroups.map(s => range(s)));
  
  return {
    xBar: {
      ucl: xBarBar + A2 * rBar,
      centerLine: xBarBar,
      lcl: xBarBar - A2 * rBar
    },
    range: {
      ucl: D4 * rBar,
      centerLine: rBar,
      lcl: D3 * rBar  // Often 0 for n<7
    }
  };
}

// I-MR Chart Limits
function calculateIMRLimits(values) {
  const xBar = mean(values);
  const movingRanges = [];
  for (let i = 1; i < values.length; i++) {
    movingRanges.push(Math.abs(values[i] - values[i-1]));
  }
  const mrBar = mean(movingRanges);
  
  return {
    individual: {
      ucl: xBar + 2.66 * mrBar,
      centerLine: xBar,
      lcl: xBar - 2.66 * mrBar
    },
    movingRange: {
      ucl: 3.267 * mrBar,
      centerLine: mrBar,
      lcl: 0
    }
  };
}
```

### D.3 SPC Rules (Western Electric Rules + Nelson Rules)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPC VIOLATION RULES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RULE 1: BEYOND 3-SIGMA (UCL/LCL)                                   │
│  ─────────────────────────────────                                   │
│  Single point beyond control limit                                   │
│  Action: ALERT - Immediate investigation                             │
│                                                                      │
│  UCL ─────────────────────X─────────────────── (Violation!)         │
│                                                                      │
│  RULE 2: ZONE A (2 of 3 points in Zone A)                           │
│  ─────────────────────────────────────────                           │
│  2 of 3 consecutive points in Zone A (2-3 sigma) same side          │
│  Action: WARNING - Watch closely                                     │
│                                                                      │
│  RULE 3: ZONE B (4 of 5 points in Zone B)                           │
│  ─────────────────────────────────────────                           │
│  4 of 5 consecutive points in Zone B (1-2 sigma) same side          │
│  Action: WARNING - Investigate                                       │
│                                                                      │
│  RULE 4: RUN (7+ points same side of center)                        │
│  ────────────────────────────────────────────                        │
│  7 or more consecutive points on same side of center line           │
│  Action: ALERT - Process shift detected                              │
│                                                                      │
│          ● ● ● ● ● ● ●                                              │
│  CL ────────────────────────────────────────                         │
│                                                                      │
│  RULE 5: TREND (7+ points trending)                                 │
│  ──────────────────────────────────                                  │
│  7 or more consecutive points increasing or decreasing              │
│  Action: ALERT - Process drift detected                              │
│                                                                      │
│              ●                                                       │
│            ●                                                         │
│          ●                                                           │
│        ●                                                             │
│      ●                                                               │
│    ●                                                                 │
│  ●                                                                   │
│                                                                      │
│  RULE 6: ALTERNATING (14+ points alternating)                       │
│  ────────────────────────────────────────────                        │
│  14+ points alternating up and down                                  │
│  Action: WARNING - Systemic variation                                │
│                                                                      │
│  RULE 7: STRATIFICATION (15+ points within 1 sigma)                 │
│  ──────────────────────────────────────────────────                  │
│  15+ points within 1 sigma of center                                │
│  Action: INFO - Check data or limits                                 │
│                                                                      │
│  RULE 8: MIXTURE (8+ points beyond 1 sigma both sides)              │
│  ─────────────────────────────────────────────────────               │
│  8+ points beyond 1 sigma on both sides, none within 1 sigma        │
│  Action: WARNING - Two populations mixed                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### D.4 SPC Actions by Severity

| Severity | Rules Triggered | System Action |
|----------|----------------|---------------|
| **INFO** | Rule 7 | Log for analysis |
| **WARNING** | Rules 2, 3, 6, 8 | Alert operator, notify supervisor |
| **ALERT** | Rules 1, 4, 5 | Alert all, recommend machine check |
| **CRITICAL** | Multiple rules, or repeated Rule 1 | Place Quality Hold, escalate |
| **STOP-WORK** | 3+ consecutive Rule 1, critical dimension | Trigger Stop-Work Authority |

### D.5 SPC Workflow Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SPC EVENT PROCESSING                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Measurement Recorded                                                │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────────┐                                                 │
│  │ Add to SPC Chart │                                                │
│  └────────┬────────┘                                                 │
│           │                                                          │
│           ▼                                                          │
│  ┌────────────────────┐                                              │
│  │ Evaluate All Rules │                                              │
│  └─────────┬──────────┘                                              │
│            │                                                         │
│       ┌────┴────┐                                                    │
│       │         │                                                    │
│    No Rules  Rules                                                   │
│    Violated  Violated                                                │
│       │         │                                                    │
│       ▼         ▼                                                    │
│    Continue  Determine                                               │
│    Normally  Severity                                                │
│                 │                                                    │
│        ┌────────┼────────┬────────┬────────┐                        │
│        │        │        │        │        │                        │
│        ▼        ▼        ▼        ▼        ▼                        │
│      INFO    WARNING   ALERT  CRITICAL  STOP-WORK                   │
│        │        │        │        │        │                        │
│        │        │        │        │        ▼                        │
│        │        │        │        │    ┌─────────────┐              │
│        │        │        │        │    │ Trigger SWA │              │
│        │        │        │        │    └─────────────┘              │
│        │        │        │        ▼                                 │
│        │        │        │    ┌──────────────┐                      │
│        │        │        │    │ Place Hold   │                      │
│        │        │        │    │ Block Job    │                      │
│        │        │        │    └──────────────┘                      │
│        │        │        ▼                                          │
│        │        │    ┌────────────────────┐                         │
│        │        │    │ Alert All Parties  │                         │
│        │        │    │ Recommend Action   │                         │
│        │        │    └────────────────────┘                         │
│        │        ▼                                                   │
│        │    ┌───────────────────┐                                   │
│        │    │ Notify Supervisor │                                   │
│        │    │ Alert Operator    │                                   │
│        │    └───────────────────┘                                   │
│        ▼                                                            │
│    Log for                                                          │
│    Analysis                                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### D.6 Sampling Plans

| Characteristic Type | Default Sampling | First Article |
|---------------------|------------------|---------------|
| Critical Dimension | 100% | Required |
| Major Dimension | Every 5th piece | Required |
| Minor Dimension | Start/End of run | Optional |
| Surface Finish | 10% random | Required |
| Visual Attribute | 100% | Required |

---

## E) Traceability Model

### E.1 End-to-End Traceability Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRACEABILITY CHAIN                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                        MATERIAL ORIGIN                         ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║  Supplier → Mill Test Report → Heat/Lot → Receipt → Location  ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                               │                                      │
│                               ▼                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                        PROCESSING                              ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║  Job → Operation 1    → Operation 2    → Operation N          ║  │
│  ║        │                │                │                     ║  │
│  ║        ├─Work Center    ├─Work Center    ├─Work Center         ║  │
│  ║        ├─Operator       ├─Operator       ├─Operator            ║  │
│  ║        ├─Start/End Time ├─Start/End Time ├─Start/End Time      ║  │
│  ║        └─Machine Params └─Machine Params └─Machine Params      ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                               │                                      │
│                               ▼                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                        QUALITY                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║  Incoming Insp → In-Process Insp → Final Insp → SPC Status    ║  │
│  ║        │               │                │           │          ║  │
│  ║  Measurements    Measurements     Measurements   Charts        ║  │
│  ║        │               │                │           │          ║  │
│  ║     Results         Results          Results    Violations     ║  │
│  ║        │               │                │           │          ║  │
│  ║      NCRs            NCRs             NCRs       Holds         ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                               │                                      │
│                               ▼                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                     PACKAGING & SHIPPING                       ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║  Package ID → Weight → Labels → Shipment → BOL → Customer     ║  │
│  ║      │          │        │         │        │        │         ║  │
│  ║  Contents    Verified  Traced   Carrier   Signed  Delivered    ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                               │                                      │
│                               ▼                                      │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                     DOCUMENTATION                              ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║  Mill Test Reports → CoC → Packing List → Invoice → POD       ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### E.2 Trace Event Types

| Event Type | Description | Data Captured |
|------------|-------------|---------------|
| `MATERIAL_RECEIVED` | Material received from supplier | Supplier, PO, Heat/Lot, MTR ref |
| `MATERIAL_ALLOCATED` | Material allocated to job | Job ID, quantity |
| `MATERIAL_CONSUMED` | Material used in production | Job ID, operation, quantity |
| `OPERATION_STARTED` | Operation began | Operator, work center, time |
| `OPERATION_COMPLETED` | Operation finished | Operator, duration, qty produced |
| `INSPECTION_PERFORMED` | Inspection executed | Inspector, results, measurements |
| `NCR_CREATED` | Nonconformance recorded | Defect type, quantity affected |
| `NCR_DISPOSITIONED` | NCR decision made | Disposition, approver |
| `QUALITY_HOLD_APPLIED` | Material/job held | Reason, scope |
| `QUALITY_HOLD_CLEARED` | Hold released | Resolution, approver |
| `PACKAGED` | Item packaged | Package ID, contents |
| `SHIPPED` | Package shipped | Shipment ID, carrier, destination |
| `DELIVERED` | Shipment delivered | POD, recipient |

### E.3 Backward Traceability (Shipment → Material)

```javascript
async function traceBackward(shipmentId) {
  const result = {
    shipment: null,
    packages: [],
    jobs: [],
    operations: [],
    inspections: [],
    ncrs: [],
    materials: [],
    suppliers: []
  };
  
  // Get shipment
  result.shipment = await Shipment.findById(shipmentId);
  
  // Get packages
  result.packages = await Package.findMany({
    where: { shipmentId }
  });
  
  // Get jobs from packages
  const jobIds = result.packages.flatMap(p => p.jobIds);
  result.jobs = await Job.findMany({
    where: { id: { in: jobIds } }
  });
  
  // Get operations
  result.operations = await Operation.findMany({
    where: { jobId: { in: jobIds } }
  });
  
  // Get inspections
  result.inspections = await InspectionRecord.findMany({
    where: { jobId: { in: jobIds } }
  });
  
  // Get NCRs
  result.ncrs = await Nonconformance.findMany({
    where: { jobId: { in: jobIds } }
  });
  
  // Get materials
  const materialLotIds = result.jobs.map(j => j.materialLotId);
  result.materials = await MaterialLot.findMany({
    where: { id: { in: materialLotIds } }
  });
  
  // Get suppliers
  const supplierIds = result.materials.map(m => m.supplierId);
  result.suppliers = await Supplier.findMany({
    where: { id: { in: supplierIds } }
  });
  
  return result;
}
```

### E.4 Forward Traceability (Material → Customers)

```javascript
async function traceForward(materialLotId) {
  const result = {
    material: null,
    jobs: [],
    shipments: [],
    customers: []
  };
  
  // Get material
  result.material = await MaterialLot.findById(materialLotId);
  
  // Get all jobs using this material
  result.jobs = await Job.findMany({
    where: { materialLotId }
  });
  
  // Get shipments containing these jobs
  const packages = await Package.findMany({
    where: { jobIds: { hasSome: result.jobs.map(j => j.id) } }
  });
  
  result.shipments = await Shipment.findMany({
    where: { id: { in: packages.map(p => p.shipmentId) } }
  });
  
  // Get unique customers
  const customerIds = [...new Set(result.shipments.map(s => s.customerId))];
  result.customers = await Customer.findMany({
    where: { id: { in: customerIds } }
  });
  
  return result;
}
```

### E.5 Trace Report Export

```yaml
trace_report_format:
  header:
    - report_type: "Traceability Report"
    - generated_at: timestamp
    - generated_by: user
    - scope: "Material Lot ML-2026-0001"
    
  material_section:
    - lot_number
    - heat_number
    - supplier
    - po_number
    - received_date
    - mtr_reference
    - specifications
    
  processing_section:
    - jobs:
        - job_number
        - customer
        - product
        - operations:
            - sequence
            - work_center
            - operator
            - start_time
            - end_time
            - machine_parameters
            
  quality_section:
    - inspections:
        - inspection_id
        - stage
        - inspector
        - date
        - result
        - measurements
    - ncrs:
        - ncr_number
        - defect_type
        - disposition
        - status
    - spc_status:
        - characteristic
        - chart_status
        - violations
        
  shipping_section:
    - packages:
        - package_id
        - contents
    - shipments:
        - shipment_id
        - carrier
        - ship_date
        - delivery_date
    - customers:
        - customer_name
        - quantity_shipped
        
  certifications:
    - coc_numbers
    - mtr_references
    
  integrity:
    - hash_chain_status: "VERIFIED"
    - first_event_hash
    - last_event_hash
```

---

## F) Integration with Dispatch & Safety

### F.1 Quality-Dispatch Integration Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│              QUALITY-DISPATCH INTEGRATION RULES                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RULE 1: QUALITY HOLD BLOCKS DISPATCH                               │
│  ─────────────────────────────────────                               │
│  If QualityHold.status = 'ACTIVE' for:                              │
│    - Job → Job cannot be dispatched                                  │
│    - Material → Jobs using material cannot start                     │
│    - Work Center → No work dispatched to center                      │
│                                                                      │
│  RULE 2: INSPECTION GATE BLOCKS NEXT OPERATION                      │
│  ──────────────────────────────────────────────                      │
│  If InspectionPoint.isGate = true AND InspectionRecord.result ≠ PASS │
│    → Next operation cannot start                                     │
│    → Job moves to "HELD_QUALITY" status                              │
│                                                                      │
│  RULE 3: NCR GENERATES REWORK JOB                                   │
│  ────────────────────────────────                                    │
│  If Nonconformance.disposition = 'REWORK':                          │
│    → Auto-create rework Job                                          │
│    → Link to original Job                                            │
│    → Copy routing with rework operations                             │
│    → Flag for re-inspection                                          │
│                                                                      │
│  RULE 4: SCRAP UPDATES INVENTORY                                    │
│  ────────────────────────────────                                    │
│  If Nonconformance.disposition = 'SCRAP':                           │
│    → Reduce inventory quantity                                       │
│    → Update job yield                                                │
│    → Record scrap cost                                               │
│    → Update WIP valuation                                            │
│                                                                      │
│  RULE 5: FINAL INSPECTION REQUIRED BEFORE PACKAGING                 │
│  ───────────────────────────────────────────────────                 │
│  Job cannot move to packaging station unless:                        │
│    → Final inspection complete                                       │
│    → Result = PASS or CONDITIONAL                                    │
│    → No open quality holds                                           │
│                                                                      │
│  RULE 6: SPC VIOLATION ESCALATION                                   │
│  ────────────────────────────────                                    │
│  SPC Severity = CRITICAL → Place Quality Hold                        │
│  3+ consecutive Rule 1 violations → Trigger Stop-Work Authority      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### F.2 Dispatch Validation Hook

```javascript
async function validateQualityForDispatch(jobId, workCenterId) {
  const blocks = [];
  
  // 1. Check job-level holds
  const jobHolds = await QualityHold.findMany({
    where: { jobId, status: 'ACTIVE' }
  });
  if (jobHolds.length > 0) {
    blocks.push({
      type: 'JOB_HOLD',
      message: `Job has ${jobHolds.length} active quality hold(s)`,
      holds: jobHolds.map(h => h.holdNumber)
    });
  }
  
  // 2. Check material holds
  const job = await Job.findById(jobId);
  const materialHolds = await QualityHold.findMany({
    where: { materialLotId: job.materialLotId, status: 'ACTIVE' }
  });
  if (materialHolds.length > 0) {
    blocks.push({
      type: 'MATERIAL_HOLD',
      message: `Source material has quality hold`,
      holds: materialHolds.map(h => h.holdNumber)
    });
  }
  
  // 3. Check work center holds
  const wcHolds = await QualityHold.findMany({
    where: { workCenterId, status: 'ACTIVE' }
  });
  if (wcHolds.length > 0) {
    blocks.push({
      type: 'WORK_CENTER_HOLD',
      message: `Work center has quality hold`,
      holds: wcHolds.map(h => h.holdNumber)
    });
  }
  
  // 4. Check pending inspections (gates)
  const pendingGates = await getPendingQualityGates(jobId);
  if (pendingGates.length > 0) {
    blocks.push({
      type: 'PENDING_INSPECTION',
      message: `Required inspection(s) not completed`,
      inspections: pendingGates.map(g => g.name)
    });
  }
  
  // 5. Check open NCRs
  const openNCRs = await Nonconformance.findMany({
    where: { 
      jobId, 
      status: { in: ['OPEN', 'INVESTIGATING', 'DISPOSITION_SET'] }
    }
  });
  if (openNCRs.length > 0) {
    blocks.push({
      type: 'OPEN_NCR',
      message: `${openNCRs.length} open NCR(s) on job`,
      ncrs: openNCRs.map(n => n.ncrNumber)
    });
  }
  
  return {
    canDispatch: blocks.length === 0,
    blocks
  };
}
```

### F.3 Stop-Work Authority Triggers from Quality

| Quality Event | SWA Trigger | Severity |
|---------------|-------------|----------|
| 3+ consecutive SPC Rule 1 violations | Auto | CRITICAL |
| Critical NCR (safety-related defect) | Auto | HIGH |
| Multiple NCRs same defect type (systemic) | Manual/Auto | HIGH |
| Quality hold escalated | Auto | MEDIUM |
| Customer complaint (safety) | Auto | CRITICAL |
| Gage found out of calibration (critical) | Auto | HIGH |

### F.4 Rework Job Generation

```javascript
async function generateReworkJob(ncrId) {
  const ncr = await Nonconformance.findById(ncrId, {
    include: [Job, { operations: true }]
  });
  
  if (ncr.disposition !== 'REWORK') {
    throw new Error('NCR disposition is not REWORK');
  }
  
  const originalJob = ncr.job;
  
  // Create rework job
  const reworkJob = await Job.create({
    jobNumber: `${originalJob.jobNumber}-RW`,
    type: 'REWORK',
    originalJobId: originalJob.id,
    ncrId: ncr.id,
    customerId: originalJob.customerId,
    orderId: originalJob.orderId,
    productId: originalJob.productId,
    quantity: ncr.quantityAffected,
    materialLotId: originalJob.materialLotId,
    priority: 'HIGH',  // Rework is high priority
    dueDate: originalJob.dueDate,  // Same due date
    notes: `Rework per NCR ${ncr.ncrNumber}: ${ncr.description}`
  });
  
  // Copy relevant operations (may be subset for rework)
  const reworkOps = determineReworkOperations(ncr, originalJob.operations);
  for (const op of reworkOps) {
    await Operation.create({
      ...op,
      id: undefined,
      jobId: reworkJob.id,
      status: 'PENDING'
    });
  }
  
  // Add re-inspection operation
  await Operation.create({
    jobId: reworkJob.id,
    sequence: 999,
    type: 'INSPECTION',
    name: 'Rework Re-Inspection',
    requiredInspection: true,
    notes: `Verify rework per NCR ${ncr.ncrNumber}`
  });
  
  // Update NCR with rework job link
  await ncr.update({ reworkJobId: reworkJob.id });
  
  // Notify
  await notifyQualityTeam('REWORK_JOB_CREATED', { ncr, reworkJob });
  await notifyScheduler('REWORK_JOB_CREATED', { reworkJob });
  
  return reworkJob;
}
```

---

## G) UI/UX Design (Material UI)

### G.1 Quality Module Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QUALITY MODULE NAVIGATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  🏭 ALROWARE  │  Quality                          👤 QC Lead │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  📊 Dashboard  📋 Inspections  🔴 NCRs  📈 SPC  🔍 Trace     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  TABS:                                                               │
│  ┌────────────┐                                                      │
│  │ Dashboard  │ Quality KPIs, trends, alerts                        │
│  ├────────────┤                                                      │
│  │ Inspections│ Pending, in-progress, completed                     │
│  ├────────────┤                                                      │
│  │ NCRs       │ Open, disposition, closed                           │
│  ├────────────┤                                                      │
│  │ SPC        │ Charts, violations, analysis                        │
│  ├────────────┤                                                      │
│  │ Trace      │ Traceability search, reports                        │
│  ├────────────┤                                                      │
│  │ Holds      │ Active holds, history                               │
│  ├────────────┤                                                      │
│  │ Plans      │ Quality plan management                             │
│  ├────────────┤                                                      │
│  │ Reports    │ CoCs, audit packages                                │
│  └────────────┘                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### G.2 Quality Dashboard

```jsx
// QualityDashboard.jsx
import React from 'react';
import {
  Box, Grid, Paper, Typography, Card, CardContent,
  LinearProgress, Chip, Alert, Divider
} from '@mui/material';
import {
  CheckCircle, Warning, Error, TrendingUp,
  TrendingDown, Assessment, PlaylistAddCheck
} from '@mui/icons-material';

const MetricCard = ({ title, value, trend, trendValue, color, icon: Icon }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>
        <Icon sx={{ color: `${color}.main` }} />
      </Box>
      <Typography variant="h4" sx={{ color: `${color}.main`, mb: 1 }}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {trend === 'up' ? (
          <TrendingUp fontSize="small" color="success" />
        ) : trend === 'down' ? (
          <TrendingDown fontSize="small" color="error" />
        ) : null}
        <Typography variant="caption" color="text.secondary">
          {trendValue}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export const QualityDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Alerts */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        2 SPC charts showing Rule 4 violations (run above centerline)
      </Alert>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="First Pass Yield"
            value="97.2%"
            trend="up"
            trendValue="+0.5% vs last week"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Open NCRs"
            value="8"
            trend="down"
            trendValue="3 less than yesterday"
            color="warning"
            icon={Warning}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Active Holds"
            value="2"
            trend="up"
            trendValue="1 new today"
            color="error"
            icon={Error}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Inspections Today"
            value="34 / 42"
            trend="up"
            trendValue="81% complete"
            color="info"
            icon={PlaylistAddCheck}
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Pending Inspections */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Pending Inspections
            </Typography>
            {/* Table of pending inspections */}
          </Paper>
        </Grid>
        
        {/* SPC Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              SPC Chart Status
            </Typography>
            {/* SPC summary */}
          </Paper>
        </Grid>
        
        {/* Defect Pareto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Defects (This Week)
            </Typography>
            {/* Pareto chart */}
          </Paper>
        </Grid>
        
        {/* Recent NCRs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent NCRs
            </Typography>
            {/* NCR list */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### G.3 Inspection Execution Screen

```jsx
// InspectionExecution.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Stepper, Step, StepLabel, Card, CardContent,
  FormControlLabel, Checkbox, Chip, Alert, Divider,
  InputAdornment, IconButton
} from '@mui/material';
import {
  CheckCircle, Cancel, CameraAlt, History,
  Warning, Save, Send
} from '@mui/icons-material';

const MeasurementInput = ({ 
  characteristic, 
  value, 
  onChange,
  result 
}) => {
  const getResultColor = () => {
    if (!result) return 'inherit';
    if (result === 'PASS') return 'success.light';
    if (result === 'FAIL') return 'error.light';
    if (result === 'MARGINAL') return 'warning.light';
    return 'inherit';
  };
  
  return (
    <Card 
      sx={{ 
        mb: 2, 
        bgcolor: getResultColor(),
        border: result === 'FAIL' ? 2 : 0,
        borderColor: 'error.main'
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">
              {characteristic.code}: {characteristic.name}
              {characteristic.isCritical && (
                <Chip label="CRITICAL" size="small" color="error" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nominal: {characteristic.nominalValue} {characteristic.unit}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tolerance: {characteristic.lowerLimit} - {characteristic.upperLimit}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {characteristic.type === 'VARIABLE' ? (
              <TextField
                fullWidth
                label="Measured Value"
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {characteristic.unit}
                    </InputAdornment>
                  )
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={value === true ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => onChange(true)}
                  startIcon={<CheckCircle />}
                >
                  Pass
                </Button>
                <Button
                  variant={value === false ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => onChange(false)}
                  startIcon={<Cancel />}
                >
                  Fail
                </Button>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {result && (
                <Chip 
                  label={result}
                  color={result === 'PASS' ? 'success' : result === 'FAIL' ? 'error' : 'warning'}
                />
              )}
              <IconButton size="small" title="Attach Photo">
                <CameraAlt />
              </IconButton>
              <IconButton size="small" title="View History">
                <History />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export const InspectionExecution = ({ inspectionId }) => {
  const [measurements, setMeasurements] = useState({});
  const [failedCount, setFailedCount] = useState(0);
  
  const handleSubmit = async () => {
    if (failedCount > 0) {
      // Show NCR creation dialog
    } else {
      // Submit as passed
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          In-Process Inspection
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Job</Typography>
            <Typography variant="body1">JOB-2026-0542</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Operation</Typography>
            <Typography variant="body1">OP20 - CNC Lathe</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Work Center</Typography>
            <Typography variant="body1">LATHE-01</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Inspector</Typography>
            <Typography variant="body1">John Smith</Typography>
          </Grid>
        </Grid>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          5 characteristics to inspect. Critical dimensions require 100% inspection.
        </Alert>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Measurement inputs */}
        <MeasurementInput
          characteristic={{
            code: 'DIM-001',
            name: 'Outside Diameter',
            type: 'VARIABLE',
            nominalValue: 2.500,
            lowerLimit: 2.498,
            upperLimit: 2.502,
            unit: 'in',
            isCritical: true
          }}
          value={measurements['DIM-001']}
          onChange={(val) => setMeasurements(prev => ({ ...prev, 'DIM-001': val }))}
          result="PASS"
        />
        
        <MeasurementInput
          characteristic={{
            code: 'DIM-002',
            name: 'Length',
            type: 'VARIABLE',
            nominalValue: 6.000,
            lowerLimit: 5.990,
            upperLimit: 6.010,
            unit: 'in',
            isCritical: false
          }}
          value={measurements['DIM-002']}
          onChange={(val) => setMeasurements(prev => ({ ...prev, 'DIM-002': val }))}
          result="MARGINAL"
        />
        
        <MeasurementInput
          characteristic={{
            code: 'VIS-001',
            name: 'Surface Finish',
            type: 'ATTRIBUTE',
            acceptanceCriteria: 'No visible scratches or tool marks',
            isCritical: false
          }}
          value={measurements['VIS-001']}
          onChange={(val) => setMeasurements(prev => ({ ...prev, 'VIS-001': val }))}
          result={null}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Save />}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Send />}
            onClick={handleSubmit}
          >
            Submit Inspection
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
```

### G.4 SPC Chart Display

```jsx
// SPCChartViewer.jsx
import React from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

const SPCChartComponent = ({ 
  data, 
  ucl, 
  lcl, 
  centerLine, 
  violations 
}) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="subgroup" />
      <YAxis domain={['auto', 'auto']} />
      <Tooltip />
      
      {/* Control Limits */}
      <ReferenceLine y={ucl} stroke="red" strokeDasharray="5 5" label="UCL" />
      <ReferenceLine y={centerLine} stroke="green" label="CL" />
      <ReferenceLine y={lcl} stroke="red" strokeDasharray="5 5" label="LCL" />
      
      {/* Data line */}
      <Line
        type="monotone"
        dataKey="value"
        stroke="#1976d2"
        dot={(props) => {
          const hasViolation = violations.includes(props.payload.subgroup);
          return (
            <circle
              cx={props.cx}
              cy={props.cy}
              r={hasViolation ? 6 : 4}
              fill={hasViolation ? 'red' : '#1976d2'}
              stroke={hasViolation ? 'darkred' : '#1976d2'}
            />
          );
        }}
      />
    </LineChart>
  </ResponsiveContainer>
);

export const SPCChartViewer = ({ chartId }) => {
  const chart = {
    characteristic: 'DIM-001 - Outside Diameter',
    chartType: 'X-bar/R',
    status: 'ALERT',
    ucl: 2.503,
    lcl: 2.497,
    centerLine: 2.500,
    lastViolation: 'Rule 4: 7 points above centerline'
  };
  
  const data = [
    { subgroup: 1, value: 2.501 },
    { subgroup: 2, value: 2.500 },
    { subgroup: 3, value: 2.502 },
    { subgroup: 4, value: 2.501 },
    { subgroup: 5, value: 2.502 },
    { subgroup: 6, value: 2.503 },
    { subgroup: 7, value: 2.502 },
    { subgroup: 8, value: 2.501 },
    { subgroup: 9, value: 2.501 },
    { subgroup: 10, value: 2.502 },
  ];
  
  const violations = [6];  // Subgroup 6 has violation
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5">
              {chart.characteristic}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chart Type: {chart.chartType}
            </Typography>
          </Box>
          <Chip
            label={chart.status}
            color={chart.status === 'ALERT' ? 'error' : chart.status === 'WARNING' ? 'warning' : 'success'}
          />
        </Box>
        
        {chart.lastViolation && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {chart.lastViolation}
          </Alert>
        )}
        
        {/* X-bar Chart */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>X-bar Chart</Typography>
        <SPCChartComponent
          data={data}
          ucl={chart.ucl}
          lcl={chart.lcl}
          centerLine={chart.centerLine}
          violations={violations}
        />
        
        {/* Control Limit Summary */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">UCL</Typography>
            <Typography variant="h6">{chart.ucl}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Center Line</Typography>
            <Typography variant="h6">{chart.centerLine}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">LCL</Typography>
            <Typography variant="h6">{chart.lcl}</Typography>
          </Grid>
        </Grid>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant="outlined">View History</Button>
          <Button variant="outlined">Recalculate Limits</Button>
          <Button variant="contained" color="warning">
            Acknowledge Violation
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
```

### G.5 NCR Management Screen

```jsx
// NCRManagement.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel, Alert
} from '@mui/material';
import {
  Add, Edit, Assignment, CheckCircle, Cancel
} from '@mui/icons-material';

const NCRRow = ({ ncr, onClick }) => (
  <TableRow 
    hover 
    onClick={() => onClick(ncr)}
    sx={{ cursor: 'pointer' }}
  >
    <TableCell>{ncr.ncrNumber}</TableCell>
    <TableCell>{ncr.defectType}</TableCell>
    <TableCell>
      <Chip 
        label={ncr.severity} 
        size="small"
        color={
          ncr.severity === 'CRITICAL' ? 'error' :
          ncr.severity === 'MAJOR' ? 'warning' : 'default'
        }
      />
    </TableCell>
    <TableCell>{ncr.job}</TableCell>
    <TableCell>
      <Chip 
        label={ncr.status} 
        size="small"
        variant="outlined"
      />
    </TableCell>
    <TableCell>{ncr.disposition || '—'}</TableCell>
    <TableCell>{ncr.age}</TableCell>
  </TableRow>
);

const DispositionDialog = ({ open, onClose, ncr }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Set Disposition - {ncr?.ncrNumber}</DialogTitle>
    <DialogContent>
      <Box sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info">
              {ncr?.description}
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Disposition</InputLabel>
              <Select label="Disposition">
                <MenuItem value="USE_AS_IS">Use As-Is</MenuItem>
                <MenuItem value="REWORK">Rework</MenuItem>
                <MenuItem value="REPAIR">Repair</MenuItem>
                <MenuItem value="SCRAP">Scrap</MenuItem>
                <MenuItem value="RETURN_TO_SUPPLIER">Return to Supplier</MenuItem>
                <MenuItem value="SORT">Sort (100% Inspection)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Quantity Affected"
              type="number"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Root Cause Analysis"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Disposition Notes / Justification"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Alert severity="warning">
              "Use As-Is" disposition requires Quality Manager approval.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" color="primary">
        Set Disposition
      </Button>
    </DialogActions>
  </Dialog>
);

export const NCRManagement = () => {
  const [tab, setTab] = useState(0);
  const [selectedNCR, setSelectedNCR] = useState(null);
  const [dispositionOpen, setDispositionOpen] = useState(false);
  
  const ncrs = [
    {
      ncrNumber: 'NCR-2026-0142',
      defectType: 'Dimension Out of Spec',
      severity: 'MAJOR',
      job: 'JOB-2026-0542',
      status: 'INVESTIGATING',
      disposition: null,
      age: '2 days',
      description: 'OD measured 2.510 vs spec 2.498-2.502'
    },
    {
      ncrNumber: 'NCR-2026-0141',
      defectType: 'Surface Defect',
      severity: 'MINOR',
      job: 'JOB-2026-0538',
      status: 'DISPOSITION_SET',
      disposition: 'REWORK',
      age: '3 days',
      description: 'Visible scratch on finished surface'
    }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Nonconformance Management</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Create NCR
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Open (8)" />
          <Tab label="Pending Disposition (3)" />
          <Tab label="In Progress (5)" />
          <Tab label="Closed" />
        </Tabs>
      </Paper>
      
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>NCR Number</TableCell>
              <TableCell>Defect Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Job</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Disposition</TableCell>
              <TableCell>Age</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ncrs.map(ncr => (
              <NCRRow 
                key={ncr.ncrNumber}
                ncr={ncr}
                onClick={(ncr) => {
                  setSelectedNCR(ncr);
                  setDispositionOpen(true);
                }}
              />
            ))}
          </TableBody>
        </Table>
      </Paper>
      
      <DispositionDialog
        open={dispositionOpen}
        onClose={() => setDispositionOpen(false)}
        ncr={selectedNCR}
      />
    </Box>
  );
};
```

### G.6 Traceability Search

```jsx
// TraceabilitySearch.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Tabs, Tab, Card, CardContent, Chip, Divider,
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Search, ArrowForward, ArrowBack, Download,
  LocalShipping, Build, Inventory, CheckCircle
} from '@mui/icons-material';

const TraceResult = ({ result }) => (
  <Box>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Trace Results for {result.searchValue}
    </Typography>
    
    <Timeline position="right">
      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {result.material.receivedDate}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="primary">
            <Inventory />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="subtitle1">Material Received</Typography>
          <Typography variant="body2">
            Heat: {result.material.heatNumber}
          </Typography>
          <Typography variant="body2">
            Supplier: {result.material.supplier}
          </Typography>
        </TimelineContent>
      </TimelineItem>
      
      {result.operations.map((op, index) => (
        <TimelineItem key={index}>
          <TimelineOppositeContent color="text.secondary">
            {op.completedAt}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="info">
              <Build />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="subtitle1">{op.name}</Typography>
            <Typography variant="body2">
              Operator: {op.operator}
            </Typography>
            <Typography variant="body2">
              Work Center: {op.workCenter}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
      
      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {result.inspection.date}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="success">
            <CheckCircle />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="subtitle1">Final Inspection</Typography>
          <Typography variant="body2">
            Result: {result.inspection.result}
          </Typography>
          <Typography variant="body2">
            Inspector: {result.inspection.inspector}
          </Typography>
        </TimelineContent>
      </TimelineItem>
      
      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {result.shipment.date}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="secondary">
            <LocalShipping />
          </TimelineDot>
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="subtitle1">Shipped</Typography>
          <Typography variant="body2">
            Customer: {result.shipment.customer}
          </Typography>
          <Typography variant="body2">
            BOL: {result.shipment.bol}
          </Typography>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
    
    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
      <Button variant="outlined" startIcon={<Download />}>
        Export Report
      </Button>
      <Button variant="outlined" startIcon={<Download />}>
        Generate CoC
      </Button>
    </Box>
  </Box>
);

export const TraceabilitySearch = () => {
  const [searchType, setSearchType] = useState('forward');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleSearch = async () => {
    setLoading(true);
    // API call
    setTimeout(() => {
      setResult({
        searchValue,
        material: {
          heatNumber: 'HT-2026-1234',
          supplier: 'Steel Supplier Inc.',
          receivedDate: '2026-01-15'
        },
        operations: [
          { name: 'Saw Cut', operator: 'J. Smith', workCenter: 'SAW-01', completedAt: '2026-01-20' },
          { name: 'CNC Lathe', operator: 'M. Johnson', workCenter: 'LATHE-02', completedAt: '2026-01-21' },
          { name: 'Heat Treat', operator: 'R. Williams', workCenter: 'HT-01', completedAt: '2026-01-22' }
        ],
        inspection: {
          result: 'PASS',
          inspector: 'Q. Inspector',
          date: '2026-01-23'
        },
        shipment: {
          customer: 'ABC Manufacturing',
          bol: 'BOL-2026-0456',
          date: '2026-01-25'
        }
      });
      setLoading(false);
    }, 1000);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Traceability Search
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Tabs value={searchType} onChange={(e, v) => setSearchType(v)} sx={{ mb: 3 }}>
          <Tab 
            value="forward" 
            label="Forward Trace" 
            icon={<ArrowForward />}
            iconPosition="start"
          />
          <Tab 
            value="backward" 
            label="Backward Trace" 
            icon={<ArrowBack />}
            iconPosition="start"
          />
        </Tabs>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={searchType === 'forward' ? 'Heat/Lot Number' : 'Shipment/Package ID'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'forward' ? 'HT-2026-1234' : 'PKG-2026-0001'}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <LoadingButton
              variant="contained"
              loading={loading}
              startIcon={<Search />}
              onClick={handleSearch}
            >
              Search
            </LoadingButton>
          </Grid>
        </Grid>
      </Paper>
      
      {result && (
        <Paper sx={{ p: 3 }}>
          <TraceResult result={result} />
        </Paper>
      )}
    </Box>
  );
};
```

---

## H) Roles & Permissions

### H.1 Quality Module Roles

| Role | Description | Typical User |
|------|-------------|--------------|
| **QUALITY_ADMIN** | Full access to all quality functions | Quality Director |
| **QUALITY_MANAGER** | Manage NCRs, approve dispositions, manage plans | Quality Manager |
| **QUALITY_ENGINEER** | Create plans, analyze SPC, investigate NCRs | QC Engineer |
| **QUALITY_INSPECTOR** | Execute inspections, record measurements | QC Inspector |
| **QUALITY_AUDITOR** | Read-only access for audits | Internal/External Auditor |
| **OPERATOR** | Limited quality functions (self-inspect) | Machine Operator |

### H.2 Permission Matrix

| Action | ADMIN | MANAGER | ENGINEER | INSPECTOR | AUDITOR | OPERATOR |
|--------|-------|---------|----------|-----------|---------|----------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Execute Inspection | ✓ | ✓ | ✓ | ✓ | — | Self only |
| Create NCR | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Set NCR Disposition | ✓ | ✓ | ✓ | — | — | — |
| Approve Use-As-Is | ✓ | ✓ | — | — | — | — |
| Create Quality Hold | ✓ | ✓ | ✓ | — | — | — |
| Release Quality Hold | ✓ | ✓ | — | — | — | — |
| Manage Quality Plans | ✓ | ✓ | ✓ | — | — | — |
| Approve Quality Plans | ✓ | ✓ | — | — | — | — |
| Configure SPC | ✓ | ✓ | ✓ | — | — | — |
| Lock/Unlock SPC Limits | ✓ | ✓ | — | — | — | — |
| View SPC Charts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Acknowledge SPC Violation | ✓ | ✓ | ✓ | ✓ | — | — |
| Generate CoC | ✓ | ✓ | ✓ | — | — | — |
| Approve CoC | ✓ | ✓ | — | — | — | — |
| View Traceability | ✓ | ✓ | ✓ | ✓ | ✓ | Own jobs |
| Export Audit Packages | ✓ | ✓ | ✓ | — | ✓ | — |
| Override Quality Gate | ✓ | ✓ | — | — | — | — |
| Trigger SWA from Quality | ✓ | ✓ | ✓ | — | — | — |

### H.3 Role Assignment Rules

```javascript
const qualityRoleRules = {
  QUALITY_ADMIN: {
    maxPerTenant: 3,
    requiresTraining: ['QUALITY_SYSTEMS', 'ISO_AUDITING'],
    canDelegate: ['QUALITY_MANAGER', 'QUALITY_ENGINEER', 'QUALITY_INSPECTOR']
  },
  QUALITY_MANAGER: {
    maxPerTenant: 10,
    requiresTraining: ['QUALITY_MANAGEMENT', 'NCR_HANDLING'],
    canDelegate: ['QUALITY_ENGINEER', 'QUALITY_INSPECTOR']
  },
  QUALITY_ENGINEER: {
    maxPerTenant: 50,
    requiresTraining: ['SPC_ANALYSIS', 'ROOT_CAUSE_ANALYSIS'],
    canDelegate: ['QUALITY_INSPECTOR']
  },
  QUALITY_INSPECTOR: {
    maxPerTenant: null,  // Unlimited
    requiresTraining: ['MEASUREMENT_SYSTEMS', 'QUALITY_BASICS'],
    canDelegate: []
  }
};
```

### H.4 Data Access Rules

| Data Type | ADMIN | MANAGER | ENGINEER | INSPECTOR | AUDITOR |
|-----------|-------|---------|----------|-----------|---------|
| All Quality Data | ✓ | ✓ | Read | Assigned | Read |
| NCR Details | ✓ | ✓ | ✓ | Created by | Read |
| SPC Raw Data | ✓ | ✓ | ✓ | ✓ | Read |
| Quality Costs | ✓ | ✓ | Aggregated | — | Read |
| Customer Complaints | ✓ | ✓ | Assigned | — | Read |
| Supplier Quality Data | ✓ | ✓ | ✓ | — | Read |

---

## I) APIs & Eventing

### I.1 REST API Endpoints

```yaml
# Inspection APIs
POST   /api/v1/quality/inspections                    # Create inspection record
GET    /api/v1/quality/inspections                    # List inspections
GET    /api/v1/quality/inspections/:id                # Get inspection details
PUT    /api/v1/quality/inspections/:id                # Update inspection
POST   /api/v1/quality/inspections/:id/measurements   # Add measurements
POST   /api/v1/quality/inspections/:id/complete       # Complete inspection
GET    /api/v1/quality/inspections/pending            # Get pending inspections

# NCR APIs
POST   /api/v1/quality/ncrs                           # Create NCR
GET    /api/v1/quality/ncrs                           # List NCRs
GET    /api/v1/quality/ncrs/:id                       # Get NCR details
PUT    /api/v1/quality/ncrs/:id                       # Update NCR
POST   /api/v1/quality/ncrs/:id/disposition           # Set disposition
POST   /api/v1/quality/ncrs/:id/verify                # Verify action
POST   /api/v1/quality/ncrs/:id/close                 # Close NCR
GET    /api/v1/quality/ncrs/:id/timeline              # NCR activity timeline

# Quality Hold APIs
POST   /api/v1/quality/holds                          # Create hold
GET    /api/v1/quality/holds                          # List holds
GET    /api/v1/quality/holds/:id                      # Get hold details
POST   /api/v1/quality/holds/:id/clear                # Clear hold
POST   /api/v1/quality/holds/:id/escalate             # Escalate hold

# SPC APIs
GET    /api/v1/quality/spc/charts                     # List SPC charts
GET    /api/v1/quality/spc/charts/:id                 # Get chart with data
POST   /api/v1/quality/spc/charts/:id/data            # Add data point
GET    /api/v1/quality/spc/charts/:id/violations      # Get violations
POST   /api/v1/quality/spc/charts/:id/acknowledge     # Acknowledge violation
POST   /api/v1/quality/spc/charts/:id/recalculate     # Recalculate limits

# Traceability APIs
GET    /api/v1/quality/trace/forward/:lotId           # Forward trace
GET    /api/v1/quality/trace/backward/:shipmentId     # Backward trace
GET    /api/v1/quality/trace/report/:entityId         # Generate trace report

# CoC APIs
POST   /api/v1/quality/coc                            # Generate CoC
GET    /api/v1/quality/coc/:id                        # Get CoC
POST   /api/v1/quality/coc/:id/approve                # Approve CoC
POST   /api/v1/quality/coc/:id/send                   # Send CoC to customer

# Quality Plan APIs
POST   /api/v1/quality/plans                          # Create plan
GET    /api/v1/quality/plans                          # List plans
GET    /api/v1/quality/plans/:id                      # Get plan details
PUT    /api/v1/quality/plans/:id                      # Update plan
POST   /api/v1/quality/plans/:id/approve              # Approve plan
POST   /api/v1/quality/plans/:id/retire               # Retire plan

# Validation APIs
POST   /api/v1/quality/validate/dispatch              # Validate job for dispatch
GET    /api/v1/quality/status/job/:jobId              # Job quality status
GET    /api/v1/quality/status/material/:lotId         # Material quality status
```

### I.2 Express.js Route Implementation

```javascript
// routes/quality.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateDispatchQuality } = require('../services/qualityValidation');
const { generateNCRNumber } = require('../services/sequencing');
const { evaluateSPCRules } = require('../services/spcEngine');
const { emitQualityEvent } = require('../services/events');

// Create NCR
router.post('/ncrs',
  requireAuth,
  requireRole(['QUALITY_ADMIN', 'QUALITY_MANAGER', 'QUALITY_ENGINEER', 'QUALITY_INSPECTOR', 'OPERATOR']),
  async (req, res) => {
    try {
      const {
        inspectionRecordId,
        jobId,
        materialLotId,
        defectTypeId,
        severity,
        description,
        quantityAffected
      } = req.body;
      
      const ncrNumber = await generateNCRNumber();
      
      const ncr = await prisma.nonconformance.create({
        data: {
          ncrNumber,
          inspectionRecordId,
          jobId,
          materialLotId,
          defectTypeId,
          severity,
          description,
          quantityAffected,
          status: 'OPEN',
          createdBy: req.user.id
        },
        include: {
          defectType: true,
          job: true
        }
      });
      
      // Emit event
      await emitQualityEvent('NCR_CREATED', {
        ncrId: ncr.id,
        ncrNumber,
        severity,
        jobId,
        createdBy: req.user.id
      });
      
      // If critical, auto-create hold
      if (severity === 'CRITICAL') {
        await createQualityHold({
          holdType: 'JOB_HOLD',
          jobId,
          reason: `Critical NCR: ${ncrNumber}`,
          ncrId: ncr.id,
          createdBy: req.user.id
        });
      }
      
      res.status(201).json(ncr);
    } catch (error) {
      console.error('Create NCR error:', error);
      res.status(500).json({ error: 'Failed to create NCR' });
    }
  }
);

// Set NCR Disposition
router.post('/ncrs/:id/disposition',
  requireAuth,
  requireRole(['QUALITY_ADMIN', 'QUALITY_MANAGER', 'QUALITY_ENGINEER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { disposition, rootCause, dispositionNotes } = req.body;
      
      const ncr = await prisma.nonconformance.findUnique({
        where: { id }
      });
      
      if (!ncr) {
        return res.status(404).json({ error: 'NCR not found' });
      }
      
      // Use-As-Is requires manager approval
      if (disposition === 'USE_AS_IS' && 
          !req.user.roles.some(r => ['QUALITY_ADMIN', 'QUALITY_MANAGER'].includes(r))) {
        return res.status(403).json({ 
          error: 'Use-As-Is disposition requires Quality Manager approval' 
        });
      }
      
      const updated = await prisma.nonconformance.update({
        where: { id },
        data: {
          disposition,
          rootCause,
          dispositionNotes,
          dispositionBy: req.user.id,
          dispositionAt: new Date(),
          status: 'DISPOSITION_SET'
        }
      });
      
      await emitQualityEvent('NCR_DISPOSITION_SET', {
        ncrId: id,
        disposition,
        dispositionBy: req.user.id
      });
      
      // If rework, create rework job
      if (disposition === 'REWORK') {
        await generateReworkJob(id);
      }
      
      // If scrap, update inventory
      if (disposition === 'SCRAP') {
        await recordScrap(ncr.jobId, ncr.quantityAffected);
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Set disposition error:', error);
      res.status(500).json({ error: 'Failed to set disposition' });
    }
  }
);

// Validate job for dispatch
router.post('/validate/dispatch',
  requireAuth,
  async (req, res) => {
    try {
      const { jobId, workCenterId } = req.body;
      
      const result = await validateDispatchQuality(jobId, workCenterId);
      
      res.json(result);
    } catch (error) {
      console.error('Validate dispatch error:', error);
      res.status(500).json({ error: 'Failed to validate' });
    }
  }
);

// Add SPC data point
router.post('/spc/charts/:id/data',
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rawValues, subgroupTime } = req.body;
      
      const chart = await prisma.sPCChart.findUnique({
        where: { id }
      });
      
      if (!chart) {
        return res.status(404).json({ error: 'SPC chart not found' });
      }
      
      // Calculate statistics
      const mean = rawValues.reduce((a, b) => a + b, 0) / rawValues.length;
      const range = Math.max(...rawValues) - Math.min(...rawValues);
      
      // Get next subgroup number
      const lastPoint = await prisma.sPCDataPoint.findFirst({
        where: { chartId: id },
        orderBy: { subgroupNumber: 'desc' }
      });
      const subgroupNumber = (lastPoint?.subgroupNumber || 0) + 1;
      
      // Evaluate rules
      const violations = await evaluateSPCRules(id, mean, range, subgroupNumber);
      
      const dataPoint = await prisma.sPCDataPoint.create({
        data: {
          chartId: id,
          subgroupNumber,
          subgroupTime: new Date(subgroupTime),
          mean,
          range,
          rawValues,
          hasViolation: violations.length > 0
        }
      });
      
      // Create violation records
      for (const violation of violations) {
        await prisma.sPCViolation.create({
          data: {
            chartId: id,
            dataPointId: dataPoint.id,
            ruleViolated: violation.rule,
            description: violation.description,
            severity: violation.severity
          }
        });
        
        await emitQualityEvent('SPC_VIOLATION', {
          chartId: id,
          dataPointId: dataPoint.id,
          rule: violation.rule,
          severity: violation.severity
        });
        
        // Critical violation triggers hold
        if (violation.severity === 'CRITICAL') {
          // Create quality hold
        }
      }
      
      res.status(201).json({ dataPoint, violations });
    } catch (error) {
      console.error('Add SPC data error:', error);
      res.status(500).json({ error: 'Failed to add SPC data' });
    }
  }
);

module.exports = router;
```

### I.3 Event Types

| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `NCR_CREATED` | New NCR recorded | Dispatch, Quality Manager, Job Owner |
| `NCR_DISPOSITION_SET` | Disposition assigned | Scheduler (if rework), Inventory (if scrap) |
| `NCR_CLOSED` | NCR completed | Analytics, Reporting |
| `QUALITY_HOLD_APPLIED` | Material/Job held | Dispatch, Scheduler, Job Owner |
| `QUALITY_HOLD_CLEARED` | Hold released | Dispatch, Scheduler |
| `SPC_VIOLATION` | SPC rule violated | Operator, Supervisor, Quality |
| `SPC_CRITICAL` | Critical SPC violation | Quality Manager, Safety (if safety dim) |
| `INSPECTION_COMPLETED` | Inspection done | Job tracking, Dispatch |
| `INSPECTION_FAILED` | Inspection failed | Quality, Supervisor |
| `COC_GENERATED` | Certificate created | Shipping, Customer Portal |
| `QUALITY_GATE_BLOCKED` | Gate not passed | Dispatch, Job Owner |

### I.4 WebSocket Events

```javascript
// Quality real-time events
const qualityEvents = {
  'quality:inspection:required': {
    description: 'Inspection needed for job/operation',
    payload: { jobId, operationId, inspectionPointId }
  },
  'quality:ncr:created': {
    description: 'New NCR created',
    payload: { ncrNumber, severity, jobId }
  },
  'quality:hold:applied': {
    description: 'Quality hold placed',
    payload: { holdNumber, holdType, scope }
  },
  'quality:spc:violation': {
    description: 'SPC rule violation detected',
    payload: { chartId, characteristicName, rule, severity }
  },
  'quality:gate:blocked': {
    description: 'Quality gate preventing progression',
    payload: { jobId, gateName, reason }
  }
};
```

---

## J) Audit & Evidence

### J.1 Quality Audit Log Schema

```prisma
model QualityAuditLog {
  id                    String    @id @default(uuid())
  
  // What
  entityType            String    // NCR, INSPECTION, HOLD, SPC, COC
  entityId              String
  action                String    // CREATE, UPDATE, DISPOSITION, APPROVE, etc.
  
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
  userAgent             String?
  sessionId             String?
  
  // Integrity
  hash                  String
  previousHash          String?
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([occurredAt])
}
```

### J.2 Audit Trail Requirements

| Action | Data Captured | Retention |
|--------|---------------|-----------|
| Inspection Completed | All measurements, inspector, time | 7 years |
| NCR Created | Description, severity, job link | 10 years |
| Disposition Set | Decision, justification, approver | 10 years |
| Quality Hold Applied | Reason, scope, creator | 10 years |
| Quality Hold Cleared | Resolution, approver | 10 years |
| SPC Violation | Rule, values, response | 5 years |
| SPC Limit Change | Old/new limits, approver | 5 years |
| CoC Approved | Content, approver | 10 years |
| Quality Plan Change | Version diff, approver | 7 years |
| Override Applied | Gate, reason, approver | 10 years |

### J.3 Audit Package Generation

```javascript
async function generateAuditPackage(params) {
  const { entityType, entityId, dateRange, includeEvidence } = params;
  
  const package = {
    metadata: {
      generatedAt: new Date(),
      generatedBy: currentUser,
      scope: entityType,
      entityId,
      dateRange
    },
    auditTrail: [],
    documents: [],
    evidence: []
  };
  
  // Get audit trail
  package.auditTrail = await prisma.qualityAuditLog.findMany({
    where: {
      entityType,
      entityId,
      occurredAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    },
    orderBy: { occurredAt: 'asc' }
  });
  
  // Get related documents
  if (entityType === 'JOB') {
    package.documents.push(
      await getJobTraveler(entityId),
      await getInspectionRecords(entityId),
      await getNCRs(entityId),
      await getMTRs(entityId)
    );
  }
  
  // Get evidence (photos, attachments)
  if (includeEvidence) {
    package.evidence = await getAttachments(entityType, entityId);
  }
  
  // Calculate hash for integrity
  package.integrityHash = calculatePackageHash(package);
  
  return package;
}
```

### J.4 Evidence Retention

| Evidence Type | Format | Retention | Storage |
|---------------|--------|-----------|---------|
| Inspection Photos | JPEG/PNG | 7 years | S3/Blob |
| Measurement Exports | CSV/Excel | 7 years | S3/Blob |
| Mill Test Reports | PDF | Life of product + 10 years | S3/Blob |
| Certificates of Conformance | PDF | Life of product + 10 years | S3/Blob |
| NCR Documentation | PDF | 10 years | S3/Blob |
| SPC Chart Exports | PDF/Image | 5 years | S3/Blob |
| Calibration Records | PDF | 5 years after gage disposal | S3/Blob |

### J.5 Immutable Trace Chain

```javascript
// Create trace event with hash chain
async function createTraceEvent(eventData) {
  // Get previous event hash
  const lastEvent = await prisma.traceEvent.findFirst({
    where: {
      entityType: eventData.entityType,
      entityId: eventData.entityId
    },
    orderBy: { occurredAt: 'desc' }
  });
  
  const previousHash = lastEvent?.hash || 'GENESIS';
  
  // Calculate hash including previous hash
  const dataToHash = JSON.stringify({
    ...eventData,
    previousHash,
    occurredAt: new Date().toISOString()
  });
  
  const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  
  return prisma.traceEvent.create({
    data: {
      ...eventData,
      previousHash,
      hash,
      occurredAt: new Date()
    }
  });
}

// Verify trace chain integrity
async function verifyTraceChain(entityType, entityId) {
  const events = await prisma.traceEvent.findMany({
    where: { entityType, entityId },
    orderBy: { occurredAt: 'asc' }
  });
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Verify previous hash link
    if (i === 0) {
      if (event.previousHash !== 'GENESIS') {
        return { valid: false, error: 'First event should have GENESIS previous hash' };
      }
    } else {
      if (event.previousHash !== events[i-1].hash) {
        return { valid: false, error: `Chain broken at event ${i}` };
      }
    }
    
    // Verify event hash
    const recalculatedHash = calculateEventHash(event);
    if (recalculatedHash !== event.hash) {
      return { valid: false, error: `Hash mismatch at event ${i}` };
    }
  }
  
  return { valid: true, eventCount: events.length };
}
```

---

## K) Testing & Validation

### K.1 Test Case Categories

| Category | Focus Area | # Tests |
|----------|-----------|---------|
| Inspection Workflow | CRUD, measurements, gates | 25 |
| NCR Lifecycle | Create, disposition, close | 20 |
| SPC Engine | Calculations, rule detection | 30 |
| Quality Holds | Apply, clear, escalate | 15 |
| Traceability | Forward, backward, chain | 20 |
| Integration | Dispatch, Safety, Inventory | 25 |
| Permissions | Role-based access | 15 |

### K.2 Critical Test Scenarios

#### Scenario 1: Quality Gate Blocks Production

```gherkin
Feature: Quality Gate Enforcement

Scenario: Failed inspection blocks next operation
  Given Job "JOB-2026-0542" is at operation OP20
  And OP20 has a required in-process inspection
  When Inspector records measurement 2.510 for tolerance 2.498-2.502
  Then The measurement result is FAIL
  And An NCR is auto-created
  And Job status changes to HELD_QUALITY
  And Dispatch cannot assign OP30 until resolved

Scenario: Operator cannot bypass quality gate
  Given Job "JOB-2026-0543" requires first piece inspection
  And First piece inspection is not complete
  When Operator attempts to start full production run
  Then System blocks the action
  And Message shows "First piece inspection required"
  And Override button is visible only to Quality Manager
```

#### Scenario 2: SPC Violation Escalation

```gherkin
Feature: SPC Violation Handling

Scenario: Single out-of-control point triggers alert
  Given SPC chart for "DIM-001" has UCL=2.503, LCL=2.497
  When Subgroup mean of 2.505 is recorded
  Then Rule 1 violation is detected
  And Alert notification sent to operator
  And Supervisor is notified
  And Chart status changes to ALERT

Scenario: Multiple violations trigger hold
  Given SPC chart has 3 consecutive Rule 1 violations
  When Fourth consecutive Rule 1 violation occurs
  Then System creates automatic Quality Hold
  And Linked work center is flagged
  And Quality Manager is escalated
  And Stop-Work Authority option is presented
```

#### Scenario 3: NCR Rework Flow

```gherkin
Feature: NCR Rework Generation

Scenario: Rework disposition creates rework job
  Given NCR "NCR-2026-0142" for Job "JOB-2026-0542"
  And NCR affects 5 pieces
  When Quality Engineer sets disposition to REWORK
  Then Rework job "JOB-2026-0542-RW" is created
  And Rework job quantity is 5
  And Rework job includes re-inspection operation
  And Original job yield is updated
  And Scheduler is notified of new job
```

#### Scenario 4: Traceability Chain Verification

```gherkin
Feature: Traceability

Scenario: Forward trace from heat number
  Given Heat "HT-2026-1234" was received
  And Jobs JOB-001, JOB-002, JOB-003 used this heat
  And JOB-001 shipped to Customer A
  And JOB-002 shipped to Customer B
  When User performs forward trace on HT-2026-1234
  Then All 3 jobs are listed
  And Customer A and B are identified
  And Full processing history is shown
  And All inspections are linked

Scenario: Backward trace from shipment
  Given Shipment "SHIP-2026-0456" to Customer A
  When User performs backward trace
  Then Package contents are shown
  And Job details are displayed
  And All operations are listed with operators
  And Material source (heat/lot) is identified
  And Supplier is linked
```

#### Scenario 5: CoC Generation

```gherkin
Feature: Certificate of Conformance

Scenario: CoC requires complete inspections
  Given Shipment contains Jobs JOB-001, JOB-002
  And JOB-001 has passed final inspection
  And JOB-002 final inspection is incomplete
  When User attempts to generate CoC
  Then System blocks generation
  And Message shows "JOB-002 requires final inspection"

Scenario: CoC includes all certifications
  Given Shipment is ready with all inspections passed
  When CoC is generated
  Then CoC includes material specs met
  And Mill test report references are included
  And Inspection summary is attached
  And Customer-specific requirements are verified
```

#### Scenario 6: Operator Cannot Falsify Data

```gherkin
Feature: Data Integrity

Scenario: Cannot edit submitted measurements
  Given Inspection record was submitted
  When Operator attempts to modify measurement
  Then Edit is blocked
  And Message shows "Submitted records are immutable"
  And Audit log shows attempted modification

Scenario: Measurements outside possible range rejected
  Given Characteristic has tolerance 2.498-2.502
  When Operator enters value 25.00
  Then Warning shows "Value outside expected range"
  And Operator must confirm or correct
  And Unusual entry is flagged in audit
```

#### Scenario 7: Quality-Safety Integration

```gherkin
Feature: Quality-Safety Integration

Scenario: Critical quality NCR triggers safety review
  Given NCR is created for safety-critical defect
  And Severity is CRITICAL
  When NCR is saved
  Then Safety module is notified
  And Stop-Work Authority option is presented
  And Cannot close NCR without safety review

Scenario: SWA escalation from quality hold
  Given Quality hold has been active for 24 hours
  And Issue involves potential safety hazard
  When Quality Manager escalates hold
  Then SWA is triggered
  And Work center is locked
  And All affected jobs are paused
```

### K.3 Performance Requirements

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Inspection record save | < 500ms | API response time |
| NCR creation | < 1s | Including notifications |
| SPC data point + rule evaluation | < 200ms | Real-time feedback |
| Traceability search | < 2s | Full chain |
| CoC generation | < 5s | PDF creation |
| Dashboard load | < 3s | All widgets |

### K.4 Load Testing

| Scenario | Volume | Target |
|----------|--------|--------|
| Concurrent inspections | 100 inspectors | No degradation |
| Measurements/hour | 10,000 | Real-time SPC update |
| NCRs/day | 500 | All workflows complete |
| Trace queries/hour | 1,000 | < 2s response |
| Audit log writes/minute | 500 | No queuing |

---

## L) Rollout & Go/No-Go Criteria

### L.1 Rollout Phases

| Phase | Scope | Duration | Success Criteria |
|-------|-------|----------|------------------|
| **Phase 1** | Pilot work center | 2 weeks | 95% inspection completion, <5 bugs |
| **Phase 2** | Quality department | 2 weeks | All inspectors trained, NCR workflow stable |
| **Phase 3** | Production floor | 4 weeks | SPC charts active, holds enforced |
| **Phase 4** | Full integration | 2 weeks | Dispatch, shipping, finance integrated |

### L.2 Go/No-Go Criteria

#### Phase 1 → Phase 2

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| Inspection completion rate | ≥ 95% | — |
| System availability | ≥ 99% | — |
| Critical bugs | 0 | — |
| User satisfaction (survey) | ≥ 4/5 | — |
| Data accuracy | 100% | — |

#### Phase 2 → Phase 3

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| NCR workflow completion | 100% within SLA | — |
| SPC charts configured | ≥ 90% critical dims | — |
| Inspector training | 100% certified | — |
| Quality hold enforcement | Working | — |
| Dispatch integration | Tested | — |

#### Phase 3 → Phase 4

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| First Pass Yield tracking | Accurate ±1% | — |
| SPC violations responded | 100% within 4h | — |
| Traceability chain | 100% complete | — |
| Audit package generation | < 5 min | — |
| Safety integration | Tested | — |

#### Phase 4 Complete (GA)

| Criterion | Threshold | Current |
|-----------|-----------|---------|
| Full traceability | Material → Customer | — |
| CoC generation | 100% on time | — |
| Quality costs tracked | Accurate | — |
| Customer complaints reduced | ≥ 10% | — |
| Compliance audit passed | External | — |

### L.3 Training Requirements

| Role | Training Modules | Duration | Certification |
|------|-----------------|----------|---------------|
| Quality Inspector | Inspection execution, measurement entry | 4 hours | Practical test |
| Quality Engineer | SPC, NCR investigation, plans | 8 hours | Written + practical |
| Quality Manager | Full system, approvals, reporting | 8 hours | Scenario-based |
| Operator | Self-inspection, NCR reporting | 2 hours | Demonstration |
| Auditor | Traceability, audit packages | 4 hours | Report generation |

### L.4 Rollback Plan

| Trigger | Action | Recovery Time |
|---------|--------|---------------|
| Critical data loss | Restore from backup | 4 hours |
| System unavailable >1h | Activate paper backup | Immediate |
| Incorrect SPC calculations | Pause SPC, manual verification | 2 hours |
| Integration failure | Isolate quality module | 1 hour |
| Security breach | Full lockdown, audit | 8 hours |

### L.5 Success Metrics (6-Month Target)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| First Pass Yield | 94% | 97% | Inspections |
| NCR Resolution Time | 5 days | 3 days | NCR data |
| Customer Complaints | 12/month | 8/month | CRM data |
| Scrap Cost | $50K/month | $35K/month | Finance data |
| Audit Finding Rate | 8/audit | 3/audit | Audit reports |
| Traceability Queries | 30 min manual | 2 min system | Time study |
| CoC Generation | 4 hours | 30 min | Process time |

---

## Appendix A: SPC Constants Table

| n | A2 | D3 | D4 | d2 |
|---|----|----|----|----|
| 2 | 1.880 | 0 | 3.267 | 1.128 |
| 3 | 1.023 | 0 | 2.574 | 1.693 |
| 4 | 0.729 | 0 | 2.282 | 2.059 |
| 5 | 0.577 | 0 | 2.114 | 2.326 |
| 6 | 0.483 | 0 | 2.004 | 2.534 |
| 7 | 0.419 | 0.076 | 1.924 | 2.704 |
| 8 | 0.373 | 0.136 | 1.864 | 2.847 |
| 9 | 0.337 | 0.184 | 1.816 | 2.970 |
| 10 | 0.308 | 0.223 | 1.777 | 3.078 |

---

## Appendix B: Defect Type Codes

| Code | Name | Category | Default Severity |
|------|------|----------|------------------|
| DIM-OOS | Dimension Out of Spec | DIMENSIONAL | MAJOR |
| DIM-OVER | Oversized | DIMENSIONAL | MAJOR |
| DIM-UNDER | Undersized | DIMENSIONAL | MAJOR |
| SUR-SCR | Surface Scratch | SURFACE | MINOR |
| SUR-DENT | Surface Dent | SURFACE | MINOR |
| SUR-PIT | Surface Pitting | SURFACE | MINOR |
| SUR-RUST | Surface Rust/Corrosion | SURFACE | MAJOR |
| MAT-CRACK | Material Crack | MATERIAL | CRITICAL |
| MAT-INCLUSION | Material Inclusion | MATERIAL | MAJOR |
| MAT-WRONG | Wrong Material | MATERIAL | CRITICAL |
| PRC-INCOMPLETE | Incomplete Operation | PROCESS | MAJOR |
| PRC-SEQUENCE | Wrong Sequence | PROCESS | MAJOR |
| PRC-SETTINGS | Wrong Machine Settings | PROCESS | MAJOR |
| FUN-FAIL | Functional Failure | FUNCTIONAL | CRITICAL |
| FUN-FIT | Fit/Assembly Issue | FUNCTIONAL | MAJOR |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 4, 2026 | Principal Architect | Initial release |

---

**END OF DOCUMENT**
```

