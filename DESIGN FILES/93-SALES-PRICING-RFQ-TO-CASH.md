# 93 - Sales, Pricing Intelligence & RFQ-to-Cash Optimization Module

> **Status notice (2026-11-19, Phase 12 certification).** This document was written before or outside the engineering quality program. It is a design, sales or set-up document, not evidence that anything it describes is built, tested or approved for production. What is built and verified is in `qa/enterprise-excellence/phase-12-system-certification.md`; the production recommendation is in `qa/enterprise-excellence/phase-12-final-report.md`.

> **Module**: Sales & Commercial Operations  
> **Version**: 1.0  
> **Date**: February 4, 2026  
> **Status**: Design Complete  
> **Integrations**: OrderHub, Inventory, Production, Quality, Finance, Logistics, CRM

---

## Executive Summary

This module transforms the RFQ-to-Cash cycle from a manual, error-prone process into an AI-augmented, margin-optimized, capacity-aware commercial engine. Sales teams gain speed and confidence; customers receive accurate quotes with reliable promise dates; finance gains real-time margin visibility.

**Key Outcomes:**
- 60% reduction in RFQ response time
- 15% improvement in quote win rate
- 8% margin improvement through intelligent pricing
- 95%+ promise date accuracy
- Full audit trail for every pricing decision

---

## A) Sales & Pricing Philosophy

### A.1 Speed + Confidence Wins RFQs

In metals and plastics distribution, **the first accurate quote often wins**. Customers requesting quotes are actively comparing suppliers. The service center that responds fastest with:
- Accurate availability
- Realistic promise dates
- Competitive pricing
- Clear value-add options

...captures the order. Delay means lost business.

**Philosophy**: Every hour of quote delay is measurable revenue loss.

### A.2 Pricing Must Reflect Real Cost and Capacity

Pricing disconnected from reality creates two failure modes:
1. **Underpriced quotes** erode margin silently
2. **Overpriced quotes** lose winnable business

Real pricing requires real-time visibility into:
- Actual material cost (not last month's average)
- Current inventory position (not ERP snapshot)
- True capacity availability (not theoretical)
- Real freight costs (not standard tables)
- Customer-specific cost-to-serve

**Philosophy**: Every quote must be grounded in current operational truth.

### A.3 AI Augments, Not Replaces, Sales Judgment

AI provides:
- Speed (instant pricing recommendations)
- Consistency (same inputs = same outputs)
- Optimization (multi-variable analysis humans can't do)
- Pattern recognition (what's worked before)

Sales provides:
- Customer relationship context
- Competitive intelligence
- Strategic account decisions
- Exception judgment

**Philosophy**: AI recommends, humans decide, system audits.

### A.4 Explainable Recommendations

Every pricing recommendation must answer:
- **Why this price?** (cost breakdown)
- **Why this margin?** (market/customer factors)
- **Why this date?** (capacity/logistics constraints)
- **What alternatives?** (trade-offs visible)

**Philosophy**: Black-box pricing destroys trust. Transparency enables confidence.

---

## B) RFQ Intake & Normalization

### B.1 RFQ Sources

```
┌─────────────────────────────────────────────────────────────────┐
│                      RFQ INTAKE CHANNELS                        │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│    EMAIL    │    PHONE    │   PORTAL    │     EDI     │  WALK  │
│   AI Parse  │  CSR Entry  │ Self-Serve  │  Automated  │   IN   │
├─────────────┴─────────────┴─────────────┴─────────────┴────────┤
│                    NORMALIZATION ENGINE                         │
│  Material → Dimensions → Tolerances → Processing → Delivery    │
├─────────────────────────────────────────────────────────────────┤
│                    UNIFIED RFQ RECORD                           │
└─────────────────────────────────────────────────────────────────┘
```

#### B.1.1 Email Intake (AI-Parsed)

**Process:**
1. Customer sends email to quotes@company.com
2. AI extracts structured data:
   - Customer identification (email → account lookup)
   - Material grade/form mentions
   - Dimensions and quantities
   - Delivery requirements
   - Value-add processing mentions
3. Confidence scoring on extraction
4. Low-confidence items flagged for CSR review
5. RFQ created in PARSED state

**AI Extraction Fields:**
```typescript
interface EmailRFQExtraction {
  confidence: number; // 0-100
  customer: {
    email: string;
    matchedAccountId?: string;
    matchConfidence: number;
  };
  lineItems: Array<{
    rawText: string;
    parsedMaterial?: {
      grade: string;
      form: string;
      confidence: number;
    };
    parsedDimensions?: {
      thickness?: number;
      width?: number;
      length?: number;
      od?: number;
      id?: number;
      unit: 'IN' | 'MM';
      confidence: number;
    };
    quantity?: {
      value: number;
      unit: 'PCS' | 'LBS' | 'FT' | 'EA';
      confidence: number;
    };
    processing?: string[];
  }>;
  delivery: {
    requestedDate?: Date;
    location?: string;
    urgency?: 'STANDARD' | 'RUSH' | 'HOT';
  };
  attachments: string[]; // Drawing/spec references
}
```

#### B.1.2 Phone Intake (CSR Entry)

**Process:**
1. CSR receives call, opens RFQ entry screen
2. Customer lookup (name, phone, account #)
3. Guided entry wizard:
   - Material selector (searchable, recent history)
   - Dimension entry (form-specific fields)
   - Quantity calculator
   - Processing checklist
   - Delivery preferences
4. Real-time availability shown during entry
5. RFQ created in REVIEWED state (CSR validated)

#### B.1.3 Portal/Ecommerce Intake

**Process:**
1. Logged-in customer accesses RFQ form
2. Account-aware experience:
   - Saved addresses
   - Recent orders
   - Negotiated pricing tiers visible
   - Preferred materials
3. Structured entry with validation
4. Instant preliminary pricing (if enabled)
5. RFQ created in PARSED state
6. Auto-routing to assigned sales rep

#### B.1.4 EDI Intake (Future)

**Process:**
1. EDI 840 (RFQ) received
2. Mapped to internal format
3. Auto-response with acknowledgment
4. Quote generated
5. EDI 843 (Quote) returned
6. Optional auto-convert on 850 (PO)

### B.2 Normalization Engine

All RFQs undergo normalization to ensure consistent pricing:

#### B.2.1 Material Normalization

```typescript
interface MaterialNormalization {
  input: {
    rawDescription: string;
    customerPartNumber?: string;
  };
  normalized: {
    materialCode: string;      // Internal material master
    grade: string;             // 1018, 304L, 6061-T6, etc.
    form: string;              // SHEET, PLATE, BAR, TUBE, etc.
    specification: string;     // ASTM A36, ASME SA240, etc.
    condition: string;         // HR, CR, ANNEALED, etc.
  };
  alternates: Array<{
    materialCode: string;
    reason: string;            // 'equivalent_grade', 'superseded', etc.
    priceImpact: number;
  }>;
}
```

**Normalization Rules:**
- Customer part number → internal material mapping
- Synonym resolution (e.g., "CRS" → "Cold Rolled Steel")
- Spec disambiguation (AMS vs ASTM vs customer spec)
- Tolerance class inference

#### B.2.2 Dimension Normalization

```typescript
interface DimensionNormalization {
  form: 'SHEET' | 'PLATE' | 'BAR' | 'TUBE' | 'PIPE' | 'ANGLE' | 'CHANNEL';
  dimensions: {
    // Form-specific fields
    thickness?: number;
    width?: number;
    length?: number;
    od?: number;
    id?: number;
    wallThickness?: number;
    legA?: number;
    legB?: number;
    flangeWidth?: number;
    webThickness?: number;
  };
  unit: 'IN' | 'MM' | 'FT';
  normalizedToInches: Record<string, number>;
  
  // Tolerance
  toleranceClass: 'STANDARD' | 'PRECISION' | 'TIGHT';
  tolerances: Record<string, { plus: number; minus: number }>;
}
```

#### B.2.3 Processing Normalization

Map customer processing descriptions to internal operations:

| Customer Says | Normalized Operation | Work Center |
|--------------|---------------------|-------------|
| "cut to size" | SAW_CUT | SAW |
| "sheared" | SHEAR_CUT | SHEAR |
| "flame cut" | BURN_CUT | BURN_TABLE |
| "laser" | LASER_CUT | LASER |
| "plasma" | PLASMA_CUT | PLASMA |
| "blanchard ground" | BLANCHARD_GRIND | GRINDER |
| "heat treat" | HEAT_TREAT | EXTERNAL |
| "cert required" | CERT_PACKAGE | QC |

### B.3 De-duplication & Versioning

#### B.3.1 Duplicate Detection

Before creating new RFQ:
1. Check for matching customer + similar materials + similar date range
2. If match found within 48 hours:
   - Prompt user: "Similar RFQ exists - link as revision?"
   - Options: Link, Create New, Merge
3. Linked RFQs share history

#### B.3.2 Version Control

```typescript
interface RFQVersion {
  rfqId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  reason?: string;
}
```

**Versioning triggers:**
- Customer revises requirements
- CSR corrects data entry error
- Material substitution accepted
- Quantity change

---

## C) Pricing Intelligence Model

### C.1 Pricing Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRICING ENGINE INPUTS                        │
├─────────────────────────────────────────────────────────────────┤
│ MATERIAL COST           │ Real-time cost from inventory        │
│ └─ Base material        │ Actual landed cost per unit          │
│ └─ Current replacement  │ Today's mill/distributor price       │
│ └─ Future cost (if PO)  │ Committed cost on order              │
├─────────────────────────────────────────────────────────────────┤
│ INVENTORY POSITION      │ Affects cost selection strategy      │
│ └─ Days on hand         │ Older stock = lower cost basis       │
│ └─ Turnover velocity    │ Fast movers priced at replacement    │
│ └─ Excess/slow          │ Candidates for margin reduction      │
├─────────────────────────────────────────────────────────────────┤
│ YIELD & SCRAP           │ Material-form specific               │
│ └─ Expected yield %     │ Historical by material/operation     │
│ └─ Remnant value        │ Credit for usable drops              │
│ └─ Scrap value          │ Market rate for scrap                │
├─────────────────────────────────────────────────────────────────┤
│ LABOR & MACHINE TIME    │ From capacity model                  │
│ └─ Setup time           │ Per operation, per work center       │
│ └─ Run time             │ Per unit, per operation              │
│ └─ Burden rate          │ Loaded cost per hour                 │
├─────────────────────────────────────────────────────────────────┤
│ FREIGHT ESTIMATE        │ From logistics module                │
│ └─ Carrier rates        │ Real-time or table-based             │
│ └─ Weight/dims          │ Actual quote weight                  │
│ └─ Destination          │ Zone-based or exact                  │
├─────────────────────────────────────────────────────────────────┤
│ CUSTOMER CONTEXT        │ From CRM/OrderHub                    │
│ └─ Tier/pricing level   │ A/B/C customer pricing               │
│ └─ Volume history       │ Last 12 months                       │
│ └─ Win rate history     │ Competitive position                 │
│ └─ Payment history      │ Credit risk factor                   │
├─────────────────────────────────────────────────────────────────┤
│ COMPETITIVE POSTURE     │ Manual inputs                        │
│ └─ Market conditions    │ Hot/Normal/Soft                      │
│ └─ Competitor intel     │ Known competitive prices             │
│ └─ Strategic priority   │ Must-win accounts                    │
├─────────────────────────────────────────────────────────────────┤
│ MARGIN TARGETS          │ From finance                         │
│ └─ Floor margin         │ Absolute minimum                     │
│ └─ Target margin        │ Standard expectation                 │
│ └─ Ceiling margin       │ Maximum reasonable                   │
└─────────────────────────────────────────────────────────────────┘
```

### C.2 Pricing Calculation Engine

```typescript
interface PricingRecommendation {
  lineItemId: string;
  
  // Cost breakdown
  costBreakdown: {
    materialCost: number;        // Base material
    materialCostBasis: 'INVENTORY' | 'REPLACEMENT' | 'COMMITTED';
    yieldLoss: number;           // Scrap/waste factor
    laborCost: number;           // Processing labor
    machineCost: number;         // Equipment burden
    setupCost: number;           // Setup allocation
    packagingCost: number;       // Packaging materials
    handlingCost: number;        // Warehouse handling
    freightCost: number;         // Delivery cost
    totalCost: number;           // Sum of all costs
  };
  
  // Pricing
  recommendedPrice: number;
  pricePerUnit: number;
  unit: 'LB' | 'EA' | 'FT' | 'SQFT';
  
  // Margin analysis
  margin: {
    dollars: number;
    percent: number;
    vsFloor: number;             // How much above floor
    vsTarget: number;            // How much vs target
    category: 'BELOW_FLOOR' | 'FLOOR' | 'TARGET' | 'ABOVE_TARGET';
  };
  
  // Confidence
  confidence: {
    score: number;               // 0-100
    factors: Array<{
      name: string;
      impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      reason: string;
    }>;
  };
  
  // Alternatives
  alternatives: Array<{
    type: 'LOWER_PRICE' | 'FASTER_DELIVERY' | 'HIGHER_MARGIN' | 'SUBSTITUTE';
    price: number;
    margin: number;
    leadTime: number;
    description: string;
    tradeoff: string;
  }>;
}
```

### C.3 Pricing Strategy Selection

```typescript
enum PricingStrategy {
  MARKET_RATE = 'MARKET_RATE',           // Standard competitive pricing
  INVENTORY_CLEAR = 'INVENTORY_CLEAR',   // Excess stock - lower margin OK
  REPLACEMENT_COST = 'REPLACEMENT_COST', // Rising market - protect future margin
  STRATEGIC_ACCOUNT = 'STRATEGIC_ACCOUNT', // Below target for relationship
  EXPEDITE_PREMIUM = 'EXPEDITE_PREMIUM', // Rush order premium
  VOLUME_DISCOUNT = 'VOLUME_DISCOUNT',   // Quantity break applied
}

interface StrategySelection {
  strategy: PricingStrategy;
  reason: string;
  marginAdjustment: number;      // +/- from target
  approved: boolean;
  approver?: string;             // If override required
}
```

### C.4 Margin Guardrails

```typescript
interface MarginGuardrails {
  // By customer tier
  tierRules: {
    A: { floor: 15, target: 22, ceiling: 35 };
    B: { floor: 18, target: 25, ceiling: 40 };
    C: { floor: 22, target: 30, ceiling: 45 };
    NEW: { floor: 25, target: 32, ceiling: 50 };
  };
  
  // By material category
  categoryRules: {
    COMMODITY: { floor: 12, target: 18 };
    SPECIALTY: { floor: 20, target: 28 };
    EXOTIC: { floor: 25, target: 35 };
  };
  
  // By processing complexity
  processingRules: {
    RAW_STOCK: { marginAdd: 0 };
    SIMPLE_CUT: { marginAdd: 3 };
    PRECISION_CUT: { marginAdd: 5 };
    MULTI_OP: { marginAdd: 8 };
    COMPLEX: { marginAdd: 12 };
  };
  
  // Override thresholds
  overrideRules: {
    belowFloor: 'MANAGER_REQUIRED';
    belowFloorMinus5: 'VP_REQUIRED';
    belowFloorMinus10: 'EXEC_REQUIRED';
    aboveCeiling: 'REVIEW_REQUIRED';  // Why so high?
  };
}
```

---

## D) Quoting Workflow (State Machines)

### D.1 RFQ State Machine

```
                              ┌─────────────────┐
                              │                 │
                              ▼                 │
┌────────┐    ┌────────┐    ┌──────────┐    ┌──────────┐
│  NEW   │───▶│ PARSED │───▶│ REVIEWED │───▶│  QUOTED  │
└────────┘    └────────┘    └──────────┘    └──────────┘
    │              │              │               │
    │              │              │               ├───────┐
    ▼              ▼              ▼               ▼       ▼
┌────────┐    ┌────────┐    ┌──────────┐    ┌────────┐ ┌──────┐
│ INVALID│    │ NEEDS  │    │ DECLINED │    │ACCEPTED│ │ LOST │
│        │    │ REVIEW │    │          │    │        │ │      │
└────────┘    └────────┘    └──────────┘    └────────┘ └──────┘
```

**State Definitions:**

| State | Description | Entry Conditions | Exit Conditions |
|-------|-------------|------------------|-----------------|
| NEW | Just received | Email/portal/phone entry | Parsing complete |
| PARSED | AI extracted | Extraction confidence >60% | CSR review complete |
| NEEDS_REVIEW | Low confidence | Extraction confidence <60% | Manual correction done |
| REVIEWED | CSR validated | Human verified all fields | Quote generated |
| QUOTED | Quote sent | Price/terms finalized | Customer responds |
| ACCEPTED | Customer accepted | Signed/confirmed | Order created |
| LOST | Did not win | Customer declined/competitor won | - |
| DECLINED | We declined | Cannot fulfill/bad credit | - |
| INVALID | Bad data | Cannot parse/spam | - |

### D.2 Quote State Machine

```
┌────────┐    ┌────────┐    ┌─────────────┐    ┌──────────┐
│ DRAFT  │───▶│  SENT  │───▶│ NEGOTIATION │───▶│ ACCEPTED │
└────────┘    └────────┘    └─────────────┘    └──────────┘
    │              │               │                 │
    ▼              ▼               ▼                 ▼
┌────────┐    ┌────────┐    ┌──────────┐       ┌──────────┐
│CANCELED│    │EXPIRED │    │ REJECTED │       │CONVERTED │
└────────┘    └────────┘    └──────────┘       └──────────┘
```

**State Definitions:**

| State | Description | Valid Duration | Key Rules |
|-------|-------------|----------------|-----------|
| DRAFT | Being prepared | Until sent | Can modify freely |
| SENT | Delivered to customer | Default 7 days | Price locked on send |
| NEGOTIATION | Active discussion | 30 days max | Requires new version for changes |
| ACCEPTED | Customer confirmed | 24 hours | Must convert or extends |
| CONVERTED | Order created | - | Quote closes |
| REJECTED | Customer declined | - | Capture reason |
| EXPIRED | No response | - | Auto-transition |
| CANCELED | We withdrew | - | Capture reason |

### D.3 Quote Versioning Rules

```typescript
interface QuoteVersion {
  quoteId: string;
  version: number;
  status: QuoteStatus;
  
  // Price lock
  priceLock: {
    lockedAt: Date;
    expiresAt: Date;
    extendable: boolean;
    extensions: number;
    maxExtensions: number;
  };
  
  // Version tracking
  changes: Array<{
    field: string;
    previousValue: any;
    newValue: any;
    reason: string;
    changedBy: string;
    changedAt: Date;
  }>;
  
  // Approval chain
  approvals: Array<{
    type: 'MARGIN' | 'TERMS' | 'CREDIT' | 'EXPEDITE';
    requiredFor: string;
    approver: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    timestamp?: Date;
  }>;
}
```

### D.4 Approval Thresholds

```typescript
const ApprovalMatrix = {
  marginOverride: {
    floorTo5Below: { approver: 'SALES_MANAGER', required: true },
    fiveTo10Below: { approver: 'BRANCH_MANAGER', required: true },
    over10Below: { approver: 'VP_SALES', required: true },
  },
  
  creditRisk: {
    newCustomer: { approver: 'CREDIT_MANAGER', required: true },
    overLimit: { approver: 'CREDIT_MANAGER', required: true },
    pastDue: { approver: 'CREDIT_MANAGER', required: true },
  },
  
  terms: {
    extendedPayment: { approver: 'SALES_MANAGER', required: true },
    specialShipping: { approver: 'OPS_MANAGER', required: true },
    expediteFee: { approver: 'SALES_MANAGER', required: true },
  },
  
  value: {
    over50k: { approver: 'SALES_MANAGER', required: true },
    over100k: { approver: 'BRANCH_MANAGER', required: true },
    over250k: { approver: 'VP_SALES', required: true },
  },
};
```

---

## E) Capacity & Promise Date Logic

### E.1 Promise Date Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROMISE DATE ENGINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INVENTORY     →  Available now?                                │
│  CHECK            ├─ YES: Skip to packaging                     │
│                   └─ NO: Check production                       │
│                                                                 │
│  PRODUCTION    →  Capacity available?                           │
│  CAPACITY         ├─ Check each work center                     │
│                   ├─ Sequence operations                        │
│                   └─ Calculate completion date                  │
│                                                                 │
│  CONSTRAINTS   →  What blocks production?                       │
│                   ├─ Maintenance windows                        │
│                   ├─ Quality holds                              │
│                   ├─ Safety shutdowns                           │
│                   └─ Resource availability                      │
│                                                                 │
│  PACKAGING     →  Time to pack/stage                            │
│  & STAGING        └─ Based on complexity                        │
│                                                                 │
│  LOGISTICS     →  Transit time to destination                   │
│                   ├─ Carrier availability                       │
│                   ├─ Service level                              │
│                   └─ Pickup windows                             │
│                                                                 │
│  ═══════════════════════════════════════════════                │
│  PROMISE DATE  =  Production + Packaging + Transit + Buffer     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### E.2 Capacity Query Interface

```typescript
interface CapacityQuery {
  operations: Array<{
    operation: string;
    workCenter: string;
    estimatedHours: number;
    setupHours: number;
  }>;
  requiredDate?: Date;
  priority: 'STANDARD' | 'RUSH' | 'HOT';
}

interface CapacityResponse {
  available: boolean;
  earliestStart: Date;
  expectedCompletion: Date;
  
  // By work center
  schedule: Array<{
    workCenter: string;
    operation: string;
    startTime: Date;
    endTime: Date;
    loadPercent: number;
  }>;
  
  // Conflicts
  conflicts: Array<{
    type: 'CAPACITY' | 'MAINTENANCE' | 'SAFETY' | 'MATERIAL';
    description: string;
    resolvable: boolean;
    resolution?: string;
  }>;
  
  // Alternatives
  alternatives: Array<{
    option: 'EXPEDITE' | 'SPLIT' | 'ALTERNATE_BRANCH' | 'OUTSOURCE';
    completionDate: Date;
    additionalCost: number;
    feasibility: number;
  }>;
}
```

### E.3 Multi-Branch Fulfillment

```typescript
interface MultiBranchQuery {
  materials: Array<{
    materialCode: string;
    quantity: number;
    processing: string[];
  }>;
  destination: {
    address: string;
    zipCode: string;
  };
  requestedDate: Date;
}

interface MultiBranchResponse {
  recommended: FulfillmentOption;
  alternatives: FulfillmentOption[];
}

interface FulfillmentOption {
  type: 'SINGLE_BRANCH' | 'SPLIT' | 'TRANSFER_THEN_PROCESS';
  
  branches: Array<{
    branchId: string;
    branchName: string;
    items: string[];
    hasInventory: boolean;
    hasCapacity: boolean;
    processAt: boolean;
    shipFrom: boolean;
    estimatedCost: number;
    completionDate: Date;
  }>;
  
  totalCost: number;
  promiseDate: Date;
  reliability: number;  // 0-100 confidence
  reasoning: string;
}
```

### E.4 Expedite Options

When standard promise date exceeds customer request:

```typescript
interface ExpediteOptions {
  standardDate: Date;
  requestedDate: Date;
  gap: number;  // Days
  
  options: Array<{
    method: 'OVERTIME' | 'PRIORITY_BUMP' | 'ALTERNATE_PROCESS' | 'PARTIAL_SHIP' | 'AIR_FREIGHT';
    achievableDate: Date;
    additionalCost: number;
    marginImpact: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    approvalRequired: boolean;
    description: string;
  }>;
}
```

---

## F) Substitution & Optimization Logic

### F.1 Substitution Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                   SUBSTITUTION ENGINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  REQUESTED     →  Check availability                            │
│  MATERIAL         ├─ In stock: Use requested                    │
│                   └─ Not available: Find substitutes            │
│                                                                 │
│  SUBSTITUTE    →  Search criteria                               │
│  SEARCH           ├─ Equivalent grades (metallurgical)          │
│                   ├─ Superseded materials                       │
│                   ├─ Alternate forms (plate vs sheet)           │
│                   ├─ Dimensional optimization                   │
│                   └─ Customer-approved alternates               │
│                                                                 │
│  VALIDATION    →  Confirm suitability                           │
│                   ├─ Meets spec requirements                    │
│                   ├─ Dimensional coverage                       │
│                   ├─ Customer approval status                   │
│                   └─ Cost/margin impact                         │
│                                                                 │
│  PRESENTATION  →  Show options to sales                         │
│                   ├─ Rank by margin                             │
│                   ├─ Rank by lead time                          │
│                   └─ Highlight trade-offs                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### F.2 Substitution Rules

```typescript
interface SubstitutionRule {
  id: string;
  name: string;
  type: 'GRADE_EQUIVALENT' | 'FORM_ALTERNATE' | 'DIMENSIONAL' | 'SUPERSESSION';
  
  // Matching
  fromMaterial: MaterialPattern;
  toMaterial: MaterialPattern;
  
  // Conditions
  conditions: {
    requiresCustomerApproval: boolean;
    autoApproveFor: string[];     // Customer IDs
    maxPriceIncrease: number;     // Percent
    maxLeadTimeIncrease: number;  // Days
    specCompatibility: string[];  // Spec codes
  };
  
  // Metrics
  historicalUsage: {
    timesOffered: number;
    timesAccepted: number;
    acceptanceRate: number;
  };
}
```

### F.3 Dimensional Optimization

```typescript
interface DimensionalOptimization {
  requested: {
    thickness: number;
    width: number;
    length: number;
    quantity: number;
  };
  
  options: Array<{
    stockSize: {
      thickness: number;
      width: number;
      length: number;
    };
    yield: number;              // Percent
    piecesPerStock: number;
    stockRequired: number;
    wastePercent: number;
    costPerPiece: number;
    nestingPattern: string;     // Visual representation
    recommendation: boolean;
  }>;
  
  optimization: {
    bestYield: number;          // Index
    bestCost: number;           // Index
    recommended: number;        // Index
    reasoning: string;
  };
}
```

### F.4 Branch Transfer Logic

When material exists at another branch:

```typescript
interface TransferAnalysis {
  requestedMaterial: string;
  requestingBranch: string;
  
  transferOptions: Array<{
    fromBranch: string;
    availableQty: number;
    transferCost: number;
    transferTime: number;         // Days
    netCostImpact: number;        // vs local purchase
    marginImpact: number;
    recommended: boolean;
    reasoning: string;
  }>;
  
  localPurchase: {
    leadTime: number;
    cost: number;
    minimumQty: number;
  };
  
  recommendation: 'TRANSFER' | 'LOCAL_PURCHASE' | 'SPLIT';
}
```

---

## G) Integration with Finance & Margin Intelligence

### G.1 Real-Time Margin Preview

Every quote line displays:

```typescript
interface MarginPreview {
  lineItemId: string;
  
  // Costs (visible to sales)
  costs: {
    material: number;
    processing: number;
    freight: number;
    overhead: number;
    total: number;
  };
  
  // Pricing
  pricing: {
    listPrice: number;
    customerPrice: number;       // After tier discount
    quotedPrice: number;         // After negotiation
    extendedPrice: number;
  };
  
  // Margin
  margin: {
    dollars: number;
    percent: number;
    category: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
    vsTarget: number;
    vsFloor: number;
  };
  
  // Alerts
  alerts: Array<{
    type: 'BELOW_FLOOR' | 'BELOW_TARGET' | 'HIGH_RISK' | 'APPROVAL_NEEDED';
    message: string;
    action: string;
  }>;
}
```

### G.2 Quote vs Actual Feedback

After order completion:

```typescript
interface QuoteVsActual {
  quoteId: string;
  orderId: string;
  
  // Material
  material: {
    quotedCost: number;
    actualCost: number;
    variance: number;
    reason?: string;
  };
  
  // Processing
  processing: {
    quotedHours: number;
    actualHours: number;
    quotedCost: number;
    actualCost: number;
    variance: number;
    reason?: string;
  };
  
  // Yield
  yield: {
    quotedPercent: number;
    actualPercent: number;
    variance: number;
    reason?: string;
  };
  
  // Freight
  freight: {
    quotedCost: number;
    actualCost: number;
    variance: number;
    reason?: string;
  };
  
  // Total
  total: {
    quotedMargin: number;
    actualMargin: number;
    variance: number;
    lessons: string[];
  };
}
```

### G.3 Pricing Model Refinement

Feedback loop to improve pricing accuracy:

```typescript
interface PricingModelUpdate {
  trigger: 'VARIANCE_THRESHOLD' | 'PERIODIC' | 'MANUAL';
  
  updates: Array<{
    factor: 'YIELD' | 'LABOR' | 'SETUP' | 'HANDLING' | 'FREIGHT';
    materialCategory: string;
    workCenter: string;
    
    current: number;
    proposed: number;
    basedOn: {
      sampleSize: number;
      period: string;
      avgVariance: number;
    };
    
    approved: boolean;
    approvedBy?: string;
    effectiveDate?: Date;
  }>;
}
```

### G.4 Credit Risk Integration

```typescript
interface CreditCheck {
  customerId: string;
  
  status: {
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
    oldestInvoice: number;       // Days
    paymentScore: number;        // 0-100
  };
  
  quoteImpact: {
    quoteValue: number;
    wouldExceedLimit: boolean;
    requiresApproval: boolean;
    holdReason?: string;
  };
  
  recommendations: Array<{
    action: 'PROCEED' | 'REQUIRE_DEPOSIT' | 'COD' | 'HOLD';
    reason: string;
  }>;
}
```

---

## H) Customer & Sales User Experience

### H.1 Sales UI - RFQ Inbox

```
┌─────────────────────────────────────────────────────────────────┐
│  RFQ Inbox                                        [+ New RFQ]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────┬─────┬────────┬──────┬─────────────────────────────────│
│  │ NEW │NEEDS│REVIEWED│QUOTED│                    Filter ▼      │
│  │ 12  │ REV │   8    │  24  │     Search RFQs...              │
│  │     │  3  │        │      │                                  │
│  └─────┴─────┴────────┴──────┴─────────────────────────────────│
├─────────────────────────────────────────────────────────────────┤
│  ⚡ HOT (3)                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ RFQ-2026-001234        AutoMax Manufacturing             │   │
│  │ 12 x 0.250" x 48" x 96" 304L Sheet                      │   │
│  │ Requested: Feb 7   ⏱️ 2h 15m ago   Est: $4,200          │   │
│  │ [View] [Quick Quote] [Assign]                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ RFQ-2026-001232        Steel Solutions LLC               │   │
│  │ Multiple items (4)     Processing required               │   │
│  │ Requested: Feb 6   ⏱️ 4h 30m ago   Est: $12,500         │   │
│  │ [View] [Quick Quote] [Assign]                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📋 STANDARD (21)                                               │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### H.2 Sales UI - Quote Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  Quote Builder                    AutoMax Manufacturing         │
│  QUO-2026-002156                  Account Tier: A               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LINE ITEMS                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. 304L Stainless Sheet                                     ││
│  │    0.250" x 48" x 96"   Qty: 12 pcs   Weight: 1,224 lbs    ││
│  │    ────────────────────────────────────────────────────     ││
│  │    Material Cost:    $2,876    │  Recommended:  $4,180      ││
│  │    Processing:         $420    │  Your Price:   $4,180      ││
│  │    Freight:            $285    │                ────────    ││
│  │    ──────────                  │  Margin:       $599 (17%)  ││
│  │    Total Cost:       $3,581    │  ✓ Meets target (15%)      ││
│  │                                                              ││
│  │    ⓘ Price based on current inventory cost. Available now.  ││
│  │    📅 Promise: Feb 6 (2 days)                               ││
│  │    ────────────────────────────────────────────────────     ││
│  │    ALTERNATIVES:                                             ││
│  │    • Save $180: Ship from Toledo (+1 day) → $4,000          ││
│  │    • Faster: Air freight available (-1 day) → $4,520        ││
│  │    • Substitute: 316L available (+5% cost) → $4,390         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 2. A36 Plate                                                ││
│  │    ...                                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│  QUOTE SUMMARY                                                  │
│  ───────────────────────────────────────────────────────────   │
│  Subtotal:        $8,450          Margin:  $1,420 (20%)        │
│  Freight:           $285          vs Target: +5%               │
│  Tax:               $677                                        │
│  ───────────                      ✓ All items available        │
│  Total:           $9,412          📅 Ships: Feb 5              │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  Valid Until: Feb 11, 2026                                     │
│                                                                 │
│  [Save Draft]  [Preview PDF]  [Send Quote]  [Request Approval] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### H.3 Pricing Explanation Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  💡 Price Explanation                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recommended Price: $4,180 ($3.42/lb)                          │
│                                                                 │
│  COST BREAKDOWN                                                 │
│  ├─ Material (304L @ $2.35/lb)        $2,876    80%            │
│  ├─ Processing (Shear cut)              $420    12%            │
│  ├─ Packaging & Handling                 $85     2%            │
│  └─ Freight (Detroit → Chicago)         $285     8%            │
│  ────────────────────────────────────────────                   │
│  Total Cost                           $3,581                    │
│                                                                 │
│  MARGIN ANALYSIS                                                │
│  ├─ Target Margin (A-tier):              22%                   │
│  ├─ Recommended Margin:                  17%                   │
│  └─ Margin Dollars:                     $599                   │
│                                                                 │
│  WHY THIS PRICE?                                                │
│  ✓ Customer tier A pricing applied (-5% from list)             │
│  ✓ Standard 304L market competitive                            │
│  ✓ Current inventory cost (lower than replacement)             │
│  ⚠ Below target margin - high volume customer justifies        │
│                                                                 │
│  CONFIDENCE: 92%                                                │
│  Based on: 47 similar quotes, 78% win rate at this price       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### H.4 Customer Portal - RFQ Submission

```
┌─────────────────────────────────────────────────────────────────┐
│  Request a Quote                              AutoMax Mfg       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QUICK ADD                    OR    UPLOAD DRAWING              │
│  ────────────                      ──────────────               │
│  Material: [304L Stainless ▼]      [📎 Drop file or browse]    │
│  Form:     [Sheet ▼]                                            │
│                                                                 │
│  Dimensions:                                                    │
│  Thickness: [0.250] in    Width: [48] in    Length: [96] in    │
│                                                                 │
│  Quantity: [12] pcs                                             │
│                                                                 │
│  Processing:                                                    │
│  ☑ Cut to size   ☐ Deburr   ☐ Blanchard grind   ☐ Other       │
│                                                                 │
│  [+ Add Another Item]                                           │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  DELIVERY                                                       │
│  ────────                                                       │
│  Ship To: [123 Industrial Blvd, Chicago, IL ▼]                 │
│  Requested Date: [Feb 7, 2026 📅]                              │
│  Priority: ○ Standard  ○ Rush (+$)  ○ HOT (call for pricing)   │
│                                                                 │
│  Notes:                                                         │
│  [COA required. Reference PO# pending.                    ]     │
│                                                                 │
│  [Submit RFQ]                                                   │
│                                                                 │
│  💡 We typically respond within 2 hours during business hours  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### H.5 Customer Portal - Quote Review

```
┌─────────────────────────────────────────────────────────────────┐
│  Quote QUO-2026-002156                         Valid 5 more days│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  From: Alro Steel - Detroit                                     │
│  Your Rep: Sarah Johnson | sarah.johnson@alro.com | x2156      │
│                                                                 │
│  ITEMS                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. 304L Stainless Sheet                                     ││
│  │    0.250" x 48" x 96"                                       ││
│  │    Quantity: 12 pcs (1,224 lbs)                             ││
│  │    Price: $4,180.00 ($3.42/lb)                              ││
│  │    📅 Ships: Feb 5 | Delivers: Feb 6                        ││
│  │    ✓ In Stock | ✓ COA Included                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  SUMMARY                                                        │
│  ─────────────────────────────────                              │
│  Subtotal:        $4,180.00                                     │
│  Freight:           $285.00                                     │
│  Tax (est):         $357.20                                     │
│  ─────────────────────────────                                  │
│  Total:           $4,822.20                                     │
│                                                                 │
│  Ship To: 123 Industrial Blvd, Chicago, IL 60632               │
│  Terms: Net 30                                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Your PO#: [________________]                              │   │
│  │                                                           │   │
│  │ [Accept Quote & Create Order]    [Request Changes]       │   │
│  │                                                           │   │
│  │ [Download PDF]  [Ask a Question]                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## I) Roles & Permissions

### I.1 Role Matrix

| Role | Create RFQ | Edit Quote | Send Quote | Override Price | Approve Below Floor | View Margin | View All Quotes |
|------|-----------|------------|------------|----------------|---------------------|-------------|-----------------|
| CSR | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | Own branch |
| Sales Rep | ✓ | ✓ | ✓ | -5% | ✗ | ✓ | Own quotes |
| Sales Manager | ✓ | ✓ | ✓ | -10% | ✓ | ✓ | Branch |
| Branch Manager | ✓ | ✓ | ✓ | -15% | ✓ | ✓ | Branch |
| Pricing Manager | ✓ | ✓ | ✓ | Unlimited | ✓ | ✓ | All |
| Ops Manager | View | View | ✗ | ✗ | ✗ | ✓ | All |
| Finance | View | View | ✗ | ✗ | ✗ | ✓ | All |
| VP Sales | ✓ | ✓ | ✓ | Unlimited | ✓ | ✓ | All |
| Exec | View | View | ✗ | ✗ | View only | ✓ | All |

### I.2 Permission Definitions

```typescript
interface SalesPermissions {
  rfq: {
    create: boolean;
    view: 'OWN' | 'BRANCH' | 'ALL';
    edit: boolean;
    delete: boolean;
    assign: boolean;
  };
  
  quote: {
    create: boolean;
    view: 'OWN' | 'BRANCH' | 'ALL';
    edit: boolean;
    send: boolean;
    withdraw: boolean;
  };
  
  pricing: {
    viewCost: boolean;
    viewMargin: boolean;
    overridePrice: boolean;
    overrideLimit: number;       // Max % below target
    approveBelowFloor: boolean;
    editPricingRules: boolean;
  };
  
  customers: {
    view: 'OWN' | 'BRANCH' | 'ALL';
    edit: boolean;
    viewCredit: boolean;
    overrideCredit: boolean;
  };
  
  analytics: {
    viewOwnMetrics: boolean;
    viewTeamMetrics: boolean;
    viewCompanyMetrics: boolean;
    exportData: boolean;
  };
}
```

---

## J) APIs & Eventing

### J.1 REST Endpoints

#### RFQ Endpoints

```
POST   /api/rfqs                    Create new RFQ
GET    /api/rfqs                    List RFQs (filtered)
GET    /api/rfqs/:id                Get RFQ details
PUT    /api/rfqs/:id                Update RFQ
DELETE /api/rfqs/:id                Delete/cancel RFQ
POST   /api/rfqs/:id/parse          Trigger AI parsing
POST   /api/rfqs/:id/quote          Generate quote from RFQ
```

#### Quote Endpoints

```
POST   /api/quotes                  Create new quote
GET    /api/quotes                  List quotes (filtered)
GET    /api/quotes/:id              Get quote details
PUT    /api/quotes/:id              Update quote
POST   /api/quotes/:id/send         Send quote to customer
POST   /api/quotes/:id/accept       Accept quote
POST   /api/quotes/:id/reject       Reject quote
POST   /api/quotes/:id/convert      Convert to order
POST   /api/quotes/:id/version      Create new version
GET    /api/quotes/:id/versions     Get version history
```

#### Pricing Endpoints

```
POST   /api/pricing/recommend       Get pricing recommendation
POST   /api/pricing/validate        Validate price against rules
POST   /api/pricing/override        Request price override
GET    /api/pricing/rules           Get pricing rules
PUT    /api/pricing/rules           Update pricing rules
GET    /api/pricing/history/:customerId  Customer pricing history
```

#### Capacity Endpoints

```
POST   /api/capacity/check          Check capacity for quote
POST   /api/capacity/promise        Calculate promise date
GET    /api/capacity/availability   Get work center availability
```

### J.2 Event Schema

```typescript
// RFQ Events
interface RfqReceivedEvent {
  type: 'rfq.received';
  rfqId: string;
  source: 'EMAIL' | 'PORTAL' | 'PHONE' | 'EDI';
  customerId: string;
  estimatedValue: number;
  timestamp: Date;
}

interface RfqParsedEvent {
  type: 'rfq.parsed';
  rfqId: string;
  confidence: number;
  itemCount: number;
  needsReview: boolean;
  timestamp: Date;
}

// Quote Events
interface QuoteSentEvent {
  type: 'quote.sent';
  quoteId: string;
  rfqId: string;
  customerId: string;
  totalValue: number;
  marginPercent: number;
  validUntil: Date;
  timestamp: Date;
}

interface QuoteAcceptedEvent {
  type: 'quote.accepted';
  quoteId: string;
  customerId: string;
  customerPO: string;
  totalValue: number;
  timestamp: Date;
}

// Pricing Events
interface PricingOverrideEvent {
  type: 'pricing.override';
  quoteId: string;
  lineItemId: string;
  originalPrice: number;
  overridePrice: number;
  marginImpact: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: Date;
}

// Order Events
interface OrderCreatedEvent {
  type: 'order.created';
  orderId: string;
  quoteId: string;
  customerId: string;
  totalValue: number;
  promiseDate: Date;
  timestamp: Date;
}
```

---

## K) Analytics & KPIs

### K.1 Sales Performance KPIs

| KPI | Definition | Target | Frequency |
|-----|-----------|--------|-----------|
| RFQ Response Time | Time from receipt to quote sent | <2 hours | Real-time |
| Quote Win Rate | Accepted / (Accepted + Rejected + Expired) | >35% | Weekly |
| Average Quote Value | Total quoted / Quote count | Trend up | Weekly |
| Quote-to-Order Rate | Orders / Quotes sent | >40% | Weekly |
| RFQ-to-Cash Cycle | Days from RFQ to payment received | <21 days | Monthly |

### K.2 Pricing Performance KPIs

| KPI | Definition | Target | Frequency |
|-----|-----------|--------|-----------|
| Average Margin | Weighted average margin on quotes | >22% | Daily |
| Margin vs Target | Actual margin vs category target | ±2% | Daily |
| Below-Floor Rate | Quotes with margin below floor | <5% | Weekly |
| Override Rate | Price overrides / Total quotes | <15% | Weekly |
| Quote vs Actual Variance | (Actual margin - Quoted margin) / Quoted | <5% | Monthly |

### K.3 Operational KPIs

| KPI | Definition | Target | Frequency |
|-----|-----------|--------|-----------|
| Promise Date Accuracy | On-time delivery vs promise | >95% | Weekly |
| Capacity Utilization | Quoted work vs available capacity | 70-85% | Daily |
| Substitution Acceptance | Customer accepted substitutes | >60% | Monthly |
| Credit Hold Rate | Quotes held for credit | <10% | Weekly |

### K.4 Dashboard Widgets

```typescript
interface SalesDashboard {
  // Pipeline view
  pipeline: {
    newRfqs: number;
    inProgress: number;
    awaitingResponse: number;
    wonThisWeek: number;
    lostThisWeek: number;
    totalValue: number;
  };
  
  // Performance metrics
  performance: {
    avgResponseTime: number;
    winRate: number;
    avgMargin: number;
    marginVsTarget: number;
  };
  
  // Trends
  trends: {
    rfqVolume: TimeSeriesData;
    winRate: TimeSeriesData;
    avgOrderValue: TimeSeriesData;
    marginTrend: TimeSeriesData;
  };
  
  // Alerts
  alerts: Array<{
    type: 'OVERDUE' | 'EXPIRING' | 'APPROVAL_NEEDED' | 'CAPACITY';
    count: number;
    items: string[];
  }>;
}
```

---

## L) Audit & Controls

### L.1 Audit Trail Requirements

Every pricing decision must capture:

```typescript
interface PricingAuditRecord {
  id: string;
  timestamp: Date;
  
  // Context
  quoteId: string;
  lineItemId: string;
  customerId: string;
  userId: string;
  
  // Pricing details
  action: 'RECOMMENDED' | 'ACCEPTED' | 'MODIFIED' | 'OVERRIDDEN' | 'APPROVED';
  recommendedPrice: number;
  finalPrice: number;
  variance: number;
  
  // Margin details
  costBasis: number;
  marginDollars: number;
  marginPercent: number;
  targetMargin: number;
  floorMargin: number;
  
  // Justification
  reason?: string;
  competitorInfo?: string;
  strategicContext?: string;
  
  // Approvals
  approvalRequired: boolean;
  approver?: string;
  approvalTimestamp?: Date;
  approvalNotes?: string;
}
```

### L.2 Override Tracking

```typescript
interface OverrideLog {
  id: string;
  timestamp: Date;
  
  // What was overridden
  overrideType: 'PRICE' | 'MARGIN' | 'CREDIT' | 'TERMS' | 'PROMISE_DATE';
  originalValue: any;
  overrideValue: any;
  impact: string;
  
  // Who and why
  requestedBy: string;
  reason: string;
  justification: string;
  
  // Approval
  approvalLevel: string;
  approvedBy: string;
  approvalTimestamp: Date;
  
  // Outcome
  quoteWon: boolean;
  actualMargin?: number;
  lessonsLearned?: string;
}
```

### L.3 Customer Agreement Capture

```typescript
interface QuoteAcceptance {
  quoteId: string;
  version: number;
  
  // Acceptance details
  acceptedAt: Date;
  acceptedBy: string;
  acceptanceMethod: 'PORTAL' | 'EMAIL' | 'SIGNED_PDF' | 'VERBAL' | 'PO';
  
  // Evidence
  customerPO?: string;
  signatureImage?: string;
  emailConfirmation?: string;
  recordedCall?: string;
  
  // Terms confirmed
  priceConfirmed: number;
  termsConfirmed: string;
  deliveryConfirmed: Date;
  
  // Audit
  ipAddress?: string;
  userAgent?: string;
}
```

---

## M) Testing & Validation

### M.1 Pricing Accuracy Tests

```typescript
describe('Pricing Engine', () => {
  test('calculates material cost correctly', () => {
    // Given inventory at $2.35/lb
    // When pricing 1,224 lbs of 304L
    // Then material cost = $2,876.40
  });
  
  test('applies customer tier discount', () => {
    // Given A-tier customer with 5% discount
    // When calculating price
    // Then price reduced by 5%
  });
  
  test('enforces margin floor', () => {
    // Given floor margin of 15%
    // When price would result in 12% margin
    // Then alert raised, approval required
  });
  
  test('handles substitution pricing', () => {
    // Given substitute material with different cost
    // When calculating substitute price
    // Then cost difference reflected in price
  });
});
```

### M.2 Capacity-Aware Promise Tests

```typescript
describe('Promise Date Engine', () => {
  test('respects maintenance windows', () => {
    // Given saw scheduled for maintenance Feb 5-6
    // When calculating promise for saw work
    // Then promise date excludes maintenance window
  });
  
  test('handles multi-branch fulfillment', () => {
    // Given material at Toledo, processing at Detroit
    // When calculating promise
    // Then includes transfer time + processing time
  });
  
  test('calculates expedite correctly', () => {
    // Given standard promise of 5 days
    // When expedite requested
    // Then shows options with cost/time trade-offs
  });
});
```

### M.3 Override Enforcement Tests

```typescript
describe('Override Controls', () => {
  test('requires approval for below-floor pricing', () => {
    // Given sales rep tries to price below floor
    // Then approval workflow triggered
    // And quote cannot send until approved
  });
  
  test('logs all override attempts', () => {
    // Given any price override
    // Then audit record created
    // And includes justification
  });
  
  test('enforces approval hierarchy', () => {
    // Given override >10% below floor
    // Then requires VP approval, not just manager
  });
});
```

### M.4 Quote-to-Order Integrity Tests

```typescript
describe('Quote Conversion', () => {
  test('locks price on acceptance', () => {
    // Given quote accepted
    // When converting to order
    // Then price matches quote exactly
  });
  
  test('validates inventory still available', () => {
    // Given quote for 100 pcs
    // When inventory now only 50 pcs
    // Then alert raised, partial fulfillment offered
  });
  
  test('creates complete order record', () => {
    // Given quote converted
    // Then order has all line items
    // And promise dates preserved
    // And pricing locked
  });
});
```

---

## N) Rollout & Go/No-Go Criteria

### N.1 Pilot Scope

**Phase 1: Single Branch Pilot**
- Detroit branch only
- 3 sales reps
- 2 CSRs
- 1 sales manager
- Duration: 4 weeks

**Phase 2: Regional Expansion**
- Michigan region (3 branches)
- Full sales teams
- Duration: 4 weeks

**Phase 3: Full Rollout**
- All branches
- All users
- Retire legacy quoting

### N.2 Baseline Metrics (Pre-Pilot)

Capture before pilot launch:
- Current RFQ response time (manual measurement)
- Current win rate (CRM data)
- Current average margin (finance report)
- Current promise date accuracy (delivery data)
- Current override frequency (manual tracking)

### N.3 Success Thresholds

| Metric | Baseline | Minimum | Target | Stretch |
|--------|----------|---------|--------|---------|
| RFQ Response Time | 8 hours | 4 hours | 2 hours | 1 hour |
| Quote Win Rate | 28% | 30% | 35% | 40% |
| Average Margin | 19% | 20% | 22% | 25% |
| Promise Accuracy | 82% | 90% | 95% | 98% |
| User Satisfaction | N/A | 3.5/5 | 4.0/5 | 4.5/5 |

### N.4 Go/No-Go Decision Points

**Week 2 Checkpoint:**
- System stability verified
- No critical bugs
- Users completing training
- Data quality acceptable
- Go/No-Go: Continue pilot or pause for fixes

**Week 4 Checkpoint:**
- Minimum thresholds met for 3+ metrics
- No regressions on any metric
- User adoption >80%
- Go/No-Go: Proceed to Phase 2 or extend pilot

**Phase 2 End Checkpoint:**
- Target thresholds met for 3+ metrics
- Regional consistency verified
- Integration stable
- Go/No-Go: Full rollout or phased expansion

### N.5 Rollback Plan

If critical issues arise:
1. Disable new quoting UI
2. Re-enable legacy quoting system
3. Preserve all quotes in new system
4. Manual migration if needed
5. Post-mortem and fix cycle
6. Re-pilot when ready

---

## UI Pages Specification

### Pages to Implement

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 1 | RFQInbox | /sales/rfq-inbox | RFQ queue with status tabs |
| 2 | QuoteBuilder | /sales/quote/:id | Full quote creation/editing |
| 3 | PricingExplainer | (component) | Price breakdown modal |
| 4 | QuoteComparison | /sales/quote/:id/compare | Compare quote versions |
| 5 | SalesDashboard | /sales/dashboard | KPIs and pipeline |
| 6 | CustomerQuotePortal | /portal/quotes | Customer quote view/accept |

---

## Data Model Summary

### Core Entities

```
RFQ
├── id, number, status, source
├── customerId, customerName
├── requestedDate, priority
├── lineItems[]
└── versions[], notes[]

Quote
├── id, number, version, status
├── rfqId, customerId
├── validUntil, sentAt, acceptedAt
├── lineItems[]
├── totals (subtotal, freight, tax, total)
├── margin (dollars, percent, category)
└── approvals[], versions[]

QuoteLineItem
├── id, quoteId, sequence
├── materialCode, description, dimensions
├── quantity, unit, weight
├── costs (material, processing, freight, total)
├── pricing (list, customer, quoted, extended)
├── margin (dollars, percent)
├── promiseDate, alternatives[]
└── overrides[]

PricingOverride
├── id, quoteLineItemId
├── originalPrice, overridePrice
├── reason, justification
├── requestedBy, approvedBy
├── status, timestamp
└── auditTrail[]
```

---

**End of Design Document**

---

Now implementing Segment 1: RFQInbox + QuoteBuilder pages.

