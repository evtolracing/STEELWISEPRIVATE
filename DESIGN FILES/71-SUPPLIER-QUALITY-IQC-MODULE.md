# Supplier Quality & Inbound Quality Control (IQC) Module
## SteelWise ERP - Principal Design Specification

**Version:** 1.0  
**Date:** February 4, 2026  
**Author:** Principal SQM/IQC Systems Architect  
**Status:** Design Complete - Ready for Implementation

---

## A) PHILOSOPHY & OBJECTIVES

### Why Inbound Quality is the First Quality Gate

In metals and plastics service centers, **supplier quality IS your quality**. By the time material reaches the customer, it has passed through your facility—but its fundamental properties were determined at the mill or supplier. You can process perfectly and still fail if the incoming material was wrong.

**The Cost of Poor Inbound Quality:**

| Impact Area | Consequence |
|-------------|-------------|
| **Production** | Scrap, rework, machine damage, schedule delays |
| **Customer** | Defective shipments, claims, lost business |
| **Traceability** | Inability to identify affected downstream material |
| **Safety** | Hazardous material conditions, certifications missing |
| **Financial** | Chargebacks, expedited replacements, COPQ |

**Philosophy:** Catch supplier issues at the dock, not at the customer.

### How Supplier Issues Propagate Downstream

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPPLIER ISSUE PROPAGATION                               │
└─────────────────────────────────────────────────────────────────────────────┘

  Supplier Ships         Received &         Processed          Shipped to
  Defective Material     Put to Stock       Into Orders        Customer
        │                     │                  │                  │
        ▼                     ▼                  ▼                  ▼
   ┌─────────┐          ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ Bad Heat│ ───────▶ │ In Stock│ ─────▶ │ 47 Jobs │ ─────▶ │ 23 Cust │
   │ H-12345 │          │ 50,000# │        │ Run     │        │ Claims  │
   └─────────┘          └─────────┘        └─────────┘        └─────────┘
        │                                                           │
        │                                                           │
        └───────────── MISSED OPPORTUNITY ──────────────────────────┘
                       (Should have caught at receiving)

  WITH IQC:
   ┌─────────┐          ┌─────────┐        
   │ Bad Heat│ ───────▶ │QUARANTIN│ ─────▶ RETURNED TO SUPPLIER
   │ H-12345 │   IQC    │ 50,000# │        (No downstream impact)
   └─────────┘  CATCH   └─────────┘        
```

### How Structured SQM Reduces Rework, Scrap, and Claims

**Without SQM:**
- Random inspection (or none)
- Issues discovered during production
- No supplier accountability
- Repeat issues from same suppliers
- Customer claims with unknown root cause

**With SQM:**
- Risk-based inspection plans
- Issues caught at receiving
- Supplier scorecards drive accountability
- Repeat issues trigger escalation
- Full traceability from claim → job → lot → supplier

**ROI of SQM:**
- 40-60% reduction in supplier-related NCRs
- 30-50% reduction in receiving-related production delays
- 25-40% reduction in customer claims from material issues
- Measurable supplier improvement through SCAR process

### Importance of Traceability Back to Supplier

Every piece of material in your facility should be traceable to:

```
Customer Shipment
    └── Package
        └── Job
            └── Material Issued
                └── Coil/Plate/Unit
                    └── Heat/Lot Number
                        └── Mill Test Report (MTR)
                            └── Supplier PO
                                └── Supplier
```

**Why this matters:**
1. **Containment:** When issues arise, identify ALL affected material
2. **Root Cause:** Determine if issue is supplier or internal
3. **Recovery:** Charge back supplier for their defects
4. **Prevention:** Data-driven supplier decisions

---

## B) SUPPLIER QUALITY DATA MODEL

### Core Entities

```prisma
// ============================================================================
// SUPPLIER MANAGEMENT
// ============================================================================

model Supplier {
  id                    String              @id @default(uuid())
  supplierCode          String              @unique // SUP-001
  name                  String
  shortName             String?
  
  // Type
  supplierType          SupplierType
  
  // Contact
  primaryContactName    String?
  primaryContactEmail   String?
  primaryContactPhone   String?
  
  // Address
  addressLine1          String?
  addressLine2          String?
  city                  String?
  state                 String?
  postalCode            String?
  country               String              @default("USA")
  
  // Quality status
  approvalStatus        SupplierApprovalStatus @default(PENDING)
  approvedAt            DateTime?
  approvedById          String?
  approvedBy            User?               @relation("SupplierApprover", fields: [approvedById], references: [id])
  qualityRating         Decimal?            @db.Decimal(3, 2) // 0.00 - 5.00
  riskLevel             SupplierRiskLevel   @default(MEDIUM)
  
  // Certifications
  iso9001Certified      Boolean             @default(false)
  iso9001Expiry         DateTime?
  otherCertifications   Json?               // Array of cert objects
  
  // Terms
  paymentTerms          String?
  leadTimeDays          Int?
  
  // Status
  active                Boolean             @default(true)
  notes                 String?
  
  // Audit
  createdAt             DateTime            @default(now())
  createdById           String?
  updatedAt             DateTime            @updatedAt
  
  // Relations
  materials             SupplierMaterial[]
  receipts              InboundReceipt[]
  nonconformances       SupplierNonconformance[]
  scars                 SupplierCorrectiveAction[]
  scorecards            SupplierScorecard[]
  communications        SupplierCommunication[]
  purchaseOrders        PurchaseOrder[]
  
  @@index([supplierCode])
  @@index([approvalStatus])
  @@index([riskLevel])
}

enum SupplierType {
  MILL              // Primary steel/aluminum mills
  DISTRIBUTOR       // Metal distributors
  PROCESSOR         // Toll processors
  CONSUMABLE        // Consumables, tooling
  SERVICE           // Service providers
  OTHER
}

enum SupplierApprovalStatus {
  PENDING           // Not yet evaluated
  APPROVED          // Approved for purchasing
  CONDITIONAL       // Approved with restrictions
  PROBATION         // On probation, increased scrutiny
  SUSPENDED         // Temporarily suspended
  DISQUALIFIED      // Permanently disqualified
}

enum SupplierRiskLevel {
  LOW               // Proven supplier, minimal inspection
  MEDIUM            // Standard inspection
  HIGH              // Enhanced inspection
  CRITICAL          // 100% inspection required
}

// ============================================================================
// SUPPLIER MATERIALS (What they can supply)
// ============================================================================

model SupplierMaterial {
  id                  String            @id @default(uuid())
  supplierId          String
  supplier            Supplier          @relation(fields: [supplierId], references: [id])
  
  // What they supply
  productCategoryId   String?
  gradeId             String?
  grade               Grade?            @relation(fields: [gradeId], references: [id])
  
  // Capability
  minThickness        Decimal?          @db.Decimal(8, 4)
  maxThickness        Decimal?          @db.Decimal(8, 4)
  minWidth            Decimal?          @db.Decimal(8, 4)
  maxWidth            Decimal?          @db.Decimal(8, 4)
  
  // Quality specifics
  inspectionPlanId    String?
  inspectionPlan      InboundInspectionPlan? @relation(fields: [inspectionPlanId], references: [id])
  qualityNotes        String?
  
  // Performance
  defectRate          Decimal?          @db.Decimal(5, 4) // 0.0000 - 1.0000
  lastReceiptDate     DateTime?
  totalReceived       Decimal?          @db.Decimal(12, 2)
  
  // Status
  approved            Boolean           @default(true)
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  @@unique([supplierId, gradeId])
  @@index([supplierId])
}

// ============================================================================
// INBOUND RECEIPTS
// ============================================================================

model InboundReceipt {
  id                  String            @id @default(uuid())
  receiptNumber       String            @unique // RCV-2026-000001
  
  // Source
  supplierId          String
  supplier            Supplier          @relation(fields: [supplierId], references: [id])
  purchaseOrderId     String?
  purchaseOrder       PurchaseOrder?    @relation(fields: [purchaseOrderId], references: [id])
  supplierPackingSlip String?
  
  // Receipt info
  receivedAt          DateTime          @default(now())
  receivedById        String
  receivedBy          User              @relation("ReceiptReceiver", fields: [receivedById], references: [id])
  locationId          String
  location            Location          @relation(fields: [locationId], references: [id])
  
  // Carrier info
  carrierName         String?
  bolNumber           String?           // Bill of Lading
  trailerNumber       String?
  sealNumber          String?
  sealIntact          Boolean?
  
  // Quality status
  qualityStatus       ReceiptQualityStatus @default(PENDING_INSPECTION)
  
  // Overall receipt assessment
  conditionOnArrival  String?           // Good, Damaged, etc.
  arrivalNotes        String?
  
  // Audit
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  // Relations
  items               InboundReceiptItem[]
  inspections         InboundInspectionRecord[]
  documents           ReceiptDocument[]
  
  @@index([supplierId])
  @@index([qualityStatus])
  @@index([receivedAt])
}

enum ReceiptQualityStatus {
  PENDING_INSPECTION    // Awaiting inspection
  IN_INSPECTION         // Being inspected
  ACCEPTED              // Passed, released to inventory
  REJECTED              // Failed, quarantined
  CONDITIONAL_RELEASE   // Released with conditions
  PARTIAL_ACCEPT        // Some items accepted, some rejected
}

model InboundReceiptItem {
  id                  String            @id @default(uuid())
  receiptId           String
  receipt             InboundReceipt    @relation(fields: [receiptId], references: [id])
  
  // What was received
  productId           String?
  product             Product?          @relation(fields: [productId], references: [id])
  gradeId             String?
  grade               Grade?            @relation(fields: [gradeId], references: [id])
  description         String
  
  // Quantity
  orderedQty          Decimal           @db.Decimal(12, 4)
  receivedQty         Decimal           @db.Decimal(12, 4)
  uom                 String
  
  // Traceability
  heatNumber          String?
  lotNumber           String?
  coilNumber          String?
  supplierBatchId     String?
  
  // Physical specs received
  thickness           Decimal?          @db.Decimal(8, 4)
  width               Decimal?          @db.Decimal(8, 4)
  length              Decimal?          @db.Decimal(10, 4)
  
  // Quality status
  itemStatus          ReceiptItemStatus @default(PENDING)
  
  // Inventory linkage (after acceptance)
  coilId              String?           // If creates/updates a coil
  coil                Coil?             @relation(fields: [coilId], references: [id])
  inventoryUnitId     String?           // If creates inventory unit
  
  // Storage location assigned
  storageLocationId   String?
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  // Relations
  inspectionResults   InspectionResult[]
  nonconformances     SupplierNonconformance[]
  
  @@index([receiptId])
  @@index([heatNumber])
  @@index([lotNumber])
}

enum ReceiptItemStatus {
  PENDING             // Not yet inspected
  INSPECTING          // Under inspection
  ACCEPTED            // Passed inspection
  REJECTED            // Failed inspection
  CONDITIONAL         // Conditional release
  ON_HOLD             // On hold pending decision
}

// ============================================================================
// INSPECTION PLANS
// ============================================================================

model InboundInspectionPlan {
  id                  String            @id @default(uuid())
  planCode            String            @unique // IQC-PLAN-001
  name                String
  description         String?
  
  // Scope
  appliesToGradeId    String?
  appliesToGrade      Grade?            @relation(fields: [appliesToGradeId], references: [id])
  appliesToSupplierId String?
  appliesToRiskLevel  SupplierRiskLevel?
  
  // Inspection requirements
  requiresVisual      Boolean           @default(true)
  requiresDimensional Boolean           @default(true)
  requiresDocReview   Boolean           @default(true)
  requiresChemistry   Boolean           @default(false)
  requiresMechanical  Boolean           @default(false)
  
  // Sampling
  samplingType        SamplingType      @default(AQL)
  samplingLevel       String?           // e.g., "Level II"
  aqlLevel            Decimal?          @db.Decimal(4, 2) // e.g., 1.0, 2.5
  sampleSize          Int?              // Fixed sample size if not AQL
  
  // Auto-skip rules
  skipInspectionAfter Int?              // Skip after N consecutive passes
  currentSkipCount    Int               @default(0)
  
  // Status
  active              Boolean           @default(true)
  
  createdAt           DateTime          @default(now())
  createdById         String
  createdBy           User              @relation(fields: [createdById], references: [id])
  updatedAt           DateTime          @updatedAt
  
  // Relations
  checkpoints         InspectionCheckpoint[]
  supplierMaterials   SupplierMaterial[]
  
  @@index([planCode])
}

enum SamplingType {
  NONE              // No inspection (trusted supplier)
  FULL              // 100% inspection
  AQL               // Statistical sampling per AQL tables
  FIXED             // Fixed sample size
  FIRST_ARTICLE     // First article only
}

model InspectionCheckpoint {
  id                  String            @id @default(uuid())
  planId              String
  plan                InboundInspectionPlan @relation(fields: [planId], references: [id])
  
  // Checkpoint definition
  sequence            Int
  name                String
  description         String?
  checkpointType      CheckpointType
  
  // For measurements
  measurementUnit     String?
  nominalValue        Decimal?          @db.Decimal(10, 4)
  tolerancePlus       Decimal?          @db.Decimal(10, 4)
  toleranceMinus      Decimal?          @db.Decimal(10, 4)
  
  // For pass/fail
  passCriteria        String?
  
  // Required
  required            Boolean           @default(true)
  criticalToQuality   Boolean           @default(false)
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  @@index([planId])
  @@unique([planId, sequence])
}

enum CheckpointType {
  VISUAL              // Visual inspection
  DIMENSIONAL         // Measurement
  DOCUMENT            // Document verification
  SURFACE             // Surface quality
  CHEMISTRY           // Chemical composition
  MECHANICAL          // Mechanical properties
  PACKAGING           // Packaging condition
  LABELING            // Proper labeling
  PASS_FAIL           // Simple pass/fail
}

// ============================================================================
// INSPECTION RECORDS
// ============================================================================

model InboundInspectionRecord {
  id                  String            @id @default(uuid())
  inspectionNumber    String            @unique // IQC-2026-000001
  
  // What's being inspected
  receiptId           String
  receipt             InboundReceipt    @relation(fields: [receiptId], references: [id])
  planId              String?
  plan                InboundInspectionPlan? @relation(fields: [planId], references: [id])
  
  // Inspector
  inspectorId         String
  inspector           User              @relation(fields: [inspectorId], references: [id])
  
  // Timing
  startedAt           DateTime          @default(now())
  completedAt         DateTime?
  
  // Overall result
  status              InspectionStatus  @default(IN_PROGRESS)
  overallResult       InspectionResult? 
  
  // Summary
  passCount           Int               @default(0)
  failCount           Int               @default(0)
  totalChecks         Int               @default(0)
  
  // Notes
  notes               String?
  
  // Disposition
  disposition         InspectionDisposition?
  dispositionById     String?
  dispositionBy       User?             @relation("InspectionDispositioner", fields: [dispositionById], references: [id])
  dispositionAt       DateTime?
  dispositionNotes    String?
  
  // If conditional release
  conditionalApprovalId String?
  conditionalApproval User?             @relation("ConditionalApprover", fields: [conditionalApprovalId], references: [id])
  conditionalReason   String?
  conditionalExpiry   DateTime?
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  // Relations
  results             InspectionCheckResult[]
  nonconformances     SupplierNonconformance[]
  
  @@index([receiptId])
  @@index([status])
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
  CONDITIONAL
}

enum InspectionDisposition {
  ACCEPT              // Release to inventory
  REJECT              // Quarantine, return to supplier
  CONDITIONAL_RELEASE // Release with conditions
  HOLD                // Hold pending decision
  USE_AS_IS           // Accept deviation
  REWORK              // Rework before acceptance
  SCRAP               // Scrap material
  RETURN_TO_VENDOR    // Return to supplier
}

model InspectionCheckResult {
  id                  String            @id @default(uuid())
  inspectionId        String
  inspection          InboundInspectionRecord @relation(fields: [inspectionId], references: [id])
  checkpointId        String?
  receiptItemId       String?
  receiptItem         InboundReceiptItem? @relation(fields: [receiptItemId], references: [id])
  
  // Result
  checkpointName      String
  checkpointType      CheckpointType
  result              CheckResult
  
  // Measurement data
  measuredValue       Decimal?          @db.Decimal(10, 4)
  nominalValue        Decimal?          @db.Decimal(10, 4)
  tolerancePlus       Decimal?          @db.Decimal(10, 4)
  toleranceMinus      Decimal?          @db.Decimal(10, 4)
  inTolerance         Boolean?
  
  // Pass/Fail data
  passFailResult      Boolean?
  
  // Notes
  notes               String?
  
  createdAt           DateTime          @default(now())
  
  @@index([inspectionId])
  @@index([result])
}

enum CheckResult {
  PASS
  FAIL
  NOT_APPLICABLE
  SKIPPED
}

// ============================================================================
// SUPPLIER NONCONFORMANCE (SNC)
// ============================================================================

model SupplierNonconformance {
  id                  String            @id @default(uuid())
  sncNumber           String            @unique // SNC-2026-000001
  
  // Source
  supplierId          String
  supplier            Supplier          @relation(fields: [supplierId], references: [id])
  receiptItemId       String?
  receiptItem         InboundReceiptItem? @relation(fields: [receiptItemId], references: [id])
  inspectionId        String?
  inspection          InboundInspectionRecord? @relation(fields: [inspectionId], references: [id])
  
  // Traceability
  heatNumber          String?
  lotNumber           String?
  purchaseOrderId     String?
  
  // Issue details
  issueType           SupplierIssueType
  severity            SeverityLevel     @default(MINOR)
  description         String
  defectCode          String?
  quantityAffected    Decimal?          @db.Decimal(12, 4)
  uom                 String?
  
  // Status
  status              SNCStatus         @default(OPEN)
  
  // Ownership
  ownerId             String
  owner               User              @relation("SNCOwner", fields: [ownerId], references: [id])
  
  // Supplier notification
  supplierNotifiedAt  DateTime?
  supplierNotifiedById String?
  notificationMethod  String?           // Email, Phone, Portal
  responseDueDate     DateTime?
  
  // Supplier response
  supplierResponseAt  DateTime?
  supplierResponse    String?
  supplierAcceptsResponsibility Boolean?
  
  // Cost impact
  materialCost        Decimal?          @db.Decimal(12, 2)
  laborCost           Decimal?          @db.Decimal(12, 2)
  otherCost           Decimal?          @db.Decimal(12, 2)
  totalCost           Decimal?          @db.Decimal(12, 2)
  chargebackAmount    Decimal?          @db.Decimal(12, 2)
  chargebackStatus    ChargebackStatus?
  
  // Downstream impact
  downstreamNCRCount  Int               @default(0)
  customerClaimCount  Int               @default(0)
  
  // Closure
  closedAt            DateTime?
  closedById          String?
  closedBy            User?             @relation("SNCCloser", fields: [closedById], references: [id])
  closureNotes        String?
  
  // Audit
  createdAt           DateTime          @default(now())
  createdById         String
  createdBy           User              @relation("SNCCreator", fields: [createdById], references: [id])
  updatedAt           DateTime          @updatedAt
  
  // Relations
  scars               SupplierCorrectiveAction[]
  communications      SupplierCommunication[]
  attachments         SNCAttachment[]
  linkedNCRs          NCR[]             @relation("SupplierNCRLink")
  linkedClaims        CustomerClaim[]   @relation("SupplierClaimLink")
  
  @@index([supplierId])
  @@index([status])
  @@index([heatNumber])
}

enum SupplierIssueType {
  DIMENSION_OUT_OF_SPEC
  SURFACE_DEFECT
  CHEMISTRY_OUT_OF_SPEC
  MECHANICAL_OUT_OF_SPEC
  WRONG_MATERIAL
  WRONG_QUANTITY
  SHIPPING_DAMAGE
  PACKAGING_DAMAGE
  DOCUMENTATION_ERROR
  MTR_MISSING
  MTR_INCORRECT
  CONTAMINATION
  MIXED_HEATS
  LATE_DELIVERY
  OTHER
}

enum SeverityLevel {
  CRITICAL          // Safety or major impact
  MAJOR             // Significant impact
  MINOR             // Limited impact
}

enum SNCStatus {
  OPEN              // Just created
  SUPPLIER_NOTIFIED // Sent to supplier
  AWAITING_RESPONSE // Waiting for supplier
  RESPONSE_RECEIVED // Supplier responded
  UNDER_REVIEW      // Reviewing response
  SCAR_ISSUED       // Corrective action requested
  RESOLVED          // Issue resolved
  CLOSED            // Closed
  CANCELLED
}

enum ChargebackStatus {
  NOT_APPLICABLE
  PENDING
  SUBMITTED
  ACCEPTED
  DISPUTED
  PAID
  WRITTEN_OFF
}

// ============================================================================
// SUPPLIER CORRECTIVE ACTION (SCAR)
// ============================================================================

model SupplierCorrectiveAction {
  id                  String            @id @default(uuid())
  scarNumber          String            @unique // SCAR-2026-000001
  
  // Source
  supplierId          String
  supplier            Supplier          @relation(fields: [supplierId], references: [id])
  sncId               String?
  snc                 SupplierNonconformance? @relation(fields: [sncId], references: [id])
  
  // Issue summary
  issueDescription    String
  impactDescription   String?
  
  // Status
  status              SCARStatus        @default(ISSUED)
  
  // Ownership
  ownerId             String
  owner               User              @relation("SCAROwner", fields: [ownerId], references: [id])
  
  // Dates
  issuedAt            DateTime          @default(now())
  responseDueDate     DateTime
  
  // Supplier response
  rootCauseProvided   String?
  rootCauseCategory   RootCauseCategory?
  containmentActions  String?
  correctiveActions   String?
  preventiveActions   String?
  supplierRespondedAt DateTime?
  
  // Our review
  responseAccepted    Boolean?
  responseReviewedById String?
  responseReviewedBy  User?             @relation("SCARReviewer", fields: [responseReviewedById], references: [id])
  responseReviewedAt  DateTime?
  reviewNotes         String?
  
  // Verification
  verificationRequired Boolean          @default(true)
  verificationMethod  String?
  verifiedAt          DateTime?
  verifiedById        String?
  verifiedBy          User?             @relation("SCARVerifier", fields: [verifiedById], references: [id])
  verificationNotes   String?
  effectivenessConfirmed Boolean?
  
  // Closure
  closedAt            DateTime?
  closedById          String?
  closedBy            User?             @relation("SCARCloser", fields: [closedById], references: [id])
  
  // Audit
  createdAt           DateTime          @default(now())
  createdById         String
  createdBy           User              @relation("SCARCreator", fields: [createdById], references: [id])
  updatedAt           DateTime          @updatedAt
  
  // Relations
  communications      SupplierCommunication[]
  attachments         SCARAttachment[]
  
  @@index([supplierId])
  @@index([status])
}

enum SCARStatus {
  ISSUED              // Sent to supplier
  AWAITING_RESPONSE   // Waiting for supplier
  RESPONSE_RECEIVED   // Supplier responded
  UNDER_REVIEW        // Reviewing response
  RESPONSE_REJECTED   // Response not acceptable
  ACCEPTED            // Response accepted
  VERIFICATION        // Verifying effectiveness
  CLOSED              // Complete
  ESCALATED           // Escalated (supplier non-responsive)
  CANCELLED
}

enum RootCauseCategory {
  PROCESS
  EQUIPMENT
  MATERIAL
  HUMAN_ERROR
  TRAINING
  PROCEDURE
  SUPPLIER_SUPPLIER  // Their supplier's issue
  UNKNOWN
}

// ============================================================================
// SUPPLIER SCORECARDS
// ============================================================================

model SupplierScorecard {
  id                  String            @id @default(uuid())
  supplierId          String
  supplier            Supplier          @relation(fields: [supplierId], references: [id])
  
  // Period
  periodType          ScorecardPeriod
  periodStart         DateTime
  periodEnd           DateTime
  
  // Volume metrics
  totalReceipts       Int               @default(0)
  totalQuantity       Decimal           @default(0) @db.Decimal(12, 2)
  totalValue          Decimal           @default(0) @db.Decimal(14, 2)
  
  // Quality metrics
  inspectionsPerformed Int              @default(0)
  inspectionsPassed   Int               @default(0)
  inspectionsFailed   Int               @default(0)
  defectRate          Decimal           @default(0) @db.Decimal(5, 4) // 0.0000 - 1.0000
  
  // Nonconformance metrics
  sncCount            Int               @default(0)
  sncCriticalCount    Int               @default(0)
  sncMajorCount       Int               @default(0)
  sncMinorCount       Int               @default(0)
  
  // SCAR metrics
  scarCount           Int               @default(0)
  scarClosedOnTime    Int               @default(0)
  avgScarResponseDays Decimal?          @db.Decimal(5, 2)
  
  // Delivery metrics
  onTimeDeliveries    Int               @default(0)
  lateDeliveries      Int               @default(0)
  onTimeRate          Decimal           @default(0) @db.Decimal(5, 4)
  
  // Documentation metrics
  mtrAccuracyRate     Decimal           @default(1) @db.Decimal(5, 4)
  docErrorCount       Int               @default(0)
  
  // Cost impact
  chargebackTotal     Decimal           @default(0) @db.Decimal(12, 2)
  downstreamCostImpact Decimal          @default(0) @db.Decimal(12, 2)
  
  // Calculated scores (0-100)
  qualityScore        Decimal           @default(100) @db.Decimal(5, 2)
  deliveryScore       Decimal           @default(100) @db.Decimal(5, 2)
  responsiveScore     Decimal           @default(100) @db.Decimal(5, 2)
  overallScore        Decimal           @default(100) @db.Decimal(5, 2)
  
  // Rating
  rating              SupplierRating?
  
  // Trend
  scoreTrend          ScoreTrend        @default(STABLE)
  previousScore       Decimal?          @db.Decimal(5, 2)
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  @@unique([supplierId, periodType, periodStart])
  @@index([supplierId])
  @@index([periodStart])
}

enum ScorecardPeriod {
  MONTHLY
  QUARTERLY
  ANNUAL
}

enum SupplierRating {
  A_PLUS            // 95-100
  A                 // 90-94
  B                 // 80-89
  C                 // 70-79
  D                 // 60-69
  F                 // Below 60
}

enum ScoreTrend {
  IMPROVING
  STABLE
  DECLINING
}

// ============================================================================
// SUPPLIER COMMUNICATIONS
// ============================================================================

model SupplierCommunication {
  id                  String            @id @default(uuid())
  
  // Linked to
  supplierId          String
  supplier            Supplier          @relation(fields: [supplierId], references: [id])
  sncId               String?
  snc                 SupplierNonconformance? @relation(fields: [sncId], references: [id])
  scarId              String?
  scar                SupplierCorrectiveAction? @relation(fields: [scarId], references: [id])
  
  // Communication
  direction           CommDirection
  channel             CommChannel
  subject             String?
  body                String
  
  // Parties
  fromUserId          String?
  fromUser            User?             @relation(fields: [fromUserId], references: [id])
  toEmail             String?
  
  // Email specifics
  emailMessageId      String?
  
  createdAt           DateTime          @default(now())
  
  @@index([supplierId])
  @@index([sncId])
  @@index([scarId])
}

// ============================================================================
// DOCUMENTS & ATTACHMENTS
// ============================================================================

model ReceiptDocument {
  id                  String            @id @default(uuid())
  receiptId           String
  receipt             InboundReceipt    @relation(fields: [receiptId], references: [id])
  
  documentType        ReceiptDocType
  fileName            String
  fileType            String
  fileSize            Int
  storageUrl          String
  
  // For MTRs
  heatNumber          String?
  verified            Boolean           @default(false)
  verifiedById        String?
  verifiedAt          DateTime?
  
  uploadedById        String
  uploadedBy          User              @relation(fields: [uploadedById], references: [id])
  uploadedAt          DateTime          @default(now())
  
  @@index([receiptId])
  @@index([documentType])
}

enum ReceiptDocType {
  MTR                 // Mill Test Report
  COC                 // Certificate of Conformance
  COA                 // Certificate of Analysis
  PACKING_SLIP
  BOL                 // Bill of Lading
  PHOTO
  OTHER
}

model SNCAttachment {
  id                  String            @id @default(uuid())
  sncId               String
  snc                 SupplierNonconformance @relation(fields: [sncId], references: [id])
  
  fileName            String
  fileType            String
  fileSize            Int
  storageUrl          String
  category            String?
  description         String?
  
  uploadedById        String
  uploadedBy          User              @relation(fields: [uploadedById], references: [id])
  uploadedAt          DateTime          @default(now())
  
  @@index([sncId])
}

model SCARAttachment {
  id                  String            @id @default(uuid())
  scarId              String
  scar                SupplierCorrectiveAction @relation(fields: [scarId], references: [id])
  
  fileName            String
  fileType            String
  fileSize            Int
  storageUrl          String
  category            String?
  description         String?
  
  uploadedById        String
  uploadedBy          User              @relation(fields: [uploadedById], references: [id])
  uploadedAt          DateTime          @default(now())
  
  @@index([scarId])
}
```

---

## C) INBOUND INSPECTION WORKFLOW (IQC)

### Workflow State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INBOUND INSPECTION WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

    TRUCK ARRIVES
         │
         ▼
    ┌──────────┐
    │ RECEIVED │ ◀── Create receipt, capture BOL, seal check
    └──────────┘
         │
         │ Check inspection requirements
         ▼
    ┌───────────────────────┐
    │ Inspection Required?  │
    └───────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼ Yes     ▼ No (Skip inspection - trusted supplier)
┌────────────────┐     ┌──────────┐
│PENDING_INSPECTN│     │ ACCEPTED │ ──────▶ Release to Inventory
└────────────────┘     └──────────┘
         │
         │ Inspector starts
         ▼
    ┌─────────────┐
    │ IN_INSPECTN │ ◀── Execute checkpoints
    └─────────────┘
         │
         │ All checks complete
         ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    INSPECTION RESULT                            │
    └─────────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬────────────┬────────────┐
    │         │            │            │            │
    ▼         ▼            ▼            ▼            ▼
┌────────┐┌────────┐┌───────────┐┌────────────┐┌──────────┐
│ ACCEPT ││ REJECT ││CONDITIONAL││  USE_AS_IS ││   HOLD   │
└────────┘└────────┘│  RELEASE  │└────────────┘└──────────┘
    │         │     └───────────┘      │            │
    │         │           │            │            │
    ▼         ▼           ▼            ▼            ▼
┌────────┐┌────────┐┌───────────┐┌────────────┐┌──────────┐
│Release ││Quarantn││Approval   ││NCR created ││ Pending  │
│to      ││& RTV   ││Required   ││Material    ││ Decision │
│Inventory││       ││           ││released    ││          │
└────────┘└────────┘└───────────┘└────────────┘└──────────┘
              │           │
              │           │ Manager approves
              ▼           ▼
         ┌────────┐  ┌───────────┐
         │Create  │  │ Release   │
         │SNC     │  │ w/Conds   │
         └────────┘  └───────────┘
```

### Inspection Decision Rules

| Supplier Risk | Material Type | Grade | Inspection Level |
|---------------|---------------|-------|------------------|
| LOW | Standard | Standard | Skip or 10% sampling |
| LOW | Standard | Specialty | 25% sampling |
| MEDIUM | Standard | Standard | 25% sampling |
| MEDIUM | Standard | Specialty | 50% sampling |
| HIGH | Any | Any | 100% inspection |
| CRITICAL | Any | Any | 100% + enhanced tests |
| Any | New supplier | Any | 100% first 3 receipts |
| Any | After SNC | Any | 100% next 5 receipts |

### Inspection Types

#### 1. Visual Inspection
- Surface defects (scratches, pits, rust, scale)
- Edge condition
- Coil set / flatness
- Color / appearance
- Packaging condition

#### 2. Dimensional Inspection
- Thickness (multiple points)
- Width
- Length
- Diameter (for rounds)
- Flatness deviation
- Squareness

#### 3. Documentation Review
- MTR present and legible
- Heat number matches material
- Chemistry within spec
- Mechanical properties within spec
- Required certifications present
- CoC matches order

#### 4. Sampling Plans

```typescript
// AQL Sampling based on lot size
const AQL_TABLE = {
  // Lot Size: { sampleSize, acceptNumber, rejectNumber }
  '2-8': { sample: 2, accept: 0, reject: 1 },
  '9-15': { sample: 3, accept: 0, reject: 1 },
  '16-25': { sample: 5, accept: 0, reject: 1 },
  '26-50': { sample: 8, accept: 0, reject: 1 },
  '51-90': { sample: 13, accept: 1, reject: 2 },
  '91-150': { sample: 20, accept: 1, reject: 2 },
  '151-280': { sample: 32, accept: 2, reject: 3 },
  '281-500': { sample: 50, accept: 3, reject: 4 },
  '501-1200': { sample: 80, accept: 5, reject: 6 },
  '1201-3200': { sample: 125, accept: 7, reject: 8 },
};

function getSamplingPlan(lotSize: number, aqlLevel: number = 1.0) {
  // Find appropriate row based on lot size
  // Adjust accept/reject based on AQL level
  // Return sampling parameters
}
```

### Conditional Release Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONDITIONAL RELEASE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

CONDITIONS FOR USE:
1. Minor deviation from spec (within customer tolerance)
2. Urgent production need
3. Risk assessment completed
4. Approved by Quality Manager

REQUIRED INFORMATION:
- Reason for conditional release
- Specific deviation details
- Intended use restrictions
- Expiry date (if time-limited)
- Approver signature

TRACKING:
- Material marked with CONDITIONAL status
- Jobs using material flagged
- Auto-alert when approaching expiry
- Must be dispositioned before expiry
```

---

## D) SCAR-LITE WORKFLOW

### What is SCAR-Lite?

Traditional SCAR (Supplier Corrective Action Request) processes can be bureaucratic and slow. **SCAR-Lite** is a streamlined version designed for:
- Faster resolution of minor issues
- Lower administrative burden
- Maintaining supplier relationships
- Still capturing data for scorecards

### SCAR Classification

| Severity | Response Time | Process | Follow-up |
|----------|---------------|---------|-----------|
| **Critical** | 24 hours | Full SCAR | Verification audit |
| **Major** | 5 business days | Full SCAR | Evidence review |
| **Minor** | 10 business days | SCAR-Lite | Acknowledgment only |
| **Observation** | N/A | Logged only | Next scorecard review |

### SCAR-Lite Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCAR-LITE WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    SNC Created (Minor)
         │
         ▼
    ┌───────────────┐
    │ Issue Logged  │ ◀── Auto-populated from SNC
    └───────────────┘
         │
         │ Auto-email to supplier
         ▼
    ┌───────────────────┐
    │ SUPPLIER_NOTIFIED │
    └───────────────────┘
         │
         │ Supplier responds via portal/email
         ▼
    ┌───────────────────┐
    │ RESPONSE_RECEIVED │
    └───────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Acceptable  Not Acceptable
    │              │
    │              ▼
    │         ┌──────────────┐
    │         │ ESCALATE TO  │
    │         │ FULL SCAR    │
    │         └──────────────┘
    │
    ▼
┌────────────┐
│  CLOSED    │ ◀── No verification required for SCAR-Lite
└────────────┘

TOTAL TOUCHPOINTS: 2-3 (vs. 6-10 for full SCAR)
```

### SCAR-Lite Email Template

```
Subject: Supplier Quality Notice - {SNC_NUMBER} - Action Requested

Dear {SUPPLIER_CONTACT},

We have identified a quality issue with a recent shipment:

Receipt: {RECEIPT_NUMBER}
PO: {PO_NUMBER}
Material: {MATERIAL_DESCRIPTION}
Heat/Lot: {HEAT_NUMBER}
Issue: {ISSUE_TYPE}
Details: {DESCRIPTION}

Please respond within 10 business days with:
1. Acknowledgment of the issue
2. Brief description of actions taken or planned

This is a SCAR-Lite notification. No formal root cause analysis is required 
unless the issue escalates or recurs.

Respond to this email or log into our supplier portal at: {PORTAL_URL}

Thank you for your continued partnership.

Regards,
{SENDER_NAME}
Quality Team
{COMPANY_NAME}
```

### Full SCAR Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FULL SCAR WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    SNC Created (Major/Critical)
         │
         ▼
    ┌───────────────┐
    │ SCAR DRAFTED  │ ◀── Owner prepares SCAR document
    └───────────────┘
         │
         │ Review and approve
         ▼
    ┌───────────────┐
    │ SCAR ISSUED   │ ◀── Formal notification to supplier
    └───────────────┘
         │
         │ Response due date set (5-30 days based on severity)
         ▼
    ┌─────────────────────┐
    │ AWAITING_RESPONSE   │
    └─────────────────────┘
         │
         │ Reminders at 50%, 75%, 100% of due date
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
 Response Received       Overdue
    │                         │
    │                         ▼
    │                    ┌──────────┐
    │                    │ ESCALATE │
    │                    └──────────┘
    │                         │
    ▼                         ▼
┌─────────────────────┐  ┌──────────────┐
│ RESPONSE_RECEIVED   │  │ Management   │
└─────────────────────┘  │ Escalation   │
         │               └──────────────┘
         │
         │ Quality reviews response
         ▼
    ┌─────────────────────┐
    │    UNDER_REVIEW     │
    └─────────────────────┘
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
 Adequate                 Inadequate
    │                         │
    ▼                         ▼
┌─────────────────┐      ┌────────────────┐
│    ACCEPTED     │      │RESPONSE_REJECTED│
└─────────────────┘      └────────────────┘
         │                    │
         │                    │ Supplier must resubmit
         │                    └─────▶ Back to AWAITING_RESPONSE
         │
         │ If verification required
         ▼
    ┌─────────────────┐
    │  VERIFICATION   │ ◀── Monitor next shipments
    └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Effective  Not Effective
    │              │
    ▼              ▼
┌────────┐    ┌──────────────┐
│ CLOSED │    │ RE-ESCALATE  │
└────────┘    └──────────────┘
```

### Required SCAR Elements (8D Format)

| D | Element | Required For |
|---|---------|--------------|
| D0 | Team | Major, Critical |
| D1 | Problem Description | All |
| D2 | Containment Actions | All |
| D3 | Root Cause Analysis | Major, Critical |
| D4 | Corrective Actions | All |
| D5 | Verification of Corrective Actions | Major, Critical |
| D6 | Preventive Actions | Critical |
| D7 | Congratulate Team | Optional |
| D8 | Closure | All |

---

## E) SUPPLIER SCORECARDS & RATING

### Scorecard Calculation

```typescript
interface ScorecardWeights {
  quality: 0.50;      // 50% weight
  delivery: 0.25;     // 25% weight
  responsiveness: 0.15; // 15% weight
  documentation: 0.10;  // 10% weight
}

function calculateSupplierScore(metrics: SupplierMetrics): number {
  // Quality Score (0-100)
  const qualityScore = calculateQualityScore(metrics);
  
  // Delivery Score (0-100)
  const deliveryScore = calculateDeliveryScore(metrics);
  
  // Responsiveness Score (0-100)
  const responsivenessScore = calculateResponsivenessScore(metrics);
  
  // Documentation Score (0-100)
  const documentationScore = calculateDocumentationScore(metrics);
  
  // Weighted overall score
  const overallScore = 
    (qualityScore * 0.50) +
    (deliveryScore * 0.25) +
    (responsivenessScore * 0.15) +
    (documentationScore * 0.10);
    
  return Math.round(overallScore * 100) / 100;
}

function calculateQualityScore(metrics: SupplierMetrics): number {
  // Base score starts at 100
  let score = 100;
  
  // Deduct for defect rate
  // Example: 2% defect rate = -20 points
  score -= metrics.defectRate * 1000;
  
  // Deduct for SNCs
  score -= metrics.sncCriticalCount * 15;
  score -= metrics.sncMajorCount * 8;
  score -= metrics.sncMinorCount * 2;
  
  // Deduct for downstream impact
  score -= metrics.customerClaimCount * 20;
  
  return Math.max(0, Math.min(100, score));
}

function calculateDeliveryScore(metrics: SupplierMetrics): number {
  if (metrics.totalDeliveries === 0) return 100;
  
  const onTimeRate = metrics.onTimeDeliveries / metrics.totalDeliveries;
  return Math.round(onTimeRate * 100);
}

function calculateResponsivenessScore(metrics: SupplierMetrics): number {
  let score = 100;
  
  // Average SCAR response time
  if (metrics.avgScarResponseDays > 10) {
    score -= (metrics.avgScarResponseDays - 10) * 2;
  }
  
  // Overdue responses
  score -= metrics.overdueResponseCount * 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateDocumentationScore(metrics: SupplierMetrics): number {
  let score = 100;
  
  // Missing MTRs
  score -= metrics.missingMtrCount * 10;
  
  // Incorrect documents
  score -= metrics.docErrorCount * 5;
  
  return Math.max(0, Math.min(100, score));
}
```

### Rating Thresholds

| Rating | Score Range | Color | Status | Actions |
|--------|-------------|-------|--------|---------|
| **A+** | 95-100 | 🟢 Green | Preferred | Skip inspection eligible |
| **A** | 90-94 | 🟢 Green | Approved | Reduced inspection |
| **B** | 80-89 | 🟡 Yellow | Approved | Standard inspection |
| **C** | 70-79 | 🟠 Orange | Conditional | Enhanced inspection |
| **D** | 60-69 | 🔴 Red | Probation | 100% inspection, improvement plan |
| **F** | Below 60 | ⚫ Black | At Risk | Suspension review |

### Automatic Risk Level Adjustments

```typescript
function adjustSupplierRiskLevel(
  supplier: Supplier, 
  scorecard: SupplierScorecard
): SupplierRiskLevel {
  const score = scorecard.overallScore;
  const trend = scorecard.scoreTrend;
  const recentSNCs = scorecard.sncCriticalCount + scorecard.sncMajorCount;
  
  // Critical issues override score
  if (scorecard.sncCriticalCount > 0) {
    return SupplierRiskLevel.CRITICAL;
  }
  
  // Score-based risk
  if (score >= 95) {
    return SupplierRiskLevel.LOW;
  } else if (score >= 85) {
    return trend === 'DECLINING' 
      ? SupplierRiskLevel.MEDIUM 
      : SupplierRiskLevel.LOW;
  } else if (score >= 70) {
    return SupplierRiskLevel.MEDIUM;
  } else if (score >= 60) {
    return SupplierRiskLevel.HIGH;
  } else {
    return SupplierRiskLevel.CRITICAL;
  }
}
```

### Scorecard Review Meeting Agenda

**Monthly Supplier Quality Review:**

1. **Volume Summary**
   - Receipts, quantity, value
   - Comparison to prior period

2. **Quality Performance**
   - Defect rate trend
   - SNCs by category
   - Repeat issues

3. **Open Issues**
   - Active SCARs
   - Overdue responses
   - Pending chargebacks

4. **Rating Changes**
   - Suppliers improved
   - Suppliers declined
   - Actions required

5. **Strategic Decisions**
   - New supplier approvals
   - Suspensions/disqualifications
   - Volume allocation changes

---

## F) INTEGRATION WITH OTHER MODULES

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SQM/IQC INTEGRATION MAP                                │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │  PURCHASING     │
                         │  (PO Module)    │
                         └────────┬────────┘
                                  │
                    PO created ───┼─── Supplier selected
                                  │
                                  ▼
┌─────────────┐          ┌─────────────────┐          ┌─────────────┐
│ SUPPLIER    │◀────────▶│     SQM/IQC     │◀────────▶│  INVENTORY  │
│ PORTAL      │          │     MODULE      │          │  MODULE     │
│             │          │                 │          │             │
│ - SCAR resp │          │ - Receiving     │          │ - Put away  │
│ - Scorecard │          │ - Inspection    │          │ - Quarantine│
│   view      │          │ - SNC/SCAR      │          │ - Release   │
└─────────────┘          │ - Scorecards    │          └─────────────┘
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │   PRODUCTION    │  │   CUSTOMER      │  │   FINANCE       │
    │   (Shop Floor)  │  │   QUALITY       │  │   (AP Module)   │
    │                 │  │   (NCR/RMA)     │  │                 │
    │ - Material hold │  │ - Link claims   │  │ - Chargebacks   │
    │ - Job impact    │  │   to supplier   │  │ - Debit memos   │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Purchasing Integration

**When PO is Created:**
```typescript
async function onPurchaseOrderCreated(po: PurchaseOrder) {
  // Get supplier quality profile
  const supplier = await getSupplier(po.supplierId);
  const latestScorecard = await getLatestScorecard(po.supplierId);
  
  // Warn if supplier on probation
  if (supplier.approvalStatus === 'PROBATION') {
    await createNotification({
      type: 'SUPPLIER_PROBATION_WARNING',
      message: `Supplier ${supplier.name} is on probation. Approval required.`,
      poId: po.id,
      requiresApproval: true
    });
  }
  
  // Auto-set inspection requirements based on risk
  await setInspectionRequirements(po, supplier.riskLevel);
}
```

**When Receipt is Created:**
```typescript
async function onReceiptCreated(receipt: InboundReceipt) {
  const supplier = await getSupplier(receipt.supplierId);
  const po = await getPurchaseOrder(receipt.purchaseOrderId);
  
  // Determine inspection requirements
  const inspectionPlan = await getApplicableInspectionPlan(
    supplier.id,
    supplier.riskLevel,
    receipt.items
  );
  
  if (inspectionPlan.requiresInspection) {
    // Create inspection record
    await createInspectionRecord({
      receiptId: receipt.id,
      planId: inspectionPlan.id,
      status: 'PENDING'
    });
    
    // Hold material until inspected
    await setReceiptStatus(receipt.id, 'PENDING_INSPECTION');
  } else {
    // Skip inspection - release directly
    await releaseToInventory(receipt.id);
  }
}
```

### Inventory Integration

**Acceptance Flow:**
```typescript
async function acceptReceiptItem(
  itemId: string,
  disposition: InspectionDisposition,
  locationId: string
) {
  const item = await getReceiptItem(itemId);
  
  switch (disposition) {
    case 'ACCEPT':
      // Create or update inventory unit
      await createInventoryFromReceipt(item, locationId);
      break;
      
    case 'CONDITIONAL_RELEASE':
      // Create with conditional flag
      await createInventoryFromReceipt(item, locationId, {
        status: 'CONDITIONAL',
        conditionalExpiry: calculateExpiry(),
        conditionalNotes: dispositionNotes
      });
      break;
      
    case 'REJECT':
      // Move to quarantine location
      await createInventoryFromReceipt(item, QUARANTINE_LOCATION, {
        status: 'QUARANTINE',
        quarantineReason: 'IQC_REJECTION'
      });
      break;
  }
}
```

**Quarantine Management:**
```typescript
async function quarantineMaterial(
  inventoryId: string,
  reason: string,
  sncId?: string
) {
  // Update inventory status
  await updateInventory(inventoryId, {
    status: 'QUARANTINE',
    quarantineReason: reason,
    quarantinedAt: new Date(),
    linkedSncId: sncId
  });
  
  // Check for downstream allocations
  const allocations = await getActiveAllocations(inventoryId);
  if (allocations.length > 0) {
    // Alert planning of potential impact
    await createAlert({
      type: 'QUARANTINE_ALLOCATION_IMPACT',
      message: `Quarantined material has ${allocations.length} active allocations`,
      inventoryId,
      allocations
    });
  }
  
  // Check for in-progress jobs using this material
  const affectedJobs = await getJobsUsingMaterial(inventoryId);
  if (affectedJobs.length > 0) {
    // Critical alert
    await createAlert({
      type: 'QUARANTINE_JOB_IMPACT',
      severity: 'CRITICAL',
      message: `Quarantined material in use on ${affectedJobs.length} jobs`,
      inventoryId,
      jobs: affectedJobs
    });
  }
}
```

### Production Integration

**Material Issue with Quality Check:**
```typescript
async function issueMaterialToJob(
  inventoryId: string,
  jobId: string,
  quantity: number
) {
  const inventory = await getInventory(inventoryId);
  
  // Check material status
  if (inventory.status === 'QUARANTINE') {
    throw new Error('Cannot issue quarantined material');
  }
  
  if (inventory.status === 'CONDITIONAL') {
    // Check if conditional release allows this use
    const canUse = await checkConditionalUse(inventory, jobId);
    if (!canUse) {
      throw new Error('Conditional release does not permit this use');
    }
    
    // Log conditional usage
    await logConditionalUsage(inventory.id, jobId, quantity);
  }
  
  // Normal issue process
  await performMaterialIssue(inventoryId, jobId, quantity);
}
```

**Defect Discovered in Production:**
```typescript
async function handleProductionDefect(
  jobId: string,
  defectDetails: DefectReport
) {
  // Check if this could be supplier-related
  const materialSource = await traceMaterialToSupplier(
    jobId,
    defectDetails.materialId
  );
  
  if (materialSource.isSupplierMaterial) {
    // Create or link to supplier nonconformance
    const snc = await findOrCreateSNC({
      supplierId: materialSource.supplierId,
      heatNumber: materialSource.heatNumber,
      issueType: defectDetails.defectType,
      description: defectDetails.description,
      linkedJobId: jobId
    });
    
    // Link internal NCR to supplier SNC
    await linkNCRToSNC(defectDetails.ncrId, snc.id);
  }
}
```

### Customer Quality Integration

**Linking Customer Claims to Suppliers:**
```typescript
async function linkClaimToSupplier(
  claimId: string,
  supplierAnalysis: SupplierAnalysis
) {
  const claim = await getCustomerClaim(claimId);
  
  // Find or create supplier nonconformance
  const snc = await findOrCreateSNC({
    supplierId: supplierAnalysis.supplierId,
    heatNumber: supplierAnalysis.heatNumber,
    issueType: 'CUSTOMER_CLAIM_TRACE',
    description: `Customer claim ${claim.claimNumber}: ${claim.issueDescription}`,
    customerClaimId: claimId,
    severity: claim.severity
  });
  
  // Link the claim
  await linkClaimToSNC(claimId, snc.id);
  
  // Update claim with supplier info
  await updateClaim(claimId, {
    supplierRelated: true,
    supplierId: supplierAnalysis.supplierId,
    supplierSncId: snc.id
  });
  
  // Update SNC with customer claim count
  await incrementSNCCustomerClaimCount(snc.id);
}
```

### Finance Integration

**Chargeback Processing:**
```typescript
async function processChargeback(
  sncId: string,
  chargebackDetails: ChargebackRequest
) {
  const snc = await getSNC(sncId);
  
  // Calculate total cost
  const totalCost = 
    chargebackDetails.materialCost +
    chargebackDetails.laborCost +
    chargebackDetails.otherCost;
  
  // Create debit memo request
  const debitMemo = await createDebitMemo({
    supplierId: snc.supplierId,
    sncId: sncId,
    amount: totalCost,
    reason: `SNC ${snc.sncNumber}: ${snc.description}`,
    supportingDocs: chargebackDetails.documents
  });
  
  // Update SNC
  await updateSNC(sncId, {
    chargebackAmount: totalCost,
    chargebackStatus: 'SUBMITTED',
    debitMemoId: debitMemo.id
  });
  
  // Notify AP
  await notifyAccountsPayable({
    type: 'SUPPLIER_CHARGEBACK',
    debitMemoId: debitMemo.id,
    supplierId: snc.supplierId,
    amount: totalCost
  });
}
```

---

## G) UI/UX SPECIFICATIONS

### Receiving Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INBOUND RECEIVING DASHBOARD                              [+ New Receipt]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TODAY'S RECEIPTS                    PENDING INSPECTION                     │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │  Scheduled: 8                │    │  Awaiting: 12 items              │  │
│  │  Received:  5                │    │  Overdue:  2 items  ⚠️           │  │
│  │  In Process: 2               │    │  Oldest:   3 days ago            │  │
│  └──────────────────────────────┘    └──────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ACTIVE RECEIPTS                                          🔍 Filter     ││
│  ├──────────────────────────────────────────────────────────────────────────│
│  │ Receipt #    │ Supplier      │ PO#      │ Status          │ Actions    ││
│  ├──────────────┼───────────────┼──────────┼─────────────────┼────────────││
│  │ RCV-26-0142  │ Steel Dynamics│ PO-5523  │ 🟡 Inspecting   │ [View]     ││
│  │ RCV-26-0141  │ Nucor         │ PO-5519  │ 🔴 Pending      │ [Inspect]  ││
│  │ RCV-26-0140  │ ArcelorMittal │ PO-5518  │ 🟢 Accepted     │ [View]     ││
│  │ RCV-26-0139  │ Steel Dynamics│ PO-5517  │ 🔴 Issues       │ [Review]   ││
│  │ RCV-26-0138  │ SSAB          │ PO-5515  │ 🟢 Accepted     │ [View]     ││
│  └──────────────┴───────────────┴──────────┴─────────────────┴────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Inspection Entry Screen

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  IQC INSPECTION - RCV-26-0141                          [Save] [Complete]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Receipt Info                        Supplier Info                          │
│  ─────────────                       ─────────────                          │
│  PO: PO-5519                        Nucor Corporation                       │
│  BOL: 78234982                      Risk Level: MEDIUM 🟡                   │
│  Received: 2/4/2026 08:15           Quality Rating: 87 (B)                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ITEMS TO INSPECT (3)                                                    ││
│  ├─────────────────────────────────────────────────────────────────────────││
│  │                                                                          │
│  │ ┌───────────────────────────────────────────────────────────────────┐   ││
│  │ │ Item 1: HR Coil A36 0.250" x 48"                        [▼ Expand]│   ││
│  │ │ Heat: H-2026-5523 │ Qty: 45,000 lbs │ Status: 🟡 Inspecting      │   ││
│  │ └───────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          │
│  │   ┌─ CHECKPOINTS ─────────────────────────────────────────────────────┐ ││
│  │   │                                                                    │ ││
│  │   │ ☑️ Visual Inspection                           [✓ PASS]           │ ││
│  │   │   Notes: Minor scale, acceptable                                   │ ││
│  │   │                                                                    │ ││
│  │   │ ☑️ Thickness Measurement                                          │ ││
│  │   │   Nominal: 0.2500"  Tol: +0.010/-0.005                            │ ││
│  │   │   Measured: [0.2523"] [0.2518"] [0.2525"]     [✓ PASS]            │ ││
│  │   │                                                                    │ ││
│  │   │ ☑️ Width Measurement                                              │ ││
│  │   │   Nominal: 48.000"  Tol: ±0.125                                   │ ││
│  │   │   Measured: [48.063"]                         [✓ PASS]            │ ││
│  │   │                                                                    │ ││
│  │   │ ☐ MTR Verification                                                │ ││
│  │   │   [Upload MTR]  Heat matches: [  ]  Chemistry OK: [  ]            │ ││
│  │   │                                                                    │ ││
│  │   └────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                          │
│  │ ┌───────────────────────────────────────────────────────────────────┐   ││
│  │ │ Item 2: HR Coil A36 0.187" x 60"                        [▶ Expand]│   ││
│  │ │ Heat: H-2026-5524 │ Qty: 38,000 lbs │ Status: ⬜ Pending          │   ││
│  │ └───────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          │
│  │ ┌───────────────────────────────────────────────────────────────────┐   ││
│  │ │ Item 3: HR Coil A36 0.250" x 48"                        [▶ Expand]│   ││
│  │ │ Heat: H-2026-5525 │ Qty: 42,000 lbs │ Status: ⬜ Pending          │   ││
│  │ └───────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          │
│  └──────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### SNC Entry Form

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEW SUPPLIER NONCONFORMANCE                            [Cancel] [Create]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Supplier *                          Issue Type *                           │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐      │
│  │ Nucor Corporation        ▼  │    │ Dimension Out of Spec     ▼  │      │
│  └──────────────────────────────┘    └──────────────────────────────┘      │
│                                                                             │
│  Linked Receipt (Optional)           Severity *                             │
│  ┌──────────────────────────────┐    ○ Critical (Safety/Major Impact)      │
│  │ RCV-26-0141              ▼  │    ● Major (Significant Impact)           │
│  └──────────────────────────────┘    ○ Minor (Limited Impact)              │
│                                                                             │
│  Heat/Lot Number                     PO Reference                           │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐      │
│  │ H-2026-5523                  │    │ PO-5519                      │      │
│  └──────────────────────────────┘    └──────────────────────────────┘      │
│                                                                             │
│  Description of Issue *                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Coil thickness exceeded maximum tolerance. Measured 0.268" in       │  │
│  │ multiple locations vs. nominal 0.250" +0.010. This caused feed      │  │
│  │ issues in our slitting line and required line stoppage.             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Quantity Affected                   Estimated Cost Impact                  │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐      │
│  │ 45,000               lbs ▼  │    │ $2,500.00                    │      │
│  └──────────────────────────────┘    └──────────────────────────────┘      │
│                                                                             │
│  Attachments                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [+ Add Photo]  [+ Add Document]                                      │  │
│  │                                                                      │  │
│  │ 📎 thickness_measurement.jpg  (245 KB)  [×]                         │  │
│  │ 📎 coil_edge_photo.jpg  (189 KB)  [×]                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ☐ Immediately notify supplier via email                                   │
│  ☐ Create SCAR request                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Supplier Scorecard View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPPLIER SCORECARD - Nucor Corporation                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Period: January 2026                 Status: APPROVED 🟢                   │
│  Rating: B (87)                       Risk Level: MEDIUM                    │
│  Trend: ▲ Improving (+3 from prior)   Volume: $485,000                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  SCORE BREAKDOWN                                                        ││
│  │                                                                          ││
│  │  Quality (50%)         [████████████████████░░░░] 85/100                ││
│  │  Delivery (25%)        [██████████████████████░░] 92/100                ││
│  │  Responsiveness (15%)  [██████████████████████░░] 88/100                ││
│  │  Documentation (10%)   [████████████████████████] 95/100                ││
│  │                        ─────────────────────────────────                 ││
│  │  Overall               [█████████████████████░░░] 87/100  GRADE B       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  12-MONTH TREND                                                         ││
│  │                                                                          ││
│  │  100┤                                                                    ││
│  │   90┤    ●───●                   ●───●───●                              ││
│  │   80┤●───●       ●───●───●───●───●                                      ││
│  │   70┤                                                                    ││
│  │   60┤                                                                    ││
│  │     └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────        ││
│  │          F    M    A    M    J    J    A    S    O    N    D    J        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │ RECEIPTS           │ │ QUALITY            │ │ OPEN ISSUES          │   │
│  │ ─────────          │ │ ───────            │ │ ───────────          │   │
│  │ Total: 12          │ │ Defect Rate: 1.8%  │ │ SNCs Open: 1         │   │
│  │ On-Time: 11 (92%)  │ │ SNCs: 2            │ │ SCARs Open: 0        │   │
│  │ Late: 1            │ │ Critical: 0        │ │ Chargebacks: $0      │   │
│  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘   │
│                                                                             │
│  [View History] [View SNCs] [View SCARs] [Export Report] [Send to Supplier]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## H) API SPECIFICATION

### Receiving APIs

```typescript
// ============================================================================
// INBOUND RECEIPT ENDPOINTS
// ============================================================================

/**
 * Create new inbound receipt
 * POST /api/sqm/receipts
 */
interface CreateReceiptRequest {
  supplierId: string;
  purchaseOrderId?: string;
  supplierPackingSlip?: string;
  locationId: string;
  carrierName?: string;
  bolNumber?: string;
  trailerNumber?: string;
  sealNumber?: string;
  sealIntact?: boolean;
  conditionOnArrival?: string;
  arrivalNotes?: string;
  items: CreateReceiptItemRequest[];
}

interface CreateReceiptItemRequest {
  productId?: string;
  gradeId?: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  uom: string;
  heatNumber?: string;
  lotNumber?: string;
  coilNumber?: string;
  thickness?: number;
  width?: number;
  length?: number;
}

/**
 * Get receipt by ID
 * GET /api/sqm/receipts/:id
 */
interface ReceiptResponse {
  id: string;
  receiptNumber: string;
  supplier: SupplierSummary;
  purchaseOrder?: POSummary;
  receivedAt: string;
  receivedBy: UserSummary;
  qualityStatus: ReceiptQualityStatus;
  items: ReceiptItemResponse[];
  inspections: InspectionSummary[];
  documents: DocumentSummary[];
}

/**
 * List receipts with filtering
 * GET /api/sqm/receipts
 */
interface ListReceiptsQuery {
  supplierId?: string;
  qualityStatus?: ReceiptQualityStatus | ReceiptQualityStatus[];
  receivedFrom?: string;
  receivedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get pending inspection items
 * GET /api/sqm/inspections/pending
 */
interface PendingInspectionResponse {
  items: PendingInspectionItem[];
  totalCount: number;
  overdueCount: number;
}

// ============================================================================
// INSPECTION ENDPOINTS
// ============================================================================

/**
 * Create inspection record
 * POST /api/sqm/inspections
 */
interface CreateInspectionRequest {
  receiptId: string;
  planId?: string;
  itemIds: string[];
}

/**
 * Record checkpoint result
 * POST /api/sqm/inspections/:id/checkpoints
 */
interface RecordCheckpointRequest {
  checkpointId?: string;
  receiptItemId?: string;
  checkpointName: string;
  checkpointType: CheckpointType;
  result: CheckResult;
  measuredValue?: number;
  nominalValue?: number;
  tolerancePlus?: number;
  toleranceMinus?: number;
  passFailResult?: boolean;
  notes?: string;
}

/**
 * Complete inspection
 * POST /api/sqm/inspections/:id/complete
 */
interface CompleteInspectionRequest {
  overallResult: InspectionResult;
  notes?: string;
}

/**
 * Disposition receipt items
 * POST /api/sqm/inspections/:id/disposition
 */
interface DispositionRequest {
  itemDispositions: ItemDisposition[];
  notes?: string;
}

interface ItemDisposition {
  receiptItemId: string;
  disposition: InspectionDisposition;
  storageLocationId?: string;
  conditionalReason?: string;
  conditionalExpiry?: string;
}

// ============================================================================
// SUPPLIER NONCONFORMANCE ENDPOINTS
// ============================================================================

/**
 * Create SNC
 * POST /api/sqm/sncs
 */
interface CreateSNCRequest {
  supplierId: string;
  receiptItemId?: string;
  inspectionId?: string;
  heatNumber?: string;
  lotNumber?: string;
  purchaseOrderId?: string;
  issueType: SupplierIssueType;
  severity: SeverityLevel;
  description: string;
  defectCode?: string;
  quantityAffected?: number;
  uom?: string;
  notifySupplier?: boolean;
  createScar?: boolean;
}

/**
 * Get SNC by ID
 * GET /api/sqm/sncs/:id
 */
interface SNCResponse {
  id: string;
  sncNumber: string;
  supplier: SupplierSummary;
  receiptItem?: ReceiptItemSummary;
  issueType: SupplierIssueType;
  severity: SeverityLevel;
  description: string;
  status: SNCStatus;
  owner: UserSummary;
  supplierNotifiedAt?: string;
  supplierResponse?: string;
  costs: SNCCosts;
  scars: SCARSummary[];
  linkedNCRs: NCRSummary[];
  linkedClaims: ClaimSummary[];
  communications: CommunicationSummary[];
  attachments: AttachmentSummary[];
  createdAt: string;
  updatedAt: string;
}

/**
 * List SNCs with filtering
 * GET /api/sqm/sncs
 */
interface ListSNCsQuery {
  supplierId?: string;
  status?: SNCStatus | SNCStatus[];
  severity?: SeverityLevel | SeverityLevel[];
  issueType?: SupplierIssueType[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/**
 * Notify supplier
 * POST /api/sqm/sncs/:id/notify
 */
interface NotifySupplierRequest {
  method: 'EMAIL' | 'PORTAL' | 'PHONE';
  contactEmail?: string;
  responseDueDays?: number;
  message?: string;
}

/**
 * Record supplier response
 * POST /api/sqm/sncs/:id/response
 */
interface RecordResponseRequest {
  response: string;
  acceptsResponsibility?: boolean;
}

/**
 * Request chargeback
 * POST /api/sqm/sncs/:id/chargeback
 */
interface ChargebackRequest {
  materialCost: number;
  laborCost: number;
  otherCost: number;
  documents: string[];
  notes?: string;
}

/**
 * Close SNC
 * POST /api/sqm/sncs/:id/close
 */
interface CloseSNCRequest {
  closureNotes: string;
}

// ============================================================================
// SCAR ENDPOINTS
// ============================================================================

/**
 * Create SCAR
 * POST /api/sqm/scars
 */
interface CreateSCARRequest {
  supplierId: string;
  sncId?: string;
  issueDescription: string;
  impactDescription?: string;
  responseDueDays: number;
}

/**
 * Record supplier SCAR response
 * POST /api/sqm/scars/:id/response
 */
interface SCARResponseRequest {
  rootCause: string;
  rootCauseCategory: RootCauseCategory;
  containmentActions: string;
  correctiveActions: string;
  preventiveActions?: string;
}

/**
 * Review SCAR response
 * POST /api/sqm/scars/:id/review
 */
interface SCARReviewRequest {
  accepted: boolean;
  reviewNotes: string;
  verificationRequired?: boolean;
  verificationMethod?: string;
}

/**
 * Record verification
 * POST /api/sqm/scars/:id/verify
 */
interface SCARVerificationRequest {
  effectivenessConfirmed: boolean;
  verificationNotes: string;
}

// ============================================================================
// SUPPLIER ENDPOINTS
// ============================================================================

/**
 * Get supplier quality profile
 * GET /api/sqm/suppliers/:id/quality-profile
 */
interface SupplierQualityProfileResponse {
  supplier: SupplierDetails;
  latestScorecard: ScorecardSummary;
  scorecardHistory: ScorecardTrend[];
  openSNCs: number;
  openSCARs: number;
  recentIssues: SNCBrief[];
  inspectionPlan?: InspectionPlanSummary;
}

/**
 * Get supplier scorecard
 * GET /api/sqm/suppliers/:id/scorecards
 */
interface ListScorecardsQuery {
  periodType?: ScorecardPeriod;
  from?: string;
  to?: string;
}

/**
 * Generate scorecard
 * POST /api/sqm/suppliers/:id/scorecards/generate
 */
interface GenerateScorecardRequest {
  periodType: ScorecardPeriod;
  periodStart: string;
  periodEnd: string;
}

/**
 * Update supplier approval status
 * PUT /api/sqm/suppliers/:id/approval
 */
interface UpdateApprovalRequest {
  approvalStatus: SupplierApprovalStatus;
  riskLevel?: SupplierRiskLevel;
  notes?: string;
}

// ============================================================================
// INSPECTION PLAN ENDPOINTS
// ============================================================================

/**
 * List inspection plans
 * GET /api/sqm/inspection-plans
 */

/**
 * Create inspection plan
 * POST /api/sqm/inspection-plans
 */
interface CreateInspectionPlanRequest {
  planCode: string;
  name: string;
  description?: string;
  appliesToGradeId?: string;
  appliesToSupplierId?: string;
  appliesToRiskLevel?: SupplierRiskLevel;
  requiresVisual: boolean;
  requiresDimensional: boolean;
  requiresDocReview: boolean;
  requiresChemistry: boolean;
  requiresMechanical: boolean;
  samplingType: SamplingType;
  samplingLevel?: string;
  aqlLevel?: number;
  sampleSize?: number;
  skipInspectionAfter?: number;
  checkpoints: CheckpointRequest[];
}

interface CheckpointRequest {
  sequence: number;
  name: string;
  description?: string;
  checkpointType: CheckpointType;
  measurementUnit?: string;
  nominalValue?: number;
  tolerancePlus?: number;
  toleranceMinus?: number;
  passCriteria?: string;
  required: boolean;
  criticalToQuality: boolean;
}

// ============================================================================
// DOCUMENT ENDPOINTS
// ============================================================================

/**
 * Upload document to receipt
 * POST /api/sqm/receipts/:id/documents
 * Content-Type: multipart/form-data
 */
interface UploadReceiptDocumentRequest {
  file: File;
  documentType: ReceiptDocType;
  heatNumber?: string;
}

/**
 * Verify MTR
 * POST /api/sqm/receipts/:receiptId/documents/:docId/verify
 */
interface VerifyMTRRequest {
  verified: boolean;
  notes?: string;
}

// ============================================================================
// DASHBOARD & ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get SQM dashboard
 * GET /api/sqm/dashboard
 */
interface SQMDashboardResponse {
  todayReceipts: {
    scheduled: number;
    received: number;
    inProcess: number;
  };
  pendingInspection: {
    total: number;
    overdue: number;
    oldestDays: number;
  };
  openIssues: {
    sncsOpen: number;
    scarsOpen: number;
    scarsOverdue: number;
  };
  supplierRatings: {
    aPlus: number;
    a: number;
    b: number;
    c: number;
    dAndBelow: number;
  };
  recentActivity: ActivityItem[];
}

/**
 * Get supplier quality metrics
 * GET /api/sqm/analytics/supplier-metrics
 */
interface SupplierMetricsQuery {
  dateFrom: string;
  dateTo: string;
  supplierId?: string;
  groupBy?: 'supplier' | 'grade' | 'issueType';
}
```

---

## I) REPORTING & ANALYTICS

### Standard Reports

#### 1. Receiving Activity Report

**Purpose:** Track daily/weekly receiving operations

**Metrics:**
- Receipts by day
- Quantity received (weight, pieces)
- On-time vs. late deliveries
- Receipts pending inspection
- Average inspection time

**Filters:**
- Date range
- Supplier
- Location

#### 2. Supplier Quality Summary

**Purpose:** Monthly/quarterly supplier performance overview

**Content:**
- List of all suppliers with volume
- Quality score and trend
- Number of issues by severity
- SCAR status summary
- Rating changes

**Format:** PDF for management review, email to purchasing

#### 3. Incoming Quality Trending

**Purpose:** Track defect rates over time

**Charts:**
- Defect rate trend (line chart)
- Issues by type (pareto chart)
- Issues by supplier (bar chart)
- First-pass acceptance rate

**Drill-down:** Click on data points to see specific SNCs

#### 4. SCAR Status Report

**Purpose:** Track open corrective actions

**Sections:**
- Open SCARs with aging
- Overdue responses
- Recently closed
- Effectiveness verification due

**Alerts:** Highlight overdue items

#### 5. Cost of Poor Supplier Quality (COPSQ)

**Purpose:** Financial impact of supplier issues

**Metrics:**
- Total SNC costs by period
- Breakdown: material, labor, other
- Chargeback recovery rate
- Downstream impact (internal NCRs, customer claims)
- Trend vs. prior periods

#### 6. Supplier Scorecard Report

**Purpose:** Detailed scorecard for specific supplier

**Sections:**
- Overall score and trend
- Category breakdown
- Issue history
- SCAR history
- Recommendations

**Distribution:** Auto-email to supplier contacts

### Analytics Dashboards

#### Quality Manager Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPPLIER QUALITY MANAGER DASHBOARD                    Feb 2026            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── KEY METRICS ──────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Incoming       Defect         Open          Open           COPSQ    │  │
│  │  Acceptance     Rate           SNCs          SCARs          MTD      │  │
│  │  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐ │  │
│  │  │ 94.2%  │    │ 1.3%   │    │   8    │    │   3    │    │ $12.5K │ │  │
│  │  │  ▲2.1% │    │  ▼0.4% │    │  ▼3    │    │  ──    │    │  ▲$2K  │ │  │
│  │  └────────┘    └────────┘    └────────┘    └────────┘    └────────┘ │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── DEFECT TREND ─────────────────┐ ┌─── TOP ISSUES ────────────────────┐│
│  │                                   │ │                                   ││
│  │  3%┤                              │ │  Dimension          ████████ 32% ││
│  │    │     ●                        │ │  Surface            ██████ 24%   ││
│  │  2%┤    ╱ ╲    ╱╲                │ │  Documentation      ████ 18%     ││
│  │    │   ╱   ╲  ╱  ╲               │ │  Late Delivery      ███ 14%      ││
│  │  1%┤──●     ●●    ●──            │ │  Chemistry          ██ 8%        ││
│  │    └──┬──┬──┬──┬──┬──             │ │  Other              █ 4%         ││
│  │       O  N  D  J  F               │ │                                   ││
│  └───────────────────────────────────┘ └───────────────────────────────────┘│
│                                                                             │
│  ┌─── SUPPLIER RATINGS ─────────────┐ ┌─── ACTION ITEMS ──────────────────┐│
│  │                                   │ │                                   ││
│  │  Rating   Count   Trend           │ │ ⚠️ 2 SCARs overdue for response  ││
│  │  A+/A     12      ▲ +2            │ │ ⚠️ 5 SNCs pending disposition    ││
│  │  B        8       ── 0            │ │ 📋 3 receipts awaiting inspection ││
│  │  C        4       ▼ -1            │ │ 📊 Q1 scorecard review due        ││
│  │  D/F      2       ▼ -1            │ │ 📧 Supplier XYZ on probation      ││
│  │                                   │ │                                   ││
│  └───────────────────────────────────┘ └───────────────────────────────────┘│
│                                                                             │
│  [View Receipts] [View SNCs] [View SCARs] [Supplier List] [Run Reports]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### KPI Definitions

| KPI | Formula | Target | Frequency |
|-----|---------|--------|-----------|
| **Incoming Acceptance Rate** | Accepted ÷ Total Inspected × 100 | ≥95% | Weekly |
| **Supplier Defect Rate** | Defective Qty ÷ Total Received × 100 | ≤2% | Monthly |
| **Average Inspection Time** | Sum(Completion - Start) ÷ Count | ≤24 hrs | Weekly |
| **SCAR Response Time** | Days from Issue to Response | ≤5 days (major) | Monthly |
| **SCAR Closure Rate** | Closed ÷ Issued × 100 | ≥80% in 30 days | Monthly |
| **Chargeback Recovery** | Recovered ÷ Claimed × 100 | ≥75% | Quarterly |
| **First-Pass Accept Rate** | Passed First Inspection ÷ Total × 100 | ≥90% | Monthly |

---

## J) TESTING SPECIFICATIONS

### Unit Tests

```typescript
// ============================================================================
// INSPECTION LOGIC TESTS
// ============================================================================

describe('InspectionPlanService', () => {
  describe('getApplicablePlan', () => {
    it('should return supplier-specific plan when exists', async () => {
      const result = await inspectionPlanService.getApplicablePlan({
        supplierId: 'supplier-123',
        gradeId: 'grade-456',
        riskLevel: SupplierRiskLevel.MEDIUM
      });
      expect(result.planCode).toBe('IQC-PLAN-SUP-123');
    });

    it('should fall back to grade-specific plan', async () => {
      const result = await inspectionPlanService.getApplicablePlan({
        supplierId: 'unknown-supplier',
        gradeId: 'grade-456',
        riskLevel: SupplierRiskLevel.MEDIUM
      });
      expect(result.planCode).toBe('IQC-PLAN-GRADE-456');
    });

    it('should use risk-based default when no specific plan', async () => {
      const result = await inspectionPlanService.getApplicablePlan({
        supplierId: 'unknown-supplier',
        gradeId: 'unknown-grade',
        riskLevel: SupplierRiskLevel.HIGH
      });
      expect(result.planCode).toBe('IQC-PLAN-HIGH-RISK');
    });
  });

  describe('determineInspectionRequirement', () => {
    it('should skip inspection for LOW risk supplier with consecutive passes', async () => {
      const supplier = mockSupplier({ riskLevel: 'LOW', consecutivePasses: 10 });
      const result = await inspectionPlanService.determineInspectionRequirement(supplier);
      expect(result.skipInspection).toBe(true);
    });

    it('should require 100% inspection for CRITICAL risk', async () => {
      const supplier = mockSupplier({ riskLevel: 'CRITICAL' });
      const result = await inspectionPlanService.determineInspectionRequirement(supplier);
      expect(result.skipInspection).toBe(false);
      expect(result.samplingType).toBe('FULL');
    });

    it('should require inspection after recent SNC', async () => {
      const supplier = mockSupplier({ 
        riskLevel: 'LOW', 
        consecutivePasses: 10,
        recentSNC: true 
      });
      const result = await inspectionPlanService.determineInspectionRequirement(supplier);
      expect(result.skipInspection).toBe(false);
    });
  });
});

// ============================================================================
// SCORECARD CALCULATION TESTS
// ============================================================================

describe('ScorecardService', () => {
  describe('calculateQualityScore', () => {
    it('should start at 100 with no issues', () => {
      const score = scorecardService.calculateQualityScore({
        defectRate: 0,
        sncCriticalCount: 0,
        sncMajorCount: 0,
        sncMinorCount: 0,
        customerClaimCount: 0
      });
      expect(score).toBe(100);
    });

    it('should deduct for defect rate', () => {
      const score = scorecardService.calculateQualityScore({
        defectRate: 0.02, // 2%
        sncCriticalCount: 0,
        sncMajorCount: 0,
        sncMinorCount: 0,
        customerClaimCount: 0
      });
      expect(score).toBe(80); // 100 - (0.02 * 1000)
    });

    it('should deduct heavily for critical SNCs', () => {
      const score = scorecardService.calculateQualityScore({
        defectRate: 0,
        sncCriticalCount: 1,
        sncMajorCount: 0,
        sncMinorCount: 0,
        customerClaimCount: 0
      });
      expect(score).toBe(85); // 100 - 15
    });

    it('should not go below 0', () => {
      const score = scorecardService.calculateQualityScore({
        defectRate: 0.1,
        sncCriticalCount: 5,
        sncMajorCount: 10,
        sncMinorCount: 20,
        customerClaimCount: 10
      });
      expect(score).toBe(0);
    });
  });

  describe('calculateOverallScore', () => {
    it('should apply correct weights', () => {
      const score = scorecardService.calculateOverallScore({
        qualityScore: 100,
        deliveryScore: 100,
        responsivenessScore: 100,
        documentationScore: 100
      });
      expect(score).toBe(100);
    });

    it('should weight quality at 50%', () => {
      const score = scorecardService.calculateOverallScore({
        qualityScore: 0,
        deliveryScore: 100,
        responsivenessScore: 100,
        documentationScore: 100
      });
      expect(score).toBe(50); // 25 + 15 + 10
    });
  });

  describe('determineRating', () => {
    it('should assign A+ for 95+', () => {
      expect(scorecardService.determineRating(95)).toBe('A_PLUS');
      expect(scorecardService.determineRating(100)).toBe('A_PLUS');
    });

    it('should assign F for below 60', () => {
      expect(scorecardService.determineRating(59)).toBe('F');
      expect(scorecardService.determineRating(0)).toBe('F');
    });
  });
});

// ============================================================================
// SNC WORKFLOW TESTS
// ============================================================================

describe('SNCService', () => {
  describe('create', () => {
    it('should generate SNC number', async () => {
      const snc = await sncService.create({
        supplierId: 'supplier-123',
        issueType: 'DIMENSION_OUT_OF_SPEC',
        severity: 'MAJOR',
        description: 'Test issue'
      });
      expect(snc.sncNumber).toMatch(/^SNC-\d{4}-\d{6}$/);
    });

    it('should set status to OPEN', async () => {
      const snc = await sncService.create(validSNCData);
      expect(snc.status).toBe('OPEN');
    });

    it('should link to receipt item when provided', async () => {
      const snc = await sncService.create({
        ...validSNCData,
        receiptItemId: 'item-456'
      });
      expect(snc.receiptItemId).toBe('item-456');
    });
  });

  describe('notifySupplier', () => {
    it('should update status to SUPPLIER_NOTIFIED', async () => {
      await sncService.notifySupplier('snc-123', {
        method: 'EMAIL',
        contactEmail: 'supplier@example.com'
      });
      const snc = await sncService.getById('snc-123');
      expect(snc.status).toBe('SUPPLIER_NOTIFIED');
    });

    it('should set response due date', async () => {
      await sncService.notifySupplier('snc-123', {
        method: 'EMAIL',
        responseDueDays: 10
      });
      const snc = await sncService.getById('snc-123');
      expect(snc.responseDueDate).toBeDefined();
    });
  });
});
```

### Integration Tests

```typescript
describe('Receiving to Inspection Flow', () => {
  it('should create inspection record for MEDIUM risk supplier', async () => {
    // Create receipt
    const receipt = await createReceipt({
      supplierId: mediumRiskSupplier.id,
      items: [validReceiptItem]
    });

    // Verify inspection created
    const inspections = await getInspectionsByReceipt(receipt.id);
    expect(inspections).toHaveLength(1);
    expect(inspections[0].status).toBe('PENDING');
  });

  it('should skip inspection for LOW risk supplier with good history', async () => {
    const receipt = await createReceipt({
      supplierId: lowRiskSupplierWithGoodHistory.id,
      items: [validReceiptItem]
    });

    const inspections = await getInspectionsByReceipt(receipt.id);
    expect(inspections).toHaveLength(0);
    expect(receipt.qualityStatus).toBe('ACCEPTED');
  });

  it('should release to inventory on inspection pass', async () => {
    const receipt = await createReceipt({
      supplierId: mediumRiskSupplier.id,
      items: [validReceiptItem]
    });

    // Complete inspection with PASS
    await completeInspection(receipt.inspections[0].id, {
      overallResult: 'PASS',
      itemDispositions: [
        { receiptItemId: receipt.items[0].id, disposition: 'ACCEPT' }
      ]
    });

    // Verify inventory created
    const inventory = await getInventoryByHeat(validReceiptItem.heatNumber);
    expect(inventory).toBeDefined();
    expect(inventory.status).toBe('AVAILABLE');
  });

  it('should quarantine on inspection fail', async () => {
    const receipt = await createReceipt({
      supplierId: mediumRiskSupplier.id,
      items: [validReceiptItem]
    });

    await completeInspection(receipt.inspections[0].id, {
      overallResult: 'FAIL',
      itemDispositions: [
        { receiptItemId: receipt.items[0].id, disposition: 'REJECT' }
      ]
    });

    const inventory = await getInventoryByHeat(validReceiptItem.heatNumber);
    expect(inventory.status).toBe('QUARANTINE');
  });
});

describe('SNC to SCAR Flow', () => {
  it('should allow SCAR creation from SNC', async () => {
    const snc = await createSNC({
      supplierId: 'supplier-123',
      severity: 'MAJOR',
      issueType: 'DIMENSION_OUT_OF_SPEC',
      description: 'Test'
    });

    const scar = await createSCAR({
      sncId: snc.id,
      supplierId: snc.supplierId,
      issueDescription: snc.description,
      responseDueDays: 5
    });

    expect(scar.sncId).toBe(snc.id);

    const updatedSNC = await getSNC(snc.id);
    expect(updatedSNC.status).toBe('SCAR_ISSUED');
  });
});

describe('Scorecard Generation', () => {
  it('should calculate correct metrics for period', async () => {
    // Setup: Create test data for supplier
    await createTestReceipts(supplierId, 10);
    await createTestSNCs(supplierId, { critical: 1, major: 2, minor: 3 });
    await createTestSCARs(supplierId, 2);

    // Generate scorecard
    const scorecard = await generateScorecard({
      supplierId,
      periodType: 'MONTHLY',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31'
    });

    expect(scorecard.totalReceipts).toBe(10);
    expect(scorecard.sncCriticalCount).toBe(1);
    expect(scorecard.sncMajorCount).toBe(2);
    expect(scorecard.sncMinorCount).toBe(3);
  });
});
```

### E2E Tests

```typescript
describe('Receiving Workflow E2E', () => {
  it('should complete full receiving to inventory flow', async () => {
    // 1. Create receipt via API
    const receipt = await api.post('/sqm/receipts', {
      supplierId: 'supplier-123',
      purchaseOrderId: 'po-456',
      items: [{
        description: 'HR Coil A36',
        receivedQty: 45000,
        uom: 'LB',
        heatNumber: 'H-2026-TEST'
      }]
    });
    expect(receipt.status).toBe(201);

    // 2. Verify inspection is pending
    const pendingInspections = await api.get('/sqm/inspections/pending');
    expect(pendingInspections.body.items).toContainEqual(
      expect.objectContaining({ receiptId: receipt.body.id })
    );

    // 3. Start inspection
    const inspection = await api.post('/sqm/inspections', {
      receiptId: receipt.body.id
    });

    // 4. Record checkpoint results
    await api.post(`/sqm/inspections/${inspection.body.id}/checkpoints`, {
      checkpointName: 'Visual',
      checkpointType: 'VISUAL',
      result: 'PASS'
    });

    // 5. Complete inspection
    await api.post(`/sqm/inspections/${inspection.body.id}/complete`, {
      overallResult: 'PASS'
    });

    // 6. Disposition
    await api.post(`/sqm/inspections/${inspection.body.id}/disposition`, {
      itemDispositions: [{
        receiptItemId: receipt.body.items[0].id,
        disposition: 'ACCEPT',
        storageLocationId: 'loc-789'
      }]
    });

    // 7. Verify inventory created
    const inventory = await api.get('/inventory', {
      params: { heatNumber: 'H-2026-TEST' }
    });
    expect(inventory.body).toHaveLength(1);
    expect(inventory.body[0].status).toBe('AVAILABLE');
  });
});
```

---

## K) ROLLOUT PLAN

### Phase 1: Foundation (Weeks 1-4)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 1 | Data model implementation | Backend |
| 1 | Supplier import from existing system | Backend |
| 2 | Receiving API endpoints | Backend |
| 2 | Basic receiving UI | Frontend |
| 3 | Inspection API endpoints | Backend |
| 3 | Inspection entry UI | Frontend |
| 4 | Integration testing | QA |
| 4 | Training material | Training |

**Go-Live Criteria:**
- Can create receipts
- Can perform basic inspections
- Can accept/reject material

### Phase 2: Nonconformance (Weeks 5-8)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 5 | SNC data model and APIs | Backend |
| 5 | SNC entry UI | Frontend |
| 6 | Email notification integration | Backend |
| 6 | SCAR-Lite workflow | Backend |
| 7 | Full SCAR workflow | Backend |
| 7 | SCAR management UI | Frontend |
| 8 | Integration testing | QA |
| 8 | Pilot with one receiving location | Operations |

**Go-Live Criteria:**
- Can create and track SNCs
- Email notifications working
- SCAR workflow functional

### Phase 3: Scorecards & Analytics (Weeks 9-12)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 9 | Scorecard calculation engine | Backend |
| 9 | Scorecard generation APIs | Backend |
| 10 | Scorecard UI | Frontend |
| 10 | Dashboard widgets | Frontend |
| 11 | Report generation | Backend |
| 11 | Export functionality | Backend |
| 12 | Full system testing | QA |
| 12 | Full rollout preparation | Operations |

**Go-Live Criteria:**
- Scorecards generating correctly
- Dashboards displaying metrics
- Reports exportable

### Phase 4: Advanced Features (Weeks 13-16)

| Week | Deliverable | Owner |
|------|-------------|-------|
| 13 | Supplier portal integration | Backend |
| 13 | Portal UI for suppliers | Frontend |
| 14 | Integration with Customer Quality | Backend |
| 14 | Chargeback automation | Backend |
| 15 | AI-powered issue detection | Data Science |
| 15 | Predictive supplier risk | Data Science |
| 16 | Performance optimization | Backend |
| 16 | Full production deployment | DevOps |

### Training Plan

| Audience | Duration | Content |
|----------|----------|---------|
| **Receiving Staff** | 4 hours | Receipt creation, basic inspection, document upload |
| **Quality Inspectors** | 8 hours | Full inspection workflow, SNC creation, disposition |
| **Quality Managers** | 8 hours | SCAR management, scorecards, reporting, supplier review |
| **Purchasing** | 4 hours | Supplier status, scorecard review, risk awareness |
| **Finance (AP)** | 2 hours | Chargeback process, debit memo integration |

### Data Migration

**From Legacy Systems:**

| Data Type | Source | Migration Strategy |
|-----------|--------|-------------------|
| Suppliers | ERP Master Data | Full migration with mapping |
| Historical Receipts | Warehouse System | Last 2 years for history |
| Past NCRs | Quality Database | Structure mapping required |
| MTR Documents | File Server | Link migration, OCR indexing |

**Initial Scorecard Baseline:**
- All existing suppliers start at B rating
- First scorecard generated after 30 days of data collection
- Manual adjustment allowed during transition

---

## L) APPENDICES

### A1. Standard Defect Codes

| Code | Description | Severity Default | Category |
|------|-------------|------------------|----------|
| DIM-001 | Thickness out of tolerance | Major | Dimensional |
| DIM-002 | Width out of tolerance | Major | Dimensional |
| DIM-003 | Length out of tolerance | Minor | Dimensional |
| DIM-004 | Diameter out of tolerance | Major | Dimensional |
| DIM-005 | Flatness deviation | Minor | Dimensional |
| SUR-001 | Scratches | Minor | Surface |
| SUR-002 | Pits/Pitting | Major | Surface |
| SUR-003 | Scale (excessive) | Minor | Surface |
| SUR-004 | Rust/Corrosion | Major | Surface |
| SUR-005 | Coating defect | Major | Surface |
| SUR-006 | Dents/Dings | Minor | Surface |
| CHM-001 | Carbon out of spec | Critical | Chemistry |
| CHM-002 | Manganese out of spec | Major | Chemistry |
| CHM-003 | Sulfur/Phosphorus high | Critical | Chemistry |
| CHM-004 | Alloy element out of spec | Major | Chemistry |
| MEC-001 | Yield strength low | Critical | Mechanical |
| MEC-002 | Tensile strength low | Critical | Mechanical |
| MEC-003 | Elongation low | Major | Mechanical |
| MEC-004 | Hardness out of spec | Major | Mechanical |
| DOC-001 | MTR missing | Major | Documentation |
| DOC-002 | MTR incomplete | Minor | Documentation |
| DOC-003 | MTR incorrect heat | Critical | Documentation |
| DOC-004 | CoC missing | Minor | Documentation |
| PKG-001 | Packaging damaged | Minor | Packaging |
| PKG-002 | Material damaged in shipping | Major | Packaging |
| PKG-003 | Incorrect labeling | Minor | Packaging |
| SHP-001 | Wrong material shipped | Critical | Shipping |
| SHP-002 | Short shipment | Minor | Shipping |
| SHP-003 | Over shipment | Minor | Shipping |

### A2. Email Templates

#### Supplier Notification - New SNC

```
Subject: Supplier Quality Notice - {SNC_NUMBER} | {COMPANY_NAME}

Dear {SUPPLIER_CONTACT},

This notice is to inform you of a quality issue identified with a recent shipment.

ISSUE DETAILS
─────────────────────────────────
SNC Number: {SNC_NUMBER}
Receipt #: {RECEIPT_NUMBER}
PO #: {PO_NUMBER}
Material: {MATERIAL_DESCRIPTION}
Heat/Lot: {HEAT_NUMBER}
Quantity Affected: {QUANTITY} {UOM}

Issue Type: {ISSUE_TYPE}
Severity: {SEVERITY}

Description:
{DESCRIPTION}

REQUIRED ACTION
─────────────────────────────────
Please respond by: {DUE_DATE}

{IF_SCAR_LITE}
This is a SCAR-Lite notification. Please acknowledge the issue and provide 
a brief description of any corrective actions taken.

{IF_FULL_SCAR}
A formal Supplier Corrective Action Request (SCAR) has been issued. 
Please provide:
1. Root cause analysis
2. Containment actions taken
3. Corrective actions planned
4. Preventive measures

RESPOND
─────────────────────────────────
Reply to this email or log into our supplier portal:
{PORTAL_URL}

Thank you for your attention to this matter.

Regards,
{SENDER_NAME}
Quality Assurance
{COMPANY_NAME}
{PHONE}
```

#### SCAR Response Reminder

```
Subject: REMINDER: SCAR Response Due - {SCAR_NUMBER} | {COMPANY_NAME}

Dear {SUPPLIER_CONTACT},

This is a reminder that your response to SCAR {SCAR_NUMBER} is due in {DAYS_REMAINING} days.

Original Due Date: {DUE_DATE}

Issue Summary:
{ISSUE_SUMMARY}

Please submit your response via our supplier portal or by replying to this email.

If you need additional time, please contact us immediately.

Regards,
Quality Assurance
{COMPANY_NAME}
```

#### Monthly Scorecard Summary

```
Subject: Monthly Quality Scorecard - {MONTH} {YEAR} | {COMPANY_NAME}

Dear {SUPPLIER_CONTACT},

Please find below your quality performance scorecard for {MONTH} {YEAR}.

SCORECARD SUMMARY
─────────────────────────────────
Overall Rating: {RATING} ({SCORE}/100)
Previous Rating: {PREV_RATING} ({PREV_SCORE}/100)
Trend: {TREND}

CATEGORY BREAKDOWN
─────────────────────────────────
Quality (50%):       {QUALITY_SCORE}/100
Delivery (25%):      {DELIVERY_SCORE}/100
Responsiveness (15%): {RESPONSIVE_SCORE}/100
Documentation (10%):  {DOC_SCORE}/100

KEY METRICS
─────────────────────────────────
Receipts: {RECEIPT_COUNT}
Quantity: {QUANTITY} {UOM}
Defect Rate: {DEFECT_RATE}%
On-Time Delivery: {OTD_RATE}%
Open Issues: {OPEN_SNCS} SNCs, {OPEN_SCARS} SCARs

{IF_IMPROVEMENT_NEEDED}
IMPROVEMENT AREAS
─────────────────────────────────
Based on this period's performance, we recommend focusing on:
{IMPROVEMENT_RECOMMENDATIONS}

For questions about this scorecard, please contact:
{CONTACT_NAME}
{CONTACT_EMAIL}
{CONTACT_PHONE}

View full scorecard details in our supplier portal:
{PORTAL_URL}

Thank you for your continued partnership.

Regards,
Quality Assurance
{COMPANY_NAME}
```

### A3. AQL Sampling Tables Reference

**ANSI/ASQ Z1.4 - Single Sampling Plans for Normal Inspection (General Inspection Level II)**

| Lot Size | Sample Size Code | Sample Size | Accept | Reject |
|----------|------------------|-------------|--------|--------|
| 2-8 | A | 2 | 0 | 1 |
| 9-15 | B | 3 | 0 | 1 |
| 16-25 | C | 5 | 0 | 1 |
| 26-50 | D | 8 | 0 | 1 |
| 51-90 | E | 13 | 1 | 2 |
| 91-150 | F | 20 | 1 | 2 |
| 151-280 | G | 32 | 2 | 3 |
| 281-500 | H | 50 | 3 | 4 |
| 501-1200 | J | 80 | 5 | 6 |
| 1201-3200 | K | 125 | 7 | 8 |
| 3201-10000 | L | 200 | 10 | 11 |

*Accept = Number of defects allowed to accept lot*
*Reject = Number of defects requiring lot rejection*

### A4. Regulatory References

| Regulation | Relevance | Key Requirements |
|------------|-----------|------------------|
| **ISO 9001:2015** | Clause 8.4 | Control of externally provided processes |
| **IATF 16949** | Clause 8.4.2 | Supplier selection and monitoring |
| **AS9100** | Clause 8.4 | Aerospace supplier control |
| **ISO/TS 16949** | Multiple | Automotive supplier requirements |
| **FDA 21 CFR Part 820** | Subpart E | Purchasing controls (medical devices) |

### A5. Glossary

| Term | Definition |
|------|------------|
| **AQL** | Acceptable Quality Level - Maximum percent defective acceptable |
| **BOL** | Bill of Lading - Shipping document |
| **CoC** | Certificate of Conformance |
| **CoA** | Certificate of Analysis |
| **COPSQ** | Cost of Poor Supplier Quality |
| **IQC** | Inbound Quality Control |
| **MTR** | Mill Test Report |
| **NCR** | Nonconformance Report |
| **RTV** | Return to Vendor |
| **SCAR** | Supplier Corrective Action Request |
| **SNC** | Supplier Nonconformance |
| **SQM** | Supplier Quality Management |
| **8D** | Eight Disciplines problem-solving methodology |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Principal SQM/IQC Architect | Initial release |

---

*End of Document*
