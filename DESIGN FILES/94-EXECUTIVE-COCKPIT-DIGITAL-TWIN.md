# 94 - Executive Ops Cockpit & Digital Twin

> **Module**: Executive Decision Support System  
> **Version**: 1.0  
> **Date**: 2026-02-04  
> **Status**: Design Complete

---

## A) Executive Philosophy & Objectives

### Why Executives Need a Single Source of Operational Truth

Traditional executive reporting suffers from:
- **Data fragmentation**: Sales, operations, finance, and logistics each have separate dashboards
- **Stale information**: Weekly/monthly reports miss real-time risks
- **Analysis paralysis**: Too many metrics without decision context
- **Reactive posture**: Executives learn about problems after damage occurs

The Executive Ops Cockpit provides:
- **Unified operational state**: One view across all business functions
- **Real-time situational awareness**: Current state with forward-looking risk indicators
- **Decision-ready insights**: Not just data, but recommended actions
- **Proactive risk surfacing**: Problems highlighted before they escalate

### Dashboards vs. Decision Systems

| Traditional Dashboard | Decision System |
|-----------------------|-----------------|
| Shows what happened | Shows what's happening + what will happen |
| Displays metrics | Interprets metrics in context |
| Requires analysis | Suggests actions |
| Static snapshots | Live, event-driven updates |
| Historical focus | Forward-looking with simulation |

### How Digital Twins Reduce Risk

A digital twin is a **live computational model** of the business that:
1. **Mirrors current state**: Inventory, capacity, orders, constraints
2. **Simulates scenarios**: "What if we accept this order? What if that machine goes down?"
3. **Predicts outcomes**: Forecasts service levels, margins, and risks
4. **Enables safe experimentation**: Test decisions before execution

**Risk reduction through:**
- Testing decisions in simulation before real-world execution
- Identifying constraint conflicts before they cause delays
- Quantifying trade-offs (speed vs. margin, capacity vs. maintenance)
- Surfacing hidden dependencies and bottlenecks

### Importance of Explainability and Trust

Executives will only trust the system if:
- **Every recommendation is explainable**: "Why is this flagged red?"
- **Data sources are transparent**: "Where does this number come from?"
- **Assumptions are visible**: "What's assumed in this forecast?"
- **Confidence is quantified**: "How certain is this prediction?"
- **No black boxes**: AI augments judgment, never replaces it

---

## B) Digital Twin Scope & Model

### What the Digital Twin Represents

The digital twin models the **complete operational state** of the service center network:

#### 1. Locations (Branches)
```
Location {
  id, code, name
  address, timezone
  operatingHours
  capabilities[]
  workCenters[]
  inventory[]
  workforce[]
  currentUtilization
  maintenanceSchedule
}
```

#### 2. Inventory State
```
InventoryState {
  locationId
  productCategory
  gradeForm
  onHandQty, onHandValue
  allocatedQty
  availableQty
  inTransitQty
  reorderPoint
  daysOfSupply
  exposureRisk (NORMAL | EXCESS | SHORTAGE)
}
```

#### 3. Work Centers & Capacity
```
WorkCenterState {
  id, code, name
  locationId
  type (SAW | SHEAR | PLASMA | LATHE | etc.)
  currentStatus (RUNNING | IDLE | MAINTENANCE | DOWN)
  currentJob
  queuedJobs[]
  utilizationPct
  availableCapacityHours
  scheduledMaintenanceWindow
  constraintFlags[]
}
```

#### 4. Workforce
```
WorkforceState {
  locationId
  shift
  presentCount
  absentCount
  certifiedOperators[]
  trainingGaps[]
  overtimeHours
}
```

#### 5. Logistics Lanes
```
LogisticsLane {
  originLocationId
  destinationZone
  carrier
  avgTransitDays
  currentDelayRisk
  costPerMile
  capacityAvailable
}
```

#### 6. Customer Commitments
```
CustomerCommitment {
  orderId
  customerId, customerName
  promisedDeliveryDate
  currentStatus
  riskLevel (ON_TRACK | AT_RISK | LATE)
  valueAtRisk
  constraintBlockers[]
}
```

#### 7. Financial Flows
```
FinancialState {
  period
  revenueBooked
  revenueForecast
  marginBooked
  marginForecast
  costExposure
  cashPosition
  dsoTrend
}
```

### Twin Characteristics

| Characteristic | Implementation |
|----------------|----------------|
| **Near Real-Time** | State updated every 1-5 minutes from operational systems |
| **Constraint-Aware** | Knows about capacity limits, maintenance windows, safety holds |
| **Event-Driven** | Reacts to orders, shipments, quality events, safety incidents |
| **Historical Replay** | Can reconstruct past states for analysis |
| **Simulation-Ready** | Can fork current state to run what-if scenarios |

---

## C) Core Executive Views (Cockpit)

### Cockpit Design Philosophy

The cockpit must be **understandable in under 60 seconds**:
- 7±2 primary tiles (cognitive limit)
- Red/Yellow/Green status at a glance
- Drill-down on demand
- Actions suggested, not just data displayed

### Primary Cockpit Tiles

#### Tile 1: Today's Risk Summary
```
RiskSummary {
  overallRiskScore: 0-100
  riskLevel: LOW | MEDIUM | HIGH | CRITICAL
  topRisks: [
    { category, description, impact, suggestedAction }
  ]
  trendsVsYesterday: IMPROVING | STABLE | DEGRADING
}
```
- **Status**: Overall risk score with color coding
- **Trend**: Arrow showing direction vs. yesterday
- **Drill-down**: Risk breakdown by category
- **Actions**: Top 3 recommended mitigations

#### Tile 2: Service Commitments (On-Time Risk)
```
ServiceCommitments {
  ordersShippingToday: count
  onTrackPct: percentage
  atRiskCount: count
  lateCount: count
  valueAtRisk: dollarAmount
  topDelayReasons: [{ reason, count }]
}
```
- **Status**: Green if >95% on-track, Yellow if 90-95%, Red if <90%
- **Trend**: Comparison to 7-day average
- **Drill-down**: List of at-risk orders with blockers
- **Actions**: Expedite suggestions, customer communication prompts

#### Tile 3: Capacity Utilization
```
CapacityUtilization {
  overallUtilizationPct: percentage
  byLocation: [{ locationCode, utilizationPct, bottleneck }]
  constrainedWorkCenters: count
  idleCapacityHours: hours
  overtimeScheduled: hours
}
```
- **Status**: Green if 70-85%, Yellow if outside range, Red if >95% or <50%
- **Trend**: Weekly utilization trend
- **Drill-down**: Work center heat map
- **Actions**: Rebalancing suggestions, overtime recommendations

#### Tile 4: Inventory Exposure
```
InventoryExposure {
  totalInventoryValue: dollarAmount
  excessInventoryValue: dollarAmount
  shortageRiskItems: count
  slowMovingPct: percentage
  daysOfCoverageAvg: days
}
```
- **Status**: Based on excess % and shortage risk
- **Trend**: Inventory turn trend
- **Drill-down**: Excess/shortage detail by category
- **Actions**: Markdown suggestions, reorder alerts

#### Tile 5: Safety & Quality Status
```
SafetyQualityStatus {
  openSafetyIncidents: count
  stopWorkOrders: count
  openNCRs: count
  customerClaimsOpen: count
  qualityHolds: count
  daysSinceLastIncident: days
}
```
- **Status**: Red if any stop-work, Yellow if open incidents >0
- **Trend**: Trailing 30-day incident rate
- **Drill-down**: Incident and NCR details
- **Actions**: Required approvals, escalation reminders

#### Tile 6: Margin & Cash Impact
```
MarginCashStatus {
  mtdMarginPct: percentage
  marginVsTarget: variance
  mtdRevenue: dollarAmount
  cashPosition: dollarAmount
  arOverdue: dollarAmount
  marginAtRisk: dollarAmount
}
```
- **Status**: Based on margin vs. target
- **Trend**: Margin trend vs. prior month
- **Drill-down**: Margin by customer/product
- **Actions**: Pricing recommendations, collection priorities

#### Tile 7: Exceptions Requiring Approval
```
PendingApprovals {
  pricingOverrides: count
  creditExceptions: count
  maintenanceDefers: count
  qualityWaivers: count
  largeOrderApprovals: count
  totalPending: count
  oldestAge: hours
}
```
- **Status**: Red if approvals >24 hours old
- **Trend**: Approval throughput rate
- **Drill-down**: Approval queue with priority
- **Actions**: Approve/reject interface

---

## D) Simulation Engine Design

### Simulation Philosophy

The simulation engine allows executives to **test decisions before execution**:
- No changes to real data
- Clear "what-if" labeling
- Side-by-side comparison with current state
- Explainable outcomes

### Simulation Inputs

#### 1. Demand Changes
```
DemandChange {
  type: ADD_ORDER | REMOVE_ORDER | MODIFY_ORDER
  orderId?: string
  productCategory?: string
  quantity?: number
  requiredDate?: date
}
```

#### 2. Pricing Changes
```
PricingChange {
  type: DISCOUNT | PREMIUM | MARGIN_FLOOR_ADJUST
  scope: CUSTOMER | PRODUCT | GLOBAL
  adjustmentPct: number
  effectiveDate: date
}
```

#### 3. Capacity Changes
```
CapacityChange {
  type: ADD_SHIFT | REMOVE_SHIFT | ADD_EQUIPMENT | MAINTENANCE
  locationId: string
  workCenterId?: string
  durationHours: number
  effectiveDate: date
}
```

#### 4. Maintenance Events
```
MaintenanceEvent {
  assetId: string
  type: PLANNED | UNPLANNED
  durationHours: number
  startDate: date
}
```

#### 5. Logistics Disruptions
```
LogisticsDisruption {
  type: CARRIER_DELAY | LANE_CLOSURE | CAPACITY_CONSTRAINT
  affectedLanes: string[]
  impactDays: number
  startDate: date
}
```

#### 6. Safety/Quality Events
```
SafetyQualityEvent {
  type: STOP_WORK | QUALITY_HOLD | RECALL
  scope: WORK_CENTER | LOCATION | PRODUCT
  affectedId: string
  durationHours: number
}
```

### Simulation Outputs

```
SimulationResult {
  scenarioId: string
  scenarioName: string
  runAt: timestamp
  
  baselineState: {
    onTimePct: percentage
    marginPct: percentage
    utilizationPct: percentage
    backlogDays: number
    riskScore: number
  }
  
  simulatedState: {
    onTimePct: percentage
    marginPct: percentage
    utilizationPct: percentage
    backlogDays: number
    riskScore: number
  }
  
  deltas: {
    onTimeDelta: percentage
    marginDelta: percentage
    utilizationDelta: percentage
    backlogDelta: days
    riskDelta: number
  }
  
  impactedOrders: [{ orderId, originalDate, simulatedDate, delay }]
  impactedWorkCenters: [{ workCenterId, baselineUtil, simulatedUtil }]
  financialImpact: {
    revenueImpact: dollarAmount
    marginImpact: dollarAmount
    costImpact: dollarAmount
  }
  
  tradeOffs: [{ description, proScore, conScore }]
  recommendation: string
  confidenceScore: 0-100
  assumptions: string[]
}
```

### Simulation Modes

1. **Single-Change Simulation**: Test one variable at a time
2. **Multi-Variable Scenario**: Combine multiple changes
3. **Side-by-Side Comparison**: Compare up to 4 scenarios simultaneously
4. **Sensitivity Analysis**: Vary one input across a range

---

## E) Forecasting Models

### Forecast Types

#### 1. Demand Forecast
```
DemandForecast {
  period: date
  productCategory: string
  locationId: string
  forecastQty: number
  forecastRevenue: dollarAmount
  confidenceLow: number (10th percentile)
  confidenceMid: number (50th percentile)
  confidenceHigh: number (90th percentile)
  drivers: [{ factor, contribution }]
}
```

#### 2. Capacity Forecast
```
CapacityForecast {
  period: date
  locationId: string
  workCenterId?: string
  availableHours: number
  plannedHours: number
  utilizationForecast: percentage
  constraintRisk: LOW | MEDIUM | HIGH
  maintenanceWindows: [{ start, end }]
}
```

#### 3. Inventory Forecast
```
InventoryForecast {
  period: date
  productCategory: string
  locationId: string
  forecastOnHand: number
  forecastValue: dollarAmount
  stockoutRisk: percentage
  excessRisk: percentage
  reorderTrigger: boolean
}
```

#### 4. Margin Forecast
```
MarginForecast {
  period: date
  forecastRevenue: dollarAmount
  forecastCost: dollarAmount
  forecastMargin: dollarAmount
  forecastMarginPct: percentage
  vsTarget: variance
  confidenceBand: { low, mid, high }
  risks: [{ description, marginImpact }]
}
```

#### 5. Cash Flow Forecast
```
CashForecast {
  period: date
  inflows: dollarAmount
  outflows: dollarAmount
  netCashFlow: dollarAmount
  endingPosition: dollarAmount
  collectionRisk: dollarAmount
  payablesCommitments: dollarAmount
}
```

### Forecast Horizons

| Horizon | Granularity | Update Frequency | Confidence |
|---------|-------------|------------------|------------|
| Short-term (1-14 days) | Daily | Real-time | High (±10%) |
| Mid-term (1-3 months) | Weekly | Daily | Medium (±20%) |
| Long-term (3-12 months) | Monthly | Weekly | Low (±35%) |

### Confidence Bands

All forecasts include:
- **P10 (Pessimistic)**: 10th percentile outcome
- **P50 (Expected)**: Median expected outcome
- **P90 (Optimistic)**: 90th percentile outcome
- **Key Assumptions**: Listed explicitly
- **Sensitivity Factors**: What could change the forecast

---

## F) Decision Scenarios (Use Cases)

### Scenario 1: Accept/Reject Large RFQ

**Context**: Customer submits $500K RFQ with tight deadline

**Inputs**:
- RFQ details: 50,000 lbs 4140 round bar, 14-day delivery
- Current capacity: 78% utilized
- Inventory: 35,000 lbs on hand, 20,000 lbs in transit

**Simulation**:
- Fork current state
- Add order to schedule
- Recalculate capacity utilization
- Check impact on existing commitments

**Outputs**:
| Metric | Baseline | If Accept | Delta |
|--------|----------|-----------|-------|
| Capacity Utilization | 78% | 94% | +16% |
| On-Time Delivery | 96% | 88% | -8% |
| Margin | 22% | 21% | -1% |
| Revenue | $2.1M | $2.6M | +$500K |

**Trade-offs**:
- Pro: $500K revenue, strategic customer relationship
- Con: 3 existing orders may slip, overtime required

**Recommendation**: Accept with conditions (negotiate +2 days lead time OR authorize overtime)

---

### Scenario 2: Shift Production Between Branches

**Context**: Detroit branch overloaded, Cleveland has idle capacity

**Inputs**:
- Transfer 5 jobs (12,000 lbs total)
- Transfer adds 1 day transit
- Cleveland labor rate 8% lower

**Simulation**:
| Metric | Detroit Only | Split | Delta |
|--------|--------------|-------|-------|
| Detroit Utilization | 97% | 82% | -15% |
| Cleveland Utilization | 58% | 72% | +14% |
| On-Time Risk | 4 orders | 0 orders | -4 |
| Freight Cost | $0 | +$1,200 | +$1,200 |
| Labor Savings | $0 | -$850 | -$850 |

**Recommendation**: Transfer 3 highest-risk jobs (net cost: $350, risk reduction: significant)

---

### Scenario 3: Adjust Pricing Strategy

**Context**: Competitor dropped prices 5%, considering response

**Inputs**:
- Match competitor: -5% across carbon steel
- Current margin: 23%
- Estimated volume elasticity: +8% volume per -5% price

**Simulation**:
| Metric | Current | Match Price | Delta |
|--------|---------|-------------|-------|
| Volume | 100% | 108% | +8% |
| Revenue | $2.1M | $2.16M | +$60K |
| Margin % | 23% | 18.5% | -4.5% |
| Margin $ | $483K | $400K | -$83K |

**Recommendation**: Do not match. Target selective discounts to at-risk accounts only.

---

### Scenario 4: Delay Maintenance vs. Service Risk

**Context**: Plasma cutter PM due, but schedule is tight

**Inputs**:
- PM window: 8 hours
- Current queue: 6 jobs dependent on plasma
- Defer option: Push PM by 1 week

**Simulation**:
| Metric | Do PM Now | Defer 1 Week |
|--------|-----------|--------------|
| On-Time (this week) | 94% | 100% |
| Breakdown Risk | 2% | 8% |
| If Breakdown Occurs | -16 hours, $45K impact | Same |
| Expected Cost | $900 | $3,600 |

**Recommendation**: Do PM now. Expected cost of deferral exceeds schedule recovery value.

---

### Scenario 5: Consolidate Freight Lanes

**Context**: Reviewing LTL spend, considering consolidation

**Inputs**:
- Current: Ship daily to Zone 5 (avg 800 lbs/day)
- Proposal: Consolidate to MWF shipments

**Simulation**:
| Metric | Daily | MWF Consolidated |
|--------|-------|------------------|
| Freight Cost | $4,800/wk | $3,200/wk |
| Avg Delivery Time | 2 days | 3.5 days |
| Customer Impact | None | 4 accounts affected |

**Recommendation**: Consolidate, but notify affected customers and offer expedite option.

---

### Scenario 6: Respond to Supplier Disruption

**Context**: Primary aluminum supplier announces 2-week shutdown

**Inputs**:
- Affected SKUs: 12 grades
- Current inventory: 3 weeks coverage
- Alternate supplier: +12% cost, 5-day lead time

**Simulation**:
| Metric | Do Nothing | Pre-Buy | Alternate |
|--------|------------|---------|-----------|
| Stockout Risk | HIGH (Week 4) | LOW | LOW |
| Inventory Carrying | - | +$45K | - |
| Material Cost | - | - | +$28K |
| Customer Impact | 8 orders at risk | None | None |

**Recommendation**: Split strategy - pre-buy 2 weeks from primary, qualify alternate for overflow.

---

## G) AI Executive Assistant

### Assistant Capabilities

#### Natural Language Queries
```
User: "Why is Detroit capacity showing red?"
Assistant: "Detroit is at 97% utilization, above the 90% threshold.
  - Root cause: 3 large orders added yesterday totaling 18,000 lbs
  - Contributing: SAW-01 running 12% slower than rated (maintenance flag)
  - Impact: 2 orders at risk of missing ship date
  - Suggested: Transfer ORD-2026-4521 to Cleveland (saves 6 hours)"
```

#### Risk Summarization
```
User: "Give me today's risk summary"
Assistant: "Overall risk is MEDIUM (62/100), up from 55 yesterday.
  Top 3 risks:
  1. Capacity: Detroit at 97%, 2 orders at risk ($45K value)
  2. Inventory: 4140 round stock below reorder point, 4-day coverage
  3. Quality: NCR-2026-089 pending review, affects 3 pending shipments
  
  Recommended actions:
  1. Approve inter-branch transfer for Detroit relief
  2. Expedite 4140 PO with supplier
  3. Review NCR disposition by 2pm to unblock shipments"
```

#### Simulation Execution
```
User: "What happens if we accept the Midwest Auto RFQ?"
Assistant: "Running simulation... [3 seconds]
  
  Accepting the $285K RFQ would:
  - Increase Detroit utilization from 78% to 91%
  - Delay 1 existing order (Pacific Steel) by 2 days
  - Add $58K in margin contribution
  - Require 16 hours overtime ($2,400)
  
  Net impact: +$55.6K margin, 1 order slip risk
  
  Recommendation: Accept, but communicate proactively with Pacific Steel
  and authorize Saturday overtime.
  
  Confidence: 85% (based on current schedule accuracy)"
```

#### Board Summary Generation
```
User: "Prepare a board summary for Q4"
Assistant: "Generating Q4 Executive Summary...

  PERFORMANCE HIGHLIGHTS:
  - Revenue: $12.4M (+8% vs Q3, +12% vs Q4 LY)
  - Margin: 22.3% (vs 21.8% target)
  - On-Time: 96.2% (best quarter in 2 years)
  - Safety: 0 recordables (142 days)
  
  KEY ACHIEVEMENTS:
  - Launched 3 new processing capabilities
  - Reduced inventory days from 45 to 38
  - Won 3 new strategic accounts ($2.1M annual)
  
  CHALLENGES & MITIGATIONS:
  - Q4 capacity constraints managed via inter-branch transfers
  - Aluminum supply disruption handled with alternate sourcing
  
  OUTLOOK:
  - Q1 forecast: $13.1M (+5.6%)
  - Capacity expansion approved for Detroit (online Q2)
  
  [Exportable as PDF with charts]"
```

### Guardrails

1. **No Autonomous Execution**: Assistant suggests, never executes
2. **Data Source Citation**: Every metric includes source reference
3. **Uncertainty Escalation**: When confidence <70%, explicitly states uncertainty
4. **Audit Trail**: All assistant interactions logged
5. **Human Override**: All recommendations can be dismissed with reason

---

## H) UI / UX Design (Material UI)

### Design Principles

1. **60-Second Rule**: Executive must understand state in 60 seconds
2. **Visual Hierarchy**: Critical items prominent, details on demand
3. **Progressive Disclosure**: Summary → Detail → Data
4. **Action-Oriented**: Every view suggests next steps
5. **Responsive**: Works on desktop, tablet, large displays

### Page 1: Executive Cockpit

**Layout**: 7-tile grid with summary header

```
┌──────────────────────────────────────────────────────────────┐
│  EXECUTIVE OPS COCKPIT           Today: Feb 4, 2026 2:34 PM │
│  Overall Status: ● MEDIUM RISK (62)    ↑ from 55 yesterday   │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│ │ TODAY'S RISK│ │ SERVICE     │ │ CAPACITY    │ │ INVENTORY│ │
│ │ ● 62/100    │ │ 96% On-Time │ │ 78% Util    │ │ $4.2M    │ │
│ │ ↑ +7        │ │ 4 at risk   │ │ 2 constrain │ │ 8% excess│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│ │ SAFETY/QUAL │ │ MARGIN      │ │ APPROVALS   │   [ASK AI]  │
│ │ ● 0 stops   │ │ 22.1%       │ │ 5 pending   │              │
│ │ 2 NCRs open │ │ ↑ vs target │ │ oldest: 4hr │              │
│ └─────────────┘ └─────────────┘ └─────────────┘              │
├──────────────────────────────────────────────────────────────┤
│ TOP RISKS                          SUGGESTED ACTIONS         │
│ 1. Detroit capacity 97%            → Transfer 2 jobs to CLE  │
│ 2. 4140 stock below reorder        → Expedite PO-2026-1234   │
│ 3. NCR blocking 3 shipments        → Review by 2pm           │
└──────────────────────────────────────────────────────────────┘
```

### Page 2: Simulation Workspace

**Layout**: Input panel + results comparison

```
┌──────────────────────────────────────────────────────────────┐
│  SIMULATION WORKSPACE                    [Save] [Compare]    │
├──────────────────────────────────────────────────────────────┤
│ SCENARIO SETUP                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [+Add Demand Change] [+Add Capacity Change] [+Add...]  │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ 1. Add Order: Midwest Auto, 25,000 lbs 4140, 14 days   │   │
│ │ 2. Maintenance: SAW-01 Detroit, 8 hours, Feb 6         │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ [RUN SIMULATION]                                             │
├──────────────────────────────────────────────────────────────┤
│ RESULTS                                                      │
│ ┌─────────────────────┬─────────────────────┬─────────────┐  │
│ │ Metric              │ Current State       │ Simulated   │  │
│ ├─────────────────────┼─────────────────────┼─────────────┤  │
│ │ Capacity Util       │ 78%                 │ 91% (+13%)  │  │
│ │ On-Time Delivery    │ 96%                 │ 92% (-4%)   │  │
│ │ Margin              │ 22.1%               │ 21.8%(-0.3%)│  │
│ │ Orders at Risk      │ 2                   │ 5 (+3)      │  │
│ │ Overtime Required   │ 0 hrs               │ 16 hrs      │  │
│ └─────────────────────┴─────────────────────┴─────────────┘  │
│                                                              │
│ RECOMMENDATION: Accept with conditions (see details)        │
│ Confidence: 85%                                              │
└──────────────────────────────────────────────────────────────┘
```

### Page 3: Forecast Explorer

**Layout**: Time-series charts with confidence bands

```
┌──────────────────────────────────────────────────────────────┐
│  FORECAST EXPLORER          [Demand] [Capacity] [Margin]    │
│                             Horizon: [1W] [1M] [3M] [12M]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  DEMAND FORECAST - Carbon Steel                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │     ████████████████████                               │  │
│  │   ██████████████████████████  ← P90 (Optimistic)       │  │
│  │  ████████████████████████████████                      │  │
│  │ ██████████████████████████████████  ← P50 (Expected)   │  │
│  │████████████████████████████████████                    │  │
│  │██████████████████████████████  ← P10 (Pessimistic)     │  │
│  └────────────────────────────────────────────────────────┘  │
│   Feb     Mar     Apr     May     Jun     Jul               │
│                                                              │
│ KEY ASSUMPTIONS:                                             │
│ • Midwest Auto contract renewal (+8% demand Q2)              │
│ • Seasonal construction uptick (+12% Q2-Q3)                  │
│ • No major economic downturn                                 │
│                                                              │
│ SENSITIVITY:                                                 │
│ • If Midwest Auto churns: -$180K/month                       │
│ • If construction delays: -$120K Q2                          │
└──────────────────────────────────────────────────────────────┘
```

### Page 4: Decision Log

**Layout**: Chronological decision audit trail

```
┌──────────────────────────────────────────────────────────────┐
│  DECISION LOG              [Filter by Type] [Date Range]    │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Feb 4, 2026 10:23 AM                        [Details]  │   │
│ │ SIMULATION: Accept Midwest Auto RFQ                    │   │
│ │ Decision: APPROVED by J. Smith (COO)                   │   │
│ │ Outcome: Order accepted with 2-day extension           │   │
│ │ Actual vs Predicted: 94% accuracy                      │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ Feb 3, 2026 3:45 PM                         [Details]  │   │
│ │ PRICING: Override approved for Pacific Steel           │   │
│ │ Decision: APPROVED by M. Johnson (VP Sales)            │   │
│ │ Margin impact: -2.3% on $45K order                     │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ Feb 2, 2026 9:15 AM                         [Details]  │   │
│ │ TRANSFER: Detroit → Cleveland production shift         │   │
│ │ Decision: EXECUTED per simulation recommendation       │   │
│ │ Result: 3 orders saved from delay, $1,100 freight cost │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Page 5: Strategy Timeline

**Layout**: Gantt-style strategic initiative tracker

```
┌──────────────────────────────────────────────────────────────┐
│  STRATEGY TIMELINE                     2026 Q1  Q2  Q3  Q4  │
├──────────────────────────────────────────────────────────────┤
│ CAPACITY EXPANSION                                           │
│ ├─ Detroit plasma upgrade        [████████░░░░]              │
│ ├─ Cleveland saw addition        [░░░░████████████░░░░]      │
│ └─ New Toledo branch             [░░░░░░░░░░░░████████████]  │
│                                                              │
│ SYSTEM INITIATIVES                                           │
│ ├─ Digital twin go-live          [████░░░░]                  │
│ ├─ Customer portal v2            [░░████████░░░░]            │
│ └─ AI pricing rollout            [░░░░░░████████████░░]      │
│                                                              │
│ MARKET INITIATIVES                                           │
│ ├─ West coast expansion          [░░░░░░░░████████████████]  │
│ └─ Plastics division launch      [░░░░░░░░░░░░░░██████████]  │
│                                                              │
│ MILESTONES                                                   │
│ • Q1: Detroit plasma online                                  │
│ • Q2: Customer portal v2 launch                              │
│ • Q3: AI pricing full rollout                                │
│ • Q4: Toledo branch opening                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## I) Roles & Permissions

### Role Matrix

| Role | View Cockpit | Run Simulations | Approve Decisions | View Financials | Configure |
|------|--------------|-----------------|-------------------|-----------------|-----------|
| CEO / President | ✅ | ✅ | ✅ (all) | ✅ (full) | ✅ |
| COO | ✅ | ✅ | ✅ (operations) | ✅ (cost) | ✅ |
| CFO | ✅ | ✅ | ✅ (financial) | ✅ (full) | ✅ |
| CIO | ✅ | ✅ | ✅ (systems) | ✅ (cost) | ✅ |
| VP Sales | ✅ | ✅ | ✅ (pricing) | ✅ (margin) | ❌ |
| VP Operations | ✅ | ✅ | ✅ (capacity) | ✅ (cost) | ❌ |
| Division Director | ✅ (division) | ✅ (division) | ✅ (division) | ✅ (division) | ❌ |
| Board | ✅ (read-only) | ❌ | ❌ | ✅ (summary) | ❌ |

### Permission Details

**Simulation Permissions**:
- All execs can run simulations
- Board members view simulation results only (cannot create)
- Simulation history retained 90 days

**Approval Permissions**:
- CEO: All approval types
- COO: Operations, capacity, maintenance, transfers
- CFO: Pricing overrides, credit exceptions, capital
- VP Sales: Pricing within margin floor
- Division Director: Within division scope only

**Financial View Levels**:
- Full: All P&L, cash, AR/AP, customer-level margin
- Cost: Operational costs, no customer margin detail
- Margin: Product/customer margin, no cash position
- Summary: Aggregate metrics only

---

## J) APIs & Eventing

### REST Endpoints

#### Cockpit State
```
GET /api/executive/cockpit
Response: {
  timestamp: ISO8601,
  overallRiskScore: number,
  riskLevel: string,
  tiles: {
    risk: RiskSummary,
    service: ServiceCommitments,
    capacity: CapacityUtilization,
    inventory: InventoryExposure,
    safetyQuality: SafetyQualityStatus,
    margin: MarginCashStatus,
    approvals: PendingApprovals
  },
  topRisks: Risk[],
  suggestedActions: Action[]
}
```

#### Simulation
```
POST /api/executive/simulation/run
Body: {
  scenarioName: string,
  changes: SimulationInput[]
}
Response: SimulationResult

GET /api/executive/simulation/:id
Response: SimulationResult

GET /api/executive/simulation/history
Response: SimulationResult[]
```

#### Forecasts
```
GET /api/executive/forecast
Query: { type: string, horizon: string, scope: string }
Response: Forecast[]

GET /api/executive/forecast/demand
GET /api/executive/forecast/capacity
GET /api/executive/forecast/margin
```

#### Decision Log
```
GET /api/executive/decisions
Query: { startDate, endDate, type, status }
Response: Decision[]

POST /api/executive/decisions/:id/approve
POST /api/executive/decisions/:id/reject
```

#### AI Assistant
```
POST /api/executive/assistant/query
Body: { question: string, context?: object }
Response: {
  answer: string,
  sources: DataSource[],
  confidence: number,
  suggestedActions: Action[]
}
```

### Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `cockpit.risk.elevated` | Risk score crosses threshold | { previousScore, newScore, topRisk } |
| `simulation.executed` | Simulation completed | { scenarioId, userId, summary } |
| `simulation.approved` | Scenario approved for execution | { scenarioId, approvedBy } |
| `forecast.updated` | Forecast model refreshed | { forecastType, period, changes } |
| `decision.pending` | New approval required | { decisionType, urgency, value } |
| `decision.approved` | Decision approved | { decisionId, approvedBy, timestamp } |
| `decision.expired` | Decision not acted on in time | { decisionId, age } |

---

## K) Analytics & KPIs

### Primary Executive KPIs

#### 1. On-Time Delivery Forecast
- **Definition**: Predicted % of orders shipping on time in next 7 days
- **Target**: ≥95%
- **Red/Yellow/Green**: <90% / 90-95% / ≥95%
- **Drill-down**: By location, customer, product category

#### 2. Capacity Risk Index
- **Definition**: Weighted score of utilization vs. constraints
- **Formula**: `(Utilization% × ConstraintFactor × UrgencyWeight)`
- **Target**: 70-85% utilization with no constraints
- **Red/Yellow/Green**: >95% or <50% / 85-95% or 50-70% / 70-85%

#### 3. Inventory Exposure
- **Definition**: Value of inventory at risk (excess + shortage risk)
- **Formula**: `ExcessValue + (ShortageRisk × AvgDailySales × StockoutDays)`
- **Target**: <5% of total inventory value
- **Drill-down**: By category, location, age

#### 4. Margin at Risk
- **Definition**: Revenue in pipeline with margin below target
- **Formula**: `Sum(OrderValue where MarginPct < TargetMarginPct)`
- **Target**: <10% of pipeline
- **Drill-down**: By customer, product, quote status

#### 5. Safety/Quality Risk Score
- **Definition**: Composite score of incident indicators
- **Components**: Open incidents, NCRs, stop-work orders, claims
- **Target**: 0 for critical, <5 for total score
- **Red/Yellow/Green**: Any stop-work / Open NCRs / All clear

### Trend Metrics

- **7-Day Rolling On-Time**: Actual delivery performance trend
- **Utilization Trend**: Capacity utilization over 30 days
- **Margin Trend**: Gross margin % over 12 weeks
- **RFQ Win Rate**: Quote conversion rate over 30 days
- **Cash Conversion Cycle**: DSO + DIO - DPO trend

---

## L) Audit & Controls

### Decision Audit Trail

Every executive decision is logged with:
```
DecisionAuditRecord {
  id: uuid
  timestamp: ISO8601
  decisionType: SIMULATION_APPROVAL | PRICING_OVERRIDE | CAPACITY_CHANGE | ...
  userId: string
  userName: string
  role: string
  
  context: {
    scenarioId?: string
    orderId?: string
    customerId?: string
    originalValue?: any
    newValue?: any
  }
  
  rationale: string
  outcome: APPROVED | REJECTED | DEFERRED
  
  simulationReference?: string
  forecastReference?: string
  dataSnapshot: object  // State at decision time
}
```

### Scenario Traceability

Each simulation maintains:
- Complete input specification
- State snapshot at simulation time
- All assumptions made
- Model version used
- Confidence calculation breakdown

### Data Lineage

Every metric displays:
- Source system (OrderHub, Inventory, Production, etc.)
- Last update timestamp
- Calculation method
- Aggregation level

### Board Review Evidence

For board meetings:
- Exportable decision summaries
- Simulation histories with outcomes
- Forecast accuracy reports
- Trend analyses with confidence bands
- PDF generation for offline review

---

## M) Testing & Validation

### Simulation Accuracy Testing

| Test | Method | Success Criteria |
|------|--------|------------------|
| Capacity impact | Run simulation → Execute → Compare actual | Within 10% of predicted |
| Service impact | Predict delays → Track actual | 85% prediction accuracy |
| Margin impact | Simulate pricing → Measure actual margin | Within 5% of predicted |
| Multi-variable | Complex scenarios | Each variable contributes as expected |

### Forecast Consistency Testing

| Test | Method | Success Criteria |
|------|--------|------------------|
| Demand forecast | Compare P50 to actuals | 70% within P10-P90 band |
| Capacity forecast | Predict utilization → Measure | Within 15% variance |
| Margin forecast | Monthly prediction vs actual | Within 3% margin points |
| Cash forecast | Weekly prediction vs actual | Within 10% variance |

### Permission Enforcement Testing

| Test | Scenario | Expected Result |
|------|----------|-----------------|
| Role restriction | Board user runs simulation | Blocked with message |
| Scope restriction | Division user views other division | Data filtered |
| Approval routing | VP approves above threshold | Escalated to CEO |
| Audit capture | Any decision made | Record created |

### Performance Testing

| Metric | Target | Test Method |
|--------|--------|-------------|
| Cockpit load time | <2 seconds | Lighthouse, load testing |
| Simulation runtime | <10 seconds | Complex scenario benchmark |
| Forecast generation | <30 seconds | Full horizon generation |
| Concurrent users | 50 executives | Load test with realistic mix |

---

## N) Rollout & Go/No-Go Criteria

### Pilot Group

**Phase 1 (Week 1-2)**: Core executives
- CEO, COO, CFO
- 1 Division Director
- Focus: Cockpit usability, data accuracy

**Phase 2 (Week 3-4)**: Extended leadership
- Add VP Sales, VP Operations, CIO
- Focus: Simulation validation, forecast accuracy

**Phase 3 (Week 5-8)**: Full rollout
- All division directors
- Board access (read-only)
- Focus: Adoption, feedback integration

### Training Approach

1. **Executive briefing** (30 min): Philosophy, capabilities, guardrails
2. **Hands-on workshop** (2 hours): Cockpit navigation, simulation creation
3. **AI assistant training** (1 hour): Natural language queries, best practices
4. **Decision workflow** (1 hour): Approval routing, audit expectations

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active users | 80% of pilot group | Login tracking |
| Simulation usage | 10+ per week | Usage analytics |
| Decision time reduction | 50% faster | Before/after comparison |
| Forecast accuracy | P50 within 20% of actual | Quarterly review |
| User satisfaction | 4.0/5.0 | Survey |

### Go/No-Go Thresholds

**GO Criteria** (all must be met):
- [ ] Data accuracy >95% vs. source systems
- [ ] Simulation runtime <10 seconds for standard scenarios
- [ ] No critical bugs open
- [ ] User satisfaction ≥3.5/5.0
- [ ] 70% of pilot group using daily

**NO-GO Criteria** (any blocks launch):
- [ ] Data accuracy <90%
- [ ] Simulation errors >5% of runs
- [ ] Security vulnerability open
- [ ] User satisfaction <3.0/5.0
- [ ] Performance degradation under load

---

## UI Pages to Implement

### Page List

1. **ExecutiveCockpit.jsx** - Main 7-tile dashboard with risk summary
2. **SimulationWorkspace.jsx** - Scenario builder and comparison
3. **ForecastExplorer.jsx** - Time-series forecasts with confidence bands
4. **DecisionLog.jsx** - Audit trail of executive decisions
5. **DigitalTwinViewer.jsx** - Visual representation of operational state

### Component Hierarchy

```
ExecutiveModule/
├── ExecutiveCockpit.jsx
│   ├── RiskSummaryTile.jsx
│   ├── ServiceCommitmentsTile.jsx
│   ├── CapacityTile.jsx
│   ├── InventoryTile.jsx
│   ├── SafetyQualityTile.jsx
│   ├── MarginTile.jsx
│   ├── ApprovalsTile.jsx
│   ├── TopRisksList.jsx
│   └── AIAssistantPanel.jsx
├── SimulationWorkspace.jsx
│   ├── ScenarioBuilder.jsx
│   ├── SimulationResults.jsx
│   └── ComparisonTable.jsx
├── ForecastExplorer.jsx
│   ├── ForecastChart.jsx
│   └── AssumptionsPanel.jsx
├── DecisionLog.jsx
└── DigitalTwinViewer.jsx
```

---

*End of Design Document*
