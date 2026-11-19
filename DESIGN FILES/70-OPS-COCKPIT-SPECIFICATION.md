# Alro Ops Cockpit — 10× Specification

> **Status notice (2026-11-19, Phase 12 certification).** This document was written before or outside the engineering quality program. It is a design, sales or set-up document, not evidence that anything it describes is built, tested or approved for production. What is built and verified is in `qa/enterprise-excellence/phase-12-system-certification.md`; the production recommendation is in `qa/enterprise-excellence/phase-12-final-report.md`.

## Executive Summary

The Ops Cockpit is the command center for Alro plant and operations leadership. It transforms reactive firefighting into predictive, flow-centric facility management by surfacing bottlenecks, promise risk, and feasibility in real time, with AI-powered interventions and explainable recommendations.

---

## 1. Operational Narrative

### How the Plant Operates in Real Life

Alro operates as a **demand-responsive service center** across metals, plastics, and industrial products. The operational rhythm follows this pattern:

1. **Demand Signal Arrives**: RFQs flow in from portal, phone, EDI, or sales. Each carries urgency, specifications, and implicit trust expectations.

2. **Quote-to-Promise Cycle**: Sales/inside teams quote rapidly (often <2 hours for stock items, <24 hours for processing). The promise date becomes the SLA.

3. **Order Conversion**: Orders drop into the execution queue. Each order may require:
   - Stock pull only (distribution)
   - Single-operation processing (saw, shear, waterjet)
   - Multi-operation processing (saw → deburr → packout)
   - Mixed fulfillment (some stock, some processing)

4. **Scheduling & Sequencing**: Jobs are assigned to work centers based on:
   - Due date / promise priority
   - Material availability
   - Work center capacity and queue depth
   - Operator certification
   - Setup/changeover efficiency

5. **Execution**: Operators pull jobs, process material, record completions. Exceptions occur: scrap, rework, machine downtime, material issues.

6. **QC & Packaging**: Completed pieces flow to QC (if required), then packaging. Packaging configurations vary by customer and material type.

7. **Staging & Dispatch**: Packaged orders stage for pickup or delivery. Shipping cutoffs, carrier schedules, and dock capacity create constraints.

8. **Transfers**: Strategic material or capacity transfers between branches add complexity but enable network-level optimization.

### What "Flow" Means in This Context

**Flow** is the unimpeded movement of work from order entry to shipment. Good flow means:

- Jobs progress through statuses without stalling
- Work centers operate at sustainable utilization (70-85%)
- Queues are balanced, not concentrated
- Promises are met without expediting
- Exceptions are resolved before they cascade

**Flow Disruption** looks like:

- Jobs stuck in SCHEDULED status for >24 hours
- Work center queues exceeding 2 shifts of backlog
- Staging area congestion
- Hot jobs displacing normal work
- Transfer delays rippling through schedule

### Typical Sources of Friction

| Friction Source | Description | Impact |
|----------------|-------------|--------|
| **Material Availability** | Stock not available, wrong grade, remnant required | Delays order start, forces transfers |
| **Capacity Mismatch** | Certain work centers overloaded, others idle | Queue imbalance, overtime, missed promises |
| **Promise Compression** | Too many "hot" orders create false urgency | Everything urgent = nothing prioritized |
| **Coordination Overhead** | Phone calls to check status, find material, confirm transfers | Labor waste, delayed decisions |
| **Exception Handling** | Scrap, rework, QC holds, machine downtime | Unpredictable delays, re-scheduling chaos |
| **Staging Congestion** | Packaged orders wait for dispatch, consume floor space | Shipping delays, safety issues |
| **Transfer Uncertainty** | Inter-branch transfers with unknown ETAs | Schedule volatility, broken promises |
| **Mixed Division Interference** | Plastics and metals compete for shared resources | Packout/dock bottlenecks |

---

## 2. Panels & Surfaces

### 2.1 Flow State Visualization

**Purpose**: Show the real-time distribution and velocity of work across the value stream.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLOW STATE VISUALIZATION                         │
├──────────┬──────────┬────────────┬───────────┬─────────────┬───────────┤
│ ORDERED  │SCHEDULED │ IN PROCESS │ PACKAGING │ READY SHIP  │  SHIPPED  │
│   47     │    89    │     34     │    18     │     23      │    156    │
│   ██     │   ████   │    ██      │    █      │     █       │   █████   │
│ +8 today │ -12 flow │  +6 flow   │  +4 flow  │   -2 flow   │ +18 today │
└──────────┴──────────┴────────────┴───────────┴─────────────┴───────────┘
```

**Metrics per column**:
- Count of jobs
- Net flow rate (jobs entering - jobs exiting per hour)
- Age distribution (jobs in column >24h highlighted)
- Velocity trend (accelerating/decelerating)

**Interactions**:
- Click column → drill into jobs
- Drag job between columns → status update (with validation)
- Color intensity shows concentration risk

### 2.2 SLA/Promise Risk Panel

**Purpose**: Instantly identify which promises are at risk and why.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROMISE RISK DASHBOARD                          │
├─────────────────────────────────────────────────────────────────────────┤
│  🔴 HOT (5)           │ 🟠 AT-RISK (12)        │ 🟢 SAFE (127)          │
│  ──────────────────   │ ──────────────────     │ ──────────────────     │
│  JOB-2341 Metro Mfg   │ JOB-2298 ABC Steel     │ All other jobs on      │
│  Due: 2h 15m          │ Due: 6h (1 shift)      │ track for promise      │
│  Status: IN_PROCESS   │ Status: SCHEDULED      │                        │
│  Risk: Machine queue  │ Risk: Material hold    │ Avg slack: 14 hours    │
│  ───────────────────  │ ──────────────────     │                        │
│  JOB-2356 Steel Sol   │ JOB-2301 Precision     │                        │
│  Due: 45m 🔥          │ Due: 8h (capacity)     │                        │
│  Status: PACKAGING    │ ...                    │                        │
│  Risk: Dock backup    │                        │                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Risk Classification Logic**:
- **HOT**: Due within 4 hours AND not in final stages, OR flagged by customer/sales
- **AT-RISK**: Estimated completion > 80% of remaining time, OR has blocking dependency
- **SAFE**: Estimated completion < 60% of remaining time, no blockers

**Each job shows**:
- Job ID, customer
- Time remaining to promise
- Current status
- Primary risk factor
- Recommended action (from AI layer)

### 2.3 Bottleneck/Utilization Strip

**Purpose**: Identify capacity constraints and imbalances across work centers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORK CENTER UTILIZATION STRIP                        │
├─────────────────────────────────────────────────────────────────────────┤
│ SAW-1    ████████████████████░░░░  82%  │ Queue: 3.2 hrs │ ⚠️ Hot: 2   │
│ SAW-2    ██████████████░░░░░░░░░░  58%  │ Queue: 1.1 hrs │              │
│ SHEAR-1  ██████████████████████░░  92%  │ Queue: 4.8 hrs │ 🔴 BOTTLENECK│
│ WATERJET ████████████████░░░░░░░░  68%  │ Queue: 2.4 hrs │              │
│ ROUTER   ██████░░░░░░░░░░░░░░░░░░  28%  │ Queue: 0.3 hrs │ ⬇️ Under    │
│ DEBURR   ████████████████░░░░░░░░  72%  │ Queue: 1.8 hrs │              │
│ PACKOUT  ████████████████████████  98%  │ Queue: 5.1 hrs │ 🔴 BOTTLENECK│
│ STAGING  ████████████████████░░░░  84%  │ Units: 47      │ ⚠️ Filling  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Metrics**:
- Current utilization % (jobs in progress / capacity)
- Queue depth in hours
- Bottleneck flag when queue > 4 hours OR utilization > 90%
- Hot job count in queue
- Trend indicator (utilization increasing/decreasing)

**Color Coding**:
- Green: 50-80% utilization
- Yellow: 80-90% utilization OR queue > 3 hours
- Red: >90% utilization OR queue > 4 hours

### 2.4 Exception Feed

**Purpose**: Surface and prioritize all operational exceptions requiring attention.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXCEPTION FEED                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ ⏱ 2m ago  │ 🔧 MACHINE DOWN    │ SAW-1 blade change  │ ETA: 25 min   │
│ ⏱ 8m ago  │ 🔴 SCRAP           │ JOB-2341 3 pcs      │ $847 impact   │
│ ⏱ 15m ago │ 🟡 QC HOLD         │ JOB-2298 tolerance  │ Pending review│
│ ⏱ 22m ago │ ↩️ REWORK          │ JOB-2356 deburr     │ +45 min added │
│ ⏱ 1h ago  │ 👤 STAFFING        │ Packout -1 operator │ Shift 2       │
│ ⏱ 2h ago  │ 🚚 TRANSFER DELAY  │ Branch 14 → 07      │ +4 hrs ETA    │
│ ⏱ 3h ago  │ 📦 MATERIAL SHORT  │ 304SS 0.125" x 48"  │ 12 units need │
└─────────────────────────────────────────────────────────────────────────┘
```

**Exception Types**:
- Machine downtime (planned/unplanned)
- Scrap events (with $ impact)
- QC holds
- Rework requirements
- Staffing gaps
- Transfer delays
- Material shortages
- Customer escalations

**Each exception shows**:
- Time since occurrence
- Exception type
- Affected resource/job
- Impact/ETA
- Action buttons (Acknowledge, Escalate, Resolve)

### 2.5 Staging/Shipping Panel

**Purpose**: Manage the final mile from completion to dispatch.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STAGING & SHIPPING PANEL                           │
├─────────────┬─────────────────────────────────────────┬─────────────────┤
│   STAGING   │              READY TO SHIP              │    DISPATCHED   │
│    (47)     │                 (23)                    │      TODAY      │
├─────────────┼─────────────────────────────────────────┼─────────────────┤
│ Zone A: 18  │  CARRIER WINDOWS                        │  FedEx: 12      │
│ Zone B: 15  │  ├─ FedEx    14:30  (2h 15m)   8 pkgs  │  UPS: 8         │
│ Zone C: 14  │  ├─ UPS      15:00  (2h 45m)   5 pkgs  │  Local: 14      │
│             │  ├─ Local    16:00  (3h 45m)  10 pkgs  │  Pickup: 22     │
│ 🔴 Overflow │  └─ Pickup   --:--  (on demand)        │                 │
│    (+8)     │                                         │  Total: 56      │
│             │  ⚠️ 3 orders missing carrier assignment │                 │
└─────────────┴─────────────────────────────────────────┴─────────────────┘
```

**Metrics**:
- Staging zone occupancy
- Orders by carrier and cutoff time
- Time remaining to each cutoff
- Orders without carrier assignment
- Daily dispatch count and comparison

### 2.6 Transfer ETA & Recommendation Panel

**Purpose**: Track and optimize inter-branch material and capacity transfers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRANSFER INTELLIGENCE PANEL                          │
├─────────────────────────────────────────────────────────────────────────┤
│ INBOUND TRANSFERS                                                       │
│ ├─ Branch 14 → HERE    304SS 0.125"×48" (12 pcs)   ETA: 14:30  🟡 Delay│
│ ├─ Branch 22 → HERE    HR Coil 0.250"×60"         ETA: 16:00  🟢 Track │
│ └─ Branch 09 → HERE    Aluminum 6061             ETA: Tomorrow         │
├─────────────────────────────────────────────────────────────────────────┤
│ OUTBOUND TRANSFERS                                                      │
│ └─ HERE → Branch 31    Capacity: Waterjet (8 hrs)  Depart: 15:00       │
├─────────────────────────────────────────────────────────────────────────┤
│ AI RECOMMENDATION                                                       │
│ 🤖 Consider transferring 3 saw jobs to Branch 22 (SAW-1 has 2.1 hr    │
│    capacity available). Would reduce local queue by 1.8 hours and       │
│    improve promise attainment for JOB-2341, JOB-2356.                  │
│    [Simulate] [Accept] [Dismiss]                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.7 Day Completion Feasibility Forecast

**Purpose**: Predict with probability whether today's commitments will be met.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 DAY COMPLETION FEASIBILITY FORECAST                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TODAY'S PROMISES: 34 jobs                                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ 76%       │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│  Confidence: 76% likely to complete all 34 jobs by EOD                 │
│                                                                         │
│  SCENARIO BREAKDOWN:                                                    │
│  ├─ Best case (no exceptions):     34/34  100%  [Unlikely]             │
│  ├─ Expected (normal exceptions):  30/34   88%  [Most Likely]          │
│  └─ Worst case (major disruption): 24/34   71%  [Possible]             │
│                                                                         │
│  RISK FACTORS:                                                          │
│  • SHEAR-1 queue depth adds 2.1 hours to 6 jobs                        │
│  • Transfer from Branch 14 delayed, affects 3 jobs                     │
│  • Packout capacity at 98%, creates 1.5 hour buffer                    │
│                                                                         │
│  [View Tomorrow Forecast] [Run Simulation] [What-If Scenarios]          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.8 AI Recommendation Layer

**Purpose**: Generate actionable, explainable interventions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI INTERVENTION RECOMMENDATIONS                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 🎯 PRIORITY 1: Unblock SHEAR-1 bottleneck                              │
│    Action: Move JOB-2312, JOB-2318 to SAW-2 (compatible operation)     │
│    Why: SHEAR-1 at 92% with 4.8hr queue. SAW-2 at 58% with capacity.   │
│         Saves 1.8 hours for 4 downstream jobs with tight promises.     │
│    Impact: +3 jobs meet promise, -$0 cost, -2.1hr queue time           │
│    [Accept] [Modify] [Explain More] [Dismiss]                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 🎯 PRIORITY 2: Accelerate JOB-2341 (Metro Mfg - HOT)                   │
│    Action: Assign dedicated operator, skip queue at DEBURR             │
│    Why: Customer is strategic (top 5 by revenue). Promise in 2h 15m.   │
│         Current path completes in 2h 45m. Expedite saves relationship. │
│    Impact: +1 job meets promise, +$45 expedite cost                    │
│    [Accept] [Modify] [Explain More] [Dismiss]                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 🎯 PRIORITY 3: Proactive transfer to Branch 22                         │
│    Action: Ship 12 units of 304SS to Branch 22 for customer pickup     │
│    Why: Customer location closer to Branch 22. We have excess stock.   │
│         Saves customer 45 min drive. Branch 22 has dock capacity.      │
│    Impact: +1 customer experience, -$0 material, +transfer cost $85    │
│    [Accept] [Modify] [Explain More] [Dismiss]                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.9 Cross-Division Interference Layer

**Purpose**: Show where plastics and metals compete for shared resources.

```
┌─────────────────────────────────────────────────────────────────────────┐
│               CROSS-DIVISION RESOURCE CONTENTION                        │
├─────────────────────────────────────────────────────────────────────────┤
│ PACKOUT STATION                                                         │
│ ├─ Metals:   ████████████████░░░░  64%  (18 jobs)                      │
│ ├─ Plastics: ████████████░░░░░░░░  52%  (12 jobs)                      │
│ └─ Combined: ████████████████████████████████░░  116% ⚠️ OVERLOAD      │
│                                                                         │
│ DOCK 3                                                                  │
│ ├─ Metals:   ██████████░░░░░░░░░░  42%  (8 orders)                     │
│ ├─ Plastics: ████████░░░░░░░░░░░░  34%  (6 orders)                     │
│ └─ Combined: ██████████████████░░  76%  🟢 OK                          │
│                                                                         │
│ CONFLICT ALERT:                                                         │
│ 🔴 Packout contention 14:00-16:00. Plastics job P-2341 and metals      │
│    job JOB-2356 both need large-format packout at same time.           │
│    Recommendation: Delay P-2341 by 30 min OR use alternate station.    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.10 Remnant Economics Panel

**Purpose**: Optimize remnant management for margin and utilization.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     REMNANT ECONOMICS PANEL                             │
├─────────────────────────────────────────────────────────────────────────┤
│ REMNANT INVENTORY: 847 pieces | $234,500 value | 12,400 sq ft          │
├─────────────────────────────────────────────────────────────────────────┤
│ TODAY'S DECISIONS:                                                      │
│                                                                         │
│ REUSE OPPORTUNITIES (saves new material)                                │
│ ├─ JOB-2398 can use remnant R-4521 (304SS)    Save: $145   [Use It]   │
│ ├─ JOB-2401 can use remnant R-4498 (HR)       Save: $89    [Use It]   │
│ └─ JOB-2405 can use remnant R-4445 (Alum)     Save: $234   [Use It]   │
│                                                                         │
│ SELL RECOMMENDATIONS (aging inventory)                                  │
│ ├─ R-4112 (aged 90 days) 304SS 24"×36"        Value: $156  [List]     │
│ └─ R-4098 (aged 120 days) HR 18"×24"          Value: $67   [Scrap]    │
│                                                                         │
│ SCRAP CANDIDATES (no viable use)                                        │
│ └─ 23 pieces, $1,240 scrap value, 340 sq ft floor space recovered      │
│                                                                         │
│ AI INSIGHT: Selling R-4112 + scrapping R-4098 frees $223 cash +        │
│             340 sq ft floor space. Reusing R-4521 saves $145 vs new.   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.11 Material Availability & Inbound Signal

**Purpose**: Proactively surface material constraints before they block work.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                MATERIAL AVAILABILITY & PROCUREMENT                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 🔴 STOCK OUTS (blocking work now):                                     │
│ ├─ 304SS 0.125"×48"    Need: 12 pcs   Have: 0    ETA: 14:30 (transfer)│
│ └─ Aluminum 6061 1"    Need: 8 pcs    Have: 2    ETA: Tomorrow (PO)   │
│                                                                         │
│ 🟡 LOW STOCK (will block within 48h):                                  │
│ ├─ HR 0.250"×60"       Stock: 15%     Reorder triggered                │
│ ├─ Galv 0.060"×48"     Stock: 22%     PO in transit                    │
│ └─ CR 0.125"×36"       Stock: 18%     Recommend reorder                │
│                                                                         │
│ 🟢 INBOUND:                                                             │
│ ├─ PO-4521 (Mill)      HR Coil 40,000 lbs     ETA: Tomorrow            │
│ ├─ PO-4518 (Dist)      304SS sheet 200 pcs    ETA: Today 16:00        │
│ └─ Transfer Branch 14  304SS 0.125"×48" 12pc  ETA: Today 14:30        │
│                                                                         │
│ AI ALERT: Consider expediting PO-4521 for $200 to meet Thursday demand │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Forecasting & Simulation Layer

### 3.1 Demand vs Capacity Forecast

**Model**: Rolling 7-day forecast comparing incoming order volume against available capacity by work center.

**Inputs**:
- Historical order patterns (day of week, seasonality)
- Current order book
- Confirmed future orders
- Work center capacity by shift
- Planned maintenance/downtime

**Outputs**:
- Daily capacity utilization forecast
- Bottleneck prediction by work center
- Recommended overtime/additional shifts
- Transfer opportunity identification

### 3.2 Machine/Shift Utilization Forecast

**Model**: Predict utilization at 1-hour granularity for next 48 hours.

**Factors**:
- Current queue depth
- Average processing time by work center
- Historical exception rates
- Scheduled maintenance
- Staffing plan

### 3.3 Transfer Delay Impact Model

**Scenario**: What happens if Transfer X is delayed by N hours?

**Calculates**:
- Jobs affected
- Promise risk changes
- Cascading queue impacts
- Alternative fulfillment options

### 3.4 Re-sequencing Outcomes Model

**Scenario**: What if we reorder the queue at Work Center X?

**Calculates**:
- New completion times for all affected jobs
- Promise risk changes
- Setup/changeover time impact
- Downstream queue effects

### 3.5 Alternative Fulfillment Model

**Scenario**: Can we fulfill Order X from a different branch?

**Evaluates**:
- Stock availability at other branches
- Transfer time vs local processing time
- Cost comparison (transfer vs process)
- Customer location/preference

### 3.6 Portal Negotiation Impact Model

**Scenario**: What if we offer Customer X a later promise window?

**Calculates**:
- Freed capacity for other jobs
- Promise risk reduction
- Customer relationship impact (based on history)
- Optimal alternative dates to offer

### 3.7 Stocking Strategy Model

**Scenario**: Should we stock Item X or fulfill on-demand?

**Evaluates**:
- Demand frequency and variability
- Processing cost vs inventory cost
- Lead time sensitivity
- Customer promise expectations

### 3.8 "Can We Finish Today" Simulation

**Monte Carlo simulation** running 1000 scenarios with:
- Random exception injection (based on historical rates)
- Variable processing times
- Staffing variations
- Transfer delay probabilities

**Output**: Probability distribution of completion counts.

---

## 4. AI Reasoning Requirements

### 4.1 Intervention Generation

AI must generate **actions**, not observations. Every output should be actionable:

❌ "SHEAR-1 is at high utilization"  
✅ "Move JOB-2312 to SAW-2 to reduce SHEAR-1 queue by 1.2 hours"

### 4.2 Explainability

Every recommendation must answer:
- **What**: The specific action to take
- **Why**: The reasoning and data points
- **Impact**: Quantified benefit (time, cost, promise)
- **Trade-offs**: What's sacrificed or risked
- **Confidence**: How certain the recommendation is

### 4.3 Uncertainty Handling

AI must operate with:
- Probabilistic forecasts (not point estimates)
- Confidence intervals on predictions
- Scenario ranges (best/expected/worst)
- Acknowledgment of unknowns

### 4.4 Constraint Awareness

AI must factor:
- **Hard constraints**: Machine capability, certification requirements, physics
- **Soft constraints**: Preferences, efficiency goals, cost targets
- **Time constraints**: Shipping cutoffs, shift changes, customer hours
- **Capacity constraints**: Queue limits, staging space, dock slots

### 4.5 Failure Mode Prediction

AI must proactively surface:
- "Job X will miss promise in 4 hours unless..."
- "Work Center Y will exceed 4-hour queue at 14:30"
- "Staging will overflow by 16:00 at current rate"
- "Material Z will stock out before PO arrives"

---

## 5. Data Model & Signals

### 5.1 Required Signals

| Signal | Type | Latency | Description |
|--------|------|---------|-------------|
| Job status changes | Realtime | <1s | Status transitions from operators |
| Machine state | Realtime | <5s | Running, idle, down, setup |
| Queue depths | Realtime | <1min | Jobs waiting at each work center |
| Operator assignments | Realtime | <1min | Who is working what |
| Material transactions | Realtime | <1min | Pulls, returns, transfers |
| Shipping events | Realtime | <1min | Carrier pickups, dispatch |
| Order intake | Nearline | <5min | New orders, changes, cancellations |
| PO receipts | Nearline | <15min | Inbound material arrivals |
| Transfer status | Nearline | <15min | Inter-branch shipment tracking |
| Customer promises | Historical | Daily | Due dates, SLA history |
| Processing times | Historical | Daily | Actual vs estimated by operation |
| Exception history | Historical | Daily | Scrap, rework, downtime patterns |
| Demand patterns | Historical | Weekly | Order volume by product/customer |

### 5.2 Constraint Classification

| Constraint | Type | Description |
|------------|------|-------------|
| Machine capability | Hard | SAW can't do SHEAR operations |
| Operator certification | Hard | Waterjet requires certified operator |
| Material grade | Hard | Can't substitute 304 for 316 |
| Shipping cutoff | Hard | FedEx leaves at 15:00 |
| Due date | Soft | Prefer on-time but can negotiate |
| Setup sequence | Soft | Prefer similar jobs together |
| Queue balance | Soft | Prefer even distribution |
| Overtime | Soft | Prefer regular hours, allow OT if needed |
| Transfer cost | Soft | Prefer local, allow transfer if beneficial |

---

## 6. Alro-Specific Advantages

### 6.1 Network Leverage

Alro's multi-branch network becomes a **strategic asset**:
- Real-time visibility into all branch capacity
- Intelligent work balancing across network
- Customer-optimal fulfillment routing
- Inventory pooling with smart transfers

### 6.2 Mixed Model Mastery

Plastics + Metals + Industrial in one system:
- Unified capacity planning across divisions
- Shared resource optimization (packout, docks)
- Cross-sell opportunity identification
- Single customer view across product lines

### 6.3 Promise Precision

AI-powered promise dates:
- Realistic promises based on actual capacity
- Proactive customer communication on risk
- Trust-building through reliability
- Competitive differentiation on speed

### 6.4 Margin Improvement

Operational visibility drives margin:
- Reduced expediting costs
- Optimized overtime utilization
- Remnant monetization
- Scrap reduction through better nesting

### 6.5 Competitive Defensibility

This system becomes a moat:
- Impossible to replicate quickly
- Compounds with data accumulation
- Operator expertise embedded in AI
- Customer switching cost increases

---

## 7. Non-Goals

### What This Is NOT

1. **Not an ERP Dashboard**
   - We don't show financial summaries
   - We don't aggregate for executives
   - We don't optimize for reporting cycles

2. **Not a KPI-Only Surface**
   - KPIs inform, they don't drive action
   - We surface interventions, not metrics
   - We show "what to do," not "what happened"

3. **Not Finance-Optimized**
   - Ops truth over accounting views
   - Flow over cost allocation
   - Promise-keeping over margin reporting

4. **Not Reporting or Analytics**
   - This is operational, not analytical
   - Real-time, not retrospective
   - Action-oriented, not insight-oriented

5. **Not Deterministic**
   - We embrace uncertainty
   - We use probabilities
   - We prepare for exceptions

---

## 8. Implementation Priority

### Phase 1: Foundation (Weeks 1-4)
- Flow State Visualization
- SLA/Promise Risk Panel
- Bottleneck/Utilization Strip
- Basic Exception Feed

### Phase 2: Intelligence (Weeks 5-8)
- AI Recommendation Layer (rules-based)
- Day Completion Forecast (simple model)
- Material Availability Panel
- Staging/Shipping Panel

### Phase 3: Simulation (Weeks 9-12)
- Monte Carlo completion simulation
- Transfer optimization model
- Re-sequencing scenario planner
- Demand vs Capacity forecast

### Phase 4: Advanced AI (Weeks 13-16)
- ML-based recommendations
- Failure mode prediction
- Cross-division optimization
- Remnant economics intelligence

---

## Appendix: Visual Design Principles

1. **Information Density**: Pack meaningful data, eliminate decoration
2. **Scanability**: Key insights visible in <3 seconds
3. **Color Semantics**: Red=urgent, Yellow=attention, Green=ok (consistently)
4. **Action Proximity**: Buttons near the data they affect
5. **Progressive Disclosure**: Summary → drill-down → detail
6. **Real-time Feel**: Timestamps, live indicators, update animations
7. **Operator-Friendly**: Large touch targets, high contrast, minimal typing
