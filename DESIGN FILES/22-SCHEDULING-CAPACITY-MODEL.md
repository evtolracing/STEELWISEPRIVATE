# Scheduling & Capacity Planning Model

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Architecture Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the scheduling and capacity planning system for a metals/plastics service center operating with **next-day turnaround expectations**. The model balances:

- **Throughput maximization** (keep equipment running)
- **Due date reliability** (meet customer promises)
- **Flexibility** (handle rush orders without chaos)
- **Visibility** (everyone knows what's next)

---

## 2. WORK CENTER DEFINITIONS

### 2.1 Work Center Registry

| Work Center ID | Name              | Type         | Capacity Unit | Shifts/Day | Setup Time (avg) | Parallel Ops |
|----------------|-------------------|--------------|---------------|------------|------------------|--------------|
| WC-SAW-01      | Band Saw #1       | Cutting      | Cuts/hour     | 2          | 15 min           | No           |
| WC-SAW-02      | Band Saw #2       | Cutting      | Cuts/hour     | 2          | 15 min           | No           |
| WC-SAW-03      | Circular Saw      | Cutting      | Cuts/hour     | 1          | 10 min           | No           |
| WC-SHEAR-01    | Hydraulic Shear   | Cutting      | Cuts/hour     | 2          | 5 min            | No           |
| WC-SHEAR-02    | CNC Shear         | Cutting      | Cuts/hour     | 2          | 8 min            | No           |
| WC-LASER-01    | Fiber Laser 4kW   | Cutting      | Sheet/hour    | 2          | 20 min           | No           |
| WC-LASER-02    | CO2 Laser 6kW     | Cutting      | Sheet/hour    | 2          | 25 min           | No           |
| WC-PLASMA-01   | Plasma Table      | Cutting      | Sheet/hour    | 2          | 15 min           | No           |
| WC-SLIT-01     | Slitter Line      | Slitting     | Coils/shift   | 2          | 45 min           | No           |
| WC-SLIT-02     | Mini Slitter      | Slitting     | Coils/shift   | 1          | 30 min           | No           |
| WC-LEVEL-01    | Leveler/Flattener | Conditioning | Sheets/hour   | 2          | 20 min           | No           |
| WC-GRIND-01    | Surface Grinder   | Finishing    | Sq.Ft/hour    | 1          | 30 min           | No           |
| WC-DEBURR-01   | Deburr Station    | Finishing    | Parts/hour    | 2          | 5 min            | Yes (2)      |
| WC-POLISH-01   | Polishing Line    | Finishing    | Sq.Ft/hour    | 1          | 15 min           | No           |
| WC-DRILL-01    | Drill Press       | Machining    | Holes/hour    | 1          | 10 min           | No           |
| WC-MILL-01     | CNC Mill          | Machining    | Hours         | 1          | 45 min           | No           |
| WC-ROUTER-01   | CNC Router        | Machining    | Hours         | 2          | 30 min           | No           |
| WC-BEND-01     | Press Brake       | Forming      | Bends/hour    | 2          | 20 min           | No           |
| WC-ROLL-01     | Plate Roll        | Forming      | Hours         | 1          | 30 min           | No           |
| WC-WELD-01     | Welding Station   | Fabrication  | Hours         | 2          | 15 min           | Yes (3)      |
| WC-PACK-01     | Packaging Station | Packaging    | Jobs/hour     | 2          | 5 min            | Yes (4)      |

### 2.2 Work Center Attributes

```typescript
interface WorkCenter {
  id: string;
  name: string;
  type: WorkCenterType;
  
  // Capacity
  capacityUnit: 'cuts' | 'sheets' | 'coils' | 'parts' | 'sqft' | 'hours';
  baseCapacityPerHour: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  
  // Setup
  avgSetupMinutes: number;
  setupFactors: SetupFactor[]; // material, thickness, tooling changes
  
  // Parallel processing
  parallelOperators: number; // 1 = single operator, >1 = multiple stations
  
  // Capabilities
  materialTypes: MaterialType[];
  thicknessRange: { min: number; max: number; unit: 'in' | 'mm' };
  widthRange: { min: number; max: number; unit: 'in' | 'mm' };
  
  // Scheduling
  queuePriority: number; // default priority for this work center
  allowOvertime: boolean;
  maintenanceWindows: MaintenanceWindow[];
  
  // Alternates
  alternateWorkCenters: string[]; // IDs of equivalent machines
  
  // Location
  facilityId: string;
  zone: string;
}

enum WorkCenterType {
  CUTTING = 'CUTTING',
  SLITTING = 'SLITTING',
  CONDITIONING = 'CONDITIONING',
  FINISHING = 'FINISHING',
  MACHINING = 'MACHINING',
  FORMING = 'FORMING',
  FABRICATION = 'FABRICATION',
  PACKAGING = 'PACKAGING'
}
```

### 2.3 Work Center Groupings (Pools)

For scheduling flexibility, similar work centers are grouped:

| Pool Name       | Work Centers                      | Scheduling Rule                        |
|-----------------|-----------------------------------|----------------------------------------|
| SAW_POOL        | WC-SAW-01, WC-SAW-02, WC-SAW-03   | Assign to first available              |
| SHEAR_POOL      | WC-SHEAR-01, WC-SHEAR-02          | Prefer CNC for precision cuts          |
| LASER_POOL      | WC-LASER-01, WC-LASER-02          | Material-based assignment              |
| SLIT_POOL       | WC-SLIT-01, WC-SLIT-02            | Width-based assignment                 |
| FINISHING_POOL  | WC-GRIND-01, WC-DEBURR-01, etc.   | Operation-specific                     |

---

## 3. CAPACITY MODEL

### 3.1 Capacity Calculation

```
Available Capacity (hours/day) = 
  Shifts × Hours per Shift × Efficiency Factor × (1 - Maintenance %)

Effective Capacity (units/day) = 
  Available Capacity (hours) × Base Rate per Hour × Yield Factor
```

**Standard Assumptions:**
- Shift: 8 hours (480 min)
- Efficiency Factor: 85% (breaks, transitions, minor delays)
- Maintenance Allowance: 5%
- Yield Factor: 95% (first-pass success rate)

### 3.2 Daily Capacity by Work Center

| Work Center   | Shifts | Gross Hours | Net Hours | Units/Hour | Daily Capacity |
|---------------|--------|-------------|-----------|------------|----------------|
| Band Saw      | 2      | 16          | 12.9      | 8 cuts     | 103 cuts       |
| CNC Shear     | 2      | 16          | 12.9      | 30 cuts    | 387 cuts       |
| Fiber Laser   | 2      | 16          | 12.9      | 2 sheets   | 26 sheets      |
| Slitter Line  | 2      | 16          | 12.9      | 0.5 coils  | 6 coils        |
| Press Brake   | 2      | 16          | 12.9      | 15 bends   | 194 bends      |
| Packaging     | 2      | 16          | 12.9      | 4 jobs     | 52 jobs        |

### 3.3 Load Calculation

```typescript
interface LoadCalculation {
  workCenterId: string;
  date: Date;
  
  // Committed load
  scheduledJobs: ScheduledJob[];
  totalScheduledHours: number;
  totalScheduledUnits: number;
  
  // Capacity
  availableCapacityHours: number;
  
  // Metrics
  loadPercentage: number; // scheduledHours / availableHours × 100
  remainingCapacityHours: number;
  remainingCapacityUnits: number;
  
  // Status
  status: 'UNDERLOADED' | 'OPTIMAL' | 'FULL' | 'OVERLOADED';
}

// Load Status Thresholds
const LOAD_THRESHOLDS = {
  UNDERLOADED: { max: 60 },   // < 60% = room for more
  OPTIMAL: { min: 60, max: 85 }, // 60-85% = healthy
  FULL: { min: 85, max: 100 },   // 85-100% = near capacity
  OVERLOADED: { min: 100 }       // > 100% = problem
};
```

### 3.4 Capacity Visualization

```
Work Center: WC-LASER-01 | Date: 2026-01-17
═══════════════════════════════════════════════════════

SHIFT 1 (6:00 AM - 2:00 PM)
├─[6:00-6:20] Setup - Job J-2401
├─[6:20-8:30] ████████████ Job J-2401 (Steel 0.25")
├─[8:30-8:45] Break
├─[8:45-9:15] Setup - Job J-2405
├─[9:15-11:30] ██████████████ Job J-2405 (Aluminum 0.125")
├─[11:30-12:00] Lunch
├─[12:00-12:30] Setup - Job J-2408
├─[12:30-2:00] █████████ Job J-2408 (Stainless 0.1875")
└─ Utilization: 78%

SHIFT 2 (2:00 PM - 10:00 PM)
├─[2:00-2:20] Setup - Job J-2410
├─[2:20-5:00] ███████████████████ Job J-2410 (Steel 0.5")
├─[5:00-5:15] Break
├─[5:15-5:45] Setup - Job J-2415
├─[5:45-8:00] ██████████████ Job J-2415 (Steel 0.375")
├─[8:00-8:30] Break
├─[8:30-10:00] ████████ AVAILABLE
└─ Utilization: 82%

DAILY SUMMARY
├─ Total Capacity: 12.9 hours (774 min)
├─ Scheduled: 10.4 hours (624 min)
├─ Available: 2.5 hours (150 min)
├─ Load: 80% ████████░░ OPTIMAL
└─ Jobs Processed: 5

```

### 3.5 Finite vs Infinite Capacity Planning

| Mode            | When Used                           | Behavior                              |
|-----------------|-------------------------------------|---------------------------------------|
| **Finite**      | Production scheduling (< 1 week)    | Respects actual capacity limits       |
| **Infinite**    | Long-range planning (> 1 week)      | Identifies capacity gaps for planning |
| **Constrained** | Rush orders                         | Allows overload with approval         |

---

## 4. OPERATION TIME ESTIMATION

### 4.1 Time Components

```
Total Operation Time = Setup Time + Run Time + Queue Time + Move Time

Where:
  Setup Time = Base Setup + Material Change + Tooling Change + Program Load
  Run Time = (Quantity × Unit Time) / Efficiency Factor
  Queue Time = Average wait in work center queue
  Move Time = Transport between operations
```

### 4.2 Standard Time Tables

**Saw Cutting (per cut):**

| Material     | Thickness  | Cross Section | Time/Cut | Notes                    |
|--------------|------------|---------------|----------|--------------------------|
| Carbon Steel | < 2"       | < 6" sq       | 2 min    | Standard                 |
| Carbon Steel | 2" - 4"    | < 6" sq       | 5 min    | Slower feed rate         |
| Carbon Steel | > 4"       | Any           | 10 min   | Multiple passes          |
| Stainless    | Any        | Any           | × 1.5    | Multiplier               |
| Aluminum     | Any        | Any           | × 0.7    | Faster cutting           |
| Alloy Steel  | Any        | Any           | × 1.3    | Harder material          |

**Laser Cutting (per sheet):**

| Material     | Thickness  | Complexity    | Time/Sheet | Notes                   |
|--------------|------------|---------------|------------|-------------------------|
| Steel        | < 0.25"    | Simple        | 15 min     | Basic profiles          |
| Steel        | < 0.25"    | Complex       | 30 min     | Many holes/features     |
| Steel        | 0.25-0.5"  | Simple        | 25 min     |                         |
| Steel        | 0.25-0.5"  | Complex       | 45 min     |                         |
| Aluminum     | Any        | Any           | × 0.8      | Faster cutting          |
| Stainless    | Any        | Any           | × 1.2      | Slower, more power      |

**Slitting (per coil):**

| Width      | Gauge    | # Slits | Time/Coil | Notes                      |
|------------|----------|---------|-----------|----------------------------|
| < 48"      | < 0.1"   | < 10    | 45 min    | Standard                   |
| < 48"      | < 0.1"   | 10-20   | 60 min    | More knife changes         |
| 48" - 72"  | Any      | Any     | 75 min    | Heavier coil handling      |
| Any        | > 0.25"  | Any     | 90 min    | Heavy gauge, slower speed  |

### 4.3 Setup Time Factors

```typescript
interface SetupTimeCalculation {
  baseSetup: number; // minutes
  factors: {
    materialChange: number;    // +X min if different material than previous
    thicknessChange: number;   // +X min if thickness change > 0.1"
    toolingChange: number;     // +X min if tooling swap required
    programChange: number;     // +X min if new NC program
    firstArticle: number;      // +X min if first article inspection required
  };
  
  calculate(previousJob: Job, currentJob: Job): number;
}

// Example: Laser Setup
const laserSetup = {
  baseSetup: 10,
  factors: {
    materialChange: 5,      // purge/gas change
    thicknessChange: 5,     // focus adjustment
    toolingChange: 0,       // no tooling on laser
    programChange: 3,       // load new program
    firstArticle: 10        // operator verification
  }
};

// If switching from 0.25" steel to 0.125" aluminum with new program:
// Setup = 10 + 5 + 5 + 0 + 3 = 23 minutes
```

### 4.4 Estimating Engine

```typescript
function estimateOperationTime(
  operation: Operation,
  workCenter: WorkCenter,
  previousJob: Job | null
): OperationTimeEstimate {
  
  // 1. Calculate setup
  const setupTime = calculateSetupTime(operation, workCenter, previousJob);
  
  // 2. Calculate run time
  const baseUnitTime = getStandardTime(
    operation.type,
    operation.material,
    operation.thickness,
    operation.complexity
  );
  
  const runTime = (operation.quantity * baseUnitTime) / workCenter.efficiencyFactor;
  
  // 3. Add contingency based on job complexity
  const contingency = operation.isFirstRun ? 0.15 : 0.05; // 15% first time, 5% repeat
  
  // 4. Calculate queue time (based on current load)
  const queueTime = estimateQueueTime(workCenter, operation.scheduledDate);
  
  // 5. Move time (standard per facility layout)
  const moveTime = getMoveTime(operation.fromLocation, workCenter.zone);
  
  return {
    setupTime,
    runTime: runTime * (1 + contingency),
    queueTime,
    moveTime,
    totalTime: setupTime + runTime * (1 + contingency) + queueTime + moveTime,
    confidence: calculateConfidence(operation) // HIGH, MEDIUM, LOW
  };
}
```

### 4.5 Learning/History Adjustment

```typescript
interface HistoricalAdjustment {
  operationType: string;
  materialGrade: string;
  
  standardTime: number;
  actualTimeAvg: number;
  actualTimeStdDev: number;
  sampleSize: number;
  
  adjustmentFactor: number; // actual / standard
}

// System learns from actual times and adjusts estimates
// Example: If laser cuts consistently take 20% longer than standard
// adjustmentFactor = 1.2, applied to future estimates
```

---

## 5. BATCH VS SINGLE-PIECE SCHEDULING

### 5.1 Job Classification

| Classification    | Criteria                              | Scheduling Strategy           |
|-------------------|---------------------------------------|-------------------------------|
| **Single-Piece**  | Qty = 1, unique specs                 | Schedule as individual job    |
| **Small Batch**   | Qty 2-10, same specs                  | Schedule as unit, no splits   |
| **Medium Batch**  | Qty 11-50, same specs                 | May split across shifts       |
| **Large Batch**   | Qty > 50, same specs                  | Split across days/machines    |
| **Repeat Order**  | Same as previous order within 30 days | Use historical setup/time     |

### 5.2 Batching Rules

```typescript
interface BatchingRules {
  // When to combine jobs
  combine: {
    sameCustomer: boolean;         // Can combine if same customer
    sameMaterial: boolean;         // Must be same material grade
    sameThickness: boolean;        // Must be same thickness
    maxCombinedQty: number;        // Don't exceed this combined quantity
    maxDueDateSpread: number;      // Days - don't combine if due dates differ by more
  };
  
  // When to split jobs
  split: {
    exceedsShiftCapacity: boolean; // Split if job > 1 shift
    exceedsMaxRunTime: number;     // Hours - split if run time exceeds
    splitForParallelMachines: boolean; // Split to run on multiple machines
    minSplitQty: number;           // Don't create splits smaller than this
  };
}

const defaultBatchingRules: BatchingRules = {
  combine: {
    sameCustomer: true,
    sameMaterial: true,
    sameThickness: true,
    maxCombinedQty: 100,
    maxDueDateSpread: 1  // 1 day
  },
  split: {
    exceedsShiftCapacity: true,
    exceedsMaxRunTime: 6,  // 6 hours max per split
    splitForParallelMachines: true,
    minSplitQty: 10
  }
};
```

### 5.3 Setup Optimization (Batching by Similarity)

```
Goal: Minimize total setup time by sequencing similar jobs together

Similarity Score = 
  (Material Match × 40) +
  (Thickness Match × 30) +
  (Width Match × 20) +
  (Program Match × 10)

Sequence jobs by descending similarity to minimize transitions.

Example:
  Job A: Steel, 0.25", 48" wide, Program P1
  Job B: Steel, 0.25", 48" wide, Program P2  → Similarity to A: 90
  Job C: Steel, 0.375", 48" wide, Program P1 → Similarity to A: 70
  Job D: Aluminum, 0.25", 48" wide, Program P1 → Similarity to A: 60
  
  Optimal sequence: A → B → C → D (minimizes setup changes)
```

### 5.4 Campaign Scheduling

For high-volume work centers (slitter, laser), run **campaigns**:

```
Campaign = Group of similar jobs run consecutively with minimal setup

Campaign Rules:
- Same material type
- Similar thickness (within 0.0625" tolerance)
- Same work center
- Combined run time: 2-8 hours

Benefits:
- Reduce setup frequency by 40-60%
- Improve operator efficiency
- Better yield (fewer edge trims)

Tradeoff:
- May delay some jobs to fit campaign
- Requires sufficient backlog of similar work
```

---

## 6. SLA RISK EVALUATION

### 6.1 Risk Scoring Model

```typescript
interface SLARiskScore {
  jobId: string;
  score: number;           // 0-100 (higher = more risk)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  recommendedAction: string;
}

interface RiskFactor {
  name: string;
  weight: number;          // Contribution to total score
  value: number;           // Current value
  threshold: number;       // Warning threshold
  impact: string;          // What happens if threshold exceeded
}
```

### 6.2 Risk Factors

| Factor                  | Weight | Low Risk    | Medium Risk | High Risk   | Critical    |
|-------------------------|--------|-------------|-------------|-------------|-------------|
| Time to Due Date        | 30%    | > 48 hrs    | 24-48 hrs   | 8-24 hrs    | < 8 hrs     |
| Remaining Operations    | 20%    | 1 op        | 2 ops       | 3 ops       | 4+ ops      |
| Work Center Load        | 20%    | < 70%       | 70-85%      | 85-100%     | > 100%      |
| Material Available      | 15%    | On-hand     | In transit  | On order    | Not ordered |
| Historical On-Time      | 10%    | > 95%       | 85-95%      | 70-85%      | < 70%       |
| Customer Priority       | 5%     | Economy     | Standard    | Hot         | Critical    |

### 6.3 Risk Calculation

```typescript
function calculateSLARisk(job: Job, schedule: Schedule): SLARiskScore {
  const factors: RiskFactor[] = [];
  
  // 1. Time to Due Date
  const hoursRemaining = differenceInHours(job.dueDate, new Date());
  const estimatedCompletion = calculateEstimatedCompletion(job, schedule);
  const buffer = hoursRemaining - estimatedCompletion;
  
  factors.push({
    name: 'TIME_BUFFER',
    weight: 30,
    value: buffer,
    threshold: 4, // 4 hours buffer minimum
    impact: 'Job may ship late'
  });
  
  // 2. Remaining Operations
  const remainingOps = job.routing.filter(op => op.status !== 'COMPLETE').length;
  factors.push({
    name: 'REMAINING_OPS',
    weight: 20,
    value: remainingOps,
    threshold: 2,
    impact: 'More operations increase delay risk'
  });
  
  // 3. Work Center Load
  const nextOp = getNextOperation(job);
  const wcLoad = getWorkCenterLoad(nextOp.workCenterId, nextOp.scheduledDate);
  factors.push({
    name: 'WC_LOAD',
    weight: 20,
    value: wcLoad.loadPercentage,
    threshold: 85,
    impact: 'Overloaded work center may cause delays'
  });
  
  // 4. Material Availability
  const materialStatus = checkMaterialAvailability(job);
  factors.push({
    name: 'MATERIAL',
    weight: 15,
    value: materialStatusToScore(materialStatus),
    threshold: 50,
    impact: 'Material delays will cascade'
  });
  
  // 5. Historical Performance (this customer, this type of job)
  const historicalOnTime = getHistoricalOnTimeRate(job.customerId, job.type);
  factors.push({
    name: 'HISTORICAL',
    weight: 10,
    value: 100 - historicalOnTime, // Invert so higher = more risk
    threshold: 15,
    impact: 'Pattern of delays for similar jobs'
  });
  
  // 6. Customer Priority
  factors.push({
    name: 'PRIORITY',
    weight: 5,
    value: priorityToScore(job.priority),
    threshold: 75,
    impact: 'High-priority customer requires extra attention'
  });
  
  // Calculate weighted score
  const totalScore = factors.reduce((sum, f) => {
    const normalizedValue = Math.min(100, (f.value / f.threshold) * 50);
    return sum + (normalizedValue * f.weight / 100);
  }, 0);
  
  return {
    jobId: job.id,
    score: Math.round(totalScore),
    riskLevel: scoreToRiskLevel(totalScore),
    factors,
    recommendedAction: getRecommendedAction(totalScore, factors)
  };
}

function scoreToRiskLevel(score: number): string {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}
```

### 6.4 Risk Response Matrix

| Risk Level  | Color  | Alert                    | Recommended Actions                            |
|-------------|--------|--------------------------|------------------------------------------------|
| LOW         | Green  | None                     | Continue normal scheduling                     |
| MEDIUM      | Yellow | Dashboard highlight      | Monitor closely, consider priority bump        |
| HIGH        | Orange | Supervisor notification  | Reassign to faster work center, add overtime   |
| CRITICAL    | Red    | Manager escalation       | Bump other jobs, expedite shipping, call customer |

### 6.5 Automated Risk Actions

```typescript
interface AutoRiskResponse {
  riskLevel: string;
  automaticActions: Action[];
  requiresApproval: Action[];
}

const autoRiskResponses: AutoRiskResponse[] = [
  {
    riskLevel: 'MEDIUM',
    automaticActions: [
      { type: 'HIGHLIGHT_DASHBOARD', params: {} },
      { type: 'SEND_NOTIFICATION', params: { to: 'scheduler' } }
    ],
    requiresApproval: []
  },
  {
    riskLevel: 'HIGH',
    automaticActions: [
      { type: 'MOVE_TO_ALTERNATE_WC', params: { ifFaster: true } },
      { type: 'SEND_NOTIFICATION', params: { to: 'supervisor' } }
    ],
    requiresApproval: [
      { type: 'ADD_OVERTIME', params: {} },
      { type: 'BUMP_OTHER_JOBS', params: {} }
    ]
  },
  {
    riskLevel: 'CRITICAL',
    automaticActions: [
      { type: 'ESCALATE_TO_MANAGER', params: {} },
      { type: 'PREPARE_CUSTOMER_NOTIFICATION', params: {} }
    ],
    requiresApproval: [
      { type: 'BUMP_OTHER_JOBS', params: { maxBump: 3 } },
      { type: 'EXPEDITE_SHIPPING', params: {} },
      { type: 'SPLIT_JOB', params: {} }
    ]
  }
];
```

---

## 7. DUE DATE PROMISE NEGOTIATION

### 7.1 Promise Date Calculation

```typescript
function calculatePromiseDate(order: OrderRequest): PromiseDateResult {
  // 1. Get required operations from product/routing
  const routing = getStandardRouting(order.productId, order.specifications);
  
  // 2. Check material availability
  const materialAvailable = getMaterialAvailabilityDate(order.material);
  
  // 3. Calculate earliest start (later of: now, material available)
  const earliestStart = max([new Date(), materialAvailable]);
  
  // 4. Forward schedule through operations
  let currentDate = earliestStart;
  
  for (const operation of routing) {
    // Find available slot at work center
    const slot = findNextAvailableSlot(
      operation.workCenterPool,
      currentDate,
      operation.estimatedTime
    );
    
    currentDate = slot.endTime;
  }
  
  // 5. Add packaging and shipping buffer
  const packagingBuffer = 2; // hours
  const shippingBuffer = getShippingBuffer(order.shipMethod);
  
  const promiseDate = addHours(currentDate, packagingBuffer + shippingBuffer);
  
  // 6. Adjust for business hours/days
  const adjustedPromise = adjustToBusinessHours(promiseDate);
  
  return {
    promiseDate: adjustedPromise,
    confidence: calculateConfidence(routing, order),
    breakdown: {
      materialReady: materialAvailable,
      productionComplete: currentDate,
      readyToShip: addHours(currentDate, packagingBuffer),
      delivered: adjustedPromise
    },
    alternatives: generateAlternatives(order, adjustedPromise)
  };
}
```

### 7.2 Promise Negotiation Flow

```
Customer Request: "I need 50 pieces of 0.25" steel plate cut to size by tomorrow"

System Evaluation:
┌─────────────────────────────────────────────────────────────┐
│ PROMISE DATE ANALYSIS                                       │
├─────────────────────────────────────────────────────────────┤
│ Requested: 2026-01-18 (tomorrow)                            │
│                                                             │
│ Material:   ✓ In stock (Grade A36, Qty 75 sheets)           │
│ Capacity:   ⚠ Laser at 85% load tomorrow                    │
│ Operations: 1 (laser cutting only)                          │
│ Time Est:   3.5 hours                                       │
│                                                             │
│ RESULT: CAN MEET WITH PRIORITY SCHEDULING                   │
├─────────────────────────────────────────────────────────────┤
│ Options:                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ A) Standard: Ship 01/20 (2 days)     Price: $X         │ │
│ │ B) Hot:      Ship 01/18 (tomorrow)   Price: $X + 15%   │ │
│ │ C) Critical: Ship 01/18 AM           Price: $X + 30%   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Negotiation Rules

```typescript
interface PromiseNegotiationRules {
  // Automatic approval thresholds
  autoApprove: {
    standardLeadTime: number;     // Days - auto-approve if within standard
    capacityThreshold: number;    // % - auto-approve if capacity below this
    valueThreshold: number;       // $ - auto-approve rush if order value exceeds
  };
  
  // Rush order rules
  rushOrder: {
    minLeadTime: number;          // Hours - minimum we can ever promise
    surchargePercent: number;     // Rush fee percentage
    requiresApproval: boolean;    // Manager approval needed?
    maxBumpableJobs: number;      // How many other jobs can we delay?
  };
  
  // Customer tier overrides
  tierOverrides: {
    PLATINUM: { rushSurcharge: 0, priorityQueue: true },
    GOLD: { rushSurcharge: 10, priorityQueue: true },
    SILVER: { rushSurcharge: 15, priorityQueue: false },
    BRONZE: { rushSurcharge: 20, priorityQueue: false }
  };
}
```

### 7.4 Alternatives Generation

```typescript
function generateAlternatives(
  order: OrderRequest,
  standardPromise: Date
): PromiseAlternative[] {
  const alternatives: PromiseAlternative[] = [];
  
  // Alternative 1: Standard (as calculated)
  alternatives.push({
    type: 'STANDARD',
    promiseDate: standardPromise,
    price: order.basePrice,
    confidence: 95,
    notes: 'Standard scheduling'
  });
  
  // Alternative 2: Expedited (bump priority)
  const expeditedDate = subtractHours(standardPromise, 24);
  if (isBusinessDay(expeditedDate) && canExpedite(order)) {
    alternatives.push({
      type: 'EXPEDITED',
      promiseDate: expeditedDate,
      price: order.basePrice * 1.15,
      confidence: 90,
      notes: 'Priority scheduling, +15% rush fee'
    });
  }
  
  // Alternative 3: Partial shipment
  if (order.quantity > 20) {
    const partial1 = calculatePartialShipDate(order, Math.floor(order.quantity / 2));
    alternatives.push({
      type: 'PARTIAL',
      promiseDate: partial1,
      price: order.basePrice * 1.05, // Small handling fee
      confidence: 95,
      notes: `Ship ${Math.floor(order.quantity / 2)} pcs by ${format(partial1)}, remainder by ${format(standardPromise)}`
    });
  }
  
  // Alternative 4: Alternate facility
  const alternateFacility = findAlternateFacility(order);
  if (alternateFacility) {
    alternatives.push({
      type: 'ALTERNATE_LOCATION',
      promiseDate: alternateFacility.promiseDate,
      price: order.basePrice + alternateFacility.transferCost,
      confidence: 85,
      notes: `Process at ${alternateFacility.name}, additional freight may apply`
    });
  }
  
  return alternatives;
}
```

---

## 8. MULTI-LOCATION ROUTING

### 8.1 Facility Network

```typescript
interface Facility {
  id: string;
  name: string;
  address: Address;
  
  // Capabilities
  workCenters: WorkCenter[];
  materialTypes: MaterialType[];
  certifications: string[];  // ISO, DFARS, etc.
  
  // Capacity
  shiftsPerDay: number;
  overtimeAvailable: boolean;
  
  // Transfer logistics
  transferPartners: TransferRoute[];
}

interface TransferRoute {
  fromFacility: string;
  toFacility: string;
  transitDays: number;
  costPerPound: number;
  minWeight: number;
  carrier: string;
}
```

### 8.2 Multi-Location Decision Logic

```
When to consider alternate location:

1. PRIMARY FACILITY OVERLOADED
   - Load > 95% for requested timeframe
   - Due date cannot be met locally
   
2. CAPABILITY MISMATCH
   - Required equipment not available locally
   - Certification required that local doesn't have
   
3. MATERIAL LOCATION
   - Material is at different facility
   - Transfer cost < processing delay cost
   
4. COST OPTIMIZATION
   - Different facility has lower processing cost
   - Volume justifies transfer

Decision Matrix:
┌─────────────────┬───────────────┬────────────────┬─────────────────┐
│ Scenario        │ Transfer?     │ Condition      │ Override        │
├─────────────────┼───────────────┼────────────────┼─────────────────┤
│ Meet due date   │ Yes           │ Local can't    │ Customer pays   │
│ Save cost       │ Maybe         │ Savings > $500 │ Ops approval    │
│ Capability      │ Yes           │ Required equip │ N/A             │
│ Material there  │ Yes           │ Transit < 1 day│ Compare options │
│ Customer pref   │ Yes           │ Customer asks  │ Document reason │
└─────────────────┴───────────────┴────────────────┴─────────────────┘
```

### 8.3 Split-Location Routing

```typescript
interface MultiLocationRouting {
  orderId: string;
  segments: RoutingSegment[];
  totalLeadTime: number;
  totalCost: number;
  consolidationPoint: string;
}

interface RoutingSegment {
  facilityId: string;
  operations: Operation[];
  startDate: Date;
  endDate: Date;
  transferTo?: string;
  transferCost?: number;
}

// Example: Complex order requiring multiple facilities
const complexRouting: MultiLocationRouting = {
  orderId: 'ORD-5001',
  segments: [
    {
      facilityId: 'PLANT-HOUSTON',
      operations: [
        { type: 'SLIT', workCenter: 'WC-SLIT-01' }
      ],
      startDate: new Date('2026-01-17'),
      endDate: new Date('2026-01-17'),
      transferTo: 'PLANT-DALLAS',
      transferCost: 150
    },
    {
      facilityId: 'PLANT-DALLAS',
      operations: [
        { type: 'LASER_CUT', workCenter: 'WC-LASER-01' },
        { type: 'BEND', workCenter: 'WC-BEND-01' }
      ],
      startDate: new Date('2026-01-18'),
      endDate: new Date('2026-01-19'),
      transferTo: null // Ships from here
    }
  ],
  totalLeadTime: 3, // days
  totalCost: 1250,  // base processing
  consolidationPoint: 'PLANT-DALLAS'
};
```

---

## 9. RESCHEDULING & BUMP LOGIC

### 9.1 Reschedule Triggers

| Trigger                | Source           | Automatic? | Approval Needed      |
|------------------------|------------------|------------|----------------------|
| Equipment breakdown    | Shop floor       | Yes        | No                   |
| Rush order inserted    | Sales/Customer   | No         | Yes (Ops Manager)    |
| Material delay         | Receiving/Purch  | Yes        | No                   |
| Quality rework         | QC               | Yes        | No                   |
| Customer date change   | Sales            | No         | Yes (if earlier)     |
| Operator absence       | HR/Supervisor    | Partial    | Supervisor           |
| Yield shortage         | Shop floor       | Yes        | No                   |

### 9.2 Bump Logic Rules

```typescript
interface BumpRules {
  // Which jobs can be bumped
  bumpable: {
    priorities: Priority[];       // Only bump these priorities
    minBufferDays: number;        // Job must have this much buffer to due date
    excludeCustomers: string[];   // Never bump these customers
    excludeAfterState: JobState;  // Don't bump if past this state
  };
  
  // Bump limits
  limits: {
    maxJobsBumped: number;        // Maximum jobs to displace per rush
    maxDelayHours: number;        // Maximum delay per bumped job
    maxCumulativeDelay: number;   // Total delay across all bumped jobs
  };
  
  // Notifications
  notify: {
    bumpedJobOwner: boolean;
    bumpedCustomer: boolean;      // If delay > X hours
    delayThresholdHours: number;  // Threshold for customer notification
  };
}

const defaultBumpRules: BumpRules = {
  bumpable: {
    priorities: ['ECONOMY', 'STANDARD'], // Don't bump HOT or CRITICAL
    minBufferDays: 1,
    excludeCustomers: ['CUST-VIP-001', 'CUST-VIP-002'],
    excludeAfterState: 'IN_PROCESS'  // Don't bump once started
  },
  limits: {
    maxJobsBumped: 3,
    maxDelayHours: 8,
    maxCumulativeDelay: 16
  },
  notify: {
    bumpedJobOwner: true,
    bumpedCustomer: true,
    delayThresholdHours: 4
  }
};
```

### 9.3 Rescheduling Algorithm

```typescript
async function rescheduleForRush(rushJob: Job): Promise<RescheduleResult> {
  const result: RescheduleResult = {
    success: false,
    rushJobSlot: null,
    bumpedJobs: [],
    notifications: []
  };
  
  // 1. Try to fit without bumping (find gaps)
  const gaps = findScheduleGaps(rushJob.requiredWorkCenters, rushJob.dueDate);
  if (canFitInGaps(rushJob, gaps)) {
    result.success = true;
    result.rushJobSlot = assignToGaps(rushJob, gaps);
    return result;
  }
  
  // 2. Try alternate work centers
  const alternates = getAlternateWorkCenters(rushJob);
  for (const alt of alternates) {
    const altGaps = findScheduleGaps([alt], rushJob.dueDate);
    if (canFitInGaps(rushJob, altGaps)) {
      result.success = true;
      result.rushJobSlot = assignToGaps(rushJob, altGaps);
      result.notes = `Assigned to alternate work center: ${alt.name}`;
      return result;
    }
  }
  
  // 3. Must bump - find bumpable jobs
  const bumpableJobs = findBumpableJobs(
    rushJob.requiredWorkCenters,
    rushJob.estimatedTime,
    rushJob.dueDate,
    defaultBumpRules
  );
  
  if (bumpableJobs.length === 0) {
    result.success = false;
    result.reason = 'No jobs available to bump within rules';
    return result;
  }
  
  // 4. Score bump candidates (minimize customer impact)
  const scoredCandidates = bumpableJobs.map(job => ({
    job,
    score: calculateBumpImpact(job),
    newSlot: findNextAvailableSlot(job.workCenter, job.originalSlot.end)
  }));
  
  // 5. Select minimum impact set
  const selectedBumps = selectMinimumBumpSet(
    scoredCandidates,
    rushJob.estimatedTime,
    defaultBumpRules.limits
  );
  
  // 6. Execute reschedule
  for (const bump of selectedBumps) {
    await moveJobToSlot(bump.job, bump.newSlot);
    result.bumpedJobs.push({
      jobId: bump.job.id,
      originalSlot: bump.job.originalSlot,
      newSlot: bump.newSlot,
      delayHours: differenceInHours(bump.newSlot.start, bump.job.originalSlot.start)
    });
    
    // Notify if significant delay
    if (bump.delayHours >= defaultBumpRules.notify.delayThresholdHours) {
      result.notifications.push({
        type: 'CUSTOMER_DELAY',
        jobId: bump.job.id,
        customerId: bump.job.customerId,
        message: `Your order ${bump.job.orderId} has been delayed by ${bump.delayHours} hours`
      });
    }
  }
  
  // 7. Assign rush job
  const rushSlot = createSlotFromBumps(selectedBumps);
  await assignJobToSlot(rushJob, rushSlot);
  result.rushJobSlot = rushSlot;
  result.success = true;
  
  return result;
}
```

### 9.4 Cascade Detection

```typescript
function detectCascade(initialChange: ScheduleChange): CascadeAnalysis {
  const affected: AffectedJob[] = [];
  const queue = [initialChange];
  
  while (queue.length > 0) {
    const change = queue.shift();
    
    // Find jobs that depend on this slot
    const dependentJobs = findDependentJobs(change.workCenter, change.timeSlot);
    
    for (const job of dependentJobs) {
      if (isImpacted(job, change)) {
        const impact = calculateImpact(job, change);
        affected.push({
          job,
          originalDueDate: job.dueDate,
          newDueDate: addHours(job.dueDate, impact.delayHours),
          impactType: impact.type,
          cascadeLevel: affected.length // How deep in the cascade
        });
        
        // If this job has downstream operations, add to queue
        if (job.hasDownstreamOps) {
          queue.push({
            workCenter: job.nextOperation.workCenter,
            timeSlot: job.nextOperation.scheduledSlot,
            cause: `Cascade from ${change.jobId}`
          });
        }
      }
    }
  }
  
  return {
    directlyAffected: affected.filter(a => a.cascadeLevel === 0).length,
    totalAffected: affected.length,
    maxDelay: Math.max(...affected.map(a => differenceInHours(a.newDueDate, a.originalDueDate))),
    affectedJobs: affected,
    requiresApproval: affected.length > 5 || affected.some(a => a.job.priority === 'CRITICAL')
  };
}
```

---

## 10. UI CONCEPT: GANTT/BOARD HYBRID

### 10.1 Overview

The scheduling UI combines:
- **Gantt Chart** for time-based visualization of work center loading
- **Kanban Board** for job status and quick drag-drop scheduling
- **Risk Dashboard** for SLA monitoring

### 10.2 Main Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SCHEDULING COMMAND CENTER                                          [Jan 17, 2026]│
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Timeline] [Board View] [Load Chart] [Risk Monitor]           🔍 Search   [+Add] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WORK CENTER TIMELINE                                   ◄ Today ►    [Week▾]    │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                    │ 6AM   8AM   10AM  12PM  2PM   4PM   6PM   8PM   10PM       │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  WC-LASER-01  85%  │░░░░░░████████████████░░██████████████░░░████████░░░░░░░░   │
│  WC-LASER-02  72%  │░░░░░░░░████████████░░░░░░░░░████████████████░░░░░░░░░░░░   │
│  WC-SAW-01    91%  │░░████████████████████████████████████████████████████░░░   │
│  WC-SAW-02    65%  │░░░░░░████████░░░░░░░░████████░░░░░░░░████████░░░░░░░░░░░   │
│  WC-SHEAR-01  78%  │░░░░████████████████████░░░░░░████████████████████░░░░░░░   │
│  WC-SLIT-01   95%  │████████████████████████████████████████████████████████░   │
│  WC-BEND-01   45%  │░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░   │
│  WC-PACK-01   60%  │░░░░░░░░░░████░░░░████░░░░████░░░░████░░░░████░░░░████░░░   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  Legend: ████ Scheduled  ░░░░ Setup/Transition  ▓▓▓▓ Maintenance  [  ] Available │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  JOB QUEUE (Drag to Timeline)                                    [Filter▾] [Sort▾]│
│  ─────────────────────────────────────────────────────────────────────────────  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ J-2450 🔴       │  │ J-2451 🟡       │  │ J-2452 🟢       │                   │
│  │ ACME Corp      │  │ Beta Industries │  │ Charlie Ltd    │                   │
│  │ Laser Cut      │  │ Saw + Slit      │  │ Shear          │                   │
│  │ Due: TODAY 4PM │  │ Due: Tomorrow   │  │ Due: Jan 19    │                   │
│  │ Est: 2.5 hrs   │  │ Est: 4 hrs      │  │ Est: 1 hr      │                   │
│  │ ⚠️ AT RISK     │  │ Material Ready  │  │ Material Ready │                   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ALERTS & ACTIONS                                                                │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  🔴 J-2450 at risk of missing 4PM due date. [View] [Expedite] [Notify Customer] │
│  🟡 WC-SLIT-01 at 95% capacity tomorrow. Consider overflow to WC-SLIT-02.       │
│  ⚙️ WC-LASER-01 scheduled maintenance 6PM-8PM. 3 jobs will be delayed.          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Gantt Detail View (on click/hover)

```
┌───────────────────────────────────────────────────────┐
│ JOB J-2450 - ACME Corp                        [X]    │
├───────────────────────────────────────────────────────┤
│ Material: A36 Steel 0.25" x 48" x 120"               │
│ Quantity: 25 sheets                                  │
│ Operations:                                          │
│   1. ✓ Receive (Complete)                           │
│   2. ⏳ Laser Cut (Scheduled 10:30 AM - 1:00 PM)     │
│   3. ○ Deburr (Pending)                             │
│   4. ○ Package (Pending)                            │
│                                                      │
│ Timeline:                                            │
│ ├─────┼─────┼─────┼─────┼─────┤                     │
│ 9AM  10AM  11AM  12PM  1PM   2PM                     │
│      └──── LASER CUT ────┘                          │
│                                                      │
│ Due: Today 4:00 PM                                   │
│ Ship Buffer: 1.5 hours ⚠️                           │
│ Risk Score: 72 (HIGH)                                │
│                                                      │
│ [Move Earlier] [Split Job] [Change WC] [Notify]     │
└───────────────────────────────────────────────────────┘
```

### 10.4 Board View (Kanban Style)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BOARD VIEW - Today's Jobs                                        [Filter▾] [+Add]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  UNSCHEDULED      SCHEDULED        IN PROCESS      COMPLETE         SHIPPED     │
│  (5 jobs)         (12 jobs)        (4 jobs)        (8 jobs)         (15 jobs)   │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐   ┌───────────┐    ┌──────────┐│
│  │ J-2455    │    │ J-2450 🔴 │    │ J-2440    │   │ J-2435    │    │ J-2420   ││
│  │ Delta     │    │ ACME Corp │    │ Echo Inc  │   │ Foxtrot   │    │ Golf Co  ││
│  │ Saw       │    │ Laser     │    │ Slit      │   │ Shear     │    │ ✓ Shipped││
│  │ Due: 1/19 │    │ Due: TODAY│    │ 🔄 45%    │   │ ✓ QC Pass │    │          ││
│  └───────────┘    ├───────────┤    └───────────┘   └───────────┘    └──────────┘│
│  ┌───────────┐    │ J-2451    │    ┌───────────┐   ┌───────────┐                 │
│  │ J-2456    │    │ Beta Ind  │    │ J-2442    │   │ J-2436    │                 │
│  │ Hotel     │    │ Saw+Slit  │    │ India LLC │   │ Juliet    │                 │
│  │ Laser     │    │ Due: 1/18 │    │ 🔄 80%    │   │ ✓ Packed  │                 │
│  │ Due: 1/20 │    └───────────┘    └───────────┘   └───────────┘                 │
│  └───────────┘    ┌───────────┐                                                  │
│                   │ J-2452    │                                                  │
│  ══════════════   │ Charlie   │   ══════════════   ══════════════               │
│  Drag here to     │ Shear     │   Drag to mark     Drag to move                 │
│  schedule         │ Due: 1/19 │   as started       to complete                  │
│                   └───────────┘                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.5 Load Chart View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CAPACITY LOAD - Week of Jan 17                                   [Export] [Print]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  100% ┤                        ████                                              │
│   90% ┤              ████      ████  ████                                        │
│   80% ┤  ████  ████  ████ ████ ████  ████ ████      ────────────────────────    │
│   70% ┤  ████  ████  ████ ████ ████  ████ ████     │ ████ Committed Load    │   │
│   60% ┤  ████  ████  ████ ████ ████  ████ ████     │ ░░░░ Available         │   │
│   50% ┤  ████  ████  ████ ████ ████  ████ ████     │ ─── Target (85%)       │   │
│   40% ┤  ████  ████  ████ ████ ████  ████ ████      ────────────────────────    │
│   30% ┤  ████  ████  ████ ████ ████  ████ ████                                   │
│   20% ┤  ████  ████  ████ ████ ████  ████ ████                                   │
│   10% ┤  ████  ████  ████ ████ ████  ████ ████                                   │
│    0% ┼──────────────────────────────────────────                                │
│        Laser  Saw   Shear Slit  Bend  Grind Pack                                │
│                                                                                  │
│  WEEKLY SUMMARY                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │ Work Center  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Avg  │ Status           │  │
│  │──────────────│──────│──────│──────│──────│──────│──────│──────────────────│  │
│  │ Laser Pool   │  85% │  78% │  92% │  75% │  68% │  80% │ ✓ Optimal       │  │
│  │ Saw Pool     │  91% │  88% │  85% │  90% │  82% │  87% │ ⚠️ Near Full    │  │
│  │ Shear Pool   │  72% │  80% │  76% │  78% │  65% │  74% │ ✓ Optimal       │  │
│  │ Slit Pool    │  95% │  98% │ 102% │  88% │  78% │  92% │ 🔴 Overloaded   │  │
│  │ Bend         │  45% │  52% │  60% │  48% │  35% │  48% │ ⚪ Underloaded  │  │
│  │ Packaging    │  60% │  65% │  70% │  62% │  55% │  62% │ ✓ Optimal       │  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.6 Risk Monitor Panel

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SLA RISK MONITOR                                               [Refresh] [Config]│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ 🔴 CRITICAL         │  │ 🟠 HIGH             │  │ 🟡 MEDIUM           │      │
│  │      2              │  │      5              │  │      8              │      │
│  │ jobs at risk        │  │ jobs at risk        │  │ jobs to watch       │      │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘      │
│                                                                                  │
│  CRITICAL JOBS (Immediate Action Required)                                       │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │ Job ID  │ Customer      │ Due        │ Risk   │ Issue              │ Action │ │
│  │─────────│───────────────│────────────│────────│────────────────────│────────│ │
│  │ J-2450  │ ACME Corp     │ Today 4PM  │ 85     │ WC overloaded      │ [Act]  │ │
│  │ J-2448  │ Premier Steel │ Today 6PM  │ 78     │ QC hold            │ [Act]  │ │
│                                                                                  │
│  HIGH RISK JOBS (Review within 2 hours)                                         │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │ J-2451  │ Beta Ind      │ Tomorrow   │ 65     │ Multi-op, tight    │ [View] │ │
│  │ J-2453  │ Charlie Ltd   │ Tomorrow   │ 62     │ Material pending   │ [View] │ │
│  │ ...     │ ...           │ ...        │ ...    │ ...                │ ...    │ │
│                                                                                  │
│  TRENDS                                                                          │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  On-Time Delivery (Last 7 Days): 94% ████████████████████░░░░                   │
│  Average Lead Time: 2.3 days (Target: 2.5) ✓                                    │
│  SLA Breaches This Week: 3 (Target: <5) ⚠️                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.7 Interactive Features

| Feature              | Interaction                         | Result                                      |
|----------------------|-------------------------------------|---------------------------------------------|
| Drag job to timeline | Drag from queue to work center row  | Schedules job at dropped time               |
| Resize job block     | Drag edges of Gantt block           | Adjusts estimated time (with validation)    |
| Click job block      | Single click                        | Shows detail popover                        |
| Double-click block   | Double click                        | Opens full job editing modal                |
| Right-click block    | Context menu                        | Move, split, bump, notify options           |
| Hover work center    | Hover on row header                 | Shows capacity summary tooltip              |
| Click risk card      | Click on risk score                 | Shows risk factors and actions              |
| Drag between columns | Drag in board view                  | Changes job status (with validations)       |
| Filter toggle        | Click filter chips                  | Shows/hides jobs by criteria                |
| Time zoom            | Scroll wheel on timeline            | Zooms in/out (hour/day/week)                |

### 10.8 Mobile/Tablet Companion View

```
┌─────────────────────────────┐
│ ≡  SCHEDULE                 │
├─────────────────────────────┤
│ TODAY - Jan 17              │
│                             │
│ 🔴 2 Critical  🟠 5 High    │
│                             │
│ MY WORK CENTER: LASER-01    │
│ ─────────────────────────── │
│ NOW                         │
│ ┌─────────────────────────┐ │
│ │ J-2450 - ACME Corp      │ │
│ │ 25 sheets, 0.25" steel  │ │
│ │ Est: 2.5 hrs            │ │
│ │ [Start] [View Docs]     │ │
│ └─────────────────────────┘ │
│                             │
│ NEXT UP                     │
│ ┌─────────────────────────┐ │
│ │ J-2455 - Delta Corp     │ │
│ │ Setup in ~2.5 hrs       │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ J-2460 - Echo LLC       │ │
│ │ Est start: 3:00 PM      │ │
│ └─────────────────────────┘ │
│                             │
│ [All Jobs] [Report Issue]   │
└─────────────────────────────┘
```

---

## 11. DATABASE SCHEMA (Key Tables)

```sql
-- Work Center Definition
CREATE TABLE work_centers (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL,
  facility_id VARCHAR(20) NOT NULL,
  capacity_unit VARCHAR(20) NOT NULL,
  base_capacity_per_hour DECIMAL(10,2) NOT NULL,
  shifts_per_day INT DEFAULT 1,
  hours_per_shift DECIMAL(4,2) DEFAULT 8,
  avg_setup_minutes INT DEFAULT 15,
  parallel_operators INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Work Center Capacity (daily snapshot)
CREATE TABLE work_center_capacity (
  id SERIAL PRIMARY KEY,
  work_center_id VARCHAR(20) REFERENCES work_centers(id),
  date DATE NOT NULL,
  available_hours DECIMAL(6,2) NOT NULL,
  scheduled_hours DECIMAL(6,2) DEFAULT 0,
  remaining_hours DECIMAL(6,2) GENERATED ALWAYS AS (available_hours - scheduled_hours) STORED,
  load_percentage DECIMAL(5,2) GENERATED ALWAYS AS ((scheduled_hours / available_hours) * 100) STORED,
  status VARCHAR(20) DEFAULT 'AVAILABLE',
  UNIQUE(work_center_id, date)
);

-- Schedule Slots
CREATE TABLE schedule_slots (
  id SERIAL PRIMARY KEY,
  work_center_id VARCHAR(20) REFERENCES work_centers(id),
  job_id VARCHAR(30) REFERENCES jobs(id),
  operation_id VARCHAR(30) NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  setup_minutes INT DEFAULT 0,
  run_minutes INT NOT NULL,
  status VARCHAR(20) DEFAULT 'SCHEDULED',
  priority INT DEFAULT 3,
  sequence_number INT NOT NULL,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SLA Risk Scores
CREATE TABLE sla_risk_scores (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(30) REFERENCES jobs(id),
  calculated_at TIMESTAMP DEFAULT NOW(),
  risk_score DECIMAL(5,2) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  factors JSONB NOT NULL,
  recommended_action TEXT,
  is_current BOOLEAN DEFAULT true
);

-- Schedule Changes Log
CREATE TABLE schedule_change_log (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(30) REFERENCES jobs(id),
  change_type VARCHAR(30) NOT NULL, -- RESCHEDULE, BUMP, SPLIT, CANCEL
  from_slot_id INT REFERENCES schedule_slots(id),
  to_slot_id INT REFERENCES schedule_slots(id),
  reason TEXT,
  initiated_by VARCHAR(50),
  approved_by VARCHAR(50),
  cascaded_jobs JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Operation Time Standards
CREATE TABLE operation_standards (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(30) NOT NULL,
  material_type VARCHAR(30),
  thickness_min DECIMAL(8,4),
  thickness_max DECIMAL(8,4),
  complexity VARCHAR(20) DEFAULT 'STANDARD',
  base_setup_minutes INT NOT NULL,
  unit_time_minutes DECIMAL(8,2) NOT NULL,
  efficiency_factor DECIMAL(4,2) DEFAULT 0.85,
  notes TEXT,
  UNIQUE(operation_type, material_type, thickness_min, thickness_max, complexity)
);
```

---

## 12. API ENDPOINTS

```typescript
// Scheduling APIs
POST   /api/schedule/jobs/{jobId}/assign
       Body: { workCenterId, date, preferredTime?, priority? }
       
GET    /api/schedule/work-centers/{wcId}/slots?date=YYYY-MM-DD
       Returns: Available and scheduled slots for the day
       
POST   /api/schedule/jobs/{jobId}/reschedule
       Body: { newWorkCenterId?, newDate, newTime, reason }
       
POST   /api/schedule/jobs/{jobId}/split
       Body: { quantities: [50, 30], assignSlots: boolean }
       
DELETE /api/schedule/slots/{slotId}
       Removes job from schedule (returns to queue)

// Capacity APIs
GET    /api/capacity/work-centers?date=YYYY-MM-DD&range=7
       Returns: Load summary for all work centers over date range
       
GET    /api/capacity/work-centers/{wcId}/load?date=YYYY-MM-DD
       Returns: Detailed load breakdown for specific work center
       
POST   /api/capacity/what-if
       Body: { jobs: [...], scenario: 'ADD_RUSH' | 'EQUIPMENT_DOWN' }
       Returns: Impact analysis

// Promise Date APIs
POST   /api/promise/calculate
       Body: { productId, quantity, specifications, preferredDate? }
       Returns: { promiseDate, confidence, alternatives }
       
GET    /api/promise/validate/{jobId}
       Returns: Current promise feasibility and risk

// Risk APIs
GET    /api/risk/jobs?level=CRITICAL,HIGH
       Returns: Jobs at specified risk levels
       
GET    /api/risk/jobs/{jobId}/score
       Returns: Detailed risk breakdown
       
POST   /api/risk/jobs/{jobId}/mitigate
       Body: { action: 'EXPEDITE' | 'SPLIT' | 'ALTERNATE_WC' }
       Returns: Result of mitigation action
```

---

## 13. IMPLEMENTATION PRIORITIES

### Phase 1 (MVP)
1. Work center setup and capacity configuration
2. Basic manual scheduling (drag-drop)
3. Simple load visualization (bar chart)
4. Due date calculation (forward scheduling)
5. Basic risk alerts (due date approaching)

### Phase 2 (Optimization)
1. Automated scheduling suggestions
2. Setup optimization (campaign scheduling)
3. Multi-work-center routing
4. Bump logic and cascade detection
5. Historical time adjustments

### Phase 3 (Advanced)
1. Multi-facility scheduling
2. AI-based demand forecasting
3. Predictive maintenance integration
4. Real-time equipment monitoring
5. Customer self-service date changes

---

**End of Scheduling & Capacity Planning Model**
