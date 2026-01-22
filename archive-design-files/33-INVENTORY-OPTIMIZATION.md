# Phase 16: Inventory Optimization Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Supply Chain Optimization Specification

---

## 1. EXECUTIVE SUMMARY

This document defines inventory optimization strategies for the SteelWise platform across multi-location, multi-division service centers. The goal is to balance service levels (availability) against inventory carrying costs while managing the unique challenges of metals distribution: dimensional products, remnants, slow-moving specialty items, and commodity price volatility.

### Optimization Objectives

| Objective | Target | Metric |
|-----------|--------|--------|
| **Service Level** | 95%+ fill rate | % of demand filled from stock |
| **Inventory Turns** | 6-8x annually | COGS / Avg Inventory |
| **Dead Stock** | <3% of inventory value | Items with no movement 12+ months |
| **Remnant Value** | <5% of total inventory | Value in sub-standard lengths |
| **Stockout Cost** | Minimize | Lost sales + expedite costs |
| **Carrying Cost** | 18-22% annually | Storage + capital + obsolescence |

### Inventory Landscape

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     MULTI-LOCATION INVENTORY NETWORK                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CENTRAL DISTRIBUTION                            │   │
│  │                         (Houston - HQ)                                  │   │
│  │                                                                         │   │
│  │  • Full product range                                                   │   │
│  │  • Bulk purchasing hub                                                  │   │
│  │  • Import receiving                                                     │   │
│  │  • Slow-mover consolidation                                             │   │
│  │                                                                         │   │
│  └──────────────────────────────┬──────────────────────────────────────────┘   │
│                                 │                                               │
│         ┌───────────────────────┼───────────────────────┐                      │
│         │                       │                       │                      │
│         ▼                       ▼                       ▼                      │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐          │
│  │   REGIONAL DC   │     │   REGIONAL DC   │     │   REGIONAL DC   │          │
│  │   (Dallas)      │     │   (Phoenix)     │     │   (Atlanta)     │          │
│  │                 │     │                 │     │                 │          │
│  │ • High-velocity │     │ • Regional      │     │ • Regional      │          │
│  │   items         │     │   specialties   │     │   specialties   │          │
│  │ • 48hr replen   │     │ • Local custody │     │ • Local custody │          │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘          │
│           │                       │                       │                    │
│     ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐             │
│     │           │           │           │           │           │             │
│     ▼           ▼           ▼           ▼           ▼           ▼             │
│  ┌──────┐   ┌──────┐    ┌──────┐   ┌──────┐    ┌──────┐   ┌──────┐           │
│  │Branch│   │Branch│    │Branch│   │Branch│    │Branch│   │Branch│           │
│  │  A   │   │  B   │    │  C   │   │  D   │    │  E   │   │  F   │           │
│  └──────┘   └──────┘    └──────┘   └──────┘    └──────┘   └──────┘           │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  INVENTORY TYPES BY LOCATION:                                                   │
│                                                                                 │
│  Central DC:  Full catalog, bulk storage, specialty/slow-movers               │
│  Regional DC: Top 500 SKUs by region, processing-ready stock                  │
│  Branch:      Top 100-200 SKUs, will-call inventory, remnants                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DEMAND FORECASTING

### 2.1 Forecasting Model Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEMAND FORECASTING ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FORECASTING HIERARCHY                                                          │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LEVEL 1: AGGREGATE FORECAST                                            │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Company-wide by division (Steel, Aluminum, Plastics)                 │   │
│  │  • Monthly granularity                                                  │   │
│  │  • 12-month horizon                                                     │   │
│  │  • Used for: Capacity planning, budgeting, bulk purchasing              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LEVEL 2: CATEGORY/LOCATION FORECAST                                    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • By product category × location                                       │   │
│  │  • Weekly granularity                                                   │   │
│  │  • 13-week horizon                                                      │   │
│  │  • Used for: Safety stock, replenishment planning                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LEVEL 3: SKU/LOCATION FORECAST                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Individual SKU × location                                            │   │
│  │  • Daily granularity                                                    │   │
│  │  • 4-week horizon                                                       │   │
│  │  • Used for: Order point triggers, daily replenishment                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MODEL SELECTION BY DEMAND PATTERN                                              │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  HIGH VELOCITY (>50 units/month)                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ Model: Exponential Smoothing (Holt-Winters)                     │   │   │
│  │  │ Features: Trend + Seasonality                                   │   │   │
│  │  │ Update: Weekly                                                  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  MEDIUM VELOCITY (10-50 units/month)                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ Model: Croston's Method (intermittent demand)                   │   │   │
│  │  │ Features: Demand size + Demand interval                         │   │   │
│  │  │ Update: Bi-weekly                                               │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  LOW VELOCITY (<10 units/month)                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ Model: Poisson/Negative Binomial                                │   │   │
│  │  │ Features: Mean arrival rate                                     │   │   │
│  │  │ Update: Monthly                                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  NEW ITEMS (No history)                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ Model: Analog item mapping + Expert input                       │   │   │
│  │  │ Features: Similar product history                               │   │   │
│  │  │ Update: After each sale                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Forecast Data Model

```typescript
interface DemandForecast {
  forecastId: string;
  generatedAt: Date;
  
  // Scope
  scope: {
    level: 'AGGREGATE' | 'CATEGORY_LOCATION' | 'SKU_LOCATION';
    divisionId?: string;
    categoryId?: string;
    locationId?: string;
    productId?: string;
  };
  
  // Forecast periods
  periods: ForecastPeriod[];
  
  // Model info
  model: {
    type: 'HOLT_WINTERS' | 'CROSTON' | 'POISSON' | 'ANALOG' | 'ENSEMBLE';
    parameters: Record<string, number>;
    fitMetrics: {
      mape: number;               // Mean Absolute Percentage Error
      bias: number;               // Tendency to over/under forecast
      trackingSignal: number;     // For detecting systematic error
    };
  };
  
  // Adjustments
  adjustments: ForecastAdjustment[];
}

interface ForecastPeriod {
  periodStart: Date;
  periodEnd: Date;
  
  // Point forecast
  forecastQty: number;
  forecastValue: number;
  
  // Uncertainty
  confidenceInterval: {
    lower80: number;
    upper80: number;
    lower95: number;
    upper95: number;
  };
  
  // Comparison
  historicalAvg: number;          // Same period last year
  priorForecast?: number;         // Previous forecast for this period
}

interface ForecastAdjustment {
  adjustmentId: string;
  type: 'MANUAL' | 'PROMOTION' | 'CUSTOMER_INTEL' | 'MARKET_EVENT';
  adjustmentPercent: number;      // +20% = 0.20
  reason: string;
  createdBy: string;
  approvedBy?: string;
  affectedPeriods: Date[];
}
```

### 2.3 Forecast Inputs

```typescript
interface ForecastInputs {
  // Historical demand
  demandHistory: {
    periodStart: Date;
    periodEnd: Date;
    actualQty: number;
    actualValue: number;
    lostSales?: number;           // Known stockout demand
  }[];
  
  // External signals
  externalSignals: {
    // Economic indicators
    steelPriceIndex?: number;
    constructionStarts?: number;
    manufacturingPmi?: number;
    
    // Calendar effects
    holidayCalendar: Date[];
    plantShutdowns: DateRange[];
    
    // Customer intelligence
    customerForecasts?: {
      customerId: string;
      expectedOrders: number;
      confidenceLevel: number;
    }[];
    
    // Open pipeline
    openQuotes: {
      quoteId: string;
      expectedQty: number;
      conversionProbability: number;
      expectedDate: Date;
    }[];
  };
  
  // Product lifecycle
  lifecycle: {
    status: 'NEW' | 'GROWTH' | 'MATURE' | 'DECLINE' | 'OBSOLETE';
    substituteProducts?: string[];
    launchDate?: Date;
    obsolescenceDate?: Date;
  };
}
```

---

## 3. SAFETY STOCK CALCULATION

### 3.1 Safety Stock Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SAFETY STOCK CALCULATION                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FORMULA: Safety Stock = Z × √(LT × σD² + D² × σLT²)                           │
│                                                                                 │
│  Where:                                                                         │
│  Z    = Service level factor (95% = 1.65, 99% = 2.33)                          │
│  LT   = Average lead time (days)                                               │
│  σD   = Standard deviation of daily demand                                     │
│  D    = Average daily demand                                                   │
│  σLT  = Standard deviation of lead time                                        │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  SERVICE LEVEL TIERS                                                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  TIER A: CRITICAL ITEMS (98% service level)                             │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Top 10% by revenue contribution                                      │   │
│  │  • Items with documented customer commitments                           │   │
│  │  • Items with long supplier lead times (>30 days)                       │   │
│  │  • Strategic customer items                                             │   │
│  │  Z-factor: 2.05                                                         │   │
│  │                                                                         │   │
│  │  TIER B: STANDARD ITEMS (95% service level)                             │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Next 30% by revenue contribution                                     │   │
│  │  • Standard stocking items                                              │   │
│  │  • Reasonable supplier alternatives                                     │   │
│  │  Z-factor: 1.65                                                         │   │
│  │                                                                         │   │
│  │  TIER C: ECONOMY ITEMS (90% service level)                              │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Bottom 60% by revenue contribution                                   │   │
│  │  • Commodity items, multiple suppliers                                  │   │
│  │  • Lower margin items                                                   │   │
│  │  Z-factor: 1.28                                                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  LOCATION MODIFIERS                                                             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Central DC:      Base safety stock                                     │   │
│  │  Regional DC:     Base × 1.2 (farther from source)                      │   │
│  │  Branch:          Base × 1.5 (critical local availability)              │   │
│  │                                                                         │   │
│  │  OR: Use location-specific demand variability                           │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Safety Stock Parameters

```typescript
interface SafetyStockParameters {
  productId: string;
  locationId: string;
  
  // Demand characteristics
  demand: {
    avgDailyDemand: number;
    demandStdDev: number;
    demandCv: number;             // Coefficient of variation
    demandPattern: 'SMOOTH' | 'ERRATIC' | 'LUMPY' | 'INTERMITTENT';
  };
  
  // Lead time characteristics
  leadTime: {
    avgLeadTimeDays: number;
    leadTimeStdDev: number;
    leadTimeReliability: number;  // % on-time supplier deliveries
    primarySupplierId: string;
  };
  
  // Service level
  serviceLevel: {
    targetServiceLevel: number;   // 0.90, 0.95, 0.98
    tier: 'A' | 'B' | 'C';
    zFactor: number;
  };
  
  // Constraints
  constraints: {
    minOrderQty: number;
    orderMultiple: number;
    shelfLifeDays?: number;
    maxInventoryValue?: number;
  };
  
  // Calculated values
  calculated: {
    safetyStockQty: number;
    safetyStockDays: number;      // In days of supply
    reorderPoint: number;
    economicOrderQty: number;
  };
}

// Safety stock calculation
function calculateSafetyStock(params: SafetyStockParameters): number {
  const { demand, leadTime, serviceLevel } = params;
  
  // Demand variability during lead time
  const demandVariance = leadTime.avgLeadTimeDays * Math.pow(demand.demandStdDev, 2);
  
  // Lead time variability impact
  const leadTimeVariance = Math.pow(demand.avgDailyDemand, 2) * Math.pow(leadTime.leadTimeStdDev, 2);
  
  // Combined standard deviation
  const combinedStdDev = Math.sqrt(demandVariance + leadTimeVariance);
  
  // Safety stock
  const safetyStock = serviceLevel.zFactor * combinedStdDev;
  
  return Math.ceil(safetyStock);
}

// Reorder point = Safety Stock + (Avg Daily Demand × Avg Lead Time)
function calculateReorderPoint(params: SafetyStockParameters): number {
  const safetyStock = calculateSafetyStock(params);
  const avgDemandDuringLeadTime = params.demand.avgDailyDemand * params.leadTime.avgLeadTimeDays;
  
  return Math.ceil(safetyStock + avgDemandDuringLeadTime);
}
```

### 3.3 Dynamic Safety Stock Adjustment

```typescript
interface SafetyStockAdjustment {
  // Trigger conditions for increasing safety stock
  increaseConditions: {
    demandSpike: {
      threshold: 1.5;             // 50% above average
      lookbackDays: 14;
      adjustment: 0.25;           // Add 25% to safety stock
    };
    
    supplierIssue: {
      onTimeRateBelow: 0.85;
      adjustment: 0.30;           // Add 30% buffer
    };
    
    seasonalPeak: {
      monthsAhead: 1;             // Adjust 1 month before peak
      adjustment: 'FORECAST_BASED';
    };
    
    priceIncrease: {
      expectedIncreasePercent: 0.10;
      adjustment: 'BUILD_AHEAD';
    };
  };
  
  // Trigger conditions for decreasing safety stock
  decreaseConditions: {
    demandDecline: {
      threshold: 0.7;             // 30% below average
      lookbackDays: 30;
      adjustment: -0.15;          // Reduce 15%
    };
    
    excessInventory: {
      daysOnHandAbove: 90;
      adjustment: 'DRAWDOWN_PLAN';
    };
    
    obsolescenceRisk: {
      endOfLifeMonths: 6;
      adjustment: 'PHASE_OUT';
    };
  };
}
```

---

## 4. INTER-LOCATION TRANSFERS

### 4.1 Transfer Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      INTER-LOCATION TRANSFER STRATEGY                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TRANSFER TYPES                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  1. EMERGENCY TRANSFER (Fulfill immediate customer need)                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Trigger: Customer order, local stockout, item available elsewhere     │   │
│  │  Priority: CRITICAL                                                     │   │
│  │  Timeline: Same day or next day                                         │   │
│  │  Approval: Auto-approve if cost < threshold, else manager              │   │
│  │                                                                         │   │
│  │  Example:                                                               │   │
│  │  Dallas branch: 0 units    Houston DC: 150 units                        │   │
│  │  Customer needs 20 units → Transfer 20 from Houston                     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  2. REBALANCING TRANSFER (Optimize network inventory)                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Trigger: Scheduled weekly analysis, imbalance detected                 │   │
│  │  Priority: STANDARD                                                     │   │
│  │  Timeline: Within 5 business days                                       │   │
│  │  Approval: Inventory manager                                            │   │
│  │                                                                         │   │
│  │  Example:                                                               │   │
│  │  Phoenix: 200 units, 60 days supply    Dallas: 30 units, 5 days supply  │   │
│  │  Transfer 80 units Phoenix → Dallas to balance                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  3. CONSOLIDATION TRANSFER (Concentrate slow-movers)                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Trigger: Monthly review, item below velocity threshold                 │   │
│  │  Priority: LOW                                                          │   │
│  │  Timeline: Within 2 weeks                                               │   │
│  │  Approval: Division manager                                             │   │
│  │                                                                         │   │
│  │  Example:                                                               │   │
│  │  Specialty alloy in 3 branches (10, 5, 8 units)                         │   │
│  │  Consolidate all 23 units to Houston DC                                 │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  4. PUSH TRANSFER (Proactive distribution)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Trigger: Large PO received, forecast spike at branch                   │   │
│  │  Priority: STANDARD                                                     │   │
│  │  Timeline: Aligned with incoming receipt                                │   │
│  │  Approval: Purchasing manager                                           │   │
│  │                                                                         │   │
│  │  Example:                                                               │   │
│  │  500 units arriving Houston, forecast shows Dallas needs 200            │   │
│  │  Cross-dock 200 directly to Dallas                                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TRANSFER COST MODEL                                                            │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  Transfer Cost = Freight + Handling (Origin) + Handling (Dest) + Opportunity  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Freight Matrix (per CWT):                                              │   │
│  │                                                                         │   │
│  │              To: Houston  Dallas  Phoenix  Atlanta                      │   │
│  │  From:                                                                  │   │
│  │  Houston        -       $2.50    $4.00    $5.50                         │   │
│  │  Dallas       $2.50       -      $3.50    $4.00                         │   │
│  │  Phoenix      $4.00    $3.50       -      $6.00                         │   │
│  │  Atlanta      $5.50    $4.00    $6.00       -                           │   │
│  │                                                                         │   │
│  │  Handling: $0.50/CWT origin + $0.50/CWT destination                     │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Transfer Optimization Model

```typescript
interface TransferRecommendation {
  transferId: string;
  type: 'EMERGENCY' | 'REBALANCING' | 'CONSOLIDATION' | 'PUSH';
  priority: 'CRITICAL' | 'HIGH' | 'STANDARD' | 'LOW';
  
  // Transfer details
  fromLocation: string;
  toLocation: string;
  productId: string;
  quantity: number;
  uom: string;
  
  // Justification
  justification: {
    reason: string;
    currentFromInventory: number;
    currentToInventory: number;
    fromDaysOfSupply: number;
    toDaysOfSupply: number;
    expectedBenefit: string;
  };
  
  // Costs
  costs: {
    freightCost: number;
    handlingCost: number;
    totalCost: number;
    costPerUnit: number;
  };
  
  // Timing
  timing: {
    requestedDate: Date;
    latestAcceptableDate: Date;
    estimatedTransitDays: number;
  };
  
  // Approval
  approvalRequired: boolean;
  approvalLevel: 'AUTO' | 'BRANCH_MGR' | 'INVENTORY_MGR' | 'DIVISION_MGR';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Transfer optimization algorithm
interface TransferOptimizationInput {
  // Network state
  locations: {
    locationId: string;
    products: {
      productId: string;
      onHand: number;
      forecast: number[];         // Weekly forecast
      safetyStock: number;
      avgDemand: number;
    }[];
  }[];
  
  // Constraints
  constraints: {
    maxTransfersPerWeek: number;
    minTransferValue: number;
    maxTransitDays: number;
  };
  
  // Cost parameters
  freightMatrix: Record<string, Record<string, number>>;
  handlingCostPerUnit: number;
  
  // Objective weights
  weights: {
    serviceLevel: number;         // Importance of availability
    inventoryBalance: number;     // Importance of even distribution
    costMinimization: number;     // Importance of low transfer cost
  };
}

class TransferOptimizer {
  
  optimize(input: TransferOptimizationInput): TransferRecommendation[] {
    const recommendations: TransferRecommendation[] = [];
    
    // For each product
    for (const product of this.getAllProducts(input)) {
      // Calculate imbalance
      const locationBalances = this.calculateLocationBalances(input, product);
      
      // Identify surplus and deficit locations
      const surplusLocs = locationBalances.filter(l => l.daysOfSupply > 45);
      const deficitLocs = locationBalances.filter(l => l.daysOfSupply < 15);
      
      // Find optimal transfers
      for (const deficit of deficitLocs) {
        const bestSource = this.findBestSource(
          surplusLocs, 
          deficit, 
          input.freightMatrix
        );
        
        if (bestSource && this.isTransferWorthwhile(bestSource, deficit, input)) {
          recommendations.push(this.createRecommendation(bestSource, deficit, product));
        }
      }
    }
    
    return this.prioritizeAndFilter(recommendations, input.constraints);
  }
  
  private isTransferWorthwhile(source: any, dest: any, input: any): boolean {
    // Transfer is worthwhile if:
    // 1. Cost is less than lost sale cost
    // 2. Source won't go below safety stock
    // 3. Improvement exceeds minimum threshold
    
    const transferCost = this.calculateTransferCost(source, dest, input);
    const expectedLostSaleCost = dest.avgDemand * dest.avgPrice * 0.3;  // 30% margin
    
    return transferCost < expectedLostSaleCost * 0.5;  // Worth it if < 50% of potential loss
  }
}
```

---

## 5. SLOW-MOVER MANAGEMENT

### 5.1 Slow-Mover Classification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SLOW-MOVER CLASSIFICATION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  VELOCITY CLASSIFICATION                                                        │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  FAST MOVERS (A Items)                                                  │   │
│  │  • Inventory turns > 8x/year                                            │   │
│  │  • Days of supply < 30                                                  │   │
│  │  • Top 20% by unit volume                                               │   │
│  │  Strategy: Maintain, replenish frequently                              │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  MEDIUM MOVERS (B Items)                                                │   │
│  │  • Inventory turns 4-8x/year                                            │   │
│  │  • Days of supply 30-60                                                 │   │
│  │  • Next 30% by unit volume                                              │   │
│  │  Strategy: Standard replenishment, monitor closely                      │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  SLOW MOVERS (C Items)                                                  │   │
│  │  • Inventory turns 1-4x/year                                            │   │
│  │  • Days of supply 60-180                                                │   │
│  │  • Bottom 50% by unit volume                                            │   │
│  │  Strategy: Consolidate, reduce safety stock, consider drop-ship        │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  DEAD STOCK (D Items)                                                   │   │
│  │  • Inventory turns < 1x/year                                            │   │
│  │  • No sales in 6+ months                                                │   │
│  │  • Days of supply > 180                                                 │   │
│  │  Strategy: Liquidate, write-off, scrap                                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  SLOW-MOVER STRATEGIES BY REASON                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  REASON: SPECIALTY ITEM (Required for key customers)                    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Keep, but consolidate to central location                            │   │
│  │  • Consider customer-specific inventory (consignment)                   │   │
│  │  • Negotiate blanket orders with customers                              │   │
│  │                                                                         │   │
│  │  REASON: OBSOLETE (Replaced by newer product)                           │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Aggressive discounting (10-20-30% ladder)                            │   │
│  │  • Offer to existing users of the product                               │   │
│  │  • Write-off timeline: 6 months                                         │   │
│  │                                                                         │   │
│  │  REASON: OVERSTOCK (Bought too much)                                    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Push to sales team with incentive                                    │   │
│  │  • Offer volume discounts                                               │   │
│  │  • Consider return to supplier                                          │   │
│  │                                                                         │   │
│  │  REASON: MARKET DECLINE (Industry segment shrinking)                    │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Controlled exit over 12 months                                       │   │
│  │  • Stop reordering, sell down                                           │   │
│  │  • Move to special-order only                                           │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Slow-Mover Actions

```typescript
interface SlowMoverAnalysis {
  productId: string;
  locationId: string;
  
  // Classification
  velocityClass: 'A' | 'B' | 'C' | 'D';
  inventoryTurns: number;
  daysOfSupply: number;
  lastSaleDate: Date | null;
  monthsSinceLastSale: number;
  
  // Value at stake
  onHandQty: number;
  onHandValue: number;
  carryingCostMonthly: number;
  
  // Root cause analysis
  rootCause: {
    category: 'SPECIALTY' | 'OBSOLETE' | 'OVERSTOCK' | 'MARKET_DECLINE' | 'NEW_ITEM' | 'SEASONAL';
    confidence: number;
    evidence: string[];
  };
  
  // Recommended action
  recommendedAction: SlowMoverAction;
}

interface SlowMoverAction {
  actionType: 'HOLD' | 'CONSOLIDATE' | 'DISCOUNT' | 'LIQUIDATE' | 'SCRAP' | 'RETURN';
  
  // Action details
  details: {
    // For CONSOLIDATE
    transferToLocation?: string;
    
    // For DISCOUNT
    discountTiers?: { days: number; discountPercent: number }[];
    
    // For RETURN
    supplierId?: string;
    returnDeadline?: Date;
  };
  
  // Expected outcome
  expectedOutcome: {
    recoveryValue: number;        // $ expected to recover
    recoveryRate: number;         // % of original value
    timelineMonths: number;       // Time to resolution
  };
  
  // Urgency
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  reviewDate: Date;
}

// Slow-mover workflow
class SlowMoverWorkflow {
  
  async analyzeSlowMovers(locationId?: string): Promise<SlowMoverAnalysis[]> {
    // Get all items with low velocity
    const candidates = await this.inventoryRepo.getSlowMovers({
      maxTurns: 2,
      minDaysOnHand: 90,
      locationId
    });
    
    const analyses: SlowMoverAnalysis[] = [];
    
    for (const item of candidates) {
      const analysis = await this.analyzeItem(item);
      analysis.recommendedAction = this.determineAction(analysis);
      analyses.push(analysis);
    }
    
    return analyses.sort((a, b) => b.onHandValue - a.onHandValue);
  }
  
  private determineAction(analysis: SlowMoverAnalysis): SlowMoverAction {
    // Decision tree based on root cause and value
    
    if (analysis.velocityClass === 'D' && analysis.monthsSinceLastSale > 12) {
      // Dead stock - aggressive action needed
      if (analysis.rootCause.category === 'OBSOLETE') {
        return {
          actionType: 'LIQUIDATE',
          details: {
            discountTiers: [
              { days: 0, discountPercent: 20 },
              { days: 30, discountPercent: 35 },
              { days: 60, discountPercent: 50 }
            ]
          },
          expectedOutcome: {
            recoveryValue: analysis.onHandValue * 0.4,
            recoveryRate: 0.40,
            timelineMonths: 3
          },
          urgency: 'HIGH',
          reviewDate: addDays(new Date(), 30)
        };
      }
    }
    
    if (analysis.rootCause.category === 'SPECIALTY') {
      // Specialty items - consolidate but keep
      return {
        actionType: 'CONSOLIDATE',
        details: {
          transferToLocation: 'CENTRAL_DC'
        },
        expectedOutcome: {
          recoveryValue: analysis.onHandValue * 0.95,
          recoveryRate: 0.95,
          timelineMonths: 12
        },
        urgency: 'LOW',
        reviewDate: addMonths(new Date(), 6)
      };
    }
    
    // Default: Monitor
    return {
      actionType: 'HOLD',
      details: {},
      expectedOutcome: {
        recoveryValue: analysis.onHandValue,
        recoveryRate: 1.0,
        timelineMonths: 6
      },
      urgency: 'LOW',
      reviewDate: addMonths(new Date(), 3)
    };
  }
}
```

---

## 6. REMNANT MANAGEMENT

### 6.1 Remnant Definition & Classification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        REMNANT MANAGEMENT                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WHAT IS A REMNANT?                                                             │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  A remnant is a piece of material remaining after processing that:             │
│  • Is smaller than standard stocking sizes                                     │
│  • Cannot be easily returned to standard inventory                             │
│  • May have value to certain customers                                         │
│  • Accumulates if not actively managed                                         │
│                                                                                 │
│  REMNANT CLASSIFICATION                                                         │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  CLASS A: PRIME REMNANTS                                                │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • 50-80% of standard size                                              │   │
│  │  • Perfect condition                                                    │   │
│  │  • Full traceability (heat #, MTR available)                            │   │
│  │  • Example: 36" piece from 48" width sheet                              │   │
│  │                                                                         │   │
│  │  Pricing: List price - 10-15%                                           │   │
│  │  Strategy: Active selling, showcase in catalog                          │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  CLASS B: USABLE REMNANTS                                               │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • 25-50% of standard size                                              │   │
│  │  • Good condition (minor surface marks OK)                              │   │
│  │  • Traceability may be limited                                          │   │
│  │  • Example: 2' piece from 10' bar                                       │   │
│  │                                                                         │   │
│  │  Pricing: List price - 25-35%                                           │   │
│  │  Strategy: Promote to price-sensitive customers                         │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  CLASS C: MARGINAL REMNANTS                                             │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • <25% of standard size                                                │   │
│  │  • May have minor defects                                               │   │
│  │  • Limited or no traceability                                           │   │
│  │  • Example: 6" scrap from plate cutting                                 │   │
│  │                                                                         │   │
│  │  Pricing: List price - 50-70% (or scrap value)                          │   │
│  │  Strategy: Bulk sales, scrap if no movement in 90 days                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  REMNANT AGING & PRICING                                                        │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Age         │ Class A Price │ Class B Price │ Class C Price           │   │
│  │  ────────────│───────────────│───────────────│───────────────           │   │
│  │  0-30 days   │ List - 10%    │ List - 25%    │ List - 50%               │   │
│  │  31-60 days  │ List - 15%    │ List - 35%    │ List - 60%               │   │
│  │  61-90 days  │ List - 25%    │ List - 45%    │ Scrap value             │   │
│  │  91-120 days │ List - 35%    │ List - 55%    │ Scrap value             │   │
│  │  120+ days   │ List - 50%    │ Scrap value   │ Scrap value             │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Remnant Data Model

```typescript
interface Remnant {
  remnantId: string;
  locationId: string;
  
  // Origin
  originWorkOrderId: string;
  originOperationId: string;
  createdAt: Date;
  createdBy: string;
  
  // Material
  productId: string;              // Base product
  materialGrade: string;
  
  // Dimensions
  dimensions: {
    thickness: number;
    width: number;
    length: number;
    unit: 'IN' | 'MM';
  };
  
  // Quantity & Weight
  quantity: number;               // Usually 1
  weight: number;
  weightUnit: 'LB' | 'KG';
  
  // Classification
  class: 'A' | 'B' | 'C';
  condition: 'PERFECT' | 'GOOD' | 'FAIR' | 'POOR';
  
  // Traceability
  traceability: {
    heatNumber?: string;
    mtrAvailable: boolean;
    originCoilId?: string;
  };
  
  // Pricing
  pricing: {
    originalValue: number;        // If sold as standard
    currentPrice: number;         // Discounted price
    discountPercent: number;
    scrapValue: number;           // Floor price
  };
  
  // Status
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'SCRAPPED';
  reservedForOrderId?: string;
  ageInDays: number;
  
  // Location
  warehouseZone: string;
  binLocation: string;
}

// Remnant pricing calculation
function calculateRemnantPrice(remnant: Remnant): number {
  const basePrice = remnant.pricing.originalValue;
  
  // Class discount
  const classDiscount = {
    'A': 0.10,
    'B': 0.25,
    'C': 0.50
  }[remnant.class];
  
  // Age discount (additional)
  let ageDiscount = 0;
  if (remnant.ageInDays > 30) ageDiscount += 0.05;
  if (remnant.ageInDays > 60) ageDiscount += 0.10;
  if (remnant.ageInDays > 90) ageDiscount += 0.10;
  if (remnant.ageInDays > 120) ageDiscount += 0.15;
  
  // Condition adjustment
  const conditionFactor = {
    'PERFECT': 1.0,
    'GOOD': 0.95,
    'FAIR': 0.85,
    'POOR': 0.70
  }[remnant.condition];
  
  const calculatedPrice = basePrice * (1 - classDiscount - ageDiscount) * conditionFactor;
  
  // Floor at scrap value
  return Math.max(calculatedPrice, remnant.pricing.scrapValue);
}
```

### 6.3 Remnant Workflow

```typescript
interface RemnantWorkflow {
  // Creation (from processing)
  creation: {
    trigger: 'WORK_ORDER_COMPLETION';
    autoClassify: boolean;        // AI-based classification
    requiresPhoto: boolean;       // For condition documentation
    requiresMeasurement: boolean; // Dimensional verification
  };
  
  // Promotion
  promotion: {
    channels: ['POS_SCREEN', 'WEBSITE', 'SALES_ALERT'];
    
    // Sales incentives
    salesIncentive: {
      enabled: boolean;
      bonusPercent: number;       // Extra commission for selling remnants
    };
    
    // Customer targeting
    targeting: {
      priceShoppers: true;        // Customers who historically buy remnants
      matchDimensions: true;      // Suggest when remnant fits order
      projectBuyers: true;        // Hobbyists, small projects
    };
  };
  
  // Consolidation
  consolidation: {
    frequency: 'WEEKLY';
    fromLocations: ['BRANCHES'];
    toLocation: 'REGIONAL_DC';
    
    // Criteria
    consolidateWhen: {
      ageAboveDays: 60;
      valueBelow: 500;
    };
  };
  
  // Disposition
  disposition: {
    // Auto-scrap rules
    autoScrap: {
      ageAboveDays: 180;
      valueBelow: 50;
      class: ['C'];
    };
    
    // Review required
    reviewRequired: {
      valueAbove: 500;
      hasTraceability: true;
    };
  };
}

// Remnant suggestion at POS
async function suggestRemnants(orderLine: OrderLine): Promise<Remnant[]> {
  const product = await productRepo.getById(orderLine.productId);
  
  // Find remnants that could fulfill this order
  const candidates = await remnantRepo.findMatching({
    productId: orderLine.productId,
    minWidth: orderLine.dimensions.width,
    minLength: orderLine.dimensions.length,
    locationId: orderLine.locationId,
    status: 'AVAILABLE'
  });
  
  // Score by fit and value
  return candidates
    .map(r => ({
      remnant: r,
      score: calculateFitScore(r, orderLine),
      savings: calculateSavings(r, orderLine)
    }))
    .filter(x => x.score > 0.8)  // Good fit
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5)
    .map(x => x.remnant);
}
```

---

## 7. STOCKING BY DIVISION & LOCATION

### 7.1 Stocking Strategy Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STOCKING STRATEGY BY DIVISION/LOCATION                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DIVISION-LEVEL STRATEGY                                                        │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  STEEL DIVISION (STL)                                                   │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Characteristics:                                                       │   │
│  │  • High volume, commodity-like for common grades                        │   │
│  │  • Specialty grades (A514, AR400) are slow-movers                       │   │
│  │  • Price volatility follows commodity markets                           │   │
│  │  • Long lead times from mills (4-8 weeks)                               │   │
│  │                                                                         │   │
│  │  Strategy:                                                              │   │
│  │  • Stock common grades (A36, A572-50) at all locations                  │   │
│  │  • Specialty grades only at central DC                                  │   │
│  │  • Safety stock = 3-4 weeks for commodity, 8 weeks for specialty        │   │
│  │  • Forward buying when prices low                                       │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  ALUMINUM DIVISION (ALU)                                                │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Characteristics:                                                       │   │
│  │  • Fewer SKUs, more standardized                                        │   │
│  │  • Strong aerospace/defense demand (certified material)                 │   │
│  │  • Price tied to LME aluminum                                           │   │
│  │  • Moderate lead times (2-4 weeks)                                      │   │
│  │                                                                         │   │
│  │  Strategy:                                                              │   │
│  │  • Stock 6061-T6, 6063-T5 at all locations                             │   │
│  │  • Aerospace grades (7075, 2024) at certified locations only           │   │
│  │  • Maintain full MTR traceability                                       │   │
│  │  • Higher safety stock for certified materials                          │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  PLASTICS DIVISION (PLA)                                                │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Characteristics:                                                       │   │
│  │  • Wide variety of materials (HDPE, UHMW, Acrylic, etc.)               │   │
│  │  • Lower weight, easier to store                                        │   │
│  │  • Some temperature-sensitive materials                                 │   │
│  │  • Shorter lead times (1-2 weeks)                                       │   │
│  │                                                                         │   │
│  │  Strategy:                                                              │   │
│  │  • Stock top 50 SKUs at each location                                   │   │
│  │  • Regional variations (marine grades in coastal locations)             │   │
│  │  • Lower safety stock (faster replenishment)                            │   │
│  │  • Watch for UV degradation on outdoor storage                          │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  SPECIALTY METALS (SPC)                                                 │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Characteristics:                                                       │   │
│  │  • Low volume, high value (stainless, brass, bronze)                   │   │
│  │  • Customer-specific requirements common                                │   │
│  │  • Very long lead times for some alloys                                 │   │
│  │  • Price stability (less volatile)                                      │   │
│  │                                                                         │   │
│  │  Strategy:                                                              │   │
│  │  • Centralized stocking only                                            │   │
│  │  • Make-to-order for exotic alloys                                      │   │
│  │  • Customer consignment programs                                        │   │
│  │  • High safety stock for key items (8-12 weeks)                         │   │
│  │                                                                         │   │
│  │  ──────────────────────────────────────────────────────────────────────│   │
│  │                                                                         │   │
│  │  SUPPLIES (SUP)                                                         │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  Characteristics:                                                       │   │
│  │  • High SKU count, low value per item                                   │   │
│  │  • Commodity purchasing, many suppliers                                 │   │
│  │  • Short lead times (days)                                              │   │
│  │  • Low carrying cost                                                    │   │
│  │                                                                         │   │
│  │  Strategy:                                                              │   │
│  │  • Stock at all locations (convenience)                                 │   │
│  │  • Min/max replenishment                                                │   │
│  │  • Vendor-managed inventory for top suppliers                           │   │
│  │  • Low safety stock (easy to get)                                       │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Location Stocking Rules

```typescript
interface LocationStockingProfile {
  locationId: string;
  locationType: 'CENTRAL_DC' | 'REGIONAL_DC' | 'BRANCH';
  
  // Geographic factors
  geography: {
    region: string;
    primaryMarkets: string[];     // Industries served
    nearbyLocations: string[];    // For transfer consideration
    transitDaysFromCentral: number;
  };
  
  // Capacity
  capacity: {
    totalSquareFeet: number;
    usableSquareFeet: number;
    maxWeight: number;            // Floor load capacity
    outdoorYardAvailable: boolean;
    climateControlled: boolean;
  };
  
  // Stocking rules by division
  divisionRules: {
    [division: string]: {
      enabled: boolean;
      stockingLevel: 'FULL' | 'LIMITED' | 'NONE';
      maxSkuCount: number;
      maxInventoryValue: number;
      minTurns: number;           // Minimum acceptable turns
      safetyStockMultiplier: number;
    };
  };
  
  // Assortment planning
  assortment: {
    // SKU selection criteria
    selectionCriteria: {
      minLocalDemand: number;     // Units/month
      minMargin: number;          // % margin
      maxDaysSupply: number;      // Don't overstock
    };
    
    // Review cycle
    assortmentReviewFrequency: 'MONTHLY' | 'QUARTERLY';
    
    // Exceptions
    mandatorySkus: string[];      // Must stock regardless of velocity
    excludedSkus: string[];       // Never stock here
  };
}

// Example profiles
const locationProfiles: LocationStockingProfile[] = [
  {
    locationId: 'LOC-HOUSTON-DC',
    locationType: 'CENTRAL_DC',
    geography: {
      region: 'GULF_COAST',
      primaryMarkets: ['OIL_GAS', 'PETROCHEMICAL', 'MARINE'],
      nearbyLocations: [],
      transitDaysFromCentral: 0
    },
    capacity: {
      totalSquareFeet: 250000,
      usableSquareFeet: 200000,
      maxWeight: 50000000,        // 50M lbs
      outdoorYardAvailable: true,
      climateControlled: false
    },
    divisionRules: {
      'STL': { enabled: true, stockingLevel: 'FULL', maxSkuCount: 5000, maxInventoryValue: 50000000, minTurns: 4, safetyStockMultiplier: 1.0 },
      'ALU': { enabled: true, stockingLevel: 'FULL', maxSkuCount: 1000, maxInventoryValue: 10000000, minTurns: 4, safetyStockMultiplier: 1.0 },
      'PLA': { enabled: true, stockingLevel: 'FULL', maxSkuCount: 500, maxInventoryValue: 2000000, minTurns: 6, safetyStockMultiplier: 1.0 },
      'SPC': { enabled: true, stockingLevel: 'FULL', maxSkuCount: 800, maxInventoryValue: 8000000, minTurns: 2, safetyStockMultiplier: 1.5 },
      'SUP': { enabled: true, stockingLevel: 'FULL', maxSkuCount: 2000, maxInventoryValue: 500000, minTurns: 8, safetyStockMultiplier: 0.8 }
    },
    assortment: {
      selectionCriteria: { minLocalDemand: 1, minMargin: 0.15, maxDaysSupply: 180 },
      assortmentReviewFrequency: 'QUARTERLY',
      mandatorySkus: [],
      excludedSkus: []
    }
  },
  
  {
    locationId: 'LOC-DALLAS-BRANCH',
    locationType: 'BRANCH',
    geography: {
      region: 'TEXAS_CENTRAL',
      primaryMarkets: ['CONSTRUCTION', 'FABRICATION'],
      nearbyLocations: ['LOC-HOUSTON-DC'],
      transitDaysFromCentral: 1
    },
    capacity: {
      totalSquareFeet: 15000,
      usableSquareFeet: 12000,
      maxWeight: 2000000,
      outdoorYardAvailable: false,
      climateControlled: false
    },
    divisionRules: {
      'STL': { enabled: true, stockingLevel: 'LIMITED', maxSkuCount: 200, maxInventoryValue: 1500000, minTurns: 8, safetyStockMultiplier: 1.5 },
      'ALU': { enabled: true, stockingLevel: 'LIMITED', maxSkuCount: 50, maxInventoryValue: 300000, minTurns: 8, safetyStockMultiplier: 1.5 },
      'PLA': { enabled: true, stockingLevel: 'LIMITED', maxSkuCount: 30, maxInventoryValue: 100000, minTurns: 10, safetyStockMultiplier: 1.2 },
      'SPC': { enabled: false, stockingLevel: 'NONE', maxSkuCount: 0, maxInventoryValue: 0, minTurns: 0, safetyStockMultiplier: 0 },
      'SUP': { enabled: true, stockingLevel: 'LIMITED', maxSkuCount: 100, maxInventoryValue: 25000, minTurns: 12, safetyStockMultiplier: 1.0 }
    },
    assortment: {
      selectionCriteria: { minLocalDemand: 5, minMargin: 0.20, maxDaysSupply: 45 },
      assortmentReviewFrequency: 'MONTHLY',
      mandatorySkus: ['STL-A36-PL-250', 'STL-A36-FB-500'],  // Top sellers
      excludedSkus: ['SPC-*']  // No specialty metals
    }
  }
];
```

### 7.3 Assortment Optimization

```typescript
interface AssortmentOptimization {
  locationId: string;
  
  // Current state
  currentAssortment: {
    skuCount: number;
    totalValue: number;
    avgTurns: number;
    serviceLevel: number;
  };
  
  // Recommendations
  recommendations: AssortmentRecommendation[];
  
  // Projected impact
  projectedImpact: {
    newSkuCount: number;
    newTotalValue: number;
    projectedTurns: number;
    projectedServiceLevel: number;
    gmroiImprovement: number;     // Gross Margin Return on Investment
  };
}

interface AssortmentRecommendation {
  action: 'ADD' | 'REMOVE' | 'INCREASE' | 'DECREASE';
  productId: string;
  productName: string;
  
  // Current state
  currentQty?: number;
  currentValue?: number;
  currentTurns?: number;
  
  // Recommended change
  recommendedQty: number;
  valueChange: number;
  
  // Justification
  justification: string[];
  // Examples:
  // "Local demand 15 units/month, currently stocking only at DC"
  // "No sales in 6 months, demand fulfilled from Houston"
  // "Customer XYZ orders 50/month, consolidating to branch"
  
  // Risk assessment
  riskIfNotImplemented: 'LOW' | 'MEDIUM' | 'HIGH';
  riskDescription?: string;
}

class AssortmentOptimizer {
  
  async optimizeAssortment(locationId: string): Promise<AssortmentOptimization> {
    const profile = await this.getLocationProfile(locationId);
    const demandData = await this.getDemandData(locationId, 12);  // 12 months
    const currentInventory = await this.getCurrentInventory(locationId);
    
    const recommendations: AssortmentRecommendation[] = [];
    
    // Find items to ADD (demand but no stock)
    for (const demand of demandData.unmetDemand) {
      if (demand.monthlyUnits >= profile.assortment.selectionCriteria.minLocalDemand) {
        recommendations.push({
          action: 'ADD',
          productId: demand.productId,
          productName: demand.productName,
          recommendedQty: this.calculateOptimalStock(demand, profile),
          valueChange: this.calculateValue(demand),
          justification: [
            `${demand.monthlyUnits} units/month local demand`,
            `Currently fulfilled from ${demand.sourceLocation}`,
            `Avg lead time ${demand.avgLeadDays} days`
          ],
          riskIfNotImplemented: 'MEDIUM',
          riskDescription: 'Lost sales and customer frustration'
        });
      }
    }
    
    // Find items to REMOVE (stock but no demand)
    for (const item of currentInventory.items) {
      const demand = demandData.byProduct.get(item.productId);
      
      if (!demand || demand.monthlyUnits < profile.assortment.selectionCriteria.minLocalDemand * 0.5) {
        recommendations.push({
          action: 'REMOVE',
          productId: item.productId,
          productName: item.productName,
          currentQty: item.onHand,
          currentValue: item.value,
          currentTurns: item.turns,
          recommendedQty: 0,
          valueChange: -item.value,
          justification: [
            demand ? `Only ${demand.monthlyUnits} units/month` : 'No local demand in 12 months',
            `Current turns: ${item.turns}x`,
            `Value tied up: $${item.value.toLocaleString()}`
          ],
          riskIfNotImplemented: 'LOW',
          riskDescription: 'Capital inefficiency'
        });
      }
    }
    
    // Find items to adjust quantity
    // ... similar logic for INCREASE/DECREASE
    
    return {
      locationId,
      currentAssortment: this.summarizeCurrentState(currentInventory),
      recommendations: recommendations.sort((a, b) => 
        Math.abs(b.valueChange) - Math.abs(a.valueChange)
      ),
      projectedImpact: this.projectImpact(currentInventory, recommendations)
    };
  }
}
```

---

## 8. ANALYTICS & REPORTING

### 8.1 Inventory KPIs Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    INVENTORY ANALYTICS DASHBOARD                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  NETWORK HEALTH SCORECARD                                                       │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   METRIC              │ TARGET  │ ACTUAL  │ TREND    │ STATUS          │   │
│  │   ────────────────────│─────────│─────────│──────────│────────         │   │
│  │   Fill Rate           │  95%    │  94.2%  │  ↗ +0.5% │  ⚠️ WATCH       │   │
│  │   Inventory Turns     │  6.0x   │  5.8x   │  ↘ -0.2  │  ⚠️ WATCH       │   │
│  │   GMROI               │  $2.50  │  $2.65  │  ↗ +$0.10│  ✅ ON TRACK    │   │
│  │   Dead Stock %        │  <3%    │  2.1%   │  ↘ -0.3% │  ✅ ON TRACK    │   │
│  │   Remnant Value %     │  <5%    │  4.8%   │  ↗ +0.2% │  ⚠️ WATCH       │   │
│  │   Stockout Incidents  │  <50/mo │  42     │  ↘ -8    │  ✅ ON TRACK    │   │
│  │   Forecast Accuracy   │  >85%   │  82%    │  ↗ +2%   │  ⚠️ IMPROVING   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  INVENTORY VALUE BY DIVISION                                                    │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   Steel (STL)     ████████████████████████████████████████  $42.5M 65%│   │
│  │   Aluminum (ALU)  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  $12.1M 18%│   │
│  │   Specialty (SPC) ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   $6.2M  9%│   │
│  │   Plastics (PLA)  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   $3.8M  6%│   │
│  │   Supplies (SUP)  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   $1.2M  2%│   │
│  │                                                                         │   │
│  │   TOTAL: $65.8M                                                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  VELOCITY ANALYSIS                                                              │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   Velocity Class │ SKU Count │ Value      │ % of Total │ Turns        │   │
│  │   ───────────────│───────────│────────────│────────────│──────         │   │
│  │   A (Fast)       │     312   │ $28.4M     │    43%     │  12.5x       │   │
│  │   B (Medium)     │     845   │ $22.1M     │    34%     │   6.2x       │   │
│  │   C (Slow)       │   2,156   │ $13.2M     │    20%     │   2.1x       │   │
│  │   D (Dead)       │     421   │  $2.1M     │     3%     │   0.4x       │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  AGING ANALYSIS                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │     0-30 days    ████████████████████████████████           $32.1M     │   │
│  │    31-60 days    ████████████████████░░░░░░░░░░░░           $18.5M     │   │
│  │    61-90 days    ████████░░░░░░░░░░░░░░░░░░░░░░░░            $8.2M     │   │
│  │   91-180 days    █████░░░░░░░░░░░░░░░░░░░░░░░░░░░            $4.8M     │   │
│  │      180+ days   ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            $2.2M ⚠️  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Key Metrics Definitions

```typescript
interface InventoryMetrics {
  // Fill Rate
  fillRate: {
    formula: 'Lines Filled from Stock / Total Lines Ordered';
    target: 0.95;
    calculation: (filled: number, total: number) => filled / total;
  };
  
  // Inventory Turns
  inventoryTurns: {
    formula: 'COGS (12 mo) / Average Inventory Value';
    target: 6.0;
    calculation: (cogs: number, avgInventory: number) => cogs / avgInventory;
  };
  
  // GMROI (Gross Margin Return on Investment)
  gmroi: {
    formula: 'Gross Margin / Average Inventory Cost';
    target: 2.50;
    calculation: (grossMargin: number, avgInventory: number) => grossMargin / avgInventory;
  };
  
  // Days of Supply
  daysOfSupply: {
    formula: 'On Hand Qty / Avg Daily Usage';
    target: 45;
    calculation: (onHand: number, avgDaily: number) => onHand / avgDaily;
  };
  
  // Dead Stock Percentage
  deadStockPercent: {
    formula: 'Value with No Sales 12+ months / Total Inventory Value';
    target: 0.03;
    calculation: (deadValue: number, totalValue: number) => deadValue / totalValue;
  };
  
  // Forecast Accuracy (MAPE)
  forecastAccuracy: {
    formula: '1 - (|Forecast - Actual| / Actual)';
    target: 0.85;
    calculation: (forecast: number, actual: number) => 
      1 - Math.abs(forecast - actual) / actual;
  };
  
  // Perfect Order Rate
  perfectOrderRate: {
    formula: 'Orders (In Full + On Time + No Damage + Correct Docs) / Total Orders';
    target: 0.90;
    calculation: (perfect: number, total: number) => perfect / total;
  };
}
```

### 8.3 Alert & Exception Reporting

```typescript
interface InventoryAlert {
  alertId: string;
  alertType: AlertType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  
  // Scope
  scope: {
    locationId?: string;
    divisionId?: string;
    productId?: string;
  };
  
  // Details
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  
  // Recommendations
  recommendations: string[];
  
  // Assignment
  assignedTo: string[];
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

type AlertType = 
  | 'STOCKOUT_IMMINENT'      // Days of supply < X
  | 'OVERSTOCK'              // Days of supply > Y
  | 'DEAD_STOCK_HIGH'        // Dead stock % above threshold
  | 'FORECAST_MISS'          // Actual significantly different from forecast
  | 'TURNS_LOW'              // Inventory turns below target
  | 'FILL_RATE_DROP'         // Fill rate dropped significantly
  | 'REMNANT_BUILDUP'        // Remnant value increasing
  | 'SLOW_MOVER_AGING'       // Slow mover exceeding age threshold
  | 'TRANSFER_OPPORTUNITY'   // Imbalance detected
  | 'SUPPLIER_RISK';         // Lead time or reliability issues

// Alert rules configuration
const alertRules: AlertRule[] = [
  {
    type: 'STOCKOUT_IMMINENT',
    condition: (item) => item.daysOfSupply < 7 && item.velocityClass !== 'D',
    severity: 'CRITICAL',
    message: (item) => `${item.productName} at ${item.locationName}: Only ${item.daysOfSupply} days of supply remaining`,
    notify: ['INVENTORY_MANAGER', 'PURCHASING']
  },
  {
    type: 'OVERSTOCK',
    condition: (item) => item.daysOfSupply > 120,
    severity: 'WARNING',
    message: (item) => `${item.productName} at ${item.locationName}: ${item.daysOfSupply} days of supply (target < 60)`,
    notify: ['INVENTORY_MANAGER']
  },
  {
    type: 'DEAD_STOCK_HIGH',
    condition: (location) => location.deadStockPercent > 0.05,
    severity: 'WARNING',
    message: (location) => `${location.locationName}: Dead stock at ${(location.deadStockPercent * 100).toFixed(1)}% (target < 3%)`,
    notify: ['DIVISION_MANAGER', 'INVENTORY_MANAGER']
  },
  {
    type: 'TRANSFER_OPPORTUNITY',
    condition: (analysis) => analysis.potentialSavings > 5000,
    severity: 'INFO',
    message: (analysis) => `Transfer opportunity: Move ${analysis.quantity} units of ${analysis.productName} from ${analysis.from} to ${analysis.to}, save $${analysis.savings}`,
    notify: ['INVENTORY_MANAGER']
  }
];
```

---

## 9. EXECUTION WORKFLOWS

### 9.1 Daily Replenishment Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DAILY REPLENISHMENT WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TIMING: Run daily at 6:00 AM                                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 1: DATA REFRESH                                          6:00 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Import previous day's transactions                                   │   │
│  │  • Update on-hand quantities                                            │   │
│  │  • Refresh open PO status                                               │   │
│  │  • Update demand forecast (if new data)                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 2: EXCEPTION DETECTION                                   6:15 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Identify items below reorder point                                   │   │
│  │  • Identify overstock conditions                                        │   │
│  │  • Flag supplier delivery delays                                        │   │
│  │  • Detect forecast misses                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 3: REPLENISHMENT CALCULATION                             6:30 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  For each item below reorder point:                                     │   │
│  │  • Calculate replenishment quantity (EOQ or days of supply)             │   │
│  │  • Check supplier lead times                                            │   │
│  │  • Apply min order qty and multiples                                    │   │
│  │  • Determine source (supplier or internal transfer)                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 4: ORDER CONSOLIDATION                                   7:00 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Group orders by supplier                                             │   │
│  │  • Apply bracket pricing optimization                                   │   │
│  │  • Consolidate shipments to same location                               │   │
│  │  • Apply minimum order value rules                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 5: BUYER REVIEW & APPROVAL                               7:30 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Buyers review suggested orders                                       │   │
│  │  • Adjust quantities if needed                                          │   │
│  │  • Approve or defer orders                                              │   │
│  │  • Add special instructions                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 6: ORDER TRANSMISSION                                    9:00 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Generate purchase orders                                             │   │
│  │  • Transmit to suppliers (EDI, email, portal)                          │   │
│  │  • Log transmission status                                              │   │
│  │  • Update expected receipt dates                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 7: TRANSFER PROCESSING                                   9:30 AM │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │  • Create inter-location transfer orders                                │   │
│  │  • Notify shipping locations                                            │   │
│  │  • Schedule pickup/delivery                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Slow-Mover Review Workflow

```typescript
interface SlowMoverReviewWorkflow {
  frequency: 'MONTHLY';
  timing: 'FIRST_WEEK_OF_MONTH';
  
  steps: [
    {
      step: 1,
      name: 'Generate slow-mover report',
      owner: 'SYSTEM',
      outputs: ['Slow-mover list by location', 'Value summary by cause']
    },
    {
      step: 2,
      name: 'Review and classify',
      owner: 'INVENTORY_ANALYST',
      actions: [
        'Assign root cause to each item',
        'Recommend disposition action',
        'Estimate recovery value'
      ],
      sla: '3_BUSINESS_DAYS'
    },
    {
      step: 3,
      name: 'Division approval',
      owner: 'DIVISION_MANAGER',
      actions: [
        'Approve write-downs',
        'Approve transfer/consolidation',
        'Approve liquidation terms'
      ],
      thresholds: {
        autoApprove: 5000,        // < $5K auto-approved
        managerApproval: 25000,   // $5K-$25K manager
        vpApproval: 100000        // > $25K needs VP
      },
      sla: '2_BUSINESS_DAYS'
    },
    {
      step: 4,
      name: 'Execute disposition',
      owner: 'INVENTORY_TEAM',
      actions: [
        'Process transfers',
        'Apply discounts in system',
        'Notify sales of discounted items',
        'Schedule scrap if needed'
      ],
      sla: '5_BUSINESS_DAYS'
    },
    {
      step: 5,
      name: 'Financial reconciliation',
      owner: 'FINANCE',
      actions: [
        'Book inventory adjustments',
        'Update slow-mover reserve',
        'Report to leadership'
      ],
      sla: 'MONTH_END'
    }
  ];
}
```

### 9.3 Remnant Processing Workflow

```typescript
interface RemnantProcessingWorkflow {
  // Creation trigger
  creation: {
    trigger: 'WORK_ORDER_COMPLETION',
    requiredData: [
      'Product identification',
      'Dimensions (measured)',
      'Condition assessment',
      'Traceability info (if available)',
      'Photo (if value > $100)'
    ],
    classification: {
      method: 'RULE_BASED',      // Or 'AI_ASSISTED'
      rules: [
        { condition: 'size >= 50% AND condition == PERFECT', class: 'A' },
        { condition: 'size >= 25% AND condition >= GOOD', class: 'B' },
        { condition: 'default', class: 'C' }
      ]
    }
  };
  
  // Pricing
  pricing: {
    method: 'AUTO_CALCULATED',
    reviewRequired: false,       // Auto-price unless value > $500
    updateFrequency: 'DAILY'     // Age-based pricing updates
  };
  
  // Promotion
  promotion: {
    // POS integration
    posPromotion: {
      enabled: true,
      suggestWhenMatches: true,   // Suggest when remnant fits order
      highlightDiscount: true
    },
    
    // Website
    webListing: {
      enabled: true,
      category: 'Bargain Bin',
      photoRequired: true
    },
    
    // Sales alerts
    salesAlerts: {
      enabled: true,
      thresholdValue: 200,        // Alert sales if remnant > $200
      targetCustomers: 'PRICE_SENSITIVE'
    }
  };
  
  // Consolidation
  consolidation: {
    frequency: 'WEEKLY',
    criteria: {
      ageAboveDays: 45,
      valueBelow: 300
    },
    targetLocation: 'REGIONAL_DC',
    approvalRequired: false
  };
  
  // Disposition
  disposition: {
    // Auto-scrap rules
    autoScrap: {
      enabled: true,
      criteria: {
        ageAboveDays: 120,
        class: ['C'],
        valueBelowScrap: 1.2      // If price < 1.2x scrap value
      },
      approvalRequired: 'VALUE_ABOVE_500'
    }
  };
}
```

---

## 10. SUMMARY

### Optimization Strategy Summary

| Area | Strategy | Key Metric | Target |
|------|----------|------------|--------|
| **Forecasting** | Hierarchical, model selection by velocity | MAPE | <15% |
| **Safety Stock** | Service-level tiered, dynamic adjustment | Fill Rate | 95%+ |
| **Transfers** | Cost-optimized, 4 transfer types | Balance Score | >0.8 |
| **Slow-Movers** | Root cause based actions | Dead Stock % | <3% |
| **Remnants** | Age-based pricing, active promotion | Remnant % | <5% |
| **Stocking** | Division/location tailored profiles | Turns | 6-8x |

### Key Workflows

| Workflow | Frequency | Owner | Key Output |
|----------|-----------|-------|------------|
| Replenishment | Daily | Buyers | Purchase orders, transfers |
| Slow-Mover Review | Monthly | Inventory Analyst | Disposition actions |
| Remnant Processing | Continuous | Shop Floor | Priced inventory, alerts |
| Assortment Review | Quarterly | Inventory Manager | Add/remove SKUs |
| Forecast Review | Weekly | Planning | Updated forecasts |
| Transfer Optimization | Weekly | Inventory Manager | Transfer recommendations |

### Analytics Priorities

1. **Service Level Monitoring** — Real-time fill rate by location/division
2. **Inventory Health** — Turns, aging, dead stock trending
3. **Forecast Accuracy** — Track and improve model performance
4. **Transfer ROI** — Measure cost vs. benefit of transfers
5. **Remnant Velocity** — Track remnant sell-through rates

---

**End of Inventory Optimization Architecture Specification**
