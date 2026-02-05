# 95 - DROP TAG ENGINE
## Complete Material Identity & Fulfillment Traceability System

**Version:** 1.0  
**Module Code:** DROP-TAG  
**Author:** Principal Manufacturing Identity & Fulfillment Systems Architect  
**Date:** 2026-02-05

---

## Table of Contents
- [A) What the Drop Tag Engine Does (Start→Finish)](#a-what-the-drop-tag-engine-does)
- [B) Core Objects & Data Model](#b-core-objects--data-model)
- [C) State Machines](#c-state-machines)
- [D) Drop Tag Business Rules (Validation)](#d-drop-tag-business-rules)
- [E) Drop Tag Listing Rules (Shipment Manifest)](#e-drop-tag-listing-rules)
- [F) Label/Tag Template System](#f-labeltag-template-system)
- [G) Scan Workflow](#g-scan-workflow)
- [H) UI/UX (Material UI Screens)](#h-uiux-screens)
- [I) Roles & Permissions](#i-roles--permissions)
- [J) APIs (Endpoint-by-Endpoint)](#j-apis)
- [K) Events + Audit Trail](#k-events--audit-trail)
- [L) Testing Plan](#l-testing-plan)
- [M) Seed Templates + Sample Payloads](#m-seed-templates--sample-payloads)

---

## A) WHAT THE DROP TAG ENGINE DOES (START→FINISH)

### End-to-End Workflow

The Drop Tag Engine provides **immutable material identity** from production completion through customer delivery, ensuring every piece of metal or plastic can be traced back to its source heat/lot, processing history, and quality release.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DROP TAG ENGINE LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PRODUCTION COMPLETE                                                     │
│     └─► Job operation(s) finish → quantity produced confirmed              │
│         └─► Operator records actual pieces, weight, dimensions              │
│                                                                             │
│  2. QC RELEASE                                                              │
│     └─► QC Inspector verifies order line / lot / spec compliance           │
│         └─► Release status: RELEASED | CONDITIONAL_RELEASE | HOLD          │
│         └─► Links MTR/CoC documents to inventory lots                      │
│                                                                             │
│  3. PACKAGING                                                               │
│     └─► Packaging Operator creates Package(s)                              │
│         └─► Assigns produced pieces/lots to packages                       │
│         └─► System validates grade/heat/spec consistency                   │
│         └─► Package status: OPEN → PACKING → READY_FOR_QC → QC_RELEASED    │
│                                                                             │
│  4. DROP TAG GENERATION                                                     │
│     └─► System generates DropTag per package (or per piece if required)    │
│         └─► DropTag contains complete material identity:                   │
│             • Order/Line/Customer/PO                                        │
│             • Grade/Form/Spec/Dimensions                                    │
│             • Heat/Lot/MTR/CoC references                                  │
│             • Processing operations summary                                 │
│             • Weight/Piece count                                            │
│         └─► Unique dropTagId (barcode/QR encoded)                          │
│         └─► Status: DRAFT → READY_TO_PRINT                                 │
│                                                                             │
│  5. PRINT & APPLY                                                           │
│     └─► Operator prints tags at designated print station                   │
│         └─► Tags show all identity + barcode/QR                            │
│         └─► Operator applies tag to physical package                       │
│         └─► Scan confirms tag-to-package binding                           │
│         └─► Status: PRINTED → APPLIED                                       │
│                                                                             │
│  6. SEAL PACKAGE                                                            │
│     └─► Package sealed with tamper-evident seal                            │
│         └─► Seal ID recorded                                                │
│         └─► DROP TAG IDENTITY BECOMES IMMUTABLE                            │
│         └─► Status: SEALED (reprint allowed but audited)                   │
│                                                                             │
│  7. DROP TAG LISTING (SHIPMENT MANIFEST)                                    │
│     └─► Logistics creates DropTagListing for shipment/route               │
│         └─► Groups all drop tags by stop sequence                          │
│         └─► Aggregates totals (packages, pieces, weight)                   │
│         └─► Links CoC/MTR document bundles                                 │
│         └─► Generates packing list / manifest                              │
│                                                                             │
│  8. STAGE & LOAD                                                            │
│     └─► Packages moved to staging area (scan confirms)                     │
│     └─► Loader scans packages onto truck                                   │
│         └─► System validates stop grouping                                 │
│         └─► Warns on stop sequence violations                              │
│     └─► Listing locked when truck departs                                  │
│                                                                             │
│  9. DELIVER & CONFIRM                                                       │
│     └─► Driver delivers per route stops                                    │
│     └─► Customer signs POD (Proof of Delivery)                             │
│     └─► POD links back to DropTagListing                                   │
│     └─► Custody chain closes                                               │
│     └─► Status: DELIVERED → CLOSED                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **System-Generated Identity**: Drop tags derive ALL material identity from system data—no free-typed material descriptions
2. **QC Gate**: No tags print until QC release (or approved conditional release with audit)
3. **Immutability After Seal**: Once sealed, tag identity cannot change; reprints are audited
4. **Mixed-Material Prevention**: System enforces grade/form/heat consistency per package
5. **Full Traceability**: Every print, scan, seal, load, deliver event is immutably logged
6. **Multi-Location/Multi-Stop**: Supports complex routing with stop-level validation

---

## B) CORE OBJECTS & DATA MODEL

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Order     │────▶│  OrderLine   │────▶│     Job      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │     │  Inventory   │     │  Operation   │
│              │     │   (Lots)     │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Package    │◀─────────┐
                     │              │          │
                     └──────────────┘          │
                            │                  │
                            ▼                  │
                     ┌──────────────┐          │
                     │   DropTag    │──────────┘
                     │              │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐     ┌──────────────┐
                     │DropTagListing│────▶│   Shipment   │
                     │              │     │              │
                     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  TraceEvent  │
                     │  (Immutable) │
                     └──────────────┘
```

### 1. DropTag Entity

```prisma
model DropTag {
  id                String          @id @default(uuid())
  dropTagId         String          @unique  // Human-friendly: DT-2026-001234
  tenantId          String?
  
  // Package Association (required)
  packageId         String
  package           Package         @relation(fields: [packageId], references: [id])
  
  // Shipment Association (assigned later)
  shipmentId        String?
  shipment          Shipment?       @relation(fields: [shipmentId], references: [id])
  listingId         String?
  listing           DropTagListing? @relation(fields: [listingId], references: [id])
  
  // Order Context
  orderId           String
  order             Order           @relation(fields: [orderId], references: [id])
  orderLineId       String
  orderLine         OrderLine       @relation(fields: [orderLineId], references: [id])
  jobId             String?
  job               Job?            @relation(fields: [jobId], references: [id])
  
  // Customer Context
  customerId        String
  customer          Organization    @relation(fields: [customerId], references: [id])
  customerPO        String?
  customerPartNo    String?
  
  // Material Identity (denormalized from inventory for immutability)
  division          String          // STEEL, ALUMINUM, PLASTICS, STAINLESS
  form              String          // ROUND_BAR, FLAT_BAR, PLATE, TUBE, SHEET
  grade             String          // 4140, 1018, 6061-T6, etc.
  specification     String?         // ASTM A108, AMS 2759, etc.
  condition         String?         // HR, CF, Q&T, ANNEALED
  dimensions        Json            // {od, id, width, thickness, etc.}
  lengthInches      Decimal?
  lengthFeet        Decimal?
  
  // Trace Identity
  heatNumber        String?
  lotId             String?
  inventoryLotId    String?
  supplierId        String?
  mtrDocId          String?         // Mill Test Report document ID
  cocDocId          String?         // Certificate of Conformance document ID
  
  // Quantity
  pieces            Int
  weightLbs         Decimal
  uom               String          @default("EA")  // EA, LB, FT, etc.
  
  // Processing Summary
  workCenters       String[]        // Work centers that processed this material
  operationsSummary String?         // Brief text summary of operations
  completedAt       DateTime?
  operatorIds       String[]        // User IDs of operators who processed
  
  // Handling Instructions
  bundleType        String?         // BANDED, BOXED, WRAPPED, CRATED
  packagingNotes    String?
  specialInstructions String?
  
  // Destination
  shipToAddress     Json?           // {name, line1, line2, city, state, zip}
  routeStop         Int?            // Stop sequence number
  requiredDate      DateTime?
  
  // Status & Lifecycle
  status            DropTagStatus   @default(DRAFT)
  version           Int             @default(1)
  reprintCount      Int             @default(0)
  lastReprintReason String?
  
  // Identifier Bindings (for RFID/etch future)
  identifiers       TagIdentifier[]
  
  // Timestamps & Audit
  createdBy         String
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  printedBy         String?
  printedAt         DateTime?
  appliedBy         String?
  appliedAt         DateTime?
  sealedAt          DateTime?
  voidedBy          String?
  voidedAt          DateTime?
  voidReason        String?
  
  // Trace Events
  traceEvents       TraceEvent[]    @relation("DropTagEvents")
  
  @@index([packageId])
  @@index([shipmentId])
  @@index([orderId])
  @@index([customerId])
  @@index([heatNumber])
  @@index([status])
  @@index([dropTagId])
}

enum DropTagStatus {
  DRAFT             // Just created, not yet ready
  READY_TO_PRINT    // All validations passed, ready for printing
  PRINTED           // Tag printed but not yet applied
  APPLIED           // Tag physically applied to package
  SEALED            // Package sealed, identity immutable
  STAGED            // Package in staging area
  LOADED            // Package loaded on truck
  SHIPPED           // Truck departed
  DELIVERED         // Delivery confirmed
  VOID              // Voided (before ship only without escalation)
}
```

### 2. DropTagListing Entity

```prisma
model DropTagListing {
  id                String              @id @default(uuid())
  listingId         String              @unique  // Human-friendly: DTL-2026-001234
  tenantId          String?
  
  // Shipment Association
  shipmentId        String
  shipment          Shipment            @relation(fields: [shipmentId], references: [id])
  
  // Location & Route
  originLocationId  String
  originLocation    Location            @relation("ListingOrigin", fields: [originLocationId], references: [id])
  routeId           String?
  loadId            String?
  
  // Stop Sequence
  stopSequence      Json                // [{stop: 1, customerId, shipTo, dropTagIds: [...]}]
  
  // Drop Tags
  dropTags          DropTag[]
  
  // Aggregated Totals (computed)
  totalPackages     Int                 @default(0)
  totalPieces       Int                 @default(0)
  totalWeightLbs    Decimal             @default(0)
  
  // Linked Documents
  cocBundleId       String?             // Combined CoC document bundle
  mtrBundleId       String?             // Combined MTR document bundle
  packingListDocId  String?             // Generated packing list
  
  // Status
  status            ListingStatus       @default(DRAFT)
  lockedAt          DateTime?
  lockedBy          String?
  
  // Timestamps
  createdBy         String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  departedAt        DateTime?
  deliveredAt       DateTime?
  closedAt          DateTime?
  
  // Proof of Delivery
  podDocId          String?
  podSignature      String?
  podSignedBy       String?
  podSignedAt       DateTime?
  
  @@index([shipmentId])
  @@index([originLocationId])
  @@index([status])
}

enum ListingStatus {
  DRAFT             // Being assembled
  READY             // All tags assigned, ready for print
  PRINTED           // Manifest printed
  LOADED            // All packages loaded
  DEPARTED          // Truck left
  DELIVERED         // All stops confirmed
  CLOSED            // Custody chain closed
}
```

### 3. Package Entity (Extended)

```prisma
model Package {
  id                String          @id @default(uuid())
  packageId         String          @unique  // Human-friendly: PKG-2026-001234
  tenantId          String?
  
  // Status
  status            PackageStatus   @default(OPEN)
  
  // Seal (required after SEALED)
  sealId            String?
  sealType          String?         // BAND, STRAP, SHRINK, LOCK
  sealAppliedBy     String?
  sealAppliedAt     DateTime?
  
  // Package Specification
  packageType       String          // BUNDLE, SKID, BOX, CRATE, DRUM
  dimensions        Json?           // {length, width, height, unit}
  tareWeightLbs     Decimal?
  grossWeightLbs    Decimal?
  netWeightLbs      Decimal?
  
  // Contents
  packageItems      PackageItem[]
  dropTags          DropTag[]
  
  // Location Tracking
  currentLocationId String?
  currentBinId      String?
  
  // Order/Job Context
  orderId           String?
  orderLineId       String?
  jobId             String?
  
  // QC Status
  qcStatus          QCReleaseStatus @default(PENDING)
  qcReleasedBy      String?
  qcReleasedAt      DateTime?
  qcNotes           String?
  
  // Timestamps
  createdBy         String
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  packedAt          DateTime?
  stagedAt          DateTime?
  loadedAt          DateTime?
  shippedAt         DateTime?
  deliveredAt       DateTime?
  
  @@index([status])
  @@index([orderId])
  @@index([currentLocationId])
}

enum PackageStatus {
  OPEN              // Being created
  PACKING           // Items being added
  READY_FOR_QC      // Awaiting QC inspection
  QC_RELEASED       // QC approved, ready for tagging
  SEALED            // Sealed with tamper-evident seal
  STAGED            // In staging area
  LOADED            // On truck
  SHIPPED           // In transit
  DELIVERED         // At customer
}

enum QCReleaseStatus {
  PENDING           // Not yet reviewed
  RELEASED          // Full release
  CONDITIONAL       // Released with conditions (needs approval)
  HOLD              // On hold, cannot proceed
  REJECTED          // Failed inspection
}
```

### 4. PackageItem Entity

```prisma
model PackageItem {
  id                String      @id @default(uuid())
  packageId         String
  package           Package     @relation(fields: [packageId], references: [id])
  
  // Material Reference
  inventoryLotId    String?
  heatNumber        String?
  
  // Material Details (snapshot)
  grade             String
  form              String
  dimensions        Json
  
  // Quantity
  pieces            Int
  weightLbs         Decimal
  lengthFeet        Decimal?
  
  // Piece Marks (if applicable)
  pieceMarks        String[]
  
  createdAt         DateTime    @default(now())
  
  @@index([packageId])
  @@index([inventoryLotId])
}
```

### 5. TagIdentifier Entity (Future RFID/Etch)

```prisma
model TagIdentifier {
  id                String          @id @default(uuid())
  dropTagId         String
  dropTag           DropTag         @relation(fields: [dropTagId], references: [id])
  
  identifierType    IdentifierType
  identifierValue   String
  isPrimary         Boolean         @default(false)
  
  createdAt         DateTime        @default(now())
  
  @@unique([identifierType, identifierValue])
  @@index([dropTagId])
}

enum IdentifierType {
  BARCODE           // 1D barcode
  QR                // QR code
  RFID              // RFID tag
  ETCH              // Steel etching
  DATAMATRIX        // DataMatrix code
}
```

### 6. LabelTemplate Entity

```prisma
model LabelTemplate {
  id                String      @id @default(uuid())
  tenantId          String?
  
  name              String
  code              String      @unique  // BUNDLE_TAG, PIECE_TAG, etc.
  description       String?
  
  // Template Type
  templateType      String      // BUNDLE_TAG, PIECE_TAG, SKID_LABEL
  mediaType         String      // PAPER, PLASTIC, METAL_PLATE
  
  // Dimensions
  widthInches       Decimal
  heightInches      Decimal
  
  // Template Content (HTML or structured layout)
  templateContent   String      @db.Text
  
  // Barcode Settings
  barcodeType       String      @default("QR")  // QR, CODE128, CODE39
  barcodePosition   Json        // {x, y, width, height}
  
  // Customer Specific
  customerId        String?     // If specific to a customer
  
  // Status
  isActive          Boolean     @default(true)
  isDefault         Boolean     @default(false)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([code])
  @@index([customerId])
}
```

### 7. TraceEvent Entity (Extended for Drop Tags)

```prisma
model TraceEvent {
  id                String      @id @default(uuid())
  eventId           String      @unique @default(uuid())
  
  // Event Classification
  eventType         String      // DROP_TAG_GENERATED, DROP_TAG_PRINTED, etc.
  eventCategory     String      // DROP_TAG, PACKAGE, SHIPMENT, LISTING
  
  // Actor
  actorUserId       String
  actorRole         String
  actorName         String?
  
  // Resource
  resourceType      String      // DropTag, Package, DropTagListing, Shipment
  resourceId        String
  
  // State Change
  previousState     String?
  newState          String?
  
  // Context
  locationId        String?
  stationId         String?     // Print station, scan station, etc.
  
  // Payload (full before/after snapshots)
  beforeSnapshot    Json?
  afterSnapshot     Json?
  metadata          Json?       // Additional context
  
  // Correlation
  correlationId     String?     // Links related events
  orderId           String?
  shipmentId        String?
  
  // Timestamp (immutable)
  occurredAt        DateTime    @default(now())
  
  // Immutability hash
  eventHash         String?     // SHA-256 of event content
  previousHash      String?     // Chain to previous event
  
  @@index([resourceType, resourceId])
  @@index([eventType])
  @@index([actorUserId])
  @@index([orderId])
  @@index([shipmentId])
  @@index([correlationId])
  @@index([occurredAt])
}
```

### Indexes and Constraints Summary

```sql
-- Unique constraints
CREATE UNIQUE INDEX idx_drop_tag_id ON "DropTag"("dropTagId");
CREATE UNIQUE INDEX idx_listing_id ON "DropTagListing"("listingId");
CREATE UNIQUE INDEX idx_package_id ON "Package"("packageId");

-- Composite indexes for common queries
CREATE INDEX idx_drop_tag_status_location ON "DropTag"("status", "shipmentId");
CREATE INDEX idx_drop_tag_order_heat ON "DropTag"("orderId", "heatNumber");
CREATE INDEX idx_package_status_order ON "Package"("status", "orderId");

-- Text search indexes
CREATE INDEX idx_drop_tag_search ON "DropTag" USING gin(to_tsvector('english', "grade" || ' ' || "heatNumber"));
```

---

## C) STATE MACHINES

### 1. DropTag State Machine

```
                            ┌─────────────────────────────────────────┐
                            │          DROP TAG STATES                │
                            └─────────────────────────────────────────┘

    ┌──────────┐                                                      
    │          │  generate()                                          
    │  (new)   │─────────────▶┌──────────┐                            
    │          │              │  DRAFT   │                            
    └──────────┘              └────┬─────┘                            
                                   │ validate() ✓                     
                                   ▼                                  
                            ┌──────────────┐                          
                            │READY_TO_PRINT│◀─────────────────┐       
                            └──────┬───────┘                  │       
                                   │ print()                  │       
                                   ▼                          │       
                            ┌──────────┐                      │       
                            │ PRINTED  │                      │       
                            └────┬─────┘                      │       
                                 │ apply() [scan confirm]     │ unvoid()
                                 ▼                            │ (escalated)
                            ┌──────────┐                      │       
                            │ APPLIED  │──────────────────────┤       
                            └────┬─────┘       void()         │       
                                 │ seal()      (pre-ship)     │       
                                 ▼                            │       
                            ┌──────────┐                      │       
                            │  SEALED  │──────────────────────┤       
                            └────┬─────┘       void()         │       
                                 │ stage()     (pre-ship)     │       
                                 ▼                            │       
                            ┌──────────┐                      │       
                            │  STAGED  │──────────────────────┤       
                            └────┬─────┘       void()         │       
                                 │ load()      (pre-ship)     │       
                                 ▼                            │       
                            ┌──────────┐                      │       
                            │  LOADED  │──────────────────────┘       
                            └────┬─────┘       void() requires        
                                 │             escalation + claim     
                                 │ depart()                           
                                 ▼                                    
                            ┌──────────┐                              
                            │ SHIPPED  │─────────────────────▶ VOID   
                            └────┬─────┘  void() requires             
                                 │        executive approval          
                                 │ deliver()  + claim linkage         
                                 ▼                                    
                            ┌──────────┐                              
                            │DELIVERED │                              
                            └──────────┘                              
                                                                      
                            ╔══════════╗                              
                            ║   VOID   ║  (terminal state)            
                            ╚══════════╝                              
```

#### Transition Rules

| From State | To State | Action | Required Data | Validations |
|------------|----------|--------|---------------|-------------|
| (new) | DRAFT | generate() | packageId, orderId, orderLineId | Package exists, OrderLine exists |
| DRAFT | READY_TO_PRINT | validate() | - | QC released, material data complete, no mixed materials |
| READY_TO_PRINT | PRINTED | print() | stationId, printedBy | Template selected, printer available |
| PRINTED | APPLIED | apply() | scanConfirm, appliedBy | Scan matches dropTagId, package in PACKING |
| APPLIED | SEALED | seal() | sealId, sealedBy | Package QC_RELEASED, seal ID valid |
| SEALED | STAGED | stage() | locationId, binId | Staging location exists |
| STAGED | LOADED | load() | shipmentId, stopSequence | Shipment exists, stop matches |
| LOADED | SHIPPED | depart() | - | Listing locked, all tags loaded |
| SHIPPED | DELIVERED | deliver() | podDocId | POD captured |
| * (pre-ship) | VOID | void() | reason, voidedBy | Pre-departure: supervisor approval |
| * (post-ship) | VOID | void() | reason, claimId, execApproval | Post-departure: executive + claim |

### 2. DropTagListing State Machine

```
    ┌──────────┐  create()    ┌──────────┐                            
    │  (new)   │─────────────▶│  DRAFT   │                            
    └──────────┘              └────┬─────┘                            
                                   │ addTags() + finalize()           
                                   ▼                                  
                            ┌──────────┐                              
                            │  READY   │                              
                            └────┬─────┘                              
                                 │ print()                            
                                 ▼                                    
                            ┌──────────┐                              
                            │ PRINTED  │                              
                            └────┬─────┘                              
                                 │ confirmAllLoaded()                 
                                 ▼                                    
                            ┌──────────┐                              
                            │  LOADED  │                              
                            └────┬─────┘                              
                                 │ lock() + depart()                  
                                 ▼                                    
                            ┌──────────┐                              
                            │ DEPARTED │                              
                            └────┬─────┘                              
                                 │ confirmAllDelivered()              
                                 ▼                                    
                            ┌──────────┐                              
                            │DELIVERED │                              
                            └────┬─────┘                              
                                 │ close()                            
                                 ▼                                    
                            ┌──────────┐                              
                            │  CLOSED  │                              
                            └──────────┘                              
```

### 3. Package State Machine (Aligned with DropTag)

```
┌──────────┐  create()    ┌──────────┐                                
│  (new)   │─────────────▶│   OPEN   │                                
└──────────┘              └────┬─────┘                                
                               │ addItems()                           
                               ▼                                      
                         ┌──────────┐                                 
                         │ PACKING  │◀─── Tags can be APPLIED here    
                         └────┬─────┘                                 
                              │ requestQC()                           
                              ▼                                       
                        ┌─────────────┐                               
                        │READY_FOR_QC │                               
                        └──────┬──────┘                               
                               │ release() / hold()                   
                    ┌──────────┴──────────┐                           
                    ▼                     ▼                           
            ┌─────────────┐        ┌──────────┐                       
            │ QC_RELEASED │        │ QC_HOLD  │                       
            └──────┬──────┘        └──────────┘                       
                   │                                                  
                   │ seal() ─── Tags become SEALED                    
                   ▼                                                  
            ┌──────────┐                                              
            │  SEALED  │                                              
            └────┬─────┘                                              
                 │ stage()                                            
                 ▼                                                    
            ┌──────────┐                                              
            │  STAGED  │                                              
            └────┬─────┘                                              
                 │ load()                                             
                 ▼                                                    
            ┌──────────┐                                              
            │  LOADED  │                                              
            └────┬─────┘                                              
                 │ ship()                                             
                 ▼                                                    
            ┌──────────┐                                              
            │ SHIPPED  │                                              
            └────┬─────┘                                              
                 │ deliver()                                          
                 ▼                                                    
            ┌──────────┐                                              
            │DELIVERED │                                              
            └──────────┘                                              
```

#### Package-DropTag State Alignment Rules

| Package Status | Allowed DropTag Status |
|----------------|------------------------|
| OPEN | DRAFT (tags not yet generated) |
| PACKING | DRAFT, READY_TO_PRINT, PRINTED, APPLIED |
| READY_FOR_QC | APPLIED (waiting for QC) |
| QC_RELEASED | APPLIED (ready to seal) |
| SEALED | SEALED (immutable) |
| STAGED | STAGED |
| LOADED | LOADED |
| SHIPPED | SHIPPED |
| DELIVERED | DELIVERED |

---

## D) DROP TAG BUSINESS RULES (VALIDATION)

### Generation Rules

```typescript
interface DropTagGenerationRules {
  // PRE-CONDITIONS: Cannot generate drop tag unless:
  preconditions: {
    packageExists: boolean;         // packageId must reference valid package
    packageInValidState: boolean;   // Package status in [PACKING, READY_FOR_QC, QC_RELEASED]
    orderLineExists: boolean;       // orderLineId must reference valid order line
    inventoryAssigned: boolean;     // Package must have inventory lots/heats assigned
    qcStatusValid: boolean;         // QC status in [RELEASED, CONDITIONAL]
    // Note: CONDITIONAL requires approval audit
  };
  
  // POST-CONDITIONS: After generation:
  postconditions: {
    dropTagIdUnique: boolean;       // Generated ID is globally unique
    materialDataComplete: boolean;   // All required fields populated from source
    traceEventEmitted: boolean;     // DROP_TAG_GENERATED event logged
  };
}
```

### Mixed Material Prevention

```typescript
interface MixedMaterialRules {
  // STRICT MODE (default): No mixing allowed
  strictMode: {
    singleGrade: boolean;           // All items same grade
    singleForm: boolean;            // All items same form
    singleHeat: boolean;            // All items same heat (can be relaxed)
    singleSpec: boolean;            // All items same specification
    singleCondition: boolean;       // All items same condition/temper
  };
  
  // RELAXED MODE (customer-specific override)
  relaxedMode: {
    allowMultiHeat: boolean;        // Customer allows mixed heats
    // If true: Tag must show "MIXED HEAT" warning
    // Requires: MIXED_HEAT_APPROVAL permission
    // Audit: MIXED_HEAT_OVERRIDE event logged
    
    allowMultiLength: boolean;      // Customer allows mixed lengths in bundle
    requiresMixedHeatLabel: boolean; // Must print with warning label
  };
  
  // Customer Configuration
  customerConfig: {
    customerId: string;
    allowMixedHeat: boolean;
    allowMixedLength: boolean;
    requireCertPerHeat: boolean;    // Separate CoC per heat
  };
}
```

### Weight Validation

```typescript
interface WeightValidationRules {
  computedVsEntered: {
    tolerancePercent: number;       // Default: 2%
    toleranceLbs: number;           // Minimum tolerance: 5 lbs
    
    // Validation logic:
    // if |computedWeight - enteredWeight| > max(tolerancePercent * computed, toleranceLbs)
    //   then WEIGHT_MISMATCH warning (blocks if strict mode)
  };
  
  pieceWeight: {
    minPieceLbs: number;            // Minimum reasonable piece weight
    maxPieceLbs: number;            // Maximum reasonable piece weight
    // Flag anomalies for review
  };
}
```

### Mandatory Fields by Customer Profile

```typescript
interface CustomerTagRequirements {
  customerId: string;
  
  mandatoryFields: {
    heatNumber: boolean;            // Must show heat on tag
    mtrReference: boolean;          // Must link MTR document
    cocReference: boolean;          // Must link CoC document
    pieceMarks: boolean;            // Must show individual piece marks
    customerPartNumber: boolean;    // Must show customer's part number
    customerPO: boolean;            // Must show customer PO
    specification: boolean;         // Must show material spec
    countryOfOrigin: boolean;       // Must show origin country
  };
  
  labelFormat: {
    templateCode: string;           // Customer-specific template
    barcodeType: string;            // Customer-required symbology
    includeQRCode: boolean;
  };
}
```

### Void Rules

```typescript
interface VoidRules {
  preShipment: {
    // Before shipment departs (status < SHIPPED)
    allowedRoles: ['SUPERVISOR', 'OPS_MANAGER'];
    requiresReason: true;
    requiresApproval: false;        // Supervisor can self-approve
    auditLevel: 'STANDARD';
  };
  
  postShipment: {
    // After shipment departed (status >= SHIPPED)
    allowedRoles: ['EXECUTIVE', 'VP_OPERATIONS'];
    requiresReason: true;
    requiresApproval: true;         // Executive approval required
    requiresClaimLink: true;        // Must link to customer claim
    auditLevel: 'CRITICAL';
    notifyRoles: ['CFO', 'QUALITY_DIRECTOR'];
  };
  
  delivered: {
    // After delivery confirmed
    allowVoid: false;               // Cannot void delivered tags
    alternativeAction: 'CREATE_CREDIT_MEMO';
  };
}
```

### Reprint Rules

```typescript
interface ReprintRules {
  identityImmutable: true;          // Reprint does NOT change any data
  
  requirements: {
    requiresReason: true;           // Must specify why reprinting
    allowedReasons: [
      'DAMAGED_TAG',
      'ILLEGIBLE_PRINT',
      'TAG_FELL_OFF',
      'CUSTOMER_REQUEST',
      'ADDITIONAL_COPY'
    ];
  };
  
  behavior: {
    incrementsReprintCount: true;
    showsReprintIndicator: true;    // "REPRINT #n" watermark
    includesAuditFooter: true;      // printedBy, printedAt, reprintCount
  };
  
  restrictions: {
    maxReprintsBeforeEscalation: 3; // After 3 reprints, requires supervisor
    allowedAfterSealed: true;       // Can reprint sealed packages
    allowedAfterShipped: true;      // Can reprint for customer
  };
}
```

---

## E) DROP TAG LISTING RULES (SHIPMENT MANIFEST)

### Listing Formation

```typescript
interface ListingFormation {
  // Creation
  create: {
    requiredFields: {
      shipmentId: string;           // Must have shipment
      originLocationId: string;     // Where packages are
    };
    
    initialStatus: 'DRAFT';
  };
  
  // Adding Tags
  addTags: {
    validation: {
      allTagsSameLocation: boolean; // All from origin location
      allTagsSealed: boolean;       // All packages must be sealed
      allTagsQCReleased: boolean;   // All packages QC released
    };
  };
  
  // Totals
  totals: {
    autoComputed: boolean;          // System calculates from tags
    fields: ['totalPackages', 'totalPieces', 'totalWeightLbs'];
  };
  
  // Document Generation
  documents: {
    packingList: 'AUTO_GENERATE';   // System generates packing list
    cocBundle: 'AGGREGATE';         // Combine all CoCs into bundle
    mtrBundle: 'AGGREGATE';         // Combine all MTRs into bundle
  };
}
```

### Multi-Stop Behavior

```typescript
interface MultiStopRules {
  stopSequence: {
    format: Array<{
      stopNumber: number;           // 1, 2, 3...
      customerId: string;
      shipToAddress: Address;
      dropTagIds: string[];
      requiredDeliveryTime?: string;
    }>;
    
    validation: {
      tagsGroupedByStop: boolean;   // Each tag assigned to exactly one stop
      stopOrderReasonable: boolean; // Geographic/time ordering makes sense
    };
  };
  
  loading: {
    loadOrder: 'REVERSE_STOP';      // Load last stop first (LIFO)
    scanValidation: true;           // Scan confirms correct stop grouping
    mismatchBehavior: 'WARN_LOUD';  // Audible + visual warning
  };
  
  delivery: {
    confirmPerStop: true;           // POD per stop
    allowPartialDelivery: true;     // Can deliver some items at stop
    shortageHandling: 'LOG_AND_CONTINUE';
  };
}
```

### Listing Lock Rules

```typescript
interface ListingLockRules {
  lockTrigger: 'DEPARTURE';         // Lock when truck departs
  
  preLock: {
    validation: {
      allTagsLoaded: boolean;       // All listing tags in LOADED status
      totalsMatch: boolean;         // Loaded count matches listing
      documentsAttached: boolean;   // CoC/MTR bundles attached
    };
  };
  
  postLock: {
    modifications: {
      addTags: false;               // Cannot add tags
      removeTags: false;            // Cannot remove tags
      modifyTotals: false;          // Cannot change totals
      modifyStops: 'ESCALATED';     // Requires dispatch approval
    };
    
    allowedActions: {
      reprint: true;                // Can reprint manifest
      addNotes: true;               // Can add delivery notes
      captureProblems: true;        // Can log issues
    };
  };
}
```

---

## F) LABEL/TAG TEMPLATE SYSTEM (PRINT + REPRINT)

### Template Structure

```typescript
interface LabelTemplate {
  id: string;
  code: string;                     // BUNDLE_TAG_STANDARD, PIECE_TAG_SMALL
  name: string;
  description: string;
  
  // Physical Properties
  mediaType: 'PAPER' | 'PLASTIC' | 'METAL_PLATE';
  dimensions: {
    widthInches: number;
    heightInches: number;
  };
  
  // Content Zones
  zones: Array<{
    zoneId: string;
    type: 'TEXT' | 'BARCODE' | 'QR' | 'LOGO' | 'LINE';
    position: { x: number; y: number; width: number; height: number };
    content: string;                // Placeholder or static text
    style: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: 'normal' | 'bold';
      textAlign?: 'left' | 'center' | 'right';
      rotation?: number;
    };
  }>;
  
  // Barcode Configuration
  barcode: {
    type: 'QR' | 'CODE128' | 'CODE39' | 'DATAMATRIX';
    content: string;                // {{dropTagId}} or composite
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
    includeChecksum: boolean;
  };
  
  // Customer Customization
  customerId?: string;              // If customer-specific
  
  // Reprint Handling
  reprintZone: {
    position: { x: number; y: number };
    format: 'REPRINT #{{reprintCount}}';
    showWhen: 'reprintCount > 0';
  };
}
```

### Available Placeholders

```typescript
const PLACEHOLDERS = {
  // Drop Tag Identity
  dropTagId: '{{dropTagId}}',           // DT-2026-001234
  
  // Customer Info
  customerName: '{{customerName}}',
  customerPO: '{{customerPO}}',
  customerPartNo: '{{customerPartNo}}',
  
  // Order Info
  orderId: '{{orderId}}',
  orderLineNo: '{{orderLineNo}}',
  
  // Material Identity
  grade: '{{grade}}',
  form: '{{form}}',
  specification: '{{specification}}',
  condition: '{{condition}}',
  dimensions: '{{dimensions}}',         // Formatted dimension string
  length: '{{length}}',
  
  // Quantity
  pieces: '{{pieces}}',
  weight: '{{weight}}',
  uom: '{{uom}}',
  
  // Traceability
  heatNumber: '{{heatNumber}}',
  lotId: '{{lotId}}',
  mtrRef: '{{mtrRef}}',
  cocRef: '{{cocRef}}',
  
  // Shipping
  stopNumber: '{{stopNumber}}',
  shipToName: '{{shipToName}}',
  shipToCity: '{{shipToCity}}',
  requiredDate: '{{requiredDate}}',
  
  // Audit
  printedBy: '{{printedBy}}',
  printedAt: '{{printedAt}}',
  reprintCount: '{{reprintCount}}',
  
  // QR/Barcode Content
  barcodeContent: '{{dropTagId}}|{{heatNumber}}|{{orderId}}'
};
```

### Sample Template 1: Bundle Tag (4" x 6")

```
┌────────────────────────────────────────────────────────────┐
│                      STEELWISE                             │
│                    BUNDLE TAG                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  TAG#: {{dropTagId}}            ┌──────────────┐          │
│                                  │              │          │
│  CUSTOMER: {{customerName}}      │    [QR CODE] │          │
│  PO: {{customerPO}}              │              │          │
│                                  └──────────────┘          │
│  ORDER: {{orderId}} / LINE {{orderLineNo}}                 │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  MATERIAL: {{grade}} {{form}}                              │
│  SPEC: {{specification}}                                   │
│  CONDITION: {{condition}}                                  │
│                                                            │
│  SIZE: {{dimensions}}                                      │
│  LENGTH: {{length}}                                        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  HEAT: {{heatNumber}}           QTY: {{pieces}} PCS       │
│  LOT: {{lotId}}                 WT: {{weight}} LBS        │
│                                                            │
│  MTR: {{mtrRef}}                                           │
│  COC: {{cocRef}}                                           │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  SHIP TO: {{shipToName}}                                   │
│           {{shipToCity}}                                   │
│  STOP: {{stopNumber}}           DATE: {{requiredDate}}     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  {{printedAt}}  {{printedBy}}   {{#if reprintCount}}      │
│                                  REPRINT #{{reprintCount}} │
│                                 {{/if}}                    │
└────────────────────────────────────────────────────────────┘
```

### Sample Template 2: Piece Tag (2" x 3")

```
┌────────────────────────────────────┐
│         STEELWISE                  │
│         PIECE TAG                  │
├────────────────────────────────────┤
│                                    │
│  {{dropTagId}}    ┌──────────┐    │
│                   │ [QR]     │    │
│  {{grade}}        │          │    │
│  {{form}}         └──────────┘    │
│                                    │
│  {{dimensions}}                    │
│  {{length}}                        │
│                                    │
│  HT: {{heatNumber}}                │
│  PC: {{pieces}}  WT: {{weight}}   │
│                                    │
│  PO: {{customerPO}}                │
│  STOP: {{stopNumber}}              │
│                                    │
├────────────────────────────────────┤
│ {{printedAt}} {{#if reprintCount}}│
│ REPRINT #{{reprintCount}}         │
│ {{/if}}                            │
└────────────────────────────────────┘
```

---

## G) SCAN WORKFLOW (BARCODE/QR NOW; RFID/ETCH LATER)

### Scan Points & Events

```typescript
interface ScanWorkflow {
  scanPoints: {
    
    // 1. PRINT STATION
    printStation: {
      purpose: 'Confirm tag printed successfully';
      trigger: 'After print job completes';
      action: 'Operator scans printed tag';
      validation: {
        dropTagExists: true,
        statusTransition: 'READY_TO_PRINT → PRINTED'
      };
      event: 'DROP_TAG_PRINTED';
    };
    
    // 2. APPLY STATION
    applyStation: {
      purpose: 'Confirm tag attached to correct package';
      trigger: 'After physically attaching tag';
      actions: [
        'Scan drop tag',
        'Scan package barcode or enter packageId'
      ];
      validation: {
        tagPackageMatch: true,        // Tag's packageId matches scanned package
        packageInPacking: true,       // Package status is PACKING
        statusTransition: 'PRINTED → APPLIED'
      };
      event: 'DROP_TAG_APPLIED';
      mismatchBehavior: 'LOUD_ALARM + BLOCK';
    };
    
    // 3. SEAL CONFIRMATION
    sealStation: {
      purpose: 'Confirm package sealed with all tags applied';
      trigger: 'After applying tamper-evident seal';
      actions: [
        'Scan all drop tags on package',
        'Enter seal ID'
      ];
      validation: {
        allTagsApplied: true,         // All package's tags in APPLIED
        packageQCReleased: true,      // Package QC status is RELEASED
        sealIdValid: true,            // Seal ID format valid
        statusTransition: 'Package → SEALED, Tags → SEALED'
      };
      event: 'PACKAGE_SEALED';
      identity: 'BECOMES_IMMUTABLE';
    };
    
    // 4. STAGING SCAN
    stagingStation: {
      purpose: 'Confirm package moved to staging location';
      trigger: 'When package placed in staging area';
      actions: [
        'Scan drop tag or package',
        'Scan staging location/bin'
      ];
      validation: {
        packageSealed: true,
        locationValid: true,
        statusTransition: 'SEALED → STAGED'
      };
      event: 'PACKAGE_STAGED';
    };
    
    // 5. LOAD SCAN
    loadStation: {
      purpose: 'Confirm package loaded on correct truck for correct stop';
      trigger: 'When loading package onto truck';
      actions: [
        'Scan drop tag or package',
        'Scan truck/shipment barcode',
        'System validates stop assignment'
      ];
      validation: {
        shipmentMatch: true,          // Package assigned to this shipment
        stopSequenceValid: true,      // Loading in correct order (LIFO)
        statusTransition: 'STAGED → LOADED'
      };
      event: 'PACKAGE_LOADED';
      mismatchBehavior: {
        wrongShipment: 'BLOCK + LOUD_ALARM',
        wrongStopOrder: 'WARN + LOG'
      };
    };
    
    // 6. DELIVERY CONFIRMATION
    deliveryStation: {
      purpose: 'Confirm package delivered to customer';
      trigger: 'At customer location';
      actions: [
        'Scan drop tag or package',
        'Capture POD signature',
        'Take photo (optional)'
      ];
      validation: {
        stopMatches: true,            // Delivered at correct stop
        statusTransition: 'LOADED → DELIVERED'
      };
      event: 'DELIVERY_CONFIRMED';
      closesChain: true;
    };
  };
}
```

### Identifier Abstraction (RFID/Etch Ready)

```typescript
interface TagIdentifierService {
  // Current identifiers (barcode/QR)
  supportedTypes: ['BARCODE', 'QR'];
  
  // Future identifiers
  futureTypes: ['RFID', 'ETCH', 'DATAMATRIX'];
  
  // Resolution method
  resolveIdentifier: (identifierType: string, identifierValue: string) => {
    dropTagId: string;
    packageId: string;
    confidence: number;
  };
  
  // Multiple identifiers per tag
  tagIdentifiers: {
    dropTagId: string;
    identifiers: Array<{
      type: 'BARCODE' | 'QR' | 'RFID' | 'ETCH';
      value: string;
      isPrimary: boolean;
      createdAt: Date;
    }>;
  };
  
  // RFID-specific handling
  rfid: {
    epcFormat: 'SGTIN-96' | 'CUSTOM';
    readRange: 'SHORT' | 'MEDIUM' | 'LONG';
    bulkRead: boolean;              // Can read multiple at once
  };
}
```

### Scan Service Architecture

```typescript
interface ScanService {
  // Universal scan endpoint
  processScan: (payload: {
    identifierType: 'BARCODE' | 'QR' | 'RFID' | 'ETCH';
    identifierValue: string;
    stationType: 'PRINT' | 'APPLY' | 'SEAL' | 'STAGE' | 'LOAD' | 'DELIVER';
    stationId: string;
    locationId: string;
    
    // Context (varies by station)
    context?: {
      packageScan?: string;         // For APPLY: second scan
      sealId?: string;              // For SEAL
      binId?: string;               // For STAGE
      shipmentId?: string;          // For LOAD
      stopNumber?: number;          // For LOAD/DELIVER
      podSignature?: string;        // For DELIVER
    };
    
    // Operator
    actorUserId: string;
  }) => ScanResult;
  
  // Result
  interface ScanResult {
    success: boolean;
    dropTagId?: string;
    previousStatus?: string;
    newStatus?: string;
    warnings?: string[];
    errors?: string[];
    nextAction?: string;
    eventId?: string;
  };
}
```

---

## H) UI/UX (MATERIAL UI SCREENS)

### Screen Inventory

| Screen | Path | Purpose | Primary Users |
|--------|------|---------|---------------|
| Packaging Queue | /packaging/queue | View packages ready for tagging | Packaging Ops |
| Package Builder | /packaging/builder/:id | Build package contents, generate tags | Packaging Ops |
| Drop Tag Print Center | /drop-tags/print | Bulk print tags, select printer | Packaging Ops |
| Apply/Scan Screen | /drop-tags/apply | Mobile-friendly tag application | Packaging Ops |
| Drop Tag Listing | /drop-tag-listings/:id | Load plan with all tags | Logistics |
| Staging Board | /staging/board | Scan in/out of staging | Warehouse |
| Loading Screen | /loading/:shipmentId | Load truck with stop validation | Loaders |
| Traceability Viewer | /traceability | Search by tag, heat, order | QC, Supervisors |
| Template Manager | /admin/templates | Manage label templates | Admin |
| Customer Tag Rules | /admin/customer-rules | Configure customer requirements | Admin |

### Screen Specifications

#### 1. Packaging Queue (Ready to Tag)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DROP TAG PACKAGING QUEUE                                    [REFRESH] [⚙️]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FILTERS: [Location ▼] [Status ▼] [Customer ▼] [Order ▼]    🔍 Search...  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  READY TO TAG (12)                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │ ☐ PKG-2026-001234  │ ORD-5678 Line 1  │ Acme Mfg     │ 4140 RB 2.5" │ 3│
│  │   QC: ✓ RELEASED   │ 1,250 lbs        │ Due: 02/07   │ [GENERATE] [👁]│
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │ ☐ PKG-2026-001235  │ ORD-5678 Line 2  │ Acme Mfg     │ 1018 FB 3x1" │ 5│
│  │   QC: ✓ RELEASED   │ 890 lbs          │ Due: 02/07   │ [GENERATE] [👁]│
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │ ☐ PKG-2026-001236  │ ORD-5680 Line 1  │ Beta Corp    │ 6061 PLATE  │ 2│
│  │   QC: ⚠ CONDITIONAL│ 2,100 lbs        │ Due: 02/08   │ [GENERATE] [👁]│
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  PENDING QC (5)                                                             │
│  [Collapsed list of packages awaiting QC release]                          │
│                                                                             │
│  SELECTED: 2 packages                    [BULK GENERATE TAGS]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2. Drop Tag Print Center

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DROP TAG PRINT CENTER                                       [PRINTER: ▼]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRINTER STATUS: ● Online (Label Printer - Shipping Dock)                  │
│  TEMPLATE: [Bundle Tag Standard ▼]          COPIES: [1 ▼]                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  READY TO PRINT (8 tags)                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │ ☑ DT-2026-001001 │ PKG-001234 │ Acme Mfg    │ 4140 RB 2.5"  │ 3 pcs   │
│  │ ☑ DT-2026-001002 │ PKG-001235 │ Acme Mfg    │ 1018 FB 3x1"  │ 5 pcs   │
│  │ ☑ DT-2026-001003 │ PKG-001236 │ Beta Corp   │ 6061 PLATE    │ 2 pcs   │
│  │ ☐ DT-2026-001004 │ PKG-001237 │ Beta Corp   │ 6061 PLATE    │ 4 pcs   │
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  RECENTLY PRINTED (last 30 min)                                             │
│  [List of recently printed tags with REPRINT button]                       │
│                                                                             │
│  SELECTED: 3 tags                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    [🖨️ PRINT SELECTED (3)]                            │ │
│  │                                                                        │ │
│  │    Preview:  [DT-2026-001001 ▼]   [PREVIEW]                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3. Apply/Scan Screen (Mobile-Optimized)

```
┌─────────────────────────────────────────┐
│     DROP TAG - APPLY                    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │         📷 SCAN DROP TAG          │  │
│  │                                   │  │
│  │    [TAP TO SCAN OR ENTER BELOW]   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Manual Entry: [________________]       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  LAST SCANNED:                          │
│  ┌───────────────────────────────────┐  │
│  │ DT-2026-001001                    │  │
│  │ ✓ Applied to PKG-001234           │  │
│  │ 4140 Round Bar 2.5" x 12'         │  │
│  │ Heat: A12345                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  SESSION: 5 tags applied                │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ⚠️ MISMATCH? [REPORT PROBLEM]          │
│                                         │
└─────────────────────────────────────────┘
```

#### 4. Loading Screen with Stop Validation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOADING: SHIPMENT SHP-2026-0456                                    [CLOSE]│
│  Route: Cleveland → Detroit → Chicago    Driver: Mike Johnson               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LOAD SEQUENCE (Load last stop first!)                                      │
│                                                                             │
│  STOP 3: Chicago - Gamma Industries              ⬜ 0/2 loaded              │
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │ ⬜ PKG-001240 │ DT-2026-001010 │ 4140 RB 3"   │ 2,500 lbs │ [SCAN]     │
│  │ ⬜ PKG-001241 │ DT-2026-001011 │ 1018 FB 2x2" │ 1,800 lbs │ [SCAN]     │
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                             │
│  STOP 2: Detroit - Beta Corp                     ⬜ 0/3 loaded              │
│  [Collapsed - load after Stop 3]                                            │
│                                                                             │
│  STOP 1: Cleveland - Acme Manufacturing          ⬜ 0/2 loaded              │
│  [Collapsed - load last]                                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │            📷 SCAN PACKAGE TO LOAD                                    │ │
│  │                                                                        │ │
│  │  Manual Entry: [________________]        [SCAN]                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  PROGRESS: 0/7 packages loaded                                              │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%                          │
│                                                                             │
│  [CONFIRM ALL LOADED]  (disabled until 7/7)                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### UX Requirements

1. **< 3 Clicks to Print**: From ready package to printed tag in under 3 clicks
2. **Loud Mismatch Warnings**: Audio + full-screen red flash for wrong scans
3. **Next Action Guidance**: Always show "What to do next" prominently
4. **Large Touch Targets**: Minimum 48px touch targets for mobile screens
5. **Offline Capability**: Core scan functions work offline, sync when connected
6. **Fast Feedback**: < 200ms response for scan operations

---

## I) ROLES & PERMISSIONS

### Role Definitions

```typescript
interface Roles {
  PACKAGING_OPERATOR: {
    description: 'Floor worker who packages material and applies tags';
    permissions: [
      'package.create',
      'package.addItems',
      'package.view',
      'dropTag.generate',
      'dropTag.print',
      'dropTag.apply',
      'scan.apply',
      'scan.seal'
    ];
  };
  
  SHIPPING_LOADER: {
    description: 'Loads packages onto trucks';
    permissions: [
      'package.view',
      'dropTag.view',
      'scan.stage',
      'scan.load',
      'listing.view'
    ];
  };
  
  LOGISTICS_COORDINATOR: {
    description: 'Plans loads and manages shipments';
    permissions: [
      'listing.create',
      'listing.edit',
      'listing.print',
      'listing.lock',
      'shipment.view',
      'shipment.edit',
      'dropTag.view',
      'dropTag.assignToListing'
    ];
  };
  
  QC_INSPECTOR: {
    description: 'Reviews and releases packages for shipment';
    permissions: [
      'package.view',
      'package.qcRelease',
      'package.qcHold',
      'package.conditionalRelease',
      'dropTag.view',
      'mtr.view',
      'coc.view'
    ];
  };
  
  SUPERVISOR: {
    description: 'Shop floor supervisor with override capabilities';
    permissions: [
      // All operator permissions plus:
      'dropTag.void',
      'dropTag.reprint',
      'package.override',
      'mixedHeat.approve'
    ];
  };
  
  OPS_MANAGER: {
    description: 'Operations manager with full department access';
    permissions: [
      // All supervisor permissions plus:
      'listing.close',
      'dropTag.voidPostShip',
      'template.edit',
      'customerRules.edit',
      'audit.view'
    ];
  };
  
  CUSTOMER: {
    description: 'Customer portal access (read-only)';
    permissions: [
      'dropTag.viewOwn',
      'listing.viewOwn',
      'document.downloadOwn',
      'tracking.viewOwn'
    ];
  };
  
  AUDITOR: {
    description: 'Compliance auditor (read-only)';
    permissions: [
      'dropTag.view',
      'listing.view',
      'traceEvent.view',
      'audit.export'
    ];
  };
}
```

### Permission Matrix

| Action | Pkg Op | Loader | Logistics | QC | Super | Ops Mgr | Customer | Auditor |
|--------|--------|--------|-----------|-----|-------|---------|----------|---------|
| Generate Tags | ✓ | | | | ✓ | ✓ | | |
| Print Tags | ✓ | | | | ✓ | ✓ | | |
| Reprint Tags | | | | | ✓ | ✓ | | |
| Apply Tags | ✓ | | | | ✓ | ✓ | | |
| Void Tags (pre-ship) | | | | | ✓ | ✓ | | |
| Void Tags (post-ship) | | | | | | ✓ | | |
| Create Listing | | | ✓ | | ✓ | ✓ | | |
| Lock Listing | | | ✓ | | ✓ | ✓ | | |
| QC Release | | | | ✓ | ✓ | ✓ | | |
| Mixed Heat Override | | | | | ✓ | ✓ | | |
| Export Audit | | | | | | ✓ | | ✓ |
| Edit Templates | | | | | | ✓ | | |
| View Own Docs | | | | | | | ✓ | |

---

## J) APIS (ENDPOINT-BY-ENDPOINT)

### Drop Tags API

```yaml
# Generate drop tag for package
POST /api/drop-tags
  Request:
    packageId: string (required)
    templateCode?: string
    generateForEachPiece?: boolean  # For piece-level tagging
  Response:
    dropTag: DropTag
    warnings?: string[]
  Errors:
    400 VALIDATION_ERROR - Missing required fields
    400 QC_HOLD - Package on QC hold
    400 MIXED_MATERIAL - Material consistency violation
    403 UNAUTHORIZED - Insufficient permissions
    404 PACKAGE_NOT_FOUND - Invalid packageId

# Get drop tag by ID
GET /api/drop-tags/:id
  Response:
    dropTag: DropTag
    package: Package
    traceEvents: TraceEvent[]

# Search drop tags
GET /api/drop-tags
  Query Params:
    shipmentId?: string
    orderId?: string
    customerId?: string
    heatNumber?: string
    status?: DropTagStatus
    fromDate?: ISO date
    toDate?: ISO date
    page?: number
    limit?: number
  Response:
    dropTags: DropTag[]
    pagination: { page, limit, total, totalPages }

# Print drop tag
POST /api/drop-tags/:id/print
  Request:
    stationId: string
    templateCode?: string
    copies?: number
  Response:
    success: boolean
    printJobId: string
    status: 'PRINTED'
  Events:
    DROP_TAG_PRINTED

# Reprint drop tag (requires reason)
POST /api/drop-tags/:id/reprint
  Request:
    reason: 'DAMAGED_TAG' | 'ILLEGIBLE_PRINT' | 'TAG_FELL_OFF' | 'CUSTOMER_REQUEST' | 'ADDITIONAL_COPY'
    stationId: string
    copies?: number
  Response:
    success: boolean
    reprintCount: number
  Events:
    DROP_TAG_REPRINTED

# Apply drop tag (scan confirmation)
POST /api/drop-tags/:id/apply
  Request:
    packageScanValue?: string  # Optional second confirmation
  Response:
    success: boolean
    status: 'APPLIED'
    package: { id, status }
  Events:
    DROP_TAG_APPLIED

# Void drop tag
POST /api/drop-tags/:id/void
  Request:
    reason: string (required)
    claimId?: string  # Required if post-shipment
  Response:
    success: boolean
    status: 'VOID'
  Permissions:
    Pre-shipment: SUPERVISOR, OPS_MANAGER
    Post-shipment: OPS_MANAGER (requires claimId)
  Events:
    DROP_TAG_VOIDED

# Validate package for tagging (pre-check)
POST /api/drop-tags/validate
  Request:
    packageId: string
  Response:
    valid: boolean
    errors: string[]
    warnings: string[]
    materialSummary: {
      grade, form, heatNumbers[], qcStatus
    }
```

### Drop Tag Listings API

```yaml
# Create listing for shipment
POST /api/drop-tag-listings
  Request:
    shipmentId: string (required)
    originLocationId: string (required)
    dropTagIds?: string[]  # Initial tags
  Response:
    listing: DropTagListing
  Events:
    LISTING_CREATED

# Get listing by ID
GET /api/drop-tag-listings/:id
  Response:
    listing: DropTagListing
    dropTags: DropTag[]
    documents: { coc, mtr, packingList }

# Add tags to listing
POST /api/drop-tag-listings/:id/tags
  Request:
    dropTagIds: string[]
  Response:
    listing: DropTagListing
    added: number
  Errors:
    400 LISTING_LOCKED - Cannot modify locked listing
    400 TAG_ALREADY_ASSIGNED - Tag in another listing

# Remove tags from listing
DELETE /api/drop-tag-listings/:id/tags
  Request:
    dropTagIds: string[]
  Response:
    listing: DropTagListing
    removed: number

# Print listing manifest
POST /api/drop-tag-listings/:id/print
  Request:
    stationId: string
    includePackingList?: boolean
    includeDocBundle?: boolean
  Response:
    success: boolean
    documents: { packingListUrl, cocBundleUrl, mtrBundleUrl }

# Lock listing (before departure)
POST /api/drop-tag-listings/:id/lock
  Request:
    confirmation: boolean
  Response:
    listing: DropTagListing
    status: 'DEPARTED'
  Validation:
    - All tags must be LOADED
    - Totals must match
    - Documents must be attached
  Events:
    LISTING_LOCKED

# Close listing (after all deliveries)
POST /api/drop-tag-listings/:id/close
  Request:
    podDocId: string
  Response:
    listing: DropTagListing
    status: 'CLOSED'
  Events:
    LISTING_CLOSED
```

### Scanning API

```yaml
# Universal scan endpoint
POST /api/scans
  Request:
    identifierType: 'BARCODE' | 'QR' | 'RFID' | 'ETCH'
    identifierValue: string
    stationType: 'PRINT' | 'APPLY' | 'SEAL' | 'STAGE' | 'LOAD' | 'DELIVER'
    stationId: string
    locationId: string
    context?: {
      packageScan?: string
      sealId?: string
      binId?: string
      shipmentId?: string
      stopNumber?: number
      podSignature?: string
    }
  Response:
    success: boolean
    dropTagId: string
    previousStatus: DropTagStatus
    newStatus: DropTagStatus
    warnings?: string[]
    nextAction?: string
  Events:
    Varies by stationType
  Errors:
    400 INVALID_IDENTIFIER - Cannot resolve identifier
    400 WRONG_STATION - Tag not ready for this station
    400 SHIPMENT_MISMATCH - Tag not assigned to this shipment
    400 STOP_SEQUENCE_VIOLATION - Wrong loading order
    403 UNAUTHORIZED - Insufficient permissions
```

### Templates API

```yaml
# List templates
GET /api/label-templates
  Query:
    templateType?: string
    customerId?: string
    active?: boolean
  Response:
    templates: LabelTemplate[]

# Get template
GET /api/label-templates/:id
  Response:
    template: LabelTemplate

# Create template
POST /api/label-templates
  Request:
    name, code, templateType, dimensions, templateContent, barcodeType...
  Response:
    template: LabelTemplate
  Permissions:
    OPS_MANAGER

# Update template
PUT /api/label-templates/:id
  Request:
    ... (partial update)
  Response:
    template: LabelTemplate

# Preview template with sample data
POST /api/label-templates/:id/preview
  Request:
    sampleData?: object  # Override placeholders
  Response:
    previewUrl: string
    previewHtml: string
```

### Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| QC_HOLD | Package on QC hold | Request QC release |
| MIXED_MATERIAL | Multiple grades/heats in package | Split package or get override |
| LISTING_LOCKED | Listing already locked | Cannot modify departed shipment |
| TAG_ALREADY_ASSIGNED | Tag in another listing | Remove from other listing first |
| WRONG_STATION | Tag not ready for this operation | Complete previous step first |
| SHIPMENT_MISMATCH | Tag not on this shipment | Check correct truck |
| STOP_SEQUENCE_VIOLATION | Loading in wrong order | Load later stops first |
| VOID_REQUIRES_CLAIM | Post-ship void needs claim | Link to customer claim |

---

## K) EVENTS + AUDIT TRAIL

### Event Definitions

```typescript
interface TraceEventTypes {
  // Drop Tag Events
  DROP_TAG_GENERATED: {
    resourceType: 'DropTag';
    data: {
      dropTagId: string;
      packageId: string;
      orderId: string;
      materialSummary: string;
    };
  };
  
  DROP_TAG_PRINTED: {
    resourceType: 'DropTag';
    data: {
      dropTagId: string;
      stationId: string;
      templateCode: string;
      copies: number;
    };
  };
  
  DROP_TAG_REPRINTED: {
    resourceType: 'DropTag';
    data: {
      dropTagId: string;
      reprintCount: number;
      reason: string;
      stationId: string;
    };
  };
  
  DROP_TAG_APPLIED: {
    resourceType: 'DropTag';
    data: {
      dropTagId: string;
      packageId: string;
      scanConfirmation: boolean;
    };
  };
  
  DROP_TAG_VOIDED: {
    resourceType: 'DropTag';
    data: {
      dropTagId: string;
      reason: string;
      claimId?: string;
      approvedBy?: string;
    };
    severity: 'WARNING';
  };
  
  // Package Events
  PACKAGE_SEALED: {
    resourceType: 'Package';
    data: {
      packageId: string;
      sealId: string;
      dropTagIds: string[];
      identity: 'IMMUTABLE';
    };
  };
  
  PACKAGE_STAGED: {
    resourceType: 'Package';
    data: {
      packageId: string;
      locationId: string;
      binId: string;
    };
  };
  
  PACKAGE_LOADED: {
    resourceType: 'Package';
    data: {
      packageId: string;
      shipmentId: string;
      stopNumber: number;
      loadSequence: number;
    };
  };
  
  // Listing Events
  LISTING_CREATED: {
    resourceType: 'DropTagListing';
    data: {
      listingId: string;
      shipmentId: string;
      initialTagCount: number;
    };
  };
  
  LISTING_LOCKED: {
    resourceType: 'DropTagListing';
    data: {
      listingId: string;
      totalPackages: number;
      totalWeight: number;
      lockedBy: string;
    };
  };
  
  // Shipment Events
  SHIPMENT_DEPARTED: {
    resourceType: 'Shipment';
    data: {
      shipmentId: string;
      listingId: string;
      driver: string;
      stopCount: number;
    };
  };
  
  DELIVERY_CONFIRMED: {
    resourceType: 'Shipment';
    data: {
      shipmentId: string;
      stopNumber: number;
      podDocId: string;
      signedBy: string;
      deliveredTags: string[];
    };
  };
}
```

### Audit Trail Correlation

```typescript
interface AuditCorrelation {
  // Full chain correlation
  orderToDelivery: {
    correlationId: string;  // Shared across all events
    
    chain: [
      'Order.created',
      'OrderLine.created',
      'Job.created',
      'Job.completed',
      'Package.created',
      'Package.itemsAdded',
      'Package.qcReleased',
      'DropTag.generated',
      'DropTag.printed',
      'DropTag.applied',
      'Package.sealed',
      'Listing.created',
      'Listing.tagAdded',
      'Package.staged',
      'Package.loaded',
      'Listing.locked',
      'Shipment.departed',
      'Delivery.confirmed',
      'Listing.closed'
    ];
    
    // Query: Given any resourceId, find all related events
    findRelated: (resourceId: string) => TraceEvent[];
  };
  
  // Immutability
  eventChain: {
    eventHash: 'SHA-256 of (eventId + payload + previousHash)';
    previousHash: 'Links to previous event in chain';
    // Enables tamper detection
  };
}
```

### Audit Export

```typescript
interface AuditExport {
  formats: ['JSON', 'CSV', 'PDF'];
  
  reports: {
    dropTagHistory: {
      filters: ['dropTagId', 'dateRange', 'eventType'];
      includes: ['all events for tag lifecycle'];
    };
    
    orderTraceability: {
      filters: ['orderId', 'orderLineId'];
      includes: ['all events from order through delivery'];
    };
    
    heatTraceability: {
      filters: ['heatNumber', 'dateRange'];
      includes: ['all tags, packages, shipments for heat'];
    };
    
    customerDeliveryReport: {
      filters: ['customerId', 'dateRange'];
      includes: ['all deliveries with POD'];
    };
  };
}
```

---

## L) TESTING PLAN

### Test Scenarios

#### Happy Path Tests

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Generate tag for QC-released package | Tag created with READY_TO_PRINT status |
| 2 | Print tag at designated station | Tag status → PRINTED, event logged |
| 3 | Apply tag with scan confirmation | Tag status → APPLIED, package confirmed |
| 4 | Seal package with all tags applied | Tags → SEALED, package → SEALED |
| 5 | Stage sealed package | Tags → STAGED, location recorded |
| 6 | Load package onto correct shipment/stop | Tags → LOADED, listing updated |
| 7 | Complete load and lock listing | Listing → DEPARTED, cannot modify |
| 8 | Confirm delivery with POD | Tags → DELIVERED, POD linked |
| 9 | Close listing after all stops | Listing → CLOSED, chain complete |
| 10 | Reprint tag with valid reason | Reprint count incremented, event logged |

#### Edge Case Tests

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 11 | Generate tag for QC-HOLD package | BLOCKED: QC_HOLD error |
| 12 | Generate tag with mixed grades | BLOCKED: MIXED_MATERIAL error |
| 13 | Generate tag with mixed heats (not allowed) | BLOCKED: MIXED_MATERIAL error |
| 14 | Generate tag with mixed heats (customer allows) | WARNING + MIXED_HEAT flag on tag |
| 15 | Conditional release with approval | Tag generated with audit trail |
| 16 | Reprint without reason | BLOCKED: REASON_REQUIRED error |
| 17 | Void tag before shipment (supervisor) | Tag → VOID, event logged |
| 18 | Void tag after shipment (no claim) | BLOCKED: VOID_REQUIRES_CLAIM |
| 19 | Void tag after shipment (with claim + exec approval) | Tag → VOID, claim linked |
| 20 | Void delivered tag | BLOCKED: CANNOT_VOID_DELIVERED |
| 21 | Load package on wrong shipment | BLOCKED: SHIPMENT_MISMATCH alarm |
| 22 | Load stop 1 before stop 3 | WARNING: STOP_SEQUENCE_VIOLATION |
| 23 | Depart with incomplete load | BLOCKED: TOTALS_MISMATCH |
| 24 | Apply tag to wrong package | BLOCKED: PACKAGE_MISMATCH alarm |
| 25 | Attempt seal without QC release | BLOCKED: QC_NOT_RELEASED |
| 26 | Modify locked listing | BLOCKED: LISTING_LOCKED |
| 27 | Print with offline printer | QUEUED: Retry when online |
| 28 | Scan unrecognized identifier | ERROR: INVALID_IDENTIFIER |
| 29 | Weight mismatch beyond tolerance | WARNING: WEIGHT_MISMATCH (review) |
| 30 | Missing mandatory field (customer rule) | BLOCKED: MISSING_REQUIRED_FIELD |

### Integration Tests

```typescript
interface IntegrationTests {
  orderThroughDelivery: {
    steps: [
      'Create order with 3 lines',
      'Complete jobs for all lines',
      'QC release all packages',
      'Generate tags for all packages',
      'Print all tags',
      'Apply all tags',
      'Seal all packages',
      'Create shipment and listing',
      'Add all tags to listing',
      'Stage all packages',
      'Load all packages (correct stop order)',
      'Lock listing and depart',
      'Confirm delivery at each stop',
      'Close listing'
    ];
    assertions: [
      'All events logged with correlation',
      'All statuses correct at each step',
      'Documents generated and linked',
      'Audit trail complete and exportable'
    ];
  };
  
  heatTraceability: {
    scenario: 'Trace all material from single heat';
    assertions: [
      'Find all packages containing heat',
      'Find all drop tags for heat',
      'Find all shipments containing heat',
      'Find all customers who received heat'
    ];
  };
}
```

---

## M) SEED TEMPLATES + SAMPLE PAYLOADS

### Sample LabelTemplate: Bundle Tag

```json
{
  "id": "tmpl-001",
  "code": "BUNDLE_TAG_STANDARD",
  "name": "Standard Bundle Tag",
  "description": "4x6 bundle tag for standard steel bundles",
  "templateType": "BUNDLE_TAG",
  "mediaType": "PAPER",
  "widthInches": 4.0,
  "heightInches": 6.0,
  "templateContent": "<template version=\"1.0\"><header><logo position=\"top-center\"/><title>BUNDLE TAG</title></header><body><field name=\"dropTagId\" label=\"TAG#\" position=\"row-1\" bold=\"true\" size=\"large\"/><field name=\"customerName\" label=\"CUSTOMER\" position=\"row-2\"/><field name=\"customerPO\" label=\"PO\" position=\"row-2\"/><barcode type=\"QR\" content=\"{{dropTagId}}\" position=\"top-right\" size=\"80x80\"/><divider/><field name=\"grade\" label=\"MATERIAL\" position=\"row-3\"/><field name=\"form\" position=\"row-3\"/><field name=\"specification\" label=\"SPEC\" position=\"row-4\"/><field name=\"dimensions\" label=\"SIZE\" position=\"row-5\"/><field name=\"lengthFeet\" label=\"LENGTH\" position=\"row-5\" suffix=\"FT\"/><divider/><field name=\"heatNumber\" label=\"HEAT\" position=\"row-6\"/><field name=\"pieces\" label=\"QTY\" position=\"row-6\" suffix=\"PCS\"/><field name=\"weightLbs\" label=\"WT\" position=\"row-7\" suffix=\"LBS\"/><field name=\"mtrRef\" label=\"MTR\" position=\"row-8\"/><field name=\"cocRef\" label=\"COC\" position=\"row-8\"/><divider/><field name=\"shipToName\" label=\"SHIP TO\" position=\"row-9\"/><field name=\"stopNumber\" label=\"STOP\" position=\"row-10\"/><field name=\"requiredDate\" label=\"DATE\" position=\"row-10\"/><footer><field name=\"printedAt\" size=\"small\"/><field name=\"printedBy\" size=\"small\"/><conditional if=\"reprintCount > 0\"><text>REPRINT #{{reprintCount}}</text></conditional></footer></template>",
  "barcodeType": "QR",
  "barcodePosition": {"x": 280, "y": 20, "width": 80, "height": 80},
  "customerId": null,
  "isActive": true,
  "isDefault": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

### Sample LabelTemplate: Piece Tag

```json
{
  "id": "tmpl-002",
  "code": "PIECE_TAG_SMALL",
  "name": "Small Piece Tag",
  "description": "2x3 piece tag for individual pieces",
  "templateType": "PIECE_TAG",
  "mediaType": "PLASTIC",
  "widthInches": 2.0,
  "heightInches": 3.0,
  "templateContent": "<template version=\"1.0\"><header><title size=\"small\">PIECE TAG</title></header><body><field name=\"dropTagId\" size=\"medium\" bold=\"true\"/><barcode type=\"QR\" content=\"{{dropTagId}}\" position=\"right\" size=\"50x50\"/><field name=\"grade\"/><field name=\"form\"/><field name=\"dimensions\" size=\"small\"/><field name=\"lengthFeet\" suffix=\"FT\"/><divider/><field name=\"heatNumber\" label=\"HT\" size=\"small\"/><field name=\"pieces\" label=\"PC\" size=\"small\"/><field name=\"weightLbs\" label=\"WT\" size=\"small\"/><field name=\"customerPO\" label=\"PO\" size=\"small\"/><field name=\"stopNumber\" label=\"STOP\" size=\"small\"/></body><footer><conditional if=\"reprintCount > 0\"><text size=\"tiny\">REPRINT #{{reprintCount}}</text></conditional></footer></template>",
  "barcodeType": "QR",
  "barcodePosition": {"x": 100, "y": 30, "width": 50, "height": 50},
  "customerId": null,
  "isActive": true,
  "isDefault": false,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

### Sample DropTag Instance

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "dropTagId": "DT-2026-001234",
  "tenantId": "tenant-001",
  "packageId": "pkg-550e8400-e29b-41d4-a716-446655440001",
  "shipmentId": "shp-550e8400-e29b-41d4-a716-446655440001",
  "listingId": "lst-550e8400-e29b-41d4-a716-446655440001",
  "orderId": "ord-2026-5678",
  "orderLineId": "ordline-001",
  "jobId": "job-2026-9012",
  "customerId": "cust-acme-001",
  "customerPO": "ACME-PO-2026-1234",
  "customerPartNo": "ACME-4140-RB-2.5",
  "division": "STEEL",
  "form": "ROUND_BAR",
  "grade": "4140",
  "specification": "ASTM A108",
  "condition": "Q&T",
  "dimensions": {
    "od": 2.5,
    "odUnit": "IN"
  },
  "lengthInches": 144,
  "lengthFeet": 12,
  "heatNumber": "A12345",
  "lotId": "LOT-2026-001",
  "inventoryLotId": "inv-lot-001",
  "supplierId": "supp-001",
  "mtrDocId": "doc-mtr-001",
  "cocDocId": "doc-coc-001",
  "pieces": 5,
  "weightLbs": 1250.50,
  "uom": "EA",
  "workCenters": ["SAW-01", "LAT-02"],
  "operationsSummary": "Cut to length, face ends, chamfer",
  "completedAt": "2026-02-05T14:30:00Z",
  "operatorIds": ["user-001", "user-002"],
  "bundleType": "BANDED",
  "packagingNotes": "Band with 3/4\" steel strapping",
  "specialInstructions": "Handle with care - precision ground",
  "shipToAddress": {
    "name": "Acme Manufacturing",
    "line1": "123 Industrial Blvd",
    "city": "Cleveland",
    "state": "OH",
    "zip": "44101"
  },
  "routeStop": 1,
  "requiredDate": "2026-02-07T00:00:00Z",
  "status": "SEALED",
  "version": 1,
  "reprintCount": 0,
  "lastReprintReason": null,
  "createdBy": "user-001",
  "createdAt": "2026-02-05T14:35:00Z",
  "updatedAt": "2026-02-05T15:00:00Z",
  "printedBy": "user-001",
  "printedAt": "2026-02-05T14:40:00Z",
  "appliedBy": "user-001",
  "appliedAt": "2026-02-05T14:45:00Z",
  "sealedAt": "2026-02-05T15:00:00Z",
  "voidedBy": null,
  "voidedAt": null,
  "voidReason": null
}
```

### Sample DropTagListing Instance

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "listingId": "DTL-2026-001234",
  "tenantId": "tenant-001",
  "shipmentId": "shp-550e8400-e29b-41d4-a716-446655440001",
  "originLocationId": "loc-cleveland-001",
  "routeId": "route-cle-det-chi",
  "loadId": "load-2026-0205-001",
  "stopSequence": [
    {
      "stopNumber": 1,
      "customerId": "cust-acme-001",
      "shipToName": "Acme Manufacturing",
      "shipToAddress": {
        "line1": "123 Industrial Blvd",
        "city": "Cleveland",
        "state": "OH",
        "zip": "44101"
      },
      "dropTagIds": ["DT-2026-001234", "DT-2026-001235"],
      "packages": 2,
      "pieces": 8,
      "weightLbs": 2140.75,
      "requiredTime": "08:00"
    },
    {
      "stopNumber": 2,
      "customerId": "cust-beta-001",
      "shipToName": "Beta Corporation",
      "shipToAddress": {
        "line1": "456 Manufacturing Way",
        "city": "Detroit",
        "state": "MI",
        "zip": "48201"
      },
      "dropTagIds": ["DT-2026-001236", "DT-2026-001237", "DT-2026-001238"],
      "packages": 3,
      "pieces": 12,
      "weightLbs": 4500.00,
      "requiredTime": "11:00"
    },
    {
      "stopNumber": 3,
      "customerId": "cust-gamma-001",
      "shipToName": "Gamma Industries",
      "shipToAddress": {
        "line1": "789 Production Dr",
        "city": "Chicago",
        "state": "IL",
        "zip": "60601"
      },
      "dropTagIds": ["DT-2026-001239", "DT-2026-001240"],
      "packages": 2,
      "pieces": 6,
      "weightLbs": 3200.25,
      "requiredTime": "14:00"
    }
  ],
  "totalPackages": 7,
  "totalPieces": 26,
  "totalWeightLbs": 9841.00,
  "cocBundleId": "doc-coc-bundle-001",
  "mtrBundleId": "doc-mtr-bundle-001",
  "packingListDocId": "doc-packing-001",
  "status": "DEPARTED",
  "lockedAt": "2026-02-05T06:00:00Z",
  "lockedBy": "user-dispatch-001",
  "createdBy": "user-logistics-001",
  "createdAt": "2026-02-04T16:00:00Z",
  "updatedAt": "2026-02-05T06:00:00Z",
  "departedAt": "2026-02-05T06:15:00Z",
  "deliveredAt": null,
  "closedAt": null,
  "podDocId": null,
  "podSignature": null,
  "podSignedBy": null,
  "podSignedAt": null
}
```

---

## Summary

The Drop Tag Engine provides:

1. **Immutable Material Identity**: Every piece traced from heat/lot through customer delivery
2. **QC Gate Enforcement**: No tags without QC release
3. **Mixed Material Prevention**: System-enforced grade/heat consistency
4. **Full Audit Trail**: Every action logged with correlation
5. **Multi-Location/Multi-Stop**: Complex routing with stop-level validation
6. **Future-Ready**: RFID and steel etching abstraction built in
7. **Customer-Specific**: Configurable templates and requirements per customer

This specification is ready for implementation in the existing React + Material UI + Node/Express + Prisma stack.
