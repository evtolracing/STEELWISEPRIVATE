# Phase 15: Capacity Planning AI & Predictive Operations

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** AI/ML Systems Architecture Specification

---

## 1. EXECUTIVE SUMMARY

This document defines how machine learning and predictive models enhance operational decision-making across routing, scheduling, due date promises, load balancing, and SLA risk prediction within the SteelWise platform.

### AI-Enhanced Operations Vision

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AI-ENHANCED OPERATIONS ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TRADITIONAL APPROACH                    AI-ENHANCED APPROACH                   │
│  ════════════════════                    ═══════════════════                   │
│                                                                                 │
│  ┌─────────────────────┐                ┌─────────────────────┐                │
│  │ ORDER ARRIVES       │                │ ORDER ARRIVES       │                │
│  └──────────┬──────────┘                └──────────┬──────────┘                │
│             │                                      │                            │
│             ▼                                      ▼                            │
│  ┌─────────────────────┐                ┌─────────────────────┐                │
│  │ Planner manually    │                │ AI ROUTING MODEL    │                │
│  │ assigns to work     │                │ • Predict best path │                │
│  │ center based on     │                │ • Consider capacity │                │
│  │ experience          │                │ • Optimize for SLA  │                │
│  └──────────┬──────────┘                └──────────┬──────────┘                │
│             │                                      │                            │
│             ▼                                      ▼                            │
│  ┌─────────────────────┐                ┌─────────────────────┐                │
│  │ Scheduler places    │                │ AI SCHEDULING       │                │
│  │ in queue based on   │                │ • Sequence optimize │                │
│  │ due date            │                │ • Setup minimize    │                │
│  │                     │                │ • Balance load      │                │
│  └──────────┬──────────┘                └──────────┬──────────┘                │
│             │                                      │                            │
│             ▼                                      ▼                            │
│  ┌─────────────────────┐                ┌─────────────────────┐                │
│  │ Promise date =      │                │ AI DUE DATE         │                │
│  │ Today + standard    │                │ • Real capacity     │                │
│  │ lead time           │                │ • Queue depth       │                │
│  │                     │                │ • Historical perf   │                │
│  └──────────┬──────────┘                └──────────┬──────────┘                │
│             │                                      │                            │
│             ▼                                      ▼                            │
│  ┌─────────────────────┐                ┌─────────────────────┐                │
│  │ Issues discovered   │                │ AI RISK PREDICTION  │                │
│  │ when jobs are       │                │ • Early warning     │                │
│  │ already late        │                │ • Proactive alerts  │                │
│  │                     │                │ • Mitigation suggest│                │
│  └─────────────────────┘                └─────────────────────┘                │
│                                                                                 │
│  RESULT: Reactive                       RESULT: Proactive                       │
│  • 85% on-time                          • 96% on-time                          │
│  • Expedite costs high                  • Lower expedite costs                 │
│  • Customer complaints                  • Customer confidence                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### AI Model Portfolio

| Model | Purpose | Primary Benefit |
|-------|---------|-----------------|
| **Routing Optimizer** | Select optimal processing path | Minimize cost & time |
| **Scheduling Engine** | Sequence jobs optimally | Maximize throughput |
| **Due Date Predictor** | Accurate promise dates | Customer trust |
| **Load Balancer** | Distribute work evenly | Prevent bottlenecks |
| **SLA Risk Predictor** | Early warning system | Proactive intervention |
| **Demand Forecaster** | Predict future load | Capacity planning |

---

## 2. DATA PREREQUISITES

### 2.1 Required Data Sources

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCES FOR AI MODELS                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  HISTORICAL OPERATIONS DATA (Minimum 6 months, ideal 2+ years)                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  WORK ORDER HISTORY                                                     │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Work order ID, type, division                                        │   │
│  │  • Product/material specifications                                      │   │
│  │  • Requested operations (cut, bend, etc.)                               │   │
│  │  • Quantity, dimensions                                                 │   │
│  │  • Priority, customer tier                                              │   │
│  │  • Created timestamp                                                    │   │
│  │  • Promised due date                                                    │   │
│  │  • Actual completion timestamp                                          │   │
│  │  • On-time vs late (label)                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  OPERATION HISTORY                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Operation ID, work order ID                                          │   │
│  │  • Work center ID                                                       │   │
│  │  • Operation type                                                       │   │
│  │  • Operator ID                                                          │   │
│  │  • Queue entry time                                                     │   │
│  │  • Start time                                                           │   │
│  │  • End time                                                             │   │
│  │  • Actual runtime (minutes)                                             │   │
│  │  • Pieces in, pieces out                                                │   │
│  │  • Scrap/rework flag                                                    │   │
│  │  • Hold events (with reasons)                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  WORK CENTER DATA                                                       │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Work center ID, type, capabilities                                   │   │
│  │  • Shift schedule                                                       │   │
│  │  • Planned maintenance windows                                          │   │
│  │  • Unplanned downtime events (with duration)                            │   │
│  │  • Throughput capacity (theoretical)                                    │   │
│  │  • Setup times by transition type                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  OPERATOR DATA                                                          │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Operator ID, certifications                                          │   │
│  │  • Shift assignments                                                    │   │
│  │  • Performance metrics by operation type                                │   │
│  │  • Attendance patterns                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  REAL-TIME DATA                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  CURRENT STATE                                                          │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Current queue depth per work center                                  │   │
│  │  • Jobs in progress (with elapsed time)                                 │   │
│  │  • Work center status (running, idle, down)                             │   │
│  │  • Operator assignments                                                 │   │
│  │  • Pending work orders (not yet scheduled)                              │   │
│  │  • Inventory availability                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  EXTERNAL DATA                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Calendar (holidays, weekends)                                        │   │
│  │  • Weather (for logistics predictions)                                  │   │
│  │  • Supplier lead times                                                  │   │
│  │  • Carrier transit times                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Quality Requirements

```typescript
interface DataQualityMetrics {
  // Completeness
  completeness: {
    workOrderHistory: number;     // % with all required fields
    operationTimestamps: number;  // % with start/end times
    workcenterStatus: number;     // % uptime with status data
    minimumThreshold: 0.95;       // 95% completeness required
  };
  
  // Accuracy
  accuracy: {
    timestampPrecision: 'MINUTE'; // Minimum precision
    durationCalculation: 'VALIDATED'; // End - Start matches recorded
    operatorAttribution: number;  // % operations with operator ID
    minimumThreshold: 0.98;
  };
  
  // Timeliness
  timeliness: {
    realTimeDataLag: 'SECONDS';   // Max lag for real-time data
    historyRefresh: 'HOURLY';     // How often history is updated
    eventCapture: 'IMMEDIATE';    // When events are recorded
  };
  
  // Volume
  volume: {
    minimumWorkOrders: 10000;     // Min historical work orders
    minimumOperations: 50000;     // Min historical operations
    minimumMonths: 6;             // Min time span
  };
}
```

### 2.3 Feature Engineering

```typescript
// Derived features for ML models
interface DerivedFeatures {
  // Time-based features
  temporal: {
    dayOfWeek: number;            // 0-6
    hourOfDay: number;            // 0-23
    weekOfYear: number;           // 1-52
    isHoliday: boolean;
    isMonthEnd: boolean;          // Higher volume typically
    daysUntilDue: number;
    shiftNumber: number;          // 1, 2, 3
  };
  
  // Load features
  load: {
    currentQueueDepth: number;    // Jobs waiting
    queueHoursAhead: number;      // Estimated hours in queue
    utilizationLast24h: number;   // % capacity used
    utilizationTrend: number;     // Increasing/decreasing
    pendingHighPriority: number;  // Count of rush jobs
  };
  
  // Job complexity features
  complexity: {
    operationCount: number;       // Number of steps
    uniqueWorkcenters: number;    // How many different machines
    totalEstimatedTime: number;   // Sum of estimated times
    hasSpecialRequirements: boolean;
    requiresCertification: boolean;
    materialComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  // Historical performance features
  performance: {
    avgCompletionRatio: number;   // Actual / Estimated (rolling)
    variabilityScore: number;     // Std dev of completion ratios
    scrapRateLast30d: number;     // % scrapped
    reworkRateLast30d: number;    // % reworked
    operatorEfficiency: number;   // Individual operator metric
  };
  
  // Customer features
  customer: {
    customerTier: 'STANDARD' | 'PREFERRED' | 'STRATEGIC';
    historicalOnTimeRate: number; // Our performance for this customer
    orderFrequency: number;       // Orders per month
    averageOrderSize: number;
  };
}
```

---

## 3. ROUTING OPTIMIZATION MODEL

### 3.1 Model Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ROUTING OPTIMIZATION MODEL                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PROBLEM: Given a work order, select the optimal sequence of work centers      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  Example: 1/4" x 48" x 96" A36 Plate, cut to (8) 12" x 24" pieces              │
│                                                                                 │
│  Possible Routes:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Route A: Plasma Cutter #1                                              │   │
│  │           Est. Time: 45 min | Queue: 2 hrs | Cost: $85                  │   │
│  │                                                                         │   │
│  │  Route B: Plasma Cutter #2                                              │   │
│  │           Est. Time: 50 min | Queue: 30 min | Cost: $90                 │   │
│  │                                                                         │   │
│  │  Route C: Saw #1 → Shear #1                                             │   │
│  │           Est. Time: 35 + 20 min | Queue: 1 hr + 45 min | Cost: $75     │   │
│  │                                                                         │   │
│  │  Route D: Laser Cutter                                                  │   │
│  │           Est. Time: 30 min | Queue: 4 hrs | Cost: $120                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MODEL ARCHITECTURE                                                             │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│                         ┌─────────────────────────┐                            │
│                         │      WORK ORDER         │                            │
│                         │      FEATURES           │                            │
│                         └───────────┬─────────────┘                            │
│                                     │                                           │
│                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ROUTE CANDIDATE GENERATOR                            │   │
│  │  • Constraint-based enumeration of valid routes                         │   │
│  │  • Filters by capability, material, dimensions                          │   │
│  │  • Typically 3-10 candidate routes                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                           │
│                    ┌────────────────┼────────────────┐                         │
│                    │                │                │                         │
│                    ▼                ▼                ▼                         │
│           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│           │   Route A    │ │   Route B    │ │   Route C    │                  │
│           │   Features   │ │   Features   │ │   Features   │                  │
│           └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                  │
│                  │                │                │                           │
│                  └────────────────┼────────────────┘                           │
│                                   │                                            │
│                                   ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ROUTE SCORING MODEL                                  │   │
│  │                    (Gradient Boosted Trees / Neural Network)            │   │
│  │                                                                         │   │
│  │  Predicts for each route:                                               │   │
│  │  • Estimated completion time (regression)                               │   │
│  │  • Probability of on-time completion (classification)                   │   │
│  │  • Estimated total cost                                                 │   │
│  │  • Risk score (0-100)                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                            │
│                                   ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MULTI-OBJECTIVE OPTIMIZER                            │   │
│  │                                                                         │   │
│  │  Objective weights (configurable):                                      │   │
│  │  • Minimize time: 40%                                                   │   │
│  │  • Maximize on-time probability: 35%                                    │   │
│  │  • Minimize cost: 20%                                                   │   │
│  │  • Minimize risk: 5%                                                    │   │
│  │                                                                         │   │
│  │  Output: Ranked list of routes with composite scores                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                            │
│                                   ▼                                            │
│                         ┌─────────────────────────┐                            │
│                         │   RECOMMENDED ROUTE     │                            │
│                         │   + Alternatives        │                            │
│                         └─────────────────────────┘                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Model Inputs & Outputs

```typescript
interface RoutingModelInput {
  // Work order details
  workOrder: {
    workOrderId: string;
    productId: string;
    materialGrade: string;
    materialThickness: number;
    materialWidth: number;
    materialLength: number;
    quantity: number;
    operations: OperationType[];
    priority: 'STANDARD' | 'RUSH' | 'CRITICAL';
    customerTier: string;
    requestedDueDate: Date;
  };
  
  // Current state
  currentState: {
    timestamp: Date;
    workCenterStatus: WorkCenterStatus[];
    currentQueues: QueueState[];
    scheduledMaintenance: MaintenanceWindow[];
    staffingLevel: StaffingState;
  };
  
  // Constraints
  constraints: {
    mustUseWorkCenters?: string[];    // Customer requirement
    mustAvoidWorkCenters?: string[];  // Blocked for some reason
    maxLeadTimeDays?: number;
    maxCost?: number;
  };
}

interface RoutingModelOutput {
  workOrderId: string;
  recommendedRoute: Route;
  alternativeRoutes: Route[];
  confidence: number;              // 0-1, model confidence
  explanations: RouteExplanation[];
}

interface Route {
  routeId: string;
  steps: RouteStep[];
  
  // Predictions
  predictions: {
    estimatedCompletionTime: number;    // Hours from now
    estimatedCompletionDate: Date;
    onTimeProbability: number;          // 0-1
    estimatedCost: number;
    riskScore: number;                  // 0-100
  };
  
  // Breakdown
  breakdown: {
    queueTime: number;
    processingTime: number;
    transitTime: number;
    bufferTime: number;
  };
  
  // Scoring
  compositeScore: number;
  rank: number;
}

interface RouteStep {
  stepNumber: number;
  workCenterId: string;
  workCenterName: string;
  operation: OperationType;
  
  // Timing
  estimatedQueueTime: number;     // Hours
  estimatedProcessingTime: number;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  
  // Current state
  currentQueueDepth: number;
  workCenterUtilization: number;
}

interface RouteExplanation {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  description: string;
  // e.g., "Plasma #2 has shorter queue (30 min vs 2 hrs) - saves 1.5 hrs"
}
```

### 3.3 Training Approach

```typescript
interface RoutingModelTraining {
  // Training data
  trainingData: {
    source: 'HISTORICAL_WORK_ORDERS';
    minRecords: 10000;
    features: DerivedFeatures;
    labels: {
      actualCompletionTime: number;
      wasOnTime: boolean;
      actualCost: number;
    };
  };
  
  // Model type
  modelType: 'GRADIENT_BOOSTED_TREES';  // XGBoost/LightGBM
  
  // Training schedule
  training: {
    frequency: 'WEEKLY';
    triggerOnDataVolume: 500;     // Retrain after 500 new records
    validationSplit: 0.2;
    crossValidationFolds: 5;
  };
  
  // Performance metrics
  metrics: {
    completionTimeMae: number;    // Mean Absolute Error (hours)
    onTimeAccuracy: number;       // Classification accuracy
    costMae: number;              // Cost prediction error
    
    // Thresholds for deployment
    minOnTimeAccuracy: 0.85;
    maxCompletionTimeMae: 2.0;    // Within 2 hours
  };
}
```

---

## 4. SCHEDULING OPTIMIZATION MODEL

### 4.1 Problem Formulation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SCHEDULING OPTIMIZATION MODEL                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PROBLEM: Given N jobs and M work centers, find optimal sequence               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  OBJECTIVES (Multi-objective optimization):                                     │
│  1. Minimize total tardiness (sum of late times)                               │
│  2. Maximize on-time completion count                                          │
│  3. Minimize total setup time                                                  │
│  4. Balance load across work centers                                           │
│  5. Minimize work-in-progress inventory                                        │
│                                                                                 │
│  CONSTRAINTS:                                                                   │
│  • Job precedence (operation A before operation B)                             │
│  • Work center capabilities (not all can do all operations)                    │
│  • Work center capacity (one job at a time per station)                        │
│  • Shift boundaries (jobs can't span shifts in some cases)                     │
│  • Maintenance windows (work centers unavailable)                              │
│  • Operator certifications (some ops require specific operators)               │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  APPROACH: Hybrid ML + Optimization                                             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  PHASE 1: ML-Based Duration Estimation                                  │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  For each job-operation-workcenter combination:                         │   │
│  │  • Predict processing time (with uncertainty bounds)                    │   │
│  │  • Predict setup time based on sequence                                 │   │
│  │  • Predict delay probability                                            │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  PHASE 2: Constraint-Based Optimization                                 │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  Algorithm: Genetic Algorithm + Local Search                            │   │
│  │  • Population of schedule candidates                                    │   │
│  │  • Fitness = weighted sum of objectives                                 │   │
│  │  • Crossover + mutation to explore space                                │   │
│  │  • Local search to refine solutions                                     │   │
│  │                                                                         │   │
│  │  OR: Constraint Programming (CP-SAT)                                    │   │
│  │  • Define constraints formally                                          │   │
│  │  • Use solver to find feasible/optimal solutions                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  PHASE 3: Schedule Robustness Analysis                                  │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  Monte Carlo simulation:                                                │   │
│  │  • Sample from duration uncertainty distributions                       │   │
│  │  • Simulate schedule 1000x                                              │   │
│  │  • Calculate on-time probability for each job                           │   │
│  │  • Identify high-risk jobs                                              │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Model Inputs & Outputs

```typescript
interface SchedulingModelInput {
  // Planning horizon
  horizon: {
    startTime: Date;
    endTime: Date;                    // Typically 1-5 days
  };
  
  // Jobs to schedule
  jobs: ScheduleJob[];
  
  // Resources
  resources: {
    workCenters: WorkCenterDefinition[];
    operators: OperatorDefinition[];
    shifts: ShiftDefinition[];
  };
  
  // Current state
  currentState: {
    jobsInProgress: InProgressJob[];
    frozenSchedule: FrozenWindow;     // Already committed, don't change
  };
  
  // Preferences
  preferences: {
    objectiveWeights: {
      minimizeTardiness: number;
      maximizeOnTime: number;
      minimizeSetup: number;
      balanceLoad: number;
    };
    priorityRules: PriorityRule[];
  };
}

interface ScheduleJob {
  jobId: string;
  workOrderId: string;
  priority: number;                   // 1-10
  dueDate: Date;
  
  // Operations (in order)
  operations: {
    operationId: string;
    operationType: string;
    eligibleWorkCenters: string[];
    estimatedDuration: number;        // Base estimate
    durationUncertainty: number;      // Std dev
    requiredCertifications?: string[];
  }[];
  
  // Dependencies
  predecessors?: string[];            // Job IDs that must complete first
  
  // Special handling
  mustShipTogether?: string[];        // Job IDs to consolidate
  customerSLA?: number;               // SLA tier affecting priority
}

interface SchedulingModelOutput {
  schedule: ScheduledJob[];
  
  // Quality metrics
  metrics: {
    totalTardiness: number;           // Hours of combined lateness
    onTimeCount: number;
    onTimeRate: number;
    totalSetupTime: number;
    loadBalanceScore: number;         // 0-1, higher = more balanced
    makespan: number;                 // Total time to complete all
  };
  
  // Risk assessment
  atRiskJobs: {
    jobId: string;
    onTimeProbability: number;
    riskFactors: string[];
    suggestedActions: string[];
  }[];
  
  // Alternatives
  alternativeSchedules?: AlternativeSchedule[];
}

interface ScheduledJob {
  jobId: string;
  operations: ScheduledOperation[];
  
  // Predicted outcomes
  expectedCompletionTime: Date;
  onTimeProbability: number;
  bufferTime: number;                 // Slack before due date
}

interface ScheduledOperation {
  operationId: string;
  workCenterId: string;
  operatorId?: string;
  
  // Timing
  scheduledStart: Date;
  scheduledEnd: Date;
  setupTime: number;
  processingTime: number;
  
  // Sequence position
  sequencePosition: number;           // 1st, 2nd, etc. at this work center
}
```

### 4.3 Scheduling Algorithm

```typescript
class SchedulingOptimizer {
  
  async optimizeSchedule(input: SchedulingModelInput): Promise<SchedulingModelOutput> {
    
    // Phase 1: ML-based duration prediction
    const durationPredictions = await this.predictDurations(input.jobs);
    
    // Phase 2: Generate initial solution using dispatching rules
    let currentSchedule = this.generateInitialSchedule(input, durationPredictions);
    
    // Phase 3: Optimization loop (Genetic Algorithm)
    const population = this.initializePopulation(currentSchedule, 50);
    
    for (let generation = 0; generation < 100; generation++) {
      // Evaluate fitness
      const fitness = population.map(s => this.evaluateFitness(s, input.preferences));
      
      // Selection
      const parents = this.tournamentSelection(population, fitness);
      
      // Crossover
      const offspring = this.crossover(parents);
      
      // Mutation
      const mutated = this.mutate(offspring, input);
      
      // Local search on best solutions
      const improved = this.localSearch(mutated.slice(0, 10));
      
      // Replace population
      population = this.selectNextGeneration(population, improved, fitness);
      
      // Early termination if converged
      if (this.hasConverged(population)) break;
    }
    
    const bestSchedule = this.getBest(population);
    
    // Phase 4: Robustness analysis
    const riskAnalysis = await this.monteCarloSimulation(bestSchedule, durationPredictions);
    
    return {
      schedule: bestSchedule,
      metrics: this.calculateMetrics(bestSchedule),
      atRiskJobs: riskAnalysis.atRiskJobs,
      alternativeSchedules: this.getAlternatives(population)
    };
  }
  
  private evaluateFitness(schedule: Schedule, weights: ObjectiveWeights): number {
    const tardiness = this.calculateTardiness(schedule);
    const onTimeRate = this.calculateOnTimeRate(schedule);
    const setupTime = this.calculateTotalSetup(schedule);
    const loadBalance = this.calculateLoadBalance(schedule);
    
    return (
      weights.minimizeTardiness * (1 - tardiness / this.maxTardiness) +
      weights.maximizeOnTime * onTimeRate +
      weights.minimizeSetup * (1 - setupTime / this.maxSetup) +
      weights.balanceLoad * loadBalance
    );
  }
}
```

---

## 5. DUE DATE PREDICTION MODEL

### 5.1 Model Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       DUE DATE PREDICTION MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PURPOSE: Predict realistic, achievable due dates at order entry               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  TRADITIONAL: "Standard lead time is 5 business days"                   │   │
│  │               ↓                                                         │   │
│  │  Result: 15% late when busy, overpromised when slow                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  AI-ENHANCED: Predict based on current reality                          │   │
│  │               ↓                                                         │   │
│  │  Result: 95%+ on-time with right-sized promises                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MODEL COMPONENTS                                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│         ORDER DETAILS                      CURRENT STATE                        │
│  ┌─────────────────────┐            ┌─────────────────────┐                    │
│  │ • Product/material  │            │ • Queue depths      │                    │
│  │ • Quantity          │            │ • WC utilization    │                    │
│  │ • Operations needed │            │ • Staff levels      │                    │
│  │ • Customer tier     │            │ • Pending orders    │                    │
│  └──────────┬──────────┘            └──────────┬──────────┘                    │
│             │                                   │                               │
│             └───────────────┬───────────────────┘                               │
│                             │                                                   │
│                             ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ENSEMBLE MODEL                                       │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │   │
│  │  │  Regression     │  │  Quantile       │  │  Survival       │         │   │
│  │  │  Model          │  │  Regression     │  │  Analysis       │         │   │
│  │  │  (Point Est.)   │  │  (Confidence)   │  │  (Probability)  │         │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │   │
│  │           │                    │                    │                   │   │
│  │           └────────────────────┼────────────────────┘                   │   │
│  │                                │                                        │   │
│  │                                ▼                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │               PREDICTION AGGREGATOR                             │   │   │
│  │  │                                                                 │   │   │
│  │  │  • Point estimate (most likely)                                 │   │   │
│  │  │  • Confidence interval (80%, 95%)                               │   │   │
│  │  │  • Risk-adjusted promise (based on customer tier)               │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                             │                                                   │
│                             ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    DATE OPTIONS GENERATOR                               │   │
│  │                                                                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐     │   │
│  │  │  STANDARD: Jan 24 (95% confidence)                            │     │   │
│  │  │  "We're confident we can deliver by this date"                │     │   │
│  │  └───────────────────────────────────────────────────────────────┘     │   │
│  │                                                                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐     │   │
│  │  │  AGGRESSIVE: Jan 22 (70% confidence) + $150 rush fee          │     │   │
│  │  │  "Possible but we may need to expedite"                       │     │   │
│  │  └───────────────────────────────────────────────────────────────┘     │   │
│  │                                                                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐     │   │
│  │  │  ECONOMY: Jan 28 (99% confidence) - 5% discount               │     │   │
│  │  │  "Flexible timing saves cost"                                 │     │   │
│  │  └───────────────────────────────────────────────────────────────┘     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Model Inputs & Outputs

```typescript
interface DueDateModelInput {
  // Order details
  order: {
    orderId?: string;             // Null for quote-time prediction
    items: {
      productId: string;
      quantity: number;
      operations: OperationType[];
    }[];
    customerTier: 'STANDARD' | 'PREFERRED' | 'STRATEGIC';
    shipToLocation: string;       // For transit time calculation
  };
  
  // Current state snapshot
  currentState: {
    timestamp: Date;
    queueSnapshot: QueueState[];
    pendingOrders: number;
    scheduledMaintenance: MaintenanceWindow[];
    currentShift: ShiftInfo;
  };
  
  // Request parameters
  request: {
    requestedDate?: Date;         // Customer's requested date
    confidenceLevel: number;      // 0.8, 0.9, 0.95
    includeOptions: boolean;      // Generate multiple date options
  };
}

interface DueDateModelOutput {
  // Primary prediction
  prediction: {
    recommendedDate: Date;
    confidenceLevel: number;
    confidenceInterval: {
      lower: Date;                // e.g., 80% chance after this
      upper: Date;                // e.g., 80% chance before this
    };
  };
  
  // Breakdown
  breakdown: {
    processingTime: number;       // Hours
    queueTime: number;            // Hours
    transitTime: number;          // Hours
    bufferTime: number;           // Hours (safety margin)
    totalLeadTime: number;        // Hours
    businessDays: number;
  };
  
  // Risk factors
  riskFactors: {
    factor: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }[];
  
  // Date options
  options?: DateOption[];
  
  // Comparison to requested
  requestedDateAnalysis?: {
    requestedDate: Date;
    achievableProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: 'ACCEPT' | 'NEGOTIATE' | 'DECLINE';
    suggestedAlternative?: Date;
  };
}

interface DateOption {
  optionType: 'STANDARD' | 'RUSH' | 'ECONOMY';
  date: Date;
  confidenceLevel: number;
  priceAdjustment: number;        // +$150 or -5%
  description: string;
  tradeoffs: string[];
}
```

### 5.3 Customer Tier Adjustments

```typescript
// Different promise strategies by customer tier
const tierStrategies = {
  STRATEGIC: {
    targetConfidence: 0.98,       // Higher confidence = more buffer
    priorityBoost: 2,             // Higher priority in scheduling
    bufferMultiplier: 1.2,        // 20% extra buffer
    rushAvailable: true,
    description: 'Conservative promises, always deliver early'
  },
  
  PREFERRED: {
    targetConfidence: 0.95,
    priorityBoost: 1,
    bufferMultiplier: 1.1,
    rushAvailable: true,
    description: 'Balanced approach with good reliability'
  },
  
  STANDARD: {
    targetConfidence: 0.90,
    priorityBoost: 0,
    bufferMultiplier: 1.0,
    rushAvailable: false,         // No rush option for standard
    description: 'Standard lead times, acceptable risk'
  }
};
```

---

## 6. LOAD BALANCING MODEL

### 6.1 Model Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCING MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PURPOSE: Distribute work evenly across work centers to prevent bottlenecks    │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  CURRENT STATE VISUALIZATION                                                    │
│                                                                                 │
│  Work Center Load (next 8 hours):                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Saw #1      ████████████████████████████████████░░░░░░░░░░░  85%      │   │
│  │  Saw #2      ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  35%      │   │
│  │  Plasma #1   █████████████████████████████████████████████████  98%    │   │
│  │  Plasma #2   ████████████████████████████░░░░░░░░░░░░░░░░░░░░  62%      │   │
│  │  Shear #1    ██████████████████████████████████████░░░░░░░░░░  78%      │   │
│  │  Brake #1    ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  15%      │   │
│  │                                                                         │   │
│  │  ⚠️  IMBALANCE DETECTED: Plasma #1 overloaded, Brake #1 underutilized  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MODEL COMPONENTS                                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LOAD FORECASTER                                      │   │
│  │                                                                         │   │
│  │  For each work center, predict:                                         │   │
│  │  • Current queue duration (hours)                                       │   │
│  │  • Incoming work (next 4, 8, 24 hours)                                  │   │
│  │  • Completion rate (jobs/hour)                                          │   │
│  │  • Projected load curve                                                 │   │
│  │                                                                         │   │
│  │  Uses:                                                                  │   │
│  │  • Current queue state                                                  │   │
│  │  • Pending orders (not yet work orders)                                 │   │
│  │  • Historical arrival patterns (by day/hour)                            │   │
│  │  • Seasonal patterns                                                    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    IMBALANCE DETECTOR                                   │   │
│  │                                                                         │   │
│  │  Metrics:                                                               │   │
│  │  • Load variance across similar work centers                            │   │
│  │  • Queue time differential                                              │   │
│  │  • Bottleneck probability score                                         │   │
│  │                                                                         │   │
│  │  Triggers when:                                                         │   │
│  │  • Any WC > 90% while similar WC < 50%                                  │   │
│  │  • Queue time difference > 2 hours for similar capability               │   │
│  │  • Projected bottleneck in next 4 hours                                 │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    REBALANCING RECOMMENDER                              │   │
│  │                                                                         │   │
│  │  For each imbalance, suggest:                                           │   │
│  │  • Jobs to move (lowest priority first)                                 │   │
│  │  • Target work center                                                   │   │
│  │  • Expected impact (queue time reduction)                               │   │
│  │  • Confidence score                                                     │   │
│  │                                                                         │   │
│  │  Constraints:                                                           │   │
│  │  • Don't move jobs already started                                      │   │
│  │  • Respect capability requirements                                      │   │
│  │  • Consider transition costs (may not be worth it)                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Model Inputs & Outputs

```typescript
interface LoadBalancingInput {
  // Time horizon
  horizon: {
    analysisWindow: number;        // Hours to analyze (e.g., 8)
    forecastWindow: number;        // Hours to forecast (e.g., 24)
  };
  
  // Current state
  workCenters: {
    workCenterId: string;
    type: string;                  // For grouping similar WCs
    capabilities: string[];
    currentQueue: QueuedJob[];
    jobInProgress?: InProgressJob;
    status: 'RUNNING' | 'IDLE' | 'DOWN';
    efficiency: number;            // 0-1, current shift efficiency
  }[];
  
  // Pending work
  incomingWork: {
    workOrderId: string;
    requiredCapability: string;
    estimatedDuration: number;
    dueDate: Date;
    priority: number;
    eligibleWorkCenters: string[];
  }[];
  
  // Constraints
  constraints: {
    minMoveValue: number;          // Hours saved must exceed this
    maxMovesPerCycle: number;      // Don't destabilize too much
    frozenJobs: string[];          // Jobs that can't be moved
  };
}

interface LoadBalancingOutput {
  // Current state analysis
  currentState: {
    workCenterLoads: {
      workCenterId: string;
      currentLoad: number;         // 0-1
      queueHours: number;
      projectedLoad4h: number;
      projectedLoad8h: number;
    }[];
    overallBalance: number;        // 0-1, higher = more balanced
    bottlenecks: string[];         // Work center IDs
  };
  
  // Recommendations
  recommendations: LoadBalanceRecommendation[];
  
  // Forecast
  forecast: {
    expectedImbalances: {
      workCenterId: string;
      expectedTime: Date;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      cause: string;
    }[];
  };
}

interface LoadBalanceRecommendation {
  recommendationId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // What to move
  action: {
    type: 'MOVE_JOB' | 'REASSIGN_INCOMING' | 'SPLIT_BATCH';
    jobId?: string;
    fromWorkCenter: string;
    toWorkCenter: string;
    quantity?: number;            // For batch splits
  };
  
  // Impact
  impact: {
    queueReductionMinutes: number;
    balanceImprovement: number;   // 0-1
    affectedDueDates: number;     // Count of jobs affected
  };
  
  // Confidence
  confidence: number;              // 0-1
  rationale: string;
}
```

---

## 7. SLA RISK PREDICTION MODEL

### 7.1 Model Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       SLA RISK PREDICTION MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PURPOSE: Early warning system for jobs at risk of missing SLA                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  TIMELINE                                                                       │
│                                                                                 │
│        Order      Risk        Risk          Risk         Due        Late       │
│        Created    Low         Medium        High         Date       (!)        │
│           │         │           │             │            │          │         │
│           ▼         ▼           ▼             ▼            ▼          ▼         │
│  ─────────●─────────●───────────●─────────────●────────────●──────────●──────▶ │
│           │         │           │             │            │          │         │
│           │         │           │             │            │          │         │
│           │         │     AI DETECTS RISK     │            │          │         │
│           │         │     HERE →→→→→→→→→→→   │            │          │         │
│           │         │                         │            │          │         │
│           │         │     Time to intervene   │            │          │         │
│           │         │     ←←←←←←←←←←←←←←←←←←←┘            │          │         │
│           │                                                │          │         │
│           │         TRADITIONAL: Discover risk here →→→→→→┘          │         │
│           │                      (Too late!)                          │         │
│                                                                                 │
│  MODEL ARCHITECTURE                                                             │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CONTINUOUS MONITORING                                │   │
│  │                    (Every 15 minutes)                                   │   │
│  │                                                                         │   │
│  │  For each active work order:                                            │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  1. Calculate remaining work                                    │   │   │
│  │  │  2. Calculate remaining time to due date                        │   │   │
│  │  │  3. Factor in current queue states                              │   │   │
│  │  │  4. Factor in historical performance patterns                   │   │   │
│  │  │  5. Apply ML model for risk probability                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    RISK CLASSIFICATION MODEL                            │   │
│  │                    (Gradient Boosted Classifier)                        │   │
│  │                                                                         │   │
│  │  Features:                                                              │   │
│  │  • Time remaining / Work remaining ratio                                │   │
│  │  • Queue position at next work center                                   │   │
│  │  • Historical on-time rate for similar jobs                             │   │
│  │  • Current work center utilization                                      │   │
│  │  • Day of week, time of day                                             │   │
│  │  • Customer tier (affects consequence)                                  │   │
│  │  • Number of remaining operations                                       │   │
│  │  • Operator performance patterns                                        │   │
│  │                                                                         │   │
│  │  Output: P(Late) = 0.0 to 1.0                                          │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    RISK CATEGORIZATION                                  │   │
│  │                                                                         │   │
│  │  ┌────────────────────────────────────────────────────────────────┐    │   │
│  │  │ P(Late) < 5%    → GREEN   │ On track, no action needed        │    │   │
│  │  ├────────────────────────────────────────────────────────────────┤    │   │
│  │  │ P(Late) 5-15%   → YELLOW  │ Monitor, prepare contingency      │    │   │
│  │  ├────────────────────────────────────────────────────────────────┤    │   │
│  │  │ P(Late) 15-40%  → ORANGE  │ Intervention recommended          │    │   │
│  │  ├────────────────────────────────────────────────────────────────┤    │   │
│  │  │ P(Late) 40-70%  → RED     │ Immediate action required         │    │   │
│  │  ├────────────────────────────────────────────────────────────────┤    │   │
│  │  │ P(Late) > 70%   → CRITICAL│ Escalate, customer communication  │    │   │
│  │  └────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MITIGATION RECOMMENDER                               │   │
│  │                                                                         │   │
│  │  For ORANGE/RED/CRITICAL jobs, suggest:                                 │   │
│  │  • Expedite (move up in queue)                                          │   │
│  │  • Reroute to faster work center                                        │   │
│  │  • Add overtime                                                         │   │
│  │  • Split batch (ship partial)                                           │   │
│  │  • Customer communication (manage expectations)                         │   │
│  │                                                                         │   │
│  │  Each suggestion includes:                                              │   │
│  │  • Expected risk reduction                                              │   │
│  │  • Cost of action                                                       │   │
│  │  • Downstream impact                                                    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Model Inputs & Outputs

```typescript
interface SlaRiskModelInput {
  // Job details
  job: {
    workOrderId: string;
    orderId: string;
    customerId: string;
    customerTier: string;
    dueDate: Date;
    createdAt: Date;
    priority: number;
    
    // Progress
    operations: {
      operationId: string;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';
      workCenterId?: string;
      estimatedDuration: number;
      actualDuration?: number;
      queuePosition?: number;
    }[];
  };
  
  // Current state
  currentState: {
    timestamp: Date;
    workCenterStates: WorkCenterState[];
    staffingLevel: number;         // % of normal
  };
  
  // Historical context
  historicalContext: {
    similarJobOnTimeRate: number;
    customerHistoricalOnTime: number;
    operatorPerformance: number;
  };
}

interface SlaRiskModelOutput {
  workOrderId: string;
  
  // Risk assessment
  risk: {
    probability: number;           // P(Late)
    category: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
    confidence: number;
  };
  
  // Time analysis
  timeAnalysis: {
    timeRemaining: number;         // Hours until due
    workRemaining: number;         // Estimated hours of work
    bufferTime: number;            // Slack (can be negative)
    criticalPath: string[];        // Operation IDs on critical path
  };
  
  // Contributing factors
  riskFactors: {
    factor: string;
    contribution: number;          // % contribution to risk
    description: string;
    controllable: boolean;
  }[];
  
  // Recommendations
  mitigations?: SlaRiskMitigation[];
}

interface SlaRiskMitigation {
  mitigationId: string;
  type: 'EXPEDITE' | 'REROUTE' | 'OVERTIME' | 'SPLIT' | 'COMMUNICATE';
  description: string;
  
  // Expected impact
  impact: {
    riskReduction: number;         // New P(Late)
    costImpact: number;            // $ cost or savings
    cascadeImpact: number;         // Jobs affected downstream
  };
  
  // Implementation
  implementation: {
    requiredApproval: string[];    // Roles that must approve
    automatable: boolean;
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
```

### 7.3 Alert & Escalation Rules

```typescript
interface SlaAlertRules {
  // Alert thresholds
  thresholds: {
    YELLOW: { probability: 0.05, hoursBeforeDue: 24 },
    ORANGE: { probability: 0.15, hoursBeforeDue: 16 },
    RED: { probability: 0.40, hoursBeforeDue: 8 },
    CRITICAL: { probability: 0.70, hoursBeforeDue: 4 }
  };
  
  // Escalation by customer tier
  escalationByTier: {
    STRATEGIC: {
      YELLOW: ['SUPERVISOR'],
      ORANGE: ['SUPERVISOR', 'SALES_REP'],
      RED: ['SUPERVISOR', 'SALES_REP', 'OPERATIONS_MGR'],
      CRITICAL: ['SUPERVISOR', 'SALES_REP', 'OPERATIONS_MGR', 'PLANT_MGR']
    },
    PREFERRED: {
      YELLOW: [],                   // No alert
      ORANGE: ['SUPERVISOR'],
      RED: ['SUPERVISOR', 'SALES_REP'],
      CRITICAL: ['SUPERVISOR', 'SALES_REP', 'OPERATIONS_MGR']
    },
    STANDARD: {
      YELLOW: [],
      ORANGE: [],
      RED: ['SUPERVISOR'],
      CRITICAL: ['SUPERVISOR', 'OPERATIONS_MGR']
    }
  };
  
  // Auto-actions
  autoActions: {
    ORANGE: {
      action: 'ADD_TO_WATCH_LIST',
      frequency: 'HOURLY_RECHECK'
    },
    RED: {
      action: 'REQUIRE_MITIGATION_PLAN',
      frequency: '30_MINUTE_RECHECK'
    },
    CRITICAL: {
      action: 'AUTO_EXPEDITE_IF_POSSIBLE',
      frequency: '15_MINUTE_RECHECK',
      requireCustomerNotification: true
    }
  };
}
```

---

## 8. DEMAND FORECASTING MODEL

### 8.1 Model Purpose

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       DEMAND FORECASTING MODEL                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PURPOSE: Predict future work volume for capacity planning                      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  USE CASES:                                                                     │
│                                                                                 │
│  1. STAFFING PLANNING (Next 2-4 weeks)                                         │
│     └─ How many operators do we need per shift?                                │
│                                                                                 │
│  2. CAPACITY ALERTS (Next 1-2 weeks)                                           │
│     └─ Are we about to be overwhelmed?                                         │
│                                                                                 │
│  3. PROMISE DATE CALIBRATION (Ongoing)                                         │
│     └─ Should we extend lead times due to expected surge?                      │
│                                                                                 │
│  4. MAINTENANCE SCHEDULING (Next 1-3 months)                                   │
│     └─ When is the best time for planned downtime?                             │
│                                                                                 │
│  MODEL INPUTS                                                                   │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  • Historical order volumes (daily, by division, by product category)          │
│  • Seasonal patterns (month, day of week, holidays)                            │
│  • Customer order patterns (regulars, project-based)                           │
│  • Open quotes (weighted by conversion probability)                            │
│  • Economic indicators (optional: steel prices, construction starts)           │
│  • Weather (for certain industries)                                            │
│                                                                                 │
│  MODEL OUTPUTS                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  • Daily order volume forecast (next 30 days)                                  │
│  • Work hours by work center type (next 14 days)                               │
│  • Confidence intervals (80%, 95%)                                             │
│  • Anomaly detection (unusually high/low expected)                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Model Inputs & Outputs

```typescript
interface DemandForecastInput {
  // Historical data
  historicalOrders: {
    date: Date;
    division: string;
    category: string;
    orderCount: number;
    totalValue: number;
    totalWorkHours: number;
  }[];
  
  // Open pipeline
  openQuotes: {
    quoteId: string;
    expectedValue: number;
    expectedWorkHours: number;
    conversionProbability: number;  // ML-predicted or rule-based
    expectedConversionDate: Date;
  }[];
  
  // Calendar
  calendar: {
    holidays: Date[];
    plannedEvents: { date: Date; impactFactor: number }[];
  };
  
  // Request
  forecastHorizon: number;          // Days to forecast
  granularity: 'DAILY' | 'WEEKLY';
}

interface DemandForecastOutput {
  forecasts: {
    date: Date;
    division?: string;
    category?: string;
    
    // Volume predictions
    predictedOrders: number;
    predictedValue: number;
    predictedWorkHours: number;
    
    // Confidence
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    
    // Comparison
    vsHistoricalAvg: number;        // % difference
    vsSamePeriodLastYear: number;
  }[];
  
  // By work center type
  workCenterDemand: {
    workCenterType: string;
    predictedHours: number[];       // Array for each day
  }[];
  
  // Alerts
  alerts: {
    date: Date;
    type: 'SURGE' | 'SLOWDOWN';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    recommendation: string;
  }[];
}
```

---

## 9. HUMAN-IN-THE-LOOP CONTROLS

### 9.1 Control Framework

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HUMAN-IN-THE-LOOP CONTROL FRAMEWORK                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  AI AUTONOMY LEVELS                                                             │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  LEVEL 1: ADVISORY                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  AI recommends, human decides and executes                              │   │
│  │                                                                         │   │
│  │  Examples:                                                              │   │
│  │  • Route suggestions (human picks)                                      │   │
│  │  • SLA risk alerts (human investigates)                                 │   │
│  │  • Load balancing recommendations (human approves moves)                │   │
│  │                                                                         │   │
│  │  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐                          │   │
│  │  │ AI  │────▶│HUMAN│────▶│HUMAN│────▶│DONE │                          │   │
│  │  │THINK│     │DECIDE│    │ DO  │     │     │                          │   │
│  │  └─────┘     └─────┘     └─────┘     └─────┘                          │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  LEVEL 2: SUPERVISED AUTOMATION                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  AI recommends and queues action, human approves before execution       │   │
│  │                                                                         │   │
│  │  Examples:                                                              │   │
│  │  • Schedule optimization (approve before publish)                       │   │
│  │  • Expedite recommendations (approve rush handling)                     │   │
│  │  • Customer date negotiation suggestions                                │   │
│  │                                                                         │   │
│  │  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐              │   │
│  │  │ AI  │────▶│ AI  │────▶│HUMAN│────▶│ AI  │────▶│DONE │              │   │
│  │  │THINK│     │QUEUE│     │APPROVE│   │ DO  │     │     │              │   │
│  │  └─────┘     └─────┘     └─────┘     └─────┘     └─────┘              │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  LEVEL 3: AUTONOMOUS WITH OVERRIDE                                      │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  AI executes automatically, human can override within window            │   │
│  │                                                                         │   │
│  │  Examples:                                                              │   │
│  │  • Routing for standard orders (auto-assign, 30 min to override)        │   │
│  │  • Due date promises within parameters                                  │   │
│  │  • Minor load balancing moves                                           │   │
│  │                                                                         │   │
│  │  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐                          │   │
│  │  │ AI  │────▶│ AI  │────▶│PAUSE│────▶│DONE │                          │   │
│  │  │THINK│     │ DO  │     │(opt)│     │     │                          │   │
│  │  └─────┘     └─────┘     └──┬──┘     └─────┘                          │   │
│  │                             │                                          │   │
│  │                        Human can                                       │   │
│  │                        override here                                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  LEVEL 4: FULL AUTOMATION                                               │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  AI executes without human intervention (monitoring only)               │   │
│  │                                                                         │   │
│  │  Examples:                                                              │   │
│  │  • Real-time SLA probability updates                                    │   │
│  │  • Demand forecast updates                                              │   │
│  │  • Feature calculation                                                  │   │
│  │                                                                         │   │
│  │  ┌─────┐     ┌─────┐     ┌─────┐                                      │   │
│  │  │ AI  │────▶│ AI  │────▶│DONE │                                      │   │
│  │  │THINK│     │ DO  │     │     │                                      │   │
│  │  └─────┘     └─────┘     └─────┘                                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Model-Specific Autonomy Settings

```typescript
interface ModelAutonomyConfig {
  routing: {
    defaultLevel: 'AUTONOMOUS_WITH_OVERRIDE';
    overrideWindow: 30;           // Minutes
    
    // Exceptions requiring higher level
    exceptions: {
      rushOrders: 'SUPERVISED';   // Require approval
      newCustomers: 'ADVISORY';   // Human picks
      highValueOrders: 'SUPERVISED';
      complexOperations: 'ADVISORY';
    };
    
    // Escalation triggers
    escalateToHuman: {
      confidenceBelow: 0.7;       // Low confidence = human decides
      costAbove: 1000;            // High cost decisions
      customerTier: ['STRATEGIC'];
    };
  };
  
  scheduling: {
    defaultLevel: 'SUPERVISED';   // Always approve schedule
    
    // Partial automation
    autoExecute: {
      minorAdjustments: true;     // < 30 min shifts
      newJobPlacement: true;      // Add to existing schedule
      fullReschedule: false;      // Major changes need approval
    };
  };
  
  dueDatePrediction: {
    defaultLevel: 'AUTONOMOUS_WITH_OVERRIDE';
    overrideWindow: 0;            // Immediate (shown to customer)
    
    // But require approval for:
    requireApproval: {
      rushRequests: true;         // Someone must approve rush
      extensionRequests: true;    // Customer asking for earlier
      strategicCustomers: false;  // But not for top customers
    };
  };
  
  slaRiskAlerts: {
    defaultLevel: 'FULL_AUTOMATION';  // Always run
    
    // Actions require approval
    mitigationActions: {
      expedite: 'SUPERVISED';
      overtime: 'SUPERVISED';
      customerCommunication: 'ADVISORY';
      routeChange: 'AUTONOMOUS_WITH_OVERRIDE';
    };
  };
  
  loadBalancing: {
    defaultLevel: 'SUPERVISED';
    
    // Small moves can be automatic
    autoExecute: {
      queueTimeSavedMinutes: 60;  // Only if saves > 60 min
      affectedJobs: 1;            // Only if moves 1 job
      sameDayMoves: true;         // Not cross-day
    };
  };
}
```

### 9.3 Override & Feedback Interface

```typescript
interface HumanOverrideEvent {
  overrideId: string;
  timestamp: Date;
  userId: string;
  
  // What was overridden
  modelType: 'ROUTING' | 'SCHEDULING' | 'DUE_DATE' | 'LOAD_BALANCE' | 'SLA_RISK';
  originalRecommendation: any;
  humanDecision: any;
  
  // Context
  reason: string;                 // Free text explanation
  reasonCategory: 'BETTER_INFO' | 'CUSTOMER_REQUEST' | 'CONSTRAINT_UNKNOWN' | 
                  'MODEL_ERROR' | 'PREFERENCE' | 'OTHER';
  
  // Outcome (filled later)
  outcome?: {
    wasOverrideCorrect: boolean;
    actualResult: any;
    lessonsLearned?: string;
  };
}

// Override reasons are fed back to model training
class FeedbackLoop {
  
  async recordOverride(override: HumanOverrideEvent): Promise<void> {
    // Store for analysis
    await overrideRepo.save(override);
    
    // If pattern detected, flag for model review
    const recentOverrides = await overrideRepo.getRecent(override.modelType, 7);
    
    if (this.detectPattern(recentOverrides)) {
      await this.triggerModelReview(override.modelType, recentOverrides);
    }
  }
  
  async recordOutcome(overrideId: string, outcome: OverrideOutcome): Promise<void> {
    const override = await overrideRepo.getById(overrideId);
    override.outcome = outcome;
    await overrideRepo.save(override);
    
    // Feed into training data
    if (outcome.wasOverrideCorrect) {
      await trainingData.addCorrectiveExample({
        modelType: override.modelType,
        features: this.extractFeatures(override),
        correctLabel: override.humanDecision,
        incorrectLabel: override.originalRecommendation
      });
    }
  }
}
```

---

## 10. FEEDBACK LOOPS

### 10.1 Continuous Learning Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CONTINUOUS LEARNING ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PRODUCTION ENVIRONMENT                               │   │
│  │                                                                         │   │
│  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │   │
│  │  │   MODELS     │────▶│  DECISIONS   │────▶│   OUTCOMES   │            │   │
│  │  │  (Deployed)  │     │  (Actions)   │     │  (Results)   │            │   │
│  │  └──────────────┘     └──────────────┘     └──────┬───────┘            │   │
│  │                                                   │                     │   │
│  └───────────────────────────────────────────────────┼─────────────────────┘   │
│                                                      │                          │
│                                                      ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA COLLECTION LAYER                                │   │
│  │                                                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │  Predictions │  │   Human      │  │   Actual     │                  │   │
│  │  │  (what AI    │  │   Overrides  │  │   Outcomes   │                  │   │
│  │  │   thought)   │  │   (feedback) │  │   (truth)    │                  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │   │
│  │         │                 │                 │                           │   │
│  │         └─────────────────┼─────────────────┘                           │   │
│  │                           │                                             │   │
│  │                           ▼                                             │   │
│  │                  ┌──────────────────┐                                   │   │
│  │                  │  TRAINING DATA   │                                   │   │
│  │                  │  WAREHOUSE       │                                   │   │
│  │                  └────────┬─────────┘                                   │   │
│  │                           │                                             │   │
│  └───────────────────────────┼─────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MODEL IMPROVEMENT LOOP                               │   │
│  │                                                                         │   │
│  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │   │
│  │  │  EVALUATE    │────▶│   RETRAIN    │────▶│   VALIDATE   │            │   │
│  │  │  (Weekly)    │     │  (If needed) │     │  (A/B test)  │            │   │
│  │  └──────────────┘     └──────────────┘     └──────┬───────┘            │   │
│  │                                                   │                     │   │
│  │                              ┌────────────────────┘                     │   │
│  │                              │                                          │   │
│  │                              ▼                                          │   │
│  │                       ┌──────────────┐                                  │   │
│  │                       │   DEPLOY     │───▶ Back to Production          │   │
│  │                       │  (If better) │                                  │   │
│  │                       └──────────────┘                                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  FEEDBACK SIGNALS                                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  IMPLICIT FEEDBACK:                                                             │
│  • Job completed on time / late                                                │
│  • Actual duration vs predicted                                                │
│  • Actual route taken vs recommended                                           │
│  • Schedule changes (deviations from plan)                                     │
│                                                                                 │
│  EXPLICIT FEEDBACK:                                                             │
│  • Human override with reason                                                  │
│  • "This recommendation was wrong" button                                      │
│  • Post-mortem analysis of failures                                            │
│  • Customer complaints linked to AI decisions                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Model Performance Monitoring

```typescript
interface ModelMonitoringConfig {
  // Performance metrics to track
  metrics: {
    routing: {
      routeAcceptanceRate: number;     // % of recommendations accepted
      onTimeRate: number;              // % of routed jobs on time
      costAccuracy: number;            // Predicted vs actual cost
      durationAccuracy: number;        // MAE in hours
      threshold: { onTimeRate: 0.90 }; // Alert if drops below
    };
    
    scheduling: {
      scheduleAdherence: number;       // % executed as scheduled
      overrideRate: number;            // % of schedule changes
      makespan​Efficiency: number;      // Actual vs predicted
      threshold: { scheduleAdherence: 0.85 };
    };
    
    dueDatePrediction: {
      onTimeRate: number;              // % delivered by promised date
      avgBuffer: number;               // Avg days early/late
      customerSatisfaction: number;    // From feedback
      threshold: { onTimeRate: 0.95 };
    };
    
    slaRisk: {
      precision: number;               // Of predicted at-risk, % actually late
      recall: number;                  // Of actually late, % were predicted
      falseAlarmRate: number;          // Predicted risk but on-time
      threshold: { recall: 0.90 };     // Catch 90% of late jobs early
    };
  };
  
  // Monitoring schedule
  schedule: {
    realTimeAlerts: ['slaRisk.recall', 'dueDatePrediction.onTimeRate'];
    dailyReview: ['all'];
    weeklyReport: ['all'];
    monthlyDeepDive: ['all'];
  };
  
  // Drift detection
  driftDetection: {
    enabled: true;
    methods: ['PSI', 'KOLMOGOROV_SMIRNOV'];  // Statistical tests
    features: ['queueDepth', 'orderVolume', 'operatorCount'];
    threshold: 0.1;                    // PSI > 0.1 triggers alert
  };
}

// Automated retraining triggers
interface RetrainingTriggers {
  // Performance-based
  performanceDegradation: {
    metric: string;
    dropPercent: number;              // e.g., 5% drop from baseline
    window: 'WEEK' | 'MONTH';
  };
  
  // Data-based
  newDataVolume: {
    minRecords: 1000;                 // Retrain after 1000 new labeled records
  };
  
  // Time-based
  scheduledRetrain: {
    frequency: 'WEEKLY' | 'MONTHLY';
    dayOfWeek?: number;
  };
  
  // Drift-based
  dataDrift: {
    psiThreshold: 0.1;
    affectedFeatures: 3;              // Minimum features drifted
  };
}
```

### 10.3 A/B Testing Framework

```typescript
interface ABTestConfig {
  testId: string;
  name: string;
  description: string;
  
  // Models being compared
  control: {
    modelId: string;
    version: string;
  };
  treatment: {
    modelId: string;
    version: string;
  };
  
  // Traffic split
  trafficSplit: {
    control: 0.5;
    treatment: 0.5;
  };
  
  // Segmentation
  segmentation: {
    // Can limit to specific segments
    customerTiers?: string[];
    divisions?: string[];
    orderTypes?: string[];
  };
  
  // Success metrics
  primaryMetric: string;              // e.g., 'onTimeRate'
  secondaryMetrics: string[];
  minimumDetectableEffect: 0.02;      // 2% improvement
  
  // Duration
  startDate: Date;
  minDuration: 14;                    // Days
  maxDuration: 30;                    // Days
  minSampleSize: 1000;                // Per variant
  
  // Early stopping
  earlyStoppingEnabled: true;
  earlyStopFor: 'HARM' | 'WIN' | 'BOTH';
  significanceLevel: 0.05;
}

class ABTestRunner {
  
  async assignVariant(context: DecisionContext): Promise<'control' | 'treatment'> {
    const test = await this.getActiveTest(context.modelType);
    
    if (!test || !this.isEligible(context, test.segmentation)) {
      return 'control';  // Default to current model
    }
    
    // Deterministic assignment based on job ID (for consistency)
    const hash = this.hash(context.jobId);
    const bucket = hash % 100;
    
    if (bucket < test.trafficSplit.control * 100) {
      return 'control';
    } else {
      return 'treatment';
    }
  }
  
  async recordOutcome(
    testId: string, 
    variant: string, 
    outcome: Outcome
  ): Promise<void> {
    await testResults.record({
      testId,
      variant,
      timestamp: new Date(),
      metrics: this.extractMetrics(outcome)
    });
    
    // Check for early stopping
    await this.checkEarlyStopping(testId);
  }
  
  async analyzeResults(testId: string): Promise<ABTestAnalysis> {
    const results = await testResults.getByTestId(testId);
    
    return {
      controlMetrics: this.calculateMetrics(results.control),
      treatmentMetrics: this.calculateMetrics(results.treatment),
      statisticalSignificance: this.calculatePValue(results),
      recommendation: this.determineWinner(results),
      confidenceInterval: this.calculateCI(results)
    };
  }
}
```

---

## 11. IMPLEMENTATION ROADMAP

### 11.1 Phased Rollout

| Phase | Models | Autonomy | Duration |
|-------|--------|----------|----------|
| **Phase 1** | SLA Risk Prediction | Advisory | 2 months |
| **Phase 2** | Due Date Prediction | Advisory → Supervised | 3 months |
| **Phase 3** | Routing Optimization | Supervised → Auto w/ Override | 3 months |
| **Phase 4** | Load Balancing | Supervised | 2 months |
| **Phase 5** | Scheduling Optimization | Supervised | 4 months |
| **Phase 6** | Demand Forecasting | Full Automation | 2 months |

### 11.2 Data Requirements by Phase

| Phase | Minimum Data | Ideal Data |
|-------|--------------|------------|
| **Phase 1** | 3 months history, 5K work orders | 1 year, 20K work orders |
| **Phase 2** | 6 months history, 10K work orders | 2 years, 50K work orders |
| **Phase 3** | 6 months history, complete routing data | 2 years |
| **Phase 4** | 3 months real-time queue data | 1 year |
| **Phase 5** | 1 year history, operator performance data | 2+ years |
| **Phase 6** | 2 years historical orders | 3+ years with seasonal data |

### 11.3 Success Metrics by Phase

```typescript
const successMetricsByPhase = {
  phase1_slaRisk: {
    target: { recall: 0.85, precision: 0.60 },
    stretch: { recall: 0.95, precision: 0.75 }
  },
  
  phase2_dueDate: {
    target: { onTimeRate: 0.93, avgBufferDays: 0.5 },
    stretch: { onTimeRate: 0.97, avgBufferDays: 0.25 }
  },
  
  phase3_routing: {
    target: { costReduction: 0.05, timeReduction: 0.10 },
    stretch: { costReduction: 0.10, timeReduction: 0.15 }
  },
  
  phase4_loadBalance: {
    target: { utilizationVariance: 0.15, bottleneckReduction: 0.30 },
    stretch: { utilizationVariance: 0.10, bottleneckReduction: 0.50 }
  },
  
  phase5_scheduling: {
    target: { throughputIncrease: 0.10, setupReduction: 0.15 },
    stretch: { throughputIncrease: 0.20, setupReduction: 0.25 }
  },
  
  phase6_demandForecast: {
    target: { forecastAccuracy: 0.85 },
    stretch: { forecastAccuracy: 0.92 }
  }
};
```

---

## 12. SUMMARY

### Model Portfolio

| Model | Type | Autonomy Level | Key Benefit |
|-------|------|----------------|-------------|
| **Routing** | Classification + Optimization | Auto w/ Override | -10% processing time |
| **Scheduling** | Optimization (GA/CP) | Supervised | +15% throughput |
| **Due Date** | Regression + Quantile | Auto w/ Override | 95%+ on-time |
| **Load Balance** | Forecasting + Rules | Supervised | Even utilization |
| **SLA Risk** | Classification | Advisory | Early warning |
| **Demand** | Time Series | Full Auto | Capacity planning |

### Data Requirements

- **Minimum:** 6 months history, 10K work orders, complete timestamps
- **Ideal:** 2+ years history, 50K+ work orders, operator performance data
- **Real-time:** Queue states, work center status, current staffing

### Human Controls

- Configurable autonomy levels per model
- Override capability with feedback capture
- Escalation rules by customer tier
- A/B testing for model updates

### Feedback Loops

- Implicit: Actual outcomes vs predictions
- Explicit: Human overrides with reasons
- Continuous: Weekly evaluation, monthly retraining
- Adaptive: Drift detection, automatic model refresh

---

**End of Capacity Planning AI Specification**
