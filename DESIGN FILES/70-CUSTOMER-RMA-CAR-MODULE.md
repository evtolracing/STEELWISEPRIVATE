# Customer Nonconformance & RMA/CAR Module
## SteelWise ERP - Principal Design Specification

**Version:** 1.0  
**Date:** February 4, 2026  
**Author:** Principal Customer Quality Systems Architect  
**Status:** Design Complete - Ready for Implementation

---

## A) PHILOSOPHY & OBJECTIVES

### Why Fast, Structured Response Matters

In metals and plastics service centers, customer quality issues are **revenue-critical moments of truth**. A complaint mishandled destroys trust built over years. A complaint handled professionally can actually *strengthen* the relationship.

**Response time expectations:**
- Acknowledgment: < 4 hours (business hours)
- Initial assessment: < 24 hours
- Disposition decision: < 72 hours
- Resolution: < 10 business days

Speed without structure creates chaos. Structure without speed frustrates customers. This module delivers **both**.

### Complaint Handling vs. Root-Cause Correction

| Aspect | Complaint Handling | Root-Cause Correction |
|--------|-------------------|----------------------|
| Goal | Make customer whole | Prevent recurrence |
| Timeframe | Hours to days | Days to weeks |
| Owner | CSR / Sales | Quality Manager |
| Output | Credit/replacement | Process improvement |
| Metric | Resolution time | Repeat defect rate |

**Critical insight:** Most organizations are good at one, bad at the other. This module enforces *both* as non-negotiable steps.

### Importance of Traceability

When a customer says "this material is wrong," we must answer:
- What heat/lot was shipped?
- Who processed it?
- What QC checks were performed?
- What equipment was used?
- Who certified the shipment?

**Without traceability, we guess. With traceability, we know.**

This module links every claim to:
```
Customer Claim → Shipment → Package → Job → Material → Heat/Lot → Supplier
```

### Linkage Between Customer Quality and Margin

**Cost of Poor Quality (COPQ)** is typically 5-15% of revenue in service centers. This includes:
- Material waste
- Rework labor
- Expedited shipping
- Credits/refunds
- Customer churn
- Reputation damage (unmeasured but real)

This module makes COPQ **visible** so it can be managed.

---

## B) DATA MODEL

### Core Entities

```prisma
// ============================================================================
// CUSTOMER CLAIMS
// ============================================================================

model CustomerClaim {
  id                String          @id @default(uuid())
  claimNumber       String          @unique // CLM-2026-000001
  
  // Source
  customerId        String
  customer          Organization    @relation(fields: [customerId], references: [id])
  contactId         String?
  contact           Contact?        @relation(fields: [contactId], references: [id])
  
  // What's being claimed
  claimType         ClaimType
  severity          ClaimSeverity   @default(STANDARD)
  description       String
  customerPONumber  String?
  
  // Linked records
  orderId           String?
  order             Order?          @relation(fields: [orderId], references: [id])
  shipmentId        String?
  shipment          Shipment?       @relation(fields: [shipmentId], references: [id])
  invoiceId         String?
  invoice           Invoice?        @relation(fields: [invoiceId], references: [id])
  
  // Claim value
  claimedAmount     Decimal?        @db.Decimal(12, 2)
  claimedQuantity   Decimal?        @db.Decimal(12, 4)
  claimedUom        String?
  
  // Status
  status            ClaimStatus     @default(NEW)
  priority          Int             @default(3) // 1=Critical, 5=Low
  
  // Assignment
  assignedToId      String?
  assignedTo        User?           @relation("ClaimAssignee", fields: [assignedToId], references: [id])
  ownerId           String
  owner             User            @relation("ClaimOwner", fields: [ownerId], references: [id])
  
  // SLA tracking
  acknowledgedAt    DateTime?
  reviewStartedAt   DateTime?
  dispositionSetAt  DateTime?
  resolvedAt        DateTime?
  closedAt          DateTime?
  slaBreached       Boolean         @default(false)
  
  // Disposition
  disposition       ClaimDisposition?
  dispositionNotes  String?
  
  // Resolution
  resolutionSummary String?
  customerSatisfied Boolean?
  
  // Audit
  createdAt         DateTime        @default(now())
  createdById       String
  createdBy         User            @relation("ClaimCreator", fields: [createdById], references: [id])
  updatedAt         DateTime        @updatedAt
  
  // Relations
  items             ClaimItem[]
  rmas              RMA[]
  cars              CorrectiveActionReport[]
  credits           CreditRequest[]
  communications    CustomerCommunication[]
  attachments       ClaimAttachment[]
  costImpacts       CostImpactRecord[]
  
  @@index([customerId])
  @@index([status])
  @@index([claimType])
  @@index([createdAt])
}

enum ClaimType {
  WRONG_MATERIAL      // Wrong grade, size, or spec
  WRONG_QUANTITY      // Short or over shipment
  DAMAGE_TRANSIT      // Damaged in shipping
  DAMAGE_PROCESSING   // Damaged during our processing
  QUALITY_DEFECT      // Failed to meet quality spec
  LATE_DELIVERY       // Missed delivery date
  PAPERWORK_ERROR     // Certs, invoices, packing list wrong
  PRICING_DISPUTE     // Invoice amount disputed
  OTHER
}

enum ClaimSeverity {
  CRITICAL    // Production stopped, safety issue
  MAJOR       // Significant impact, expedite needed
  STANDARD    // Normal priority
  MINOR       // Low impact, routine handling
}

enum ClaimStatus {
  NEW                 // Just received
  ACKNOWLEDGED        // Customer notified we received it
  UNDER_REVIEW        // Being investigated
  PENDING_CUSTOMER    // Waiting for customer info
  DISPOSITION_SET     // Decision made
  IN_PROGRESS         // Resolution in progress
  RESOLVED            // Resolved, pending customer confirmation
  CLOSED              // Complete
  CANCELLED           // Cancelled/withdrawn
}

enum ClaimDisposition {
  REPLACE             // Ship replacement material
  REWORK              // Rework and return
  CREDIT_FULL         // Full credit issued
  CREDIT_PARTIAL      // Partial credit issued
  RETURN_TO_VENDOR    // Supplier issue, return upstream
  NO_ACTION           // Claim denied (with documentation)
  GOODWILL            // Goodwill gesture despite no fault
}

// ============================================================================
// CLAIM ITEMS (Line-level detail)
// ============================================================================

model ClaimItem {
  id              String        @id @default(uuid())
  claimId         String
  claim           CustomerClaim @relation(fields: [claimId], references: [id])
  
  // What material
  productId       String?
  product         Product?      @relation(fields: [productId], references: [id])
  materialDesc    String
  
  // Traceability
  jobId           String?
  job             Job?          @relation(fields: [jobId], references: [id])
  heatNumber      String?
  lotNumber       String?
  coilId          String?
  coil            Coil?         @relation(fields: [coilId], references: [id])
  
  // Claimed issue
  issueType       ClaimType
  issueDetail     String
  claimedQty      Decimal       @db.Decimal(12, 4)
  claimedUom      String
  
  // Inspection findings
  inspectedQty    Decimal?      @db.Decimal(12, 4)
  actualDefectQty Decimal?      @db.Decimal(12, 4)
  inspectionNotes String?
  defectCodes     String[]      // Array of defect codes
  
  // Disposition
  itemDisposition ClaimDisposition?
  dispositionQty  Decimal?      @db.Decimal(12, 4)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([claimId])
  @@index([jobId])
  @@index([heatNumber])
}

// ============================================================================
// RMA (RETURN MATERIAL AUTHORIZATION)
// ============================================================================

model RMA {
  id                String        @id @default(uuid())
  rmaNumber         String        @unique // RMA-2026-000001
  
  // Source claim
  claimId           String
  claim             CustomerClaim @relation(fields: [claimId], references: [id])
  
  // Customer
  customerId        String
  customer          Organization  @relation(fields: [customerId], references: [id])
  
  // Status
  status            RMAStatus     @default(REQUESTED)
  
  // Authorization
  authorizedById    String?
  authorizedBy      User?         @relation("RMAAuthorizer", fields: [authorizedById], references: [id])
  authorizedAt      DateTime?
  authorizationNotes String?
  
  // Return logistics
  returnMethod      ReturnMethod?
  carrierName       String?
  trackingNumber    String?
  returnLabelUrl    String?
  expectedArrival   DateTime?
  
  // Receipt
  receivedAt        DateTime?
  receivedById      String?
  receivedBy        User?         @relation("RMAReceiver", fields: [receivedById], references: [id])
  receivingNotes    String?
  
  // Inspection
  inspectedAt       DateTime?
  inspectedById     String?
  inspectedBy       User?         @relation("RMAInspector", fields: [inspectedById], references: [id])
  inspectionPassed  Boolean?
  inspectionNotes   String?
  
  // Disposition
  disposition       RMADisposition?
  dispositionSetAt  DateTime?
  dispositionSetById String?
  dispositionSetBy  User?         @relation("RMADispositioner", fields: [dispositionSetById], references: [id])
  dispositionNotes  String?
  
  // Resulting actions
  reworkJobId       String?
  reworkJob         Job?          @relation("RMAReworkJob", fields: [reworkJobId], references: [id])
  replacementJobId  String?
  replacementJob    Job?          @relation("RMAReplacementJob", fields: [replacementJobId], references: [id])
  
  // SLA
  expiresAt         DateTime      // RMA authorization expires
  closedAt          DateTime?
  
  createdAt         DateTime      @default(now())
  createdById       String
  createdBy         User          @relation("RMACreator", fields: [createdById], references: [id])
  updatedAt         DateTime      @updatedAt
  
  // Relations
  items             RMAItem[]
  inventoryMoves    InventoryMovement[]
  
  @@index([claimId])
  @@index([customerId])
  @@index([status])
}

enum RMAStatus {
  REQUESTED         // Customer wants to return
  AUTHORIZED        // We approved the return
  LABEL_SENT        // Return label provided
  IN_TRANSIT        // Material on its way back
  RECEIVED          // We received the material
  INSPECTED         // Inspection complete
  DISPOSITIONED     // Final disposition set
  CLOSED            // Complete
  EXPIRED           // RMA expired unused
  CANCELLED
}

enum ReturnMethod {
  CUSTOMER_SHIP     // Customer arranges shipping
  PREPAID_LABEL     // We provide prepaid label
  PICKUP            // We arrange pickup
  NO_RETURN         // Credit without return
}

enum RMADisposition {
  RESTOCK           // Return to inventory
  REWORK            // Rework and return to customer
  REWORK_RESTOCK    // Rework and return to inventory
  SCRAP             // Scrap the material
  RETURN_TO_VENDOR  // Return to our supplier
  CREDIT_ONLY       // Credit issued, material not returned
}

model RMAItem {
  id              String      @id @default(uuid())
  rmaId           String
  rma             RMA         @relation(fields: [rmaId], references: [id])
  
  // Material
  claimItemId     String?
  productId       String?
  product         Product?    @relation(fields: [productId], references: [id])
  materialDesc    String
  
  // Expected return
  expectedQty     Decimal     @db.Decimal(12, 4)
  expectedUom     String
  
  // Received
  receivedQty     Decimal?    @db.Decimal(12, 4)
  receivedCondition String?
  
  // Traceability
  heatNumber      String?
  lotNumber       String?
  
  // Disposition
  disposition     RMADisposition?
  dispositionQty  Decimal?    @db.Decimal(12, 4)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([rmaId])
}

// ============================================================================
// CORRECTIVE ACTION REPORT (CAR)
// ============================================================================

model CorrectiveActionReport {
  id                String        @id @default(uuid())
  carNumber         String        @unique // CAR-2026-000001
  
  // Source
  claimId           String?
  claim             CustomerClaim? @relation(fields: [claimId], references: [id])
  ncrId             String?       // Internal NCR if applicable
  
  // Problem definition
  title             String
  problemDescription String
  impactDescription String
  
  // Categorization
  category          CARCategory
  severity          CARSeverity   @default(MINOR)
  isSystemic        Boolean       @default(false)
  
  // Status
  status            CARStatus     @default(OPEN)
  
  // Ownership
  ownerId           String
  owner             User          @relation("CAROwner", fields: [ownerId], references: [id])
  teamMembers       User[]        @relation("CARTeam")
  
  // Containment (immediate actions)
  containmentRequired Boolean     @default(true)
  containmentDueDate DateTime?
  containmentCompletedAt DateTime?
  
  // Root cause
  rootCauseMethod   RootCauseMethod?
  rootCauseCategory RootCauseCategory?
  rootCauseStatement String?
  fiveWhysJson      Json?         // Stored 5-whys analysis
  
  // Corrective actions
  actionPlanDueDate DateTime?
  implementationDueDate DateTime?
  verificationDueDate DateTime?
  
  // Closure
  effectivenessVerified Boolean   @default(false)
  verifiedById      String?
  verifiedBy        User?         @relation("CARVerifier", fields: [verifiedById], references: [id])
  verifiedAt        DateTime?
  closedAt          DateTime?
  closedById        String?
  closedBy          User?         @relation("CARCloser", fields: [closedById], references: [id])
  
  // Cost tracking
  estimatedCost     Decimal?      @db.Decimal(12, 2)
  actualCost        Decimal?      @db.Decimal(12, 2)
  
  // Audit
  createdAt         DateTime      @default(now())
  createdById       String
  createdBy         User          @relation("CARCreator", fields: [createdById], references: [id])
  updatedAt         DateTime      @updatedAt
  
  // Relations
  containmentActions ContainmentAction[]
  correctiveActions  CorrectiveAction[]
  preventiveActions  PreventiveAction[]
  attachments        CARAttachment[]
  
  @@index([claimId])
  @@index([status])
  @@index([category])
}

enum CARCategory {
  CUSTOMER_COMPLAINT
  INTERNAL_NCR
  SUPPLIER_ISSUE
  PROCESS_DEVIATION
  EQUIPMENT_FAILURE
  TRAINING_GAP
  SAFETY_INCIDENT
}

enum CARSeverity {
  CRITICAL    // Safety or major customer impact
  MAJOR       // Significant quality or cost impact
  MINOR       // Limited impact
}

enum CARStatus {
  OPEN                // Just opened
  CONTAINMENT         // Containment actions in progress
  ROOT_CAUSE          // Root cause analysis in progress
  ACTION_PLAN         // Developing corrective actions
  IMPLEMENTATION      // Implementing actions
  VERIFICATION        // Verifying effectiveness
  CLOSED              // Complete and verified
  CANCELLED
}

enum RootCauseMethod {
  FIVE_WHYS
  FISHBONE
  FAULT_TREE
  PARETO
  OTHER
}

enum RootCauseCategory {
  PROCESS           // Process not followed or inadequate
  EQUIPMENT         // Equipment malfunction or calibration
  MATERIAL          // Incoming material issue
  TRAINING          // Operator training gap
  PROCEDURE         // Missing or unclear procedure
  ENVIRONMENT       // Environmental factors
  MEASUREMENT       // Measurement/inspection error
  SUPPLIER          // Supplier-caused issue
  DESIGN            // Product or process design flaw
}

model ContainmentAction {
  id              String                  @id @default(uuid())
  carId           String
  car             CorrectiveActionReport  @relation(fields: [carId], references: [id])
  
  description     String
  assignedToId    String
  assignedTo      User                    @relation(fields: [assignedToId], references: [id])
  dueDate         DateTime
  completedAt     DateTime?
  status          ActionStatus            @default(OPEN)
  notes           String?
  
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  @@index([carId])
}

model CorrectiveAction {
  id              String                  @id @default(uuid())
  carId           String
  car             CorrectiveActionReport  @relation(fields: [carId], references: [id])
  
  description     String
  actionType      CorrectiveActionType
  assignedToId    String
  assignedTo      User                    @relation(fields: [assignedToId], references: [id])
  dueDate         DateTime
  completedAt     DateTime?
  status          ActionStatus            @default(OPEN)
  verificationMethod String?
  verified        Boolean                 @default(false)
  notes           String?
  
  // Linked changes
  procedureUpdated String?     // Reference to updated procedure
  trainingId       String?     // Reference to training record
  maintenanceId    String?     // Reference to maintenance task
  
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  @@index([carId])
}

enum CorrectiveActionType {
  PROCEDURE_UPDATE
  TRAINING
  EQUIPMENT_REPAIR
  EQUIPMENT_CALIBRATION
  PROCESS_CHANGE
  SUPPLIER_NOTIFICATION
  TOOLING_CHANGE
  INSPECTION_CHANGE
  OTHER
}

model PreventiveAction {
  id              String                  @id @default(uuid())
  carId           String
  car             CorrectiveActionReport  @relation(fields: [carId], references: [id])
  
  description     String
  scope           String        // Where else might this apply?
  assignedToId    String
  assignedTo      User          @relation(fields: [assignedToId], references: [id])
  dueDate         DateTime
  completedAt     DateTime?
  status          ActionStatus  @default(OPEN)
  notes           String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([carId])
}

enum ActionStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  VERIFIED
  CANCELLED
}

// ============================================================================
// CREDIT REQUESTS
// ============================================================================

model CreditRequest {
  id                String        @id @default(uuid())
  creditNumber      String        @unique // CR-2026-000001
  
  // Source
  claimId           String
  claim             CustomerClaim @relation(fields: [claimId], references: [id])
  
  // Customer
  customerId        String
  customer          Organization  @relation(fields: [customerId], references: [id])
  originalInvoiceId String?
  
  // Amount
  requestedAmount   Decimal       @db.Decimal(12, 2)
  approvedAmount    Decimal?      @db.Decimal(12, 2)
  currency          String        @default("USD")
  
  // Reason
  creditType        CreditType
  reason            String
  
  // Status
  status            CreditStatus  @default(PENDING)
  
  // Approval chain
  level1ApproverId  String?
  level1Approver    User?         @relation("CreditL1Approver", fields: [level1ApproverId], references: [id])
  level1ApprovedAt  DateTime?
  level1Notes       String?
  
  level2ApproverId  String?       // Required for amounts > threshold
  level2Approver    User?         @relation("CreditL2Approver", fields: [level2ApproverId], references: [id])
  level2ApprovedAt  DateTime?
  level2Notes       String?
  
  // Finance processing
  creditMemoNumber  String?       // Actual credit memo in accounting
  processedAt       DateTime?
  processedById     String?
  processedBy       User?         @relation("CreditProcessor", fields: [processedById], references: [id])
  
  // Audit
  createdAt         DateTime      @default(now())
  createdById       String
  createdBy         User          @relation("CreditCreator", fields: [createdById], references: [id])
  updatedAt         DateTime      @updatedAt
  
  @@index([claimId])
  @@index([customerId])
  @@index([status])
}

enum CreditType {
  MATERIAL_DEFECT
  SHIPPING_DAMAGE
  QUANTITY_SHORT
  PRICING_ERROR
  SERVICE_FAILURE
  GOODWILL
}

enum CreditStatus {
  PENDING           // Awaiting approval
  L1_APPROVED       // First level approved
  L2_APPROVED       // Second level approved (if needed)
  APPROVED          // Fully approved
  REJECTED          // Denied
  PROCESSING        // Being processed by finance
  ISSUED            // Credit memo issued
  CANCELLED
}

// ============================================================================
// CUSTOMER COMMUNICATIONS
// ============================================================================

model CustomerCommunication {
  id              String        @id @default(uuid())
  claimId         String
  claim           CustomerClaim @relation(fields: [claimId], references: [id])
  
  // Direction
  direction       CommDirection
  channel         CommChannel
  
  // Content
  subject         String?
  body            String
  
  // Parties
  fromUserId      String?       // Internal user
  fromUser        User?         @relation(fields: [fromUserId], references: [id])
  toContactId     String?       // Customer contact
  toContact       Contact?      @relation(fields: [toContactId], references: [id])
  
  // Email specifics
  emailMessageId  String?       // For threading
  
  // Visibility
  visibleToCustomer Boolean     @default(true)
  
  createdAt       DateTime      @default(now())
  
  @@index([claimId])
}

enum CommDirection {
  OUTBOUND    // We sent to customer
  INBOUND     // Customer sent to us
  INTERNAL    // Internal note
}

enum CommChannel {
  EMAIL
  PHONE
  PORTAL
  IN_PERSON
  INTERNAL_NOTE
}

// ============================================================================
// COST IMPACT TRACKING
// ============================================================================

model CostImpactRecord {
  id              String        @id @default(uuid())
  claimId         String?
  claim           CustomerClaim? @relation(fields: [claimId], references: [id])
  carId           String?
  
  // Cost category
  category        CostCategory
  description     String
  amount          Decimal       @db.Decimal(12, 2)
  
  // Allocation
  departmentCode  String?
  glAccount       String?
  
  createdAt       DateTime      @default(now())
  createdById     String
  createdBy       User          @relation(fields: [createdById], references: [id])
  
  @@index([claimId])
  @@index([category])
}

enum CostCategory {
  CREDIT_ISSUED
  MATERIAL_SCRAP
  REWORK_LABOR
  EXPEDITED_SHIPPING
  REPLACEMENT_MATERIAL
  INSPECTION_TIME
  ADMIN_TIME
  EXTERNAL_TESTING
  CUSTOMER_VISIT
  OTHER
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

model ClaimAttachment {
  id              String        @id @default(uuid())
  claimId         String
  claim           CustomerClaim @relation(fields: [claimId], references: [id])
  
  fileName        String
  fileType        String
  fileSize        Int
  storageUrl      String
  
  uploadedById    String
  uploadedBy      User          @relation(fields: [uploadedById], references: [id])
  uploadedAt      DateTime      @default(now())
  
  category        AttachmentCategory @default(OTHER)
  description     String?
  
  // Customer visibility
  visibleToCustomer Boolean     @default(false)
  
  @@index([claimId])
}

model CARAttachment {
  id              String                  @id @default(uuid())
  carId           String
  car             CorrectiveActionReport  @relation(fields: [carId], references: [id])
  
  fileName        String
  fileType        String
  fileSize        Int
  storageUrl      String
  
  uploadedById    String
  uploadedBy      User                    @relation(fields: [uploadedById], references: [id])
  uploadedAt      DateTime                @default(now())
  
  category        AttachmentCategory      @default(OTHER)
  description     String?
  
  @@index([carId])
}

enum AttachmentCategory {
  CUSTOMER_PHOTO
  INSPECTION_REPORT
  TEST_RESULT
  CERTIFICATE
  CORRESPONDENCE
  ROOT_CAUSE_DIAGRAM
  PROCEDURE_UPDATE
  OTHER
}
```

---

## C) RMA / CLAIM WORKFLOWS (STATE MACHINES)

### Customer Claim State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER CLAIM WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐     < 4 hrs SLA      ┌──────────────┐
    │   NEW   │ ─────────────────────▶ ACKNOWLEDGED │
    └─────────┘                       └──────────────┘
                                             │
                                             ▼
                                    ┌──────────────┐
                              ┌────▶│ UNDER_REVIEW │◀───────────┐
                              │     └──────────────┘            │
                              │            │                    │
                     Need info│            │ Decision made      │ More info
                              │            ▼                    │ received
                      ┌───────────────┐  ┌────────────────┐     │
                      │PENDING_CUSTOMER│◀─│DISPOSITION_SET │─────┘
                      └───────────────┘  └────────────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                         ▼                     ▼                     ▼
                   ┌───────────┐        ┌───────────┐         ┌──────────┐
                   │ Create RMA│        │Issue Credit│         │ No Action│
                   └───────────┘        └───────────┘         └──────────┘
                         │                     │                     │
                         └─────────────────────┼─────────────────────┘
                                               ▼
                                       ┌─────────────┐
                                       │ IN_PROGRESS │
                                       └─────────────┘
                                               │
                                               ▼ Actions complete
                                        ┌──────────┐
                                        │ RESOLVED │
                                        └──────────┘
                                               │
                                               ▼ Customer confirms
                                         ┌────────┐
                                         │ CLOSED │
                                         └────────┘
```

### Claim Processing Rules

| Transition | Required | SLA | Trigger |
|------------|----------|-----|---------|
| NEW → ACKNOWLEDGED | Auto-email to customer | < 4 hrs | CSR reviews |
| ACKNOWLEDGED → UNDER_REVIEW | Assign owner | < 24 hrs | Investigation starts |
| UNDER_REVIEW → DISPOSITION_SET | Manager approval | < 72 hrs | Decision made |
| DISPOSITION_SET → RESOLVED | All actions complete | < 10 days | RMA closed, credit issued |
| RESOLVED → CLOSED | Customer response | < 5 days | Customer confirms or timeout |

### RMA State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RMA WORKFLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌───────────┐     Manager approves    ┌────────────┐
    │ REQUESTED │ ────────────────────────▶ AUTHORIZED │
    └───────────┘                          └────────────┘
         │                                       │
         │ Denied                                │ Label sent
         ▼                                       ▼
    ┌───────────┐                          ┌────────────┐
    │ CANCELLED │                          │ LABEL_SENT │
    └───────────┘                          └────────────┘
                                                 │
                                                 │ Tracking updates
                                                 ▼
                                           ┌────────────┐
                                           │ IN_TRANSIT │
                                           └────────────┘
                                                 │
                                                 │ Material arrives
                                                 ▼
                                            ┌──────────┐
                                            │ RECEIVED │
                                            └──────────┘
                                                 │
                                                 │ Inspection complete
                                                 ▼
                                            ┌───────────┐
                                            │ INSPECTED │
                                            └───────────┘
                                                 │
                         ┌───────────────────────┼───────────────────────┐
                         │                       │                       │
                         ▼                       ▼                       ▼
                   ┌──────────┐           ┌──────────┐           ┌──────────┐
                   │ RESTOCK  │           │  REWORK  │           │  SCRAP   │
                   └──────────┘           └──────────┘           └──────────┘
                         │                       │                       │
                         └───────────────────────┼───────────────────────┘
                                                 ▼
                                          ┌──────────────┐
                                          │ DISPOSITIONED│
                                          └──────────────┘
                                                 │
                                                 ▼
                                            ┌────────┐
                                            │ CLOSED │
                                            └────────┘
```

### RMA Processing Rules

| Transition | Required | Action | Validation |
|------------|----------|--------|------------|
| REQUESTED → AUTHORIZED | Ops Manager approval | Generate RMA number | Claim exists |
| AUTHORIZED → LABEL_SENT | Auto | Email label to customer | Return method set |
| LABEL_SENT → IN_TRANSIT | Tracking update | Link tracking | Tracking # provided |
| IN_TRANSIT → RECEIVED | Receiving scan | Record receipt | RMA # verified |
| RECEIVED → INSPECTED | QC inspection | Document condition | Inspection complete |
| INSPECTED → DISPOSITIONED | Decision | Trigger inventory/job | All items dispositioned |
| DISPOSITIONED → CLOSED | All actions done | Update claim | Jobs complete, credits issued |

### RMA Expiration

- RMA authorization valid for **30 days**
- Email reminder at 7 days, 3 days, 1 day before expiration
- Expired RMAs cannot be used - customer must request new one
- Extension possible with manager approval

---

## D) CORRECTIVE ACTION (CAR) WORKFLOW

### CAR State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CORRECTIVE ACTION REPORT WORKFLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌────────┐
    │  OPEN  │ ◀──────────── Claim or NCR triggers CAR
    └────────┘
         │
         │ Assign owner, document problem
         ▼
    ┌─────────────┐
    │ CONTAINMENT │ ◀──────── Immediate actions to stop bleeding
    └─────────────┘
         │
         │ Containment verified effective
         ▼
    ┌────────────┐
    │ ROOT_CAUSE │ ◀───────── 5 Whys or Fishbone analysis
    └────────────┘
         │
         │ Root cause identified and documented
         ▼
    ┌─────────────┐
    │ ACTION_PLAN │ ◀──────── Define corrective & preventive actions
    └─────────────┘
         │
         │ Actions approved
         ▼
    ┌────────────────┐
    │ IMPLEMENTATION │ ◀───── Execute actions
    └────────────────┘
         │
         │ All actions complete
         ▼
    ┌──────────────┐
    │ VERIFICATION │ ◀──────── Verify effectiveness (30-90 days)
    └──────────────┘
         │
         │ Effectiveness confirmed
         ▼
    ┌────────┐
    │ CLOSED │
    └────────┘
```

### CAR Triggering Criteria

A CAR is **required** when:

1. **Customer claim value > $1,000**
2. **Same defect type occurs 3+ times in 30 days**
3. **Critical severity claim**
4. **Safety-related issue**
5. **Systemic process failure identified**
6. **Customer explicitly requests**

A CAR is **optional** but recommended when:

1. **Claim value $500-$1,000**
2. **Same defect type occurs 2 times in 30 days**
3. **Major severity claim**
4. **Supplier-related issue (for supplier notification)**

### Root Cause Methods

#### 5 Whys Structure

```json
{
  "problem": "Customer received wrong thickness material",
  "whys": [
    {
      "level": 1,
      "question": "Why was wrong thickness shipped?",
      "answer": "Wrong coil was pulled from inventory"
    },
    {
      "level": 2,
      "question": "Why was wrong coil pulled?",
      "answer": "Label on coil rack was incorrect"
    },
    {
      "level": 3,
      "question": "Why was label incorrect?",
      "answer": "Material was moved without updating location"
    },
    {
      "level": 4,
      "question": "Why was location not updated?",
      "answer": "No scan required when moving between racks"
    },
    {
      "level": 5,
      "question": "Why is no scan required?",
      "answer": "Procedure doesn't require scan for same-aisle moves"
    }
  ],
  "rootCause": "Inventory movement procedure has gap for same-aisle transfers",
  "category": "PROCEDURE"
}
```

#### Root Cause Categories

| Category | Examples | Typical Actions |
|----------|----------|-----------------|
| PROCESS | Step skipped, wrong sequence | Procedure update, training |
| EQUIPMENT | Calibration drift, breakdown | Maintenance, calibration |
| MATERIAL | Incoming defect, wrong spec | Supplier CAR, incoming inspection |
| TRAINING | Operator error, knowledge gap | Training, qualification |
| PROCEDURE | Missing step, unclear instruction | Procedure revision |
| ENVIRONMENT | Temperature, contamination | Environmental controls |
| MEASUREMENT | Wrong gauge, reading error | Calibration, MSA |
| SUPPLIER | Supplier NC, documentation | Supplier notification |
| DESIGN | Inherent flaw | Engineering change |

### CAR Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAR INTEGRATION MAP                          │
└─────────────────────────────────────────────────────────────────┘

              ┌──────────────┐
              │ Customer CAR │
              └──────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │   SPC   │ │  NCRs   │ │ Safety  │
    │ Trends  │ │ History │ │Incidents│
    └─────────┘ └─────────┘ └─────────┘
         │           │           │
         └───────────┼───────────┘
                     ▼
              ┌──────────────┐
              │ Root Cause   │
              │  Analysis    │
              └──────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │Training │ │Procedure│ │Maintnce │
    │ Update  │ │ Update  │ │  Task   │
    └─────────┘ └─────────┘ └─────────┘
         │           │           │
         └───────────┼───────────┘
                     ▼
              ┌──────────────┐
              │  Stop-Work   │ (if systemic risk)
              │   Review     │
              └──────────────┘
```

---

## E) INTEGRATION WITH QUALITY, INVENTORY, DISPATCH

### Quality Integration

#### Claim → Internal NCR Flow

```typescript
// When claim is validated, optionally create internal NCR
async function createNCRFromClaim(claim: CustomerClaim): Promise<NCR> {
  const ncr = await prisma.nCR.create({
    data: {
      ncrNumber: generateNCRNumber(),
      source: 'CUSTOMER_CLAIM',
      sourceRef: claim.claimNumber,
      
      // Link to original material
      heatNumber: claim.items[0]?.heatNumber,
      jobId: claim.items[0]?.jobId,
      
      // Categorization
      defectType: mapClaimTypeToDefect(claim.claimType),
      severity: claim.severity,
      
      // Assignment
      assignedToId: getQualityManager(claim.locationId),
      
      status: 'OPEN'
    }
  });
  
  // Link back to claim
  await prisma.customerClaim.update({
    where: { id: claim.id },
    data: { internalNCRId: ncr.id }
  });
  
  return ncr;
}
```

#### SPC Data for Root Cause

When investigating a claim, the system automatically pulls:

1. **SPC data from same work center** (±7 days from processing date)
2. **Recent NCRs with same defect code**
3. **Equipment calibration history**
4. **Operator certification status**

```typescript
async function getRootCauseContext(claimItem: ClaimItem) {
  const job = await prisma.job.findUnique({
    where: { id: claimItem.jobId },
    include: { workCenter: true }
  });
  
  const processDate = job.actualEnd;
  const workCenterId = job.workCenterId;
  
  return {
    spcData: await prisma.sPCReading.findMany({
      where: {
        workCenterId,
        timestamp: {
          gte: subDays(processDate, 7),
          lte: addDays(processDate, 7)
        }
      }
    }),
    
    recentNCRs: await prisma.nCR.findMany({
      where: {
        job: { workCenterId },
        createdAt: { gte: subDays(processDate, 30) }
      }
    }),
    
    calibrationRecords: await prisma.calibrationRecord.findMany({
      where: {
        equipmentId: { in: job.equipmentIds },
        calibrationDate: { lte: processDate }
      },
      orderBy: { calibrationDate: 'desc' },
      take: 1
    }),
    
    operatorCerts: await prisma.userCertification.findMany({
      where: {
        userId: job.operatorId,
        equipmentTypeId: job.workCenter.equipmentTypeId
      }
    })
  };
}
```

### Inventory Integration

#### Returned Material Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                RETURNED MATERIAL INVENTORY FLOW                 │
└─────────────────────────────────────────────────────────────────┘

    RMA RECEIVED
         │
         ▼
    ┌─────────────────┐
    │ Quarantine Hold │ ◀── Material tagged with RMA#
    │   Location      │     Blocked from allocation
    └─────────────────┘
         │
         │ Inspection
         ▼
    ┌─────────────────┐
    │ Disposition     │
    │ Decision        │
    └─────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
    ▼         ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│RESTOCK ││REWORK  ││ SCRAP  ││RETURN  │
│        ││        ││        ││VENDOR  │
└────────┘└────────┘└────────┘└────────┘
    │         │        │        │
    ▼         ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│Move to ││Create  ││Write   ││Create  │
│primary ││rework  ││off     ││RTV     │
│location││job     ││qty     ││shipment│
└────────┘└────────┘└────────┘└────────┘
```

#### Inventory Movement Records

```typescript
async function processRMADisposition(rma: RMA, items: RMAItem[]) {
  for (const item of items) {
    switch (item.disposition) {
      case 'RESTOCK':
        // Move from quarantine to primary location
        await prisma.inventoryMovement.create({
          data: {
            type: 'TRANSFER',
            reason: 'RMA_RESTOCK',
            referenceType: 'RMA',
            referenceId: rma.id,
            productId: item.productId,
            quantity: item.receivedQty,
            fromLocationId: getQuarantineLocation(),
            toLocationId: getPrimaryLocation(item.productId),
            heatNumber: item.heatNumber,
            lotNumber: item.lotNumber
          }
        });
        break;
        
      case 'SCRAP':
        // Write off inventory
        await prisma.inventoryMovement.create({
          data: {
            type: 'ADJUSTMENT',
            reason: 'RMA_SCRAP',
            referenceType: 'RMA',
            referenceId: rma.id,
            productId: item.productId,
            quantity: -item.receivedQty,
            fromLocationId: getQuarantineLocation(),
            heatNumber: item.heatNumber,
            lotNumber: item.lotNumber
          }
        });
        
        // Record scrap cost
        await prisma.costImpactRecord.create({
          data: {
            claimId: rma.claimId,
            category: 'MATERIAL_SCRAP',
            description: `Scrapped ${item.receivedQty} ${item.materialDesc}`,
            amount: await calculateMaterialCost(item)
          }
        });
        break;
        
      case 'REWORK':
        // Create rework job
        const reworkJob = await createReworkJob(rma, item);
        await prisma.rMA.update({
          where: { id: rma.id },
          data: { reworkJobId: reworkJob.id }
        });
        break;
        
      case 'RETURN_TO_VENDOR':
        // Create return-to-vendor shipment
        await createRTVShipment(rma, item);
        break;
    }
  }
}
```

### Dispatch Integration

#### Auto-Generated Jobs

When an RMA requires rework or replacement:

```typescript
async function createReworkJob(rma: RMA, item: RMAItem): Promise<Job> {
  const originalJob = await prisma.job.findUnique({
    where: { id: item.originalJobId },
    include: { workCenter: true }
  });
  
  return prisma.job.create({
    data: {
      jobNumber: generateJobNumber(),
      jobType: 'REWORK',
      priority: 4, // High priority for customer recovery
      status: 'SCHEDULED',
      
      // Link to RMA
      sourceType: 'RMA',
      sourceId: rma.id,
      
      // Same work center as original
      workCenterId: originalJob.workCenterId,
      
      // Copy relevant specs
      operationType: originalJob.operationType,
      productId: item.productId,
      targetQuantity: item.receivedQty,
      
      // Clear instructions
      instructions: `REWORK for RMA ${rma.rmaNumber}\n` +
        `Original Issue: ${rma.claim.description}\n` +
        `Customer: ${rma.customer.name}\n` +
        `EXPEDITE - Customer recovery`
    }
  });
}

async function createReplacementJob(claim: CustomerClaim): Promise<Job> {
  const originalOrder = await prisma.order.findUnique({
    where: { id: claim.orderId },
    include: { lineItems: true }
  });
  
  return prisma.job.create({
    data: {
      jobNumber: generateJobNumber(),
      jobType: 'REPLACEMENT',
      priority: 4, // High priority
      status: 'SCHEDULED',
      
      // Link to claim
      sourceType: 'CLAIM',
      sourceId: claim.id,
      
      // Customer info
      customerId: claim.customerId,
      
      // Replicate original order specs
      instructions: `REPLACEMENT for Claim ${claim.claimNumber}\n` +
        `Original Order: ${originalOrder.orderNumber}\n` +
        `EXPEDITE - Customer recovery`
    }
  });
}
```

#### Priority Handling

| Job Type | Base Priority | SLA Target |
|----------|--------------|------------|
| Normal Order | 3 | Standard lead time |
| Rework (RMA) | 4 | 5 business days |
| Replacement (Claim) | 4 | 5 business days |
| Critical Customer | 5 | 3 business days |

### Safety Integration

#### Stop-Work Review Trigger

Systemic quality issues may require safety review:

```typescript
async function checkStopWorkCriteria(car: CorrectiveActionReport) {
  const triggers = [];
  
  // Criterion 1: Same defect 5+ times in 30 days
  const repeatCount = await prisma.customerClaim.count({
    where: {
      claimType: car.claim.claimType,
      createdAt: { gte: subDays(new Date(), 30) }
    }
  });
  
  if (repeatCount >= 5) {
    triggers.push({
      criterion: 'REPEAT_DEFECT',
      detail: `${repeatCount} claims of type ${car.claim.claimType} in 30 days`
    });
  }
  
  // Criterion 2: Critical severity with equipment involved
  if (car.severity === 'CRITICAL' && car.rootCauseCategory === 'EQUIPMENT') {
    triggers.push({
      criterion: 'EQUIPMENT_CRITICAL',
      detail: 'Critical CAR involving equipment failure'
    });
  }
  
  // Criterion 3: Safety-related quality issue
  if (car.category === 'SAFETY_INCIDENT') {
    triggers.push({
      criterion: 'SAFETY_QUALITY',
      detail: 'Quality issue with safety implications'
    });
  }
  
  if (triggers.length > 0) {
    await prisma.stopWorkReview.create({
      data: {
        sourceType: 'CAR',
        sourceId: car.id,
        triggers,
        status: 'PENDING_REVIEW',
        assignedToId: getSafetyManager()
      }
    });
    
    // Notify safety team
    await notifySafetyTeam(car, triggers);
  }
}
```

---

## F) CUSTOMER-FACING EXPERIENCE

### Customer Portal Features

#### Claim Submission

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBMIT A CLAIM                               │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  Order/Invoice Reference                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Search by PO#, Invoice#, or Order#...                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Selected: ORD-2026-001234 - Shipped 01/28/2026                │
│                                                                 │
│  Issue Type *                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ▼ Select issue type                                     │   │
│  │   ○ Wrong material (grade, size, or specification)      │   │
│  │   ○ Quantity issue (short or over shipment)             │   │
│  │   ○ Damage (shipping or processing damage)              │   │
│  │   ○ Quality defect (failed to meet specification)       │   │
│  │   ○ Late delivery                                       │   │
│  │   ○ Documentation error                                 │   │
│  │   ○ Pricing issue                                       │   │
│  │   ○ Other                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Description *                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Please describe the issue in detail...                  │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Quantity Affected            Unit                              │
│  ┌────────────────┐          ┌────────────────┐                │
│  │                │          │ ▼ LB           │                │
│  └────────────────┘          └────────────────┘                │
│                                                                 │
│  Attachments                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📎 Drag files here or click to upload                  │   │
│  │     (Photos, documents, test reports)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  📄 damage_photo_1.jpg (2.3 MB)  ✕                             │
│  📄 material_cert.pdf (156 KB)   ✕                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Submit Claim                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Claim Status View

```
┌─────────────────────────────────────────────────────────────────┐
│  CLAIM CLM-2026-000042                             Status: 🟡   │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  Progress                                                       │
│  ══════════════════════════════════════════════════════════    │
│  ✓ Received   ✓ Acknowledged   ● Under Review   ○ Resolved    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📋 CLAIM DETAILS                                        │   │
│  │                                                         │   │
│  │ Issue Type:     Quality Defect                          │   │
│  │ Order:          ORD-2026-001234                         │   │
│  │ Submitted:      Feb 2, 2026 at 2:15 PM                  │   │
│  │ Acknowledged:   Feb 2, 2026 at 3:42 PM                  │   │
│  │ Assigned To:    Sarah Johnson                           │   │
│  │                                                         │   │
│  │ Your Description:                                       │   │
│  │ Material thickness measured at 0.138" instead of        │   │
│  │ the specified 0.125". Unable to use for our tooling.    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 COMMUNICATIONS                                       │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Sarah Johnson - Feb 2, 2026 at 4:30 PM             │ │   │
│  │ │                                                     │ │   │
│  │ │ Thank you for bringing this to our attention. We   │ │   │
│  │ │ have reviewed your claim and located the heat      │ │   │
│  │ │ record. Our QC team is conducting additional       │ │   │
│  │ │ testing on retained samples. We will update you    │ │   │
│  │ │ within 24 hours.                                   │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Add a message...                                   │ │   │
│  │ │                                                     │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                      [Send Message]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📎 ATTACHMENTS                                          │   │
│  │                                                         │   │
│  │ 📄 damage_photo_1.jpg        📄 material_cert.pdf       │   │
│  │ 📄 our_test_results.pdf (Added by SteelWise)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### RMA Instructions

```
┌─────────────────────────────────────────────────────────────────┐
│  RMA RMA-2026-000018                               Authorized ✓ │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  ⚠️  This RMA expires on March 6, 2026                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📦 RETURN INSTRUCTIONS                                  │   │
│  │                                                         │   │
│  │ 1. Package material securely to prevent damage          │   │
│  │ 2. Mark package clearly with: RMA-2026-000018           │   │
│  │ 3. Include copy of this RMA document                    │   │
│  │ 4. Use prepaid label below OR ship to:                  │   │
│  │                                                         │   │
│  │    SteelWise Returns                                    │   │
│  │    1234 Industrial Parkway                              │   │
│  │    Chicago, IL 60614                                    │   │
│  │    Attn: RMA-2026-000018                                │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │         [Download Prepaid Shipping Label]           │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │         [Download RMA Document (PDF)]               │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🚛 TRACKING                                             │   │
│  │                                                         │   │
│  │ Enter your tracking number once shipped:                │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │                                                     │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                      [Save Tracking]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### CAR Summary (Customer View)

For customers who request it, we provide a **sanitized** CAR summary:

```
┌─────────────────────────────────────────────────────────────────┐
│  CORRECTIVE ACTION SUMMARY                                      │
│  Claim: CLM-2026-000042                                         │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  Issue:                                                         │
│  Material thickness out of specification                        │
│                                                                 │
│  Root Cause:                                                    │
│  Gauge calibration drift on slitting line #2                    │
│                                                                 │
│  Corrective Actions Taken:                                      │
│  ✓ Gauge recalibrated and verified                             │
│  ✓ Calibration frequency increased from monthly to weekly       │
│  ✓ Additional thickness checks added to QC process              │
│                                                                 │
│  Prevention:                                                    │
│  ✓ SPC monitoring implemented for thickness                     │
│  ✓ Similar equipment at other locations inspected               │
│                                                                 │
│  Status: ✅ Complete                                            │
│  Verified: February 15, 2026                                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Questions? Contact your account representative.                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Tone Guidelines

| Situation | Tone | Example |
|-----------|------|---------|
| Acknowledgment | Professional, empathetic | "We're sorry for the inconvenience and are prioritizing this issue." |
| Status update | Clear, proactive | "Our QC team has completed testing. Here's what we found..." |
| Resolution | Positive, specific | "We've issued a credit of $1,234.56 and shipped replacement material." |
| Denied claim | Respectful, documented | "After investigation, we found... However, as a valued customer..." |

---

## G) INTERNAL ROLES & PERMISSIONS

### Role Matrix

| Action | CSR | Sales | Quality Mgr | Ops Mgr | Inv Mgr | Finance | Exec |
|--------|-----|-------|-------------|---------|---------|---------|------|
| Create claim | ✓ | ✓ | ✓ | ✓ | | | |
| Acknowledge claim | ✓ | ✓ | ✓ | ✓ | | | |
| Investigate claim | ✓ | | ✓ | ✓ | ✓ | | |
| Set disposition | | | ✓ | ✓ | | | |
| Authorize RMA | | | ✓ | ✓ | | | |
| Receive RMA | | | | | ✓ | | |
| Inspect RMA | | | ✓ | | ✓ | | |
| Create CAR | | | ✓ | ✓ | | | |
| Close CAR | | | ✓ | | | | |
| Approve credit < $500 | | ✓ | ✓ | ✓ | | | |
| Approve credit $500-$2500 | | | | ✓ | | ✓ | |
| Approve credit > $2500 | | | | | | | ✓ |
| Issue credit | | | | | | ✓ | |
| Customer communication | ✓ | ✓ | ✓ | | | | |
| View all claims | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View analytics | | | ✓ | ✓ | | ✓ | ✓ |
| View cost impact | | | ✓ | ✓ | | ✓ | ✓ |

### Permission Definitions

```typescript
const CLAIM_PERMISSIONS = {
  'claim:create': ['CSR', 'SALES', 'QUALITY_MGR', 'OPS_MGR'],
  'claim:acknowledge': ['CSR', 'SALES', 'QUALITY_MGR', 'OPS_MGR'],
  'claim:investigate': ['CSR', 'QUALITY_MGR', 'OPS_MGR', 'INV_MGR'],
  'claim:set_disposition': ['QUALITY_MGR', 'OPS_MGR'],
  'claim:close': ['QUALITY_MGR', 'OPS_MGR'],
  'claim:view_all': ['CSR', 'SALES', 'QUALITY_MGR', 'OPS_MGR', 'INV_MGR', 'FINANCE', 'EXEC'],
  'claim:view_own_customers': ['SALES'],
  
  'rma:authorize': ['QUALITY_MGR', 'OPS_MGR'],
  'rma:receive': ['INV_MGR', 'RECEIVING'],
  'rma:inspect': ['QUALITY_MGR', 'QC_TECH'],
  'rma:disposition': ['QUALITY_MGR', 'OPS_MGR'],
  
  'car:create': ['QUALITY_MGR', 'OPS_MGR'],
  'car:edit': ['QUALITY_MGR'],
  'car:close': ['QUALITY_MGR'],
  'car:view': ['QUALITY_MGR', 'OPS_MGR', 'EXEC'],
  
  'credit:request': ['CSR', 'SALES', 'QUALITY_MGR', 'OPS_MGR'],
  'credit:approve_l1': ['SALES_MGR', 'QUALITY_MGR', 'OPS_MGR'],
  'credit:approve_l2': ['OPS_MGR', 'FINANCE_MGR'],
  'credit:approve_l3': ['EXEC', 'CFO'],
  'credit:issue': ['FINANCE'],
  
  'communication:send_customer': ['CSR', 'SALES', 'QUALITY_MGR'],
  'communication:internal_note': ['CSR', 'SALES', 'QUALITY_MGR', 'OPS_MGR', 'INV_MGR', 'FINANCE'],
  
  'analytics:view': ['QUALITY_MGR', 'OPS_MGR', 'FINANCE', 'EXEC'],
  'analytics:export': ['QUALITY_MGR', 'OPS_MGR', 'EXEC']
};
```

### Approval Thresholds

| Credit Amount | Required Approvals | Time Limit |
|--------------|-------------------|------------|
| < $500 | 1 (L1: Sales/Quality/Ops Manager) | 24 hours |
| $500 - $2,500 | 2 (L1 + L2: Ops Manager or Finance Manager) | 48 hours |
| > $2,500 | 3 (L1 + L2 + L3: Executive) | 72 hours |

---

## H) UI / UX DESIGN (MATERIAL UI)

### Claims Inbox

```jsx
// ClaimsInboxPage.jsx - Main claims management view
import {
  Box, Card, CardContent, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Select, MenuItem, Button, Tabs, Tab,
  Avatar, AvatarGroup, Tooltip, LinearProgress
} from '@mui/material';
import {
  FilterList, Search, Warning, CheckCircle, 
  Schedule, Person, AttachFile, Message
} from '@mui/icons-material';

export default function ClaimsInboxPage() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Claims Inbox</Typography>
        <Button variant="contained" startIcon={<Add />}>
          New Claim
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
        <StatCard 
          label="Open Claims" 
          value={23} 
          color="warning"
          trend="+3 today"
        />
        <StatCard 
          label="Awaiting Response" 
          value={7} 
          color="info"
          icon={<Schedule />}
        />
        <StatCard 
          label="SLA At Risk" 
          value={4} 
          color="error"
          icon={<Warning />}
        />
        <StatCard 
          label="Resolved This Week" 
          value={18} 
          color="success"
          icon={<CheckCircle />}
        />
        <StatCard 
          label="Avg Resolution" 
          value="3.2 days" 
          color="primary"
        />
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search claims..."
            size="small"
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 300 }}
          />
          <Select size="small" defaultValue="all" sx={{ minWidth: 150 }}>
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="acknowledged">Acknowledged</MenuItem>
            <MenuItem value="under_review">Under Review</MenuItem>
            <MenuItem value="pending_customer">Pending Customer</MenuItem>
            <MenuItem value="disposition_set">Disposition Set</MenuItem>
          </Select>
          <Select size="small" defaultValue="all" sx={{ minWidth: 150 }}>
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="wrong_material">Wrong Material</MenuItem>
            <MenuItem value="quality_defect">Quality Defect</MenuItem>
            <MenuItem value="damage">Damage</MenuItem>
            <MenuItem value="quantity">Quantity</MenuItem>
          </Select>
          <Select size="small" defaultValue="all" sx={{ minWidth: 150 }}>
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
          </Select>
          <Box sx={{ flex: 1 }} />
          <Chip label="My Claims" variant="outlined" onClick={() => {}} />
          <IconButton><FilterList /></IconButton>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Claim #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>SLA</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.map(claim => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

function ClaimRow({ claim }) {
  return (
    <TableRow 
      hover 
      sx={{ 
        cursor: 'pointer',
        bgcolor: claim.slaAtRisk ? 'error.50' : 'inherit'
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {claim.claimNumber}
          </Typography>
          {claim.hasAttachments && <AttachFile fontSize="small" color="action" />}
          {claim.hasUnreadMessages && (
            <Badge badgeContent={claim.unreadCount} color="primary">
              <Message fontSize="small" />
            </Badge>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{claim.customerName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {claim.orderNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip 
          label={formatClaimType(claim.claimType)} 
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <StatusChip status={claim.status} />
      </TableCell>
      <TableCell>
        <PriorityIndicator priority={claim.priority} severity={claim.severity} />
      </TableCell>
      <TableCell>
        <Typography variant="body2">{formatAge(claim.createdAt)}</Typography>
      </TableCell>
      <TableCell>
        <Tooltip title={claim.ownerName}>
          <Avatar sx={{ width: 28, height: 28 }}>
            {claim.ownerInitials}
          </Avatar>
        </Tooltip>
      </TableCell>
      <TableCell>
        <SLAIndicator claim={claim} />
      </TableCell>
      <TableCell>
        <IconButton size="small">
          <MoreVert />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
```

### RMA Authorization View

```jsx
// RMAAuthorizationPage.jsx
export default function RMAAuthorizationPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>RMA Authorization</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Pending Authorization */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Pending Authorization ({pendingRMAs.length})
            </Typography>
            
            {pendingRMAs.map(rma => (
              <Paper key={rma.id} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight={600}>{rma.claimNumber}</Typography>
                  <Chip label={rma.customerName} size="small" />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {rma.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  {rma.items.map(item => (
                    <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2">{item.materialDesc}</Typography>
                      <Typography variant="body2">{item.quantity} {item.uom}</Typography>
                    </Box>
                  ))}
                </Box>
                
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Authorization notes..."
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={() => authorizeRMA(rma.id)}
                  >
                    Authorize
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => denyRMA(rma.id)}
                  >
                    Deny
                  </Button>
                  <Button variant="text">
                    Request Info
                  </Button>
                </Box>
              </Paper>
            ))}
          </CardContent>
        </Card>
        
        {/* Active RMAs */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Active RMAs
            </Typography>
            
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Authorized" />
              <Tab label="In Transit" />
              <Tab label="Received" />
            </Tabs>
            
            {/* RMA list based on tab */}
            <List>
              {filteredRMAs.map(rma => (
                <ListItem key={rma.id}>
                  <ListItemText
                    primary={rma.rmaNumber}
                    secondary={`${rma.customerName} - ${rma.status}`}
                  />
                  <RMAStatusIndicator status={rma.status} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
```

### CAR Management

```jsx
// CARManagementPage.jsx
export default function CARManagementPage() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header with metrics */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Corrective Actions</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            icon={<Warning />} 
            label="5 Overdue Actions" 
            color="error" 
          />
          <Chip 
            icon={<Schedule />} 
            label="12 Due This Week" 
            color="warning" 
          />
        </Box>
      </Box>
      
      {/* Kanban-style CAR board */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        <CARColumn 
          title="Open" 
          status="OPEN" 
          cars={carsByStatus.OPEN}
          color="grey"
        />
        <CARColumn 
          title="Containment" 
          status="CONTAINMENT" 
          cars={carsByStatus.CONTAINMENT}
          color="orange"
        />
        <CARColumn 
          title="Root Cause" 
          status="ROOT_CAUSE" 
          cars={carsByStatus.ROOT_CAUSE}
          color="blue"
        />
        <CARColumn 
          title="Action Plan" 
          status="ACTION_PLAN" 
          cars={carsByStatus.ACTION_PLAN}
          color="purple"
        />
        <CARColumn 
          title="Implementation" 
          status="IMPLEMENTATION" 
          cars={carsByStatus.IMPLEMENTATION}
          color="teal"
        />
        <CARColumn 
          title="Verification" 
          status="VERIFICATION" 
          cars={carsByStatus.VERIFICATION}
          color="green"
        />
      </Box>
      
      {/* Selected CAR detail panel */}
      {selectedCAR && (
        <CARDetailPanel 
          car={selectedCAR} 
          onClose={() => setSelectedCAR(null)}
        />
      )}
    </Box>
  );
}

function CARColumn({ title, status, cars, color }) {
  return (
    <Paper 
      sx={{ 
        minWidth: 300, 
        bgcolor: `${color}.50`,
        borderTop: 3,
        borderColor: `${color}.main`
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography fontWeight={600}>{title}</Typography>
        <Chip label={cars.length} size="small" />
      </Box>
      
      <Box sx={{ p: 1, maxHeight: 600, overflowY: 'auto' }}>
        {cars.map(car => (
          <CARCard key={car.id} car={car} />
        ))}
      </Box>
    </Paper>
  );
}

function CARCard({ car }) {
  return (
    <Card sx={{ mb: 1, cursor: 'pointer' }} onClick={() => selectCAR(car)}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {car.carNumber}
          </Typography>
          <SeverityChip severity={car.severity} />
        </Box>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          {truncate(car.title, 60)}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip title={car.ownerName}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
              {car.ownerInitials}
            </Avatar>
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule fontSize="small" color={car.isOverdue ? 'error' : 'action'} />
            <Typography 
              variant="caption" 
              color={car.isOverdue ? 'error' : 'text.secondary'}
            >
              {formatDueDate(car.nextDueDate)}
            </Typography>
          </Box>
        </Box>
        
        {/* Action progress */}
        <LinearProgress 
          variant="determinate" 
          value={car.actionCompletionPercent}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}
```

### Cost Impact Dashboard

```jsx
// CostImpactDashboard.jsx
export default function CostImpactDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Cost of Poor Quality</Typography>
      
      {/* Period selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange}>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="quarter">Quarter</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </Box>
      
      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        <MetricCard
          title="Total COPQ"
          value="$47,234"
          subtitle="vs $52,100 prior period"
          trend={-9.3}
          color="success"
        />
        <MetricCard
          title="Credits Issued"
          value="$28,450"
          subtitle="42 claims"
          breakdown={[
            { label: 'Material defect', value: '$18,200' },
            { label: 'Damage', value: '$6,100' },
            { label: 'Other', value: '$4,150' }
          ]}
        />
        <MetricCard
          title="Rework Cost"
          value="$12,340"
          subtitle="18 jobs"
        />
        <MetricCard
          title="Scrap Loss"
          value="$6,444"
          subtitle="8,234 lbs"
        />
      </Box>
      
      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>COPQ Trend</Typography>
            <LineChart data={copqTrend} height={300} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>By Category</Typography>
            <PieChart data={copqByCategory} height={300} />
          </CardContent>
        </Card>
      </Box>
      
      {/* Top offenders */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Defect Types</Typography>
            <BarChart data={defectTypeRanking} horizontal />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Repeat Customers</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Claims</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topCustomerClaims.map(row => (
                  <TableRow key={row.customerId}>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell align="right">{row.claimCount}</TableCell>
                    <TableCell align="right">{formatCurrency(row.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
```

---

## I) APIS & EVENTING

### REST API Endpoints

```typescript
// Claims API
router.get('/api/claims', listClaims);
router.get('/api/claims/:id', getClaim);
router.post('/api/claims', createClaim);
router.patch('/api/claims/:id', updateClaim);
router.post('/api/claims/:id/acknowledge', acknowledgeClaim);
router.post('/api/claims/:id/disposition', setClaimDisposition);
router.post('/api/claims/:id/resolve', resolveClaim);
router.post('/api/claims/:id/close', closeClaim);

// Claim items
router.get('/api/claims/:id/items', getClaimItems);
router.post('/api/claims/:id/items', addClaimItem);
router.patch('/api/claims/:claimId/items/:itemId', updateClaimItem);

// Claim attachments
router.get('/api/claims/:id/attachments', getClaimAttachments);
router.post('/api/claims/:id/attachments', uploadClaimAttachment);
router.delete('/api/claims/:claimId/attachments/:attachmentId', deleteAttachment);

// Claim communications
router.get('/api/claims/:id/communications', getClaimCommunications);
router.post('/api/claims/:id/communications', sendCommunication);

// RMA API
router.get('/api/rmas', listRMAs);
router.get('/api/rmas/:id', getRMA);
router.post('/api/rmas', createRMA);
router.post('/api/rmas/:id/authorize', authorizeRMA);
router.post('/api/rmas/:id/deny', denyRMA);
router.post('/api/rmas/:id/receive', receiveRMA);
router.post('/api/rmas/:id/inspect', completeRMAInspection);
router.post('/api/rmas/:id/disposition', setRMADisposition);
router.post('/api/rmas/:id/close', closeRMA);

// RMA items
router.get('/api/rmas/:id/items', getRMAItems);
router.patch('/api/rmas/:rmaId/items/:itemId', updateRMAItem);

// CAR API
router.get('/api/cars', listCARs);
router.get('/api/cars/:id', getCAR);
router.post('/api/cars', createCAR);
router.patch('/api/cars/:id', updateCAR);
router.post('/api/cars/:id/containment', addContainmentAction);
router.post('/api/cars/:id/corrective', addCorrectiveAction);
router.post('/api/cars/:id/preventive', addPreventiveAction);
router.post('/api/cars/:id/root-cause', setRootCause);
router.post('/api/cars/:id/verify', verifyCAR);
router.post('/api/cars/:id/close', closeCAR);

// CAR actions
router.patch('/api/cars/:carId/actions/:actionId', updateAction);
router.post('/api/cars/:carId/actions/:actionId/complete', completeAction);

// Credit API
router.get('/api/credits', listCredits);
router.get('/api/credits/:id', getCredit);
router.post('/api/credits', createCreditRequest);
router.post('/api/credits/:id/approve', approveCredit);
router.post('/api/credits/:id/reject', rejectCredit);
router.post('/api/credits/:id/issue', issueCredit);

// Analytics API
router.get('/api/claims/analytics/summary', getClaimsSummary);
router.get('/api/claims/analytics/copq', getCostOfPoorQuality);
router.get('/api/claims/analytics/trends', getClaimTrends);
router.get('/api/claims/analytics/by-customer', getClaimsByCustomer);
router.get('/api/claims/analytics/by-type', getClaimsByType);

// Customer Portal API (authenticated by customer token)
router.get('/api/portal/claims', getCustomerClaims);
router.post('/api/portal/claims', submitCustomerClaim);
router.get('/api/portal/claims/:id', getCustomerClaimDetail);
router.post('/api/portal/claims/:id/message', sendCustomerMessage);
router.post('/api/portal/claims/:id/attachments', uploadCustomerAttachment);
router.get('/api/portal/rmas/:id', getCustomerRMADetail);
router.post('/api/portal/rmas/:id/tracking', updateRMATracking);
```

### Event System

```typescript
// Event definitions
type ClaimEvent = 
  | { type: 'claim.created'; payload: { claimId: string; customerId: string; claimType: string } }
  | { type: 'claim.acknowledged'; payload: { claimId: string; acknowledgedById: string } }
  | { type: 'claim.disposition_set'; payload: { claimId: string; disposition: string } }
  | { type: 'claim.resolved'; payload: { claimId: string } }
  | { type: 'claim.closed'; payload: { claimId: string; customerSatisfied: boolean } }
  | { type: 'claim.sla_warning'; payload: { claimId: string; slaType: string; hoursRemaining: number } }
  | { type: 'claim.sla_breached'; payload: { claimId: string; slaType: string } };

type RMAEvent =
  | { type: 'rma.requested'; payload: { rmaId: string; claimId: string } }
  | { type: 'rma.authorized'; payload: { rmaId: string; authorizedById: string } }
  | { type: 'rma.denied'; payload: { rmaId: string; reason: string } }
  | { type: 'rma.received'; payload: { rmaId: string; receivedById: string } }
  | { type: 'rma.inspected'; payload: { rmaId: string; passed: boolean } }
  | { type: 'rma.dispositioned'; payload: { rmaId: string; disposition: string } }
  | { type: 'rma.closed'; payload: { rmaId: string } }
  | { type: 'rma.expiring'; payload: { rmaId: string; daysUntilExpiry: number } }
  | { type: 'rma.expired'; payload: { rmaId: string } };

type CAREvent =
  | { type: 'car.opened'; payload: { carId: string; sourceType: string; sourceId: string } }
  | { type: 'car.containment_complete'; payload: { carId: string } }
  | { type: 'car.root_cause_identified'; payload: { carId: string; category: string } }
  | { type: 'car.action_due'; payload: { carId: string; actionId: string; daysUntilDue: number } }
  | { type: 'car.action_overdue'; payload: { carId: string; actionId: string } }
  | { type: 'car.verified'; payload: { carId: string; verifiedById: string } }
  | { type: 'car.closed'; payload: { carId: string } };

type CreditEvent =
  | { type: 'credit.requested'; payload: { creditId: string; amount: number; claimId: string } }
  | { type: 'credit.approved'; payload: { creditId: string; approvedById: string; level: number } }
  | { type: 'credit.rejected'; payload: { creditId: string; rejectedById: string; reason: string } }
  | { type: 'credit.issued'; payload: { creditId: string; creditMemoNumber: string } };

// Event handlers
eventBus.on('claim.created', async (event) => {
  // Auto-acknowledge if from customer portal
  // Send internal notification
  // Check for repeat customer issues
  // Start SLA timer
});

eventBus.on('rma.authorized', async (event) => {
  // Generate return label
  // Email customer with instructions
  // Update claim status
});

eventBus.on('rma.received', async (event) => {
  // Create quarantine inventory record
  // Notify QC for inspection
  // Update tracking
});

eventBus.on('car.opened', async (event) => {
  // Check if systemic (triggers stop-work review)
  // Assign default owner based on category
  // Set containment due date
});

eventBus.on('credit.approved', async (event) => {
  // Check if fully approved
  // Route to finance for processing
  // Update claim with credit info
});
```

### Webhook Integration

```typescript
// Webhook delivery for external systems
const WEBHOOK_EVENTS = [
  'claim.created',
  'claim.resolved',
  'rma.authorized',
  'rma.received',
  'credit.issued',
  'car.closed'
];

// POST to configured webhook URLs
async function deliverWebhook(event: ClaimEvent | RMAEvent | CAREvent | CreditEvent) {
  const webhooks = await prisma.webhook.findMany({
    where: { 
      events: { has: event.type },
      active: true 
    }
  });
  
  for (const webhook of webhooks) {
    const payload = {
      event: event.type,
      timestamp: new Date().toISOString(),
      data: event.payload
    };
    
    const signature = signPayload(payload, webhook.secret);
    
    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SteelWise-Signature': signature,
        'X-SteelWise-Event': event.type
      },
      body: JSON.stringify(payload)
    });
  }
}
```

---

## J) ANALYTICS & KPIs

### Core KPIs

| KPI | Formula | Target | Warning | Critical |
|-----|---------|--------|---------|----------|
| Claims per 1,000 orders | (Claims / Orders) × 1000 | < 5 | > 8 | > 15 |
| Avg acknowledgment time | Mean(acknowledgedAt - createdAt) | < 4 hrs | > 6 hrs | > 8 hrs |
| Avg resolution time | Mean(resolvedAt - createdAt) | < 7 days | > 10 days | > 14 days |
| SLA compliance rate | (On-time / Total) × 100 | > 95% | < 90% | < 80% |
| First response time | Mean(firstCommunication - createdAt) | < 2 hrs | > 4 hrs | > 8 hrs |
| Customer satisfaction | Satisfied / Total resolved | > 90% | < 85% | < 75% |
| Credit ratio | Credits / Revenue | < 0.5% | > 0.8% | > 1.2% |
| Cost of poor quality | Total COPQ / Revenue | < 2% | > 3% | > 5% |
| Repeat defect rate | Same defect in 90 days | < 5% | > 10% | > 20% |
| CAR closure rate | Closed on time / Total | > 90% | < 80% | < 70% |
| CAR effectiveness | No recurrence in 90 days | > 95% | < 90% | < 80% |

### Analytics Queries

```typescript
// Claims summary
async function getClaimsSummary(startDate: Date, endDate: Date) {
  const claims = await prisma.customerClaim.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      items: true,
      credits: true,
      costImpacts: true
    }
  });
  
  return {
    totalClaims: claims.length,
    
    byStatus: groupBy(claims, 'status'),
    byType: groupBy(claims, 'claimType'),
    bySeverity: groupBy(claims, 'severity'),
    
    avgAcknowledgmentHours: mean(
      claims
        .filter(c => c.acknowledgedAt)
        .map(c => diffHours(c.createdAt, c.acknowledgedAt))
    ),
    
    avgResolutionDays: mean(
      claims
        .filter(c => c.resolvedAt)
        .map(c => diffDays(c.createdAt, c.resolvedAt))
    ),
    
    slaCompliance: {
      acknowledgment: percent(
        claims.filter(c => c.acknowledgedAt && diffHours(c.createdAt, c.acknowledgedAt) <= 4),
        claims.filter(c => c.acknowledgedAt)
      ),
      resolution: percent(
        claims.filter(c => c.resolvedAt && diffDays(c.createdAt, c.resolvedAt) <= 10),
        claims.filter(c => c.resolvedAt)
      )
    },
    
    costOfPoorQuality: {
      credits: sum(claims.flatMap(c => c.credits).map(cr => cr.approvedAmount)),
      scrap: sum(claims.flatMap(c => c.costImpacts).filter(ci => ci.category === 'MATERIAL_SCRAP').map(ci => ci.amount)),
      rework: sum(claims.flatMap(c => c.costImpacts).filter(ci => ci.category === 'REWORK_LABOR').map(ci => ci.amount)),
      shipping: sum(claims.flatMap(c => c.costImpacts).filter(ci => ci.category === 'EXPEDITED_SHIPPING').map(ci => ci.amount)),
      total: sum(claims.flatMap(c => c.costImpacts).map(ci => ci.amount))
    }
  };
}

// Trend analysis
async function getClaimTrends(months: number = 12) {
  const startDate = subMonths(new Date(), months);
  
  const claims = await prisma.customerClaim.findMany({
    where: { createdAt: { gte: startDate } },
    include: { costImpacts: true }
  });
  
  const orders = await prisma.order.count({
    where: { createdAt: { gte: startDate } }
  });
  
  return {
    byMonth: groupByMonth(claims).map(month => ({
      month: month.key,
      claimCount: month.claims.length,
      claimsPerThousand: (month.claims.length / month.orderCount) * 1000,
      avgResolutionDays: mean(month.claims.map(c => diffDays(c.createdAt, c.resolvedAt))),
      copq: sum(month.claims.flatMap(c => c.costImpacts).map(ci => ci.amount))
    })),
    
    repeatDefects: await getRepeatDefects(startDate)
  };
}

// Repeat defect detection
async function getRepeatDefects(since: Date) {
  const claims = await prisma.customerClaim.findMany({
    where: { createdAt: { gte: since } },
    include: { items: true }
  });
  
  // Group by defect type + material + work center
  const defectGroups = groupBy(claims.flatMap(c => c.items), item => 
    `${item.issueType}-${item.productId}-${item.workCenterId}`
  );
  
  return Object.entries(defectGroups)
    .filter(([_, items]) => items.length >= 2)
    .map(([key, items]) => ({
      defectKey: key,
      count: items.length,
      firstOccurrence: min(items.map(i => i.createdAt)),
      lastOccurrence: max(items.map(i => i.createdAt)),
      hasCAR: items.some(i => i.claim?.cars?.length > 0)
    }));
}
```

### Dashboard Widgets

```typescript
// Executive dashboard data
async function getExecutiveDashboard() {
  const thisMonth = { gte: startOfMonth(new Date()) };
  const lastMonth = { 
    gte: startOfMonth(subMonths(new Date(), 1)),
    lt: startOfMonth(new Date())
  };
  
  return {
    // Current state
    openClaims: await prisma.customerClaim.count({
      where: { status: { notIn: ['CLOSED', 'CANCELLED'] } }
    }),
    
    overdueActions: await prisma.correctiveAction.count({
      where: { 
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() }
      }
    }),
    
    pendingCredits: await prisma.creditRequest.aggregate({
      where: { status: { in: ['PENDING', 'L1_APPROVED'] } },
      _sum: { requestedAmount: true },
      _count: true
    }),
    
    // This month vs last month
    claimsThisMonth: await prisma.customerClaim.count({ where: { createdAt: thisMonth } }),
    claimsLastMonth: await prisma.customerClaim.count({ where: { createdAt: lastMonth } }),
    
    copqThisMonth: await prisma.costImpactRecord.aggregate({
      where: { createdAt: thisMonth },
      _sum: { amount: true }
    }),
    copqLastMonth: await prisma.costImpactRecord.aggregate({
      where: { createdAt: lastMonth },
      _sum: { amount: true }
    }),
    
    // Top issues
    topDefectTypes: await getTopDefectTypes(5),
    topCustomersByClaimValue: await getTopCustomersByClaimValue(5),
    
    // SLA status
    slaAtRisk: await prisma.customerClaim.count({
      where: {
        status: { in: ['NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW'] },
        createdAt: { lt: subHours(new Date(), 36) } // Approaching SLA
      }
    })
  };
}
```

---

## K) AUDIT & EVIDENCE

### Audit Trail Requirements

Every significant action is logged:

```typescript
model AuditLog {
  id            String    @id @default(uuid())
  timestamp     DateTime  @default(now())
  
  // What changed
  entityType    String    // 'CustomerClaim', 'RMA', 'CAR', 'CreditRequest'
  entityId      String
  action        String    // 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'APPROVE', etc.
  
  // Who made the change
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  userRole      String
  
  // Change details
  previousState Json?
  newState      Json?
  changedFields String[]
  
  // Context
  ipAddress     String?
  userAgent     String?
  sessionId     String?
  
  // Notes
  reason        String?   // Required for some actions
  
  @@index([entityType, entityId])
  @@index([userId])
  @@index([timestamp])
}
```

### Required Evidence by Process

| Process | Required Evidence |
|---------|------------------|
| Claim acknowledgment | Timestamp, user, auto-email confirmation |
| Claim investigation | Traceability lookup, QC data reviewed |
| RMA authorization | Approver, reason, expiration date |
| Material receipt | Receiver ID, condition photos, weight/count |
| Inspection | Inspector certification, measurements, photos |
| Disposition | Approver, inventory transaction, cost calculation |
| Credit approval | All approvers in chain, amounts, GL coding |
| CAR root cause | 5-whys document, evidence links |
| CAR closure | Verification evidence, effectiveness check |

### Evidence Retention

| Record Type | Retention Period | Storage |
|-------------|-----------------|---------|
| Claim records | 7 years | Database |
| Communications | 7 years | Database |
| Attachments/photos | 7 years | Object storage |
| RMA records | 7 years | Database |
| CAR records | 10 years | Database |
| Audit logs | 10 years | Append-only storage |
| Credit records | 7 years | Database + Finance system |

### Compliance Reports

```typescript
// Generate audit report for claim
async function generateClaimAuditReport(claimId: string): Promise<AuditReport> {
  const claim = await prisma.customerClaim.findUnique({
    where: { id: claimId },
    include: {
      items: true,
      rmas: { include: { items: true } },
      cars: { include: { containmentActions: true, correctiveActions: true } },
      credits: true,
      communications: true,
      attachments: true,
      costImpacts: true
    }
  });
  
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'CustomerClaim', entityId: claimId },
    orderBy: { timestamp: 'asc' }
  });
  
  return {
    claim,
    timeline: auditLogs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      user: log.user.name,
      details: log.newState
    })),
    
    traceability: {
      orders: claim.orderId ? [claim.order] : [],
      shipments: claim.shipmentId ? [claim.shipment] : [],
      jobs: claim.items.map(i => i.job).filter(Boolean),
      heats: [...new Set(claim.items.map(i => i.heatNumber).filter(Boolean))],
      materials: claim.items.map(i => ({ 
        productId: i.productId,
        heatNumber: i.heatNumber,
        lotNumber: i.lotNumber
      }))
    },
    
    financialImpact: {
      creditsIssued: sum(claim.credits.map(c => c.approvedAmount)),
      costOfPoorQuality: sum(claim.costImpacts.map(c => c.amount)),
      breakdown: groupBy(claim.costImpacts, 'category')
    },
    
    correctiveActions: claim.cars.map(car => ({
      carNumber: car.carNumber,
      status: car.status,
      rootCause: car.rootCauseStatement,
      actions: [
        ...car.containmentActions,
        ...car.correctiveActions
      ]
    })),
    
    attachments: claim.attachments.map(a => ({
      fileName: a.fileName,
      uploadedBy: a.uploadedBy.name,
      uploadedAt: a.uploadedAt,
      category: a.category
    }))
  };
}
```

---

## L) TESTING & VALIDATION

### Unit Tests

```typescript
// claims.test.ts
describe('Customer Claims', () => {
  describe('Claim Creation', () => {
    it('should create claim with required fields', async () => {
      const claim = await createClaim({
        customerId: 'cust-1',
        claimType: 'QUALITY_DEFECT',
        description: 'Material thickness out of spec',
        orderId: 'order-1'
      });
      
      expect(claim.claimNumber).toMatch(/^CLM-\d{4}-\d{6}$/);
      expect(claim.status).toBe('NEW');
    });
    
    it('should link claim to order traceability', async () => {
      const claim = await createClaim({
        customerId: 'cust-1',
        claimType: 'WRONG_MATERIAL',
        orderId: 'order-with-traceability'
      });
      
      const traceability = await getClaimTraceability(claim.id);
      expect(traceability.jobs).toHaveLength(1);
      expect(traceability.heats).toContain('H12345');
    });
    
    it('should enforce SLA timers on claim creation', async () => {
      const claim = await createClaim({ ... });
      
      const slaRecords = await getSLARecords(claim.id);
      expect(slaRecords).toContainEqual({
        type: 'ACKNOWLEDGMENT',
        dueAt: expect.any(Date),
        status: 'PENDING'
      });
    });
  });
  
  describe('Claim Workflow', () => {
    it('should not allow disposition without investigation', async () => {
      const claim = await createClaim({ ... });
      await acknowledgeClaim(claim.id);
      
      await expect(
        setClaimDisposition(claim.id, { disposition: 'CREDIT_FULL' })
      ).rejects.toThrow('Claim must be under review before setting disposition');
    });
    
    it('should auto-create CAR for high-value claims', async () => {
      const claim = await createClaim({
        claimedAmount: 5000,
        ...
      });
      
      await setClaimDisposition(claim.id, { disposition: 'CREDIT_FULL' });
      
      const cars = await prisma.correctiveActionReport.findMany({
        where: { claimId: claim.id }
      });
      expect(cars).toHaveLength(1);
    });
  });
});

// rma.test.ts
describe('RMA Processing', () => {
  it('should block receipt without authorization', async () => {
    const rma = await createRMA({ claimId: 'claim-1' });
    
    await expect(
      receiveRMA(rma.id, { receivedQty: 100 })
    ).rejects.toThrow('RMA must be authorized before receiving');
  });
  
  it('should create quarantine inventory on receipt', async () => {
    const rma = await createRMA({ claimId: 'claim-1' });
    await authorizeRMA(rma.id);
    await receiveRMA(rma.id, { receivedQty: 100 });
    
    const inventory = await prisma.inventoryMovement.findFirst({
      where: { 
        referenceType: 'RMA',
        referenceId: rma.id
      }
    });
    
    expect(inventory.toLocationId).toBe(QUARANTINE_LOCATION_ID);
  });
  
  it('should generate rework job on REWORK disposition', async () => {
    const rma = await createRMA({ claimId: 'claim-1' });
    await authorizeRMA(rma.id);
    await receiveRMA(rma.id, { receivedQty: 100 });
    await inspectRMA(rma.id, { passed: false });
    await setRMADisposition(rma.id, { disposition: 'REWORK' });
    
    const updatedRMA = await getRMA(rma.id);
    expect(updatedRMA.reworkJobId).toBeDefined();
    
    const job = await prisma.job.findUnique({
      where: { id: updatedRMA.reworkJobId }
    });
    expect(job.jobType).toBe('REWORK');
    expect(job.priority).toBe(4);
  });
});

// credit.test.ts
describe('Credit Approval', () => {
  it('should require L2 approval for credits > $500', async () => {
    const credit = await createCreditRequest({
      claimId: 'claim-1',
      requestedAmount: 750
    });
    
    await approveCredit(credit.id, { level: 1, approverId: 'mgr-1' });
    
    const updated = await getCredit(credit.id);
    expect(updated.status).toBe('L1_APPROVED');
    expect(updated.status).not.toBe('APPROVED');
  });
  
  it('should prevent non-finance from issuing credits', async () => {
    const credit = await createCreditRequest({ ... });
    await approveCredit(credit.id, { level: 1 });
    
    await expect(
      issueCredit(credit.id, { userId: 'non-finance-user' })
    ).rejects.toThrow('Only Finance can issue credits');
  });
});
```

### Integration Tests

```typescript
// Full claim lifecycle
describe('End-to-End Claim Processing', () => {
  it('should process claim from submission to closure', async () => {
    // 1. Customer submits claim
    const claim = await createClaim({
      customerId: testCustomer.id,
      claimType: 'QUALITY_DEFECT',
      description: 'Material failed tensile test',
      orderId: testOrder.id,
      items: [{
        productId: testProduct.id,
        issueType: 'QUALITY_DEFECT',
        claimedQty: 500,
        claimedUom: 'LB'
      }]
    });
    
    // 2. CSR acknowledges
    await acknowledgeClaim(claim.id);
    expect((await getClaim(claim.id)).status).toBe('ACKNOWLEDGED');
    
    // 3. Quality investigates
    await startInvestigation(claim.id);
    const traceability = await getClaimTraceability(claim.id);
    expect(traceability.heats).toContain(testHeat.heatNumber);
    
    // 4. Set disposition - full credit with RMA
    await setClaimDisposition(claim.id, {
      disposition: 'CREDIT_FULL',
      requiresRMA: true
    });
    
    // 5. Authorize RMA
    const rmas = await prisma.rMA.findMany({ where: { claimId: claim.id } });
    expect(rmas).toHaveLength(1);
    await authorizeRMA(rmas[0].id);
    
    // 6. Customer returns material
    await receiveRMA(rmas[0].id, { receivedQty: 500 });
    await inspectRMA(rmas[0].id, { passed: false, notes: 'Confirmed defect' });
    await setRMADisposition(rmas[0].id, { disposition: 'SCRAP' });
    
    // 7. Credit approved and issued
    const credits = await prisma.creditRequest.findMany({ where: { claimId: claim.id } });
    await approveCredit(credits[0].id, { level: 1 });
    await issueCredit(credits[0].id, { creditMemoNumber: 'CM-001' });
    
    // 8. CAR created and closed
    const cars = await prisma.correctiveActionReport.findMany({ where: { claimId: claim.id } });
    expect(cars).toHaveLength(1);
    
    // 9. Resolve and close claim
    await resolveClaim(claim.id);
    await closeClaim(claim.id, { customerSatisfied: true });
    
    // Verify final state
    const finalClaim = await getClaim(claim.id);
    expect(finalClaim.status).toBe('CLOSED');
    expect(finalClaim.customerSatisfied).toBe(true);
    
    // Verify cost tracking
    const costs = await prisma.costImpactRecord.findMany({ where: { claimId: claim.id } });
    expect(costs.map(c => c.category)).toContain('CREDIT_ISSUED');
    expect(costs.map(c => c.category)).toContain('MATERIAL_SCRAP');
  });
});
```

### Customer Portal Tests

```typescript
describe('Customer Portal', () => {
  it('should only show customer their own claims', async () => {
    const claims = await getCustomerClaims(customerToken);
    
    claims.forEach(claim => {
      expect(claim.customerId).toBe(testCustomer.id);
    });
  });
  
  it('should hide internal notes from customer view', async () => {
    const internalNote = await sendCommunication(claim.id, {
      direction: 'INTERNAL',
      body: 'Internal discussion...',
      visibleToCustomer: false
    });
    
    const customerComms = await getCustomerClaimDetail(claim.id, customerToken);
    expect(customerComms.communications).not.toContainEqual(
      expect.objectContaining({ id: internalNote.id })
    );
  });
  
  it('should send email on claim status change', async () => {
    await acknowledgeClaim(claim.id);
    
    const emails = await getEmailsSentTo(testCustomer.email);
    expect(emails).toContainEqual(
      expect.objectContaining({
        subject: expect.stringContaining(claim.claimNumber),
        body: expect.stringContaining('acknowledged')
      })
    );
  });
});
```

---

## M) ROLLOUT & GO/NO-GO CRITERIA

### Phased Rollout Plan

#### Phase 1: Internal Testing (2 weeks)

**Scope:**
- Claims creation and workflow
- RMA authorization (no physical returns yet)
- CAR creation and tracking
- Credit request workflow

**Success Criteria:**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] 5 internal test claims processed end-to-end
- [ ] No blocking bugs

#### Phase 2: Pilot Customers (4 weeks)

**Scope:**
- 5-10 selected customers with good relationships
- Full claim-to-resolution workflow
- Customer portal access
- Real RMA processing

**Selection Criteria for Pilot Customers:**
- Medium volume (5-20 orders/month)
- History of occasional claims
- Good relationship with sales rep
- Willing to provide feedback

**Success Metrics:**
| Metric | Target | Minimum |
|--------|--------|---------|
| Acknowledgment SLA | 95% < 4 hrs | 80% |
| Resolution SLA | 90% < 10 days | 70% |
| Customer satisfaction | > 85% | > 70% |
| System uptime | 99.5% | 99% |
| Zero critical bugs | 0 | 0 |

#### Phase 3: Gradual Expansion (4 weeks)

**Scope:**
- Roll out to 50% of customers
- Full analytics and reporting
- Finance integration for credits

**Success Metrics:**
| Metric | Target | Minimum |
|--------|--------|---------|
| Acknowledgment SLA | 95% < 4 hrs | 90% |
| Resolution SLA | 90% < 10 days | 85% |
| Credit processing time | < 48 hrs | < 72 hrs |
| CAR closure rate | > 85% | > 75% |

#### Phase 4: Full Deployment (2 weeks)

**Scope:**
- All customers
- Legacy system retirement
- Full training complete

### Go/No-Go Checklist

#### Technical Readiness

- [ ] All P0/P1 bugs resolved
- [ ] Performance benchmarks met (< 2s page load)
- [ ] Security audit passed
- [ ] Backup/recovery tested
- [ ] Monitoring and alerting configured
- [ ] Runbook documented

#### Process Readiness

- [ ] SLAs defined and agreed
- [ ] Escalation procedures documented
- [ ] Role assignments complete
- [ ] Approval thresholds configured
- [ ] Customer communication templates approved

#### Training Readiness

- [ ] CSR training complete (4 hrs)
- [ ] Sales training complete (2 hrs)
- [ ] Quality training complete (4 hrs)
- [ ] Ops manager training complete (2 hrs)
- [ ] Finance training complete (2 hrs)
- [ ] Training materials available

#### Customer Readiness

- [ ] Customer portal tested
- [ ] Customer notification sent
- [ ] FAQ/help documentation published
- [ ] Support channel ready

### Rollback Plan

If critical issues arise:

1. **Customer portal** can be disabled independently
2. **Claims** can revert to email/phone with manual tracking
3. **RMAs** can use PDF-based authorization
4. **Credits** can process through legacy finance system

### Success Metrics (6-Month Review)

| Metric | Baseline | Target | Stretch |
|--------|----------|--------|---------|
| Claims per 1,000 orders | 12 | 8 | 5 |
| Avg resolution time | 14 days | 7 days | 5 days |
| Customer satisfaction | 72% | 85% | 92% |
| COPQ as % of revenue | 3.2% | 2.0% | 1.5% |
| Repeat defect rate | 18% | 10% | 5% |
| CAR effectiveness | N/A | 90% | 95% |

---

## IMPLEMENTATION PRIORITY

### Must Have (Phase 1)

1. CustomerClaim entity and CRUD
2. Claim workflow state machine
3. RMA creation and authorization
4. Basic credit request
5. Claims inbox UI
6. Email notifications

### Should Have (Phase 2)

1. Customer portal
2. CAR workflow
3. Full credit approval chain
4. Traceability integration
5. Cost tracking
6. Analytics dashboard

### Nice to Have (Phase 3)

1. 5-whys wizard
2. SPC integration
3. Supplier CAR flow
4. Mobile inspection app
5. Predictive analytics
6. Customer satisfaction surveys

---

*This design specification provides a complete blueprint for the Customer Nonconformance & RMA/CAR module. Implementation should follow the phased approach with continuous feedback integration.*
