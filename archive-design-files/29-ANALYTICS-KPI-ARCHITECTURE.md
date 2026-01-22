# Phase 12: Analytics & KPI Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Analytics Platform Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the comprehensive analytics and KPI framework for the SteelWise multi-division service center platform. It establishes metrics that drive operational excellence and business performance across all levels of the organization.

### Analytics Design Principles

1. **Actionable** - Every metric should drive a decision or behavior
2. **Timely** - Real-time where needed, daily/weekly where appropriate
3. **Contextual** - Metrics shown with benchmarks and trends
4. **Role-Appropriate** - Right metrics for the right persona
5. **Drillable** - Summary to detail navigation

### KPI Categories

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KPI CATEGORY FRAMEWORK                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    STRATEGIC (Executive Level)                          │   │
│  │  ───────────────────────────────────────────────────────────────────── │   │
│  │  Revenue • Gross Margin • Customer Satisfaction • Market Share          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌───────────────────┬───────────────┴───────────────┬───────────────────┐     │
│  │                   │                               │                   │     │
│  ▼                   ▼                               ▼                   ▼     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│  │   SALES     │   │ OPERATIONS  │   │  FINANCIAL  │   │  INVENTORY  │         │
│  │   KPIs      │   │    KPIs     │   │    KPIs     │   │    KPIs     │         │
│  ├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤         │
│  │ Quote→Order │   │ Throughput  │   │ Margin/Job  │   │ Turns       │         │
│  │ Win Rate    │   │ Utilization │   │ Margin/Cust │   │ Days-on-Hand│         │
│  │ Pipeline    │   │ Cycle Time  │   │ Cost Var    │   │ Slow Movers │         │
│  │ Avg Order   │   │ OTD/SLA     │   │ AR Aging    │   │ Remnants    │         │
│  │ Growth      │   │ Scrap/Yield │   │ DSO         │   │ Accuracy    │         │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘         │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    TACTICAL (Shop Floor Level)                          │   │
│  │  ───────────────────────────────────────────────────────────────────── │   │
│  │  Jobs/Hour • Queue Depth • Machine Uptime • Quality First-Pass          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. KPI CATALOG

### 2.1 SLA & Delivery Performance

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **SLA-01** | On-Time Delivery (OTD) | % orders shipped by promised date | (Orders shipped on/before due) / Total orders shipped × 100 | ≥95% | Daily |
| **SLA-02** | Next-Day Fill Rate | % next-day orders fulfilled | Next-day orders shipped / Next-day orders received × 100 | ≥98% | Daily |
| **SLA-03** | Same-Day Will-Call | % will-call ready by promised time | Ready by time / Total will-call × 100 | ≥99% | Daily |
| **SLA-04** | Rush Order Performance | % rush orders met | Rush orders on-time / Total rush orders × 100 | ≥90% | Daily |
| **SLA-05** | Average Days Late | Avg days past due for late orders | Σ(Days late) / Count late orders | <0.5 days | Weekly |
| **SLA-06** | Perfect Order Rate | Orders with no issues (quality, qty, timing) | Perfect orders / Total orders × 100 | ≥92% | Weekly |
| **SLA-07** | Customer Promise Accuracy | % of quoted lead times met | Deliveries within quoted time / Total × 100 | ≥93% | Weekly |

#### SLA-01: On-Time Delivery Detail

```typescript
interface OTDMetric {
  period: DateRange;
  
  // Core calculation
  totalOrdersShipped: number;
  ordersOnTime: number;
  ordersLate: number;
  otdPercent: number;
  
  // Breakdowns
  byDivision: {
    divisionId: string;
    shipped: number;
    onTime: number;
    otdPercent: number;
  }[];
  
  byCustomerTier: {
    tier: string;
    shipped: number;
    onTime: number;
    otdPercent: number;
  }[];
  
  byOrderType: {
    type: 'STOCK' | 'PROCESSING' | 'WILL_CALL';
    shipped: number;
    onTime: number;
    otdPercent: number;
  }[];
  
  // Late order analysis
  lateOrders: {
    orderId: string;
    daysLate: number;
    reason: string;
    customer: string;
    value: number;
  }[];
  
  // Trend
  trend: {
    period: string;
    otdPercent: number;
  }[];
}
```

### 2.2 Throughput Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **TPT-01** | Daily Tons Shipped | Total weight shipped per day | Σ(Shipment weights) | Varies by location | Daily |
| **TPT-02** | Jobs Completed/Day | Number of work orders closed | Count(Jobs status = COMPLETE) per day | Varies | Daily |
| **TPT-03** | Lines Shipped/Day | Order lines fulfilled daily | Count(Lines shipped) | Varies | Daily |
| **TPT-04** | Revenue/Employee | Revenue per FTE | Total Revenue / FTE Count | $XXX,XXX | Monthly |
| **TPT-05** | Tons/Employee | Weight processed per FTE | Total Tons / FTE Count | XX tons | Monthly |
| **TPT-06** | Processing Queue | Work orders awaiting processing | Count(WO status = QUEUED) | <24 hrs avg | Real-time |
| **TPT-07** | Shipping Queue | Orders awaiting shipment | Count(Orders status = PACKED) | <4 hrs avg | Real-time |

### 2.3 Utilization Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **UTL-01** | Machine Utilization | % time machines actively processing | Run Time / Available Time × 100 | ≥75% | Daily |
| **UTL-02** | Labor Utilization | % productive labor hours | Direct Hours / Total Hours × 100 | ≥80% | Daily |
| **UTL-03** | Saw Utilization | Saw equipment specific | Saw Run Time / Saw Available × 100 | ≥70% | Daily |
| **UTL-04** | Laser Utilization | Laser equipment specific | Laser Run Time / Laser Available × 100 | ≥65% | Daily |
| **UTL-05** | Overtime % | Overtime as % of total labor | OT Hours / Total Hours × 100 | <10% | Weekly |
| **UTL-06** | Dock Door Utilization | Loading dock usage | Door Active Time / Available × 100 | ≥60% | Daily |
| **UTL-07** | Truck Fill Rate | % capacity used on deliveries | Actual Load / Truck Capacity × 100 | ≥75% | Daily |

#### UTL-01: Machine Utilization Detail

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MACHINE UTILIZATION BREAKDOWN                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TOTAL AVAILABLE TIME: 8 hours (480 minutes)                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  │← RUN TIME (Processing) →│← IDLE →│← DOWN →│← SETUP →│← MAINT →│   │   │
│  │                                                                         │   │
│  │  Run Time:     320 min (66.7%)   ████ Productive                       │   │
│  │  Idle Time:     60 min (12.5%)   ░░░░ Waiting for work                  │   │
│  │  Downtime:      40 min (8.3%)    ░░░░ Unplanned stops                   │   │
│  │  Setup Time:    45 min (9.4%)    ░░░░ Changeovers                       │   │
│  │  Maintenance:   15 min (3.1%)    ░░░░ Planned                           │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  UTILIZATION = Run Time / (Available - Planned Maintenance)                    │
│              = 320 / (480 - 15) = 320 / 465 = 68.8%                            │
│                                                                                 │
│  OEE (Overall Equipment Effectiveness) = Availability × Performance × Quality  │
│      = (465-40)/465 × (320/425) × (Good Parts/Total Parts)                     │
│      = 91.4% × 75.3% × 98.5% = 67.8%                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Cycle Time Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **CYC-01** | Order-to-Ship Time | Time from order to shipment | Avg(Ship Date - Order Date) | <2 days | Daily |
| **CYC-02** | Quote-to-Order Time | Time from quote to conversion | Avg(Order Date - Quote Date) | <3 days | Weekly |
| **CYC-03** | Order-to-Schedule Time | Time to schedule after order | Avg(Schedule Date - Order Date) | <4 hrs | Daily |
| **CYC-04** | Processing Cycle Time | Time in processing | Avg(Complete - Start per job) | Varies | Daily |
| **CYC-05** | Receiving Cycle Time | Time from arrival to put-away | Avg(Put-away - Receipt) | <2 hrs | Daily |
| **CYC-06** | Shipping Cycle Time | Time from pack complete to ship | Avg(Ship - Pack Complete) | <1 hr | Daily |
| **CYC-07** | Touch Time Ratio | Actual work time vs total time | Touch Time / Total Cycle Time | ≥40% | Weekly |

### 2.5 Scrap & Yield Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **YLD-01** | Yield Rate | Good output vs input | Good Weight / Input Weight × 100 | ≥92% | Daily |
| **YLD-02** | Scrap % | Scrap as % of input | Scrap Weight / Input Weight × 100 | <5% | Daily |
| **YLD-03** | Scrap $ Value | Dollar value of scrap | Σ(Scrap Weight × Material Cost) | Minimize | Weekly |
| **YLD-04** | Remnant Generation | Usable remnants created | Remnant Weight / Processing Weight | Target varies | Weekly |
| **YLD-05** | Remnant Recovery | Value recovered from remnants | Remnant Sales / Remnant Book Value | ≥60% | Monthly |
| **YLD-06** | First-Pass Yield | Jobs passing QC first time | First-pass OK / Total Inspected × 100 | ≥97% | Daily |
| **YLD-07** | Rework Rate | Jobs requiring rework | Rework Jobs / Total Jobs × 100 | <2% | Weekly |

#### YLD-01: Yield Calculation Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          YIELD CALCULATION                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  JOB: J-2026-12345                                                              │
│  Process: Saw Cut 4140 Round Bar to length                                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  INPUT:                                                                 │   │
│  │  ├── Material: 4140 Round 3.000" dia × 144" (1 bar)                    │   │
│  │  └── Weight: 234.5 lbs                                                  │   │
│  │                                                                         │   │
│  │  OUTPUT:                                                                │   │
│  │  ├── Good Pieces: 10 × 12.50" = 125" used                              │   │
│  │  │   Weight: 203.1 lbs                                                  │   │
│  │  │                                                                      │   │
│  │  ├── Usable Remnant: 1 × 9.25" piece                                   │   │
│  │  │   Weight: 15.0 lbs                                                   │   │
│  │  │                                                                      │   │
│  │  ├── Kerf Loss: 10 cuts × 0.125" = 1.25"                               │   │
│  │  │   Weight: 2.0 lbs                                                    │   │
│  │  │                                                                      │   │
│  │  └── Drop/Scrap: 8.00" ends (too short for remnant)                    │   │
│  │      Weight: 14.4 lbs                                                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  YIELD CALCULATIONS:                                                            │
│                                                                                 │
│  Good Yield = Good Weight / Input = 203.1 / 234.5 = 86.6%                      │
│  Total Recovery = (Good + Remnant) / Input = 218.1 / 234.5 = 93.0%             │
│  Scrap % = (Kerf + Drop) / Input = 16.4 / 234.5 = 7.0%                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Sales & Conversion Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **SLS-01** | Quote-to-Order Rate | % of quotes converting to orders | Orders / Quotes × 100 | ≥35% | Weekly |
| **SLS-02** | Quote Win Rate (Value) | Value won vs total quoted | Won Value / Quoted Value × 100 | ≥40% | Weekly |
| **SLS-03** | Average Quote Value | Mean quote dollar value | Σ(Quote Value) / Quote Count | $X,XXX | Weekly |
| **SLS-04** | Average Order Value | Mean order dollar value | Σ(Order Value) / Order Count | $X,XXX | Weekly |
| **SLS-05** | Quote Turnaround Time | Time to deliver quotes | Avg(Quote Sent - Request Received) | <4 hrs | Daily |
| **SLS-06** | Sales Pipeline Value | Total value of open quotes | Σ(Open Quote Values) | $XXX,XXX | Real-time |
| **SLS-07** | Lost Quote Analysis | Top reasons for lost quotes | Reason code frequency | N/A | Weekly |
| **SLS-08** | New Customer Rate | New customers as % of orders | New Customer Orders / Total × 100 | 10-15% | Monthly |
| **SLS-09** | Customer Retention | Returning customer rate | Customers with >1 order / Total × 100 | ≥75% | Quarterly |
| **SLS-10** | Revenue Growth | YoY revenue change | (Current - Prior) / Prior × 100 | ≥8% | Monthly |

### 2.7 Gross Margin Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **MGN-01** | Gross Margin % (Overall) | Company-wide margin | (Revenue - COGS) / Revenue × 100 | ≥22% | Weekly |
| **MGN-02** | Margin by Division | Margin per business unit | Division GM / Division Revenue × 100 | Varies | Weekly |
| **MGN-03** | Margin by Customer | Per-customer profitability | Customer GM / Customer Revenue × 100 | ≥18% | Monthly |
| **MGN-04** | Margin by Job | Individual job profitability | Job GM / Job Revenue × 100 | ≥15% | Per job |
| **MGN-05** | Margin by Product Category | Category profitability | Category GM / Category Revenue × 100 | Varies | Weekly |
| **MGN-06** | Processing Margin | Value-add services margin | Processing GM / Processing Rev × 100 | ≥45% | Weekly |
| **MGN-07** | Stock Sales Margin | Non-processed sales margin | Stock GM / Stock Revenue × 100 | ≥18% | Weekly |
| **MGN-08** | Margin Erosion Rate | Orders below target margin | Below-target Orders / Total × 100 | <15% | Weekly |
| **MGN-09** | Discount Impact | Revenue lost to discounts | Total Discounts / Gross Revenue × 100 | <8% | Weekly |

#### MGN-03: Customer Margin Analysis

```typescript
interface CustomerMarginAnalysis {
  customerId: string;
  customerName: string;
  tier: string;
  
  period: DateRange;
  
  // Revenue
  revenue: {
    material: number;
    processing: number;
    freight: number;
    other: number;
    total: number;
  };
  
  // Cost
  cost: {
    material: number;
    labor: number;
    overhead: number;
    freight: number;
    total: number;
  };
  
  // Margin
  grossProfit: number;
  grossMarginPercent: number;
  
  // Comparisons
  vsCompanyAverage: number;      // +/- from company avg
  vsTierAverage: number;         // +/- from tier avg
  vsPriorPeriod: number;         // +/- from last period
  
  // Segmentation
  orderCount: number;
  avgOrderValue: number;
  avgOrderMargin: number;
  
  // Risk indicators
  marginTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  belowFloorOrders: number;
  discountFrequency: number;
}
```

### 2.8 Inventory Metrics

| KPI ID | KPI Name | Definition | Formula | Target | Frequency |
|--------|----------|------------|---------|--------|-----------|
| **INV-01** | Inventory Turns | Inventory velocity | COGS / Avg Inventory Value | 4-6× | Monthly |
| **INV-02** | Days Inventory On-Hand | Days of stock coverage | (Avg Inventory / COGS) × 365 | 60-90 days | Weekly |
| **INV-03** | Slow-Moving Inventory | Stock with no movement | Value of items >90 days no sale | Minimize | Weekly |
| **INV-04** | Dead Stock | Obsolete inventory | Value of items >180 days no sale | <5% of inv | Monthly |
| **INV-05** | Inventory Accuracy | Physical vs system match | Accurate Counts / Total Counts × 100 | ≥98% | Per count |
| **INV-06** | Stock-Out Rate | Items out of stock | Stock-outs / Total SKUs × 100 | <2% | Daily |
| **INV-07** | Fill Rate | Lines filled from stock | Lines Filled / Lines Ordered × 100 | ≥95% | Daily |
| **INV-08** | Remnant Inventory % | Remnants as % of total | Remnant Value / Total Inv Value × 100 | <10% | Weekly |
| **INV-09** | Inventory Investment | Total inventory value | Σ(Qty × Cost) | Budget | Weekly |
| **INV-10** | GMROI | Gross margin return on inventory | Gross Margin / Avg Inventory Cost | ≥2.5 | Monthly |

#### INV-01: Inventory Turns by Division

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      INVENTORY TURNS BY DIVISION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Period: Last 12 Months                                                         │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Division      │ Avg Inventory │ COGS (12mo) │ Turns │ Target │ Status  │   │
│  │ ──────────────│───────────────│─────────────│───────│────────│──────── │   │
│  │ Steel         │ $2,450,000    │ $12,250,000 │ 5.0×  │ 5.0×   │ ● Met   │   │
│  │ Aluminum      │ $1,180,000    │ $5,310,000  │ 4.5×  │ 5.0×   │ ○ Below │   │
│  │ Plastics      │ $620,000      │ $2,232,000  │ 3.6×  │ 4.0×   │ ○ Below │   │
│  │ Supplies      │ $340,000      │ $2,040,000  │ 6.0×  │ 6.0×   │ ● Met   │   │
│  │ ──────────────│───────────────│─────────────│───────│────────│──────── │   │
│  │ TOTAL         │ $4,590,000    │ $21,832,000 │ 4.8×  │ 5.0×   │ ○ Below │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TREND (Monthly):                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  5.5× │                                              ●                  │   │
│  │  5.0× │ ────────────────────────────────●───●───●───────────────────── │   │
│  │  4.5× │        ●───●───●───●───●───●                     ●              │   │
│  │  4.0× │   ●───●                                               ●        │   │
│  │  3.5× │                                                                 │   │
│  │       └─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬──  │   │
│  │            Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. PERSONA → KPI MAPPING

### 3.1 KPI Visibility Matrix

| KPI Category | Owner/Exec | Div Mgr | Loc Mgr | Sales Mgr | Ops Mgr | Scheduler | Supervisor | Operator |
|--------------|:----------:|:-------:|:-------:|:---------:|:-------:|:---------:|:----------:|:--------:|
| **SLA/Delivery** |
| SLA-01 OTD | ✓ Summary | ✓ Div | ✓ Loc | ✓ | ✓ | ✓ | ✓ | ○ |
| SLA-02 Next-Day | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ○ |
| SLA-06 Perfect Order | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| **Throughput** |
| TPT-01 Tons Shipped | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ |
| TPT-02 Jobs/Day | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ |
| TPT-06 Proc Queue | ○ | ○ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ |
| **Utilization** |
| UTL-01 Machine Util | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ○ |
| UTL-02 Labor Util | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ✓ | ○ |
| UTL-05 Overtime | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ✓ | ○ |
| **Cycle Time** |
| CYC-01 Order-Ship | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ○ | ○ |
| CYC-04 Processing | ○ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ |
| **Yield** |
| YLD-01 Yield Rate | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ✓ | ✓ |
| YLD-02 Scrap % | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ✓ | ✓ |
| YLD-06 First-Pass | ○ | ✓ | ✓ | ○ | ✓ | ○ | ✓ | ✓ |
| **Sales** |
| SLS-01 Quote→Order | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| SLS-06 Pipeline | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ | ○ |
| SLS-10 Revenue Growth | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ | ○ |
| **Margin** |
| MGN-01 Overall GM | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ | ○ |
| MGN-02 Div Margin | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ | ○ |
| MGN-04 Job Margin | ○ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| **Inventory** |
| INV-01 Turns | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ○ | ○ |
| INV-06 Stock-Out | ○ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |
| INV-08 Remnants | ○ | ✓ | ✓ | ✓ | ✓ | ○ | ○ | ○ |

**Legend:** ✓ = Full access | ○ = Limited/No access | Div = Division-level only | Loc = Location-level only

### 3.2 Primary KPIs by Persona

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PRIMARY KPIs BY PERSONA                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OWNER / EXECUTIVE                                                              │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── Revenue (MTD, YTD, vs Prior Year, vs Budget)                              │
│  ├── Gross Margin % (Overall, by Division)                                      │
│  ├── On-Time Delivery (Company-wide trend)                                      │
│  ├── Inventory Investment (vs Target)                                           │
│  └── Customer Satisfaction / NPS                                                │
│                                                                                 │
│  DIVISION MANAGER                                                               │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── Revenue & Margin (Division)                                                │
│  ├── Quote-to-Order Conversion                                                  │
│  ├── OTD by Location                                                            │
│  ├── Inventory Turns                                                            │
│  └── Top Customer Profitability                                                 │
│                                                                                 │
│  LOCATION MANAGER                                                               │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── Daily Throughput (Tons, Jobs, Lines)                                       │
│  ├── OTD (Location)                                                             │
│  ├── Labor & Machine Utilization                                                │
│  ├── Processing Queue Depth                                                     │
│  └── Inventory Accuracy                                                         │
│                                                                                 │
│  SALES MANAGER                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── Pipeline Value & Aging                                                     │
│  ├── Quote-to-Order by Rep                                                      │
│  ├── Revenue by Customer / Territory                                            │
│  ├── Margin by Customer                                                         │
│  └── Lost Quote Analysis                                                        │
│                                                                                 │
│  OPERATIONS MANAGER                                                             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── OTD (Detail with late reasons)                                             │
│  ├── Machine Utilization by Work Center                                         │
│  ├── Scrap/Yield Rates                                                          │
│  ├── Queue Depths (Processing, Shipping)                                        │
│  └── Cycle Time Trends                                                          │
│                                                                                 │
│  SCHEDULER                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── Capacity Utilization (Planned vs Actual)                                   │
│  ├── Jobs Due Today / At Risk                                                   │
│  ├── Work Center Queue Status                                                   │
│  ├── Rush Order Count                                                           │
│  └── Schedule Adherence                                                         │
│                                                                                 │
│  SUPERVISOR                                                                     │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── Jobs to Complete This Shift                                                │
│  ├── Work Center Status (Active, Idle, Down)                                    │
│  ├── Operator Performance                                                       │
│  ├── First-Pass Yield                                                           │
│  └── Scrap Today                                                                │
│                                                                                 │
│  OPERATOR                                                                       │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  │                                                                              │
│  ├── My Jobs Queue                                                              │
│  ├── Jobs Completed Today                                                       │
│  ├── My Yield/Scrap Rate                                                        │
│  └── My Machine Uptime                                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. KPI DATA MODEL

### 4.1 KPI Definition Schema

```typescript
interface KPIDefinition {
  kpiId: string;                    // 'SLA-01', 'TPT-02'
  name: string;
  description: string;
  category: KPICategory;
  
  // Calculation
  formula: string;                  // Human-readable formula
  calculation: {
    numeratorMetric: string;        // Metric ID for numerator
    denominatorMetric?: string;     // Metric ID for denominator (if ratio)
    aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
    unit: string;                   // '%', 'days', 'tons', '$'
  };
  
  // Targets
  targets: {
    target: number;                 // Goal
    warning: number;                // Yellow threshold
    critical: number;               // Red threshold
    direction: 'HIGHER_BETTER' | 'LOWER_BETTER';
  };
  
  // Refresh
  frequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  
  // Dimensions (for drill-down)
  dimensions: string[];             // ['division', 'location', 'customer', 'workCenter']
  
  // Access
  visibleToRoles: string[];
  detailVisibleToRoles: string[];
}

interface KPIValue {
  kpiId: string;
  periodType: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  periodStart: Date;
  periodEnd: Date;
  
  // Scope
  divisionId?: string;
  locationId?: string;
  customerId?: string;
  workCenterId?: string;
  
  // Value
  value: number;
  numerator?: number;
  denominator?: number;
  
  // Status
  status: 'GREEN' | 'YELLOW' | 'RED';
  
  // Comparison
  priorPeriodValue?: number;
  priorPeriodChange?: number;
  priorPeriodChangePercent?: number;
  
  // Trend
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendStrength: number;            // 0-100
}
```

### 4.2 Metric Collection Points

```typescript
interface MetricSource {
  metricId: string;
  source: 'TRANSACTION' | 'EVENT' | 'CALCULATED' | 'EXTERNAL';
  
  // For transaction-based
  tableName?: string;
  eventType?: string;
  
  // Collection
  collectionMethod: 'REAL_TIME' | 'BATCH' | 'SCHEDULED';
  batchSchedule?: string;           // Cron expression
  
  // Processing
  aggregations: AggregationRule[];
}

interface AggregationRule {
  outputMetricId: string;
  inputMetricId: string;
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'DISTINCT_COUNT';
  period: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  dimensions: string[];
}

// Example: Orders Shipped metric flows
const ordersShippedMetric: MetricSource = {
  metricId: 'orders_shipped_count',
  source: 'EVENT',
  eventType: 'SHIPMENT_RELEASED',
  collectionMethod: 'REAL_TIME',
  aggregations: [
    {
      outputMetricId: 'orders_shipped_daily',
      inputMetricId: 'orders_shipped_count',
      aggregation: 'COUNT',
      period: 'DAY',
      dimensions: ['division', 'location']
    },
    {
      outputMetricId: 'orders_shipped_weekly',
      inputMetricId: 'orders_shipped_daily',
      aggregation: 'SUM',
      period: 'WEEK',
      dimensions: ['division']
    }
  ]
};
```

---

## 5. DASHBOARD CONCEPTS

### 5.1 Executive Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ EXECUTIVE DASHBOARD                               Friday, Jan 17, 2026     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐│
│  │ REVENUE MTD     │ │ GROSS MARGIN    │ │ ON-TIME DELIVERY│ │ INV TURNS      ││
│  │                 │ │                 │ │                 │ │                ││
│  │  $2.84M         │ │  23.4%          │ │  94.8%          │ │  4.8×          ││
│  │  ▲ 8.2% vs LY   │ │  ● On Target    │ │  ○ Below 95%    │ │  ○ Below 5.0×  ││
│  │  ▲ 2.1% vs Bud  │ │  △ +0.3% vs LY  │ │  △ +1.2% vs LY  │ │  △ +0.2× vs LY ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────────┘│
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  REVENUE BY DIVISION                           MARGIN BY DIVISION               │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │                                   │  │                                   │  │
│  │  Steel ████████████████░░ $1.42M  │  │  Steel     22.1%  ●●●●●●●●●●●○○  │  │
│  │  Alum  ████████░░░░░░░░░░ $0.68M  │  │  Aluminum  25.8%  ●●●●●●●●●●●●●  │  │
│  │  Plast ████░░░░░░░░░░░░░░ $0.32M  │  │  Plastics  28.3%  ●●●●●●●●●●●●●● │  │
│  │  Suppl ███░░░░░░░░░░░░░░░ $0.42M  │  │  Supplies  18.9%  ●●●●●●●●○○○○○  │  │
│  │                                   │  │                                   │  │
│  │  Target: $3.15M  ─────────────│── │  │  Target: 22%  ────────────│───── │  │
│  │                               ▲   │  │                           ▲      │  │
│  └───────────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  12-MONTH TREND                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ $3.2M│                                                      ●           │   │
│  │ $3.0M│                      ●   ●   ●   ●   ●   ●   ●   ●               │   │
│  │ $2.8M│ ─●───●───●───●───●───────────────────────────────────────────── │   │
│  │ $2.6M│                                                                   │   │
│  │      └───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬──                │   │
│  │         Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec Jan                 │   │
│  │                                                                          │   │
│  │  ───── Revenue    ─ ─ ─ Budget    ▪▪▪▪▪ Prior Year                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  ALERTS & ACTIONS                                                               │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ⚠️ OTD below target for 3 consecutive days (Houston location)                 │
│  ⚠️ Aluminum inventory turns declining - now 4.5× (target 5.0×)                │
│  ✓ Steel margin improved +0.8% this week                                        │
│  ℹ️ 3 pricing approvals awaiting Division Manager review                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Operations Manager Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ OPERATIONS DASHBOARD                      Houston │ Today: Jan 17, 2026    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  SHIFT STATUS: Day Shift (6:00 AM - 2:30 PM)            Time: 10:45 AM         │
│                                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ JOBS DUE TODAY│ │ OTD (TODAY)   │ │ MACHINE UTIL  │ │ SCRAP (TODAY) │       │
│  │               │ │               │ │               │ │               │       │
│  │    47         │ │   96.2%       │ │   72.4%       │ │   2.8%        │       │
│  │ ██████████░░  │ │   ●           │ │   ○           │ │   ●           │       │
│  │ 38 done │ 9   │ │ 25/26 shipped │ │ Target: 75%   │ │ Target: <5%   │       │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  WORK CENTER STATUS                                                             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Work Center    │ Status │ Current Job │ Queue │ Util │ Operator        │   │
│  │ ───────────────│────────│─────────────│───────│──────│──────────────── │   │
│  │ SAW-01 (Horz)  │ 🟢 RUN │ J-12456     │ 5     │ 78%  │ M. Johnson      │   │
│  │ SAW-02 (Vert)  │ 🟡 IDLE│ -           │ 3     │ 62%  │ R. Garcia       │   │
│  │ SAW-03 (Plate) │ 🟢 RUN │ J-12448     │ 8     │ 81%  │ T. Williams     │   │
│  │ PLASMA-01      │ 🟢 RUN │ J-12461     │ 4     │ 69%  │ S. Chen         │   │
│  │ LASER-01       │ 🔴 DOWN│ Maint       │ 6     │ 45%  │ (awaiting)      │   │
│  │ SHEAR-01       │ 🟢 RUN │ J-12459     │ 2     │ 74%  │ A. Patel        │   │
│  │ DRILL-01       │ 🟡 SETUP│ J-12463    │ 3     │ 58%  │ J. Smith        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  AT-RISK JOBS (Due Today, Not Yet Started)                                      │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ J-12472 │ ABC Mfg        │ Due 2:00 PM │ Saw+Drill │ Est: 45 min    │   │
│  │ ⚠️ J-12475 │ XYZ Fabricators│ Due 1:30 PM │ Plasma    │ Est: 30 min    │   │
│  │ ⚠️ J-12478 │ DEF Industries │ Due 3:00 PM │ Laser     │ Est: 60 min ❌ │   │
│  │    (LASER-01 down - job at risk, need reroute decision)                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  THROUGHPUT (TODAY)                        CYCLE TIME TREND (7-DAY)             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐   │
│  │                         │    │                                         │   │
│  │  Jobs:    38 / 47       │    │  Avg Order-to-Ship:                     │   │
│  │           ████████░░    │    │  1.8 days │                             │   │
│  │                         │    │           │  ●   ●   ●                  │   │
│  │  Tons:    24.6 / 35     │    │  1.5 days │●───●───●───●───●           │   │
│  │           ███████░░░    │    │           │                    ●   ●   │   │
│  │                         │    │  1.2 days │                         ●  │   │
│  │  Lines:   89 / 112      │    │           └─────────────────────────── │   │
│  │           ████████░░    │    │           Mon Tue Wed Thu Fri Sat Sun  │   │
│  │                         │    │                                         │   │
│  └─────────────────────────┘    └─────────────────────────────────────────┘   │
│                                                                                 │
│  [View Full Queue] [Work Center Detail] [Job Scheduler] [Exception Report]      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Sales Manager Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ SALES DASHBOARD                            Steel Division │ January 2026   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ REVENUE MTD   │ │ PIPELINE      │ │ QUOTE→ORDER   │ │ AVG ORDER $   │       │
│  │               │ │               │ │               │ │               │       │
│  │  $1.42M       │ │  $892K        │ │   38.2%       │ │  $2,847       │       │
│  │  ▲ +6.8% YoY  │ │  42 quotes    │ │   ● On Target │ │  ▲ +$124 YoY  │       │
│  │  87% to goal  │ │  ▲ +$125K WoW │ │   vs 35% tgt  │ │               │       │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  SALES REP PERFORMANCE                                                          │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Rep           │ Revenue MTD │ % Goal │ Margin │ Q→O % │ Quotes Open   │   │
│  │ ──────────────│─────────────│────────│────────│───────│────────────── │   │
│  │ J. Anderson   │ $412,500    │ 103%   │ 24.2%  │ 42%   │ 8 ($124K)     │   │
│  │ M. Thompson   │ $389,200    │ 97%    │ 22.8%  │ 36%   │ 12 ($198K)    │   │
│  │ S. Williams   │ $324,800    │ 81%    │ 23.1%  │ 41%   │ 6 ($87K)      │   │
│  │ R. Martinez   │ $298,100    │ 75%    │ 21.4%  │ 32%   │ 14 ($245K)    │   │
│  │ K. Johnson    │ N/A (new)   │ -      │ -      │ -     │ 2 ($38K)      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  TOP CUSTOMERS BY MARGIN                       QUOTE PIPELINE AGING             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐   │
│  │ Customer      │ Rev  │ Marg │    │                                     │   │
│  │ ──────────────│──────│───── │    │  < 3 days:  ██████████████  $412K  │   │
│  │ ABC Mfg       │ $89K │ 28.4%│    │  3-7 days:  ████████       $289K  │   │
│  │ XYZ Fab       │ $67K │ 26.2%│    │  7-14 days: ████           $124K  │   │
│  │ DEF Ind       │ $54K │ 25.8%│    │  > 14 days: ██             $67K   │   │
│  │ GHI Steel     │ $48K │ 24.1%│    │                                     │   │
│  │ JKL Machining │ $42K │ 23.9%│    │  ⚠️ 4 quotes > 14 days need follow-up│   │
│  └─────────────────────────────┘    └─────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  LOST QUOTE ANALYSIS (Last 30 Days)                                             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Price Too High    ████████████████████████  42% ($187K lost)          │   │
│  │  Lead Time         ████████████              24% ($107K lost)          │   │
│  │  Lost to Competitor██████████                20% ($89K lost)           │   │
│  │  Spec Not Met      ████                      8% ($36K lost)            │   │
│  │  No Response       ███                       6% ($27K lost)            │   │
│  │                                                                         │   │
│  │  [View Lost Quote Details]                                              │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [New Quote] [Pipeline Report] [Customer Analysis] [Territory Map]              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Supervisor / Shop Floor Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ SHOP FLOOR DASHBOARD - SAW AREA           Houston │ Shift: Day │ 10:45 AM │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  SHIFT PROGRESS                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  6:00 AM ─────────────────────────────────▲──────────────────── 2:30 PM│   │
│  │                                         10:45                           │   │
│  │  Shift Progress: 56%    Time Remaining: 3h 45m                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ JOBS DONE     │ │ YIELD TODAY   │ │ SCRAP TODAY   │ │ FIRST-PASS    │       │
│  │               │ │               │ │               │ │               │       │
│  │    12 / 18    │ │   93.2%       │ │   2.4%        │ │   100%        │       │
│  │  ████████████░│ │   ●           │ │   ●           │ │   ●           │       │
│  │  On pace      │ │ Target: 92%   │ │ Target: <5%   │ │ Target: 97%   │       │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  WORK CENTER STATUS                                                             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌───────────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ SAW-01 (HORIZONTAL)       🟢 RUNNING  │  │ SAW-02 (VERTICAL)    🟡 IDLE  │  │
│  │ ─────────────────────────────────────│  │ ─────────────────────────────│  │
│  │ Operator: M. Johnson                 │  │ Operator: R. Garcia          │  │
│  │ Job: J-12456 (ABC Manufacturing)     │  │ Job: Awaiting material       │  │
│  │ Material: 4140 Round 4.00" × 144"    │  │                               │  │
│  │ Progress: 18/24 pieces               │  │ Last Job: J-12452            │  │
│  │ ████████████████████████░░░░░░░░     │  │ Completed: 10:32 AM          │  │
│  │ Est Complete: 11:15 AM               │  │                               │  │
│  │                                       │  │ Queue: 3 jobs (1.5 hrs)      │  │
│  │ Queue: 5 jobs (3.2 hrs)              │  │                               │  │
│  └───────────────────────────────────────┘  └───────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ SAW-03 (PLATE SAW)        🟢 RUNNING  │  │ SAW AREA QUEUE              │  │
│  │ ─────────────────────────────────────│  │ ─────────────────────────────│  │
│  │ Operator: T. Williams                 │  │                               │  │
│  │ Job: J-12448 (XYZ Fabricators)       │  │ Total Jobs: 16                │  │
│  │ Material: A36 Plate 1.00" × 48×96   │  │ Est Hours: 6.8 hrs            │  │
│  │ Progress: Cut 3/8 pieces             │  │                               │  │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░    │  │ 🔴 Rush: 2                    │  │
│  │ Est Complete: 11:45 AM               │  │ 🟡 Due Today: 8               │  │
│  │                                       │  │ 🟢 Standard: 6                │  │
│  │ Queue: 8 jobs (4.1 hrs)              │  │                               │  │
│  └───────────────────────────────────────┘  └───────────────────────────────┘  │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  OPERATOR PERFORMANCE (TODAY)                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Operator      │ Jobs │ Pieces │ Yield │ Scrap │ Avg Cycle │ Efficiency │   │
│  │ ──────────────│──────│────────│───────│───────│───────────│─────────── │   │
│  │ M. Johnson    │  4   │   62   │ 94.1% │ 1.8%  │ 12.4 min  │    105%    │   │
│  │ T. Williams   │  3   │   24   │ 92.8% │ 2.2%  │ 18.6 min  │     98%    │   │
│  │ R. Garcia     │  5   │   45   │ 93.5% │ 3.1%  │  8.2 min  │    102%    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [View All Jobs] [Reassign Work] [Report Issue] [End-of-Shift Summary]         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Inventory Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ INVENTORY DASHBOARD                       All Divisions │ January 2026     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │
│  │ TOTAL VALUE   │ │ TURNS (12-MO) │ │ DAYS ON HAND  │ │ GMROI         │       │
│  │               │ │               │ │               │ │               │       │
│  │  $4.59M       │ │   4.8×        │ │   76 days     │ │   2.42        │       │
│  │  ▼ -$120K MoM │ │   ○ Below 5×  │ │   ● On Target │ │   ○ Below 2.5 │       │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  INVENTORY BY DIVISION                         INVENTORY AGING                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐   │
│  │ Division   │ Value  │ Turns │    │                                     │   │
│  │ ───────────│────────│───────│    │  < 30 days:  ██████████████ $2.12M │   │
│  │ Steel      │ $2.45M │ 5.0×  │    │  30-60 days: ████████      $1.24M │   │
│  │ Aluminum   │ $1.18M │ 4.5×  │    │  60-90 days: █████         $0.72M │   │
│  │ Plastics   │ $0.62M │ 3.6×  │    │  90-180 days:███           $0.38M │   │
│  │ Supplies   │ $0.34M │ 6.0×  │    │  > 180 days: █             $0.13M │   │
│  │ ───────────│────────│───────│    │                                     │   │
│  │ TOTAL      │ $4.59M │ 4.8×  │    │  ⚠️ $0.51M aged > 90 days (11.1%) │   │
│  └─────────────────────────────┘    └─────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  STOCK STATUS                                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  In Stock          ████████████████████████████████████████████  92.4% │   │
│  │  Low Stock         ████                                           4.8% │   │
│  │  Out of Stock      ██                                             1.9% │   │
│  │  Overstock         █                                              0.9% │   │
│  │                                                                         │   │
│  │  Total Active SKUs: 2,847                                               │   │
│  │  Stock-Outs Today: 12 items    [View List]                             │   │
│  │  Below Safety Stock: 28 items  [View List]                             │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  REMNANT INVENTORY                             SLOW MOVERS (TOP 10)             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐   │
│  │                             │    │ Item           │ Days │ Value      │   │
│  │  Total Remnants: 342 pcs    │    │ ───────────────│──────│─────────── │   │
│  │  Total Value:    $187,450   │    │ 304SS 0.25×48  │ 245  │ $12,450    │   │
│  │  % of Inventory: 4.1%       │    │ 7075 Plate 1"  │ 198  │ $8,920     │   │
│  │                             │    │ Nylon 66 Rod   │ 187  │ $4,210     │   │
│  │  Age Distribution:          │    │ 4140 Round 6"  │ 176  │ $6,840     │   │
│  │  < 30 days:   ████ 35%     │    │ A36 Plate 2"   │ 165  │ $5,120     │   │
│  │  30-90 days:  ████ 38%     │    │                                     │   │
│  │  > 90 days:   ███  27%     │    │  [View Full Slow Mover Report]     │   │
│  │                             │    │                                     │   │
│  └─────────────────────────────┘    └─────────────────────────────────────┘   │
│                                                                                 │
│  [Inventory Count] [Reorder Report] [Transfer Request] [Write-Off Review]       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. ALERTING & THRESHOLDS

### 6.1 Alert Configuration

```typescript
interface AlertRule {
  ruleId: string;
  name: string;
  kpiId: string;
  
  // Trigger conditions
  condition: {
    comparison: 'LT' | 'GT' | 'EQ' | 'NE' | 'LTE' | 'GTE';
    threshold: number;
    duration?: number;               // Minutes threshold must be breached
    consecutivePeriods?: number;     // Number of consecutive periods
  };
  
  // Severity
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  
  // Notification
  notifyRoles: string[];
  notifyUsers?: string[];
  channels: ('IN_APP' | 'EMAIL' | 'SMS' | 'SLACK')[];
  
  // Frequency
  frequency: 'IMMEDIATE' | 'HOURLY_DIGEST' | 'DAILY_DIGEST';
  cooldownMinutes: number;           // Min time between repeat alerts
  
  // Auto-actions
  autoActions?: {
    action: string;
    parameters: Record<string, any>;
  }[];
}

// Example alert rules
const alertRules: AlertRule[] = [
  {
    ruleId: 'OTD_BELOW_TARGET',
    name: 'OTD Below Target',
    kpiId: 'SLA-01',
    condition: {
      comparison: 'LT',
      threshold: 95,
      consecutivePeriods: 3          // 3 consecutive days
    },
    severity: 'WARNING',
    notifyRoles: ['OPS_MGR', 'LOC_MGR'],
    channels: ['IN_APP', 'EMAIL'],
    frequency: 'DAILY_DIGEST',
    cooldownMinutes: 1440            // Once per day
  },
  {
    ruleId: 'MACHINE_DOWN',
    name: 'Machine Down Alert',
    kpiId: 'UTL-01',
    condition: {
      comparison: 'EQ',
      threshold: 0,
      duration: 30                   // Down for 30+ minutes
    },
    severity: 'CRITICAL',
    notifyRoles: ['SUPERVISOR', 'OPS_MGR'],
    channels: ['IN_APP', 'SMS'],
    frequency: 'IMMEDIATE',
    cooldownMinutes: 60
  },
  {
    ruleId: 'MARGIN_EROSION',
    name: 'Margin Below Floor',
    kpiId: 'MGN-01',
    condition: {
      comparison: 'LT',
      threshold: 18,
      consecutivePeriods: 5          // 5 consecutive days
    },
    severity: 'CRITICAL',
    notifyRoles: ['SALES_MGR', 'DIV_MGR'],
    channels: ['IN_APP', 'EMAIL'],
    frequency: 'DAILY_DIGEST',
    cooldownMinutes: 1440
  }
];
```

### 6.2 Alert Priority Matrix

| Severity | Examples | Response Time | Notification |
|----------|----------|---------------|--------------|
| **CRITICAL** | Machine down, OTD <90%, Margin <10% | Immediate | SMS + In-App + Email |
| **WARNING** | OTD <95%, Queue backup, Stock-out | < 4 hours | In-App + Email |
| **INFO** | Trends, achievements, daily summaries | Daily | In-App only |

---

## 7. REPORTING FRAMEWORK

### 7.1 Standard Reports

| Report | Frequency | Recipients | Format | Automation |
|--------|-----------|------------|--------|------------|
| Executive Summary | Weekly/Monthly | Owner, Div Mgr | PDF | Scheduled |
| OTD Performance | Daily | Ops Mgr, Loc Mgr | Dashboard | Real-time |
| Sales Pipeline | Weekly | Sales Mgr, Reps | Dashboard/PDF | Scheduled |
| Margin Analysis | Weekly | Sales Mgr, Finance | Excel/PDF | Scheduled |
| Inventory Status | Weekly | Ops Mgr, Purchasing | Dashboard/Excel | Scheduled |
| Production Summary | Daily | Ops Mgr, Supervisors | Dashboard | Real-time |
| Scrap/Yield | Daily | Ops Mgr, QC Mgr | Dashboard | Real-time |
| Customer Profitability | Monthly | Sales Mgr, Finance | Excel | Scheduled |
| Slow Mover | Weekly | Purchasing, Sales | Excel | Scheduled |
| Operator Performance | Weekly | Supervisors | PDF | Scheduled |

### 7.2 Ad-Hoc Analysis Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ANALYTICS SELF-SERVICE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DIMENSIONS (Group By):                                                         │
│  ───────────────────────────────────────────────────────────────────────────── │
│  • Time: Day, Week, Month, Quarter, Year                                        │
│  • Organization: Company, Division, Location, Work Center                       │
│  • Customer: Customer, Customer Tier, Territory, Sales Rep                     │
│  • Product: Division, Category, Material Type, Grade                           │
│  • Order: Order Type, Priority, Ship Method                                     │
│                                                                                 │
│  MEASURES (Aggregate):                                                          │
│  ───────────────────────────────────────────────────────────────────────────── │
│  • Revenue: Total, By Line, Material, Processing                               │
│  • Cost: Material, Labor, Overhead, Total                                       │
│  • Margin: Gross $, Gross %, Net                                               │
│  • Volume: Orders, Lines, Weight (Tons/Lbs), Pieces                            │
│  • Time: Cycle Time, Lead Time, Queue Time                                     │
│  • Quality: Yield %, Scrap %, First-Pass %                                     │
│                                                                                 │
│  FILTERS:                                                                       │
│  ───────────────────────────────────────────────────────────────────────────── │
│  • Date Range                                                                   │
│  • Division(s)                                                                  │
│  • Location(s)                                                                  │
│  • Customer(s)                                                                  │
│  • Product Category                                                            │
│  • Order Type                                                                   │
│  • Include/Exclude Remnants                                                     │
│                                                                                 │
│  OUTPUTS:                                                                       │
│  ───────────────────────────────────────────────────────────────────────────── │
│  • Interactive Dashboard                                                        │
│  • Export to Excel                                                             │
│  • Export to PDF                                                               │
│  • Save as Report Template                                                     │
│  • Schedule Delivery                                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. DATA ARCHITECTURE

### 8.1 Analytics Data Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS DATA ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     OPERATIONAL SYSTEMS                                 │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Orders  │ │Inventory│ │Shop Flr │ │Shipping │ │ Billing │           │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │   │
│  │       │           │           │           │           │                 │   │
│  └───────┼───────────┼───────────┼───────────┼───────────┼─────────────────┘   │
│          │           │           │           │           │                     │
│          ▼           ▼           ▼           ▼           ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     EVENT STREAMING (Kafka/EventHub)                    │   │
│  │  • Order events  • Inventory events  • Job events  • Shipment events   │   │
│  └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                    │                                           │
│          ┌─────────────────────────┼─────────────────────────┐                 │
│          ▼                         ▼                         ▼                 │
│  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐          │
│  │  RAW EVENTS   │        │ AGGREGATIONS  │        │  DIMENSIONS   │          │
│  │  (Data Lake)  │        │  (Time-based) │        │  (Lookup)     │          │
│  ├───────────────┤        ├───────────────┤        ├───────────────┤          │
│  │ • All events  │        │ • Hourly agg  │        │ • Customers   │          │
│  │ • Full detail │        │ • Daily agg   │        │ • Products    │          │
│  │ • Historical  │        │ • Weekly agg  │        │ • Locations   │          │
│  │               │        │ • Monthly agg │        │ • Work Ctrs   │          │
│  └───────────────┘        └───────────────┘        └───────────────┘          │
│          │                         │                         │                 │
│          └─────────────────────────┼─────────────────────────┘                 │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         ANALYTICS DATA MART                             │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │   │
│  │  │                         FACT TABLES                               │ │   │
│  │  │  • fact_orders (order lines, revenue, cost, margin)              │ │   │
│  │  │  • fact_shipments (shipments, OTD, weights)                      │ │   │
│  │  │  • fact_production (jobs, yield, scrap, time)                    │ │   │
│  │  │  • fact_inventory (daily snapshots, movements)                   │ │   │
│  │  │  • fact_quotes (quotes, conversions, lost reasons)               │ │   │
│  │  └───────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      VISUALIZATION LAYER                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
│  │  │ Dashboards  │ │  Reports    │ │   Alerts    │ │   Exports   │       │   │
│  │  │ (Real-time) │ │ (Scheduled) │ │ (Triggered) │ │ (On-demand) │       │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 KPI Calculation Engine

```typescript
interface KPICalculationEngine {
  // Real-time calculations
  calculateRealtime(kpiId: string, context: Context): Promise<KPIValue>;
  
  // Batch aggregations
  aggregateDaily(kpiId: string, date: Date): Promise<void>;
  aggregateWeekly(kpiId: string, weekStart: Date): Promise<void>;
  aggregateMonthly(kpiId: string, month: Date): Promise<void>;
  
  // Query interface
  getKPIValue(kpiId: string, period: DateRange, dimensions: Dimension[]): Promise<KPIValue[]>;
  getKPITrend(kpiId: string, periods: number, granularity: Granularity): Promise<TrendData[]>;
  
  // Comparisons
  compareKPI(kpiId: string, period1: DateRange, period2: DateRange): Promise<Comparison>;
}

// Example: OTD calculation
async function calculateOTD(period: DateRange, dimensions: Dimension[]): Promise<KPIValue> {
  const query = `
    SELECT 
      COUNT(CASE WHEN ship_date <= due_date THEN 1 END) as on_time,
      COUNT(*) as total,
      ROUND(COUNT(CASE WHEN ship_date <= due_date THEN 1 END) * 100.0 / COUNT(*), 1) as otd_percent
    FROM fact_shipments
    WHERE ship_date BETWEEN $1 AND $2
    ${buildDimensionFilters(dimensions)}
  `;
  
  const result = await db.query(query, [period.start, period.end]);
  
  return {
    kpiId: 'SLA-01',
    periodType: determinePeriodType(period),
    periodStart: period.start,
    periodEnd: period.end,
    value: result.otd_percent,
    numerator: result.on_time,
    denominator: result.total,
    status: determineStatus(result.otd_percent, KPI_TARGETS['SLA-01']),
    ...dimensions
  };
}
```

---

## 9. IMPLEMENTATION GUIDELINES

### 9.1 Phase 1 KPIs (MVP)

| Priority | KPI | Rationale |
|:--------:|-----|-----------|
| 1 | SLA-01: On-Time Delivery | Core customer promise |
| 1 | TPT-01: Daily Tons Shipped | Primary throughput measure |
| 1 | MGN-01: Gross Margin % | Profitability baseline |
| 1 | INV-01: Inventory Turns | Working capital efficiency |
| 2 | SLS-01: Quote-to-Order | Sales pipeline health |
| 2 | UTL-01: Machine Utilization | Capacity visibility |
| 2 | YLD-01: Yield Rate | Operational efficiency |
| 2 | CYC-01: Order-to-Ship Time | Customer experience |
| 3 | TPT-06: Processing Queue | Bottleneck detection |
| 3 | INV-06: Stock-Out Rate | Customer service |

### 9.2 Data Collection Requirements

| KPI | Source Tables/Events | Calculation Timing |
|-----|---------------------|-------------------|
| OTD | Shipments, Orders | Real-time (on ship) |
| Tons Shipped | Shipments | Real-time (on ship) |
| Gross Margin | Order Lines, Job Costs | Daily batch |
| Inv Turns | Inventory Snapshots, Sales | Weekly batch |
| Quote-to-Order | Quotes, Orders | Daily batch |
| Machine Util | Job Time Events | Hourly |
| Yield | Job Completions | Real-time (on complete) |
| Cycle Time | Order Events, Ship Events | Real-time |

---

## 10. SUMMARY

### KPI Catalog Quick Reference

| Category | # KPIs | Key Metrics |
|----------|:------:|-------------|
| SLA/Delivery | 7 | OTD, Next-Day, Perfect Order |
| Throughput | 7 | Tons, Jobs, Lines, Queue |
| Utilization | 7 | Machine, Labor, Dock |
| Cycle Time | 7 | Order-Ship, Processing |
| Scrap/Yield | 7 | Yield %, Scrap %, First-Pass |
| Sales | 10 | Quote→Order, Pipeline, Growth |
| Margin | 9 | GM %, By Customer, By Job |
| Inventory | 10 | Turns, DOH, Accuracy |
| **TOTAL** | **64** | |

### Dashboard Summary

| Dashboard | Primary Users | Refresh Rate |
|-----------|--------------|--------------|
| Executive | Owner, Executives | Daily |
| Operations | Ops Mgr, Loc Mgr | Real-time |
| Sales | Sales Mgr, Reps | Hourly |
| Shop Floor | Supervisors, Operators | Real-time |
| Inventory | Purchasing, Ops | Hourly |

---

**End of Analytics & KPI Architecture Specification**
