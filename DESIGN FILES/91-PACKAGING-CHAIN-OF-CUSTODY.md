# 91 - Packaging, Labeling & Chain-of-Custody Module

**Version:** 1.0  
**Date:** February 4, 2026  
**Author:** Principal Systems Architect  
**Status:** Design Complete - Ready for Implementation

---

## A) PHILOSOPHY & OBJECTIVES

### Why Packaging is a Quality Gate

In metals and plastics service centers, packaging is NOT a clerical task—it is the **final quality gate** before material leaves custody. A packaging error can result in:

- **Mixed materials** reaching customer (catastrophic failure risk)
- **Wrong specifications** shipped (costly returns, liability)
- **Lost traceability** (audit failure, compliance violation)
- **Customer claims** (financial and reputational damage)

**Core Principle:** Packaging is a controlled, inspected, and auditable process that certifies material identity before handoff.

### Why Identity Preservation Matters

Metals and plastics industries deal with materials that:
- Look identical but have vastly different properties (304 vs 316 stainless)
- Must meet specific certifications (aerospace, nuclear, food-grade)
- Carry legal liability if misidentified (bridge failures, pipeline ruptures)
- Require full traceability for decades in some industries

**Core Principle:** Every piece of material must maintain unbroken identity from receipt through customer delivery.

### How Chain-of-Custody Protects Both Parties

Chain-of-custody documentation:
- **Protects the customer:** Proves they received what was ordered, from a verified source
- **Protects the supplier:** Provides evidence of proper handling, prevents false claims
- **Enables recalls:** Allows precise identification of affected materials
- **Satisfies auditors:** Demonstrates quality management system integrity

**Core Principle:** Custody events are immutable evidence, not editable records.

### Premium Customer & Audit Support

This module directly supports:
- **Aerospace customers** (AS9100 traceability requirements)
- **Nuclear industry** (NQA-1 custody controls)
- **Oil & gas** (API certification chains)
- **Automotive** (IATF 16949 lot traceability)
- **Government contracts** (DFARS compliance, country-of-origin)

**Core Principle:** Documentation is a product we deliver alongside material.

---

## B) PACKAGING & IDENTITY DATA MODEL

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Order       │──────▶│      Job        │──────▶│   Operation     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                        │                         │
         │                        │                         │
         ▼                        ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Package      │◀──────│  PackageItem    │──────▶│  InventoryUnit  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                                                  │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Label       │       │  PackageSeal    │       │   Heat/Lot      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ LabelTemplate   │       │ CustodyEvent    │◀──────│    Package      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐
                          │ ComplianceDoc   │
                          └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐
                          │  ShippingUnit   │
                          └─────────────────┘
```

### Core Entities

#### Package
```typescript
interface Package {
  id: string;                    // PKG-2026-000001
  orderId: string;               // Reference to order
  jobId: string;                 // Reference to job
  customerId: string;            // Customer receiving package
  
  packageType: PackageType;      // BUNDLE | PALLET | CRATE | SKID | BOX | DRUM
  packageNumber: number;         // 1 of N for this order
  totalPackages: number;         // N packages in order
  
  status: PackageStatus;         // See state machine
  qualityStatus: QualityStatus;  // PENDING | RELEASED | HOLD | REJECTED
  sealStatus: SealStatus;        // UNSEALED | SEALED | BROKEN
  
  grossWeight: number;           // Total weight including packaging
  netWeight: number;             // Material weight only
  tareWeight: number;            // Packaging weight
  weightUom: string;             // LBS | KG
  
  dimensions: {
    length: number;
    width: number;
    height: number;
    uom: string;                 // IN | CM
  };
  
  location: string;              // Current location code
  stagingArea: string;           // Assigned staging area
  
  createdAt: DateTime;
  createdBy: string;
  sealedAt: DateTime | null;
  sealedBy: string | null;
  qcReleasedAt: DateTime | null;
  qcReleasedBy: string | null;
  
  notes: string;
  specialHandling: string[];     // FRAGILE | HEAVY | HAZMAT | etc.
  
  // RFID/Tracking readiness
  rfidTagId: string | null;
  alternateIds: AlternateId[];   // Barcode, QR, etching references
}

enum PackageType {
  BUNDLE = 'BUNDLE',
  PALLET = 'PALLET',
  CRATE = 'CRATE',
  SKID = 'SKID',
  BOX = 'BOX',
  DRUM = 'DRUM',
  LOOSE = 'LOOSE'
}

enum PackageStatus {
  OPEN = 'OPEN',                 // Being assembled
  PACKING = 'PACKING',           // Items being added
  READY_FOR_QC = 'READY_FOR_QC', // Awaiting QC release
  QC_RELEASED = 'QC_RELEASED',   // QC approved
  SEALED = 'SEALED',             // Physically sealed
  STAGED = 'STAGED',             // In staging area
  LOADED = 'LOADED',             // On truck/carrier
  SHIPPED = 'SHIPPED',           // Departed facility
  DELIVERED = 'DELIVERED'        // Customer confirmed
}

enum QualityStatus {
  PENDING = 'PENDING',
  RELEASED = 'RELEASED',
  HOLD = 'HOLD',
  REJECTED = 'REJECTED'
}

enum SealStatus {
  UNSEALED = 'UNSEALED',
  SEALED = 'SEALED',
  BROKEN = 'BROKEN',
  RESEALED = 'RESEALED'
}
```

#### PackageItem
```typescript
interface PackageItem {
  id: string;
  packageId: string;
  
  // Material identification
  inventoryUnitId: string;       // Source inventory unit
  heatNumber: string;            // Heat/lot number
  lotNumber: string | null;      // Secondary lot if applicable
  
  // Material details
  materialGrade: string;         // 304, 6061-T6, etc.
  materialSpec: string;          // ASTM A240, etc.
  productType: string;           // SHEET, PLATE, BAR, TUBE, etc.
  
  // Dimensions
  thickness: number | null;
  width: number | null;
  length: number | null;
  outerDiameter: number | null;
  innerDiameter: number | null;
  dimensionUom: string;
  
  // Quantity
  quantity: number;              // Piece count
  weight: number;                // Weight of this item
  weightUom: string;
  
  // Traceability
  operationId: string | null;    // If from a processing operation
  inspectionId: string | null;   // QC inspection reference
  mtrReference: string | null;   // MTR document reference
  
  // Position in package
  position: number;              // Order in package
  pieceMarks: string[];          // Individual piece identifiers
  
  // Verification
  verifiedAt: DateTime | null;
  verifiedBy: string | null;
  scanConfirmed: boolean;        // Barcode/RFID confirmed
  
  createdAt: DateTime;
  createdBy: string;
}
```

#### Label
```typescript
interface Label {
  id: string;
  packageId: string;
  packageItemId: string | null;  // Null if package-level label
  
  templateId: string;            // Label template used
  labelType: LabelType;
  
  // Generated content
  content: LabelContent;         // Structured label data
  barcodeData: string;           // Encoded barcode content
  qrCodeData: string;            // Encoded QR content
  
  // Print tracking
  printCount: number;
  lastPrintedAt: DateTime | null;
  lastPrintedBy: string | null;
  printerUsed: string | null;
  
  // Reprint audit
  reprintReasons: ReprintEvent[];
  
  createdAt: DateTime;
  createdBy: string;
}

enum LabelType {
  PACKAGE_MAIN = 'PACKAGE_MAIN',       // Primary package label
  PACKAGE_SECONDARY = 'PACKAGE_SECONDARY', // Additional package labels
  PIECE_TAG = 'PIECE_TAG',             // Individual piece tag
  BUNDLE_TAG = 'BUNDLE_TAG',           // Bundle identifier
  HEAT_TAG = 'HEAT_TAG',               // Heat/lot identifier
  HAZMAT = 'HAZMAT',                   // Hazmat warning label
  HANDLING = 'HANDLING',               // Special handling
  CUSTOMER_SPECIFIC = 'CUSTOMER_SPECIFIC' // Customer format
}

interface LabelContent {
  packageId: string;
  customerName: string;
  customerPO: string;
  orderNumber: string;
  jobNumber: string;
  
  materialGrade: string;
  materialSpec: string;
  heatNumber: string;
  
  quantity: string;
  weight: string;
  dimensions: string;
  
  packageNumber: string;         // "1 of 3"
  
  complianceMarks: string[];     // Certification logos/marks
  countryOfOrigin: string;
  
  specialInstructions: string[];
}

interface ReprintEvent {
  printedAt: DateTime;
  printedBy: string;
  reason: string;
  approvedBy: string | null;
}
```

#### LabelTemplate
```typescript
interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  
  // Applicability
  customerId: string | null;     // Customer-specific or null for default
  productTypes: string[];        // Applicable product types
  
  // Template definition
  templateFormat: 'ZPL' | 'PDF' | 'HTML';
  templateContent: string;       // ZPL code or template markup
  
  // Layout
  width: number;
  height: number;
  sizeUom: 'IN' | 'MM';
  
  // Required fields
  requiredFields: string[];
  optionalFields: string[];
  
  // Barcode settings
  barcodeType: 'CODE128' | 'CODE39' | 'QR' | 'DATAMATRIX';
  barcodePosition: { x: number; y: number };
  
  isActive: boolean;
  isDefault: boolean;
  
  createdAt: DateTime;
  updatedAt: DateTime;
  createdBy: string;
}
```

#### PackageSeal
```typescript
interface PackageSeal {
  id: string;
  packageId: string;
  
  sealNumber: string;            // Physical seal identifier
  sealType: SealType;
  
  status: SealStatus;
  
  appliedAt: DateTime;
  appliedBy: string;
  
  brokenAt: DateTime | null;
  brokenBy: string | null;
  breakReason: string | null;
  breakApprovedBy: string | null;
  
  resealedAt: DateTime | null;
  resealedBy: string | null;
  newSealNumber: string | null;
  
  // Evidence
  photoEvidence: string[];       // URLs to seal photos
}

enum SealType {
  STRAP = 'STRAP',
  BAND = 'BAND',
  BOLT = 'BOLT',
  SHRINK = 'SHRINK',
  TAMPER_EVIDENT = 'TAMPER_EVIDENT',
  NONE = 'NONE'
}
```

#### ChainOfCustodyEvent
```typescript
interface ChainOfCustodyEvent {
  id: string;                    // Immutable UUID
  packageId: string;
  
  eventType: CustodyEventType;
  eventTimestamp: DateTime;      // System timestamp (not editable)
  
  // Actor
  actorId: string;               // User who performed action
  actorName: string;             // Denormalized for audit
  actorRole: string;             // Role at time of event
  
  // Location
  facilityId: string;
  locationCode: string;          // Specific location
  geoCoordinates: { lat: number; lng: number } | null;
  
  // Transfer details
  fromEntity: string | null;     // Previous custodian
  toEntity: string | null;       // New custodian
  
  // Evidence
  evidenceType: EvidenceType;
  evidenceData: string;          // Scan data, signature, etc.
  photoUrl: string | null;
  
  // Device info
  deviceId: string | null;
  deviceType: string | null;
  
  // Integrity
  previousEventId: string | null;
  eventHash: string;             // SHA-256 of event data
  chainHash: string;             // Running hash of chain
  
  notes: string | null;
  
  // Immutability flag
  isImmutable: boolean;          // Always true after creation
}

enum CustodyEventType {
  PACKAGE_CREATED = 'PACKAGE_CREATED',
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_REMOVED = 'ITEM_REMOVED',
  QC_INSPECTED = 'QC_INSPECTED',
  QC_RELEASED = 'QC_RELEASED',
  QC_HELD = 'QC_HELD',
  SEALED = 'SEALED',
  SEAL_BROKEN = 'SEAL_BROKEN',
  RESEALED = 'RESEALED',
  STAGED = 'STAGED',
  UNSTAGED = 'UNSTAGED',
  LOADED = 'LOADED',
  UNLOADED = 'UNLOADED',
  TRANSFERRED = 'TRANSFERRED',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  OVERRIDE = 'OVERRIDE'
}

enum EvidenceType {
  BARCODE_SCAN = 'BARCODE_SCAN',
  RFID_SCAN = 'RFID_SCAN',
  QR_SCAN = 'QR_SCAN',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  SIGNATURE = 'SIGNATURE',
  PHOTO = 'PHOTO',
  SYSTEM_GENERATED = 'SYSTEM_GENERATED'
}
```

#### ComplianceDocument
```typescript
interface ComplianceDocument {
  id: string;
  packageId: string;
  
  documentType: ComplianceDocType;
  documentNumber: string;
  
  // Content
  generatedAt: DateTime;
  generatedBy: string;
  content: object;               // Structured document data
  pdfUrl: string;                // Generated PDF
  
  // Validation
  isValid: boolean;
  validationErrors: string[];
  
  // References
  mtrReferences: string[];       // Source MTRs
  inspectionReferences: string[];
  cocReferences: string[];
  
  // Delivery
  includedInShipment: boolean;
  deliveryMethod: 'PRINT' | 'ELECTRONIC' | 'BOTH';
  sentAt: DateTime | null;
  sentTo: string | null;
  
  createdAt: DateTime;
}

enum ComplianceDocType {
  CERTIFICATE_OF_CONFORMANCE = 'COC',
  MILL_TEST_REPORT = 'MTR',
  PACKING_LIST = 'PACKING_LIST',
  BILL_OF_LADING = 'BOL',
  COMMERCIAL_INVOICE = 'INVOICE',
  COUNTRY_OF_ORIGIN = 'COO',
  HAZMAT_DECLARATION = 'HAZMAT',
  CUSTOMS_DECLARATION = 'CUSTOMS',
  CUSTOMER_CERT = 'CUSTOMER_CERT'
}
```

#### ShippingUnit
```typescript
interface ShippingUnit {
  id: string;
  shipmentId: string;
  
  packages: string[];            // Package IDs in this unit
  
  // Physical grouping
  unitType: 'TRUCK_LOAD' | 'LTL' | 'CONTAINER' | 'AIR_CARGO';
  unitNumber: string;            // Trailer number, container ID
  
  // Weight/dims
  totalWeight: number;
  totalPieces: number;
  
  // Status
  status: 'LOADING' | 'LOADED' | 'IN_TRANSIT' | 'DELIVERED';
  
  // Carrier info
  carrierId: string;
  driverName: string | null;
  driverLicense: string | null;
  
  // Custody transfer
  releasedAt: DateTime | null;
  releasedBy: string | null;
  signatureUrl: string | null;
  
  // Documents
  bolNumber: string;
  proNumber: string | null;
  
  departedAt: DateTime | null;
  estimatedArrival: DateTime | null;
  actualArrival: DateTime | null;
}
```

---

## C) PACKAGING WORKFLOWS (STATE MACHINES)

### Package Lifecycle State Machine

```
                                    ┌─────────────────┐
                                    │     OPEN        │
                                    │   (Created)     │
                                    └────────┬────────┘
                                             │
                                    Add first item
                                             │
                                             ▼
                                    ┌─────────────────┐
                              ┌────▶│    PACKING      │◀────┐
                              │     │ (Adding items)  │     │
                              │     └────────┬────────┘     │
                              │              │              │
                         Remove item    Submit for QC   Add item
                              │              │              │
                              │              ▼              │
                              │     ┌─────────────────┐     │
                              └─────│  READY_FOR_QC   │─────┘
                                    │(Awaiting review)│
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                           Reject         Release         Hold
                              │              │              │
                              ▼              ▼              ▼
                    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                    │  REJECTED   │ │ QC_RELEASED │ │  QC_HOLD    │
                    │(Needs work) │ │ (Approved)  │ │ (Blocked)   │
                    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
                           │               │               │
                      Return to        Seal package    Resolve hold
                       PACKING             │               │
                           │               ▼               │
                           └───────▶┌─────────────┐◀───────┘
                                    │   SEALED    │
                                    │(Tamper-proof)│
                                    └──────┬──────┘
                                           │
                                    Move to staging
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   STAGED    │
                                    │(Ready ship) │
                                    └──────┬──────┘
                                           │
                                    Load onto truck
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   LOADED    │
                                    │(On carrier) │
                                    └──────┬──────┘
                                           │
                                    Truck departs
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   SHIPPED   │
                                    │(In transit) │
                                    └──────┬──────┘
                                           │
                                    Delivery confirmed
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │  DELIVERED  │
                                    │(Complete)   │
                                    └─────────────┘
```

### Transition Rules

| From | To | Conditions | Actor |
|------|-----|------------|-------|
| OPEN | PACKING | First item added | Packaging Operator |
| PACKING | READY_FOR_QC | All items verified, weights recorded | Packaging Operator |
| READY_FOR_QC | QC_RELEASED | All items pass inspection, no holds | QC Inspector |
| READY_FOR_QC | QC_HOLD | Quality issue found | QC Inspector |
| READY_FOR_QC | REJECTED | Material mismatch, major issue | QC Inspector |
| QC_HOLD | QC_RELEASED | Issue resolved | QC Inspector |
| QC_RELEASED | SEALED | Physical seal applied | Packaging Operator |
| SEALED | STAGED | Moved to staging area | Packaging Operator |
| STAGED | LOADED | Loaded onto carrier | Shipping Coordinator |
| LOADED | SHIPPED | Carrier departs | Shipping Coordinator |
| SHIPPED | DELIVERED | POD received | System/Carrier |

### Blocking Conditions

**Cannot transition to QC_RELEASED if:**
- Any item has active quality hold
- Heat/lot verification incomplete
- Weight variance > tolerance
- Required inspections not performed

**Cannot transition to SEALED if:**
- Not QC_RELEASED
- Labels not printed
- Compliance documents not generated

**Cannot transition to LOADED if:**
- Not SEALED
- Shipment not created
- Required documentation missing

### Exception Handling

All exceptions require:
1. Supervisor approval
2. Documented reason
3. Custody event with OVERRIDE type
4. Email notification to Quality Manager

---

## D) LABELING SYSTEM DESIGN

### Label Requirements by Type

#### Package Main Label
```
┌─────────────────────────────────────────────────┐
│  [COMPANY LOGO]            PKG-2026-000042      │
│                                                 │
│  CUSTOMER: Aerospace Dynamics Inc.              │
│  PO: AD-2026-0892     ORDER: ORD-2026-1234     │
│                                                 │
│  ───────────────────────────────────────────── │
│                                                 │
│  MATERIAL: 304 STAINLESS STEEL                 │
│  SPEC: ASTM A240                               │
│  HEAT: H2026-4521                              │
│                                                 │
│  QTY: 12 PCS    WEIGHT: 2,450 LBS              │
│  DIMS: 48" x 96" x 0.250"                      │
│                                                 │
│  ───────────────────────────────────────────── │
│                                                 │
│  [████████████████████████]  PKG 1 of 3        │
│        (Barcode)                               │
│                                                 │
│  [QR CODE]    MADE IN USA    [CERT MARKS]      │
│                                                 │
│  ⚠ HEAVY LOAD - LIFT WITH CARE               │
└─────────────────────────────────────────────────┘
```

#### Piece Tag
```
┌─────────────────────────────┐
│  PC-2026-000042-001        │
│                            │
│  304SS / ASTM A240         │
│  HEAT: H2026-4521          │
│                            │
│  48" x 96" x 0.250"        │
│  204.2 LBS                 │
│                            │
│  [██████████████]          │
│                            │
│  ORD-2026-1234 / JOB-042   │
└─────────────────────────────┘
```

### Label Generation Rules

1. **Source of Truth**: All label data MUST come from verified system records
2. **No Manual Entry**: Operators cannot type material specs, heat numbers, etc.
3. **Barcode Contains**: Package ID + Heat + Weight (for verification)
4. **QR Code Contains**: URL to digital package record

### Label Templates by Customer

| Customer Type | Template Features |
|--------------|-------------------|
| Standard | Basic package label |
| Aerospace | Part number, lot control, cert marks |
| Nuclear | NQA-1 compliance marks, CMTR reference |
| Automotive | AIAG format, supplier code |
| Government | DFARS marking, country of origin |

### Print-on-Demand Workflow

```
1. Operator completes package → System auto-generates label data
2. Operator clicks "Print Labels" → Preview shown
3. Operator confirms → Sent to designated printer
4. Print confirmed → Label.printCount incremented
5. Physical label applied → Scan to verify
```

### Reprint Rules

- First print: No approval needed
- Reprint 2-3: Reason required, logged
- Reprint 4+: Supervisor approval required
- All reprints logged with timestamp, actor, reason

---

## E) CHAIN-OF-CUSTODY MODEL

### Custody Event Sequence

```
Timeline ─────────────────────────────────────────────────────────▶

Event 1      Event 2       Event 3        Event 4       Event 5
┌──────┐    ┌──────┐      ┌──────┐       ┌──────┐      ┌──────┐
│CREATE│───▶│ ADD  │─────▶│ QC   │──────▶│ SEAL │─────▶│STAGE │
│      │    │ ITEM │      │RELEASE│      │      │      │      │
└──────┘    └──────┘      └──────┘       └──────┘      └──────┘
   │            │             │              │             │
   ▼            ▼             ▼              ▼             ▼
┌──────┐    ┌──────┐      ┌──────┐       ┌──────┐      ┌──────┐
│Hash-1│───▶│Hash-2│─────▶│Hash-3│──────▶│Hash-4│─────▶│Hash-5│
└──────┘    └──────┘      └──────┘       └──────┘      └──────┘
```

### Hash Chain Integrity

Each event contains:
- `eventHash`: SHA-256 of current event data
- `chainHash`: SHA-256 of (previousChainHash + eventHash)
- `previousEventId`: Pointer to prior event

This creates an immutable, verifiable chain.

### Required Custody Events

| Event Type | Required Data | Evidence Type |
|-----------|---------------|---------------|
| PACKAGE_CREATED | packageId, orderId, operator | SYSTEM_GENERATED |
| ITEM_ADDED | itemId, materialInfo, weight | BARCODE_SCAN |
| QC_RELEASED | inspectorId, inspectionResult | MANUAL_ENTRY |
| SEALED | sealNumber, photo | PHOTO |
| STAGED | location, time | BARCODE_SCAN |
| LOADED | unitId, driver | SIGNATURE |
| DEPARTED | carrier, BOL | SYSTEM_GENERATED |
| DELIVERED | recipient, POD | SIGNATURE |

### Custody Gap Detection

System monitors for:
- Time gaps > 8 hours without event (alert generated)
- Missing required events in sequence
- Location inconsistencies
- Unauthorized actors

### Immutability Enforcement

1. All custody events are INSERT-only (no UPDATE/DELETE)
2. Database triggers prevent modification
3. Application layer enforces `isImmutable: true`
4. Audit log captures any attempted modifications

---

## F) INTEGRATION WITH QUALITY, INVENTORY, SHIPPING

### Quality Integration

```
Quality Hold Check
───────────────────
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Package   │────▶│  Check for  │────▶│  Block if   │
│   Created   │     │ Active Holds│     │  Hold Exists│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │Quality Hold │
                    │   Table     │
                    │  ─────────  │
                    │ Material X  │◀─── Cannot package
                    │ Heat Y      │
                    │ NCR #1234   │
                    └─────────────┘
```

**Integration Points:**
- Package creation checks for holds on source material
- QC release requires all inspection points passed
- Hold applied after packaging triggers recall workflow
- CoC generation pulls from inspection results

### Inventory Integration

```
Inventory Consumption
─────────────────────
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Add Item   │────▶│  Reserve    │────▶│  Consume    │
│ to Package  │     │  Inventory  │     │  on Ship    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Inventory   │
                    │   Unit      │
                    │  ─────────  │
                    │ Status:     │
                    │ RESERVED →  │
                    │ CONSUMED    │
                    └─────────────┘
```

**Integration Points:**
- Adding item to package reserves inventory
- Removing item returns to available
- Package ship confirms consumption
- Lot integrity maintained (no mixed heats in single bundle unless allowed)

### Shipping Integration

```
Shipping Workflow
─────────────────
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Package    │────▶│  Shipment   │────▶│  Carrier    │
│  SEALED     │     │  Created    │     │  Loaded     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │Documentation│
                    │  ─────────  │
                    │ BOL         │
                    │ Packing List│
                    │ CoC         │
                    │ MTRs        │
                    └─────────────┘
```

**Integration Points:**
- Shipment cannot load unsealed packages
- Documentation auto-generated and attached
- Custody chain continues through carrier handoff
- POD triggers final custody event

---

## G) RFID / ETCHING READINESS

### Abstraction Layer Design

```typescript
interface IdentificationMethod {
  type: 'BARCODE' | 'QR' | 'RFID' | 'ETCHING' | 'NFC';
  identifier: string;
  
  // Method to read/verify
  read(): Promise<IdentificationResult>;
  verify(expected: string): Promise<boolean>;
  
  // Method to write (for RFID)
  write?(data: string): Promise<boolean>;
}

interface IdentificationResult {
  success: boolean;
  identifier: string;
  timestamp: DateTime;
  deviceId: string;
  signalStrength?: number; // For RFID
  confidence?: number;
}

// Package can have multiple identification methods
interface PackageIdentifiers {
  primary: IdentificationMethod;
  alternates: IdentificationMethod[];
}
```

### RFID Tag Association

```typescript
interface RFIDTag {
  tagId: string;             // EPC or TID
  tagType: 'UHF' | 'HF' | 'NFC';
  
  associatedTo: {
    type: 'PACKAGE' | 'PIECE' | 'PALLET';
    id: string;
  };
  
  associatedAt: DateTime;
  associatedBy: string;
  
  lastReadAt: DateTime;
  lastReadLocation: string;
  readCount: number;
  
  isActive: boolean;
  deactivatedAt: DateTime | null;
  deactivationReason: string | null;
}
```

### Steel Etching Integration

```typescript
interface EtchingMark {
  markId: string;
  pieceId: string;
  
  markType: 'LASER' | 'DOT_PEEN' | 'INK_JET' | 'ELECTROCHEMICAL';
  markContent: string;       // What was etched
  markPosition: string;      // Location on piece
  
  etchedAt: DateTime;
  etchedBy: string;
  machineId: string;
  
  verified: boolean;
  verifiedAt: DateTime | null;
  verifiedBy: string | null;
  
  imageUrl: string | null;   // Photo of mark
}
```

### Fallback Strategy

```
Primary Attempt: RFID Scan
        │
        ▼
    Success? ──Yes──▶ Record custody event
        │
        No
        │
        ▼
Secondary Attempt: Barcode Scan
        │
        ▼
    Success? ──Yes──▶ Record custody event
        │
        No
        │
        ▼
Tertiary: Manual Entry (with supervisor)
        │
        ▼
Record event with MANUAL_ENTRY evidence type
```

---

## H) UI / UX DESIGN (MATERIAL UI)

### Page Hierarchy

```
Packaging Module
├── Packaging Queue         /packaging/queue
├── Package Builder         /packaging/builder/:id
├── Label Management        /packaging/labels
├── QC Release Station      /packaging/qc-release
├── Staging Board           /packaging/staging
├── Custody Timeline        /packaging/custody/:id
└── Documentation Center    /packaging/docs
```

### Page 1: Packaging Queue

```
┌─────────────────────────────────────────────────────────────────┐
│  PACKAGING QUEUE                                    [+ New Pkg] │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [Status ▼] [Customer ▼] [Priority ▼] [🔍 Search]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── OPEN (3) ────┐  ┌── PACKING (5) ──┐  ┌── READY QC (8) ──┐│
│  │                 │  │                 │  │                  ││
│  │ PKG-042        │  │ PKG-041        │  │ PKG-038         ││
│  │ Aero Dynamics  │  │ Metal Works    │  │ Steel Corp      ││
│  │ 304SS - 12 pcs │  │ 6061-T6 - 8 pc │  │ A36 - 24 pcs    ││
│  │ [Start]        │  │ [Continue]     │  │ [Review]        ││
│  │                 │  │                 │  │                  ││
│  │ PKG-043        │  │ PKG-040        │  │ PKG-037         ││
│  │ ...            │  │ ...            │  │ ...             ││
│  └─────────────────┘  └─────────────────┘  └──────────────────┘│
│                                                                 │
│  ┌── QC RELEASED (4) ─┐  ┌── SEALED (6) ──┐  ┌── STAGED (12) ─┐│
│  │                    │  │                │  │                ││
│  │ PKG-036           │  │ PKG-032       │  │ PKG-028        ││
│  │ [Seal]            │  │ [Stage]       │  │ Ready: Dock 3  ││
│  │                    │  │                │  │                ││
│  └────────────────────┘  └────────────────┘  └────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Page 2: Package Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back   PACKAGE BUILDER - PKG-2026-000042                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────── ORDER INFO ─────────────┐  ┌─── PACKAGE ────────┐│
│  │ Order: ORD-2026-1234                │  │ Type: [PALLET ▼]  ││
│  │ Customer: Aerospace Dynamics        │  │ # 1 of 3          ││
│  │ PO: AD-2026-0892                    │  │                    ││
│  │ Ship Date: Feb 5, 2026              │  │ Gross: 2,512 LBS   ││
│  │ Priority: 🔴 EXPEDITE               │  │ Tare:     62 LBS   ││
│  └─────────────────────────────────────┘  │ Net:   2,450 LBS   ││
│                                           └────────────────────┘│
│  ┌─────────────── SCAN TO ADD ─────────────────────────────────┐│
│  │  [______________________________________]  🔍 or [Select]  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────── ITEMS IN PACKAGE (12) ───────────────────────┐│
│  │ # │ Material      │ Heat        │ Dims           │ Weight  ││
│  │───┼───────────────┼─────────────┼────────────────┼─────────││
│  │ 1 │ 304SS A240    │ H2026-4521  │ 48x96x0.250"   │ 204.2   ││
│  │ 2 │ 304SS A240    │ H2026-4521  │ 48x96x0.250"   │ 204.2   ││
│  │ 3 │ 304SS A240    │ H2026-4521  │ 48x96x0.250"   │ 204.2   ││
│  │...│ ...           │ ...         │ ...            │ ...     ││
│  │12 │ 304SS A240    │ H2026-4521  │ 48x96x0.250"   │ 204.2   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ⚠ VALIDATION                                                  │
│  ✓ All items same heat                                         │
│  ✓ Weight within tolerance                                     │
│  ✓ All inspections passed                                      │
│                                                                 │
│  [Cancel]                    [Save Draft]  [Submit for QC ▶]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Page 3: QC Release Station

```
┌─────────────────────────────────────────────────────────────────┐
│  QC RELEASE STATION                              Inspector: JS  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────── PENDING RELEASE (8) ────────┐  ┌── SELECTED PKG ───┐│
│  │                                     │  │                    ││
│  │ ○ PKG-038  Steel Corp    A36      │  │  PKG-038           ││
│  │ ● PKG-037  Aero Dyn.     304SS    │  │  ─────────────────  ││
│  │ ○ PKG-036  Metal Wrks    6061     │  │  Customer: Steel   ││
│  │ ○ PKG-035  Fab Inc       CS1018   │  │  Material: A36     ││
│  │ ○ PKG-034  ...           ...      │  │  Qty: 24 pcs       ││
│  │                                     │  │  Weight: 4,800 lbs ││
│  └─────────────────────────────────────┘  └────────────────────┘│
│                                                                 │
│  ┌─────────────── VERIFICATION CHECKLIST ──────────────────────┐│
│  │                                                              ││
│  │  ☑ Material grade matches order           Verified: JS     ││
│  │  ☑ Heat number verified                   Verified: JS     ││
│  │  ☑ Quantity correct                       Verified: JS     ││
│  │  ☑ Weight within tolerance (±2%)          Variance: +0.8%  ││
│  │  ☑ Dimensions verified                    Verified: JS     ││
│  │  ☑ No active quality holds                Checked: ✓       ││
│  │  ☑ Inspection records complete            Records: 3       ││
│  │  ☐ Visual inspection acceptable           [ Pending ]      ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────── ACTIONS ─────────────────────────────────────┐│
│  │                                                              ││
│  │  [🔴 REJECT]    [🟡 HOLD]    [🟢 RELEASE TO SEAL]          ││
│  │                                                              ││
│  │  Rejection/Hold Reason: [________________________________]  ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Page 4: Chain-of-Custody Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back   CHAIN OF CUSTODY - PKG-2026-000042      [Export PDF] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── PACKAGE SUMMARY ─────────────────────────────────────────┐│
│  │ Customer: Aerospace Dynamics    Order: ORD-2026-1234        ││
│  │ Material: 304SS ASTM A240       Heat: H2026-4521            ││
│  │ Status: SHIPPED                 Seal: TES-2026-0089         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  CUSTODY CHAIN (Verified: ✓ Integrity Intact)                  │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  ● Feb 4, 08:15 AM  PACKAGE_CREATED                            │
│  │                  Actor: Mike Rodriguez (Pkg Operator)        │
│  │                  Location: Packaging Station 2               │
│  │                  Evidence: System Generated                  │
│  │                  Hash: a3f2...8d91                          │
│  │                                                              │
│  ● Feb 4, 08:22 AM  ITEM_ADDED (x12)                           │
│  │                  Actor: Mike Rodriguez                       │
│  │                  Evidence: Barcode Scan                      │
│  │                  Items: 12 pieces from Unit-2026-4521       │
│  │                                                              │
│  ● Feb 4, 09:45 AM  QC_RELEASED                                │
│  │                  Actor: Janet Smith (QC Inspector)           │
│  │                  Evidence: Manual Entry                      │
│  │                  Result: All checks passed                   │
│  │                                                              │
│  ● Feb 4, 10:02 AM  SEALED                                     │
│  │                  Actor: Mike Rodriguez                       │
│  │                  Seal #: TES-2026-0089                       │
│  │                  Evidence: Photo [📷 View]                   │
│  │                                                              │
│  ● Feb 4, 10:15 AM  STAGED                                     │
│  │                  Actor: Mike Rodriguez                       │
│  │                  Location: Staging Area - Dock 3             │
│  │                  Evidence: Barcode Scan                      │
│  │                                                              │
│  ● Feb 4, 01:30 PM  LOADED                                     │
│  │                  Actor: Tom Wilson (Shipping Coord)          │
│  │                  Unit: Truck T-445                           │
│  │                  Evidence: Signature [✍ View]                │
│  │                                                              │
│  ● Feb 4, 02:00 PM  DEPARTED                                   │
│     Carrier: FastFreight Inc.                                   │
│     BOL: BL-2026-08921                                          │
│     ETA: Feb 5, 10:00 AM                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Page 5: Staging Board

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGING BOARD                           🔄 Auto-refresh: ON    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── DOCK 1 ──────┐  ┌─── DOCK 2 ──────┐  ┌─── DOCK 3 ──────┐ │
│  │ Carrier: ABC    │  │ Carrier: XYZ    │  │ Carrier: ---    │ │
│  │ Truck: T-442    │  │ Truck: T-443    │  │ (Available)     │ │
│  │ Depart: 2:00 PM │  │ Depart: 3:30 PM │  │                 │ │
│  │ ────────────────│  │ ────────────────│  │                 │ │
│  │ 📦 PKG-032     │  │ 📦 PKG-028     │  │                 │ │
│  │ 📦 PKG-033     │  │ 📦 PKG-029     │  │                 │ │
│  │ 📦 PKG-034     │  │ 📦 PKG-030     │  │                 │ │
│  │                 │  │ 📦 PKG-031     │  │                 │ │
│  │ [Load ✓]       │  │ [Load ✓]       │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─── STAGING AREA ────────────────────────────────────────────┐│
│  │                                                              ││
│  │  SEALED & WAITING (6)                                        ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    ││
│  │  │PKG-035│ │PKG-036│ │PKG-037│ │PKG-038│ │PKG-039│    ││
│  │  │AeroDyn│ │MetalWk│ │SteelCo│ │FabInc │ │TubeCo │    ││
│  │  │2,450lb│ │1,200lb│ │4,800lb│ │  890lb│ │3,200lb│    ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    ││
│  │                                                              ││
│  │  [Drag to dock to assign]                                   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Zero Ambiguity**: Clear status indicators, no confusion about next action
2. **Scan-First**: Every interaction supports barcode/RFID scanning
3. **Minimal Typing**: Dropdowns, selections, scans - not keyboards
4. **Visual Confirmation**: Color-coded status, icons, progress indicators
5. **Error Prevention**: Validation before submission, blocking conditions visible
6. **Audit Trail Visible**: Users see custody events being created

---

## I) ROLES & PERMISSIONS

### Role Definitions

| Role | Description | Typical Users |
|------|-------------|---------------|
| Packaging Operator | Creates packages, adds items, seals | Warehouse staff |
| QC Inspector | Releases packages, applies holds | Quality team |
| Shipping Coordinator | Loads, dispatches, manages staging | Shipping staff |
| Supervisor | Overrides, approvals, exception handling | Shift leads |
| Ops Manager | Full access, reporting, configuration | Management |
| Executive | Read-only dashboards | Leadership |

### Permission Matrix

| Action | Pkg Op | QC Insp | Ship Coord | Supv | Ops Mgr |
|--------|--------|---------|------------|------|---------|
| Create Package | ✓ | | | ✓ | ✓ |
| Add/Remove Items | ✓ | | | ✓ | ✓ |
| Submit for QC | ✓ | | | ✓ | ✓ |
| QC Release | | ✓ | | ✓ | ✓ |
| QC Hold | | ✓ | | ✓ | ✓ |
| Seal Package | ✓ | | | ✓ | ✓ |
| Stage Package | ✓ | | ✓ | ✓ | ✓ |
| Load Package | | | ✓ | ✓ | ✓ |
| Dispatch Shipment | | | ✓ | ✓ | ✓ |
| Break Seal | | | | ✓ | ✓ |
| Override Hold | | | | ✓ | ✓ |
| Reprint Label (4+) | | | | ✓ | ✓ |
| View Custody | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export Audit | | | | ✓ | ✓ |
| Configure Templates | | | | | ✓ |

### Override Workflow

```
1. Actor requests override (e.g., seal break)
2. System requires:
   - Reason (mandatory text)
   - Supervisor selection
3. Supervisor receives notification
4. Supervisor approves/denies with comments
5. If approved:
   - Action completed
   - Custody event created with OVERRIDE type
   - Both actors logged
6. Quality Manager notified of all overrides
```

---

## J) APIS & EVENTING

### REST API Endpoints

#### Packages

```
GET    /api/v1/packages                    List packages (filtered)
POST   /api/v1/packages                    Create new package
GET    /api/v1/packages/:id                Get package details
PATCH  /api/v1/packages/:id                Update package
POST   /api/v1/packages/:id/submit-qc      Submit for QC review
POST   /api/v1/packages/:id/seal           Seal package
POST   /api/v1/packages/:id/stage          Move to staging
POST   /api/v1/packages/:id/break-seal     Break seal (requires approval)

GET    /api/v1/packages/:id/items          List package items
POST   /api/v1/packages/:id/items          Add item to package
DELETE /api/v1/packages/:id/items/:itemId  Remove item from package
POST   /api/v1/packages/:id/items/scan     Add item by scan
```

#### QC Release

```
GET    /api/v1/qc/pending                  Packages pending QC
POST   /api/v1/qc/:packageId/release       Release package
POST   /api/v1/qc/:packageId/hold          Place on hold
POST   /api/v1/qc/:packageId/reject        Reject package
GET    /api/v1/qc/:packageId/checklist     Get verification checklist
POST   /api/v1/qc/:packageId/verify        Submit verification
```

#### Labels

```
GET    /api/v1/labels/templates            List label templates
POST   /api/v1/labels/templates            Create template
GET    /api/v1/packages/:id/labels         Get labels for package
POST   /api/v1/packages/:id/labels         Generate labels
POST   /api/v1/labels/:id/print            Print label
GET    /api/v1/labels/:id/preview          Preview label (PDF/image)
```

#### Chain of Custody

```
GET    /api/v1/custody/:packageId          Get custody timeline
GET    /api/v1/custody/:packageId/verify   Verify chain integrity
POST   /api/v1/custody/event               Record custody event
GET    /api/v1/custody/export/:packageId   Export custody report
```

#### Compliance Documents

```
GET    /api/v1/packages/:id/documents      List documents for package
POST   /api/v1/packages/:id/documents      Generate document
GET    /api/v1/documents/:id               Get document
GET    /api/v1/documents/:id/pdf           Download PDF
POST   /api/v1/documents/:id/send          Send to customer
```

#### Staging & Loading

```
GET    /api/v1/staging/board               Get staging board state
POST   /api/v1/staging/assign              Assign package to dock
POST   /api/v1/loading/load                Load package to unit
POST   /api/v1/loading/dispatch            Dispatch shipping unit
GET    /api/v1/docks                       List dock assignments
```

### Event Bus Messages

| Event | Payload | Subscribers |
|-------|---------|-------------|
| package.created | { packageId, orderId, operator } | Inventory, Shipping |
| package.item.added | { packageId, itemId, materialInfo } | Inventory, Quality |
| package.submitted | { packageId, submittedBy } | Quality |
| package.qc.released | { packageId, inspector } | Shipping, Packaging |
| package.qc.held | { packageId, reason, inspector } | Quality, Ops |
| package.sealed | { packageId, sealNumber, operator } | Shipping |
| package.staged | { packageId, location, operator } | Shipping |
| package.loaded | { packageId, unitId, coordinator } | Logistics, Ops |
| package.shipped | { packageId, carrier, bol } | Customer, Ops |
| custody.recorded | { eventId, packageId, eventType } | Audit |
| label.printed | { labelId, packageId, printer } | Audit |
| seal.broken | { packageId, reason, approver } | Quality, Ops |

### Webhook Configuration

Customers can subscribe to events:

```json
{
  "webhookUrl": "https://customer.com/hooks/steelwise",
  "events": ["package.shipped", "package.delivered"],
  "secret": "sha256-hmac-key",
  "active": true
}
```

---

## K) AUDIT & EVIDENCE

### Evidence Types

| Type | Description | Storage |
|------|-------------|---------|
| Barcode Scan | Scan event with device ID | Event record |
| RFID Read | Tag ID + signal strength | Event record |
| Photo | Seal photo, package photo | Object storage + link |
| Signature | Driver/receiver signature | Image + link |
| Document | Generated CoC, MTR, BOL | PDF storage |
| System Event | Auto-generated events | Event record |

### Audit Export Format

#### Package Audit Report (PDF)

```
PACKAGE AUDIT REPORT
═══════════════════════════════════════════════════════

Package ID: PKG-2026-000042
Generated: Feb 4, 2026 3:45 PM
Generated By: System Export

PACKAGE DETAILS
───────────────
Order: ORD-2026-1234
Customer: Aerospace Dynamics Inc.
PO: AD-2026-0892
Material: 304 Stainless Steel, ASTM A240
Heat: H2026-4521
Quantity: 12 pieces
Net Weight: 2,450 LBS

CHAIN OF CUSTODY
───────────────
[Full timeline with all events, actors, evidence]

VERIFICATION CHECKLIST
───────────────────────
[QC verification items with inspector name/date]

DOCUMENTS INCLUDED
──────────────────
☑ Certificate of Conformance (COC-2026-0892)
☑ Mill Test Report (MTR-H2026-4521)
☑ Packing List (PL-2026-000042)

LABELS GENERATED
────────────────
[Label print history with reprint reasons if any]

SEAL RECORD
───────────
Seal #: TES-2026-0089
Applied: Feb 4, 2026 10:02 AM by Mike Rodriguez
Status: Intact
Photo: [Embedded image]

INTEGRITY VERIFICATION
──────────────────────
Chain Hash: a3f2c891...
Verification: ✓ PASSED
No gaps or anomalies detected.

───────────────────────────────────────────────────────
This report is system-generated and tamper-resistant.
Report ID: RPT-2026-000042
```

### Export Formats

- **PDF**: Human-readable report with embedded images
- **JSON**: Machine-readable for integration
- **CSV**: Event log for spreadsheet analysis
- **XML**: EDI/customer system integration

### Retention Policy

| Data Type | Retention |
|-----------|-----------|
| Packages | 10 years |
| Custody Events | Permanent (immutable) |
| Labels | 10 years |
| Photos/Evidence | 10 years |
| Compliance Docs | Per regulation (7-20 years) |

---

## L) TESTING & VALIDATION

### Test Cases

#### Material Identity Preservation

| Test | Description | Expected Result |
|------|-------------|-----------------|
| TC-001 | Add item from wrong heat | System blocks, shows error |
| TC-002 | Add item with active hold | System blocks, shows hold info |
| TC-003 | Mixed materials in bundle | Warning if policy forbids |
| TC-004 | Heat number mismatch | Scan verification fails |

#### Workflow Enforcement

| Test | Description | Expected Result |
|------|-------------|-----------------|
| TC-010 | Seal without QC release | Button disabled, tooltip explains |
| TC-011 | Load unsealed package | System rejects load action |
| TC-012 | Edit sealed package | All edit options disabled |
| TC-013 | Skip QC step | Cannot transition to SEALED |

#### Custody Chain Integrity

| Test | Description | Expected Result |
|------|-------------|-----------------|
| TC-020 | Verify complete chain | All required events present |
| TC-021 | Detect tampered event | Hash verification fails |
| TC-022 | Gap detection | Alert on >8 hour gap |
| TC-023 | Back-dated event | System rejects |

#### RFID Abstraction

| Test | Description | Expected Result |
|------|-------------|-----------------|
| TC-030 | RFID primary, barcode fallback | Both methods work |
| TC-031 | RFID disabled | Barcode works seamlessly |
| TC-032 | RFID enable later | No code changes needed |

#### Label System

| Test | Description | Expected Result |
|------|-------------|-----------------|
| TC-040 | Generate label from system data | All fields populated correctly |
| TC-041 | Attempt manual override | Not possible |
| TC-042 | Reprint tracking | Count incremented, logged |
| TC-043 | Customer-specific template | Correct template selected |

### Integration Tests

```javascript
describe('Package Workflow Integration', () => {
  it('blocks packaging when quality hold exists', async () => {
    // Create inventory with active hold
    // Attempt to add to package
    // Assert: error returned, package unchanged
  });

  it('maintains custody chain through complete lifecycle', async () => {
    // Create package → Add items → QC → Seal → Stage → Load → Ship
    // Assert: all custody events present
    // Assert: chain hash valid
  });

  it('prevents mixed heats in single bundle', async () => {
    // Create package with item from Heat A
    // Attempt to add item from Heat B
    // Assert: error or warning per configuration
  });
});
```

### Performance Tests

| Scenario | Target |
|----------|--------|
| Package creation | < 500ms |
| Add item by scan | < 200ms |
| Generate label | < 1s |
| QC release | < 500ms |
| Custody timeline load | < 2s |
| Audit export (large package) | < 10s |

---

## M) ROLLOUT & GO/NO-GO CRITERIA

### Rollout Phases

#### Phase 1: Pilot (Week 1-2)
- Single packaging station
- 2-3 trained operators
- Limited customer set (internal/forgiving)
- All features except RFID

#### Phase 2: Expansion (Week 3-4)
- All packaging stations
- Full operator training
- Expanded customer set
- Label template library complete

#### Phase 3: Full Production (Week 5+)
- All orders flow through system
- Legacy process disabled
- Full audit compliance
- Customer documentation automated

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Packaging errors | 0 | Customer claims on material identity |
| Custody gaps | 0 | System-detected chain breaks |
| QC release time | < 10 min | Average from submit to release |
| Label accuracy | 100% | Spot checks + customer feedback |
| User adoption | > 95% | Packages created in system |

### Go/No-Go Criteria

#### Must Pass (Go)
- [ ] Zero mixed material incidents in pilot
- [ ] 100% custody chain completeness
- [ ] All label templates validated
- [ ] User training complete
- [ ] Backup/recovery tested
- [ ] Integration tests passing

#### Nice to Have
- [ ] RFID integration ready (can defer)
- [ ] Customer webhook subscriptions
- [ ] Mobile scanning app

### Rollback Plan

If critical issues occur:
1. Revert to manual packaging process
2. Data preserved (no deletion)
3. Fix issues, re-pilot
4. Migrate any manual packages to system

---

## APPENDIX: SAMPLE DATA

### Package Example

```json
{
  "id": "PKG-2026-000042",
  "orderId": "ORD-2026-1234",
  "jobId": "JOB-2026-0042",
  "customerId": "CUST-AERODYN",
  "packageType": "PALLET",
  "packageNumber": 1,
  "totalPackages": 3,
  "status": "SHIPPED",
  "qualityStatus": "RELEASED",
  "sealStatus": "SEALED",
  "grossWeight": 2512,
  "netWeight": 2450,
  "tareWeight": 62,
  "weightUom": "LBS",
  "dimensions": {
    "length": 96,
    "width": 48,
    "height": 12,
    "uom": "IN"
  },
  "location": "IN_TRANSIT",
  "createdAt": "2026-02-04T08:15:00Z",
  "createdBy": "user-mike-r",
  "sealedAt": "2026-02-04T10:02:00Z",
  "sealedBy": "user-mike-r",
  "qcReleasedAt": "2026-02-04T09:45:00Z",
  "qcReleasedBy": "user-janet-s",
  "specialHandling": ["HEAVY"]
}
```

### Custody Event Example

```json
{
  "id": "evt-2026-000042-007",
  "packageId": "PKG-2026-000042",
  "eventType": "SEALED",
  "eventTimestamp": "2026-02-04T10:02:00Z",
  "actorId": "user-mike-r",
  "actorName": "Mike Rodriguez",
  "actorRole": "Packaging Operator",
  "facilityId": "FAC-JACKSON",
  "locationCode": "PKG-STATION-2",
  "evidenceType": "PHOTO",
  "evidenceData": "seal-photo-url",
  "previousEventId": "evt-2026-000042-006",
  "eventHash": "a3f2c891d4e5f6a7b8c9d0e1f2a3b4c5",
  "chainHash": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
  "isImmutable": true
}
```

---

**END OF DESIGN DOCUMENT**

---

**Next Steps:** Implement full UI module per Section H specifications.
