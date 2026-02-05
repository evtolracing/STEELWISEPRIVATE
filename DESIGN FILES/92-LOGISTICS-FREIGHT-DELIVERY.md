# 92 - Logistics, Freight Optimization & Delivery Confirmation Module

**Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Design Complete  
**Author:** Principal Logistics & Transportation Systems Architect

---

## Table of Contents

1. [Philosophy & Objectives](#a-philosophy--objectives)
2. [Logistics Data Model](#b-logistics-data-model)
3. [Shipment Planning & Optimization](#c-shipment-planning--optimization)
4. [Carrier Management](#d-carrier-management)
5. [Routing & Consolidation Logic](#e-routing--consolidation-logic)
6. [Execution & Tracking Workflow](#f-execution--tracking-workflow)
7. [Delivery Confirmation & Exceptions](#g-delivery-confirmation--exceptions)
8. [Integration with Packaging, Inventory, Finance](#h-integration-with-packaging-inventory-finance)
9. [UI / UX Design](#i-ui--ux-design)
10. [Roles & Permissions](#j-roles--permissions)
11. [APIs & Eventing](#k-apis--eventing)
12. [Analytics & KPIs](#l-analytics--kpis)
13. [Audit & Evidence](#m-audit--evidence)
14. [Testing & Validation](#n-testing--validation)
15. [Rollout & Go/No-Go Criteria](#o-rollout--gonogo-criteria)

---

## A) Philosophy & Objectives

### Strategic Vision

Freight is not a cost center—it is a **strategic lever** that directly impacts:

1. **Customer Trust & Retention**: On-time, damage-free delivery is the final impression
2. **Margin Optimization**: Intelligent carrier selection and consolidation improve profitability
3. **Competitive Advantage**: Superior logistics execution differentiates from competitors
4. **Operational Excellence**: End-to-end visibility reduces chaos and reactive firefighting

### Core Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOGISTICS PHILOSOPHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EXPLAINABLE DECISIONS                                                   │
│     Every carrier/route recommendation must show reasoning                  │
│     "Why this carrier?" is always answerable                                │
│                                                                             │
│  2. CHAIN-OF-CUSTODY INTEGRITY                                              │
│     Shipment cannot depart without sealed packages                          │
│     Documentation must accompany material                                   │
│                                                                             │
│  3. CLOSED-LOOP CONFIRMATION                                                │
│     Delivery is not complete until POD is captured                          │
│     Operational loop closes when customer confirms receipt                  │
│                                                                             │
│  4. PROACTIVE EXCEPTION MANAGEMENT                                          │
│     Detect delays before customers ask                                      │
│     Resolve exceptions with documented actions                              │
│                                                                             │
│  5. AUDITABLE OVERRIDES                                                     │
│     Manual decisions require approval and logging                           │
│     System recommendations can be overridden with justification             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| On-Time Delivery | ≥ 95% | Actual vs. Promise Date |
| Freight Cost Reduction | 8-12% | vs. Historical Average |
| Consolidation Rate | ≥ 40% | Multi-order shipments |
| Exception Resolution | < 24 hrs | Time to resolution |
| POD Capture Rate | 100% | All deliveries confirmed |
| Damage Rate | < 0.5% | Claims per shipment |

### Link to Customer Trust

```
Order Placed → Production Complete → Packaged → SHIPPED → DELIVERED
                                                   ↓
                                        Customer's Final Experience
                                                   ↓
                                        Trust = Repeat Business
```

---

## B) Logistics Data Model

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     CARRIER     │     │    SHIPMENT     │     │     ROUTE       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ code            │◄────│ carrierId       │     │ shipmentId      │──►│
│ name            │     │ routeId         │────►│ mode            │
│ mode            │     │ status          │     │ totalMiles      │
│ regions[]       │     │ originId        │     │ totalStops      │
│ capabilities[]  │     │ destinationId   │     │ estimatedHours  │
│ isActive        │     │ requestedDate   │     │ optimizationScore│
└─────────────────┘     │ promiseDate     │     └─────────────────┘
                        │ totalWeight     │              │
                        │ totalValue      │              ▼
                        │ freightCost     │     ┌─────────────────┐
                        │ bookedAt        │     │  SHIPMENT_LEG   │
                        └─────────────────┘     ├─────────────────┤
                               │                │ id              │
                               │                │ routeId         │
                               ▼                │ sequence        │
                        ┌─────────────────┐     │ fromLocationId  │
                        │ SHIPMENT_PACKAGE│     │ toLocationId    │
                        ├─────────────────┤     │ estimatedArrival│
                        │ shipmentId      │     │ actualArrival   │
                        │ packageId       │     │ status          │
                        │ sequence        │     └─────────────────┘
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  FREIGHT_QUOTE  │     │ DELIVERY_STATUS │     │ PROOF_OF_DELIVERY│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ shipmentId      │     │ shipmentId      │     │ shipmentId      │
│ carrierId       │     │ timestamp       │     │ signedBy        │
│ mode            │     │ status          │     │ signatureUrl    │
│ transitDays     │     │ location        │     │ photoUrls[]     │
│ quotedPrice     │     │ notes           │     │ receivedAt      │
│ validUntil      │     │ source          │     │ receivedBy      │
│ confidence      │     │ coordinates     │     │ condition       │
│ isSelected      │     └─────────────────┘     │ notes           │
└─────────────────┘                             └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│FREIGHT_EXCEPTION│     │ACCESSORIAL_CHARGE│
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ shipmentId      │     │ shipmentId      │
│ type            │     │ type            │
│ severity        │     │ description     │
│ description     │     │ amount          │
│ detectedAt      │     │ approved        │
│ resolvedAt      │     │ approvedBy      │
│ resolution      │     │ invoiced        │
│ assignedTo      │     └─────────────────┘
│ status          │
└─────────────────┘

┌─────────────────┐
│  CARRIER_RATE   │
├─────────────────┤
│ id              │
│ carrierId       │
│ originZone      │
│ destZone        │
│ mode            │
│ weightMin       │
│ weightMax       │
│ ratePerCwt      │
│ minCharge       │
│ fuelSurcharge   │
│ effectiveFrom   │
│ effectiveTo     │
└─────────────────┘
```

### Core Entities

#### Shipment

```typescript
interface Shipment {
  id: string;                    // SHIP-2026-XXXXXX
  orderIds: string[];            // One or more orders consolidated
  packageIds: string[];          // Packages included
  carrierId: string | null;      // Selected carrier
  routeId: string | null;        // Route plan
  
  // Origin
  originType: 'BRANCH' | 'VENDOR' | 'CUSTOMER';
  originId: string;
  originAddress: Address;
  
  // Destination
  destinationType: 'CUSTOMER' | 'BRANCH' | 'JOBSITE';
  destinationId: string;
  destinationAddress: Address;
  deliveryContact: Contact;
  
  // Timing
  requestedDate: Date;           // Customer requested
  promiseDate: Date;             // Committed to customer
  estimatedDelivery: Date;       // System calculated
  actualDelivery: Date | null;   // Confirmed
  
  // Physical
  totalWeight: number;           // lbs
  totalPieces: number;
  totalDimensions: Dimensions;
  palletCount: number;
  requiresFlatbed: boolean;
  requiresLiftgate: boolean;
  isOversized: boolean;
  isHazmat: boolean;
  
  // Cost
  quotedFreight: number;
  actualFreight: number | null;
  accessorialCharges: number;
  freightCostPerLb: number;
  
  // Status
  status: ShipmentStatus;
  podCaptured: boolean;
  podId: string | null;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  bookedAt: Date | null;
  bookedBy: string | null;
}

type ShipmentStatus = 
  | 'DRAFT'
  | 'PLANNED'
  | 'QUOTED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';
```

#### Carrier

```typescript
interface Carrier {
  id: string;
  code: string;                  // Short code (e.g., "FAST", "RGNL")
  name: string;
  
  // Capabilities
  modes: FreightMode[];          // LTL, FTL, FLATBED, COURIER, PARCEL
  equipmentTypes: string[];      // Flatbed, Van, Reefer, etc.
  maxWeight: number;
  maxLength: number;
  hazmatCertified: boolean;
  oversizedCapable: boolean;
  liftgateAvailable: boolean;
  
  // Service Area
  serviceRegions: string[];      // State codes or zones
  originBranches: string[];      // Which branches they serve
  transitTimeMatrix: Record<string, number>; // Zone pairs → days
  
  // Compliance
  mcNumber: string;
  dotNumber: string;
  insuranceExpiry: Date;
  insuranceAmount: number;
  
  // Performance
  onTimeRating: number;          // 0-100%
  damageRate: number;            // Claims per 1000 shipments
  averageTransitDays: number;
  
  // Commercial
  isPreferred: boolean;
  contractId: string | null;
  accountNumber: string;
  billingEmail: string;
  
  // Status
  isActive: boolean;
  lastUsedAt: Date;
  totalShipments: number;
}

type FreightMode = 
  | 'LTL'        // Less Than Truckload
  | 'FTL'        // Full Truckload
  | 'FLATBED'    // Flatbed for steel
  | 'COURIER'    // Local/expedited
  | 'PARCEL'     // UPS/FedEx
  | 'WILL_CALL'; // Customer pickup
```

#### FreightQuote

```typescript
interface FreightQuote {
  id: string;
  shipmentId: string;
  carrierId: string;
  carrierName: string;
  
  // Quote Details
  mode: FreightMode;
  serviceLevel: 'ECONOMY' | 'STANDARD' | 'EXPEDITED' | 'NEXT_DAY';
  transitDays: number;
  estimatedDelivery: Date;
  
  // Pricing
  baseRate: number;
  fuelSurcharge: number;
  accessorials: AccessorialCharge[];
  totalQuote: number;
  ratePerCwt: number;            // Per 100 lbs
  ratePerLb: number;
  
  // Scoring
  costScore: number;             // 0-100 (lower cost = higher)
  transitScore: number;          // 0-100 (faster = higher)
  reliabilityScore: number;      // 0-100 (historical performance)
  overallScore: number;          // Weighted composite
  isRecommended: boolean;
  recommendationReason: string;
  
  // Validity
  quoteNumber: string | null;    // Carrier reference
  validFrom: Date;
  validUntil: Date;
  isExpired: boolean;
  
  // Selection
  isSelected: boolean;
  selectedAt: Date | null;
  selectedBy: string | null;
  selectionReason: string | null;
}
```

#### ProofOfDelivery

```typescript
interface ProofOfDelivery {
  id: string;
  shipmentId: string;
  
  // Signature
  signedBy: string;
  signatureDataUrl: string;      // Base64 or S3 URL
  signerTitle: string | null;
  
  // Photos
  photoUrls: string[];           // Delivery photos
  
  // Receipt Details
  receivedAt: Date;
  receivedBy: string;
  receiverPhone: string | null;
  
  // Condition
  conditionCode: 'GOOD' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE' | 'REFUSED';
  conditionNotes: string | null;
  damagePhotoUrls: string[];
  
  // Counts
  piecesReceived: number;
  piecesShort: number;
  
  // Verification
  verifiedAt: Date;
  verifiedBy: string;
  
  // Location
  deliveryCoordinates: {
    lat: number;
    lng: number;
  } | null;
}
```

#### FreightException

```typescript
interface FreightException {
  id: string;
  shipmentId: string;
  
  type: ExceptionType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Details
  description: string;
  detectedAt: Date;
  detectedBy: 'SYSTEM' | 'CARRIER' | 'CUSTOMER' | 'INTERNAL';
  
  // Impact
  originalDeliveryDate: Date;
  newExpectedDate: Date | null;
  delayDays: number;
  financialImpact: number | null;
  
  // Resolution
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  assignedTo: string | null;
  assignedAt: Date | null;
  resolution: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  
  // Customer Impact
  customerNotified: boolean;
  customerNotifiedAt: Date | null;
  customerResponse: string | null;
  
  // Audit
  timeline: ExceptionEvent[];
}

type ExceptionType = 
  | 'DELAY'
  | 'DAMAGE'
  | 'LOST'
  | 'WRONG_ADDRESS'
  | 'REFUSED'
  | 'PARTIAL_DELIVERY'
  | 'ACCESSORIAL_DISPUTE'
  | 'CARRIER_NO_SHOW'
  | 'WEATHER'
  | 'CUSTOMS';
```

---

## C) Shipment Planning & Optimization

### Planning Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SHIPMENT PLANNING WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. IDENTIFY ELIGIBLE PACKAGES                                              │
│     ├── Status = QC_RELEASED or SEALED                                      │
│     ├── Chain-of-custody complete                                           │
│     ├── Documentation attached                                              │
│     └── No holds or stops                                                   │
│                                                                             │
│  2. GROUP BY DELIVERY WINDOW                                                │
│     ├── Same customer same day                                              │
│     ├── Same route corridor                                                 │
│     └── Compatible delivery requirements                                    │
│                                                                             │
│  3. EVALUATE CONSOLIDATION                                                  │
│     ├── Weight/cube optimization                                            │
│     ├── Compatible handling requirements                                    │
│     └── No customer conflicts                                               │
│                                                                             │
│  4. SELECT MODE & CARRIER                                                   │
│     ├── Apply business rules                                                │
│     ├── Get quotes (API or rate tables)                                     │
│     ├── Score alternatives                                                  │
│     └── Recommend with explanation                                          │
│                                                                             │
│  5. CONFIRM & BOOK                                                          │
│     ├── Review recommendation                                               │
│     ├── Override if needed (with reason)                                    │
│     ├── Book with carrier                                                   │
│     └── Generate BOL and labels                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Eligibility Rules

```typescript
interface ShipmentEligibilityCheck {
  packageId: string;
  
  checks: {
    qcReleased: boolean;
    sealed: boolean;
    custodyComplete: boolean;
    documentsAttached: boolean;
    noActiveHolds: boolean;
    inventoryConfirmed: boolean;
  };
  
  isEligible: boolean;
  blockers: string[];
}

function checkPackageEligibility(packageId: string): ShipmentEligibilityCheck {
  // Package must be:
  // 1. QC Released (from Quality module)
  // 2. Sealed (from Packaging module)
  // 3. Chain-of-custody complete
  // 4. CoC/MTR attached
  // 5. No stop-work or hold flags
  // 6. Inventory confirmed at location
}
```

### Optimization Inputs

| Input | Weight | Source |
|-------|--------|--------|
| Cost | 35% | Carrier quotes |
| Transit Time | 25% | Service levels |
| Reliability | 20% | Historical performance |
| Customer Priority | 15% | CRM tier |
| Capacity Fit | 5% | Equipment match |

### Optimization Algorithm

```typescript
interface OptimizationResult {
  shipmentId: string;
  
  recommendation: {
    carrierId: string;
    carrierName: string;
    mode: FreightMode;
    serviceLevel: string;
    estimatedDelivery: Date;
    totalCost: number;
    costPerLb: number;
  };
  
  scoring: {
    costScore: number;       // 0-100
    transitScore: number;    // 0-100
    reliabilityScore: number;// 0-100
    priorityScore: number;   // 0-100
    overallScore: number;    // Weighted
  };
  
  explanation: {
    whyThisCarrier: string;
    alternatives: QuoteAlternative[];
    tradeoffs: string[];
  };
  
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
}

function optimizeShipment(shipment: Shipment): OptimizationResult {
  // 1. Get all eligible carriers for lane
  const carriers = getEligibleCarriers(shipment);
  
  // 2. Get quotes from each
  const quotes = await getQuotes(shipment, carriers);
  
  // 3. Score each option
  const scoredQuotes = quotes.map(q => scoreQuote(q, shipment));
  
  // 4. Select best
  const best = selectBest(scoredQuotes);
  
  // 5. Generate explanation
  return {
    recommendation: best,
    explanation: generateExplanation(best, scoredQuotes),
    confidence: calculateConfidence(best, scoredQuotes)
  };
}
```

### Consolidation Logic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONSOLIDATION DECISION TREE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Same Customer, Same Day?                                                   │
│  ├── YES → CONSOLIDATE (high priority)                                      │
│  └── NO → Check Route Corridor                                              │
│                                                                             │
│  Same Route Corridor (within 50 miles)?                                     │
│  ├── YES → Check Compatibility                                              │
│  └── NO → SHIP SEPARATELY                                                   │
│                                                                             │
│  Compatible Handling Requirements?                                          │
│  ├── Same mode (LTL, Flatbed, etc.) → Continue                              │
│  └── Different modes → SHIP SEPARATELY                                      │
│                                                                             │
│  Combined Weight Efficient?                                                 │
│  ├── < 5000 lbs → LTL Consolidation beneficial                              │
│  ├── 5000-20000 lbs → Evaluate FTL vs LTL                                   │
│  └── > 20000 lbs → Likely FTL, check capacity                               │
│                                                                             │
│  Delivery Windows Align?                                                    │
│  ├── Same day/next day → CONSOLIDATE                                        │
│  └── > 1 day difference → SHIP SEPARATELY                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D) Carrier Management

### Carrier Profile

```typescript
interface CarrierProfile {
  // Identity
  id: string;
  code: string;
  legalName: string;
  dbaName: string;
  
  // Contact
  dispatchPhone: string;
  dispatchEmail: string;
  accountRep: Contact;
  
  // Capabilities Matrix
  capabilities: {
    modes: FreightMode[];
    equipment: EquipmentType[];
    maxWeight: number;
    maxLength: number;
    hazmatCertified: boolean;
    tempControlled: boolean;
    liftgateAvailable: boolean;
    insideDelivery: boolean;
    appointmentDelivery: boolean;
  };
  
  // Service Area
  serviceArea: {
    regions: string[];         // State codes
    originBranches: string[];  // Our branches they pickup from
    excludedZips: string[];    // Areas they won't serve
    transitMatrix: TransitTimeMatrix;
  };
  
  // Compliance
  compliance: {
    mcNumber: string;
    dotNumber: string;
    insuranceCertificate: Document;
    insuranceExpiry: Date;
    liabilityLimit: number;
    cargoLimit: number;
    w9OnFile: boolean;
    contractSigned: boolean;
    contractExpiry: Date;
  };
  
  // Performance Metrics
  performance: {
    onTimeDelivery: number;    // % last 12 months
    damageRate: number;        // Claims per 1000
    claimResolutionDays: number;
    avgTransitTime: number;    // vs. quoted
    communicationScore: number;// 1-5 rating
    overallScore: number;      // Composite
  };
  
  // Commercial
  commercial: {
    isPreferred: boolean;
    tier: 'STRATEGIC' | 'PREFERRED' | 'APPROVED' | 'PROBATION';
    volumeCommitment: number;  // Annual $
    volumeActual: number;      // YTD $
    paymentTerms: string;
    accountNumber: string;
  };
}
```

### Carrier Onboarding Checklist

| Step | Requirement | Validation |
|------|-------------|------------|
| 1 | Certificate of Insurance | Active, limits ≥ $1M |
| 2 | MC/DOT Numbers | Verified via FMCSA |
| 3 | W-9 Tax Form | On file |
| 4 | Rate Agreement | Signed, with fuel surcharge formula |
| 5 | Service Agreement | Terms accepted |
| 6 | Equipment Survey | Verify claimed capabilities |
| 7 | Safety Rating | Satisfactory or better |
| 8 | Reference Check | 2+ shipper references |

### Performance Scorecard

```typescript
interface CarrierScorecard {
  carrierId: string;
  period: 'MONTH' | 'QUARTER' | 'YEAR';
  periodStart: Date;
  periodEnd: Date;
  
  metrics: {
    shipmentCount: number;
    totalFreight: number;
    
    // Service
    onTimePickup: number;      // %
    onTimeDelivery: number;    // %
    avgTransitVariance: number;// Days +/-
    
    // Quality
    damageClaimCount: number;
    damageClaimValue: number;
    damageFreeRate: number;    // %
    
    // Communication
    statusUpdateFrequency: number;  // Updates per shipment
    responseTime: number;           // Hours avg
    proactiveAlerts: number;        // %
    
    // Billing
    invoiceAccuracy: number;   // %
    accessorialDisputes: number;
    avgPaymentDays: number;
  };
  
  overallScore: number;        // 0-100
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  recommendation: 'STRATEGIC' | 'MAINTAIN' | 'REVIEW' | 'EXIT';
}
```

---

## E) Routing & Consolidation Logic

### Multi-Stop Route Planning

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUTE OPTIMIZATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ORIGIN (Branch)                                                            │
│       │                                                                     │
│       ├──► Stop 1: Customer A (3 packages, 2000 lbs)                        │
│       │    Delivery Window: 8 AM - 12 PM                                    │
│       │    Requirements: Liftgate                                           │
│       │                                                                     │
│       ├──► Stop 2: Customer B (1 package, 800 lbs)                          │
│       │    Delivery Window: Any                                             │
│       │    Requirements: None                                               │
│       │                                                                     │
│       └──► Stop 3: Customer C (2 packages, 3500 lbs)                        │
│            Delivery Window: 1 PM - 5 PM                                     │
│            Requirements: Flatbed, Crane Unload                              │
│                                                                             │
│  ROUTE METRICS:                                                             │
│  • Total Miles: 127                                                         │
│  • Total Stops: 3                                                           │
│  • Total Weight: 6,300 lbs                                                  │
│  • Estimated Time: 4.5 hours                                                │
│  • Mode: LTL with liftgate                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Consolidation Rules

```typescript
interface ConsolidationRule {
  id: string;
  name: string;
  priority: number;
  
  conditions: {
    sameCustomer: boolean;
    sameBranch: boolean;
    sameMode: boolean;
    deliveryWindowOverlap: number;  // Hours
    maxMilesBetweenStops: number;
    compatibleHandling: boolean;
  };
  
  constraints: {
    maxPackages: number;
    maxWeight: number;
    maxStops: number;
    maxRouteTime: number;           // Hours
  };
  
  exceptions: {
    excludeCustomers: string[];     // Never consolidate
    excludeProducts: string[];      // Sensitive items
    excludeHazmat: boolean;
  };
}

// Example rules
const consolidationRules: ConsolidationRule[] = [
  {
    id: 'SAME_CUSTOMER_SAME_DAY',
    name: 'Same Customer Same Day',
    priority: 1,
    conditions: {
      sameCustomer: true,
      sameBranch: true,
      sameMode: true,
      deliveryWindowOverlap: 24,
      maxMilesBetweenStops: 0,
      compatibleHandling: true
    },
    constraints: {
      maxPackages: 50,
      maxWeight: 48000,
      maxStops: 1,
      maxRouteTime: 24
    },
    exceptions: { excludeCustomers: [], excludeProducts: [], excludeHazmat: false }
  },
  {
    id: 'ROUTE_CORRIDOR',
    name: 'Geographic Corridor',
    priority: 2,
    conditions: {
      sameCustomer: false,
      sameBranch: true,
      sameMode: true,
      deliveryWindowOverlap: 4,
      maxMilesBetweenStops: 50,
      compatibleHandling: true
    },
    constraints: {
      maxPackages: 20,
      maxWeight: 20000,
      maxStops: 5,
      maxRouteTime: 8
    },
    exceptions: { excludeCustomers: [], excludeProducts: [], excludeHazmat: true }
  }
];
```

### Branch Transfer Logic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTER-BRANCH TRANSFER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario: Material at Branch A, Customer near Branch B                     │
│                                                                             │
│  Option 1: Direct Ship from Branch A                                        │
│  ├── Distance: 450 miles                                                    │
│  ├── Transit: 3 days                                                        │
│  └── Cost: $485                                                             │
│                                                                             │
│  Option 2: Transfer A→B, then Local Delivery                                │
│  ├── Transfer: 180 miles, overnight, $120                                   │
│  ├── Local: 35 miles, same day, $85                                         │
│  ├── Total Transit: 2 days                                                  │
│  └── Total Cost: $205                                                       │
│                                                                             │
│  RECOMMENDATION: Option 2 (saves $280, 1 day faster)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## F) Execution & Tracking Workflow

### Shipment State Machine

```
                                    ┌───────────┐
                                    │   DRAFT   │
                                    └─────┬─────┘
                                          │ Submit for planning
                                          ▼
                                    ┌───────────┐
                                    │  PLANNED  │
                                    └─────┬─────┘
                                          │ Get quotes
                                          ▼
                                    ┌───────────┐
                                    │  QUOTED   │
                                    └─────┬─────┘
                                          │ Select carrier & book
                                          ▼
                                    ┌───────────┐
                    ┌───────────────│  BOOKED   │───────────────┐
                    │               └─────┬─────┘               │
                    │                     │ Carrier pickup       │ No-show
                    │                     ▼                      ▼
                    │               ┌───────────┐         ┌───────────┐
                    │               │ PICKED_UP │         │ EXCEPTION │
                    │               └─────┬─────┘         └───────────┘
                    │                     │ In transit
                    │                     ▼
                    │               ┌───────────┐
                    │               │IN_TRANSIT │◄─────────────────┐
                    │               └─────┬─────┘                  │
                    │                     │ Near destination       │ Delay
                    │                     ▼                        │
                    │               ┌─────────────────┐            │
                    │               │OUT_FOR_DELIVERY │────────────┤
                    │               └───────┬─────────┘            │
                    │                       │ POD captured         │
                    │                       ▼                      │
                    │               ┌───────────┐                  │
                    │               │ DELIVERED │                  │
                    │               └───────────┘                  │
                    │                                              │
                    │  Cancel                                      │
                    ▼                                              │
              ┌───────────┐                                        │
              │ CANCELLED │                                        │
              └───────────┘                                        │
                                                                   │
                                              Damage/Refusal ──────┘
```

### Tracking Event Types

```typescript
interface TrackingEvent {
  id: string;
  shipmentId: string;
  timestamp: Date;
  
  eventType: TrackingEventType;
  status: ShipmentStatus;
  
  location: {
    city: string;
    state: string;
    zip: string;
    coordinates?: { lat: number; lng: number };
  } | null;
  
  description: string;
  source: 'CARRIER_API' | 'CARRIER_EDI' | 'MANUAL' | 'DRIVER_APP' | 'SYSTEM';
  
  isPublic: boolean;  // Show to customer?
  notifyCustomer: boolean;
}

type TrackingEventType = 
  | 'SHIPMENT_CREATED'
  | 'CARRIER_ASSIGNED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'DEPARTED_ORIGIN'
  | 'IN_TRANSIT'
  | 'ARRIVED_TERMINAL'
  | 'DEPARTED_TERMINAL'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPTED'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'DELAY_DETECTED'
  | 'ETA_UPDATED';
```

### Proactive Alert Rules

| Condition | Alert | Recipient | Priority |
|-----------|-------|-----------|----------|
| No pickup after 4 hours | Pickup delayed | Shipping Coordinator | HIGH |
| No update in 24 hours | Status unknown | Shipping Coordinator | MEDIUM |
| ETA slips past promise | Delivery at risk | CSR, Customer | HIGH |
| Damage reported | Damage alert | QC, Shipping Manager | CRITICAL |
| Delivery attempted, failed | Redelivery needed | CSR, Customer | HIGH |

---

## G) Delivery Confirmation & Exceptions

### POD Capture Requirements

```typescript
interface PODRequirements {
  signatureRequired: boolean;
  photoRequired: boolean;
  pieceCountRequired: boolean;
  conditionCheckRequired: boolean;
  
  // Based on shipment value
  getRequirements(shipmentValue: number): PODRequirements {
    if (shipmentValue > 50000) {
      return { signature: true, photo: true, pieceCount: true, condition: true };
    } else if (shipmentValue > 10000) {
      return { signature: true, photo: true, pieceCount: false, condition: true };
    } else {
      return { signature: true, photo: false, pieceCount: false, condition: false };
    }
  }
}
```

### Exception Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXCEPTION HANDLING WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EXCEPTION DETECTED                                                      │
│     ├── Source: Carrier, System, Customer, Internal                         │
│     ├── Auto-classify type and severity                                     │
│     └── Create exception record                                             │
│                                                                             │
│  2. INITIAL TRIAGE (< 1 hour)                                               │
│     ├── Assign to handler                                                   │
│     ├── Assess customer impact                                              │
│     ├── Determine notification need                                         │
│     └── Escalate if HIGH/CRITICAL                                           │
│                                                                             │
│  3. CUSTOMER COMMUNICATION (if needed)                                      │
│     ├── Proactive notification                                              │
│     ├── New ETA if available                                                │
│     └── Recovery options                                                    │
│                                                                             │
│  4. RESOLUTION                                                              │
│     ├── Document actions taken                                              │
│     ├── Record resolution                                                   │
│     ├── Capture lessons learned                                             │
│     └── Close exception                                                     │
│                                                                             │
│  5. CARRIER ACCOUNTABILITY                                                  │
│     ├── Log against carrier scorecard                                       │
│     ├── Initiate claim if damage/loss                                       │
│     └── Review for pattern                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Exception Resolution Matrix

| Exception Type | Owner | SLA | Escalation |
|---------------|-------|-----|------------|
| Delay (1-2 days) | Shipping Coordinator | 4 hours | Logistics Manager |
| Delay (3+ days) | Logistics Manager | 2 hours | Ops Director |
| Minor Damage | QC Inspector | 24 hours | QC Manager |
| Major Damage | QC Manager | 4 hours | Ops Director |
| Lost Shipment | Logistics Manager | 2 hours | Ops Director |
| Wrong Delivery | Shipping Coordinator | 2 hours | Logistics Manager |
| Refused | CSR | 4 hours | Sales Manager |

---

## H) Integration with Packaging, Inventory, Finance

### Packaging Integration

```typescript
interface PackagingIntegration {
  // Pre-shipment validation
  validatePackageForShipment(packageId: string): {
    eligible: boolean;
    checks: {
      qcReleased: boolean;
      sealed: boolean;
      custodyComplete: boolean;
      cocAttached: boolean;
      mtrAttached: boolean;
      labelsApplied: boolean;
    };
    blockers: string[];
  };
  
  // Auto-attach documents
  attachDocumentsToShipment(shipmentId: string, packageIds: string[]): {
    attached: Document[];
    missing: string[];
  };
  
  // Update custody chain
  recordCustodyTransfer(shipmentId: string, event: CustodyEvent): void;
}

// Integration points
const packagingEvents = {
  'package.sealed': 'Check if ready for shipment planning',
  'package.qc_released': 'Add to eligible pool',
  'package.hold_applied': 'Remove from eligible pool'
};
```

### Inventory Integration

```typescript
interface InventoryIntegration {
  // Reserve inventory for shipment
  reserveForShipment(shipmentId: string, items: ShipmentItem[]): {
    reserved: boolean;
    reservationId: string;
  };
  
  // Update location on pickup
  transferToInTransit(shipmentId: string): {
    success: boolean;
    fromLocation: string;
    transitLocation: string;
  };
  
  // Complete transfer on delivery
  completeTransfer(shipmentId: string, pod: ProofOfDelivery): {
    success: boolean;
    newOwner: string;
    ownershipTransferredAt: Date;
  };
}

// Inventory status flow
const inventoryFlow = {
  'PLANNED': 'RESERVED',
  'BOOKED': 'RESERVED',
  'PICKED_UP': 'IN_TRANSIT',
  'DELIVERED': 'DELIVERED_TO_CUSTOMER'
};
```

### Finance Integration

```typescript
interface FinanceIntegration {
  // Freight cost capture
  recordFreightCost(shipment: Shipment): {
    quotedCost: number;
    estimatedCost: number;
    glAccount: string;
    costCenter: string;
  };
  
  // Accrual on ship
  createFreightAccrual(shipmentId: string): {
    accrualId: string;
    amount: number;
    accrualDate: Date;
  };
  
  // Actual on invoice
  reconcileFreightInvoice(invoiceData: FreightInvoice): {
    shipmentId: string;
    quotedAmount: number;
    invoicedAmount: number;
    variance: number;
    varianceReason: string | null;
    accessorialsValidated: boolean;
  };
  
  // Customer billing
  addFreightToCustomerInvoice(shipmentId: string, options: BillingOptions): {
    lineItemId: string;
    amount: number;
    markup: number;
  };
}

// Cost flow
const costFlow = {
  'QUOTED': 'Estimate captured',
  'BOOKED': 'Accrual created',
  'DELIVERED': 'Actual posted on carrier invoice',
  'INVOICED': 'Customer billed'
};
```

---

## I) UI / UX Design

### Page Inventory

| Page | Purpose | Primary Users |
|------|---------|--------------|
| ShipmentPlanner | Plan and create shipments | Shipping Coordinator |
| FreightComparison | Compare carrier quotes | Shipping Coordinator |
| RouteView | Visualize routes and stops | Logistics Manager |
| ShipmentTrackingBoard | Track all active shipments | All |
| ExceptionInbox | Handle exceptions | Shipping Coordinator, Manager |
| PODViewer | View delivery confirmations | CSR, Finance |

### 1. ShipmentPlanner

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SHIPMENT PLANNER                                            🔄 Auto-Plan   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ READY TO SHIP           │  │ SHIPMENT BUILDER                        │  │
│  │ ─────────────────────── │  │ ─────────────────────────────────────── │  │
│  │                         │  │                                         │  │
│  │ □ PKG-2026-000051      │  │  Destination: Aerospace Dynamics Inc.   │  │
│  │   Marine Systems        │  │  123 Industrial Way, Detroit MI         │  │
│  │   316SS • 3,200 lbs    │  │                                         │  │
│  │   Ship by: TODAY ⚠️    │  │  Packages (2):                          │  │
│  │                         │  │  ┌─────────────────────────────────┐    │  │
│  │ ☑ PKG-2026-000052      │  │  │ PKG-2026-000052  1,500 lbs     │    │  │
│  │   Industrial Parts      │  │  │ PKG-2026-000053  2,800 lbs     │    │  │
│  │   1018 Steel • 1,500 lb│  │  └─────────────────────────────────┘    │  │
│  │   Ship by: Tomorrow     │  │                                         │  │
│  │                         │  │  Total: 4,300 lbs │ 2 packages          │  │
│  │ ☑ PKG-2026-000053      │  │                                         │  │
│  │   AutoMax Mfg           │  │  Delivery Window:                       │  │
│  │   Aluminum • 2,800 lbs │  │  [Feb 5, 2026     ] - [Feb 6, 2026   ]  │  │
│  │   Ship by: TODAY 🔥    │  │                                         │  │
│  │                         │  │  Requirements:                          │  │
│  │ ─────────────────────── │  │  ☑ Flatbed  □ Liftgate  □ Inside       │  │
│  │ Filter: [All Branches▼] │  │                                         │  │
│  │ [Search packages...]    │  │  [ Get Quotes ]  [ Create Shipment ]   │  │
│  │                         │  │                                         │  │
│  └─────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                             │
│  CONSOLIDATION SUGGESTIONS                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 💡 Combine PKG-052 + PKG-053: Same corridor, save $145 (LTL rates) │   │
│  │    [Apply Consolidation]  [Dismiss]                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. FreightComparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FREIGHT COMPARISON                              SHIP-2026-000421           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Shipment: Aerospace Dynamics Inc. • 4,300 lbs • Flatbed Required          │
│  Promise Date: Feb 6, 2026                                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CARRIER QUOTES                                     Sort: [Best ▼]  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │ ★ RECOMMENDED                                                       │   │
│  │ ┌─────────────────────────────────────────────────────────────┐    │   │
│  │ │ FastFreight Trucking               Score: 92/100           │    │   │
│  │ │ LTL Flatbed • 2 days • Delivers Feb 5                      │    │   │
│  │ │                                                             │    │   │
│  │ │ Base Rate:     $385.00    │  On-Time: 96%                  │    │   │
│  │ │ Fuel Surcharge: $58.00    │  Damage:  0.2%                 │    │   │
│  │ │ Total:         $443.00    │  $0.103/lb                     │    │   │
│  │ │                                                             │    │   │
│  │ │ WHY: Lowest cost meeting delivery window with excellent    │    │   │
│  │ │      reliability on this lane.                             │    │   │
│  │ │                                                             │    │   │
│  │ │            [ Select This Carrier ]                         │    │   │
│  │ └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────┐    │   │
│  │ │ Regional Express                    Score: 78/100           │    │   │
│  │ │ LTL • 3 days • Delivers Feb 6                               │    │   │
│  │ │ Total: $412.00 • $0.096/lb                                  │    │   │
│  │ │ ⚠️ Cuts close to promise date                               │    │   │
│  │ │                                         [ Select ]          │    │   │
│  │ └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────┐    │   │
│  │ │ Expedited Logistics                 Score: 65/100           │    │   │
│  │ │ Dedicated • 1 day • Delivers Feb 4                          │    │   │
│  │ │ Total: $725.00 • $0.169/lb                                  │    │   │
│  │ │ 💰 63% more expensive                                       │    │   │
│  │ │                                         [ Select ]          │    │   │
│  │ └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [ ← Back to Planner ]                        [ Override Selection... ]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. ShipmentTrackingBoard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SHIPMENT TRACKING BOARD                                    🔄 Refreshing   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [All Statuses ▼] [All Carriers ▼] [All Branches ▼] [Search...]            │
│                                                                             │
│  ┌──────────────┬────────────────┬─────────────────┬──────────────────┐    │
│  │   BOOKED     │   IN TRANSIT   │ OUT FOR DELIVERY│    DELIVERED    │    │
│  │     (5)      │      (12)      │       (3)       │    Today (8)    │    │
│  ├──────────────┼────────────────┼─────────────────┼──────────────────┤    │
│  │              │                │                 │                  │    │
│  │ SHIP-000425 │ SHIP-000421   │ SHIP-000418    │ SHIP-000415     │    │
│  │ FastFreight │ RegionalExp   │ FastFreight    │ ✓ 10:45 AM      │    │
│  │ Pickup: 2PM │ Detroit, MI   │ ETA: 11:30 AM  │ Aerospace Dyn   │    │
│  │ Aerospace   │ → Chicago     │ AutoMax Mfg    │ POD Captured    │    │
│  │             │ ETA: Feb 5    │                │                  │    │
│  │ SHIP-000426 │               │ SHIP-000419    │ SHIP-000416     │    │
│  │ Regional    │ SHIP-000422  │ ⚠️ Delayed      │ ✓ 11:20 AM      │    │
│  │ Pickup: 4PM │ ⚠️ DELAYED    │ ETA: 2:00 PM   │ Marine Systems  │    │
│  │ Marine Sys  │ Was: Feb 5   │ Industrial Pts │ Signed: J.Smith │    │
│  │             │ Now: Feb 6   │                │                  │    │
│  │ SHIP-000427 │               │ SHIP-000420    │ SHIP-000417     │    │
│  │ Expedited   │ SHIP-000423  │ On Track       │ ✓ 1:15 PM       │    │
│  │ Pickup: 5PM │ On Track     │ ETA: 3:45 PM   │ Thompson Fab    │    │
│  │ AutoMax     │ → St. Louis  │ Precision Mfg  │                  │    │
│  │             │ ETA: Feb 5   │                │                  │    │
│  │             │               │                 │                  │    │
│  └──────────────┴────────────────┴─────────────────┴──────────────────┘    │
│                                                                             │
│  EXCEPTIONS (2 Active)                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 SHIP-000422: Delay detected - carrier reported weather delay    │   │
│  │    Customer: Industrial Parts │ Assigned: Mike R. │ [View Details] │   │
│  │                                                                     │   │
│  │ 🟡 SHIP-000419: Delivery window at risk - traffic delay            │   │
│  │    Customer: Industrial Parts │ Unassigned │ [Assign] [Details]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. ExceptionInbox

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXCEPTION INBOX                                         12 Open │ 3 Mine   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Open ▼] [All Types ▼] [All Severity ▼] [My Exceptions ☐]                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 CRITICAL │ EXC-2026-000089 │ 2 hours ago                        │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Type: DAMAGE                      Shipment: SHIP-2026-000418       │   │
│  │ Customer: AutoMax Manufacturing   Carrier: FastFreight             │   │
│  │                                                                     │   │
│  │ Driver reported visible damage to packaging upon delivery.         │   │
│  │ Customer refused 2 of 5 packages. Photos attached.                 │   │
│  │                                                                     │   │
│  │ Assigned: Sarah Chen (QC)         SLA: 2 hours remaining           │   │
│  │                                                                     │   │
│  │ [ View Details ]  [ Add Note ]  [ Escalate ]  [ Resolve ]          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 HIGH │ EXC-2026-000088 │ 4 hours ago                            │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Type: DELAY                       Shipment: SHIP-2026-000422       │   │
│  │ Customer: Industrial Parts LLC    Carrier: Regional Express        │   │
│  │                                                                     │   │
│  │ Weather delay in Chicago area. New ETA: Feb 6 (was Feb 5).         │   │
│  │ Customer notified automatically.                                   │   │
│  │                                                                     │   │
│  │ Assigned: Mike Rodriguez          SLA: 4 hours remaining           │   │
│  │                                                                     │   │
│  │ [ View Details ]  [ Contact Carrier ]  [ Resolve ]                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 LOW │ EXC-2026-000087 │ Yesterday                               │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Type: ACCESSORIAL_DISPUTE         Shipment: SHIP-2026-000412       │   │
│  │ Carrier: FastFreight              Disputed Amount: $125            │   │
│  │                                                                     │   │
│  │ Carrier billed for liftgate, but customer has dock. Disputing.     │   │
│  │                                                                     │   │
│  │ Assigned: Finance Team            SLA: On Track                    │   │
│  │                                                                     │   │
│  │ [ View Details ]  [ Add Documentation ]  [ Resolve ]               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. PODViewer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROOF OF DELIVERY                                    SHIP-2026-000415      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ DELIVERY SUMMARY        │  │ SIGNATURE                               │  │
│  │ ─────────────────────── │  │ ─────────────────────────────────────── │  │
│  │                         │  │                                         │  │
│  │ Delivered: Feb 4, 2026  │  │  ┌─────────────────────────────────┐   │  │
│  │ Time: 10:45 AM          │  │  │                                 │   │  │
│  │                         │  │  │    [Signature Image]            │   │  │
│  │ Signed By:              │  │  │                                 │   │  │
│  │ John Smith              │  │  │    ~~~~~~~~~~~~                 │   │  │
│  │ Receiving Manager       │  │  │                                 │   │  │
│  │                         │  │  └─────────────────────────────────┘   │  │
│  │ Condition: GOOD ✓       │  │                                         │  │
│  │ Pieces: 12/12 ✓         │  │  Captured: Feb 4, 2026 10:45:32 AM     │  │
│  │                         │  │  GPS: 42.3314° N, 83.0458° W           │  │
│  │ Carrier:                │  │                                         │  │
│  │ FastFreight Trucking    │  └─────────────────────────────────────────┘  │
│  │ Driver: Mike Thompson   │                                               │
│  │ PRO: FFT-892741        │  ┌─────────────────────────────────────────┐  │
│  │                         │  │ DELIVERY PHOTOS                        │  │
│  └─────────────────────────┘  │ ─────────────────────────────────────── │  │
│                               │                                         │  │
│  ┌─────────────────────────┐  │  ┌───────┐ ┌───────┐ ┌───────┐         │  │
│  │ PACKAGES DELIVERED      │  │  │       │ │       │ │       │         │  │
│  │ ─────────────────────── │  │  │ Photo │ │ Photo │ │ Photo │         │  │
│  │                         │  │  │   1   │ │   2   │ │   3   │         │  │
│  │ ✓ PKG-2026-000042      │  │  │       │ │       │ │       │         │  │
│  │   2,450 lbs • 12 pcs   │  │  └───────┘ └───────┘ └───────┘         │  │
│  │                         │  │                                         │  │
│  │ ✓ PKG-2026-000043      │  │  [Click to enlarge]                     │  │
│  │   1,800 lbs • 8 pcs    │  │                                         │  │
│  │                         │  └─────────────────────────────────────────┘  │
│  │ Total: 4,250 lbs       │                                               │
│  │                         │  [ Download POD PDF ]  [ Email to Customer ] │
│  └─────────────────────────┘                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## J) Roles & Permissions

### Role Matrix

| Permission | Shipping Coord | Logistics Mgr | Ops Mgr | Finance | CSR | Exec |
|------------|---------------|---------------|---------|---------|-----|------|
| View Shipments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Shipment | ✓ | ✓ | ✓ | | | |
| Plan Routes | ✓ | ✓ | ✓ | | | |
| Book Carrier | ✓ | ✓ | ✓ | | | |
| Override Recommendation | | ✓ | ✓ | | | |
| Manage Carriers | | ✓ | ✓ | | | |
| View Rates | ✓ | ✓ | ✓ | ✓ | | |
| Edit Rates | | ✓ | | | | |
| Handle Exceptions | ✓ | ✓ | ✓ | | ✓ | |
| Resolve Claims | | ✓ | ✓ | ✓ | | |
| View PODs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Cost Analytics | | ✓ | ✓ | ✓ | | ✓ |
| Approve Accessorials | | ✓ | ✓ | ✓ | | |

### Override Approval Matrix

| Override Type | Threshold | Approver |
|--------------|-----------|----------|
| Select non-recommended carrier | Any | Logistics Manager |
| Expedite at premium cost | > $500 | Ops Manager |
| Skip consolidation | > $200 savings | Logistics Manager |
| Waive accessorial charge | > $100 | Finance |
| Override delivery date | Any | Ops Manager |

---

## K) APIs & Eventing

### REST Endpoints

```yaml
# Shipments
GET    /api/shipments                    # List with filters
POST   /api/shipments                    # Create shipment
GET    /api/shipments/:id                # Get details
PUT    /api/shipments/:id                # Update shipment
DELETE /api/shipments/:id                # Cancel shipment
POST   /api/shipments/:id/book           # Book with carrier
GET    /api/shipments/:id/tracking       # Get tracking events
POST   /api/shipments/:id/pod            # Submit POD

# Freight Quotes
POST   /api/freight/quotes               # Get quotes for shipment
GET    /api/freight/quotes/:shipmentId   # List quotes for shipment
POST   /api/freight/quotes/:id/select    # Select a quote

# Carriers
GET    /api/carriers                     # List carriers
POST   /api/carriers                     # Add carrier
GET    /api/carriers/:id                 # Get carrier details
PUT    /api/carriers/:id                 # Update carrier
GET    /api/carriers/:id/scorecard       # Performance scorecard
GET    /api/carriers/:id/rates           # Rate tables

# Routes
GET    /api/routes/:shipmentId           # Get route for shipment
POST   /api/routes/optimize              # Optimize route
GET    /api/routes/consolidation         # Get consolidation suggestions

# Exceptions
GET    /api/freight/exceptions           # List exceptions
POST   /api/freight/exceptions           # Create exception
PUT    /api/freight/exceptions/:id       # Update exception
POST   /api/freight/exceptions/:id/resolve # Resolve exception

# Analytics
GET    /api/freight/analytics/summary    # Summary metrics
GET    /api/freight/analytics/carrier    # Carrier performance
GET    /api/freight/analytics/lane       # Lane analysis
GET    /api/freight/analytics/cost       # Cost breakdown
```

### Event Bus

```typescript
// Published Events
interface FreightEvents {
  'shipment.created': { shipmentId: string; orderIds: string[] };
  'shipment.quoted': { shipmentId: string; quoteCount: number };
  'shipment.booked': { shipmentId: string; carrierId: string; cost: number };
  'shipment.picked_up': { shipmentId: string; pickupTime: Date };
  'shipment.in_transit': { shipmentId: string; location: Location };
  'shipment.out_for_delivery': { shipmentId: string; eta: Date };
  'shipment.delivered': { shipmentId: string; podId: string };
  'shipment.exception': { shipmentId: string; exceptionId: string; type: string };
  
  'freight.quote_received': { shipmentId: string; carrierId: string; amount: number };
  'freight.cost_finalized': { shipmentId: string; actualCost: number; variance: number };
  
  'carrier.scorecard_updated': { carrierId: string; newScore: number };
  'carrier.compliance_expiring': { carrierId: string; documentType: string; expiryDate: Date };
}

// Subscribed Events (from other modules)
interface InboundEvents {
  'package.sealed': 'Add to eligible for shipment';
  'package.qc_released': 'Update shipment readiness';
  'order.promise_date_changed': 'Re-evaluate shipment timing';
  'inventory.transfer_complete': 'Update shipment origin';
}
```

---

## L) Analytics & KPIs

### Key Performance Indicators

```typescript
interface FreightKPIs {
  // Service
  onTimeDeliveryRate: number;      // Target: ≥ 95%
  onTimePickupRate: number;        // Target: ≥ 98%
  averageTransitDays: number;      // vs. quoted
  deliveryPrecision: number;       // Within window %
  
  // Cost
  freightCostPerLb: number;        // Trend over time
  freightCostPerShipment: number;
  costVsQuoteVariance: number;     // Target: < 5%
  accessorialRate: number;         // % of shipments with extras
  
  // Efficiency
  consolidationRate: number;       // Target: ≥ 40%
  averagePackagesPerShipment: number;
  truckUtilization: number;        // % of capacity used
  
  // Quality
  damageRate: number;              // Target: < 0.5%
  claimAmount: number;             // Total $
  exceptionRate: number;           // % of shipments
  resolutionTime: number;          // Hours avg
  
  // Customer
  podCaptureRate: number;          // Target: 100%
  customerSatisfaction: number;    // 1-5 rating
}
```

### Dashboard Widgets

| Widget | Metrics | Visualization |
|--------|---------|---------------|
| Delivery Performance | OTD %, trend | Gauge + Sparkline |
| Cost Efficiency | $/lb, variance | Line chart |
| Carrier Scorecard | Top 5 carriers | Bar chart |
| Exception Summary | By type, severity | Donut chart |
| Consolidation Savings | $ saved this month | KPI card |
| Active Shipments | By status | Kanban counts |

---

## M) Audit & Evidence

### Audit Trail

Every logistics action is logged:

```typescript
interface FreightAuditLog {
  id: string;
  timestamp: Date;
  
  entityType: 'SHIPMENT' | 'CARRIER' | 'QUOTE' | 'EXCEPTION' | 'POD';
  entityId: string;
  
  action: string;
  actor: string;
  actorRole: string;
  
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  
  reason: string | null;
  isOverride: boolean;
  approvedBy: string | null;
}
```

### Evidence Retention

| Evidence Type | Retention | Storage |
|---------------|-----------|---------|
| Shipment Records | 7 years | Database |
| POD Images | 7 years | S3 with lifecycle |
| Carrier Contracts | Contract + 3 years | Document store |
| Rate Tables | 3 years | Database |
| Exception Records | 5 years | Database |
| Cost Data | 7 years | Database |
| Audit Logs | 7 years | Append-only store |

---

## N) Testing & Validation

### Test Scenarios

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Create shipment for unsealed package | BLOCKED - must be sealed |
| 2 | Create shipment without CoC | BLOCKED - documents required |
| 3 | Request quotes for valid shipment | Receive 2+ carrier quotes |
| 4 | Select non-recommended carrier | Requires override approval |
| 5 | Book shipment | Status → BOOKED, carrier notified |
| 6 | Carrier reports pickup | Status → PICKED_UP, custody updated |
| 7 | Delay detected by system | Exception created, alert sent |
| 8 | Driver submits POD | Status → DELIVERED, images stored |
| 9 | Customer reports damage | Exception created, QC notified |
| 10 | Carrier invoice with variance | Flagged for review |

### Integration Tests

```typescript
describe('Logistics Module Integration', () => {
  test('Sealed package becomes eligible for shipment', async () => {
    await packageService.seal(packageId);
    const eligible = await freightService.getEligiblePackages();
    expect(eligible).toContain(packageId);
  });
  
  test('Shipment cannot be created without sealed packages', async () => {
    await expect(
      freightService.createShipment({ packageIds: [unsealedPackageId] })
    ).rejects.toThrow('Package must be sealed');
  });
  
  test('POD capture completes delivery loop', async () => {
    await freightService.submitPOD(shipmentId, podData);
    const shipment = await freightService.getShipment(shipmentId);
    expect(shipment.status).toBe('DELIVERED');
    expect(shipment.podCaptured).toBe(true);
  });
  
  test('Freight cost flows to finance', async () => {
    await freightService.finalizeShipment(shipmentId);
    const accrual = await financeService.getFreightAccrual(shipmentId);
    expect(accrual).toBeDefined();
    expect(accrual.amount).toBe(shipment.quotedFreight);
  });
});
```

---

## O) Rollout & Go/No-Go Criteria

### Phased Rollout

| Phase | Scope | Duration | Success Criteria |
|-------|-------|----------|------------------|
| 1 | Single branch, top 3 carriers | 2 weeks | System stable, OTD ≥ 90% |
| 2 | All branches, existing carriers | 4 weeks | OTD ≥ 93%, consolidation ≥ 30% |
| 3 | Add new carriers, full optimization | 4 weeks | OTD ≥ 95%, consolidation ≥ 40% |
| 4 | Full production | Ongoing | All KPIs met |

### Go/No-Go Checklist

| Criteria | Threshold | Measured |
|----------|-----------|----------|
| System Uptime | ≥ 99.5% | Monitoring |
| Quote Response Time | < 30 seconds | API logs |
| POD Capture Rate | 100% | System data |
| Exception Resolution | < 24 hours avg | System data |
| User Training | 100% of shipping staff | Training records |
| Carrier Onboarding | Top 5 carriers | Contracts signed |
| Integration Tests | 100% passing | CI/CD |
| Data Migration | 100% of open shipments | Validation report |

### Rollback Plan

If critical issues occur:

1. **Immediate**: Route to manual process (spreadsheet + phone)
2. **Short-term**: Fix and re-deploy within 4 hours
3. **Escalation**: Ops Director decision to continue or pause

---

## Appendix: UI Component Inventory

| Component | Location | Purpose |
|-----------|----------|---------|
| ShipmentCard | Shared | Shipment summary display |
| CarrierQuoteCard | FreightComparison | Quote display with scoring |
| TrackingTimeline | ShipmentDetail | Event history |
| PODCapture | Mobile/Driver | Signature/photo capture |
| ExceptionBadge | Tracking board | Visual exception indicator |
| ConsolidationSuggestion | Planner | Consolidation recommendation |
| RouteMap | RouteView | Geographic visualization |
| CarrierScorecard | CarrierDetail | Performance metrics |

---

**Document Status:** COMPLETE  
**Next Step:** Implementation  
**Estimated Effort:** 6 UI pages + backend services + integrations
